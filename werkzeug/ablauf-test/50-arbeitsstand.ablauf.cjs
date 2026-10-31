/* Punkt 3: Arbeit je Kind. Gerät, gewählte Kinder und Arbeit bleiben getrennt, auch nach Neuladen. */
'use strict';
const {ANLEITUNG,VIDEO,sammlung,anbinden,speicher,ipad,kinderWahl,karteWeg,schritte,oeffne,stand,gespeichert,neuLaden}=require('./schule-netz.cjs');
const MIA='3a/Mia', NOAH='3a/Noah', FERTIG='raketenstation-2';
const chip=p=>p.locator('[data-wer]').first().textContent();
const kindWert=p=>p.evaluate(()=>localStorage.getItem('schrittli.kind'));

const kinderwechsel=async t=>{ const {k,p}=await ipad(t);
  await kinderWahl(p,['Mia']); t.pruefe((await chip(p)).includes('Mia'),'Chip Mia'); t.pruefe(await kindWert(p)===MIA,'schrittli.kind Mia');
  await oeffne(p); await p.waitForSelector('.an-start'); await schritte(p,3); t.pruefe((await stand(p,MIA)).step===2,'Mia Schritt 3');
  /* Noah übernimmt mitten in Mias Arbeit: leere Anleitung, kein Fremdstand */
  await kinderWahl(p,['Noah']); await p.waitForSelector('.an-start'); t.pruefe(await p.locator('.an-start .an-weiter').first().textContent()!=='','Start Noah'); t.pruefe(!/Schritt/.test(await p.locator('.an-start .an-weiter').first().textContent()),'Noah sieht Mias Stand');
  await schritte(p,2); t.pruefe((await stand(p,NOAH)).step===1,'Noah Schritt 2'); t.pruefe((await stand(p,MIA)).step===2,'Mia unverändert'); t.pruefe(await kindWert(p)===NOAH,'schrittli.kind Noah');
  /* Mia kommt zurück: Bildkarte, Zahl, Weiter */
  await kinderWahl(p,['Mia']); await p.waitForSelector('.ww-stand.eins'); t.pruefe(/^3\/\d+$/.test(await p.locator('.ww-karte .ww-z').textContent()),'Zahl bei Mia'); await p.locator('.ww-karte').click();
  await p.waitForSelector('.an-start .an-weiter'); t.pruefe(/Schritt 3/.test(await p.locator('.an-start .an-weiter').first().textContent()),'Weiter bei Schritt 3');
  /* Neuladen: das Gerät weiss noch, wer gewählt ist, und beide Stände sind da */
  await neuLaden(p); t.pruefe(await p.evaluate(()=>kinder().map(x=>x.name).join())==='Mia','Wahl nach Neuladen'); t.pruefe((await gespeichert(p,MIA)).step===2&&(await gespeichert(p,NOAH)).step===1,'Stände im Speicher');
  await oeffne(p); await p.waitForSelector('.an-start .an-weiter'); t.pruefe(/Schritt 3/.test(await p.locator('.an-start .an-weiter').first().textContent()),'Mia nach Neuladen');
  await kinderWahl(p,['Noah']); await p.waitForSelector('.ww-stand.eins'); t.pruefe(/^2\/\d+$/.test(await p.locator('.ww-karte .ww-z').textContent()),'Zahl bei Noah'); await p.locator('.ww-karte').click(); await p.waitForSelector('.an-start .an-weiter'); t.pruefe(/Schritt 2/.test(await p.locator('.an-start .an-weiter').first().textContent()),'Noah nach Neuladen');
  /* Gleicher Name, andere Klasse */
  await kinderWahl(p,['Mia'],'k4b'); t.pruefe(await kindWert(p)==='4b/Mia','Andere Klasse'); await p.waitForTimeout(80); t.pruefe(!await p.locator('.ww-stand').count(),'4b/Mia hat Mias Stand'); await p.waitForSelector('.an-start'); await schritte(p,2);
  t.pruefe((await stand(p,'4b/Mia')).step===1&&(await stand(p,MIA)).step===2,'Klassen vermischt'); t.keineFehler(k); };

