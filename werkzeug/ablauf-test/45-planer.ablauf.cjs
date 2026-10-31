/* Planer und Druck: gleicher Kopf, 5-cm-Linie und Papiermass im Ausdruck, Vorschau haftet, Rückgängig, Speicher pro Kind, alte Links */
'use strict';
const SEITEN=['','falten/','zaehlmuster/','armbaender/','bohren/','drucksachen/','einfrieren/','fachwoerter/','klasse/','maschenprobe/','perlentier-bild/'];
const PLAN={'schrittli.maschenprobe.v1':JSON.stringify({technik:'haekeln',werk:'kappe',m10:20,r10:24,schritt:6,weit:6,name:'Mia',papier:'a4',zeit:1000,mass:{kopf:52},b:51,h:21})};
const BOHREN={'schrittli.bohren.v1':JSON.stringify({b:60,h:40,d:6,a:20,r:15,muster:'raster',lage:'rand',papier:'a4',weg:[]})};
const nah=(a,b,d)=>Math.abs(a-b)<=d;
const klick=(p,s)=>p.locator(s).first().click();

// Kopf: Rückweg, Rückgängig und Drucken stehen überall gleich, nichts rollt seitwärts
const kopf=async t=>{ for(const breite of [1180,390]){ const k=await t.kontext({breite,hoehe:800,touch:false}); let soll=null;
    for(const s of SEITEN){ const p=await k.seite('/vorlagen/'+s); await t.warte(200);
      const z=await p.evaluate(()=>{ const x=q=>{ const e=document.querySelector(q); return e?Math.round(e.getBoundingClientRect().right):null; }; return {pk:!!document.querySelector('.pk'),zurueck:x('.pk .zur-app'),rueck:x('#p-rueck'),druck:x('.pk-druck,.pk-leer'),breit:document.documentElement.scrollWidth-document.documentElement.clientWidth}; });
      t.pruefe(z.pk,s+': kein Kopf'); t.pruefe(z.breit<=0,s+': rollt seitwärts um '+z.breit+' bei '+breite);
      soll=soll||z; for(const f of ['zurueck','rueck','druck']) t.pruefe(z[f]===soll[f],`${s||'Generator'}: ${f} bei ${z[f]}, sonst ${soll[f]} (${breite})`);
      await p.close(); }
    t.keineFehler(k); } };

// Ausdruck: Papiermass im PDF und die Kontrolllinie misst genau 5 cm
const FAELLE=[
  {n:'Generator',u:'?form=herz&b=8',mm:[210,297]},
  {n:'Generator quer',u:'?form=herz&b=8&quer=1',mm:[297,210]},
  {n:'Generator A3',u:'?form=herz&b=8&papier=a3',mm:[297,420]},
  {n:'Falten',u:'falten/?f=wuerfel',mm:[210,297]},
  {n:'Falten A3',u:'falten/?f=wuerfel&p=a3',mm:[297,420]},
  {n:'Zählmuster',u:'zaehlmuster/',mm:[210,297]},
  {n:'Zählmuster A3',u:'zaehlmuster/?papier=a3',mm:[297,420]},
  {n:'Armbänder',u:'armbaender/',mm:[210,297]},
  {n:'Bohren',u:'bohren/',speicher:BOHREN,mm:[210,297]},
  {n:'Maschen',u:'maschenprobe/?technik=haekeln&werk=kappe',speicher:PLAN,mm:[210,297],vor:p=>p.evaluate(()=>{ window.print=()=>{}; (document.querySelector('[data-act=plan-druck]')||document.getElementById('drucken')).click(); })},
  {n:'Perlenbild',u:'perlentier-bild/',mm:[210,297],vor:async(p,t)=>{ await klick(p,'#beispiel-zeile button'); await t.warte(1500); await p.evaluate(()=>{ window.print=()=>{}; document.getElementById('drucken').click(); }); }},
];
const druck=async t=>{ for(const f of FAELLE){ const k=await t.kontext({breite:1180,hoehe:800,touch:false,speicher:f.speicher||{}}), p=await k.seite('/vorlagen/'+f.u); await t.warte(300);
    if(f.vor) await f.vor(p,t);
    await p.emulateMedia({media:'print'}); await t.warte(100);
    const z=await p.evaluate(()=>({linie:[...document.querySelectorAll('#druck path')].filter(e=>/h50/.test(e.getAttribute('d')||'')).map(e=>e.getBoundingClientRect().width),zu:[...document.querySelectorAll('.kopf,main,.pk,.pl-leiste')].filter(e=>getComputedStyle(e).display!=='none').length}));
    t.pruefe(z.linie.length,f.n+': keine Kontrolllinie'); t.pruefe(nah(z.linie[0],50*96/25.4,.3),f.n+': Linie '+(z.linie[0]*25.4/96).toFixed(2)+' mm'); t.pruefe(!z.zu,f.n+': Bedienung im Druck sichtbar');
    const m=(await p.pdf({preferCSSPageSize:true,printBackground:true})).toString('latin1').match(/\/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)/);
    t.pruefe(m&&nah(m[1]*25.4/72,f.mm[0],.6)&&nah(m[2]*25.4/72,f.mm[1],.6),f.n+': PDF '+(m?[m[1]*25.4/72,m[2]*25.4/72].map(Math.round):'?'));
    t.keineFehler(k); } };

