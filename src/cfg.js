/* Station: grammars and derivation trees (S17, S18). Also exports grammar helpers for cnf.js and cyk.js. */
"use strict";
(function(){
const E="ε";
const isVar=s=>/^[A-Z]/.test(s);
/* grammar: {start, rules:{A:[[sym,...],...]}} ; [] is an ε-production */
function G(start, text){ const rules={}; text.split(";").forEach(line=>{ const [l,r]=line.split("→").map(x=>x.trim()); rules[l]=r.split("|").map(alt=>{ alt=alt.trim(); return alt===E?[]:[...alt.replace(/\s+/g,"")]; }); }); return {start, rules}; }
const prodStr=(A,rhs)=>`${A} → ${rhs.length?rhs.join(""):E}`;
const formStr=f=>f.length?f.join(""):E;
function nullable(g){ const N=new Set(); let ch=true; while(ch){ ch=false; for(const A in g.rules) if(!N.has(A)&&g.rules[A].some(r=>r.every(s=>N.has(s)))){ N.add(A); ch=true; } } return N; }
/* every leftmost derivation of w, as lists of production indices (one list per tree) */
function leftmost(g,w,cap){ cap=cap||60; const N=nullable(g), out=[]; const W=[...w];
  (function go(form,ch,depth){ if(out.length>=cap||depth>4*W.length+8) return; const i=form.findIndex(isVar);
    if(i<0){ if(form.join("")===w) out.push(ch.slice()); return; }
    for(let k=0;k<i;k++) if(form[k]!==W[k]) return;
    if(form.filter(s=>!isVar(s)).length>W.length) return; if(form.filter(s=>!N.has(s)).length>W.length) return;
    g.rules[form[i]].forEach((rhs,j)=>{ ch.push(j); go([...form.slice(0,i),...rhs,...form.slice(i+1)],ch,depth+1); ch.pop(); }); })([g.start],[],0);
  return out; }
/* trees: {sym, kids} ; kids undefined = not yet expanded ; ε-leaf = {sym:"ε",eps:true} */
const leaves=n=>!n.kids?[n]:n.kids.flatMap(leaves);
const nextVar=root=>leaves(root).find(n=>isVar(n.sym)&&!n.kids);
function apply(g,root,j){ const n=nextVar(root); const rhs=g.rules[n.sym][j]; n.kids=rhs.length?rhs.map(s=>({sym:s})):[{sym:E,eps:true}]; return n; }
function build(g,choices){ const root={sym:g.start}; choices.forEach(j=>apply(g,root,j)); return root; }
const yieldOf=root=>leaves(root).filter(n=>!n.eps).map(n=>n.sym);
function drawTree(box,root,opts){ opts=opts||{}; box.innerHTML=""; let lx=0, md=0;
  (function rec(n,d){ n.d=d; md=Math.max(md,d); if(!n.kids){ n.x=lx++; return; } n.kids.forEach(k=>rec(k,d+1)); n.x=(n.kids[0].x+n.kids[n.kids.length-1].x)/2; })(root,0);
  const W=Math.max(34, Math.min(46, 560/Math.max(lx,1))), H=50, pad=22, w=Math.max(lx,1)*W, ht=md*H+2*pad;
  const s=svg("svg",{viewBox:`${-W/2} 0 ${w} ${ht}`,role:"img","aria-label":"Derivation tree"}); s.style.maxHeight=(opts.maxH||Math.min(ht,420))+"px"; s.style.width=w+"px"; s.style.maxWidth="100%"; box.appendChild(s);
  const X=n=>n.x*W, Y=n=>pad+n.d*H; const cur=opts.cur;
  (function lines(n){ if(n.kids) n.kids.forEach(k=>{ svg("line",{x1:X(n),y1:Y(n)+11,x2:X(k),y2:Y(k)-11,class:"tline"},s); lines(k); }); })(root);
  (function nodes(n){ const v=isVar(n.sym)&&!n.eps; const g=svg("g",{class:"tnode"+(v?" tv":n.eps?" te":" tt")+(n===cur?" tcur":"")},s);
    if(v) svg("rect",{x:X(n)-14,y:Y(n)-12,width:28,height:24,rx:7},g);
    const t=svg("text",{x:X(n),y:Y(n)+5,"text-anchor":"middle"},g); t.textContent=n.sym; if(n.kids) n.kids.forEach(nodes); })(root); }
Atlas.cfg={G,isVar,prodStr,formStr,nullable,leftmost,build,apply,leaves,yieldOf,nextVar,drawTree};

/* an interactive leftmost derivation that grows the tree as you go */
function deriver(parent,g,target,opts){ opts=opts||{}; const wrap=h("div"); parent.appendChild(wrap);
  let root, hist; const W=[...target];
  function reset(){ root={sym:g.start}; hist=[]; render(); }
  function form(){ return leaves(root).filter(n=>!n.eps).map(n=>n.sym); }
  function render(){ wrap.innerHTML=""; const n=nextVar(root), f=form(), done=!n;
    const fb=h("div","sform"); fb.innerHTML=`<span class="dlabel" style="margin-right:8px">sentential form</span>`+(f.length?f.map(s=>`<span class="${isVar(s)?"v":"t"}">${esc(s)}</span>`).join(""):`<span class="t">${E}</span>`); wrap.appendChild(fb);
    if(n){ const i=f.findIndex(isVar); fb.children[i+1].classList.add("cur"); }
    const row=h("div","row"); row.style.margin="8px 0"; wrap.appendChild(row);
    if(n){ row.appendChild(h("span","hint",`Expand the leftmost variable, <b>${esc(n.sym)}</b>:`)); g.rules[n.sym].forEach((rhs,j)=>{ const b=h("button","btn prod",esc(prodStr(n.sym,rhs))); b.type="button"; b.onclick=()=>{ hist.push(j); apply(g,root,j); render(); }; row.appendChild(b); }); }
    const bk=h("button","btn","Undo"), rs=h("button","btn","Start again"); bk.type=rs.type="button"; bk.disabled=!hist.length; bk.onclick=()=>{ hist.pop(); root=build(g,hist); render(); }; rs.onclick=reset; row.appendChild(bk); row.appendChild(rs);
    const td=h("div","diagram tree"); wrap.appendChild(td); drawTree(td,root,{cur:n,maxH:opts.maxH});
    if(hist.length){ const steps=[]; let r={sym:g.start}; let prev=[g.start]; hist.forEach(j=>{ const m=apply(g,r,j); const cur=leaves(r).filter(x=>!x.eps).map(x=>x.sym); steps.push(`<tr><td>${steps.length?"⇒":"&nbsp;"} ${esc(formStr(cur))}</td><td>${esc(prodStr(m.sym,g.rules[m.sym][j]))}</td></tr>`); prev=cur; });
      const tw=h("div","tablewrap"); tw.innerHTML=`<table class="dt"><tr><th>${esc(g.start)}</th><th>production used</th></tr>${steps.join("")}</table>`; wrap.appendChild(tw); }
    const st=h("div"); st.style.marginTop="10px"; wrap.appendChild(st);
    if(done){ const y=f.join(""); if(y===target){ st.innerHTML=`<div class="note good"><b>Derived ${esc(target||E)}</b> in ${hist.length} step${hist.length>1?"s":""}, one named production per step. Every leaf is a terminal, and reading the leaves left to right gives the string.</div>`; opts.onDone&&opts.onDone(hist.slice(),st); }
      else st.innerHTML=`<div class="note bad">Every leaf is a terminal, but the yield is <code>${esc(y||E)}</code>, not <code>${esc(target)}</code>. Undo and choose differently.</div>`; }
    else { const i=f.findIndex(isVar), pre=f.slice(0,i), terms=f.filter(s=>!isVar(s)).length;
      if(pre.some((s,k)=>s!==W[k])) st.innerHTML=`<div class="note bad">Dead end: the form starts with <code>${esc(pre.join(""))}</code>, and ${esc(target)} does not. Terminals never go away, so undo.</div>`;
      else if(terms>W.length) st.innerHTML=`<div class="note bad">Dead end: the form already has ${terms} terminals and ${esc(target)} has only ${W.length}. Undo.</div>`; } }
  reset(); return {reset}; }

const GR=[
  {id:"anbn", name:"S → aSb | ε", tag:"S17 · aⁿbⁿ", g:G("S","S → aSb | ε"), ex:["aaabbb","ab",""], note:"One a and one b together, from the outside in. S → ε is the only way to finish."},
  {id:"pal", name:"Palindromes", tag:"S17", g:G("S","S → aSa | bSb | a | b | ε"), ex:["abba","aba","babab"], note:"Each step adds a matching pair on the outside. The middle is a, b or nothing."},
  {id:"tree", name:"S → aAS | a", tag:"S18 tree walkthrough", g:G("S","S → aAS | a; A → SbA | SS | ba"), ex:["aabbaa","aba"], note:"The S18 slides grow this tree for aabbaa one leftmost step at a time. It has exactly one tree."},
  {id:"order", name:"Grammar for Your Order", tag:"S17 activity", g:G("O","O → ZDX; Z → s | m | l; D → c | t; X → wE | ε; E → A | A&E; A → h | o"), ex:["lcwh&o","sc","mtwh&o"],
   note:"s m l = size, c t = coffee or tea, w = 'with', h o = shot or oat milk, & = 'and'. One variable per syntactic category.", order:true},
  {id:"etf", name:"E → E+T | T", tag:"S18 · precedence built in", g:G("E","E → E+T | T; T → TxF | F; F → a"), ex:["a+axa","axa+a"], note:"One variable per precedence level, so x always sits below +."}];
const AMB=[
  {id:"expr", name:"E → E+E | ExE | a", tag:"S18", g:G("E","E → E+E | ExE | a"), w:"a+axa", eval:true, why:"The grammar says nothing about precedence, so both groupings are legal. With a = 3 they even give different values."},
  {id:"lr", name:"S → aS | Sa | a", tag:"S18", g:G("S","S → aS | Sa | a"), w:"aaa", grow:"a", why:"Every a but the last can be attached on the left or the right, independently. A very ordinary language, a⁺, with a badly written grammar."},
  {id:"amp", name:"E → E&E | h | o", tag:"S17 · Round 2", g:G("E","E → E&E | h | o"), w:"h&o&h", grow:"amp", why:"The extras list from the order activity, written the short way. Same language as E → A | A&E, but now two trees."},
  {id:"fix", name:"E → E+T | T (the fix)", tag:"S18", g:G("E","E → E+T | T; T → TxF | F; F → a"), w:"a+axa", eval:true, fix:true, why:"Precedence is built into the variables, so there is no second tree to find."}];
function evalTree(n){ if(!n.kids) return n.sym==="a"?3:NaN; const k=n.kids.filter(x=>!x.eps); if(k.length===1) return evalTree(k[0]); if(k.length===3){ const a=evalTree(k[0]), b=evalTree(k[2]); return k[1].sym==="+"?a+b:k[1].sym==="x"?a*b:NaN; } return NaN; }
function bracket(n){ if(!n.kids) return n.sym; const k=n.kids.filter(x=>!x.eps); if(k.length===1) return bracket(k[0]); return k.length===3&&!isVar(k[1].sym)?"("+bracket(k[0])+k[1].sym+bracket(k[2])+")":k.map(bracket).join(""); }

Atlas.stations.cfg.stamps=[{id:"derive",label:"Derived a string"},{id:"order",label:"Grammar for Your Order"},{id:"two",label:"Two trees, one string"},{id:"claims",label:"Grammar claims"}];
Atlas.stations.cfg.mount=function(root){
  const b1=block(root,"The idea","Generate instead of recognise","idea");
  const two=h("div","two"); b1.appendChild(two);
  two.appendChild(h("div","panel",`<div class="ph"><h2>A grammar is a four-tuple</h2></div><div class="prose">
    <p><code>G = ( V, T, P, S )</code>: variables, terminals, productions, start variable. A list of productions is not a grammar.</p>
    <p><b>Context-free</b> means every production has a single variable on the left: <code>A → x</code>, and A may be rewritten wherever it appears.</p>
    <p>A derivation <code>S ⇒ … ⇒ w</code> applies one production per step. <code>L(G)</code> is every terminal string derivable from S. <code>S → aSb | ε</code> is two productions, and it generates { aⁿbⁿ : n ≥ 0 }, which no finite automaton can recognise.</p></div>`));
  two.appendChild(h("div","panel",`<div class="ph"><h2>Trees, and when one string has two</h2></div><div class="prose">
    <p>A derivation is a sequence, and hides structure. A <b>derivation tree</b> shows it: each production is a fan of children, and the leaves read left to right are the yield.</p>
    <p><b>Leftmost</b> means always expand the leftmost variable. It is a convention about the derivation, not the tree: every tree has exactly one leftmost derivation.</p>
    <p>A grammar is <b>ambiguous</b> if some w ∈ L(G) has two or more trees, equivalently two leftmost derivations. It is a property of the <b>grammar</b>, not of the language.</p></div>`));

  /* ---------- lab ---------- */
  const b2=block(root,"Lab","Derive it: grow the tree one leftmost step at a time","lab");
  const mt=h("div","machines"); b2.appendChild(mt); const host=h("div","panel"); b2.appendChild(host);
  function show(R,w){ [...mt.children].forEach(t=>t.setAttribute("aria-selected",t.dataset.id===R.id?"true":"false")); host.innerHTML="";
    const g=R.g; host.innerHTML=`<div class="ph"><h2>G = ( {${Object.keys(g.rules).join(",")}}, {${[...new Set(Object.values(g.rules).flat(2).filter(s=>!isVar(s)))].join(",")}}, P, ${g.start} )</h2><span class="hint">${esc(R.note)}</span></div>
      <p class="idea" style="margin:0 0 8px;font-family:var(--mono)">${Object.entries(g.rules).map(([A,rs])=>`${esc(A)} → ${rs.map(r=>esc(r.length?r.join(""):E)).join(" | ")}`).join("<br>")}</p>`;
    const tr=h("div","row"); host.appendChild(tr); tr.appendChild(h("span","hint","Target:")); w=w??R.ex[0];
    R.ex.forEach(x=>{ const b=h("button","ex"+(x===w?" on":""),esc(x||E)); b.type="button"; b.onclick=()=>show(R,x); tr.appendChild(b); });
    deriver(host,g,w,{onDone:(ch)=>{ if(ch.length>=4) Atlas.stamp("cfg","derive"); if(R.order&&w==="lcwh&o") Atlas.stamp("cfg","order"); }});
    if(R.order) host.appendChild(h("p","idea",`For the stamp, derive <code>lcwh&amp;o</code>: large coffee with shot and oat milk. The slides do it in eight steps, one named rule each. Then try to break it: <code>sctwh&amp;h</code> is not even in L(G), but <code>scwh&amp;h</code>, “with shot and shot”, is. No context-free grammar can forbid repeated extras, which is a limit of the class, not of this grammar.`)); }
  GR.forEach(R=>{ const t=h("button","tab",`<b>${esc(R.name)}</b><span>${esc(R.tag)}</span>`); t.type="button"; t.dataset.id=R.id; t.onclick=()=>show(R); mt.appendChild(t); });
  show(GR[0]);

  /* ---------- Two Trees, One String ---------- */
  const b3=block(root,"Challenge","Two Trees, One String","two");
  b3.appendChild(h("p","idea","Build a tree for the string. Then build a different one. If the grammar lets you, it is ambiguous, and you have the proof."));
  const at=h("div","machines"); b3.appendChild(at); const ah=h("div"); b3.appendChild(ah);
  function showA(A){ [...at.children].forEach(t=>t.setAttribute("aria-selected",t.dataset.id===A.id?"true":"false")); ah.innerHTML="";
    const all=leftmost(A.g,A.w), found=[]; const pn=h("div","panel"); ah.appendChild(pn);
    pn.innerHTML=`<div class="ph"><h2>${esc(A.w)} in ${esc(A.name)}</h2><span class="hint" id="twoCount">Tree 1 of 2</span></div>`;
    const area=h("div"); pn.appendChild(area); const res=h("div"); res.style.marginTop="12px"; pn.appendChild(res);
    const sbs=h("div","two"); res.appendChild(sbs); const msg=h("div"); msg.style.marginTop="10px"; res.appendChild(msg);
    function drawFound(){ sbs.innerHTML=""; found.forEach((ch,i)=>{ const t=build(A.g,ch); const c=h("div","panel"); c.innerHTML=`<div class="dlabel">Tree ${i+1}</div>${A.eval?`<p class="idea" style="margin:2px 0 0">Reads as <code>${esc(bracket(t))}</code> = ${evalTree(t)} with a = 3</p>`:""}`; const d=h("div","diagram tree"); c.appendChild(d); sbs.appendChild(c); drawTree(d,t,{maxH:260}); }); }
    function round(){ area.innerHTML=""; pn.querySelector("#twoCount").textContent=`Tree ${found.length+1}${A.fix?"":" of 2"}`;
      deriver(area,A.g,A.w,{maxH:260,onDone:(ch,st)=>{ const key=ch.join(","); if(found.some(f=>f.join(",")===key)){ st.innerHTML=`<div class="note bad"><b>Same tree.</b> That is the same leftmost derivation, production for production, so it is the same tree. Undo and branch somewhere earlier.</div>`; return; }
        found.push(ch); drawFound();
        if(A.fix){ msg.innerHTML=`<div class="note good"><b>One tree, and only one.</b> The machine count over every leftmost derivation of ${esc(A.w)} is ${all.length}. Try as you like: there is no second. ${esc(A.why)}</div>`; area.innerHTML=""; return; }
        if(found.length<2){ st.innerHTML+=`<p class="idea">Saved as tree 1. Now find a different one.</p>`; setTimeout(round,900); return; }
        area.innerHTML=""; let grow="";
        if(A.grow==="a") grow=`<div class="tablewrap" style="margin-top:8px"><table class="dt"><tr><th>|w|</th>${[1,2,3,4,5,6].map(n=>`<td>${n}</td>`).join("")}</tr><tr><th>trees</th>${[1,2,3,4,5,6].map(n=>`<td>${leftmost(A.g,"a".repeat(n),200).length}</td>`).join("")}</tr></table></div><p class="idea">2ⁿ⁻¹: a twenty-symbol string has over half a million trees. S → aS | a generates the same language with one tree each.</p>`;
        if(A.grow==="amp"){ const ws=["h","h&o","h&o&h","h&o&h&o","h&o&h&o&h"]; grow=`<div class="tablewrap" style="margin-top:8px"><table class="dt"><tr><th>extras</th>${ws.map((_,i)=>`<td>${i+1}</td>`).join("")}</tr><tr><th>trees</th>${ws.map(w=>`<td>${leftmost(A.g,w,200).length}</td>`).join("")}</tr></table></div>`; }
        msg.innerHTML=`<div class="note good"><b>Two trees for ${esc(A.w)}: the grammar is ambiguous.</b> The machine found ${all.length} in total. ${esc(A.why)}</div>${grow}`; Atlas.stamp("cfg","two"); }}); }
    round(); }
  AMB.forEach(A=>{ const t=h("button","tab",`<b>${esc(A.name)}</b><span>${esc(A.tag)}</span>`); t.type="button"; t.dataset.id=A.id; t.onclick=()=>showA(A); at.appendChild(t); });
  showA(AMB[0]);

  const b6=block(root,"How it goes wrong","Ambiguity, and what does not prove it","claims");
  quickFire(b6,[
    {claim:"“S → aSb | ε is one production.”", ok:false, why:"It is two productions, S → aSb and S → ε, written with | to save space."},
    {claim:"“The language a⁺ is ambiguous, because S → aS | Sa | a gives aaa four trees.”", ok:false, why:"Ambiguity is a property of the grammar. S → aS | a generates the same language with exactly one tree per string."},
    {claim:"“A string with two different derivations proves the grammar is ambiguous.”", ok:false, why:"Two derivations can describe the same tree, just expanded in a different order. You need two trees, or two LEFTMOST derivations."},
    {claim:"“Every tree has exactly one leftmost derivation.”", ok:true, why:"Leftmost fixes the order of expansion, so the tree determines every step. That is why counting trees and counting leftmost derivations always agree."},
    {claim:"“There is an algorithm that removes the ambiguity from any grammar.”", ok:false, why:"There is no procedure, and no algorithm even decides whether a grammar is ambiguous. Some languages are inherently ambiguous: every grammar for them is."},
    {claim:"“E → E+T | T, T → TxF | F, F → a generates the same strings as E → E+E | ExE | a.”", ok:true, why:"Same language, (a(+ + x))*a, but one tree per string, with x always grouped below +."},
    {claim:"“The order grammar over-generates ‘with shot and shot’, so it can be fixed by adding variables.”", ok:false, why:"Requiring distinct extras is beyond every context-free grammar. That defect is a limit of the class. Ambiguity, by contrast, is a defect of one particular grammar."}
  ], (c,n)=>{ if(c>=n-1) Atlas.stamp("cfg","claims"); else Atlas.toast(`${c} of ${n} right. Reload the stop to try again.`); });
};
})();
