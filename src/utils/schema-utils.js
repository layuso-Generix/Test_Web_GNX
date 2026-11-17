/* =========================================================
  schema-utils.js

  Utilidades compartidas para procesar schemas JSON.

  Estas funciones NO dependen de Invoice,
  Response, Status o Versions.
========================================================= */

function resolveRef(prop, definitions) {
  if (!prop || !prop.$ref) { return prop || {};}
  const name = prop.$ref.replace(/^#\/(\$defs|definitions)\//, '');
  return (definitions && definitions[name])
    ? definitions[name]
    : prop;
}
function resolvePointer(ref, schema) {
  if (!ref || !ref.startsWith('#/')) {return null;}
  return ref
    .slice(2)
    .split('/')
    .reduce((node, part) => node && node[part],schema) 
    || null;
}
function trimSchema(prop, trimEnums = true) {
  const clone = JSON.parse(JSON.stringify(prop));
  if (!trimEnums) {return clone;}
  const walk = obj => {
    if (!obj || typeof obj !== 'object') {return;}
    if (Array.isArray(obj.enum) && obj.enum.length > 12) {
      obj.enum = obj.enum
        .slice(0, 5)
        .concat([`... +${obj.enum.length - 5} values`]);
    }
    Object.values(obj).forEach(value => {if (value && typeof value === 'object') {walk(value);}});
  };
  walk(clone);
  return clone;
}

function extractEnums(schema) {
  const byName = new Map();            // nombre del enum → item
  const order = [];                    // orden de aparición

  const addUsage = (name, obj, path) => {
    if (!byName.has(name)) {
      const field = path ? path.split('.').pop().replace(/\[0\]$/, '') : name;
      byName.set(name, {
        field,
        path: [],
        type: obj.type || 'string',
        description: obj.description || '',
        values: obj.enum,
        default: obj.default,
        raw: obj,
        defName: name
      });
      order.push(name);
    }
    if (path) {
      const item = byName.get(name);
      if (!item.path.includes(path)) { item.path.push(path); }
    }
  };

  const walk = (obj, path, refName, visiting) => {
    if (!obj || typeof obj !== 'object') { return; }

    if (obj.$ref) {
      const name = obj.$ref.split('/').pop();
      if (visiting.has(name)) { return; }             // Tipo recursivo
      const resolved = resolvePointer(obj.$ref, schema);
      if (resolved) { walk(resolved, path, name, new Set([...visiting, name])); }
      return;
    }

    if (Array.isArray(obj.enum)) {
      const field = path.split('.').pop().replace(/\[0\]$/, '');
      addUsage(refName || field, obj, path);
      return;
    }

    ['allOf', 'anyOf', 'oneOf'].forEach((key) => {
      if (Array.isArray(obj[key])) {
        obj[key].forEach((sub) => walk(sub, path, refName, visiting));
      }
    });

    if (obj.properties) {
      Object.entries(obj.properties).forEach(([key, value]) => {
        walk(value, path ? `${path}.${key}` : key, null, visiting);
      });
    }

    if (obj.items) {
      // La raíz no puede llevar [0] sin nombre
      walk(obj.items, path ? `${path}[0]` : path, null, visiting);
    }
  };

  // 1. Rutas reales desde la raíz
  walk(schema, '', null, new Set());

  // 2. Enums definidos pero no alcanzados desde la raíz
  const defs = { ...(schema.definitions || {}), ...(schema.$defs || {}) };
  Object.entries(defs).forEach(([name, def]) => {
    if (def && Array.isArray(def.enum) && !byName.has(name)) {
      addUsage(name, def, '');
    }
  });

  return order.map((name) => byName.get(name));
}

function getFieldType(definition) {
  if (!definition) {return '';}
  if (definition.$ref) {
    return definition.$ref.split('/').pop();
  }
  let type = definition.type;
  if (Array.isArray(type)) {
    type = type.join(' | ');
  }
  if (type === 'array' && definition.items) {
    const itemType = definition.items.$ref
      ? definition.items.$ref.split('/').pop()
      : definition.items.type || '';
    return itemType
      ? `array<${itemType}>`
      : 'array';
  }
  if (!type && Array.isArray(definition.enum)) {
    return 'enum';
  }
  return type || '';
}

function getFieldConstraints(definition) {
  if (!definition) {return '';}
  const constraints = [];
  [
    'minLength',
    'maxLength',
    'minimum',
    'maximum',
    'minItems',
    'maxItems',
    'format',
    'pattern'
  ].forEach(key => {
    if (definition[key] != null) {
      constraints.push(`${key}: ${definition[key]}`);
    }
  });
  if (definition.default !== undefined) {
    constraints.push(`default: ${JSON.stringify(definition.default)}`);
  }
  return constraints;
}

/* =========================================================
  Export global
========================================================= */

window.SchemaUtils = {
  resolveRef,
  resolvePointer,
  trimSchema,
  extractEnums,
  getFieldType,
  getFieldConstraints
};