"""Themen-Motive für den Vorlagen-Generator (Welle 3): Weltraum, Meer, Fahrzeuge, Dinos, Fabelwesen, Alltag,
Piraten und Ritter, Frühling und Sommer. Alles eigene Comic-Silhouetten aus Kreisen, Ellipsen, Strichen und
Vielecken; Augen, Streifen und Trennlinien sind Details (werden nur gezeichnet, nicht geschnitten)."""
from zeichnen import *
from hilfen import *


# ---------------------------------------------------------------- Helfer

def _sanft(pkt, n=3):
    """Glättet eine Punktreihe (Chaikin), Endpunkte bleiben."""
    p = np.asarray(pkt, float)
    for _ in range(n):
        q = [p[0]]
        for a, b in zip(p[:-1], p[1:]): q += [0.75*a + 0.25*b, 0.25*a + 0.75*b]
        q.append(p[-1]); p = np.array(q)
    return p


def rohr(pkt, r0, r1, n=3):
    """Strich, der von Radius r0 auf r1 dünner wird (Schwänze, Hälse, Arme)."""
    p = _sanft(pkt, n); r = np.linspace(r0, r1, len(p))
    k = [C(x, y, ri) for (x, y), ri in zip(p, r)]
    return U(*[hull(a, b) for a, b in zip(k, k[1:])])


def sym(g):
    """Linke Hälfte bauen, mit Spiegelbild vereinigen."""
    return U(g, spiegel_x(g))


def ring(g):
    """Umriss einer Fläche als Detail-Linie."""
    return LineString(g.exterior.coords)


def ei(x, y, ru, ro, h):
    """Eiform: unten runder (ru), oben schmaler (ro), Gesamthöhe h."""
    return hull(C(x, y - h/2 + ru, ru), C(x, y + h/2 - ro, ro))


def zickzack(x0, x1, y, n, amp):
    xs = np.linspace(x0, x1, 2*n + 1)
    return LineString([(x, y + (amp if i % 2 else -amp)) for i, x in enumerate(xs)])


def rad(x, y, r, nabe=0.4):
    """Rad: Scheibe mit Nabenkreis als Detail."""
    return C(x, y, r), kreislinie(x, y, r*nabe)


# ---------------------------------------------------------------- Weltraum

def planet_ring():
    planet = C(0, 0, 28)
    band = E(0, 0, 58, 15, -22)
    g = glatt(U(planet, band), 3)
    innen = E(0, 0, 48, 8, -22).exterior.difference(planet)                   # Ringkante ausserhalb des Planeten
    vorne = LineString(bogen(0, 0, 28, 150, 330, 24)).intersection(band)      # Planetenrand vor dem Ring
    det = [innen, vorne, kreislinie(-9, 12, 5), kreislinie(6, -2, 6), kreislinie(12, 14, 3.5)]
    return g, det


def sternschnuppe():
    s = weich(affinity.translate(P(stern(5, 24, 11)), 24, 18), 1.5)
    schweif = U(rohr([(22, 18), (-6, 4), (-34, -10), (-54, -20)], 11, 4.5),
                rohr([(14, 30), (-8, 20), (-32, 8)], 7, 4),
                rohr([(24, 2), (0, -14), (-22, -30)], 7, 4))
    return glatt(U(s, schweif), 2.5), [kreislinie(28, 18, 2.5), kreislinie(18, 18, 2.5)]


def ufo():
    kuppel = E(0, 8, 20, 18)
    teller = E(0, 0, 54, 14)
    boden = E(0, -8, 30, 9)
    g = glatt(U(kuppel, teller, boden), 3)
    rand = np.asarray(E(0, 1, 47, 9).exterior.coords)
    det = [LineString(bogen(0, 8, 16, 20, 160, 20)), LineString(rand[rand[:, 1] > 1.5])]
    det += punkte([(-28, -4), (-14, -7), (0, -8), (14, -7), (28, -4)], 2.4)
    return g, det


