# werkzeug/ – Videos halbautomatisch erfassen

Läuft nur auf dem Rechner, der Videos erfasst. Die App selbst braucht nichts davon (kein Server, kein Schlüssel).

## Voraussetzungen (einmalig)

- Python 3.10+ mit `pip install yt-dlp pillow`
- ffmpeg im PATH (`ffmpeg -version`)
- Für den Entwurf der Schritte: Claude Code im Repo-Ordner (Skill `/schritte`), oder die Datei `SCHRITTE-LOKAL.md` von Hand abarbeiten.

## Ablauf

| Schritt | Befehl | Ergebnis |
|---|---|---|
| 1 Holen | `python werkzeug/holen.py <Link oder ID> …` | `cache/<ID>/` (video.mp4, Einzelbilder 2/s, analyse.json) und `entwurf/<ID>/` (brief.md, Kontaktblätter) |
| 2 Entwerfen | in Claude Code: `/schritte <Links>` – oder einen Agenten mit `SCHRITTE-LOKAL.md` losschicken | `entwurf/<ID>/video.json` |
| 2a Regeln prüfen | `python werkzeug/pruefen.py [<ID> …]` | prüft alle Entwürfe (oder nur die genannten) gegen `SCHRITTE-LOKAL.md`: `!` Fehler müssen weg (Exit 1), `?` Hinweise anschauen (z. B. kein Bildwechsel nahe am Stopp, Stopps unter 3 s) |
| 2b Hochladen | `python werkzeug/werkstatt.py` | Entwürfe, Transkripte und Filmstreifen ins private Repo `schrittli-werkstatt` (holt vorher online Gespeichertes) |
| 3 Kontrollieren | `python werkzeug/kontrolle.py` → http://127.0.0.1:8765/ – oder online https://conradinjoos-lab.github.io/schrittli/kontrolle/ | Stopps auf Zehntelsekunden setzen, Material, Klassen, Hinweis prüfen |
| 4 Übernehmen | Knopf «Veröffentlichen…» (oder `python werkzeug/kontrolle.py --uebernehmen <ID>`) | Eintrag in `schule/schule.json`, bestehender Eintrag mit gleicher id oder gleichem Video wird ersetzt |
| 5 Veröffentlichen | lokal: `git add schule/schule.json && git commit && git push` · online: geschieht beim Klick direkt | kein Build nötig |

`/schritte` macht 1–3 in einem Zug.

## Kontrollseite – Bedienung

Die Seiten liegen in `kontrolle/` (index.html, video.html, werkstatt.js), der lokale Server ist `kontrolle.py`.

**Online:** Dieselben Seiten laufen auf GitHub Pages unter https://conradinjoos-lab.github.io/schrittli/kontrolle/. Sie lesen und schreiben über die GitHub-API:

- Entwürfe, Transkripte und Filmstreifen im privaten Repo `schrittli-werkstatt`. `werkzeug/entwurf` ist dessen Klon (`python werkzeug/werkstatt.py --einrichten`, einmalig). `python werkzeug/werkstatt.py` gleicht ab: holt online Gespeichertes, erneuert `liste.json`, `vorschau.jpg`, `meta.json` und die Filmstreifen, lädt hoch.
- Speichern = ein Commit im Werkstatt-Repo. «Veröffentlichen» = ein Commit auf `schule/schule.json` im App-Repo, nach etwa einer Minute live. Danach lokal `git pull`, bevor du selber committest.
- Einmal pro Gerät **Mit GitHub anmelden**. Der Schlüssel bleibt im Browser, gilt 8 Stunden und wird von selbst erneuert; «Auf diesem Gerät abmelden» unter «Neue Videos holen?». Notlösung ohne Anmeldung: unter «Ohne Anmeldung» einen Fine-grained token einfügen (Repos `schrittli` und `schrittli-werkstatt`, Contents: Read and write).

