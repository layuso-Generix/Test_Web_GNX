/* =========================================================
  invoice-renderer.js — Renderizador para facturas en la web de E-Invoicing

  ┌─────────────────────────────────────────────────────────────────┐
  │  Renderer especializado para cards con:                         │
  │   group: "Invoice"                                              │
  │                                                                 │
  │   Extraído progresivamente desde la lógica anterior de:         │
  │    - openDocumentation()                                        │
  │    - renderDescripcion()                                        │
  │    - renderEstructura()                                         │
  │    - renderEnumeraciones()                                      │
  │    - renderEjemplo()                                            │
  │                                                                 │
  │    Objetivo:                                                    │
  │    - Mantener el comportamiento actual de Invoice.              │
  │    - Sacar la lógica de renderizado fuera de app.js.            │
  │    - Preparar la arquitectura para renderers especializados.    │
  └─────────────────────────────────────────────────────────────────┘
   ========================================================= */

class InvoiceRenderer extends BaseRenderer {
  constructor() {
    super();
    this.card = null;
    this.schemaRaw = "";
    this.examples = [];
  }

  /* =====================================================
    Entrada principal del renderer
  ===================================================== */
  async render({ card }) {
    this.card = card;
    this.showLoading(card);
    this.bindTabs();
    this.activateTab("descripcion");
    this.resetState();
    try {
      const assets = await window.GithubService.getDirectoryAssets(card.dir);
      const readmePath = 
        assets.readmes[LANG] && assets.readmes[LANG].path ? assets.readmes[LANG].path : null;
      const readmePromise = readmePath ? rawFetch(readmePath) : Promise.resolve(null);
      const schemaPromises = Promise.allSettled((assets.schemas || []).map(file => rawFetch(file.path)));
      const examplePromises = Promise.allSettled((assets.examples || []).map(file => rawFetch(file.path)));
      const [ readmeText, schemaResults, exampleResults ] = await Promise.all([ readmePromise, schemaPromises, examplePromises,]);
      const schemasData = this.buildSchemasData( assets.schemas, schemaResults );
      const examplesData = this.buildExamplesData( assets.examples, exampleResults, );
      const mainSchema = schemasData[0] && schemasData[0].schema
          ? schemasData[0].schema
          : { title: this.getCardTitle(card), description: this.getCardDescription(card) };
      this.schemaRaw = schemasData[0] && schemasData[0].raw ? schemasData[0].raw : "";
      this.exposeLegacyState();
      this.setHeader(card, mainSchema );
      this.renderDescription(mainSchema, readmeText, examplesData, card);
      this.renderStructure(mainSchema, card, schemasData[0] ? schemasData[0].name : null, schemasData[0] ? schemasData[0].path : null,schemasData[0] ? schemasData[0].raw : null);
      this.renderEnumerations(mainSchema, schemasData[0] ? schemasData[0].raw : null);
      this.renderExamples(examplesData, card);
    } catch (error) {this.renderError(error);}
  }

  /* =====================================================
    Estado
  ===================================================== */
  resetState() {
    this.schemaRaw = "";
    this.examples = [];
    window._schemaRaw = "";
    window._examples = [];
  }
  exposeLegacyState() {
    window._schemaRaw = this.schemaRaw;
    window._examples = this.examples;
  }

  /* =====================================================
    Parseo de assets
  ===================================================== */

  buildSchemasData(files, results) {
    return (files || [])
      .map((file, index) => {
        const result = results[index];
        const raw = result && result.status === "fulfilled"
          ? result.value
          : null;
        let schema = null;
        if (raw && this.getExtension(file.path) === "json") {
          try {
            schema =typeof localizeNode === "function"
              ? localizeNode(JSON.parse(raw))
              : JSON.parse(raw);
          } catch (error) {
            schema = null;
          }
        }
        return {
          name: file.name,
          path: file.path,
          raw,
          schema,
          file,
        };
      })
      .filter((item) => item.raw !== null);
  }
  buildExamplesData(files, results) {
    return (files || [])
      .map((file, index) => {
        const result = results[index];
        const raw = result && result.status === "fulfilled" ? result.value : null;
        return {
          name: file.name,
          path: file.path,
          raw,
          file,
        };
      })
      .filter((item) => item.raw !== null);
  }

