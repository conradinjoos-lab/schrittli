"""Eigene Silhouetten für die Welten «Berge» und «Städte» (Schrittli): Polygone, schwarz auf durchsichtig.

Die Motive sind eigene Zeichnungen (frei, keine Fremdrechte). Aufruf: python -I silhouetten.py [<id> …]
schreibt bilder/<id>.png nach werkzeug/vorlagen/bilder/. Danach: python -I bild.py <id> …"""
import os, sys, math, random
from PIL import Image, ImageDraw

HIER = os.path.dirname(os.path.abspath(__file__))
BILDER = os.path.join(HIER, 'bilder')
SS = 2


class C:
    """Zeichenfläche: add() füllt, cut() sticht Löcher (z.B. Fenster)."""
    def __init__(s, w, h):
        s.w, s.h = w, h
        s.m = Image.new('L', (w*SS, h*SS), 0)
        s.d = ImageDraw.Draw(s.m)

    def add(s, pts, v=255): s.d.polygon([(x*SS, y*SS) for x, y in pts], fill=v)
    def cut(s, pts): s.add(pts, 0)
    def rect(s, x0, y0, x1, y1, v=255): s.add([(x0, y0), (x1, y0), (x1, y1), (x0, y1)], v)
    def circ(s, cx, cy, r, v=255): s.d.ellipse([(cx-r)*SS, (cy-r)*SS, (cx+r)*SS, (cy+r)*SS], fill=v)

    def save(s, name):
        m = s.m.resize((s.w, s.h), Image.LANCZOS)
        bb = m.getbbox(); r = 24
        m = m.crop((max(0, bb[0]-r), max(0, bb[1]-r), min(s.w, bb[2]+r), min(s.h, bb[3]+r)))
        z = Image.new('L', m.size, 0)
        Image.merge('RGBA', (z, z, z, m)).save(os.path.join(BILDER, name + '.png'))


# ------------------------------------------------------------------ Bausteine
def grat(pts, rau=.22, seed=1, tiefe=4):
    """Zackige Linie durch die Eckpunkte (Mittelpunktverschiebung)."""
    rnd = random.Random(seed); aus = [pts[0]]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        seg = [(x0, y0), (x1, y1)]
        for t in range(tiefe):
            neu = [seg[0]]
            for (a, b), (c, d) in zip(seg, seg[1:]):
                neu.append(((a+c)/2, (b+d)/2 + rnd.uniform(-1, 1)*rau*abs(c-a)*.5)); neu.append((c, d))
            seg = neu
        aus += seg[1:]
    return aus

def berg(c, pts, G, **kw):
    g = grat(pts, **kw); c.add(g + [(g[-1][0], G), (g[0][0], G)]); return g

def tanne(c, cx, fuss, h, w):
    c.rect(cx-w*.07, fuss-h*.12, cx+w*.07, fuss)
    for i in range(3):
        y1 = fuss - h*.1 - i*h*.26; y0 = y1 - h*.4; bw = w*(.5 - i*.12)
        c.add([(cx-bw, y1), (cx+bw, y1), (cx, y0)])

def dreieck(c, cx, fuss, w, h): c.add([(cx-w/2, fuss), (cx+w/2, fuss), (cx, fuss-h)])

def haus(c, x, w, h, G, dach=None, dh=None, ueber=6):
    c.rect(x, G-h, x+w, G)
    dh = dh if dh is not None else w*.45
    if dach == 'sattel': c.add([(x-ueber, G-h), (x+w+ueber, G-h), (x+w/2, G-h-dh)])
    elif dach == 'walm': c.add([(x-ueber, G-h), (x+w+ueber, G-h), (x+w*.8, G-h-dh), (x+w*.2, G-h-dh)])
    elif dach == 'pult': c.add([(x-ueber, G-h), (x+w+ueber, G-h-dh*.5), (x+w+ueber, G-h)])
    elif dach == 'treppe':
        n = 4
        for i in range(n):
            f = (i+1)/(n+1)
            c.rect(x+w*f/2, G-h-dh*(i+1)/n, x+w-w*f/2, G-h-dh*i/n)
    elif dach == 'zwiebel': zwiebel(c, x+w/2, G-h, w*.5, dh)

def fenster(c, x0, y0, x1, y1, nx, ny, fw, fh):
    """Raster von Fensterlöchern gleichmässig in der Fläche."""
    for i in range(nx):
        for j in range(ny):
            cx = x0 + (i+.5)*(x1-x0)/nx; cy = y0 + (j+.5)*(y1-y0)/ny
            c.rect(cx-fw/2, cy-fh/2, cx+fw/2, cy+fh/2, 0)

def nadel(c, cx, fuss, w, spitze): c.add([(cx-w/2, fuss), (cx+w/2, fuss), (cx, spitze)])

def turm(c, cx, fuss, w, h, dach='spitz', dh=None):
    c.rect(cx-w/2, fuss-h, cx+w/2, fuss)
    dh = dh if dh is not None else w*1.4
    if dach == 'spitz': nadel(c, cx, fuss-h, w*1.12, fuss-h-dh)
    elif dach == 'zwiebel': zwiebel(c, cx, fuss-h, w*.62, dh)
    elif dach == 'kuppel': kuppel(c, cx, fuss-h, w*.55, dh)
    elif dach == 'zinnen': zinnen(c, cx-w/2-4, cx+w/2+4, fuss-h, w*.14)

def kuppel(c, cx, fuss, rx, ry, laterne=True):
    c.add([(cx+rx*math.cos(math.pi*t/40), fuss-ry*math.sin(math.pi*t/40)) for t in range(41)])
    if laterne:
        c.rect(cx-rx*.16, fuss-ry*1.25, cx+rx*.16, fuss-ry*.85)
        nadel(c, cx, fuss-ry*1.25, rx*.3, fuss-ry*1.7)

