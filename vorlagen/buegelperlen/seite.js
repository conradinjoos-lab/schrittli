(()=>{
  'use strict';
  const A=window.BUEGELPERLEN_ARCHIV,M=window.BuegelModell,$=id=>document.getElementById(id),q=A.seitenverhaeltnis;
  const parameter=new URLSearchParams(location.search),normal=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  let motiv=A.motive.find(t=>t.quelle===parameter.get('motiv'))||A.motive.find(t=>t.quelle==='pokeball')||A.motive[0],muster,limit=48;
  for(const gruppe of [...new Set(A.motive.map(t=>t.gruppe))]){const o=document.createElement('option');o.value=o.textContent=gruppe;$('gruppe').append(o)}
  function url(){const u=new URL(location.href);u.searchParams.set('motiv',motiv.quelle);u.searchParams.set('breite',muster.w);u.searchParams.set('hintergrund',$('hintergrund').value);u.searchParams.set('abstand',$('abstand').value);history.replaceState(null,'',u)}
  function katalog(){
    const suche=normal($('suche').value.trim()),gruppe=$('gruppe').value,treffer=A.motive.filter(t=>(!gruppe||t.gruppe===gruppe)&&normal(t.name+' '+t.gruppe).includes(suche));
    $('treffer').textContent=`${treffer.length} von ${A.motive.length} Motiven${treffer.length>limit?` · ${limit} angezeigt`:''}`;
    $('motive').innerHTML=treffer.slice(0,limit).map(t=>`<button class="motiv" type="button" data-motiv="${M.esc(t.quelle)}" aria-pressed="${t===motiv}"><img src="bilder/${M.esc(t.quelle)}.webp" width="120" height="120" loading="lazy" alt=""><span>${M.esc(t.name)}</span></button>`).join('');
    $('mehr').hidden=treffer.length<=limit;
  }
  function druckVorbereiten(){
    const echt=$('druckart').value==='massstab',seiten=M.druck(muster,A.palette,Number($('abstand').value),echt);
    $('druck').innerHTML=seiten.join('');
    $('druckhilfe').textContent=echt?`${seiten.length} Blätter A4: Übersicht mit Farbliste und ${seiten.length-1} ${seiten.length===2?'Steckvorlage':'Steckvorlagen'}. Mit 100 % / tatsächlicher Grösse drucken. Die Kontrolllinie muss 5 cm lang sein; prüfe auch den Abstand auf deiner Steckplatte.`:'Das ganze Zählmuster und die Farbliste passen auf ein A4-Blatt. Die Ansicht wird dafür verkleinert.';
  }
  function zeigen(){
    muster=M.raster(motiv,$('breite').value,$('hintergrund').value,q);$('breite').value=$('breite-regler').value=muster.w;
    $('bild').innerHTML=M.svg(muster,A.palette);
    const mm=Number($('abstand').value),cm=n=>(n*mm/10).toLocaleString('de-CH',{maximumFractionDigits:1});
    $('fakten').textContent=`${muster.w} × ${muster.h} Perlenplätze · ${muster.n.toLocaleString('de-CH')} Perlen · ${Object.keys(muster.farben).length} Farben · ca. ${cm(muster.w)} × ${cm(muster.h)} cm`;
    const teile=M.teile(muster);
    $('verbindung').textContent=$('hintergrund').value?'Der Hintergrund verbindet das Bild zu einer rechteckigen Fläche.':teile>1?`Ohne Hintergrund besteht dieses Muster aus ${teile} getrennten Teilen. Mit Hintergrund bleiben sie im selben Bild verbunden.`:'Ohne Hintergrund bleiben die freien Stellen leer. Prüfe schmale Verbindungen vor dem Bügeln.';
    $('farben').innerHTML=Object.entries(muster.farben).sort((a,b)=>b[1]-a[1]).map(([c,n])=>`<li><span class="farbpunkt" style="background:${A.palette[c][0]}" aria-hidden="true"></span>${n} × ${M.esc(A.palette[c][1])}</li>`).join('');
    druckVorbereiten();url();
  }
  function waehlen(t,breite){
    motiv=t;const b=M.grenzen(t,q);for(const id of ['breite','breite-regler']){$(id).min=b.min;$(id).max=b.max;$(id).value=breite||b.standard}
    $('motiv-titel').textContent=t.name;$('breiten-hilfe').textContent=`${b.min}–${b.max} Perlen breit. Die Höhe passt sich an. Bei kleinen Breiten gehen Details verloren.`;
    $('original').src=`../perlen/originale/${t.quelle}.webp`;$('original').alt=`Ausgangsbild: ${t.name}`;
    zeigen();katalog();
  }
  $('motive').addEventListener('click',e=>{const b=e.target.closest('[data-motiv]');if(!b)return;waehlen(A.motive.find(t=>t.quelle===b.dataset.motiv));$('motiv-titel').focus({preventScroll:true});$('motiv-titel').scrollIntoView({block:'start',behavior:'instant'})});
  $('suche').addEventListener('input',()=>{limit=48;katalog()});$('gruppe').addEventListener('change',()=>{limit=48;katalog()});$('mehr').addEventListener('click',()=>{limit+=48;katalog()});
  $('breite').addEventListener('change',zeigen);$('breite-regler').addEventListener('input',()=>{$('breite').value=$('breite-regler').value;zeigen()});
  $('hintergrund').addEventListener('change',zeigen);$('abstand').addEventListener('change',zeigen);$('druckart').addEventListener('change',druckVorbereiten);
  $('standard').addEventListener('click',()=>waehlen(motiv));
  $('zoom').addEventListener('input',()=>{$('bild').style.width=$('zoom').value+'%';$('zoom-wert').textContent=$('zoom').value+' %'});
  $('drucken').addEventListener('click',()=>{druckVorbereiten();window.print()});window.addEventListener('beforeprint',druckVorbereiten);
  if(['w','s',''].includes(parameter.get('hintergrund')))$('hintergrund').value=parameter.get('hintergrund');
  if(['5','2.6'].includes(parameter.get('abstand')))$('abstand').value=parameter.get('abstand');
  waehlen(motiv,parameter.get('breite'));
})();