  /* =====================================================
    Descripción
  ===================================================== */
  renderDescription(schema, readmeText, examplesData, card) {
    let html = "";
    html += `<h2>${this.escape(schema.title ||this.getCardTitle(card) ||t("desc.overview"),)}</h2>`;
    if (schema.description) {html += `<p>${this.escape(schema.description)}</p>`;}
    const specs = [];
    const endpoint = schema["x-cyc-endpoint"] || {};
    if (card.format) {specs.push({label: t("spec.format"), value: card.format,});}
    if (card.category) {specs.push({label: t("spec.category"), value: card.category,});}
    if (endpoint.method) { specs.push({ label: t("spec.method"), value: endpoint.method,});}
    if (endpoint.comunication) { specs.push({ label: t("spec.comunication"), value: endpoint.comunication,});}
    if (endpoint.version) { specs.push({ label: t("spec.version"), value: endpoint.version,});}
    if (endpoint.releaseDate) {specs.push({ label: t("spec.releaseDate"), value: endpoint.releaseDate,});}
    if (endpoint.path) { specs.push({ label: t("spec.path"), value: endpoint.path,}); }
    // Enlace a la card de Ejemplos del mismo formato (en lugar de los ficheros sueltos)
      const exCard = typeof findCardById === "function"
        ? findCardById(`examples-${String(card.format || "").toLowerCase()}`)
        : null;
      if (exCard && !exCard.comingSoon) {
        specs.push({
          label: LANG === "en" ? "Examples" : "Ejemplos",
          value: LANG === "en" ? `View ${card.format} examples →` : `Ver casos de ejemplo ${card.format} →`,
          route: window.Router ? Router.buildRoute(exCard.id) : exCard.id,
        });
      }
    if (specs.length) {
      html += `
        <div class="spec-card">
          ${specs.map((spec) => {
            if (spec.route) {
              return `
                <div class="spec-item">
                  <span class="spec-label">${this.escape(spec.label)}</span>
                  <span class="spec-value">
                    <a href="#${this.escape(spec.route)}" class="download-link">${this.escape(spec.value)}</a>
                  </span>
                </div>
              `;
            }
            return `
                <div class="spec-item">
                    <span class="spec-label">
                        ${this.escape(spec.label)}
                    </span>
                    <span class="spec-value">
                        ${this.escape(spec.value)}
                    </span>
                </div>
            `;
          }).join("")}
        </div>
      `;
    }
    if (readmeText) {
      html += simpleMarkdown(readmeText, true);
    } else {
        html += `
          <div class="info-box">
            <strong>${t("desc.noCustom.title")}</strong>
            ${t("desc.noCustom.body")}
          </div>
        `;
    }
    this.setHTML("desc-body", html);
  }

  getXsdNodeDescription(node) {
  if (!node) {return '';}
  const annotation = Array.from(node.children).find(
    child => child.localName === 'annotation' && child.namespaceURI === window.XsdUtils.XSD_NS
  );
  if (!annotation) {return '';}
  const documentation = Array.from(annotation.children).find(
    child => child.localName === 'documentation' && child.namespaceURI === window.XsdUtils.XSD_NS
  );
  if (!documentation) {return '';}
  return documentation.textContent.trim();
}

