"""Übersichtsblätter der Linienansicht (Farben aus: Umriss schwarz, Innenlinien grau) für alle Figuren einer Welt,
so wie sie der Vorlagen-Generator ohne Häkchen «farbig» zeigt. Zum Kontrollieren, nicht für die App.

Aufruf: python -I uebersicht.py <Zielordner> [<Welt-Datei> …]   – z. B. minecraft, wappen (ohne .js); fehlt: alle Welten
Schreibt je Welt <Zielordner>/<welt>.png mit Kacheln (Name + Anzahl Innenlinien + Farben) und gibt je Figur eine Zeile
«welt id Innenlinien Farben Länge» aus (Länge = Summe der Innenlinien in mm)."""
import os, sys, json, math
HIER = os.path.dirname(os.path.abspath(__file__))
QUELLE = os.path.normpath(os.path.join(HIER, '..', '..', 'vorlagen', 'figuren'))
from PIL import Image, ImageDraw, ImageFont

K = 150            # Kachelgrösse in Pixel
SPALTEN = 10

def laden(datei):
    s = open(datei, encoding='utf-8').read()
    return json.loads(s[s.index('[', s.index('FIGUREN_DAZU')):s.rindex(']') + 1])

def kachel(f, font):
    im = Image.new('RGB', (K, K + 28), 'white'); dr = ImageDraw.Draw(im)
    sk = (K - 12) / max(f['w'], f['h'], 1)
    ox = 6 + (K - 12 - f['w'] * sk) / 2; oy = 6 + (K - 12 - f['h'] * sk) / 2
    tr = lambda p: (ox + p[0] * sk, oy + p[1] * sk)
    for l in f['det']:
        if len(l) > 1: dr.line([tr(p) for p in l], fill=(140, 130, 120), width=1)
    for r in f['d']:
        if len(r) > 1: dr.line([tr(p) for p in r] + [tr(r[0])], fill='black', width=2)
    laenge = sum(math.dist(l[i], l[i + 1]) for l in f['det'] for i in range(len(l) - 1))
    dr.text((4, K + 2), f['name'][:26], fill='black', font=font)
    dr.text((4, K + 14), f"{f['id'][:22]}  L{len(f['det'])} F{len(f['farben'])} {laenge:.0f}mm", fill=(90, 90, 90), font=font)
    return im, laenge

def blatt(welt, figuren, ziel, font):
    zeilen = (len(figuren) + SPALTEN - 1) // SPALTEN
    out = Image.new('RGB', (SPALTEN * (K + 6) + 6, zeilen * (K + 34) + 6), (235, 235, 235))
    for i, f in enumerate(figuren):
        im, laenge = kachel(f, font)
        out.paste(im, (6 + (i % SPALTEN) * (K + 6), 6 + (i // SPALTEN) * (K + 34)))
        print(welt, f['id'], len(f['det']), len(f['farben']), round(laenge))
    out.save(os.path.join(ziel, welt + '.png'))

if __name__ == '__main__':
    try: sys.stdout.reconfigure(encoding='utf-8')
    except Exception: pass
    ziel = sys.argv[1]; os.makedirs(ziel, exist_ok=True)
    try: font = ImageFont.truetype('arial.ttf', 11)
    except Exception: font = ImageFont.load_default()
    welten = sys.argv[2:] or sorted(n[:-3] for n in os.listdir(QUELLE) if n.endswith('.js') and n != 'index.js')
    for w in welten:
        blatt(w, laden(os.path.join(QUELLE, w + '.js')), ziel, font)
