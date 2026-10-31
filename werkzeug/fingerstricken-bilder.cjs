/* Zeichnet die Bilder der Anleitung «Fingerstricken» nach anleitungen/fingerstricken/.
 * Linke Hand, Handfläche zum Kind, Daumen links. Wolle hinter dem Finger liegt unter der Hand, Wolle davor darüber.
 * Aufruf: NODE_PATH="C:/Grok Code/Steine-App/node_modules" node werkzeug/fingerstricken-bilder.cjs
 */
'use strict';
const fs=require('fs'), path=require('path'), {chromium}=require('playwright');
const ZIEL=path.join(__dirname,'..','anleitungen','fingerstricken');
const C={haut:'#F6D2B0',falte:'#E2B48E',linie:'#1C2430',wolle:'#E8554E',dunkel:'#B8352F',pfeil:'#2B7DE9',gelb:'#FFD23F',grund:'#FFF9EF',gruen:'#2FA36B'};
const F=[{x:230,oben:215},{x:348,oben:150},{x:466,oben:190},{x:584,oben:290}], BREITE=92, L=[176,289,407,525,640], UNTEN=490, OBEN=370;

const strich=(d,farbe,breite,mehr='')=>`<path d="${d}" fill="none" stroke="${farbe}" stroke-width="${breite}" stroke-linecap="round" stroke-linejoin="round" ${mehr}/>`;
const wolle=(d,halo)=>(halo?strich(d,C.gelb,48):'')+strich(d,C.linie,30)+strich(d,C.wolle,20)+`<path d="${d}" fill="none" stroke="${C.dunkel}" stroke-width="20" stroke-dasharray="3 11"/>`;
const pfeil=d=>strich(d,'#fff',20)+strich(d,C.pfeil,11,'marker-end="url(#spitze)"');
const zahl=(x,y,n,r=30)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${C.linie}" stroke-width="6"/><text x="${x}" y="${y+r*.42}" font-family="Arial" font-weight="700" font-size="${r*1.2}" text-anchor="middle" fill="${C.linie}">${n}</text>`;
const haken=(x,y,r=38)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${C.gruen}" stroke="${C.linie}" stroke-width="6"/>`+strich(`M${x-r*.45} ${y} L${x-r*.1} ${y+r*.38} L${x+r*.5} ${y-r*.38}`,'#fff',r*.25);
const svg=(b,h,inhalt)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${b} ${h}" width="${b}" height="${h}"><defs><marker id="spitze" viewBox="0 0 10 10" refX="4" refY="5" markerWidth="3" markerHeight="3" orient="auto"><path d="M0 0L10 5L0 10z" fill="${C.pfeil}" stroke="${C.pfeil}" stroke-width="1"/></marker></defs><rect width="${b}" height="${h}" fill="${C.grund}"/>${inhalt}</svg>`;

/* Stück Wolle von Lücke a nach Lücke b, vorn (v) oder hinten (h) */
const stueck=(a,ya,b,yb,lage,halo)=>({lage,halo,d:`M${a} ${ya} Q${(a+b)/2} ${(ya+yb)/2+(lage==='v'?16:-12)} ${b} ${yb}`});
const hin=(y,erste,yVor=y,halo)=>[...(erste?[stueck(L[0],y,L[1],y,'h')]:[]),stueck(L[1],yVor,L[2],y,'v',halo),stueck(L[2],y,L[3],y,'h'),stueck(L[3],y,L[4],y,'v',halo)];
const rueck=(y,halo)=>[stueck(L[4],y,L[3],y,'h'),stueck(L[3],y,L[2],y,'v',halo),stueck(L[2],y,L[1],y,'h'),stueck(L[1],y,L[0],y,'v',halo)];
const zuruck=(y,yNeu)=>stueck(L[0],y,L[1],yNeu,'h');
const ANFANG=`M352 990 C322 860 245 745 192 640 Q168 565 ${L[0]} ${UNTEN}`;
const DAUMEN='M150 900 Q185 750 302 660';

const haeuel=(x,y,r=62)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${C.wolle}" stroke="${C.linie}" stroke-width="7"/>`+[[-.7,-.5,.6,-.75],[-.85,.05,.7,-.2],[-.6,.55,.85,.3]].map(([a,b,c,d])=>strich(`M${x+a*r} ${y+b*r} Q${x} ${y+(b+d)/2*r-14} ${x+c*r} ${y+d*r}`,C.dunkel,6)).join('')+strich(`M${x-r*.1} ${y+r*.75} Q${x+r*.35} ${y+r*.4} ${x+r*.75} ${y+r*.55}`,C.dunkel,6);

