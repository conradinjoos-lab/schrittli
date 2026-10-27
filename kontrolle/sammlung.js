'use strict';
(()=>{
 const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
 let collections=[],entries=[],generation=0,photoURL=null;
 const error=e=>{$('#fehler').textContent=e.message||'Das hat nicht geklappt.';$('#fehler').hidden=false;$('#nochmals').hidden=false;};
 const api=(path,body)=>W.sammlung('/sammlung/'+path,body?{method:'POST',body:JSON.stringify(body)}:{});
 async function load(){
  const id=$('#sammlung').value,gen=++generation;$('#fehler').hidden=true;$('#status').textContent='Werke werden geladen …';$('#werke').innerHTML='';
  if(!id){$('#status').textContent='Erstelle eure erste Sammlung.';return;}
  try{const d=await api('verwaltung/werke?id='+encodeURIComponent(id));if(gen!==generation)return;entries=d.werke;$('#status').textContent=entries.length+' Werke';$('#werke').innerHTML=entries.map(w=>`<article class="photo-card"><b>${esc(w.name)} <span class="stars" aria-label="${w.sterne} von 5 Sternen">${'★'.repeat(w.sterne)}${'☆'.repeat(5-w.sterne)}</span></b><span>${esc(w.titel)}</span><small>${w.klasse}. Klasse · ${new Date(w.erstellt).toLocaleDateString('de-CH')}</small><button class="secondary" data-foto="${w.id}">Foto ansehen</button><button class="text-btn" data-loeschen="${w.id}">Werk löschen</button></article>`).join('');$('#sperren').disabled=!collections.find(k=>k.id===id)?.aktiv;}catch(e){if(gen===generation)error(e);}
 }
 async function list(selected){collections=(await api('verwaltung')).sammlungen;$('#sammlung').innerHTML=collections.map(k=>`<option value="${k.id}">${esc(k.name)}${k.aktiv?'':' · gesperrt'}</option>`).join('');if(selected)$('#sammlung').value=selected;}
 async function start(){
  if(W.LOKAL){$('#status').textContent='Die Verwaltung benötigt deine Online-Anmeldung.';return;}
  try{await W.bereit();await list();$('#inhalt').hidden=false;if(!collections.length)document.querySelector('details').open=true;await load();}catch(e){error(e);}
 }
 $('#erstellen').onsubmit=async e=>{e.preventDefault();const b=e.submitter;b.disabled=true;try{const k=await api('erstellen',{name:$('#name').value.trim()});$('#link').value=new URL('../schule/',location.href).href+'#sammlung='+k.token;$('#setup').hidden=false;$('#name').value='';await list(k.id);await load();}catch(x){error(x);}finally{b.disabled=false;}};
 $('#kopieren').onclick=async()=>{try{await navigator.clipboard.writeText($('#link').value);$('#status').textContent='Link kopiert.';}catch{$('#link').select();$('#status').textContent='Kopiere den markierten Link.';}};
 $('#sperren').onclick=async()=>{const id=$('#sammlung').value;if(!id||!confirm('Diesen Sammlungslink sperren? Die verbundenen iPads können danach keine gemeinsamen Werke mehr lesen oder hinzufügen.'))return;try{await api('sperren',{id});await list(id);await load();}catch(e){error(e);}};
 $('#werke').onclick=async e=>{const b=e.target.closest('[data-foto],[data-loeschen]');if(!b)return;b.disabled=true;try{
  if(b.dataset.foto){const w=entries.find(w=>w.id===b.dataset.foto),blob=await W.sammlung('/sammlung/verwaltung/foto?id='+b.dataset.foto,{},'blob');if(photoURL)URL.revokeObjectURL(photoURL);photoURL=URL.createObjectURL(blob);$('#gross').src=photoURL;$('#gross').alt='Werk von '+w.name;$('#bild-titel').textContent=w.name+' · '+w.titel;$('#bild-dialog').showModal();}
  else if(confirm('Dieses Werk auf allen verbundenen iPads löschen?')){await api('loeschen',{id:b.dataset.loeschen});await load();}
 }catch(x){error(x);}finally{b.disabled=false;}};
 $('#bild-dialog').onclose=()=>{if(photoURL)URL.revokeObjectURL(photoURL);photoURL=null;$('#gross').removeAttribute('src');};
 $('#laden').onclick=load;$('#sammlung').onchange=load;$('#nochmals').onclick=start;$('#abmelden').onclick=()=>W.abmelden();start();
})();
