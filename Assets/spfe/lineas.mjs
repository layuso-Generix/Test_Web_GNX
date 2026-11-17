// El texto procede de JSON.stringify(datos, null, 2). Conservar la ruta completa
// evita señalar la primera clave homónima cuando hay varias facturas o líneas.
export function indexJsonLines(lines) {
  const index=new Map(),stack=[];
  lines.forEach((line,i)=>{
    const t=line.trim();if(!t)return;
    if(/^[}\]]/.test(t)){stack.pop();return;}
    const parent=stack.at(-1),m=t.match(/^("(?:\\.|[^"\\])*")\s*:/);
    const key=m?JSON.parse(m[1]):parent?.array?String(parent.next++):null;
    const path=key===null?(parent?.path||[]):[...(parent?.path||[]),key];
    index.set(JSON.stringify(path),i+1);
    if(t.endsWith("{")||t.endsWith("["))stack.push({path,array:t.endsWith("["),next:0});
  });return index;
}
export function lineForPath(path,index) {
  if(!path||path[0]!=="$")return null;
  const keys=[],token=/\.([A-Za-z_$][\w$]*)|\[(\d+)\]|\[("(?:\\.|[^"\\])*")\]/gy;
  let end=1;
  while(end<path.length){token.lastIndex=end;const m=token.exec(path);if(!m)return null;keys.push(m[1]??m[2]??JSON.parse(m[3]));end=token.lastIndex;}
  // Una propiedad obligatoria ausente no tiene línea: señalar su objeto padre.
  while(keys.length&&!index.has(JSON.stringify(keys)))keys.pop();
  return index.get(JSON.stringify(keys))??null;
}
