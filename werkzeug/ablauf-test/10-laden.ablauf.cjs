/* App lädt ohne Konsolenfehler, Familie und Schule, inklusive der wichtigsten Seiten */
'use strict';
const lade=art=>async t=>{ const k=await t.kontext(), p=await t.app(k,art);
  for(const [n,a] of (art==='schule'?[['home',{}],['werkzeuge',{}],['gallery',{}]]:[['home',{}],['gallery',{}],['parent',{tab:'videos'}]])){ await p.evaluate(([n,a])=>go(n,a),[n,a]); await t.warte(120); t.pruefe(await p.locator('#app > *').count(),art+'/'+n+': leer'); }
  t.keineFehler(k); };
module.exports=[{name:'Laden Familie',lauf:lade('familie')},{name:'Laden Schule',lauf:lade('schule')}];
