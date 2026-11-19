/* =========================================================
  examples-renderer.js — Catálogo de ejemplos (v4: temas + filtros)
  ┌─────────────────────────────────────────────────────┐
  │  Lee E-invoicing/Standard/Examples/catalog.json (v4)│
  │                                                     │
  │  Diseño lista + ficha:                              │
  │  - Izquierda: casos agrupados por tema              │
  │  - Derecha: ficha del caso seleccionado             │
  │  - Buscador + filtros (tipo, impuesto, expedidor)   │
  │  - Modo "Buscar por código": código → casos         │
  │  - URL por caso: #xml/examples-xml/C036             │
  │  - Códigos con 🔗 a su enumeración                  │
  │  - Botón Validar: abre el validador con el ejemplo  │
  │                                                     │
  │  Bilingüe: usa <campo>_en con la web en inglés.     │
  └─────────────────────────────────────────────────────┘
  ========================================================= */
(function () {
  'use strict';

  const root = () => String(CONFIG.examplesPath || 'E-invoicing/Standard/Examples').replace(/\/+$/, '');
  const en = () => window.LANG === 'en';
  const ui = (es, eng) => (en() ? eng : es);
  const loc = (obj, key) => (en() && obj[key + '_en']) || obj[key] || '';
  const norm = (v) => String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  /* Campo del código → enumeración de la documentación (para el 🔗) */
  const ENUM_OF = {
    InvoiceDocumentType: 'InvoiceDocumentTypeEnum', InvoiceIssuerType: 'InvoiceIssuerTypeEnum',
    TaxRegimeCode: 'TaxRegimeCodeEnum', TaxOperationType: 'TaxOperationTypeEnum',
    ReasonCode: 'ReasonCodeEnum', CorrectionMethod: 'CorrectionMethodEnum',
    ChargeTypeCode: 'ChargeTypeCodeEnum', CadastralReference: 'CadastralReferenceEnum',
    TaxTypeCode: 'TaxTypeCodeEnum'
  };
  const FIELD_LABEL = {
    InvoiceDocumentType: ['Tipo de factura (L1)', 'Invoice type (L1)'],
    InvoiceIssuerType: ['Expedidor', 'Issuer'],
    TaxRegimeCode: ['Clave de régimen (L3)', 'Regime code (L3)'],
    TaxOperationType: ['Tipo de operación (L4)', 'Operation type (L4)'],
    ReasonCode: ['Motivo de rectificación (L2.A)', 'Correction reason (L2.A)'],
    CorrectionMethod: ['Modalidad de rectificación (L2.B)', 'Correction method (L2.B)'],
    ChargeTypeCode: ['Impuesto o cargo (L9)', 'Tax or charge (L9)'],
    CadastralReference: ['Situación del inmueble (L6)', 'Property location (L6)'],
    TaxTypeCode: ['Impuesto retenido', 'Withheld tax'],
    WithholdingType: ['Tipo de retención (L5)', 'Withholding type (L5)'],
    Surcharge: ['Recargo', 'Surcharge']
  };
  /* L5 no es una enumeración del schema: significado aquí */
  const L5 = {
    '01': ['Actividades profesionales', 'Professional activities'],
    '02': ['Actividades agrícolas y ganaderas', 'Agricultural and livestock activities'],
    '03': ['Actividades forestales', 'Forestry activities'],
    '04': ['Actividades empresariales del art. 95.6.2.º RIRPF', 'Business activities (art. 95.6.2 RIRPF)'],
    '05': ['Aprovechamientos forestales en montes públicos', 'Forestry use rights in public woodland'],
    '06': ['Arrendamiento de locales urbanos', 'Lease of urban premises'],
    '07': ['Propiedad intelectual, asistencia técnica y otros (art. 75.2.b RIRPF)', 'Intellectual property, technical assistance and others'],
    '08': ['Administradores o consejeros (RIS)', 'Directors or board members (CIT)'],
    '09': ['Derechos de imagen (RIS)', 'Image rights (CIT)'],
    '10': ['Arrendamiento de inmuebles urbanos (RIS)', 'Lease of urban property (CIT)'],
    '11': ['Otros', 'Other']
  };
  const FILTERS = () => [
    ['doc', ui('Tipo de factura', 'Invoice type'), ['380', '384', '388', '389', '471']],
    ['tax', ui('Impuesto', 'Tax'), ['IVA', 'IGIC', 'IPSI']],
    ['issuer', ui('Expedidor', 'Issuer'), ['EM', 'RE', 'TE']]
  ];

  function meaning(field, value) {
    if (field === 'WithholdingType') return (L5[value] || [])[en() ? 1 : 0] || '';
    const info = window.enumDescriptions && window.enumDescriptions[ENUM_OF[field]];
    const v = info && info.values && info.values[value];
    return v ? (en() ? v.eng : v.esp) : '';
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return; } catch (e) { /* respaldo */ }
    const field = document.createElement('textarea');
    field.value = text;
    field.style.cssText = 'position:fixed;left:-10000px;top:0';
    document.body.append(field);
    field.select();
    document.execCommand('copy');
    field.remove();
  }

  class ExamplesRenderer {
    $(id) { return document.getElementById(id); }

    async render({ card }) {
      this.card = card;
      this.format = String(card.format || 'xml').toLowerCase();
      this.query = '';
      this.topic = '';
      this.filters = { doc: '', tax: '', issuer: '' };
      this.mode = 'cases';
      this.selected = '';
      window.ExamplesView = this;

      showView('view-examples');
      const title = localizedSectionTitle(card);
      document.title = `${title} · Generix`;
      this.$('exCrumbFmt').textContent = card.format;
      this.$('exCrumbFmt').href = `#${this.format}`;
      this.$('exTitle').textContent = this.$('exCrumbCur').textContent = title;
      this.$('exDesc').textContent = localizedSectionDesc(card);
      this.$('exChips').innerHTML = '';
      this.$('exCount').textContent = '';
      this.$('exList').innerHTML = `<p class="ex-empty">${ui('Cargando…', 'Loading…')}</p>`;

      const search = this.$('exSearch');
      search.value = '';
      search.placeholder = ui('Buscar por ID, caso, código o texto (p. ej. C036, R2, retención)…',
        'Search by ID, case, code or text (e.g. C036, R2, withholding)…');
      search.oninput = () => { this.query = search.value.trim(); this.paint(); };

      try {
        const catalog = JSON.parse(await window.GithubService.getFileText(`${root()}/catalog.json`));
        if (!Array.isArray(catalog.cases)) {
          throw new Error(ui('El catálogo no tiene el formato v4. Ejecuta reorganizar_catalogo.py.',
            'Catalog is not v4. Run reorganizar_catalogo.py.'));
        }
        this.topics = catalog.topics || [];
        this.featured = catalog.featured || '';
        this.cases = catalog.cases;
        this.byId = new Map(this.cases.map((c) => [c.id, c]));
        this.selected = this.caseFromHash();
        this.paintToolbar();
        this.paint();
      } catch (error) {
        this.$('exList').innerHTML = `<div class="highlight-box"><strong>${
          ui('No se pudo cargar el catálogo de ejemplos', 'Could not load the examples catalog')}</strong><br>${esc(error.message)}</div>`;
      }
    }

    /* ── URL ─────────────────────────────────────────── */
    caseFromHash() {
      const parts = location.hash.replace(/^#\/?/, '').split('/');
      const id = (parts[2] || '').toUpperCase();
      return this.byId && this.byId.has(id) ? id : '';
    }
    caseRoute(id) {
      const base = window.Router ? Router.buildRoute(this.card.id) : this.card.id;
      return id ? `${base}/${id}` : base;
    }
    /** Lo llama el router al cambiar #…/examples-xml/<id> sin recargar la card */
    select(id) {
      if (!this.byId) return;
      this.selected = this.byId.has(String(id || '').toUpperCase()) ? String(id).toUpperCase() : '';
      this.paintList();
      this.paintDetail();
      if (this.selected) this.$('exDetail')?.scrollIntoView({ block: 'nearest' });
    }

    /* ── Barra de filtros ────────────────────────────── */
    paintToolbar() {
      const bar = this.$('exChips');
      const mode = (id, label) =>
        `<button type="button" class="ex-mode${this.mode === id ? ' active' : ''}" data-mode="${id}">${label}</button>`;
      const select = ([key, label, values]) => `
        <label class="ex-filter"><span>${esc(label)}</span>
          <select data-filter="${key}">
            <option value="">${ui('Todos', 'All')}</option>
            ${values.map((v) => `<option value="${v}"${this.filters[key] === v ? ' selected' : ''}>${v}</option>`).join('')}
          </select></label>`;
      const topicChip = (id, label, n) =>
        `<button type="button" class="ex-chip${this.topic === id ? ' active' : ''}" data-topic="${esc(id)}">${esc(label)} <span>${n}</span></button>`;

      bar.innerHTML = `
        <div class="ex-bar-row">
          <div class="ex-modes">${mode('cases', ui('📋 Casos', '📋 Cases'))}${mode('codes', ui('🔢 Buscar por código', '🔢 Find by code'))}</div>
          <div class="ex-filters">${FILTERS().map(select).join('')}</div>
        </div>
        <div class="ex-chips">
          ${topicChip('', ui('Todos', 'All'), this.cases.length)}
          ${this.topics.map((t) => topicChip(t.id, `${t.icon || ''} ${loc(t, 'title')}`,
            this.cases.filter((c) => c.topic === t.id).length)).join('')}
        </div>`;

      bar.onclick = (e) => {
        const m = e.target.closest('[data-mode]');
        if (m) { this.mode = m.dataset.mode; this.paintToolbar(); this.paint(); return; }
        const t = e.target.closest('[data-topic]');
        if (t) { this.topic = t.dataset.topic; this.paintToolbar(); this.paint(); }
      };
      bar.onchange = (e) => {
        const f = e.target.closest('[data-filter]');
        if (f) { this.filters[f.dataset.filter] = f.value; this.paint(); }
      };
    }

    /* ── Filtrado ────────────────────────────────────── */
    visibleCases() {
      const words = norm(this.query).split(/\s+/).filter(Boolean);
      return this.cases.filter((c) => {
        if (this.topic && c.topic !== this.topic) return false;
        const tags = c.tags || [];
        if (this.filters.doc && !tags.includes(this.filters.doc)) return false;
        if (this.filters.tax && !tags.includes(this.filters.tax)) return false;
        if (this.filters.issuer && !tags.includes(this.filters.issuer)) return false;
        if (!words.length) return true;
        const hay = norm([c.id, c.title, c.title_en, c.description, c.description_en, c.send, c.send_en,
          c.check, c.check_en, c.issuer, ...(c.amounts || []), ...tags,
          ...Object.entries(c.codes || {}).map(([k, v]) => `${k} ${v} ${meaning(k, v)}`)].join(' '));
        return words.every((w) => hay.includes(w));
      });
    }

    paint() {
      const list = this.$('exList');
      if (this.mode === 'codes') {
        this.$('exCount').textContent = '';
        list.innerHTML = this.codesHtml();
        return;
      }
      list.innerHTML = `
        <div class="ex-layout">
          <aside class="ex-nav" id="exNav" aria-label="${ui('Casos', 'Cases')}"></aside>
          <article class="ex-detail" id="exDetail" aria-live="polite"></article>
        </div>`;
      list.onclick = (e) => {
        const btn = e.target.closest('[data-ex-action]');
        if (btn) { e.preventDefault(); this.act(btn); }
      };
      this.paintList();
      this.paintDetail();
    }

    paintList() {
      const nav = this.$('exNav');
      if (!nav) return;
      const visible = this.visibleCases();
      this.$('exCount').textContent = ui(`${visible.length} de ${this.cases.length} casos`,
        `${visible.length} of ${this.cases.length} cases`);
      if (!visible.length) {
        nav.innerHTML = `<p class="ex-empty">${ui('No hay casos que coincidan.', 'No matching cases.')}</p>`;
        return;
      }
      nav.innerHTML = this.topics.map((t) => {
        const items = visible.filter((c) => c.topic === t.id);
        if (!items.length) return '';
        return `
          <section class="ex-nav-group">
            <h4>${t.icon || ''} ${esc(loc(t, 'title'))} <small>${items.length}</small></h4>
            ${items.map((c) => `
              <a class="ex-item${c.id === this.selected ? ' active' : ''}" href="#${esc(this.caseRoute(c.id))}">
                <span class="ex-id">${esc(c.id)}</span>
                <span class="ex-item-title">${esc(loc(c, 'title'))}</span>
              </a>`).join('')}
          </section>`;
      }).join('');
      nav.querySelector('.ex-item.active')?.scrollIntoView({ block: 'nearest' });
    }

    /* ── Ficha ───────────────────────────────────────── */
    paintDetail() {
      const box = this.$('exDetail');
      if (!box) return;
      const c = this.byId.get(this.selected);
      box.innerHTML = c ? this.caseHtml(c) : this.welcomeHtml();
    }

    welcomeHtml() {
      const f = this.byId.get(this.featured);
      const quick = ['rectificativas', 'retenciones', 'exenciones', 'especiales']
        .map((id) => this.topics.find((t) => t.id === id)).filter(Boolean);
      return `
        <div class="ex-welcome">
          <h3>${ui('¿Por dónde empiezo?', 'Where do I start?')}</h3>
          <ol>
            <li>${ui('Empieza por el <strong>caso de referencia</strong>: una factura ordinaria completa.',
              'Start with the <strong>reference case</strong>: a complete standard invoice.')}</li>
            <li>${ui('Busca tu situación por tema, filtro o texto, o usa <strong>Buscar por código</strong> si ya sabes el código.',
              'Find your scenario by topic, filter or text, or use <strong>Find by code</strong> if you know the code.')}</li>
            <li>${ui('Descarga el ejemplo, adáptalo y pulsa <strong>Validar</strong> para comprobarlo.',
              'Download the example, adapt it and click <strong>Validate</strong> to check it.')}</li>
          </ol>
          ${f ? `<a class="ex-featured" href="#${esc(this.caseRoute(f.id))}">
            <span class="ex-id">${esc(f.id)}</span><strong>${esc(loc(f, 'title'))}</strong>
            <span>${esc(loc(f, 'description'))}</span></a>` : ''}
          <h4>${ui('Lo más consultado', 'Most used')}</h4>
          <div class="ex-quick">${quick.map((t) =>
            `<button type="button" class="ex-chip" data-quick-topic="${esc(t.id)}">${t.icon || ''} ${esc(loc(t, 'title'))}</button>`).join('')}</div>
        </div>`;
    }

    codeRow(field, value) {
      const label = (FIELD_LABEL[field] || [field, field])[en() ? 1 : 0];
      const enumName = ENUM_OF[field];
      const docCard = typeof findCardById === 'function' ? findCardById(`invoice-${this.format}`) : null;
      const link = enumName && docCard && window.Router
        ? `<a class="ex-code-link" title="${ui('Ver enumeración', 'View enumeration')}"
             href="#${esc(Router.buildRoute(docCard.id, 'enumeraciones', `enum-${enumName}`))}">🔗</a>` : '';
      return `<tr><td>${esc(label)}</td><td><code>${esc(value)}</code> ${link}</td><td>${esc(meaning(field, value))}</td></tr>`;
    }

    caseHtml(c) {
      const topic = this.topics.find((t) => t.id === c.topic);
      const row = (label, key) => (loc(c, key) ? `<h4>${label}</h4><p>${esc(loc(c, key))}</p>` : '');
      const codes = Object.entries(c.codes || {});
      const similar = (c.similar || []).filter((id) => this.byId.has(id));
      return `
        <header class="ex-detail-head">
          <div class="ex-detail-meta">
            <span class="ex-id">${esc(c.id)}</span>
            ${topic ? `<span class="badge badge-cat">${topic.icon || ''} ${esc(loc(topic, 'title'))}</span>` : ''}
            ${(c.tags || []).filter((t) => !['line', 'invoice'].includes(t))
              .map((t) => `<span class="badge ex-tag">${esc(t)}</span>`).join('')}
          </div>
          <h3>${esc(loc(c, 'title'))}</h3>
          <p>${esc(loc(c, 'description'))}</p>
          ${c.pending ? `<div class="highlight-box">⏳ ${esc(loc(c, 'pending'))}</div>` : ''}
        </header>

        ${this.actionsHtml(c)}

        ${codes.length ? `
          <h4>${ui('Códigos clave', 'Key codes')}</h4>
          <div class="ex-scroll"><table class="ex-codes">
            <thead><tr><th>${ui('Campo', 'Field')}</th><th>${ui('Valor', 'Value')}</th><th>${ui('Significado', 'Meaning')}</th></tr></thead>
            <tbody>${codes.map(([k, v]) => this.codeRow(k, v)).join('')}</tbody>
          </table></div>` : ''}

        ${(c.amounts || []).length ? `
          <h4>${ui('Importes del ejemplo', 'Example amounts')}</h4>
          <ul class="ex-amounts">${c.amounts.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}

        ${row(ui('Qué enviar', 'What to send'), 'send')}
        ${row(ui('Qué comprobar', 'What to check'), 'check')}

        ${similar.length ? `<p class="ex-similar">${ui('Caso equivalente:', 'Equivalent case:')}
          ${similar.map((id) => `<a href="#${esc(this.caseRoute(id))}">${esc(id)}</a>`).join(', ')}</p>` : ''}

        <pre class="ex-pre" hidden></pre>`;
    }

    casePath(c) {
      if (c.files && c.files[this.format]) return `${root()}/${c.files[this.format]}`;
      const folder = this.format === 'json' ? 'Json' : 'Xml';
      return `${root()}/${folder}/${c.file}.${this.format}`;
    }

    actionsHtml(c) {
      const path = this.casePath(c);
      const btn = (action, label, primary) =>
        `<button type="button" class="file-btn${primary ? ' file-btn--primary' : ''}" data-ex-action="${action}" data-path="${esc(path)}">${label}</button>`;
      return `
        <div class="ex-actions">
          ${btn('download', `⬇ ${ui('Descargar', 'Download')} ${this.format.toUpperCase()}`, true)}
          ${btn('view', ui('Ver contenido', 'View content'))}
          ${btn('copy', ui('Copiar', 'Copy'))}
          ${btn('validate', ui('✓ Validar', '✓ Validate'))}
          <span class="ex-feedback" role="status"></span>
        </div>`;
    }

    async act(button) {
      const { exAction: action, path } = button.dataset;
      const box = this.$('exDetail');
      const pre = box.querySelector('.ex-pre');
      const feedback = box.querySelector('.ex-feedback');
      feedback.textContent = '';
      if (action === 'view' && !pre.hidden) {
        pre.hidden = true;
        button.textContent = ui('Ver contenido', 'View content');
        return;
      }
      button.disabled = true;
      try {
        const text = await window.GithubService.getFileText(path);
        const name = path.split('/').pop();
        if (action === 'view') {
          pre.textContent = text;
          pre.hidden = false;
          button.textContent = ui('Ocultar', 'Hide');
        } else if (action === 'copy') {
          await copyText(text);
          feedback.textContent = ui('✓ Copiado', '✓ Copied');
        } else if (action === 'download') {
          const url = URL.createObjectURL(new Blob([text], { type: `application/${this.format}` }));
          const a = Object.assign(document.createElement('a'), { href: url, download: name });
          document.body.append(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        } else if (action === 'validate') {
          window._pendingValidation = { name, text, format: this.format };
          if (typeof showValidacion === 'function') showValidacion();
        }
      } catch (error) {
        feedback.textContent = `${ui('No se pudo completar la acción', 'Action failed')} · ${error.message}`;
      } finally {
        button.disabled = false;
      }
    }

    /* ── Modo "Buscar por código" ────────────────────── */
    codesHtml() {
      const visible = this.visibleCases();
      const index = new Map();   // campo → valor → [casos]
      visible.forEach((c) => Object.entries(c.codes || {}).forEach(([field, value]) => {
        if (['InvoiceIssuerType', 'Surcharge'].includes(field)) return;
        const key = field === 'TaxRegimeCode' ? `${value} · ${(c.tags || []).find((t) => ['IVA', 'IGIC', 'IPSI'].includes(t)) || ''}` : value;
        if (!index.has(field)) index.set(field, new Map());
        const byValue = index.get(field);
        if (!byValue.has(key)) byValue.set(key, { value, cases: [] });
        byValue.get(key).cases.push(c);
      }));
      if (!index.size) return `<p class="ex-empty">${ui('No hay casos que coincidan.', 'No matching cases.')}</p>`;
      const order = Object.keys(FIELD_LABEL);
      return [...index.entries()].sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0])).map(([field, byValue]) => `
        <section class="ex-code-group">
          <h3>${esc((FIELD_LABEL[field] || [field, field])[en() ? 1 : 0])}</h3>
          <div class="ex-scroll"><table class="ex-codes">
            <thead><tr><th>${ui('Código', 'Code')}</th><th>${ui('Significado', 'Meaning')}</th><th>${ui('Casos', 'Cases')}</th></tr></thead>
            <tbody>${[...byValue.entries()].sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
              .map(([key, { value, cases }]) => `
                <tr><td><code>${esc(key)}</code></td><td>${esc(meaning(field, value))}</td>
                  <td>${cases.map((c) => `<a class="ex-case-link" href="#${esc(this.caseRoute(c.id))}" data-go-cases
                    title="${esc(loc(c, 'title'))}">${esc(c.id)}</a>`).join(' ')}</td></tr>`).join('')}
            </tbody></table></div>
        </section>`).join('');
    }
  }

  /* Accesos rápidos de la portada y vuelta a la lista desde "Buscar por código" */
  document.addEventListener('click', (e) => {
    const view = window.ExamplesView;
    if (!view) return;
    const quick = e.target.closest('[data-quick-topic]');
    if (quick) { view.topic = quick.dataset.quickTopic; view.paintToolbar(); view.paint(); return; }
    if (e.target.closest('[data-go-cases]') && view.mode === 'codes') {
      view.mode = 'cases';
      view.paintToolbar();
      // El router llamará a select() con el caso; se pinta la lista antes
      view.paint();
    }
  });

  RendererFactory.registerRenderer('Examples', ExamplesRenderer);
  window.ExamplesRenderer = ExamplesRenderer;
})();
