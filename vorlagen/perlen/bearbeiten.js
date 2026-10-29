/* Gemeinsamer Editor für fertige Perlentiere und eigene Bilder. */
(() => {
  'use strict';
  const kopie=t=>JSON.parse(JSON.stringify(t));
  // Klassenregel: höchstens so viele Perlen pro Reihe. Die Höchstbreite der Klasse gilt als «schwer».
  const GRENZEN=Object.freeze({2:8,3:12,4:12,5:14,6:15});
  const klasse=k=>Object.hasOwn(GRENZEN,k)?Number(k):4;
  const maximum=k=>GRENZEN[klasse(k)];
  const reihenbreite=t=>t.gridWidth||Math.max(...t.rows.map(r=>r.length));
  function klasseLesen(){
    const q=new URLSearchParams(location.search).get('klasse');
    if(Object.hasOwn(GRENZEN,q))return Number(q);
    try{
      if(localStorage.getItem('schrittli.app')==='schule'){
        const k=JSON.parse(localStorage.getItem('schrittli.schule.v1'))?.settings?.klasse;
        if(Object.hasOwn(GRENZEN,k))return Number(k);
      }
      return klasse(localStorage.getItem('schrittli.perlen.klasse'));
    }catch(e){return klasse()}
  }
  // Breite = Perlen in der breitesten Reihe, unabhängig von der Perlengrösse.
  const schwierigkeit=(t,k)=>reihenbreite(t)>=maximum(k)?'schwer':t.grundstufe||t.stufe||'mittel';
  const LAGEN=Object.freeze(['seiten','links','rechts','oben','unten']);
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function gueltig(t,palette){
    return !!t&&Array.isArray(t.rows)&&t.rows.length>0&&t.rows.length<=100&&
      t.rows.every(r=>typeof r==='string'&&r.length>0&&r.length<=100&&[...r].every(c=>palette[c]))&&
      (!t.offsets||Array.isArray(t.offsets)&&Number.isInteger(t.gridWidth)&&t.gridWidth>0&&t.gridWidth<=100&&t.offsets.length===t.rows.length&&t.offsets.every((x,i)=>Number.isInteger(x)&&x>=0&&x+t.rows[i].length<=t.gridWidth)&&!t.beine?.length)&&
      (!t.beine||Array.isArray(t.beine)&&t.beine.length<=20&&t.beine.every(b=>
        Number.isInteger(b.r)&&b.r>0&&b.r<=t.rows.length&&Number.isInteger(b.n)&&b.n>=0&&b.n<=20&&
        Number.isInteger(b.f)&&b.f>0&&b.f<=20&&Number.isFinite(b.a)&&Math.abs(b.a)<=90&&palette[b.c]&&palette[b.fc]))&&
      // Angenähte Teile: eigene kleine Muster ohne Versatz, seitlich (2 × gespiegelt), links, rechts, oben oder unten
      (!t.teile||Array.isArray(t.teile)&&t.teile.length<=6&&!t.offsets&&t.teile.every(p=>
        !!p&&typeof p.w==='string'&&p.w.length>0&&p.w.length<=40&&LAGEN.includes(p.lage)&&p.n===(p.lage==='seiten'?2:1)&&
        Number.isInteger(p.an)&&p.an>0&&p.an<=t.rows.length&&!p.teile&&!p.offsets&&gueltig(p,palette)));
  }
  function breite(t,max){
    const aus=kopie(t),vor=t.gridWidth||Math.max(...t.rows.map(r=>r.length));
    max=Math.max(1,Math.min(100,Math.round(max)));
    if(t.offsets){
      aus.gridWidth=max;aus.offsets=[];
      aus.rows=t.rows.map((r,i)=>{const l=Math.min(max-1,Math.round(t.offsets[i]*max/vor)),rechts=Math.max(l+1,Math.round((t.offsets[i]+r.length)*max/vor));aus.offsets.push(l);return Array.from({length:rechts-l},(_,j)=>r[Math.max(0,Math.min(r.length-1,Math.floor((l+j+.5)*vor/max-t.offsets[i])))]).join('')});
      return aus;
    }
    aus.rows=t.rows.map(r=>{const n=Math.max(1,Math.round(r.length*max/vor));return Array.from({length:n},(_,j)=>r[Math.min(r.length-1,Math.floor((j+.5)*r.length/n))]).join('')});
    return aus;
  }
  function tauschen(t,von,nach){
    const aus=kopie(t);
    for(const s of [aus,...(aus.teile||[])]){   // auch in den angenähten Teilen
      s.rows=s.rows.map(r=>r.split(von).join(nach));
      for(const b of s.beine||[]){if(b.c===von)b.c=nach;if(b.fc===von)b.fc=nach}
    }
    return aus;
  }
  const stil=`
  .pe-dialog{position:fixed;inset:0;width:100%;max-width:none;height:100%;max-height:none;margin:0;padding:0;border:0;background:var(--bg,#eef3f8);color:var(--ink,#17212f);font:600 16px/1.4 Nunito,system-ui,sans-serif}
  .pe-dialog::backdrop{background:#17212f}
  .pe-rahmen{height:100%;height:100dvh;display:flex;flex-direction:column}
  .pe-kopf{display:flex;align-items:center;flex-wrap:wrap;gap:8px;padding:10px 16px;padding-top:max(10px,env(safe-area-inset-top));border-bottom:1px solid var(--line,#d5dee9);background:var(--surface,#fff)}
  .pe-kopf strong{flex:1;min-width:120px;font-size:20px}
  .pe-dialog button,.pe-dialog select{font:inherit;color:inherit;min-height:44px;border:2px solid var(--line,#d5dee9);border-radius:10px;background:var(--surface,#fff);padding:7px 12px;cursor:pointer}
  .pe-dialog button:focus-visible,.pe-dialog input:focus-visible,.pe-dialog select:focus-visible{outline:3px solid var(--acc,#17997a);outline-offset:2px}
  .pe-dialog button:disabled{opacity:.4;cursor:default}
  .pe-dialog .pe-haupt{background:var(--acc,#17997a);border-color:var(--acc,#17997a);color:var(--acc-ink,#fff)}
  .pe-inhalt{display:grid;grid-template-columns:minmax(0,1fr) 290px;flex:1;min-height:0}
  .pe-bild{overflow:auto;overscroll-behavior:contain;padding:16px;background:var(--surface2,#edf1f5);touch-action:pan-x pan-y pinch-zoom}
  .pe-bild svg{display:block;max-width:none;height:auto;margin:auto;background:#fff;border-radius:12px;user-select:none}
  .pe-bild[data-malen=true] svg{touch-action:none;cursor:crosshair}
  .pe-regler{overflow:auto;padding:14px;background:var(--surface,#fff);border:0;border-left:1px solid var(--line,#d5dee9);margin:0;min-width:0}
  .pe-regler label{display:block;margin:0 0 6px}
  .pe-regler input[type=range]{width:100%;accent-color:var(--acc,#17997a);min-height:44px}
  .pe-regler select{width:100%;margin-bottom:8px}
  .pe-regler p{font-size:13px;color:var(--muted,#5b6b80);margin:6px 0 14px}
  .pe-regler h3{font-size:16px;margin:18px 0 8px}
  .pe-farben{display:flex;flex-wrap:wrap;gap:6px}
  .pe-farben button{width:44px;height:44px;padding:0;border:2px solid #718096}
  .pe-farben button[aria-pressed=true]{outline:3px solid var(--acc,#17997a);outline-offset:2px;border-color:#fff}
  .pe-farben button[data-farbe=t]{border-style:dashed;background:repeating-linear-gradient(135deg,#fff 0 6px,#e4eaf0 6px 8px)!important}
  .pe-aktionen{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}
  .pe-status{margin:0;padding:6px 16px;font-size:14px;background:var(--surface,#fff)}
  .pe-dialog[data-gesperrt=true] .pe-inhalt{grid-template-columns:minmax(0,1fr)}
  .pe-dialog [hidden]{display:none!important}
  @media(max-width:700px){.pe-inhalt{grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(180px,1fr) auto}.pe-regler{max-height:38dvh;border-left:0;border-top:1px solid var(--line,#d5dee9)}.pe-kopf{padding:8px}.pe-kopf strong{font-size:17px}.pe-dialog[data-gesperrt=true] .pe-inhalt{grid-template-rows:1fr}}
  @media print{.pe-dialog{display:none!important}}
  `;
  let aktiv=null;
  function oeffnen(a){
    if(aktiv||!gueltig(a.muster,a.palette))return;
    if(!document.getElementById('perlen-editor-stil')){const s=document.createElement('style');s.id='perlen-editor-stil';s.textContent=stil;document.head.append(s)}
    const schulklasse=klasse(a.klasse??klasseLesen()),grenze=maximum(schulklasse);
    let t=kopie(a.muster),gesperrt=false,pinsel=null,zoom=100,geo=null,refs=[],malen=false,breitBasis=null;
    let behalten=true,seitenverhaeltnis=1;const verlauf=[],original=kopie(a.original||t),vorFokus=document.activeElement,warVollbild=!!document.fullscreenElement;
    const breiter=reihenbreite(original)>grenze,limit=Math.max(grenze,reihenbreite(original),reihenbreite(t));
    const grenzText=breiter?`${schulklasse}. Klasse: empfohlen sind höchstens ${grenze} Perlen pro Reihe. Dieses Muster ist breiter – du kannst es nur schmaler machen.`:`${schulklasse}. Klasse: höchstens ${grenze} Perlen pro Reihe (${grenze} = schwer).`;
    const d=document.createElement('dialog');d.className='pe-dialog';d.setAttribute('aria-labelledby','pe-titel');aktiv=d;
    const farben=Object.entries(a.palette),optionen=farben.map(([k,[,n]])=>`<option value="${k}">${esc(n)}</option>`).join('');
    d.innerHTML=`<div class="pe-rahmen"><div class="pe-kopf"><strong id="pe-titel">${esc(t.name||'Mein Perlentier')}</strong><button type="button" data-tun="kleiner" aria-label="Ansicht verkleinern">−</button><button type="button" data-tun="groesser" aria-label="Ansicht vergrössern">+</button><button type="button" class="pe-haupt" data-tun="sperren">Sperren</button><button type="button" data-tun="fertig">Fertig</button></div>
      <div class="pe-inhalt"><div class="pe-bild" tabindex="0" aria-label="Perlenmuster"></div><fieldset class="pe-regler"><legend hidden>Perlentier anpassen</legend>
      <label for="pe-breite">Perlen pro Reihe: <output id="pe-mass"></output></label><input id="pe-breite" type="range" min="1" max="${limit}" step="1" aria-describedby="pe-grenze"><p id="pe-grenze">${grenzText} Die Höhe bleibt gleich.${t.offsets?' Gestrichelte Perlen sind transparent und werden mitgefädelt.':''}</p>
      <h3>Einzelne Perlen färben</h3><p id="pe-pinsel">Farbe wählen, dann Perlen antippen.</p><div class="pe-farben">${farben.map(([k,[f,n]])=>`<button type="button" data-farbe="${k}" style="background:${f}" aria-label="${esc(n)}" title="${esc(n)}" aria-pressed="false"></button>`).join('')}</div>
      <h3>Eine Farbe überall tauschen</h3><label for="pe-von">Diese Farbe</label><select id="pe-von"></select><label for="pe-nach">wird zu</label><select id="pe-nach">${optionen}</select><button type="button" data-tun="tauschen">Alle Perlen tauschen</button>
      <div class="pe-aktionen"><button type="button" data-tun="zurueck">Rückgängig</button><button type="button" data-tun="original">Original</button></div></fieldset></div>
      <p class="pe-status" role="status" aria-live="polite"></p></div>`;
    document.body.append(d);d.showModal();
    const el=s=>d.querySelector(s),bild=el('.pe-bild'),regler=el('.pe-regler'),status=el('.pe-status'),slider=el('#pe-breite');
    function passend(){const svg=bild.querySelector('svg');if(svg)svg.style.width=Math.max(100,Math.min(bild.clientWidth-32,(bild.clientHeight-32)*seitenverhaeltnis))*zoom/100+'px'}
    const beobachter=new ResizeObserver(passend);beobachter.observe(bild);
    function sichern(){behalten=a.speichern(kopie(t))!==false;status.textContent=gesperrt?'Gesperrt · Du kannst das Muster anschauen und vergrössern.':behalten?(a.lokal===false?'Deine Änderungen sind in der Vorschau übernommen.':'Deine Änderungen sind auf diesem Gerät gespeichert.'):'Deine Änderungen gelten für diese Sitzung; der Gerätespeicher ist nicht verfügbar.'}
    function merken(){verlauf.push(kopie(t));if(verlauf.length>30)verlauf.shift()}
    function zeichnen(){
      geo=a.geometrie(t,a.perle.l/a.perle.d,1);refs=[];
      t.rows.forEach((r,i)=>[...r].forEach((_,j)=>refs.push(['r',i,j])));
      (t.beine||[]).forEach((b,i)=>{for(let seite=0;seite<2;seite++){for(let k=0;k<b.n;k++)refs.push(['b',i,'c']);for(let k=0;k<b.f;k++)refs.push(['b',i,'fc'])}});
      const x=geo.x0-3,y=geo.y0-3,w=geo.x1-x+7,h=geo.y1-y+2,q=geo.q;
      seitenverhaeltnis=w/h;
      const text=(px,py,s)=>`<text x="${px}" y="${py}" font-size=".55" fill="#344054" font-family="Arial,sans-serif">${s}</text>`;
      const reihen=t.rows.map((r,i)=>{const b=(t.beine||[]).find(b=>b.r===i+1);return text(x+.3,geo.ry[i]+.2,i+1)+text(geo.x1+.5,geo.ry[i]+.2,r.length+(b?` + ${esc(b.w||'Teile')} ${b.n}+${b.f}`:''))}).join('');
      const perlen=geo.P.map(p=>`<rect x="${-q*.47}" y="-.47" width="${q*.94}" height=".94" rx="${q*.28}" transform="translate(${p.x} ${p.y}) rotate(${p.r||0})" fill="${a.palette[p.c][0]}" stroke="${p.c==='t'?'#9aa9b5':'#293241'}" ${p.c==='t'?'stroke-dasharray=".09 .09"':''} stroke-width=".045"/>`).join('');
      bild.innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" role="img" aria-label="${esc(t.name||'Perlentier')}: ${t.rows.length} Reihen" style="width:${zoom}%">${text(x+.3,y+1,'Reihe')}${text(geo.x1+.5,y+1,'Perlen')}${text(((geo.links?.[0]||0)+(geo.rechts?.[0]||0))/2-.6,y+1.6,'Start')}${perlen}${a.draehte(t,geo,1,0,0)}${reihen}</svg>`;
      passend();
      const g=a.geometrie(t,a.perle.l/a.perle.d),cm=(g.x1-g.x0-1+g.q)*a.perle.d;
      el('#pe-mass').textContent=`${reihenbreite(t)} · ${schwierigkeit(t,schulklasse)} · ca. ${cm.toLocaleString('de-CH',{maximumFractionDigits:1}).replace('.',',')} cm`;
      slider.value=reihenbreite(t);
      const {z,n}=a.zaehlen(t),von=el('#pe-von'),alt=von.value;
      von.innerHTML=farben.filter(([k])=>z[k]).map(([k,[,name]])=>`<option value="${k}">${esc(name)} (${z[k]})</option>`).join('');
      if(z[alt])von.value=alt;
      el('[data-tun=zurueck]').disabled=!verlauf.length;
      el('#pe-pinsel').textContent=pinsel?`${a.palette[pinsel][1]} · Perlen antippen. Nochmals auf die Farbe tippen zum Verschieben.`:'Farbe wählen, dann Perlen antippen.';
      d.querySelectorAll('[data-farbe]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.farbe===pinsel));
      bild.dataset.malen=String(!!pinsel&&!gesperrt);
      el('[data-tun=kleiner]').disabled=zoom<=60;el('[data-tun=groesser]').disabled=zoom>=250;
      if(!gesperrt)status.textContent=`${t.rows.length} Reihen · ${n} Perlen · ${behalten?'Änderungen übernommen':'nur für diese Sitzung'}`;
    }
    function faerben(e){
      if(gesperrt||!pinsel)return;
      const svg=bild.querySelector('svg'),pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;
      const m=svg.getScreenCTM();if(!m)return;const p=pt.matrixTransform(m.inverse());
      let k=-1,ab=.32;geo.P.forEach((b,i)=>{const d=(b.x-p.x)**2+(b.y-p.y)**2;if(d<ab){ab=d;k=i}});
      if(k<0)return;const [art,i,j]=refs[k];
      if(art==='r'){const r=t.rows[i];if(r[j]===pinsel)return;t.rows[i]=r.slice(0,j)+pinsel+r.slice(j+1)}
      else{if(t.beine[i][j]===pinsel)return;t.beine[i][j]=pinsel}
      zeichnen();
    }
    bild.addEventListener('pointerdown',e=>{if(gesperrt||!pinsel||e.button!==0)return;e.preventDefault();merken();malen=true;bild.setPointerCapture(e.pointerId);faerben(e)});
    bild.addEventListener('pointermove',e=>{if(malen)faerben(e)});
    const fertigMalen=()=>{if(malen){malen=false;sichern()}};
    bild.addEventListener('pointerup',fertigMalen);bild.addEventListener('pointercancel',fertigMalen);
    slider.addEventListener('input',()=>{if(gesperrt)return;if(!breitBasis){merken();breitBasis=kopie(t)}t=breite(breitBasis,Math.min(limit,+slider.value));zeichnen()});
    slider.addEventListener('change',()=>{if(gesperrt)return;breitBasis=null;sichern()});
    function schliessen(){
      if(gesperrt)return;
      sichern();beobachter.disconnect();d.close();d.remove();aktiv=null;
      if(!warVollbild&&document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});
      vorFokus?.focus();
    }
    d.addEventListener('cancel',e=>{e.preventDefault();schliessen()});
    d.addEventListener('click',e=>{
      const b=e.target.closest('button');if(!b)return;const tun=b.dataset.tun;
      if(tun==='sperren'){
        gesperrt=!gesperrt;malen=false;breitBasis=null;d.dataset.gesperrt=String(gesperrt);regler.disabled=gesperrt;regler.hidden=gesperrt;
        b.textContent=gesperrt?'Entsperren':'Sperren';el('[data-tun=fertig]').hidden=gesperrt;zeichnen();sichern();return;
      }
      if(tun==='kleiner'||tun==='groesser'){zoom=Math.max(60,Math.min(250,zoom+(tun==='kleiner'?-20:20)));zeichnen();return}
      if(gesperrt)return;
      if(b.dataset.farbe){pinsel=pinsel===b.dataset.farbe?null:b.dataset.farbe;zeichnen();return}
      if(tun==='tauschen'){const von=el('#pe-von').value,nach=el('#pe-nach').value;if(von===nach)return;merken();t=tauschen(t,von,nach);zeichnen();sichern()}
      if(tun==='zurueck'&&verlauf.length){t=verlauf.pop();breitBasis=null;zeichnen();sichern()}
      if(tun==='original'){merken();t=kopie(original);breitBasis=null;zeichnen();sichern()}
      if(tun==='fertig')schliessen();
    });
    zeichnen();el('[data-tun=sperren]').focus();
    if(!warVollbild)document.documentElement.requestFullscreen?.().catch(()=>{});
  }
  window.PerlenEditor={oeffnen,gueltig,breite,tauschen,GRENZEN,klasse,klasseLesen,maximum,reihenbreite,schwierigkeit};
})();
