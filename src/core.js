/* Automata Atlas core: registry, router, passport (progress), shared widgets */
"use strict";
const SVGNS = "http://www.w3.org/2000/svg";
const EPS = "ε";
function svg(tag, attrs, parent, text){ const e=document.createElementNS(SVGNS,tag); for(const k in attrs) e.setAttribute(k,attrs[k]); if(text!=null) e.textContent=text; if(parent) parent.appendChild(e); return e; }
function h(tag, cls, html){ const e=document.createElement(tag); if(cls) e.className=cls; if(html!=null) e.innerHTML=html; return e; }
function esc(s){ return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }
const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const Atlas = {
  stations: {}, order: [], cleanups: [],
  register(def){ this.stations[def.id]=def; this.order.push(def.id); },
  /* ---- passport ---- */
  _load(){ try{ return JSON.parse(localStorage.getItem("atlas.passport")||"{}"); }catch(e){ return {}; } },
  _mem: null,
  passport(){ if(!this._mem) this._mem=this._load(); return this._mem; },
  has(st, id){ const p=this.passport(); return !!(p[st] && p[st][id]); },
  stamp(st, id){
    if(this.has(st,id)) return false;
    const p=this.passport(); (p[st]=p[st]||{})[id]=1;
    try{ localStorage.setItem("atlas.passport", JSON.stringify(p)); }catch(e){}
    const def=this.stations[st]; const s=def && def.stamps.find(x=>x.id===id);
    if(s) this.toast("Passport stamp: "+s.label); this.refreshBar();
    document.querySelectorAll(`.stp[data-st="${st}"][data-id="${id}"]`).forEach(e=>e.classList.add("on"));
    return true;
  },
  count(st){ const def=this.stations[st]; if(!def||!def.stamps) return [0,0]; return [def.stamps.filter(s=>this.has(st,s.id)).length, def.stamps.length]; },
  totals(){ let a=0,b=0; this.order.forEach(id=>{ const [x,y]=this.count(id); a+=x; b+=y; }); return [a,b]; },
  toast(msg){ const t=document.getElementById("toast"); if(!t) return; t.textContent=msg; t.classList.add("show"); clearTimeout(this._tt); this._tt=setTimeout(()=>t.classList.remove("show"),2600); },
  refreshBar(){ const [a,b]=this.totals(); const pill=document.getElementById("passPill"); if(pill) pill.innerHTML=`Passport <b>${a}/${b}</b><span class="meter"><i style="width:${b?100*a/b:0}%"></i></span>`; },
  stampRow(st){ const def=this.stations[st]; const row=h("div","stamps"); def.stamps.forEach(s=>{ const e=h("span","stp"+(this.has(st,s.id)?" on":""),"◉ "+esc(s.label)); e.dataset.st=st; e.dataset.id=s.id; row.appendChild(e); }); return row; },
  /* ---- router ---- */
  go(id){ if(location.hash.slice(1)===id) this.route(); else location.hash=id; },
  onCleanup(fn){ this.cleanups.push(fn); },
  route(){
    this.cleanups.splice(0).forEach(fn=>{ try{ fn(); }catch(e){} });
    const id=location.hash.slice(1); const view=document.getElementById("view"); view.innerHTML="";
    const def=this.stations[id];
    if(def && def.mount){ this.mountStation(def, view); } else { Home.mount(view); }
    window.scrollTo(0,0); this.refreshBar();
  },
  mountStation(def, view){
    const built=this.order.filter(i=>this.stations[i].mount); const k=built.indexOf(def.id);
    const crumb=h("div","crumb"); const back=h("button",null,"← Atlas"); back.type="button"; back.onclick=()=>this.go("home"); crumb.appendChild(back);
    crumb.appendChild(h("span",null,"· "+esc(def.region)+" · "+esc(def.sessions)));
    view.appendChild(crumb);
    const head=h("header","st-head",`<div class="eyebrow">${esc(def.module)}</div><h1>${esc(def.title)}</h1><p class="sub">${esc(def.blurb)}</p>`);
    view.appendChild(head); view.appendChild(this.stampRow(def.id));
    const body=h("div","view"); view.appendChild(body);
    def.mount(body);
    const np=h("div","nextprev");
    const mk=(i,lbl)=>{ const b=h("button","btn",lbl); b.type="button"; b.onclick=()=>this.go(i); return b; };
    np.appendChild(k>0 ? mk(built[k-1],"← "+esc(this.stations[built[k-1]].title)) : mk("home","← Atlas"));
    np.appendChild(k<built.length-1 ? mk(built[k+1],esc(this.stations[built[k+1]].title)+" →") : mk("home","Back to the atlas →"));
    view.appendChild(np);
  }
};