def astronaut():
    helm = C(0, 28, 20)
    rumpf = weich(box(-17, -12, 17, 14), 6)
    tornister = weich(box(-24, -8, -12, 12), 3)
    arme = U(L([(-14, 8), (-30, -12)], 11), L([(14, 8), (30, -12)], 11), C(-31, -14, 7), C(31, -14, 7))
    beine = U(L([(-8, -10), (-11, -40)], 12), L([(8, -10), (11, -40)], 12), E(-13, -44, 10, 6), E(13, -44, 10, 6))
    g = glatt(U(helm, rumpf, tornister, arme, beine), 3)
    det = [ring(E(1, 29, 13, 11)), strich((-17, 10), (17, 10)), kreislinie(-7, -2, 2), kreislinie(0, -2, 2), kreislinie(7, -2, 2)]
    return g, det


def mond_gesicht():
    g = C(0, 0, 50).difference(C(20, 6, 40))
    g = weich(g, 4)
    det = [kreislinie(-30, 12, 4), LineString(bogen(-26, -6, 10, 200, 290, 12))]
    return g, det


# ---------------------------------------------------------------- Meer

def krebs():
    leib = E(0, 0, 32, 21)
    augen = U(L([(-10, 16), (-14, 30)], 8), L([(10, 16), (14, 30)], 8), C(-15, 32, 6.5), C(15, 32, 6.5))
    beine = U(*[L([(sx*18, -6 - 4*k), (sx*(38 + 4*k), -16 - 12*k)], 7) for sx in (-1, 1) for k in range(3)])
    arme = U(L([(-26, 6), (-44, 22)], 10), L([(26, 6), (44, 22)], 10))
    def schere(sx):
        s = C(sx*48, 26, 14).difference(P([(sx*48, 26), (sx*70, 40), (sx*70, 24)]))
        return weich(s, 2.5)
    g = glatt(U(leib, augen, beine, arme, schere(-1), schere(1)), 2.5)
    det = [kreislinie(-15, 32, 2.5), kreislinie(15, 32, 2.5), LineString(bogen(0, 4, 10, 220, 320, 10))]
    return g, det


def hai():
    leib = hull(E(-10, 0, 40, 17), C(40, 0, 8))
    kopf = hull(C(30, 0, 12), C(50, 2, 5))
    ruecken = weich(P([(-14, 12), (-4, 42), (12, 12)]), 2.5)
    brust = weich(P([(4, -8), (-6, -32), (20, -12)]), 2.5)
    schwanz = weich(P([(-42, 0), (-60, 24), (-56, 4), (-66, -18), (-44, -4)]), 2.5)
    g = glatt(U(leib, kopf, ruecken, brust, schwanz), 3)
    det = [kreislinie(36, 6, 2.5), LineString([(46, -2), (36, -8), (22, -9)])] + \
          [LineString([(14 - 5*k, 8), (12 - 5*k, -4)]) for k in range(3)]
    return g, det


def seepferd():
    kopf = E(6, 34, 13, 11, -20)
    schnauze = rohr([(14, 30), (30, 24)], 6, 4)
    leib = rohr([(2, 24), (-6, 10), (-6, -8), (0, -22), (10, -32), (12, -44), (2, -50), (-8, -44)], 14, 4)
    kamm = U(*[C(x, y, 5) for x, y in ((-6, 44), (-14, 36), (-18, 24), (-20, 10))])
    flosse = E(-18, 2, 7, 11, 20)
    bauch = U(*[C(x, y, 3) for x, y in ((8, 10), (10, 0), (10, -10))])
    g = glatt(U(kopf, schnauze, leib, kamm, flosse, bauch), 3)
    det = [kreislinie(8, 36, 2.5), LineString([(-2, 14), (6, 12)]), LineString([(-2, 4), (8, 2)]), LineString([(0, -6), (9, -8)]),
           LineString([(4, -16), (12, -18)])]
    return g, det


def clownfisch():
    leib = E(0, 0, 38, 24)
    schwanz = weich(hull(C(-34, 0, 6), C(-52, 14, 7), C(-52, -14, 7)), 3)
    rueck = weich(hull(C(-6, 20, 6), C(14, 22, 6), C(-16, 20, 5)), 2)
    unten = weich(hull(C(-2, -20, 5), C(12, -24, 5)), 2)
    brust = E(4, -8, 7, 11, 20)
    g = glatt(U(leib, schwanz, rueck, unten, brust), 3)
    streifen = []
    for x in (16, -6, -26):
        for dx in (-3, 3):
            l = LineString([(x + dx + 2, 40), (x + dx - 2, -40)]).intersection(leib.buffer(-1))
            streifen.append(l)
    det = streifen + [kreislinie(24, 7, 3), LineString(bogen(32, -4, 8, 240, 300, 8))]
    return g, det


