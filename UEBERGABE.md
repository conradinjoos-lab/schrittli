# Übergabe «Schritt für Schritt» (intern `schrittli`) – Stand 31.10.2026

Für die nächste Claude-Sitzung (anderes Konto, kein Gedächtnis). Alles Nötige liegt in diesem Repo. **Zuerst `AGENTS.md` lesen** (feste Regeln: keine Infotexte, kein «Aufs Handy holen»).

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
| `quelle/bauen.sh` | erzeugt `familie.html` (Familie, seit 31.10.2026 ohne Link), `index.html` (Weiterleitung zur Schule aus `quelle/weiter.html`) und `schule/index.html` (Schule, mit `window.SCHULE=true`) – **nie die gebauten Dateien direkt editieren** |
| `inhalte.json` | Videos der Familienversion (55), wird beim Start geladen und überschreibt gleichnamige IDs |
| `katalog.json` | Vorauswahl für Eltern (76), im Elternbereich → Katalog mit «Hinzufügen» |
| `schule/schule.json` | Videos der Schulversion (357 veröffentlicht, 30.10.2026; optional `vorlagen` = Links in den Vorlagen-Generator): `areaId` = Verfahren, `stufen` = Klassen [1–6], `material` = IDs, optional `zeit` = Minuten (1–15) für Mini-Projekte |
| `material/` | Material-Fotos `<id>.png/.jpg` + `fotos.json` (Liste der vorhandenen Dateinamen) + `PROMPTS-GROK.md` |
| `quelle/agenten/` | Briefings für Agenten: Schritte schreiben (`SCHRITTE-BRIEF.md`), Materiallisten, Piktogramme, Vokabular |
| `LIESMICH.md` | Funktionsbeschreibung für Conradin |
| `vorlagen/` | Vorlagen-Generator (`?form=…&b=…` oder `?liste=id:BxH:n,…`), Formen in `vorlagen/formen.js`, erzeugt aus `werkzeug/vorlagen/formen*.py` (`python formen.py` im Ordner); Übersicht `VORLAGEN-BIBLIOTHEK.md` |
| `vorlagen/<werkzeug>/` | Werkzeuge der App, nach Räumen: Perlentiere, Perlentier aus Bild, Armbänder, Abpausen, Zählmuster, Maschen-Planer, Klassen-Werkzeuge, Bohrvorlage, Stromkreis-Baukasten, Mechanik-Planer, Kisten-Planer |
| `kontrolle/` | Online-Kontrolle: Anmeldung über den Cloudflare Worker `werkzeug/anmelden` und die GitHub App «Schrittli Kontrolle»; Geheimnisse nur im KV des Workers |
| `vorschau/` | ruhige Vorschaubilder ohne Menschen (`werkzeug/vorschau.py`, Ablauf in der Skill `schritte`, Schritt 5) |
| `AGENTS.md`, `.agents/skills/` | feste Regeln und die Skill `schritte` für andere Agenten (gleich wie `.claude/skills/`) |

Zustand im Browser: localStorage `schrittli.v1` (Familie) bzw. `schrittli.schule.v1` (Schule). Migration über `settings.sv` in `load()`, Schule steht auf 5.

## Arbeitsablauf der Schule (31.10.2026)

Conradin hat nur 3 iPads, oft arbeiten 2–3 Kinder an einem. Der Ablauf heisst: Projekt wählen → Material richten → arbeiten → später weiterarbeiten → Werk abgeben.

- **Arbeitsstand:** `S.arbeit[kind][videoId]` mit `pos`, `step`, `max`, `erledigt`, `material`, `entwuerfe`, `zeit`, `werkFertig`. Ein Eintrag für jedes gewählte Kind; anonym zählt `_ohne`.
- **Foto:** eines für alle gewählten Namen, Wahl nach der Abgabe leer, Sterne freiwillig, Zustand sichtbar (`fotoZustandHtml`). Spalte `bewertet` in `schulwerke` trennt «keine Sterne» von alten Fotos.
- **Kinderstand:** Die App sendet gebündelt an `POST /unterricht/kindstand`, die Kontrolle liest mit `GET` (Tabelle `unterricht_kindstand`).
- **Fehlermeldung:** `vorlagen/melden.js` auf jeder Seite. `/melden` nimmt 200 pro Stunde an und speichert `stand`, damit die Kontrolle den Bau kennt. Während der Einfrieren-Sperre gibt es bewusst keine Flagge.
- **Prüfgerüst:** `werkzeug/ablauf-test/` spielt 137 Abläufe durch, Bedienung in `werkzeug/LIESMICH.md`. Der Lauf ist manuell, kein GitHub Action.
- **Reihenfolge beim Veröffentlichen:** zuerst Migrationen `0005_bewertet` und `0006_kindstand` (`schrittli-werke`), dann Worker, dann App und Kontrolle.

