/* Unsere Werke in der Kontrolle: Pro Kind trennt an «, », Sterne fehlen sauber, Export als ZIP mit Fotos. Die Anmeldung ist hier eine Attrappe. */
'use strict';
const WERKE=[{id:'a',titel:'Rakete',name:'Mia, Noah, Lea',klasse:3,sterne:null,erstellt:'2026-10-30T10:00:00Z',videoId:'x'},{id:'b',titel:'Rakete',name:'Mia, Noah, Lea',klasse:3,sterne:null,erstellt:'2026-10-29T10:00:00Z',videoId:'x'},{id:'c',titel:'=Flieger',name:'Noah',klasse:3,sterne:4,erstellt:'2026-10-28T10:00:00Z',videoId:'y'},{id:'d',titel:'Dose: «Zoë»',name:'Zoë',klasse:4,sterne:2,erstellt:'2026-10-27T10:00:00Z',videoId:'z'}];
const ATTRAPPE=`const W={bereit:async()=>{},APP_URL:'/schule/',sammlung:{verwaltung:async()=>({sammlungen:[{id:'s1',name:'Klasse 3a',aktiv:1,erstellt:'2026-10-01'}]}),werke:async()=>({werke:${JSON.stringify(WERKE)}}),foto:async id=>{ const c=document.createElement('canvas'); c.width=c.height=64; c.getContext('2d').fillRect(0,0,64,64); const b=await new Promise(f=>c.toBlob(f,'image/jpeg')); return URL.createObjectURL(b); },loeschen:async()=>{},sperren:async()=>{},erstellen:async()=>({})}};`;

const TAB=Array.from({length:256},(_,n)=>{ let c=n; for(let k=0;k<8;k++) c=c&1?0xEDB88320^(c>>>1):c>>>1; return c>>>0; });
const crc=b=>{ let c=-1; for(const x of b) c=TAB[(c^x)&255]^(c>>>8); return ~c>>>0; };
/* ZIP über das Inhaltsverzeichnis lesen, wie es jedes Entpackprogramm tut */
function zipLesen(b){ let e=b.length-22; if(b.readUInt32LE(e)!==0x06054b50) throw new Error('Kein ZIP-Ende'); const n=b.readUInt16LE(e+10), aus=[]; let o=b.readUInt32LE(e+16);
  for(let i=0;i<n;i++){ if(b.readUInt32LE(o)!==0x02014b50) throw new Error('Verzeichnis'); const fl=b.readUInt16LE(o+8), art=b.readUInt16LE(o+10), c=b.readUInt32LE(o+16), g=b.readUInt32LE(o+24), nl=b.readUInt16LE(o+28), xl=b.readUInt16LE(o+30), kl=b.readUInt16LE(o+32), lo=b.readUInt32LE(o+42), name=b.slice(o+46,o+46+nl).toString('utf8');
    if(b.readUInt32LE(lo)!==0x04034b50) throw new Error('Eintrag '+name); const d=lo+30+b.readUInt16LE(lo+26)+b.readUInt16LE(lo+28), daten=b.slice(d,d+g); aus.push({name,art,fl,ok:crc(daten)===c,daten}); o+=46+nl+xl+kl; } return aus; }

