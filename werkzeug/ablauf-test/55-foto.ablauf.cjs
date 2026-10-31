/* Punkt 14 und Mehrfachnamen: Foto, Sterne freiwillig, ein Eintrag für die Gruppe, vier Zustände, zweites iPad. */
'use strict';
const {ANLEITUNG,VIDEO,sammlung,ipad,kacheln,kinderWahl,karteWeg,schritte,oeffne,neuLaden,testbild,foto,fotoMit}=require('./schule-netz.cjs');
const ohneSterne=p=>p.locator('.ww-gehe[data-act=ohne]').click();
const sterne=(p,n)=>p.locator(`.stern[data-n="${n}"]`).click();
const werkeAuf=async p=>{ await p.evaluate(()=>{ document.querySelectorAll('.modal-bg').forEach(e=>e.remove()); go('gallery'); }); await p.waitForSelector('.kork,.empty'); };
const zustand=p=>p.locator('.foto .sw-z').first().textContent();
const wieder=p=>p.evaluate(()=>window.dispatchEvent(new Event('online')));
const warte=(p,sel)=>p.waitForSelector(sel,{timeout:5000});
const wahlLeer=p=>p.evaluate(()=>kinder().length===0&&!S.settings.kinder.length&&!localStorage.getItem('schrittli.kind'));
const sicht=async(p,k)=>{ await p.locator(`.sw-filter [data-act=sicht][data-k=${k}]`).click(); await p.waitForFunction(k=>view.params.sicht===k,k); };
const anGeraet=async t=>{ const s=sammlung(), {k,p}=await ipad(t,{s}); s.bild=await testbild(p); return {s,k,p}; };

/* Über die echte Anleitung: nach dem letzten Schritt kommen von selbst die Kacheln */
const fotoOhneSterne=async t=>{ const {s,k,p}=await anGeraet(t);
  const n=await p.evaluate(id=>videoOf(id).steps.length,ANLEITUNG); await oeffne(p); await warte(p,'.an-start'); await schritte(p,n); if(await p.locator('.an-gesehen[aria-pressed=false]').count()) await p.locator('.an-gesehen').click(); await p.locator('.an-nav .an-weiter').click();
  await warte(p,'.ww-raster'); await kacheln(p,['Mia']); await foto(p,s.bild,()=>p.locator('.ww [data-act=kamera]').click());
  await warte(p,'.ww-foto'); t.pruefe(await p.locator('.stern').count()===5,'Fünf Sterne'); await ohneSterne(p);
  await p.waitForFunction(()=>S.works.length===1); await werkeAuf(p); await p.evaluate(()=>swSync()); await warte(p,'.sw-z.geteilt');
  t.pruefe(s.werke.length===1&&s.werke[0].sterne===null&&s.werke[0].name==='Mia'&&s.werke[0].klasse===3,'Abgabe '+JSON.stringify(s.werke[0])); t.pruefe((await zustand(p))==='✓ Geteilt','Zustand'); t.pruefe(!await p.locator('.foto .st').count(),'Sterne erfunden'); t.pruefe(await wahlLeer(p),'Wahl leer'); t.keineFehler(k); };

const mehrereNamen=async t=>{ const {s,k,p}=await anGeraet(t); await oeffne(p,VIDEO); await p.waitForFunction(()=>view.name==='player'); await p.evaluate(id=>takePhoto(id),VIDEO);
  await fotoMit(p,s.bild,['Mia','Noah','Lea']); await warte(p,'.ww-foto'); t.pruefe((await p.locator('.ww-kopf h1').textContent()).includes('Mia, Noah, Lea'),'Titel Gruppe'); await sterne(p,4);
  await p.waitForFunction(()=>S.works.length===1,null,{timeout:3000}); await p.evaluate(()=>swSync()); await p.waitForFunction(()=>S.works[0].sync==='geteilt');
  t.pruefe(s.werke.length===1&&s.abgaben===1,'Ein Foto'); t.pruefe(s.werke[0].name==='Mia, Noah, Lea'&&s.werke[0].sterne===4,'Abgabe '+JSON.stringify(s.werke[0])); t.pruefe(await wahlLeer(p),'Nach Abgabe leer');
  await werkeAuf(p); t.pruefe(await p.locator('.foto').count()===1,'Korkwand einmal');
  await p.evaluate(()=>{ go('home'); }); await kinderWahl(p,['Noah']); await karteWeg(p).catch(()=>{}); await werkeAuf(p); t.pruefe(await p.locator('.foto').count()===1,'Meine Noah'); t.pruefe(await p.locator('.sw-filter .an').textContent()==='Meine','Meine an');
  await p.evaluate(()=>go('home')); await kinderWahl(p,['Tim']); await karteWeg(p).catch(()=>{}); await werkeAuf(p); t.pruefe(!await p.locator('.foto').count(),'Tim fremd'); await sicht(p,'klasse'); t.pruefe(await p.locator('.foto').count()===1,'Klasse Tim');
  /* Grenze und nichts vorgewählt beim nächsten Foto */
  await p.evaluate(()=>{ go('home'); kinderSetzen([]); takePhoto('raketenstation-1'); }); await kacheln(p,['Ben','Eva','Ida','Lea','Mia','Noah']); t.pruefe(await p.locator('.ww-k.ich').count()===6,'Sechs'); await p.locator('.ww-k[data-n=Tim]').click(); t.pruefe(await p.locator('.ww-k.ich').count()===6,'Siebtes Kind'); t.pruefe((await p.locator('.toast').last().textContent()).includes('Max. 6'),'Meldung'); await p.locator('.ww-k[data-n=Tim]').waitFor(); t.keineFehler(k); };