def muschel():
    kanten = U(*[C(44*np.cos(a), 44*np.sin(a), 8) for a in np.radians(np.linspace(20, 160, 7))])
    faecher = P([(0, 0)] + bogen(0, 0, 46, 15, 165, 40))
    hinge = weich(box(-14, -14, 14, 2), 4)
    g = glatt(U(faecher, kanten, hinge), 3)
    det = [LineString([(0, -2), (44*np.cos(a), 44*np.sin(a))]) for a in np.radians(np.linspace(32, 148, 6))]
    det.append(strich((-13, -6), (13, -6)))
    return g, det


# ---------------------------------------------------------------- Fahrzeuge

def traktor():
    hinten, nh = rad(-24, -18, 26)
    vorn, nv = rad(30, -26, 16)
    kabine = weich(box(-40, 0, -8, 34), 4)
    haube = weich(box(-14, -6, 44, 14), 4)
    kamin = weich(box(26, 10, 34, 36), 2)
    g = glatt(U(hinten, vorn, kabine, haube, kamin, box(-30, -10, 44, 0)), 3)
    det = [nh, nv, ring(weich(box(-34, 8, -14, 28), 2)), strich((-14, -6), (44, -6))]
    return g, det


def lastwagen():
    kasten = weich(box(-54, -14, 6, 32), 3)
    kabine = weich(P([(8, -14), (44, -14), (44, 6), (36, 22), (8, 22)]), 4)
    raeder = [rad(x, -20, 11) for x in (-38, -14, 32)]
    g = glatt(U(kasten, kabine, box(-44, -14, 40, -10), *[r for r, _ in raeder]), 2.5)
    det = [n for _, n in raeder] + [ring(weich(P([(14, 4), (38, 4), (34, 18), (14, 18)]), 2)), strich((-54, -6), (6, -6))]
    return g, det


def heissluftballon():
    huelle = hull(E(0, 20, 32, 32), C(0, -16, 9))
    seile = P([(-11, -22), (11, -22), (8, -42), (-8, -42)])
    korb = weich(box(-12, -52, 12, -38), 2.5)
    g = glatt(U(huelle, seile, korb), 2.5)
    det = [LineString(bogen(0, 20, 32, 90, 270, 30)).intersection(huelle.buffer(-1))]
    for sx in (-1, 1):
        b = E(0, 20, 32*0.35, 32)
        det.append(LineString(np.asarray(b.exterior.coords)[np.asarray(b.exterior.coords)[:, 0]*sx > 0.5]))
    det += [strich((-10, -22), (10, -22)), strich((-11, -45), (11, -45)), strich((-5, -24), (-3, -39)), strich((5, -24), (3, -39))]
    return g, det


def velo():
    raeder = U(C(-32, -14, 22), C(32, -14, 22))
    rahmen = U(L([(-32, -14), (-4, 18), (12, -14)], 7), L([(-32, -14), (-6, -14), (26, 20)], 7), L([(-4, 18), (-18, 18)], 7),
               L([(12, -14), (32, -14)], 7), L([(-4, 18), (12, -14)], 7), L([(26, 20), (18, 25), (30, 30)], 7))
    sattel = E(-12, 22, 10, 4.5)
    g = Polygon(glatt(U(raeder, rahmen, sattel), 2).exterior)                 # Dreieck im Rahmen zugefüllt: leichter zu schneiden
    det = [LineString([(-32, -14), (-4, 18), (12, -14), (-32, -14)]).intersection(g.buffer(-3)),
           LineString([(-6, -14), (26, 20)]).intersection(g.buffer(-3))]
    for x in (-32, 32):
        det += [kreislinie(x, -14, 18), kreislinie(x, -14, 4)]
        det += [LineString([(x + 4*np.cos(a), -14 + 4*np.sin(a)), (x + 18*np.cos(a), -14 + 18*np.sin(a))]) for a in np.radians(np.arange(0, 360, 60))]
    return g, det


