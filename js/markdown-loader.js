/* =========================================================
   markdown-loader.js - parser sencillo igual que web1
   ========================================================= */
function esc(t) {
  if (t == null) return '';
  return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function inlineMd(t) {
  return esc(t)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code style="background:var(--gray-100);padding:1px 5px;border-radius:3px;font-family:monospace">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="download-link" target="_blank" href="$2">$1</a>');
}
function simpleMarkdown(md, skipFirstH = false) {
  const lines = (md || '').split('\n');
  let html = '', inUl = false, firstHDone = false, inCode = false, code = [];
  const closeUl = () => { if(inUl){html+='</ul>';inUl=false;} };
  const closeCode = () => { if(inCode){html += `<div class="code-panel"><pre class="cp-pre">${esc(code.join('\n'))}</pre></div>`; inCode=false; code=[];} };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith('```')) { if (inCode) closeCode(); else { closeUl(); inCode=true; code=[]; } continue; }
    if (inCode) { code.push(raw); continue; }
    if (line.startsWith('### ')) { closeUl(); html+=`<h3>${esc(line.slice(4))}</h3>`; }
    else if (line.startsWith('## ') || line.startsWith('# ')) {
      closeUl();
      if (skipFirstH && !firstHDone) { firstHDone = true; html += `<div style="border-bottom:2px solid var(--generix-orange-soft);margin:0 0 24px"></div>`; }
      else { const text = line.startsWith('## ') ? line.slice(3) : line.slice(2); html += `<h2>${esc(text)}</h2>`; }
    }
    else if (line.startsWith('- ') || line.startsWith('* ')) { if (!inUl) { html+='<ul>'; inUl=true; } html+=`<li>${inlineMd(line.slice(2))}</li>`; }
    else if (line.startsWith('>')) { closeUl(); html+=`<div class="highlight-box">${inlineMd(line.slice(1).trim())}</div>`; }
    else if (line.trim()==='') { closeUl(); }
    else { closeUl(); html+=`<p>${inlineMd(line)}</p>`; }
  }
  closeUl(); closeCode();
  return html;
}
function rawUrl(path) {
  const url = `https://raw.githubusercontent.com/${CONFIG.owner}/${CONFIG.repo}/${CONFIG.branch}/${path}`;
  return encodeURI(url).replace(/#/g, '%23');
}
async function rawFetch(path) {
  const r = await fetch(rawUrl(path));
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${path}`);
  return r.text();
}
window.esc = esc;
window.inlineMd = inlineMd;
window.simpleMarkdown = simpleMarkdown;
window.rawFetch = rawFetch;
window.rawUrl = rawUrl;