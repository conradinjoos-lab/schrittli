'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),c={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'vorlagen/buegelperlen/archiv.js'),'utf8'),c);
const A=c.window.BUEGELPERLEN_ARCHIV,M=require('../vorlagen/buegelperlen/modell.js');
const hash=a=>crypto.createHash('sha256').update(JSON.stringify(a)).digest('hex');
const vorher=hash(A.motive);
assert.equal(A.motive.length,302);assert.equal(new Set(A.motive.map(t=>t.quelle)).size,302);
assert.equal(vorher,'f1bcb5e9b416303f372fb688f1e83e3fdad3666c34a86956e0055f3039368fbb');assert.equal(A.sha256,vorher);
// Im Standard bleiben sämtliche ursprünglichen Spalten, Farbflächen und Reihen
// erhalten. Nur die Höhe wird auf das quadratische Steckraster umgerechnet.
for(const t of A.motive){
  assert.equal(t.version,2);const m=M.raster(t,undefined,'',A.seitenverhaeltnis);
  assert.equal(m.w,t.gridWidth);assert.equal(m.h,Math.round(t.rows.length*1.5));
  for(let sy=0;sy<t.rows.length;sy++){
    const y=m.grid.findIndex((_,i)=>Math.floor((i+.5)*t.rows.length/m.h)===sy);assert.ok(y>=0);
    for(let x=0;x<m.w;x++){const old=t.rows[sy][x-t.offsets[sy]];assert.equal(m.grid[y][x],old&&old!=='t'?old:null,t.quelle)}
  }
  for(const row of m.grid)for(const col of row)assert.ok(col===null||A.palette[col]);
  assert.equal(m.farben.t,undefined);
  assert.equal(Object.values(m.farben).reduce((a,b)=>a+b,0),m.n);
  for(const hintergrund of ['w','s']){const bild=M.raster(t,undefined,hintergrund);assert.equal(bild.n,bild.w*bild.h);assert.equal(M.teile(bild),1)}
  for(const breite of [8,15,100,Infinity,-1,'abc']){const bild=M.raster(t,breite);assert.ok(bild.w>=M.grenzen(t).min&&bild.w<=M.grenzen(t).max);assert.ok(bild.h>=1&&bild.h<=160)}
  assert.ok(fs.existsSync(path.join(root,'vorlagen/buegelperlen/bilder',t.quelle+'.webp')));
}
assert.equal(hash(A.motive),vorher,'Archiv darf durch Vorschau und Einstellungen nicht verändert werden');
// Jede 1:1-Druckkachel enthält den richtigen Abschnitt ohne Lücken/Überlappung.
const gross=M.raster(A.motive.find(t=>t.quelle==='mario'),100,'');
for(const abstand of [5,2.6]){
  const seiten=M.druck(gross,A.palette,abstand,true),felder=new Set();let perlen=0;
  assert.match(seiten[0],/Farben und Perlenzahl/);assert.ok(seiten.length>2);
  for(const s of seiten.slice(1)){
    const match=s.match(/Spalten (\d+)–(\d+), Reihen (\d+)–(\d+)/);assert.ok(match);
    const [x0,x1,y0,y1]=match.slice(1).map(Number);
    assert.ok((x1-x0+1)*abstand<=180);assert.ok((y1-y0+1)*abstand<=225);
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const key=x+','+y;assert.ok(!felder.has(key));felder.add(key)}
    perlen+=[...s.matchAll(/r="\.44"/g)].length;assert.ok(s.includes(`scale(${abstand})`));assert.match(s,/Kontrolllinie: 5 cm/);
  }
  assert.equal(felder.size,gross.w*gross.h);assert.equal(perlen,gross.n);
}
assert.equal(M.teile({w:3,h:1,grid:[['r',null,'b']]}),2);
assert.equal(M.teile({w:3,h:1,grid:[['r','w','b']]}),1);
assert.equal(M.esc('<&"'), '&lt;&amp;&quot;');
const klein={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'vorlagen/perlen/figuren.js'),'utf8'),klein);
assert.equal(klein.window.PERLEN_FIGUREN.length,302);assert.ok(klein.window.PERLEN_FIGUREN.every(t=>t.version===3));
console.log('302 Originalmuster unverändert erhalten; Steckraster, Farbzählung, Druckkacheln und getrennte kleine Fädelmuster geprüft.');
