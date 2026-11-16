/* =========================================================
  response-renderer.js — Renderizador Response

  ┌─────────────────────────────────────────────────────┐
  |  Renderizador específico para Response.             |
  |                                                     |
  |  Responsabilidades:                                 |
  |  - Cargar documentación Response.                   |
  |  - Mostrar descripción.                             |
  |  - Mostrar estructura.                              |
  |  - Mostrar enumeraciones.                           |
  |  - Mostrar ejemplos.                                |
  |                                                     |
  |  Utiliza:                                           |
  |  - BaseRenderer                                     |
  |  - SchemaUtils                                      |
  |  - GithubService                                    |
  |                                                     |
  |  Registro:                                          |
  |  group: "Response"                                  |
  └─────────────────────────────────────────────────────┘
   ========================================================= */

class ResponseRenderer extends BaseRenderer {
  constructor() {
    super();
    this.card = null;
    this.schemaRaw = "";
    this.examples = [];
  }

  /* =====================================================
    Entrada principal del renderer
  ===================================================== */

  async render(cardData) {
    const card = cardData.card || cardData;
    this.card = card;
    this.showLoading(card);
    this.bindTabs();
    this.activateTab("descripcion");
    this.resetState();
    try {
      const assets = await window.GithubService.getDirectoryAssets(
        card.dir || card.folder,
      );
      const readmePath =
        assets.readmes[LANG] && assets.readmes[LANG].path
          ? assets.readmes[LANG].path
          : null;
      const readmePromise = readmePath
        ? rawFetch(readmePath)
        : Promise.resolve(null);
      const schemaPromises = Promise.allSettled(
        (assets.schemas || []).map((file) => rawFetch(file.path)),
      );
      const examplePromises = Promise.allSettled(
        (assets.examples || []).map((file) => rawFetch(file.path)),
      );
      const [readmeText, schemaResults, exampleResults] = await Promise.all([
        readmePromise,
        schemaPromises,
        examplePromises,
      ]);
      const schemasData = this.buildSchemasData(assets.schemas, schemaResults);
      const examplesData = this.buildExamplesData(
        assets.examples,
        exampleResults,
      );
      const mainSchema =
        schemasData[0] && schemasData[0].schema
          ? schemasData[0].schema
          : {
              title: this.getCardTitle(card),
              description: this.getCardDescription(card),
            };
      this.schemaRaw =
        schemasData[0] && schemasData[0].raw ? schemasData[0].raw : "";
      this.exposeLegacyState();
      this.setHeader(card, mainSchema);
      this.renderDescription(mainSchema, readmeText, examplesData, card);
      this.renderStructure(
        mainSchema,
        card,
        schemasData[0] ? schemasData[0].name : null,
        schemasData[0] ? schemasData[0].path : null,
        schemasData[0] ? schemasData[0].raw : null
      );
      this.renderEnumerations(mainSchema, schemasData[0] ? schemasData[0].raw : null);
      this.renderExamples(examplesData, card);
    } catch (error) {
      this.renderError(error);
    }
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

        const raw =
          result && result.status === "fulfilled" ? result.value : null;

        let schema = null;

        if (raw && this.getExtension(file.path) === "json") {
          try {
            schema =
              typeof localizeNode === "function"
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

        const raw =
          result && result.status === "fulfilled" ? result.value : null;

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

    html += `
      <h2>
        ${this.escape(
          schema.title || this.getCardTitle(card) || t("desc.overview"),
        )}
      </h2>
    `;

    if (schema.description) {
      html += `
        <p>
          ${this.escape(schema.description)}
        </p>
      `;
    }

    const specs = [];
    const endpoint = schema["x-cyc-endpoint"] || {};

    if (card.format) {
      specs.push({
        label: t("spec.format"),
        value: card.format,
      });
    }

    if (card.category) {
      specs.push({
        label: t("spec.category"),
        value: card.category,
      });
    }

    if (endpoint.method) {
      specs.push({
        label: t("spec.method"),
        value: endpoint.method,
      });
    }

    if (endpoint.comunication) {
      specs.push({
        label: t("spec.comunication"),
        value: endpoint.comunication,
      });
    }

    if (endpoint.version) {
      specs.push({
        label: t("spec.version"),
        value: endpoint.version,
      });
    }

    if (endpoint.releaseDate) {
      specs.push({
        label: t("spec.releaseDate"),
        value: endpoint.releaseDate,
      });
    }

    if (endpoint.path) {
      specs.push({
        label: t("spec.path"),
        value: endpoint.path,
      });
    }

    (examplesData || []).forEach((example, index) => {
      specs.push({
        label:
          examplesData.length > 1
            ? t("spec.exampleN", { n: index + 1 })
            : t("spec.example"),
        value: example.name,
        dlIdx: index,
      });
    });

    if (specs.length) {
      html += `
        <div class="spec-card">
          ${specs
            .map((spec) => {
              if (spec.dlIdx !== undefined) {
                return `
                <div class="spec-item">
                  <span class="spec-label">
                    ${this.escape(spec.label)}
                  </span>
                  <span class="spec-value">
                    <a
                      href="#"
                      onclick="downloadExample(${spec.dlIdx}, '${this.escape(spec.value)}'); return false;"
                      class="download-link"
                      style="font-family:monospace;font-size:.85rem"
                    >
                      ${this.escape(spec.value)}
                    </a>
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
            })
            .join("")}
        </div>
      `;
    }

    if (readmeText) {
      html += simpleMarkdown(readmeText, true);
    } else {
      html += `
        <div class="info-box">
          <strong>
            ${t("desc.noCustom.title")}
          </strong>
          ${t("desc.noCustom.body")}
        </div>
      `;
    }

    this.setHTML("desc-body", html);
  }  
  // getXsdNodeDescription(node) {
  //   if (!node) {return '';}
  //   const activeLang = String(window.LANG || LANG || 'es').toLowerCase().split('-')[0];
  //   const annotation = Array.from(node.children || []).find(child => child.localName === 'annotation');
  //   if (!annotation) {return '';}
  //   const documentationNodes = Array.from(annotation.children || []).filter(child => child.localName === 'documentation');
  //   const localizedDocumentation =
  //     documentationNodes.find(documentation => {
  //       const language =
  //         documentation.getAttribute('xml:lang') ||
  //         documentation.getAttributeNS('http://www.w3.org/XML/1998/namespace', 'lang') || '';
        
  //       return language.toLowerCase().split('-')[0] === activeLang;
  //     });
    
  //   const fallbackDocumentation =
  //     documentationNodes.find(documentation =>
  //       !documentation.getAttribute('xml:lang') &&
  //       !documentation.getAttributeNS('http://www.w3.org/XML/1998/namespace', 'lang')
  //     );
    
  //   const selectedDocumentation = localizedDocumentation || fallbackDocumentation || documentationNodes[0];
  //   return selectedDocumentation ? String(selectedDocumentation.textContent || '').trim() : '';
  // }
  getXsdNodeDescription(node) {return window.XsdUtils.getLocalizedDocumentation(node);}
  /* =====================================================
    Estructura
  ===================================================== */

  renderStructure(schema, card, schemaFileName, schemaPath, schemaRaw) {
    const body = this.getElement("estructura-body");
    const nav = this.getElement("snav-btns-estructura");
    if (!body) {return;}
    if (!schemaFileName) {
      body.innerHTML = `
        <p style="color:var(--gray-500)">
          ${t("struct.none")}
        </p>
      `;
      if (nav) {nav.innerHTML = "";}
      return;
    }
    const path = schemaPath || this.localFilePath(card, schemaFileName);
    if (this.getExtension(schemaFileName) !== "json") {
      return this.renderStructureXsd(
        schemaRaw,
        schemaFileName,
        schemaPath
      );
    }
    const definitions = schema.$defs || schema.definitions || {};
    const blocks = this.extractBlocks(schema, definitions);
    if (!blocks.length) {
      body.innerHTML = `
        <p style="color:var(--gray-500)">
          ${t("struct.none")}
        </p>
      `;
      if (nav) {nav.innerHTML = "";}
      return;
    }
    let bodyHtml = `
      <p style="margin-bottom:28px">
        <a
          href="#"
          onclick="downloadSchema('${this.escape(schemaFileName)}'); return false;"
          class="download-link"
        >
          ${t("struct.download", { file: schemaFileName })}
        </a>
        <br>
        <a
          href="#"
          onclick="viewSchema('${this.escape(schemaFileName)}'); return false;"
          target="_blank"
          rel="noopener noreferrer"
          class="download-link"
        >
          ${t("struct.view", { file: schemaFileName })}
        </a>
      </p>
    `;
    let navHtml = "";
    blocks.forEach((block, index) => {
      const id = `blk-${index}`;
      const snippet = JSON.stringify({[block.jsonKey || block.label]: block.schemaSnippet,},null,2,);
      navHtml += `
        <button
          class="snav-btn"
          onclick="scrollToBlock('${id}', this)"
        >
          ${this.escape(block.label.replace(/Wrapper$/i, ""))}
        </button>
      `;
      bodyHtml += `
        <div
          class="block-wrap"
          id="${id}"
          data-label="${this.escape(block.label)}"
        >
          <div class="block-grid">
            <div class="code-panel">
              <div class="code-header">
                ${this.escape(block.label)}
              </div>
              <pre class="code-pre">${this.escape(snippet)}</pre>
            </div>

            <div>
              <div class="explanation-box">
                <p>
                  ${this.escape(block.description || t("noDesc"))}
                </p>
              </div>

              <div class="tech-details">
                <h4>
                  ${t("tech.title")}
                </h4>

                <p>
                  <strong>
                    ${t("tech.type")}
                  </strong>
                  <span class="tag-type">
                    ${this.escape(block.type || "object")}
                  </span>
                </p>

                ${
                  block.required && block.required.length
                    ? `
                      <p>
                        <strong>
                          ${t("tech.required")}
                        </strong>
                        <span class="tag-req">
                          ${this.escape(block.required.join(", "))}
                        </span>
                      </p>
                    `
                    : ""
                }

                ${
                  block.constraints
                    ? `
                      <p>
                        <strong>
                          ${t("tech.constraints")}
                        </strong>
                        ${this.escape(block.constraints)}
                      </p>
                    `
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

    if (nav) {
      nav.innerHTML = navHtml;
    }
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
      const complexTypes = window.XsdUtils.getComplexTypes(xsdDoc)
        .map((type, index) => {
          if (type.name) {return type;}
          const parentElement = type.node?.parentElement;
          const parentName = parentElement?.localName === 'element' ? parentElement.getAttribute('name') : '';
          return {...type, name: parentName || `AnonymousType${index + 1}`};
        });
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

      const types = [
        ...complexTypes,
        ...simpleTypes
      ];

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
        const typeId = `xsd-block-${index}`;
        const node = type.node;
        const kind = node.localName;

        let snippet = window.XsdUtils.extractXsdSnippet(xsdText, type.name);
        if (!snippet && node) {snippet = new XMLSerializer().serializeToString(node);}

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
  formatXsdSnippet(xmlText) {
  if (!xmlText) {
    return '';
  }

  const normalized =
    String(xmlText)
      .replace(/>\s*</g, '><')
      .replace(
        /\s+xmlns:xs="http:\/\/www\.w3\.org\/2001\/XMLSchema"/g,
        ''
      )
      .trim();

  const tokens =
    normalized
      .replace(/</g, '\n<')
      .trim()
      .split('\n')
      .filter(Boolean);

  let depth = 0;

  return tokens
    .map(token => {
      const trimmed = token.trim();

      if (/^<\//.test(trimmed)) {
        depth = Math.max(0, depth - 1);
      }

      const line =
        `${'  '.repeat(depth)}${trimmed}`;

      const isOpeningTag =
        /^<[^!?/][^>]*>$/.test(trimmed);

      const isSelfClosing =
        /\/>$/.test(trimmed);

      const opensAndCloses =
        /^<([^>\s]+)[^>]*>.*<\/\1>$/.test(trimmed);

      if (
        isOpeningTag &&
        !isSelfClosing &&
        !opensAndCloses
      ) {
        depth += 1;
      }

      return line;
    })
    .join('\n');
}

  /* =====================================================
    Bloques de schema
  ===================================================== */

  extractBlocks(schema, definitions) {
    const blocks = [];

    for (const [key, raw] of Object.entries(schema.properties || {})) {
      const prop = SchemaUtils.resolveRef(raw, definitions);

      const type = prop.type || "object";

      if (type === "array" && prop.items) {
        const constraints = [
          prop.minItems != null ? `minItems: ${prop.minItems}` : "",
          prop.maxItems != null ? `maxItems: ${prop.maxItems}` : "",
        ]
          .filter(Boolean)
          .join(" · ");

        blocks.push({
          label: key,
          type: "array",
          description: prop.description || "",
          schemaSnippet: SchemaUtils.trimSchema(prop, false),
          properties: {},
          required: [],
          constraints,
        });

        const items = SchemaUtils.resolveRef(prop.items, definitions);

        if (items.properties) {
          blocks.push({
            label: `${key}[] — campos principales`,
            jsonKey: key,
            type: "object",
            description: items.description || "",
            schemaSnippet: SchemaUtils.trimSchema(items, true),
            properties: items.properties,
            required: items.required || [],
          });
        }
      } else if (type === "object" && prop.properties) {
        blocks.push({
          label: key,
          type: "object",
          description: prop.description || "",
          schemaSnippet: SchemaUtils.trimSchema(prop, true),
          properties: prop.properties,
          required: prop.required || [],
        });
      } else {
        blocks.push({
          label: key,
          type,
          description: prop.description || "",
          schemaSnippet: SchemaUtils.trimSchema(prop, true),
          properties: {
            [key]: prop,
          },
          required: (schema.required || []).includes(key) ? [key] : [],
        });
      }
    }

    const added = new Set(blocks.map((block) => block.label));

    for (const [name, definition] of Object.entries(definitions || {})) {
      if (
        definition &&
        definition.type === "object" &&
        definition.properties &&
        !added.has(name)
      ) {
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
  buildXsdTypeBlock(
    node,
    typeName,
    kind,
    snippet,
    typeId
  ) {
    const description =
      this.getXsdNodeDescription(node);

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
      const elements =
        window.XsdUtils.getElements(node);

      const required =
        elements
          .filter(element => element.min !== '0')
          .map(element => element.name);

      if (elements.length) {
        detailsHtml += `
          <p>
            <strong>${t('tech.properties')}</strong>
            ${this.escape(
              elements
                .map(element => element.name)
                .join(', ')
            )}
          </p>
        `;
      }

      if (required.length) {
        detailsHtml += `
          <p>
            <strong>${t('tech.required')}</strong>
            <span class="tag-req">
              ${this.escape(required.join(', '))}
            </span>
          </p>
        `;
      }
    }

    if (kind === 'simpleType') {
      const facets =
        window.XsdUtils.getSimpleTypeFacets(node);

      if (facets.base) {
        detailsHtml += `
          <p>
            <strong>Base:</strong>
            <span class="tag-type">
              ${this.escape(facets.base)}
            </span>
          </p>
        `;
      }

      if (facets.facets.length) {
        detailsHtml += `
          <p>
            <strong>${t('tech.constraints')}</strong>
            ${facets.facets
              .map(facet => `
                <span class="tag-type">
                  ${this.escape(facet.name)}:
                  ${this.escape(facet.value)}
                </span>
              `)
              .join(' ')}
          </p>
        `;
      }
    }

    return `
      <div
        class="block-wrap"
        id="${typeId}"
        data-label="${this.escape(typeName)}"
      >
        <div class="block-grid">
          <div class="code-panel">
            <div class="code-header">
              ${this.escape(typeName)}
            </div>
            <pre class="code-pre">${this.escape(snippet)}</pre>
          </div>

          <div>
            <div class="explanation-box">
              <p>
                ${this.escape(
                  description ||
                  typeName
                )}
              </p>
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

  buildFieldTable(schema) {
    const dash = '<span style="color:var(--gray-300)">—</span>';

    const rows = [];

    const walk = (properties, required, depth) => {
      required = required || [];

      for (const [field, raw] of Object.entries(properties || {})) {
        const type = SchemaUtils.getFieldType(raw);

        const constraints = SchemaUtils.getFieldConstraints(raw);

        const isRequired = required.includes(field);

        const indent = 8 + depth * 22;

        const arrow = depth > 0 ? '<span class="rf-arrow">↳</span>' : "";

        rows.push(`
            <tr>
              <td style="padding-left:${indent}px">
                <span class="rf-name-wrap">
                  ${arrow}
                  <span class="tag-req">
                    ${this.escape(field)}
                  </span>
                </span>
              </td>

              <td>
                ${raw.description ? this.escape(raw.description) : dash}
              </td>

              <td>
                ${
                  type
                    ? `<span class="tag-type">${this.escape(type)}</span>`
                    : dash
                }
              </td>

              <td>
                ${
                  isRequired
                    ? `<span class="tag-req">${t("yes")}</span>`
                    : `<span style="color:var(--gray-500)">${t("no")}</span>`
                }
              </td>

              <td>
                ${constraints || dash}
              </td>
            </tr>
          `);

        if (raw.type === "object" && raw.properties) {
          walk(raw.properties, raw.required, depth + 1);
        }

        if (raw.type === "array" && raw.items && raw.items.properties) {
          walk(raw.items.properties, raw.items.required, depth + 1);
        }
      }
    };

    walk(schema.properties, schema.required, 0);

    if (!rows.length) {
      return "";
    }

    return `
      <div class="field-tbl-wrap">
        <table class="field-tbl">
          <thead>
            <tr>
              <th>${t("table.field")}</th>
              <th>${t("table.desc")}</th>
              <th>${t("table.type")}</th>
              <th>${t("table.req")}</th>
              <th>${t("table.constraints")}</th>
            </tr>
          </thead>
          <tbody>
            ${rows.join("")}
          </tbody>
        </table>
      </div>
    `;
  }
  buildXsdFieldTable(node) {
    if (
      !node ||
      node.localName !== 'complexType'
    ) {
      return '';
    }

    const elements =
      window.XsdUtils.getElementsDetailed(node);

    if (!elements.length) {
      return '';
    }

    const dash =
      '<span style="color:var(--gray-300)">—</span>';

    const rows =
      elements.map(element => {
        const required =
          element.min !== '0';

        const constraints = [];

        if (
          element.min !== null &&
          element.min !== ''
        ) {
          constraints.push(
            `minOccurs: ${element.min}`
          );
        }

        if (
          element.max !== null &&
          element.max !== ''
        ) {
          constraints.push(
            `maxOccurs: ${element.max}`
          );
        }

        return `
          <tr>
            <td>
              <span class="tag-req">
                ${this.escape(element.name)}
              </span>
            </td>

            <td>
              ${
                element.doc
                  ? this.escape(element.doc)
                  : dash
              }
            </td>

            <td>
              ${
                element.type
                  ? `
                    <span class="tag-type">
                      ${this.escape(element.type)}
                    </span>
                  `
                  : dash
              }
            </td>

            <td>
              ${
                required
                  ? `
                    <span class="tag-req">
                      ${t('yes')}
                    </span>
                  `
                  : `
                    <span style="color:var(--gray-500)">
                      ${t('no')}
                    </span>
                  `
              }
            </td>

            <td>
              ${
                constraints.length
                  ? this.escape(
                    constraints.join(' · ')
                  )
                  : dash
              }
            </td>
          </tr>
        `;
      }).join('');

    return `
      <div class="field-tbl-wrap">
        <table class="field-tbl">
          <thead>
            <tr>
              <th>${t('table.field')}</th>
              <th>${t('table.desc')}</th>
              <th>${t('table.type')}</th>
              <th>${t('table.req')}</th>
              <th>${t('table.constraints')}</th>
            </tr>
          </thead>

          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  /* =====================================================
    Enumeraciones
  ===================================================== */

  renderEnumerations(schema, schemaRaw) {
    const enums = SchemaUtils.extractEnums(schema);

    if (!enums.length) {
      this.setHTML(
        "enumeraciones-body",
        `<p style="color:var(--gray-500)">${t("enums.none")}</p>`,
      );

      this.setHTML("snav-btns-enumeraciones", "");

      return;
    }

    let bodyHtml = "";
    let navHtml = "";

    enums.forEach((enumItem, index) => {
      const id = `enum-${index}`;

      const snippet = JSON.stringify(
        {
          [enumItem.defName]: enumItem.raw,
        },
        null,
        2,
      );

      navHtml += `
        <button
          class="snav-btn"
          onclick="scrollToBlock('${id}', this)"
        >
          ${this.escape(enumItem.field)}
        </button>
      `;

      bodyHtml += `
        <div class="block-wrap" id="${id}">
          <div class="block-grid">
            <div class="code-panel">
              <div class="code-header">
                ${this.escape(enumItem.field)}
              </div>
              <pre class="code-pre">${this.escape(snippet)}</pre>
            </div>

            <div>
              <div class="explanation-box">
                <p>
                  ${this.escape(enumItem.description || t("noDesc"))}
                </p>
              </div>

              <div class="tech-details">
                <p>
                  <strong>
                    ${t("enums.usedIn")}
                  </strong>
                  <code>
                    ${this.escape(enumItem.path)}
                  </code>
                </p>

                <h4>
                  ${t("enums.allowed", { n: enumItem.values.length })}
                </h4>

                <div class="enum-val-wrap">
                  ${enumItem.values
                    .map(
                      (value) => `
                    <span class="ev-pill">
                      ${this.escape(String(value))}
                    </span>
                  `,
                    )
                    .join("")}
                </div>
              </div>
            </div>
          </div>

          <div class="block-divider"></div>
        </div>
      `;
    });

    this.setHTML("enumeraciones-body", bodyHtml);

    this.setHTML("snav-btns-enumeraciones", navHtml);
  }

  /* =====================================================
    Ejemplos
  ===================================================== */

  renderExamples(examples, card) {
    this.examples = [];

    const inner = this.getElement("ejemplo-inner");

    if (!inner) {
      return;
    }

    if (!examples || !examples.length) {
      inner.innerHTML = `
        <p style="color:var(--gray-500)">
          ${t("example.none")}
        </p>
      `;

      this.exposeLegacyState();

      return;
    }

    let html = '<div class="ejemplo-grid">';

    examples.forEach((example, index) => {
      const preparedRaw =
        this.getExtension(example.name) === "json"
          ? fmtJSON(example.raw)
          : example.raw;

      this.examples.push(preparedRaw);

      const previewId = `ex-code-${index}`;

      const path = example.path || this.localFilePath(card, example.name);

      html += `
        <div class="file-card" style="margin-bottom:18px">
          <div class="file-card__head">
            <div class="file-card__icon">
              ${_fileIcon(example.name)}
            </div>

            <div>
              <div class="file-card__name">
                ${this.escape(example.name)}
              </div>
              <div class="file-card__meta">
                ${this.escape(
                  (this.getExtension(example.name) || "file").toUpperCase(),
                )}
              </div>
            </div>
          </div>

          <div class="file-card__actions">
            }"
              download
            >
              ${t("btn.download")}
            </a>

            }"
              target="_blank"
              rel="noopener noreferrer"
            >
              ${t("btn.viewGithub")}
            </a>

            <button
              class="file-btn"
              onclick="toggleExampleCode('${previewId}', this, '${this.escape(path)}', ${index})"
            >
              ${t("btn.viewContent")}
            </button>
          </div>

          <div
            class="ejemplo-cp"
            id="${previewId}"
            style="display:none;margin-top:6px"
          ></div>
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
    if (!fileNameOrPath) {
      return "";
    }

    if (String(fileNameOrPath).includes("/")) {
      return fileNameOrPath;
    }

    return `${card.dir || card.folder}/${fileNameOrPath}`;
  }

  getExtension(name) {
    if (typeof _ext === "function") {
      return _ext(name);
    }

    const value = String(name || "");

    const index = value.lastIndexOf(".");

    return index >= 0 ? value.slice(index + 1).toLowerCase() : "";
  }

  getRawUrl(path) {
    if (typeof rawUrl === "function") {
      return rawUrl(path);
    }

    return `https://raw.githubusercontent.com/${CONFIG.owner}/${CONFIG.repo}/${CONFIG.branch}/${path}`;
  }
}

window.ResponseRenderer = ResponseRenderer;

if (
  typeof RendererFactory !== "undefined" &&
  typeof ResponseRenderer !== "undefined"
) {
  RendererFactory.registerRenderer("Response", ResponseRenderer);
}