/* Strickschnur: Röhre mit Maschen entlang einer Kurve */
function schnur(p0,p1,p2,p3,abstand=23){ const pkt=t=>[0,1].map(i=>(1-t)**3*p0[i]+3*(1-t)**2*t*p1[i]+3*(1-t)*t*t*p2[i]+t**3*p3[i]), d=`M${p0} C${p1} ${p2} ${p3}`; let s=strich(d,C.linie,64)+strich(d,C.wolle,52);
  for(let t=0;t<=1;){ const [x,y]=pkt(t), [x2,y2]=pkt(Math.min(1,t+.01)), w=Math.atan2(y2-y,x2-x)*180/Math.PI, lang=Math.hypot(x2-x,y2-y)||.01; s+=strich(`M${x-13} ${y-19} L${x+9} ${y} L${x-13} ${y+19}`,C.dunkel,7,`transform="rotate(${w} ${x} ${y})"`); t+=abstand*.01/lang; } return s; }

/* Schlaufe rund um Finger i */
const ring=(i,y)=>{ const {x}=F[i], r=BREITE/2+12; return {h:`M${x-r} ${y} A${r} 17 0 0 1 ${x+r} ${y}`,v:`M${x-r} ${y} A${r} 17 0 0 0 ${x+r} ${y}`}; };
const ueberSpitze=i=>{ const {x,oben}=F[i]; return `M${x} ${UNTEN-34} C${x-8} ${oben-30} ${x+58} ${oben-72} ${x+60} ${oben+18}`; };

/* teile: Wollstücke, ringe: [finger,y,halo], hinten/vorn/oben: fertiges SVG je Ebene */
function hand({teile=[],ringe=[],hinten='',vorn='',oben='',anfang=false,gelb=[],daumenGelb=false}={}){
  const glieder=F.map(({x,oben})=>`<rect x="${x-BREITE/2}" y="${oben}" width="${BREITE}" height="${640-oben}" rx="${BREITE/2}"/>`).join('')+`<path d="M184 570 L630 570 Q654 700 606 830 Q580 900 572 1010 L258 1010 Q250 900 214 836 Q164 730 184 570Z"/>`;
  let t=hinten;
  for(const s of teile) if(s.lage==='h') t+=wolle(s.d);
  for(const [i,y] of ringe) t+=wolle(ring(i,y).h);
  for(const i of gelb) t+=`<rect x="${F[i].x-BREITE/2-11}" y="${F[i].oben-11}" width="${BREITE+22}" height="${620-F[i].oben}" rx="${BREITE/2+11}" fill="${C.gelb}"/>`;
  if(daumenGelb) t+=strich(DAUMEN,C.gelb,134);
  t+=`<g stroke="${C.linie}" stroke-width="14" stroke-linejoin="round">${glieder}</g>`+strich(DAUMEN,C.linie,106)+`<g fill="${C.haut}">${glieder}</g>`+strich(DAUMEN,C.haut,92);
  t+=strich('M250 640 Q400 610 590 660',C.falte,7)+strich('M300 760 Q420 720 540 770',C.falte,7);
  if(anfang) t+=wolle(ANFANG);
  for(const s of teile) if(s.lage==='v'&&s.halo) t+=strich(s.d,C.gelb,48);
  for(const [i,y,halo] of ringe) if(halo) t+=strich(ring(i,y).v,C.gelb,48);
  for(const s of teile) if(s.lage==='v') t+=wolle(s.d);
  for(const [i,y] of ringe) t+=wolle(ring(i,y).v);
  t+=`<clipPath id="daumen"><rect x="0" y="0" width="420" height="800"/></clipPath><g clip-path="url(#daumen)">${daumenGelb?strich(DAUMEN,C.gelb,134):''}${strich(DAUMEN,C.linie,106)}${strich(DAUMEN,C.haut,92)}</g>`;
  return t+vorn+oben; }

const zweiReihen=(halo)=>[...hin(UNTEN,true,UNTEN,halo),...rueck(UNTEN,halo),zuruck(UNTEN,OBEN),...hin(OBEN,false),...rueck(OBEN)];
const eineReihe=y=>[...hin(y,true),...rueck(y)];
const ballLinks=y=>({vorn:wolle(`M${L[0]} ${y} C120 ${y+40} 96 ${y+90} 96 660`)+haeuel(96,700)});
const SCHNUR=schnur([545,760],[600,830],[640,900],[668,1030]);

/* Grosser Finger für die Bildfolgen. inhalt(cx) liefert {h,v} */
function bild(nr,x,inhalt,y0=40,b=360,h=720){ const cx=x+b/2, {h:hi='',v='',o=''}=inhalt(cx,y0+150);
  return `<clipPath id="feld${nr}"><rect x="${x}" y="${y0}" width="${b}" height="${h}" rx="30"/></clipPath><rect x="${x}" y="${y0}" width="${b}" height="${h}" rx="30" fill="#fff"/><g clip-path="url(#feld${nr})">${hi}${v}</g>${o}<rect x="${x}" y="${y0}" width="${b}" height="${h}" rx="30" fill="none" stroke="${C.linie}" stroke-width="6"/>${zahl(x+50,y0+50,nr,28)}`; }
