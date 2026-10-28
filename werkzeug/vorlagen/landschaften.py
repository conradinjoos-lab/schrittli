"""Eigene Landschaften und Wahrzeichen für «Berge» und «Städte» (Schrittli): realistische Silhouetten (schwarz
mit hellen Einschnitten) und Comic-Bilder (flache Farben, dicke schwarze Umrisse). Alles selbst gezeichnet (CC0).
Aufruf: python -I landschaften.py [<id> …]  schreibt bilder/<id>.png nach werkzeug/vorlagen/bilder/.
Danach: python -I bild.py <id> …"""
import os, sys, math, random
HIER = os.path.dirname(os.path.abspath(__file__))
if HIER not in sys.path: sys.path.insert(0, HIER)
from PIL import Image, ImageDraw, ImageFilter, ImageChops, ImageOps
import silhouetten as S
from silhouetten import C, SS, BILDER, reihe, haus, fenster, uhr, grat, berg, tanne, nadel, zwiebel, kuppel, zinnen, bogen, _dil, _ero, ebene, auflegen, umriss, kappe, linie, wolke, vogel

SCHWARZ = (20, 20, 24, 255)


def _dl(m, r):
    """Dilatation nur im Umfeld der Form (schneller als über die ganze Fläche)."""
    bb = m.getbbox()
    if not bb: return m
    p = int(r*SS*2 + 4); x0, y0 = max(0, bb[0]-p), max(0, bb[1]-p); x1, y1 = min(m.width, bb[2]+p), min(m.height, bb[3]+p)
    t = m.crop((x0, y0, x1, y1)).filter(ImageFilter.GaussianBlur(r*SS/2)).point(lambda v: 255 if v > 6 else 0)
    out = Image.new('L', m.size, 0); out.paste(t, (x0, y0)); return out


def hexf(h): return tuple(int(h[i:i+2], 16) for i in (1, 3, 5)) + (255,)


class K:
    """Comic-Zeichenfläche: jede Form bekommt einen dicken schwarzen Rand; clip= beschränkt die Füllung auf eine Maske."""
    def __init__(s, w, h):
        s.w, s.h = w, h
        s.im = Image.new('RGBA', (w*SS, h*SS), (0, 0, 0, 0))

    def _maske(s, zeichne):
        m = Image.new('L', s.im.size, 0); zeichne(ImageDraw.Draw(m)); return m

    def maske_poly(s, pts): return s._maske(lambda d: d.polygon([(x*SS, y*SS) for x, y in pts], fill=255))

    def fuell(s, m, farbe, rand=0, clip=None):
        if clip is not None: m = ImageChops.darker(m, clip)
        if rand:
            s.im.paste(SCHWARZ, mask=_dl(m, rand))
        s.im.paste(hexf(farbe) if isinstance(farbe, str) else farbe, mask=m)
        return m

    def form(s, pts, farbe, rand=12, clip=None): return s.fuell(s.maske_poly(pts), farbe, rand, clip)

    def kreis(s, cx, cy, r, farbe, rand=12, clip=None):
        return s.fuell(s._maske(lambda d: d.ellipse([(cx-r)*SS, (cy-r)*SS, (cx+r)*SS, (cy+r)*SS], fill=255)), farbe, rand, clip)

    def rect(s, x0, y0, x1, y1, farbe, rand=12, clip=None): return s.form([(x0, y0), (x1, y0), (x1, y1), (x0, y1)], farbe, rand, clip)

    def strich(s, p0, p1, w=10, farbe=None):
        (x0, y0), (x1, y1) = p0, p1; d = math.hypot(x1-x0, y1-y0) or 1; nx, ny = -(y1-y0)/d*w/2, (x1-x0)/d*w/2
        s.fuell(s.maske_poly([(x0+nx, y0+ny), (x1+nx, y1+ny), (x1-nx, y1-ny), (x0-nx, y0-ny)]), farbe or SCHWARZ, 0)
        for (x, y) in (p0, p1):
            s.fuell(s._maske(lambda d: d.ellipse([(x-w/2)*SS, (y-w/2)*SS, (x+w/2)*SS, (y+w/2)*SS], fill=255)), farbe or SCHWARZ, 0)

    def linienzug(s, pts, w=10, farbe=None, clip=None):
        if clip is None:
            for a, b in zip(pts, pts[1:]): s.strich(a, b, w, farbe)
            return
        def z(d):
            d.line([(x*SS, y*SS) for x, y in pts], fill=255, width=int(w*SS), joint='curve')
            for x, y in pts: d.ellipse([(x-w/2)*SS, (y-w/2)*SS, (x+w/2)*SS, (y+w/2)*SS], fill=255)
        s.fuell(ImageChops.darker(s._maske(z), clip), farbe or SCHWARZ, 0)

    def wolke(s, cx, cy, sz, farbe='#ffffff', rand=12):
        m = s._maske(lambda d: [d.ellipse([(cx+dx*sz-r*sz)*SS, (cy+dy*sz-r*sz)*SS, (cx+dx*sz+r*sz)*SS, (cy+dy*sz+r*sz)*SS], fill=255)
                                 for dx, dy, r in [(-1.3, .25, .55), (-.55, -.15, .8), (.35, -.35, 1.0), (1.2, -.05, .75), (1.8, .25, .5)]]
                      + [d.rectangle([(cx-1.3*sz)*SS, (cy+.2*sz)*SS, (cx+1.8*sz)*SS, (cy+.8*sz)*SS], fill=255)])
        return s.fuell(m, farbe, rand)

    def save(s, name):
        im = s.im.resize((s.w, s.h), Image.LANCZOS)
        bb = im.getchannel('A').getbbox(); r = 24
        im = im.crop((max(0, bb[0]-r), max(0, bb[1]-r), min(s.w, bb[2]+r), min(s.h, bb[3]+r)))
        im.save(os.path.join(BILDER, name + '.png'))


def zack(x0, x1, y, amp=40, n=7, seed=1, nach='unten'):
    """Zackenlinie von x0 nach x1 (Schneegrenze)."""
    rnd = random.Random(seed); pts = [(x0, y)]
    for i in range(1, n):
        x = x0 + (x1-x0)*i/n; pts.append((x, y + (amp if i % 2 else -amp*.25)*rnd.uniform(.7, 1.2)))
    pts.append((x1, y)); return pts


def schattenseite(gipfel, sx, G):
    """Fläche rechts der Linie Gipfel -> Fusspunkt (sx, G), weit nach unten verlängert."""
    gx, gy = gipfel; dx, dy = sx - gx, G - gy; ex, ey = gx + 3*dx, gy + 3*dy
    return [(gx, gy - 60), (gx + 6000, gy - 60), (gx + 6000, ey), (ex, ey)]


