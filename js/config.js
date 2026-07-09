/* =========================================================
   CONFIG - Web2 e-Invoicing
   Misma idea que CONFIG de web1, pero adaptada a estructura local.
   ========================================================= */
const CONFIG = {
  owner:              'layuso-generix',
  repo:               'Test_Web_GNX',
  branch:             'main',
  rootPath:           'E-invoicing/Standard/',
  contentPath:        'Invoice',
  responsesPath:      'Responses',
  statusPath:         'Status',
  versionsPath:       'Versions',
  docuAeatPath:       'E-invoicing/AEAT-Documentation',
  token:              '',
  mode: 'local'
};

const SITE_CONFIG = {
  storageKey: 'cyc_lang',
  defaultLanguage: 'es',
  sections: [
    { section: 'JSON',
      icon: '{ }', 
      cards: [
        { id: 'invoice-json',
          folder: 'Invoice / Json',
          title_es: 'Factura JSON', title_en: 'Invoice JSON',
          description_es: 'Documentación técnica del estándar JSON de factura.',
          description_en: 'Technical documentation for the invoice JSON standard.',
          group: 'Invoice', format: 'JSON', icon: 'INV', category: 'Standard',
          dir: 'E-invoicing/Standard/Invoice/Json',
          readme: { es: 'E-invoicing/Standard/Invoice/Json/readme.es.md', en: 'E-invoicing/Standard/Invoice/Json/readme.en.md' },
          schemaFile: 'E-invoicing/Standard/Invoice/Json/GNX_Invoice_Schema_Json.json',
          exampleFiles: ['E-invoicing/Standard/Invoice/Json/GNX_Invoice_Json.json'],
          files: [
            { name: 'GNX_Invoice_Json.json', label: 'Invoice JSON example', type: 'json', path: 'E-invoicing/Standard/Invoice/Json/GNX_Invoice_Json.json' },
            { name: 'GNX_Invoice_Schema_Json.json', label: 'Invoice JSON schema', type: 'json', path: 'E-invoicing/Standard/Invoice/Json/GNX_Invoice_Schema_Json.json' }
          ],
          validatorSchema: 'E-invoicing/Standard/Invoice/Json/GNX_Invoice_Schema_Json.json'
        },
        { id: 'response-json',
          folder: 'Response / Json',
          title_es: 'Respuesta JSON', title_en: 'Response JSON',
          description_es: 'Documentación de respuestas en formato JSON.',
          description_en: 'JSON response documentation.',
          group: 'Response', format: 'JSON', icon: 'RESP', category: 'Standard',
          dir: 'E-invoicing/Standard/Response/Json',
          readme: { es: 'E-invoicing/Standard/Response/Json/readme.es.md', en: 'E-invoicing/Standard/Response/Json/readme.en.md' },
          schemaFile: 'GNX_Response_Json.json',
          exampleFiles: ['GNX_Response_Json.json'],
          files: [
            { name: 'GNX_Response_Json.json', label: 'Response JSON', type: 'json', path: 'E-invoicing/Standard/Response/Json/GNX_Response_Json.json' }
          ],
          validatorSchema: 'E-invoicing/Standard/Response/Json/GNX_Response_Json.json'
        },
        { id: 'status-json',
          folder: 'Status / Json',
          title_es: 'Estados JSON', title_en: 'Status JSON',
          description_es: 'Documentación de estados en formato JSON.',
          description_en: 'JSON status documentation.',
          group: 'Status', format: 'JSON', icon: 'STAT', category: 'Standard',
          dir: 'E-invoicing/Standard/Status/Json',
          readme: { es: 'E-invoicing/Standard/Status/Json/readme.es.md', en: 'E-invoicing/Standard/Status/Json/readme.en.md' },
          schemaFile: 'GNX_Schema_Status_Json.json',
          exampleFiles: ['GNX_Status_Json.json'],
          files: [
            { name: 'GNX_Status_Json.json', label: 'Status JSON example', type: 'json', path: 'E-invoicing/Standard/Status/Json/GNX_Status_Json.json' },
            { name: 'GNX_Schema_Status_Json.json', label: 'Status JSON schema', type: 'json', path: 'E-invoicing/Standard/Status/Json/GNX_Schema_Status_Json.json' }
          ],
          validatorSchema: 'E-invoicing/Standard/Status/Json/GNX_Schema_Status_Json.json'
        }
      ]
    },
    { section: 'XML',
      icon: '</>', 
      cards: [
        { id: 'invoice-xml',
          folder: 'Invoice / Xml',
          title_es: 'Factura XML', title_en: 'Invoice XML',
          description_es: 'Documentación técnica del estándar XML de factura.',
          description_en: 'Technical documentation for the invoice XML standard.',
          group: 'Invoice', format: 'XML', icon: 'INV', category: 'Standard',
          dir: 'E-invoicing/Standard/Invoice/Xml',
          readme: { es: 'E-invoicing/Standard/Invoice/Xml/readme.es.md', en: 'E-invoicing/Standard/Invoice/Xml/readme.en.md' },
          schemaFile: 'GNX_Schema_xml.xsd',
          exampleFiles: ['GNX_Invoice_xml.xml'],
          files: [
            { name: 'GNX_Invoice_xml.xml', label: 'Invoice XML example', type: 'xml', path: 'E-invoicing/Standard/Invoice/Xml/GNX_Invoice_xml.xml' },
            { name: 'GNX_Schema_xml.xsd', label: 'Invoice XSD schema', type: 'xsd', path: 'E-invoicing/Standard/Invoice/Xml/GNX_Schema_xml.xsd' }
          ]
        },
        { id: 'response-xml',
      folder: 'Response / Xml',
      title_es: 'Respuesta XML', title_en: 'Response XML',
      description_es: 'Documentación de respuestas y errores en formato XML.',
      description_en: 'XML response and error documentation.',
      group: 'Response', format: 'XML', icon: 'RESP', category: 'Standard',
      dir: 'E-invoicing/Standard/Response/Xml',
      readme: { es: 'E-invoicing/Standard/Response/Xml/readme.es.md', en: 'E-invoicing/Standard/Response/Xml/readme.en.md' },
      schemaFile: 'schema-errores.xsd',
      exampleFiles: ['error-invoice.xml', 'error-partner.xml'],
      files: [
        { name: 'error-invoice.xml', label: 'Error invoice XML', type: 'xml', path: 'E-invoicing/Standard/Response/Xml/error-invoice.xml' },
        { name: 'error-partner.xml', label: 'Error partner XML', type: 'xml', path: 'E-invoicing/Standard/Response/Xml/error-partner.xml' },
        { name: 'schema-errores.xsd', label: 'Error XSD schema', type: 'xsd', path: 'E-invoicing/Standard/Response/Xml/schema-errores.xsd' }
      ]
        },
        { id: 'status-xml',
      folder: 'Status / Xml',
      title_es: 'Estados XML', title_en: 'Status XML',
      description_es: 'Documentación de estados en formato XML.',
      description_en: 'XML status documentation.',
      group: 'Status', format: 'XML', icon: 'STAT', category: 'Standard',
      dir: 'E-invoicing/Standard/Status/Xml',
      readme: { es: 'E-invoicing/Standard/Status/Xml/readme.es.md', en: 'E-invoicing/Standard/Status/Xml/readme.en.md' },
      schemaFile: 'GNX_Schema_Status_xml.xsd',
      exampleFiles: ['GNX_Status_xml.xml'],
      files: [
        { name: 'GNX_Status_xml.xml', label: 'Status XML example', type: 'xml', path: 'E-invoicing/Standard/Status/Xml/GNX_Status_xml.xml' },
        { name: 'GNX_Schema_Status_xml.xsd', label: 'Status XSD schema', type: 'xsd', path: 'E-invoicing/Standard/Status/Xml/GNX_Schema_Status_xml.xsd' }
      ]
        }
      ]
    }
  ]
};

window.CONFIG = CONFIG;
window.SITE_CONFIG = SITE_CONFIG;
