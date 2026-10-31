/* Perlentiere: Fädeln mit Reihe, Folge und Teilen, Stand nach Neuladen, pro Kind, Zeichen, Rückgängig, Druck mit gleichen Buchstaben, alte Links */
'use strict';
const BREITEN=[[1180,820],[390,780]];
const SEITE='/vorlagen/perlen/';
const nah=(a,b,d)=>Math.abs(a-b)<=d;
const tipp=async(p,s,t)=>{ await p.locator(s).first().tap(); await t.warte(120); };
const vor=async(p,t,n=1)=>{ for(let i=0;i<n;i++) await tipp(p,'#a-vor',t); };
// Was das Kind gerade sieht, aus der Oberfläche gelesen; Soll kommt aus den Musterdaten
const stand=p=>p.evaluate(()=>{ const a=aTeil(), b=document.querySelector('#a-muster .a-band'), box=document.getElementById('a-muster').getBoundingClientRect(), r=b&&b.getBoundingClientRect(), chip=document.querySelector('#a-teile .a-chip[aria-pressed="true"]');
  return {offen:!document.getElementById('arbeit').hidden,titel:document.getElementById('titel').textContent,reihe:+(document.querySelector('#a-stand b')||{}).textContent,marke:document.querySelector('#a-muster .a-marke text')?.textContent,teil:a.k,chip:chip?.dataset.teil||null,
    folge:[...document.querySelectorAll('#a-folge > .fg')].map(g=>g.getAttribute('aria-label')),soll:a.rows[AR.pos[a.k]]?folge(a,AR.pos[a.k]).map(g=>`${g.n} × ${FARBE[g.c][1]}`):[],reihenText:a.rows[AR.pos[a.k]]||'',pos:AR.pos[a.k],
    sichtbar:!!r&&r.height>0&&r.top>=box.top-2&&r.bottom<=box.bottom+2}; });
const reiheStimmt=(t,z,nr,wo)=>{ t.pruefe(z.offen,wo+': Fädeln zu'); t.pruefe(z.reihe===nr,wo+': Reihe '+z.reihe+' statt '+nr); t.pruefe(z.marke===String(nr),wo+': Marke '+z.marke); t.pruefe(z.sichtbar,wo+': Reihe nicht im Bild');
  t.pruefe(z.folge.length&&JSON.stringify(z.folge)===JSON.stringify(z.soll),wo+': Folge '+z.folge+' statt '+z.soll); };
const kopfOrte=p=>p.evaluate(()=>{ const x=q=>{ const e=document.querySelector(q); return e?Math.round(e.getBoundingClientRect().right):null; }; return {zurueck:x('.pk .zur-app'),rueck:x('#p-rueck'),druck:x('.pk-druck'),breit:document.documentElement.scrollWidth-innerWidth}; });

// Kopf wie auf den anderen Planern, auch beim Fädeln; nichts rollt seitwärts; Flagge frei
const kopf=async t=>{ for(const [breite,hoehe] of BREITEN){ const k=await t.kontext({breite,hoehe}), a=await k.seite('/vorlagen/falten/'); await t.warte(200); const soll=await kopfOrte(a); await a.close();
    const p=await k.seite(SEITE+'?tier=schmetterling-naht'); await t.warte(250);
    const nimm=async wo=>{ const z=await kopfOrte(p); for(const f of ['zurueck','rueck','druck']) t.pruefe(z[f]===soll[f],wo+': '+f+' bei '+z[f]+', sonst '+soll[f]+' ('+breite+')'); t.pruefe(z.breit<=0,wo+': rollt seitwärts '+z.breit); };
    await nimm('Plan'); await tipp(p,'#faedeln',t); await nimm('Fädeln');
    const g=await p.evaluate(()=>['#a-vor','#a-zurueck','#a-zu'].map(s=>{ const r=document.querySelector(s).getBoundingClientRect(); return [s,Math.round(r.width),Math.round(r.height)]; }));
    for(const [s,b,h] of g) t.pruefe(b>=48&&h>=48,s+' nur '+b+'×'+h);
    await p.waitForSelector('#melden-flagge',{state:'attached'}); await t.warte(350); t.pruefeFlagge(await t.flagge(p,true),'Fädeln '+breite);
    t.keineFehler(k); await k.c?.close?.(); } };

