/* Station: the halting problem (S25 definitions; S26 statement, standard diagonal argument) */
"use strict";
(function(){
const SUB={"0":"₀","1":"₁","2":"₂","3":"₃","4":"₄","5":"₅","6":"₆","7":"₇","8":"₈","9":"₉"};
const qn=q=>q.replace(/\d/g,d=>SUB[d]);
const trim=st=>{ const t=st.tape.slice(); while(t.length&&t[t.length-1]==="B") t.pop(); return t; };
/* Two sound loop certificates: an exact repeated configuration, or the head drifting right into blank tape in a repeated state without ever looking back. */
function certify(steps){
  const seen=new Map();
  for(let i=0;i<steps.length;i++){ const s=steps[i], key=s.q+"|"+s.h+"|"+trim(s).join(""); if(seen.has(key)) return {kind:"repeat",i:seen.get(key),j:i}; seen.set(key,i); }
  const past=s=>trim(s).length<=s.h;
  for(let j=0;j<steps.length;j++){ if(!past(steps[j])) continue; let lo=steps[j].h;
    for(let i=j-1;i>=0;i--){ lo=Math.min(lo,steps[i].h); if(steps[i].q===steps[j].q && past(steps[i]) && steps[i].h<steps[j].h && lo>=steps[i].h) return {kind:"drift",i,j}; } }
  return null;
}
const PAIRS=[
  {name:"Last year's aⁿbⁿ machine", w:"aab", rows:["q0: a=q1,X,R Y=q3,Y,R","q1: a=q1,a,R b=q2,Y,L Y=q1,Y,R","q2: a=q2,a,L X=q0,X,R Y=q2,Y,L","q3: Y=q3,Y,R B=q4,B,R"], acc:["q4"], ans:"reject",
   why:"It crosses one a and one b, returns, crosses the second a, and then q₁ runs into the blank looking for a b. No entry: halt and reject."},
  {name:"The one-line loop, with its blank entry", w:"a", rows:["q0: a=q0,a,R B=q0,B,R"], acc:[], ans:"loop",
   why:"Once the head is past the input it reads B in q₀ forever and moves right forever."},
  {name:"The bouncer", w:"a", rows:["q0: a=q1,a,R","q1: B=q0,B,L"], acc:[], ans:"loop",
   why:"Right onto the blank, left back onto the a, and the configuration q₀a is back exactly. The same configuration twice means the same future, forever."},
  {name:"Last year's aⁿbⁿ machine, longer input", w:"aaaaaabbbbbb", rows:["q0: a=q1,X,R Y=q3,Y,R","q1: a=q1,a,R b=q2,Y,L Y=q1,Y,R","q2: a=q2,a,L X=q0,X,R Y=q2,Y,L","q3: Y=q3,Y,R B=q4,B,R"], acc:["q4"], ans:"accept", slow:true,
   why:"It accepts after 2n² + 2n + 1 = 85 moves. Had you stopped watching at move 40 you would have guessed “runs forever”. Still running is not the same as never stopping."},
  {name:"The grower", w:"X", rows:["q0: X=q1,X,R","q1: a=q1,a,R B=q2,a,L","q2: a=q2,a,L X=q1,X,R"], acc:[], ans:"loop", hard:true,
   why:"Each trip walks to the end of the a's, writes one more a, and walks back to the X. The tape grows, so no configuration ever repeats, and the head keeps coming back, so it never drifts off either. Neither certificate fires: you had to argue it. There is no state with no entry that it can reach, and no accepting state at all."}
];
const ent=e=>`(${qn(e[0])}, ${e[1]}, ${e[2]})`;

Atlas.stations.halt.stamps=[{id:"predict",label:"Called the outcomes"},{id:"diag",label:"Built D"},{id:"self",label:"Ran D on itself"},{id:"order",label:"Ordered the proof"},{id:"sort",label:"Sorted the classes"},{id:"claims",label:"Halting claims"}];
Atlas.stations.halt.mount=function(root){
  const T=Atlas.tm;
  /* ---------- idea ---------- */
  const b1=block(root,"The idea","Accept, reject, or neither","idea");
  b1.appendChild(h("div","note",`Session 26's slides were not posted when this stop was built. It uses Session 25's definitions and the standard diagonal argument (Sipser 4.2, Linz 12.1).`));
  const three=h("div","three"); b1.appendChild(three);
  three.appendChild(h("div","panel",`<div class="ph"><h2>Recognise or decide</h2></div><div class="prose"><p>M <b>recognises</b> L if L(M) = L. On a string outside L it may reject <b>or run forever</b>.</p><p>M <b>decides</b> L if it recognises L and halts on every input.</p><p><code>decidable ⊆ recursively enumerable</code>, and the containment is proper.</p></div>`));
  three.appendChild(h("div","panel",`<div class="ph"><h2>The separating language</h2></div><div class="prose"><p><code>HALT = { ⟨M, w⟩ : M halts on w }</code></p><p>Recognisable: simulate M on w and accept if it halts.</p><p>Not decidable: no machine answers it for <b>every</b> M and w. The simulation never knows when to give up.</p></div>`));
  three.appendChild(h("div","panel",`<div class="ph"><h2>Evidence is not proof</h2></div><div class="prose"><p>“It halted on every input up to length 9” is about finitely many strings. A decider is a claim about all of them.</p><p>What proves halting is a quantity that strictly decreases, such as the unmarked symbols in the aⁿbⁿ machine. The halting problem says no algorithm finds such an argument for every machine.</p></div>`));

  /* ---------- predict ---------- */
  const b2=block(root,"Lab","Will it halt? Call it, then run it","predict");
  b2.appendChild(h("p","idea",`Read each δ and its input. Decide the outcome before you press anything. The simulator runs up to 2000 moves and looks for a certificate that the machine loops.`));
  const grid=h("div","qf"); b2.appendChild(grid); let pd=0, pk=0;
  PAIRS.forEach(P=>{ const M=T.TM({start:"q0",accept:P.acc,rows:P.rows}); const c=h("div","qf-card");
    c.appendChild(h("div","who",esc(P.name)));
    const lines=[]; Object.keys(M.delta).forEach(q=>Object.keys(M.delta[q]).forEach(s=>lines.push(`δ(${qn(q)}, ${s}) = ${ent(M.delta[q][s])}`)));
    c.appendChild(h("div","trace",lines.map(esc).join("<br>")+(P.acc.length?`<br>F = { ${P.acc.map(qn).join(", ")} }`:"<br>F = ∅")));
    c.appendChild(h("p","claim",`Input <b class="mono">${esc(P.w)}</b>, start in q₀`));
    const row=h("div","row route"); c.appendChild(row);
    [["accept","Accepts"],["reject","Rejects"],["loop","Runs forever"]].forEach(([k,l])=>{ const b=h("button","btn",l); b.type="button"; row.appendChild(b);
      b.onclick=()=>{ row.querySelectorAll("button").forEach(x=>x.disabled=true); b.classList.add("sel"); const r=T.run(M,P.w,2000); const ok=k===P.ans; pd++; if(ok) pk++;
        const moves=r.steps.length-1; let how;
        if(r.out==="accept") how=`Accepted after ${moves} moves.`;
        else if(r.out==="reject") how=`Halted after ${moves} moves in ${qn(r.why?r.why.q:"q?")} reading ${r.why?r.why.s:"?"}: no entry, so reject.`;
        else { const cert=certify(r.steps.slice(0,400)); how=cert?(cert.kind==="repeat"?`Certified loop: the configuration at move ${cert.i} comes back exactly at move ${cert.j}.`:`Certified loop: at moves ${cert.i} and ${cert.j} it is in ${qn(r.steps[cert.j].q)} on blank tape, further right, and never looked back in between.`):`Still running after 2000 moves, and neither certificate fires. The simulator cannot tell; you can.`; }
        if(P.slow){ const early=T.run(M,P.w,40); if(early.out==="loop") how+=` After 40 moves it was still running.`; }
        c.classList.add(ok?"right":"wrong"); c.appendChild(h("div","res",(ok?"Correct. ":"Not quite. ")+how)); c.appendChild(h("p","why",esc(P.why)));
        if(pd===PAIRS.length){ if(pk>=4) Atlas.stamp("halt","predict"); else Atlas.toast(`${pk} of ${PAIRS.length}. Reload the stop to try again.`); } }; });
    grid.appendChild(c); });

  /* ---------- diagonal ---------- */
  const b3=block(root,"Challenge","The table no machine can fill","diag");
  b3.appendChild(h("p","idea",`Suppose a decider H for HALT exists. Then we could fill this table: row Mᵢ, column ⟨Mⱼ⟩, does Mᵢ halt on the description of Mⱼ? Build the machine D: on input ⟨Mᵢ⟩ it asks H, then does the <b>opposite</b> of Mᵢ on its own description. Click D's cells.</p>`.replace("</p>","")));
  const TAB=[["H","∞","H","H","∞"],["∞","∞","H","∞","H"],["H","H","H","∞","∞"],["∞","H","∞","∞","H"],["H","∞","∞","H","H"]];
  const tw=h("div","tablewrap"); b3.appendChild(tw); const tb=h("table","dt diag"); tw.appendChild(tb);
  const D=TAB.map(()=>null);
  const msg=h("div"); b3.appendChild(msg);
  function draw(){ tb.innerHTML=`<tr><th></th>${TAB.map((_,j)=>`<th>⟨M${SUB[j+1]}⟩</th>`).join("")}</tr>`+TAB.map((r,i)=>`<tr><th>M${SUB[i+1]}</th>${r.map((v,j)=>`<td class="${i===j?"dg":""}">${v}</td>`).join("")}</tr>`).join("")+
      `<tr class="drow"><th>D</th>${D.map((v,j)=>`<td><button type="button" class="btn mini" data-j="${j}">${v||"?"}</button></td>`).join("")}</tr>`;
    tb.querySelectorAll("button").forEach(b=>b.onclick=()=>{ const j=+b.dataset.j; D[j]=D[j]==="H"?"∞":"H"; draw(); check(); }); }
  function check(){ if(D.some(v=>!v)){ msg.innerHTML=""; return; }
    const bad=D.map((v,j)=>v===TAB[j][j]?j:-1).filter(j=>j>=0);
    if(bad.length){ msg.innerHTML=`<div class="note bad">D must differ from M${SUB[bad[0]+1]} on ⟨M${SUB[bad[0]+1]}⟩: the diagonal cell says ${TAB[bad[0]][bad[0]]}, so D does the opposite.</div>`; return; }
    msg.innerHTML=`<div class="note good"><b>D differs from every Mᵢ on input ⟨Mᵢ⟩.</b> So D is not any row of the table. But D is a Turing machine (it only runs H and then halts or loops), so it must be a row of a table that lists every machine. That row is ⟨D⟩'s own: what does D do on ⟨D⟩?</div>`;
    Atlas.stamp("halt","diag"); self.style.display=""; }
  const self=h("div","panel"); self.style.display="none"; b3.appendChild(self);
  self.innerHTML=`<div class="ph"><h2>Run D on ⟨D⟩</h2></div><p class="idea">D on ⟨D⟩ asks H whether D halts on ⟨D⟩, then does the opposite. Pick a case.</p>`;
  const so=h("div","opts"); self.appendChild(so); const sr=h("div"); self.appendChild(sr); const tried=new Set();
  [["halts","Suppose D halts on ⟨D⟩","Then H accepts ⟨D, ⟨D⟩⟩, so D does the opposite and <b>loops</b>. It halts and loops: impossible."],
   ["loops","Suppose D runs forever on ⟨D⟩","Then H rejects ⟨D, ⟨D⟩⟩, so D does the opposite and <b>halts</b>. It loops and halts: impossible."]].forEach(([k,l,t])=>{
    const b=h("button","opt",l); b.type="button"; so.appendChild(b); b.onclick=()=>{ tried.add(k); b.classList.add("sel");
      sr.innerHTML=`<div class="note bad">${t}</div>`+(tried.size===2?`<div class="note good">Both cases contradict. Nothing was wrong with D's construction, so the assumption is what fails: <b>no Turing machine H decides HALT.</b> ∎</div>`:"");
      if(tried.size===2) Atlas.stamp("halt","self"); }; });
  draw();

  /* ---------- order the proof ---------- */
  const b4=block(root,"Challenge","Put the proof in order","order");
  b4.appendChild(h("p","idea",`Click the lines in the order they belong in a written proof.`));
  const LINES=["Suppose, for contradiction, that a Turing machine H decides HALT: it always halts, and accepts ⟨M, w⟩ exactly when M halts on w.",
    "Build D: on input ⟨M⟩, run H on ⟨M, ⟨M⟩⟩.",
    "If H accepts, D loops forever. If H rejects, D halts.",
    "Run D on its own description ⟨D⟩.",
    "D halts on ⟨D⟩ ⟺ H rejects ⟨D, ⟨D⟩⟩ ⟺ D does not halt on ⟨D⟩.",
    "Contradiction. No such H exists, so HALT is undecidable. ∎"];
  const op=h("div","ordlist"); b4.appendChild(op); const done=h("ol","proofdone"); b4.appendChild(done); const om=h("div"); b4.appendChild(om);
  let next=0, miss=0; const sh=LINES.map((l,i)=>i).sort(()=>Math.random()-.5); if(sh.every((v,i)=>v===i)) sh.reverse();
  sh.forEach(i=>{ const b=h("button","opt ordl",esc(LINES[i])); b.type="button"; op.appendChild(b);
    b.onclick=()=>{ if(i===next){ b.remove(); done.appendChild(h("li",null,esc(LINES[i]))); next++; om.innerHTML="";
        if(next===LINES.length){ om.innerHTML=`<div class="note good">The proof is in order${miss?` (${miss} wrong click${miss>1?"s":""})`:""}. Note the shape: the same as every pumping proof, an assumption that is refuted at the end.</div>`; Atlas.stamp("halt","order"); } }
      else { miss++; om.innerHTML=`<div class="note bad">Not yet. ${next===0?"A proof by contradiction starts with what it supposes.":"What does the line before need next?"}</div>`; } }; });

  /* ---------- sort ---------- */
  const b5=block(root,"The map's last region","Decidable, recognisable, or neither","sort");
  b5.appendChild(h("p","idea",`Going up the hierarchy buys expressive power and costs decidability (Session 22). Place each problem.`));
  const BINS=["Decidable","Recognisable, not decidable","Not even recognisable"];
  const SO=[
    {l:"{ aⁿbⁿcⁿ }", a:0, why:"Session 25's three-marker machine halts on every input."},
    {l:"Is w ∈ L(G), for a CFG G?", a:0, why:"Convert to CNF and run CYK, O(n³). Session 24."},
    {l:"Do two DFAs accept the same language?", a:0, why:"Minimise both and compare. Every DFA question was decidable."},
    {l:"Is L(G) empty, for a CFG G?", a:0, why:"Empty exactly when S is not generating. Session 18's Lemma 1."},
    {l:"HALT = { ⟨M, w⟩ : M halts on w }", a:1, why:"Simulate and accept if it halts: that recognises it. The diagonal argument shows nothing decides it."},
    {l:"Is the CFG G ambiguous?", a:1, why:"Undecidable (Session 22's list). Searching strings for two leftmost derivations finds ambiguity when it exists, so it is recognisable."},
    {l:"HALT′ = { ⟨M, w⟩ : M does not halt on w }", a:2, why:"If HALT and its complement were both recognisable, run both recognisers side by side: one must accept, and that would decide HALT."}
  ];
  const sg=h("div","qf"); b5.appendChild(sg); let sd=0, sk=0;
  SO.forEach(it=>{ const c=h("div","qf-card"); c.appendChild(h("div","who","Which class?")); c.appendChild(h("p","claim",esc(it.l)));
    const row=h("div","row route"); c.appendChild(row);
    BINS.forEach((o,i)=>{ const bt=h("button","btn",o); bt.type="button"; row.appendChild(bt);
      bt.onclick=()=>{ row.querySelectorAll("button").forEach(x=>x.disabled=true); bt.classList.add("sel"); const ok=i===it.a; sd++; if(ok) sk++;
        c.classList.add(ok?"right":"wrong"); c.appendChild(h("div","res",(ok?"Correct. ":"Not quite. ")+BINS[it.a]+".")); c.appendChild(h("p","why",esc(it.why)));
        if(sd===SO.length){ if(sk>=5) Atlas.stamp("halt","sort"); else Atlas.toast(`${sk} of ${SO.length}. Reload the stop to try again.`); } }; }); sg.appendChild(c); });

  /* ---------- claims ---------- */
  const b6=block(root,"How it goes wrong","Running forever is not rejecting","claims");
  quickFire(b6,[
    {claim:"“My machine halted on every input up to length 9, so it is a decider.”", ok:false, why:"Finitely many tests are evidence. A decider halts on all infinitely many inputs; that needs an argument, such as a count that strictly decreases."},
    {claim:"“A machine that runs forever on w has rejected w.”", ok:false, why:"It has done neither. Rejecting is halting in a state with no entry. Running forever is the third outcome."},
    {claim:"“Simulate M on w and report what happens: that decides HALT.”", ok:false, why:"That recognises HALT. When M runs forever the simulation runs forever too, so it never says no."},
    {claim:"“Undecidable means that for some machines nobody can tell whether they halt.”", ok:false, why:"It means no single algorithm answers correctly for every ⟨M, w⟩. Particular instances, like the bouncer, are easy."},
    {claim:"“Every decidable language is recursively enumerable.”", ok:true, why:"A decider recognises its language too. The converse fails, and HALT is the witness."},
    {claim:"“Membership is decidable for CFGs but not for Turing machines.”", ok:true, why:"CYK answers w ∈ L(G). For TMs, w ∈ L(M) is as hard as halting: going up a level cost membership."},
    {claim:"“A faster computer with more memory could decide HALT.”", ok:false, why:"The argument never mentions speed or memory. D defeats every H, however it is built."},
    {claim:"“D's construction is the faulty step, not the assumption about H.”", ok:false, why:"D only runs H and then halts or loops: a legal machine if H is. The only assumption made was that H exists."}
  ],(c,n)=>{ if(c>=n-1) Atlas.stamp("halt","claims"); else Atlas.toast(`${c} of ${n} right. Reload the stop to try again.`); });
};
})();
