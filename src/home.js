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
  {id:"closure", title:"Closure properties", short:"Closure", sessions:"S12", module:"Module 5 · Properties of regular languages", region:"Regular", x:440, y:420,
   blurb:"Seven operations that stay inside the class, and one product machine with three accepting sets."},
  {id:"pumping", title:"The pumping lemma", short:"Pumping lemma", sessions:"S13", module:"Module 5 · Properties of regular languages", region:"The edge of Regular", x:486, y:330, wall:true,
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
  {id:"cflpump", title:"Closure and pumping for CFLs", short:"CFL limits", sessions:"S22–S23", module:"Module 8 · Context-free limits", region:"The edge of Context-free", x:812, y:320, wall:true,
   blurb:"Three pieces became five. Break the Language: the pumping game one level up."},
  {id:"tm", title:"Turing machines", short:"Turing machines", sessions:"S25", module:"Module 9 · Turing machines", region:"Recursively enumerable", x:985, y:262,
   blurb:"A tape instead of a stack. Tape Walk, and design by mark, cross, return."},
  {id:"halt", title:"The halting problem", short:"Halting problem", sessions:"S25+", module:"Module 9 · Turing machines", region:"Beyond", x:1050, y:400,
   blurb:"Accept, reject, or neither: the question no machine can answer."}
].forEach(d=>{ d.stamps=d.stamps||[]; Atlas.register(d); });

const Home = {
  mount(view){
    const hero=h("section","hero");
    hero.innerHTML=`<div><div class="eyebrow">CSCE 4201 · Theory of Computing · Fall 2026</div>
      <h1>Automata Atlas</h1>
      <p class="lede">The whole course on one map. Every session is a stop where you can run the machine, break it, and play the in-class activity. What separates the regions is memory.</p></div>
      <ul class="facts">
        <li><b>Not all problems are solvable.</b>Some well-posed yes/no questions have no algorithm at all.</li>
        <li><b>Not all solvable problems are practical.</b></li>
        <li><b>Not all systems can be fully verified.</b>These are mathematical limits, not engineering weaknesses.</li>
      </ul>`;
    view.appendChild(hero);

    const mapP=h("section","panel"); mapP.innerHTML=`<div class="ph"><h2>The map of the semester</h2><span class="hint">The Chomsky hierarchy. Click a stop to open it. Dashed stops are still being built.</span></div>`;
    const mw=h("div","mapwrap"); mapP.appendChild(mw); view.appendChild(mapP);
    const s=svg("svg",{viewBox:"0 0 1120 520",role:"img","aria-label":"Map of the course across the Chomsky hierarchy"},mw);
    const regs=[
      ["r0",10,10,1100,500,"Type 0 · Recursively enumerable","Turing machine · unbounded tape","⟨M,w⟩ : M halts on w"],
      ["r1",24,62,932,434,"Type 1 · Context-sensitive","Linear-bounded automaton · bounded tape","aⁿbⁿcⁿ"],
      ["r2",38,114,762,368,"Type 2 · Context-free","Pushdown automaton · a stack","aⁿbⁿ"],
      ["r3",52,166,422,302,"Type 3 · Regular","Finite automaton · no memory beyond the state","even number of a's"]];
    regs.forEach(([c,x,y,w,hh,l,sub,land])=>{ svg("rect",{x,y,width:w,height:hh,class:"region "+c},s);
      svg("text",{x:x+18,y:y+24,class:"rlabel"},s,l); svg("text",{x:x+18,y:y+40,class:"rsub"},s,sub);
      svg("text",{x:x+w-16,y:y+24,"text-anchor":"end",class:"rland"},s,"landmark: "+land); });
    const pts=Atlas.order.map(id=>Atlas.stations[id]);
    svg("polyline",{points:pts.map(p=>p.x+","+p.y).join(" "),class:"route"},s);
    pts.forEach(p=>{
      const built=!!p.mount; const [a,b]=Atlas.count(p.id); const done=built && b>0 && a===b;
      const g=svg("g",{class:"stop"+(built?"":" soon")+(done?" done":""),tabindex:"0",role:"button","aria-label":p.title+(built?"":" (coming next)")},s);
      svg("circle",{cx:p.x,cy:p.y,r:13},g);
      if(done) svg("text",{x:p.x,y:p.y+4,"text-anchor":"middle",class:"tick"},g,"✓");
      svg("text",{x:p.x,y:p.y+30,"text-anchor":"middle"},g,p.short);
      svg("text",{x:p.x,y:p.y+43,"text-anchor":"middle",class:"ses"},g,p.sessions+(built && b? ` · ${a}/${b}`:""));
      if(p.wall) svg("text",{x:p.x,y:p.y+57,"text-anchor":"middle",class:"wall"},g,"THE WALL");
      const open=()=>{ if(built) Atlas.go(p.id); else Atlas.toast(p.short+" is being built next"); };
      g.addEventListener("click",open); g.addEventListener("keydown",e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); open(); } });
    });

    view.appendChild(h("h2","sec","Every stop"));
    view.appendChild(h("p","secsub","Each one has the idea in the course notation, a live lab, a challenge, and the ways an answer goes wrong. Finished challenges stamp your passport, which is saved on this device."));
    const cards=h("div","cards"); view.appendChild(cards);
    pts.forEach(p=>{ const built=!!p.mount; const [a,b]=Atlas.count(p.id);
      const c=h(built?"button":"div","card"+(built?"":" soon")); if(built){ c.type="button"; c.onclick=()=>Atlas.go(p.id); }
      const dots=p.stamps.map(st=>`<i class="${Atlas.has(p.id,st.id)?"on":""}"></i>`).join("");
      c.innerHTML=`<span class="ses">${esc(p.sessions)} · ${esc(p.region)}</span><h3>${esc(p.title)}</h3><p>${esc(p.blurb)}</p>
        <div class="foot"><span class="tag ${built?"live":""}">${built?"Open":"Coming next"}</span><span class="dots">${dots}</span></div>`;
      cards.appendChild(c); });
  }
};
