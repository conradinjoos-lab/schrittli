"""Weitere Formen für den Vorlagen-Generator: Grundformen und Natur. Alles eigene Zeichnungen aus den Bausteinen."""
from zeichnen import *


def _sym(g):
    """Rechte Hälfte (x >= 0) zur symmetrischen Form ergänzen."""
    return U(g, spiegel_x(g)).buffer(0.01)


def _polar(f, n=360):
    a = np.linspace(0, 2*np.pi, n, endpoint=False)
    return P([(f(t)[0], f(t)[1]) for t in a])


def _kurve(pkt, n=16):
    """Geschlossene, weiche Kurve (Catmull-Rom) durch die Punkte."""
    p = np.array(pkt, float); m = len(p); t = np.linspace(0, 1, n, endpoint=False)[:, None]; aus = []
    for i in range(m):
        p0, p1, p2, p3 = p[i - 1], p[i], p[(i + 1) % m], p[(i + 2) % m]
        aus.append(0.5*((2*p1) + (-p0 + p2)*t + (2*p0 - 5*p1 + 4*p2 - p3)*t**2 + (-p0 + 3*p1 - 3*p2 + p3)*t**3))
    return P(np.vstack(aus)).buffer(0)


# ---------- Grundformen ----------

def halbkreis():
    return affinity.translate(C(0, 0, 50).intersection(box(-51, 0, 51, 51)), 0, -25)


def raute():
    return P([(0, 55), (38, 0), (0, -55), (-38, 0)])


def trapez():
    return P([(-50, -28), (50, -28), (28, 28), (-28, 28)])


def kreuz():
    k = U(box(-16, -50, 16, 50), box(-50, -16, 50, 16))
    return glatt(weich(k, 5), 3)


def pfeil():
    k = U(box(-50, -12, 8, 12), P([(4, -36), (52, 0), (4, 36)]))
    return glatt(weich(k, 1.5), 3)


def blitz():
    k = P([(-4, 56), (-28, -2), (-6, -2)] + bogen(-14, -50, 5, 172, 318, 12) + [(28, 14), (6, 14), (26, 56)])
    return glatt(weich(k, 1), 2)


def sprechblase():
    k = U(E(0, 10, 50, 34), P([(-26, -8), (-38, -46), (2, -20)]))
    return glatt(weich(k, 1.5), 5)


def schild():
    c, r = 17.8, 57.8
    unten = C(c, 0, r).intersection(C(-c, 0, r)).intersection(box(-40, -60, 40, 0))
    k = weich(U(unten, box(-40, -0.5, 40, 44)).buffer(0.01), 3)
    return k, [k.buffer(-7).exterior]


def rosette():
    return glatt(U(C(0, 0, 32), *[C(37*np.cos(a), 37*np.sin(a), 15) for a in np.radians(np.arange(8)*45 + 22.5)]), 3)


# ---------- Natur ----------

def sonne():
    def strahl(a):
        b = 16
        fuss = P([(27*np.cos(np.radians(a + s)), 27*np.sin(np.radians(a + s))) for s in (-b, b)] + [(0, 0)])
        return hull(fuss, C(52*np.cos(np.radians(a)), 52*np.sin(np.radians(a)), 4.5))
    k = glatt(U(C(0, 0, 31), *[strahl(a) for a in np.arange(8)*45 + 22.5]), 3)
    return k, [kreislinie(-10, 7, 3), kreislinie(10, 7, 3), LineString(bogen(0, 2, 14, 215, 325, 16))]


def regenbogen():
    k = C(0, 0, 50).difference(C(0, 0, 22)).intersection(box(-51, 0, 51, 51))
    k = affinity.translate(k, 0, -25)
    return k, [LineString(bogen(0, -25, 31.5, 0, 180, 48)), LineString(bogen(0, -25, 40.5, 0, 180, 48))]


def schneeflocke():
    """6 kräftige Arme mit je einem Paar kurzer, dicker Seitenäste (runde Enden)."""
    teile = [C(0, 0, 12)]
    s, c = np.sin(np.radians(38)), np.cos(np.radians(38))
    for a in np.arange(6)*60:
        arm = U(L([(0, 0), (0, 56)], 13),
                L([(0, 33), (19*s, 33 + 19*c)], 13),
                L([(0, 33), (-19*s, 33 + 19*c)], 13))
        teile.append(R(arm, a))
    return glatt(U(*teile), 4)


def laubbaum():
    krone = U(C(0, 22, 32), C(-26, 8, 20), C(26, 8, 20), C(-18, 40, 20), C(18, 40, 20), C(0, 50, 18))
    stamm = U(box(-9, -50, 9, 0), P([(-20, -50), (20, -50), (9, -38), (-9, -38)]))
    return glatt(U(krone, stamm), 4)


def ahornblatt():
    """5 Lappen mit Spitze, nur wenige grosse Zacken, dicker Stiel."""
    halb = P([(0, 58), (9, 41), (19, 46), (15, 25), (31, 40), (54, 33), (41, 20), (48, 12), (24, 3),
              (40, -18), (19, -13), (7, -9), (0, -12)])
    k = glatt(weich(_sym(halb), 2.5), 4)
    adern = [LineString([(0, -6), (0, 46)]), LineString([(0, -6), (42, 28)]), LineString([(0, -6), (-42, 28)]),
             LineString([(0, -6), (30, -12)]), LineString([(0, -6), (-30, -12)])]
    stiel = L([(0, -6), (3, -46)], 11)
    return glatt(U(k, stiel), 4), adern


