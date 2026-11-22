/* Station: the CYK algorithm (S24 slides) */
"use strict";
(function(){
const C=Atlas.cfg, isVar=C.isVar;
const setS=S=>S.length?"{"+S.join(",")+"}":"∅";
function cyk(g,w){ const n=w.length, vars=Object.keys(g.rules), V={}, bp={}, why={}; const k2=(i,j)=>i+","+j;
  for(let i=1;i<=n;i++){ V[k2(i,1)]=vars.filter(A=>g.rules[A].some(r=>r.length===1&&r[0]===w[i-1])); }
  for(let j=2;j<=n;j++) for(let i=1;i<=n-j+1;i++){ const got=new Set(), lines=[], b={};
    for(let k=1;k<j;k++){ const L=V[k2(i,k)], R=V[k2(i+k,j-k)], hits=[];
      vars.forEach(A=>g.rules[A].forEach(r=>{ if(r.length===2&&L.includes(r[0])&&R.includes(r[1])){ hits.push(`${A} → ${r.join("")}`); got.add(A); if(!b[A]) b[A]={k,B:r[0],C:r[1]}; } }));
      lines.push({k,L:k2(i,k),R:k2(i+k,j-k),Ls:L,Rs:R,hits}); }
    V[k2(i,j)]=vars.filter(A=>got.has(A)); bp[k2(i,j)]=b; why[k2(i,j)]=lines; }
  function tree(A,i,j){ if(j===1) return {sym:A,kids:[{sym:w[i-1]}]}; const b=bp[k2(i,j)][A]; return {sym:A,kids:[tree(b.B,i,b.k),tree(b.C,i+b.k,j-b.k)]}; }
  return {V,why,n,tree,key:k2,ok:n>0&&V[k2(1,n)].includes(g.start)}; }
Atlas.cyk=cyk;

const GS=[
  {id:"ly", name:"Last year's grammar", tag:"S24 walkthrough and Sprint", g:C.G("S","S → AB | BC; A → BA | a; B → CC | b; C → AB | a"), ex:["baaba","baab","aabab","bbaba"], group:"AB → S, C · BC → S · BA → A · CC → B"},
  {id:"ab", name:"S → AB | AX", tag:"S24 practice", g:C.G("S","S → AB | AX; X → SB; A → a; B → b"), ex:["aabb","aabbb","abab"], group:"AB → S · AX → S · SB → X"}];
const ROUNDS=[{gi:0,w:"baab",tag:"Round 1"},{gi:0,w:"aabab",tag:"Round 2"},{gi:0,w:"bbaba",tag:"Round 3"},{gi:1,w:"aabb",tag:"Practice 1"},{gi:1,w:"aabbb",tag:"Practice 2"},{gi:1,w:"abab",tag:"Practice 3"}];

function grid(w,cell){ const n=w.length, t=document.createElement("table"); t.className="cyk";
  for(let j=n;j>=1;j--){ const tr=document.createElement("tr"); tr.appendChild(h("th",null,"j="+j)); for(let i=1;i<=n;i++){ const td=document.createElement("td"); if(i<=n-j+1){ td.dataset.k=i+","+j; cell(td,i,j); } else td.className="na"; tr.appendChild(td); } t.appendChild(tr); }
  const tr=document.createElement("tr"); tr.className="wrow"; tr.appendChild(h("th")); [...w].forEach((c,i)=>tr.appendChild(h("td",null,`<b>${esc(c)}</b><small>i=${i+1}</small>`))); t.appendChild(tr); return t; }

Atlas.stations.cyk.stamps=[{id:"watch",label:"Watched a table fill"},{id:"parse",label:"Read a parse off the table"},{id:"sprint",label:"CYK Table Sprint"},{id:"claims",label:"CYK claims"}];
Atlas.stations.cyk.mount=function(root){
  const b1=block(root,"The idea","A table that decides","idea");
  const two=h("div","two"); b1.appendChild(two);
  two.appendChild(h("div","panel",`<div class="ph"><h2>What a cell holds</h2></div><div class="prose">
    <p><code>V(i, j)</code> is the set of variables that derive the substring of length j starting at position i. Nothing more, and nothing about how.</p>
    <p>The answer is one cell: <b>w ∈ L(G) exactly when S ∈ V(1, n)</b>. Not when that cell is non-empty. And ε is answered from the grammar, since the table starts at length 1.</p>
    <p>Cost: n(n+1)/2 cells, at most n − 1 splits each, so <b>O(n³)</b> for a fixed grammar. Enumerating derivations would be exponential: decidable is not the same as practical.</p></div>`));
  two.appendChild(h("div","panel",`<div class="ph"><h2>CYK in five steps</h2></div><ol class="recipe">
    <li><div>Convert G to Chomsky normal form first.<small>a unit production or a long right-hand side breaks the table</small></div></li>
    <li><div>Row j = 1: V(i, 1) = { A : A → wᵢ }.<small>one lookup per input symbol</small></div></li>
    <li><div>Then j = 2, 3, …, n: shortest substrings first.<small>so every cell you need already exists</small></div></li>
    <li><div>V(i, j) = { A : A → BC, B ∈ V(i, k), C ∈ V(i+k, j−k) } for some 1 ≤ k ≤ j − 1.<small>say both indices aloud: the right piece is the commonest error</small></div></li>
    <li><div>Accept exactly when S ∈ V(1, n).</div></li></ol>`));

  /* ---------- lab ---------- */
  const b2=block(root,"Lab","Watch the table fill, one cell at a time","lab");
  const mt=h("div","machines"); b2.appendChild(mt); const host=h("div","panel cyk-lab"); b2.appendChild(host); let timer=null; Atlas.onCleanup(()=>clearInterval(timer));
  function show(G,w){ clearInterval(timer); timer=null; [...mt.children].forEach(t=>t.setAttribute("aria-selected",t.dataset.id===G.id?"true":"false")); w=w||G.ex[0];
    const R=cyk(G.g,w), order=[]; for(let j=1;j<=R.n;j++) for(let i=1;i<=R.n-j+1;i++) order.push([i,j]); let t=0;
    const sym=x=>isVar(x)?`<span class="v">${esc(x)}</span>`:esc(x);
    host.innerHTML=`<div class="ph"><h2 class="gline">${Object.entries(G.g.rules).map(([A,rs])=>`<span class="gp">${sym(A)} → ${rs.map(r=>r.map(sym).join("")).join(" <i>|</i> ")}</span>`).join(" ")}</h2><span class="hint">Grouped by right-hand side: ${esc(G.group)}</span></div>`;
    const top=h("div","controls"); host.appendChild(top); const ib=h("div","inputbox"); ib.innerHTML=`<label for="cykIn">w =</label><input id="cykIn" autocomplete="off" spellcheck="false" maxlength="8">`; top.appendChild(ib); const inp=ib.querySelector("input"); inp.value=w;
    const exs=h("div","examples"); top.appendChild(exs); G.ex.forEach(x=>{ const ok=cyk(G.g,x).ok; const b=h("button","ex"+(x===w?" on":""),`${esc(x)}<small class="${ok?"y":"n"}">${ok?"✓":"✗"}</small>`); b.type="button"; b.onclick=()=>show(G,x); exs.appendChild(b); });
    inp.addEventListener("change",()=>{ const v=[...inp.value].filter(c=>"ab".includes(c)).join(""); if(v) show(G,v); });
    const row=h("div","row ctl"); top.appendChild(row); const bB=h("button","btn","Back"), bS=h("button","btn primary","Fill next cell"), bR=h("button","btn","Next row"), bP=h("button","btn","Play"); [bB,bS,bR,bP].forEach(b=>{ b.type="button"; row.appendChild(b); });
    const tw=h("div","tablewrap"); host.appendChild(tw); const tab=grid(w,()=>{}); tw.appendChild(tab);
    const narr=h("div","narr"); narr.innerHTML=`<span class="step">V</span><p></p>`; host.appendChild(narr); const pv=h("div"); host.appendChild(pv);
    function render(){ tab.querySelectorAll("td[data-k]").forEach(td=>{ const [i,j]=td.dataset.k.split(",").map(Number); const idx=order.findIndex(([a,b])=>a===i&&b===j); td.className=""; td.innerHTML=idx<t?esc(setS(R.V[td.dataset.k])):""; if(idx<t&&!R.V[td.dataset.k].length) td.classList.add("empty"); });
      const p=narr.querySelector("p"); pv.innerHTML="";
      if(t===0){ p.innerHTML=`Nothing filled yet. Row j = 1 is read straight off the terminal productions.`; }
      else { const [i,j]=order[t-1], kk=R.key(i,j), td=tab.querySelector(`td[data-k="${kk}"]`); td.classList.add("now");
        if(j===1) p.innerHTML=`V(${i}, 1): which variables produce <b>${esc(w[i-1])}</b>? ${esc(setS(R.V[kk]))}. No thinking required, one lookup.`;
        else { const ls=R.why[kk]; ls.forEach(l=>{ if(l.hits.length){ tab.querySelector(`td[data-k="${l.L}"]`).classList.add("kl"); tab.querySelector(`td[data-k="${l.R}"]`).classList.add("kr"); } });
          p.innerHTML=`V(${i}, ${j}), the substring <b>${esc(w.slice(i-1,i-1+j))}</b>: try every split k = 1 … ${j-1}.`+ls.map(l=>`<span class="why">k = ${l.k}: V(${l.L.replace(",",", ")}) = ${esc(setS(l.Ls))} and V(${l.R.replace(",",", ")}) = ${esc(setS(l.Rs))} ${l.hits.length?"give "+esc(l.hits.join(", ")):(l.Ls.length&&l.Rs.length?"match no production":"nothing: one side is empty")}</span>`).join("")+`<span class="why" style="color:var(--ink)">Union: <b>${esc(setS(R.V[kk]))}</b>${R.V[kk].length?"":". An empty cell is a real answer, not a gap."}</span>`; } }
      if(t===order.length){ const top=R.V[R.key(1,R.n)]; pv.innerHTML=`<div class="note ${R.ok?"good":"bad"}" style="margin-top:10px"><b>${R.ok?`S ∈ V(1, ${R.n}), so ${esc(w)} ∈ L(G).`:`S ∉ V(1, ${R.n}), so ${esc(w)} ∉ L(G).`}</b> ${!R.ok&&top.length?`The top cell is not empty: ${esc(setS(top))} derive the whole string. But the test is whether the START symbol is there.`:""} ${R.ok?"Click any filled cell to see the derivation tree the table records.":""}</div>`;
        Atlas.stamp("cyk","watch"); }
      bB.disabled=t===0; bS.disabled=bR.disabled=t===order.length; }
    tab.addEventListener("click",e=>{ const td=e.target.closest("td[data-k]"); if(!td||!td.textContent||td.classList.contains("empty")) return; const [i,j]=td.dataset.k.split(",").map(Number); if(order.findIndex(([a,b])=>a===i&&b===j)>=t) return;
      const A=R.V[td.dataset.k].includes(G.g.start)?G.g.start:R.V[td.dataset.k][0]; pv.innerHTML=`<div class="dlabel" style="margin-top:12px">${esc(A)} ⇒* ${esc(w.slice(i-1,i-1+j))}, recovered from V(${i}, ${j}) by working downwards</div>`; const d=h("div","diagram tree"); pv.appendChild(d); C.drawTree(d,R.tree(A,i,j),{maxH:320});
      pv.appendChild(h("p","idea","A table that records how each variable got into each cell is a parse, not just a yes. That is what a real parser stores.")); if(j===R.n&&A===G.g.start) Atlas.stamp("cyk","parse"); });
    bS.onclick=()=>{ t++; render(); }; bB.onclick=()=>{ t--; render(); }; bR.onclick=()=>{ const j=order[t][1]; while(t<order.length&&order[t][1]===j) t++; render(); };
    bP.onclick=()=>{ if(timer){ clearInterval(timer); timer=null; bP.textContent="Play"; return; } if(t===order.length) t=0; bP.textContent="Pause"; timer=setInterval(()=>{ t++; render(); if(t>=order.length){ clearInterval(timer); timer=null; bP.textContent="Play"; } },reduceMotion?200:900); };
    render(); }
  GS.forEach(G=>{ const t=h("button","tab",`<b>${esc(G.name)}</b><span>${esc(G.tag)}</span>`); t.type="button"; t.dataset.id=G.id; t.onclick=()=>show(G); mt.appendChild(t); });
  show(GS[0]);

  /* ---------- CYK Table Sprint ---------- */
  const b3=block(root,"Challenge","CYK Table Sprint","sprint");
  b3.appendChild(h("p","idea","Three tables, increasing difficulty, then three practice ones on the other grammar. Fill every cell, check, then decide. Check the bottom row before building on it: a single wrong cell at the bottom corrupts everything above it, silently."));
  const rt=h("div","machines"); b3.appendChild(rt); const sh=h("div","panel"); b3.appendChild(sh); const doneR=new Set(); let iv=null; Atlas.onCleanup(()=>clearInterval(iv));
  function round(ri){ clearInterval(iv); [...rt.children].forEach((t,x)=>t.setAttribute("aria-selected",x===ri?"true":"false")); const Rd=ROUNDS[ri], G=GS[Rd.gi], w=Rd.w, R=cyk(G.g,w), vars=Object.keys(G.g.rules);
    sh.innerHTML=`<div class="ph"><h2>${esc(Rd.tag)}: is ${esc(w)} in L(G)?</h2><span class="timer">0:00</span></div><p class="idea" style="margin:0 0 8px">${esc(G.group)} &nbsp;·&nbsp; terminals: ${Object.entries(G.g.rules).flatMap(([A,rs])=>rs.filter(r=>r.length===1&&!isVar(r[0])).map(r=>r[0]+" → "+A)).join(", ")}</p>`;
    const tm=sh.querySelector(".timer"); const t0=Date.now(); iv=setInterval(()=>{ const s=Math.floor((Date.now()-t0)/1000); tm.textContent=Math.floor(s/60)+":"+String(s%60).padStart(2,"0"); },1000);
    const pk={}; const tw=h("div","tablewrap"); sh.appendChild(tw); tw.appendChild(grid(w,(td,i,j)=>{ const p=Atlas.picker(vars); p.el.classList.add("mini"); td.appendChild(p.el); pk[i+","+j]={p,td}; }));
    const row=h("div","row"); row.style.marginTop="10px"; sh.appendChild(row); const ck=h("button","btn primary","Check the table"); ck.type="button"; row.appendChild(ck); row.appendChild(h("span","hint","Leave a cell blank for ∅."));
    const out=h("div"); out.style.marginTop="10px"; sh.appendChild(out); let misses=0;
    ck.onclick=()=>{ const bad=Object.keys(pk).filter(k=>{ const g=pk[k].p.get(); return !(g.length===R.V[k].length&&g.every(x=>R.V[k].includes(x))); }); Object.keys(pk).forEach(k=>pk[k].td.className=bad.includes(k)?"no":"ok");
      if(bad.length){ misses++; bad.sort((a,b)=>+a.split(",")[1]-+b.split(",")[1]); const [i,j]=bad[0].split(",").map(Number);
        out.innerHTML=`<div class="note bad"><b>${bad.length} cell${bad.length>1?"s":""} wrong.</b> Start with the lowest one, V(${i}, ${j}). ${j===1?`Which variables have a production → ${esc(w[i-1])}?`:`Its splits are ${R.why[bad[0]].map(l=>`k = ${l.k}: V(${l.L.replace(",",", ")}) with V(${l.R.replace(",",", ")})`).join("; ")}. Write the triples down before filling.`}</div>`; return; }
      ck.disabled=true; Object.values(pk).forEach(x=>x.p.lock()); clearInterval(iv);
      out.innerHTML=`<div class="note good"><b>The table is right${misses?` after ${misses} check${misses>1?"s":""}`:", first time"}.</b> Now the question it answers:</div>`; const r2=h("div","row"); r2.style.marginTop="8px"; out.appendChild(r2); const o2=h("div"); o2.style.marginTop="8px"; out.appendChild(o2);
      ["Accept","Reject"].forEach(lbl=>{ const b=h("button","btn",lbl); b.type="button"; b.onclick=()=>{ const right=(lbl==="Accept")===R.ok, top=R.V[R.key(1,R.n)];
        o2.innerHTML=`<div class="note ${right?"good":"bad"}">${right?"<b>Right.</b> ":"<b>No.</b> "}V(1, ${R.n}) = ${esc(setS(top))}. ${R.ok?`S is in the top cell, so ${esc(w)} ∈ L(G).`:top.length?`The top cell is not empty, but S is not in it: ${esc(top.join(", "))} derive${top.length>1?"":"s"} the whole string and ${top.length>1?"are":"is"} not the start symbol. Reject.`:`Nothing at all derives the string. The clearest kind of rejection.`}</div>`;
        if(right){ r2.querySelectorAll("button").forEach(x=>x.disabled=true); doneR.add(ri); rt.children[ri].classList.add("donetab"); if([0,1,2].every(x=>doneR.has(x))) Atlas.stamp("cyk","sprint"); } }; r2.appendChild(b); }); }; }
  ROUNDS.forEach((Rd,ri)=>{ const t=h("button","tab",`<b>${esc(Rd.tag)}</b><span>${esc(Rd.w)}</span>`); t.type="button"; t.onclick=()=>round(ri); rt.appendChild(t); });
  round(0);

  const b6=block(root,"How it goes wrong","Right or wrong? Decide before you look.","claims");
  quickFire(b6,[
    {claim:"“The top cell is not empty, so the string is in the language.”", ok:false, why:"The test is whether the START symbol is in V(1, n). In aabbb the top cell is {X}: X derives the string, S does not."},
    {claim:"“For V(i, j) and split k, the pieces are V(i, k) and V(k, j − k).”", ok:false, why:"The right piece starts where the left one ends: V(i + k, j − k). Getting the second index wrong is the commonest error."},
    {claim:"“CYK can be run directly on a grammar with a unit production A → B.”", ok:false, why:"A → B makes a cell depend on a cell of the same length, so there is no bottom-up order to fill the table in. Convert to CNF first."},
    {claim:"“An empty cell is a gap to come back to.”", ok:false, why:"An empty cell is a complete answer: no variable derives that substring. It makes the rows above easier, since any split through it gives nothing."},
    {claim:"“CYK runs in O(n³) for a fixed grammar.”", ok:true, why:"n(n + 1)/2 cells, at most n − 1 splits each, and a constant amount of grammar to scan per split."},
    {claim:"“With a production A → BCD the algorithm would still work, just more slowly.”", ok:true, why:"Two cut points instead of one: O(n²) work per cell, O(n⁴) in all. Chomsky normal form is what pins it at O(n³)."},
    {claim:"“CYK tells you whether ε ∈ L(G).”", ok:false, why:"The table starts at length 1. Whether ε ∈ L(G) is answered from the grammar: is there S₀ → ε?"}
  ], (c,n)=>{ if(c>=n-1) Atlas.stamp("cyk","claims"); else Atlas.toast(`${c} of ${n} right. Reload the stop to try again.`); });
};
})();
