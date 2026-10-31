/* Abläufe im echten Browser prüfen, bevor etwas veröffentlicht wird.
 * NODE_PATH="C:/Grok Code/Steine-App/node_modules" node werkzeug/ablauf-test/start.cjs [Wort …]
 * Mit Wörtern laufen nur die Abläufe, deren Name eines davon enthält.
 * Liefert das Repo über einen eigenen kleinen Server aus und startet Chrome in iPad-Grösse mit Touch.
 * Jede Datei *.ablauf.cjs im selben Ordner exportiert {name,lauf(t)} oder eine Liste davon. Die Abläufe laufen nach Dateiname sortiert.
 * Das Hilfsobjekt t steht unten in hilfen(). Keine Anfrage verlässt den Rechner: Melden landet in k.meldungen, YouTube ist eine Attrappe.
 * Ausgabe je Ablauf OK oder FEHLER, Exit-Code 1, sobald einer scheitert.
 */
'use strict';
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const WURZEL=path.resolve(__dirname,'..','..');
const CHROME=process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const IPAD='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const ARTEN={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.cjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.woff2':'font/woff2','.mp3':'audio/mpeg','.mp4':'video/mp4','.pdf':'application/pdf','.wasm':'application/wasm'};
// Attrappe der YouTube-Schnittstelle: Player ist sofort bereit, abspielen wechselt nur den Zustand. window.__yt steuert sie im Test: fehler(), zustand(n), zeit(s), suche = alle Sprünge
const YT_ATTRAPPE=`window.YT={Player:function(el,o){let s=5,z=0;const e=o.events||{},setze=n=>{s=n;if(e.onStateChange)e.onStateChange({data:n});},sprung=[];
  window.__yt={fehler(c){if(e.onError)e.onError({data:c||150});},zustand:setze,zeit(t){z=t;},suche:sprung};
  Object.assign(this,{playVideo(){setze(1);},pauseVideo(){setze(2);},seekTo(t){z=t;sprung.push(t);},getCurrentTime(){return z;},getDuration(){return 600;},getPlayerState(){return s;},setPlaybackRate(){},unloadModule(){},destroy(){}});
  setTimeout(()=>e.onReady&&e.onReady({target:this}),0);}};setTimeout(()=>window.onYouTubeIframeAPIReady&&window.onYouTubeIframeAPIReady(),0);`;

