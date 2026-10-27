# Übergabe «Schritt für Schritt» – Stand 27.10.2026

## Unterrichtsmodus (27.10.2026)

- `unterricht.js` ist das gemeinsame Gate im Kopf beider Apps und aller Vorlagen-Werkzeuge. Eingeschriebene Geräte halten nur ihren Gruppenschlüssel; Freigaben werden nicht aus localStorage vertraut. Abruf alle 5 s, Lease maximal 90 s; offline/reload ohne bestätigte Freigabe geschlossen. Kein Schutz der öffentlichen Quelldateien oder des iPad-Betriebssystems.
- `quelle/unterricht.js` prüft jeden Routerwechsel und zeigt nur freigegebene Projekte. Templates und Perlentiere filtern die Daten vor der sichtbaren Auswahl; direkte URLs, Druck, Kategorien und Editoren beachten dieselbe Freigabe. Gespeicherte Vorlagenzustände und Perlenarbeiten sind gruppenbezogen. Schulfortschritt bleibt nur bei eingeschriebenen Unterrichtsgeräten über Neuladen erhalten.
- Lehrperson: `kontrolle/unterricht.html/.js/.css`, gleiche GitHub-Owner-Anmeldung wie die Fotosammlung. Gruppen, atomare Freigabe mit Revisionsprüfung, Favoriten, iPad-Rückmeldungen. `werkzeug/unterricht-katalog.cjs` erzeugt bei jedem App-Build die Metadaten aus den vorhandenen Veröffentlichungen; Klassenbreiten aus `PerlenEditor.GRENZEN`.
- Backend: `werkzeug/anmelden/unterricht.js`, neue Tabellen in der vorhandenen SAMMLUNG-D1, Migration `0002_unterricht.sql`. Unterrichts- und Fotosammlungsschlüssel sind getrennt. Vor Veröffentlichung Migration remote anwenden, dann Worker deployen und Pages pushen.
- Prüfungen: `npm run check` in `werkzeug/anmelden`; `node werkzeug/unterricht-ui-pruefen.cjs` mit lokalem Workers/D1 und vier getrennten Browserkontexten; bestehende Schulwerke-, Design- und Perlentests. Browserprüfungen ersetzen keinen echten iPad-Gerätetest. Screenshots unter ignoriertem/lokalem `output/unterricht/`.
- Beim Beginn dieser Änderung wurden die zwischenzeitlich veröffentlichten Änderungen bis `7be18b3` übernommen, inklusive aktuellem iPad-Player und vereinfachten Perlenmustern. Primärcheckout `C:/Grok Code/schrittli` nicht überschreiben.

## Aktuell: grafische Überarbeitung vom 27.10.2026

Der Nutzer hat die Umsetzung freigegeben und künstlerische Freiheit erteilt. Priorität: grosse echte Ergebnisbilder, kurze Texte für die 1./2. Klasse, sofort erkennbares Werkstück. Vorhandene Illustrationen dürfen ersetzt werden; Projektfotos sollen natürlich bleiben. Am 27.10.2026 wurde auch der Push auf die bestehende öffentliche GitHub-Pages-Seite ausdrücklich freigegeben. Die Überarbeitung umfasst:

- Gemeinsame neue Startseite für Familie und Schule mit ausgewählten Projektfotos; Themen bleiben erreichbar. Katalog über volle Breite mit Suche sowie Projekt-/Technik-/Fotofiltern. Klassenfilter bleibt erhalten.
- Ruhiger Lernbereich mit aktuellem Schritt und aufklappbarer Übersicht; Foto-Anleitungen mit grossen Bildern und zusätzlichen Informationen auf Nachfrage. Fortschritt wird bei Schrittwechseln sofort gespeichert. Zurück führt zur vorherigen Auswahl.
- Creme, Petrol, Salbei und warme Akzente, grosse Tasten, Tastaturfokus, Dialog-Fokusführung, wieder erlaubtes Zoomen. Echte Rückstich-Vorschau aus dem vorhandenen Video statt Texttitelbild.
- `node quelle/bauen.cjs` baut beide Ausgaben; `quelle/player-design.css` gehört zum Build. `bauen.sh` delegiert an diesen portablen Build.
- `node werkzeug/design-pruefen.cjs --built` prüft Inhalte, Bildpfade, Klassen/Filter, beide HTML-Ausgaben und Schrittlogik. Offline-Prüfung umfasst 134 Ansichten und über 1’500 Projektzuordnungen. Kein Ersatz für Gerätetests.
- Lokale Vorschau: `node werkzeug/vorschau-server.cjs`, nur `127.0.0.1:8766`. Die Browser-Sichtprüfung wurde durch eine gespeicherte Berechtigung blockiert, auch nach erneuter Freigabe im Chat. Nicht als visuell geprüft ausgeben. iPad und reale YouTube-Wiedergabe noch prüfen.