def bagger():
    kette = rundbox(-40, -42, 10, -24, 9)
    rumpf = weich(box(-38, -22, 6, -2), 3)
    kabine = weich(box(-18, -4, 8, 22), 4)
    arm1 = L([(6, 10), (34, 34)], 10)
    arm2 = L([(34, 34), (52, 2)], 9)
    schaufel = weich(P([(44, 6), (60, 4), (56, -20), (40, -12)]), 2.5)
    g = glatt(U(kette, rumpf, kabine, arm1, arm2, schaufel), 3)
    det = [ring(rundbox(-34, -38, 4, -28, 5)), ring(weich(box(-14, 2, 4, 18), 2)), kreislinie(34, 34, 3), kreislinie(8, 10, 3)]
    return g, det


# ---------------------------------------------------------------- Dinos

def t_rex():
    kopf = U(E(28, 30, 22, 15), hull(C(36, 28, 10), C(50, 26, 8)))
    hals = hull(C(14, 26, 10), C(0, 10, 16))
    leib = E(-4, 0, 26, 20)
    schwanz = rohr([(-20, -2), (-40, -10), (-58, -22), (-70, -34)], 14, 3.5)
    beine = U(E(-6, -18, 13, 12), L([(-8, -22), (-10, -40)], 11), E(-6, -43, 11, 6),
              E(20, -18, 11, 10), L([(20, -22), (22, -40)], 10), E(24, -43, 10, 6))
    arm = U(L([(16, 4), (27, -3)], 8), C(28, -4, 5))
    g = glatt(U(kopf, hals, leib, schwanz, beine, arm), 3)
    det = [kreislinie(34, 34, 3), LineString([(50, 22), (18, 22)]), zickzack(22, 48, 22, 5, 2.5)]
    return g, det


def triceratops():
    leib = E(-10, 0, 34, 20)
    schild = E(24, 14, 20, 24)
    kopf = hull(C(30, 6, 14), C(52, -2, 8))
    hoerner = U(L([(34, 18), (54, 34)], 10), L([(32, 6), (54, 14)], 10), C(55, 35, 5), C(55, 14, 5), L([(56, 0), (68, 8)], 10), C(68, 8, 5))
    schwanz = rohr([(-36, -4), (-52, -14), (-62, -26)], 12, 4)
    beine = U(E(-20, -18, 12, 10), L([(-22, -22), (-24, -38)], 11), E(-22, -41, 10, 6),
              E(8, -18, 12, 10), L([(10, -22), (12, -38)], 11), E(12, -41, 10, 6))
    g = glatt(U(leib, schild, kopf, hoerner, schwanz, beine), 3)
    det = [kreislinie(40, 10, 2.8), LineString(bogen(24, 14, 15, 300, 60, 16)), LineString([(56, -6), (44, -10)])]
    return g, det


def stegosaurus():
    leib = E(-4, -4, 36, 20)
    kopf = hull(C(32, -8, 9), C(46, -14, 7))
    hals = hull(C(22, -2, 12), C(32, -8, 9))
    schwanz = rohr([(-36, -8), (-52, -14), (-64, -24)], 12, 4.5)
    platten = U(*[weich(P([(x - 8, y - 2), (x, y + 18 + 3*np.cos(k)), (x + 8, y - 2)]), 2)
                  for k, (x, y) in enumerate(((22, 4), (8, 12), (-7, 14), (-22, 10), (-36, 2)))])
    stacheln = U(L([(-52, -12), (-58, 0)], 9), L([(-62, -20), (-72, -10)], 9), C(-58, 0, 4.5), C(-72, -10, 4.5))
    beine = U(E(-18, -22, 11, 8), L([(-20, -26), (-22, -40)], 11), E(-20, -43, 10, 6),
              E(12, -22, 11, 8), L([(14, -26), (16, -40)], 11), E(16, -43, 10, 6))
    g = glatt(U(leib, kopf, hals, schwanz, platten, stacheln, beine), 3)
    det = [kreislinie(38, -10, 2.5), LineString([(48, -16), (40, -18)])]
    return g, det


def brachiosaurus():
    leib = E(-10, -14, 34, 20)
    hals = rohr([(14, -4), (24, 14), (30, 34), (32, 50)], 13, 7)
    kopf = U(C(32, 54, 9), hull(C(34, 54, 7), C(46, 52, 5)))
    schwanz = rohr([(-36, -18), (-52, -24), (-66, -36)], 12, 4)
    beine = U(E(-24, -32, 12, 10), L([(-26, -36), (-26, -48)], 12), E(-26, -50, 11, 5),
              E(6, -32, 12, 10), L([(8, -36), (8, -48)], 12), E(8, -50, 11, 5))
    g = glatt(U(leib, hals, kopf, schwanz, beine), 3)
    det = [kreislinie(36, 57, 2.4), LineString([(48, 50), (40, 48)])]
    return g, det


