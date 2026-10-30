/* Kleine, bewusst vereinfachte Fädelmotive: höchstens 14 Perlen breit, damit
 * sie mit den Klassengrenzen der Perlentiere gefädelt werden können.
 * Keine Bildabtastung und keine Schattierungsfarben: jede Zeile ist eine
 * zusammenhängende, mittige Reihe. Komplexe Figuren werden als Kopf, Maske,
 * Silhouette oder Erkennungszeichen dargestellt. Breite Teile wie Flügel oder
 * Ohren werden als eigene Teile gefädelt und am Schluss an den Körper genäht.
 * Die Motive stehen in werkzeug/vorlagen/perlen-klein/*.cjs.
 * node werkzeug/vorlagen/perlen-klein.cjs
 */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const katalog=JSON.parse(fs.readFileSync(path.join(root,'werkzeug/vorlagen/figuren.json'),'utf8'));
const motive=new Map();
const zeilen=s=>Array.isArray(s)?s:(s=s.trim())?s.split(/\s+/):[];
function add(ids,rows,art='Symbol',beine=[],teile=[]){for(const id of ids.split(' ')){
  if(motive.has(id))throw Error('Doppelt: '+id);
  motive.set(id,{rows:zeilen(rows),beine:structuredClone(beine),teile:structuredClone(teile),vereinfachung:art});
}}
function farben(rows,map){return zeilen(rows).map(r=>[...r].map(c=>map[c]||c).join(''))}
function ohr(c,n=2,f=1,a=65,fc=c){return {r:1,n,f,a,c,fc,w:'Ohren'}}
// Ein Teil, das separat gefädelt und angenäht wird: lage seiten (2 Stück, gespiegelt), links, rechts, oben, unten; an = Reihe des Körpers.
function teil(w,n,lage,an,rows,beine=[]){return {w,n,lage,an,rows:zeilen(rows),beine:structuredClone(beine)}}
const fluegel=(rows,an=3,w='Flügel')=>teil(w,2,'seiten',an,rows);
// Runder Kopf: Haar, Augen, Nase, Mund, dazu Hut (ersetzt die zwei obersten Reihen) und Kleid (vier Reihen darunter).
function kopfReihen(c,{haar,nase='s',augen='s',wange=c,hut,kleid,mund='s',unten=[]}={}){
  const h=haar||c;
  let rows=[h.repeat(4),h.repeat(6),h+c.repeat(6)+h,c.repeat(2)+augen+c.repeat(2)+augen+c.repeat(2),wange+c.repeat(2)+nase.repeat(2)+c.repeat(2)+wange,c.repeat(2)+mund.repeat(2)+c.repeat(2),c.repeat(4)];
  if(hut)rows=[...zeilen(hut),...rows.slice(2)];
  rows.push(...zeilen(unten));
  if(kleid)rows.push(kleid.repeat(2),kleid.repeat(6),kleid.repeat(6),kleid.repeat(4));
  return rows;
}
function kopf(ids,c,o={}){add(ids,kopfReihen(c,o),o.art||'Kopf',o.ohren?[ohr(...o.ohren),...(o.extra||[])]:(o.extra||[]),o.teile||[])}
// Pinguin von vorn: schwarz, weisser Bauch, oranger Schnabel und Füsse; Hut ersetzt die zwei obersten Reihen.
function pinguinReihen({hut,bauch='w',gesicht,hals,c='s',unten=[]}={}){
  const f=gesicht||'w';
  let rows=[c.repeat(4),c.repeat(6),c+c+f.repeat(4)+c+c,c+f+'s'+f+f+'s'+f+c,c+c+f+'oo'+f+c+c,hals||c.repeat(8),c+c+bauch.repeat(4)+c+c,c+bauch.repeat(6)+c,c+bauch.repeat(6)+c,c+c+bauch.repeat(4)+c+c,c.repeat(6),...zeilen(unten),'oooo'];
  if(hut)rows=[...zeilen(hut),...rows.slice(2)];
  return rows;
}
const pinguinFluegel=(r=7,c='s')=>({r,n:2,f:1,a:35,c,fc:c,w:'Flügel'});
function pinguin(ids,o={}){add(ids,pinguinReihen(o),o.art||'Figur',[pinguinFluegel(o.hut?7+zeilen(o.hut).length-2:7,o.c||'s'),...(o.extra||[])],o.teile||[])}
function maske(ids,c,augen='w',stirn=c){add(ids,[stirn.repeat(4),stirn.repeat(6),c+c+augen+augen+c+c+augen+augen+c+c,c+c+c+augen+c+c+augen+c+c+c,c.repeat(8),c.repeat(6),c.repeat(4)],'Maske')}
function ninja(id,c){add(id,[c.repeat(4),c.repeat(6),c+'yyyyyyyy'+c,c+'yssyyssy'+c,c.repeat(10),c.repeat(8),c.repeat(6),c.repeat(4)],'Maske')}
// Rundes Gesicht mit frei wählbaren Augen- und Mundreihen (Emojis, Sonnen, Monde).
function gesicht(ids,c,{augen=c+c+'s'+c+c+'s'+c+c,mitte=c.repeat(8),mund=c+'s'+c.repeat(4)+'s'+c,unten=c+c+'ssss'+c+c,oben=[c.repeat(4),c.repeat(6)],ende=[c.repeat(4)],art='Gesicht',beine=[]}={}){
  add(ids,[...oben,augen,mitte,mund,unten,...ende],art,beine);
}
const herz='rrwwrr rrrrrrrr rrrrrrrr rrrrrr rrrr rr';
const stern='yy yyyy yyyyyyyyyyyy yyyyyyyyyy yyyyyyyy yyywwyyy yywwwwyy';
const ei='ww wwww wwwwww wwwwwwww wwwwwwww wwwwwwww wwwwww wwww';
const ball='srrs srrrrs srrrrrrs ssswwsss swwwws swws';
const geist='cccc cccccc cwccwc cwsccswc cccccccc cccccccc ccwwcc cccc';
// Schneidet ein rechteckiges Bild mittig auf die Reihenbreiten einer Form zu (Wappenschild, Kreis).
function form(rows,breiten){
  rows=zeilen(rows);
  if(rows.length!==breiten.length||rows.some(r=>(r.length-breiten[0])%2))throw Error('Ungleiche Vorlage: '+rows.join(' '));
  return rows.map((r,i)=>r.slice((r.length-breiten[i])/2,(r.length+breiten[i])/2));
}
// Bild mit Grund: alle Reihen gleich lang, so sitzt jede Farbe genau dort, wo sie gezeichnet ist.
function kachel(rows){
  rows=zeilen(rows);
  if(new Set(rows.map(r=>r.length)).size>1)throw Error('Ungleiche Reihen: '+rows.join(' '));
  return rows;
}
const schild=rows=>form(rows,[14,14,14,14,14,14,14,12,10,8,4]);
const rund=rows=>form(rows,[6,10,12,14,14,14,14,12,10,6]);
// Färbt jede Perle am Rand der Form: aussen in der Reihe und dort, wo oben oder unten nichts mehr anschliesst.
function rand(rows,c){
  const b=Math.max(...rows.map(r=>r.length));
  const da=(i,x)=>{const r=rows[i];if(!r)return false;const o=(b-r.length)/2;return x>=o&&x<o+r.length};
  return rows.map((r,i)=>[...r].map((f,k)=>{const x=(b-r.length)/2+k;return da(i,x-1)&&da(i,x+1)&&da(i-1,x)&&da(i+1,x)?f:c}).join(''));
}
const H={add,farben,ohr,teil,fluegel,kopf,kopfReihen,pinguin,pinguinReihen,pinguinFluegel,maske,ninja,gesicht,zeilen,form,kachel,schild,rund,rand,herz,stern,ei,ball,geist};
for(const name of ['alt','buchstaben','flaggen','emoji','wetter','tiere','feste','orte','essen','sachen','maennchen','wappen','fussball','fahrzeuge'])require('./perlen-klein/'+name+'.cjs')(H);

