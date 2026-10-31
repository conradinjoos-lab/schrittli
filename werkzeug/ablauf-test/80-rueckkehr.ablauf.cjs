/* Punkt 13: Verlauf in der App und Rückkehr aus den Werkzeugen an die Stelle, von der man kam */
'use strict';
const {ipad,kinderWahl,neuLaden,schritte,oeffne,ANLEITUNG}=require('./schule-netz.cjs');
const PROJEKT='wl-armband-karton';
const appDa=p=>p.waitForFunction(()=>typeof view!=='undefined'&&view.name&&view.name!=='boot'&&typeof contentInfo!=='undefined'&&contentInfo);
const haken=async(p,id=PROJEKT)=>{ await p.evaluate(id=>{ const v=videoOf(id); matSetzen(v,matListe(v)[0],true); go('projekt',{videoId:id}); },id); await p.waitForSelector('.pj .an-box.vorlage a'); };
const zurVorlage=async(k,p)=>{ const seiten=k.c.pages().length; await p.locator('.an-box.vorlage a').first().click(); await p.waitForURL(/\/vorlagen\//); t_gleicheSeite(k,seiten); await p.waitForSelector('#b'); };
let t_gleicheSeite=()=>{};
const anpassen=async p=>{ await p.fill('#n','3'); await p.dispatchEvent('#n','input'); await p.waitForTimeout(350); };
const projektDa=async(t,p,id=PROJEKT)=>{ await appDa(p); await p.waitForSelector(`.pj[data-projekt="${id}"]`); t.pruefe(await p.evaluate(id=>view.name==='projekt'&&view.params.videoId===id,id),'Projekt zurück'); t.pruefe(await p.locator('.pj-mat .mk.da').count()===1,'Haken noch da'); };

const werkzeugrueckkehr=async t=>{ t_gleicheSeite=(k,n)=>t.pruefe(k.c.pages().length===n,'Neuer Tab'); const k=await t.kontext(); const p=await t.app(k,'schule');
  /* App-Zurück */
  await haken(p); await zurVorlage(k,p); await anpassen(p); await p.locator('[data-zur-app]').first().click(); await projektDa(t,p);
  /* Neuladen in der Vorlage, dann App-Zurück */
  await zurVorlage(k,p); await anpassen(p); await p.reload({waitUntil:'load'}); await p.waitForSelector('#b'); await p.locator('[data-zur-app]').first().click(); await projektDa(t,p);
  /* Browser-Zurück */
  await zurVorlage(k,p); await anpassen(p); await p.goBack(); await projektDa(t,p);
  /* Danach gilt der Pfeil im Projekt weiter */
  await p.locator('.pj [data-act=back]').click(); await p.waitForFunction(()=>['home','raum'].includes(view.name)); t.keineFehler(k); };

/* Umweg über die Vorlagenliste: kein Referrer aus der App mehr, die Ansicht kommt aus sessionStorage */
const umweg=async t=>{ t_gleicheSeite=()=>{}; const k=await t.kontext(); const p=await t.app(k,'schule'); await haken(p); await zurVorlage(k,p); await p.evaluate(()=>{ location.href='falten/'; }); await p.waitForURL(/vorlagen\/falten/); await p.waitForSelector('[data-zur-app]'); await p.locator('[data-zur-app]').first().click(); await projektDa(t,p); t.keineFehler(k); };

/* Vom Schritt einer Anleitung ins Werkzeug und zurück auf denselben Schritt */
const schrittZurueck=async t=>{ t_gleicheSeite=()=>{}; const {k,p}=await ipad(t); await kinderWahl(p,['Mia']); await oeffne(p); await p.waitForSelector('.an-start'); await schritte(p,4); const i=()=>p.evaluate(()=>view.params.stelle); const vorher=await i(); t.pruefe(vorher>0,'Stelle in der Ansicht');
  await p.evaluate(()=>navMerken()); await neuLaden(p); await p.waitForFunction(()=>view.name==='player'); await t.warte(150); t.pruefe(await i()===vorher,'Neuladen: gleicher Schritt');
  await p.evaluate(()=>{ const a=document.createElement('a'); a.href=VORL_BASE+'?form=herz&b=6'; a.id='wegweiser'; a.textContent='x'; document.querySelector('#app').appendChild(a); }); await p.locator('#wegweiser').click(); await p.waitForURL(/\/vorlagen\//); await p.waitForSelector('#b'); await p.locator('[data-zur-app]').first().click(); await appDa(p); await p.waitForFunction(()=>view.name==='player'); await t.warte(150); t.pruefe(await i()===vorher,'Zurück auf denselben Schritt'); t.keineFehler(k); };

/* Verlauf innerhalb der App: gleicher Weg mit Pfeil und Browser, Tor-Ansichten bleiben draussen */
const verlauf=async t=>{ const k=await t.kontext(); const p=await t.app(k,'schule'); const a=await p.evaluate(()=>videosIn(videoOf('wl-armband-karton').areaId)[0].areaId);
  await p.evaluate(a=>go('area',{id:a}),a); await p.waitForSelector('#liste .v3-lektion'); await p.locator(`[data-act=video][data-id="${PROJEKT}"]`).first().click(); await p.waitForSelector('.pj');
  await p.goBack(); await p.waitForFunction(()=>view.name==='area'); await p.goForward(); await p.waitForFunction(()=>view.name==='projekt'); await p.locator('.pj [data-act=back]').click(); await p.waitForFunction(()=>view.name==='area'); await p.goForward().catch(()=>{}); await t.warte(80); t.pruefe(['projekt','area'].includes(await p.evaluate(()=>view.name)),'Vorwärts');
  t.pruefe(await p.evaluate(()=>!['boot','wer','klasse','firstrun','profiles'].includes((history.state||{}).name)),'Tor im Verlauf'); t.keineFehler(k); };

const familie=async t=>{ t_gleicheSeite=()=>{}; const k=await t.kontext(); const p=await t.app(k,'familie'); const id=await p.evaluate(()=>{ const v=S.videos.find(v=>v.vorlagen&&v.vorlagen.length&&v.vorlagen[0].datei[0]==='?'); if(v) go('player',{videoId:v.id}); return v&&v.id; }); if(!id) return; await p.waitForFunction(()=>view.name==='player'); await p.evaluate(()=>go('gallery')); await p.goBack(); await p.waitForFunction(()=>view.name==='player'); t.keineFehler(k); };

module.exports=[{name:'Werkzeugrückkehr',lauf:werkzeugrueckkehr},{name:'Werkzeugrückkehr Umweg',lauf:umweg},{name:'Werkzeugrückkehr Schritt',lauf:schrittZurueck},{name:'Verlauf in der App',lauf:verlauf},{name:'Verlauf Familie',lauf:familie}];