## Wie neue Videos entstehen (seit 24.10.2026: `werkzeug/`)

1. Conradin schickt YouTube-Link(s) oder nennt Techniken.
2. In Claude Code im Repo: `/schritte <Links>`. Das ruft `python werkzeug/holen.py` (yt-dlp: Einbettbarkeit, Transkript, 360p-Video; ffmpeg: Bildwechsel, Sprechpausen, Einzelbilder 2/s; Pillow: Kontaktblätter) und startet pro Video einen Agenten mit `werkzeug/SCHRITTE-LOKAL.md`. Ergebnis: `werkzeug/entwurf/<ID>/video.json`. Kein Browser nötig.
3. Kontrolle: `python werkzeug/kontrolle.py` → http://127.0.0.1:8765/ – Player, Filmstreifen um jeden Stopp, Transkript, Bildwechsel; Stopps auf Zehntelsekunden setzen, «Schritt testen» zeigt genau den Halt, den das Kind sieht. Knopf «Veröffentlichen…» zeigt die Änderung an schule.json und schreibt den Eintrag (ersetzt gleiche id / gleiches Video). Bedienung: `werkzeug/LIESMICH.md`.
4. Commit, push. `bash quelle/bauen.sh` nur bei Code-Änderungen.

**Serienproduktion (24.10.2026, 63 Entwürfe in einem Durchgang, 60 nach Kontrolle):** Kandidaten über die YouTube-Suche (`yt-dlp "ytsearch…"`) nach dünn besetzten Verfahren suchen, `holen.py` für alle, dann pro Video ein Entwurfsagent (bis 20 parallel). Danach `python werkzeug/pruefen.py` (`!` = Fehler, `?` = Hinweis) und eine zweite Runde **Kontrollagenten** (je ~8 Videos): sie prüfen jeden Stopp gegen Einzelbilder, Schreibweise (ss statt ß, Du-Form), Sicherheit im `hinweis`, Material-IDs gegen `quelle/agenten/VOKABULAR.md`, und korrigieren direkt in `video.json`. Erst dann Veröffentlichen. Neue Material-IDs müssen gleichzeitig in VOKABULAR.md **und** in `MATERIAL` in `quelle/p2.js` eingetragen werden, sonst meldet pruefen.py einen Fehler.

Erkenntnis aus dem Pompon-Test: die starken Bildwechsel (scene score ≥ 0.28) liegen fast genau auf den von Hand gesetzten Stopps. Regel im Brief: Stopp auf den Bildwechsel vor dem Sprechbeginn, nie auf den Sprechbeginn selbst.

Alter Ablauf (Chrome-Agenten, Transkript von der Watch-Seite, Canvas-Kontaktblatt) steht noch in `quelle/agenten/SCHRITTE-BRIEF.md`, wird aber nicht mehr gebraucht. `werkzeug/cache/` und `werkzeug/entwurf/` sind gitignored.

Playwright-Smoke-Tests (Windows): `NODE_PATH="C:/Grok Code/Steine-App/node_modules"`, `executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'`; Ordner per kleinem http-Server ausliefern (YouTube spielt headless nicht, Logik lässt sich aber über `P.mode`/`updatePlayerUI()` testen).

## Wichtige Entscheide von Conradin

