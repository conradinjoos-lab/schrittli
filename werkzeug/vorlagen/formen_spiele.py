"""Spielbretter und Puzzles als Werkhilfen: Mühle, Tic-Tac-Toe, Solitär, Halma, Puzzle mit Knopf-Schnittlinien."""
from zeichnen import *
from hilfen import *


def ring(g): return LineString(g.exterior.coords)


def muehle():
    det = [ring(box(-r, -r, r, r)) for r in (42, 28, 14)]
    det += [strich((0, 42), (0, 14)), strich((0, -42), (0, -14)), strich((42, 0), (14, 0)), strich((-42, 0), (-14, 0))]
    pts = [(sx*r, sy*r) for r in (42, 28, 14) for sx, sy in ((1, 1), (1, -1), (-1, 1), (-1, -1), (0, 1), (0, -1), (1, 0), (-1, 0))]
    return box(-50, -50, 50, 50), det + punkte(pts, 2.2)


def tictactoe(): return box(-50, -50, 50, 50), gitter(-50, -50, 50, 50, 3, 3)


def solitaer():
    pts = [(i*11, j*11) for i in range(-3, 4) for j in range(-3, 4) if not (abs(i) > 1 and abs(j) > 1)]   # 33 Mulden
    return C(0, 0, 50), punkte(pts, 2.2)


def halma():
    """Halma-Stern mit 121 Feldern: 17 Reihen auf einem Dreiecksgitter."""
    s = 6.2; rr = 7.9*s
    g = U(P(vieleck(3, rr, 90)), P(vieleck(3, rr, -90)))
    reihen = [1, 2, 3, 4, 13, 12, 11, 10, 9, 10, 11, 12, 13, 4, 3, 2, 1]
    pts = [((i - (n - 1)/2)*s, (8 - k)*s*np.sqrt(3)/2) for k, n in enumerate(reihen) for i in range(n)]
    return g, punkte(pts, 1.5)


def _knopf(m, y, r, s):
    """Schnittlinie mit Knopf: Hals bei m, Kopf (Radius r) nach oben (s=1) oder unten (s=-1)."""
    hals, lang, mitte = 0.5*r, 0.65*r, 1.5*r
    a = np.degrees(np.arctan2(lang - mitte, -hals))                     # linkes Halsende, vom Kopfmittelpunkt aus (~ -120°)
    pts = [(m - hals, y), (m - hals, y + lang)] + bogen(m, y + mitte, r, a + 360, -180 - a, 24) + [(m + hals, y + lang), (m + hals, y)]
    return [(x, y + (yy - y)*s) for x, yy in pts]


def puzzle(nx, ny, w, h):
    """Puzzle nx × ny Teile auf w × h. Jedes Teil hat zwei gegenüberliegende Knöpfe und zwei Löcher,
    deshalb Vorzeichen bei den senkrechten Linien umgekehrt: sonst stossen die Köpfe an jeder Ecke zusammen."""
    pw, ph = w/nx, h/ny; r = min(pw, ph)*0.15; det = []
    for j in range(1, ny):
        y = -h/2 + j*ph; pts = [(-w/2, y)]
        for i in range(nx): pts += _knopf(-w/2 + (i + 0.5)*pw, y, r, 1 if (i + j) % 2 else -1)
        det.append(LineString(pts + [(w/2, y)]))
    for i in range(1, nx):
        x = -w/2 + i*pw; pts = [(x, -h/2)]
        for j in range(ny): pts += [(x + (yy - (-h/2 + (j + 0.5)*ph)), -h/2 + (j + 0.5)*ph + (xx - x)) for xx, yy in _knopf(x, -h/2 + (j + 0.5)*ph, r, -1 if (i + j) % 2 else 1)]
        det.append(LineString(pts + [(x, h/2)]))
    return box(-w/2, -h/2, w/2, h/2), det


W = 'Werkhilfen'
FORMEN = [
    ('muehle', 'Mühle-Spielbrett', W, muehle(), 20),
    ('tictactoe', 'Tic-Tac-Toe-Brett', W, tictactoe(), 12),
    ('solitaer', 'Solitär-Brett', W, solitaer(), 15),
    ('halma', 'Halma-Stern', W, halma(), 24),
    ('puzzle-4', 'Puzzle 4 Teile', W, puzzle(2, 2, 100, 100), 12),
    ('puzzle-6', 'Puzzle 6 Teile', W, puzzle(3, 2, 100, 70), 15),
    ('puzzle-9', 'Puzzle 9 Teile', W, puzzle(3, 3, 100, 100), 15),
    ('puzzle-12', 'Puzzle 12 Teile', W, puzzle(4, 3, 100, 75), 18),
]
