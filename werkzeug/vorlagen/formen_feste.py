"""Formen der Gruppe «Feste»: Jahreskreis in der Schule (Advent, Weihnachten, Fasnacht, Ostern, Herbst, Geburtstag).
Alles eigene Zeichnungen aus den Bausteinen in zeichnen.py."""
from zeichnen import *


def _sym(halb):
    """Rechte Hälfte (x >= 0) als Punktliste von oben nach unten → symmetrisches Vieleck."""
    return P(list(halb) + [(-x, y) for x, y in reversed(halb)])


def _kurve(pkt, n=16):
    """Geschlossene, weiche Kurve (Catmull-Rom) durch die Punkte."""
    p = np.array(pkt, float); m = len(p); t = np.linspace(0, 1, n, endpoint=False)[:, None]; aus = []
    for i in range(m):
        p0, p1, p2, p3 = p[i - 1], p[i], p[(i + 1) % m], p[(i + 2) % m]
        aus.append(0.5*((2*p1) + (-p0 + p2)*t + (2*p0 - 5*p1 + 4*p2 - p3)*t**2 + (-p0 + 3*p1 - 3*p2 + p3)*t**3))
    return P(np.vstack(aus)).buffer(0)


def engel():
    """Kleid als Glocke, grosse Flügel seitlich ab der Schulter mit drei Federbögen, Heiligenschein als Linie."""
    s = np.linspace(0, 1, 30)
    rechts = list(zip(8 + 26*s**1.8, 20 - 68*s))
    unten = [(30*np.sin(a), -48 - 3*np.cos(a)) for a in np.linspace(1.35, -1.35, 21)]
    kleid = weich(P([(0, 20)] + rechts + unten + [(-x, y) for x, y in reversed(rechts)]), 3)
    fl = _kurve([(6, 8), (22, 14), (40, 22), (54, 30), (57, 18), (50, 4), (40, -6), (26, -14), (10, -14)], 12)
    fl = U(fl, C(51, 11, 7), C(39, -3, 7.5), C(25, -11, 7))
    k = U(kleid, fl, spiegel_x(fl), C(0, 34, 13), box(-6, 16, 6, 24))
    return glatt(k, 4), [LineString(E(0, 43, 9, 2.5).exterior.coords), kreislinie(-4.5, 35, 1.8), kreislinie(4.5, 35, 1.8),
                         LineString(bogen(0, 33, 5, 220, 320))]


def kerze():
    k = U(box(-17, -50, 17, 22).buffer(2), box(-6, 20, 6, 30), hull(C(0, 36, 12), Point(0, 66)))
    tropf = [(-17, 16), (-12, 14), (-10, 4), (-8, 2), (-6, 4), (-4, 14), (4, 16), (17, 16)]
    return glatt(k, 3), [LineString(tropf), LineString(hull(C(0, 37, 5), Point(0, 54)).exterior.coords)]


def geschenk():
    fl = [E(-20, 48, 17, 12, 36), E(20, 48, 17, 12, -36)]
    k = U(box(-38, -48, 38, 12), box(-44, 8, 44, 26).buffer(2), *fl, C(0, 38, 10), box(-7, 26, 7, 36))
    return glatt(k, 3), [LineString([(-6, -48), (-6, 8)]), LineString([(6, -48), (6, 8)]), LineString([(-46, 10), (46, 10)]),
                         E(-22, 50, 8, 4, 36).exterior, E(22, 50, 8, 4, -36).exterior]


def christbaumkugel():
    k = U(C(0, -8, 42), box(-12, 30, 12, 44).buffer(2), C(0, 50, 7))
    innen = C(0, -8, 41)
    return glatt(k, 3), [LineString(bogen(0, 40, 64, 232, 308)).intersection(innen), LineString(bogen(0, 34, 72, 238, 302)).intersection(innen),
                         LineString([(-12, 38), (12, 38)])]


def lebkuchenmann():
    rumpf = box(-16, -24, 16, 16).buffer(6)
    k = U(C(0, 40, 17), box(-9, 14, 9, 30), rumpf,
          L([(-14, 10), (-40, 2)], 17), L([(14, 10), (40, 2)], 17),
          L([(-10, -24), (-20, -50)], 18), L([(10, -24), (20, -50)], 18))
    return glatt(k, 6), [kreislinie(-6, 44, 2.5), kreislinie(6, 44, 2.5), LineString(bogen(0, 40, 8, 210, 330)),
                         kreislinie(0, 8, 2.5), kreislinie(0, -4, 2.5), kreislinie(0, -16, 2.5)]


def stiefel():
    bein = box(-30, -40, 8, 30)
    fuss = hull(box(-30, -52, -20, -30), E(22, -38, 22, 14))
    k = weich(glatt(U(bein, fuss), 10), 4)
    pelz = box(-38, 28, 16, 50).buffer(5)
    return glatt(U(k, pelz), 3), [LineString([(-30, -44), (42, -44)])]


def zuckerstange():
    weg = [(14, -52), (14, 22)] + bogen(-4, 22, 18, 0, 180, 30)[1:] + [(-22, 14)]
    g = L(weg, 16)
    streifen = [LineString([(-40, y), (40, y + 24)]).intersection(g) for y in range(-70, 60, 16)]
    return g, [s for s in streifen if not s.is_empty]


