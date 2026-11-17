/* =========================================================
  router.js — Navegación por hash de la web de E-Invoicing
  ┌─────────────────────────────────────────────────────┐
  │  Rutas:                                             │
  │   #                         portada                 │
  │   #versions #validator #aeat                        │
  │   #json  #xml  #ubl         vista de un formato     │
  │   #json/invoice-json[/<tab>[/<ancla>]]   ficha      │
  │                                                     │
  │  Compatibilidad: #invoice-json (ruta antigua) se    │
  │  redirige sola a #json/invoice-json.                │
  │                                                     │
  │  - Única fuente de verdad de la URL.                │
  │  - Una sola carga por ficha.                        │
  │  - Atrás / Adelante / Recargar coherentes.          │
  └─────────────────────────────────────────────────────┘
  Depende de (en tiempo de ejecución):
  - window.AppViews, findCardById, getCardsByFormat (app.js)
  - activateDetailTab / scrollToElementId / initScrollSpy (sidebar-navigation.js)
  ========================================================= */
(function () {
  'use strict';

  /* ── Estado ───────────────────────────────────────────── */
  let currentRoute = null;     // Última ruta procesada (string sin '#')
  let stableRoute = '';        // Última ruta "real" (no ancla) para restaurar la URL
  let currentCardId = null;    // Ficha renderizada actualmente en view-detail
  let renderToken = 0;         // Evita pintar resultados de navegaciones antiguas

  /* ── Rutas fijas (alias incluidos) ────────────────────── */
  const STATIC_ROUTES = {
    '': 'index',
    home: 'index',
    index: 'index',
    versions: 'versions',
    versiones: 'versions',
    validator: 'validator',
    validacion: 'validator',
    aeat: 'aeat'
  };

  /* ── Utilidades ───────────────────────────────────────── */
  function parseRoute(rawHash) {
    let clean = String(rawHash || '').replace(/^#\/?/, '').trim();
    try { clean = decodeURIComponent(clean); } catch (e) { /* hash mal codificado */ }
    return { raw: clean, segments: clean ? clean.split('/') : [] };
  }

  function findCard(id) {
    return id && typeof window.findCardById === 'function' ? window.findCardById(id) : null;
  }

  function getFormats() {
    return typeof window.getCardsByFormat === 'function' ? window.getCardsByFormat() : {};
  }

  function formatOf(card) {
    return String(card.format || '').toLowerCase();
  }

  /**
   * Construye una ruta. Si el primer valor es una ficha,
   * le antepone su formato:  buildRoute('invoice-json', 'estructura')
   *                       →  'json/invoice-json/estructura'
   */
  function buildRoute(view, tab, anchor) {
    const card = findCard(view);
    const base = card ? `${formatOf(card)}/${card.id}` : view;
    return [base, tab, anchor].filter(Boolean).join('/');
  }

  function getRoute() {
    return parseRoute(location.hash).raw;
  }

  function getActiveTab() {
    const btn = document.querySelector('#view-detail .tab-btn.active[data-tab]');
    return btn ? btn.dataset.tab : '';
  }

  /** Pestaña principal de la ficha: la primera .tab-btn de la vista detalle. */
  function getDefaultTab() {
    const btn = document.querySelector('#view-detail .tab-btn[data-tab]');
    return btn ? btn.dataset.tab : '';
  }

  /** Escribe la URL sin disparar el router. */
  function writeUrl(route, { replace = false } = {}) {
    const url = route ? `#${route}` : location.pathname + location.search;
    history[replace ? 'replaceState' : 'pushState'](null, '', url);
    currentRoute = route;
  }

  /* ── API pública de navegación ────────────────────────── */
  function navigate(route, { replace = false } = {}) {
    route = route || '';
    if (route !== getRoute()) {
      writeUrl(route, { replace });
    }
    return handleRoute({ force: true });
  }

  function refresh() {
    return handleRoute({ force: true, rerender: true });
  }

  /** Actualiza pestaña/ancla en la URL sin recargar ni crear historial. */
  function replaceAnchor(anchor, tab) {
    if (!currentCardId) return;
    writeUrl(buildRoute(currentCardId, tab || getActiveTab(), anchor), { replace: true });
    stableRoute = currentRoute;
  }

  /* ── Vistas ───────────────────────────────────────────── */
  async function showStatic(viewName) {
    const views = window.AppViews;
      currentCardId = null;
      renderToken++;
      const ok = await views[viewName]();
      if (ok === false) {
        console.warn(`[router] Vista "${viewName}" no disponible todavía.`);
        writeUrl('', { replace: true });
        await views.index();
      }
      stableRoute = currentRoute;
  }

  async function showFormat(fmtKey) {
      currentCardId = null;
      renderToken++;
    await window.AppViews.format(fmtKey);
      stableRoute = currentRoute;
    }

  async function showCard(card, tab, anchor, rerender) {
      const needsRender = rerender || card.id !== currentCardId;
      if (needsRender) {
        const token = ++renderToken;
        currentCardId = card.id;
      await window.AppViews.card(card);
        if (token !== renderToken) return;   // Ha empezado otra navegación
      }
    // Sin pestaña en la URL → pestaña principal
    const activeTab = tab || getDefaultTab();
    if (activeTab && typeof window.activateDetailTab === 'function') {
      window.activateDetailTab(activeTab);
      }
    if (anchor && typeof window.scrollToElementId === 'function') {
      window.scrollToElementId(anchor);
    } else if (!needsRender && !tab) {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
      if (typeof window.initScrollSpy === 'function') {
        window.initScrollSpy();
      }
      stableRoute = currentRoute;
  }

  /* ── Núcleo ───────────────────────────────────────────── */
  async function handleRoute({ force = false, rerender = false } = {}) {
    const route = parseRoute(location.hash);
    if (!force && route.raw === currentRoute) return;
    currentRoute = route.raw;

    if (!window.AppViews) {
      console.error('[router] AppViews no disponible. Revisa el orden de carga de app.js.');
      return;
    }
    const [first = '', second = '', third = '', fourth = ''] = route.segments;

    /* 1. Rutas fijas */
    if (route.segments.length <= 1 && Object.prototype.hasOwnProperty.call(STATIC_ROUTES, first)) {
      await showStatic(STATIC_ROUTES[first]);
      return;
    }

    /* 2. Formato (#json) o ficha dentro de un formato (#json/invoice-json/…) */
    const fmtKey = first.toUpperCase();
    if (getFormats()[fmtKey]) {
      if (!second) {
        await showFormat(fmtKey);
        return;
      }
      const card = findCard(second);
      if (card && !card.comingSoon && formatOf(card) === first.toLowerCase()) {
        await showCard(card, third, fourth, rerender);
        return;
      }
      // Ficha inexistente, inactiva o de otro formato → vista del formato
      writeUrl(first.toLowerCase(), { replace: true });
      await showFormat(fmtKey);
      return;
  }

    /* 3. Ruta antigua #invoice-json[/tab[/ancla]] → #json/invoice-json[/…] */
    const legacy = findCard(first);
    if (legacy && !legacy.comingSoon) {
      writeUrl(buildRoute(legacy.id, second, third), { replace: true });
      await showCard(legacy, second, third, rerender);
      return;
    }

    /* 4. Anclas internas (#documentation-section, #recursos-section…) */
    if (route.segments.length === 1 && document.getElementById(first)) {
      handleInPageAnchor(first);
      return;
    }

    /* 5. Ruta desconocida */
    console.warn(`[router] Ruta no encontrada: ${route.raw}`);
    currentCardId = null;
    writeUrl('', { replace: true });
    stableRoute = '';
    await window.AppViews.index();
}

  function handleInPageAnchor(id) {
    const el = document.getElementById(id);
    const indexView = document.getElementById('view-index');

    if (indexView && indexView.contains(el) && indexView.style.display === 'none') {
      currentCardId = null;
      window.AppViews.index({ scroll: false });
      stableRoute = '';
    }
    // El ancla no es una ruta: se restaura la URL anterior
    writeUrl(stableRoute, { replace: true });

    if (typeof window.scrollToElementId === 'function') {
      window.scrollToElementId(id);
    } else {
      el.scrollIntoView({ block: 'start' });
    }
  }

  /* ── Eventos ──────────────────────────────────────────── */
  function isModifiedClick(event) {
    return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
  }

  function targetRoute(target) {
    return target.dataset.route != null
      ? target.dataset.route
      : buildRoute(target.dataset.cardId);
  }

  function onDocumentClick(event) {
    if (event.defaultPrevented || isModifiedClick(event)) return;

    // Pestañas de la ficha → la pestaña queda en la URL
    const tabBtn = event.target.closest('#view-detail .tab-btn[data-tab]');
    if (tabBtn && currentCardId) {
      navigate(buildRoute(currentCardId, tabBtn.dataset.tab));
      return;
    }

    // Elementos navegables que NO son enlaces (los <a href="#…"> los gestiona el navegador)
    const target = event.target.closest('[data-route], [data-card-id]');
    if (!target || target.matches('a[href]')) return;

      event.preventDefault();
    navigate(targetRoute(target));
  }

  function onDocumentKeydown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const target = event.target.closest('[data-route], [data-card-id]');
    if (!target || target.matches('a[href], button, input, select, textarea')) return;

    event.preventDefault();
    navigate(targetRoute(target));
  }

  function initRouter() {
    window.addEventListener('hashchange', () => handleRoute());
    window.addEventListener('popstate', () => handleRoute());
    document.addEventListener('click', onDocumentClick);
    document.addEventListener('keydown', onDocumentKeydown);
    handleRoute({ force: true });
}

  /* ── Exposición global ────────────────────────────────── */
  window.Router = {
    navigate,
    refresh,
    replaceAnchor,
    buildRoute,
    getRoute,
    getActiveTab,
    getCurrentCardId: () => currentCardId
  };
window.initRouter = initRouter;
window.handleRoute = handleRoute;
  window.navigate = navigate;
})();
