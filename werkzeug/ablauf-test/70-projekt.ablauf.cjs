/* Punkt 2: erst Projekte, dann genau das zugehörige Material. Ein Haken gilt für Projektansicht, Lektionsplan und Karte vor dem Video gleich. */
'use strict';
const {ipad,kinderWahl,neuLaden}=require('./schule-netz.cjs');
const MIA='3a/Mia', NOAH='3a/Noah';

/* Wache im Browser: bei jeder DOM-Änderung und in jedem Bild prüfen, was gerade im Dokument steht */
const wache=p=>p.evaluate(()=>{ window.__falsch=[]; const pruef=wo=>{ const id=view.name==='projekt'?view.params.videoId:null, soll=id?matListe(videoOf(id)):[];
    document.querySelectorAll('[data-projekt]').forEach(e=>{ if(e.dataset.projekt!==id) __falsch.push(`${wo}: ${e.dataset.projekt} bei ${id}`); });
    document.querySelectorAll('.mk[data-id]').forEach(e=>{ if(!soll.includes(e.dataset.id)) __falsch.push(`${wo}: ${e.dataset.id} bei ${id}`); }); };
  new MutationObserver(()=>pruef('dom')).observe(document.body,{subtree:true,childList:true,attributes:true}); const takt=()=>{ pruef('bild'); requestAnimationFrame(takt); }; takt(); });
const zweiProjekte=p=>p.evaluate(()=>{ const vs=S.videos.filter(v=>fuerKlasse(v)&&matListe(v).length>1&&videosIn(v.areaId).includes(v)); for(const x of vs) for(const y of vs) if(x!==y&&x.areaId===y.areaId&&!matListe(x).some(m=>matListe(y).includes(m))) return [x,y].map(v=>({id:v.id,area:v.areaId,mat:matListe(v)})); return null; });
const einProjekt=(p,mehr='')=>p.evaluate(mehr=>{ const v=S.videos.find(v=>fuerKlasse(v)&&matListe(v).length>2&&v.source.type==='youtube'&&(!mehr||v.id===mehr)); return v&&{id:v.id,mat:matListe(v),area:v.areaId}; },mehr);
const mkIds=(p,wo='.pj-mat')=>p.$$eval(wo+' .mk',l=>l.map(e=>e.dataset.id));

const projektsprung=async t=>{ const k=await t.kontext(); const p=await t.app(k,'schule'); const paar=await zweiProjekte(p); t.pruefe(paar,'Zwei Projekte mit verschiedenem Material'); const [a,b]=paar;
  await p.evaluate(a=>go('area',{id:a}),a.area); await p.waitForSelector('#liste .v3-lektion'); t.pruefe(!await p.locator('.mk,.v3-mat,.pj-mat').count(),'Material vor der Wahl'); t.pruefe(!/Du brauchst/.test(await p.locator('#app').textContent()),'Du brauchst'); await wache(p);
  const wahl=async x=>{ await p.locator(`[data-act=video][data-id="${x.id}"]`).first().click(); await p.waitForSelector(`.pj[data-projekt="${x.id}"]`); t.pruefe(JSON.stringify(await mkIds(p))===JSON.stringify(x.mat),'Material von '+x.id); };
  await wahl(a); await p.locator('.pj [data-act=back]').click(); await p.waitForSelector('#liste .v3-lektion');
  await wahl(b); await p.goBack(); await p.waitForSelector('#liste .v3-lektion');
  await wahl(a); await p.evaluate(([x,y])=>{ go('projekt',{videoId:x}); go('projekt',{videoId:y}); },[b.id,a.id]); await t.warte(120); t.pruefe(JSON.stringify(await mkIds(p))===JSON.stringify(a.mat),'Nach schnellem Wechsel');
  await p.goBack(); await p.waitForSelector(`.pj[data-projekt="${b.id}"]`); await t.warte(120); t.pruefe(JSON.stringify(await mkIds(p))===JSON.stringify(b.mat),'Zurück auf das andere Projekt');
  const f=await p.evaluate(()=>__falsch); t.pruefe(!f.length,'Falsche Liste sichtbar: '+f.slice(0,3).join(' / ')); t.keineFehler(k); };

const haken=async t=>{ const {k,p}=await ipad(t); await kinderWahl(p,['Mia']); const v=await einProjekt(p); t.pruefe(v,'Projekt'); await p.evaluate(id=>go('projekt',{videoId:id}),v.id); await p.waitForSelector('.pj');
  const start=p.locator('.pj-start'); t.pruefe(await start.isDisabled(),'Start ohne Material'); t.pruefe((await p.locator('.pj-start .mk-luecke b').textContent())===await p.evaluate(m=>matName(m),v.mat[0]),'Fehlendes Stück am Knopf'); t.pruefe(await p.locator(`.mk[data-id="${v.mat[0]}"]`).evaluate(e=>e.classList.contains('naechst')),'Verbindung zum Materialstück');
  await p.locator(`.mk[data-id="${v.mat[0]}"]`).click(); t.pruefe(await p.locator(`.mk[data-id="${v.mat[0]}"]`).evaluate(e=>e.classList.contains('da')),'Haken'); t.pruefe(await p.evaluate(([k,i,m])=>S.arbeit[k][i].material[m]===true,[MIA,v.id,v.mat[0]]),'Material in der Arbeit'); t.pruefe((await p.locator('.pj-start .mk-luecke b').textContent())===await p.evaluate(m=>matName(m),v.mat[1]),'Nächstes Stück am Knopf');
  await p.locator(`.mk[data-id="${v.mat[0]}"]`).click(); t.pruefe(await start.isDisabled()&&!await p.evaluate(([k,i,m])=>S.arbeit[k][i].material[m],[MIA,v.id,v.mat[0]]),'Haken lösen');
  for(const m of v.mat) await p.locator(`.mk[data-id="${m}"]`).click(); t.pruefe(!await start.isDisabled()&&!await p.locator('.mk-luecke').count(),'Start frei');
  await neuLaden(p); await p.waitForSelector('.pj'); t.pruefe(await p.locator('.mk.da').count()===v.mat.length,'Haken nach Neuladen');
  await p.locator('.pj-start').click(); await p.waitForFunction(()=>view.name==='player'); await t.warte(250); t.pruefe(!await p.locator('.matkarte').count(),'Beim Start nochmals verlangt'); t.keineFehler(k); };

