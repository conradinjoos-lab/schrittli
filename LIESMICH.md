# Schritt für Schritt

Die App heisst seit 26.10.2026 «Schritt für Schritt» (vorher «Schrittli», danach «Bibo & Fila» und «Stop & Mach»). Bibo und Fila sind die Figuren in der App. Intern bleibt `schrittli`: Repo, Speicher im Browser, Exportdateien. So gehen keine Fortschritte verloren.

Die App besteht aus den erzeugten HTML-Dateien und den zugehörigen Inhalts- und Bilderordnern:

- `index.html` und `schule/index.html` – Familien- und Schulausgabe.
- `schule/schule.json`, `inhalte.json` und `anleitungen/anleitungen.json` – Videos, Schritte und Foto-Anleitungen. Inhalte werden über http/https geladen.
- `grafik/`, `vorschau/`, `material/`, `anleitungen/` und `vorlagen/` – Bilder und Unterlagen, die zusammen mit der App verfügbar sein müssen.

Kinder, Fortschritt und Familienwerke liegen im Browser des Geräts (localStorage + IndexedDB). Die Schule kann Fotos und Projektbewertungen über eine verbundene Sammlung zwischen iPads teilen.

## Starten

### Unterrichtsmodus für verbundene iPads

Unter **Für Lehrpersonen → Unterricht öffnen** (`kontrolle/unterricht.html`) mit der bestehenden GitHub-Anmeldung anmelden. Eine Klasse/iPad-Gruppe erstellen und deren Gruppenlink oder QR-Code einmal auf jedem Kinder-iPad öffnen. Die Steuerseite bleibt auf dem Lehrpersonen-Gerät. Unverbundene Geräte behalten die normale Ansicht.

Jede Gruppe startet geschlossen. Einzelnes Projekt, Thema, eigene Projektauswahl, Vorlagen-Kategorie oder Perlentiere auswählen; die Vorschau zeigt den Entwurf. Erst **Freigeben** übernimmt ihn auf die verbundenen iPads. Einzelne Inhalte öffnen direkt, mehrere bleiben eine begrenzte Auswahl. **Alles schliessen** zeigt die Warteseite; **Freies Entdecken** gibt die normale Anwendung frei. Favoriten werden online gespeichert. Grösse/Breite, Farbänderungen und die ganze Fotosammlung sind separat einstellbar.

Die Freigabe wird alle fünf Sekunden geprüft. Die Lehrperson sieht die Übernahme je iPad und kann Gerätenamen vergeben. Ohne Internet läuft eine zuvor bestätigte Freigabe höchstens 90 Sekunden weiter; danach erscheint die Warteseite. Neuladen ohne Verbindung bleibt geschlossen. Fortschritt und gespeicherte Arbeiten bleiben erhalten. Bei einer Änderung während eines Perlen-Editors wird der Entwurf zuerst gespeichert.

Der Gruppenlink erlaubt nur die Teilnahme; Steuerung und Favoriten verlangen die Lehrpersonen-Anmeldung. Gruppenlinks werden nur beim Erstellen ausgegeben und im Browser der Lehrperson gemerkt – für andere Geräte separat aufbewahren. Die Begrenzung steuert die Anwendung und ersetzt weder den geführten Zugriff des iPads noch Zugriffsschutz für die weiterhin öffentlichen statischen Dateien.


- **Bauen:** `node quelle/bauen.cjs` erzeugt beide Ausgaben aus `quelle/p1.html`, `quelle/p2.js` und `quelle/player-design.css`. Auch `bash quelle/bauen.sh` verwendet denselben Build. Die erzeugten HTML-Dateien nicht direkt bearbeiten.
- **Lokale Vorschau:** `node werkzeug/vorschau-server.cjs` starten. Familie: `http://127.0.0.1:8766/`, Schule: `http://127.0.0.1:8766/schule/`. Die Vorschau ist nur auf diesem Computer erreichbar; private Arbeitsordner werden nicht ausgeliefert.
- **Prüfen:** `node werkzeug/design-pruefen.cjs --built` prüft Inhalte, lokale Bilder, beide Ausgaben, Filter und die Schrittlogik ohne Netzwerk. Ein echter Browser-/iPad-Test ist zusätzlich erforderlich.
- **Für andere Geräte:** Die bestehende GitHub-Pages-Adresse ist öffentlich. Der Push der grafischen Überarbeitung wurde am 27.10.2026 freigegeben. Ein HTTPS-Host mit echtem Zugangsschutz ist weiterhin vorgesehen; der Eltern-PIN schützt nur die Bedienoberfläche. Hosting und privater Zugang sind noch separat umzusetzen.

