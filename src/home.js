/* Station registry (course order) and the home page with the hierarchy map */
"use strict";
[
  {id:"dfa", title:"Deterministic finite automata", short:"DFAs", sessions:"S1–S2", module:"Module 1 · Finite automata", region:"Regular", x:100, y:262,
   blurb:"A machine with no memory beyond its state. Run her machines one symbol at a time, then design your own and let the checker hunt for a string that breaks it.",
   stamps:[{id:"run",label:"Ran a machine"},{id:"design1",label:"First correct design"},{id:"design3",label:"Three designs"},{id:"minimal",label:"A minimal machine"},{id:"claims",label:"DFA claims"}]},
  {id:"min", title:"Minimisation", short:"Minimisation", sessions:"S3", module:"Module 1 · Finite automata", region:"Regular", x:175, y:392,
   blurb:"Two machines, one language: merge the states nobody can tell apart, by partition refinement and by table filling."},
  {id:"nfa", title:"NFAs and ε-moves", short:"NFAs and ε", sessions:"S4–S6", module:"Module 2 · Nondeterminism", region:"Regular", x:250, y:262,
   blurb:"Machines that guess, and why guessing buys nothing here: Subset Race, Closure Chains, Kill the ε."},
  {id:"mm", title:"Moore and Mealy machines", short:"Moore and Mealy", sessions:"S7", module:"Module 3 · Machines with output", region:"Regular", x:325, y:392,
   blurb:"Machines that write, not just judge. Convert one into the other and match the output."},
  {id:"regex", title:"Regular expressions", short:"Regular expressions", sessions:"S9–S11", module:"Module 4 · Regular expressions", region:"Regular", x:400, y:262,
   blurb:"A second way to say the same thing: Regex Golf, state elimination in any order, and the machine built from the inside out."},
  {id:"closure", title:"Closure properties", short:"Closure", sessions:"S12", module:"Module 5 · Properties of regular languages", region:"Regular", x:425, y:402,
   blurb:"Seven operations that stay inside the class, and one product machine with three accepting sets."},
  {id:"pumping", title:"The pumping lemma", short:"Pumping lemma", sessions:"S13", module:"Module 5 · Properties of regular languages", region:"The edge of Regular", x:486, y:330, wall:true, lab:"r",
   blurb:"Proving that no machine exists is a game against an adversary. You choose w and i. The adversary chooses p and the split. Play both sides.",
   stamps:[{id:"anbn",label:"Beat aⁿbⁿ"},{id:"equal",label:"Beat EQUAL"},{id:"three",label:"Three languages proved"},{id:"survive",label:"Fell for a bad w"},{id:"adversary",label:"Won as the adversary"},{id:"claims",label:"Proof claims"}]},
  {id:"cfg", title:"Grammars and derivation trees", short:"Grammars", sessions:"S17–S18", module:"Module 6 · Grammars", region:"Context-free", x:560, y:262,
   blurb:"Generate instead of recognise. Grow a derivation tree one step at a time, and find two trees for one string."},
  {id:"cnf", title:"Normal forms", short:"Normal forms", sessions:"S19", module:"Module 6 · Grammars", region:"Context-free", x:625, y:392,
   blurb:"Clean a grammar, then put it in Chomsky normal form: the CNF Conversion Relay, one step at a time."},
  {id:"pda", title:"Pushdown automata", short:"Pushdown automata", sessions:"S20–S21", module:"Module 7 · Pushdown automata", region:"Context-free", x:690, y:262,
   blurb:"A finite automaton with one addition, a stack. Watch every move, every guess, and the stack over time.",
   stamps:[{id:"run",label:"Watched a full run"},{id:"guess",label:"Saw one guess survive"},{id:"stuck",label:"Saw a branch get stuck"},{id:"own",label:"Built your own machine"}]},
  {id:"cyk", title:"The CYK algorithm", short:"CYK", sessions:"S24", module:"Module 8 · Context-free limits", region:"Context-free", x:755, y:392,
   blurb:"A table that answers the membership question: CYK Table Sprint."},
  {id:"cflpump", title:"Closure and pumping for CFLs", short:"CFL limits", sessions:"S22–S23", module:"Module 8 · Context-free limits", region:"The edge of Context-free", x:812, y:320, wall:true, lab:"r",
   blurb:"Three pieces became five. Break the Language: the pumping game one level up."},
  {id:"tm", title:"Turing machines", short:"Turing machines", sessions:"S25", module:"Module 9 · Turing machines", region:"Recursively enumerable", x:985, y:262,
   blurb:"A tape instead of a stack. Tape Walk, and design by mark, cross, return."},
  {id:"halt", title:"The halting problem", short:"Halting problem", sessions:"S25+", module:"Module 9 · Turing machines", region:"Beyond", x:1050, y:400,
   blurb:"Accept, reject, or neither: the question no machine can answer."}
].forEach(d=>{ d.stamps=d.stamps||[]; Atlas.register(d); });