// Schmal: die Vorschau haftet unter dem Kopf, auch am Seitenende
const HAFTEN=[['','.karte-vorschau'],['falten/','.schau'],['zaehlmuster/','#k-farben'],['armbaender/','#k-vorschau'],['bohren/','#pv-box'],['drucksachen/','.seite-rechts'],['fachwoerter/','#k-vorschau'],['perlentier-bild/','#k-plan']];
const haften=async t=>{ const k=await t.kontext({breite:390,hoehe:780,touch:false});
  for(const [s,w] of HAFTEN){ const p=await k.seite('/vorlagen/'+s); await t.warte(250); if(s.startsWith('perlentier')){ await klick(p,'#beispiel'); await t.warte(800); }
    const o=await p.evaluate(async w=>{ scrollTo(0,document.documentElement.scrollHeight); await new Promise(a=>setTimeout(a,150)); const q=document.querySelector(w).getBoundingClientRect(); return {top:q.top,hoch:q.height}; },w);
    t.pruefe(nah(o.top,56,1),(s||'Generator')+': oben bei '+o.top); t.pruefe(o.hoch<780*.5,(s||'Generator')+': Vorschau '+o.hoch+' hoch'); await p.close(); }
  t.keineFehler(k); };

// Generator: Papier, Lage, Zahl, Liste, Frei, Ziehen und «⚠ Zu gross» lassen sich zurücknehmen
const rueck=async t=>{ const k=await t.kontext({breite:1180,hoehe:800,touch:false}), p=await k.seite('/vorlagen/?form=herz&b=5');
  const seite=()=>p.$eval('#seite',e=>e.textContent), zurueck=async()=>{ await klick(p,'#p-rueck'); await t.warte(150); };
  await klick(p,'[data-pl-quer="1"]'); t.pruefe(/A4 landscape/.test(await seite()),'Quer wirkt nicht'); t.pruefe(/quer=1/.test(p.url()),'Quer fehlt im Link');
  await klick(p,'[data-pl-papier=a3]'); t.pruefe(/A3 landscape/.test(await seite()),'A3 wirkt nicht');
  await zurueck(); await zurueck(); t.pruefe(/A4 portrait/.test(await seite()),'Papier nicht zurück'); t.pruefe(await p.$eval('#p-rueck',e=>e.disabled),'Stapel nicht leer');
  await p.fill('#b','9'); await p.fill('#b','9.5'); await t.warte(100); await zurueck(); t.pruefe(await p.inputValue('#b')==='5','Zahl nicht zurück');
  await klick(p,'#dazu'); await klick(p,'[data-modus=frei]'); await t.warte(200); t.pruefe(await p.locator('#vorschau .frei').count()===1,'Frei zeigt nichts');
  const lage=()=>p.$eval('#vorschau .frei',e=>e.getAttribute('transform')), vor=await lage(), q=await p.locator('#vorschau .frei').boundingBox();
  await p.mouse.move(q.x+q.width/2,q.y+q.height/2); await p.mouse.down(); await p.mouse.move(q.x+q.width/2+60,q.y+q.height/2+40,{steps:4}); await p.mouse.up(); await t.warte(150);
  t.pruefe(await lage()!==vor,'Ziehen wirkt nicht'); await zurueck(); t.pruefe(await lage()===vor,'Ziehen nicht zurück');
  await zurueck(); await zurueck(); t.pruefe(!/liste=/.test(p.url()),'Liste nicht zurück');
  await p.goto(t.basis+'/vorlagen/?form=herz&b=25&h=22'); await t.warte(200);
  t.pruefe(await p.isVisible('#gross-wahl [data-pl-wahl=a3]'),'Keine Wahl A3'); await klick(p,'#gross-wahl [data-pl-wahl=a3]'); await t.warte(150);
  t.pruefe(/A3 portrait/.test(await seite()),'Wahl A3 wirkt nicht'); t.pruefe(!await p.isVisible('#gross-wahl'),'Warnung bleibt'); await zurueck(); t.pruefe(/A4 portrait/.test(await seite()),'Wahl A3 nicht zurück');
  t.keineFehler(k); };

