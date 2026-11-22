/* Station: regular expressions (S9 to S11) */
"use strict";
(function(){
Atlas.stations.regex.stamps=[{id:"bench",label:"Found a witness"},{id:"golf",label:"Regex Golf: all five"},{id:"elim",label:"Eliminated at par"},{id:"claims",label:"Identity claims"}];
const E="ε", O="∅";
/* ---------- a small regular-expression engine in the course notation ---------- */
const Sym=c=>({t:"sym",c}), Eps={t:"eps"}, Emp={t:"empty"};
function parse(src){ const s=[...src.replace(/\s+/g,"")]; let i=0;
  const fail=m=>{ throw new Error(m); };
  function U(){ let x=C(); while(s[i]==="+"||s[i]==="|"||s[i]==="∪"){ i++; x={t:"alt",l:x,r:C()}; } return x; }
  function C(){ let x=null; while(i<s.length && !"+|∪)".includes(s[i])){ const y=S(); x=x?{t:"cat",l:x,r:y}:y; } if(!x) fail(i>=s.length?"The expression stops where an operand is expected.":"There is nothing next to a + sign. Write ε if you mean the empty string."); return x; }
  function S(){ let x=A(); while(s[i]==="*"){ i++; x={t:"star",r:x}; } return x; }
  function A(){ const c=s[i]; if(c==="("){ i++; const x=U(); if(s[i]!==")") fail("A bracket is opened and never closed."); i++; return x; }
    if(c==="*") fail("A star has nothing to its left to repeat.");
    i++; if(c===E||c==="e") return Eps; if(c===O) return Emp; if(c==="a"||c==="b") return Sym(c); fail(`“${c}” is not part of the notation here. Use a, b, ε, ∅, +, * and brackets.`); }
  if(!s.length) fail("Type an expression."); const x=U(); if(i<s.length) fail("There is a closing bracket with no opening one."); return x; }
const prec=x=>x.t==="alt"?1:x.t==="cat"?2:x.t==="star"?3:4;
function show(x){ const w=(y,p)=>prec(y)<p?"("+show(y)+")":show(y);
  return x.t==="sym"?x.c:x.t==="eps"?E:x.t==="empty"?O:x.t==="alt"?show(x.l)+"+"+show(x.r):x.t==="cat"?w(x.l,2)+w(x.r,2):w(x.r,4)+"*"; }
function full(x){ return x.t==="alt"?"("+full(x.l)+" + "+full(x.r)+")":x.t==="cat"?"("+full(x.l)+" "+full(x.r)+")":x.t==="star"?"("+full(x.r)+")*":show(x); }
/* Thompson construction, the six cases of S11. States are numbered in drawing order. */
function thompson(x){ const eps=[], sym=[]; const mk=()=>{ eps.push([]); sym.push({}); return eps.length-1; }; const cost={base:0,union:0,star:0,cat:0};
  function go(y){ if(y.t==="sym"||y.t==="eps"||y.t==="empty"){ cost.base++; const p=mk(), q=mk(); if(y.t==="sym") sym[p][y.c]=[q]; else if(y.t==="eps") eps[p].push(q); return [p,q]; }
    if(y.t==="cat"){ cost.cat++; const A=go(y.l), B=go(y.r); eps[A[1]].push(B[0]); return [A[0],B[1]]; }
    if(y.t==="alt"){ cost.union++; const p=mk(), A=go(y.l), B=go(y.r), q=mk(); eps[p].push(A[0],B[0]); eps[A[1]].push(q); eps[B[1]].push(q); return [p,q]; }
    cost.star++; const p=mk(), A=go(y.r), q=mk(); eps[p].push(A[0],q); eps[A[1]].push(A[0],q); return [p,q]; }
  const [start,end]=go(x); return {eps,sym,start,end,n:eps.length,cost}; }
function matcher(x){ const N=thompson(x); const cl=S=>{ const st=[...S]; while(st.length){ const q=st.pop(); N.eps[q].forEach(t=>{ if(!S.has(t)){ S.add(t); st.push(t); } }); } return S; };
  return w=>{ let S=cl(new Set([N.start])); for(const c of w){ const T=new Set(); S.forEach(q=>(N.sym[q][c]||[]).forEach(t=>T.add(t))); S=cl(T); if(!S.size) return false; } return S.has(N.end); }; }
const WORDS=(()=>{ const out=[""]; let layer=[""]; for(let n=1;n<=10;n++){ const nx=[]; layer.forEach(w=>{ nx.push(w+"a"); nx.push(w+"b"); }); out.push(...nx); layer=nx; } return out; })();
const diff=(f,g)=>WORDS.find(w=>f(w)!==g(w));           // shortest string the two disagree on, or undefined
const len=src=>[...src.replace(/\s+/g,"")].length;
const q=w=>w===""?E:w;
/* simplifying constructors, for the expressions state elimination produces */
const alt=(x,y)=>x.t==="empty"?y:y.t==="empty"?x:show(x)===show(y)?x:{t:"alt",l:x,r:y};
const cat=(x,y)=>x.t==="empty"||y.t==="empty"?Emp:x.t==="eps"?y:y.t==="eps"?x:{t:"cat",l:x,r:y};
const star=x=>x.t==="empty"||x.t==="eps"?Eps:x.t==="star"?x:{t:"star",r:x};

function field(parent,label,value,id){ const ib=h("div","inputbox"); ib.innerHTML=`<label for="${id}">${label}</label><input id="${id}" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="60" style="width:min(26ch,48vw)">`; parent.appendChild(ib); const inp=ib.querySelector("input"); inp.value=value||"";
  [E,O].forEach(c=>{ const b=h("button","ex",c); b.type="button"; b.title="Insert "+c; b.setAttribute("aria-label","Insert "+c); b.onclick=()=>{ const p=inp.selectionStart??inp.value.length; inp.value=inp.value.slice(0,p)+c+inp.value.slice(p); inp.focus(); inp.setSelectionRange(p+1,p+1); inp.dispatchEvent(new Event("input")); }; ib.appendChild(b); });
  return inp; }

Atlas.stations.regex.mount=function(root){
  const b1=block(root,"The idea","A second way to say the same thing","idea");
  const two=h("div","two"); b1.appendChild(two);
  two.appendChild(h("div","panel",`<div class="ph"><h2>The definition is small</h2></div><div class="prose">
    <p>Three constants: <code>∅</code>, <code>ε</code>, and each <code>a ∈ Σ</code>. Three operations: union <code>r + s</code>, concatenation <code>rs</code>, star <code>r*</code>. And a clause saying there is nothing else.</p>
    <p><b>Precedence, highest first:</b> star, then concatenation, then union. So <code>ab*</code> is <code>a(b*)</code>, never <code>(ab)*</code>, and <code>a + bc*</code> is <code>a + (b(c*))</code>.</p>
    <p><b>Kleene's theorem:</b> a language has a regular expression exactly when it has a finite automaton. Machine → expression by state elimination (S10), expression → machine by six small cases (S11).</p></div>`));
  two.appendChild(h("div","panel",`<div class="ph"><h2>Identities you may use without proof</h2></div><div class="tablewrap"><table class="dt" style="width:100%">
    <tr><td>r + ∅ = r</td><td>ε + r* = r*</td></tr><tr><td>r + r = r</td><td>ε + rr* = r*</td></tr><tr><td>∅r = ∅</td><td>(ε + r)* = r*</td></tr>
    <tr><td>εr = r</td><td>r + r* = r*</td></tr><tr><td>∅* = ε</td><td>r*r* = r*</td></tr><tr><td>ε* = ε</td><td>(r*)* = r*</td></tr><tr><td>r(s + t) = rs + rt</td><td>r(sr)* = (rs)*r</td></tr></table></div>
    <p class="idea" style="margin:10px 0 0">The trap: <code>r*r ≠ r*</code>. They differ on exactly one string, ε, and one string is enough.</p>`));

  /* ---------- bench ---------- */
  const b2=block(root,"Lab","The bench: read an expression, or test two against each other","lab");
  const p=h("div","panel"); b2.appendChild(p);
  p.innerHTML=`<div class="ph"><h2>Σ = { a, b }</h2><span class="hint">Type e for ε. Compared on every string of length ≤ 10.</span></div>`;
  const ctl=h("div","controls"); p.appendChild(ctl); const i1=field(ctl,"r =","a+bb*","rxA"), i2=field(ctl,"compare with s =","","rxB");
  const exs=h("div","examples"); ctl.appendChild(exs);
  [["(a*b*)*","(a+b)*"],["a*+b*","(a+b)*"],["(ab)*a","a(ba)*"],["∅*","∅"],["a*a","a*"],["ab*","(ab)*"]].forEach(([x,y])=>{ const b=h("button","ex",esc(x)+" <small>vs</small> "+esc(y)); b.type="button"; b.onclick=()=>{ i1.value=x; i2.value=y; upd(); }; exs.appendChild(b); });
  const out=h("div"); out.style.marginTop="12px"; p.appendChild(out); let witnessSeen=false;
  function upd(){ out.innerHTML=""; let A; try{ A=parse(i1.value); }catch(e){ out.innerHTML=`<div class="note bad">${esc(e.message)}</div>`; return; }
    const f=matcher(A), N=thompson(A), mem=WORDS.filter(w=>w.length<=4&&f(w)).slice(0,14), c=N.cost;
    out.innerHTML=`<div class="dlabel">How it parses, with every bracket written out</div><p style="font-family:var(--mono);font-size:15px;margin:2px 0 10px">${esc(full(A))}</p>
      <div class="dlabel">Its shortest members</div><div class="seq" style="margin-bottom:10px">${mem.length?mem.map(w=>`<span>${esc(q(w))}</span>`).join(""):"<em>no strings at all: this denotes ∅</em>"}${mem.length===14?"<em>…</em>":""}</div>
      <div class="dlabel">The ε-NFA that S11's construction builds</div><p class="idea" style="margin:2px 0 6px">${N.n} states: ${c.base} base machine${c.base>1?"s":""} × 2${c.union?`, ${c.union} union${c.union>1?"s":""} × 2`:""}${c.star?`, ${c.star} star${c.star>1?"s":""} × 2`:""}${c.cat?`, ${c.cat} concatenation${c.cat>1?"s":""} × 0`:""}. One accepting state, and nothing leaves it.</p>`;
    if(N.n<=12){ const d=h("div","diagram"); out.appendChild(d); const nm=k=>String(k+1); const edges=[]; N.eps.forEach((ts,k)=>ts.forEach(t=>edges.push({from:nm(k),to:nm(t),label:E}))); N.sym.forEach((m,k)=>Object.keys(m).forEach(ch=>m[ch].forEach(t=>edges.push({from:nm(k),to:nm(t),label:ch}))));
      drawFA(d,{states:N.eps.map((_,k)=>nm(k)),start:nm(N.start),accept:[nm(N.end)],edges},{maxH:300}); }
    else out.appendChild(h("p","hint","Too many states to draw clearly. Try a shorter expression to see the machine."));
    if(i2.value.trim()){ let B; try{ B=parse(i2.value); }catch(e){ out.appendChild(h("div","note bad","s: "+esc(e.message))); return; } const g=matcher(B), w=diff(f,g);
      out.appendChild(h("div","note "+(w===undefined?"good":"bad"), w===undefined ? `<b>r = s.</b> They agree on all ${WORDS.length} strings of length ≤ 10.` : `<b>r ≠ s.</b> A witness: <code>${esc(q(w))}</code> is in ${f(w)?"r":"s"} and not in ${f(w)?"s":"r"}. One string is enough.`));
      if(w!==undefined) witnessSeen=true; else if(witnessSeen) Atlas.stamp("regex","bench"); } }
  i1.addEventListener("input",upd); i2.addEventListener("input",upd); upd();
  p.appendChild(h("p","hint","For the stamp: find one pair that differs and one pair that is equal."));

  /* ---------- Regex Golf ---------- */
  const b3=block(root,"Challenge","Regex Golf: five languages, shortest expression wins","golf");
  b3.appendChild(h("p","idea","A wrong short answer scores nothing. Count characters, ignoring spaces; ε and ∅ count as one. Check ε on every hole before you commit. Two of the five are traps."));
  const cnt=(w,c)=>[...w].filter(x=>x===c).length;
  const HOLES=[
    {n:"1", d:"Strings that end with ab.", par:8, f:w=>w.endsWith("ab")},
    {n:"2", d:"Strings with an even number of a's.", par:9, f:w=>cnt(w,"a")%2===0, tip:"There is no required part here, so a skeleton will not help. Describe the repeating block."},
    {n:"3", d:"Strings whose length is divisible by 3.", par:18, f:w=>w.length%3===0},
    {n:"4", d:"Strings with no two consecutive a's.", par:12, f:w=>!w.includes("aa"), tip:"Describe the repeating block, then ask what the string may end with."},
    {n:"5", d:"Strings whose first and last symbols are the same.", par:21, f:w=>w.length>0&&w[0]===w[w.length-1], alt:w=>w.length===0||w[0]===w[w.length-1], tip:"Think about the one-symbol strings separately. ε has no first or last symbol: the slides rule it out, and ruling it in is accepted too."},
    {n:"P1", d:"Practice: at least two b's.", par:20, f:w=>cnt(w,"b")>=2, extra:true},
    {n:"P2", d:"Practice: exactly two b's.", par:8, f:w=>cnt(w,"b")===2, extra:true},
    {n:"P3", d:"Practice: starts with a and ends with b.", par:8, f:w=>w.startsWith("a")&&w.endsWith("b"), extra:true}];
  const solved=new Set(); const grid=h("div","two"); b3.appendChild(grid);
  HOLES.forEach((H,k)=>{ const pn=h("div","panel"); grid.appendChild(pn);
    pn.innerHTML=`<div class="ph"><h2>${H.extra?"":"Hole "+H.n+" · "}${esc(H.d)}</h2><span class="hint">par ${H.par}</span></div>`+(H.tip?`<p class="idea" style="margin:0 0 8px">${esc(H.tip)}</p>`:"");
    const row=h("div","controls"); pn.appendChild(row); const inp=field(row,"r =","","golf"+k); const ck=h("button","btn primary","Check"); ck.type="button"; row.appendChild(ck); const o=h("div"); o.style.marginTop="10px"; pn.appendChild(o);
    const check=()=>{ let A; try{ A=parse(inp.value); }catch(e){ o.innerHTML=`<div class="note bad">${esc(e.message)}</div>`; return; } const f=matcher(A); let w=diff(f,H.f), took="";
      if(w!==undefined && H.alt && diff(f,H.alt)===undefined){ w=undefined; took=" You ruled ε in, which is a legitimate reading as long as you say so."; }
      if(w!==undefined){ o.innerHTML=`<div class="note bad"><b>Scores nothing.</b> ${f(w)?`It accepts <code>${esc(q(w))}</code>, which is not in the language.`:`It rejects <code>${esc(q(w))}</code>, which is a member.`} Found by testing a string, not by staring.</div>`; return; }
      const n=len(inp.value), d=n-H.par; o.innerHTML=`<div class="note good"><b>Correct, in ${n} characters.</b> ${d===0?"That is par.":d<0?`${-d} under par. Shorter than the slide's answer.`:`${d} over par. It is right, so it scores, and a shorter one exists.`}${took}</div>`;
      if(!H.extra){ solved.add(H.n); if(solved.size===5) Atlas.stamp("regex","golf"); } };
    ck.onclick=check; inp.addEventListener("keydown",e=>{ if(e.key==="Enter") check(); }); });

  /* ---------- state elimination ---------- */
  const b4=block(root,"Challenge","Eliminate in Any Order: the order is free, and worth choosing","elim");
  const GS=[
    {id:"aa", name:"Contains aa", tag:"S10 walkthrough", note:"q1 no progress, q2 the last symbol was an a, q3 aa has been seen.", states:["q1","q2","q3"], start:"q1", accept:["q3"], delta:{q1:{a:"q2",b:"q1"},q2:{a:"q3",b:"q1"},q3:{a:"q3",b:"q3"}}},
    {id:"ev", name:"Even number of a's", tag:"S10 activity", note:"e is the start state and the only accepting state.", states:["e","o"], start:"e", accept:["e"], delta:{e:{a:"o",b:"e"},o:{a:"e",b:"o"}}},
    {id:"m3", name:"a's divisible by 3", tag:"S10 practice", note:"Each a advances round the cycle r0 → r1 → r2 → r0. Each b is a self-loop.", states:["r0","r1","r2"], start:"r0", accept:["r0"], delta:{r0:{a:"r1",b:"r0"},r1:{a:"r2",b:"r1"},r2:{a:"r0",b:"r2"}}}];
  const gnfa=G=>{ const R={}; const set=(x,y,r)=>{ (R[x]=R[x]||{})[y]=R[x][y]?alt(R[x][y],r):r; }; set("s0",G.start,Eps); G.states.forEach(s=>["a","b"].forEach(c=>set(s,G.delta[s][c],Sym(c)))); G.accept.forEach(s=>set(s,"sf",Eps)); return R; };
  function eliminate(R,x){ const ins=Object.keys(R).filter(p=>p!==x&&R[p][x]), outs=Object.keys(R[x]).filter(r=>r!==x), loop=R[x][x]||Emp, steps=[];
    ins.forEach(pp=>outs.forEach(r=>{ const old=R[pp][r]||Emp, via=cat(cat(R[pp][x],star(loop)),R[x][r]), nw=alt(old,via); steps.push({p:pp,r,old,inn:R[pp][x],loop,out:R[x][r],nw}); R[pp][r]=nw; }));
    delete R[x]; Object.keys(R).forEach(pp=>delete R[pp][x]); return steps; }
  const finalLen=(G,order)=>{ const R=gnfa(G); order.forEach(x=>eliminate(R,x)); return show(R.s0.sf||Emp).length; };
  const perms=a=>a.length<2?[a]:a.flatMap((x,i)=>perms(a.filter((_,j)=>j!==i)).map(r=>[x,...r]));
  const gt=h("div","machines"); b4.appendChild(gt); const gh=h("div","view"); b4.appendChild(gh);
  function showG(G){ [...gt.children].forEach(t=>t.setAttribute("aria-selected", t.dataset.id===G.id?"true":"false")); gh.innerHTML="";
    const all=perms(G.states).map(o=>finalLen(G,o)), par=Math.min(...all), worst=Math.max(...all);
    const pn=h("div","panel"); gh.appendChild(pn); let R=gnfa(G), left=[...G.states], order=[], updates=0;
    function draw(logHtml){ pn.innerHTML=`<div class="ph"><h2>${esc(G.name)}</h2><span class="hint">${esc(G.note)} &nbsp; par ${par}</span></div>
        <p class="idea" style="margin:0 0 8px">Every arrow carries a regular expression. A new start s0 and a new accepting state sf have been added with ε-arrows. Pick a state to eliminate: each (in, out) pair around it becomes <code>old route + in · loop* · out</code>.</p>`;
      const names=["s0",...left,"sf"], d=h("div","diagram"); pn.appendChild(d); const edges=[]; names.forEach(x=>names.forEach(y=>{ if(R[x]&&R[x][y]) edges.push({from:x,to:y,label:show(R[x][y])}); }));
      drawFA(d,{states:names,start:"s0",accept:["sf"],edges},{maxH:300});
      const row=h("div","row"); pn.appendChild(row);
      if(left.length){ row.appendChild(h("span","hint","Eliminate:")); left.forEach(x=>{ const ins=Object.keys(R).filter(pp=>pp!==x&&R[pp][x]).length, outs=Object.keys(R[x]).filter(r=>r!==x).length; const b=h("button","btn",`${esc(x)} <small style="font-weight:400;color:var(--muted)">${R[x][x]?"loop "+esc(show(R[x][x])):"no self-loop"} · ${ins*outs} pair${ins*outs>1?"s":""}</small>`); b.type="button"; b.onclick=()=>step(x); row.appendChild(b); }); }
      const rs=h("button","btn","Start again"); rs.type="button"; rs.onclick=()=>showG(G); row.appendChild(rs);
      const lg=h("div"); lg.style.marginTop="10px"; lg.innerHTML=logHtml||""; pn.appendChild(lg);
      if(!left.length){ const ans=show(R.s0.sf||Emp), n=ans.length; const okLang=diff(matcher(R.s0.sf||Emp), w=>dfaAccepts({states:G.states,sigma:["a","b"],start:G.start,accept:G.accept,delta:G.delta},w))===undefined;
        lg.appendChild(h("div","note "+(n===par?"good":""),`<b>Only s0 and sf are left. The answer is the label on the one arrow:</b><br><code style="font-size:15px">${esc(ans)}</code><br>${n} characters, after ${updates} label update${updates>1?"s":""}, in the order ${order.map(esc).join(", ")}. ${okLang?"Checked against the machine on every string of length ≤ 10.":""} ${n===par?"<b>That is par</b>: no order does better.":`Par is ${par}${worst>n?"":", and this is the most expensive order"}. Every order gives a correct answer, because each single step preserves the language. What the order changes is the size. Start again and eliminate the state with no self-loop, or the fewest (in, out) pairs, first.`}`));
        if(n===par) Atlas.stamp("regex","elim"); } }
    function step(x){ const st=eliminate(R,x); left=left.filter(y=>y!==x); order.push(x); updates+=st.length; const loop=st.length?st[0].loop:Emp;
      draw(`<div class="dlabel">Eliminated ${esc(x)} · ${st.length} pair${st.length>1?"s":""} updated</div><p class="idea" style="margin:2px 0 6px">${loop.t==="empty"?`R(${esc(x)}, ${esc(x)}) = ∅ and ∅* = ε, so the loop term disappears. This is the cheap case.`:`R(${esc(x)}, ${esc(x)}) = ${esc(show(loop))}, so the star survives into every new label.`}</p>
        <div class="tablewrap"><table class="dt"><tr><th>pair</th><th>old</th><th>in</th><th>loop*</th><th>out</th><th>new label</th></tr>${st.map(s=>`<tr><th>${esc(s.p)} → ${esc(s.r)}</th><td>${esc(show(s.old))}</td><td>${esc(show(s.inn))}</td><td>${esc(show(star(s.loop)))}</td><td>${esc(show(s.out))}</td><td><b>${esc(show(s.nw))}</b></td></tr>`).join("")}</table></div>
        <p class="hint" style="margin-top:6px">ε·r = r and r + ∅ = r have been applied silently, as on the slides.</p>`); }
    draw(); }
  GS.forEach(G=>{ const t=h("button","tab",`<b>${esc(G.name)}</b><span>${esc(G.tag)}</span>`); t.type="button"; t.dataset.id=G.id; t.onclick=()=>showG(G); gt.appendChild(t); });
  showG(GS[0]);

  const b6=block(root,"How it goes wrong","Identities: some hold, some only look as if they do","claims");
  quickFire(b6,[
    {claim:"“ab* means (ab)*: the star applies to everything before it.”", ok:false, why:"Star binds tighter than concatenation. ab* = a(b*) = a, ab, abb, … while (ab)* = ε, ab, abab, …"},
    {claim:"“(a*b*)* = (a + b)*”", ok:true, why:"Each block a*b* can be a single a or a single b, so the left side already builds every string."},
    {claim:"“a* + b* = (a + b)*”", ok:false, why:"A witness: ab. It is in (a + b)* and in neither a* nor b*."},
    {claim:"“∅* = ∅”", ok:false, why:"R⁰ = { ε } for every set R, including the empty one. So ∅* = ε. The two sides differ on exactly one string."},
    {claim:"“(ab)*a = a(ba)*”", ok:true, why:"The sliding identity r(sr)* = (rs)*r. State elimination often produces one form when the tidy answer is the other."},
    {claim:"“(aa)* is a regular expression for an even number of a's over { a, b }.”", ok:false, why:"It forbids b's entirely. (b + ab*a)* works: every block preserves the parity of a."},
    {claim:"“Different elimination orders give different expressions, so some of them must be wrong.”", ok:false, why:"Every single elimination step preserves the language of the GNFA, so every order reaches a correct answer. Only the size changes."},
    {claim:"“The construction from a regular expression always produces an ε-NFA.”", ok:true, why:"Symbols appear only inside the base machines, and every wiring adds nothing but ε-arrows. If a plain NFA is demanded, run ε-removal afterwards."}
  ], (c,n)=>{ if(c>=n-1) Atlas.stamp("regex","claims"); else Atlas.toast(`${c} of ${n} right. Reload the stop to try again.`); });
};
})();