def zwiebel(c, cx, fuss, r, h):
    pts = []
    for i in range(0, 41):
        t = i/40; pts.append((cx + r*math.sin(math.pi*t**.7), fuss - h*t))
    for i in range(40, -1, -1):
        t = i/40; pts.append((cx - r*math.sin(math.pi*t**.7), fuss - h*t))
    c.add(pts)

def zinnen(c, x0, x1, ytop, zw):
    n = max(3, int((x1-x0)/(zw*2))); step = (x1-x0)/n
    for i in range(n):
        if i % 2 == 0: c.rect(x0+i*step, ytop-zw*1.3, x0+(i+1)*step, ytop+2)

def bogen(c, cx, fuss, r, h=None):
    h = h or r*1.4
    pts = [(cx-r, fuss), (cx-r, fuss-h+r)] + [(cx - r*math.cos(math.pi*t/20), fuss-h+r - r*math.sin(math.pi*t/20)) for t in range(0, 21)] + [(cx+r, fuss)]
    c.cut(pts)

def uhr(c, cx, cy, r): c.circ(cx, cy, r, 0)

def kreuz(c, cx, cy, h): c.rect(cx-h*.07, cy-h, cx+h*.07, cy+h*.2); c.rect(cx-h*.32, cy-h*.72, cx+h*.32, cy-h*.58)

def mondsichel(c, cx, cy, r):
    c.circ(cx, cy, r); c.circ(cx+r*.45, cy-r*.15, r*.85, 0)


# ------------------------------------------------------------------ Berge
def b_matterhorn():
    c = C(2400, 1300); G = 1200
    berg(c, [(60, G), (520, 900), (760, 820), (900, 620), (1010, 520), (1090, 330), (1170, 170), (1215, 150), (1250, 240), (1330, 420),
             (1420, 600), (1560, 760), (1760, 880), (2000, 960), (2340, G)], G, rau=.18, seed=4)
    return c

def b_trio():
    c = C(2600, 1300); G = 1200
    berg(c, [(40, G), (360, 800), (560, 560), (700, 450), (800, 420), (900, 520), (1020, 760), (1100, 740), (1260, 500), (1400, 360),
             (1500, 380), (1680, 640), (1780, 700), (1900, 560), (2060, 420), (2200, 640), (2340, 900), (2560, G)], G, rau=.2, seed=11)
    return c

def b_sonne():
    c = C(2400, 1300); G = 1200
    c.circ(1500, 560, 270)
    berg(c, [(40, G), (420, 800), (640, 640), (880, 860), (1100, 520), (1300, 760), (1560, 900), (1800, 700), (2100, 880), (2380, G)], G, rau=.16, seed=5)
    return c

def b_tannen():
    c = C(2400, 1300); G = 1220
    berg(c, [(40, G), (500, 780), (760, 560), (900, 700), (1160, 430), (1420, 720), (1700, 640), (2000, 880), (2360, G)], G, rau=.16, seed=8)
    for i, x in enumerate(range(140, 2300, 170)):
        h = 250 + (i*53 % 90); tanne(c, x, G+30, h, 170)
    return c

def b_gipfelkreuz():
    c = C(2000, 1300); G = 1200
    g = berg(c, [(60, G), (520, 920), (780, 700), (960, 440), (1040, 360), (1180, 450), (1360, 700), (1560, 900), (1940, G)], G, rau=.12, seed=3)
    kreuz(c, 1040, 372, 230)
    return c

def b_doppel():
    c = C(2400, 1300); G = 1200
    berg(c, [(40, G), (560, 720), (760, 420), (900, 560), (1010, 760), (1100, 800), (1300, 520), (1480, 330), (1580, 470), (1900, 840), (2360, G)], G, rau=.14, seed=21)
    return c

def b_vulkan():
    c = C(2200, 1500); G = 1300
    c.add([(100, G), (780, 560), (860, 520), (1000, 560), (1100, 580), (1180, 520), (1260, 560), (1900, G)])
    c.cut([(980, 560), (1120, 580), (1060, 640)]) if False else None
    for (x, y, r) in [(1050, 470, 80), (1130, 380, 95), (1040, 300, 105), (1170, 230, 90), (1080, 140, 80)]: c.circ(x, y, r)
    return c

def b_kette():
    c = C(3200, 1100); G = 1000
    berg(c, [(20, G), (260, 700), (420, 560), (600, 760), (800, 380), (980, 600), (1150, 500), (1400, 820), (1650, 300), (1850, 560),
             (2050, 470), (2300, 750), (2500, 420), (2680, 640), (2900, 780), (3180, G)], G, rau=.2, seed=17)
    return c

def b_hochgebirge():
    c = C(2600, 1400); G = 1300
    berg(c, [(20, G), (300, 900), (460, 620), (560, 700), (760, 300), (860, 520), (1000, 640), (1240, 180), (1380, 480), (1540, 600),
             (1760, 360), (1900, 620), (2100, 520), (2300, 860), (2580, G)], G, rau=.28, seed=33, tiefe=5)
    return c

def b_seilbahn():
    c = C(2400, 1400); G = 1300
    berg(c, [(40, G), (500, 980), (860, 640), (1300, 360), (1500, 330), (1700, 440), (2100, 900), (2360, G)], G, rau=.12, seed=6)
    # Seil von der Talstation zum Gipfel, Gondel daran
    c.add([(300, 1010), (1480, 350), (1480, 372), (300, 1030)])
    c.add([(300, 1000), (300, G), (330, G), (330, 1000)])
    gx, gy = 900, 1010 - (900-300)*(660/1180) + 6
    c.rect(gx-70, gy+40, gx+70, gy+150); c.rect(gx-5, gy, gx+5, gy+40)
    c.rect(gx-40, gy+65, gx-8, gy+115, 0); c.rect(gx+8, gy+65, gx+40, gy+115, 0)
    return c

