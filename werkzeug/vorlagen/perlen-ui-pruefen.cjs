'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'output/perlen-audit');
async function main(){
 const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost'),p=path.resolve(root,'.'+decodeURIComponent(u.pathname)+(u.pathname.endsWith('/')?'index.html':''));
  if(!p.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  try{let b=fs.readFileSync(p);if(p===path.join(root,'vorlagen/perlen/index.html'))b=Buffer.from(b.toString().replace('liste();zeichnen();','window.PerlenPruefung={TIERE,FARBE,PERLEN,S,blatt,zeichnen,aktuellesTier,speicherKey};liste();zeichnen();'));
   res.setHeader('Content-Type',p.endsWith('.html')?'text/html; charset=utf-8':p.endsWith('.js')?'text/javascript; charset=utf-8':p.endsWith('.webp')?'image/webp':p.endsWith('.png')?'image/png':'application/octet-stream');res.end(b);
  }catch{res.writeHead(404).end();}
 });await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const browser=await chromium.launch({headless:true,executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
 try{const page=await browser.newPage({viewport:{width:1360,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  const base=`http://127.0.0.1:${server.address().port}`;
  await page.goto(base+'/vorlagen/perlen/index.html?tier=schmetterling',{waitUntil:'networkidle'});
  const result=await page.evaluate(()=>{const a=window.PerlenPruefung,parser=new DOMParser();let pages=0;
   for(const t of a.TIERE){const svg=a.blatt(t,a.PERLEN.r3),doc=parser.parseFromString('<main xmlns="http://www.w3.org/1999/xhtml">'+svg+'</main>','application/xml');if(doc.querySelector('parsererror'))throw Error('SVG ungültig: '+t.id);pages+=doc.querySelectorAll('svg').length;}
   return {muster:a.TIERE.length,druckseiten:pages};});
  const original=await page.evaluate(()=>JSON.stringify(window.PerlenPruefung.aktuellesTier()));
  await page.locator('#anpassen').click();await page.locator('.pe-dialog').waitFor();
  const oldWidth=await page.locator('#pe-breite').inputValue();
  await page.locator('#pe-breite').fill('25');await page.locator('#pe-breite').dispatchEvent('input');await page.locator('#pe-breite').dispatchEvent('change');
  assert.notEqual(await page.evaluate(()=>JSON.stringify(window.PerlenPruefung.aktuellesTier())),original);
  await page.locator('[data-tun="original"]').click();assert.equal(await page.locator('#pe-breite').inputValue(),oldWidth);
  await page.locator('#pe-von').selectOption('r');await page.locator('#pe-nach').selectOption('b');await page.locator('[data-tun="tauschen"]').click();
  assert.ok(await page.evaluate(()=>!window.PerlenPruefung.aktuellesTier().rows.join('').includes('r')));
  await page.locator('[data-tun="fertig"]').click();await page.reload({waitUntil:'networkidle'});
  assert.ok(await page.evaluate(()=>!window.PerlenPruefung.aktuellesTier().rows.join('').includes('r')));
  await page.locator('#anpassen').click();await page.locator('[data-tun="original"]').click();await page.locator('[data-tun="fertig"]').click();
  assert.equal(await page.evaluate(()=>JSON.stringify(window.PerlenPruefung.aktuellesTier())),original);
  await page.evaluate(()=>{const a=window.PerlenPruefung,t=a.TIERE.find(t=>t.id==='figur-peppa-wutz');localStorage.setItem('schrittli.perlen.'+t.id+'.v2',JSON.stringify({...t,version:2,rows:['r'],offsets:[0],gridWidth:1}));});
  await page.goto(base+'/vorlagen/perlen/index.html?tier=figur-peppa-wutz',{waitUntil:'networkidle'});
  assert.ok(await page.evaluate(()=>window.PerlenPruefung.aktuellesTier().rows.length>1));
  await page.locator('#vergleich summary').click();await page.waitForFunction(()=>document.getElementById('original-bild').complete&&document.getElementById('original-bild').naturalWidth>0);
  await page.screenshot({path:path.join(out,'browser-figur.png'),fullPage:false});
  await page.emulateMedia({media:'print'});await page.screenshot({path:path.join(out,'browser-druck.png'),fullPage:true});await page.emulateMedia({media:'screen'});
  await page.goto(base+'/vorlagen/perlen/index.html?tier=fledermaus',{waitUntil:'networkidle'});await page.screenshot({path:path.join(out,'browser-einfach.png'),fullPage:false});
  for(const report of ['perlen-audit','vorlagen-pruefung']){
   await page.goto(base+'/output/'+report+'/index.html',{waitUntil:'networkidle'});assert.equal(await page.locator('article').count(),12);
   await page.locator('#suche').fill(report==='perlen-audit'?'Papagei':'Krake');assert.equal(await page.locator('article').count(),1);
   await page.waitForFunction(()=>[...document.querySelectorAll('article img')].filter(i=>i.getBoundingClientRect().top<innerHeight).every(i=>i.complete&&i.naturalWidth>0));
   await page.screenshot({path:path.join(out,report+'-bericht.png'),fullPage:true});
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'browser-pruefung.json'),JSON.stringify({...result,editor:'Breite, Farbtausch, Original, Speicherung und Versionsschutz bestanden',berichte:'Suche und Bildanzeige bestanden',fehler:errors},null,2));console.log(JSON.stringify(result));
 }finally{await browser.close();await new Promise(ok=>server.close(ok));}
}
main().catch(e=>{console.error(e);process.exitCode=1});