**Anmeldestelle** (`werkzeug/anmelden/`, Cloudflare Worker unter https://schrittli-anmelden.conradinjoos.workers.dev): hält Client-ID und Geheimnis der GitHub App «Schrittli Kontrolle» (Konto conradinjoos-lab, installiert nur auf `schrittli` und `schrittli-werkstatt`, Recht: Contents lesen und schreiben). Zurück zur Seite kommt nur ein Abholschein, der Schlüssel selbst geht per POST, und nur an `conradinjoos-lab.github.io`. Darum lässt sich die Anmeldung lokal nicht testen; lokal braucht es sie auch nicht.

**Rückmeldungen der Kinder:** `kontrolle/rueckmeldungen.html` verwendet dieselbe Anmeldung. Der Server prüft für jede Liste, Aufnahme und Verwaltungsaktion zusätzlich die GitHub-Identität `conradinjoos-lab`. Eine Klasse anlegen und den einmal angezeigten Klassenlink auf jedem Tablet öffnen. In der installierten App stattdessen unter «Für Lehrpersonen» → «Tablet verbinden» einfügen. Der Link erlaubt ausschliesslich Abgaben und lässt sich sperren. Er gehört nicht ins Repository.

Die zwei Bewertungen und freiwillige Aufnahme (höchstens 60 Sekunden / 1 MiB) liegen in der privaten D1-Datenbank `schrittli-rueckmeldungen`, EU-Jurisdiktion, nicht auf GitHub. Keine Namen der Kinder werden abgefragt. Nach 90 Tagen sind Einträge nicht mehr abrufbar; die tägliche Bereinigung entfernt sie aus der laufenden Datenbank. Cloudflare-Wiederherstellungskopien folgen der Plattform-Aufbewahrung. Manuelles Löschen entfernt Inhalt und Audio sofort; bis zum Ablauf bleibt eine leere ID-Markierung gegen verspätete Sende-Wiederholungen. Grenzen: 300 Abgaben je Klasse/24 Stunden, insgesamt 5000 Einträge und 350 MiB Audio; bei erreichter Grenze meldet die App einen Fehler statt Erfolg.

Backend-Prüfung: in `werkzeug/anmelden` zuerst `npm ci`, dann `npm run check` und `npm run dry-run`. Änderungen am Schema mit `npx wrangler d1 migrations apply FEEDBACK --remote` anwenden; danach `npm run deploy`. Die Tests laufen mit isolierter lokaler Datenbank und simuliertem GitHub, ohne Schülerdaten. Frontend-Prüfungen: `node werkzeug/feedback-ui-pruefen.cjs`, `node kontrolle/rueckmeldungen-pruefen.cjs`, `node werkzeug/design-pruefen.cjs --built`. Die App wird mit `node quelle/bauen.cjs` gebaut; das Feedback-Modul und seine Gestaltung werden in beide Ausgaben eingebettet.

- Ändern: `worker.js` bearbeiten, dann `cd werkzeug/anmelden && npx wrangler deploy` (eigenes Cloudflare-Konto, `npx wrangler login`).
- Weiteres Repo freigeben: GitHub → Settings → Applications → Schrittli Kontrolle → Configure.
- Neu einrichten (z. B. nach Löschen der App): https://schrittli-anmelden.conradinjoos.workers.dev/einrichten in einem Zug durchklicken, nicht neu laden. Die Seite gilt 15 Minuten; GitHub springt danach von selbst zur Installation.

 Die Liste zeigt pro Video drei Häkchen: Schritte gesetzt, Angaben vollständig, geprüft. Pro Video gibt es zwei Ansichten.

**Arbeitsansicht** (Schritte setzen und sofort sehen, wie es in der App aussieht):

- Oben die **Bühne**, aufgebaut wie die App: links der Player («So sieht es das Kind»), rechts die Schrittliste des Kindes mit dem aktuellen Schritt. Ist Material gesetzt, erscheint zuerst die Materialkarte; ein erster Schritt «Material richten …» wird in der App übersprungen (gestreift markiert). Ein Klick in die Liste springt zum Schritt.
- Darunter Play/Pause, **Schritt abspielen** (`T`) und eine Zeile mit dem, was gerade gesagt wird.
- Die **Zeitleiste** zeigt jeden Schritt als Balken von wann bis wann (mit Nummer, Titel und Standbild, soweit Platz ist). Klick wählt einen Schritt und spult hin, die **Grenze ziehen** verschiebt das Ende des einen und den Beginn des nächsten Schritts (rastet auf Bildwechsel ein), Doppelklick teilt. Beim Abspielen wandert die Auswahl mit.
- Unten links der gewählte Schritt: Titel, **von / bis** (−/+ 0.1 s, «Hier» = aktuelle Spielzeit), Dauer, ▶ abspielen, «nur Ende (3 s)», ✂ Hier teilen, ＋ Schritt danach, ✕. «Feinjustieren mit Standbildern» klappt zwei Filmstreifen auf (blau = aktueller Wert, orange = Bildwechsel, Klick setzt die Zeit). Rote Hinweise (Titel fehlt, über 8 Wörter, ß, Anführungszeichen, Reihenfolge) müssen weg, graue (unter 3 s, Beginn mitten im Satz) sind eine Prüfbitte.
- Unten rechts das **Material** (Chips, ziehen sortiert; oranger Rand = nicht im Vokabular, kein Bild). Es erscheint gleich auf der Materialkarte in der Bühne.
- **Schritt abspielen** spielt ab dem Beginn und hält genau dort, wo das Kind den Stopp sieht; `Shift+T` nur die letzten 3 s. `S` / `E` = Hier ist von / bis, `,` `.` schieben «von» um 0.1 s, `;` `:` «bis», `[` `]` springen zum Bildwechsel davor/danach. Alle Tasten und die Einstellung **Einrasten** stehen hinter «?».
- **Schritte vorschlagen** erscheint, solange noch keine Schritte da sind (sonst unter «?» als «neu vorschlagen»): erster Entwurf aus Transkript-Sätzen wie «1. Schritt: …», YouTube-Kapiteln oder starken Bildwechseln; Beginn = Bildwechsel vor dem Satz.

**Abschlussansicht** (Knopf «Weiter zu Angaben»): Titel, Verfahren, Klassen, Schwierigkeit (1 leicht, 2 mittel, 3 anspruchsvoll; in der App als Punkte), Techniken, Häkchen «Grundtechnik» (solche Videos stehen in der App zuoberst mit Schild), Hinweis für die Lehrperson, Details (Aufgabe danach, id, Kanal …). **Fertig?** zeigt «n von 6 erledigt» plus die offenen Punkte; das Häkchen «alle Stopps getestet» setzt man selbst. **Schul-Link** öffnet die Live-App mit genau diesen Schritten (Link in der Zwischenablage). **Veröffentlichen…** zeigt vorher, was sich in schule.json ändert, und schreibt erst nach dem zweiten Klick. Darunter das ganze Transkript: Klick auf die Zeit setzt den Beginn des gewählten Schritts, «+» legt dort einen neuen Schritt an (wechselt zurück in die Arbeitsansicht); YouTube-Kapitel sind eingeklappt.

Gespeichert wird automatisch 1.5 s nach jeder Änderung nach `entwurf/<ID>/video.json` («gespeichert HH:MM» im Kopf), `Ctrl+Z` macht rückgängig, Löschen eines Schritts lässt sich 6 s lang per Knopf zurücknehmen. Ohne Entwurf zeigt die Seite den bestehenden Eintrag aus schule.json oder eine leere Vorlage – so lassen sich auch alte Einträge nachjustieren (vorher `holen.py` für das Video laufen lassen).

## Wie die Stopps gefunden werden

`holen.py` erkennt Bildwechsel (ffmpeg scene score, stark ≥ 0.28, schwach ≥ 0.15) und Sprechbeginne nach Pausen. Beim Pompon-Video lagen die starken Bildwechsel fast genau auf den von Hand gesetzten Stopps – deshalb gilt: Stopp auf den Bildwechsel, der die Handlung einleitet, nicht auf den Sprechbeginn (der hinkt 1–2 s hinterher). Bei Videos mit Musik ist die Pausenerkennung schwach; die Bildwechsel sind das wichtigere Signal.

## Grenzen

- Nicht einbettbare Videos werden ausgelassen (würden in der App nicht laufen). Schlägt ein Video fehl, läuft `holen.py` mit den übrigen weiter und meldet am Ende «Nicht geholt: …». IDs mit führendem `-` funktionieren.
- Entwürfe (`entwurf/<ID>/video.json`) sind gitignored und liegen nur auf diesem Rechner – erst «Veröffentlichen» in schule.json macht sie dauerhaft.
- Ohne Untertitel/Transkript arbeitet der Agent nur mit Standbildern; dann in der Kontrolle genauer prüfen.
- `cache/` wird gross (ca. 10–30 MB pro Video); kann jederzeit gelöscht werden, `holen.py` lädt neu.
