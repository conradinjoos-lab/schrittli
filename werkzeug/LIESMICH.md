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
| 3 Kontrollieren | `python werkzeug/kontrolle.py` → http://127.0.0.1:8765/ | Stopps auf Zehntelsekunden setzen, Material, Klassen, Hinweis prüfen |
| 4 Übernehmen | Knopf «Veröffentlichen…» (oder `python werkzeug/kontrolle.py --uebernehmen <ID>`) | Eintrag in `schule/schule.json`, bestehender Eintrag mit gleicher id oder gleichem Video wird ersetzt |
| 5 Veröffentlichen | `git add schule/schule.json && git commit && git push` | kein Build nötig |

`/schritte` macht 1–3 in einem Zug.

## Kontrollseite – Bedienung

Die Seite liegt in `kontrolle.html`, der Server in `kontrolle.py`. Die Liste zeigt pro Video drei Häkchen: Schritte gesetzt, Angaben vollständig, geprüft.

- Oben die **Zeitleiste** über die ganze Breite: Punkte = Schritte (ziehen verschiebt sie), orange Striche = Bildwechsel, Hover zeigt Zeit und Standbild, Klick spult. Links der Player (bleibt beim Scrollen stehen), Mitte die Schritte, rechts das Transkript (scrollt zum gewählten Schritt, gelb = passende Zeile, blauer Rand = ein Stopp liegt mitten in dieser Zeile).
- Ein Schritt ist immer gewählt (blau). Unter ihm klappen zwei Filmstreifen auf: Beginn und Stopp am Ende (= Beginn des nächsten). Rot = aktueller Wert, orange = Bildwechsel, Klick auf ein Bild setzt die Zeit.
- **Schritt testen** (`T`, oder ▶ beim Schritt) spielt ab dem Beginn und hält genau dort, wo das Kind den Stopp sieht. **Ende testen** (`Shift+T`) nur die letzten 3 s.
- **Hier = Beginn** (`S`) und **Hier = Ende** (`E`) übernehmen die aktuelle Spielzeit. `,` `.` schieben den Beginn um 0.1 s, `;` `:` das Ende. `[` `]` springen zum Bildwechsel davor/danach. **Einrasten** (an/aus im Kopf) zieht −/+ und Ziehen in der Zeitleiste auf den nächsten Bildwechsel innerhalb 0.4 s.
- Tasten: `Leer` Play/Pause, `←` `→` ±0.5 s (`Shift` ±2 s), `1`–`9` Schritt wählen, `↑` `↓`, `Enter` im Titel = nächster Schritt, `Ctrl+Z` rückgängig, `Ctrl+S` speichern.
- **Schritte vorschlagen** baut einen ersten Entwurf aus Transkript-Sätzen wie «1. Schritt: …», YouTube-Kapiteln oder (ohne beides) aus starken Bildwechseln; Beginn = Bildwechsel vor dem Satz. Danach Titel und Stopps prüfen.
- Hinweise direkt beim Schritt: rot (Titel fehlt, über 8 Wörter, ß, Anführungszeichen, Reihenfolge) muss weg; grau (Schritt unter 3 s, Beginn mitten in einer Transkriptzeile) ist eine Prüfbitte. **Fertig?** fasst zusammen; das Häkchen «alle Stopps getestet» setzt man selbst.
- Gespeichert wird automatisch 1.5 s nach jeder Änderung nach `entwurf/<ID>/video.json` («gespeichert HH:MM» im Kopf). Löschen eines Schritts lässt sich 6 s lang rückgängig machen.
- **Veröffentlichen…** zeigt vorher, was sich in schule.json ändert (geänderte Zeiten und Titel, Material, Klassen), und schreibt erst nach dem zweiten Klick. **Schul-Link** öffnet die Live-App mit genau diesen Schritten und dem Material (Link in der Zwischenablage).
- Ohne Entwurf zeigt die Seite den bestehenden Eintrag aus schule.json oder eine leere Vorlage – so lassen sich auch alte Einträge nachjustieren (vorher `holen.py` für das Video laufen lassen).

## Wie die Stopps gefunden werden

`holen.py` erkennt Bildwechsel (ffmpeg scene score, stark ≥ 0.28, schwach ≥ 0.15) und Sprechbeginne nach Pausen. Beim Pompon-Video lagen die starken Bildwechsel fast genau auf den von Hand gesetzten Stopps – deshalb gilt: Stopp auf den Bildwechsel, der die Handlung einleitet, nicht auf den Sprechbeginn (der hinkt 1–2 s hinterher). Bei Videos mit Musik ist die Pausenerkennung schwach; die Bildwechsel sind das wichtigere Signal.

## Grenzen

- Nicht einbettbare Videos werden ausgelassen (würden in der App nicht laufen).
- Ohne Untertitel/Transkript arbeitet der Agent nur mit Standbildern; dann in der Kontrolle genauer prüfen.
- `cache/` wird gross (ca. 10–30 MB pro Video); kann jederzeit gelöscht werden, `holen.py` lädt neu.
