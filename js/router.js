/* =========================================================
   router.js - wrapper ligero para compatibilidad con hash
   ========================================================= */
function routeFromHash(){ return (location.hash || '').replace('#',''); }
function handleRoute(){
  const r = routeFromHash();
  if (!r) return;
  if (r === 'home') return showIndex();
  if (r === 'validator' || r === 'validacion') return showValidacion();
  if (r === 'versions') return showVersions();
  if (r === 'responses') return showRespuestas();
  const section = SITE_CONFIG.sections.find(s => s.id === r);
  if (section) return openEndpoint(section.id);
}
window.addEventListener('hashchange', handleRoute);
document.addEventListener('DOMContentLoaded', handleRoute);