def comic_berg(k, pts, gipfel, farbe, dunkel, schnee_y=None, rand=14, sx=None, schnee='#ffffff', schnee_dunkel='#cfe0f2'):
    """Comic-Berg mit heller und dunkler Seite und optionaler Schneekappe."""
    m = k.form(pts, farbe, rand); gx, gy = gipfel
    sm = k.maske_poly(schattenseite(gipfel, sx if sx is not None else gx + 60, max(p[1] for p in pts)))
    k.fuell(sm, dunkel, 0, clip=m)
    if schnee_y:
        lin = zack(gx - 900, gx + 900, schnee_y, 55, 11, seed=int(gx) % 97)
        cap = ImageChops.darker(k.maske_poly([(gx - 1000, gy - 200)] + lin + [(gx + 1000, gy - 200)]), m)
        k.fuell(cap, schnee, 0)
        k.fuell(ImageChops.darker(cap, sm), schnee_dunkel, 0)
        k.linienzug(lin, 9, clip=m)
    k.fuell(ImageChops.subtract(_dl(m, rand), m), SCHWARZ, 0)
    return m


def tanne_comic(k, cx, fuss, h, w, farbe='#2e8b3d'):
    k.rect(cx - w*.07, fuss - h*.16, cx + w*.07, fuss, '#7b4a24', 8)
    for i in range(3):
        y1 = fuss - h*.1 - i*h*.27; y0 = y1 - h*.42; bw = w*(.5 - i*.1)
        k.form([(cx - bw, y1), (cx + bw, y1), (cx, y0)], farbe, 8)


def haus_comic(k, x, G, w, h, wand='#f3e3c3', dach='#c0392b', dachh=None, ueber=14):
    dachh = dachh or w*.5
    k.rect(x, G-h, x+w, G, wand, 10)
    k.form([(x-ueber, G-h), (x+w+ueber, G-h), (x+w/2, G-h-dachh)], dach, 10)
    k.rect(x+w*.4, G-h*.6, x+w*.6, G, '#8a5a2b', 7)
    k.rect(x+w*.12, G-h*.75, x+w*.3, G-h*.45, '#9fd3f2', 7)
    k.rect(x+w*.7, G-h*.75, x+w*.88, G-h*.45, '#9fd3f2', 7)


# ------------------------------------------------------------------ Comic-Berge
def c_fuji():
    k = K(2200, 1300); G = 1180
    k.kreis(520, 330, 190, '#e53935', 14)
    m = k.form([(60, G), (820, 520), (900, 440), (1380, 440), (1460, 520), (2140, G)], '#5b86c4', 16)
    k.fuell(k.maske_poly([(1100, 380), (2300, 380), (2300, G+60), (1200, G+60)]), '#3f68a6', 0, clip=m)
    lin = zack(780, 1520, 600, 70, 9, seed=5)
    cap = ImageChops.darker(k.maske_poly([(700, 380)] + lin + [(1600, 380)]), m)
    k.fuell(cap, '#ffffff', 0)
    k.fuell(ImageChops.darker(cap, k.maske_poly([(1100, 380), (2300, 380), (2300, G+60), (1200, G+60)])), '#cfe0f2', 0)
    k.linienzug(lin, 10, clip=m)
    k.fuell(ImageChops.subtract(_dl(m, 16), m), SCHWARZ, 0)
    k.wolke(520, 900, 130, rand=14); k.wolke(1750, 1000, 150, rand=14)
    return k


def c_schnee():
    k = K(2600, 1500); G = 1360
    comic_berg(k, [(40, G), (560, 760), (830, 560), (1100, G)], (830, 560), '#7d8fa6', '#5a6b82', 700, sx=900)
    comic_berg(k, [(1600, G), (1960, 720), (2250, 520), (2580, G)], (2250, 520), '#7d8fa6', '#5a6b82', 680, sx=2330)
    comic_berg(k, [(500, G), (980, 700), (1300, 150), (1620, 700), (2100, G)], (1300, 150), '#8fa3bd', '#667a96', 440, sx=1380)
    for cx, fh in [(240, 280), (400, 220), (2100, 260), (2300, 300), (2450, 220)]:
        tanne_comic(k, cx, G+40, fh, 200)
    return k


def c_alm():
    k = K(2400, 1500); G = 1400
    k.kreis(1980, 280, 150, '#ffd54a', 14)
    comic_berg(k, [(500, 900), (1100, 560), (1350, 360), (1700, 600), (2150, 900)], (1350, 360), '#8fa3bd', '#667a96', 500, sx=1450)
    k.form([(20, 1000), (500, 860), (900, 930), (1400, 840), (1900, 930), (2380, 880), (2380, G), (20, G)], '#7cc95a', 14)
    k.form([(20, 1220), (600, 1120), (1200, 1200), (1800, 1110), (2380, 1180), (2380, G), (20, G)], '#5fb046', 14)
    haus_comic(k, 1000, 1180, 330, 200, '#f3d9a8', '#c0392b', 170)
    tanne_comic(k, 650, 1200, 300, 200); tanne_comic(k, 820, 1180, 240, 170); tanne_comic(k, 1560, 1170, 280, 190)
    # Kuh: Körper, Kopf, Flecken
    k.rect(1700, 1230, 1950, 1330, '#ffffff', 10); k.rect(1720, 1330, 1750, 1400, '#ffffff', 8); k.rect(1890, 1330, 1920, 1400, '#ffffff', 8)
    k.rect(1930, 1190, 2040, 1280, '#ffffff', 10); k.rect(1960, 1260, 2040, 1300, '#f4a6b8', 8)
    k.kreis(1790, 1260, 26, '#333333', 0); k.kreis(1880, 1290, 20, '#333333', 0)
    return k


def c_sonnenuntergang():
    k = K(2600, 1400); G = 1300
    k.kreis(1300, 560, 380, '#ffb347', 16)
    lagen = [('#a98ad1', [(20, 700), (420, 520), (760, 640), (1150, 400), (1500, 600), (1900, 460), (2400, 650), (2580, 600), (2580, G), (20, G)]),
             ('#7b5fb0', [(20, 900), (360, 720), (800, 880), (1300, 760), (1800, 920), (2200, 780), (2580, 900), (2580, G), (20, G)]),
             ('#4e3a82', [(20, 1100), (500, 940), (1000, 1080), (1500, 960), (2000, 1100), (2580, 980), (2580, G), (20, G)])]
    for f, pts in lagen: k.form(pts, f, 16)
    return k


