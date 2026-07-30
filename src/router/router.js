/* =========================================================
  router.js - wrapper ligero para compatibilidad con hash
  
  ESTRUCTURA GENERAL:
  ┌─────────────────────────────────────────────────────┐
  │  Responsabilidad:                                   │
  │  - Navegación por hash                              │
  │  - Apertura de cards                                │
  │  - Sin lógica de renderizado                        │
  └─────────────────────────────────────────────────────┘

  ========================================================= */

function getRoute() { return (location.hash || '').replace(/^#/, '');}
async function handleRoute() {
  const route = getRoute();
  if (!route) { showIndex(); return; }
  if (route === 'home' || route === 'index') {
    showIndex(); return;
  }
  if (route === 'validator' || route === 'validacion') {
    showValidacion(); return;
  }
  const card = findCardById(route);
  if (!card) {
    console.warn(`[router] Route not found: ${route}`);
    showIndex(); return;
  }
  await openCard(card.id);
}
function initRouter() {
  window.addEventListener(
    'hashchange',
    handleRoute
  );
  document.addEventListener(
    'click',
    async (event) => {
      const card = event.target.closest( '[data-card-id]' );
      if (!card) { return; }
      event.preventDefault();
      const cardId = card.dataset.cardId;
      if (!cardId) { return; }
      await openCard(cardId);
    }
  );
  handleRoute();
}

/* =========================================================
  Exposición global
========================================================= */

window.initRouter = initRouter;
window.handleRoute = handleRoute;