## Erster Start

1. Name und Tier des Kindes eingeben.
2. Die Startseite zeigt ausgewählte Ergebnisfotos und die verfügbaren Themen. «Alle Ideen» öffnet den Katalog mit Suche. Handarbeit und Werkraum lassen sich oben auswählen.
3. Elternbereich («Für Eltern» unten), PIN **1234**: Sterne, Kinder, Rückmeldungen zu Werken. Videos kann man dort auch von Hand anlegen; Einträge aus den Inhaltsdateien werden beim nächsten Laden aktualisiert.

## Die Ideenwerkstatt

- Warmer heller Hintergrund, grosse echte Werkstückfotos und kurze Namen. Video-Karten haben keine laufenden Nummern, Schrittanzahlen oder wiederholte Technikangaben. Hochformatige Foto-Anleitungen zeigen das ganze Werkstück.
- «Alle Ideen»: nach Begriff suchen oder «Selber machen», «Üben» und «Mit Fotos» auswählen. Zurück aus einer Anleitung führt zur vorherigen Auswahl mit Suchbegriff und Scrollposition.
- Spass-Bereiche und Sterne bleiben standardmässig ausgeblendet. Sind sie eingeschaltet, erscheinen sie unter «Deine Pause».
- Kind wechseln: «Profil wechseln» unten, wenn mehrere Kinder angelegt sind.
- Der Lernbereich zeigt auf iPads im Hoch- und Querformat das Video links und die offene Arbeitsschrittliste rechts. Auf schmalen Handys steht die Liste darunter. Der aktuelle Schritt ist markiert; «Schritt X von Y» bleibt bei der Steuerung sichtbar. Mit den Pfeilen geht es jederzeit einen Schritt zurück oder vorwärts, auch während das Video läuft. Vorlesen, Wiederholen und langsames Tempo helfen beim selbständigen Arbeiten.
- Kino-Modus: Knopf ⤢ in der Player-Leiste. Unter dem Video bleiben «Schritt X von Y», der aktuelle Schritt und die Steuerung sichtbar; «Alle Schritte» öffnet die Übersicht. Die Leiste bekommt den benötigten Platz, damit nichts abgeschnitten wird. Die Wahl wird gemerkt; am Videoende geht es zurück zur normalen Ansicht mit der Aufgabe. Echtes iPad-Vollbild weiterhin auf dem Gerät prüfen.
- Regal: jeder Bereich zeigt «gemacht/alle» (z. B. 2/10), grün mit Haken, wenn alles gemacht ist.
- Elternbereich → Tab «Katalog»: Vorauswahl aus `katalog.json` (SRF Kids, Die Maus, Schwiizergoofe, Werklehrerin, Stiftung Kinder forschen …), pro Video «Hinzufügen». 57 Einträge, davon Werken (Fingerstricken, Weben, Nähen, Knüpfen, Flechten) und Experimente (kleine Versuche mit Haushaltsmaterial) komplett mit Schritten.
- Bereiche ab Werk: Basteln, Werken, Zeichnen, Natur, Experimente, Geschichten, Lesen & Zahlen (Lern) sowie Lustiges, Lieder (Spass). Neue Bereiche kommen bei bestehenden Geräten beim nächsten Laden automatisch dazu.

## Schulversion (`schule/`)

