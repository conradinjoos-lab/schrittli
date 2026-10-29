import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {werk} from './pruefbau.js';
import {fileURLToPath} from 'node:url';

test('private feedback in the Workers runtime: roles, audio, retry, revocation, retention',async()=>{
 const mf=new Miniflare(convertV4MiniflareOptions({modules:werk(),compatibilityDate:'2026-10-01',kvNamespaces:['KV'],d1Databases:['FEEDBACK'],
  outboundService:async req=>{
   assert.equal(new URL(req.url).origin,'https://api.github.com');
   const token=req.headers.get('Authorization');
   return Response.json({login:token==='Bearer teacher'?'conradinjoos-lab':'someone-else'},{status:token==='Bearer expired'?401:200});
  }}));
 try{
  const db=await mf.getD1Database('FEEDBACK');
  await db.exec(readFileSync(new URL('migrations/0001_feedback.sql',import.meta.url),'utf8').replaceAll('\n',' '));
  await db.exec(readFileSync(new URL('migrations/0002_feedback_name.sql',import.meta.url),'utf8').replaceAll('\n',' '));
  const call=async(path,token='teacher',body,origin='https://conradinjoos-lab.github.io')=>{const req=new Request('https://feedback.example/feedback/'+path,{method:body?'POST':'GET',headers:{Origin:origin,...(token?{Authorization:'Bearer '+token}:{}),...(body&&!(body instanceof FormData)?{'Content-Type':'application/json'}:{})},body:body instanceof FormData?body:body?JSON.stringify(body):undefined});return mf.dispatchFetch(req.url,{method:req.method,headers:Object.fromEntries(req.headers),body:body?await req.arrayBuffer():undefined});};
  assert.equal((await call('liste','')).status,401);
  assert.equal((await call('liste','other')).status,403);
  assert.equal((await call('liste','teacher',undefined,'https://wrong.example')).status,403);
  assert.equal((await call('liste','expired')).status,401);
  const created=await call('klassen','teacher',{name:'Testklasse'});assert.equal(created.status,201);const k=await created.json();assert.match(k.token,/^[a-f0-9]{64}$/);
  const all=await (await call('klassen')).json();assert.equal(all.klassen[0].name,'Testklasse');assert(!JSON.stringify(all).includes(k.token));assert(!JSON.stringify(all).includes('tokenHash'));
  assert.equal((await call('liste',k.token)).status,401);
  assert.equal((await call('klasse',k.token)).status,200);
  const id=crypto.randomUUID();const data={id,videoId:'flieger-windhover',titel:'Windhover',klasse:1,schwierigkeit:2,spass:3};
  const make=(d=data,bytes=new Uint8Array([0x1a,0x45,0xdf,0xa3,1,2,3]))=>{const f=new FormData();f.append('daten',JSON.stringify(d));if(bytes)f.append('audio',new Blob([bytes],{type:'audio/webm'}),'test.webm');return f;};
  assert.equal((await call('abgeben',k.token,make({...data,spass:0}))).status,400);
  assert.equal((await call('abgeben',k.token,make(data,new Uint8Array([1,2,3])))).status,415);
  assert.equal((await call('abgeben',k.token,make(data,new Uint8Array(1048577)))).status,413);
  const sent=await call('abgeben',k.token,make());assert.equal(sent.status,201,await sent.text());
  assert.equal((await call('abgeben',k.token,make())).status,200);
  const list=await (await call('liste')).json();assert.equal(list.eintraege.length,1);assert.equal(list.eintraege[0].audio,true);assert.equal(list.eintraege[0].klasse,1);
  assert.equal((await call('audio?id='+id,k.token)).status,401);
  const audio=await call('audio?id='+id);assert.equal(audio.headers.get('Content-Type'),'audio/webm');assert.equal(audio.headers.get('Cache-Control'),'no-store');assert.equal((await audio.arrayBuffer()).byteLength,7);
  const k2=await (await call('klassen','teacher',{name:'Zweite Klasse'})).json();
  assert.equal((await call('abgeben',k2.token,make())).status,409);
  assert.equal((await (await call('liste?klasse='+k2.id)).json()).eintraege.length,0);
  await call('loeschen','teacher',{id});assert.equal((await call('audio?id='+id)).status,404);
  await call('abgeben',k.token,make());assert.equal((await (await call('liste')).json()).eintraege.length,0);
  await call('klassen/sperren','teacher',{id:k.id});assert.equal((await call('klasse',k.token)).status,401);assert.equal((await call('abgeben',k.token,make({...data,id:crypto.randomUUID()}))).status,401);
  const expired=crypto.randomUUID();await db.prepare('INSERT INTO feedback(id,klasseId,videoId,titel,klasse,schwierigkeit,spass,zeit) VALUES(?,?,?,?,1,1,1,?)').bind(expired,k2.id,'test','Old',new Date(Date.now()-91*86400000).toISOString()).run();
  assert.equal((await (await call('liste')).json()).eintraege.length,0);
  const worker=await mf.getWorker();await worker.scheduled({scheduledTime:Date.now(),cron:'17 3 * * *'});
  assert.equal(await db.prepare('SELECT id FROM feedback WHERE id=?').bind(expired).first(),null);
  // Pagination must neither skip nor duplicate records sharing a timestamp.
  const time=new Date().toISOString();for(let i=0;i<53;i++)await db.prepare('INSERT INTO feedback(id,klasseId,videoId,titel,klasse,schwierigkeit,spass,zeit) VALUES(?,?,?,?,1,1,1,?)').bind(crypto.randomUUID(),k2.id,'test','Pagination',time).run();
  const first=await (await call('liste')).json(),second=await (await call('liste?cursor='+encodeURIComponent(first.cursor))).json();
  assert.equal(first.eintraege.length,50);assert.equal(second.eintraege.length,3);assert.equal(new Set([...first.eintraege,...second.eintraege].map(x=>x.id)).size,53);
 }finally{await mf.dispose();}
});
