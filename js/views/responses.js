async function showRespuestas() {
    showView('view-respuestas');

    const body = document.getElementById('respuestas-body');
    body.innerHTML = '<p style="color:var(--gray-500)">' + t('loading') + '</p>';
    try {
        const dir = CONFIG.responsesPath;
        const tree = await loadRepoTree();
        const prefix = dir + '/';
        const names = tree
            .filter(it => it.type === 'blob' && it.path.startsWith(prefix) && !it.path.slice(prefix.length).includes('/'))
            .map(it => it.path.slice(prefix.length));
        const pick = re => names.find(n => re.test(n));
        const sIni = pick(/schema.*initial/i), eIni = pick(/example.*initial/i);
        const sCb  = pick(/schema.*callback/i), eCb  = pick(/example.*callback/i);

        if (!sIni && !sCb) {
            body.innerHTML = `<div class="highlight-box"><strong>${t('resp.noSchemas.title')}</strong><br>
                ${t('resp.noSchemas.body', { dir: esc(dir) })}</div>`;
            return;
        }

        const getRaw  = async n => n ? await rawFetch(`${dir}/${n}`) : null;
        const [sIniRaw, sCbRaw, rawIni, rawCb] = await Promise.all([getRaw(sIni), getRaw(sCb), getRaw(eIni), getRaw(eCb)]);
        const schemaIni = sIniRaw ? localizeNode(JSON.parse(sIniRaw)) : null;
        const schemaCb = sCbRaw ? localizeNode(JSON.parse(sCbRaw)) : null;
        _respSchemas = {};
        if (sCb) _respSchemas.cb = { name: sCb, raw: sCbRaw, dir };

        const labels = { ini: t('resp.labelIni'), cb: t('resp.labelCb') };
        const sections = [];
        if (schemaIni) sections.push(renderRespuestaSection(schemaIni, rawIni, eIni, 'ini', null));
        if (schemaCb)  sections.push(renderRespuestaSection(schemaCb,  rawCb,  eCb,  'cb', { name: sCb, raw: sCbRaw, dir }));

        _respSections = {};
        sections.forEach(s => { _respSections[s.mid] = s; });

        const navEl = document.getElementById('respuestas-nav');
        const nav = sections.map((s, i) =>
        `<button class="tab-btn ${i===0?'active':''}" onclick="showRespTab('${s.mid}', this)">${esc(labels[s.mid] || s.mid)}</button>`).join('');
        const panels = sections.map((s, i) =>
        `<div class="tab-panel ${i===0?'active':''}" id="resp-panel-${s.mid}">${s.html}</div>`).join('');

        navEl.innerHTML = sections.length > 1
            ? `<div class="tab-nav-inner"><div class="tab-nav">${nav}</div></div>`
            : '';
        navEl.className = sections.length > 1 ? 'tab-nav-outer' : '';
        body.innerHTML = panels;

        if (sections.length) renderRespExample(sections[0].mid);
    } catch (e) {
        body.innerHTML = `<div class="highlight-box" style="border-left-color:#cf1322"><strong>${t('detail.errorLoad')}</strong><br>${esc(e.message)}</div>`;
    }
}

