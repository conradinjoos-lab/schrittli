/* Die gewählte Klasse bleibt beim Wechsel zwischen Unterricht, Werken und Klassen dieselbe: Sie steht in der Adresse (?klasse=3a) und im sessionStorage.
 * Gruppe, Sammlung und Klassenliste sind nicht verknüpft, verglichen wird der Name ohne «Klasse» davor. Findet eine Seite keine passende Liste, gilt ihr bisheriges Verhalten. */
const KLASSE=(()=>{
 const KEY='kontrolle.klasse',ORTE=[['unterricht.html','🏫','Unterricht'],['sammlung.html','🖼️','Werke'],['klassen.html','🧒','Klassen']];
 const kurz=n=>String(n||'').trim().replace(/^klasse\s+/i,'').toLowerCase();
 const merke=n=>{try{sessionStorage.setItem(KEY,n)}catch{}};
 const lies=()=>{const q=new URLSearchParams(location.search).get('klasse');if(q)return q;try{return sessionStorage.getItem(KEY)||''}catch{return ''}};
 const finde=(liste,name=lies())=>{const k=kurz(name);return k&&(liste||[]).find(x=>kurz(x.name)===k)||null};
 const adresse=(pfad,name=lies())=>name?pfad+'?klasse='+encodeURIComponent(kurz(name)):pfad;
 /* Alle Links zu den drei Seiten tragen die Klasse mit */
 const links=()=>document.querySelectorAll('a[href]').forEach(a=>{const pfad=a.getAttribute('href').split('?')[0];if(ORTE.some(o=>o[0]===pfad))a.setAttribute('href',adresse(pfad))});
 function setze(name){const k=kurz(name);if(!k)return;merke(k);const u=new URL(location.href);u.searchParams.set('klasse',k);history.replaceState(history.state,'',u);links()}
 function nav(el,hier){el.innerHTML=ORTE.map(([pfad,sym,text])=>`<a class="pill${pfad===hier?' on':''}" href="${pfad}"><span>${sym}</span> ${text}</a>`).join('');links()}
 /* Fehler kurz, die volle Meldung steht im title */
 const warnung=x=>{const s=x&&x.status;return s===409?'⚠ Zu viele':s===401||s===403?'⚠ Anmelden':s===429?'⚠ Warten':'⚠ Fehler'};
 if(new URLSearchParams(location.search).get('klasse'))merke(kurz(lies()));
 return {kurz,lies,finde,adresse,links,setze,nav,warnung};
})();
