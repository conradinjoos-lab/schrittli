// Gemeinsame Bausteine der Planer. Kopf: statisch im HTML (.pk), Stil in planer.css.
// Rückgängig: Planer.verlauf({hole,setze}), vor jeder Handlung Planer.merke(). Massangaben im Ausdruck immer in mm.
(function(){
  const finde=z=>typeof z==='string'?document.querySelector(z):z;
  const PAPIERE={a4:{id:'a4',name:'A4',w:210,h:297},a3:{id:'a3',name:'A3',w:297,h:420}};

  // ---------- Rückgängig ----------
  const MAX=60; let quelle=null, stapel=[], letzteGruppe='', letzteZeit=0;
  const knopf=()=>{ const b=document.getElementById('p-rueck'); if(b)b.disabled=!stapel.length; };
  function verlauf(q){ quelle=q; knopf(); }
  // Vor der Handlung aufrufen. Ohne Zustand gilt hole(); eine Funktion stellt Bilder und Ähnliches beim Rückgängig selbst wieder her.
  // gruppe fasst Tippen und Stepper zu einem Schritt zusammen.
  function merke(zustand,gruppe){
    const nun=Date.now();
    if(gruppe&&gruppe===letzteGruppe&&nun-letzteZeit<1200){ letzteZeit=nun; return; }
    letzteGruppe=gruppe||''; letzteZeit=nun;
    if(zustand==null&&quelle)zustand=quelle.hole();
    if(zustand==null)return;
    const e=typeof zustand==='function'?zustand:JSON.stringify(zustand);
    if(stapel[stapel.length-1]===e)return;
    stapel.push(e); if(stapel.length>MAX)stapel.shift();
    knopf();
  }
  function zurueck(){
    const jetzt=quelle?JSON.stringify(quelle.hole()):null;
    let e=stapel.pop(); while(e!==undefined&&e===jetzt)e=stapel.pop();   // Handlung ohne Wirkung überspringen
    letzteGruppe='';
    if(e!==undefined){ if(typeof e==='function')e(); else if(quelle)quelle.setze(JSON.parse(e)); }
    knopf(); return e!==undefined;
  }
  document.addEventListener('click',e=>{ if(e.target.closest&&e.target.closest('#p-rueck'))zurueck(); });
  document.addEventListener('keydown',e=>{
    if(!(e.ctrlKey||e.metaKey)||e.shiftKey||e.altKey||e.key.toLowerCase()!=='z')return;
    if(e.target.closest&&e.target.closest('input,textarea,select,[contenteditable]'))return;
    if(stapel.length){ e.preventDefault(); zurueck(); }
  });

  // ---------- Speicher: ohne Kind der bestehende Schlüssel, mit «schrittli.kind» pro Kind getrennt ----------
  const kind=()=>{ try{ return String(localStorage.getItem('schrittli.kind')||'').trim(); }catch(e){ return ''; } };
  function speicher(name){
    const basis=/^schrittli/.test(name)?name:'schrittli.'+name, marke=basis+'.vergeben';
    const schluessel=()=>{ const k=kind(); return k?basis+'.kind.'+k:basis; };
    return {
      get schluessel(){ return schluessel(); },
      lies(){ try{ const s=schluessel(); let t=localStorage.getItem(s);
          // Das erste Kind übernimmt den bisherigen gemeinsamen Stand einmal als Kopie; das Original bleibt
          if(t===null&&s!==basis&&!localStorage.getItem(marke)){ t=localStorage.getItem(basis); if(t!==null){ localStorage.setItem(marke,kind()); localStorage.setItem(s,t); } }
          if(t===null)return null; try{ return JSON.parse(t); }catch(e){ return t; }
        }catch(e){ return null; } },
      schreibe(w){ try{ localStorage.setItem(schluessel(),JSON.stringify(w)); return true; }catch(e){ return false; } },
      weg(){ try{ localStorage.removeItem(schluessel()); }catch(e){} }
    };
  }

  // ---------- Papier ----------
  function seite(o={}){   // @page und --bw/--bh; rand in mm
    const P=PAPIERE[o.papier]||PAPIERE.a4, w=o.quer?P.h:P.w, h=o.quer?P.w:P.h;
    let el=document.getElementById('seite');
    if(!el){ el=document.createElement('style'); el.id='seite'; document.head.appendChild(el); }
    el.textContent=`@page{size:${P.name} ${o.quer?'landscape':'portrait'};margin:${o.rand?o.rand+'mm':0}}#druck{--bw:${w}mm;--bh:${h}mm}`;
    return P;
  }
  const BILD_HOCH='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="3" width="11" height="18" rx="2"/></svg>';
  const BILD_QUER='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6.5" width="18" height="11" rx="2"/></svg>';
  // Papierwahl, Ausrichtung und Blattanzahl als Grafik. wahl({papier,quer}) meldet Klicks; zeige({...}) führt die Anzeige nach.
  function druckkopf(ziel,o={}){
    const el=finde(ziel), st={papiere:['a4','a3'],papier:'a4',quer:false,lage:false,blaetter:1,nx:0,wahl(){},...o};
    el.classList.add('pl-leiste');
    el.innerHTML=(st.papiere.length>1?`<div class="pl-seg" role="group" aria-label="Papier">${st.papiere.map(p=>`<button type="button" data-pl-papier="${p}">${PAPIERE[p].name}</button>`).join('')}</div>`:'')
      +(st.lage?`<div class="pl-seg" role="group" aria-label="Ausrichtung"><button type="button" data-pl-quer="0" aria-label="Hochformat" title="Hochformat">${BILD_HOCH}</button><button type="button" data-pl-quer="1" aria-label="Querformat" title="Querformat">${BILD_QUER}</button></div>`:'')
      +'<span class="pl-zahl" role="img"></span>';
    const zahl=el.querySelector('.pl-zahl');
    function zeichne(){
      el.querySelectorAll('[data-pl-papier]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.plPapier===st.papier));
      el.querySelectorAll('[data-pl-quer]').forEach(b=>b.setAttribute('aria-pressed',(b.dataset.plQuer==='1')===!!st.quer));
      const n=Math.max(0,st.blaetter|0), sicht=Math.min(n,12), sp=st.nx?Math.min(st.nx,sicht||1):Math.min(sicht||1,4);
      zahl.setAttribute('aria-label',n===1?'1 Blatt':n+' Blätter');
      zahl.innerHTML=`<span class="pl-mini${st.quer?' quer':''}" style="--sp:${sp}">${'<i></i>'.repeat(sicht)}</span><b>${n}</b>`;
    }
    el.addEventListener('click',e=>{
      const b=e.target.closest('button'); if(!b||!el.contains(b))return;
      if(b.dataset.plPapier)st.papier=b.dataset.plPapier; else if(b.dataset.plQuer)st.quer=b.dataset.plQuer==='1'; else return;
      zeichne(); st.wahl({papier:st.papier,quer:st.quer});
    });
    zeichne();
    return {zeige(n){ Object.assign(st,n); zeichne(); return this; }};
  }

  // ---------- Ausdruck ----------
  // 5-cm-Linie mit Linealsymbol und «100 %»: Strich von x bis x+50 auf Höhe y, Beschriftung darüber
  function kontrolle(x,y,o={}){
    const f=o.farbe||'#1F2933', ty=y-3, z=(a,t,dx)=>`<text x="${x+dx}" y="${ty}" text-anchor="${a}" font-family="Nunito,system-ui,sans-serif" font-size="2.8" font-weight="700" fill="${f}">${t}</text>`;
    let lineal=`<rect x="${x}" y="${ty-2.4}" width="8" height="2.6" rx=".3" fill="none" stroke="${f}" stroke-width=".25"/><path d="M${x+2},${ty-2.4}v1.1M${x+4},${ty-2.4}v1.6M${x+6},${ty-2.4}v1.1" fill="none" stroke="${f}" stroke-width=".25"/>`;
    return `<path d="M${x},${y-2}v4M${x},${y}h50M${x+50},${y-2}v4" fill="none" stroke="${f}" stroke-width=".5"/>${lineal}${z('middle','5 cm',25)}${z('end','100 %',50)}`;
  }
  const teil=i=>{ let t=''; i++; while(i>0){ i--; t=String.fromCharCode(65+i%26)+t; i=Math.floor(i/26); } return t; };   // A … Z, AA …
  function teilMarke(x,y,i,o={}){   // gleiche Marke in Vorschau und Ausdruck
    const r=o.r||3.2, f=o.farbe||'#1F2933', X=+x.toFixed(2), Y=+y.toFixed(2);
    return `<g class="pl-teil"><circle cx="${X}" cy="${Y}" r="${r}" fill="#fff" stroke="${f}" stroke-width=".35"/><text x="${X}" y="${(Y+r*.42).toFixed(2)}" text-anchor="middle" font-family="Nunito,system-ui,sans-serif" font-size="${(r*1.2).toFixed(2)}" font-weight="800" fill="${f}">${teil(i)}</text></g>`;
  }
  // Kleine Blattübersicht. svgs: Blätter als SVG-Text. Ids werden pro Blatt eindeutig, damit clipPath nicht mit #druck zusammenstösst.
  function blaetter(ziel,svgs,o={}){
    const el=finde(ziel); if(!el)return;
    el.classList.add('pl-blaetter');
    if(svgs.length<(o.ab||2)){ el.hidden=true; el.innerHTML=''; return; }
    el.hidden=false; el.style.setProperty('--sp',o.spalten||Math.min(svgs.length,3));
    el.innerHTML=svgs.map((s,i)=>{ const v='pv'+i+'-';
      return `<figure class="pl-blatt">${s.replace(/\bid="([^"]+)"/g,`id="${v}$1"`).replace(/url\(#([^)]+)\)/g,`url(#${v}$1)`).replace(/href="#([^"]+)"/g,`href="#${v}$1"`)}<figcaption>${i+1}</figcaption></figure>`; }).join('');
  }

  // ---------- Zu gross ----------
  const WAHL={a3:['A3','<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="3" width="11" height="18" rx="2"/></svg>'],
    drehen:['Drehen','<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.5-5.8"/><path d="M20 3v5h-5"/></svg>'],
    poster:['Poster','<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18M3 12h18"/></svg>']};
  // zuGross(ziel,{wahl:['a3','drehen','poster'],tue(art)}) zeigt die Warnung, zuGross(ziel,null) nimmt sie weg
  function zuGross(ziel,o){
    const el=finde(ziel); if(!el)return;
    el.classList.add('pl-gross');
    if(!o){ el.hidden=true; el.innerHTML=''; el.onclick=null; return; }
    el.hidden=false;
    el.innerHTML=`<span>⚠ Zu gross</span>`+(o.wahl||[]).map(a=>`<button type="button" data-pl-wahl="${a}">${WAHL[a][1]}${WAHL[a][0]}</button>`).join('');
    el.onclick=e=>{ const b=e.target.closest('[data-pl-wahl]'); if(b&&o.tue)o.tue(b.dataset.plWahl); };
  }

  // ---------- Hervorheben ----------
  function leuchte(ziel){
    const el=finde(ziel); if(!el)return;
    el.classList.remove('pl-leucht'); void el.getBoundingClientRect(); el.classList.add('pl-leucht');
    clearTimeout(el.plLeucht); el.plLeucht=setTimeout(()=>el.classList.remove('pl-leucht'),800);
  }

  window.Planer={PAPIERE,verlauf,merke,zurueck,speicher,seite,druckkopf,kontrolle,teil,teilMarke,blaetter,zuGross,leuchte};
})();
