"""Tiere aus Garten, Wasser, Zoo und Fantasie – eigene Zeichnungen aus den Bausteinen in zeichnen.py."""
from zeichnen import *


def _sanft(pkt, n=3):
    """Glättet eine Punktreihe (Chaikin), Endpunkte bleiben."""
    p = np.asarray(pkt, float)
    for _ in range(n):
        q = [p[0]]
        for a, b in zip(p[:-1], p[1:]): q += [0.75*a + 0.25*b, 0.25*a + 0.75*b]
        q.append(p[-1]); p = np.array(q)
    return p


def rohr(pkt, r0, r1, n=3):
    """Strich, der von Radius r0 auf r1 dünner wird (für Schwänze, Arme, Hälse)."""
    p = _sanft(pkt, n); r = np.linspace(r0, r1, len(p))
    k = [C(x, y, ri) for (x, y), ri in zip(p, r)]
    return U(*[hull(a, b) for a, b in zip(k, k[1:])])


def sym(g):
    """Linke Hälfte bauen, mit Spiegelbild vereinigen."""
    return U(g, spiegel_x(g))


def oben(g, x):
    """Höchster Punkt der Form bei x."""
    return g.intersection(LineString([(x, -200), (x, 200)])).bounds[3]


def innen(g, linie, d=1.5):
    return g.buffer(-d).intersection(linie)


def marienkaefer():
    k = U(E(0, -6, 34, 40), C(0, 30, 17), L([(-7, 42), (-14, 56)], 11), C(-15, 58, 7))   # ohne Beine: leichter zu schneiden
    k = glatt(sym(k), 4)
    schale = E(0, -6, 34, 40)
    det = [LineString(np.asarray(schale.exterior.coords)[(np.asarray(schale.exterior.coords)[:, 1] > 22)]),
           LineString([(0, 33), (0, -44)])]
    det += [kreislinie(x, y, r) for x, y, r in ((-15, 12, 6), (15, 12, 6), (-19, -16, 6.5), (19, -16, 6.5), (-11, -34, 5), (11, -34, 5))]
    det += [kreislinie(-7, 38, 2.5), kreislinie(7, 38, 2.5)]
    return k, det


def raupe():
    xs = np.linspace(-52, 22, 5)
    teile = [C(x, 7*np.sin(i*1.2 + 0.3), 15) for i, x in enumerate(xs)]
    k = U(*teile, C(44, 10, 19), L([(37, 24), (31, 42)], 13), C(30, 44, 7.5), L([(51, 24), (57, 42)], 13), C(58, 44, 7.5))
    k = glatt(k, 4)
    det = [kreislinie(52, 14, 3), LineString(bogen(48, 8, 8, 220, 310, 10))]
    return k, det


def frosch():
    """Sitzend von vorn: breiter Kopf mit Glupschaugen oben, breites Maul, Schenkel und Füsse gespreizt."""
    links = U(E(0, 14, 40, 18), C(-20, 32, 13), E(0, -6, 26, 22),
              E(-30, -20, 16, 15, 25), E(-53, -40, 14, 7, 8),
              L([(-12, -12), (-16, -37)], 12), E(-16, -40, 7.5, 6))
    k = glatt(sym(links), 6)
    det = [kreislinie(-20, 34, 6), kreislinie(20, 34, 6), LineString(bogen(0, 34, 34, 230, 310, 20)),
           LineString(bogen(-30, -20, 12, 110, 250, 14)), LineString(bogen(30, -20, 12, -70, 70, 14))]
    return k, det


def schildkroete():
    panzer = E(0, 0, 40, 30).intersection(box(-50, -4, 50, 40))
    k = U(panzer, L([(-42, -6), (42, -6)], 10), L([(36, -4), (48, 2)], 14), C(54, 6, 12),
          box(-32, -28, -18, -8).buffer(3), box(16, -28, 30, -8).buffer(3), weich(P([(-42, -2), (-58, -10), (-42, -12)]), 2))
    k = glatt(k, 3)
    det = [LineString([(-39, -1), (39, -1)]),
           LineString([(-12, -1), (-16, 12), (-8, 24), (8, 24), (16, 12), (12, -1)]),
           LineString([(-16, 12), (-35, 12)]), LineString([(16, 12), (35, 12)]),
           LineString([(-8, 24), (-14, 28)]), LineString([(8, 24), (14, 28)]),
           kreislinie(58, 10, 2.5)]
    return k, det


