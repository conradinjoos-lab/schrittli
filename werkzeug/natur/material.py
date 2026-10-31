#!/usr/bin/env python3
"""Materialfotos der Natur-Anleitungen: holt quadratische Ausschnitte aus den Reels nach material/ und schreibt material/fotos.json.

Aufruf:  python werkzeug/natur/material.py
"""
import json
from pathlib import Path
from bauen import reel, schaerfstes

ZIEL = Path(__file__).resolve().parent.parent.parent / 'material'
GROESSE = 256

# id: (Reel, Sekunde, x, y, Seite) in Pixeln von 720 × 1280
FOTOS = {
    'astscheibe': ('21', 6.4, 60, 320, 620),
    'glasnugget': ('7', 4.3, 190, 480, 340),
    'kastanie': ('13', 8.6, 200, 360, 240),
    'eichel': ('13', 8.6, 145, 215, 170),
    'walnuss': ('8', 4, 170, 405, 200),
    'ahornsamen': ('20', 41.3, 60, 240, 400),
    'tannenzweig': ('8', 15, 0, 520, 230),
    'pompon': ('8', 4, 240, 10, 150),
    'glaskugel': ('13', 29.6, 215, 570, 150),
    'holzring': ('2', 9.8, 230, 560, 270),
    'glitter': ('20', 26.5, 210, 800, 370),
}


def main():
    for mid, (r, t, x, y, s) in FOTOS.items():
        im = schaerfstes(reel(r), t).crop((x, y, x + s, y + s)).resize((GROESSE, GROESSE))
        im.save(ZIEL / f'{mid}.webp', 'WEBP', quality=84, method=6)
    fotos = sorted(f.name for f in ZIEL.glob('*.webp'))
    (ZIEL / 'fotos.json').write_text(json.dumps({'fotos': fotos}, ensure_ascii=False), encoding='utf-8')
    print(len(fotos), 'Fotos')


if __name__ == '__main__':
    main()
