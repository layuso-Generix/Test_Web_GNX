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

  const root = (CONFIG.examplesPath || 'E-invoicing/Standard/Examples').replace(/\/+$/, '');
  const local = location.protocol === 'file:';
  const ui = (es, en) => window.LANG === 'en' ? en : es;
  const loc = (obj, key) => (window.LANG === 'en' && obj[key + '_en']) || obj[key] || '';
  const norm = value => String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const total = (n, one, many) => n + ' ' + (n === 1 ? one : many);
  const subCount = n => total(n, ui('subejemplo', 'subexample'), ui('subejemplos', 'subexamples'));
  const templateCount = n => total(n, ui('plantilla', 'template'), ui('plantillas', 'templates'));
  let offlineLoad;

  async function read(relativePath) {
    const response = await fetch(root + '/' + relativePath);
    if (!response.ok) throw new Error(relativePath + ' (HTTP ' + response.status + ')');
    return response.text();
  }

  function loadCatalog() {
    if (!local) return read('catalog.json').then(JSON.parse);
    if (!offlineLoad) {
      offlineLoad = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = root + '/catalog-offline.js';
        script.onload = () => resolve(window.GNXOfflineExamples.catalog);
        script.onerror = () => {
          offlineLoad = null;
          reject(new Error(script.src));
        };
        document.head.append(script);
      });
    }
    return offlineLoad;
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const field = document.createElement('textarea');
      field.value = text;
      field.style.cssText = 'position:fixed;left:-10000px;top:0';
      const focus = document.activeElement;
      document.body.append(field);
      try {
        field.select();
        if (!document.execCommand('copy')) throw new Error(ui('No se pudo copiar', 'Copy failed'));
      } finally {
        field.remove();
        focus?.focus({preventScroll:true});
      }
    }
  }

  class ExamplesRenderer {
    $(id) { return document.getElementById(id); }

    async render({card}) {
      this.format = card.format.toLowerCase();
      this.query = '';
      this.group = '';
      showView('view-examples');
      const title = localizedSectionTitle(card);
      document.title = title + ' · Generix';
      this.$('exCrumbFmt').textContent = card.format;
      this.$('exCrumbFmt').href = '#' + this.format;
      this.$('exTitle').textContent = this.$('exCrumbCur').textContent = title;
      this.$('exDesc').textContent = localizedSectionDesc(card);
      this.$('exChips').replaceChildren();
      this.$('exCount').textContent = '';
      const list = this.$('exList');
      const renderKey = Symbol();
      list.renderKey = renderKey;
      list.textContent = ui('Cargando…', 'Loading…');
      const search = this.$('exSearch');
      search.value = '';
      search.placeholder = ui('Buscar plantilla, subejemplo, código o texto…', 'Search templates, subexamples, codes or text…');
      search.setAttribute('aria-label', search.placeholder);
      search.oninput = null;
      try {
        const catalog = await loadCatalog();
        if (list.renderKey !== renderKey) return;
        this.groups = catalog.groups;
        this.regimes = catalog.regimes;
        this.regimeNote = catalog.regimeNote;
        this.cases = new Map();
        for (const group of this.groups) {
          for (const item of group.cases) this.cases.set(item.id, {...item, group: group.id});
        }
        this.templates = catalog.templates;
        search.oninput = () => { this.query = search.value.trim(); this.paint(); };
        list.onclick = event => {
          const jump = event.target.closest('[data-template]');
          if (jump) {
            search.value = this.query = this.group = '';
            this.paintChips();
            this.paint();
            const target = this.$('template-' + jump.dataset.template);
            target.open = true;
            target.querySelector('summary').focus();
            target.scrollIntoView({block:'start'});
            return;
          }
          const button = event.target.closest('[data-ex-action]');
          if (button) this.act(button);
        };
        this.paintChips();
        this.paint();
      } catch (error) {
        if (list.renderKey === renderKey) list.textContent = ui('Error al cargar el catálogo', 'Could not load catalog') + ' · ' + error.message;
      }
    }

    paintChips() {
      const chip = (id, title, n) => `<button type="button" class="ex-chip${this.group === id ? ' active' : ''}"
        aria-pressed="${this.group === id}" data-group="${esc(id)}">${esc(title)} <span>${n}</span></button>`;
      const bar = this.$('exChips');
      bar.innerHTML = chip('', ui('Todos', 'All'), this.cases.size) +
        this.groups.map(g => chip(g.id, loc(g, 'title'), g.cases.length)).join('');
      bar.onclick = event => {
        const button = event.target.closest('[data-group]');
        if (!button) return;
        this.group = button.dataset.group;
        this.paintChips();
        this.paint();
      };
    }

    casePath(c) {
      return c.files?.[this.format] || (this.format === 'json' ? 'Json/' : 'Xml/') + c.file + '.' + this.format;
    }

    paint() {
      const words = norm(this.query).split(/\s+/).filter(Boolean);
      let templates = 0, cases = 0;
      const sections = new Map(this.groups.map(g => [g.id, []]));
      for (const t of this.templates) {
        const children = t.cases.map(id => this.cases.get(id)).filter(c => {
          if (this.group && c.group !== this.group) return false;
          if (!words.length) return true;
          const searchable = norm([t.id, t.title, t.title_en, ...Object.values(c)].join(' '));
          return words.every(w => searchable.includes(w));
        });
        if (!children.length) continue;
        templates++;
        cases += children.length;
        const base = this.cases.get(t.baseCase);
        sections.get(t.group).push(`<details class="ex-case ex-template" id="template-${esc(t.id)}" ${words.length ? 'open' : ''}>
          <summary><span class="ex-id">${esc(t.id)}</span><span class="ex-title">${esc(loc(t,'title'))}</span>
            <span class="ex-n">${subCount(children.length)}</span></summary>
          <div class="ex-template-content">
            <div class="ex-body ex-base"><p><strong>${ui('Ejemplo principal','Main example')}</strong>
              · ${esc(base.id)} · ${esc(loc(base,'title'))}</p>
              <p>${esc(loc(t,'description'))}</p>
              <p><strong>${ui('Qué enviar', 'What to send')}</strong> · ${esc(loc(base,'send'))}</p>
              <p><strong>${ui('Qué comprobar', 'What to check')}</strong> · ${esc(loc(base,'check'))}</p>
              <p><strong>${ui('Expedidor', 'Issuer')}</strong> · ${esc(t.issuerDetails)}</p>
              <h4>${ui('Códigos del ejemplo descargable', 'Codes in the downloadable example')}</h4>
              <ul>${t.codes.map(code => `<li>${esc(code)}</li>`).join('')}</ul>
              ${this.actions(t.files[this.format], this.casePath(base))}
            </div>
            <h3>${ui('Subejemplos','Subexamples')}</h3>
            ${children.map(c => this.caseHtml(c)).join('')}
            ${this.regimesHtml()}
          </div></details>`);
      }
      const html = this.groups.map(g => {
        const items = sections.get(g.id);
        return items.length ? `<section class="ex-group"><h3>${esc(loc(g,'title'))} <small>${templateCount(items.length)}</small></h3>${items.join('')}</section>` : '';
        }).join('');
      this.$('exCount').textContent = templateCount(templates) + ' · ' + subCount(cases);
      this.$('exList').innerHTML = html || `<p class="ex-empty">${ui('No hay coincidencias.', 'No matches found.')}</p>`;
    }

    regimesHtml() {
      const tables = this.regimes.map(group => `<h4>${esc(group.title)}</h4><div class="ex-scroll"><table>
        <thead><tr><th>${ui('Clave','Code')}</th><th>${ui('Significado','Meaning')}</th><th>${ui('Plantilla','Template')}</th></tr></thead>
        <tbody>${group.rows.map(([code, meaning, id]) => `<tr><td>${esc(code)}</td><td>${esc(meaning)}</td>
        <td><button type="button" class="ex-jump" data-template="${esc(id)}">${esc(id)}</button></td></tr>`).join('')}</tbody>
        </table></div>`).join('');
      return `<details class="ex-regimes"><summary>${ui('Todos los regímenes','All regimes')} · IVA (12), IGIC (15), IPSI (5)</summary>
        <p>${esc(this.regimeNote)}</p>${tables}</details>`;
    }

    actions(path, source) {
      const button = (action, title, primary = false) => `<button type="button" class="file-btn${primary ? ' file-btn--primary' : ''}"
        data-ex-action="${action}"${action === 'view' ? ' aria-expanded="false"' : ''}>${esc(title)}</button>`;
      return `<div class="ex-actions" data-path="${esc(path)}" data-source="${esc(source)}">
          ${button('download', ui('Descargar', 'Download') + ' ' + this.format.toUpperCase(), true)}
          ${button('view', ui('Ver contenido', 'View content'))}
          ${button('copy', ui('Copiar', 'Copy'))}
        </div><span class="ex-feedback" role="status"></span><pre class="ex-pre" hidden></pre>`;
    }

    caseHtml(c) {
      const row = (label, field) => loc(c, field) ? `<p><strong>${label}</strong> · ${esc(loc(c, field))}</p>` : '';
      const path = this.casePath(c);
      return `<details class="ex-case" id="${esc(c.id)}">
        <summary><span class="ex-id">${esc(c.id)}</span><span class="ex-title">${esc(loc(c,'title'))}</span>
          <span class="badge badge-cat" title="L1">${esc(c.docType)}</span>
          <span class="ex-issuer">${esc(loc(c,'issuer'))}</span></summary>
        <div class="ex-body"><p>${esc(loc(c,'description'))}</p>
          ${row(ui('Pendiente','Pending'),'pending')}
          <h4>${ui('Desglose de los importes del ejemplo','Example amount breakdown')}</h4>
          <ul>${c.amounts.map(amount => `<li>${esc(amount)}</li>`).join('')}</ul>
          ${row(ui('Qué enviar','What to send'),'send')}${row(ui('Qué comprobar','What to check'),'check')}
          ${this.actions(path, path)}</div></details>`;
    }

    async act(button) {
      const bar = button.closest('.ex-actions');
      const feedback = bar.nextElementSibling;
      const pre = feedback.nextElementSibling;
      const {path, source} = bar.dataset;
      feedback.textContent = '';
      const action = button.dataset.exAction;
      if (action === 'view' && !pre.hidden) {
        pre.hidden = true;
        button.textContent = ui('Ver contenido', 'View content');
        button.setAttribute('aria-expanded', 'false');
        return;
      }
      button.disabled = true;
      try {
        const text = local ? window.GNXOfflineExamples.files[source] : await read(path);
        if (typeof text !== 'string') throw new Error(path);
        if (action === 'view') {
          pre.textContent = text;
          pre.hidden = false;
          button.textContent = ui('Ocultar', 'Hide');
          button.setAttribute('aria-expanded', 'true');
        } else if (action === 'copy') {
          await copyText(text);
          feedback.textContent = ui('✓ Copiado', '✓ Copied');
        } else if (action === 'download') {
          const link = document.createElement('a');
          const url = URL.createObjectURL(new Blob([text], {type:'application/' + this.format}));
          link.href = url;
          link.download = path.split('/').pop();
          document.body.append(link);
          link.click();
          link.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
      } catch (error) {
        feedback.textContent = ui('No se pudo completar la acción', 'Action failed') + ' · ' + error.message;
      } finally {
        button.disabled = false;
      }
    }
  }

  RendererFactory.registerRenderer('Examples', ExamplesRenderer);
  window.ExamplesRenderer = ExamplesRenderer;
})();
