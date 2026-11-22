/* Station: closure properties (S12) */
"use strict";
(function(){
Atlas.stations.closure.stamps=[{id:"three",label:"One product, three sets"},{id:"chooseF",label:"Chose every F"},{id:"trap",label:"The NFA trap"},{id:"argue",label:"Sound closure arguments"},{id:"claims",label:"Closure claims"}];
const D=(states,start,accept,delta,means)=>({states,sigma:["a","b"],start,accept,delta,means});
const PS=[
  {id:"w", name:"Even a's × ends in b", tag:"S12 walkthrough", n1:"M₁: even number of a's", n2:"M₂: ends in b", e1:"an even number of a's", e2:"ends in b",
   M1:D(["e","o"],"e",["e"],{e:{a:"o",b:"e"},o:{a:"e",b:"o"}},{e:"even a's so far",o:"odd a's so far"}),
   M2:D(["n","y"],"n",["y"],{n:{a:"n",b:"y"},y:{a:"n",b:"y"}},{n:"does not end in b",y:"ends in b"}), ex:["b","aab","ab","abab","aa",""]},
  {id:"x", name:"Ends in ab × even b's", tag:"S12 activity", n1:"X: ends in ab", n2:"Y: even number of b's", e1:"ends in ab", e2:"an even number of b's",
   M1:D(["p0","p1","p2"],"p0",["p2"],{p0:{a:"p1",b:"p0"},p1:{a:"p1",b:"p2"},p2:{a:"p1",b:"p0"}},{p0:"no progress",p1:"last symbol was a",p2:"ends in ab"}),
   M2:D(["r0","r1"],"r0",["r0"],{r0:{a:"r0",b:"r1"},r1:{a:"r1",b:"r0"}},{r0:"even b's",r1:"odd b's"}), ex:["ab","abb","bab","babab",""]},
  {id:"u", name:"Has an a × even length", tag:"S12 practice", n1:"M₁: at least one a", n2:"M₂: even length", e1:"at least one a", e2:"even length",
   M1:D(["u0","u1"],"u0",["u1"],{u0:{a:"u1",b:"u0"},u1:{a:"u1",b:"u1"}},{u0:"no a yet",u1:"an a has been seen"}),
   M2:D(["v0","v1"],"v0",["v0"],{v0:{a:"v1",b:"v1"},v1:{a:"v0",b:"v0"}},{v0:"even length so far",v1:"odd length so far"}), ex:["aa","a","bb","","ab"]}];
const MODES=[{id:"and",sym:"∩",name:"Intersection",rule:"F = F₁ × F₂",say:"both components accepting",f:(x,y)=>x&&y,join:"AND"},
  {id:"or",sym:"∪",name:"Union",rule:"F = (F₁ × Q₂) ∪ (Q₁ × F₂)",say:"either component accepting",f:(x,y)=>x||y,join:"OR"},
  {id:"diff",sym:"\\",name:"Difference",rule:"F = F₁ × (Q₂ − F₂)",say:"the first yes, the second no",f:(x,y)=>x&&!y,join:"AND NOT"}];
function product(P){ const start=P.M1.start+P.M2.start, pairs=[[P.M1.start,P.M2.start]], delta={}, facts={}; const nm=x=>x[0]+x[1];
  for(let i=0;i<pairs.length;i++){ const [p,q]=pairs[i]; delta[nm(pairs[i])]={}; facts[nm(pairs[i])]=P.M1.means[p]+", and "+P.M2.means[q];
    ["a","b"].forEach(c=>{ const t=[P.M1.delta[p][c],P.M2.delta[q][c]]; delta[nm(pairs[i])][c]=nm(t); if(!pairs.some(x=>nm(x)===nm(t))) pairs.push(t); }); }
  return {pairs,states:pairs.map(nm),start,delta,facts,acc:m=>pairs.filter(([p,q])=>m.f(P.M1.accept.includes(p),P.M2.accept.includes(q))).map(nm)}; }

Atlas.stations.closure.mount=function(root){
  const b1=block(root,"The idea","Building new languages out of old ones","idea");
  const two=h("div","two"); b1.appendChild(two);
  two.appendChild(h("div","panel",`<div class="ph"><h2>Seven operations that stay inside the class</h2></div><div class="prose">
    <p><b>Three are free:</b> union, concatenation and star are literally what a regular expression is built from.</p>
    <p><b>Four are earned:</b> intersection and difference by the product construction, complement by swapping F in a <b>DFA</b>, reversal by turning every arrow round.</p>
    <p>Run backwards, closure is also the first tool for showing a language is <b>not</b> regular: if A is regular and A ∩ L is not regular, then L is not regular.</p></div>`));
  two.appendChild(h("div","panel",`<div class="ph"><h2>The product construction</h2></div><ol class="recipe">
    <li><div>States are pairs [p, q], p from M₁ and q from M₂.<small>|Q₁| × |Q₂| before trimming. Write the number down first.</small></div></li>
    <li><div>The start state is [q₁, q₂]: both machines at their own start.<small>one pair, not two states</small></div></li>
    <li><div>δ([p, q], x) = [ δ₁(p, x), δ₂(q, x) ].<small>feed the symbol to both components</small></div></li>
    <li><div>Choose F: both for ∩, either for ∪, first-not-second for \\.<small>the machine never changes</small></div></li>
    <li><div>Trim the unreachable pairs and check two strings.</div></li></ol>`));

  const mt=h("div","machines"); root.appendChild(mt); const host=h("div","view"); root.appendChild(host); const seenModes=new Set();
  function show(P){ [...mt.children].forEach(t=>t.setAttribute("aria-selected", t.dataset.id===P.id?"true":"false")); host.innerHTML=""; const X=product(P);
    const b2=block(host,"Lab","One product, three accepting sets","lab");
    const pr=h("div","two"); b2.appendChild(pr);
    [[P.M1,P.n1],[P.M2,P.n2]].forEach(([M,n])=>{ const pn=h("div","panel"); pn.innerHTML=`<div class="ph"><h2>${esc(n)}</h2></div>`; const d=h("div","diagram"); pn.appendChild(d); pr.appendChild(pn); drawFA(d,{states:M.states,start:M.start,accept:M.accept,edges:dfaEdges(M)},{maxH:170}); });
    const pp=h("div","panel"); b2.appendChild(pp);
    pp.innerHTML=`<div class="ph"><h2>The product: ${P.M1.states.length} × ${P.M2.states.length} = ${P.M1.states.length*P.M2.states.length} pairs, ${X.states.length} reachable</h2><span class="hint">Read a pair as a sentence: both facts at once</span></div>`;
    const tabs=h("div","row"); tabs.setAttribute("role","tablist"); pp.appendChild(tabs); const info=h("p","idea"); info.style.margin="10px 0"; pp.appendChild(info); const rh=h("div"); pp.appendChild(rh);
    function setMode(m){ [...tabs.children].forEach(b=>{ const on=b.dataset.id===m.id; b.className="btn"+(on?" primary":""); b.setAttribute("aria-selected",on); });
      const F=X.acc(m); info.innerHTML=`<b>${m.name}:</b> ${m.rule} = { ${F.map(s=>"["+esc(s)+"]").join(", ")} }. L = ${esc(P.e1)} <b>${m.join}</b> ${esc(P.e2)}. Same ${X.states.length} states, same ${X.states.length*2} arrows. Only the double circles moved.`;
      rh.innerHTML=""; faRunner(rh,{states:X.states,sigma:["a","b"],start:X.start,accept:F,delta:X.delta,facts:X.facts},{input:P.ex[0],examples:P.ex});
      seenModes.add(m.id); if(seenModes.size===3) Atlas.stamp("closure","three"); }
    MODES.forEach(m=>{ const b=h("button","btn",`${m.sym} &nbsp;${m.name}`); b.type="button"; b.dataset.id=m.id; b.setAttribute("role","tab"); b.onclick=()=>setMode(m); tabs.appendChild(b); });
    setMode(MODES[0]);

    const b3=block(host,"Challenge","Choose F three times, for a machine you build once","chooseF");
    const cp=h("div","panel"); b3.appendChild(cp);
    cp.innerHTML=`<div class="ph"><h2>Which pairs accept?</h2><span class="hint">F₁ = { ${P.M1.accept.join(", ")} } &nbsp; F₂ = { ${P.M2.accept.join(", ")} }</span></div>
      <p class="idea" style="margin:0 0 8px">Select the accepting pairs for each language. A pair is written p then q, so <code>${esc(X.states[0])}</code> means M₁ is in ${esc(X.pairs[0][0])} and M₂ is in ${esc(X.pairs[0][1])}.</p>`;
    Atlas.pickGrid(cp,{rows:MODES.map(m=>({key:m.id,label:"L₁ "+m.sym+" L₂"})), cols:[{key:"F",label:"accepting pairs"}], universe:X.states, answer:k=>X.acc(MODES.find(m=>m.id===k)),
      hint:(k,_,got,want)=>{ const m=MODES.find(x=>x.id===k); return `for ${m.name.toLowerCase()} you want ${m.say}: ${m.rule}. ${k==="or"&&got.length<want.length?"A pair that appears in both halves is listed once, but every pair from either half is in.":k==="diff"?"That is exactly L₁ ∩ complement(L₂), which is why difference needs no new theorem.":""}`; },
      done:`<b>Three languages, one machine.</b> Intersection is the strictest choice and union the most generous. Check it the way the slides do: find a string in one answer and not the other.`,
      onDone:()=>Atlas.stamp("closure","chooseF")});
  }
  PS.forEach(P=>{ const t=h("button","tab",`<b>${esc(P.name)}</b><span>${esc(P.tag)}</span>`); t.type="button"; t.dataset.id=P.id; t.onclick=()=>show(P); mt.appendChild(t); });
  show(PS[0]);

  /* ---------- complement and the NFA trap ---------- */
  const b4=block(root,"Challenge","Complement: one line for a DFA, a trap for an NFA","trap");
  const t2=h("div","two"); b4.appendChild(t2);
  const dp=h("div","panel"); t2.appendChild(dp);
  dp.innerHTML=`<div class="ph"><h2>A DFA: swap F for Q \\ F</h2></div><p class="idea" style="margin:0 0 6px">L = contains ab. Swap the accepting states and you get the strings with no ab, which is b*a*: every b before every a.</p>`;
  const cab={states:["t0","t1","t2"],sigma:["a","b"],start:"t0",accept:["t2"],delta:{t0:{a:"t1",b:"t0"},t1:{a:"t1",b:"t2"},t2:{a:"t2",b:"t2"}}}; const dd=h("div","diagram"); dp.appendChild(dd); let sw=false;
  const sb=h("button","btn","Swap the accepting states"); sb.type="button"; const redraw=()=>drawFA(dd,{states:cab.states,start:cab.start,accept:sw?["t0","t1"]:["t2"],edges:dfaEdges(cab)},{maxH:190}); redraw();
  sb.onclick=()=>{ sw=!sw; redraw(); sb.textContent=sw?"Swap back":"Swap the accepting states"; }; dp.appendChild(sb);
  const np=h("div","panel"); t2.appendChild(np);
  np.innerHTML=`<div class="ph"><h2>An NFA: the same swap fails</h2></div><p class="idea" style="margin:0 0 6px">N over { a } accepts a, aa, aaa, … (one or more a's). N′ is N with the accepting states swapped. If swapping complemented, no string could be in both. Find one that is.</p>`;
  const nt=h("div","two"); np.appendChild(nt); [["N",["q"]],["N′",["p"]]].forEach(([n,acc])=>{ const w=h("div"); w.appendChild(h("div","dlabel",n)); const d=h("div","diagram"); w.appendChild(d); nt.appendChild(w); drawFA(d,{states:["p","q"],start:"p",accept:acc,edges:[{from:"p",to:"p",label:"a"},{from:"p",to:"q",label:"a"}]},{maxH:150}); });
  const nr=h("div","row"); nr.style.marginTop="8px"; np.appendChild(nr); const no=h("div"); no.style.marginTop="10px"; np.appendChild(no);
  [["ε",false,"N rejects ε: the only live state is p, and p is not accepting in N. So ε is in N′ only."],["a",true],["aa",true]].forEach(([w,ok,why])=>{ const b=h("button","btn",`<code>${w}</code>`); b.type="button"; b.onclick=()=>{
    no.innerHTML= ok ? `<div class="note good"><b>Yes.</b> After ${w} the live set is { p, q }. N accepts because some run ends in q. N′ accepts because some run ends in p. “Some run ends outside F” is not the negation of “some run ends in F”. The negation is “<b>no</b> run ends in F”. The honest recipe: determinise first, then swap.</div>` : `<div class="note bad">${why}</div>`; if(ok) Atlas.stamp("closure","trap"); }; nr.appendChild(b); });

  /* ---------- closure arguments ---------- */
  const b5=block(root,"Challenge","Closure arguments, in the right direction","argue");
  b5.appendChild(h("p","idea","You may assume { aⁿbⁿ } and { aᵏbaᵏ } are not regular (the pumping lemma stop proves it). The sound form: A regular and A ∩ L not regular ⟹ L not regular. The whole move is the choice of A: intersect with something that removes everything except the one thing finite memory cannot do."));
  const ag=h("div","two"); b5.appendChild(ag); const won=new Set();
  [{id:"eq", L:"EQUAL = { w : #a(w) = #b(w) }", opts:[
      ["a*b*", true, "EQUAL ∩ L(a*b*) = { aⁿbⁿ }, which is not regular. So EQUAL is not regular. a*b* strips away every string whose a's and b's are interleaved, leaving only the counting."],
      ["(ab)*", false, "EQUAL ∩ L((ab)*) = (ab)*, which is regular. The intersection threw away everything difficult, so it proves nothing about EQUAL."],
      ["(a+b)*", false, "EQUAL ∩ Σ* = EQUAL. You are back where you started: the argument now needs the very fact it was meant to prove."],
      ["a*", false, "EQUAL ∩ L(a*) = { ε }, which is regular. Nothing follows. “A regular and L not regular ⟹ A ∩ L not regular” is the false, converse-looking version."]]},
   {id:"pal", L:"PALINDROME = { w : w = wᴿ }", opts:[
      ["(a+b)*", false, "PALINDROME ∩ Σ* = PALINDROME. Circular: nothing has been reduced to a settled language."],
      ["a*", false, "PALINDROME ∩ L(a*) = a*, because every string of a's is a palindrome. That is regular, so nothing follows."],
      ["a*ba*", true, "PALINDROME ∩ L(a*ba*) = { aᵏbaᵏ }, which is not regular. So PALINDROME is not regular. The single b marks the middle and forces the two sides to be counted against each other."],
      ["b*", false, "PALINDROME ∩ L(b*) = b*, which is regular. Nothing follows."]]}
  ].forEach(Q=>{ const pn=h("div","panel"); ag.appendChild(pn); pn.innerHTML=`<div class="ph"><h2>Show that ${esc(Q.L)} is not regular</h2></div><p class="idea" style="margin:0 0 8px">Choose the regular language A to intersect with.</p>`;
    const r=h("div","row"); pn.appendChild(r); const o=h("div"); o.style.marginTop="10px"; pn.appendChild(o);
    Q.opts.forEach(([a,ok,why])=>{ const b=h("button","btn",`A = <code>${esc(a)}</code>`); b.type="button"; b.onclick=()=>{ o.innerHTML=`<div class="note ${ok?"good":"bad"}">${ok?"<b>Sound.</b> ":"<b>Proves nothing.</b> "}${esc(why)}</div>`; if(ok){ won.add(Q.id); if(won.size===2) Atlas.stamp("closure","argue"); } }; r.appendChild(b); }); });

  const b6=block(root,"How it goes wrong","Which F, which machine, which direction","claims");
  quickFire(b6,[
    {claim:"“Intersection, union and difference of two DFAs need three different product machines.”", ok:false, why:"The states, the start state and every transition are identical. Only the choice of F differs."},
    {claim:"“For the union, F = F₁ × F₂.”", ok:false, why:"That is intersection, the strictest choice. Union is (F₁ × Q₂) ∪ (Q₁ × F₂): either component accepting."},
    {claim:"“To complement an NFA, swap its accepting and non-accepting states.”", ok:false, why:"An NFA accepts when some run ends in F. Swapping gives “some run ends outside F”, which is not the negation. Determinise first, then swap."},
    {claim:"“Closure under difference needs no theorem of its own.”", ok:true, why:"L \\ M = L ∩ complement(M), and taking Q₂ − F₂ in the product is exactly complementing M."},
    {claim:"“If A is regular and L is not regular, then A ∩ L is not regular.”", ok:false, why:"Take A = ∅, or A = a* against { aⁿbⁿ }: the intersection is regular. The sound form needs you to establish that A ∩ L is not regular."},
    {claim:"“The reversal of ‘starts with a’ is ‘ends with a’.”", ok:true, why:"Reversal turns a prefix condition into a suffix condition, and the other way round. It is the sanity check to run every time."},
    {claim:"“The product of a 3-state DFA and a 2-state DFA has exactly 6 states in the answer.”", ok:false, why:"6 is the count before trimming. Unreachable pairs are deleted, and whether any exist has to be checked on each machine."}
  ], (c,n)=>{ if(c>=n-1) Atlas.stamp("closure","claims"); else Atlas.toast(`${c} of ${n} right. Reload the stop to try again.`); });
};
})();
