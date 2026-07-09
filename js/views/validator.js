async function fetchSchema(value) {
    if (_schemaCache[value]) return _schemaCache[value];
    const dir = schemaDir(value);
    const files = await window.discoverFilesAt(dir);
    if (!files.schemaFile) throw new Error("No se encontró schema en " + dir);
    const txt = await window.rawFetch(`${dir}/${files.schemaFile.name}`);
    const schema = JSON.parse(txt);
    _schemaCache[value] = schema;
    return schema;
}

async function processJSON(text) {
    let data;
    try { data = JSON.parse(text); }
    catch { result.textContent = window.t('vstatus.syntaxInvalid'); errorList.textContent=""; viewer.textContent=""; return; }
    let schema;
    try { schema = await fetchSchema(sel.value); }
    catch (e) { result.textContent = window.t('vstatus.schemaLoadFail'); errorList.textContent = "➡ " + e.message; viewer.textContent=""; return; }
    let validate;
    try { const ajv = new Ajv({ allErrors:true, strict:false }); addFormats(ajv); validate = ajv.compile(schema); }
    catch (e) { result.textContent = window.t('vstatus.schemaCompileFail'); errorList.textContent = "➡ " + e.message; viewer.textContent=""; return; }
    const valid = validate(data);
    if (valid) {
        window._valErrorLines = [];
        viewer.textContent = JSON.stringify(data, null, 2);
        result.textContent = window.t('vstatus.valid'); errorList.textContent = "";
    } else {
        const { lines, map } = serializeWithMap(data);
        window._valErrorLines = validate.errors.map(e => map[e.instancePath]).filter(Boolean);
        viewer.textContent = lines.join("\n");
        result.textContent = window.t('vstatus.invalid');
        errorList.textContent = validate.errors.map(e => `➡ ${errorPath(e)} → ${describeError(e)}`).join("\n");
    }
}

function renderSummary(msg, raw){
    const t=document.getElementById('validationSummary'), errs=parseErrors(raw), m=statusMeta(msg);
    let tbl='';
    if(errs.length){
        tbl=`<table class="val-err-tbl"><thead><tr><th>${window.t('vtable.num')}</th><th>${window.t('vtable.field')}</th><th>${window.t('vtable.error')}</th></tr></thead><tbody>${
            errs.map(e=>`<tr><td>${e.index}</td><td><code>${esc(e.path)}</code></td><td>${esc(e.message)}</td></tr>`).join('')}</tbody></table>`;
    }
    t.classList.remove('val-empty');
    t.innerHTML=`<div class="val-status-card ${m.kind}"><div class="val-status-head">
        <div class="val-status-title">${esc(m.title)}</div><div class="val-status-badge">${esc(m.badge)}</div></div>
        <p class="val-status-text">${esc(m.text)}</p></div>${tbl}`;
}

function renderViewer(raw){
        const cont=document.getElementById('jsonViewerContainer'), text=(raw||'').trim();
        if(!text){ cont.innerHTML=''; return; }
        const el = Array.isArray(window._valErrorLines) ? window._valErrorLines : [];
        window.renderJsonMinimap(cont, text, el, '<span>' + window.t('vviewer.title') + '</span>');
}