/* Nachweis: das Foto erscheint auf dem zweiten iPad unter «Klasse» */
const zweitesIpad=async t=>{ const {s,k,p}=await anGeraet(t), b=await ipad(t,{s}); await p.evaluate(id=>takePhoto(id),VIDEO); await fotoMit(p,s.bild,['Mia','Noah']); await warte(p,'.ww-foto'); await ohneSterne(p); await p.waitForFunction(()=>S.works.length===1); await p.evaluate(()=>swSync()); await p.waitForFunction(()=>S.works[0].sync==='geteilt');
  const q=b.p; await kinderWahl(q,['Tim']); await karteWeg(q).catch(()=>{}); await werkeAuf(q); await sicht(q,'klasse'); await q.evaluate(()=>swSync()); await warte(q,'.foto .sw-z.geteilt');
  t.pruefe((await q.locator('.foto .dt').first().textContent()).includes('Mia, Noah'),'Namen auf iPad 2'); await q.waitForFunction(()=>{ const i=document.querySelector('.foto img'); return i&&i.naturalWidth>0; }); t.pruefe(!await q.locator('.foto .st').count(),'Sterne auf iPad 2'); t.keineFehler(k); t.keineFehler(b.k); };

const fehler=async t=>{ const {s,k,p}=await anGeraet(t); s.modus='offline'; await p.evaluate(id=>takePhoto(id),VIDEO); await fotoMit(p,s.bild,['Mia']); await warte(p,'.ww-foto'); await ohneSterne(p); await p.waitForFunction(()=>S.works.length===1); await werkeAuf(p);
  await warte(p,'.sw-z.wartet'); t.pruefe((await zustand(p))==='⏳ Läuft','Läuft offline'); await p.waitForFunction(()=>document.querySelector('#sw-status').textContent==='⚠ Verbindung');
  /* Nach dem Neuladen wartet es weiter und geht beim nächsten Versuch hinaus */
  await neuLaden(p); await werkeAuf(p); await warte(p,'.sw-z.wartet');
  s.modus='kaputt'; await wieder(p); await p.waitForFunction(()=>!SW.busy); await p.waitForTimeout(80); await warte(p,'.sw-z.wartet'); t.pruefe(s.abgaben>=1,'Versuch');
  s.modus='abgelehnt'; await wieder(p); await warte(p,'.sw-z.fehler'); t.pruefe((await zustand(p))==='⚠ Fehler','Fehler sichtbar'); await p.waitForFunction(()=>document.querySelector('#sw-status').textContent==='⚠ 1'); const vorher=s.abgaben; await p.waitForTimeout(150); await wieder(p); await p.waitForTimeout(150); t.pruefe(s.abgaben===vorher,'Fehler sendet nicht von selbst');
  s.modus='ok'; await p.locator('.sw-z.fehler').click(); await warte(p,'.sw-z.geteilt'); t.pruefe(s.werke.length===1,'Einmal angekommen'); t.pruefe((await zustand(p))==='✓ Geteilt','Geteilt'); t.pruefe(!await p.locator('.modal-bg').count(),'Tippen öffnet nicht');
  await neuLaden(p); await werkeAuf(p); await warte(p,'.sw-z.geteilt'); t.keineFehler(k); };

