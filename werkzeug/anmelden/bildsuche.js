/* Echte Bilder für Motiv-Wünsche: holt Kandidaten von Webseiten, Wikipedia und Wikimedia Commons.
   Nur Pixelbilder (PNG, JPEG, GIF, WebP), denn nur diese kann Claude ansehen und die Kontrolle ohne Risiko anzeigen. */
const UA='Schrittli/1.0 (Schul-App; https://conradinjoos-lab.github.io/schrittli/)',ZEIT=8000,MAX_BILD=2e6,MAX_SEITE=1e6;
const KLEIN=96,GROSS=8000;   // kleinere Bilder taugen nicht als Vorlage, grössere weist die Claude-API ab
const PRO_SEITE=6,PRO_SUCHE=3,DAUMEN=960;

export function pruefeUrl(x){
 try{
  const u=new URL(String(x));
  if(!/^https?:$/.test(u.protocol)||u.username||u.password)return null;
  if(/^(localhost|.*\.local|.*\.internal)$/i.test(u.hostname)||/^[\d.]+$/.test(u.hostname)||u.hostname.includes(':')||u.hostname.startsWith('['))return null;
  return u.href;
 }catch{return null}
}
async function lesen(url,accept,max){
 const r=await fetch(url,{headers:{'User-Agent':UA,Accept:accept},redirect:'follow',signal:AbortSignal.timeout(ZEIT)});
 if(!r.ok||!r.body||Number(r.headers.get('content-length'))>max){await r.body?.cancel();return null;}
 const reader=r.body.getReader(),teile=[];let n=0;
 for(;;){const {value,done}=await reader.read();if(done)break;n+=value.length;if(n>max){await reader.cancel();return null;}teile.push(value);}
 const bytes=new Uint8Array(n);let pos=0;for(const t of teile){bytes.set(t,pos);pos+=t.length;}
 return {bytes,art:r.headers.get('content-type')||''};
}

/* Das Dateiformat steht in den ersten Bytes; die Angabe des Servers stimmt nicht immer */
export function bildArt(b){
 if(b[0]===0x89&&b[1]===0x50&&b[2]===0x4e&&b[3]===0x47)return 'image/png';
 if(b[0]===0xff&&b[1]===0xd8&&b[2]===0xff)return 'image/jpeg';
 if(b[0]===0x47&&b[1]===0x49&&b[2]===0x46&&b[3]===0x38)return 'image/gif';
 if(b[0]===0x52&&b[1]===0x49&&b[2]===0x46&&b[3]===0x46&&b[8]===0x57&&b[9]===0x45&&b[10]===0x42&&b[11]===0x50)return 'image/webp';
 return null;
}
/* Breite und Höhe aus dem Dateikopf, null wenn sie dort nicht einfach stehen */
export function bildMasse(b,art){
 const d=new DataView(b.buffer,b.byteOffset,b.length);
 try{
  if(art==='image/png')return [d.getUint32(16),d.getUint32(20)];
  if(art==='image/gif')return [d.getUint16(6,true),d.getUint16(8,true)];
  if(art==='image/jpeg')for(let i=2;i+9<b.length;){
   if(b[i]!==0xff){i++;continue;}
   const m=b[i+1];
   if(m===0xff){i++;continue;}
   if(m>=0xc0&&m<=0xcf&&m!==0xc4&&m!==0xc8&&m!==0xcc)return [d.getUint16(i+7),d.getUint16(i+5)];
   i+=2+d.getUint16(i+2);
  }
 }catch{}
 return null;
}
export async function holeBild(url){
 const sicher=pruefeUrl(url);if(!sicher)return null;
 try{
  const r=await lesen(sicher,'image/png,image/jpeg,image/webp,image/gif;q=0.9,*/*;q=0.1',MAX_BILD);if(!r)return null;
  const art=bildArt(r.bytes);if(!art)return null;
  const m=bildMasse(r.bytes,art);if(m&&(Math.min(...m)<KLEIN||Math.max(...m)>GROSS))return null;
  return {bytes:r.bytes,art};
 }catch{return null}
}
export const alsBase64=b=>{
 if(typeof b.toBase64==='function')return b.toBase64();
 let s='';for(let i=0;i<b.length;i+=0x8000)s+=String.fromCharCode.apply(null,b.subarray(i,i+0x8000));return btoa(s);
};

