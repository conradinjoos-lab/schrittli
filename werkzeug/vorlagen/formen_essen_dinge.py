"""Formen Essen und Dinge für den Vorlagen-Generator (Schrittli): eigene Zeichnungen aus den Bausteinen in zeichnen.py."""
from zeichnen import *


def halb(g):
    """Rechte Hälfte spiegeln und mit sich vereinigen (symmetrische Formen)."""
    return U(g, spiegel_x(g)).buffer(0.01)


def blattform(x, y, lang, breit, rot):
    """Spitzes Blatt (Linse) mit Mitte (x, y), Länge, Breite, Drehung in Grad."""
    r = (lang**2/4 + breit**2/4) / breit
    d = r - breit/2
    b = C(0, d, r).intersection(C(0, -d, r))
    return affinity.translate(affinity.rotate(b, rot, origin=(0, 0)), x, y)


def mass(g, f):
    """Grösse anpassen (um den Nullpunkt)."""
    return affinity.scale(g, f, f, origin=(0, 0))


# ---------------------------------------------------------------- Essen

def apfel():
    oben = glatt(U(L([(0, 24), (4, 48)], 9), blattform(20, 44, 32, 15, 30)), 9)     # Zwickel Stiel/Blatt weit ausrunden
    k = U(C(-13, 0, 33), C(13, 0, 33), oben)
    return glatt(k, 4), [LineString([(8, 38), (31, 52)])]


def birne():
    k = glatt(U(C(0, -22, 31), C(0, 18, 18)), 26)
    oben = glatt(U(L([(0, 30), (4, 50)], 9), blattform(18, 46, 30, 15, 30)), 9)
    k = U(k, oben)
    return glatt(k, 3), [LineString([(8, 42), (28, 51)])]


def kirschen():
    links = [(-26 + 26*u**1.6, -24 + 64*u) for u in np.linspace(0, 1, 20)]       # sanft gebogener Stiel
    stiele = glatt(U(L(links, 11), spiegel_x(L(links, 11))), 6)
    blatt = blattform(19, 50, 36, 17, 25)
    k = U(C(-26, -38, 19), C(26, -38, 19), stiele, blatt, C(0, 40, 6.5))
    return glatt(k, 4), [LineString([(4, 43), (34, 57)])]


def erdbeere():
    beere = hull(C(-19, 4, 21), C(19, 4, 21), C(0, -38, 15))
    kelch = U(*[blattform(18*np.cos(np.radians(a)), 22 + 18*np.sin(np.radians(a)), 32, 17, a) for a in (-25, 22, 158, 205)],
              C(0, 24, 11))
    k = glatt(U(beere, kelch, L([(0, 26), (2, 46)], 10)), 3)
    punkte = [kreislinie(x, y, 1.8) for x, y in ((-20, 0), (0, 6), (20, 0), (-10, -10), (10, -10), (-18, -22), (0, -24), (18, -22), (-8, -38), (8, -38))]
    return k, punkte


def zitrone():
    spitzen = U(hull(C(-37, 0, 10), C(-46, 0, 7)), hull(C(37, 0, 10), C(46, 0, 7)))
    k = glatt(U(E(0, 0, 40, 30), spitzen), 8)
    return R(k, 20)


