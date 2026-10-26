"""Schnittformen zu einzelnen Werk-Videos (Pompon, Kreisel, Stoffmotte, Dreieck-Säckchen) – eigene Zeichnungen."""
from zeichnen import *


def ring():
    """Pomponring: aussen und innen ein Kreis, das Loch bleibt frei."""
    return C(0, 0, 50).difference(C(0, 0, 20))


def kreisel():
    """Kreiselscheibe: Mitte zum Einstechen, acht Felder zum Anmalen."""
    strahlen = [LineString([(6*np.cos(a), 6*np.sin(a)), (48*np.cos(a), 48*np.sin(a))])
                for a in np.radians(np.arange(0, 360, 45))]
    return C(0, 0, 50), [kreislinie(0, 0, 2.5)] + strahlen


def mottenfluegel():
    """Vorder- und Hinterflügel einer Seite, gespiegelt; Strich in der Mitte zeigt, wo der Körper liegt."""
    vorne = E(-28, 10, 31, 14, 22)
    hinten = E(-17, -11, 18, 13, -28)
    links = glatt(U(vorne, hinten, E(-3, 0, 7, 17)), 4)
    return U(links, spiegel_x(links)), [LineString([(0, 15), (0, -16)])]


def saeckchen():
    """Stoffstück für das Dreieck-Säckchen: Kante k, doppelt gelegt 2k breit, (√3/2)·k hoch; Falz in der Mitte."""
    k = 50
    h = k*np.sqrt(3)/2
    return box(-k, 0, k, h), [LineString([(0, 0), (0, h)])]


FORMEN = [
    ('ring', 'Ring', 'Grundformen', ring()),
    ('kreisel', 'Kreiselscheibe', 'Dinge', kreisel()),
    ('saeckchen', 'Dreieck-Säckchen', 'Dinge', saeckchen()),
    ('motte', 'Mottenflügel', 'Tiere', mottenfluegel()),
]
