// Validador GNX → SPFE. Módulo de navegador; conserva los IDs de la página original.
// Ruta relativa al HTML (no a este .js). Cambiar solo si la estructura del portal es distinta.
import { SCHEMA_URL, exampleUrl } from "./Assets/spfe/config.mjs";
const AJV_URL = "https://cdn.jsdelivr.net/npm/ajv@8.17.1/+esm";
const FORMATS_URL = "https://cdn.jsdelivr.net/npm/ajv-formats@2.1.1/+esm";

// JSON Schema define multipleOf en decimal. Evitar tanto falsos errores (0.29 / 0.01)
// como aceptar fracciones de céntimo por aplicar una tolerancia absoluta.
function decimal(value) {
  const [mantissa, exp = "0"] = String(value).toLowerCase().split("e");
  const [whole, fraction = ""] = mantissa.split(".");
  const digits = (whole + fraction).replace(/^-/, "").replace(/^0+/, "");
  if (!digits) return { digits: "0", power: 0, negative: false };
  const trimmed = digits.replace(/0+$/, "");
  return { digits: trimmed, power: Number(exp) - fraction.length + digits.length - trimmed.length,
    negative: mantissa.startsWith("-") };
}
function decimalMultipleOf(step, value) {
  if (!Number.isFinite(value) || !Number.isFinite(step) || step <= 0) return false;
  const a = decimal(value), b = decimal(step);
  if (a.digits === "0") return true;
  const delta = a.power - b.power;
  if (delta < 0) return false; // Las mantisas normalizadas no terminan en cero.
  return (BigInt(a.digits) * 10n ** BigInt(delta)) % BigInt(b.digits) === 0n;
}
function parseInvoice(text) {
  const source = text.replace(/^\uFEFF/, "");
  const data = JSON.parse(source);
  // JSON.parse redondea silenciosamente algunos importes y enteros grandes. Revisar los
  // literales antes de validar; omitir las cadenas completas, incluidos sus escapes.
  const tokens = /"(?:\\[\s\S]|[^"\\])*"|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
  for (const match of source.matchAll(tokens)) {
    const raw = match[0];
    if (raw[0] === '"') continue;
    const n = Number(raw), a = decimal(raw), b = Number.isFinite(n) && decimal(n);
    if (!b || a.digits !== b.digits || a.power !== b.power || a.negative !== b.negative) {
      const err = new Error("El navegador no puede representar el número " + raw + " sin cambiar su valor (posición " + (match.index + 1) + ").");
      err.name = "PrecisionError";
      throw err;
    }
  }
  return data;
}

