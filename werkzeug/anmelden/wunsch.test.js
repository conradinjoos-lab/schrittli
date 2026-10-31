import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {werk} from './pruefbau.js';
import {schluessel,pruefeSvg} from './wunsch.js';
import {bildArt,bildMasse,pruefeUrl,seitenBilder,alsBase64} from './bildsuche.js';

const ORIGIN='https://conradinjoos-lab.github.io';
const PNG=(b,h)=>{const a=new Uint8Array(40);a.set([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);const d=new DataView(a.buffer);d.setUint32(16,b);d.setUint32(20,h);return a;};
test('Bildsuche: Dateiköpfe, Adressen und Bilder einer Seite',()=>{
 assert.equal(bildArt(PNG(1,1)),'image/png');assert.equal(bildArt(new Uint8Array([0xff,0xd8,0xff,0xe0])),'image/jpeg');assert.equal(bildArt(new TextEncoder().encode('RIFF0000WEBP')),'image/webp');
 assert.equal(bildArt(new TextEncoder().encode('<svg onload="x()"></svg>')),null);
 assert.deepEqual(bildMasse(PNG(800,600),'image/png'),[800,600]);
 const jpeg=new Uint8Array([0xff,0xd8,0xff,0xe0,0,4,0,0,0xff,0xc0,0,11,8,1,0x90,2,0x58,3,0,0,0,0]);assert.deepEqual(bildMasse(jpeg,'image/jpeg'),[600,400]);
 for(const u of ['file:///etc/passwd','http://localhost/x.png','http://127.0.0.1/x.png','http://[::1]/x.png','http://a:b@verein.example/','ftp://verein.example/x.png','keine adresse'])assert.equal(pruefeUrl(u),null,u);
 assert.equal(pruefeUrl('https://verein.example/a.png'),'https://verein.example/a.png');
 const html=`<head><meta property="og:image" content="https://verein.example/og.jpg"><link rel="apple-touch-icon" href="/touch.png"><link rel="icon" href="/fav.png"><link rel="icon" href="/fav.svg">
  <script type="application/ld+json">{"logo":{"@type":"ImageObject","url":"https:\\/\\/verein.example\\/schema.png"}}</script></head>
  <body><img src="team.jpg"><img class="site-logo" src="/k.png?a=1&amp;b=2" srcset="/k.png 1x, /gross.png 2x"><img src="data:image/png;base64,AAAA"><img alt="Vereinswappen" data-src="/wappen.webp"></body>`;
 assert.deepEqual(seitenBilder(html,'https://verein.example/klub/'),['https://verein.example/gross.png','https://verein.example/wappen.webp','https://verein.example/schema.png','https://verein.example/touch.png','https://verein.example/og.jpg','https://verein.example/fav.png','https://verein.example/klub/team.jpg']);
 assert.equal(alsBase64(new TextEncoder().encode('Hallo')),'SGFsbG8=');
});
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
  const feedback=await mf.getD1Database('FEEDBACK');for(const f of ['0001_feedback.sql','0002_feedback_name.sql','0003_wuensche.sql','0004_wunsch_stil.sql','0005_wunsch_bilder.sql'])await feedback.exec(sql('migrations/'+f));
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
  assert.match(anfragen[0].system,/bekannte Persönlichkeiten wie Musiker/);assert.doesNotMatch(anfragen[0].system,/echte Personen|Promis/);
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
 const anfragen=[],geholt=[],LOGO=PNG(512,512),WERKZEUG={web_search_20260209:'web_search'};
 const claude=(content,stop='end_turn')=>Response.json({id:'m',type:'message',role:'assistant',model:'claude-opus-5-5',content,stop_reason:stop,stop_sequence:null,usage:{input_tokens:3000,output_tokens:5000,server_tool_use:{web_search_requests:1}}});
 const werkzeug=(name,input)=>({type:'tool_use',id:'tu_'+name,name,input});
 const mf=new Miniflare(convertV4MiniflareOptions({modules:werk(),compatibilityDate:'2026-10-01',kvNamespaces:['KV'],d1Databases:['FEEDBACK','SAMMLUNG'],bindings:{ANTHROPIC_API_KEY:'sk-test'},
  outboundService:async req=>{
   const u=new URL(req.url);
   if(u.origin==='https://api.github.com')return Response.json({login:'conradinjoos-lab'});
   if(u.hostname==='verein.example'){
    geholt.push(u.pathname);
    if(u.pathname==='/')return new Response('<img class="logo" src="/logo.png"><img src="/klein.png"><img src="/bild.svg">',{headers:{'Content-Type':'text/html'}});
    if(u.pathname==='/logo.png')return new Response(LOGO);
    if(u.pathname==='/klein.png')return new Response(PNG(32,32));
    return new Response('<svg/>');
   }
   if(u.hostname.endsWith('wikipedia.org'))return Response.json({query:{pages:{1:{index:1,fullurl:'https://de.wikipedia.org/wiki/Gecko',thumbnail:{source:'https://upload.wikimedia.org/foto.png'}}}}});
   if(u.hostname==='commons.wikimedia.org')return Response.json({});
   if(u.hostname==='upload.wikimedia.org'){geholt.push(u.pathname);return new Response(PNG(960,640));}
   const b=await req.json();anfragen.push(b);
   if(!b.tools)return claude([{type:'text',text:JSON.stringify({passt:true,grund:'',name:'Gecko',welt:'Tierwelt',svg:GECKO})}]);
   const text=b.messages[0].content[0].text,letzte=b.messages.at(-1);
   if(text.includes('«Panzer'))return claude([werkzeug('fertig',{passt:false,grund:'Passt nicht.',name:'Panzer',welt:'Fahrzeuge',bilder:[]})],'tool_use');
   if(text.includes('«Rauch'))return claude([],'refusal');
   if(text.includes('«Nichts'))return claude([werkzeug('fertig',{passt:true,grund:'',name:'Nichts',welt:'Alltag',bilder:[]})],'tool_use');
   if(text.includes('«Verein')){
    if(b.messages.length===1)return claude([{type:'server_tool_use',id:'st',name:'web_search',input:{query:'Verein'}}],'pause_turn');
    if(b.messages.length===2)return claude([werkzeug('bilder',{seiten:['https://verein.example/','http://localhost/x.png'],suche:[]})],'tool_use');
    return claude([werkzeug('fertig',{passt:true,grund:'',name:'Verein Muster',welt:'Fussball',bilder:[1,1,9]})],'tool_use');
   }
   if(text.includes('«Plauderi')&&b.messages.length===1)return claude([{type:'text',text:'Ich schaue nach.'}]);
   if(letzte.content[0].type==='tool_result')return claude([werkzeug('fertig',{passt:true,grund:'',name:'Gecko',welt:'Tierwelt',bilder:[1]})],'tool_use');
   return claude([{type:'text',text:'Ich suche.'},werkzeug('bilder',{seiten:[],suche:['Gecko']})],'tool_use');
  }}));
 try{
  const sql=f=>readFileSync(new URL(f,import.meta.url),'utf8').replaceAll('\n',' ');
  const feedback=await mf.getD1Database('FEEDBACK');for(const f of ['0003_wuensche.sql','0004_wunsch_stil.sql'])await feedback.exec(sql('migrations/'+f));
  // bisher gezeichnete Echt-Wünsche werden neu gesucht, Comic bleibt, Aufgeschaltetes auch
  const alt=(id,stil,status)=>feedback.prepare("INSERT INTO wuensche(id,schluessel,name,stil,status,svg,erstellt,geaendert) VALUES (?,?,?,?,?,?,1,1)").bind(id.repeat(32),id,id,stil,status,GECKO).run();
  await alt('a','echt','bereit');await alt('b','comic','bereit');await alt('c','echt','fertig');
  await feedback.exec(sql('migrations/0005_wunsch_bilder.sql'));
  assert.deepEqual((await feedback.prepare("SELECT status,svg IS NULL AS leer FROM wuensche ORDER BY id").all()).results,[{status:'neu',leer:1},{status:'bereit',leer:0},{status:'fertig',leer:0}]);
  await feedback.exec('DELETE FROM wuensche;');
  const call=(pfad,body)=>mf.dispatchFetch('https://test.example/wunsch/'+pfad,{method:body?'POST':'GET',headers:{Origin:ORIGIN,Authorization:'Bearer teacher',...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
  const liste=async()=>(await (await call('liste')).json()).wuensche;
  const antwort=async b=>await (await call('neu',b)).json();
  const zeichnen=async b=>await (await call('zeichnen',b)).json();

  // gleiches Motiv: pro Stil ein Wunsch; ohne oder mit unbekanntem Stil: Comic
  assert.deepEqual(await antwort({name:'Gecko'}),{ok:true,neu:true});
  assert.deepEqual(await antwort({name:'gecko',stil:'echt'}),{ok:true,neu:true});
  assert.deepEqual(await antwort({name:'Gecko Bild',stil:'echt'}),{ok:true,neu:false});
  assert.deepEqual(await antwort({name:'ein Gecko',stil:'comic'}),{ok:true,neu:false});
  await antwort({name:'Wal',stil:'constructor'});
  let l=await liste();const stilVon=n=>l.find(w=>w.name===n).stil;
  assert.equal(l.length,3);assert.equal(stilVon('Gecko'),'comic');assert.equal(stilVon('gecko'),'echt');assert.equal(stilVon('Wal'),'comic');
  const comic=l.find(w=>w.name==='Gecko'),echt=l.find(w=>w.name==='gecko');assert.equal(comic.anzahl,2);assert.equal(echt.anzahl,2);

  // Comic wird gezeichnet, ohne Werkzeuge
  const c=await zeichnen({id:comic.id});
  assert.match(anfragen[0].system,/Comic-Aufklebers/);assert.match(anfragen[0].system,/Aussenumriss 8 px/);assert.equal(anfragen[0].tools,undefined);
  assert.equal(c.wunsch.svg,GECKO);assert.deepEqual(c.wunsch.bilder,[]);

  // Echt wird gesucht: Claude sieht das Bild selbst, gespeichert wird das Bild und keine Zeichnung
  const e=await zeichnen({id:echt.id}),s=anfragen[1];
  assert.match(s.system,/echte Bilder/);assert.doesNotMatch(s.system,/Comic-Aufklebers|Aussenumriss/);assert.equal(s.output_config.format,undefined);assert.equal(s.thinking,undefined);
  assert.deepEqual(s.tools.map(t=>t.name),['web_search','bilder','fertig']);assert.equal(s.tools[0].type,'web_search_20260209');
  const gesehen=anfragen[2].messages.at(-1).content;assert.equal(gesehen.length,1);assert.equal(gesehen[0].tool_use_id,'tu_bilder');
  assert.equal(gesehen[0].content[0].text,'Bild 1: https://upload.wikimedia.org/foto.png');assert.equal(gesehen[0].content[1].source.media_type,'image/png');assert.equal(gesehen[0].content[1].source.data,alsBase64(PNG(960,640)));
  assert.equal(e.wunsch.status,'bereit');assert.equal(e.wunsch.svg,null);assert.deepEqual(e.wunsch.bilder,[{url:'https://upload.wikimedia.org/foto.png',seite:'https://de.wikipedia.org/wiki/Gecko'}]);

  // Vereinslogo: Unterbruch der Websuche, Website statt Lexikon; zu Kleines, SVG und lokale Adressen fallen weg, doppelte und erfundene Nummern auch
  await antwort({name:'Verein Muster',stil:'echt'});const verein=(await liste()).find(w=>w.name==='Verein Muster'),vor=anfragen.length;
  await zeichnen({id:verein.id});
  assert.equal(anfragen[vor+1].messages.at(-1).role,'assistant');
  assert.equal(anfragen[vor+2].messages.at(-1).content[0].content.filter(b=>b.type==='image').length,1);
  assert.deepEqual(geholt.filter(p=>p.startsWith('/')&&p!=='/foto.png'),['/','/logo.png','/klein.png']);
  const v=(await liste()).find(w=>w.id===verein.id);assert.equal(v.titel,'Verein Muster');assert.equal(v.welt,'Fussball');assert.deepEqual(v.bilder,[{url:'https://verein.example/logo.png',seite:'https://verein.example/'}]);

  // das Bild kommt nur über die Liste des Wunschs, nie von einer beliebigen Adresse
  const b=await call('bild?id='+verein.id+'&n=0');assert.equal(b.status,200);assert.equal(b.headers.get('Content-Type'),'image/png');assert.deepEqual(new Uint8Array(await b.arrayBuffer()),LOGO);
  assert.equal(b.headers.get('Access-Control-Allow-Origin'),ORIGIN);
  assert.equal((await call('bild?id='+verein.id+'&n=1')).status,404);assert.equal((await call('bild?id=x&n=0')).status,400);
  assert.equal((await mf.dispatchFetch('https://test.example/wunsch/bild?id='+verein.id+'&n=0',{headers:{Origin:ORIGIN}})).status,401);

  // Claude antwortet ohne Werkzeug: es wird daran erinnert; kein Treffer: Fehler ohne Wiederholung und nie eine Zeichnung; Unpassendes: abgelehnt
  for(const name of ['Plauderi','Nichts','Panzer','Rauchwolke'])await antwort({name,stil:'echt'});
  const worker=await mf.getWorker();for(let i=0;i<4;i++)await worker.scheduled({cron:'*/10 * * * *'});   // pro Lauf eine Suche
  l=await liste();const von=n=>l.find(w=>w.name===n);
  assert.equal(von('Plauderi').status,'bereit');
  assert.equal(von('Nichts').status,'fehler');assert.equal(von('Nichts').grund,'⚠ Kein Bild');assert.equal(von('Nichts').svg,null);assert.equal(von('Nichts').versuche,1);
  assert.equal(von('Panzer').status,'abgelehnt');assert.equal(von('Panzer').grund,'Passt nicht.');assert.equal(von('Rauchwolke').status,'abgelehnt');
  const n=anfragen.length;await worker.scheduled({cron:'*/10 * * * *'});assert.equal(anfragen.length,n);

  // die Lehrperson kann umstellen: was nicht mehr passt, verschwindet; ohne Angabe bleibt der Stil
  const r=await zeichnen({id:comic.id,bild:'iVBORw0KGgo=',stil:'echt'});
  assert.equal(r.wunsch.stil,'echt');assert.equal(r.wunsch.svg,null);assert.equal(r.wunsch.bilder.length,1);
  assert.equal((await zeichnen({id:comic.id,hinweis:'Von der Seite'})).wunsch.stil,'echt');
  assert.match(anfragen.at(-1).messages[0].content[0].text,/Hinweis der Lehrperson: Von der Seite/);
  assert.equal((await zeichnen({id:comic.id,stil:'__proto__'})).wunsch.stil,'echt');
  const z=await zeichnen({id:comic.id,stil:'comic'});
  assert.equal(z.wunsch.stil,'comic');assert.equal(z.wunsch.svg,GECKO);assert.deepEqual(z.wunsch.bilder,[]);
  const u=(await feedback.prepare('SELECT usd FROM wunsch_kosten LIMIT 1 OFFSET 1').first()).usd;assert.ok(Math.abs(u-0.122)<1e-9,String(u));   // zweite Buchung: Suche mit 1 Websuche
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
  const feedback=await mf.getD1Database('FEEDBACK');for(const f of ['0001_feedback.sql','0002_feedback_name.sql','0003_wuensche.sql','0004_wunsch_stil.sql','0005_wunsch_bilder.sql'])await feedback.exec(sql('migrations/'+f));
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
