/* Punkt 7 und 8: Filter, Lupe, Rückkehr an dieselbe Stelle, Zeit als Spanne */
'use strict';
const treffer=p=>p.$$eval('#liste .v3-lektion[data-act=video]',l=>l.map(e=>e.dataset.id));
const nah=(a,b)=>Math.abs(a-b)<=3;
const zeile=async(p,nr)=>{ const b=p.locator('#liste .v3-lektion[data-act=video]').nth(nr); await b.evaluate(e=>e.scrollIntoView({block:'center'})); await p.waitForTimeout(60); const y=await p.evaluate(()=>Math.round(scrollY)); return {b,y,id:await b.getAttribute('data-id')}; };

const papierFinden=async t=>{ const k=await t.kontext({breite:1024,hoehe:768}); const p=await t.app(k,'schule');
  /* Drei Entscheide: Lupe, Papier, Projekt */
  await p.locator('[data-act=suche]').first().click(); await p.waitForSelector('#vf .vf-mat[data-v=papier]'); await p.locator('#vf .vf-mat[data-v=papier]').click(); await p.waitForSelector('.vf-mat.an[data-v=papier]');
  let ids=await treffer(p); t.pruefe(ids.length>8,'Papierprojekte da'); t.pruefe(await p.evaluate(ids=>ids.every(i=>{ const v=videoOf(i); return matListe(v).includes('papier')&&fuerKlasse(v); }),ids),'Nur Papier der eigenen Klasse');
  const klasse1=await p.evaluate(()=>{ const k=S.settings.klasse; S.settings.klasse=1; const n=filterWahl(S.videos.filter(v=>fuerKlasse(v)),{mat:'papier'}).map(v=>v.id); S.settings.klasse=k; return n; }); t.pruefe(JSON.stringify(klasse1.slice().sort())!==JSON.stringify(ids.slice().sort()),'Klasse wirkt');
  const {b,y,id}=await zeile(p,Math.min(7,ids.length-1)); t.pruefe(y>0,'Liste scrollt'); await b.click(); await p.waitForSelector(`.pj[data-projekt="${id}"]`);
  await p.locator('.pj [data-act=back]').click(); await p.waitForSelector('.vf-mat.an[data-v=papier]'); await t.warte(120); t.pruefe(JSON.stringify(await treffer(p))===JSON.stringify(ids),'App-Zurück: dieselben Treffer'); t.pruefe(nah(await p.evaluate(()=>scrollY),y),'App-Zurück: dieselbe Höhe');
  await p.locator(`#liste [data-id="${id}"]`).first().click(); await p.waitForSelector(`.pj[data-projekt="${id}"]`); await p.goBack(); await p.waitForSelector('.vf-mat.an[data-v=papier]'); await t.warte(120); t.pruefe(nah(await p.evaluate(()=>scrollY),y),'Browser-Zurück: dieselbe Höhe');
  await p.reload({waitUntil:'load'}); await p.waitForSelector('.vf-mat.an[data-v=papier]'); await t.warte(150); t.pruefe(nah(await p.evaluate(()=>scrollY),y),'Neuladen: dieselbe Höhe'); t.keineFehler(k); };

const lupeUndLeer=async t=>{ const k=await t.kontext(); const p=await t.app(k,'schule'); await p.evaluate(()=>go('suche')); await p.waitForSelector('#vf-q');
  const finde=async(wort,pruef,name)=>{ await p.fill('#vf-q',wort); await t.warte(60); const ids=await treffer(p); t.pruefe(ids.length&&await p.evaluate(([ids,s])=>ids.some(i=>new Function('v','return '+s)(videoOf(i))),[ids,pruef]),name); };
  await finde('kartoffel',"/Kartoffel/i.test(v.title)",'Suche im Titel'); const tech=await p.evaluate(()=>S.videos.filter(v=>fuerKlasse(v)).flatMap(v=>v.techniken||[])[0]); if(tech) await finde(tech,`(v.techniken||[]).includes(${JSON.stringify(tech)})`,'Suche in der Technik'); await finde('schere',"matListe(v).includes('schere')",'Suche im Material');
  await p.fill('#vf-q','qqqqqq'); await p.waitForSelector('.vf-leer .vf-alle'); t.pruefe(/qqqqqq/.test(await p.locator('.vf-leer .vf-chips').textContent()),'Leer zeigt den Filter'); await p.locator('.vf-alle').click(); await p.waitForSelector('#liste .v3-lektion'); t.pruefe(await p.inputValue('#vf-q')==='','Rückweg leert den Filter');
  t.pruefe(await p.evaluate(()=>!filterWahl([{title:'x',niveau:1,material:[]}],{zeit:15}).length),'Ohne Zeit nie passend'); t.keineFehler(k); };

