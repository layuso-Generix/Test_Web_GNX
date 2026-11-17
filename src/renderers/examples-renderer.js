/* =========================================================
  examples-renderer.js — Catálogo de ejemplos por casuística
  ┌─────────────────────────────────────────────────────┐
  │  Lee E-invoicing/Standard/Examples/catalog.json     │
  │  Bilingüe: usa <campo>_en si la web está en inglés  │
  │  (title_en, description_en, send_en, check_en,      │
  │   issuer_en) y, si falta, el texto en español.      │
  └─────────────────────────────────────────────────────┘
  ========================================================= */
(function () {
  'use strict';

  /* Textos de la vista (no dependen de i18n.js) */
  const UI = {
    es: { loading: 'Cargando…', search: 'Buscar por ID, caso, tipo o texto…', loadFail: 'No se pudo cargar el catálogo de ejemplos',
          all: 'Todos', count: '{n} caso(s)', none: 'No hay ejemplos que coincidan con la búsqueda.',
          send: 'Qué enviar', check: 'Qué comprobar', download: 'Descargar', view: 'Ver contenido', hide: 'Ocultar',
          copy: 'Copiar', copied: '✓ Copiado', pending: 'Traducción pendiente' },
    en: { loading: 'Loading…', search: 'Search by ID, case, type or text…', loadFail: 'Could not load the examples catalog',
          all: 'All', count: '{n} case(s)', none: 'No examples match your search.',
          send: 'What to send', check: 'What to check', download: 'Download', view: 'View content', hide: 'Hide',
          copy: 'Copy', copied: '✓ Copied', pending: 'Translation pending' }
  };
  const ui = (key, params) => {
    const dict = UI[window.LANG] || UI.es;
    return String(dict[key] ?? UI.es[key] ?? key)
      .replace(/\{(\w+)\}/g, (_, k) => (params && params[k] != null ? params[k] : ''));
  };
  /** Texto en el idioma activo: obj.title_en → obj.title */
  const loc = (obj, field) => (window.LANG && window.LANG !== 'es' && obj[`${field}_${window.LANG}`]) || obj[field] || '';
  const isTranslated = (c) => !window.LANG || window.LANG === 'es' || Boolean(c[`title_${window.LANG}`]);

  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const examplesRoot = () => String(CONFIG.examplesPath || 'E-invoicing/Standard/Examples').replace(/\/+$/, '');

  class ExamplesRenderer {
    constructor() {
      this.card = null;
      this.format = 'xml';
      this.groups = [];
      this.query = '';
      this.group = '';
    }

    $(id) { return document.getElementById(id); }

    async render({ card }) {
      this.card = card;
      this.format = String(card.format || 'xml').toLowerCase();
      showView('view-examples');
      document.title = `${localizedSectionTitle(card)} · Generix`;

      const crumbFmt = this.$('exCrumbFmt');
      crumbFmt.textContent = card.format;
      crumbFmt.href = `#${this.format}`;
      this.$('exTitle').textContent = localizedSectionTitle(card);
      this.$('exCrumbCur').textContent = localizedSectionTitle(card);
      this.$('exDesc').textContent = localizedSectionDesc(card);
      this.$('exList').innerHTML = `<p class="ex-empty">${esc(ui('loading'))}</p>`;
      this.$('exChips').innerHTML = '';
      this.$('exCount').textContent = '';

      const search = this.$('exSearch');
      search.value = this.query = '';
      search.placeholder = ui('search');
      search.oninput = () => { this.query = search.value; this.paint(); };
      this.group = '';

      try {
        const raw = await window.GithubService.getFileText(`${examplesRoot()}/catalog.json`);
        const catalog = JSON.parse(raw);
        // Carpeta y extensión de cada formato
        const FOLDER = { xml: 'Xml', json: 'Json', ubl: 'Ubl' };
        const EXT = { xml: 'xml', json: 'json', ubl: 'xml' };
        const root = examplesRoot();

        // Ficheros que existen en el repo: solo se muestran los casos que tienen fichero
        let existing = null;
        try {
          const tree = await window.GithubService.loadRepoTree();
          existing = new Set(tree.filter((i) => i.type === 'blob').map((i) => i.path));
        } catch (e) { /* sin listado: se muestran todos */ }

        const fileFor = (c) => {
          if (c.files && c.files[this.format]) return c.files[this.format];   // formato antiguo
          if (!c.file) return '';
          const rel = `${FOLDER[this.format] || this.format}/${c.file}.${EXT[this.format] || this.format}`;
          return !existing || existing.has(`${root}/${rel}`) ? rel : '';
        };

        this.groups = (catalog.groups || [])
          .map((g) => ({
            ...g,
            cases: (g.cases || [])
              .map((c) => {
                const rel = fileFor(c);
                return rel ? { ...c, files: { ...(c.files || {}), [this.format]: rel } } : null;
              })
              .filter(Boolean)
          }))
          .filter((g) => g.cases.length);
        this.paintChips();
        this.paint();
      } catch (error) {
        this.$('exList').innerHTML = `
          <div class="highlight-box"><strong>${esc(ui('loadFail'))}</strong><br>${esc(error.message)}</div>`;
      }
    }

    paintChips() {
      const total = this.groups.reduce((n, g) => n + g.cases.length, 0);
      const chip = (id, label, n) =>
        `<button type="button" class="ex-chip${this.group === id ? ' active' : ''}" data-group="${esc(id)}">${esc(label)} <span>${n}</span></button>`;
      this.$('exChips').innerHTML =
        chip('', ui('all'), total) + this.groups.map((g) => chip(g.id, loc(g, 'title'), g.cases.length)).join('');
      this.$('exChips').querySelectorAll('.ex-chip').forEach((b) => {
        b.onclick = () => { this.group = b.dataset.group; this.paintChips(); this.paint(); };
      });
    }

    matches(c) {
      if (!this.query) return true;
      // Busca en los dos idiomas: el cliente encuentra el caso escriba como escriba
      const hay = norm(['id', 'title', 'description', 'send', 'check', 'issuer', 'docType', 'label']
        .flatMap((f) => [c[f], c[`${f}_en`]]).join(' '));
      return norm(this.query).split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
    }

    paint() {
      const list = this.$('exList');
      let shown = 0;
      const html = this.groups
        .filter((g) => !this.group || g.id === this.group)
        .map((g) => {
          const cases = g.cases.filter((c) => this.matches(c));
          if (!cases.length) return '';
          shown += cases.length;
          return `
            <section class="ex-group" id="ex-${esc(g.id)}">
              <h3>${esc(loc(g, 'title'))} <small>${cases.length}</small></h3>
              ${cases.map((c) => this.caseHtml(c)).join('')}
            </section>`;
        }).join('');

      this.$('exCount').textContent = ui('count', { n: shown });
      list.innerHTML = html || `<p class="ex-empty">${esc(ui('none'))}</p>`;
      list.querySelectorAll('[data-ex-action]').forEach((btn) => {
        btn.onclick = (e) => { e.preventDefault(); this[btn.dataset.exAction](btn.dataset.path, btn); };
      });
    }

    caseHtml(c) {
      const path = `${examplesRoot()}/${c.files[this.format]}`;
      const fileName = path.split('/').pop();
      const row = (label, value) => (value ? `<p><strong>${esc(label)}:</strong> ${esc(value)}</p>` : '');
      const issuer = loc(c, 'issuer');
      return `
        <details class="ex-case" id="${esc(c.id)}">
          <summary>
            <span class="ex-id">${esc(c.id)}</span>
            <span class="ex-title">${esc(loc(c, 'title'))}</span>
            ${c.docType ? `<span class="badge badge-cat" title="L1">${esc(c.docType)}</span>` : ''}
            ${issuer ? `<span class="ex-issuer">${esc(issuer)}</span>` : ''}
            ${isTranslated(c) ? '' : `<span class="ex-pending" title="${esc(ui('pending'))}">ES</span>`}
          </summary>
          <div class="ex-body">
            ${loc(c, 'description') ? `<p>${esc(loc(c, 'description'))}</p>` : ''}
            ${row(ui('send'), loc(c, 'send'))}
            ${row(ui('check'), loc(c, 'check'))}
            <div class="ex-actions">
              <a class="file-btn file-btn--primary" download="${esc(fileName)}" target="_blank" rel="noopener"
                 href="${window.GithubService.getRawUrl(path)}">${esc(ui('download'))}</a>
              <button type="button" class="file-btn" data-ex-action="toggle" data-path="${esc(path)}">${esc(ui('view'))}</button>
              <button type="button" class="file-btn" data-ex-action="copy" data-path="${esc(path)}">${esc(ui('copy'))}</button>
            </div>
            <pre class="ex-pre" hidden></pre>
          </div>
        </details>`;
    }

    async toggle(path, btn) {
      const pre = btn.closest('.ex-body').querySelector('.ex-pre');
      if (!pre.hidden) { pre.hidden = true; btn.textContent = ui('view'); return; }
      pre.hidden = false;
      btn.textContent = ui('hide');
      if (pre.dataset.loaded) return;
      pre.textContent = ui('loading');
      try {
        pre.textContent = await window.GithubService.getFileText(path);
        pre.dataset.loaded = '1';
      } catch (error) {
        pre.textContent = error.message;
      }
    }

    async copy(path, btn) {
      const label = btn.textContent;
      try {
        await navigator.clipboard.writeText(await window.GithubService.getFileText(path));
        btn.textContent = ui('copied');
      } catch (error) {
        btn.textContent = '✗';
      }
      setTimeout(() => { btn.textContent = label; }, 1500);
    }
  }

  RendererFactory.registerRenderer('Examples', ExamplesRenderer);
  window.ExamplesRenderer = ExamplesRenderer;
})();
