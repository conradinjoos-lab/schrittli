/* Punkt 17: Zoom, Tastatur, Fenster, Trefferflächen, echte Schaltflächen. Der Player gehört in eine eigene Ablauf-Datei. */
'use strict';
const VIDEO='wl-fingerstricken', GR=[[1024,768,'iPad quer'],[768,1024,'iPad hoch'],[844,390,'Handy quer'],[390,844,'Handy hoch']];
const SCHIRME={schule:[['home'],['klasse'],['werkzeuge'],['lehrer'],['gallery'],['sammlung'],['restzeit'],['suche'],['projekt',{videoId:VIDEO}],['fuehrerschein'],['paint',{videoId:VIDEO}],['record',{videoId:VIDEO}]],familie:[['home'],['profiles'],['gallery'],['paint',{videoId:VIDEO}]]};
const zeige=([n,a])=>n+(a?' '+JSON.stringify(a):'');
const offen=async(p,n,a)=>{ await p.evaluate(([n,a])=>{ document.querySelectorAll('.modal-bg,.ww').forEach(e=>e.remove()); if(n==='home'&&a===undefined) go('home'); else go(n,a||{}); },[n,a]); await new Promise(f=>setTimeout(f,180)); };

const viewport=async t=>{ const k=await t.kontext();
  for(const a of ['/','/schule/']){ const p=await k.seite(a), inhalt=await p.getAttribute('meta[name=viewport]','content'); t.pruefe(!/user-scalable|maximum-scale/.test(inhalt),a+': '+inhalt); await p.close(); } };

/* Zwei Finger wie auf dem Gerät; die Zeichenfläche bleibt davon ausgenommen */
const zoom=async t=>{ const k=await t.kontext({breite:390,hoehe:844}), p=await t.app(k,'schule'), cdp=await k.c.newCDPSession(p); await t.warte(150);
  await cdp.send('Input.synthesizePinchGesture',{x:195,y:300,scaleFactor:2,gestureSourceType:'mouse'}); await t.warte(250);
  const s=await p.evaluate(()=>visualViewport.scale); t.pruefe(s>1.3,'Start: Zoom '+s);
  const k2=await t.kontext({breite:768,hoehe:1024}), q=await t.app(k2,'schule'); await offen(q,'paint',{videoId:VIDEO});
  t.pruefe(await q.evaluate(()=>getComputedStyle(document.querySelector('.canvas-wrap')).touchAction==='none'&&getComputedStyle(document.body).touchAction!=='none'&&getComputedStyle(document.documentElement).touchAction!=='none'),'Gesten-Schutz'); };

/* iOS zoomt beim Fokus, wenn die Schrift kleiner als 16 px ist */
const schrift=async t=>{ const schlecht=[]; const pruefe=async(p,wo)=>{ for(const f of await p.evaluate(()=>[...document.querySelectorAll('input:not([type=radio]):not([type=checkbox]):not([type=range]):not([type=color]):not([type=file]),textarea,select')].filter(e=>e.getClientRects().length).map(e=>[e.id||e.className||e.tagName,parseFloat(getComputedStyle(e).fontSize)]))) if(f[1]<16) schlecht.push(wo+' '+f[0]+' '+f[1]); };
  for(const art of ['schule','familie']){ const k=await t.kontext(), p=await t.app(k,art);
    for(const s of SCHIRME[art]){ await offen(p,s[0],s[1]); await pruefe(p,art+' '+s[0]); }
    await p.evaluate(()=>nameUndKlasse(()=>{},new Blob())); await t.warte(80); await pruefe(p,art+' Name'); await p.evaluate(()=>fehlerMelden()); await t.warte(50); await pruefe(p,art+' Melden');
    if(art==='familie') for(const tab of ['videos','einstellungen','video']){ await p.evaluate(tab=>{ document.querySelectorAll('.modal-bg').forEach(e=>e.remove()); parentOpen=true; go('parent',{tab}); },tab); await t.warte(120); await pruefe(p,'Eltern '+tab); }
    await p.close(); }
  t.pruefe(!schlecht.length,schlecht.length+' Felder:\n'+schlecht.join('\n')); };