**Weiterhin offen:** Der Nutzer möchte die App nur intern zugänglich machen. Echten Zugangsschutz inklusive Dateien und bisheriger öffentlicher Adresse separat umsetzen; diese grafische Überarbeitung führt keine Zugriffssicherung ein. Keine neuen Buch-/TuD-Inhalte öffentlich veröffentlichen. TuD-Bilder sollen inzwischen nur als Inspiration dienen, keine vollständigen Schrittfolgen mehr. Grok darf für Bildmaterial angesprochen werden, der Zugriff auf Grok Bot wurde jedoch von der App-Berechtigung abgelehnt; keine Nachricht gesendet.

Die älteren Notizen unten dokumentieren die Vorgeschichte. Bei widersprüchlichen Angaben gelten die aktuellen Punkte und `LIESMICH.md`.

Für die nächste Claude-Sitzung (anderes Konto, kein Gedächtnis). Alles Nötige liegt in diesem Repo.

## Was das ist

Kinder-Lern-App mit Schritt-Modus-Videoplayer (YouTube-Videos halten am Ende jedes Schritts an). Zwei Ausgaben aus einem Code:

- **Familie:** https://conradinjoos-lab.github.io/schrittli/ – für Conradins Tochter (1. Klasse, liest nur Grossbuchstaben). Elternbereich mit PIN 1234, Katalog, Sterne (aus), Aufgaben, Werke.
- **Schule:** https://conradinjoos-lab.github.io/schrittli/schule/ – TTG-Unterricht Primarschule Neunkirch, kein Login, Klasse wählen (1–6), dann nach **Verfahren** geordnet (Nähen, Sticken, Häkeln, Stricken, Weben, Flechten & Knüpfen, Wickeln, Filzen, Falten, Schneiden & Kleben, Sägen & Nageln, Schnitzen, Formen, Drucken, Experimentieren). Zweck: **Zwischenarbeiten** für Kinder, die früher fertig sind. Unten «Für Lehrpersonen»: Liste mit Klassen, Material, QR-Code pro Video.

Repo: `conradinjoos-lab/schrittli` (GitHub Pages, Branch main, Cache bis 10 Min – zum Prüfen `?neu=N` anhängen).

## Dateien

| Datei | Zweck |
|---|---|
| `quelle/p1.html` | HTML-Kopf + gesamtes CSS, endet mit `<script>` |
| `quelle/p2.js` | gesamtes JavaScript (ein File, kein Build-Tool) |
| `quelle/bauen.sh` | erzeugt `index.html` (Familie) und `schule/index.html` (Schule, mit `window.SCHULE=true`) – **nie die index.html direkt editieren** |
| `inhalte.json` | Videos der Familienversion (55), wird beim Start geladen und überschreibt gleichnamige IDs |
| `katalog.json` | Vorauswahl für Eltern (76), im Elternbereich → Katalog mit «Hinzufügen» |
| `schule/schule.json` | Videos der Schulversion (119 veröffentlicht, 24.10.2026): `areaId` = Verfahren, `stufen` = Klassen [1–6], `material` = IDs, optional `zeit` = Minuten (1–15) für Mini-Projekte |
| `material/` | Material-Fotos `<id>.png/.jpg` + `fotos.json` (Liste der vorhandenen Dateinamen) + `PROMPTS-GROK.md` |
| `quelle/agenten/` | Briefings für Agenten: Schritte schreiben (`SCHRITTE-BRIEF.md`), Materiallisten, Piktogramme, Vokabular |
| `LIESMICH.md` | Funktionsbeschreibung für Conradin |

