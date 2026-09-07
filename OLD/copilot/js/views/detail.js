let _examples = [];
let _schemaRaw = '';

async function openEndpoint(folder, dir) {
    _detailDir = dir || `${CONFIG.contentPath}/${folder}`;
    showDetail();
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === 'descripcion'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-descripcion'));
    document.getElementById('d-title').textContent = t('loading');
    document.getElementById('d-breadcrumb-name').textContent = folder;
    document.getElementById('d-desc').textContent  = '';
    document.getElementById('ep-badges').innerHTML = '';
    document.getElementById('desc-body').innerHTML = '<p style="color:var(--gray-500)">' + t('loading') + '</p>';
    document.getElementById('estructura-body').innerHTML    = '<p style="color:var(--gray-500)">' + t('loading') + '</p>';
    document.getElementById('enumeraciones-body').innerHTML = '<p style="color:var(--gray-500)">' + t('loading') + '</p>';
    document.getElementById('ejemplo-inner').innerHTML = '<p style="color:var(--gray-500)">' + t('loading') + '</p>';
    document.getElementById('snav-btns-estructura').innerHTML    = '';
    document.getElementById('snav-btns-enumeraciones').innerHTML = '';
    _examples = [];

    try {
        const { schemaFile, exampleFiles, readmeFile } = await discoverFilesAt(_detailDir);
        const [sRes, rRes] = await Promise.allSettled([
            schemaFile ? rawFetch(`${_detailDir}/${schemaFile.name}`) : Promise.reject('no schema'),
            readmeFile ? rawFetch(`${_detailDir}/${readmeFile.name}`) : Promise.reject('no readme')
        ]);

        _schemaRaw      = sRes.status === 'fulfilled' ? sRes.value : '';
        const schema    = _schemaRaw ? localizeNode(JSON.parse(_schemaRaw)) : {};
        const readmeRaw = rRes.status === 'fulfilled' ? rRes.value : null;

        const exResults = await Promise.allSettled(
            exampleFiles.map(f => rawFetch(`${_detailDir}/${f.name}`))
        );
        const examplesData = exampleFiles
            .map((f, i) => ({ name: f.name, raw: exResults[i].status === 'fulfilled' ? exResults[i].value : null }))
            .filter(e => e.raw !== null);

        const ep     = schema['x-wms-endpoint'] || {};
        const method = (ep.method || '').toUpperCase();
        const title  = schema.title || folder;
        document.getElementById('d-title').textContent = title;
        document.getElementById('d-breadcrumb-name').textContent = title;
        document.getElementById('d-desc').textContent  = schema['x-wms-author'] || '';
        document.getElementById('ep-badges').innerHTML = [
            method          ? `<span class="method-badge ${method}">${method}</span>` : '',
            ep.path         ? `<span class="ep-path">${ep.path}</span>` : '',
            ep.version      ? `<span class="version-pill">${ep.version}</span>` : '',
            ep.category     ? `<span class="cat-pill">${ep.category}</span>` : '',     
            ep.releaseDate  ? `<span class="cat-pill">${ep.releaseDate}</span>` : ''
        ].join('');

        renderDescripcion(schema, readmeRaw, examplesData);
        renderEstructura(schema, folder, schemaFile ? schemaFile.name : null);
        renderEnumeraciones(schema);
        renderEjemplo(examplesData, folder);

    } catch (err) {
        document.getElementById('d-title').textContent = t('detail.errorLoad');
        document.getElementById('d-desc').textContent  = err.message;
        document.getElementById('desc-body').innerHTML = `<p style="color:#cf1322">${esc(err.message)}</p>`;
    }
}