const fenster=async t=>{ const k=await t.kontext({touch:false}), p=await t.app(k,'schule');
  const ausloeser=()=>p.evaluate(()=>{ const b=document.createElement('button'); b.id='ausloeser'; b.textContent='x'; document.querySelector('#app').prepend(b); b.focus(); });
  const fokusIn=s=>p.evaluate(s=>{ const m=document.querySelector(s); return !!m&&m.contains(document.activeElement); },s);
  await ausloeser(); await p.evaluate(()=>confirmBox('Probe','Probe','OK',()=>{}));
  t.pruefe(await fokusIn('.modal'),'Anfangsfokus'); t.pruefe(await p.getAttribute('.modal','role')==='dialog'&&await p.getAttribute('.modal','aria-modal')==='true','Rolle');
  for(let i=0;i<6;i++){ await p.keyboard.press('Tab'); t.pruefe(await fokusIn('.modal'),'Tab verlässt Fenster'); } for(let i=0;i<6;i++){ await p.keyboard.press('Shift+Tab'); t.pruefe(await fokusIn('.modal'),'Shift+Tab verlässt Fenster'); }
  await p.keyboard.press('Escape'); await p.waitForSelector('.modal',{state:'detached',timeout:1000}); t.pruefe(await p.evaluate(()=>document.activeElement.id==='ausloeser'),'Fokus nicht zurück');
  await ausloeser(); await p.evaluate(()=>kidModal('<h2>Probe</h2><button class="kbtn primary" data-close>OK</button>')); t.pruefe(await fokusIn('.modal'),'Kinderfenster Fokus'); await p.keyboard.press('Enter'); await p.waitForSelector('.modal',{state:'detached',timeout:1000}); t.pruefe(await p.evaluate(()=>document.activeElement.id==='ausloeser'),'Kinderfenster Rückkehr');
  /* Name zum Foto: Escape wirkt wie daneben tippen, das Foto bleibt */
  await p.evaluate(()=>{ window.__ng=null; S.settings.fotoKlasse=0; nameUndKlasse(r=>{ window.__ng=r; },new Blob()); }); await t.warte(90); await p.keyboard.press('Escape'); await p.waitForFunction(()=>window.__ng!==null,null,{timeout:1000});
  /* Fenster über Fenster: Escape schliesst nur das obere */
  await p.evaluate(()=>{ confirmBox('Eins','Eins','OK',()=>{}); confirmBox('Zwei','Zwei','OK',()=>{}); }); t.pruefe(await p.locator('.modal').count()===2,'Zwei Fenster'); await p.keyboard.press('Escape'); t.pruefe(await p.locator('.modal').count()===1,'Escape schliesst beide'); await p.keyboard.press('Escape'); t.pruefe(!(await p.locator('.modal').count()),'Fenster bleibt');
  /* Melden: Pfeiltasten und Tab im Fenster, Escape schliesst */
  await p.locator('.fm-knopf').focus(); await p.keyboard.press('Enter'); await p.waitForSelector('.modal .fm-arten'); await p.keyboard.press('Space'); t.pruefe(await p.locator('.modal .fm-arten input:checked').count()===1,'Melden mit Leertaste'); for(let i=0;i<6;i++){ await p.keyboard.press('Shift+Tab'); t.pruefe(await fokusIn('.modal'),'Melden Shift+Tab'); }
  await p.keyboard.press('Escape'); await p.waitForSelector('.modal',{state:'detached',timeout:1000});
  /* Kachelwahl */
  await p.evaluate(()=>{ const d=wwAuf(); d.innerHTML=wwHtml('Klasse','<div class="ww-raster"><button class="ww-k">1</button></div>',{zurueck:true}); wwFuellen($('.ww-raster',d)); $('[data-act=zurueck]',d).onclick=()=>d.remove(); }); await p.keyboard.press('Tab'); await p.keyboard.press('Escape'); await t.warte(200); t.pruefe(!(await p.locator('.ww').count()),'Kachelwahl bleibt');
  /* Seite ausserhalb der App */
  const s=await k.seite('/vorlagen/falten/'); await s.waitForSelector('#melden-flagge',{state:'attached'}); await s.locator('#melden-flagge .flagge').click(); const in2=()=>s.evaluate(()=>{ const r=document.querySelector('#melden-flagge').shadowRoot; return document.activeElement.id==='melden-flagge'&&!!r.activeElement&&!!r.activeElement.closest('.fenster'); });
  t.pruefe(await in2(),'Seite: Anfangsfokus'); await s.keyboard.press('Space'); for(let i=0;i<7;i++){ await s.keyboard.press('Shift+Tab'); t.pruefe(await in2(),'Seite: Shift+Tab'); } for(let i=0;i<7;i++){ await s.keyboard.press('Tab'); t.pruefe(await in2(),'Seite: Tab'); } await s.keyboard.press('Escape'); await s.locator('#melden-flagge .fenster').waitFor({state:'detached',timeout:1000}); };