def c_vulkan():
    k = K(2200, 1500); G = 1380
    k.wolke(1350, 200, 140, '#9aa3ad', 14); k.wolke(900, 330, 110, '#b5bcc4', 14)
    m = k.form([(80, G), (780, 620), (900, 540), (1400, 540), (1520, 620), (2120, G)], '#8d5a3b', 16)
    k.fuell(k.maske_poly([(1160, 500), (2300, 500), (2300, G+60), (1100, G+60)]), '#6b4128', 0, clip=m)
    k.form([(900, 540), (1400, 540), (1300, 600), (1150, 560), (1020, 620)], '#ffb300', 12)
    lava = [(1100, 600), (1200, 700), (1150, 860), (1280, 1000), (1220, 1200), (1360, 1380), (1200, 1380), (1070, 1200), (1120, 1000), (1000, 860), (1060, 700)]
    k.form(lava, '#ff6f1f', 12, clip=m)
    k.form([(940, 520), (1010, 360), (1090, 500)], '#ff8a1f', 10); k.form([(1180, 520), (1260, 330), (1340, 500)], '#ffb300', 10)
    return k


def c_gipfel():
    k = K(2400, 1400); G = 1300
    comic_berg(k, [(60, G), (700, 760), (1050, 400), (1180, 220), (1260, 220), (1500, 520), (1900, 900), (2340, G)], (1220, 220), '#7d8fa6', '#5a6b82', 560, sx=1320)
    k.strich((1230, 220), (1230, 20), 16); k.form([(1230, 20), (1420, 80), (1230, 140)], '#e53935', 10)
    k.wolke(420, 380, 120, rand=14); k.wolke(1850, 280, 130, rand=14); k.wolke(1050, 900, 110, rand=14)
    return k


# ------------------------------------------------------------------ realistische Silhouetten
def licht(c, poly, rand=26, schraf=True, winkel=64, abstand=40, seed=5):
    """Helle Seite im Berg: Teil des Berges innerhalb poly, mit schwarzem Rand ringsum und Schraffur (wie ein Stich)."""
    e = ebene(c); e.add(poly)
    orig = c.m.copy()
    lit = ImageChops.darker(_ero(orig, rand), e.m)
    c.m = ImageChops.subtract(c.m, lit)
    if schraf:
        rnd = random.Random(seed); h = ebene(c)
        dx, dy = -math.cos(math.radians(winkel)), math.sin(math.radians(winkel))
        t = -c.h
        while t < c.w + c.h:
            x0, y0 = t, 0; pos = 0.0
            while pos < c.h / dy:
                seg = rnd.uniform(50, 260); gap = rnd.uniform(20, 120)
                if rnd.random() < .85:
                    wd = rnd.uniform(6, 18)
                    linie(h, (x0 + dx*pos, y0 + dy*pos), (x0 + dx*(pos+seg) + rnd.uniform(-10, 10), y0 + dy*(pos+seg)), wd, 255)
                pos += seg + gap
            t += abstand
        c.m = ImageChops.lighter(c.m, ImageChops.darker(h.m, lit))
    c.d = ImageDraw.Draw(c.m)
    return orig, e.m


def baender(c, orig, pts_liste, w=14, seed=1, rau=.18, nur=None):
    """Schwarze, zackige Gesteinsbänder in der hellen Seite (bleiben im Berg)."""
    e = ebene(c)
    for i, pts in enumerate(pts_liste):
        gz = grat(pts, rau=rau, seed=seed + i, tiefe=3)
        for p, q in zip(gz, gz[1:]): linie(e, p, q, w, 255)
    m = ImageChops.darker(e.m, orig)
    if nur is not None: m = ImageChops.darker(m, nur)
    c.m = ImageChops.lighter(c.m, m); c.d = ImageDraw.Draw(c.m)


def flecken(c, cx, cy, rx, ry, seed=1):
    """Schneefleck: unregelmässige helle Form."""
    rnd = random.Random(seed)
    c.add([(cx + rx*math.cos(t)*rnd.uniform(.75, 1.05), cy + ry*math.sin(t)*rnd.uniform(.7, 1.1)) for t in [i*math.pi/9 for i in range(18)]], 0)


def r_matterhorn():
    c = C(2200, 1500); G = 1400
    gp = [(40, G), (420, 1160), (720, 1000), (860, 840), (960, 700), (1060, 560), (1130, 420), (1190, 300), (1245, 170), (1290, 110), (1320, 170), (1340, 280),
          (1420, 430), (1500, 570), (1590, 650), (1660, 780), (1800, 910), (2020, 1110), (2160, G)]
    berg(c, gp, G, rau=.05, seed=61, tiefe=5)
    orig, _ = licht(c, [(0, 0), (1295, 0), (1250, 500), (1180, 900), (1120, G), (0, G)], 24)
    baender(c, orig, [[(1250, 260), (1100, 320), (960, 480)], [(1230, 420), (1060, 520), (900, 690)], [(1200, 600), (1000, 700), (800, 900)],
                      [(1170, 800), (950, 900), (700, 1080)], [(1150, 1000), (900, 1100), (500, 1250)]], 15, 5, .14)
    for cx, cy, rx, ry, sd in [(1390, 560, 70, 34, 1), (1550, 720, 80, 30, 2), (1330, 820, 100, 36, 3), (1700, 880, 90, 28, 4), (1450, 1000, 110, 34, 5)]:
        flecken(c, cx, cy, rx, ry, sd)
    return c


def r_eiger():
    c = C(2400, 1400); G = 1300
    gp = [(20, G), (360, 1060), (620, 900), (800, 760), (1000, 610), (1200, 380), (1360, 230), (1470, 150), (1560, 170), (1650, 290), (1780, 480), (1980, 760), (2160, 960), (2380, G)]
    berg(c, gp, G, rau=.05, seed=62, tiefe=5)
    orig, _ = licht(c, [(700, 0), (1480, 0), (1500, 400), (1560, G), (500, G)], 24)
    senk = [[(x, 250 + (x-1200)*.25), (x - 30, 620), (x + 20, 940), (x - 50, G)] for x in (1180, 1260, 1340, 1420)]
    baender(c, orig, senk, 14, 11, .1)
    baender(c, orig, [[(1100, 560), (1300, 520), (1560, 560)], [(1020, 780), (1300, 740), (1560, 800)], [(940, 1000), (1300, 960), (1580, 1010)]], 18, 21, .16)
    for cx, cy, rx, ry, sd in [(1000, 880, 100, 30, 1), (1800, 660, 80, 26, 2)]: flecken(c, cx, cy, rx, ry, sd)
    return c


def r_panorama():
    c = C(3000, 1300); G = 1200
    lagen = [(70, 300, 800, 5), (80, 520, 1000, 6), (90, 760, 1100, 7), (100, 960, 1150, 8)]
    for sd, y0, ybase, tf in lagen:
        pts = [(20, y0 + 260)]; rnd = random.Random(sd); x = 20
        while x < 2900:
            x += rnd.randint(160, 340); pts.append((x, y0 + rnd.randint(-190, 190)))
        pts.append((2980, y0 + 300))
        e = ebene(c); berg(e, pts, G, rau=.14, seed=sd, tiefe=6); auflegen(c, e, 26)
    return c