/* ---- section helper: a titled block ---- */
function block(parent, kicker, title, id){ const b=h("section","blk"); if(id) b.id="blk-"+id; b.appendChild(h("div","kicker",esc(kicker))); b.appendChild(h("h2",null,esc(title))); parent.appendChild(b); return b; }

/* ---- quick-fire: "A student claims ..." (her midterm format) ---- */
function quickFire(parent, items, onAll){
  const grid=h("div","qf"); parent.appendChild(grid); let answered=0, correct=0;
  items.forEach(it=>{
    const c=h("div","qf-card"); c.appendChild(h("div","who","A student claims"));
    c.appendChild(h("p","claim",it.claim));
    const row=h("div","row"); const b1=h("button","btn","That is right"), b2=h("button","btn","That is wrong"); b1.type=b2.type="button";
    row.appendChild(b1); row.appendChild(b2); c.appendChild(row);
    const done=(saidRight)=>{ if(c.dataset.done) return; c.dataset.done=1; b1.disabled=b2.disabled=true; const ok=saidRight===it.ok;
      c.classList.add(ok?"right":"wrong"); answered++; if(ok) correct++;
      c.appendChild(h("div","res",(ok?"Correct. ":"Not quite. ")+"The claim is "+(it.ok?"true.":"false.")));
      c.appendChild(h("p","why",it.why));
      if(answered===items.length && onAll) onAll(correct, items.length); };
    b1.onclick=()=>done(true); b2.onclick=()=>done(false);
    grid.appendChild(c);
  });
}

