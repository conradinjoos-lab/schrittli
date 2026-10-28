"""Werkhilfen zum Knüpfen, Weben und Drehen: Scheiben mit Schlitzen, Webtiere mit Kerben, Zahnräder, Windräder,
Kreisel. Schlitze und Kerben sind in die Form geschnitten, Striche und Punkte sind Details."""
from zeichnen import *
from hilfen import *


def knuepfscheibe(n, tief, breit, loch=6):
    """Kumihimo-Scheibe mit n Schlitzen und Loch in der Mitte."""
    return schlitze(C(0, 0, 50), n, 50, tief, breit).difference(C(0, 0, loch))


def kumihimo_quadrat():
    """Quadratische Knüpfplatte: je 4 Schlitze pro Seite (für flache Bänder), Loch in der Mitte."""
    g = box(-50, -50, 50, 50); xs = [-30, -10, 10, 30]
    for w in (0, 90):
        h = R(g, w)
        h = kerben(h, xs, 50, 10, 2.5); h = kerben(h, xs, -50, 10, 2.5, nach_unten=False)
        g = R(h, -w)
    return g.difference(C(0, 0, 6))


def flechtstern(n):
    """Flechtstern: an jeder Zacke ein Schlitz, in der Mitte ein Loch für die Kordel."""
    g = weich(P(stern(n, 50, 29)), 2)
    return schlitze(g, n, 50, 9, 2.5, 90).difference(C(0, 0, 5))


def webscheibe(n):
    """Rundwebscheibe mit n Schlitzen (ungerade) und Strichen zur Mitte."""
    striche = [strich((0, 0), (40*np.cos(a), 40*np.sin(a))) for a in np.radians(90 + 360*np.arange(n)/n)]
    return schlitze(C(0, 0, 50), n, 50, 9, 2.5), striche + [punkt(0, 0, 2)]


def spinnennetz():
    """Spinnennetz weben: 13 Schlitze, Speichen und drei Ringe als Vorzeichnung."""
    n = 13
    det = [strich((0, 0), (40*np.cos(a), 40*np.sin(a))) for a in np.radians(90 + 360*np.arange(n)/n)]
    return schlitze(C(0, 0, 50), n, 50, 8, 2.5), det + [kreislinie(0, 0, r) for r in (12, 22, 32)] + [punkt(0, 0, 2)]


def sternweben():
    """Sternweben: 12 Schlitze, der Faden wird immer gegenüber eingehängt."""
    return schlitze(C(0, 0, 50), 12, 50, 8, 2.5), [punkt(0, 0, 2)]


def igelrahmen():
    """Igel zum Weben (Blick nach links): Kerben über den Rücken und unten am Bauch, genau gegenüber."""
    koerper = E(5, 0, 45, 30).intersection(box(-60, -16, 60, 40))
    nase = weich(P([(-38, -4), (-64, -14), (-36, 14)]), 3)
    beine = [box(-36, -30, -26, -12), box(34, -30, 44, -12)]
    g = glatt(U(koerper, nase, *beine), 3)
    xs = np.arange(-20, 31, 5)                                            # 11 Kerben
    g = kerben_rand(g, xs, lambda x: 30*np.sqrt(1 - ((x - 5)/45)**2), 4, 1.6)
    g = kerben(g, xs, -16, 4, 1.6, nach_unten=False)
    return g, [punkt(-46, -2, 1.8)]


def huhnrahmen():
    """Huhn zum Weben (Blick nach rechts): Kerben über den Rücken und unten, Kamm, Schnabel und Schwanz."""
    koerper = E(0, -4, 42, 26).intersection(box(-60, -24, 60, 40))
    kopf = C(32, 24, 13); schnabel = weich(P([(42, 27), (58, 22), (42, 17)]), 2)
    kamm = U(C(27, 36, 5), C(34, 38, 5), C(40, 35, 5))
    schwanz = weich(P([(-36, 0), (-58, 32), (-28, 22)]), 4)
    beine = [box(-32, -40, -24, -20), box(22, -40, 30, -20)]
    g = glatt(U(koerper, kopf, schnabel, kamm, schwanz, *beine), 3)
    xs = np.linspace(-22, 12, 7)
    g = kerben_rand(g, xs, lambda x: -4 + 26*np.sqrt(1 - (x/42)**2), 4, 1.6)
    g = kerben(g, xs, -24, 4, 1.6, nach_unten=False)
    return g, [punkt(35, 27, 1.8)]