/* hand-drawn coastline around a rounded rectangle: deterministic wobble, smooth closed curve */
function coastPath(x,y,w,hh,r,off,amp,seed){
  const P=[]; const add=(px,py,nx,ny)=>P.push([px,py,nx,ny]); const st=11;
  const edge=(x0,y0,x1,y1,nx,ny)=>{ const L=Math.hypot(x1-x0,y1-y0), n=Math.max(1,Math.round(L/st)); for(let i=0;i<n;i++) add(x0+(x1-x0)*i/n,y0+(y1-y0)*i/n,nx,ny); };
  const arc=(cx,cy,a0)=>{ for(let i=0;i<4;i++){ const a=(a0+i*22.5)*Math.PI/180; add(cx+r*Math.cos(a),cy+r*Math.sin(a),Math.cos(a),Math.sin(a)); } };
  edge(x+r,y,x+w-r,y,0,-1); arc(x+w-r,y+r,-90); edge(x+w,y+r,x+w,y+hh-r,1,0); arc(x+w-r,y+hh-r,0);
  edge(x+w-r,y+hh,x+r,y+hh,0,1); arc(x+r,y+hh-r,90); edge(x,y+hh-r,x,y+r,-1,0); arc(x+r,y+r,180);
  let d=0; const Q=P.map(([px,py,nx,ny],i)=>{ d+=i?Math.hypot(px-P[i-1][0],py-P[i-1][1]):0;
    const k=off+amp*(Math.sin(d*.045+seed)*.55+Math.sin(d*.11+seed*1.7)*.3+Math.sin(d*.27+seed*2.3)*.15); return [px+nx*k,py+ny*k]; });
  const n=Q.length, f=v=>v.toFixed(1); let out=`M${f(Q[0][0])} ${f(Q[0][1])}`;
  for(let i=0;i<n;i++){ const a=Q[(i-1+n)%n],b=Q[i],c=Q[(i+1)%n],e=Q[(i+2)%n];
    out+=`C${f(b[0]+(c[0]-a[0])/6)} ${f(b[1]+(c[1]-a[1])/6)} ${f(c[0]-(e[0]-b[0])/6)} ${f(c[1]-(e[1]-b[1])/6)} ${f(c[0])} ${f(c[1])}`; }
  return out+"Z"; }

