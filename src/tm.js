/* Station: Turing machines (S25 slides file) */
"use strict";
(function(){
const SUB={"0":"₀","1":"₁","2":"₂","3":"₃","4":"₄","5":"₅","6":"₆","7":"₇","8":"₈","9":"₉"};
const qn=q=>q.replace(/\d/g,d=>SUB[d]);
/* delta given as rows "q0: a=q1,X,R b=... " */
function TM(o){ const d={}; o.rows.forEach(r=>{ const [q,rest]=r.split(":"); d[q.trim()]={}; rest.trim().split(/\s+/).filter(Boolean).forEach(e=>{ const [s,v]=e.split("="); d[q.trim()][s]=v.split(","); }); }); return {...o,delta:d,states:o.rows.map(r=>r.split(":")[0].trim()).concat(o.accept.filter(f=>!o.rows.some(r=>r.split(":")[0].trim()===f)))}; }
function run(M,w,cap){ cap=cap||600; const tape=[...w]; let h=0, q=M.start; const steps=[{q,h,tape:tape.slice()}];
  for(let n=0;n<cap;n++){ if(M.accept.includes(q)) return {steps,out:"accept"}; const s=tape[h]??"B", e=(M.delta[q]||{})[s];
    if(!e) return {steps,out:"reject",why:{q,s}}; tape[h]=e[1]; q=e[0]; h+=e[2]==="R"?1:-1; if(h<0) return {steps,out:"reject",fell:true};
    steps.push({q,h,tape:tape.slice(),e,from:steps[steps.length-1].q,read:s}); }
  return {steps,out:M.accept.includes(q)?"accept":"loop"}; }
function cfg(st){ const t=st.tape.slice(); while(t.length>st.h&&t[t.length-1]==="B") t.pop(); const a=t.slice(0,st.h); while(a.length<st.h) a.push("B"); return a.join("")+"<b class=qs>"+qn(st.q)+"</b>"+t.slice(st.h).join(""); }
const ent=(e)=>`(${qn(e[0])}, ${e[1]}, ${e[2]})`;

const MS=[
  TM({id:"anbn", name:"Last year's aⁿbⁿ", tag:"S25 walkthrough", start:"q0", accept:["q4"], gamma:["a","b","X","Y","B"], ex:["aabb","ab","abb","aab",""],
    note:"q₀ crosses the leftmost a, q₁ seeks the leftmost b, q₂ walks back to the X, q₃ checks the tail, q₄ accepts.",
    rows:["q0: a=q1,X,R Y=q3,Y,R","q1: a=q1,a,R b=q2,Y,L Y=q1,Y,R","q2: a=q2,a,L X=q0,X,R Y=q2,Y,L","q3: Y=q3,Y,R B=q4,B,R"]}),
  TM({id:"abc", name:"aⁿbⁿcⁿ, one more marker", tag:"S25 · no PDA can", start:"q0", accept:["q5"], gamma:["a","b","c","X","Y","Z","B"], ex:["abc","aabbcc","aabbc","abcc"],
    note:"The same recipe with a third marker. It costs 4n² + 3n + 1 moves on aⁿbⁿcⁿ.",
    rows:["q0: a=q1,X,R Y=q4,Y,R","q1: a=q1,a,R b=q2,Y,R Y=q1,Y,R","q2: b=q2,b,R c=q3,Z,L Z=q2,Z,R","q3: a=q3,a,L b=q3,b,L X=q0,X,R Y=q3,Y,L Z=q3,Z,L","q4: Y=q4,Y,R Z=q4,Z,R B=q5,B,R"]}),
  TM({id:"succ", name:"Unary successor", tag:"S25 · computes", start:"q0", accept:["q1"], gamma:["a","B"], ex:["aaa","a",""], computes:true,
    note:"Walk right over the a's; on the first blank write an a and halt. The answer is what is left on the tape.",
    rows:["q0: a=q0,a,R B=q1,a,R"]}),
  TM({id:"loop", name:"The one-line loop", tag:"S25 · the third outcome", start:"q0", accept:[], gamma:["a","B"], ex:["a","aa"],
    note:"δ(q₀, a) = (q₀, a, R) and nothing else? It halts on blanks. Add δ(q₀, B) = (q₀, B, R) and it walks right forever.",
    rows:["q0: a=q0,a,R B=q0,B,R"]})];
const WALK=TM({id:"walk", start:"q0", accept:["q6"], gamma:["0","1","X","Y","B"],
  rows:["q0: 0=q1,X,R 1=q2,X,R","q1: 0=q1,0,R 1=q1,1,R Y=q3,Y,L B=q3,B,L","q2: 0=q2,0,R 1=q2,1,R Y=q4,Y,L B=q4,B,L","q3: 0=q5,Y,L 1=q5,Y,L","q4: 0=q5,Y,L 1=q5,Y,L X=q6,X,R","q5: 0=q5,0,L 1=q5,1,L X=q0,X,R"]});

function deltaTable(M,cls){ const t=document.createElement("table"); t.className="dt tmd "+(cls||""); t.innerHTML=`<tr><th>δ</th>${M.gamma.map(s=>`<th>${s}</th>`).join("")}</tr>`+M.states.map(q=>`<tr><th>${qn(q)}${M.accept.includes(q)?" ∈ F":""}</th>${M.gamma.map(s=>{ const e=(M.delta[q]||{})[s]; return `<td data-q="${q}" data-s="${s}">${e?ent(e):""}</td>`; }).join("")}</tr>`).join(""); return t; }
function tapeView(box,st){ box.innerHTML=""; const n=Math.max(st.tape.length+2,st.h+3,8); for(let i=0;i<n;i++){ const c=st.tape[i]??"B"; box.appendChild(h("div","cell"+(i===st.h?" head":"")+(c==="B"?" blank":""),c==="B"?"B":esc(c))); } }

Atlas.stations.tm.stamps=[{id:"run",label:"Ran a machine"},{id:"walk",label:"Tape Walk"},{id:"design",label:"Found the missing entries"},{id:"claims",label:"Turing machine claims"}];
Atlas.stations.tm.mount=function(root){
  const b1=block(root,"The idea","A tape, and nothing else","idea");
  const two=h("div","two"); b1.appendChild(two);
  two.appendChild(h("div","panel",`<div class="ph"><h2>Three changes to the finite automaton</h2></div><div class="prose">
    <p>Read <b>and write</b>, move <b>left or right</b>, and an <b>unbounded</b> tape. <code>M = (Q, Σ, Γ, δ, q₀, B, F)</code> with <code>δ : Q × Γ → Q × Γ × {L, R}</code>.</p>
    <p>One move reads, writes, moves and changes state, all four, every time. To leave a cell alone, write back what was read. There is no stay direction.</p>
    <p>A configuration is <code>αqβ</code>: tape to the left, the state, then the tape from the head rightwards. The head reads β's first symbol. Start: <code>q₀w</code>.</p></div>`));
  two.appendChild(h("div","panel",`<div class="ph"><h2>Accept, reject, or neither</h2></div><div class="prose">
    <p>A state in F is reached: <b>accept</b> and halt. No transition applies: <b>halt and reject</b>. Neither, forever: it <b>loops</b>, and gives no answer.</p>
    <p>A finite automaton always stops because its input runs out. A Turing machine makes its own tape, so nothing forces it to stop.</p>
    <p>M <b>recognises</b> L if it accepts exactly L. M <b>decides</b> L if it also halts on every input. Decidable ⊆ recursively enumerable, and the containment is proper.</p></div>`));

  /* ---------- lab ---------- */
  const b2=block(root,"Lab","Run the machine, one configuration per line","lab");
  const mt=h("div","machines"); b2.appendChild(mt); const host=h("div","panel run"); b2.appendChild(host); let timer=null; Atlas.onCleanup(()=>clearInterval(timer));
  function show(M,w){ clearInterval(timer); timer=null; [...mt.children].forEach(t=>t.setAttribute("aria-selected",t.dataset.id===M.id?"true":"false")); w=w??M.ex[0];
    const R=run(M,w,M.id==="loop"?40:600); let t=0;
    host.innerHTML=`<div class="ph"><h2>${esc(M.name)}</h2><span class="hint">${esc(M.note)}</span></div>`;
    const top=h("div","controls"); host.appendChild(top); const ib=h("div","inputbox"); ib.innerHTML=`<label for="tmIn">w =</label><input id="tmIn" autocomplete="off" spellcheck="false" maxlength="10">`; top.appendChild(ib); const inp=ib.querySelector("input"); inp.value=w;
    inp.addEventListener("change",()=>show(M,[...inp.value].filter(c=>M.gamma.includes(c)&&c!=="B").join("")));
    const exs=h("div","examples"); top.appendChild(exs); M.ex.forEach(x=>{ const r=run(M,x,60).out; const b=h("button","ex"+(x===w?" on":""),`${esc(x||"ε")}${M.computes?"":`<small class="${r==="accept"?"y":"n"}">${r==="accept"?"✓":r==="loop"?"∞":"✗"}</small>`}`); b.type="button"; b.onclick=()=>show(M,x); exs.appendChild(b); });
    const row=h("div","row"); top.appendChild(row); const bB=h("button","btn","Back"), bS=h("button","btn primary","One move"), bP=h("button","btn","Play"), bE=h("button","btn","To the end"); [bB,bS,bP,bE].forEach(b=>{ b.type="button"; row.appendChild(b); });
    const tp=h("div","tape tmtape"); host.appendChild(tp); const two=h("div","two"); host.appendChild(two);
    const dw=h("div","tablewrap"); two.appendChild(dw); const dt=deltaTable(M); dw.appendChild(dt); const trw=h("div"); two.appendChild(trw);
    const narr=h("div","narr"); narr.innerHTML=`<span class="step">⊢</span><p></p>`; host.appendChild(narr);
    function render(){ const st=R.steps[t], last=t===R.steps.length-1; tapeView(tp,st); dt.querySelectorAll("td").forEach(td=>td.classList.remove("hit","miss"));
      const nx=R.steps[t+1]; if(nx){ const c=dt.querySelector(`td[data-q="${st.q}"][data-s="${nx.read}"]`); c&&c.classList.add("hit"); } else if(R.out==="reject"&&R.why){ const c=dt.querySelector(`td[data-q="${R.why.q}"][data-s="${R.why.s}"]`); c&&c.classList.add("miss"); }
      trw.innerHTML=`<div class="dlabel">The trace</div><div class="trace">${R.steps.slice(Math.max(0,t-11),t+1).map((s,i,a)=>`<div class="${i===a.length-1?"cur":""}">${t-a.length+1+i?"⊢ ":"&nbsp;&nbsp;"}${cfg(s)}${s.e?`<small>δ(${qn(s.from)}, ${s.read}) = ${ent(s.e)}</small>`:"<small>start</small>"}</div>`).join("")}</div>`;
      const p=narr.querySelector("p");
      if(!last){ p.innerHTML=`In ${qn(st.q)}, reading <b>${st.tape[st.h]??"B"}</b>: δ(${qn(st.q)}, ${st.tape[st.h]??"B"}) = ${ent(nx.e)}. Write ${nx.e[1]}, move ${nx.e[2]==="R"?"right":"left"}, go to ${qn(nx.e[0])}.`; }
      else { const n=R.steps.length-1;
        if(R.out==="accept") p.innerHTML= M.computes ? `<b>Halts after ${n} moves.</b> Input ${esc(w||"ε")} (${w.length}), tape ${esc(st.tape.filter(c=>c!=="B").join(""))} (${st.tape.filter(c=>c!=="B").length}). The answer is what is left on the tape.` : `<b>ACCEPT</b> in ${n} moves, ${n+1} configurations: ${qn(st.q)} ∈ F.`;
        else if(R.out==="reject") p.innerHTML= R.fell?`The head tried to move off the left end. HALT, REJECT.`:`<b>HALT, REJECT</b> after ${n} moves: δ(${qn(R.why.q)}, ${R.why.s}) is undefined (the red cell), and ${qn(R.why.q)} ∉ F. The state it halts in tells you why.`;
        else p.innerHTML=`<b>Still running after ${n} moves</b>, and it always will be: every move goes right onto a fresh blank. No accept, no reject: it loops. A recogniser is allowed to do this on strings outside its language; a decider is not.`;
        Atlas.stamp("tm","run"); }
      bB.disabled=t===0; bS.disabled=bE.disabled=last; }
    bS.onclick=()=>{ t++; render(); }; bB.onclick=()=>{ t--; render(); }; bE.onclick=()=>{ t=R.steps.length-1; render(); };
    bP.onclick=()=>{ if(timer){ clearInterval(timer); timer=null; bP.textContent="Play"; return; } if(t===R.steps.length-1) t=0; bP.textContent="Pause"; timer=setInterval(()=>{ t++; render(); if(t>=R.steps.length-1){ clearInterval(timer); timer=null; bP.textContent="Play"; } },reduceMotion?150:550); };
    render(); }
  MS.forEach(M=>{ const t=h("button","tab",`<b>${esc(M.name)}</b><span>${esc(M.tag)}</span>`); t.type="button"; t.dataset.id=M.id; t.onclick=()=>show(M); mt.appendChild(t); });
  show(MS[0]);

  /* ---------- Tape Walk ---------- */
  const b3=block(root,"Challenge","Tape Walk: a machine you have not seen","walk");
  b3.appendChild(h("p","idea","Σ = { 0, 1 }, start q₀, F = { q₆ }. Read the table before tracing: ask what each ROW is for. At every step, click the δ entry that applies, or say there is none. Then name the language."));
  const wp=h("div","panel"); b3.appendChild(wp); const INS=["010","001","0110"]; let wi=0, misses=0;
  function walk(){ const w=INS[wi], R=run(WALK,w); let t=0; wp.innerHTML=`<div class="ph"><h2>Trace ${wi+1} of 3: ${w}</h2><span class="hint">ten, nine and fourteen moves</span></div>`;
    const tp=h("div","tape tmtape"); wp.appendChild(tp); const two=h("div","two"); wp.appendChild(two); const dw=h("div","tablewrap"); two.appendChild(dw); const dt=deltaTable(WALK,"pick"); dw.appendChild(dt); const trw=h("div","trace"); two.appendChild(trw);
    const row=h("div","row"); row.style.marginTop="8px"; wp.appendChild(row); const none=h("button","btn","No entry applies: halt"); none.type="button"; row.appendChild(none); const out=h("div"); out.style.marginTop="8px"; wp.appendChild(out);
    function draw(){ const st=R.steps[t]; tapeView(tp,st); trw.innerHTML=R.steps.slice(0,t+1).map((s,i)=>`<div class="${i===t?"cur":""}">${i?"⊢ ":"&nbsp;&nbsp;"}${cfg(s)}</div>`).join(""); trw.scrollTop=trw.scrollHeight; }
    function answer(q,s){ const st=R.steps[t], sym=st.tape[st.h]??"B", last=t===R.steps.length-1;
      if(q===null){ if(last){ finish(); } else { misses++; out.innerHTML=`<div class="note bad">There is an entry: the machine is in ${qn(st.q)} reading ${sym}. Find that row and column.</div>`; } return; }
      if(last||q!==st.q||s!==sym){ misses++; out.innerHTML=`<div class="note bad">${last?`Look again: ${qn(st.q)} reading ${sym} has no entry.`:`The machine is in <b>${qn(st.q)}</b> and the head reads <b>${sym}</b>: row ${qn(st.q)}, column ${sym}.`}</div>`; return; }
      out.innerHTML=""; t++; draw(); if(WALK.accept.includes(R.steps[t].q)) finish(); }
    function finish(){ const n=R.steps.length-1, st=R.steps[n]; none.disabled=true; dt.querySelectorAll("td").forEach(td=>td.onclick=null);
      out.innerHTML=`<div class="note ${R.out==="accept"?"good":""}"><b>${R.out==="accept"?"ACCEPT":"HALT, REJECT"}</b> after ${n} moves${R.out==="accept"?`: q₆ ∈ F.`:`, in ${qn(st.q)} reading ${st.tape[st.h]??"B"}. Note the state: it says why.`}</div>`;
      const nx=h("button","btn primary",wi<2?"Next input":"Name the language"); nx.type="button"; nx.style.marginTop="8px"; nx.onclick=()=>{ wi++; wi<3?walk():name(); }; out.appendChild(nx); }
    dt.querySelectorAll("td").forEach(td=>{ td.tabIndex=0; td.onclick=()=>answer(td.dataset.q,td.dataset.s); td.onkeydown=e=>{ if(e.key==="Enter") td.click(); }; }); none.onclick=()=>answer(null); draw(); }
  function name(){ wp.innerHTML=`<div class="ph"><h2>Describe L(M) in one sentence</h2><span class="hint">${misses} wrong click${misses===1?"":"s"} over the three traces</span></div><p class="idea">Two rejections, and they halted in different states: 001 in q₃ on an X, 0110 in q₀ on a Y. What does the pair q₁/q₂ remember that a single state could not?</p>`;
    const r=h("div","row"); wp.appendChild(r); const o=h("div"); o.style.marginTop="10px"; wp.appendChild(o);
    [["Strings that contain a 1",false],["Odd length, and the middle symbol is 1",true],["Palindromes over { 0, 1 }",false],["Equal numbers of 0s and 1s",false]].forEach(([l,ok])=>{ const b=h("button","btn",l); b.type="button"; b.onclick=()=>{ o.innerHTML=ok?`<div class="note good"><b>Right: { w : |w| is odd and the middle symbol is 1 }.</b> q₁ and q₂ do the same walk and differ only in which symbol was crossed off, so the state carries one bit. q₃ with no X entry means “the middle was 0”; q₀ with no Y entry means “the length was even”.</div>`:`<div class="note bad">Test it against the traces: ${l.startsWith("Strings")?"001 contains a 1 and was rejected.":l.startsWith("Pal")?"0110 is a palindrome and was rejected.":"010 has two 0s and one 1 and was accepted."}</div>`; if(ok) Atlas.stamp("tm","walk"); }; r.appendChild(b); });
    const again=h("button","btn","Trace again"); again.type="button"; again.onclick=()=>{ wi=0; misses=0; walk(); }; r.appendChild(again); }
  walk();

  /* ---------- design: the missing entries ---------- */
  const b4=block(root,"Challenge","Mark, cross, return: find the entries designs always miss","design");
  b4.appendChild(h("p","idea","The aⁿbⁿcⁿ machine with four entries erased. q₀ crosses an a into X (or switches to checking), q₁ seeks the leftmost b, q₂ seeks the leftmost c, q₃ walks back to the X, q₄ sweeps the tail, q₅ accepts. Fill the gaps, and the machine is tested on every string over { a, b, c } up to length 7."));
  const full=MS[1], HOLES=[["q1","Y"],["q2","Z"],["q0","Y"],["q4","B"]]; const D=JSON.parse(JSON.stringify(full.delta)); HOLES.forEach(([q,s])=>delete D[q][s]);
  const dp=h("div","panel"); b4.appendChild(dp); const tw=h("div","tablewrap"); dp.appendChild(tw); const tb=deltaTable({...full,delta:D}); tw.appendChild(tb); const sels={};
  HOLES.forEach(([q,s])=>{ const td=tb.querySelector(`td[data-q="${q}"][data-s="${s}"]`); td.classList.add("hole"); const mk=(opts,lab)=>{ const x=document.createElement("select"); x.setAttribute("aria-label",lab); x.innerHTML=opts.map(o=>`<option value="${o}">${o===""?"–":qn(o)}</option>`).join(""); td.appendChild(x); return x; };
    sels[q+s]=[mk(["",...full.states],`next state for ${q} on ${s}`),mk(["",...full.gamma],`write for ${q} on ${s}`),mk(["","L","R"],`move for ${q} on ${s}`)]; });
  const rw=h("div","row"); rw.style.marginTop="10px"; dp.appendChild(rw); const ck=h("button","btn primary","Test the machine"); ck.type="button"; rw.appendChild(ck); const o4=h("div"); o4.style.marginTop="10px"; dp.appendChild(o4);
  const words=(()=>{ const out=[""]; let L=[""]; for(let n=1;n<=7;n++){ const nx=[]; L.forEach(w=>"abc".split("").forEach(c=>nx.push(w+c))); out.push(...nx); L=nx; } return out; })();
  const inL=w=>{ const m=/^(a+)(b+)(c+)$/.exec(w); return !!m&&m[1].length===m[2].length&&m[2].length===m[3].length; };
  ck.onclick=()=>{ const M={...full,delta:JSON.parse(JSON.stringify(D))}; let partial=false;
    HOLES.forEach(([q,s])=>{ const v=sels[q+s].map(x=>x.value); if(v.every(Boolean)) M.delta[q][s]=v; else if(v.some(Boolean)) partial=true; });
    if(partial){ o4.innerHTML=`<div class="note bad">An entry needs all three parts: next state, symbol to write, direction. Every move writes; to leave a cell alone, write back what was read.</div>`; return; }
    let bad=null; for(const w of words){ const r=run(M,w,2000); const acc=r.out==="accept"; if(r.out==="loop"||acc!==inL(w)){ bad={w,r,acc}; break; } }
    if(bad){ const st=bad.r.steps[bad.r.steps.length-1]; o4.innerHTML=`<div class="note bad"><b>Counterexample: ${esc(bad.w||"ε")}.</b> ${bad.r.out==="loop"?"The machine never halts on it.":bad.acc?"It is accepted, but it is not in the language.":`It is in the language, but the machine halts in ${qn(st.q)} reading ${st.tape[st.h]??"B"} with no entry to follow.`} Re-walk the machine with everything it writes already on the tape: every marker written in an early round has to be skippable later.</div>`; return; }
    o4.innerHTML=`<div class="note good"><b>Correct on all ${words.length} strings up to length 7.</b> Three of the four were skip entries (q₁ over Y, q₂ over Z) and the switch δ(q₀, Y) = (q₄, Y, R) into the tail sweep. The last, δ(q₄, B) = (q₅, B, R), is where acceptance happens: without the sweep, aabbc's near-misses would slip through.</div>`; Atlas.stamp("tm","design"); };

  const b6=block(root,"How it goes wrong","Right or wrong? Decide before you look.","claims");
  quickFire(b6,[
    {claim:"“δ(q, a) = (p, R) is a valid move that leaves the cell alone.”", ok:false, why:"Every transition writes and moves. To leave a cell alone, write back what was read: δ(q, a) = (p, a, R). There is no stay direction either, only L or R."},
    {claim:"“XXYYq₃ means the head is on the first blank after the Y's.”", ok:true, why:"The head reads β's first symbol, and trailing blanks are not written, so an empty β means the head is on a blank."},
    {claim:"“If no transition applies, the machine is stuck but has not rejected.”", ok:false, why:"No transition applies means HALT and reject (when the state is not in F). The state it halts in usually says why."},
    {claim:"“My machine halted on every input up to length 9, so it is a decider.”", ok:false, why:"Testing is evidence, not proof. Being a decider is a claim about infinitely many inputs; it needs an argument, such as a count of unmarked symbols that strictly decreases."},
    {claim:"“A Turing machine accepts { aⁿbⁿcⁿ }, which no pushdown automaton can.”", ok:true, why:"One extra marker: cross an a into X, a b into Y, a c into Z, walk back, repeat. The PDA's stack is empty by the time the c's arrive."},
    {claim:"“Once the a's and b's are all crossed off, the aⁿbⁿ machine can accept immediately.”", ok:false, why:"Without the tail sweep, aabbb would be accepted. q₃ walks right over the Y's and accepts only on a blank."},
    {claim:"“The Turing machine for aⁿbⁿ is faster than the pushdown automaton.”", ok:false, why:"It buys languages and pays in time: the PDA makes one linear pass, the Turing machine walks the tape once per pair, 2n² + 2n + 1 moves."}
  ], (c,n)=>{ if(c>=n-1) Atlas.stamp("tm","claims"); else Atlas.toast(`${c} of ${n} right. Reload the stop to try again.`); });
};
Atlas.tm={TM,run,cfg,qn};
})();