# ---------------------------------------------------------------- Fabelwesen

def drache():
    """Seitenansicht: Rumpf, Hals nach oben, Kopf mit Hörnern, Segelflügel mit gezacktem Rand, Pfeilschwanz."""
    leib = E(-4, -8, 30, 18)
    hals = rohr([(16, 0), (26, 16), (30, 30)], 12, 9)
    kopf = U(C(30, 34, 11), hull(C(34, 32, 8), C(50, 30, 6)))
    hoerner = U(L([(26, 42), (19, 56)], 8), L([(36, 42), (43, 56)], 8), C(19, 56, 4.5), C(43, 56, 4.5))
    fluegel = weich(P([(-2, 8), (-36, 52), (-30, 30), (-46, 26), (-30, 16), (-44, 8), (-22, 6)]), 4)
    schwanz = rohr([(-28, -10), (-46, -14), (-60, -26)], 10, 5)
    spitze = weich(P([(-76, -28), (-58, -17), (-60, -41)]), 3)
    beine = U(L([(-14, -22), (-18, -38)], 11), E(-16, -40, 10, 6), L([(10, -22), (12, -38)], 11), E(12, -40, 10, 6))
    g = glatt(U(leib, hals, kopf, hoerner, fluegel, schwanz, spitze, beine), 3)
    det = [kreislinie(34, 36, 2.8), LineString([(50, 26), (40, 24)]), LineString([(44, 26), (46, 22)]),
           LineString(bogen(-4, 6, 22, 225, 315, 12)), LineString(bogen(-4, 6, 27, 228, 312, 12)),
           LineString([(-6, 8), (-30, 38)]), LineString([(-6, 8), (-36, 22)])]
    return g, det


def alien():
    kopf = U(E(0, 20, 26, 30), hull(C(0, 10, 20), C(0, -6, 10)))
    fuehler = U(L([(-10, 44), (-20, 58)], 8), L([(10, 44), (20, 58)], 8), C(-21, 60, 6.5), C(21, 60, 6.5))
    hals = box(-6, -18, 6, -4)
    rumpf = weich(box(-14, -40, 14, -14), 6)
    arme = U(L([(-12, -20), (-28, -34)], 9), L([(12, -20), (28, -34)], 9), C(-29, -36, 6), C(29, -36, 6))
    beine = U(L([(-7, -38), (-9, -50)], 9), L([(7, -38), (9, -50)], 9))
    g = glatt(U(kopf, fuehler, hals, rumpf, arme, beine), 3)
    det = [ring(E(-11, 18, 7, 11, 25)), ring(E(11, 18, 7, 11, -25)), LineString(bogen(0, 2, 6, 220, 320, 8))]
    return g, det


def monster():
    leib = E(0, 0, 32, 36)
    zotteln = U(*[C(32*np.cos(a), 36*np.sin(a), 6) for a in np.radians(np.arange(0, 360, 24))])
    hoerner = U(L([(-18, 30), (-28, 48)], 8), L([(18, 30), (28, 48)], 8))
    arme = U(L([(-28, -4), (-46, -20)], 9), L([(28, -4), (46, -20)], 9), C(-47, -22, 7), C(47, -22, 7))
    fuesse = U(E(-14, -42, 12, 7), E(14, -42, 12, 7))
    g = glatt(U(leib, zotteln, hoerner, arme, fuesse), 3)
    det = [kreislinie(0, 12, 10), kreislinie(1, 12, 4), LineString(bogen(0, -8, 16, 200, 340, 16)),
           LineString([(-10, -18), (-6, -24), (-2, -18)]), LineString([(2, -18), (6, -24), (10, -18)])]
    return g, det


