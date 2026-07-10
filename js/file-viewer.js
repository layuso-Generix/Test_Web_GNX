/* =========================================================
   file-viewer.js - tarjetas, preview, descarga, JSON minimap simple
   ========================================================= */
const TEXT_EXT = ['json','xml','xsd','txt','md','csv','yaml','yml'];
const FILE_ICONS = { json:'🟨', xml:'📃', xsd:'📐', csv:'📊', txt:'📄', md:'📝', pdf:'📕', zip:'🗜️', xlsx:'📗' };
function _ext(n){ const i=String(n).lastIndexOf('.'); return i>=0?String(n).slice(i+1).toLowerCase():''; }
function _fileIcon(n){ return FILE_ICONS[_ext(n)] || FILE_ICONS[String(n).toLowerCase()] || '📁'; }
function _isText(n){ return TEXT_EXT.includes(_ext(n)); }
function fmtJSON(t) { try { return JSON.stringify(JSON.parse(t), null, 2); } catch { return t; } }
function hlJSON(json) {
  return esc(json).replace(/("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, m => {
    if (/^"/.test(m)) return /:$/.test(m) ? `<span class="jk">${m}</span>` : `<span class="js">${m}</span>`;
    if (/true|false/.test(m)) return `<span class="jb">${m}</span>`;
    if (m === 'null') return `<span class="jnull">${m}</span>`;
    return `<span class="jn">${m}</span>`;
  });
}
function downloadBlob(content, fileName, mime='application/octet-stream') {
  if (content == null) return;
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function localFilePath(section, fileNameOrPath) {
  if (!fileNameOrPath) return '';
  if (String(fileNameOrPath).includes('/')) return fileNameOrPath;
  return `${section.dir}/${fileNameOrPath}`;
}
function renderFileCard(file, idx, prefix='file') {
  const path = file.path || file.rawPath;
  const name = file.name || path.split('/').pop();
  const pid = `${prefix}-${idx}`.replace(/[^A-Za-z0-9_-]/g,'-');
  const previewBtn = _isText(name) ? `<button class="file-btn" onclick="toggleFilePreview('${esc(path)}','${pid}',this)">${t('btn.viewContent')}</button>` : '';
  return `<div class="file-card">
    <div class="file-card__head">
      <div class="file-card__icon">${_fileIcon(name)}</div>
      <div><div class="file-card__name">${esc(file.label || name)}</div><div class="file-card__meta">${esc((_ext(name)||'file').toUpperCase())} · ${esc(path)}</div></div>
    </div>
    <div class="file-card__actions">
      <a class="file-btn file-btn--primary" href="${esc(rawUrl(path))}" download>${t('btn.download')}</a>
      <a class="file-btn" target="_blank" href="${esc(rawUrl(path))}">${t('btn.viewGithub')}</a>
      ${previewBtn}
    </div>
    <div class="file-preview" id="${pid}"><pre></pre></div>
  </div>`;
}
async function toggleFilePreview(path, pid, btn) {
  const box = document.getElementById(pid);
  if (!box) return;
  const card = box.closest('.file-card');
  if (box.classList.contains('open')) { box.classList.remove('open'); if(card) card.classList.remove('expanded'); btn.textContent = t('btn.viewContent'); return; }
  box.classList.add('open'); if(card) card.classList.add('expanded'); btn.textContent = t('btn.hide');
  const pre = box.querySelector('pre');
  if (box.dataset.loaded) return;
  pre.textContent = t('loading');
  try {
    let text = await rawFetch(path);
    if (_ext(path) === 'json') text = fmtJSON(text);
    if (text.length > 120000) text = text.slice(0,120000) + '\n\n…';
    pre.textContent = text;
    box.dataset.loaded = '1';
  } catch(e) { pre.textContent = e.message; }
}
function renderJsonMinimap(container, jsonText, errorLineNumbers, headerHtml) {
  const text = (jsonText || '').trim();
  if (!text) { container.innerHTML = ''; return; }
  const formatted = fmtJSON(text);
  container.innerHTML = `<div class="validator-code-shell"><div class="validator-code-panel">
    ${headerHtml ? `<div class="validator-code-header">${headerHtml}</div>` : ''}
    <div class="validator-code-body" style="display:block"><div class="validator-code-scroll"><pre class="validator-line-code" style="white-space:pre;display:block;padding:18px;overflow:auto;max-height:70vh">${hlJSON(formatted)}</pre></div></div>
  </div></div>`;
}
window.fmtJSON = fmtJSON;
window.hlJSON = hlJSON;
window.downloadBlob = downloadBlob;
window.renderFileCard = renderFileCard;
window.toggleFilePreview = toggleFilePreview;
window.renderJsonMinimap = renderJsonMinimap;