"""Tiere aus Wald, Hof und Haus für den Vorlagen-Generator (Schrittli): eigene Zeichnungen aus den Bausteinen."""
from zeichnen import *


def bein(x, oben, unten, b=11, fuss=0):
    """Gerades, unten gerundetes Bein (Breite b); fuss > 0 gibt einen etwas breiteren Huf/Fuss."""
    g = box(x - b/2, unten + b/2, x + b/2, oben).union(C(x, unten + b/2, b/2))
    if fuss: g = g.union(box(x - b/2 - fuss, unten, x + b/2 + fuss, unten + 7).buffer(1.5))
    return g


def paar(x, oben, unten, b=10, spreiz=10):
    """Zwei Beine als umgekehrtes V (Schrittstellung): oben zusammen, unten gespreizt – leicht zu schneiden."""
    return U(L([(x - 2, oben), (x - spreiz, unten + b/2)], b), L([(x + 2, oben), (x + spreiz, unten + b/2)], b))


def kurve(pkt, n=12):
    """Glatte Linie (Catmull-Rom) durch die Punkte, für Schwänze und Hälse."""
    p = np.asarray(pkt, float); p = np.vstack([2*p[0] - p[1], p, 2*p[-1] - p[-2]]); out = []
    for i in range(1, len(p) - 2):
        p0, p1, p2, p3 = p[i-1], p[i], p[i+1], p[i+2]
        t = np.linspace(0, 1, n, endpoint=False)[:, None]
        out.append(0.5*((2*p1) + (-p0+p2)*t + (2*p0-5*p1+4*p2-p3)*t**2 + (-p0+3*p1-3*p2+p3)*t**3))
    return [tuple(q) for q in np.vstack(out + [p[-2:-1]])]


def buschig(kreise):
    """Dicker, weicher Schwanz: Hülle je zweier Kreise (x, y, r) nacheinander."""
    return U(*[hull(C(*a), C(*b)) for a, b in zip(kreise, kreise[1:])])


def masstab(f, s):
    """Form samt Details um (0,0) skalieren."""
    g, det = f
    return affinity.scale(g, s, s, origin=(0, 0)), [affinity.scale(d, s, s, origin=(0, 0)) for d in det]


def voll(g):
    """Löcher zufüllen."""
    return Polygon(g.exterior)


def stachelkranz(cx, cy, rx, ry, a0, a1, n, hoehe, lean, w=2.5):
    """n gleich grosse Zacken auf einem Ellipsenbogen (a0 -> a1 Grad), Spitzen um hoehe nach aussen und um lean nach hinten geneigt."""
    a = np.radians(np.linspace(a0, a1, 400))
    x, y = cx + rx*np.cos(a), cy + ry*np.sin(a)
    s = np.concatenate([[0], np.cumsum(np.hypot(np.diff(x), np.diff(y)))])
    pkt = []
    for k in range(2*n + 1):
        i = min(np.searchsorted(s, s[-1]*k/(2*n)), len(a) - 1)
        px, py = x[i], y[i]
        if k % 2:
            nx, ny = np.cos(a[i])/rx, np.sin(a[i])/ry; m = np.hypot(nx, ny); nx, ny = nx/m, ny/m
            px, py = px + hoehe*nx - lean*ny, py + hoehe*ny + lean*nx
        pkt.append((px, py))
    return weich(P(pkt + [(cx, cy)]), w)


def klotz(x0, x1, oben, unten, r=4):
    """Breites Guetzli-Bein für ein Beinpaar: Block mit runden Ecken."""
    return box(x0 + r, unten + r, x1 - r, oben).buffer(r, 32)


def huf(x0, x1, oben=-4, unten=-42, b0=24, b1=20):
    """Kräftiges Bein für ein Beinpaar: oben breiter (bei x0), unten flacher Huf (bei x1)."""
    return weich(hull(E(x0, oben, b0/2, 8), box(x1 - b1/2, unten, x1 + b1/2, unten + 6)), 3)


