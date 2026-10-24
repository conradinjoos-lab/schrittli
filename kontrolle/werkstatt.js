/* Schrittli – Kontrolle: Datenzugang für index.html und video.html.
   Lokal (python werkzeug/kontrolle.py): über /api und /f vom eigenen Server.
   Online (GitHub Pages): über die GitHub-API. Anmelden mit GitHub über den Worker werkzeug/anmelden (GitHub App «Schrittli Kontrolle»),
   der Schlüssel bleibt nur in diesem Browser und wird selbst erneuert. Ein eingefügter Fine-grained-Schlüssel geht weiterhin.
   Entwürfe, Transkripte und Filmstreifen liegen im privaten Repo schrittli-werkstatt (siehe werkzeug/werkstatt.py),
   Veröffentlichen schreibt schule/schule.json im App-Repo. */
const W=(()=>{
 const LOKAL=/^(127\.0\.0\.1|localhost)$/.test(location.hostname);
 const API='https://api.github.com',WERK='conradinjoos-lab/schrittli-werkstatt',APP='conradinjoos-lab/schrittli',SCHULE='schule/schule.json';
 const SP=20,B=160,H=90,VSP=16,VB=256,VH=144;   // Filmstreifen und Vorschau, wie werkstatt.py
 const ANMELDEN='https://schrittli-anmelden.conradinjoos.workers.dev',KEY='werkstatt-anmeldung';
 let an={};try{an=JSON.parse(localStorage.getItem(KEY)||'{}')}catch{}   // {token, ablauf (ms, 0 = nie), refresh}
 const merke=d=>{an=d;try{localStorage.setItem(KEY,JSON.stringify(d))}catch{}};
 async function erneuern(){
  if(!an.refresh)return false;
  const r=await fetch(ANMELDEN+'/erneuern',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refresh:an.refresh})}).catch(()=>null);
  if(!r||!r.ok)return false;merke(await r.json());return true}

 /* ---------- GitHub ---------- */
 async function gh(pfad,opt={},nochmals=true){
  if(an.ablauf&&Date.now()>an.ablauf-120000)await erneuern();
  const r=await fetch(API+pfad,{cache:'no-store',...opt,headers:{Authorization:'Bearer '+an.token,'X-GitHub-Api-Version':'2022-11-28',Accept:'application/vnd.github+json',...opt.headers}});
  if(r.status===401){if(nochmals&&await erneuern())return gh(pfad,opt,false);abmelden();throw new Error('Anmeldung abgelaufen')}
  return r}
 async function json(pfad,opt){const r=await gh(pfad,opt);if(!r.ok)throw new Error('GitHub '+r.status+': '+pfad);return r.json()}
 async function datei(repo,pfad,art='text',ref='main'){
  const r=await gh(`/repos/${repo}/contents/${pfad}?ref=${ref}`,{headers:{Accept:'application/vnd.github.raw'},cache:art==='blob'?'default':'no-store'});
  if(r.status===404)return null;if(!r.ok)throw new Error('GitHub '+r.status+': '+pfad);return r[art]()}
 /* Ein Commit mit mehreren Dateien. dateien(basis) liefert {pfad:text} und wird bei einem Konflikt neu berechnet. */
 async function commit(repo,dateien,nachricht){
  for(let v=0;v<4;v++){
   const basis=(await json(`/repos/${repo}/git/ref/heads/main`)).object.sha;
   const c=await json(`/repos/${repo}/git/commits/${basis}`);
   const f=await dateien(basis);
   const baum=await json(`/repos/${repo}/git/trees`,{method:'POST',body:JSON.stringify({base_tree:c.tree.sha,tree:Object.entries(f).map(([path,content])=>({path,mode:'100644',type:'blob',content}))})});
   const neu=await json(`/repos/${repo}/git/commits`,{method:'POST',body:JSON.stringify({message:nachricht,tree:baum.sha,parents:[basis]})});
   const r=await gh(`/repos/${repo}/git/refs/heads/main`,{method:'PATCH',body:JSON.stringify({sha:neu.sha})});
   if(r.ok)return;if(r.status!==422)throw new Error('GitHub '+r.status+' beim Schreiben')}
  throw new Error('Jemand schreibt gleichzeitig – bitte nochmals')}

 /* JSON wie schreibe_json in kontrolle.py (indent 1, CRLF). Mit altText bleiben unveränderte Einträge in videos[] Zeichen für Zeichen gleich. */
 function jsonText(d,altText){
  const roh=x=>JSON.stringify(x,null,1).replace(/\n/g,'\r\n')+'\r\n';
  if(!altText||!Array.isArray(d.videos))return roh(d);
  const zeilen=altText.split('\r\n'),alt=new Map();let start=-1;
  zeilen.forEach((z,i)=>{if(z==='  {')start=i;else if((z==='  }'||z==='  },')&&start>=0){const s=zeilen.slice(start,i+1).join('\r\n').replace(/,$/,'');try{alt.set(JSON.stringify(JSON.parse(s)),s)}catch{}start=-1}});
  const ersatz=[];
  const kopie={...d,videos:d.videos.map(v=>{const s=alt.get(JSON.stringify(v));if(s===undefined)return v;ersatz.push(s);return '\u0000'+(ersatz.length-1)})};
  return roh(kopie).replace(/^  "\\u0000(\d+)"/gm,(m,i)=>ersatz[+i])}

 const status=v=>{const st=v.steps||[];return [st.length>=2&&st.every(x=>(x.label||'').trim()),!!(v.title&&v.areaId&&(v.stufen||[]).length&&(v.material||[]).length),!!v._geprueft]};
 const zuSchule=(liste,vid)=>liste.find(e=>(e.source||{}).id===vid)||null;
 function bildLaden(blob){return new Promise((ok,fehler)=>{if(!blob)return ok(null);const im=new Image();im.onload=()=>ok(im);im.onerror=()=>ok(null);im.src=URL.createObjectURL(blob)})}
 function zuschnitt(im,x,y,b,h){const c=document.createElement('canvas');c.width=b;c.height=h;c.getContext('2d').drawImage(im,x,y,b,h,0,0,b,h);return c.toDataURL('image/jpeg',.85)}

 /* ---------- Anmelden (nur online) ---------- */
 function abmelden(){try{localStorage.removeItem(KEY)}catch{}an={};location.reload()}
 async function pruefen(){   // Zugriff auf beide Repos, Schreibrecht im App-Repo
  const [a,b]=await Promise.all([gh('/repos/'+WERK,{},false),gh('/repos/'+APP,{},false)]);
  if(!a.ok)return 'Kein Zugriff auf schrittli-werkstatt – auf GitHub die App «Schrittli Kontrolle» bzw. den Schlüssel für dieses Repo freigeben.';
  const p=b.ok?(await b.json()).permissions:null;if(!p||!p.push)return 'Kein Schreibrecht auf schrittli – Contents: Read and write freigeben.';
  return ''}
 async function bereit(){
  if(LOKAL)return;
  const m=location.hash.match(/^#anmeldung=(\w+)$/);
  if(m){history.replaceState(null,'',location.pathname+location.search);   // Abholschein aus der Adresse entfernen
   let state='';try{state=sessionStorage.getItem('anmelde-state')||'';sessionStorage.removeItem('anmelde-state')}catch{}
   const r=await fetch(ANMELDEN+'/abholen',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({schein:m[1],state})}).catch(()=>null);
   if(r&&r.ok)merke(await r.json())}
  if(an.token&&!m)return;
  return new Promise(ok=>{
   const d=document.createElement('dialog');d.style.cssText='border:0;border-radius:18px;padding:24px 26px;max-width:480px;font:15px/1.45 "Atkinson Hyperlegible",system-ui,sans-serif;color:#17212F;box-shadow:0 16px 48px rgba(23,33,47,.25)';
   const knopf='font:700 15px inherit;border:0;border-radius:999px;background:#17997A;color:#fff;padding:10px 20px;cursor:pointer';
   d.innerHTML=`<h3 style="font:600 21px Fredoka,system-ui,sans-serif;margin:0 0 10px">Werkstatt öffnen</h3>
    <p style="margin:0 0 16px">Die Entwürfe liegen im privaten Repo <b>schrittli-werkstatt</b>. Melde dich einmal pro Gerät mit GitHub an.</p>
    <button class="gh" style="${knopf}">Mit GitHub anmelden</button>
    <p class="f" style="color:#D64545;margin:10px 0 0;min-height:1.2em"></p>
    <details style="margin-top:6px;color:#5B6B80;font-size:13px"><summary style="cursor:pointer">Ohne Anmeldung: Schlüssel einfügen</summary>
     <p style="margin:8px 0">Auf GitHub einen <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener" style="color:#0F7A61">Fine-grained token</a> erstellen:
      Repositories <b>schrittli</b> und <b>schrittli-werkstatt</b>, Contents <i>Read and write</i>.</p>
     <form style="display:flex;gap:8px"><input type="password" autocomplete="off" placeholder="github_pat_…" style="flex:1;font:inherit;padding:8px 12px;border:1px solid #D5DEE9;border-radius:10px">
      <button style="${knopf};padding:8px 16px">Speichern</button></form></details>`;
   document.body.appendChild(d);d.addEventListener('cancel',e=>e.preventDefault());d.showModal();
   const f=d.querySelector('.f');
   if(m&&!an.token)f.textContent='Anmeldung hat nicht geklappt – bitte nochmals.';
   d.querySelector('.gh').onclick=()=>{
    const state=crypto.randomUUID().replace(/-/g,'');try{sessionStorage.setItem('anmelde-state',state)}catch{}
    location.href=ANMELDEN+'/login?'+new URLSearchParams({state,zurueck:location.pathname+location.search})};
   const fertig=async()=>{f.textContent='prüfe …';
    try{const fehler=await pruefen();if(fehler){f.textContent=fehler;return}d.close();d.remove();ok()}catch(x){f.textContent=String(x.message||x)}};
   d.querySelector('form').onsubmit=e=>{e.preventDefault();merke({token:d.querySelector('input').value.trim(),ablauf:0,refresh:''});fertig()};
   if(an.token)fertig()})}

 /* ---------- Liste ---------- */
 async function liste(){
  if(LOKAL){const j=await (await fetch('/api/liste')).json();j.videos.forEach(e=>e.vorschau='/f/'+e.id+'/'+e.bild);return j}
  const [l,meta,schule,vor]=await Promise.all([datei(WERK,'liste.json'),datei(WERK,'meta.json'),datei(APP,SCHULE),datei(WERK,'vorschau.jpg','blob').then(bildLaden)]);
  const sv=JSON.parse(schule).videos;
  const videos=JSON.parse(l||'[]').map(e=>{const s=zuSchule(sv,e.id);
   return {...e,drin:!!s,area:(s||{}).areaId||e.area,vorschau:vor&&e.v!=null?zuschnitt(vor,(e.v%VSP)*VB,Math.floor(e.v/VSP)*VH,VB,VH):`https://i.ytimg.com/vi/${e.id}/mqdefault.jpg`}});
  return {videos,themen:JSON.parse(meta).themen}}

 /* ---------- Ein Video ---------- */
 let streifen=null,anzahl=0;const zuschnitte=new Map();
 async function daten(id){
  if(LOKAL){const r=await fetch('/api/'+id);const j=await r.json();if(!r.ok)throw new Error(j.fehler||'Fehler '+r.status);return j}
  const [a,v,meta,schule,st]=await Promise.all([datei(WERK,id+'/analyse.json'),datei(WERK,id+'/video.json'),datei(WERK,'meta.json'),datei(APP,SCHULE),datei(WERK,id+'/streifen.jpg','blob').then(bildLaden)]);
  if(!a)throw new Error('Kein analyse.json für '+id+' in der Werkstatt');
  const analyse=JSON.parse(a),m=JSON.parse(meta);streifen=st;anzahl=st?analyse._bilder||(st.naturalHeight/H*SP):0;
  return {analyse,entwurf:v?JSON.parse(v):null,schule:zuSchule(JSON.parse(schule).videos,id),themen:m.themen,vokabular:m.vokabular}}
 /* Einzelbild n (ab 1, wie /f/<id>/<n>) */
 function bild(id,n){
  if(LOKAL)return '/f/'+id+'/'+n;
  if(!streifen)return '';n=Math.max(1,Math.min(n,anzahl))-1;
  if(!zuschnitte.has(n))zuschnitte.set(n,zuschnitt(streifen,(n%SP)*B,Math.floor(n/SP)*H,B,H));return zuschnitte.get(n)}

 /* ---------- Speichern / Veröffentlichen ---------- */
 function sauber(id,e){e={...e,source:{type:'youtube',id}};e.steps=(e.steps||[]).map(s=>({t:Math.round(+s.t*10)/10,label:String(s.label).trim()})).sort((a,b)=>a.t-b.t);return e}
 async function lokalPost(id,was,e){const r=await fetch('/api/'+id+'/'+was,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(e)});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.fehler||'Fehler beim Speichern');return j}
 let kette=Promise.resolve();
 function speichern(id,e){
  if(LOKAL)return lokalPost(id,'speichern',e);
  e=sauber(id,e);
  const p=kette.then(()=>commit(WERK,async basis=>{
   const l=JSON.parse(await datei(WERK,'liste.json','text',basis)||'[]');let z=l.find(x=>x.id===id);if(!z){z={id,dauer:null,fps:2,brief:false,bild:1};l.push(z)}
   Object.assign(z,{title:e.title||z.title||id,entwurf:true,schritte:e.steps.length,status:status(e),area:e.areaId||''});
   return {[id+'/video.json']:jsonText(e),'liste.json':jsonText(l)}},'Kontrolle: '+(e.title||id)));
  kette=p.catch(()=>{});return p}
 async function veroeffentlichen(id,e){
  if(LOKAL)return lokalPost(id,'uebernehmen',e);
  await speichern(id,e);e=sauber(id,e);
  const eintrag=Object.fromEntries(Object.entries(e).filter(([k])=>!k.startsWith('_')));let anzahl=0;
  await commit(APP,async basis=>{const alt=await datei(APP,SCHULE,'text',basis);const d=JSON.parse(alt);
   d.stand=new Date().toLocaleDateString('sv-SE');const i=d.videos.findIndex(x=>x.id===eintrag.id||(x.source||{}).id===id);
   if(i>=0)d.videos[i]=eintrag;else d.videos.push(eintrag);anzahl=d.videos.length;return {[SCHULE]:jsonText(d,alt)}},'Schule: «'+(e.title||id)+'» veröffentlicht');
  return {anzahl}}

 return {LOKAL,bereit,abmelden,liste,daten,bild,speichern,veroeffentlichen,jsonText,
  nachPub:LOKAL?'Noch committen und pushen.':'In etwa einer Minute in der Schul-App.',
  pause:LOKAL?1500:6000}  // Autospeichern: online seltener, jeder Stand ist ein Commit
})();
