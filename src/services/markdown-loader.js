/* =========================================================
  markdown-loader.js — Parser Markdown ligero para los README
  ┌─────────────────────────────────────────────────────┐
  │  Soporta:                                           │
  │  - # ## ### ####  títulos                           │
  │  - ---            separador                         │
  │  - - / *          listas                            │
  │  - 1. 2.          listas numeradas                  │
  │  - | a | b |      tablas                            │
  │  - ``` ```        bloques de código                 │
  │  - > texto        cita / aviso                      │
  │  - **negrita** *cursiva* `código` [enlace](url)     │
  │  - <!-- … -->     comentarios (no se muestran)      │
  │  API pública igual que antes:                       │
  │  esc, inlineMd, simpleMarkdown, rawFetch, rawUrl    │
  └─────────────────────────────────────────────────────┘
  ========================================================= */
function esc(t) {
  if (t == null) return '';
  return String(t)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function inlineMd(t) {
  const codes = [];
  // 1. Código en línea primero: su contenido no se formatea
  let out = esc(t).replace(/`([^`]+)`/g, (_, c) => {
    codes.push(`<code class="md-code">${c}</code>`);
    return `\u0000${codes.length - 1}\u0000`;
  });
  out = out
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
      const internal = href.startsWith('#');
      return `<a class="md-link" href="${href}"${internal ? '' : ' target="_blank" rel="noopener"'}>${label}</a>`;
    });
  // 2. Se restauran los códigos
  return out.replace(/\u0000(\d+)\u0000/g, (_, i) => codes[Number(i)]);
}

function splitRow(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}
const isTableSep = (line) => /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(line);

function simpleMarkdown(md, skipFirstH = false) {
  // Comentarios HTML fuera (también multilínea)
  const lines = String(md || '').replace(/<!--[\s\S]*?-->/g, '').replace(/\r\n?/g, '\n').split('\n');
  const html = [];
  let list = null;           // 'ul' | 'ol' | null
  let para = [];
  let firstHDone = false;

  const closePara = () => {
    if (para.length) { html.push(`<p>${para.map(inlineMd).join('<br>')}</p>`); para = []; }
  };
  const closeList = () => {
    if (list) { html.push(`</${list}>`); list = null; }
  };
  const closeAll = () => { closePara(); closeList(); };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trimEnd();
    const trimmed = line.trim();

    // Bloque de código
    if (trimmed.startsWith('```')) {
      closeAll();
      const code = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) { code.push(lines[i]); i++; }
      html.push(`<pre class="md-pre">${esc(code.join('\n'))}</pre>`);
      continue;
    }

    // Línea vacía
    if (!trimmed) { closeAll(); continue; }

    // Separador
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) { closeAll(); html.push('<hr class="md-hr">'); continue; }

    // Títulos
    const h = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      closeAll();
      const level = h[1].length;
      if (skipFirstH && !firstHDone && level <= 2) { firstHDone = true; continue; }
      const tag = `h${Math.min(Math.max(level, 2), 4)}`;
      html.push(`<${tag} class="md-${tag}">${inlineMd(h[2])}</${tag}>`);
      continue;
    }

    // Tabla
    if (trimmed.startsWith('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      closeAll();
      const head = splitRow(trimmed);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) { rows.push(splitRow(lines[i])); i++; }
      i--;
      html.push(`<div class="md-table-wrap"><table class="md-table">
        <thead><tr>${head.map((c) => `<th>${inlineMd(c)}</th>`).join('')}</tr></thead>
        <tbody>${rows.map((r) => `<tr>${head.map((_, k) => `<td>${inlineMd(r[k] || '')}</td>`).join('')}</tr>`).join('')}</tbody>
      </table></div>`);
      continue;
    }

    // Listas
    const ul = trimmed.match(/^[-*+]\s+(.*)$/);
    const ol = trimmed.match(/^\d+[.)]\s+(.*)$/);
    if (ul || ol) {
      closePara();
      const type = ul ? 'ul' : 'ol';
      if (list !== type) { closeList(); html.push(`<${type} class="md-list">`); list = type; }
      html.push(`<li>${inlineMd((ul || ol)[1])}</li>`);
      continue;
    }

    // Cita / aviso
    if (trimmed.startsWith('>')) {
      closeAll();
      const quote = [trimmed.replace(/^>\s?/, '')];
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith('>')) {
        i++; quote.push(lines[i].trim().replace(/^>\s?/, ''));
      }
      html.push(`<div class="highlight-box md-note">${quote.map(inlineMd).join('<br>')}</div>`);
      continue;
    }

    // Párrafo (líneas seguidas = mismo párrafo)
    closeList();
    para.push(trimmed);
  }
  closeAll();
  return `<div class="md-body">${html.join('\n')}</div>`;
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
