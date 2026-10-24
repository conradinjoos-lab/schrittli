# Übergabe «Schrittli» – Stand 24.10.2026, 05:10

Für die nächste Claude-Sitzung (anderes Konto, kein Gedächtnis). Alles Nötige liegt in diesem Repo.

## Was das ist

Kinder-Lern-App mit Schritt-Modus-Videoplayer (YouTube-Videos halten am Ende jedes Schritts an). Zwei Ausgaben aus einem Code:

- **Familie:** https://conradinjoos-lab.github.io/schrittli/ – für Conradins Tochter (1. Klasse, liest nur Grossbuchstaben). Elternbereich mit PIN 1234, Katalog, Sterne (aus), Aufgaben, Werke.
- **Schule:** https://conradinjoos-lab.github.io/schrittli/schule/ – TTG-Unterricht Primarschule Neunkirch, kein Login, Klasse wählen (1–6), dann nach **Verfahren** geordnet (Nähen, Sticken, Häkeln, Stricken, Weben, Flechten & Knüpfen, Wickeln, Filzen, Falten, Schneiden & Kleben, Sägen & Nageln, Formen, Drucken, Experimentieren). Zweck: **Zwischenarbeiten** für Kinder, die früher fertig sind. Unten «Für Lehrpersonen»: Liste mit Klassen, Material, QR-Code pro Video.

Repo: `conradinjoos-lab/schrittli` (GitHub Pages, Branch main, Cache bis 10 Min – zum Prüfen `?neu=N` anhängen).

## Dateien

| Datei | Zweck |
|---|---|
| `quelle/p1.html` | HTML-Kopf + gesamtes CSS, endet mit `<script>` |
| `quelle/p2.js` | gesamtes JavaScript (ein File, kein Build-Tool) |
| `quelle/bauen.sh` | erzeugt `index.html` (Familie) und `schule/index.html` (Schule, mit `window.SCHULE=true`) – **nie die index.html direkt editieren** |
| `inhalte.json` | Videos der Familienversion (55), wird beim Start geladen und überschreibt gleichnamige IDs |
| `katalog.json` | Vorauswahl für Eltern (76), im Elternbereich → Katalog mit «Hinzufügen» |
| `schule/schule.json` | Videos der Schulversion (45): `areaId` = Verfahren, `stufen` = Klassen [1–6], `material` = IDs |
| `material/` | Material-Fotos `<id>.png/.jpg` + `fotos.json` (Liste der vorhandenen Dateinamen) + `PROMPTS-GROK.md` |
| `quelle/agenten/` | Briefings für Agenten: Schritte schreiben (`SCHRITTE-BRIEF.md`), Materiallisten, Piktogramme, Vokabular |
| `LIESMICH.md` | Funktionsbeschreibung für Conradin |

Zustand im Browser: localStorage `schrittli.v1` (Familie) bzw. `schrittli.schule.v1` (Schule, speichert nur die Klasse). Migration über `settings.sv` in `load()`.

## Wie neue Videos entstehen (bewährter Ablauf)

1. Conradin schickt YouTube-Link(s) oder nennt Techniken.
2. **Einbettung prüfen** auf der Live-Seite im Chrome des Nutzers (Claude-in-Chrome): `YT.Player` je ID anlegen, `onError` 101/150 = nicht einbettbar. Script steht sinngemäss in `quelle/agenten/SCHRITTE-BRIEF.md`.
3. **Transkript holen** über die YouTube-Watch-Seite (Beschreibung aufklappen → «Transkript anzeigen» → Panel-Text parsen). Ohne Transkript: **Kontaktblatt** aus 12 Standbildern per Canvas und Screenshot. Beides als fertiges JavaScript im Brief.
4. **Schritte schreiben**: Regeln im Brief (erster Schritt «Material richten», Stopps 1–2 s vor der gesprochenen Anweisung, Labels max. 8 Wörter, Schweizer Schreibweise ss). Mehrere Agenten parallel – jeder im eigenen Chrome-Tab – hat gut funktioniert (4 Agenten, je 4–5 Videos, ca. 10 Min).
5. Eintrag in `schule/schule.json` (mit `stufen`, `material`) und/oder `inhalte.json`/`katalog.json`. Nicht erfinden: Video-IDs nur aus echten Suchergebnissen.
6. `bash quelle/bauen.sh` nur nötig, wenn Code geändert wurde; JSON-Änderungen brauchen keinen Build. Commit, push.

