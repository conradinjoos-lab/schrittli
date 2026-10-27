/* Runde Bügelperlen aus demselben Raster wie die Webseite rendern.
 * Die kleinen Fädelmuster und ihre Vorschaubilder bleiben unverändert.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'../..'),ziel=path.join(root,'vorlagen/buegelperlen/bilder'),out=path.join(root,'output/buegelperlen');
const c={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'vorlagen/buegelperlen/archiv.js'),'utf8'),c);
const A=c.window.BUEGELPERLEN_ARCHIV,M=require('../../vorlagen/buegelperlen/modell.js');
fs.mkdirSync(ziel,{recursive:true});fs.mkdirSync(out,{recursive:true});
async function main(){
  const bilder=[];
  for(const t of A.motive){
    const m=M.raster(t,undefined,'w',A.seitenverhaeltnis),bild=await loadImage(Buffer.from(M.svg(m,A.palette))),canvas=createCanvas(240,240),x=canvas.getContext('2d');
    x.fillStyle='white';x.fillRect(0,0,240,240);const s=Math.min(240/bild.width,240/bild.height);x.drawImage(bild,(240-bild.width*s)/2,(240-bild.height*s)/2,bild.width*s,bild.height*s);
    fs.writeFileSync(path.join(ziel,t.quelle+'.webp'),canvas.toBuffer('image/webp'));bilder.push({t,canvas,m});
  }
  for(let start=0;start<bilder.length;start+=24){
    const sheet=createCanvas(1440,1120),x=sheet.getContext('2d');x.fillStyle='#e5eaf0';x.fillRect(0,0,sheet.width,sheet.height);
    bilder.slice(start,start+24).forEach(({t,canvas,m},i)=>{const dx=i%6*240,dy=Math.floor(i/6)*280;x.drawImage(canvas,dx,dy);x.fillStyle='#17212f';x.font='bold 14px Arial';x.fillText(t.name,dx+8,dy+257,224);x.font='12px Arial';x.fillText(`${m.w} × ${m.h} · ${m.n} Perlen`,dx+8,dy+275)});
    fs.writeFileSync(path.join(out,`sammlung-${String(start/24+1).padStart(2,'0')}.png`),sheet.toBuffer('image/png'));
  }
  for(const id of ['pokeball','mario','pikachu']){const t=A.motive.find(t=>t.quelle===id),m=M.raster(t);for(const [i,s] of M.druck(m,A.palette,5,true).entries()){
    const bild=await loadImage(Buffer.from(s)),canvas=createCanvas(840,1188);canvas.getContext('2d').drawImage(bild,0,0,840,1188);fs.writeFileSync(path.join(out,`${id}-druck-${i+1}.png`),canvas.toBuffer('image/png'));
  }}
  console.log(`${bilder.length} Bügelperlen-Vorschaubilder und 13 Kontaktblätter erzeugt. Druckproben: ${out}`);
}
main().catch(e=>{console.error(e);process.exitCode=1});
