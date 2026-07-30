/* ── GitHub API helpers ─────────────────────────────────── */

/**
 * Lista el contenido de una carpeta del repo via GitHub Contents API.
 * Devuelve array de objetos { name, path, type, ... }
 */
async function listFolder(folder) {
  const url = `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${folder}?ref=${CONFIG.branch}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error cargando carpeta ${folder}`);
  return res.json();
}

/**
 * Clasifica los ficheros de una carpeta en:
 *  - readmes:  { [lang]: file }  — readme.es.md → readmes['es']
 *  - schemas:  ficheros que contienen 'schema' en el nombre o terminan en .xsd
 *  - examples: ficheros que contienen 'ejemplo' o 'example'
 *  - others:   el resto
 */
async function getDirectoryAssets(folder) {
  const files = await listFolder(folder);
  const result = { schemas: [], examples: [], readmes: {}, others: [] };

    files.forEach(file => {
    const lower = file.name.toLowerCase();

    // readme.<lang>.md  →  readmes['es'], readmes['en'], etc.
        const readmeMatch = lower.match(/^readme\.([a-z]{2})\.md$/);
        if (readmeMatch) { result.readmes[readmeMatch[1]] = file; return; }

    // Schema (JSON o XSD)
    if (lower.includes('schema') || lower.endsWith('.xsd')) { result.schemas.push(file); return; }

    // Ejemplos / examples
    if (lower.includes('ejemplo') || lower.includes('example')) { result.examples.push(file); return; }

        result.others.push(file);
    });

    return result;
}