- Kinderseite: wenig Symbole. Nur Bereiche mit Videos im Regal; Spass-Bereiche und Sterne standardmässig aus.
- Kein Zwischenbildschirm am Schrittende; kleines Schild «Jetzt du» im Bild; automatisches Vorlesen aus (Stimme war schrecklich).
- Kino-Modus (Knopf ⤢): Video bildschirmfüllend, Schritte als Band unten. **Echtes Vollbild auf dem iPad noch nicht geprüft.**
- Player muss ohne Scrollen auf PC/iPad quer passen (gelöst über `--pl-avail`, `fitPlayer()`).
- Schulversion: **eigener Ordner**, Klassen 1–6 einzeln (sehr wichtig), Ordnung nach Verfahren, kein Zeichnen/Sachwissen, keine Aufgabe am Schluss. Experimentieren ist drin, obwohl kein TTG-Verfahren – offen, ob es bleibt.
- **Schnitzen** ist seit 24.10.2026 ein eigenes Verfahren (`areaId: schnitzen`, Klassen 3–6; jeder `hinweis` nennt Schnitzregeln und Handschuh). **Mini-Projekte** unter 15 Minuten (kurze Reels) tragen das Feld `zeit`; die App zeigt es als Zeitschild auf der Karte und in der Lehrpersonen-Liste, damit Kinder mit wenig Restzeit etwas finden.
- Schritt 1 ist immer **Material richten** (Materialkarte statt Video). Conradin will dafür **echte Fotos von oben, freigestellt** – nicht Piktogramme. Entscheid: Bilder mit **Grok** erzeugen; die Prompts liegen fertig in `material/PROMPTS-GROK.md` (65 Materialien). Piktogramme (20 gezeichnet + Emoji) bleiben Platzhalter.
- Für die Ex-Frau muss alles ohne Conradin laufen: kein Server, kein API-Schlüssel. Deshalb liegt die Automatik getrennt in `werkzeug/` (nur auf Conradins Rechner); die App selbst bleibt ohne Server.
- Unterrichtsmaterial wird eingebaut, wenn Conradin es verlangt (siehe `CLAUDE.md`). Conradins eigene Liste «Ideen 1.–3. Klasse» (70_Fundus/Ideen) bestimmt die Klassenzuordnung der Techniken.

## Offen (in dieser Reihenfolge sinnvoll)

1. **Material-Fotos**: Conradin erzeugt sie mit Grok nach `material/PROMPTS-GROK.md` und liefert sie. Dann: quadratisch zuschneiden/verkleinern (≈ 512 px), als `material/<id>.png` ablegen, `material/fotos.json` → `{"fotos":["wolle.png",…]}`. App zeigt sie automatisch (Code ist drin, `MAT_FOTOS`).
2. **iPad-Test auf dem echten Gerät** (Safari): Vollbild im Kino-Modus, Materialkarte, Touch, neuer Editor. Emuliert (Playwright, iPad-Grösse mit Touch) läuft der Editor; echtes Safari-Vollbild lässt sich nur auf dem Gerät prüfen.
3. Noch nicht entschieden: Experimentieren in der Schulversion behalten?; versteckte Funktionen (Wunschformular, Werkzeug-Führerschein, Fachwort-Karten, Verfahrenspass) zeigen oder weglassen; Lieder → Lern-Bereich; Bonus-Stern abschaffen; Kurzlabel + langer Vorlesetext pro Schritt; Werke exportieren.
4. Sprachsteuerung «Stopp» ist experimentell (Web Speech); Alternativen Lautstärke-/Klatsch-Erkennung oder Porcupine wurden nur besprochen.

Erledigt seit 24.10.2026: Editor-Umbau (grosser Knopf **STOPP HIER**, Schritte mit − / + verschieben, Teilen-Link `#s=` mit Schritten und Material wird im Link-Feld erkannt und übernommen, `decodeShare()`); alle Entwürfe veröffentlicht (zuletzt fünf Bastelvideos mit eigenen Vorlagen Fledermaus, Geist, Wintermütze).

## Arbeitsweise mit Conradin

Diktiert per Spracherkennung (Hörfehler am Sinn erkennen). Kurz und direkt antworten, Schweizer Rechtschreibung (ss). Vor grösseren Arbeiten den Plan zeigen, dann bauen. Ehrlich sagen, was nicht geht. Dateien ersetzen statt Versionen daneben legen. Er will, dass Agenten parallel laufen, wenn es schneller geht.
