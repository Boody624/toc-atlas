/* Station: DFAs (S1–S2) */
"use strict";
(function(){
const MACHINES = [
  {id:"m1", name:"M₁", tag:"her first machine", lang:"Run it before you decide what it recognises.", reveal:"M₁ accepts the strings that contain at least one 1 and have an even number of 0s after the last 1.",
   states:["q1","q2","q3"], sigma:["0","1"], start:"q1", accept:["q2"],
   delta:{q1:{0:"q1",1:"q2"},q2:{0:"q3",1:"q2"},q3:{0:"q2",1:"q2"}}, examples:["01001","1101","100","0010",""], def:"01001"},
  {id:"d1", name:"D₁", tag:"contains 01", lang:"L = { w ∈ {0,1}* : w contains 01 as a substring }",
   states:["N","Z","Y"], sigma:["0","1"], start:"N", accept:["Y"],
   delta:{N:{0:"Z",1:"N"},Z:{0:"Z",1:"Y"},Y:{0:"Y",1:"Y"}},
   facts:{N:"no 01 yet, and the last symbol was not a 0",Z:"no 01 yet, but the last symbol WAS a 0",Y:"01 has already occurred"}, examples:["1101","01","10","010",""], def:"1101"},
  {id:"d3", name:"D₃", tag:"ends with 01", lang:"L = { w ∈ {0,1}* : w ends with 01 }",
   states:["S","A","B"], sigma:["0","1"], start:"S", accept:["B"],
   delta:{S:{0:"A",1:"S"},A:{0:"A",1:"B"},B:{0:"A",1:"S"}},
   facts:{S:"does not end in 0, and does not end in 01",A:"ends in 0",B:"ends in 01"}, examples:["0101","010","011","01",""], def:"0101"},
  {id:"d2", name:"D₂", tag:"even length", lang:"L = { w ∈ {a,b}* : |w| is even }",
   states:["E","O"], sigma:["a","b"], start:"E", accept:["E"],
   delta:{E:{a:"O",b:"O"},O:{a:"E",b:"E"}}, facts:{E:"the length so far is even",O:"the length so far is odd"}, examples:["ab","a","abba",""], def:"abba"},
  {id:"z3", name:"M", tag:"0's divisible by 3", lang:"L = { w ∈ {0,1}* : the number of 0's is divisible by 3 }",
   states:["z0","z1","z2"], sigma:["0","1"], start:"z0", accept:["z0"],
   delta:{z0:{0:"z1",1:"z0"},z1:{0:"z2",1:"z1"},z2:{0:"z0",1:"z2"}},
   facts:{z0:"the number of 0's so far leaves remainder 0",z1:"remainder 1",z2:"remainder 2"}, examples:["000","10101","0110","1",""], def:"010010"},
  {id:"trap", name:"M", tag:"a trap state", lang:"L = { w ∈ {a,b}* : no a is followed by a b }",
   states:["s","p","dead"], sigma:["a","b"], start:"s", accept:["s","p"],
   delta:{s:{a:"p",b:"s"},p:{a:"p",b:"dead"},dead:{a:"dead",b:"dead"}},
   facts:{s:"no violation yet, and the last symbol was not an a",p:"no violation yet, and the last symbol WAS an a, so a b now would be fatal",dead:"a violation has already occurred, and nothing can undo it"}, examples:["bbaa","aab","ba","abab"], def:"bbaab"}
];
const cnt=(w,c)=>{ let n=0; for(const x of w) if(x===c) n++; return n; };
const TARGETS = [
  {id:"contains01", sigma:["0","1"], name:"contains 01", lang:"{ w ∈ {0,1}* : w contains 01 as a substring }", test:w=>w.includes("01"), min:3, hint:"Ask the question in the only useful form: as I read left to right, what do I need to know? Have I already seen 01? If not, is a 0 pending?"},
  {id:"ends01", sigma:["0","1"], name:"ends with 01", lang:"{ w ∈ {0,1}* : w ends with 01 }", test:w=>w.endsWith("01"), min:3, hint:"The facts are about the suffix, not the history. Check twice what a 0 does after you have just seen 01."},
  {id:"evenlen", sigma:["a","b"], name:"even length", lang:"{ w ∈ {a,b}* : |w| is even }", test:w=>w.length%2===0, min:2, hint:"Notice what the machine can ignore completely: which symbols they were."},
  {id:"two_a", sigma:["a","b"], name:"at least two a's", lang:"{ w ∈ {a,b}* : w contains at least two a's }", test:w=>cnt(w,"a")>=2, min:3, hint:"How many a's do you actually need to count up to?"},
  {id:"zeros3", sigma:["0","1"], name:"0's divisible by 3", lang:"{ w ∈ {0,1}* : the number of 0's is divisible by 3 }", test:w=>cnt(w,"0")%3===0, min:3, hint:"You do not need to count the 0's. You need only their remainder on division by three. And ε has zero 0's."},
  {id:"starts_a", sigma:["a","b"], name:"starts with a", lang:"{ w ∈ {a,b}* : w starts with a }", test:w=>w[0]==="a", min:3, hint:"After a first b the string is doomed, but a missing arrow is not a DFA. Send doomed transitions to a dead state."}
];

Atlas.stations.dfa.mount = function(root){
  /* ---------- idea ---------- */
  const b1=block(root,"The idea","A machine with no memory beyond its state","idea");
  const two=h("div","two"); b1.appendChild(two);
  const pA=h("div","panel"); pA.innerHTML=`<div class="ph"><h2>The formal definition</h2></div>
    <div class="tuple" style="font-size:15px">M = ( Q , Σ , δ , q₀ , F )</div>
    <div class="prose" style="margin-top:10px"><p><code>Q</code> a finite set of states, fixed before any input.</p><p><code>Σ</code> the alphabet, the symbols it may read.</p>
    <p><code>δ : Q × Σ → Q</code> exactly one value for every (state, symbol) pair. That is "deterministic".</p>
    <p><code>q₀ ∈ Q</code> the start state: an element, not a subset.</p><p><code>F ⊆ Q</code> the accepting states: a subset, possibly empty.</p></div>
    <div class="note" style="margin-top:8px">M is a tuple, not a set: use ( ), never { }. And F = {q₂} is a set while q₀ = q₁ is an element.</div>`;
  const pB=h("div","panel"); pB.innerHTML=`<div class="ph"><h2>Deciding acceptance: the procedure</h2></div>
    <ol class="recipe"><li><div>Put the machine in its start state q₀. Read nothing yet.<small>one state, not a set</small></div></li>
    <li><div>Read the leftmost unread symbol.<small>left to right, never back</small></div></li>
    <li><div>Apply δ to the current state and that symbol.<small>exactly one answer</small></div></li>
    <li><div>Repeat until the input is exhausted.<small>n symbols → n+1 states</small></div></li>
    <li><div>Look at the state you finished in. In F → accept. Not in F → reject.<small>only the LAST state matters</small></div></li></ol>`;
  two.appendChild(pA); two.appendChild(pB);

  /* ---------- lab ---------- */
  const b2=block(root,"Lab","Run a machine, one symbol at a time","lab");
  const tabs=h("div","machines"); b2.appendChild(tabs);
  const info=h("div","panel mcard"); b2.appendChild(info);
  const host=h("div"); b2.appendChild(host);
  let runs=0;
  function show(m){
    [...tabs.children].forEach(t=>t.setAttribute("aria-selected", t.dataset.id===m.id?"true":"false"));
    const rows=m.states.map(q=>`<tr><th>${q===m.start?"→ ":""}${m.accept.includes(q)?"* ":""}${esc(q)}</th>${m.sigma.map(a=>`<td>${esc(m.delta[q][a])}</td>`).join("")}</tr>`).join("");
    info.innerHTML=`<div><div class="lang" style="font-size:17px">${esc(m.lang)}</div>
      <div class="tuple" style="margin-top:10px">${esc(m.name)} = ( {${m.states.join(", ")}}, {${m.sigma.join(", ")}}, δ, ${m.start}, {${m.accept.join(", ")}} )</div>
      <p class="idea" style="margin-top:10px">The same machine three ways: the diagram below, this 5-tuple, and the table on the right. All three carry exactly the same information.</p>
      ${m.reveal?`<div class="row"><button class="btn" type="button" id="revealBtn">What does it recognise?</button><span id="revealTxt" class="idea" style="margin:0"></span></div>`:""}</div>
      <div><div class="dlabel">Transition table · → start · * accepting</div><div class="tablewrap"><table class="dt"><tr><th>state</th>${m.sigma.map(a=>`<th>${esc(a)}</th>`).join("")}</tr>${rows}</table></div>
      <p class="idea" style="margin-top:8px">No empty cells: |Q| × |Σ| = ${m.states.length} × ${m.sigma.length} = ${m.states.length*m.sigma.length} entries.</p></div>`;
    const rb=info.querySelector("#revealBtn"); if(rb) rb.onclick=()=>{ info.querySelector("#revealTxt").textContent=m.reveal; };
    host.innerHTML="";
    faRunner(host, m, {input:m.def, examples:m.examples, onEnd(){ runs++; if(runs>=2) Atlas.stamp("dfa","run"); }});
  }
  MACHINES.forEach(m=>{ const t=h("button","tab",`<b>${esc(m.name)}</b><span>${esc(m.tag)}</span>`); t.type="button"; t.dataset.id=m.id; t.setAttribute("role","tab"); t.onclick=()=>show(m); tabs.appendChild(t); });
  show(MACHINES[0]);

  /* ---------- challenge ---------- */
  const b3=block(root,"Challenge","Design a DFA. The checker hunts for a string that breaks it.","design");
  const rec=h("div","panel"); rec.innerHTML=`<div class="ph"><h2>Designing a DFA: the procedure</h2><span class="hint">Decide the facts first. The arrows then write themselves.</span></div>
    <ol class="recipe" style="grid-template-columns:repeat(auto-fit,minmax(230px,1fr))">
    <li><div>Name the facts the machine must remember about the input read so far, and nothing more.<small>the only creative step</small></div></li>
    <li><div>Give each possible answer its own state, and name the state after the fact.<small>k answers → k states</small></div></li>
    <li><div>Fix the start state: what is true before you have read anything?</div></li>
    <li><div>Draw one arrow out of every state for every symbol of Σ.<small>|Q| × |Σ| arrows, exactly</small></div></li>
    <li><div>Mark F, then test ε and two more strings.</div></li></ol>`;
  b3.appendChild(rec);
  const ttabs=h("div","machines"); b3.appendChild(ttabs);
  const ed=h("div","panel"); b3.appendChild(ed);
  const solved=()=>TARGETS.filter(t=>Atlas.has("dfa","t_"+t.id)).length;
  let T=null, D=null;
  function pick(t){
    T=t; [...ttabs.children].forEach(x=>x.setAttribute("aria-selected", x.dataset.id===t.id?"true":"false"));
    D={states:["q0","q1","q2"].slice(0,Math.max(2,t.min)), sigma:t.sigma, start:"q0", accept:[], delta:{}}; D.states.forEach(q=>D.delta[q]={});
    renderEd();
  }
  function renderEd(msg){
    ed.innerHTML=`<div class="ph"><h2>Target: ${esc(T.name)}</h2><span class="hint">L = ${esc(T.lang)}</span></div>`;
    const two=h("div","two"); ed.appendChild(two);
    const left=h("div"); two.appendChild(left); const right=h("div"); two.appendChild(right);
    const tw=h("div","tablewrap"); left.appendChild(tw);
    const tb=h("table","dt"); tw.appendChild(tb);
    tb.innerHTML=`<tr><th>start</th><th>in F</th><th>state</th>${D.sigma.map(a=>`<th>δ( · , ${esc(a)})</th>`).join("")}</tr>`;
    D.states.forEach((q,i)=>{ const tr=h("tr"); tb.appendChild(tr);
      const c1=h("td"); const r=h("input"); r.type="radio"; r.name="startq"; r.checked=D.start===q; r.setAttribute("aria-label","start state "+q); r.onchange=()=>{ D.start=q; draw(); }; c1.appendChild(r); tr.appendChild(c1);
      const c2=h("td"); const cb=h("input"); cb.type="checkbox"; cb.checked=D.accept.includes(q); cb.setAttribute("aria-label",q+" accepting"); cb.onchange=()=>{ D.accept=cb.checked?[...D.accept,q]:D.accept.filter(x=>x!==q); draw(); }; c2.appendChild(cb); tr.appendChild(c2);
      const c3=h("td"); const nm=h("input"); nm.type="text"; nm.value=q; nm.maxLength=5; nm.setAttribute("aria-label","name of state "+(i+1));
      nm.onchange=()=>{ const v=nm.value.trim(); if(!v || D.states.includes(v)){ nm.value=q; return; } rename(q,v); renderEd(); }; c3.appendChild(nm); tr.appendChild(c3);
      D.sigma.forEach(a=>{ const td=h("td", D.delta[q][a]?"":"miss"); const sel=h("select"); sel.setAttribute("aria-label",`delta ${q} ${a}`);
        sel.innerHTML=`<option value="">?</option>`+D.states.map(s=>`<option ${D.delta[q][a]===s?"selected":""}>${esc(s)}</option>`).join("");
        sel.onchange=()=>{ if(sel.value) D.delta[q][a]=sel.value; else delete D.delta[q][a]; td.className=sel.value?"":"miss"; draw(); }; td.appendChild(sel); tr.appendChild(td); });
    });
    const row=h("div","row"); row.style.marginTop="10px"; left.appendChild(row);
    const add=h("button","btn","+ state"), del=h("button","btn","− state"), chk=h("button","btn primary","Check my machine"), hint=h("button","btn","Hint");
    [add,del,chk,hint].forEach(b=>{ b.type="button"; row.appendChild(b); });
    add.disabled=D.states.length>=6; del.disabled=D.states.length<=1;
    add.onclick=()=>{ let k=0; while(D.states.includes("q"+k)) k++; D.states.push("q"+k); D.delta["q"+k]={}; renderEd(); };
    del.onclick=()=>{ const q=D.states.pop(); delete D.delta[q]; D.accept=D.accept.filter(x=>x!==q); if(D.start===q) D.start=D.states[0]; D.states.forEach(s=>D.sigma.forEach(a=>{ if(D.delta[s][a]===q) delete D.delta[s][a]; })); renderEd(); };
    const out=h("div"); out.style.marginTop="10px"; left.appendChild(out); if(msg) out.appendChild(msg);
    hint.onclick=()=>{ out.innerHTML=""; out.appendChild(h("div","note",esc(T.hint))); };
    chk.onclick=()=>check(out);
    right.appendChild(h("div","dlabel","Your machine, drawn live"));
    const dia=h("div","diagram"); right.appendChild(dia);
    const tryBox=h("div"); right.appendChild(tryBox);
    function draw(){ drawFA(dia,{states:D.states,start:D.start,accept:D.accept,edges:dfaEdges(D)},{maxH:230}); tryBox.innerHTML=""; }
    draw();
    ed._try=(w)=>{ tryBox.innerHTML=""; faRunner(tryBox, D, {input:w}).play(); };
  }
  function rename(q,v){ D.states=D.states.map(s=>s===q?v:s); D.delta[v]=D.delta[q]; delete D.delta[q]; D.accept=D.accept.map(s=>s===q?v:s); if(D.start===q) D.start=v;
    D.states.forEach(s=>D.sigma.forEach(a=>{ if(D.delta[s][a]===q) D.delta[s][a]=v; })); }
  function check(out){
    out.innerHTML="";
    const missing=[]; D.states.forEach(q=>D.sigma.forEach(a=>{ if(!D.delta[q][a]) missing.push(`δ(${q}, ${a})`); }));
    if(missing.length){ out.appendChild(h("div","note bad",`<b>Not a DFA yet.</b> ${esc(missing.slice(0,4).join(", "))}${missing.length>4?" and more":""} ${missing.length>1?"are":"is"} undefined. δ is a function Q × Σ → Q: a missing arrow does not mean reject. You need exactly ${D.states.length} × ${D.sigma.length} = ${D.states.length*D.sigma.length} transitions.`)); return; }
    const bad=allStrings(D.sigma,10).find(w=>dfaAccepts(D,w)!==T.test(w));
    if(bad!==undefined){
      const acc=dfaAccepts(D,bad); const seq=dfaRun(D,bad).join(" → ");
      const n=h("div","note bad",`<b>Counterexample: ${esc(bad||EPS)}</b>. Your machine ${acc?"accepts":"rejects"} it, but it is ${T.test(bad)?"":"not "}in L.<br><span class="mono">${esc(seq)}</span>${bad===""?"<br>The empty string finishes in q₀, so ε ∈ L(M) exactly when q₀ ∈ F. Check it every single time.":""}`);
      const b=h("button","btn","Watch it run on your machine"); b.type="button"; b.style.marginTop="8px"; b.onclick=()=>ed._try(bad); n.appendChild(h("br")); n.appendChild(b);
      out.appendChild(n); return; }
    const ms=dfaMinSize(D);
    let extra = ms.reachable<D.states.length ? ` ${D.states.length-ms.reachable} of your states can never be reached.` : "";
    extra += D.states.length>T.min ? ` It has ${D.states.length} states, and the smallest machine for this language has ${T.min}. Which of your states remember the same fact? Session 3 turns that question into a procedure.` : ` And it is minimal: no DFA for this language has fewer than ${T.min} states.`;
    out.appendChild(h("div","note good",`<b>Correct.</b> Your machine agrees with L on every one of the ${allStrings(D.sigma,10).length} strings up to length 10.${esc(extra)}`));
    Atlas.stamp("dfa","t_"+T.id); Atlas.stamp("dfa","design1"); if(solved()>=3) Atlas.stamp("dfa","design3"); if(D.states.length===T.min) Atlas.stamp("dfa","minimal");
    [...ttabs.children].forEach(x=>{ if(x.dataset.id===T.id) x.querySelector("span").textContent="solved ✓"; });
  }
  TARGETS.forEach(t=>{ const b=h("button","tab",`<b>${esc(t.name)}</b><span>${Atlas.has("dfa","t_"+t.id)?"solved ✓":"Σ = {"+t.sigma.join(",")+"}"}</span>`); b.type="button"; b.dataset.id=t.id; b.onclick=()=>pick(t); ttabs.appendChild(b); });
  pick(TARGETS[0]);

  /* ---------- how it goes wrong ---------- */
  const b4=block(root,"How it goes wrong","Right or wrong? Decide before you look.","claims");
  quickFire(b4,[
    {claim:"“My machine passed through an accepting state while reading the string, so the string is accepted.”", ok:false, why:"Only the LAST state matters. Passing through an accepting state part-way means nothing at all."},
    {claim:"“I left out the b-arrow from the start state. The string is doomed after a b anyway, so the missing arrow means reject.”", ok:false, why:"A missing transition does not mean reject. It means the object you drew is not a DFA at all. Add one non-accepting dead state with self-loops and send every doomed transition to it."},
    {claim:"“ε ∈ L(M) exactly when q₀ ∈ F.”", ok:true, why:"The empty string reads nothing and finishes in q₀. Check the ε case every single time."},
    {claim:"“M = { Q, Σ, δ, q₀, F } with q₀ = {q₁}.”", ok:false, why:"Two errors. M is a tuple, so it is written with ( ), never { }. And q₀ is an element of Q, not a subset: q₀ = q₁. F is the one that is a set."},
    {claim:"“A string of n symbols takes the machine through n + 1 states, counting the start state.”", ok:true, why:"One state before reading anything, then one new current state per symbol."},
    {claim:"“In the machine for ‘ends with 01’, the accepting state needs a self-loop, like in ‘contains 01’.”", ok:false, why:"In ‘contains 01’ acceptance is monotone, so Y is absorbing. In ‘ends with 01’ every symbol changes what the string ends with, so B is left on every input: δ(B, 0) = A and δ(B, 1) = S."}
  ], (c,n)=>{ if(c>=n-1) Atlas.stamp("dfa","claims"); else Atlas.toast(`${c} of ${n} right. Reload the stop to try again.`); });
};
// hidden per-target stamps so progress per language is remembered
TARGETS.forEach(t=>Atlas.stations.dfa._targets=(Atlas.stations.dfa._targets||[]).concat(t.id));
})();
