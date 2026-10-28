"""Schnittmuster zum Nähen (Klassenprojekte): Filzsäckchen, Fingerpuppen, Handpuppe, Täschli, Etui, Topflappen,
Turnsack, Lesekissen, Plüschfisch, Utensilo. Die Nahtzugabe gibt der Generator dazu; Falz- und Nahtlinien sind Details."""
from zeichnen import *
from hilfen import *


def dach(b, h, r=None):
    """Rechteck b × h mit rundem Kopf (Halbkreis oben)."""
    r = r or b/2
    return U(box(-b/2, -h/2, b/2, h/2 - r), C(0, h/2 - r, r))


def fingerpuppe(ohren=None, augen=True):
    g = dach(44, 100, 22)
    if ohren is not None: g = glatt(U(g, ohren), 3)
    det = [punkt(-7, 36, 2), punkt(7, 36, 2)] if augen else []
    return g, det


def handpuppe():
    k = U(weich(P([(-32, -50), (32, -50), (26, 10), (-26, 10)]), 4), C(0, 30, 22), E(-38, 2, 18, 10, 20), E(38, 2, 18, 10, -20))
    return glatt(k, 4), [punkt(-8, 34, 2), punkt(8, 34, 2)]


def taeschli():
    g = U(box(-35, -50, 35, 30), E(0, 30, 35, 20).intersection(box(-40, 30, 40, 60)))
    return g, [strich((-35, -20), (35, -20)), strich((-35, 10), (35, 10))]


def lesekissen():
    return glatt(U(L([(-40, 0), (40, 0)], 36), C(-40, 12, 16), C(-40, -12, 16), C(40, 12, 16), C(40, -12, 16)), 6)


def plueschfisch():
    k = U(E(0, 0, 46, 30), weich(P([(30, 0), (70, 30), (62, 0), (70, -30)]), 4))
    return glatt(k, 5), [punkt(-26, 8, 4), LineString([(-12, -20), (-5, 0), (-12, 20)])]


def utensilo():
    g = U(box(-25, -50, 25, 50), box(-50, -25, 50, 25))
    return g, [LineString(box(-25, -25, 25, 25).exterior.coords)]


def filzblume(n):
    b = [E(30*np.cos(a), 30*np.sin(a), 22, 15, np.degrees(a)) for a in np.radians(np.arange(n)*360/n + 90)]
    return glatt(U(C(0, 0, 18), *b), 2), [punkt(0, 0, 2)]


def kreuz():
    return weich(U(L([(-30, -30), (30, 30)], 14), L([(-30, 30), (30, -30)], 14)), 3)


def schwert():
    """Piratenschwert aus Karton: Klinge, Parierstange, Griff mit Knauf."""
    klinge = weich(P([(-10, -10), (10, -10), (6, 60), (0, 66), (-6, 60)]), 2)
    g = U(klinge, weich(box(-22, -15, 22, -8), 2), box(-6, -40, 6, -14), C(0, -44, 8))
    return glatt(g, 2), [strich((0, -8), (0, 58))]


N = 'Nähen'
hasenohren = U(E(-12, 58, 8, 22, 10), E(12, 58, 8, 22, -10))
katzenohren = U(weich(P([(-20, 30), (-18, 62), (-2, 44)]), 2), weich(P([(20, 30), (18, 62), (2, 44)]), 2))
baerenohren = U(C(-16, 42, 9), C(16, 42, 9))
mausohren = U(C(-22, 40, 13), C(22, 40, 13))
FORMEN = [
    ('filzsaeckchen', 'Filzsäckchen', N, R(dach(70, 100), 180), 12),
    ('eierwaermer', 'Eierwärmer', N, dach(70, 100, 35), 10),
    ('fingerpuppe', 'Fingerpuppe', N, fingerpuppe(), 8),
    ('fingerpuppe-hase', 'Fingerpuppe Hase', N, fingerpuppe(hasenohren), 10),
    ('fingerpuppe-katze', 'Fingerpuppe Katze', N, fingerpuppe(katzenohren), 9),
    ('fingerpuppe-baer', 'Fingerpuppe Bär', N, fingerpuppe(baerenohren), 9),
    ('fingerpuppe-maus', 'Fingerpuppe Maus', N, fingerpuppe(mausohren), 9),
    ('anhaenger', 'Anhänger', N, (rundbox(-25, -50, 25, 50, 10), [punkt(0, 40, 2.5)]), 8),
    ('beutel', 'Beutel mit Tunnelzug', N, (box(-30, -50, 30, 50), [strich((-30, 36), (30, 36)), strich((-30, -50), (-30, 50))]), 24),
    ('handpuppe', 'Handpuppe', N, handpuppe(), 24),
    ('taeschli', 'Täschli mit Klappe', N, taeschli(), 24),
    ('etui', 'Stifteetui', N, (box(-50, -22, 50, 22), [strich((-50, 0), (50, 0))]), 22),
    ('tictactoe-filz', 'Tic-Tac-Toe aus Filz', N, (box(-50, -50, 50, 50), gitter(-50, -50, 50, 50, 3, 3)), 15),
    ('spielstein-x', 'Spielstein X', N, kreuz(), 4),
    ('topflappen', 'Topflappen', N, (rundbox(-50, -50, 50, 50, 10), [punkt(-40, 40, 2.5), strich((-40, -40), (40, 40)), strich((-40, 40), (40, -40))]), 20),
    ('waermekissen', 'Wärmekissen', N, rundbox(-50, -30, 50, 30, 15), 24),
    ('turnsack', 'Turnsack', N, (box(-41.5, -50, 41.5, 50), [strich((-41.5, 40), (41.5, 40)), strich((-41.5, 32), (41.5, 32))]), 32),
    ('lesekissen', 'Lesekissen Knochen', N, lesekissen(), 36),
    ('plueschfisch', 'Plüschfisch', N, plueschfisch(), 30),
    ('utensilo', 'Utensilo', N, utensilo(), 27),
    ('kabelorganizer', 'Kabelorganizer', N, (rundbox(-50, -17, 50, 17, 12), [punkt(-40, 0, 2.5), strich((36, -6), (36, 6))]), 10),
    ('muetze-segment', 'Mützen-Segment', N, U(box(-30, -50, 30, 0), E(0, 0, 30, 50).intersection(box(-40, 0, 40, 60))), 24),
    ('filzblume-5', 'Filzblume 5 Blätter', N, filzblume(5), 8),
    ('filzblume-8', 'Filzblume 8 Blätter', N, filzblume(8), 10),
    ('piratenschwert', 'Piratenschwert', 'Dinge', schwert(), 36),
]
