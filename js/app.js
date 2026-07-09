/* =========================================================
   app.js - lógica principal al estilo web1, adaptada a SITE_CONFIG
   ========================================================= */
const _VIEWS = ['view-index','view-detail','view-versions','view-validacion','view-respuestas'];
let _currentSection = null;
let _schemaRaw = '';
let _examples = [];
let _respSchemas = {};
let _respSections = {};

function showView(id) {
  _VIEWS.forEach(v => {
    const el = document.getElementById(v);
    if (el) el.style.display = (v === id) ? 'block' : 'none';
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function showIndex()  { _currentSection = null; showView('view-index'); document.title = 'Generix · E-Invoicing · Developer Documentation'; }
function showDetail() { showView('view-detail'); }
function showValidacion(){ showView('view-validacion'); setupValidator(); }
function getSectionGroups() { return SITE_CONFIG.sections || []; }
function getAllCards() {
  return getSectionGroups().flatMap(group =>
    (group.cards || []).map(card => ({
      ...card,
      sectionName: group.section
    }))
  );
}
function findCardById(id) { return getAllCards().find(card => card.id === id); }
function isFullPath(value) { return typeof value === 'string' && value.includes('/'); }
function resolveFilePath(section, fileNameOrPath) {
  if (!fileNameOrPath) return '';
  if (isFullPath(fileNameOrPath)) return fileNameOrPath;
  return `${section.dir}/${fileNameOrPath}`;
}

function init() {
  applyStaticI18n();
  renderGrid(SITE_CONFIG.sections);
  const stat = document.getElementById('stat-sections');
  if (stat) stat.textContent = getAllCards().length;
  const respCard = document.getElementById('resp-card');
  if (respCard) respCard.style.display = getAllCards().some(s => s.group === 'Response') ? '' : 'none';
  showIndex();
}
function localizedSectionTitle(s){ return s['title_' + LANG] || s.title_es || s.title_en || s.id; }
function localizedSectionDesc(s){ return s['description_' + LANG] || s.description_es || s.description_en || ''; }
function renderGrid(sections) {
  const grid = document.getElementById('sectionGrid');
  if (!grid) return;
  let html = '';
  
  sections.forEach(group => {
    const groupName = group.section || '';
    const groupId = _slug ? _slug(groupName) : groupName.replace(/[^A-Za-z0-9_-]/g, '-');
      html += `
        <div class="folder-section" id="grp-${esc(groupId)}">
          <h3><span class="card-icon" style="margin-bottom: 0px; font-size: 1.2rem;">${esc(group.icon || '📦')}</span> ${esc(groupName)}</h3>
          <div class="file-grid">
      `;
      (group.cards || []).forEach(card => {
        const nf = (card.files || []).length;
        html += `
          <div class="card" onclick="openEndpoint('${esc(card.id)}')">
            <div class="card-icon">${esc(card.icon || card.format || '')}</div>
            <div class="card-meta">
              <span class="badge badge-${esc(card.group)}">${esc(card.group || '')}</span>
              <span class="badge badge-cat">${esc(card.category || '')}</span>
              <span class="badge badge-${esc(card.format)}">${esc(card.format || '')}</span>
            </div>
            <h3>${esc(localizedSectionTitle(card))}</h3>
            <p>${esc(localizedSectionDesc(card))}</p>
            <span class="card-link">${nf} ${nf !== 1 ? t('card.fields_pl') : t('card.fields_sg')} · ${t('card.viewDoc')}</span>
          </div>`;
  });
    html += `
        </div>
      </div>
    `;
  });

  grid.innerHTML = html;
}

async function openEndpoint(sectionId) {
  const section = findCardById(sectionId);
  if (!section) return;
  _currentSection = section; window._currentSection = section;
  showDetail();
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === 'descripcion'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-descripcion'));
  document.getElementById('detailTitle').textContent = t('loading');
  document.getElementById('d-breadcrumb-name').textContent = localizedSectionTitle(section);
  document.getElementById('detailDescription').textContent  = '';
  document.getElementById('detailBadges').innerHTML = '';
  ['desc-body','estructura-body','enumeraciones-body','ejemplo-inner'].forEach(id => {
    const el = document.getElementById(id); if (el) el.innerHTML = `<p style="color:var(--gray-500)">${t('loading')}</p>`;
  });
  ['snav-btns-estructura','snav-btns-enumeraciones'].forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = ''; });
  _examples = []; _schemaRaw = '';
  try {
    const schemaPath = section.schemaFile ? resolveFilePath(section, section.schemaFile) : null;
    const readmePath = section.readme ? (section.readme[LANG] || section.readme.es || section.readme.en) : null;
    const [sRes, rRes] = await Promise.allSettled([
      schemaPath ? rawFetch(schemaPath) : Promise.resolve(''),
      readmePath ? rawFetch(readmePath) : Promise.resolve(null)
    ]);
    _schemaRaw = sRes.status === 'fulfilled' ? sRes.value : '';
    let schema = {};
    if (_schemaRaw && _ext(schemaPath) === 'json') schema = localizeNode(JSON.parse(_schemaRaw));
    else schema = { title: localizedSectionTitle(section), description: localizedSectionDesc(section) };
    const readmeRaw = rRes.status === 'fulfilled' ? rRes.value : null;
    const exResults = await Promise.allSettled((section.exampleFiles || []).map(f => rawFetch(resolveFilePath(section, f))));
    const examplesData = (section.exampleFiles || []).map((f, i) => ({ name: f, raw: exResults[i].status === 'fulfilled' ? exResults[i].value : null, path: resolveFilePath(section, f) })).filter(e => e.raw !== null);
    document.title = `Generix · ${localizedSectionTitle(section)} · Developer Documentation`;
    document.getElementById('detailTitle').textContent = schema.title || localizedSectionTitle(section);
    document.getElementById('d-breadcrumb-name').textContent = localizedSectionTitle(section);
    document.getElementById('detailDescription').textContent  = schema.description || localizedSectionDesc(section);
    document.getElementById('detailBadges').innerHTML = [
      `<span class="method-badge ${esc(section.group)}">${esc(section.group || '')}</span>`,
      `<span class="method-badge category">${esc(section.category || '')}</span>`,
      `<span class="method-badge ${esc(section.format)}">${esc(section.format || '')}</span>`
      
    ].join('');
    renderDescripcion(schema, readmeRaw, examplesData, section);
    renderEstructura(schema, section, section.schemaFile);
    renderEnumeraciones(schema);
    renderEjemplo(examplesData, section);
  } catch (err) {
    document.getElementById('detailTitle').textContent = t('detail.errorLoad');
    document.getElementById('detailDescription').textContent = err.message;
    document.getElementById('desc-body').innerHTML = `<p style="color:#cf1322">${esc(err.message)}</p>`;
  }
}
function renderDescripcion(schema, readmeText, examplesData, section) {
  let html = '';
  html += `<h2>${esc(schema.title || localizedSectionTitle(section) || t('desc.overview'))}</h2>`;
  if (schema.description) html += `<p>${esc(schema.description)}</p>`;
  const specs = [];
  if (section.format) specs.push({ label:t('spec.format'), value: section.format });
  if (section.category) specs.push({ label:t('spec.category'), value: section.category });
  if (section.dir) specs.push({ label:t('spec.folder'), value: section.dir });
  if (section.schemaFile) specs.push({ label:t('spec.schema'), value: section.schemaFile });
  (examplesData || []).forEach((ex, i) => specs.push({ label: examplesData.length > 1 ? t('spec.exampleN',{n:i+1}) : t('spec.example'), value: ex.name, dlIdx: i }));
  if (specs.length) html += `<div class="spec-card">${specs.map(s => `<div class="spec-item"><span class="spec-label">${esc(s.label)}</span><span class="spec-value">${s.dlIdx !== undefined ? `<a href="#" onclick="downloadExample(${s.dlIdx},'${esc(s.value)}');return false;" class="download-link" style="font-family:monospace;font-size:.85rem">${esc(s.value)}</a>` : esc(s.value)}</span></div>`).join('')}</div>`;
  if (readmeText) html += simpleMarkdown(readmeText, true);
  else html += `<div class="info-box"><strong>${t('desc.noCustom.title')}</strong><br>${t('desc.noCustom.body')}</div>`;
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
    body.innerHTML = `<p style="margin-bottom:28px"><a href="${esc(localFilePath(section,schemaFileName))}" target="_blank" class="download-link">${t('struct.view',{file:schemaFileName})}</a></p><div class="file-grid">${(section.files||[]).map((f,i)=>renderFileCard(f,i,'struct')).join('')}</div>`;
    nav.innerHTML = '';
    return;
  }
  const defs = schema.$defs || schema.definitions || {};
  const blocks = extractBlocks(schema, defs);
  if (!blocks.length) { body.innerHTML = `<p style="color:var(--gray-500)">${t('struct.none')}</p>`; return; }
  let bodyHtml = `<p style="margin-bottom:28px"><a href="#" onclick="downloadSchema('${esc(schemaFileName)}'); return false;" class="download-link">${t('struct.download',{file:schemaFileName})}</a><br/><a href="${esc(localFilePath(section,schemaFileName))}" target="_blank" class="download-link">${t('struct.view',{file:schemaFileName})}</a></p>`;
  let navHtml = '';
  blocks.forEach((blk, i) => {
    const id = `blk-${i}`;
    const snippet = JSON.stringify({ [blk.jsonKey || blk.label]: blk.schemaSnippet }, null, 2);
    const fieldTbl = buildFieldTable(blk.properties, blk.required);
    navHtml += `<button class="snav-btn" onclick="scrollToBlock('${id}',this)">${esc(blk.label.replace(/Wrapper$/i, ''))}</button>`;
    bodyHtml += `<div class="block-wrap" id="${id}" data-label="${esc(blk.label)}"><div class="block-grid"><div class="code-panel"><div class="cp-header">${esc(blk.label)}</div><pre class="cp-pre">${esc(snippet)}</pre></div><div><div class="explanation-box"><p>${esc(blk.description || t('noDesc'))}</p></div><div class="tech-details"><h4>${t('tech.title')}</h4><p><strong>${t('tech.type')}</strong> <span class="tag-type">${esc(blk.type || 'object')}</span></p>${blk.required && blk.required.length ? `<p><strong>${t('tech.required')}</strong> <span class="tag-req">${esc(blk.required.join(', '))}</span></p>` : ''}${blk.constraints ? `<p><strong>${t('tech.constraints')}</strong> ${esc(blk.constraints)}</p>` : ''}</div></div></div>${fieldTbl}<div class="block-divider"></div></div>`;
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
function buildFieldTable(props, req) {
  if (!props || !Object.keys(props).length) return '';
  const dash = '<span style="color:var(--gray-300)">—</span>';
  let rows = '';
  for (const [field, def] of Object.entries(props)) {
    const type = getFieldType(def); const cons = getFieldCons(def); const isReq = (req || []).includes(field);
    rows += `<tr><td><span class="tag-req">${esc(field)}</span></td><td>${def && def.description ? esc(def.description) : dash}</td><td>${type ? `<span class="tag-type">${esc(type)}</span>` : dash}</td><td>${isReq ? `<span class="tag-req">${t('yes')}</span>` : `<span style="color:var(--gray-500)">${t('no')}</span>`}</td><td>${cons || dash}</td></tr>`;
  }
  return `<div class="field-tbl-wrap"><p class="field-tbl-title">${t('table.fieldsTitle')}</p><table class="field-tbl"><thead><tr><th>${t('table.field')}</th><th>${t('table.desc')}</th><th>${t('table.type')}</th><th>${t('table.req')}</th><th>${t('table.constraints')}</th></tr></thead><tbody>${rows}</tbody></table></div>`;
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
    bodyHtml += `<div class="block-wrap" id="${id}"><div class="block-grid"><div class="code-panel"><div class="cp-header">${esc(en.field)}</div><pre class="cp-pre">${esc(snippet)}</pre></div><div><div class="explanation-box"><p>${esc(en.description || t('noDesc'))}</p></div><div class="tech-details"><p><strong>${t('enums.usedIn')}</strong> <code>${esc(en.path)}</code></p><h4>${t('enums.allowed',{n:en.values.length})}</h4><div class="enum-val-wrap">${en.values.map(v=>`<span class="ev-pill">${esc(String(v))}</span>`).join('')}</div></div></div></div><div class="block-divider"></div></div>`;
  });
  document.getElementById('enumeraciones-body').innerHTML = bodyHtml;
  document.getElementById('snav-btns-enumeraciones').innerHTML = navHtml;
}
function extractEnums(schema) {
  const results=[]; const seen=new Set();
  function walk(obj,path,refName){ if(!obj||typeof obj!=='object')return; if(obj.$ref){const r=resolvePointer(obj.$ref,schema); if(r)walk(r,path,obj.$ref.split('/').pop()); return;} if(Array.isArray(obj.enum)){const key=path.split('.').pop().replace('[]',''); if(!seen.has(path)){seen.add(path); results.push({field:key,path,type:obj.type||'string',description:obj.description||'',values:obj.enum,default:obj.default,raw:obj,defName:refName||key});} return;} if(obj.properties)for(const[k,v]of Object.entries(obj.properties))walk(v,path?`${path}.${k}`:k); if(obj.items)walk(obj.items,`${path}[]`); if(obj.$defs)for(const[k,v]of Object.entries(obj.$defs))walk(v,k); if(obj.definitions)for(const[k,v]of Object.entries(obj.definitions))walk(v,k); }
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
    html+=`<div class="file-card" style="margin-bottom:18px"><div class="file-card__head"><div class="file-card__icon">${_fileIcon(ex.name)}</div><div><div class="file-card__name">${esc(ex.name)}</div><div class="file-card__meta">${esc((_ext(ex.name)||'file').toUpperCase())}</div></div></div><div class="file-card__actions"><a class="file-btn file-btn--primary" href="${esc(ex.path || localFilePath(section, ex.name))}" download>${t('btn.download')}</a><a class="file-btn" target="_blank" href="${esc(ex.path || localFilePath(section, ex.name))}">${t('btn.viewGithub')}</a><button class="file-btn" onclick="toggleExampleCode('${pid}', this, '${esc(ex.path || localFilePath(section, ex.name))}', ${i})">${t('btn.viewContent')}</button></div><div class="ejemplo-cp" id="${pid}" style="display:none;margin-top:6px"></div></div>`;
  });
  html+='</div>'; inner.innerHTML=html;
}
async function toggleExampleCode(pid, btn, path, idx) {
  const el=document.getElementById(pid); if(!el)return; const open=el.style.display!=='none'; el.style.display=open?'none':'block'; btn.textContent=open?t('btn.viewContent'):t('btn.hide'); const card=el.closest('.file-card'); if(card)card.classList.toggle('expanded',!open);
  if(!open&&!el.dataset.rendered){let raw=_examples[idx]; if(raw==null){raw=await rawFetch(path); if(_ext(path)==='json')raw=fmtJSON(raw); _examples[idx]=raw;} renderJsonMinimap(el, raw, [], `<span>${esc(path.split('/').pop())}</span><button class="copy-btn" onclick="copyExample(${idx}, this)">${t('btn.copy')}</button>`); el.dataset.rendered='1';}
}
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