def roboter():
    kopf = weich(box(-18, 14, 18, 40), 4)
    antenne = U(L([(0, 40), (0, 50)], 8), C(0, 52, 6))
    rumpf = weich(box(-22, -22, 22, 10), 4)
    hals = box(-7, 8, 7, 16)
    arme = U(L([(-22, 4), (-38, -16)], 9), L([(22, 4), (38, -16)], 9), C(-40, -18, 7), C(40, -18, 7))
    beine = U(L([(-12, -22), (-12, -40)], 10), L([(12, -22), (12, -40)], 10), weich(box(-22, -50, -4, -40), 2), weich(box(4, -50, 22, -40), 2))
    g = glatt(U(kopf, antenne, rumpf, hals, arme, beine), 2.5)
    det = [kreislinie(-8, 28, 4), kreislinie(8, 28, 4), ring(box(-9, 18, 9, 22)), strich((-3, 18), (-3, 22)), strich((3, 18), (3, 22)),
           ring(weich(box(-14, -14, 14, 2), 2)), kreislinie(-7, -6, 2.5), kreislinie(0, -6, 2.5), kreislinie(7, -6, 2.5)]
    return g, det


# ---------------------------------------------------------------- Alltag

def schluessel():
    bart = U(box(-40, -16, -20, 4), box(-44, -4, -36, 2))
    g = R(U(C(30, 0, 20).difference(C(30, 0, 8)), L([(14, 0), (-40, 0)], 10), box(-40, -11, -32, 0), box(-26, -11, -18, 0)), 0)
    return weich(g, 2), [kreislinie(30, 0, 15)]


def uhr():
    g = U(C(0, -2, 42), C(-26, 28, 10), C(26, 28, 10), L([(0, 40), (0, 48)], 7), E(0, 49, 9, 4),
          L([(-20, -36), (-30, -48)], 8), L([(20, -36), (30, -48)], 8))
    g = glatt(g, 3)
    det = [kreislinie(0, -2, 36), punkt(0, -2, 2.5), strich((0, -2), (0, 22)), strich((0, -2), (16, 2))]
    for k in range(12):
        a = np.radians(90 - 30*k); lang = 6 if k % 3 == 0 else 3.5
        det.append(strich((36*np.cos(a), -2 + 36*np.sin(a)), ((36 - lang)*np.cos(a), -2 + (36 - lang)*np.sin(a))))
    return g, det


def brille():
    glas = lambda x: rundbox(x - 22, -16, x + 22, 16, 12)
    rahmen = U(*[glas(x).difference(glas(x).buffer(-9)) for x in (-26, 26)])
    steg = L([(-6, 4), (6, 4)], 10)
    buegel = U(L([(-44, 8), (-58, 10)], 10), L([(44, 8), (58, 10)], 10))
    return weich(U(rahmen, steg, buegel), 1.5), []


def hut():
    krempe = E(0, -24, 50, 9)
    kopf = weich(P([(-30, -24), (30, -24), (28, 30), (-28, 30)]), 6)
    g = glatt(U(krempe, kopf), 3)
    rand = np.asarray(E(0, -24, 45, 5.5).exterior.coords)
    det = [strich((-29, -12), (29, -12)), strich((-29, -4), (29, -4)), LineString(rand[rand[:, 1] < -24.5])]
    return g, det


def hose():
    g = P([(-34, 50), (34, 50), (38, -46), (6, -50), (0, -12), (-6, -50), (-38, -46)])
    g = weich(glatt(g, 4), 4)
    det = [strich((-34, 42), (34, 42)), strich((0, 42), (0, -4)), strich((-33, -38), (-10, -40)), strich((10, -40), (33, -38)),
           ring(weich(P([(-28, 38), (-14, 38), (-16, 24), (-30, 24)]), 2))]
    return g, det


def schuh():
    sohle = rundbox(-50, -22, 50, -10, 5)
    kappe = hull(C(26, 0, 12), C(40, -10, 8), C(0, -8, 8))
    schaft = weich(P([(-44, -14), (-10, -14), (14, 2), (-6, 24), (-44, 26)]), 6)
    g = glatt(U(sohle, kappe, schaft), 3)
    det = [strich((-46, -12), (46, -12)), LineString(bogen(22, -8, 18, 40, 150, 12)),
           strich((-6, 2), (6, 10)), strich((-12, 8), (0, 16)), strich((-18, 14), (-6, 22)), ring(E(-28, 6, 10, 8))]
    return g, det


# ---------------------------------------------------------------- Piraten und Ritter

