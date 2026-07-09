const SITE_CONFIG = {
  owner:              'layuso-generix',
  repo:               'Test_Web_GNX',
  branch:             'main',
  defaultLanguage:    'es',
  storageKey:         'generix_cyc_lang',
  rootPath:           'E-invoicing/Standard/',
  contentPath:        'Invoice',
  responsesPath:      'Responses',
  statusPath:         'Status',
  versionsPath:       'Versions',
  docuAeatPath:       'E-invoicing/AEAT-Documentation',
  token:              '',
  sections: [
    {id:"invoice-json",   group:"invoice",        format:"json",  icon:"{}",  title:{es:"Factura JSON",en:"Invoice JSON"}, description:{es:"Documentación técnica del estándar JSON de factura.",en:"Technical documentation for the invoice JSON standard."}, readme:{es:"E-invoicing/Standard/Invoice/Json/readme.es.md", en:"E-invoicing/Standard/Invoice/Json/readme.en.md"}, files:[{label:"JSON example", type:"json", path:"E-invoicing/Standard/Invoice/Json/GNX_Invoice_Json.json"},{label:"JSON schema", type:"json", path:"E-invoicing/Standard/Invoice/Json/GNX_Invoice_Schema_Json.json"}], validatorSchema:"E-invoicing/Standard/Invoice/Json/GNX_Invoice_Schema_Json.json"},
    {id:"response-json",  group:"response",       format:"json",  icon:"↩",   title:{es:"Respuesta JSON",en:"Response JSON"}, description:{es:"Documentación de respuestas en formato JSON.",en:"JSON response documentation."}, readme:{es:"E-invoicing/Standard/Response/Json/readme.es.md", en:"E-invoicing/Standard/Response/Json/readme.en.md"}, files:[{label:"Response JSON", type:"json", path:"E-invoicing/Standard/Response/Json/GNX_Response_Json.json"}], validatorSchema:"E-invoicing/Standard/Response/Json/GNX_Response_Json.json"},
    {id:"status-json",    group:"status",         format:"json",  icon:"✓",   title:{es:"Estados JSON",en:"Status JSON"}, description:{es:"Documentación de estados en formato JSON.",en:"JSON status documentation."}, readme:{es:"E-invoicing/Standard/Status/Json/readme.es.md", en:"E-invoicing/Standard/Status/Json/readme.en.md"}, files:[{label:"Status JSON", type:"json", path:"E-invoicing/Standard/Status/Json/GNX_Status_Json.json"},{label:"Status schema", type:"json", path:"E-invoicing/Standard/Status/Json/GNX_Schema_Status_Json.json"}], validatorSchema:"E-invoicing/Standard/Status/Json/GNX_Schema_Status_Json.json"},
    {id:"invoice-xml",    group:"invoice",        format:"xml",   icon:"<> ", title:{es:"Factura XML",en:"Invoice XML"}, description:{es:"Documentación técnica del estándar XML de factura.",en:"Technical documentation for the invoice XML standard."}, readme:{es:"E-invoicing/Standard/Invoice/Xml/readme.es.md", en:"E-invoicing/Standard/Invoice/Xml/readme.en.md"}, files:[{label:"XML example", type:"xml", path:"E-invoicing/Standard/Invoice/Xml/GNX_Invoice_xml.xml"},{label:"XSD schema", type:"xsd", path:"E-invoicing/Standard/Invoice/Xml/GNX_Schema_xml.xsd"}]},
    {id:"response-xml",   group:"response",       format:"xml",   icon:"↩",   title:{es:"Respuesta XML",en:"Response XML"}, description:{es:"Documentación de respuestas y errores en formato XML.",en:"XML response and error documentation."}, readme:{es:"E-invoicing/Standard/Response/Xml/readme.es.md", en:"E-invoicing/Standard/Response/Xml/readme.en.md"}, files:[{label:"Error invoice", type:"xml", path:"E-invoicing/Standard/Response/Xml/error-invoice.xml"},{label:"Error partner", type:"xml", path:"E-invoicing/Standard/Response/Xml/error-partner.xml"},{label:"Error schema", type:"xsd", path:"E-invoicing/Standard/Response/Xml/schema-errores.xsd"}]},
    {id:"status-xml",     group:"status",         format:"xml",   icon:"✓",  title:{es:"Estados XML",en:"Status XML"}, description:{es:"Documentación de estados en formato XML.",en:"XML status documentation."}, readme:{es:"E-invoicing/Standard/Status/Xml/readme.es.md", en:"E-invoicing/Standard/Status/Xml/readme.en.md"}, files:[{label:"Status XML", type:"xml", path:"E-invoicing/Standard/Status/Xml/GNX_Status_xml.xml"},{label:"Status XSD", type:"xsd", path:"E-invoicing/Standard/Status/Xml/GNX_Schema_Status_xml.xsd"}]},
    {id:"aeat",           group:"documentation",  format:"pdf",   icon:"PDF", title:{es:"Documentación AEAT",en:"AEAT Documentation"}, description:{es:"Documentación oficial relacionada con Crea y Crece.",en:"Official documentation related to Crea y Crece."}, files:[{label:"Anexo 1", type:"pdf", path:"E-invoicing/AEAT-Documentation/Crea&Crece/anexo1.pdf"},{label:"Anexo 2", type:"pdf", path:"E-invoicing/AEAT-Documentation/Crea&Crece/anexo2.pdf"}]}
  ]
};
window.SITE_CONFIG = SITE_CONFIG;