  /* =====================================================
    Estructura
  ===================================================== */
  renderStructure( schema, card, schemaFileName, schemaPath, schemaRaw ) {
    const body = this.getElement("estructura-body");
    const nav = this.getElement("snav-btns-estructura");
    const path = schemaPath || this.localFilePath(card, schemaFileName);
    if (!body) {return;}
    if (!schemaFileName) {
      body.innerHTML = `<p style="color:var(--gray-500)">${t("struct.none")}</p>`;
      if (nav) { nav.innerHTML = "";}return;
    }
    // if (this.getExtension(schemaFileName) !== "json") {
    //   body.innerHTML = `
    //     <p style="margin-bottom:28px">
    //       <a href="#" onclick="downloadSchema('${this.escape(schemaFileName)}'); return false;" class="download-link">
    //       ${t("struct.download", {file: schemaFileName})}
    //     </a>
    //     <br>
    //     <a href="${path}" target="_blank" class="download-link" >
    //         ${t("struct.view", { file: schemaFileName })}
    //       </a>
    //     </p>
    //   `;
    //   if (nav) { nav.innerHTML = ""; }
    //   return;
    // }
    const extension = this.getExtension(schemaFileName);
    if (extension === 'xsd' || extension === 'xml') {
      this.renderStructureXsd( schemaRaw, schemaFileName, path);
      return;
    }
    if (extension !== 'json') {
      body.innerHTML = `
        <p style="margin-bottom:28px">
          <a href="#" class="download-link">
            ${t('struct.download', { file: schemaFileName })}
          </a>
          <br>
          <a href="${path}" target="_blank" rel="noopener noreferrer" class="download-link">
            ${t('struct.view', { file: schemaFileName })}
          </a>
        </p>
      `;
      if (nav) {nav.innerHTML = '';}
      return;
    }
    const definitions = schema.$defs || schema.definitions || {};
    const blocks = this.extractBlocks( schema, definitions );
    this._blockNames = new Set(blocks.map(b => b.label));
    if (!blocks.length) {
      body.innerHTML = `<p style="color:var(--gray-500)"> ${t("struct.none")} </p>`;
      if (nav) { nav.innerHTML = ""; }
      return;
    }
    let bodyHtml = `
      <p style="margin-bottom:28px">
        <a href="#" onclick="downloadSchema('${this.escape(schemaFileName)}'); return false;" class="download-link">
          ${t("struct.download", {file: schemaFileName})}
        </a>
        <br>
        <a href="${path}" target="_blank" class="download-link" >
          ${t("struct.view", { file: schemaFileName })}
        </a>
      </p>
    `;
    let navHtml = "";
    blocks.forEach((block, index) => {
      const id = this.blockId(block.label);
      const snippet = JSON.stringify( {[block.jsonKey || block.label ]: block.schemaSnippet }, null, 2 );
      navHtml += `
        <button class="snav-btn" onclick="scrollToBlock('${id}', this)">
          ${this.escape( block.label.replace(/Wrapper$/i, ""))}
        </button>
      `;
      bodyHtml += `
        <div class="block-wrap" id="${id}" data-label="${this.escape(block.label)}">
          <div class="block-grid">
            <div class="code-panel">
              <div class="code-header"> ${this.escape(block.label)} </div>
              <pre class="code-pre">${this.escape(snippet)}</pre>
            </div>
            <div>
              <div class="explanation-box">
                <p>${this.escape(block.description || t("noDesc"))}</p>
              </div>
              <div class="tech-details">
                <h4>${t("tech.title")}</h4>
                <p>
                  <strong>${t("tech.type")}</strong>
                  <span class="tag-type">${this.escape(block.type || "object")}</span>
                </p>
                ${Object.keys(block.properties || {}).length
                    ? `<p>
                        <strong>${t("tech.properties")}</strong>
                        ${this.escape(Object.keys(block.properties).join(", "))}
                      </p>`
                    : ""
                  }
                ${block.required && block.required.length
                  ? `<p>
                      <strong>${t("tech.required")}</strong>
                      <span class="tag-req">${this.escape(block.required.join(", "))}</span>
                    </p>`
                  : ""
                }
                ${block.constraints
                  ? `<p>
                      <strong>${t("tech.constraints")}</strong>
                      ${this.escape(block.constraints)}
                    </p>`
                  : ""
                }
              </div>
            </div>
          </div>
          ${this.buildFieldTable(block)}
          <div class="block-divider"></div>
        </div>
      `;
    });
    body.innerHTML = bodyHtml;
    if (nav) {nav.innerHTML = navHtml;}
  }

