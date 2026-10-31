/* Flagge in jeder Lage der App, hoch und quer, Tablet und Handy. Im Player ohne Kino ist die Pille in der Kopfzeile der Weg zum Melden. */
'use strict';
const GROESSEN=[[1024,768,'iPad quer'],[768,1024,'iPad hoch'],[844,390,'Handy quer'],[390,844,'Handy hoch']];
const VIDEO='wl-fingerstricken';
const kacheln=(p,ohneZurueck)=>p.evaluate(o=>{ const d=wwAuf(); d.innerHTML=wwHtml('Klasse',`<div class="ww-raster">${[1,2,3,4,5,6].map(s=>`<button class="ww-k" data-s="${s}">${s}.</button>`).join('')}</div>`,o?{zu:false}:{zurueck:true}); wwFuellen($('.ww-raster',d)); },ohneZurueck);
/* Namen wie im Schulhaus: viele Kacheln und ein langer Name. Die Klassen stehen nur für diese eine Lage, sonst fragt die App beim nächsten Schirm */
const KLASSE=[{id:'k',name:'3a',stufe:3,namen:['Ben','Eva','Ida','Lea','Mia','Noah','Tim','Zoe','Ana','Leo','Max','Nina','Olaf','Pia','Sina','Tara','Ueli','Vera','Yara','Maximiliane-Sophie']}];
const mitNamen=fn=>p=>p.evaluate(([l,f])=>{ KL.klassen=l; try{ (0,eval)(f)(); }finally{ KL.klassen=[]; } },[KLASSE,String(fn)]);
/* Unterrichtsschirm ohne Worker: Verbindung gesetzt, Fehlerzustand von Hand */
const unterricht=(p,fehler)=>p.evaluate(f=>{ U.verb={token:'a'.repeat(64),deviceId:crypto.randomUUID(),id:null,name:'Probe'}; U.policy=null; U.error=f; go('unterricht'); U.verb=null; },fehler);
const LAGEN={
  Schule:{
    'Start':p=>p.evaluate(()=>go('home')),
    'Klasse':p=>p.evaluate(()=>go('klasse')),
    'Raum':p=>p.evaluate(()=>go('raum')),
    'Thema':p=>p.evaluate(()=>go('area',{id:S.areas[0].id})),
    'Projekt':p=>p.evaluate(v=>go('projekt',{videoId:v}),VIDEO),
    'Suche':p=>p.evaluate(()=>go('suche',{lupe:1})),
    'Werkzeuge':p=>p.evaluate(()=>go('werkzeuge')),
    'Lehrpersonen':p=>p.evaluate(()=>go('lehrer')),
    'Werke':p=>p.evaluate(()=>go('gallery')),
    'Sammlung':p=>p.evaluate(()=>go('sammlung')),
    'Restzeit':p=>p.evaluate(()=>go('restzeit')),
    'Führerschein':p=>p.evaluate(()=>go('fuehrerschein')),
    'Fenster':p=>p.evaluate(()=>confirmBox('Probe','Probe','OK',()=>{})),
    'Kinderfenster':p=>p.evaluate(()=>kidModal('<h2>Probe</h2><button class="kbtn primary" data-close>OK</button>')),
    'Kamera-Übergang':p=>p.evaluate(()=>nameUndKlasse(()=>{},new Blob())),
    'Kachelwahl mit Zurück':p=>kacheln(p,false),
    'Kachelwahl ohne Zurück':p=>kacheln(p,true),
    'Namen wechseln':mitNamen(()=>kinderWechsel()),
    'Namen zum Foto':mitNamen(()=>werWahl(()=>{})),
    'Sterne nach dem Foto':mitNamen(()=>{ SW.verb={id:'s',name:'Probe',token:'a'.repeat(64)}; kindFertig([{liste:'k',name:'Maximiliane-Sophie'},{liste:'k',name:'Noah'},{liste:'k',name:'Lea'}],()=>{},new Blob()); SW.verb=null; }),
    'Stand des Kindes':mitNamen(()=>{ kinderSetzen([{liste:'k',name:'Mia',key:'3a/Mia'}]); ['raketenstation-1','raketenstation-2','wl-fingerstricken'].forEach((v,i)=>{ const o=prog(v); o.step=2; o.zeit=i+1; }); standZeigen(wwAuf(),()=>{}); kinderSetzen([]); }),
    'Foto-Anleitung':p=>p.evaluate(()=>go('player',{videoId:'raketenstation-1'})),
    'Foto-Anleitung Beamer':async p=>{ await p.evaluate(()=>{ BEAMER.an=true; go('player',{videoId:'raketenstation-1'}); }); },
    'Malen':p=>p.evaluate(v=>go('paint',{videoId:v}),VIDEO),
    'Aufnehmen':p=>p.evaluate(v=>go('record',{videoId:v}),VIDEO),
    'Unterricht wartet':p=>unterricht(p,null),
    'Unterricht weg':p=>unterricht(p,'⚠ Verbindung'),
    'Beamer':async p=>{ await p.evaluate(v=>{ BEAMER.an=false; go('player',{videoId:v}); },VIDEO); await p.waitForFunction(()=>P&&P.api&&P.api.ready); await p.evaluate(()=>toggleBeamer(true)); },
  },
  Familie:{
    'Start':p=>p.evaluate(()=>go('home')),
    'Erster Start':p=>p.evaluate(()=>go('firstrun')),
    'Kinder':p=>p.evaluate(()=>go('profiles')),
    'Zimmer':p=>p.evaluate(()=>go('zimmer',{r:RAEUME[0].id})),
    'Thema':p=>p.evaluate(()=>go('area',{id:S.areas[0].id})),
    'Projekt':p=>p.evaluate(()=>go('projekt',{videoId:S.videos[0].id})),
    'Werkzeuge':p=>p.evaluate(()=>go('werkzeuge')),
    'Werke':p=>p.evaluate(()=>go('gallery')),
    'Suche':p=>p.evaluate(()=>go('suche',{lupe:1})),
    'Malen':p=>p.evaluate(()=>go('paint',{videoId:S.videos[0].id})),
    'Aufnehmen':p=>p.evaluate(()=>go('record',{videoId:S.videos[0].id})),
    'Foto-Anleitung':p=>p.evaluate(()=>{ const a=S.videos.find(v=>v.quelle==='anleitung')||S.videos[0]; go('player',{videoId:a.id}); }),
    'Katalog':p=>p.evaluate(()=>{ parentOpen=true; go('parent',{tab:'katalog'}); }),
    'Bereiche':p=>p.evaluate(()=>{ parentOpen=true; go('parent',{tab:'bereiche'}); }),
    'Kinderkonten':p=>p.evaluate(()=>{ parentOpen=true; go('parent',{tab:'kinder'}); }),
    'Elternwerke':p=>p.evaluate(()=>{ parentOpen=true; go('parent',{tab:'werke'}); }),
    'Daten':p=>p.evaluate(()=>{ parentOpen=true; go('parent',{tab:'daten'}); }),
    'Elternbereich':p=>p.evaluate(()=>{ parentOpen=true; go('parent',{tab:'videos'}); }),
    'Elternbereich PIN':p=>p.evaluate(()=>{ parentOpen=false; go('parent',{tab:'videos'}); }),
    'Einstellungen':p=>p.evaluate(()=>{ parentOpen=true; go('parent',{tab:'einstellungen'}); }),
    'Editor':p=>p.evaluate(()=>{ parentOpen=true; go('parent',{tab:'video'}); }),
    'Kino':async p=>{ await p.evaluate(v=>{ S.settings.kino=false; go('player',{videoId:v}); },VIDEO); await p.waitForFunction(()=>P&&P.api&&P.api.ready); await p.evaluate(()=>{ toggleKino(true); }); await p.waitForSelector('.kid.pl.kino'); },
    'Beamer':async p=>{ await p.evaluate(v=>{ S.settings.kino=false; go('player',{videoId:v}); },VIDEO); await p.waitForFunction(()=>P&&P.api&&P.api.ready); await p.evaluate(()=>toggleBeamer(true)); },
  }};
