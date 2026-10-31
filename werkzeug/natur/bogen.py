#!/usr/bin/env python3
"""Kontaktbögen zum Auswählen und Prüfen der Screenshots.

python werkzeug/natur/bogen.py reel 8 ziel.jpg [von bis schritt]   Bilder eines Reels mit Zeitstempel
python werkzeug/natur/bogen.py projekt natur-walnuss-rentier ziel.jpg   Fertige Bilder eines Projekts mit ihren Texten
"""
import json, sys
from pathlib import Path
import cv2
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent))
from bauen import ANL, fuer_json, projekte, reel

SCHRIFT = ImageFont.truetype('arial.ttf', 16)


def blatt(kacheln, ziel, proreihe=8, b=190, h=338, unten=0):
    reihen = (len(kacheln) + proreihe - 1) // proreihe
    bild = Image.new('RGB', (proreihe * (b + 4), reihen * (h + unten + 4)), '#333')
    for i, (im, text) in enumerate(kacheln):
        x, y = i % proreihe * (b + 4), i // proreihe * (h + unten + 4)
        bild.paste(im.resize((b, int(im.height * b / im.width))).crop((0, 0, b, h)), (x, y))
        z = ImageDraw.Draw(bild)
        if unten:
            z.rectangle((x, y + h, x + b, y + h + unten), fill='white')
            z.multiline_text((x + 3, y + h + 2), text, fill='black', font=SCHRIFT)
        else:
            z.rectangle((x, y, x + 62, y + 20), fill='black')
            z.text((x + 3, y + 1), text, fill='white', font=SCHRIFT)
    bild.save(ziel, quality=85)


def reel_bogen(name, ziel, von=0, bis=None, schritt=1):
    v = cv2.VideoCapture(str(reel(name)))
    dauer = v.get(cv2.CAP_PROP_FRAME_COUNT) / (v.get(cv2.CAP_PROP_FPS) or 30)
    kacheln, t = [], von
    while t < (bis or dauer):
        v.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
        ok, f = v.read()
        if ok:
            kacheln.append((Image.fromarray(cv2.cvtColor(f, cv2.COLOR_BGR2RGB)), f'{t:.1f}s'))
        t += schritt
    blatt(kacheln, ziel)
    print(f'{dauer:.1f} s, {len(kacheln)} Bilder')


def umbrechen(text, breite=24):
    zeilen, z = [], ''
    for w in text.split():
        if len(z) + len(w) > breite:
            zeilen.append(z)
            z = ''
        z += w + ' '
    return '\n'.join(zeilen + [z])


def projekt_bogen(pid, ziel):
    p = fuer_json(next(x for x in projekte() if x['id'] == pid))
    k = [(Image.open(ANL / pid / p['titelbild']).convert('RGB'), 'Titelbild')]
    for n, s in enumerate(p['steps'], 1):
        for b in s['bilder']:
            k.append((Image.open(ANL / pid / b).convert('RGB'), umbrechen(f"{n}. {s['text']}")))
    blatt(k, ziel, proreihe=6, b=220, h=390, unten=110)


if __name__ == '__main__':
    a = sys.argv[1:]
    if a[0] == 'reel':
        reel_bogen(a[1], a[2], *map(float, a[3:]))
    else:
        projekt_bogen(a[1], a[2])