  renderStructureXsd(xsdText, schemaFileName, schemaPath) {
    const body = this.getElement('estructura-body');
    const nav = this.getElement('snav-btns-estructura');
    if (!body) {return;}
    if (!xsdText) {
      body.innerHTML = `
        <p style="color:var(--gray-500)">
          ${t('struct.none')}
        </p>
      `;
      if (nav) {nav.innerHTML = '';}
      return;
    }
    try {
      const xsdDoc = window.XsdUtils.parse(xsdText);
      const complexTypes = window.XsdUtils.getComplexTypes(xsdDoc);
      const simpleTypeNodes = xsdDoc.getElementsByTagNameNS(window.XsdUtils.XSD_NS, 'simpleType');
      const simpleTypes = [];
      for (let index = 0; index < simpleTypeNodes.length; index++) {
        const node = simpleTypeNodes[index];
        const name = node.getAttribute('name');
        if (!name) {continue;}
        const enumerationNodes = node.getElementsByTagNameNS(window.XsdUtils.XSD_NS, 'enumeration');
        if (!enumerationNodes.length) {
          simpleTypes.push({name, node});
        }
      }

      const types = [...complexTypes, ...simpleTypes];
      this._blockNames = new Set(types.map(type => type.name));

      let bodyHtml = `
        <p style="margin-bottom:28px">
          <a href="#" onclick="downloadFile('${schemaFileName}', '${schemaPath}'); return false;"
            class="download-link"
          >
            ${t('struct.download', { file: schemaFileName })}
          </a>
          <br>
          <a href="${schemaPath}"
            target="_blank"
            rel="noopener noreferrer"
            class="download-link"
          >
            ${t('struct.view', { file: schemaFileName })}
          </a>
        </p>
      `;

      if (!types.length) {
        bodyHtml += `
          <p style="color:var(--gray-500)">
            ${t('struct.none')}
          </p>
        `;

        body.innerHTML = bodyHtml;

        if (nav) {
          nav.innerHTML = '';
        }

        return;
      }

      let navHtml = '';

      types.forEach((type, index) => {
        const typeId = this.blockId(type.name);
        const node = type.node;
        const kind = node.localName;

        const snippet =
          window.XsdUtils.extractXsdSnippet(
            xsdText,
            type.name
          );

        navHtml += `
          <button
            class="snav-btn"
            onclick="scrollToBlock('${typeId}', this)"
          >
            ${this.escape(type.name)}
          </button>
        `;

        bodyHtml += this.buildXsdTypeBlock(
          node,
          type.name,
          kind,
          snippet,
          typeId
        );
      });

      body.innerHTML = bodyHtml;

      if (nav) {
        nav.innerHTML = navHtml;
      }
    } catch (error) {
      body.innerHTML = `
        <div class="info-box">
          <strong>${t('versions.loadFail')}</strong>
          <br>
          ${this.escape(error.message)}
        </div>
      `;

      if (nav) {
        nav.innerHTML = '';
      }
    }
  }

  /* =====================================================
    Bloques de schema
  ===================================================== */
  extractBlocks(schema, definitions) {
    const blocks = [];
    for ( const [key, raw] of Object.entries(schema.properties || {}) ) {
      const prop = SchemaUtils.resolveRef( raw, definitions );
      const type = prop.type || "object";
      if ( type === "array" && prop.items ) {
        const constraints = [
            prop.minItems != null
              ? `minItems: ${prop.minItems}`
              : "",
            prop.maxItems != null
              ? `maxItems: ${prop.maxItems}`
              : ""
          ] .filter(Boolean).join(" · ");
        blocks.push({
          label: key,
          type: "array",
          description: prop.description || "",
          schemaSnippet: SchemaUtils.trimSchema( prop, false ),
          properties: {},
          required: [],
          constraints,
        });
        const items = SchemaUtils.resolveRef( prop.items, definitions);
        if (items.properties) {
          blocks.push({
              label: `${key}[] — campos principales`,
              jsonKey: key,
              type: "object",
              description: items.description || "",
              schemaSnippet: SchemaUtils.trimSchema( items, true),
              properties: items.properties,
              required: items.required || [],
          });
        }
      } else if ( type === "object" && prop.properties) {
        blocks.push({
            label: key,
            type: "object",
            description: prop.description || "",
            schemaSnippet: SchemaUtils.trimSchema( prop, true ),
            properties: prop.properties,
            required: prop.required || [],
        });
      } else {
        blocks.push({
            label: key,
            type,
            description: prop.description || "",
            schemaSnippet: SchemaUtils.trimSchema(prop, true),
            properties: {[key]: prop,},
            required: (schema.required || []).includes(key) ? [key] : [],
        });
      }
    }
    const added = new Set( blocks.map(block => block.label) );
    for ( const [name, definition] of Object.entries(definitions || {})) {
      if ( definition && definition.type === "object" && definition.properties && !added.has(name)) {
        blocks.push({
          label: name,
          type: "object",
          description: definition.description || "",
          schemaSnippet: SchemaUtils.trimSchema(definition, true),
          properties: definition.properties,
          required: definition.required || [],
        });
      }
    }
    return blocks;
  }

