/* =========================================================
  enum-utils.js
  ---------------------------------------------------------
  Utilidades para documentación de enumeraciones.
========================================================= */

/* =========================================================
  Obtener definición de una enumeración
========================================================= */

function getEnumInfo(enumName) {
  if (!window.enumDescriptions || !enumName) {
    return null;
  }
  return window.enumDescriptions[enumName] || null;
}

/* =========================================================
  Convertir:
  "EM=emisor|RE=receptor|TE=tercero"
  a:
  {
    EM: "emisor",
    RE: "receptor",
    TE: "tercero"
  }
========================================================= */

function parseEnumDescriptions(text) {
  const result = {};
  if (!text) {
    return result;
  }
  text.split("|").forEach((item) => {
    const parts = item.split("=");
    if (parts.length !== 2) {
      return;
    }
    result[parts[0].trim()] = parts[1].trim();
  });
  return result;
}

/* =========================================================
  Obtener tabla enriquecida
========================================================= */
function buildEnumRows(enumName) {
  const info = getEnumInfo(enumName);
  if (!info?.values) {
    return [];
  }
  return Object.entries(info.values).map(([code, value]) => ({
    code,
    esp: value.esp || "",
    eng: value.eng || "",
  }));
}

function buildEnumTable(enumName) {
  const rows = buildEnumRows(enumName);

  if (!rows.length) {
    return "";
  }

  return `
    <table class="enum-desc-table">
      <thead>
        <tr>
          <th>Código</th>
          <th>Español</th>
          <th>English</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((row) => `
          <tr>
            <td><span class="tag tag--required">${esc(row.code)}</span></td>
            <td>${esc(row.esp)}</td>
            <td>${esc(row.eng)}</td>
          </tr>
        `,).join("")}
      </tbody>
    </table>
  `;
}

/* =========================================================
  Exposición global
========================================================= */

window.getEnumInfo = getEnumInfo;
window.buildEnumRows = buildEnumRows;
window.buildEnumTable = buildEnumTable;
