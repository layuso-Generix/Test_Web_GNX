import {SCHEMA_URL,EXAMPLES,exampleUrl} from "./config.mjs";
import {analyze} from "./modelo.mjs";
const id=k=>document.getElementById(k);
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
const norm=s=>String(s??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
function fillTable(headers,rows){
  const box=el("div",undefined,"spfe-scroll"),t=el("table",undefined,"spfe-table"),h=t.createTHead().insertRow();
  for(const col of headers){const c=el("th",col);c.scope="col";h.append(c);}
  const body=t.createTBody();
  for(const vals of rows){const r=body.insertRow();for(const v of vals){const c=r.insertCell();if(v instanceof Node)c.append(v);else c.textContent=v;}}
  box.append(t);return box;
}
function detail(title,fn,open=false) {
  const d=el("details",undefined,"spfe-panel");d.append(el("summary",title));
  let mounted=false;const populate=()=>{if(!mounted&&d.open){mounted=true;d.append(fn());}};
  d.addEventListener("toggle",populate);if(open){d.open=true;populate();}return d;
}
function activate(){
  const buttons=[...document.querySelectorAll("button[data-tab]")],key=location.hash.slice(1);
  const current=buttons.some(b=>b.dataset.tab===key)?key:"general";
  for(const b of buttons){const active=b.dataset.tab===current;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active));id(b.dataset.tab).classList.toggle("active",active);}
}
for(const b of document.querySelectorAll("button[data-tab]"))b.addEventListener("click",()=>{location.hash=b.dataset.tab;activate();});
window.addEventListener("hashchange",activate);activate();
for(const a of document.querySelectorAll("[data-schema-link]"))a.href=SCHEMA_URL;
async function getJSON(url){const r=await fetch(url,{cache:"no-cache"});if(!r.ok)throw Error("HTTP "+r.status);return r.json();}
function group(path){
  const s=path.replace(/^InvoiceGNX\.?/,"");if(!s)return "Documento";
  if(s.startsWith("FileHeader"))return "Cabecera del fichero";
  if(s.includes(".Parties."))return "Partes · "+s.split(".Parties.")[1].split(".")[0].replace("[]","");
  const p=s.split("Invoice[].")[1];return p?"Factura · "+p.split(".")[0].replace("[]",""):"Documento";
}
function fieldRow(f){
  const name=el("div");name.append(el("strong",f.path.split(".").at(-1)),el("small",f.path,"spfe-cell-path"));
  const constraints=el("div"),lines=[f.description,...f.limits].filter(Boolean);
  if(f.values)lines.push(f.values.length>24?"Catálogo de "+f.values.length+" códigos (véase Enumeraciones).":"Valores: "+f.values.map(v=>JSON.stringify(v)).join(", "));
  if(f.refs.length)lines.push("Definición: "+f.refs.join(", "));
  for(const s of lines)constraints.append(el("div",s));
  if(f.conditions.length){const d=el("details");d.append(el("summary","Ver condiciones"));const list=el("ul",undefined,"spfe-rules");
    for(const rule of new Set(f.conditions.map(c=>c.text)))list.append(el("li",rule));d.append(list);constraints.append(d);}
  let use=f.required?"Sí, si existe el padre":"Opcional";
  if(!f.required&&f.conditions.some(c=>c.mode==="present"||c.mode==="absent"))use="Según condición";
  else if(!f.required&&f.conditions.length)use="Opcional; valores condicionados";
  return [name,f.type,use,constraints];
}
async function startExplorer(){
  const [s,labels]=await Promise.all([getJSON(SCHEMA_URL),getJSON("Assets/spfe/significados.json").catch(()=>({}))]);const m=analyze(s);
  function showFields(){
    const query=norm(id("buscarCampo").value),groups=new Map();let count=0;
    for(const f of m.fields){if(query&&!norm(f.path+" "+f.description+" "+f.refs.join(" ")).includes(query))continue;
      const name=group(f.path);if(!groups.has(name))groups.set(name,[]);groups.get(name).push(f);count++;}
    id("resumenCampos").textContent=count+" de "+m.fields.length+" rutas. Abre un bloque para ver sus campos.";
    const cards=Array.from(groups,([name,fs])=>detail(name+" · "+fs.length,()=>fillTable(["Campo y ruta","Tipo","Obligatorio","Descripción y reglas"],fs.map(fieldRow)),!!query&&count<75));
    id("schemaBlocksContainer").replaceChildren(...(cards.length?cards:[el("p","No hay campos que coincidan con la búsqueda.")]));
  }
  function showEnums(){
    const q=norm(id("buscarEnum").value),cards=[];
    for(const c of m.catalogs){
      const paths=[...c.paths];const dict=labels[c.labels]||{};
      const matches=!q||norm(c.title+" "+paths.join(" ")).includes(q);
      const values=c.values.filter(v=>matches||norm(String(v)+" "+(dict[v]||"")).includes(q));
      if(!values.length)continue;
      cards.push(detail(c.title+" · "+values.length+(values.length!==c.values.length?" de "+c.values.length:"")+" valores",()=>{
        const wrap=el("div",undefined,"spfe-body");
        if(paths.length){const p=el("details");p.append(el("summary","Rutas JSON ("+paths.length+")"));for(const a of paths)p.append(el("small",a));wrap.append(p);}
        wrap.append(fillTable(["Código literal","Significado"],values.map(v=>[el("code",String(v)),dict[v]||"Sin descripción específica en el contrato."])));return wrap;
      },!!q&&values.length<=10));
    }
    id("resumenEnums").textContent=cards.length+" de "+m.catalogs.length+" catálogos o restricciones de valores.";
    id("enumsContainer").replaceChildren(...(cards.length?cards:[el("p","No hay códigos que coincidan con la búsqueda.")]));
  }
  showFields();showEnums();
  id("buscarCampo").addEventListener("input",showFields);id("buscarEnum").addEventListener("input",showEnums);
  const definitions=id("definiciones");
  definitions.append(detail("Condiciones y dependencias",()=>{const ul=el("ul",undefined,"spfe-body spfe-rules");for(const r of m.rules)ul.append(el("li",r.at+" · "+r.text));return ul;}));
  for(const [k,v] of [["Raíz (sin el catálogo de definiciones)",Object.fromEntries(Object.entries(s).filter(([n])=>n!=="definitions"))],...Object.entries(m.definitions)])
    definitions.append(detail(k,()=>el("pre",JSON.stringify(v,null,2),"spfe-code")));
}
startExplorer().catch(e=>{for(const k of ["schemaBlocksContainer","enumsContainer"])id(k).textContent="No se pudo mostrar el esquema GNX SPFE: "+e.message;});
const select=id("casoEjemplo");for(const [k,n] of EXAMPLES){const o=el("option",n);o.value=k;select.append(o);}
let request=0;async function showExample(){const seq=++request;const k=select.value,url=exampleUrl(k);id("notaEjemplo").textContent=EXAMPLES.find(e=>e[0]===k)[2];id("descargarEjemplo").href=url;id("examplesContainer").textContent="Cargando…";
  try{const data=await getJSON(url);if(seq===request)id("examplesContainer").textContent=JSON.stringify(data,null,2);}
  catch(e){if(seq===request)id("examplesContainer").textContent="No se pudo leer el ejemplo: "+e.message;}
}
select.addEventListener("change",showExample);showExample();
