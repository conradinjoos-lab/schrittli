/* Gemeinsame Schulwerke. Lokale Warteschlange + automatische Abholung alle 8 s. */
const SCHULWERKE_API='https://schrittli-anmelden.conradinjoos.workers.dev';
const SCHULWERKE_KEY='schrittli.schulwerke.verbindung';
let schulVerbindung=null,schulRemote=[],schulVersion=-1,schulBusy=false,schulTimer=null,schulStatus='',schulGeneration=0;
const schulFotoURLs=new Map(),schulFotoRequests=new Map();
function schulUuid(){return crypto.randomUUID();}
function schulSterne(n){return Number.isInteger(n)&&n>=1&&n<=5?`<span class="sw-sterne" aria-label="${n} von 5 Sternen"><span aria-hidden="true">${'★'.repeat(n)}${'☆'.repeat(5-n)}</span></span>`:'';}
function schulAlleWerke(){
 const own=S.works.filter(w=>w.profileId==='klasse'&&(!w.sammlungId||w.sammlungId===schulVerbindung?.id));
 const map=new Map(own.map(w=>[w.id,w]));
 for(const w of schulRemote)map.set(w.id,{...map.get(w.id),...w,shared:true,profileId:'klasse',type:'foto',createdAt:w.erstellt});
 return [...map.values()].sort((a,b)=>b.createdAt-a.createdAt);
}
function schulProjektHtml(id){
 if(!SCHULE)return '';
 const rows=schulAlleWerke().filter(w=>w.videoId===id&&w.name);
 return `<span class="sw-projekt" data-schul-projekt="${esc(id)}">${schulProjektInhalt(rows)}</span>`;
}
function schulProjektInhalt(rows){return rows.length?`<span class="sw-gemacht">Schon gemacht</span>${rows.slice(0,3).map(w=>`<span class="sw-person"><span>${esc(w.name)}</span>${schulSterne(w.sterne)}</span>`).join('')}${rows.length>3?`<span class="sw-mehr">und ${rows.length-3} weitere · beim Projekt ansehen</span>`:''}`:'';}
async function schulRequest(path,options={},connection=schulVerbindung){
 if(!connection)throw new Error('Dieses iPad ist noch nicht verbunden.');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
 try{
  const r=await fetch(SCHULWERKE_API+'/sammlung/'+path,{...options,headers:{...options.headers,Authorization:'Bearer '+connection.token},signal:controller.signal,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'});
  if(!r.ok){const d=await r.json().catch(()=>({}));throw Object.assign(new Error(d.fehler||'Verbindung unterbrochen. Wir versuchen es wieder.'),{status:r.status});}return r;
 }finally{clearTimeout(timer);}
}
function schulDauerhaftSpeichern(){localStorage.setItem(KEY,JSON.stringify(S));}
function schulStatusText(){
 if(!schulVerbindung)return 'Fotos bleiben auf diesem iPad. Deine Lehrperson kann die gemeinsame Sammlung verbinden.';
 const waiting=S.works.filter(w=>w.sammlungId===schulVerbindung.id&&w.sync==='wartet').length;
 return schulStatus||(waiting?`${waiting} ${waiting===1?'Foto wartet':'Fotos warten'} auf die Übertragung. Wird automatisch nochmals versucht.`:`Verbunden mit ${schulVerbindung.name} · Fotos erscheinen automatisch auf allen verbundenen iPads.`);
}
function schulRelease(){for(const u of schulFotoURLs.values())URL.revokeObjectURL(u);schulFotoURLs.clear();schulFotoRequests.clear();}
function schulRefreshUI(){
 if(!SCHULE||view.name==='boot')return;
 for(const el of $$('[data-schul-projekt]'))el.innerHTML=schulProjektInhalt(schulAlleWerke().filter(w=>w.videoId===el.dataset.schulProjekt&&w.name));
 for(const el of $$('[data-schul-status]'))el.textContent=schulStatusText();
 for(const el of $$('[data-schul-projekt-liste]'))schulProjektGalerie(el,el.dataset.schulProjektListe);
 if(view.name==='gallery'){const app=$('#app'),signature=JSON.stringify([schulAlleWerke(),schulStatusText(),view.params]);if(app.dataset.swGallery!==signature)schulGalerieMalen(app,view.params||{});}
}
async function schulSync(){
 clearTimeout(schulTimer);
 if(!SCHULE||!schulVerbindung||document.hidden||schulBusy)return;
 schulBusy=true;const connection=schulVerbindung,generation=schulGeneration;
 try{
  for(const w of S.works.filter(w=>w.sammlungId===connection.id&&w.sync==='wartet')){
   if(generation!==schulGeneration)return;
   const blob=await blobs.get(w.id);if(!blob){w.syncFehler='Das lokale Foto fehlt. Bitte nochmals aufnehmen.';continue;}
   const form=new FormData();form.append('daten',JSON.stringify({id:w.id,videoId:w.videoId,titel:w.titel,name:w.name,klasse:w.klasse,sterne:w.sterne}));form.append('foto',blob,'werk.jpg');
   try{
    const d=await (await schulRequest('abgeben',{method:'POST',body:form},connection)).json();
    if(generation!==schulGeneration)return;
    if(d.geloescht){S.works=S.works.filter(x=>x.id!==w.id);await blobs.del(w.id);}else{w.sync='geteilt';delete w.syncFehler;}
    schulDauerhaftSpeichern();
   }catch(e){if([400,413,415].includes(e.status)){w.syncFehler=e.message;continue;}throw e;}
  }
  const d=await (await schulRequest('werke?version='+schulVersion,{},connection)).json();if(generation!==schulGeneration)return;
  if(!d.unveraendert){
   schulRemote=d.werke||[];schulVersion=d.version;
   for(const id of d.geloescht||[]){S.works=S.works.filter(w=>w.id!==id);await blobs.del(id);if(schulFotoURLs.has(id)){URL.revokeObjectURL(schulFotoURLs.get(id));schulFotoURLs.delete(id);}}
   schulDauerhaftSpeichern();
  }
  schulStatus='';
 }catch(e){if(generation===schulGeneration){schulStatus=e.status===401?e.message:'Verbindung unterbrochen. Neue Fotos bleiben hier und werden automatisch nachgesendet.';if(e.status===401){schulRemote=[];schulRelease();}}}
 finally{schulBusy=false;schulRefreshUI();if(schulVerbindung&&!document.hidden)schulTimer=setTimeout(schulSync,8000);}
}
async function schulFotoUrl(w){
 if(!w.shared)return blobs.url(w.id);
 if(schulFotoURLs.has(w.id))return schulFotoURLs.get(w.id);
 if(schulFotoRequests.has(w.id))return schulFotoRequests.get(w.id);
 const generation=schulGeneration;
 const request=(async()=>{try{const b=await (await schulRequest('foto?id='+encodeURIComponent(w.id))).blob();if(generation!==schulGeneration||!schulRemote.some(x=>x.id===w.id))return null;const u=URL.createObjectURL(b);schulFotoURLs.set(w.id,u);return u;}catch{return null;}finally{schulFotoRequests.delete(w.id);}})();
 schulFotoRequests.set(w.id,request);return request;
}
function schulFotoLaden(root){
 const elements=$$('[data-schul-foto]',root);let next=0;
 const load=async()=>{while(next<elements.length){const el=elements[next++];if(!el.isConnected)continue;const w=schulAlleWerke().find(x=>x.id===el.dataset.schulFoto);if(!w)continue;const u=await schulFotoUrl(w);if(u&&el.isConnected)el.src=u;}};
 void Promise.all([load(),load(),load()]);
}
function schulFotoKarten(rows){return rows.map(w=>`<button class="sw-werk" data-schul-open="${esc(w.id)}"><span class="sw-bild"><img data-schul-foto="${esc(w.id)}" alt="Werk von ${esc(w.name||'einem Kind')}" loading="lazy"></span><span class="sw-person"><b>${esc(w.name||'Ohne Namen')}</b>${schulSterne(w.sterne)}</span><span>${esc(w.titel||videoOf(w.videoId)?.title||'Mein Werk')}</span><small>${w.klasse?esc(klasseName(w.klasse))+' · ':''}${w.shared||w.sync==='geteilt'?'Geteilt':w.syncFehler?esc(w.syncFehler):w.sync==='wartet'?'Wird geteilt …':'Auf diesem iPad'}</small></button>`).join('');}
function schulProjektGalerie(el,id){
 const rows=schulAlleWerke().filter(w=>w.videoId===id);
 const signature=JSON.stringify(rows.map(w=>[w.id,w.sync,w.shared,w.sterne,w.syncFehler]));if(el.dataset.signature===signature)return;
 el.dataset.signature=signature;el.innerHTML=rows.length?`<h2>Das haben wir gemacht</h2><div class="sw-grid">${schulFotoKarten(rows.slice(0,20))}</div>${rows.length>20?`<button class="btn" data-schul-gallery="${esc(id)}">Alle ${rows.length} Werke zu diesem Projekt</button>`:''}`:'';schulFotoLaden(el);
}
async function schulWerkOeffnen(id){
 const w=schulAlleWerke().find(x=>x.id===id);if(!w)return;
 const u=await schulFotoUrl(w);if(!u){toast('Das Foto ist gerade nicht verfügbar. Versuche es nochmals.');return;}
 kidModal(`<div class="viewer"><img src="${esc(u)}" alt="Werk von ${esc(w.name||'einem Kind')}"></div><h2>${esc(w.name||'Mein Werk')} ${schulSterne(w.sterne)}</h2><p>${esc(w.titel||videoOf(w.videoId)?.title||'')}${w.klasse?' · '+esc(klasseName(w.klasse)):''}</p><div class="row"><button class="btn" data-close>Schliessen</button></div>`);
}
function schulGalerieMalen(app,params={}){
 app.dataset.swGallery=JSON.stringify([schulAlleWerke(),schulStatusText(),params]);
 const grade=Number(params.klasse)||0,limit=Number(params.limit)||40,rows=schulAlleWerke().filter(w=>(!grade||w.klasse===grade)&&(!params.videoId||w.videoId===params.videoId));
 app.innerHTML=`<main class="v3${schriftNormal()?'':' caps'}"><div class="v3-in">${v3Kopf('<button class="v3-rund gross" data-act="back" aria-label="Zurück">'+ico('back')+'</button>','<h1>Unsere Werke</h1>')}<p class="sw-status" data-schul-status role="status">${esc(schulStatusText())}</p><label class="sw-filter">Klasse <select class="inp" id="sw-klasse"><option value="0">Alle Klassen</option>${STUFEN.map(k=>`<option value="${k}" ${grade===k?'selected':''}>${klasseName(k)}</option>`).join('')}</select></label><div class="sw-grid">${schulFotoKarten(rows.slice(0,limit))}</div>${rows.length>limit?'<button class="btn" data-act="mehr-werke">Weitere Werke</button>':''}${!rows.length?'<p class="empty">Hier ist Platz für eure Werke. Mach am Ende eines Projekts ein Foto.</p>':''}<button class="btn ghost" data-act="lehrer">Für Lehrpersonen</button></div></main>`;
 wire(app,{back:()=>params.school?go('school',{video:params.school}):go('home'),gallery:()=>go('gallery'),lehrer:()=>go('lehrer'),'mehr-werke':()=>{view.params.limit=limit+40;schulGalerieMalen(app,view.params);}});
 $('#sw-klasse',app).onchange=e=>{view.params.klasse=+e.target.value;schulGalerieMalen(app,view.params);};schulFotoLaden(app);
}
function schulFotoAngaben(){return new Promise(resolve=>{
 let sterne=0,settled=false;
 const finish=value=>{if(!settled){settled=true;resolve(value);}};
 modal(`<h2>Dein Werk</h2><label class="sw-label" for="sw-name">Dein Vorname</label><input class="inp" id="sw-name" maxlength="30" autocomplete="off" autocapitalize="words" placeholder="Vorname"><label class="sw-label" for="sw-grade">Deine Klasse</label><select class="inp" id="sw-grade"><option value="">Bitte wählen</option>${STUFEN.map(k=>`<option value="${k}" ${k===(S.settings.klasse||S.settings.fotoKlasse)?'selected':''}>${klasseName(k)}</option>`).join('')}</select><fieldset class="sw-rating"><legend>Wie hat dir das Projekt gefallen?</legend><div class="sw-rating-buttons">${[1,2,3,4,5].map(n=>`<button type="button" class="sw-star" data-act="stern" data-n="${n}" aria-label="${n} ${n===1?'Stern':'Sterne'}" aria-pressed="false">☆</button>`).join('')}</div><p id="sw-rating-text" aria-live="polite">Wähle 1 bis 5 Sterne.</p></fieldset><p id="sw-error" role="alert"></p><p class="small muted">${schulVerbindung?'Dein Foto, Vorname und deine Sterne werden mit eurer Sammlung geteilt.':'Noch nicht verbunden: Dein Foto bleibt vorerst auf diesem iPad.'}</p><div class="row"><button class="btn ghost" data-close>Abbrechen</button><button class="kbtn primary" data-act="speichern">Foto speichern</button></div>`,{
  stern:(b,close,root)=>{sterne=+b.dataset.n;for(const button of $$('[data-act="stern"]',root)){button.textContent=+button.dataset.n<=sterne?'★':'☆';button.setAttribute('aria-pressed',String(+button.dataset.n===sterne));}$('#sw-rating-text',root).textContent=sterne+' von 5 Sternen';},
  speichern:(b,close,root)=>{const name=$('#sw-name',root).value.trim(),klasse=+$('#sw-grade',root).value;if(!name||!klasse||!sterne){$('#sw-error',root).textContent='Bitte Vorname, Klasse und Sterne angeben.';return;}finish({name,klasse,sterne});close();}
 },'kid',()=>finish(null));
});}
async function schulVerbinden(token){
 if(!/^[a-f0-9]{64}$/.test(token))throw new Error('Bitte den vollständigen Sammlungslink einfügen.');
 const connection=await (await schulRequest('verbinden',{}, {token})).json();
 const value={id:connection.id,name:connection.name,token};localStorage.setItem(SCHULWERKE_KEY,JSON.stringify(value));
 schulGeneration++;schulRelease();schulVerbindung=value;schulRemote=[];schulVersion=-1;schulStatus='';
 for(const w of S.works)if(w.schulNeu&&!w.sammlungId){w.sammlungId=value.id;w.sync='wartet';}
 schulDauerhaftSpeichern();void schulSync();toast('Mit '+value.name+' verbunden.');
}
function schulVerbindungsDialog(){
 modal(`<h2>iPads verbinden</h2><p>Öffne denselben Sammlungslink einmal auf jedem Schul-iPad. Fotos und Sterne werden dann automatisch geteilt.</p>${schulVerbindung?`<p>Verbunden mit <b>${esc(schulVerbindung.name)}</b></p><button class="btn" data-act="kopieren">Sammlungslink kopieren</button>`:''}<p><a href="../kontrolle/sammlung.html">Sammlung als Lehrperson einrichten</a></p><label for="sw-link">Sammlungslink</label><input class="inp" id="sw-link" autocomplete="off" spellcheck="false"><p id="sw-connect-error" role="alert"></p><div class="row"><button class="btn ghost" data-close>Schliessen</button><button class="btn primary" data-act="verbinden">Verbinden</button></div>`,{
  kopieren:async(b,close,root)=>{const link=new URL(location.pathname,location.origin).href+'#sammlung='+schulVerbindung.token;try{await navigator.clipboard.writeText(link);b.textContent='Kopiert';}catch{$('#sw-link',root).value=link;$('#sw-link',root).select();}},
  verbinden:async(b,close,root)=>{const value=$('#sw-link',root).value.trim();const token=value.match(/(?:^|#|&)sammlung=([a-f0-9]{64})(?:&|$)/)?.[1]||value;b.disabled=true;try{await schulVerbinden(token);close();render();}catch(e){$('#sw-connect-error',root).textContent=e.message;b.disabled=false;}}
 });
}
function schulLehrerHtml(){return SCHULE?`<section class="panel"><h2>Gemeinsame Fotosammlung</h2><p data-schul-status>${esc(schulStatusText())}</p><div class="row"><button class="btn primary" data-act="schul-verbinden">iPads verbinden</button><a class="btn" href="../kontrolle/sammlung.html">Sammlung verwalten</a></div></section>`:'';}
async function schulStart(){
 if(!SCHULE)return;
 try{const c=JSON.parse(localStorage.getItem(SCHULWERKE_KEY)||'null');if(c&&/^[a-f0-9]{64}$/.test(c.token)&&c.id)schulVerbindung=c;}catch{}
 const params=new URLSearchParams(location.hash.slice(1));if(params.has('sammlung')){
  const token=params.get('sammlung');params.delete('sammlung');history.replaceState(null,'',location.pathname+location.search+(params.size?'#'+params:''));
  try{await schulVerbinden(token);}catch(e){toast(e.message,6000);}
 }
 void schulSync();
}
if(SCHULE){
 SCREENS.gallery=schulGalerieMalen;
 document.addEventListener('click',e=>{const gallery=e.target.closest('[data-schul-gallery]');if(gallery){e.preventDefault();go('gallery',{videoId:gallery.dataset.schulGallery});return;}const b=e.target.closest('[data-schul-open]');if(b){e.preventDefault();void schulWerkOeffnen(b.dataset.schulOpen);}});
 window.addEventListener('online',()=>void schulSync());
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTimeout(schulTimer);else void schulSync();});
}
async function schulFotoKomprimieren(canvas){
 for(const size of [1400,1000,700]){
  if(Math.max(canvas.width,canvas.height)>size){const scale=size/Math.max(canvas.width,canvas.height),copy=document.createElement('canvas');copy.width=Math.round(canvas.width*scale);copy.height=Math.round(canvas.height*scale);copy.getContext('2d').drawImage(canvas,0,0,copy.width,copy.height);canvas=copy;}
  for(const quality of [.82,.65,.45]){const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));if(blob&&blob.size<=600000)return blob;}
 }
 throw new Error('Foto zu gross');
}