/* ---- finite-automaton diagram (states in a row; her drawing conventions) ---- */
// M: {states:[], start, accept:[], edges:[{from,to,label}]}  -> handle {setState(s,cls), edge(from,to)}
function drawFA(box, M, opts){
  opts=opts||{}; box.innerHTML="";
  const s=svg("svg",{role:"img","aria-label":"State diagram"}); box.appendChild(s);
  const uid="m"+Math.random().toString(36).slice(2,8);
  const defs=svg("defs",{},s);
  [["a","var(--faint)"],["b","var(--now)"]].forEach(([k,c])=>{ const mk=svg("marker",{id:uid+k,viewBox:"0 0 10 10",refX:"9",refY:"5",markerWidth:"11",markerHeight:"11",markerUnits:"userSpaceOnUse",orient:"auto-start-reverse"},defs); svg("path",{d:"M0,0 L10,5 L0,10 z",style:`fill:${c}`},mk); });
  const R0=28, n=M.states.length, GAP=n>4?150:(n>3?170:200);
  const pos={}; M.states.forEach((q,i)=>pos[q]={x:i*GAP,y:0});
  const groups=new Map();
  M.edges.forEach(e=>{ if(pos[e.from]===undefined||pos[e.to]===undefined) return; const k=e.from+"→"+e.to; if(!groups.has(k)) groups.set(k,[]); groups.get(k).push(e.label); });
  const bb={x0:-78,x1:(n-1)*GAP+44,y0:-44,y1:44}; const grow=(x,y)=>{bb.x0=Math.min(bb.x0,x);bb.x1=Math.max(bb.x1,x);bb.y0=Math.min(bb.y0,y);bb.y1=Math.max(bb.y1,y);};
  const eL=svg("g",{},s), lL=svg("g",{},s), sL=svg("g",{},s); const edges={}, labels={};
  for(const [k,ls] of groups){
    const [a,b]=k.split("→"); const A=pos[a], B=pos[b]; let d, lx, ly;
    const txt=ls.join(", ");
    if(a===b){ d=`M${A.x-13},${A.y-25} C${A.x-42},${A.y-92} ${A.x+42},${A.y-92} ${A.x+13},${A.y-25}`; lx=A.x; ly=A.y-82; }
    else{
      const ia=M.states.indexOf(a), ib=M.states.indexOf(b), fwd=ib>ia, span=Math.abs(ib-ia), rev=groups.has(b+"→"+a);
      const bend = fwd ? (span===1 ? (rev?-30:0) : -44-34*span) : (span===1 ? 30 : 44+34*span);
      const mx=(A.x+B.x)/2, cy=A.y+bend*2;
      const u=(px,py,qx,qy)=>{const dx=qx-px,dy=qy-py,L=Math.hypot(dx,dy)||1;return [dx/L,dy/L];};
      const [ux,uy]=u(A.x,A.y,mx,bend===0?A.y:cy), [vx,vy]=u(B.x,B.y,mx,bend===0?B.y:cy);
      const sx=A.x+ux*R0, sy=A.y+uy*R0, ex=B.x+vx*(R0+3), ey=B.y+vy*(R0+3);
      d = bend===0 ? `M${sx},${sy} L${ex},${ey}` : `M${sx},${sy} Q${mx},${cy} ${ex},${ey}`;
      lx=mx; ly = bend===0 ? A.y-10 : A.y+bend+(bend<0?-8:20);
    }
    edges[k]=svg("path",{d,class:"edge","marker-end":`url(#${uid}a)`},eL);
    const w=txt.length*8.3+12;
    const bg=svg("rect",{x:lx-w/2,y:ly-14,width:w,height:18,rx:5,class:"elabel-bg"},lL);
    const tx=svg("text",{x:lx,y:ly,"text-anchor":"middle",class:"elabel"},lL,txt);
    labels[k]={bg,tx}; grow(lx-w/2,ly-18); grow(lx+w/2,ly+8);
  }
  const S=pos[M.start];
  if(S){ svg("path",{d:`M${S.x-74},${S.y} L${S.x-R0-3},${S.y}`,class:"edge","marker-end":`url(#${uid}a)`},eL); svg("text",{x:S.x-74,y:S.y-8,class:"startlbl"},lL,"start"); }
  const sts={};
  M.states.forEach(q=>{ const P=pos[q]; const g=svg("g",{class:"st"},sL);
    svg("circle",{cx:P.x,cy:P.y,r:R0,class:"halo"},g); svg("circle",{cx:P.x,cy:P.y,r:R0,class:"st-circle"},g);
    if(M.accept.includes(q)) svg("circle",{cx:P.x,cy:P.y,r:R0-5,class:"st-ring"},g);
    const m=/^([^\d]+)(\d+)$/.exec(q); const tx=svg("text",{x:P.x,y:P.y+6,"text-anchor":"middle",class:"st-text"},g);
    if(q.length>4) tx.setAttribute("style","font-size:12px");
    if(m && q.length<=4){ svg("tspan",{},tx,m[1]); svg("tspan",{dy:"4","font-size":"12"},tx,m[2]); } else tx.textContent=q;
    sts[q]=g; });
  const pad=14, W=bb.x1-bb.x0+pad*2, H=bb.y1-bb.y0+pad*2;
  s.setAttribute("viewBox",`${bb.x0-pad} ${bb.y0-pad} ${W} ${H}`); s.setAttribute("width",W); s.style.maxHeight=(opts.maxH||260)+"px";
  const token=svg("circle",{r:7,class:"token",opacity:0},s);
  return {
    setStates(qs, cls){ Object.entries(sts).forEach(([q,g])=>{ g.classList.remove("cur","done-acc","done-rej"); if(qs.includes(q)) g.classList.add(cls||"cur"); }); },
    edgesOn(pairs){ Object.entries(edges).forEach(([k,p])=>{ const on=pairs.includes(k); p.classList.toggle("on",on); p.setAttribute("marker-end",`url(#${uid}${on?"b":"a"})`); labels[k].tx.classList.toggle("on",on); labels[k].bg.classList.toggle("on",on); }); },
    setState(q, cls){ Object.values(sts).forEach(g=>g.classList.remove("cur","done-acc","done-rej")); if(sts[q]) sts[q].classList.add(cls||"cur"); },
    edge(from,to,animate){ Object.entries(edges).forEach(([k,p])=>{ p.classList.remove("on"); p.setAttribute("marker-end",`url(#${uid}a)`); labels[k].tx.classList.remove("on"); labels[k].bg.classList.remove("on"); });
      const k=from+"→"+to, p=edges[k]; if(!p) return; p.classList.add("on"); p.setAttribute("marker-end",`url(#${uid}b)`); labels[k].tx.classList.add("on"); labels[k].bg.classList.add("on");
      if(animate && !reduceMotion){ const L=p.getTotalLength(), t0=performance.now(); token.setAttribute("opacity",1);
        (function f(now){ const kk=Math.min(1,(now-t0)/420); const pt=p.getPointAtLength(kk*L); token.setAttribute("cx",pt.x); token.setAttribute("cy",pt.y); if(kk<1) requestAnimationFrame(f); else token.setAttribute("opacity",0); })(t0); } },
    clearEdge(){ this.edge("",""); }
  };
}

