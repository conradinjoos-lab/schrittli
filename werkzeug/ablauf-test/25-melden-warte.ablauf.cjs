/* Offline geht keine Meldung verloren: App und Werkzeugseiten teilen die Warteschlange, gesendet wird beim nächsten Laden */
'use strict';
const WARTE='schrittli.melden.warte';
const speicher=p=>p.evaluate(n=>JSON.parse(localStorage.getItem(n)||'[]').length,WARTE);
const seite={ adresse:'/vorlagen/falten/', bereit:p=>p.waitForSelector('#melden-flagge',{state:'attached'}),
  melde:async(p,text)=>{ await p.locator('#melden-flagge .flagge').click(); await p.locator('#melden-flagge input[name=art]').first().check(); await p.locator('#melden-flagge textarea').fill(text); await p.locator('#melden-flagge .ja').click(); },
  ende:p=>p.locator('#melden-flagge .ende'), fehler:p=>p.locator('#melden-flagge .fehler') };
const app={ adresse:'/schule/', bereit:p=>p.waitForSelector('.fm-knopf'),
  melde:async(p,text)=>{ await p.evaluate(()=>go('werkzeuge')); await p.locator('.fm-knopf').click(); await p.locator('.modal .fm-arten input').first().check(); await p.locator('.modal .fm-text').fill(text); await p.locator('.modal [data-act=senden]').click(); },
  ende:p=>p.locator('.fm-ende'), fehler:p=>p.locator('.fm-fehler') };
const lauf=(o,titel)=>async t=>{ const k=await t.kontext({netz:'offline'}); let p=await k.seite(o.adresse); await o.bereit(p);
  await o.melde(p,'Eins'); await o.ende(p).waitFor(); t.pruefe((await o.ende(p).textContent()).includes('⚠ Offline'),titel+': Anzeige offline'); t.pruefe(await speicher(p)===1,titel+': nicht gemerkt');
  k.netz='viele'; await o.ende(p).waitFor({state:'detached'}); await o.melde(p,'Zwei'); await o.ende(p).waitFor(); t.pruefe((await o.ende(p).textContent()).includes('⚠ Zu viele'),titel+': Anzeige zu viele'); t.pruefe(await speicher(p)===2,titel+': zweite nicht gemerkt');
  k.netz='nein'; await o.ende(p).waitFor({state:'detached'}); await o.melde(p,'Drei'); await o.fehler(p).waitFor(); t.pruefe((await o.fehler(p).textContent()).includes('⚠'),titel+': Fehler fehlt'); t.pruefe(await speicher(p)===2,titel+': Abgelehntes gemerkt');
  k.netz='ok'; await p.reload(); await o.bereit(p); await p.waitForFunction(n=>!localStorage.getItem(n),WARTE); t.pruefe(k.meldungen.map(m=>m.text).join()==='Eins,Zwei',titel+': nachgesendet '+k.meldungen.map(m=>m.text));
  await p.reload(); await o.bereit(p); await t.warte(200); t.pruefe(k.meldungen.length===2,titel+': doppelt gesendet'); };
/* In der App gemerkt, auf der Werkzeugseite nachgesendet */
const quer=async t=>{ const k=await t.kontext({netz:'offline'}); let p=await k.seite(app.adresse); await app.bereit(p); await app.melde(p,'Quer'); await app.ende(p).waitFor();
  k.netz='ok'; await p.goto(t.basis+seite.adresse); await seite.bereit(p); await p.waitForFunction(n=>!localStorage.getItem(n),WARTE); t.pruefe(k.meldungen.at(-1).text==='Quer'&&k.meldungen.at(-1).app==='Schule','Herkunft '+JSON.stringify(k.meldungen.at(-1))); };
module.exports=[{name:'Melden offline Seite',lauf:lauf(seite,'Seite')},{name:'Melden offline App',lauf:lauf(app,'App')},{name:'Melden offline App zu Seite',lauf:quer}];