/* Name oder Klasse fehlen: bleibt hier, sichtbar, und lässt sich nachtragen */
const aufDemGeraet=async t=>{ const {s,k,p}=await anGeraet(t); await p.evaluate(id=>takePhoto(id),VIDEO); await foto(p,s.bild,async()=>{ await warte(p,'.ww-raster'); await p.locator('.ww [data-act=kamera]').click(); });
  await warte(p,'#fn-name'); await p.locator('.kid-modal [data-act=ok],.modal-bg [data-act=ok]').last().click(); await p.waitForFunction(()=>S.works.length===1); await werkeAuf(p); await warte(p,'.sw-z.geraet'); t.pruefe((await zustand(p))==='📱 Gerät','Gerät'); t.pruefe(!s.abgaben,'Nichts gesendet');
  await p.locator('.sw-z.geraet').click(); await kacheln(p,['Eva']); await p.locator('.ww [data-act=ok]').click(); await warte(p,'.sw-z.geteilt'); t.pruefe(s.werke.length===1&&s.werke[0].name==='Eva'&&s.werke[0].klasse===3,'Nachgetragen'); t.keineFehler(k); };

const klasseFehlt=async t=>{ const {s,k,p}=await anGeraet(t); await p.evaluate(()=>{ KL.klassen.push({id:'wg',name:'Gruppe',namen:['Ben']}); S.settings.klasse=0; }); await p.evaluate(id=>takePhoto(id),VIDEO); await warte(p,'.ww-raster'); await p.waitForSelector('.ww [data-act=liste][data-id=wg],.ww [data-act=zurueck]'); if(await p.locator('.ww [data-act=zurueck]').count()) await p.locator('.ww [data-act=zurueck]').click(); await p.locator('.ww [data-act=liste][data-id=wg]').click(); await p.locator('.ww-k[data-n=Ben]').click(); await foto(p,s.bild,()=>p.locator('.ww [data-act=kamera]').click());
  await warte(p,'.ww [data-act=klasse][data-k="4"]'); await p.locator('.ww [data-act=klasse][data-k="4"]').click(); await warte(p,'.ww-foto'); await ohneSterne(p); await p.waitForFunction(()=>S.works.length===1); await p.evaluate(()=>swSync()); await p.waitForFunction(()=>S.works[0].sync==='geteilt'); t.pruefe(s.werke[0].klasse===4&&s.werke[0].name==='Ben','Klasse aus den Kacheln');
  await p.evaluate(()=>{ S.works=[]; SW.verb=null; kinderSetzen([]); S.settings.klasse=0; takePhoto('wl-fingerstricken'); }); await p.locator('.ww-k[data-n=Ben]').click(); await foto(p,s.bild,()=>p.locator('.ww [data-act=kamera]').click()); await p.waitForFunction(()=>S.works.length===1); await werkeAuf(p); await warte(p,'.sw-z.geraet'); t.pruefe((await zustand(p))==='📱 Gerät','Ohne Sammlung und Klasse'); t.pruefe(await p.evaluate(()=>S.works[0].name==='Ben'&&!S.works[0].klasse&&!S.works[0].sync),'Bleibt hier'); t.keineFehler(k); };

/* Während der Umstellung: alter Worker liefert eine Zahl, neue Antwort null. Beides läuft. */
const alteAntwort=async t=>{ const {s,k,p}=await anGeraet(t); s.alteAntwort=true; s.werke.push({id:'alt',videoId:VIDEO,titel:'Alt',name:'Lea',klasse:3,sterne:3,erstellt:1},{id:'neu',videoId:VIDEO,titel:'Neu',name:'Tim',klasse:3,sterne:null,erstellt:2}); s.version++;
  await werkeAuf(p); await p.evaluate(()=>swSync()); await p.waitForFunction(()=>document.querySelectorAll('.foto').length===2); t.pruefe((await p.locator('.foto .st').allTextContents()).join()==='★,★★★','Alte Antwort'); s.alteAntwort=false; s.version++; await p.evaluate(()=>swSync()); await p.waitForFunction(()=>document.querySelectorAll('.foto .st').length===1); t.pruefe(await p.locator('.foto .st').textContent()==='★★★','Neue Antwort'); t.keineFehler(k); };

module.exports=[{name:'Foto ohne Sterne',lauf:fotoOhneSterne},{name:'Foto mehrere Namen',lauf:mehrereNamen},{name:'Foto zweites iPad',lauf:zweitesIpad},{name:'Fotoübertragung mit Fehler und Wiederholen',lauf:fehler},{name:'Foto bleibt auf dem Gerät',lauf:aufDemGeraet},{name:'Foto ohne Klasse',lauf:klasseFehlt},{name:'Foto alte Antwort',lauf:alteAntwort}];
