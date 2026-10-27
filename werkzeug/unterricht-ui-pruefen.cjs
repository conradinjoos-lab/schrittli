/* Browser checks against local Workers/D1; production requests are intercepted. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {Miniflare,convertV4MiniflareOptions}=require('./anmelden/node_modules/miniflare');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/coni/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),origin='https://conradinjoos-lab.github.io',base=origin+'/schrittli/',api='https://schrittli-anmelden.conradinjoos.workers.dev';
(async()=>{
 const mf=new Miniflare(convertV4MiniflareOptions({modules:['worker.js','feedback.js','sammlung.js','unterricht.js'].map(name=>({type:'ESModule',path:path.join(__dirname,'anmelden',name),contents:fs.readFileSync(path.join(__dirname,'anmelden',name),'utf8')})),compatibilityDate:'2026-10-01',kvNamespaces:['KV'],d1Databases:['SAMMLUNG'],outboundService:async req=>Response.json({login:req.headers.get('Authorization')==='Bearer teacher'?'conradinjoos-lab':'other'})}));
 let browser;const errors=[],pages=[];
 try{
  const db=await mf.getD1Database('SAMMLUNG');for(const n of ['0001_sammlung.sql','0002_unterricht.sql'])await db.exec(fs.readFileSync(path.join(__dirname,'anmelden/sammlung-migrations',n),'utf8').replaceAll('\n',' '));
  const admin=async(p,b)=>{const r=await mf.dispatchFetch(api+'/unterricht/'+p,{method:b?'POST':'GET',headers:{Origin:origin,Authorization:'Bearer teacher','Content-Type':'application/json'},body:b?JSON.stringify(b):undefined});assert(r.ok,await r.clone().text());return r.json();};
  const a=await admin('erstellen',{name:'1a'}),other=await admin('erstellen',{name:'Andere Klasse'});
  browser=await chromium.launch({channel:'chrome',headless:true});
  fs.mkdirSync(path.join(root,'output/unterricht'),{recursive:true});
  async function client(teacher=false){
   const context=await browser.newContext({viewport:{width:1024,height:768}});let offline=false,shortLease=false;
   if(teacher)await context.addInitScript(()=>localStorage.setItem('werkstatt-anmeldung',JSON.stringify({token:'teacher',ablauf:0})));
   await context.route('**/*',async route=>{
    const req=route.request(),url=new URL(req.url());
    if(url.origin===api){
     if(offline)return route.abort('internetdisconnected');
     const r=await mf.dispatchFetch(req.url(),{method:req.method(),headers:{...req.headers(),origin},body:req.postDataBuffer()||undefined});
     let body=Buffer.from(await r.arrayBuffer());if(shortLease&&url.pathname==='/unterricht/status'&&r.ok){const d=JSON.parse(body);d.leaseMs=1500;body=Buffer.from(JSON.stringify(d));}
     return route.fulfill({status:r.status,headers:Object.fromEntries(r.headers),body});
    }
    if(url.hostname==='cdn.jsdelivr.net'&&url.pathname.includes('clipper'))return route.continue();
    if(url.origin!==origin)return route.abort();
    let rel=decodeURIComponent(url.pathname).replace(/^\/schrittli\//,'');if(!rel||rel.endsWith('/'))rel+='index.html';const file=path.resolve(root,rel);
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:'missing'});
    const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml'}[path.extname(file)]||'application/octet-stream';
    return route.fulfill({contentType:mime,body:fs.readFileSync(file)});
   });
   const page=await context.newPage();pages.push(page);page.setDefaultTimeout(12000);page.on('pageerror',e=>{errors.push(e.message);console.error('Browser:',e.stack);});
   return {context,page,offline:v=>offline=v,short:v=>shortLease=v};
  }
  const teacher=await client(true),one=await client(),two=await client(),separate=await client();
  await Promise.all([one.page.goto(base+'schule/#unterricht='+a.token),two.page.goto(base+'schule/#unterricht='+a.token),separate.page.goto(base+'schule/#unterricht='+other.token),teacher.page.goto(base+'kontrolle/unterricht.html')]);
  await one.page.getByRole('heading',{name:'Gleich geht’s los.'}).waitFor();await two.page.getByRole('heading',{name:'Gleich geht’s los.'}).waitFor();
  assert(!one.page.url().includes(a.token));assert.equal(await one.page.locator('.v3-lektion').count(),0);
  await teacher.page.locator('#modus').selectOption('single');await teacher.page.locator('#suche').fill('Windhover');
  await teacher.page.locator('input[value="flieger-windhover"]').check();
  assert(await one.page.getByRole('heading',{name:'Gleich geht’s los.'}).isVisible(),'Draft did not affect children');
  await teacher.page.locator('#freigeben').click();
  await one.page.waitForFunction(()=>view.name==='player'&&view.params.videoId==='flieger-windhover');await two.page.waitForFunction(()=>view.name==='player');
  assert(await separate.page.getByRole('heading',{name:'Gleich geht’s los.'}).isVisible(),'Other group unaffected');
  assert.equal(await one.page.locator('[data-act="back"]:visible').count(),0);
  await one.page.evaluate(()=>go('home'));assert.equal(await one.page.evaluate(()=>view.params.videoId),'flieger-windhover');
  await one.page.goto(base+'schule/#a=wl-wickeldrache');await one.page.waitForFunction(()=>view.name==='player');assert.equal(await one.page.evaluate(()=>view.params.videoId),'flieger-windhover');
  await one.page.locator('[data-act="geh"][data-i="0"]').click();await one.page.locator('[data-act="geh"][data-i="1"]').click();await one.page.locator('[data-act="geh"][data-i="2"]').click();
  await one.page.reload();await one.page.waitForFunction(()=>view.name==='player');assert.equal(await one.page.evaluate(()=>prog('flieger-windhover').step),2);
  const release=async policy=>{const g=(await admin('gruppen')).gruppen.find(g=>g.id===a.id);await admin('freigabe',{id:a.id,revision:g.revision,policy});};
  const refresh=async page=>{await page.evaluate(()=>Unterricht.sync()).catch(e=>{if(!/destroyed|navigation/.test(e.message))throw e;});};
  const catalog=JSON.parse(fs.readFileSync(path.join(root,'kontrolle/unterricht-katalog.json')));
  const planes=catalog.projects.filter(v=>v.area==='falten'&&/^flieger-/.test(v.id)).slice(0,3).map(v=>v.id);
  await release({mode:'projects',title:'Papierflieger',ids:planes,grade:2});await refresh(one.page);await one.page.evaluate(()=>go('home'));
  await one.page.waitForSelector('.v3-lektion');assert.equal(await one.page.locator('.v3-lektion').count(),3);
  await one.page.screenshot({path:path.join(root,'output/unterricht/kinder-projekte.png'),fullPage:true});
  await one.page.locator('.v3-lektion').first().click();await one.page.locator('[data-act="back"]').first().click();assert.equal(await one.page.locator('.v3-lektion').count(),3);
  await teacher.page.locator('#aktuell-laden').click();await teacher.page.locator('#modus').selectOption('templates');await teacher.page.locator('#kategorie').selectOption('Grundformen');
  await teacher.page.getByText('Als Favorit speichern',{exact:true}).click();await teacher.page.locator('#favorit-name').fill('Grundformen');await teacher.page.locator('#favorit-speichern button').click();
  await teacher.page.locator('#freigeben').click();await refresh(one.page);
  await one.page.waitForURL('**/vorlagen/**');await one.page.waitForFunction(()=>!document.documentElement.classList.contains('u-wartet')&&document.querySelector('.form'));
  const allowed=catalog.templates.filter(f=>f.group==='Grundformen').map(f=>f.id);
  const ids=await one.page.locator('.form').evaluateAll(nodes=>nodes.map(n=>n.dataset.id));assert(ids.length>0);assert(ids.every(id=>allowed.includes(id)));
  await one.page.screenshot({path:path.join(root,'output/unterricht/kinder-formen.png'),fullPage:true});
  await one.page.locator('.form[data-id="kreis"]').click();await one.page.waitForFunction(()=>new URLSearchParams(location.search).get('form')==='kreis');
  await one.page.goto(base+'vorlagen/?form=figur-spiderman');await one.page.waitForFunction(()=>!document.documentElement.classList.contains('u-wartet')&&document.querySelector('.form'));
  assert(allowed.includes(new URL(one.page.url()).searchParams.get('form')),'Unapproved direct motif rejected');
  await one.page.goto(base+'vorlagen/buegelperlen/');await one.page.waitForURL('**/vorlagen/**');await one.page.waitForFunction(()=>location.pathname==='/schrittli/vorlagen/'&&!document.documentElement.classList.contains('u-wartet'));
  const heroes=catalog.beads.filter(t=>t.group==='Superhelden'&&t.width<=8).slice(0,2).map(t=>t.id);assert.equal(heroes.length,2);
  await release({mode:'beads',title:'Superhelden',ids:heroes,grade:2,resize:false,recolor:false,simple:true});await refresh(one.page);
  await one.page.waitForURL('**/perlen/**');await one.page.waitForFunction(()=>!document.documentElement.classList.contains('u-wartet')&&document.querySelector('.tier'));
  assert.deepEqual((await one.page.locator('.tier').evaluateAll(ns=>ns.map(n=>n.dataset.id))).sort(),heroes.sort());
  await one.page.screenshot({path:path.join(root,'output/unterricht/kinder-perlen.png'),fullPage:true});
  assert.equal(await one.page.locator('#klasse:visible').count(),0);await one.page.locator('#anpassen').click();await one.page.locator('.pe-dialog').waitFor();assert.equal(await one.page.locator('#pe-breite:visible').count(),0);assert.equal(await one.page.locator('.pe-farben:visible').count(),0);
  await release({mode:'closed',title:'Alles geschlossen',ids:[]});await refresh(one.page);await one.page.getByRole('heading',{name:'Gleich geht’s los.'}).waitFor();assert.equal(await one.page.locator('.pe-dialog:visible').count(),0);
  await one.page.goto(base+'schule/');await one.page.getByRole('heading',{name:'Gleich geht’s los.'}).waitFor();
  await release({mode:'projects',title:'Windhover',ids:['flieger-windhover']});one.short(true);await refresh(one.page);await one.page.waitForFunction(()=>view.name==='player');one.offline(true);
  await one.page.getByRole('heading',{name:'Gleich geht’s los.'}).waitFor();assert.equal(await one.page.evaluate(()=>prog('flieger-windhover').step),2,'Work persisted after lease expiry');
  await one.page.reload();await one.page.getByRole('heading',{name:'Gleich geht’s los.'}).waitFor();
  one.offline(false);one.short(false);await refresh(one.page);await one.page.waitForFunction(()=>view.name==='player');
  await one.page.goto(base);await one.page.waitForURL('**/schule/');await one.page.waitForFunction(()=>view.name==='player');
  await release({mode:'closed',title:'Alles geschlossen',ids:[]});await refresh(one.page);await one.page.waitForFunction(()=>view.name==='unterricht');
  await release({mode:'free',title:'Freies Entdecken',ids:[]});await refresh(one.page);await one.page.waitForFunction(()=>view.name==='home');
  await release({mode:'closed',title:'Alles geschlossen',ids:[]});await refresh(one.page);
  await one.page.setViewportSize({width:1280,height:800});
  await one.page.goto(base+'vorlagen/');await one.page.getByRole('heading',{name:'Gleich geht’s los.'}).waitFor();
  assert.equal(await one.page.locator('#unterricht-warten').evaluate(el=>getComputedStyle(el).display),'block','Waiting screen stays readable on wide template layout');
  await one.page.screenshot({path:path.join(root,'output/unterricht/kinder-warten.png')});
  await release({mode:'templates',title:'Nur Kreis',ids:['kreis'],resize:false,simple:true});await refresh(one.page);await one.page.waitForFunction(()=>!document.documentElement.classList.contains('u-wartet')&&new URLSearchParams(location.search).get('form')==='kreis');
  assert.equal(await one.page.locator('#formen:visible').count(),0);assert(await one.page.locator('#b').isDisabled());
  await teacher.page.locator('#aktuell-laden').click();await teacher.page.locator('#modus').selectOption('templates');await teacher.page.locator('#kategorie').selectOption('Grundformen');
  fs.mkdirSync(path.join(root,'output/unterricht'),{recursive:true});await teacher.page.screenshot({path:path.join(root,'output/unterricht/lehrperson.png'),fullPage:true});
  await teacher.page.setViewportSize({width:390,height:844});assert(await teacher.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Teacher mobile width');await teacher.page.screenshot({path:path.join(root,'output/unterricht/lehrperson-mobil.png'),fullPage:true});
  assert.deepEqual(errors,[]);console.log('PASS: teacher draft/apply; automatic two-device sync; class isolation; single project/back/deep links/reload; topic choices; templates/categories; rejected direct tool links; bead restrictions; forced close during editor; offline expiry and recovery; family-route guard; saved progress; favorites; mobile layout.');
 }catch(e){for(const p of pages)console.error(await p.evaluate(()=>({path:location.pathname,policy:window.Unterricht?.policy,mode:document.querySelector('#modus')?.value,error:document.querySelector('#fehler')?.textContent,text:document.body.innerText.slice(0,1000)})).catch(()=>null));throw e;}finally{if(browser)await browser.close();await mf.dispose();}
})().catch(e=>{console.error(e);process.exitCode=1;});