const lage=(art,nur)=>async t=>{ const schlecht=[];
  for(const [b,h,gr] of GROESSEN){ const k=await t.kontext({breite:b,hoehe:h}), p=await t.app(k,art==='Schule'?'schule':'familie');
    for(const [name,hin] of Object.entries(LAGEN[art])){ const wo=`${art} ${name} ${gr}`;
      try{ await p.evaluate(()=>{ document.querySelectorAll('.modal-bg,.ww').forEach(e=>e.parentElement===document.body?e.remove():(e.parentElement.remove())); try{ if(typeof toggleBeamer==='function'&&document.body.classList.contains('beamer')) toggleBeamer(false); }catch(e){} BEAMER.an=false; go('home'); return document.fullscreenElement&&document.exitFullscreen(); }); await p.waitForFunction(()=>!document.fullscreenElement); await t.warte(30);   // das Verlassen des Vollbilds schliesst sonst den nächsten Beamer
        await hin(p); await t.warte(260); t.pruefeFlagge(await t.flagge(p),wo); t.pruefe(await p.evaluate(b=>innerWidth===b&&document.documentElement.scrollWidth<=b,b),wo+': Seite breiter als das Gerät');
        await p.evaluate(()=>{ const e=document.scrollingElement; e.scrollTop=e.scrollHeight; }); await t.warte(40);
        if(!(await p.locator('.modal-bg,.ww').count())) t.pruefeFlagge(await t.flagge(p,true),wo+' am Ende');
        await p.evaluate(()=>{ document.scrollingElement.scrollTop=0; });
        await p.locator('.fm-knopf').click({timeout:1500}); await p.waitForSelector('.modal .fm-arten',{timeout:1000}); t.pruefe(await p.locator('.modal .fm-arten input:checked').count()===0,wo+': vorgewählt'); await p.keyboard.press('Escape'); await p.waitForSelector('.modal .fm-arten',{state:'detached',timeout:1000}); }
      catch(e){ const z=e.message.split('\n')[0].slice(0,220); schlecht.push(z.startsWith(art)?z:wo+': '+z); } }
    await p.close(); if(k.fehler.length) schlecht.push(gr+': '+[...new Set(k.fehler)].slice(0,3).join(' ; ')); }
  t.pruefe(!schlecht.length,schlecht.length+' Stellen:\n'+schlecht.join('\n')); };
