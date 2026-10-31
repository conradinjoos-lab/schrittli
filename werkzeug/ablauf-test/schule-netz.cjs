/* Gemeinsame Hilfen der Schul-Abläufe: nachgebildete Sammlung und Klassenlisten, iPad mit Klasse, Kinderwahl über die echten Kacheln, Kamera über die Dateiwahl.
 * Keine Ablauf-Datei: start.cjs lädt nur *.ablauf.cjs. Zwei iPads teilen sich ein Objekt aus sammlung().
 */
'use strict';
const TOKEN='a'.repeat(64);
const LISTE=[{id:'k3a',name:'3a',stufe:3,namen:['Ben','Eva','Ida','Lea','Mia','Noah','Tim']},{id:'k4b',name:'4b',stufe:4,namen:['Mia','Zoe']}];
const ANLEITUNG='raketenstation-1', VIDEO='wl-fingerstricken';
const CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Authorization,Content-Type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};
const json=(r,status,body)=>r.fulfill({status,headers:{...CORS,'Content-Type':'application/json'},body:JSON.stringify(body)});

/* modus: 'ok', 'kaputt' (503), 'abgelehnt' (400), 'offline'. alteAntwort: Worker vor der Migration, jede Antwort hat eine Zahl als Sterne. */
const sammlung=()=>({id:'s1',name:'Klasse 3a',werke:[],version:1,modus:'ok',alteAntwort:false,abgaben:0});
const einsenden=(s,d)=>{ s.werke.unshift({id:d.id,videoId:d.videoId,titel:d.titel,name:d.name,klasse:d.klasse,sterne:d.sterne??null,erstellt:Date.now()}); s.version++; };

async function anbinden(k,s){
  /* FormData mit Blob zeigt Chrome dem Netz-Abfangen nicht: die Abgabe geht im Test als Bytes hinaus */
  await k.c.addInitScript(()=>{ const f=window.fetch; window.fetch=async(u,o)=>{ if(o&&o.body instanceof FormData){ const q=new Request(u,{method:'POST',body:o.body}), b=await q.arrayBuffer(); return f(u,{...o,body:b,headers:{...o.headers,'Content-Type':q.headers.get('content-type')}}); } return f(u,o); }; });
  await k.c.route(u=>u.hostname!=='127.0.0.1'&&/^\/(sammlung|namen)\//.test(u.pathname),async r=>{ const q=r.request(), u=new URL(q.url()), pfad=u.pathname;
    if(q.method()==='OPTIONS') return r.fulfill({status:204,headers:CORS});
    if(pfad==='/namen/liste') return json(r,200,{klassen:LISTE});
    if(s.modus==='offline') return r.abort('internetdisconnected');
    if(pfad==='/sammlung/verbinden') return json(r,200,{id:s.id,name:s.name});
    if(pfad==='/sammlung/abgeben'){ s.abgaben++; if(s.modus==='kaputt') return json(r,503,{fehler:'kaputt'}); if(s.modus==='abgelehnt') return json(r,400,{fehler:'abgelehnt'});
      const t=q.postDataBuffer().toString('latin1'), m=/name="daten"\r\n\r\n([\s\S]*?)\r\n--/.exec(t); if(!m||!/image\/jpeg/.test(t)) return json(r,400,{fehler:'Formular'});
      const d=JSON.parse(Buffer.from(m[1],'latin1').toString('utf8')); if(d.name.length>100) return json(r,400,{fehler:'Name'}); if(!s.werke.some(w=>w.id===d.id)) einsenden(s,d); return json(r,201,{ok:true,id:d.id}); }
    if(pfad==='/sammlung/werke'){ if(+u.searchParams.get('version')===s.version) return json(r,200,{unveraendert:true,version:s.version}); return json(r,200,{version:s.version,geloescht:[],werke:s.alteAntwort?s.werke.map(w=>({...w,sterne:w.sterne??1})):s.werke}); }
    if(pfad==='/sammlung/foto') return r.fulfill({status:200,headers:{...CORS,'Content-Type':'image/jpeg'},body:s.bild||Buffer.alloc(0)});
    return json(r,404,{fehler:'unbekannt'}); }); }

