// Rutas relativas a la página: funcionan tanto en la raíz como en /GenerixCyC/.
export const JSON_DIR = "E-invoicing/Standard/Invoice/Json/";
export const SCHEMA_URL = JSON_DIR + "GNX_Invoice_SPFE.schema.json";
export const EXAMPLES = [
  ["ordinaria", "Factura ordinaria", "Expedida por el vendedor (EM), tipo 380."],
  ["tercero", "Expedida por un tercero", "Expedidor TE. Parties.ThirdParty contiene una lista, incluso con un solo tercero."],
  ["rectificativa", "Rectificativa por diferencias", "Tipo 384 con motivo y método de rectificación en Corrective."]
];
export const exampleUrl = id => JSON_DIR + "ejemplo_spfe_" + id + ".json";
