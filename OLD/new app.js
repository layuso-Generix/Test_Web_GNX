
/* ═══════════════════════════════════════════════════════════════════
   MÓDULO XSD — Renderizado para cards de formato XML / UBL
   
   Cómo funciona:
   · openDocumentation detecta section.format === 'XML' | 'UBL'
   · En vez de parsear JSON Schema, descarga el .xsd con rawFetch
   · Lo parsea con DOMParser (API nativa del navegador)
   · renderEstructuraXsd / renderEnumeracionesXsd usan el DOM del XSD
     para generar los mismos bloques visuales que la versión JSON

   Diferencias respecto al motor JSON:
   · Los "bloques" son xs:complexType y xs:simpleType (no properties JSON)
   · Las "enumeraciones" son xs:simpleType con xs:enumeration
   · Los campos de cada tipo son xs:element hijos del complexType
   · Las descripciones y el orden de tipos vienen de xsdMeta[card.id]
     (diccionario en config.js o aquí abajo) — sin eso se muestra
     todo lo que haya en el XSD, ordenado alfabéticamente
   ═══════════════════════════════════════════════════════════════════ */

  /* ── Estado global ──────────────────────────────────────── */
const XSD_NS = 'http://www.w3.org/2001/XMLSchema';

/* ── Estado del módulo XSD (se resetea con cada apertura de card) ── */
let _xsdDoc  = null;   // Document parseado por DOMParser
let _xsdText = '';     // Texto crudo del XSD (para extraer snippets literales)
let _xsdMeta = {};     // Descripciones por nombre de tipo: { TypeName: { title, es, en } }
let _xsdBlockOrder = [];  // Orden de tipos a mostrar (array de strings con nombres)
let _xsdEnumOrder  = [];  // Orden de enumeraciones a mostrar

/* ── Punto de entrada XSD ────────────────────────────────────────── */

/**
 * Carga el XSD de la card, lo parsea e inyecta en las tabs.
 * Se llama desde openDocumentation cuando section.format es 'XML' o 'UBL'.
 *
 * @param {object} section     - card de SITE_CONFIG
 * @param {object} schemaFile  - { name, path, raw } del primer schema encontrado
 * @param {Array}  examplesData - ejemplos ya cargados
 * @param {string} readmeRaw   - texto del readme (ya cargado)
 */
async function openDocumentationXsd(section, schemaFile, examplesData, readmeRaw) {
  // Reset de estado XSD
  _xsdDoc  = null;
  _xsdText = '';

  // Recuperamos las descripciones registradas para esta card (si las hay)
  const meta = (typeof XSD_META !== 'undefined' && XSD_META[section.id]) || {};
  _xsdMeta       = meta.descriptions  || {};
  _xsdBlockOrder = meta.blockOrder    || [];
  _xsdEnumOrder  = meta.enumOrder     || [];

  if (!schemaFile?.raw) {
    const msg = `No se encontró ningún fichero .xsd en ${section.dir}`;
    ['estructura-body','enumeraciones-body'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = `<p style="color:#cf1322">${msg}</p>`;
    });
    renderDescripcion({
      title: localizedSectionTitle(section),
      description: localizedSectionDesc(section)
    }, readmeRaw, examplesData, section);
    renderEjemplo(examplesData, section);
    return;
  }

  _xsdText = schemaFile.raw;
  const parser = new DOMParser();
  _xsdDoc = parser.parseFromString(_xsdText, 'application/xml');

  // Comprobación de error de parseo del XSD
  const parseErrors = _xsdDoc.getElementsByTagName('parsererror');
  if (parseErrors.length) {
    const errMsg = parseErrors[0].textContent || 'Error desconocido al parsear el XSD';
    document.getElementById('estructura-body').innerHTML =
      `<p style="color:#cf1322">Error al parsear ${schemaFile.name}: ${esc(errMsg)}</p>`;
    return;
  }

  // Descripción general: usamos el schema raíz como fuente de título/desc
  // ya que los XSD no tienen el mismo objeto raíz que un JSON Schema
  const syntheticSchema = {
    title:       localizedSectionTitle(section),
    description: localizedSectionDesc(section),
    'x-cyc-author': 'GENERIX Group Spain'
  };
  renderDescripcion(syntheticSchema, readmeRaw, examplesData, section);
  renderEstructuraXsd(section, schemaFile);
  renderEnumeracionesXsd();
  renderEjemplo(examplesData, section);
}

