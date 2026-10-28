"""Fasnachtsmasken für Kinder (Augenpartie-Masken mit echten Augenlöchern und zwei Löchern für das Gummiband)
und runde Gesichter für Gefühle-Stempel. Alles eigene Zeichnungen aus Kreisen, Ellipsen, Strichen und Vielecken."""
from zeichnen import *
from hilfen import *

M = 'Masken'
AUGE_Y = 3                       # Augenmitte leicht über der Mitte
AUGE = (7, 4.5)                  # Augenloch 14 × 9 Einheiten
AUGE_X = 17


def kurve(pkt, n=16):
    """Geschlossene, weiche Kurve (Catmull-Rom) durch die Punkte."""
    p = np.array(pkt, float); m = len(p); t = np.linspace(0, 1, n, endpoint=False)[:, None]; aus = []
    for i in range(m):
        p0, p1, p2, p3 = p[i - 1], p[i], p[(i + 1) % m], p[(i + 2) % m]
        aus.append(0.5*((2*p1) + (-p0 + p2)*t + (2*p0 - 5*p1 + 4*p2 - p3)*t**2 + (-p0 + 3*p1 - 3*p2 + p3)*t**3))
    return P(np.vstack(aus)).buffer(0)


def sym(g):
    """Rechte Hälfte mit dem Spiegelbild vereinigen."""
    return U(g, spiegel_x(g))


def ring(g):
    """Umriss einer Form als Detail-Linie."""
    return LineString(g.exterior.coords)


def dreieck(a, b, c, r=2):
    return weich(P([a, b, c]), r)


def maske(k, det=(), band_y=0, rand=6.5):
    """Augenlöcher und die beiden Gummiband-Löcher ausstanzen; die Bandlöcher sitzen rand Einheiten innerhalb
    des linken und rechten Rands auf der Höhe band_y."""
    for sx in (-1, 1): k = k.difference(E(sx*AUGE_X, AUGE_Y, *AUGE))
    x0, _, x1, _ = k.intersection(LineString([(-200, band_y), (200, band_y)])).bounds
    k = k.difference(C(x0 + rand, band_y, 1.6)).difference(C(x1 - rand, band_y, 1.6))
    return k, list(det)


def maske_katze():
    """Breites Gesicht mit Backen, spitze Ohren oben, Nasendreieck und Schnurrhaare als Striche."""
    gesicht = U(E(0, 0, 50, 21), E(-26, -5, 22, 17), E(26, -5, 22, 17))
    ohren = sym(dreieck((16, 10), (40, 10), (31, 44), 2.5))
    k = glatt(U(gesicht, ohren), 4).difference(E(0, -27, 8, 8))          # Kerbe für die Nase
    k = glatt(k, 2)
    det = [LineString([(-4, -7), (4, -7), (0, -12), (-4, -7)]), strich((0, -12), (0, -16))]
    for sx in (-1, 1):
        det += [strich((sx*8, -9), (sx*30, -6)), strich((sx*8, -12), (sx*30, -13)), strich((sx*8, -15), (sx*28, -20))]
    return maske(k, det, band_y=-2)


def maske_fuchs():
    """Spitzes Fuchsgesicht: grosse Ohren, Backen laufen seitlich spitz aus, Schnauze nach unten."""
    halb = [(0, 16), (14, 19), (26, 24), (34, 46), (44, 24), (50, 12), (48, -2), (40, -14), (24, -22), (10, -32), (0, -36)]
    k = glatt(weich(sym(P([(0, 40)] + halb + [(0, -40)])), 2.5), 3)
    det = [kreislinie(0, -29, 3.2), strich((0, -22), (0, -26)),
           LineString([(-12, -4), (-2, -14), (0, -22), (2, -14), (12, -4)]),      # helle Schnauze
           ring(E(30, 26, 3, 7, -14)), ring(E(-30, 26, 3, 7, 14))]                  # Ohr-Innenseiten
    return maske(k, det, band_y=2)


def maske_superheld():
    """Klassische Augenmaske: Bogen über den Augen, Aussenecken laufen oben spitz nach aussen."""
    halb = [(0, 14), (12, 17), (26, 19), (40, 22), (50, 30), (49, 16), (44, 2), (36, -9), (24, -13), (12, -11), (4, -6), (0, -4)]
    k = glatt(weich(sym(P([(0, 20)] + halb + [(0, -20)])), 2), 4)
    return maske(k, [], band_y=4)


def maske_schmetterling():
    """Flügel seitlich (oben gross, unten klein), Körper in der Mitte, zwei Fühler mit Knopf."""
    fluegel = U(E(30, 8, 26, 19, 10), E(26, -10, 19, 12, -15))
    koerper = E(0, 0, 8, 21)
    fuehler = U(L([(5, 16), (12, 33)], 7.5), C(13, 35, 5))
    k = glatt(U(sym(fluegel), koerper, sym(fuehler)), 3)
    det = [ring(E(sx*36, 10, 8, 6, 10)) for sx in (-1, 1)] + [ring(E(sx*30, -12, 5, 4)) for sx in (-1, 1)]
    return maske(k, det, band_y=4)


