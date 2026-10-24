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
| 4 Übernehmen | Knopf «In schule.json übernehmen» (oder `python werkzeug/kontrolle.py --uebernehmen <ID>`) | Eintrag in `schule/schule.json`, bestehender Eintrag mit gleicher id oder gleichem Video wird ersetzt |
| 5 Veröffentlichen | `git add schule/schule.json && git commit && git push` | kein Build nötig |

`/schritte` macht 1–3 in einem Zug.

## Kontrollseite – Bedienung

- Links der YouTube-Player, rechts die Schritte. Ein Schritt ist immer gewählt (blau).
- **Schritt testen** (oder ▶ beim Schritt, Taste `T`): spielt ab dem Beginn und hält genau dort, wo das Kind den Stopp sieht (0.08 s vor dem nächsten Schritt).
- Zeit ändern: ins Feld tippen (`1:17.3`), Knöpfe −/+ (0.5 s), **Hier = Beginn** (Taste `S`) übernimmt die aktuelle Spielzeit, Klick auf ein Einzelbild in den Filmstreifen, Klick auf einen orangen Strich in der Zeitleiste (= Bildwechsel), Klick auf eine Zeit im Transkript (setzt 1.5 s davor).
- Zwei Filmstreifen: Beginn des gewählten Schritts und Stopp am Ende (= Beginn des nächsten). Rot = aktueller Wert, orange = Bildwechsel.
- Rote Hinweise bei Labels über 8 Wörtern, ß, Anführungszeichen, falscher Reihenfolge.
- **Speichern** schreibt `entwurf/<ID>/video.json`. **Schul-Link** öffnet die Live-App mit genau diesen Schritten und dem Material (Link landet in der Zwischenablage).
- Ohne Entwurf zeigt die Seite den bestehenden Eintrag aus schule.json oder eine leere Vorlage – so lassen sich auch alte Einträge nachjustieren (vorher `holen.py` für das Video laufen lassen).

## Wie die Stopps gefunden werden

`holen.py` erkennt Bildwechsel (ffmpeg scene score, stark ≥ 0.28, schwach ≥ 0.15) und Sprechbeginne nach Pausen. Beim Pompon-Video lagen die starken Bildwechsel fast genau auf den von Hand gesetzten Stopps – deshalb gilt: Stopp auf den Bildwechsel, der die Handlung einleitet, nicht auf den Sprechbeginn (der hinkt 1–2 s hinterher). Bei Videos mit Musik ist die Pausenerkennung schwach; die Bildwechsel sind das wichtigere Signal.

## Grenzen

- Nicht einbettbare Videos werden ausgelassen (würden in der App nicht laufen).
- Ohne Untertitel/Transkript arbeitet der Agent nur mit Standbildern; dann in der Kontrolle genauer prüfen.
- `cache/` wird gross (ca. 10–30 MB pro Video); kann jederzeit gelöscht werden, `holen.py` lädt neu.