def r_bergsee():
    c = C(2400, 1700); G = 900
    berg(c, [(60, G), (420, 640), (720, 520), (1000, 260), (1180, 180), (1360, 300), (1700, 560), (2000, 700), (2340, G)], G, rau=.1, seed=63, tiefe=5)
    oben = c.m.crop((0, 0, c.w*SS, G*SS)); c.m.paste(oben.transpose(Image.FLIP_TOP_BOTTOM), (0, (G+70)*SS))
    y = G + 70; h = 12
    while y < c.h - 120:
        c.rect(0, y, c.w, y+h, 0); y += 62; h += 5
    c.rect(0, G+20, c.w, G+60, 0)
    e = ebene(c)
    for i, x in enumerate(range(60, 520, 90)): tanne(e, x, G+30, 260 + (i*37 % 80), 150)
    for i, x in enumerate(range(1900, 2360, 100)): tanne(e, x, G+30, 280 + (i*29 % 90), 160)
    auflegen(c, e, 14)
    return c


def r_tannengrat():
    c = C(2600, 1400); G = 1300
    berg(c, [(40, G), (700, 840), (1200, 560), (1500, 430), (1900, 700), (2560, G)], G, rau=.13, seed=64, tiefe=5)
    rnd = random.Random(7)
    # Tannen am Grat entlang, im Vordergrund als helle Ebene abgesetzt
    e = ebene(c)
    for x in range(60, 2560, 90):
        # Höhe der Bergkante bei x grob interpolieren
        pts = [(40, G), (700, 840), (1200, 560), (1500, 430), (1900, 700), (2560, G)]
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            if x0 <= x <= x1: yb = y0 + (y1-y0)*(x-x0)/(x1-x0); break
        h = rnd.randint(190, 330); tanne(e, x, yb + 60 + rnd.randint(0, 60), h, rnd.randint(120, 170))
    auflegen(c, e, 14)
    return c


# ------------------------------------------------------------------ weitere Berge
def r_jungfrau():
    c = C(3000, 1400); G = 1300
    gp = [(20, G), (300, 1000), (560, 700), (760, 520), (900, 420), (1000, 500), (1120, 380), (1260, 300), (1380, 240), (1500, 330), (1640, 460), (1760, 560), (1900, 440), (2040, 320),
          (2160, 200), (2260, 150), (2330, 220), (2480, 520), (2620, 760), (2980, G)]
    berg(c, gp, G, rau=.06, seed=71, tiefe=5)
    orig, _ = licht(c, [(0, 0), (1390, 0), (1480, 600), (1560, G), (0, G)], 22)
    baender(c, orig, [[(1300, 380), (1100, 480), (900, 700)], [(1250, 620), (1000, 760), (700, 1000)], [(1200, 900), (900, 1020), (400, 1200)]], 14, 3, .16)
    orig2, _ = licht(c, [(1700, 0), (2275, 0), (2230, 500), (2150, 800), (2100, G), (1700, G)], 22)
    baender(c, orig2, [[(2230, 300), (2080, 420), (1900, 600)], [(2200, 560), (2000, 700), (1800, 800)]], 13, 8, .16)
    for cx, cy, rx, ry, sd in [(1900, 1000, 100, 28, 1), (2450, 900, 100, 30, 2), (800, 900, 90, 26, 3)]: flecken(c, cx, cy, rx, ry, sd)
    return c


def r_kamm():
    c = C(2800, 1500); G = 1400
    gp = [(20, G), (500, 1000), (800, 780), (1060, 520), (1300, 360), (1480, 440), (1760, 640), (2060, 760), (2400, 980), (2780, G)]
    g = berg(c, gp, G, rau=.09, seed=72, tiefe=5)
    orig, _ = licht(c, [(0, 0), (1320, 0), (1380, 600), (1500, G), (0, G)], 24)
    baender(c, orig, [[(1250, 420), (1050, 560), (800, 820)], [(1200, 700), (950, 860), (600, 1120)]], 14, 4, .16)
    e = ebene(c)
    rnd = random.Random(9)
    for x in range(40, 2780, 100):
        yb = None
        for (x0, y0), (x1, y1) in zip(gp, gp[1:]):
            if x0 <= x <= x1: yb = y0 + (y1-y0)*(x-x0)/(x1-x0); break
        if yb is None or yb > G - 120: continue
        h = rnd.randint(170, 300); tanne(e, x, yb + 200 + rnd.randint(0, 50), h, rnd.randint(110, 150))
    auflegen(c, e, 14)
    return c


def c_matterhorn():
    k = K(2200, 1500); G = 1400
    pts = [(60, G), (520, 1050), (820, 760), (1000, 520), (1120, 330), (1200, 160), (1270, 80), (1330, 150), (1400, 320), (1500, 520), (1640, 760), (1900, 1060), (2140, G)]
    comic_berg(k, pts, (1270, 80), '#8a9bb5', '#5d6f8d', 520, sx=1360)
    k.wolke(380, 520, 120, rand=14); k.wolke(1900, 380, 130, rand=14)
    k.kreis(250, 200, 110, '#ffd54a', 14)
    return k


def c_huette():
    k = K(2400, 1500); G = 1400
    comic_berg(k, [(300, 1000), (900, 700), (1300, 360), (1700, 760), (2300, 1000)], (1300, 360), '#8a9bb5', '#5d6f8d', 560, sx=1400)
    k.form([(20, 1060), (700, 980), (1400, 1060), (2100, 960), (2380, 1010), (2380, G), (20, G)], '#ffffff', 14)
    k.form([(20, 1300), (800, 1230), (1600, 1300), (2380, 1240), (2380, G), (20, G)], '#dfe9f3', 14)
    haus_comic(k, 900, 1140, 380, 240, '#b5753c', '#ffffff', 190)
    k.rect(1010, 1020, 1070, 1090, '#ffd54a', 6)
    for cx, fh in [(500, 360), (680, 300), (1560, 330), (1750, 400), (1950, 300)]:
        tanne_comic(k, cx, 1170 if cx < 1200 else 1150, fh, 220, '#2f7d4a')
    k.kreis(2000, 260, 110, '#ffd54a', 14); k.wolke(500, 300, 120, rand=14)
    return k


def c_see():
    k = K(2400, 1500); G = 1400
    comic_berg(k, [(60, 900), (500, 660), (800, 500), (1100, 220), (1250, 280), (1600, 560), (2000, 700), (2340, 900)], (1100, 220), '#8a9bb5', '#5d6f8d', 430, sx=1200)
    k.form([(20, 880), (2380, 880), (2380, G), (20, G)], '#5aaee0', 14)
    for y in (1030, 1130, 1240):
        k.linienzug([(300, y), (460, y - 24), (620, y), (780, y - 24), (940, y)], 12)
        k.linienzug([(1500, y + 40), (1660, y + 16), (1820, y + 40), (1980, y + 16)], 12)
    # Boot
    k.form([(980, 1020), (1560, 1020), (1450, 1130), (1090, 1130)], '#c0392b', 12)
    k.rect(1250, 800, 1272, 1020, '#7b4a24', 6); k.form([(1290, 820), (1290, 990), (1480, 990)], '#ffffff', 10)
    for cx, fh in [(160, 360), (340, 300), (2120, 340), (2280, 400)]: tanne_comic(k, cx, 900, fh, 210)
    return k