/* Unterricht nachgebildet, Prüfung wie im Worker: ein falscher Eintrag lehnt das ganze Paket ab. u.modus 'ok' oder 'offline', u.pakete die angenommenen Körper, u.abgelehnt die übrigen */
const VERBINDUNG={token:TOKEN,deviceId:'11111111-1111-4111-8111-111111111111',id:'u1',name:'Werkraum'};
const unterricht=(mehr={})=>({policy:{mode:'free',ids:[]},revision:1,leaseMs:90000,modus:'ok',pakete:[],kopf:[],abgelehnt:[],...mehr});
const staendeOk=b=>b&&b.token===TOKEN&&/^[0-9a-f-]{36}$/.test(b.deviceId||'')&&Array.isArray(b.staende)&&b.staende.length>=1&&b.staende.length<=40&&b.staende.every(s=>/^[^\u0000-\u001f\u007f]{1,120}$/.test(s.kindKey||'')&&/^[-a-zA-Z0-9_]{1,100}$/.test(s.videoId||'')&&Number.isInteger(s.schritt)&&s.schritt>=0&&s.schritt<=999&&Number.isInteger(s.max)&&s.max>=0&&s.max<=999&&s.schritt<=s.max&&typeof s.videoFertig==='boolean'&&typeof s.werkFertig==='boolean'&&Number.isFinite(s.zeit));
async function unterrichtAnbinden(k,u){ await k.c.route(a=>a.hostname!=='127.0.0.1'&&/^\/unterricht\//.test(a.pathname),async r=>{ const q=r.request(), pfad=new URL(q.url()).pathname;
    if(q.method()==='OPTIONS') return r.fulfill({status:204,headers:CORS});
    if(u.modus==='offline') return r.abort('internetdisconnected');
    if(pfad==='/unterricht/status') return json(r,200,{id:'u1',name:'Werkraum',policy:u.policy,revision:u.revision,leaseMs:u.leaseMs});
    if(pfad==='/unterricht/kindstand'){ const b=JSON.parse(q.postData()||'null'); u.kopf.push(q.headers()); if(!staendeOk(b)){ u.abgelehnt.push(b); return json(r,400,{fehler:'Stand'}); } u.pakete.push(b); return json(r,200,{ok:true,stand:Date.now(),angenommen:b.staende.length}); }
    return json(r,404,{fehler:'unbekannt'}); }); }
const speicher=(s,mehr={})=>({'schrittli.schule.klassenlisten':JSON.stringify({klassen:LISTE,zeit:Date.now()}),...(s?{'schrittli.schulwerke.verbindung':JSON.stringify({id:s.id,name:s.name,token:TOKEN})}:{}),...mehr});
/* iPad mit Namenslisten, auf Wunsch an einer Sammlung */
async function ipad(t,{s=null,netz=s,breite=1024,hoehe=768,mehr={}}={}){ const k=await t.kontext({breite,hoehe,speicher:speicher(s,mehr)}); await anbinden(k,netz||sammlung()); const p=await t.app(k,'schule'); await p.waitForFunction(()=>KL.klassen.length>0); return {k,p}; }

/* Kurzlogin oben rechts, dann die Kacheln */
async function kacheln(p,namen,klasse='k3a'){ if(!await p.locator('.ww-raster').count()) await p.locator('[data-wer]').first().click(); await p.waitForSelector('.ww-raster');
  if(!await p.locator(`.ww [data-act=liste][data-id=${klasse}]`).count()&&await p.locator('.ww [data-act=zurueck]').count()&&await p.evaluate(k=>{ const h=document.querySelector('.ww-kopf h1'); return h&&h.textContent.trim()!==KL.klassen.find(x=>x.id===k).name; },klasse)) await p.locator('.ww [data-act=zurueck]').click();
  if(await p.locator(`.ww [data-act=liste][data-id=${klasse}]`).count()) await p.locator(`.ww [data-act=liste][data-id=${klasse}]`).click();
  for(const n of namen) await p.locator(`.ww-k[data-n="${n}"]`).click(); }
