/* Station: NFAs and ε-moves (S4 to S6) */
"use strict";
(function(){
const E="ε";
Atlas.stations.nfa.stamps=[{id:"run",label:"Followed every path"},{id:"race",label:"Finished a Subset Race"},{id:"chains",label:"Closure Chains"},{id:"kill",label:"Killed the ε"},{id:"claims",label:"NFA claims"}];
const NS=[
  {id:"s4", name:"Two arrows on one symbol", tag:"S4 slides", note:"On a from s1 the machine may stay or move on. b from s0 has no arrow at all.",
   states:["s0","s1","s2"], sigma:["a","b"], start:"s0", accept:["s2"], delta:{s0:{a:["s1"]},s1:{a:["s1","s2"],b:["s1"]}}, ex:["aa","aba","abab","b","a"]},
  {id:"e01", name:"Ends with 01", tag:"S4 slides", note:"q0 loops on everything and guesses when the final 01 begins.",
   states:["q0","q1","q2"], sigma:["0","1"], start:"q0", accept:["q2"], delta:{q0:{0:["q0","q1"],1:["q0"]},q1:{1:["q2"]}}, ex:["01","1101","010","0011",""]},
  {id:"k3", name:"Third symbol from the end is 1", tag:"the k-th from the end family", note:"Four NFA states. Count the DFA states in the race below.",
   states:["q0","q1","q2","q3"], sigma:["0","1"], start:"q0", accept:["q3"], delta:{q0:{0:["q0"],1:["q0","q1"]},q1:{0:["q2"],1:["q2"]},q2:{0:["q3"],1:["q3"]}}, ex:["100","0111","1011","010","11"]},
  {id:"can", name:"0*1*2* with free moves", tag:"S5 canonical ε-NFA", note:"Two ε-arrows: q0 to q1, and q1 to q2. Each state loops on its own symbol.",
   states:["q0","q1","q2"], sigma:["0","1","2"], start:"q0", accept:["q2"], delta:{q0:{0:["q0"],[E]:["q1"]},q1:{1:["q1"],[E]:["q2"]},q2:{2:["q2"]}}, ex:["012","0212","","2","0011"]},
  {id:"chain", name:"The Closure Chains machine", tag:"S5 activity", note:"n1 and n2 form a two-state ε-cycle. L = { aᵐbⁿ : m + n ≥ 1 }.",
   states:["n0","n1","n2","n3","n4"], sigma:["a","b"], start:"n0", accept:["n4"], delta:{n0:{a:["n0"],[E]:["n1"]},n1:{b:["n3"],[E]:["n2"]},n2:{a:["n4"],[E]:["n1"]},n3:{[E]:["n4"]},n4:{b:["n4"]}}, ex:["aab","","ba","b","abb"]}
];
const eps=(N,q)=>((N.delta[q]||{})[E]||[]);
const hasE=N=>N.states.some(q=>eps(N,q).length);
const ecl=(N,S)=>{ const out=[...S]; for(let i=0;i<out.length;i++) eps(N,out[i]).forEach(t=>{ if(!out.includes(t)) out.push(t); }); return N.states.filter(q=>out.includes(q)); };
const edgesOf=N=>{ const o=nfaEdges(N); N.states.forEach(q=>eps(N,q).forEach(t=>o.push({from:q,to:t,label:E}))); return o; };
const same=(A,B)=>A.length===B.length&&A.every(x=>B.includes(x));
const meets=(N,S)=>S.some(q=>N.accept.includes(q));

/* a cell where the player builds a set by toggling states */
function picker(universe){ const el=h("div","setpick"); const on=new Set();
  universe.forEach(q=>{ const b=h("button",null,esc(q)); b.type="button"; b.setAttribute("aria-pressed","false"); b.onclick=()=>{ on.has(q)?on.delete(q):on.add(q); b.classList.toggle("on"); b.setAttribute("aria-pressed",on.has(q)); }; el.appendChild(b); });
  return {el, get:()=>universe.filter(q=>on.has(q)), lock(){ el.querySelectorAll("button").forEach(b=>b.disabled=true); }}; }

/* a fixed grid of set-valued cells, checked all at once */
function pickGrid(parent, o){ const tw=h("div","tablewrap"), tb=h("table","dt"); tw.appendChild(tb); parent.appendChild(tw); const cells=[];
  tb.innerHTML="<tr><th></th>"+o.cols.map(c=>`<th>${esc(c.label)}</th>`).join("")+"</tr>";
  o.rows.forEach(r=>{ const tr=h("tr"); tr.appendChild(h("th",null,esc(r.label)));
    (r.span?[{key:null}]:o.cols).forEach(c=>{ const td=h("td"); if(r.span) td.colSpan=o.cols.length; const p=picker(o.universe); td.appendChild(p.el); tr.appendChild(td); cells.push({td,p,want:o.answer(r.key,c.key),r,c}); }); tb.appendChild(tr); });
  const row=h("div","row"); row.style.marginTop="10px"; parent.appendChild(row); const out=h("div"); out.style.marginTop="10px"; parent.appendChild(out);
  const ck=h("button","btn primary","Check"); ck.type="button"; row.appendChild(ck); row.appendChild(h("span","hint","Leave a cell with nothing selected to answer ∅."));
  let tries=0;
  ck.onclick=()=>{ tries++; const bad=cells.filter(x=>!same(x.p.get(),x.want)); cells.forEach(x=>x.td.className=bad.includes(x)?"no":"ok");
    if(bad.length){ const x=bad[0]; out.innerHTML=`<div class="note bad"><b>${bad.length} cell${bad.length>1?"s":""} wrong</b> (red). A hint for one of them: ${o.hint(x.r.key,x.c.key,x.p.get(),x.want)}</div>`; }
    else { cells.forEach(x=>x.p.lock()); ck.disabled=true; out.innerHTML=`<div class="note good">${o.done}</div>`; o.onDone&&o.onDone(tries,out); } }; }

Atlas.stations.nfa.mount=function(root){
  const b1=block(root,"The idea","Machines that guess, and machines that move without reading","idea");
  const two=h("div","two"); b1.appendChild(two);
  two.appendChild(h("div","panel",`<div class="ph"><h2>The NFA: one change to δ</h2></div><div class="prose">
    <p>A DFA has exactly one arrow per state and symbol. An NFA may have <b>several, or none</b>: <code>δ : Q × Σ → P(Q)</code>, a set of states.</p>
    <p>It accepts w if <b>some</b> path on w ends in F. A path with no arrow to follow simply dies. It does not reject the string on behalf of the others.</p>
    <p>You never have to guess. Track the <b>set of live states</b>: every state some path could be in right now. That set is one DFA state, which is the whole subset construction, and the reason nondeterminism buys convenience but no extra power.</p></div>`));
  two.appendChild(h("div","panel",`<div class="ph"><h2>ε-moves: close, move, close</h2></div><ol class="recipe">
    <li><div>ε-CL(q) is every state reachable from q by zero or more ε-arrows.<small>zero is why q is always in its own closure</small></div></li>
    <li><div>Before reading anything, the live set is ε-CL(q₀).<small>the step everyone forgets</small></div></li>
    <li><div>On a symbol: apply δ to every live state and union the results.</div></li>
    <li><div>Then take the ε-closure of what you got.<small>never follow a real symbol while closing</small></div></li>
    <li><div>Accept if the last set meets F.<small>ε ∉ Σ: it labels an arrow, it is never a character of w</small></div></li></ol>`));

  const mt=h("div","machines"); root.appendChild(mt);
  const host=h("div","view"); root.appendChild(host); let stopTimer=null;
  Atlas.onCleanup(()=>{ if(stopTimer) stopTimer(); });
  function show(N){ if(stopTimer) stopTimer();
    [...mt.children].forEach(t=>t.setAttribute("aria-selected", t.dataset.id===N.id?"true":"false")); host.innerHTML=""; const withE=hasE(N);
    /* ---------- lab ---------- */
    const b2=block(host,"Lab","Follow every path at once","lab");
    const p=h("div","panel run"); b2.appendChild(p);
    p.innerHTML=`<div class="ph"><h2>${esc(N.name)}</h2><span class="hint">${esc(N.note)}</span></div>`;
    const top=h("div","controls"); p.appendChild(top);
    const ib=h("div","inputbox"); ib.innerHTML=`<label for="nfaIn">Input w</label><input id="nfaIn" autocomplete="off" spellcheck="false" maxlength="12">`; top.appendChild(ib); const inp=ib.querySelector("input"); inp.value=N.ex[0];
    const exs=h("div","examples"); top.appendChild(exs);
    const row=h("div","row"); top.appendChild(row);
    const bBack=h("button","btn","Back"), bStep=h("button","btn primary","Read one symbol"), bAll=h("button","btn","Run to the end"); [bBack,bStep,bAll].forEach(b=>{ b.type="button"; row.appendChild(b); });
    const tape=h("div","tape"); p.appendChild(tape);
    const dia=h("div","diagram"); p.appendChild(dia); const hd=drawFA(dia,{states:N.states,start:N.start,accept:N.accept,edges:edgesOf(N)},{maxH:250});
    const tw=h("div","tablewrap"); p.appendChild(tw); const narr=h("div","narr"); narr.innerHTML=`<span class="step">live</span><p></p>`; p.appendChild(narr);
    let w="", sets=[], moves=[], t=0; const seen=new Set();
    const run=str=>{ let S=ecl(N,[N.start]); const ss=[S], mm=[null]; for(const c of str){ const M=nfaMove(N,S,c); S=ecl(N,M); mm.push(M); ss.push(S); } return {ss,mm}; };
    const accepts=str=>{ const r=run(str); return meets(N,r.ss[r.ss.length-1]); };
    function reset(){ w=[...inp.value.replace(/\s+/g,"")].filter(c=>N.sigma.includes(c)).join(""); const r=run(w); sets=r.ss; moves=r.mm; t=0; render(); }
    function render(){ const chars=[...w]; tape.innerHTML=""; chars.forEach((c,i)=>tape.appendChild(h("div","cell"+(i<t?" read":"")+(i===t?" head":""),esc(c)))); tape.appendChild(h("div","cell end"+(t>=chars.length?" head":""),"end"));
      const last=t===chars.length, S=sets[t], acc=last&&meets(N,S);
      hd.setStates(S, last?(acc?"done-acc":"done-rej"):"cur");
      let html=`<table class="dt"><tr><th>read</th>${withE?"<th>move</th><th>then close</th>":"<th>live set</th>"}</tr><tr><th>start</th>${withE?`<td>{${esc(N.start)}}</td>`:""}<td>${esc(setName(sets[0]))}</td></tr>`;
      for(let i=1;i<=t;i++) html+=`<tr><th>${esc(chars[i-1])}</th>${withE?`<td>${esc(setName(moves[i]))}</td>`:""}<td>${esc(setName(sets[i]))}</td></tr>`;
      tw.innerHTML=html+"</table>";
      const st=narr.querySelector(".step"), pp=narr.querySelector("p");
      if(t===0){ st.textContent="start"; pp.innerHTML= withE ? `Before any input the live set is ε-CL(${esc(N.start)}) = <b>${esc(setName(S))}</b>, not {${esc(N.start)}}.` : `One live state: <b>${esc(N.start)}</b>.`; }
      else { const c=chars[t-1], prev=sets[t-1]; st.textContent="δ"; pp.innerHTML = prev.length ? prev.map(q=>`δ(${esc(q)}, ${esc(c)}) = ${esc(setName((N.delta[q]||{})[c]||[]))}`).join(" &nbsp;·&nbsp; ")+`<span class="why">Union: ${esc(setName(moves[t]))}${withE?`. Close it: <b>${esc(setName(S))}</b>`:""}. ${S.length?"":"Every path has died. ∅ is a real place to be, and nothing leaves it."}</span>` : `The live set is already ∅, so it stays ∅.`; }
      if(last){ pp.innerHTML+=`<span class="why" style="color:var(--ink);font-weight:600">Input exhausted. The live set ${acc?"contains "+esc(S.filter(q=>N.accept.includes(q)).join(", "))+", which is in F: ACCEPT. One surviving path is enough.":"contains no state of F: REJECT. No path made it."}</span>`;
        seen.add(acc?"y":"n"); if(seen.size===2) Atlas.stamp("nfa","run"); }
      bBack.disabled=t===0; bStep.disabled=bAll.disabled=last; }
    N.ex.forEach(x=>{ const ok=accepts(x); const b=h("button","ex",`${esc(x||EPS)}<small class="${ok?"y":"n"}">${ok?"✓":"✗"}</small>`); b.type="button"; b.onclick=()=>{ inp.value=x; reset(); }; exs.appendChild(b); });
    bStep.onclick=()=>{ t++; render(); }; bBack.onclick=()=>{ t--; render(); }; bAll.onclick=()=>{ t=[...w].length; render(); }; inp.addEventListener("input",reset); reset();

    /* ---------- Subset Race ---------- */
    const b3=block(host,"Challenge","Subset Race: build the DFA before the clock embarrasses you","race");
    const rp=h("div","panel"); b3.appendChild(rp);
    rp.innerHTML=`<div class="ph"><h2>${withE?"Subset construction, with closures":"Subset construction"}</h2><span class="timer" aria-live="off">0:00</span></div>
      <p class="idea" style="margin:0 0 8px">Each row is one DFA state, which is a set of ${withE?"ε-NFA":"NFA"} states. For the open row, select where each symbol sends the set${withE?" (move, then close)":""}, then check it. New sets become new rows. Only build what is reachable from the start.</p>`;
    const tm=rp.querySelector(".timer"); let t0=null, iv=null; const fmt=s=>Math.floor(s/60)+":"+String(s%60).padStart(2,"0");
    const tick=()=>{ tm.textContent=fmt(Math.floor((Date.now()-t0)/1000)); }; stopTimer=()=>{ clearInterval(iv); iv=null; };
    const startClock=()=>{ if(t0===null){ t0=Date.now(); iv=setInterval(tick,1000); } };
    const rtw=h("div","tablewrap"), rtb=h("table","dt"); rtw.appendChild(rtb); rp.appendChild(rtw); const rout=h("div"); rout.style.marginTop="10px"; rp.appendChild(rout);
    const truth=(S,a)=>ecl(N,nfaMove(N,S,a)); const list=[ecl(N,[N.start])]; let cur=0, miss=0;
    rtb.innerHTML=`<tr><th>DFA state</th>${N.sigma.map(a=>`<th>on ${esc(a)}</th>`).join("")}<th></th></tr>`;
    function openRow(){ const S=list[cur]; const tr=h("tr"); tr.appendChild(h("th",null,(cur===0?"→ ":"")+esc(setName(S)))); const ps=N.sigma.map(a=>{ const td=h("td"); const pk=picker(N.states); td.appendChild(pk.el); tr.appendChild(td); return {td,pk,a}; });
      pk0(ps); const td=h("td"); const ck=h("button","btn primary","Check row"); ck.type="button"; td.appendChild(ck); tr.appendChild(td); rtb.appendChild(tr);
      ck.onclick=()=>{ startClock(); const bad=ps.filter(x=>!same(x.pk.get(),truth(S,x.a))); ps.forEach(x=>x.td.className=bad.includes(x)?"no":"ok");
        if(bad.length){ miss++; const x=bad[0], M=nfaMove(N,S,x.a); rout.innerHTML=`<div class="note bad">On ${esc(x.a)}: go through the members of ${esc(setName(S))} one at a time and union what δ gives. ${S.length?S.map(q=>`δ(${esc(q)}, ${esc(x.a)}) = ${esc(setName((N.delta[q]||{})[x.a]||[]))}`).join(", ")+".":"∅ has no members, so nothing leaves it."}${withE&&M.length?" Then close the result.":""}</div>`; return; }
        rout.innerHTML=""; ps.forEach(x=>{ x.pk.lock(); x.td.textContent=setName(truth(S,x.a)); x.td.className="ok"; const T=truth(S,x.a); if(!list.some(y=>same(y,T))) list.push(T); }); td.textContent=meets(N,S)?"accepting":""; cur++;
        if(cur<list.length) openRow(); else finish(); }; }
    function pk0(ps){ ps.forEach(x=>x.pk.el.addEventListener("click",startClock)); }
    function finish(){ stopTimer(); const secs=t0?Math.floor((Date.now()-t0)/1000):0; const names="ABCDEFGHIJKLMNOP"; const nm=S=>names[list.findIndex(y=>same(y,S))];
      const D={states:list.map(nm),start:"A",accept:list.filter(S=>meets(N,S)).map(nm),edges:[]}; list.forEach(S=>N.sigma.forEach(a=>D.edges.push({from:nm(S),to:nm(truth(S,a)),label:a})));
      rout.innerHTML=`<div class="note good"><b>Done in ${fmt(secs)}${miss?` with ${miss} wrong row check${miss>1?"s":""}`:" with no wrong checks"}.</b> ${list.length} reachable set${list.length>1?"s":""} out of 2<sup>${N.states.length}</sup> = ${2**N.states.length} possible. A set is accepting when it contains at least one accepting state${list.some(S=>!S.length)?", and ∅ is the dead state":""}.${N.id==="k3"?" Here every one of the 8 sets is needed: the DFA must remember the last three symbols. For k-th from the end the NFA has k + 1 states and the DFA 2ᵏ. That is the price of determinism, paid in size, never in power.":""}</div>
        <div class="blocks" style="margin:10px 0">${list.map((S,i)=>`<span class="blockchip b${i%6}"><span class="bnum c${i%6}">${names[i]}</span>${esc(setName(S))}</span>`).join("")}</div>`;
      if(list.length<=8){ const d=h("div","diagram"); rout.appendChild(d); drawFA(d,D,{maxH:260}); }
      Atlas.stamp("nfa","race"); }
    openRow();
  }
  NS.forEach(N=>{ const t=h("button","tab",`<b>${esc(N.name)}</b><span>${esc(N.tag)}</span>`); t.type="button"; t.dataset.id=N.id; t.onclick=()=>show(N); mt.appendChild(t); });
  show(NS[0]);

  /* ---------- Closure Chains ---------- */
  const C=NS[4];
  const b4=block(root,"Challenge","Closure Chains: five closures, one cycle","chains");
  const cp=h("div","panel"); b4.appendChild(cp);
  cp.innerHTML=`<div class="ph"><h2>Compute ε-CL(q) for every state</h2><span class="hint">ε: n0 → n1, n1 → n2, n2 → n1, n3 → n4</span></div>`;
  const cd=h("div","diagram"); cp.appendChild(cd); drawFA(cd,{states:C.states,start:C.start,accept:C.accept,edges:edgesOf(C)},{maxH:250});
  pickGrid(cp,{rows:C.states.map(q=>({key:q,label:"ε-CL("+q+")"})), cols:[{key:"c",label:"closure"}], universe:C.states, answer:q=>ecl(C,[q]),
    hint:(q,_,got,want)=>!got.includes(q)?`ε-CL(${q}) must contain ${q} itself. Zero ε-arrows is a valid path.`:got.some(x=>!want.includes(x))?`in ε-CL(${q}) you followed something that is not an ε-arrow, or followed one backwards. Closures only go forwards, and never along a real symbol.`:`for ε-CL(${q}), keep going until the set stops growing. One hop is not enough.`,
    done:"<b>All five are right.</b> n1 and n2 agree because each reaches the other for free. n0 does not join them: it can reach the cycle, but the cycle cannot reach back. And ε-CL(n0) misses n4, so ε is not accepted.",
    onDone:()=>Atlas.stamp("nfa","chains")});

  /* ---------- Kill the ε ---------- */
  const K=NS[3];
  const b5=block(root,"Challenge","Kill the ε: turn the ε-NFA into a plain NFA","kill");
  const kp=h("div","panel"); b5.appendChild(kp);
  kp.innerHTML=`<div class="ph"><h2>δ′(q, a) = ε-CL( δ( ε-CL(q), a ) )</h2><span class="hint">Close, move, close. Once per state, per symbol.</span></div>
    <p class="idea" style="margin:0 0 8px">The machine is 0*1*2*: q0 →ε q1 →ε q2, each state looping on its own symbol, F = { q2 }. Q, Σ and q₀ do not change. Fill in δ′, then the new accepting set F′.</p>`;
  const kd=h("div","diagram"); kp.appendChild(kd); drawFA(kd,{states:K.states,start:K.start,accept:K.accept,edges:edgesOf(K)},{maxH:220});
  const kAns=(q,a)=> q==="F" ? K.states.filter(s=>K.accept.includes(s)||(s===K.start&&meets(K,ecl(K,[K.start])))) : ecl(K,nfaMove(K,ecl(K,[q]),a));
  pickGrid(kp,{rows:K.states.map(q=>({key:q,label:"δ′("+q+", ·)"})).concat([{key:"F",label:"F′",span:true}]), cols:K.sigma.map(a=>({key:a,label:"on "+a})), universe:K.states, answer:kAns,
    hint:(q,a,got,want)=> q==="F" ? `F′ = F, plus q₀ if ε-CL(q₀) meets F. Only the start state is ever added, because the one moment δ′ never covers is the moment before the first symbol.` : `δ′(${q}, ${a}): first ε-CL(${q}) = ${setName(ecl(K,[q]))}. Then read ${a} from every state in it: ${setName(nfaMove(K,ecl(K,[q]),a))}. Then close that.`,
    done:"<b>The ε-arrows are gone.</b> Same states, same start, same language. q0 joined F′ because ε-CL(q0) = {q0, q1, q2} meets F, so ε is still accepted. q1 did not: it is not the start state, and closing after every move already covers it.",
    onDone:(tries,out)=>{ const NN={states:K.states,sigma:K.sigma,start:K.start,accept:kAns("F"),delta:{}}; K.states.forEach(q=>{ NN.delta[q]={}; K.sigma.forEach(a=>NN.delta[q][a]=kAns(q,a)); });
      const d=h("div","diagram"); d.style.marginTop="10px"; out.appendChild(d); drawFA(d,{states:NN.states,start:NN.start,accept:NN.accept,edges:nfaEdges(NN)},{maxH:260});
      out.appendChild(h("p","idea","The chain is now complete: ε-NFA → NFA by this construction, NFA → DFA by the subset construction. Three kinds of machine, one class of languages.")); Atlas.stamp("nfa","kill"); }});

  const b6=block(root,"How it goes wrong","Right or wrong? Decide before you look.","claims");
  quickFire(b6,[
    {claim:"“An NFA accepts w only if every path on w ends in an accepting state.”", ok:false, why:"Some path, not every path. One surviving path that ends in F is enough."},
    {claim:"“If one path gets stuck with no arrow to follow, the NFA rejects the string.”", ok:false, why:"That path dies and the others carry on. The string is rejected only when no path at all ends in F."},
    {claim:"“The subset construction can need 2ⁿ states, which shows NFAs recognise more languages than DFAs.”", ok:false, why:"It shows the opposite: every NFA has an equivalent DFA. The cost of determinism is size, never power."},
    {claim:"“In the subset construction, ∅ is a legitimate DFA state.”", ok:true, why:"It is the dead state: every path has died, and every symbol leads from ∅ back to ∅."},
    {claim:"“ε-CL(q) = ∅ when q has no ε-arrows, because nothing is reachable.”", ok:false, why:"Zero ε-arrows is a valid path, so q is always in its own closure. With the wrong rule 0*1*2* would reject both ε and 2, silently."},
    {claim:"“Before reading any input, the live set of an ε-NFA is ε-CL(q₀), not { q₀ }.”", ok:true, why:"Free moves are available before the first symbol. This is the step everyone forgets."},
    {claim:"“ε is one more symbol of Σ that the machine can read.”", ok:false, why:"ε ∉ Σ. It is a label on an arrow, never a character in a string."},
    {claim:"“For ε-removal I can close only before the move in δ′, and still use F′ = F plus q₀.”", ok:false, why:"That mixes two methods. Closing only before the move needs F′ enlarged to every state whose closure meets F. With the mix, 0*1*2* rejects the string 1."}
  ], (c,n)=>{ if(c>=n-1) Atlas.stamp("nfa","claims"); else Atlas.toast(`${c} of ${n} right. Reload the stop to try again.`); });
};
})();
