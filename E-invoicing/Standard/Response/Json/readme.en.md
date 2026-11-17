## Response JSON

### Is this for me?

It is the message Generix returns **after receiving each invoice submission**. It tells you whether the file was accepted or rejected and, if there are errors, which ones and where.
This standard describes that message in **JSON**. If you work with XML, see **Response XML**.

---

### Where it fits in the flow

```
Your system ──Invoice──▶ Generix ──Response──▶ Your system
                               └─Status (1..n)──▶ Your system
```

- **When it arrives:** once per invoice submission.
- **What to do:** if rejected, fix the errors reported and resend.

---

### Possible results

| Result | Meaning | What to do |
|---|---|---|
| Accepted | The submission is valid | Nothing; wait for Status updates |
| Rejected | The submission has errors | Fix and resend |

<!-- REVIEW: confirm the actual values of the result field and add the usual error codes -->

---

### Getting started

1. **Download the schema** (JSON Schema) from *Examples & schemas* to prepare your system to receive this message.
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
