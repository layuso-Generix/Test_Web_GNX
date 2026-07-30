/* =========================================================
   app.js — Lógica principal de la web de E-Invoicing
   
   ESTRUCTURA GENERAL:
   ┌─────────────────────────────────────────────────────┐
   │  VISTAS (views)                                     │
   │  · view-index      → página principal con las cards │
   │  · view-detail     → detalle de Invoice / Status    │
   │  · view-respuestas → vista exclusiva para Response  │
   │  · view-versions   → ficheros de versiones          │
   │  · view-validacion → validador de schemas           │
   └─────────────────────────────────────────────────────┘

   TABS en view-detail (Invoice / Status):
     Descripción · Estructura · Enumeraciones · Ejemplo

   TABS en view-respuestas (Response):
     Una tab por schema encontrado (Ini / Callback / ...)
     → No usa el nav superior de tabs, tiene su propio nav

   FLUJO al abrir una card:
     openByGroup(id)
       ├─ group === 'Invoice'  → openDocumentation(id, 'Invoice')
       ├─ group === 'Status'   → openDocumentation(id, 'Status')
       └─ group === 'Response' → openRespuestaView(id)
   ========================================================= */

/* ── Estado global ──────────────────────────────────────── */
const _VIEWS = ['view-index', 'view-detail', 'view-versions', 'view-validacion', 'view-respuestas'];
let _currentSection = null;   // Card actualmente abierta
let _schemaRaw      = '';     // Raw del schema principal (para descarga)
let _examples       = [];     // Array de ejemplos cargados (por índice)
let _respSchemas    = {};     // { [mid]: { name, raw, path } } para descargar schemas de Response
let _respSections   = {};     // { [mid]: { html, exId, exRaw, ... } }  — estado de cada tab de Response

/* ── Navegación entre vistas ────────────────────────────── */

