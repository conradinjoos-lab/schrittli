/* Shared photos use a separate collection link; feedback tokens stay submission-only. */
const ORIGIN='https://conradinjoos-lab.github.io';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const TOKEN=/^[a-f0-9]{64}$/, MAX_PHOTO=600000;
const headers={'Access-Control-Allow-Origin':ORIGIN,Vary:'Origin','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const json=(body,status=200)=>Response.json(body,{status,headers});
const fail=(message,status)=>{throw Object.assign(new Error(message),{status});};
const bearer=req=>/^Bearer ([^\s]{1,512})$/.exec(req.headers.get('Authorization')||'')?.[1]||'';
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
async function bounded(req,max){
 if(Number(req.headers.get('Content-Length'))>max)fail('Das Foto ist zu gross.',413);
 const reader=req.body?.getReader();if(!reader)fail('Die Eingabe fehlt.',400);
 const chunks=[];let length=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>max){await reader.cancel();fail('Das Foto ist zu gross.',413);}chunks.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(length);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}return bytes;
}
async function bodyJSON(req){try{return JSON.parse(new TextDecoder().decode(await bounded(req,4096)));}catch(e){if(e.status)throw e;fail('Ungültige Eingabe.',400);}}
async function teacher(req){
 const token=bearer(req);if(!token||TOKEN.test(token))fail('Bitte mit GitHub anmelden.',401);
 const r=await fetch('https://api.github.com/user',{headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','User-Agent':'schrittli-sammlung'},redirect:'manual',signal:AbortSignal.timeout(10000)});
 if(!r.ok)fail('Bitte erneut anmelden.',r.status===401?401:503);
 if(String((await r.json()).login||'').toLowerCase()!=='conradinjoos-lab')fail('Nur die Lehrperson kann Sammlungen verwalten.',403);
}
async function collection(req,db){
 const token=bearer(req);if(!TOKEN.test(token))fail('Verbinde dieses iPad mit eurer Sammlung.',401);
 const k=await db.prepare('SELECT id,name,version FROM sammlungen WHERE tokenHash=? AND aktiv=1').bind(await hash(token)).first();
 if(!k)fail('Der Sammlungslink gilt nicht mehr. Bitte deiner Lehrperson zeigen.',401);return k;
}
const fields='id,videoId,titel,name,klasse,sterne,erstellt';
export async function handleSammlung(req,env){
 try{
  if(req.headers.get('Origin')!==ORIGIN)return json({fehler:'Nicht erlaubt.'},403);
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'GET, POST','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Max-Age':'600'}});
  if(!env.SAMMLUNG)fail('Die gemeinsame Sammlung wird noch eingerichtet.',503);
  const db=env.SAMMLUNG.withSession('first-primary'),u=new URL(req.url),p=u.pathname;
  if(['/sammlung/verbinden','/sammlung/werke','/sammlung/foto','/sammlung/abgeben'].includes(p)){
   const k=await collection(req,db);
   if(p==='/sammlung/verbinden'&&req.method==='GET')return json({id:k.id,name:k.name});
   if(p==='/sammlung/werke'&&req.method==='GET'){
    if(u.searchParams.get('version')===String(k.version))return json({version:k.version,unveraendert:true});
    const rows=await db.prepare(`SELECT ${fields},geloescht FROM schulwerke WHERE sammlungId=? ORDER BY erstellt DESC,id DESC LIMIT 2000`).bind(k.id).all();
    return json({version:k.version,werke:rows.results.filter(w=>!w.geloescht).map(({geloescht,...w})=>w),geloescht:rows.results.filter(w=>w.geloescht).map(w=>w.id)});
   }
   if(p==='/sammlung/foto'&&req.method==='GET'){
    const id=u.searchParams.get('id');if(!UUID.test(id))fail('Ungültiges Foto.',400);
    const row=await db.prepare('SELECT foto FROM schulwerke WHERE id=? AND sammlungId=? AND geloescht=0').bind(id,k.id).first();
    if(!row?.foto)fail('Dieses Foto wurde entfernt.',404);
    return new Response(new Uint8Array(row.foto),{headers:{...headers,'Content-Type':'image/jpeg'}});
   }
   if(p==='/sammlung/abgeben'&&req.method==='POST'){
    if(env.SAMMLUNG_LIMIT&&!(await env.SAMMLUNG_LIMIT.limit({key:k.id})).success)fail('Bitte kurz warten.',429);
    if(!/^multipart\/form-data;/.test(req.headers.get('Content-Type')||''))fail('Ungültige Abgabe.',400);
    const bytes=await bounded(req,MAX_PHOTO+16384);let form,data;
    try{form=await new Request(req.url,{method:'POST',headers:{'Content-Type':req.headers.get('Content-Type')},body:bytes}).formData();data=JSON.parse(form.get('daten'));}catch{fail('Ungültige Abgabe.',400);}
    if(!data||!UUID.test(data.id)||typeof data.videoId!=='string'||!/^[-\w]{1,100}$/.test(data.videoId)||typeof data.titel!=='string'||!data.titel.trim()||data.titel.length>160||typeof data.name!=='string'||!data.name.trim()||data.name.length>30||![1,2,3,4,5,6].includes(data.klasse)||![1,2,3,4,5].includes(data.sterne))fail('Bitte Vorname, Klasse und Sterne angeben.',400);
    const old=await db.prepare('SELECT sammlungId,geloescht FROM schulwerke WHERE id=?').bind(data.id).first();
    if(old){if(old.sammlungId!==k.id)fail('Ungültige Abgabe.',409);return json({ok:true,id:data.id,geloescht:!!old.geloescht});}
    const photo=form.get('foto');if(!photo||typeof photo==='string'||!photo.size||photo.size>MAX_PHOTO)fail('Das Foto fehlt oder ist zu gross.',413);
    const foto=new Uint8Array(await photo.arrayBuffer());
    if(photo.type!=='image/jpeg'||foto[0]!==255||foto[1]!==216||foto[2]!==255||foto.at(-2)!==255||foto.at(-1)!==217)fail('Bitte ein JPEG-Foto verwenden.',415);
    const r=await db.prepare(`INSERT OR IGNORE INTO schulwerke(id,sammlungId,videoId,titel,name,klasse,sterne,erstellt,foto)
     SELECT ?,?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM sammlungen WHERE id=? AND aktiv=1)
     AND (SELECT COUNT(*) FROM schulwerke WHERE sammlungId=?)<2000
     AND (SELECT COUNT(*) FROM schulwerke WHERE sammlungId=? AND erstellt>?)<300
     AND (SELECT COALESCE(SUM(length(foto)),0) FROM schulwerke)+?<400000000`)
     .bind(data.id,k.id,data.videoId,data.titel.trim(),data.name.trim(),data.klasse,data.sterne,Date.now(),foto,k.id,k.id,k.id,Date.now()-86400000,foto.length).run();
    if(!r.meta.changes){const saved=await db.prepare('SELECT sammlungId,geloescht FROM schulwerke WHERE id=?').bind(data.id).first();if(saved?.sammlungId===k.id)return json({ok:true,id:data.id,geloescht:!!saved.geloescht});fail('Die Sammlung ist gerade voll. Bitte deiner Lehrperson zeigen.',429);}
    return json({ok:true,id:data.id},201);
   }
   return json({fehler:'Nicht gefunden.'},404);
  }
  await teacher(req);
  if(p==='/sammlung/verwaltung'&&req.method==='GET')return json({sammlungen:(await db.prepare('SELECT id,name,erstellt,aktiv FROM sammlungen ORDER BY erstellt DESC').all()).results});
  if(p==='/sammlung/erstellen'&&req.method==='POST'){
   const b=await bodyJSON(req);if(typeof b?.name!=='string'||!b.name.trim()||b.name.length>80)fail('Bitte einen Namen für die Sammlung eingeben.',400);
   const id=crypto.randomUUID(),token=(crypto.randomUUID()+crypto.randomUUID()).replaceAll('-','');
   const r=await db.prepare('INSERT INTO sammlungen(id,name,tokenHash,erstellt) SELECT ?,?,?,? WHERE (SELECT COUNT(*) FROM sammlungen WHERE aktiv=1)<100').bind(id,b.name.trim(),await hash(token),new Date().toISOString()).run();
   if(!r.meta.changes)fail('Bitte zuerst eine alte Sammlung sperren.',409);return json({id,name:b.name.trim(),token},201);
  }
  if(p==='/sammlung/sperren'&&req.method==='POST'){
   const b=await bodyJSON(req);if(!UUID.test(b?.id))fail('Ungültige Sammlung.',400);await db.prepare('UPDATE sammlungen SET aktiv=0 WHERE id=?').bind(b.id).run();return json({ok:true});
  }
  if(p==='/sammlung/verwaltung/werke'&&req.method==='GET'){
   const id=u.searchParams.get('id');if(!UUID.test(id))fail('Ungültige Sammlung.',400);
   return json({werke:(await db.prepare(`SELECT ${fields} FROM schulwerke WHERE sammlungId=? AND geloescht=0 ORDER BY erstellt DESC,id DESC LIMIT 2000`).bind(id).all()).results});
  }
  if(p==='/sammlung/verwaltung/foto'&&req.method==='GET'){
   const id=u.searchParams.get('id');if(!UUID.test(id))fail('Ungültiges Foto.',400);
   const row=await db.prepare('SELECT foto FROM schulwerke WHERE id=? AND geloescht=0').bind(id).first();if(!row?.foto)fail('Foto nicht vorhanden.',404);
   return new Response(new Uint8Array(row.foto),{headers:{...headers,'Content-Type':'image/jpeg'}});
  }
  if(p==='/sammlung/loeschen'&&req.method==='POST'){
   const b=await bodyJSON(req);if(!UUID.test(b?.id))fail('Ungültiges Werk.',400);
   await db.prepare("UPDATE schulwerke SET geloescht=1,foto=NULL,name='',titel='',videoId='' WHERE id=? AND geloescht=0").bind(b.id).run();return json({ok:true});
  }
  return json({fehler:'Nicht gefunden.'},404);
 }catch(e){if(!e.status)console.error(JSON.stringify({event:'sammlung_failed',path:new URL(req.url).pathname}));return json({fehler:e.status?e.message:'Die Sammlung ist gerade nicht erreichbar. Wir versuchen es wieder.'},e.status||503);}
}
