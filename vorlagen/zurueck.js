// «← Zurück zur App» auf den Vorlagen-Seiten (Links mit data-zur-app). Die App legt beim Klick auf eine Vorlage in sessionStorage
// «schrittli.zurueck» Version, Ansicht und Scrollhöhe ab; das überlebt Neuladen und jede Anpassung auf der Vorlage.
(function(){
  if(document.currentScript){ const m=document.createElement('script'); m.src=document.currentScript.src.replace(/zurueck\.js.*$/,'melden.js'); document.head.appendChild(m); }   // Flagge «Fehler melden» auf jeder Vorlage
  const wurzel=location.pathname.replace(/\/vorlagen\/.*$/,'/');
  let von='';
  try{ const r=new URL(document.referrer); if(r.origin===location.origin){ if(r.pathname.startsWith(wurzel+'schule/')) von='schule'; else if(r.pathname===wurzel||r.pathname===wurzel+'index.html') von='familie'; } }catch(e){}
  let zr=null;
  try{ zr=JSON.parse(sessionStorage.getItem('schrittli.zurueck')||'null'); if(zr&&!(Date.now()-zr.t<432e5)) zr=null; }catch(e){}
  let app=(zr&&zr.app)||von; if(!app){ try{ app=localStorage.getItem('schrittli.app')||''; }catch(e){} }
  const ziel=wurzel+(app==='schule'?'schule/':'');
  const st=document.createElement('style');
  st.textContent='.zur-app{display:inline-block;margin:0 0 6px;font-weight:700;color:var(--acc,inherit);text-decoration:none}.zur-app:hover{text-decoration:underline}'+
    '@media print{.zur-app{display:none!important}}';
  document.head.appendChild(st);
  document.querySelectorAll('[data-zur-app]').forEach(a=>{ a.href=ziel; a.setAttribute('aria-label','Zurück zur App');
    if(!a.querySelector('span')) a.textContent='← App';
    a.addEventListener('click',e=>{
      if(!zr&&!von) return;                                  // nicht aus der App gekommen: normaler Link
      e.preventDefault();
      if(von&&history.length>1){ history.back(); return; }   // Vorlage wurde direkt aus der App geöffnet: gleicher Weg wie Browser-Zurück
      try{ zr=zr||{t:Date.now()}; zr.rueck=1; sessionStorage.setItem('schrittli.zurueck',JSON.stringify(zr)); }catch(err){}   // Umweg über andere Vorlagen oder Neuladen ohne Referrer: die App stellt die Ansicht selbst wieder her
      location.href=ziel; }); });
})();
