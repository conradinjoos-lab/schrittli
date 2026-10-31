/* Lehrperson in der Lektion: Klasse wählen, Favorit öffnen, freigeben und in derselben Ansicht Geräte und begonnene Arbeiten erkennen.
 * Die Anmeldung ist eine Attrappe, die sich die Freigabe merkt. klasse.js läuft echt.
 * ABLAUF_BILDER=<Ordner> legt Bildschirmfotos dort ab. */
'use strict';
const fs=require('node:fs'), path=require('node:path');
const WURZEL=path.resolve(__dirname,'..','..');
const liesJson=n=>JSON.parse(fs.readFileSync(path.join(WURZEL,n),'utf-8'));
const BILDER=new Set(liesJson('vorschau/vorschau.json').bilder||[]);
const VIDEOS=liesJson('schule/schule.json').videos.filter(v=>v.source&&v.source.type==='youtube'&&BILDER.has(v.source.id)&&fs.existsSync(path.join(WURZEL,'vorschau',v.source.id+'.webp'))&&(v.steps||[]).length>=4).slice(0,2);
const [A,B]=VIDEOS, N=A.steps.length;
const ZU={mode:'closed',title:'',ids:[],grade:null,simple:true,resize:true,recolor:true,gallery:false,selection:'custom',category:'',plan:false};
const OFFEN={...ZU,mode:'projects',title:'Lektion',ids:[A.id,B.id],grade:3};
const stand=(kindKey,videoId,schritt,videoFertig,werkFertig,zeit)=>({kindKey,videoId,schritt,max:schritt,videoFertig,werkFertig,stand:zeit});
const KINDER=['Mia','Noah','Lea','Zoë','Tim','Ben'];
/* Mia, Noah und Lea arbeiten zusammen, Ben hat noch nichts gemeldet */
const STAENDE=[...['Mia','Noah','Lea'].map(n=>stand('3a/'+n,A.id,2,true,false,1000)),stand('3a/Zoë',A.id,1,false,null,1100),stand('3a/Tim',A.id,N-1,true,true,1200),stand('_ohne',A.id,0,false,false,900)];
const WERKE=[{id:'w1',titel:'Rakete',name:'Mia, Noah, Lea',klasse:3,sterne:null,erstellt:'2026-10-30T10:00:00Z',videoId:A.id},{id:'w2',titel:'Schal',name:'Tim',klasse:3,sterne:2,erstellt:'2026-10-29T10:00:00Z',videoId:A.id}];

const attrappe=({policy=ZU,revision=4,staende=STAENDE,kindstand='ok',geraeteOk=true,fortschritt=[]}={})=>`
window.ABLAUF={freigaben:[]};
const GR=[{id:'g3a',name:'Klasse 3a',token:'t',policy:${JSON.stringify(policy)},revision:${revision}},{id:'g4b',name:'Klasse 4b',token:'u',policy:${JSON.stringify(ZU)},revision:1}];
const foto=async()=>{const c=document.createElement('canvas');c.width=c.height=64;c.getContext('2d').fillRect(0,0,64,64);const b=await new Promise(f=>c.toBlob(f,'image/jpeg'));return URL.createObjectURL(b)};
const W={bereit:async()=>{},APP_URL:'/schule/',
 unterricht:{gruppen:async()=>({gruppen:GR}),favoriten:async()=>({favoriten:[{id:'f1',name:'Lektion',policy:${JSON.stringify(OFFEN)}}]}),
  freigabe:async(id,revision,policy)=>{const g=GR.find(x=>x.id===id);ABLAUF.freigaben.push(policy);g.policy=policy;g.revision=revision+1;return {policy,revision:g.revision}},
  geraete:async id=>{${geraeteOk?'':"throw Object.assign(new Error('Serverfehler'),{status:500});"}const g=GR.find(x=>x.id===id),n=Date.now();
   return {revision:g.revision,policy:g.policy,now:n,geraete:[{id:'d1',name:'iPad 1',gesehen:n-8000,revision:g.revision,fortschritt:${JSON.stringify(fortschritt)}},{id:'d2',name:'iPad 2',gesehen:n-20000,revision:${revision},fortschritt:[]},{id:'d3',name:'iPad 3',gesehen:n-7200000,revision:${revision},fortschritt:[]}]}},
  kindstand:async id=>{${kindstand==='ok'?'':"throw Object.assign(new Error('Nicht gefunden'),{status:404});"}return {now:Date.now(),staende:id==='g3a'?${JSON.stringify(staende)}:[]}},
  geraetName:async()=>({}),favorit:async()=>({}),favoritEntfernen:async()=>({})},
 namen:{klassen:async()=>({klassen:[{id:'k4',name:'4b',stufe:4,namen:['Ida']},{id:'k3',name:'3a',stufe:3,namen:${JSON.stringify(KINDER)}}]}),speichern:async()=>({}),entfernen:async()=>({})},
 sammlung:{verwaltung:async()=>({sammlungen:[{id:'s4',name:'Klasse 4b',aktiv:1,erstellt:'2026-10-01'},{id:'s3',name:'Klasse 3a',aktiv:0,erstellt:'2026-09-01'}]}),
  werke:async id=>({werke:id==='s3'?${JSON.stringify(WERKE)}:[]}),foto,loeschen:async()=>{},sperren:async()=>{},erstellen:async()=>({})}};`;

