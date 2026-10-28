/* Classroom policy is separate from photo links. Only the verified teacher may change it. */
import {teacher} from './sammlung.js';
const ORIGIN='https://conradinjoos-lab.github.io';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const TOKEN=/^[a-f0-9]{64}$/;
const headers={'Access-Control-Allow-Origin':ORIGIN,Vary:'Origin','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const json=(v,status=200)=>Response.json(v,{status,headers});
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),b=>b.toString(16).padStart(2,'0')).join('');
async function body(req){
 const reader=req.body?.getReader();if(!reader)fail('Die Eingabe fehlt.');
 let size=0;const chunks=[];
 try{for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>65536){await reader.cancel();fail('Die Auswahl ist zu gross.',413);}chunks.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let pos=0;for(const c of chunks){bytes.set(c,pos);pos+=c.length;}
 try{return JSON.parse(new TextDecoder().decode(bytes));}catch{fail('Ungültige Eingabe.');}
}
function name(v){if(typeof v!=='string'||!v.trim()||v.length>80)fail('Bitte einen kurzen Namen eingeben.');return v.trim();}
function policy(p){
 if(!p||!['closed','projects','templates','beads','free'].includes(p.mode))fail('Ungültiger Unterrichtsmodus.');
 if(!Array.isArray(p.ids)||p.ids.length>500||p.ids.some(id=>typeof id!=='string'||!/^[-a-zA-Z0-9_]{1,100}$/.test(id)))fail('Ungültige Auswahl.');
 const ids=[...new Set(p.ids)];
 if(!['closed','free'].includes(p.mode)&&!ids.length)fail('Wähle mindestens einen Inhalt aus.');
 if(p.grade!=null&&![1,2,3,4,5,6].includes(p.grade))fail('Ungültige Klasse.');
 return {mode:p.mode,title:name(p.title),ids:['closed','free'].includes(p.mode)?[]:ids,grade:p.grade||null,simple:p.simple!==false,resize:p.resize!==false,recolor:p.recolor!==false,gallery:p.gallery===true,
  selection:['single','topic','custom'].includes(p.selection)?p.selection:'custom',category:typeof p.category==='string'?p.category.slice(0,100):''};
}
export async function handleUnterricht(req,env){
 try{
  if(req.headers.get('Origin')!==ORIGIN)return json({fehler:'Nicht erlaubt.'},403);
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'GET, POST','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Max-Age':'600'}});
  if(!env.SAMMLUNG)fail('Der Unterrichtsmodus ist noch nicht eingerichtet.',503);
  const db=env.SAMMLUNG.withSession('first-primary'),u=new URL(req.url),p=u.pathname;
  if(p==='/unterricht/status'&&req.method==='POST'){
   const token=/^Bearer (\S+)$/.exec(req.headers.get('Authorization')||'')?.[1];
   if(!TOKEN.test(token||''))fail('Dieses iPad muss mit einer Klasse verbunden werden.',401);
   const group=await db.prepare('SELECT id,name,policy,revision FROM unterricht_gruppen WHERE tokenHash=?').bind(await hash(token)).first();
   if(!group)fail('Die Verbindung gilt nicht mehr. Bitte deiner Lehrperson zeigen.',401);
   const b=await body(req);if(!UUID.test(b?.deviceId)||!Number.isSafeInteger(b.revision)||b.revision<0)fail('Ungültiges iPad.');
   if(env.UNTERRICHT_LIMIT&&!(await env.UNTERRICHT_LIMIT.limit({key:group.id+':'+b.deviceId})).success)fail('Bitte kurz warten.',429);
   await db.prepare(`INSERT INTO unterricht_geraete(gruppeId,id,name,gesehen,revision)
    SELECT ?1,?2,?3,?4,?5 WHERE EXISTS(SELECT 1 FROM unterricht_geraete WHERE gruppeId=?1 AND id=?2) OR (SELECT COUNT(*) FROM unterricht_geraete WHERE gruppeId=?1)<150
    ON CONFLICT(gruppeId,id) DO UPDATE SET gesehen=excluded.gesehen,revision=excluded.revision`)
    .bind(group.id,b.deviceId,'iPad '+b.deviceId.slice(0,4).toUpperCase(),Date.now(),Math.min(b.revision,group.revision)).run();
   return json({id:group.id,name:group.name,policy:JSON.parse(group.policy),revision:group.revision,leaseMs:90000});
  }
  await teacher(req);
  if(p==='/unterricht/gruppen'&&req.method==='GET'){
   const groups=(await db.prepare('SELECT id,name,policy,revision FROM unterricht_gruppen ORDER BY erstellt').all()).results;
   return json({gruppen:groups.map(g=>({...g,policy:JSON.parse(g.policy)}))});
  }
  if(p==='/unterricht/erstellen'&&req.method==='POST'){
   const b=await body(req),n=name(b?.name),id=crypto.randomUUID(),token=(crypto.randomUUID()+crypto.randomUUID()).replaceAll('-','');
   const r=await db.prepare('INSERT INTO unterricht_gruppen(id,name,tokenHash,erstellt) SELECT ?,?,?,? WHERE (SELECT COUNT(*) FROM unterricht_gruppen)<100').bind(id,n,await hash(token),Date.now()).run();
   if(!r.meta.changes)fail('Es sind bereits 100 Gruppen eingerichtet.',409);
   return json({id,name:n,token},201);
  }
  if(p==='/unterricht/freigabe'&&req.method==='POST'){
   const b=await body(req);if(!UUID.test(b?.id)||!Number.isSafeInteger(b.revision)||b.revision<1)fail('Ungültige Gruppe.');
   const next=policy(b.policy);
   const r=await db.prepare('UPDATE unterricht_gruppen SET policy=?,revision=revision+1 WHERE id=? AND revision=?').bind(JSON.stringify(next),b.id,b.revision).run();
   if(!r.meta.changes)fail('Die Freigabe wurde inzwischen geändert. Bitte die Gruppe neu laden und deine Auswahl nochmals übernehmen.',409);
   return json({ok:true,revision:b.revision+1,policy:next});
  }
  if(p==='/unterricht/geraete'&&req.method==='GET'){
   const id=u.searchParams.get('id');if(!UUID.test(id))fail('Ungültige Gruppe.');
   const group=await db.prepare('SELECT revision,policy FROM unterricht_gruppen WHERE id=?').bind(id).first();if(!group)fail('Gruppe nicht gefunden.',404);
   return json({revision:group.revision,policy:JSON.parse(group.policy),now:Date.now(),geraete:(await db.prepare('SELECT id,name,gesehen,revision FROM unterricht_geraete WHERE gruppeId=? ORDER BY name').bind(id).all()).results});
  }
  if(p==='/unterricht/geraet-name'&&req.method==='POST'){
   const b=await body(req);if(!UUID.test(b?.id)||!UUID.test(b?.deviceId))fail('Ungültiges iPad.');
   await db.prepare('UPDATE unterricht_geraete SET name=? WHERE gruppeId=? AND id=?').bind(name(b.name),b.id,b.deviceId).run();return json({ok:true});
  }
  if(p==='/unterricht/favoriten'&&req.method==='GET')return json({favoriten:(await db.prepare('SELECT * FROM unterricht_favoriten ORDER BY name').all()).results.map(f=>({...f,policy:JSON.parse(f.policy)}))});
  if(p==='/unterricht/favorit'&&req.method==='POST'){
   const b=await body(req),n=name(b?.name),v=policy(b.policy),id=crypto.randomUUID();
   const r=await db.prepare('INSERT INTO unterricht_favoriten(id,name,policy) SELECT ?,?,? WHERE (SELECT COUNT(*) FROM unterricht_favoriten)<50').bind(id,n,JSON.stringify(v)).run();
   if(!r.meta.changes)fail('Bitte zuerst einen alten Favoriten entfernen.',409);return json({id,name:n,policy:v},201);
  }
  if(p==='/unterricht/favorit-entfernen'&&req.method==='POST'){
   const b=await body(req);if(!UUID.test(b?.id))fail('Ungültiger Favorit.');await db.prepare('DELETE FROM unterricht_favoriten WHERE id=?').bind(b.id).run();return json({ok:true});
  }
  return json({fehler:'Nicht gefunden.'},404);
 }catch(e){if(!e.status)console.error(JSON.stringify({event:'unterricht_failed',path:new URL(req.url).pathname}));return json({fehler:e.status?e.message:'Der Unterrichtsmodus ist gerade nicht erreichbar.'},e.status||503);}
}