def _linse(a, b):
    """Spitzes Blatt (Linse) mit halber Breite a und halber Höhe b."""
    r = (a*a + b*b)/(2*a); return C(-(r - a), 0, r).intersection(C(r - a, 0, r))


def tulpe():
    mitte = affinity.translate(_linse(15, 30), 0, 30)
    links = affinity.translate(R(_linse(13, 27), 16), -12, 27)
    rechts = affinity.translate(R(_linse(13, 27), -16), 12, 27)
    kelch = U(E(0, 18, 24, 22).intersection(box(-30, -10, 30, 26)), mitte, links, rechts)
    stiel = L([(0, 4), (0, -51)], 10)
    t = np.linspace(0, 1, 60)[:, None]
    p0, p1, p2 = np.array([-2, -46]), np.array([-28, -38]), np.array([-30, 2])
    mitte = (1 - t)**2*p0 + 2*t*(1 - t)*p1 + t*t*p2
    rtg = 2*(1 - t)*(p1 - p0) + 2*t*(p2 - p1)
    nrm = np.c_[-rtg[:, 1], rtg[:, 0]]/np.linalg.norm(rtg, axis=1)[:, None]
    w = (5 + 6*np.sin(np.pi*t**0.8))*(1 - t**4) + 1.5
    blatt = weich(P(np.r_[mitte + w*nrm, (mitte - w*nrm)[::-1]]), 1.5)
    unten = glatt(U(stiel, blatt), 5)
    return glatt(U(kelch, unten), 3), [LineString([(-8, 12), (-4, 42)]), LineString([(8, 12), (4, 42)])]


def kaktus():
    stamm = L([(0, -30), (0, 44)], 26)
    links = L([(-10, -8), (-38, -8), (-38, 24)], 15)
    rechts = L([(10, 6), (36, 6), (36, 32)], 15)
    k = glatt(U(stamm, links, rechts, box(-13, -54, 13, -30)), 5)
    return k, [LineString([(-5, -46), (-5, 40)]), LineString([(5, -46), (5, 40)])]


def eichel():
    nuss = U(E(0, -14, 23, 27), hull(C(0, -32, 9), C(0, -47, 3.5)))
    kappe = weich(E(0, 2, 33, 18).intersection(box(-40, -5, 40, 30)), 3)
    k = glatt(U(nuss, kappe, L([(0, 16), (3, 30)], 10)), 3)
    return k, [LineString(bogen(0, -20, 26, 60, 120, 16))]


def kastanie():
    """Glänzende Rosskastanie: rundlich, oben leicht spitz, unten flacher, leicht schräg; heller Nabelfleck als Linie."""
    nuss = _kurve([(0, 47), (9, 40), (27, 31), (40, 12), (40, -10), (28, -28), (0, -34),
                   (-28, -28), (-40, -10), (-40, 12), (-27, 31), (-9, 40)])
    nabel = _kurve([(0, -5), (17, -7), (29, -13), (33, -21), (24, -28), (0, -31),
                    (-24, -28), (-33, -21), (-29, -13), (-17, -7)])
    glanz = LineString(bogen(2, 6, 26, 112, 150, 12))
    nabel = LineString(nabel.intersection(nuss.buffer(-3)).exterior.coords)
    return R(nuss, -12), [R(nabel, -12), R(glanz, -12)]


def berg():
    k = P([(-52, -32), (-28, 18), (-14, 2), (8, 44), (30, 6), (40, 18), (54, -32)])
    k = glatt(weich(k, 3), 3)
    schnee = LineString([(0, 25), (4, 30), (8, 24), (12, 30), (16, 25)])
    return k, [schnee]


def kiesel():
    f = lambda t: (50*np.cos(t), 31*np.sin(t)*(1 + 0.12*np.cos(t))*(1 - 0.12*max(0, -np.sin(t))))
    return R(_polar(f, 360), 6)


FORMEN = [
    ('halbkreis', 'Halbkreis', 'Grundformen', halbkreis()),
    ('raute', 'Raute', 'Grundformen', raute()),
    ('trapez', 'Trapez', 'Grundformen', trapez()),
    ('kreuz', 'Kreuz', 'Grundformen', kreuz()),
    ('pfeil', 'Pfeil', 'Grundformen', pfeil()),
    ('blitz', 'Blitz', 'Grundformen', blitz()),
    ('sprechblase', 'Sprechblase', 'Grundformen', sprechblase()),
    ('schild', 'Wappen', 'Grundformen', schild()),
    ('rosette', 'Rosette', 'Grundformen', rosette()),
    ('sonne', 'Sonne', 'Natur', sonne()),
    ('regenbogen', 'Regenbogen', 'Natur', regenbogen()),
    ('schneeflocke', 'Schneeflocke', 'Natur', schneeflocke()),
    ('laubbaum', 'Laubbaum', 'Natur', laubbaum()),
    ('ahornblatt', 'Ahornblatt', 'Natur', ahornblatt()),
    ('tulpe', 'Tulpe', 'Natur', tulpe()),
    ('kaktus', 'Kaktus', 'Natur', kaktus()),
    ('eichel', 'Eichel', 'Natur', eichel()),
    ('kastanie', 'Kastanie', 'Natur', kastanie()),
    ('berg', 'Berge', 'Natur', berg()),
    ('kiesel', 'Kieselstein', 'Natur', kiesel()),
]