def glocke():
    halb = [(0, 48), (12, 47), (21, 42), (25, 32), (27, 16), (30, 0), (35, -14), (42, -26), (48, -32), (48, -40), (0, -40)]
    k = U(weich(_sym(halb), 3), C(0, -44, 10), L([(0, 46), (0, 56)], 10))
    return glatt(k, 3), [LineString([(-40, -30), (40, -30)]), LineString(bogen(0, 58, 70, 245, 295))]


def osterhase():
    k = U(E(-4, -14, 36, 32), C(26, 18, 19), E(10, 50, 9, 21, 28), E(36, 48, 9, 20, -22),
          C(-40, -16, 11), E(20, -44, 22, 7))
    return glatt(k, 5), [kreislinie(32, 22, 2.5), LineString(bogen(-12, -16, 22, 100, 300)), E(10, 50, 3.5, 14, 28).exterior]


def kueken():
    k = U(C(-4, -12, 32), C(16, 22, 20), weich(P([(32, 28), (48, 22), (32, 16)]), 1.5),
          E(-30, -4, 14, 9, 30), L([(-14, -38), (-14, -48)], 10), L([(14, -38), (14, -48)], 10),
          E(-12, -50, 11, 6), E(18, -50, 11, 6), L([(14, 38), (13, 47), (19, 53)], 9))
    return glatt(k, 4), [kreislinie(22, 26, 2.5), LineString(bogen(-14, 0, 20, 190, 300))]


def laterne():
    haken = L([(0, 28), (0, 50)] + bogen(10, 50, 10, 180, 0, 20), 8)
    k = U(E(0, -6, 46, 30), box(-24, 18, 24, 28).buffer(2), box(-24, -42, 24, -32).buffer(2), haken)
    innen = E(0, -6, 45, 29)
    return glatt(k, 4), [LineString([(-24, 20), (24, 20)]), LineString([(-24, -32), (24, -32)]),
                         *[LineString([(-50, y), (50, y)]).intersection(innen) for y in (-18, -6, 6)]]


def kuerbis():
    lappen = [E(x, 0, 19, ry) for x, ry in ((-32, 25), (-16, 32), (0, 35), (16, 32), (32, 25))]
    k = U(*lappen, L([(0, 30), (1, 42), (9, 50)], 11))
    return glatt(k, 3), [LineString(bogen(x0, 0, r, a - w, a + w)) for x0, r, a, w in
                         ((-62, 52, 0, 34), (62, 52, 180, 34), (-130, 128, 0, 15), (130, 128, 180, 15))]


def maske():
    """Augenmaske mit geschwungenen Spitzen seitlich oben, Nasenbogen und Stab; Augen nur als Linien."""
    halb = [(0, 13), (9, 16), (21, 18), (33, 16), (44, 21), (53, 31), (58, 40), (60, 30), (56, 16), (48, 2),
            (38, -8), (26, -11), (15, -7), (7, -1), (0, 1)]
    k = glatt(weich(_kurve((halb + [(-x, y) for x, y in reversed(halb)])[:-1], 12), 2), 4)
    k = glatt(U(k, L([(36, -6), (46, -44)], 11)), 4)
    auge = _kurve([(8, 4), (16, 9), (27, 10), (35, 9), (28, -1), (16, -1)], 8)
    return k, [LineString(auge.exterior.coords), LineString(spiegel_x(auge).exterior.coords)]


# eigene Ideen
def torte():
    k = U(box(-44, -46, 44, -4).buffer(3), box(-34, -4, 34, 18).buffer(3),
          *[box(x - 5, 18, x + 5, 35) for x in (-22, 0, 22)],
          *[hull(C(x, 40, 7), Point(x, 56)) for x in (-22, 0, 22)])
    return glatt(k, 2.5), [LineString(list(zip(np.linspace(-46, 46, 40), -20 + 4*np.sin(np.linspace(0, 6*np.pi, 40))))),
                           LineString([(-36, 4), (36, 4)])]


def krone():
    halb = [(0, 32), (5, 32), (20, 4), (34, 30), (46, 30), (46, -30), (0, -30)]
    k = U(weich(_sym(halb), 2), *[C(x, y, 9) for x, y in ((0, 38), (-41, 36), (41, 36))])
    return glatt(k, 4), [LineString([(-45, -14), (45, -14)]), kreislinie(0, -22, 4), kreislinie(-24, -22, 3), kreislinie(24, -22, 3)]


FORMEN = [
    ('engel', 'Engel', 'Feste', engel()),
    ('kerze', 'Kerze', 'Feste', kerze()),
    ('geschenk', 'Geschenk', 'Feste', geschenk()),
    ('christbaumkugel', 'Christbaumkugel', 'Feste', christbaumkugel()),
    ('lebkuchenmann', 'Lebkuchenmann', 'Feste', lebkuchenmann()),
    ('stiefel', 'Samichlaus-Stiefel', 'Feste', stiefel()),
    ('zuckerstange', 'Zuckerstange', 'Feste', zuckerstange()),
    ('glocke', 'Glocke', 'Feste', glocke()),
    ('osterhase', 'Osterhase', 'Feste', osterhase()),
    ('kueken', 'Küken', 'Feste', kueken()),
    ('laterne', 'Laterne', 'Feste', laterne()),
    ('kuerbis', 'Kürbis', 'Feste', kuerbis()),
    ('maske', 'Fasnachtsmaske', 'Feste', maske()),
    ('torte', 'Geburtstagstorte', 'Feste', torte()),
    ('krone', 'Krone', 'Feste', krone()),
]
