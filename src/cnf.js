/* Station: simplification and Chomsky normal form (S18 simplification, S19) */
"use strict";
(function(){
const C=Atlas.cfg, E="ε", isVar=C.isVar;
const key=r=>r.join(" ");
const clone=g=>({start:g.start, rules:Object.fromEntries(Object.entries(g.rules).map(([A,rs])=>[A,rs.map(r=>r.slice())]))});
const vname=v=>v.length>1?`${esc(v[0])}<sub>${esc(v.slice(1))}</sub>`:esc(v);
const tok=s=>isVar(s)?`<span class="v">${vname(s)}</span>`:`<span class="t">${esc(s)}</span>`;
const rhsH=r=>r.length?r.map(tok).join(""):`<span class="t">${E}</span>`;
const prodH=(A,r)=>`${tok(A)} → ${rhsH(r)}`;
const allProds=g=>Object.entries(g.rules).flatMap(([A,rs])=>rs.map(r=>[A,r]));
const onRHS=(g,X)=>allProds(g).some(([,r])=>r.includes(X));
const terms=g=>[...new Set(allProds(g).flatMap(([,r])=>r.filter(s=>!isVar(s))))].sort();
function add(rules,A,r){ (rules[A]=rules[A]||[]); if(!rules[A].some(x=>key(x)===key(r))) rules[A].push(r); }
/* the five steps, exactly as the S19 slides order them */
function needS0(g,sip){ return (sip!==false&&onRHS(g,g.start))||C.nullable(g).has(g.start); }
function step1(g,sip){ if(!needS0(g,sip)) return clone(g); const n={start:"S0",rules:{S0:[[g.start]]}}; Object.entries(g.rules).forEach(([A,rs])=>n.rules[A]=rs.map(r=>r.slice())); return n; }
function step2(g){ const N=C.nullable(g), epsIn=N.has(g.start), n={start:g.start,rules:{}};
  Object.entries(g.rules).forEach(([A,rs])=>{ n.rules[A]=[]; rs.forEach(r=>{ let vs=[[]]; r.forEach(s=>{ vs=vs.flatMap(v=>N.has(s)?[[...v,s],v]:[[...v,s]]); }); vs.forEach(v=>{ if(v.length) add(n.rules,A,v); }); }); });
  if(epsIn) add(n.rules,g.start,[]); return n; }
const isUnit=r=>r.length===1&&isVar(r[0]);
function step3(g){ const n={start:g.start,rules:{}};
  Object.keys(g.rules).forEach(A=>{ const reach=[A]; for(let i=0;i<reach.length;i++) (g.rules[reach[i]]||[]).forEach(r=>{ if(isUnit(r)&&!reach.includes(r[0])) reach.push(r[0]); });
    n.rules[A]=[]; reach.forEach(B=>(g.rules[B]||[]).forEach(r=>{ if(!isUnit(r)) add(n.rules,A,r); })); });
  return n; }
function step4a(g){ const n={start:g.start,rules:{}}, T=[];
  Object.entries(g.rules).forEach(([A,rs])=>{ n.rules[A]=rs.map(r=>r.length>=2?r.map(s=>{ if(isVar(s)) return s; if(!T.includes(s)) T.push(s); return "C"+s; }):r.slice()); });
  T.sort().forEach(a=>n.rules["C"+a]=[[a]]); return n; }
function step4b(g){ const n={start:g.start,rules:{}}, tails=new Map(); let k=0; const later=[];
  const name=t=>{ const kk=key(t); if(!tails.has(kk)){ const D="D"+(++k); tails.set(kk,D); later.push([D,t]); } return tails.get(kk); };
  Object.entries(g.rules).forEach(([A,rs])=>{ n.rules[A]=rs.map(r=>r.length>2?[r[0],name(r.slice(1))]:r.slice()); });
  for(let i=0;i<later.length;i++){ const [D,t]=later[i]; n.rules[D]=[t.length>2?[t[0],name(t.slice(1))]:t]; }
  return {g:n,count:k,separate:allProds(g).reduce((s,[,r])=>s+Math.max(0,r.length-2),0)}; }
const isCNF=(g)=>allProds(g).every(([A,r])=>(r.length===2&&r.every(isVar))||(r.length===1&&!isVar(r[0]))||(r.length===0&&A===g.start));

function gramH(g,prev){ const old=prev?new Set(allProds(prev).map(([A,r])=>A+"→"+key(r))):null;
  const rows=Object.entries(g.rules).filter(([,rs])=>rs.length).map(([A,rs])=>`<div class="gline">${tok(A)} → ${rs.map(r=>`<span class="${old&&!old.has(A+"→"+key(r))?"newp":""}">${rhsH(r)}</span>`).join(" <b class=gbar>|</b> ")}</div>`).join("");
  const gone=prev?allProds(prev).filter(([A,r])=>!(g.rules[A]||[]).some(x=>key(x)===key(r))):[];
  return `<div class="gram">${rows}</div>`+(gone.length?`<p class="hint" style="margin:6px 0 0">Removed: ${gone.map(([A,r])=>`<span class="gone">${prodH(A,r)}</span>`).join(", ")}</p>`:""); }

const RG=[
  {id:"relay", name:"The relay grammar", tag:"S19 activity", g:C.G("S","S → ASA | aB; A → B | S; B → b | ε"), stamp:"relay", sipser:true, note:"The standard textbook example. Every step does real work on it, which is why it was chosen."},
  {id:"walk", name:"EQUAL − { ε }", tag:"S19 walkthrough", g:C.G("S","S → aB | bA; A → aS | bAA | a; B → bS | aBB | b"), stamp:"walk", sipser:false, note:"Linz form, since ε ∉ L(G). Steps 1 to 3 change nothing here. A step that changes nothing is still a step you must check."},
  {id:"s18", name:"All four steps", tag:"S18 grammar", g:C.G("S","S → AB | b; A → aA | ε; B → bC | b; C → A"), stamp:"walk", note:"From the S18 simplification walkthrough, now taken all the way to CNF."}];

Atlas.stations.cnf.stamps=[{id:"useless",label:"Useless symbols, in order"},{id:"walk",label:"Converted a grammar"},{id:"relay",label:"Finished the relay"},{id:"claims",label:"CNF claims"}];
Atlas.stations.cnf.mount=function(root){
  const b1=block(root,"The idea","Every grammar in the same shape","idea");
  const two=h("div","two"); b1.appendChild(two);
  two.appendChild(h("div","panel",`<div class="ph"><h2>Chomsky normal form</h2></div><div class="prose">
    <p>Every production is <code>A → BC</code> or <code>A → a</code>. Now every derivation step either splits one variable into two, or turns one variable into one terminal.</p>
    <p>So every tree is binary above its leaves, and a string of length n has a derivation of exactly <b>2n − 1</b> steps: n − 1 splits and n terminal steps. The search becomes finite and its size is known before you start. That is what the CYK algorithm needs.</p>
    <p>Sipser's version also allows <code>S₀ → ε</code>, with S₀ on no right-hand side. Every context-free language has a grammar in CNF.</p></div>`));
  two.appendChild(h("div","panel",`<div class="ph"><h2>Five steps, in this order</h2></div><ol class="recipe">
    <li><div>New start symbol: add S₀ → S.<small>needed when ε ∈ L(G), or when S occurs on a right-hand side</small></div></li>
    <li><div>Remove ε-productions.<small>for each nullable occurrence, keep it and drop it</small></div></li>
    <li><div>Remove unit productions, including the ones step 2 just created.<small>follow every chain A ⇒ B ⇒ C</small></div></li>
    <li><div>4a. One new variable per terminal inside a right-hand side of length ≥ 2.<small>anywhere in the right-hand side, not only at the front</small></div></li>
    <li><div>4b. Break every right-hand side of length m into a chain.<small>m − 2 new variables each</small></div></li></ol>`));

  /* ---------- useless symbols ---------- */
  const b2=block(root,"Warm-up","Useless symbols: generating first, then reachable","useless");
  const up=h("div","panel"); b2.appendChild(up);
  up.innerHTML=`<div class="ph"><h2>S → AB | a, &nbsp; A → a</h2><span class="hint">S18 · why 1a must come first</span></div>
    <p class="idea" style="margin:0 0 8px">A symbol is useful if it appears in some complete derivation S ⇒* αXβ ⇒* w. <b>1a:</b> keep the variables that generate some terminal string, and the productions that use only those. <b>1b:</b> then keep what is reachable from S. B has no productions at all.</p>`;
  Atlas.pickGrid(up,{rows:[{key:"gen",label:"1a · generating"},{key:"reach",label:"1b · then reachable"}],cols:[{key:"x",label:"variables that survive"}],universe:["S","A","B"],
    answer:k=>k==="gen"?["S","A"]:["S"],
    hint:k=>k==="gen"?"B has no productions, so it generates nothing. S generates a, and A generates a. ε would count too: a variable that derives only ε is still generating.":"1a deleted B and with it S → AB. From S → a, nothing else can be reached, so A goes too.",
    done:"<b>Result: S → a.</b> Do 1b first and it changes nothing, then 1a leaves A behind. The wrong order does not break the language, it just fails to finish the job.",
    onDone:()=>Atlas.stamp("cnf","useless")});

  /* ---------- the relay ---------- */
  const b3=block(root,"Challenge","The CNF Conversion Relay","relay");
  b3.appendChild(h("p","idea","Each leg asks the one question that step depends on. Answer it, and the step runs on the previous step's output. No going back, exactly as in class: an error at step 2 would show up at step 4."));
  const mt=h("div","machines"); b3.appendChild(mt); const host=h("div"); b3.appendChild(host);
  function show(R){ [...mt.children].forEach(t=>t.setAttribute("aria-selected",t.dataset.id===R.id?"true":"false")); host.innerHTML="";
    const g0=R.g, g1=step1(g0,R.sipser), g2=step2(g1), g3=step3(g2), g4=step4a(g3), B=step4b(g4), g5=B.g;
    const pn=h("div","panel"); host.appendChild(pn);
    pn.innerHTML=`<div class="ph"><h2>${esc(R.name)}</h2><span class="hint">${esc(R.note)}</span></div>${gramH(g0)}`;
    const legs=h("div"); pn.appendChild(legs); let misses=0;
    const N2=[...C.nullable(g1)].sort(), units=allProds(g2).filter(([,r])=>isUnit(r)), T4=terms(g3).filter(a=>allProds(g3).some(([,r])=>r.length>=2&&r.includes(a)));
    const L=[
      {n:"Leg 1", q:"Does this grammar need a new start symbol S₀?", kind:"yn", ans:needS0(g0,R.sipser), after:g1, prev:g0,
       why:needS0(g0,R.sipser)?`Yes. ${C.nullable(g0).has(g0.start)?`ε ∈ L(G)`:`${g0.start} occurs on a right-hand side, and this conversion follows Sipser's version`}, so S₀ → ${g0.start} is added and S₀ becomes the start.`:onRHS(g0,g0.start)?`No. ${g0.start} does occur on right-hand sides, which would matter under Sipser's condition. But ε ∉ L(G), so the Linz form is available and no new start symbol is needed. Decide whether ε is in the language before anything else.`:`No. ${g0.start} occurs on no right-hand side and ε ∉ L(G), so step 1 is skipped.`},
      {n:"Leg 2", q:"Which variables are nullable?", kind:"set", uni:Object.keys(g1.rules), ans:N2, after:g2, prev:g1,
       why:N2.length?`Nullable: ${N2.join(", ")}. Every production with a nullable variable is copied with that occurrence kept and with it dropped, every combination. ${C.nullable(g1).has(g1.start)?"ε ∈ L(G), so S₀ → ε goes back at the very end.":"ε ∉ L(G), so no ε-production survives."}`:"None, so P is unchanged. Note it and move on."},
      {n:"Leg 3", q:"Which of these productions are unit productions?", kind:"units", uni:allProds(g2).map(([A,r])=>A+" → "+r.join("")), ans:units.map(([A,r])=>A+" → "+r.join("")), after:g3, prev:g2,
       why:units.length?`Unit productions: ${units.map(([A,r])=>A+" → "+r.join("")).join(", ")}. Each variable collects every non-unit production of everything it can reach by units alone.${units.some(([A,r])=>r[0]===A)?" "+units.find(([A,r])=>r[0]===A)[0]+" → "+units.find(([A,r])=>r[0]===A)[0]+" does nothing and is simply deleted. Step 2 created it.":""}`:"None. A → a and B → b have a single TERMINAL on the right, never a single variable, so they are not unit productions."},
      {n:"Leg 4a", q:"Which terminals get a new variable?", kind:"set", uni:terms(g3), ans:T4, after:g4, prev:g3,
       why:`${T4.length?T4.map(a=>"C"+a+" → "+a).join(", ")+" are added, and every "+T4.join(" and ")+" inside a long right-hand side is replaced, wherever it sits.":"None."} Productions like A → a keep their bare terminal: a right-hand side of length one is already in CNF.`},
      {n:"Leg 4b", q:"How many new variables does breaking the long right-hand sides add?", kind:"num", ans:[B.count,B.separate], after:g5, prev:g4,
       why:`A right-hand side of length m needs m − 2 new variables, ${B.separate} in all.${B.count!==B.separate?` Identical tails can share one name, which gives ${B.count}. Both answers are correct.`:""}`}];
    let i=0;
    function leg(){ const l=L[i]; const box=h("div","leg"); legs.appendChild(box);
      box.innerHTML=`<div class="dlabel">${l.n}</div><p style="margin:4px 0 8px"><b>${esc(l.q)}</b></p>`; const row=h("div","row"); box.appendChild(row); const out=h("div"); out.style.marginTop="8px"; box.appendChild(out);
      let get;
      if(l.kind==="yn"){ ["Yes","No"].forEach(t=>{ const b=h("button","btn",t); b.type="button"; b.onclick=()=>finish((t==="Yes")===l.ans); row.appendChild(b); }); }
      else if(l.kind==="num"){ const inp=document.createElement("input"); inp.type="number"; inp.min="0"; inp.max="20"; inp.className="numin"; inp.setAttribute("aria-label","number of new variables"); row.appendChild(inp); const b=h("button","btn primary","Check"); b.type="button"; row.appendChild(b); b.onclick=()=>finish(l.ans.includes(+inp.value)&&inp.value!==""); }
      else { const p=Atlas.picker(l.uni); row.appendChild(p.el); get=p.get; const b=h("button","btn primary","Check"); b.type="button"; row.appendChild(b); b.onclick=()=>{ const g=get(); finish(g.length===l.ans.length&&g.every(x=>l.ans.includes(x))); }; }
      function finish(ok){ if(!ok){ misses++; out.innerHTML=`<div class="note bad">Not quite. ${l.kind==="units"?"A unit production has exactly one VARIABLE on the right. Do not forget the ones step 2 just created.":l.kind==="set"&&l.n==="Leg 2"?"A variable is nullable if some production for it has only nullable symbols on the right. Repeat until nothing changes.":l.kind==="set"?"Only terminals inside a right-hand side of length two or more.":l.kind==="num"?"Count m − 2 for every right-hand side of length m.":"Check whether the start symbol appears on any right-hand side, and whether ε ∈ L(G)."}</div>`; return; }
        row.querySelectorAll("button,input").forEach(x=>x.disabled=true); out.innerHTML=`<div class="note good">${esc(l.why)}</div>${gramH(l.after,l.prev)}`;
        i++; if(i<L.length) leg(); else end(); } }
    function end(){ const ok=isCNF(g5), s0ok=!onRHS(g5,g5.start)||g5.start!==("S0"), nP=allProds(g5).length;
      const box=h("div","leg"); legs.appendChild(box);
      box.innerHTML=`<div class="dlabel">Person 4's checklist</div><ul class="checks">
        <li class="${ok?"y":"n"}">Every production is two variables or one terminal${allProds(g5).some(([,r])=>!r.length)?" (plus S₀ → ε)":""}</li>
        <li class="${s0ok?"y":"n"}">${g5.start==="S0"?"S₀ appears on no right-hand side":"The start symbol needed no replacement"}</li>
        <li class="y">${C.nullable(g0).has(g0.start)?"ε is produced only by S₀ → ε":"ε is produced by nothing, because ε ∉ L(G)"}</li></ul>
        <div class="note good"><b>In Chomsky normal form: ${nP} productions.</b> ${misses?misses+" wrong answer"+(misses>1?"s":"")+" on the way.":"No wrong answers."} The order was 1, 2, 3, 4a, 4b, and every step ran on the previous step's output.</div>`;
      Atlas.stamp("cnf",R.stamp); if(R.stamp==="relay") Atlas.stamp("cnf","walk"); }
    leg(); }
  RG.forEach(R=>{ const t=h("button","tab",`<b>${esc(R.name)}</b><span>${esc(R.tag)}</span>`); t.type="button"; t.dataset.id=R.id; t.onclick=()=>show(R); mt.appendChild(t); });
  show(RG[0]);

  const b6=block(root,"How it goes wrong","Conversion traps, step by step","claims");
  quickFire(b6,[
    {claim:"“Step 4a: if a right-hand side is aB, replace it by XB and add X → a.”", ok:false, why:"That covers one case out of several. Every terminal ANYWHERE in a right-hand side of length ≥ 2 is promoted, not only the leading one: A → BaC needs it too."},
    {claim:"“A → a should become A → Ca with Ca → a, to be safe.”", ok:false, why:"A → a is already in CNF. A → Ca is a unit production, so you have gone backwards. The length-≥ 2 condition in step 4a exists to prevent exactly this."},
    {claim:"“I can do the shape steps 4a and 4b first and remove ε- and unit productions afterwards.”", ok:false, why:"Convert the shapes first and the ε- and unit productions are still there, hidden inside a grammar that now looks like CNF. The order is 1, 2, 3, 4a, 4b."},
    {claim:"“Removing ε-productions can create new unit productions.”", ok:true, why:"S → ASA with A nullable gives S → S. That is why step 3 comes after step 2 and must catch the new ones."},
    {claim:"“In CNF, a string of length n always has a derivation of exactly 2n − 1 steps.”", ok:true, why:"The tree is binary above the leaves: n − 1 steps of the form A → BC and n of the form A → a."},
    {claim:"“A variable that derives only ε is not generating, so it is useless.”", ok:false, why:"ε is a terminal string, so a variable that derives only ε still counts as generating."},
    {claim:"“For useless symbols, the order of 1a (generating) and 1b (reachable) does not matter.”", ok:false, why:"Removing non-generating variables can make other symbols unreachable. Doing 1b first can leave a useless symbol behind."}
  ], (c,n)=>{ if(c>=n-1) Atlas.stamp("cnf","claims"); else Atlas.toast(`${c} of ${n} right. Reload the stop to try again.`); });
};
Atlas.cnf={step1,step2,step3,step4a,step4b,isCNF,allProds,gramH,tok,rhsH};
})();