const sammlung=async t=>{ const k=await t.kontext({touch:false,breite:1280,hoehe:800}); await k.c.route('**/kontrolle/werkstatt.js',r=>r.fulfill({status:200,contentType:'text/javascript',body:ATTRAPPE})); const p=await k.seite('/kontrolle/sammlung.html');
  await p.waitForSelector('.werk'); t.pruefe(await p.locator('.werk').count()===4,'Alle Werke'); t.pruefe(await p.locator('.sterne.leer').count()===2,'Leere Sterne'); t.pruefe(await p.locator('.werk').first().locator('.sterne').textContent()==='☆☆☆☆☆','Fünf leere'); t.pruefe(await p.locator('.werk').nth(2).locator('.sterne').textContent()==='★★★★☆','Vier volle');
  const zahl=async n=>{ await p.locator(`#kinder [data-n="${n}"]`).click(); await p.waitForFunction(n=>document.querySelector('#kinder .on').dataset.n===n,n); return p.locator('.werk').count(); };
  t.pruefe((await p.locator('#kinder [data-n]').allTextContents()).slice(1).join()==='Lea2,Mia2,Noah3,Zoë1','Namen getrennt: '+await p.locator('#kinder [data-n]').allTextContents());
  t.pruefe(await zahl('Mia')===2,'Mia'); t.pruefe(await zahl('Noah')===3,'Noah'); t.pruefe(await zahl('Lea')===2,'Lea'); t.pruefe(!await p.locator('#kinder [data-n="Mia, Noah, Lea"]').count(),'Ganzer Text als Kind');
  await zahl('');
  t.pruefe(await p.locator('#export').isDisabled(),'Export leer gesperrt'); await p.locator('#alle').click(); t.pruefe(await p.locator('.werk.gew').count()===4,'Alle gewählt'); await p.locator('[data-w=c]').uncheck(); await p.locator('[data-w=c]').check(); t.pruefe((await p.locator('#export').textContent()).includes('4'),'Zahl am Export');
  const [dl]=await Promise.all([p.waitForEvent('download'),p.locator('#export').click()]); t.pruefe(/^Werke Klasse 3a \d{4}-\d\d-\d\d\.zip$/.test(dl.suggestedFilename()),'Dateiname '+dl.suggestedFilename());
  const stuecke=[]; for await(const s of await dl.createReadStream()) stuecke.push(s); const z=zipLesen(Buffer.concat(stuecke)), namen=z.map(x=>x.name);
  t.pruefe(z.length===5,'Einträge: '+namen); t.pruefe(z.every(x=>x.ok&&x.art===0&&x.fl&0x800),'Prüfsummen'); t.pruefe(namen.includes('Mia, Noah, Lea - Rakete.jpg')&&namen.includes('Mia, Noah, Lea - Rakete (2).jpg'),'Doppelte Namen: '+namen); t.pruefe(namen.some(n=>n.startsWith('Zoë - Dose- «Zoë»')),'Umlaut: '+namen);
  t.pruefe(z.filter(x=>x.name.endsWith('.jpg')).every(x=>x.daten[0]===0xff&&x.daten[1]===0xd8&&x.daten.length>100),'JPEG drin');
  const csv=z.find(x=>x.name==='werke.csv').daten.toString('utf8'); t.pruefe(csv.startsWith('﻿Datei;Namen;Klasse;Titel;Sterne;Datum'),'CSV Kopf'); t.pruefe(csv.split('\r\n').length===5,'CSV Zeilen'); t.pruefe(csv.includes(`"'=Flieger"`),'Formel entschärft'); t.pruefe(csv.includes('"Mia, Noah, Lea";"3";"Rakete";"";"2026-10-30"'),'Sterne leer in CSV');
  await p.waitForFunction(()=>!document.querySelector('#export').disabled); t.keineFehler(k); };

/* Hall of Fame: keine Einzelnamen, keine Sterne */
const werkeSeite=async t=>{ const fs=require('node:fs'), path=require('node:path'); const s=fs.readFileSync(path.resolve(__dirname,'..','..','kontrolle','werke.html'),'utf8'); t.pruefe(!/\bw\.(sterne|name)\b/.test(s),'Hall of Fame liest Name oder Sterne'); };

