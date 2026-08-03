/* =========================================================
  github-service.js — Servicio GitHub para documentación
  técnica de E-Invoicing

  ┌─────────────────────────────────────────────────────┐
  |  Capa de acceso a datos del repositorio GitHub.     |
  |                                                     |
  |  Responsabilidades:                                 |
  |  - Consultar carpetas del repositorio.              |
  |  - Obtener activos asociados a una card.            |
  |  - Clasificar schemas, ejemplos y README.           |
  |  - Centralizar llamadas a la API de GitHub.         |
  |                                                     |
  |  Gestiona actualmente:                              |
  |  - listFolder()                                     |
  |  - getDirectoryAssets()                             |
  |                                                     |
  |  No contiene lógica de renderizado ni UI.           |
  |  No conoce Invoice, Response, Status ni Versions.   |
  └─────────────────────────────────────────────────────┘
   ========================================================= */

class GithubService {

  getHeaders() {
    const headers = {
      Accept: 'application/vnd.github.v3+json'
    };

    if (CONFIG.token) {
      headers.Authorization = `token ${CONFIG.token}`;
    }

    return headers;
  }

  async listFolder(folder) {
    const url =
      `https://api.github.com/repos/${CONFIG.owner}/` +
      `${CONFIG.repo}/contents/${folder}?ref=${CONFIG.branch}`;

    const response = await fetch(
      url,
      {
        headers: this.getHeaders()
      }
    );

    if (!response.ok) {
      throw new Error(`Error cargando carpeta ${folder}`);
    }

    return response.json();
  }

  async loadRepoTree() {
    const url =
      `https://api.github.com/repos/${CONFIG.owner}/` +
      `${CONFIG.repo}/git/trees/${CONFIG.branch}?recursive=1`;

    const response = await fetch(
      url,
      {
        headers: this.getHeaders()
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API ${response.status}`);
    }

    const data = await response.json();

    return data.tree || [];
  }

  async getDirectoryAssets(folder) {
    const files = await this.listFolder(folder);

    const result = {
      schemas: [],
      examples: [],
      readmes: {},
      others: []
    };

    files.forEach(file => {
      const lower = String(file.name || '').toLowerCase();
      const readmeMatch = lower.match(/^readme\.([a-z]{2})\.md$/);

      if (readmeMatch) {
        result.readmes[readmeMatch[1]] = file;
        return;
      }

      if (
        lower.includes('schema') ||
        lower.endsWith('.xsd')
      ) {
        result.schemas.push(file);
        return;
      }

      if (
        lower.includes('ejemplo') ||
        lower.includes('example') ||
        lower.includes('sample')
      ) {
        result.examples.push(file);
        return;
      }

      result.others.push(file);
    });

    return result;
  }

  getRawUrl(path) {
    return `https://raw.githubusercontent.com/${CONFIG.owner}/${CONFIG.repo}/${CONFIG.branch}/${path}`;
  }

  getGithubUrl(path) {
    return `https://github.com/${CONFIG.owner}/${CONFIG.repo}/blob/${CONFIG.branch}/${path}`;
  }

  getGithubFolderUrl(path) {
    return `https://github.com/${CONFIG.owner}/${CONFIG.repo}/tree/${CONFIG.branch}/${path}`;
  }


}

window.GithubService = new GithubService();