const wiederaufnahme=async t=>{ const {k,p}=await ipad(t);
  await kinderWahl(p,['Mia']); await oeffne(p); await p.waitForSelector('.an-start'); await schritte(p,4);
  /* Zweites Projekt, ein altes dazu: kein Zeitablauf, und was fertig ist, zählt nicht */
  t.pruefe(await p.evaluate(([v,f])=>!!videoOf(v)&&!!videoOf(f),[VIDEO,FERTIG]),'Testprojekte');
  await p.evaluate(([v,mia,f])=>{ const o=prog(v); o.pos=95; o.step=2; o.zeit=Date.now()-400*864e5; S.arbeit[mia][f]=Object.assign(arbeitNeu(),{step:3,done:true,zeit:Date.now()}); saveJetzt(); },[VIDEO,MIA,FERTIG]);
  await neuLaden(p); await kinderWahl(p,['Noah']); await karteWeg(p); await kinderWahl(p,['Mia']); await p.waitForSelector('.ww-stand');
  t.pruefe(await p.locator('.ww-stand.eins').count()===0,'Zwei Karten'); t.pruefe(await p.locator('.ww-karte').count()===2,'Karten: '+await p.locator('.ww-karte').count());
  const zahlen=await p.locator('.ww-karte .ww-z').allTextContents(); t.pruefe(/^4\/\d+$/.test(zahlen[0]),'Neustes zuerst: '+zahlen); t.pruefe(/^3\/\d+$/.test(zahlen[1]),'Video: '+zahlen);
  t.pruefe(await p.locator('.ww-karte img').first().evaluate(i=>!!i.getAttribute('src')),'Vorschau fehlt');
  await p.locator('.ww-karte').nth(1).click(); await p.waitForFunction(v=>view.name==='player'&&view.params.videoId===v,VIDEO);
  /* Familie bleibt, wie sie war */
  const f=await t.kontext(), q=await t.app(f,'familie'); await q.evaluate(a=>{ const o=prog(a); o.step=2; o.pos=30; saveJetzt(); },VIDEO); await q.reload(); await q.waitForFunction(()=>typeof view!=='undefined'&&view.name&&view.name!=='boot');
  t.pruefe(await q.evaluate(a=>{ const r=JSON.parse(localStorage.getItem('schrittli.v1')); return r.progress['p1:'+a].step===2&&!Object.keys(r.arbeit||{}).length&&localStorage.getItem('schrittli.kind')===null; },VIDEO),'Familie'); t.keineFehler(k); t.keineFehler(f); };

const gruppe=async t=>{ const {k,p}=await ipad(t);
  await kinderWahl(p,['Mia','Noah','Lea']); t.pruefe(/Mia \+2/.test(await chip(p)),'Chip Gruppe'); t.pruefe(await kindWert(p)===MIA,'Erstes Kind für Werkzeuge');
  await oeffne(p); await p.waitForSelector('.an-start'); await schritte(p,3);
  for(const n of [MIA,NOAH,'3a/Lea']) t.pruefe((await stand(p,n)||{}).step===2,'Gruppe: '+n);
  await neuLaden(p); await kinderWahl(p,['Noah']); await p.waitForSelector('.ww-stand.eins'); await p.locator('.ww-karte').click(); await p.waitForSelector('.an-start .an-weiter'); await p.locator('.an-start .an-weiter').first().click(); await schritte(p,5);
  t.pruefe((await stand(p,NOAH)).step===4,'Noah allein'); t.pruefe((await stand(p,MIA)).step===2,'Mia läuft mit'); t.pruefe((await stand(p,'3a/Lea')).step===2,'Lea läuft mit');
  /* Ohne Neuladen dazwischen: Objekte sind getrennt */
  await kinderWahl(p,['Mia','Lea']); await p.waitForSelector('.ww-stand'); await p.locator('.ww-karte').click(); await p.waitForSelector('.an-start .an-weiter'); await p.locator('.an-start .an-weiter').first().click(); await kinderWahl(p,['Lea']); await p.waitForSelector('.ww-stand'); await p.locator('.ww-karte').click(); await p.waitForSelector('.an-start .an-weiter'); await p.locator('.an-start .an-weiter').first().click(); await schritte(p,6);
  t.pruefe((await stand(p,'3a/Lea')).step===5&&(await stand(p,MIA)).step===2,'Getrennte Stände'); t.keineFehler(k); };

const ohneName=async t=>{ const {k,p}=await ipad(t);
  await p.locator('[data-wer]').first().click(); await p.waitForSelector('.ww-raster'); await p.locator('.ww [data-act=liste][data-id=k3a]').click(); await p.locator('.ww [data-act=ohne]').click(); await p.waitForFunction(()=>!document.querySelector('.ww'));
  t.pruefe((await chip(p)).includes('Ohne Name'),'Chip Ohne Name'); t.pruefe(await kindWert(p)==='','schrittli.kind leer'); await oeffne(p); await p.waitForSelector('.an-start'); await schritte(p,2); t.pruefe((await stand(p,'_ohne')).step===1,'Ohne Name');
  await kinderWahl(p,['Mia']); await p.waitForTimeout(80); t.pruefe(!await p.locator('.ww-stand').count(),'Mia sieht Ohne Name'); t.pruefe(!(await stand(p,MIA)||{}).step,'Mia vermischt');
  await p.locator('[data-wer]').first().click(); await p.waitForSelector('.ww-raster'); await p.locator('.ww [data-act=ohne]').click(); await p.waitForSelector('.ww-stand.eins'); await p.locator('.ww-karte').click(); await p.waitForSelector('.an-start .an-weiter'); t.pruefe(/Schritt 2/.test(await p.locator('.an-start .an-weiter').first().textContent()),'Ohne Name zurück'); t.keineFehler(k); };

