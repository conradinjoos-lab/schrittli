"""Formen für den Vorlagen-Generator (Schrittli): alles eigene Zeichnungen aus Kreisen, Ellipsen und Strichen.
Schreibt vorlagen/formen.js (window.FORMEN) und auf Wunsch eine Übersicht als PNG.
Aufruf: python formen.py [<übersicht.png>]"""
import os, sys, json, glob, importlib
from zeichnen import *

HIER = os.path.dirname(os.path.abspath(__file__))
ZIEL = os.path.join(HIER, '..', '..', 'vorlagen', 'formen.js')


def herz():
    """Zwei Bögen oben, Flanken als ganz flache, nach aussen gewölbte Kreisbögen zur Spitze."""
    c, r, gross = np.array([24.0, 12.0]), 26.0, 190.0
    spitze = np.array([0.0, -50.0])
    a = min(np.radians(np.linspace(-90, 0, 9001)),
            key=lambda a: abs(np.hypot(*(c - (gross - r)*np.array([np.cos(a), np.sin(a)]) - spitze)) - gross))
    u = np.array([np.cos(a), np.sin(a)]); m = c - (gross - r)*u           # Mittelpunkt des grossen Bogens
    t = c + r*u                                                          # Berührpunkt am kleinen Kreis
    w0, w1 = np.arctan2(*(t - m)[::-1]), np.arctan2(*(spitze - m)[::-1])
    flanke = [tuple(m + gross*np.array([np.cos(w), np.sin(w)])) for w in np.linspace(w0, w1, 60)]
    rechts = U(C(*c, r), P(flanke + [(0, -50), (0, 12), tuple(c)]), hull(C(*c, r), Point(*spitze)))
    return U(rechts, spiegel_x(rechts))


def ei():
    unten = E(0, 0, 36, 40).intersection(box(-50, -50, 50, 0))
    oben = E(0, 0, 36, 56).intersection(box(-50, 0, 50, 60))
    return U(unten, oben).buffer(0.01)


def blatt():
    b = C(-34, 0, 50).intersection(C(34, 0, 50))
    return affinity.rotate(glatt(U(b, L([(0, -30), (0, -48)], 9)), 3), -35, origin=(0, 0))


def baum():
    t = [P([(-45, -20), (45, -20), (0, 20)]), P([(-36, 5), (36, 5), (0, 40)]), P([(-26, 28), (26, 28), (0, 58)])]
    return U(*t, box(-8, -36, 8, -19))


def pilz():
    hut = E(0, 0, 50, 34).intersection(box(-60, -2, 60, 40))
    s = np.linspace(0, 1, 40); yy = 2 - 42*s
    halb = 11 + 6*s + 2.2*np.sin(np.pi*s)                               # nach unten breiter, Seiten leicht gewölbt
    stiel = weich(P(list(zip(-halb, yy)) + list(zip(halb[::-1], yy[::-1]))), 4)
    return glatt(U(weich(hut, 2.5), stiel), 6)


def fisch():
    k = U(E(0, 0, 44, 27), weich(P([(30, 0), (66, 26), (60, 0), (66, -26)]), 3))
    return glatt(k, 4), [kreislinie(-24, 6, 4), LineString([(-12, -18), (-6, 0), (-12, 18)])]


def vogel():
    k = U(E(0, 0, 36, 24, -8), C(-32, 20, 18),
          weich(P([(-44, 34), (-72, 21), (-44, 10)]), 4.5),
          hull(C(26, 2, 8), C(54, 27, 7.5), C(60, 13, 7.5), C(58, 0, 6.5)))          # Fächerschwanz
    return glatt(k, 4), [kreislinie(-36, 24, 3), LineString(E(6, 2, 18, 9, -20).exterior.coords),
                         LineString([(36, 6), (58, 22)]), LineString([(38, 2), (60, 8)])]


def schmetterling():
    k = U(E(-30, 18, 30, 21, -30), E(30, 18, 30, 21, 30), E(-20, -20, 19, 14, 35), E(20, -20, 19, 14, -35), E(0, 0, 5, 30))
    k = glatt(k, 2)
    return Polygon(k.exterior), [LineString([(-3, 30), (-14, 52)]), LineString([(3, 30), (14, 52)])]


