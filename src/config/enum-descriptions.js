window.enumDescriptions = {
	InvoiceIssuerTypeEnum: {
    title: '🪪 InvoiceIssuerType - Tipo de Emisor',
    esp: 'Identifica quién emite materialmente la factura',
    eng: 'Identifies who issues the invoice',
    values: {
      EM: {esp: 'Emisor',   eng: 'Issuer'},
      RE: {esp: 'Receptor', eng: 'Recipient'},
      TE: {esp: 'Tercero',  eng: 'Third party'}
    }
  },
  PersonTypeCodeEnum: {
		title: '👤 PersonTypeCode - Tipo de Persona',
		esp: 'Tipo de persona en la identificación fiscal',
		eng: 'Person type for tax identification',
		values: {
			F: {esp: 'Persona física',   eng: 'Natural person'},
			J: {esp: 'Persona jurídica', eng: 'Legal entity'}
		}
	},
  ResidenceTypeCodeEnum: {
    title: '🌐 ResidenceTypeCode - Tipo de Residencia',
    esp: 'Tipo de residencia fiscal del sujeto',
    eng: 'Tax residence type of the party',
    values: {
      E: {esp: 'Fuera de la Unión Europea', eng: 'Outside the European Union'},
      R: {esp: 'Residente en España', eng: 'Spanish tax resident'},
      U: {esp: 'Residente en la Unión Europea', eng: 'European Union resident'}
    }
  },
  InvoiceDocumentTypeEnum: {
    title: '📄 InvoiceDocumentType - Tipo de Documento',
    esp: 'Código del tipo de documento de factura conforme a UNTDID 1001 y a la lista L1 del Anexo I (RD 238/2026)',
    eng: 'Invoice document type code per UNTDID 1001 and list L1 of Annex I (RD 238/2026)',
    values: {
      380: {esp: 'Factura ordinaria', eng: 'Standard invoice'},
      381: {esp: 'Nota de abono', eng: 'Credit note'},
      384: {esp: 'Factura rectificativa', eng: 'Corrective invoice'},
      388: {esp: 'Factura emitida en sustitución de simplificadas', eng: 'Invoice replacing simplified invoices'},
      389: {esp: 'Factura emitida por el destinatario', eng: 'Invoice issued by the recipient'},
      471: {esp: 'Factura rectificativa emitida por el destinatario', eng: 'Corrective invoice issued by the recipient'}
    }
  },
  InvoiceClassEnum: {
    title: '📑 InvoiceClass - Clase de Factura',
    esp: 'Clase de factura según su naturaleza dentro del flujo de emisión',
    eng: 'Invoice class according to its nature within the issuance flow',
    values: {
      OO: {esp: 'Original', eng: 'Original'},
      OC: {esp: 'Original copia', eng: 'Original copy'}
    }
  },
  ReasonCodeEnum: {
    title: '✏️ ReasonCode - Motivo de Rectificación',
    esp: 'Código del motivo por el que se emite una factura rectificativa según la lista L2.A del Anexo I',
    eng: 'Code identifying the reason for issuing a corrective invoice per list L2.A of Annex I',
    values: {
      R1: {esp: 'Error fundado en derecho y Art. 80 Uno, Dos y Seis LIVA', eng: 'Legally founded error and Art. 80 One, Two and Six VAT Law'},
      R2: {esp: 'Art. 80.3 LIVA (concurso de acreedores)', eng: 'Art. 80.3 VAT Law (creditor insolvency)'},
      R3: {esp: 'Art. 80.4 LIVA (créditos incobrables)', eng: 'Art. 80.4 VAT Law (uncollectible debts)'},
      R4: {esp: 'Resto de causas', eng: 'Other causes'}
    }
  },
  CorrectionMethodEnum: {
    title: '🔧 CorrectionMethod - Método de Corrección',
    esp: 'Método empleado para la rectificación según la lista L2.B del Anexo I',
    eng: 'Correction method used per list L2.B of Annex I',
    values: {
      I: {esp: 'Rectificativa por diferencias', eng: 'Correction by differences'},
      S: {esp: 'Rectificativa por sustitución', eng: 'Correction by substitution'}
    }
  }

};