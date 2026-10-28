/* Tablet tokens only submit. Reads require the owner's GitHub identity.
   Audio and answers live exclusively in the private database. */
const ORIGIN='https://conradinjoos-lab.github.io', OWNER='conradinjoos-lab';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TOKEN=/^[0-9a-f]{64}$/, MAX_AUDIO=1048576, RETENTION=90*86400000;
const headers={'Access-Control-Allow-Origin':ORIGIN,'Vary':'Origin','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{...headers,'Content-Type':'application/json; charset=utf-8'}});
const fail=(message,status)=>{throw Object.assign(new Error(message),{status});};
const bearer=req=>/^Bearer ([^\s]{1,512})$/.exec(req.headers.get('Authorization')||'')?.[1]||'';
const cutoff=()=>new Date(Date.now()-RETENTION).toISOString();
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),n=>n.toString(16).padStart(2,'0')).join('');
async function bounded(req,max){
 if(Number(req.headers.get('Content-Length'))>max)fail('Die Aufnahme ist zu gross. Bitte kürzer aufnehmen.',413);
 const reader=req.body?.getReader();if(!reader)return new Uint8Array();const chunks=[];let size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max){await reader.cancel();fail('Die Aufnahme ist zu gross. Bitte kürzer aufnehmen.',413);}chunks.push(value);}}finally{reader.releaseLock();}
 const out=new Uint8Array(size);let at=0;for(const value of chunks){out.set(value,at);at+=value.length;}return out;
}
async function bodyJSON(req){try{return JSON.parse(new TextDecoder().decode(await bounded(req,4096)));}catch(e){if(e.status)throw e;fail('Ungültige Eingabe.',400);}}
async function teacher(req){
 const token=bearer(req);if(!token||TOKEN.test(token))fail('Bitte mit deinem GitHub-Konto anmelden.',401);
 const r=await fetch('https://api.github.com/user',{headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','User-Agent':'schrittli-feedback'},redirect:'manual',signal:AbortSignal.timeout(10000)});
 if(!r.ok)fail('Bitte erneut anmelden.',r.status===401?401:503);
 if(String((await r.json()).login||'').toLowerCase()!==OWNER)fail('Dieser Bereich gehört der Lehrperson.',403);
}
async function tablet(req,db){
 const token=bearer(req);if(!TOKEN.test(token))fail('Dieses Tablet ist noch nicht verbunden.',401);
 const k=await db.prepare('SELECT id,name FROM klassen WHERE tokenHash=? AND aktiv=1').bind(await hash(token)).first();
 if(!k)fail('Der Klassenlink ist nicht mehr gültig. Bitte deine Lehrperson fragen.',401);return k;
}
function validAudio(bytes,mime){
 const text=(a,b)=>String.fromCharCode(...bytes.slice(a,b));
 return mime==='audio/webm'&&bytes[0]===0x1a&&bytes[1]===0x45&&bytes[2]===0xdf&&bytes[3]===0xa3||mime==='audio/mp4'&&text(4,8)==='ftyp'||mime==='audio/ogg'&&text(0,4)==='OggS';
}
export async function cleanFeedback(env){if(env.FEEDBACK)await env.FEEDBACK.prepare('DELETE FROM feedback WHERE zeit < ?').bind(cutoff()).run();}
export async function handleFeedback(req,env){
 try{
  if(req.headers.get('Origin')!==ORIGIN)return json({fehler:'Nicht erlaubt.'},403);
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'GET, POST','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Max-Age':'600'}});
  if(!env.FEEDBACK)fail('Der Sammelbereich wird noch eingerichtet.',503);
  const db=env.FEEDBACK.withSession('first-primary'),u=new URL(req.url),p=u.pathname;
  if(p==='/feedback/klasse'&&req.method==='GET'){const k=await tablet(req,db);return json({name:k.name});}
  if(p==='/feedback/abgeben'&&req.method==='POST'){
   const k=await tablet(req,db);
   if(env.FEEDBACK_LIMIT&&!(await env.FEEDBACK_LIMIT.limit({key:k.id})).success)fail('Bitte kurz warten und nochmals senden.',429);
   if(!/^multipart\/form-data;/.test(req.headers.get('Content-Type')||''))fail('Ungültige Abgabe.',400);
   const raw=await bounded(req,MAX_AUDIO+16384);let form,data;
   try{form=await new Request(req.url,{method:'POST',headers:{'Content-Type':req.headers.get('Content-Type')},body:raw}).formData();data=JSON.parse(form.get('daten'));}catch{fail('Ungültige Abgabe.',400);}
   if(!data||!UUID.test(data.id)||typeof data.videoId!=='string'||!/^[\w-]{1,100}$/.test(data.videoId)||typeof data.titel!=='string'||!data.titel.trim()||data.titel.length>160||![1,2,3,4,5,6].includes(data.klasse)||![1,2,3].includes(data.schwierigkeit)||![1,2,3].includes(data.spass))fail('Bitte beide Fragen beantworten.',400);
   const vorname=data.name==null||data.name===''?null:String(data.name).replace(/\s+/g,' ').trim();if(vorname!==null&&(!vorname||vorname.length>30))fail('Ungültiger Vorname.',400);
   const old=await db.prepare('SELECT klasseId FROM feedback WHERE id=?').bind(data.id).first();
   if(old){if(old.klasseId!==k.id)fail('Ungültige Abgabe.',409);return json({ok:true,id:data.id});}
   const file=form.get('audio');let audio=null,mime=null;
   if(file!==null){
    if(typeof file==='string'||!file.size||file.size>MAX_AUDIO)fail('Bitte die Aufnahme kürzen oder ohne Ton senden.',413);
    mime=file.type.split(';')[0].toLowerCase();audio=new Uint8Array(await file.arrayBuffer());
    if(!validAudio(audio,mime))fail('Dieses Tonformat wird nicht unterstützt. Bitte ohne Ton senden.',415);
   }
   const now=new Date().toISOString(),day=new Date(Date.now()-86400000).toISOString();
   // Unique id, active class and quotas are checked atomically with the INSERT.
   const result=await db.prepare(`INSERT OR IGNORE INTO feedback(id,klasseId,videoId,titel,klasse,schwierigkeit,spass,zeit,audio,mime,name)
    SELECT ?,?,?,?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM klassen WHERE id=? AND aktiv=1)
    AND (SELECT COUNT(*) FROM feedback WHERE klasseId=? AND zeit>?)<300
    AND (SELECT COUNT(*) FROM feedback)<5000
    AND (SELECT COALESCE(SUM(length(audio)),0) FROM feedback)+?<367001600`)
    .bind(data.id,k.id,data.videoId,data.titel.trim(),data.klasse,data.schwierigkeit,data.spass,now,audio,mime,vorname,k.id,k.id,day,audio?.length||0).run();
   if(!result.meta.changes){const saved=await db.prepare('SELECT klasseId FROM feedback WHERE id=?').bind(data.id).first();if(saved?.klasseId===k.id)return json({ok:true,id:data.id});fail('Die Abgabe ist gerade nicht möglich. Bitte deiner Lehrperson zeigen.',429);}
   return json({ok:true,id:data.id},201);
  }
  await teacher(req);
  if(p==='/feedback/klassen'&&req.method==='GET'){
   const r=await db.prepare('SELECT id,name,createdAt,aktiv FROM klassen ORDER BY createdAt DESC').all();return json({klassen:r.results.map(k=>({...k,aktiv:!!k.aktiv}))});
  }
  if(p==='/feedback/klassen'&&req.method==='POST'){
   const b=await bodyJSON(req);if(typeof b?.name!=='string'||!b.name.trim()||b.name.length>80)fail('Bitte einen kurzen Klassennamen eingeben.',400);
   const id=crypto.randomUUID(),token=(crypto.randomUUID()+crypto.randomUUID()).replaceAll('-',''),name=b.name.trim();
   const r=await db.prepare('INSERT INTO klassen(id,name,tokenHash,createdAt) SELECT ?,?,?,? WHERE (SELECT COUNT(*) FROM klassen WHERE aktiv=1)<100').bind(id,name,await hash(token),new Date().toISOString()).run();
   if(!r.meta.changes)fail('Bitte zuerst einen alten Klassenlink sperren.',409);return json({id,name,token},201);
  }
  if(p==='/feedback/klassen/sperren'&&req.method==='POST'){
   const b=await bodyJSON(req);if(!UUID.test(b?.id))fail('Ungültige Klasse.',400);await db.prepare('UPDATE klassen SET aktiv=0 WHERE id=?').bind(b.id).run();return json({ok:true});
  }
  if(p==='/feedback/liste'&&req.method==='GET'){
   const klasse=u.searchParams.get('klasse')||'',cursor=u.searchParams.get('cursor');if(klasse&&!UUID.test(klasse))fail('Ungültige Klasse.',400);
   let c=null;if(cursor){try{c=JSON.parse(atob(cursor));}catch{fail('Ungültige nächste Seite.',400);}if(!Array.isArray(c)||!/^\d{4}-\d\d-\d\dT[\d:.]+Z$/.test(c[0])||!UUID.test(c[1]))fail('Ungültige nächste Seite.',400);}
   const q=`SELECT f.id,f.klasseId,k.name AS klassenname,f.videoId,f.titel,f.klasse,f.schwierigkeit,f.spass,f.zeit,f.name,(f.audio IS NOT NULL) AS audio
    FROM feedback f JOIN klassen k ON f.klasseId=k.id WHERE f.geloescht=0 AND f.zeit>=?${klasse?' AND f.klasseId=?':''}${c?' AND (f.zeit < ? OR (f.zeit=? AND f.id<?))':''} ORDER BY f.zeit DESC,f.id DESC LIMIT 51`;
   const r=await db.prepare(q).bind(cutoff(),...(klasse?[klasse]:[]),...(c?[c[0],c[0],c[1]]:[])).all(),rows=r.results.slice(0,50),last=rows.at(-1);
   return json({eintraege:rows.map(x=>({...x,audio:!!x.audio})),cursor:r.results.length>50?btoa(JSON.stringify([last.zeit,last.id])):null});
  }
  if(p==='/feedback/audio'&&req.method==='GET'){
   const id=u.searchParams.get('id');if(!UUID.test(id))fail('Ungültige Aufnahme.',400);
   const row=await db.prepare('SELECT audio,mime FROM feedback WHERE id=? AND geloescht=0 AND zeit>=?').bind(id,cutoff()).first();if(!row?.audio)fail('Diese Aufnahme ist nicht mehr vorhanden.',404);
   return new Response(new Uint8Array(row.audio),{headers:{...headers,'Content-Type':row.mime,'Content-Disposition':'inline; filename="rueckmeldung.'+(row.mime==='audio/mp4'?'m4a':row.mime==='audio/ogg'?'ogg':'webm')+'"'}});
  }
  if(p==='/feedback/loeschen'&&req.method==='POST'){
   const b=await bodyJSON(req);if(!UUID.test(b?.id))fail('Ungültige Rückmeldung.',400);
   // Tombstone prevents a delayed upload retry from restoring deleted contents.
   await db.prepare("UPDATE feedback SET geloescht=1,audio=NULL,mime=NULL,titel='',videoId='',schwierigkeit=1,spass=1,klasse=1,name=NULL WHERE id=?").bind(b.id).run();return json({ok:true});
  }
  return json({fehler:'Nicht gefunden.'},404);
 }catch(e){return json({fehler:e.status?e.message:'Das Senden klappt gerade nicht. Bitte nochmals versuchen.'},e.status||503);}
}
