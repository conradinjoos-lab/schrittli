import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';

test('classroom: teacher-only policy, independent groups, device acknowledgement, conflicts, presets and bounded validation',async()=>{
 const mf=new Miniflare(convertV4MiniflareOptions({modules:['worker.js','feedback.js','sammlung.js','unterricht.js','namen.js'].map(name=>({type:'ESModule',path:fileURLToPath(new URL(name,import.meta.url)),contents:readFileSync(new URL(name,import.meta.url),'utf8')})),compatibilityDate:'2026-10-01',kvNamespaces:['KV'],d1Databases:['SAMMLUNG'],outboundService:async req=>Response.json({login:req.headers.get('Authorization')==='Bearer teacher'?'conradinjoos-lab':'someone-else'})}));
 try{
  const db=await mf.getD1Database('SAMMLUNG');for(const name of ['0001_sammlung.sql','0002_unterricht.sql'])await db.exec(readFileSync(new URL('sammlung-migrations/'+name,import.meta.url),'utf8').replaceAll('\n',' '));
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
 }finally{await mf.dispose();}
});