/* Echtes Vollbild braucht einen echten Klick */
const vollbild=async t=>{ const k=await t.kontext({touch:false}), p=await t.app(k,'familie');
  await p.evaluate(v=>{ S.settings.kino=false; go('player',{videoId:v}); },VIDEO); await p.waitForFunction(()=>P&&P.api&&P.api.ready); await t.warte(100);
  await p.locator('[data-act=kino]').first().click(); await p.waitForSelector('.kid.pl.kino'); await p.waitForFunction(()=>!!document.fullscreenElement,null,{timeout:3000});
  t.pruefeFlagge(await t.flagge(p),'Vollbild'); await p.locator('.fm-knopf').click(); await p.waitForSelector('.modal .fm-arten'); t.pruefe(await p.evaluate(()=>!!document.fullscreenElement),'Vollbild verlassen'); };
const pille=async t=>{ for(const art of ['schule','familie']){ const k=await t.kontext(), p=await t.app(k,art); await p.evaluate(v=>{ S.settings.kino=false; go('player',{videoId:v}); },VIDEO); await t.warte(150);
    const f=await t.flagge(p); t.pruefe(!f.sichtbar,art+': Flagge doppelt zur Pille'); await p.locator('.fm-pill').click({timeout:1500}); await p.waitForSelector('.modal .fm-arten',{timeout:1000}); } };
const druck=async t=>{ for(const art of ['schule','familie']){ const k=await t.kontext(), p=await t.app(k,art); await t.warte(100); t.pruefe((await t.flagge(p)).sichtbar,art+': Flagge fehlt am Schirm'); await p.emulateMedia({media:'print'}); t.pruefe(!(await t.flagge(p)).sichtbar,art+': Flagge im Druck'); await p.close(); } };
/* Jede Ansicht der App: eine neue Ansicht ohne Eintrag hier lässt den Ablauf scheitern */
const WEGE={
  schule:{ home:()=>go('home'), klasse:()=>go('klasse'), raum:()=>go('raum'), area:()=>go('area',{id:S.areas[0].id}), projekt:()=>go('projekt',{videoId:'wl-fingerstricken'}), anleitung:()=>go('anleitung',{v:videoOf('raketenstation-1')}), player:()=>go('player',{videoId:'wl-fingerstricken'}), school:()=>go('school',{video:videoOf('wl-fingerstricken')}), suche:()=>go('suche',{lupe:1}), werkzeuge:()=>go('werkzeuge'), lehrer:()=>go('lehrer'), gallery:()=>go('gallery'), sammlung:()=>go('sammlung'), restzeit:()=>go('restzeit'), fuehrerschein:()=>go('fuehrerschein'), paint:()=>go('paint',{videoId:'wl-fingerstricken'}), record:()=>go('record',{videoId:'wl-fingerstricken'}),
    unterricht:()=>{ U.verb={token:'a'.repeat(64),deviceId:crypto.randomUUID(),id:null,name:'Probe'}; U.policy=null; U.error=null; go('unterricht'); U.verb=null; }, wer:()=>{ KL.klassen=[{id:'k',name:'3a',stufe:3,namen:['Ben','Eva']}]; go('wer'); KL.klassen=[]; } },
  familie:{ firstrun:()=>go('firstrun'), profiles:()=>go('profiles'), zimmer:()=>go('zimmer',{r:RAEUME[0].id}), parent:()=>{ parentOpen=true; go('parent',{tab:'videos'}); } }};