/* Hauptablauf nur mit Tastatur: Start bis Thema und zurück */
const tastatur=async t=>{ const k=await t.kontext({touch:false}), p=await t.app(k,'schule'); await offen(p,'home');
  await p.keyboard.press('Tab'); t.pruefe(await p.evaluate(()=>document.activeElement!==document.body),'Tab bleibt auf der Seite');
  const vorher=await p.evaluate(()=>view.name+JSON.stringify(view.params||{})); const ziel=await p.evaluate(()=>{ const a=document.querySelector('#app [data-act=area],#app .v3-raum,#app [data-act=raum]'); if(!a) return false; a.focus(); return document.activeElement===a; }); t.pruefe(ziel,'Raum nicht fokussierbar');
  await p.keyboard.press('Enter'); await t.warte(150); t.pruefe(await p.evaluate(()=>view.name+JSON.stringify(view.params||{}))!==vorher,'Enter wirkt nicht'); };

/* Klickbares ist eine Schaltfläche, Trefferflächen häufiger Aktionen 48 px, Hoch und Quer */
const treffer=async t=>{ const schlecht=new Set(), unecht=new Set();
  for(const art of ['schule','familie']) for(const [b,h,gr] of GR){ const k=await t.kontext({breite:b,hoehe:h}), p=await t.app(k,art); if(art==='familie') await p.evaluate(()=>{ S.profiles.push({id:'p2',name:'Zwei',emoji:AVATARS[1],color:COLORS[2],stars:0}); save(); });
    for(const s of SCHIRME[art]){ await offen(p,s[0],s[1]);
      const r=await p.evaluate(()=>{ const nah=e=>{ const q=getComputedStyle(e,'::after'); return q.content!=='none'&&q.position==='absolute'&&q.content!=='normal'?{x:-parseFloat(q.left)||0,y:-parseFloat(q.top)||0}:{x:0,y:0}; };
        const in_=e=>e.closest('.modal-bg,.ww,.fm-knopf,.kid.pl'); const klein=[], falsch=[];
        for(const e of document.querySelectorAll('#app button,#app a[href],#app [data-act],#app label,#app select,#app input:not([type=range]):not([type=file])')){ if(in_(e)||!e.getClientRects().length) continue; const q=e.getBoundingClientRect(), g=nah(e), w=q.width+2*g.x, h=q.height+2*g.y;
          if(e.matches('input[type=radio],input[type=checkbox]')) continue; if((w<47.5||h<47.5)) klein.push((e.tagName+'.'+String(e.className).trim().split(/\s+/)[0]+(e.dataset.act?'['+e.dataset.act+']':'')+' '+Math.round(w)+'×'+Math.round(h)));
          if(e.dataset.act&&!e.matches('button,a[href],input,select,label,[role=button],[role=switch]')) falsch.push(e.tagName+'.'+String(e.className).trim().split(/\s+/)[0]+'['+e.dataset.act+']'); }
        return {klein:[...new Set(klein)],falsch:[...new Set(falsch)]}; });
      r.klein.forEach(x=>schlecht.add(art+' '+s[0]+' '+gr+': '+x)); r.falsch.forEach(x=>unecht.add(art+' '+s[0]+': '+x)); }
    await p.close(); }
  t.pruefe(!unecht.size&&!schlecht.size,'Keine Schaltfläche:\n'+[...unecht].join('\n')+'\nZu klein:\n'+[...schlecht].join('\n')); };