def maske_eule():
    """Rundes Gesicht mit Federbüscheln oben, Federkränzen um die Augen und einem Schnabel in der Mitte."""
    gesicht = E(0, 0, 50, 24)
    bueschel = sym(dreieck((18, 8), (42, 12), (38, 40), 3))
    schnabel = dreieck((-7, -3), (7, -3), (0, -24), 2)
    k = glatt(U(gesicht, bueschel, schnabel), 4)
    det = [kreislinie(sx*AUGE_X, AUGE_Y, 11) for sx in (-1, 1)] + [strich((0, -6), (0, -18))]
    det += [strich((sx*28, 16), (sx*34, 30)) for sx in (-1, 1)]
    return maske(k, det, band_y=0)


def maske_baer():
    """Rundes Gesicht mit runden Ohren und kurzer Schnauze; Nase und Maul als Striche."""
    k = glatt(U(E(0, 0, 50, 23), C(-31, 20, 13), C(31, 20, 13), E(0, -12, 20, 13)), 4)
    det = [ring(E(0, -10, 6, 4)), strich((0, -14), (0, -19)), LineString(bogen(-5, -19, 5, 200, 340, 10)),
           LineString(bogen(5, -19, 5, 200, 340, 10)), kreislinie(-31, 22, 6), kreislinie(31, 22, 6)]
    return maske(k, det, band_y=0)


def maske_loewe():
    """Gesicht mit Mähne als Zackenkranz rundherum; Nase, Maul und Schnurrhaare als Striche."""
    maehne = affinity.scale(P(stern(14, 55, 41)), 1, 0.8, origin=(0, 0))
    k = glatt(weich(U(maehne, E(0, 0, 36, 24)), 3.5), 3)
    det = [ring(E(0, -9, 5.5, 3.5)), strich((0, -12), (0, -17)), LineString(bogen(-5, -17, 5, 200, 340, 10)),
           LineString(bogen(5, -17, 5, 200, 340, 10)), ring(E(0, 0, 35, 23))]
    for sx in (-1, 1): det += [strich((sx*9, -10), (sx*27, -7)), strich((sx*9, -13), (sx*27, -16))]
    return maske(k, det, band_y=0)


def maske_hase():
    """Hohe Maske: ovales Gesicht mit zwei langen Ohren nach oben; Innenohren, Nase und Zähne als Striche."""
    ohren = sym(E(15, 48, 10, 30, -8))
    k = Polygon(glatt(U(E(0, -2, 46, 24), ohren), 5).exterior)             # Zwickel zwischen den Ohren füllen
    k = glatt(k.difference(E(0, -28, 7, 7)), 2)
    det = [ring(E(sx*15, 50, 4.5, 20, -sx*8)) for sx in (-1, 1)]
    det += [LineString([(-4, -8), (4, -8), (0, -13), (-4, -8)]), strich((0, -13), (0, -17)),
            strich((-8, -17), (8, -17)), strich((-4, -17), (-4, -21)), strich((4, -17), (4, -21)), strich((-4, -21), (4, -21))]
    for sx in (-1, 1): det += [strich((sx*8, -10), (sx*30, -8)), strich((sx*8, -14), (sx*30, -17))]
    return maske(k, det, band_y=-2)


# Gesichter für Gefühle-Stempel: Kreis als Form, Augen und Mund als Details
def gesicht(det): return C(0, 0, 50), det


augen = lambda r=4: [punkt(-16, 12, r), punkt(16, 12, r)]
FORMEN = [
    ('maske-katze', 'Katzenmaske', M, maske_katze(), 18),
    ('maske-fuchs', 'Fuchsmaske', M, maske_fuchs(), 18),
    ('maske-superheld', 'Superhelden-Maske', M, maske_superheld(), 18),
    ('maske-schmetterling', 'Schmetterlingsmaske', M, maske_schmetterling(), 18),
    ('maske-eule', 'Eulenmaske', M, maske_eule(), 18),
    ('maske-baer', 'Bärenmaske', M, maske_baer(), 18),
    ('maske-loewe', 'Löwenmaske', M, maske_loewe(), 18),
    ('maske-hase', 'Hasenmaske', M, maske_hase(), 22),
    ('gesicht-froh', 'Gesicht froh', M, gesicht(augen() + [LineString(bogen(0, -4, 24, 205, 335, 20))]), 8),
    ('gesicht-traurig', 'Gesicht traurig', M, gesicht(augen() + [LineString(bogen(0, -40, 24, 35, 145, 20)), punkt(-16, 1, 2)]), 8),
    ('gesicht-wuetend', 'Gesicht wütend', M, gesicht(augen() + [strich((-27, 30), (-8, 21)), strich((8, 21), (27, 30)),
                                                              LineString(bogen(0, -38, 22, 40, 140, 20))]), 8),
    ('gesicht-muede', 'Gesicht müde', M, gesicht([LineString(bogen(sx*16, 13, 7, 200, 340, 12)) for sx in (-1, 1)] +
                                                [strich((-23, 13), (-9, 13)), strich((9, 13), (23, 13)),
                                                 strich((-9, -18), (9, -18))]), 8),
    ('gesicht-erstaunt', 'Gesicht erstaunt', M, gesicht([kreislinie(sx*16, 12, 6.5) for sx in (-1, 1)] + augen(2) +
                                                      [LineString(bogen(sx*16, 20, 9, 35, 145, 12)) for sx in (-1, 1)] +
                                                      [kreislinie(0, -18, 8)]), 8),
]