- Eigener Ordner `schule/` mit `index.html` und `schule.json`; läuft unter `…/schrittli/schule/`. Gleiche Technik, eigener Speicher (die Familienversion bleibt unberührt).
- Kein Kinder-Login, keine PIN, keine Belohnungssterne, keine Aufgaben, kein Elternbereich. Bei Werkfotos bewerten Kinder ihr Projekt mit 1–5 Sternen. Gespeichert wird nur die zuletzt gewählte Klasse; Fortschritt gilt nur für die laufende Sitzung (geteilte iPads).
- Ablauf: Klasse wählen (1.–6.) → Verfahren mit Videos für diese Klasse → Video → Player mit Schritten, Tempo, Kino-Modus.
- Grossbuchstaben für 1. und 2. Klasse, ab 3. Klasse normale Schrift.
- «Für Lehrpersonen» (unten): Liste aller Videos mit Klassenzuordnung und QR-Code pro Video (Schul-Link mit Schritten, auch von zuhause nutzbar).
- Ordnung nach TTG-Verfahren: Nähen, Sticken, Häkeln, Stricken, Weben, Flechten & Knüpfen, Wickeln, Filzen, Falten, Schneiden & Kleben, Sägen & Nageln, Formen, Drucken, Experimentieren. Gedacht vor allem als Zwischenarbeiten für Kinder, die früher fertig sind.
- Pflege: `schule/schule.json` – pro Video `areaId` (Verfahren) und `stufen` (Liste 1–6). Klassenzuordnung ist ein Vorschlag von Claude und soll von der Lehrperson geprüft werden.
- Neue Videos halbautomatisch erfassen (Transkript, Bildwechsel, Schritte-Entwurf, Kontrollseite zum Feinstellen der Stopps): siehe `werkzeug/LIESMICH.md`. Braucht nur der Rechner, der Videos erfasst – die App selbst nicht.

## Was die App macht

- **Materialkarte:** Hat ein Video eine Materialliste (`material: ["wolle","schere",…]`), ist Schritt 1 immer «Material richten»: eine Karte mit Piktogrammen statt Video. «Habe ich alles» startet das Video direkt beim ersten Arbeitsschritt. Im Elternbereich-Editor als Komma-Liste eingeben (bekannte Wörter bekommen ein Bild, unbekannte ein Paket-Symbol). Vokabular der Piktogramme steht in der App (`MATERIAL`). Echte Fotos: quadratische JPGs als `material/<id>.jpg` (z. B. `material/wolle.jpg`) ablegen und die ID in `material/fotos.json` eintragen – dann zeigt die Karte das Foto statt des Piktogramms.
- **Schritt-Modus:** Video stoppt automatisch am Ende jedes Schritts (kleines Schild «Jetzt du» im Bild, kein Zwischenbildschirm). Tipp aufs Video oder auf ▶ = Weiter, ↺ = Nochmal. Vorlesen nur auf Knopfdruck (Lautsprecher); automatisches Vorlesen ist in den Einstellungen abschaltbar/einschaltbar, die Stimme hängt vom Gerät ab.
- **Lern-Bereiche** unbegrenzt, **Spass-Bereiche** kosten einen Stern pro Video und Tag (Anzahl in den Einstellungen). Abgegebene Aufgabe = ein Bonus-Stern pro Tag (abschaltbar).
- **Aufgabe nach dem Video:** Foto, Bild malen, Tonaufnahme oder nur Fertig-Knopf. Landet in «Meine Werke», Eltern geben Rückmeldung (Emoji + Satz).
- **Foto vom Werk:** Am Ende jedes Videos (auch Schule und Schul-Link) gibt es «Foto von deinem Werk». In der Familie bleibt das Foto auf dem Gerät (IndexedDB). In der Schule geben Kinder Vorname, Klasse und 1–5 Sterne für das Projekt an. Ist eine gemeinsame Sammlung verbunden, werden neue Fotos automatisch geteilt. «Unsere Werke» zeigt die Sammlung und lässt sich nach Klasse filtern. Unter Projektkarten stehen Namen und Sterne; im Projekt sind alle zugehörigen Werke sichtbar.
- **Das haben andere gemacht:** Unter den Videos eines Bereichs Fotos fertiger Arbeiten aus `werke/werke.json` (erzeugt von `werkzeug/werke.py`, nur Fotos ohne Kinder, Hände und Screenshots).
- **Foto-Anleitungen:** Schritt für Schritt mit Fotos statt Video, aus `anleitungen/anleitungen.json` (Fotos in `anleitungen/<ordner>/`, als WebP, max. 1000 px). Pro Schritt Text, ein oder zwei Fotos und wahlweise «Achtung», «Tipp», eine Frage mit Antwortfeld oder «Zeigen» – dann geht es erst weiter, wenn «Die Lehrperson hat es gesehen» angetippt ist. Gehören mehrere Anleitungen zum selben `ordner` (z. B. Raketenstation 1 und 2), führt das Ende von Teil 1 direkt zu Teil 2. In der Schule erscheinen sie im Verfahren (`areaId`) und für die `stufen`, in der Familienversion unter Werken. Prüfen: `python werkzeug/anleitungen.py`. Vorlagen zum Ausdrucken als PDF im selben Ordner unter `vorlagen` (`datei`, `name`, `format`); sie erscheinen beim Start und in jedem Schritt mit `"vorlage": true` als Download-Knopf. Nur Fotos ohne Kinder, Hände und Screenshots.
- **Schul-Link:** trägt Video, Schritte, Material und Aufgabe im Link selbst. Kind scannt QR, landet direkt im Player. Keine Anmeldung, keine Sterne; nur Fotos vom Werk bleiben auf dem Gerät.
- **Mehrere Kinder:** im Elternbereich anlegen, Auswahl beim Start.
- **Daten → Export/Import:** Videos und Einstellungen zwischen Geräten übertragen. Werke bleiben auf dem Gerät.

