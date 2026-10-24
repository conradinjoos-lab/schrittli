# Bibo & Fila – Figuren für die App

Zwei Werkstatt-Figuren führen durch die App. Sie sind **keine** Tiere aus der Kinder-Auswahl beim Start, sondern die Gastgeber der Werkstatt.

| | **Bibo** (Biber) | **Fila** (Spinne) |
|---|---|---|
| steht für | Holz, Technisches Gestalten: Sägen, Nageln, Schnitzen, Formen, Falten, Schneiden & Kleben, Drucken, Experimentieren | Faden, Textiles Gestalten: Nähen, Sticken, Häkeln, Stricken, Weben, Flechten & Knüpfen, Wickeln, Filzen |
| Wesen | gemütlich, geduldig, packt an, freut sich laut | flink, genau, neugierig, zeigt Tricks |
| erkennbar an | blaue Werkschürze, Bleistift hinter dem Ohr, flacher Kellenschwanz | violett-runder Körper, geringelte Beinchen, Wollknäuel |
| Grösse | gross | klein, sitzt gern auf Bibos Kopf oder Schulter |

Fila darf **nicht gruselig** wirken: runder, flauschiger Körper, zwei grosse freundliche Augen, kurze runde Beine. Kinder mit Spinnenangst sollen sie trotzdem mögen.

## Erzeugen über die Grok-Kommandozeile (macht Claude)

Auf Conradins Rechner ist `grok` installiert und angemeldet. Nur das Bildwerkzeug freigeben:

```bash
grok -p "Generate exactly one image with your image generation tool, then reply only with the local file path. Image prompt: …" --tools image_gen --max-turns 4
```

Das Bild landet als JPG (1280×720 oder quadratisch) in `~/.grok/sessions/<Ordner>/<Sitzung>/images/1.jpg` und wird von dort nach `grafik/figuren/` kopiert. Vorlagen (Stand 25.10.2026): `bibo-blatt.jpg`, `fila-blatt-2.jpg` (bei `fila-blatt.jpg` hat die Draufsicht zehn Beine).

## Freistellen und Einbauen

`python werkzeug/figuren.py [name ...]` macht aus jedem `grafik/figuren/<name>.jpg` ein freigestelltes `<name>.webp` (höchstens 640 px). Aus `logo.jpg` entstehen zusätzlich `logo.webp` (ohne Rahmen) und das App-Symbol `icon.png`.

In der App (`quelle/p2.js`, Hilfsfunktion `figur(name)`):

| Stelle | Figur |
|---|---|
| Willkommen, Klasse wählen | `hallo` (abends `abend`) |
| Raumwahl Schule | `fila-faden` (Handarbeitszimmer), `bibo-holz` (Werkraum) |
| Kopf Schule | `logo` |
| Material richten | `material` |
| Schild «Jetzt du» | `jetzt-du` |
| Video fertig, Anleitung fertig | `geschafft` |
| Video geht nicht, leere Listen | `nachdenken` |
| Keine Werke | `foto` |

Weitere Posen auf Vorrat (noch nicht eingebaut): `bibo-hallo`, `bibo-jetzt-du`, `bibo-geschafft`, `bibo-daumen`, `bibo-nachdenken`, `bibo-zeigt`, `bibo-basteln`, `bibo-abend`, `bibo-foto`, `fila-hallo`, `fila-jetzt-du`, `fila-geschafft`, `fila-nachdenken`, `fila-haengt`, `fila-naehen`, `fila-weben`, `fila-haekeln`, `fila-abend`, `beide-highfive`, `beide-tafel`, `beide-werk`.

## Ablauf in Grok

1. **Zuerst die Figurenblätter** (1 und 2) erzeugen, bis je eines wirklich passt. Das sind die Vorlagen für alles Weitere.
2. Für jede weitere Pose das passende Figurenblatt **als Bild mitgeben** und den Satz «Use the attached character exactly as reference, same colors, same proportions, same outfit» vor den Prompt setzen. Sonst sieht die Figur jedes Mal anders aus.
3. Speichern als `grafik/figuren/<dateiname>.png` (weisser Hintergrund ist gut, wie bei den Themenkacheln). Umwandeln nach WebP erledigt Claude.
4. Bei Fila jedes Mal **die Beine zählen**: genau acht. Grok malt gern sechs oder zehn.