  buildXsdTypeBlock(node, typeName, kind, snippet, typeId) {
    const description = this.getXsdNodeDescription(node);
    let detailsHtml = `
      <p>
        <strong>${t('tech.type')}</strong>
        <span class="tag-type">
          ${this.escape(
            kind === 'simpleType'
              ? 'xs:simpleType'
              : 'xs:complexType'
          )}
        </span>
      </p>
    `;

    if (kind === 'complexType') {
      const elements = window.XsdUtils.getElements(node);
      const required = elements.filter(element => element.min !== '0').map(element => element.name);
      if (elements.length) {
        detailsHtml += `
          <p>
            <strong>${t('tech.properties')}</strong>
            ${this.escape(elements.map(element => element.name).join(', '))}
          </p>`;
      }
      if (required.length) {
        detailsHtml += `
          <p>
            <strong>${t('tech.required')}</strong>
            <span class="tag-req">${this.escape(required.join(', '))}</span>
          </p>
        `;
      }
    }
    if (kind === 'simpleType') {
      const facets = window.XsdUtils.getSimpleTypeFacets(node);
      if (facets.base) {
        detailsHtml += `
          <p>
            <strong>Base:</strong>
            <span class="tag-type">${this.escape(facets.base)}</span>
          </p>
        `;
      }
      if (facets.facets.length) {
        detailsHtml += `
          <p>
            <strong>${t('tech.constraints')}</strong>
            ${facets.facets.map(facet => `<span class="tag-type">${this.escape(facet.name)}:${this.escape(facet.value)}</span>`).join(' ')}
          </p>
        `;
      }
    }
    return `
      <div class="block-wrap" id="${typeId}" data-label="${this.escape(typeName)}">
        <div class="block-grid">
          <div class="code-panel">
            <div class="code-header">${this.escape(typeName)}</div>
            <pre class="code-pre">${this.escape(snippet)}</pre>
          </div>
          <div>
            <div class="explanation-box">
              <p>${this.escape(description || typeName)}</p>
            </div>
            <div class="tech-details">
              <h4>${t('tech.title')}</h4>
              ${detailsHtml}
            </div>
          </div>
        </div>
        ${this.buildXsdFieldTable(node)}
        <div class="block-divider"></div>
      </div>
    `;
  }
  /* =====================================================
    Tabla de campos
  ===================================================== */
    safeId(name) { return String(name || '').replace(/[^\w-]/g, '_');}
    blockId(name) { return `block-${this.safeId(name)}`; }
    enumId(name)  { return `enum-${this.safeId(name)}`; }

    /* ── Tipo con enlace 🔗 a su enum o a su bloque ─────── */
    buildTypeLink(typeName) {
      if (!typeName) { return ''; }
      // array<Tipo> → Tipo ;  tns:Tipo → Tipo
      const inner = String(typeName).replace(/^array<(.+)>$/, '$1');
      const local = inner.includes(':') ? inner.split(':').pop() : inner;

      let kind = '';
      if (document.getElementById(this.enumId(local)) || /Enum$/.test(local)) {
        kind = 'Enum';
      } else if (this._blockNames?.has(local) || document.getElementById(this.blockId(local))) {
        kind = 'Block';
      }
      if (!kind) { return ''; }

      return `<a href="javascript:void(0)" class="tag-type" style="text-decoration:none;cursor:pointer;" onclick="goTo${kind}('${this.safeId(local)}')">🔗 ${this.escape(local)}</a>`;
    }

