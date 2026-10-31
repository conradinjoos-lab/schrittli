/* Fingerstricken: unter Stricken ab der 2. Klasse, jünger nicht. Alle Schritte lassen sich öffnen, jedes Bild lädt, das Ende wird erreicht.
 * ABLAUF_BILDER=<Ordner> legt Bildschirmfotos dort ab. */
'use strict';
const path=require('node:path');
const {ipad,kinderWahl,schritte,neuLaden}=require('./schule-netz.cjs');
const ID='fingerstricken', THEMA='stricken', BILDER=[1,1,1,1,1,2,1,1,2,1,1];

const foto=async(p,name)=>{ const d=process.env.ABLAUF_BILDER; if(!d) return; await p.waitForTimeout(350); await p.screenshot({path:path.join(d,name+'.png')}); };
const klasse=(p,k)=>p.evaluate(k=>{ S.settings.klasse=k; save(); go('area',{id:'stricken'}); },k);
const sichtbar=async(p,t,k,soll)=>{ await klasse(p,k); await p.waitForSelector('#liste .v3-lektion'); const n=await p.locator(`[data-act=video][data-id="${ID}"]`).count(); t.pruefe(!!n===soll,`Klasse ${k}: ${soll?'fehlt':'zu sehen'}`); };
const bilderOk=p=>p.evaluate(async()=>{ const l=[...document.querySelectorAll('#app img')]; await Promise.all(l.map(i=>i.complete?0:new Promise(r=>{ i.onload=i.onerror=r; }))); return l.length>0&&l.every(i=>i.naturalWidth>0&&!i.dataset.ersatz); });

const freigabe=async t=>{ const k=await t.kontext(); const p=await t.app(k,'schule');
  await sichtbar(p,t,1,false);
  for(const s of [2,3,4,5,6]) await sichtbar(p,t,s,true);
  t.pruefe(await p.evaluate(id=>{ const v=videoOf(id); return v.gruppe==='Fingerstricken'&&v.areaId==='stricken'&&v.source.type==='bilder'; },ID),'Thema und Projektart');
  t.keineFehler(k); };

const durchgehen=async t=>{ const {k,p}=await ipad(t); await p.evaluate(()=>{ S.settings.klasse=2; save(); }); await kinderWahl(p,['Mia']);
  await p.evaluate(a=>go('area',{id:a}),THEMA); await p.waitForSelector('#liste .v3-lektion'); await foto(p,'fs-thema');
  await p.locator(`[data-act=video][data-id="${ID}"]`).first().click(); await p.waitForSelector(`.pj[data-projekt="${ID}"]`);
  t.pruefe(await bilderOk(p),'Titelbild'); await foto(p,'fs-projekt');
  t.pruefe(JSON.stringify(await p.$$eval('.pj-mat .mk',l=>l.map(e=>e.dataset.id)))==='["wolle","schere"]','Material');
  for(const m of ['wolle','schere']) await p.locator(`.mk[data-id="${m}"]`).click();
  await p.locator('.pj-start').click(); await p.waitForFunction(()=>view.name==='player'); await p.waitForSelector('.an-weiter');
  for(let i=1;i<=BILDER.length;i++){ await schritte(p,i); t.pruefe(await p.locator('.an-bilder img').count()===BILDER[i-1],`Bilder in Schritt ${i}`); t.pruefe(await bilderOk(p),`Bild Schritt ${i}`); await foto(p,`fs-schritt-${i}`); }
  await p.locator('.an-nav .an-weiter').click(); await p.waitForSelector('.an-ende'); t.pruefe(/Strickschnur/.test(await p.locator('.an-ende').textContent()),'Ende'); await foto(p,'fs-ende');
  t.keineFehler(k); };

/* Der Weg über den Stand: mitten im Projekt neu laden, derselbe Schritt ist wieder da */
const stand=async t=>{ const {k,p}=await ipad(t); await kinderWahl(p,['Mia']); await p.evaluate(id=>{ const v=videoOf(id); matListe(v).forEach(m=>matSetzen(v,m,true)); go('player',{videoId:id}); },ID); await p.waitForSelector('.an-weiter');
  await schritte(p,6); t.pruefe(await p.locator('.an-bilder img').count()===2,'Schritt 6 zeigt zwei Bilder'); await neuLaden(p);
  t.pruefe(await p.evaluate(id=>S.arbeit['3a/Mia'][id].step,ID)>=5,'Stand nach Neuladen'); t.keineFehler(k); };

module.exports=[{name:'Fingerstricken Freigabe',lauf:freigabe},{name:'Fingerstricken Schritte',lauf:durchgehen},{name:'Fingerstricken Stand',lauf:stand}];
