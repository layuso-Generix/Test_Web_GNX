// Lee Draft-07 sin convertir las alternativas ni las condiciones en obligaciones globales.
const map = () => new Map();
const fieldPath = (a,b) => a ? a+"."+b : b;
const literal = x => JSON.stringify(x);
const asList = x => Object.hasOwn(x,"const") ? [x.const] : x.enum;
const typeName = {object:"Objeto",array:"Lista",string:"Texto",number:"Número",integer:"Entero",boolean:"Booleano"};
function deref(s,ref) {
  if (!ref.startsWith("#/")) throw Error("Referencia no local: "+ref);
  return ref.slice(2).split("/").reduce((n,k)=>n[k.replace(/~1/g,"/").replace(/~0/g,"~")],s);
}
function pieces(s,node) {
  if (node.$ref) return pieces(s,deref(s,node.$ref));
  return [node,...(node.allOf||[]).flatMap(x=>pieces(s,x))];
}
const forbid = n => (n.not?.anyOf||[]).flatMap(b=>b.required?.length===1?b.required:[]);
function effects(n,p="",out=[]) {
  const add=(path,mode,value)=>out.push({path,mode,value});
  for(const k of n.required||[])add(fieldPath(p,k),"present");
  for(const k of forbid(n))add(fieldPath(p,k),"absent");
  if(asList(n))add(p,"codes",asList(n));
  for(const [k,v] of Object.entries(n.properties||{}))effects(v,fieldPath(p,k),out);
  if(n.items)effects(n.items,p+"[]",out);
  if(n.anyOf){const alternatives=n.anyOf.map(b=>effects(b,p));add(p,"oneOrMore",alternatives);}
  return out;
}
function say(e,base="") {
  const name=e.path.slice(base?base.length+1:0)||e.path||"el bloque";
  if(e.mode==="codes")return name+" ∈ "+e.value.map(literal).join(", ");
  if(e.mode==="oneOrMore")return "al menos una alternativa: "+e.value.map(a=>a.map(x=>say(x,base)).join(" y ")).join(" o ");
  return (e.mode==="absent"?"omitir ":"informar ")+name;
}
function condition(n) {
  if(n.not)return "no se cumple («"+condition(n.not)+"»)";
  const a=[];
  function walk(v,p) {
    if(asList(v))a.push(p+" = "+asList(v).map(literal).join(" o "));
    if(v.not && asList(v.not))a.push(p+" ≠ "+asList(v.not).map(literal).join(", "));
    for(const k of v.required||[])if(!v.properties?.[k])a.push("se informa "+fieldPath(p,k));
    for(const [k,c] of Object.entries(v.properties||{}))walk(c,fieldPath(p,k));
  }
  walk(n,"");return a.join(" y ")||JSON.stringify(n);
}
export function analyze(schema) {
  const fields=[],rules=[],catalogs=map(),affected=map();
  function catalog(key,title,vals,labels,usage) {
    if(!catalogs.has(key))catalogs.set(key,{key,title,values:vals,labels,paths:new Set()});
    if(usage)catalogs.get(key).paths.add(usage);
  }
  const defs=schema.definitions||{};
  for(const [k,v] of Object.entries(defs.Enums||{}))if(asList(v))catalog("base:"+k,k,asList(v),k);
  function visit(roots,path,required) {
    const ns=roots.flatMap(n=>pieces(schema,n));
    const refs=roots.flatMap(n=>[...(n.$ref?[n.$ref]:[]),...(n.allOf||[]).flatMap(c=>c.$ref?[c.$ref]:[])]);
    const req=new Set(ns.flatMap(n=>n.required||[])),blocked=new Set(ns.flatMap(forbid));
    const props=map(),items=[],limits=[];
    let vals,ty="",desc="";
    for(const n of ns) {
      ty ||= n.type||"";desc ||= n.description||"";
      if(asList(n)){const v=asList(n);vals=vals?vals.filter(x=>v.includes(x)):v;}
      if(n.items)items.push(n.items);
      for(const [k,v] of Object.entries(n.properties||{})){if(!props.has(k))props.set(k,[]);props.get(k).push(v);}
      for(const [k,l] of Object.entries({minItems:"Mín. elementos",maxItems:"Máx. elementos",format:"Formato",pattern:"Patrón",multipleOf:"Múltiplo de",minimum:"Mínimo",maximum:"Máximo",exclusiveMinimum:"Mayor que",exclusiveMaximum:"Menor que",minLength:"Longitud mínima",maxLength:"Longitud máxima"}))if(k in n)limits.push(l+": "+n[k]);
      if(n.anyOf)limits.push("Alternativas: "+n.anyOf.map(v=>[v.format||v.type||"",v.pattern||""].filter(Boolean).join(" " )||JSON.stringify(v)).join(" | "));
      function addRule(test,body,alt=false) {
        const es=effects(body,path);
        const text=(alt?"Si no se cumple «":"Si «")+test+"»: "+es.map(e=>say(e,path)).join("; ")+".";
        rules.push({at:path,text});
        function mark(e){
          if(e.mode==="oneOrMore"){e.value.flat().forEach(mark);return;}
          if(!affected.has(e.path))affected.set(e.path,[]);
          affected.get(e.path).push({mode:e.mode,text});
          if(e.mode==="codes"){
            const f=e.path.split(".").at(-1),tax=test.match(/TaxTypeCode = "(IVA|IGIC|IPSI)"/);
            catalog("rule:"+e.path+test,f+" · "+test,e.value,tax?.[1]||(f==="InvoiceDocumentType"?"InvoiceDocumentTypeEnum":f),e.path);
          }
        }
        es.forEach(mark);
      }
      if(n.if&&n.then)addRule(condition(n.if),n.then);
      if(n.if&&n.else)addRule(condition(n.if),n.else,true);
      for(const [key,dep] of Object.entries(n.dependencies||{}))if(Array.isArray(dep))addRule("se informa "+key,{required:dep});
    }
    const fname=path.split(".").at(-1);
    if(vals&&path) {
      const enumRef=refs.find(r=>r.includes("/Enums/"))?.split("/").at(-1);
      const key=enumRef&&vals.length===defs.Enums[enumRef].enum.length?"base:"+enumRef:"field:"+fname+":"+JSON.stringify(vals);
      const label=enumRef||(fname==="TaxTypeCode"?"TaxTypeCodeEnum":fname);
      catalog(key,enumRef&&key.startsWith("base:")?enumRef:fname,vals,label,path);
      if(key!==("base:"+enumRef)&&enumRef)catalogs.get("base:"+enumRef)?.paths.add(path+" (subconjunto)");
    }
    if(path)fields.push({path,required,description:desc,type:typeName[ty]||ty||(ns.some(n=>n.anyOf)?"Alternativas":"—"),limits:[...new Set(limits)],values:vals,refs:refs.map(r=>r.split("/").at(-1))});
    for(const [k,v] of props)if(!blocked.has(k))visit(v,fieldPath(path,k),req.has(k));
    if(items.length){
      // Los elementos de una lista no son una propiedad JSON adicional.
      const before=fields.length;visit(items,path+"[]",false);
      if(fields[before]?.path===path+"[]")fields.splice(before,1);
    }
  }
  visit([schema],"",true);
  for(const f of fields)f.conditions=affected.get(f.path)||[];
  return {fields,rules,catalogs:[...catalogs.values()],definitions:defs};
}
