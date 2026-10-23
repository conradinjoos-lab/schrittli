# Schrittli

Zwei Dateien, die zusammen in einem Ordner liegen müssen:

- `schrittli.html` – die App. Keine Installation, kein Server-Code.
- `inhalte.json` – Bereiche, Videos, Schritte, Aufgaben. Wird beim Start geladen (nur über http/https, nicht per Doppelklick). Diese Datei pflegt Claude: Link schicken, Claude holt das Transkript, schreibt Schritte und Aufgabe, legt das Video in der passenden Kategorie ab.

Kinder, Sterne, Fortschritt und Werke liegen im Browser des Geräts (localStorage + IndexedDB).

## Starten

- **Schnell am PC:** Datei doppelklicken. Oberfläche, Malen, Elternbereich laufen. YouTube-Player und Mikrofon brauchen aber `http(s)`, nicht `file://`.
- **Lokal richtig:** im Ordner `npx serve` (oder `python -m http.server 8080`) → `http://localhost:8080/schrittli.html`.
- **Fürs iPad / für die Schule:** Datei auf einen https-Host legen (GitHub Pages, Netlify Drop, Cloudflare Pages – alle gratis für eine Datei). Mikrofon und Kamera gehen auf dem iPad nur über https. Der Schul-Link (QR) funktioniert nur mit gehosteter Version.

## Erster Start

1. Name und Tier des Kindes eingeben.
2. Die Videos aus `inhalte.json` liegen schon in «Zeichnen» (Malen mit Evi, 10 Videos).
3. Elternbereich (Schloss oben rechts), PIN **1234**: Sterne, Kinder, Rückmeldungen zu Werken. Videos kann man dort auch von Hand anlegen; Videos aus `inhalte.json` werden aber beim nächsten Laden wieder aus der Datei genommen.

## Werkstatt-Look

- Kinderseite als Werkstatt: Lochwand, Regale mit den Bereichen als Gegenstände, Werkbank unten. Alles in Grossbuchstaben.
- Oberstes Regalbrett = Spass-Bereiche (kosten einen Stern), darunter die Lern-Bereiche.
- Abendwerkstatt ab 18 Uhr (dunkle Wand, Lampe, Lichterkette); im Elternbereich umstellbar.
- Player: links das Video («Schau zu»), rechts die Schritte als grosse Knöpfe – erledigte grün, der aktuelle gelb, Tipp auf einen Schritt springt dorthin.
- Regal: jeder Bereich zeigt «gemacht/alle» (z. B. 2/10), grün mit Haken, wenn alles gemacht ist.
- Elternbereich → Tab «Katalog»: Vorauswahl aus `katalog.json` (SRF Kids, Die Maus, Schwiizergoofe …), pro Video «Hinzufügen».

## Was die App macht

- **Schritt-Modus:** Video stoppt automatisch am Ende jedes Schritts (kleines Schild «Jetzt du» im Bild, kein Zwischenbildschirm). Tipp aufs Video oder auf ▶ = Weiter, ↺ = Nochmal. Vorlesen nur auf Knopfdruck (Lautsprecher); automatisches Vorlesen ist in den Einstellungen abschaltbar/einschaltbar, die Stimme hängt vom Gerät ab.
- **Lern-Bereiche** unbegrenzt, **Spass-Bereiche** kosten einen Stern pro Video und Tag (Anzahl in den Einstellungen). Abgegebene Aufgabe = ein Bonus-Stern pro Tag (abschaltbar).
- **Aufgabe nach dem Video:** Foto, Bild malen, Tonaufnahme oder nur Fertig-Knopf. Landet in «Meine Werke», Eltern geben Rückmeldung (Emoji + Satz).
- **Schul-Link:** trägt Video, Schritte und Aufgabe im Link selbst. Kind scannt QR, landet direkt im Player. Keine Anmeldung, keine Sterne, nichts wird gespeichert.
- **Mehrere Kinder:** im Elternbereich anlegen, Auswahl beim Start.
- **Daten → Export/Import:** Videos und Einstellungen zwischen Geräten übertragen. Werke bleiben auf dem Gerät.

## Bekannte Grenzen

- YouTube-Werbung ohne Premium-Anmeldung im selben Browser ist nicht abschaltbar. Die App blockiert Tipps aufs YouTube-Bild; zum Überspringen von Werbung in den Einstellungen «Tippen ans Video durchlassen» aktivieren.
- Manche Kanäle verbieten das Einbetten; die App meldet das beim Prüfen.
- Auf dem iPad muss das erste Abspielen manchmal direkt im YouTube-Bild angetippt werden; die App zeigt dann «Tippe auf das Video».
- Sprachsteuerung («Stopp», «Weiter») ist experimentell und braucht Internet.
- Nicht auf echtem iPad und mit echtem YouTube getestet – zuerst mit einem Video ausprobieren.