def b_huette():
    c = C(2400, 1300); G = 1220
    berg(c, [(40, G), (520, 840), (900, 520), (1180, 300), (1400, 460), (1760, 760), (2360, G)], G, rau=.1, seed=9)
    haus(c, 1500, 330, 170, G-60+30, 'sattel', 120); c.rect(1740, 880, 1790, 960)
    c.rect(1560, 1040, 1640, 1120, 0); c.rect(1690, 1040, 1760, 1180, 0)
    return c

def b_mond():
    c = C(2400, 1300); G = 1200
    mondsichel(c, 1700, 400, 230)
    berg(c, [(40, G), (400, 860), (700, 560), (980, 800), (1260, 420), (1560, 760), (1860, 640), (2120, 880), (2360, G)], G, rau=.15, seed=12)
    return c

def b_fuji():
    c = C(2400, 1100); G = 1000
    c.add([(60, G), (900, 380), (1000, 330), (1400, 330), (1500, 380), (2340, G)])
    return c

def b_dreieck():
    c = C(2200, 1200); G = 1100
    dreieck(c, 1100, G, 1500, 900); dreieck(c, 600, G, 900, 560); dreieck(c, 1650, G, 1000, 640)
    return c

def b_wald():
    c = C(2400, 1300); G = 1220
    berg(c, [(40, G), (700, 700), (1000, 520), (1300, 640), (1700, 880), (2360, G)], G, rau=.12, seed=15)
    for i, x in enumerate(range(100, 2340, 110)):
        h = 230 + (i*47 % 120); tanne(c, x, G+10, h, 130)
    return c

def b_zelt():
    c = C(2400, 1300); G = 1200
    berg(c, [(40, G), (560, 760), (900, 440), (1160, 300), (1500, 640), (1860, 900), (2360, G)], G, rau=.13, seed=19)
    c.add([(1480, G+10), (1800, G+10), (1640, G-210)]); c.add([(1625, G+10), (1655, G+10), (1640, G-130)], 0)
    return c

def b_schlitten():  # Berg mit Skipiste und Lift (Stützen)
    c = C(2400, 1300); G = 1200
    berg(c, [(40, G), (460, 860), (860, 540), (1200, 300), (1520, 560), (1800, 760), (2360, G)], G, rau=.1, seed=23)
    for (x, y0) in [(620, 790), (900, 650), (1180, 520), (1420, 420)]:
        c.rect(x-12, y0-60, x+12, y0+40); c.rect(x-50, y0-70, x+50, y0-55)
    return c


BERGE = {
    'berg-matterhorn-sil': b_matterhorn, 'berg-trio': b_trio, 'berg-sonne': b_sonne, 
    'berg-gipfelkreuz': b_gipfelkreuz, 'berg-doppel': b_doppel, 'berg-vulkan': b_vulkan, 'berg-kette': b_kette,
    'berg-hochgebirge': b_hochgebirge,  'berg-huette': b_huette, 'berg-mond': b_mond,
    'berg-fuji': b_fuji, 'berg-dreiecke': b_dreieck,   
}


# ------------------------------------------------------------------ Städte
G0 = 900

def reihe(c, x0, x1, G, hmin, hmax, seed, dachanteil=.6, wmin=90, wmax=170):
    """Häuserreihe mit zufälligen Höhen und Dächern."""
    rnd = random.Random(seed); x = x0
    while x < x1:
        w = rnd.randint(wmin, wmax); h = rnd.randint(hmin, hmax)
        d = rnd.choice(['sattel', 'sattel', 'walm', 'pult', None]) if rnd.random() < dachanteil else None
        haus(c, x, w, h, G, d, w*.4); x += w - 4

def s_zuerich():
    c = C(2600, 1100); G = 950
    reihe(c, 20, 2580, G, 150, 280, 1)
    # Grossmünster: zwei Türme mit Kuppeln, Schiff dazwischen
    c.rect(1000, G-340, 1400, G); c.add([(990, G-340), (1410, G-340), (1200, G-440)])
    for cx in (1060, 1340):
        c.rect(cx-62, G-620, cx+62, G); zwiebel(c, cx, G-620, 78, 190)
        c.rect(cx-6, G-880, cx+6, G-790)
        bogen(c, cx, G-380, 22, 70); bogen(c, cx, G-500, 22, 70)
    # Fraumünster: schlanker Turm mit Nadel
    c.rect(560, G-520, 660, G); nadel(c, 610, G-520, 120, G-1000 + 140)
    c.rect(500, G-300, 700, G); c.add([(490, G-300), (710, G-300), (600, G-380)])
    # St. Peter: Uhrturm
    c.rect(1700, G-560, 1850, G); c.add([(1690, G-560), (1860, G-560), (1775, G-760)]); uhr(c, 1775, G-470, 50)
    c.rect(1620, G-250, 1930, G); c.add([(1610, G-250), (1940, G-250), (1775, G-330)])
    return c

