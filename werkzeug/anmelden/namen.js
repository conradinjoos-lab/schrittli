/* Klassenlisten: die Lehrperson pflegt pro Klasse die Vornamen der Kinder. Jedes verbundene iPad
   (Unterricht, Sammlung oder Rückmeldungen) holt die Listen und zeigt «Wer bist du?».
   Nur Vornamen, keine weiteren Angaben – und nur für verbundene iPads lesbar. */
import {teacher} from './sammlung.js';
const ORIGIN='https://conradinjoos-lab.github.io';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const TOKEN=/^[a-f0-9]{64}$/;
const MAX_LISTEN=40, MAX_NAMEN=60, MAX_NAME=30;
const headers={'Access-Control-Allow-Origin':ORIGIN,Vary:'Origin','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const json=(v,status=200)=>Response.json(v,{status,headers});
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const bearer=req=>/^Bearer (\S{1,512})$/.exec(req.headers.get('Authorization')||'')?.[1]||'';
const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),b=>b.toString(16).padStart(2,'0')).join('');
async function body(req){
 const reader=req.body?.getReader();if(!reader)fail('Die Eingabe fehlt.');
 let size=0;const chunks=[];
 try{for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>16384){await reader.cancel();fail('Die Liste ist zu lang.',413);}chunks.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let pos=0;for(const c of chunks){bytes.set(c,pos);pos+=c.length;}
 try{return JSON.parse(new TextDecoder().decode(bytes));}catch{fail('Ungültige Eingabe.');}
}
const sauber=s=>String(s).replace(/\s+/g,' ').trim();
function pruefen(b){
 if(typeof b?.name!=='string'||!sauber(b.name)||sauber(b.name).length>80)fail('Bitte einen kurzen Klassennamen eingeben (z. B. 3a).');
 if(b.stufe!=null&&b.stufe!==''&&![1,2,3,4,5,6].includes(Number(b.stufe)))fail('Die Klassenstufe muss zwischen 1 und 6 liegen.');
 if(!Array.isArray(b.namen))fail('Bitte die Vornamen eingeben, einen pro Zeile.');
 const namen=[];const gesehen=new Set();
 for(const n of b.namen){
  if(typeof n!=='string')fail('Ungültiger Vorname.');
  const v=sauber(n);if(!v)continue;
  if(v.length>MAX_NAME)fail(`Ein Vorname ist zu lang (höchstens ${MAX_NAME} Zeichen): ${v.slice(0,MAX_NAME)}…`);
  if(/[<>{}\\]/.test(v))fail('Vornamen dürfen keine Sonderzeichen wie < > { } enthalten.');
  const k=v.toLowerCase();if(gesehen.has(k))fail(`Der Vorname «${v}» kommt zweimal vor. Hänge z. B. den ersten Buchstaben des Nachnamens an.`);
  gesehen.add(k);namen.push(v);
 }
 if(namen.length>MAX_NAMEN)fail(`Höchstens ${MAX_NAMEN} Vornamen pro Klasse.`);
 return {name:sauber(b.name),stufe:b.stufe==null||b.stufe===''?null:Number(b.stufe),namen};
}
const zeile=r=>({id:r.id,name:r.name,stufe:r.stufe,namen:JSON.parse(r.namen),erstellt:r.erstellt,geaendert:r.geaendert});
/* Ein iPad darf die Listen lesen, wenn sein Token zu einer aktiven Unterrichtsgruppe, Sammlung oder Rückmeldungs-Klasse gehört. */
async function verbunden(req,env,db){
 const token=bearer(req);if(!TOKEN.test(token))fail('Dieses iPad ist noch nicht mit der Klasse verbunden.',401);
 const h=await hash(token);
 const s=await db.prepare('SELECT 1 FROM unterricht_gruppen WHERE tokenHash=? UNION ALL SELECT 1 FROM sammlungen WHERE tokenHash=? AND aktiv=1 LIMIT 1').bind(h,h).first();
 if(s)return true;
 if(env.FEEDBACK){const f=await env.FEEDBACK.withSession('first-primary').prepare('SELECT 1 FROM klassen WHERE tokenHash=? AND aktiv=1').bind(h).first();if(f)return true;}
 fail('Die Verbindung gilt nicht mehr. Bitte deiner Lehrperson zeigen.',401);
}
export async function handleNamen(req,env){
 try{
  if(req.headers.get('Origin')!==ORIGIN)return json({fehler:'Nicht erlaubt.'},403);
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'GET, POST','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Max-Age':'600'}});
  if(!env.SAMMLUNG)fail('Die Klassenlisten sind noch nicht eingerichtet.',503);
  const db=env.SAMMLUNG.withSession('first-primary'),p=new URL(req.url).pathname;
  const alle=async()=>(await db.prepare('SELECT id,name,stufe,namen,erstellt,geaendert FROM klassenlisten ORDER BY stufe IS NULL,stufe,name').all()).results.map(zeile);
  if(p==='/namen/liste'&&req.method==='GET'){
   await verbunden(req,env,db);
   return json({klassen:(await alle()).map(k=>({id:k.id,name:k.name,stufe:k.stufe,namen:k.namen}))});
  }
  await teacher(req);
  if(p==='/namen/klassen'&&req.method==='GET')return json({klassen:await alle()});
  if(p==='/namen/speichern'&&req.method==='POST'){
   const b=await body(req),k=pruefen(b),now=Date.now();
   if(b.id!=null){
    if(!UUID.test(b.id))fail('Ungültige Klasse.');
    const r=await db.prepare('UPDATE klassenlisten SET name=?,stufe=?,namen=?,geaendert=? WHERE id=?').bind(k.name,k.stufe,JSON.stringify(k.namen),now,b.id).run();
    if(!r.meta.changes)fail('Diese Klasse gibt es nicht mehr.',404);
    return json({id:b.id,...k,geaendert:now});
   }
   const id=crypto.randomUUID();
   const r=await db.prepare('INSERT INTO klassenlisten(id,name,stufe,namen,erstellt,geaendert) SELECT ?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM klassenlisten)<?').bind(id,k.name,k.stufe,JSON.stringify(k.namen),now,now,MAX_LISTEN).run();
   if(!r.meta.changes)fail(`Höchstens ${MAX_LISTEN} Klassen. Bitte zuerst eine alte Klasse entfernen.`,409);
   return json({id,...k,erstellt:now,geaendert:now},201);
  }
  if(p==='/namen/entfernen'&&req.method==='POST'){
   const b=await body(req);if(!UUID.test(b?.id))fail('Ungültige Klasse.');
   await db.prepare('DELETE FROM klassenlisten WHERE id=?').bind(b.id).run();return json({ok:true});
  }
  return json({fehler:'Nicht gefunden.'},404);
 }catch(e){return json({fehler:e.status?e.message:'Die Klassenlisten sind gerade nicht erreichbar.'},e.status||503);}
}
