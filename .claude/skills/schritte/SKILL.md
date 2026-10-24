---
name: schritte
description: Neue Lernvideos für Schrittli erfassen – YouTube-Links holen (Transkript, Bildwechsel, Standbilder), Schritte pro Video von je einem Agenten entwerfen lassen und die Kontrollseite starten. Aufruf /schritte <YouTube-Links oder IDs>.
---

# /schritte – Videos holen, Schritte entwerfen, Kontrolle starten

Argumente: ein oder mehrere YouTube-Links oder 11-stellige IDs. Ohne Argumente: nach Links fragen.

Alles läuft lokal (yt-dlp, ffmpeg, Pillow). Nichts im Repo ausser `werkzeug/entwurf/` und `werkzeug/cache/` wird geschrieben; beide sind gitignored. `schule/schule.json` wird **nie** von dieser Skill geändert – das macht Conradin auf der Kontrollseite.

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
   Dann `http://127.0.0.1:8765/` öffnen (Browser-Pane über `preview_start`, sonst dem Nutzer den Link nennen). Pro Video: `http://127.0.0.1:8765/v/<VIDEOID>`.

4. Conradin prüft, verschiebt Stopps, klickt «In schule.json übernehmen». Danach auf Wunsch: `git add schule/schule.json && git commit`, kein Build nötig (nur JSON). Push nur auf Anfrage.

## Was die Agenten bekommen

`werkzeug/SCHRITTE-LOKAL.md` enthält alle Regeln (Stopp auf den Bildwechsel vor dem Sprechbeginn, 6–10 Schritte, Labels ≤ 8 Wörter, Schweizer Schreibweise, Material-IDs aus `quelle/agenten/VOKABULAR.md`). Nicht zusätzlich umschreiben – bei Regeländerungen die Datei anpassen.

## Fehlerbilder

- `yt-dlp` fehlt oder veraltet: `pip install -U yt-dlp`; ffmpeg muss im PATH sein.
- Video nicht einbettbar → holen.py lässt es aus; in der App würde es nicht laufen.
- Kein Transkript → der Agent arbeitet nur mit Standbildern; im Bericht steht «Standbilder». Dann in der Kontrolle genauer hinschauen.
- Alter Entwurf stört: `python werkzeug/holen.py <id> --neu` lädt alles frisch.
