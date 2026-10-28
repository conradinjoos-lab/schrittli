/* QR-Codes für die iPad-Links, ohne fremde Bibliothek. Byte-Modus, Fehlerkorrektur M, Version automatisch (1–40).
   Nach dem QR-Code-Generator von Project Nayuki (MIT), gekürzt auf das, was die Kontrolle braucht.
   QR.matrix(text) → Array aus Zeilen mit true/false, QR.canvas(text,px) → <canvas> mit Ruhezone. */
window.QR=(()=>{
 const ECC={L:{bits:1,i:0},M:{bits:0,i:1},Q:{bits:3,i:2},H:{bits:2,i:3}};
 const ECC_PRO_BLOCK=[
  [-1,7,10,15,20,26,18,20,24,30,18,20,24,26,30,22,24,28,30,28,28,28,28,30,30,26,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
  [-1,10,16,26,18,24,16,18,22,22,26,30,22,22,24,24,28,28,26,26,26,26,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28],
  [-1,13,22,18,26,18,24,18,22,20,24,28,26,24,20,30,24,28,28,26,30,28,30,30,30,30,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
  [-1,17,28,22,16,22,28,26,26,24,28,24,28,22,24,24,30,28,28,26,28,30,24,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30]];
 const BLOECKE=[
  [-1,1,1,1,1,1,2,2,2,2,4,4,4,4,4,6,6,6,6,7,8,8,9,9,10,12,12,12,13,14,15,16,17,18,19,19,20,21,22,24,25],
  [-1,1,1,1,2,2,4,4,4,5,5,5,8,9,9,10,10,11,13,14,16,17,17,18,20,21,23,25,26,28,29,31,33,35,37,38,40,43,45,47,49],
  [-1,1,1,2,2,4,4,6,6,8,8,8,10,12,16,12,17,16,18,21,20,23,23,25,27,29,34,34,35,38,40,43,45,48,51,53,56,59,62,65,68],
  [-1,1,1,2,4,4,4,5,6,8,8,11,11,16,16,18,16,19,21,25,25,25,34,30,32,35,37,40,42,45,48,51,54,57,60,63,66,70,74,77,81]];
 const rohModule=v=>{let r=(16*v+128)*v+64;if(v>=2){const a=Math.floor(v/7)+2;r-=(25*a-10)*a-55;if(v>=7)r-=36}return r};
 const datenCodewoerter=(v,e)=>Math.floor(rohModule(v)/8)-ECC_PRO_BLOCK[e.i][v]*BLOECKE[e.i][v];
 const bit=(x,i)=>((x>>>i)&1)!==0;
 /* Reed-Solomon über GF(256) mit 0x11D */
 const gfMul=(x,y)=>{let z=0;for(let i=7;i>=0;i--){z=(z<<1)^((z>>>7)*0x11D);z^=((y>>>i)&1)*x}return z};
 const rsDivisor=grad=>{const r=new Array(grad).fill(0);r[grad-1]=1;let wurzel=1;
  for(let i=0;i<grad;i++){for(let j=0;j<grad;j++){r[j]=gfMul(r[j],wurzel);if(j+1<grad)r[j]^=r[j+1]}wurzel=gfMul(wurzel,2)}return r};
 const rsRest=(daten,div)=>{const r=new Array(div.length).fill(0);
  for(const b of daten){const f=b^r.shift();r.push(0);div.forEach((c,i)=>r[i]^=gfMul(c,f))}return r};

 function matrix(text,eccName='M'){
  const bytes=new TextEncoder().encode(text);let e=ECC[eccName]||ECC.M;
  /* kleinste Version, in die die Daten passen */
  let v=1;for(;;v++){const cc=v<=9?8:16,brauch=4+cc+8*bytes.length;if(v>40)throw new Error('Text zu lang für einen QR-Code');if(brauch<=datenCodewoerter(v,e)*8)break}
  const size=v*4+17;
  /* Bits: Modus 0100, Länge, Daten, Terminator, Füllbytes */
  const bits=[];const push=(val,n)=>{for(let i=n-1;i>=0;i--)bits.push((val>>>i)&1)};
  push(4,4);push(bytes.length,v<=9?8:16);bytes.forEach(b=>push(b,8));
  const kap=datenCodewoerter(v,e)*8;push(0,Math.min(4,kap-bits.length));push(0,(8-bits.length%8)%8);
  for(let p=0xEC;bits.length<kap;p^=0xEC^0x11)push(p,8);
  const daten=[];bits.forEach((b,i)=>{daten[i>>>3]=(daten[i>>>3]||0)|(b<<(7-(i&7)))});
  /* Fehlerkorrektur und Verschachtelung der Blöcke */
  const nb=BLOECKE[e.i][v],eccLen=ECC_PRO_BLOCK[e.i][v],roh=Math.floor(rohModule(v)/8),kurz=nb-roh%nb,kurzLen=Math.floor(roh/nb);
  const bloecke=[];const div=rsDivisor(eccLen);
  for(let i=0,k=0;i<nb;i++){const dl=kurzLen-eccLen+(i<kurz?0:1);const d=daten.slice(k,k+dl);k+=dl;const ecc=rsRest(d,div);if(i<kurz)d.push(0);bloecke.push(d.concat(ecc))}
  const folge=[];for(let i=0;i<bloecke[0].length;i++)bloecke.forEach((b,j)=>{if(i!==kurzLen-eccLen||j>=kurz)folge.push(b[i])});
  /* Raster mit Funktionsmustern */
  const m=Array.from({length:size},()=>new Array(size).fill(false)),fn=Array.from({length:size},()=>new Array(size).fill(false));
  const set=(x,y,dunkel)=>{m[y][x]=dunkel;fn[y][x]=true};
  for(let i=0;i<size;i++){set(6,i,i%2===0);set(i,6,i%2===0)}
  const sucher=(x,y)=>{for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const d=Math.max(Math.abs(dx),Math.abs(dy)),xx=x+dx,yy=y+dy;if(xx>=0&&xx<size&&yy>=0&&yy<size)set(xx,yy,d!==2&&d!==4)}};
  sucher(3,3);sucher(size-4,3);sucher(3,size-4);
  const ausr=[];if(v>1){const n=Math.floor(v/7)+2,schritt=v===32?26:Math.ceil((v*4+4)/(n*2-2))*2;ausr.push(6);for(let p=size-7;ausr.length<n;p-=schritt)ausr.splice(1,0,p)}
  ausr.forEach((cy,i)=>ausr.forEach((cx,j)=>{if((i===0&&j===0)||(i===0&&j===ausr.length-1)||(i===ausr.length-1&&j===0))return;
   for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)set(cx+dx,cy+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1)}));
  const format=maske=>{const d=e.bits<<3|maske;let r=d;for(let i=0;i<10;i++)r=(r<<1)^((r>>>9)*0x537);const b=(d<<10|r)^0x5412;
   for(let i=0;i<=5;i++)set(8,i,bit(b,i));set(8,7,bit(b,6));set(8,8,bit(b,7));set(7,8,bit(b,8));for(let i=9;i<15;i++)set(14-i,8,bit(b,i));
   for(let i=0;i<8;i++)set(size-1-i,8,bit(b,i));for(let i=8;i<15;i++)set(8,size-15+i,bit(b,i));set(8,size-8,true)};
  format(0);
  if(v>=7){let r=v;for(let i=0;i<12;i++)r=(r<<1)^((r>>>11)*0x1F25);const b=v<<12|r;
   for(let i=0;i<18;i++){const a=size-11+i%3,c=Math.floor(i/3);set(a,c,bit(b,i));set(c,a,bit(b,i))}}
  /* Daten im Zickzack einfüllen */
  let i=0;for(let rechts=size-1;rechts>=1;rechts-=2){if(rechts===6)rechts=5;
   for(let vert=0;vert<size;vert++)for(let j=0;j<2;j++){const x=rechts-j,y=((rechts+1)&2)===0?size-1-vert:vert;
    if(!fn[y][x]&&i<folge.length*8){m[y][x]=bit(folge[i>>>3],7-(i&7));i++}}}
  /* beste Maske nach Strafpunkten */
  const MASKEN=[(x,y)=>(x+y)%2,(x,y)=>y%2,(x,y)=>x%3,(x,y)=>(x+y)%3,(x,y)=>(Math.floor(x/3)+Math.floor(y/2))%2,(x,y)=>x*y%2+x*y%3,(x,y)=>(x*y%2+x*y%3)%2,(x,y)=>((x+y)%2+x*y%3)%2];
  const maskieren=k=>{for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(!fn[y][x]&&MASKEN[k](x,y)===0)m[y][x]=!m[y][x]};
  const strafe=()=>{let s=0;const muster=h=>{const n=h[1],kern=n>0&&h[2]===n&&h[3]===n*3&&h[4]===n&&h[5]===n;return (kern&&h[0]>=n*4&&h[6]>=n?1:0)+(kern&&h[6]>=n*4&&h[0]>=n?1:0)};
   const merk=(l,h)=>{if(h[0]===0)l+=size;h.pop();h.unshift(l)};
   const linie=lies=>{let farbe=false,lauf=0;const h=[0,0,0,0,0,0,0];
    for(let k=0;k<size;k++){const c=lies(k);if(c===farbe){lauf++;if(lauf===5)s+=3;else if(lauf>5)s++}else{merk(lauf,h);if(!farbe)s+=muster(h)*40;farbe=c;lauf=1}}
    if(farbe){merk(lauf,h);lauf=0}lauf+=size;merk(lauf,h);s+=muster(h)*40};
   for(let y=0;y<size;y++)linie(x=>m[y][x]);for(let x=0;x<size;x++)linie(y=>m[y][x]);
   for(let y=0;y<size-1;y++)for(let x=0;x<size-1;x++){const c=m[y][x];if(c===m[y][x+1]&&c===m[y+1][x]&&c===m[y+1][x+1])s+=3}
   let dunkel=0;m.forEach(z=>z.forEach(c=>{if(c)dunkel++}));const total=size*size;s+=(Math.ceil(Math.abs(dunkel*20-total*10)/total)-1)*10;return s};
  let beste=0,min=Infinity;
  for(let k=0;k<8;k++){format(k);maskieren(k);const p=strafe();if(p<min){min=p;beste=k}maskieren(k)}
  format(beste);maskieren(beste);
  return m;
 }
 function canvas(text,px=240,ecc='M'){
  const m=matrix(text,ecc),n=m.length,rand=4,skala=Math.max(1,Math.floor(px/(n+2*rand))),c=document.createElement('canvas');
  c.width=c.height=(n+2*rand)*skala;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.fillStyle='#17212F';
  m.forEach((zeile,y)=>zeile.forEach((d,x)=>{if(d)g.fillRect((x+rand)*skala,(y+rand)*skala,skala,skala)}));
  c.setAttribute('role','img');c.setAttribute('aria-label','QR-Code: '+text);return c;
 }
 return {matrix,canvas};
})();
