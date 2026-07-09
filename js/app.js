import './i18n.js';

import './views/detail.js';
import './views/versions.js';
import './views/responses.js';
import './views/validator.js';

/* ── Init: auto-discover endpoint folders ────────────────── */
async function init() {
    renderSkeletons(6);
    try {
        const tree    = await loadRepoTree();
        const folders = buildCacheFromTree(tree);
        if (!folders.length) { showEmpty(t('empty.none')); return; }
        const hasResp = tree.some(it => it.type === 'blob' && it.path.startsWith(CONFIG.responsesPath + '/'));
        const respCard = document.getElementById('resp-card');
        if (respCard) respCard.style.display = hasResp ? '' : 'none';
        const settled = await Promise.allSettled(folders.map(f => loadCard(f)));
        const eps = settled
            .filter(r => r.status === 'fulfilled' && r.value)
            .map(r => r.value);
        const numOf = e => {
            const m = (e.schema.title || e.folder || '').match(/(\d+)/);
            return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
        };
        eps.sort((a, b) => numOf(a) - numOf(b) || (a.schema.title || a.folder).localeCompare(b.schema.title || b.folder));
        document.getElementById('stat-count').textContent = eps.length;
        renderGrid(eps);
    } catch (err) {
        document.getElementById('endpoints-grid').innerHTML =
            `<div class="error-banner">
                <strong>${t('err.repo.title')}</strong>
                ${t('err.repo.body')}<br>
                <small style="opacity:.7">${err.message}</small>
            </div>`;
    }
}

