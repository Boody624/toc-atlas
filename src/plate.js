/* Atlas plates: the stop page template, rubber stamps, the passport booklet and the notation key */
"use strict";
const Plate = (()=>{
  let uid=0;
  const hash=s=>{ let x=0; for(const c of s) x=(x*31+c.charCodeAt(0))|0; return Math.abs(x); };
  const DATE=t=>{ const d=new Date(t); return d.getDate()+" "+["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][d.getMonth()]+" "+d.getFullYear(); };

  /* the memory each class has, drawn small: states, a stack, a tape */
  const MOTIF={
    reg:`<svg viewBox="0 0 96 20" aria-hidden="true"><circle cx="9" cy="10" r="6"/><path d="M15 10H35"/><path d="M31 7l4 3-4 3"/><circle cx="43" cy="10" r="6"/><path d="M49 10H69"/><path d="M65 7l4 3-4 3"/><circle cx="80" cy="10" r="6"/><circle cx="80" cy="10" r="8.5"/></svg>`,
    cf:`<svg viewBox="0 0 96 20" aria-hidden="true"><rect x="30" y="2" width="36" height="4.5" rx="1.5"/><rect x="30" y="8" width="36" height="4.5" rx="1.5"/><rect x="30" y="14" width="36" height="4.5" rx="1.5"/><path d="M8 10H24M72 10H88"/></svg>`,
    re:`<svg viewBox="0 0 96 20" aria-hidden="true"><path d="M2 5H94M2 15H94M14 5V15M28 5V15M42 5V15M56 5V15M70 5V15M84 5V15"/><path d="M45 1l4 3 4-3" class="head"/></svg>`};
  const motif=z=>`<span class="motif">${MOTIF[z]||MOTIF.re}</span>`;

  /* a rubber stamp: stop name round the top, what you did round the bottom, the plate numeral in the middle */
  function stampSVG(def, s, val){
    const id="stp"+(++uid), on=!!val, rot=(hash(def.id+s.id)%15)-7, top=def.short.toUpperCase(), bot=s.label.toUpperCase();
    const fb=Math.min(8.6, 168/Math.max(bot.length,1)), ft=Math.min(9, 150/Math.max(top.length,1));
    const date = on && val>1 ? `<text y="15" class="sd" text-anchor="middle">${DATE(val)}</text>` : "";
    return `<svg viewBox="-50 -50 100 100" class="stamp-svg" style="--rot:${rot}deg" role="img" aria-label="${esc(s.label)}${on?"":" (not yet)"}">
      <defs><path id="${id}t" d="M-34 0A34 34 0 0 1 34 0"/><path id="${id}b" d="M-39 0A39 39 0 0 0 39 0"/></defs>
      <circle r="46" class="o1"/><circle r="29" class="o2"/>
      <text class="st" style="font-size:${ft}px"><textPath href="#${id}t" startOffset="50%" text-anchor="middle">${esc(top)}</textPath></text>
      <text class="sb" style="font-size:${fb}px"><textPath href="#${id}b" startOffset="50%" text-anchor="middle">${esc(bot)}</textPath></text>
      <text y="${date?3:7}" class="sn" text-anchor="middle">${Atlas.roman(Atlas.order.indexOf(def.id)+1)}</text>${date}</svg>`; }
  function stampEl(def, s){ const val=(Atlas.passport()[def.id]||{})[s.id]; const e=h("span","stp"+(val?" on":""),stampSVG(def,s,val));
    e.dataset.st=def.id; e.dataset.id=s.id; e.dataset.zone=Atlas.zone(def); e.title=s.label; return e; }
  function restamp(e, st, id){ const def=Atlas.stations[st], s=def.stamps.find(x=>x.id===id); if(s) e.innerHTML=stampSVG(def,s,(Atlas.passport()[st]||{})[id]);
    const [x,y]=Atlas.count(st); document.querySelectorAll(".m-lbl .linkish").forEach(b=>b.textContent=`${x} of ${y} stamped →`); }

  /* "you are here": the whole chart, small */
  function locator(def){
    const s=svg("svg",{viewBox:"0 0 1120 520",class:"locator",role:"img","aria-label":"Where "+def.short+" sits on the map"});
    MAP_REGS.forEach(([c,z,x,y,w,hh],ri)=>svg("path",{d:coastPath(x,y,w,hh,26,0,5,ri*1.9),class:"region "+c},s));
    const pts=Atlas.order.map(i=>Atlas.stations[i]);
    svg("polyline",{points:pts.map(p=>p.x+","+p.y).join(" "),class:"route"},s);
    pts.forEach(p=>svg("circle",{cx:p.x,cy:p.y,r:p.id===def.id?0:14,class:"ldot","data-zone":Atlas.zone(p)},s));
    svg("circle",{cx:def.x,cy:def.y,r:46,class:"here-ring"},s); svg("circle",{cx:def.x,cy:def.y,r:26,class:"here"},s);
    return s; }

  function mount(def, view){
    const z=Atlas.zone(def), n=Atlas.order.indexOf(def.id)+1;
    view.dataset.wall=def.wall?"1":""; view.dataset.edge=def.id==="halt"?"1":""; view.dataset.wide=def.id==="pda"?"1":"";
    const wrap=h("div","plate-wrap"); view.appendChild(wrap);
    const side=h("aside","margin"); const main=h("div","plate-main"); wrap.appendChild(side); wrap.appendChild(main);

    const head=h("header","plate-head");
    head.innerHTML=`<div class="crumb"><button type="button">← The map</button><span>${esc(def.region)} · ${esc(def.sessions)}</span></div>
      <div class="plate-title">${motif(z)}<span class="plate-no">Plate ${Atlas.roman(n)}</span></div>
      <div class="eyebrow">${esc(def.module)}</div><h1>${esc(def.title)}</h1><p class="sub">${esc(def.blurb)}</p>`;
    head.querySelector(".crumb button").onclick=()=>Atlas.go("home");
    main.appendChild(head);
    const body=h("div","view st-body"); main.appendChild(body);
    def.mount(body);

    /* number the challenges when a stop has several */
    const blks=[...body.querySelectorAll(".blk")].filter(b=>!b.parentElement.closest(".blk"));
    const ch=blks.filter(b=>b.querySelector(".kicker").textContent==="Challenge");
    if(ch.length>1) ch.forEach((b,i)=>b.querySelector(".kicker").textContent=`Challenge ${i+1} of ${ch.length}`);

    const built=Atlas.order.filter(i=>Atlas.stations[i].mount), k=built.indexOf(def.id);
    const np=h("nav","nextprev"); np.setAttribute("aria-label","Neighbouring plates");
    const mk=(i,dir)=>{ const d=Atlas.stations[i]; const b=h("button","np "+dir,`<small>${dir==="prev"?"← Previous plate":"Next plate →"}</small><b>${esc(d.title)}</b><span>Plate ${Atlas.roman(Atlas.order.indexOf(i)+1)} · ${esc(d.sessions)}</span>`); b.type="button"; b.dataset.zone=Atlas.zone(d); b.onclick=()=>Atlas.go(i); return b; };
    const home=()=>{ const b=h("button","np home","<small>The end of the route</small><b>Back to the map</b><span>Every plate, one chart</span>"); b.type="button"; b.onclick=()=>Atlas.go("home"); return b; };
    np.appendChild(k>0?mk(built[k-1],"prev"):home()); np.appendChild(k<built.length-1?mk(built[k+1],"next"):home());
    main.appendChild(np);

    /* the margin: where you are, what is on this plate, what you have stamped */
    const loc=h("button","locwrap"); loc.type="button"; loc.title="Back to the map"; loc.appendChild(locator(def)); loc.onclick=()=>Atlas.go("home"); side.appendChild(loc);
    side.appendChild(h("div","m-meta",`<span class="zone-chip">${esc(Atlas.zoneName[z])}</span><span class="m-ses">${esc(def.sessions)}</span>`));
    const toc=h("details","toc"); toc.open=matchMedia("(min-width:1001px)").matches;
    toc.innerHTML=`<summary>On this plate <span>${blks.length} sections</span></summary>`; const ol=h("ol"); toc.appendChild(ol); side.appendChild(toc);
    const links=blks.map((b,i)=>{ const li=h("li"); const a=h("button",null,`<span class="tk">§ ${i+1}</span><span class="tt">${esc(b.querySelector(".kicker").textContent)}</span><span class="th">${esc(b.querySelector("h2").textContent)}</span>`); a.type="button"; a.dataset.kind=(b.className.match(/k-(\w+)/)||[])[1]||"";
      a.onclick=()=>{ b.scrollIntoView({behavior:reduceMotion?"auto":"smooth",block:"start"}); if(!matchMedia("(min-width:1001px)").matches) toc.open=false; }; li.appendChild(a); ol.appendChild(li); return a; });
    if("IntersectionObserver" in window){ const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ const i=blks.indexOf(e.target); links.forEach((l,x)=>l.classList.toggle("on",x===i)); } }),{rootMargin:"-25% 0px -65% 0px"});
      blks.forEach(b=>io.observe(b)); Atlas.onCleanup(()=>io.disconnect());
      /* sections settle onto the page the first time they scroll into view */
      if(!reduceMotion){ const vh=innerHeight; blks.forEach(b=>{ if(b.getBoundingClientRect().top>vh*.9) b.classList.add("rv"); });
        const ro=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add("in"); ro.unobserve(e.target); } }),{rootMargin:"0px 0px -8% 0px"});
        blks.filter(b=>b.classList.contains("rv")).forEach(b=>ro.observe(b)); Atlas.onCleanup(()=>ro.disconnect()); } }
    /* the voyage bar: how far down this plate you have read */
    const vg=h("div","voyage",`<i></i><b aria-hidden="true"></b>`); vg.dataset.zone=z; vg.setAttribute("aria-hidden","true"); document.body.appendChild(vg);
    let raf=0; const upd=()=>{ raf=0; const m=document.documentElement.scrollHeight-innerHeight; vg.style.setProperty("--p", m>0?Math.min(1,scrollY/m):0); };
    const onS=()=>{ if(!raf) raf=requestAnimationFrame(upd); }; addEventListener("scroll",onS,{passive:true}); addEventListener("resize",onS); upd();
    Atlas.onCleanup(()=>{ removeEventListener("scroll",onS); removeEventListener("resize",onS); vg.remove(); });
    if(def.stamps.length){ const ps=h("div","m-stamps"); const [a,b]=Atlas.count(def.id);
      ps.appendChild(h("div","m-lbl",`Passport <button type="button" class="linkish">${a} of ${b} stamped →</button>`)); ps.querySelector("button").onclick=()=>Atlas.go("passport");
      const row=h("div","stamps"); def.stamps.forEach(s=>row.appendChild(stampEl(def,s))); ps.appendChild(row); side.appendChild(ps); }
  }

  /* ---------- the passport booklet ---------- */
  function passport(view){
    const [a,b]=Atlas.totals();
    const cover=h("header","pp-cover",`<div class="pp-crest">${MOTIF.reg}${MOTIF.cf}${MOTIF.re}</div>
      <div class="eyebrow">CSCE 4201 · Theory of Computing · Fall 2026</div><h1>Passport</h1>
      <p class="sub">One stamp for every challenge finished at a stop. Your stamps are saved in this browser, on this device only.</p>
      <div class="pp-total"><b>${a}</b> of ${b} stamps<span class="meter"><i style="width:${b?100*a/b:0}%"></i></span></div>`);
    view.appendChild(cover);
    const book=h("div","pp-book"); view.appendChild(book);
    [["reg","Type 3 · Regular"],["cf","Type 2 · Context-free"],["re","Type 0 · Recursively enumerable"]].forEach(([z,name])=>{
      const pg=h("section","pp-page"); pg.dataset.zone=z; const stops=Atlas.order.map(i=>Atlas.stations[i]).filter(d=>Atlas.zone(d)===z);
      const got=stops.reduce((t,d)=>t+Atlas.count(d.id)[0],0), all=stops.reduce((t,d)=>t+Atlas.count(d.id)[1],0);
      pg.innerHTML=`<header class="pp-ph">${motif(z)}<h2>${esc(name)}</h2><span>${got} of ${all}</span></header>`;
      stops.forEach(d=>{ const r=h("div","pp-stop"); const [x,y]=Atlas.count(d.id);
        const t=h("button","pp-title",`<span class="plate-no">Plate ${Atlas.roman(Atlas.order.indexOf(d.id)+1)}</span><b>${esc(d.title)}</b><span class="m-ses">${esc(d.sessions)} · ${x}/${y}</span>`); t.type="button"; t.onclick=()=>Atlas.go(d.id); r.appendChild(t);
        const row=h("div","stamps"); d.stamps.forEach(s=>row.appendChild(stampEl(d,s))); r.appendChild(row); pg.appendChild(r); });
      book.appendChild(pg); });
    view.appendChild(h("p","pp-foot","Unstamped spaces are drawn in outline: they are the challenges still open. Stamps earned from now on also record the date."));
  }

  /* ---------- the notation key: every symbol the plates use, and where it lives ---------- */
  const KEY=[
    ["Finite automata",[
      ["M = ( Q , Σ , δ , q₀ , F )","A DFA: states, alphabet, transition function, start state, accepting states.","dfa"],
      ["δ : Q × Σ → Q","Deterministic: exactly one arrow per state and symbol.","dfa"],
      ["δ : Q × Σ → P(Q)","Nondeterministic: a set of states, possibly empty.","nfa"],
      ["ε-CL(q)","Every state reachable from q by zero or more ε-arrows.","nfa"],
      ["M = ( Q, Σ, Δ, δ, λ, q₀ )","Moore and Mealy machines: Δ is the output alphabet, λ the output function. No F.","mm"],
      ["λ′(q, a) = λ( δ(q, a) )","Moore to Mealy: move each state's output onto the arrows entering it.","mm"],
      ["δ([p, q], x) = [ δ₁(p, x), δ₂(q, x) ]","The product construction: feed the symbol to both components.","closure"]]],
    ["Regular expressions and pumping",[
      ["r + s · rs · r*","Union, concatenation, star. Precedence, highest first: star, concatenation, union.","regex"],
      ["r*r ≠ r*","They differ on exactly one string, ε.","regex"],
      ["|xy| ≤ p","The pumping lemma: w = xyz with |y| ≥ 1, and y inside the first p symbols.","pumping"],
      ["xyⁱz ∉ L","You win when one i pumps w out of the language.","pumping"]]],
    ["Grammars and pushdown automata",[
      ["G = ( V, T, P, S )","A grammar: variables, terminals, productions, start symbol.","cfg"],
      ["A → BC or A → a","Chomsky normal form.","cnf"],
      ["S₀ → ε","Allowed in Sipser's version, with S₀ on no right-hand side.","cnf"],
      ["M = (Q, Σ, Γ, δ, q₀, Z₀, F)","A pushdown automaton. IDs (q, w, α) put the top of the stack on the left; ⊢ is one move.","pda"],
      ["V(i, j)","The set of variables that derive the substring of length j starting at position i.","cyk"],
      ["|vxy| ≤ n","Pumping for CFLs: w = uvxyz, |vy| ≥ 1, pump v and y the same m times.","cflpump"]]],
    ["Turing machines and the limit",[
      ["M = (Q, Σ, Γ, δ, q₀, B, F)","A Turing machine: B is the blank.","tm"],
      ["δ : Q × Γ → Q × Γ × {L, R}","One move reads, writes, moves and changes state. There is no stay direction.","tm"],
      ["αqβ","A configuration: tape to the left, the state, then the tape from the head rightwards.","tm"],
      ["HALT = { ⟨M, w⟩ : M halts on w }","Recognisable, not decidable.","halt"],
      ["decidable ⊆ recursively enumerable","And the containment is proper.","halt"]]]];
  function notation(view){
    view.appendChild(h("header","pp-cover nk-cover",`<div class="eyebrow">CSCE 4201 · Theory of Computing · Fall 2026</div><h1>Notation key</h1>
      <p class="sub">Every symbol the plates use, in the course's notation, with the plate where it does its work.</p>`));
    const book=h("div","nk-book"); view.appendChild(book);
    KEY.forEach(([sec,rows])=>{ const s=h("section","nk-sec"); s.appendChild(h("h2",null,esc(sec))); const dl=h("dl"); s.appendChild(dl);
      rows.forEach(([sym,txt,st])=>{ const d=Atlas.stations[st]; const dt=h("dt","mono",esc(sym)); const dd=h("dd",null,`${esc(txt)} `); const b=h("button","linkish",`Plate ${Atlas.roman(Atlas.order.indexOf(st)+1)}, ${esc(d.short)} →`); b.type="button"; b.onclick=()=>Atlas.go(st); dd.appendChild(b); dt.dataset.zone=Atlas.zone(d); dl.append(dt,dd); });
      book.appendChild(s); });
  }
  return {mount, passport, notation, restamp, motif, stampSVG, KEY};
})();
