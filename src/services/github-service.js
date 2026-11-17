/* =========================================================
  github-service.js — Acceso a los ficheros del repositorio
  ┌─────────────────────────────────────────────────────┐
  │  Responsabilidades:                                 │
  │  - Listar carpetas del repositorio.                 │
  │  - Obtener los activos de una card.                 │
  │  - Clasificar schemas, ejemplos y README.           │
  │  - Caché en memoria + sessionStorage.               │
  │                                                     │
  │  Origen del listado (CONFIG.source):                │
  │  - 'jsdelivr' (por defecto): sin límite de 60/hora. │
  │     Si falla, usa la API de GitHub automáticamente. │
  │  - 'github': API de GitHub (60 peticiones/hora sin  │
  │     token). Útil para ver cambios al instante.      │
  │                                                     │
  │  API pública (igual que antes):                     │
  │  - listFolder(folder)                               │
  │  - loadRepoTree()                                   │
  │  - getDirectoryAssets(folder)                       │
  │  - getRawUrl / getGithubUrl / getGithubFolderUrl    │
  │  Nuevo:                                             │
  │  - getFileText(path)   texto de un fichero, cacheado│
  │  - clearCache()        vacía la caché               │
  │                                                     │
  │  No contiene lógica de renderizado ni UI.           │
  └─────────────────────────────────────────────────────┘
  ========================================================= */
class GithubService {
  constructor() {
    this._memory = new Map();       // clave → { time, value }
    this._pending = new Map();      // clave → Promise (evita peticiones duplicadas)
  }

  /* ── Configuración ────────────────────────────────────── */
  get repoId() {
    return `${CONFIG.owner}/${CONFIG.repo}@${CONFIG.branch}`;
  }
  get source() {
    return (CONFIG.source || 'jsdelivr').toLowerCase();
  }
  get ttlMs() {
    const minutes = Number.isFinite(CONFIG.cacheTtlMinutes) ? CONFIG.cacheTtlMinutes : 10;
    return Math.max(0, minutes) * 60 * 1000;
  }

  getHeaders() {
    const headers = { Accept: 'application/vnd.github.v3+json' };
    if (CONFIG.token) {
      headers.Authorization = `token ${CONFIG.token}`;
    }
    return headers;
  }

  /* ── Caché ────────────────────────────────────────────── */
  _storageKey(key) {
    return `gnx-cache:${this.repoId}:${key}`;
  }

  _cacheGet(key) {
    const now = Date.now();
    const mem = this._memory.get(key);
    if (mem && now - mem.time < this.ttlMs) return mem.value;
    try {
      const raw = sessionStorage.getItem(this._storageKey(key));
      if (raw) {
        const stored = JSON.parse(raw);
        if (now - stored.time < this.ttlMs) {
          this._memory.set(key, stored);
          return stored.value;
        }
      }
    } catch (e) { /* sessionStorage no disponible o lleno: solo memoria */ }
    return undefined;
  }

  _cacheSet(key, value, { persist = true } = {}) {
    const entry = { time: Date.now(), value };
    this._memory.set(key, entry);
    if (!persist) return;
    try {
      sessionStorage.setItem(this._storageKey(key), JSON.stringify(entry));
    } catch (e) { /* sin espacio: se queda solo en memoria */ }
  }

  /** Ejecuta loader() una sola vez por clave y guarda el resultado. */
  async _cached(key, loader, options) {
    const hit = this._cacheGet(key);
    if (hit !== undefined) return hit;
    if (this._pending.has(key)) return this._pending.get(key);

    const promise = (async () => {
      try {
        const value = await loader();
        this._cacheSet(key, value, options);
        return value;
      } finally {
        this._pending.delete(key);
      }
    })();
    this._pending.set(key, promise);
    return promise;
  }

  clearCache() {
    this._memory.clear();
    this._pending.clear();
    try {
      const prefix = `gnx-cache:${this.repoId}:`;
      Object.keys(sessionStorage)
        .filter((k) => k.startsWith(prefix))
        .forEach((k) => sessionStorage.removeItem(k));
    } catch (e) { /* nada que limpiar */ }
  }

  /* ── Utilidades de ruta ───────────────────────────────── */
  _cleanPath(path) {
    return String(path || '').replace(/^\/+|\/+$/g, '');
  }

  _encodePath(path) {
    return this._cleanPath(path).split('/').map(encodeURIComponent).join('/');
  }

  /* ── Árbol completo del repositorio ───────────────────── */
  /**
   * Devuelve [{ path, type: 'blob'|'tree', size }], igual que la API
   * git/trees de GitHub, venga de jsDelivr o de GitHub.
   */
  async loadRepoTree() {
    return this._cached('tree', async () => {
      if (this.source === 'github') {
        return this._loadTreeFromGithub();
      }
      try {
        return await this._loadTreeFromJsdelivr();
      } catch (error) {
        console.warn('[GithubService] jsDelivr no disponible, se usa la API de GitHub.', error);
        return this._loadTreeFromGithub();
      }
    });
  }

