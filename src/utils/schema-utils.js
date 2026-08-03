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
  const results = [];
  const seen = new Set();
  const walk = (obj, path, refName) => {
    if (!obj || typeof obj !== 'object') {return;}
    if (obj.$ref) {
      const resolved = resolvePointer(obj.$ref, schema);
      if (resolved) {walk(resolved, path, obj.$ref.split('/').pop());}
      return;
    }
    if (Array.isArray(obj.enum)) {
      const key = path.split('.').pop().replace('[]', '');
      if (!seen.has(path)) {
        seen.add(path);
        results.push({
          field: key,
          path,
          type: obj.type || 'string',
          description: obj.description || '',
          values: obj.enum,
          default: obj.default,
          raw: obj,
          defName: refName || key
        });
      }
      return;
    }
    if (obj.properties) {
      Object.entries(obj.properties)
        .forEach(([key, value]) => {
          walk(value, path
            ? `${path}.${key}`
            : key
          );
        });
    }
    if (obj.items) {walk(obj.items, `${path}[]`);}
    if (obj.$defs) {
      Object.entries(obj.$defs)
        .forEach(([key, value]) => {
          walk(value, key);
        });
    }
    if (obj.definitions) {
      Object.entries(obj.definitions)
        .forEach(([key, value]) => {
          walk(value, key);
        });
    }
  };
  walk(schema, '');
  return results;
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