function renderRespuestaSection(schema, exRaw, exName, mid, schemaLink) {
    const defs = schema.$defs || schema.definitions || {};
    const r = schema['x-wms-response'] || {};
        const headHtml = `<div class="resp-block-head">
            <h2>${esc(schema.title || t('resp.response'))}</h2>
            <p>${esc(schema.description || '')}</p>
            ${r.transport ? `<div class="resp-transport">${esc(r.transport)}</div>` : ''}
        </div>`;

    let cardHtml = '';
    if (schemaLink && schemaLink.name) {
        const ghUrl = `https://github.com/${CONFIG.owner}/${CONFIG.repo}/blob/${CONFIG.branch}/${schemaLink.dir}/${schemaLink.name.split('/').map(encodeURIComponent).join('/')}`;
        cardHtml = `<div class="file-card" style="margin:0">
            <div class="file-card__head">
                <div class="file-card__icon">🟨</div>
                <div>
                    <div class="file-card__name">${esc(schemaLink.name)}</div>
                    <div class="file-card__meta">JSON · Schema</div>
                </div>
            </div>
            <div class="file-card__actions">
                <a class="file-btn file-btn--primary" href="#" onclick="downloadRespSchema('${mid}');return false;">${t('btn.download')}</a>
                <a class="file-btn" target="_blank" href="${ghUrl}">${t('btn.viewGithub')}</a>
                <button class="file-btn" onclick="toggleRespSchema('${mid}', this)">${t('btn.viewContent')}</button>
            </div>
            <div class="resp-schema-cp" id="resp-schema-${mid}" style="display:none;margin-top:6px"></div>
        </div>`;
    }

    let h = `<div class="resp-block">`;
    h += cardHtml
        ? `<div class="resp-block-top">${headHtml}${cardHtml}</div>`
        : headHtml;

    const codes = schema['x-wms-status-codes'];
    if (Array.isArray(codes) && codes.length) {
        h += `<div class="resp-sub">${t('resp.httpCodes')}</div>
            <table class="status-tbl"><thead><tr><th style="width:90px">${t('enums.code')}</th><th style="width:150px">${t('resp.state')}</th><th>${t('enums.meaning')}</th></tr></thead><tbody>`;
        h += codes.map(cc => {
            const cls = String(cc.code)[0]==='2' ? 'status-2xx' : String(cc.code)[0]==='4' ? 'status-4xx' : 'status-5xx';
            return `<tr><td><span class="status-code ${cls}">${esc(cc.code)}</span></td><td>${esc(cc.label||'')}</td><td>${esc(cc.meaning||'')}</td></tr>`;
        }).join('');
        h += `</tbody></table>`;
    }

    const fieldTbl = buildResponseFieldTable(schema);
    if (fieldTbl) {
        h += `<div class="resp-sub">${t('resp.msgStruct')}</div>${fieldTbl}`;
    }

    const enums = extractEnums(schema);
    if (enums.length) {
        h += `<div class="resp-sub">${t('resp.enums')}</div>`;
        enums.forEach(en => {
            const parsed = parseEnumMeanings(en.description, en.values);
            const body = parsed.rows.length
                ? `<table class="field-tbl" style="margin-top:6px"><thead><tr><th style="width:120px">${t('enums.code')}</th><th>${t('enums.meaning')}</th></tr></thead><tbody>${
                    parsed.rows.map(rr => `<tr><td><span class="tag-req">${esc(rr.code)}</span></td><td>${esc(rr.meaning)}</td></tr>`).join('')}</tbody></table>`
                : en.values.map(v => `<span class="ev-pill">${esc(String(v))}</span>`).join(' ');
            h += `<div style="margin-bottom:16px"><div style="font-weight:600;margin-bottom:4px">${esc(en.field)}</div>
                ${parsed.general ? `<div style="color:var(--gray-500);font-size:.9rem;margin-bottom:6px">${esc(parsed.general)}</div>` : ''}${body}</div>`;
        });
    }

    const exId = `resp-ex-${mid}`;
    h += `<div class="resp-sub">${t('resp.example')}</div><div id="${exId}"></div></div>`;
    return { html: h, exId, exRaw, exName, mid };
}

let _respSections = {};
function renderRespExample(mid) {
    const s = _respSections[mid]; if (!s) return;
    const el = document.getElementById(s.exId); if (!el || el.dataset.rendered) return;
    el.dataset.rendered = '1';
    if (!s.exRaw) { el.innerHTML = '<p style="color:var(--gray-500)">' + t('resp.noExample') + '</p>'; return; }
    if (typeof renderJsonMinimap === 'function') {
        renderJsonMinimap(el, s.exRaw, [], `<span>${esc(s.exName || 'JSON')}</span>`);
    } else {
        el.innerHTML = 
        `<div style="background:var(--gray-900);border-radius:10px;padding:18px;overflow:auto">
            <pre style="margin:0;color:#e2e8f0;font-family:'Courier New',monospace;font-size:.84rem">
                ${hlJSON(fmtJSON(s.exRaw))}
            </pre>
        </div>`;
    }
}

