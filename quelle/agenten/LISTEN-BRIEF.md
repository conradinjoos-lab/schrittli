# Auftrag: Materiallisten für Lernvideos

Für die Kinder-App «Schrittli» (TTG-Unterricht 1.–6. Klasse) zeigt der Player vor jedem Video eine Materialkarte: «MATERIAL RICHTEN» mit Piktogrammen. Du legst fest, welches Material pro Video auf die Karte kommt.

## Grundlagen

- Vokabular (nur diese IDs): `/tmp/claude-0/-home-claude/52bcf20d-745b-53d1-bc04-f35897a21c52/scratchpad/material/VOKABULAR.md`
- Videos mit Titel, Hinweis und Schritt-Labels: `/tmp/claude-0/-home-claude/52bcf20d-745b-53d1-bc04-f35897a21c52/scratchpad/material/videos.json` – du bearbeitest nur die Videos mit den dir zugeteilten `areaId`-Werten.

## Regeln

- 2 bis 8 Einträge pro Video, wichtigstes zuerst (das Hauptmaterial, dann Werkzeug, dann Hilfsmittel).
- Nur, was das Kind wirklich in die Hand nimmt. Kein «Tisch», keine «Unterlage», kein «Erwachsener».
- Wenn im Hinweis oder in den Schritten etwas steht, das im Vokabular fehlt und wichtig ist: neue id vergeben (klein, ohne Umlaute, z. B. `kerze`), mit Name im Bericht nennen.
- Bei Unsicherheit lieber ein Material weniger als ein falsches.

## Ausgabe

Datei `/tmp/claude-0/-home-claude/52bcf20d-745b-53d1-bc04-f35897a21c52/scratchpad/material/listen-<DEIN-BUCHSTABE>.json`:

```json
{ "wl-vorstich": ["filz","nadel","garn","schere"], "zw-pompon": ["wolle","karton","schere","zirkel"] }
```

## Bericht

Nur: Anzahl Videos, Liste neuer IDs mit Namen (falls welche), und Videos, bei denen du unsicher warst (id + warum). Keine Listen in den Bericht kopieren.
