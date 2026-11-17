## Factura XML

### ¿Es para mí?

Usa este estándar si tu sistema **genera facturas en XML** y las envía a Generix Spain.
Si trabajas con JSON, consulta **Factura JSON**.

---

### Cómo empezar

1. **Descarga el schema** (XSD) en *Ejemplos y schemas*. Es la referencia oficial: si algo no cuadra con esta guía, manda el schema.
2. **Parte de un ejemplo** de la misma pestaña y adáptalo a tus datos.
3. **Valida tu fichero** contra el XSD con tu herramienta habitual antes de enviarlo.
4. **Revisa la respuesta**: recibirás un mensaje de **Respuesta** y, después, los **Estados** de la factura.

---

### Estructura en un vistazo

```
InvoiceGNX
└── Invoices                  Lote de facturas
    └── Invoice               Una factura
        ├── InvoiceHeader       Número, fecha, tipo, rectificativa
        ├── Parties             Emisor, receptor y tercero
        ├── TaxesOutputs      Impuestos repercutidos
        ├── TaxesWithheld     Retenciones
        ├── InvoiceTotals       Totales, descuentos y cargos generales
        ├── Items             Líneas de factura
        ├── PaymentDetails    Vencimientos y medio de pago
        └── AdditionalData      Documentos relacionados y anexos
```
<!-- REVISAR: completar con los bloques de primer nivel que falten (p. ej. FileHeader) -->

El detalle de cada bloque está en la pestaña **Estructura**.

---

### Reglas que conviene conocer

| Tema | Regla |
|---|---|
| Fechas y horas | Formato `AAAA-MM-DDThh:mm:ss` |
| Países | Código de 2 letras (ISO 3166-1), p. ej. `ES` |
| Monedas | Código de 3 letras (ISO 4217), p. ej. `EUR` |
| Idiomas | Código de 2 letras (ISO 639-1), p. ej. `es` |
| Listas de valores | Solo se admiten los valores de la pestaña **Enumeraciones** |
| Rectificativas | Requieren `ReasonCode` (L2.A) y `CorrectionMethod` (L2.B) |
| Anexos | Solo `pdf`, `jpg`, `jpeg` o `png` |

---

### Qué encontrarás en cada pestaña

| Pestaña | Para qué sirve |
|---|---|
| **Descripción** | Esta guía |
| **Estructura** | Todos los bloques y campos: tipo, obligatoriedad y restricciones. Pulsa 🔗 para saltar a un tipo |
| **Enumeraciones** | Valores admitidos en cada lista, con su significado y dónde se usan |
| **Ejemplos y schemas** | Ficheros de ejemplo y schema para descargar |

---

### Versiones

Trabaja siempre con la **versión vigente** del schema. Las anteriores están en **Recursos › Versiones de esquemas**.
<!-- REVISAR: versión vigente y fecha -->

### ¿Dudas?

Contacta con tu interlocutor de Generix Spain indicando el **número de factura** y, si lo tienes, el **mensaje de Respuesta** recibido.
