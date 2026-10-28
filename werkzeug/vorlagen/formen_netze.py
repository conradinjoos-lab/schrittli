"""Netze und Faltvorlagen als Werkhilfen: Würfel, Quader, Tetraeder, Pyramide, Prisma, Zylinder, Kegel, Schachtel,
Briefumschlag, Laterne, dazu Webblätter und Perlenraster. Klebelaschen hängen an der Form, Falzlinien sind Details."""
from zeichnen import *
from hilfen import *

T = 5    # Laschenbreite


def ring(g): return LineString(g.exterior.coords)


def mit_laschen(g, kanten):
    """Laschen an Kanten (a, b); die Form wird im Uhrzeigersinn umlaufen, dann zeigt die Lasche nach aussen."""
    return U(g, *[lasche(a, b, T, 3) for a, b in kanten])


def wuerfelnetz():
    a = 25; x0, x1 = -a/2, a/2
    sq = lambda x, y: box(x, y, x + a, y + a)
    g = U(sq(x0, 25), sq(x0, 0), sq(x0, -25), sq(x0, -50), sq(x0 - a, 0), sq(x1, 0))
    kanten = [((x0, 50), (x1, 50)), ((x0, 25), (x0, 50)), ((x1, 50), (x1, 25)), ((x0, -25), (x0, 0)), ((x1, 0), (x1, -25)),
              ((x0, -50), (x0, -25)), ((x1, -25), (x1, -50))]
    det = [strich((x0, y), (x1, y)) for y in (25, 0, -25)] + [strich((x0, 0), (x0, 25)), strich((x1, 0), (x1, 25))]
    return mit_laschen(g, kanten), det


def quadernetz():
    a, b, c = 30, 18, 36                                                  # breit, tief, hoch
    x0, x1 = -a/2, a/2
    g = U(box(x0, -c/2, x1, c/2), box(x0, c/2, x1, c/2 + b), box(x0, c/2 + b, x1, c/2 + b + c), box(x0, -c/2 - b, x1, -c/2),
          box(x0 - b, -c/2, x0, c/2), box(x1, -c/2, x1 + b, c/2))
    yo, yh = c/2 + b, c/2 + b + c
    kanten = [((x0, yh), (x1, yh)), ((x0, yo), (x0, yh)), ((x1, yh), (x1, yo)), ((x0, c/2), (x0, yo)), ((x1, yo), (x1, c/2)),
              ((x0, -c/2 - b), (x0, -c/2)), ((x1, -c/2), (x1, -c/2 - b))]
    det = [strich((x0, y), (x1, y)) for y in (c/2, yo, -c/2)] + [strich((x0, -c/2), (x0, c/2)), strich((x1, -c/2), (x1, c/2))]
    return mit_laschen(g, kanten), det


def tetraedernetz():
    h = 100*np.sqrt(3)/2
    A, B, Cc = (-50, -h/3), (50, -h/3), (0, 2*h/3)
    m = lambda p, q: ((p[0] + q[0])/2, (p[1] + q[1])/2)
    g = P([A, B, Cc])
    kanten = [(A, m(A, Cc)), (Cc, m(Cc, B)), (B, m(B, A))]
    det = [ring(P([m(A, B), m(B, Cc), m(Cc, A)]))]
    return mit_laschen(g, kanten), det


def pyramidennetz():
    g = U(box(-20, -20, 20, 20), P([(-20, 20), (20, 20), (0, 55)]), P([(20, 20), (20, -20), (55, 0)]),
          P([(20, -20), (-20, -20), (0, -55)]), P([(-20, -20), (-20, 20), (-55, 0)]))
    kanten = [((0, 55), (20, 20)), ((55, 0), (20, -20)), ((0, -55), (-20, -20)), ((-55, 0), (-20, 20))]
    return mit_laschen(g, kanten), [ring(box(-20, -20, 20, 20))]


def prismanetz():
    g = U(box(-45, -25, 45, 25), P([(-15, 25), (15, 25), (0, 51)]), P([(-15, -25), (15, -25), (0, -51)]))
    kanten = [((45, 25), (45, -25)), ((-45, 25), (-15, 25)), ((15, 25), (45, 25)), ((-15, -25), (-45, -25)), ((45, -25), (15, -25))]
    det = [strich((x, -25), (x, 25)) for x in (-15, 15)] + [strich((-15, y), (15, y)) for y in (-25, 25)]
    return mit_laschen(g, kanten), det


def zylindernetz():
    r = 100/(2*np.pi)
    g = U(box(-50, -20, 50, 20), C(0, 22 + r, r), C(0, -22 - r, r), box(-4, 19, 4, 23), box(-4, -23, 4, -19))
    return mit_laschen(g, [((50, 20), (50, -20))]), [strich((-50, 20), (50, 20)), strich((-50, -20), (50, -20))]


