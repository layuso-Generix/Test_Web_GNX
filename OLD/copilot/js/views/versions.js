async function showVersions() {
    showView('view-versions');
    await renderVersions();
}
async function renderVersions() {
    const status = document.getElementById('versStatus');
    const cont   = document.getElementById('versContainer');
    const quick  = document.getElementById('versQuick');
    status.textContent = t('loading'); cont.innerHTML = ''; quick.innerHTML = '';

    try {
        const tree   = await loadRepoTree();
        const prefix = CONFIG.versionsPath + '/';
        const files  = tree
            .filter(it => it.type === 'blob' && it.path.startsWith(prefix))
            .map(it => ({ path: it.path, size: it.size }));

        if (!files.length) {
            status.textContent = '';
            cont.innerHTML = `<div class="highlight-box"><strong>${t('versions.emptyTitle')}</strong><br>
                ${t('versions.emptyBody', { path: CONFIG.versionsPath })}<br>
                <a class="download-link" target="_blank" href="https://github.com/${CONFIG.owner}/${CONFIG.repo}/tree/${CONFIG.branch}/${CONFIG.versionsPath}">${t('versions.viewFolder')}</a></div>`;
            return;
        }

        // Agrupar por subcarpeta de primer nivel
        const groups = {};
        files.forEach(f => {
            const rel = f.path.slice(prefix.length);
            const parts = rel.split('/');
            const group = parts.length > 1 ? parts[0] : '(raíz)';
            const subdir = parts.slice(1, -1).join('/');
            (groups[group] = groups[group] || []).push({ ...f, name: parts[parts.length-1], subdir });
        });
        const names = Object.keys(groups).sort((a,b) => a==='(raíz)'?-1:b==='(raíz)'?1:a.localeCompare(b));

        status.textContent = t('versions.count', { n: files.length, m: names.length });
        quick.innerHTML = names.map(g =>
            `<a href="#grp-${_slug(g)}">${esc(g==='(raíz)'?t('versions.general'):g)} (${groups[g].length})</a>`).join('');

        let html = '';
        names.forEach(g => {
            // const items = groups[g].sort((a,b) => a.name.localeCompare(b.name));
            const items = groups[g].sort((a, b) =>
            b.name.localeCompare(a.name, undefined, { numeric: true })
            );
            html += `<div class="folder-section" id="grp-${_slug(g)}">
            <h3>📦 ${esc(g==='(raíz)'?t('versions.general'):g)}</h3><div class="file-grid">`;
            items.forEach(f => {
            const pid = 'pv-' + _slug(f.path);
            const previewBtn = _isText(f.name)
                ? `<button class="file-btn" onclick="toggleVersPreview('${esc(f.path)}','${pid}',this)">${t('btn.viewContent')}</button>` : '';
            html += `<div class="file-card">
                <div class="file-card__head">
                <div class="file-card__icon">${_fileIcon(f.name)}</div>
                <div><div class="file-card__name">${esc(f.name)}</div>
                    <div class="file-card__meta">${esc((_ext(f.name)||'file').toUpperCase())}${f.subdir?' · 📁 '+esc(f.subdir):''}</div></div>
                </div>
                <div class="file-card__actions">
                <a class="file-btn file-btn--primary" target="_blank" href="${_versRaw(f.path)}">${t('btn.download')}</a>
                <a class="file-btn" target="_blank" href="${_versGh(f.path)}">${t('btn.viewGithub')}</a>
                ${previewBtn}
                </div>
                <div class="file-preview" id="${pid}"><pre></pre></div>
            </div>`;
            });
            html += `</div></div>`;
        });
        cont.innerHTML = html;
    } catch (e) {
        status.textContent = '';
        cont.innerHTML = `<div class="highlight-box"><strong>${t('versions.loadFail')}</strong><br>${esc(e.message)}</div>`;
    }
}
async function toggleVersPreview(path, pid, btn) {
    const box = document.getElementById(pid);
    if (!box) return;
    if (box.classList.contains('open')) { box.classList.remove('open'); btn.textContent=t('btn.viewContent'); return; }
    box.classList.add('open'); btn.textContent=t('btn.hide');
    const pre = box.querySelector('pre');
    if (_versPreviewCache[path]) { pre.textContent = _versPreviewCache[path]; return; }
    pre.textContent = t('loading');
    try {
        const res = await fetch(_versRaw(path));
        if (!res.ok) throw new Error('HTTP ' + res.status);
        let text = await res.text();
        if (text.length > 60000) text = text.slice(0,60000) + '\n\n' + t('versions.truncated');
        _versPreviewCache[path] = text;
        pre.textContent = text;
    } catch (e) { pre.textContent = t('versions.loadFailMsg') + e.message; }
}