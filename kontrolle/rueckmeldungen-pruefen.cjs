'use strict';
// Offline integration checks. No requests, authentication or student data leave this process.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=f=>fs.readFileSync(path.join(__dirname,f),'utf8'),tick=()=>new Promise(r=>setImmediate(r));
const CID='d15473e8-a179-4da0-b8dc-8c55464d291d',FID='5af5dd95-f9fe-4e3a-b56d-e724b37873b0';
function apiRuntime(respond,stored={token:'test-token',ablauf:0,refresh:''}){
 const calls=[],c={URLSearchParams,Date,JSON,Error,location:{hostname:'conradinjoos-lab.github.io'},localStorage:{getItem:()=>JSON.stringify(stored),setItem(){},removeItem(){}},fetch:async(url,opt)=>{calls.push({url,opt});return respond(url,opt,calls.length);}};
 vm.createContext(c);vm.runInContext(read('werkstatt.js')+'\nglobalThis.api=W;',c);return{c,calls};
}
async function checkApi(){
 const a=apiRuntime(async()=>({ok:true,json:async()=>({klassen:[]})}));await a.c.api.feedback('/feedback/klassen');
 assert.equal(a.calls[0].opt.headers.Authorization,'Bearer test-token');assert(!a.calls[0].url.includes('test-token'));assert.equal(a.calls[0].opt.cache,'no-store');assert.equal(a.calls[0].opt.redirect,'error');
 const b=apiRuntime(async(url)=>url.endsWith('/erneuern')?{ok:true,json:async()=>({token:'renewed-token',ablauf:0,refresh:'refresh-again'})}:url.endsWith('/feedback/liste')&&b.calls.filter(c=>c.url.endsWith('/feedback/liste')).length===1?{ok:false,status:401,json:async()=>({})}:{ok:true,json:async()=>({eintraege:[]})},{token:'old-token',ablauf:0,refresh:'refresh-token'});
 await b.c.api.feedback('/feedback/liste');assert.equal(b.calls.length,3);assert.equal(b.calls[2].opt.headers.Authorization,'Bearer renewed-token');
 const marker={audio:true},c=apiRuntime(async()=>({ok:true,blob:async()=>marker}));assert.equal(await c.c.api.feedback('/feedback/audio?id='+FID,{},'blob'),marker);
 const denied=apiRuntime(async()=>({ok:false,status:403,json:async()=>({fehler:'Denied'})}));await assert.rejects(()=>denied.c.api.feedback('/feedback/klassen'),/keine Rückmeldungen/);
 await assert.rejects(()=>a.c.api.feedback('https://example.org'),/Ungültiger/);assert.equal(a.calls.length,1);
 console.log('API: header-only authentication, refresh/retry, private audio blobs, rejected account and route bounds pass.');
}
function node(){return{value:'',innerHTML:'',textContent:'',hidden:false,disabled:false,isConnected:true,dataset:{},events:{},addEventListener(k,v){this.events[k]=v;},focus(){this.focused=true;},select(){this.selected=true;},replaceChildren(...items){this.children=items;},removeAttribute(){},load(){},pause(){this.paused=true;},play(){return Promise.resolve();}};}
async function checkUi(){
 const nodes=new Map(),get=s=>{if(!nodes.has(s))nodes.set(s,node());return nodes.get(s);},calls=[],urls=[],revoked=[],events={},audio=[];
 let allowConfirm=true,failList=false,classes=[{id:CID,name:'2b <img onerror=bad>',aktiv:true}];
 let rows=[{id:FID,klasseId:CID,klassenname:'2b <img onerror=bad>',videoId:'herz',titel:'Fadenherz <script>bad</script>',klasse:2,schwierigkeit:2,spass:3,zeit:'2026-10-27T17:00:00Z',audio:true},{id:'7ac57841-f079-45d3-aa9f-65c69e84e02b',klasseId:CID,videoId:'igel',titel:'Holzigel',klasse:2,schwierigkeit:3,spass:2,zeit:'2026-10-27T16:00:00Z',audio:false}];
 const c={URLSearchParams,AbortController,Map,Set,Date,JSON,console,confirm:()=>allowConfirm,navigator:{clipboard:{writeText:async()=>{}}},URL:{createObjectURL:()=>{const u='blob:test-'+urls.length;urls.push(u);return u;},revokeObjectURL:u=>revoked.push(u)},document:{querySelector:get,querySelectorAll:()=>audio,createElement:()=>{const a=node();audio.push(a);return a;}},W:{LOKAL:false,bereit:async()=>{},abmelden(){},feedback:async(p,opt={},type)=>{
  calls.push({p,opt,type});if(p==='/feedback/klassen'&&!opt.method)return{klassen:classes};
  if(p.startsWith('/feedback/liste')){if(failList)throw new Error('Testfehler');return{eintraege:rows,cursor:null};}
  if(p.startsWith('/feedback/audio'))return{type:'audio/webm'};
  if(p==='/feedback/klassen'&&opt.method==='POST')return{id:CID,name:'Neue Klasse',token:'a'.repeat(64)};
  if(p==='/feedback/klassen/sperren')return{ok:true};
  if(p==='/feedback/loeschen'){rows=rows.filter(e=>e.id!==JSON.parse(opt.body).id);return{ok:true};}
  throw new Error('Unexpected API route '+p);
 }},window:{addEventListener:(n,fn)=>events[n]=fn}};
 vm.createContext(c);vm.runInContext(read('rueckmeldungen.js'),c);await tick();await tick();
 assert.equal(get('#inhalt').hidden,false);assert(get('#rueckmeldungen').innerHTML.includes('&lt;script&gt;'));assert(!get('#rueckmeldungen').innerHTML.includes('<script>'));assert(!calls.some(x=>x.p.startsWith('/feedback/audio')),'Audio must only load on request');
 const entry=node(),rowError=node(),wrap=node();entry.querySelector=s=>s==='.row-error'?rowError:wrap;
 const audioButton=node();audioButton.dataset.audio=FID;audioButton.closest=()=>entry;
 await get('#rueckmeldungen').onclick({target:{closest:()=>audioButton}});assert.equal(audio[0].src,'blob:test-0');assert(calls.some(x=>x.p==='/feedback/audio?id='+FID&&x.type==='blob'));
 get('#projekt-filter').value='igel';get('#projekt-filter').onchange();assert(revoked.includes('blob:test-0'));assert(!get('#rueckmeldungen').innerHTML.includes('Fadenherz'));assert(get('#rueckmeldungen').innerHTML.includes('Holzigel'));
 get('#projekt-filter').value='';get('#projekt-filter').onchange();
 const del=node();del.dataset.delete=FID;del.closest=()=>entry;allowConfirm=false;await get('#rueckmeldungen').onclick({target:{closest:()=>del}});assert(!calls.some(x=>x.p==='/feedback/loeschen'));
 allowConfirm=true;await get('#rueckmeldungen').onclick({target:{closest:()=>del}});assert(calls.some(x=>x.p==='/feedback/loeschen'&&JSON.parse(x.opt.body).id===FID));assert(!get('#rueckmeldungen').innerHTML.includes('Fadenherz'));
 get('#klasse-filter').value=CID;await get('#klasse-filter').onchange();await tick();assert(calls.some(x=>x.p==='/feedback/liste?klasse='+CID));
 get('#klassenname').value='Neue Klasse';await get('#neue-klasse').onsubmit({preventDefault(){},submitter:node()});assert(get('#einrichtungslink').value.endsWith('#klasse='+'a'.repeat(64)));assert.equal(get('#einrichtung').hidden,false);
 const revoke=node();revoke.dataset.revoke=CID;await get('#klassen-liste').onclick({target:{closest:()=>revoke}});assert(calls.some(x=>x.p==='/feedback/klassen/sperren'));assert.equal(get('#einrichtungslink').value,'');assert.equal(calls.filter(x=>x.p==='/feedback/loeschen').length,1,'Revoking a link must not delete feedback');
 failList=true;await get('#aktualisieren').onclick();assert.equal(get('#fehler').hidden,false);assert.equal(get('#aktualisieren').disabled,false);events.pagehide();
 console.log('Teacher UI: escaped content, class/project filters, audio on demand/revocation, confirmed deletion, one-time setup link, non-destructive revoke and error recovery pass.');
}
(async()=>{await checkApi();await checkUi();})().catch(e=>{console.error(e);process.exitCode=1;});
