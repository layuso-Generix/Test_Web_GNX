/* =========================================================
   i18n.js - mismo patrón que web1
   ========================================================= */
const I18N_LANGS = ['es','en'];
const I18N_DEFAULT = SITE_CONFIG.defaultLanguage || 'es';
const I18N_LABELS = { es:'Español', en:'English' };
const I18N_FLAGS = { es:'Assets/flag-es.svg', en:'Assets/flag-en.svg' };

const I18N = {
 es: {
  'nav.contact':'Contactar',
  'hero.tagline':'Portal de Documentación para Desarrolladores','hero.title1':'Facturación electrónica B2B','hero.title2':'Spain e-Invoicing',
  'hero.subtitle':'Documentación técnica para los estándares JSON, XML, Respuestas, Estados y Documentación AEAT.',
  'hero.cta.docs':'Explorar documentación','hero.cta.validator':'Recursos',
  'stats.sections':'Secciones documentales','stats.format':'Formato de integración','stats.docu':'Documentación','stats.lang':'Multilenguaje',
  'home.eyebrow':'Centro de documentación · E-Invoicing','home.title':'Estándares y recursos de integración',
  'home.subtitle':'Selecciona una sección para consultar sus readmes, ejemplos, esquemas y documentación relacionada.',
  'res.history.badge':'Historial','res.history.title':'Versiones de esquemas','res.history.desc':'Consulta y descarga las distintas versiones publicadas de los esquemas.','res.history.link':'Ver versiones',
  'res.resp.badge':'Schema','res.resp.title':'Respuestas','res.resp.desc':'Estructura de las respuestas: campos, validaciones y ejemplo.','res.resp.link':'Ver respuestas',
  'res.val.badge':'Herramienta','res.val.title':'Validaciones','res.val.desc':'Valida tu fichero JSON contra el esquema seleccionado.','res.val.link':'Abrir validador',
  'res.aeat.badge':'Documentación','res.aeat.title':'Documentación AEAT','res.aeat.desc':'Documentación oficial relacionada con Crea y Crece.','res.aeat.link':'Abrir documentación',
  'crumb.docs':'Documentación','crumb.versions':'Versiones de esquemas','crumb.validation':'Validaciones','crumb.responses':'Respuestas',
  'tabs.desc':'Descripción General','tabs.struct':'Estructura','tabs.enums':'Enumeraciones','tabs.example':'Ejemplo',
  'sidebar.goto':'Ir a','example.title':'Ejemplos',
  'versions.h1':'Versiones de esquemas','versions.desc':'Listado de ficheros de versiones configurados para esta documentación.',
  'val.h1':'Validador de mensajes','val.desc':'Selecciona el tipo de mensaje, sube tu fichero JSON y valídalo contra el esquema disponible.','val.label':'Mensaje a validar',
  'val.dropzone.disabled':'Selecciona primero un mensaje, luego arrastra tu JSON o haz click','val.dropzone.enabled':'Arrastra tu JSON o haz click',
  'resp.h1':'Respuestas de la API','resp.desc':'Documentación de los mensajes de respuesta configurados.',
  'footer.desc':'Documentación técnica de facturación electrónica · Generix Spain · Especificaciones de mensajes e integración.','footer.bottom2':'Especificaciones técnicas e integración e-Invoicing',
  'aria.top':'Volver arriba','loading':'Cargando…','detail.errorLoad':'Error al cargar',
  'card.fields_sg':'fichero','card.fields_pl':'ficheros','card.viewDoc':'Ver documentación',
  'spec.format':'Formato','spec.category':'Categoría','spec.folder':'Carpeta','spec.schema':'Schema','spec.example':'Ejemplo','spec.exampleN':'Ejemplo {n}',
  'desc.overview':'Descripción General','desc.noCustom.title':'📝 Sin descripción personalizada','desc.noCustom.body':'Descripción personalizada pendiente de creación en el README configurado.',
  'struct.download':'📥 Descargar {file} completo','struct.view':'👁️ Ver {file} completo','struct.none':'No se encontraron bloques para esta sección.',
  'tech.title':'Detalles Técnicos','tech.type':'Tipo:','tech.required':'Obligatorios:','tech.constraints':'Restricciones:',
  'table.field':'Campo','table.desc':'Descripción','table.type':'Tipo','table.req':'Req.','table.constraints':'Restricciones','table.fieldsTitle':'📝 Descripción de campos',
  'yes':'Sí','no':'No','noDesc':'Sin descripción.',
  'enums.none':'No se encontraron campos enum en este schema.','enums.code':'Código','enums.meaning':'Significado','enums.usedIn':'Usado en:','enums.allowed':'Valores admitidos ({n})','enums.default':'por defecto','enums.more':'+{n} valores más',
  'example.none':'No hay fichero de ejemplo en esta carpeta.',
  'btn.download':'Descargar','btn.viewGithub':'Abrir','btn.viewContent':'Ver contenido','btn.hide':'Ocultar','btn.copy':'Copiar','btn.copied':'✓ Copiado',
  'versions.emptyTitle':'Sin versiones configuradas','versions.emptyBody':'Añade ficheros de versiones en SITE_CONFIG.versionFiles si necesitas mostrarlos.','versions.count':'{n} fichero(s)',
  'val.selectPlaceholder':'— Selecciona un mensaje —','val.loadError':'Error cargando mensajes',
  'vstatus.syntaxInvalid':'❌ JSON inválido (error de sintaxis)','vstatus.schemaLoadFail':'⚠️ No se pudo cargar el esquema','vstatus.valid':'✅ JSON válido','vstatus.invalid':'❌ JSON inválido',
  'vmeta.noStatus.badge':'Sin estado','vmeta.noStatus.title':'Esperando validación','vmeta.noStatus.text':'Sube un fichero para lanzar la validación.','vmeta.ok.badge':'Válido','vmeta.ok.title':'Validación completada','vmeta.ok.text':'El fichero cumple con el esquema.','vmeta.err.badge':'Inválido','vmeta.err.title':'Se detectaron errores','vmeta.err.text':'El fichero no cumple con el esquema.','vmeta.warn.badge':'Atención','vmeta.warn.title':'No se pudo validar','vmeta.info.badge':'Info','vmeta.info.title':'Estado',
  'vtable.num':'#','vtable.field':'Campo','vtable.error':'Error','vviewer.title':'📄 JSON validado'
 },
 en: {
  'nav.contact':'Contact',
  'hero.tagline':'Developer Documentation Portal','hero.title1':'B2B electronic invoicing','hero.title2':'Spain e-Invoicing',
  'hero.subtitle':'Technical documentation for JSON, XML, Responses, Status and AEAT Documentation.',
  'hero.cta.docs':'Explore documentation','hero.cta.validator':'Resources',
  'stats.sections':'Documentation sections','stats.format':'Integration format','stats.docu':'Documentation','stats.lang':'Multilanguage',
  'home.eyebrow':'Documentation center · E-Invoicing','home.title':'Integration standards and resources',
  'home.subtitle':'Select a section to browse readmes, examples, schemas and related documentation.',
  'res.history.badge':'History','res.history.title':'Schema versions','res.history.desc':'Browse and download configured schema versions.','res.history.link':'View versions',
  'res.resp.badge':'Schema','res.resp.title':'Responses','res.resp.desc':'Response structure: fields, validations and example.','res.resp.link':'View responses',
  'res.val.badge':'Tool','res.val.title':'Validation','res.val.desc':'Validate your JSON file against the selected schema.','res.val.link':'Open validator',
  'crumb.docs':'Documentation','crumb.versions':'Schema versions','crumb.validation':'Validation','crumb.responses':'Responses',
  'tabs.desc':'Overview','tabs.struct':'Structure','tabs.enums':'Enumerations','tabs.example':'Example',
  'sidebar.goto':'Go to','example.title':'Examples',
  'versions.h1':'Schema versions','versions.desc':'Configured version file listing for this documentation.',
  'val.h1':'Message validator','val.desc':'Select the message type, upload your JSON file and validate it against the available schema.','val.label':'Message to validate',
  'val.dropzone.disabled':'First select a message, then drag your JSON or click','val.dropzone.enabled':'Drag your JSON or click',
  'resp.h1':'API responses','resp.desc':'Documentation of configured response messages.',
  'footer.desc':'E-invoicing technical documentation · Generix Spain · Message and integration specifications.','footer.bottom2':'E-Invoicing technical specifications and integration',
  'aria.top':'Back to top','loading':'Loading…','detail.errorLoad':'Failed to load',
  'card.fields_sg':'file','card.fields_pl':'files','card.viewDoc':'View documentation',
  'spec.format':'Format','spec.category':'Category','spec.folder':'Folder','spec.schema':'Schema','spec.example':'Example','spec.exampleN':'Example {n}',
  'desc.overview':'Overview','desc.noCustom.title':'📝 No custom description','desc.noCustom.body':'Custom description pending creation in the configured README.',
  'struct.download':'📥 Download full {file}','struct.view':'👁️ View full {file}','struct.none':'No blocks found for this section.',
  'tech.title':'Technical details','tech.type':'Type:','tech.required':'Required:','tech.constraints':'Constraints:',
  'table.field':'Field','table.desc':'Description','table.type':'Type','table.req':'Req.','table.constraints':'Constraints','table.fieldsTitle':'📝 Field descriptions',
  'yes':'Yes','no':'No','noDesc':'No description.',
  'enums.none':'No enum fields found in this schema.','enums.code':'Code','enums.meaning':'Meaning','enums.usedIn':'Used in:','enums.allowed':'Allowed values ({n})','enums.default':'default','enums.more':'+{n} more values',
  'example.none':'No example file in this folder.',
  'btn.download':'Download','btn.viewGithub':'Open','btn.viewContent':'View content','btn.hide':'Hide','btn.copy':'Copy','btn.copied':'✓ Copied',
  'versions.emptyTitle':'No versions configured','versions.emptyBody':'Add files to SITE_CONFIG.versionFiles if you need to show them.','versions.count':'{n} file(s)',
  'val.selectPlaceholder':'— Select a message —','val.loadError':'Error loading messages',
  'vstatus.syntaxInvalid':'❌ Invalid JSON (syntax error)','vstatus.schemaLoadFail':'⚠️ Could not load the schema','vstatus.valid':'✅ Valid JSON','vstatus.invalid':'❌ Invalid JSON',
  'vmeta.noStatus.badge':'No status','vmeta.noStatus.title':'Waiting for validation','vmeta.noStatus.text':'Upload a file to run validation.','vmeta.ok.badge':'Valid','vmeta.ok.title':'Validation completed','vmeta.ok.text':'The file complies with the schema.','vmeta.err.badge':'Invalid','vmeta.err.title':'Errors detected','vmeta.err.text':'The file does not comply with the schema.','vmeta.warn.badge':'Warning','vmeta.warn.title':'Could not validate','vmeta.info.badge':'Info','vmeta.info.title':'Status',
  'vtable.num':'#','vtable.field':'Field','vtable.error':'Error','vviewer.title':'📄 Validated JSON'
 }
};