def schneemann():
    return glatt(U(C(0, -24, 30), C(0, 16, 21), C(0, 44, 15)), 3), [kreislinie(-5, 47, 2), kreislinie(5, 47, 2), kreislinie(0, 16, 2), kreislinie(0, 4, 2)]


def hase():
    k = U(E(0, 0, 30, 34), C(0, 44, 22), E(-11, 78, 8, 21, 10), E(11, 78, 8, 21, -10), E(-16, -32, 13, 7), E(16, -32, 13, 7))
    return glatt(k, 4), [kreislinie(-8, 48, 2.5), kreislinie(8, 48, 2.5), E(-11, 78, 3.5, 13, 10).exterior, E(11, 78, 3.5, 13, -10).exterior]


def katze():
    kopf = E(0, 42, 26, 22)
    ohren = [weich(P([(-24, 48), (-22, 76), (-4, 60)]), 2), weich(P([(24, 48), (22, 76), (4, 60)]), 2)]
    k = U(E(0, 0, 26, 32), kopf, *ohren, L([(16+30*np.sin(a), -2-24*np.cos(a)) for a in np.linspace(0.9, 2.8, 12)], 12))
    return glatt(k, 4), [kreislinie(-9, 45, 2.5), kreislinie(9, 45, 2.5), LineString([(-3, 37), (0, 34), (3, 37)])]


def baer():
    k = U(C(0, 52, 25), C(-19, 72, 10), C(19, 72, 10), E(0, 8, 29, 34),
          E(-27, 22, 10, 17, -35), E(27, 22, 10, 17, 35), E(-15, -24, 13, 10), E(15, -24, 13, 10))
    return weich(glatt(k, 9), 3), [kreislinie(-9, 56, 2.5), kreislinie(9, 56, 2.5), E(0, 45, 9, 7).exterior, E(0, 4, 17, 21).exterior]


def elefant():
    t = np.linspace(0, 1, 20)                                            # Rüssel: Bogen nach unten, Spitze nach vorn
    ruessel = [(56 + 16*np.sin(1.4*s) + 6*s**4, 8 - 40*s + 4*s**4) for s in t]
    k = U(E(0, 0, 44, 30), C(40, 12, 24),
          E(18, 20, 18, 26, 8),                                          # grosses Ohr, ragt über Kopf und Rücken
          box(-34, -46, -12, -10).buffer(4), box(10, -46, 32, -10).buffer(4),
          L(ruessel, 13), L(ruessel[:9], 16), L([(-42, 8), (-50, -4)], 11))
    return glatt(k, 4), [LineString(E(18, 20, 12, 19, 8).exterior.coords), kreislinie(48, 20, 2.5)]


def wal():
    a = np.array([60.0, 34.0])
    lappen = [E(*(a + 15*np.array([np.cos(np.radians(w)), np.sin(np.radians(w))])), 17, 8.5, w) for w in (155, 25)]
    schwanz = glatt(U(L([(30, -8), (46, -4), (55, 6), (59, 18), (60, 34)], 16), *lappen), 11)
    k = U(E(0, 0, 50, 30), C(-22, 4, 32), schwanz)
    return glatt(k, 5), [kreislinie(-30, 8, 3.5), LineString([(-48, -10), (-34, -14), (-14, -12)])]


def banane(x, y, rich, laenge, krumm, r0=5.5, r1=4.2):
    """Bananen-Ohr: Kreise entlang eines leicht gebogenen Bogens, zur Spitze schmaler."""
    t = np.linspace(0, 1, 9); w = np.radians(rich + krumm*14*t)
    pkt = np.cumsum(np.c_[np.cos(w), np.sin(w)]*laenge/8, axis=0) - [np.cos(w[0])*laenge/8, np.sin(w[0])*laenge/8]
    return hull(*[C(x + px, y + py, r0 + (r1 - r0)*tt) for (px, py), tt in zip(pkt[:5], t[:5])]).union(
        hull(*[C(x + px, y + py, r0 + (r1 - r0)*tt) for (px, py), tt in zip(pkt[4:], t[4:])]))