/** Muestra una vista y oculta las demás. Siempre hace scroll al top. */
function showView(id) {
  _VIEWS.forEach(v => {
    const el = document.getElementById(v);
    if (el) el.style.display = (v === id) ? 'block' : 'none';
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showIndex()     { _currentSection = null; showView('view-index'); document.title = 'Generix · E-Invoicing · Developer Documentation'; }
function showDetail()    { showView('view-detail'); }
function showValidacion(){ showView('view-validacion'); setupValidator(); }

/* ── Acceso a datos de configuración ────────────────────── */

/** Devuelve todos los grupos de SITE_CONFIG */
function getSectionGroups() { return SITE_CONFIG.sections || []; }

/**
 * Aplana todos los grupos en un array de cards,
 * añadiendo a cada card la propiedad sectionName del grupo al que pertenece.
 */
function getAllCards() {
  return getSectionGroups().flatMap(group =>
    (group.cards || []).map(card => ({ ...card, sectionName: group.section }))
  );
}

/** Busca una card por su id */
function findCardById(id) { return getAllCards().find(card => card.id === id); }

/* ── Rutas de ficheros ──────────────────────────────────── */

/** True si el valor ya contiene una ruta completa (con '/') */
function isFullPath(value) { return typeof value === 'string' && value.includes('/'); }

/**
 * Dado el objeto section y un nombre de fichero (o ruta completa),
 * devuelve la ruta relativa al repo.
 * Si ya es ruta completa, la devuelve tal cual.
 */
function resolveFilePath(section, fileNameOrPath) {
  if (!fileNameOrPath) return '';
  if (isFullPath(fileNameOrPath)) return fileNameOrPath;
  return `${section.dir}/${fileNameOrPath}`;
}

/* ── Inicialización ─────────────────────────────────────── */

/**
 * Punto de entrada. Se llama en DOMContentLoaded.
 * - Aplica i18n estático
 * - Renderiza la cuadrícula de cards
 * - Actualiza el contador de la hero section
 * - Muestra/oculta la card de Response según si hay cards de ese grupo
 */
function init() {
  applyStaticI18n();
  renderGrid(SITE_CONFIG.sections);

  const stat = document.getElementById('stat-sections');
  if (stat) stat.textContent = getAllCards().length;

  // La card especial "Respuestas" del índice solo se muestra si hay cards de grupo Response
  const respCard = document.getElementById('resp-card');
  if (respCard) respCard.style.display = getAllCards().some(s => s.group === 'Response') ? '' : 'none';
  
  showIndex();
}

/* ── i18n helpers para títulos de cards ─────────────────── */
function localizedSectionTitle(s) { return s['title_'  + LANG] || s.title_es  || s.title_en  || s.id; }
function localizedSectionDesc(s)  { return s['description_' + LANG] || s.description_es || s.description_en || ''; }

/* ── Renderizado de la cuadrícula de cards ──────────────── */

/**
 * Genera el HTML de todos los grupos y sus cards y lo inyecta en #sectionGrid.
 * Cada card llama a openByGroup(card.id) al hacer clic.
 */
function renderGrid(sections) {
  const grid = document.getElementById('sectionGrid');
  if (!grid) return;
  let html = '';
  
  sections.forEach(group => {
    const groupName = group.section || '';
    const groupId   = _slug(groupName);

      html += `
        <div class="folder-section" id="grp-${esc(groupId)}">
        <h3>
          <span class="card-icon" style="margin-bottom:0;font-size:1.2rem">${esc(group.icon || '📦')}</span>
          ${esc(groupName)}
        </h3>
        <div class="file-grid">`;

      (group.cards || []).forEach(card => {
        html += `
          <div class="card" onclick="openByGroup('${esc(card.id)}')">
            <div class="card-icon">${esc(card.icon || card.format || '')}</div>
            <div class="card-meta">
              <span class="badge badge-${esc(card.group)}">${esc(card.group || '')}</span>
              <span class="badge badge-cat">${esc(card.category || '')}</span>
              <span class="badge badge-${esc(card.format)}">${esc(card.format || '')}</span>
            </div>
            <h3>${esc(localizedSectionTitle(card))}</h3>
            <p>${esc(localizedSectionDesc(card))}</p>
            <span class="card-link">${t('card.viewDoc')}</span>
          </div>`;
  });
    html += `</div></div>`;
  });

  grid.innerHTML = html;
}

/* ── Enrutador de apertura de cards ─────────────────────── */

/**
 * Decide qué función de renderizado llamar según el grupo de la card.
 *
 *  · Invoice  → vista de detalle con tabs (Descripción / Estructura / Enumeraciones / Ejemplo)
 *  · Status   → igual que Invoice (misma vista, mismas tabs)
 *  · Response → vista propia (#view-respuestas), sin tabs del detalle
 */
function openByGroup(sectionId) {
  const section = findCardById(sectionId);
  if (!section) return;
  switch (section.group) {
    case 'Invoice':  return openDocumentation(sectionId, 'Invoice');
    case 'Status':   return openDocumentation(sectionId, 'Status');
    case 'Response': return openRespuestaView(sectionId);
    default:         return openDocumentation(sectionId, 'Invoice');
  }
}

/* ══════════════════════════════════════════════════════════
   VISTA DETALLE — Invoice y Status
   Tabs: Descripción · Estructura · Enumeraciones · Ejemplo
   ══════════════════════════════════════════════════════════ */

/**
 * Carga todos los assets de una card (schema, ejemplos, readme)
 * y rellena la vista de detalle con las 4 tabs.
 *
 * @param {string} sectionId  - id de la card en SITE_CONFIG
 * @param {string} renderType - 'Invoice' | 'Status'
 */
async function openDocumentation(sectionId, renderType) {
  const section = findCardById(sectionId);
  if (!section) return;

  // Guardamos la sección activa y mostramos la vista de detalle
  _currentSection = section; 
  window._currentSection = section;
  showDetail();

  // Reset de tabs: volvemos siempre a "Descripción" al abrir una card
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === 'descripcion'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-descripcion'));

  // Placeholders de carga en el header y en los cuerpos de cada tab
  document.getElementById('detailTitle').textContent = t('loading');
  document.getElementById('d-breadcrumb-name').textContent = localizedSectionTitle(section);
  document.getElementById('detailDescription').textContent = '';
  document.getElementById('detailBadges').innerHTML = '';
  ['desc-body', 'estructura-body', 'enumeraciones-body', 'ejemplo-inner'].forEach(id => {
    const el = document.getElementById(id); 
    if (el) el.innerHTML = `<p style="color:var(--gray-500)">${t('loading')}</p>`;
  });
  ['snav-btns-estructura', 'snav-btns-enumeraciones'].forEach(id => {
    const el = document.getElementById(id); 
    if (el) el.innerHTML = '';
  });

  // Reset de estado global
  _examples    = [];
  _schemaRaw   = '';
  _respSchemas = {};
  _respSections= {};

  try {
    // 1. Listamos los ficheros de la carpeta de la card vía GitHub API
    const assets = await getDirectoryAssets(section.dir);

    // 2. Cargamos en paralelo: readme, schemas y ejemplos
    const readmePath = assets.readmes[LANG]?.path;
    const [readmeRes, schemaResults, exResults] = await Promise.all([
      readmePath ? rawFetch(readmePath) : Promise.resolve(null),
      Promise.allSettled((assets.schemas   || []).map(f => rawFetch(f.path))),
      Promise.allSettled((assets.examples  || []).map(f => rawFetch(f.path)))
    ]);

    // 3. Parseamos schemas: cada uno puede ser JSON (se localiza) o XSD (texto plano)
    const schemasData = (assets.schemas || []).map((f, i) => {
      const raw = schemaResults[i].status === 'fulfilled' ? schemaResults[i].value : null;
      let schema = null;
      if (raw && _ext(f.path) === 'json') {
        try { schema = localizeNode(JSON.parse(raw)); } catch { schema = null; }
      }
      return { name: f.name, path: f.path, raw, schema, file: f };
    }).filter(s => s.raw !== null);

    // 4. Guardamos ejemplos con su raw
    const examplesData = (assets.examples || []).map((f, i) => ({ 
      name: f.name, 
      raw:  exResults[i].status === 'fulfilled' ? exResults[i].value : null,
      path: f.path,
      file: f
    })).filter(e => e.raw !== null);

    // 5. Usamos el primer schema como principal; si no hay, construimos uno mínimo con el título de la card
    const schema = schemasData[0]?.schema || {
      title:       localizedSectionTitle(section),
      description: localizedSectionDesc(section)
    };
    _schemaRaw = schemasData[0]?.raw || '';

    // 6. Relleno del header de la vista de detalle
    document.title = `Generix · ${localizedSectionTitle(section)} · Developer Documentation`;
    document.getElementById('detailTitle').textContent       = schema.title || localizedSectionTitle(section);
    document.getElementById('d-breadcrumb-name').textContent = localizedSectionTitle(section);
    document.getElementById('detailDescription').textContent = schema['x-cyc-author'] || 'GENERIX Group Spain';
    document.getElementById('detailBadges').innerHTML = [
      `<span class="method-badge ${esc(section.group)}">${esc(section.group || '')}</span>`,
      `<span class="method-badge category">${esc(section.category || '')}</span>`,
      `<span class="method-badge ${esc(section.format)}">${esc(section.format || '')}</span>`,
      `<span class="method-badge category">${esc((schema['x-cyc-endpoint'] || {}).releaseDate || '')}</span>`
    ].join('');

    // 7. Renderizamos las 4 tabs según el tipo
    //    Invoice y Status usan exactamente las mismas funciones de render.
    //    Si en el futuro Status necesita una vista diferente, sólo hay que
    //    cambiar las llamadas dentro del bloque 'Status'.
    if (renderType === 'Status') {
      renderDescripcion(schema, readmeRes, examplesData, section);
      renderEstructura(schema, section, schemasData[0]?.name);
      renderEnumeraciones(schema);
      renderEjemplo(examplesData, section);
    } else {
      // Invoice (y cualquier tipo no reconocido)
      renderDescripcion(schema, readmeRes, examplesData, section);
      renderEstructura(schema, section, schemasData[0]?.name);
      renderEnumeraciones(schema);
      renderEjemplo(examplesData, section);
    }

  } catch (err) {
    document.getElementById('detailTitle').textContent       = t('detail.errorLoad');
    document.getElementById('detailDescription').textContent = err.message;
    document.getElementById('desc-body').innerHTML = `<p style="color:#cf1322">${esc(err.message)}</p>`;
  }
}

/* ── GitHub API helpers ─────────────────────────────────── */

/**
 * Lista el contenido de una carpeta del repo via GitHub Contents API.
 * Devuelve array de objetos { name, path, type, ... }
 */
async function listFolder(folder) {
  const url = `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${folder}?ref=${CONFIG.branch}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error cargando carpeta ${folder}`);
  return res.json();
}

/**
 * Clasifica los ficheros de una carpeta en:
 *  - readmes:  { [lang]: file }  — readme.es.md → readmes['es']
 *  - schemas:  ficheros que contienen 'schema' en el nombre o terminan en .xsd
 *  - examples: ficheros que contienen 'ejemplo' o 'example'
 *  - others:   el resto
 */
async function getDirectoryAssets(folder) {
  const files = await listFolder(folder);
  const result = { schemas: [], examples: [], readmes: {}, others: [] };

    files.forEach(file => {
    const lower = file.name.toLowerCase();

    // readme.<lang>.md  →  readmes['es'], readmes['en'], etc.
        const readmeMatch = lower.match(/^readme\.([a-z]{2})\.md$/);
        if (readmeMatch) { result.readmes[readmeMatch[1]] = file; return; }

    // Schema (JSON o XSD)
    if (lower.includes('schema') || lower.endsWith('.xsd')) { result.schemas.push(file); return; }

    // Ejemplos / examples
    if (lower.includes('ejemplo') || lower.includes('example')) { result.examples.push(file); return; }

        result.others.push(file);
    });

    return result;
}
function renderDescripcion(schema, readmeText, examplesData, section) {
  let html = '';
  html += `<h2>${esc(schema.title || localizedSectionTitle(section) || t('desc.overview'))}</h2>`;
  if (schema.description) html += `<p>${esc(schema.description)}</p>`;
  const specs = [];
  const ep     = schema['x-cyc-endpoint'] || {};
  if (section.format)   specs.push({ label:t('spec.format'),       value: section.format });
  if (section.category) specs.push({ label:t('spec.category'),     value: section.category });
  if (ep.method)        specs.push({ label:t('spec.method'),       value: ep.method });
  if (ep.comunication)  specs.push({ label:t('spec.comunication'), value: ep.comunication });
  if (ep.version)       specs.push({ label:t('spec.version'),      value: ep.version });
  if (ep.releaseDate)   specs.push({ label:t('spec.releaseDate'),  value: ep.releaseDate });
  if (ep.path)          specs.push({ label:t('spec.path'),         value: ep.path });
  (examplesData || []).forEach((ex, i) => specs.push({ label: examplesData.length > 1 ? t('spec.exampleN',{n:i+1}) : t('spec.example'), value: ex.name, dlIdx: i }));

  if (specs.length) 
    html += `<div class="spec-card">${specs.map(s =>
        `${s.dlIdx === 0 ? '<div style="flex-basis:100%;height:0;margin:0"></div>' : ''}<div class="spec-item">
          <span class="spec-label">${esc(s.label)}</span>
          ${s.dlIdx !== undefined
            ? `<span class="spec-value">
                <a href="#" onclick="downloadExample(${s.dlIdx},'${esc(s.value)}');return false;" 
                class="download-link" style="font-family:monospace;font-size:.85rem">${esc(s.value)}</a>
                </span>`
            : `<span class="spec-value">${esc(s.value)}</span>`}
        </div>`
      ).join('')}</div>`;
  if (readmeText) html += simpleMarkdown(readmeText, true);
  else html += `<div class="info-box"><strong>${t('desc.noCustom.title')}</strong>${t('desc.noCustom.body', { name: esc(schema.title || t('desc.thisEndpoint')) })}</div>`;
  document.getElementById('desc-body').innerHTML = html;
}
function renderEstructura(schema, section, schemaFileName) {
  const body = document.getElementById('estructura-body');
  const nav = document.getElementById('snav-btns-estructura');
  if (!schemaFileName) {
    body.innerHTML = `<div class="file-grid">${(section.files||[]).map((f,i)=>renderFileCard(f,i,'struct')).join('')}</div>`;
    nav.innerHTML = '';
    return;
  }
  if (_ext(schemaFileName) !== 'json') {
    body.innerHTML = `
    <p style="margin-bottom:28px">
    <a href="${esc(rawUrl(localFilePath(section,schemaFileName)))}" target="_blank" class="download-link">
    ${t('struct.view',{file:schemaFileName})}</a>
    </p>
    <div class="file-grid">${(section.files||[]).map((f,i)=>renderFileCard(f,i,'struct')).join('')}</div>`;
    nav.innerHTML = '';
    return;
  }
  const defs = schema.$defs || schema.definitions || {};
  const blocks = extractBlocks(schema, defs);
  if (!blocks.length) { body.innerHTML = `<p style="color:var(--gray-500)">${t('struct.none')}</p>`; return; }
  let bodyHtml = `<p style="margin-bottom:28px"><a href="#" onclick="downloadSchema('${esc(schemaFileName)}'); return false;" class="download-link">${t('struct.download',{file:schemaFileName})}</a><br/><a href="${esc(rawUrl(localFilePath(section,schemaFileName)))}" target="_blank" class="download-link">${t('struct.view',{file:schemaFileName})}</a></p>`;
  let navHtml = '';
  blocks.forEach((blk, i) => {
    const id = `blk-${i}`;
    const snippet = JSON.stringify({ [blk.jsonKey || blk.label]: blk.schemaSnippet }, null, 2);    
    const fieldTbl = buildResponseFieldTable(blk);
    navHtml += `<button class="snav-btn" onclick="scrollToBlock('${id}',this)">${esc(blk.label.replace(/Wrapper$/i, ''))}</button>`;
    bodyHtml += `<div class="block-wrap" id="${id}" data-label="${esc(blk.label)}"><div class="block-grid"><div class="code-panel"><div class="code-header">${esc(blk.label)}</div><pre class="code-pre">${esc(snippet)}</pre></div><div><div class="explanation-box"><p>${esc(blk.description || t('noDesc'))}</p></div><div class="tech-details"><h4>${t('tech.title')}</h4><p><strong>${t('tech.type')}</strong> <span class="tag-type">${esc(blk.type || 'object')}</span></p>${blk.required && blk.required.length ? `<p><strong>${t('tech.required')}</strong> <span class="tag-req">${esc(blk.required.join(', '))}</span></p>` : ''}${blk.constraints ? `<p><strong>${t('tech.constraints')}</strong> ${esc(blk.constraints)}</p>` : ''}</div></div></div>${fieldTbl}<div class="block-divider"></div></div>`;
  });
  body.innerHTML = bodyHtml;
  nav.innerHTML = navHtml;
}
function extractBlocks(schema, defs) {
  const blocks = [];
  for (const [key, raw] of Object.entries(schema.properties || {})) {
    const prop = resolveRef(raw, defs);
    const type = prop.type || 'object';
    if (type === 'array' && prop.items) {
      const cons = [prop.minItems != null ? `minItems: ${prop.minItems}` : '', prop.maxItems != null ? `maxItems: ${prop.maxItems}` : ''].filter(Boolean).join(' · ');
      blocks.push({ label:key, type:'array', description:prop.description || '', schemaSnippet:trimSchema(prop, false), properties:{}, required:[], constraints:cons });
      const items = resolveRef(prop.items, defs);
      if (items.properties) blocks.push({ label:`${key}[ ] — campos principales`, jsonKey:key, type:'object', description:items.description || '', schemaSnippet:trimSchema(items, true), properties:items.properties, required:items.required || [] });
    } else if (type === 'object' && prop.properties) {
      blocks.push({ label:key, type:'object', description:prop.description || '', schemaSnippet:trimSchema(prop, true), properties:prop.properties, required:prop.required || [] });
    } else {
      blocks.push({ label:key, type:type, description:prop.description || '', schemaSnippet:trimSchema(prop, true), properties:{ [key]: prop }, required:(schema.required||[]).includes(key)?[key]:[] });
    }
  }
  const added = new Set(blocks.map(b=>b.label));
  for (const [name, def] of Object.entries(defs)) if (def && def.type === 'object' && def.properties && !added.has(name)) blocks.push({ label:name, type:'object', description:def.description || '', schemaSnippet:trimSchema(def,true), properties:def.properties, required:def.required || [] });
  return blocks;
}
function resolvePointer(ref, schema) { if (!ref || !ref.startsWith('#/')) return null; return ref.slice(2).split('/').reduce((n,p)=>n&&n[p], schema) || null; }
function resolveRef(prop, defs) { if (!prop || !prop.$ref) return prop || {}; const name = prop.$ref.replace(/^#\/(\$defs|definitions)\//, ''); return (defs && defs[name]) || prop; }
function trimSchema(prop, trimEnums) { const clone = JSON.parse(JSON.stringify(prop)); if (!trimEnums) return clone; (function trim(obj){ if(!obj||typeof obj!=='object')return; if(Array.isArray(obj.enum)&&obj.enum.length>12)obj.enum=obj.enum.slice(0,5).concat([`... +${obj.enum.length-5} values`]); Object.values(obj).forEach(v=>{if(typeof v==='object')trim(v);}); })(clone); return clone; }
function buildResponseFieldTable(schema) {
  const dash = '<span style="color:var(--gray-300)">—</span>';
  const rows = [];
  function resolve(p){ return (p && p.$ref) ? (resolvePointer(p.$ref, schema) || p) : (p || {}); }

  function walk(props, required, depth) {
    required = required || [];
    for (const [field, raw] of Object.entries(props || {})) {
      const def  = resolve(raw);
      const type = getFieldType(raw);
      const cons = getFieldCons(raw);
      const isReq = required.includes(field);

      let refTarget = '';
      if (raw && raw.$ref) refTarget = raw.$ref;
      else if (raw && raw.items && raw.items.$ref) refTarget = raw.items.$ref;

      let refLink = '';
      if (refTarget && refTarget.includes('/Enums/')) {
        const displayName = refTarget.split('/').pop().replace(/^Enum/, '');
        const estilo = 'background:var(--gray-100);color:var(--generix-dark);padding:2px 8px;border-radius:4px;font-family:monospace;font-size:.8rem';
        refLink = `<span style="${estilo}">enum: ${esc(displayName)}</span>`;
      }

      const restrParts = [cons, refLink].filter(Boolean);
      const restrHtml = restrParts.length ? restrParts.join('<div style="height:6px"></div>') : dash;

      const desc = (raw && raw.description) || def.description || '';
      const indent = 8 + depth * 22;
      const arrow = depth > 0 ? '<span class="rf-arrow">↳</span>' : '';

      rows.push(`<tr>
        <td style="padding-left:${indent}px"><span class="rf-name-wrap">${arrow}<span class="tag-req">${esc(field)}</span></span></td>
        <td>${desc ? esc(desc) : dash}</td>
        <td>${type ? `<span class="tag-type">${esc(type)}</span>` : dash}</td>
        <td>${isReq ? `<span class="tag-req">${t('yes')}</span>` : `<span style="color:var(--gray-500)">${t('no')}</span>`}</td>
        <td>${restrHtml}</td>
      </tr>`);

      if (def.type === 'object' && def.properties) {
        walk(def.properties, def.required, depth + 1);
      } else if (def.type === 'array' && def.items) {
        const items = resolve(def.items);
        if (items.properties) walk(items.properties, items.required, depth + 1);
      }
    }
  }
  walk(schema.properties, schema.required, 0);
  if (!rows.length) return '';
  return `<div class="field-tbl-wrap">
    <table class="field-tbl">
      <thead><tr><th>${t('table.field')}</th><th>${t('table.desc')}</th><th>${t('table.type')}</th><th>${t('table.req')}</th><th>${t('table.constraints')}</th></tr></thead>
      <tbody>${rows.join('')}</tbody>
    </table></div>`;
}

function getFieldType(def) { if(!def)return''; if(def.$ref)return def.$ref.split('/').pop(); let typ=def.type; if(Array.isArray(typ))typ=typ.join(' | '); if(typ==='array'&&def.items){const it=def.items.$ref?def.items.$ref.split('/').pop():(def.items.type||''); return it?`array<${it}>`:'array';} if(!typ&&Array.isArray(def.enum))return'enum'; return typ||''; }
function getFieldCons(def) { if(!def)return''; const c=[]; ['minLength','maxLength','minimum','maximum','minItems','maxItems','format','pattern'].forEach(k=>{ if(def[k]!=null)c.push(`${k}: ${def[k]}`); }); if(def.default!==undefined)c.push(`default: ${JSON.stringify(def.default)}`); return c.map(esc).join('<br>'); }
function renderEnumeraciones(schema) {
  const enums = extractEnums(schema);
  if (!enums.length) { document.getElementById('enumeraciones-body').innerHTML = `<p style="color:var(--gray-500)">${t('enums.none')}</p>`; return; }
  let bodyHtml = '', navHtml = '';
  enums.forEach((en, i) => {
    const id = `enum-${i}`; const snippet = JSON.stringify({ [en.defName]: en.raw }, null, 2);
    navHtml += `<button class="snav-btn" onclick="scrollToBlock('${id}',this)">${esc(en.field)}</button>`;
    bodyHtml += `<div class="block-wrap" id="${id}"><div class="block-grid"><div class="code-panel"><div class="code-header">${esc(en.field)}</div><pre class="code-pre">${esc(snippet)}</pre></div><div><div class="explanation-box"><p>${esc(en.description || t('noDesc'))}</p></div><div class="tech-details"><p><strong>${t('enums.usedIn')}</strong> <code>${esc(en.path)}</code></p><h4>${t('enums.allowed',{n:en.values.length})}</h4><div class="enum-val-wrap">${en.values.map(v=>`<span class="ev-pill">${esc(String(v))}</span>`).join('')}</div></div></div></div><div class="block-divider"></div></div>`;
  });
  document.getElementById('enumeraciones-body').innerHTML = bodyHtml;
  document.getElementById('snav-btns-enumeraciones').innerHTML = navHtml;
}
function extractEnums(schema) {
  const results=[]; const seen=new Set();
  function walk(obj,path,refName){ 
    if(!obj||typeof obj!=='object')return; 
    if(obj.$ref){const r=resolvePointer(obj.$ref,schema); 
    if(r)walk(r,path,obj.$ref.split('/').pop()); return;} 
    if(Array.isArray(obj.enum)){const key=path.split('.').pop().replace('[]',''); 
    if(!seen.has(path)){seen.add(path);results.push({field:key,path,type:obj.type||'string',description:obj.description||'',values:obj.enum,default:obj.default,raw:obj,defName:refName||key});} return;} 
    if(obj.properties)for(const[k,v]of Object.entries(obj.properties))walk(v,path?`${path}.${k}`:k); 
    if(obj.items)walk(obj.items,`${path}[]`); 
    if(obj.$defs)for(const[k,v]of Object.entries(obj.$defs))walk(v,k); 
    if(obj.definitions)for(const[k,v]of Object.entries(obj.definitions))walk(v,k); }
  walk(schema,''); return results;
}
function renderEjemplo(examples, section) {
  _examples=[]; const inner=document.getElementById('ejemplo-inner');
  const allExamples = examples && examples.length ? examples : (section.files || []).map(f => ({name:f.name, path:f.path, raw:null, file:f}));
  if (!allExamples.length) { inner.innerHTML = `<p style="color:var(--gray-500)">${t('example.none')}</p>`; return; }
  let html='<div class="ejemplo-grid">';
  allExamples.forEach((ex,i)=>{
    if(ex.raw!=null)_examples.push(_ext(ex.name)==='json'?fmtJSON(ex.raw):ex.raw); else _examples.push(null);
    const pid=`ex-code-${i}`;
    html+=`<div class="file-card" style="margin-bottom:18px">
    <div class="file-card__head">
      <div class="file-card__icon">${_fileIcon(ex.name)}</div>
      <div>
        <div class="file-card__name">${esc(ex.name)}</div>
        <div class="file-card__meta">${esc((_ext(ex.name)||'file').toUpperCase())}</div>
      </div>
    </div>
    <div class="file-card__actions">
      <a class="file-btn file-btn--primary" href="${esc(rawUrl(ex.path || localFilePath(section, ex.name)))}" download>${t('btn.download')}</a>
      <a class="file-btn" target="_blank" href="${esc(rawUrl(ex.path || localFilePath(section, ex.name)))}">${t('btn.viewGithub')}</a>
      <button class="file-btn" onclick="toggleExampleCode('${pid}', this, '${esc(ex.path || localFilePath(section, ex.name))}', ${i})">
        ${t('btn.viewContent')}</button>
    </div>
    <div class="ejemplo-cp" id="${pid}" style="display:none;margin-top:6px"></div></div>`;
  });
  html+='</div>'; inner.innerHTML=html;
}
async function toggleExampleCode(pid, btn, path, idx) {
  const el=document.getElementById(pid); if(!el)return; const open=el.style.display!=='none'; el.style.display=open?'none':'block'; btn.textContent=open?t('btn.viewContent'):t('btn.hide'); const card=el.closest('.file-card'); if(card)card.classList.toggle('expanded',!open);
  if(!open&&!el.dataset.rendered){let raw=_examples[idx]; if(raw==null){raw=await rawFetch(path); if(_ext(path)==='json')raw=fmtJSON(raw); _examples[idx]=raw;} renderJsonMinimap(el, raw, [], `<span>${esc(path.split('/').pop())}</span><button class="copy-btn" onclick="copyExample(${idx}, this)">${t('btn.copy')}</button>`); el.dataset.rendered='1';}
}

/* ═══ VISTA RESPONSE ═══ */
function tx(key, fallback, params) {
  const value = t(key, params || {});
  return value && value !== key ? value : fallback;
}
function responseMidFromName(name, i) {
  const lower = String(name || '').toLowerCase();
  if (lower.includes('initial') || lower.includes('inicio') || lower.includes('ini')) return 'ini';
  if (lower.includes('callback') || lower.includes('cb')) return 'cb';
  return `resp-${i}`;
}
function responseLabel(schema, item, mid) {
  const name = item?.name || '';
  const lower = name.toLowerCase();
  if (mid === 'ini' || lower.includes('initial') || lower.includes('inicio')) return tx('resp.labelIni', 'Respuesta inicial');
  if (mid === 'cb' || lower.includes('callback')) return tx('resp.labelCb', 'Callback');
  return schema?.title || name || mid;
}
function matchResponseExample(schemaItem, examplesData) {
  const schemaName = (schemaItem?.name || '').toLowerCase();
  const clean = s => String(s || '').toLowerCase().replace(/schema|example|ejemplo|json|xsd|xml|\.|_|-/g, '');
  const byKeyword = examplesData.find(ex => {
    const n = ex.name.toLowerCase();
    return  (schemaName.includes('initial')  && n.includes('initial'))  ||
            (schemaName.includes('callback') && n.includes('callback')) ||
            (schemaName.includes('inicio')   && n.includes('inicio'));
  });
  if (byKeyword) return byKeyword;
  return examplesData.find(ex => clean(ex.name) && clean(schemaItem?.name).includes(clean(ex.name))) || examplesData[0] || null;
}
function renderResponseDocumentation(section, schemasData, examplesData) {
  const desc = document.getElementById('desc-body');
  const estructura = document.getElementById('estructura-body');
  const enumeraciones = document.getElementById('enumeraciones-body');
  const ejemplo = document.getElementById('ejemplo-inner');
  const navEstructura = document.getElementById('snav-btns-estructura');
  const navEnums = document.getElementById('snav-btns-enumeraciones');

  if (estructura) estructura.innerHTML = `<p style="color:var(--gray-500)">${tx('resp.msgStruct', 'La estructura se muestra dentro de la vista de respuestas.')}</p>`;
  if (enumeraciones) enumeraciones.innerHTML = `<p style="color:var(--gray-500)">${tx('resp.enums', 'Las enumeraciones se muestran dentro de la vista de respuestas.')}</p>`;
  if (ejemplo) ejemplo.innerHTML = `<p style="color:var(--gray-500)">${tx('resp.example', 'Los ejemplos se muestran dentro de la vista de respuestas.')}</p>`;
  if (navEstructura) navEstructura.innerHTML = '';
  if (navEnums) navEnums.innerHTML = '';

  if (!schemasData.length) {
    desc.innerHTML = `<div class="highlight-box"><strong>${tx('resp.noSchemas.title', 'No se han encontrado schemas de respuesta')}</strong><br>${tx('resp.noSchemas.body', `Revisa la carpeta ${section.dir}.`, { dir: esc(section.dir) })}</div>`;
    return;
  }

  const sections = schemasData.map((item, i) => {
    const mid = responseMidFromName(item.name, i);
    const ex = matchResponseExample(item, examplesData);
    return renderRespuestaSection(item.schema || {}, ex?.raw || null, ex?.name || '', mid, item);
  });

  _respSections = {};
  sections.forEach(s => { _respSections[s.mid] = s; });

  const nav = sections.map((s, i) => {
    const label = responseLabel(s.schema, s.schemaLink, s.mid);
    return `<button class="tab-btn ${i === 0 ? 'active' : ''}" onclick="showRespTab('${s.mid}', this)">${esc(label)}</button>`;
  }).join('');

  const panels = sections.map((s, i) =>
    `<div class="tab-panel ${i === 0 ? 'active' : ''}" id="resp-panel-${s.mid}">${s.html}</div>`
  ).join('');

  desc.innerHTML = `
    ${sections.length > 1 ? `<div class="tab-nav-outer"><div class="tab-nav-inner"><div class="tab-nav">${nav}</div></div></div>` : ''}
    ${panels}
  `;

  if (sections.length) renderRespExample(sections[0].mid);
}

function renderRespuestaSection(schema, exRaw, exName, mid, schemaLink) {
  const r = schema['x-cyc-response'] || {};
  const title = schema.title || tx('resp.response', 'Respuesta');
  const headHtml = `
    <div class="resp-block-head">
      <h2>${esc(title)}</h2>
      <p>${esc(schema.description || '')}</p>
      ${r.transport ? `<div class="resp-transport">${esc(r.transport)}</div>` : ''}
    </div>`;
  _respSchemas[mid] = { name: schemaLink?.name || `${mid}.json`, raw: schemaLink?.raw || '', path: schemaLink?.path || '' };
  let cardHtml = '';
  if (schemaLink && schemaLink.name) {
    const ghUrl = `https://github.com/${CONFIG.owner}/${CONFIG.repo}/blob/${CONFIG.branch}/${schemaLink.path.split('/').map(encodeURIComponent).join('/')}`;
    cardHtml = `<div class="file-card" style="margin:0">
      <div class="file-card__head">
        <div class="file-card__icon">🟨</div>
        <div>
          <div class="file-card__name">${esc(schemaLink.name)}</div>
          <div class="file-card__meta">JSON · Schema</div>
        </div>
      </div>
      <div class="file-card__actions">
        <a class="file-btn file-btn--primary" href="#" onclick="downloadRespSchema('${mid}');return false;">${t('btn.download')}</a>
        <a class="file-btn" target="_blank" href="${esc(ghUrl)}">${t('btn.viewGithub')}</a>
        <button class="file-btn" onclick="toggleRespSchema('${mid}', this)">${t('btn.viewContent')}</button>
      </div>
      <div class="resp-schema-cp" id="resp-schema-${mid}" style="display:none;margin-top:6px"></div>
    </div>`;
  }

  let h = `<div class="resp-block">`;
  h += cardHtml
    ? `<div class="resp-block-top">${headHtml}${cardHtml}</div>`
    : headHtml;

  const codes = schema['x-cyc-status-codes'];
  if (Array.isArray(codes) && codes.length) {
    h += `<div class="resp-sub">${tx('resp.httpCodes', 'Códigos HTTP')}</div>
      <table class="status-tbl"><thead><tr><th style="width:90px">${tx('enums.code', 'Código')}</th><th style="width:150px">${tx('resp.state', 'Estado')}</th><th>${tx('enums.meaning', 'Significado')}</th></tr></thead><tbody>`;
    h += codes.map(cc => {
      const cls = String(cc.code)[0] === '2' ? 'status-2xx' : String(cc.code)[0] === '4' ? 'status-4xx' : 'status-5xx';
      return `<tr><td><span class="status-code ${cls}">${esc(cc.code)}</span></td><td>${esc(cc.label || '')}</td><td>${esc(cc.meaning || '')}</td></tr>`;
    }).join('');
    h += `</tbody></table>`;
  }

  const fieldTbl = buildResponseFieldTable(schema);
  if (fieldTbl) {
    h += `<div class="resp-sub">${tx('resp.msgStruct', 'Estructura del mensaje')}</div>${fieldTbl}`;
  }

  const enums = extractEnums(schema);
  if (enums.length) {
    h += `<div class="resp-sub">${tx('resp.enums', 'Enumeraciones')}</div>`;
    enums.forEach(en => {
      const parsed = parseEnumMeanings(en.description, en.values);
      const body = parsed.rows.length
        ? `<table class="field-tbl" style="margin-top:6px">
          <thead><tr>
            <th style="width:120px">${tx('enums.code', 'Código')}</th>
            <th>${tx('enums.meaning', 'Significado')}</th>
          </tr></thead>
          <tbody>${parsed.rows.map(rr => `<tr>
              <td><span class="tag-req">${esc(rr.code)}</span></td>
              <td>${esc(rr.meaning)}</td></tr>`).join('')}
          </tbody></table>`
        : en.values.map(v => `<span class="ev-pill">${esc(String(v))}</span>`).join(' ');
      h += `<div style="margin-bottom:16px"><div style="font-weight:600;margin-bottom:4px">${esc(en.field)}</div>
      ${parsed.general ? `<div style="color:var(--gray-500);font-size:.9rem;margin-bottom:6px">${esc(parsed.general)}</div>` : ''}${body}</div>`;
    });
  }

  const exId = `resp-ex-${mid}`;
  h += `<div class="resp-sub">${tx('resp.example', 'Ejemplo')}</div><div id="${exId}"></div></div>`;
  return { html: h, exId, exRaw, exName, mid, schema, schemaLink };
}
function renderRespExample(mid) {
  const s = _respSections[mid]; 
  if (!s) return;
  const el = document.getElementById(s.exId); 
  if (!el || el.dataset.rendered) return;
  el.dataset.rendered = '1';
  if (!s.exRaw) { 
    el.innerHTML = `<p style="color:var(--gray-500)">${tx('resp.noExample', 'No hay ejemplo disponible.')}</p>`; 
    return; 
  }
  if (typeof renderJsonMinimap === 'function') {
    renderJsonMinimap(el, s.exRaw, [], `<span>${esc(s.exName || 'JSON')}</span>`);
  } else {
    el.innerHTML = 
    `<div style="background:var(--gray-900);border-radius:10px;padding:18px;overflow:auto">
      <pre style="margin:0;color:#e2e8f0;font-family:'Courier New',monospace;font-size:.84rem">
        ${esc(fmtJSON(s.exRaw))}</pre></div>`;
  }
}
function showRespTab(mid, btn) {
  const root = document.getElementById('desc-body');
  if (!root) return;
  root.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
  root.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `resp-panel-${mid}`));
  renderRespExample(mid);
}
function downloadRespSchema(mid) {
  const s = _respSchemas[mid];
  if (!s || !s.raw) return;
  downloadBlob(s.raw, s.name || `${mid}.json`, 'application/json');
}
function toggleRespSchema(mid, btn) {
  const s = _respSchemas[mid];
  const el = document.getElementById(`resp-schema-${mid}`);
  if (!s || !s.raw || !el) return;
  const open = el.style.display !== 'none';
  el.style.display = open ? 'none' : 'block';
  if (btn) btn.textContent = open ? t('btn.viewContent') : t('btn.hide');
  if (!open && !el.dataset.rendered) {
    if (typeof renderJsonMinimap === 'function') {
      renderJsonMinimap(el, s.raw, [], `<span>${esc(s.name || 'schema.json')}</span><button class="copy-btn" onclick="copyRespSchema('${mid}', this)">${t('btn.copy')}</button>`);
    } else {
      el.innerHTML = `<pre>${esc(fmtJSON(s.raw))}</pre>`;
    }
    el.dataset.rendered = '1';
  }
}
function copyRespSchema(mid, btn) {
  const s = _respSchemas[mid];
  if (!s || !s.raw) return;
  navigator.clipboard.writeText(fmtJSON(s.raw)).then(() => {
    btn.textContent = t('btn.copied'); 
    btn.classList.add('ok');
    setTimeout(() => { btn.textContent = t('btn.copy'); btn.classList.remove('ok'); }, 2000);
  });
}
function parseEnumMeanings(description, values) {
  const text = String(description || '').trim();
  const rows = [];
  (values || []).forEach(v => {
    const code = String(v);
    const re = new RegExp(`(?:^|[\\n;,.])\\s*${code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[:=\\-–>]\\s*([^\\n;,.]+)`, 'i');
    const m = text.match(re);
    if (m) rows.push({ code, meaning: m[1].trim() });
  });
  return { rows, general: rows.length ? '' : text };
}

/* Wrappers para Status: cambia aquí el render si Status debe tener otra vista */
function renderDescripcionStatus(schema, readmeText, examplesData, section) { renderDescripcion(schema, readmeText, examplesData, section); }
function renderEstructuraStatus(schema, section, schemaFileName) { renderEstructura(schema, section, schemaFileName); }
function renderEnumeracionesStatus(schema) { renderEnumeraciones(schema); }
function renderEjemploStatus(examplesData, section) { renderEjemplo(examplesData, section); }

function _slug(s) { return String(s || '').replace(/[^A-Za-z0-9_-]/g, '-'); }
document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', () => { const tab=btn.dataset.tab; document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active',b===btn)); document.querySelectorAll('.tab-panel').forEach(p=>p.classList.toggle('active',p.id===`tab-${tab}`)); }));
function scrollToBlock(id, btn) { document.querySelectorAll('.snav-btn').forEach(b=>b.classList.remove('active')); if(btn)btn.classList.add('active'); const el=document.getElementById(id); if(el)el.scrollIntoView({behavior:'smooth',block:'start'}); }
function downloadSchema(fileName){ downloadBlob(_schemaRaw, fileName, 'application/json'); }
function downloadExample(i, fileName){ const content=_examples[i]; if(content!=null)downloadBlob(content,fileName); }
function copyExample(i, btn){ const text=_examples[i]; if(!text)return; navigator.clipboard.writeText(text).then(()=>{btn.textContent=t('btn.copied');btn.classList.add('ok');setTimeout(()=>{btn.textContent=t('btn.copy');btn.classList.remove('ok');},2000);}); }
async function showVersions(){ showView('view-versions'); const status=document.getElementById('versStatus'), cont=document.getElementById('versContainer'), quick=document.getElementById('versQuick'); status.textContent=t('loading'); quick.innerHTML=''; const files=SITE_CONFIG.versionFiles || []; if(!files.length){status.textContent=''; cont.innerHTML=`<div class="highlight-box"><strong>${t('versions.emptyTitle')}</strong><br>${t('versions.emptyBody')}</div>`; return;} status.textContent=t('versions.count',{n:files.length}); cont.innerHTML=`<div class="file-grid">${files.map((f,i)=>renderFileCard(f,i,'vers')).join('')}</div>`; }
async function showRespuestas(){ showView('view-respuestas'); const body=document.getElementById('respuestas-body'); const sections=getAllCards().filter(s=>s.group==='Response'); body.innerHTML=sections.map((s,i)=>`<div class="resp-block"><div class="resp-block-head"><h2>${esc(localizedSectionTitle(s))}</h2><p>${esc(localizedSectionDesc(s))}</p></div><div class="file-grid">${(s.files||[]).map((f,j)=>renderFileCard(f,j,`resp-${i}`)).join('')}</div></div>`).join('') || `<p style="color:var(--gray-500)">${t('versions.emptyTitle')}</p>`; }
(function(){ const btn=document.getElementById('goTop'); if(btn){ function toggle(){btn.classList.toggle('show',window.scrollY>400);} window.addEventListener('scroll',toggle,{passive:true}); toggle(); }})();
document.addEventListener('DOMContentLoaded', init);