function _detectLang(){
  try { const s = localStorage.getItem(SITE_CONFIG.storageKey); if (s && I18N_LANGS.includes(s)) return s; } catch(e){}
  const n = (navigator.language || I18N_DEFAULT).slice(0,2).toLowerCase();
  return I18N_LANGS.includes(n) ? n : I18N_DEFAULT;
}
let LANG = _detectLang();
function t(key, vars){
  const d = I18N[LANG] || {}, f = I18N[I18N_DEFAULT] || {};
  let s = (key in d) ? d[key] : ((key in f) ? f[key] : key);
  if (vars) for (const k in vars) s = s.split('{'+k+'}').join(vars[k]);
  return s;
}
function getLocalized(obj, base){
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  if (base && obj[base + '_' + LANG]) return obj[base + '_' + LANG];
  return obj[LANG] || obj[I18N_DEFAULT] || Object.values(obj)[0] || '';
}
function setLang(l){
  if(!I18N_LANGS.includes(l)) return;
  try{ localStorage.setItem(SITE_CONFIG.storageKey, l); }catch(e){}
  LANG = l;
  applyStaticI18n();
  if (window._currentSection) openEndpoint(window._currentSection.id);
  else if (typeof renderGrid === 'function') renderGrid(SITE_CONFIG.sections);
}
function localizeNode(node){
  if (Array.isArray(node)) { node.forEach(localizeNode); return node; }
  if (node && typeof node === 'object') {
    ['title','description','label','meaning','transport'].forEach(b => {
      const k = b + '_' + LANG;
      if (node[k] != null) node[b] = node[k];
      I18N_LANGS.forEach(l => { delete node[b + '_' + l]; });
    });
    Object.values(node).forEach(localizeNode);
  }
  return node;
}
function applyStaticI18n(){
  document.documentElement.lang = LANG;
  document.querySelectorAll('[data-i18n]').forEach(el => { const v = t(el.getAttribute('data-i18n')); if (v != null) el.textContent = v; });
  document.querySelectorAll('[data-i18n-html]').forEach(el => { const v = t(el.getAttribute('data-i18n-html')); if (v != null) el.innerHTML = v; });
  document.querySelectorAll('[data-i18n-attr]').forEach(el => {
    el.getAttribute('data-i18n-attr').split(';').forEach(p => { const i = p.indexOf(':'); if (i < 0) return; el.setAttribute(p.slice(0,i).trim(), t(p.slice(i+1).trim())); });
  });
  const langSwitch = document.getElementById('langSwitch');
  if (langSwitch) {
    const current = document.getElementById('langCurrent');
    const menu = document.getElementById('langMenu');
    const flag = l => `<span class="lang-flag"><img src="${I18N_FLAGS[l]}" alt=""></span>`;
    const label = l => `${l.toUpperCase()} · ${I18N_LABELS[l] || l}`;
    current.innerHTML = flag(LANG) + `<span>${label(LANG)}</span>`;
    menu.innerHTML = I18N_LANGS.map(l => `<li class="lang-option${l === LANG ? ' active' : ''}" role="option" data-lang="${l}" aria-selected="${l === LANG}">${flag(l)}<span>${label(l)}</span></li>`).join('');
    const close = () => { langSwitch.classList.remove('open'); current.setAttribute('aria-expanded', 'false'); };
    current.onclick = e => { e.stopPropagation(); const open = langSwitch.classList.toggle('open'); current.setAttribute('aria-expanded', open ? 'true' : 'false'); };
    menu.querySelectorAll('.lang-option').forEach(op => { op.onclick = e => { e.stopPropagation(); setLang(op.dataset.lang); close(); }; });
    document.addEventListener('click', close);
  }
}
window.t = t; window.LANG = LANG; window.I18N = I18N; window.setLang = setLang; window.localizeNode = localizeNode; window.getLocalized = getLocalized;
document.addEventListener('DOMContentLoaded', applyStaticI18n);
