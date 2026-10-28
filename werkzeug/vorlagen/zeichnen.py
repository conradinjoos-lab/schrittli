"""Grundbausteine für die Vorlagen-Formen: Kreise, Ellipsen, Striche, Vielecke und Glätten.
Koordinaten: y nach oben, eine Form ist etwa 100 Einheiten gross (wird später auf cm skaliert)."""
import numpy as np
from shapely.geometry import Point, Polygon, LineString, box
from shapely.ops import unary_union
from shapely import affinity

__all__ = ['np', 'Point', 'Polygon', 'LineString', 'box', 'unary_union', 'affinity',
           'C', 'E', 'L', 'P', 'U', 'hull', 'glatt', 'weich', 'vieleck', 'stern', 'kreislinie', 'bogen', 'R', 'spiegel_x', 'pruefen',
           'schmalste', 'schwierigkeit']


def C(x, y, r): return Point(x, y).buffer(r, 64)                     # Kreis
def E(x, y, rx, ry, rot=0): return affinity.translate(affinity.rotate(affinity.scale(Point(0, 0).buffer(1, 64), rx, ry), rot), x, y)   # Ellipse, rot in Grad
def L(pkt, breite): return LineString(pkt).buffer(breite/2, 32)       # runder Strich durch Punkte
def P(pkt): return Polygon(pkt)                                       # Vieleck aus Punkten
def U(*g): return unary_union(g)                                      # vereinigen
def hull(*g): return unary_union(g).convex_hull                       # Hülle (wie Gummiband)
def glatt(g, r): return g.buffer(r, 32).buffer(-r, 32)               # Innenecken ausrunden
def weich(g, r): return g.buffer(-r, 32).buffer(r, 32)               # Aussenecken abrunden
def R(g, grad, um=(0, 0)): return affinity.rotate(g, grad, origin=um)  # drehen
def spiegel_x(g): return affinity.scale(g, -1, 1, origin=(0, 0))     # links-rechts spiegeln
def vieleck(n, r, rot=90): return [(r*np.cos(np.radians(rot + 360*k/n)), r*np.sin(np.radians(rot + 360*k/n))) for k in range(n)]
def stern(n, ra, ri): return [((ra if k % 2 == 0 else ri)*np.cos(np.radians(90 + 180*k/n)), (ra if k % 2 == 0 else ri)*np.sin(np.radians(90 + 180*k/n))) for k in range(2*n)]
def kreislinie(x, y, r): return LineString(C(x, y, r).exterior.coords)   # Detail: Auge usw.


def bogen(x, y, r, von, bis, n=24):
    """Punkte auf einem Kreisbogen (Grad), z.B. für L(bogen(...), breite) oder als Detail-Linie."""
    a = np.radians(np.linspace(von, bis, n)); return list(zip(x + r*np.cos(a), y + r*np.sin(a)))


def schmalste(g, k=4):
    """Breite der schmalsten Stelle (in Einheiten von g): kleinste Strichbreite 2r, bei der das «Öffnen»
    (erst r schrumpfen, dann r wachsen) ein Stück wegfrisst, das grösser ist als k·r² – also ein Bein, Stiel
    oder Fühler, nicht bloss eine spitze Ecke."""
    for r in np.arange(0.5, 30, 0.25):
        # Gemeinsames Präzisionsraster verhindert GEOS-Rundungsfehler an Pixelkanten.
        innen = g.buffer(-r, 16).buffer(r, 16).buffer(0)
        weg = g.difference(innen, grid_size=.001)
        if max([t.area for t in getattr(weg, 'geoms', [weg])] + [0]) > k*r*r: return 2*(r - 0.25)
    return 60.0


def schwierigkeit(g, eng):
    """1 bis 3 Scheren: wie verwinkelt der Umriss ist (Umfang im Vergleich zur Gummiband-Hülle) und wie schmal."""
    kurvig = g.exterior.length / g.convex_hull.exterior.length
    if kurvig < 1.15 and eng >= 20: return 1
    if kurvig > 1.45 or eng < 11: return 3
    return 2


def pruefen(fid, f):
    """Gibt eine Liste von Problemen zurück (leer = gut). f ist Polygon oder (Polygon, [Details])."""
    g = f[0] if isinstance(f, tuple) else f
    p = []
    if g.is_empty or not g.is_valid: return ['ungültige Form']
    if g.geom_type != 'Polygon': p.append(f'{g.geom_type}: zerfällt in {len(g.geoms)} Teile (nur das grösste bleibt)')
    else:
        x0, y0, x1, y1 = g.bounds; s = 100 / max(x1-x0, y1-y0)
        loch = [i for i in g.interiors if Polygon(i).area*s*s > 4]
        if loch: p.append(f'{len(loch)} Loch/Löcher (werden zugefüllt)')
        d = affinity.scale(g, s, s).buffer(-3)               # dünne Stellen: unter 6 von 100 zerfällt die Form
        if d.geom_type != 'Polygon' or d.is_empty: p.append('dünne Stelle (unter 6 % der Grösse), schlecht zu schneiden')
    return p