const oeffnen=async(t,o,{breite=1180,hoehe=820,adresse='/kontrolle/unterricht.html'}={})=>{ const k=await t.kontext({breite,hoehe}); await k.c.route('**/kontrolle/werkstatt.js',r=>r.fulfill({status:200,contentType:'text/javascript',body:attrappe(o)})); const p=await k.seite(adresse); await p.waitForSelector('#gruppen [data-id]'); return {k,p}; };
const foto=async(p,name)=>{ const d=process.env.ABLAUF_BILDER; if(!d) return; await p.screenshot({path:path.join(d,name+'.png'),fullPage:true}); };
const text=(p,s)=>p.locator(s).first().textContent();
const zeile=(p,key)=>p.locator(`.kind-z[data-kind="${key}"]`);
const marke=async(z,art)=>{ const m=z.locator(`.m[data-art=${art}]`); return await m.evaluate(e=>e.classList.contains('an')?'an':e.classList.contains('aus')?'aus':e.textContent); };
const ohneRollen=async(t,p,wo)=>{ const r=await p.evaluate(()=>({b:document.documentElement.scrollWidth,f:innerWidth,raus:[...document.querySelectorAll('.lektion .karte,.ipad,.kind-z,.vk,header,.k-nav')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).length})); t.pruefe(r.b<=r.f&&!r.raus,`${wo}: rollt quer ${r.b}/${r.f}, ${r.raus} ragen hinaus`); };

