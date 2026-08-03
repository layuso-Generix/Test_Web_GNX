/* =========================================================
  versions-renderer.js — Renderizador para versiones en la web de E-Invoicing
  
  ESTRUCTURA GENERAL:
  ┌─────────────────────────────────────────────────────┐
  │  - Historial.                                       │
  │  - Comparación de versiones.                        │
  │  - Campos añadidos.                                 │
  │  - Campos eliminados.                               │
  │  - Campos modificados.                              │
  └─────────────────────────────────────────────────────┘

  ========================================================= */

class VersionsRenderer {
  constructor() {
    this.previewCache = {};
  }

  async render() {
    const status = document.getElementById("versStatus");
    const cont = document.getElementById("versContainer");
    const quick = document.getElementById("versQuick");

    if (!status || !cont || !quick) {
      return;
    }

    status.textContent = t("loading");
    cont.innerHTML = "";
    quick.innerHTML = "";

    try {
      const tree = await window.GithubService.loadRepoTree();

      const prefix = CONFIG.versionsPath + "/";

      const files = tree
        .filter((item) => item.type === "blob" && item.path.startsWith(prefix))
        .map((item) => ({
          path: item.path,
          size: item.size,
        }));
      console.log("[Versions] files:", files);
      console.log("[Versions] prefix:", prefix);
      console.log("[Versions] tree:", tree);

      if (!files.length) {
        status.textContent = "";

        cont.innerHTML = `
          <div class="highlight-box">
            <strong>${t("versions.emptyTitle")}</strong>
            <br>
            ${t("versions.emptyBody", {
              path: CONFIG.versionsPath,
            })}
          </div>
        `;

        return;
      }

      const groups = this.buildGroups(files, prefix);

      const names = Object.keys(groups).sort((a, b) =>
        a === "(raíz)" ? -1 : b === "(raíz)" ? 1 : a.localeCompare(b),
      );

      status.textContent = t("versions.count", {
        n: files.length,
        m: names.length,
      });

      quick.innerHTML =
        names.map(group => `
          <a href="#grp-${this._slug(group)}">
            ${esc(
              group === '(raíz)'
                ? t('versions.general')
                : group
            )}
            (${groups[group].length})
          </a>
        `).join('');


      let html = "";

      names.forEach((group) => {
        const items = groups[group].sort((a, b) =>
          b.name.localeCompare(a.name, undefined, { numeric: true }),
        );

        html += `
          <div class="folder-section" id="grp-${this._slug(group)}">
            <h3>📦 ${esc(group === "(raíz)" ? t("versions.general") : group)}</h3>
            <div class="file-grid">
        `;

        items.forEach((file) => {
          const previewId = "pv-" + this._slug(file.path);

          const previewBtn = _isText(file.name)
            ? `
                <button
                  class="file-btn"
                  onclick="window.VersionsRenderer.togglePreview(
                    '${file.path}',
                    '${previewId}',
                    this
                  )"
                >
                  ${t("btn.viewContent")}
                </button>
              `
            : "";

          html += `
            <div class="file-card">
              <div class="file-card__head">
                <div class="file-card__icon">${_fileIcon(file.name)}</div>
                <div>
                  <div class="file-card__name">${esc(file.name)}</div>
                  <div class="file-card__meta">
                    ${esc((_ext(file.name) || 'file').toUpperCase())}
                    ${file.subdir ? ' · 📁 ' + esc(file.subdir) : ''}
                  </div>
                </div>
              </div>
              <div class="file-card__actions">
                <a class="file-btn file-btn--primary" target="_blank" href="${window.GithubService.getRawUrl(file.path)}">
                  ${t("btn.viewContent")}
                </a>
                <a class="file-btn" target="_blank" href="${window.GithubService.getGithubUrl(file.path)}">
                  ${t("btn.viewGithub")}
                </a>
                <div class="file-preview" id="${previewId}">
                  <pre></pre>
                </div>
              </div>
            </div>
          `;
        });

        html += `
            </div>
          </div>
        `;
      });

      cont.innerHTML = html;
    } catch (error) {
      status.textContent = "";

      cont.innerHTML = `
        <div class="highlight-box">
          <strong>
            ${t("versions.loadFail")}
          </strong>
          <br>
          ${esc(error.message)}
        </div>
      `;
    }
  }

  buildGroups(files, prefix) {
    const groups = {};

    files.forEach((file) => {
      const rel = file.path.slice(prefix.length);

      const parts = rel.split("/");

      const group = parts.length > 1 ? parts[0] : "(raíz)";

      const subdir = parts.slice(1, -1).join("/");

      if (!groups[group]) {
        groups[group] = [];
      }

      groups[group].push({
        ...file,
        name: parts[parts.length - 1],
        subdir,
      });
    });

    return groups;
  }

  async togglePreview(path, pid, btn) {
    const box = document.getElementById(pid);

    if (!box) {
      return;
    }

    const card = box.closest(".file-card");

    const grid = box.closest(".file-grid");

    if (box.classList.contains("open")) {
      box.classList.remove("open");

      if (card) {
        card.classList.remove("expanded");
      }

      btn.textContent = t("btn.viewContent");

      return;
    }

    if (grid) {
      grid.querySelectorAll(".file-preview.open").forEach((openBox) => {
        if (openBox !== box) {
          openBox.classList.remove("open");
        }

        const openCard = openBox.closest(".file-card");

        if (openCard && openCard !== card) {
          openCard.classList.remove("expanded");
        }
      });
    }

    box.classList.add("open");

    if (card) {
      card.classList.add("expanded");
    }

    btn.textContent = t("btn.hide");

    const pre = box.querySelector("pre");

    if (!pre) {
      return;
    }

    if (this.previewCache[path]) {
      pre.textContent = this.previewCache[path];
      return;
    }

    pre.textContent = t("loading");

    try {
      const response = await fetch(window.GithubService.getRawUrl(path));

      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }

      let text = await response.text();

      if (text.length > 60000) {
        text = text.slice(0, 60000) + "\n\n" + t("versions.truncated");
      }

      this.previewCache[path] = text;

      pre.textContent = text;
    } catch (error) {
      pre.textContent = t("versions.loadFailMsg") + error.message;
    }
  }
  _slug(value) {
    return String(value).replace(/[^A-Za-z0-9_-]/g, '-');
  }


}

window.VersionsRenderer = new VersionsRenderer();