  async _loadTreeFromJsdelivr() {
    const url = `https://data.jsdelivr.com/v1/packages/gh/${CONFIG.owner}/${CONFIG.repo}@${CONFIG.branch}?structure=flat`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`jsDelivr ${response.status}`);
    }
    const data = await response.json();
    const blobs = (data.files || []).map((file) => ({
      path: this._cleanPath(file.name),
      type: 'blob',
      size: file.size
    }));

    // jsDelivr solo lista ficheros: se deducen las carpetas
    const dirs = new Set();
    blobs.forEach(({ path }) => {
      const parts = path.split('/');
      for (let i = 1; i < parts.length; i++) {
        dirs.add(parts.slice(0, i).join('/'));
      }
    });
    const trees = Array.from(dirs).map((path) => ({ path, type: 'tree' }));
    return [...trees, ...blobs];
  }

  async _loadTreeFromGithub() {
    const url =
      `https://api.github.com/repos/${CONFIG.owner}/` +
      `${CONFIG.repo}/git/trees/${CONFIG.branch}?recursive=1`;
    const response = await fetch(url, { headers: this.getHeaders() });
    if (!response.ok) {
      throw new Error(`GitHub API ${response.status}`);
    }
    const data = await response.json();
    return (data.tree || []).map(({ path, type, size }) => ({ path, type, size }));
  }

  /* ── Contenido de una carpeta ─────────────────────────── */
  /**
   * Devuelve los hijos directos de la carpeta con el mismo formato
   * que la API "contents" de GitHub:
   * { name, path, type: 'file'|'dir', size, download_url, html_url }
   */
  async listFolder(folder) {
    const clean = this._cleanPath(folder);
    return this._cached(`list:${clean}`, async () => {
      let tree;
      try {
        tree = await this.loadRepoTree();
      } catch (error) {
        // Último recurso: la API "contents" para esta carpeta concreta
        return this._listFolderFromGithub(clean);
      }

      const folderExists = !clean || tree.some((item) => item.type === 'tree' && item.path === clean);
      if (!folderExists) {
        throw new Error(`Error cargando carpeta ${folder}`);
      }

      const prefix = clean ? `${clean}/` : '';
      return tree
        .filter((item) => item.path.startsWith(prefix))
        .filter((item) => !item.path.slice(prefix.length).includes('/'))
        .map((item) => this._toContentItem(item))
        .sort((a, b) => a.name.localeCompare(b.name));
    }, { persist: false });
  }

  async _listFolderFromGithub(folder) {
    const url =
      `https://api.github.com/repos/${CONFIG.owner}/` +
      `${CONFIG.repo}/contents/${this._encodePath(folder)}?ref=${CONFIG.branch}`;
    const response = await fetch(url, { headers: this.getHeaders() });
    if (!response.ok) {
      throw new Error(`Error cargando carpeta ${folder}`);
    }
    return response.json();
  }

  _toContentItem({ path, type, size }) {
    const isDir = type === 'tree';
    return {
      name: path.split('/').pop(),
      path,
      type: isDir ? 'dir' : 'file',
      size: isDir ? 0 : size,
      download_url: isDir ? null : this.getRawUrl(path),
      html_url: isDir ? this.getGithubFolderUrl(path) : this.getGithubUrl(path)
    };
  }

  /* ── Activos de una card ──────────────────────────────── */
  async getDirectoryAssets(folder) {
    const files = await this.listFolder(folder);
    const result = {
      schemas: [],
      examples: [],
      readmes: {},
      others: []
    };
    files.forEach((file) => {
      if (file.type === 'dir') return;   // Subcarpetas (p. ej. OldVersions) no son activos
      const lower = String(file.name || '').toLowerCase();
      const readmeMatch = lower.match(/^readme\.([a-z]{2})\.md$/);
      if (readmeMatch) {
        result.readmes[readmeMatch[1]] = file;
        return;
      }
      if (lower.includes('schema') || lower.endsWith('.xsd')) {
        result.schemas.push(file);
        return;
      }
      if (lower.includes('ejemplo') || lower.includes('example') || lower.includes('sample')) {
        result.examples.push(file);
        return;
      }
      result.others.push(file);
    });
    return result;
  }

  /* ── Texto de un fichero (cacheado) ───────────────────── */
  async getFileText(path) {
    const clean = this._cleanPath(path);
    return this._cached(`file:${clean}`, async () => {
      const response = await fetch(this.getRawUrl(clean), { cache: 'no-cache' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} · ${clean}`);
      }
      return response.text();
    }, { persist: false });
  }

  /* ── URLs ─────────────────────────────────────────────── */
  getRawUrl(path) {
    return `https://raw.githubusercontent.com/${CONFIG.owner}/${CONFIG.repo}/${CONFIG.branch}/${this._encodePath(path)}`;
  }
  getGithubUrl(path) {
    return `https://github.com/${CONFIG.owner}/${CONFIG.repo}/blob/${CONFIG.branch}/${this._encodePath(path)}`;
  }
  getGithubFolderUrl(path) {
    return `https://github.com/${CONFIG.owner}/${CONFIG.repo}/tree/${CONFIG.branch}/${this._encodePath(path)}`;
  }
}
window.GithubService = new GithubService();
