/* Offline smoke checks for both app editions. Does not replace visual/device tests. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const json = p => JSON.parse(read(p));
const source = read('quelle/p2.js').replace(/(?:render\(\);\s*)?fmKnopf\(\);\s*(?:render\(\);\s*)?boot\(\);\s*$/, '') + '\n' + read('quelle/rueckmeldung.js') + '\n' + read('quelle/schulwerke.js');
const reports = [];

function element() {
  const classes = new Set();
  return {
    innerHTML: '', hidden: false, dataset: {}, style: { setProperty() {}, removeProperty() {} },
    classList: { add: x => classes.add(x), remove: (...xs) => xs.forEach(x => classes.delete(x)), contains: x => classes.has(x), toggle(x, v) { if (v ?? !classes.has(x)) classes.add(x); else classes.delete(x); } },
    querySelector: () => null, querySelectorAll: () => [], contains: () => true,
    setAttribute() {}, removeAttribute() {}, addEventListener() {}, appendChild() {},
    remove() {}, scrollIntoView() {}, focus() {},
  };
}

function runtime(school, delayedContent = false) {
  const app = element();
  const nodes = new Map([['#app', app], ['#themecolor', element()]]);
  const children = new Map();
  let appHtml = '';
  Object.defineProperty(app, 'innerHTML', { get: () => appHtml, set: value => { appHtml = value; children.clear(); } });
  app.querySelector = selector => {
    if (!/^#[\w-]+$/.test(selector) || !appHtml.includes(`id="${selector.slice(1)}"`)) return null;
    if (!children.has(selector)) children.set(selector, element());
    return children.get(selector);
  };
  const listeners = new Map();
  const context = {
    console, URL, URLSearchParams, Blob, TextEncoder, TextDecoder, Math, Date, Promise,
    setTimeout: () => 1, clearTimeout() {}, setInterval: () => 1, clearInterval() {},
    requestAnimationFrame: () => 1, cancelAnimationFrame() {},
    innerWidth: 1024, innerHeight: 768, devicePixelRatio: 1,
    location: { protocol: 'http:', pathname: school ? '/schule/' : '/', origin: 'http://localhost', search: '', hash: '' },
    navigator: { userAgent: 'Offline smoke test', maxTouchPoints: 0 },
    history: { replaceState() {}, pushState() {} },
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    document: {
      querySelector: s => nodes.get(s) || app.querySelector(s),
      querySelectorAll: () => [], createElement: element,
      head: element(), body: element(), documentElement: element(),
      addEventListener: (name, fn) => listeners.set(name, fn),
    },
    addEventListener: (name, fn) => listeners.set(name, fn), scrollTo() {},
    fetch: async uri => {
      if (delayedContent && /(?:^|\/)schule\.json$/.test(uri)) await new Promise(resolve => setImmediate(resolve));
      const base = school ? path.join(root, 'schule') : root;
      const target = path.resolve(base, String(uri));
      if (!target.startsWith(root + path.sep) || !fs.existsSync(target)) return { ok: false };
      return { ok: true, json: async () => JSON.parse(fs.readFileSync(target, 'utf8')) };
    },
    SCHULE: school,
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'quelle/p2.js' });
  return { app, context, run: code => vm.runInContext(code, context), nodes, listeners };
}

function click(rt, act, data = {}) {
  const button = { dataset: { act, ...data } };
  rt.app.onclick({ target: { closest: () => button }, preventDefault() {} });
}

function rendered(rt) {
  return rt.app.innerHTML + (rt.app.querySelector('#ideen-liste')?.innerHTML || '');
}

function localAssets(html, school, label) {
  for (const [, value] of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
    if (/^(https?:|data:|blob:|#)/.test(value) || !/\.(?:webp|png|jpg|jpeg|svg|pdf)(?:$|[?#])/.test(value)) continue;
    const target = path.resolve(root, school ? 'schule' : '', decodeURIComponent(value.split(/[?#]/)[0]));
    assert(fs.existsSync(target), `${label}: missing local asset ${value}`);
  }
}

async function checkEdition(school) {
  const rt = runtime(school, true), name = school ? 'School' : 'Family';
  await rt.run('boot()');
  assert(rt.run('S.videos.length') >= 380, `${name}: content was not completely loaded`);
  for (const photo of json('anleitungen/anleitungen.json').anleitungen) {
    assert.equal(rt.run(`videoOf(${JSON.stringify(photo.id)}).areaId`), photo.areaId, `${name}: photo category lost during parallel loading: ${photo.id}`);
  }
  if (!school) rt.run("S.profiles=[{id:'test',name:'Lina',emoji:'🐱',color:'#f5cf64'}];S.activeProfile='test';");
  let screens = 0, cards = 0;
  for (const grade of school ? [1, 2, 3, 4, 5, 6] : [0]) {
    rt.run(`S.settings.klasse=${grade};`);
    for (const room of ['hand', 'werk']) {
      rt.run(`S.settings.raum=${JSON.stringify(room)}; homeSchule(document.querySelector('#app'));`);
      assert(rt.app.innerHTML.length > 200, `${name} home empty`);
      assert(!/\bundefined\b|\[object Object\]/.test(rt.app.innerHTML), `${name} home has invalid text`);
      localAssets(rt.app.innerHTML, school, `${name} home grade ${grade}`);
      const eligible = rt.run(`discoverVideos(${JSON.stringify(room)}).map(v=>v.id)`);
      const featured = rt.run(`featuredProjects(discoverVideos(${JSON.stringify(room)})).map(v=>({id:v.id,technique:!!v.grundtechnik,stufen:v.stufen}))`);
      assert(featured.length <= 6, `${name} featured row exceeds six choices`);
      assert.equal(new Set(featured.map(v => v.id)).size, featured.length, 'Duplicate featured projects');
      for (const project of featured) {
        assert(eligible.includes(project.id), `${name} featured project from wrong room/class: ${project.id}`);
        assert(!project.technique, `${name} basic technique featured as complete project: ${project.id}`);
        if (school) assert(project.stufen.includes(grade), `${name} featured grade mismatch: ${project.id}`);
      }
      screens++;
    }
    const areas = rt.run('S.areas.map(a=>a.id)');
    for (const area of areas) {
      rt.run(`view.params={};areaSchule(document.querySelector('#app'),areaOf(${JSON.stringify(area)}));`);
      const html = rendered(rt);
      localAssets(html, school, `${name} ${area}`);
      const expected = rt.run(`videosIn(${JSON.stringify(area)}).map(v=>v.id)`);
      const actual = [...html.matchAll(/<button\b[^>]*\bdata-act="video"[^>]*\bdata-id="([^"]+)"/g)].map(m => m[1]);
      for (const id of expected) assert(actual.includes(id), `${name} ${area} grade ${grade}: video omitted ${id}`);
      for (const id of actual) assert(expected.includes(id), `${name} ${area} grade ${grade}: unexpected video ${id}`);
      const projects = [...rt.app.querySelector('#ideen-liste').innerHTML.matchAll(/data-act="video" data-id="([^"]+)"/g)].map(m => m[1]);
      let previousLevel = 0;
      for (const id of projects) {
        assert(!rt.run(`videoOf(${JSON.stringify(id)}).grundtechnik`), 'Projects must not include basic lessons');
        const level = rt.run(`sammlungNiveau(videoOf(${JSON.stringify(id)}))`);
        assert(level >= previousLevel, `${name} ${area}: projects must stay in ascending difficulty across content groups`);
        previousLevel = level;
      }
      const hasBasics = rt.run(`videosIn(${JSON.stringify(area)}).some(v=>v.grundtechnik)`);
      assert.equal(!!rt.app.querySelector('#technik-grundlagen'), hasBasics, 'Only techniques with basics need a disclosure');
      if (hasBasics) assert.equal(rt.app.querySelector('#technik-grundlagen').open, false, 'Basics must start collapsed');
      cards += actual.length; screens++;
    }
  }
  rt.run("view.params={};S.settings.klasse=2;showCatalogue(document.querySelector('#app'),{room:'hand'});");
  click(rt, 'filter', { kind: 'foto' });
  assert(rt.run("S.videos.filter(v=>v.source.type==='bilder').length") > 0);
  const photoIds = [...rendered(rt).matchAll(/<button\b[^>]*\bdata-act="video"[^>]*\bdata-id="([^"]+)"/g)].map(m => m[1]);
  for (const id of photoIds) assert.equal(rt.run(`videoOf(${JSON.stringify(id)}).source.type`), 'bilder', 'Photo filter includes video');
  click(rt, 'reset');
  rt.app.oninput({ target: { id: 'ideen-suche', value: 'Wickeldrachen' } });
  assert(rendered(rt).includes('data-id="wl-wickeldrache"'), 'Search must find shortened project titles');
  rt.app.oninput({ target: { id: 'ideen-suche', value: 'zzzz-keine-idee' } });
  assert(!/data-act="video"/.test(rendered(rt)), 'Unknown search must not show projects');
  assert(rendered(rt).includes('data-act="reset"'), 'Empty search needs an escape action');
  click(rt, 'reset');
  assert(/data-act="video"/.test(rendered(rt)), 'Reset must restore project cards');
  assert(rt.run("catalogueMatches({id:'qa',title:'Nähen üben',source:{type:'youtube'},grundtechnik:true},'nahen','lernen')"), 'Search must tolerate accents');
  assert(!rt.run("catalogueMatches({id:'qa',title:'Nähen',source:{type:'youtube'},grundtechnik:true},'','projekte')"), 'Projects filter must exclude basic techniques');
  if (!school) {
    const funVideo = rt.run("S.videos.find(v=>areaOf(v.areaId)?.kind==='spass')?.id");
    if (funVideo) {
      rt.run(`view.params={};showCatalogue(document.querySelector('#app'),{area:areaOf(videoOf(${JSON.stringify(funVideo)}).areaId)});let qaGate=0;gateSpass=()=>qaGate++;`);
      click(rt, 'video', { id: funVideo });
      assert.equal(rt.run('qaGate'), 1, 'Family leisure video must still pass the star gate');
    }
  }
  reports.push(`${name}: ${screens} rendered screens, ${cards} checked project buttons; class filtering and local assets valid.`);
  reports.push(`${name}: curated features respect room/class, exclude basic techniques; search, photo filter and empty-state reset work.`);
  return rt;
}

function checkPhotoAssets() {
  let count = 0;
  for (const a of json('anleitungen/anleitungen.json').anleitungen) {
    const dir = path.join(root, 'anleitungen', a.ordner || a.id);
    const files = [a.titelbild, ...(a.vorlagen || []).map(x => x.datei), ...a.steps.flatMap(s => s.bilder || [])].filter(Boolean);
    for (const f of files) {
      assert(fs.existsSync(path.join(dir, f)), `${a.id}: missing ${f}`); count++;
    }
  }
  for (const id of json('vorschau/vorschau.json').bilder) assert(fs.existsSync(path.join(root, 'vorschau', id + '.webp')), `Missing video cover ${id}`);
  reports.push(`Photo instructions: ${count} image/template references valid; all registered video covers exist.`);
}

async function checkDiscoveryPaths() {
  let combinations=0;
  for(const school of [false,true]) {
    const rt=runtime(school,true);
    await rt.run('boot()');
    if(!school)rt.run("S.profiles=[{id:'test',name:'Lina'}];S.activeProfile='test';");
    for(const grade of school?[1,2,3,4,5,6]:[0]) {
      rt.run(`S.settings.klasse=${grade};S.settings.raum='werk';view={name:'home',params:{}};render();`);
      const home=rt.app.innerHTML;
      const positions=['zeit','verfahren','jahreszeiten','mehr'].map(id=>home.indexOf('id="'+id+'"'));
      assert(positions.every((p,i)=>p>=0&&(!i||p>positions[i-1])),'Home order must be time, techniques, seasons, then the rest');
      assert(home.indexOf('data-act="sammlung"')>positions[3],'Paper planes must stay in the final section');
      assert(!/id="grundlagen"|data-act="grundlagen"|Zum ersten Mal\?/.test(home),'Basics belong inside techniques, not on the home page');
      assert.equal((home.match(/data-act="jahreszeit"/g)||[]).length,4,'Four season tiles must be visible');
      localAssets(home,school,'Home with seasons');
      assert(!home.includes('v3-projects'),'Home must not begin with a mixed project feed');
      const areas=rt.run("S.areas.filter(a=>a.kind!=='spass'&&videosIn(a.id).length).map(a=>a.id)");
      for(const id of areas)assert(home.includes(`data-act="area" data-id="${id}"`),`Old room selection hides ${id}`);
      const learningArea=rt.run("S.areas.find(a=>videosIn(a.id).some(v=>v.grundtechnik))?.id");
      if(learningArea) {
        click(rt,'area',{id:learningArea});
        const disclosure=rt.app.querySelector('#technik-grundlagen');
        assert(disclosure&&!disclosure.open,'Entering a technique must leave basics closed');
        assert(rt.app.innerHTML.indexOf('id="technik-grundlagen"')<rt.app.innerHTML.indexOf('id="projekte-titel"'),'Basics must sit above projects');
        const basicsHtml=rt.app.innerHTML.match(/<details\b[^>]*id="technik-grundlagen"[^>]*>([\s\S]*?)<\/details>/)?.[1]||'';
        const ids=[...basicsHtml.matchAll(/data-act="video" data-id="([^"]+)"/g)].map(m=>m[1]);
        const expected=rt.run(`videosIn(${JSON.stringify(learningArea)}).filter(v=>v.grundtechnik).map(v=>v.id)`);
        assert.deepEqual(ids.sort(),Array.from(expected).sort(),'Disclosure must contain exactly the eligible basic lessons');
        const projects=rt.app.querySelector('#ideen-liste').innerHTML;
        disclosure.open=true;disclosure.ontoggle();
        assert.equal(rt.run('view.params.grundlagenOffen'),true);
        disclosure.open=false;disclosure.ontoggle();
        assert.equal(rt.run('view.params.grundlagenOffen'),false);
        assert.equal(rt.app.querySelector('#ideen-liste').innerHTML,projects,'Toggling basics must not hide or change projects');
        disclosure.open=true;disclosure.ontoggle();
        rt.run('globalThis.qaPlayerScreen=SCREENS.player;SCREENS.player=()=>{};');
        click(rt,'video',{id:ids[0]});
        assert.equal(rt.run('playerReturn.params.grundlagenOffen'),true,'Opening a lesson must remember the expanded basics');
        rt.run(`SCREENS.player=qaPlayerScreen;backToIdeas(areaOf(${JSON.stringify(learningArea)}),false);`);
        assert.equal(rt.app.querySelector('#technik-grundlagen').open,true,'Return from a lesson must restore the expanded basics');
        click(rt,'back');assert.equal(rt.run('view.name'),'home');
        click(rt,'area',{id:learningArea});
        assert.equal(rt.app.querySelector('#technik-grundlagen').open,false,'A new technique visit must start collapsed');
        click(rt,'back');
      }
      for(const season of rt.run('JAHRESZEITEN.map(j=>j.id)')) {
        rt.run("go('home')");click(rt,'jahreszeit',{id:season});
        assert.equal(rt.run('view.params.jahreszeit'),season);
        let ids=[...rendered(rt).matchAll(/data-act="video" data-id="([^"]+)"/g)].map(m=>m[1]);
        let expected=rt.run("discoverVideos('').filter(v=>inJahreszeit(v,"+JSON.stringify(season)+")).map(v=>v.id)");
        assert.deepEqual([...ids].sort(),Array.from(expected).sort(),'Season results must respect project assignment and grade');
        localAssets(rendered(rt),school,'Season catalogue');
        rt.app.onchange({target:{id:'ideen-zeit',value:'10'}});
        ids=[...rendered(rt).matchAll(/data-act="video" data-id="([^"]+)"/g)].map(m=>m[1]);
        expected=rt.run("discoverVideos('').filter(v=>inJahreszeit(v,"+JSON.stringify(season)+")&&zeitPasst(v,'10')).map(v=>v.id)");
        assert.deepEqual([...ids].sort(),Array.from(expected).sort(),'Season and work-time filters must combine');
        click(rt,'reset');assert.equal(rt.run('view.params.jahreszeit'),'');
      }
      for(const topic of ['',...rt.run('THEMENFELDER.map(f=>f.id)')])for(const time of ['','5','10','15','offen']) {
        rt.run(`view={name:'entdecken',params:{thema:${JSON.stringify(topic)},zeit:${JSON.stringify(time)},sort:'zeit',kind:'projekte'}};render();`);
        const ids=[...rendered(rt).matchAll(/data-act="video" data-id="([^"]+)"/g)].map(m=>m[1]);
        const expected=rt.run(`discoverVideos('').filter(v=>!v.grundtechnik&&zeitPasst(v,${JSON.stringify(time)})&&(!${JSON.stringify(topic)}||inThemenfeld(v,${JSON.stringify(topic)}))).map(v=>v.id)`);
        assert.deepEqual([...ids].sort(),Array.from(expected).sort(),'Combined class/topic/time filters mismatch');
        let previous=0;
        for(const id of ids){const minutes=rt.run(`arbeitszeit(videoOf(${JSON.stringify(id)}))`)??Infinity;assert(minutes>=previous,'Known work times must sort before unknown times');previous=minutes;}
        combinations++;
      }
      click(rt,'reset');
      assert.equal(rt.run('view.params.thema'),'');assert.equal(rt.run('view.params.zeit'),'');
    }
    assert.equal(rt.run("arbeitszeit({dauer:'15:00',steps:[{t:900}]})"),null,'Video duration must never become work time');
    assert(!rt.run("zeitPasst({dauer:'5:00'},'15')"),'Unknown times must not pass a short-project filter');
    rt.run("view={name:'entdecken',params:{}};render();");
    rt.app.onchange({target:{id:'ideen-zeit',value:'10'}});
    rt.app.onchange({target:{id:'ideen-thema',value:'spiel'}});
    rt.app.onchange({target:{id:'ideen-sortierung',value:'zeit'}});
    assert.equal(rt.run('view.params.zeit'),'10');assert.equal(rt.run('view.params.thema'),'spiel');assert.equal(rt.run('view.params.sort'),'zeit');
    rt.run("LP21=null;view={name:'home',params:{}};render();");
    assert(rt.app.innerHTML.includes('id="verfahren"'),'Missing curriculum data must not break the overview');
  }
  reports.push(`Discovery: ${combinations} class/topic/time combinations; time-first home, four seasons, collapsed technique basics, lesson return, unknown durations and absent curriculum data checked.`);
}

function checkVideoData() {
  const ids = new Set();
  const videos = json('schule/schule.json').videos;
  for (const video of videos) {
    assert(!ids.has(video.id), `Duplicate school project ID: ${video.id}`);
    ids.add(video.id);
    if (video.source.type === 'youtube') assert(/^[A-Za-z0-9_-]{11}$/.test(video.source.id), `${video.id}: invalid YouTube ID`);
    for (const [index, step] of video.steps.entries()) {
      assert(Number.isFinite(step.t) && step.t >= 0, `${video.id}: invalid step timestamp`);
      if (index) assert(step.t >= video.steps[index - 1].t, `${video.id}: steps out of order`);
    }
  }
  reports.push(`${videos.length} video records: unique IDs, valid source IDs and ordered step times.`);
}

function checkPlayer(rt) {
  rt.run(`
    updatePlayerUI=()=>{}; speak=()=>{};
    let clock=0, pauses=0, played=0;
    P={steps:[{t:0,label:'Falten'},{t:10,label:'Drehen'},{t:25,label:'Fertig'}],idx:0,mode:'playing',school:false,pr:{},lastSave:0,playAt:Date.now(),needsTap:false,
      api:{ready:true,time:()=>clock,duration:()=>40,state:()=>'playing',pause:()=>pauses++,play:()=>played++,seek:t=>{clock=t}}};
    clock=9; tickPlayer();
  `);
  assert.equal(rt.run('P.mode'), 'playing', 'Player must not stop before a step boundary');
  rt.run('clock=10; tickPlayer();');
  assert.equal(rt.run('P.mode'), 'stepdone', 'Player must pause at the next step');
  assert.equal(rt.run('pauses'), 1);
  rt.run('nextStep();');
  assert.equal(rt.run('P.idx'), 1);
  assert.equal(rt.run('P.mode'), 'playing');
  assert.equal(rt.run('clock'), 10);
  assert.equal(rt.run('P.pr.step'), 1, 'Next must immediately persist the selected step');
  assert.equal(rt.run('P.pr.pos'), 10, 'Next must immediately persist the seek position');
  rt.run('clock=25;P.seekAt=0;tickPlayer();');
  assert.equal(rt.run('P.mode'), 'stepdone');
  rt.run('replayStep();');
  assert.equal(rt.run('P.idx'), 1, 'Replay must stay on the current step');
  assert.equal(rt.run('clock'), 10, 'Replay must seek to the current step start');
  assert.equal(rt.run('P.pr.step'), 1);
  assert.equal(rt.run('P.pr.pos'), 10);
  rt.run('P.pr.done=false;P.idx=2;jumpStep();');
  assert.equal(rt.run('P.pr.step'), 2, 'Jump must immediately persist the selected step');
  assert.equal(rt.run('P.pr.pos'), 25);
  assert.equal(rt.run('P.pr.done'), false, 'Jumping to the final step must not complete the video');
  rt.run('clock=27;userPause();');
  assert.equal(rt.run('P.pr.pos'), 27, 'Pause must retain the exact playback position');
  rt.run("P.steps=[{t:-1,label:'Material',material:['papier']}];P.idx=0;P.mode='start';startPlaying(false);");
  assert.equal(rt.run('P.mode'), 'material', 'Material-only imported video must not index beyond its only step');
  reports.push('Video engine: boundary pause, next/replay and immediate progress retention work; jumping does not imply completion.');
}

function checkBuiltPages() {
  const js = read('quelle/p2.js').replace(/boot\(\);\s*$/, '').trim();
  const playerCssPath = path.join(root, 'quelle/player-design.css');
  for (const file of ['index.html', 'schule/index.html']) {
    const html = read(file);
    assert(html.includes(js), `${file}: stale or incomplete JavaScript build`);
    assert(!/maximum-scale=1|user-scalable=no/.test(html), `${file}: pinch zoom is still disabled`);
    if (fs.existsSync(playerCssPath)) assert(html.includes(fs.readFileSync(playerCssPath, 'utf8').trim()), `${file}: player stylesheet missing from build`);
    assert(html.includes(read('quelle/entdecken-design.css').trim()),`${file}: discovery stylesheet missing from build`);
    assert(html.includes(read('quelle/rueckmeldung.js').trim()),`${file}: feedback code missing from build`);
    assert(html.includes(read('quelle/rueckmeldung.css').trim()),`${file}: feedback stylesheet missing from build`);
    assert(html.includes(read('quelle/schulwerke.js').trim()),`${file}: school collection code missing`);
    assert(html.includes(read('quelle/schulwerke.css').trim()),`${file}: school collection stylesheet missing`);
    assert(html.lastIndexOf('boot();')>html.indexOf(read('quelle/schulwerke.js').trim()),`${file}: boot must follow module initialization`);
    if (file.startsWith('schule/')) assert(html.includes('window.SCHULE=true;'), `${file}: school edition flag missing`);
    new vm.Script(html.slice(html.lastIndexOf('<script>') + '<script>'.length, html.lastIndexOf('</script>')), { filename: file });
  }
  reports.push('Both generated pages contain current JavaScript and player CSS, parse successfully and allow zoom.');
}

function checkAppAssets() {
  const identities = new Set();
  const png = (file, size) => {
    const bytes = fs.readFileSync(file);
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `Not a PNG: ${file}`);
    assert.equal(bytes.readUInt32BE(16), size, `Wrong icon width: ${file}`);
    assert.equal(bytes.readUInt32BE(20), size, `Wrong icon height: ${file}`);
    assert.equal(bytes[25], 2, `Home screen icon must use opaque RGB: ${file}`);
  };
  for (const school of [false, true]) {
    const prefix = school ? 'schule/' : '';
    const manifestUrl = new URL(prefix + 'manifest.webmanifest', 'https://example.test/schrittli/');
    const manifest = json(prefix + 'manifest.webmanifest');
    const start = new URL(manifest.start_url, manifestUrl), scope = new URL(manifest.scope, manifestUrl);
    assert.equal(start.pathname, '/schrittli/' + prefix, 'Installation must launch the correct app edition');
    assert.equal(start.origin, scope.origin);
    assert(start.pathname.startsWith(scope.pathname), 'Start URL must be inside app scope');
    identities.add(new URL(manifest.id, start).href);
    assert.equal(manifest.display, 'standalone');
    for (const size of [192, 512]) assert(manifest.icons.some(i => i.sizes === `${size}x${size}` && i.purpose === 'any'));
    assert(manifest.icons.some(i => i.purpose === 'maskable'), 'Android adaptive icon missing');
    for (const icon of manifest.icons) {
      const file = path.resolve(root, prefix, icon.src);
      assert(file.startsWith(root + path.sep), 'Icon outside the project');
      png(file, Number(icon.sizes.split('x')[0]));
    }
    const html = read(prefix + 'index.html');
    assert(html.includes('<link rel="manifest" href="manifest.webmanifest">'), 'App manifest not linked');
    const apple = html.match(/<link rel="apple-touch-icon" sizes="180x180" href="([^"]+)"/);
    assert(apple, 'Apple home screen icon not linked');
    png(path.resolve(root, prefix, apple[1]), 180);
    localAssets(html.slice(0, html.indexOf('</head>')), school, prefix + 'index.html');
  }
  assert.equal(identities.size, 2, 'Family and school must have separate install identities');
  png(path.join(root, 'grafik/marke/icon-32.png'), 32);
  reports.push('Home screen assets: both manifests launch the correct edition; Apple, Android and favicon PNG dimensions/opacity and links verified.');
}

async function checkInstallFlow() {
  const rt = runtime(true);
  let shown = '';
  rt.context.captureInstall = html => { shown = html; };
  rt.run('modal=html=>captureInstall(html);');
  for (const [agent, touches, expected] of [
    ['iPad', 5, 'Zum Home-Bildschirm'], ['iPhone', 5, 'Zum Home-Bildschirm'], ['Macintosh', 5, 'Zum Home-Bildschirm'],
    ['Android', 5, 'Installieren und Verknüpfung erstellen'], ['Desktop', 0, 'Am Computer']
  ]) {
    rt.context.navigator.userAgent = agent;
    rt.context.navigator.maxTouchPoints = touches;
    await rt.run('appSpeichern()');
    assert(shown.includes(expected), `Install instructions missing for ${agent}`);
    localAssets(shown, true, 'Install dialog');
  }
  rt.context.navigator.standalone = true;
  assert(!rt.run('v3Fuss()').includes('app-speichern'), 'Do not offer saving when already running as an app');
  rt.context.navigator.standalone = false;
  let prompted = 0, prevented = false;
  shown = '';
  rt.listeners.get('beforeinstallprompt')({preventDefault() {prevented = true;}, async prompt() {prompted++;}, userChoice: Promise.resolve({outcome:'dismissed'})});
  await rt.run('appSpeichern()');
  assert(prevented && prompted === 1 && !shown, 'Use the available native install prompt once');
  await rt.run('appSpeichern()');
  assert(shown, 'After dismissal, the saving guide must still be available');
  rt.listeners.get('appinstalled')();
  assert(!rt.run('v3Fuss()').includes('app-speichern'), 'Hide saving after successful installation');
  reports.push('Saving flow: iPad desktop mode, iPhone/iPad, Android and desktop guidance; native prompt, dismissal and installed state checked.');
}

function checkPhotoFlow() {
  const rt = runtime(true);
  let historyUrl = null;
  rt.context.history.replaceState = (_state, _title, url) => { historyUrl = url; };
  rt.run(`
    confetti=()=>{};
    let qaRoute='';go=(name)=>{qaRoute=name;};
    const qaPhoto={id:'qa-final-check',title:'Mein Werk',areaId:'holz',source:{type:'bilder'},quelle:'anleitung',bildpfad:'',steps:[{text:'Zeig dein Werk.',bilder:[],zeigen:'Zeig es deiner Lehrperson.'}]};
    S.videos.push(qaPhoto);
    SCREENS.anleitung(document.querySelector('#app'),{v:qaPhoto,school:true});
  `);
  assert(rt.app.innerHTML.includes('data-act="geh"'), 'Photo intro must offer a start action');
  click(rt, 'geh', { i: '0' });
  assert(rt.app.innerHTML.includes('data-act="gesehen"'), 'Teacher checkpoint must be visible');
  click(rt, 'geh', { i: '1' });
  assert(!rt.run("prog('qa-final-check').done"), 'Final teacher checkpoint must prevent completion');
  click(rt, 'gesehen');
  click(rt, 'geh', { i: '1' });
  assert(rt.run("prog('qa-final-check').done"), 'Confirmed final checkpoint must allow completion');
  assert(rt.app.innerHTML.includes('data-act="feedback"'), 'Photo completion must offer feedback');
  click(rt,'feedback');assert.equal(rt.run('qaRoute'),'feedback','Photo feedback must open the survey');
  click(rt, 'back');
  assert.equal(historyUrl, '/schule/', 'Shared photo back must remove the QR hash');
  assert.equal(rt.run('qaRoute'), 'home');
  reports.push('Photo flow: final teacher checkpoint enforced, confirmation completes guide, shared-link back clears the hash.');
}

function checkPlayerScreens() {
  let states = 0;
  for (const withSteps of [true, false]) {
    const rt = runtime(true);
    rt.run(`
      makePlayer=()=>({ready:true,time:()=>0,duration:()=>40,state:()=>'paused',play(){},pause(){},seek(){},rate(){},destroy(){}});
      const qaVideo={id:'qa-player',title:'Fadenherz',areaId:'holz',source:{type:'youtube',id:'IONISsDIxMI'},steps:${withSteps ? "[{t:0,label:'Faden spannen'},{t:10,label:'Fertig'}]" : '[]'},material:[]};
      S.videos.push(qaVideo);
      SCREENS.player(document.querySelector('#app'),{videoId:qaVideo.id});
    `);
    for (const mode of ['start', 'playing', 'paused', 'stepdone', 'ended', 'error']) {
      rt.run(`P.mode=${JSON.stringify(mode)};updatePlayerUI();`);
      const overlay = rt.app.querySelector('#overlay');
      const controls = rt.app.querySelector('#controls');
      assert(controls.innerHTML.includes('<button'), `Player controls missing in ${mode}`);
      assert(!/undefined|NaN/.test(controls.innerHTML), `Invalid player control output in ${mode}`);
      assert(!rt.app.querySelector('#schritte').hidden, 'Step overview must stay visible beside the video');
      assert.equal(rt.app.querySelector('#pl-position').textContent, withSteps ? 'Schritt 1 von 2' : 'Frei schauen', 'Playback position must remain visible in every state');
      assert.equal(controls.innerHTML.includes('data-act="nextstep"'), withSteps, 'Step videos need a direct next-step button');
      if (mode === 'playing') assert(overlay.hidden, 'Overlay must not obscure playback');
      if (mode === 'error') assert(overlay.innerHTML.includes('data-act="retry"'), 'Video error needs retry action');
      if (mode === 'stepdone') assert(rt.app.querySelector('#pl-current').innerHTML.includes('Jetzt du!'), 'Step stop needs make-it prompt');
      states++;
    }
    if (withSteps) {
      for (const mode of ['playing', 'paused', 'stepdone']) {
        rt.run(`P.idx=0;P.mode=${JSON.stringify(mode)};updatePlayerUI();`);
        click(rt, 'nextstep');
        assert.equal(rt.run('P.idx'), 1, `Skip must advance while ${mode}`);
        assert.equal(rt.run('P.mode'), 'playing', 'Skip must play the selected step');
        assert.equal(rt.app.querySelector('#pl-position').textContent, 'Schritt 2 von 2');
        assert.match(rt.app.querySelector('#controls').innerHTML, /data-act="nextstep"[^>]*disabled/, 'Skip must be disabled on the final step');
        click(rt, 'nextstep');
        assert.equal(rt.run('P.mode'), 'playing', 'Skipping at the end must not complete an unfinished video');
        click(rt, 'prevstep');
        assert.equal(rt.run('P.idx'), 0);
        assert.equal(rt.app.querySelector('#pl-position').textContent, 'Schritt 1 von 2');
      }
      click(rt, 'dot', {i:'1'});
      assert(!rt.app.querySelector('#schritte').hidden, 'Selecting a step must keep the normal overview open');
      rt.run("P.pr.step=1;P.idx=1;P.mode='start';updatePlayerUI();");
      assert(rt.app.querySelector('#overlay').innerHTML.includes('data-act="resume"'), 'Second step in a video without materials must offer resume');
    }
  }
  reports.push(`Video interface: ${states} state renders with/without steps, open overview, persistent step count, direct next/back navigation and final-step guard.`);
}

function checkReturnNavigation() {
  const rt = runtime(true), scrolls = [];
  rt.context.scrollY = 611;
  rt.context.scrollTo = (_x, y) => { scrolls.push(y); rt.context.scrollY = y; };
  rt.context.requestAnimationFrame = callback => { callback(); return 1; };
  rt.run(`
    render=()=>{};leaveScreen=()=>{};
    view={name:'entdecken',params:{room:'hand',query:'Herz',kind:'projekte',zeit:'15',thema:'spiel',sort:'zeit'}};
    go('player',{videoId:'zw-karte-herz-weben'});
  `);
  assert.equal(rt.run('playerReturn.name'), 'entdecken', 'Opening a project must remember its catalogue');
  assert.equal(rt.run('playerReturn.params.query'), 'Herz');
  assert.equal(rt.run('playerReturn.scroll'), 611);
  rt.run("backToIdeas(areaOf('weben'),false);");
  assert.equal(rt.run('view.name'), 'entdecken', 'Back must return to discovery rather than the category');
  assert.equal(rt.run('view.params.query'), 'Herz', 'Back must preserve the search');
  assert.equal(rt.run('view.params.kind'), 'projekte', 'Back must preserve the chosen filter');
  assert.equal(rt.run('view.params.room'), 'hand', 'Back must preserve the chosen room');
  assert.equal(rt.run('view.params.zeit'),'15','Back must preserve work time');
  assert.equal(rt.run('view.params.thema'),'spiel','Back must preserve topic');
  assert.equal(rt.run('view.params.sort'),'zeit','Back must preserve ordering');
  assert.equal(scrolls.at(-1), 611, 'Back must restore catalogue scroll position');
  rt.run("playerReturn=null;backToIdeas(areaOf('weben'),false);");
  assert.equal(rt.run('view.name'), 'area', 'Directly opened project must fall back to its category');
  assert.equal(rt.run('view.params.id'), 'weben');
  reports.push('Navigation: return preserves discovery room, query, filter and scroll; direct links fall back to the category.');
}

function checkModalKeyboard() {
  const rt = runtime(true), events = new Map(), frames = [], attributes = new Map();
  const doc = rt.context.document;
  let removed = false, restoreCount = 0;
  const previous = { isConnected: true, focus() { doc.activeElement = this; restoreCount++; } };
  const focusTarget = () => ({ getClientRects: () => [{}], focus() { doc.activeElement = this; } });
  const first = focusTarget(), last = focusTarget(), dialog = focusTarget(), heading = {};
  dialog.setAttribute = (key, value) => attributes.set(key, value);
  const backdrop = element();
  backdrop.querySelector = selector => selector === '.modal' ? dialog : selector === 'h2' ? heading : null;
  backdrop.querySelectorAll = () => [first, last];
  backdrop.addEventListener = (name, callback) => events.set(name, callback);
  backdrop.remove = () => { removed = true; };
  doc.createElement = () => backdrop;
  doc.activeElement = previous;
  rt.context.requestAnimationFrame = callback => { frames.push(callback); return frames.length; };
  rt.run("modal('<h2>Deine Klasse</h2><button>Erste</button><button>Letzte</button>');");
  assert(backdrop.innerHTML.includes('role="dialog"') && backdrop.innerHTML.includes('aria-modal="true"'), 'Modal needs dialog semantics');
  assert.equal(attributes.get('aria-labelledby'), heading.id, 'Modal needs its visible heading as label');
  frames.shift()();
  assert.equal(doc.activeElement, first, 'Opening modal must focus its first control');
  const key = (name, shiftKey = false) => {
    let prevented = false;
    events.get('keydown')({ key: name, shiftKey, preventDefault() { prevented = true; }, stopPropagation() {} });
    return prevented;
  };
  doc.activeElement = last;
  assert(key('Tab') && doc.activeElement === first, 'Tab at the end must stay inside the modal');
  assert(key('Tab', true) && doc.activeElement === last, 'Shift+Tab at the beginning must stay inside the modal');
  assert(key('Escape'), 'Escape must be handled by the modal');
  assert(removed, 'Escape must close the modal');
  assert.equal(doc.activeElement, previous, 'Closing modal must restore the trigger focus');
  key('Escape');
  assert.equal(restoreCount, 1, 'Closing an already closed modal must not move focus again');
  reports.push('Modal keyboard: named dialog, initial focus, Tab/Shift+Tab containment, Escape and trigger-focus restoration work.');
}

async function checkPlaneCollection(){
 for(const school of [false,true]){
  const rt=runtime(school);await rt.run('boot()');
  const ids=rt.run("sammlungVideos('papierflieger').map(v=>v.id)");
  assert.equal(ids.length,25);assert(ids.every(id=>id.startsWith('flieger-')||['kat-papierflieger','zw-papierflieger'].includes(id)));
  for(let klasse=1;klasse<=6;klasse++){
   rt.run(`S.settings.klasse=${klasse};go('sammlung',{id:'papierflieger'})`);
   for(const niveau of [1,2,3]){
    click(rt,'niveau',{niveau:String(niveau)});
    const html=rt.app.querySelector('#sammlung-liste').innerHTML;
    const shown=[...html.matchAll(/data-act="video" data-id="([^"]+)"/g)].map(m=>m[1]);
    assert(shown.length>0,`Class ${klasse}: no planes at level ${niveau}`);
    assert(shown.every(id=>ids.includes(id)&&rt.run(`sammlungNiveau(videoOf(${JSON.stringify(id)}))`)===niveau));
    localAssets(html,school,'Paper planes');
   }
  }
  rt.run("S.settings.klasse=1;go('sammlung',{id:'papierflieger',niveau:1})");
  click(rt,'video',{id:'flieger-windhover'});click(rt,'back');
  assert.equal(rt.run('view.name'),'sammlung');assert.equal(rt.run('view.params.niveau'),1);
 }
 reports.push('Paper planes: 25 relevant models, all six grades and three difficulty filters, image assets and return navigation checked.');
}

(async () => {
  if(process.argv.includes('--discovery')) {
    await checkEdition(false);await checkEdition(true);await checkDiscoveryPaths();checkReturnNavigation();await checkPlaneCollection();
    console.log(reports.join('\n'));return;
  }
  if (process.argv.includes('--engine')) {
    checkPlayer(runtime(true));
    checkPhotoFlow();
    checkPlayerScreens();
    console.log(reports.join('\n'));
    return;
  }
  checkVideoData();
  checkPhotoAssets();
  await checkEdition(false);
  const school = await checkEdition(true);
  checkPlayer(school);
  checkPhotoFlow();
  checkPlayerScreens();
  checkReturnNavigation();
  checkModalKeyboard();
  await checkDiscoveryPaths();
  await checkPlaneCollection();
  await checkInstallFlow();
  if (process.argv.includes('--built')) { checkBuiltPages(); checkAppAssets(); }
  console.log(reports.join('\n'));
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
