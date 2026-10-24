#!/usr/bin/env python3
"""Schrittli – Kontrolle: Entwürfe prüfen, Stopps auf Zehntelsekunden setzen, in schule.json übernehmen.

Aufruf:  python werkzeug/kontrolle.py [--port 8765]
Dann im Browser:  http://127.0.0.1:8765/

Ohne Browser übernehmen:  python werkzeug/kontrolle.py --uebernehmen <VIDEOID> [<VIDEOID> …]

Zeigt pro Entwurf (werkzeug/entwurf/<ID>/video.json) den YouTube-Player, die Schritte mit Einzelbildern
rund um jeden Stopp, das Transkript und die erkannten Bildwechsel. Speichern schreibt video.json;
«Übernehmen» trägt den Eintrag in schule/schule.json ein (ersetzt einen bestehenden mit gleicher id oder gleichem Video).
"""
import datetime, json, re, sys
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
WURZEL = Path(__file__).resolve().parent.parent
CACHE = WURZEL / 'werkzeug' / 'cache'
ENTWURF = WURZEL / 'werkzeug' / 'entwurf'
SCHULE = WURZEL / 'schule' / 'schule.json'


def themen():
    src = (WURZEL / 'quelle' / 'p2.js').read_text(encoding='utf-8')
    block = src[src.find('const THEMEN='):]
    block = block[:block.find('];')]
    return re.findall(r"\{id:'(\w+)',name:'([^']+)'", block)


def vokabular():
    out = []
    for zeile in (WURZEL / 'quelle' / 'agenten' / 'VOKABULAR.md').read_text(encoding='utf-8').splitlines():
        m = re.match(r'^\| ([a-z]+) \| ([^|]+) \|', zeile)
        if m and m.group(1) != 'id': out.append([m.group(1), m.group(2).strip()])
    return out


def lies(p, fallback=None):
    try: return json.loads(p.read_text(encoding='utf-8'))
    except Exception: return fallback


def schreibe_json(p, daten):
    text = json.dumps(daten, ensure_ascii=False, indent=1)
    p.write_text(text.replace('\n', '\r\n') + '\r\n', encoding='utf-8', newline='')


def schul_eintrag(vid):
    d = lies(SCHULE, {'videos': []})
    for e in d['videos']:
        if (e.get('source') or {}).get('id') == vid: return e
    return None


def liste():
    out = []
    if not ENTWURF.exists(): return out
    for d in sorted(ENTWURF.iterdir()):
        if not d.is_dir(): continue
        a = lies(CACHE / d.name / 'analyse.json', {})
        v = lies(d / 'video.json')
        s = schul_eintrag(d.name)
        out.append({'id': d.name, 'title': (v or {}).get('title') or a.get('title') or d.name, 'dauer': a.get('dauer'),
                    'entwurf': bool(v), 'schritte': len((v or {}).get('steps') or []), 'drin': bool(s), 'brief': (d / 'brief.md').exists()})
    return out


def daten(vid):
    a = lies(CACHE / vid / 'analyse.json')
    if not a: return None
    v = lies(ENTWURF / vid / 'video.json')
    blaetter = sorted(p.name for p in (ENTWURF / vid).glob('blatt-*.jpg'))
    return {'analyse': a, 'entwurf': v, 'schule': schul_eintrag(vid), 'themen': themen(), 'vokabular': vokabular(), 'blaetter': blaetter}


def uebernehmen(vid, eintrag=None):
    eintrag = eintrag or lies(ENTWURF / vid / 'video.json')
    if not eintrag: raise ValueError(f'Kein Entwurf für {vid}')
    d = lies(SCHULE)
    d['stand'] = datetime.date.today().isoformat()
    vids = d['videos']
    for i, e in enumerate(vids):
        if e.get('id') == eintrag.get('id') or (e.get('source') or {}).get('id') == vid:
            vids[i] = eintrag; break
    else:
        vids.append(eintrag)
    schreibe_json(SCHULE, d)
    return len(vids)


