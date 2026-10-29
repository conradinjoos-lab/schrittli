# Schritt für Schritt

Die App heisst seit 26.10.2026 «Schritt für Schritt» (vorher «Schrittli», danach «Bibo & Fila» und «Stop & Mach»). Bibo und Fila sind die Figuren in der App. Intern bleibt `schrittli`: Repo, Speicher im Browser, Exportdateien. So gehen keine Fortschritte verloren.

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
2. Die Videos aus `inhalte.json` liegen schon in allen Lern-Bereichen (49 Videos: Zeichnen, Werken, Experimente, Basteln, Natur, Geschichten, Lesen & Zahlen). Spass-Videos (Lustiges, Lieder) holt man bei Bedarf aus dem Katalog.
3. Elternbereich (Schloss oben rechts), PIN **1234**: Sterne, Kinder, Rückmeldungen zu Werken. Videos kann man dort auch von Hand anlegen; Videos aus `inhalte.json` werden aber beim nächsten Laden wieder aus der Datei genommen.

## Werkstatt-Look

- Kinderseite als Werkstatt: Lochwand, ein Regal mit den Bereichen als Gegenstände, Werkbank unten. Alles in Grossbuchstaben. Bewusst wenig drauf: Es erscheinen nur Bereiche, die Videos haben.
- Spass-Bereiche (Lustiges, Lieder – kosten einen Stern) sind standardmässig ausgeblendet; Einstellungen → «Spass-Bereiche zeigen» holt sie aufs oberste Regalbrett, zusammen mit dem Sterneglas.
- Kind wechseln: Tipp aufs Hallo-Schild (nur wenn mehrere Kinder angelegt sind).
- Abendwerkstatt ab 18 Uhr (dunkle Wand, Lichterkette); im Elternbereich umstellbar.
- Player: links das Video («Schau zu»), rechts die Schritte als grosse Knöpfe – erledigte grün, der aktuelle gelb, Tipp auf einen Schritt springt dorthin.
- Kino-Modus: Knopf ⤢ in der Player-Leiste. Video füllt den Bildschirm (auf dem iPad echtes Vollbild), unten ein schwarzes Band mit Steuerung und dem aktuellen Schritt; Tipp aufs Band klappt alle Schritte auf. Die Wahl wird gemerkt; am Videoende geht es zurück zur normalen Ansicht mit der Aufgabe.
- Regal: jeder Bereich zeigt «gemacht/alle» (z. B. 2/10), grün mit Haken, wenn alles gemacht ist.
- Elternbereich → Tab «Katalog»: Vorauswahl aus `katalog.json` (SRF Kids, Die Maus, Schwiizergoofe, Werklehrerin, Stiftung Kinder forschen …), pro Video «Hinzufügen». 57 Einträge, davon Werken (Fingerstricken, Weben, Nähen, Knüpfen, Flechten) und Experimente (kleine Versuche mit Haushaltsmaterial) komplett mit Schritten.
- Bereiche ab Werk: Basteln, Werken, Zeichnen, Natur, Experimente, Geschichten, Lesen & Zahlen (Lern) sowie Lustiges, Lieder (Spass). Neue Bereiche kommen bei bestehenden Geräten beim nächsten Laden automatisch dazu.

## Schulversion (`schule/`)

