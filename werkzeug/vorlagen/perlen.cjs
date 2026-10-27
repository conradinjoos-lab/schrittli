/* Gespeicherte Perlentiere aus der vorhandenen Figurensammlung erstellen.
 * Aufruf: node werkzeug/vorlagen/perlen.cjs [id ...]
 * Benötigt @napi-rs/canvas (im Codex-Laufzeitpaket vorhanden).
 * Verwendet die freigestellten Farbflächen und denselben Umwandler wie
 * vorlagen/perlentier-bild, damit die Formen zusammenhängend fädelbar sind.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {createCanvas} = require('@napi-rs/canvas');
const root = path.resolve(__dirname, '../..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const liste = JSON.parse(read('werkzeug/vorlagen/figuren.json'));
// Die beiden häufig gewünschten Figuren als klare Frontansicht: Bei schrägen
// Vorlagen verzerrt das Zentrieren sonst Gesicht und Ohren zu stark.
const korrekturen = JSON.parse(read('werkzeug/vorlagen/perlen-korrekturen.json'));
const index = {window: {}};
vm.runInNewContext(read('vorlagen/figuren/index.js'), index);
const formen = new Map();
for (const datei of new Set(index.window.FIGUREN_INDEX.map(f => f.datei))) {
  vm.runInNewContext(read('vorlagen/figuren/' + datei), {
    FIGUREN_DAZU: (_, figuren) => figuren.forEach(f => formen.set(f.id, f)),
  });
}
// Den vorhandenen Umwandler unverändert ausführen, ohne seine Browser-Oberfläche.
const html = read('vorlagen/perlentier-bild/index.html');
const start = html.indexOf('const FARBE=');
const ende = html.indexOf('// ---------- Darstellung');
if (start < 0 || ende < start) throw new Error('Bild-Umwandler nicht gefunden');
const ctx = vm.createContext({document: {
  createElement: () => createCanvas(1, 1),
  getElementById: () => ({textContent: ''}),
}, zeichnen() {}});
vm.runInContext(html.slice(start, ende), ctx);

function bild(f) {
  const rand = 8, sk = 384 / Math.max(f.w, f.h);
  const canvas = createCanvas(Math.ceil(f.w * sk) + 2 * rand, Math.ceil(f.h * sk) + 2 * rand);
  const c = canvas.getContext('2d');
  const flaeche = (ringe, farbe) => {
    c.beginPath();
    for (const ring of ringe) {
      ring.forEach(([x, y], i) => c[i ? 'lineTo' : 'moveTo'](rand + x * sk, rand + y * sk));
      c.closePath();
    }
    c.fillStyle = farbe; c.fill('evenodd');
  };
  flaeche(f.d, '#ffffff');
  for (const farbe of f.farben) flaeche(farbe.d, farbe.f);
  return canvas;
}

const nur = new Set(process.argv.slice(2));
const ziel = path.join(root, 'vorlagen/perlen/figuren.js');
const alt = {window: {}};
if (nur.size && fs.existsSync(ziel)) vm.runInNewContext(fs.readFileSync(ziel, 'utf8'), alt);
const muster = new Map((alt.window.PERLEN_FIGUREN || []).map(f => [f.quelle, f]));
let anzahl = 0;
for (const eintrag of liste.figuren) {
  if (nur.size && !nur.has(eintrag.id)) continue;
  const f = formen.get(eintrag.id);
  if (!f) throw new Error('Figur fehlt: ' + eintrag.id);
  ctx.bild = bild(f);
  const ergebnis = vm.runInContext(`
    S.bild=bild;S.vor=null;S.hg=false;S.farben=8;S.notiz=null;
    S.vor=vorbereiten();
    S.reihen=Math.max(8,Math.min(24,Math.round(36*(S.vor.y1-S.vor.y0+1)*Q/(S.vor.x1-S.vor.x0+1))));
    berechnen();
    var geschlossen=false;
    if(!S.t){
      // Stark ausgesparte Silhouetten besitzen keinen Mittelstamm. Für diese
      // Motive durchgehende Reihen bilden und Lücken mit der Nachbarfarbe füllen.
      var V=S.vor,ch=(V.y1-V.y0+1)/S.reihen,cw=ch*Q;
      var G=raster(V,V.pal,gewichte(V.pal),V.x0,V.y0,cw,ch,Math.ceil((V.x1-V.x0+1)/cw),S.reihen);
      reduzieren(G,S.farben);
      var rows=[];
      for(var y=0;y<G.H;y++){
        var row=Array.from({length:G.W},(_,x)=>G.anteil[y*G.W+x]>=.25?G.farbe[y*G.W+x]:-1);
        var l=row.findIndex(c=>c>=0),r=row.length-1-[...row].reverse().findIndex(c=>c>=0);
        if(l<0)continue;
        for(var x=l;x<=r;x++)if(row[x]<0){
          for(var dist=1;dist<row.length;dist++){
            if(x-dist>=l&&row[x-dist]>=0){row[x]=row[x-dist];break}
            if(x+dist<=r&&row[x+dist]>=0){row[x]=row[x+dist];break}
          }
        }
        rows.push(row.slice(l,r+1).map(c=>KEY[c]).join(''));
      }
      S.t={rows,beine:[]};geschlossen=true;
    }
    JSON.stringify({t:S.t,notiz:S.notiz,geschlossen});
  `, ctx);
  let {t, notiz,geschlossen} = JSON.parse(ergebnis);
  const korrektur=korrekturen[eintrag.id];
  if(korrektur){
    t={rows:korrektur.rows.map(r=>{const n=Math.round(r.length*korrektur.faktor);return Array.from({length:n},(_,i)=>r[Math.min(r.length-1,Math.floor((i+.5)*r.length/n))]).join('')}),beine:korrektur.beine};
    notiz={weg:0};geschlossen=false;
  }
  if (!t || !t.rows.length || t.rows.some(r => !r.length)) throw new Error('Kein Muster: ' + eintrag.id);
  const n = t.rows.reduce((s,r) => s+r.length, 0) + t.beine.reduce((s,b) => s+2*(b.n+b.f), 0);
  muster.set(eintrag.id, {id:'figur-'+eintrag.id, quelle:eintrag.id, name:eintrag.name,
    gruppe:eintrag.welt, stufe:n>350||t.beine.length>2?'schwer':'mittel',
    ...t, weg:notiz?.weg||0,...(geschlossen?{geschlossen:true}:{})});
  if (++anzahl % 25 === 0) console.log(anzahl + ' Figuren gerechnet');
}
const alle = liste.figuren.map(f => muster.get(f.id)).filter(Boolean);
fs.writeFileSync(ziel, '// Erzeugt mit werkzeug/vorlagen/perlen.cjs.\nwindow.PERLEN_FIGUREN=' + JSON.stringify(alle) + ';\n');
console.log(alle.length + ' gespeicherte Perlenmuster -> vorlagen/perlen/figuren.js');
