/* =========================================================
   validator.js - validador local con misma UI que web1
   ========================================================= */
let _schemaCache = {};
let _lastFileText = null;
function schemaDir(value) { return value; }
async function fetchSchema(value) {
  if (_schemaCache[value]) return _schemaCache[value];
  const txt = await rawFetch(value);
  const schema = JSON.parse(txt);
  _schemaCache[value] = schema;
  return schema;
}
function setupValidator() {
  const sel = document.getElementById('valSchema');
  const dropzone = document.getElementById('dropzone');
  const input = document.getElementById('fileInput');
  if (!sel || !dropzone || !input) return;
  const schemas = getAllCards().filter(s => s.validatorSchema);
  sel.innerHTML = `<option value="">${t('val.selectPlaceholder')}</option>` + schemas.map(s => `<option value="${esc(s.validatorSchema)}">${esc(localizedSectionTitle(s))}</option>`).join('');
  sel.onchange = () => {
    const on = !!sel.value;
    dropzone.classList.toggle('disabled', !on);
    if (dropzone.childNodes[0]) dropzone.childNodes[0].nodeValue = on ? ' ' + t('val.dropzone.enabled') + ' ' : ' ' + t('val.dropzone.disabled') + ' ';
    if (on && _lastFileText) processJSON(_lastFileText);
  };
  dropzone.onclick = () => { if (sel.value) input.click(); };
  dropzone.ondragover = e => { e.preventDefault(); if (sel.value) dropzone.classList.add('dragover'); };
  dropzone.ondragleave = () => dropzone.classList.remove('dragover');
  dropzone.ondrop = e => { e.preventDefault(); dropzone.classList.remove('dragover'); if (sel.value && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); };
  input.onchange = () => input.files[0] && handleFile(input.files[0]);
  renderSummary('', '');
}
async function handleFile(file) { _lastFileText = await file.text(); processJSON(_lastFileText); }
function serializeWithMap(data) {
  const lines = [], map = {};
  const escKey = k => String(k).replace(/~/g,'~0').replace(/\//g,'~1');
  function rec(value, ptr, indent, keyPrefix, comma) {
    const pad = '  '.repeat(indent);
    if (value !== null && typeof value === 'object') {
      const isArr = Array.isArray(value);
      const entries = isArr ? value.map((v,i)=>[i,v]) : Object.entries(value);
      if (!entries.length) { lines.push(pad + keyPrefix + (isArr?'[]':'{}') + (comma?',':'')); map[ptr]=lines.length; return; }
      lines.push(pad + keyPrefix + (isArr?'[':'{')); map[ptr]=lines.length;
      entries.forEach(([k,v],i) => rec(v, ptr + '/' + (isArr ? k : escKey(k)), indent+1, isArr ? '' : JSON.stringify(String(k)) + ': ', i < entries.length-1));
      lines.push(pad + (isArr?']':'}') + (comma?',':''));
    } else { lines.push(pad + keyPrefix + JSON.stringify(value) + (comma?',':'')); map[ptr]=lines.length; }
  }
  rec(data, '', 0, '', false);
  return { lines, map };
}
function resolveLocalRef(root, node) {
  if (!node || !node.$ref || !node.$ref.startsWith('#/')) return node;
  return node.$ref.slice(2).split('/').reduce((n,p)=>n&&n[p], root) || node;
}
function valueType(v){ if(Array.isArray(v))return 'array'; if(v===null)return 'null'; return typeof v; }
function validateLocal(root, schema, data, path, errors) {
  schema = resolveLocalRef(root, schema);
  if (!schema || typeof schema !== 'object') return;
  const expected = Array.isArray(schema.type) ? schema.type : (schema.type ? [schema.type] : []);
  if (expected.length) {
    const actual = valueType(data);
    const ok = expected.some(t => t === 'integer' ? Number.isInteger(data) : t === actual);
    if (!ok) errors.push({instancePath:path, keyword:'type', params:{type:expected.join('|')}, message:`Tipo incorrecto: ${expected.join('|')}`});
  }
  if (schema.enum && !schema.enum.some(v => JSON.stringify(v) === JSON.stringify(data))) errors.push({instancePath:path, keyword:'enum', params:{allowedValues:schema.enum}, message:'Valor no permitido'});
  if (typeof data === 'string') {
    if (schema.maxLength != null && data.length > schema.maxLength) errors.push({instancePath:path, keyword:'maxLength', params:{limit:schema.maxLength}});
    if (schema.minLength != null && data.length < schema.minLength) errors.push({instancePath:path, keyword:'minLength', params:{limit:schema.minLength}});
    if (schema.pattern) { try { if (!new RegExp(schema.pattern).test(data)) errors.push({instancePath:path, keyword:'pattern', params:{pattern:schema.pattern}}); } catch(e){} }
  }
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const props = schema.properties || {};
    (schema.required || []).forEach(k => { if (!(k in data)) errors.push({instancePath:path, keyword:'required', params:{missingProperty:k}}); });
    Object.entries(data).forEach(([k,v]) => {
      if (props[k]) validateLocal(root, props[k], v, path + '/' + k, errors);
      else if (schema.additionalProperties === false) errors.push({instancePath:path + '/' + k, keyword:'additionalProperties', params:{additionalProperty:k}});
    });
  }
  if (Array.isArray(data) && schema.items) data.forEach((v,i)=>validateLocal(root, schema.items, v, path + '/' + i, errors));
}
function describeError(e){
  const p = e.params || {};
  switch(e.keyword){
    case 'enum': return `Valor no permitido. Valores admitidos: ${(p.allowedValues||[]).join(', ')}`;
    case 'maxLength': return `Longitud máxima permitida: ${p.limit}`;
    case 'minLength': return `Longitud mínima requerida: ${p.limit}`;
    case 'pattern': return `No cumple el patrón requerido: ${p.pattern}`;
    case 'type': return `Tipo incorrecto, se esperaba: ${p.type}`;
    case 'required': return `Falta el campo obligatorio: ${p.missingProperty}`;
    case 'additionalProperties': return `Propiedad no permitida: ${p.additionalProperty}`;
    default: return e.message || 'Error de validación';
  }
}
function errorPath(e){ let path = e.instancePath || ''; if (e.keyword === 'required') path += '/' + e.params.missingProperty; else if (e.keyword === 'additionalProperties') path += '/' + e.params.additionalProperty; return path || '(raíz)'; }
async function processJSON(text) {
  const sel = document.getElementById('valSchema');
  const result = document.getElementById('result');
  const errorList = document.getElementById('errorList');
  const viewer = document.getElementById('jsonViewer');
  let data;
  try { data = JSON.parse(text); }
  catch { result.textContent = t('vstatus.syntaxInvalid'); errorList.textContent=''; viewer.textContent=text; syncValidationVisual(); return; }
  let schema;
  try { schema = await fetchSchema(sel.value); }
  catch (e) { result.textContent = t('vstatus.schemaLoadFail'); errorList.textContent = '➡ ' + e.message; viewer.textContent=''; syncValidationVisual(); return; }
  const errors = [];
  validateLocal(schema, schema, data, '', errors);
  if (!errors.length) { window._valErrorLines = []; viewer.textContent = JSON.stringify(data, null, 2); result.textContent = t('vstatus.valid'); errorList.textContent = ''; }
  else {
    const { lines, map } = serializeWithMap(data);
    window._valErrorLines = errors.map(e => map[e.instancePath]).filter(Boolean);
    viewer.textContent = lines.join('\n');
    result.textContent = t('vstatus.invalid');
    errorList.textContent = errors.map(e => `➡ ${errorPath(e)} → ${describeError(e)}`).join('\n');
  }
  syncValidationVisual();
}
function statusMeta(msg){
  if(!msg.trim()) return {kind:'info',badge:t('vmeta.noStatus.badge'),title:t('vmeta.noStatus.title'),text:t('vmeta.noStatus.text')};
  if(msg.includes('✅')) return {kind:'success',badge:t('vmeta.ok.badge'),title:t('vmeta.ok.title'),text:msg.replace('✅','').trim()||t('vmeta.ok.text')};
  if(msg.includes('❌')) return {kind:'error',badge:t('vmeta.err.badge'),title:t('vmeta.err.title'),text:msg.replace('❌','').trim()||t('vmeta.err.text')};
  if(msg.includes('⚠️')) return {kind:'warning',badge:t('vmeta.warn.badge'),title:t('vmeta.warn.title'),text:msg.replace('⚠️','').trim()};
  return {kind:'info',badge:t('vmeta.info.badge'),title:t('vmeta.info.title'),text:msg};
}
function parseErrors(raw){return (raw||'').split('➡').map(s=>s.trim()).filter(Boolean).map((it,i)=>{const p=it.split('→');return{index:i+1,path:(p[0]||'(raíz)').trim(),message:(p.slice(1).join('→')||'Error').trim()};});}
function renderSummary(msg, raw){
  const target=document.getElementById('validationSummary'); if(!target)return;
  const errs=parseErrors(raw), m=statusMeta(msg); let tbl='';
  if(errs.length) tbl=`<table class="val-err-tbl"><thead><tr><th>${t('vtable.num')}</th><th>${t('vtable.field')}</th><th>${t('vtable.error')}</th></tr></thead><tbody>${errs.map(e=>`<tr><td>${e.index}</td><td><code>${esc(e.path)}</code></td><td>${esc(e.message)}</td></tr>`).join('')}</tbody></table>`;
  target.classList.remove('val-empty');
  target.innerHTML=`<div class="val-status-card ${m.kind}"><div class="val-status-head"><div class="val-status-title">${esc(m.title)}</div><div class="val-status-badge">${esc(m.badge)}</div></div><p class="val-status-text">${esc(m.text)}</p></div>${tbl}`;
}
function renderViewer(raw){ const cont=document.getElementById('jsonViewerContainer'); if(!cont)return; const text=(raw||'').trim(); if(!text){cont.innerHTML='';return;} renderJsonMinimap(cont,text,window._valErrorLines||[],`<span>${t('vviewer.title')}</span>`); }
function syncValidationVisual(){ renderSummary(document.getElementById('result')?.textContent||'', document.getElementById('errorList')?.textContent||''); renderViewer(document.getElementById('jsonViewer')?.textContent||''); }
window.setupValidator = setupValidator;
