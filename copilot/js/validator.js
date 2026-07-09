let CURRENT_SCHEMA = null;
function typeOfValue(v) {
    if (Array.isArray(v)) return "array";
    if (v === null) return "null";
    return typeof v;
}
function normalizeTypes(t) {
    return Array.isArray(t) ? t : t ? [t] : [];
}
function resolveRef(root, node) {
    if (!node || !node.$ref || !node.$ref.startsWith("#/")) return node;
    let cur = root;
    for (const p of node.$ref.slice(2).split("/")) {
        cur = cur && cur[p];
    }
    return cur || node;
}
function validateValue(root, schema, value, path, errors) {
    schema = resolveRef(root, schema);
    if (!schema) return;
    const types = normalizeTypes(schema.type);
    if (types.length) {
        const actual = typeOfValue(value);
        const ok = types.some((t) =>
        t === "integer" ? Number.isInteger(value) : t === actual,
        );
        if (!ok)
        errors.push({
            path,
            message: `${t("validator.type")}: ${types.join(" | ")}`,
        });
    }
    if (
        schema.enum &&
        !schema.enum.some((v) => JSON.stringify(v) === JSON.stringify(value))
    )
        errors.push({
        path,
        message: `${t("validator.enum")}: ${schema.enum.join(", ")}`,
        });
    if (typeof value === "string") {
        if (schema.maxLength != null && value.length > schema.maxLength)
        errors.push({
            path,
            message: `${t("validator.maxLength")}: ${schema.maxLength}`,
        });
        if (schema.minLength != null && value.length < schema.minLength)
        errors.push({
            path,
            message: `${t("validator.minLength")}: ${schema.minLength}`,
        });
        if (schema.pattern) {
        try {
            if (!new RegExp(schema.pattern).test(value))
            errors.push({
                path,
                message: `${t("validator.pattern")}: ${schema.pattern}`,
            });
        } catch (e) {}
        }
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
        const props = schema.properties || {};
        (schema.required || []).forEach((k) => {
        if (!(k in value))
            errors.push({
            path: path ? path + "/" + k : k,
            message: t("validator.required") + `: ${k}`,
            });
        });
        Object.keys(value).forEach((k) => {
        if (props[k])
            validateValue(
            root,
            props[k],
            value[k],
            path ? path + "/" + k : k,
            errors,
            );
        else if (schema.additionalProperties === false)
            errors.push({
            path: path ? path + "/" + k : k,
            message: t("validator.additional") + `: ${k}`,
            });
        });
    }
    if (Array.isArray(value) && schema.items) {
        value.forEach((it, i) =>
        validateValue(root, schema.items, it, `${path}[${i}]`, errors),
        );
    }
}
async function loadConfiguredSchema(path) {
    const txt = await loadTextFile(path);
    return JSON.parse(txt);
}
function renderValidationSummary(kind, title, text, errors = []) {
    const cont = document.getElementById("validationSummary");
    cont.classList.remove("val-empty");
    let table = "";
    if (errors.length) {
        table = `<table class="val-err-tbl"><thead><tr><th>#</th><th>${t("validator.field")}</th><th>${t("validator.error")}</th></tr></thead><tbody>${errors.map((e, i) => `<tr><td>${i + 1}</td><td><code>${esc(e.path || "root")}</code></td><td>${esc(e.message)}</td></tr>`).join("")}</tbody></table>`;
    }
    cont.innerHTML = `<div class="val-status-card ${kind}"><div class="val-status-head"><div class="val-status-title">${esc(title)}</div><div class="val-status-badge">${esc(kind)}</div></div><p class="val-status-text">${esc(text)}</p></div>${table}`;
}
function renderJsonViewer(text) {
    let formatted = text;
    try {
        formatted = JSON.stringify(JSON.parse(text), null, 2);
    } catch (e) {}
    document.getElementById("jsonViewerContainer").innerHTML =
        `<div class="code-panel"><div class="code-header">JSON</div><pre class="code-pre">${esc(formatted)}</pre></div>`;
}
function setupValidator() {
    const select = document.getElementById("validatorSchema"),
        drop = document.getElementById("dropzone"),
        input = document.getElementById("fileInput");
    if (!select) return;
    const sections = CONFIG.sections.filter((s) => s.validatorSchema);
    select.innerHTML =
        `<option value="">${t("validator.select")}</option>` +
        sections
        .map(
            (s) =>
            `<option value="${esc(s.validatorSchema)}">${esc(getLocalized(s.title))}</option>`,
        )
        .join("");
    select.onchange = () => {
        const on = !!select.value;
        drop.classList.toggle("disabled", !on);
        drop.querySelector("span").textContent = on
        ? t("validator.drop.enabled")
        : t("validator.drop.disabled");
        CURRENT_SCHEMA = null;
        renderValidationSummary(
        "info",
        t("validator.wait"),
        t("validator.waitText"),
        );
        document.getElementById("jsonViewerContainer").innerHTML = "";
    };
    drop.onclick = () => {
        if (select.value) input.click();
    };
    drop.ondragover = (e) => {
        e.preventDefault();
        if (select.value) drop.classList.add("dragover");
    };
    drop.ondragleave = () => drop.classList.remove("dragover");
    drop.ondrop = (e) => {
        e.preventDefault();
        drop.classList.remove("dragover");
        if (select.value && e.dataTransfer.files[0])
        handleValidationFile(e.dataTransfer.files[0], select.value);
    };
    input.onchange = () =>
    input.files[0] && handleValidationFile(input.files[0], select.value);
}
async function handleValidationFile(file, schemaPath) {
    const text = await file.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        renderValidationSummary(
            "error",
            t("validator.invalid"),
            t("validator.syntax"),
        );
        renderJsonViewer(text);
        return;
    }
    try {
        CURRENT_SCHEMA = CURRENT_SCHEMA || (await loadConfiguredSchema(schemaPath));
    } catch (e) {
        renderValidationSummary("warning", t("validator.schemaLoad"), e.message);
        renderJsonViewer(text);
        return;
    }
    const errors = [];
    validateValue(CURRENT_SCHEMA, CURRENT_SCHEMA, data, "", errors);
    if (errors.length)
        renderValidationSummary(
            "error",
            t("validator.err"),
            t("validator.errText"),
            errors,
        );
    else
        renderValidationSummary(
            "success",
            t("validator.ok"),
            t("validator.okText"),
        );
    renderJsonViewer(text);
}
window.setupValidator = setupValidator;