// Einfaches Tier: Pfeil, Folge, Pfeil zurück, Neuladen und Rückkehr ohne Adresse
const einfach=async t=>{ for(const [breite,hoehe] of BREITEN){ const k=await t.kontext({breite,hoehe}), p=await k.seite(SEITE+'?tier=eidechse'); await t.warte(250);
    await tipp(p,'#faedeln',t); reiheStimmt(t,await stand(p),1,'Start'); t.pruefe(await p.locator('#a-zurueck').isDisabled(),'Zurück in Reihe 1 offen');
    t.pruefe(!(await p.locator('#a-teile').isVisible()),'Teilwahl bei einfachem Tier');
    await vor(p,t,5); reiheStimmt(t,await stand(p),6,'Vor'); await tipp(p,'#a-zurueck',t); reiheStimmt(t,await stand(p),5,'Zurück');
    await p.reload(); await t.warte(300); reiheStimmt(t,await stand(p),5,'Neuladen'); t.pruefe(/Eidechse/.test((await stand(p)).titel),'Titel');
    await p.goto(t.basis+SEITE); await t.warte(300); reiheStimmt(t,await stand(p),5,'Ohne Adresse');
    await tipp(p,'#a-zu',t); t.pruefe(!(await stand(p)).offen,'Fädeln bleibt offen'); t.pruefe(await p.locator('#faedeln').isVisible(),'Kein Fädeln-Knopf'); t.pruefe(/4\/15/.test(await p.textContent('#f-stand')),'Stand fehlt am Knopf');
    await p.reload(); await t.warte(250); t.pruefe(!(await stand(p)).offen,'Geschlossen geht wieder auf');
    await tipp(p,'#faedeln',t); reiheStimmt(t,await stand(p),5,'Wieder offen');
    const n=await p.evaluate(()=>AR.L[0].rows.length); await vor(p,t,n-5); t.pruefe(await p.locator('#a-vor').getAttribute('aria-label')==='Fertig','Letzte Reihe ohne Fertig'); await vor(p,t,1); t.pruefe((await p.textContent('#a-folge')).includes('✓'),'Ende ohne Haken');
    await p.reload(); await t.warte(250); t.pruefe((await p.textContent('#a-folge')).includes('✓'),'Ende nach Neuladen weg');
    await tipp(p,'#a-vor',t); reiheStimmt(t,await stand(p),1,'Neu beginnen');
    t.keineFehler(k); } };