## Perlentiere und Figurenmuster

Unter `vorlagen/perlen/` stehen 41 bisherige Perlentiere und 302 vereinfachte Figurenmotive zur Auswahl. Die Klasse begrenzt die Anzahl Perlen pro Reihe: 2. Klasse 8, 3. und 4. Klasse 12, 5. Klasse 14, 6. Klasse 15. Die jeweilige Maximalbreite gilt als schwer. Ohne Klassenangabe startet die Seite mit der 2. Klasse; aus der Schulversion wird deren gewählte Klasse übernommen. Es erscheinen nur passende Vorlagen. Figuren sind kleine Köpfe, Masken oder Symbole mit höchstens sechs Farben, ohne fotografische Schattierungen, versetzte Reihen oder transparente Stützperlen. Der Pokéball hat beispielsweise 36 Perlen in drei Farben und sechs Reihen. Auswahl, Vorschau, Originalvergleich und einseitiger Druck zeigen das tatsächliche Muster. Die Vorlagen wurden visuell geprüft, aber nicht praktisch nachgefädelt.

«Farben und Breite · Vollbild» öffnet die Arbeitsansicht: einzelne Perlen färben, alle Perlen einer Farbe tauschen, die Breite über die Perlenzahl verändern und die Ansicht vergrössern. «Rückgängig» und «Original» nehmen Änderungen zurück. «Sperren» blendet die Bearbeitung aus und schützt das Muster vor versehentlichen Änderungen; «Entsperren» öffnet sie wieder. Die Bildschirmansicht passt sich auch an Tablet und Handy an.

Änderungen an fertigen Mustern bleiben pro Motiv und Klasse auf diesem Gerät gespeichert und gelten auch für den Ausdruck. Der Breitenregler zeigt primär die Perlenzahl und endet an der Klassengrenze. Derselbe Editor steht bei «Perlentier aus eigenem Bild» zur Verfügung; dort gelten die Änderungen für die aktuelle Sitzung. Auch Bildumwandlung und das manuelle Hinzufügen einer Perle beachten die Klassengrenze. Eigene Bilder werden weiterhin nur auf dem Gerät verarbeitet.

Pflege: Die kleinen Muster stehen als Reihen und bewusst vereinfachte Formen in `werkzeug/vorlagen/perlen-klein.cjs`; `node werkzeug/vorlagen/perlen.cjs` schreibt die Sammlung daraus. Keine automatische Rasterung der Originalbilder. `node werkzeug/vorlagen/perlen-vergleichen.cjs` benötigt `@napi-rs/canvas`, erneuert die Vorschaubilder und stellt alle Originale den Mustern unter `output/perlen-vergleich/` gegenüber. Diese Bilder müssen visuell geprüft werden. `node werkzeug/perlen-pruefen.cjs` prüft zusätzlich Vollständigkeit, Klassengrenzen, Farbmengen, Perlenzahlen, Drahtgeometrie, Druckausgaben und Bearbeitung. Neue Figurenänderungen werden unter `.v3.klasseN` gespeichert; frühere Anpassungen bleiben erhalten und überschreiben die kleinen Formen nicht. Ein technischer Test oder eine Sichtprüfung ersetzt keine Fädelprobe.