def banane():
    t = np.linspace(0, 1, 80); a = np.radians(205 + 130*t)
    w = 5.5 + 14*np.sin(np.pi*t)**0.7            # halbe Breite
    m = 80
    aussen = np.c_[(m + w)*np.cos(a), 50 + (m + w)*np.sin(a)]
    innen = np.c_[(m - w)*np.cos(a), 50 + (m - w)*np.sin(a)]
    b = P(np.vstack([aussen, innen[::-1]])).buffer(0)
    e0 = np.array([m*np.cos(a[0]), 50 + m*np.sin(a[0])]); e1 = np.array([m*np.cos(a[-1]), 50 + m*np.sin(a[-1])])
    tang = np.array([-np.sin(a[-1]), np.cos(a[-1])]); norm = np.array([np.cos(a[-1]), np.sin(a[-1])])
    ecken = [e1 - 6.5*norm - 2*tang, e1 + 6.5*norm - 2*tang, e1 + 6.5*norm + 21*tang, e1 - 6.5*norm + 21*tang]
    stiel = weich(P([tuple(p) for p in ecken]), 2)                 # stumpfer Stiel oben
    k = glatt(U(b, C(*e0, 6.5), stiel), 4)
    # Details: Stielende, dunkle Spitze unten, Kante längs
    t0 = np.array([-np.sin(a[0]), np.cos(a[0])]); n0 = np.array([np.cos(a[0]), np.sin(a[0])])
    s1 = e1 + 16*tang
    q = e0 + 7*t0
    spitze = [LineString([tuple(q - 6*n0), tuple(q + 6*n0)])] + [LineString([tuple(e0 + d*n0 - 3*t0), tuple(e0 + d*n0 + 6*t0)]) for d in (-2.5, 0, 2.5)]
    det = [LineString([tuple(s1 - 5.5*norm), tuple(s1 + 5.5*norm)]),
           LineString([((m - 2)*np.cos(x), 50 + (m - 2)*np.sin(x)) for x in np.radians(np.linspace(222, 318, 30))])] + spitze
    f = lambda g: mass(R(g, 12), 0.75)
    return f(k), [f(d.intersection(k.buffer(-1))) for d in det]


def karotte():
    ruebe = hull(C(0, 20, 20), C(0, -50, 7))
    def bueschel(a):
        r = np.array([np.sin(np.radians(a)), np.cos(np.radians(a))])
        return hull(C(*(np.array([0, 30]) + 4*r), 6), C(*(np.array([0, 30]) + 32*r), 10))
    kraut = glatt(U(*[bueschel(a) for a in (-52, 0, 52)]), 4)
    k = glatt(U(ruebe, kraut), 4)
    linien = [LineString([(-15, 10), (-6, 10)]), LineString([(5, -8), (12, -8)]), LineString([(-8, -26), (-2, -26)])]
    return R(k, -20), [R(l, -20) for l in linien]


def glace():
    tuete = weich(P([(-24, 6), (24, 6), (0, -58)]), 3)
    kugel = C(0, 24, 28)
    k = glatt(U(tuete, kugel), 3)
    innen = tuete.buffer(-3).intersection(box(-30, -60, 30, -4))
    gitter = [LineString([(x, 10), (x + 32, -70)]) for x in (-40, -22, -4)] + [LineString([(-x, 10), (-x - 32, -70)]) for x in (-40, -22, -4)]
    welle = LineString([(x, 6 + 2.5*np.cos(x/26*3*np.pi)) for x in np.linspace(-20, 20, 40)])
    gitter = [g.intersection(innen) for g in gitter]
    return k, [g for g in gitter if not g.is_empty] + [welle]


def muffin():
    foermchen = weich(P([(-34, 0), (34, 0), (26, -40), (-26, -40)]), 4)
    haube = U(C(-25, 8, 17), C(25, 8, 17), C(0, 18, 26), hull(C(-33, 3, 9), C(33, 3, 9)))
    k = glatt(U(foermchen, glatt(haube, 6)), 3)
    rillen = [LineString([(x*0.76, -37), (x, -3)]) for x in (-22, -11, 0, 11, 22)]
    return k, rillen


def pizzastueck():
    spitze = (0, -52)
    a1, a2 = 62, 118
    sektor = P([spitze] + bogen(0, -52, 92, a1, a2))
    rand = L(bogen(0, -52, 88, a1 + 1, a2 - 1), 15)
    k = weich(U(sektor, rand), 3)
    belag = [kreislinie(-12, 12, 6), kreislinie(13, 4, 5.5), kreislinie(0, -18, 5)]
    return k, belag


def tasse():
    becher = weich(P([(-34, 40), (22, 40), (17, -16), (-29, -16)]), 3)
    henkel = L(bogen(28, 14, 15, 130, -55, 30), 11)
    teller = weich(P([(-52, -14), (40, -14), (30, -27), (-42, -27)]), 4)
    k = glatt(U(becher, henkel, teller), 4)
    return k, [LineString([(-31, 33), (19, 33)])]



# ---------------------------------------------------------------- Dinge

