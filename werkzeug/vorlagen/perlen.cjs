/* Figuren als flache Reihenmuster. Die Position jeder Zelle bleibt erhalten.
 * Lücken INNERHALB einer Reihe sind ausdrücklich transparente Stützperlen.
 * Keine Zentrierung einzelner Reihen, keine erfundenen symmetrischen Beine.
 * 1. python werkzeug/vorlagen/perlen-quellen.py [id ...] (Abhängigkeiten von bild.py)
 * 2. node werkzeug/vorlagen/perlen.cjs [id ...] (@napi-rs/canvas erforderlich)
 * 3. node werkzeug/vorlagen/perlen-vergleichen.cjs, alle Bildpaare visuell prüfen
 * 4. node werkzeug/perlen-pruefen.cjs (technische Prüfung, keine Fädelprobe)
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const liste=JSON.parse(read('werkzeug/vorlagen/figuren.json'));
const korrekturen=JSON.parse(read('werkzeug/vorlagen/perlen-korrekturen.json'));
const html=read('vorlagen/perlen/index.html'),ctx={};
vm.runInNewContext(html.match(/const FARBE=.*?;/s)[0]+html.match(/FARBE.u=.*?;/s)[0]+[...html.matchAll(/Object.assign\(FARBE,.*?;/sg)].map(m=>m[0]).join('')+';this.palette=FARBE',ctx);
const palette=ctx.palette,keys=Object.keys(palette).filter(k=>k!=='t');
function lab(hex){const rgb=hex.slice(1).match(/../g).map(h=>parseInt(h,16)/255).map(v=>v>.04045?((v+.055)/1.055)**2.4:v/12.92);const [r,g,b]=rgb,f=v=>v>.008856?Math.cbrt(v):7.787*v+16/116;const x=f((r*.4124+g*.3576+b*.1805)/.95047),y=f(r*.2126+g*.7152+b*.0722),z=f((r*.0193+g*.1192+b*.9505)/1.08883);return [116*y-16,500*(x-y),200*(y-z)]}
const labs=keys.map(k=>lab(palette[k][0]));
function naechste(hex){const l=lab(hex);let d=Infinity,best='s';labs.forEach((p,i)=>{const dist=(l[0]-p[0])**2+(l[1]-p[1])**2+(l[2]-p[2])**2;if(dist<d){d=dist;best=keys[i]}});return best}
async function raster(f,opt){
  const quelle=path.join(root,'output/perlen-quellen',f.id+'.png');
  if(!fs.existsSync(quelle))throw new Error('Zuerst python werkzeug/vorlagen/perlen-quellen.py ausführen: '+f.id);
  const img=await loadImage(quelle);
  const H=Math.min(opt.hoehe||Math.min(40,Math.round(64*img.height/img.width*2/3)),Math.floor(98*img.height/img.width*2/3)),W=Math.max(3,Math.round(H*img.width/img.height/(2/3))),S=12;
  if(H>100||W>100)throw new Error('Raster zu gross: '+f.id);
  const canvas=createCanvas(W*S,H*S),c=canvas.getContext('2d');
  c.drawImage(img,0,0,W*S,H*S);
  const pix=c.getImageData(0,0,W*S,H*S).data,cache=new Map(),grid=[];
  for(let y=0;y<H;y++){const row=[];for(let x=0;x<W;x++){
    const count={};let total=0;
    for(let yy=0;yy<S;yy++)for(let xx=0;xx<S;xx++){const p=((y*S+yy)*W*S+x*S+xx)*4;if(pix[p+3]<128)continue;total++;
      const hex='#'+[pix[p],pix[p+1],pix[p+2]].map(v=>opt.kontrast?Math.max(0,Math.min(255,(v-opt.kontrast[0])*opt.kontrast[1])):v).map(v=>Math.min(255,Math.round(v/8)*8).toString(16).padStart(2,'0')).join('');
      if(!cache.has(hex))cache.set(hex,naechste(hex));const key=cache.get(hex);count[key]=(count[key]||0)+1;}
    let key=Object.keys(count).sort((a,b)=>count[b]-count[a])[0]||'t';
    // Dünne dunkle Gesichtslinien erhalten, statt sie morphologisch zu löschen.
    if(((count.s||0)+(count.O||0))/total>=(opt.kontur||.22))key=(count.O||0)>(count.s||0)?'O':'s';
    // Geprüfte kleine Details dürfen nicht von ihrer grossen Hintergrundfarbe verdrängt werden.
    for(const a of opt.akzente||[]){
      if(a.bereich&&(x/(W-1)<a.bereich[0]||y/(H-1)<a.bereich[1]||x/(W-1)>a.bereich[2]||y/(H-1)>a.bereich[3]))continue;
      const n=a.farben.reduce((s,k)=>s+(count[k]||0),0);
      if(n/total>=a.anteil)key=a.farben.slice().sort((a,b)=>(count[b]||0)-(count[a]||0))[0];
    }
    row.push(total/S/S>=.3?key:'t');
  }grid.push(row)}
  // Ähnliche Schattierungen zuerst zusammenlegen; starke Farbakzente erhalten.
  for(;;){const counts={};grid.flat().forEach(k=>{if(k!=='t')counts[k]=(counts[k]||0)+1});const used=Object.keys(counts);if(used.length<=(opt.farbzahl||16))break;
    let best=null,cost=Infinity;
    for(const von of used){if(von==='s'||von==='O'||von==='w')continue;for(const nach of used){if(nach===von)continue;const a=labs[keys.indexOf(von)],b=labs[keys.indexOf(nach)],d=a.reduce((s,v,i)=>s+(v-b[i])**2,0)*counts[von];if(d<cost){cost=d;best=[von,nach]}}}
    for(const row of grid)for(let x=0;x<row.length;x++)if(row[x]===best[0])row[x]=best[1];
  }
  for(const row of grid)for(let x=0;x<row.length;x++)row[x]=opt.tauschen?.[row[x]]||row[x];
  // Bei Bildern mit weissem Hintergrund sind eingeschlossene Löcher sonst
  // ununterscheidbar von weissen Motivflächen. Nur geprüfte Aussparungen öffnen.
  for(const [sx,sy] of opt.loecher||[]){const x=Math.round(sx*(W-1)),y=Math.round(sy*(H-1));if(grid[y][x]!=='w')continue;const todo=[[x,y]];grid[y][x]='t';for(let i=0;i<todo.length;i++){const [a,b]=todo[i];for(const [nx,ny] of [[a-1,b],[a+1,b],[a,b-1],[a,b+1]])if(grid[ny]?.[nx]==='w'){grid[ny][nx]='t';todo.push([nx,ny])}}}
  for(const [ax,ay,bx,by,key] of opt.linien||[]){const x0=Math.round(ax*(W-1)),y0=Math.round(ay*(H-1)),x1=Math.round(bx*(W-1)),y1=Math.round(by*(H-1)),n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0));for(let i=0;i<=n;i++){const x=Math.round(x0+(x1-x0)*i/(n||1)),y=Math.round(y0+(y1-y0)*i/(n||1));if(grid[y][x]!=='t')grid[y][x]=key}}
  for(const [x,y,farbe] of opt.zellen||[]){if(!grid[y]?.[x]||!palette[farbe])throw new Error('Ungültige Korrektur '+f.id);grid[y][x]=farbe}
  while(grid.length&&grid[0].every(c=>c==='t'))grid.shift();while(grid.length&&grid.at(-1).every(c=>c==='t'))grid.pop();
  const bereiche=grid.map(r=>[r.findIndex(c=>c!=='t'),r.findLastIndex(c=>c!=='t')]);
  // Getrennte Teile erhalten einen ausgewiesenen transparenten Anschluss.
  for(let i=0;i<bereiche.length;i++)if(bereiche[i][0]<0){const vor=bereiche.slice(0,i).findLast(b=>b[0]>=0),nach=bereiche.slice(i+1).find(b=>b[0]>=0);const x=Math.round(((vor?vor[0]:nach[0])+(nach?nach[0]:vor[0]))/2);bereiche[i]=[x,x]}
  for(let i=1;i<bereiche.length;i++){const a=bereiche[i-1],b=bereiche[i];if(a[1]<b[0])a[1]=b[0];else if(b[1]<a[0])b[1]=a[0]}
  const xmin=Math.min(...bereiche.map(b=>b[0])),xmax=Math.max(...bereiche.map(b=>b[1]));
  return {rows:grid.map((r,i)=>r.slice(bereiche[i][0],bereiche[i][1]+1).join('')),offsets:bereiche.map(b=>b[0]-xmin),gridWidth:xmax-xmin+1,beine:[]};
}
function vorschaubild(t){
  const q=2/3,canvas=createCanvas(240,240),c=canvas.getContext('2d'),sk=Math.min(222/(t.gridWidth*q),222/t.rows.length),ox=(240-t.gridWidth*q*sk)/2,oy=(240-t.rows.length*sk)/2;
  for(let y=0;y<t.rows.length;y++)for(let j=0;j<t.rows[y].length;j++){const key=t.rows[y][j],x=t.offsets[y]+j;c.fillStyle=palette[key][0];c.strokeStyle=key==='t'?'#b8c3cc':'#26323c';c.lineWidth=key==='t'?.35:Math.max(.3,sk*.035);c.setLineDash(key==='t'?[1,1]:[]);c.beginPath();c.roundRect(ox+(x+.03)*q*sk,oy+(y+.03)*sk,.94*q*sk,.94*sk,.18*sk);c.fill();c.stroke()}
  return canvas.toBuffer('image/webp');
}
const nur=new Set(process.argv.slice(2)),ziel=path.join(root,'vorlagen/perlen/figuren-gross.js'),alt={window:{}};
for(const id of nur)if(!liste.figuren.some(f=>f.id===id))throw new Error('Unbekannte Figur: '+id);
if(nur.size&&fs.existsSync(ziel))vm.runInNewContext(fs.readFileSync(ziel,'utf8'),alt);
const muster=new Map((alt.window.PERLEN_FIGUREN_GROSS||[]).map(t=>[t.quelle,t]));
fs.mkdirSync(path.join(root,'vorlagen/perlen/bilder'),{recursive:true});
async function main(){let anzahl=0;
for(const f of liste.figuren){if(nur.size&&!nur.has(f.id))continue;
  const t={id:'figur-'+f.id,quelle:f.id,name:f.name,gruppe:f.welt,version:korrekturen[f.id]?.version||2,stufe:'schwer',...await raster(f,korrekturen[f.id]||{})};
  if(!t.rows.length)throw new Error('Leeres Muster: '+f.id);
  muster.set(f.id,t);fs.writeFileSync(path.join(root,'vorlagen/perlen/bilder',f.id+'.webp'),vorschaubild(t));
  if(++anzahl%50===0)console.log(anzahl+' Figuren gestaltet');
}
const alle=liste.figuren.map(f=>muster.get(f.id)).filter(Boolean);
fs.writeFileSync(ziel,'// Grosse Figurenmuster, erzeugt mit werkzeug/vorlagen/perlen.cjs. Version 2: versetzte Reihen, transparente Stützperlen.\nwindow.PERLEN_FIGUREN_GROSS='+JSON.stringify(alle)+';\n');
console.log(alle.length+' gespeicherte Perlenmuster mit passenden Vorschaubildern');
}
main().catch(e=>{console.error(e);process.exitCode=1});