// Tier mit angesetzten Teilen: Teil wählen, Stand behalten, gespiegelte Folge, Annähen, nächstes Teil, Gesamtansicht
const teile=async t=>{ for(const [breite,hoehe] of BREITEN){ const k=await t.kontext({breite,hoehe}), p=await k.seite(SEITE+'?tier=schmetterling-naht'); await t.warte(250); await tipp(p,'#faedeln',t);
    const i=await p.evaluate(()=>({chips:[...document.querySelectorAll('#a-teile .a-chip')].map(b=>b.dataset.teil),L:AR.L.map(a=>({k:a.k,b:Planer.teil(a.b),seite:a.seite,n:a.rows.length,roh:a.roh,rows:a.rows}))}));
    t.pruefe(i.chips.length===i.L.length&&i.L.length>=3,'Teilwahl fehlt'); t.pruefe(new Set(i.L.map(a=>a.b)).size<i.L.length,'Gleiche Teile ohne gleichen Buchstaben');
    const links=i.L.find(a=>a.seite<0); t.pruefe(links,'Kein linkes Teil'); t.pruefe(links.rows[0]===[...links.roh[0]].reverse().join(''),'Linkes Teil nicht gespiegelt');
    await vor(p,t,2); reiheStimmt(t,await stand(p),3,'Körper');
    await tipp(p,`#a-teile [data-teil="${links.k}"]`,t); reiheStimmt(t,await stand(p),1,'Teil gewählt'); t.pruefe((await stand(p)).chip===links.k,'Chip nicht aktiv');
    await vor(p,t,3); reiheStimmt(t,await stand(p),4,'Teil vor');
    const z0=await stand(p); t.pruefe(z0.reihenText===links.rows[3],'Reihe des Teils falsch');
    const w=await p.evaluate(()=>[...document.querySelectorAll('#a-gesamt .pl-teil')].length); t.pruefe(w===i.L.length,'Gesamtansicht zeigt '+w+' Marken');
    const rahmen=await p.evaluate(k=>{ const r=document.querySelector('#a-gesamt .g-rahmen').getBoundingClientRect(), ist=document.querySelector(`#a-gesamt .g-t[data-teil="${k}"]`).getBoundingClientRect(); return r.width>0&&r.left<=ist.left+3&&r.right>=ist.right-3&&r.top<=ist.top+3&&r.bottom>=ist.bottom-3; },links.k); t.pruefe(rahmen,'Rahmen nicht um das Teil');
    await p.reload(); await t.warte(300); reiheStimmt(t,await stand(p),4,'Neuladen Teil'); t.pruefe((await stand(p)).teil===links.k,'Teil nach Neuladen');
    await p.goto(t.basis+SEITE); await t.warte(300); reiheStimmt(t,await stand(p),4,'Ohne Adresse Teil'); t.pruefe((await stand(p)).teil===links.k&&(await stand(p)).chip===links.k,'Teil ohne Adresse');
    await vor(p,t,links.n-3); t.pruefe(/Annähen/.test(await p.textContent('#a-folge')),'Kein Annähen');
    await p.reload(); await t.warte(300); t.pruefe(/Annähen/.test(await p.textContent('#a-folge')),'Annähen nach Neuladen weg');
    const nach=links; await tipp(p,'#a-vor',t); const z1=await stand(p); t.pruefe(z1.teil!==nach.k,'Kein Wechsel zum nächsten Teil'); t.pruefe(await p.locator(`#a-teile [data-teil="${nach.k}"].ok`).count()===1,'Fortschritt fehlt');
    await p.locator('#a-gesamt svg > g[data-teil="k"] .pl-teil').tap({force:true}); await t.warte(150); reiheStimmt(t,await stand(p),3,'Gesamtansicht wählt Körper');
    const b=await p.evaluate(()=>{ const r=document.querySelector('#a-teile').getBoundingClientRect(); return document.documentElement.scrollWidth-innerWidth+Math.max(0,r.right-innerWidth); }); t.pruefe(b<=0,'Teilwahl rollt die Seite');
    t.keineFehler(k); } };

// Beide Bauarten: über/unter dem Körper, mit Faden angenäht (t.teile, zwei Blätter), grosses Muster mit langen Reihen
const arten=async t=>{ for(const [breite,hoehe] of BREITEN){ const k=await t.kontext({breite,hoehe}), p=await k.seite(SEITE+'?tier=baer-naht'); await t.warte(250);
    for(const id of ['baer-naht','fledermaus-fluegel','figur-gru-silhouette-mit-schal']){ await p.goto(t.basis+SEITE+'?tier='+id); await t.warte(250); if(await p.locator('#a-zu').isVisible()) await tipp(p,'#a-zu',t); await tipp(p,'#faedeln',t);
      const n=await p.evaluate(()=>aTeil().rows.length); await vor(p,t,Math.min(30,n-1)); reiheStimmt(t,await stand(p),Math.min(30,n-1)+1,id); await p.reload(); await t.warte(300); reiheStimmt(t,await stand(p),Math.min(30,n-1)+1,id+' neu');
      t.pruefe((await kopfOrte(p)).breit<=0,id+' rollt seitwärts'); await tipp(p,'#a-zu',t); }
    t.keineFehler(k); } };

