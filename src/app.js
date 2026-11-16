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
const _VIEWS = ['view-index', 'view-detail', 'view-versions', 'view-validacion', 'view-respuestas', 'view-aeat'];
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
function renderGrid(sections) {
  const grid = document.getElementById('sectionGrid');
  if (!grid) return;
  let html = '';
  (sections || []).forEach((group) => {
      html += `
        <div class="folder-section">
        <h3>
          <span class="card-icon" style="margin-bottom:0;font-size:1.2rem">${esc(group.icon || '📦')}</span>
          ${esc(group.section || '')}
        </h3>
        <div class="file-grid">`;
    (group.cards || []).forEach((card) => {
        html += `
          <a class="card" href="#${esc(card.id)}" data-card-id="${esc(card.id)}">
            <div class="card-icon">${esc(card.icon || card.format || '')}</div>
            <div class="card-meta">
              <span class="badge badge-${esc(card.group)}">${esc(card.group || '')}</span>
              <span class="badge badge-cat">${esc(card.category || '')}</span>
              <span class="badge badge-${esc(card.format)}">${esc(card.format || '')}</span>
            </div>
            <h3>${esc(localizedSectionTitle(card))}</h3>
            <p>${esc(localizedSectionDesc(card))}</p>
            <span class="card-link">${esc(t('card.viewDoc'))}</span>
          </a>`;
  });
    html += `</div></div>`;
  });
  grid.innerHTML = html;
}

/* ── Inicialización ─────────────────────────────────────── */
function init() {
  applyStaticI18n();
  renderGrid(SITE_CONFIG.sections);
  const stat = document.getElementById('stat-sections');
  if (stat) stat.textContent = getAllCards().length;
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

document.addEventListener('DOMContentLoaded', init);