def krokodil():
    grund = U(E(-4, 0, 30, 13), rohr([(-26, 0), (-44, -2), (-58, 2), (-68, 8)], 12, 6),
              weich(P([(14, 10), (14, -12), (58, -9), (62, -3), (58, 2), (30, 7)]), 3.5), C(24, 10, 8.5))
    zacken = [hull(C(x, oben(grund, x) - 3, 8), C(x, oben(grund, x) + h, 5.5))
              for x, h in ((-48, 6), (-32, 8), (-16, 9), (0, 9))]
    beine = [L([(-23, -6), (-32, -24)], 15), L([(-12, -6), (-5, -24)], 15),
             L([(1, -6), (-6, -24)], 15), L([(12, -6), (19, -24)], 15)]
    k = glatt(U(grund, *zacken, *beine), 3.5)
    zz = [(28 + 3*i, -3 if i % 2 else -0.5) for i in range(10)]
    return k, [kreislinie(25, 12, 2.5), LineString(zz)]


def dino():
    beine = []
    for x in (-24, 12):
        beine += [E(x, -16, 14, 14), L([(x, -20), (x - 1, -34)], 15), E(x + 4, -36, 13, 7.5)]
    k = U(E(-4, 2, 34, 22), rohr([(16, 8), (30, 22), (36, 40), (40, 54)], 14, 7.5),
          E(47, 57, 13, 8.5, 10), rohr([(-24, 6), (-46, 0), (-66, -6), (-86, -6)], 18, 4.5), *beine)
    k = glatt(k, 4)
    return k, [kreislinie(50, 60, 2.2), LineString(bogen(49, 56, 8, 270, 330, 8))]


def giraffe():
    block = lambda x: weich(hull(E(x, -4, 11, 8), box(x - 9, -46, x + 9, -40)), 3)   # je Beinpaar ein Block
    k = U(E(-6, 0, 28, 15), block(-22), block(10),
          rohr([(10, 6), (22, 28), (30, 50)], 11, 9), hull(C(35, 56, 11), C(54, 49, 7.5)),
          L([(29, 62), (24, 74)], 12), C(24, 75, 7.5), L([(41, 61), (46, 72)], 12), C(46, 73, 7.5),
          E(21, 53, 8, 5.5, 15),
          rohr([(-32, 6), (-38, -6), (-40, -16)], 6, 5.5), E(-40, -21, 7, 8, 5))
    k = glatt(k, 4)
    det = [LineString(E(x, y, a, b, w).exterior.coords) for x, y, a, b, w in
           ((-20, 4, 6, 4, 10), (-6, -4, 6, 4, -10), (6, 6, 5, 4, 20), (-22, -6, 4, 3, 0), (18, 22, 4, 3, 60), (25, 38, 3.5, 2.5, 60))]
    det += [kreislinie(42, 56, 2.4)]
    return k, det


def pinguin():
    links = U(E(0, -10, 27, 34), C(0, 26, 19), L([(-22, 10), (-36, -24)], 13), E(-13, -44, 14, 7))
    k = glatt(sym(links), 5)
    det = [LineString(U(E(0, -12, 18, 26), C(-7, 20, 9), C(7, 20, 9)).exterior.coords),
           kreislinie(-7, 30, 2.5), kreislinie(7, 30, 2.5), LineString([(-4, 24), (0, 18), (4, 24), (-4, 24)])]
    return k, det


def delfin():
    mx, my, rr = 0, -24, 46
    w = np.linspace(168, 22, 40)
    pkt = [(mx + rr*np.cos(np.radians(a)), my + rr*np.sin(np.radians(a))) for a in w]
    dicke = np.interp(w, [22, 50, 90, 125, 145, 156, 160, 168], [5, 10, 15, 15, 12, 6, 4.5, 4.5])
    teile = [C(x, y, r) for (x, y), r in zip(pkt, dicke)]
    leib = U(*[hull(a, b) for a, b in zip(teile, teile[1:])])
    ex, ey = pkt[-1]
    fluke = [E(ex + 9*np.cos(np.radians(a)), ey + 9*np.sin(np.radians(a)), 11, 4.5, a) for a in (-68 + 48, -68 - 48)]
    k = U(leib, C(-34, 4, 12), weich(P([(-6, 34), (14, 34), (24, 48), (12, 46)]), 2),
          E(-15, -7, 10, 4.5, -55), *fluke)
    k = glatt(k, 3)
    return k, [kreislinie(-34, 8, 2.5), LineString([(-46, -6), (-37, -1)])]


def krake():
    teile = [E(0, 30, 30, 30)]
    for w in np.linspace(-172, -8, 8):
        pkt = []
        for t in np.linspace(0, 1, 9):
            r = 14 + 46*t; a = np.radians(w + (w + 90)*0.4*t**2)
            pkt.append((r*np.cos(a), 6 + r*np.sin(a)))
        teile.append(rohr(pkt, 10, 7, 2))
    k = glatt(U(*teile), 3)
    det = [kreislinie(-10, 32, 4), kreislinie(10, 32, 4), LineString(bogen(0, 24, 6, 210, 330, 10))]
    return k, det