const marke=async t=>{ for(const [a,art] of [['/','familie'],['/schule/','schule']]){ const k=await t.kontext({breite:390,hoehe:844}), p=await t.app(k,art); t.pruefe(!/Stop\s*(&|und)\s*Mach/i.test(await p.evaluate(()=>document.documentElement.outerHTML.replace(/<script[\s\S]*?<\/script>/g,'')+document.title)),a+': alter Name'); t.pruefe(!(await p.locator('a.schild-btn').count()),a+': Link als Schaltfläche'); await p.close(); }
  const k=await t.kontext({breite:390,hoehe:844}), p=await t.app(k,'familie'); await p.evaluate(()=>{ S.profiles.push({id:'p2',name:'Zwei',emoji:AVATARS[1],color:COLORS[2],stars:0}); save(); go('home'); }); await p.locator('.schild.hallo button[data-act=who]').click({timeout:1500}); await p.waitForFunction(()=>view.name==='profiles',null,{timeout:1000}); };

/* Die Zeichenfläche bleibt gleich gross, passt ins Fenster und behält das Bild beim Drehen */
const malen=async t=>{ for(const [b,h] of [[1024,768],[768,1024],[390,844]]){ const wo=b+'x'+h, k=await t.kontext({breite:b,hoehe:h,touch:false}), p=await t.app(k,'schule');
    const mass=()=>p.evaluate(()=>{ const w=document.querySelector('#wrap'), c=document.querySelector('#pc'); return {rahmen:w.offsetHeight,innen:w.clientHeight,bild:c.getBoundingClientRect().height,palette:document.querySelector('.palette').getBoundingClientRect().bottom,fenster:innerHeight}; });
    const dunkel=()=>p.evaluate(()=>{ const c=document.querySelector('#pc'), d=c.getContext('2d').getImageData(0,0,c.width,c.height).data; let n=0; for(let i=0;i<d.length;i+=4) if(d[i]<200) n++; return n; });
    await p.evaluate(()=>go('paint',{videoId:'wl-fingerstricken'})); await t.warte(300); const a=await mass(); await t.warte(600); const z=await mass();
    t.pruefe(a.rahmen===z.rahmen,`${wo}: Fläche wächst ${a.rahmen} → ${z.rahmen}`); t.pruefe(z.bild===z.innen,`${wo}: Bild ${z.bild} statt ${z.innen}`); t.pruefe(z.palette<=z.fenster,`${wo}: Farben unter dem Fenster`);
    const f=await p.locator('#pc').boundingBox(); await p.mouse.move(f.x+30,f.y+30); await p.mouse.down(); await p.mouse.move(f.x+90,f.y+60,{steps:4}); await p.mouse.up(); const vor=await dunkel(); t.pruefe(vor>0,wo+': Strich fehlt');
    await p.setViewportSize({width:h,height:b}); await t.warte(300); const q=await mass(); t.pruefe(q.bild===q.innen,`${wo} gedreht: Bild ${q.bild} statt ${q.innen}`); t.pruefe(q.rahmen!==z.rahmen,wo+': Fläche dreht nicht mit'); t.pruefe(await dunkel()===vor,wo+': Strich verloren'); await p.close(); } };

module.exports=[{name:'Zugang Malen',lauf:malen},{name:'Zugang Zoom erlaubt',lauf:viewport},{name:'Zugang Pinch',lauf:zoom},{name:'Zugang Schrift 16',lauf:schrift},{name:'Zugang Fenster',lauf:fenster},{name:'Zugang Tastatur',lauf:tastatur},{name:'Zugang Treffer',lauf:treffer},{name:'Zugang Marke',lauf:marke}];