def c_zelt():
    k = K(2400, 1500); G = 1400
    for cx, f in [(500, '#5d6f8d'), (1900, '#5d6f8d')]:
        pass
    comic_berg(k, [(20, 1000), (500, 560), (780, 780), (1050, 440), (1300, 800), (1700, 620), (2000, 740), (2380, 1000)], (1050, 440), '#6c7fa0', '#4d5f80', 640, sx=1150)
    k.form([(20, 1080), (2380, 1080), (2380, G), (20, G)], '#5fb046', 14)
    k.form([(760, 1370), (1090, 1050), (1420, 1370)], '#f39c12', 14)
    k.form([(1020, 1370), (1090, 1190), (1160, 1370)], '#7a4a12', 8)
    k.kreis(1850, 1250, 70, '#ff7a18', 12); k.form([(1790, 1260), (1850, 1120), (1910, 1260)], '#ffd54a', 8)
    for cx, y in [(300, 300), (700, 160), (1500, 260), (1900, 150), (2200, 330)]:
        k.form([(cx, y - 40), (cx + 14, y - 14), (cx + 40, y), (cx + 14, y + 14), (cx, y + 40), (cx - 14, y + 14), (cx - 40, y), (cx - 14, y - 14)], '#ffd54a', 8)
    return k


def c_ski():
    k = K(2400, 1500); G = 1400
    m = comic_berg(k, [(60, G), (700, 760), (1150, 280), (1500, 640), (2340, G)], (1150, 280), '#8a9bb5', '#5d6f8d', 520, sx=1260)
    # Seilbahn
    k.linienzug([(1250, 120), (2250, 1000)], 8)
    k.rect(1700, 650, 1860, 780, '#e53935', 10); k.strich((1780, 650), (1780, 560), 8)
    k.rect(1760, 690, 1800, 740, '#9fd3f2', 5)
    for cx, fh in [(250, 330), (420, 260), (2100, 320), (2260, 380)]: tanne_comic(k, cx, 1380, fh, 200)
    return k


# ------------------------------------------------------------------ Städte, realistisch
def welle(c, y, x0, x1, amp=10, per=90, w=8):
    pts = [(x, y + amp*math.sin((x-x0)/per*2*math.pi)) for x in range(int(x0), int(x1)+1, 12)]
    for p, q in zip(pts, pts[1:]): linie(c, p, q, w, 0)


def r_schaffhausen():
    c = C(3000, 1500); G = 1150
    # Munotshügel mit Reben
    berg(c, [(0, G), (0, 880), (260, 760), (460, 700), (800, 700), (1000, 790), (1180, G)], G, rau=.04, seed=5, tiefe=4)
    for i in range(14):
        x = -100 + i*80
        linie(c, (x, G), (x + 380, 760), 9, 0)
    # Munot: breiter Rundbau mit Zinnen und kleinem Turm mit Kegeldach
    c.rect(260, 560, 920, 740)
    zinnen(c, 260, 920, 560, 38)
    c.rect(500, 450, 680, 560)
    zinnen(c, 500, 680, 450, 26)
    c.rect(560, 380, 620, 450); nadel(c, 590, 380, 110, 270)
    for x in (320, 420, 720, 820): c.rect(x, 620, x + 30, 700, 0)
    # Altstadt
    reihe(c, 1000, 2960, G, 170, 300, 77, .8, 90, 170)
    # Münster: breites Dach, Turm
    c.rect(1280, G - 380, 1720, G); c.add([(1260, G - 380), (1740, G - 380), (1500, G - 560)])
    c.rect(1700, G - 560, 1810, G); nadel(c, 1755, G - 560, 128, G - 760)
    fenster(c, 1320, G - 330, 1700, G - 120, 6, 1, 24, 90)
    # Fronwagturm: Turm mit Spitze, Uhrscheibe und Erkern
    c.rect(2020, G - 640, 2150, G); c.add([(2010, G - 640), (2160, G - 640), (2085, G - 830)])
    nadel(c, 2085, G - 830, 30, G - 930); uhr(c, 2085, G - 500, 40)
    c.add([(2010, G - 640), (1990, G - 610), (2010, G - 585)]); c.add([(2160, G - 640), (2180, G - 610), (2160, G - 585)])
    # St. Johann: Turm mit schlankem Helm
    c.rect(2480, G - 520, 2590, G); nadel(c, 2535, G - 520, 124, G - 780)
    for dx in (-48, 48): c.add([(2535 + dx - 22, G - 520), (2535 + dx + 22, G - 520), (2535 + dx, G - 610)])
    # Rhein und Brücke
    c.rect(0, G + 30, 3000, G + 190)
    for y in (G + 70, G + 120, G + 165): welle(c, y, 0, 560, 8, 110, 7); welle(c, y + 8, 1500, 3000, 8, 110, 7)
    c.rect(560, G + 20, 1500, G + 70)
    for i in range(4): bogen(c, 660 + i*210, G + 190, 70, 130)
    return c


def r_rheinfall():
    c = C(2600, 1500); G = 1250
    berg(c, [(0, G), (0, 600), (260, 560), (420, 640), (640, 700), (700, 940), (760, G)], G, rau=.1, seed=3, tiefe=4)
    # Schloss Laufen auf dem linken Felsen
    c.rect(150, 340, 470, 600); c.add([(130, 340), (490, 340), (310, 200)]); c.rect(360, 220, 460, 340); nadel(c, 410, 220, 130, 90)
    fenster(c, 190, 400, 440, 560, 4, 2, 24, 40)
    # Mittelfelsen mit Krone
    berg(c, [(1080, G), (1130, 900), (1220, 700), (1300, 640), (1380, 720), (1470, 900), (1540, G)], G, rau=.1, seed=4, tiefe=4)
    for x in (1270, 1310, 1350): c.rect(x - 9, 560, x + 9, 640)
    c.add([(1250, 560), (1370, 560), (1310, 480)])
    # rechtes Ufer
    berg(c, [(1900, G), (1960, 760), (2100, 640), (2300, 600), (2600, 640), (2600, G)], G, rau=.1, seed=6, tiefe=4)
    # Wasser: schwarze Fallstreifen zwischen den Felsen, helle Wellen im Becken
    for i in range(38):
        x = 790 + i*29; h = random.Random(i).randint(0, 140)
        linie(c, (x, 780 + h), (x + 4, G - 60), 15, 255)
    c.rect(760, G - 40, 1900, G)
    for y in (G - 30, G - 90): welle(c, y, 700, 1950, 8, 150, 8)
    return c


