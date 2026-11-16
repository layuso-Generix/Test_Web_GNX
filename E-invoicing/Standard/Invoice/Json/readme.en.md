## Invoice JSON · Generix Spain Standard

JSON format for sending B2B electronic invoices to Generix Spain.
Complies with **Law 18/2022 (Crea y Crece)** and the AEAT Annex I code lists.

---

### Is this for me?

Use this standard if your system **generates invoices in JSON** and sends them to Generix.
If you work with XML, see **Invoice XML**.

---

### Get started in 4 steps

1. **Download the schema** (*Examples & schemas* tab). It is the official reference: if anything differs from this guide, the schema prevails.
2. **Start from an example** in the same tab and adapt it to your data.
3. **Validate your file** with this site's *Validator* before sending it.
4. **Check the response**: after sending you will receive a **Response** message and then the invoice **Status** updates.

---

### Structure at a glance

```
InvoiceGNX
└── Invoices[]                  Invoice batch
    └── Invoice[]               One invoice
        ├── InvoiceHeader       Number, date, type, correction
        ├── Parties             Issuer, recipient and third party
        ├── TaxesOutputs[]      Output taxes
        ├── TaxesWithheld[]     Withholdings
        ├── InvoiceTotals       Totals, general discounts and charges
        ├── Items[]             Invoice lines
        ├── PaymentDetails[]    Instalments and payment means
        └── AdditionalData      Related documents and attachments
```
<!-- REVIEW: add any missing top-level blocks (e.g. FileHeader) -->

Each block is detailed in the **Structure** tab. Click 🔗 on any type to jump to its definition.

---

### Rules worth knowing from the start

| Topic | Rule |
|---|---|
| Dates and times | Format `YYYY-MM-DDThh:mm:ss` |
| Countries | 2-letter code (ISO 3166-1), e.g. `ES` |
| Currencies | 3-letter code (ISO 4217), e.g. `EUR` |
| Languages | 2-letter code (ISO 639-1), e.g. `en` |
| Code lists | Only the values in the **Enumerations** tab are accepted |
| Corrective invoices | Require `ReasonCode` (L2.A) and `CorrectionMethod` (L2.B) |
| Attachments | Only `pdf`, `jpg`, `jpeg` or `png` |

---

### What you will find in each tab

| Tab | Purpose |
|---|---|
| **Description** | This guide |
| **Structure** | Every block and field: type, whether required, and constraints |
| **Enumerations** | Accepted values for each list, their meaning and where they are used |
| **Examples & schemas** | Example and schema files to download |

---

### Versions

Always work with the **current version** of the schema. Previous ones are under **Resources › Schema versions**.
<!-- REVIEW: state the current version and date here -->

### Questions?

Contact your Generix Spain representative quoting the **invoice number** and, if available, the **Response message** received.
