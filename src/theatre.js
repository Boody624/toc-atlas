
(function(){
"use strict";
const EPS = "ε";

/* ---------- machines from the S20 slides ---------- */
// Rule fields: from, read ('' = ε), pop (a symbol, or '*' meaning "any stack symbol X"), push (top-first string, '*' = that same symbol), to, note
const PRESETS = [
  { id:"anbn", tab:"aⁿbⁿ", tabSub:"counter", lang:"L = { aⁿbⁿ : n ≥ 1 }",
    idea:"The stack is a unary counter: one X per a, and the bottom marker Z tells the machine the count is back to zero. The switch to popping happens on the first b, which is visible, so nothing is guessed.",
    states:["q0","q1","q2"], start:"q0", bottom:"Z", accept:["q2"], mode:"final",
    rules:[
      {from:"q0",read:"a",pop:"Z",push:"XZ",to:"q0",note:"first a: push X on top of Z"},
      {from:"q0",read:"a",pop:"X",push:"XX",to:"q0",note:"later a's: one more X each"},
      {from:"q0",read:"b",pop:"X",push:"",to:"q1",note:"first b: switch to popping"},
      {from:"q1",read:"b",pop:"X",push:"",to:"q1",note:"each b cancels one a"},
      {from:"q1",read:"",pop:"Z",push:"Z",to:"q2",note:"Z on top means the counts matched"}],
    examples:["aabb","aaabbb","aab","abab"], def:"aabb" },
  { id:"anb2n", tab:"aⁿb²ⁿ", tabSub:"ratio", lang:"L = { aⁿb²ⁿ : n ≥ 1 }",
    idea:"Twice as many b's as a's. Each a pushes TWO X's, so each b can pop one. When a ratio is involved, put it in the push rather than in the states.",
    states:["q0","q1","q2"], start:"q0", bottom:"Z", accept:["q2"], mode:"final",
    rules:[
      {from:"q0",read:"a",pop:"Z",push:"XXZ",to:"q0",note:"first a: two X's"},
      {from:"q0",read:"a",pop:"X",push:"XXX",to:"q0",note:"later a's: two more"},
      {from:"q0",read:"b",pop:"X",push:"",to:"q1",note:"first b: switch, pop one"},
      {from:"q1",read:"b",pop:"X",push:"",to:"q1",note:"later b's: pop one each"},
      {from:"q1",read:"",pop:"Z",push:"Z",to:"q2",note:"bottom reached: accept"}],
    examples:["aabbbb","abb","aabbb","abbb"], def:"aabbbb" },
  { id:"eqab", tab:"#a = #b", tabSub:"empty stack", lang:"L = { w : #a(w) = #b(w) }",
    idea:"One state, because the whole memory is on the stack: P for each surplus a, N for each surplus b, never both at once. It accepts by EMPTY stack, and the ε-move that removes Z is what makes it nondeterministic (rule 2).",
    states:["q0"], start:"q0", bottom:"Z", accept:[], mode:"empty",
    rules:[
      {from:"q0",read:"a",pop:"Z",push:"PZ",to:"q0",note:"surplus becomes +1"},
      {from:"q0",read:"b",pop:"Z",push:"NZ",to:"q0",note:"surplus becomes −1"},
      {from:"q0",read:"a",pop:"P",push:"PP",to:"q0",note:"one more surplus a"},
      {from:"q0",read:"b",pop:"N",push:"NN",to:"q0",note:"one more surplus b"},
      {from:"q0",read:"a",pop:"N",push:"",to:"q0",note:"an a cancels a surplus b"},
      {from:"q0",read:"b",pop:"P",push:"",to:"q0",note:"a b cancels a surplus a"},
      {from:"q0",read:"",pop:"Z",push:"",to:"q0",note:"removes the marker"}],
    examples:["abba","aabbba","ba","aab"], def:"abba" },
  { id:"wcwr", tab:"wcwᴿ", tabSub:"marked middle", lang:"L = { wcwᴿ : w ∈ {a,b}* }",
    idea:"Push each symbol as you read it, in a form you can recognise later. The c marks the middle, so the machine never has to guess. Deterministic.",
    states:["q0","q1","q2"], start:"q0", bottom:"Z", accept:["q2"], mode:"final",
    rules:[
      {from:"q0",read:"a",pop:"*",push:"A*",to:"q0",note:"push: remember an a"},
      {from:"q0",read:"b",pop:"*",push:"B*",to:"q0",note:"push: remember a b"},
      {from:"q0",read:"c",pop:"*",push:"*",to:"q1",note:"switch: c marks the middle"},
      {from:"q1",read:"a",pop:"A",push:"",to:"q1",note:"match: a against A"},
      {from:"q1",read:"b",pop:"B",push:"",to:"q1",note:"match: b against B"},
      {from:"q1",read:"",pop:"Z",push:"Z",to:"q2",note:"accept: everything matched"}],
    examples:["abcba","abbcbba","c","abcab"], def:"abcba" },
  { id:"wwr", tab:"wwᴿ", tabSub:"has to guess", lang:"L = { wwᴿ : w ∈ {a,b}* }",
    idea:"Delete the c and the machine cannot see the middle, so the switch becomes an ε-move taken on a guess. It tries every midpoint at once, and the string is accepted because one attempt survives.",
    states:["q1","q2"], start:"q1", bottom:"Z", accept:[], mode:"empty",
    rules:[
      {from:"q1",read:"a",pop:"*",push:"A*",to:"q1",note:"push: remember an a"},
      {from:"q1",read:"b",pop:"*",push:"B*",to:"q1",note:"push: remember a b"},
      {from:"q1",read:"",pop:"*",push:"*",to:"q2",note:"switch: GUESS this is the middle"},
      {from:"q2",read:"a",pop:"A",push:"",to:"q2",note:"match: a against A"},
      {from:"q2",read:"b",pop:"B",push:"",to:"q2",note:"match: b against B"},
      {from:"q2",read:"",pop:"Z",push:"",to:"q2",note:"accept: empty the stack"}],
    examples:["abba","baab","abab","aba"], def:"abba" }
];

const CUSTOM_SRC = `# The aⁿbⁿ machine from the slides. Edit it, then press Build and run.
start: q0
bottom: Z
accept: q2            # or:  accept: empty stack

δ(q0, a, Z) = (q0, XZ)
δ(q0, a, X) = (q0, XX)
δ(q0, b, X) = (q1, ε)
δ(q1, b, X) = (q1, ε)
δ(q1, ε, Z) = (q2, Z)
`;

/* ---------- helpers ---------- */
const $ = id => document.getElementById(id);
const SVGNS = "http://www.w3.org/2000/svg";
function el(tag, attrs, parent, text){ const e=document.createElementNS(SVGNS,tag); for(const k in attrs) e.setAttribute(k,attrs[k]); if(text!=null) e.textContent=text; if(parent) parent.appendChild(e); return e; }
function h(tag, cls, text){ const e=document.createElement(tag); if(cls) e.className=cls; if(text!=null) e.textContent=text; return e; }
function tokenize(s){ s=(s||"").replace(/\s+/g,""); if(s===""||s===EPS||/^eps(ilon)?$/i.test(s)) return []; return s.match(/[A-Z][0-9₀-₉']*|\*|./gu)||[]; }
const str = arr => arr.length ? arr.join("") : EPS;
const sym = s => s===""?EPS:s;
function stateHTML(s){ const m=/^([^\d₀-₉]+)([\d₀-₉]+)$/.exec(s); return m ? `${m[1]}<sub>${m[2]}</sub>` : s; }
const FIXED = {X:"--sym-X",Z:"--sym-Z",A:"--sym-A",B:"--sym-B",P:"--sym-P",N:"--sym-N"};
const SPARE = ["--sym-1","--sym-2","--sym-3","--sym-4","--sym-X","--sym-A","--sym-B"];
function symVar(s){ if(FIXED[s[0]] && s.length===1) return FIXED[s]; if(s[0]==="Z") return "--sym-Z"; let hsh=0; for(const c of s) hsh=(hsh*31+c.codePointAt(0))>>>0; return SPARE[hsh%SPARE.length]; }
const symColor = s => `var(${symVar(s)})`;
const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- build a machine ---------- */
function buildMachine(def){
  const m = {...def};
  m.display = def.rules.map((r,i)=>({...r, idx:i, pushArr:tokenize(r.push)}));
  const gamma = new Set([def.bottom]);
  m.display.forEach(r=>{ if(r.pop!=="*") gamma.add(r.pop); r.pushArr.forEach(s=>{ if(s!=="*") gamma.add(s); }); });
  m.gamma=[...gamma].sort((a,b)=> (a===def.bottom)-(b===def.bottom) || a.localeCompare(b));
  const sigma=new Set(); m.display.forEach(r=>{ if(r.read) sigma.add(r.read); });
  m.sigma=[...sigma].sort();
  const states=[...(def.states||[])]; const addS=s=>{ if(s && !states.includes(s)) states.push(s); };
  addS(def.start); m.display.forEach(r=>{addS(r.from);addS(r.to);}); (def.accept||[]).forEach(addS);
  m.states=states;
  m.varName = m.gamma.includes("X") ? "□" : "X";
  m.concrete=[];
  m.display.forEach(r=>{
    const pops = r.pop==="*" ? m.gamma : [r.pop];
    pops.forEach(p=> m.concrete.push({from:r.from, read:r.read, pop:p, push:r.pushArr.map(s=>s==="*"?p:s), to:r.to, src:r.idx}));
  });
  m.det = checkDeterminism(m);
  return m;
}
function checkDeterminism(m){
  const issues=[]; const groups=new Map();
  m.concrete.forEach(r=>{ const k=r.from+"|"+r.read+"|"+r.pop; groups.set(k,(groups.get(k)||0)+1); });
  for(const [k,n] of groups){ if(n>1){ const [q,a,Z]=k.split("|"); issues.push(`Rule 1 fails: δ(${q}, ${sym(a)}, ${Z}) has ${n} choices`); } }
  const seen=new Set();
  m.concrete.forEach(r=>{ if(r.read!=="") return; const k=r.from+"|"+r.pop; if(seen.has(k)) return;
    if(m.concrete.some(o=>o.from===r.from && o.pop===r.pop && o.read!=="")){ seen.add(k); issues.push(`Rule 2 fails at (${r.from}, ${r.pop}): an ε-move and a reading move are both defined`); } });
  return issues;
}

/* ---------- explore every branch ---------- */
const LIM = {depth:60, stack:40, nodes:700};
function explore(m, input){
  const nodes=[]; const root={id:0,state:m.start,pos:0,stack:[m.bottom],depth:0,parent:null,rule:null,children:[]};
  nodes.push(root); const queue=[root]; let truncated=false;
  while(queue.length){
    const n=queue.shift();
    const consumed = n.pos===input.length;
    if(consumed && (m.mode==="final" ? m.accept.includes(n.state) : n.stack.length===0)){ n.status="accept"; continue; }
    if(n.stack.length===0){ n.status="stuck"; continue; }
    if(n.depth>=LIM.depth || nodes.length>=LIM.nodes){ n.status="cut"; truncated=true; continue; }
    const top=n.stack[0], next=input[n.pos];
    const moves=m.concrete.filter(r=>r.from===n.state && r.pop===top && (r.read==="" || r.read===next));
    if(!moves.length){ n.status="stuck"; continue; }
    n.status="inner";
    for(const r of moves){
      const st=r.push.concat(n.stack.slice(1));
      if(st.length>LIM.stack){ truncated=true; continue; }
      const c={id:nodes.length,state:r.to,pos:n.pos+(r.read?1:0),stack:st,depth:n.depth+1,parent:n,rule:r,children:[]};
      n.children.push(c); nodes.push(c); queue.push(c);
      if(nodes.length>=LIM.nodes){ truncated=true; break; }
    }
    if(!n.children.length){ n.status="cut"; }
  }
  // fate: does this subtree contain an accepting leaf?
  (function fate(n){ if(!n.children.length){ n.good = n.status==="accept"; return n.good; } let g=false; n.children.forEach(c=>{ if(fate(c)) g=true; }); n.good=g; return g; })(root);
  const leaves=nodes.filter(n=>!n.children.length);
  return {root,nodes,leaves,truncated,accepted:root.good,input};
}
function bestLeaf(n){
  let best=null;
  (function walk(x){ if(!x.children.length){
      const score = (x.status==="accept"?1e6:0) - (x.status==="accept"?x.depth:0) + (x.status!=="accept"? x.pos*1000 + x.depth : 0);
      if(!best || score>best.score) best={x,score}; return; }
    x.children.forEach(walk); })(n);
  return best.x;
}
function pathTo(leaf){ const p=[]; for(let x=leaf;x;x=x.parent) p.unshift(x); return p; }

/* ---------- state ---------- */
let M=null, R=null, path=[], t=0, playing=false, timer=null, current="anbn", lastStack=null, lastT=-1;

/* ---------- formatting ---------- */
function deltaText(r, varName){
  const pop = r.pop==="*" ? varName : r.pop;
  const push = r.pushArr ? (r.pushArr.length? r.pushArr.map(s=>s==="*"?varName:s).join("") : EPS) : str(r.push);
  return `δ(${r.from}, ${sym(r.read)}, ${pop}) = (${r.to}, ${push})`;
}
function concreteText(r){ return `δ(${r.from}, ${sym(r.read)}, ${r.pop}) = (${r.to}, ${str(r.push)})`; }
function edgeLabel(r, varName){
  const pop = r.pop==="*" ? varName : r.pop;
  const push = r.pushArr.length? r.pushArr.map(s=>s==="*"?varName:s).join("") : EPS;
  return `${sym(r.read)}, ${pop} → ${push}`;
}
function idText(n, wIn, wSt){
  const rest = R.input.slice(n.pos) || EPS;
  const st = str(n.stack);
  return `( ${n.state} , ${rest.padStart(wIn)} , ${st.padEnd(wSt)} )`;
}
function opWords(r){
  const top=r.pop, p=r.push;
  if(p.length===0) return `pop <b>${top}</b>`;
  if(p.length===1 && p[0]===top) return `leave the stack alone`;
  if(p[p.length-1]===top && p.length>1) return `push <b>${p.slice(0,-1).join("")}</b> on top of ${top}`;
  return `replace <b>${top}</b> by <b>${p.join("")}</b>`;
}

/* ---------- UI: tabs ---------- */
function renderTabs(){
  const tabs=$("tabs"); tabs.innerHTML="";
  [...PRESETS.map(p=>({id:p.id,tab:p.tab,sub:p.tabSub})),{id:"custom",tab:"δ",sub:"write your own"}].forEach(p=>{
    const b=h("button","tab"); b.type="button"; b.setAttribute("role","tab"); b.dataset.id=p.id;
    b.setAttribute("aria-selected", p.id===current ? "true":"false");
    b.innerHTML=`<b>${p.tab}</b><span>${p.sub}</span>`;
    b.onclick=()=>selectMachine(p.id,true);
    tabs.appendChild(b);
  });
}

function selectMachine(id, setHash){
  stop(); current=id; renderTabs();
  $("editor").hidden = id!=="custom";
  if(setHash){ try{ history.replaceState(null,"","#"+id); }catch(e){ location.hash=id; } }
  if(id==="custom"){
    if(!$("src").value) $("src").value=CUSTOM_SRC;
    if(!buildCustom()) return;
  } else {
    const def=PRESETS.find(p=>p.id===id); M=buildMachine(def);
    renderMachineCard(); renderExamples(def.examples); $("inp").value=def.def; run();
  }
}

/* ---------- custom parser ---------- */
function buildCustom(){
  const errs=[]; const lines=$("src").value.split("\n");
  let start=null,bottom=null,accept=null,mode="final"; const rules=[];
  lines.forEach((raw,i)=>{
    const line=raw.replace(/#.*$/,"").trim(); if(!line) return;
    let mm;
    if((mm=/^(start|bottom|accept)\s*:\s*(.*)$/i.exec(line))){
      const k=mm[1].toLowerCase(), v=mm[2].trim();
      if(k==="start") start=v; else if(k==="bottom") bottom=v;
      else { if(/empty/i.test(v)){ mode="empty"; accept=[]; } else { mode="final"; accept=v.split(/[\s,{}]+/).filter(Boolean); } }
      return;
    }
    if((mm=/^(?:δ|d|delta)\s*\(\s*([^,]+?)\s*,\s*([^,]*?)\s*,\s*([^,)]+?)\s*\)\s*=\s*(.+)$/i.exec(line))){
      const from=mm[1], readRaw=mm[2], pop=mm[3]; const read=(readRaw===EPS||/^eps(ilon)?$/i.test(readRaw)||readRaw==="")?"":readRaw;
      if(read.length>1){ errs.push(`line ${i+1}: input symbols are single characters ("${readRaw}")`); return; }
      const re=/\(\s*([^,()]+?)\s*,\s*([^()]*?)\s*\)/g; let pm, any=false;
      while((pm=re.exec(mm[4]))){ any=true; rules.push({from,read,pop,push:tokenize(pm[2]).join(""),to:pm[1]}); }
      if(!any) errs.push(`line ${i+1}: could not read the right-hand side; write it as (q1, XZ)`);
      return;
    }
    errs.push(`line ${i+1}: not understood → ${line}`);
  });
  if(!rules.length) errs.push("No transitions yet. Add a line like δ(q0, a, Z) = (q0, XZ).");
  if(accept===null) errs.push('Add an "accept:" line, for example accept: q2 or accept: empty stack.');
  $("errs").textContent=errs.join("\n");
  if(errs.length) return false;
  const def={id:"custom",lang:"Your machine",idea:"Built from the transitions you wrote. Every branch is explored, up to "+LIM.depth+" moves.",
    states:[], start:start||rules[0].from, bottom:bottom||"Z", accept, mode, rules, examples:[], def:""};
  M=buildMachine(def);
  renderMachineCard();
  const ex=[]; const s=M.sigma; if(s.length){ ex.push(s[0]+s[0]+(s[1]||s[0])+(s[1]||s[0])); ex.push(s.join("")); }
  renderExamples(ex);
  if(!$("inp").value) $("inp").value=ex[0]||"";
  run(); return true;
}

/* ---------- machine card ---------- */
function renderMachineCard(){
  $("mLang").textContent=M.lang; $("mIdea").textContent=M.idea;
  const F = M.mode==="final" ? `{${M.accept.join(", ")}}` : "∅";
  $("mTuple").textContent=`M = ( {${M.states.join(", ")}}, {${M.sigma.join(", ")}}, {${M.gamma.join(", ")}}, δ, ${M.start}, ${M.bottom}, ${F} )`;
  const chips=$("mChips"); chips.innerHTML="";
  const c1=h("span","chip mode", M.mode==="final" ? "Accepts by final state" : "Accepts by empty stack"); chips.appendChild(c1);
  if(M.det.length){ const c=h("span","chip bad","Nondeterministic"); c.title=M.det.join("\n"); chips.appendChild(c);
    const c3=h("span","chip", M.det[0]); chips.appendChild(c3); }
  else chips.appendChild(h("span","chip good","Deterministic: rules 1 and 2 hold"));
  const ul=$("mDelta"); ul.innerHTML="";
  M.display.forEach(r=>{ const li=h("li"); li.dataset.idx=r.idx;
    let t=deltaText(r,M.varName); if(r.pop==="*") t+=`   ${M.varName} ∈ Γ`;
    li.appendChild(h("span",null,t)); if(r.note) li.appendChild(h("em",null,r.note)); ul.appendChild(li); });
  $("modeHint").textContent = M.mode==="final" ? `F = {${M.accept.join(", ")}}` : "F = ∅, accept when the stack is empty";
  renderDiagram();
}
function renderExamples(list){
  const box=$("examples"); box.innerHTML=""; if(!list.length) return;
  box.appendChild(h("span","lbl","Try:"));
  list.forEach(w=>{ const res=explore(M,w); const b=h("button","ex"); b.type="button";
    b.innerHTML=`${w||EPS}<small class="${res.accepted?"y":"n"}">${res.accepted?"✓":"✗"}</small>`;
    b.title = res.accepted ? "in the language" : "not in the language";
    b.onclick=()=>{ $("inp").value=w; run(); start(); }; box.appendChild(b); });
}

/* ---------- diagram ---------- */
let geo=null;
function renderDiagram(){
  const box=$("diagram"); box.innerHTML="";
  const svg=el("svg",{role:"img","aria-label":"State diagram"}); box.appendChild(svg);
  const defs=el("defs",{},svg);
  [["arr","var(--faint)"],["arrOn","var(--now)"]].forEach(([id,c])=>{
    const mk=el("marker",{id,viewBox:"0 0 10 10",refX:"9",refY:"5",markerWidth:"11",markerHeight:"11",markerUnits:"userSpaceOnUse",orient:"auto-start-reverse"},defs);
    el("path",{d:"M0,0 L10,5 L0,10 z",style:`fill:${c}`},mk); });
  const R0=30, GAP=Math.max(230, 120+ (M.states.length>3?0:20)), LH=19;
  const pos={}; M.states.forEach((s,i)=>pos[s]={x:i*GAP,y:0});
  const groups=new Map();
  M.display.forEach(r=>{ const k=r.from+"→"+r.to; if(!groups.has(k)) groups.set(k,[]); groups.get(k).push(r); });
  const bb={x0:-80,x1:(M.states.length-1)*GAP+50,y0:-50,y1:50};
  const grow=(x,y)=>{bb.x0=Math.min(bb.x0,x);bb.x1=Math.max(bb.x1,x);bb.y0=Math.min(bb.y0,y);bb.y1=Math.max(bb.y1,y);};
  const edgeLayer=el("g",{},svg), labelLayer=el("g",{},svg), stateLayer=el("g",{},svg);
  geo={edges:{},labels:{},states:{}};
  const textW = s => s.length*8.3;
  for(const [k,rs] of groups){
    const [a,b]=k.split("→"); const A=pos[a], B=pos[b]; let d, lx, ly, dir=-1;
    if(a===b){
      d=`M${A.x-14},${A.y-26} C${A.x-46},${A.y-100} ${A.x+46},${A.y-100} ${A.x+14},${A.y-26}`;
      lx=A.x; ly=A.y-90;
    } else {
      const ia=M.states.indexOf(a), ib=M.states.indexOf(b); const fwd=ib>ia; const span=Math.abs(ib-ia);
      const reverse=groups.has(b+"→"+a);
      const bend = fwd ? (span===1 ? (reverse? -34:0) : -60-30*span) : (34+30*span);
      const mx=(A.x+B.x)/2, cy=A.y+bend*2; // quadratic control
      const u=(px,py,qx,qy)=>{const dx=qx-px,dy=qy-py,L=Math.hypot(dx,dy)||1;return [dx/L,dy/L];};
      const [ux,uy]=u(A.x,A.y,mx,bend===0?A.y:cy), [vx,vy]=u(B.x,B.y,mx,bend===0?B.y:cy);
      const sx=A.x+ux*R0, sy=A.y+uy*R0, ex=B.x+vx*(R0+3), ey=B.y+vy*(R0+3);
      d = bend===0 ? `M${sx},${sy} L${ex},${ey}` : `M${sx},${sy} Q${mx},${cy} ${ex},${ey}`;
      lx=mx; ly = bend===0 ? A.y-12 : A.y+bend - (bend<0?10:-22); dir = bend>0 ? 1 : -1;
    }
    const p=el("path",{d,class:"edge","marker-end":"url(#arr)"},edgeLayer);
    rs.forEach(r=>geo.edges[r.idx]=p);
    // labels stacked
    rs.forEach((r,i)=>{
      const txt=edgeLabel(r,M.varName); const w=textW(txt)+12;
      const y = dir<0 ? ly - (rs.length-1-i)*LH : ly + i*LH;
      const bg=el("rect",{x:lx-w/2,y:y-14,width:w,height:18,rx:5,class:"elabel-bg"},labelLayer);
      const tx=el("text",{x:lx,y:y,"text-anchor":"middle",class:"elabel"},labelLayer,txt);
      geo.labels[r.idx]={tx,bg}; grow(lx-w/2,y-16); grow(lx+w/2,y+6);
    });
  }
  // start arrow
  const S=pos[M.start];
  el("path",{d:`M${S.x-80},${S.y} L${S.x-R0-3},${S.y}`,class:"edge","marker-end":"url(#arr)"},edgeLayer);
  el("text",{x:S.x-80,y:S.y-8,class:"startlbl"},labelLayer,"start");
  M.states.forEach(s=>{
    const P=pos[s]; const g=el("g",{class:"st"},stateLayer);
    el("circle",{cx:P.x,cy:P.y,r:R0,class:"halo"},g);
    el("circle",{cx:P.x,cy:P.y,r:R0,class:"st-circle"},g);
    if(M.mode==="final" && M.accept.includes(s)) el("circle",{cx:P.x,cy:P.y,r:R0-5,class:"st-ring"},g);
    const m=/^([^\d₀-₉]+)([\d₀-₉]+)$/.exec(s);
    const tx=el("text",{x:P.x,y:P.y+6,"text-anchor":"middle",class:"st-text"},g);
    if(m){ el("tspan",{},tx,m[1]); el("tspan",{dy:"4","font-size":"12"},tx,m[2]); } else tx.textContent=s;
    geo.states[s]=g;
  });
  const pad=16; const W=bb.x1-bb.x0+pad*2, H=bb.y1-bb.y0+pad*2;
  svg.setAttribute("viewBox",`${bb.x0-pad} ${bb.y0-pad} ${W} ${H}`);
  svg.setAttribute("width",W); svg.style.maxHeight="300px";
  geo.svg=svg; geo.token=el("circle",{r:7,class:"token",opacity:0},svg);
}

/* ---------- run ---------- */
function run(){
  stop();
  const w=$("inp").value.replace(/\s+/g,"");
  R=explore(M,w);
  path=pathTo(bestLeaf(R.root)); t=0; lastStack=null; lastT=-1;
  renderTree(); render(false);
}
function follow(node){
  stop();
  path=pathTo(bestLeaf(node)); t=node.depth; lastStack=null; render(false);
}

/* ---------- render a moment ---------- */
function render(animate){
  const n=path[t]; const last=t===path.length-1; const leaf=path[path.length-1];
  $("counter").textContent=`move ${t}/${path.length-1}`;
  $("bBack").disabled=$("bReset").disabled=t===0; $("bStep").disabled=$("bEnd").disabled=last;
  // tape
  const tape=$("tape"); tape.innerHTML="";
  const chars=[...R.input];
  chars.forEach((c,i)=>{ const d=h("div","cell"+(i<n.pos?" read":"")+(i===n.pos?" head":""),c); tape.appendChild(d); });
  const end=h("div","cell end"+(n.pos===chars.length?" head":""),"end"); end.title="end of input"; tape.appendChild(end);
  // states + edges
  Object.entries(geo.states).forEach(([s,g])=>{ g.classList.remove("cur","done-acc","done-rej");
    if(s===n.state){ if(last && leaf.status==="accept") g.classList.add("done-acc"); else if(last && leaf.status!=="accept") g.classList.add("done-rej"); else g.classList.add("cur"); } });
  Object.values(geo.edges).forEach(p=>{p.classList.remove("on");p.setAttribute("marker-end","url(#arr)");});
  Object.values(geo.labels).forEach(l=>{l.tx.classList.remove("on");l.bg.classList.remove("on");});
  document.querySelectorAll("#mDelta li").forEach(li=>li.classList.remove("on"));
  if(n.rule){ const i=n.rule.src; const p=geo.edges[i]; p.classList.add("on"); p.setAttribute("marker-end","url(#arrOn)");
    geo.labels[i].tx.classList.add("on"); geo.labels[i].bg.classList.add("on");
    const li=document.querySelector(`#mDelta li[data-idx="${i}"]`); if(li) li.classList.add("on");
    if(animate && !reduceMotion) moveToken(p); }
  // narration
  narrate(n,last,leaf);
  // stamp
  const stamp=$("stamp");
  if(last){ const acc=leaf.status==="accept"; stamp.hidden=false; stamp.className="stamp "+(acc?"acc":"rej")+(animate?" pop":""); stamp.textContent = acc?"ACCEPT":(R.accepted?"STUCK":"REJECT"); }
  else stamp.hidden=true;
  renderStack(n.stack, animate);
  renderTrace();
  updateTree();
  renderSky();
  lastT=t;
}
function narrate(n,last,leaf){
  const step=$("nStep"), p=$("nText");
  if(!n.rule){ step.textContent="start";
    p.innerHTML=`Start in <b>${n.state}</b> with only the bottom marker <b>${M.bottom}</b> on the stack and all of <b>${R.input||EPS}</b> unread.<span class="why">${M.idea.split(".")[0]}.</span>`; }
  else { const r=n.rule; step.textContent="move "+t;
    const read = r.read ? `Read <b>${r.read}</b>` : `ε-move (read nothing)`;
    const stc = r.from===r.to ? `stay in ${r.from}` : `go ${r.from} → ${r.to}`;
    const note = M.display[r.src].note;
    p.innerHTML=`${read} with <b>${r.pop}</b> on top: ${opWords(r)}, ${stc}.<span class="why">${concreteText(r)}${note? " · "+note:""}</span>`; }
  if(last){
    let msg;
    if(leaf.status==="accept") msg = M.mode==="final" ? `Input exhausted and ${leaf.state} ∈ F, so ACCEPT.` : `Input exhausted and the stack is EMPTY, so ACCEPT.`;
    else if(leaf.status==="cut") msg = `This branch was cut off after ${LIM.depth} moves.`;
    else { const top=leaf.stack[0]; const nx=R.input[leaf.pos];
      msg = leaf.stack.length===0 ? `The stack is empty but input <b>${R.input.slice(leaf.pos)}</b> is left. No move is possible: stuck.` :
        (leaf.pos===R.input.length ? `Input exhausted, but no rule fires from (${leaf.state}, ε, ${top}) and this is not acceptance: stuck.` :
        `No transition for <b>${nx}</b> with <b>${top}</b> on top in ${leaf.state}: stuck. Stuck means reject, not error.`);
      msg += R.accepted ? ` <span class="why">Another branch accepts, and one success is enough. Click its green node below.</span>` :
        ` <span class="why">Every branch dies, so the machine rejects ${R.input||EPS}.</span>`; }
    p.innerHTML += `<span class="why" style="color:var(--ink);font-weight:600">${msg}</span>`;
  }
}
function moveToken(path){
  const tok=geo.token; const L=path.getTotalLength(); const t0=performance.now(); const dur=Math.min(520, 520/speed());
  tok.setAttribute("opacity",1);
  (function f(now){ const k=Math.min(1,(now-t0)/dur); const e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2; const pt=path.getPointAtLength(e*L);
    tok.setAttribute("cx",pt.x); tok.setAttribute("cy",pt.y); if(k<1) requestAnimationFrame(f); else tok.setAttribute("opacity",0); })(t0);
}

/* ---------- stack tower ---------- */
let plates=[]; // DOM nodes, index 0 = top
function renderStack(stack, animate){
  const tower=$("tower");
  const maxH=Math.max(...path.map(x=>x.stack.length),1);
  const avail=Math.max(tower.clientHeight-16, 240);
  const ph=Math.max(14, Math.min(34, Math.floor(avail/maxH)-4));
  tower.style.setProperty("--ph",ph+"px");
  if(!animate || !lastStack){
    tower.innerHTML=""; plates=[];
    for(let i=stack.length-1;i>=0;i--){ const d=makePlate(stack[i], i===stack.length-1); tower.appendChild(d); plates.unshift(d); }
  } else {
    // keep the common bottom part, animate the rest
    let k=0; while(k<lastStack.length && k<stack.length && lastStack[lastStack.length-1-k]===stack[stack.length-1-k]) k++;
    const removeN=lastStack.length-k, addN=stack.length-k;
    for(let i=0;i<removeN;i++){ const d=plates[i]; const top=d.offsetTop, left=d.offsetLeft, w=d.offsetWidth;
      d.style.top=top+"px"; d.style.left=left+"px"; d.style.width=w+"px"; d.classList.add("out"); setTimeout(()=>d.remove(),420); }
    plates=plates.slice(removeN);
    for(let i=addN-1;i>=0;i--){ const d=makePlate(stack[i], i===stack.length-1); d.classList.add("in"); d.style.animationDelay=((addN-1-i)*70)+"ms"; tower.appendChild(d); plates.unshift(d); }
  }
  lastStack=stack.slice();
  tower.querySelectorAll(".topmark,.tower-empty").forEach(x=>x.remove());
  if(!stack.length){ tower.appendChild(h("div","tower-empty","empty stack")); }
  else { const mk=h("div","topmark","top ▸"); tower.appendChild(mk);
    requestAnimationFrame(()=>{ const p=plates[0]; if(p) mk.style.top=(p.offsetTop+p.offsetHeight/2)+"px"; }); }
  const w=$("written"); w.innerHTML = stack.length ? `<i>${stack[0]}</i>${stack.slice(1).join("")}` : EPS;
}
function makePlate(s, isBottom){ const d=h("div","plate"+(s===M.bottom && isBottom?" bottom":""),s); d.style.setProperty("--c",symColor(s)); d.style.background = (s===M.bottom && isBottom)? "" : symColor(s); return d; }

/* ---------- trace ---------- */
function renderTrace(){
  const box=$("trace"); box.innerHTML="";
  const wIn=Math.max(1,R.input.length), wSt=Math.max(...path.map(x=>Math.max(1,x.stack.length)));
  let curRow=null;
  path.forEach((n,i)=>{
    const row=h("div","idr"+(i===t?" cur":"")+(i>t?" blank":""));
    row.appendChild(h("span","tu",i===0?"":"⊢"));
    if(i<=t){ row.appendChild(h("span",null,idText(n,wIn,wSt))); if(n.rule){ row.appendChild(h("span","tu","")); row.appendChild(h("span","why",concreteText(n.rule))); } }
    else row.appendChild(h("span",null,`( ____ , ${"_".repeat(Math.max(4,wIn))} , ${"_".repeat(Math.max(4,wSt))} )`));
    box.appendChild(row); if(i===t) curRow=row;
  });
  if(t===path.length-1){ const leaf=path[t]; const acc=leaf.status==="accept";
    const v=h("div","idr verdict "+(acc?"acc":"rej"));
    v.textContent = acc ? (M.mode==="final"?"Input exhausted, final state: ACCEPT":"Input exhausted, stack empty: ACCEPT")
      : (R.accepted ? "This branch is stuck. Another branch accepts." : "Stuck. Every branch dies: REJECT");
    box.appendChild(v); curRow=v; }
  if(curRow){ const top=curRow.offsetTop-box.offsetTop; if(top<box.scrollTop || top+curRow.offsetHeight>box.scrollTop+box.clientHeight) box.scrollTop=Math.max(0,top-box.clientHeight/2); }
}

/* ---------- multiverse tree ---------- */
let treeEls=null;
function renderTree(){
  const wrap=$("treeWrap"); wrap.innerHTML="";
  const COL=78, ROW=40, X0=30, Y0=26;
  let slot=0; const maxD=Math.max(...R.nodes.map(n=>n.depth));
  (function lay(n){ if(!n.children.length){ n.ty=Y0+slot*ROW; slot++; } else { n.children.forEach(lay); n.ty=(n.children[0].ty+n.children[n.children.length-1].ty)/2; } n.tx=X0+n.depth*COL; })(R.root);
  const W=X0+maxD*COL+90, H=Y0+Math.max(1,slot)*ROW;
  const svg=el("svg",{width:W,height:H,viewBox:`0 0 ${W} ${H}`,role:"img","aria-label":"Tree of every branch"},wrap);
  const eg=el("g",{},svg), ng=el("g",{},svg);
  treeEls={nodes:new Map(),edges:new Map(),marks:new Map()};
  R.nodes.forEach(n=>{
    if(n.parent){ const p=n.parent; const mx=(p.tx+n.tx)/2;
      const e=el("path",{d:`M${p.tx},${p.ty} C${mx},${p.ty} ${mx},${n.ty} ${n.tx},${n.ty}`,class:"tedge"+(n.good?"":" fate-dead")},eg);
      treeEls.edges.set(n.id,e);
      if(n.rule && n.rule.read==="" ){ const lb=el("text",{x:mx,y:(p.ty+n.ty)/2-4,"text-anchor":"middle",class:"tlabel"},eg,"ε"); treeEls.edges.set(n.id+"_l",lb); }
    }
    const g=el("g",{class:"tnode",tabindex:"0",role:"button"},ng);
    el("title",{},g,`(${n.state}, ${R.input.slice(n.pos)||EPS}, ${str(n.stack)})`);
    el("circle",{cx:n.tx,cy:n.ty,r:14},g);
    el("text",{x:n.tx,y:n.ty+4,"text-anchor":"middle"},g,n.state);
    g.addEventListener("click",()=>follow(n));
    g.addEventListener("keydown",e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); follow(n);} });
    treeEls.nodes.set(n.id,g);
    if(!n.children.length){
      const lbl = n.status==="accept" ? "✓ accept" : n.status==="cut" ? "… cut" : "✗ stuck";
      const tm=el("text",{x:n.tx+20,y:n.ty+4,class:"tmark "+(n.status==="accept"?"acc":"rej")},ng,lbl);
      treeEls.marks.set(n.id,tm);
    }
  });
}
function updateTree(){
  if(!treeEls) return;
  const last=t===path.length-1; const reveal = last ? Infinity : t;
  const onPath=new Set(path.slice(0,t+1).map(n=>n.id));
  R.nodes.forEach(n=>{
    const g=treeEls.nodes.get(n.id); const vis=n.depth<=reveal;
    g.setAttribute("class","tnode"+(vis?"":" hide")+(onPath.has(n.id)?" path":"")+(n.id===path[t].id?" cur":"")+
      (!n.children.length && vis && n.status==="accept"?" acc":"")+(!n.children.length && vis && n.status!=="accept"?" dead":""));
    const e=treeEls.edges.get(n.id); if(e){ e.setAttribute("class","tedge"+(n.good?"":" fate-dead")+(vis?"":" hide")+(onPath.has(n.id)?" path":"")); }
    const lb=treeEls.edges.get(n.id+"_l"); if(lb) lb.style.opacity=vis?1:0;
    const mk=treeEls.marks.get(n.id); if(mk) mk.style.opacity=vis?1:0;
  });
  const alive=R.nodes.filter(n=>n.depth===t).length;
  const leaves=R.leaves; const acc=leaves.filter(n=>n.status==="accept").length;
  const stats=$("mvstats"); stats.innerHTML="";
  const add=(k,v)=>{ const s=h("span"); s.innerHTML=`${k} <b>${v}</b>`; stats.appendChild(s); };
  add("Branches alive at this move:", alive);
  add("Branches in total:", leaves.length);
  if(last){ add("Accepting:", acc); add("Verdict:", R.accepted?"ACCEPT (one success is enough)":"REJECT (every branch failed)"); }
  if(R.truncated) add("Note:", "tree cut off at "+LIM.depth+" moves");
  // keep current node in view
  const g=treeEls.nodes.get(path[t].id); const wrap=$("treeWrap");
  if(g){ const c=g.querySelector("circle"); const x=+c.getAttribute("cx"), y=+c.getAttribute("cy");
    if(x<wrap.scrollLeft+20 || x>wrap.scrollLeft+wrap.clientWidth-60) wrap.scrollLeft=Math.max(0,x-wrap.clientWidth/2);
    if(y<wrap.scrollTop+10 || y>wrap.scrollTop+wrap.clientHeight-10) wrap.scrollTop=Math.max(0,y-wrap.clientHeight/2); }
}

/* ---------- stack skyline ---------- */
function renderSky(){
  const wrap=$("skyWrap"); wrap.innerHTML="";
  const CW=32, GAP=7, BH=20, X0=30, TOPP=12, AX=36;
  const maxH=Math.max(...path.map(n=>n.stack.length),1);
  const W=X0+path.length*(CW+GAP)+10, H=TOPP+maxH*BH+AX;
  const svg=el("svg",{width:W,height:H,viewBox:`0 0 ${W} ${H}`,role:"img","aria-label":"Stack contents at every move"},wrap);
  const base=TOPP+maxH*BH;
  for(let k=0;k<=maxH;k+=Math.max(1,Math.ceil(maxH/5))){ el("text",{x:X0-8,y:base-k*BH+3,"text-anchor":"end",class:"sky-axis"},svg,String(k)); }
  el("line",{x1:X0-2,x2:W-6,y1:base+0.5,y2:base+0.5,style:"stroke:var(--line)"},svg);
  path.forEach((n,i)=>{
    const x=X0+i*(CW+GAP); const g=el("g",{class:"sky-col"+(i>t?" future":"")},svg);
    const st=n.stack;
    for(let j=0;j<st.length;j++){ const s=st[st.length-1-j]; el("rect",{x,y:base-(j+1)*BH,width:CW,height:BH,rx:3,class:"sky-block",style:`fill:${symColor(s)}`},g); }
    if(!st.length) el("text",{x:x+CW/2,y:base-4,"text-anchor":"middle",class:"sky-axis"},g,"∅");
    const lab = i===0 ? "" : sym(n.rule.read);
    el("text",{x:x+CW/2,y:base+14,"text-anchor":"middle",class:"sky-axis",style:n.rule&&!n.rule.read?"fill:var(--now)":""},g,lab);
    el("text",{x:x+CW/2,y:base+27,"text-anchor":"middle",class:"sky-axis",style:"font-size:8.5px"},g,String(i));
    if(i===t) el("rect",{x:x-3,y:Math.min(base-st.length*BH, base-BH)-4,width:CW+6,height:Math.max(st.length,1)*BH+8,class:"sky-cur"},svg);
  });
  const cx=X0+t*(CW+GAP); if(cx>wrap.clientWidth-40) wrap.scrollLeft=cx-wrap.clientWidth/2;
  const lg=$("legend"); lg.innerHTML="";
  M.gamma.forEach(s=>{ const sp=h("span"); sp.innerHTML=`<i style="background:${symColor(s)}"></i>${s}${s===M.bottom?" (bottom marker)":""}`; lg.appendChild(sp); });
  const sp=h("span"); sp.textContent="Row under the columns: the symbol read at that move (ε = read nothing)"; lg.appendChild(sp);
}

/* ---------- playback ---------- */
const speed = () => parseFloat($("speed").value)||1;
function step(){ if(t<path.length-1){ t++; render(true); } else stop(); }
function back(){ if(t>0){ t--; render(true); } }
function start(){ if(playing) return; if(t>=path.length-1){ t=0; lastStack=null; render(false); } playing=true; setPlayIcon(); tick(); }
function tick(){ timer=setTimeout(()=>{ if(!playing) return; step(); if(t>=path.length-1){ stop(); return; } tick(); }, 1150/speed()); }
function stop(){ playing=false; clearTimeout(timer); setPlayIcon(); }
function setPlayIcon(){ const b=$("bPlay"); b.setAttribute("aria-label",playing?"Pause":"Play"); $("playIcon").innerHTML = playing ? '<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>' : '<path d="M7 4v16l13-8z"/>'; }

$("bPlay").onclick=()=> playing?stop():start();
$("bStep").onclick=()=>{ stop(); step(); };
$("bBack").onclick=()=>{ stop(); back(); };
$("bReset").onclick=()=>{ stop(); t=0; lastStack=null; render(false); };
$("bEnd").onclick=()=>{ stop(); t=path.length-1; render(true); };
$("inp").addEventListener("input",()=>{ clearTimeout(window.__inpT); window.__inpT=setTimeout(run,250); });
$("inp").addEventListener("keydown",e=>{ if(e.key==="Enter"){ run(); start(); } });
$("buildBtn").onclick=()=>{ if(buildCustom()) start(); };
$("loadBtn").onclick=()=>{ $("src").value=CUSTOM_SRC; buildCustom(); };
document.addEventListener("keydown",e=>{
  if(/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
  if(e.key===" "){ e.preventDefault(); playing?stop():start(); }
  else if(e.key==="ArrowRight"){ stop(); step(); }
  else if(e.key==="ArrowLeft"){ stop(); back(); }
  else if(e.key==="Home"){ stop(); t=0; lastStack=null; render(false); }
  else if(e.key==="End"){ stop(); t=path.length-1; render(true); }
});
$("fsBtn").onclick=()=>{
  const root=document.documentElement;
  if(document.fullscreenElement){ document.exitFullscreen&&document.exitFullscreen(); return; }
  root.classList.add("present");
  const p = root.requestFullscreen ? root.requestFullscreen() : null;
  if(p && p.catch) p.catch(()=>{});
};
document.addEventListener("fullscreenchange",()=>{ if(!document.fullscreenElement) document.documentElement.classList.remove("present"); });
window.addEventListener("hashchange",()=>{ const id=location.hash.slice(1); if(id && id!==current && (id==="custom"||PRESETS.some(p=>p.id===id))) selectMachine(id,false); });
let rT; window.addEventListener("resize",()=>{ clearTimeout(rT); rT=setTimeout(()=>{ lastStack=null; render(false); },150); });

// expose for tests / GIF export
window.PDA={PRESETS,buildMachine,explore,bestLeaf,pathTo,select:id=>selectMachine(id,false),setInput:w=>{ $("inp").value=w; run(); },
  goto:k=>{ stop(); t=Math.max(0,Math.min(path.length-1,k)); render(true); }, len:()=>path.length, state:()=>({t,path,R})};

const initial = location.hash.slice(1);
selectMachine((initial && (initial==="custom"||PRESETS.some(p=>p.id===initial))) ? initial : "anbn", false);
if(!reduceMotion && !window.__noAutoplay) setTimeout(start, 900);
})();
