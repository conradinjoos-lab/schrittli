---
name: schritte
description: Neue Lernvideos für Schrittli erfassen – YouTube-Links holen (Transkript, Bildwechsel, Standbilder), Schritte pro Video von je einem Agenten entwerfen lassen, die Kontrollseite starten und nach dem Veröffentlichen ruhige Vorschaubilder ohne Menschen bauen. Aufruf /schritte <YouTube-Links oder IDs>, nur Vorschaubilder: /schritte vorschau.
---

# /schritte – Videos holen, Schritte entwerfen, Kontrolle starten

Argumente: ein oder mehrere YouTube-Links oder 11-stellige IDs. Ohne Argumente: nach Links fragen. `vorschau [app-id …]`: nur Schritt 5.

Alles läuft lokal (yt-dlp, ffmpeg, Pillow, opencv). Schritte 1–4 schreiben im Repo nur `werkzeug/entwurf/` und `werkzeug/cache/`; beide sind gitignored. Schritt 5 schreibt zusätzlich `vorschau/`. `schule/schule.json` wird **nie** von dieser Skill geändert – das macht Conradin auf der Kontrollseite.

## Ablauf

1. **Holen** (alle Links in einem Aufruf, im Repo-Wurzelverzeichnis):
   ```bash
   python werkzeug/holen.py <link1> <link2> …
   ```
   Die Ausgabe nennt pro Video den Entwurfsordner oder den Grund fürs Auslassen (nicht einbettbar, schon erfasst nur als Hinweis – trotzdem weiter). Dauert ca. 30–60 s pro Video. Bei langen Listen im Hintergrund laufen lassen.

2. **Schritte entwerfen**: pro gelungenem Video **einen** `general-purpose`-Agenten starten, alle gleichzeitig. Prompt je Agent:
   > Lies `werkzeug/SCHRITTE-LOKAL.md` und befolge es für das Video `<VIDEOID>`. Material liegt in `werkzeug/entwurf/<VIDEOID>/` (brief.md, Kontaktblätter) und `werkzeug/cache/<VIDEOID>/f/`. Schreibe genau `werkzeug/entwurf/<VIDEOID>/video.json`. Ändere sonst nichts. Bericht: eine Zeile wie im Brief verlangt.

   Mehr als 6 Videos: in Gruppen zu 6.

3. **Kontrolle starten** (Hintergrund) und die Berichte der Agenten als Tabelle zeigen (ID, Titel, Schritte, Zweifel):
   ```bash
   python werkzeug/kontrolle.py
   ```
   Dann `http://127.0.0.1:8765/` öffnen (Browser-Pane über `preview_start`, sonst dem Nutzer den Link nennen). Pro Video: `http://127.0.0.1:8765/video.html?id=<VIDEOID>`. Danach `python werkzeug/werkstatt.py`, damit die Entwürfe auch online in der Kontrolle (https://conradinjoos-lab.github.io/schrittli/kontrolle/) erscheinen.

4. Conradin prüft, verschiebt Stopps, klickt «Veröffentlichen…». Danach auf Wunsch: `git add schule/schule.json && git commit`, kein Build nötig (nur JSON). Push nur auf Anfrage.

5. **Vorschaubilder** für die neu veröffentlichten Videos (erst wenn sie in `schule/schule.json` stehen; auch allein mit `/schritte vorschau [app-id …]`). Die Bilder in `vorschau/` sind öffentlich: streng nichts von einem Menschen, keine Schrift. Keine Bilder an eine externe KI, Freistellen nur lokal (rembg).
   1. `python werkzeug/vorschau.py neu` – findet alle Videos ohne Eintrag in `vorschau/auswahl.json`, macht die Kandidatenbögen und schreibt `werkzeug/cache/_vorschau/wahl/liste-N.txt` (je 25 Videos). Fehlt ein Video im Cache: zuerst `python werkzeug/holen.py <YouTube-ID>`.
   2. Pro Liste einen `general-purpose`-Agenten, alle gleichzeitig:
      > Lies `werkzeug/VORSCHAU-WAEHLEN.md` und befolge es für die Liste `werkzeug/cache/_vorschau/wahl/liste-<N>.txt`. Schreib genau `werkzeug/cache/_vorschau/wahl/wahl-<N>.json`. Ändere sonst nichts.
   3. `python werkzeug/vorschau.py uebernehmen` – trägt alle `wahl-*.json` in `auswahl.json` ein, baut `vorschau/<YouTube-ID>.webp` und `vorschau.json` und schreibt die Prüflisten `pruefen-N.txt` (je 50).
   4. Pro Prüfliste einen **anderen** `general-purpose`-Agenten (nicht den, der gewählt hat):
      > Lies `werkzeug/VORSCHAU-PRUEFEN.md` und befolge es für `werkzeug/cache/_vorschau/wahl/pruefen-<N>.txt`. Schreib genau `werkzeug/cache/_vorschau/wahl/pruefung-<N>.json`. Ändere sonst nichts.
   5. Befunde selbst ansehen. Ok lassen: Werkstück mit gemaltem Gesicht oder Handform (Puppe, Maske, Clown), kleine Schrift, die zum Material gehört (Batterie, Etikett, gestickter Name). Alles mit echter Hand, Person oder eingeblendeter Schrift: Neuwahl durch einen Agenten (VORSCHAU-WAEHLEN.md, Abschnitt «Neuwahl», mit app-ids und Befund) → `wahl-neu-<N>.json`, dann wieder `uebernehmen` (spätere Dateien gewinnen) und die neuen Bilder nochmals prüfen lassen. Nach zwei Neuwahlen ohne Erfolg `"t": null` – die App zeigt dann das YouTube-Bild.
   6. Zum Schluss alle neuen Bilder selbst anschauen (`werkzeug/cache/_vorschau/uebersicht-*.jpg`), in der App prüfen (Schulansicht, Thema öffnen: `img` mit `/vorschau/` statt `ytimg`, keines mit `naturalWidth === 0`) und dem Nutzer berichten: Anzahl Bilder, welche beim YouTube-Bild bleiben, welche `schwach` sind.
   7. Commit nur auf Anfrage und nur `vorschau/` (`git add -A vorschau/`) – andere Sessions arbeiten oft gleichzeitig: vorher `git pull --ff-only`, nie stashen oder zurücksetzen.

## Was die Agenten bekommen

`werkzeug/SCHRITTE-LOKAL.md` enthält alle Regeln (Stopp auf den Bildwechsel vor dem Sprechbeginn, 6–10 Schritte, Labels ≤ 8 Wörter, Schweizer Schreibweise, Material-IDs aus `quelle/agenten/VOKABULAR.md`). Nicht zusätzlich umschreiben – bei Regeländerungen die Datei anpassen.

## Fehlerbilder

- `yt-dlp` fehlt oder veraltet: `pip install -U yt-dlp`; ffmpeg muss im PATH sein.
- Video nicht einbettbar → holen.py lässt es aus; in der App würde es nicht laufen.
- Kein Transkript → der Agent arbeitet nur mit Standbildern; im Bericht steht «Standbilder». Dann in der Kontrolle genauer hinschauen.
- Alter Entwurf stört: `python werkzeug/holen.py <id> --neu` lädt alles frisch.
