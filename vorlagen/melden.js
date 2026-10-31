// Flagge «Fehler melden» ausserhalb der App: Vorlagen, Werkzeuge, Kontrolle. Eigenständig und ohne Framework.
// zurueck.js lädt die Datei nach, die Kontrolle bindet sie direkt ein. Ziel ist derselbe Worker wie in der App (werkzeug/anmelden, /melden).
// Offline bleibt die Meldung in localStorage «schrittli.melden.warte» und geht beim nächsten Laden raus (die App liest dieselbe Warteschlange).
(function(){
  if(window.__melden||window.top!==window) return; window.__melden=true;
  const ZIEL='https://schrittli-anmelden.conradinjoos.workers.dev/melden', WARTE='schrittli.melden.warte';
  const STAND='2026-10-31-272e699';   // schreibt quelle/bauen.sh
  const skript=document.currentScript, wurzel=(skript&&skript.src||'').replace(/vorlagen\/melden\.js.*$/,'')||location.origin+'/', pfad=location.pathname;
  const kontrolle=/\/kontrolle\//.test(pfad)||!!document.querySelector('script[src$="werkstatt.js"]'), uebersicht=/\/vorlagen\/(index\.html)?$/.test(pfad);
  const ARTEN=kontrolle?[['anzeige','Anzeige falsch'],['speichern','Speichern geht nicht'],['anderes','Etwas anderes']]
    :uebersicht?[['anzeige','Anzeige falsch'],['bild','Bild fehlt'],['anderes','Etwas anderes']]
    :[['mass','Mass falsch'],['druck','Druck falsch'],['bild','Bild fehlt'],['anderes','Etwas anderes']];
  const FLAGGE='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h2v18H5zM8 4h11l-2.5 4.5L19 13H8z"/></svg>';
  const WERK='a[href],button,input,select,textarea,summary,label,[role=button],[role=tab],[contenteditable=true],[data-act],[onclick]';
  let host=null, flagge=null, bg=null, inhalt=null, laeuft=false;

  /* ---- Warteschlange ---- */
  const lies=()=>{ try{ const l=JSON.parse(localStorage.getItem(WARTE)||'[]'); return Array.isArray(l)?l:[]; }catch(e){ return []; } };
  const merke=l=>{ try{ if(l.length) localStorage.setItem(WARTE,JSON.stringify(l.slice(-20))); else localStorage.removeItem(WARTE); }catch(e){} };
  async function schick(m){ if(navigator.onLine===false) return 'offline'; const c=new AbortController(), t=setTimeout(()=>c.abort(),8000);
    try{ const r=await fetch(ZIEL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(m),signal:c.signal}); return r.ok?'ok':r.status===429?'viele':r.status>=500?'offline':'nein'; }
    catch(e){ return 'offline'; } finally{ clearTimeout(t); } }
  async function nachsenden(){ if(laeuft) return; laeuft=true;   // bleibt im Speicher, bis der Worker sie angenommen hat
    try{ for(const m of lies()){ const e=await schick(m); if(e==='viele'||e==='offline') break; merke(lies().filter(x=>x.erfasst!==m.erfasst)); } } finally{ laeuft=false; } }

  /* ---- Angaben zur Stelle ---- */
  function geraet(){ const u=navigator.userAgent; const os=/iPad/.test(u)||(/Macintosh/.test(u)&&navigator.maxTouchPoints>1)?'iPad':/iPhone/.test(u)?'iPhone':/Android/.test(u)?'Android':/CrOS/.test(u)?'Chromebook':/Windows/.test(u)?'Windows':/Mac/.test(u)?'Mac':'anderes';
    const br=/Edg\//.test(u)?'Edge':/Firefox\//.test(u)?'Firefox':/Chrome\//.test(u)?'Chrome':/Safari\//.test(u)?'Safari':''; return (os+' '+br).trim(); }
  function adresse(){ const u=new URL(location.href); for(const k of [...u.searchParams.keys()]) if(/token|schein|schluessel|code|key|name/i.test(k)) u.searchParams.delete(k);
    return (u.pathname+u.search+u.hash.replace(/^#anmeldung=.*$/,'')).replace(/[0-9a-f]{32,}/gi,'…'); }
  function seite(){ let w=''; try{ w=new URL(wurzel).pathname; }catch(e){} return (pfad.startsWith(w)?pfad.slice(w.length):pfad).slice(0,60)||'/'; }
  function inhaltHolen(){ if(inhalt!==null) return; inhalt=''; let app=''; try{ app=localStorage.getItem('schrittli.app')||''; }catch(e){}
    fetch(wurzel+(app==='familie'?'inhalte.json':'schule/schule.json'),{headers:{Range:'bytes=0-79'},cache:'no-cache'}).then(r=>r.text()).then(t=>{ const m=t.match(/"stand":\s*"([\w.\-]+)"/); if(m) inhalt=m[1]; }).catch(()=>{}); }
  const meldung=(art,text)=>({art,text,app:kontrolle?'Kontrolle':'Werkzeug',seite:seite(),video:'',titel:document.title.slice(0,120),schritt:0,zeit:null,
    adresse:adresse(),geraet:geraet(),fenster:innerWidth+'×'+innerHeight,stand:STAND+(inhalt?' · Inhalt '+inhalt:''),erfasst:new Date().toISOString()});

  /* ---- Fenster ---- */
  function zu(){ if(!bg) return; bg.remove(); bg=null; flagge.hidden=false; flagge.focus(); }
  function auf(){ if(bg) return; inhaltHolen(); flagge.hidden=true;
    bg=document.createElement('div'); bg.className='bg';
    bg.innerHTML=`<div class="fenster" role="dialog" aria-modal="true" aria-label="Fehler melden" tabindex="-1"><h2>Fehler melden</h2><div class="arten" role="radiogroup" aria-label="Art">${ARTEN.map(([w,t])=>`<label><input type="radio" name="art" value="${w}"> ${t}</label>`).join('')}</div>
      <textarea rows="3" maxlength="600" aria-label="Text" placeholder="✎"></textarea><p class="fehler" hidden></p>
      <div class="fuss"><button class="nein" type="button">Abbrechen</button><button class="ja" type="button" disabled>Senden</button></div></div>`;
    const $=s=>bg.querySelector(s), f=$('.fenster'), t=$('textarea'), ja=$('.ja'), wahl=()=>($('input:checked')||{}).value||'';
    const pruefe=()=>{ ja.disabled=!wahl()&&!t.value.trim(); };
    const ende=z=>{ f.innerHTML=`<p class="ende${z==='✓'?' gut':''}">${z}</p>`; f.focus(); setTimeout(zu,1400); };
    bg.addEventListener('input',pruefe); bg.addEventListener('change',pruefe);
    bg.addEventListener('click',e=>{ if(e.target===bg) zu(); });
    $('.nein').onclick=zu;
    ja.onclick=async()=>{ ja.disabled=true; const m=meldung(wahl()||'anderes',t.value.trim().slice(0,600)), e=await schick(m);
      if(e==='ok') return ende('✓');
      if(e==='nein'){ const p=$('.fehler'); p.textContent='⚠ Fehler'; p.hidden=false; ja.disabled=false; return; }
      merke(lies().concat(m)); ende(e==='viele'?'⚠ Zu viele':'⚠ Offline'); };
    bg.addEventListener('keydown',e=>{ if(e.key==='Escape'){ e.preventDefault(); zu(); return; } if(e.key!=='Tab') return;
      const fok=[...bg.querySelectorAll('input,textarea,button:not([disabled])')].filter(x=>!(x.type==='radio'&&!x.checked&&wahl())), i=fok.indexOf(host.shadowRoot.activeElement); if(!fok.length) return;
      if(i<0){ e.preventDefault(); fok[0].focus(); } else if(e.shiftKey&&i===0){ e.preventDefault(); fok[fok.length-1].focus(); } else if(!e.shiftKey&&i===fok.length-1){ e.preventDefault(); fok[0].focus(); } });
    ['keydown','keyup','keypress','pointerdown','mousedown','touchstart','click','wheel'].forEach(n=>bg.addEventListener(n,e=>e.stopPropagation()));   // nichts davon gehört der Seite darunter
    host.shadowRoot.appendChild(bg); $('input').focus(); }

  /* ---- Platz: Ecke ohne Arbeitsknöpfe, im Vollbild im Vollbild-Element ---- */
  const fest=el=>{ for(;el&&el!==document.body&&el!==document.documentElement;el=el.parentElement){ const p=getComputedStyle(el).position; if(p==='fixed'||p==='sticky') return true; } return false; };
  function frei(rollt){ const r=flagge.getBoundingClientRect(), xs=[r.left+3,r.left+r.width/2,r.right-3], ys=[r.top+3,r.top+r.height/2,r.bottom-3];
    for(const x of xs) for(const y of ys) for(const el of document.elementsFromPoint(x,y)){ if(el===host||el===document.body||el===document.documentElement) continue; const w=el.closest(WERK); if(w&&(!rollt||fest(w))) return false; }
    return true; }
  function platz(){ if(!host||bg) return; const v=document.fullscreenElement||document.webkitFullscreenElement, ziel=v&&!/^(CANVAS|VIDEO|IMG|IFRAME|HTML)$/.test(v.tagName)?v:document.body;
    if(host.parentElement!==ziel) ziel.appendChild(host);
    const rollt=document.documentElement.scrollHeight>innerHeight+2;
    if(rollt&&!document.querySelector('.melden-platz')){ const s=document.createElement('div'); s.className='melden-platz'; s.setAttribute('aria-hidden','true'); document.body.appendChild(s); }
    // Schmal und rollend: rechts unten, links stehen die Beschriftungen
    for(const [x,y] of rollt&&innerWidth<640?[['r','b'],['l','b'],['l','t'],['r','t']]:[['l','b'],['r','b'],['l','t'],['r','t']]){ flagge.dataset.x=x; flagge.dataset.y=y; if(frei(rollt)) return; }
    flagge.dataset.x='l'; flagge.dataset.y='b'; }
  let warte=0; const spaeter=()=>{ clearTimeout(warte); warte=setTimeout(platz,250); };

  function start(){
    const st=document.createElement('style'); st.textContent='.melden-platz{height:64px;flex:none}@media print{.melden-platz,#melden-flagge{display:none!important}}'; document.head.appendChild(st);
    host=document.createElement('div'); host.id='melden-flagge';
    const root=host.attachShadow({mode:'open'});
    root.innerHTML=`<style>
:host{all:initial}
.flagge{position:fixed;z-index:2147483646;box-sizing:border-box;width:48px;height:48px;padding:0;margin:0;border:2px solid #D64545;border-radius:50%;display:grid;place-items:center;background:#fff;color:#D64545;box-shadow:0 2px 8px rgba(0,0,0,.2);cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.flagge[hidden]{display:none}.flagge svg{width:22px;height:22px;fill:currentColor}
.flagge[data-x=l]{left:calc(10px + env(safe-area-inset-left,0px))}.flagge[data-x=r]{right:calc(10px + env(safe-area-inset-right,0px))}
.flagge[data-y=b]{bottom:calc(10px + env(safe-area-inset-bottom,0px))}.flagge[data-y=t]{top:calc(10px + env(safe-area-inset-top,0px))}
.flagge:focus-visible,button:focus-visible,input:focus-visible,textarea:focus-visible{outline:3px solid #1C4A63;outline-offset:2px}
.bg{position:fixed;top:0;left:0;right:0;bottom:0;z-index:2147483646;box-sizing:border-box;display:grid;place-items:center;padding:16px;overflow:auto;background:rgba(43,35,32,.5);font:16px/1.35 Nunito,system-ui,-apple-system,"Segoe UI",sans-serif;color:#2B2320}
.fenster{box-sizing:border-box;width:min(420px,100%);padding:20px;border-radius:18px;background:#fff;box-shadow:0 10px 30px rgba(0,0,0,.3);outline:0}
h2{margin:0 0 10px;font-size:22px;line-height:1.2}
label{display:flex;align-items:center;gap:10px;min-height:48px;padding:0 8px;border-radius:10px;cursor:pointer;font-weight:600}
input{width:22px;height:22px;margin:0;accent-color:#D64545;flex:none}
textarea{display:block;box-sizing:border-box;width:100%;margin:10px 0 0;padding:10px 12px;font:inherit;font-size:16px;color:inherit;background:#fff;border:2px solid #D8D2C8;border-radius:12px;resize:vertical}
.fuss{display:flex;justify-content:flex-end;gap:10px;margin-top:14px}
button{font:inherit}.fuss button{min-height:48px;padding:0 18px;border-radius:999px;font-weight:800;cursor:pointer;border:2px solid #D8D2C8;background:#fff;color:#2B2320}
.fuss .ja{background:#D64545;border-color:#D64545;color:#fff}.fuss .ja:disabled{opacity:.45;cursor:default}
.fehler{margin:10px 0 0;color:#B3261E;font-weight:700}.fehler[hidden]{display:none}
.ende{margin:0;padding:16px 8px;text-align:center;font-size:30px;font-weight:800;color:#B3261E}.ende.gut{font-size:72px;line-height:1;color:#1F7A4A}
@media print{.flagge,.bg{display:none!important}}
</style><button class="flagge" type="button" data-x="l" data-y="b" title="Fehler melden" aria-label="Fehler melden">${FLAGGE}</button>`;
    flagge=root.querySelector('.flagge'); flagge.onclick=auf;
    document.body.appendChild(host); platz();
    addEventListener('resize',spaeter); addEventListener('orientationchange',spaeter); addEventListener('load',spaeter); document.addEventListener('click',spaeter);
    document.addEventListener('fullscreenchange',platz); document.addEventListener('webkitfullscreenchange',platz);
    if(window.ResizeObserver) new ResizeObserver(spaeter).observe(document.body);
    addEventListener('online',nachsenden); nachsenden(); }
  if(document.body) start(); else document.addEventListener('DOMContentLoaded',start);
})();