const finger=(cx,oben)=>`<rect x="${cx-82}" y="${oben}" width="164" height="760" rx="82" fill="${C.haut}" stroke="${C.linie}" stroke-width="7"/>`;
const fingerRing=(cx,y)=>({h:wolle(`M${cx-96} ${y} A96 26 0 0 1 ${cx+96} ${y}`),v:d=>wolle(`M${cx-96} ${y} A96 26 0 0 0 ${cx+96} ${y}`,d)});
function drueber(){ const A=570, B=420; return svg(1200,800,
  bild(1,30,(cx,o)=>{ const u=fingerRing(cx,A), a=fingerRing(cx,B); return {h:u.h+a.h+finger(cx,o),v:a.v()+u.v(true)+pfeil(`M${cx} ${A-44} L${cx} ${B-74}`)}; })+
  bild(2,420,(cx,o)=>{ const a=fingerRing(cx,B); return {h:wolle(`M${cx-96} ${A} A96 26 0 0 1 ${cx+96} ${A}`)+a.h+finger(cx,o),v:a.v()+wolle(`M${cx-96} ${A} C${cx-100} 330 ${cx-74} ${o-24} ${cx} ${o-24} C${cx+74} ${o-24} ${cx+100} 330 ${cx+96} ${A}`,true),o:pfeil(`M${cx-40} ${o-76} Q${cx+70} ${o-110} ${cx+126} ${o+46}`)}; })+
  bild(3,810,(cx,o)=>{ const a=fingerRing(cx,B+80); return {h:wolle(`M${cx-96} 640 Q${cx} 610 ${cx+96} 640`)+a.h+finger(cx,o),v:a.v()}; })+haken(1095,120,34)); }

function zuEnde(){ const X=-60, schlaufe=(cx)=>wolle(`M${cx-12} 500 C${cx-104} 410 ${cx-84} 200 ${cx} 200 C${cx+84} 200 ${cx+104} 410 ${cx+12} 500`), schere=(x,y)=>`<g transform="translate(${x} ${y})"><path d="M0 -8 L-72 -44 L-72 -26 L0 16Z M0 8 L-72 44 L-72 26 L0 -16Z" fill="#CBD3DC" stroke="${C.linie}" stroke-width="5" stroke-linejoin="round"/><ellipse cx="44" cy="-26" rx="30" ry="22" fill="none" stroke="${C.linie}" stroke-width="24"/><ellipse cx="44" cy="-26" rx="30" ry="22" fill="none" stroke="${C.pfeil}" stroke-width="14"/><ellipse cx="44" cy="26" rx="30" ry="22" fill="none" stroke="${C.linie}" stroke-width="24"/><ellipse cx="44" cy="26" rx="30" ry="22" fill="none" stroke="${C.pfeil}" stroke-width="14"/><circle r="8" fill="${C.linie}"/></g>`;
  return svg(1200,800,
  bild(1,30,c=>{ const cx=c+X; return {h:schnur([cx,800],[cx,700],[cx,620],[cx,530])+schlaufe(cx)+wolle(`M${cx+12} 500 C${cx+60} 470 ${cx+112} 420 ${cx+112} 310 Q${cx+112} 200 ${cx+96} 60`)+schere(c+88,250)}; })+
  bild(2,420,c=>{ const cx=c+X; return {h:schnur([cx,800],[cx,700],[cx,620],[cx,530])+wolle(`M${cx} 330 Q${cx-6} 210 ${cx+2} 110`)+schlaufe(cx)+wolle(`M${cx+12} 500 C${cx+130} 470 ${cx+110} 380 ${cx} 330`),o:pfeil(`M${cx+62} 170 L${cx+62} 84`)}; })+
  bild(3,810,cx=>({h:schnur([cx,800],[cx,680],[cx,560],[cx,430])+`<circle cx="${cx}" cy="392" r="34" fill="${C.wolle}" stroke="${C.linie}" stroke-width="6"/>`+strich(`M${cx-20} 378 Q${cx+4} 396 ${cx+20} 380`,C.dunkel,6)+wolle(`M${cx+8} 366 Q${cx+40} 290 ${cx+6} 220`)}))+haken(1095,120,34)); }

const TITEL=()=>svg(1200,900,`<rect width="1200" height="900" fill="#FFE9C7"/><g transform="translate(60 -40)">${hand({teile:zweiReihen(),...ballLinks(OBEN),hinten:schnur([560,720],[880,560],[1160,720],[1040,840])+schnur([1040,840],[960,930],[720,860],[700,1000])})}</g>`);

