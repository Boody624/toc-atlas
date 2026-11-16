/* Station: Moore and Mealy machines (S7) */
"use strict";
(function(){
Atlas.stations.mm.stamps=[{id:"run",label:"Ran both kinds"},{id:"m2m",label:"Moore to Mealy"},{id:"pairs",label:"Pair construction"},{id:"claims",label:"Transducer claims"}];
const MS=[
  {id:"mod3", type:"moore", name:"Remainder mod 3", tag:"Moore · S7 walkthrough", note:"Reads a binary number, most significant bit first, and prints the remainder so far. δ(q, b) = (2q + b) mod 3.",
   states:["r0","r1","r2"], sigma:["0","1"], out:["0","1","2"], start:"r0", delta:{r0:{0:"r0",1:"r1"},r1:{0:"r2",1:"r0"},r2:{0:"r1",1:"r2"}}, lam:{r0:"0",r1:"1",r2:"2"}, ex:["1101","110","111"]},
  {id:"ab", type:"moore", name:"Last two symbols were ab", tag:"Moore · in-class activity", note:"Prints Y exactly when the last two symbols read were ab, and N otherwise.",
   states:["q0","qa","qab"], sigma:["a","b"], out:["N","Y"], start:"q0", delta:{q0:{a:"qa",b:"q0"},qa:{a:"qa",b:"qab"},qab:{a:"qa",b:"q0"}}, lam:{q0:"N",qa:"N",qab:"Y"}, ex:["abab","aab","bba"]},
  {id:"cnt", type:"moore", name:"Count the b's mod 3", tag:"Moore · practice question", note:"After each symbol it prints the number of b's read so far, modulo 3.",
   states:["c0","c1","c2"], sigma:["a","b"], out:["0","1","2"], start:"c0", delta:{c0:{a:"c0",b:"c1"},c1:{a:"c1",b:"c2"},c2:{a:"c2",b:"c0"}}, lam:{c0:"0",c1:"1",c2:"2"}, ex:["babba","bbb","aab"]},
  {id:"par", type:"mealy", name:"Running parity", tag:"Mealy · S7 walkthrough", note:"After every symbol it prints the parity of the number of 1s so far. e = even so far, o = odd so far.",
   states:["e","o"], sigma:["0","1"], out:["0","1"], start:"e", delta:{e:{0:"e",1:"o"},o:{0:"o",1:"e"}}, lam:{e:{0:"0",1:"1"},o:{0:"1",1:"0"}}, ex:["1011","1101","000"]},
  {id:"shift", type:"mealy", name:"Shift register", tag:"Mealy · practice question", note:"Prints the previous input symbol, and 0 first. That shifts the input one place right: it divides the binary number by two.",
   states:["S0","S1"], sigma:["0","1"], out:["0","1"], start:"S0", delta:{S0:{0:"S0",1:"S1"},S1:{0:"S0",1:"S1"}}, lam:{S0:{0:"0",1:"0"},S1:{0:"1",1:"1"}}, ex:["1101","1000","0110"]}
];
const isMoore=M=>M.type==="moore";
const nm=(M,q)=>isMoore(M)?q+"/"+M.lam[q]:q;
const diagram=(box,M,maxH)=>drawFA(box,{states:M.states.map(q=>nm(M,q)),start:nm(M,M.start),accept:[],edges:M.states.flatMap(q=>M.sigma.map(a=>({from:nm(M,q),to:nm(M,M.delta[q][a]),label:isMoore(M)?a:a+"/"+M.lam[q][a]})))},{maxH:maxH||240});
function runM(M,w){ let q=M.start; const qs=[q], out=isMoore(M)?[M.lam[q]]:[]; for(const c of w){ if(!isMoore(M)) out.push(M.lam[q][c]); q=M.delta[q][c]; if(isMoore(M)) out.push(M.lam[q]); qs.push(q); } return {qs,out}; }
const toMealy=M=>({type:"mealy",states:M.states,sigma:M.sigma,out:M.out,start:M.start,delta:M.delta,lam:Object.fromEntries(M.states.map(q=>[q,Object.fromEntries(M.sigma.map(a=>[a,M.lam[M.delta[q][a]]]))]))});
function toMoore(M,c0){ const pairs=M.states.flatMap(q=>M.out.map(c=>q+","+c)); const d={}, lam={}; pairs.forEach(p=>{ const [q,c]=p.split(","); lam[p]=c; d[p]={}; M.sigma.forEach(a=>d[p][a]=M.delta[q][a]+","+M.lam[q][a]); });
  const start=M.start+","+c0, seen=[start]; for(let i=0;i<seen.length;i++) M.sigma.forEach(a=>{ const t=d[seen[i]][a]; if(!seen.includes(t)) seen.push(t); });
  return {pairs,delta:d,lam,start,reach:pairs.filter(p=>seen.includes(p))}; }
const br=p=>"["+p.replace(",",", ")+"]";
const sel=(opts,lab)=>{ const s=document.createElement("select"); s.setAttribute("aria-label",lab); s.innerHTML=`<option value="">?</option>`+opts.map(o=>`<option value="${esc(o.v)}">${esc(o.t)}</option>`).join(""); return s; };

Atlas.stations.mm.mount=function(root){
  const b1=block(root,"The idea","Machines that write, not just judge","idea");
  const two=h("div","two"); b1.appendChild(two);
  two.appendChild(h("div","panel",`<div class="ph"><h2>A finite automaton with output</h2></div><div class="prose">
    <p><code>M = ( Q, Σ, Δ, δ, λ, q₀ )</code>. Six components, not five. Q, Σ, δ and q₀ are exactly a DFA's. New: <b>Δ</b>, the output alphabet, and <b>λ</b>, the output function.</p>
    <p>What is gone is <b>F</b>. A transducer has no accepting states, because it is not deciding anything. A double circle here is an error.</p>
    <p>The same finite control, but the answer is a string instead of one bit.</p></div>`));
  two.appendChild(h("div","panel",`<div class="ph"><h2>Where λ lives</h2></div><div class="tablewrap"><table class="dt" style="width:100%">
    <tr><th></th><th>Moore</th><th>Mealy</th></tr>
    <tr><th>λ</th><td>Q → Δ</td><td>Q × Σ → Δ</td></tr>
    <tr><th>written on</th><td>the state: q / c</td><td>the arrow: a / c</td></tr>
    <tr><th>output length</th><td>|w| + 1</td><td>|w|</td></tr>
    <tr><th>on ε</th><td>λ(q₀), one symbol</td><td>nothing at all</td></tr></table></div>
    <p class="idea" style="margin:10px 0 0"><b>Equivalent</b> means: the Mealy output equals the Moore output with its first symbol removed, for every w. Count the length before you write the output.</p>`));

  const mt=h("div","machines"); root.appendChild(mt);
  const host=h("div","view"); root.appendChild(host); const ran=new Set();
  function show(M){ [...mt.children].forEach(t=>t.setAttribute("aria-selected", t.dataset.id===M.id?"true":"false")); host.innerHTML=""; const moore=isMoore(M);
    /* ---------- lab ---------- */
    const b2=block(host,"Lab","Watch the output being written","lab");
    const p=h("div","panel run"); b2.appendChild(p);
    p.innerHTML=`<div class="ph"><h2>${esc(M.name)}</h2><span class="hint">${esc(M.note)}</span></div>`;
    const top=h("div","controls"); p.appendChild(top);
    const ib=h("div","inputbox"); ib.innerHTML=`<label for="mmIn">Input w</label><input id="mmIn" autocomplete="off" spellcheck="false" maxlength="12">`; top.appendChild(ib); const inp=ib.querySelector("input"); inp.value=M.ex[0];
    const exs=h("div","examples"); top.appendChild(exs); M.ex.forEach(x=>{ const b=h("button","ex",esc(x)); b.type="button"; b.onclick=()=>{ inp.value=x; reset(); }; exs.appendChild(b); });
    const row=h("div","row"); top.appendChild(row); const bBack=h("button","btn","Back"), bStep=h("button","btn primary","Read one symbol"), bAll=h("button","btn","Run to the end"); [bBack,bStep,bAll].forEach(b=>{ b.type="button"; row.appendChild(b); });
    const tape=h("div","tape"); p.appendChild(tape); const dia=h("div","diagram"); p.appendChild(dia); const hd=diagram(dia,M);
    p.appendChild(h("div","dlabel","Output so far")); const outEl=h("div","seq"); p.appendChild(outEl);
    const narr=h("div","narr"); narr.innerHTML=`<span class="step">λ</span><p></p>`; p.appendChild(narr);
    let w="", r=null, t=0;
    function reset(){ w=[...inp.value.replace(/\s+/g,"")].filter(c=>M.sigma.includes(c)).join(""); r=runM(M,w); t=0; render(false); }
    function render(anim){ const chars=[...w], n=chars.length, last=t===n; tape.innerHTML=""; chars.forEach((c,i)=>tape.appendChild(h("div","cell"+(i<t?" read":"")+(i===t?" head":""),esc(c)))); tape.appendChild(h("div","cell end"+(last?" head":""),"end"));
      hd.setState(nm(M,r.qs[t]),"cur"); if(t>0) hd.edge(nm(M,r.qs[t-1]),nm(M,r.qs[t]),anim); else hd.clearEdge();
      const shown=r.out.slice(0,moore?t+1:t); outEl.innerHTML=shown.length?shown.map((c,i)=>`<span class="${i===shown.length-1?"cur":""}">${esc(c)}</span>`).join(""):`<em>nothing yet</em>`;
      const pp=narr.querySelector("p");
      if(t===0) pp.innerHTML= moore ? `Before reading anything the machine is in ${esc(M.start)}, so it prints λ(${esc(M.start)}) = <b>${esc(M.lam[M.start])}</b>. A Moore machine always prints one symbol up front.` : `Before reading anything a Mealy machine has taken no arrow, so it has printed <b>nothing</b>.`;
      else { const q=r.qs[t-1], c=chars[t-1], q2=r.qs[t]; pp.innerHTML= moore ? `δ(${esc(q)}, ${esc(c)}) = ${esc(q2)}. Now in ${esc(q2)}, print λ(${esc(q2)}) = <b>${esc(M.lam[q2])}</b>. The output comes from where it landed.` : `Take the arrow ${esc(q)} —${esc(c)}/${esc(M.lam[q][c])}→ ${esc(q2)} and print λ(${esc(q)}, ${esc(c)}) = <b>${esc(M.lam[q][c])}</b>. One symbol per arrow taken.`; }
      if(last){ pp.innerHTML+=`<span class="why" style="color:var(--ink);font-weight:600">|w| = ${n}, so the output has ${moore?n+" + 1 = "+(n+1):n} symbol${(moore?n+1:n)===1?"":"s"}: ${esc(r.out.join(" "))||"ε"}.</span>`; if(n>0){ ran.add(M.type); if(ran.size===2) Atlas.stamp("mm","run"); } }
      bBack.disabled=t===0; bStep.disabled=bAll.disabled=last; }
    bStep.onclick=()=>{ t++; render(true); }; bBack.onclick=()=>{ t--; render(false); }; bAll.onclick=()=>{ t=[...w].length; render(false); }; inp.addEventListener("input",reset); reset();
    if(ran.size<2) p.appendChild(h("p","idea",`Run one Moore machine and one Mealy machine to the end for the first stamp.`));

    if(moore){ /* ---------- Moore -> Mealy ---------- */
      const b3=block(host,"Challenge","Moore → Mealy: move every output onto an arrow","conv");
      const cp=h("div","panel"); b3.appendChild(cp); const T=toMealy(M);
      cp.innerHTML=`<div class="ph"><h2>Give all ${M.states.length*M.sigma.length} values of λ′</h2><span class="hint">Keep Q, Σ, Δ, δ and q₀ exactly as they are</span></div>
        <p class="idea" style="margin:0 0 8px">λ: ${M.states.map(q=>`λ(${esc(q)}) = ${esc(M.lam[q])}`).join(", ")}. &nbsp; δ: ${M.states.map(q=>M.sigma.map(a=>`δ(${esc(q)}, ${esc(a)}) = ${esc(M.delta[q][a])}`).join(", ")).join(" · ")}</p>`;
      const tb=h("table","dt"), tw=h("div","tablewrap"); tw.appendChild(tb); cp.appendChild(tw); tb.innerHTML=`<tr><th>λ′</th>${M.sigma.map(a=>`<th>on ${esc(a)}</th>`).join("")}</tr>`; const cells=[];
      M.states.forEach(q=>{ const tr=h("tr"); tr.appendChild(h("th",null,esc(q))); M.sigma.forEach(a=>{ const td=h("td"); const s=sel(M.out.map(c=>({v:c,t:c})),`λ′(${q}, ${a})`); td.appendChild(s); tr.appendChild(td); cells.push({td,s,q,a}); }); tb.appendChild(tr); });
      const rw=h("div","row"); rw.style.marginTop="10px"; cp.appendChild(rw); const ck=h("button","btn primary","Check"); ck.type="button"; rw.appendChild(ck); const out=h("div"); out.style.marginTop="10px"; cp.appendChild(out); let tries=0;
      ck.onclick=()=>{ tries++; const bad=cells.filter(x=>x.s.value!==T.lam[x.q][x.a]); cells.forEach(x=>x.td.className=bad.includes(x)?"no":"ok");
        if(bad.length){ const x=bad[0]; const wrongEnd=bad.some(y=>y.s.value===M.lam[y.q]&&M.lam[y.q]!==T.lam[y.q][y.a]);
          out.innerHTML=`<div class="note bad"><b>${bad.length} wrong.</b> ${wrongEnd?"You are labelling from the wrong end: that is λ(q), the state the arrow leaves. ":""}The arrow takes the output of the state it <b>lands</b> in: λ′(${esc(x.q)}, ${esc(x.a)}) = λ( δ(${esc(x.q)}, ${esc(x.a)}) ) = λ(${esc(M.delta[x.q][x.a])}).</div>`; return; }
        ck.disabled=true; cells.forEach(x=>x.s.disabled=true); const w=M.ex[0], A=runM(M,w).out, B=runM(T,w).out;
        out.innerHTML=`<div class="note good"><b>All ${cells.length} are right${tries===1?", first try":""}.</b> Same states, same arrows, same picture: Moore → Mealy never changes |Q|. The circles are now bare.</div>
          <p class="idea" style="margin:10px 0 4px">The check, on ${esc(w)}: Moore prints <code><s>${esc(A[0])}</s> ${esc(A.slice(1).join(" "))}</code> (${A.length} symbols), Mealy prints <code>${esc(B.join(" "))}</code> (${B.length}). Remove the first Moore symbol and they agree.</p>`;
        const d=h("div","diagram"); out.appendChild(d); diagram(d,T,220); Atlas.stamp("mm","m2m"); };
    } else { /* ---------- Mealy -> Moore ---------- */
      const b3=block(host,"Challenge","Mealy → Moore: the pair construction","conv");
      const cp=h("div","panel"); b3.appendChild(cp); const T=toMoore(M,M.out[0]);
      cp.innerHTML=`<div class="ph"><h2>${M.states.length} × ${M.out.length} = ${T.pairs.length} pairs, before trimming</h2><span class="hint">δ′([q, c], a) = [ δ(q, a), λ(q, a) ] &nbsp;·&nbsp; λ′([q, c]) = c</span></div>
        <p class="idea" style="margin:0 0 8px">A Moore state has to know what to print, so each new state carries a symbol with it. Fill in where every pair goes, then tick the pairs that are reachable from the start state ${esc(br(T.start))} (taking c₀ = ${esc(M.out[0])}).</p>
        <p class="idea" style="margin:0 0 8px">The Mealy machine: ${M.states.map(q=>M.sigma.map(a=>`${esc(q)} —${esc(a)}/${esc(M.lam[q][a])}→ ${esc(M.delta[q][a])}`).join(", ")).join(" · ")}</p>`;
      const tb=h("table","dt"), tw=h("div","tablewrap"); tw.appendChild(tb); cp.appendChild(tw); tb.innerHTML=`<tr><th>pair</th><th>λ′</th>${M.sigma.map(a=>`<th>on ${esc(a)}</th>`).join("")}<th>reachable</th></tr>`; const cells=[], boxes=[];
      T.pairs.forEach(pr=>{ const tr=h("tr"); tr.appendChild(h("th",null,esc(br(pr)))); tr.appendChild(h("td",null,esc(T.lam[pr])));
        M.sigma.forEach(a=>{ const td=h("td"); const s=sel(T.pairs.map(x=>({v:x,t:br(x)})),`δ′(${br(pr)}, ${a})`); td.appendChild(s); tr.appendChild(td); cells.push({td,s,pr,a}); });
        const td=h("td"); const cb=document.createElement("input"); cb.type="checkbox"; cb.setAttribute("aria-label",br(pr)+" reachable"); td.appendChild(cb); tr.appendChild(td); boxes.push({td,cb,pr}); tb.appendChild(tr); });
      const rw=h("div","row"); rw.style.marginTop="10px"; cp.appendChild(rw); const ck=h("button","btn primary","Check"); ck.type="button"; rw.appendChild(ck); const out=h("div"); out.style.marginTop="10px"; cp.appendChild(out);
      ck.onclick=()=>{ const bad=cells.filter(x=>x.s.value!==T.delta[x.pr][x.a]); cells.forEach(x=>x.td.className=bad.includes(x)?"no":"ok");
        if(bad.length){ const x=bad[0], [q,c]=x.pr.split(","); boxes.forEach(b=>b.td.className="");
          out.innerHTML=`<div class="note bad"><b>${bad.length} transition${bad.length>1?"s":""} wrong.</b> For δ′(${esc(br(x.pr))}, ${esc(x.a)}): go where M goes, δ(${esc(q)}, ${esc(x.a)}) = ${esc(M.delta[q][x.a])}, and carry what M printed on the way, λ(${esc(q)}, ${esc(x.a)}) = ${esc(M.lam[q][x.a])}. The carried symbol ${esc(c)} is never consulted, so both rows for ${esc(q)} are identical.</div>`; return; }
        const badB=boxes.filter(b=>b.cb.checked!==T.reach.includes(b.pr)); boxes.forEach(b=>b.td.className=badB.includes(b)?"no":"ok");
        if(badB.length){ out.innerHTML=`<div class="note bad"><b>The transitions are right, the reachability is not.</b> Start at ${esc(br(T.start))} and follow your own table until no new pair appears. Never assume the trimming step will fire, and never assume it will not.</div>`; return; }
        ck.disabled=true; cells.forEach(x=>x.s.disabled=true); boxes.forEach(b=>b.cb.disabled=true); const dead=T.pairs.filter(x=>!T.reach.includes(x));
        const Mo={type:"moore",states:T.reach,sigma:M.sigma,out:M.out,start:T.start,delta:T.delta,lam:T.lam}; const w=M.ex[0], A=runM(Mo,w).out, B=runM(M,w).out;
        out.innerHTML=`<div class="note good"><b>${T.pairs.length} pairs generated, ${T.reach.length} survive.</b> ${dead.length?`Delete ${dead.map(br).map(esc).join(" and ")}: every transition into a state prints the same symbol here, so the other pairing can never arise.`:`Nothing is deleted this time. A state can be entered on arrows that print different symbols, so both of its pairs are needed. This direction can cost states, and Moore → Mealy never does: the two constructions are not symmetric.`}</div>
          <p class="idea" style="margin:10px 0 4px">The check, on ${esc(w)}: Mealy prints <code>${esc(B.join(" "))}</code> (${B.length} symbols), Moore prints <code><s>${esc(A[0])}</s> ${esc(A.slice(1).join(" "))}</code> (${A.length}). c₀ only ever decides that first, discarded symbol, which is why any choice of c₀ works.</p>`;
        const d=h("div","diagram"); out.appendChild(d);
        drawFA(d,{states:T.reach.map(x=>x),start:T.start,accept:[],edges:T.reach.flatMap(x=>M.sigma.map(a=>({from:x,to:T.delta[x][a],label:a})))},{maxH:240});
        out.appendChild(h("p","hint","Each circle is a pair q,c and prints its own second component.")); Atlas.stamp("mm","pairs"); };
    }
  }
  MS.forEach(M=>{ const t=h("button","tab",`<b>${esc(M.name)}</b><span>${esc(M.tag)}</span>`); t.type="button"; t.dataset.id=M.id; t.onclick=()=>show(M); mt.appendChild(t); });
  show(MS[0]);

  const b6=block(root,"How it goes wrong","Right or wrong? Decide before you look.","claims");
  quickFire(b6,[
    {claim:"“On input ab, a Mealy machine prints three symbols.”", ok:false, why:"A Mealy machine prints once per arrow taken, and it takes |w| = 2 arrows. Three symbols is the Moore machine's count: the extra one is printed before any input is read."},
    {claim:"“Moore → Mealy: λ′(q, a) = λ(q), the output of the state the arrow leaves.”", ok:false, why:"That labels from the wrong end. The arrow inherits the output of the state it lands in: λ′(q, a) = λ( δ(q, a) )."},
    {claim:"“Two machines are equivalent only if they print exactly the same string on every input.”", ok:false, why:"Take w = ε: Mealy prints nothing and Moore prints λ(q₀). With that definition no Moore machine would equal any Mealy machine. Equivalence drops the first Moore symbol."},
    {claim:"“In the pair construction, the choice of c₀ cannot affect whether the result is equivalent.”", ok:true, why:"c₀ appears only as the first symbol printed. δ′ never mentions c, and the first symbol is exactly what the definition of equivalence discards."},
    {claim:"“The answer to a Mealy → Moore question always has |Q| × |Δ| states.”", ok:false, why:"That is the count before trimming. Deleting unreachable pairs is step 5 of the recipe. Running parity keeps 2 of 4, the shift register keeps all 4, so it has to be checked every time."},
    {claim:"“Converting Mealy → Moore never needs more states than converting back.”", ok:false, why:"The directions are not symmetric. A Mealy output depends on the state and the symbol just read. A Moore machine has to store that extra dependency, and states are the only place it can store anything."},
    {claim:"“The state that prints Y should be drawn with a double circle.”", ok:false, why:"A transducer has no F. It is not accepting anything, so there are no double circles."}
  ], (c,n)=>{ if(c>=n-1) Atlas.stamp("mm","claims"); else Atlas.toast(`${c} of ${n} right. Reload the stop to try again.`); });
};
})();