/* Karte vor dem Video: Haken dort gilt auch in der Projektansicht */
const karteVideo=async t=>{ const {k,p}=await ipad(t); await kinderWahl(p,['Mia']); const v=await einProjekt(p); await p.evaluate(id=>go('player',{videoId:id}),v.id); await p.waitForSelector('.matkarte .mk'); t.pruefe(JSON.stringify(await mkIds(p,'.matkarte'))===JSON.stringify(v.mat),'Karte zeigt das Material'); t.pruefe(await p.locator('.matkarte [data-matstart]').isDisabled(),'Weiter gesperrt');
  for(const m of v.mat) await p.locator(`.matkarte .mk[data-id="${m}"]`).click(); t.pruefe(!await p.locator('.matkarte [data-matstart]').isDisabled(),'Weiter frei');
  await p.evaluate(id=>go('projekt',{videoId:id}),v.id); await p.waitForSelector('.pj'); t.pruefe(await p.locator('.mk.da').count()===v.mat.length,'Projekt kennt die Haken'); t.keineFehler(k); };

/* Lektionsplan: drei Stationen, gleicher Korb wie im Projekt */
const lektionsplan=async t=>{ const {k,p}=await ipad(t); await kinderWahl(p,['Mia']); const v=await einProjekt(p); await p.evaluate(id=>{ U.verb={token:'b'.repeat(64),deviceId:'d'}; U.policy={mode:'projects',plan:true,ids:[id]}; U.deadline=Date.now()+6e4; planMelden=()=>{}; go('unterricht'); },v.id); await p.waitForSelector('.plan-karte');
  t.pruefe(await p.locator('.plan-station').count()===3,'Drei Stationen'); t.pruefe(await p.locator('.plan-station .plan-gross').count()===3,'Drei grosse Knöpfe');
  const spielen=p.locator('.plan-gross[data-matstart]'); t.pruefe(await spielen.isDisabled()&&await p.locator('.plan-gross[data-matstart] .mk-luecke').count()===1,'Abspielen zeigt das fehlende Stück');
  for(const m of v.mat) await p.locator(`.plan-korb .mk[data-id="${m}"]`).click(); t.pruefe(await p.evaluate(id=>!matFehlt(videoOf(id)).length&&planVon(id).s[0]===true,v.id),'Korb erledigt'); t.pruefe(!await spielen.isDisabled(),'Abspielen frei'); t.pruefe(await p.locator('.plan-station').first().evaluate(e=>e.classList.contains('erledigt')),'Station erledigt');
  await spielen.click(); await p.waitForFunction(()=>view.name==='player'); await t.warte(250); t.pruefe(!await p.locator('.matkarte').count(),'Lektionsplan und Karte getrennt'); t.keineFehler(k); };

const gruppe=async t=>{ const {k,p}=await ipad(t); await kinderWahl(p,['Mia','Noah']); const v=await einProjekt(p); await p.evaluate(id=>go('projekt',{videoId:id}),v.id); await p.waitForSelector('.pj');
  for(const m of v.mat) await p.locator(`.mk[data-id="${m}"]`).click(); t.pruefe(await p.evaluate(([a,b,i,n])=>[a,b].every(k=>Object.keys(S.arbeit[k][i].material).length===n),[MIA,NOAH,v.id,v.mat.length]),'Material für alle Kinder');
  await p.evaluate(()=>go('home')); await kinderWahl(p,['Noah']); await p.evaluate(id=>go('projekt',{videoId:id}),v.id); await p.waitForSelector('.pj'); t.pruefe(await p.locator('.mk.da').count()===v.mat.length,'Noah allein'); t.keineFehler(k); };

const altbestand=async t=>{ const alt=s=>JSON.stringify(s); const id='wl-fingerstricken', stand=alt({v:1,profiles:[{id:'klasse'}],activeProfile:'klasse',progress:{},stars:{},works:[],settings:{sv:4,klasse:3,lektionsplan:{[id]:{s:[true,false,false],mat:{wolle:true}}}},arbeit:{_ohne:{}}});
  const {k,p}=await ipad(t,{mehr:{'schrittli.schule.v1':stand}}); t.pruefe(await p.evaluate(i=>S.settings.sv===5&&planVon(i).mat===undefined&&planVon(i).s[0]===true,id),'Plan ohne Material'); t.pruefe(await p.evaluate(i=>S.arbeit._ohne[i].material.wolle===true,id),'Material übernommen'); t.keineFehler(k); };

module.exports=[{name:'Projektsprung',lauf:projektsprung},{name:'Material Haken',lauf:haken},{name:'Material Karte vor Video',lauf:karteVideo},{name:'Material Lektionsplan',lauf:lektionsplan},{name:'Material Gruppe',lauf:gruppe},{name:'Material Migration',lauf:altbestand}];
