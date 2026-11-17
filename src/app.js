/* =========================================================
  app.js — Lógica principal de la web de E-Invoicing
  
  ESTRUCTURA GENERAL:
  ┌─────────────────────────────────────────────────────┐
  │  - Carga SITE_CONFIG.                               │
  │  - Pinta la portada (grid de cards).                │
  │  - Define las vistas (AppViews) que usa el router.  │
  │  - Inicializa el router.                            │
  │                                                     │
  │  La URL la gestiona SOLO router.js.                 │
  │  Las funciones públicas (showIndex, openCard…)      │
  │  navegan; las de AppViews solo pintan.              │
  └─────────────────────────────────────────────────────┘
========================================================= */

/* ── Estado global ──────────────────────────────────────── */
// const _VIEWS = ['view-index', 'view-detail', 'view-versions', 'view-validacion', 'view-respuestas', 'view-aeat'];
const _VIEWS = ['view-index', 'view-format', 'view-detail', 'view-versions', 'view-validacion', 'view-respuestas', 'view-aeat'];
const _DEFAULT_TITLE = 'Generix · E-Invoicing · Developer Documentation';
let _currentSection = null;   // Card actualmente abierta

/** FIXME: se eliminan en la entrega 3 (renderers). Los renderers actuales aún las usan. */
let _schemaRaw = '';          // Raw del schema principal (para descarga)
let _examples = [];           // Array de ejemplos cargados (por índice)

/* ── Cambio de vista ────────────────────────────────────── */
function showView(id, { scroll = true } = {}) {
  _VIEWS.forEach((viewId) => {
    const el = document.getElementById(viewId);
    if (el) el.style.display = (viewId === id) ? 'block' : 'none';
  });
  if (scroll) window.scrollTo({ top: 0, behavior: 'auto' });
}

/* ── Vistas (solo pintan; las llama el router) ──────────── */
const AppViews = {
  index({ scroll = true } = {}) {
    _currentSection = null;
    showView('view-index', { scroll });
    document.title = _DEFAULT_TITLE;
    return true;
  },
    format(fmt) {
    _currentSection = null;
    showView('view-format');
    renderFormatView(fmt);
    return true;
  },

  async versions() {
    _currentSection = null;
  showView('view-versions');
    if (window.VersionsRenderer && typeof window.VersionsRenderer.render === 'function') {
  await window.VersionsRenderer.render();
}
    return true;
  },

  validator() {
    _currentSection = null;
    showView('view-validacion');
    if (typeof window.setupValidator === 'function') window.setupValidator();
    return true;
  },

  async aeat() {
    // La vista AEAT llega en la entrega 4. Mientras no exista, el router vuelve a la portada.
    if (!document.getElementById('view-aeat') || !window.AeatRenderer) return false;
    _currentSection = null;
    showView('view-aeat');
    await window.AeatRenderer.render();
    return true;
  },

  async card(card) {
    _currentSection = card;
    try {
      if (typeof RendererFactory === 'undefined') {
        throw new Error('RendererFactory is not available');
      }
      if (!RendererFactory.hasRenderer(card.group)) {
        throw new Error(`No renderer registered for group "${card.group}"`);
      }
      const renderer = RendererFactory.create(card.group);
      await renderer.render({ card });
    } catch (error) {
      console.error(`[openCard] Error rendering "${card.id}"`, error);
      renderCardError(error);
    }
    return true;
  }
};

function renderCardError(error) {
  showView('view-detail');
  const title = document.getElementById('detailTitle');
  const description = document.getElementById('detailDescription');
  const body = document.getElementById('desc-body');
  const message = error && error.message ? error.message : '';
  if (title) title.textContent = t('detail.errorLoad');
  if (description) description.textContent = message;
  if (body) {
    body.innerHTML = `
      <div class="highlight-box">
        <strong>${esc(t('detail.errorLoad'))}</strong><br>
        ${esc(message)}
      </div>`;
  }
}

