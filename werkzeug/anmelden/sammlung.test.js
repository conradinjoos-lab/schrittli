import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {fileURLToPath} from 'node:url';

test('shared collection: two iPads, isolation, ratings, retries, deletion, revocation',async()=>{
 const mf=new Miniflare(convertV4MiniflareOptions({modules:['worker.js','feedback.js','sammlung.js','unterricht.js','namen.js'].map(name=>({type:'ESModule',path:fileURLToPath(new URL(name,import.meta.url)),contents:readFileSync(new URL(name,import.meta.url),'utf8')})),compatibilityDate:'2026-10-01',kvNamespaces:['KV'],d1Databases:['SAMMLUNG'],outboundService:async req=>Response.json({login:req.headers.get('Authorization')==='Bearer teacher'?'conradinjoos-lab':'another'})}));
 try{
  const db=await mf.getD1Database('SAMMLUNG');await db.exec(readFileSync(new URL('sammlung-migrations/0001_sammlung.sql',import.meta.url),'utf8').replaceAll('\n',' '));
  const call=async(path,token='teacher',body,origin='https://conradinjoos-lab.github.io')=>{const r=new Request('https://test.example/sammlung/'+path,{method:body?'POST':'GET',headers:{Origin:origin,Authorization:'Bearer '+token,...(body&&!(body instanceof FormData)?{'Content-Type':'application/json'}:{})},body:body instanceof FormData?body:body?JSON.stringify(body):undefined});return mf.dispatchFetch(r.url,{method:r.method,headers:Object.fromEntries(r.headers),body:body?await r.arrayBuffer():undefined});};
  assert.equal((await call('verwaltung','')).status,401);assert.equal((await call('verwaltung','another')).status,403);
  assert.equal((await call('verwaltung','teacher',undefined,'https://bad.example')).status,403);
  const create=await call('erstellen','teacher',{name:'Unsere Schule'});assert.equal(create.status,201,await create.clone().text());const k=await create.json();
  const k2=await (await call('erstellen','teacher',{name:'Andere Schule'})).json();
  assert.equal((await call('verwaltung',k.token)).status,401);
  assert.equal((await call('verbinden',k.token)).status,200);
  const id=crypto.randomUUID(),data={id,videoId:'flieger-windhover',titel:'Windhover',name:'Mia',klasse:2,sterne:4};
  const jpeg=new Uint8Array([255,216,255,224,0,0,255,217]);
  const form=(patch={},bytes=jpeg)=>{const f=new FormData();f.append('daten',JSON.stringify({...data,...patch}));f.append('foto',new Blob([bytes],{type:'image/jpeg'}),'werk.jpg');return f;};
  for(const sterne of [0,6,2.5,'5',null])assert.equal((await call('abgeben',k.token,form({sterne}))).status,400);
  assert.equal((await call('abgeben',k.token,form({name:''}))).status,400);
  assert.equal((await call('abgeben',k.token,form({},new Uint8Array([1,2,3])))).status,415);
  assert.equal((await call('abgeben',k.token,form({},new Uint8Array(600001)))).status,413);
  const saved=await call('abgeben',k.token,form());assert.equal(saved.status,201,await saved.clone().text());
  assert.equal((await call('abgeben',k.token,form())).status,200);
  const secondTablet=await (await call('werke',k.token)).json();assert.equal(secondTablet.werke.length,1);assert.equal(secondTablet.werke[0].name,'Mia');assert.equal(secondTablet.werke[0].sterne,4);
  assert.equal((await (await call('werke?version='+secondTablet.version,k.token)).json()).unveraendert,true);
  assert.equal((await (await call('werke',k2.token)).json()).werke.length,0);
  assert.equal((await call('foto?id='+id,k2.token)).status,404);
  assert.equal((await call('abgeben',k2.token,form())).status,409);
  const photo=await call('foto?id='+id,k.token);assert.equal(photo.status,200);assert.equal(photo.headers.get('Content-Type'),'image/jpeg');assert.equal(photo.headers.get('Cache-Control'),'no-store');assert.equal((await photo.arrayBuffer()).byteLength,8);
  assert.equal((await call('loeschen',k.token,{id})).status,401);
  await call('loeschen','teacher',{id});assert.equal((await call('foto?id='+id,k.token)).status,404);
  const retry=await (await call('abgeben',k.token,form())).json();assert.equal(retry.geloescht,true);
  const deleted=await (await call('werke?version='+secondTablet.version,k.token)).json();assert.equal(deleted.werke.length,0);assert(deleted.geloescht.includes(id));assert(deleted.version>secondTablet.version);
  await call('sperren','teacher',{id:k.id});assert.equal((await call('werke',k.token)).status,401);assert.equal((await call('abgeben',k.token,form({id:crypto.randomUUID()}))).status,401);
  assert.equal((await call('werke',k2.token)).status,200);
 }finally{await mf.dispose();}
});
