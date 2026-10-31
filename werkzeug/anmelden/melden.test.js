import test from 'node:test';
import assert from 'node:assert/strict';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {werk} from './pruefbau.js';

const ORIGIN='https://conradinjoos-lab.github.io';
const neu=()=>new Miniflare(convertV4MiniflareOptions({modules:werk(),compatibilityDate:'2026-10-01',kvNamespaces:['KV'],d1Databases:['FEEDBACK','SAMMLUNG'],
 outboundService:async req=>{assert.equal(new URL(req.url).origin,'https://api.github.com');return Response.json({permissions:{push:req.headers.get('Authorization')==='Bearer lehrer'}})}}));
const senden=(mf,b,origin=ORIGIN)=>mf.dispatchFetch('https://test.example/melden',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(b)});
const liste=async(mf,token='lehrer')=>mf.dispatchFetch('https://test.example/meldungen',{headers:{Origin:ORIGIN,Authorization:'Bearer '+token}});

test('Meldung von einer Vorlage: neue Art, Stand, lange Adresse',async()=>{
 const mf=neu();
 try{
  const lang='/schrittli/vorlagen/stromkreis/#p='+'x'.repeat(900);
  const r=await senden(mf,{art:'mass',text:'Zu breit',app:'Werkzeug',seite:'vorlagen/klasse/',titel:'Klasse',adresse:lang,geraet:'iPad Safari',fenster:'1024×768',stand:'2026-10-31-a166f82 · Inhalt 2026-10-30',erfasst:'2026-10-31T08:15:00.000Z'});
  assert.equal(r.status,200);assert.equal(r.headers.get('Access-Control-Allow-Origin'),ORIGIN);
  const [m]=await (await liste(mf)).json();
  assert.equal(m.art,'mass');assert.equal(m.stand,'2026-10-31-a166f82 · Inhalt 2026-10-30');assert.equal(m.erfasst,'2026-10-31T08:15:00.000Z');assert.equal(m.seite,'vorlagen/klasse/');assert.equal(m.adresse.length,500);assert.equal(m.zeit_video,null);
 }finally{await mf.dispose()}
});
test('Arten und Felder werden begrenzt',async()=>{
 const mf=neu();
 try{
  for(const art of ['video','bild','stopp','text','anderes','mass','druck','anzeige','speichern'])assert.equal((await senden(mf,{art})).status,200);
  assert.equal((await senden(mf,{art:'<b>',stand:'x'.repeat(200),erfasst:'gestern'})).status,200);
  const M=await (await liste(mf)).json();assert.equal(M.length,10);
  assert.deepEqual([...new Set(M.map(m=>m.art))].sort(),['anderes','anzeige','bild','druck','mass','speichern','stopp','text','video']);
  const m=M.find(x=>x.stand);assert.equal(m.art,'anderes');assert.equal(m.stand.length,60);assert.equal(m.erfasst,'');
 }finally{await mf.dispose()}
});
test('Nur eigene Herkunft, Lesen nur mit Schreibrecht',async()=>{
 const mf=neu();
 try{
  assert.equal((await senden(mf,{art:'text'},'https://fremd.example')).status,403);
  assert.equal((await senden(mf,{art:'text'},'http://127.0.0.1:8765')).status,200);
  assert.equal((await liste(mf,'kind')).status,401);
 }finally{await mf.dispose()}
});
test('Eine Adresse darf 200 Meldungen pro Stunde schicken, die 201. wird abgewiesen',async()=>{
 const mf=neu();
 try{
  assert.equal((await senden(mf,{art:'text'})).status,200);
  const kv=await mf.getKVNamespace('KV');const {keys}=await kv.list({prefix:'rl:'});assert.equal(keys.length,1);
  await kv.put(keys[0].name,'198');
  assert.equal((await senden(mf,{art:'text'})).status,200);assert.equal(await kv.get(keys[0].name),'199');
  assert.equal((await senden(mf,{art:'text'})).status,200);assert.equal(await kv.get(keys[0].name),'200');
  const r=await senden(mf,{art:'text'});assert.equal(r.status,429);assert.equal((await r.json()).fehler,'zu viele');
 }finally{await mf.dispose()}
});
