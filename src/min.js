/* Station: minimisation (S3) */
"use strict";
(function(){
Atlas.stations.min.stamps=[{id:"watch",label:"Watched the rounds"},{id:"split",label:"Called every split"},{id:"table",label:"Filled the table"},{id:"claims",label:"Minimisation claims"}];
const MS=[
  {id:"six", name:"The six-state machine", tag:"from the slides", note:"L = 0*1: any number of 0s, then exactly one 1.",
   states:["A","B","C","D","E","G"], sigma:["0","1"], start:"A", accept:["D"],
   delta:{A:{0:"B",1:"D"},B:{0:"A",1:"D"},C:{0:"A",1:"D"},D:{0:"G",1:"E"},E:{0:"E",1:"E"},G:{0:"G",1:"G"}}},
  {id:"mod", name:"A counter that over-counts", tag:"extra practice", note:"It counts 0's modulo 6 but only asks whether the count is divisible by 3.",
   states:["r0","r1","r2","r3","r4","r5"], sigma:["0","1"], start:"r0", accept:["r0","r3"],
   delta:{r0:{0:"r1",1:"r0"},r1:{0:"r2",1:"r1"},r2:{0:"r3",1:"r2"},r3:{0:"r4",1:"r3"},r4:{0:"r5",1:"r4"},r5:{0:"r0",1:"r5"}}},
  {id:"ends", name:"Ends with 01, drawn clumsily", tag:"extra practice", note:"Five states for a language that needs three.",
   states:["p0","p1","p2","p3","p4"], sigma:["0","1"], start:"p0", accept:["p2"],
   delta:{p0:{0:"p1",1:"p3"},p1:{0:"p4",1:"p2"},p2:{0:"p1",1:"p3"},p3:{0:"p1",1:"p0"},p4:{0:"p4",1:"p2"}}}
];
const chip=(b,i,tag)=>`<${tag||"span"} class="blockchip b${i%6}"><span class="bnum c${i%6}">${i+1}</span>{ ${b.join(", ")} }</${tag||"span"}>`;

Atlas.stations.min.mount=function(root){
  const b1=block(root,"The idea","Two machines, one language: which states are really the same?","idea");
  const two=h("div","two"); b1.appendChild(two);
  two.appendChild(h("div","panel",`<div class="ph"><h2>What "the same state" means</h2></div><div class="prose">
    <p><b>Distinguishable:</b> p and q are distinguishable if some string w takes one of them to an accepting state and the other to a non-accepting one. That w is the evidence, and one witness is enough.</p>
    <p><b>Equivalent</b>, written <code>p ≡ q</code>: no string distinguishes them.</p>
    <p>The minimal DFA for a language is <b>unique</b> up to renaming the states. So "are these two machines equivalent?" becomes a mechanical question: minimise both and compare.</p></div>`));
  two.appendChild(h("div","panel",`<div class="ph"><h2>Method 1 · Partition refinement</h2></div><ol class="recipe">
    <li><div>Delete every state unreachable from the start state.<small>must be first</small></div></li>
    <li><div>Split Q into two blocks: F, and Q \\ F.<small>ε already tells these apart</small></div></li>
    <li><div>For each state, record which BLOCK each symbol sends it to.<small>the block, not the state</small></div></li>
    <li><div>If two states in a block disagree on any symbol, split the block.</div></li>
    <li><div>When a whole round causes no split, stop. Each block is one state.<small>blocks never merge</small></div></li></ol>`));

  const mt=h("div","machines"); root.appendChild(mt);
  const host=h("div","view"); root.appendChild(host);
  function show(M){
    [...mt.children].forEach(t=>t.setAttribute("aria-selected", t.dataset.id===M.id?"true":"false")); host.innerHTML="";
    const ref=dfaRefine(M), R=ref.reachable, dead=M.states.filter(q=>!R.includes(q));
    /* lab */
    const b2=block(host,"Lab","Partition refinement, round by round","lab");
    const p0=h("div","panel"); b2.appendChild(p0);
    p0.innerHTML=`<div class="ph"><h2>${esc(M.name)}</h2><span class="hint">${esc(M.note)}</span></div>`;
    const d0=h("div","diagram"); p0.appendChild(d0); drawFA(d0,{states:M.states,start:M.start,accept:M.accept,edges:dfaEdges(M)},{maxH:230});
    p0.appendChild(h("p","idea",`<b>Step 1.</b> Start at ${M.start} and follow arrows. Reached: ${R.join(", ")}. `+(dead.length?`Never reached: <b>${dead.join(", ")}</b>. Nothing points into ${dead.length>1?"them":"it"}, so no input can ever put the machine there. Delete ${dead.length>1?"them":"it"}.`:"Every state is reachable, so nothing is deleted.")));
    const rp=h("div","panel"); b2.appendChild(rp); let shown=0;
    function drawRounds(){
      rp.innerHTML=`<div class="ph"><h2>The rounds</h2><span class="hint">Read the block numbers, not the state names</span></div>`;
      ref.rounds.slice(0,shown+1).forEach((r,k)=>{
        const idx={}; r.blocks.forEach((b,i)=>b.forEach(q=>idx[q]=i));
        const wrap=h("div"); wrap.style.marginBottom="14px";
        wrap.innerHTML=`<div class="dlabel">${k===0?"Step 2 · the first split is free":"Round "+k+" · partition"}</div><div class="blocks">${r.blocks.map((b,i)=>chip(b,i)).join("")}</div>`;
        const rows=R.map(q=>{ const b=r.blocks[idx[q]]; const odd=b.some(x=>r.sig[x].join()!==r.sig[b[0]].join());
          return `<tr><th><span class="bnum c${idx[q]%6}">${idx[q]+1}</span>${esc(q)}</th>${M.sigma.map((a,j)=>`<td>${esc(M.delta[q][a])} <span class="bnum c${r.sig[q][j]%6}">${r.sig[q][j]+1}</span></td>`).join("")}<td class="${odd?"sigdiff":""}">( ${r.sig[q].map(x=>x+1).join(", ")} )</td></tr>`; }).join("");
        wrap.innerHTML+=`<div class="tablewrap" style="margin-top:8px"><table class="dt"><tr><th>state</th>${M.sigma.map(a=>`<th>on ${esc(a)}</th>`).join("")}<th>signature</th></tr>${rows}</table></div>`;
        const any=r.splits.some(x=>x);
        wrap.innerHTML+=`<p class="idea" style="margin:8px 0 0">${any?r.blocks.map((b,i)=>r.splits[i]?`Block ${i+1} has different signatures inside it, so it <b>splits</b>.`:"").join(" "):`A full round with no split. The algorithm <b>stops</b>: ${r.blocks.length} blocks, therefore ${r.blocks.length} states in the minimal machine, down from ${M.states.length}.`}</p>`;
        rp.appendChild(wrap); });
      if(shown<ref.rounds.length-1){ const nx=h("button","btn primary","Next round"); nx.type="button"; nx.onclick=()=>{ shown++; drawRounds(); }; rp.appendChild(nx); }
      else { const fin=ref.rounds[ref.rounds.length-1].blocks; const nm=b=>b.join(""); const idx={}; fin.forEach((b,i)=>b.forEach(q=>idx[q]=i));
        const mm={states:fin.map(nm),sigma:M.sigma,start:nm(fin[idx[M.start]]),accept:fin.filter(b=>M.accept.includes(b[0])).map(nm),delta:{}};
        fin.forEach(b=>{ mm.delta[nm(b)]={}; M.sigma.forEach(a=>mm.delta[nm(b)][a]=nm(fin[idx[M.delta[b[0]][a]]])); });
        rp.appendChild(h("div","dlabel","The minimal machine: each block becomes one state")); const d=h("div","diagram"); rp.appendChild(d);
        drawFA(d,{states:mm.states,start:mm.start,accept:mm.accept,edges:dfaEdges(mm)},{maxH:210});
        rp.appendChild(h("p","idea","Pick any member of a block to read off its arrows. They all agree, which is what put them in the same block."));
        Atlas.stamp("min","watch"); } }
    drawRounds();

    /* challenge 1 */
    const b3=block(host,"Challenge","Call the split: which block breaks this round?","split");
    const cp=h("div","panel"); b3.appendChild(cp); let k=0, miss=0;
    function ask(){ const r=ref.rounds[k]; cp.innerHTML=`<div class="ph"><h2>Round ${k+1} of ${ref.rounds.length}</h2><span class="hint">Work out each state's signature, then click a block that must split</span></div>
        <p class="idea" style="margin:0 0 8px">δ: ${R.map(q=>`${q}: ${M.sigma.map(a=>a+"→"+M.delta[q][a]).join(", ")}`).join(" · ")}</p>`;
      const row=h("div","blocks"); cp.appendChild(row); const out=h("div"); out.style.marginTop="10px"; cp.appendChild(out);
      const answer=(i)=>{ const want = i===-1 ? !r.splits.some(x=>x) : r.splits[i];
        if(!want){ miss++; out.innerHTML=`<div class="note bad">${i===-1?"Not yet. Some block still has two states with different signatures.":"Every state in that block has the same signature, so it stays together this round."}</div>`; return; }
        if(i===-1){ out.innerHTML=`<div class="note good"><b>Right, nothing splits.</b> The machine has ${r.blocks.length} states once minimised. ${miss===0?"No wrong calls.":miss+" wrong call"+(miss>1?"s":"")+" on the way."}</div>`; if(miss<=1) Atlas.stamp("min","split"); row.querySelectorAll("button").forEach(b=>b.disabled=true); return; }
        const b=r.blocks[i]; out.innerHTML=`<div class="note good"><b>Yes.</b> In block ${i+1}: ${b.map(q=>`${q} has signature (${r.sig[q].map(x=>x+1).join(", ")})`).join("; ")}.</div>`;
        row.querySelectorAll("button").forEach(x=>x.disabled=true); const nx=h("button","btn primary","Rewrite the partition and go on"); nx.type="button"; nx.style.marginTop="8px"; nx.onclick=()=>{ k++; ask(); }; out.appendChild(nx); };
      r.blocks.forEach((b,i)=>{ const bt=h("button","blockchip b"+(i%6),`<span class="bnum c${i%6}">${i+1}</span>{ ${b.join(", ")} }`); bt.type="button"; bt.onclick=()=>answer(i); row.appendChild(bt); });
      const st=h("button","btn","No block splits: stop"); st.type="button"; st.onclick=()=>answer(-1); row.appendChild(st); }
    ask();

    /* challenge 2 */
    const b4=block(host,"Challenge","Method 2: fill the table, then see the witnesses","table");
    const tp=h("div","panel"); b4.appendChild(tp); const W=dfaWitness(M); const marked=new Set();
    tp.innerHTML=`<div class="ph"><h2>Mark every distinguishable pair</h2><span class="hint">${R.length}(${R.length}−1)/2 = ${R.length*(R.length-1)/2} cells. Count them before you start.</span></div>
      <p class="idea" style="margin:0 0 8px">Click a cell to mark the pair as distinguishable. Start with accepting against non-accepting (witness ε), then mark (p, q) whenever some symbol sends it to a pair that is already marked.</p>`;
    const tb=h("table","dt tri"); const tw=h("div","tablewrap"); tw.appendChild(tb); tp.appendChild(tw);
    function drawT(res){ tb.innerHTML="<tr><th></th>"+R.slice(0,-1).map(q=>`<th>${esc(q)}</th>`).join("")+"</tr>";
      R.slice(1).forEach((q,i)=>{ const tr=h("tr"); tr.appendChild(h("th",null,esc(q)));
        R.slice(0,-1).forEach((p,j)=>{ const td=h("td"); if(j>i){ td.className="na"; tr.appendChild(td); return; } const key=W.key(p,q); const dist=W.w[key]!==undefined;
          if(res){ const said=marked.has(key); td.className= said===dist ? "ok":"no"; td.innerHTML= dist ? "× "+esc(W.w[key]||EPS) : "≡"; td.title= dist?`pass ${W.pass[key]}: ${W.w[key]||"ε"} separates ${p} and ${q}`:`no string separates ${p} and ${q}`; }
          else { td.className=marked.has(key)?"mk":""; td.textContent=marked.has(key)?"×":""; td.setAttribute("role","button"); td.tabIndex=0; td.setAttribute("aria-label",`pair ${p} ${q}`);
            const tg=()=>{ marked.has(key)?marked.delete(key):marked.add(key); drawT(); }; td.onclick=tg; td.onkeydown=e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); tg(); } }; }
          tr.appendChild(td); }); tb.appendChild(tr); }); }
    drawT();
    const row=h("div","row"); row.style.marginTop="10px"; tp.appendChild(row); const out=h("div"); out.style.marginTop="10px"; tp.appendChild(out);
    const ck=h("button","btn primary","Check the table"), rs=h("button","btn","Clear"); ck.type=rs.type="button"; row.appendChild(ck); row.appendChild(rs);
    rs.onclick=()=>{ marked.clear(); out.innerHTML=""; drawT(); };
    ck.onclick=()=>{ const keys=[]; for(let i=0;i<R.length;i++) for(let j=i+1;j<R.length;j++) keys.push(W.key(R[i],R[j]));
      const wrong=keys.filter(k=>marked.has(k)!==(W.w[k]!==undefined)); const eq=keys.filter(k=>W.w[k]===undefined);
      drawT(true);
      out.innerHTML = wrong.length ? `<div class="note bad"><b>${wrong.length} cell${wrong.length>1?"s":""} wrong</b> (shown in red). Each marked cell now shows its witness: the string that one state accepts and the other rejects. ≡ means no such string exists. Press Clear to try again.</div>`
        : `<div class="note good"><b>Every cell is right.</b> Unmarked pairs: ${eq.length?eq.map(k=>"("+k.replace("|",", ")+")").join(" and "):"none"}. Merge each one, and you get the same blocks as Method 1. That agreement is guaranteed, not lucky: there is only one minimal DFA to find.</div>`;
      if(!wrong.length) Atlas.stamp("min","table"); };
  }
  MS.forEach(M=>{ const t=h("button","tab",`<b>${esc(M.name)}</b><span>${esc(M.tag)}</span>`); t.type="button"; t.dataset.id=M.id; t.onclick=()=>show(M); mt.appendChild(t); });
  show(MS[0]);

  const b5=block(root,"How it goes wrong","Merging states, and the traps in it","claims");
  quickFire(b5,[
    {claim:"“State C has two arrows leaving it, so it is doing work and must stay in the machine.”", ok:false, why:"Nothing points INTO C, so no input can ever put the machine there. Unreachable states are deleted first, or one can survive in a block of its own and leave a machine that is not minimal."},
    {claim:"“A goes to B and B goes to A on 0. Those are different states, so A and B have different signatures.”", ok:false, why:"Read the block numbers, not the state names. A and B both go to block 2 on 0 and block 1 on 1, so both have signature (2, 1) and stay together."},
    {claim:"“Two blocks that split apart in an early round can be merged again later if they turn out to agree.”", ok:false, why:"Refinement, not rearrangement. Blocks only ever get smaller. Nothing that has been separated is ever put back together."},
    {claim:"“A block that did not split this round still has to be re-examined next round.”", ok:true, why:"The block numbers have changed underneath it, so its states' signatures may now differ."},
    {claim:"“To show two states are distinguishable I need one string. To show they are equivalent, no single string is enough.”", ok:true, why:"“Equivalent” is a claim about infinitely many strings. “Distinguishable” is a claim you can prove with one. That is why the table marks pairs rather than proving equivalences."},
    {claim:"“Partition refinement and table filling can give different minimal machines for the same DFA.”", ok:false, why:"The minimal DFA is unique up to renaming, so any correct method must find the same blocks."}
  ], (c,n)=>{ if(c>=n-1) Atlas.stamp("min","claims"); else Atlas.toast(`${c} of ${n} right. Reload the stop to try again.`); });
};
})();
