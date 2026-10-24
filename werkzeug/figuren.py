"""Figuren von Bibo & Fila freistellen und als WebP speichern.

Liest grafik/figuren/<name>.jpg (von Grok, hellgrauer Hintergrund), entfernt den Hintergrund,
der mit dem Bildrand verbunden ist, schneidet knapp zu und schreibt grafik/figuren/<name>.webp
(transparent, längste Seite höchstens 640 px).

Aufruf im Repo: python werkzeug/figuren.py [name ...]   (ohne Namen: alle JPGs ausser Blättern)
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

ORDNER = Path(__file__).resolve().parent.parent / 'grafik' / 'figuren'
AUSLASSEN = {'bibo-blatt', 'fila-blatt', 'fila-blatt-2', 'uebersicht'}
MAX = 640


def freistellen(quelle, ziel: Path):
    im = (quelle if isinstance(quelle, Image.Image) else Image.open(quelle)).convert('RGB')
    a = np.asarray(im).astype(np.int16)
    # Hintergrundfarbe aus den Ecken schätzen
    ecken = np.concatenate([a[:8, :8].reshape(-1, 3), a[:8, -8:].reshape(-1, 3), a[-8:, :8].reshape(-1, 3), a[-8:, -8:].reshape(-1, 3)])
    bg = np.median(ecken, axis=0)
    abstand = np.abs(a - bg).max(axis=2)
    hell = abstand < 14                      # fast Hintergrund
    lab, _ = ndimage.label(hell)
    rand = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    hinten = np.isin(lab, list(rand))
    # kleine Löcher (Glanzpunkte in Augen) nicht wegschneiden: nur Flächen am Rand zählen
    alpha = np.where(hinten, 0, 255).astype(np.uint8)
    # weicher Übergang: Randpixel je nach Abstand zum Hintergrund halbtransparent
    kante = ndimage.binary_dilation(hinten, iterations=2) & ~hinten
    weich = np.clip((abstand - 4) / 30 * 255, 0, 255).astype(np.uint8)
    alpha[kante] = np.minimum(alpha[kante], weich[kante])
    m = Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(0.6))
    out = im.convert('RGBA')
    out.putalpha(m)
    box = m.point(lambda v: 255 if v > 20 else 0).getbbox()
    if box:
        rand_px = 8
        box = (max(0, box[0] - rand_px), max(0, box[1] - rand_px), min(im.width, box[2] + rand_px), min(im.height, box[3] + rand_px))
        out = out.crop(box)
    out.thumbnail((MAX, MAX), Image.LANCZOS)
    out.save(ziel, 'WEBP', quality=86, method=6)
    return out.size


def main():
    namen = sys.argv[1:] or sorted(p.stem for p in ORDNER.glob('*.jpg') if p.stem not in AUSLASSEN)
    for n in namen:
        q = ORDNER / f'{n}.jpg'
        if not q.exists():
            print(f'{n} | fehlt')
            continue
        if n == 'logo':
            # logo.jpg hat einen gerundeten Rahmen auf cremefarbenem Grund: Innenfläche ohne Rahmen freistellen,
            # daraus das Kopf-Logo und das App-Symbol (Figuren auf Creme, 180 px) machen
            a = np.asarray(Image.open(q).convert('RGB')).copy()
            creme = a[a.shape[0] // 2, 100].copy()
            aussen = np.abs(a.astype(np.int16) - a[4, 4]).max(axis=2) < 14
            lab, _ = ndimage.label(aussen)
            aussen = np.isin(lab, [lab[0, 0], lab[0, -1], lab[-1, 0], lab[-1, -1]])
            a[ndimage.binary_dilation(aussen, iterations=16)] = creme   # Rahmenlinie übermalen
            print(f'{n} | {freistellen(Image.fromarray(a), ORDNER / "logo.webp")}')
            fig = Image.open(ORDNER / 'logo.webp')
            fig.thumbnail((150, 150), Image.LANCZOS)
            icon = Image.new('RGB', (180, 180), (243, 232, 212))
            icon.paste(fig, ((180 - fig.width) // 2, 180 - fig.height - 8), fig)
            icon.save(ORDNER / 'icon.png')
            print('icon | (180, 180)')
            continue
        print(f'{n} | {freistellen(q, ORDNER / f"{n}.webp")}')


if __name__ == '__main__':
    main()
