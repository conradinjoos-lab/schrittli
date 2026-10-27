/* Real browser + local Workers/D1. No live data or external network. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {Miniflare,convertV4MiniflareOptions}=require(process.env.MINIFLARE_MODULE||'./anmelden/node_modules/miniflare');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/coni/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),origin='https://conradinjoos-lab.github.io',base=origin+'/schrittli/',api='https://schrittli-anmelden.conradinjoos.workers.dev';
(async()=>{
 const mf=new Miniflare(convertV4MiniflareOptions({modules:['worker.js','feedback.js','sammlung.js','unterricht.js'].map(name=>({type:'ESModule',path:path.join(__dirname,'anmelden',name),contents:fs.readFileSync(path.join(__dirname,'anmelden',name),'utf8')})),compatibilityDate:'2026-10-01',kvNamespaces:['KV'],d1Databases:['SAMMLUNG'],outboundService:async()=>Response.json({login:'conradinjoos-lab'})}));
 let browser;const errors=[];
 try{
  const db=await mf.getD1Database('SAMMLUNG');await db.exec(fs.readFileSync(path.join(__dirname,'anmelden/sammlung-migrations/0001_sammlung.sql'),'utf8').replaceAll('\n',' '));
  const admin=async(p,body)=>{const r=await mf.dispatchFetch(api+'/sammlung/'+p,{method:body?'POST':'GET',headers:{Origin:origin,Authorization:'Bearer teacher','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});assert(r.ok,await r.clone().text());return r.json();};
  const collection=await admin('erstellen',{name:'Unsere Schulwerkstatt'});
  browser=await chromium.launch({headless:true,channel:'chrome'});
  async function tablet(){
   const context=await browser.newContext({viewport:{width:1024,height:768},deviceScaleFactor:1,hasTouch:true});let offline=false;
   await context.addInitScript(()=>{if(!localStorage.getItem('schrittli.schule.v1'))localStorage.setItem('schrittli.schule.v1',JSON.stringify({settings:{klasse:2}}));});
   await context.route('**/*',async route=>{
    const req=route.request(),url=new URL(req.url());
    if(url.origin===api){if(offline)return route.abort('internetdisconnected');const response=await mf.dispatchFetch(req.url(),{method:req.method(),headers:{...req.headers(),origin},body:req.postDataBuffer()||undefined});return route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:Buffer.from(await response.arrayBuffer())});}
    if(url.origin!==origin)return route.abort();
    let rel=decodeURIComponent(url.pathname).replace(/^\/schrittli\//,'');if(rel.endsWith('/'))rel+='index.html';const file=path.resolve(root,rel);if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:'missing'});
    const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'}[path.extname(file)]||'application/octet-stream';return route.fulfill({contentType:mime,body:fs.readFileSync(file)});
   });
   const page=await context.newPage();page.on('pageerror',e=>{errors.push(e.message);console.error('Browser:',e.message);});await page.goto(base+'schule/#sammlung='+collection.token);try{await page.waitForFunction(()=>typeof schulVerbindung!=='undefined'&&schulVerbindung&&view.name==='home'&&!schulBusy);}catch(e){console.error(await page.evaluate(()=>({view:typeof view==='undefined'?null:view.name,connected:typeof schulVerbindung!=='undefined'&&!!schulVerbindung,status:typeof schulStatus==='undefined'?null:schulStatus,text:document.body.innerText.slice(-1200)})));throw e;}
   assert(!page.url().includes(collection.token),'Connection token removed from address');
   return {page,context,setOffline:value=>{offline=value;}};
  }
  const a=await tablet(),b=await tablet();await b.page.evaluate(()=>go('gallery'));
  async function photo(page,name,stars){
   const jpeg=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=500;c.height=400;const g=c.getContext('2d');g.fillStyle='#dfc9a8';g.fillRect(0,0,500,400);g.fillStyle='#1d6457';g.beginPath();g.moveTo(100,320);g.lineTo(370,80);g.lineTo(310,320);g.fill();return c.toDataURL('image/jpeg').split(',')[1];});
   await page.evaluate(()=>takePhoto('flieger-windhover'));
   await page.locator('input[type=file]').last().setInputFiles({name:'werk.jpg',mimeType:'image/jpeg',buffer:Buffer.from(jpeg,'base64')});
   await page.locator('#sw-name').fill(name);await page.locator('#sw-grade').selectOption('2');await page.getByRole('button',{name:stars+' Sterne',exact:true}).click();
   assert.equal(await page.locator('#sw-rating-text').textContent(),stars+' von 5 Sternen');
   if(name==='Mia'){fs.mkdirSync(path.join(root,'output/schulwerke'),{recursive:true});await page.screenshot({path:path.join(root,'output/schulwerke/foto-bewerten.png')});}
   await page.getByRole('button',{name:'Foto speichern',exact:true}).click();
  }
  await photo(a.page,'Mia',4);
  await a.page.waitForFunction(()=>S.works.some(w=>w.name==='Mia'&&w.sync==='geteilt'));
  await b.page.waitForFunction(()=>document.querySelector('.sw-werk')?.textContent.includes('Mia'),{},{timeout:14000});
  await b.page.waitForFunction(()=>document.querySelector('[data-schul-foto]')?.naturalWidth>0);
  assert.equal(await b.page.locator('.sw-sterne').getAttribute('aria-label'),'4 von 5 Sternen');
  await b.page.screenshot({path:path.join(root,'output/schulwerke/gemeinsame-sammlung.png')});
  await b.page.evaluate(()=>go('sammlung',{id:'papierflieger'}));assert((await b.page.locator('[data-schul-projekt="flieger-windhover"]').textContent()).includes('Mia'));
  await b.page.evaluate(()=>go('gallery'));
  a.setOffline(true);await photo(a.page,'Noah',5);await a.page.waitForFunction(()=>S.works.some(w=>w.name==='Noah'&&w.sync==='wartet'));
  await a.page.reload();await a.page.waitForFunction(()=>view.name==='home'&&!schulBusy);assert(await a.page.evaluate(()=>S.works.some(w=>w.name==='Noah'&&w.sync==='wartet')));
  a.setOffline(false);await a.page.evaluate(()=>window.dispatchEvent(new Event('online')));
  await b.page.waitForFunction(()=>document.querySelector('.sw-grid')?.textContent.includes('Noah'),{},{timeout:14000});
  const shared=await admin('verwaltung/werke?id='+collection.id);assert.equal(shared.werke.length,2);
  await admin('loeschen',{id:shared.werke.find(w=>w.name==='Mia').id});
  await b.page.waitForFunction(()=>!document.querySelector('.sw-grid')?.textContent.includes('Mia'),{},{timeout:14000});
  await a.page.evaluate(()=>{window.cancelTest=schulFotoAngaben();});await a.page.keyboard.press('Escape');assert.equal(await a.page.evaluate(()=>window.cancelTest),null);
  await b.page.setViewportSize({width:390,height:844});assert(await b.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No mobile horizontal overflow');
  await b.page.evaluate(()=>localStorage.setItem('werkstatt-anmeldung',JSON.stringify({token:'teacher',ablauf:0})));
  await b.page.goto(base+'kontrolle/sammlung.html');await b.page.waitForSelector('.photo-card');
  assert((await b.page.locator('.photo-card').textContent()).includes('Noah'));
  await b.page.getByRole('button',{name:'Foto ansehen'}).click();await b.page.waitForFunction(()=>document.querySelector('#gross').naturalWidth>0);
  await b.page.getByRole('button',{name:'Schliessen',exact:true}).click();
  b.page.once('dialog',dialog=>dialog.accept());await b.page.getByRole('button',{name:'Werk löschen'}).click();await b.page.waitForFunction(()=>document.querySelector('#status').textContent==='0 Werke');
  await b.page.locator('summary').click();await b.page.locator('#name').fill('Neue Schulklasse');await b.page.getByRole('button',{name:'Sammlung erstellen',exact:true}).click();
  await b.page.waitForFunction(()=>document.querySelector('#link').value.includes('#sammlung='));
  assert.deepEqual(errors,[]);console.log('PASS: two isolated iPads; camera form and stars; automatic sync; project attribution; offline queue survives reload; no duplicate uploads; deletion sync; dialog cancellation; mobile layout; teacher photo viewer, deletion and setup.');
 }finally{if(browser)await browser.close();await mf.dispose();}
})().catch(e=>{console.error(e);process.exitCode=1;});
