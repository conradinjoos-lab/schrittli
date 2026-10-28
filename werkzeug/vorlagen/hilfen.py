"""Bausteine für Werkhilfen: Schlitze, Kerben, Punkte, Raster, Klebelaschen.
Schlitze und Kerben werden aus der Form geschnitten, Punkte und Linien sind Details (werden nur gezeichnet)."""
from zeichnen import *

__all__ = ['schlitze', 'kerben', 'kerben_rand', 'punkt', 'punkte', 'strich', 'gitter', 'kreis_punkte', 'rand_punkte',
           'spirale', 'lasche', 'rundbox', 'innen_punkte']


def schlitze(g, n, r, tief, breit, start=90):
    """n Schlitze von aussen (Radius r) gegen die Mitte, je tief lang und breit breit, innen rund."""
    for k in range(n):
        a = np.radians(start + 360*k/n); u = np.array([np.cos(a), np.sin(a)])
        g = g.difference(L([tuple(u*(r + 5)), tuple(u*(r - tief))], breit))
    return g


def kerben(g, xs, y, tief, breit, nach_unten=True):
    """Kerben an einer waagrechten Kante bei y, an den Stellen xs (nach_unten: von oben in die Form)."""
    s = -1 if nach_unten else 1
    for x in xs: g = g.difference(L([(x, y - s*5), (x, y + s*tief)], breit))
    return g


def kerben_rand(g, xs, rand, tief, breit, von_oben=True):
    """Senkrechte Kerben in einen gebogenen Rand: rand(x) gibt die Höhe des Rands bei x."""
    for x in xs:
        y = rand(x); s = 1 if von_oben else -1
        g = g.difference(L([(x, y + s*5), (x, y - s*tief)], breit))
    return g


def punkt(x, y, r=1.6): return kreislinie(x, y, r)
def punkte(pkt, r=1.6): return [kreislinie(x, y, r) for x, y in pkt]
def strich(a, b): return LineString([a, b])


def gitter(x0, y0, x1, y1, nx, ny, rand=False):
    """Gitterlinien in einem Rechteck: nx Spalten, ny Zeilen (ohne Aussenkanten, ausser rand=True)."""
    xs = np.linspace(x0, x1, nx + 1); ys = np.linspace(y0, y1, ny + 1)
    if not rand: xs, ys = xs[1:-1], ys[1:-1]
    return [strich((x, y0), (x, y1)) for x in xs] + [strich((x0, y), (x1, y)) for y in ys]


def kreis_punkte(n, r, start=90, x=0, y=0):
    return [(x + r*np.cos(a), y + r*np.sin(a)) for a in np.radians(start + 360*np.arange(n)/n)]


def rand_punkte(linie, n=None, abstand=None):
    """n Punkte gleichmässig auf einer Linie (LineString oder Ring), oder alle «abstand» Einheiten."""
    l = linie if isinstance(linie, LineString) else LineString(linie.coords)
    if n is None: n = max(3, int(round(l.length/abstand)))
    geschlossen = l.is_ring
    ts = np.linspace(0, l.length, n, endpoint=not geschlossen)
    return [tuple(l.interpolate(t).coords[0]) for t in ts]


def innen_punkte(g, abstand, rand=6, versetzt=False, r=1.6):
    """Punktraster innerhalb der Form (rand Einheiten vom Rand weg); versetzt = jede zweite Reihe halb verschoben."""
    innen = g.buffer(-rand); x0, y0, x1, y1 = innen.bounds
    pts = []
    for j, y in enumerate(np.arange(y0, y1 + 1e-6, abstand*(np.sqrt(3)/2 if versetzt else 1))):
        dx = abstand/2 if versetzt and j % 2 else 0
        for x in np.arange(x0 + dx, x1 + 1e-6, abstand):
            if innen.contains(Point(x, y)): pts.append((x, y))
    cx, cy = (x0 + x1)/2 - np.mean([p[0] for p in pts]), (y0 + y1)/2 - np.mean([p[1] for p in pts])
    return punkte([(x + cx, y + cy) for x, y in pts], r)


def spirale(windungen, r_aussen, r_innen=3, n=500):
    t = np.linspace(0, 1, n); a = 2*np.pi*windungen*t
    r = r_innen + (r_aussen - r_innen)*t
    return LineString(list(zip(r*np.cos(a), r*np.sin(a))))


def lasche(a, b, t=5, ecke=4):
    """Klebelasche an der Kante a→b; die Lasche liegt links der Richtung (Form im Uhrzeigersinn umlaufen)."""
    a, b = np.array(a, float), np.array(b, float)
    d = (b - a)/np.hypot(*(b - a)); n = np.array([-d[1], d[0]])
    return P([tuple(a), tuple(b), tuple(b - ecke*d + t*n), tuple(a + ecke*d + t*n)])


def rundbox(x0, y0, x1, y1, r):
    return box(x0 + r, y0 + r, x1 - r, y1 - r).buffer(r, 32)
