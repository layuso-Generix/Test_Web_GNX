/* =========================================================
  CONFIG - Web e-Invoicing
  
  ┌─────────────────────────────────────────────────────────────────┐
  │  -Configuración del repositorio GitHub (CONFIG)                 │
  │  -Configuración funcional de la aplicación (SITE_CONFIG)        │ 
  │  -Todas las cards de documentación que aparecen en la UI        │
  └─────────────────────────────────────────────────────────────────┘
   ========================================================= */
const CONFIG = {
  owner:              'layuso-generix',
  repo:               'Test_Web_GNX',
  branch:             'main',
  rootPath:           'E-invoicing/Standard/',
  contentPath:        'Invoice',
  responsesPath:      'Responses',
  statusPath:         'Status',
  versionsPath:       'E-invoicing/Standard/Versions',
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
          dir: 'E-invoicing/Standard/Invoice/Json'
        },
        { id: 'response-json',
          folder: 'Response / Json',
          title_es: 'Respuesta JSON', title_en: 'Response JSON',
          description_es: 'Documentación de respuestas en formato JSON.',
          description_en: 'JSON response documentation.',
          group: 'Response', format: 'JSON', icon: 'RESP', category: 'Standard',
          dir: 'E-invoicing/Standard/Response/Json'
        },
        { id: 'status-json',
          folder: 'Status / Json',
          title_es: 'Estados JSON', title_en: 'Status JSON',
          description_es: 'Documentación de estados en formato JSON.',
          description_en: 'JSON status documentation.',
          group: 'Status', format: 'JSON', icon: 'STAT', category: 'Standard',
          dir: 'E-invoicing/Standard/Status/Json'
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
          dir: 'E-invoicing/Standard/Invoice/Xml'
        },
        { id: 'response-xml',
          folder: 'Response / Xml',
          title_es: 'Respuesta XML', title_en: 'Response XML',
          description_es: 'Documentación de respuestas y errores en formato XML.',
          description_en: 'XML response and error documentation.',
          group: 'Response', format: 'XML', icon: 'RESP', category: 'Standard',
          dir: 'E-invoicing/Standard/Response/Xml'
        },
        { id: 'status-xml',
          folder: 'Status / Xml',
          title_es: 'Estados XML', title_en: 'Status XML',
          description_es: 'Documentación de estados en formato XML.',
          description_en: 'XML status documentation.',
          group: 'Status', format: 'XML', icon: 'STAT', category: 'Standard',
          dir: 'E-invoicing/Standard/Status/Xml'
        }
      ]
    },
    { section: 'UBL',
      icon: '</>', 
      cards: [
        { id: 'invoice-ubl',
          folder: 'Invoice / UBL',
          title_es: 'Factura UBL', title_en: 'Invoice UBL',
          description_es: 'Documentación técnica del estándar UBL de factura.',
          description_en: 'Technical documentation for the invoice UBL standard.',
          group: 'Invoice', format: 'UBL', icon: 'INV', category: 'Standard',
          dir: 'E-invoicing/Standard/Invoice/UBL'
        },
        { id: 'response-ubl',
          folder: 'Response / UBL',
          title_es: 'Respuesta UBL', title_en: 'Response UBL',
          description_es: 'Documentación de respuestas y errores en formato UBL.',
          description_en: 'UBL response and error documentation.',
          group: 'Response', format: 'UBL', icon: 'RESP', category: 'Standard',
          dir: 'E-invoicing/Standard/Response/UBL'
        },
        { id: 'status-ubl',
          folder: 'Status / UBL',
          title_es: 'Estados UBL', title_en: 'Status UBL',
          description_es: 'Documentación de estados en formato UBL.',
          description_en: 'UBL status documentation.',
          group: 'Status', format: 'UBL', icon: 'STAT', category: 'Standard',
          dir: 'E-invoicing/Standard/Status/UBL'
        }
      ]
    }
  ]
};

window.CONFIG = CONFIG;
window.SITE_CONFIG = SITE_CONFIG;