/* ── Tab Estructura (XSD) ────────────────────────────────────────── */

/**
 * Renderiza la tab "Estructura" para un XSD.
 * - Un bloque por cada xs:complexType / xs:simpleType (excluye enums)
 * - Si hay _xsdBlockOrder, respeta ese orden; si no, orden del fichero
 * - Genera el sidebar de navegación (#snav-btns-estructura)
 */
function renderEstructuraXsd(section, schemaFile) {
  const body = document.getElementById('estructura-body');
  const nav  = document.getElementById('snav-btns-estructura');

  // Encabezado: enlace de descarga del XSD
  const schemaUrl = rawUrl(schemaFile.path);
  let bodyHtml = `
    <p style="margin-bottom:28px">
      <a href="#" onclick="downloadSchema('${esc(schemaFile.name)}'); return false;" class="download-link">
        📥 ${t('struct.download', { file: schemaFile.name })}
      </a><br/>
      <a href="${esc(schemaUrl)}" target="_blank" class="download-link">
        🔗 ${t('struct.view', { file: schemaFile.name })}
      </a>
    </p>`;
  let navHtml = '';

  // Recopilamos todos los complexType y simpleType del documento
  const allTypes = xsdGetAllTypes();

  // Si hay orden definido, lo usamos; si no, todos los tipos excepto enums
  const enumNames = new Set(xsdGetEnumTypeNames());
  const blockNames = _xsdBlockOrder.length
    ? _xsdBlockOrder.filter(n => allTypes.has(n) && !enumNames.has(n))
    : [...allTypes.keys()].filter(n => !enumNames.has(n));

  if (!blockNames.length) {
    body.innerHTML = bodyHtml + `<p style="color:var(--gray-500)">${t('struct.none')}</p>`;
    nav.innerHTML  = '';
    return;
  }

  blockNames.forEach(typeName => {
    const node    = xsdGetTypeNode(typeName);
    if (!node) return;
    const desc    = _xsdMeta[typeName] || {};
    const id      = `xsd-blk-${typeName}`;
    const snippet = xsdExtractSnippet(typeName);
    const kind    = node.localName; // complexType | simpleType

    // Panel derecho: descripción
    const titleText = desc.title || typeName;
    const descEs    = LANG === 'es' ? (desc.es || desc.eng || '') : (desc.eng || desc.es || '');

    // Tech details: tipo, propiedades, requeridos o restricciones
    const techHtml = xsdBuildTechDetails(node, kind);

    // Tabla de campos (solo para complexType)
    const fieldTbl = kind === 'complexType' ? xsdBuildFieldTable(node) : '';

    navHtml  += `<button class="snav-btn" onclick="scrollToBlock('${id}',this)">${esc(typeName)}</button>`;
    bodyHtml += `
      <div class="block-wrap" id="${id}" data-label="${esc(typeName)}">
        <div class="block-grid">
          <div class="code-panel">
            <div class="code-header">${esc(titleText)}</div>
            <pre class="code-pre">${esc(snippet)}</pre>
          </div>
          <div>
            <div class="explanation-box">
              <p>${descEs ? esc(descEs) : `<em style="color:var(--gray-400)">${t('noDesc')}</em>`}</p>
            </div>
            ${techHtml}
          </div>
        </div>
        ${fieldTbl}
        <div class="block-divider"></div>
      </div>`;
  });

  body.innerHTML = bodyHtml;
  nav.innerHTML  = navHtml;
}

/* ── Tab Enumeraciones (XSD) ─────────────────────────────────────── */

/**
 * Renderiza la tab "Enumeraciones" para un XSD.
 * - Un bloque por cada xs:simpleType con xs:enumeration
 * - Si hay _xsdEnumOrder, respeta ese orden; si no, todos los encontrados
 */
