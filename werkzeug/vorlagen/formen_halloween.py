"""Halloween und Winter für die Bastelvideos der Werklehrerin: Fledermaus (ganz, Körper, Flügel), Geist, Wintermütze.
Alles eigene Zeichnungen aus Kreisen, Ellipsen und Strichen."""
from zeichnen import *
from hilfen import *


def _bucht(a, b, mitte, tief=0.32):
    """Kreis, der zwischen den Spitzen a und b eine Bucht aus dem Flügel schneidet (Mittelpunkt weg von mitte)."""
    a, b, mitte = np.array(a, float), np.array(b, float), np.array(mitte, float)
    m = (a + b)/2; d = np.hypot(*(b - a)); n = np.array([-(b - a)[1], (b - a)[0]])/d
    if np.dot(n, m - mitte) < 0: n = -n
    h = tief*d
    return C(*(m + n*h), np.hypot(d/2, h))


def _fluegel():
    """Rechter Flügel: Oberkante steigt zur Spitze, Unterkante mit drei Buchten."""
    spitzen = [(52, 22), (41, 4), (27, -5), (12, -12)]
    f = P([(4, 10), (16, 19), (30, 25), (44, 27), *spitzen, (3, -10)])
    for a, b in zip(spitzen, spitzen[1:]):
        f = f.difference(_bucht(a, b, (24, 10)))
    return f


def _kopf():
    ohren = [P([(sx*9, 17), (sx*6, 32), (sx*1.5, 21)]) for sx in (-1, 1)]
    return U(E(0, -1, 10.5, 15), C(0, 14, 10), *[weich(o, 0.8) for o in ohren])


def _gesicht(y=15):
    return [kreislinie(-4, y, 2.2), kreislinie(4, y, 2.2), LineString(bogen(0, y - 1, 3.5, 210, 330))]


def fledermaus():
    f, gross = _fluegel(), lambda g: affinity.scale(g, 1.4, 1.4, origin=(0, 0))
    return glatt(U(gross(_kopf()), f, spiegel_x(f)), 1.5), [gross(t) for t in _gesicht()]


def fledermaus_koerper():
    return _kopf(), _gesicht()


def fledermaus_fluegel():
    f = _fluegel()
    return glatt(U(f, spiegel_x(f), box(-6, -10, 6, 12)), 1.5), [strich((0, -8), (0, 10))]


def geist():
    """Runder Kopf, gerade Seiten, unten drei Wellen, kleine Arme."""
    k = U(C(0, 20, 28), box(-28, -30, 28, 20), *[C(x, -30, 28/3) for x in (-56/3, 0, 56/3)],
          E(-30, 0, 9, 5, 25), E(30, 0, 9, 5, -25))
    return glatt(k, 2), [kreislinie(-9, 18, 3.5), kreislinie(9, 18, 3.5), LineString(E(0, 6, 4, 5.5).exterior.coords)]


def wintermuetze():
    """Kuppel, breites Bündchen mit Rippen, Bommel oben."""
    kuppel = E(0, 0, 40, 40).intersection(box(-50, 0, 50, 50))
    k = U(kuppel, rundbox(-45, -18, 45, 3, 4), C(0, 46, 11))
    return glatt(k, 2.5), [strich((-45, 1), (45, 1))] + [strich((x, -15), (x, -1)) for x in range(-36, 37, 8)]


FORMEN = [
    ('fledermaus', 'Fledermaus', 'Feste', fledermaus(), 14),
    ('fledermaus-koerper', 'Fledermaus Körper', 'Feste', fledermaus_koerper(), 6),
    ('fledermaus-fluegel', 'Fledermaus Flügel', 'Feste', fledermaus_fluegel(), 15),
    ('geist', 'Geist', 'Feste', geist(), 8),
    ('wintermuetze', 'Wintermütze', 'Dinge', wintermuetze(), 12),
]
