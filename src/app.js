/* =========================================================
  app.js — Lógica principal de la web de E-Invoicing
  
  ESTRUCTURA GENERAL:
  ┌─────────────────────────────────────────────────────┐
  │  - Carga SITE_CONFIG.                               │
  │  - Inicializa router.                               │
  │  - Registra renderizadores.                         │
  │  - Inicializa eventos globales.                     │
  └─────────────────────────────────────────────────────┘
========================================================= */

/* ── Estado global ──────────────────────────────────────── */
const _VIEWS = ['view-index', 'view-detail', 'view-versions', 'view-validacion', 'view-respuestas'];
let _currentSection = null;   // Card actualmente abierta

/**FIXME QUITAR EN ALGUN MOMENTO */
let _schemaRaw      = '';     // Raw del schema principal (para descarga)
let _examples       = [];     // Array de ejemplos cargados (por índice)
let _respSchemas    = {};     // { [mid]: { name, raw, path } } para descargar schemas de Response
let _respSections   = {};     // { [mid]: { html, exId, exRaw, ... } }  — estado de cada tab de Response

/* ── Navegación entre vistas ────────────────────────────── */
function showView(id) {
  _VIEWS.forEach(v => {
    const el = document.getElementById(v);
    if (el) el.style.display = (v === id) ? 'block' : 'none';
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function showIndex()     { _currentSection = null; showView('view-index'); document.title = 'Generix · E-Invoicing · Developer Documentation'; }
function showDetail()    { showView('view-detail'); }
function showValidacion(){ showView('view-validacion'); setupValidator(); }
async function showVersions() {
  showView('view-versions');
  await window.VersionsRenderer.render();
}

/* ── Acceso a datos de configuración ────────────────────── */
function getSectionGroups() { return SITE_CONFIG.sections || []; }
function getAllCards() {
  return getSectionGroups().flatMap(group =>
    (group.cards || []).map(card => ({ ...card, sectionName: group.section }))
  );
}
function findCardById(id) { return getAllCards().find(card => card.id === id); }

/* ── Renderizado de la cuadrícula de cards ──────────────── */
function renderGrid(sections) {
  const grid = document.getElementById('sectionGrid');
  if (!grid) return;
  let html = '';
  
  sections.forEach(group => {
    const groupName = group.section || '';

      html += `
        <div class="folder-section">
        <h3>
          <span class="card-icon" style="margin-bottom:0;font-size:1.2rem">${esc(group.icon || '📦')}</span>
          ${esc(groupName)}
        </h3>
        <div class="file-grid">`;

      (group.cards || []).forEach(card => {
        html += `
          <div class="card" data-card-id="${esc(card.id)}">
            <div class="card-icon">${esc(card.icon || card.format || '')}</div>
            <div class="card-meta">
              <span class="badge badge-${esc(card.group)}">${esc(card.group || '')}</span>
              <span class="badge badge-cat">${esc(card.category || '')}</span>
              <span class="badge badge-${esc(card.format)}">${esc(card.format || '')}</span>
            </div>
            <h3>${esc(localizedSectionTitle(card))}</h3>
            <p>${esc(localizedSectionDesc(card))}</p>
            <span class="card-link">${t('card.viewDoc')}</span>
          </div>`;
  });
    html += `</div></div>`;
  });

  grid.innerHTML = html;
}

/* ── Inicialización ─────────────────────────────────────── */

/**
 * Punto de entrada. Se llama en DOMContentLoaded.
 * - Aplica i18n estático
 * - Renderiza la cuadrícula de cards
 * - Actualiza el contador de la hero section
 * - Muestra/oculta la card de Response según si hay cards de ese grupo
 */
function init() {
  applyStaticI18n();
  renderGrid(SITE_CONFIG.sections);

  const stat = document.getElementById('stat-sections');
  if (stat) stat.textContent = getAllCards().length;

  // La card especial "Respuestas" del índice solo se muestra si hay cards de grupo Response
  const respCard = document.getElementById('resp-card');
  if (respCard) respCard.style.display = getAllCards().some(s => s.group === 'Response') ? '' : 'none';
  
  initRouter();
  // showIndex();
}

/* ── i18n helpers para títulos de cards ─────────────────── */
function localizedSectionTitle(s) { return s['title_'  + LANG] || s.title_es  || s.title_en  || s.id; }
function localizedSectionDesc(s)  { return s['description_' + LANG] || s.description_es || s.description_en || ''; }

/* ── Apertura de una card ───────────────────────────────── */
async function openCard(cardId) {
  const card = findCardById(cardId);
  if (!card) {
      console.error(
          `[openCard] Card not found: ${cardId}`
      );
      return;
  }
  _currentSection = card;
  try {
    if (
      typeof RendererFactory === 'undefined'
    ) {
      throw new Error(
        'RendererFactory is not available'
      );
    }
    if (
      !RendererFactory.hasRenderer(card.group)
    ) {
      console.warn(
        `[openCard] No renderer registered for group "${card.group}"`
      );
      return;
    }
    const renderer =
      RendererFactory.create(card.group);
    await renderer.render({
      card
    });
    location.hash = card.id;
  } catch (error) {
    console.error(
      `[openCard] Error rendering "${card.id}"`,
      error
    );
    if (
      typeof showDetail === 'function'
    ) {
      showDetail();
    }
    const title =
      document.getElementById('detailTitle');
    const description =
      document.getElementById('detailDescription');
    const body =
      document.getElementById('desc-body');
    if (title) {
      title.textContent =
        'Renderer Error';
    }
    if (description) {
      description.textContent =
        error.message || '';
    }
    if (body) {
      body.innerHTML = `
        <div class="highlight-box">
          <strong>Error loading renderer</strong>
          <br>
          ${typeof esc === 'function'
            ? esc(error.message || '')
            : (error.message || '')
          }
        </div>
      `;
    }
  }
}


/* ── Exposición de funciones globales ───────────────────── */
window.showIndex = showIndex;
window.showDetail = showDetail;
window.showValidacion = showValidacion;
window.showVersions = showVersions;
window.getSectionGroups = getSectionGroups;
window.getAllCards = getAllCards;
window.findCardById = findCardById;
window.openCard = openCard;

document.addEventListener(
  'DOMContentLoaded',
  init
);