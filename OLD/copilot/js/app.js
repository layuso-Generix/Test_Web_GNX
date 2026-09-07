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

const APP={
    init(){applyStaticI18n();this.renderHome();document.querySelectorAll("#view-detail .tab-btn").forEach(btn=>btn.onclick=()=>setActiveTab(btn.dataset.tab));const top=document.getElementById("goTop");top.onclick=()=>window.scrollTo({top:0,behavior:"smooth"});function toggleTop(){top.classList.toggle("show",window.scrollY>400)}window.addEventListener("scroll",toggleTop,{passive:true});toggleTop();handleRoute();},
    refresh(){this.renderHome();setupValidator();handleRoute();},
    renderHome(){document.getElementById("stat-sections").textContent=SITE_CONFIG.sections.length;const grid=document.getElementById("sectionGrid");grid.innerHTML=SITE_CONFIG.sections.map(s=>`<a class="card" href="#${esc(s.id)}"><div class="card-icon">${esc(s.icon||s.format.toUpperCase())}</div><div class="card-meta"><span class="badge badge-${esc(s.format)}">${esc(s.format)}</span><span class="badge badge-cat">${esc(s.group)}</span></div><h3>${esc(getLocalized(s.title))}</h3><p>${esc(getLocalized(s.description))}</p><span class="card-link">${t("file.view")}</span></a>`).join("");},
    renderDetail(section){document.title=`Generix · ${getLocalized(section.title)} · Developer Documentation`;document.getElementById("detailBreadcrumb").textContent=getLocalized(section.title);document.getElementById("detailTitle").textContent=getLocalized(section.title);document.getElementById("detailDescription").textContent=getLocalized(section.description);document.getElementById("detailBadges").innerHTML=`<span class="method-badge">${esc(section.format.toUpperCase())}</span><span class="version-pill">${esc(section.group)}</span>`;setActiveTab("readme");renderReadme(section,document.getElementById("readmeContent"));renderFiles(section,document.getElementById("fileGrid"));}
};
window.APP=APP;
document.addEventListener("DOMContentLoaded",()=>APP.init());