# Auftrag: Schritte («Stopps») für ein Lernvideo schreiben – aus lokalen Dateien

Du arbeitest für die Kinder-Lern-App «Schrittli» (Schulversion, TTG-Unterricht 1.–6. Klasse, Schweiz). Der Player hält das Video kurz vor dem `t` des nächsten Schritts automatisch an; das Kind macht den Schritt nach und tippt dann «Weiter».

Alles, was du brauchst, liegt in `werkzeug/entwurf/<VIDEOID>/`:

- `brief.md` – Titel, Kanal, Dauer, Transkript mit Zeiten, YouTube-Kapitel, Liste der Bildwechsel (starke und schwache), Sprechbeginne nach Pausen, allenfalls der bestehende Eintrag.
- `blatt-zeit-N.jpg` – Kontaktblätter mit Standbildern in gleichmässigen Abständen (Zeitstempel oben links in jedem Bild). Mit `Read` anschauen.
- `blatt-schnitte-N.jpg` – ein Standbild 0.5 s nach jedem starken Bildwechsel.
- Einzelbilder, 2 pro Sekunde: `werkzeug/cache/<VIDEOID>/f/NNNNN.jpg`, Bild N zeigt Sekunde (N−1)/2. Beispiel: 30.0 s = `00061.jpg`, 30.5 s = `00062.jpg`. Wenn du eine Stelle genau wissen willst, schau 3–5 Einzelbilder rund um die fragliche Zeit an.

Kein Browser, kein Internet nötig. Nichts anderes im Repo ändern.

## Ausgabe

Genau eine Datei: `werkzeug/entwurf/<VIDEOID>/video.json`

```json
{
 "id": "zw-pompon",
 "areaId": "wickeln",
 "stufen": [1, 2],
 "niveau": 1,
 "grundtechnik": false,
 "techniken": ["pompon wickeln"],
 "title": "Pompon mit Kartonringen",
 "source": {"type": "youtube", "id": "<VIDEOID>"},
 "kanal": "Schule und Familie",
 "dauer": "2:36",
 "alter": "ab 6",
 "sprache": "Hochdeutsch",
 "hinweis": "1 Satz für die Lehrperson: Material, Stolperstein.",
 "material": ["wolle", "karton", "schere", "zirkel"],
 "steps": [{"t": 0, "label": "Material richten: Wolle, Schere, Zirkel, Karton", "kurz": "Material richten"}, {"t": 17.5, "label": "Karton falten, grossen und kleinen Kreis zeichnen", "kurz": "Falte Karton, zeichne Kreise"}],
 "task": {"text": "", "deliverable": "keine"}
}
```

- `id`: Kürzel wie im Brief vorgeschlagen (`ex-…` für Experimente, sonst `zw-…`), Kleinbuchstaben, keine Umlaute.
- `areaId`: eines von naehen, sticken, haekeln, stricken, weben, perlen, knuepfen, wickeln, filzen, falten, schneiden, holz, schnitzen, formen, drucken, experimente. Perlentiere, Perlenweben und Perlenschmuck gehören zu `perlen`.
- `gruppe`: Projektart innerhalb des Themas, z. B. «Perlentiere aus Draht», «Nagelbilder», «Glasieren». Nimm eine Gruppe, die es im Thema in `schule/schule.json` schon gibt; nur wenn keine passt, eine neue kurze (2–4 Wörter).
- `zeit` (optional): Arbeitszeit des Projekts in Minuten, nur bei Mini-Projekten setzen, die ein Kind in höchstens 15 Minuten fertig hat (z. B. `"zeit": 10`). Nicht die Videolänge.
- `stufen`: Klassen 1–6, für die das Video passt (meist 2–3 Werte).
- `niveau`: Schwierigkeit 1 = leicht (ab 1./2. Klasse, wenige klare Schritte, Schere/Leim/Wolle, kein gefährliches Werkzeug), 2 = mittel (etwa 3./4. Klasse, Nadel und Faden, Grundmaschen, Bohren mit Hilfe), 3 = anspruchsvoll (eher 5./6. Klasse: Säge, Feile, Lötkolben, Bügeleisen, Nähmaschine, Cutter, lange Abfolge). Die App sortiert danach und zeigt 1–3 Punkte.
- `grundtechnik`: `true` nur, wenn das Video hauptsächlich eine wiederverwendbare Technik lehrt (Vorstich, Luftmaschen, Knoten, Sägen, Pompon wickeln …). Ein Projekt, das ein Objekt herstellt, ist `false`. Die App zeigt Grundtechniken zuoberst mit Schild.
- `techniken`: 1–3 Begriffe in Kleinbuchstaben, z. B. `["vorstich", "knoten"]`.
- `title`: höchstens 5 Wörter, kindertauglich, sagt, was entsteht.
- `sprache`: Hochdeutsch | Schweizerdeutsch | ohne Sprache | Englisch.
- `material`: nur IDs aus `quelle/agenten/VOKABULAR.md`, wichtigstes zuerst, höchstens 8. Fehlt ein wichtiges Material, nimm die nächstliegende ID und nenne es im Bericht.
- `task`: leer lassen (`{"text": "", "deliverable": "keine"}`), ausser das Video verlangt ausdrücklich ein Werk zum Zeigen.

