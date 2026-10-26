# Perlentier-Figuren entwerfen (privat)

Diese Figuren sind nur für Conradins eigenen Unterricht (TTG, Primarschule). Sie liegen im Ordner `privat/`, den Git ignoriert.

- **Nie kopieren:** Die Figuren nicht in andere Ordner des Repos legen.
- **Nichts veröffentlichen:** Nicht committen, nichts hochladen, keine Bilder suchen oder herunterladen.
- **Eigene Muster:** Zeichne jedes Muster selbst aus deinem Wissen, wie die Figur aussieht. Keine fremden Perlen- oder Bügelperlenvorlagen abzeichnen.

## Die Technik

Ein Perlentier ist flach, aus einer Lage Rocailles, im Leiterstich gefädelt.

**Reihen**
- Jede Reihe ist **ein zusammenhängender Streifen ohne Lücken**.
- Die Reihen sind **zentriert** untereinander.
- Eine Reihe ist ein String, ein Buchstabe pro Perle, von links nach rechts.
- Gerade und ungerade Breiten wechseln sich ab. Dann sitzt die Reihe eine halbe Perle versetzt, das ist ok.

**Grösse**
- Breite: 1–11 Perlen, nur selten 13.
- Höhe: meist 7–16 Reihen.
- Eine Perle ist von der Seite ca. 2 mm breit und 3 mm hoch. Darum wirken Muster **höher und schmaler** als ein Pixelbild: lieber etwas breiter planen.

**Was nicht geht**
- Freistehende Teile neben dem Körper sind keine Reihen. Ohren, Arme, Beine, Fühler und Zacken gehen nur als symmetrische Paare (`beine`).
- Einseitige Teile wie ein Schwanz rechts gehen nicht. Weglassen oder in die Mitte nehmen.

**Ganz unten oder ganz oben**
- Eine Reihe mit nur 1–3 Perlen geht.
- Mittig angehängte Spitzen sind ebenfalls als kurze Reihen möglich, z. B. `'o','y','r'` als Flamme unten.

**Beine** sind Paare links und rechts einer Reihe:
- `{r:Reihe (1-basiert), n:Perlen im Bein, f:Endperlen, a:Winkel, c:Farbe Bein, fc:Farbe Endperle, w:'Arme'}`
- `f:1` ist eine quer liegende Endperle (Hand, Spitze). `f:3` ist eine kleine Schlaufe (Fuss).
- `n:0` ist erlaubt, dann gibt es nur den Fuss.
- `a` geht von −90 bis 90 Grad: positiv nach oben (Ohren ca. 60–75), 0 waagrecht, negativ nach unten (Arme −20 bis −40, Beine −65 bis −80).
- Höchstens 3 Bein-Paare pro Figur. Kein Bein-Paar an Reihe 1, wenn es nicht Ohren oder Fühler sind.

**Logos und Gesichter**
- Pokéball, Logos und Gesichter (z. B. Creeper, Ninjago-Augen) sind einfach eine Folge von Reihen ohne Beine. Das ist gut so.

## Farben (nur diese Buchstaben)

| Buchstabe | Farbe | Buchstabe | Farbe |
|---|---|---|---|
| g | grün | l | hellblau |
| d | dunkelgrün | u | dunkelblau |
| h | hellgrün | t | türkis |
| s | schwarz | p | rosa |
| w | weiss | q | pink |
| n | grau | k | braun |
| r | rot | c | ocker/beige |
| e | dunkelrot | v | violett |
| y | gelb | m | flieder |
| o | orange | f | hautfarben |
| b | blau | | |

Augen sind meist 1 Perle `s`, eventuell `w` daneben für den Glanz.

**Wiedererkennen:** Typische Farben und das eine Merkmal zählen mehr als Details. Zum Beispiel:
- Creeper: grün mit schwarzem Gesicht.
- Pac-Man: gelbe Scheibe mit Mundkeil, der Keil oben/unten.
- Minion: gelb, Brille grau, Latzhose blau.

## Abgabe

Schreib genau eine Datei: `teile/<GRUPPE>.json` (der Name steht in deinem Auftrag). Sie enthält ein JSON-Array:

```json
[
{"id":"pokeball","name":"Pokéball","gruppe":"Pokémon","stufe":"leicht","rows":["rrr","rrrrr","..."]},
{"id":"evoli","name":"Evoli","gruppe":"Pokémon","stufe":"mittel","rows":["..."],"beine":[{"r":1,"n":3,"f":1,"a":65,"c":"k","fc":"k","w":"Ohren"}]}
]
```

- `id`: nur a–z und 0–9, eindeutig.
- `stufe`: `leicht` (unter ca. 60 Perlen, wenige Farben), `mittel` oder `schwer`.
- `gruppe`: die Überschrift aus deinem Auftrag.

## Prüfen (Pflicht)

Rendere deine Datei als Bild und schau sie dir an:

```
python werkzeug/zeigen.py teile/<GRUPPE>.json <scratchpad>/<GRUPPE>.png
```

Das Werkzeug läuft im Ordner `C:\Grok Code\schrittli\privat\perlen-figuren`. Danach mit Read öffnen.

- **Keine Fehler:** Rote FEHLER-Zeilen gibt es keine, ebenso keine doppelten ids.
- **Erkennbar:** Jede Figur muss auf den ersten Blick erkennbar sein. Überarbeite, bis das stimmt, mindestens 2 Durchgänge.
- **Darstellung:** Das Werkzeug zeigt die Beine nur ungefähr, die Reihen aber genau.

Ändere sonst **nichts**, vor allem nicht `index.html`, andere `teile/*.json` oder `werkzeug/`.

Bericht, eine Zeile pro Figur: `id · Reihen×max. Breite · Perlen · Stufe · ein Wort zur Erkennbarkeit (gut/ok/schwach)`.
