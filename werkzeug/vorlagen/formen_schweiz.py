"""Schweizer Motive: Edelweiss, Schweizer Kreuz, Alphorn, Matterhorn, Kuhglocke, Steinbock, Murmeltier,
Fondue-Caquelon, Armbrust und Kuh mit Glocke. Alles eigene Zeichnungen aus Kreisen, Ellipsen, Strichen und Vielecken."""
from zeichnen import *
from hilfen import *

S = 'Schweiz'


def ring(g):
    """Umriss einer Form als Detail-Linie."""
    return LineString(g.exterior.coords)


def sym(g):
    return U(g, spiegel_x(g))


def rohr(pkt, r0, r1):
    """Strich, der von Radius r0 auf r1 dünner wird (Hülle je zweier Kreise)."""
    p = np.asarray(pkt, float); r = np.linspace(r0, r1, len(p))
    k = [C(x, y, ri) for (x, y), ri in zip(p, r)]
    return U(*[hull(a, b) for a, b in zip(k, k[1:])])


def bein(x, oben, unten, b=11):
    """Gerades, unten gerundetes Bein."""
    return U(box(x - b/2, unten + b/2, x + b/2, oben), C(x, unten + b/2, b/2))


def edelweiss():
    """Zwei Kränze ovaler Blütenblätter (hinten gross, vorne kleiner), Körbchen in der Mitte als Punkte."""
    hinten = [E(31*np.cos(a), 31*np.sin(a), 21, 8.5, np.degrees(a)) for a in np.radians(90 + 360*np.arange(6)/6)]
    vorne = [E(24*np.cos(a), 24*np.sin(a), 18, 8, np.degrees(a)) for a in np.radians(120 + 360*np.arange(6)/6)]
    g = glatt(U(C(0, 0, 15), *hinten, *vorne), 2.5)
    det = punkte(kreis_punkte(7, 7.5, start=90), 2.6) + [punkt(0, 0, 2.6)]
    return g, det


def schweizerkreuz():
    """Rundes Schild, darauf das Kreuz (Arme 7 : 6 wie im Gesetz) als Umriss."""
    kreuz = U(box(-6.5, -19.5, 6.5, 19.5), box(-19.5, -6.5, 19.5, 6.5))
    return C(0, 0, 50), [ring(kreuz), kreislinie(0, 0, 44)]


def alphorn():
    """Langes, leicht gebogenes Rohr vom Mundstück oben links zum Becher unten rechts, mit einem Stützfuss."""
    pkt = [(-50, 40), (-30, 28), (-10, 15), (8, 2), (22, -10), (32, -20)]
    rohr_ = rohr(pkt, 4, 5.5)
    mund = C(-50, 40, 5)
    becher = hull(C(32, -20, 5.5), E(46, -36, 8, 17, 35))
    fuss = L([(38, -32), (36, -50)], 7)
    g = glatt(U(rohr_, mund, becher, fuss), 2.5)
    achse = LineString(pkt); det = []
    for t in (0.32, 0.36, 0.68, 0.72):                                   # Ringe (Bänder) quer zum Rohr
        a, b = achse.interpolate(t - 0.01, True), achse.interpolate(t + 0.01, True)
        n = np.array([-(b.y - a.y), b.x - a.x]); n = 5.5*n/np.hypot(*n); m = np.array([(a.x + b.x)/2, (a.y + b.y)/2])
        det.append(strich(tuple(m - n), tuple(m + n)))
    det.append(LineString(bogen(46, -36, 11, 150, 330, 12)))
    return g, det


def matterhorn():
    """Schiefer Gipfel, nach links steil, nach rechts mit Absatz; Schneegrenze als Zackenlinie."""
    k = P([(-50, -40), (-22, -8), (-8, 20), (4, 36), (8, 50), (14, 36), (22, 24), (32, 2), (50, -40)])
    g = weich(k, 2)
    det = [LineString([(-24, -6), (-16, 2), (-10, -4), (-2, 8), (6, 2), (14, 12), (20, 4), (28, 8)]),
           strich((4, 36), (-2, 12)), strich((14, 36), (24, 6))]
    return g, det