def s_bern():
    c = C(2600, 1100); G = 950
    reihe(c, 20, 2580, G, 140, 260, 2)
    # Münster: Turm mit durchbrochenem Helm
    c.rect(560, G-560, 740, G); c.rect(580, G-640, 720, G-560)
    c.add([(580, G-640), (720, G-640), (690, G-780), (650, G-860), (650, G-1000+0), (650, G-1000), (650, G-1000)])
    nadel(c, 650, G-640, 150, G-1020)
    for k in (-35, 0, 35): c.add([(650+k-6, G-640), (650+k+6, G-640), (650+k*.2, G-830)], 0) if False else None
    c.rect(520, G-300, 800, G)
    # Zytglogge
    c.rect(1250, G-480, 1390, G); uhr(c, 1320, G-330, 42)
    c.add([(1240, G-480), (1400, G-480), (1320, G-680)]); c.rect(1310, G-760, 1330, G-680)
    # Bundeshaus: Kuppel zwischen Flügeln
    c.rect(1750, G-300, 2400, G); kuppel(c, 2075, G-300, 150, 190)
    c.rect(1930, G-420, 2220, G-300); kuppel(c, 2075, G-420, 120, 150, False)
    c.rect(1760, G-380, 1870, G-300); c.rect(2280, G-380, 2390, G-300)
    for i in range(10): bogen(c, 1790 + i*62, G, 18, 70)
    return c

def s_basel():
    c = C(2400, 1100); G = 950
    reihe(c, 20, 2380, G, 130, 250, 3)
    # Münster: zwei ungleiche Türme, steiles Dach
    c.rect(700, G-380, 1500, G); c.add([(690, G-380), (1510, G-380), (1450, G-520), (750, G-520)])
    c.rect(780, G-760, 920, G); nadel(c, 850, G-760, 160, G-1000+10)
    c.rect(1300, G-720, 1450, G); nadel(c, 1375, G-720, 170, G-960)
    fenster(c, 790, G-700, 910, G-400, 1, 3, 26, 90); fenster(c, 1310, G-660, 1440, G-400, 1, 3, 26, 90)
    # Rathaus mit Zinnen und Turm
    c.rect(1750, G-330, 2200, G); zinnen(c, 1750, 2200, G-330, 40)
    c.rect(2000, G-560, 2100, G-330); c.add([(1990, G-560), (2110, G-560), (2050, G-700)])
    return c

def s_luzern():
    c = C(2600, 1100); G = 950
    reihe(c, 20, 700, G, 130, 230, 4)
    # Wasserturm + Kapellbrücke
    c.rect(1000, G-420, 1190, G); c.add([(990, G-420), (1200, G-420), (1095, G-600)])
    c.rect(1080, G-660, 1110, G-600)
    c.rect(1200, G-210, 2200, G-120)
    c.add([(1180, G-210), (2220, G-210), (2200, G-290), (1200, G-290)])
    for x in range(1250, 2200, 100): c.rect(x, G-120, x+34, G)
    # Jesuitenkirche mit zwei Türmen
    for cx in (1900, 2100): c.rect(cx-55, G-600, cx+55, G); zwiebel(c, cx, G-600, 70, 170)
    c.rect(1845, G-330, 2155, G)
    reihe(c, 2250, 2580, G, 130, 230, 5)
    # Pilatus im Hintergrund: Zackenlinie unter der Stadt
    berg(c, [(20, G-100), (300, G-300), (500, G-480), (700, G-380), (900, G-100)], G, rau=.1, seed=7)
    return c

def s_genf():
    c = C(2400, 1100); G = 950
    reihe(c, 20, 2380, G, 120, 260, 6)
    # Jet d'Eau: Fontäne mit herabfallenden Bögen
    c.rect(1150, G-60, 1250, G)
    c.add([(1192, G-60), (1208, G-60), (1204, G-900), (1196, G-900)])
    for s_ in (1, -1):
        for hoch, weit in ((900, 330), (780, 230), (640, 140)):
            pts = [(1200 + s_*weit*t/24, G-60-hoch*(1-((t/24)*2-1)**2*0) * (1-(t/24)**2)) for t in range(25)]
            for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
                c.add([(x0, y0-16), (x1, y1-16), (x1, y1+16), (x0, y0+16)])
    c.circ(1200, G-910, 22)
    # Kathedrale St-Pierre
    c.rect(1700, G-300, 2100, G); nadel(c, 1800, G-300, 100, G-700); nadel(c, 2000, G-300, 100, G-700); nadel(c, 1900, G-300, 90, G-560)
    return c

def s_paris():
    c = C(2600, 1500); G = 1350; x = 1000
    H = 1100
    L = []; R = []
    for i in range(41):
        t = i/40; hw = 16 + 380*(1-t)**2.6; L.append((x-hw, G-H*t)); R.append((x+hw, G-H*t))
    c.add(L + R[::-1])
    for t, ex in [(.27, 40), (.55, 24)]:
        hw = 16 + 380*(1-t)**2.6; c.rect(x-hw-ex, G-H*t-26, x+hw+ex, G-H*t+10)
    for i in range(10, -1, -1): pass
    c.cut([(x+200*math.cos(math.pi*t/30), G-330*math.sin(math.pi*t/30)) for t in range(31)])
    c.rect(x-5, G-H-120, x+5, G-H)
    # Sacré-Cœur-Kuppeln, Häuser mit Mansarddach, Notre-Dame
    reihe(c, 20, 560, G, 160, 280, 8, wmin=120, wmax=200)
    c.rect(1700, G-300, 2200, G)
    for cx, r, h in [(1950, 120, 330), (1780, 60, 190), (2120, 60, 190)]:
        c.rect(cx-r*.7, G-300-h*.4, cx+r*.7, G-300); kuppel(c, cx, G-300-h*.4, r, h*.75)
    reihe(c, 2250, 2580, G, 150, 250, 10)
    c.rect(520, G-450, 640, G); c.rect(660, G-450, 780, G); c.rect(520, G-330, 780, G)
    return c