const freieProjekte=async t=>{ const k=await t.kontext(); const p=await t.app(k,'schule'); const a=await p.evaluate(()=>{ const a=S.areas.find(a=>videosIn(a.id).length>5); go('area',{id:a.id}); return a.id; }); await p.waitForSelector('#liste .v3-lektion');
  const nr=await p.$$eval('#liste .v3-lektion .v3-badge',l=>l.map(e=>e.textContent.trim())); t.pruefe(!nr.some(x=>/^\d+$/.test(x)),'Keine Nummern'); t.pruefe(await p.locator('#liste .v3-lektion .th').count()>0,'Ergebnisbild'); t.pruefe(await p.locator('#liste .v3-lektion .niv').count()>0,'Schwierigkeit');
  const v=await p.evaluate(a=>videosIn(a)[0].id,a); await p.evaluate(id=>{ prog(id).step=1; prog(id).max=1; save(); render(); },v); await p.waitForSelector('#liste .v3-badge.lauf'); t.pruefe(/\d+\/\d+/.test(await p.locator('#liste .v3-badge.lauf').first().textContent()),'Fortschritt');
  await p.locator('#vf [data-k=niv]').first().click(); await p.waitForSelector('#vf .vf.an'); await p.locator('.vf-lupe').click(); await p.waitForSelector('#vf-q:not([hidden])'); await p.fill('#vf-q','qqqqqq'); await p.waitForSelector('.vf-alle'); await p.locator('.vf-alle').click(); await p.waitForSelector('#liste .v3-niv'); t.keineFehler(k); };

/* Testdaten nur im Speicher der Seite: die Zeitwerte in schule.json bleiben unverändert */
const zeitSpanne=async t=>{ const k=await t.kontext(); const p=await t.app(k,'schule'); const ids=await p.evaluate(()=>{ const vs=S.videos.filter(v=>fuerKlasse(v)&&v.source.type==='youtube'); vs.forEach(v=>{ delete v.zeit; delete v.trocknen; }); const [a,b,c,d,e,f]=vs; a.zeit=[10,15]; a.niveau=2; b.zeit=[10,20]; b.niveau=1; c.zeit=15; c.niveau=3; d.zeit=[5,10]; d.niveau=1; e.zeit=10; e.niveau=2; e.trocknen=30; f.niveau=1; return [a,b,c,d,e,f].map(v=>v.id); });
  const [a,b,c,d,e,f]=ids; await p.evaluate(()=>go('restzeit',{min:15})); await p.waitForSelector('.rz-zeile');
  const zeilen=await p.$$eval('.rz-zeile',l=>l.map(z=>({id:z.dataset.id,passt:z.dataset.passt,text:z.textContent}))); t.pruefe(JSON.stringify(zeilen.map(z=>z.id))===JSON.stringify([d,a,c,b,e]),'Sortierung '+zeilen.map(z=>z.id+':'+z.passt).join(' '));
  t.pruefe(zeilen.map(z=>z.passt).join()==='sicher,sicher,sicher,knapp,knapp','Sicher zuerst'); t.pruefe(/10–15\s*min/.test(zeilen[1].text),'Spanne'); t.pruefe(/10–20\s*min/.test(zeilen[3].text),'Lange Spanne'); t.pruefe(zeilen[4].text.includes('⏳'),'Trocknen'); t.pruefe(!zeilen.some(z=>z.id===f),'Ohne Zeit nicht geraten');
  t.pruefe(zeilen.every(z=>!/\d+:\d\d/.test(z.text)),'Kein Countdown'); t.pruefe(await p.evaluate(()=>!document.body.innerText.includes('Minuten')),'Uhr statt Text');
  await p.evaluate(()=>go('restzeit',{min:5})); await p.waitForFunction(()=>view.params.min===5); await t.warte(40); const z5=await p.$$eval('.rz-zeile',l=>l.map(z=>z.dataset.id+':'+z.dataset.passt)); t.pruefe(JSON.stringify(z5)===JSON.stringify([d+':knapp']),'Fünf Minuten '+z5.join());
  t.pruefe(await p.evaluate(([f,e])=>{ const w=filterWahl(S.videos.filter(v=>fuerKlasse(v)),{zeit:10}).map(v=>v.id); return !w.includes(f)&&w.includes(e); },[f,e]),'Filter Zeit');
  await p.evaluate(id=>go('projekt',{videoId:id}),a); await p.waitForSelector('.pj-fakten .zt'); t.pruefe((await p.locator('.pj-fakten .zt').first().textContent()).includes('10–15 min')&&(await p.locator('.pj-fakten .zt').first().textContent()).includes('⏱'),'Uhr im Projekt');
  await p.evaluate(id=>go('projekt',{videoId:id}),f); await p.waitForSelector(`.pj[data-projekt="${f}"]`); t.pruefe(!await p.locator('.pj-fakten .zt').count(),'Keine Zeit, kein Symbol'); t.keineFehler(k); };

module.exports=[{name:'Papier finden',lauf:papierFinden},{name:'Lupe und leere Auswahl',lauf:lupeUndLeer},{name:'Freie Projekte',lauf:freieProjekte},{name:'Zeit-Spanne',lauf:zeitSpanne}];