function renderEnumeracionesXsd() {
  const body = document.getElementById('enumeraciones-body');
  const nav  = document.getElementById('snav-btns-enumeraciones');

  const allEnumNames = xsdGetEnumTypeNames();
  const enumNames    = _xsdEnumOrder.length
    ? _xsdEnumOrder.filter(n => allEnumNames.includes(n))
    : allEnumNames;

  if (!enumNames.length) {
    body.innerHTML = `<p style="color:var(--gray-500)">${t('enums.none')}</p>`;
    nav.innerHTML  = '';
    return;
  }

  let bodyHtml = '', navHtml = '';

  enumNames.forEach(enumName => {
    const node = xsdGetTypeNode(enumName);
    if (!node) return;

    const desc    = _xsdMeta[enumName] || {};
    const id      = `xsd-enum-${enumName}`;
    const snippet = xsdExtractSnippet(enumName);
    const values  = xsdGetEnumValues(node);
    const usedIn  = xsdGetEnumUsage(enumName);
    const titleText = desc.title || enumName;
    const descEs    = LANG === 'es' ? (desc.es || desc.eng || '') : (desc.eng || desc.es || '');

    // Si la desc tiene formato "A=significado|B=significado", construimos tabla
    const enumTableHtml = xsdBuildEnumTable(desc.enumEs, desc.enumEn, values);

    navHtml  += `<button class="snav-btn" onclick="scrollToBlock('${id}',this)">${esc(enumName)}</button>`;
    bodyHtml += `
      <div class="block-wrap" id="${id}">
        <div class="block-grid">
          <div class="code-panel">
            <div class="code-header">${esc(titleText)}</div>
            <pre class="code-pre">${esc(snippet)}</pre>
          </div>
          <div>
            <div class="explanation-box">
              <p>${descEs ? esc(descEs) : `<em style="color:var(--gray-400)">${t('noDesc')}</em>`}</p>
            </div>
            <div class="tech-details">
              <h4>${t('tech.title')}</h4>
              <p><strong>${t('tech.type')}</strong> <span class="tag-type">xs:simpleType (enum)</span></p>
              ${usedIn.length ? `<p><strong>${t('enums.usedIn')}</strong> ${usedIn.map(u => `<code>${esc(u)}</code>`).join(' ')}</p>` : ''}
              <h4>${t('enums.allowed', { n: values.length })}</h4>
              ${enumTableHtml || values.map(v => `<span class="ev-pill">${esc(v)}</span>`).join('')}
            </div>
          </div>
        </div>
        <div class="block-divider"></div>
      </div>`;
  });

  body.innerHTML = bodyHtml;
  nav.innerHTML  = navHtml;
}

/* ── Helpers de parseo del XSD ───────────────────────────────────── */

/** Devuelve un Map<nombre, nodo> con todos los complexType y simpleType del documento */
function xsdGetAllTypes() {
  const map = new Map();
  if (!_xsdDoc) return map;
  ['complexType', 'simpleType'].forEach(tag => {
    const nodes = _xsdDoc.getElementsByTagNameNS(XSD_NS, tag);
    for (let i = 0; i < nodes.length; i++) {
      const name = nodes[i].getAttribute('name');
      if (name) map.set(name, nodes[i]);
    }
  });
  return map;
}

/** Busca y devuelve el nodo (complexType o simpleType) por nombre */
function xsdGetTypeNode(name) {
  if (!_xsdDoc) return null;
  for (const tag of ['complexType', 'simpleType']) {
    const nodes = _xsdDoc.getElementsByTagNameNS(XSD_NS, tag);
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].getAttribute('name') === name) return nodes[i];
    }
  }
  return null;
}

/** Devuelve los nombres de todos los simpleType que contienen xs:enumeration */
function xsdGetEnumTypeNames() {
  if (!_xsdDoc) return [];
  const result = [];
  const simples = _xsdDoc.getElementsByTagNameNS(XSD_NS, 'simpleType');
  for (let i = 0; i < simples.length; i++) {
    const name = simples[i].getAttribute('name');
    if (!name) continue;
    if (simples[i].getElementsByTagNameNS(XSD_NS, 'enumeration').length > 0) {
      result.push(name);
    }
  }
  return result;
}