    /* ── Fila común (formato XML) ───────────────────────── */
    buildFieldRow({ name, depth = 0, description, type, required, constraints }) {
      const dash = '<span style="color:var(--gray-300)">—</span>';
      const indent = 8 + depth * 22;
      const arrow = depth > 0 ? '<span class="rf-arrow">↳</span>' : '';
      const constraintText = Array.isArray(constraints)
        ? constraints.filter(Boolean).join(' · ')
        : String(constraints || '');
      const restricciones = [
        constraintText ? this.escape(constraintText) : '',
        this.buildTypeLink(type)
      ].filter(Boolean).join(' · ');

      return `
        <tr>
          <td${depth ? ` style="padding-left:${indent}px"` : ''}>
            ${depth ? `<span class="rf-name-wrap">${arrow}` : ''}<span class="tag-req">${this.escape(name)}</span>${depth ? '</span>' : ''}
          </td>
          <td>${description ? this.escape(description) : dash}</td>
          <td>${type ? `<span class="tag-type">${this.escape(type)}</span>` : dash}</td>
          <td>${required
            ? `<span class="tag-req">${t('yes')}</span>`
            : `<span style="color:var(--gray-500)">${t('no')}</span>`}</td>
          <td>${restricciones || dash}</td>
        </tr>`;
    }

    /* ── Tabla común (formato XML) ──────────────────────── */
    buildFieldTableHtml(rows) {
      if (!rows.length) { return ''; }
      return `
        <div class="field-desc-section">
          <table class="enum-desc-table field-desc-table">
            <thead>
              <tr>
                <th>${t('table.field')}</th>
                <th>${t('table.desc')}</th>
                <th>${t('table.type')}</th>
                <th>${t('table.req')}</th>
                <th>${t('table.constraints')}</th>
              </tr>
            </thead>
            <tbody>${rows.join('')}</tbody>
          </table>
        </div>`;
    }

    /* ── JSON → filas ───────────────────────────────────── */
    buildFieldTable(schema) {
      const rows = [];
      const walk = (properties, required, depth) => {
        required = required || [];
        for (const [field, raw] of Object.entries(properties || {})) {
          rows.push(this.buildFieldRow({
            name: field,
            depth,
            description: raw.description,
            type: SchemaUtils.getFieldType(raw),
            required: required.includes(field),
            constraints: SchemaUtils.getFieldConstraints(raw)
          }));
          // Solo se despliegan objetos EN LÍNEA; los $ref van con 🔗 a su bloque
          if (raw.type === 'object' && raw.properties) {
            walk(raw.properties, raw.required, depth + 1);
          }
          if (raw.type === 'array' && raw.items && raw.items.properties) {
            walk(raw.items.properties, raw.items.required, depth + 1);
          }
        }
      };
      walk(schema.properties, schema.required, 0);
      return this.buildFieldTableHtml(rows);
    }

    /* ── XSD → filas ────────────────────────────────────── */
    buildXsdFieldTable(node) {
      if (!node || node.localName !== 'complexType') { return ''; }
      const elements = window.XsdUtils.getElementsDetailed(node);
      const rows = elements.map((element) => {
        const constraints = [];
        if (element.min !== null && element.min !== undefined && element.min !== '') {
          constraints.push(`minOccurs: ${element.min}`);
        }
        if (element.max !== null && element.max !== undefined && element.max !== '') {
          constraints.push(`maxOccurs: ${element.max}`);
        }
        return this.buildFieldRow({
          name: element.name,
          description: element.doc,
          type: element.type,
          required: element.min !== '0',
          constraints
        });
      });
      return this.buildFieldTableHtml(rows);
    }