HTML_LISTE = '''<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Schrittli – Kontrolle</title>
<style>body{font:15px/1.4 system-ui,sans-serif;margin:24px;max-width:900px;color:#222}table{border-collapse:collapse;width:100%}td,th{padding:8px 10px;border-bottom:1px solid #ddd;text-align:left}a{color:#1b5fd1}
.ok{color:#1a8f3c}.muted{color:#888}code{background:#f3f3f3;padding:1px 5px;border-radius:4px}</style></head><body>
<h1>Schrittli – Kontrolle</h1><p class="muted">Entwürfe aus <code>werkzeug/entwurf/</code>. Neue Videos: <code>python werkzeug/holen.py &lt;Link&gt;</code>, dann Schritte schreiben lassen (siehe <code>werkzeug/SCHRITTE-LOKAL.md</code>).</p>
<table><tr><th>Video</th><th>Dauer</th><th>Entwurf</th><th>In schule.json</th></tr>__ZEILEN__</table></body></html>'''

HTML_SEITE = r'''<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Kontrolle __ID__</title>
<style>
:root{--b:#1b5fd1;--r:#d33;--g:#1a8f3c;--bg:#f6f7f9}
*{box-sizing:border-box}body{font:14px/1.35 system-ui,sans-serif;margin:0;color:#222;background:var(--bg)}
header{display:flex;gap:12px;align-items:center;padding:8px 14px;background:#fff;border-bottom:1px solid #ddd;position:sticky;top:0;z-index:5}
header h1{font-size:16px;margin:0;flex:1}button{font:inherit;padding:5px 10px;border:1px solid #bbb;border-radius:6px;background:#fff;cursor:pointer}
button.p{background:var(--b);color:#fff;border-color:var(--b)}button.sm{padding:2px 6px;font-size:12px}button:disabled{opacity:.4}
main{display:grid;grid-template-columns:minmax(380px,46%) 1fr;gap:14px;padding:14px}
.box{background:#fff;border:1px solid #ddd;border-radius:8px;padding:10px;margin-bottom:12px}
.box h2{font-size:13px;margin:0 0 8px;text-transform:uppercase;letter-spacing:.04em;color:#666}
#yt{width:100%;aspect-ratio:16/9;background:#000}
.row{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:6px}
#zeit{font:600 20px/1 ui-monospace,monospace;min-width:90px}
input,select,textarea{font:inherit;padding:4px 6px;border:1px solid #bbb;border-radius:5px}
.meta{display:grid;grid-template-columns:1fr 1fr;gap:6px 10px}.meta label{display:flex;flex-direction:column;font-size:12px;color:#555}.meta .w{grid-column:1/-1}
.steps{list-style:none;margin:0;padding:0}.step{display:flex;gap:4px;align-items:center;padding:5px 6px;border-radius:6px;border:1px solid transparent}
.step.sel{background:#e8f0ff;border-color:var(--b)}.step .n{width:22px;color:#888;text-align:right}.step .t{width:68px;font-family:ui-monospace,monospace;text-align:center}
.step .l{flex:1}.step .warn{color:var(--r);font-size:12px}
.strip{display:flex;gap:2px;overflow-x:auto;margin-top:6px}.strip img{width:120px;height:68px;object-fit:cover;border:2px solid transparent;cursor:pointer;flex:none}
.strip img.hit{border-color:var(--r)}.strip img.cut{outline:2px solid #f90}.strip .f{position:relative;flex:none}.strip .f span{position:absolute;left:2px;top:2px;background:rgba(0,0,0,.7);color:#ff0;font:600 11px ui-monospace,monospace;padding:1px 3px}
.tl{position:relative;height:38px;background:#eee;border-radius:4px;margin-top:8px;cursor:crosshair}
.tl .c{position:absolute;top:18px;width:2px;height:20px;background:#f90}.tl .c.w{top:28px;height:10px;background:#fc9}
.tl .s{position:absolute;top:2px;width:16px;height:16px;margin-left:-8px;border-radius:50%;background:var(--b);color:#fff;font-size:10px;text-align:center;line-height:16px;cursor:pointer}.tl .s.sel{background:var(--r)}
.tl .pos{position:absolute;top:0;width:2px;height:100%;background:#000}
.tx{max-height:300px;overflow:auto;font-size:13px}.tx div{display:flex;gap:6px;padding:2px 4px;border-radius:4px}.tx div:hover{background:#f0f0f0}.tx .tt{font-family:ui-monospace,monospace;color:#666;width:52px;flex:none;cursor:pointer}.tx .tt:hover{color:var(--b)}
.chips{display:flex;gap:4px;flex-wrap:wrap}.chip{background:#eef;border:1px solid #ccd;border-radius:12px;padding:1px 8px;font-size:12px}.chip b{cursor:pointer;margin-left:4px}
.hint{font-size:12px;color:#777}#msg{font-size:13px;color:var(--g)}kbd{background:#eee;border:1px solid #ccc;border-radius:3px;padding:0 4px;font-size:11px}
.blaetter img{max-width:100%;margin-top:6px}
@media (max-width:980px){main{grid-template-columns:1fr}}
</style></head><body>
<header><a href="/">← Liste</a><h1 id="h1">__ID__</h1><span id="msg"></span><button id="link">Schul-Link</button><button id="save" class="p">Speichern</button><button id="take">In schule.json übernehmen</button></header>
<main>
<div>
 <div class="box"><div id="yt"></div>
  <div class="row"><span id="zeit">0:00.0</span><button data-seek="-2">−2 s</button><button data-seek="-0.5">−0.5</button><button data-seek="0.5">+0.5</button><button data-seek="2">+2 s</button><button id="pp">Play / Pause</button><button id="test" class="p">Schritt testen</button><button id="here">Hier = Beginn</button></div>
  <div class="hint">Tasten: <kbd>Leertaste</kbd> Play/Pause · <kbd>←</kbd><kbd>→</kbd> ±0.5 s (<kbd>Shift</kbd> ±2 s) · <kbd>S</kbd> aktuelle Zeit als Beginn · <kbd>T</kbd> Schritt testen · <kbd>↑</kbd><kbd>↓</kbd> Schritt wählen</div>
  <div class="tl" id="tl"></div><div class="hint">Zeitleiste: Punkte = Schritte, orange Striche = Bildwechsel (lang = stark). Klick auf einen Strich setzt den Beginn des gewählten Schritts dorthin.</div>
 </div>
 <div class="box"><h2>Angaben</h2><div class="meta" id="meta"></div></div>
 <div class="box"><h2>Transkript <span id="txart" class="hint"></span></h2><div class="tx" id="tx"></div><div class="hint">Klick auf die Zeit: Beginn des gewählten Schritts = Zeit − 1.5 s. <b>+</b> legt dort einen neuen Schritt an.</div></div>
 <div class="box blaetter"><h2>Kontaktblätter</h2><div id="blaetter"></div></div>
</div>
<div>
 <div class="box"><h2>Schritte <span class="hint" id="nsteps"></span></h2><ol class="steps" id="steps"></ol><div class="row"><button id="add">+ Schritt bei aktueller Zeit</button><button id="sort">Nach Zeit sortieren</button></div></div>
 <div class="box"><h2>Beginn des gewählten Schritts <span id="selt" class="hint"></span></h2><div class="strip" id="strip1"></div><div class="hint">Klick auf ein Bild setzt den Beginn auf diese Zeit. Rot = aktueller Wert, orange Rahmen = Bildwechsel.</div></div>
 <div class="box"><h2>Stopp am Ende (= Beginn des nächsten Schritts) <span id="endt" class="hint"></span></h2><div class="strip" id="strip2"></div><div class="hint">Das Video hält 0.08 s vor dieser Zeit. Hier sollte das Kind das Ergebnis des Schritts sehen, nicht schon den nächsten.</div></div>
</div>
</main>
<script>
const ID='__ID__';let D=null,E=null,sel=0,yt=null,ready=false,testEnde=null;
const fmt=t=>{t=Math.max(0,+t||0);const m=Math.floor(t/60),s=t-m*60;return m+':'+(s<10?'0':'')+s.toFixed(1)};
const parseT=s=>{s=String(s).trim().replace(',','.');if(!s)return NaN;const p=s.split(':');if(p.length===1)return +p[0];return +p[0]*60+ +p[1]};
const r1=x=>Math.round(x*10)/10, $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const frame=t=>'/f/'+ID+'/'+(Math.round(t*D.analyse.fps)+1);
function msg(s,err){const m=$('#msg');m.textContent=s;m.style.color=err?'var(--r)':'var(--g)';clearTimeout(msg.t);msg.t=setTimeout(()=>m.textContent='',4000)}
async function lade(){D=await (await fetch('/api/'+ID)).json();const a=D.analyse;
 E=D.entwurf||D.schule||{id:'zw-video',areaId:'',stufen:[],title:a.title||'',source:{type:'youtube',id:ID},kanal:a.kanal||'',dauer:fmt(a.dauer).replace(/\.\d$/,''),alter:'ab 6',sprache:'Hochdeutsch',hinweis:'',material:[],steps:[{t:0,label:'Material richten: '}],task:{text:'',deliverable:'keine'}};
 E.steps=(E.steps||[]).map(s=>({t:+s.t,label:String(s.label||'')}));E.material=E.material||[];E.stufen=E.stufen||[];E.task=E.task||{text:'',deliverable:'keine'};
 $('#h1').textContent=(E.title||ID)+' · '+ID;if(!D.entwurf)msg(D.schule?'Kein Entwurf – zeige den Eintrag aus schule.json':'Kein Entwurf – leere Vorlage',true);
 renderMeta();renderSteps();renderTx();renderBlaetter();ladePlayer();}
function renderMeta(){const th=D.themen,vk=D.vokabular;const m=$('#meta');
 m.innerHTML=`<label>Titel<input data-k="title" value="${esc(E.title)}"></label><label>id<input data-k="id" value="${esc(E.id)}"></label>
 <label>Verfahren (areaId)<select data-k="areaId"><option value="">–</option>${th.map(([i,n])=>`<option value="${i}" ${i===E.areaId?'selected':''}>${esc(n)}</option>`).join('')}</select></label>
 <label>Klassen<span>${[1,2,3,4,5,6].map(s=>`<label style="display:inline;margin-right:8px"><input type="checkbox" data-st="${s}" ${E.stufen.includes(s)?'checked':''}> ${s}</label>`).join('')}</span></label>
 <label>Kanal<input data-k="kanal" value="${esc(E.kanal||'')}"></label><label>Dauer<input data-k="dauer" value="${esc(E.dauer||'')}"></label>
 <label>Alter<input data-k="alter" value="${esc(E.alter||'')}"></label><label>Sprache<select data-k="sprache">${['Hochdeutsch','Schweizerdeutsch','ohne Sprache','Englisch'].map(s=>`<option ${s===E.sprache?'selected':''}>${s}</option>`).join('')}</select></label>
 <label class="w">Hinweis für die Lehrperson<textarea data-k="hinweis" rows="2">${esc(E.hinweis||'')}</textarea></label>
 <label class="w">Material (Reihenfolge = Materialkarte)<div class="chips" id="chips"></div><select id="matadd"><option value="">+ Material hinzufügen …</option>${vk.map(([i,n])=>`<option value="${i}">${esc(n)} (${i})</option>`).join('')}</select></label>
 <label class="w">Aufgabe danach (leer = keine)<input data-k="task.text" value="${esc(E.task.text||'')}"></label>`;
 renderChips();
 m.oninput=e=>{const k=e.target.dataset.k;if(!k)return;if(k==='task.text'){E.task.text=e.target.value;E.task.deliverable=e.target.value.trim()?'fertig':'keine'}else E[k]=e.target.value;if(k==='title')$('#h1').textContent=E.title+' · '+ID};
 m.onchange=e=>{if(e.target.dataset.st){const s=+e.target.dataset.st;E.stufen=e.target.checked?[...new Set([...E.stufen,s])].sort():E.stufen.filter(x=>x!==s)}
  if(e.target.id==='matadd'&&e.target.value){if(!E.material.includes(e.target.value))E.material.push(e.target.value);e.target.value='';renderChips()}};}
function renderChips(){const names=Object.fromEntries(D.vokabular);$('#chips').innerHTML=E.material.map((id,i)=>`<span class="chip">${esc(names[id]||id)}${names[id]?'':' ⚠'}<b data-rm="${i}" title="entfernen">✕</b></span>`).join('')||'<span class="hint">noch kein Material</span>';
 $('#chips').onclick=e=>{if(e.target.dataset.rm!==undefined){E.material.splice(+e.target.dataset.rm,1);renderChips()}};}
function warnung(s,i){const w=[];const n=s.label.trim().split(/\s+/).filter(Boolean).length;if(n>8)w.push(n+' Wörter');if(/ß/.test(s.label))w.push('ß');if(/["«»„“]/.test(s.label))w.push('Anführungszeichen');if(i===0&&s.t!==0)w.push('erster Schritt nicht bei 0');if(i>0&&s.t<=E.steps[i-1].t)w.push('Zeit nicht aufsteigend');return w.join(', ')}
function renderSteps(){const ol=$('#steps');sel=Math.min(sel,E.steps.length-1);
 ol.innerHTML=E.steps.map((s,i)=>`<li class="step ${i===sel?'sel':''}" data-i="${i}"><span class="n">${i+1}</span><input class="t" value="${fmt(s.t)}" data-t="${i}"><button class="sm" data-d="-0.5" data-i="${i}" title="0.5 s früher">−</button><button class="sm" data-d="0.5" data-i="${i}" title="0.5 s später">+</button><input class="l" value="${esc(s.label)}" data-l="${i}"><button class="sm" data-play="${i}" title="ab hier abspielen und am Ende stoppen">▶</button><button class="sm" data-ins="${i}" title="Schritt danach einfügen">＋</button><button class="sm" data-rm="${i}" title="löschen">✕</button><span class="warn">${warnung(s,i)}</span></li>`).join('');
 $('#nsteps').textContent=E.steps.length+' Schritte';renderStrips();renderTl();}
function renderStrips(){const s=E.steps[sel];if(!s){$('#strip1').innerHTML='';$('#strip2').innerHTML='';return}
 const nx=E.steps[sel+1];$('#selt').textContent=fmt(s.t)+' – '+s.label;$('#endt').textContent=nx?fmt(nx.t)+' – danach: '+nx.label:'(letzter Schritt – läuft bis zum Ende)';
 strip($('#strip1'),s.t,sel);if(nx)strip($('#strip2'),nx.t,sel+1);else $('#strip2').innerHTML='';}
function strip(el,t,idx){const cuts=D.analyse.bildwechsel.map(c=>c[0]);let h='';for(let d=-2.5;d<=2.5;d+=0.5){const tt=r1(t+d);if(tt<0||tt>D.analyse.dauer)continue;const cut=cuts.some(c=>Math.abs(c-tt)<=0.26);
 h+=`<div class="f"><img src="${frame(tt)}" class="${Math.abs(d)<0.01?'hit':''} ${cut?'cut':''}" data-set="${idx}" data-tt="${tt}" loading="lazy"><span>${fmt(tt)}</span></div>`}el.innerHTML=h;}
function renderTl(){const tl=$('#tl'),dur=D.analyse.dauer;let h='';for(const [t,sc] of D.analyse.bildwechsel)h+=`<div class="c ${sc<0.28?'w':''}" style="left:${t/dur*100}%" data-cut="${t}" title="${fmt(t)}"></div>`;
 E.steps.forEach((s,i)=>h+=`<div class="s ${i===sel?'sel':''}" style="left:${s.t/dur*100}%" data-sel="${i}" title="${esc(s.label)}">${i+1}</div>`);h+='<div class="pos" id="pos"></div>';tl.innerHTML=h;}
function renderTx(){const a=D.analyse;$('#txart').textContent='('+a.transkript_art+')';$('#tx').innerHTML=a.transkript.length?a.transkript.map(([s,e,x])=>`<div><span class="tt" data-tx="${s}">${fmt(s)}</span><button class="sm" data-new="${s}" title="neuer Schritt hier">+</button><span>${esc(x)}</span></div>`).join(''):'<span class="hint">kein Transkript</span>';
 if(a.kapitel&&a.kapitel.length)$('#tx').innerHTML+='<div class="hint" style="margin-top:8px">YouTube-Kapitel:</div>'+a.kapitel.map(k=>`<div><span class="tt" data-tx="${k.start_time}">${fmt(k.start_time)}</span><span>${esc(k.title)}</span></div>`).join('');}
function renderBlaetter(){$('#blaetter').innerHTML=D.blaetter.map(b=>`<details><summary>${b}</summary><img src="/blatt/${ID}/${b}" loading="lazy"></details>`).join('')}
function setT(i,t){t=r1(Math.max(0,Math.min(D.analyse.dauer,t)));E.steps[i].t=t;renderSteps();}
function seek(t,play){if(!ready)return;yt.seekTo(Math.max(0,t),true);if(play)yt.playVideo();}
function testSchritt(i){if(!ready)return;const s=E.steps[i];if(!s)return;const nx=E.steps[i+1];testEnde=nx?nx.t-0.08:null;seek(s.t,true);msg('Test Schritt '+(i+1)+(nx?' – stoppt bei '+fmt(nx.t):''));}
function tick(){if(!ready)return;const t=yt.getCurrentTime()||0;$('#zeit').textContent=fmt(t);const p=$('#pos');if(p)p.style.left=t/D.analyse.dauer*100+'%';
 if(testEnde!=null&&yt.getPlayerState()===1&&t>=testEnde){yt.pauseVideo();testEnde=null;msg('Stopp bei '+fmt(t)+' – so sieht es das Kind');}}
function ladePlayer(){const tag=document.createElement('script');tag.src='https://www.youtube.com/iframe_api';document.head.appendChild(tag);
 window.onYouTubeIframeAPIReady=()=>{yt=new YT.Player('yt',{videoId:ID,playerVars:{controls:1,rel:0,modestbranding:1,playsinline:1},events:{onReady:()=>{ready=true;setInterval(tick,80)},onError:()=>msg('YouTube-Fehler – Video nicht einbettbar?',true)}})};}
document.addEventListener('click',e=>{const b=e.target.closest('[data-seek],[data-d],[data-play],[data-ins],[data-rm],[data-set],[data-cut],[data-sel],[data-tx],[data-new],.step');if(!b)return;const ds=b.dataset;
 if(ds.seek){seek((yt.getCurrentTime()||0)+ +ds.seek);return}
 if(ds.d){setT(+ds.i,E.steps[+ds.i].t+ +ds.d);return}
 if(ds.play){sel=+ds.play;renderSteps();testSchritt(sel);return}
 if(ds.ins!==undefined){const i=+ds.ins,a=E.steps[i].t,b2=E.steps[i+1]?E.steps[i+1].t:Math.min(D.analyse.dauer,a+10);E.steps.splice(i+1,0,{t:r1((a+b2)/2),label:''});sel=i+1;renderSteps();return}
 if(ds.rm!==undefined){if(E.steps.length>1){E.steps.splice(+ds.rm,1);sel=Math.max(0,Math.min(sel,E.steps.length-1));renderSteps()}return}
 if(ds.set!==undefined){setT(+ds.set,+ds.tt);seek(+ds.tt);return}
 if(ds.cut){setT(sel,+ds.cut);seek(+ds.cut);return}
 if(ds.sel!==undefined){sel=+ds.sel;renderSteps();seek(E.steps[sel].t);return}
 if(ds.tx){setT(sel,Math.max(0,+ds.tx-1.5));seek(E.steps[sel].t);return}
 if(ds.new){E.steps.push({t:r1(Math.max(0,+ds.new-1.5)),label:''});E.steps.sort((a,b)=>a.t-b.t);sel=E.steps.findIndex(s=>s.t===r1(Math.max(0,+ds.new-1.5)));renderSteps();return}
 if(b.classList.contains('step')&&!e.target.matches('input')){sel=+ds.i;renderSteps();}
});
$('#steps').addEventListener('change',e=>{const t=e.target;if(t.dataset.t!==undefined){const v=parseT(t.value);if(isNaN(v)){t.value=fmt(E.steps[+t.dataset.t].t);return}setT(+t.dataset.t,v)}if(t.dataset.l!==undefined){E.steps[+t.dataset.l].label=t.value;renderSteps()}});
$('#steps').addEventListener('focusin',e=>{const li=e.target.closest('.step');if(li&&+li.dataset.i!==sel){sel=+li.dataset.i;document.querySelectorAll('.step').forEach(x=>x.classList.toggle('sel',+x.dataset.i===sel));renderStrips();renderTl();}});
$('#pp').onclick=()=>{if(!ready)return;yt.getPlayerState()===1?yt.pauseVideo():yt.playVideo()};
$('#test').onclick=()=>testSchritt(sel);$('#here').onclick=()=>{if(ready)setT(sel,yt.getCurrentTime())};
$('#add').onclick=()=>{const t=ready?r1(yt.getCurrentTime()):0;E.steps.push({t,label:''});E.steps.sort((a,b)=>a.t-b.t);sel=E.steps.findIndex(s=>s.t===t);renderSteps()};
$('#sort').onclick=()=>{E.steps.sort((a,b)=>a.t-b.t);renderSteps()};
async function post(pfad){E.steps.sort((a,b)=>a.t-b.t);E.steps=E.steps.map(s=>({t:r1(s.t),label:s.label.trim()}));const r=await fetch(pfad,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(E)});const j=await r.json();if(!r.ok)msg(j.fehler||'Fehler',true);return r.ok?j:null}
$('#save').onclick=async()=>{if(await post('/api/'+ID+'/speichern'))msg('Gespeichert: werkzeug/entwurf/'+ID+'/video.json')};
$('#take').onclick=async()=>{if(!E.areaId||!E.stufen.length){msg('Verfahren und Klassen fehlen',true);return}if(!confirm('Eintrag «'+E.title+'» ('+E.id+') in schule/schule.json übernehmen?'))return;const j=await post('/api/'+ID+'/uebernehmen');if(j)msg('Übernommen – schule.json hat jetzt '+j.anzahl+' Videos. Danach: git commit & push.')};
$('#link').onclick=()=>{const p={t:E.title,s:E.steps.map(s=>[r1(s.t),s.label]),a:E.task.text||'',y:ID};if(E.material.length)p.m=E.material;const b=btoa(unescape(encodeURIComponent(JSON.stringify(p)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');const u='https://conradinjoos-lab.github.io/schrittli/schule/#s='+b;window.open(u,'_blank');navigator.clipboard&&navigator.clipboard.writeText(u);msg('Schul-Link geöffnet und kopiert')};
document.addEventListener('keydown',e=>{if(e.target.matches('input,textarea,select'))return;if(e.code==='Space'){e.preventDefault();$('#pp').click()}
 else if(e.key==='ArrowLeft'){seek((yt.getCurrentTime()||0)-(e.shiftKey?2:0.5))}else if(e.key==='ArrowRight'){seek((yt.getCurrentTime()||0)+(e.shiftKey?2:0.5))}
 else if(e.key==='s'||e.key==='S'){$('#here').click()}else if(e.key==='t'||e.key==='T'){testSchritt(sel)}
 else if(e.key==='ArrowDown'){e.preventDefault();sel=Math.min(E.steps.length-1,sel+1);renderSteps()}else if(e.key==='ArrowUp'){e.preventDefault();sel=Math.max(0,sel-1);renderSteps()}});
lade();
</script></body></html>'''


