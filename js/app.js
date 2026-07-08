const APP = {
  init() {
    applyStaticI18n();
    this.renderHome();
    document
      .querySelectorAll("#view-detail .tab-btn")
      .forEach((btn) => (btn.onclick = () => setActiveTab(btn.dataset.tab)));
    const top = document.getElementById("goTop");
    top.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });
    function toggleTop() {
      top.classList.toggle("show", window.scrollY > 400);
    }
    window.addEventListener("scroll", toggleTop, { passive: true });
    toggleTop();
    handleRoute();
  },
  refresh() {
    this.renderHome();
    setupValidator();
    handleRoute();
  },
  renderHome() {
    document.getElementById("stat-sections").textContent =
      SITE_CONFIG.sections.length;
    const grid = document.getElementById("sectionGrid");
    grid.innerHTML = SITE_CONFIG.sections
      .map(
        (s) =>
          `<a class="card" href="#${esc(s.id)}"><div class="card-icon">${esc(s.icon || s.format.toUpperCase())}</div><div class="card-meta"><span class="badge badge-${esc(s.format)}">${esc(s.format)}</span><span class="badge badge-cat">${esc(s.group)}</span></div><h3>${esc(getLocalized(s.title))}</h3><p>${esc(getLocalized(s.description))}</p><span class="card-link">${t("file.view")}</span></a>`,
      )
      .join("");
  },
  renderDetail(section) {
    document.title = `Generix · ${getLocalized(section.title)} · Developer Documentation`;
    document.getElementById("detailBreadcrumb").textContent = getLocalized(
      section.title,
    );
    document.getElementById("detailTitle").textContent = getLocalized(
      section.title,
    );
    document.getElementById("detailDescription").textContent = getLocalized(
      section.description,
    );
    document.getElementById("detailBadges").innerHTML =
      `<span class="method-badge">${esc(section.format.toUpperCase())}</span><span class="version-pill">${esc(section.group)}</span>`;
    setActiveTab("readme");
    renderReadme(section, document.getElementById("readmeContent"));
    renderFiles(section, document.getElementById("fileGrid"));
  },
};
window.APP = APP;
document.addEventListener("DOMContentLoaded", () => APP.init());
