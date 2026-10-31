// «← Zurück zur App» auf den Vorlagen-Seiten (Links mit data-zur-app). Ziel ist die Version, aus der man kommt:
// Schule (schule/) oder Familie (Startseite). Die App merkt sich ihre Version in localStorage «schrittli.app».
(function(){
  if(document.currentScript){ const m=document.createElement('script'); m.src=document.currentScript.src.replace(/zurueck\.js.*$/,'melden.js'); document.head.appendChild(m); }   // Flagge «Fehler melden» auf jeder Vorlage
  const wurzel=location.pathname.replace(/\/vorlagen\/.*$/,'/');
  let von='';
  try{ const r=new URL(document.referrer); if(r.origin===location.origin){ if(r.pathname.startsWith(wurzel+'schule/')) von='schule'; else if(r.pathname===wurzel||r.pathname===wurzel+'index.html') von='familie'; } }catch(e){}
  let app=von; if(!app){ try{ app=localStorage.getItem('schrittli.app')||''; }catch(e){} }
  const ziel=wurzel+(app==='schule'?'schule/':'');
  const st=document.createElement('style');
  st.textContent='.zur-app{display:inline-block;margin:0 0 6px;font-weight:700;color:var(--acc,inherit);text-decoration:none}.zur-app:hover{text-decoration:underline}'+
    '@media print{.zur-app{display:none!important}}';
  document.head.appendChild(st);
  const allein=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  document.querySelectorAll('[data-zur-app]').forEach(a=>{ a.href=ziel;
    a.addEventListener('click',e=>{
      if(!von) return;                                       // nicht aus der App gekommen: normaler Link
      e.preventDefault();
      if(history.length>1){ history.back(); return; }   // zurück an die Stelle im Hauptmenü, wo man draufgeklickt hat (die App stellt die Höhe wieder her)
      if(allein){ location.href=ziel; return; }
      window.close(); setTimeout(()=>{ location.href=ziel; },200); }); });   // in einem neuen Tab geöffnet: Tab schliessen, die App ist im Tab daneben noch offen
})();

