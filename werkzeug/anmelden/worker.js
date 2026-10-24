/* Schrittli – Anmelden: «Mit GitHub anmelden» für die Online-Kontrolle (Cloudflare Worker, siehe werkzeug/LIESMICH.md).
   Hält Client-ID und Geheimnis der GitHub App «Schrittli Kontrolle», damit niemand einen Schlüssel einfügen muss.
   /einrichten        einmalig: legt die GitHub App per Manifest an, merkt sich Client-ID und Geheimnis im KV
   /login             leitet zu GitHub; zurück kommt nur ein Abholschein (60 s gültig), nie der Schlüssel selbst
   /abholen  (POST)   Abholschein gegen Schlüssel tauschen
   /erneuern (POST)   frischer Schlüssel mit dem Refresh-Token (GitHub-App-Schlüssel laufen nach 8 h ab) */
const SEITE='https://conradinjoos-lab.github.io',PFAD=/^\/schrittli\/kontrolle\/[\w.\-]*(\?[\w=&%.\-]*)?$/,STATE=/^[\w-]{16,64}$/;

const html=(b,code=200)=>new Response(`<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width"><title>Schrittli – Anmelden</title>
<body style="font:16px/1.5 system-ui,sans-serif;max-width:560px;margin:40px auto;padding:0 16px;color:#17212F">${b}`,{status:code,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
const json=(d,code=200)=>new Response(JSON.stringify(d),{status:code,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':SEITE,'Cache-Control':'no-store'}});
const esc=s=>String(s).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const zufall=()=>crypto.randomUUID().replace(/-/g,'');

async function token(app,felder){
 const r=await fetch('https://github.com/login/oauth/access_token',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},
  body:JSON.stringify({client_id:app.client_id,client_secret:app.client_secret,...felder})});
 const d=await r.json();if(!d.access_token)throw new Error(d.error_description||d.error||'GitHub '+r.status);
 return {token:d.access_token,ablauf:d.expires_in?Date.now()+d.expires_in*1000:0,refresh:d.refresh_token||''}}

export default {async fetch(req,env){
 const u=new URL(req.url),basis=u.origin,p=u.pathname,q=u.searchParams;
 if(req.method==='OPTIONS')return new Response(null,{headers:{'Access-Control-Allow-Origin':SEITE,'Access-Control-Allow-Methods':'POST','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'86400'}});
 const app=await env.KV.get('app',{type:'json'});

 if(p==='/einrichten'){
  if(app)return html('<p>Schon eingerichtet. Die Kontrolle meldet sich jetzt mit GitHub an.</p>');
  const state=zufall();await env.KV.put('einrichten',state,{expirationTtl:900});
  const manifest={name:'Schrittli Kontrolle',url:SEITE+'/schrittli/kontrolle/',description:'Anmeldung für die Online-Kontrolle von Schrittli',public:false,
   redirect_url:basis+'/einrichten/fertig',callback_urls:[basis+'/callback'],hook_attributes:{url:basis+'/',active:false},default_permissions:{contents:'write'}};
  return html(`<h2>Schrittli – Anmeldung einrichten</h2><p>Das legt in deinem GitHub-Konto die App <b>Schrittli Kontrolle</b> an (nur Inhalte lesen und schreiben, nur in den Repos, die du danach auswählst).</p>
<form method=post action="https://github.com/settings/apps/new?state=${state}"><input type=hidden name=manifest value="${esc(JSON.stringify(manifest))}">
<button style="font:700 16px system-ui;border:0;border-radius:999px;background:#17997A;color:#fff;padding:10px 20px;cursor:pointer">GitHub App anlegen</button></form>
<p style="color:#5B6B80">Auf GitHub: «Create GitHub App» drücken. Danach <i>Only select repositories</i> → <b>schrittli</b> und <b>schrittli-werkstatt</b> wählen und installieren.</p>`)}

 if(p==='/einrichten/fertig'){
  if(app)return html('<p>Schon eingerichtet.</p>');
  const soll=await env.KV.get('einrichten');
  if(!soll||q.get('state')!==soll||!/^\w+$/.test(q.get('code')||''))return html('<p>Abgelaufen – bitte <a href="/einrichten">nochmals</a>.</p>',400);
  const r=await fetch(`https://api.github.com/app-manifests/${q.get('code')}/conversions`,{method:'POST',headers:{Accept:'application/vnd.github+json','User-Agent':'schrittli-anmelden'}});
  if(!r.ok)return html('<p>GitHub hat abgelehnt ('+r.status+'). Bitte <a href="/einrichten">nochmals</a>.</p>',502);
  const d=await r.json();  // pem und webhook_secret braucht es nicht, sie werden verworfen
  await env.KV.put('app',JSON.stringify({client_id:d.client_id,client_secret:d.client_secret,slug:d.slug}));await env.KV.delete('einrichten');
  return Response.redirect(`https://github.com/apps/${d.slug}/installations/new`,302)}

 if(!app)return html('<p>Noch nicht eingerichtet: <a href="/einrichten">einrichten</a>.</p>',503);

 if(p==='/login'){
  const state=q.get('state')||'',zurueck=q.get('zurueck')||'/schrittli/kontrolle/';
  if(!STATE.test(state)||!PFAD.test(zurueck))return html('<p>Ungültiger Aufruf.</p>',400);
  await env.KV.put('login:'+state,zurueck,{expirationTtl:600});
  return Response.redirect('https://github.com/login/oauth/authorize?'+new URLSearchParams({client_id:app.client_id,redirect_uri:basis+'/callback',state}),302)}

 if(p==='/callback'){
  const state=q.get('state')||'',zurueck=STATE.test(state)&&await env.KV.get('login:'+state);
  if(!zurueck)return html('<p>Abgelaufen – bitte in der Kontrolle nochmals anmelden.</p>',400);
  await env.KV.delete('login:'+state);
  try{const t=await token(app,{code:q.get('code')||''}),schein=zufall();
   await env.KV.put('schein:'+schein,JSON.stringify({...t,state}),{expirationTtl:60});
   return Response.redirect(SEITE+zurueck+'#anmeldung='+schein,302)}
  catch(x){return html('<p>Anmeldung fehlgeschlagen: '+esc(x.message)+'</p>',502)}}

 if(req.method==='POST'&&(p==='/abholen'||p==='/erneuern')){
  if(req.headers.get('Origin')!==SEITE)return json({fehler:'nicht erlaubt'},403);
  const b=await req.json().catch(()=>({}));
  if(p==='/abholen'){
   const k='schein:'+String(b.schein||'').replace(/\W/g,''),d=await env.KV.get(k,{type:'json'});
   if(!d||d.state!==b.state)return json({fehler:'Abholschein abgelaufen'},400);
   await env.KV.delete(k);delete d.state;return json(d)}
  try{return json(await token(app,{grant_type:'refresh_token',refresh_token:String(b.refresh||'')}))}
  catch(x){return json({fehler:x.message},401)}}

 return html('<p>Schrittli – Anmelden. Hier gibt es nichts zu sehen.</p>',404)}};
