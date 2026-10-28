"""Buchstaben A–Z und Ziffern 0–9 als Schablonen, dazu Schrift für nummerierte Punkte. Die Umrisse kommen aus der
freien Schrift DejaVu Sans Bold (liegt matplotlib bei); Ecken leicht gerundet, Innenflächen (O, A, 8 …) bleiben Löcher."""
import os
import matplotlib
from matplotlib.textpath import TextPath
from matplotlib.font_manager import FontProperties
from zeichnen import *

_TTF = os.path.join(os.path.dirname(matplotlib.__file__), 'mpl-data', 'fonts', 'ttf')
FETT = FontProperties(fname=os.path.join(_TTF, 'DejaVuSans-Bold.ttf'))
NORMAL = FontProperties(fname=os.path.join(_TTF, 'DejaVuSans.ttf'))


def _polygone(text, h, prop):
    """Alle Ringe eines Textes (Höhe der Versalien = h), y nach oben."""
    tp = TextPath((0, 0), text, size=h/0.729, prop=prop)                   # Versalhöhe bei DejaVu = 0.729 der Schriftgrösse
    return [Polygon(p) for p in tp.to_polygons() if len(p) > 2]


def zeichen(ch):
    """Ein Zeichen als Fläche mit Löchern."""
    teile = sorted([p if p.is_valid else p.buffer(0) for p in _polygone(ch, 100, FETT)], key=lambda p: -p.area)
    g = teile[0]
    for p in teile[1:]: g = g.difference(p) if g.contains(p) else g.union(p)   # Ring im Umriss = Loch
    g = glatt(weich(g, 1.5), 1.5)
    return affinity.translate(g, -g.centroid.x, -g.centroid.y)


def schrift(text, x, y, h=4, prop=NORMAL):
    """Text als Linien (Details): zentriert auf (x, y), Versalhöhe h."""
    ringe = []
    for p in _polygone(text, h, prop): ringe += [p.exterior, *p.interiors]
    if not ringe: return []
    g = unary_union([Polygon(r) for r in ringe]); b = g.bounds
    dx, dy = x - (b[0] + b[2])/2, y - (b[1] + b[3])/2
    return [LineString([(px + dx, py + dy) for px, py in r.coords]) for r in ringe]


B = 'Buchstaben'
FORMEN = [('buchstabe-' + c.lower(), c, B, zeichen(c), 8) for c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'] + \
         [('zahl-' + c, c, B, zeichen(c), 8) for c in '0123456789']