def kegelnetz():
    """Kegel: Mantel 50 lang, Grundkreis 20 → Sektor von 144°, Grundkreis oben angehängt."""
    a = 360*20/50
    sektor = P([(0, 0)] + bogen(0, 0, 50, 90 - a/2, 90 + a/2, 48))
    g = U(sektor, C(0, 72, 20), box(-4, 49, 4, 53))
    e = (50*np.cos(np.radians(90 - a/2)), 50*np.sin(np.radians(90 - a/2)))
    return mit_laschen(g, [(e, (0, 0))]), [strich((-4, 50), (4, 50))]


def faltschachtel():
    g = U(box(-20, -20, 20, 20), box(-20, 20, 20, 36), box(-20, -36, 20, -20), box(-36, -20, -20, 20), box(20, -20, 36, 20))
    kanten = [((20, 36), (20, 20)), ((-20, 20), (-20, 36)), ((-20, -36), (-20, -20)), ((20, -20), (20, -36))]
    return mit_laschen(g, kanten), [ring(box(-20, -20, 20, 20))]


def briefumschlag():
    g = U(box(-40, -25, 40, 25), P([(-40, 25), (40, 25), (0, 55)]), P([(-40, -25), (40, -25), (0, -48)]),
          P([(-40, -25), (-40, 25), (-60, 0)]), P([(40, -25), (40, 25), (60, 0)]))
    return weich(g, 2), [ring(box(-40, -25, 40, 25))]


def laterne():
    """Laternenmantel für eine viereckige Laterne: 4 Felder mit Fenster, Lasche rechts, Löcher für den Draht."""
    g = box(-50, -27.5, 50, 27.5)
    for x in (-37.5, -12.5, 12.5, 37.5): g = g.difference(rundbox(x - 8, -18, x + 8, 18, 4))
    g = mit_laschen(g, [((50, 27.5), (50, -27.5))])
    return g, [strich((x, -27.5), (x, 27.5)) for x in (-25, 0, 25)] + [punkt(-37.5, 23.5, 1.5), punkt(12.5, 23.5, 1.5)]


def senkrechte(g, xs, abstand):
    """Schnittlinien von unten bis «abstand» unter den oberen Rand (Papierweben in runden Formen)."""
    det = []
    for x in xs:
        y0, y1 = LineString([(x, -500), (x, 500)]).intersection(g).bounds[1::2]
        det.append(strich((x, y0), (x, y1 - abstand)))
    return det


def webblatt(n):
    g = E(0, 0, 32, 50); det = []
    for y in np.linspace(-38, 38, n):
        x0, x1 = LineString([(-500, y), (500, y)]).intersection(g).bounds[0::2]
        det.append(strich((x0, y), (x1 - 7, y)))
    return g, det


def herzform():
    return glatt(U(C(-24, 14, 30), C(24, 14, 30), P([(-50, 0), (50, 0), (0, -56)])), 3)


def perlenraster(n):
    f = 100/36; b = n*f
    return box(0, 0, b, 100), gitter(0, 0, b, 100, n, 36)


W = 'Werkhilfen'
FORMEN = [
    ('wuerfelnetz', 'Würfelnetz', W, wuerfelnetz(), 16),
    ('quadernetz', 'Quadernetz', W, quadernetz(), 18),
    ('tetraedernetz', 'Tetraedernetz', W, tetraedernetz(), 16),
    ('pyramidennetz', 'Pyramidennetz', W, pyramidennetz(), 16),
    ('prismanetz', 'Prismanetz', W, prismanetz(), 16),
    ('zylindernetz', 'Zylindernetz', W, zylindernetz(), 20),
    ('kegelnetz', 'Kegelnetz', W, kegelnetz(), 18),
    ('faltschachtel', 'Faltschachtel', W, faltschachtel(), 16),
    ('briefumschlag', 'Briefumschlag', W, briefumschlag(), 16),
    ('laternenmantel', 'Laternenmantel', W, laterne(), 30),
    ('webblatt-6', 'Webblatt 6 Streifen', W, webblatt(6), 14),
    ('webblatt-14', 'Webblatt 14 Streifen', W, webblatt(14), 18),
    ('streifenblatt', 'Streifenblatt 14 Streifen', W, (box(0, 0, 100, 140), gitter(0, 0, 100, 140, 1, 14)), 14),
    ('webkreis', 'Webkreis', W, (C(0, 0, 50), senkrechte(C(0, 0, 50), range(-40, 41, 10), 10)), 12),
    ('webherz', 'Webherz', W, (herzform(), senkrechte(herzform(), range(-40, 41, 10), 9)), 12),
    ('perlenraster-7', 'Perlen-Raster 7', W, perlenraster(7), 18),
    ('perlenraster-9', 'Perlen-Raster 9', W, perlenraster(9), 18),
    ('perlenraster-11', 'Perlen-Raster 11', W, perlenraster(11), 18),
]