// Stand pro Kind getrennt, Kindwechsel behält beide
const kinder=async t=>{ const k=await t.kontext({breite:1180,hoehe:820,speicher:{'schrittli.kind':'mia'}}), p=await k.seite(SEITE+'?tier=eidechse'); await t.warte(250);
  await tipp(p,'#faedeln',t); await vor(p,t,6); reiheStimmt(t,await stand(p),7,'Mia');
  const wechsel=async w=>{ await p.evaluate(w=>localStorage.setItem('schrittli.kind',w),w); await p.goto(t.basis+SEITE+'?tier=eidechse'); await t.warte(300); if(!(await stand(p)).offen) await tipp(p,'#faedeln',t); };
  await wechsel('leo'); reiheStimmt(t,await stand(p),1,'Leo'); await vor(p,t,2); reiheStimmt(t,await stand(p),3,'Leo vor');
  await wechsel('mia'); reiheStimmt(t,await stand(p),7,'Mia zurück'); await wechsel('leo'); reiheStimmt(t,await stand(p),3,'Leo zurück'); t.keineFehler(k); };

// Zeichen statt nur Farbe: bleibt gespeichert, gilt in Muster, Vorschau und Druck, Papier behält dieselben Masse
const zeichen=async t=>{ const k=await t.kontext({breite:1180,hoehe:820}), p=await k.seite(SEITE+'?tier=eidechse'); await t.warte(250); await tipp(p,'#faedeln',t);
  const texte=()=>p.evaluate(()=>({muster:document.querySelectorAll('#a-muster .a-r text:not(.a-nr), #a-muster .a-r path[transform*="scale"]').length,druck:document.querySelectorAll('#druck svg text').length,legende:document.querySelectorAll('#a-legende span').length}));
  const leer=await texte(); t.pruefe(!leer.muster&&!leer.legende,'Zeichen ohne Wahl');
  await tipp(p,'#arbeit .zeichen-wahl [data-z="b"]',t); const b=await texte(); t.pruefe(b.muster>10,'Keine Buchstaben im Muster'); t.pruefe(b.legende>=2,'Keine Legende'); t.pruefe(b.druck>leer.druck,'Keine Buchstaben im Druck');
  const breit=await p.evaluate(()=>document.querySelector('#druck svg').getAttribute('width'));
  await p.reload(); await t.warte(300); t.pruefe((await texte()).muster===b.muster,'Buchstaben nach Neuladen weg');
  await tipp(p,'#arbeit .zeichen-wahl [data-z="s"]',t); t.pruefe((await texte()).muster===b.muster,'Symbole fehlen'); t.pruefe(await p.evaluate(()=>document.querySelector('#druck svg').getAttribute('width'))===breit,'Blatt ändert sich');
  await tipp(p,'#arbeit .zeichen-wahl [data-z=""]',t); t.pruefe(!(await texte()).muster,'Zeichen bleiben'); t.keineFehler(k); };