def igel():
    # Körper als Halbkugel mit 6 grossen Stachel-Zacken, spitze Schnauze nach rechts
    cx, cy, rx, ry = -10, -14, 40, 26
    k = U(stachelkranz(cx, cy, rx, ry, 195, 35, 5, 26, 7), E(cx, cy, rx, ry).intersection(box(-60, -22, 60, 60)),
          E(cx, -20, rx - 2, 9), hull(C(22, -14, 14), C(52, -20, 5)), C(53, -19, 6),
          bein(-28, -22, -38, 13), bein(14, -22, -38, 13))
    return glatt(k, 4), [kreislinie(27, -11, 2.5)]


def maus():
    koerper = hull(C(-8, -2, 24), C(20, -6, 15), C(46, -14, 4))
    ohr = C(16, 23, 14)
    schwanz = L(kurve([(-28, -14), (-44, -20), (-58, -16), (-66, -6)]), 10)
    k = U(koerper, ohr, schwanz, E(-14, -26, 10, 5), E(24, -20, 8, 4))
    return glatt(k, 4), [kreislinie(30, -2, 2.5), LineString(C(16, 24, 8).exterior.coords)]


def schnecke():
    fuss = U(L([(-46, -28), (40, -28)], 12), L([(38, -26), (42, -2)], 16))
    fuehler = U(L([(37, 0), (31, 22)], 10), C(30, 25, 7), L([(45, 0), (55, 20)], 10), C(56, 23, 7))
    haus = E(-8, 12, 30, 34)
    k = voll(glatt(U(fuss, fuehler, haus), 4))
    t = np.linspace(0, 2.2*np.pi, 90)
    spirale = [(-8 + 25*(1 - s/(2.6*np.pi))*np.cos(-np.pi/2 - s), 12 + 28*(1 - s/(2.6*np.pi))*np.sin(-np.pi/2 - s)) for s in t]
    return k, [LineString(spirale), kreislinie(43, -8, 2.5)]


def eule():
    rechts = U(E(0, -4, 38, 46), E(32, 0, 12, 28, 6), E(0, 26, 34, 22),
               weich(P([(20, 40), (35, 54), (34, 34)]), 2.5), E(12, -50, 9, 6))
    k = U(rechts, spiegel_x(rechts))
    k = weich(glatt(k, 4), 2)
    det = [kreislinie(-14, 22, 12), kreislinie(14, 22, 12), kreislinie(-14, 22, 4.5), kreislinie(14, 22, 4.5),
           LineString([(-4, 8), (0, 1), (4, 8)]),
           LineString(bogen(-60, -12, 36, -22, 26)), LineString(bogen(60, -12, 36, 154, 202))]
    return k, det


def ente():
    koerper = U(E(-6, -14, 40, 22), weich(P([(-36, -8), (-56, 10), (-40, -26)]), 3))
    kopf = U(C(26, 20, 17), hull(C(22, 4, 12), C(24, 16, 12)))
    schnabel = E(48, 15, 12, 6, -8)
    k = U(koerper, kopf, schnabel)
    return glatt(k, 5), [kreislinie(31, 25, 2.5), LineString(bogen(-10, -6, 22, 200, 340))]


def huhn():
    """Rundes Huhn nach rechts: Kamm mit drei Zacken, spitzer Schnabel, Kehllappen, tief angesetzte Sichelfedern."""
    def feder(pkt, r0, r1):
        p = kurve(pkt, 8); return buschig([(x, y, r0 + (r1 - r0)*i/(len(p) - 1)) for i, (x, y) in enumerate(p)])
    koerper = U(E(-2, -4, 30, 23), hull(C(4, 0, 18), C(20, 20, 11)))
    kopf = C(22, 28, 12)
    kamm = weich(P([(12, 34), (11, 50), (17, 43), (22, 56), (27, 43), (33, 50), (32, 33)]), 1.8)
    schnabel = weich(P([(31, 33), (45, 27.5), (31, 22)]), 1.5)
    lappen = E(29.5, 16, 4.5, 6.5)
    schwanz = U(feder([(-24, 8), (-34, 32), (-48, 42), (-60, 40)], 9, 4.5),
                feder([(-26, 0), (-44, 12), (-58, 10), (-65, 0)], 9, 4.5),
                feder([(-26, -10), (-40, -12), (-51, -20), (-54, -28)], 8, 4.5))
    beine = U(L([(-14, -20), (-14, -42)], 10), L([(10, -20), (10, -42)], 10),
              E(-10, -44, 7, 4.5), E(14, -44, 7, 4.5))
    k = U(koerper, kopf, kamm, schnabel, lappen, schwanz, beine)
    return glatt(k, 3.5), [kreislinie(24, 30, 2.5), LineString(bogen(-6, 6, 20, 200, 320))]


