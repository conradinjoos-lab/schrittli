/* Reproduzierbare Bildbelege für die manuelle Einzelbewertung. Keine automatische Sichtfreigabe. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'output/perlen-audit');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
function context(before=false){
  const nodes=new Map(),el=()=>({value:'',innerHTML:'',textContent:'',hidden:false,dataset:{},classList:{toggle(){}},addEventListener(){},setAttribute(){},scrollIntoView(){}});
  const c=vm.createContext({console,URLSearchParams,window:{},location:{search:'',protocol:'http:'},history:{replaceState(){}},localStorage:{getItem(){return null},setItem(){}},matchMedia:()=>({matches:false}),document:{getElementById(id){if(!nodes.has(id))nodes.set(id,el());return nodes.get(id)},querySelectorAll(){return []}}});
  vm.runInContext(read(before?'output/perlen-audit/vorher/figuren.js':'vorlagen/perlen/figuren.js'),c);
  vm.runInContext(read('vorlagen/perlen/bearbeiten.js'),c);c.PerlenEditor=c.window.PerlenEditor;
  for(const m of read(before?'output/perlen-audit/vorher/index.html':'vorlagen/perlen/index.html').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))if(m[1].trim())vm.runInContext(m[1],c);
  return c;
}
function data(c){return JSON.parse(vm.runInContext('JSON.stringify(TIERE.map(t=>({t,g:geometrie(t),palette:FARBE,n:zaehlen(t).n,svg:mini(t)})))',c));}
function paint(x,d,ox,oy,w,h){const {g,palette}=d,sk=Math.min(w/(g.x1-g.x0),h/(g.y1-g.y0)),dx=ox+(w-(g.x1-g.x0)*sk)/2-g.x0*sk,dy=oy+(h-(g.y1-g.y0)*sk)/2-g.y0*sk;
  for(const p of g.P){x.save();x.translate(dx+p.x*sk,dy+p.y*sk);x.rotate(p.r*Math.PI/180);x.fillStyle=palette[p.c][0];x.strokeStyle=p.c==='t'?'#b8c3cc':'#404a50';x.lineWidth=.04*sk;if(p.c==='t')x.setLineDash([.09*sk,.09*sk]);x.beginPath();x.roundRect(-g.q*sk*.47,-sk*.47,g.q*sk*.94,sk*.94,.18*sk);x.fill();x.stroke();x.restore();}}
async function main(){
  fs.mkdirSync(out,{recursive:true});const all=data(context()),before=data(context(true));
  fs.writeFileSync(path.join(out,'muster.json'),JSON.stringify(all.map(({t,n})=>({t,n})),null,2));
  const args=process.argv.slice(2),simple=args.includes('--einfach'),ids=args.filter(a=>!a.startsWith('--'));
  const chosen=all.filter(d=>simple?!d.t.quelle:ids.includes(d.t.quelle));
  const meta=JSON.parse(read('werkzeug/vorlagen/figuren.json')).figuren;
  const cw=simple?300:1000,ch=simple?340:400,cols=simple?5:1,rows=simple?4:4;
  for(let start=0;start<chosen.length;start+=cols*rows){const slice=chosen.slice(start,start+cols*rows),c=createCanvas(cw*cols,ch*Math.ceil(slice.length/cols)),x=c.getContext('2d');x.fillStyle='#e8eded';x.fillRect(0,0,c.width,c.height);
    for(let i=0;i<slice.length;i++){const d=slice[i],ox=(i%cols)*cw,oy=Math.floor(i/cols)*ch;x.fillStyle='white';x.fillRect(ox+3,oy+3,cw-6,ch-6);x.fillStyle='#14212a';x.font='bold 18px Arial';x.fillText(d.t.name+' · '+d.n+' Perlen',ox+12,oy+26);
      if(simple){paint(x,d,ox+15,oy+45,cw-30,ch-65);}else{const e=meta.find(f=>f.id===d.t.quelle),img=await loadImage(path.join(root,'werkzeug/vorlagen/bilder',e.datei)),s=Math.min(300/img.width,320/img.height);x.drawImage(img,15+(300-img.width*s)/2,oy+50+(320-img.height*s)/2,img.width*s,img.height*s);paint(x,before.find(b=>b.t.id===d.t.id),340,oy+50,300,320);paint(x,d,675,oy+50,300,320);x.font='13px Arial';x.fillStyle='#52616a';x.fillText('Vorlage',15,oy+390);x.fillText('Bisher',340,oy+390);x.fillText('Aktuell',675,oy+390);}
    }fs.writeFileSync(path.join(out,(simple?'einfach-':'detail-')+String(start/(cols*rows)+1).padStart(2,'0')+'.png'),c.toBuffer('image/png'));
  }
  console.log(chosen.length+' Belege geschrieben.');
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1});
module.exports={context,data,paint,root,out};