const migration=async t=>{ const alt=JSON.stringify({v:1,profiles:[{id:'klasse'}],activeProfile:'klasse',progress:{[`klasse:${ANLEITUNG}`]:{pos:0,step:3,done:false,slow:false}},stars:{},works:[{id:'w1',profileId:'klasse',type:'foto',createdAt:1,name:'MIA',klasse:3}],settings:{sv:3,klasse:3,kind:{liste:'k3a',name:'Mia'}}});
  const {k,p}=await ipad(t,{mehr:{'schrittli.schule.v1':alt}});
  t.pruefe(await p.evaluate(a=>S.settings.sv===5&&S.settings.kind===undefined&&S.settings.kinder[0].name==='Mia'&&S.arbeit._ohne[a].step===3&&Array.isArray(S.arbeit._ohne[a].erledigt)&&S.works.length===1,ANLEITUNG),'Alter Stand'); t.pruefe(await p.evaluate(()=>kinder()[0].key==='3a/Mia'&&localStorage.getItem('schrittli.kind')==='3a/Mia'),'Kind übernommen');
  await p.waitForTimeout(160); await neuLaden(p); t.pruefe(await p.evaluate(a=>S.arbeit._ohne[a].step===3&&!S.arbeit['3a/Mia'],ANLEITUNG),'Einmalig'); t.keineFehler(k); };

/* Werkzeuge schreiben über Planer.speicher: jeder Stand beim richtigen Kind, Gruppen auf alle, die Karte führt zum Werkzeug */
const werkzeuge=async t=>{ const {k,p}=await ipad(t); const SCHL='schrittli.falten.v1';
  await kinderWahl(p,['Mia','Noah']);
  const s=await k.seite('/vorlagen/falten/'); await s.waitForFunction(()=>window.Planer&&Planer.speicher); t.pruefe(await s.evaluate(n=>Planer.speicher(n).schluessel,SCHL)===`${SCHL}.kind.3a/Mia`,'Schlüssel Mia');
  await s.evaluate(n=>Planer.speicher(n).schreibe({probe:'gruppe'}),SCHL); await s.close(); await p.evaluate(()=>{ entwuerfeSpiegeln(); });
  t.pruefe(await p.evaluate(n=>JSON.parse(localStorage.getItem(n+'.kind.3a/Noah')).probe==='gruppe',SCHL),'Gruppe gespiegelt');
  await kinderWahl(p,['Noah']); await p.waitForSelector('.ww-stand.eins'); t.pruefe(await p.locator('a.ww-karte').count()===1,'Werkzeugkarte'); await p.locator('.ww [data-act=zu]').click();
  await kinderWahl(p,['Tim']); await p.waitForTimeout(80); t.pruefe(!await p.locator('.ww-stand').count(),'Tim hat Noahs Entwurf'); t.keineFehler(k); };

/* Echter Start ohne gewähltes Kind: Namensschirm, Kachel, Stand, Weiter. Mit Liste im Speicher sofort, ohne Liste nach dem Laden aus dem Netz. */
const gespeicherterStand=JSON.stringify({v:1,settings:{sv:4,klasse:3,kinder:[]},arbeit:{[MIA]:{[ANLEITUNG]:{pos:0,step:2,max:2,done:false,slow:false,erledigt:[],material:{},entwuerfe:{},zeit:1000}}}});
const start=async(t,mitListe)=>{ const s=sammlung(), v=speicher(s,{'schrittli.schule.v1':gespeicherterStand}); if(!mitListe) delete v['schrittli.schule.klassenlisten']; const k=await t.kontext({speicher:v}); await anbinden(k,s);
  const p=await k.seite('/schule/'); await p.waitForFunction(()=>typeof view!=='undefined'&&view.name==='wer'); await p.waitForSelector('.ww-raster'); t.pruefe(await p.evaluate(()=>!kinder().length),'Niemand vorgewählt');
  await p.locator('.ww-raster [data-act=liste][data-id=k3a]').click(); await p.locator('.ww-k[data-n=Mia]').click(); await p.locator('[data-act=ok]').click(); await p.waitForSelector('.ww-stand.eins'); t.pruefe(/^3\/\d+$/.test(await p.locator('.ww-karte .ww-z').textContent()),'Zahl beim Start');
  await p.locator('.ww-karte').click(); await p.waitForSelector('.an-start .an-weiter'); t.pruefe(/Schritt 3/.test(await p.locator('.an-start .an-weiter').first().textContent()),'Weiter beim Start'); t.pruefe(await kindWert(p)===MIA,'schrittli.kind beim Start'); t.keineFehler(k); };