/* Der ganze Weg, einmal auf dem iPad und einmal auf dem Handy */
const weg=(breite,hoehe,name)=>async t=>{ const {k,p}=await oeffnen(t,{},{breite,hoehe});
  /* Klasse einmal wählen: steht in Adresse und sessionStorage, bleibt auch ohne Adresse */
  await p.locator('#gruppen [data-id=g4b]').click(); await p.waitForFunction(()=>location.search==='?klasse=4b');
  t.pruefe(await p.evaluate(()=>sessionStorage.getItem('kontrolle.klasse'))==='4b','sessionStorage');
  t.pruefe(await p.locator('#k-nav a').nth(1).getAttribute('href')==='sammlung.html?klasse=4b','Link trägt Klasse');
  await p.goto(t.basis+'/kontrolle/unterricht.html'); await p.waitForSelector('#gruppen .on');
  t.pruefe(await p.locator('#gruppen .on').getAttribute('data-id')==='g4b','Klasse vergessen'); t.pruefe(p.url().endsWith('?klasse=4b'),'Adresse ohne Klasse');
  await p.locator('#gruppen [data-id=g3a]').click(); await p.waitForFunction(()=>location.search==='?klasse=3a');
  /* Favorit öffnen: Bildkarten als Entwurf, noch nichts freigegeben */
  await p.waitForSelector('#favoriten-karte:not([hidden]) .fav-laden'); await p.locator('.fav-laden').first().click();
  await p.waitForSelector('#jetzt.entwurf'); t.pruefe(/Entwurf/.test(await text(p,'#vor-kopf .marke')),'Entwurf nicht markiert');
  t.pruefe(await p.locator('#vor-bilder .vk img.th').count()===2,'Keine Bildkarten'); t.pruefe((await p.locator('#vor-bilder .vk b').allTextContents()).join()===[A.title,B.title].join(),'Titel der Karten');
  t.pruefe(await p.locator('#vor-bilder ul,#vor-bilder li').count()===0,'Textliste'); t.pruefe(await p.evaluate(()=>ABLAUF.freigaben.length)===0,'Schon freigegeben');
  await foto(p,name+'-entwurf');
  /* Freigeben: alles Weitere in derselben Ansicht */
  const vorher=p.url(); await p.locator('#freigeben').click(); await p.waitForFunction(()=>!document.querySelector('#jetzt').classList.contains('entwurf')&&document.querySelector('#hinweis').textContent==='✓');
  t.pruefe(/Offen/.test(await text(p,'#vor-kopf .marke')),'Nicht offen'); t.pruefe((await p.evaluate(()=>ABLAUF.freigaben[0].ids)).join()===[A.id,B.id].join(),'Falsche Aufgaben'); t.pruefe(p.url()===vorher,'Ansicht gewechselt');
  /* Geräte grafisch: übernommen oder fehlt, online oder nicht */
  await p.waitForFunction(()=>document.querySelector('.ipad.online.ok')&&document.querySelector('.kind-z'));
  t.pruefe(await p.locator('#geraete .ipad').count()===3,'Drei iPads'); t.pruefe(await p.locator('.ipad.online.ok').count()===1,'Übernommen'); t.pruefe(await p.locator('.ipad.online.fehlt').count()===1,'Online ohne Freigabe'); t.pruefe(await p.locator('.ipad.offline.fehlt').count()===1,'Offline'); t.pruefe(await p.locator('.ipad.geist').count()===0,'Leere Kachel');
  t.pruefe((await text(p,'#g-anzahl')).replace(/\s/g,'')==='2/3✓1/3','Anzahl: '+await text(p,'#g-anzahl'));
  /* Arbeiten: Gruppe, Video und Werk getrennt, Strich statt Null */
  const gruppe=zeile(p,'3a/Mia'); t.pruefe(/Mia, Noah, Lea/.test(await gruppe.locator('.kn').textContent()),'Gruppe: '+await gruppe.locator('.kn').textContent()); t.pruefe(await gruppe.locator('.kx').textContent()===`3/${N}`,'Schritt der Gruppe'); t.pruefe(await marke(gruppe,'spiel')==='an'&&await marke(gruppe,'werk')==='aus','Video und Werk vermischt');
  const zoe=zeile(p,'3a/Zoë'); t.pruefe(await marke(zoe,'spiel')==='aus'&&await marke(zoe,'werk')==='–','Fehlender Werkstand: '+await marke(zoe,'werk'));
  const tim=zeile(p,'3a/Tim'); t.pruefe(await tim.locator('.kx').textContent()===`${N}/${N}`&&await marke(tim,'spiel')==='an'&&await marke(tim,'werk')==='an','Fertiges Kind');
  const ben=zeile(p,'Ben'); t.pruefe(await ben.locator('.kx').textContent()==='–'&&await marke(ben,'spiel')==='–'&&await marke(ben,'werk')==='–','Ohne Daten: '+await ben.textContent()); t.pruefe(!/0/.test(await ben.textContent()),'Null statt Strich');
  t.pruefe((await p.locator('.kind-z .kn').last().textContent())==='Ohne Name','Ohne Name zuletzt'); t.pruefe(await p.locator('.kind-z').count()===5,'Zeilen: '+await p.locator('.kind-z .kn').allTextContents());
  t.pruefe((await text(p,'[data-summe=spiel]')).trim()==='4/6','Summe Video: '+await text(p,'[data-summe=spiel]')); t.pruefe((await text(p,'[data-summe=werk]')).trim()==='1/6','Summe Werk: '+await text(p,'[data-summe=werk]'));
  t.pruefe(await gruppe.locator('[data-art=spiel] path').count()===1&&await gruppe.locator('[data-art=werk] path').count()===2,'Symbole gleich');
  /* Gerätestatus und Arbeitsstand nie vermischt */
  const ipads=await text(p,'#karte-ipads'), kinder=await text(p,'#karte-kinder');
  t.pruefe(!KINDER.some(n=>ipads.includes(n)),'Kind bei den iPads'); t.pruefe(!/iPad|Online|Offline|Übernommen|Fehlt/.test(kinder),'Gerät bei den Kindern');
  t.pruefe(await p.locator('#karte-ipads h2 [data-sym=tablet] svg').count()===1&&await p.locator('#karte-kinder h2 [data-sym=kind] svg').count()===1,'Symbole der Bereiche');
  await p.waitForFunction(()=>document.querySelector('#werke-streifen b').textContent==='2'); t.pruefe(await p.locator('#werke-streifen').getAttribute('href')==='sammlung.html?klasse=3a','Werke ohne Klasse'); t.pruefe(await p.locator('#werke-streifen img').count()===2,'Werke ohne Fotos');
  if(breite>=900){ const oben=await p.evaluate(()=>['#karte-vor','#karte-ipads','#karte-kinder'].map(s=>document.querySelector(s).getBoundingClientRect().top+scrollY)); t.pruefe(oben.every(y=>y<hoehe),'Nicht in einer Ansicht: '+oben); }
  else { await p.waitForFunction(()=>Math.abs(document.querySelector('#karte-ipads').getBoundingClientRect().top)<40);
    const b=await p.evaluate(()=>['#karte-vor','#karte-ipads','#karte-kinder','#karte-edit'].map(s=>Math.round(document.querySelector(s).getBoundingClientRect().width))); t.pruefe(new Set(b).size===1,'Karten verschieden breit: '+b);
    const y=await p.evaluate(()=>new Set([...document.querySelectorAll('.ipad')].map(e=>Math.round(e.getBoundingClientRect().top))).size); t.pruefe(y===1,'iPads nicht nebeneinander'); }
  await t.warte(500); await foto(p,name+'-lektion'); await ohneRollen(t,p,'Lektion'); t.pruefeFlagge(await t.flagge(p),'Lektion'); await p.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight)); await t.warte(100); t.pruefeFlagge(await t.flagge(p,true),'Lektion unten');
  /* Zweite Aufgabe: nichts gemeldet, die ganze Klasse steht mit Strichen da */
  await p.locator('.kv').nth(1).click(); await p.waitForSelector('.kv:nth-child(2).on'); t.pruefe(await p.locator('.kind-z.leer').count()===6,'Leere Zeilen'); t.pruefe((await text(p,'#k-zahlen')).replace(/\s/g,'')==='––','Summen ohne Daten');
  /* Zusammenhang bleibt über die Seiten */
  await p.locator('#werke-streifen').click(); await p.waitForURL('**/sammlung.html?klasse=3a'); await p.waitForSelector('.werk'); t.pruefe(await p.locator('.werk').count()===2,'Werke der Klasse'); await foto(p,name+'-werke'); await ohneRollen(t,p,'Werke');
  await p.locator('#k-nav a').nth(2).click(); await p.waitForURL('**/klassen.html?klasse=3a'); await p.waitForSelector('.karte.gewaehlt'); t.pruefe(await p.locator('.karte.gewaehlt').getAttribute('data-id')==='k3','Klassenliste'); await foto(p,name+'-klassen'); await ohneRollen(t,p,'Klassen');
  await p.locator('#k-nav a').nth(0).click(); await p.waitForURL('**/unterricht.html?klasse=3a'); await p.waitForSelector('#gruppen .on'); t.pruefe(await p.locator('#gruppen .on').getAttribute('data-id')==='g3a','Klasse zurück');
  /* Über die Übersicht: die Klasse kommt aus dem sessionStorage */
  await p.locator('a.zurueck').click(); await p.waitForURL('**/kontrolle/'); await p.waitForSelector('a[href="unterricht.html?klasse=3a"]',{state:'attached'}); await p.waitForSelector('a[href="sammlung.html?klasse=3a"]',{state:'attached'}); await p.waitForSelector('a[href="klassen.html?klasse=3a"]',{state:'attached'});
  t.keineFehler(k); };