def klotzbein(x0, x1, oben, unten, r=4):
    """Breites Guetzli-Bein für ein Beinpaar: Block mit runden Ecken."""
    return box(x0 + r, unten + r, x1 - r, oben).buffer(r, 32)


def lama():
    rumpf = E(-4, 0, 38, 18)
    wolle = [C(-4 + 38*np.cos(t), 18*np.sin(t), 8) for t in np.radians([30, 60, 90, 120, 150, 180, 210])]
    hals = L([(22, 8), (30, 24), (30, 40), (33, 52)], 16)
    kopf = U(C(33, 57, 12), E(44, 53, 12, 8.5, -10))
    ohren = [banane(23, 64, 112, 16, -1, 6.2, 5.6), banane(43, 64, 70, 16, 1, 6.2, 5.6)]
    beine = [klotzbein(-34, -16, -4, -38), klotzbein(8, 26, -4, -38)]     # je Paar ein breites Bein
    k = U(rumpf, *wolle, hals, kopf, *ohren, *beine, E(-44, 8, 8, 10, 30))
    return glatt(k, 5), [kreislinie(40, 58, 2.2)]


def hand():
    """Finger gespreizt um einen Punkt unter der Handfläche, weite runde Buchten, Daumen weit ab."""
    mitte = np.array([2.0, -40.0])
    finger = []
    for w, l in ((119, 84), (101, 94), (83, 92), (65, 80)):
        d = np.array([np.cos(np.radians(w)), np.sin(np.radians(w))])
        finger.append(L([tuple(mitte + 30*d), tuple(mitte + l*d)], 13))
    daumen = L([(-12, -34), (-44, -6)], 14)
    palm = hull(C(-10, -40, 15), C(14, -40, 15), C(-16, -8, 10), C(20, -8, 10))
    return glatt(U(palm, *finger, daumen), 5)


def blume(n=6):
    b = [E(30*np.cos(a), 30*np.sin(a), 22, 15, np.degrees(a)) for a in np.radians(np.arange(n)*360/n + 90)]
    return glatt(U(C(0, 0, 18), *b), 2), [kreislinie(0, 0, 14)]


def mond():
    """Symmetrische Sichel, Hörner rund."""
    return weich(C(0, 0, 50).difference(C(22, 0, 42)), 4.5)


def wolke():
    k = U(C(-30, 0, 20), C(-8, 14, 26), C(20, 10, 22), C(38, -2, 16), box(-44, -16, 46, 0))
    return glatt(weich(k.intersection(box(-60, -16, 60, 60)), 5), 3)


FORMEN = [
    # id, Name, Gruppe, Form
    ('kreis', 'Kreis', 'Grundformen', C(0, 0, 50)),
    ('oval', 'Oval', 'Grundformen', E(0, 0, 50, 34)),
    ('rechteck', 'Rechteck', 'Grundformen', box(-50, -50, 50, 50)),
    ('rechteck-rund', 'Rechteck rund', 'Grundformen', box(-50, -50, 50, 50).buffer(-14).buffer(14)),
    ('dreieck', 'Dreieck', 'Grundformen', P(vieleck(3, 50))),
    ('vieleck', 'Vieleck', 'Grundformen', P(vieleck(6, 50, 0))),          # Ecken stellt der Generator ein
    ('stern', 'Stern', 'Grundformen', P(stern(5, 50, 20))),               # Zacken stellt der Generator ein
    ('herz', 'Herz', 'Grundformen', herz()),
    ('tropfen', 'Tropfen', 'Grundformen', hull(C(0, 0, 30), Point(0, 66))),
    ('ei', 'Ei', 'Grundformen', ei()),
    ('mond', 'Mond', 'Natur', mond()),
    ('wolke', 'Wolke', 'Natur', wolke()),
    ('blatt', 'Blatt', 'Natur', blatt()),
    ('blume', 'Blume', 'Natur', blume()),
    ('baum', 'Tannenbaum', 'Natur', baum()),
    ('pilz', 'Pilz', 'Natur', pilz()),
    ('haus', 'Haus', 'Dinge', P([(-40, -40), (40, -40), (40, 14), (0, 50), (-40, 14)])),
    ('hand', 'Hand', 'Dinge', hand()),
    ('schneemann', 'Schneemann', 'Dinge', schneemann()),
    ('fisch', 'Fisch', 'Tiere', fisch()),
    ('vogel', 'Vogel', 'Tiere', vogel()),
    ('schmetterling', 'Schmetterling', 'Tiere', schmetterling()),
    ('hase', 'Hase', 'Tiere', hase()),
    ('katze', 'Katze', 'Tiere', katze()),
    ('baer', 'Bär', 'Tiere', baer()),
    ('elefant', 'Elefant', 'Tiere', elefant()),
    ('wal', 'Wal', 'Tiere', wal()),
    ('lama', 'Lama', 'Tiere', lama()),
]

