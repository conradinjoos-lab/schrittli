// «← Zurück zur App» auf den Vorlagen-Seiten (Links mit data-zur-app). Ziel ist die Version, aus der man kommt:
// Schule (schule/) oder Familie (Startseite). Die App merkt sich ihre Version in localStorage «schrittli.app».
(function(){
  const wurzel=location.pathname.replace(/\/vorlagen\/.*$/,'/');
  let von='';
  try{ const r=new URL(document.referrer); if(r.origin===location.origin){ if(r.pathname.startsWith(wurzel+'schule/')) von='schule'; else if(r.pathname===wurzel||r.pathname===wurzel+'index.html') von='familie'; } }catch(e){}
  let app=von; if(!app){ try{ app=localStorage.getItem('schrittli.app')||''; }catch(e){} }
  const ziel=wurzel+(app==='schule'?'schule/':'');
  const st=document.createElement('style');
  st.textContent='.zur-app{display:inline-block;margin:0 0 6px;font-weight:700;color:var(--acc,inherit);text-decoration:none}.zur-app:hover{text-decoration:underline}'+
    '.aufs-handy{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:48px;margin-top:8px;border:2px solid var(--acc,#17997A);border-radius:16px;background:transparent;color:inherit;font:600 17px Fredoka,Nunito,sans-serif;cursor:pointer}'+
    '.handy-dlg{padding:0;border:0;border-radius:18px;max-width:min(92vw,460px);background:#fff;color:#17212F}.handy-dlg::backdrop{background:rgba(0,0,0,.55)}.handy-dlg>div{padding:18px 20px 20px;text-align:center}'+
    '.handy-dlg h2{margin:0 0 10px;font:600 22px Fredoka,Nunito,sans-serif}.handy-qr canvas{display:block;width:min(78vw,60vh,400px);height:auto;margin:0 auto;image-rendering:pixelated}'+
    '.handy-dlg p{margin:12px 0 0;font:16px/1.4 Nunito,sans-serif}.handy-dlg .handy-klein{font-size:14px;color:#5A6676}'+
    '.handy-zu{margin-top:14px;min-height:44px;padding:0 22px;border:0;border-radius:12px;background:#17212F;color:#fff;font:600 17px Fredoka,Nunito,sans-serif;cursor:pointer}'+
    '@media print{.zur-app,.aufs-handy,.handy-dlg{display:none!important}}';
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

// «Aufs Handy holen» unter dem Druckknopf (Seiten mit data-handy am #drucken): QR-Code der Adresse mit allen Einstellungen.
// Die Lehrperson scannt ihn am iPad, die gleiche Vorlage öffnet sich auf ihrem Handy und wird dort gedruckt (z. B. über Printix).
// Eine Seite kann mit window.handyLink einen eigenen Link liefern (Stromkreis: die Schaltung im #p=…). Der Wert von data-handy sagt, was nicht mitkommt.
document.addEventListener('DOMContentLoaded',()=>{
  const dr=document.querySelector('#drucken[data-handy]'); if(!dr) return;
  const wurzel=location.pathname.replace(/\/vorlagen\/.*$/,'/');
  const b=document.createElement('button'); b.type='button'; b.className='aufs-handy'; b.innerHTML='<span aria-hidden="true">📱</span><span>Aufs Handy holen</span>';
  dr.after(b);
  let qr=null;   // kontrolle/qr.js erst beim ersten Klick laden
  const laden=()=>qr||(qr=new Promise((ok,nein)=>{ if(window.QR) return ok(); const s=document.createElement('script'); s.src=wurzel+'kontrolle/qr.js'; s.onload=ok; s.onerror=()=>{ qr=null; nein(); }; document.head.appendChild(s); }));
  b.addEventListener('click',async()=>{
    const link=typeof window.handyLink==='function'?window.handyLink():location.href;
    const d=document.createElement('dialog'); d.className='handy-dlg';
    d.innerHTML='<div><h2>Aufs Handy holen</h2><div class="handy-qr">QR-Code wird geladen …</div><p>Mit der Kamera des Handys scannen. Die Vorlage öffnet sich dort mit denselben Einstellungen und lässt sich vom Handy aus drucken.</p><p class="handy-klein" hidden></p><button type="button" class="handy-zu">Schliessen</button></div>';
    const k=d.querySelector('.handy-klein'); if(dr.dataset.handy){ k.textContent=dr.dataset.handy; k.hidden=false; }
    document.body.appendChild(d);
    const zu=()=>{ if(d.close) d.close(); else d.remove(); };
    d.addEventListener('close',()=>d.remove());
    d.querySelector('.handy-zu').addEventListener('click',zu);
    d.addEventListener('click',e=>{ if(e.target===d) zu(); });   // Klick neben das Fenster
    if(d.showModal) d.showModal(); else d.setAttribute('open','');
    const feld=d.querySelector('.handy-qr');
    try{ await laden(); const c=QR.canvas(link,900,'L'); feld.textContent=''; feld.appendChild(c); }
    catch(e){ feld.textContent=window.QR?'Zu viele Einstellungen für einen QR-Code.':'Der QR-Code konnte nicht geladen werden (kein Internet?).'; }
  });
});
