/* =========================================================
  examples-renderer.js — Catálogo de ejemplos por casuística
  ┌─────────────────────────────────────────────────────┐
  │  Lee E-invoicing/Standard/Examples/catalog.json     │
  │  y pinta los casos del formato de la card (XML/JSON)│
  │                                                     │
  │  - Buscador (ID, título, texto, tipo L1)            │
  │  - Filtro por grupo                                 │
  │  - Cada caso: descripción, qué enviar, qué comprobar│
  │    Descargar · Ver contenido · Copiar               │
  │                                                     │
  │  Para añadir/cambiar ejemplos NO se toca el código: │
  │  se edita catalog.json y se suben los ficheros.     │
  └─────────────────────────────────────────────────────┘
  ========================================================= */
(function () {
  'use strict';

  const tr = (key, fallback, params) => {
    const v = typeof t === 'function' ? t(key, params) : null;
    if (v && v !== key) return v;
    return String(fallback).replace(/\{(\w+)\}/g, (_, k) => (params && params[k] != null ? params[k] : ''));
  };
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

      this.$('exCrumbFmt').textContent = card.format;
      this.$('exCrumbFmt').href = `#${this.format}`;
      this.$('exTitle').textContent = localizedSectionTitle(card);
      this.$('exCrumbCur').textContent = localizedSectionTitle(card);
      this.$('exDesc').textContent = localizedSectionDesc(card);
      this.$('exList').innerHTML = `<p class="ex-empty">${esc(tr('loading', 'Cargando…'))}</p>`;
      this.$('exChips').innerHTML = '';
      this.$('exCount').textContent = '';

      const search = this.$('exSearch');
      search.value = this.query = '';
      search.placeholder = tr('ex.search', 'Buscar por ID, caso, tipo o texto…');
      search.oninput = () => { this.query = search.value; this.paint(); };
      this.group = '';

      try {
        const raw = await window.GithubService.getFileText(`${examplesRoot()}/catalog.json`);
        const catalog = JSON.parse(raw);
        // Solo los casos que tienen fichero en este formato
        this.groups = (catalog.groups || [])
          .map((g) => ({ ...g, cases: (g.cases || []).filter((c) => c.files && c.files[this.format]) }))
          .filter((g) => g.cases.length);
        this.paintChips();
        this.paint();
      } catch (error) {
        this.$('exList').innerHTML = `
          <div class="highlight-box">
            <strong>${esc(tr('ex.loadFail', 'No se pudo cargar el catálogo de ejemplos'))}</strong><br>${esc(error.message)}
          </div>`;
      }
    }

    paintChips() {
      const total = this.groups.reduce((n, g) => n + g.cases.length, 0);
      const chip = (id, label, n) =>
        `<button type="button" class="ex-chip${this.group === id ? ' active' : ''}" data-group="${esc(id)}">${esc(label)} <span>${n}</span></button>`;
      this.$('exChips').innerHTML =
        chip('', tr('ex.all', 'Todos'), total) +
        this.groups.map((g) => chip(g.id, g.title, g.cases.length)).join('');
      this.$('exChips').querySelectorAll('.ex-chip').forEach((b) => {
        b.onclick = () => { this.group = b.dataset.group; this.paintChips(); this.paint(); };
      });
    }

    matches(c) {
      if (!this.query) return true;
      const hay = norm([c.id, c.title, c.description, c.send, c.check, c.issuer, c.docType, c.label].join(' '));
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
              <h3>${esc(g.title)} <small>${cases.length}</small></h3>
              ${cases.map((c) => this.caseHtml(c)).join('')}
            </section>`;
        }).join('');

      this.$('exCount').textContent = tr('ex.count', '{n} caso(s)', { n: shown });
      list.innerHTML = html || `<p class="ex-empty">${esc(tr('ex.none', 'No hay ejemplos que coincidan con la búsqueda.'))}</p>`;

      list.querySelectorAll('[data-ex-action]').forEach((btn) => {
        btn.onclick = (e) => { e.preventDefault(); this[btn.dataset.exAction](btn.dataset.path, btn); };
      });
    }

    caseHtml(c) {
      const path = `${examplesRoot()}/${c.files[this.format]}`;
      const fileName = path.split('/').pop();
      const row = (label, value) => value ? `<p><strong>${esc(label)}:</strong> ${esc(value)}</p>` : '';
      return `
        <details class="ex-case" id="${esc(c.id)}">
          <summary>
            <span class="ex-id">${esc(c.id)}</span>
            <span class="ex-title">${esc(c.title)}</span>
            ${c.docType ? `<span class="badge badge-cat" title="L1">${esc(c.docType)}</span>` : ''}
            ${c.issuer ? `<span class="ex-issuer">${esc(c.issuer)}</span>` : ''}
          </summary>
          <div class="ex-body">
            ${c.description ? `<p>${esc(c.description)}</p>` : ''}
            ${row(tr('ex.send', 'Qué enviar'), c.send)}
            ${row(tr('ex.check', 'Qué comprobar'), c.check)}
            <div class="ex-actions">
              <a class="file-btn file-btn--primary" download="${esc(fileName)}" target="_blank" rel="noopener"
                 href="${window.GithubService.getRawUrl(path)}">${esc(tr('btn.download', 'Descargar'))}</a>
              <button type="button" class="file-btn" data-ex-action="toggle" data-path="${esc(path)}">${esc(tr('btn.viewContent', 'Ver contenido'))}</button>
              <button type="button" class="file-btn" data-ex-action="copy" data-path="${esc(path)}">${esc(tr('btn.copy', 'Copiar'))}</button>
            </div>
            <pre class="ex-pre" hidden></pre>
          </div>
        </details>`;
    }

    async toggle(path, btn) {
      const pre = btn.closest('.ex-body').querySelector('.ex-pre');
      if (!pre.hidden) {
        pre.hidden = true;
        btn.textContent = tr('btn.viewContent', 'Ver contenido');
        return;
      }
      pre.hidden = false;
      btn.textContent = tr('btn.hide', 'Ocultar');
      if (pre.dataset.loaded) return;
      pre.textContent = tr('loading', 'Cargando…');
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
        btn.textContent = tr('btn.copied', '✓ Copiado');
      } catch (error) {
        btn.textContent = '✗';
      }
      setTimeout(() => { btn.textContent = label; }, 1500);
    }
  }

  RendererFactory.registerRenderer('Examples', ExamplesRenderer);
  window.ExamplesRenderer = ExamplesRenderer;
})();