async function kinderWahl(p,namen,klasse){ await kacheln(p,namen,klasse); await p.locator('.ww [data-act=ok]').click(); await p.waitForFunction(()=>!document.querySelector('.ww-raster')); }
const karteWeg=async p=>{ await p.waitForTimeout(60); if(await p.locator('.ww-stand').count()) await p.locator('.ww [data-act=zu]').click(); await p.waitForFunction(()=>!document.querySelector('.ww')); };
/* Anleitung bis Schritt nr (1 = erster Schritt) */
async function schritte(p,bis){ if(await p.locator('.an-start').count()){ while(await p.locator('.an-start .mk:not(.da)').count()) await p.locator('.an-start .mk:not(.da)').first().click(); await p.locator('.an-start .an-weiter').first().click(); } for(let i=await p.evaluate(()=>+((/\d+/.exec(document.querySelector('.an-zahl').textContent)||[])[0]))||1;i<bis;i++){ if(await p.locator('.an-gesehen[aria-pressed=false]').count()) await p.locator('.an-gesehen').click(); await p.locator('.an-nav .an-weiter').click(); await p.waitForFunction(n=>new RegExp('^\\s*'+n+'/').test((document.querySelector('.an-zahl')||{}).textContent||''),i+1); } }
/* Direkt in Anleitung oder Video: Material gilt als bereitgelegt, die Materialwahl prüft 70-projekt */
const oeffne=(p,id=ANLEITUNG)=>p.evaluate(id=>{ const v=videoOf(id); matListe(v).forEach(m=>matSetzen(v,m,true)); go('player',{videoId:id}); },id);
const stand=(p,key,id=ANLEITUNG)=>p.evaluate(([k,i])=>{ const a=(S.arbeit[k]||{})[i]; return a?{step:a.step,max:a.max,done:!!a.done,erledigt:a.erledigt}:null; },[key,id]);
const gespeichert=(p,key,id=ANLEITUNG)=>p.evaluate(([k,i])=>{ const a=(JSON.parse(localStorage.getItem('schrittli.schule.v1')).arbeit[k]||{})[i]; return a?{step:a.step,max:a.max}:null; },[key,id]);
const neuLaden=async p=>{ await p.waitForTimeout(180); await p.reload({waitUntil:'load'}); await p.waitForFunction(()=>typeof view!=='undefined'&&view.name&&view.name!=='boot'&&typeof contentInfo!=='undefined'&&contentInfo); await p.evaluate(()=>{ KL.gefragt=true; document.querySelectorAll('.ww').forEach(e=>e.remove()); if(view.name==='wer'||!S.settings.klasse){ S.settings.klasse=S.settings.klasse||3; go('home'); } }); };

/* Testbild aus dem Browser, damit es wirklich dekodiert */
const testbild=async p=>Buffer.from((await p.evaluate(()=>{ const c=document.createElement('canvas'); c.width=320; c.height=240; const x=c.getContext('2d'); x.fillStyle='#E8554E'; x.fillRect(0,0,320,240); x.fillStyle='#fff'; x.fillRect(60,60,120,80); return c.toDataURL('image/jpeg',.8); })).split(',')[1],'base64');
/* Kamera aus dem Tipp: die Dateiwahl ist die Kamera des iPads */
async function foto(p,bild,klick){ const [wahl]=await Promise.all([p.waitForEvent('filechooser',{timeout:4000}),klick()]); await wahl.setFiles({name:'werk.jpg',mimeType:'image/jpeg',buffer:bild}); }
/* Fotos ausgelöst, Sterne-Schirm da */
async function fotoMit(p,bild,namen,klasse){ await kacheln(p,namen,klasse); await foto(p,bild,()=>p.locator('.ww [data-act=kamera]').click()); }

module.exports={TOKEN,LISTE,ANLEITUNG,VIDEO,CORS,VERBINDUNG,sammlung,anbinden,unterricht,unterrichtAnbinden,speicher,ipad,kacheln,kinderWahl,karteWeg,schritte,oeffne,stand,gespeichert,neuLaden,testbild,foto,fotoMit};
