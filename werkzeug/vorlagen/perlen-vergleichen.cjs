/* Original und tatsächlich erzeugtes Perlenmuster nebeneinander rendern.
 * node werkzeug/vorlagen/perlen-vergleichen.cjs
 * Ausgabe nur lokal unter output/perlen-vergleich/; keine Veröffentlichung.
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const nodes=new Map();
const el=()=>({value:'',innerHTML:'',textContent:'',dataset:{},style:{setProperty(){}},classList:{toggle(){},add(){},remove(){}},addEventListener(){},setAttribute(){},querySelector(){return el()},querySelectorAll(){return []},appendChild(){}});
const doc={getElementById(id){if(!nodes.has(id))nodes.set(id,el());return nodes.get(id)},querySelector(s){return doc.getElementById(s.slice(1))},querySelectorAll(){return []},addEventListener(){},createElement:el,head:el(),body:el()};
const ctx=vm.createContext({console,URLSearchParams,setTimeout(){return 0},clearTimeout(){},window:{addEventListener(){}},location:{search:''},history:{replaceState(){}},localStorage:{getItem(){return null},setItem(){},removeItem(){}},matchMedia:()=>({matches:false}),document:doc});
vm.runInContext(read('vorlagen/perlen/figuren.js'),ctx);
vm.runInContext(read('vorlagen/perlen/figuren-gross.js'),ctx);
vm.runInContext(read('vorlagen/perlen/bearbeiten.js'),ctx);ctx.PerlenEditor=ctx.window.PerlenEditor;
vm.runInContext(read('vorlagen/planer.js'),ctx);ctx.Planer=ctx.window.Planer;
for(const m of read('vorlagen/perlen/index.html').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))if(m[1].trim())vm.runInContext(m[1],ctx);
const daten=JSON.parse(vm.runInContext('JSON.stringify(window.PERLEN_FIGUREN_GROSS.map(t=>({t,g:geometrie(t),palette:FARBE})))',ctx));
const meta=JSON.parse(read('werkzeug/vorlagen/figuren.json'));
const out=path.join(root,'output/perlen-vergleich');fs.mkdirSync(out,{recursive:true});
const cellW=440,cellH=250,cols=4,rows=5;
async function main(){
  for(let start=0;start<daten.length;start+=cols*rows){
    const c=createCanvas(cols*cellW,rows*cellH+38),x=c.getContext('2d');x.fillStyle='#e9ecef';x.fillRect(0,0,c.width,c.height);
    x.fillStyle='#14212a';x.font='bold 18px Arial';x.fillText(`Original (links) · Perlenmuster (rechts) · ${start+1}–${Math.min(start+cols*rows,daten.length)}`,12,25);
    for(let i=start;i<Math.min(start+cols*rows,daten.length);i++){
      const {t,g,palette}=daten[i],k=i-start,ox=k%cols*cellW,oy=Math.floor(k/cols)*cellH+38;
      x.fillStyle='white';x.fillRect(ox+3,oy+3,cellW-6,cellH-6);
      x.fillStyle='#14212a';x.font='bold 14px Arial';x.fillText(`${i+1}. ${t.name}`,ox+12,oy+23,cellW-24);
      const entry=meta.figuren.find(f=>f.id===t.quelle);
      const img=await loadImage(path.join(root,'werkzeug/vorlagen/bilder',entry.datei));
      const s=Math.min(195/img.width,190/img.height);
      x.drawImage(img,ox+8+(200-img.width*s)/2,oy+34+(192-img.height*s)/2,img.width*s,img.height*s);
      const sk=Math.min(202/(g.x1-g.x0),190/(g.y1-g.y0)),dx=ox+220+(202-(g.x1-g.x0)*sk)/2-g.x0*sk,dy=oy+34+(192-(g.y1-g.y0)*sk)/2-g.y0*sk;
      for(const p of g.P){x.save();x.translate(dx+p.x*sk,dy+p.y*sk);x.rotate(p.r*Math.PI/180);x.fillStyle=palette[p.c][0];x.strokeStyle=p.c==='t'?'#b8c3cc':'#404a50';x.lineWidth=.05*sk;if(p.c==='t')x.setLineDash([.09*sk,.09*sk]);x.beginPath();x.roundRect(-g.q*sk*.47,-sk*.47,g.q*sk*.94,sk*.94,.2*sk);x.fill();x.stroke();x.restore()}
      x.fillStyle='#63717b';x.font='11px Arial';x.fillText(t.quelle,ox+12,oy+240,cellW-24);
    }
    const name=`vergleich-${String(start/(cols*rows)+1).padStart(2,'0')}.png`;
    fs.writeFileSync(path.join(out,name),c.toBuffer('image/png'));
  }
  fs.writeFileSync(path.join(out,'index.json'),JSON.stringify(daten.map(({t},i)=>({nr:i+1,id:t.quelle,name:t.name})),null,2));
  for(const id of ['mario','darth-vader-helm']){
    const svgs=vm.runInContext(`blatt(TIERE.find(t=>t.quelle===${JSON.stringify(id)}),PERLEN.r3)`,ctx).match(/<svg\b[\s\S]*?<\/svg>/g);
    for(let i=0;i<svgs.length;i++){fs.writeFileSync(path.join(out,`${id}-druck-${i+1}.svg`),svgs[i]);const img=await loadImage(Buffer.from(svgs[i])),c=createCanvas(840,1188);c.getContext('2d').drawImage(img,0,0,840,1188);fs.writeFileSync(path.join(out,`${id}-druck-${i+1}.png`),c.toBuffer('image/png'))}
  }
  console.log(daten.length+' direkte Bildvergleiche in '+Math.ceil(daten.length/(cols*rows))+' Blättern: '+out);
}
main().catch(e=>{console.error(e);process.exitCode=1});