- Eigener Ordner `schule/` mit `index.html` und `schule.json`; läuft unter `…/schrittli/schule/`. Gleiche Technik, eigener Speicher (die Familienversion bleibt unberührt).
- Kein Login, keine PIN, keine Sterne, keine Aufgaben, kein Elternbereich. Gespeichert wird nur die zuletzt gewählte Klasse; Fortschritt gilt nur für die laufende Sitzung (geteilte iPads).
- Ablauf: Klasse wählen (1.–6.) → Verfahren mit Videos für diese Klasse → Video → Player mit Schritten, Tempo, Kino-Modus.
- Grossbuchstaben für 1. und 2. Klasse, ab 3. Klasse normale Schrift.
- «Für Lehrpersonen» (unten): Liste aller Videos mit Klassenzuordnung und QR-Code pro Video (Schul-Link mit Schritten, auch von zuhause nutzbar).
- Ordnung nach TTG-Verfahren: Nähen, Sticken, Häkeln, Stricken, Weben, Flechten & Knüpfen, Wickeln, Filzen, Falten, Schneiden & Kleben, Sägen & Nageln, Formen, Drucken, Experimentieren. Gedacht vor allem als Zwischenarbeiten für Kinder, die früher fertig sind.
- Pflege: `schule/schule.json` – pro Video `areaId` (Verfahren) und `stufen` (Liste 1–6). Klassenzuordnung ist ein Vorschlag von Claude und soll von der Lehrperson geprüft werden.
- Neue Videos halbautomatisch erfassen (Transkript, Bildwechsel, Schritte-Entwurf, Kontrollseite zum Feinstellen der Stopps): siehe `werkzeug/LIESMICH.md`. Braucht nur der Rechner, der Videos erfasst – die App selbst nicht.
- **Finde deine Idee:** Katalog über alle Räume und Themen (Suche, Klasse, Verfahren), oben auf der Startseite der Schulversion. Führt direkt zum Video, zur Foto-Anleitung oder zur Vorlage.
- **Papierflieger-Sammlung:** eigene Seite mit allen Modellen aus dem Thema Falten, von leicht bis knifflig.
- **Unterrichtsmodus (iPads freigeben):** Die Lehrperson legt in `kontrolle/unterricht.html` eine Gruppe an und öffnet den Link `…/schule/#unterricht=<Token>` einmal auf jedem iPad (oder scannt den QR-Code). Danach zeigt das iPad nur, was gerade freigegeben ist: geschlossen («Gleich geht’s los»), bestimmte Videos, Vorlagen, Perlentiere oder alles. Die App fragt alle paar Sekunden beim Worker nach; ohne Antwort gilt nach 90 s «geschlossen». Die Kontrollseite zeigt, welche iPads die aktuelle Freigabe schon haben.
- **Klassenrückmeldungen:** Mit dem Link `…/schule/#klasse=<Token>` aus `kontrolle/rueckmeldungen.html` verbunden, fragt die App nach jedem abgegebenen Werk einmal «Wie war es für dich?» und «Hat es Spass gemacht?» (je drei Symbole, wahlweise eine kurze Tonaufnahme). Die Antworten landen beim Worker (90 Tage) und sind auf der Kontrollseite pro Klasse auswertbar.
- **Gemeinsame Schulwerke:** Mit dem Link `…/schule/#sammlung=<Token>` aus `kontrolle/sammlung.html` zeigt «Unsere Werke» die Fotos aller verbundenen iPads der Klasse, nicht nur die des eigenen Geräts. Die Lehrperson sieht und löscht die Fotos auf der Kontrollseite.
- **Wer bist du?:** Trägt die Lehrperson in `kontrolle/klassen.html` pro Klasse die Vornamen ein, holt jedes verbundene iPad (Unterricht, Rückmeldungen oder Unsere Werke) die Listen mit seinem Token (`/namen/liste`) und fragt beim Start zuerst nach der Klasse, dann nach dem Vornamen. Das gewählte Kind steht als Chip im Kopf (Tipp = wechseln), die Klassenstufe der Liste wird gleich übernommen. Rückmeldungen und Fotos tragen dann den Vornamen, ohne dass das Kind etwas eintippt; bei «Unsere Werke» bleibt nur noch die Sternewahl. Die Listen liegen im localStorage (`schrittli.schule.klassenlisten`), das gewählte Kind in `settings.kind`.
- **Stromkreis-Baukasten:** `vorlagen/stromkreis/` – Batterie, Schalter, Taster, LEDs in fünf Farben, 3-V-Motor (Propeller, Rad oder Zahnrad), Lämpchen, Summer und Widerstand auf die Fläche holen und die Klemmen verbinden. Die Seite rechnet den Kreis durch und sagt in Kindersprache, was leuchtet und dreht, warnt vor Kurzschluss, verkehrt eingebauter LED und zu wenig Spannung in Reihe. Dazu Materialliste, Drucken, Bild sichern, Link teilen (`#p=…`), sechs Beispiele (`?beispiel=boot` usw.). Eingetragen in `WERKZEUGE` in `quelle/p2.js`.
- **Maschen-Planer:** `vorlagen/maschenprobe/` – Häkeln oder Stricken → Werk (Kappe, Stirnband, Armband, Pulswärmer, Schal, Topflappen, Handytasche, eigene Grösse) → Messen → Probestück → Maschen und Reihen im 10-cm-Zählfenster zählen → Plan mit Anschlag, Reihen und Wollmenge. Druckblatt mit Zählfenster zum Ausschneiden (A4 oder 4 × auf A3). Ohne Infotexte, nur Bilder und Zahlen. Link-Parameter `?technik=haekeln&werk=kappe`. Eingetragen in `WERKZEUGE` in `quelle/p2.js`.
- **Perlentiere nach Klasse:** Die Perlen-Seite (`vorlagen/perlen/`) kennt die Klassenregel 2. Klasse bis 8, 3./4. bis 12, 5. bis 14, 6. bis 15 Perlen pro Reihe; die Höchstbreite gilt als «schwer». Die Klasse kommt aus dem Link (`?klasse=`), aus der Schulversion oder wird auf der Seite gewählt. Wahlweise nur passende Muster zeigen; im Editor lässt sich ein Muster höchstens bis zur Klassenbreite verbreitern, breitere Muster nur schmaler machen.
- **Player auf dem iPad:** Die Schrittliste steht immer offen neben dem Video; ihr Kopf zeigt «Die Schritte 3 von 8», der aktuelle Schritt ist als solcher markiert und wird in die Sicht gerollt.
- **Zum Home-Bildschirm:** `manifest.webmanifest` (Familie) und `schule/manifest.webmanifest` (Schule) mit den Icons aus `grafik/marke/` (32, 180, 192, 512 px, maskable). Beide Ausgaben lassen sich so als eigene App installieren.

