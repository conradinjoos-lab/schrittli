"""Scheiben, Rahmen und Raster zum Weben, Knüpfen und Nageln – Schlitze und Kerben sind in die Form geschnitten,
Markierungen (Löcher, Nägel, Schnittlinien) sind Details."""
from zeichnen import *


def _schlitze(g, n, r, tief, breit, start=90):
    """n Schlitze von aussen (Radius r) gegen die Mitte, je tief lang und breit breit, innen rund."""
    for k in range(n):
        a = np.radians(start + 360*k/n); u = np.array([np.cos(a), np.sin(a)])
        g = g.difference(L([tuple(u*(r + 5)), tuple(u*(r - tief))], breit))
    return g


def _kerben(g, xs, y, tief, breit, nach_unten=True):
    """Kerben an einer waagrechten Kante bei y, an den Stellen xs."""
    s = -1 if nach_unten else 1
    for x in xs: g = g.difference(L([(x, y - s*5), (x, y + s*tief)], breit))
    return g


def _punkt(x, y, r=1.6): return kreislinie(x, y, r)


def knuepfscheibe():
    """Kumihimo: 8 Schlitze, Loch in der Mitte (bei 10 cm: Schlitze 1,6 cm tief, Loch 1,2 cm)."""
    return _schlitze(C(0, 0, 50), 8, 50, 16, 3, 90).difference(C(0, 0, 6))


def webscheibe():
    """Rundweben: 9 Schlitze (ungerade, sonst geht drüber-drunter nicht auf); Striche zur Mitte wie bei einer Pizza."""
    n = 9
    striche = [LineString([(0, 0), (40*np.cos(a), 40*np.sin(a))]) for a in np.radians(90 + 360*np.arange(n)/n)]
    return _schlitze(C(0, 0, 50), n, 50, 9, 2.5), striche + [_punkt(0, 0, 2)]


def webblume():
    """Sonnenblume zum Weben: 13 Zacken (ungerade), der Faden wird über die Zacken gespannt."""
    n, ra, ri = 13, 50, 36
    pkt = [((ra if k % 2 == 0 else ri)*np.cos(np.radians(90 + 180*k/n)), (ra if k % 2 == 0 else ri)*np.sin(np.radians(90 + 180*k/n)))
           for k in range(2*n)]
    return weich(P(pkt), 2.5), [kreislinie(0, 0, 14)]


def fallschirm():
    """Ein Viertel vom Schirm, weil der ganze Kreis nicht auf A4 passt: Papier zweimal falten, die Ecke ist die Mitte.
    Bei 19 cm wird der Schirm 38 cm gross, das Loch 3,8 cm. Zwei Punkte für die Leinen (aufgefaltet 8)."""
    g = C(0, 0, 100).intersection(box(0, 0, 100, 100)).difference(C(0, 0, 10))
    return g, [_punkt(92*np.cos(a), 92*np.sin(a), 1.4) for a in np.radians([22.5, 67.5])]


def traumfaenger():
    """Pappteller-Ring: Mitte weg, 12 Lochmarken rundherum."""
    g = C(0, 0, 50).difference(C(0, 0, 35))
    return g, [_punkt(42.5*np.cos(a), 42.5*np.sin(a), 1.8) for a in np.radians(90 + 30*np.arange(12))]


def webrahmen():
    """Karton 12 × 16 cm, oben und unten alle 1 cm eine Kerbe (11 Stück)."""
    cm = 100/16; b, h = 12*cm, 16*cm
    g = box(-b/2, -h/2, b/2, h/2)
    xs = [(-5 + k)*cm for k in range(11)]
    g = _kerben(g, xs, h/2, 0.7*cm, 0.25*cm)
    return _kerben(g, xs, -h/2, 0.7*cm, 0.25*cm, nach_unten=False)


def perlenwebrahmen():
    """Karton 10 × 24 cm (passt auf A4), oben und unten je 8 Schlitze im Abstand von 4 mm, genau gegenüber;
    Striche 1 cm vom Rand zeigen, wo die Kartonstreifen hinkommen."""
    cm = 100/24; b, h = 10*cm, 24*cm
    g = box(-b/2, -h/2, b/2, h/2)
    xs = [(-1.4 + 0.4*k)*cm for k in range(8)]
    g = _kerben(g, xs, h/2, 0.8*cm, 0.15*cm)
    g = _kerben(g, xs, -h/2, 0.8*cm, 0.15*cm, nach_unten=False)
    return g, [LineString([(-b/2, y), (b/2, y)]) for y in (h/2 - cm, -h/2 + cm)]


