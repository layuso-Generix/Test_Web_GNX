function renderJsonMinimap(container, jsonText, errorLineNumbers, headerHtml) {
    const text = (jsonText || '').replace(/\u00a0/g,' ').trim();
    if (!text) { container.innerHTML = ''; return; }
    let formatted; try { formatted = JSON.stringify(JSON.parse(text), null, 2); } catch { formatted = text; }
    const lines = formatted.split('\n');
    const errorLines = new Set(Array.isArray(errorLineNumbers) ? errorLineNumbers : []);

    function jtype(tok, next){
        if (/^".*"$/.test(tok) && next === ':') return 'key';
        if (/^".*"$/.test(tok)) return 'string';
        if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(tok)) return 'number';
        if (/^(true|false)$/.test(tok)) return 'boolean';
        if (/^null$/.test(tok)) return 'null';
        if (/^[{}\[\],:]$/.test(tok)) return 'punctuation';
        return 'default';
    }
    function codeLine(line){
        const re=/"(?:\\.|[^"\\])*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null|[{}\[\],:]/g;
        const ms=[...line.matchAll(re)]; if(!ms.length) return esc(line);
        let html='', cur=0;
        ms.forEach((m,i)=>{ const t=m[0], s=m.index, e=s+t.length, n=ms[i+1]&&ms[i+1][0], ty=jtype(t,n);
            html+=esc(line.slice(cur,s))+`<span class="validator-json-${ty}">${esc(t)}</span>`; cur=e; });
        html+=esc(line.slice(cur)); return html;
    }
    function miniLine(line, isErr){
        const lead=(line.match(/^\s*/)||[''])[0].length, indent=Math.min(34, lead*2.3);
        const toks=line.trim().match(/"(?:\\.|[^"\\])*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null|[{}\[\],:]/g)||[];
        if(!toks.length) return `<span class="validator-minimap-token" style="margin-left:${indent}px;width:8px"></span>`;
        return toks.slice(0,14).map((t,i)=>{ const ty=isErr?'error':jtype(t,toks[i+1]); const w=Math.max(4,Math.min(32,t.length*2.1)); const ml=i===0?indent:0;
            return `<span class="validator-minimap-token validator-minimap-token--${ty}" style="margin-left:${ml}px;width:${w}px"></span>`; }).join('');
    }
    const rows=lines.map((l,i)=>`<div class="validator-line ${errorLines.has(i+1)?'is-error':''}" data-line="${i+1}"><div class="validator-line-number">${i+1}</div><div class="validator-line-code">${codeLine(l)}</div></div>`).join('');
    const mh=3, ch=Math.max(lines.length*mh, mh);
    const marks=lines.map((l,i)=>`<div class="validator-minimap-code-line ${errorLines.has(i+1)?'is-error':''}" data-line="${i+1}" style="top:${i*mh}px;height:${mh}px">${miniLine(l, errorLines.has(i+1))}</div>`).join('');

    container.innerHTML = `<div class="validator-code-shell"><div class="validator-code-panel">
        ${headerHtml ? `<div class="validator-code-header">${headerHtml}</div>` : ''}
        <div class="validator-code-body">
            <div class="validator-code-scroll"><div class="validator-code-content">${rows}</div></div>
            <div class="validator-code-minimap" aria-label="Minimapa del JSON">
                <div class="validator-code-minimap-content" style="height:${ch}px">${marks}</div>
                <div class="validator-minimap-viewport"></div>
            </div>
        </div></div></div>`;

    const scroll=container.querySelector('.validator-code-scroll'), minimap=container.querySelector('.validator-code-minimap'),
        mc=container.querySelector('.validator-code-minimap-content'), vp=container.querySelector('.validator-minimap-viewport');
    let drag=false, off=0;
    function syncVP(){
        const sh=scroll.scrollHeight, cl=scroll.clientHeight, ms=Math.max(sh-cl,1), ratio=scroll.scrollTop/ms,
            mmH=minimap.clientHeight, cH=mc.offsetHeight, maxOff=Math.max(cH-mmH,0), cOff=ratio*maxOff,
            vH=Math.min(mmH, Math.max((cl/sh)*mmH, 28)), maxT=Math.max(mmH-vH,0), vT=ratio*maxT;
        mc.style.transform=`translateY(${-cOff}px)`; vp.style.height=vH+'px'; vp.style.top=vT+'px';
    }
    function setScroll(cy, o){
        const r=minimap.getBoundingClientRect(), vH=vp.getBoundingClientRect().height, maxT=Math.max(r.height-vH,1),
            vT=Math.max(0, Math.min(maxT, cy-r.top-(o||0))), ratio=vT/maxT;
        scroll.scrollTop=ratio*(scroll.scrollHeight-scroll.clientHeight);
    }
    minimap.addEventListener('wheel', e=>{ e.preventDefault(); scroll.scrollTop += e.deltaY*1.2; }, {passive:false});
    minimap.addEventListener('pointerdown', e=>{ const vr=vp.getBoundingClientRect(), inside=e.clientY>=vr.top&&e.clientY<=vr.bottom;
        drag=true; off=inside?e.clientY-vr.top:vr.height/2; setScroll(e.clientY,off); minimap.setPointerCapture(e.pointerId); e.preventDefault(); });
    minimap.addEventListener('pointermove', e=>{ if(drag) setScroll(e.clientY,off); });
    function stop(e){ if(!drag) return; drag=false; try{minimap.releasePointerCapture(e.pointerId);}catch{} }
    minimap.addEventListener('pointerup', stop); minimap.addEventListener('pointercancel', stop);
    scroll.addEventListener('scroll', syncVP, {passive:true});
    requestAnimationFrame(syncVP);
}
