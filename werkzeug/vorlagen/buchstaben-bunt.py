"""Welle 4: bunte Buchstaben A–Z und Ziffern 0–9 (DejaVu Sans Bold, gerundet, zweifarbig, schwarzer Umriss) → bilder/abc-*.png.
Aufruf: python -X utf8 buchstaben-bunt.py   danach in figuren.json eintragen (k=3) und bild.py abc-a … abc-9 laufen lassen."""
import os, sys, colorsys
import numpy as np, cv2, matplotlib
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bildhelfer as mach
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'bilder')
FONT = os.path.join(os.path.dirname(matplotlib.__file__), 'mpl-data', 'fonts', 'ttf', 'DejaVuSans-Bold.ttf')
def glyph(ch, farbe):
    S = 1400
    f = ImageFont.truetype(FONT, 1100)
    im = Image.new('L', (S, S), 0); d = ImageDraw.Draw(im)
    d.text((S // 2, S // 2), ch, font=f, fill=255, anchor='mm')
    m = np.array(im)
    # runden: aufblasen, dann zurück, dann glätten
    k = lambda r: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))
    m = cv2.dilate(m, k(26)); m = cv2.erode(m, k(26))
    m = cv2.GaussianBlur(m, (0, 0), 6); m = ((m > 127) * 255).astype(np.uint8)
    ys, xs = np.where(m > 0); m = m[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    # Innenkontur: helleres Feld, darum ein Ring in der Grundfarbe
    inn = cv2.erode(m, k(int(max(m.shape) * .045)))
    c = np.array(farbe, np.float32)
    hell = c + (255 - c) * .45
    rgba = np.zeros(m.shape + (4,), np.uint8)
    rgba[m > 0, :3] = c.astype(np.uint8); rgba[m > 0, 3] = 255
    rgba[inn > 0, :3] = hell.astype(np.uint8)
    rgba[:, :, 3] = m
    return mach.umriss(rgba, dick=13)
def farbe(i, n):
    h = (i / n) % 1.0
    r, g, b = colorsys.hsv_to_rgb(h, .78, .96)
    return (r * 255, g * 255, b * 255)
zeichen = [chr(c) for c in range(65, 91)] + [str(i) for i in range(10)]
if __name__ == '__main__':
    for i, z in enumerate(zeichen):
        mach.speichern(glyph(z, farbe(i * 7, 36)), os.path.join(OUT, f'abc-{z.lower()}.png'))
    print(len(zeichen))
