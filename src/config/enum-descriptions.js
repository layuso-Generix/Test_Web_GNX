/* =========================================================
  enum-descriptions.js — Descripción de las enumeraciones
  ---------------------------------------------------------
  Formato de cada entrada:
    title   emoji + nombre + traducción (cabecera del bloque)
    esp/eng descripción de la enumeración
    values  { valor: { esp, eng } }
  Fuente: listas L1–L10 del Anexo I de la AEAT.
  Las entradas marcadas con "PENDIENTE" no están en las listas
  de la AEAT: hay que confirmarlas.
  ========================================================= */
(function () {
  'use strict';

  /* L7 — Tipo de cargo o minoración (lo usan 2 enums) */
  const L7_VALUES = {
    SUPL:  { esp: 'Cargo en nombre de un tercero', eng: 'Charge on behalf of a third party' },
    MINO:  { esp: 'Minoración en nombre de un tercero', eng: 'Allowance on behalf of a third party' },
    RETE:  { esp: 'Retención', eng: 'Withholding' },
    IEDMT: { esp: 'Impuesto especial sobre determinados medios de transporte', eng: 'Special tax on certain means of transport' },
    OTROS: { esp: 'Otros supuestos de tasas o impuestos no incluidos en el resto de claves', eng: 'Other fees or taxes not included in the other codes' }
  };

window.enumDescriptions = {
    ModalityEnum: {
      title: '📦 Modality - Modalidad del Envío',
      esp: 'Modalidad del envío',   // PENDIENTE: confirmar significado de I y L
      eng: 'Submission modality',
      values: {
        I: { esp: 'PENDIENTE', eng: 'PENDING' },
        L: { esp: 'PENDIENTE', eng: 'PENDING' }
      }
    },
  InvoiceIssuerTypeEnum: {
    title: '🪪 InvoiceIssuerType - Tipo de Emisor',
    esp: 'Identifica quién emite materialmente la factura',
    eng: 'Identifies who issues the invoice',
    values: {
      EM: { esp: 'Emisor',   eng: 'Issuer' },
      RE: { esp: 'Receptor', eng: 'Recipient' },
      TE: { esp: 'Tercero',  eng: 'Third party' }
    }
  },
  PersonTypeCodeEnum: {
    title: '👤 PersonTypeCode - Tipo de Persona',
    esp: 'Tipo de persona en la identificación fiscal',
    eng: 'Person type for tax identification',
    values: {
      F: { esp: 'Persona física',   eng: 'Natural person' },
      J: { esp: 'Persona jurídica', eng: 'Legal entity' }
    }
  },
  ResidenceTypeCodeEnum: {
    title: '🌐 ResidenceTypeCode - Tipo de Residencia',
    esp: 'Tipo de residencia fiscal del sujeto',
    eng: 'Tax residence type of the party',
    values: {
      E: { esp: 'Fuera de la Unión Europea',     eng: 'Outside the European Union' },
      R: { esp: 'Residente en España',           eng: 'Spanish tax resident' },
      U: { esp: 'Residente en la Unión Europea', eng: 'European Union resident' }
    }
  },
  InvoiceDocumentTypeEnum: {
      title: '📄 InvoiceDocumentType - Tipo de Factura',
      esp: 'Tipo de factura según la lista L1 del Anexo I',
      eng: 'Invoice type per list L1 of Annex I',
    values: {
        380: { esp: 'Factura (artículo 6, 7.2 y 7.3 del RD 1619/2012)', eng: 'Invoice (articles 6, 7.2 and 7.3 of RD 1619/2012)' },
        381: { esp: 'Nota de abono', eng: 'Credit note' },   // No está en L1: confirmar
        384: { esp: 'Factura rectificativa', eng: 'Corrective invoice' },
        388: { esp: 'Factura emitida en sustitución de facturas simplificadas', eng: 'Invoice issued in replacement of simplified invoices' },
        389: { esp: 'Factura emitida por el destinatario', eng: 'Invoice issued by the recipient' },
      471: { esp: 'Factura rectificativa emitida por el destinatario', eng: 'Corrective invoice issued by the recipient' },
        481: { esp: 'PENDIENTE', eng: 'PENDING' }             // No está en L1: confirmar
      }
  },
  InvoiceClassEnum: {
    title: '📑 InvoiceClass - Clase de Factura',
    esp: 'Clase de factura según su naturaleza dentro del flujo de emisión',
    eng: 'Invoice class according to its nature within the issuance flow',
    values: {
      OO: { esp: 'Original',       eng: 'Original' },
      OC: { esp: 'Original copia', eng: 'Original copy' }
    }
  },
  ReasonCodeEnum: {
      title: '✏️ ReasonCode - Tipo de Factura Rectificativa',
      esp: 'Tipo de factura rectificativa según la lista L2.A del Anexo I',
      eng: 'Corrective invoice type per list L2.A of Annex I',
    values: {
        R1: { esp: 'Factura rectificativa (error fundado en derecho y artículo 80 Uno, Dos y Seis LIVA)', eng: 'Corrective invoice (legally founded error and article 80 One, Two and Six VAT Law)' },
        R2: { esp: 'Factura rectificativa (artículo 80.3)', eng: 'Corrective invoice (article 80.3)' },
        R3: { esp: 'Factura rectificativa (artículo 80.4)', eng: 'Corrective invoice (article 80.4)' },
      R4: { esp: 'Factura rectificativa (resto)', eng: 'Corrective invoice (other)' }
      }
  },
  CorrectionMethodEnum: {
      title: '🔧 CorrectionMethod - Modalidad de Rectificativa',
      esp: 'Modalidad de factura rectificativa según la lista L2.B del Anexo I',
      eng: 'Corrective invoice method per list L2.B of Annex I',
    values: {
      I: { esp: 'Rectificativa por diferencias', eng: 'Correction by differences' },
      S: { esp: 'Rectificativa por sustitución', eng: 'Correction by substitution' }
    }
  },

  /* ── Nuevas (recuperadas de la web antigua) ─────────── */
  TaxTypeCodeEnum: {
    title: '💼 TaxTypeCode - Tipo de Impuesto',
    esp: 'Código del impuesto aplicado a la operación',
    eng: 'Code of the tax applied to the operation',
    values: {
      IVA:  { esp: 'Impuesto sobre el Valor Añadido', eng: 'Value Added Tax' },
      IPSI: { esp: 'Impuesto sobre la Producción, los Servicios y la Importación (Ceuta y Melilla)', eng: 'Production, Services and Import Tax (Ceuta and Melilla)' },
      IGIC: { esp: 'Impuesto General Indirecto Canario', eng: 'Canary Islands General Indirect Tax' },
      IRPF: { esp: 'Retención por IRPF', eng: 'Personal income tax withholding' },
      RIS:  { esp: 'Retención por Impuesto sobre Sociedades', eng: 'Corporate income tax withholding' },
      REEQ: { esp: 'Recargo de equivalencia', eng: 'Equivalence surcharge' }
    }
  },
  TaxRegimeCodeEnum: {
      title: '🏛️ TaxRegimeCode - Clave de Régimen',
      esp: 'Clave de régimen según las listas L3A (IVA), L3B (IGIC) y L3C (IPSI) del Anexo I',
      eng: 'Regime code per lists L3A (VAT), L3B (IGIC) and L3C (IPSI) of Annex I',
      values: {
        '01': { esp: 'Operación en régimen general y no incluida en otras claves (IVA, IGIC, IPSI)', eng: 'General regime operation not included in other codes (VAT, IGIC, IPSI)' },
        '02': { esp: 'Exportación (IVA, IGIC)', eng: 'Export (VAT, IGIC)' },
        '03': { esp: 'Régimen especial de bienes usados, objetos de arte, antigüedades y objetos de colección (IVA, IGIC)', eng: 'Special regime for second-hand goods, works of art, antiques and collectors\' items (VAT, IGIC)' },
        '04': { esp: 'Régimen especial del oro de inversión (IVA, IGIC)', eng: 'Special regime for investment gold (VAT, IGIC)' },
        '05': { esp: 'Régimen especial de las agencias de viajes (IVA, IGIC)', eng: 'Special regime for travel agencies (VAT, IGIC)' },
        '06': { esp: 'Régimen especial grupo de entidades, nivel avanzado (IVA, IGIC)', eng: 'Special group of entities regime, advanced level (VAT, IGIC)' },
        '07': { esp: 'Régimen especial del criterio de caja (IVA, IGIC)', eng: 'Special cash basis regime (VAT, IGIC)' },
        '08': { esp: 'Operaciones sujetas a otro impuesto: IPSI/IGIC (en IVA), IPSI/IVA (en IGIC), IGIC/IVA (en IPSI)', eng: 'Operations subject to another tax: IPSI/IGIC (in VAT), IPSI/VAT (in IGIC), IGIC/VAT (in IPSI)' },
        '09': { esp: 'Servicios de agencias de viaje que actúan como mediadoras en nombre y por cuenta ajena, D.A.4.ª RD 1619/2012 (IVA, IGIC)', eng: 'Services of travel agencies acting as mediators in the name and on behalf of others, D.A.4 RD 1619/2012 (VAT, IGIC)' },
        '11': { esp: 'Operaciones de arrendamiento de local de negocio (IVA, IGIC, IPSI)', eng: 'Business premises lease (VAT, IGIC, IPSI)' },
        '14': { esp: 'Impuesto pendiente de devengo en certificaciones de obra cuyo destinatario sea una Administración Pública (IVA, IGIC)', eng: 'Tax pending accrual on works certifications for a Public Administration (VAT, IGIC)' },
        '15': { esp: 'Impuesto pendiente de devengo en operaciones de tracto sucesivo (IVA, IGIC)', eng: 'Tax pending accrual on successive operations (VAT, IGIC)' },
        '17': { esp: 'Régimen especial de comerciante minorista (IGIC)', eng: 'Special retail trader regime (IGIC)' },
        '18': { esp: 'Régimen especial del pequeño empresario o profesional (IGIC)', eng: 'Special regime for small entrepreneurs or professionals (IGIC)' },
        '19': { esp: 'Operaciones interiores exentas: artículo 25 Ley 19/1994 (IGIC) / exentas (IPSI)', eng: 'Exempt domestic operations: article 25 Law 19/1994 (IGIC) / exempt (IPSI)' },
        '20': { esp: 'Régimen simplificado (IPSI)', eng: 'Simplified regime (IPSI)' }
      }
  },
  TaxOperationTypeEnum: {
    title: '⚙️ TaxOperationType - Tipo de Operación',
      esp: 'Código de tipo de operación según la lista L4 del Anexo I',
      eng: 'Operation type code per list L4 of Annex I',
    values: {
      S:  { esp: 'Operaciones en régimen general', eng: 'General regime operations' },
      Z:  { esp: 'Bienes con tipo impositivo 0 %', eng: 'Goods with 0% rate' },
      E:  { esp: 'Exento de IVA', eng: 'VAT exempt' },
      AE: { esp: 'Inversión del sujeto pasivo', eng: 'Reverse charge' },
      O:  { esp: 'Operación no sujeta a IVA', eng: 'Operation not subject to VAT' },
      G:  { esp: 'Exportación', eng: 'Export' },
      L:  { esp: 'Operación sujeta al IGIC', eng: 'Operation subject to IGIC' },
      M:  { esp: 'Operación sujeta al IPSI', eng: 'Operation subject to IPSI' },
      N:  { esp: 'Regímenes nacionales de IVA (grupo de entidades nivel avanzado y recargo de equivalencia)', eng: 'National VAT regimes (advanced group of entities and equivalence surcharge)' },
      D:  { esp: 'Régimen especial de agencias de viajes', eng: 'Special regime for travel agencies' },
      F:  { esp: 'Régimen especial de bienes usados, objetos de arte, antigüedades y objetos de colección', eng: 'Special regime for second-hand goods, works of art, antiques and collectors\' items' }
    }
  },
  DiscountChargeTypeCodeEnum: {
      title: '🏷️ DiscountChargeTypeCode - Tipo de Cargo o Minoración',
      esp: 'Tipo de cargo o minoración según la lista L7 del Anexo I',
      eng: 'Charge or allowance type per list L7 of Annex I',
      values: L7_VALUES
    },
    DiscountTypeCodeEnum: {
      title: '➖ DiscountTypeCode - Tipo de Minoración',
      esp: 'Tipo de minoración según la lista L7 del Anexo I',
      eng: 'Allowance type per list L7 of Annex I',
      values: L7_VALUES
    },
    ChargeTypeCodeEnum: {
      title: '➕ ChargeTypeCode - Impuestos y Cargos',
      esp: 'Impuestos y cargos a nivel de línea o documento según la lista L9 del Anexo I',
      eng: 'Line or document level taxes and charges per list L9 of Annex I',
    values: {
      IEH:    { esp: 'Impuesto especial sobre los hidrocarburos', eng: 'Special tax on hydrocarbons' },
      IECE:   { esp: 'Impuesto especial sobre la cerveza', eng: 'Special tax on beer' },
      IEPI:   { esp: 'Impuesto especial sobre productos intermedios', eng: 'Special tax on intermediate products' },
      IEA:    { esp: 'Impuesto especial sobre el alcohol y bebidas derivadas', eng: 'Special tax on alcohol and spirits' },
      IET:    { esp: 'Impuesto especial sobre las labores del tabaco', eng: 'Special tax on tobacco products' },
      IELC:   { esp: 'Impuesto sobre los líquidos para cigarrillos electrónicos y otros productos relacionados con el tabaco', eng: 'Tax on e-cigarette liquids and other tobacco-related products' },
      IEE:    { esp: 'Impuesto especial sobre la electricidad', eng: 'Special tax on electricity' },
      IEC:    { esp: 'Impuesto especial sobre el carbón', eng: 'Special tax on coal' },
      IEP:    { esp: 'Impuesto especial sobre los envases de plástico no reutilizables (artículo 82.9.a Ley 7/2022)', eng: 'Special tax on non-reusable plastic packaging (article 82.9.a Law 7/2022)' },
      IEDE:   { esp: 'Impuesto sobre el depósito de residuos en vertederos, la incineración y la coincineración de residuos', eng: 'Tax on landfill, incineration and co-incineration of waste' },
      IMPTAS: { esp: 'Otros impuestos y tasas', eng: 'Other taxes and fees' },
      RESTO:  { esp: 'Otros cargos a nivel de línea o documento', eng: 'Other line or document level charges' }
    }
  },
  PaymentMeansEnum: {
    title: '💳 PaymentMeans - Medio de Pago',
      // PENDIENTE: no está en las listas AEAT. Valores según Facturae 3.2.x: confirmar
      esp: 'Código del medio de pago',
      eng: 'Payment means code',
    values: {
      '01': { esp: 'Al contado', eng: 'Cash' },
      '02': { esp: 'Recibo domiciliado', eng: 'Direct debit' },
      '03': { esp: 'Recibo', eng: 'Receipt' },
      '04': { esp: 'Transferencia', eng: 'Credit transfer' },
      '05': { esp: 'Letra aceptada', eng: 'Accepted bill of exchange' },
      '06': { esp: 'Crédito documentario', eng: 'Documentary credit' },
      '07': { esp: 'Contrato adjudicación', eng: 'Contract award' },
      '08': { esp: 'Letra de cambio', eng: 'Bill of exchange' },
      '09': { esp: 'Pagaré a la orden', eng: 'Transferable promissory note' },
      '10': { esp: 'Pagaré no a la orden', eng: 'Non-transferable promissory note' },
      '11': { esp: 'Cheque', eng: 'Cheque' },
      '12': { esp: 'Reposición', eng: 'Open account reimbursement' },
      '13': { esp: 'Especiales', eng: 'Special payment' },
      '14': { esp: 'Compensación', eng: 'Set-off by reciprocal credits' },
      '15': { esp: 'Giro postal', eng: 'Postal giro' },
      '16': { esp: 'Cheque conformado', eng: 'Certified cheque' },
      '17': { esp: 'Cheque bancario', eng: 'Banker\'s draft' },
      '18': { esp: 'Pago contra reembolso', eng: 'Cash on delivery' },
      '19': { esp: 'Pago mediante tarjeta', eng: 'Payment by card' }
    }
  },
  CadastralReferenceEnum: {
    title: '🏠 CadastralReference - Situación del Inmueble',
      esp: 'Situación del inmueble según la lista L6 del Anexo I',
      eng: 'Property location per list L6 of Annex I',
    values: {
      '01': { esp: 'Inmueble con referencia catastral situado en cualquier punto del territorio español, excepto País Vasco y Navarra', eng: 'Property with cadastral reference anywhere in Spain, except the Basque Country and Navarre' },
      '02': { esp: 'Inmueble situado en la Comunidad Autónoma del País Vasco o en la Comunidad Foral de Navarra', eng: 'Property located in the Basque Country or the Chartered Community of Navarre' },
      '03': { esp: 'Inmueble en cualquiera de las situaciones anteriores pero sin referencia catastral', eng: 'Property in any of the above situations but without cadastral reference' },
      '04': { esp: 'Inmueble situado en el extranjero', eng: 'Property located abroad' }
    }
  },
  AttachmentFormatEnum: {
    title: '📎 AttachmentFormat - Formato de Anexo',
      esp: 'Formato del fichero adjunto a la factura. Solo se admiten formatos no ejecutables y de uso común',
      eng: 'Format of the file attached to the invoice. Only non-executable, common formats are allowed',
    values: {
      pdf:  { esp: 'Documento PDF', eng: 'PDF document' },
      jpg:  { esp: 'Imagen JPEG',   eng: 'JPEG image' },
      jpeg: { esp: 'Imagen JPEG',   eng: 'JPEG image' },
      png:  { esp: 'Imagen PNG',    eng: 'PNG image' }
    }
  }
};
})();
