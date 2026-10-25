# Auftrag: ruhiges Vorschaubild pro Video wählen (streng ohne Menschen)

Die Kinder-App «Bibo & Fila» (Werken/TTG, Primarschule) zeigt zu jedem Lernvideo ein Vorschaubild. Statt der lauten
YouTube-Vorschau (Gesichter, Schrift, Logos) soll ein ruhiges Standbild aus dem Video erscheinen, am liebsten das FERTIGE
oder fast fertige Werkstück. Du wählst für jedes Video deiner Liste Zeit und Ausschnitt. Du änderst keine Dateien ausser
deiner Ergebnisdatei. Alle Pfade gelten ab dem Repo-Wurzelverzeichnis.

## Was du hast
- Deine Liste `werkzeug/cache/_vorschau/wahl/liste-<N>.txt`: Zeilen `app-id <TAB> YouTube-ID <TAB> Titel`.
- Kandidatenbogen: `werkzeug/cache/_vorschau/bogen/<app-id>.jpg`, 4×4 Bilder, oben links die Zeit in Sekunden.
- Einzelbilder, zwei pro Sekunde, 320 px breit: `werkzeug/cache/<YouTube-ID>/f/NNNNN.jpg`, Bild n gehört zur Zeit t = (n-1)/2
  (00001 = 0.0 s, 00241 = 120.0 s). Nutze sie, wenn der Bogen nichts Gutes zeigt oder du in der Nähe eines Kandidaten ein Bild
  ohne Hand suchst. Bei viel Hand-Arbeit (Stricken, Häkeln, Fadenspiele) ruhig 10–20 Einzelbilder ansehen.
- Probe – erzeugt genau das Bild, das später gebaut wird:
  `python werkzeug/vorschau.py probe <app-id> <t> [x0,y0,x1,y1]` (Ausschnitt ohne Leerzeichen, z. B. `0.2,0.1,0.9,0.8`)
  → `werkzeug/cache/_vorschau/probe/<app-id>_<t>.jpg`: links das fertige 480×270-Bild, rechts das ganze Bild NACH dem Entfernen
  schwarzer Ränder mit gelbem 10-%-Raster. Die Einzelbilder in `f/` können um etwa 1 s von der Probe abweichen – es gilt die Probe.

## Regeln – die Bilder sind öffentlich
Auf dem fertigen 16:9-Bild ist NICHTS von einem Menschen zu sehen:
- keine Hand, kein Finger, keine Fingerspitze, kein Daumen am Rand, kein Arm, Handgelenk, Ärmel, Oberkörper, Gesicht, Haar, Bein,
  keine getragene Kleidung; unscharfe Ränder zählen mit – auch ein halber Finger am Rand ist ein Fehler;
- keine eingeblendete Schrift, Untertitel, Bauchbinde, kein Titel, Logo, Wasserzeichen, Senderzeichen, «Abonnieren»;
  keine fremdsprachige oder unpassende Schrift auf dem Werkstück (Schrift, die zum Werkstück gehört, z. B. ein gestickter Name, ist ok);
- keine Titelbilder, kein Abspann, keine Übergänge, keine verwischten Bilder.
Am besten: fertiges Werkstück, ruhig, scharf, gut erkennbar, möglichst gross. Bei Experimenten/Sachvideos: das aussagekräftigste
ruhige Bild des Versuchs oder Ergebnisses. Ein Werkstück mit gemaltem Gesicht (Puppe, Maske, Figur) ist ok, ein echter Mensch nie.

## Vorgehen pro Video
1. Bogen ansehen (Read). Fehlt er, nur Einzelbilder nutzen.
2. Bild ohne Menschen suchen, sonst gezielt Einzelbilder ansehen.
3. JEDE Wahl mit der Probe prüfen und das Probe-Bild ansehen. Nur wenn links wirklich nichts Menschliches und keine Schrift ist,
   gilt die Wahl. Sonst andere Zeit oder anderen Ausschnitt (höchstens etwa 5 Proben pro Video).
4. Gibt es kein Bild ohne Menschen, das das Thema zeigt: `"t": null` (die App zeigt dann das YouTube-Bild). Das ist erlaubt und
   besser als ein Bild mit Hand.

## Ausschnitt `aus`
`[x0, y0, x1, y1]` als Anteile 0..1 des RECHTEN Probe-Bildes (nach Randentfernung, 0,0 = oben links); lies das Raster ab.
Danach wird MITTIG ein 16:9-Rechteck INNERHALB des Ausschnitts genommen (nie erweitert). Ein schmaler oder hoher Ausschnitt wird
also links und rechts weiter beschnitten: [0, 0.45, 1, 1] ergibt nur die mittleren 55 % der Breite. Lege das Werkstück in die
Mitte des Ausschnitts. Mindestens etwa 0.45 Breite, sonst wird es unscharf. `null` = ganzes Bild.

## Freistellen `frei`
`true` nur, wenn EIN einzelnes Werkstück klar abgegrenzt auf ruhigem Grund liegt oder steht und niemand es hält. Dann wird es
lokal ausgeschnitten und auf hellgrauen Grund gesetzt. Bei Stoffflächen, Stickereien auf Stoff, Gruppen vieler Teile, Szenen,
Experimenten mit Flüssigkeiten: `false`. Im Zweifel `false`.

## Ergebnis
Schreib (Write-Werkzeug) die Datei, die dir genannt wird (`werkzeug/cache/_vorschau/wahl/wahl-<N>.json`):
```
{"<app-id>": {"t": 105.0 oder null, "aus": [x0, y0, x1, y1] oder null, "frei": false, "schwach": false, "notiz": "kurz, deutsch: was man sieht, warum sicher ohne Hand"}, ...}
```
`schwach: true`, wenn das Bild zwar ohne Menschen ist, aber nicht wirklich gut (klein, etwas unscharf, nur ein Zwischenstand) –
in der Notiz sagen, was stört. Jede app-id deiner Liste muss vorkommen.

**Neuwahl:** Bekommst du statt einer Liste app-ids mit dem Befund einer Prüfung, wähle für diese neu (andere Zeit oder anderer
Ausschnitt, sonst `null`) und schreib die genannte Datei `wahl-neu-<N>.json` im gleichen Format.

Antworte am Schluss nur mit einer Zeile: Anzahl Videos, davon mit Bild, davon null, davon frei, davon schwach.