def r_goldengate():
    c = C(3000, 1500); G = 1250
    c.rect(0, G + 20, 3000, G + 60)
    for x in (900, 2100):
        c.rect(x - 38, 360, x + 38, G)
        for y in (390, 720, 1030): c.rect(x - 92, y, x + 92, y + 40)

    def seil(x0, x1, y0, y1, ymid):
        out = []
        for i in range(81):
            t = i/80; out.append((x0 + (x1 - x0)*t, y0 + (y1 - y0)*t + 4*(t - t*t)*(ymid - (y0 + y1)/2)))
        return out
    for sg in [seil(0, 900, 1000, 380, 1000), seil(900, 2100, 380, 380, 1080), seil(2100, 3000, 380, 1000, 1000)]:
        for p, q in zip(sg, sg[1:]): linie(c, p, q, 14, 255)
        for i in range(0, 81, 2):
            x, y = sg[i]
            if y < G - 10: c.rect(x - 3, y, x + 3, G + 20)
    for y in (G + 110, G + 160, G + 210): welle(c, y, 0, 3000, 8, 140, 7)
    return c


def r_istanbul():
    c = C(2800, 1400); G = 1250
    c.rect(0, 1130, 2800, G)
    # Hagia Sophia: Hauptkuppel, Halbkuppeln, vier Minarette
    kuppel(c, 1400, 960, 300, 330, False)
    c.rect(1100, 960, 1700, 1130)
    kuppel(c, 1000, 1000, 200, 170, False); kuppel(c, 1800, 1000, 200, 170, False)
    kuppel(c, 1200, 960, 110, 120, False); kuppel(c, 1600, 960, 110, 120, False)
    for cx in (780, 2020):
        c.rect(cx - 22, 520, cx + 22, 1130); c.rect(cx - 34, 760, cx + 34, 780); nadel(c, cx, 520, 52, 360)
    for cx in (1060, 1740):
        c.rect(cx - 20, 560, cx + 20, 1000); c.rect(cx - 32, 800, cx + 32, 820); nadel(c, cx, 560, 48, 400)
    # Blaue Moschee: Kuppeln und Minarette
    for cx, r, h in [(300, 190, 180), (520, 140, 140), (160, 120, 110), (2420, 190, 180), (2640, 140, 140), (2300, 120, 110)]:
        c.rect(cx - r, 1010, cx + r, 1130); kuppel(c, cx, 1010, r, h, False)
    for cx in (100, 2700):
        c.rect(cx - 18, 640, cx + 18, 1130); nadel(c, cx, 640, 44, 500)
    for y in (1160, 1200, 1235): welle(c, y, 0, 2800, 7, 130, 6)
    return c


def r_prag():
    c = C(3000, 1500); G = 1300
    berg(c, [(0, G), (0, 960), (500, 900), (1100, 870), (1900, 880), (2600, 960), (3000, 1000), (3000, G)], G, rau=.05, seed=2, tiefe=4)
    # Hradschin: Veitsdom mit drei Türmen
    c.rect(1000, 500, 1900, 900)
    for cx, h in [(1130, 420), (1450, 480), (1770, 380)]:
        top = 900 - h - 160
        c.rect(cx - 75, top, cx + 75, 900); nadel(c, cx, top, 170, top - 260)
        c.rect(cx - 14, top - 290, cx + 14, top - 250)
    fenster(c, 1010, 600, 1890, 880, 12, 1, 30, 150)
    c.add([(980, 500), (1920, 500), (1450, 380)]); c.rect(700, 700, 1000, 900); c.rect(1900, 700, 2300, 900)
    reihe(c, 200, 2900, 930, 60, 130, 5, .8, 80, 140)
    # Karlsbrücke
    c.rect(300, G - 110, 2700, G - 60)
    for i in range(9): bogen(c, 450 + i*260, G, 90, 170)
    for cx in (360, 2640): c.rect(cx - 70, G - 300, cx + 70, G - 60); nadel(c, cx, G - 300, 150, G - 520)
    return c


def r_sagrada():
    c = C(2600, 1500); G = 1350
    c.rect(500, 900, 2100, G)
    kuppel(c, 1300, 900, 260, 90, False)
    xs = [620, 760, 900, 1040, 1160, 1300, 1440, 1560, 1700, 1840, 1980]
    hs = [640, 700, 760, 800, 860, 940, 860, 800, 760, 700, 640]
    for x, h in zip(xs, hs):
        w = 72 if x != 1300 else 130
        c.rect(x - w/2, G - h - 150, x + w/2, 920); nadel(c, x, G - h - 150, w*1.3, G - h - 330)
        c.circ(x, G - h - 340, 20)
    fenster(c, 520, 1000, 2080, 1330, 11, 2, 28, 100)
    c.cut([(1230, G), (1230, 1180), (1300, 1120), (1370, 1180), (1370, G)])
    return c


# ------------------------------------------------------------------ Städte, Comic
PASTELL = ['#f6d5a5', '#f3b8b0', '#cfe3a8', '#f7e9a0', '#b9d7ee', '#e4c3e8']
DACHROT = ['#c0392b', '#a8452c', '#8e3b2e']


def reihe_comic(k, x0, x1, G, hmin, hmax, seed, wmin=150, wmax=240):
    rnd = random.Random(seed); x = x0; i = 0
    while x < x1:
        w = rnd.randint(wmin, wmax); h = rnd.randint(hmin, hmax)
        haus_comic(k, x, G, w, h, PASTELL[i % len(PASTELL)], rnd.choice(DACHROT), w*.42, 10)
        x += w + 8; i += 1


def turm_comic(k, cx, fuss, w, h, wand='#d9c7a7', dach='#c0392b', dh=None, uhr_=False, form='spitz'):
    dh = dh if dh is not None else w*1.2
    k.rect(cx - w/2, fuss - h, cx + w/2, fuss, wand, 10)
    if form == 'spitz': k.form([(cx - w/2 - 10, fuss - h), (cx + w/2 + 10, fuss - h), (cx, fuss - h - dh)], dach, 10)
    elif form == 'zwiebel':
        pts = [(cx + w*.62*math.sin(math.pi*(i/20)**.7), fuss - h - dh*i/20) for i in range(21)] + [(cx - w*.62*math.sin(math.pi*(i/20)**.7), fuss - h - dh*i/20) for i in range(20, -1, -1)]
        k.form(pts, dach, 10)
    if uhr_:
        k.kreis(cx, fuss - h + w*.62, w*.28, '#fff7c2', 8); k.strich((cx, fuss - h + w*.62), (cx, fuss - h + w*.42), 6); k.strich((cx, fuss - h + w*.62), (cx + w*.14, fuss - h + w*.62), 6)
    for j in range(2): k.rect(cx - w*.1, fuss - h*.55 - j*h*.3, cx + w*.1, fuss - h*.55 - j*h*.3 + w*.3, '#6b8fa8', 6)


