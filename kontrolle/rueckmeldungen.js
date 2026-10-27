'use strict';
(() => {
 const $=s=>document.querySelector(s);
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const uuid=s=>typeof s==='string'&&/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(s);
 const DIFFICULTY=['','Leicht','Genau richtig','Schwierig'],FUN=['','Wenig','Okay','Viel'];
 const state={klassen:[],eintraege:[],cursor:null,busy:false,request:0,audio:new Map(),setupClass:null};
 const date=t=>{const d=new Date(t);return Number.isNaN(d.valueOf())?'Datum unbekannt':d.toLocaleString('de-CH',{dateStyle:'medium',timeStyle:'short'});};
 const failure=e=>e?.message||'Das hat gerade nicht geklappt. Bitte nochmals versuchen.';
 function error(e){$('#fehler-text').textContent=failure(e);$('#fehler').hidden=false;}
 function status(text){$('#status').textContent=text;$('#status').hidden=!text;}
 function busy(on){state.busy=on;for(const id of ['aktualisieren','klasse-filter','mehr'])$('#'+id).disabled=on;}
 function releaseAudio(id){
  const ids=id?[id]:[...state.audio.keys()];
  for(const key of ids){const a=state.audio.get(key);if(!a)continue;a.abort.abort();if(a.element){a.element.pause();a.element.removeAttribute('src');a.element.load();}if(a.url)URL.revokeObjectURL(a.url);state.audio.delete(key);}
 }
 function classList(){
  const selected=$('#klasse-filter').value;
  $('#klasse-filter').innerHTML='<option value="">Alle Klassen</option>'+state.klassen.map(k=>`<option value="${esc(k.id)}">${esc(k.name)}${k.aktiv?'':' · gesperrt'}</option>`).join('');
  $('#klasse-filter').value=state.klassen.some(k=>k.id===selected)?selected:'';
  $('#klassen-liste').innerHTML=state.klassen.length?state.klassen.map(k=>`<div class="class-row"><div><strong>${esc(k.name)}</strong><small>${k.aktiv?'Link aktiv':'Link gesperrt · bestehende Rückmeldungen bleiben erhalten'}</small></div>${k.aktiv?`<button class="secondary" data-revoke="${esc(k.id)}">Link sperren</button>`:''}</div>`).join(''):'<p class="muted small">Noch keine Klasse eingerichtet.</p>';
 }
 function projectList(){
  const selected=$('#projekt-filter').value,projects=new Map();
  state.eintraege.forEach(e=>projects.set(e.videoId,e.titel||'Projekt ohne Titel'));
  $('#projekt-filter').innerHTML='<option value="">Alle Projekte</option>'+[...projects].sort((a,b)=>a[1].localeCompare(b[1],'de')).map(([id,title])=>`<option value="${esc(id)}">${esc(title)}</option>`).join('');
  $('#projekt-filter').value=projects.has(selected)?selected:'';
 }
 function summary(entries){
  const counts=key=>[1,2,3].map(n=>entries.filter(e=>e[key]===n).length);
  const block=(title,labels,numbers)=>`<div class="stat"><h2>${title}</h2><div class="stat-counts">${numbers.map((n,i)=>`<span><b>${n}</b>${labels[i+1]}</span>`).join('')}</div></div>`;
  $('#auswertung').innerHTML=`<div class="stat"><h2>Rückmeldungen</h2><b class="number">${entries.length}</b></div>`+block('Wie schwierig war es?',DIFFICULTY,counts('schwierigkeit'))+block('Wie viel Spass?',FUN,counts('spass'));
  $('#listen-hinweis').textContent=(state.cursor?'Übersicht der bisher geladenen Rückmeldungen. Weitere Einträge kannst du unten laden.':'Übersicht der geladenen Rückmeldungen.')+($('#projekt-filter').value?' Auf das ausgewählte Projekt gefiltert.':'');
 }
 function render(){
  releaseAudio();
  const selected=$('#projekt-filter').value;
  const entries=state.eintraege.filter(e=>!selected||e.videoId===selected).sort((a,b)=>new Date(b.zeit)-new Date(a.zeit));
  summary(entries);
  $('#mehr').hidden=!state.cursor;
  $('#rueckmeldungen').innerHTML=entries.map(e=>{
   const cls=e.klassenname||state.klassen.find(k=>k.id===e.klasseId)?.name||'Klasse';
   const grade=Number.isInteger(e.klasse)&&e.klasse>=1&&e.klasse<=6?' · '+e.klasse+'. Klasse':'';
   return `<article class="entry" data-entry="${esc(e.id)}"><div class="entry-head"><div><h2>${esc(e.titel||'Projekt ohne Titel')}</h2><p class="entry-meta">${esc(cls)}${grade}</p></div><time class="entry-meta">${esc(date(e.zeit))}</time></div><div class="ratings"><span class="rating">Schwierigkeit: <b>${esc(DIFFICULTY[e.schwierigkeit]||'Nicht angegeben')}</b></span><span class="rating fun">Spass: <b>${esc(FUN[e.spass]||'Nicht angegeben')}</b></span></div><div class="entry-actions">${e.audio?`<button class="secondary" data-audio="${esc(e.id)}">▶ Audio anhören</button>`:'<span class="small muted">Ohne Audio</span>'}<button class="danger" data-delete="${esc(e.id)}" aria-label="Rückmeldung zu ${esc(e.titel)} löschen">Löschen</button></div><div class="audio-wrap"></div><p class="row-error" role="alert" hidden></p></article>`;
  }).join('')||`<div class="empty"><span aria-hidden="true">💬</span><h2>Noch keine Rückmeldungen</h2><p>${selected?'Zu diesem Projekt ist in der geladenen Auswahl noch nichts dabei.':state.klassen.length?'Sobald eure Kinder ein Projekt bewerten, findest du ihre Rückmeldungen hier.':'Richte oben zuerst eine Klasse und ihre Tablets ein.'}</p></div>`;
 }
 async function classes(){const j=await W.feedback('/feedback/klassen');state.klassen=(j.klassen||[]).filter(k=>uuid(k.id));classList();}
 async function load(reset=true){
  if(state.busy)return;
  const request=++state.request;busy(true);$('#fehler').hidden=true;status(reset?'Rückmeldungen werden geladen …':'Weitere Rückmeldungen werden geladen …');
  const params=new URLSearchParams(),cls=$('#klasse-filter').value;if(cls)params.set('klasse',cls);if(!reset&&state.cursor)params.set('cursor',state.cursor);
  try{
   const query=params.toString(),j=await W.feedback('/feedback/liste'+(query?'?'+query:''));if(request!==state.request)return;
   const rows=(j.eintraege||[]).filter(e=>uuid(e.id)&&typeof e.videoId==='string');
   const all=new Map((reset?[]:state.eintraege).map(e=>[e.id,e]));rows.forEach(e=>all.set(e.id,e));state.eintraege=[...all.values()];state.cursor=typeof j.cursor==='string'&&j.cursor?j.cursor:null;
   projectList();render();status('');
  }catch(e){if(request===state.request){error(e);status(state.eintraege.length?'Die zuletzt geladenen Rückmeldungen bleiben sichtbar.':'Die Rückmeldungen konnten noch nicht geladen werden.');}}
  finally{if(request===state.request)busy(false);}
 }
 async function openAudio(button,id){
  const entry=button.closest('[data-entry]'),rowError=entry.querySelector('.row-error');rowError.hidden=true;
  releaseAudio(id);const job={abort:new AbortController(),url:null,element:null};state.audio.set(id,job);button.disabled=true;button.textContent='Audio wird geladen …';
  try{
   const blob=await W.feedback('/feedback/audio?'+new URLSearchParams({id}),{signal:job.abort.signal},'blob');
   if(state.audio.get(id)!==job||!button.isConnected)return;
   job.url=URL.createObjectURL(blob);const audio=document.createElement('audio');job.element=audio;audio.controls=true;audio.preload='metadata';audio.src=job.url;
   audio.addEventListener('play',()=>document.querySelectorAll('audio').forEach(other=>{if(other!==audio)other.pause();}));
   audio.addEventListener('error',()=>{if(!button.isConnected)return;rowError.textContent='Dieses Audio kann gerade nicht abgespielt werden.';rowError.hidden=false;button.hidden=false;releaseAudio(id);});
   entry.querySelector('.audio-wrap').replaceChildren(audio);button.hidden=true;await audio.play().catch(()=>{});
  }catch(e){if(e.name!=='AbortError'&&button.isConnected){rowError.textContent=failure(e);rowError.hidden=false;}}
  finally{if(button.isConnected){button.disabled=false;button.textContent='▶ Audio anhören';}}
 }
 $('#projekt-filter').onchange=render;
 $('#klasse-filter').onchange=()=>{state.eintraege=[];state.cursor=null;$('#projekt-filter').value='';projectList();render();load();};
 $('#aktualisieren').onclick=()=>load();$('#mehr').onclick=()=>load(false);
 $('#abmelden').onclick=()=>{releaseAudio();W.abmelden();};$('#neu-anmelden').onclick=()=>{releaseAudio();W.abmelden();};
 $('#nochmals').onclick=()=>start();
 $('#neue-klasse').onsubmit=async event=>{
  event.preventDefault();const name=$('#klassenname').value.trim();if(!name)return;const button=event.submitter||$('#neue-klasse button');button.disabled=true;$('#fehler').hidden=true;
  try{
   const j=await W.feedback('/feedback/klassen',{method:'POST',body:JSON.stringify({name})});
   if(typeof j.token!=='string'||!j.token)throw new Error('Der Klassenlink konnte nicht angezeigt werden. Bitte die Klassenliste neu laden.');
   state.setupClass=j.id;$('#einrichtungsname').textContent='Klassenlink für '+(j.name||name);$('#einrichtungslink').value='https://conradinjoos-lab.github.io/schrittli/schule/#klasse='+encodeURIComponent(j.token);$('#einrichtung').hidden=false;$('#link-kopieren').textContent='Link kopieren';$('#klassenname').value='';
   await classes();status('Klassenlink erstellt. Kopiere ihn jetzt für eure Tablets.');$('#einrichtungslink').focus();
  }catch(e){error(e);}finally{button.disabled=false;}
 };
 $('#link-kopieren').onclick=async()=>{
  try{await navigator.clipboard.writeText($('#einrichtungslink').value);$('#link-kopieren').textContent='Kopiert ✓';status('Der Klassenlink ist kopiert.');}
  catch{$('#einrichtungslink').focus();$('#einrichtungslink').select();status('Der Link ist markiert. Kopiere ihn über das Menü deines Geräts.');}
 };
 $('#klassen-liste').onclick=async event=>{
  const button=event.target.closest('[data-revoke]');if(!button)return;const k=state.klassen.find(x=>x.id===button.dataset.revoke);if(!k||!confirm(`Klassenlink für «${k.name}» sperren?\nDiese Tablets können danach keine Rückmeldungen mehr abgeben. Bestehende Rückmeldungen bleiben erhalten.`))return;
  button.disabled=true;try{await W.feedback('/feedback/klassen/sperren',{method:'POST',body:JSON.stringify({id:k.id})});k.aktiv=false;classList();if(state.setupClass===k.id){$('#einrichtung').hidden=true;$('#einrichtungslink').value='';state.setupClass=null;}status('Klassenlink gesperrt. Bestehende Rückmeldungen bleiben erhalten.');}catch(e){error(e);button.disabled=false;}
 };
 $('#rueckmeldungen').onclick=async event=>{
  const button=event.target.closest('[data-audio],[data-delete]');if(!button)return;
  if(button.dataset.audio){await openAudio(button,button.dataset.audio);return;}
  const e=state.eintraege.find(x=>x.id===button.dataset.delete);if(!e||!confirm(`Diese Rückmeldung zu «${e.titel}» endgültig löschen?\nEin zugehöriges Audio wird ebenfalls gelöscht.`))return;
  button.disabled=true;try{await W.feedback('/feedback/loeschen',{method:'POST',body:JSON.stringify({id:e.id})});releaseAudio(e.id);state.eintraege=state.eintraege.filter(x=>x.id!==e.id);projectList();render();status('Rückmeldung gelöscht.');}catch(x){const row=button.closest('[data-entry]').querySelector('.row-error');row.textContent=failure(x);row.hidden=false;button.disabled=false;}
 };
 async function start(){
  if(W.LOKAL){$('#lokal').hidden=false;$('#abmelden').hidden=true;status('Die Rückmeldungsansicht benötigt die geschützte Online-Anmeldung.');return;}
  $('#fehler').hidden=true;status('Anmeldung wird geprüft …');
  try{await W.bereit();await classes();$('#inhalt').hidden=false;if(!state.klassen.length)$('#klassen-panel').open=true;await load();}
  catch(e){error(e);status('');}
 }
 window.addEventListener('pagehide',()=>releaseAudio());
 start();
})();
