/* Shared gate for the school app and every standalone tool. No teacher credentials here. */
(() => {
 'use strict';
 const KEY='schrittli.unterricht.verbindung',API='https://schrittli-anmelden.conradinjoos.workers.dev/unterricht/status';
 const base=new URL('./',document.currentScript.src),school=new URL('schule/',base),control=new URL('kontrolle/unterricht.html',base);
 let connection=null;try{connection=JSON.parse(localStorage.getItem(KEY)||'null');}catch{}
 if(!/^[a-f0-9]{64}$/.test(connection?.token||''))connection=null;
 const token=new URLSearchParams(location.hash.slice(1)).get('unterricht');
 if(token){history.replaceState(null,'',location.pathname+location.search);if(/^[a-f0-9]{64}$/.test(token))connection={token,deviceId:connection?.deviceId||crypto.randomUUID()};}
 if(connection&&!connection.deviceId)connection.deviceId=crypto.randomUUID();
 let current=null,revision=0,deadline=0,timer=null,busy=false,readyResolve,initial=true,toolReady=false,lastSignature='',error='';
 let resources=new Set();
 const isApp=[base.pathname,base.pathname+'index.html',school.pathname,school.pathname+'index.html'].includes(location.pathname);
 const ready=new Promise(resolve=>readyResolve=resolve);
 const closed=()=>({mode:'closed',title:'Alles geschlossen',ids:[],simple:true});
 function getPolicy(){return connection?(current&&Date.now()<deadline?current:closed()):null;}
 function key(){const p=getPolicy();return connection?'.unterricht.'+(connection.id||connection.deviceId)+'.'+(p?.mode||'closed')+'.'+(p?.ids||[]).join('_'):'';}
 function permitted(url){
  const p=getPolicy();if(!p||p.mode==='free')return true;
  const u=new URL(url,location.href);
  if(u.origin!==base.origin)return false;
  if(resources.has(u.href))return true;
  if([school.pathname,school.pathname+'index.html',control.pathname].includes(u.pathname))return true;
  return p.mode==='templates'&&[base.pathname+'vorlagen/',base.pathname+'vorlagen/index.html'].includes(u.pathname)
   ||p.mode==='beads'&&[base.pathname+'vorlagen/perlen/',base.pathname+'vorlagen/perlen/index.html'].includes(u.pathname);
 }
 function overlay(message){
  if(!document.body)return;
  let el=document.getElementById('unterricht-warten');
  if(!el){el=document.createElement('main');el.id='unterricht-warten';el.innerHTML='<h1>Gleich geht’s los.</h1><p role="status"></p><a class="u-aufgabe">Zur Aufgabe</a><a class="u-lehrer">Für Lehrpersonen</a>';el.querySelector('.u-aufgabe').href=school.href;el.querySelector('.u-lehrer').href=control.href;document.body.append(el);}
  el.querySelector('p').textContent=message;
  document.documentElement.classList.add('u-wartet');
 }
 function unhide(){document.documentElement.classList.remove('u-wartet');document.getElementById('unterricht-warten')?.remove();}
 function enforce(){
  if(!connection){unhide();return;}
  const p=getPolicy();
  document.documentElement.classList.toggle('u-aktiv',p.mode!=='free');
  document.documentElement.classList.toggle('u-einfach',p.mode!=='free'&&p.simple!==false);
  if(initial){overlay('Die Verbindung zu deiner Klasse wird geprüft …');return;}
  if(p.mode==='free'){unhide();return;}
  if(isApp){
   if(!location.pathname.startsWith(school.pathname)){location.replace(school.href);return;}
   unhide();return;
  }
  if(p.mode==='closed'){overlay(error||'Deine Lehrperson öffnet eure Aufgabe.');return;}
  if(!permitted(location.href)){location.replace(school.href);return;}
  if(toolReady)unhide();
 }
 function notify(){window.dispatchEvent(new CustomEvent('unterricht:change',{detail:{policy:getPolicy(),revision}}));enforce();}
 async function sync(){
  clearTimeout(timer);if(!connection||busy)return;busy=true;
  const before=JSON.stringify(getPolicy()),controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
  try{
   const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+connection.token},body:JSON.stringify({deviceId:connection.deviceId,revision}),signal:controller.signal,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',redirect:'error'});
   const d=await r.json();if(!r.ok)throw Object.assign(new Error(d.fehler||'Verbindung unterbrochen.'),{status:r.status});
   if(!d.policy||!Array.isArray(d.policy.ids)||!['closed','free','projects','templates','beads'].includes(d.policy.mode)||!Number.isSafeInteger(d.revision))throw new Error('Ungültige Freigabe.');
   current=d.policy;revision=d.revision;deadline=Date.now()+Math.min(90000,Math.max(0,Number(d.leaseMs)||0));error='';
   connection={...connection,id:d.id,name:d.name};
   try{localStorage.setItem(KEY,JSON.stringify(connection));}catch{error='Die Verbindung konnte auf diesem iPad nicht gespeichert werden.';}
  }catch(e){
   error=e.status===401?e.message:'Verbindung unterbrochen. Bitte deiner Lehrperson zeigen.';
   if(e.status===401){current=null;deadline=0;}
  }finally{
   clearTimeout(timeout);busy=false;initial=false;
   const signature=JSON.stringify(getPolicy());
   if(before!==signature||lastSignature!==signature){
    const had=!!lastSignature;lastSignature=signature;
    // Tools keep their work in a separate storage scope before adopting a different selection.
    if(!isApp&&had){window.dispatchEvent(new Event('unterricht:leave'));location.reload();return;}
    notify();
   }else enforce();
   readyResolve();timer=setTimeout(sync,document.hidden?15000:5000);
  }
 }
 window.Unterricht={ready,get active(){return !!connection;},get policy(){return getPolicy();},get name(){return connection?.name||'Deine Klasse';},get error(){return error;},get revision(){return revision;},base:base.href,school:school.href,control:control.href,permitted,storageSuffix:key,sync,
  allowResources:urls=>{resources=new Set(urls.filter(url=>{const u=new URL(url,location.href);return u.origin===base.origin&&/\.pdf$/i.test(u.pathname);}));},
  get groupId(){return connection?.id||connection?.deviceId||'';},
  filter:(items)=>{const p=getPolicy();return !p||p.mode==='free'?items:items.filter(i=>p.ids.includes(i.id));},
  toolReady:()=>{toolReady=true;enforce();},
  unavailable:()=>{toolReady=false;overlay('Deine freigegebene Auswahl konnte nicht geladen werden. Bitte deiner Lehrperson zeigen.');}
 };
 if(!connection){readyResolve();return;}
 document.documentElement.classList.add('u-wartet');
 const style=document.createElement('style');style.textContent=`
 html.u-wartet body>:not(#unterricht-warten):not(script):not(style){display:none!important}
 #unterricht-warten{box-sizing:border-box;max-width:600px;margin:15vh auto;padding:32px 24px;text-align:center;background:#faf7f0;color:#183d3a;border-radius:24px;font:18px/1.5 system-ui,sans-serif}
 #unterricht-warten h1{font-size:28px}#unterricht-warten a{display:inline-block;color:#185951;padding:14px;margin:8px;font-size:16px}#unterricht-warten .u-lehrer{display:block;font-size:14px}
 html.u-aktiv .fm-knopf{display:none!important}
 html.u-aktiv [hidden]{display:none!important}
 @media print{html.u-wartet body>*{display:none!important}}
 `;document.head.append(style);
 document.addEventListener('DOMContentLoaded',enforce);
 document.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a||a.getAttribute('href').startsWith('#')||permitted(a.href))return;e.preventDefault();e.stopImmediatePropagation();},true);
 window.addEventListener('online',sync);
 window.addEventListener('pageshow',()=>{enforce();void sync();});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){enforce();void sync();}});
 window.addEventListener('storage',e=>{if(e.key===KEY){window.dispatchEvent(new Event('unterricht:leave'));location.reload();}});
 setInterval(()=>{if(current&&Date.now()>=deadline){current=null;lastSignature=JSON.stringify(closed());error='Die Verbindung fehlt. Deine Arbeit bleibt gespeichert.';window.dispatchEvent(new Event('unterricht:leave'));notify();}},1000);
 void sync();
})();
