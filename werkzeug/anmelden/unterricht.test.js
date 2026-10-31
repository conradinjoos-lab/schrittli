import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {werk} from './pruefbau.js';

test('classroom: teacher-only policy, independent groups, device acknowledgement, conflicts, presets and bounded validation',async()=>{
 const mf=new Miniflare(convertV4MiniflareOptions({modules:werk(),compatibilityDate:'2026-10-01',kvNamespaces:['KV'],d1Databases:['SAMMLUNG'],outboundService:async req=>Response.json({login:req.headers.get('Authorization')==='Bearer teacher'?'conradinjoos-lab':'someone-else'})}));
 try{
  const db=await mf.getD1Database('SAMMLUNG');for(const name of ['0001_sammlung.sql','0002_unterricht.sql','0004_fortschritt.sql','0006_kindstand.sql'])await db.exec(readFileSync(new URL('sammlung-migrations/'+name,import.meta.url),'utf8').replaceAll('\n',' '));
  const call=(path,token='teacher',b,origin='https://conradinjoos-lab.github.io')=>mf.dispatchFetch('https://test.example/unterricht/'+path,{method:b?'POST':'GET',headers:{Origin:origin,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:b?JSON.stringify(b):undefined});
  const data=async r=>{assert(r.ok,await r.clone().text());return r.json();};
  assert.equal((await call('gruppen','')).status,401);assert.equal((await call('gruppen','someone-else')).status,403);
  assert.equal((await call('gruppen','teacher',undefined,'https://other.example')).status,403);
  const a=await data(await call('erstellen','teacher',{name:'1a'})),b=await data(await call('erstellen','teacher',{name:'1b'}));
  const deviceId=crypto.randomUUID(),status=(group,revision=0)=>call('status',group.token,{deviceId,revision});
  const initial=await data(await status(a));assert.equal(initial.policy.mode,'closed');assert.equal(initial.leaseMs,90000);
  assert.equal((await call('gruppen',a.token)).status,401);assert.equal((await call('freigabe',a.token,{id:a.id,revision:1,policy:{mode:'free',title:'Frei',ids:[]}})).status,401);
  assert.equal((await call('status','teacher',{deviceId,revision:0})).status,401);
  const p={mode:'projects',title:'Papierflieger',ids:['flieger-windhover','flieger-pfeil'],grade:1};
  const updated=await data(await call('freigabe','teacher',{id:a.id,revision:1,policy:p}));assert.equal(updated.revision,2);
  assert.deepEqual((await data(await status(a))).policy.ids,p.ids);assert.equal((await data(await status(b))).policy.mode,'closed');
  assert.equal((await call('freigabe','teacher',{id:a.id,revision:1,policy:p})).status,409);
  await status(a,2);const devices=await data(await call('geraete?id='+a.id));assert.equal(devices.geraete[0].revision,2);
  await call('geraet-name','teacher',{id:a.id,deviceId,name:'iPad 7'});await status(a,2);assert.equal((await data(await call('geraete?id='+a.id))).geraete[0].name,'iPad 7');
  for(const patch of [{mode:'whatever'},{ids:[]},{ids:['../escape']},{grade:7},{ids:Array(501).fill('a')},{title:''}])assert.equal((await call('freigabe','teacher',{id:a.id,revision:2,policy:{...p,...patch}})).status,400);
  assert.equal((await call('freigabe','teacher',{id:a.id,revision:2,policy:{...p,title:'x'.repeat(70000)}})).status,413);
  const favorite=await data(await call('favorit','teacher',{name:'Flieger',policy:p}));assert.equal((await data(await call('favoriten'))).favoriten.length,1);
  assert.equal((await call('favorit',a.token,{name:'Unbefugt',policy:p})).status,401);
  await call('favorit-entfernen','teacher',{id:favorite.id});assert.equal((await data(await call('favoriten'))).favoriten.length,0);
  await call('freigabe','teacher',{id:a.id,revision:2,policy:{mode:'closed',title:'Alles geschlossen',ids:[]}});assert.equal((await data(await status(a,2))).policy.mode,'closed');
  const stored=await db.prepare('SELECT tokenHash FROM unterricht_gruppen WHERE id=?').bind(a.id).first();assert.notEqual(stored.tokenHash,a.token);

  /* Lektionsplan: nur mit Aufgaben, sonst false; fehlt die Angabe, bleibt er aus */
  const planned=await data(await call('freigabe','teacher',{id:a.id,revision:3,policy:{...p,plan:true}}));assert.equal(planned.policy.plan,true);
  assert.equal((await data(await status(a,3))).policy.plan,true);
  assert.equal((await data(await call('freigabe','teacher',{id:a.id,revision:4,policy:{...p,plan:'ja'}}))).policy.plan,false);
  assert.equal((await data(await call('freigabe','teacher',{id:a.id,revision:5,policy:{mode:'free',title:'Frei',ids:[],plan:true}}))).policy.plan,false);
  assert.equal((await data(await call('freigabe','teacher',{id:a.id,revision:6,policy:p}))).policy.plan,false);
  /* Vorlagen und Perlentiere brauchen keine Auswahl – nur Aufgaben (projects) verlangen ids */
  assert.equal((await call('freigabe','teacher',{id:a.id,revision:7,policy:{mode:'templates',title:'Vorlagen',ids:[]}})).status,200);
  assert.equal((await data(await call('freigabe','teacher',{id:a.id,revision:8,policy:{mode:'beads',title:'Perlentiere',ids:[]}}))).policy.mode,'beads');
  assert.equal((await call('freigabe','teacher',{id:a.id,revision:9,policy:p})).status,200);

  /* Fortschritt: Kind-Endpunkt mit Gruppen-Token, Lehrperson sieht ihn pro iPad */
  const schritte=[true,true,false],fort=(token,patch={})=>call('fortschritt',token,{token,geraet:deviceId,videoId:'flieger-windhover',schritte,...patch});
  assert.equal((await fort(a.token)).status,200);
  assert.equal((await fort(a.token,{schritte:[true,true,true]})).status,200);
  const seen=await data(await call('geraete?id='+a.id));assert.deepEqual(seen.geraete[0].fortschritt.map(f=>[f.videoId,f.schritte]),[['flieger-windhover',[true,true,true]]]);assert.equal(typeof seen.geraete[0].fortschritt[0].stand,'number');
  assert.equal((await fort(a.token,{videoId:'flieger-pfeil'})).status,200);assert.equal((await data(await call('geraete?id='+a.id))).geraete[0].fortschritt.length,2);
  assert.deepEqual((await data(await call('geraete?id='+b.id))).geraete.map(d=>d.fortschritt),[[]]);
  assert.equal((await fort('0'.repeat(64))).status,401);assert.equal((await fort('teacher')).status,401);
  assert.equal((await call('fortschritt','',{geraet:deviceId,videoId:'x',schritte})).status,401);assert.equal((await call('fortschritt','teacher',{geraet:deviceId,videoId:'x',schritte})).status,401);
  for(const patch of [{geraet:''},{geraet:'x'.repeat(65)},{geraet:7},{videoId:''},{videoId:'x'.repeat(81)},{videoId:'../x'},{schritte:[true,true]},{schritte:[true,true,true,true]},{schritte:[1,1,1]},{schritte:'111'},{schritte:[true,true,null]}])
   assert.equal((await fort(a.token,patch)).status,400,JSON.stringify(patch));
  /* Stand je Kind: annehmen nur mit Gruppen-Token, lesen nur als Lehrperson, Gerätedaten bleiben unberührt */
  const vorher=JSON.stringify((await data(await call('geraete?id='+a.id))).geraete);
  const kind=(token,staende)=>call('kindstand',token,{deviceId,staende});
  const lesen=async(g=a)=>(await data(await call('kindstand?id='+g.id))).staende;
  const mia={kindKey:'3a/Mia',videoId:'flieger-windhover',schritt:3,max:7,videoFertig:false,werkFertig:false,zeit:1000};
  assert.deepEqual(await lesen(),[]);
  assert.equal((await data(await kind(a.token,[mia,{...mia,kindKey:'3a/Noah'},{kindKey:'_ohne',videoId:'flieger-pfeil'}]))).angenommen,3);
  const gelesen=await lesen();assert.equal(gelesen.length,3);
  assert.deepEqual(gelesen.find(s=>s.kindKey==='3a/Mia'),{kindKey:'3a/Mia',videoId:'flieger-windhover',schritt:3,max:7,videoFertig:false,werkFertig:false,stand:1000});
  const ohne=gelesen.find(s=>s.kindKey==='_ohne');assert.deepEqual([ohne.schritt,ohne.max,ohne.videoFertig,ohne.werkFertig],[null,null,null,null]);
  assert.deepEqual(await lesen(b),[]);assert.equal(JSON.stringify((await data(await call('geraete?id='+a.id))).geraete),vorher);
  /* Neuer gewinnt, Älteres aus dem Offline-Betrieb überschreibt nichts, unbekannte Felder bleiben, die Zukunft wird auf jetzt gekürzt */
  assert.equal((await data(await kind(a.token,[{...mia,schritt:5,videoFertig:true,zeit:2000}]))).angenommen,1);
  assert.equal((await data(await kind(a.token,[{...mia,schritt:1,zeit:1500}]))).angenommen,0);
  assert.equal((await data(await kind(a.token,[{kindKey:'3a/Mia',videoId:'flieger-windhover',werkFertig:true,zeit:3000}]))).angenommen,1);
  const m=(await lesen()).find(s=>s.kindKey==='3a/Mia');assert.deepEqual([m.schritt,m.max,m.videoFertig,m.werkFertig,m.stand],[5,7,true,true,3000]);
  const zukunft=Date.now()+864e5;await data(await kind(a.token,[{...mia,kindKey:'3a/Ben',zeit:zukunft}]));assert((await lesen()).find(s=>s.kindKey==='3a/Ben').stand<zukunft);
  await data(await kind(a.token,[{...mia,kindKey:'3a/Lena',zeit:undefined}]));assert((await lesen()).find(s=>s.kindKey==='3a/Lena').stand>1e12);
  await data(await kind(a.token,[{...mia,kindKey:'3a/Mia, Noah, Lea'}]));assert((await lesen()).some(s=>s.kindKey==='3a/Mia, Noah, Lea'));
  assert.equal((await kind('0'.repeat(64),[mia])).status,401);assert.equal((await kind('teacher',[mia])).status,401);assert.equal((await kind('',[mia])).status,401);
  assert.equal((await call('kindstand?id='+a.id,a.token)).status,401);assert.equal((await call('kindstand?id='+a.id,'someone-else')).status,403);assert.equal((await call('kindstand?id=x')).status,400);assert.equal((await call('kindstand?id='+crypto.randomUUID())).status,404);
  assert.equal((await call('kindstand',a.token,{deviceId,staende:[mia]},'https://other.example')).status,403);
  assert.equal((await call('kindstand',a.token,{deviceId:'x',staende:[mia]})).status,400);
  for(const liste of [[],'x',Array(41).fill(mia)])assert.equal((await kind(a.token,liste)).status,400,String(liste.length));
  for(const patch of [{kindKey:''},{kindKey:' '},{kindKey:7},{kindKey:'x'.repeat(121)},{kindKey:'3a/\u0007'},{videoId:''},{videoId:'../x'},{schritt:-1},{schritt:1.5},{schritt:'3'},{max:1000},{schritt:8,max:7},{videoFertig:1},{werkFertig:'ja'},{zeit:-1},{zeit:'gestern'}])
   assert.equal((await kind(a.token,[mia,{...mia,...patch}])).status,400,JSON.stringify(patch));
  assert.equal((await lesen()).find(s=>s.kindKey==='3a/Mia').schritt,5);
 }finally{await mf.dispose();}
});