def s_newyork():
    c = C(2800, 1500); G = 1350
    rnd = random.Random(31)
    x = 20
    while x < 2780:
        w = rnd.randint(110, 230); h = rnd.randint(260, 640)
        c.rect(x, G-h, x+w, G)
        if rnd.random() < .4: c.rect(x+w*.2, G-h-70, x+w*.8, G-h)
        if rnd.random() < .3: c.rect(x+w/2-6, G-h-170, x+w/2+6, G-h)
        x += w - 6
    # Empire State: gestufter Turm mit Mast
    cx = 1000
    c.rect(cx-190, G-700, cx+190, G); c.rect(cx-150, G-880, cx+150, G-700); c.rect(cx-100, G-1020, cx+100, G-880); c.rect(cx-55, G-1120, cx+55, G-1020)
    c.rect(cx-26, G-1210, cx+26, G-1120); c.add([(cx-26, G-1210), (cx+26, G-1210), (cx, G-1330)]); c.rect(cx-4, G-1470, cx+4, G-1330)
    # One World Trade Center: spitz zulaufender Turm
    cx = 1700
    c.add([(cx-120, G), (cx+120, G), (cx+95, G-1000), (cx+8, G-1100), (cx+4, G-1480), (cx-4, G-1480), (cx-8, G-1100), (cx-95, G-1000)])
    # Chrysler: Bogenkrone
    cx = 2300
    c.rect(cx-130, G-900, cx+130, G); c.add([(cx-120+60*math.sin(math.pi*t/20), G-900 - 170*(1-math.cos(math.pi*t/20))/1) for t in range(0)] or [(cx-130, G-900), (cx+130, G-900), (cx+80, G-1060), (cx, G-1160), (cx-80, G-1060)])
    c.rect(cx-5, G-1330, cx+5, G-1160); c.add([(cx-5, G-1160), (cx+5, G-1160), (cx, G-1330)])
    for k in (-60, 0, 60): c.add([(cx+k-14, G-930), (cx+k+14, G-930), (cx+k*.7, G-1030)], 0)
    return c

def s_london():
    c = C(2800, 1400); G = 1250
    # Parlament
    c.rect(20, G-260, 1300, G)
    for x in range(60, 1300, 140): nadel(c, x, G-260, 36, G-350)
    # Big Ben
    cx = 1400
    c.rect(cx-90, G-860, cx+90, G); c.rect(cx-110, G-1010, cx+110, G-860); uhr(c, cx, G-940, 62)
    c.add([(cx-125, G-1010), (cx+125, G-1010), (cx+60, G-1130), (cx, G-1220), (cx-60, G-1130)]); c.rect(cx-5, G-1380, cx+5, G-1220)
    c.add([(cx-8, G-1220), (cx+8, G-1220), (cx, G-1330)])
    for yy in (G-620, G-500): c.rect(cx-30, yy-40, cx+30, yy+40, 0)
    # Tower Bridge
    bx0, bx1 = 1800, 2500
    for cx in (bx0, bx1):
        c.rect(cx-90, G-640, cx+90, G); zinnen(c, cx-90, cx+90, G-640, 30)
        for k in (-45, 45): c.add([(cx+k-26, G-640), (cx+k+26, G-640), (cx+k, G-760)])
        c.rect(cx-30, G-540, cx+30, G-380, 0)
    c.rect(bx0, G-340, bx1, G-290)
    c.rect(bx0+90, G-560, bx1-90, G-520)
    c.rect(bx0+90, G-560, bx1-90, G-540)
    c.add([(bx0, G-640), (bx0+90, G-560), (bx0+90, G-540), (bx0, G-620)]); c.add([(bx1, G-640), (bx1-90, G-560), (bx1-90, G-540), (bx1, G-620)])
    c.rect(1700, G-200, 2600, G); [c.cut([(1760+i*130, G), (1760+i*130, G-90), (1800+i*130, G-130), (1840+i*130, G-90), (1840+i*130, G)]) for i in range(0)]
    return c

def s_rom():
    c = C(2600, 1200); G = 1050
    reihe(c, 20, 640, G, 140, 250, 12)
    # Kolosseum: Ellipsenwand mit Bogenreihen
    c.add([(1300+560*math.cos(math.pi*t/40), G-300*abs(math.sin(math.pi*t/40))*0 - 0) for t in range(0)] or [(700, G), (700, G-300), (760, G-420), (1000, G-460), (1300, G-470), (1600, G-460), (1840, G-420), (1900, G-300), (1900, G)])
    for row, yy in enumerate((G-100, G-230, G-360)):
        for i in range(10): bogen(c, 770 + i*115, yy+60 if row else G, 24, 90)
    # Petersdom: Kuppel
    c.rect(2000, G-260, 2580, G); kuppel(c, 2290, G-260, 190, 280)
    for cx in (2090, 2490): kuppel(c, cx, G-260, 50, 90, False)
    return c

def s_berlin():
    c = C(2600, 1500); G = 1350
    reihe(c, 20, 800, G, 160, 300, 13)
    # Fernsehturm: Schaft, Kugel, Antenne
    cx = 1100
    c.add([(cx-26, G), (cx+26, G), (cx+12, G-1000), (cx-12, G-1000)]); c.circ(cx, G-1060, 105); c.add([(cx-12, G-1010), (cx+12, G-1010), (cx+3, G-1460), (cx-3, G-1460)])
    c.rect(cx-40, G-860, cx+40, G-820)
    # Brandenburger Tor: Säulenreihe und Quadriga
    c.rect(1500, G-430, 2200, G-370); c.rect(1500, G-570, 2200, G-500)
    for i in range(6): c.rect(1520+i*135, G-500, 1520+i*135+70, G)
    c.rect(1700, G-640, 2000, G-570); c.add([(1760, G-640), (1940, G-640), (1880, G-740), (1830, G-740)])
    c.circ(1850, G-770, 22)
    reihe(c, 2250, 2580, G, 160, 280, 14)
    return c