/* ── Funciones públicas (navegan → actualizan la URL) ───── */
function showIndex()      { return window.Router ? Router.navigate('') : AppViews.index(); }
function showVersions()   { return window.Router ? Router.navigate('versions') : AppViews.versions(); }
function showValidacion() { return window.Router ? Router.navigate('validator') : AppViews.validator(); }
function showAeat()       { return window.Router ? Router.navigate('aeat') : AppViews.aeat(); }
function showDetail()     { showView('view-detail'); }   // Lo usa BaseRenderer: solo muestra la vista
function openCard(cardId) {
  if (window.Router) return Router.navigate(cardId);
  const card = findCardById(cardId);
  return card ? AppViews.card(card) : AppViews.index();
}
function getCurrentCard() { return _currentSection; }

/* ── Acceso a datos de configuración ────────────────────── */
function getSectionGroups() { return SITE_CONFIG.sections || []; }
function getAllCards() {
  return getSectionGroups().flatMap((group) =>
    (group.cards || []).map((card) => ({ ...card, sectionName: group.section }))
  );
}
function findCardById(id) { return getAllCards().find((card) => card.id === id); }

/* ── i18n helpers para títulos de cards ─────────────────── */
function localizedSectionTitle(s) { return s['title_' + LANG] || s.title_es || s.title_en || s.id; }
function localizedSectionDesc(s)  { return s['description_' + LANG] || s.description_es || s.description_en || ''; }

/* ── Cuadrícula de cards ────────────────────────────────── */
// function renderGrid(sections) {
//   const grid = document.getElementById('sectionGrid');
//   if (!grid) return;
//   const soonKey = t('card.comingSoon');
//   const soonLabel = soonKey && soonKey !== 'card.comingSoon'
//     ? soonKey
//     : (LANG === 'en' ? 'Coming soon' : 'Próximamente');

//   let html = '';
//   (sections || []).forEach((group) => {
//     html += `
//       <div class="folder-section">
//         <h3>
//           <span class="card-icon" style="margin-bottom:0;font-size:1.2rem">${esc(group.icon || '📦')}</span>
//           ${esc(group.section || '')}
//         </h3>
//         <div class="file-grid">`;
//     (group.cards || []).forEach((card) => {
//       const inner = `
//             <div class="card-icon">${esc(card.icon || card.format || '')}</div>
//             <div class="card-meta">
//               <span class="badge badge-${esc(card.group)}">${esc(card.group || '')}</span>
//               <span class="badge badge-cat">${esc(card.category || '')}</span>
//               <span class="badge badge-${esc(card.format)}">${esc(card.format || '')}</span>
//             </div>
//             <h3>${esc(localizedSectionTitle(card))}</h3>
//             <p>${esc(localizedSectionDesc(card))}</p>`;

//       html += card.comingSoon
//         ? `
//           <div class="card card--soon" aria-disabled="true" style="opacity:.55;cursor:default;">
//             ${inner}
//             <span class="card-link" style="color:var(--gray-500)">⏳ ${esc(soonLabel)}</span>
//           </div>`
//         : `
//           <a class="card" href="#${esc(card.id)}" data-card-id="${esc(card.id)}">
//             ${inner}
//             <span class="card-link">${esc(t('card.viewDoc'))}</span>
//           </a>`;
//     });
//     html += `</div></div>`;
//   });
//   grid.innerHTML = html;
// }
/* ── Portada: una card por tipo de mensaje con botones de formato ── */
// const GROUP_INFO = {
//   Invoice:  { icon: 'INV',  es: ['Factura',   'Estándar de factura electrónica: estructura, enumeraciones y ejemplos.'],
//                             en: ['Invoice',   'E-invoice standard: structure, enumerations and examples.'] },
//   Response: { icon: 'RESP', es: ['Respuesta', 'Respuestas y errores devueltos tras el envío.'],
//                             en: ['Response',  'Responses and errors returned after submission.'] },
//   Status:   { icon: 'STAT', es: ['Estados',   'Estados del ciclo de vida de la factura.'],
//                             en: ['Status',    'Invoice lifecycle statuses.'] }
// };
// function renderGrid() {
//   const grid = document.getElementById('sectionGrid');
//   if (!grid) return;
//   const soon = LANG === 'en' ? 'Coming soon' : 'Próximamente';