Zustand im Browser: localStorage `schrittli.v1` (Familie) bzw. `schrittli.schule.v1` (Schule, speichert nur die Klasse). Migration über `settings.sv` in `load()`.

## Wie neue Videos entstehen (seit 24.10.2026: `werkzeug/`)

1. Conradin schickt YouTube-Link(s) oder nennt Techniken.
2. In Claude Code im Repo: `/schritte <Links>`. Das ruft `python werkzeug/holen.py` (yt-dlp: Einbettbarkeit, Transkript, 360p-Video; ffmpeg: Bildwechsel, Sprechpausen, Einzelbilder 2/s; Pillow: Kontaktblätter) und startet pro Video einen Agenten mit `werkzeug/SCHRITTE-LOKAL.md`. Ergebnis: `werkzeug/entwurf/<ID>/video.json`. Kein Browser nötig.
3. Kontrolle: `python werkzeug/kontrolle.py` → http://127.0.0.1:8765/ – Player, Filmstreifen um jeden Stopp, Transkript, Bildwechsel; Stopps auf Zehntelsekunden setzen, «Schritt testen» zeigt genau den Halt, den das Kind sieht. Knopf «Veröffentlichen…» zeigt die Änderung an schule.json und schreibt den Eintrag (ersetzt gleiche id / gleiches Video). Bedienung: `werkzeug/LIESMICH.md`.
4. Commit, push. `bash quelle/bauen.sh` nur bei Code-Änderungen.

**Serienproduktion (24.10.2026, 63 Entwürfe in einem Durchgang, 60 nach Kontrolle):** Kandidaten über die YouTube-Suche (`yt-dlp "ytsearch…"`) nach dünn besetzten Verfahren suchen, `holen.py` für alle, dann pro Video ein Entwurfsagent (bis 20 parallel). Danach `python werkzeug/pruefen.py` (`!` = Fehler, `?` = Hinweis) und eine zweite Runde **Kontrollagenten** (je ~8 Videos): sie prüfen jeden Stopp gegen Einzelbilder, Schreibweise (ss statt ß, Du-Form), Sicherheit im `hinweis`, Material-IDs gegen `quelle/agenten/VOKABULAR.md`, und korrigieren direkt in `video.json`. Erst dann Veröffentlichen. Neue Material-IDs müssen gleichzeitig in VOKABULAR.md **und** in `MATERIAL` in `quelle/p2.js` eingetragen werden, sonst meldet pruefen.py einen Fehler.

Erkenntnis aus dem Pompon-Test: die starken Bildwechsel (scene score ≥ 0.28) liegen fast genau auf den von Hand gesetzten Stopps. Regel im Brief: Stopp auf den Bildwechsel vor dem Sprechbeginn, nie auf den Sprechbeginn selbst.

Alter Ablauf (Chrome-Agenten, Transkript von der Watch-Seite, Canvas-Kontaktblatt) steht noch in `quelle/agenten/SCHRITTE-BRIEF.md`, wird aber nicht mehr gebraucht. `werkzeug/cache/` und `werkzeug/entwurf/` sind gitignored.

Playwright-Smoke-Tests: Chromium unter `/opt/pw-browsers/chromium`, `NODE_PATH=$(npm root -g)`; Ordner per kleinem http-Server ausliefern (YouTube spielt headless nicht, Logik lässt sich aber über `P.mode`/`updatePlayerUI()` testen).

## Wichtige Entscheide von Conradin