/* ---- DFA utilities ---- */
// D: {states, sigma, start, accept, delta:{q:{a:q'}}}
function dfaEdges(D){ const out=[]; D.states.forEach(q=>D.sigma.forEach(a=>{ const t=D.delta[q] && D.delta[q][a]; if(t) out.push({from:q,to:t,label:a}); })); return out; }
function dfaRun(D, w){ const seq=[D.start]; let q=D.start; for(const c of w){ q = D.delta[q] ? D.delta[q][c] : undefined; if(q===undefined){ seq.push(null); break; } seq.push(q); } return seq; }
function dfaAccepts(D, w){ const seq=dfaRun(D,w); const last=seq[seq.length-1]; return last!==null && seq.length===[...w].length+1 && D.accept.includes(last); }
function allStrings(sigma, maxLen){ const out=[""]; let layer=[""]; for(let L=1;L<=maxLen;L++){ const nx=[]; layer.forEach(s=>sigma.forEach(a=>nx.push(s+a))); out.push(...nx); layer=nx; } return out; }
function dfaMinSize(D){ // reachable states, then partition refinement (Session 3)
  const reach=new Set([D.start]); const st=[D.start]; while(st.length){ const q=st.pop(); D.sigma.forEach(a=>{ const t=D.delta[q][a]; if(!reach.has(t)){ reach.add(t); st.push(t); } }); }
  const R=[...reach]; let part=new Map(); R.forEach(q=>part.set(q, D.accept.includes(q)?1:0));
  for(;;){ const sig=new Map(); const ids=new Map(); R.forEach(q=>{ const k=part.get(q)+"|"+D.sigma.map(a=>part.get(D.delta[q][a])).join(","); if(!ids.has(k)) ids.set(k,ids.size); sig.set(q,ids.get(k)); });
    const before=new Set(part.values()).size; part=sig; if(ids.size===before) return {min:ids.size, reachable:R.length}; }
}