const PAL=/^[a-su-zA-X]+$/;   // alle Palettenbuchstaben ausser t (transparent)
const breiteVon=rows=>Math.max(...rows.map(r=>r.length));
const perlenVon=(rows,beine)=>rows.reduce((a,r)=>a+r.length,0)+beine.reduce((a,b)=>a+2*(b.n+b.f),0);
const pruefeReihen=(rows,id)=>{if(!rows.length||rows.length>20||breiteVon(rows)>14||rows.some(r=>!PAL.test(r)))throw Error('Ungeeignete Reihen: '+id)};
const unbekannt=[...motive.keys()].filter(id=>!katalog.figuren.some(f=>f.id===id));
if(unbekannt.length)throw Error('Unbekannte Figuren: '+unbekannt.join(' '));
const LAGEN=['seiten','links','rechts','oben','unten'];
const result=[];
for(const f of katalog.figuren){
  const m=motive.get(f.id);if(!m)continue;
  pruefeReihen(m.rows,f.id);
  let n=perlenVon(m.rows,m.beine);const farbe=new Set(m.rows.join('')+m.beine.map(b=>b.c+b.fc).join(''));
  for(const p of m.teile){
    pruefeReihen(p.rows,f.id+' / '+p.w);
    if(!LAGEN.includes(p.lage)||(p.lage==='seiten'?p.n!==2:p.n!==1)||!(p.an>=1&&p.an<=m.rows.length))throw Error('Ungeeignetes Teil: '+f.id+' / '+p.w);
    n+=p.n*perlenVon(p.rows,p.beine);for(const c of p.rows.join('')+p.beine.map(b=>b.c+b.fc).join(''))farbe.add(c);
  }
  if(n>(m.teile.length?300:200)||farbe.size>7)throw Error(`Zu aufwendig: ${f.id} (${n} Perlen, ${farbe.size} Farben)`);
  const breite=breiteVon(m.rows);
  result.push({id:'klein-'+f.id,quelle:f.id,name:f.name,gruppe:f.welt,version:3,stufe:breite>8||m.beine.length||m.teile.length?'mittel':'leicht',rows:m.rows,beine:m.beine,...(m.teile.length?{teile:m.teile}:{}),vereinfachung:m.vereinfachung});
}
const fehlend=katalog.figuren.filter(f=>!motive.has(f.id)).map(f=>f.id);
fs.writeFileSync(path.join(root,'vorlagen/perlen/figuren.js'),'// Kleine vereinfachte Fädelmotive, höchstens 14 Perlen breit: werkzeug/vorlagen/perlen-klein.cjs\nwindow.PERLEN_FIGUREN='+JSON.stringify(result)+';\n');
console.log(`${result.length} kleine Motive, ${result.filter(t=>t.teile).length} davon mit angenähten Teilen; maximal ${Math.max(...result.map(m=>breiteVon(m.rows)))} Perlen pro Reihe.`);
if(fehlend.length)console.log(`Ohne kleines Motiv: ${fehlend.length} (${fehlend.slice(0,12).join(', ')}${fehlend.length>12?', …':''})`);
