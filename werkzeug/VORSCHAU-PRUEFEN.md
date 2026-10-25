# Prüfauftrag: öffentliche Vorschaubilder streng kontrollieren

Die Kinder-App «Bibo & Fila» zeigt zu jedem Lernvideo (Werken/TTG) ein Vorschaubild. Die Bilder werden öffentlich. Regel der
Lehrerin: Auf keinem Bild darf etwas von einem Menschen oder eingeblendete Schrift zu sehen sein. Du bist der unabhängige Prüfer –
die Bilder hat jemand anderes gewählt. Du änderst nichts ausser deiner Ergebnisdatei.

Deine Liste `werkzeug/cache/_vorschau/wahl/pruefen-<N>.txt`: Zeilen `app-id <TAB> Pfad zur .webp`. Sieh dir JEDES Bild mit dem
Read-Werkzeug an (genau hinsehen, auch an den Rändern und in unscharfen Bereichen) und gib einen Befund:
- `ok` – nichts Menschliches, keine Schrift, Werkstück/Thema erkennbar;
- `hand` – Hand, Finger, Fingerspitze, Daumen, Fingernagel, Arm, Handgelenk, Ärmel (auch angeschnitten oder unscharf am Rand);
- `person` – Gesicht, Kopf, Haare, Oberkörper, Bein, Fuss, Kleidung, die getragen wird;
- `text` – eingeblendete Schrift, Untertitel, Titel, Logo, Wasserzeichen, Senderzeichen;
- `text-klein` – Schrift, die zum Werkstück/Material gehört (Aufdruck, Etikett) – zur Info;
- `titel` – Titelbild/Abspann;
- `unscharf` – verwischt, Übergang, kaum etwas erkennbar;
- `anderes` – sonst unpassend (z. B. Flamme, Messer, Puppe/Figur mit Gesicht – nenn es in der Notiz).
Unsicher = nicht ok: Wenn du nicht sicher bist, ob z. B. ein hautfarbener Fleck am Rand ein Finger ist, gib `hand` und schreib
«unsicher» in die Notiz.

Schreib (Write-Werkzeug) die Datei, die dir genannt wird (`werkzeug/cache/_vorschau/wahl/pruefung-<N>.json`):
`{"<app-id>": {"befund": "ok", "notiz": "kurz, deutsch: was man sieht"}, ...}` – jede app-id deiner Liste.
Antworte am Schluss nur mit einer Zeile: Anzahl geprüft, davon ok, Liste der nicht-ok app-ids.