/** Extrae los valores de enumeración de un simpleType */
function xsdGetEnumValues(node) {
  const values = [];
  const enNodes = node.getElementsByTagNameNS(XSD_NS, 'enumeration');
  for (let i = 0; i < enNodes.length; i++) {
    values.push(enNodes[i].getAttribute('value') || '');
  }
  return values;
}

/**
 * Extrae el fragmento literal del XSD para un tipo dado (texto verbatim).
 * Lo saca del texto crudo para preservar el formato original.
 */
function xsdExtractSnippet(name) {
  if (!_xsdText) return '';
  for (const tag of ['complexType', 'simpleType']) {
    // Regex que captura el bloque entero <xs:TAG name="NAME" ...>...</xs:TAG>
    const re = new RegExp(
      `[ \\t]*<xs:${tag}\\s+name="${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[\\s\\S]*?</xs:${tag}>`,
      ''
    );
    const m = _xsdText.match(re);
    if (m) return xsdDedent(m[0]);
  }
  return `<!-- ${name} no encontrado -->`;
}

/** Elimina la indentación común de un bloque de texto (como dedent en Python) */
function xsdDedent(s) {
  const lines = s.replace(/\t/g, '    ').split('\n');
  let min = Infinity;
  lines.forEach(l => { if (l.trim()) min = Math.min(min, l.match(/^ */)[0].length); });
  if (!isFinite(min)) min = 0;
  return lines.map(l => l.slice(min)).join('\n').trim();
}

/**
 * Construye el bloque "Detalles Técnicos" para un tipo XSD:
 * - complexType: tipo, propiedades, requeridos
 * - simpleType:  tipo, base xs:, facetas (pattern, length, etc.)
 */
function xsdBuildTechDetails(node, kind) {
  let rows = `<div class="tech-details"><h4>${t('tech.title')}</h4>`;
  rows += `<p><strong>${t('tech.type')}</strong> <span class="tag-type">${kind === 'simpleType' ? 'xs:simpleType' : 'xs:complexType'}</span></p>`;

  if (kind === 'complexType') {
    const elements = xsdGetElements(node);
    const hasAny   = node.getElementsByTagNameNS(XSD_NS, 'any').length > 0;
    if (elements.length) {
      rows += `<p><strong>${t('tech.properties') || 'Propiedades'}</strong> <span class="tag-type">${esc(elements.map(e => e.name).join(', '))}</span></p>`;
      const req = elements.filter(e => e.min !== '0').map(e => e.name);
      rows += req.length
        ? `<p><strong>${t('tech.required')}</strong> <span class="tag-req">${esc(req.join(', '))}</span></p>`
        : `<p><strong>${t('tech.required')}</strong> <span style="color:var(--gray-400);font-size:.85rem">—</span></p>`;
    } else if (hasAny) {
      rows += `<p><strong>${t('tech.properties') || 'Propiedades'}</strong> <span class="tag-type">xs:any (contenido libre)</span></p>`;
    }
  } else {
    // simpleType: base + facetas
    const restriction = node.getElementsByTagNameNS(XSD_NS, 'restriction')[0];
    if (restriction) {
      const base = restriction.getAttribute('base') || '';
      if (base) rows += `<p><strong>Base</strong> <span class="tag-type">${esc(base)}</span></p>`;
      const facetTags = ['length', 'pattern', 'minLength', 'maxLength', 'minInclusive', 'maxInclusive'];
      facetTags.forEach(ft => {
        const nodes = restriction.getElementsByTagNameNS(XSD_NS, ft);
        for (let i = 0; i < nodes.length; i++) {
          rows += `<p><strong>${esc(ft)}</strong> <span class="tag-type">${esc(nodes[i].getAttribute('value') || '')}</span></p>`;
        }
      });
    }
  }

  rows += '</div>';
  return rows;
}

/**
 * Construye la tabla de campos de un xs:complexType.
 * - Columnas: Campo / Descripción / Tipo / Requerido / Restricciones
 * - Lee xs:documentation de cada xs:element como descripción
 * - Detecta si el tipo es enum o bloque conocido para añadir enlace
 */