function server(){ return new Promise(fertig=>{ const s=http.createServer((req,res)=>{
    let p; try{ p=decodeURIComponent(new URL(req.url,'http://x').pathname); }catch(e){ res.writeHead(400); return res.end(); }
    let f=path.join(WURZEL,p); if(f!==WURZEL&&!f.startsWith(WURZEL+path.sep)){ res.writeHead(403); return res.end(); }
    if(fs.existsSync(f)&&fs.statSync(f).isDirectory()) f=path.join(f,'index.html');
    if(!fs.existsSync(f)){ res.writeHead(404); return res.end(); }
    res.writeHead(200,{'Content-Type':ARTEN[path.extname(f).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store'}); fs.createReadStream(f).pipe(res); });
  s.listen(0,'127.0.0.1',()=>fertig(s)); }); }

function hilfen(browser,basis,kontexte){
  const t={basis,
    /* Neuer iPad-Kontext. k.fehler sammelt Konsolenfehler, Abstürze und eigene 4xx/5xx, k.meldungen die gesendeten Meldungen.
       k.netz setzt die Antwort von /melden: 'ok', 'offline', 'viele' oder 'nein'. */
    async kontext({breite=1024,hoehe=768,speicher={},netz='ok',touch=true}={}){
      const c=await browser.newContext({viewport:{width:breite,height:hoehe},hasTouch:touch,isMobile:touch,deviceScaleFactor:1,userAgent:touch?IPAD:undefined}); kontexte.push(c);
      const k={c,fehler:[],meldungen:[],netz};
      await c.addInitScript(s=>{ try{ if(!sessionStorage.getItem('ablauf.da')){ sessionStorage.setItem('ablauf.da','1'); for(const n in s) localStorage.setItem(n,s[n]); } }catch(e){} },speicher);
      await c.route(u=>u.hostname!=='127.0.0.1',async r=>{ const q=r.request(), u=new URL(q.url());
        if(u.pathname==='/melden'){ const h={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Content-Type':'application/json'};
          if(q.method()==='OPTIONS') return r.fulfill({status:204,headers:h});
          if(k.netz==='offline') return r.abort('internetdisconnected');
          if(k.netz==='ok') k.meldungen.push(JSON.parse(q.postData()||'{}'));
          return r.fulfill({status:k.netz==='viele'?429:k.netz==='nein'?400:200,headers:h,body:'{}'}); }
        if(u.pathname==='/iframe_api') return r.fulfill({contentType:'text/javascript',body:YT_ATTRAPPE});
        return r.abort(); });
      k.seite=async adresse=>{ const p=await c.newPage();
        p.on('pageerror',e=>k.fehler.push('Absturz: '+e.message));
        p.on('console',m=>{ if(m.type()!=='error'||/Failed to load resource/.test(m.text())) return; k.fehler.push('Konsole: '+m.text()); });
        p.on('response',r=>{ if(r.url().startsWith(basis)&&r.status()>=400&&!/favicon/.test(r.url())) k.fehler.push(r.status()+' '+r.url().slice(basis.length)); });
        if(adresse) await p.goto(basis+adresse,{waitUntil:'load'}); return p; };
      return k; },
    /* App laden und warten, bis die Inhalte da sind. Familie braucht ein Profil, Schule eine Klasse. */
    async app(k,art='schule'){ const p=await k.seite(art==='schule'?'/schule/':'/familie.html'); await p.waitForFunction(()=>typeof view!=='undefined'&&view.name&&view.name!=='boot'&&typeof contentInfo!=='undefined'&&contentInfo);
      await p.evaluate(a=>{ if(a==='familie'&&!S.profiles.length){ S.profiles.push({id:'p1',name:'Test',emoji:AVATARS[0],color:COLORS[1],stars:0}); S.activeProfile='p1'; } if(!S.settings.klasse) S.settings.klasse=3; if(a==='schule') KL.gefragt=true; save(); go('home'); },art); return p; },
    /* Wirft, wenn etwas nicht stimmt */
    pruefe(wert,text){ if(!wert) throw new Error(text); },
    keineFehler(k){ if(k.fehler.length) throw new Error([...new Set(k.fehler)].slice(0,6).join(' | ')); },
    warte:ms=>new Promise(f=>setTimeout(f,ms)),
    /* Liest die Flagge (App oder melden.js): Grösse, ob oben, ob sie Klickbares überdeckt. Auf rollenden Seiten zählt das nur für Festes, ausser mit streng (Seite am Ende). */
    flagge(p,streng=false){ return p.evaluate(streng=>{ const host=document.querySelector('#melden-flagge'), b=host?host.shadowRoot.querySelector('.flagge'):document.querySelector('.fm-knopf'); if(!b) return {da:false};
      const r=b.getBoundingClientRect(), s=getComputedStyle(b), x=r.left+r.width/2, y=r.top+r.height/2, oben=document.elementFromPoint(x,y);
      const inn=x>=0&&y>=0&&x<=innerWidth&&y<=innerHeight, sichtbar=s.display!=='none'&&s.visibility!=='hidden'&&+s.opacity>.3&&r.width>0&&inn;
      const treffer=host?oben===host:!!(oben&&oben.closest('.fm-knopf')); const zeichne=e=>(e.tagName+'.'+String(e.className).trim().split(/\s+/).join('.')).slice(0,50)+(e.dataset&&e.dataset.act?'['+e.dataset.act+']':'');
      const fest=e=>{ for(;e&&e!==document.body;e=e.parentElement){ const q=getComputedStyle(e).position; if(q==='fixed'||q==='sticky') return true; } return false; };
      const rollt=!streng&&(document.documentElement.scrollHeight>innerHeight+2||[...document.querySelectorAll('body *')].some(e=>e.scrollHeight>e.clientHeight+2&&/auto|scroll/.test(getComputedStyle(e).overflowY)));
      const deckt=[]; const seen=new Set();
      for(const e of document.querySelectorAll('a[href],button,input,select,textarea,summary,label,[role=button],[data-act],[onclick]')){ if(e===b||e===host||e.closest('.fm-knopf')||seen.has(e)) continue; const q=e.getBoundingClientRect(); if(!q.width||!q.height) continue; const v=getComputedStyle(e); if(v.visibility==='hidden'||v.display==='none'||+v.opacity<.05) continue;
        const ix=Math.min(q.right,r.right)-Math.max(q.left,r.left), iy=Math.min(q.bottom,r.bottom)-Math.max(q.top,r.top); if(ix>4&&iy>4&&(!rollt||fest(e))){ let o=document.elementsFromPoint(Math.max(q.left,r.left)+ix/2,Math.max(q.top,r.top)+iy/2); if(o.includes(e)){ seen.add(e); deckt.push(zeichne(e)); } } }
      return {da:true,sichtbar,treffer,breite:r.width,hoehe:r.height,deckt,ort:[Math.round(r.left),Math.round(r.top)],voll:!document.fullscreenElement||document.fullscreenElement.contains(b)||document.fullscreenElement===document.documentElement,host:!!host}; },streng); },
    pruefeFlagge(z,wo){ t.pruefe(z.da,wo+': keine Flagge'); t.pruefe(z.sichtbar,wo+': Flagge nicht sichtbar '+z.ort); t.pruefe(z.treffer,wo+': Flagge überdeckt '+z.ort); t.pruefe(z.breite>=48&&z.hoehe>=48,wo+': Flagge '+z.breite+'×'+z.hoehe); t.pruefe(!z.deckt.length,wo+': Flagge liegt auf '+z.deckt.join(', ')+' bei '+z.ort); t.pruefe(z.voll,wo+': Flagge ausserhalb Vollbild'); }
  };
  return t; }

async function haupt(){
  let chromium; try{ ({chromium}=require('playwright')); }catch(e){ console.error('FEHLER playwright fehlt. NODE_PATH="C:/Grok Code/Steine-App/node_modules" setzen.'); process.exit(2); }
  const woerter=process.argv.slice(2).map(w=>w.toLowerCase());
  const liste=fs.readdirSync(__dirname).filter(f=>f.endsWith('.ablauf.cjs')).sort().flatMap(f=>[].concat(require(path.join(__dirname,f))).map(a=>({...a,datei:f})))
    .filter(a=>!woerter.length||woerter.some(w=>a.name.toLowerCase().includes(w)));
  const s=await server(), basis='http://127.0.0.1:'+s.address().port, browser=await chromium.launch({headless:true,executablePath:CHROME});
  let schlecht=0;
  for(const a of liste){ const kontexte=[], t0=Date.now(); let fehler=null;
    try{ await a.lauf(hilfen(browser,basis,kontexte)); }catch(e){ fehler=e; }
    for(const c of kontexte) await c.close().catch(()=>{});
    const zeit=((Date.now()-t0)/1000).toFixed(1)+' s';
    if(fehler){ schlecht++; console.log('FEHLER  '+a.name+'  ('+zeit+')\n        '+String(fehler.message||fehler).split('\n').slice(0,40).join('\n        ')); }
    else console.log('OK      '+a.name+'  ('+zeit+')'); }
  await browser.close(); s.close();
  console.log(`\n${liste.length-schlecht} von ${liste.length} Abläufen in Ordnung`);
  process.exit(schlecht?1:0); }
haupt().catch(e=>{ console.error('FEHLER '+(e.stack||e)); process.exit(2); });
