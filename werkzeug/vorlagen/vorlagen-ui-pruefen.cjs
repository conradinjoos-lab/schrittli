'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'output/vorlagen-pruefung');
async function main(){
 const server=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://localhost'),p=path.resolve(root,'.'+decodeURIComponent(u.pathname)+(u.pathname.endsWith('/')?'index.html':''));
  if(!p.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  try{let b=fs.readFileSync(p);if(p===path.join(root,'vorlagen/index.html'))b=Buffer.from(b.toString().replace('// Figuren der gewählten Form und der Liste zuerst nachladen; was nicht kommt, fällt weg','window.VorlagenPruefung={bereit,byId,stueck,teilSvg,form,S};\n// Figuren der gewählten Form und der Liste zuerst nachladen; was nicht kommt, fällt weg'));
   res.setHeader('Content-Type',p.endsWith('.html')?'text/html; charset=utf-8':p.endsWith('.js')?'text/javascript; charset=utf-8':p.endsWith('.webp')?'image/webp':'application/octet-stream');res.end(b);
  }catch{res.writeHead(404).end();}
 });await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const browser=await chromium.launch({headless:true,executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
 try{const page=await browser.newPage({viewport:{width:1360,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(`http://127.0.0.1:${server.address().port}/vorlagen/?form=alex-gesicht&b=10`,{waitUntil:'networkidle'});
  await page.waitForSelector('#vorschau image');
  const result=await page.evaluate(async()=>{
   const a=window.VorlagenPruefung,ids=Object.keys(a.byId);await a.bereit(ids);
   let tested=0;
   for(const id of ids){const f=a.byId[id];for(const spiegel of [false,true])for(const farbig of [false,true]){
    const st=a.stueck({...a.S,id,b:10*f.w/100,h:10*f.h/100,spiegel,farbig,linie:'schnitt',det:true});
    const svg=a.teilSvg(st);if(/NaN|undefined|Infinity/.test(svg))throw new Error(id+' ungültiges SVG');
    if(f.figur&&farbig&&!svg.includes('<image '))throw new Error(id+' ohne Originalgrafik');
    if(!farbig&&svg.includes('<image '))throw new Error(id+' zeigt Farbe im Linienmodus');tested++;
   }}
   for(const id of ['krake','herz','mochis-dango-spiess','goku','schweizer-flagge'])for(const linie of ['naht','zugabe']){
    const st=a.stueck({...a.S,id,b:10,h:10,linie,naht:3,zugabe:5,punkte:true,spiegel:true});
    if(/NaN|undefined|Infinity/.test(a.teilSvg(st)))throw new Error(id+' Nahtzugabe');tested++;
   }
   return {vorlagen:ids.length,varianten:tested};
  });
  await page.screenshot({path:path.join(out,'browser-farbdruck.png'),fullPage:false});
  await page.locator('#farbig').uncheck();assert.equal(await page.locator('#vorschau image').count(),0);
  await page.locator('#farbig').check();await page.locator('#spiegel').check();
  assert.match(await page.locator('#vorschau image').first().getAttribute('transform'),/scale\(-1 1\)/);
  await page.emulateMedia({media:'print'});await page.screenshot({path:path.join(out,'browser-druck.png'),fullPage:true});
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'browser-pruefung.json'),JSON.stringify({...result,fehler:errors},null,2));console.log(JSON.stringify(result));
 }finally{await browser.close();await new Promise(ok=>server.close(ok));}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
