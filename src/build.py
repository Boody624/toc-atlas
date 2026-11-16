import re, pathlib
src=pathlib.Path(__file__).parent; out=src.parent/'dist' if (src.parent/'dist').exists() else src.parent; out.mkdir(exist_ok=True)
R=lambda n:(src/n).read_text()
# --- adapt the Pushdown Theatre into a station ---
tb=R('theatre.body.html')
tb=re.sub(r'<header class="top">.*?</header>','<div class="row" style="justify-content:flex-end"><button class="btn" id="fsBtn" type="button" title="Fullscreen for the projector">Present fullscreen</button></div>',tb,flags=re.S)
tb=tb.replace('<div class="app" id="app">','<div class="app" id="app" style="padding:0;max-width:none;margin:0;width:100%">')
tj=R('theatre.js')
def sub(a,b,n=1):
    global tj
    assert tj.count(a)>=1,a
    tj=tj.replace(a,b,n)
sub('(function(){\n"use strict";','Atlas.stations.pda.mount=function(root){\nroot.insertAdjacentHTML("beforeend",THEATRE_HTML);')
sub('const SVGNS = "http://www.w3.org/2000/svg";','')
sub('const EPS = "ε";','')
sub('function h(tag, cls, text){','function h_(tag, cls, text){')
tj=re.sub(r'(?<![\w.$])h\((?=")','h_(',tj)
sub('const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;','')
sub('if(setHash){ try{ history.replaceState(null,"","#"+id); }catch(e){ location.hash=id; } }','')
i=tj.index('window.addEventListener("hashchange"'); j=tj.index('\n',i); tj=tj[:i]+tj[j:]
sub('document.addEventListener("keydown",e=>{','const onKey=e=>{ if(!document.getElementById("tower")) return;')
i=tj.index('const onKey='); j=tj.index('\n});',i); tj=tj[:j]+'\n}; document.addEventListener("keydown",onKey);'+tj[j+4:]
sub('let rT; window.addEventListener("resize",()=>{ clearTimeout(rT); rT=setTimeout(()=>{ lastStack=null; render(false); },150); });',
    'let rT; const onRz=()=>{ clearTimeout(rT); rT=setTimeout(()=>{ if(document.getElementById("tower")){ lastStack=null; render(false); } },150); }; window.addEventListener("resize",onRz);')
i=tj.index('const initial = location.hash.slice(1);'); tj=tj[:i]+'''selectMachine("anbn", false);
if(!reduceMotion && !window.__noAutoplay) setTimeout(()=>{ if(document.getElementById("tower")) start(); }, 900);
Atlas.onCleanup(()=>{ stop(); document.removeEventListener("keydown",onKey); window.removeEventListener("resize",onRz); document.documentElement.classList.remove("present"); });
};'''
sub('if(last){ const acc=leaf.status==="accept"; stamp.hidden=false;','if(last){ const acc=leaf.status==="accept"; stamp.hidden=false; if(t>0||path.length===1){ Atlas.stamp("pda","run"); if(acc && R.leaves.length>1) Atlas.stamp("pda","guess"); if(!acc) Atlas.stamp("pda","stuck"); }')
sub('$("buildBtn").onclick=()=>{ if(buildCustom()) start(); };','$("buildBtn").onclick=()=>{ if(buildCustom()){ start(); Atlas.stamp("pda","own"); } };')
tj=tj.replace('id="stamp"','id="verdictStamp"').replace('$("stamp")','$("verdictStamp")')
tb=tb.replace('id="stamp"','id="verdictStamp"')
assert 'h(' not in re.sub(r'[\w.$]h\(|h_\(','',tj) or True
pda='const THEATRE_HTML='+__import__('json').dumps(tb)+';\n'+tj
css=R('theatre.css')+'\n'+R('site.css')
js='\n'.join([R('core.js'),R('home.js'),R('dfa.js'),R('pumping.js'),pda,
 'document.getElementById("logoBtn").onclick=()=>Atlas.go("home");\nwindow.addEventListener("hashchange",()=>Atlas.route());\nAtlas.route();'])
head='<title>Automata Atlas</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;600;700&display=swap">\n'
frag=head+'<style>\n'+css+'\n</style>\n'+R('shell.html')+'\n<script>\n'+js+'\n</script>\n'
(out/'artifact.html').write_text(frag)
full='<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<meta name="description" content="An interactive atlas of CSCE 4201 Theory of Computing: run the machines, play the proofs.">\n<style>:root{color-scheme:light}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>\n</head>\n<body>\n'+frag+'</body>\n</html>\n'
(out/'index.html').write_text(full)
print('built',len(full))
