"""Saisonmotive Herbst und Advent, die noch fehlten: Eichenblatt, Kastanienblatt, Tannenzapfen, Flugdrache,
Rentier, Schlitten, Faltstern. Alles eigene Zeichnungen aus Kreisen, Ellipsen und Strichen."""
from zeichnen import *
from hilfen import *


def linse(x, y, lang, breit, grad):
    """Spitzovales Blatt (zwei Kreisbögen), Mitte (x, y), gedreht um grad (0 = zeigt nach oben)."""
    r = (lang**2/4 + breit**2/4)/breit
    g = C(0, r - breit/2, r).intersection(C(0, breit/2 - r, r))
    return affinity.translate(R(g, grad + 90), x, y)   # die Linse liegt zuerst waagrecht


def eichenblatt():
    """Gelappter Umriss: Ellipsen beidseits der Mittelrippe, Kerben ausgerundet."""
    lappen = [E(sx*(14 - k*1.5), -22 + k*17, 17 - k*1.5, 11, 0) for k in range(4) for sx in (-1, 1)]
    g = U(*lappen, E(0, 36, 11, 14), L([(0, -50), (0, 30)], 7))
    g = glatt(weich(g, 2), 4)
    det = [strich((0, -34), (0, 40))] + [strich((0, -22 + k*17), (sx*(22 - k*2), -16 + k*17)) for k in range(4) for sx in (-1, 1)]
    return g, det


FIEDERN = ((0, 78), (-28, 66), (28, 66), (-56, 50), (56, 50))


def kastanienblatt():
    """Fünf Fiederblätter strahlen vom Stielansatz aus."""
    teile, det = [], []
    for grad, lang in FIEDERN:
        u = np.array([-np.sin(np.radians(grad)), np.cos(np.radians(grad))])
        m = u*(lang/2 - 2); teile.append(linse(m[0], m[1] - 16, lang, lang*0.34, grad))
        a, b = u*2 + (0, -16), u*(lang - 8) + (0, -16); det.append(strich(tuple(a), tuple(b)))
    g = U(*teile, C(0, -16, 6), L([(0, -16), (0, -50)], 6))
    return glatt(g, 1.5), det


def tannenzapfen():
    g = U(E(0, -4, 30, 46), box(-4, 40, 4, 50))
    det = []
    for reihe, y in enumerate(range(-44, 40, 11)):
        for x in range(-30 if reihe % 2 else -24, 31, 12):
            det.append(LineString(bogen(x, y + 8, 7, 200, 340, 12)))
    return g, det


def flugdrache():
    drachen = P([(0, 50), (28, 14), (0, -36), (-28, 14)])
    schnur = L([(0, -36), (-10, -50)], 2.5)
    schleifen = [affinity.translate(R(U(E(-4, 0, 5, 2.5), E(4, 0, 5, 2.5)), 40), x, y) for x, y in ((-3, -41), (-7, -47))]
    g = U(drachen, schnur, *schleifen)
    return glatt(g, 1), [strich((0, 50), (0, -36)), strich((-28, 14), (28, 14))]


def rentier():
    """Kopf von vorne mit Geweih."""
    kopf = U(E(0, -6, 26, 30), E(0, -24, 20, 14), E(-30, 4, 13, 7, 25), E(30, 4, 13, 7, -25))
    geweih = []
    for sx in (-1, 1):
        geweih += [L([(sx*12, 20), (sx*20, 38), (sx*16, 52)], 5), L([(sx*19, 36), (sx*32, 44)], 4.5),
                   L([(sx*17, 48), (sx*28, 58)], 4.5), L([(sx*15, 28), (sx*26, 30)], 4)]
    g = glatt(U(kopf, *geweih), 2)
    det = [punkt(-9, 0, 2.5), punkt(9, 0, 2.5), kreislinie(0, -28, 6)]
    return g, det


def schlitten():
    sitz = weich(box(-38, 0, 40, 8), 2)
    lehne = weich(box(-38, 8, -30, 36), 2)
    kufe = U(L([(-46, -14), (40, -14)], 5), L(bogen(40, -4, 10, -90, 90, 16), 5), L([(-46, -14), (-46, -4)], 5))
    stuetzen = U(box(-30, -14, -24, 0), box(20, -14, 26, 0))
    g = glatt(U(sitz, lehne, kufe, stuetzen), 1.5)
    det = [strich((-30, 4), (36, 4)), strich((-34, 12), (-34, 32))]
    return g, det


def faltstern():
    """Achtzackiger Stern, Falzlinien zu Spitzen (Berg) und Einbuchtungen (Tal): nach dem Falten steht er."""
    return P(stern(8, 50, 30)), [strich((0, 0), p) for p in stern(8, 50, 30)]


FORMEN = [
    ('eichenblatt', 'Eichenblatt', 'Natur', eichenblatt(), 12),
    ('kastanienblatt', 'Kastanienblatt', 'Natur', kastanienblatt(), 16),
    ('tannenzapfen', 'Tannenzapfen', 'Natur', tannenzapfen(), 10),
    ('flugdrache', 'Flugdrache', 'Dinge', flugdrache(), 15),
    ('rentier', 'Rentier', 'Tiere', rentier(), 12),
    ('schlitten', 'Schlitten', 'Dinge', schlitten(), 14),
    ('faltstern', 'Faltstern 3D', 'Werkhilfen', faltstern(), 16),
]