def qualle():
    glocke = E(0, 24, 46, 34).intersection(box(-50, 10, 50, 60))
    rand = [C(x, 10, 8) for x in (-40, -34, -12, 12, 34, 40)]
    tent = []
    for x0 in (-27, 0, 27):
        y = np.linspace(8, -42, 20); s = (8 - y)/50
        x = x0*(1 + 0.3*s) + 5*s*np.sin(y*0.15)
        tent.append(L(list(zip(x, y)), 16))
    k = glatt(U(glocke, *rand, *tent), 4)
    return k, [kreislinie(-12, 30, 3), kreislinie(12, 30, 3), LineString(bogen(0, 26, 6, 210, 330, 10))]


def seestern():
    t = np.radians(np.arange(0, 360, 0.5))
    f = ((1 + np.cos(5*(t - np.pi/2)))/2)**1.3
    r = 22 + 30*f
    k = weich(P(list(zip(r*np.cos(t), r*np.sin(t)))), 4)
    det = [kreislinie(rr*np.cos(a), rr*np.sin(a), 2.2) for a in np.radians(np.arange(5)*72 + 90) for rr in (20, 30, 40)]
    det += [kreislinie(0, 0, 2.5)]
    return k, det


def tatzenbein(x0, x1, oben, unten, r=4):
    """Breites Bein für ein Beinpaar mit runder Tatze."""
    return U(box(x0 + r, unten + r, x1 - r, oben).buffer(r, 32), E((x0 + x1)/2 + 2, unten + 3, (x1 - x0)/2 + 3, 6))


def loewe():
    """Grosse Mähne, das Gesicht sitzt als Zeichnung mitten in der Mähne; breite Beinpaare, Schwanz mit Quaste."""
    m = (24, 18)
    maehne = glatt(U(C(*m, 25), *[C(m[0] + 23*np.cos(a), m[1] + 23*np.sin(a), 12) for a in np.radians(np.arange(8)*45 + 90)]), 6)
    beine = [tatzenbein(-36, -18, -4, -38), tatzenbein(4, 22, -4, -38)]   # je Paar ein breites Bein
    k = U(maehne, E(-8, -6, 32, 15), *beine,
          rohr([(-38, -2), (-52, 0), (-60, 10), (-62, 22)], 7, 6.5), E(-62, 27, 8.5, 10.5))
    k = glatt(k, 5)
    x, y = m
    det = [kreislinie(x, y, 19), kreislinie(x - 7, y + 5, 2.5), kreislinie(x + 7, y + 5, 2.5),
           LineString([(x - 4, y - 1), (x + 4, y - 1), (x, y - 5), (x - 4, y - 1)]),
           LineString(bogen(x - 4, y - 5, 4, 200, 340, 8)), LineString(bogen(x + 4, y - 5, 4, 200, 340, 8))]
    return k, det


def einhorn():
    kopf = hull(C(-4, 22, 18), C(24, -2, 11))
    hals = hull(C(-6, 12, 17), box(-32, -46, 10, -42))
    ohr = weich(P([(-14, 34), (-2, 38), (-12, 56)]), 2)
    horn = hull(C(4, 38, 9), C(27, 68, 5))
    maehne = [C(x, y, 11) for x, y in ((-20, 32), (-28, 14), (-34, -6), (-40, -26), (-44, -42))]
    k = glatt(U(kopf, hals, ohr, horn, *maehne), 6)
    k = k.intersection(box(-60, -44, 60, 90))
    det = [kreislinie(4, 20, 3), kreislinie(28, 0, 2), LineString([(18, -10), (30, -9)]),
           innen(horn, LineString([(4, 50), (18, 42)])), innen(horn, LineString([(10, 59), (23, 52)])),
           LineString(bogen(-4, 22, 26, 150, 250, 16))]
    return k, det


FORMEN = [
    ('marienkaefer', 'Marienkäfer', 'Tiere', marienkaefer()),
    ('raupe', 'Raupe', 'Tiere', raupe()),
    ('frosch', 'Frosch', 'Tiere', frosch()),
    ('schildkroete', 'Schildkröte', 'Tiere', schildkroete()),
    ('krokodil', 'Krokodil', 'Tiere', krokodil()),
    ('dino', 'Dino', 'Tiere', dino()),
    ('giraffe', 'Giraffe', 'Tiere', giraffe()),
    ('pinguin', 'Pinguin', 'Tiere', pinguin()),
    ('delfin', 'Delfin', 'Tiere', delfin()),
    ('krake', 'Krake', 'Tiere', krake()),
    ('qualle', 'Qualle', 'Tiere', qualle()),
    ('seestern', 'Seestern', 'Tiere', seestern()),
    ('loewe', 'Löwe', 'Tiere', loewe()),
    ('einhorn', 'Einhorn-Kopf', 'Tiere', einhorn()),
]