def kuhglocke():
    """Glocke mit breitem Riemen oben; Schnalle und Zierlinien als Details."""
    halb = [(0, 18), (12, 17), (19, 10), (24, -6), (31, -24), (37, -36), (37, -44), (0, -44)]
    glocke = weich(P(halb + [(-x, y) for x, y in reversed(halb[1:-1])]), 3)
    riemen = U(box(-24, 22, 24, 44).buffer(3), box(-9, 12, 9, 26))
    g = glatt(U(glocke, riemen), 3)
    det = [ring(box(-9, 26, 9, 40)), strich((0, 26), (0, 40)), strich((-29, 33), (-9, 33)), strich((9, 33), (29, 33)),
           strich((-33, -34), (33, -34)), punkt(0, -40, 2)]
    return g, det


def steinbock():
    """Seitenansicht nach rechts: kräftiger Körper, Kopf mit Bart, zwei grosse Hörner im Bogen nach hinten."""
    koerper = U(E(-6, 0, 36, 18), C(-32, 4, 14), C(22, 6, 14))
    hals = hull(C(22, 6, 12), C(36, 22, 9))
    kopf = hull(C(36, 24, 9), E(48, 16, 7, 5, -30))
    bart = L([(46, 10), (50, 2)], 6.5)
    hoerner = []
    for versatz in (0, -6):
        pkt = bogen(14 + versatz, 24, 24, -5, 125, 14)
        hoerner.append(rohr(pkt, 5, 3.6))
    ohr = E(30, 30, 7, 3.5, 20)
    beine = U(bein(-30, 0, -46, 11), bein(-16, 0, -46, 11), bein(12, 0, -46, 11), bein(26, 0, -46, 11))
    schwanz = L([(-44, 10), (-52, 18)], 7)
    g = glatt(U(koerper, hals, kopf, bart, *hoerner, ohr, beine, schwanz), 3)
    det = [punkt(42, 24, 2), strich((50, 14), (54, 12))]
    for a in (20, 45, 70, 95): det.append(strich(bogen(14, 24, 20.5, a, a, 1)[0], bogen(14, 24, 27.5, a, a, 1)[0]))
    det += [strich((x - 5.5, -40), (x + 5.5, -40)) for x in (-30, -16, 12, 26)]
    return g, det


def murmeltier():
    """Sitzendes Murmeltier von vorne: runder Bauch, Kopf mit kleinen Ohren, Pfoten vor der Brust, Füsse unten."""
    koerper = E(0, -12, 28, 34)
    kopf = U(C(0, 28, 19), C(-15, 42, 5.5), C(15, 42, 5.5))
    pfoten = U(E(-10, 0, 8, 6, -20), E(10, 0, 8, 6, 20))
    fuesse = U(E(-14, -44, 13, 6), E(14, -44, 13, 6))
    schwanz = E(-30, -36, 9, 6, 40)
    g = glatt(U(koerper, kopf, pfoten, fuesse, schwanz), 3)
    det = [punkt(-7, 31, 2), punkt(7, 31, 2), ring(E(0, 23, 4, 2.5)), strich((0, 20.5), (0, 16)),
           ring(E(-10, 0, 7, 5, -20)), ring(E(10, 0, 7, 5, 20)),
           strich((-4, 16), (4, 16)), strich((-4, 16), (-4, 11)), strich((4, 16), (4, 11)), strich((-4, 11), (4, 11)),
           LineString(bogen(0, -8, 16, 200, 340, 14))]
    return g, det