def wasser_comic(k, y0, y1, x0, x1, farbe='#5aaee0'):
    k.rect(x0, y0, x1, y1, farbe, 12)
    for i, y in enumerate(range(int(y0) + 50, int(y1) - 30, 60)):
        for x in range(int(x0) + 80 + (i % 2)*60, int(x1) - 100, 240):
            k.linienzug([(x, y), (x + 40, y - 16), (x + 80, y), (x + 120, y - 16)], 9, '#ffffff')


def c_schaffhausen():
    k = K(3000, 1600); G = 1200
    k.kreis(2700, 200, 110, '#ffd54a', 14)
    k.form([(20, G), (20, 880), (300, 760), (700, 760), (1050, 880), (1200, G)], '#7cc95a', 14)
    for i in range(8):
        k.linienzug([(60 + i*120, G - 20), (260 + i*120, 800 + i*10)], 8, '#4f9a3a')
    # Munot
    k.rect(260, 560, 920, 760, '#c9b79a', 12)
    for x in range(260, 900, 80): k.rect(x, 520, x + 40, 580, '#c9b79a', 8)
    k.rect(500, 450, 680, 560, '#b9a583', 12); k.form([(480, 450), (700, 450), (590, 280)], '#d9531e', 12)
    for x in (330, 430, 730, 830): k.rect(x, 620, x + 36, 710, '#5d4a35', 6)
    reihe_comic(k, 1050, 2900, G, 200, 340, 21)
    # Münster, Fronwagturm, St. Johann
    k.rect(1300, G - 400, 1740, G, '#e6d3b0', 12); k.form([(1280, G - 400), (1760, G - 400), (1520, G - 590)], '#a8452c', 12)
    turm_comic(k, 1790, G, 120, 560, '#d9c7a7', '#7aa07a', 260)
    turm_comic(k, 2200, G, 140, 700, '#ead9b7', '#c0392b', 300, True)
    turm_comic(k, 2640, G, 120, 540, '#d9c7a7', '#7aa07a', 280)
    # Rhein und Brücke
    wasser_comic(k, G + 20, G + 260, 20, 2980)
    k.rect(560, G + 10, 1450, G + 70, '#c9b79a', 10)
    return k


def c_zuerich():
    k = K(3000, 1600); G = 1200
    k.kreis(260, 220, 110, '#ffd54a', 14); k.wolke(2400, 260, 130, rand=14)
    reihe_comic(k, 20, 2980, G, 190, 320, 3)
    for cx in (1160, 1440):
        k.rect(cx - 70, G - 700, cx + 70, G, '#cfc6b4', 12)
        turm_comic(k, cx, G, 140, 700, '#cfc6b4', '#4fa58a', 220, form='zwiebel')
    k.rect(1100, G - 360, 1500, G, '#d9d0bd', 12)
    turm_comic(k, 620, G, 100, 640, '#d9c7a7', '#4fa58a', 380)
    turm_comic(k, 1950, G, 150, 600, '#d9c7a7', '#c0392b', 300, True)
    wasser_comic(k, G + 20, G + 280, 20, 2980, '#4aa0d8')
    return k


def c_bern():
    k = K(3000, 1600); G = 1200
    k.wolke(500, 240, 130, rand=14); k.kreis(2600, 220, 110, '#ffd54a', 14)
    reihe_comic(k, 20, 1500, G, 190, 300, 8)
    # Zytglogge
    turm_comic(k, 900, G, 190, 760, '#e6d3b0', '#c0392b', 300, True)
    # Bundeshaus mit Kuppel
    k.rect(1600, G - 300, 2900, G, '#d9cdb5', 12)
    k.form([(1580, G - 300), (2920, G - 300), (2800, G - 380), (1700, G - 380)], '#7aa07a', 12)
    k.kreis(2250, G - 380, 190, '#7aa07a', 12, clip=k.maske_poly([(2000, 0), (2500, 0), (2500, G - 380), (2000, G - 380)]))
    k.rect(2235, G - 640, 2265, G - 520, '#555555', 6)
    for i in range(10): k.rect(1700 + i*115, G - 240, 1700 + i*115 + 50, G - 90, '#9fd3f2', 6)
    wasser_comic(k, G + 20, G + 280, 20, 2980, '#58b0d8')
    return k


def c_paris():
    k = K(2600, 1700); G = 1500
    k.wolke(400, 300, 130, rand=14); k.kreis(2200, 260, 110, '#ffd54a', 14)
    reihe_comic(k, 20, 2580, G, 180, 280, 15, 150, 210)
    # Eiffelturm
    br = '#8a6a4d'
    k.form([(980, G), (1100, 840), (1160, 840), (1180, G)], br, 12); k.form([(1420, G), (1440, 840), (1500, 840), (1620, G)], br, 12)
    k.rect(1060, 820, 1540, 880, br, 12)
    k.form([(1100, 820), (1500, 820), (1380, 380), (1220, 380)], br, 12)
    k.rect(1200, 340, 1400, 390, br, 12); k.form([(1230, 340), (1370, 340), (1300, 40)], br, 12)
    k.form([(1160, 1140), (1440, 1140), (1480, G), (1120, G)], '#d8ecf8', 0, clip=None) if False else None
    k.linienzug([(1130, 880), (1470, 1120)], 9, '#6e533b'); k.linienzug([(1470, 880), (1130, 1120)], 9, '#6e533b')
    k.linienzug([(1240, 420), (1360, 800)], 9, '#6e533b'); k.linienzug([(1360, 420), (1240, 800)], 9, '#6e533b')
    k.rect(1180, 1120, 1420, 1150, br, 8)
    return k


def c_london():
    k = K(3000, 1700); G = 1450
    k.wolke(2400, 300, 150, '#e6e6e6', 14); k.kreis(300, 260, 110, '#ffd54a', 14)
    reihe_comic(k, 20, 700, G, 160, 260, 4, 140, 200)
    # Big Ben
    turm_comic(k, 1000, G, 190, 900, '#e8cf8c', '#6b8f71', 360, True)
    k.rect(940, G - 1180, 1060, G - 1040, '#e8cf8c', 10) if False else None
    k.rect(880, G - 1080, 1120, G - 900, '#e8cf8c', 10)
    k.form([(860, G - 1080), (1140, G - 1080), (1000, G - 1260)], '#6b8f71', 10)
    k.kreis(1000, G - 980, 70, '#fff7c2', 8); k.strich((1000, G - 980), (1000, G - 1030), 7); k.strich((1000, G - 980), (1030, G - 980), 7)
    k.rect(1100, G - 360, 1700, G, '#e2d6b4', 12)
    # Tower Bridge
    for cx in (1900, 2500):
        k.rect(cx - 90, G - 620, cx + 90, G, '#b9a98a', 12)
        k.form([(cx - 110, G - 620), (cx + 110, G - 620), (cx, G - 800)], '#6b8f71', 12)
    k.rect(1900, G - 350, 2500, G - 300, '#4a90c2', 10)
    k.linienzug([(1900, G - 520), (2200, G - 330), (2500, G - 520)], 10, '#4a90c2')
    k.rect(1700, G - 200, 2700, G - 150, '#b9a98a', 10)
    wasser_comic(k, G + 20, G + 220, 20, 2980)
    return k


