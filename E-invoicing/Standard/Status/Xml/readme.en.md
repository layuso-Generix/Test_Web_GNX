## Status XML

### Is this for me?

These are the messages Generix sends **every time an invoice's situation changes** after it has been accepted. They let you follow the invoice to its final status.
This standard describes that message in **XML**. If you work with JSON, see **Status JSON**.

---

### Where it fits in the flow

```
Your system ──Invoice──▶ Generix ──Response──▶ Your system
                               └─Status (1..n)──▶ Your system
```

- **When it arrives:** every time the invoice changes status, so there may be several per invoice.
- **What to do:** update the invoice status in your system with the latest one received.

---

### Possible statuses

Accepted values and their meaning are in the **Enumerations** tab.

<!-- REVIEW: add the table Status | Meaning | Final? and the usual lifecycle order -->

---

### Getting started

1. **Download the schema** (XSD) from *Examples & schemas* to prepare your system to receive this message.
2. **Review the example** in the same tab: it shows a complete real message.
3. **Match each message to its invoice** using the identifiers it contains (see the **Structure** tab).

---

### Rules worth knowing

| Topic | Rule |
|---|---|
| Dates and times | Format `YYYY-MM-DDThh:mm:ss` |
| Countries | 2-letter code (ISO 3166-1), e.g. `ES` |
| Currencies | 3-letter code (ISO 4217), e.g. `EUR` |
| Languages | 2-letter code (ISO 639-1), e.g. `en` |
| Code lists | Only the values in the **Enumerations** tab are accepted |

---

### What you will find in each tab

| Tab | Purpose |
|---|---|
| **Description** | This guide |
| **Structure** | Every block and field: type, whether required, and constraints. Click 🔗 to jump to a type |
| **Enumerations** | Accepted values for each list, their meaning and where they are used |
| **Examples & schemas** | Example and schema files to download |

---

### Versions

Always work with the **current version** of the schema. Previous ones are under **Resources › Schema versions**.
<!-- REVISAR: versión vigente y fecha -->

### Questions?

Contact your Generix Spain representative attaching the **message received** and the affected **invoice number**.