/* ---- a runner: tape + diagram + state sequence, for any DFA ---- */
function faRunner(parent, D, opts){
  opts=opts||{}; const wrap=h("div","panel run"); parent.appendChild(wrap);
  const top=h("div","controls"); wrap.appendChild(top);
  const ib=h("div","inputbox"); const uid="in"+Math.random().toString(36).slice(2,7);
  ib.innerHTML=`<label for="${uid}">Input w</label><input id="${uid}" autocomplete="off" spellcheck="false" maxlength="14">`; top.appendChild(ib);
  const inp=ib.querySelector("input"); inp.value=opts.input||"";
  const exs=h("div","examples"); top.appendChild(exs);
  (opts.examples||[]).forEach(w=>{ const ok=dfaAccepts(D,w); const b=h("button","ex",`${esc(w||EPS)}<small class="${ok?"y":"n"}">${ok?"✓":"✗"}</small>`); b.type="button"; b.onclick=()=>{ inp.value=w; reset(); play(); }; exs.appendChild(b); });
  const tr=h("div","transport"); top.appendChild(tr);
  const mk=(lbl,path,cls)=>{ const b=h("button","ibtn"+(cls?" "+cls:""),`<svg viewBox="0 0 24 24" fill="currentColor"><path d="${path}"/></svg>`); b.type="button"; b.setAttribute("aria-label",lbl); b.title=lbl; tr.appendChild(b); return b; };
  const bR=mk("Back to the start","M6 5h2v14H6zM20 5v14L9 12z"), bB=mk("One symbol back","M18 5v14L7 12z"), bP=mk("Play","M7 4v16l13-8z","play"), bS=mk("Read one symbol","M6 5v14l11-7z");
  const tape=h("div","tape"); wrap.appendChild(tape);
  const dia=h("div","diagram"); wrap.appendChild(dia);
  const seqEl=h("div","seq"); wrap.appendChild(seqEl);
  const narr=h("div","narr"); narr.innerHTML=`<span class="step">start</span><p></p>`; wrap.appendChild(narr);
  const handle=drawFA(dia,{states:D.states,start:D.start,accept:D.accept,edges:dfaEdges(D)});
  let w="", seq=[], t=0, timer=null;
  function reset(){ stop(); w=inp.value.replace(/\s+/g,""); seq=dfaRun(D,w); t=0; render(false); }
  function render(anim){
    const chars=[...w]; tape.innerHTML="";
    chars.forEach((c,i)=>tape.appendChild(h("div","cell"+(i<t?" read":"")+(i===t?" head":""),esc(c))));
    tape.appendChild(h("div","cell end"+(t>=chars.length?" head":""),"end"));
    const last = t===seq.length-1; const q=seq[t]; const stuck = q===null;
    const acc = last && !stuck && seq.length===chars.length+1 && D.accept.includes(q);
    if(stuck){ handle.setState(seq[t-1],"done-rej"); handle.clearEdge(); }
    else { handle.setState(q, last ? (acc?"done-acc":"done-rej") : "cur"); if(t>0) handle.edge(seq[t-1],q,anim); else handle.clearEdge(); }
    seqEl.innerHTML=""; seq.slice(0,t+1).forEach((s,i)=>{ if(i>0) seqEl.appendChild(h("em",null,"—"+esc(chars[i-1])+"→")); seqEl.appendChild(h("span", i===t ? (last?(acc?"acc":"rej"):"cur") : "", s===null?"no arrow":esc(s))); });
    const st=narr.querySelector(".step"), p=narr.querySelector("p");
    if(t===0 && !last){ st.textContent="start"; p.innerHTML=`Start in <b>${esc(D.start)}</b>. Nothing has been read yet.`; }
    else if(stuck){ st.textContent="stuck"; p.innerHTML=`There is no arrow for <b>${esc(chars[t-1])}</b> out of ${esc(seq[t-1])}. A missing arrow does not mean reject: this is not a DFA yet.`; }
    else { st.textContent = t===0 ? "start" : "δ"; let txt = t===0 ? `The input is ε, so the machine never leaves <b>${esc(D.start)}</b>.` : `δ(${esc(seq[t-1])}, ${esc(chars[t-1])}) = <b>${esc(q)}</b>` + (D.facts && D.facts[q] ? `<span class="why">${esc(q)}: ${esc(D.facts[q])}</span>` : "");
      if(last) txt += `<span class="why" style="color:var(--ink);font-weight:600">Input exhausted in ${esc(q)}, which is ${acc?"":"not "}in F: ${acc?"ACCEPT":"REJECT"}. Only the last state matters.</span>`;
      p.innerHTML=txt; }
    bB.disabled=bR.disabled=t===0; bS.disabled=last;
    if(last && opts.onEnd) opts.onEnd(acc, w);
  }
  function step(){ if(t<seq.length-1){ t++; render(true); } }
  function play(){ if(timer) return; if(t>=seq.length-1){ t=0; render(false); } timer=setInterval(()=>{ step(); if(t>=seq.length-1) stop(); },850); }
  function stop(){ clearInterval(timer); timer=null; }
  bS.onclick=()=>{ stop(); step(); }; bB.onclick=()=>{ stop(); if(t>0){ t--; render(false); } }; bR.onclick=()=>{ stop(); t=0; render(false); }; bP.onclick=()=> timer?stop():play();
  inp.addEventListener("input",reset); inp.addEventListener("keydown",e=>{ if(e.key==="Enter"){ reset(); play(); } });
  Atlas.onCleanup(stop);
  reset();
  return {setInput(v){ inp.value=v; reset(); }, play, el:wrap};
}