## Was die App macht

- **Materialkarte:** Hat ein Video eine Materialliste (`material: ["wolle","schere",…]`), ist Schritt 1 immer «Material richten»: eine Karte mit Piktogrammen statt Video. «Habe ich alles» startet das Video direkt beim ersten Arbeitsschritt. Im Elternbereich-Editor als Komma-Liste eingeben (bekannte Wörter bekommen ein Bild, unbekannte ein Paket-Symbol). Vokabular der Piktogramme steht in der App (`MATERIAL`). Echte Fotos: quadratische JPGs als `material/<id>.jpg` (z. B. `material/wolle.jpg`) ablegen und die ID in `material/fotos.json` eintragen – dann zeigt die Karte das Foto statt des Piktogramms.
- **Schritt-Modus:** Video stoppt automatisch am Ende jedes Schritts (kleines Schild «Jetzt du» im Bild, kein Zwischenbildschirm). Tipp aufs Video oder auf ▶ = Weiter, ↺ = Nochmal. Vorlesen nur auf Knopfdruck (Lautsprecher); automatisches Vorlesen ist in den Einstellungen abschaltbar/einschaltbar, die Stimme hängt vom Gerät ab.
- **Lern-Bereiche** unbegrenzt, **Spass-Bereiche** kosten einen Stern pro Video und Tag (Anzahl in den Einstellungen). Abgegebene Aufgabe = ein Bonus-Stern pro Tag (abschaltbar).
- **Aufgabe nach dem Video:** Foto, Bild malen, Tonaufnahme oder nur Fertig-Knopf. Landet in «Meine Werke», Eltern geben Rückmeldung (Emoji + Satz).
- **Foto vom Werk:** Am Ende jedes Videos (auch Schule und Schul-Link) gibt es «Foto von deinem Werk». Das Foto bleibt nur auf dem Gerät (IndexedDB), nichts wird hochgeladen. In der Schule heisst die Sammlung «Unsere Werke» und überlebt das Neuladen.
- **Das haben andere gemacht:** Unter den Videos eines Bereichs Fotos fertiger Arbeiten aus `werke/werke.json` (erzeugt von `werkzeug/werke.py`, nur Fotos ohne Kinder, Hände und Screenshots).
- **Foto-Anleitungen:** Schritt für Schritt mit Fotos statt Video, aus `anleitungen/anleitungen.json` (Fotos in `anleitungen/<ordner>/`, als WebP, max. 1000 px). Pro Schritt Text, ein oder zwei Fotos und wahlweise «Achtung», «Tipp», eine Frage mit Antwortfeld oder «Zeigen» – dann geht es erst weiter, wenn «Die Lehrperson hat es gesehen» angetippt ist. Gehören mehrere Anleitungen zum selben `ordner` (z. B. Raketenstation 1 und 2), führt das Ende von Teil 1 direkt zu Teil 2. In der Schule erscheinen sie im Verfahren (`areaId`) und für die `stufen`, in der Familienversion unter Werken. Prüfen: `python werkzeug/anleitungen.py`. Vorlagen zum Ausdrucken als PDF im selben Ordner unter `vorlagen` (`datei`, `name`, `format`); sie erscheinen beim Start und in jedem Schritt mit `"vorlage": true` als Download-Knopf. Nur Fotos ohne Kinder, Hände und Screenshots.
- **Schul-Link:** trägt Video, Schritte, Material und Aufgabe im Link selbst. Kind scannt QR, landet direkt im Player. Keine Anmeldung, keine Sterne; nur Fotos vom Werk bleiben auf dem Gerät.
- **Mehrere Kinder:** im Elternbereich anlegen, Auswahl beim Start.
- **Daten → Export/Import:** Videos und Einstellungen zwischen Geräten übertragen. Werke bleiben auf dem Gerät.

## Bekannte Grenzen

- YouTube-Werbung ohne Premium-Anmeldung im selben Browser ist nicht abschaltbar. Die App blockiert Tipps aufs YouTube-Bild; zum Überspringen von Werbung in den Einstellungen «Tippen ans Video durchlassen» aktivieren.
- Manche Kanäle verbieten das Einbetten; die App meldet das beim Prüfen.
- Auf dem iPad muss das erste Abspielen manchmal direkt im YouTube-Bild angetippt werden; die App zeigt dann «Tippe auf das Video».
- Sprachsteuerung («Stopp», «Weiter») ist experimentell und braucht Internet.
- Nicht auf echtem iPad und mit echtem YouTube getestet – zuerst mit einem Video ausprobieren.
