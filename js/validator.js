/* =========================================================
  validator.js — Validador de la web (script clásico, SIN import)
  ┌─────────────────────────────────────────────────────┐
  │  Une lo mejor de las dos versiones:                 │
  │  - UI de validator_old (selector, resumen, tabla de │
  │    errores, visor con salto a la línea del error).  │
  │  - Motor estricto del nuevo (Ajv 8 + formatos,      │
  │    multipleOf decimal, control de precisión,        │
  │    mensajes claros).                                │
  │                                                     │
  │  Motores enchufables (ENGINES):                     │
  │   json        → Ajv (JSON Schema)          ✅       │
  │   xsd         → libxml2-wasm (XML vs XSD)  ✅       │
  │   schematron  → pendiente (stub)           ⏳       │
  │                                                     │
  │  Las librerías se cargan con import() dinámico,     │
  │  que SÍ funciona en un script normal.               │
  └─────────────────────────────────────────────────────┘
  Config por card (config.js):
    validatorSchema: 'ruta/al/schema.json' | 'ruta/al/schema.xsd'
    validatorSchematron: 'ruta/al/fichero.sch'   (futuro)
  ========================================================= */
(function () {
  'use strict';

  const AJV_URL      = 'https://cdn.jsdelivr.net/npm/ajv@8.17.1/+esm';
  const AJV2020_URL  = 'https://cdn.jsdelivr.net/npm/ajv@8.17.1/dist/2020.js/+esm';
  const FORMATS_URL  = 'https://cdn.jsdelivr.net/npm/ajv-formats@2.1.1/+esm';
  // libxml2 compilado a WebAssembly. Se carga desde jsDelivr (sin Worker, sin copiar nada al repo).
  // Se puede cambiar en config.js con CONFIG.libxml2Url.
  const libxml2Url = () => (window.CONFIG && CONFIG.libxml2Url) || 'https://cdn.jsdelivr.net/npm/libxml2-wasm@0.7.2/lib/index.mjs';

  /* Textos según formato (no dependen de claves de i18n que dicen "JSON") */
  const FMT_TEXT = {
    es: { drop: (f) => `Arrastra tu fichero ${f} o haz clic para seleccionarlo`, select: 'Selecciona primero un mensaje',
          valid: (f) => `✅ ${f} válido`, invalid: (f) => `❌ El ${f} no cumple el schema`, syntax: (f) => `❌ El ${f} tiene errores de sintaxis` },
    en: { drop: (f) => `Drop your ${f} file or click to select it`, select: 'Select a message first',
          valid: (f) => `✅ Valid ${f}`, invalid: (f) => `❌ The ${f} does not match the schema`, syntax: (f) => `❌ The ${f} has syntax errors` }
  };
  const ft = () => FMT_TEXT[window.LANG] || FMT_TEXT.es;
  const fmtName = (schemaPath) => (/\.xsd$/i.test(schemaPath || '') ? 'XML' : 'JSON');

  const tx = (key, fallback) => {
    const v = typeof t === 'function' ? t(key) : null;
    return v && v !== key ? v : fallback;
  };

  /* ═════════════════════ Utilidades JSON ═════════════════════ */

  // multipleOf decimal exacto (evita falsos errores 0.29 / 0.01)
  function decimal(value) {
    const [mantissa, exp = '0'] = String(value).toLowerCase().split('e');
    const [whole, fraction = ''] = mantissa.split('.');
    const digits = (whole + fraction).replace(/^-/, '').replace(/^0+/, '');
    if (!digits) return { digits: '0', power: 0, negative: false };
    const trimmed = digits.replace(/0+$/, '');
    return { digits: trimmed, power: Number(exp) - fraction.length + digits.length - trimmed.length,
      negative: mantissa.startsWith('-') };
  }
  function decimalMultipleOf(step, value) {
    if (!Number.isFinite(value) || !Number.isFinite(step) || step <= 0) return false;
    const a = decimal(value), b = decimal(step);
    if (a.digits === '0') return true;
    const delta = a.power - b.power;
    if (delta < 0) return false;
    return (BigInt(a.digits) * 10n ** BigInt(delta)) % BigInt(b.digits) === 0n;
  }

  // JSON.parse redondea en silencio algunos importes: se detecta antes de validar
  function parseStrict(text) {
    const source = text.replace(/^\uFEFF/, '');
    const data = JSON.parse(source);
    const tokens = /"(?:\\[\s\S]|[^"\\])*"|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
    for (const match of source.matchAll(tokens)) {
      const raw = match[0];
      if (raw[0] === '"') continue;
      const n = Number(raw), a = decimal(raw), b = Number.isFinite(n) && decimal(n);
      if (!b || a.digits !== b.digits || a.power !== b.power || a.negative !== b.negative) {
        const err = new Error(`El número ${raw} no se puede representar sin cambiar su valor (posición ${match.index + 1}).`);
        err.name = 'PrecisionError';
        throw err;
      }
    }
    return data;
  }

  // JSON formateado + mapa puntero → línea (para resaltar errores en el visor)
  function serializeWithMap(data) {
    const lines = [], map = {};
    const escKey = (k) => String(k).replace(/~/g, '~0').replace(/\//g, '~1');
    function rec(value, ptr, indent, keyPrefix, comma) {
      const pad = '  '.repeat(indent);
      if (value !== null && typeof value === 'object') {
        const isArr = Array.isArray(value);
        const entries = isArr ? value.map((v, i) => [i, v]) : Object.entries(value);
        if (!entries.length) { lines.push(pad + keyPrefix + (isArr ? '[]' : '{}') + (comma ? ',' : '')); map[ptr] = lines.length; return; }
        lines.push(pad + keyPrefix + (isArr ? '[' : '{')); map[ptr] = lines.length;
        entries.forEach(([k, v], i) => rec(v, `${ptr}/${isArr ? k : escKey(k)}`, indent + 1,
          isArr ? '' : `${JSON.stringify(String(k))}: `, i < entries.length - 1));
        lines.push(pad + (isArr ? ']' : '}') + (comma ? ',' : ''));
      } else {
        lines.push(pad + keyPrefix + JSON.stringify(value) + (comma ? ',' : '')); map[ptr] = lines.length;
      }
    }
    rec(data, '', 0, '', false);
    return { lines, map };
  }

  // Mensajes legibles a partir de los errores de Ajv
  const TYPES = { object: 'un objeto', array: 'una lista', number: 'un número', integer: 'un entero',
    string: 'un texto', boolean: 'un booleano', null: 'null' };
  const child = (path, key) => (/^[A-Za-z_$][\w$]*$/.test(key) ? `${path}.${key}`
    : /^(0|[1-9]\d*)$/.test(key) ? `${path}[${key}]` : `${path}[${JSON.stringify(key)}]`);
  const pathOf = (pointer) => (pointer || '').split('/').slice(1)
    .reduce((p, part) => child(p, part.replace(/~1/g, '/').replace(/~0/g, '~')), '$');

  function explain(e) {
    const p = e.params || {};
    let at = pathOf(e.instancePath), ptr = e.instancePath || '', msg;
    switch (e.keyword) {
      case 'required': at = child(at, p.missingProperty); msg = 'falta este campo obligatorio.'; break;
      case 'additionalProperties': at = child(at, p.additionalProperty); ptr += `/${p.additionalProperty}`; msg = 'el schema no admite esta propiedad.'; break;
      case 'type': msg = `se esperaba ${TYPES[p.type] || p.type}.`;
        if (p.type === 'array') msg += ' Si hay un solo elemento, usa [ { … } ].'; break;
      case 'enum': {
        const v = p.allowedValues || [];
        msg = v.length > 20 ? `el valor no pertenece al catálogo (${v.length} códigos).`
          : `valores permitidos: ${v.map((x) => JSON.stringify(x)).join(', ')}.`;
        if (at.endsWith('.CountryCode')) msg += ' Usa el código de dos letras, por ejemplo ES.';
        break;
      }
      case 'const': msg = `el valor debe ser ${JSON.stringify(p.allowedValue)}.`; break;
      case 'format': msg = `formato no válido: ${p.format}.`; break;
      case 'pattern': msg = p.pattern === '\\S' ? 'se requiere al menos un carácter que no sea espacio.' : `no cumple el patrón ${p.pattern}.`; break;
      case 'multipleOf': msg = (e.schema === 0.01) ? 'el importe debe ser múltiplo de 0,01 (sin fracciones de céntimo).' : `se requiere un múltiplo de ${e.schema}.`; break;
      case 'minItems': msg = `la lista requiere al menos ${p.limit} elemento(s).`; break;
      case 'maxItems': msg = `la lista permite como máximo ${p.limit} elemento(s).`; break;
      case 'minLength': msg = `longitud mínima: ${p.limit} caracteres.`; break;
      case 'maxLength': msg = `longitud máxima: ${p.limit} caracteres.`; break;
      case 'minimum': case 'maximum': case 'exclusiveMinimum': case 'exclusiveMaximum':
        msg = `el valor debe cumplir ${p.comparison} ${p.limit}.`; break;
      case 'dependencies': msg = `al informar ${p.property} también se requiere ${p.missingProperty}.`; break;
      case 'not': msg = 'esta combinación de campos no está permitida aquí.'; break;
      case 'anyOf': case 'oneOf': msg = 'debe cumplirse una de las alternativas del schema.'; break;
      default: msg = e.message || `regla no cumplida: ${e.keyword}`;
    }
    return { path: at, pointer: ptr, message: msg };
  }

  /* ═════════════════════ Utilidades XML ═════════════════════ */

  // Mensajes de libxml2 más legibles
  function cleanXmlMessage(msg) {
    return String(msg || '')
      .replace(/^Element '\{[^}]*\}/, "Element '")
      .replace(/\{[^}]*\}/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Ficheros virtuales para que libxml2 resuelva xs:include / xs:import sin red
  let virtualFiles = new Map();
  let providerRegistered = false;
  function registerVirtualFiles(lib, files) {
    files.forEach((contents, path) => virtualFiles.set(path, new TextEncoder().encode(contents)));
    if (providerRegistered || typeof lib.xmlRegisterInputProvider !== 'function') return;
    const open = new Map();
    let next = 1;
    const find = (name) => {
      const clean = String(name).replace(/^file:\/\//, '').replace(/^\/+/, '');
      return virtualFiles.get(clean) || [...virtualFiles.entries()].find(([p]) => clean.endsWith(p) || p.endsWith(clean))?.[1];
    };
    providerRegistered = lib.xmlRegisterInputProvider({
      match: (name) => Boolean(find(name)),
      open: (name) => { const data = find(name); if (!data) return undefined; const fd = next++; open.set(fd, { data, pos: 0 }); return fd; },
      read: (fd, buf) => {
        const f = open.get(fd); if (!f) return -1;
        const n = Math.min(buf.length, f.data.length - f.pos);
        buf.set(f.data.subarray(f.pos, f.pos + n)); f.pos += n; return n;
      },
      close: (fd) => open.delete(fd)
    });
  }

  /* ═════════════════════ Motores ═════════════════════ */

  const compiled = new Map();   // ruta del schema → validador compilado

  const ENGINES = {
    /* ── JSON Schema (Ajv) ─────────────────────────────── */
    json: {
      label: 'JSON Schema',
      async validate(text, schemaPath) {
        let data;
        try { data = parseStrict(text); } catch (e) {
          return { status: e.name === 'PrecisionError' ? 'warning' : 'syntax',
            errors: [{ path: '(raíz)', message: e.message }], viewer: text, lines: [] };
        }
        const validate = await this.compile(schemaPath);
        const { lines, map } = serializeWithMap(data);
        if (validate(data)) return { status: 'valid', errors: [], viewer: lines.join('\n'), lines: [] };
        const unique = new Map();
        (validate.errors || []).filter((e) => e.keyword !== 'if')
          .map(explain).forEach((e) => unique.set(`${e.path}|${e.message}`, e));
        const errors = [...unique.values()];
        // Línea del error: la del propio nodo o, si no existe (campo que falta), la del padre
        const lineOf = (ptr) => { while (ptr && !map[ptr]) ptr = ptr.slice(0, ptr.lastIndexOf('/')); return map[ptr] || map['']; };
        return { status: 'invalid', errors, viewer: lines.join('\n'),
          lines: [...new Set(errors.map((e) => lineOf(e.pointer)).filter(Boolean))] };
      },
      async compile(schemaPath) {
        if (compiled.has(schemaPath)) return compiled.get(schemaPath);
        const schema = JSON.parse(await window.GithubService.getFileText(schemaPath));
        const is2020 = /2019-09|2020-12/.test(schema.$schema || '');
        const [{ default: Ajv }, { default: addFormats }] = await Promise.all([
          import(is2020 ? AJV2020_URL : AJV_URL), import(FORMATS_URL)]);
        const ajv = new Ajv({ allErrors: true, strict: false, strictNumbers: true, ownProperties: true,
          coerceTypes: false, useDefaults: false, removeAdditional: false, validateFormats: true, verbose: true });
        addFormats(ajv, { mode: 'full', keywords: false });
        ajv.removeKeyword('multipleOf');
        ajv.addKeyword({ keyword: 'multipleOf', type: 'number', schemaType: 'number', errors: false,
          metaSchema: { type: 'number', exclusiveMinimum: 0 }, validate: decimalMultipleOf });
        const fn = ajv.compile(schema);
        compiled.set(schemaPath, fn);
        return fn;
      }
    },

    /* ── XML contra XSD (libxml2-wasm) ──────────────────── */
    xsd: {
      label: 'XSD',
      validators: new Map(),   // ruta del XSD → { lib, validator }

      async validate(text, schemaPath) {
        const xml = text.replace(/^\uFEFF/, '');

        // 1. Sintaxis XML (rápido, sin librerías)
        const dom = new DOMParser().parseFromString(xml, 'application/xml');
        const parseError = dom.getElementsByTagName('parsererror')[0];
        if (parseError) {
          return { status: 'syntax', viewer: xml, lines: [],
            errors: [{ path: '(raíz)', message: parseError.textContent.trim().split('\n')[0] }] };
        }

        // 2. Validación contra el XSD
        const { lib, validator } = await this.compile(schemaPath);
        let doc;
        try {
          doc = lib.XmlDocument.fromString(xml);
          validator.validate(doc);
          return { status: 'valid', errors: [], viewer: xml, lines: [] };
        } catch (e) {
          const details = Array.isArray(e.details) && e.details.length ? e.details : [{ message: e.message }];
          const errors = details.map((d) => ({
            path: d.line ? `${tx('val.line', 'Línea')} ${d.line}` : '(raíz)',
            message: cleanXmlMessage(d.message)
          }));
          const lines = [...new Set(details.map((d) => d.line).filter(Boolean))];
          return { status: 'invalid', errors, viewer: xml, lines };
        } finally {
          if (doc) doc.dispose();
        }
      },

      /** Carga la librería, descarga el XSD (y sus include/import) y compila el validador una sola vez */
      async compile(schemaPath) {
        if (this.validators.has(schemaPath)) return this.validators.get(schemaPath);
        const lib = await import(libxml2Url());
        const files = await this.loadSchemas(schemaPath);
        registerVirtualFiles(lib, files);
        const xsdDoc = lib.XmlDocument.fromString(files.get(schemaPath), { url: schemaPath });
        let validator;
        try {
          validator = lib.XsdValidator.fromDoc(xsdDoc);
        } catch (e) {
          const d = (e.details || [])[0];
          throw new Error(`XSD no válido${d && d.line ? ` (línea ${d.line})` : ''}: ${cleanXmlMessage(d ? d.message : e.message)}`);
        } finally {
          xsdDoc.dispose();
        }
        const entry = { lib, validator };
        this.validators.set(schemaPath, entry);
        return entry;
      },

      /** XSD principal + los que importa o incluye (rutas relativas) */
      async loadSchemas(mainPath) {
        const files = new Map();
        const dirOf = (p) => p.slice(0, p.lastIndexOf('/') + 1);
        const normalize = (p) => p.split('/').reduce((acc, part) => {
          if (part === '..') acc.pop(); else if (part !== '.') acc.push(part);
          return acc;
        }, []).join('/');
        const visit = async (path) => {
          if (files.has(path)) return;
          const contents = await window.GithubService.getFileText(path);
          files.set(path, contents);
          const refs = [...contents.matchAll(/<(?:xs|xsd):(?:import|include|redefine)\b[^>]*schemaLocation="([^"]+)"/g)]
            .map((m) => m[1]).filter((loc) => !/^[a-z]+:/i.test(loc));
          for (const loc of refs) await visit(normalize(dirOf(path) + loc));
        };
        await visit(mainPath);
        return files;
      }
    },

    /* ── Schematron (pendiente) ─────────────────────────── */
    schematron: {
      label: 'Schematron',
      async validate() {
        // Aquí irá la validación de reglas de negocio (p. ej. SchXslt + SaxonJS).
        // Debe devolver { status, errors:[{path, message}], viewer, lines }.
        return { status: 'skipped', errors: [], viewer: '', lines: [] };
      }
    }
  };

  /** Motor según la extensión del schema */
  const engineFor = (schemaPath) => (/\.xsd$/i.test(schemaPath) ? 'xsd' : 'json');

  /* ═════════════════════ Interfaz ═════════════════════ */

  let lastFile = null;     // { name, text } — se revalida al cambiar de schema
  let sequence = 0;

  function getOptions() {
    return getAllCards()
      .filter((c) => !c.comingSoon && c.validatorSchema)
      .map((c) => ({ value: c.validatorSchema, label: localizedSectionTitle(c), schematron: c.validatorSchematron || '' }));
  }

  function setupValidator() {
    const sel = document.getElementById('valSchema');
    const dropzone = document.getElementById('dropzone');
    const input = document.getElementById('fileInput');
    if (!sel || !dropzone || !input) {
      console.error('[validator] Faltan #valSchema, #dropzone o #fileInput en el HTML.');
      return;
    }
    const options = getOptions();
    const previous = sel.value;
    sel.innerHTML = `<option value="">${esc(tx('val.selectPlaceholder', 'Selecciona un schema…'))}</option>` +
      options.map((o) => `<option value="${esc(o.value)}" data-sch="${esc(o.schematron)}">${esc(o.label)} · ${ENGINES[engineFor(o.value)].label}</option>`).join('');
    if (options.some((o) => o.value === previous)) sel.value = previous;

    const refresh = () => {
      const on = Boolean(sel.value);
      dropzone.classList.toggle('disabled', !on);
      input.accept = on ? (engineFor(sel.value) === 'xsd' ? '.xml' : '.json') : '';
      const label = dropzone.querySelector('[data-dz-label]') || dropzone.childNodes[0];
      if (label) label.textContent = on
        ? ` ${ft().drop(fmtName(sel.value))} `
        : ` ${ft().select} `;
    };
    sel.onchange = () => { refresh(); if (sel.value && lastFile) run(lastFile); };
    dropzone.onclick = (e) => { if (sel.value && e.target !== input) input.click(); };
    dropzone.onkeydown = (e) => { if ((e.key === 'Enter' || e.key === ' ') && sel.value) { e.preventDefault(); input.click(); } };
    dropzone.ondragover = (e) => { e.preventDefault(); if (sel.value) dropzone.classList.add('dragover'); };
    dropzone.ondragleave = () => dropzone.classList.remove('dragover');
    dropzone.ondrop = (e) => {
      e.preventDefault(); dropzone.classList.remove('dragover');
      if (sel.value && e.dataTransfer.files[0]) readFile(e.dataTransfer.files[0]);
    };
    input.onchange = () => { const f = input.files[0]; input.value = ''; if (f) readFile(f); };

    refresh();
    if (!lastFile) renderSummary('info', '', []);
  }

  async function readFile(file) {
    lastFile = { name: file.name, text: await file.text() };
    run(lastFile);
  }

  async function run(file) {
    const sel = document.getElementById('valSchema');
    const schemaPath = sel.value;
    const engine = engineFor(schemaPath);
    const task = ++sequence;

    // Fichero de otro formato que el schema elegido
    const looksXml = /^\s*(\uFEFF)?</.test(file.text);
    if ((engine === 'xsd') !== looksXml) {
      show({ status: 'warning', viewer: file.text, lines: [], errors: [{ path: file.name,
        message: engine === 'xsd' ? 'El schema elegido es XSD: sube un fichero XML.' : 'El schema elegido es JSON: sube un fichero JSON.' }] });
      return;
    }

    renderSummary('info', `${tx('val.validating', 'Validando')} ${file.name}…`, []);
    try {
      const result = await ENGINES[engine].validate(file.text, schemaPath);
      if (task !== sequence) return;

      // Reglas de negocio (solo si el XSD/JSON es válido y la card tiene Schematron)
      const sch = sel.selectedOptions[0]?.dataset.sch;
      if (result.status === 'valid' && sch) {
        const extra = await ENGINES.schematron.validate(file.text, sch);
        if (extra.status === 'invalid') Object.assign(result, { status: 'invalid', errors: extra.errors, lines: extra.lines });
      }
      show(result);
    } catch (e) {
      if (task === sequence) show({ status: 'warning', viewer: file.text, lines: [],
        errors: [{ path: '(schema)', message: `${tx('vstatus.schemaLoadFail', 'No se pudo cargar el validador o el schema')}: ${e.message}` }] });
    }
  }

  const currentFormat = () => fmtName(document.getElementById('valSchema')?.value);

  const STATUS_TEXT = {
    valid:   () => ft().valid(currentFormat()),
    invalid: () => ft().invalid(currentFormat()),
    syntax:  () => ft().syntax(currentFormat()),
    warning: () => '⚠️ No se ha podido validar'
  };

  function show({ status, errors, viewer, lines }) {
    window._valErrorLines = lines || [];
    renderSummary(status === 'valid' ? 'success' : status === 'warning' ? 'warning' : 'error',
      (STATUS_TEXT[status] || STATUS_TEXT.warning)(), errors);
    renderViewer(viewer);
    // Compatibilidad con elementos antiguos ocultos
    const result = document.getElementById('result'); if (result) result.textContent = (STATUS_TEXT[status] || STATUS_TEXT.warning)();
  }

  function renderSummary(kind, text, errors) {
    const target = document.getElementById('validationSummary');
    if (!target) return;
    const meta = {
      info:    [tx('vmeta.noStatus.badge', 'INFO'),  tx('vmeta.noStatus.title', 'Sin validar')],
      success: [tx('vmeta.ok.badge', 'OK'),          tx('vmeta.ok.title', 'Validación correcta')],
      error:   [tx('vmeta.err.badge', 'ERROR'),      tx('vmeta.err.title', 'Validación con errores')],
      warning: [tx('vmeta.warn.badge', 'AVISO'),     tx('vmeta.warn.title', 'Atención')]
    }[kind];
    const body = text || tx('vmeta.noStatus.text', 'Selecciona un schema y sube un fichero.');
    const fileName = kind !== 'info' && lastFile ? lastFile.name : '';
    const table = errors.length ? `
      <table class="val-err-tbl">
        <thead><tr><th>${tx('vtable.num', '#')}</th><th>${tx('vtable.field', 'Campo')}</th><th>${tx('vtable.error', 'Error')}</th></tr></thead>
        <tbody>${errors.map((e, i) => `<tr><td>${i + 1}</td><td><code>${esc(e.path)}</code></td><td>${esc(e.message)}</td></tr>`).join('')}</tbody>
      </table>` : '';
    target.classList.remove('val-empty');
    target.innerHTML = `
      <div class="val-status-card ${kind}">
        <div class="val-status-head">
          <div>
            <div class="val-status-title">${esc(meta[1])}</div>
            ${fileName ? `<div class="val-status-file" title="${esc(fileName)}">📄 ${esc(fileName)}</div>` : ''}
          </div>
          <div class="val-status-badge">${esc(meta[0])}</div>
        </div>
        <p class="val-status-text">${esc(body)}</p>
      </div>${table}`;
  }

  function renderViewer(text) {
    const cont = document.getElementById('jsonViewerContainer');
    if (!cont) return;
    if (!String(text || '').trim()) { cont.innerHTML = ''; return; }
    // XML: visor propio con números de línea y errores resaltados
    if (/^\s*</.test(text)) {
      const errorLines = new Set(window._valErrorLines || []);
      cont.innerHTML = `
        <div class="code-panel">
          <div class="code-header">${esc(tx('vviewer.title', 'Contenido'))}</div>
          <pre class="code-pre xml-viewer">${String(text).split('\n').map((line, i) =>
            `<span class="xv-line${errorLines.has(i + 1) ? ' xv-error' : ''}" id="xv-${i + 1}"><span class="xv-num">${i + 1}</span>${esc(line)}</span>`).join('\n')}</pre>
        </div>`;
      const first = [...errorLines].sort((a, b) => a - b)[0];
      if (first) document.getElementById(`xv-${first}`)?.scrollIntoView({ block: 'center' });
      return;
    }
    if (typeof window.renderJsonMinimap === 'function') {
      window.renderJsonMinimap(cont, text, window._valErrorLines || [], `<span>${tx('vviewer.title', 'Contenido')}</span>`);
    } else {
      cont.innerHTML = `<pre class="code-pre">${esc(text)}</pre>`;
    }
  }

  window.setupValidator = setupValidator;
  window.ValidatorEngines = ENGINES;   // para enchufar Schematron más adelante
})();