## Regeln für die Schritte

- `t` = Sekunde, an der der Schritt **beginnt**. Das Video stoppt automatisch 0.08 s vor dem `t` des nächsten Schritts. Jeder Schritt muss so geschnitten sein, dass das Kind am Stopp etwas Konkretes nachmachen kann.
- `t` auf eine Dezimale (z. B. 17.5). Lege `t` auf den **Bildwechsel**, der die Handlung einleitet – die Liste im Brief und die Blätter zeigen sie. Gesprochene Anweisungen hinken dem Bild 1–2 s hinterher; darum `t` nie auf den Sprechbeginn, sondern auf den Bildwechsel davor oder 1–2 s vor den Sprechbeginn.
- Erster Schritt `t: 0`. Zeigt das Video zuerst das Material: Label «Material richten: Wolle, Schere, …», und der zweite Schritt beginnt genau dort, wo das Materialbild endet. Beginnt das Video mit einer Vorschau des fertigen Werks, gehört sie zum ersten Schritt «Material richten: …» (`t: 0`); die App überspringt diesen Teil, weil sie das Material als Checkliste zeigt. Wird der Vorschau-Schritt in der Kontrolle gelöscht, beginnt das Video beim ersten Arbeitsschritt; das ist erlaubt, solange `material` gesetzt ist.
- 6–10 Schritte für 1–4 Minuten Video; bei langen Videos (> 5 Min) höchstens 12. Ein Schritt = eine Handlung, die man nachmachen kann; nicht jeden Satz zu einem Schritt machen.
- **Nie ein Schritt «Zuschauen: …»** (Regel der Lehrperson, 25.10.2026). Jeder Schritt ist eine Handlung, die das Kind nachmacht. Tipps, Varianten und Vorführungen mitten im Video gehören zum vorherigen Arbeitsschritt; Varianten oder Vorführungen kurz vor dem Schluss gehören zum Schritt «Fertig – …», der dann dort beginnt.
- Letzter Schritt am Beginn des Abspanns/Outros: «Fertig – schau dein Werk an» (oder konkret: «Fertig – schau deinen Pompon an»). So verschwindet das Kanal-Geschwätz am Schluss hinter dem Stopp.
- Labels: höchstens 8 Wörter, Befehlsform oder knappe Beschreibung, Sprache für 1.–3. Klasse, Schweizer Rechtschreibung (ss statt ß), keine Anführungszeichen, kein Emoji. Beispiele: «Faden einfädeln, Knoten ans Ende», «Rechter Faden über die Mitte», «Immer so weiter bis zum Schluss».
- `kurz`: steht bei jedem Schritt. Die Kinder lesen ihn neben dem Video, das `label` liest der Lautsprecher vor. Höchstens 4 Wörter, Du-Befehl mit dem Verb zuerst, Schweizer Rechtschreibung (ss statt ß), nur was im `label` steht. Beispiele: «Falte Karton, zeichne Kreise», «Fädle den Faden ein».
- `kurz` ist bei Material immer «Material richten», am Schluss «Fertig – dein Pompon!» mit dem konkreten Werk.
- `kurz` bei Heissleim, Ofen, Bohren, Bügeln, Cutter und heissem Wachs in der Grundform statt als Du-Befehl: «Löcher bohren», «Mit Heissleim kleben». «Lehrperson» steht nur, wenn das `label` sie nennt.
- Steht im Brief «Video ist schon erfasst»: Schreibe trotzdem deine eigene Fassung aus dem Material; der bestehende Eintrag ist nur ein Vergleich, nicht die Vorlage.

## Bericht am Schluss

Eine Zeile: `<VIDEOID> | <Titel> | <Anzahl Schritte> | Transkript oder Standbilder | <Zweifel oder fehlendes Material, falls welche>`. Sonst nichts – kein JSON in den Bericht kopieren.