/* kurz bleibt beim Bearbeiten und Übernehmen: Entwürfe haben ihn nicht, schule.json schon. Ein neues label leert ihn. */
const KURZ_ID='abcdefghijk', LANG=['Erster langer Schritt im Video','Zweiter langer Schritt im Video'];
const KURZ_DATEN={id:KURZ_ID,analyse:{title:'Test',kanal:'K',dauer:60,fps:2,bildwechsel:[],transkript:[]},themen:[],vokabular:[],blaetter:[],
  entwurf:{id:'zw-test',source:{type:'youtube',id:KURZ_ID},title:'Test',areaId:'holz',material:[],stufen:[3],steps:[{t:0,label:LANG[0]},{t:10,label:LANG[1]}]},
  schule:{id:'zw-test',source:{type:'youtube',id:KURZ_ID},title:'Test',material:[],stufen:[],steps:[{t:0,label:LANG[0],kurz:'Mach Schritt eins'},{t:10,label:LANG[1],kurz:'Mach Schritt zwei'}]}};
const KURZ_ATTRAPPE=`window.__weg=[];const W={bereit:async()=>{},LOKAL:true,pause:10,nachPub:'',bild:()=>'',daten:async()=>(${JSON.stringify(KURZ_DATEN)}),speichern:async(id,e)=>{__weg.push(e);return{}},veroeffentlichen:async(id,e)=>{__weg.push(e);return{anzahl:1}}};`;
const KURZ_PY=`
import json, pathlib, sys, tempfile
sys.path.insert(0, 'werkzeug')
import kontrolle as k
d = pathlib.Path(tempfile.mkdtemp()); k.ENTWURF = d; k.SCHULE = d / 'schule.json'
alt = [{'t': 0, 'label': 'A lang', 'kurz': 'A kurz'}, {'t': 5, 'label': 'B lang', 'kurz': 'B kurz'}, {'t': 9, 'label': 'C lang', 'kurz': 'C kurz'}]
k.SCHULE.write_text(json.dumps({'videos': [{'id': 'zw-x', 'source': {'id': 'abcdefghijk'}, 'steps': alt}]}), encoding='utf-8')
(d / 'abcdefghijk').mkdir()
neu = [{'t': 0, 'label': 'A lang'}, {'t': 5, 'label': 'B anders'}, {'t': 9, 'label': 'C lang', 'kurz': 'C neu'}]
(d / 'abcdefghijk' / 'video.json').write_text(json.dumps({'id': 'zw-x', 'source': {'id': 'abcdefghijk'}, 'steps': neu}), encoding='utf-8')
k.uebernehmen('abcdefghijk')
print(json.dumps([json.loads(k.SCHULE.read_text(encoding='utf-8'))['videos'][0]['steps'], k.schritt({'t': 1.23, 'label': ' a ', 'kurz': ' b '}), k.schritt({'t': 1, 'label': 'a', 'kurz': ' '})]))
`;
const kurzBleibt=async t=>{ const k=await t.kontext({touch:false,breite:1280,hoehe:800}); await k.c.route('**/kontrolle/werkstatt.js',r=>r.fulfill({status:200,contentType:'text/javascript',body:KURZ_ATTRAPPE})); const p=await k.seite('/kontrolle/video.html?id='+KURZ_ID);
  await p.waitForSelector('#ekurz'); const kurz=()=>p.locator('#ekurz').inputValue();
  t.pruefe(await kurz()==='Mach Schritt eins','Aus schule.json geladen: '+await kurz());
  await p.locator('#elabel').fill('Neuer Titel'); t.pruefe(await kurz()==='','Neues label leert kurz');
  await p.locator('#elabel').fill(LANG[0]); t.pruefe(await kurz()==='Mach Schritt eins','Altes label bringt kurz zurück');
  await p.locator('#elabel').fill('Neuer Titel'); await p.locator('#elabel').press('Tab'); await p.waitForFunction(()=>/Kurz fehlt/.test(document.querySelector('#ewarn').textContent));
  await p.locator('#ekurz').click(); await p.locator('#ekurz').pressSequentially('Mach neu'); t.pruefe(await p.evaluate(()=>document.activeElement.id)==='ekurz','Fokus bleibt in Kurz');
  await p.locator('#ekurz').press('Tab'); await p.waitForFunction(()=>!/Kurz fehlt/.test(document.querySelector('#ewarn').textContent));
  await p.waitForFunction(()=>(window.__weg.at(-1)?.steps[0]||{}).kurz==='Mach neu');
  const weg=await p.evaluate(()=>window.__weg.at(-1).steps); t.pruefe(weg[0].label==='Neuer Titel'&&weg[1].kurz==='Mach Schritt zwei','Gespeichert: '+JSON.stringify(weg));
  await p.locator('#ekurz').fill('Fünf Wörter sind hier zuviel'); await p.locator('#ekurz').press('Tab'); await p.waitForFunction(()=>/5 Wörter/.test(document.querySelector('#ewarn').textContent));
  await p.locator('#ekurz').fill('Fertig – dein Granny Square!'); await p.locator('#ekurz').press('Tab'); await p.waitForFunction(()=>!/Wörter/.test(document.querySelector('#ewarn').textContent)); await p.locator('#ekurz').fill('Fünf Wörter sind hier zuviel'); await p.locator('#ekurz').press('Tab');
  await p.locator('[data-ins="0"]').first().click(); await p.waitForFunction(()=>document.activeElement.id==='elabel'); t.pruefe(await kurz()==='','Neuer Schritt ohne kurz'); await p.locator('#elabel').fill('Dazwischen'); t.pruefe(await kurz()==='','Neuer Schritt bleibt leer');
  await p.locator('#zuAngaben').click(); await p.locator('#take2').click(); await p.waitForFunction(()=>document.querySelector('#pub').open); await p.locator('#pubyes').click(); await p.waitForFunction(()=>window.__weg.at(-1).steps.length===3&&document.querySelector('#status').textContent==='veröffentlicht');
  const pub=await p.evaluate(()=>window.__weg.at(-1).steps); t.pruefe(pub[0].kurz==='Fünf Wörter sind hier zuviel'&&!('kurz' in pub[1])&&pub[2].kurz==='Mach Schritt zwei','Veröffentlicht: '+JSON.stringify(pub));
  t.keineFehler(k);
  const fs=require('node:fs'), path=require('node:path'), wurzel=path.resolve(__dirname,'..','..'), sauber=new Function(fs.readFileSync(path.join(wurzel,'kontrolle','werkstatt.js'),'utf8').match(/function sauber\(id,e\)\{.*/)[0]+';return sauber')();
  const on=sauber('x',{steps:[{t:1.23,label:' a ',kurz:' b '},{t:2,label:'c',kurz:' '}]}).steps; t.pruefe(on[0].kurz==='b'&&!('kurz' in on[1]),'Online: '+JSON.stringify(on));
  const py=require('node:child_process').spawnSync('python',['-B','-c',KURZ_PY],{cwd:wurzel,encoding:'utf8',env:{...process.env,PYTHONIOENCODING:'utf-8'}}); t.pruefe(py.status===0,'Python: '+py.stderr);
  const [steps,mit,ohne]=JSON.parse(py.stdout); t.pruefe(steps[0].kurz==='A kurz','Gleiches label behält kurz: '+py.stdout); t.pruefe(!('kurz' in steps[1]),'Anderes label ohne kurz: '+py.stdout); t.pruefe(steps[2].kurz==='C neu','Neuer kurz gewinnt: '+py.stdout); t.pruefe(mit.kurz==='b'&&!('kurz' in ohne),'Speichern behält kurz: '+py.stdout); };

/* 🗑 nur bei Videos ohne Entwurf: zweiter Tipp löscht, Fehler lassen die Karte stehen. Online und lokal: Was Schritte hat oder in der App steht, bleibt. */
const LISTE=[{id:'leerleerlee',title:'Leer',entwurf:false,brief:true,status:[]},{id:'fehlfehlfeh',title:'Fehler',entwurf:false,brief:false,status:[]},{id:'drindrindri',title:'Drin',entwurf:true,drin:true,schritte:3,status:[1,1,1]},{id:'offenoffeno',title:'Offen',entwurf:true,schritte:3,status:[1,1,0]}];
const LOESCH_ATTRAPPE=`window.__ab=[];const W={LOKAL:true,bereit:async()=>{},meldungen:async()=>[],liste:async()=>({themen:[],videos:${JSON.stringify(LISTE)}.map(e=>({...e,vorschau:''}))}),loeschen:async id=>{__ab.push(id);if(id==='fehlfehlfeh')throw new Error('nein');return{ok:true}}};`;
const LOESCH_PY=`
import json, pathlib, sys, tempfile
sys.path.insert(0, 'werkzeug')
import kontrolle as k
d = pathlib.Path(tempfile.mkdtemp()); k.ENTWURF = d; k.CACHE = d / 'cache'; k.SCHULE = d / 'schule.json'
k.SCHULE.write_text(json.dumps({'videos': [{'id': 'zw-x', 'source': {'id': 'drindrindri'}}]}), encoding='utf-8')
for v, f in (('leerleerlee', 'brief.md'), ('offenoffeno', 'video.json'), ('drindrindri', 'brief.md')):
    (d / v).mkdir(); (d / v / f).write_text('{}', encoding='utf-8')
(d / 'nurordner00').mkdir()
aus = []
for v in ('leerleerlee', 'offenoffeno', 'drindrindri'):
    try: k.loeschen(v); aus.append(True)
    except ValueError: aus.append(False)
print(json.dumps([aus, [(d / v).exists() for v in ('leerleerlee', 'offenoffeno', 'drindrindri')], sorted(e['id'] for e in k.liste())]))
`;
const loeschen=async t=>{ const k=await t.kontext({touch:false,breite:1280,hoehe:800}); await k.c.route('**/kontrolle/werkstatt.js',r=>r.fulfill({status:200,contentType:'text/javascript',body:LOESCH_ATTRAPPE})); const p=await k.seite('/kontrolle/index.html');
  await p.waitForSelector('#filter button'); await p.locator('[data-f=alle]').click(); await p.waitForSelector('.karte');
  t.pruefe(await p.locator('.ab').count()===2,'Knopf nur ohne Entwurf'); const ab=id=>p.locator(`[data-ab="${id}"]`), ruf=()=>p.evaluate(()=>window.__ab);
  await ab('leerleerlee').click(); t.pruefe(p.url().endsWith('/kontrolle/index.html'),'Tipp öffnet die Karte nicht: '+p.url()); t.pruefe((await ruf()).length===0,'Erster Tipp löscht nicht'); t.pruefe(await ab('leerleerlee').textContent()==='Löschen?','Rot mit Frage');
  await p.waitForFunction(()=>document.querySelector('[data-ab=leerleerlee]').textContent==='🗑',null,{timeout:4000}); t.pruefe((await ruf()).length===0,'Warten löscht nicht');
  await ab('leerleerlee').click(); await ab('leerleerlee').click(); await p.waitForFunction(()=>!document.querySelector('[data-ab=leerleerlee]')); t.pruefe((await ruf()).join()==='leerleerlee','Gelöscht: '+await ruf());
  t.pruefe(await p.locator('.karte').count()===3,'Karte weg'); t.pruefe((await p.locator('[data-f=leer]').textContent()).endsWith('1'),'Zahl sinkt: '+await p.locator('[data-f=leer]').textContent());
  await ab('fehlfehlfeh').click(); await ab('fehlfehlfeh').click(); await p.waitForFunction(()=>document.querySelector('[data-ab=fehlfehlfeh]').textContent==='⚠'); t.pruefe(await p.locator('.karte').count()===3,'Fehler lässt die Karte stehen');
  t.keineFehler(k);
  const fs=require('node:fs'), path=require('node:path'), wurzel=path.resolve(__dirname,'..','..');
  const py=require('node:child_process').spawnSync('python',['-B','-c',LOESCH_PY],{cwd:wurzel,encoding:'utf8',env:{...process.env,PYTHONIOENCODING:'utf-8'}}); t.pruefe(py.status===0,'Python: '+py.stderr);
  const [aus,da,liste]=JSON.parse(py.stdout); t.pruefe(aus.join()==='true,false,false'&&da.join()==='false,true,true','Lokal: '+py.stdout); t.pruefe(liste.join()==='drindrindri,offenoffeno','Leere Ordner fehlen in der Liste: '+py.stdout);
  /* Online-Weg mit echter werkstatt.js gegen eine GitHub-Attrappe: Ein Commit nimmt den Ordner und die Zeile in liste.json weg */
  const online=async(id,mitEntwurf,inApp)=>{ const baum=[], json=(o,s=200)=>new Response(JSON.stringify(o),{status:s}), lauf=[];
    const f=async(u,o={})=>{ const a=u.replace('https://api.github.com/repos/','').split('?')[0], m=o.method||'GET'; lauf.push(m+' '+a);
      if(a.endsWith('/git/ref/heads/main')) return json({object:{sha:'b'}}); if(a.includes('/git/commits/')) return json({tree:{sha:'t'}});
      if(a.endsWith('/git/trees')){ baum.push(...JSON.parse(o.body).tree); return json({sha:'n'}); } if(a.endsWith('/git/commits')) return json({sha:'c'}); if(a.endsWith('/git/refs/heads/main')) return json({});
      if(a.endsWith('/contents/schule/schule.json')) return new Response(JSON.stringify({videos:inApp?[{source:{id}}]:[]}));
      if(a.endsWith('/contents/liste.json')) return new Response(JSON.stringify([{id},{id:'andereseins'}]));
      if(a.endsWith('/contents/'+id)) return mitEntwurf===null?json({},404):json(['brief.md','analyse.json',...(mitEntwurf?['video.json']:[])].map(n=>({path:id+'/'+n})));
      throw new Error('Unerwartet: '+m+' '+a); };
    const Wo=new Function('location','localStorage','sessionStorage','fetch',fs.readFileSync(path.join(wurzel,'kontrolle','werkstatt.js'),'utf8')+';return W')({hostname:'conradinjoos-lab.github.io',hash:'',pathname:'/'},{getItem:()=>'{"token":"t","ablauf":0}',setItem(){},removeItem(){}},{},f);
    let fehler=''; try{ await Wo.loeschen(id); }catch(x){ fehler=x.message; } return {baum,fehler,lauf}; };
  const ok=await online('leerleerlee',false,false); t.pruefe(!ok.fehler,'Online: '+ok.fehler); t.pruefe(ok.baum.filter(x=>x.sha===null).map(x=>x.path).join()==='leerleerlee/brief.md,leerleerlee/analyse.json','Ordner im Commit: '+JSON.stringify(ok.baum));
  const zeile=ok.baum.find(x=>x.path==='liste.json'); t.pruefe(zeile&&JSON.parse(zeile.content).map(x=>x.id).join()==='andereseins','Zeile weg: '+JSON.stringify(zeile));
  const nurZeile=await online('leerleerlee',null,false); t.pruefe(!nurZeile.fehler&&nurZeile.baum.length===1&&nurZeile.baum[0].path==='liste.json','Leerer Ordner: nur die Zeile: '+JSON.stringify(nurZeile.baum));
  for(const [m,a,w] of [[true,false,'Entwurf'],[false,true,'App']]){ const x=await online('leerleerlee',m,a); t.pruefe(x.fehler==='Hat einen Entwurf'&&!x.baum.length&&!x.lauf.some(l=>l.startsWith('PATCH')),w+' bleibt: '+x.fehler); } };

module.exports=[{name:'Kontrolle Sammlung',lauf:sammlung},{name:'Kontrolle Werke',lauf:werkeSeite},{name:'Kontrolle kurz',lauf:kurzBleibt},{name:'Kontrolle löschen',lauf:loeschen}];