/* Der Lektionsplan gehört dem Gerät: Kinderwechsel und Neuladen ändern ihn nicht, und er landet nicht in der Kinderarbeit */
const lektionsplan=async t=>{ const {k,p}=await ipad(t); const plan=()=>p.evaluate(a=>JSON.stringify(planVon(a)),ANLEITUNG);
  await kinderWahl(p,['Mia']); await p.evaluate(a=>{ U.verb={token:'b'.repeat(64),deviceId:'d'}; U.policy={mode:'projects',plan:true}; U.deadline=Date.now()+6e4; planMelden=()=>{}; planSetzen(a,0,true); U.verb=null; U.policy=null; saveJetzt(); },ANLEITUNG).catch(e=>{ throw new Error('Plan setzen: '+e.message); }); const vorher=await plan(); t.pruefe(JSON.parse(vorher).s[0]===true,'Plan gesetzt');
  await oeffne(p); await p.waitForSelector('.an-start'); await schritte(p,2); await p.evaluate(()=>go('home')); await kinderWahl(p,['Noah']); t.pruefe(await plan()===vorher,'Wechsel ändert Plan');
  await neuLaden(p); t.pruefe(await plan()===vorher,'Neuladen ändert Plan'); t.pruefe(await p.evaluate(()=>!/lektionsplan/.test(JSON.stringify(S.arbeit))),'Plan in der Kinderarbeit');
  await oeffne(p); await p.waitForSelector('.an-start'); await schritte(p,2); t.pruefe((await stand(p,NOAH)).step===1&&await plan()===vorher,'Arbeit ändert Plan'); t.keineFehler(k); };

/* Maschenprobe: Name aus settings.kinder, altes settings.kind bis zur Migration, Entwürfe unverändert */
const maschen=async(k,vorher)=>{ const m=await k.seite('/vorlagen/maschenprobe/'); await m.waitForFunction(()=>typeof kindName==='function'); if(vorher){ await m.evaluate(vorher); await m.reload(); await m.waitForFunction(()=>typeof kindName==='function'); } const r=await m.evaluate(()=>({name:S.name,kind:kindName()})); await m.close(); return r; };
const maschenName=async t=>{ const {k,p}=await ipad(t); await kinderWahl(p,['Mia']); await p.evaluate(()=>saveJetzt());
  const mia=await maschen(k); t.pruefe(mia.kind==='Mia'&&mia.name==='Mia','Mia: '+JSON.stringify(mia));
  await kinderWahl(p,['Noah']); await p.evaluate(()=>{ localStorage.setItem('schrittli.maschenprobe.v1.kind.'+localStorage.getItem('schrittli.kind'),JSON.stringify({name:'Eigen',maschen:20})); saveJetzt(); });
  const noah=await maschen(k); t.pruefe(noah.kind==='Noah'&&noah.name==='Eigen','Entwurf: '+JSON.stringify(noah));
  await p.close();
  const alt=await maschen(k,()=>{ const s=JSON.parse(localStorage.getItem('schrittli.schule.v1')); delete s.settings.kinder; s.settings.kind={liste:'k3a',name:'Lea'}; localStorage.setItem('schrittli.schule.v1',JSON.stringify(s)); }); t.pruefe(alt.kind==='Lea','Altstand: '+JSON.stringify(alt));
  const leer=await maschen(k,()=>{ const s=JSON.parse(localStorage.getItem('schrittli.schule.v1')); delete s.settings.kind; localStorage.setItem('schrittli.schule.v1',JSON.stringify(s)); }); t.pruefe(leer.kind==='','Ohne Feld: '+JSON.stringify(leer));
  const fam=await maschen(k,()=>{ const s=JSON.parse(localStorage.getItem('schrittli.schule.v1')); s.settings.kinder=[{name:'Mia'}]; localStorage.setItem('schrittli.schule.v1',JSON.stringify(s)); localStorage.setItem('schrittli.app','familie'); }); t.pruefe(fam.kind==='','Familie: '+JSON.stringify(fam)); };

module.exports=[{name:'Kinderwechsel',lauf:kinderwechsel},{name:'Start mit Namensliste',lauf:t=>start(t,true)},{name:'Start ohne Namensliste',lauf:t=>start(t,false)},{name:'Lektionsplan bleibt',lauf:lektionsplan},{name:'Wiederaufnahme',lauf:wiederaufnahme},{name:'Gruppe am iPad',lauf:gruppe},{name:'Ohne Name',lauf:ohneName},{name:'Migration Arbeitsstand',lauf:migration},{name:'Maschenprobe Name',lauf:maschenName},{name:'Werkzeugstand je Kind',lauf:werkzeuge}];