def zahnrad(n):
    """Zahnrad mit n Zähnen und Achsloch."""
    g = C(0, 0, 40)
    for k in range(n): g = U(g, R(box(-4.5, 30, 4.5, 50), 360*k/n))
    return weich(glatt(g, 1.5), 1.5).difference(C(0, 0, 6))


def windrad_4():
    """Windrad aus einem Quadrat: von den Ecken bis gut zur Mitte einschneiden, je ein Loch pro Flügel."""
    det = [strich((sx*50, sy*50), (sx*18, sy*18)) for sx, sy in ((1, 1), (-1, 1), (-1, -1), (1, -1))]
    return box(-50, -50, 50, 50), det + [punkt(0, 0, 2)] + punkte([(44, 34), (-34, 44), (-44, -34), (34, -44)], 1.6)


def windrad_8():
    """Windrad mit 8 Flügeln aus einem Kreis."""
    det = [strich((50*np.cos(a), 50*np.sin(a)), (18*np.cos(a), 18*np.sin(a))) for a in np.radians(22.5 + 45*np.arange(8))]
    return C(0, 0, 50), det + [punkt(0, 0, 2)] + punkte([(42*np.cos(a), 42*np.sin(a)) for a in np.radians(45*np.arange(8) + 8)], 1.6)


def waermespirale():
    """Wärmekarussell: Spirale als Schnittlinie, Punkt in der Mitte für den Faden."""
    return C(0, 0, 50), [spirale(3.5, 46, 4), punkt(0, 0, 2)]


def helikopter():
    """Papierhelikopter: oben zwei Flügel (Schnittlinie in der Mitte), unten der Stiel mit Falz für die Büroklammer."""
    g = U(box(-15, 5, 15, 50), box(-7, -50, 7, 5))
    return g, [strich((0, 50), (0, 8)), strich((-15, 5), (15, 5)), strich((-7, -38), (7, -38))]


def kreisel_felder(n):
    """Kreiselscheibe mit n Feldern (7 für den Farbkreisel)."""
    det = [strich((6*np.cos(a), 6*np.sin(a)), (48*np.cos(a), 48*np.sin(a))) for a in np.radians(90 + 360*np.arange(n)/n)]
    return C(0, 0, 50), [punkt(0, 0, 2.5)] + det


def kreisel_ringe():
    return C(0, 0, 50), [punkt(0, 0, 2.5)] + [kreislinie(0, 0, r) for r in (10, 20, 30, 40)]


W = 'Werkhilfen'
FORMEN = [
    ('knuepfscheibe-16', 'Knüpfscheibe 16 Schlitze', W, knuepfscheibe(16, 12, 2.2), 12),
    ('knuepfscheibe-32', 'Knüpfscheibe 32 Schlitze', W, knuepfscheibe(32, 10, 1.6), 15),
    ('kumihimo-quadrat', 'Knüpfplatte eckig', W, kumihimo_quadrat(), 12),
    ('flechtstern-5', 'Flechtstern 5', W, flechtstern(5), 12),
    ('flechtstern-6', 'Flechtstern 6', W, flechtstern(6), 14),
    ('flechtstern-8', 'Flechtstern 8', W, flechtstern(8), 14),
    ('webscheibe-7', 'Rundwebscheibe 7', W, webscheibe(7), 10),
    ('webscheibe-11', 'Rundwebscheibe 11', W, webscheibe(11), 12),
    ('webscheibe-13', 'Rundwebscheibe 13', W, webscheibe(13), 14),
    ('spinnennetz', 'Spinnennetz', W, spinnennetz(), 14),
    ('sternweben', 'Sternweben 12', W, sternweben(), 12),
    ('igelrahmen', 'Igel-Webrahmen', W, igelrahmen(), 16),
    ('huhnrahmen', 'Huhn-Webrahmen', W, huhnrahmen(), 16),
    ('zahnrad-8', 'Zahnrad 8', W, zahnrad(8), 10),
    ('zahnrad-12', 'Zahnrad 12', W, zahnrad(12), 12),
    ('zahnrad-16', 'Zahnrad 16', W, zahnrad(16), 14),
    ('windrad-4', 'Windrad 4 Flügel', W, windrad_4(), 15),
    ('windrad-8', 'Windrad 8 Flügel', W, windrad_8(), 16),
    ('waermespirale', 'Wärmespirale', W, waermespirale(), 15),
    ('helikopter', 'Papierhelikopter', W, helikopter(), 18),
    ('kreisel-7', 'Farbkreisel 7 Felder', W, kreisel_felder(7), 10),
    ('kreisel-ringe', 'Kreisel mit Ringen', W, kreisel_ringe(), 10),
]
