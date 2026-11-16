/* Station: the pumping lemma as the Adversary Game (S13) */
"use strict";
(function(){
const cnt=(w,c)=>{ let n=0; for(const x of w) if(x===c) n++; return n; };
const rep=(s,n)=>s.repeat(Math.max(0,n));
const isPal=w=>w===[...w].reverse().join("");
const LANGS = [
  {id:"anbn", name:"{ aⁿbⁿ : n ≥ 0 }", sigma:"ab", test:w=>/^a*b*$/.test(w)&&cnt(w,"a")===cnt(w,"b"),
   ws:[{l:"aᵖbᵖ",f:p=>rep("a",p)+rep("b",p)},{l:"a^⌈p/2⌉ b^⌈p/2⌉",f:p=>rep("a",Math.ceil(p/2))+rep("b",Math.ceil(p/2))},{l:"ab",f:()=>"ab"}],
   proof:"w = aᵖbᵖ. Since |xy| ≤ p, y = aᵝ with β ≥ 1. Take i = 0: xz = aᵖ⁻ᵝbᵖ has fewer a's than b's, so xz ∉ L."},
  {id:"anbn1", name:"L₁ = { aⁿbⁿ⁺¹ }", sigma:"ab", test:w=>/^a*b*$/.test(w)&&cnt(w,"a")+1===cnt(w,"b"),
   ws:[{l:"aᵖbᵖ⁺¹",f:p=>rep("a",p)+rep("b",p+1)},{l:"b",f:()=>"b"},{l:"a²b³",f:()=>"aabbb"}],
   proof:"w = aᵖbᵖ⁺¹. |xy| ≤ p forces y = aᵝ, β ≥ 1. Take i = 0: b's − a's = β + 1 ≥ 2 ≠ 1, so xz ∉ L₁."},
  {id:"equal", name:"EQUAL = { w : #a(w) = #b(w) }", sigma:"ab", test:w=>/^[ab]*$/.test(w)&&cnt(w,"a")===cnt(w,"b"),
   ws:[{l:"(ab)ᵖ",f:p=>rep("ab",p)},{l:"aᵖbᵖ",f:p=>rep("a",p)+rep("b",p)},{l:"bᵖaᵖ",f:p=>rep("b",p)+rep("a",p)}],
   proof:"w = aᵖbᵖ again. y = aᵝ, and i = 0 leaves aᵖ⁻ᵝbᵖ with unequal counts. With w = (ab)ᵖ the adversary picks x = ε, y = ab and survives every i."},
  {id:"akbak", name:"N = { aᵏbaᵏ : k ≥ 0 }", sigma:"ab", test:w=>{ const m=/^(a*)b(a*)$/.exec(w); return !!m && m[1].length===m[2].length; },
   ws:[{l:"aᵖbaᵖ",f:p=>rep("a",p)+"b"+rep("a",p)},{l:"aba",f:()=>"aba"},{l:"a^⌈p/2⌉ b a^⌈p/2⌉",f:p=>rep("a",Math.ceil(p/2))+"b"+rep("a",Math.ceil(p/2))}],
   proof:"w = aᵖbaᵖ. The single b is beyond the first p symbols, so y = aᵝ from the prefix. i = 0 leaves aᵖ⁻ᵝbaᵖ, which is unbalanced."},
  {id:"anb2n", name:"{ aⁿb²ⁿ : n ≥ 0 }", sigma:"ab", test:w=>/^a*b*$/.test(w)&&2*cnt(w,"a")===cnt(w,"b"),
   ws:[{l:"aᵖb²ᵖ",f:p=>rep("a",p)+rep("b",2*p)},{l:"abb",f:()=>"abb"},{l:"a²b⁴",f:()=>"aabbbb"}],
   proof:"w = aᵖb²ᵖ, |w| = 3p ≥ p. y = aᵝ, β ≥ 1. i = 0 gives p − β a's against 2p b's, and 2(p − β) ≠ 2p."},
  {id:"pal", name:"PALINDROME over {a, b}", sigma:"ab", test:w=>/^[ab]*$/.test(w)&&isPal(w),
   ws:[{l:"aᵖ",f:p=>rep("a",p)},{l:"aᵖbaᵖ",f:p=>rep("a",p)+"b"+rep("a",p)},{l:"(ab)ᵖa",f:p=>rep("ab",p)+"a"}],
   proof:"w = aᵖbaᵖ. y = aᵝ inside the first block, and i = 0 gives aᵖ⁻ᵝbaᵖ, which is not a palindrome. (The slides do it by closure: PALINDROME ∩ L(a*ba*) = { aᵏbaᵏ }.)"}
];
const SUP="⁰¹²³⁴⁵⁶⁷⁸⁹";
function splits(w,p){ const out=[]; for(let a=0;a<Math.min(p,w.length);a++) for(let b=1;a+b<=Math.min(p,w.length);b++) out.push({x:w.slice(0,a),y:w.slice(a,a+b),z:w.slice(a+b)}); return out; }
const pump=(s,i)=>s.x+rep(s.y,i)+s.z;
function killers(L,s,max){ const k=[]; for(let i=0;i<=max;i++) if(!L.test(pump(s,i))) k.push(i); return k; }
function wHTML(s,i,cls){ // colour x / y^i / z
  const span=(str,c)=>[...str].map(ch=>`<span class="${c}">${esc(ch)}</span>`).join("");
  let out=span(s.x,"x")+(s.x?'<span class="gap"></span>':"");
  if(i===undefined) out+=span(s.y,"y"); else for(let k=0;k<i;k++) out+=span(s.y,k===0?"y":"y2");
  if(i===0) out+='<span class="gap"></span>';
  out+=(s.z?'<span class="gap"></span>':"")+span(s.z,"z");
  return `<div class="wstr ${cls||""}">${out||'<span>ε</span>'}</div>`;
}
const KEY=`<div class="keyline"><span><i style="background:var(--sym-A)"></i>x</span><span><i style="background:var(--now)"></i>y, the part that is pumped</span><span><i style="background:var(--sym-X)"></i>z</span></div>`;

Atlas.stations.pumping.mount = function(root){
  /* ---------- idea ---------- */
  const b1=block(root,"The idea","You choose two things. The adversary chooses two.","idea");
  const three=h("div","three"); b1.appendChild(three);
  three.appendChild(h("div","panel",`<div class="ph"><h2>The adversary chooses</h2></div><div class="prose"><p><b>p</b>, the pumping length. Some number. In a written proof you never learn its value.</p><p>The <b>decomposition w = xyz</b>, subject only to <code>|y| ≥ 1</code> and <code>|xy| ≤ p</code>.</p><p>So your argument must cover EVERY legal decomposition, not one you like.</p></div>`));
  three.appendChild(h("div","panel",`<div class="ph"><h2>You choose</h2></div><div class="prose"><p><b>w</b>, any string in L with <code>|w| ≥ p</code>. Choose it so that |xy| ≤ p traps y where you want it.</p><p><b>i</b>, the pump count. You may pick a different i for each decomposition.</p><p>Choose w badly and no i will save you.</p></div>`));
  three.appendChild(h("div","panel",`<div class="ph"><h2>You win if</h2></div><div class="order"><div>adversary: p</div><div>you: w ∈ L, |w| ≥ p</div><div>adversary: x, y, z</div><div>you: i</div><div><b>you win iff xyⁱz ∉ L</b></div></div><p class="idea" style="margin-top:10px">The order of the moves is the order of the quantifiers: ∀p ∃w ∀xyz ∃i. It cannot be rearranged.</p>`));

  /* ---------- the game ---------- */
  const b2=block(root,"Challenge","The Adversary Game: prove the language is not regular","game");
  const ltabs=h("div","machines"); b2.appendChild(ltabs);
  const game=h("div","game"); b2.appendChild(game);
  const log=h("div","log"); game.appendChild(log);
  const board=h("div","board"); game.appendChild(board);
  let L=null, G=null;
  const wins=()=>LANGS.filter(l=>Atlas.has("pumping","w_"+l.id)).length;
  function say(who, html){ const m=h("div","move "+who+" in"); m.appendChild(h("div","who", who==="adv"?"Adversary":who==="you"?"You":"Referee")); const b=h("div","body",html); m.appendChild(b); log.appendChild(m); return b; }
  function setBoard(stage, verdict){
    const steps=["adversary: p","you: w ∈ L, |w| ≥ p","adversary: x, y, z","you: i"];
    board.innerHTML=`<div class="panel"><div class="ph"><h2>Move order</h2></div><div class="order">${steps.map((s,i)=>`<div class="${i===stage?"on":i<stage?"done":""}"><span>${s}</span><span>${i<stage?"✓":""}</span></div>`).join("")}</div>
      ${G&&G.w!==undefined?`<p class="idea" style="margin:10px 0 0">p = <b class="mono">${G.p}</b> · w = <b class="mono">${esc(G.w)}</b> · |w| = ${G.w.length}</p>`:""}
      ${verdict||""}</div>
      <div class="panel"><div class="ph"><h2>How this becomes a written proof</h2></div><p class="idea" style="margin:0">${esc(L.proof)}</p></div>`;
  }
  function start(l){
    L=l; [...ltabs.children].forEach(x=>x.setAttribute("aria-selected", x.dataset.id===l.id?"true":"false"));
    log.innerHTML=""; G={p:3+Math.floor(Math.random()*3), beaten:0};
    say("sys",`<p>We are trying to prove that <b class="mono">${esc(L.name)}</b> is not regular. Suppose it were. Then the pumping lemma hands the adversary a constant.</p>`);
    say("adv",`<p>My pumping length is <b class="mono">p = ${G.p}</b>.</p><p class="idea" style="margin:0">In a real proof p stays unknown. It is shown here so we can play, which is why the good choices of w are written in terms of p.</p>`);
    chooseW();
  }
  function chooseW(){
    setBoard(1);
    const b=say("you",`<p>Choose <b>w ∈ L</b> with |w| ≥ ${G.p}.</p>`);
    const opts=h("div","opts"); b.appendChild(opts);
    const lock=()=>opts.querySelectorAll("button,input").forEach(x=>x.disabled=true);
    L.ws.forEach(o=>{ const w=o.f(G.p); const bt=h("button","opt",`${esc(o.l)} <span style="color:var(--muted);font-size:12px">= ${esc(w)}</span>`); bt.type="button";
      bt.onclick=()=>{ if(w.length<G.p){ Atlas.toast(`|w| = ${w.length} < p = ${G.p}. The lemma says nothing about strings that short.`); bt.disabled=true; return; } bt.classList.add("sel"); lock(); G.w=w; adversarySplit(); }; opts.appendChild(bt); });
    const own=h("input","txt"); own.placeholder="or type your own w"; own.maxLength=16; own.setAttribute("aria-label","your own w"); own.style.width="19ch"; opts.appendChild(own);
    const go=h("button","opt","use it"); go.type="button"; opts.appendChild(go);
    go.onclick=()=>{ const w=own.value.trim(); if(!w) return;
      if(!L.test(w)){ Atlas.toast(`${w} is not in L. You must choose a member of the language.`); return; }
      if(w.length<G.p){ Atlas.toast(`|w| = ${w.length} < p = ${G.p}. Too short.`); return; }
      lock(); G.w=w; adversarySplit(); };
  }
  function adversarySplit(){
    setBoard(2);
    const all=splits(G.w,G.p).map(s=>({...s,k:killers(L,s,6)}));
    G.all=all; G.safe=all.filter(s=>s.k.length===0);
    // hardest first: fewest winning i's; avoid repeating a split
    G.queue=all.slice().sort((a,b)=>a.k.length-b.k.length || b.y.length-a.y.length);
    G.kinds=new Set(all.map(s=>[...new Set(s.y)].sort().join("")));
    nextSplit();
  }
  function nextSplit(){
    const s=G.queue.shift(); G.cur=s; setBoard(3);
    const taunt = s.k.length===0 ? "Try to pump your way out of this one." : (G.beaten? "Fine. A different split." : "Here is my split.");
    say("adv",`<p>${taunt} <span class="mono">x = ${esc(s.x||EPS)}, y = ${esc(s.y)}, z = ${esc(s.z||EPS)}</span> · |xy| = ${s.x.length+s.y.length} ≤ ${G.p}, |y| = ${s.y.length} ≥ 1</p>${wHTML(s)}${KEY}`);
    const b=say("you",`<p>Choose <b>i</b> so that xyⁱz leaves the language.</p>`);
    const opts=h("div","opts"); b.appendChild(opts); const res=h("div"); b.appendChild(res); let tries=0;
    [0,1,2,3].forEach(i=>{ const bt=h("button","opt","i = "+i); bt.type="button"; opts.appendChild(bt);
      bt.onclick=()=>{ tries++; const out=pump(s,i), inL=L.test(out);
        res.innerHTML=`<p style="margin-top:8px" class="mono">xy${SUP[i]}z = ${esc(out||EPS)}</p>${wHTML(s,i)}`;
        if(i===1){ res.innerHTML+=`<div class="note">i = 1 gives back w itself, which is in L by your own choice. It can never win.</div>`; bt.disabled=true; return; }
        if(!inL){ opts.querySelectorAll("button").forEach(x=>x.disabled=true); bt.classList.add("sel");
          res.innerHTML+=`<div class="note good"><b>${esc(out||EPS)} ∉ L.</b> This split is beaten.</div>`; G.beaten++; afterBeat(); }
        else { bt.disabled=true; res.innerHTML+=`<div class="note bad"><b>${esc(out||EPS)} ∈ L.</b> Still inside the language.</div>`;
          if(s.k.length===0 && tries>=2){ opts.querySelectorAll("button").forEach(x=>x.disabled=true); survived(s); } }
      }; });
  }
  function afterBeat(){
    if(G.safe.length===0 && (G.beaten>=3 || G.queue.length===0)) return sweep();
    const b=say("sys",`<p>One split down. The adversary may try another: your w has to beat <b>every</b> legal split (there are ${G.all.length}).</p>`);
    const o=h("div","opts"); b.appendChild(o);
    const n=h("button","opt","Next split"); n.type="button"; n.onclick=()=>{ o.querySelectorAll("button").forEach(x=>x.disabled=true); nextSplit(); }; o.appendChild(n);
    if(G.safe.length===0){ const a=h("button","opt","Check all the rest for me"); a.type="button"; a.onclick=()=>{ o.querySelectorAll("button").forEach(x=>x.disabled=true); sweep(); }; o.appendChild(a); }
  }
  function sweep(){
    const kinds=[...G.kinds]; const one=kinds.length===1;
    const zero=G.all.filter(s=>s.k.includes(0)).length;
    say("sys",`<p class="big win">You win. ${esc(L.name)} is not regular.</p>
      <p>Checked by machine: at p = ${G.p} there are <b>${G.all.length}</b> legal decompositions of ${esc(G.w)}, and every one of them is beaten by some i (i = 0 defeats ${zero} of them).</p>
      <p>${one?`Every legal y is made of <b>${esc(kinds[0])}</b>'s only. That is what a good w buys: |xy| ≤ p trapped y in one block, so the written proof needs a single case, y = ${esc(kinds[0])}ᵝ with β ≥ 1.`
        :`But look at the y's the adversary could choose: ${kinds.map(k=>"<b>"+esc(k.length>1?"a mix of "+k.split("").join(" and "):"all "+k+"'s")+"</b>").join(", ")}. You won the game, yet a written proof with this w needs ${kinds.length} cases. A w whose first p symbols are all the same letter leaves one.`}</p>`);
    setBoard(4,`<p class="big win" style="margin:10px 0 0">Not regular ∎</p>`);
    Atlas.stamp("pumping","w_"+L.id); if(L.id==="anbn") Atlas.stamp("pumping","anbn"); if(L.id==="equal") Atlas.stamp("pumping","equal"); if(wins()>=3) Atlas.stamp("pumping","three");
    [...ltabs.children].forEach(x=>{ if(x.dataset.id===L.id) x.querySelector("span").textContent="proved ✓"; });
    again("Play this language again");
  }
  function survived(s){
    say("adv",`<p>My split survives. <span class="mono">xyⁱz</span> stays in the language for every i:</p><p class="mono">${[0,1,2,3].map(i=>"i="+i+": "+esc(pump(s,i)||EPS)).join(" · ")}</p>`);
    say("sys",`<p class="big lose">This w lost.</p><p>At p = ${G.p}, <b>${G.safe.length} of the ${G.all.length}</b> legal splits of ${esc(G.w)} survive every i.</p>
      <p>A surviving split does <b>not</b> mean the language is regular. It means that w was the wrong choice, and the proof must restart with a better one. The fix is always the same: pick a w whose first p symbols are all the same letter.</p>`);
    setBoard(4,`<p class="big lose" style="margin:10px 0 0">Choose a better w</p>`);
    Atlas.stamp("pumping","survive");
    again("Choose a different w", true);
  }
  function again(label, sameP){ const b=say("sys",""); const o=h("div","opts"); b.appendChild(o); const bt=h("button","opt",label); bt.type="button"; o.appendChild(bt);
    bt.onclick=()=>{ if(sameP){ bt.disabled=true; G.beaten=0; delete G.w; chooseW(); } else start(L); }; }
  LANGS.forEach(l=>{ const t=h("button","tab",`<b>${esc(l.name)}</b><span>${Atlas.has("pumping","w_"+l.id)?"proved ✓":""}</span>`); t.type="button"; t.dataset.id=l.id; t.onclick=()=>start(l); ltabs.appendChild(t); });
  start(LANGS[0]);

  /* ---------- swap roles ---------- */
  const b3=block(root,"Swap roles","Now you are the adversary","swap");
  b3.appendChild(h("div","prose",`<p>These languages <b>are</b> regular, so the lemma holds and the adversary can always win. The prover hands you a w. Pick the split: click the first and the last symbol of y. Then the prover tries every i.</p>`));
  const REG=[
    {id:"astarbstar", name:"L(a*b*)", test:w=>/^a*b*$/.test(w), w:p=>rep("a",Math.ceil(p/2))+rep("b",p), why:"The DFA for a*b* loops on a in its first state. Any y made only of a's (or only of b's) is one trip round a loop."},
    {id:"evena", name:"even number of a's", test:w=>/^[ab]*$/.test(w)&&cnt(w,"a")%2===0, w:p=>"ab"+rep("a",p-1)+(p%2?"":"a")+"b", why:"y must contain an even number of a's, for example a single b, or aa. That is a loop in the two-state parity machine."},
    {id:"abstar", name:"L((ab)*)", test:w=>/^(ab)*$/.test(w), w:p=>rep("ab",p), why:"y = ab is one full trip round the loop of the machine. y = a alone breaks the alternation."},
    {id:"trick", name:"{ aⁱbʲcᵏ : if i = 1 then j = k }", test:w=>{ const m=/^(a*)(b*)(c*)$/.exec(w); return !!m && (m[1].length!==1 || m[2].length===m[3].length); }, w:p=>"a"+rep("b",p)+rep("c",p),
     why:"You survived, and so does the adversary on every w: this language satisfies the pumping lemma with p = 2. But it is NOT regular. L ∩ L(ab*c*) = { abⁿcⁿ }, which is not regular, so L cannot be. Satisfying the lemma proves nothing.", twist:true}
  ];
  const rtabs=h("div","machines"); b3.appendChild(rtabs);
  const arena=h("div","panel"); b3.appendChild(arena);
  function advStart(R){
    [...rtabs.children].forEach(x=>x.setAttribute("aria-selected", x.dataset.id===R.id?"true":"false"));
    const p=R.twist?2:3+Math.floor(Math.random()*2); const w=R.w(p); let a=null, b=null;
    arena.innerHTML=`<div class="ph"><h2>${esc(R.name)}</h2><span class="hint">p = ${p} · |xy| ≤ ${p}, so y must lie within the first ${p} symbols</span></div>
      <p class="idea" style="margin:0 0 4px">The prover says: “My string is <b class="mono">${esc(w)}</b>.” Click where y starts, then where it ends.</p>`;
    const strip=h("div","wstr pick"); arena.appendChild(strip); const out=h("div"); arena.appendChild(out);
    function paint(){ strip.innerHTML=""; [...w].forEach((ch,i)=>{ const inY=a!==null && i>=a && i<=(b===null?a:b); const sp=h("span", inY?"y":(a!==null&&b!==null?(i<a?"x":"z"):""), esc(ch));
        if(i>=p) sp.style.opacity=.45; sp.setAttribute("role","button"); sp.tabIndex=0;
        const clk=()=>{ if(i>=p){ Atlas.toast(`|xy| ≤ ${p}: y cannot reach position ${i+1}.`); return; } if(a===null||b!==null){ a=i; b=null; out.innerHTML=""; paint(); } else { if(i<a){ a=i; paint(); return; } b=i; paint(); judge(); } };
        sp.onclick=clk; sp.onkeydown=e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); clk(); } }; strip.appendChild(sp); }); }
    function judge(){ const s={x:w.slice(0,a),y:w.slice(a,b+1),z:w.slice(b+1)}; const k=killers(R,s,8);
      const rows=[0,2,3].map(i=>`<span class="mono">i=${i}: ${esc(pump(s,i)||EPS)} ${R.test(pump(s,i))?"∈":"∉"} L</span>`).join(" · ");
      if(k.length){ out.innerHTML=`<div class="note bad" style="margin-top:8px"><b>The prover wins this round with i = ${k[0]}:</b> ${esc(pump(s,k[0])||EPS)} ∉ L.<br>${rows}<br>A careless adversary. A split that survives does exist, because the language is regular. Click to choose again.</div>`; }
      else { out.innerHTML=`<div class="note good" style="margin-top:8px"><b>Your split survives every i.</b> x = ${esc(s.x||EPS)}, y = ${esc(s.y)}, z = ${esc(s.z||EPS)}<br>${rows}<br>${esc(R.why)}</div>`;
        Atlas.stamp("pumping","adv_"+R.id); if(REG.filter(r=>Atlas.has("pumping","adv_"+r.id)).length>=2) Atlas.stamp("pumping","adversary"); } }
    paint();
  }
  REG.forEach(R=>{ const t=h("button","tab",`<b>${esc(R.name)}</b><span>${R.twist?"the twist":"regular"}</span>`); t.type="button"; t.dataset.id=R.id; t.onclick=()=>advStart(R); rtabs.appendChild(t); });
  advStart(REG[0]);

  /* ---------- how it goes wrong ---------- */
  const b4=block(root,"How it goes wrong","Four ways to write a proof that proves nothing","claims");
  quickFire(b4,[
    {claim:"“Let y = a. Then xy²z has p + 1 a's, which is more than the b's, so L is not regular.”", ok:false, why:"That is the adversary's move. Handling one split leaves every other split unaddressed. Write y = aᵝ with β ≥ 1: if no Greek letter appears in your y, you have probably taken the adversary's turn."},
    {claim:"“For EQUAL I chose w = (ab)ᵖ and no i worked, so EQUAL must be regular.”", ok:false, why:"A surviving split means w was the wrong choice, nothing more. With w = (ab)ᵖ the adversary picks x = ε, y = ab. With w = aᵖbᵖ every split is defeated."},
    {claim:"“For w = aᵖbᵖ, the cases ‘y is all b's’ and ‘y straddles the middle’ cannot occur.”", ok:true, why:"|xy| ≤ p puts y inside the first p symbols, which are all a's. You may list the other cases, but say why they are impossible."},
    {claim:"“This language satisfies the pumping lemma, so it is regular.”", ok:false, why:"The lemma is a necessary condition. L regular ⟹ L pumps. The converse is invalid, and { aⁱbʲcᵏ : if i = 1 then j = k } is a witness: it pumps and it is not regular."},
    {claim:"“I may choose a different i for each decomposition the adversary could pick.”", ok:true, why:"The quantifier order is ∀ decomposition ∃ i, so i may depend on the split. Try i = 0 first: it works more often than i = 2."},
    {claim:"“First I fix p = 5, then I choose w = a⁵b⁵.”", ok:false, why:"p is not yours. The adversary supplies it, and every step must be valid for every possible value. That is why w is written in terms of p."}
  ], (c,n)=>{ if(c>=n-1) Atlas.stamp("pumping","claims"); else Atlas.toast(`${c} of ${n} right. Reload the stop to try again.`); });
};
})();