- Kinderseite: wenig Symbole. Nur Bereiche mit Videos im Regal; Spass-Bereiche und Sterne standardmässig aus.
- Kein Zwischenbildschirm am Schrittende; kleines Schild «Jetzt du» im Bild; automatisches Vorlesen aus (Stimme war schrecklich).
- Kino-Modus (Knopf ⤢): Video bildschirmfüllend, Schritte als Band unten. **Echtes Vollbild auf dem iPad noch nicht geprüft.**
- Player muss ohne Scrollen auf PC/iPad quer passen (gelöst über `--pl-avail`, `fitPlayer()`).
- Schulversion: **eigener Ordner**, Klassen 1–6 einzeln (sehr wichtig), Ordnung nach Verfahren, kein Zeichnen/Sachwissen, keine Aufgabe am Schluss. Experimentieren ist drin, obwohl kein TTG-Verfahren – offen, ob es bleibt.
- **Schnitzen** ist seit 24.10.2026 ein eigenes Verfahren (`areaId: schnitzen`, Klassen 3–6; jeder `hinweis` nennt Schnitzregeln und Handschuh). **Mini-Projekte** unter 15 Minuten (kurze Reels) tragen das Feld `zeit`; die App zeigt es als Zeitschild auf der Karte und in der Lehrpersonen-Liste, damit Kinder mit wenig Restzeit etwas finden.
- Schritt 1 ist immer **Material richten** (Materialkarte statt Video). Conradin will dafür **echte Fotos von oben, freigestellt** – nicht Piktogramme. Entscheid: Bilder mit **Grok** erzeugen; die Prompts liegen fertig in `material/PROMPTS-GROK.md` (65 Materialien). Piktogramme (20 gezeichnet + Emoji) bleiben Platzhalter.
- Für die Ex-Frau muss alles ohne Conradin laufen: kein Server, kein API-Schlüssel. Deshalb liegt die Automatik getrennt in `werkzeug/` (nur auf Conradins Rechner); die App selbst bleibt ohne Server.
- Material aus `G:\Meine Ablage\01_TTG\40_Bausteine` (buntgewerkt.de, © 2021) darf **nicht** öffentlich ins Repo. Conradins eigene Liste «Ideen 1.–3. Klasse» (70_Fundus/Ideen) bestimmt die Klassenzuordnung der Techniken.

## Offen (in dieser Reihenfolge sinnvoll)

1. **Material-Fotos**: Conradin erzeugt sie mit Grok nach `material/PROMPTS-GROK.md` und liefert sie. Dann: quadratisch zuschneiden/verkleinern (≈ 512 px), als `material/<id>.png` ablegen, `material/fotos.json` → `{"fotos":["wolle.png",…]}`. App zeigt sie automatisch (Code ist drin, `MAT_FOTOS`).
2. **Editor-Umbau** (zurückgestellt, 24.10.2026: Inhalt und Kontrolle haben Vorrang; nicht gebaut): Link einfügen → «Prüfen» → grosser Knopf **STOPP HIER** setzt Schritte ohne Tippen (Label optional, sonst «Schritt n»); Schritte verschieben/löschen; **Teilen-Link** eines Videos mit Schritten, den die App beim Einfügen erkennt und übernimmt (für zwei Haushalte; der Schul-Link `#s=` existiert schon und trägt seit 24.10.2026 auch das Material als `m`, `schoolLink()`/`parseSchool()`).
3. iPad-Test: Vollbild im Kino-Modus (Safari), Materialkarte, Touch.
4. **Schulvideos veröffentlichen**: 15 Entwürfe mit Schritten sind erarbeitet und Bild für Bild kontrolliert (24.10.2026): Formen 3 (Daumenschale, Tonwulst-Vase, Salzteig-Herz), Drucken 4 (Kartoffeldruck Stoff/Kacheln, Moosgummi-Stempel, Polystyrol), Weben 3 (Papier, Webrahmen Karton, Lama), Holz 2 (Laubsäge, Richtig sägen), Stricken 2 (Kreuzanschlag, rechte Masche) und der Geist (`srf-geist`, ersetzt den Eintrag ohne Schritte). Sie liegen in `werkzeug/entwurf/<ID>/video.json` (gitignored, nur auf Conradins Rechner) und warten auf «Veröffentlichen» in der Kontrollseite → schule.json → push.
5. Review-Punkte, noch nicht entschieden: Lieder → Lern-Bereich; Bonus-Stern abschaffen; Kurzlabel + langer Vorlesetext pro Schritt; Werke exportieren.
6. Sprachsteuerung «Stopp» ist experimentell (Web Speech); Alternativen Lautstärke-/Klatsch-Erkennung oder Porcupine wurden nur besprochen.

## Arbeitsweise mit Conradin

Diktiert per Spracherkennung (Hörfehler am Sinn erkennen). Kurz und direkt antworten, Schweizer Rechtschreibung (ss). Vor grösseren Arbeiten den Plan zeigen, dann bauen. Ehrlich sagen, was nicht geht. Dateien ersetzen statt Versionen daneben legen. Er will, dass Agenten parallel laufen, wenn es schneller geht.