## Bekannte Grenzen

- YouTube-Werbung ohne Premium-Anmeldung im selben Browser ist nicht abschaltbar. Die App blockiert Tipps aufs YouTube-Bild; zum Überspringen von Werbung in den Einstellungen «Tippen ans Video durchlassen» aktivieren.
- Manche Kanäle verbieten das Einbetten; die App meldet das beim Prüfen.
- Auf dem iPad muss das erste Abspielen manchmal direkt im YouTube-Bild angetippt werden; die App zeigt dann «Tippe auf das Video».
- Sprachsteuerung («Stopp», «Weiter») ist experimentell und braucht Internet.
- Nicht auf echtem iPad und mit echtem YouTube getestet – zuerst mit einem Video ausprobieren.

## Gemeinsame Schulwerke einrichten

1. Nach Bereitstellung des Speichers `kontrolle/sammlung.html` öffnen und mit dem vorhandenen GitHub-Konto anmelden. Eine Sammlung für die Schule erstellen.
2. Denselben Sammlungslink einmal auf jedem Schul-iPad öffnen oder unter «Für Lehrpersonen → iPads verbinden» einfügen. Beim Einsatz der Home-Bildschirm-App dort verbinden. Der Link erlaubt Lesen und Hinzufügen innerhalb dieser Sammlung.
3. Kinder fotografieren ihr Werk am Projektende und tragen Vorname, Klasse und Sterne ein. Die anderen geöffneten iPads holen Änderungen alle 8 Sekunden ab. Bei Rückkehr in die App wird sofort aktualisiert.

Offline bleiben neue Fotos und ihre Versandwarteschlange auf dem iPad erhalten. Beim nächsten Öffnen mit Internet werden sie erneut gesendet; eine stabile Werk-ID verhindert doppelte Einträge. Fotos aus der bisherigen lokalen Sammlung bleiben lokal. Neue, noch unverbundene Fotos werden bei der ersten Verbindung geteilt. Fotos aus einer anderen verbundenen Sammlung werden niemals automatisch übernommen.

Die Lehrperson kann unter `kontrolle/sammlung.html` Werke für alle iPads löschen oder einen Sammlungslink sperren. Rückmeldungslinks für die privaten Sprachaufnahmen bleiben getrennt. Fotos und Bewertungen bleiben gespeichert, bis die Lehrperson sie löscht.

Technik: `quelle/schulwerke.js` und `.css`, Worker-Routen `/sammlung/*`, separate D1-Bindung `SAMMLUNG`, Migration `werkzeug/anmelden/sammlung-migrations/0001_sammlung.sql`. Fotos werden auf maximal 600 kB verkleinert. Begrenzung: 2000 Werk-IDs je Sammlung (inklusive gelöschter Einträge), 300 neue Fotos je Tag/Sammlung, 400 MB aktive Fotos insgesamt. Der Speicher `schrittli-werke` wurde am 27.10.2026 mit EU-Jurisdiktion eingerichtet; die Datenbank-ID steht in `wrangler.toml`, die erste Migration ist angewendet. Weitere Schemaänderungen vor dem Worker-Deployment mit `npx wrangler d1 migrations apply SAMMLUNG --remote` einspielen. Die Sammlung «Unsere Schulwerkstatt» ist bereits erstellt. Der private Verbindungslink wird nicht im Repository gespeichert.

Prüfungen: `npm run check` in `werkzeug/anmelden`, `node werkzeug/schulwerke-ui-pruefen.cjs` für zwei getrennte Browserkontexte mit lokaler D1-Datenbank. Der Browsertest verwendet keine echten Kinderfotos und schreibt Screenshots nach `output/schulwerke/`. Kamera und Safari auf einem echten iPad zusätzlich prüfen.