def auto():
    unten = weich(box(-52, -14, 52, 12), 7)
    dach = weich(P([(-30, 10), (32, 10), (18, 36), (-20, 36)]), 5)
    k = glatt(U(unten, dach, C(-28, -18, 13), C(28, -18, 13)), 3)
    fenster = [LineString([(-22, 14), (-15, 31), (-2, 31), (-2, 14), (-22, 14)]), LineString([(4, 14), (4, 31), (15, 31), (24, 14), (4, 14)])]
    return k, fenster + [kreislinie(-28, -18, 5), kreislinie(28, -18, 5)]


def segelboot():
    rumpf = weich(P([(-50, -20), (52, -20), (36, -44), (-36, -44)]), 3)
    segel = weich(U(P([(0, -22), (0, 60), (44, -22)]), P([(1, -22), (1, 42), (-36, -22)])), 3)
    k = glatt(U(rumpf, segel), 4)
    return k, [LineString([(0, -20), (0, 40)]), LineString([(-46, -24), (48, -24)])]


def rakete():
    koerper = C(-40, 0, 56).intersection(C(40, 0, 56)).intersection(box(-30, -26, 30, 60))
    koerper = affinity.translate(koerper, 0, 6)
    fl = weich(P([(8, 4), (32, -28), (32, -42), (0, -42)]), 3)
    duese = weich(box(-11, -48, 11, -30), 3)
    k = glatt(U(koerper, fl, spiegel_x(fl), duese), 5)
    return k, [kreislinie(0, 14, 8)]


def ballon():
    oben = E(0, 14, 32, 34).intersection(box(-40, 14, 60, 60))
    unten = E(0, 14, 32, 42).intersection(box(-40, -40, 40, 14))
    hulle = U(oben, unten).buffer(0.01)
    knoten = weich(P([(-10, -40), (10, -40), (0, -22)]), 2.5)
    schnur = L([(0, -38), (1, -52)], 10.5)
    k = glatt(U(hulle, knoten, schnur), 3)
    return k, [LineString(bogen(0, 14, 22, 110, 150))]


def kleid():
    saum = P([(0, -46)] + bogen(0, 10, 58, -90, -47) + [(14, 4), (0, 4)])
    oben = P([(0, 4), (14, 4), (16, 38), (0, 38)])
    aermel = E(19, 29, 9, 9, -20)
    k = halb(glatt(U(saum, oben, aermel), 7)).difference(C(0, 42, 9))
    return glatt(weich(k, 3), 3), [LineString([(-13, 6), (13, 6)])]


def t_shirt():
    h = P([(0, 40), (16, 40), (46, 24), (38, 6), (26, 14), (26, -44), (0, -44)])
    k = halb(h).difference(E(0, 42, 13, 9))
    return glatt(weich(k, 3), 3)


def socke():
    schaft = box(-28, -14, 6, 48)
    fuss = hull(C(-12, -24, 18), C(30, -28, 14))
    k = weich(glatt(U(schaft, fuss), 10), 3)
    bund = [LineString([(-28, 36), (6, 36)])] + [LineString([(x, 38), (x, 46)]) for x in (-20, -11, -2)]
    return k, bund + [LineString(bogen(-12, -24, 10, 120, 250))]


def faeustling():
    hand = U(E(6, 16, 25, 30), box(-19, -26, 31, 16))
    daumen = E(-21, -6, 11, 19, 30)
    stulpe = box(-23, -48, 35, -24).buffer(3)
    k = glatt(U(hand, daumen, stulpe), 4)
    return k, [LineString([(-23, -24), (35, -24)])]


def schirm():
    dach = C(0, 0, 52).intersection(box(-60, 0, 60, 60))
    for x in (-34.7, 0, 34.7):
        dach = dach.difference(E(x, 0, 17.3, 7))
    stock = L([(0, 4), (0, -38)] + bogen(-14, -38, 14, 0, -180)[1:], 11)
    k = glatt(U(dach, stock, L([(0, 48), (0, 58)], 10)), 3)
    return k, [LineString([(0, 50), (-17.3, 7)]), LineString([(0, 50), (17.3, 7)])]