const attribute=tag=>{const a={};for(const m of tag.matchAll(/([\w:-]+)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/g))a[m[1].toLowerCase()]=m[2].replace(/^["']|["']$/g,'').replace(/&amp;/g,'&').trim();return a;};
/* Bilder einer Seite, die wahrscheinlichsten zuerst: Logo vor Touch-Icon vor Vorschaubild vor dem Rest */
export function seitenBilder(html,basis){
 const treffer=new Map(),plus=(x,rang)=>{
  try{const u=pruefeUrl(new URL(x,basis).href);if(u&&!/\.svgz?(\?|$)/i.test(u)&&!(treffer.get(u)<=rang))treffer.set(u,rang);}catch{}
 };
 const text=html.slice(0,5e5);
 for(const m of text.matchAll(/<(meta|link|img)\b[^>]*>/gi)){
  const art=m[1].toLowerCase(),a=attribute(m[0]);
  if(art==='meta'){const n=(a.property||a.name||'').toLowerCase();if((n==='og:image'||n==='og:image:secure_url'||n==='twitter:image')&&a.content)plus(a.content,3);}
  else if(art==='link'){const r=(a.rel||'').toLowerCase();if(!a.href)continue;if(r.includes('apple-touch-icon'))plus(a.href,2);else if(r.includes('icon'))plus(a.href,4);}
  else{
   const src=a.srcset?.split(',').pop().trim().split(/\s+/)[0]||a['data-src']||a.src;if(!src||src.startsWith('data:'))continue;
   plus(src,/logo|wappen|emblem|crest|badge/i.test(`${src} ${a.alt||''} ${a.class||''} ${a.id||''}`)?0:5);
  }
 }
 for(const m of text.matchAll(/"logo"\s*:\s*(?:\{[^{}]*?"url"\s*:\s*)?"([^"]+)"/g))plus(m[1].replace(/\\\//g,'/'),1);
 return [...treffer].sort((a,b)=>a[1]-b[1]).map(([u])=>u);
}
async function vonSeite(seite){
 const sicher=pruefeUrl(seite);if(!sicher)return [];
 if(/\.(png|jpe?g|gif|webp)(\?|$)/i.test(sicher))return [{url:sicher,seite:sicher}];
 const r=await lesen(sicher,'text/html,application/xhtml+xml',MAX_SEITE).catch(()=>null);if(!r)return [];
 if(bildArt(r.bytes))return [{url:sicher,seite:sicher}];
 return seitenBilder(new TextDecoder().decode(r.bytes),sicher).slice(0,PRO_SEITE).map(url=>({url,seite:sicher}));
}
async function wiki(api,frage){
 const r=await lesen(`${api}?action=query&format=json&${frage}`,'application/json',MAX_SEITE).catch(()=>null);if(!r)return [];
 try{return Object.values(JSON.parse(new TextDecoder().decode(r.bytes)).query?.pages??{}).sort((a,b)=>(a.index??0)-(b.index??0));}catch{return [];}
}
const ohneZaehler=u=>u.split('?utm_')[0];   // sonst zählte dasselbe Bild je nach Wiki doppelt
const wikipedia=(sprache,suche)=>wiki(`https://${sprache}.wikipedia.org/w/api.php`,`generator=search&gsrsearch=${encodeURIComponent(suche)}&gsrlimit=${PRO_SUCHE}&prop=pageimages|info&inprop=url&piprop=thumbnail&pilicense=any&pithumbsize=${DAUMEN}`)
 .then(p=>p.filter(x=>x.thumbnail?.source).map(x=>({url:ohneZaehler(x.thumbnail.source),seite:x.fullurl||x.thumbnail.source})));
const commons=suche=>wiki('https://commons.wikimedia.org/w/api.php',`generator=search&gsrsearch=${encodeURIComponent(suche+' filetype:bitmap|drawing')}&gsrnamespace=6&gsrlimit=${PRO_SUCHE}&prop=imageinfo&iiprop=url&iiurlwidth=${DAUMEN}`)
 .then(p=>p.filter(x=>x.imageinfo?.[0]?.thumburl).map(x=>({url:ohneZaehler(x.imageinfo[0].thumburl),seite:x.imageinfo[0].descriptionurl||x.imageinfo[0].url})));

/* Neue Bilder zu Seiten und Stichworten, ohne die schon gesehenen. Claude entscheidet danach anhand der Bilder selbst. */
export async function findeBilder({seiten=[],suche=[]},schon,max){
 const gruppen=await Promise.all([...seiten.slice(0,3).map(vonSeite),...suche.slice(0,2).flatMap(s=>[wikipedia('de',s),wikipedia('en',s),commons(s)])]);
 const kandidaten=new Map();
 for(const g of gruppen)for(const k of g)if(!schon.has(k.url)&&!kandidaten.has(k.url))kandidaten.set(k.url,k);
 const liste=[...kandidaten.values()].slice(0,max);
 return (await Promise.all(liste.map(async k=>{const b=await holeBild(k.url);return b&&{...k,...b};}))).filter(Boolean);
}
