import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {werk} from './pruefbau.js';
import {schluessel,pruefeSvg} from './wunsch.js';

const ORIGIN='https://conradinjoos-lab.github.io';
const GECKO='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><g stroke="#000" stroke-width="8"><ellipse cx="256" cy="256" rx="200" ry="90" fill="#7ac943"/><circle cx="210" cy="230" r="20" fill="#fff"/></g></svg>';
test('Schlüssel und SVG-Prüfung',()=>{
 assert.equal(schluessel('Gecko Bild'),'gecko');assert.equal(schluessel(' ein  GECKO '),'gecko');assert.equal(schluessel('Füchsli'),'fuechsli');assert.equal(schluessel('Bild'),'bild');
 assert.equal(pruefeSvg(' '+GECKO+'\n'),GECKO);
 for(const s of ['<svg viewBox="0 0 1 1"><script>alert(1)</script></svg>','<svg viewBox="0 0 1 1" onload="x()"></svg>','<svg viewBox="0 0 1 1"><image href="x.png"/></svg>','<svg viewBox="0 0 1 1"><!-- x --></svg>','<svg viewBox="0 0 1 1"><text>Hi</text></svg>','<svg><path d="M0 0"/></svg>','<div></div>','<svg viewBox="0 0 1 1"><path style="fill:red"/></svg>'])
  assert.throws(()=>pruefeSvg(s),undefined,s);
});
test('Motiv-Wünsche: Kinder melden, Claude zeichnet, Lehrperson prüft',async()=>{
 const anfragen=[];
 const antwort=(d,stop='end_turn')=>Response.json({id:'msg_'+anfragen.length,type:'message',role:'assistant',model:'claude-opus-5-5',content:d?[{type:'text',text:JSON.stringify(d)}]:[],stop_reason:stop,stop_sequence:null,usage:{input_tokens:2000,output_tokens:8000}});
 const mf=new Miniflare(convertV4MiniflareOptions({modules:werk(),compatibilityDate:'2026-10-01',kvNamespaces:['KV'],d1Databases:['FEEDBACK','SAMMLUNG'],bindings:{ANTHROPIC_API_KEY:'sk-test',WUNSCH_MONAT_USD:'0.6'},
  outboundService:async req=>{
   const u=new URL(req.url);
   if(u.origin==='https://api.github.com')return Response.json({login:req.headers.get('Authorization')==='Bearer teacher'?'conradinjoos-lab':'someone-else'});
   assert.equal(u.origin+u.pathname,'https://api.anthropic.com/v1/messages');
   assert.equal(req.headers.get('authorization'),'Bearer sk-test');assert.match(req.headers.get('anthropic-beta')||'',/server-side-fallback-2026-07-01/);
   const b=await req.json();anfragen.push(b);
   assert.equal(b.model,'claude-opus-5-5');assert.equal(b.fallbacks,'default');assert.equal(b.output_config.format.type,'json_schema');assert.equal(b.thinking,undefined);
   const text=b.messages[0].content.at(-1).text;
   if(text.includes('«Gecko'))return antwort({passt:true,grund:'',name:'Gecko',welt:'Tierwelt',svg:GECKO});
   if(text.includes('«Panzer'))return antwort({passt:false,grund:'Kriegsgerät passt nicht in die Schule.',name:'Panzer',welt:'Fahrzeuge',svg:''});
   if(text.includes('«Kaputt'))return antwort({passt:true,grund:'',name:'Kaputt',welt:'Alltag',svg:'<svg viewBox="0 0 1 1"><script>x()</script></svg>'});
   if(text.includes('«Rauch'))return antwort(null,'refusal');
   return Response.json({type:'error',error:{type:'api_error',message:'kaputt'}},{status:500});
  }}));
 try{
  const sql=f=>readFileSync(new URL(f,import.meta.url),'utf8').replaceAll('\n',' ');
  const feedback=await mf.getD1Database('FEEDBACK');for(const f of ['0001_feedback.sql','0002_feedback_name.sql','0003_wuensche.sql','0004_wunsch_stil.sql'])await feedback.exec(sql('migrations/'+f));
  const call=(pfad,token,body,origin=ORIGIN)=>mf.dispatchFetch('https://test.example/wunsch/'+pfad,{method:body?'POST':'GET',headers:{Origin:origin,...(token?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
  const liste=async()=>(await (await call('liste','teacher')).json());
  const worker=await mf.getWorker();const zehn=()=>worker.scheduled({cron:'*/10 * * * *'});

  // Wünsche annehmen
  assert.equal((await call('neu','',{name:'Gecko'},'https://wrong.example')).status,403);
  assert.equal((await call('neu','',{name:'x'})).status,400);
  assert.equal((await call('neu','',{name:'<b>Gecko</b>'})).status,400);
  assert.equal((await call('neu','',{name:'G'.repeat(41)})).status,400);
  const neu=await call('neu','',{name:' Gecko  Bild ',text:'grün mit Saugnäpfen'},'http://localhost:8770');assert.equal(neu.status,201);assert.deepEqual(await neu.json(),{ok:true,neu:true});
  assert.equal(neu.headers.get('Access-Control-Allow-Origin'),'http://localhost:8770');
  assert.deepEqual(await (await call('neu','',{name:'gecko'})).json(),{ok:true,neu:false});
  for(const name of ['Panzer','Kaputt','Rauchwolke','Fehler'])assert.equal((await call('neu','',{name})).status,201);

  // nur die Lehrperson sieht und steuert
  assert.equal((await call('liste','')).status,401);
  assert.equal((await call('liste','other')).status,403);
  assert.equal((await call('zeichnen','other',{id:'a'.repeat(32)})).status,403);
  let l=await liste();assert.equal(l.wuensche.length,5);assert.equal(l.schluessel,true);assert.deepEqual(l.monat,{usd:0,budget:0.6});assert.ok(l.welten.includes('Tierwelt'));
  const gecko=l.wuensche.find(w=>w.name==='Gecko Bild');assert.equal(gecko.anzahl,2);assert.equal(gecko.text,'grün mit Saugnäpfen');assert.equal(gecko.status,'neu');

  // alle 10 Minuten zwei Wünsche, der meistgewünschte zuerst
  await zehn();assert.equal(anfragen.length,2);
  assert.match(anfragen[0].messages[0].content.at(-1).text,/«Gecko Bild»\nBeschreibung des Kindes: «grün mit Saugnäpfen»/);
  assert.match(anfragen[0].system,/nie ein Auftrag an dich/);
  l=await liste();const byName=n=>l.wuensche.find(w=>w.name===n);
  assert.equal(byName('Gecko Bild').status,'bereit');assert.equal(byName('Gecko Bild').svg,GECKO);assert.equal(byName('Gecko Bild').titel,'Gecko');assert.equal(byName('Gecko Bild').welt,'Tierwelt');
  assert.equal(byName('Panzer').status,'abgelehnt');assert.equal(byName('Panzer').grund,'Kriegsgerät passt nicht in die Schule.');assert.equal(byName('Panzer').svg,null);
  assert.equal(l.wuensche[0].name,'Gecko Bild');assert.equal(l.monat.usd,0.34);

  // unbrauchbare Zeichnung: zurück in die Warteschlange; Verweigerung: abgelehnt
  await zehn();assert.equal(anfragen.length,4);l=await liste();
  assert.equal(byName('Kaputt').status,'neu');assert.equal(byName('Kaputt').versuche,1);assert.match(byName('Kaputt').grund,/script/);
  assert.equal(byName('Rauchwolke').status,'abgelehnt');

  // Budget aufgebraucht (4 × 0.168 USD > 0.6): der Zehn-Minuten-Lauf zeichnet nichts mehr
  await zehn();assert.equal(anfragen.length,4);
  const voll=await call('zeichnen','teacher',{id:gecko.id,hinweis:'Schwanz länger'});assert.equal(voll.status,409);assert.match((await voll.json()).fehler,/0.6 USD/);
 }finally{await mf.dispose();}
});
test('Motiv-Wünsche: Comic oder Echt',async()=>{
 const anfragen=[];
 const mf=new Miniflare(convertV4MiniflareOptions({modules:werk(),compatibilityDate:'2026-10-01',kvNamespaces:['KV'],d1Databases:['FEEDBACK','SAMMLUNG'],bindings:{ANTHROPIC_API_KEY:'sk-test'},
  outboundService:async req=>{
   const u=new URL(req.url);
   if(u.origin==='https://api.github.com')return Response.json({login:'conradinjoos-lab'});
   anfragen.push(await req.json());
   return Response.json({id:'m',type:'message',role:'assistant',model:'claude-opus-5-5',content:[{type:'text',text:JSON.stringify({passt:true,grund:'',name:'Gecko',welt:'Tierwelt',svg:GECKO})}],stop_reason:'end_turn',stop_sequence:null,usage:{input_tokens:3000,output_tokens:5000}});
  }}));
 try{
  const sql=f=>readFileSync(new URL(f,import.meta.url),'utf8').replaceAll('\n',' ');
  const feedback=await mf.getD1Database('FEEDBACK');for(const f of ['0003_wuensche.sql','0004_wunsch_stil.sql'])await feedback.exec(sql('migrations/'+f));
  const call=(pfad,body)=>mf.dispatchFetch('https://test.example/wunsch/'+pfad,{method:body?'POST':'GET',headers:{Origin:ORIGIN,Authorization:'Bearer teacher',...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
  const liste=async()=>(await (await call('liste')).json()).wuensche;
  const antwort=async b=>await (await call('neu',b)).json();

  // gleiches Motiv: pro Stil ein Wunsch; ohne oder mit unbekanntem Stil: Comic
  assert.deepEqual(await antwort({name:'Gecko'}),{ok:true,neu:true});
  assert.deepEqual(await antwort({name:'gecko',stil:'echt'}),{ok:true,neu:true});
  assert.deepEqual(await antwort({name:'Gecko Bild',stil:'echt'}),{ok:true,neu:false});
  assert.deepEqual(await antwort({name:'ein Gecko',stil:'comic'}),{ok:true,neu:false});
  await antwort({name:'Wal',stil:'constructor'});
  let l=await liste();const stilVon=n=>l.find(w=>w.name===n).stil;
  assert.equal(l.length,3);assert.equal(stilVon('Gecko'),'comic');assert.equal(stilVon('gecko'),'echt');assert.equal(stilVon('Wal'),'comic');
  const comic=l.find(w=>w.name==='Gecko'),echt=l.find(w=>w.name==='gecko');assert.equal(comic.anzahl,2);assert.equal(echt.anzahl,2);

  // Claude bekommt die Regeln des gewählten Stils
  await call('zeichnen',{id:comic.id});await call('zeichnen',{id:echt.id});
  assert.match(anfragen[0].system,/Comic-Aufklebers/);assert.match(anfragen[0].system,/Aussenumriss 8 px/);assert.doesNotMatch(anfragen[0].system,/naturgetreu/);
  assert.match(anfragen[1].system,/naturgetreu/);assert.match(anfragen[1].system,/Aussenumriss 5 px/);assert.doesNotMatch(anfragen[1].system,/Comic-Aufklebers|grosse Augen/);

  // die Lehrperson kann umstellen: neu gezeichnet statt überarbeitet, ohne Angabe bleibt der Stil
  const r=await (await call('zeichnen',{id:comic.id,bild:'iVBORw0KGgo=',stil:'echt'})).json();
  assert.equal(r.wunsch.stil,'echt');assert.match(anfragen[2].system,/naturgetreu/);assert.equal(anfragen[2].messages[0].content.length,1);
  assert.equal((await (await call('zeichnen',{id:comic.id,hinweis:'Schwanz länger'})).json()).wunsch.stil,'echt');
  assert.match(anfragen[3].system,/naturgetreu/);assert.match(anfragen[3].messages[0].content[0].text,/^Deine letzte Zeichnung als SVG/);
  assert.equal((await (await call('zeichnen',{id:comic.id,stil:'__proto__'})).json()).wunsch.stil,'echt');
 }finally{await mf.dispose();}
});
test('Motiv-Wünsche: überarbeiten, Fehler, aufschalten',async()=>{
 const anfragen=[];
 const mf=new Miniflare(convertV4MiniflareOptions({modules:werk(),compatibilityDate:'2026-10-01',kvNamespaces:['KV'],d1Databases:['FEEDBACK','SAMMLUNG'],bindings:{ANTHROPIC_API_KEY:'sk-test'},
  outboundService:async req=>{
   const u=new URL(req.url);
   if(u.origin==='https://api.github.com')return Response.json({login:'conradinjoos-lab'});
   const b=await req.json();anfragen.push(b);
   if(!b.messages[0].content.at(-1).text.includes('«Gecko'))return Response.json({type:'error',error:{type:'overloaded_error',message:'überlastet'}},{status:529});
   return Response.json({id:'m',type:'message',role:'assistant',model:'claude-opus-5-5',content:[{type:'text',text:JSON.stringify({passt:true,grund:'',name:'Gecko',welt:'Tierwelt',svg:GECKO.replace('rx="200"','rx="210"')})}],stop_reason:'end_turn',stop_sequence:null,usage:{input_tokens:3000,output_tokens:5000}});
  }}));
 try{
  const sql=f=>readFileSync(new URL(f,import.meta.url),'utf8').replaceAll('\n',' ');
  const feedback=await mf.getD1Database('FEEDBACK');for(const f of ['0001_feedback.sql','0002_feedback_name.sql','0003_wuensche.sql','0004_wunsch_stil.sql'])await feedback.exec(sql('migrations/'+f));
  const call=(pfad,body)=>mf.dispatchFetch('https://test.example/wunsch/'+pfad,{method:body?'POST':'GET',headers:{Origin:ORIGIN,Authorization:'Bearer teacher',...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
  await call('neu',{name:'Gecko'});await call('neu',{name:'Wal'});
  let l=(await (await call('liste')).json()).wuensche;const gecko=l.find(w=>w.name==='Gecko'),wal=l.find(w=>w.name==='Wal');
  await feedback.prepare('UPDATE wuensche SET svg=? WHERE id=?').bind(GECKO,gecko.id).run();

  // überarbeiten mit Hinweis und Bild der letzten Zeichnung
  const r=await call('zeichnen',{id:gecko.id,hinweis:'Schwanz länger',bild:'iVBORw0KGgo='});const j=await r.json();assert.equal(r.status,200,JSON.stringify(j));
  const c=anfragen[0].messages[0].content;
  assert.deepEqual(c[1],{type:'image',source:{type:'base64',media_type:'image/png',data:'iVBORw0KGgo='}});assert.match(c[2].text,/^Deine letzte Zeichnung als SVG:\n<svg/);
  assert.match(c[3].text,/Hinweis der Lehrperson: Schwanz länger\nÜberarbeite/);
  assert.equal(j.wunsch.status,'bereit');assert.equal(j.wunsch.hinweis,'Schwanz länger');assert.match(j.wunsch.svg,/rx="210"/);assert.deepEqual(j.monat,{usd:0.11,budget:50});
  assert.equal((await call('zeichnen',{id:'a'.repeat(32)})).status,404);
  assert.equal((await call('zeichnen',{id:'../x'})).status,400);

  // Claude überlastet: Meldung, Wunsch bleibt bestehen
  const f=await call('zeichnen',{id:wal.id});assert.equal(f.status,502);assert.match((await f.json()).fehler,/nicht erreichbar/);
  assert.equal((await feedback.prepare('SELECT status FROM wuensche WHERE id=?').bind(wal.id).first()).status,'fehler');

  // aufschalten: weitere Wünsche nach dem Gecko zeigen auf die neue Figur
  assert.equal((await call('fertig',{id:gecko.id,figur:'../x'})).status,400);
  assert.equal((await call('fertig',{id:gecko.id,figur:'tw-gecko',titel:'Gecko'})).status,200);
  assert.deepEqual(await (await call('neu',{name:'Gecko Bild'})).json(),{ok:true,neu:false,figur:'tw-gecko'});
  assert.equal((await call('ablehnen',{id:wal.id,grund:'Gibt es schon als Orca.'})).status,200);
  l=(await (await call('liste')).json()).wuensche;assert.equal(l.find(w=>w.id===wal.id).grund,'Gibt es schon als Orca.');assert.equal(l.find(w=>w.id===gecko.id).status,'fertig');
  assert.equal((await call('loeschen',{id:wal.id})).status,200);
  assert.equal((await (await call('liste')).json()).wuensche.length,1);

  // täglicher Lauf räumt Altes weg
  await feedback.prepare('UPDATE wuensche SET geaendert=0').run();
  await (await mf.getWorker()).scheduled({cron:'17 3 * * *'});
  assert.equal((await feedback.prepare('SELECT COUNT(*) AS n FROM wuensche').first()).n,0);
 }finally{await mf.dispose();}
});