const PILLE=new Set(['player','school']);
const ansichten=async t=>{ const gesehen=new Set(), schlecht=[]; let alle=[];
  for(const art of ['schule','familie']){ const k=await t.kontext(), p=await t.app(k,art); alle=await p.evaluate(()=>Object.keys(SCREENS));
    if(art==='schule') await p.evaluate(()=>{ S.settings.klasse=3; S.settings.raum=RAEUME[0].id; });
    for(const [name,hin] of Object.entries(WEGE[art])){ const wo=art+' '+name;
      try{ await p.evaluate(()=>document.querySelectorAll('.modal-bg,.ww').forEach(e=>e.remove())); await p.evaluate(f=>(0,eval)(f)(),String(hin)); await t.warte(220); const v=await p.evaluate(()=>view.name); t.pruefe(v===name,wo+': landet auf '+v); gesehen.add(name);
        if(PILLE.has(name)) await p.locator('.fm-pill').click({timeout:1500}); else { t.pruefeFlagge(await t.flagge(p),wo); await p.locator('.fm-knopf').click({timeout:1500}); }
        await p.waitForSelector('.modal .fm-arten',{timeout:1000}); await p.keyboard.press('Escape'); await p.waitForSelector('.modal .fm-arten',{state:'detached',timeout:1000}); }
      catch(e){ schlecht.push(wo+': '+e.message.split('\n')[0].slice(0,200)); } }
    t.pruefe(!k.fehler.length,art+': '+k.fehler.slice(0,3).join(' ; ')); await p.close(); }
  const fehlt=alle.filter(n=>n!=='boot'&&!gesehen.has(n)); t.pruefe(!fehlt.length,'Ansicht ohne Prüfung: '+fehlt.join(', ')); t.pruefe(!schlecht.length,schlecht.join('\n')); };
/* Schon beim Laden: Inhalte bleiben hängen, die Flagge ist trotzdem da */
const laden=async t=>{ for(const art of ['schule','familie']){ const k=await t.kontext(); let los; const halt=new Promise(r=>{ los=r; }); await k.c.route(/\/(inhalte|schule|anleitungen|katalog)[^/]*\.json/,async r=>{ await halt; await r.fallback(); }); const p=await k.seite(art==='schule'?'/schule/':'/'); await p.waitForSelector('.boot-laden');
    t.pruefe(await p.evaluate(()=>view.name)==='boot',art+': nicht beim Laden'); t.pruefeFlagge(await t.flagge(p),art+' beim Laden'); await p.locator('.fm-knopf').click({timeout:1500}); await p.waitForSelector('.modal .fm-arten',{timeout:1000}); los(); await p.close(); } };
/* Die Sperre schluckt jede Eingabe, das ist ihr Zweck. Nach dem Lösen ist die Flagge sofort wieder da */
const einfrieren=async t=>{ const k=await t.kontext({touch:false,breite:1024,hoehe:768}), p=await k.seite('/vorlagen/einfrieren/'); await p.waitForSelector('#melden-flagge',{state:'attached'}); await p.locator('#beispiel').click(); await p.waitForFunction(()=>!document.querySelector('#frieren').disabled); await p.locator('#frieren').click(); await p.waitForFunction(()=>!!window.__einfrieren,null,{timeout:3000});
  await p.mouse.move(1024-46,768-46); await p.mouse.down(); await p.waitForFunction(()=>!window.__einfrieren,null,{timeout:4500}); await p.mouse.up(); await p.waitForFunction(()=>!document.fullscreenElement); await t.warte(250); t.pruefeFlagge(await t.flagge(p),'nach dem Lösen'); await p.locator('#melden-flagge .flagge').click(); await p.waitForFunction(()=>!!document.querySelector('#melden-flagge').shadowRoot.querySelector('.fenster')); t.keineFehler(k); };
module.exports=[{name:'Melden jede Ansicht',lauf:ansichten},{name:'Melden beim Laden',lauf:laden},{name:'Melden nach Einfrieren',lauf:einfrieren},{name:'Melden App Schule',lauf:lage('Schule')},{name:'Melden App Familie',lauf:lage('Familie')},{name:'Melden im Vollbild',lauf:vollbild},{name:'Melden Player-Pille',lauf:pille},{name:'Melden App Druck',lauf:druck}];