let pendingValidator;
function getValidator() {
  if (!pendingValidator) pendingValidator = loadValidator().catch(error => {
    pendingValidator = undefined; // Reintentar si hubo un fallo transitorio.
    throw error;
  });
  return pendingValidator;
}
async function loadValidator() {
  let schema;
  try {
    const res = await fetch(SCHEMA_URL, { cache: "no-cache" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    schema = await res.json();
  } catch (e) { throw new Error("No se pudo leer " + SCHEMA_URL + ": " + e.message); }
  if (schema?.$schema !== "http://json-schema.org/draft-07/schema#" ||
      schema.definitions?.Parties?.properties?.ThirdParty?.type !== "array") {
    throw new Error("El recurso servido no corresponde al perfil GNX SPFE esperado (Draft-07, ThirdParty como lista). Revisa " + SCHEMA_URL);
  }
  let Ajv, addFormats;
  try {
    [{ default: Ajv }, { default: addFormats }] = await Promise.all([import(AJV_URL), import(FORMATS_URL)]);
  } catch (e) { throw new Error("No se pudieron cargar Ajv y sus formatos desde jsDelivr: " + e.message); }
  try {
    const ajv = new Ajv({ allErrors: true, strict: false, strictNumbers: true, ownProperties: true,
      coerceTypes: false, useDefaults: false, removeAdditional: false, validateFormats: true, verbose: true });
    addFormats(ajv, { mode: "full", keywords: false });
    ajv.removeKeyword("multipleOf");
    ajv.addKeyword({ keyword: "multipleOf", type: "number", schemaType: "number", errors: false,
      metaSchema: { type: "number", exclusiveMinimum: 0 }, validate: decimalMultipleOf });
    return ajv.compile(schema);
  } catch (e) { throw new Error("No se pudo compilar el esquema GNX SPFE: " + e.message); }
}

const types = { object: "un objeto", array: "una lista", number: "un número", integer: "un entero",
  string: "un texto", boolean: "un booleano", null: "null" };
function child(path, key) {
  return /^[A-Za-z_$][\w$]*$/.test(key) ? path + "." + key
    : /^(0|[1-9][0-9]*)$/.test(key) ? path + "[" + key + "]" : path + "[" + JSON.stringify(key) + "]";
}
function pathOf(pointer) {
  return (pointer || "").split("/").slice(1).reduce((p, part) =>
    child(p, part.replace(/~1/g, "/").replace(/~0/g, "~")), "$");
}
function explain(e) {
  const p = e.params || {};
  let at = pathOf(e.instancePath), msg;
  switch (e.keyword) {
    case "required": at = child(at, p.missingProperty); msg = "falta este campo obligatorio."; break;
    case "additionalProperties": at = child(at, p.additionalProperty); msg = "el esquema no admite esta propiedad."; break;
    case "type": msg = "se esperaba " + (types[p.type] || p.type) + ".";
      if (at.endsWith(".ThirdParty") && p.type === "array") msg += " Si hay un solo tercero, usa [ { … } ].";
      break;
    case "enum": {
      const values = p.allowedValues;
      msg = values.length > 20 ? "el valor no pertenece al catálogo (" + values.length + " códigos)."
        : "valores permitidos aquí: " + values.map(v => JSON.stringify(v)).join(", ") + ".";
      if (at.endsWith(".CountryCode")) msg += " Usa el código de dos letras, por ejemplo ES.";
      break;
    }
    case "const": msg = "el valor debe ser " + JSON.stringify(p.allowedValue) + "."; break;
    case "format": msg = "formato no válido: " + p.format + "."; break;
    case "pattern": msg = p.pattern === "\\S" ? "se requiere al menos un carácter que no sea un espacio en blanco." : "no cumple el patrón " + p.pattern + "."; break;
    case "multipleOf": msg = p.multipleOf === 0.01 || e.schema === 0.01 ? "el importe debe ser múltiplo de 0,01 (sin fracciones de céntimo)." : "se requiere un múltiplo de " + (p.multipleOf ?? e.schema) + "."; break;
    case "minItems": msg = "la lista requiere al menos " + p.limit + " elemento(s)."; break;
    case "maxItems": msg = "la lista permite como máximo " + p.limit + " elemento(s)."; break;
    case "minLength": msg = "longitud mínima: " + p.limit + " caracteres."; break;
    case "maxLength": msg = "longitud máxima: " + p.limit + " caracteres."; break;
    case "minimum": case "maximum": case "exclusiveMinimum": case "exclusiveMaximum":
      msg = "el valor debe cumplir " + p.comparison + " " + p.limit + "."; break;
    case "dependencies": msg = "al informar " + p.property + " también se requiere " + p.missingProperty + "."; break;
    case "not": {
      const object = e.data ?? {};
      const keys = e.schema?.anyOf?.flatMap(rule => rule.required || [])
        .filter(k => Object.prototype.hasOwnProperty.call(object, k));
      if (keys?.length === 1) at = child(at, keys[0]);
      msg = keys?.length ? "no se admite en este contexto" + (keys.length > 1 ? ": " + keys.join(", ") : "") + "."
        : "esta combinación de campos no está permitida aquí."; break;
    }
    case "anyOf": msg = "debe cumplirse al menos una de las alternativas del esquema."; break;
    default: msg = e.message || ("regla no cumplida: " + e.keyword);
  }
  return { path: at, message: msg };
}
function describeErrors(errors) {
  // Ajv acompaña un fallo de 'then' con un segundo mensaje 'if' que no añade información.
  const details = (errors || []).filter(e => e.keyword !== "if");
  return [...new Map(details.map(explain).map(e => [JSON.stringify(e), e])).values()];
}

function start() {
  const el = id => document.getElementById(id);
  const dropzone = el("dropzone"), input = el("fileInput"), result = el("result"),
    errorList = el("errorList"), viewer = el("jsonViewer");
  if (!dropzone || !input || !result || !errorList || !viewer) {
    console.error("Validador GNX: faltan elementos del HTML (dropzone, fileInput, result, errorList o jsonViewer).");
    return;
  }
  function render(status, lines = [], json = "") {
    result.textContent = status;
    const errors = lines.map(v => typeof v === "string" ? { path: "", message: v } : v);
    const visible = errors.map(e => e.path ? e.path + " → " + e.message : e.message);
    if (errorList.matches("ul, ol")) {
      const entries = visible.map(line => { const li = document.createElement("li"); li.textContent = line; return li; });
      errorList.replaceChildren(...entries);
    } else {
      errorList.style.whiteSpace = "pre-wrap";
      errorList.textContent = visible.join("\n");
    }
    viewer.textContent = json;
    document.dispatchEvent(new CustomEvent("gnx:validation", { detail: { status, errors, json } }));
  }
  let sequence = 0;
  async function handleFile(file) {
    if (!file) return;
    const task = ++sequence;
    render("Leyendo " + file.name + "…");
    let data;
    try {
      const text = await file.text();
      if (task !== sequence) return;
      data = parseInvoice(text);
    } catch (e) {
      if (task === sequence) render(e.name === "SyntaxError" ? "❌ JSON con error de sintaxis"
        : e.name === "PrecisionError" ? "⚠️ No validado: precisión numérica" : "⚠️ No se pudo leer el fichero", [e.message]);
      return;
    }
    const pretty = JSON.stringify(data, null, 2);
    render("Validando con el esquema GNX SPFE…", [], pretty);
    try {
      const validate = await getValidator();
      if (task !== sequence) return;
      if (validate(data)) render("✅ JSON válido según el esquema GNX SPFE.", [], pretty);
      else render("❌ El JSON no cumple el esquema GNX SPFE.", describeErrors(validate.errors), pretty);
    } catch (e) {
      if (task === sequence) render("⚠️ No se ha podido validar la factura.", [e.message], pretty);
    }
  }
  document.getElementById("probarEjemplo")?.addEventListener("click", () => handleFile({
    name: "ejemplo_spfe_ordinaria.json",
    text: async () => { const r = await fetch(exampleUrl("ordinaria")); if (!r.ok) throw Error("HTTP " + r.status); return r.text(); }
  }));
  dropzone.addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target === dropzone) { e.preventDefault(); input.click(); } });
  dropzone.addEventListener("click", e => { if (e.target !== input) input.click(); });
  dropzone.addEventListener("dragover", e => { e.preventDefault(); dropzone.classList.add("dragover"); });
  dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
  dropzone.addEventListener("drop", e => {
    e.preventDefault(); dropzone.classList.remove("dragover"); handleFile(e.dataTransfer.files[0]);
  });
  input.addEventListener("change", () => { const file = input.files[0]; input.value = ""; handleFile(file); });
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
else start();