def c_newyork():
    k = K(3000, 1700); G = 1450
    k.kreis(2500, 280, 120, '#ffd54a', 14)
    rnd = random.Random(12); x = 20; farben = ['#8fa9c4', '#b8c4d2', '#7d93ab', '#a6a6a6', '#c9b79a']
    while x < 2900:
        w = rnd.randint(130, 230); h = rnd.randint(380, 1000)
        if abs(x - 1500) < 300: x += w; continue
        k.rect(x, G - h, x + w, G, farben[(x // 7) % 5], 12)
        for jj in range(int(h//110)):
            for ii in range(max(1, int(w//70))): k.rect(x + 20 + ii*60, G - h + 40 + jj*110, x + 20 + ii*60 + 28, G - h + 40 + jj*110 + 46, '#ffe78a', 4)
        x += w + 6
    # Freiheitsstatue
    gr = '#5fb89a'
    k.rect(1360, G - 330, 1640, G, '#c9b79a', 12)
    k.form([(1400, G - 330), (1600, G - 330), (1570, G - 600), (1430, G - 600)], '#b8a98a', 12)
    k.form([(1440, G - 600), (1560, G - 600), (1600, G - 960), (1400, G - 960)], gr, 12)
    k.kreis(1500, G - 1040, 80, gr, 12)
    for a in (-60, -35, -10, 15, 40):
        r = math.radians(a - 90); k.form([(1500 + 70*math.cos(r) - 12, G - 1040 + 70*math.sin(r)), (1500 + 160*math.cos(r) - 7, G - 1040 + 160*math.sin(r)), (1500 + 160*math.cos(r) + 7, G - 1040 + 160*math.sin(r)), (1500 + 70*math.cos(r) + 12, G - 1040 + 70*math.sin(r))], gr, 8)
    k.form([(1580, G - 900), (1650, G - 1180), (1690, G - 1170), (1640, G - 880)], gr, 10)
    k.form([(1630, G - 1180), (1710, G - 1180), (1670, G - 1320)], '#ffb300', 8)
    wasser_comic(k, G + 20, G + 220, 20, 2980)
    return k


def c_pisa():
    k = K(2600, 1700); G = 1500
    k.kreis(2200, 260, 110, '#ffd54a', 14); k.wolke(400, 300, 130, rand=14)
    k.form([(20, G), (20, G - 40), (2580, G - 40), (2580, G)], '#7cc95a', 14)
    # Dom
    k.rect(1250, G - 380, 2200, G - 40, '#f1ead8', 12); k.form([(1230, G - 380), (2220, G - 380), (1725, G - 520)], '#c9b79a', 12)
    for i in range(9): k.rect(1290 + i*100, G - 330, 1290 + i*100 + 40, G - 100, '#c9b79a', 6)
    # schiefer Turm: Stockwerke als Parallelogramme
    sh = 14
    k.rect(560, G - 40 - 0, 940, G - 40, '#f1ead8', 0) if False else None
    for i in range(8):
        y1 = G - 40 - i*110; y0 = y1 - 110; dx0 = i*34 + 0; dx1 = (i+1)*34
        k.form([(660 + dx0, y1), (900 + dx0, y1), (900 + dx1, y0), (660 + dx1, y0)], '#f1ead8', 10)
        k.form([(690 + dx0, y1), (710 + dx0, y1), (710 + dx1, y0), (690 + dx1, y0)], '#c9b79a', 0)
    k.form([(690 + 8*34, G - 40 - 880), (870 + 8*34, G - 40 - 880), (850 + 8*34, G - 40 - 980), (710 + 8*34, G - 40 - 980)], '#c0392b', 10)
    return k


def c_venedig():
    k = K(3000, 1700); G = 1250
    k.kreis(2500, 280, 120, '#ffd54a', 14); k.wolke(500, 320, 130, rand=14)
    reihe_comic(k, 20, 1300, G, 220, 340, 31, 170, 250)
    reihe_comic(k, 1800, 2980, G, 200, 320, 33, 170, 250)
    # Campanile
    turm_comic(k, 1500, G, 170, 820, '#d9724a', '#6b8f71', 260)
    k.rect(1380, G - 940, 1620, G - 830, '#e6d3b0', 10) if False else None
    # Markusdom mit Kuppeln
    for cx in (1750, 1900):
        pass
    wasser_comic(k, G + 20, G + 420, 20, 2980, '#4aa0d8')
    # Gondel
    k.form([(1000, G + 200), (1700, G + 200), (1850, G + 130), (1760, G + 250), (1600, G + 300), (1100, G + 300), (950, G + 150)], '#222222', 12)
    k.rect(1250, G + 100, 1350, G + 200, '#c0392b', 8)
    k.strich((1180, G + 20), (1000, G + 300), 12, '#7b4a24')
    return k


NEU = {
    'stadt-c-schaffhausen': c_schaffhausen, 'stadt-c-zuerich': c_zuerich, 'stadt-c-bern': c_bern, 'stadt-c-paris': c_paris, 'stadt-c-london': c_london, 'stadt-c-newyork': c_newyork, 'stadt-c-pisa': c_pisa, 'stadt-c-venedig': c_venedig,
    'stadt-schaffhausen': r_schaffhausen, 'stadt-rheinfall': r_rheinfall, 'stadt-goldengate': r_goldengate, 'stadt-istanbul': r_istanbul, 'stadt-prag': r_prag, 'stadt-barcelona': r_sagrada,
    'berg-fuji-bild': c_fuji, 'berg-schneekappe': c_schnee, 'berg-gruen': c_alm, 'berg-violett': c_sonnenuntergang,
    'berg-sil-2': c_vulkan, 'berg-sil-3': c_gipfel,
    'berg-spitze': r_matterhorn, 'berg-r-jungfrau': r_jungfrau, 'berg-r-kamm': r_kamm, 'berg-c-matterhorn': c_matterhorn, 'berg-c-huette': c_huette, 'berg-c-see': c_see, 'berg-c-zelt': c_zelt, 'berg-c-ski': c_ski, 'berg-umriss': r_eiger, 'berg-freihand': r_panorama, 'berg-formen': r_bergsee, 'berg-sil-1': r_tannengrat,
}
ALLE = dict(NEU)

if __name__ == '__main__':
    ids = sys.argv[1:] or list(ALLE)
    for i in ids:
        ALLE[i]().save(i); print('ok', i)
