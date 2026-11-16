/* =========================================================
  sidebar-navigation.js
  ---------------------------------------------------------
  Navegación lateral y pestañas de la vista detalle.
  ┌─────────────────────────────────────────────────────┐
  │  - activateDetailTab(tab)   activa .tab-btn/.tab-panel│
  │  - scrollToBlock(id, btn)   menú lateral "Ir a"     │
  │  - goToEnum / goToBlock     enlaces 🔗 entre pestañas│
  │  - initScrollSpy()          marca el bloque visible │
  └─────────────────────────────────────────────────────┘
  Convención de pestañas (igual que BaseRenderer):
    botón  → .tab-btn[data-tab="<tab>"]
    panel  → .tab-panel#tab-<tab>
========================================================= */
(function () {
  'use strict';

  /* Nombres de pestaña usados por los enlaces 🔗.
     Si tus data-tab tienen otro valor, cámbialo SOLO aquí. */
  const TAB_STRUCTURE = 'estructura';
  const TAB_ENUMS = 'enumeraciones';

  const NAV_SELECTOR = '.snav-btn';
  const reduceMotion = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SCROLL_BEHAVIOR = reduceMotion ? 'auto' : 'smooth';

  let spyObserver = null;

  /* ── Pestañas ─────────────────────────────────────────── */
  function activateDetailTab(tab) {
    if (!tab) return false;
    tab = String(tab).replace(/^tab-/, '');

    const panel = document.getElementById(`tab-${tab}`);
    if (!panel) {
      console.warn(`[sidebar] Pestaña no encontrada: ${tab}`);
      return false;
    }

    document.querySelectorAll('.tab-btn[data-tab]').forEach((btn) => {
      const isActive = btn.dataset.tab === tab;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    document.querySelectorAll('.tab-panel').forEach((p) => {
      p.classList.toggle('active', p === panel);
    });

    initScrollSpy(panel);
    return true;
  }

  /* ── Scroll ───────────────────────────────────────────── */
  function scrollToElementId(id) {
    if (!id) return false;
    // Pequeña espera: la pestaña recién activada tiene que estar visible
    setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;
      el.scrollIntoView({ behavior: SCROLL_BEHAVIOR, block: 'start' });
      setActiveNav(findNavButton(id));
    }, 50);
    return true;
  }

  /* ── Botones del menú lateral ─────────────────────────── */
  function cssValue(value) {
    return window.CSS && CSS.escape ? CSS.escape(value) : String(value).replace(/"/g, '\\"');
  }

  /** Devuelve el id del bloque al que apunta un botón del menú. */
  function getNavTargetId(btn) {
    if (!btn) return '';
    if (btn.dataset.target) return btn.dataset.target;
    if (btn.dataset.block) return `block-${btn.dataset.block}`;
    if (btn.dataset.enum) return `enum-${btn.dataset.enum}`;
    const href = btn.getAttribute('href');
    if (href && href.startsWith('#') && href.length > 1) return href.slice(1);
    const onclick = btn.getAttribute('onclick') || '';
    const match = onclick.match(/scrollToBlock\(\s*['"]([^'"]+)['"]/);
    return match ? match[1] : '';
  }

  /** Busca el botón del menú que corresponde a un id de bloque. */
  function findNavButton(targetId) {
    if (!targetId) return null;
    const [, kind, name] = targetId.match(/^(block|enum)-(.+)$/) || [];
    const selectors = [`${NAV_SELECTOR}[data-target="${cssValue(targetId)}"]`];
    if (kind === 'enum') selectors.push(`${NAV_SELECTOR}[data-enum="${cssValue(name)}"]`);
    if (kind === 'block') selectors.push(`${NAV_SELECTOR}[data-block="${cssValue(name)}"]`);
    selectors.push(`${NAV_SELECTOR}[href="#${cssValue(targetId)}"]`);

    for (const sel of selectors) {
      const btn = document.querySelector(sel);
      if (btn) return btn;
    }
    // Último recurso: botones con onclick="scrollToBlock('id', this)"
    return Array.from(document.querySelectorAll(NAV_SELECTOR))
      .find((btn) => getNavTargetId(btn) === targetId) || null;
  }

  function setActiveNav(button) {
    if (!button) return;
    document.querySelectorAll(NAV_SELECTOR).forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
    // Mantiene visible el botón activo dentro del menú lateral
    button.scrollIntoView({ block: 'nearest' });
  }

  /** Llamado desde los botones del menú lateral (onclick="scrollToBlock('id', this)"). */
function scrollToBlock(blockId, button) {
  const block = document.getElementById(blockId);
    if (!block) return;
    block.scrollIntoView({ behavior: SCROLL_BEHAVIOR, block: 'start' });
    setActiveNav(button || findNavButton(blockId));
    if (window.Router) window.Router.replaceAnchor(blockId);
  }

  /* ── Enlaces 🔗 entre pestañas ────────────────────────── */
  function goToRef(kind, name) {
    if (!name) return;
    const tab = kind === 'enum' ? TAB_ENUMS : TAB_STRUCTURE;
    const targetId = `${kind === 'enum' ? 'enum' : 'block'}-${name}`;
    const cardId = window.Router && window.Router.getCurrentCardId();

    if (cardId) {
      // Entra en el historial: "Atrás" vuelve a donde estabas
      window.Router.navigate(window.Router.buildRoute(cardId, tab, targetId));
    return;
  }
    activateDetailTab(tab);
    scrollToElementId(targetId);
  }

  function goToEnum(enumName) { goToRef('enum', enumName); }
  function goToBlock(blockName) { goToRef('block', blockName); }

  /** Compatibilidad con llamadas antiguas a goToReference({ tab, targetId }). */
  function goToReference({ tab, targetId } = {}) {
    const cleanTab = String(tab || '').replace(/^tab-/, '');
    const cardId = window.Router && window.Router.getCurrentCardId();
    if (cardId) {
      window.Router.navigate(window.Router.buildRoute(cardId, cleanTab, targetId));
      return;
    }
    activateDetailTab(cleanTab);
    scrollToElementId(targetId);
  }

  /* ── Scroll-spy: marca en el menú el bloque visible ───── */
  function initScrollSpy(panel) {
    if (spyObserver) {
      spyObserver.disconnect();
      spyObserver = null;
    }
    if (!('IntersectionObserver' in window)) return;

    const scope = panel
      || document.querySelector('#view-detail .tab-panel.active')
      || document.getElementById('view-detail');
    if (!scope) return;

    const buttons = Array.from(scope.querySelectorAll(NAV_SELECTOR));
    const targets = buttons
      .map((btn) => document.getElementById(getNavTargetId(btn)))
      .filter(Boolean);
    if (!targets.length) return;

    spyObserver = new IntersectionObserver((entries) => {
      const visible = entries.find((entry) => entry.isIntersecting);
      if (visible) setActiveNav(findNavButton(visible.target.id));
    }, {
      rootMargin: '-120px 0px -60% 0px',
      threshold: 0
    });

    targets.forEach((el) => spyObserver.observe(el));
  }

  /* ── Exposición global ────────────────────────────────── */
  window.activateDetailTab = activateDetailTab;
  window.scrollToElementId = scrollToElementId;
  window.scrollToBlock = scrollToBlock;
  window.goToReference = goToReference;
  window.goToEnum = goToEnum;
  window.goToBlock = goToBlock;
  window.initScrollSpy = initScrollSpy;
})();
