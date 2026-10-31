#!/usr/bin/env python3
"""Natur-Anleitungen bauen: holt die Screenshots aus den Reels und trägt die Projekte in anleitungen/anleitungen.json ein.

Aufruf:  python werkzeug/natur/bauen.py p_spiele       nur die Bilder dieser Datei holen
         python werkzeug/natur/bauen.py --eintragen    nur anleitungen.json schreiben
         python werkzeug/natur/bauen.py                alles

Jede Datei p_<name>.json ist eine Liste von Projekten wie in anleitungen.json. Statt «bilder» steht in jedem Schritt
«bild»: {"reel": "8", "t": 12.5, "aus": [x, y, b, h]} oder eine Liste von zwei solchen Bildern. «titelbild» hat dieselbe Form.
reel "8" ist «Helga Gesang_HD (8).mp4», reel "0" ist «Helga Gesang_HD.mp4», alles andere ein Dateiname. «aus» ist optional, in Pixeln von 720 × 1280.
"""
import json, sys
from pathlib import Path
import cv2
from PIL import Image

HIER = Path(__file__).resolve().parent
ANL = HIER.parent.parent / 'anleitungen'
REELS = Path(r'C:\Users\coni\Downloads\Facebook')
HAUEFIG = 'Helga Gesang_HD{}.mp4'


def reel(name):
    if name == '0':
        return REELS / HAUEFIG.format('')
    return REELS / (HAUEFIG.format(f' ({name})') if name.isdigit() else name)


def schaerfstes(datei, t):
    """Von den Bildern rund um t das schärfste, damit keine Hand im Bild verwischt."""
    v = cv2.VideoCapture(str(datei))
    if not v.isOpened():
        sys.exit(f'! {datei} fehlt')
    beste, wert = None, -1
    for d in (-.2, -.1, 0, .1, .2):
        v.set(cv2.CAP_PROP_POS_MSEC, max(0, t + d) * 1000)
        ok, f = v.read()
        if not ok:
            continue
        s = cv2.Laplacian(cv2.cvtColor(f, cv2.COLOR_BGR2GRAY), cv2.CV_64F).var()
        if s > wert:
            beste, wert = f, s
    v.release()
    if beste is None:
        sys.exit(f'! {datei.name}: nichts bei {t} s')
    return Image.fromarray(cv2.cvtColor(beste, cv2.COLOR_BGR2RGB))


def holen(b, ziel):
    im = schaerfstes(reel(str(b['reel'])), b['t'])
    if 'aus' in b:
        x, y, w, h = b['aus']
        im = im.crop((x, y, x + w, y + h))
    im.save(ziel, 'WEBP', quality=84, method=6)


def projekte(wahl=()):
    aus = []
    for p in sorted(HIER.glob('p_*.json')):
        if not wahl or p.stem in wahl:
            aus += json.loads(p.read_text(encoding='utf-8'))
    return aus


def liste(b):
    return b if isinstance(b, list) else [b]


def schrittnamen(n, s):
    b = liste(s['bild'])
    return [f'schritt-{n:02d}.webp'] if len(b) == 1 else [f'schritt-{n:02d}-{i}.webp' for i in range(1, len(b) + 1)]


def bilder_holen(p):
    ordner = ANL / p['id']
    ordner.mkdir(exist_ok=True)
    for f in ordner.glob('*.webp'):
        f.unlink()
    holen(p['titelbild'], ordner / 'titelbild.webp')
    for n, s in enumerate(p['steps'], 1):
        for b, name in zip(liste(s['bild']), schrittnamen(n, s)):
            holen(b, ordner / name)
    print(p['id'], len(p['steps']))


def fuer_json(p):
    steps = [{**{k: v for k, v in s.items() if k != 'bild'}, 'bilder': schrittnamen(n, s)} for n, s in enumerate(p['steps'], 1)]
    return {**p, 'titelbild': 'titelbild.webp', 'steps': steps}


def main():
    wahl = sys.argv[1:]
    if wahl != ['--eintragen']:
        for p in projekte(wahl):
            bilder_holen(p)
    if not wahl or wahl == ['--eintragen']:
        eintragen([fuer_json(p) for p in projekte()])


def eintrag(p):
    """Ein Projekt im Stil von anleitungen.json: ein Feld pro Zeile, ein Schritt pro Zeile."""
    d = lambda v: json.dumps(v, ensure_ascii=False)
    zeilen = [f'   {d(k)}: {d(v)}' for k, v in p.items() if k not in ('steps', 'fertig')]
    schritte = ',\r\n'.join('    ' + d(s) for s in p['steps'])
    zeilen.append(f'   "steps": [\r\n{schritte}\r\n   ]')
    zeilen.append(f'   "fertig": {d(p["fertig"])}')
    return '  {\r\n' + ',\r\n'.join(zeilen) + '\r\n  }'


def eintragen(neu):
    """Hängt die Natur-Projekte hinten an und lässt den Rest der Datei Zeichen für Zeichen stehen."""
    datei = ANL / 'anleitungen.json'
    with open(datei, encoding='utf-8', newline='') as f:
        t = f.read()
    start = t.find('{\r\n   "id": "natur-')
    vorne = t[:start].rstrip().rstrip(',') if start >= 0 else t[:t.rindex('\r\n ]')]
    t = vorne + ',\r\n' + ',\r\n'.join(eintrag(p) for p in neu) + '\r\n ]\r\n}\r\n'
    json.loads(t)
    with open(datei, 'w', encoding='utf-8', newline='') as f:
        f.write(t)


if __name__ == '__main__':
    main()