def s_sydney():
    c = C(2800, 1200); G = 1050
    # Opernhaus: gestaffelte Segel
    for (x, w, h) in [(300, 360, 360), (600, 320, 300), (860, 280, 230), (1120, 300, 330), (1380, 260, 260)]:
        pts = [(x + w*math.sin(math.pi/2*t/20)*0 + w*(t/20), G - h*math.sin(math.pi*(t/20)**.8)) for t in range(21)]
        c.add(pts + [(x+w, G), (x, G)])
    c.rect(280, G-70, 1700, G)
    # Harbour Bridge: Bogen
    ax = 1800
    c.add([(ax + 1000*t/20, G-300 - 480*math.sin(math.pi*t/20)) for t in range(21)] + [(ax + 1000*t/20, G-250 - 440*math.sin(math.pi*t/20)) for t in range(20, -1, -1)])
    c.rect(ax, G-200, ax+1000, G-150)
    for t in range(1, 20):
        x = ax + 1000*t/20; c.rect(x-6, G-300-480*math.sin(math.pi*t/20)+20, x+6, G-200)
    c.rect(ax-30, G-340, ax+40, G); c.rect(ax+960, G-340, ax+1030, G)
    return c

def s_pisa():
    c = C(2000, 1500); G = 1350
    # schiefer Turm: Stapel schmaler Stockwerke, gekippt
    ang = math.radians(5); pts = []
    def p(x, y): return (1000 + (x-1000)*math.cos(ang) + (G-y)*math.sin(ang)*-1*0 + (G-y)*math.sin(ang), y)
    turmhoehe = 1150; w = 190
    c.add([p(1000-w/2, G), p(1000+w/2, G), p(1000+w/2-10, G-turmhoehe+120), p(1000-w/2+10, G-turmhoehe+120)])
    for i in range(8):
        y = G - 40 - i*(turmhoehe-200)/8
        c.add([p(1000-w/2-14, y), p(1000+w/2+14, y), p(1000+w/2+14, y-18), p(1000-w/2-14, y-18)])
    c.add([p(1000-w*.34, G-turmhoehe+120), p(1000+w*.34, G-turmhoehe+120), p(1000+w*.34, G-turmhoehe), p(1000-w*.34, G-turmhoehe)])
    for i in range(3):
        for k in (-1, 0, 1): c.cut([p(1000+k*52-14, G-120-i*330), p(1000+k*52+14, G-120-i*330), p(1000+k*52+14, G-250-i*330), p(1000+k*52-14, G-250-i*330)])
    c.rect(300, G-30, 1700, G+0)
    c.rect(300, G-260, 800, G-30); c.add([(290, G-260), (810, G-260), (550, G-340)])
    return c

def s_dorf():
    c = C(2400, 1200); G = 1050
    rnd = random.Random(40); x = 20
    while x < 2300:
        w = rnd.randint(150, 230); h = rnd.randint(150, 240); haus(c, x, w, h, G, 'sattel', w*.5, 16)
        c.rect(x+w*.25, G-h*.55, x+w*.45, G-h*.3, 0); c.rect(x+w*.58, G-h*.55, x+w*.78, G-h*.3, 0)
        c.rect(x+w*.7, G-h-w*.45-40, x+w*.82, G-h-w*.2) if rnd.random() < .5 else None
        x += w + rnd.randint(14, 40)
    # Kirche mit Spitzturm
    cx = 1300
    c.rect(cx-100, G-420, cx+100, G); c.add([(cx-110, G-420), (cx+110, G-420), (cx, G-760)]); kreuz(c, cx, G-790, 70)
    c.rect(cx+100, G-300, cx+420, G); c.add([(cx+90, G-300), (cx+430, G-300), (cx+260, G-420)])
    c.cut([(cx-28, G), (cx-28, G-100), (cx, G-140), (cx+28, G-100), (cx+28, G)]); uhr(c, cx, G-330, 26)
    return c

