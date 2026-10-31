/* Flagge «Fehler melden» auf jeder Seite ausserhalb der App: sichtbar, 48 px, nichts überdeckt, Fenster passt, Meldung vollständig, im Druck weg */
'use strict';
const {execSync}=require('node:child_process'), path=require('node:path');
const WERKZEUGE=['armbaender','bohren','drucksachen','einfrieren','fachwoerter','falten','kiste','klasse','maschenprobe','mechanik','perlen','perlentier-bild','stromkreis','zaehlmuster'].map(n=>`/vorlagen/${n}/`);
const SEITEN=['/vorlagen/',...WERKZEUGE,...['index','klassen','material','rueckmeldungen','sammlung','unterricht','video','werke','wuensche'].map(n=>`/kontrolle/${n}.html`),'/privat/perlen-figuren/','/output/perlen-audit/','/output/perlen-audit/vorher/','/output/pruefung-gesamt/','/output/vorlagen-pruefung/'];
/* Neue Seite im Repo ohne Eintrag hier: Ablauf scheitert */
const OHNE=new Set(['index.html','familie.html','schule/index.html','quelle/p1.html','quelle/weiter.html']);
const fehltInListe=()=>execSync('git ls-files -co --exclude-standard *.html',{cwd:path.resolve(__dirname,'..','..'),encoding:'utf-8'}).split('\n').map(s=>s.trim()).filter(s=>s&&!OHNE.has(s)&&!SEITEN.includes('/'+s)&&!SEITEN.includes('/'+s.replace(/index\.html$/,'')));
const fenster=p=>p.evaluate(()=>{ const r=document.querySelector('#melden-flagge').shadowRoot; return {offen:!!r.querySelector('.fenster'),arten:[...r.querySelectorAll('input[name=art]')].map(i=>i.value),gewaehlt:r.querySelectorAll('input:checked').length,senden:r.querySelector('.ja')?r.querySelector('.ja').disabled:null}; });
const lauf=async t=>{ const k=await t.kontext(); const fehlt=[]; const neu=fehltInListe(); t.pruefe(!neu.length,'nicht in der Liste: '+neu.join(', '));
  for(const s of SEITEN){ const p=await k.seite(s);
    try{ await p.waitForSelector('#melden-flagge',{state:'attached',timeout:5000}); await t.warte(350); t.pruefeFlagge(await t.flagge(p),s);
      const fl=p.locator('#melden-flagge .flagge'); await fl.click(); const f=await fenster(p); t.pruefe(f.offen,s+': Fenster zu'); t.pruefe(f.gewaehlt===0,s+': vorgewählt'); t.pruefe(f.senden===true,s+': Senden frei');
      t.pruefe(f.arten.at(-1)==='anderes'&&f.arten.length>=3,s+': Arten '+f.arten);
      if(/^\/vorlagen\/[a-z]/.test(s)) t.pruefe(['mass','druck','bild'].every(a=>f.arten.includes(a)),s+': Arten '+f.arten);
      if(/kontrolle/.test(s)) t.pruefe(f.arten.includes('speichern'),s+': Arten '+f.arten);
      await p.locator('#melden-flagge input[name=art]').first().check(); await p.locator('#melden-flagge textarea').fill('Probe'); await p.locator('#melden-flagge .ja').click();
      await p.locator('#melden-flagge .ende.gut').waitFor({timeout:3000}); await p.locator('#melden-flagge .ende').waitFor({state:'detached',timeout:3000});
      const m=k.meldungen.at(-1); t.pruefe(m&&m.text==='Probe',s+': nichts angekommen');
      const u=new URL(p.url()); t.pruefe(m.adresse===u.pathname+u.search+u.hash&&m.seite&&m.geraet.startsWith('iPad')&&/^\d+×\d+$/.test(m.fenster)&&/^\d{4}-\d\d-\d\d-\w+/.test(m.stand)&&m.erfasst,s+': Felder '+JSON.stringify(m));
      await p.emulateMedia({media:'print'}); t.pruefe(!(await t.flagge(p)).sichtbar,s+': im Druck sichtbar'); await p.emulateMedia({media:'screen'});
      if(!/privat/.test(s)&&!/ohne-bau/.test(m.stand)&&!/Inhalt/.test(m.stand)) t.pruefe(false,s+': Inhaltsstand fehlt '+m.stand); }
    catch(e){ fehlt.push(e.message.split('\n')[0]); }
    await p.close(); }
  t.pruefe(!fehlt.length,fehlt.length+' von '+SEITEN.length+' Seiten: '+fehlt.join(' | ')); };
module.exports={name:'Melden auf allen Seiten',lauf};
module.exports.SEITEN=SEITEN;
