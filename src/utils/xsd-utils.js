const XsdUtils = (() => {
  const XSD_NS = "http://www.w3.org/2001/XMLSchema";

  function parse(xsdText) {
    const parser = new DOMParser();

    const doc = parser.parseFromString(xsdText, "application/xml");

    const errors = doc.getElementsByTagName("parsererror");

    if (errors && errors.length) {
      throw new Error("El XSD no se ha podido parsear correctamente.");
    }

    return doc;
  }

  function getTypeNode(doc, name) {
    const complex = doc.getElementsByTagNameNS(XSD_NS, "complexType");

    for (let i = 0; i < complex.length; i++) {
      if (complex[i].getAttribute("name") === name) {
        return complex[i];
      }
    }

    const simple = doc.getElementsByTagNameNS(XSD_NS, "simpleType");

    for (let i = 0; i < simple.length; i++) {
      if (simple[i].getAttribute("name") === name) {
        return simple[i];
      }
    }

    return null;
  }

  function getTypeKind(doc, name) {
    const node = getTypeNode(doc, name);

    if (!node) {
      return null;
    }

    return node.localName;
  }

  function dedent(text) {
    const lines = String(text).replace(/\t/g, "    ").split("\n");

    let min = Infinity;

    lines.forEach((line) => {
      if (!line.trim()) {
        return;
      }

      const indent = line.match(/^ */)[0].length;

      min = Math.min(min, indent);
    });

    if (!isFinite(min)) {
      min = 0;
    }

    return lines
      .map((line) => line.slice(min))
      .join("\n")
      .trim();
  }

  function getElements(node) {
    const result = [];

    const elements = node.getElementsByTagNameNS(XSD_NS, "element");

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];

      const name = el.getAttribute("name");

      if (!name) {
        continue;
      }

      result.push({
        name,
        type: el.getAttribute("type") || "",
        min: el.getAttribute("minOccurs"),
        max: el.getAttribute("maxOccurs"),
      });
    }

    return result;
  }

  function getSimpleTypeFacets(node) {
    const restriction = node.getElementsByTagNameNS(XSD_NS, "restriction")[0];

    if (!restriction) {
      return {
        base: "",
        facets: [],
      };
    }

    const base = restriction.getAttribute("base") || "";

    const facets = [];

    [
      "length",
      "pattern",
      "minLength",
      "maxLength",
      "minInclusive",
      "maxInclusive",
    ].forEach((tag) => {
      const nodes = restriction.getElementsByTagNameNS(XSD_NS, tag);

      for (let i = 0; i < nodes.length; i++) {
        facets.push({
          name: tag,
          value: nodes[i].getAttribute("value") || "",
        });
      }
    });

    return {
      base,
      facets,
    };
  }

  function getElementsDetailed(node) {
    const result = [];

    const elements = node.getElementsByTagNameNS(XSD_NS, "element");

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];

      const name = el.getAttribute("name");

      if (!name) {
        continue;
      }

      let description = "";

      for (let k = 0; k < el.childNodes.length; k++) {
        const child = el.childNodes[k];

        if (child.nodeType === 1 && child.localName === "annotation") {
          const docs = child.getElementsByTagNameNS(XSD_NS, "documentation");

          if (docs.length) {
            description = docs[0].textContent.trim();

            break;
          }
        }
      }

      result.push({
        name,
        type: el.getAttribute("type") || "",
        min: el.getAttribute("minOccurs"),
        max: el.getAttribute("maxOccurs"),
        doc: description,
      });
    }

    return result;
  }

  function extractXsdSnippet(xsdText, name) {
    if (!xsdText) {
      return "";
    }

    const tags = ["complexType", "simpleType"];

    for (const tag of tags) {
      const regex = new RegExp(
        `[ \\t]*<xs:${tag} name="${name}"[\\s\\S]*?</xs:${tag}>`,
      );

      const match = xsdText.match(regex);

      if (match) {
        return dedent(match[0]);
      }
    }

    return "";
  }

  function getEnumUsage(doc, enumName) {
    const usage = [];

    const elements = doc.getElementsByTagNameNS(XSD_NS, "element");

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];

      if (el.getAttribute("type") !== enumName) {
        continue;
      }

      const elementName = el.getAttribute("name") || "";

      let ancestor = el.parentNode;

      let complexTypeName = "";

      while (ancestor && ancestor.nodeType === 1) {
        if (
          ancestor.localName === "complexType" &&
          ancestor.getAttribute("name")
        ) {
          complexTypeName = ancestor.getAttribute("name");

          break;
        }

        ancestor = ancestor.parentNode;
      }

      usage.push(
        complexTypeName ? `${complexTypeName}.${elementName}` : elementName,
      );
    }

    return usage;
  }

  function getEnumerations(doc, enumNames) {
    const result = [];

    enumNames.forEach((enumName) => {
      const node = getTypeNode(doc, enumName);

      if (!node) {
        return;
      }

      const enumNodes = node.getElementsByTagNameNS(XSD_NS, "enumeration");

      const values = [];

      for (let i = 0; i < enumNodes.length; i++) {
        values.push(enumNodes[i].getAttribute("value"));
      }

      result.push({
        name: enumName,
        values,
        usage: getEnumUsage(doc, enumName),
      });
    });

    return result;
  }

  function extractEnums(doc) {
    const results = [];
    const simpleTypes = doc.getElementsByTagNameNS(XSD_NS, "simpleType");
    for (let i = 0; i < simpleTypes.length; i++) {
      const node = simpleTypes[i];
      const name = node.getAttribute("name");
      if (!name) {continue;}
      const enumNodes = node.getElementsByTagNameNS(XSD_NS, "enumeration");
      if (!enumNodes.length) {continue;}
      const values = [];
      for (let j = 0; j < enumNodes.length; j++) {
        values.push(enumNodes[j].getAttribute("value"));
      }
      const documentationNode = node.getElementsByTagNameNS(XSD_NS, 'documentation')[0];
      const description = documentationNode ? documentationNode.textContent.trim() : '';

      results.push({
        field: name,
        path: getEnumUsage(doc, name).join(", "),
        type: "xs:string",
        description,
        values,
        raw: node,
        defName: name,
        enumName: name
      });
    }

    return results;
  }
  ``;

  function getComplexTypes(doc) {
    const result = [];

    const nodes = doc.getElementsByTagNameNS(XSD_NS, "complexType");

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      result.push({
        name: node.getAttribute("name"),
        node,
      });
    }

    return result;
  }

  return {
    XSD_NS,
    parse,
    getTypeNode,
    getTypeKind,
    dedent,
    getElements,
    getElementsDetailed,
    getSimpleTypeFacets,
    extractXsdSnippet,
    getEnumUsage,
    getEnumerations,
    extractEnums,
    getComplexTypes,
  };
})();

window.XsdUtils = XsdUtils;