const Home = {
  mount(view){
    const hero=h("section","hero");
    hero.innerHTML=`<div><div class="eyebrow">CSCE 4201 · Theory of Computing · Fall 2026</div>
      <h1>Automata <em>Atlas</em></h1>
      <p class="lede">The whole course on one map. Every session is a stop where you can run the machine, break it, and play the in-class activity. What separates the regions is memory.</p></div>
      <ul class="facts">
        <li><b>Not all problems are solvable.</b>Some well-posed yes/no questions have no algorithm at all.</li>
        <li><b>Not all solvable problems are practical.</b></li>
        <li><b>Not all systems can be fully verified.</b>These are mathematical limits, not engineering weaknesses.</li>
      </ul>`;
    view.appendChild(hero);

    const mapP=h("section","panel mappanel"); mapP.innerHTML=`<div class="ph"><h2>The map of the semester</h2><span class="hint">The Chomsky hierarchy, from the inside out. Click a stop to open it.</span></div>`;
    const mw=h("div","mapwrap"); mapP.appendChild(mw); view.appendChild(mapP);
    const s=svg("svg",{viewBox:"0 0 1120 520",role:"img","aria-label":"Map of the course across the Chomsky hierarchy"},mw);
    const defs=svg("defs",{},s);
    const gp=svg("pattern",{id:"mapgrid",width:56,height:56,patternUnits:"userSpaceOnUse"},defs); svg("path",{d:"M56 0H0V56",class:"graticule"},gp);
    const regs=[
      ["r0","re",10,10,1100,500,"Type 0 · Recursively enumerable","Turing machine · unbounded tape","⟨M,w⟩ : M halts on w"],
      ["r1","cs",24,62,932,434,"Type 1 · Context-sensitive","Linear-bounded automaton · bounded tape","aⁿbⁿcⁿ"],
      ["r2","cf",38,114,762,368,"Type 2 · Context-free","Pushdown automaton · a stack","aⁿbⁿ"],
      ["r3","reg",52,166,422,302,"Type 3 · Regular","Finite automaton · no memory beyond the state","even number of a's"]];
    regs.forEach(([c,z,x,y,w,hh,l,sub,land],ri)=>{
      if(c!=="r0") svg("path",{d:coastPath(x,y,w,hh,26,7,2.5,ri*1.9+.4),class:"waterline "+c},s);
      svg("path",{d:coastPath(x,y,w,hh,26,0,3.5,ri*1.9),class:"region "+c},s);
      if(c==="r0") svg("path",{d:coastPath(x,y,w,hh,26,0,3.5,0),fill:"url(#mapgrid)",class:"gridfill"},s);
      svg("text",{x:x+18,y:y+25,class:"rlabel t"+c},s,l.toUpperCase()); svg("text",{x:x+18,y:y+40,class:"rsub"},s,sub);
      svg("text",{x:x+w-16,y:y+24,"text-anchor":"end",class:"rland"},s,"landmark: "+land); });
    /* the walls: mountain ranges along the right-hand coast of Regular and of Context-free */
    [[474,196,446,330],[800,146,462,320]].forEach(([x,y0,y1,gap])=>{ const rg=svg("g",{class:"ridge"},s); let k=0;
      for(let yy=y0; yy<=y1; yy+=[17,14,19,15][k%4], k++){ if(Math.abs(yy-gap)<34) continue; const cx=x+[-3,2,-1,3,0][k%5], sz=[10,7,12,8,9][k%5];
        svg("path",{d:`M${cx-sz} ${yy+sz*.8}L${cx} ${yy-sz}L${cx+sz} ${yy+sz*.8}Z`,class:"peak"},rg);
        svg("path",{d:`M${cx} ${yy-sz}L${cx+sz} ${yy+sz*.8}L${cx+sz*.25} ${yy+sz*.8}Z`,class:"shade"},rg); } });
    /* compass rose in the open sea */
    const cr=svg("g",{class:"compass",transform:"translate(1052 152)"},s);
    svg("circle",{r:34,class:"c-ring"},cr); svg("circle",{r:27,class:"c-ring thin"},cr);
    [45,135,225,315].forEach(a=>svg("path",{d:"M0 -20L4 0L0 4L-4 0Z",transform:`rotate(${a})`,class:"c-short"},cr));
    [0,90,180,270].forEach(a=>{ const g=svg("g",{transform:`rotate(${a})`},cr); svg("path",{d:"M0 -31L6 0L0 0Z",class:"c-dark"},g); svg("path",{d:"M0 -31L-6 0L0 0Z",class:"c-light"},g); });
    svg("circle",{r:2.5,class:"c-dark"},cr); svg("text",{y:-40,"text-anchor":"middle",class:"c-n"},cr,"N");
    const pts=Atlas.order.map(id=>Atlas.stations[id]);
    svg("polyline",{points:pts.map(p=>p.x+","+p.y).join(" "),class:"route"},s);
    const RR=17, CIRC=2*Math.PI*RR;
    const open=p=>{ if(p.mount) Atlas.go(p.id); else Atlas.toast(p.short+" is being built next"); };
    pts.forEach(p=>{
      const built=!!p.mount; const [a,b]=Atlas.count(p.id); const done=built && b>0 && a===b;
      const g=svg("g",{class:"stop"+(built?"":" soon")+(done?" done":""),"data-zone":Atlas.zone(p),tabindex:"0",role:"button","aria-label":p.title+(built?"":" (coming next)")+(b?`, ${a} of ${b} stamps`:"")},s);
      svg("circle",{cx:p.x,cy:p.y,r:RR,class:"ring"},g);
      if(a) svg("circle",{cx:p.x,cy:p.y,r:RR,class:"prog","stroke-dasharray":`${CIRC*a/b} ${CIRC}`,transform:`rotate(-90 ${p.x} ${p.y})`},g);
      svg("circle",{cx:p.x,cy:p.y,r:10,class:"dot"},g);
      if(done) svg("text",{x:p.x,y:p.y+4,"text-anchor":"middle",class:"tick"},g,"✓");
      const R=p.lab==="r", lx=R?p.x+26:p.x, anc=R?"start":"middle", ly=R?p.y+4:p.y+34;
      svg("text",{x:lx,y:ly,"text-anchor":anc,class:"lbl"},g,p.short);
      svg("text",{x:lx,y:ly+13,"text-anchor":anc,class:"ses"},g,p.sessions+(built && b? ` · ${a}/${b}`:""));
      if(p.wall) svg("text",{x:lx,y:ly+27,"text-anchor":anc,class:"wall"},g,"THE WALL");
      g.addEventListener("click",()=>open(p)); g.addEventListener("keydown",e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); open(p); } });
    });
    mapP.appendChild(h("div","maplegend",`<span><i class="lg-ring"></i>Ring: your passport progress at that stop</span><span><i class="lg-wall"></i>Mountains: the wall between two classes</span><span><i class="lg-route"></i>The route: the order of the semester</span>`));

    /* phones: the same route, read top to bottom */
    const groups=[["reg",regs[3]],["cf",regs[2]],["cs",regs[1]],["re",regs[0]]];
    const vr=h("ol","vroute"); mapP.appendChild(vr);
    groups.forEach(([z,r])=>{ const li=h("li","vz"); li.dataset.zone=z; li.innerHTML=`<div class="vz-h"><b>${esc(r[6])}</b><small>${esc(r[7])} · landmark ${esc(r[8])}</small></div>`;
      const ol=h("ol","vstops"); li.appendChild(ol); vr.appendChild(li);
      pts.filter(p=>Atlas.zone(p)===z).forEach(p=>{ const [a,b]=Atlas.count(p.id); const it=h("li");
        const bt=h("button","vstop",`<span class="vmark" style="--pct:${b?100*a/b:0}%"></span><span class="vname">${esc(p.short)}</span><span class="vses">${esc(p.sessions)}${b?` · ${a}/${b}`:""}</span>`); bt.type="button"; bt.onclick=()=>open(p);
        it.appendChild(bt); ol.appendChild(it); if(p.wall) ol.appendChild(h("li","vwall","The wall")); });
      if(!ol.children.length) li.classList.add("empty"); });

    view.appendChild(h("h2","sec","Every stop"));
    view.appendChild(h("p","secsub","Each one has the idea in the course notation, a live lab, a challenge, and the ways an answer goes wrong. Finished challenges stamp your passport, which is saved on this device."));
    groups.forEach(([z,r])=>{ const mine=pts.filter(p=>Atlas.zone(p)===z); if(!mine.length) return;
      const grp=h("section","cardgroup"); grp.dataset.zone=z; grp.appendChild(h("h3","cg-h",`<span class="zone-chip">${esc(r[6])}</span><span>${esc(r[7])}</span>`));
      const cards=h("div","cards"); grp.appendChild(cards); view.appendChild(grp);
      mine.forEach(p=>{ const built=!!p.mount; const [a,b]=Atlas.count(p.id);
        const c=h(built?"button":"div","card"+(built?"":" soon")); if(built){ c.type="button"; c.onclick=()=>Atlas.go(p.id); }
        const dots=p.stamps.map(st=>`<i class="${Atlas.has(p.id,st.id)?"on":""}"></i>`).join("");
        c.innerHTML=`<span class="plate">${Atlas.roman(Atlas.order.indexOf(p.id)+1)}</span><span class="ses">${esc(p.sessions)} · ${esc(p.region)}</span><h3>${esc(p.title)}</h3><p>${esc(p.blurb)}</p>
          <div class="foot">${built?`<span class="go">Open stop →</span>`:`<span class="tag">Coming next</span>`}<span class="dots" title="${a} of ${b} stamps">${dots}</span></div>`;
        cards.appendChild(c); }); });
  }
};