## Stil (an jeden Prompt anhängen)

Passt zu den Themenkacheln in `grafik/` (Webrahmen, Hammer und Holz):

> Cute children's book cartoon illustration, clean hand-drawn dark brown outlines, soft flat colors with a subtle textile and wood-grain texture, warm friendly palette, gentle soft shading only, isolated on a pure white background, centered, no text, no letters, no logo, no ground shadow, square format 1:1.

## Grundbeschreibungen (in jeden Prompt einsetzen)

**{BIBO}**

> Bibo, a friendly young beaver, chubby round body, warm caramel-brown fur, lighter cream belly and muzzle, two big orange front teeth, small round ears, big kind dark eyes, a wide flat paddle tail with a crosshatch pattern, wearing a short teal-blue carpenter's apron with one front pocket, a yellow pencil tucked behind one ear

**{FILA}**

> Fila, a small cute friendly spider, round fluffy purple body like a pompom, two big round shiny friendly eyes with eyelashes, a small happy smile, exactly eight short round legs with pastel rainbow stripes like knitted socks, a tiny pink knitted beanie, not scary at all

## Prompts

| Nr | Dateiname | wofür in der App | Prompt (davor {BIBO}/{FILA}, danach Stil) |
|---|---|---|---|
| 1 | `bibo-blatt` | Vorlage | Character design sheet of {BIBO}: front view, side view and back view standing next to each other, neutral happy pose, same size, evenly spaced. Format 16:9 statt 1:1. |
| 2 | `fila-blatt` | Vorlage | Character design sheet of {FILA}: front view, side view and top view next to each other, neutral happy pose, same size, evenly spaced. Format 16:9 statt 1:1. |
| 3 | `logo` | App-Symbol, Startseite (ersetzt den Wollfuss) | {BIBO} standing and smiling, {FILA} sitting on top of Bibo's head waving with one leg, both looking at the viewer, framed in a rounded square with a light cream background and a thin dark brown border |
| 4 | `hallo` | Startbildschirm, Kind wählen | {BIBO} waving hello with one paw, {FILA} on his shoulder waving too, both cheerful |
| 5 | `jetzt-du` | Schild «Jetzt du» beim Stopp | {BIBO} pointing at the viewer with an encouraging smile, {FILA} on his head pointing at the viewer with one leg, as if saying "now it's your turn" |
| 6 | `geschafft` | Video fertig, Aufgabe abgegeben | {BIBO} jumping with joy, both paws up, {FILA} doing a little happy dance on his head, small colorful confetti around them |
| 7 | `foto` | «Foto von deinem Werk» | {BIBO} holding up a small old-fashioned camera, {FILA} peeking out from behind the camera, both curious and happy |
| 8 | `bibo-holz` | Bereiche aus Holz / Technik | {BIBO} alone, holding a small wooden hammer in one paw and a short saw in the other, a little pile of wood shavings at his feet, proud |
| 9 | `fila-faden` | Bereiche mit Faden / Textil | {FILA} alone, knitting with two small wooden knitting needles, a ball of red wool next to her, a short knitted strip hanging down, concentrated and happy |
| 10 | `nachdenken` | Laden, leere Liste, «noch nichts da» | {BIBO} scratching his head, thinking, {FILA} hanging upside down from a thread in front of his nose, both puzzled but friendly |
| 11 | `abend` | Abendwerkstatt ab 18 Uhr | {BIBO} sitting and yawning, holding a small lantern, {FILA} asleep curled up in his apron pocket, cozy night mood, soft warm lantern light |
| 12 | `material` | Materialkarte «Material richten» | {BIBO} carrying a wooden toolbox, {FILA} sitting on top of the box holding a ball of yarn, ready to start |

## Wenn etwas nicht passt

- **Fila wirkt unheimlich:** «chibi style, very round, baby-like proportions, no fangs, no hair spikes» anhängen.
- **Bibo sieht aus wie ein Bär oder Hamster:** «clearly a beaver, flat wide paddle tail visible, two big front teeth visible» anhängen.
- **Text im Bild:** Grok schreibt gern Buchstaben auf Schürze oder Schild. «no text, no letters on clothing» wiederholen.
- **Andere Farben als auf dem Figurenblatt:** Figurenblatt erneut mitgeben und Farben aus {BIBO}/{FILA} wörtlich wiederholen.
