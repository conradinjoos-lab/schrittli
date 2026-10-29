import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {werk} from './pruefbau.js';

const ORIGIN='https://conradinjoos-lab.github.io';
test('Klassenlisten: Lehrperson pflegt, verbundene iPads lesen',async()=>{
 const mf=new Miniflare(convertV4MiniflareOptions({modules:werk(),compatibilityDate:'2026-10-01',kvNamespaces:['KV'],d1Databases:['FEEDBACK','SAMMLUNG'],
  outboundService:async req=>{
   assert.equal(new URL(req.url).origin,'https://api.github.com');
   return Response.json({login:req.headers.get('Authorization')==='Bearer teacher'?'conradinjoos-lab':'someone-else'});
  }}));
 try{
  const sql=f=>readFileSync(new URL(f,import.meta.url),'utf8').replaceAll('\n',' ');
  const sammlung=await mf.getD1Database('SAMMLUNG');await sammlung.exec(sql('sammlung-migrations/0001_sammlung.sql'));await sammlung.exec(sql('sammlung-migrations/0002_unterricht.sql'));await sammlung.exec(sql('sammlung-migrations/0003_namen.sql'));
  const feedback=await mf.getD1Database('FEEDBACK');await feedback.exec(sql('migrations/0001_feedback.sql'));await feedback.exec(sql('migrations/0002_feedback_name.sql'));
  const call=(pfad,token,body,origin=ORIGIN,method)=>mf.dispatchFetch('https://test.example/'+pfad,{method:method||(body?'POST':'GET'),headers:{Origin:origin,...(token?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});

  // Zugriff
  assert.equal((await call('namen/klassen','teacher',undefined,'https://wrong.example')).status,403);
  assert.equal((await call('namen/klassen','')).status,401);
  assert.equal((await call('namen/klassen','other')).status,403);
  assert.equal((await call('namen/liste','')).status,401);
  assert.equal((await call('namen/liste','a'.repeat(64))).status,401);

  // Anlegen und prüfen
  assert.equal((await call('namen/speichern','teacher',{name:'',namen:[]})).status,400);
  assert.equal((await call('namen/speichern','teacher',{name:'3a',stufe:9,namen:[]})).status,400);
  assert.equal((await call('namen/speichern','teacher',{name:'3a',namen:['Lina','lina']})).status,400);
  assert.equal((await call('namen/speichern','teacher',{name:'3a',namen:['x'.repeat(31)]})).status,400);
  assert.equal((await call('namen/speichern','teacher',{name:'3a',namen:Array.from({length:61},(_,i)=>'Kind'+i)})).status,400);
  const neu=await call('namen/speichern','teacher',{name:' 3a ',stufe:'3',namen:[' Lina ','Noah','','Mia  Sophie']});const k=await neu.json();assert.equal(neu.status,201,JSON.stringify(k));assert.equal(k.name,'3a');assert.equal(k.stufe,3);assert.deepEqual(k.namen,['Lina','Noah','Mia Sophie']);
  const k2=await (await call('namen/speichern','teacher',{name:'Kindergarten',stufe:null,namen:['Elia']})).json();assert.equal(k2.stufe,null);
  const liste=await (await call('namen/klassen','teacher')).json();assert.equal(liste.klassen.length,2);assert.equal(liste.klassen[0].name,'3a');assert.equal(liste.klassen[1].name,'Kindergarten');

  // Ändern und entfernen
  const upd=await call('namen/speichern','teacher',{id:k.id,name:'3a',stufe:4,namen:['Lina','Noah']});assert.equal(upd.status,200);
  assert.equal((await call('namen/speichern','teacher',{id:crypto.randomUUID(),name:'x',namen:[]})).status,404);
  assert.equal((await call('namen/entfernen','teacher',{id:k2.id})).status,200);
  assert.equal((await (await call('namen/klassen','teacher')).json()).klassen.length,1);

  // iPads lesen mit jedem der drei Tokens
  const s=await (await call('sammlung/erstellen','teacher',{name:'Werke 3a'})).json();
  const g=await (await call('unterricht/erstellen','teacher',{name:'iPads 3a'})).json();
  const f=await (await call('feedback/klassen','teacher',{name:'Klasse 3a'})).json();
  for(const t of [s.token,g.token,f.token]){
   const r=await call('namen/liste',t);const j=await r.json();assert.equal(r.status,200,JSON.stringify(j));assert.deepEqual(j.klassen,[{id:k.id,name:'3a',stufe:4,namen:['Lina','Noah']}]);
  }
  await call('sammlung/sperren','teacher',{id:s.id});
  assert.equal((await call('namen/liste',s.token)).status,401);

  // Rückmeldung trägt den Vornamen
  const abgabe=async(daten)=>{const fd=new FormData();fd.append('daten',JSON.stringify(daten));const r=new Request('https://test.example/feedback/abgeben',{method:'POST',body:fd});
   return mf.dispatchFetch(r.url,{method:'POST',headers:{Origin:ORIGIN,Authorization:'Bearer '+f.token,'Content-Type':r.headers.get('Content-Type')},body:await r.arrayBuffer()});};
  const sent=await abgabe({id:crypto.randomUUID(),videoId:'abc',titel:'Papierflieger',klasse:3,schwierigkeit:2,spass:3,name:'Lina'});assert.equal(sent.status,201,await sent.text());
  assert.equal((await abgabe({id:crypto.randomUUID(),videoId:'abc',titel:'Papierflieger',klasse:3,schwierigkeit:2,spass:3,name:'x'.repeat(31)})).status,400);
  const eintraege=(await (await call('feedback/liste','teacher')).json()).eintraege;assert.equal(eintraege.length,1);assert.equal(eintraege[0].name,'Lina');
  await call('feedback/loeschen','teacher',{id:eintraege[0].id});
  const weg=await feedback.prepare('SELECT name FROM feedback WHERE id=?').bind(eintraege[0].id).first();assert.equal(weg.name,null);
 }finally{await mf.dispose();}
});