// Rückgängig: Reihe, Teil, Perle, Muster, immer am selben Knopf
const rueck=async t=>{ const k=await t.kontext({breite:1180,hoehe:820}), p=await k.seite(SEITE+'?tier=schmetterling-naht'); await t.warte(250);
  const zurueck=()=>tipp(p,'#p-rueck',t);
  t.pruefe(await p.locator('#p-rueck').isDisabled(),'Rückgängig ohne Handlung offen');
  await p.locator('#perlen .chip[data-p="pony"]').tap(); await t.warte(150); t.pruefe(await p.evaluate(()=>S.perle)==='pony','Perle'); await zurueck(); t.pruefe(await p.evaluate(()=>S.perle)==='r3','Perle nicht zurück');
  await tipp(p,'#faedeln',t); await vor(p,t,3); reiheStimmt(t,await stand(p),4,'Vor'); await zurueck(); reiheStimmt(t,await stand(p),3,'Pfeil zurück');
  const anderes=await p.evaluate(()=>AR.L[2].k); await tipp(p,`#a-teile [data-teil="${anderes}"]`,t); await zurueck(); t.pruefe((await stand(p)).teil==='k','Teil nicht zurück');
  await p.reload(); await t.warte(300); reiheStimmt(t,await stand(p),3,'Neuladen nach Rückgängig');
  await p.goto(t.basis+SEITE+'?tier=schmetterling'); await t.warte(300); if((await stand(p)).offen) await tipp(p,'#a-zu',t); const muster=()=>p.evaluate(()=>JSON.stringify(aktuellesTier().rows)), vorher=await muster();
  await tipp(p,'#anpassen',t); await p.locator('.pe-dialog').waitFor(); await p.locator('#pe-breite').fill('9'); await p.locator('#pe-breite').dispatchEvent('input'); await p.locator('#pe-breite').dispatchEvent('change'); await tipp(p,'[data-tun="fertig"]',t); t.pruefe(await muster()!==vorher,'Muster nicht geändert'); await zurueck(); t.pruefe(await muster()===vorher,'Muster nicht zurück'); t.keineFehler(k); };

// Druck: exakte Masse, gleiche Buchstaben in Vorschau und Ausdruck, Blattübersicht
const druck=async t=>{ const k=await t.kontext({breite:1180,hoehe:820,touch:false}), p=await k.seite(SEITE+'?tier=baer-naht'); await t.warte(300);
  const marken=s=>p.evaluate(s=>[...document.querySelectorAll(s+' .pl-teil text')].map(e=>e.textContent).join(''),s);
  const m1=await marken('#vorschau'), m2=await marken('#druck'); t.pruefe(m1.length>=5&&m1===m2,'Buchstaben: '+m1+' / '+m2);
  await p.locator('#faedeln').click(); await t.warte(250); const g=await marken('#a-gesamt'); t.pruefe(new Set(g).size===new Set(m1).size&&[...new Set(g)].every(b=>m1.includes(b)),'Gesamtansicht: '+g+' / '+m1); await p.locator('#a-zu').click(); await t.warte(150);
  for(const [id,blaetter] of [['baer-naht',1],['fledermaus-fluegel',2],['figur-felori',2]]){ await p.goto(t.basis+SEITE+'?tier='+id); await t.warte(300);
    const z=await p.evaluate(()=>({druck:document.querySelectorAll('#druck svg').length,schau:document.querySelectorAll('#vorschau svg').length,uebersicht:document.querySelectorAll('#blaetter .pl-blatt').length})); t.pruefe(z.druck===blaetter,id+': '+z.druck+' Blätter'); t.pruefe(z.schau===1,id+': Vorschau '+z.schau);
    if(blaetter>1){ t.pruefe(z.uebersicht===blaetter,id+': Übersicht '+z.uebersicht); const a=await p.innerHTML('#vorschau'); await p.locator('#blaetter .pl-blatt').nth(1).click(); await t.warte(150); t.pruefe(await p.innerHTML('#vorschau')!==a,id+': Blatt 2 fehlt'); t.pruefe(await p.locator('#druck svg').count()===blaetter,id+': Druck verliert Blatt'); }
    await p.emulateMedia({media:'print'}); await t.warte(100);
    const d=await p.evaluate(()=>({linie:[...document.querySelectorAll('#druck path')].filter(e=>/h50/.test(e.getAttribute('d')||'')).map(e=>e.getBoundingClientRect().width),zu:['.pk','main','#arbeit'].filter(s=>{ const e=document.querySelector(s); return e&&e.offsetParent!==null&&e.getBoundingClientRect().height>0; })}));
    t.pruefe(d.linie.length===blaetter,id+': '+d.linie.length+' Kontrolllinien'); for(const l of d.linie) t.pruefe(nah(l,50*96/25.4,.3),id+': Linie '+(l*25.4/96).toFixed(2)+' mm'); t.pruefe(!d.zu.length,id+': Bedienung im Druck '+d.zu);
    const pdf=(await p.pdf({preferCSSPageSize:true,printBackground:true})).toString('latin1'), m=[...pdf.matchAll(/\/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)/g)]; t.pruefe(m.length===blaetter,id+': PDF '+m.length+' Seiten'); for(const x of m) t.pruefe(nah(x[1]*25.4/72,210,.6)&&nah(x[2]*25.4/72,297,.6),id+': PDF '+x[1]+'×'+x[2]);
    await p.emulateMedia({media:'screen'}); }
  t.keineFehler(k); };

