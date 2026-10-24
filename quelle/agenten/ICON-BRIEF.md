# Auftrag: Material-Piktogramme (SVG) im Werkstatt-Stil

Für die Kinder-App «Schrittli» (Werkstatt-Optik: Lochwand, Holzregal, dicke dunkle Konturen) brauchen wir Piktogramme für Bastel-/Werkmaterial. Sie erscheinen 60–110 px gross auf hellem Papier-Hintergrund (#FFF1C9) und müssen auf einen Blick erkennbar sein – für Kinder der 1. Klasse.

## Stil (verbindlich)

- Inline-SVG-Inhalt für `viewBox="0 0 120 110"` (nur die inneren Elemente, ohne `<svg>`-Tag).
- Konturen: `stroke="#2B2320"`, `stroke-width="4"`, `stroke-linejoin="round"`, `stroke-linecap="round"`. Dünne Details dürfen stroke-width 3 haben.
- Flächen flach, keine Verläufe, keine Schatten, kein Text. Farben nur aus dieser Palette: Rot #E8554E, Gelb #F2C12E, Grün #3BB273, Blau #4C6EF5, Violett #9B5DE5, Türkis #2BB3A3, Holz #C98A4E, dunkles Holz #8F5A2E, Glas #E8F6FF, Papier #FFF1C9, Weiss #fff, Metall #C9C2B8, Rosa #E05297.
- Wenige, grosse Formen (höchstens ~12 Elemente). Das Objekt füllt den Rahmen (Ränder ca. 8 px), steht aufrecht oder leicht schräg, kein Hintergrund.
- Beispiele für den Stil liegen in `/tmp/claude-0/-home-claude/52bcf20d-745b-53d1-bc04-f35897a21c52/scratchpad/material/STIL-BEISPIELE.txt` (Schere, Farbkasten, Käferglas, Wollknäuel, Kolben – so soll es aussehen).

## Ausgabe

Eine JSON-Datei `/tmp/claude-0/-home-claude/52bcf20d-745b-53d1-bc04-f35897a21c52/scratchpad/material/icons-<DEIN-BUCHSTABE>.json`:

```json
{ "karton": "<rect …/><path …/>", "papier": "…" }
```

## Qualitätsprüfung (Pflicht)

Baue eine HTML-Testseite mit allen deinen Piktogrammen (jedes in 110 px und in 56 px, auf #FFF1C9, mit Beschriftung), rendere sie mit Playwright zu einem PNG und schau dir das Bild mit dem Read-Tool an. So:

```js
// NODE_PATH=$(npm root -g) node render.js
const { chromium } = require('playwright');
(async()=>{ const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']}); const p=await b.newPage({viewport:{width:1100,height:700}}); await p.goto('file:///…/test.html'); await p.screenshot({path:'…/sheet.png',fullPage:true}); await b.close(); })();
```

Überarbeite, was nicht auf Anhieb erkennbar ist oder nicht zum Stil passt (zu dünn, zu detailliert, falsche Farben). Mindestens eine Überarbeitungsrunde.

## Bericht

Eine Zeile pro Piktogramm: `<id> | ok` oder `<id> | unsicher: <warum>`. Keine SVG-Quelltexte in den Bericht.