// Jede Seite: eine Handlung ändert den Stand, Rückgängig bringt genau den alten zurück
const HANDLUNG=[
  ['falten/?f=wuerfel',p=>klick(p,'[data-pl-papier=a3]')],
  ['zaehlmuster/',p=>klick(p,'#modi .chip:not([aria-pressed=true])')],
  ['armbaender/',p=>p.fill('#name','Lea')],
  ['bohren/',p=>klick(p,'[data-pl-papier=a3]')],
  ['drucksachen/',p=>klick(p,'.tab:not([aria-selected=true]):not(.an)')],
  ['fachwoerter/',p=>klick(p,'#erkl')],
  ['klasse/',p=>p.evaluate(()=>document.getElementById('auf-plus').click())],
  ['maschenprobe/',p=>klick(p,'[data-technik]')],
  ['perlentier-bild/',p=>klick(p,'#beispiel')],
  ['einfrieren/',async p=>{ const gif=Buffer.from('R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==','base64'); await p.setInputFiles('input[type=file]',{name:'a.gif',mimeType:'image/gif',buffer:gif}); }],
];
const stand=p=>p.evaluate(()=>[document.getElementById('seite')?.textContent||'',document.getElementById('druck')?.innerHTML||'',document.querySelector('main').innerText,[...document.querySelectorAll('main input:not([type=file])')].map(e=>e.type==='checkbox'?e.checked:e.value).join('|'),[...document.querySelectorAll('main img')].map(e=>e.hidden?'':e.getAttribute('src')).join('|')].join('\n§'));
const seitenRueck=async t=>{ for(const [s,tue] of HANDLUNG){ const k=await t.kontext({breite:1180,hoehe:800,touch:false}), p=await k.seite('/vorlagen/'+s); await t.warte(300);
    const vor=await stand(p); await tue(p); await t.warte(900); t.pruefe(await stand(p)!==vor,s+': Handlung ohne Wirkung'); t.pruefe(!await p.$eval('#p-rueck',e=>e.disabled),s+': Rückgängig bleibt grau');
    await klick(p,'#p-rueck'); await t.warte(400); t.pruefe(await stand(p)===vor,s+': nicht zurück'); t.pruefe(await p.$eval('#p-rueck',e=>e.disabled),s+': Stapel nicht leer');
    t.keineFehler(k); } };

// Speicher: ein Plan verfällt nicht, das erste Kind übernimmt den Stand, das zweite beginnt leer, der gemeinsame bleibt
const speicher=async t=>{ const lies=(p,n)=>p.evaluate(n=>localStorage.getItem(n),n);
  { const k=await t.kontext({touch:false,speicher:PLAN}), p=await k.seite('/vorlagen/maschenprobe/'); await t.warte(200); t.pruefe(/kappe/.test(await lies(p,'schrittli.maschenprobe.v1')),'Alter Plan verfallen'); t.pruefe(await p.evaluate(()=>Planer.speicher('schrittli.maschenprobe.v1').lies().name)==='Mia','Plan nicht gelesen'); t.keineFehler(k); }
  { const k=await t.kontext({touch:false,speicher:{...PLAN,'schrittli.kind':'mia'}}), p=await k.seite('/vorlagen/maschenprobe/'); await t.warte(200);
    t.pruefe(/kappe/.test(await lies(p,'schrittli.maschenprobe.v1.kind.mia')),'Kind ohne Stand'); t.pruefe(await lies(p,'schrittli.maschenprobe.v1'),'Gemeinsamer Stand weg');
    await p.evaluate(()=>localStorage.setItem('schrittli.kind','leo')); await p.reload(); await t.warte(200);
    t.pruefe(!/"name":"Mia"/.test(await lies(p,'schrittli.maschenprobe.v1.kind.leo')||''),'Zweites Kind erbt fremden Stand');
    await p.evaluate(()=>localStorage.setItem('schrittli.kind','mia')); await p.reload(); await t.warte(200); t.pruefe(/"name":"Mia"/.test(await lies(p,'schrittli.maschenprobe.v1.kind.mia')),'Stand von Mia weg'); t.keineFehler(k); } };

// Alte Links
const links=async t=>{ const k=await t.kontext({breite:1180,hoehe:800,touch:false});
  { const p=await k.seite('/vorlagen/?form=herz&b=8'); await t.warte(200); t.pruefe(await p.inputValue('#b')==='8','form/b'); await p.close(); }
  { const p=await k.seite('/vorlagen/?liste=herz:5x4.4:2'); await t.warte(200); t.pruefe(/2 Stück/.test(await p.textContent('#l-titel')),'liste'); await p.close(); }
  { const p=await k.seite('/vorlagen/maschenprobe/?technik=haekeln&werk=kappe'); await t.warte(200); t.pruefe(await p.evaluate(()=>S.technik==='haekeln'&&S.werk==='kappe'),'technik/werk'); await p.close(); }
  t.keineFehler(k); };

module.exports=[{name:'Planer Kopf',lauf:kopf},{name:'Planer Druck',lauf:druck},{name:'Planer Vorschau haftet',lauf:haften},{name:'Planer Rückgängig Generator',lauf:rueck},{name:'Planer Rückgängig Seiten',lauf:seitenRueck},{name:'Planer Speicher pro Kind',lauf:speicher},{name:'Planer alte Links',lauf:links}];
