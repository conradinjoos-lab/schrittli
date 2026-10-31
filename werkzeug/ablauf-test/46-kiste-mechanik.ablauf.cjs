/* Kisten-Planer und Mechanik-Planer: Masszahlen am Bild, Übersetzung als Bewegung, Bildprüfung, Druck. */
'use strict';
const KISTE='/vorlagen/kiste/', MECH='/vorlagen/mechanik/';
const nah=(a,b,d=1)=>Math.abs(a-b)<=d;
const klick=(p,s)=>p.locator(s).first().click();
const rand=(p,s)=>p.evaluate(s=>{ const e=document.querySelector(s); if(!e) return null; const r=e.getBoundingClientRect(); return {l:r.left,r:r.right,t:r.top,b:r.bottom,w:r.width,h:r.height}; },s);
const inhalt=p=>p.evaluate(()=>document.querySelector('#druck').innerHTML.length);
const breiteQuer=p=>p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
// Grösse der Masszahl: Fläche in der Zeichnung, zugleich Wert des Felds
const feld=(p,k)=>p.locator(`.massz[data-feld="${k}"]`).first();
const zahl=p=>p.locator('#mf-zahl');
// Ein Testbild wie aus der Kamera: Fahrzeug auf hellem Grund, Fläche in der Silhouette
async function bildDatei(p){ const b64=await p.evaluate(()=>{ const c=document.createElement('canvas'); c.width=640; c.height=320; const x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,640,320);
    x.fillStyle='#223'; x.beginPath(); x.moveTo(40,230); x.lineTo(70,150); x.lineTo(200,140); x.lineTo(280,70); x.lineTo(470,70); x.lineTo(540,150); x.lineTo(600,170); x.lineTo(605,230); x.closePath(); x.fill();
    for(const cx of [160,490]){ x.beginPath(); x.arc(cx,235,45,0,7); x.fill(); }
    return c.toDataURL('image/png').split(',')[1]; }); return {name:'auto.png',mimeType:'image/png',buffer:Buffer.from(b64,'base64')}; }
async function bildLaden(p){ await klick(p,'[data-g="modus"] .chip[data-v="auto"]'); await p.waitForTimeout(80); await p.locator('#bildDatei').setInputFiles(await bildDatei(p)); await p.waitForFunction(()=>{ const f=document.querySelector('#pruefFertig'); return f&&!f.hidden; },null,{timeout:8000}); await p.waitForTimeout(120); }
// Streicht mit dem Finger im Vorschaubild, wie iPad und Handy es senden
async function wischen(p,von,nach,schritte=6){ const c=await p.context().newCDPSession(p);
  await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:von[0],y:von[1]}]});
  for(let i=1;i<=schritte;i++){ await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:von[0]+(nach[0]-von[0])*i/schritte,y:von[1]+(nach[1]-von[1])*i/schritte}]}); await p.waitForTimeout(16); }
  await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}); await c.detach(); }