  /* =====================================================
      Enumeraciones
    ===================================================== */
    findEnumInfo(...names) {
      for (const name of names.filter(Boolean)) {
        const info = getEnumInfo(name) || getEnumInfo(`${name}Enum`);
        if (info) { return { info, key: getEnumInfo(name) ? name : `${name}Enum` }; }
      }
      return { info: null, key: names.find(Boolean) || '' };
    }

    /* ── Bloque común de una enumeración ─────────────────── */
    buildEnumBlock({ name, field, snippet, type, path, valuesCount, names }) {
      const { info, key } = this.findEnumInfo(...names);
      const enumTable = buildEnumTable(key);
      const id = this.enumId(name);
      const noDesc = t('noDesc');
      const usedIn = Array.isArray(path) ? path : [path].filter(Boolean);

      const nav = `<button class="snav-btn" data-target="${id}" onclick="scrollToBlock('${id}', this)">${this.escape(field)}</button>`;

      const body = `
        <div class="block-wrap" id="${id}">
          <div class="block-grid">
            <div class="code-panel">
              <div class="code-header">${this.escape(info?.title || field)}</div>
              <pre class="code-pre">${this.escape(snippet)}</pre>
            </div>
            <div class="block-side">
              <div class="explanation-box">
                <p class="explanation-box__description"><strong>Español:</strong> ${this.escape(info?.esp || noDesc)}</p>
                <p class="explanation-box__text explanation-box__text--spaced"><strong>English:</strong> ${this.escape(info?.eng || noDesc)}</p>
              </div>
              <div class="tech-details">
                <h4 class="tech-details__title">${t('tech.title')}</h4>
                <p><strong>${t('tech.type')}</strong> <span class="tag tag--type">${this.escape(type || 'string')}</span></p>
                ${usedIn.length ? `
                <p><strong>${t('enums.usedIn')}</strong></p>
                ${usedIn.map((p) => `<span class="tag tech-details__used-in">${this.escape(p)}</span>`).join('')}` : ''}
              </div>
            </div>
          </div>
          <h4>${t('enums.allowed', { n: valuesCount })}</h4>
          <div class="tech-details__values">${enumTable || ''}</div>
          <div class="block-divider"></div>
        </div>`;

      return { nav, body };
    }

    /* ── JSON ─────────────────────────────────────────────── */
    renderEnumerations(schema, schemaRaw) {
      const format = this.card?.format?.toUpperCase();
      if (format === 'XML' || format === 'XSD') {
        this.renderEnumerationsXsd(schemaRaw);
        return;
      }
      const enums = SchemaUtils.extractEnums(schema);
      if (!enums.length) {
        this.setHTML('enumeraciones-body', `<p style="color:var(--gray-500)">${t('enums.none')}</p>`);
        this.setHTML('snav-btns-enumeraciones', '');
        return;
      }
      let bodyHtml = '';
      let navHtml = '';
      enums.forEach((enumItem) => {
        const name = enumItem.defName || enumItem.field;
        const block = this.buildEnumBlock({
          name,
          field: enumItem.field,
          snippet: JSON.stringify({ [name]: enumItem.raw }, null, 2),
          type: enumItem.type || enumItem.raw?.type || 'string',
          path: enumItem.path,
          valuesCount: (enumItem.values || []).length,
          names: [enumItem.defName, enumItem.field]
        });
        navHtml += block.nav;
        bodyHtml += block.body;
      });
      this.setHTML('enumeraciones-body', bodyHtml);
      this.setHTML('snav-btns-enumeraciones', navHtml);
    }