/* Worker noch ohne Route oder App noch ohne Meldung: Striche, keine Fehlermeldung */
const ohneRoute=async t=>{ const {k,p}=await oeffnen(t,{policy:OFFEN,kindstand:'fehlt'}); await p.waitForFunction(()=>document.querySelectorAll('.kind-z').length===6);
  t.pruefe(await p.locator('.kind-z.leer').count()===6,'Striche'); t.pruefe(!/0/.test(await text(p,'#kinder')+await text(p,'#k-zahlen')),'Null statt Strich: '+await text(p,'#kinder')); t.pruefe(await text(p,'#fehler')==='','Fehler sichtbar'); t.keineFehler(k); };

/* Lektionsplan vom iPad steht als Gruppe da, ein Kindstand mit Komma im Namen zerfällt in die Kinder */
const plan=async t=>{ const {k,p}=await oeffnen(t,{policy:OFFEN,revision:5,staende:[stand('3a/Lea, Tim',B.id,1,false,false,1000)],fortschritt:[{videoId:A.id,schritte:[true,true,false],stand:1}]}); await p.waitForSelector('.kind-z');
  const z=zeile(p,'ipad:d1'); t.pruefe(/👥 iPad 1/.test(await z.textContent()),'Planzeile'); t.pruefe(await marke(z,'spiel')==='an'&&await marke(z,'werk')==='aus','Plan: Video und Werk');
  await p.locator('.kv').nth(1).click(); await p.waitForSelector('.kv:nth-child(2).on'); const g=zeile(p,'3a/Lea, Tim'); t.pruefe(/Lea, Tim/.test(await g.locator('.kn').textContent()),'Mehrere Namen'); t.pruefe(await p.locator('.kind-z.leer').count()===4,'Doppelte Zeile für Lea oder Tim'); t.pruefe((await text(p,'[data-summe=spiel]')).trim()==='0/6','Summe gemeldet: '+await text(p,'[data-summe=spiel]')); t.keineFehler(k); };

/* Serverfehler kurz mit Symbol, die volle Meldung nur im title */
const stoerung=async t=>{ const {k,p}=await oeffnen(t,{geraeteOk:false}); await p.waitForFunction(()=>document.querySelector('#fehler').textContent); t.pruefe(await text(p,'#fehler')==='⚠ Fehler','Fehler: '+await text(p,'#fehler')); t.pruefe(await p.locator('#fehler').getAttribute('title')==='Serverfehler','title'); t.pruefe(await p.locator('.ipad.geist').count()===3,'Leere iPads'); t.keineFehler(k); };

module.exports=[{name:'Lehrperson Lektion iPad',lauf:weg(1180,820,'1180')},{name:'Lehrperson Lektion Handy',lauf:weg(390,844,'390')},{name:'Lehrperson ohne Kindstand',lauf:ohneRoute},{name:'Lehrperson Lektionsplan',lauf:plan},{name:'Lehrperson Störung',lauf:stoerung}];