//   // Agrupa todas las cards por tipo de mensaje (Invoice, Response, Status)
//   const byGroup = {};
//   getAllCards().forEach((card) => {
//     (byGroup[card.group] = byGroup[card.group] || []).push(card);
//   });

//   const cards = Object.entries(byGroup).map(([group, items]) => {
//     const info = GROUP_INFO[group] || { icon: group.slice(0, 4).toUpperCase() };
//     const [title, desc] = (info[LANG] || info.es || [group, '']);
//     const firstOpen = items.find((c) => !c.comingSoon);

//     // data-card-id en cada botón: así el clic abre ESE formato, no el de la card
//     const chips = items.map((card) => card.comingSoon
//       ? `<span class="fmt-chip is-soon" title="${esc(soon)}">${esc(card.format)} ⏳</span>`
//       : `<a class="fmt-chip badge-${esc(card.format)}" href="#${esc(card.id)}" data-card-id="${esc(card.id)}">${esc(card.format)}</a>`
//     ).join('');

//     const open = firstOpen
//       ? `data-card-id="${esc(firstOpen.id)}" tabindex="0" role="link"`
//       : 'aria-disabled="true"';

//     return `
//       <div class="card msg-card" ${open}>
//         <div class="card-icon">${esc(info.icon)}</div>
//         <div class="card-meta"><span class="badge badge-${esc(group)}">${esc(group)}</span></div>
//         <h3>${esc(title)}</h3>
//         <p>${esc(desc)}</p>
//         <div class="fmt-chips">${chips}</div>
//       </div>`;
//   }).join('');

//   grid.innerHTML = `<div class="file-grid msg-grid">${cards}</div>`;

//   // Contador de la portada: ahora cuenta tipos de mensaje (3), no fichas (9)
//   const stat = document.getElementById('stat-sections');
//   if (stat) stat.textContent = Object.keys(byGroup).length;
// }

/* ── Portada por formato: JSON / XML / UBL ─────────────── */
const FORMAT_INFO = {
  JSON: { icon: '{ }',
          es: ['JSON', 'Estándares en formato JSON: factura, respuesta y estados.'],
          en: ['JSON', 'JSON standards: invoice, response and status.'] },
  XML:  { icon: '</>',
          es: ['XML', 'Estándares en formato XML (XSD): factura, respuesta y estados.'],
          en: ['XML', 'XML (XSD) standards: invoice, response and status.'] },
  UBL:  { icon: 'UBL',
          es: ['UBL', 'Estándares en formato UBL: factura, respuesta y estados.'],
          en: ['UBL', 'UBL standards: invoice, response and status.'] }
};

function formatText(fmt) {
  const info = FORMAT_INFO[fmt] || { icon: fmt };
  const [title, desc] = info[LANG] || info.es || [fmt, ''];
  return { icon: info.icon, title, desc };
}

/** { JSON: [cards], XML: [cards], UBL: [cards] } en el orden de config.js */
function getCardsByFormat() {
  const byFormat = {};
  getAllCards().forEach((card) => {
    const fmt = String(card.format || '').toUpperCase();
    (byFormat[fmt] = byFormat[fmt] || []).push(card);
  });
  return byFormat;
}

const soonLabel = () => (LANG === 'en' ? 'Coming soon' : 'Próximamente');

/** Card de un documento (Factura JSON, Respuesta XML…) */
function renderDocCard(card) {
  const inner = `
    <div class="card-icon">${esc(card.icon || card.format || '')}</div>
    <div class="card-meta">
      <span class="badge badge-${esc(card.group)}">${esc(card.group || '')}</span>
      <span class="badge badge-cat">${esc(card.category || '')}</span>
      <span class="badge badge-${esc(card.format)}">${esc(card.format || '')}</span>
    </div>
    <h3>${esc(localizedSectionTitle(card))}</h3>
    <p>${esc(localizedSectionDesc(card))}</p>`;
  return card.comingSoon
    ? `<div class="card is-soon" aria-disabled="true">${inner}
         <span class="card-link">⏳ ${esc(soonLabel())}</span></div>`
    : `<a class="card" href="#${esc(Router.buildRoute(card.id))}" data-card-id="${esc(card.id)}">${inner}
         <span class="card-link">${esc(t('card.viewDoc'))}</span></a>`;
}