def totenkopf():
    schaedel = E(0, 12, 38, 36)
    kiefer = weich(box(-24, -40, 24, -10), 8)
    g = glatt(U(schaedel, kiefer), 4)
    g = g.difference(U(E(-15, 14, 11, 12), E(15, 14, 11, 12), weich(P([(0, 4), (-6, -8), (6, -8)]), 2)))
    det = [strich((x, -34), (x, -22)) for x in (-12, -4, 4, 12)] + [strich((-18, -22), (18, -22))]
    return weich(g, 1.5), det


def schatztruhe():
    deckel = E(0, 6, 46, 24).intersection(box(-50, 6, 50, 40))
    kasten = weich(box(-46, -40, 46, 6), 3)
    g = glatt(U(deckel, kasten), 3)
    det = [strich((-46, 6), (46, 6)), strich((-46, -8), (46, -8)), ring(weich(box(-8, -22, 8, -8), 2)), kreislinie(0, -15, 2.5),
           strich((-30, -40), (-30, 6)), strich((30, -40), (30, 6))]
    rand = np.asarray(E(0, 6, 38, 18).exterior.coords); det.append(LineString(rand[rand[:, 1] > 6.5]))
    return g, det


def ritterhelm():
    topf = U(E(0, 20, 36, 28).intersection(box(-40, 20, 40, 50)), weich(box(-36, -40, 36, 20), 6))
    busch = U(L([(0, 44), (6, 62)], 10), C(8, 64, 8))
    g = glatt(U(topf, busch), 3)
    g = g.difference(U(rundbox(-30, 4, -6, 14, 4), rundbox(6, 4, 30, 14, 4)))
    det = [strich((0, 0), (0, -36)), strich((-36, -10), (36, -10)), strich((-36, -22), (36, -22))] + \
          punkte([(-26, -30), (-13, -30), (13, -30), (26, -30), (-26, -16), (-13, -16), (13, -16), (26, -16)], 1.8)
    return weich(g, 1.5), det


def wappenschild():
    oben = box(-42, 10, 42, 46)
    unten = C(0, 10, 42).intersection(box(-50, -40, 50, 10))
    spitze = hull(C(-30, -12, 12), C(30, -12, 12), C(0, -44, 6))
    g = glatt(weich(U(oben, unten, spitze), 4), 4)
    det = [strich((0, 46), (0, -44)), strich((-42, 8), (42, 8)), ring(g.buffer(-5))]
    return g, det


# ---------------------------------------------------------------- Frühling und Sommer

def biene():
    leib = E(-6, -6, 30, 19)
    kopf = C(28, 0, 14)
    stachel = weich(P([(-34, -8), (-50, -10), (-34, -2)]), 1.5)
    fuehler = U(L([(32, 10), (40, 26)], 6), L([(24, 12), (22, 28)], 6), C(41, 28, 5), C(22, 30, 5))
    fluegel = U(E(-14, 20, 18, 11, 20), E(6, 18, 14, 9, 30))
    beine = U(*[L([(x, -18), (x - 4, -30)], 7) for x in (12, -2, -16)])
    g = glatt(U(leib, kopf, stachel, fuehler, fluegel, beine), 3)
    det = [kreislinie(32, 4, 3)]
    for x in (4, -8, -20):
        det.append(LineString([(x + 2, 40), (x - 2, -40)]).intersection(leib.buffer(-1)))
    det += [ring(E(-14, 20, 14, 8, 20)), ring(E(6, 18, 10, 6, 30))]
    return g, det


def narzisse():
    blaetter = U(*[E(24*np.cos(a), 28 + 24*np.sin(a), 16, 9, np.degrees(a)) for a in np.radians(np.arange(6)*60 + 90)])
    trompete = C(0, 28, 14)
    stiel = L([(0, 28), (-2, -50)], 8)
    blatt = E(8, -24, 7, 20, -8)
    g = glatt(U(blaetter, trompete, stiel, blatt), 2.5)
    det = [kreislinie(0, 28, 10), kreislinie(0, 28, 4), strich((9, -6), (7, -42))]
    return g, det


def ei_gemustert():
    g = ei(0, 0, 36, 26, 100)
    det = [zickzack(-34, 34, 14, 7, 4).intersection(g.buffer(-5)), zickzack(-34, 34, -18, 7, 4).intersection(g.buffer(-5))]
    det += [p for p in punkte([(x, 32) for x in range(-20, 21, 10)], 2.5)]
    det += [p for p in punkte([(x, -2) for x in range(-30, 31, 10)], 2.5)]
    det += [p for p in punkte([(x, -36) for x in range(-20, 21, 10)], 2.5)]
    return g, det


