# Auftrag: Schritte («Stopps») für YouTube-Lernvideos schreiben

Du arbeitest für die Kinder-Lern-App «Schrittli» (Schulversion, TTG-Unterricht 1.–6. Klasse, Schweiz). Der Player hält das Video am Ende jedes Schritts automatisch an; das Kind macht den Schritt nach und tippt dann «Weiter». Deine Aufgabe: für jedes dir zugeteilte Video die Schritte mit Zeitmarken schreiben und als JSON-Datei ablegen.

## Ausgabe

Pro Video genau eine Datei:
`/tmp/claude-0/-home-claude/52bcf20d-745b-53d1-bc04-f35897a21c52/scratchpad/round2/<VIDEOID>.json`

```json
{
 "id": "<kurz-id, siehe Liste>",
 "areaId": "<Verfahren, siehe Liste>",
 "stufen": [2,3],
 "title": "<kurzer Titel, max. 5 Wörter, Kind-tauglich>",
 "source": {"type":"youtube","id":"<VIDEOID>"},
 "kanal": "<Kanalname>",
 "dauer": "m:ss",
 "alter": "ab 6",
 "sprache": "Hochdeutsch" | "Schweizerdeutsch" | "ohne Sprache",
 "hinweis": "<1 Satz für Lehrperson: Material, Stolperstein>",
 "steps": [{"t": 0, "label": "Zuschauen: …"}, {"t": 12, "label": "…"}],
 "task": {"text":"", "deliverable":"keine"}
}
```

## Regeln für die Schritte

- `t` = Sekunde, an der die Anweisung für diesen Schritt **beginnt**. Das Video stoppt automatisch kurz vor dem `t` des nächsten Schritts. Darum: Ein Schritt muss so geschnitten sein, dass das Kind am Stopp etwas Konkretes nachmachen kann.
- Erster Schritt bei `t: 0`. Zeigt das Video zuerst das Material, heisst der Schritt «Material richten: Wolle, Schere, …» (das Kind holt es) und der zweite Schritt beginnt genau dort, wo das Materialbild endet – nicht erst, wenn die Sprecherin die erste Anweisung sagt. Nur wenn das Video mit einer Vorschau des fertigen Werks beginnt, heisst der erste Schritt «Zuschauen: …».
- Gesprochene Anweisungen hinken dem Bild meist 1–2 Sekunden hinterher. Setze `t` darum 1–2 Sekunden **vor** den Beginn der gesprochenen Anweisung bzw. auf den Bildwechsel. Im Zweifel ein Kontaktblatt (Schritt 2 unten) mit engen Zeiten um die fragliche Stelle machen und den Bildwechsel ablesen.
- 6–10 Schritte für 1–4 Minuten Video; bei langen Videos (> 5 Min) höchstens 12. Nicht jeden Satz zu einem Schritt machen – ein Schritt = eine Handlung, die man nachmachen kann.
- Letzter Schritt am Beginn des Abspanns/Outros, Label z. B. «Fertig – schau dein Werk an». So verschwindet das Kanal-Geschwätz am Schluss hinter dem Stopp.
- Labels: höchstens 8 Wörter, Befehlsform oder knappe Beschreibung, Sprache für 1.–3. Klasse, Schweizer Rechtschreibung (ss statt ß), keine Anführungszeichen, kein Emoji. Beispiele: «Faden einfädeln, Knoten ans Ende», «Rechter Faden über die Mitte», «Immer so weiter bis zum Schluss».
- `stufen` und `areaId` aus der Liste übernehmen (nicht ändern).

## So kommst du an den Inhalt (Chrome des Nutzers)

Lade zuerst die Werkzeuge in einem Aufruf:
`ToolSearch` mit query `select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__javascript_tool,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__tabs_close_mcp,mcp__claude-in-chrome__browser_batch`

Dann `tabs_context_mcp` (createIfEmpty true) und **`tabs_create_mcp`** – arbeite nur in deinem eigenen neuen Tab (merke dir dessen tabId). Andere Agenten arbeiten parallel in anderen Tabs; fasse deren Tabs nicht an. Nutze `browser_batch`, um navigate + wait + javascript in einem Aufruf zu bündeln.

### 1. Transkript holen

Pro Video: `navigate` auf `https://www.youtube.com/watch?v=<VIDEOID>`, `computer` wait 3 s, dann dieses JavaScript (unverändert) mit `javascript_tool`:

```
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); const until=async(f,ms)=>{const t0=Date.now(); while(Date.now()-t0<ms){const v=f(); if(v) return v; await sleep(300);} return null;}; const getP=()=>[...document.querySelectorAll('ytd-engagement-panel-section-list-renderer')].filter(p=>/transcript/i.test(p.getAttribute('target-id')||'')).sort((a,b)=>b.innerText.length-a.innerText.length)[0]; try{document.querySelector('video').pause();}catch(e){} const ex=await until(()=>document.querySelector('#description-inline-expander #expand'),12000); if(ex){ex.click();} const tr=await until(()=>{const t=document.querySelector('ytd-video-description-transcript-section-renderer'); return t&&t.querySelector('button');},7000); if(tr){tr.click();} let pn=await until(()=>{const p=getP(); return p&&p.innerText.length>300?p:null;},9000); if(!pn&&tr){ tr.click(); pn=await until(()=>{const p=getP(); return p&&p.innerText.length>300?p:null;},6000); } const txt=pn?pn.innerText.replace(/\s+/g,' '):''; const re=/(?:^| )(\d{1,2}:\d{2})(?: (?:\d+ (?:Sekunden?|Minuten?|Stunden?),? ?)+)?/g; const segs=[]; let m,last=null; while((m=re.exec(txt))){ if(last) segs.push([last.t,txt.slice(last.e,m.index).trim()]); const p=m[1].split(':').map(Number); last={t:p.length===3?p[0]*3600+p[1]*60+p[2]:p[0]*60+p[1],e:m.index+m[0].length}; } if(last) segs.push([last.t,txt.slice(last.e).trim().slice(0,200)]); const B=15; const bk={}; segs.forEach(([t,x])=>{const k=Math.floor(t/B)*B; bk[k]=(bk[k]||'')+' '+x;}); const ks=Object.keys(bk); const C=Math.min(400,Math.max(60,Math.floor(3400/Math.max(1,ks.length)))); window.__tx=ks.map(k=>{const mm=Math.floor(k/60),s=k%60; return mm+':'+String(s).padStart(2,'0')+' '+bk[k].trim().slice(0,C);}).join('\n'); const d=document.querySelector('#description-inline-expander'); 'btn:'+!!tr+' n='+segs.length+' len='+window.__tx.length+'\n'+document.title.slice(0,70)+'\n'+(segs.length?window.__tx.slice(0,850):(d?'BESCHREIBUNG: '+d.innerText.replace(/\s+/g,' ').slice(0,500):''))
```

Die Ausgabe eines javascript_tool-Aufrufs wird nach ~1000 Zeichen abgeschnitten. Darum danach weitere Aufrufe mit `window.__tx.slice(850,1700)`, `window.__tx.slice(1700,2550)`, `window.__tx.slice(2550,3400)` bis leer. Das Transkript ist in 15-Sekunden-Blöcke gebündelt («0:15 text…»); die Zeiten der Blöcke sind nur grob – setze `t` sinnvoll innerhalb des Blocks (wenn eine Anweisung mitten im Block beginnt, schätze).

Wenn `n=0` oder `btn:false`: Das Video hat kein Transkript (oft nur Musik). Dann Schritt 2.

### 2. Standbilder (für Videos ohne Sprache)

Auf der Watch-Seite dieses JavaScript ausführen (baut ein Kontaktblatt mit 12 Standbildern und Zeitstempeln als Overlay):

```
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); const v=document.querySelector('video'); v.pause(); const N=12,cols=4,w=320,h=180; const c=document.createElement('canvas'); c.width=cols*w; c.height=Math.ceil(N/cols)*h; const ctx=c.getContext('2d'); const d=v.duration; const fmt=t=>Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0'); for(let i=0;i<N;i++){ const t=(i+0.5)*d/N; await new Promise(r=>{ const to=setTimeout(r,2500); v.onseeked=()=>{clearTimeout(to);r();}; v.currentTime=t; }); await sleep(350); const x=(i%cols)*w,y=Math.floor(i/cols)*h; ctx.drawImage(v,x,y,w,h); ctx.fillStyle='rgba(0,0,0,.6)'; ctx.fillRect(x,y,70,28); ctx.fillStyle='#ff0'; ctx.font='bold 20px sans-serif'; ctx.fillText(fmt(t),x+6,y+21);} c.style.cssText='position:fixed;left:0;top:0;z-index:2147483647;width:1280px;height:auto;background:#000'; c.id='__cs'; document.body.appendChild(c); document.title.slice(0,50)+' dur '+Math.round(d)
```

Dann `computer` action `screenshot` (scale 0.8) – das Bild siehst du direkt. Danach `javascript_tool` mit `document.getElementById('__cs').remove(); 'ok'`. Bei Bedarf ein zweites Kontaktblatt mit anderen Zeiten (z. B. `(i+0.25)*d/N`), wenn 12 Bilder nicht reichen. Aus den Bildern plus Titel/Beschreibung schreibst du die Schritte; Zeiten sind dann Schätzungen zwischen den Standbildern – lieber einen Stopp etwas früher setzen als zu spät.

### Regeln im Browser

- Nur Seiten unter youtube.com öffnen, nichts klicken ausser dem Transkript-Knopf, nichts liken/abonnieren/kommentieren.
- Am Ende deinen Tab mit `tabs_close_mcp` schliessen.
- Wenn ein Video nicht lädt oder Chrome 2× hintereinander Fehler liefert: Video überspringen und im Bericht nennen.

## Bericht am Schluss

Eine Zeile pro Video: `<VIDEOID> | <Titel> | <Anzahl Schritte> | Transkript oder Standbilder | <Zweifel, falls welche>`. Sonst nichts – keine Transkripte oder JSON in den Bericht kopieren.