    /* ── XSD ──────────────────────────────────────────────── */
    renderEnumerationsXsd(xsdText) {
      if (!this.getElement('enumeraciones-body')) { return; }
      try {
        const doc = window.XsdUtils.parse(xsdText);
        const enums = window.XsdUtils.extractEnums(doc);
        if (!enums.length) {
          this.setHTML('enumeraciones-body', `<p style="color:var(--gray-500)">${t('enums.none')}</p>`);
          this.setHTML('snav-btns-enumeraciones', '');
          return;
        }
        let bodyHtml = '';
        let navHtml = '';
        enums.forEach((enumItem) => {
          const block = this.buildEnumBlock({
            name: enumItem.enumName,
            field: enumItem.field,
            snippet: window.XsdUtils.extractXsdSnippet(xsdText, enumItem.enumName),
            type: enumItem.type || 'xs:string',
            path: enumItem.path,
            valuesCount: (enumItem.values || []).length,
            names: [enumItem.enumName, enumItem.defName, enumItem.field]
          });
          navHtml += block.nav;
          bodyHtml += block.body;
        });
        this.setHTML('enumeraciones-body', bodyHtml);
        this.setHTML('snav-btns-enumeraciones', navHtml);
      } catch (error) {
        this.setHTML('enumeraciones-body', `<div class="info-box">${this.escape(error.message)}</div>`);
        this.setHTML('snav-btns-enumeraciones', '');
      }
    }

  /* =====================================================
    Ejemplos
  ===================================================== */
  renderExamples( examples, card ) {
    this.examples = [];
    let _detailDir = card.dir || `${CONFIG.contentPath}/${folder}`;
    const inner = this.getElement("ejemplo-inner");
    if (!inner) { return; }
    if ( !examples || !examples.length ) {
      inner.innerHTML = `<p style="color:var(--gray-500)">${t("example.none")}</p>`;
      this.exposeLegacyState();
      return;
    }
    let html = '<div class="ejemplo-grid">';
    examples.forEach((example, index) => {
      const preparedRaw = this.getExtension(example.name) === "json"
        ? fmtJSON(example.raw)
        : example.raw;
      this.examples.push(preparedRaw);
      const previewId = `ex-code-${index}`;
      const ghUrl = `https://github.com/${CONFIG.owner}/${CONFIG.repo}/blob/${CONFIG.branch}/${_detailDir}/${example.name.split('/').map(encodeURIComponent).join('/')}`;
      const path = example.path || this.localFilePath( card, example.name );
      html += `
        <div class="file-card" style="margin-bottom:18px" >
          <div class="file-card__head">
            <div class="file-card__icon"> ${_fileIcon(example.name)} </div>
            <div>
              <div class="file-card__name"> ${this.escape(example.name)} </div>
              <div class="file-card__meta"> ${this.escape((this.getExtension(example.name) || "file" ).toUpperCase(),)} </div>
            </div>
          </div>
          <div class="file-card__actions">
            <a class="file-btn file-btn--primary" href="#" onclick="downloadExample(${index},'${this.escape(example.name)}');return false;">${t('btn.download')}</a>
            <a class="file-btn" target="_blank" href="${ghUrl}">${t('btn.viewGithub')}</a>
            <button class="file-btn" onclick="toggleExampleCode('${previewId}', this, '${this.escape(path)}', ${index})">${t('btn.viewContent')}</button>
          </div>
          <div class="ejemplo-cp" id="${previewId}" style="display:none;margin-top:6px">
            <div class="ejemplo-mini" data-idx="${index}" data-name="${this.escape(example.name)}"></div>
          </div>
        </div>
      `;
    });
    html += "</div>";
    inner.innerHTML = html;
    this.exposeLegacyState();
  }

  /* =====================================================
      Helpers
    ===================================================== */
  localFilePath(card, fileNameOrPath) {
      if (!fileNameOrPath) { return "";}
      if (String(fileNameOrPath).includes("/")) { return fileNameOrPath;}
      return `${card.dir}/${fileNameOrPath}`;
  }
  getExtension(name) {
      if (typeof _ext === "function") {return _ext(name);}
      const value = String(name || "");
      const index = value.lastIndexOf(".");
      return index >= 0
        ? value.slice(index + 1).toLowerCase()
        : "";
  }
  
}


/* =========================================================
  Exposición global
========================================================= */

window.InvoiceRenderer = InvoiceRenderer;

/* =========================================================
  Registro progresivo del renderer
  Este registro permite que openCard() pueda resolver:
  group: "Invoice"
  sin tocar todavía Response, Status o Versions.
========================================================= */

if (typeof RendererFactory !== "undefined" && typeof InvoiceRenderer !== "undefined") {
  RendererFactory.registerRenderer("Invoice", InvoiceRenderer);
}