const BILDER={
 titelbild:[TITEL,1000],
 'schritt-01':[()=>svg(800,1000,hand({anfang:true,daumenGelb:true,vorn:wolle(`M${L[0]} ${UNTEN} Q130 455 100 400`),oben:haeuel(92,335)}))],
 'schritt-02':[()=>svg(800,1000,hand({anfang:true,teile:hin(UNTEN,true),vorn:wolle(`M${L[4]} ${UNTEN} C690 ${UNTEN+30} 720 560 720 650`)+haeuel(722,700),oben:pfeil(`M200 ${UNTEN-74} L${L[4]+20} ${UNTEN-74}`)}))],
 'schritt-03':[()=>svg(800,1000,hand({anfang:true,teile:eineReihe(UNTEN),...ballLinks(UNTEN),oben:pfeil(`M${L[4]} ${UNTEN-74} L${L[0]+24} ${UNTEN-74}`)}))],
 'schritt-04':[()=>svg(800,1000,hand({anfang:true,teile:zweiReihen(),...ballLinks(OBEN),oben:F.map(f=>zahl(f.x,f.oben-46,2)).join('')}))],
 'schritt-05':[drueber,1000],
 'schritt-06':[()=>svg(800,1000,hand({anfang:true,teile:zweiReihen(true),...ballLinks(OBEN),oben:F.map((f,i)=>pfeil(ueberSpitze(i))).join('')}))],
 'schritt-06b':[()=>svg(800,1000,hand({teile:[...hin(OBEN,true),...rueck(OBEN)],hinten:wolle(`M${L[0]} ${UNTEN+30} Q400 ${UNTEN+18} ${L[4]} ${UNTEN+30}`),...ballLinks(OBEN),oben:F.map(f=>zahl(f.x,f.oben-46,1)).join('')}))],
 'schritt-07':[()=>svg(800,1000,hand({teile:zweiReihen(),hinten:SCHNUR,...ballLinks(OBEN),oben:pfeil(`M200 ${OBEN-60} L${L[4]+20} ${OBEN-60}`)+pfeil(`M${L[4]+20} ${OBEN+60} L${L[0]+24} ${OBEN+60}`)}))],
 'schritt-08':[()=>svg(800,1000,hand({teile:zweiReihen(true),hinten:SCHNUR,...ballLinks(OBEN),oben:F.map((f,i)=>pfeil(ueberSpitze(i))).join('')+pfeil('M720 800 L720 950')+strich('M676 112 A48 48 0 1 1 640 86',C.pfeil,11,'marker-end="url(#spitze)"')}))],
 'schritt-09':[()=>svg(800,1000,hand({ringe:[[0,UNTEN],[1,UNTEN],[2,UNTEN],[3,UNTEN,true]],gelb:[3],hinten:SCHNUR,...ballLinks(UNTEN),oben:pfeil(`M${F[3].x} ${UNTEN-34} C${F[3].x} 200 ${F[2].x+10} 100 ${F[2].x} ${F[2].oben-8}`)}))],
 'schritt-09b':[()=>svg(800,1000,hand({ringe:[[0,UNTEN],[1,UNTEN],[2,UNTEN,true],[2,OBEN]],hinten:SCHNUR,...ballLinks(UNTEN),oben:pfeil(ueberSpitze(2))}))],
 'schritt-10':[()=>svg(800,1000,hand({ringe:[[0,UNTEN],[1,UNTEN],[2,UNTEN]],hinten:SCHNUR,...ballLinks(UNTEN),oben:pfeil(`M${F[2].x} ${UNTEN-34} C${F[2].x} 130 ${F[1].x+10} 40 ${F[1].x} ${F[1].oben-8}`)+pfeil(`M${F[1].x} ${UNTEN-34} C${F[1].x-30} 130 ${F[0].x+10} 60 ${F[0].x} ${F[0].oben-8}`)}))],
 'schritt-11':[zuEnde,1000],
};

(async()=>{ const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}), p=await b.newPage(); fs.mkdirSync(ZIEL,{recursive:true});
  for(const [name,[bau,breite=800]] of Object.entries(BILDER)){ const url=await p.evaluate(async([s,br])=>{ const i=new Image(); i.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s); await i.decode(); const c=document.createElement('canvas'); c.width=br; c.height=Math.round(br*i.naturalHeight/i.naturalWidth); c.getContext('2d').drawImage(i,0,0,c.width,c.height); return c.toDataURL('image/webp',.86); },[bau(),breite]);
    fs.writeFileSync(path.join(ZIEL,name+'.webp'),Buffer.from(url.split(',')[1],'base64')); console.log(name); }
  await b.close(); })();