def fondue_caquelon():
    """Bauchiger Topf mit Rand und Stiel nach rechts, Gabel steckt schräg im Topf; Rechaud mit Flamme als Detail."""
    topf = U(box(-33, -22, 33, -8), E(0, -22, 33, 17))
    rand = box(-40, -10, 40, -2).buffer(2)
    stiel = box(36, -9, 70, -3).buffer(2.5)
    gabel = U(L([(-8, -16), (-18, 40)], 7), C(-19, 43, 5.5))
    rechaud = U(box(-24, -50, 24, -42).buffer(2), box(-20, -44, 20, -34))
    g = glatt(U(topf, rand, stiel, gabel, rechaud), 3)
    det = [strich((-36, -8), (36, -8)), LineString(E(0, -18, 7, 5).exterior.coords), ring(E(14, -28, 5, 3.5)),
           LineString([(-6, -48), (-2, -43), (0, -48), (2, -43), (6, -48)]), strich((40, -6), (66, -6))]
    return g, det


def armbrust():
    """Senkrechter Schaft mit Kolben, breiter Bogen oben, Sehne quer, Abzug unten; Bolzen als Detail."""
    schaft = box(-6, -50, 6, 34).buffer(1.5)
    kolben = box(-11, -50, 11, -32).buffer(2)
    bogen_ = L(bogen(0, -48, 78, 62, 118, 24), 7)
    enden = [C(x, y, 4.5) for x, y in (bogen(0, -48, 78, 62, 62, 1)[0], bogen(0, -48, 78, 118, 118, 1)[0])]
    sehne = L([enden[0].centroid.coords[0], enden[1].centroid.coords[0]], 4)
    abzug = L([(5, -22), (12, -30)], 5)
    g = glatt(U(schaft, kolben, bogen_, *enden, sehne, abzug), 2.5)
    det = [strich((0, -18), (0, 28)), LineString([(-3, 24), (0, 31), (3, 24)]), strich((-3, -18), (3, -18)),
           strich((-2, -12), (-2, -18)), strich((2, -12), (2, -18))]
    return g, det


def trychel_kuh():
    """Kuh von der Seite nach rechts, Glocke am Halsriemen; Flecken, Auge und Nüstern als Details."""
    koerper = U(box(-40, -12, 26, 12).buffer(9), C(-34, 10, 13), C(20, 10, 13))
    kopf = hull(C(38, 14, 12), E(46, -4, 10, 9))
    hoerner = U(hull(C(32, 22, 6), C(28, 34, 5)), hull(C(44, 22, 6), C(50, 34, 5)))
    ohr = E(24, 16, 10, 5, 15)
    euter = E(-12, -23, 9, 9)
    schwanz = U(L([(-48, 14), (-56, -2), (-58, -16)], 8), E(-58, -22, 6, 8))
    beine = U(*[bein(x, -10, -48, 12) for x in (-41, -21, 11, 31)])
    riemen = L([(30, 4), (34, -12)], 5)
    glocke = weich(P([(28, -12), (40, -12), (44, -28), (24, -28)]), 2)
    g = glatt(U(koerper, kopf, hoerner, ohr, euter, schwanz, beine, riemen, glocke), 3)
    det = [punkt(40, 12, 2.2), punkt(43, -5, 1.6), punkt(50, -5, 1.6), ring(E(-26, 4, 10, 7, 20)), ring(E(6, -2, 8, 6, -10)),
           ring(E(-36, 10, 6, 5)), strich((27, -24), (41, -24)), punkt(34, -26, 1.4)]
    return g, det


FORMEN = [
    ('edelweiss-bluete', 'Edelweiss', S, edelweiss(), 10),
    ('schweizerkreuz', 'Schweizer Kreuz', S, schweizerkreuz(), 10),
    ('alphorn', 'Alphorn', S, alphorn(), 20),
    ('matterhorn', 'Matterhorn', S, matterhorn(), 12),
    ('kuhglocke', 'Kuhglocke', S, kuhglocke(), 10),
    ('steinbock', 'Steinbock', S, steinbock(), 14),
    ('murmeltier', 'Murmeltier', S, murmeltier(), 10),
    ('fondue-caquelon', 'Fondue-Caquelon', S, fondue_caquelon(), 12),
    ('armbrust', 'Armbrust', S, armbrust(), 12),
    ('trychel-kuh', 'Kuh mit Glocke', S, trychel_kuh(), 14),
]