class H(BaseHTTPRequestHandler):
    def log_message(self, f, *a): pass

    def send(self, code, body, typ='text/html; charset=utf-8'):
        if isinstance(body, str): body = body.encode('utf-8')
        self.send_response(code); self.send_header('Content-Type', typ); self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store'); self.end_headers(); self.wfile.write(body)

    def js(self, code, obj): self.send(code, json.dumps(obj, ensure_ascii=False), 'application/json; charset=utf-8')

    def do_GET(self):
        p = urlparse(self.path).path
        if p == '/':
            zeilen = ''.join(f'<tr><td><a href="/v/{e["id"]}">{e["title"]}</a><br><span class="muted"><code>{e["id"]}</code></span></td><td>{e["dauer"] or ""} s</td>'
                             f'<td>{("<span class=ok>"+str(e["schritte"])+" Schritte</span>") if e["entwurf"] else ("<span class=muted>nur Brief</span>" if e["brief"] else "–")}</td>'
                             f'<td>{"<span class=ok>✓</span>" if e["drin"] else ""}</td></tr>' for e in liste()) or '<tr><td colspan=4 class="muted">Noch keine Entwürfe.</td></tr>'
            return self.send(200, HTML_LISTE.replace('__ZEILEN__', zeilen))
        m = re.fullmatch(r'/v/([A-Za-z0-9_-]{11})', p)
        if m: return self.send(200, HTML_SEITE.replace('__ID__', m.group(1)))
        m = re.fullmatch(r'/api/([A-Za-z0-9_-]{11})', p)
        if m:
            d = daten(m.group(1))
            return self.js(200, d) if d else self.js(404, {'fehler': 'kein analyse.json – zuerst holen.py ausführen'})
        m = re.fullmatch(r'/f/([A-Za-z0-9_-]{11})/(\d+)', p)
        if m:
            n = int(m.group(2)); f = CACHE / m.group(1) / 'f'
            while n > 1 and not (f / f'{n:05d}.jpg').exists(): n -= 1
            datei = f / f'{n:05d}.jpg'
            return self.send(200, datei.read_bytes(), 'image/jpeg') if datei.exists() else self.send(404, 'kein Bild')
        m = re.fullmatch(r'/blatt/([A-Za-z0-9_-]{11})/(blatt-[a-z]+-\d+\.jpg)', p)
        if m:
            datei = ENTWURF / m.group(1) / m.group(2)
            return self.send(200, datei.read_bytes(), 'image/jpeg') if datei.exists() else self.send(404, 'kein Blatt')
        self.send(404, 'nicht gefunden')

    def do_POST(self):
        p = urlparse(self.path).path
        m = re.fullmatch(r'/api/([A-Za-z0-9_-]{11})/(speichern|uebernehmen)', p)
        if not m: return self.js(404, {'fehler': 'unbekannt'})
        vid, was = m.groups()
        try:
            e = json.loads(self.rfile.read(int(self.headers.get('Content-Length', 0))).decode('utf-8'))
            e['source'] = {'type': 'youtube', 'id': vid}
            e['steps'] = sorted(({'t': round(float(s['t']), 1), 'label': str(s['label']).strip()} for s in e.get('steps', [])), key=lambda s: s['t'])
            (ENTWURF / vid).mkdir(parents=True, exist_ok=True)
            schreibe_json(ENTWURF / vid / 'video.json', e)
            if was == 'uebernehmen':
                return self.js(200, {'ok': True, 'anzahl': uebernehmen(vid, e)})
            self.js(200, {'ok': True})
        except Exception as ex:
            self.js(400, {'fehler': str(ex)})


if __name__ == '__main__':
    if '--uebernehmen' in sys.argv:
        for vid in [a for a in sys.argv[sys.argv.index('--uebernehmen') + 1:] if not a.startswith('--')]:
            print(f'{vid}: übernommen, schule.json hat jetzt {uebernehmen(vid)} Videos')
        sys.exit()
    port = int(sys.argv[sys.argv.index('--port') + 1]) if '--port' in sys.argv else 8765
    print(f'Kontrolle läuft: http://127.0.0.1:{port}/  (Strg+C beendet)', flush=True)
    ThreadingHTTPServer(('127.0.0.1', port), H).serve_forever()