def schaf():
    wolle = [C(x, y, 12.5) for x, y in [(-48, 2), (-42, 21), (-22, 30), (0, 31), (21, 24), (-46, -12), (26, 4)]]
    koerper = U(E(-10, 6, 32, 16), *wolle)
    kopf = E(46, 10, 10, 16, 40)
    ohr = E(48, 28, 9, 5, 25)
    beine = U(klotz(-40, -20, -6, -34), klotz(4, 24, -6, -34))           # je Paar ein breites Bein
    k = U(koerper, kopf, ohr, beine)
    return glatt(k, 5), [kreislinie(46, 14, 2.2)]


def schwein():
    koerper = U(E(-4, 0, 40, 28), C(26, 4, 20))
    ruessel = box(40, -6, 50, 12).buffer(3)
    ohr = weich(P([(12, 18), (20, 33), (45, 21), (34, 12)]), 4.5)   # Schlappohr, nach vorn gekippt
    schwanz = L(kurve([(-40, 6), (-52, 8), (-58, 18), (-52, 28)]), 12)
    beine = U(*[bein(x, -14, -38, 12) for x in (-34, -13, 9, 30)])
    k = U(koerper, ruessel, ohr, schwanz, beine)
    return voll(glatt(k, 3)), [kreislinie(32, 12, 2.5), kreislinie(49, 7, 1.6), kreislinie(49, -1, 1.6)]


def hund():
    koerper = U(hull(C(-28, 4, 12), C(14, -4, 17)), E(-8, 6, 30, 16))
    kopf = U(C(32, 30, 14), E(48, 22, 13, 9))
    ohr = E(20, 22, 7, 13, -25)
    schwanz = L(kurve([(-38, 8), (-48, 20), (-52, 34)]), 12)
    beine = U(bein(-34, -4, -46, 12), bein(-14, -4, -46, 12), bein(8, -10, -46, 12), bein(26, -10, -46, 12))
    k = U(koerper, kopf, ohr, schwanz, beine, L([(20, 8), (30, 26)], 18))
    return glatt(k, 4), [kreislinie(36, 34, 2.5), LineString(E(20, 22, 4, 9, -25).exterior.coords), kreislinie(59, 24, 2)]


def pferd():
    koerper = U(E(-4, 0, 38, 17), C(22, 0, 15), C(-28, 4, 12))
    hals = hull(C(18, 6, 15), C(32, 32, 11))
    kopf = hull(C(32, 36, 11), C(56, 20, 8))
    ohr = weich(P([(26, 42), (28, 58), (36, 46)]), 2)
    maehne = L([(12, 22), (18, 32), (26, 42)], 10)
    schweif = buschig([(-38, 6, 9), (-50, 4, 9), (-57, -8, 8.5), (-59, -20, 7)])
    beine = U(huf(-22, -24), huf(16, 20))                                 # je Paar ein kräftiges Bein
    k = U(koerper, hals, kopf, ohr, maehne, schweif, beine)
    hufe = [LineString([(x - 8, -35), (x + 8, -35)]) for x in (-24, 20)]
    return glatt(k, 5), [kreislinie(38, 36, 2.2), kreislinie(52, 18, 1.6)] + hufe


def fuchs():
    koerper = U(E(-2, 0, 36, 21), C(26, 0, 12))
    kopf = U(C(28, 20, 16), weich(P([(24, 32), (62, 12), (22, 4)]), 3))
    ohren = U(weich(P([(12, 24), (14, 54), (30, 32)]), 2.5), weich(P([(26, 32), (38, 56), (44, 24)]), 2.5))
    schwanz = buschig([(-30, 6, 9), (-44, 4, 14), (-60, -2, 16), (-74, -10, 12), (-84, -14, 6)])
    beine = U(klotz(-28, -10, -6, -36), klotz(12, 30, -6, -36))          # je Paar ein breites Bein
    k = U(koerper, kopf, ohren, schwanz, beine)
    return glatt(k, 5), [kreislinie(36, 22, 2.2), LineString(kurve([(-70, 6), (-66, -8), (-70, -22)]))]