// Schmal: Vorschau haftet beim Einstellen
const haften=async t=>{ const k=await t.kontext({breite:390,hoehe:780}), p=await k.seite(SEITE+'?tier=baer-naht'); await t.warte(250);
  const o=await p.evaluate(async()=>{ scrollTo(0,document.documentElement.scrollHeight); await new Promise(a=>setTimeout(a,200)); const q=document.querySelector('.k-vorschau').getBoundingClientRect(); return {top:q.top,hoch:q.height}; });
  t.pruefe(nah(o.top,56,1),'Vorschau oben bei '+o.top); t.pruefe(o.hoch<780*.5,'Vorschau '+o.hoch+' hoch'); t.keineFehler(k); };

// Bestehende Links und gespeicherte Stände
const alt=async t=>{ const k=await t.kontext({breite:1180,hoehe:820}), p=await k.seite(SEITE+'?tier=eidechse&klasse=2&perle=pony'); await t.warte(250);
  t.pruefe(await p.evaluate(()=>S.tier==='eidechse'&&S.klasse===2&&S.perle==='pony'),'Link tier/klasse/perle'); t.pruefe(/tier=eidechse/.test(p.url()),'Link verliert Muster');
  await p.evaluate(()=>{ const t=TIERE.find(x=>x.id==='eidechse'); localStorage.setItem(speicherKey(t),JSON.stringify({...t,rows:t.rows.slice(0,6),beine:[]})); }); await p.reload(); await t.warte(250);
  t.pruefe(await p.evaluate(()=>aktuellesTier().rows.length===6),'Eigenes Muster verloren'); await tipp(p,'#faedeln',t); t.pruefe(await p.evaluate(()=>AR.L[0].rows.length===6),'Fädeln ohne eigenes Muster');
  await vor(p,t,20); t.pruefe((await p.textContent('#a-folge')).includes('✓'),'Eigenes Muster endet nicht'); await p.evaluate(()=>{ AR.pos.k=99; arbeitFrisch(false); }); await p.reload(); await t.warte(250); t.pruefe(await p.evaluate(()=>AR.pos.k<=6),'Stand über dem Ende');
  await p.evaluate(()=>localStorage.setItem('schrittli.perlenarbeit.'+S.tier+'.v9','kaputt')); await p.goto(t.basis+SEITE+'?tier=marienkaefer'); await t.warte(250); t.keineFehler(k); };

module.exports=[{name:'Perlen Kopf',lauf:kopf},{name:'Perlen einfaches Tier',lauf:einfach},{name:'Perlen Teile',lauf:teile},{name:'Perlen Bauarten',lauf:arten},{name:'Perlen pro Kind',lauf:kinder},{name:'Perlen Zeichen',lauf:zeichen},{name:'Perlen Rückgängig',lauf:rueck},{name:'Perlen Druck',lauf:druck},{name:'Perlen Vorschau haftet',lauf:haften},{name:'Perlen alte Stände',lauf:alt}];
