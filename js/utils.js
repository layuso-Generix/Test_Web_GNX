function esc(t) {
    if (t == null) return '';
    return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtJSON(t) { try { return JSON.stringify(JSON.parse(t), null, 2); } catch { return t; } }

function hlJSON(json) {
    return json.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        .replace(/("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, m => {
            if (/^"/.test(m)) 
                return /:$/.test(m) ? `<span class="jk">${m}</span>` : `<span class="js">${m}</span>`;
            if (/true|false/.test(m)) 
                return `<span class="jb">${m}</span>`;
            if (m === 'null') 
                return `<span class="jnull">${m}</span>`;
            return `<span class="jn">${m}</span>`;
    });
}

function countTopFields(schema) {
    const defs = schema.$defs || schema.definitions || {};
    const seen = new Set();
    let n = 0;
    function walk(obj) {
        if (!obj || typeof obj !== 'object') return;
        if (obj.$ref) {
            const name = obj.$ref.replace(/^#\/(\$defs|definitions)\//, '');
            if (!seen.has(name) && defs[name]) { seen.add(name); walk(defs[name]); }
            return;
        }
        if (obj.properties) {
            n += Object.keys(obj.properties).length;
            for (const v of Object.values(obj.properties)) walk(v);
        }
        if (obj.items) walk(obj.items);
    }
    walk(schema);
    return n;
}