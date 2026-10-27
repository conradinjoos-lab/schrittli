/* School router adapter. The gate also applies to direct links and imported shared projects. */
function unterrichtRoute(name,params){
 const u=window.Unterricht,p=u?.policy;if(!p||p.mode==='free')return {name,params};
 if(p.mode==='projects'){
  const id=params.videoId||params.video?.id||params.v?.id;
  if(['player','school','anleitung'].includes(name)&&p.ids.includes(id)&&videoOf(id))return {name:'player',params:{videoId:id}};
  if(name==='feedback'&&p.ids.includes(id))return {name,params:{videoId:id}};
  if(name==='gallery'&&(p.gallery||p.ids.includes(params.videoId)))return {name,params};
  if(p.ids.length===1&&videoOf(p.ids[0]))return {name:'player',params:{videoId:p.ids[0]}};
 }
 return {name:'unterricht',params:{}};
}
function unterrichtNachRender(){
 const p=window.Unterricht?.policy;if(!p||p.mode==='free')return;
 const root=$('#app');
 Unterricht.allowResources(p.mode==='projects'&&p.ids.includes(view.params.videoId)?[...root.querySelectorAll('a[href]')].map(a=>a.href):[]);
 for(const a of root.querySelectorAll('a[href]'))if(!a.getAttribute('href').startsWith('#')&&!Unterricht.permitted(a.href))a.hidden=true;
 for(const b of root.querySelectorAll('[data-act="malen"],[data-act="ton"],[data-act="klassewahl"],[data-act="naechste"]'))b.hidden=true;
 for(const b of root.querySelectorAll('[data-act="gallery"],[data-act="werke"]'))if(!p.gallery)b.hidden=true;
 for(const b of root.querySelectorAll('[data-act="back"]')){
  if(p.mode==='projects'&&p.ids.length===1&&['player','school'].includes(view.name))b.hidden=true;
 }
}
SCREENS.unterricht=app=>{
 const p=window.Unterricht?.policy||{mode:'closed'},u=window.Unterricht;
 const teacher=`<a class="btn ghost" href="${esc(u.control)}">Für Lehrpersonen</a>`;
 if(p.mode==='templates'||p.mode==='beads'){
  const href=new URL(p.mode==='templates'?'vorlagen/':'vorlagen/perlen/',u.base).href;
  app.innerHTML=`<main class="u-klasse"><h1>${esc(p.title)}</h1><p>Deine Aufgabe wird geöffnet …</p><a class="btn primary" href="${esc(href)}">Aufgabe öffnen</a>${teacher}</main>`;
  location.replace(href);return;
 }
 const vs=p.mode==='projects'?p.ids.map(videoOf).filter(Boolean):[];
 app.innerHTML=`<main class="v3"><div class="v3-in"><header class="u-kopf"><span>${esc(u?.name||'Deine Klasse')}</span>${teacher}</header>${vs.length?`<h1>Heute: ${esc(p.title)}</h1><p class="v3-sub">Wähle deine Aufgabe.</p><div class="v3-projects">${vs.map(projectCard).join('')}</div>`:`<section class="u-klasse"><h1>Gleich geht’s los.</h1><p>${esc(u.error||'Deine Lehrperson öffnet eure Aufgabe.')}</p></section>`}</div></main>`;
 wire(app,{video:b=>go('player',{videoId:b.dataset.id})});
};
window.addEventListener('unterricht:change',()=>{
 if(view.name==='boot')return;
 const p=window.Unterricht.policy;
 if(p?.grade&&SCHULE){S.settings.klasse=p.grade;save();}
 // Close modal work before switching, so a camera/editor cannot cover the new lesson.
 document.querySelectorAll('dialog[open]').forEach(d=>d.close());
 document.querySelectorAll('.modal-bg').forEach(d=>d.unterrichtSchliessen?.());
 const target=unterrichtRoute(p?.mode==='free'&&view.name==='unterricht'?'home':view.name,view.params);
 if(view.name==='player'&&target.name===view.name&&target.params.videoId===view.params.videoId&&p?.mode==='projects'){unterrichtNachRender();return;}
 go(target.name,target.params);
});
new MutationObserver(()=>{if(window.Unterricht?.active)unterrichtNachRender();}).observe(document.getElementById('app'),{childList:true,subtree:true});
