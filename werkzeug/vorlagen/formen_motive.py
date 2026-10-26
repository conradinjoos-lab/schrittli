"""Motive für einzelne Anleitungen (Makramee-Feder, Holzkerze, Tonblatt, Pompon-Flamingo, Hampelclown,
Aquarell-Wolf, Menschenkette, Schneeflocken-Faltschnitt) – eigene Zeichnungen aus den Bausteinen in zeichnen.py."""
from zeichnen import *
from formen_tiere2 import rohr, sym


def _profil(mitte, links, rechts):
    """Umriss aus Mittellinie (Punkte) und Breite links/rechts je Punkt."""
    m = np.asarray(mitte, float); d = np.gradient(m, axis=0)
    n = np.c_[-d[:, 1], d[:, 0]] / np.linalg.norm(d, axis=1)[:, None]      # Normale nach links
    l = m + n*np.asarray(links)[:, None]; r = m - n*np.asarray(rechts)[:, None]
    return P(list(map(tuple, l)) + list(map(tuple, r[::-1])))


def feder():
    t = np.linspace(0, 1, 80)
    mitte = np.c_[10*t**2 - 3*t, -28 + 82*t]                              # leicht gebogener Schaft
    form = np.sin(np.pi*np.clip(t, 0.001, 1)**0.65)**0.7
    fahne = weich(_profil(mitte, 12*form + 0.2, 16*form + 0.2), 1.5)
    kiel = L([(0, -24), (-1, -38), (-3, -50)], 8)
    kerben = [P([(-5, 4), (-30, 14), (-26, 28)]),                           # Spalt zwischen den Federästen, schräg nach oben
              P([(6, 22), (34, 30), (30, 46)])]
    k = glatt(U(fahne.difference(U(*kerben)), kiel), 1)
    return k, [LineString([(x, y) for x, y in mitte if y < 50])]


def flamme():
    pfad = [(0, -24), (1, -6), (-2, 12), (2, 30), (9, 44), (16, 52)]
    k = glatt(U(C(0, -26, 26), rohr(pfad, 25, 2.5, 3)), 3)
    innen = affinity.translate(affinity.scale(k, .45, .5, origin=(0, -26)), 1, -8)
    return k, [LineString(innen.exterior.coords)]


def monstera():
    blatt = U(E(0, 6, 46, 42), hull(E(0, 20, 30, 30), C(4, 56, 4)))        # breites Herz mit Spitze oben
    blatt = blatt.difference(weich(P([(0, -18), (-12, -44), (12, -44)]), 2))   # Bucht am Stielansatz
    blatt = weich(blatt, 3)
    schlitze = []
    for s in (1, -1):
        for yv, w in ((-16, 12), (0, 24), (16, 36)):                        # Seitenadern: Ansatz an der Mittelader, Winkel
            d = np.array([s*np.cos(np.radians(w)), np.sin(np.radians(w))])
            a = np.array([0, yv]) + 15*d; b = np.array([0, yv]) + 70*d
            schlitze.append(hull(C(*a, 3), C(*b, 6)))
    blatt = weich(blatt.difference(U(*schlitze)), 1.5)
    k = glatt(U(blatt, L([(0, -20), (0, -56)], 9)), 3)
    return k, [LineString([(0, -20), (0, 52)])]


def flamingo():
    hals = rohr([(0, -44), (-6, -28), (6, -12), (14, 4), (8, 20), (-4, 30), (-2, 40)], 8, 6.5, 3)
    kopf = E(2, 44, 12, 10, 5)
    schnabel = rohr([(10, 46), (22, 44), (28, 38), (29, 28)], 7.5, 3.6, 3)    # dick ansetzen, in der Mitte nach unten knicken
    lasche = weich(box(-14, -58, 14, -44), 3)
    k = glatt(U(hals, kopf, schnabel, lasche), 3)
    det = [kreislinie(4, 47, 2.4), LineString([(23, 38), (34, 37)]), LineString([(-14, -44), (14, -44)])]
    return k, det


