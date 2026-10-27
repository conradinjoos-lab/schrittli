/* Offline-Prüfung aller gespeicherten Perlenmuster und Editor-Transformationen.
 * node werkzeug/perlen-pruefen.cjs
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const nodes=new Map();
function element(){return {value:'',innerHTML:'',textContent:'',hidden:false,dataset:{},classList:{toggle(){}},addEventListener(){},setAttribute(){},scrollIntoView(){}}}
const ctx=vm.createContext({console,URLSearchParams,window:{},location:{search:'',protocol:'http:'},
  localStorage:{getItem(){return null},setItem(){}},history:{replaceState(){}},matchMedia:()=>({matches:false}),
  document:{getElementById(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id)},querySelectorAll(){return []}},
});
vm.runInContext(read('vorlagen/perlen/figuren.js'),ctx);
vm.runInContext(read('vorlagen/perlen/bearbeiten.js'),ctx);
ctx.PerlenEditor=ctx.window.PerlenEditor;
const html=read('vorlagen/perlen/index.html');
for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))if(m[1].trim())vm.runInContext(m[1],ctx);
const manifest=JSON.parse(read('werkzeug/vorlagen/figuren.json'));
const sichtpruefung=JSON.parse(read('werkzeug/vorlagen/perlen-sichtpruefung.json'));
assert.equal(ctx.window.PERLEN_FIGUREN.length,manifest.figuren.length,'Alle Figuren erstellt');
assert.equal(new Set(ctx.window.PERLEN_FIGUREN.map(t=>t.id)).size,manifest.figuren.length,'Keine doppelten Figuren');
for(const f of manifest.figuren){
  assert.ok(ctx.window.PERLEN_FIGUREN.some(t=>t.quelle===f.id),f.id);
  assert.ok(fs.existsSync(path.join(root,'vorlagen/figuren/bilder',f.id+'.webp')),'Vorschaubild: '+f.id);
  assert.ok(fs.existsSync(path.join(root,'vorlagen/perlen/bilder',f.id+'.webp')),'Tatsächliches Perlenmuster: '+f.id);
  assert.ok(fs.existsSync(path.join(root,'vorlagen/perlen/originale',f.id+'.webp')),'Originalvergleich: '+f.id);
  assert.equal(ctx.window.PERLEN_FIGUREN.find(t=>t.quelle===f.id).version,2,'Überarbeitete Fassung: '+f.id);
  const t=ctx.window.PERLEN_FIGUREN.find(t=>t.quelle===f.id);
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(t)).digest('hex'),sichtpruefung.motive.find(m=>m.id===f.id)?.sha256,'Muster seit letzter Sichtprüfung verändert: '+f.id);
}
vm.runInContext(`
  for(const t of TIERE){
    if(!PerlenEditor.gueltig(t,FARBE))throw new Error('Ungültiges Muster: '+t.id);
    const original=JSON.stringify(t);
    for(const pe of Object.values(PERLEN)){
      const g=geometrie(t,pe.l/pe.d,1),n=zaehlen(t).n;
      if(n!==g.P.length)throw new Error('Perlenzahl: '+t.id);
      if(g.P.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||!Number.isFinite(p.r)))throw new Error('Geometrie: '+t.id);
      const svg=blatt(t,pe);
      if(/NaN|undefined|Infinity/.test(svg))throw new Error('Druck: '+t.id);
      if((svg.match(/<svg /g)||[]).length!==(t.offsets?2:1))throw new Error('Druckseiten: '+t.id);
    }
    for(const w of [1,8,24,80,100]){
      const b=PerlenEditor.breite(t,w);
      if(!PerlenEditor.gueltig(b,FARBE)||b.rows.length!==t.rows.length||(b.gridWidth||Math.max(...b.rows.map(r=>r.length)))!==w)throw new Error('Breite: '+t.id);
    }
    for(const c of Object.keys(zaehlen(t).z)){
      const nach=c==='b'?'r':'b',b=PerlenEditor.tauschen(t,c,nach),z=zaehlen(b);
      if(z.z[c]||z.n!==zaehlen(t).n)throw new Error('Farbtausch: '+t.id);
    }
    if(JSON.stringify(t)!==original)throw new Error('Original überschrieben: '+t.id);
    if(t.version===2){
      if(!t.offsets||t.beine.length)throw new Error('Versetztes Figurenmuster fehlt: '+t.id);
      const g=geometrie(t);let p=0;
      t.rows.forEach((row,i)=>{for(let j=0;j<row.length;j++){const bead=g.P[p++],expected=(t.offsets[i]+j-(t.gridWidth-1)/2)*g.q;if(Math.abs(bead.x-expected)>1e-8)throw new Error('Reihe zentriert statt versetzt: '+t.id)}});
      if(speicherKey(t)==='schrittli.perlen.'+t.id)throw new Error('Altes Muster würde neue Fassung überschreiben');
    }
  }
`,ctx);
nodes.get('suche').value='pikachu';vm.runInContext('auswahl()',ctx);
assert.match(nodes.get('tiere').innerHTML,/figur-pikachu/);
assert.match(nodes.get('treffer').textContent,/2 Muster/);
nodes.get('suche').value='gibt-es-nicht-xyz';vm.runInContext('auswahl()',ctx);
assert.match(nodes.get('treffer').textContent,/Kein Muster/);
nodes.get('suche').value='';nodes.get('gruppe').value='Mario & Nintendo';vm.runInContext('auswahl()',ctx);
assert.ok(!nodes.get('tiere').innerHTML.includes('figur-pikachu'));
assert.ok(nodes.get('tiere').innerHTML.includes('figur-mario'));
assert.ok(!ctx.PerlenEditor.gueltig({rows:['invalid'],beine:[]},{a:[]}));
assert.ok(!ctx.PerlenEditor.gueltig({rows:['a'],beine:[{r:9,n:2,f:1,a:0,c:'a',fc:'a'}]},{a:[]}));
assert.ok(!ctx.PerlenEditor.gueltig({rows:['aa'],offsets:[2],gridWidth:3},{a:[]}));
assert.ok(!ctx.PerlenEditor.gueltig({rows:['aa'],offsets:[],gridWidth:3},{a:[]}));
assert.ok(!ctx.PerlenEditor.gueltig({rows:['aa'],offsets:[NaN],gridWidth:3},{a:[]}));
vm.runInContext(`
  const l=TIERE.find(t=>t.id==='figur-tetris-l');
  if(l.offsets[0]!==l.offsets[l.rows.length-1]||l.rows[0].length>=l.rows.at(-1).length)throw new Error('Tetris-L hat seine linke Kante verloren');
  const asym={rows:['rr','bb'],offsets:[0,4],gridWidth:6,beine:[]};
  const resized=PerlenEditor.breite(asym,12);
  if(resized.offsets[1]!==8||resized.rows[0].length!==4)throw new Error('Breite verändert seitliche Versätze falsch');
  for(const id of ['goldener-ring','harry-potter-brille-mit-blitz','roblox-logo-quadrat'])if(!zaehlen(TIERE.find(t=>t.quelle===id)).z.t)throw new Error('Transparente Aussparung fehlt: '+id);
`,ctx);
for(const p of ['vorlagen/perlen/index.html','vorlagen/perlentier-bild/index.html']){
  const source=read(p);
  for(const m of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){
    if(m[2].trim())new vm.Script(m[2],{filename:p});
    const src=/src="([^"]+)"/.exec(m[1]);if(src&&!/^https?:/.test(src[1]))assert.ok(fs.existsSync(path.resolve(root,path.dirname(p),src[1].split('?')[0])),'Skript fehlt: '+src[1]);
  }
}
console.log(vm.runInContext('TIERE.length',ctx)+' Muster geprüft: Palette, Perlenzahl, Drahtgeometrie, Druck in 3 Grössen, Breitenänderung, Farbtausch, Originalschutz, Suche und Themen.');
