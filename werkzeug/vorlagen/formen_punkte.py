"""Fadengrafik mit nummerierten Punkten (Werkhilfen): jeder Punkt trägt seine Zahl, so lässt sich eine Anleitung
«1 nach 13, 2 nach 14 …» ohne Zählen nachstechen. Dazu Winkel (Parabel) und Einmaleins-Kreis."""
from zeichnen import *
from hilfen import *
from formen_schrift import schrift


def herzform():
    return glatt(U(C(-24, 14, 30), C(24, 14, 30), P([(-50, 0), (50, 0), (0, -56)])), 3)


def nummern(pts, h=3.6, zentrum=(0, 0), abstand=5, start=1):
    """Zahl neben jedem Punkt, ein Stück zur Mitte hin."""
    det = []
    for k, (x, y) in enumerate(pts):
        dx, dy = zentrum[0] - x, zentrum[1] - y; l = np.hypot(dx, dy) or 1
        det += schrift(str(k + start), x + dx/l*abstand, y + dy/l*abstand, h)
    return det


def fadengrafik_nr(g, n, rand=6, h=3.6):
    pts = rand_punkte(g.buffer(-rand).exterior, n)
    return g, punkte(pts, 1.4) + nummern(pts, h, (g.centroid.x, g.centroid.y))


def winkel(n=12):
    """Parabel aus Geraden: zwei Schenkel mit je n Punkten, gleiche Zahlen verbinden."""
    s = (92 - 12)/(n - 1)
    unten = [(12 + k*s, 10) for k in range(n)]                                 # 1 bis n von links nach rechts
    links = [(10, 92 - k*s) for k in range(n)]                                 # 1 bis n von oben nach unten
    det = punkte(unten + links, 1.4) + [strich((10, 10), (10, 96)), strich((10, 10), (96, 10))]
    det += [l for k, (x, y) in enumerate(unten) for l in schrift(str(k + 1), x, 4.5, 3.4)]
    det += [l for k, (x, y) in enumerate(links) for l in schrift(str(k + 1), 4.5, y, 3.4)]
    return box(0, 0, 100, 100), det


def einmaleins():
    """Einmaleins-Kreis: 10 Punkte 0 bis 9, die Einerstellen einer Reihe verbinden gibt einen Stern."""
    pts = kreis_punkte(10, 36, 90)[::-1]                                       # im Uhrzeigersinn, 0 oben
    pts = pts[-1:] + pts[:-1]
    det = punkte(pts, 1.6) + [l for k, (x, y) in enumerate(pts) for l in schrift(str(k), x*45/36, y*45/36, 5)]
    return C(0, 0, 50), det


W = 'Werkhilfen'
FORMEN = [
    ('fadengrafik-kreis-24-nr', 'Fadengrafik Kreis 24 nummeriert', W, fadengrafik_nr(C(0, 0, 50), 24), 12),
    ('fadengrafik-kreis-36-nr', 'Fadengrafik Kreis 36 nummeriert', W, fadengrafik_nr(C(0, 0, 50), 36, h=3), 15),
    ('fadengrafik-quadrat-nr', 'Fadengrafik Quadrat nummeriert', W, fadengrafik_nr(box(-50, -50, 50, 50), 32), 12),
    ('fadengrafik-dreieck-nr', 'Fadengrafik Dreieck nummeriert', W, fadengrafik_nr(P(vieleck(3, 56)), 24), 12),
    ('fadengrafik-herz-nr', 'Fadengrafik Herz nummeriert', W, fadengrafik_nr(herzform(), 30), 12),
    ('fadengrafik-stern-nr', 'Fadengrafik Stern nummeriert', W, fadengrafik_nr(weich(P(stern(5, 50, 28)), 2), 30, 5, 3), 14),
    ('fadengrafik-winkel', 'Fadengrafik Winkel (Parabel)', W, winkel(), 12),
    ('einmaleins-kreis', 'Einmaleins-Kreis', W, einmaleins(), 12),
]
