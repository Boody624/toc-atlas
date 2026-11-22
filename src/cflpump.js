/* Station: closure and the pumping lemma for context-free languages (S22–S23) */
"use strict";
(function(){
const cnt=(w,c)=>{ let n=0; for(const x of w) if(x===c) n++; return n; };
const rep=(s,n)=>s.repeat(Math.max(0,n));
const SUP="⁰¹²³⁴⁵⁶⁷⁸⁹";
const ordered=(w,re)=>re.test(w);
const LANGS=[
  {id:"abc", name:"ABC = { aᵏbᵏcᵏ : k ≥ 1 }", test:w=>ordered(w,/^a+b+c+$/)&&cnt(w,"a")===cnt(w,"b")&&cnt(w,"b")===cnt(w,"c"),
   ws:[{l:"aⁿbⁿcⁿ",f:n=>rep("a",n)+rep("b",n)+rep("c",n)},{l:"abc",f:()=>"abc"}],
   slide:{3:121,4:295,5:605},
   proof:"w = aⁿbⁿcⁿ. The middle block is n long and |vxy| ≤ n, so the window cannot touch both the a's and the c's. Case 1, it misses the c's: m = 0 removes at least one a or b and no c. Case 2, it misses the a's: m = 0 removes at least one b or c and no a. Either way the three counts are no longer equal, so uxz ∉ ABC."},
  {id:"abcd", name:"{ aⁿbⁿcⁿdⁿ : n ≥ 1 }", test:w=>ordered(w,/^a+b+c+d+$/)&&new Set(["a","b","c","d"].map(c=>cnt(w,c))).size===1,
   ws:[{l:"aⁿbⁿcⁿdⁿ",f:n=>rep("a",n)+rep("b",n)+rep("c",n)+rep("d",n)},{l:"abcd",f:()=>"abcd"}],
   proof:"w = aⁿbⁿcⁿdⁿ. A window of length ≤ n reaches at most two adjacent blocks, so it misses the a's or the d's (and always the first or third). m = 0 lowers one or two counts and leaves at least one untouched, so the counts differ."},
  {id:"eq3", name:"{ w : #a = #b = #c }", test:w=>/^[abc]*$/.test(w)&&cnt(w,"a")===cnt(w,"b")&&cnt(w,"b")===cnt(w,"c"),
   ws:[{l:"aⁿbⁿcⁿ",f:n=>rep("a",n)+rep("b",n)+rep("c",n)},{l:"(abc)ⁿ",f:n=>rep("abc",n)}],
   slide:{3:121,4:295,5:605}, bad:{3:28,4:58},
   proof:"Pumping works with w = aⁿbⁿcⁿ, exactly as for ABC. The shorter route is closure: L ∩ L(a*b*c*) = { aⁿbⁿcⁿ }, a*b*c* is regular, so if L were context-free the intersection would be too. It is not."},
  {id:"ww", name:"{ ww : w ∈ {a, b}* }", test:w=>/^[ab]*$/.test(w)&&w.length%2===0&&w.slice(0,w.length/2)===w.slice(w.length/2),
   ws:[{l:"aⁿbⁿaⁿbⁿ",f:n=>rep("a",n)+rep("b",n)+rep("a",n)+rep("b",n)},{l:"a²ⁿ",f:n=>rep("a",2*n)},{l:"(ab)ⁿ(ab)ⁿ",f:n=>rep("ab",2*n)}],
   slide:{4:415}, bad:{4:79},
   proof:"w = aⁿbⁿaⁿbⁿ. The window has length ≤ n, so it cannot see the same block in both halves. m = 0 shortens one or two blocks; either the length becomes odd or the shortened block sits in one half and its twin does not, so the halves differ."},
  {id:"anbn", name:"{ aⁿbⁿ : n ≥ 0 }", twist:true, test:w=>ordered(w,/^a*b*$/)&&cnt(w,"a")===cnt(w,"b"),
   ws:[{l:"aⁿbⁿ",f:n=>rep("a",n)+rep("b",n)},{l:"a²ⁿb²ⁿ",f:n=>rep("a",2*n)+rep("b",2*n)}],
   proof:"No proof exists: S → aSb | ε generates it, so it is context-free and the lemma holds. The adversary's answer is v = a, y = b across the middle. This is the language that fails Session 13's lemma and passes this one."}
];
function decs(w,n){ const o=[], L=w.length; for(let s=0;s<=L;s++) for(let a=0;a<=n;a++) for(let b=0;a+b<=n;b++) for(let c=0;a+b+c<=n;c++){ if(a+c<1||s+a+b+c>L) continue;
  o.push({u:w.slice(0,s),v:w.slice(s,s+a),x:w.slice(s+a,s+a+b),y:w.slice(s+a+b,s+a+b+c),z:w.slice(s+a+b+c)}); } return o; }
const pump=(d,m)=>d.u+rep(d.v,m)+d.x+rep(d.y,m)+d.z;
const killers=(L,d)=>[0,2,3,4,5].filter(m=>!L.test(pump(d,m)));
function wHTML(d,m){
  const sp=(s,c)=>[...s].map(ch=>`<span class="${c}">${esc(ch)}</span>`).join("");
  const pv=s=>{ if(m===undefined) return sp(s,"y"); let o=""; for(let k=0;k<m;k++) o+=sp(s,k?"y2":"y"); return o; };
  const g='<span class="gap"></span>';
  const parts=[sp(d.u,"x"), pv(d.v), sp(d.x,"xm"), pv(d.y), sp(d.z,"z")].filter(Boolean);
  return `<div class="wstr">${parts.join(g)||"<span>ε</span>"}</div>`;
}
const KEY=`<div class="keyline"><span><i style="background:var(--sym-A)"></i>u</span><span><i style="background:var(--now)"></i>v and y, pumped together</span><span><i style="border:2px dashed var(--now);width:7px;height:7px"></i>x, inside the window</span><span><i style="background:var(--sym-X)"></i>z</span></div>`;
const D=d=>`u = ${esc(d.u||EPS)}, v = ${esc(d.v||EPS)}, x = ${esc(d.x||EPS)}, y = ${esc(d.y||EPS)}, z = ${esc(d.z||EPS)}`;

Atlas.stations.cflpump.stamps=[{id:"closure",label:"Closure table"},{id:"game",label:"Broke aⁿbⁿcⁿ"},{id:"badw",label:"Saw a bad w survive"},{id:"route",label:"Chose the route"},{id:"swap",label:"Made aⁿbⁿ pump"},{id:"claims",label:"CFL pumping claims"}];
Atlas.stations.cflpump.mount=function(root){
  /* ---------- idea ---------- */
  const b1=block(root,"The idea","Three pieces become five, and the window can sit anywhere","idea");
  const three=h("div","three"); b1.appendChild(three);
  three.appendChild(h("div","panel",`<div class="ph"><h2>What transfers from S13</h2></div><div class="order"><div>adversary: n</div><div>you: w ∈ L, |w| ≥ n</div><div>adversary: u, v, x, y, z</div><div>you: m</div><div><b>you win iff uvᵐxyᵐz ∉ L</b></div></div><p class="idea" style="margin-top:10px">The same four quantifiers in the same order. Only the split has more pieces.</p>`));
  three.appendChild(h("div","panel",`<div class="ph"><h2>What changes</h2></div><div class="prose"><p>S13: <code>w = xyz</code>, pump y, <code>|xy| ≤ p</code>: a <b>prefix</b>.</p><p>S23: <code>w = uvxyz</code>, pump v <b>and</b> y the same m times, <code>|vy| ≥ 1</code>, <code>|vxy| ≤ n</code>: a <b>window</b> that may sit anywhere.</p><p>So the cases are about <b>where the window sits</b>, not what y contains. Choose w with three long blocks: a window of length ≤ n cannot reach both ends.</p></div>`));
  three.appendChild(h("div","panel",`<div class="ph"><h2>Where n comes from</h2></div><div class="prose"><p>Take a CNF grammar. A binary tree of height h yields at most 2<sup>h−1</sup> symbols, so with <code>n = 2<sup>|V|</sup></code> a long w forces a path with |V| + 1 variables. Some A repeats:</p><p><code>S ⇒* uAz</code>, <code>A ⇒* vAy</code>, <code>A ⇒* x</code>, so <code>S ⇒* uvᵐxyᵐz</code>.</p><p>|vy| ≥ 1 because CNF has no ε- or unit productions.</p></div>`));

  /* ---------- closure (S22) ---------- */
  const b0=block(root,"Session 22","Closure, again: predict, then justify","closure");
  b0.appendChild(h("p","idea",`For each row: are the context-free languages closed under it? Rows 9 and 10 were not answered in the lecture. A product of two PDAs needs two stacks, and two stacks is a Turing machine.`));
  const CL=[
    ["L₁ ∪ L₂",true,"Construction: S₃ → S₁ | S₂, after renaming the variables apart."],
    ["L₁L₂",true,"Construction: S₄ → S₁S₂."],
    ["L₁*",true,"Construction: S₅ → S₁S₅ | ε."],
    ["Lᴿ",true,"Construction: reverse every right-hand side."],
    ["L₁ ∩ L₂",false,"Counterexample: { aᵏbᵏcʲ } ∩ { aᵏbʲcʲ } = { aᵏbᵏcᵏ }, not context-free. One stack enforces one matching, not two."],
    ["L′",false,"Derived: L₁ ∩ L₂ = (L₁′ ∪ L₂′)′. Closure under ′ would give closure under ∩. Non-constructive: some L fails, and we are not told which. (PALINDROME′ is still context-free.)"],
    ["L₁ − L₂",false,"Derived: L₁ − L₂ = L₁ ∩ L₂′, and with L₁ = Σ* this would give complement."],
    ["L ∩ R, R regular",true,"Construction: PDA × DFA, state (p, s), the PDA's stack. On a PDA ε-move the DFA's state stays put."],
    ["L − R, R regular",true,"L − R = L ∩ R′, and R′ is regular, so this is the row above. The complement falls on the regular side."],
    ["R − L, R regular",false,"R − L = R ∩ L′, and L′ need not be context-free. Witness: a*b*c* − { aⁱbʲcᵏ : i ≠ j or j ≠ k } = { aⁿbⁿcⁿ }."]
  ];
  const cg=h("div","qf"); b0.appendChild(cg); let cdone=0, cok=0;
  CL.forEach(([op,yes,why],i)=>{ const c=h("div","qf-card"); c.appendChild(h("div","who",`Row ${i+1}`)); c.appendChild(h("p","claim mono",esc(op)));
    const row=h("div","row"); const y=h("button","btn","Closed"), n=h("button","btn","Not closed"); y.type=n.type="button"; row.appendChild(y); row.appendChild(n); c.appendChild(row);
    const pick=s=>{ y.disabled=n.disabled=true; const ok=s===yes; cdone++; if(ok) cok++; c.classList.add(ok?"right":"wrong");
      c.appendChild(h("div","res",(ok?"Correct. ":"Not quite. ")+(yes?"Closed.":"Not closed."))); c.appendChild(h("p","why",esc(why)));
      if(cdone===CL.length){ if(cok>=8) Atlas.stamp("cflpump","closure"); else Atlas.toast(`${cok} of 10. Reload the stop to try again.`); } };
    y.onclick=()=>pick(true); n.onclick=()=>pick(false); cg.appendChild(c); });

  /* ---------- the game ---------- */
  const b2=block(root,"Challenge","Break the Language: the window game","game");
  b2.appendChild(h("p","idea",`The adversary picks n and then any legal window. You pick w first and m last. Try m = 0 first: it settles every example in her deck but one.`));
  const ltabs=h("div","machines"); b2.appendChild(ltabs);
  const game=h("div","game"); b2.appendChild(game);
  const log=h("div","log"); game.appendChild(log);
  const board=h("div","board"); game.appendChild(board);
  let L=null, G=null;
  function say(who,html){ const m=h("div","move "+who+" in"); m.appendChild(h("div","who",who==="adv"?"Adversary":who==="you"?"You":"Referee")); const b=h("div","body",html); m.appendChild(b); log.appendChild(m); return b; }
  function setBoard(stage,verdict){
    const steps=["adversary: n","you: w ∈ L, |w| ≥ n","adversary: u, v, x, y, z","you: m"];
    board.innerHTML=`<div class="panel"><div class="ph"><h2>Move order</h2></div><div class="order">${steps.map((s,i)=>`<div class="${i===stage?"on":i<stage?"done":""}"><span>${s}</span><span>${i<stage?"✓":""}</span></div>`).join("")}</div>
      ${G&&G.w!==undefined?`<p class="idea" style="margin:10px 0 0">n = <b class="mono">${G.n}</b> · w = <b class="mono">${esc(G.w)}</b> · |w| = ${G.w.length}</p>`:""}${verdict||""}</div>
      <div class="panel"><div class="ph"><h2>How this becomes a written proof</h2></div><p class="idea" style="margin:0">${esc(L.proof)}</p></div>`;
  }
  function start(l){ L=l; [...ltabs.children].forEach(x=>x.setAttribute("aria-selected",x.dataset.id===l.id?"true":"false"));
    log.innerHTML=""; G={n:3+Math.floor(Math.random()*2), beaten:0};
    say("sys",`<p>Suppose, for contradiction, that <b class="mono">${esc(L.name)}</b> is context-free. Then the lemma gives the adversary a constant.</p>`);
    say("adv",`<p>My constant is <b class="mono">n = ${G.n}</b>.</p><p class="idea" style="margin:0">In a written proof n stays unknown, which is why good choices of w are written in terms of n.</p>`);
    chooseW(); }
  function chooseW(){ setBoard(1);
    const b=say("you",`<p>Choose <b>w ∈ L</b> with |w| ≥ ${G.n}.</p>`); const opts=h("div","opts"); b.appendChild(opts);
    const lock=()=>opts.querySelectorAll("button,input").forEach(x=>x.disabled=true);
    const use=w=>{ if(!L.test(w)){ Atlas.toast(`${w||EPS} is not in L.`); return false; } if(w.length<G.n){ Atlas.toast(`|w| = ${w.length} < n = ${G.n}. The lemma says nothing about strings that short.`); return false; } lock(); G.w=w; split(); return true; };
    L.ws.forEach(o=>{ const w=o.f(G.n); const bt=h("button","opt",`${esc(o.l)} <span style="color:var(--muted);font-size:12px">= ${esc(w)}</span>`); bt.type="button"; bt.onclick=()=>{ if(use(w)) bt.classList.add("sel"); else bt.disabled=true; }; opts.appendChild(bt); });
    const own=h("input","txt"); own.placeholder="or type your own w"; own.maxLength=20; own.setAttribute("aria-label","your own w"); own.style.width="19ch"; opts.appendChild(own);
    const go=h("button","opt","use it"); go.type="button"; go.onclick=()=>use(own.value.trim()); opts.appendChild(go); }
  function split(){ setBoard(2);
    const all=decs(G.w,G.n).map(d=>({...d,k:killers(L,d)})); G.all=all; G.safe=all.filter(d=>!d.k.length);
    G.queue=all.slice().sort((a,b)=>a.k.length-b.k.length || (b.v.length+b.y.length)-(a.v.length+a.y.length) || Math.random()-.5);
    nextSplit(); }
  function nextSplit(){ const d=G.queue.shift(); G.cur=d; setBoard(3);
    const t=!d.k.length?"Pump your way out of this one.":G.beaten?"Fine. Another window.":"Here is my split.";
    say("adv",`<p>${t} <span class="mono">${D(d)}</span> · |vy| = ${d.v.length+d.y.length} ≥ 1, |vxy| = ${d.v.length+d.x.length+d.y.length} ≤ ${G.n}</p>${wHTML(d)}${KEY}`);
    const b=say("you",`<p>Choose <b>m</b> so that uvᵐxyᵐz leaves the language.</p>`); const opts=h("div","opts"); b.appendChild(opts); const res=h("div"); b.appendChild(res); let tries=0;
    [0,1,2,3].forEach(m=>{ const bt=h("button","opt","m = "+m); bt.type="button"; opts.appendChild(bt);
      bt.onclick=()=>{ tries++; const out=pump(d,m), inL=L.test(out);
        res.innerHTML=`<p style="margin-top:8px" class="mono">uv${SUP[m]}xy${SUP[m]}z = ${esc(out||EPS)}</p>${wHTML(d,m)}`;
        if(m===1){ res.innerHTML+=`<div class="note">m = 1 gives back w, which is in L by your own choice.</div>`; bt.disabled=true; return; }
        if(!inL){ opts.querySelectorAll("button").forEach(x=>x.disabled=true); bt.classList.add("sel"); res.innerHTML+=`<div class="note good"><b>${esc(out||EPS)} ∉ L.</b> This window is beaten.</div>`; G.beaten++; after(); }
        else { bt.disabled=true; res.innerHTML+=`<div class="note bad"><b>${esc(out||EPS)} ∈ L.</b> Still inside.</div>`; if(!d.k.length && tries>=2){ opts.querySelectorAll("button").forEach(x=>x.disabled=true); survived(d); } } }; }); }
  function after(){ if(!G.safe.length && (G.beaten>=3 || !G.queue.length)) return sweep();
    const b=say("sys",`<p>One window down. Your w must beat <b>every</b> legal decomposition (there are ${G.all.length}).</p>`); const o=h("div","opts"); b.appendChild(o);
    const nx=h("button","opt","Next window"); nx.type="button"; nx.onclick=()=>{ o.querySelectorAll("button").forEach(x=>x.disabled=true); nextSplit(); }; o.appendChild(nx);
    if(!G.safe.length){ const a=h("button","opt","Check all the rest for me"); a.type="button"; a.onclick=()=>{ o.querySelectorAll("button").forEach(x=>x.disabled=true); sweep(); }; o.appendChild(a); } }
  function sweep(){ const zero=G.all.filter(d=>d.k.includes(0)).length; const s=L.slide&&L.slide[G.n];
    say("sys",`<p class="big win">You win. ${esc(L.name)} is not context-free.</p><p>Checked by machine: at n = ${G.n} there are <b>${G.all.length}</b> legal decompositions of ${esc(G.w)}, and m = 0 defeats ${zero===G.all.length?"<b>every one</b>":zero+" of them (some other m the rest)"}.${s===G.all.length?` The slides give the same count: ${s} at n = ${G.n}.`:""}</p><p>In writing that is two cases, not ${G.all.length}: the window misses one end block, and which one is all that matters.</p>`);
    setBoard(4,`<p class="big win" style="margin:10px 0 0">Not context-free ∎</p>`);
    if(L.id==="abc") Atlas.stamp("cflpump","game");
    [...ltabs.children].forEach(x=>{ if(x.dataset.id===L.id) x.querySelector("span").textContent="proved ✓"; });
    again("Play this language again"); }
  function survived(d){
    say("adv",`<p>My window survives every m:</p><p class="mono">${[0,1,2,3].map(m=>"m="+m+": "+esc(pump(d,m)||EPS)).join(" · ")}</p>`);
    const bad=L.bad&&L.bad[G.n];
    say("sys",`<p class="big lose">${L.twist?"This language cannot be broken.":"This w lost."}</p><p>At n = ${G.n}, <b>${G.safe.length} of the ${G.all.length}</b> legal decompositions of ${esc(G.w)} survive.${bad===G.safe.length?` Her slides count the same: ${bad} survivors.`:""}</p>
      <p>${L.twist?"Here no w will ever win, because the language is context-free. The window can put v in the a's and y in the b's and keep them in step. Passing this lemma still proves nothing by itself; a grammar does.":"A surviving window means the string was wrong, not that the language is context-free. The fix is always the same: separated blocks that a short window cannot all reach."}</p>`);
    setBoard(4,`<p class="big lose" style="margin:10px 0 0">${L.twist?"It is context-free":"Choose a better w"}</p>`);
    if(!L.twist) Atlas.stamp("cflpump","badw");
    again(L.twist?"Play again":"Choose a different w",!L.twist); }
  function again(label,same){ const b=say("sys",""); const o=h("div","opts"); b.appendChild(o); const bt=h("button","opt",label); bt.type="button"; o.appendChild(bt);
    bt.onclick=()=>{ if(same){ bt.disabled=true; G.beaten=0; delete G.w; chooseW(); } else start(L); }; }
  LANGS.forEach(l=>{ const t=h("button","tab",`<b>${esc(l.name)}</b><span>${l.twist?"the twist":""}</span>`); t.type="button"; t.dataset.id=l.id; t.onclick=()=>start(l); ltabs.appendChild(t); });
  start(LANGS[0]);

  /* ---------- route ---------- */
  const b3=block(root,"Challenge","Choose the route before you start","route");
  b3.appendChild(h("p","idea",`Reduce when you can, pump when you must, and build a grammar when you cannot break it. Pick the best route for each.`));
  const RO=["Pump it directly","Filter with a regular language, then reduce","It is context-free: build a grammar","That filter proves nothing"];
  const RT=[
    {l:"{ aⁿbⁿcⁿdⁿ : n ≥ 1 }", a:0, why:"Already has separated blocks. w = aⁿbⁿcⁿdⁿ: the window misses the first or the last block, and m = 0 settles it."},
    {l:"{ w ∈ {a,b,c}* : #a = #b = #c }", a:1, also:0, why:"L ∩ L(a*b*c*) = { aⁿbⁿcⁿ }, already proved. Three lines, no cases. Pumping with w = aⁿbⁿcⁿ also works (605 windows at n = 5), just slower."},
    {l:"{ w : #a = #b and #b = 2·#c }", a:1, why:"No w has blocks until you filter: L ∩ L(a*b*c*) = { a²ᵐb²ᵐcᵐ }. The filter does not finish the proof; it creates the blocks, then you pump w = a²ⁿb²ⁿcⁿ."},
    {l:"{ aⁱbʲcᵏ : i = j or j = k }", a:2, why:"A union of { aⁿbⁿcᵏ } and { aⁱbⁿcⁿ }, each with an easy grammar, and CFLs are closed under union. Each string needs only one matching."},
    {l:"{ w ∈ {a,b}* : #a = #b and #ab = #ba }, filtered with a*b*", a:3, why:"L ∩ L(a*b*) = { ε }, which is context-free. A reduction concludes something only when the filtered language is outside the class. Saying so is the answer."},
    {l:"{ ww : w ∈ {a, b}* }", a:0, why:"w = aⁿbⁿaⁿbⁿ: the window cannot see a block and its twin, so m = 0 makes the halves differ (415 windows at n = 4)."},
    {l:"{ wwᴿ : w ∈ {a, b}* }", a:2, why:"S → aSa | bSb | ε. One stack matches the second half against the first, reversed. Compare ww, where the order does not reverse."}
  ];
  const rg=h("div","qf"); b3.appendChild(rg); let rdone=0, rok=0;
  RT.forEach(it=>{ const c=h("div","qf-card"); c.appendChild(h("div","who","Which route?")); c.appendChild(h("p","claim",esc(it.l)));
    const row=h("div","row route"); c.appendChild(row);
    RO.forEach((o,i)=>{ const bt=h("button","btn",o); bt.type="button"; row.appendChild(bt);
      bt.onclick=()=>{ row.querySelectorAll("button").forEach(x=>x.disabled=true); bt.classList.add("sel"); const ok=i===it.a||i===it.also; rdone++; if(ok) rok++;
        c.classList.add(ok?"right":"wrong"); c.appendChild(h("div","res",(ok?(i===it.a?"Correct. ":"Valid, but slower. "):"Not quite. ")+"Best route: "+RO[it.a].toLowerCase()+".")); c.appendChild(h("p","why",esc(it.why)));
        if(rdone===RT.length){ if(rok>=5) Atlas.stamp("cflpump","route"); else Atlas.toast(`${rok} of ${RT.length}. Reload the stop to try again.`); } }; }); rg.appendChild(c); });

  /* ---------- swap roles ---------- */
  const b4=block(root,"Swap roles","Now you are the adversary: make { aⁿbⁿ } pump","swap");
  b4.appendChild(h("p","idea",`n = 2. The prover hands you w. Paint v, then y (click symbols), so that |vy| ≥ 1, |vxy| ≤ 2, and uvᵐxyᵐz stays in the language for every m. One of v and y may be empty.`));
  const ar=h("div","panel"); b4.appendChild(ar);
  function swap(){ const k=3+Math.floor(Math.random()*2), w=rep("a",k)+rep("b",k); let mode="v"; const pv=new Set(), py=new Set();
    ar.innerHTML=`<div class="ph"><h2>The prover says: “my string is <span class="mono">${w}</span>”</h2><span class="hint">n = 2</span></div>`;
    const tb=h("div","opts"); ar.appendChild(tb); const strip=h("div","wstr pick"); ar.appendChild(strip); const go=h("div","opts"); ar.appendChild(go); const out=h("div"); ar.appendChild(out);
    const mb=["v","y"].map(p=>{ const b=h("button","opt","Paint "+p); b.type="button"; b.onclick=()=>{ mode=p; mb.forEach(x=>x.classList.toggle("sel",x===b)); }; tb.appendChild(b); return b; }); mb[0].classList.add("sel");
    const clr=h("button","opt","Clear"); clr.type="button"; clr.onclick=()=>{ pv.clear(); py.clear(); out.innerHTML=""; paint(); }; tb.appendChild(clr);
    function paint(){ strip.innerHTML=""; [...w].forEach((ch,i)=>{ const s=h("span",pv.has(i)||py.has(i)?"y":"",esc(ch)); if(py.has(i)) s.style.boxShadow="inset 0 -4px 0 var(--sym-X)";
      s.title=pv.has(i)?"v":py.has(i)?"y":""; s.tabIndex=0; s.setAttribute("role","button");
      const clk=()=>{ const me=mode==="v"?pv:py, other=mode==="v"?py:pv; other.delete(i); me.has(i)?me.delete(i):me.add(i); paint(); };
      s.onclick=clk; s.onkeydown=e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); clk(); } }; strip.appendChild(s); }); }
    const ck=h("button","btn primary","Pump it"); ck.type="button"; go.appendChild(ck);
    const contig=S=>{ const a=[...S].sort((x,y)=>x-y); return a.every((x,i)=>!i||x===a[i-1]+1)?a:null; };
    ck.onclick=()=>{ const V=contig(pv), Y=contig(py);
      if(!V||!Y){ out.innerHTML=`<div class="note bad">v and y must each be one contiguous piece.</div>`; return; }
      if(!V.length&&!Y.length){ out.innerHTML=`<div class="note bad">|vy| ≥ 1: paint at least one symbol.</div>`; return; }
      if(V.length&&Y.length&&V[V.length-1]>=Y[0]){ out.innerHTML=`<div class="note bad">v must come before y in the string.</div>`; return; }
      const lo=V.length?V[0]:Y[0], hi=Y.length?Y[Y.length-1]:V[V.length-1];
      if(hi-lo+1>2){ out.innerHTML=`<div class="note bad">|vxy| = ${hi-lo+1} > n = 2. The whole window, x included, must fit in 2 symbols.</div>`; return; }
      const vs=V.length?V[0]:(Y[0]), ve=V.length?V[V.length-1]+1:vs, ys=Y.length?Y[0]:ve, ye=Y.length?Y[Y.length-1]+1:ys;
      const d={u:w.slice(0,vs),v:w.slice(vs,ve),x:w.slice(ve,ys),y:w.slice(ys,ye),z:w.slice(ye)}; const T=LANGS[4].test;
      const rows=[0,2,3,4].map(m=>`<span class="mono">m=${m}: ${esc(pump(d,m)||EPS)} ${T(pump(d,m))?"∈":"∉"} L</span>`).join(" · ");
      const k=[0,2,3,4,5].filter(m=>!T(pump(d,m)));
      if(k.length) out.innerHTML=`${wHTML(d)}<div class="note bad"><b>The prover wins with m = ${k[0]}.</b> ${D(d)}<br>${rows}<br>Pumping one block alone breaks the balance, exactly as in Session 13. Clear and try again.</div>`;
      else { out.innerHTML=`${wHTML(d)}<div class="note good"><b>Your window survives every m.</b> ${D(d)}<br>${rows}<br>v in the a's, y in the b's: the two pumped pieces sit in different blocks and keep the counts in step. That is exactly what the three-piece lemma could not do, and why { aⁿbⁿ } separates the two classes.</div>`; Atlas.stamp("cflpump","swap"); } };
    const nw=h("button","btn","New string"); nw.type="button"; nw.onclick=swap; go.appendChild(nw);
    paint(); }
  swap();

  /* ---------- claims ---------- */
  const b5=block(root,"How it goes wrong","Proofs that prove nothing","claims");
  quickFire(b5,[
    {claim:"“Let v be the first a and y the first b. Then uv²xy²z has more a's than c's, so ABC is not context-free.”", ok:false, why:"That is the adversary's move. Let the window lie anywhere with |vxy| ≤ n and split on which blocks it reaches. Cases about positions, not letters."},
    {claim:"“For #a = #b = #c I chose w = (abc)ⁿ and some windows survived, so the language is context-free.”", ok:false, why:"A surviving window means the string was wrong. At n = 3, 28 of 121 windows survive (abc)ⁿ; with aⁿbⁿcⁿ every one falls to m = 0."},
    {claim:"“My proof assumes v and y are both non-empty.”", ok:false, why:"The condition is |vy| ≥ 1. v = ε, y = a is legal, and the adversary may pick it. Those cases are easy (one block pumped), but they must be covered."},
    {claim:"“{ aⁿbⁿ } satisfies this lemma, so it is context-free.”", ok:false, why:"The lemma is necessary, not sufficient. { aⁿbⁿ } is context-free, but because S → aSb | ε generates it, not because it pumps."},
    {claim:"“If L ∩ A is not context-free and A is context-free, then L is not context-free.”", ok:false, why:"That needs closure under intersection, which fails. The argument is valid only when A is regular."},
    {claim:"“The CFLs are not closed under complement, so the complement of a CFL is never context-free.”", ok:false, why:"Not closed means some complement fails. PALINDROME′ and the complement of { aⁿbⁿ } are both context-free."},
    {claim:"“A window of length ≤ n cannot touch both the a's and the c's of aⁿbⁿcⁿ.”", ok:true, why:"The b block alone is n long, so reaching from an a to a c needs at least n + 2 symbols. That is why two cases suffice."},
    {claim:"“Failing the regular pumping lemma tells me the language is not context-free.”", ok:false, why:"{ aⁿbⁿ } and { aⁿbⁿcⁿ } both fail it; one is context-free and one is not. Each lemma settles its own class only."}
  ],(c,n)=>{ if(c>=n-1) Atlas.stamp("cflpump","claims"); else Atlas.toast(`${c} of ${n} right. Reload the stop to try again.`); });
};
})();
