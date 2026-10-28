"""Raster und Karten als Werkhilfen: Fadengrafik, Lochkarten, Stickkarten, Kreuzstich- und Karoraster, Lineale,
Schilder, Bohrraster. Die Form ist meist ein Blatt, die Punkte und Linien sind Details (werden nur gezeichnet)."""
from zeichnen import *
from hilfen import *


def herzform():
    return glatt(U(C(-24, 14, 30), C(24, 14, 30), P([(-50, 0), (50, 0), (0, -56)])), 3)


def fadengrafik(g, n, rand=6):
    """n Löcher gleichmässig dem Rand entlang."""
    return g, punkte(rand_punkte(g.buffer(-rand).exterior, n), 1.4)


def lochkarte(g, abstand=8):
    return g, innen_punkte(g, abstand, rand=7, r=1.4)


def stickkarte(*linien, abstand=7):
    """Karte 8 × 10 mit Stichlöchern entlang der Motivlinien (geschlossene Ringe oder Striche)."""
    pts = []
    for l in linien: pts += rand_punkte(l, abstand=abstand)
    return rundbox(-40, -50, 40, 50, 6), punkte(pts, 1.4)


def ring(g): return LineString(g.exterior.coords)


haus = [ring(P([(-25, -30), (25, -30), (25, 0), (0, 25), (-25, 0)])), ring(box(-6, -30, 6, -12)), ring(box(8, -8, 18, 2))]
boot = [ring(P([(-30, -14), (30, -14), (22, -30), (-22, -30)])), strich((0, -14), (0, 32)), ring(P([(3, 30), (26, -8), (3, -8)]))]
baum = [ring(P([(-28, -16), (28, -16), (0, 12)])), ring(P([(-20, 6), (20, 6), (0, 32)])), ring(box(-6, -32, 6, -16))]


def kreuzstich(n): return box(0, 0, 100, 100), gitter(0, 0, 100, 100, n, n)
def karo(nx, ny): return box(0, 0, nx*5, ny*5), gitter(0, 0, nx*5, ny*5, nx, ny)


def lineal(cm_lang, hoch):
    """Lineal: Strich bei jedem Millimeter, länger bei 5 mm und 1 cm."""
    e = 100/cm_lang; det = []
    for k in range(cm_lang*10 + 1):
        x = k*e/10; h = hoch*(0.55 if k % 10 == 0 else 0.38 if k % 5 == 0 else 0.22)
        det.append(strich((x, 0), (x, h)))
    return box(0, 0, 100, hoch), det


def bohrraster(n):
    k = int(round(np.sqrt(n))); s = 96/(k + 1)
    return box(-48, -48, 48, 48), punkte([(-48 + s*(i + 1), -48 + s*(j + 1)) for i in range(k) for j in range(k)], 1.6)


W = 'Werkhilfen'
FORMEN = [
    ('fadengrafik-kreis-24', 'Fadengrafik Kreis 24', W, fadengrafik(C(0, 0, 50), 24), 12),
    ('fadengrafik-kreis-36', 'Fadengrafik Kreis 36', W, fadengrafik(C(0, 0, 50), 36), 15),
    ('fadengrafik-quadrat', 'Fadengrafik Quadrat', W, fadengrafik(box(-50, -50, 50, 50), 32), 12),
    ('fadengrafik-dreieck', 'Fadengrafik Dreieck', W, fadengrafik(P(vieleck(3, 56)), 24), 12),
    ('fadengrafik-herz', 'Fadengrafik Herz', W, fadengrafik(herzform(), 30), 12),
    ('fadengrafik-stern', 'Fadengrafik Stern', W, fadengrafik(weich(P(stern(5, 50, 28)), 2), 30, 5), 14),
    ('lochkarte-quadrat', 'Lochkarte Quadrat', W, lochkarte(box(-50, -50, 50, 50)), 12),
    ('lochkarte-kreis', 'Lochkarte Kreis', W, lochkarte(C(0, 0, 50)), 12),
    ('lochkarte-herz', 'Lochkarte Herz', W, lochkarte(herzform()), 12),
    ('lochkarte-stern', 'Lochkarte Stern', W, lochkarte(weich(P(stern(5, 50, 30)), 2), 7), 14),
    ('stickkarte-haus', 'Stickkarte Haus', W, stickkarte(*haus), 10),
    ('stickkarte-boot', 'Stickkarte Boot', W, stickkarte(*boot), 10),
    ('stickkarte-baum', 'Stickkarte Baum', W, stickkarte(*baum), 10),
    ('kreuzstich-10', 'Kreuzstich 10 × 10', W, kreuzstich(10), 10),
    ('kreuzstich-20', 'Kreuzstich 20 × 20', W, kreuzstich(20), 15),
    ('kreuzstich-30', 'Kreuzstich 30 × 30', W, kreuzstich(30), 18),
    ('karo-10x14', 'Karoraster 10 × 14', W, karo(10, 14), 14),
    ('karo-20x28', 'Karoraster 20 × 28', W, karo(20, 28), 14),
    ('punkte-20', 'Punkteraster 20 × 20', W, (box(-50, -50, 50, 50), innen_punkte(box(-50, -50, 50, 50), 5, rand=2.5, r=1)), 12),
    ('isometrie', 'Isometrie-Punkte', W, (box(0, 0, 100, 140), innen_punkte(box(0, 0, 100, 140), 6, rand=3, versetzt=True, r=1)), 14),
    ('linien-20', 'Linienblatt 20 Zeilen', W, (box(0, 0, 100, 140), gitter(0, 0, 100, 140, 1, 20)), 14),
    ('lineal-20', 'Lineal 20 cm', W, lineal(20, 15), 20),
    ('massband-30', 'Massband 30 cm', W, lineal(30, 8), 30),
    ('namensschild', 'Namensschild', W, (rundbox(-50, -18, 50, 18, 6), [punkt(-42, 0, 2), punkt(42, 0, 2)]), 10),
    ('tischkarte', 'Tischkarte', W, (box(-50, -35, 50, 35), [strich((-50, 0), (50, 0))]), 12),
    ('bohrraster-9', 'Bohrraster 3 × 3', W, bohrraster(9), 10),
    ('bohrraster-16', 'Bohrraster 4 × 4', W, bohrraster(16), 10),
    ('bohrraster-rund', 'Bohrraster rund', W, (C(0, 0, 50), punkte(kreis_punkte(8, 34) + [(0, 0)], 1.6)), 10),
]
