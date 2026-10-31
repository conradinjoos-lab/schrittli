/* Punkt 2: erst Projekte, dann genau das zugehörige Material. Ein Haken gilt für Projektansicht, Lektionsplan und Karte vor dem Video gleich. */
'use strict';
const {ipad,kinderWahl,neuLaden,karteWeg,sammlung,anbinden,speicher,unterricht,unterrichtAnbinden,VERBINDUNG}=require('./schule-netz.cjs');
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

/* Plan des Geräts gegen Material des Kindes: Zeichnen und Kinderwechsel schreiben nichts und melden nichts */
const PLAN='wl-strickliesel';
const planGeraet=async t=>{ const sm=sammlung(), u=unterricht({policy:{mode:'projects',ids:[PLAN],plan:true}}), posts=[], k=await t.kontext({breite:1024,hoehe:768,speicher:speicher(sm,{'schrittli.unterricht.verbindung':JSON.stringify(VERBINDUNG)})}); await anbinden(k,sm); await unterrichtAnbinden(k,u); k.c.on('request',r=>{ if(/unterricht\/fortschritt/.test(r.url())&&r.method()==='POST') posts.push(JSON.parse(r.postData()).schritte); }); const p=await t.app(k,'schule'); await p.waitForFunction(()=>KL.klassen.length>0); await p.waitForFunction(()=>U.policy); return {k,p,posts}; };
const planKind=async(p,name)=>{ await kinderWahl(p,[name]); await karteWeg(p); await p.waitForSelector('.plan-karte'); };
const planLage=(p,posts)=>p.evaluate(id=>{ const c=document.querySelector('.plan-karte'), st=c.querySelector('.plan-station'); return {s:planVon(id).s.slice(),ring:c.querySelector('.plan-ring b').textContent,spielen:c.querySelector('[data-act=spielen]').disabled,korb:c.querySelectorAll('.plan-korb .mk').length,da:c.querySelectorAll('.plan-korb .mk.da').length,erledigt:st.classList.contains('erledigt'),jetzt:st.classList.contains('jetzt')}; },PLAN).then(l=>({...l,posts:JSON.stringify(posts)}));
const planTipp=async(t,p,ids)=>{ for(const m of ids){ await p.locator('.plan-korb .mk[data-id="'+m+'"]').click(); await t.warte(40); } };
const gleich=(t,ist,soll,wo)=>{ for(const f in soll) t.pruefe(JSON.stringify(ist[f])===JSON.stringify(soll[f]),wo+': '+f+' '+JSON.stringify(ist[f])); };
const planKinder=async t=>{ const {k,p,posts}=await planGeraet(t), mat=await p.evaluate(id=>matListe(videoOf(id)),PLAN); await planKind(p,'Mia'); await planTipp(t,p,mat); await t.warte(1300);
  gleich(t,await planLage(p,posts),{s:[true,false,false],ring:'1/3',spielen:false,erledigt:true,posts:'[[true,false,false]]'},'Mia fertig');
  await planKind(p,'Noah'); await t.warte(1300); gleich(t,await planLage(p,posts),{s:[true,false,false],ring:'1/3',spielen:true,korb:mat.length,da:0,erledigt:false,jetzt:true,posts:'[[true,false,false]]'},'Noah gewählt');
  await planTipp(t,p,mat.slice(0,1)); await t.warte(1300); gleich(t,await planLage(p,posts),{s:[true,false,false],spielen:true,da:1,posts:'[[true,false,false]]'},'Noah ein Stück');
  await planTipp(t,p,mat.slice(1)); gleich(t,await planLage(p,posts),{spielen:false,erledigt:true},'Noah voll');
  await planTipp(t,p,mat.slice(0,1)); await t.warte(1300); gleich(t,await planLage(p,posts),{s:[true,false,false],ring:'1/3',spielen:true,erledigt:false,posts:'[[true,false,false]]'},'Noah nimmt weg, Mia hat alles');
  await planKind(p,'Mia'); await t.warte(1300); gleich(t,await planLage(p,posts),{s:[true,false,false],spielen:false,erledigt:true,posts:'[[true,false,false]]'},'Mia zurück');
  await planTipp(t,p,mat.slice(1,2)); await t.warte(1300); gleich(t,await planLage(p,posts),{s:[false,false,false],ring:'0/3',spielen:true,posts:'[[true,false,false],[false,false,false]]'},'Mia nimmt weg, niemand hat alles'); t.keineFehler(k); };
const planUpdate=async t=>{ const {k,p,posts}=await planGeraet(t), mat=await p.evaluate(id=>matListe(videoOf(id)),PLAN); await planKind(p,'Mia');
  await p.evaluate(id=>{ S.settings.lektionsplan[id]={s:[true,true,false],mat:{}}; saveJetzt(); },PLAN); await neuLaden(p); await p.waitForFunction(()=>U.policy); await p.waitForSelector('.plan-karte'); await p.evaluate(()=>{ render(); render(); }); await t.warte(1300);
  gleich(t,await planLage(p,posts),{s:[true,true,false],ring:'2/3',spielen:true,korb:mat.length,da:0,erledigt:false,jetzt:true,posts:'[]'},'Nach dem Update');
  await planTipp(t,p,mat.slice(0,2)); await planTipp(t,p,mat.slice(0,1)); await t.warte(1300); gleich(t,await planLage(p,posts),{s:[true,true,false],spielen:true,posts:'[]'},'Teil-Haken');
  await planTipp(t,p,[mat[0],...mat.slice(2)]); await t.warte(1300); gleich(t,await planLage(p,posts),{s:[true,true,false],spielen:false,erledigt:true,posts:'[]'},'Korb voll'); t.keineFehler(k); };
const planAllesDa=async t=>{ const {k,p,posts}=await planGeraet(t); await planKind(p,'Mia'); await p.evaluate(id=>{ prog(id).material=Object.fromEntries(matListe(videoOf(id)).map(m=>[m,true])); render(); },PLAN); await t.warte(1300);
  gleich(t,await planLage(p,posts),{s:[false,false,false],ring:'0/3',spielen:false,erledigt:false,jetzt:true,posts:'[]'},'Korb voll ohne Plan');
  await p.locator('.plan-station [data-act=plan][data-k="0"]').click(); await t.warte(1300); gleich(t,await planLage(p,posts),{s:[true,false,false],ring:'1/3',erledigt:true,posts:'[[true,false,false]]'},'Alles da'); t.pruefe(!await p.locator('[data-act=plan][data-k="0"]').count(),'Haken bleibt'); t.keineFehler(k); };

module.exports=[{name:'Projektsprung',lauf:projektsprung},{name:'Material Haken',lauf:haken},{name:'Material Karte vor Video',lauf:karteVideo},{name:'Material Lektionsplan',lauf:lektionsplan},{name:'Material Plan Kinderwechsel',lauf:planKinder},{name:'Material Plan Update',lauf:planUpdate},{name:'Material Plan Alles da',lauf:planAllesDa},{name:'Material Gruppe',lauf:gruppe},{name:'Material Migration',lauf:altbestand}];