def eichhoernchen():
    koerper = E(6, -14, 17, 24, -10)
    kopf = U(C(18, 20, 13), E(30, 16, 8, 7))
    ohr = weich(P([(8, 26), (3, 54), (13, 52), (22, 30)]), 3)
    schwanz = L(kurve([(0, -34), (-18, -30), (-26, -10), (-24, 14), (-18, 34), (-24, 50), (-38, 52), (-44, 42)]), 22)
    pfoten = U(E(22, -2, 8, 5, 30), E(14, -38, 12, 6))
    k = U(koerper, kopf, ohr, schwanz, pfoten)
    return voll(glatt(k, 4)), [kreislinie(22, 24, 2.5)]


def hirsch():
    koerper = E(-6, 0, 36, 16)
    hals = hull(C(20, 6, 11), C(32, 28, 8))
    kopf = hull(C(32, 32, 10), C(52, 24, 7))
    ohr = E(20, 36, 9, 5, 20)
    geweih = U(L(kurve([(28, 38), (22, 54), (14, 68)]), 13), L([(22, 52), (8, 54)], 12),
               L(kurve([(37, 38), (43, 54), (51, 68)]), 13), L([(43, 52), (57, 54)], 12))
    schwanz = E(-42, 8, 6, 5, 30)
    beine = U(paar(-30, -4, -48, 13, 11), paar(20, -4, -48, 13, 11))
    k = U(koerper, hals, kopf, ohr, geweih, schwanz, beine)
    return glatt(k, 3), [kreislinie(37, 33, 2.2)]


def kuh():
    koerper = U(box(-40, -12, 26, 12).buffer(9), C(-34, 10, 13), C(20, 10, 13))
    kopf = hull(C(38, 14, 12), E(46, -4, 10, 9))
    hoerner = U(hull(C(32, 22, 6), C(28, 34, 5)), hull(C(44, 22, 6), C(50, 34, 5)))
    ohr = E(24, 16, 10, 5, 15)
    euter = E(-12, -23, 9, 9)
    schwanz = U(L(kurve([(-48, 14), (-56, -2), (-58, -16)]), 9), E(-58, -22, 6, 8))
    beine = U(*[bein(x, -10, -48, 12) for x in (-41, -21, 11, 31)])
    k = U(koerper, kopf, hoerner, ohr, euter, schwanz, beine)
    flecken = [LineString(E(-26, 4, 10, 7, 20).exterior.coords), LineString(E(6, -2, 8, 6, -10).exterior.coords)]
    return glatt(k, 3), [kreislinie(40, 12, 2.2), kreislinie(43, -5, 1.6), kreislinie(50, -5, 1.6)] + flecken


FORMEN = [
    ('igel', 'Igel', 'Tiere', igel()),
    ('maus', 'Maus', 'Tiere', maus()),
    ('schnecke', 'Schnecke', 'Tiere', schnecke()),
    ('eule', 'Eule', 'Tiere', eule()),
    ('ente', 'Ente', 'Tiere', ente()),
    ('huhn', 'Huhn', 'Tiere', huhn()),
    ('schaf', 'Schaf', 'Tiere', schaf()),
    ('schwein', 'Schwein', 'Tiere', schwein()),
    ('hund', 'Hund', 'Tiere', hund()),
    ('pferd', 'Pferd', 'Tiere', masstab(pferd(), 0.85)),
    ('fuchs', 'Fuchs', 'Tiere', masstab(fuchs(), 0.85)),
    ('eichhoernchen', 'Eichhörnchen', 'Tiere', eichhoernchen()),
    ('hirsch', 'Hirsch', 'Tiere', masstab(hirsch(), 0.85)),
    ('kuh', 'Kuh', 'Tiere', masstab(kuh(), 0.9)),
]