def s_hochhaeuser():
    c = C(2800, 1400); G = 1250
    rnd = random.Random(50); x = 20
    while x < 2750:
        w = rnd.randint(140, 260); h = rnd.randint(300, 1000)
        c.rect(x, G-h, x+w, G)
        t = rnd.choice(['antenne', 'stufe', 'spitz', 'flach'])
        if t == 'antenne': c.rect(x+w/2-7, G-h-200, x+w/2+7, G-h)
        elif t == 'stufe': c.rect(x+w*.2, G-h-120, x+w*.8, G-h); c.rect(x+w*.4, G-h-220, x+w*.6, G-h-120)
        elif t == 'spitz': c.add([(x, G-h), (x+w, G-h), (x+w/2, G-h-180)])
        fenster(c, x+w*.1, G-h+30, x+w*.9, G-30, 3, max(2, int((h-60)//120)), 34, 56)
        x += w + rnd.randint(-10, 20)
    return c

def s_burg():
    c = C(2400, 1300); G = 1200
    berg(c, [(20, G), (400, 1000), (900, 880), (1500, 880), (2000, 1000), (2380, G)], G, rau=.08, seed=2)
    c.rect(700, 560, 1700, 900)
    zinnen(c, 700, 1700, 560, 50)
    for cx in (780, 1620): c.rect(cx-90, 330, cx+90, 900); zinnen(c, cx-90, cx+90, 330, 36)
    c.rect(1060, 260, 1340, 560); c.add([(1040, 260), (1360, 260), (1200, 60)]); c.rect(1195, -20, 1205, 60) if False else None
    c.cut([(1150, 900), (1150, 760), (1200, 720), (1250, 760), (1250, 900)])
    for x in (850, 1000, 1400, 1520): c.rect(x, 640, x+34, 720, 0)
    return c

def s_muehlen():
    c = C(2600, 1200); G = 1050
    c.rect(0, G, 2600, G+1)
    for cx, h in [(500, 600), (1250, 700), (2000, 560)]:
        c.add([(cx-110, G), (cx+110, G), (cx+70, G-h), (cx-70, G-h)]); c.add([(cx-90, G-h), (cx+90, G-h), (cx, G-h-110)])
        for a in (math.radians(30), math.radians(120)):
            L = h*.55; wx = math.cos(a); wy = math.sin(a)
            for s in (1, -1):
                ex, ey = cx + s*wx*L, G-h-20 - s*wy*L; nx, ny = -wy*s*4, wx*s*4
                c.add([(cx-nx, G-h-20-ny), (cx+nx, G-h-20+ny), (ex+nx, ey+ny), (ex-nx, ey-ny)])
                px, py = -wy*s*38, wx*s*38
                c.add([(cx+wx*s*L*.35, G-h-20-wy*s*L*.35), (ex, ey), (ex+px, ey+py), (cx+wx*s*L*.35+px, G-h-20-wy*s*L*.35+py)])
        c.circ(cx, G-h-20, 22)
    return c

def s_tokio():
    c = C(2600, 1500); G = 1350
    reihe(c, 20, 700, G, 160, 300, 61)
    # Tokyo Tower: Gitterturm
    cx = 1000; H = 1000
    L = []; R = []
    for i in range(31):
        t = i/30; hw = 12 + 260*(1-t)**1.7; L.append((cx-hw, G-H*t)); R.append((cx+hw, G-H*t))
    c.add(L + R[::-1]); c.rect(cx-6, G-H-200, cx+6, G-H)
    for t in (.3, .55): hw = 12+260*(1-t)**1.7; c.rect(cx-hw-30, G-H*t-24, cx+hw+30, G-H*t+8)
    c.cut([(cx+140*math.cos(math.pi*t/20), G-300*math.sin(math.pi*t/20)) for t in range(21)])
    # Pagode: gestufte Dächer
    px = 1800
    for i in range(5):
        w = 460-i*70; y = G - 120 - i*170
        c.rect(px-w*.3, y-100, px+w*.3, y); c.add([(px-w/2-20, y), (px+w/2+20, y), (px+w*.3, y-50), (px-w*.3, y-50)])
    c.rect(px-8, G-120-5*170-130, px+8, G-120-4*170-130)
    c.rect(px-w*.9, G-120, px+w*.9+380, G)
    reihe(c, 2250, 2580, G, 160, 300, 62)
    return c

def s_dubai():
    c = C(2600, 1600); G = 1450
    reihe(c, 20, 1000, G, 160, 420, 71, 0, 90, 150); reihe(c, 1900, 2580, G, 160, 420, 72, 0, 90, 150)
    # Burj Khalifa: gestufte Spitze
    cx = 1450
    for (w, y0, y1) in [(200, 0, 300), (170, 300, 600), (140, 600, 850), (110, 850, 1080), (80, 1080, 1260), (50, 1260, 1380), (26, 1380, 1480)]:
        c.rect(cx-w/2, G-y1, cx+w/2, G-y0)
    c.rect(cx-5, G-1700, cx+5, G-1480)
    return c

def s_venedig():
    c = C(2600, 1300); G = 1150
    reihe(c, 20, 500, G, 130, 240, 80)
    # Campanile: hoher Turm mit Pyramidendach
    cx = 760; c.rect(cx-70, G-760, cx+70, G); c.rect(cx-85, G-860, cx+85, G-760); c.add([(cx-95, G-860), (cx+95, G-860), (cx, G-1040)])
    bogen(c, cx, G-770, 22, 90)
    # Santa Maria della Salute: Kuppeln
    kx = 1500; c.rect(kx-330, G-260, kx+330, G); kuppel(c, kx, G-260, 170, 270); kuppel(c, kx+260, G-260, 70, 120, False)
    c.rect(kx-340, G-70, kx+340, G)
    for i in range(6): bogen(c, kx-290 + i*116, G, 24, 120)
    reihe(c, 1900, 2580, G, 130, 220, 81)
    return c

def s_moskau():
    c = C(2600, 1300); G = 1150
    c.rect(300, G-380, 2300, G); zinnen(c, 300, 2300, G-380, 50)
    for cx, h, r, dh in [(1300, 560, 120, 250), (900, 440, 95, 200), (1700, 440, 95, 200), (1070, 360, 70, 160), (1530, 360, 70, 160), (700, 300, 55, 130), (1900, 300, 55, 130)]:
        c.rect(cx-r*.75, G-380-h*.5, cx+r*.75, G-380); zwiebel(c, cx, G-380-h*.5, r, dh*1.4)
        c.rect(cx-5, G-380-h*.5-dh*1.4-50, cx+5, G-380-h*.5-dh*1.4)
        c.rect(cx-r*.9, G-380-h*.5-12, cx+r*.9, G-380-h*.5)
    return c

def s_amsterdam():
    c = C(2600, 1200); G = 1050; x = 20; rnd = random.Random(90)
    while x < 2560:
        w = rnd.randint(140, 200); h = rnd.randint(380, 560)
        haus(c, x, w, h, G, rnd.choice(['treppe', 'treppe', 'sattel']), w*.55, 0)
        fenster(c, x+w*.12, G-h+30, x+w*.88, G-40, 2, max(2, h//130), 36, 64); x += w + 4
    return c

def s_wien():
    c = C(2600, 1500); G = 1350
    reihe(c, 20, 800, G, 160, 300, 100)
    # Stephansdom: hoher Südturm mit Rippenhelm, Schiff mit steilem Dach
    c.rect(900, G-420, 1700, G); c.add([(890, G-420), (1710, G-420), (1600, G-640), (1000, G-640)])
    c.rect(1080, G-800, 1230, G); c.add([(1070, G-800), (1240, G-800), (1155, G-1450)]);
    c.rect(1560, G-640, 1680, G-420); nadel(c, 1620, G-640, 130, G-850)
    # Riesenrad
    cx, cy, r = 2100, G-480, 440
    for t in range(60):
        a0 = 2*math.pi*t/60; a1 = 2*math.pi*(t+1)/60
        c.add([(cx+(r-18)*math.cos(a0), cy+(r-18)*math.sin(a0)), (cx+(r+18)*math.cos(a0), cy+(r+18)*math.sin(a0)),
               (cx+(r+18)*math.cos(a1), cy+(r+18)*math.sin(a1)), (cx+(r-18)*math.cos(a1), cy+(r-18)*math.sin(a1))])
    for k in range(8):
        a = math.pi*k/8; dx, dy = math.cos(a), math.sin(a)
        c.add([(cx-dx*r-dy*9, cy-dy*r+dx*9), (cx-dx*r+dy*9, cy-dy*r-dx*9), (cx+dx*r+dy*9, cy+dy*r-dx*9), (cx+dx*r-dy*9, cy+dy*r+dx*9)])
    c.circ(cx, cy, 50); c.add([(cx-170, G), (cx+170, G), (cx+14, cy), (cx-14, cy)])
    for k in range(16):
        a = 2*math.pi*k/16; c.rect(cx+r*math.cos(a)-34, cy+r*math.sin(a)-10, cx+r*math.cos(a)+34, cy+r*math.sin(a)+46)
    return c

def s_athen():
    c = C(2600, 1200); G = 1050
    berg(c, [(20, G), (380, 880), (700, 800), (1900, 800), (2300, 900), (2580, G)], G, rau=.07, seed=77)
    # Parthenon: Stufen, Säulen, Giebel
    for i in range(3): c.rect(700-i*30, 800-i*0-0, 1900+i*30, 800)
    c.rect(650, 770, 1950, 800)
    for i in range(10): c.rect(720+i*128, 460, 720+i*128+74, 770)
    c.rect(680, 400, 1920, 460); c.add([(680, 400), (1920, 400), (1300, 280)])
    c.cut([(1000, 392), (1600, 392), (1300, 316)])
    return c

def s_pyramiden():
    c = C(2600, 1100); G = 1000
    c.add([(100, G), (900, 280), (1000, 280), (1100, G)]) if False else None
    c.add([(100, G), (780, 300), (1460, G)]); c.add([(1000, G), (1500, 540), (2000, G)]); c.add([(1800, G), (2100, 740), (2400, G)])
    # Sphinx: Löwenkörper mit Kopf
    c.add([(1950, G), (1950, 880), (2020, 860), (2060, 780), (2100, 770), (2150, 800), (2150, 870), (2500, 880), (2540, G)]) if False else None
    return c

def s_schloss():
    c = C(2600, 1500); G = 1350
    berg(c, [(20, G), (500, 1180), (1000, 1010), (1700, 1010), (2200, 1170), (2580, G)], G, rau=.1, seed=55)
    c.rect(800, 650, 1800, 1030); c.add([(780, 650), (1820, 650), (1500, 520), (1100, 520)])
    # Märchenschloss: viele spitze Türme
    for cx, w, top in [(900, 150, 280), (1160, 120, 180), (1330, 140, 120), (1520, 120, 230), (1700, 150, 330)]:
        c.rect(cx-w/2, top+150, cx+w/2, 1030); nadel(c, cx, top+150, w*1.3, top-200 if cx != 1330 else top-260)
    c.cut([(1280, 1030), (1280, 900), (1330, 860), (1380, 900), (1380, 1030)])
    fenster(c, 820, 700, 1780, 1000, 14, 2, 24, 60)
    return c


STAEDTE = {
    'stadt-zuerich': s_zuerich, 'stadt-bern': s_bern, 'stadt-basel': s_basel, 'stadt-luzern': s_luzern, 'stadt-genf': s_genf,
    'stadt-paris': s_paris, 'stadt-newyork': s_newyork, 'stadt-london': s_london, 'stadt-rom': s_rom, 'stadt-berlin': s_berlin,
     'stadt-pisa': s_pisa, 'stadt-dorf-kirche': s_dorf, 'stadt-hochhaeuser': s_hochhaeuser,
    'stadt-burg': s_burg, 'stadt-muehlen': s_muehlen, 'stadt-tokio': s_tokio, 'stadt-dubai': s_dubai, 'stadt-venedig': s_venedig,
    'stadt-moskau': s_moskau, 'stadt-amsterdam': s_amsterdam, 'stadt-wien': s_wien, 'stadt-athen': s_athen,
    'stadt-pyramiden': s_pyramiden, 'stadt-schloss': s_schloss,
}
ALLE = {**BERGE, **STAEDTE}

if __name__ == '__main__':
    ids = sys.argv[1:] or list(ALLE)
    os.makedirs(BILDER, exist_ok=True)
    for i in ids:
        ALLE[i]().save(i); print('ok', i)