function xsdBuildFieldTable(node) {
  if (!node || node.localName !== 'complexType') return '';
  const elements = xsdGetElementsDetailed(node);
  if (!elements.length) return '';

  const dash   = '<span style="color:var(--gray-300)">—</span>';
  const enumNs = new Set(xsdGetEnumTypeNames());
  const rows   = elements.map(e => {
    const req  = e.min !== '0';
    const type = e.type || '';
    let restrHtml = dash;

    if (type) {
      if (enumNs.has(type)) {
        // Enlace a la tab Enumeraciones
        restrHtml = `<a href="#" onclick="scrollToBlock('xsd-enum-${esc(type)}', null); return false;"
          style="background:var(--gray-100);color:var(--generix-dark);padding:2px 8px;border-radius:4px;font-family:monospace;font-size:.8rem;text-decoration:none">
          enum: ${esc(type)}</a>`;
      } else if (xsdGetTypeNode(type)) {
        // Enlace al bloque de estructura
        restrHtml = `<a href="#" onclick="scrollToBlock('xsd-blk-${esc(type)}', null); return false;"
          style="background:var(--gray-100);color:var(--generix-dark);padding:2px 8px;border-radius:4px;font-family:monospace;font-size:.8rem;text-decoration:none">
          → ${esc(type)}</a>`;
      } else {
        // Facetas inline (para tipos simples primitivos)
        const tn = xsdGetTypeNode(type);
        if (tn) {
          const restriction = tn.getElementsByTagNameNS(XSD_NS, 'restriction')[0];
          if (restriction) {
            const parts = [];
            ['pattern', 'length', 'minLength', 'maxLength'].forEach(ft => {
              const fn = restriction.getElementsByTagNameNS(XSD_NS, ft);
              for (let i = 0; i < fn.length; i++) parts.push(`${ft}: ${fn[i].getAttribute('value')}`);
            });
            if (parts.length) restrHtml = esc(parts.join(' · '));
          }
        }
      }
    }

    return `<tr>
      <td><span class="tag-req">${esc(e.name)}</span></td>
      <td>${e.doc ? esc(e.doc) : dash}</td>
      <td>${type ? `<span class="tag-type">${esc(type)}</span>` : dash}</td>
      <td>${req ? `<span class="tag-req">${t('yes')}</span>` : `<span style="color:var(--gray-500)">${t('no')}</span>`}</td>
      <td>${restrHtml}</td>
    </tr>`;
  }).join('');

  return `<div class="field-tbl-wrap">
    <table class="field-tbl">
      <thead><tr>
        <th>${t('table.field')}</th><th>${t('table.desc')}</th>
        <th>${t('table.type')}</th><th>${t('table.req')}</th><th>${t('table.constraints')}</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}

/** Lista los xs:element hijos directos de un complexType (solo nombre, tipo, minOccurs, maxOccurs) */
function xsdGetElements(node) {
  const result = [];
  const els = node.getElementsByTagNameNS(XSD_NS, 'element');
  for (let i = 0; i < els.length; i++) {
    const name = els[i].getAttribute('name');
    if (name) result.push({
      name,
      type: els[i].getAttribute('type') || '',
      min:  els[i].getAttribute('minOccurs'),
      max:  els[i].getAttribute('maxOccurs')
    });
  }
  return result;
}

/** Como xsdGetElements pero también extrae xs:documentation de cada elemento */
function xsdGetElementsDetailed(node) {
  const result = [];
  const els    = node.getElementsByTagNameNS(XSD_NS, 'element');
  for (let i = 0; i < els.length; i++) {
    const el   = els[i];
    const name = el.getAttribute('name');
    if (!name) continue;
    let doc = '';
    for (let k = 0; k < el.childNodes.length; k++) {
      const c = el.childNodes[k];
      if (c.nodeType === 1 && c.localName === 'annotation') {
        const d = c.getElementsByTagNameNS(XSD_NS, 'documentation');
        if (d.length) { doc = d[0].textContent.trim(); break; }
      }
    }
    result.push({ name, type: el.getAttribute('type') || '', min: el.getAttribute('minOccurs'), max: el.getAttribute('maxOccurs'), doc });
  }
  return result;
}

/**
 * Determina en qué complexTypes se usa una enumeración.
 * Recorre xs:element con @type === enumName y sube al complexType ancestro.
 * Devuelve array de strings "NombreComplexType.NombreElement".
 */
function xsdGetEnumUsage(enumName) {
  if (!_xsdDoc) return [];
  const usage = [];
  const els   = _xsdDoc.getElementsByTagNameNS(XSD_NS, 'element');
  for (let i = 0; i < els.length; i++) {
    if (els[i].getAttribute('type') !== enumName) continue;
    const elName = els[i].getAttribute('name') || '';
    let ancestor = els[i].parentNode;
    let ctName   = '';
    while (ancestor && ancestor.nodeType === 1) {
      if (ancestor.localName === 'complexType' && ancestor.getAttribute('name')) {
        ctName = ancestor.getAttribute('name');
        break;
      }
      ancestor = ancestor.parentNode;
    }
    usage.push(ctName ? `${ctName}.${elName}` : elName);
  }
  return usage;
}

/**
 * Construye la tabla de valores de una enumeración.
 * Espera strings en formato "A=descripción es|B=descripción" separados por |
 * Si no hay ese formato, devuelve '' y el llamador muestra las píldoras simples.
 */
function xsdBuildEnumTable(enumEs, enumEn, values) {
  function parse(str) {
    if (!str) return [];
    return str.replace(/\.\s*$/, '').split('|').map(item => {
      const [code, ...rest] = item.split('=');
      return { code: (code || '').trim(), desc: rest.join('=').trim() };
    }).filter(it => it.code || it.desc);
  }
  const itemsEs = parse(enumEs);
  const itemsEn = parse(enumEn);
  const rows    = LANG === 'es' ? itemsEs : itemsEn;
  if (!rows.length) return '';

  return `<table class="field-tbl" style="margin-top:8px">
    <thead><tr>
      <th style="width:120px">${t('enums.code') || 'Código'}</th>
      <th>${t('enums.meaning') || 'Significado'}</th>
    </tr></thead>
    <tbody>${rows.map(r =>
      `<tr>
        <td><span class="tag-req">${esc(r.code)}</span></td>
        <td>${esc(r.desc)}</td>
      </tr>`
    ).join('')}</tbody>
  </table>`;
}

/* ── Integración en openDocumentation ───────────────────────────── */
/*
   INSTRUCCIONES DE USO:
   
   En la función openDocumentation, dentro del bloque try{}, sustituye
   la sección de renderizado por esta:

   const isXml = ['XML','UBL'].includes(section.format?.toUpperCase());
   if (renderType === 'Response') {
     renderResponseDocumentation(section, schemasData, examplesData);
   } else if (isXml) {
     await openDocumentationXsd(section, schemasData[0] || null, examplesData, readmeRaw);
   } else if (renderType === 'Status') {
     renderDescripcionStatus(schema, readmeRaw, examplesData, section);
     renderEstructuraStatus(schema, section, schemasData[0]?.name);
     renderEnumeracionesStatus(schema);
     renderEjemploStatus(examplesData, section);
   } else {
     renderDescripcion(schema, readmeRaw, examplesData, section);
     renderEstructura(schema, section, schemasData[0]?.name);
     renderEnumeraciones(schema);
     renderEjemplo(examplesData, section);
   }
*/

/* ── XSD_META: diccionario de descripciones (puedes moverlo a config.js) ──
   
   Estructura:
   window.XSD_META = {
     'invoice-xml': {          // ← id de la card en SITE_CONFIG
       descriptions: {
         InvoiceGNXType: {
           title: '📄 InvoiceGNXType - Raíz del Documento',
           es: 'Tipo raíz del esquema...',
           en: 'Root type of the schema...',
           enumEs: '',         // solo para simpleType con enumeraciones
           enumEn: ''
         },
         InvoiceIssuerTypeEnum: {
           title: '🪪 InvoiceIssuerType - Tipo de Emisor',
           es: 'Identifica quién emite la factura',
           en: 'Identifies who issues the invoice',
           enumEs: 'EM=emisor|RE=receptor|TE=tercero',
           enumEn: 'EM=issuer|RE=recipient|TE=third party'
         }
       },
       blockOrder: ['InvoiceGNXType', 'InvoicesType', ...],   // orden de tipos
       enumOrder:  ['InvoiceIssuerTypeEnum', ...]              // orden de enums
     }
   };
*/