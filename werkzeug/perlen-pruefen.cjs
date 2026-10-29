/* Offline-Prüfung aller gespeicherten Perlenmuster und Editor-Transformationen.
 * node werkzeug/perlen-pruefen.cjs
 * Prüft die eingebauten Perlentiere, die kleinen Fädelmotive (figuren.js, höchstens 14 Perlen breit,
 * teils mit angenähten Teilen) und die grossen Figurenmuster mit versetzten Reihen (figuren-gross.js).
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
function element(){return {value:'',innerHTML:'',textContent:'',hidden:false,dataset:{},on:{},classList:{toggle(){}},addEventListener(t,f){this.on[t]=f},setAttribute(){},scrollIntoView(){}}}
let adresse='';
const ctx=vm.createContext({console,URLSearchParams,window:{},location:{search:'',protocol:'http:'},
  localStorage:{getItem(){return null},setItem(){}},history:{replaceState(a,b,u){adresse=u}},matchMedia:()=>({matches:false}),
  document:{getElementById(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id)},querySelectorAll(){return []}},
});
vm.runInContext(read('vorlagen/perlen/figuren.js'),ctx);
vm.runInContext(read('vorlagen/perlen/figuren-gross.js'),ctx);
vm.runInContext(read('vorlagen/perlen/bearbeiten.js'),ctx);
ctx.PerlenEditor=ctx.window.PerlenEditor;
const html=read('vorlagen/perlen/index.html');
for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))if(m[1].trim())vm.runInContext(m[1],ctx);
assert.ok(!adresse.includes('tier='),'Ohne Auswahl kein Muster in der Adresse, damit Neuladen wieder die Themen zeigt');
const manifest=JSON.parse(read('werkzeug/vorlagen/figuren.json'));
const sichtpruefung=JSON.parse(read('werkzeug/vorlagen/perlen-sichtpruefung.json'));
const korrekturen=JSON.parse(read('werkzeug/vorlagen/perlen-korrekturen.json'));
const klein=ctx.window.PERLEN_FIGUREN,gross=ctx.window.PERLEN_FIGUREN_GROSS;
const alle=vm.runInContext('TIERE',ctx);
assert.equal(new Set(alle.map(t=>t.id)).size,alle.length,'Keine doppelten Kennungen');
// Kleine Motive: eines je Sujet der Bügelperlen-Sammlung, nie breiter als 14 Perlen.
assert.equal(klein.length,manifest.figuren.length,'Für jedes Sujet ein kleines Motiv');
for(const f of manifest.figuren){
  const t=klein.find(t=>t.quelle===f.id);
  assert.ok(t,'Kleines Motiv fehlt: '+f.id);
  assert.equal(t.id,'klein-'+f.id,'Kennung: '+f.id);
  assert.equal(t.version,3,'Fassung des kleinen Motivs: '+f.id);
  assert.ok(!t.offsets&&t.vereinfachung&&!(t.name.endsWith(' (gross)')),'Kleines Motiv ohne Versatz und mit Art: '+f.id);
  assert.ok(ctx.PerlenEditor.reihenbreite(t)<=14,'Breiter als 14 Perlen: '+f.id);
  for(const p of t.teile||[])assert.ok(ctx.PerlenEditor.reihenbreite(p)<=14,'Teil breiter als 14 Perlen: '+f.id);
  assert.ok(fs.existsSync(path.join(root,'vorlagen/figuren/bilder',f.id+'.webp')),'Vorschaubild: '+f.id);
}
assert.ok(klein.every(t=>vm.runInContext('ART',ctx)[t.vereinfachung]),'Jede Vereinfachungsart hat einen Hinweistext');
// Grosse Figurenmuster: Stand der letzten Sichtprüfung, mit Vergleichsbildern.
assert.equal(gross.length,sichtpruefung.motive.length,'Alle gesichteten grossen Figuren vorhanden');
for(const t of gross){
  assert.ok(manifest.figuren.some(f=>f.id===t.quelle),'Sujet unbekannt: '+t.id);
  assert.equal(t.id,'figur-'+t.quelle,'Kennung: '+t.id);
  assert.ok(fs.existsSync(path.join(root,'vorlagen/perlen/bilder',t.quelle+'.webp')),'Tatsächliches Perlenmuster: '+t.quelle);
  assert.ok(fs.existsSync(path.join(root,'vorlagen/perlen/originale',t.quelle+'.webp')),'Originalvergleich: '+t.quelle);
  assert.equal(t.version,korrekturen[t.quelle]?.version||2,'Überarbeitete Fassung: '+t.quelle);
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(t)).digest('hex'),sichtpruefung.motive.find(m=>m.id===t.quelle)?.sha256,'Muster seit letzter Sichtprüfung verändert: '+t.quelle);
}
vm.runInContext(`
  for(const t of TIERE){
    if(!PerlenEditor.gueltig(t,FARBE))throw new Error('Ungültiges Muster: '+t.id);
    const original=JSON.stringify(t);
    const teile=t.teile||[],mitTeilen=teile.length>0;
    for(const pe of Object.values(PERLEN)){
      const g=geometrie(t,pe.l/pe.d,1),n=zaehlen({...t,teile:[]}).n;
      if(n!==g.P.length)throw new Error('Perlenzahl: '+t.id);
      if(zaehlen(t).n!==n+teile.reduce((s,p)=>s+p.n*geometrie(p).P.length,0))throw new Error('Perlenzahl mit Teilen: '+t.id);
      if(g.P.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||!Number.isFinite(p.r)))throw new Error('Geometrie: '+t.id);
      if(mitTeilen){
        const z=zusammen(t,pe.l/pe.d);
        if(z.P.length!==zaehlen(t).n||z.naehte.length!==teile.reduce((s,p)=>s+p.n,0))throw new Error('Zusammenbau: '+t.id);
        if(z.P.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))throw new Error('Zusammenbau-Geometrie: '+t.id);
        if(!(draht(t,pe)>drahtStueck(t,pe)))throw new Error('Draht ohne Teile: '+t.id);
      }
      const svg=blatt(t,pe);
      if(/NaN|undefined|Infinity/.test(svg))throw new Error('Druck: '+t.id);
      if((svg.match(/<svg /g)||[]).length!==(t.offsets?1:0)+1+(mitTeilen?1:0))throw new Error('Druckseiten: '+t.id);
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
    if(t.offsets){
      if(t.beine.length||mitTeilen)throw new Error('Versetztes Figurenmuster mit Beinen oder Teilen: '+t.id);
      const g=geometrie(t);let p=0;
      t.rows.forEach((row,i)=>{for(let j=0;j<row.length;j++){const bead=g.P[p++],expected=(t.offsets[i]+j-(t.gridWidth-1)/2)*g.q;if(Math.abs(bead.x-expected)>1e-8)throw new Error('Reihe zentriert statt versetzt: '+t.id)}});
    }
    if(t.quelle&&speicherKey(t)==='schrittli.perlen.'+t.id)throw new Error('Altes Muster würde neue Fassung überschreiben: '+t.id);
  }
  const gespeichert=new Set(TIERE.map(speicherKey));
  if(gespeichert.size!==TIERE.length)throw new Error('Speicherschlüssel doppelt');
`,ctx);
// Ohne Suche zuerst nur Themen-Kacheln (keine lange Liste), jede mit höchstens vier Beispielen
nodes.get('suche').value='';vm.runInContext('oeffnen(null)',ctx);
{const h=nodes.get('tiere').innerHTML,themen=(h.match(/class="kat"/g)||[]).length;
  assert.ok(themen>=40&&!h.includes('class="tier"'),'Startansicht zeigt Themen-Kacheln');
  assert.ok(nodes.get('zurueck').hidden);
  assert.match(nodes.get('treffer').textContent,/\d+ Muster in \d+ Themen/);
  for(const k of h.split('class="kat"').slice(1))assert.ok((k.split('</span><b>')[0].match(/<svg|<img/g)||[]).length<=4,'Höchstens vier Beispiele pro Kachel');}
// Sehr breite Suche: Kacheln mit Trefferzahl statt endloser Liste
nodes.get('suche').value='e';vm.runInContext('auswahl()',ctx);
assert.match(nodes.get('tiere').innerHTML,/class="kat"/);assert.match(nodes.get('treffer').textContent,/Treffer in \d+ Themen/);
nodes.get('suche').value='pikachu';vm.runInContext('auswahl()',ctx);
assert.match(nodes.get('tiere').innerHTML,/klein-pikachu/);
assert.match(nodes.get('tiere').innerHTML,/figur-pikachu/);
assert.match(nodes.get('treffer').textContent,/\d Treffer/);
nodes.get('suche').value='gibt-es-nicht-xyz';vm.runInContext('auswahl()',ctx);
assert.match(nodes.get('treffer').textContent,/Kein Muster/);
vm.runInContext("oeffnen('Mario & Nintendo')",ctx);
assert.equal(nodes.get('suche').value,'');assert.ok(!nodes.get('zurueck').hidden);
assert.match(nodes.get('treffer').textContent,/Muster im Thema «Mario & Nintendo»/);
assert.ok(!nodes.get('tiere').innerHTML.includes('pikachu'));
assert.ok(nodes.get('tiere').innerHTML.includes('klein-mario'));
assert.ok(nodes.get('tiere').innerHTML.includes('figur-mario'));
assert.ok(nodes.get('tiere').innerHTML.indexOf('klein-mario')<nodes.get('tiere').innerHTML.indexOf('figur-mario'),'Kleine Motive vor den grossen');
// Klick auf eine Themen-Kachel und auf ein Muster wie im Browser
{const klick=(sel,daten)=>nodes.get('tiere').on.click({target:{closest:s=>s===sel?{dataset:daten}:null}});
  vm.runInContext('oeffnen(null)',ctx);klick('.kat',{g:'Tiere'});
  assert.match(nodes.get('treffer').textContent,/Muster im Thema «Tiere»/);assert.ok(!nodes.get('zurueck').hidden);
  klick('.tier',{id:'klein-mario'});
  assert.match(adresse,/tier=klein-mario/,'Gewähltes Muster steht in der Adresse');
  nodes.get('zurueck').on.click();assert.ok(nodes.get('zurueck').hidden&&nodes.get('tiere').innerHTML.includes('class="kat"'),'Zurück zu allen Themen');}
assert.ok(!ctx.PerlenEditor.gueltig({rows:['invalid'],beine:[]},{a:[]}));
assert.ok(!ctx.PerlenEditor.gueltig({rows:['a'],beine:[{r:9,n:2,f:1,a:0,c:'a',fc:'a'}]},{a:[]}));
assert.ok(!ctx.PerlenEditor.gueltig({rows:['aa'],offsets:[2],gridWidth:3},{a:[]}));
assert.ok(!ctx.PerlenEditor.gueltig({rows:['aa'],offsets:[],gridWidth:3},{a:[]}));
assert.ok(!ctx.PerlenEditor.gueltig({rows:['aa'],offsets:[NaN],gridWidth:3},{a:[]}));
// Teile zum Annähen: Lage, Anzahl und Ansatzreihe müssen stimmen.
const teil=(o={})=>({rows:['aa','aa'],beine:[],teile:[{w:'Flügel',n:2,lage:'seiten',an:1,rows:['aa'],beine:[],...o}]});
assert.ok(ctx.PerlenEditor.gueltig(teil(),{a:[]}));
assert.ok(ctx.PerlenEditor.gueltig(teil({lage:'oben',n:1}),{a:[]}));
assert.ok(!ctx.PerlenEditor.gueltig(teil({lage:'seiten',n:1}),{a:[]}),'Seitenteile kommen doppelt');
assert.ok(!ctx.PerlenEditor.gueltig(teil({lage:'links',n:2}),{a:[]}),'Einseitiges Teil nur einmal');
assert.ok(!ctx.PerlenEditor.gueltig(teil({lage:'hinten'}),{a:[]}),'Unbekannte Lage');
assert.ok(!ctx.PerlenEditor.gueltig(teil({an:3}),{a:[]}),'Ansatzreihe ausserhalb des Körpers');
assert.ok(!ctx.PerlenEditor.gueltig(teil({rows:['ab']}),{a:[]}),'Teil mit fremder Farbe');
assert.ok(!ctx.PerlenEditor.gueltig(teil({w:''}),{a:[]}),'Teil ohne Namen');
assert.ok(!ctx.PerlenEditor.gueltig({rows:['aa'],beine:[],offsets:[0],gridWidth:2,teile:[{w:'x',n:1,lage:'oben',an:1,rows:['a'],beine:[]}]},{a:[]}),'Versetzte Muster ohne Teile');
vm.runInContext(`
  const l=TIERE.find(t=>t.id==='figur-tetris-l');
  if(l.offsets[0]!==l.offsets[l.rows.length-1]||l.rows[0].length>=l.rows.at(-1).length)throw new Error('Tetris-L hat seine linke Kante verloren');
  const asym={rows:['rr','bb'],offsets:[0,4],gridWidth:6,beine:[]};
  const resized=PerlenEditor.breite(asym,12);
  if(resized.offsets[1]!==8||resized.rows[0].length!==4)throw new Error('Breite verändert seitliche Versätze falsch');
  for(const id of ['goldener-ring','harry-potter-brille-mit-blitz','roblox-logo-quadrat'])if(!zaehlen(TIERE.find(t=>t.id==='figur-'+id)).z.t)throw new Error('Transparente Aussparung fehlt: '+id);
  const f=TIERE.find(t=>t.id==='fledermaus-fluegel'),z=zusammen(f);
  if(z.naehte.length!==2||z.naehte[0].reihe!==z.naehte[1].reihe)throw new Error('Fledermaus: zwei Flügel an derselben Reihe');
  const links=z.P.filter(p=>p.x<f.rows[0].length*-1),rechts=z.P.filter(p=>p.x>f.rows[0].length);
  if(!links.length||links.length!==rechts.length)throw new Error('Fledermaus: Flügel nicht spiegelbildlich');
  const getauscht=PerlenEditor.tauschen(f,'s','b');
  if(getauscht.teile[0].rows.some(r=>r.includes('s'))||f.teile[0].rows.some(r=>r.includes('b')))throw new Error('Farbtausch erfasst die Teile nicht oder verändert das Original');
  if(!blatt(f,PERLEN.r3).includes('Blatt 2')||!blatt(f,PERLEN.r3).includes('zusammengen'))throw new Error('Teileblatt fehlt');
`,ctx);
for(const p of ['vorlagen/perlen/index.html','vorlagen/perlentier-bild/index.html']){
  const source=read(p);
  for(const m of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){
    if(m[2].trim())new vm.Script(m[2],{filename:p});
    const src=/src="([^"]+)"/.exec(m[1]);if(src&&!/^https?:/.test(src[1]))assert.ok(fs.existsSync(path.resolve(root,path.dirname(p),src[1].split('?')[0])),'Skript fehlt: '+src[1]);
  }
}
const mitTeilen=klein.filter(t=>t.teile?.length).length;
console.log(`${alle.length} Muster geprüft (${klein.length} kleine Motive, ${mitTeilen} davon mit angenähten Teilen, ${gross.length} grosse Figurenmuster): Palette, Perlenzahl, Drahtgeometrie, Zusammenbau, Druck in 3 Grössen, Breitenänderung, Farbtausch, Originalschutz, Suche und Themen.`);