/* ---- minimisation helpers (Session 3) ---- */
function dfaReachable(D){ const seen=[D.start]; for(let i=0;i<seen.length;i++) D.sigma.forEach(a=>{ const t=D.delta[seen[i]][a]; if(!seen.includes(t)) seen.push(t); }); return D.states.filter(q=>seen.includes(q)); }
// rounds[k] = {blocks:[[states]], sig:{q:[block index per symbol]}}; the last round splits nothing
function dfaRefine(D){ const R=dfaReachable(D); let blocks=[R.filter(q=>D.accept.includes(q)),R.filter(q=>!D.accept.includes(q))].filter(b=>b.length); const rounds=[];
  for(;;){ const idx={}; blocks.forEach((b,i)=>b.forEach(q=>idx[q]=i)); const sig={}; R.forEach(q=>sig[q]=D.sigma.map(a=>idx[D.delta[q][a]]));
    const next=[]; blocks.forEach(b=>{ const groups=new Map(); b.forEach(q=>{ const k=sig[q].join(","); if(!groups.has(k)) groups.set(k,[]); groups.get(k).push(q); }); groups.forEach(g=>next.push(g)); });
    rounds.push({blocks,sig,splits:blocks.map(b=>new Set(b.map(q=>sig[q].join(","))).size>1)});
    if(next.length===blocks.length) return {reachable:R,rounds}; blocks=next; } }
// table filling: witness[p|q] = shortest distinguishing string, undefined if equivalent
function dfaWitness(D){ const R=dfaReachable(D); const w={}; const key=(p,q)=>R.indexOf(p)<R.indexOf(q)?p+"|"+q:q+"|"+p; const pass={};
  for(let i=0;i<R.length;i++) for(let j=i+1;j<R.length;j++) if(D.accept.includes(R[i])!==D.accept.includes(R[j])){ w[key(R[i],R[j])]=""; pass[key(R[i],R[j])]=0; }
  for(let n=1;;n++){ const add={}; for(let i=0;i<R.length;i++) for(let j=i+1;j<R.length;j++){ const k=key(R[i],R[j]); if(w[k]!==undefined) continue;
      for(const a of D.sigma){ const x=D.delta[R[i]][a], y=D.delta[R[j]][a]; if(x!==y && w[key(x,y)]!==undefined){ add[k]=a+w[key(x,y)]; break; } } }
    if(!Object.keys(add).length) return {R,w,pass,key}; Object.keys(add).forEach(k=>{ w[k]=add[k]; pass[k]=n; }); } }
/* ---- NFA helpers (Session 4) ---- */
// N: {states, sigma, start, accept, delta:{q:{a:[...]}}}
function nfaMove(N,S,a){ const out=[]; S.forEach(q=>((N.delta[q]||{})[a]||[]).forEach(t=>{ if(!out.includes(t)) out.push(t); })); return N.states.filter(q=>out.includes(q)); }
function nfaEdges(N){ const out=[]; N.states.forEach(q=>N.sigma.forEach(a=>((N.delta[q]||{})[a]||[]).forEach(t=>out.push({from:q,to:t,label:a})))); return out; }
const setName = S => S.length ? "{"+S.join(", ")+"}" : "∅";
function subsetConstruct(N){ const start=[N.start]; const list=[start]; const rows=[]; for(let i=0;i<list.length;i++){ const S=list[i]; const row={S,to:{}}; N.sigma.forEach(a=>{ const T=nfaMove(N,S,a); row.to[a]=T; if(!list.some(x=>setName(x)===setName(T))) list.push(T); }); rows.push(row); } return rows; }