def anker():
    schaft = L([(0, 38), (0, -46)], 13)
    stock = L([(-21, 26), (21, 26)], 12)
    ring = C(0, 47, 12)
    arme = L(bogen(0, -12, 36, 205, 335), 12.5)
    a = np.radians(335); ende = np.array([36*np.cos(a), -12 + 36*np.sin(a)])
    t, n = np.array([-np.sin(a), np.cos(a)]), np.array([np.cos(a), np.sin(a)])
    fl = weich(P([tuple(ende + 20*t), tuple(ende + 13*n - 1*t), tuple(ende - 13*n - 1*t)]), 1.5)
    k = glatt(U(schaft, stock, ring, arme, fl, spiegel_x(fl)), 3)
    return k, [kreislinie(0, 47, 4.5)]


def flugzeug():
    rumpf = U(E(0, 4, 8, 50))
    fluegel = weich(P([(4, 16), (52, -6), (52, -16), (4, -4)]), 2)
    leitwerk = weich(P([(3, -32), (20, -44), (20, -50), (3, -46)]), 2)
    k = glatt(U(rumpf, fluegel, spiegel_x(fluegel), leitwerk, spiegel_x(leitwerk)), 3)
    return R(k, -45)


def lok():
    kessel = hull(C(-6, 11, 13), C(40, 11, 13))
    fuehrer = weich(box(-46, -4, -6, 38), 2)
    dach = weich(box(-52, 36, -2, 46), 3)
    kamin = weich(P([(25, 20), (35, 20), (40, 44), (20, 44)]), 2)
    rahmen = weich(box(-48, -14, 48, 2), 3)
    raeumer = weich(P([(42, -2), (58, -28), (40, -28)]), 3)
    raeder = [C(x, -24, 11) for x in (-30, -9, 12)]
    k = glatt(U(kessel, fuehrer, dach, kamin, rahmen, raeumer, *raeder), 4)
    det = [LineString([(-38, 12), (-38, 28), (-16, 28), (-16, 12), (-38, 12)]), LineString([(-30, -24), (12, -24)])]
    return k, det + [kreislinie(x, -24, 3) for x in (-30, -9, 12)]


def gitarre():
    koerper = glatt(U(C(0, -26, 25), C(0, 8, 19)), 10)
    hals = box(-7, 16, 7, 62)
    kopf = weich(box(-10, 58, 10, 78), 3)
    k = mass(R(glatt(U(koerper, hals, kopf), 3), -25), 0.9)
    det = [kreislinie(0, -6, 7), LineString([(-9, -34), (9, -34)])]
    return k, [mass(R(d, -25), 0.9) for d in det]


FORMEN = [
    ('apfel', 'Apfel', 'Essen', apfel()),
    ('birne', 'Birne', 'Essen', birne()),
    ('kirschen', 'Kirschen', 'Essen', kirschen()),
    ('erdbeere', 'Erdbeere', 'Essen', erdbeere()),
    ('zitrone', 'Zitrone', 'Essen', zitrone()),
    ('banane', 'Banane', 'Essen', banane()),
    ('karotte', 'Karotte', 'Essen', karotte()),
    ('glace', 'Glace', 'Essen', glace()),
    ('muffin', 'Muffin', 'Essen', muffin()),
    ('pizzastueck', 'Pizzastück', 'Essen', pizzastueck()),
    ('tasse', 'Tasse', 'Essen', tasse()),
    ('auto', 'Auto', 'Dinge', auto()),
    ('segelboot', 'Segelboot', 'Dinge', segelboot()),
    ('rakete', 'Rakete', 'Dinge', rakete()),
    ('ballon', 'Ballon', 'Dinge', ballon()),
    ('kleid', 'Kleid', 'Dinge', kleid()),
    ('t-shirt', 'T-Shirt', 'Dinge', t_shirt()),
    ('socke', 'Socke', 'Dinge', socke()),
    ('faeustling', 'Fäustling', 'Dinge', faeustling()),
    ('schirm', 'Schirm', 'Dinge', schirm()),
    ('anker', 'Anker', 'Dinge', anker()),
    ('flugzeug', 'Flugzeug', 'Dinge', flugzeug()),
    ('lok', 'Dampflok', 'Dinge', lok()),
    ('gitarre', 'Gitarre', 'Dinge', gitarre()),
]