module.exports=[
  {name:'Kiste: Masszahl öffnet ihr Feld am Mass, Finger und Tastatur',async lauf(t){ for(const [breite,hoehe] of [[1180,820],[390,780]]){
      const k=await t.kontext({breite,hoehe}), p=await k.seite(KISTE); await p.waitForFunction(()=>document.querySelector('.massz[data-feld="l"]'));
      t.pruefe(await p.locator('.massz[data-feld]').count()>=3,'Masszahlen fehlen');
      t.pruefe(await p.evaluate(()=>[...document.querySelectorAll('.massz[data-feld]')].every(e=>e.getAttribute('role')==='button'&&e.tabIndex===0)),'Masszahl ist kein Knopf');
      for(const k2 of ['l','b','h']){ const m=await feld(p,k2).boundingBox(); t.pruefe(m&&m.width>=40&&m.height>=40||await p.evaluate(k=>{ const e=document.querySelector(`.massz[data-feld="${k}"]`), r=e.getBoundingClientRect(); return r.width>=24; },k2),breite+': Masszahl '+k2+' zu klein'); }
      const alt=await p.evaluate(()=>document.querySelector('.massz[data-feld="l"]').textContent);
      await feld(p,'l').tap(); await t.warte(120);
      t.pruefe(await p.locator('#massfeld').isVisible(),breite+': Feld bleibt zu');
      t.pruefe(await p.evaluate(()=>document.activeElement&&document.activeElement.id==='mf-zahl'),breite+': Fokus nicht im Feld');
      const f=await rand(p,'#massfeld'), m=await feld(p,'l').boundingBox(); t.pruefe(f.r<=breite+1&&f.l>=-1&&f.t>=0&&f.b<=hoehe+1,breite+': Feld ragt hinaus '+JSON.stringify(f));
      t.pruefe(Math.abs(f.t-m.y)<220,breite+': Feld weit weg vom Mass');
      t.pruefe(await p.evaluate(()=>{ const g=document.querySelector('[data-glut="l"]'), hex=c=>{ const x=document.createElement('canvas').getContext('2d'); x.fillStyle=c; return x.fillStyle; }, m=document.querySelector('#massfeld'); return !!g&&!!g.querySelector('.glut')&&hex(g.getAttribute('stroke'))===hex(getComputedStyle(m).getPropertyValue('--m').trim()); }),breite+': Kante und Feld nicht gleichfarbig');
      const w0=await zahl(p).inputValue(); await p.locator('#mf-plus').tap(); await t.warte(120);
      t.pruefe(await zahl(p).inputValue()!==w0,breite+': Plus ändert nichts');
      t.pruefe(await p.evaluate(()=>document.querySelector('.massz[data-feld="l"]').textContent)!==alt,breite+': Zeichnung folgt nicht');
      await p.keyboard.press('Escape'); await t.warte(120); t.pruefe(!await p.locator('#massfeld').isVisible(),breite+': Esc schliesst nicht');
      await feld(p,'b').focus(); await p.keyboard.press('Enter'); await t.warte(120); t.pruefe(await p.locator('#massfeld').isVisible(),breite+': Enter öffnet nicht');
      await zahl(p).fill('30'); await p.keyboard.press('Enter'); await t.warte(150);
      t.pruefe(/30/.test(await p.evaluate(()=>document.querySelector('.massz[data-feld="b"]').textContent)),breite+': Eingabe kam nicht an');
      t.pruefe(await p.evaluate(()=>document.activeElement&&document.activeElement.dataset.feld==='b')||!await p.locator('#massfeld').isVisible(),breite+': Enter lässt das Feld stehen');
      await p.keyboard.press('Escape'); await t.warte(80);
      t.pruefe(await breiteQuer(p)<=0,breite+': quer rollbar'); t.keineFehler(k); } }},

  {name:'Kiste: breiter ziehen mit dem Finger, Vorschau folgt, Rückgängig',async lauf(t){ for(const [breite,hoehe] of [[1180,820],[390,780]]){ const k=await t.kontext({breite,hoehe}), p=await k.seite(KISTE); await p.waitForSelector('.zieh[data-achse="b"]');
      const griff=()=>p.evaluate(()=>{ const q=document.querySelector('.zieh[data-achse="l"]').getBoundingClientRect(); return {x:q.left+q.width/2,y:q.top+q.height/2}; }), wert=()=>p.locator('.massz[data-feld="l"]').first().textContent(), w0=await wert(), g=await griff();
      await wischen(p,[g.x,g.y],[g.x+60,g.y-30]); await t.warte(150); const w1=await wert();
      t.pruefe(w1!==w0,breite+': Finger ändert Mass nicht');
      await klick(p,'#p-rueck'); await t.warte(150); t.pruefe(await wert()===w0,breite+': Rückgängig nach Ziehen');
      const y0=await p.evaluate(()=>scrollY); await wischen(p,[breite/2,hoehe-120],[breite/2,hoehe-420]); await t.warte(250); if(hoehe<800) t.pruefe(await p.evaluate(()=>scrollY)!==y0,breite+': Seite rollt nicht mehr'); t.keineFehler(k); } }},

  {name:'Kiste: Innen und Aussen an den Pfeilen, Umschalten und Rückgängig',async lauf(t){ const k=await t.kontext({breite:1180,hoehe:820}), p=await k.seite(KISTE); await p.waitForSelector('[data-pfeil]');
    const lage=()=>p.evaluate(()=>[...new Set([...document.querySelectorAll('[data-pfeil]')].map(e=>e.dataset.lage))]), start=await lage();
    t.pruefe(start.length===1,'Lage gemischt '+start);
    const andere=start[0]==='aussen'?'innen':'aussen', w0=await p.locator('.massz[data-feld="l"]').first().textContent();
    const pfeil0=await p.evaluate(()=>[...document.querySelectorAll('[data-pfeil]')].map(e=>e.getBBox().width+'/'+e.getBBox().height).join(','));
    await klick(p,`[data-g="mass"] .chip[data-v="${andere}"]`); await t.warte(120);
    t.pruefe((await lage())[0]===andere,'Pfeile wechseln nicht');
    t.pruefe(await p.evaluate(()=>[...document.querySelectorAll('[data-pfeil]')].map(e=>e.getBBox().width+'/'+e.getBBox().height).join(','))!==pfeil0,'Pfeile bleiben gleich lang');
    await klick(p,'#p-rueck'); await t.warte(120); t.pruefe((await lage())[0]===start[0],'Rückgängig stellt nicht zurück');
    t.pruefe(await p.locator('.massz[data-feld="l"]').first().textContent()===w0,'Mass nach Rückgängig anders');
    await feld(p,'l').click(); await t.warte(80); await zahl(p).fill('33'); await p.keyboard.press('Enter'); await t.warte(100); await p.keyboard.press('Escape'); await t.warte(60);
    t.pruefe(/33/.test(await p.locator('.massz[data-feld="l"]').first().textContent()),'Mass nicht gesetzt');
    await klick(p,'#p-rueck'); await t.warte(120); t.pruefe(await p.locator('.massz[data-feld="l"]').first().textContent()===w0,'Massänderung bleibt nach Rückgängig'); t.keineFehler(k); }},

  {name:'Kiste: gespeicherter Stand, Link, Fehlerfall',async lauf(t){ const k=await t.kontext({breite:1024,hoehe:768}); let p=await k.seite(KISTE+'?l=25&b=15&h=9&mass=innen&holz=6&deckel=ohne'); await p.waitForSelector('[data-pfeil]');
    t.pruefe(await p.evaluate(()=>[...document.querySelectorAll('[data-pfeil]')].every(e=>e.dataset.lage==='innen')),'Link mass=innen wirkt nicht');
    t.pruefe(/25/.test(await p.locator('.massz[data-feld="l"]').first().textContent()),'Link l=25 wirkt nicht');
    p=await k.seite(KISTE+'?deckel=scharnier&d=12&l=4&b=4'); await t.warte(250);
    t.pruefe(await p.evaluate(()=>{ const w=document.querySelector('#flaeche-warn'); return !!w&&w.textContent.trim().length<=30&&/⚠/.test(w.textContent); }),'Fehler ohne kurzes Zeichen');
    t.keineFehler(k);
    const k2=await t.kontext({breite:1024,hoehe:768}); let q=await k2.seite(KISTE); await q.waitForSelector('[data-pfeil]'); await feld(q,'l').click(); await t.warte(60); await zahl(q).fill('27'); await q.keyboard.press('Enter'); await t.warte(100);
    await q.reload(); await q.waitForSelector('[data-pfeil]'); await t.warte(120);
    t.pruefe(/27/.test(await q.locator('.massz[data-feld="l"]').first().textContent()),'Stand nach Neuladen weg'); t.keineFehler(k2); }},

  {name:'Kiste: Vorschau haftet beim Einstellen auf dem Handy',async lauf(t){ const k=await t.kontext({breite:390,hoehe:780}), p=await k.seite(KISTE); await p.waitForSelector('[data-pfeil]');
    await p.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight)); await t.warte(200);
    const r=await rand(p,'.flaeche.pl-haft'); t.pruefe(r&&nah(r.t,56,1)&&r.h<390,'Vorschau haftet nicht '+JSON.stringify(r));
    t.pruefe(await breiteQuer(p)<=0,'quer rollbar'); t.keineFehler(k); }},

  {name:'Kiste: Druck mit Masskontrolle und Blattwahl',async lauf(t){ const k=await t.kontext({breite:1180,hoehe:820}), p=await k.seite(KISTE); await p.waitForSelector('#blaetter figure.pl-blatt');
    t.pruefe(await p.locator('#blaetter figure.pl-blatt').count()===2,'Blattübersicht nicht 2 Blätter'); t.pruefe(/A4/.test(await p.locator('#druck-kopf').textContent()),'Papier nicht gezeigt');
    await p.emulateMedia({media:'print'}); await t.warte(120);
    const breite=await p.evaluate(()=>{ const q=[...document.querySelectorAll('#druck path')].filter(e=>/h50/.test(e.getAttribute('d'))); return q.length?q[0].getBoundingClientRect().width:0; });
    t.pruefe(nah(breite,188.98,.5),'5-cm-Linie '+breite);
    t.pruefe(await p.evaluate(()=>['.pk','.pl-leiste','.pl-blaetter'].every(s=>[...document.querySelectorAll(s)].every(e=>getComputedStyle(e).display==='none'))),'Bedienung im Druck sichtbar');
    const pdf=(await p.pdf({preferCSSPageSize:true,printBackground:true})).toString('latin1'), mb=pdf.match(/\/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)/); t.pruefe(mb&&nah(+mb[1],595.3,3)&&nah(+mb[2],841.9,3),'Blatt '+(mb&&mb[0]));
    await p.emulateMedia({media:'screen'}); t.keineFehler(k); }},

  {name:'Melden schmal: Flagge liegt auf keiner Beschriftung',async lauf(t){ for(const n of ['zaehlmuster','drucksachen','fachwoerter']){ const k=await t.kontext({breite:390,hoehe:780}), p=await k.seite('/vorlagen/'+n+'/'); await t.warte(500);
      const z=await p.evaluate(()=>{ const f=document.querySelector('#melden-flagge').shadowRoot.querySelector('.flagge').getBoundingClientRect(), w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT), o=[], r=document.createRange();
        for(let x;x=w.nextNode();){ if(!x.textContent.trim()||x.parentElement.closest('script,style,#druck,svg')) continue; r.selectNodeContents(x); for(const q of r.getClientRects()) if(q.width&&q.left<f.right&&q.right>f.left&&q.top<f.bottom&&q.bottom>f.top) o.push(x.textContent.trim().slice(0,30)); } return o; });
      t.pruefe(!z.length,n+': Flagge liegt auf '+z.join(', ')); t.pruefeFlagge(await t.flagge(p),n); await p.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight)); await t.warte(320); t.pruefeFlagge(await t.flagge(p,true),n+' Ende'); t.keineFehler(k); } }},

  {name:'Mechanik: Übersetzung zuerst als Bewegung, Zahl nur im Einstellbereich',async lauf(t){ for(const [breite,hoehe] of [[1180,820],[390,780]]){
      const k=await t.kontext({breite,hoehe}), p=await k.seite(MECH); await p.waitForSelector('[data-ring]');
      const sichtbarI=await p.evaluate(()=>{ const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT), o=[]; for(let n;n=w.nextNode();){ if(!/\bi\s*=/.test(n.textContent)) continue; const e=n.parentElement; if(e.closest('script,style')) continue; const d=e.closest('details'); if(!d||d.open) o.push(n.textContent.trim()); } return o; });
      t.pruefe(!sichtbarI.length,breite+': i = sichtbar '+sichtbarI);
      t.pruefe(!await p.evaluate(()=>[...document.querySelectorAll('.chip,#gross')].some(e=>/\bi\s*=/.test(e.textContent+(e.getAttribute('aria-label')||'')))),breite+': i = an Wahl oder Bild');
      const stand=()=>p.evaluate(()=>({ring:[...document.querySelectorAll('.ring-lauf')].map(e=>e.getAttribute('stroke-dashoffset')||e.style.strokeDashoffset||e.getAttribute('d')||''),zaehl:[...document.querySelectorAll('[data-zaehl]')].map(e=>e.textContent),dreh:[...document.querySelectorAll('[data-dreh]')].map(e=>e.getAttribute('transform'))}));
      const a=await stand(); await t.warte(700); const b=await stand();
      t.pruefe(a.dreh.length>=2,breite+': keine zwei Räder');
      t.pruefe(a.dreh[0]!==b.dreh[0]&&a.dreh[1]!==b.dreh[1],breite+': Räder stehen');
      t.pruefe(a.ring.length>=2&&JSON.stringify(a.ring)!==JSON.stringify(b.ring),breite+': Fortschrittsring steht');
      t.pruefe(await p.evaluate(()=>{ const g=document.querySelector('#gross'); return !g.hidden&&/🐢/.test(g.textContent)&&/↻/.test(g.textContent)&&/↺/.test(g.textContent); }),breite+': Tempobild oder Drehrichtung fehlt');
      await klick(p,'[data-g="ziel"] .chip:nth-child(2)'); await t.warte(150);
      t.pruefe(await p.locator('#gross').isVisible(),breite+': Tempobild weg');
      await p.evaluate(()=>{ const d=document.querySelector('details.mehr'); d.open=true; }); await t.warte(60);
      t.pruefe(/i\s*=/.test(await p.locator('#iZahl').textContent()),breite+': Zahl fehlt im Einstellbereich');
      t.pruefe(await breiteQuer(p)<=0,breite+': quer rollbar'); t.keineFehler(k); } }},

  {name:'Mechanik: Rad antreiben zeigt eine volle Umdrehung, Hase schneller als Schildkröte',async lauf(t){ const k=await t.kontext({breite:1180,hoehe:820}), p=await k.seite(MECH+'?zA=12&zB=24'); await p.waitForSelector('[data-zaehl]');
    await p.waitForFunction(()=>[...document.querySelectorAll('[data-zaehl]')].some(e=>/^1\b/.test(e.textContent.trim())),null,{timeout:12000});
    const z=await p.evaluate(()=>[...document.querySelectorAll('[data-zaehl]')].map(e=>e.textContent.trim()));
    t.pruefe(/^1\b/.test(z[0])&&/^0,5\b/.test(z[1]),'Antrieb 1, zweites Rad 0,5 erwartet: '+z);
    t.pruefe(await p.evaluate(()=>/🐢/.test(document.querySelector('#gross').textContent)),'kein Langsam-Bild');
    const dreh=()=>p.evaluate(()=>{ const a=[...document.querySelectorAll('[data-dreh]')].pop(); return +(a.getAttribute('transform').match(/rotate\((-?[\d.]+)/)||[0,0])[1]; });
    const tempo=async v=>{ await klick(p,`[data-g="ziel"] .chip[data-v="${v}"]`); await t.warte(200); const a=await dreh(); await t.warte(500); return Math.abs(await dreh()-a); };
    await t.warte(1000);   // Halt nach der vollen Umdrehung
    const schnell=await tempo('gleich'), langsam=await tempo('stufe4');
    t.pruefe(schnell>langsam*2,'Verlangsamen wirkt nicht: '+schnell+' / '+langsam); t.pruefe(await p.evaluate(()=>/🐌/.test(document.querySelector('#gross').textContent)),'kein Schneckenbild');
    t.keineFehler(k);
    const k2=await t.kontext({breite:1180,hoehe:820}), q=await k2.seite(MECH+'?zA=24&zB=12'); await q.waitForSelector('[data-zaehl]');
    t.pruefe(await q.evaluate(()=>/🐇/.test(document.querySelector('#gross').textContent)),'kein Hase'); t.keineFehler(k2); }},

  {name:'Mechanik: Griff im Bild mit dem Finger, Rückgängig und Vorschau bleibt erreichbar',async lauf(t){ const k=await t.kontext({breite:390,hoehe:780}), p=await k.seite(MECH+'?modus=auto'); await p.waitForSelector('[data-h]');
    const r=await p.evaluate(()=>{ const e=document.querySelector('[data-h="arad"]')||document.querySelector('[data-h]'), q=e.getBoundingClientRect(); return {x:q.left+q.width/2,y:q.top+q.height/2,h:e.dataset.h}; });
    const m0=await p.evaluate(()=>document.querySelector('#antwort').textContent);
    await wischen(p,[r.x,r.y],[r.x+24,r.y+24]); await t.warte(150);
    const m1=await p.evaluate(()=>document.querySelector('#antwort').textContent); t.pruefe(m1!==m0,'Finger zieht nicht ('+r.h+')');
    await klick(p,'#p-rueck'); await t.warte(150); t.pruefe(await p.evaluate(()=>document.querySelector('#antwort').textContent)===m0,'Rückgängig nach Ziehen');
    await p.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight)); await t.warte(200);
    const b=await rand(p,'.buehne.pl-haft'); t.pruefe(b&&nah(b.t,56,1)&&b.h<390,'Vorschau haftet nicht '+JSON.stringify(b));
    t.keineFehler(k); }},

  {name:'Mechanik: Bildimport prüfen, Achsen und Räder korrigieren, Rückgängig',async lauf(t){ const k=await t.kontext({breite:1180,hoehe:820}), p=await k.seite(MECH); await p.waitForSelector('[data-ring]');
    await bildLaden(p);
    t.pruefe(await p.locator('#buehne [data-h="pa:0"]').count()>=1,'Achsgriff fehlt'); t.pruefe(await p.locator('#buehne [data-h="pr"]').count()>=1,'Radgriff fehlt');
    t.pruefe(await p.locator('#drucken').isDisabled(),'Druck offen während Prüfung');
    const hoehe=await rand(p,'#buehne'); t.pruefe(hoehe.h>=300,'Kontur nicht gross: '+hoehe.h);
    const griff=()=>p.evaluate(()=>{ const q=document.querySelector('#buehne [data-h="pa:0"]').getBoundingClientRect(); return {x:q.left+q.width/2,y:q.top+q.height/2}; }), g0=await griff();
    await p.mouse.move(g0.x,g0.y); await p.mouse.down(); await p.mouse.move(g0.x+40,g0.y,{steps:6}); await p.mouse.up(); await t.warte(150);
    const g1=await griff(); t.pruefe(g1.x>g0.x+15,'Achse folgt nicht '+g0.x+'→'+g1.x);
    await klick(p,'#p-rueck'); await t.warte(180); const g2=await griff(); t.pruefe(nah(g2.x,g0.x,2),'Rückgängig stellt Achse nicht her '+g2.x+' statt '+g0.x);
    const rad=()=>p.evaluate(()=>{ const q=document.querySelector('#buehne [data-h="pr"]').getBoundingClientRect(); return {x:q.left+q.width/2,y:q.top+q.height/2}; }), r0=await rad(), m0=await p.evaluate(()=>document.querySelector('#antwort').textContent);
    await p.mouse.move(r0.x,r0.y); await p.mouse.down(); await p.mouse.move(r0.x+18,r0.y+18,{steps:6}); await p.mouse.up(); await t.warte(150);
    t.pruefe(await p.evaluate(()=>document.querySelector('#antwort').textContent)!==m0,'Rad folgt nicht');
    await klick(p,'#pruefFertig'); await t.warte(200);
    t.pruefe(!await p.locator('#drucken').isDisabled(),'Druck bleibt zu'); t.pruefe(await p.locator('#bildPruef').isVisible(),'Prüfen nicht mehr erreichbar');
    t.pruefe(await p.evaluate(()=>document.querySelectorAll('#druck svg').length)>=1,'Druckvorlage leer');
    await klick(p,'#bildPruef'); await t.warte(150); t.pruefe(await p.locator('#buehne [data-h="pa:0"]').count()>=1,'Prüfung öffnet nicht wieder');
    await klick(p,'#pruefFertig'); await t.warte(120);
    await p.reload(); await p.waitForSelector('[data-h]'); await t.warte(200); t.pruefe(await p.evaluate(()=>!!document.querySelector('[data-g="form"] .chip[data-v="bild"]')),'Bild nach Neuladen weg');
    await klick(p,'#bildPruef'); await t.warte(180); t.pruefe(await p.locator('#buehne [data-h="pa:0"]').count()>=1,'Prüfung nach Neuladen fehlt'); await klick(p,'#pruefFertig'); await t.warte(80);
    // Bild aus der Zeit vor der Prüfung: ohne Rohkontur
    await p.evaluate(()=>{ const n='schrittli.mechanik.bild.v1', o=JSON.parse(localStorage.getItem(n)); delete o.roh; localStorage.setItem(n,JSON.stringify(o)); }); await p.reload(); await p.waitForSelector('[data-h]'); await t.warte(200);
    await klick(p,'#bildPruef'); await t.warte(180); t.pruefe(await p.locator('#buehne [data-h="pa:0"]').count()>=1,'altes Bild lässt sich nicht prüfen'); t.keineFehler(k); }},

  {name:'Mechanik: Bildprüfung auf dem Handy',async lauf(t){ const k=await t.kontext({breite:390,hoehe:780}), p=await k.seite(MECH); await p.waitForSelector('[data-ring]'); await bildLaden(p);
    const griff=()=>p.evaluate(()=>{ const q=document.querySelector('#buehne [data-h="pa:0"]').getBoundingClientRect(); return {x:q.left+q.width/2,y:q.top+q.height/2}; }); await p.evaluate(()=>scrollTo(0,0)); await t.warte(120);
    const g0=await griff(); await wischen(p,[g0.x,g0.y],[g0.x+30,g0.y]); await t.warte(180); const g1=await griff(); t.pruefe(g1.x>g0.x+8,'Finger zieht Achse nicht '+g0.x+'→'+g1.x);
    await klick(p,'#p-rueck'); await t.warte(150); await klick(p,'#p-rueck'); await t.warte(200);
    t.pruefe(!await p.evaluate(()=>document.querySelector('[data-g="form"] .chip[data-v="bild"][aria-pressed="true"]')),'Rückgängig nimmt das Bild nicht zurück');
    t.pruefe(await breiteQuer(p)<=0,'quer rollbar'); t.keineFehler(k); }},

  {name:'Mechanik: Druck, Blattübersicht, zu grosses Teil mit Ausweg',async lauf(t){ const k=await t.kontext({breite:1180,hoehe:820}), p=await k.seite(MECH); await p.waitForSelector('#druck-kopf [data-pl-papier]');
    t.pruefe(await p.locator('#blaetter figure.pl-blatt').count()>=2,'Blattübersicht fehlt');
    await p.emulateMedia({media:'print'}); await t.warte(120);
    const breite=await p.evaluate(()=>{ const q=[...document.querySelectorAll('#druck path')].filter(e=>/h50/.test(e.getAttribute('d'))); return q.length?q[0].getBoundingClientRect().width:0; });
    t.pruefe(nah(breite,188.98,.5),'5-cm-Linie '+breite);
    t.pruefe(await p.evaluate(()=>document.querySelectorAll('#druck g.pl-teil').length)>=2,'Teilzeichen fehlen im Druck');
    await p.emulateMedia({media:'screen'});
    t.pruefe(await p.evaluate(()=>document.querySelectorAll('#blaetter g.pl-teil').length)>=2,'Teilzeichen fehlen in der Blattübersicht');
    const g=await k.seite(MECH+'?modus=rad&radD=30&papier=a4'); await g.waitForSelector('#zu-gross [data-pl-wahl]');
    t.pruefe(/⚠/.test(await g.locator('#zu-gross').textContent()),'kein Warnzeichen'); t.pruefe(await g.locator('#buehne .pl-zugross').count()>=1,'Umriss nicht markiert');
    const wahl=await g.evaluate(()=>[...document.querySelectorAll('#zu-gross [data-pl-wahl]')].map(e=>e.dataset.plWahl)); t.pruefe(wahl.includes('poster'),'Poster fehlt: '+wahl);
    await klick(g,'#zu-gross [data-pl-wahl="poster"]'); await t.warte(200);
    t.pruefe(await g.locator('#zu-gross [data-pl-wahl]').count()===0,'Warnung bleibt nach Poster'); t.pruefe(await g.locator('#blaetter figure.pl-blatt').count()>=2,'Poster teilt nicht auf');
    await klick(g,'#p-rueck'); await t.warte(180); t.pruefe(await g.locator('#zu-gross [data-pl-wahl]').count()>=1,'Rückgängig nach Poster'); t.keineFehler(k); }},

  {name:'Mechanik: alte Links und gespeicherter Stand',async lauf(t){ const k=await t.kontext({breite:1024,hoehe:768}); const p=await k.seite(MECH+'?zA=20&zB=40&modul=3'); await p.waitForSelector('[data-ring]');
    t.pruefe(/Ø 66 mm/.test(await p.locator('#antwort').textContent()),'Link wirkt nicht');
    await klick(p,'[data-g="modus"] .chip[data-v="kreisel"]'); await t.warte(120); await p.reload(); await t.warte(200);
    t.pruefe(await p.evaluate(()=>document.querySelector('[data-g="modus"] .chip[data-v="kreisel"]').matches('[aria-pressed="true"]')),'Stand nach Neuladen weg'); t.keineFehler(k);
    const j=JSON.stringify({modus:'zahn',zA:14,zB:28,modul:4}), k2=await t.kontext({breite:1024,hoehe:768,speicher:{'schrittli.mechanik.v1':j}}), q=await k2.seite(MECH); await q.waitForSelector('[data-ring]');
    t.pruefe(/Ø 64 mm/.test(await q.locator('#antwort').textContent()),'alter Stand nicht übernommen'); t.keineFehler(k2); }},
];