Playwright-Smoke-Tests: Chromium unter `/opt/pw-browsers/chromium`, `NODE_PATH=$(npm root -g)`; Ordner per kleinem http-Server ausliefern (YouTube spielt headless nicht, Logik lässt sich aber über `P.mode`/`updatePlayerUI()` testen).

## Wichtige Entscheide von Conradin

- Kinderseite: wenig Symbole. Nur Bereiche mit Videos im Regal; Spass-Bereiche und Sterne standardmässig aus.
- Kein Zwischenbildschirm am Schrittende; kleines Schild «Jetzt du» im Bild; automatisches Vorlesen aus (Stimme war schrecklich).
- Kino-Modus (Knopf ⤢): Video bildschirmfüllend, Schritte als Band unten. **Echtes Vollbild auf dem iPad noch nicht geprüft.**
- Player muss ohne Scrollen auf PC/iPad quer passen (gelöst über `--pl-avail`, `fitPlayer()`).
- Schulversion: **eigener Ordner**, Klassen 1–6 einzeln (sehr wichtig), Ordnung nach Verfahren, kein Zeichnen/Sachwissen, keine Aufgabe am Schluss. Experimentieren ist drin, obwohl kein TTG-Verfahren – offen, ob es bleibt.
- Schritt 1 ist immer **Material richten** (Materialkarte statt Video). Conradin will dafür **echte Fotos von oben, freigestellt** – nicht Piktogramme. Entscheid: Bilder mit **Grok** erzeugen; die Prompts liegen fertig in `material/PROMPTS-GROK.md` (65 Materialien). Piktogramme (20 gezeichnet + Emoji) bleiben Platzhalter.
- Für die Ex-Frau muss alles ohne Conradin laufen: kein Server, kein API-Schlüssel. Deshalb kein automatischer Schritte-Generator.
- Material aus `G:\Meine Ablage\01_TTG\40_Bausteine` (buntgewerkt.de, © 2021) darf **nicht** öffentlich ins Repo. Conradins eigene Liste «Ideen 1.–3. Klasse» (70_Fundus/Ideen) bestimmt die Klassenzuordnung der Techniken.

## Offen (in dieser Reihenfolge sinnvoll)

1. **Material-Fotos**: Conradin erzeugt sie mit Grok nach `material/PROMPTS-GROK.md` und liefert sie. Dann: quadratisch zuschneiden/verkleinern (≈ 512 px), als `material/<id>.png` ablegen, `material/fotos.json` → `{"fotos":["wolle.png",…]}`. App zeigt sie automatisch (Code ist drin, `MAT_FOTOS`).
2. **Editor-Umbau** (versprochen, nicht gebaut): Link einfügen → «Prüfen» → grosser Knopf **STOPP HIER** setzt Schritte ohne Tippen (Label optional, sonst «Schritt n»); Schritte verschieben/löschen; **Teilen-Link** eines Videos mit Schritten, den die App beim Einfügen erkennt und übernimmt (für zwei Haushalte; der Schul-Link `#s=` existiert schon, `schoolLink()`/`parseSchool()`).
3. iPad-Test: Vollbild im Kino-Modus (Safari), Materialkarte, Touch.
4. Leere Verfahren füllen: Formen (Ton/Fimo), Drucken, mehr Sägen & Nageln, Stricken «rechte Maschen» (nur lange Videos gefunden).
5. Review-Punkte, noch nicht entschieden: Lieder → Lern-Bereich; Bonus-Stern abschaffen; Kurzlabel + langer Vorlesetext pro Schritt; Werke exportieren.
6. Sprachsteuerung «Stopp» ist experimentell (Web Speech); Alternativen Lautstärke-/Klatsch-Erkennung oder Porcupine wurden nur besprochen.

## Arbeitsweise mit Conradin

Diktiert per Spracherkennung (Hörfehler am Sinn erkennen). Kurz und direkt antworten, Schweizer Rechtschreibung (ss). Vor grösseren Arbeiten den Plan zeigen, dann bauen. Ehrlich sagen, was nicht geht. Dateien ersetzen statt Versionen daneben legen. Er will, dass Agenten parallel laufen, wenn es schneller geht.
