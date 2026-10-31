/* Flagge in jeder Lage der App, hoch und quer, Tablet und Handy. Im Player ohne Kino ist die Pille in der Kopfzeile der Weg zum Melden. */
'use strict';
const GROESSEN=[[1024,768,'iPad quer'],[768,1024,'iPad hoch'],[844,390,'Handy quer'],[390,844,'Handy hoch']];
const VIDEO='wl-fingerstricken';
const kacheln=(p,ohneZurueck)=>p.evaluate(o=>{ const d=wwAuf(); d.innerHTML=wwHtml('Klasse',`<div class="ww-raster">${[1,2,3,4,5,6].map(s=>`<button class="ww-k" data-s="${s}">${s}.</button>`).join('')}</div>`,o?{zu:false}:{zurueck:true}); wwFuellen($('.ww-raster',d)); },ohneZurueck);
const LAGEN={
  Schule:{
    'Start':p=>p.evaluate(()=>go('home')),
    'Klasse':p=>p.evaluate(()=>go('klasse')),
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
    'Foto-Anleitung':p=>p.evaluate(()=>go('player',{videoId:'raketenstation-1'})),
    'Foto-Anleitung Beamer':async p=>{ await p.evaluate(()=>{ BEAMER.an=true; go('player',{videoId:'raketenstation-1'}); }); },
    'Malen':p=>p.evaluate(v=>go('paint',{videoId:v}),VIDEO),
    'Aufnehmen':p=>p.evaluate(v=>go('record',{videoId:v}),VIDEO),
    'Beamer':async p=>{ await p.evaluate(v=>{ BEAMER.an=false; go('player',{videoId:v}); },VIDEO); await p.waitForFunction(()=>P&&P.api&&P.api.ready); await p.evaluate(()=>toggleBeamer(true)); },
  },
  Familie:{
    'Start':p=>p.evaluate(()=>go('home')),
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
module.exports=[{name:'Melden App Schule',lauf:lage('Schule')},{name:'Melden App Familie',lauf:lage('Familie')},{name:'Melden im Vollbild',lauf:vollbild},{name:'Melden Player-Pille',lauf:pille},{name:'Melden App Druck',lauf:druck}];
