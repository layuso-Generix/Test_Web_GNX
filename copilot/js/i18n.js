/* ══ NUCLEO i18n — idiomas ES/EN, deteccion por navegador ══ */
const I18N_LANGS = ["es", "en"]; // anade aqui nuevos idiomas
const I18N_DEFAULT = CONFIG.defaultLanguage || "es";
const I18N_LABELS = { es: "Español", en: "English" };
const I18N_FLAGS = { es: "Assets/flag-es.svg", en: "Assets/flag-en.svg" };
const I18N = {
  es: {
    "hero.tagline": "Portal de Documentación para Desarrolladores",
    "hero.subtitle": "Especificaciones técnicas, esquemas de mensajes y guías de integración para la API del sistema de gestión de almacenes (WMS) de Generix Spain.",
    "hero.cta.explore": "Explorar endpoints",
    "hero.cta.resources": "Recursos",
    "stats.endpoints": "Endpoints documentados",
    "stats.comm": "Comunicación",
    "stats.protocol": "Protocolo",
    "stats.format": "Formato de integración",
    "stats.generix": "Generix Spain",
    "sec.eyebrow": "Centro de documentación · WMS API",
    "sec.title": "Endpoints y mensajes de integración",
    "sec.subtitle": "Selecciona un mensaje para explorar su esquema completo: campos, tipos, validaciones y ejemplos de payload.",
    "res.history.badge": "Historial",
    "res.history.title": "Versiones de esquemas",
    "res.history.desc": "Consulta y descarga las distintas versiones publicadas de los esquemas JSON.",
    "res.history.link": "Ver versiones",
    "res.resp.badge": "Schema",
    "res.resp.title": "Respuestas",
    "res.resp.desc": "Estructura JSON de las respuestas del WMS: campos, validaciones y ejemplo.",
    "res.resp.link": "Ver respuestas",
    "res.val.badge": "Herramienta",
    "res.val.title": "Validaciones",
    "res.val.desc": "Valida tu fichero JSON contra el esquema de cualquier mensaje del WMS.",
    "res.val.link": "Abrir validador",
    "crumb.docs": "Documentación",
    "crumb.versions": "Versiones de esquemas",
    "crumb.validation": "Validaciones",
    "crumb.responses": "Respuestas",
    "tabs.desc": "Descripción General",
    "tabs.struct": "Estructura",
    "tabs.enums": "Enumeraciones",
    "tabs.example": "Ejemplo",
    "sidebar.goto": "Ir a",
    "example.title": "Ejemplos",
    "example.notice": "<strong>⚠️ Aviso:</strong> Los datos utilizados en estos ejemplos no tienen relación con datos reales. Confirma con tu consultor WMS que los valores sean correctos.",
    "versions.h1": "Versiones de esquemas",
    "versions.desc": "Listado en vivo desde el repositorio. Cualquier carpeta o fichero que se añada aparece aquí automaticamente.",
    "val.h1": "Validador de mensajes",
    "val.desc": "Selecciona el tipo de mensaje, sube tu fichero JSON y valídalo contra el esquema oficial del WMS.",
    "val.label": "Mensaje a validar",
    "val.dropzone.disabled": "Selecciona primero un mensaje, luego arrastra tu JSON o haz click",
    "val.dropzone.enabled": "Arrastra tu JSON o haz click",
    "resp.h1": "Respuestas de la API",
    "resp.desc": "La API es asíncrona: devuelve una respuesta inmediata (HTTP) y, si detecta errores de validación, envía un callback al endpoint que el cliente expone.",
    "footer.desc": "Documentación técnica de la API WMS · Generix Spain · Especificaciones de mensajes e integración.",
    "footer.bottom2": "Especificaciones técnicas e integración WMS",
    "aria.top": "Volver arriba",
    loading: "Cargando…",
    "empty.none": "No hay endpoints publicados todavía.",
    "err.repo.title": "No se pudo conectar con el repositorio",
    "err.repo.body": "Revisa los valores de CONFIG (owner, repo, branch).",
    "empty.title": "Sin endpoints publicados",
    "empty.hint": "Crea una carpeta en <code>{path}/</code> con un <code>schema.json</code>.",
    "card.fields_sg": "campo",
    "card.fields_pl": "campos",
    "card.viewDoc": "Ver documentación",
    "detail.errorLoad": "Error al cargar",
    "spec.method": "Metodo",
    "spec.endpoint": "Endpoint",
    "spec.category": "Categoría",
    "spec.version": "Versión",
    "spec.releaseDate": "Fecha de Lanzamiento",
    "spec.example": "Ejemplo",
    "spec.exampleN": "Ejemplo {n}",
    "desc.overview": "Descripción General",
    "desc.thisEndpoint": "este endpoint",
    "desc.noCustom.title": "📝 Sin descripción personalizada",
    "desc.noCustom.body": "Descripción personalizada pendiente de creación en <code>{name}</code>.",
    "struct.download": "📥 Descargar {file} completo",
    "struct.view": "👁️ Ver {file} completo",
    "struct.none": "No se encontraron bloques.",
    "tech.title": "Detalles Técnicos",
    "tech.type": "Tipo:",
    "tech.required": "Obligatorios:",
    "tech.constraints": "Restricciones:",
    "oneOf.title": "⚠️ Exclusivo (oneOf):",
    "oneOf.body": "se debe incluir <u>solo uno</u> de:",
    "word.or": "o",
    "word.and": "y",
    "ifthen.title": "🔀 Condicional (if/then):",
    "ifthen.if": "si",
    "ifthen.then": "entonces",
    "ifthen.reqPl": "son obligatorios",
    "ifthen.reqSg": "es obligatorio",
    "table.field": "Campo",
    "table.desc": "Descripción",
    "table.type": "Tipo",
    "table.req": "Req.",
    "table.constraints": "Restricciones",
    "table.fieldsTitle": "📝 Descripción de campos",
    yes: "Si",
    no: "No",
    noDesc: "Sin descripción.",
    "enums.none": "No se encontraron campos enum en este schema.",
    "enums.code": "Código",
    "enums.meaning": "Significado",
    "enums.usedIn": "Usado en:",
    "enums.allowed": "Valores admitidos ({n})",
    "enums.default": "por defecto",
    "enums.more": "+{n} valores más",
    "example.none": "No hay fichero de ejemplo en esta carpeta.",
    "btn.download": "Descargar",
    "btn.viewGithub": "Ver en GitHub",
    "btn.viewContent": "Ver contenido",
    "btn.hide": "Ocultar",
    "btn.copy": "Copiar",
    "btn.copied": "✓ Copiado",
    "versions.count": "{n} fichero(s) en {m} carpeta(s)",
    "versions.emptyTitle": "Carpeta vacía o aun no creada",
    "versions.emptyBody": "No se han encontrado ficheros en <code>{path}</code>.",
    "versions.viewFolder": "Ver carpeta en GitHub",
    "versions.general": "General",
    "versions.loadFail": "No se pudo cargar",
    "versions.loadFailMsg": "No se pudo cargar: ",
    "versions.truncated": "… (truncado)",
    "val.selectPlaceholder": "— Selecciona un mensaje —",
    "val.loadError": "Error cargando mensajes",
    "resp.httpCodes": "Códigos de estado HTTP",
    "resp.state": "Estado",
    "resp.msgStruct": "Estructura del mensaje",
    "resp.enums": "Enumeraciones",
    "resp.response": "Respuesta",
    "resp.labelIni": "Respuesta API",
    "resp.labelCb": "Callback de errores",
    "resp.example": "Ejemplo",
    "resp.noExample": "Sin ejemplo en la carpeta.",
    "resp.noSchemas.title": "No se encontraron los schemas de respuesta",
    "resp.noSchemas.body": "Sube a <code>{dir}/</code> los ficheros <code>SchemaResponseInitial.json</code> y <code>SchemaResponseCallback.json</code> (con sus ejemplos).",
    "verr.enum": "Valor no permitido. Valores admitidos: {v}",
    "verr.const": "Valor obligatorio: {v}",
    "verr.maxLength": "Longitud máxima permitida: {v} caracteres",
    "verr.minLength": "Longitud mínima requerida: {v} caracteres",
    "verr.pattern": "No cumple el patron requerido: {v}",
    "verr.format": "Formato inválido, se esperaba: {v}",
    "verr.type": "Tipo incorrecto, se esperaba: {v}",
    "verr.maximum": "Valor máximo permitido: {v}",
    "verr.minimum": "Valor mínimo permitido: {v}",
    "verr.exclusiveMaximum": "Debe ser menor que: {v}",
    "verr.exclusiveMinimum": "Debe ser mayor que: {v}",
    "verr.multipleOf": "Debe ser multiplo de: {v}",
    "verr.maxItems": "Máximo de elementos permitido: {v}",
    "verr.minItems": "Mínimo de elementos requerido: {v}",
    "verr.required": "Falta el campo obligatorio: {v}",
    "verr.additionalProperties": "Propiedad no permitida: {v}",
    "verr.oneOf": "Debe cumplir exactamente uno de los esquemas permitidos",
    "verr.default": "Error de validación",
    "vstatus.syntaxInvalid": "❌ JSON inválido (error de sintaxis)",
    "vstatus.schemaLoadFail": "⚠️ No se pudo cargar el esquema",
    "vstatus.schemaCompileFail": "⚠️ El esquema no se pudo compilar",
    "vstatus.valid": "✅ JSON válido",
    "vstatus.invalid": "❌ JSON inválido",
    "vmeta.noStatus.badge": "Sin estado",
    "vmeta.noStatus.title": "Esperando validación",
    "vmeta.noStatus.text": "Sube un fichero para lanzar la validación.",
    "vmeta.ok.badge": "Válido",
    "vmeta.ok.title": "Validación completada",
    "vmeta.ok.text": "El fichero cumple con el esquema.",
    "vmeta.err.badge": "Inválido",
    "vmeta.err.title": "Se detectaron errores",
    "vmeta.err.text": "El fichero no cumple con el esquema.",
    "vmeta.warn.badge": "Atención",
    "vmeta.warn.title": "No se pudo validar",
    "vmeta.info.badge": "Info",
    "vmeta.info.title": "Estado",
    "vtable.num": "#",
    "vtable.field": "Campo",
    "vtable.error": "Error",
    "vviewer.title": "📄 JSON validado",

    "nav.home": "Inicio",
    "nav.validator": "Validador",
    "nav.contact": "Contactar",
    "hero.tagline": "Portal de Documentación para Desarrolladores",
    "hero.title1": "Facturación electrónica B2B",
    "hero.title2": "Spain e-Invoicing",
    "hero.subtitle": "Documentación técnica para los estándares JSON, XML, respuestas, estados y documentación AEAT.",
    "hero.cta.docs": "Explorar documentación",
    "hero.cta.validator": "Abrir validador",
    "stats.sections": "Secciones documentales",
    "stats.lang": "Multilenguaje",
    "home.eyebrow": "Centro de documentación · E-Invoicing",
    "home.title": "Estándares y recursos de integración",
    "home.subtitle": "Selecciona una sección para consultar sus readmes, ejemplos, esquemas y documentación relacionada.",
    "crumb.docs": "Documentación",
    "crumb.validator": "Validador",
    "tabs.readme": "Readme",
    "tabs.files": "Ficheros",
    "footer.desc": "Documentación técnica de facturación electrónica · Generix Spain.",
    "footer.bottom2": "Especificaciones técnicas e integración e-Invoicing",
    "file.view": "Ver contenido",
    "file.hide": "Ocultar",
    "file.download": "Descargar",
    "file.open": "Abrir",
    "file.copy": "Copiar",
    "file.copied": "✓ Copiado",
    "readme.missing": "No se ha encontrado el README para esta sección todavía.",
    "readme.missingHint": "Crea el fichero readme.es.md/readme.en.md en la ruta configurada.",
    loading: "Cargando…",
    "validator.h1": "Validador JSON",
    "validator.desc": "Selecciona una sección con schema JSON y valida tu fichero local contra el esquema configurado.",
    "validator.label": "Schema a validar",
    "validator.drop.disabled": "Selecciona primero un schema y luego arrastra tu JSON o haz click",
    "validator.drop.enabled": "Arrastra tu JSON o haz click",
    "validator.select": "— Selecciona un schema —",
    "validator.valid": "JSON válido",
    "validator.invalid": "JSON inválido",
    "validator.syntax": "JSON inválido: error de sintaxis",
    "validator.schemaLoad": "No se pudo cargar el schema",
    "validator.wait": "Esperando validación",
    "validator.waitText": "Sube un fichero para lanzar la validación.",
    "validator.ok": "Validación completada",
    "validator.okText": "El fichero cumple con el schema.",
    "validator.err": "Se detectaron errores",
    "validator.errText": "El fichero no cumple con el schema.",
    "validator.field": "Campo",
    "validator.error": "Error",
    "validator.required": "Falta el campo obligatorio",
    "validator.type": "Tipo incorrecto",
    "validator.enum": "Valor no permitido",
    "validator.pattern": "No cumple el patrón",
    "validator.maxLength": "Longitud máxima excedida",
    "validator.minLength": "Longitud mínima no alcanzada",
    "validator.additional": "Propiedad no permitida",
  },
  en: {
    "hero.tagline": "Developer Documentation Portal",
    "hero.subtitle": "Technical specifications, message schemas and integration guides for the Generix Spain Warehouse Management System (WMS) API.",
    "hero.cta.explore": "Explore endpoints",
    "hero.cta.resources": "Resources",
    "stats.endpoints": "Documented endpoints",
    "stats.comm": "Communication",
    "stats.protocol": "Protocol",
    "stats.format": "Integration format",
    "stats.generix": "Generix Spain",
    "sec.eyebrow": "Documentation center · WMS API",
    "sec.title": "Endpoints and integration messages",
    "sec.subtitle": "Select a message to explore its full schema: fields, types, validations and payload examples.",
    "res.history.badge": "History",
    "res.history.title": "Schema versions",
    "res.history.desc": "Browse and download the different published versions of the JSON schemas.",
    "res.history.link": "View versions",
    "res.resp.badge": "Schema",
    "res.resp.title": "Responses",
    "res.resp.desc": "JSON structure of WMS responses: fields, validations and example.",
    "res.resp.link": "View responses",
    "res.val.badge": "Tool",
    "res.val.title": "Validation",
    "res.val.desc": "Validate your JSON file against the schema of any WMS message.",
    "res.val.link": "Open validator",
    "crumb.docs": "Documentation",
    "crumb.versions": "Schema versions",
    "crumb.validation": "Validation",
    "crumb.responses": "Responses",
    "tabs.desc": "Overview",
    "tabs.struct": "Structure",
    "tabs.enums": "Enumerations",
    "tabs.example": "Example",
    "sidebar.goto": "Go to",
    "example.title": "Examples",
    "example.notice": "<strong>⚠️ Notice:</strong> The data used in these examples is not related to real data. Confirm with your WMS consultant that the values are correct.",
    "versions.h1": "Schema versions",
    "versions.desc": "Live listing from the repository. Any folder or file added appears here automatically.",
    "val.h1": "Message validator",
    "val.desc": "Select the message type, upload your JSON file and validate it against the official WMS schema.",
    "val.label": "Message to validate",
    "val.dropzone.disabled": "First select a message, then drag your JSON or click",
    "val.dropzone.enabled": "Drag your JSON or click",
    "resp.h1": "API responses",
    "resp.desc": "The API is asynchronous: it returns an immediate response (HTTP) and, if it detects validation errors, sends a callback to the endpoint the client exposes.",
    "footer.desc": "WMS API technical documentation · Generix Spain · Message and integration specifications.",
    "footer.bottom2": "WMS technical specifications and integration",
    "aria.top": "Back to top",
    loading: "Loading…",
    "empty.none": "No endpoints published yet.",
    "err.repo.title": "Could not connect to the repository",
    "err.repo.body": "Check the CONFIG values (owner, repo, branch).",
    "empty.title": "No endpoints published",
    "empty.hint": "Create a folder in <code>{path}/</code> with a <code>schema.json</code>.",
    "card.fields_sg": "field",
    "card.fields_pl": "fields",
    "card.viewDoc": "View documentation",
    "detail.errorLoad": "Failed to load",
    "spec.method": "Method",
    "spec.endpoint": "Endpoint",
    "spec.category": "Category",
    "spec.version": "Version",
    "spec.releaseDate": "Release date",
    "spec.example": "Example",
    "spec.exampleN": "Example {n}",
    "desc.overview": "Overview",
    "desc.thisEndpoint": "this endpoint",
    "desc.noCustom.title": "📝 No custom description",
    "desc.noCustom.body": "Custom description pending creation in <code>{name}</code>.",
    "struct.download": "📥 Download full {file}",
    "struct.view": "👁️ View full {file}",
    "struct.none": "No blocks found.",
    "tech.title": "Technical details",
    "tech.type": "Type:",
    "tech.required": "Required:",
    "tech.constraints": "Constraints:",
    "oneOf.title": "⚠️ Exclusive (oneOf):",
    "oneOf.body": "only <u>one</u> of these must be included:",
    "word.or": "or",
    "word.and": "and",
    "ifthen.title": "🔀 Conditional (if/then):",
    "ifthen.if": "if",
    "ifthen.then": "then",
    "ifthen.reqPl": "are required",
    "ifthen.reqSg": "is required",
    "table.field": "Field",
    "table.desc": "Description",
    "table.type": "Type",
    "table.req": "Req.",
    "table.constraints": "Constraints",
    "table.fieldsTitle": "📝 Field descriptions",
    yes: "Yes",
    no: "No",
    noDesc: "No description.",
    "enums.none": "No enum fields found in this schema.",
    "enums.code": "Code",
    "enums.meaning": "Meaning",
    "enums.usedIn": "Used in:",
    "enums.allowed": "Allowed values ({n})",
    "enums.default": "default",
    "enums.more": "+{n} more values",
    "example.none": "No example file in this folder.",
    "btn.download": "Download",
    "btn.viewGithub": "View on GitHub",
    "btn.viewContent": "View content",
    "btn.hide": "Hide",
    "btn.copy": "Copy",
    "btn.copied": "✓ Copied",
    "versions.count": "{n} file(s) in {m} folder(s)",
    "versions.emptyTitle": "Empty or not yet created folder",
    "versions.emptyBody": "No files found in <code>{path}</code>.",
    "versions.viewFolder": "View folder on GitHub",
    "versions.general": "General",
    "versions.loadFail": "Could not load",
    "versions.loadFailMsg": "Could not load: ",
    "versions.truncated": "… (truncated)",
    "val.selectPlaceholder": "— Select a message —",
    "val.loadError": "Error loading messages",
    "resp.httpCodes": "HTTP status codes",
    "resp.state": "Status",
    "resp.msgStruct": "Message structure",
    "resp.enums": "Enumerations",
    "resp.response": "Response",
    "resp.labelIni": "API response",
    "resp.labelCb": "Error callback",
    "resp.example": "Example",
    "resp.noExample": "No example in the folder.",
    "resp.noSchemas.title": "Response schemas not found",
    "resp.noSchemas.body": "Upload to <code>{dir}/</code> the files <code>SchemaResponseInitial.json</code> and <code>SchemaResponseCallback.json</code> (with their examples).",
    "verr.enum": "Value not allowed. Allowed values: {v}",
    "verr.const": "Required value: {v}",
    "verr.maxLength": "Maximum allowed length: {v} characters",
    "verr.minLength": "Minimum required length: {v} characters",
    "verr.pattern": "Does not match required pattern: {v}",
    "verr.format": "Invalid format, expected: {v}",
    "verr.type": "Incorrect type, expected: {v}",
    "verr.maximum": "Maximum allowed value: {v}",
    "verr.minimum": "Minimum allowed value: {v}",
    "verr.exclusiveMaximum": "Must be less than: {v}",
    "verr.exclusiveMinimum": "Must be greater than: {v}",
    "verr.multipleOf": "Must be a multiple of: {v}",
    "verr.maxItems": "Maximum allowed items: {v}",
    "verr.minItems": "Minimum required items: {v}",
    "verr.required": "Missing required field: {v}",
    "verr.additionalProperties": "Property not allowed: {v}",
    "verr.oneOf": "Must match exactly one of the allowed schemas",
    "verr.default": "Validation error",
    "vstatus.syntaxInvalid": "❌ Invalid JSON (syntax error)",
    "vstatus.schemaLoadFail": "⚠️ Could not load the schema",
    "vstatus.schemaCompileFail": "⚠️ The schema could not be compiled",
    "vstatus.valid": "✅ Valid JSON",
    "vstatus.invalid": "❌ Invalid JSON",
    "vmeta.noStatus.badge": "No status",
    "vmeta.noStatus.title": "Waiting for validation",
    "vmeta.noStatus.text": "Upload a file to run validation.",
    "vmeta.ok.badge": "Valid",
    "vmeta.ok.title": "Validation completed",
    "vmeta.ok.text": "The file complies with the schema.",
    "vmeta.err.badge": "Invalid",
    "vmeta.err.title": "Errors detected",
    "vmeta.err.text": "The file does not comply with the schema.",
    "vmeta.warn.badge": "Warning",
    "vmeta.warn.title": "Could not validate",
    "vmeta.info.badge": "Info",
    "vmeta.info.title": "Status",
    "vtable.num": "#",
    "vtable.field": "Field",
    "vtable.error": "Error",
    "vviewer.title": "📄 Validated JSON",

    "nav.home": "Home",
    "nav.validator": "Validator",
    "nav.contact": "Contact",
    "hero.tagline": "Developer Documentation Portal",
    "hero.title1": "B2B electronic invoicing",
    "hero.title2": "Spain e-Invoicing",
    "hero.subtitle": "Technical documentation for JSON, XML, responses, status and AEAT documentation.",
    "hero.cta.docs": "Explore documentation",
    "hero.cta.validator": "Open validator",
    "stats.sections": "Documentation sections",
    "stats.lang": "Multilanguage",
    "home.eyebrow": "Documentation center · E-Invoicing",
    "home.title": "Integration standards and resources",
    "home.subtitle": "Select a section to browse readmes, examples, schemas and related documentation.",
    "crumb.docs": "Documentation",
    "crumb.validator": "Validator",
    "tabs.readme": "Readme",
    "tabs.files": "Files",
    "footer.desc": "E-invoicing technical documentation · Generix Spain.",
    "footer.bottom2": "E-Invoicing technical specifications and integration",
    "file.view": "View content",
    "file.hide": "Hide",
    "file.download": "Download",
    "file.open": "Open",
    "file.copy": "Copy",
    "file.copied": "✓ Copied",
    "readme.missing": "README not found for this section yet.",
    "readme.missingHint": "Create readme.es.md/readme.en.md in the configured path.",
    loading: "Loading…",
    "validator.h1": "JSON validator",
    "validator.desc": "Select a section with a JSON schema and validate your local file against the configured schema.",
    "validator.label": "Schema to validate",
    "validator.drop.disabled": "First select a schema, then drag your JSON or click",
    "validator.drop.enabled": "Drag your JSON or click",
    "validator.select": "— Select a schema —",
    "validator.valid": "Valid JSON",
    "validator.invalid": "Invalid JSON",
    "validator.syntax": "Invalid JSON: syntax error",
    "validator.schemaLoad": "Could not load schema",
    "validator.wait": "Waiting for validation",
    "validator.waitText": "Upload a file to run validation.",
    "validator.ok": "Validation completed",
    "validator.okText": "The file complies with the schema.",
    "validator.err": "Errors detected",
    "validator.errText": "The file does not comply with the schema.",
    "validator.field": "Field",
    "validator.error": "Error",
    "validator.required": "Missing required field",
    "validator.type": "Wrong type",
    "validator.enum": "Value not allowed",
    "validator.pattern": "Pattern mismatch",
    "validator.maxLength": "Maximum length exceeded",
    "validator.minLength": "Minimum length not reached",
    "validator.additional": "Additional property not allowed",
  },
};
function _detectLang() {
  try {
    const s = localStorage.getItem(CONFIG.storageKey);
    if (s && I18N_LANGS.includes(s)) return s;
  } catch (e) {}
  const n = (navigator.language || I18N_DEFAULT).slice(0, 2).toLowerCase();
  return I18N_LANGS.includes(n) ? n : I18N_DEFAULT;
}
let LANG = _detectLang();
function t(key, vars) {
  const d = I18N[LANG] || {},
    f = I18N[I18N_DEFAULT] || {};
  let s = key in d ? d[key] : key in f ? f[key] : key;
  if (vars) for (const k in vars) s = s.split("{" + k + "}").join(vars[k]);
  return s;
}
function setLang(l) {
  if (!I18N_LANGS.includes(l)) return;
  try {
    localStorage.setItem(CONFIG.storageKey, l);
  } catch (e) {}
  location.reload();
}
function localizeNode(node) {
  if (Array.isArray(node)) {
    node.forEach(localizeNode);
    return node;
  }
  if (node && typeof node === "object") {
    ["title", "description", "label", "meaning", "transport"].forEach((b) => {
      const k = b + "_" + LANG;
      if (node[k] != null) node[b] = node[k]; // usa el idioma activo (campo base = reserva)
      I18N_LANGS.forEach((l) => {
        delete node[b + "_" + l];
      }); // oculta las variantes en el JSON mostrado
    });
    Object.values(node).forEach(localizeNode);
  }
  return node;
}
function applyStaticI18n() {
  document.documentElement.lang = LANG;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const v = t(el.getAttribute("data-i18n"));
    if (v != null) el.textContent = v;
  });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const v = t(el.getAttribute("data-i18n-html"));
    if (v != null) el.innerHTML = v;
  });
  document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    el.getAttribute("data-i18n-attr")
      .split(";")
      .forEach((p) => {
        const i = p.indexOf(":");
        if (i < 0) return;
        el.setAttribute(p.slice(0, i).trim(), t(p.slice(i + 1).trim()));
      });
  });
  const dz = document.getElementById("dropzone");
  if (dz && dz.childNodes[0])
    dz.childNodes[0].nodeValue = " " + t("val.dropzone.disabled") + " ";
  const langSwitch = document.getElementById("langSwitch");
  if (langSwitch) {
    const current = document.getElementById("langCurrent");
    const menu = document.getElementById("langMenu");
    const flag = (l) =>
      `<span class="lang-flag">${I18N_FLAGS[l] ? `<img src="${I18N_FLAGS[l]}" alt="">` : ""}</span>`;
    const label = (l) => `${l.toUpperCase()} · ${I18N_LABELS[l] || l}`;

    current.innerHTML = flag(LANG) + `<span>${label(LANG)}</span>`;
    menu.innerHTML = I18N_LANGS.map(
      (l) =>
        `<li class="lang-option${l === LANG ? " active" : ""}" role="option" data-lang="${l}" aria-selected="${l === LANG}">${flag(l)}<span>${label(l)}</span></li>`,
    ).join("");

    const close = () => {
      langSwitch.classList.remove("open");
      current.setAttribute("aria-expanded", "false");
    };
    current.onclick = (e) => {
      e.stopPropagation();
      const open = langSwitch.classList.toggle("open");
      current.setAttribute("aria-expanded", open ? "true" : "false");
    };
    menu.querySelectorAll(".lang-option").forEach((op) => {
      op.onclick = (e) => {
        e.stopPropagation();
        setLang(op.dataset.lang);
      };
    });
    current.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        current.click();
      } else if (e.key === "Escape") close();
    });
    document.addEventListener("click", close);
  }
}
window.t = t;
window.LANG = LANG;
window.I18N = I18N;
window.setLang = setLang;
document.addEventListener("DOMContentLoaded", applyStaticI18n);