def flipflop():
    """Von oben: Sohle als Umriss, Zehensteg und Riemen als Linien."""
    sohle = hull(C(0, 22, 20), C(0, -26, 22))
    riemen = U(L([(2, 16), (-19, -4)], 6), L([(2, 16), (23, -4)], 6), C(2, 16, 5))
    det = [ring(sohle.buffer(-4)), ring(riemen).intersection(sohle.buffer(-5)), kreislinie(2, 16, 2.2)]
    return sohle, det


def sonnenbrille():
    glas = lambda x: weich(hull(C(x - 14, 2, 14), C(x + 14, 4, 14), C(x, -8, 12)), 4)
    rahmen = U(*[glas(x).difference(glas(x).buffer(-9)) for x in (-27, 27)])
    steg = L([(-6, 8), (6, 8)], 10)
    buegel = U(L([(-44, 8), (-60, 11)], 10), L([(44, 8), (60, 11)], 10))
    return weich(U(rahmen, steg, buegel), 1.5), []


# ---------------------------------------------------------------- Liste

D, N, T, F = 'Dinge', 'Natur', 'Tiere', 'Feste'
FORMEN = [
    # Weltraum
    ('planet-ring', 'Planet mit Ring', D, planet_ring(), 14),
    ('sternschnuppe', 'Sternschnuppe', D, sternschnuppe(), 12),
    ('ufo', 'Ufo', D, ufo(), 12),
    ('astronaut', 'Astronaut', D, astronaut(), 12),
    ('mond-gesicht', 'Mond mit Gesicht', N, mond_gesicht(), 10),
    # Meer
    ('krebs', 'Krebs', T, krebs(), 12),
    ('hai', 'Hai', T, hai(), 14),
    ('seepferd', 'Seepferdchen', T, seepferd(), 12),
    ('clownfisch', 'Clownfisch', T, clownfisch(), 11),
    ('muschel', 'Muschel', N, muschel(), 9),
    # Fahrzeuge
    ('traktor', 'Traktor', D, traktor(), 12),
    ('lastwagen', 'Lastwagen', D, lastwagen(), 14),
    ('heissluftballon', 'Heissluftballon', D, heissluftballon(), 12),
    ('velo', 'Velo', D, velo(), 14),
    ('bagger', 'Bagger', D, bagger(), 13),
    # Dinos
    ('t-rex', 'T-Rex', T, t_rex(), 15),
    ('triceratops', 'Triceratops', T, triceratops(), 15),
    ('stegosaurus', 'Stegosaurus', T, stegosaurus(), 15),
    ('brachiosaurus', 'Brachiosaurus', T, brachiosaurus(), 15),
    # Fabelwesen
    ('drache', 'Drache', T, drache(), 15),
    ('alien', 'Alien', T, alien(), 11),
    ('monster', 'Monster', T, monster(), 11),
    ('roboter', 'Roboter', D, roboter(), 12),
    # Alltag
    ('schluessel', 'Schlüssel', D, schluessel(), 10),
    ('uhr', 'Uhr', D, uhr(), 11),
    ('brille', 'Brille', D, brille(), 14),
    ('hut', 'Hut', D, hut(), 11),
    ('hose', 'Hose', D, hose(), 12),
    ('schuh', 'Schuh', D, schuh(), 12),
    # Piraten und Ritter
    ('totenkopf', 'Totenkopf', D, totenkopf(), 10),
    ('schatztruhe', 'Schatztruhe', D, schatztruhe(), 11),
    ('ritterhelm', 'Ritterhelm', D, ritterhelm(), 11),
    ('wappenschild', 'Wappenschild', D, wappenschild(), 12),
    # Frühling und Sommer
    ('honigbiene', 'Honigbiene', T, biene(), 10),
    ('narzisse', 'Narzisse', N, narzisse(), 13),
    ('ei-gemustert', 'Ei mit Muster', F, ei_gemustert(), 10),
    ('flipflop', 'Flip-Flop', D, flipflop(), 10),
    ('sonnenbrille', 'Sonnenbrille', D, sonnenbrille(), 14),
]