def webquadrat():
    """Papierweben: 10 Spalten, oben bleibt ein Rand von einer Spaltenbreite (bei 10 cm: alle 1 cm, Rand 1 cm).
    Die Linien schneidet man von unten bis zum Rand ein."""
    s = 10
    return box(0, 0, 100, 100), [LineString([(x, 0), (x, 100 - s)]) for x in range(s, 100, s)] + [LineString([(0, 100 - s), (100, 100 - s)])]


def perlenraster():
    """Entwurfsblatt fürs Perlenweben: 5 Perlen breit, 36 Reihen (bei 18 cm Höhe: Felder 5 mm)."""
    f = 100/36; b = 5*f
    det = [LineString([(x*f, 0), (x*f, 100)]) for x in range(1, 5)] + [LineString([(0, y*f), (b, y*f)]) for y in range(1, 36)]
    return box(0, 0, b, 100), det


def nagelbrett():
    """Brett 15 × 15 cm: Diagonalen, Mittellinien, Kreis; Punkte = Nägel (Mitte, aussen auf jeder Linie, auf dem Kreis)."""
    r, k = 50, 30
    det = [LineString([(-r, -r), (r, r)]), LineString([(-r, r), (r, -r)]), LineString([(-r, 0), (r, 0)]), LineString([(0, -r), (0, r)]),
           LineString(C(0, 0, k).exterior.coords), _punkt(0, 0)]
    for a in np.radians(45*np.arange(8)):
        aussen = 42 if round(np.degrees(a)) % 90 == 0 else 42*np.sqrt(2)
        u = np.array([np.cos(a), np.sin(a)])
        det += [_punkt(*(u*aussen)), _punkt(*(u*k))]
    return box(-r, -r, r, r), det


def lamarahmen():
    """Lama zum Weben (Blick nach links): gerader Rücken und Bauch mit je 9 Kerben, dort wird die Kette gespannt."""
    rumpf = box(-26, -12, 40, 16)
    hals = box(-36, 6, -18, 58)
    kopf = U(weich(box(-44, 44, -18, 66), 5), weich(box(-52, 44, -38, 56), 4))
    ohren = [weich(P([(-38, 64), (-34, 80), (-28, 64)]), 1.5), weich(P([(-28, 64), (-22, 79), (-19, 64)]), 1.5)]
    beine = [box(-26, -46, -12, -6), box(26, -46, 40, -6)]               # vorne und hinten je ein breites Bein
    schwanz = weich(box(34, 6, 48, 22), 4)
    g = glatt(weich(U(rumpf, hals, kopf, *ohren, *beine, schwanz), 2.5), 3)
    xs = list(np.linspace(-6, 22, 8))                                     # Kerben nur über dem freien Bauch, oben genau gegenüber
    g = _kerben(g, xs, 16, 4.5, 1.6)
    g = _kerben(g, xs, -12, 4.5, 1.6, nach_unten=False)
    return g, [_punkt(-38, 57, 1.8)]


FORMEN = [
    ('knuepfscheibe', 'Knüpfscheibe', 'Dinge', knuepfscheibe()),
    ('webscheibe', 'Rundwebscheibe', 'Dinge', webscheibe()),
    ('webblume', 'Webblume', 'Dinge', webblume()),
    ('traumfaenger', 'Traumfänger-Ring', 'Dinge', traumfaenger()),
    ('fallschirm', 'Fallschirm-Viertel', 'Dinge', fallschirm()),
    ('webrahmen', 'Webrahmen', 'Dinge', webrahmen()),
    ('perlenwebrahmen', 'Perlen-Webrahmen', 'Dinge', perlenwebrahmen()),
    ('webquadrat', 'Webquadrat', 'Dinge', webquadrat()),
    ('perlenraster', 'Perlen-Raster', 'Dinge', perlenraster()),
    ('nagelbrett', 'Nagelbrett', 'Dinge', nagelbrett()),
    ('lamarahmen', 'Lama-Webrahmen', 'Tiere', lamarahmen()),
]
