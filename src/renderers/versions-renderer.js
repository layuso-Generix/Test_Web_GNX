/* =========================================================
  file-list-renderer.js — Listado de ficheros por carpeta
  ┌─────────────────────────────────────────────────────┐
  │  Un solo renderer para 2 vistas con el MISMO formato│
  │  - Versiones  → window.VersionsRenderer             │
  │  - AEAT       → window.AeatRenderer                 │
  │                                                     │
  │  Cada vista:                                        │
  │  - Estado (n ficheros en m carpetas) + ↻ Actualizar │
  │  - Índice rápido por carpeta                        │
  │  - Tarjetas: icono, nombre, tipo · tamaño · subcarp.│
  │    Descargar · Ver en GitHub · Ver contenido        │
  │  Sustituye a versions-renderer.js                   │
  └─────────────────────────────────────────────────────┘
  ========================================================= */
(function () {
  'use strict';

  const TEXT_EXT = ['json', 'xml', 'xsd', 'txt', 'md', 'csv', 'html', 'htm', 'yaml', 'yml', 'properties', 'svg'];
  const ICONS = {
    pdf: '📕', json: '🟨', xml: '📃', xsd: '📐', csv: '📊', xlsx: '📊', xls: '📊',
    doc: '📄', docx: '📄', txt: '📄', md: '📝', html: '🌐', htm: '🌐',
    png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', svg: '🖼️', zip: '🗜️'
  };
  const ROOT = '(raíz)';
  const MAX_PREVIEW = 60000;

  /* ── Utilidades ───────────────────────────────────────── */
  const extOf = (name) => {
    const i = String(name).lastIndexOf('.');
    return i >= 0 ? String(name).slice(i + 1).toLowerCase() : '';
  };
  const iconFor = (name) => ICONS[extOf(name)] || '📁';
  const isText = (name) => TEXT_EXT.includes(extOf(name));
  const fmtBytes = (b) => {
    if (b == null) return '';
    if (b < 1024) return `${b} B`;
    if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1048576).toFixed(1)} MB`;
  };
  const slug = (value) => String(value).replace(/[^A-Za-z0-9_-]/g, '-');
  const escAttr = (value) => esc(value).replace(/'/g, '&#39;');

  /** t() con texto por defecto si la clave no existe todavía */
  const tr = (key, fallback, params) => {
    const value = typeof t === 'function' ? t(key, params) : null;
    if (value && value !== key) return value;
    return String(fallback).replace(/\{(\w+)\}/g, (_, k) => (params && params[k] != null ? params[k] : ''));
  };

  /* ── Clase ────────────────────────────────────────────── */
  class FileListRenderer {
    /**
     * @param {object} options
     *  key        prefijo de ids y de claves i18n ('vers' / 'aeat')
     *  i18n       prefijo de claves i18n ('versions' / 'aeat')
     *  getFolder  () => carpeta del repo
     *  groupIcon  emoji de cada carpeta
     *  sortDesc   true → ficheros de más nuevo a más antiguo
     */
    constructor(options) {
      this.opt = options;
      this.previewCache = {};
    }

    el(suffix) {
      return document.getElementById(`${this.opt.key}${suffix}`);
    }

    async render({ refresh = false } = {}) {
      const status = this.el('Status');
      const cont = this.el('Container');
      const quick = this.el('Quick');
      if (!status || !cont || !quick) {
        console.warn(`[FileList:${this.opt.key}] Faltan #${this.opt.key}Status, #${this.opt.key}Container o #${this.opt.key}Quick en el HTML.`);
        return;
      }
      const folder = String(this.opt.getFolder() || '').replace(/^\/+|\/+$/g, '');
      const i18n = this.opt.i18n;

      if (refresh) {
        window.GithubService.clearCache();
        this.previewCache = {};
      }
      status.textContent = tr('loading', 'Cargando…');
      cont.innerHTML = '';
      quick.innerHTML = '';

      try {
        const tree = await window.GithubService.loadRepoTree();
        const prefix = `${folder}/`;
        const files = tree
          .filter((item) => item.type === 'blob' && item.path.startsWith(prefix))
          .map((item) => ({ path: item.path, size: item.size }));

        if (!files.length) {
          status.textContent = '';
          cont.innerHTML = `
            <div class="highlight-box">
              <strong>${esc(tr(`${i18n}.emptyTitle`, 'Carpeta vacía o aún no creada'))}</strong><br>
              ${esc(tr(`${i18n}.emptyBody`, 'No se han encontrado ficheros en {path}.', { path: folder }))}<br>
              <a class="download-link" target="_blank" rel="noopener" href="${window.GithubService.getGithubFolderUrl(folder)}">${esc(tr('btn.viewFolderGithub', 'Ver carpeta en GitHub'))}</a>
            </div>`;
          return;
        }

        const groups = this.buildGroups(files, prefix);
        const names = Object.keys(groups).sort((a, b) =>
          a === ROOT ? -1 : b === ROOT ? 1 : a.localeCompare(b, undefined, { numeric: true }));
        const label = (group) => (group === ROOT ? tr(`${i18n}.general`, 'General') : group);

        status.textContent = tr(`${i18n}.count`, '{n} fichero(s) en {m} carpeta(s)', { n: files.length, m: names.length });

        quick.innerHTML = names.map((group) => `
          <a href="javascript:void(0)" data-target="${this.groupId(group)}"
             onclick="document.getElementById(this.dataset.target).scrollIntoView({behavior:'smooth'})">
            ${esc(label(group))} (${groups[group].length})
          </a>`).join('');

        cont.innerHTML = names.map((group) => {
          const items = groups[group].sort((a, b) => this.opt.sortDesc
            ? b.name.localeCompare(a.name, undefined, { numeric: true })
            : a.name.localeCompare(b.name, undefined, { numeric: true }));
          return `
            <div class="folder-section" id="${this.groupId(group)}">
              <h3>${this.opt.groupIcon} ${esc(label(group))}</h3>
              <div class="file-grid">
                ${items.map((file) => this.fileCard(file)).join('')}
              </div>
            </div>`;
        }).join('');
      } catch (error) {
        status.textContent = '';
        cont.innerHTML = `
          <div class="highlight-box">
            <strong>${esc(tr(`${i18n}.loadFail`, 'No se pudo cargar la documentación'))}</strong><br>
            ${esc(error.message)}<br>
            <a class="download-link" target="_blank" rel="noopener" href="${window.GithubService.getGithubFolderUrl(folder)}">${esc(tr('btn.viewFolderGithub', 'Ver carpeta en GitHub'))}</a>
          </div>`;
      }
    }

    groupId(group) {
      return `grp-${this.opt.key}-${slug(group)}`;
    }

    fileCard(file) {
      const previewId = `pv-${this.opt.key}-${slug(file.path)}`;
      const meta = [
        (extOf(file.name) || 'file').toUpperCase(),
        fmtBytes(file.size),
        file.subdir ? `📁 ${file.subdir}` : ''
      ].filter(Boolean).join(' · ');

      const previewBtn = isText(file.name)
        ? `<button class="file-btn" type="button"
             onclick="window.${this.opt.globalName}.togglePreview('${escAttr(file.path)}', '${previewId}', this)">
             ${esc(tr('btn.viewContent', 'Ver contenido'))}
           </button>`
        : '';

      return `
        <div class="file-card">
          <div class="file-card__head">
            <div class="file-card__icon">${iconFor(file.name)}</div>
            <div>
              <div class="file-card__name">${esc(file.name)}</div>
              <div class="file-card__meta">${esc(meta)}</div>
            </div>
          </div>
          <div class="file-card__actions">
            <a class="file-btn file-btn--primary" target="_blank" rel="noopener" download
               href="${window.GithubService.getRawUrl(file.path)}">${esc(tr('btn.download', 'Descargar'))}</a>
            <a class="file-btn" target="_blank" rel="noopener"
               href="${window.GithubService.getGithubUrl(file.path)}">${esc(tr('btn.viewGithub', 'Ver en GitHub'))}</a>
            ${previewBtn}
          </div>
          <div class="file-preview" id="${previewId}"><pre></pre></div>
        </div>`;
    }

    buildGroups(files, prefix) {
      const groups = {};
      files.forEach((file) => {
        const parts = file.path.slice(prefix.length).split('/');
        const group = parts.length > 1 ? parts[0] : ROOT;
        (groups[group] = groups[group] || []).push({
          ...file,
          name: parts[parts.length - 1],
          subdir: parts.slice(1, -1).join('/')
        });
      });
      return groups;
    }

    async togglePreview(path, pid, btn) {
      const box = document.getElementById(pid);
      if (!box) return;
      const card = box.closest('.file-card');
      const grid = box.closest('.file-grid');

      if (box.classList.contains('open')) {
        box.classList.remove('open');
        if (card) card.classList.remove('expanded');
        btn.textContent = tr('btn.viewContent', 'Ver contenido');
        return;
      }

      // Solo una vista previa abierta por carpeta
      if (grid) {
        grid.querySelectorAll('.file-preview.open').forEach((openBox) => {
          openBox.classList.remove('open');
          const openCard = openBox.closest('.file-card');
          if (openCard) openCard.classList.remove('expanded');
          const openBtn = openCard && openCard.querySelector('button.file-btn');
          if (openBtn) openBtn.textContent = tr('btn.viewContent', 'Ver contenido');
        });
      }

      box.classList.add('open');
      if (card) card.classList.add('expanded');
      btn.textContent = tr('btn.hide', 'Ocultar');

      const pre = box.querySelector('pre');
      if (!pre) return;
      if (this.previewCache[path]) {
        pre.textContent = this.previewCache[path];
        return;
      }
      pre.textContent = tr('loading', 'Cargando…');
      try {
        let text = await window.GithubService.getFileText(path);
        if (text.length > MAX_PREVIEW) {
          text = `${text.slice(0, MAX_PREVIEW)}\n\n${tr('files.truncated', '… (contenido truncado)')}`;
        }
        this.previewCache[path] = text;
        pre.textContent = text;
      } catch (error) {
        pre.textContent = `${tr('files.previewFail', 'No se pudo cargar la vista previa: ')}${error.message}`;
      }
    }
  }

  /* ── Instancias ───────────────────────────────────────── */
  window.FileListRenderer = FileListRenderer;

  window.VersionsRenderer = new FileListRenderer({
    key: 'vers',
    i18n: 'versions',
    globalName: 'VersionsRenderer',
    getFolder: () => CONFIG.versionsPath,
    groupIcon: '📦',
    sortDesc: true
  });

  window.AeatRenderer = new FileListRenderer({
    key: 'aeat',
    i18n: 'aeat',
    globalName: 'AeatRenderer',
    getFolder: () => CONFIG.docuAeatPath,
    groupIcon: '⚖️',
    sortDesc: false
  });
})();