# weitere Formen aus formen_<bereich>.py (je eine Liste FORMEN wie oben)
GRUPPEN = ['Grundformen', 'Natur', 'Essen', 'Dinge', 'Feste', 'Tiere']
for _m in [] if os.environ.get('NUR_BASIS') else sorted(glob.glob(os.path.join(HIER, 'formen_*.py'))):
    FORMEN += importlib.import_module(os.path.basename(_m)[:-3]).FORMEN
FORMEN.sort(key=lambda f: GRUPPEN.index(f[2]) if f[2] in GRUPPEN else len(GRUPPEN))



def linien(g):
    """Details → Liste von Punktlisten."""
    if hasattr(g, 'geoms'): return [c for t in g.geoms for c in linien(t)]
    return [np.asarray(g.coords)]


def export():
    out = []
    for fid, name, gruppe, f in FORMEN:
        g, det = (f if isinstance(f, tuple) else (f, []))
        if g.geom_type == 'MultiPolygon': g = max(g.geoms, key=lambda t: t.area)
        g = g.simplify(0.12)
        x0, y0, x1, y1 = g.bounds; s = 100 / max(x1-x0, y1-y0)
        tr = lambda p: [[round((x-x0)*s, 2), round((y1-y)*s, 2)] for x, y in p]    # SVG: y nach unten
        d = [tr(np.asarray(g.exterior.coords)[:-1])]
        dl = [tr(l) for t in det for l in linien(t.simplify(0.12) if hasattr(t, 'simplify') else t)]
        out.append(dict(id=fid, name=name, gruppe=gruppe, w=round((x1-x0)*s, 2), h=round((y1-y0)*s, 2), d=d, det=dl))
    with open(ZIEL, 'w', encoding='utf-8') as f:
        f.write('// erzeugt von werkzeug/vorlagen/formen.py – nicht von Hand ändern\nwindow.FORMEN=')
        json.dump(out, f, ensure_ascii=False, separators=(',', ':')); f.write(';\n')
    return out


def uebersicht(out, png):
    import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
    n = len(out); sp = 8; zl = (n + sp - 1)//sp
    fig, axs = plt.subplots(zl, sp, figsize=(sp*1.6, zl*1.8))
    for ax in axs.flat: ax.axis('off')
    for ax, f in zip(axs.flat, out):
        for p in f['d']: q = np.array(p + p[:1]); ax.fill(q[:, 0], -q[:, 1], color='#f3e3d3', ec='#1c2430', lw=1)
        for l in f['det']: q = np.array(l); ax.plot(q[:, 0], -q[:, 1], color='#8a8178', lw=.7)
        ax.set_aspect('equal'); ax.set_title(f['name'], fontsize=9)
    fig.tight_layout(); fig.savefig(png, dpi=90)


if __name__ == '__main__':
    out = export()
    print(len(out), 'Formen ->', os.path.normpath(ZIEL), f'{os.path.getsize(ZIEL)//1024} KB')
    if len(sys.argv) > 1: uebersicht(out, sys.argv[1])