def clown():
    kopf = C(0, 0, 30)
    hut = weich(P([(-22, 22), (22, 26), (9, 64)]), 2)
    bommel = C(9, 66, 8)
    haare = [E(s*33 + s*2*np.cos(np.radians(w)), 4 + 10*np.sin(np.radians(w)), 13, 6.5, s*w) for s in (1, -1) for w in (35, 0, -35)]
    krause = U(E(0, -34, 32, 8), *[C(x, -36, 7) for x in (-26, -13, 0, 13, 26)])
    k = glatt(U(kopf, hut, bommel, *haare, krause), 2.5)
    det = [kreislinie(-10, 8, 3), kreislinie(10, 8, 3), kreislinie(0, -2, 6),
           LineString(bogen(0, -2, 15, 215, 325, 16)), LineString([(-21, 25), (22, 29)])]
    return k, det


def wolf():
    k = U(E(-16, -30, 22, 19), E(-18, -20, 21, 24, -15),                   # Hinterteil mit rundem Schenkel
          hull(C(-14, -26, 21), C(6, 4, 15)),                               # Rumpf steil nach oben
          hull(C(6, 4, 14), C(10, 30, 11)),                                 # Hals
          C(12, 36, 11),                                                    # Kopf
          hull(C(16, 40, 8), C(29, 60, 4.5)),                               # Schnauze nach oben
          weich(P([(2, 40), (-4, 58), (12, 47)]), 1.5),                     # Ohr
          L([(12, -6), (13, -46)], 11), E(17, -48, 8, 4),                   # Vorderbein
          E(-4, -47, 12, 5),                                                # Hinterpfote
          rohr([(-30, -40), (-46, -45), (-62, -42)], 10, 5),                # buschiger Schwanz am Boden
          weich(P([(16, 22), (26, 12), (18, 12)]), 1), weich(P([(18, 12), (26, 2), (18, 2)]), 1))      # Fell an der Brust
    k = glatt(k, 3)
    return k, [kreislinie(15, 43, 1.8)]


def maennchen():
    hand = 9
    k = U(C(0, 30, 13), weich(box(-14, -18, 14, 18), 6),
          L([(-44, 12), (44, 12)], 10),
          box(-50, 12 - hand, -40, 12 + hand), box(40, 12 - hand, 50, 12 + hand),
          L([(-6, -14), (-16, -46)], 12), L([(6, -14), (16, -46)], 12),
          E(-19, -50, 10, 5), E(19, -50, 10, 5))
    k = glatt(k, 3)
    det = [LineString([(-48.5, 12 - hand + 3), (-48.5, 12 + hand - 3)]), LineString([(48.5, 12 - hand + 3), (48.5, 12 + hand - 3)])]
    return k, det


def flocke_falt():
    h = 90; b = h*np.tan(np.radians(30))
    keil = P([(0, 0), (-b, h), (b, h)])
    kante = lambda s, f: (s*b*f, h*f)                                      # Punkt auf der linken (-1) / rechten (+1) Kante
    def dreieck(s, f, tief, breit):
        x, y = kante(s, f); x2, y2 = kante(s, f + breit)
        return LineString([(x, y), (x - s*tief, (y + y2)/2), (x2, y2)])
    def halbkreis(s, f, r):
        x, y = kante(s, f); return C(x, y, r).exterior.intersection(keil)
    zz = [(-b*0.62 + i*b*0.62/3, h - (0 if i % 2 else 11)) for i in range(7)]
    det = [dreieck(-1, .30, 12, .14), halbkreis(1, .45, 9), dreieck(1, .70, 13, .12),
           halbkreis(-1, .72, 8), LineString(zz), LineString([(-6, 0), (0, 12), (6, 0)]).intersection(keil)]
    return keil, det


FORMEN = [
    ('feder', 'Feder', 'Natur', feder()),
    ('flamme', 'Kerzenflamme', 'Feste', flamme()),
    ('monstera', 'Monstera-Blatt', 'Natur', monstera()),
    ('flamingo', 'Flamingo-Kopf', 'Tiere', flamingo()),
    ('clown', 'Clownkopf', 'Dinge', clown()),
    ('wolf', 'Wolf', 'Tiere', wolf()),
    ('maennchen', 'Menschenkette', 'Dinge', maennchen()),
    ('flocke-falt', 'Schneeflocke Faltschnitt', 'Feste', flocke_falt()),
]
