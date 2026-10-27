/* Gemeinsames, DOM-freies Modell für Steckraster, Vorschau und Druck. */
((root)=>{
  'use strict';
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const zahl=(n,vor,min,max)=>Number.isFinite(Number(n))&&n!==null&&n!==''?Math.max(min,Math.min(max,Math.round(Number(n)))):vor;
  function grenzen(t,q=2/3){
    const max=Math.max(4,Math.min(100,Math.floor(160*t.gridWidth*q/t.rows.length))),min=Math.min(8,max);
    return {min,max,standard:zahl(t.gridWidth,min,min,max)};
  }
  function raster(t,breite,hintergrund='w',q=2/3){
    const b=grenzen(t,q),w=zahl(breite,b.standard,b.min,b.max),h=Math.max(1,Math.min(160,Math.round(w*t.rows.length/(t.gridWidth*q))));
    // Das Archiv benutzte Rocailles (2:3). Quadratische Steckplatten brauchen
    // entsprechend mehr Reihen, damit die Figur ihre Proportionen behält.
    // Die Standardbreite erhält jede ursprüngliche Spalte und ihre Farben.
    const grid=Array.from({length:h},(_,y)=>Array.from({length:w},(_,x)=>{
      const sy=Math.min(t.rows.length-1,Math.floor((y+.5)*t.rows.length/h));
      const sx=Math.min(t.gridWidth-1,Math.floor((x+.5)*t.gridWidth/w)),i=sx-t.offsets[sy];
      const c=i>=0&&i<t.rows[sy].length?t.rows[sy][i]:null;
      return c&&c!=='t'?c:hintergrund||null;
    }));
    const farben={};let n=0;
    for(const row of grid)for(const c of row)if(c){farben[c]=(farben[c]||0)+1;n++}
    return {id:t.quelle,name:t.name,w,h,grid,farben,n};
  }
  function teile(m){
    const gesehen=new Set();let anzahl=0;
    for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){
      const key=y*m.w+x;if(!m.grid[y][x]||gesehen.has(key))continue;
      anzahl++;const offen=[[x,y]];gesehen.add(key);
      while(offen.length){const [a,b]=offen.pop();for(const [u,v] of [[a-1,b],[a+1,b],[a,b-1],[a,b+1]]){
        const k=v*m.w+u;if(u<0||v<0||u>=m.w||v>=m.h||!m.grid[v][u]||gesehen.has(k))continue;
        gesehen.add(k);offen.push([u,v]);
      }}
    }
    return anzahl;
  }
  function feld(m,palette,{x0=0,y0=0,x1=m.w,y1=m.h,labels=true}={}){
    let s='',w=x1-x0,h=y1-y0;
    // Jede Position ist genau ein Platz auf einer quadratischen Steckplatte.
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
      const c=m.grid[y][x],px=x-x0+.5,py=y-y0+.5;
      if(c)s+=`<circle cx="${px}" cy="${py}" r=".44" fill="${palette[c][0]}" stroke="#596571" stroke-width=".035"/><circle cx="${px}" cy="${py}" r=".105" fill="#fff" opacity=".65"/>`;
      else s+=`<circle cx="${px}" cy="${py}" r=".055" fill="#c4cdd5"/>`;
    }
    for(let x=0;x<=w;x++)if((x+x0)%5===0||x===0||x===w)s+=`<path d="M${x} 0V${h}" stroke="#78848e" stroke-width=".035" fill="none"/>`;
    for(let y=0;y<=h;y++)if((y+y0)%5===0||y===0||y===h)s+=`<path d="M0 ${y}H${w}" stroke="#78848e" stroke-width=".035" fill="none"/>`;
    if(labels){
      const text=(x,y,n,anker)=>`<text x="${x}" y="${y}" text-anchor="${anker}" font-size=".55" font-family="Arial,sans-serif" fill="#344054">${n}</text>`;
      for(let x=x0;x<x1;x++)if(x===x0||(x+1)%5===0)s+=text(x-x0+.5,-.45,x+1,'middle');
      for(let y=y0;y<y1;y++)if(y===y0||(y+1)%5===0)s+=text(-.45,y-y0+.7,y+1,'end');
    }
    return s;
  }
  function svg(m,palette){return `<svg xmlns="http://www.w3.org/2000/svg" width="${(m.w+3)*8}" height="${(m.h+3)*8}" viewBox="-2 -2 ${m.w+3} ${m.h+3}" role="img" aria-label="${esc(m.name)}: ${m.w} Spalten und ${m.h} Reihen"><rect x="-2" y="-2" width="${m.w+3}" height="${m.h+3}" fill="white"/>${feld(m,palette)}</svg>`}
  const seite=(name,unter,inhalt,fuss)=>`<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="297mm" viewBox="0 0 210 297" role="img" aria-label="${esc(name)}" font-family="Arial,sans-serif"><rect width="210" height="297" fill="white"/><text x="12" y="16" font-size="${Math.min(6,300/(name.length+10))}" font-weight="bold" fill="#17212f">${esc(name)}</text><text x="12" y="24" font-size="3" fill="#556575">${esc(unter)}</text>${inhalt}<text x="12" y="287" font-size="2.8" fill="#556575">${esc(fuss)}</text></svg>`;
  function druck(m,palette,abstand=5,originalgroesse=false){
    const mm=Number(abstand)===2.6?2.6:5;
    if(originalgroesse){
      const nx=Math.floor(180/mm),ny=Math.floor(225/mm),seiten=[];
      for(let y=0;y<m.h;y+=ny)for(let x=0;x<m.w;x+=nx){const x1=Math.min(m.w,x+nx),y1=Math.min(m.h,y+ny);seiten.push({x,y,x1,y1})}
      return [...druck(m,palette,mm,false),...seiten.map(({x,y,x1,y1},i)=>seite(m.name,`Steckvorlage ${i+1}/${seiten.length} · Spalten ${x+1}–${x1}, Reihen ${y+1}–${y1} · Abstand ${mm} mm`,
        `<g transform="translate(20 38) scale(${mm})">${feld(m,palette,{x0:x,y0:y,x1,y1})}</g><path d="M20 276h50m-50-1v2m50-2v2" stroke="#17212f" stroke-width=".3"/><text x="20" y="273" font-size="2.5">Kontrolllinie: 5 cm</text>`,
        'Mit 100 % / tatsächlicher Grösse drucken. Perlenabstand auf der Steckplatte prüfen.'))];
    }
    const farben=Object.entries(m.farben).sort((a,b)=>b[1]-a[1]),reihen=Math.ceil(farben.length/3),legendenHoehe=reihen*6+14,feldHoehe=239-legendenHoehe;
    const sk=Math.min(180/(m.w+3),feldHoehe/(m.h+3)),ox=105-m.w*sk/2,oy=35+2*sk;
    let legende=`<text x="12" y="${280-legendenHoehe}" font-size="3.4" font-weight="bold">Farben und Perlenzahl</text>`;
    farben.forEach(([c,n],i)=>{const x=12+i%3*64,y=287-legendenHoehe+Math.floor(i/3)*6;legende+=`<circle cx="${x+2}" cy="${y-1}" r="1.6" fill="${palette[c][0]}" stroke="#596571" stroke-width=".2"/><text x="${x+6}" y="${y}" font-size="2.7">${n} × ${esc(palette[c][1])}</text>`});
    return [seite(m.name,`${m.w} Spalten × ${m.h} Reihen · ${m.n} Perlen · Bügelperlenbild`,
      `<g transform="translate(${ox} ${oy}) scale(${sk})">${feld(m,palette)}</g>`+legende,
      'Zählmuster, verkleinert auf ein Blatt. Jede Kreisposition entspricht einer Perle.')];
  }
  const api={grenzen,raster,teile,feld,svg,druck,esc};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.BuegelModell=api;
})(typeof window==='object'?window:globalThis);
