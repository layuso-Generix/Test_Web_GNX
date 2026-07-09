/* ── GitHub helpers ──────────────────────────────────────── */
function ghHeaders() {
    const h = { 'Accept': 'application/vnd.github.v3+json' };
    if (CONFIG.token) h['Authorization'] = `token ${CONFIG.token}`;
    return h;
}
async function ghList(path) {
    const r = await fetch(
        `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${path}?ref=${CONFIG.branch}`,
        { headers: ghHeaders() }
    );
    if (!r.ok) throw new Error(`GitHub API ${r.status}`);
    return r.json();
}
async function rawFetch(path) {
    const r = await fetch(
        `https://raw.githubusercontent.com/${CONFIG.owner}/${CONFIG.repo}/${CONFIG.branch}/${path}`
    );
    if (!r.ok) throw new Error(`404: ${path}`);
    return r.text();
}

/* ── Descubre los ficheros JSON (+ readme) dentro de una carpeta ── */
const _dirCache = {};
const _LS_KEY   = `wms_tree_${CONFIG.repo}_${CONFIG.contentPath}`;
const _LS_TTL   = 60 * 60 * 1000; // 1 hora

/* Una sola llamada API para todo el repo, cacheada en localStorage */
async function loadRepoTree() {
    try {
        const stored = JSON.parse(localStorage.getItem(_LS_KEY) || '{}');
        if (stored.ts && (Date.now() - stored.ts) < _LS_TTL && stored.tree) {
            return stored.tree;
        }
    } catch {}

    const r = await fetch(
        `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/git/trees/${CONFIG.branch}?recursive=1`,
        { headers: ghHeaders() }
    );
    if (!r.ok) throw new Error(`GitHub API ${r.status}`);
    const data = await r.json();

    try {
        localStorage.setItem(_LS_KEY, JSON.stringify({ ts: Date.now(), tree: data.tree }));
    } catch {}
    return data.tree;
}

async function discoverFiles(folder) {
    if (_dirCache[folder]) return _dirCache[folder];
    const tree = await loadRepoTree();
    buildCacheFromTree(tree);
    return _dirCache[folder] || { schemaFile: null, exampleFiles: [], readmeFile: null };
}

let _detailDir = '';   // directorio que contiene el schema abierto actualmente

async function discoverFilesAt(dir) {
    if (_dirCache[dir]) return _dirCache[dir];
    const tree = await loadRepoTree();
    const prefix = dir + '/';
    const files = tree
        .filter(it => it.type === 'blob' && it.path.startsWith(prefix) && !it.path.slice(prefix.length).includes('/'))
        .map(it => ({ name: it.path.slice(prefix.length) }));
    _dirCache[dir] = buildDirResult(files);
    return _dirCache[dir];
}

function buildCacheFromTree(tree) {
    const prefix      = CONFIG.contentPath + '/';
    const folderFiles = {};

    tree.forEach(item => {
        if (!item.path.startsWith(prefix)) return;
        const rest  = item.path.slice(prefix.length);
        const parts = rest.split('/');
        if (parts.length !== 2 || item.type !== 'blob') return;
        const [folderName, fileName] = parts;
        if (!folderFiles[folderName]) folderFiles[folderName] = [];
        folderFiles[folderName].push({ name: fileName });
    });

    Object.entries(folderFiles).forEach(([folder, files]) => {
        _dirCache[folder] = buildDirResult(files);
    });

    return Object.keys(folderFiles);
}

