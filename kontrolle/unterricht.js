'use strict';
(() => {
 const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
 const api=(p,b)=>W.unterricht(p,b),LINKS='schrittli.unterricht.gruppenlinks';
 const areaNames={naehen:'Nähen',sticken:'Sticken',haekeln:'Häkeln',stricken:'Stricken',weben:'Weben',knuepfen:'Flechten und Knüpfen',perlen:'Perlen',falten:'Falten',schneiden:'Schneiden und Kleben',holz:'Holz',formen:'Formen',drucken:'Drucken',filzen:'Filzen',wickeln:'Wickeln',schnitzen:'Schnitzen',experimentieren:'Experimentieren'};
 let catalog=null,groups=[],favorites=[],selected=new Set(),draftRevision=0,poll=null,generation=0,busy=false;
 const group=()=>groups.find(g=>g.id===$('#gruppe').value);
 const error=e=>{$('#fehler').textContent=e.message||'Das hat nicht geklappt.';$('#fehler').hidden=false;$('#wiederholen').hidden=false;};
 const clean=()=>{$('#fehler').hidden=true;$('#wiederholen').hidden=true;};
 const mode=()=>$('#modus').value;
 const projectMode=()=>['single','topic','custom'].includes(mode());
 const allItems=()=>catalog[mode()==='templates'?'templates':mode()==='beads'?'beads':'projects'];
 function candidates(search=true){
  const grade=+$('#stufe').value,level=+$('#niveau').value,category=$('#kategorie').value,query=search?$('#suche').value.trim().toLocaleLowerCase('de-CH'):'';
  return allItems().filter(v=>{
   if(projectMode()){
    if(grade&&v.grades.length&&!v.grades.includes(grade))return false;
    if(level&&v.level>level)return false;
    if(category==='papierflieger'&&!(v.area==='falten'&&(/^flieger-/.test(v.id)||/papierflieger/i.test(v.name))))return false;
    if(category.startsWith('area:')&&v.area!==category.slice(5))return false;
    if(category.startsWith('group:')&&v.group!==category.slice(6))return false;
   }else{
    if(category&&v.group!==category)return false;
    if(mode()==='beads'&&v.width>catalog.beadLimits[grade||2])return false;
   }
   return !query||(v.name+' '+(v.group||'')).toLocaleLowerCase('de-CH').includes(query);
  });
 }
 function categories(value=''){
  const opts=projectMode()?[['','Alle Themen'],['papierflieger','Papierflieger'],...[...new Set(catalog.projects.map(v=>v.area).filter(Boolean))].map(a=>['area:'+a,catalog.areas[a]||areaNames[a]||a]),...[...new Set(catalog.projects.map(v=>v.group).filter(Boolean))].sort().map(g=>['group:'+g,g])]:[['','Alle Kategorien'],...[...new Set(allItems().map(v=>v.group))].sort().map(g=>[g,g])];
  $('#kategorie').innerHTML=opts.map(([id,n])=>`<option value="${esc(id)}">${esc(n)}</option>`).join('');
  if(opts.some(([id])=>id===value))$('#kategorie').value=value;
 }
 function defaultTitle(){const m=mode();return m==='closed'?'Alles geschlossen':m==='free'?'Freies Entdecken':m==='single'?allItems().find(v=>selected.has(v.id))?.name||'Unser Projekt':$('#kategorie').value?$('#kategorie').selectedOptions[0].textContent:m==='templates'?'Unsere Vorlagen':m==='beads'?'Unsere Perlentiere':'Unsere Projekte';}
 function policy(){
  const m=mode();return {mode:projectMode()?'projects':m,title:($('#auftrag').value.trim()||defaultTitle()).slice(0,80),ids:['closed','free'].includes(m)?[]:[...selected],grade:+$('#stufe').value||null,
   simple:$('#einfach').checked,resize:$('#groesse').checked,recolor:$('#farbe').checked,gallery:$('#galerie').checked,selection:m==='single'?'single':m==='topic'?'topic':'custom',category:$('#kategorie').value};
 }
 function preview(){
  const p=policy(),items=allItems().filter(i=>selected.has(i.id));
  $('#vorschau-titel').textContent=p.mode==='closed'?'Gleich geht’s los.':p.title;
  $('#vorschau-inhalte').innerHTML=['closed','free'].includes(p.mode)?'':items.slice(0,8).map(v=>`<span>${esc(v.name)}</span>`).join('')+(items.length>8?`<span>+ ${items.length-8} weitere</span>`:'');
  $('#vorschau-regel').textContent=p.mode==='closed'?'Die Kinder warten auf deine Freigabe.':p.mode==='free'?'Die gesamte Anwendung ist offen.':!items.length?'Bitte mindestens einen Inhalt auswählen.':items.length===1?'Dieser Auftrag öffnet sich direkt. Ein Wechsel zu anderen Inhalten ist gesperrt.':`Wechsel nur innerhalb dieser ${items.length} Inhalte. Alle anderen Bereiche bleiben ausgeblendet.`;
  $('#freigeben').disabled=busy||(!['closed','free'].includes(p.mode)&&!items.length);
  $('#entwurf').textContent='Entwurf · Erst «Freigeben» ändert die Kinderansicht.';
 }
 function paintList(){
  const items=candidates();
  $('#anzahl').textContent=`${selected.size} ausgewählt · ${items.length} Treffer`;
  $('#auswahl').innerHTML=items.map(v=>`<label class="u-inhalt"><input type="${mode()==='single'?'radio':'checkbox'}" name="inhalt" value="${esc(v.id)}" ${selected.has(v.id)?'checked':''}><span>${esc(v.name)}</span></label>`).join('')||'<p>Keine passenden Inhalte. Passe Klasse, Thema oder Suche an.</p>';
  preview();
 }
 function controls(){
  const empty=['closed','free'].includes(mode());$('#auswahl-felder').hidden=empty;$('#optionen').hidden=empty;
  $('#niveau-label').hidden=!projectMode();$('#alle').hidden=mode()==='single';$('#keine').hidden=mode()==='single';
  $('#groesse-label').hidden=projectMode();$('#farbe-label').hidden=mode()!=='beads';$('#galerie-label').hidden=!projectMode();
 }
 function applyDraft(p,rev){
  $('#modus').value=p.mode==='projects'?(p.selection==='single'||p.ids.length===1?'single':p.selection==='topic'?'topic':'custom'):p.mode;
  $('#stufe').value=p.grade||'';$('#niveau').value='';$('#suche').value='';categories(p.category||'');
  selected=new Set(p.ids||[]);$('#auftrag').value=p.title||defaultTitle();
  $('#einfach').checked=p.simple!==false;$('#groesse').checked=p.resize!==false;$('#farbe').checked=p.recolor!==false;$('#galerie').checked=p.gallery===true;
  if(rev!==undefined)draftRevision=rev;controls();paintList();
 }
 function setMode(){
  selected.clear();$('#suche').value='';$('#niveau').value='';
  if(mode()==='beads'&&!$('#stufe').value)$('#stufe').value='2';
  categories(mode()==='topic'?'papierflieger':mode()==='templates'?'Grundformen':mode()==='beads'?'Tiere':'');
  const items=candidates(false);if(mode()==='single'&&items[0])selected.add(items[0].id);else if(['topic','templates','beads'].includes(mode()))selected=new Set(items.map(v=>v.id));
  $('#auftrag').value=defaultTitle();controls();paintList();
 }
 function filterChanged(){
  const items=candidates(false),eligible=new Set(items.map(v=>v.id));
  selected=new Set([...selected].filter(id=>eligible.has(id)));
  if(['topic','templates','beads'].includes(mode()))selected=new Set(items.map(v=>v.id));
  if(mode()==='single'&&!selected.size&&items[0])selected.add(items[0].id);
  $('#auftrag').value=defaultTitle();paintList();
 }
 function links(){try{return JSON.parse(localStorage.getItem(LINKS)||'{}');}catch{return {};}}
 function showLink(){const link=links()[group()?.id]||'';$('#gruppenlink').value=link;$('#link-kopieren').disabled=!link;$('#qr-zeigen').disabled=!link;$('#qr').hidden=true;$('#qr').replaceChildren();$('#link-hinweis').textContent=link?'Bewahre den Link für weitere iPads auf. Er erlaubt nur die Teilnahme, keine Änderungen am Unterricht.':'Der Gruppenlink ist auf diesem Lehrpersonen-Gerät nicht gespeichert. Verwende den ursprünglichen Link oder richte eine neue Gruppe ein.';}
 async function deviceStatus(){
  const g=group(),gen=generation;if(!g)return;
  try{const d=await api('geraete?id='+g.id);if(gen!==generation)return;
   g.revision=d.revision;g.policy=d.policy;$('#aktuell').textContent=`Aktuell: ${d.policy.title}`;
   $('#geraete').innerHTML=d.geraete.map(t=>{const online=d.now-t.gesehen<20000,applied=online&&t.revision===d.revision;return `<div class="u-geraet"><div><b>${esc(t.name)}</b><small>${applied?'Freigabe übernommen':online?'Verbunden · Änderung wird übernommen':'Nicht erreichbar · zuletzt '+new Date(t.gesehen).toLocaleTimeString('de-CH',{hour:'2-digit',minute:'2-digit'})}</small></div><button class="text-btn" data-name="${t.id}" data-alt="${esc(t.name)}">Umbenennen</button></div>`;}).join('')||'<p>Noch kein iPad verbunden. Öffne den Gruppenlink auf den Kinder-iPads.</p>';
  }catch(e){if(gen===generation)$('#aktuell').textContent='Gerätestatus gerade nicht erreichbar. Die Anzeige wird erneut aktualisiert.';}
 }
 async function chooseGroup(){
  generation++;clearInterval(poll);const g=group();$('#steuerung').hidden=!g;showLink();if(!g)return;
  $('#steuerung').disabled=true;applyDraft(g.policy,g.revision);await deviceStatus();$('#steuerung').disabled=false;poll=setInterval(()=>{if(!document.hidden)void deviceStatus();},10000);
 }
 async function listGroups(id){groups=(await api('gruppen')).gruppen;$('#gruppe').innerHTML=groups.map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join('');if(id)$('#gruppe').value=id;}
 async function listFavorites(){favorites=(await api('favoriten')).favoriten;$('#favorit').innerHTML='<option value="">Favorit wählen …</option>'+favorites.map(f=>`<option value="${f.id}">${esc(f.name)}</option>`).join('');}
 async function release(next=policy(),force=false){
  const g=group();if(!g||busy)return;clean();busy=true;preview();$('#schliessen').disabled=true;$('#steuerung').disabled=true;$('#gruppe').disabled=true;
  try{
   if(force){const d=await api('geraete?id='+g.id);g.revision=d.revision;}
   const result=await api('freigabe',{id:g.id,revision:force?g.revision:draftRevision,policy:next});
   g.policy=result.policy;g.revision=result.revision;applyDraft(g.policy,g.revision);
   $('#status').textContent=`${g.name}: ${next.mode==='closed'?'Alles geschlossen.':'Freigabe gesendet.'}`;$('#entwurf').textContent='Übernommen · Die verbundenen iPads aktualisieren sich automatisch.';await deviceStatus();
  }catch(e){error(e);}finally{busy=false;$('#steuerung').disabled=false;$('#gruppe').disabled=false;$('#schliessen').disabled=false;$('#freigeben').disabled=!['closed','free'].includes(policy().mode)&&!selected.size;}
 }
 $('#modus').onchange=setMode;['#stufe','#niveau','#kategorie'].forEach(s=>$(s).onchange=filterChanged);$('#suche').oninput=paintList;
 $('#auswahl').onchange=e=>{const input=e.target;if(!input.matches('input'))return;if(mode()==='single')selected=new Set([input.value]);else if(input.checked)selected.add(input.value);else selected.delete(input.value);if(mode()==='single')$('#auftrag').value=defaultTitle();paintList();};
 $('#alle').onclick=()=>{candidates().forEach(v=>selected.add(v.id));paintList();};$('#keine').onclick=()=>{selected.clear();paintList();};
 ['#einfach','#groesse','#farbe','#galerie'].forEach(s=>$(s).onchange=preview);$('#auftrag').oninput=preview;
 $('#freigeben').onclick=()=>release();$('#schliessen').onclick=()=>release({mode:'closed',title:'Alles geschlossen',ids:[],grade:policy().grade},true);
 $('#aktuell-laden').onclick=async()=>{$('#steuerung').disabled=true;$('#gruppe').disabled=true;try{const g=group();await listGroups(g.id);await chooseGroup();clean();}catch(e){error(e);}finally{$('#steuerung').disabled=false;$('#gruppe').disabled=false;}};
 $('#gruppe').onchange=chooseGroup;$('#neu').onclick=()=>{$('#gruppe-erstellen').hidden=!$('#gruppe-erstellen').hidden;$('#gruppenname').focus();};
 $('#gruppe-erstellen').onsubmit=async e=>{e.preventDefault();e.submitter.disabled=true;clean();try{
  const g=await api('erstellen',{name:$('#gruppenname').value.trim()}),link=new URL('../schule/',location.href).href+'#unterricht='+g.token,map=links();map[g.id]=link;
  try{localStorage.setItem(LINKS,JSON.stringify(map));}catch{}
  await listGroups(g.id);await chooseGroup();$('#gruppenlink').value=link;$('#link-kopieren').disabled=false;$('#qr-zeigen').disabled=false;$('#verbinden').open=true;$('#gruppe-erstellen').hidden=true;$('#status').textContent='Gruppe erstellt. Verbinde jetzt die Kinder-iPads.';
 }catch(x){error(x);}finally{e.submitter.disabled=false;}};
 $('#link-kopieren').onclick=async()=>{try{await navigator.clipboard.writeText($('#gruppenlink').value);$('#status').textContent='Gruppenlink kopiert.';}catch{$('#gruppenlink').select();$('#status').textContent='Kopiere den markierten Link.';}};
 $('#qr-zeigen').onclick=async()=>{try{
  if(!window.QRCode)await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';s.onload=resolve;s.onerror=reject;document.head.append(s);});
  $('#qr').replaceChildren();$('#qr').hidden=false;new QRCode($('#qr'),{text:$('#gruppenlink').value,width:240,height:240,correctLevel:QRCode.CorrectLevel.L});
 }catch{error(new Error('Der QR-Code konnte nicht geladen werden. Du kannst den Gruppenlink kopieren.'));}};
 $('#favorit-speichern').onsubmit=async e=>{e.preventDefault();e.submitter.disabled=true;try{await api('favorit',{name:$('#favorit-name').value.trim(),policy:policy()});await listFavorites();$('#status').textContent='Favorit gespeichert.';$('#favorit-name').value='';}catch(x){error(x);}finally{e.submitter.disabled=false;}};
 $('#favorit-laden').onclick=()=>{const f=favorites.find(x=>x.id===$('#favorit').value);if(f)applyDraft(f.policy,group().revision);};
 $('#favorit-loeschen').onclick=async()=>{const id=$('#favorit').value;if(!id)return;try{await api('favorit-entfernen',{id});await listFavorites();}catch(e){error(e);}};
 $('#geraete').onclick=async e=>{const b=e.target.closest('[data-name]');if(!b)return;const n=prompt('Name des iPads',b.dataset.alt);if(!n?.trim())return;try{await api('geraet-name',{id:group().id,deviceId:b.dataset.name,name:n.trim()});await deviceStatus();}catch(x){error(x);}};
 $('#abmelden').onclick=()=>W.abmelden();$('#wiederholen').onclick=start;
 async function start(){
  clean();try{await W.bereit();const r=await fetch('unterricht-katalog.json',{cache:'no-store'});if(!r.ok)throw Error('Die Inhaltsauswahl konnte nicht geladen werden.');catalog=await r.json();await listGroups();await listFavorites();$('#inhalt').hidden=false;$('#status').textContent='Wähle eine Gruppe und öffne eure Aufgabe.';if(!groups.length){$('#gruppe-erstellen').hidden=false;$('#status').textContent='Richte zuerst eine Klasse oder iPad-Gruppe ein.';}await chooseGroup();}catch(e){error(e);}
 }
 void start();
})();