/** Portada: una card por formato */
function renderGrid() {
  const grid = document.getElementById('sectionGrid');
  if (!grid) return;
  const byFormat = getCardsByFormat();

  const cards = Object.entries(byFormat).map(([fmt, items]) => {
    const { icon, title, desc } = formatText(fmt);
    const allSoon = items.every((c) => c.comingSoon);
        // Inactivos: gris con ⏳
    const groups = items.map((c) => c.comingSoon
      ? `<span class="badge badge-soon" title="${esc(soonLabel())}">${esc(c.group)} ⏳</span>`
      : `<span class="badge badge-${esc(c.group)}">${esc(c.group)}</span>`).join('');

    // Solo cuenta los activos, en singular o plural
    const active = items.filter((c) => !c.comingSoon).length;
    const docs = LANG === 'en'
      ? `View ${active} document${active === 1 ? '' : 's'}`
      : `Ver ${active} documento${active === 1 ? '' : 's'}`;
    const link = allSoon ? `⏳ ${esc(soonLabel())}` : esc(docs);
    const inner = `
      <div class="card-icon">${esc(icon)}</div>
      <div class="card-meta">${groups}</div>
      <h3>${esc(title)}</h3>
      <p>${esc(desc)}</p>
      <span class="card-link">${link}</span>`;
    return allSoon
      ? `<div class="card is-soon" aria-disabled="true">${inner}</div>`
      : `<a class="card" href="#${esc(fmt.toLowerCase())}" data-route="${esc(fmt.toLowerCase())}">${inner}</a>`;
  }).join('');

  grid.innerHTML = `<div class="file-grid">${cards}</div>`;

  // const stat = document.getElementById('stat-sections');
  // if (stat) stat.textContent = getAllCards().length;
    // Contador: activas / total
  const all = getAllCards();
  const activeCount = all.filter((c) => !c.comingSoon).length;
  const stat = document.getElementById('stat-sections');
  if (stat) stat.textContent = `${activeCount} / ${all.length}`;
}

/** Vista de un formato: sus 3 documentos */
function renderFormatView(fmt) {
  const items = getCardsByFormat()[fmt] || [];
  const { title, desc } = formatText(fmt);
  const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
  set('fmtCrumb', title);
  set('fmtTitle', title);
  set('fmtDesc', desc);
  const grid = document.getElementById('fmtGrid');
  if (grid) grid.innerHTML = items.map(renderDocCard).join('');
  document.title = `${title} · ${_DEFAULT_TITLE}`;
}

/* ── Inicialización ─────────────────────────────────────── */
function init() {
  applyStaticI18n();
  renderGrid(SITE_CONFIG.sections);
  if (document.getElementById('view-format')?.style.display === 'block' && window.Router) Router.refresh();
  // const stat = document.getElementById('stat-sections');
  // if (stat) stat.textContent = getAllCards().length;
  initRouter();
}

/* ── Exposición global ──────────────────────────────────── */
window.AppViews = AppViews;
window.showView = showView;
window.showIndex = showIndex;
window.showDetail = showDetail;
window.showValidacion = showValidacion;
window.showVersions = showVersions;
window.showAeat = showAeat;
window.openCard = openCard;
window.getCurrentCard = getCurrentCard;
window.getSectionGroups = getSectionGroups;
window.getAllCards = getAllCards;
window.findCardById = findCardById;
window.renderGrid = renderGrid;
window.localizedSectionTitle = localizedSectionTitle;
window.localizedSectionDesc = localizedSectionDesc;
window.getCardsByFormat = getCardsByFormat;

document.addEventListener('DOMContentLoaded', init);
