/* =========================================================
  router.js — Navegación por hash de la web de E-Invoicing
  ┌─────────────────────────────────────────────────────┐
  │  Responsabilidad:                                   │
  │  - Única fuente de verdad de la URL.                │
  │  - Rutas: #, #versions, #validator, #aeat,          │
  │           #<cardId>[/<tab>[/<ancla>]]               │
  │  - Una sola carga por card (sin doble render).      │
  │  - Atrás / Adelante / Recargar coherentes.          │
  │  - Anclas internas (#bloques, #block-X, #enum-X).   │
  │  - Sin lógica de renderizado.                       │
  └─────────────────────────────────────────────────────┘
  Depende de (en tiempo de ejecución):
  - window.AppViews        (app.js)
  - window.findCardById    (app.js)
  - activateDetailTab / scrollToElementId / initScrollSpy (sidebar-navigation.js)
  ========================================================= */
(function () {
  'use strict';

  /* ── Estado ───────────────────────────────────────────── */
  let currentRoute = null;     // Última ruta procesada (string sin '#')
  let stableRoute = '';        // Última ruta "real" (no ancla) para restaurar la URL
  let currentCardId = null;    // Card renderizada actualmente en view-detail
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

  /* ── Utilidades de ruta ───────────────────────────────── */
  function parseRoute(rawHash) {
    let clean = String(rawHash || '').replace(/^#\/?/, '').trim();
    try { clean = decodeURIComponent(clean); } catch (e) { /* hash mal codificado: se usa tal cual */ }
    const [view = '', tab = '', anchor = ''] = clean.split('/');
    return { raw: clean, view, tab, anchor };
  }

  function buildRoute(view, tab, anchor) {
    return [view, tab, anchor].filter(Boolean).join('/');
  }

  function getRoute() {
    return parseRoute(location.hash).raw;
  }

  function getActiveTab() {
    const btn = document.querySelector('#view-detail .tab-btn.active[data-tab]');
    return btn ? btn.dataset.tab : '';
  }

  /** Escribe la URL sin disparar el router. */
  function writeUrl(route, { replace = false } = {}) {
    const url = route ? `#${route}` : location.pathname + location.search;
    history[replace ? 'replaceState' : 'pushState'](null, '', url);
    currentRoute = route;
  }

  /* ── API pública de navegación ────────────────────────── */

  /** Navega a una ruta (añade entrada al historial salvo replace:true). */
  function navigate(route, { replace = false } = {}) {
    route = route || '';
    if (route !== getRoute()) {
      writeUrl(route, { replace });
    }
    return handleRoute({ force: true });
  }

  /** Vuelve a pintar la vista actual (p. ej. al cambiar de idioma). */
  function refresh() {
    return handleRoute({ force: true, rerender: true });
  }

  /** Actualiza la pestaña/ancla en la URL sin recargar nada ni crear historial. */
  function replaceAnchor(anchor, tab) {
    if (!currentCardId) return;
    writeUrl(buildRoute(currentCardId, tab || getActiveTab(), anchor), { replace: true });
    stableRoute = currentRoute;
  }

  /* ── Núcleo ───────────────────────────────────────────── */
  async function handleRoute({ force = false, rerender = false } = {}) {
    const route = parseRoute(location.hash);
    if (!force && route.raw === currentRoute) return;
    currentRoute = route.raw;

    const views = window.AppViews;
    if (!views) {
      console.error('[router] AppViews no disponible. Revisa el orden de carga de app.js.');
      return;
    }

    /* 1. Rutas fijas */
    if (Object.prototype.hasOwnProperty.call(STATIC_ROUTES, route.view)) {
      const viewName = STATIC_ROUTES[route.view];
      currentCardId = null;
      renderToken++;
      const ok = await views[viewName]();
      if (ok === false) {
        console.warn(`[router] Vista "${viewName}" no disponible todavía.`);
        writeUrl('', { replace: true });
        await views.index();
      }
      stableRoute = currentRoute;
      return;
  }

    /* 2. Cards */
    const card = typeof window.findCardById === 'function'
      ? window.findCardById(route.view)
      : null;

    if (card) {
      const needsRender = rerender || card.id !== currentCardId;
      if (needsRender) {
        const token = ++renderToken;
        currentCardId = card.id;
        await views.card(card);
        if (token !== renderToken) return;   // Ha empezado otra navegación
      }
      if (route.tab && typeof window.activateDetailTab === 'function') {
        window.activateDetailTab(route.tab);
      }
      if (route.anchor && typeof window.scrollToElementId === 'function') {
        window.scrollToElementId(route.anchor);
      }
      if (typeof window.initScrollSpy === 'function') {
        window.initScrollSpy();
      }
      stableRoute = currentRoute;
      return;
    }

    /* 3. Anclas internas (#bloques, #block-X, #enum-X…) */
    if (!route.tab && route.raw && document.getElementById(route.raw)) {
      handleInPageAnchor(route.raw);
      return;
  }

    /* 4. Ruta desconocida */
    console.warn(`[router] Ruta no encontrada: ${route.raw}`);
    currentCardId = null;
    writeUrl('', { replace: true });
    stableRoute = '';
    await views.index();
}

  function handleInPageAnchor(id) {
    const el = document.getElementById(id);
    const indexView = document.getElementById('view-index');

    // Si el ancla está en la portada y la portada no se ve, se muestra primero
    if (indexView && indexView.contains(el) && indexView.style.display === 'none') {
      currentCardId = null;
      window.AppViews.index({ scroll: false });
      stableRoute = '';
    }

    // Se restaura la URL anterior: el ancla no es una ruta
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

  function onDocumentClick(event) {
    if (event.defaultPrevented || isModifiedClick(event)) return;

    // Pestañas de la vista detalle → la pestaña queda en la URL
    const tabBtn = event.target.closest('#view-detail .tab-btn[data-tab]');
    if (tabBtn && currentCardId) {
      navigate(buildRoute(currentCardId, tabBtn.dataset.tab));
      return;
    }

    // Elementos navegables que NO son enlaces (los <a href="#…"> los gestiona el navegador)
    const target = event.target.closest('[data-route], [data-card-id]');
    if (!target || target.matches('a[href]')) return;

      event.preventDefault();
    navigate(target.dataset.route != null ? target.dataset.route : target.dataset.cardId);
  }

  function onDocumentKeydown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const target = event.target.closest('[data-route], [data-card-id]');
    if (!target || target.matches('a[href], button, input, select, textarea')) return;

    event.preventDefault();
    navigate(target.dataset.route != null ? target.dataset.route : target.dataset.cardId);
  }

  function initRouter() {
    // hashchange y popstate pueden dispararse juntos: handleRoute deduplica por ruta
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
