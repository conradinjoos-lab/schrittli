'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
function load(){const c={window:{},FIGUREN_DAZU(w,f){c.figures.push(...f)},figures:[]};vm.runInNewContext(read('vorlagen/formen.js'),c);vm.runInNewContext(read('vorlagen/figuren/index.js'),c);for(const p of new Set(c.window.FIGUREN_INDEX.map(f=>f.datei)))vm.runInNewContext(read('vorlagen/figuren/'+p),c);return {forms:c.window.FORMEN,figures:c.figures};}
function draw(x,f,ox,oy,w,h,mode='color'){const s=Math.min((w-8)/f.w,(h-8)/f.h),dx=ox+(w-f.w*s)/2,dy=oy+(h-f.h*s)/2;x.save();x.translate(dx,dy);x.scale(s,s);
 const p=rs=>{x.beginPath();for(const r of rs){r.forEach(([a,b],i)=>i?x.lineTo(a,b):x.moveTo(a,b));x.closePath();}};
 p(f.d);x.fillStyle=mode==='silhouette'?'#193d39':'white';x.fill('evenodd');
 if(mode==='color'&&f._original){const o=f.original;x.drawImage(f._original,o.x,o.y,o.w,o.h);}
 else if(mode==='color')for(const c of f.farben||[]){p(c.d);x.fillStyle=c.f;x.fill('evenodd');x.strokeStyle=c.f;x.lineWidth=.4;x.stroke();}
 p(f.d);x.strokeStyle='#1c2430';x.lineWidth=.35;x.stroke();
 if(mode==='outline'){x.strokeStyle='#8a8178';x.lineWidth=.25;for(const line of f.det||[]){x.beginPath();line.forEach(([a,b],i)=>i?x.lineTo(a,b):x.moveTo(a,b));x.stroke();}}
 x.restore();}
async function main(){const {forms,figures}=load(),meta=JSON.parse(read('werkzeug/vorlagen/figuren.json')).figuren,args=process.argv.slice(2),only=args.filter(x=>!x.startsWith('--'));const simple=args.includes('--formen'),all=simple?forms:figures,items=only.length?all.filter(f=>only.includes(f.id)):all;
 const out=path.join(root,'output/vorlagen-pruefung',args.includes('--probe')?'probe':args.includes('--nachher')?'nachher':'vorher');fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,simple?'formen.json':'figuren.json'),JSON.stringify(items));
 const cw=simple?290:440,ch=simple?280:250,cols=simple?5:4,rows=5;
 for(let start=0;start<items.length;start+=cols*rows){const sl=items.slice(start,start+cols*rows),c=createCanvas(cw*cols,ch*Math.ceil(sl.length/cols)+38),x=c.getContext('2d');x.fillStyle='#e7edeb';x.fillRect(0,0,c.width,c.height);x.fillStyle='#193d39';x.font='bold 18px Arial';x.fillText(`${simple?'Formen · Umriss und Innenlinien':'Original links · aktuelle Farbvorlage rechts'} · ${start+1}–${start+sl.length}`,12,25);
 for(let i=0;i<sl.length;i++){const f=sl[i],ox=(i%cols)*cw,oy=Math.floor(i/cols)*ch+38;x.fillStyle='white';x.fillRect(ox+3,oy+3,cw-6,ch-6);x.fillStyle='#193d39';x.font='bold 14px Arial';x.fillText(`${start+i+1}. ${f.name}`,ox+10,oy+23,cw-20);
 if(simple)draw(x,f,ox+10,oy+35,cw-20,ch-60,'outline');else{const m=meta.find(m=>m.id===f.id),im=await loadImage(path.join(root,'werkzeug/vorlagen/bilder',m.datei)),s=Math.min(195/im.width,190/im.height);x.drawImage(im,ox+10+(195-im.width*s)/2,oy+34+(190-im.height*s)/2,im.width*s,im.height*s);if(f.original)Object.defineProperty(f,'_original',{value:await loadImage(path.join(root,'vorlagen/figuren/originale',f.original.datei)),configurable:true});draw(x,f,ox+220,oy+34,205,190,args.includes('--linien')?'outline':'color');}
 x.fillStyle='#677770';x.font='11px Arial';x.fillText(f.id,ox+10,oy+ch-10,cw-20);
 }fs.writeFileSync(path.join(out,`${simple?'formen':args.includes('--linien')?'linien':'figuren'}-${String(start/(cols*rows)+1).padStart(2,'0')}.png`),c.toBuffer('image/png'));}
 console.log(items.length+' Vorlagen: '+out);}
module.exports={load,draw};if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1});
