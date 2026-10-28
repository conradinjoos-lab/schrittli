"""Weitere Werkhilfen aus der Liste 3a: Kordelscheibe, Makramee-Federgrund, Stickrahmen-Zuschnitte, Papierhut,
Biegevorlagen für Draht, Sonnenuhr mit Zeiger, Benham-Scheibe."""
from zeichnen import *
from hilfen import *


def ring(g): return LineString(g.exterior.coords)


def kordelscheibe():
    """Kordelscheibe (Strickliesel aus Karton): 8 Schlitze, Loch in der Mitte für die Kordel."""
    g = schlitze(C(0, 0, 50), 8, 50, 10, 3).difference(C(0, 0, 7))
    return g, punkte(kreis_punkte(8, 30, start=112.5), 1.2)


def makramee_feder():
    """Federgrund zum Zurechtschneiden der Fransen: Linse mit Mittelkiel."""
    g = weich(C(-30, 0, 58).intersection(C(30, 0, 58)), 2)
    return g, [strich((0, -46), (0, 44))] + [strich((0, y), (sx*(18 + 0.25*y), y + 12)) for y in range(-36, 30, 11) for sx in (1, -1)]


def stickrahmen(d):
    """Stoffzuschnitt für einen Stickrahmen mit d cm Durchmesser: rundherum 3 cm Zugabe, innen die Rahmenlinie."""
    r = 50*d/(d + 6)
    return C(0, 0, 50), [kreislinie(0, 0, r), strich((-8, 0), (8, 0)), strich((0, -8), (0, 8))]


def papierhut():
    """Partyhut: Sektor 200° mit Klebelasche und Löchern für das Gummiband; Radius 15 cm → Umfang etwa 52 cm."""
    von, bis = -10, 190
    g = P([(0, 0)] + bogen(0, 0, 50, von, bis, 72))
    links = (50*np.cos(np.radians(bis)), 50*np.sin(np.radians(bis)))
    g = U(g, lasche((0, 0), links, 6, 4))
    oe = lambda a: punkt(43*np.cos(np.radians(a)), 43*np.sin(np.radians(a)), 1.5)
    return g, [oe(von + 6), oe(bis - 6)]


def biegevorlage(linie, start):
    """Karte mit der Biegelinie für Draht; der Punkt zeigt, wo der Draht beginnt."""
    return rundbox(-50, -50, 50, 50, 6), [linie, punkt(*start, 2.2)]


def herzlinie():
    h = glatt(U(C(-24, 14, 30), C(24, 14, 30), P([(-50, 0), (50, 0), (0, -56)])), 3)
    return ring(affinity.scale(h, 0.78, 0.78, origin=(0, 0)))


def sonnenuhr(breite=47):
    """Horizontale Sonnenuhr für die Schweiz (47° Nord): Stundenlinien 6 bis 18 Uhr vom Fusspunkt des Zeigers aus."""
    g = rundbox(-50, -50, 50, 50, 6); fuss = (0, -22); det = []
    innen = g.buffer(-4)
    for t in range(6, 19):
        h = np.radians(15*(t - 12))
        if t in (6, 18): th = np.radians(90 if t == 18 else -90)
        else: th = np.arctan(np.sin(np.radians(breite))*np.tan(h))
        ziel = (fuss[0] + 200*np.sin(th), fuss[1] + 200*np.cos(th))
        l = LineString([fuss, ziel]).intersection(innen)
        if not l.is_empty:
            det.append(l); ende = l.coords[-1]; det.append(punkt(ende[0], ende[1], 1.5))
    det.append(strich(fuss, (0, 22)))                                                    # Standlinie des Zeigers
    return g, det


def sonnenuhr_zeiger(breite=47):
    """Zeiger (Gnomon): rechtwinkliges Dreieck, der Winkel am Fuss ist die geografische Breite; unten eine Klebelasche."""
    b = 45; h = b*np.tan(np.radians(breite))
    g = U(P([(0, 0), (b, 0), (b, h)]), box(0, -7, b, 0))
    return g, [strich((0, 0), (b, 0))]


def benham():
    """Benham-Scheibe: obere Hälfte schwarz anmalen (Schraffur), unten Bogengruppen; beim Drehen erscheinen Farben."""
    det = [strich((-50, 0), (50, 0))]
    for y in np.arange(2, 49, 2): x = np.sqrt(50**2 - y**2); det.append(strich((-x, y), (x, y)))
    for k in range(4):
        for dr in (0, 3, 6): det.append(LineString(bogen(0, 0, 14 + 8*k + dr, -180 + 45*k + 3, -135 + 45*k - 3, 20)))
    return C(0, 0, 50), det + [punkt(0, 0, 2.5)]


W = 'Werkhilfen'
FORMEN = [
    ('kordelscheibe', 'Kordelscheibe', W, kordelscheibe(), 8),
    ('makramee-feder', 'Makramee-Federgrund', W, makramee_feder(), 15),
    ('stickrahmen-10', 'Stickrahmen 10 cm Zuschnitt', W, stickrahmen(10), 16),
    ('stickrahmen-12', 'Stickrahmen 12 cm Zuschnitt', W, stickrahmen(12), 18),
    ('stickrahmen-15', 'Stickrahmen 15 cm Zuschnitt', W, stickrahmen(15), 21),
    ('papierhut', 'Papierhut', W, papierhut(), 30),
    ('biegevorlage-herz', 'Biegevorlage Herz', W, biegevorlage(herzlinie(), (0, -43)), 12),
    ('biegevorlage-stern', 'Biegevorlage Stern', W, biegevorlage(ring(P(stern(5, 42, 19))), (0, 42)), 12),
    ('biegevorlage-spirale', 'Biegevorlage Spirale', W, biegevorlage(spirale(3, 42, 4), (0, 0)), 12),
    ('sonnenuhr', 'Sonnenuhr 47° Nord', W, sonnenuhr(), 15),
    ('sonnenuhr-zeiger', 'Sonnenuhr-Zeiger', W, sonnenuhr_zeiger(), 7),
    ('benham-scheibe', 'Benham-Scheibe', W, benham(), 10),
]
