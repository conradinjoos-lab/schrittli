"""Eigene Silhouetten für die Welten «Berge» und «Städte» (Schrittli): Polygone, schwarz auf durchsichtig.

Die Motive sind eigene Zeichnungen (frei, keine Fremdrechte). Aufruf: python -I silhouetten.py [<id> …]
schreibt bilder/<id>.png nach werkzeug/vorlagen/bilder/. Danach: python -I bild.py <id> …"""
import os, sys, math, random
from PIL import Image, ImageDraw, ImageFilter, ImageChops, ImageOps

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


def _dil(m, r):
    """Dilatation, nur im Umfeld der Form gerechnet (schneller als über die ganze Fläche)."""
    bb = m.getbbox()
    if not bb: return m.copy()
    p = int(r*SS*2 + 4); x0, y0, x1, y1 = max(0, bb[0]-p), max(0, bb[1]-p), min(m.width, bb[2]+p), min(m.height, bb[3]+p)
    t = m.crop((x0, y0, x1, y1)).filter(ImageFilter.GaussianBlur(r*SS/2)).point(lambda v: 255 if v > 6 else 0)
    out = Image.new('L', m.size, 0); out.paste(t, (x0, y0)); return out

def _ero(m, r):
    return ImageOps.invert(_dil(ImageOps.invert(m), r))

def ebene(c): return C(c.w, c.h)

def auflegen(c, e, spalt=18):
    """Legt Ebene e vor c; ein heller Spalt trennt die beiden."""
    c.m = ImageChops.lighter(ImageChops.subtract(c.m, _dil(e.m, spalt) if spalt else Image.new('L', c.m.size, 0)), e.m)
    c.d = ImageDraw.Draw(c.m)

def umriss(c, dicke=28):
    c.m = ImageChops.subtract(c.m, _ero(c.m, dicke)); c.d = ImageDraw.Draw(c.m)

def kappe(c, g, ykappe, seed=2, zack=70, rand=24, x0=0, x1=None):
    """Schneekappe: heller Bereich oberhalb einer Zackenlinie, ein schwarzer Rand bleibt."""
    x1 = x1 or c.w
    lin = [(x0, ykappe)]; rnd = random.Random(seed); x = x0
    while x < x1:
        x += rnd.randint(70, 140); lin.append((x, ykappe + (zack if len(lin) % 2 else -zack*.3) + rnd.randint(-15, 15)))
    e = ebene(c); e.add([(x0, 0)] + lin + [(lin[-1][0], 0)])
    c.m = ImageChops.subtract(c.m, _ero(ImageChops.darker(e.m, g.m), rand)); c.d = ImageDraw.Draw(c.m)

def linie(c, p0, p1, w, v=255):
    (x0, y0), (x1, y1) = p0, p1; d = math.hypot(x1-x0, y1-y0); nx, ny = -(y1-y0)/d*w/2, (x1-x0)/d*w/2
    c.add([(x0+nx, y0+ny), (x1+nx, y1+ny), (x1-nx, y1-ny), (x0-nx, y0-ny)], v)

def wolke(c, cx, cy, s):
    for dx, dy, r in [(-1.3, .25, .55), (-.55, -.15, .8), (.35, -.35, 1.0), (1.2, -.05, .75), (1.8, .25, .5)]:
        c.circ(cx+dx*s, cy+dy*s, r*s)
    c.rect(cx-1.3*s, cy+.2*s, cx+1.8*s, cy+.75*s)

def vogel(c, cx, cy, s):
    for sg in (-1, 1):
        c.add([(cx, cy), (cx+sg*s*.55, cy-s*.55), (cx+sg*s*1.1, cy-s*.1), (cx+sg*s*.6, cy-s*.2)])

def huegel(c, y0, amp, per, ph, G):
    pts = [(x, y0 - amp*math.sin((x/per)*2*math.pi + ph)) for x in range(0, c.w+1, 10)]
    c.add(pts + [(c.w, G), (0, G)])


# ------------------------------------------------------------------ feinere Bausteine
def glatt(pts, n=8):
    """Weiche Kurve durch die Punkte (Catmull-Rom)."""
    P = [pts[0]] + list(pts) + [pts[-1]]; out = []
    for i in range(1, len(P)-2):
        (ax, ay), (bx, by), (cx, cy), (dx, dy) = P[i-1], P[i], P[i+1], P[i+2]
        for k in range(n):
            t = k/n; t2 = t*t; t3 = t2*t
            out.append((.5*(2*bx + (-ax+cx)*t + (2*ax-5*bx+4*cx-dx)*t2 + (-ax+3*bx-3*cx+dx)*t3),
                        .5*(2*by + (-ay+cy)*t + (2*ay-5*by+4*cy-dy)*t2 + (-ay+3*by-3*cy+dy)*t3)))
    out.append(pts[-1]); return out

def fels(pts, rau=.12, seed=1, n=1, tiefe=5):
    """Natürlicher Grat durch viele Stützpunkte, darauf feine Felszacken (n>1 glättet die Grundform)."""
    return grat(glatt(pts, n) if n > 1 else pts, rau=rau, seed=seed, tiefe=tiefe)

def hoehe(g, x):
    """y des Grats g an der Stelle x."""
    for (x0, y0), (x1, y1) in zip(g, g[1:]):
        if x0 <= x <= x1: return y0 + (y1-y0)*(x-x0)/max(1e-6, x1-x0)
    return g[-1][1]

def bergzug(c, pts, G, rau=.12, seed=1, n=1, tiefe=5):
    g = fels(pts, rau, seed, n, tiefe); c.add(g + [(g[-1][0], G), (g[0][0], G)]); return g

def strich(c, pts, w0, w1=None, v=0):
    """Linienzug, der von Breite w0 auf w1 ausläuft (Rinnen, Äste, Wasserstrahl)."""
    w1 = w0 if w1 is None else w1; n = len(pts) - 1
    for i, (p, q) in enumerate(zip(pts, pts[1:])):
        w = w0 + (w1-w0)*i/max(1, n)
        linie(c, p, q, w, v); c.circ(q[0], q[1], (w0 + (w1-w0)*(i+1)/max(1, n))/2, v)

def uhr2(c, cx, cy, r):
    """Zifferblatt mit Zeigern."""
    c.circ(cx, cy, r, 0); c.circ(cx, cy, r*.12)
    linie(c, (cx, cy), (cx, cy - r*.72), r*.13); linie(c, (cx, cy), (cx + r*.5, cy + r*.12), r*.15)

def stern(c, cx, cy, r):
    c.add([(cx, cy-r), (cx+r*.22, cy-r*.22), (cx+r, cy), (cx+r*.22, cy+r*.22), (cx, cy+r), (cx-r*.22, cy+r*.22), (cx-r, cy), (cx-r*.22, cy-r*.22)])

def wellen(c, y, x0, x1, amp=9, per=120, w=8, v=0):
    pts = [(x, y + amp*math.sin((x-x0)/per*2*math.pi)) for x in range(int(x0), int(x1)+1, 14)]
    for p, q in zip(pts, pts[1:]): linie(c, p, q, w, v)

def wasser(c, y0, y1, x0=0, x1=None, reihen=3, seed=1):
    """Wasserfläche mit hellen Wellenlinien."""
    x1 = x1 or c.w; c.rect(x0, y0, x1, y1); rnd = random.Random(seed)
    for i in range(reihen):
        y = y0 + (i+1)*(y1-y0)/(reihen+1)
        for k in range(int((x1-x0)/260)+1):
            a = x0 + k*260 + rnd.randint(-40, 60); wellen(c, y, a, min(x1, a + rnd.randint(110, 190)), 7, 90, 7)

def kirchturm(c, cx, G, w, h, helm='spitz', hh=None, uhr_=True, schall=2, knauf=True):
    """Kirchturm in echten Proportionen: Schaft, Gesims, Schallöcher, Uhr, Helm, Knauf."""
    c.rect(cx-w/2, G-h, cx+w/2, G)
    c.rect(cx-w*.58, G-h-w*.05, cx+w*.58, G-h+w*.07)
    top = G-h-w*.05; hh = hh or w*2.4
    for i in range(schall):
        bogen(c, cx + (i-(schall-1)/2)*w*.36, G-h+w*.62, w*.1, w*.42)
    if uhr_: uhr2(c, cx, G-h+w*1.05, w*.27)
    if helm == 'spitz': c.add([(cx-w*.56, top), (cx+w*.56, top), (cx+w*.08, top-hh*.85), (cx, top-hh), (cx-w*.08, top-hh*.85)])
    elif helm == 'pyramide': nadel(c, cx, top, w*1.16, top-hh*.55); top -= hh*.55 - hh
    elif helm == 'zwiebel':
        c.rect(cx-w*.32, top-w*.35, cx+w*.32, top); zwiebel(c, cx, top-w*.35, w*.46, w*.95)
        c.rect(cx-w*.12, top-w*1.45, cx+w*.12, top-w*1.25); zwiebel(c, cx, top-w*1.45, w*.18, w*.45); top = top-w*1.9+hh
    elif helm == 'kuppel': kuppel(c, cx, top, w*.5, w*.55, False); top = top-w*.55+hh
    elif helm == 'kaesbissen':
        c.add([(cx-w/2, top), (cx+w/2, top), (cx+w/2, top-w*.25), (cx, top-hh*.45), (cx-w/2, top-w*.25)]); top = top-hh*.45+hh
    if knauf:
        s = top-hh; c.rect(cx-w*.025-2, s-w*.45, cx+w*.025+2, s+4); c.circ(cx, s-w*.12, w*.07)
        c.rect(cx-w*.12, s-w*.36, cx+w*.12, s-w*.31)

def helm_gotisch(c, cx, fuss, w, h, krabben=8, loecher=True, fialen=True):
    """Gotischer Turmhelm mit Krabben an den Kanten, Masswerk-Löchern, Fialen und Kreuzblume."""
    c.add([(cx-w/2, fuss), (cx+w/2, fuss), (cx, fuss-h)])
    for i in range(1, krabben+1):
        t = i/(krabben+1); y = fuss - h*t; hw = w/2*(1-t)
        for sg in (-1, 1):
            c.add([(cx+sg*(hw-2), y+h*.01), (cx+sg*(hw+w*.07), y-h*.012), (cx+sg*(hw-w*.03), y-h*.05)])
    if loecher:
        for i in range(1, krabben-1, 2):
            t = (i+.6)/(krabben+1); y = fuss - h*t; hw = w/2*(1-t)*.42; d = h/(krabben+1)*.38
            c.cut([(cx, y-d), (cx+hw, y), (cx, y+d), (cx-hw, y)])
    s = fuss-h; c.rect(cx-w*.03-2, s-w*.3, cx+w*.03+2, s+6)
    c.add([(cx-w*.13, s-w*.17), (cx, s-w*.27), (cx+w*.13, s-w*.17), (cx, s-w*.07)])
    if fialen:
        for sg in (-1, 1):
            fx = cx + sg*w*.5; c.rect(fx-w*.05, fuss-h*.05, fx+w*.05, fuss+2); nadel(c, fx, fuss-h*.05, w*.12, fuss-h*.2)

def masswerk(c, x0, y0, x1, y1, n, spitz=True):
    """Reihe hoher gotischer Fenster."""
    bw = (x1-x0)/n
    for i in range(n):
        cx = x0 + (i+.5)*bw; r = bw*.22
        if spitz: c.cut([(cx-r, y1), (cx-r, y0+r*1.6), (cx, y0), (cx+r, y0+r*1.6), (cx+r, y1)])
        else: bogen(c, cx, y1, r, y1-y0)

def altstadt(c, x0, x1, G, seed, hmin=170, hmax=300, wmin=110, wmax=190, steil=.7, fenster_=True, kamine=True):
    """Altstadthäuser mit steilen Giebeln, Traufdächern, Lukarnen, Kaminen und kleinen Fenstern."""
    rnd = random.Random(seed); x = x0
    while x < x1:
        w = min(rnd.randint(wmin, wmax), x1-x+40); h = rnd.randint(hmin, hmax); art = rnd.choice(['giebel', 'giebel', 'traufe', 'walm', 'traufe'])
        c.rect(x, G-h, x+w, G); u = 10
        if art == 'giebel':
            dh = w*steil; c.add([(x-u, G-h), (x+w+u, G-h), (x+w/2, G-h-dh)])
            if fenster_ and dh > 90: c.rect(x+w/2-10, G-h-dh*.42, x+w/2+10, G-h-dh*.42+28, 0)
        elif art == 'traufe':
            dh = w*.42; c.add([(x-u, G-h), (x+w+u, G-h), (x+w-w*.06, G-h-dh), (x+w*.06, G-h-dh)])
            if w > 140: lx = x+w*.5; c.rect(lx-22, G-h-dh*.75, lx+22, G-h-dh*.2); c.add([(lx-30, G-h-dh*.75), (lx+30, G-h-dh*.75), (lx, G-h-dh*.98)])
        else:
            dh = w*.5; c.add([(x-u, G-h), (x+w+u, G-h), (x+w*.72, G-h-dh), (x+w*.28, G-h-dh)])
        if kamine and rnd.random() < .45:
            kx = x + w*rnd.choice([.25, .7]); c.rect(kx-11, G-h-dh*.85-34, kx+11, G-h-dh*.4); c.rect(kx-15, G-h-dh*.85-40, kx+15, G-h-dh*.85-30)
        if fenster_:
            nx = max(1, int(w/58)); ny = max(1, int((h-60)/78))
            for i in range(nx):
                for j in range(ny):
                    fx = x + (i+.5)*w/nx; fy = G-h+42 + j*78
                    c.rect(fx-11, fy, fx+11, fy+32, 0)
        x += w + rnd.choice([0, 0, 0, 8])

def laubbaum(c, cx, G, h, r, seed=1):
    rnd = random.Random(seed)
    c.add([(cx-r*.1, G), (cx+r*.1, G), (cx+r*.06, G-h+r), (cx-r*.06, G-h+r)])
    for k in range(9):
        a = rnd.uniform(0, 2*math.pi); d = rnd.uniform(.25, .55)*r
        c.circ(cx + math.cos(a)*d, G-h+r*.2 + math.sin(a)*d*.8, r*rnd.uniform(.42, .6))

def pinie(c, cx, G, h, r):
    """Schirmpinie (Rom): schlanker Stamm, flache breite Krone."""
    c.add([(cx-r*.06, G), (cx+r*.06, G), (cx+r*.1, G-h+r*.25), (cx+r*.02, G-h+r*.25)])
    for dx, dy, s in [(-.7, .12, .32), (-.35, -.05, .42), (.1, -.1, .46), (.55, -.02, .4), (.85, .12, .28)]:
        c.add([(cx + dx*r + s*r*math.cos(math.pi*t/20), G-h+r*.18 + dy*r - s*r*.55*math.sin(math.pi*t/20)) for t in range(21)])
    c.rect(cx-r*.95, G-h+r*.1, cx+r*.95, G-h+r*.24)

def zypresse(c, cx, G, h, w):
    c.add(glatt([(cx-w*.12, G), (cx-w/2, G-h*.35), (cx-w*.3, G-h*.8), (cx, G-h), (cx+w*.3, G-h*.8), (cx+w/2, G-h*.35), (cx+w*.12, G)], 6))

def palme(c, x, G, h, neig=.25, seed=1, blatt=None):
    """Palme mit gebogenem Stamm und gefiederten Wedeln."""
    rnd = random.Random(seed); blatt = blatt or h*.45
    st = [(x + neig*h*(t/10)**1.6, G - h*t/10) for t in range(11)]
    strich(c, st, h*.06, h*.035, 255); kx, ky = st[-1]
    for k in range(7):
        a = math.pi*(-.05 + k*.18) + rnd.uniform(-.08, .08)
        pts = []
        for i in range(13):
            t = i/12; d = blatt*t
            pts.append((kx - math.cos(a)*d, ky - math.sin(a)*d*.55 + blatt*.55*t*t))
        strich(c, pts, h*.035, h*.008, 255)
        for i in range(2, 12):
            px, py = pts[i]; l = blatt*.16*(1 - i/13)
            for sg in (-1, 1): linie(c, (px, py), (px + sg*l*.3, py + l), 8)
    c.circ(kx, ky, h*.04)

def mensch(c, x, G, h, rucksack=False, stock=False, sg=1):
    """Wanderer im Profil."""
    c.circ(x + sg*h*.03, G-h*.92, h*.08)
    c.add([(x-h*.09, G-h*.82), (x+h*.09, G-h*.82), (x+h*.07, G-h*.45), (x-h*.07, G-h*.45)])
    linie(c, (x-h*.03, G-h*.47), (x - sg*h*.14, G), h*.08); linie(c, (x+h*.03, G-h*.47), (x + sg*h*.16, G), h*.08)
    linie(c, (x, G-h*.78), (x + sg*h*.2, G-h*.55), h*.06)
    if rucksack: c.add([(x - sg*h*.09, G-h*.82), (x - sg*h*.24, G-h*.78), (x - sg*h*.24, G-h*.52), (x - sg*h*.08, G-h*.55)])
    if stock: linie(c, (x + sg*h*.2, G-h*.6), (x + sg*h*.32, G), h*.025)

def schicht(c, pts, G, rau=.1, seed=1, spalt=16, n=3, tiefe=3, baeume=()):
    """Vordere Kette auf eigener Ebene (weich), mit hellem Spalt vor die hinteren gelegt; baeume = [(x, h)] stehen darauf."""
    e = ebene(c); g = bergzug(e, pts, G, rau, seed, n, tiefe)
    for x, h in baeume: tanne(e, x, hoehe(g, x) + h*.12, h, h*.62)
    auflegen(c, e, spalt); return g


# ------------------------------------------------------------------ Berge
def b_matterhorn():
    """Matterhorn von Zermatt: Hörnligrat links, leicht überhängender Gipfelhaken, Schulter rechts."""
    c = C(2600, 1500); G = 1440
    bergzug(c, [(0, 1110), (380, 1010), (680, 880), (860, 750), (970, 630), (1050, 510), (1110, 400), (1160, 300), (1200, 215), (1236, 155),
                (1262, 122), (1288, 98), (1312, 104), (1328, 128), (1338, 178), (1392, 262), (1440, 340), (1495, 410), (1550, 470), (1600, 505),
                (1640, 512), (1680, 548), (1760, 620), (1880, 700), (2050, 790), (2300, 900), (2600, 1000)],
            G, rau=.22, seed=4)
    schicht(c, [(0, 1300), (300, 1240), (640, 1270), (980, 1210), (1300, 1250), (1700, 1190), (2100, 1240), (2600, 1200)], G, .06, 9,
            baeume=[(x, 170 + (x*37 % 60)) for x in (90, 180, 260, 2250, 2340, 2440)])
    return c


def b_trio():
    """Eiger, Mönch und Jungfrau von der Kleinen Scheidegg, mit der Sphinx auf dem Jungfraujoch."""
    c = C(3000, 1500); G = 1440
    g = bergzug(c, [(0, 1020), (220, 900), (400, 760), (540, 600), (630, 460), (690, 360), (720, 320), (760, 360), (860, 450), (960, 500),
                    (1060, 560), (1150, 600), (1240, 520), (1330, 400), (1400, 320), (1460, 290), (1530, 300), (1610, 370), (1700, 450),
                    (1780, 500), (1860, 460), (1960, 370), (2050, 290), (2110, 245), (2160, 250), (2220, 300), (2300, 370), (2370, 350),
                    (2450, 400), (2600, 560), (2800, 760), (3000, 900)], G, rau=.2, seed=11)
    # Sphinx-Observatorium auf dem Joch
    c.rect(1755, 455, 1815, 505); kuppel(c, 1785, 455, 32, 34, False); c.rect(1782, 395, 1788, 425)
    # Eiger-Nordwand: Bänder und Schneefelder
    schicht(c, [(0, 1180), (400, 1120), (800, 1180), (1200, 1150), (1600, 1230), (2100, 1170), (2600, 1220), (3000, 1160)], G, .05, 3,
            baeume=[(x, 190 + (x*29 % 60)) for x in (120, 220, 310, 2620, 2720, 2830)])
    return c


def b_sonne():
    """Sonne mit Strahlen hinter zwei Bergketten."""
    c = C(2600, 1500); G = 1440; sx, sy, r = 1500, 560, 240
    c.circ(sx, sy, r)
    for k in range(18):
        a = 2*math.pi*k/18 + .09
        c.add([(sx + math.cos(a-.045)*(r+45), sy + math.sin(a-.045)*(r+45)), (sx + math.cos(a)*(r+190 + (k % 2)*70), sy + math.sin(a)*(r+190 + (k % 2)*70)),
               (sx + math.cos(a+.045)*(r+45), sy + math.sin(a+.045)*(r+45))])
    schicht(c, [(0, 1080), (300, 900), (520, 760), (700, 650), (860, 760), (1040, 880), (1250, 760), (1420, 690), (1700, 780), (1900, 700),
                (2100, 620), (2350, 800), (2600, 960)], G, .08, 5, 22)
    schicht(c, [(0, 1250), (350, 1120), (700, 1200), (1000, 1110), (1400, 1230), (1800, 1140), (2200, 1210), (2600, 1130)], G, .06, 7, 18)
    for x, y in [(520, 380), (620, 330), (720, 400)]: vogel(c, x, y, 40)
    return c


def b_gipfelkreuz():
    """Felsgipfel mit Holzkreuz, Steinmann und Wanderer auf dem Grat."""
    c = C(2400, 1500); G = 1440
    bergzug(c, [(0, 1200), (300, 1080), (560, 920), (760, 760), (900, 640), (1000, 560), (1080, 500), (1140, 470), (1200, 462), (1260, 480),
                (1340, 540), (1450, 620), (1600, 760), (1800, 900), (2050, 1040), (2400, 1180)], G, rau=.1, seed=3)
    # Kreuz mit Dächlein
    cx, fy = 1180, 470
    c.rect(cx-14, fy-330, cx+14, fy+10); c.rect(cx-100, fy-260, cx+100, fy-232); c.add([(cx-34, fy-330), (cx+34, fy-330), (cx, fy-365)])
    c.add([(cx-46, fy), (cx+46, fy), (cx+30, fy-40), (cx-30, fy-40)])
    # Steinmann
    for i, (w, h) in enumerate([(70, 30), (56, 26), (40, 22), (26, 18)]):
        y = 512 - sum(hh for _, hh in [(70, 30), (56, 26), (40, 22), (26, 18)][:i]); c.add(glatt([(1330-w/2, y), (1330-w/2, y-h*.6), (1330, y-h), (1330+w/2, y-h*.6), (1330+w/2, y)], 4))
    mensch(c, 900, 652, 150, True, True, 1)
    for x, y in [(1700, 330), (1790, 290)]: vogel(c, x, y, 38)
    return c


def b_doppel():
    """Grosser und Kleiner Mythen: zwei steile Felstürme über Wiesen."""
    c = C(2600, 1500); G = 1440
    bergzug(c, [(0, 1150), (260, 1060), (420, 940), (520, 760), (580, 600), (630, 520), (670, 470), (700, 500), (730, 450), (770, 480),
                (820, 600), (880, 760), (940, 860), (1020, 900), (1120, 760), (1200, 560), (1260, 420), (1320, 330), (1380, 268),
                (1412, 258), (1452, 292), (1530, 360), (1590, 470), (1650, 640), (1720, 820), (1850, 960), (2100, 1060), (2600, 1160)], G, rau=.2, seed=21)
    schicht(c, [(0, 1280), (400, 1200), (900, 1250), (1400, 1180), (1900, 1240), (2600, 1190)], G, .04, 2,
            baeume=[(300, 220), (380, 260), (2000, 260), (2080, 210), (2160, 180)])
    return c


def b_vulkan():
    """Vulkan mit hohlen Flanken, Krater, Rauchwolke, Lavarinnen und Palmen."""
    c = C(2400, 1700); G = 1640; cx = 1200
    l = [(cx - 160 - 1000*(t/40)**1.7, 720 + 920*(t/40)) for t in range(41)]
    r = [(2*cx - x + 30, y) for x, y in l]
    krater = [(cx-160, 720), (cx-110, 700), (cx-60, 730), (cx, 712), (cx+60, 740), (cx+120, 705), (cx+190, 722)]
    c.add(l[::-1] + krater + r)
    # Rauch: wachsende, nach rechts treibende Wolke
    for i in range(9):
        t = i/8; px = cx + 20 + 380*t**1.4; py = 650 - 520*t; rr = 60 + 120*t
        for dx, dy, s in [(-.5, .1, .7), (0, -.2, .9), (.55, .05, .75)]:
            c.circ(px + dx*rr, py + dy*rr, s*rr)
    # Lavarinnen (hell) auf der Flanke
    for pts in [[(cx-60, 740), (cx-120, 900), (cx-90, 1060), (cx-160, 1240), (cx-140, 1420)], [(cx+60, 750), (cx+130, 920), (cx+110, 1100), (cx+190, 1300)],
                [(cx-130, 760), (cx-260, 960), (cx-330, 1150)]]:
        strich(c, pts, 20, 6)
    wasser(c, G-40, G, 0, 2400, 1)
    palme(c, 260, G-40, 520, .3, 1); palme(c, 420, G-40, 380, -.2, 2); palme(c, 2120, G-40, 480, -.3, 3)
    return c


def b_kette():
    """Weite Alpenkette in drei Ebenen hintereinander."""
    c = C(3200, 1300); G = 1260
    bergzug(c, [(0, 760), (200, 600), (360, 470), (480, 520), (640, 380), (760, 430), (900, 330), (1020, 400), (1180, 520), (1360, 360),
                (1480, 300), (1600, 380), (1760, 480), (1900, 360), (2050, 290), (2200, 420), (2400, 520), (2560, 400), (2700, 330),
                (2850, 440), (3000, 520), (3200, 600)], G, rau=.22, seed=17)
    schicht(c, [(0, 940), (240, 820), (480, 700), (700, 820), (980, 740), (1250, 860), (1500, 720), (1780, 820), (2050, 700), (2350, 840),
                (2650, 760), (2950, 860), (3200, 800)], G, .1, 23, 18)
    schicht(c, [(0, 1120), (400, 1040), (800, 1100), (1200, 1020), (1700, 1100), (2200, 1030), (2700, 1100), (3200, 1050)], G, .05, 29, 16)
    return c


def b_hochgebirge():
    """Zackiges Hochgebirge mit Felsnadeln und einem Gletscher mit Spalten."""
    c = C(2800, 1500); G = 1440
    bergzug(c, [(0, 1000), (180, 820), (320, 640), (400, 520), (440, 420), (480, 500), (560, 380), (620, 260), (670, 330), (740, 450),
                (820, 380), (900, 220), (950, 150), (1000, 230), (1080, 380), (1180, 480), (1260, 360), (1330, 260), (1390, 300),
                (1460, 420), (1560, 520), (1660, 400), (1740, 300), (1800, 340), (1880, 460), (2000, 560), (2120, 480), (2240, 380),
                (2320, 440), (2450, 600), (2620, 760), (2800, 860)], G, rau=.3, seed=33)
    schicht(c, [(0, 1200), (300, 1120), (600, 1150), (900, 1080), (1300, 1160), (1700, 1100), (2100, 1170), (2500, 1110), (2800, 1160)], G, .07, 5, 18)
    return c


def b_huette():
    """SAC-Hütte aus Stein mit Schweizer Fahne, Zickzackweg und Gipfeln dahinter."""
    c = C(2600, 1500); G = 1440
    bergzug(c, [(0, 900), (240, 720), (420, 560), (560, 420), (640, 360), (720, 420), (860, 520), (1000, 460), (1140, 320), (1220, 260),
                (1300, 310), (1440, 440), (1600, 560), (1800, 500), (1950, 420), (2100, 520), (2350, 700), (2600, 820)], G, rau=.1, seed=9)
    e = ebene(c)
    bergzug(e, [(0, 1260), (400, 1180), (900, 1060), (1300, 980), (1700, 1000), (2100, 1080), (2600, 1160)], G, .04, 2)
    # Hütte
    hx, hy = 1350, 990
    e.rect(hx, hy-170, hx+380, hy+20); e.add([(hx-30, hy-170), (hx+410, hy-170), (hx+380, hy-250), (hx, hy-250)])
    e.rect(hx+300, hy-310, hx+340, hy-200)
    for i in range(4): e.rect(hx+35 + i*85, hy-130, hx+75 + i*85, hy-80, 0)
    e.rect(hx+150, hy-60, hx+200, hy+20, 0)
    e.rect(hx-90, hy-380, hx-80, hy+20); e.rect(hx-80, hy-380, hx+40, hy-290)
    e.rect(hx-27, hy-365, hx-13, hy-305, 0); e.rect(hx-50, hy-342, hx+10, hy-328, 0)
    auflegen(c, e, 18)
    # Weg im Zickzack
    for p, q in [((700, 1440), (1050, 1310)), ((1050, 1310), (820, 1210)), ((820, 1210), (1150, 1110)), ((1150, 1110), (1340, 1010))]:
        n = int(math.hypot(q[0]-p[0], q[1]-p[1]) // 50)
        for i in range(0, n, 2):
            a = (p[0] + (q[0]-p[0])*i/n, p[1] + (q[1]-p[1])*i/n); b = (p[0] + (q[0]-p[0])*(i+1)/n, p[1] + (q[1]-p[1])*(i+1)/n)
            linie(c, a, b, 12, 0)
    mensch(c, 960, 1318, 120, True, True, -1)
    return c


def b_mond():
    """Nacht in den Bergen: Mondsichel, Sterne, Tannen und ein Haus mit hellem Fenster."""
    c = C(2600, 1500); G = 1440
    mondsichel(c, 1950, 330, 180)
    for x, y, r in [(400, 200, 34), (700, 330, 22), (1000, 160, 28), (1300, 280, 20), (1550, 140, 30), (2300, 520, 24), (250, 450, 20), (2450, 200, 22)]:
        stern(c, x, y, r)
    bergzug(c, [(0, 1000), (280, 820), (520, 620), (640, 540), (760, 600), (920, 720), (1100, 560), (1260, 440), (1400, 520), (1600, 680),
                (1800, 760), (2000, 640), (2200, 720), (2400, 860), (2600, 960)], G, rau=.1, seed=12)
    e = ebene(c)
    bergzug(e, [(0, 1260), (500, 1180), (1000, 1230), (1500, 1160), (2000, 1240), (2600, 1180)], G, .04, 4)
    for x in range(40, 2600, 85):
        if not 1450 < x < 1820: tanne(e, x, 1280 + (x*13 % 60), 180 + (x*41 % 120), 120)
    e.rect(1520, 1080, 1760, 1260); e.add([(1495, 1080), (1785, 1080), (1640, 970)]); e.rect(1700, 990, 1730, 1050)
    e.rect(1560, 1130, 1620, 1190, 0); e.rect(1660, 1130, 1720, 1190, 0)
    auflegen(c, e, 18)
    return c


def b_fuji():
    """Fuji mit hohlen Flanken, Schneekappe mit Fingern, Pagode im Vordergrund."""
    c = C(2800, 1500); G = 1440; cx, top, tw = 1500, 330, 150
    l = [(cx - tw - 1300*(t/50), top + 900*(t/50)**.65) for t in range(51)]
    r = [(2*cx - x, y) for x, y in l]
    berg_ = l[::-1] + [(cx-tw, top), (cx-90, top-12), (cx-20, top+4), (cx+40, top-10), (cx+tw, top)] + r
    c.add(berg_ + [(r[-1][0], G), (l[-1][0], G)])
    # Schnee: heller Bereich oben mit Fingern nach unten, schwarzer Rand bleibt
    e = ebene(c); e.add(berg_); rnd = random.Random(5); lin = []; x = cx - 720
    while x < cx + 720:
        lin.append((x, top + 300 + rnd.randint(-20, 20))); x += rnd.randint(50, 80)
        lin.append((x, top + 300 + rnd.randint(90, 220) * (1 - abs(x-cx)/900))); x += rnd.randint(30, 50)
    sch = ebene(c); sch.add([(cx-760, 0)] + lin + [(cx+760, 0)])
    c.m = ImageChops.subtract(c.m, _ero(ImageChops.darker(e.m, sch.m), 16)); c.d = ImageDraw.Draw(c.m)
    # Pagode (fünf Dächer) und Bäume im Vordergrund
    f = ebene(c); bergzug(f, [(0, 1300), (500, 1250), (1000, 1320), (1600, 1280), (2200, 1330), (2800, 1290)], G, .03, 6)
    px, pf = 520, 1260
    for i in range(5):
        y = pf - 60 - i*120; bw = 220 - i*24
        f.rect(px - bw*.42, y - 70, px + bw*.42, y + 50)
        f.add(glatt([(px - bw - 30, y - 50), (px - bw*.8, y - 72), (px - bw*.4, y - 92), (px, y - 104), (px + bw*.4, y - 92), (px + bw*.8, y - 72), (px + bw + 30, y - 50)], 5)
              + [(px + bw*.6, y - 112), (px - bw*.6, y - 112)])
    f.rect(px-6, pf - 820, px+6, pf - 640)
    for k in range(6): f.circ(px, pf - 680 - k*24, 14 - k)
    for x, h in [(150, 300), (900, 260), (2300, 340), (2500, 280)]: laubbaum(f, x, 1310, h, 130, x)
    auflegen(c, f, 18)
    return c


def b_dreieck():
    """Drei Bergdreiecke mit Schneekappen und Sonne (einfaches Motiv für die Jüngsten)."""
    c = C(2400, 1300); G = 1240
    c.circ(1900, 260, 150)
    for cx, w, h in [(1180, 1400, 1000), (560, 900, 600), (1780, 1000, 680)]:
        e = ebene(c); top = G - h
        e.add([(cx - w/2, G), (cx + w/2, G), (cx, top)])
        k = ebene(c); yk = top + h*.3; xs = [cx - w/2*(yk-top)/h + i*(w*(yk-top)/h)/6 for i in range(7)]
        k.add([(cx - w, 0)] + [(x, yk + (40 if i % 2 else -10)) for i, x in enumerate(xs)] + [(cx + w, 0)])
        e.m = ImageChops.subtract(e.m, _ero(ImageChops.darker(e.m, k.m), 14))
        auflegen(c, e, 16)
    return c


BERGE = {
    'berg-matterhorn-sil': b_matterhorn, 'berg-trio': b_trio, 'berg-sonne': b_sonne, 'berg-gipfelkreuz': b_gipfelkreuz,
    'berg-doppel': b_doppel, 'berg-vulkan': b_vulkan, 'berg-kette': b_kette, 'berg-hochgebirge': b_hochgebirge,
    'berg-huette': b_huette, 'berg-mond': b_mond, 'berg-fuji': b_fuji, 'berg-dreiecke': b_dreieck,
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
def schiff(c, x0, x1, G, h, dh, n=0, spitz=True):
    """Kirchenschiff von der Seite: Mauer, steiles Dach, hohe Fenster."""
    c.rect(x0, G-h, x1, G)
    c.add([(x0-14, G-h), (x1+14, G-h), (x1-(x1-x0)*.03, G-h-dh), (x0+(x1-x0)*.03, G-h-dh)])
    if n: masswerk(c, x0+16, G-h*.86, x1-16, G-h*.16, n, spitz)

def ufer(c, G, x0=0, x1=None, tief=190, seed=1):
    """Quaimauer und Fluss mit Wellen."""
    x1 = x1 or c.w; c.rect(x0, G-2, x1, G+26); wasser(c, G+46, G+tief, x0, x1, 2, seed)

def bruecke(c, x0, x1, G, n, tief=190, gelaender=True):
    """Steinbrücke mit n Bögen über dem Fluss."""
    c.rect(x0, G-26, x1, G+tief); bw = (x1-x0)/n; r = min(bw*.38, tief-60)
    for i in range(n): bogen(c, x0+(i+.5)*bw, G+tief, r, tief-34)
    if gelaender:
        c.rect(x0, G-52, x1, G-44)
        for i in range(int((x1-x0)/34)+1): c.rect(x0+i*34, G-48, x0+i*34+7, G-24)

def haube(c, cx, fuss, r, h, spitze=True):
    """Spitzbauchige Turmhaube (Grossmünster, Musegg)."""
    pts = [(cx + r*(1 - t**1.8)**.5*(1 - t)**.25, fuss - h*t) for t in [i/30 for i in range(31)]]
    c.add(pts + [(2*cx - x, y) for x, y in pts[::-1]])
    if spitze: c.rect(cx-4, fuss-h-r*.9, cx+4, fuss-h+4); c.circ(cx, fuss-h-r*.45, r*.13)

def zelt(c, cx, fuss, w, h):
    """Steiles Zeltdach mit leicht geschweiftem Fuss."""
    c.add([(cx-w*.62, fuss), (cx-w*.5, fuss-h*.08), (cx, fuss-h), (cx+w*.5, fuss-h*.08), (cx+w*.62, fuss)])

def stufenturm(c, x0, x1, G, h, stufen=8, rechts=True):
    """Hochhaus, das sich nach oben auf einer Seite stufenweise verjüngt (Roche-Turm)."""
    w = x1-x0; pts = [(x0, G), (x0, G-h)]; x = x1 - w*.45
    for i in range(stufen):
        y = G-h + h*(i/stufen)*.95; pts += [(x, y)]; x += w*.55/stufen; pts += [(x, y)]
    pts += [(x1, G-h*.05), (x1, G)]
    if not rechts: pts = [(x0+x1-px, py) for px, py in pts]
    c.add(pts)

def segel(c, x, y, s, sg=1):
    """Segelboot."""
    c.add([(x-s*.55, y), (x+s*.55, y), (x+s*.42, y+s*.16), (x-s*.42, y+s*.16)])
    c.add([(x+sg*s*.04, y-8), (x+sg*s*.04, y-s*1.15), (x+sg*s*.48, y-8)])
    c.add([(x-sg*s*.02, y-12), (x-sg*s*.02, y-s*.9), (x-sg*s*.36, y-12)])


# Zürich: Limmat, Grossmünster, Fraumünster, St. Peter, Predigerkirche
def s_zuerich():
    c = C(2800, 1500); G = 1240
    huegel(c, G-420, 40, 1600, .8, G); hg = c; c = ebene(hg)
    for x0, x1, s in [(0, 330, 11), (520, 700, 12), (1060, 1560, 13), (2120, 2340, 14), (2470, 2800, 15)]:
        altstadt(c, x0, x1, G, s, 170, 290)
    # St. Peter: grösstes Zifferblatt Europas
    kirchturm(c, 420, G, 150, 500, 'spitz', 300, uhr_=False, schall=0); uhr2(c, 420, G-500+88, 58)
    bogen(c, 420, G-210, 18, 90)
    schiff(c, 300, 540, G, 200, 120, 4, False)
    # Fraumünster: schlanker Turm mit hohem Spitzhelm, langes Schiff
    schiff(c, 640, 1060, G, 250, 150, 6)
    kirchturm(c, 900, G, 92, 470, 'spitz', 470, uhr_=True, schall=2)
    # Grossmünster: zwei Türme mit Oktogon und spitzbauchiger Haube
    schiff(c, 1580, 2100, G, 260, 160, 6, False)
    for cx in (1680, 1860):
        w = 120; h = 560
        c.rect(cx-w/2, G-h, cx+w/2, G)
        for y in (G-h*.42, G-h*.72): c.rect(cx-w/2-8, y-7, cx+w/2+8, y+7)
        bogen(c, cx, G-h*.5, w*.13, w*.62); bogen(c, cx-w*.22, G-h*.78, w*.07, w*.4); bogen(c, cx+w*.22, G-h*.78, w*.07, w*.4)
        t = G-h; c.rect(cx-w*.4, t-w*.8, cx+w*.4, t+2); bogen(c, cx-w*.15, t-w*.14, w*.07, w*.42); bogen(c, cx+w*.15, t-w*.14, w*.07, w*.42)
        uhr2(c, cx, t+w*.42, w*.2)
        c.rect(cx-w*.47, t-w*.86, cx+w*.47, t-w*.76)
        haube(c, cx, t-w*.84, w*.42, w*1.3)
    c.rect(1735, G-330, 1805, G)
    # Predigerkirche: schlanker neugotischer Turm
    schiff(c, 2340, 2640, G, 190, 110, 4)
    kirchturm(c, 2420, G, 76, 520, 'spitz', 330, uhr_=True, schall=1)
    ufer(c, G, seed=3); bruecke(c, 1120, 1520, G, 4)
    auflegen(hg, c, 12); return hg

# Bern: Münster, Zytglogge, Bundeshaus, Aare mit Nydeggbrücke
def s_bern():
    c = C(2900, 1600); G = 1300
    huegel(c, G-380, 30, 2200, 2.0, G); hg = c; c = ebene(hg)
    for x0, x1, s in [(0, 480, 21), (1220, 1560, 22), (1720, 1920, 23)]: altstadt(c, x0, x1, G, s, 180, 290, steil=.55)
    # Münster: viereckiger Turm, Oktogon, durchbrochener Helm
    schiff(c, 640, 1200, G, 300, 170, 7)
    cx, w = 760, 160
    c.rect(cx-w/2, G-560, cx+w/2, G)
    for y in (G-300, G-430): c.rect(cx-w/2-10, y-8, cx+w/2+10, y+8)
    masswerk(c, cx-w/2+10, G-540, cx+w/2-10, G-440, 2); bogen(c, cx, G-60, 40, 150)
    for sg in (-1, 1): c.rect(cx+sg*w/2-14, G-600, cx+sg*w/2+14, G-560); nadel(c, cx+sg*w/2, G-600, 30, G-680)
    o = w*.74; c.rect(cx-o/2, G-760, cx+o/2, G-556); masswerk(c, cx-o/2+8, G-740, cx+o/2-8, G-600, 2)
    for sg in (-1, 1): c.rect(cx+sg*o/2-12, G-790, cx+sg*o/2+12, G-740); nadel(c, cx+sg*o/2, G-790, 28, G-860)
    helm_gotisch(c, cx, G-756, o*.92, 300, 8)
    # Zytglogge: Turm mit Zifferblatt, steilem Dach und Glockenreiter
    zx, zw = 1640, 130
    c.rect(zx-zw/2, G-400, zx+zw/2, G); bogen(c, zx, G, 34, 110); uhr2(c, zx, G-300, 40)
    c.rect(zx-zw/2-10, G-410, zx+zw/2+10, G-398)
    c.add([(zx-zw*.62, G-404), (zx+zw*.62, G-404), (zx+zw*.1, G-620), (zx-zw*.1, G-620)])
    c.rect(zx-16, G-680, zx+16, G-610); nadel(c, zx, G-680, 44, G-760); c.rect(zx-3, G-790, zx+3, G-750)
    # Bundeshaus: Mittelbau mit Tambour und Kuppel, Eckpavillons
    c.rect(1980, G-280, 2860, G)
    for a, b in [(1980, 2120), (2720, 2860)]: c.rect(a, G-330, b, G); c.add([(a-6, G-330), (b+6, G-330), ((a+b)/2, G-380)])
    c.rect(2290, G-360, 2550, G); c.add([(2280, G-360), (2560, G-360), (2420, G-420)])
    c.rect(2330, G-520, 2510, G-400); fenster(c, 2340, G-510, 2500, G-410, 6, 1, 14, 50)
    kuppel(c, 2420, G-520, 112, 150)
    for x, y in ((2340, G-430), (2500, G-430)): c.rect(x-14, y-90, x+14, y); kuppel(c, x, y-90, 16, 22, False)
    fenster(c, 1990, G-250, 2850, G-40, 26, 3, 14, 40)
    ufer(c, G, seed=5); bruecke(c, 140, 600, G, 3)
    auflegen(hg, c, 12); return hg

# Basel: Rhein, Münster auf der Pfalz, Mittlere Brücke mit Käppelijoch, Roche-Turm
def s_basel():
    c = C(2900, 1700); G = 1400
    for x0, x1, s in [(0, 560, 31), (1560, 2200, 32)]: altstadt(c, x0, x1, G, s, 170, 300)
    # Pfalz-Terrasse mit Stützmauer
    c.rect(560, G-140, 1560, G)
    for x in range(600, 1560, 120): c.rect(x, G-150, x+28, G)
    T = G-140
    schiff(c, 760, 1420, T, 280, 170, 7)
    for cx in (820, 1000):
        w = 120; c.rect(cx-w/2, T-480, cx+w/2, T)
        for y in (T-280, T-380): c.rect(cx-w/2-8, y-7, cx+w/2+8, y+7)
        masswerk(c, cx-w/2+8, T-470, cx+w/2-8, T-400, 2); bogen(c, cx, T-150, 22, 100)
        o = w*.78; c.rect(cx-o/2, T-600, cx+o/2, T-476); masswerk(c, cx-o/2+6, T-585, cx+o/2-6, T-500, 2)
        for sg in (-1, 1): c.rect(cx+sg*o/2-10, T-620, cx+sg*o/2+10, T-590); nadel(c, cx+sg*o/2, T-620, 24, T-680)
        helm_gotisch(c, cx, T-596, o*.95, 240 if cx == 820 else 225, 7)
    c.rect(1320, T-460, 1370, T-260); nadel(c, 1345, T-460, 60, T-560)   # Vierungstürmchen
    # Roche-Turm: weisses Hochhaus mit Stufen
    stufenturm(c, 2420, 2700, G, 1250, 9)
    fenster(c, 2440, G-1180, 2600, G-40, 1, 30, 150, 8)
    c.rect(2200, G-260, 2900, G); fenster(c, 2220, G-240, 2400, G-30, 4, 3, 20, 40)
    ufer(c, G, seed=7); bruecke(c, 1480, 2380, G, 6)
    kx = 1930; c.rect(kx-40, G-150, kx+40, G-40); c.add([(kx-52, G-150), (kx+52, G-150), (kx, G-260)]); bogen(c, kx, G-60, 14, 60)
    return c

# Luzern: Pilatus, Museggmauer, Kapellbrücke mit Wasserturm, Hofkirche
def s_luzern():
    c = C(3000, 1600); G = 1260
    bergzug(c, [(0, 900), (300, 780), (520, 560), (640, 470), (700, 420), (760, 460), (820, 400), (900, 450), (1000, 520), (1200, 690),
                (1450, 820), (1800, 880), (2200, 860), (2600, 900), (3000, 880)], G, rau=.22, seed=41)
    hg = c; c = ebene(hg)
    e = ebene(c)
    e.add(glatt([(0, G-300), (200, G-330), (500, G-310), (760, G-250), (900, G-120), (980, G)], 6) + [(0, G)])
    e.rect(0, G-400, 820, G-300)
    for i, (x, h) in enumerate([(80, 330), (260, 360), (440, 330), (620, 350), (780, 300)]):
        y = G - 300 - (0 if x < 700 else 0); e.rect(x-46, y-h, x+46, y); zelt(e, x, y-h, 92, 190 if i % 2 else 150)
        bogen(e, x, y-h+90, 10, 40)
    for x in range(0, 820, 44): e.rect(x, G-422, x+22, G-396)
    auflegen(c, e, 14)
    altstadt(c, 900, 1500, G, 42, 190, 300); altstadt(c, 2400, 3000, G, 43, 180, 260)
    # Hofkirche: Doppelturm mit Spitzhelmen
    schiff(c, 1900, 2380, G, 280, 160, 6, False)
    for cx in (1960, 2320): kirchturm(c, cx, G, 80, 520, 'spitz', 330, uhr_=True, schall=2)
    c.rect(1990, G-340, 2290, G); c.add([(1980, G-340), (2300, G-340), (2140, G-430)])
    ufer(c, G, seed=9, tief=260)
    # Kapellbrücke: gedeckte Holzbrücke auf Pfählen, achteckiger Wasserturm
    k = ebene(c); yb = G+90; y = lambda x: yb - (x-800)/1130*40
    k.add([(800, y(800)), (1930, y(1930)), (1930, y(1930)-34), (800, y(800)-34)])
    k.add([(786, y(800)-30), (1944, y(1930)-30), (1944, y(1930)-44), (1365, y(1365)-86), (786, y(800)-44)])
    for i in range(24):
        x = 820 + i*47; k.rect(x-6, y(x), x+6, y(x)+110)
        if i % 3 == 1: k.rect(x+8, y(x)-26, x+38, y(x)-12, 0)
    wx = 1380; k.rect(wx-72, G-150, wx+72, y(wx)+110); zelt(k, wx, G-150, 144, 240)
    for yy in (G-110, G-20): k.rect(wx-12, yy, wx+12, yy+40, 0)
    k.rect(wx-96, G-60, wx-72, y(wx)); zelt(k, wx-84, G-60, 30, 50)
    auflegen(c, k, 12)
    auflegen(hg, c, 12); return hg


# Genf: Jet d'Eau, Saint-Pierre auf dem Altstadthügel, Mont-Blanc-Massiv, Segelboote
def s_genf():
    c = C(3000, 1700); G = 1350
    bergzug(c, [(0, 1080), (300, 1010), (600, 960), (900, 900), (1100, 860), (1250, 800), (1340, 770), (1420, 790), (1560, 860),
                (1900, 950), (2400, 1000), (3000, 1060)], G, rau=.18, seed=51)
    hg = c; c = ebene(hg)
    e = ebene(c)
    e.add(glatt([(1700, G), (1900, G-120), (2150, G-200), (2500, G-230), (2800, G-200), (3000, G-160)], 6) + [(3000, G)])
    altstadt(e, 1900, 3000, G-190, 52, 150, 230)
    T = G-210
    # Saint-Pierre: Portikus, zwei Türme, grüne Mittelspitze
    e.rect(2300, T-300, 2700, T); e.rect(2280, T-480, 2420, T); e.rect(2580, T-480, 2720, T)
    for x0 in (2280, 2580): e.add([(x0-10, T-480), (x0+150, T-480), (x0+70, T-540)]); bogen(e, x0+70, T-380, 18, 80)
    e.rect(2460, T-560, 2540, T-300); nadel(e, 2500, T-560, 96, T-860); e.rect(2496, T-900, 2504, T-850)
    e.add([(2330, T-300), (2670, T-300), (2500, T-370)])
    for i in range(6): e.rect(2345 + i*58, T-280, 2345 + i*58 + 30, T, 0)
    auflegen(c, e, 14)
    c.rect(0, G-2, 3000, G+18); wasser(c, G+36, G+330, 0, 3000, 3, 11)
    # Jet d'Eau: Wassersäule, oben vom Wind zur Seite getragen, fallende Tropfenschleier
    jx = 760; top = G-1080
    c.add([(jx-16, G+12), (jx+16, G+12), (jx+20, top+120), (jx+10, top), (jx-6, top+30), (jx-14, top+140)])
    c.circ(jx+8, top+16, 26)
    for k in range(5):
        pts = [(jx + 8 + (40 + k*34)*math.sin(t*1.5) + (k*22)*t*t, top + 10 + (60 + k*30)*t + (260 + k*150)*t**2.2) for t in [i/16 for i in range(17)]]
        strich(c, pts, 22 - k*2.5, 3, 255)
    # Mole mit Leuchtturm
    c.rect(400, G-14, 1200, G+30); c.rect(1170, G-170, 1200, G-10); c.add([(1160, G-170), (1210, G-170), (1185, G-210)])
    b = ebene(c)
    for x, sz, sg, y in [(300, 160, 1, G+150), (1500, 210, -1, G+230), (2100, 150, 1, G+130)]: segel(b, x, y, sz, sg)
    auflegen(c, b, 12)
    auflegen(hg, c, 12); return hg

# Dorf: Kirche mit Spitzturm, Bauernhäuser, Bäume, Zaun, Hügel
def s_dorf():
    c = C(2800, 1400); G = 1200
    huegel(c, G-420, 60, 1300, .3, G); e = ebene(c); huegel(e, G-110, 30, 900, 1.6, G); auflegen(c, e, 14); hg = c; c = ebene(hg)
    # Kirche
    schiff(c, 1160, 1600, G, 230, 160, 4, False)
    kirchturm(c, 1220, G, 120, 440, 'spitz', 360, uhr_=True, schall=2)
    c.add([(1580, G-230), (1640, G-230), (1640, G), (1580, G)]); c.add([(1570, G-230), (1650, G-230), (1610, G-320)])
    # Bauernhäuser mit grossen Walmdächern
    for x, w, h in [(240, 330, 190), (700, 280, 170), (1850, 340, 200), (2330, 290, 170)]:
        c.rect(x, G-h, x+w, G)
        c.add([(x-50, G-h+20), (x+w+50, G-h+20), (x+w*.82, G-h-w*.5), (x+w*.18, G-h-w*.5)])
        c.add([(x+w*.18, G-h-w*.5), (x+w*.82, G-h-w*.5), (x+w*.7, G-h-w*.62), (x+w*.3, G-h-w*.62)])
        fenster(c, x+20, G-h+40, x+w-20, G-40, int(w/70), 2, 26, 36)
        c.rect(x+w*.45, G-h-w*.4, x+w*.55, G-h-w*.2, 0)
    for x, h, r, s in [(130, 330, 110, 1), (1020, 300, 100, 2), (1760, 340, 115, 3), (2700, 320, 105, 4)]: laubbaum(c, x, G, h, r, s)
    for x, h in [(620, 300), (2240, 340), (2560, 280)]: tanne(c, x, G, h, h*.5)
    # Zaun
    c.rect(0, G-60, 2800, G-52); c.rect(0, G-30, 2800, G-22)
    for x in range(10, 2800, 46): c.add([(x, G), (x+14, G), (x+14, G-74), (x+7, G-86), (x, G-74)])
    c.rect(0, G, 2800, G+40)
    auflegen(hg, c, 12); return hg

def mansarden(c, x0, x1, G, seed, hmin=240, hmax=320):
    """Pariser Wohnblöcke: Mansarddach mit Gauben, Kamine, Fensterraster, Balkonbänder."""
    rnd = random.Random(seed); x = x0
    while x < x1:
        w = min(rnd.randint(220, 330), x1-x+30); h = rnd.randint(hmin, hmax)
        c.rect(x, G-h, x+w, G)
        c.add([(x-6, G-h), (x+w+6, G-h), (x+w-22, G-h-88), (x+22, G-h-88)]); c.add([(x+22, G-h-88), (x+w-22, G-h-88), (x+w-40, G-h-112), (x+40, G-h-112)])
        for gx in range(int(x+50), int(x+w-40), 70): c.rect(gx-10, G-h-70, gx+10, G-h-30, 0)
        for kx in (x+w*.2, x+w*.8):
            if rnd.random() < .7: c.rect(kx-14, G-h-150, kx+14, G-h-100)
        for fy in range(int(G-h+30), int(G-50), 62):
            for fx in range(int(x+26), int(x+w-26), 46): c.rect(fx, fy, fx+16, fy+34, 0)
        c.rect(x+4, G-h+82, x+w-4, G-h+86, 0)
        x += w + 4

def eiffel(c, cx, G, h):
    """Eiffelturm: exponentiell geschwungene Kontur, Bogen, drei Plattformen, Fachwerk-Löcher."""
    B = h*.42; wv = lambda t: B/2*math.exp(-3.2*t) + h*.006
    ts = [i/60 for i in range(61)]
    c.add([(cx - wv(t), G - h*t*.93) for t in ts] + [(cx + wv(t), G - h*t*.93) for t in ts[::-1]])
    c.cut([(cx + B/2*.62*math.cos(math.pi*k/30), G - h*.135*math.sin(math.pi*k/30)) for k in range(31)])
    y1, y2 = G - h*.185, G - h*.37
    c.cut([(cx - wv(.2)*.52, y1 - h*.012), (cx + wv(.2)*.52, y1 - h*.012), (cx + wv(.36)*.3, y2 + h*.02), (cx - wv(.36)*.3, y2 + h*.02)])
    for sg in (-1, 1):   # Fachwerk in den Beinen
        for i in range(4):
            t = .03 + i*.035; y = G - h*t*.93; xm = cx + sg*(wv(t)*.82); d = wv(t)*.09
            c.cut([(xm, y-d*1.6), (xm+d, y), (xm, y+d*1.6), (xm-d, y)])
    for t in [.42 + i*.045 for i in range(10)]:
        y = G - h*t*.93; d = wv(t)*.55; c.cut([(cx, y-d*1.3), (cx+d*.8, y), (cx, y+d*1.3), (cx-d*.8, y)])
    for t, ww, dd in [(.19, 1.08, .022), (.37, 1.2, .016), (.875, 2.6, .012)]:
        y = G - h*t; c.rect(cx - wv(t)*ww - 6, y - h*dd, cx + wv(t)*ww + 6, y)
    c.rect(cx - h*.012, G - h*.93 - h*.04, cx + h*.012, G - h*.93 + 4); c.rect(cx - 3, G - h, cx + 3, G - h*.95)

def notre_dame(c, x0, G):
    """Westfassade mit zwei Türmen, Rosette, Königsgalerie, Portalen; Schiff und Vierungsturm."""
    c.rect(x0+380, G-330, x0+900, G); c.add([(x0+380, G-330), (x0+900, G-330), (x0+880, G-460), (x0+400, G-460)])
    fx = x0+720; c.rect(fx-14, G-560, fx+14, G-440); helm_gotisch(c, fx, G-556, 54, 360, 9, False, False)
    for bx in range(x0+430, x0+880, 90): strich(c, [(bx, G-330), (bx+40, G-230), (bx+40, G-60)], 12, 18, 255)
    c.rect(x0, G-470, x0+420, G)
    for tx in (x0, x0+290): c.rect(tx, G-720, tx+130, G); c.rect(tx-6, G-732, tx+136, G-716); masswerk(c, tx+14, G-690, tx+116, G-500, 2)
    c.circ(x0+210, G-360, 56, 0); c.circ(x0+210, G-360, 40); c.circ(x0+210, G-360, 14, 0)
    for i in range(9): bogen(c, x0+40 + i*42, G-262, 12, 50)
    for px, r in ((x0+65, 40), (x0+210, 48), (x0+355, 40)):
        c.cut([(px-r, G), (px-r, G-r*2), (px, G-r*3.4), (px+r, G-r*2), (px+r, G)])

def s_paris():
    c = C(3200, 1800); G = 1500
    mansarden(c, 0, 680, G, 61); mansarden(c, 1340, 1980, G, 62); mansarden(c, 2900, 3200, G, 63)
    notre_dame(c, 2040, G)
    eiffel(c, 1000, G, 1380)
    ufer(c, G, seed=13); bruecke(c, 1500, 2100, G, 5)
    for x in range(1500, 2100, 150): c.rect(x+70, G-110, x+80, G-52); c.circ(x+75, G-120, 14)
    return c

def wasserturm(c, cx, y):
    """Holz-Wassertank auf dem Dach (New York)."""
    c.rect(cx-30, y-90, cx+30, y-30); c.add([(cx-36, y-90), (cx+36, y-90), (cx, y-130)])
    for dx in (-26, 0, 26): c.rect(cx+dx-3, y-32, cx+dx+3, y)

def hochhaus(c, x0, x1, G, h, seed=1, bander=True):
    c.rect(x0, G-h, x1, G)
    if bander:
        for y in range(int(G-h+30), int(G-20), 34): c.rect(x0+12, y, x1-12, y+8, 0)

def freiheit(c, cx, G, s):
    """Freiheitsstatue auf Sockel: Fackel hoch, Strahlenkrone, Tafel."""
    c.add([(cx-s*.95, G), (cx+s*.95, G), (cx+s*.8, G-s*.18), (cx-s*.8, G-s*.18)])
    c.add([(cx-s*.42, G-s*.18), (cx+s*.42, G-s*.18), (cx+s*.34, G-s*1.05), (cx-s*.34, G-s*1.05)])
    c.rect(cx-s*.4, G-s*1.12, cx+s*.4, G-s*1.02); c.rect(cx-s*.38, G-s*.62, cx+s*.38, G-s*.55, 0)
    for i in range(3): c.rect(cx-s*.25 + i*s*.2, G-s*.95, cx-s*.17 + i*s*.2, G-s*.72, 0)
    b = G-s*1.12; H = s*1.25
    c.add([(cx-s*.2, b), (cx+s*.2, b), (cx+s*.16, b-H*.45), (cx+s*.13, b-H*.78), (cx-s*.12, b-H*.78), (cx-s*.18, b-H*.42)])
    c.circ(cx-s*.01, b-H*.86, s*.075)
    for k in range(7):
        a = math.pi*(.12 + k*.127); c.add([(cx - s*.01 + math.cos(a)*s*.06, b-H*.88 - math.sin(a)*s*.06 + 4),
                                           (cx - s*.01 + math.cos(a)*s*.2, b-H*.88 - math.sin(a)*s*.2),
                                           (cx - s*.01 + math.cos(a+.08)*s*.06, b-H*.88 - math.sin(a+.08)*s*.06)])
    strich(c, [(cx+s*.1, b-H*.74), (cx+s*.17, b-H*.95), (cx+s*.2, b-H*1.15)], s*.08, s*.06, 255)
    c.add([(cx+s*.13, b-H*1.15), (cx+s*.28, b-H*1.15), (cx+s*.25, b-H*1.21), (cx+s*.16, b-H*1.21)])
    c.add([(cx+s*.15, b-H*1.21), (cx+s*.26, b-H*1.21), (cx+s*.22, b-H*1.3), (cx+s*.205, b-H*1.36), (cx+s*.18, b-H*1.28)])
    c.add([(cx-s*.14, b-H*.62), (cx-s*.3, b-H*.66), (cx-s*.27, b-H*.4), (cx-s*.12, b-H*.38)])

def s_newyork():
    c = C(3400, 2100); G = 1800
    rnd = random.Random(71)
    for x0, x1 in [(700, 1300), (1700, 1980), (2240, 2580), (2900, 3400)]:
        x = x0
        while x < x1:
            w = rnd.randint(110, 190); h = rnd.randint(260, 620); hochhaus(c, x, x+w, G, h)
            if rnd.random() < .45: wasserturm(c, x + w*.5, G-h)
            x += w + rnd.choice([0, 6, 14])
    # Empire State Building
    ex = 1500
    for w, h in [(380, 300), (300, 340), (250, 900), (200, 960), (150, 1000), (110, 1060)]: c.rect(ex-w/2, G-h, ex+w/2, G)
    c.add([(ex-50, G-1060), (ex+50, G-1060), (ex+30, G-1130), (ex-30, G-1130)]); c.rect(ex-20, G-1200, ex+20, G-1125)
    c.add([(ex-12, G-1200), (ex+12, G-1200), (ex, G-1250)]); c.rect(ex-4, G-1400, ex+4, G-1240)
    for dx in range(-110, 120, 22): c.rect(ex+dx-3, G-880, ex+dx+3, G-360, 0)
    # Chrysler Building: gestaffelte Bögen mit Dreiecksfenstern, Nadel
    kx, kw, kt = 2110, 200, G-820
    c.rect(kx-kw/2, kt, kx+kw/2, G); c.rect(kx-kw/2-30, G-380, kx+kw/2+30, G)
    for i in range(6):
        r = kw/2*(1 - i*.15); y = kt - i*44
        c.add([(kx + r*math.cos(math.pi*t/20), y - r*.95*math.sin(math.pi*t/20)) for t in range(21)])
    for i in range(5):
        r = kw/2*(1 - i*.15); y = kt - i*44 - r*.55
        for sg in (-1, 1): c.cut([(kx+sg*r*.5, y), (kx+sg*r*.62, y-16), (kx+sg*r*.74, y)])
    c.add([(kx-8, kt-300), (kx+8, kt-300), (kx, kt-480)])
    for y in range(int(kt+20), int(G-400), 40): c.rect(kx-kw/2+14, y, kx+kw/2-14, y+10, 0)
    # One World Trade Center: verjüngter Glasturm mit Antenne
    wx = 2760; wb = 260
    c.rect(wx-wb/2, G-240, wx+wb/2, G)
    c.add([(wx-wb/2, G-240), (wx+wb/2, G-240), (wx+wb*.3, G-1360), (wx-wb*.3, G-1360)])
    c.rect(wx-wb*.33, G-1390, wx+wb*.33, G-1350); c.add([(wx-14, G-1390), (wx+14, G-1390), (wx+4, G-1720), (wx-4, G-1720)])
    ufer(c, G, seed=17, tief=240)
    i = ebene(c); i.add(glatt([(0, G+60), (80, G+20), (520, G+20), (620, G+60)], 4)); freiheit(i, 300, G+30, 400); auflegen(c, i, 14)
    return c

def s_london():
    c = C(3400, 1800); G = 1500
    # Parlament: lange Fassade mit Fialen, Victoria Tower, Mittelturm
    c.rect(200, G-270, 1440, G)
    for x in range(210, 1440, 46): nadel(c, x, G-268, 16, G-330)
    for x in range(230, 1420, 40): c.rect(x, G-240, x+10, G-30, 0)
    vx, vw = 360, 220; c.rect(vx-vw/2, G-760, vx+vw/2, G)
    for sg in (-1, 1): c.rect(vx+sg*vw/2-16, G-820, vx+sg*vw/2+16, G-740); nadel(c, vx+sg*vw/2, G-820, 34, G-880)
    zinnen(c, vx-vw/2, vx+vw/2, G-760, 14); masswerk(c, vx-vw/2+20, G-700, vx+vw/2-20, G-420, 3)
    c.rect(vx-3, G-960, vx+3, G-820); c.add([(vx+3, G-960), (vx+70, G-940), (vx+3, G-915)])
    c.rect(870, G-430, 950, G-260); nadel(c, 910, G-430, 100, G-640)
    # Elizabeth Tower (Big Ben)
    bx, bw = 1560, 120
    c.rect(bx-bw/2, G-580, bx+bw/2, G); masswerk(c, bx-bw/2+10, G-560, bx+bw/2-10, G-120, 2)
    c.rect(bx-bw*.68, G-760, bx+bw*.68, G-575); uhr2(c, bx, G-668, 58)
    for sg in (-1, 1): c.rect(bx+sg*bw*.68-12, G-800, bx+sg*bw*.68+12, G-740); nadel(c, bx+sg*bw*.68, G-800, 26, G-850)
    c.rect(bx-bw*.55, G-850, bx+bw*.55, G-756); bogen(c, bx-24, G-770, 13, 60); bogen(c, bx+24, G-770, 13, 60)
    c.add([(bx-bw*.62, G-848), (bx+bw*.62, G-848), (bx+bw*.16, G-1040), (bx-bw*.16, G-1040)])
    c.rect(bx-14, G-1090, bx+14, G-1036); nadel(c, bx, G-1090, 34, G-1170)
    # St Paul's Cathedral (hinten, kleiner)
    sx = 2050; c.rect(sx-230, G-260, sx+230, G); c.rect(sx-130, G-400, sx+130, G-255)
    for i in range(9): c.rect(sx-118 + i*28, G-390, sx-106 + i*28, G-270, 0)
    kuppel(c, sx, G-398, 130, 170, True)
    for tx in (sx-200, sx+200): c.rect(tx-28, G-380, tx+28, G-250); kuppel(c, tx, G-380, 28, 50, False)
    ufer(c, G, seed=19, tief=230)
    # Tower Bridge
    for tx in (2560, 2960):
        tw = 140; c.rect(tx-tw/2, G-640, tx+tw/2, G+230)
        for sg in (-1, 1):
            c.rect(tx+sg*tw/2-18, G-700, tx+sg*tw/2+18, G-560); nadel(c, tx+sg*tw/2, G-700, 42, G-790)
        c.add([(tx-tw/2, G-640), (tx+tw/2, G-640), (tx, G-760)]); c.rect(tx-3, G-820, tx+3, G-750)
        masswerk(c, tx-tw/2+20, G-560, tx+tw/2-20, G-330, 2); bogen(c, tx, G-60, 30, 160)
    c.rect(2630, G-590, 2890, G-560); c.rect(2630, G-520, 2890, G-500)
    for x in range(2640, 2890, 30): linie(c, (x, G-560), (x+30, G-520), 6)
    c.rect(2630, G-40, 2890, G)
    for tx, sg in ((2560, -1), (2960, 1)):
        a = tx + sg*70; e = tx + sg*300
        strich(c, [(a + (e-a)*k/12, G-470 + 400*(k/12)**1.5) for k in range(13)], 16, 16, 255)
        c.rect(min(a, e+sg*30), G-40, max(a, e+sg*30), G); c.rect(e-24, G-120, e+24, G); nadel(c, e, G-120, 40, G-170)
        for k in range(1, 6): xx = a + (e-a)*k/6; c.rect(xx-3, G-470 + 400*(k/6)**1.5, xx+3, G-40)
    return c

def pinie2(c, cx, G, h, r, sg=1):
    """Schirmpinie: leicht gebogener Stamm, gewölbte Wolkenkrone mit Ästen."""
    st = [(cx + sg*r*.25*math.sin(t/10*1.4), G - (h - r*.2)*t/10) for t in range(11)]
    strich(c, st, r*.17, r*.09, 255); kx, ky = st[-1]
    for dx in (-.45, .4): strich(c, [(kx, ky + r*.25), (kx + dx*r*.6, ky + r*.02), (kx + dx*r, ky - r*.05)], r*.06, r*.04, 255)
    for dx, dy, s_ in [(-.78, .02, .3), (-.45, -.12, .38), (-.05, -.2, .42), (.38, -.14, .4), (.75, .0, .32)]:
        c.add([(kx + dx*r + s_*r*math.cos(math.pi*t/24), ky + dy*r - s_*r*.6*math.sin(math.pi*t/24)) for t in range(25)])
    c.add(glatt([(kx - r*1.08, ky + r*.04), (kx - r*.6, ky + r*.14), (kx, ky + r*.17), (kx + r*.6, ky + r*.14), (kx + r*1.07, ky + r*.04)], 3) + [(kx + r*.9, ky - r*.28), (kx - r*.9, ky - r*.28)])

def s_rom():
    c = C(3200, 1700); G = 1450
    # Petersdom: Fassade, Tambour mit Doppelsäulen, hohe Rippenkuppel, Laterne
    px = 640
    c.rect(px-330, G-270, px+330, G); c.rect(px-260, G-320, px+260, G-268)
    for i in range(10): c.rect(px-300 + i*64, G-250, px-282 + i*64, G-20, 0)
    for sx in (px-300, px+300): c.rect(sx-50, G-380, sx+50, G-270); kuppel(c, sx, G-380, 46, 60, True)
    c.rect(px-190, G-490, px+190, G-318); c.rect(px-206, G-500, px+206, G-486)
    for i in range(8): bogen(c, px-160 + i*46, G-350, 10, 80)
    prof = [(px + 190*math.cos(math.pi*t/2*(1)), 0) for t in range(1)]
    dk = [(px + 186*(1 - (k/30)**2.2)**.5, G-500 - 330*(k/30)) for k in range(31)]
    c.add(dk + [(2*px - x, y) for x, y in dk[::-1]])
    for dx in (-110, -40, 40, 110): strich(c, [(px+dx*(1-t/10*.55), G-505 - 300*t/10) for t in range(11)], 7, 4, 0)
    c.rect(px-36, G-920, px+36, G-820); c.rect(px-46, G-930, px+46, G-916); nadel(c, px, G-930, 60, G-1000); kreuz(c, px, G-1006, 50)
    # Kolosseum: drei Arkadengeschosse, geschlossene Attika, rechts treppig abgebrochen
    x0, x1 = 1380, 2860; hs = 120; top = G - hs*3 - 120
    bruch = [(2420, top), (2450, top+40), (2500, top+50), (2530, top+120), (2590, G-hs*2-20), (2650, G-hs*2-10),
             (2690, G-hs*2+30), (2760, G-hs-30), (2820, G-hs-10), (x1, G-hs+20)]
    c.add([(x0, G), (x0, top), (2420, top)] + bruch + [(x1, G)])
    c.rect(x0-8, top-14, 2424, top+4)
    for st in range(3):
        yb = G - st*hs
        for x in range(x0+28, x1-40, 70):
            if (st == 2 and x > 2470) or (st == 1 and x > 2640) or (st == 0 and x > 2780): continue
            bogen(c, x+20, yb-14, 20, hs-38)
        if st: c.rect(x0, yb-6, min(x1, [2780, 2640, 2470][st]+40), yb-1, 0)
    for x in range(x0+40, 2400, 70): c.rect(x, top+40, x+18, top+70, 0)
    for x in range(x0+28, 2420, 70): c.rect(x-3, top+6, x+3, G - hs*3, 0)
    # Pinien und Zypressen
    for x, h, r, sg in [(1180, 560, 230, 1), (3060, 500, 210, -1), (110, 470, 190, 1)]: pinie2(c, x, G, h, r, sg)
    for x, h in [(1020, 420), (1080, 360), (2980, 380)]: zypresse(c, x, G, h, 60)
    c.rect(0, G, 3200, G+50)
    return c

def pferd(c, x, y, s, d):
    """Steigendes Pferd im Profil (d = Blickrichtung)."""
    P = lambda pts: [(x + d*px*s, y - py*s) for px, py in pts]
    c.add(glatt(P([(-.32, .02), (-.3, .2), (-.36, .34), (-.2, .44), (.1, .46), (.22, .5), (.28, .66), (.3, .8), (.42, .86), (.5, .8),
                   (.42, .72), (.38, .6), (.36, .48), (.3, .36), (.4, .38), (.5, .28), (.44, .22), (.3, .28), (.2, .26), (.14, .14), (.08, .02)]), 2))
    c.add(P([(.33, .84), (.36, .94), (.39, .85)]))

def quadriga(c, cx, y, s):
    """Quadriga: vier steigende Pferde, Wagen, Victoria mit Stab, Kranz und Adler."""
    c.rect(cx-s*.8, y-s*.06, cx+s*.8, y)
    for dx, d in ((-.62, -1), (-.32, -1), (.32, 1), (.62, 1)): pferd(c, cx + dx*s, y - s*.05, s*.62, d)
    c.add(glatt([(cx-s*.2, y-s*.05), (cx-s*.22, y-s*.22), (cx-s*.12, y-s*.3), (cx+s*.12, y-s*.3), (cx+s*.22, y-s*.22), (cx+s*.2, y-s*.05)], 3))
    c.add(glatt([(cx-s*.08, y-s*.28), (cx-s*.1, y-s*.5), (cx-s*.05, y-s*.66), (cx+s*.05, y-s*.66), (cx+s*.1, y-s*.5), (cx+s*.08, y-s*.28)], 3))
    c.circ(cx, y-s*.72, s*.05)
    for sg in (-1, 1): c.add([(cx+sg*s*.04, y-s*.6), (cx+sg*s*.24, y-s*.78), (cx+sg*s*.2, y-s*.56)])
    c.rect(cx+s*.1, y-s*1.05, cx+s*.13, y-s*.4); c.circ(cx+s*.115, y-s*.98, s*.06); c.circ(cx+s*.115, y-s*.98, s*.035, 0)
    c.add([(cx+s*.04, y-s*1.08), (cx+s*.19, y-s*1.08), (cx+s*.115, y-s*1.15)])

def s_berlin():
    c = C(3400, 2000); G = 1700
    altstadt(c, 0, 420, G, 81, 220, 330, steil=.4); altstadt(c, 1000, 1300, G, 82, 220, 330, steil=.4)
    # Fernsehturm
    fx = 700
    c.add([(fx-230, G), (fx-230, G-60)] + [(fx-230 + k*46, G-60 - (30 if k % 2 else 0)) for k in range(11)] + [(fx+230, G)])
    c.add([(fx-46, G), (fx+46, G), (fx+24, G-900), (fx-24, G-900)])
    c.circ(fx, G-1010, 125); c.rect(fx-130, G-1010, fx+130, G-996, 0)
    c.rect(fx-26, G-1260, fx+26, G-1120); c.rect(fx-18, G-1300, fx+18, G-1250)
    c.add([(fx-12, G-1300), (fx+12, G-1300), (fx+5, G-1620), (fx-5, G-1620)])
    for y in range(int(G-1290), int(G-1600), -60): c.rect(fx-14, y-26, fx+14, y-18, 0)
    # Brandenburger Tor
    tx0, tx1 = 1420, 2220
    c.rect(tx0-30, G-60, tx1+30, G)
    for i in range(6): x = tx0 + i*(tx1-tx0-50)/5; c.rect(x, G-470, x+50, G-60); c.rect(x-8, G-480, x+58, G-466)
    for i in range(6): x = tx0 + i*(tx1-tx0-50)/5; c.rect(x+4, G-90, x+46, G-60)
    c.rect(tx0-50, G-580, tx1+50, G-470)
    for x in range(tx0-30, tx1+40, 46): c.rect(x, G-550, x+14, G-510, 0)
    c.add([(tx0+120, G-580), (tx1-120, G-580), (tx1-180, G-680), (tx0+180, G-680)])
    c.rect(tx0+220, G-670, tx1-220, G-640, 0)
    quadriga(c, (tx0+tx1)/2, G-680, 330)
    for sx in (tx0-140, tx1+140): c.rect(sx-90, G-360, sx+90, G); c.add([(sx-100, G-360), (sx+100, G-360), (sx, G-420)])
    # Reichstag mit gläserner Kuppel
    rx0, rx1 = 2480, 3380; c.rect(rx0, G-330, rx1, G)
    for tx in (rx0, rx1-170): c.rect(tx, G-470, tx+170, G); zinnen(c, tx, tx+170, G-470, 14)
    m = (rx0+rx1)/2; c.rect(m-170, G-420, m+170, G-320); c.add([(m-190, G-420), (m+190, G-420), (m, G-500)])
    for i in range(6): c.rect(m-150 + i*56, G-310, m-130 + i*56, G-60, 0)
    fenster(c, rx0+180, G-300, m-180, G-60, 6, 3, 16, 40); fenster(c, m+180, G-300, rx1-180, G-60, 6, 3, 16, 40)
    c.rect(m-200, G-560, m+200, G-500)
    kuppel(c, m, G-560, 200, 210, False)
    for k in range(1, 5): yy = G-560 - 210*k/5; ww = 200*(1-(k/5)**2)**.5; c.rect(m-ww+10, yy-5, m+ww-10, yy+5, 0)
    for dx in (-110, 0, 110): strich(c, [(m+dx*(1-t/10*.75), G-565 - 190*t/10) for t in range(11)], 8, 6, 0)
    c.rect(0, G, 3400, G+50)
    return c

def s_pisa():
    c = C(3000, 1800); G = 1550
    # Baptisterium
    bx = 420; c.rect(bx-220, G-300, bx+220, G)
    for i in range(10): bogen(c, bx-200 + i*44, G-30, 12, 110)
    for i in range(10): bogen(c, bx-200 + i*44, G-170, 8, 70)
    c.rect(bx-230, G-310, bx+230, G-296)
    for i in range(10): c.add([(bx-210 + i*42, G-300), (bx-168 + i*42, G-300), (bx-189 + i*42, G-350)])
    kuppel(c, bx, G-300, 205, 170, False)
    c.add([(bx-110, G-430), (bx+110, G-430), (bx+46, G-560), (bx-46, G-560)])
    kuppel(c, bx, G-556, 48, 40, False); c.rect(bx-8, G-640, bx+8, G-590); c.circ(bx, G-650, 14)
    # Dom: Fassade mit Säulengalerien, Schiff, ovale Vierungskuppel
    d0 = 900
    c.rect(d0+320, G-300, d0+1100, G); c.add([(d0+310, G-300), (d0+1110, G-300), (d0+1080, G-380), (d0+340, G-380)])
    c.rect(d0+620, G-450, d0+820, G-370); kuppel(c, d0+720, G-450, 110, 120, True)
    c.rect(d0, G-380, d0+340, G); c.add([(d0, G-380), (d0+80, G-430), (d0+80, G-520), (d0+260, G-520), (d0+260, G-430), (d0+340, G-380)])
    c.add([(d0+80, G-520), (d0+260, G-520), (d0+170, G-590)])
    for row, (y, n) in enumerate([(G-30, 5), (G-230, 9), (G-320, 9), (G-420, 5)]):
        a, b = (d0+20, d0+320) if row < 3 else (d0+90, d0+250)
        for i in range(n): bogen(c, a + (i+.5)*(b-a)/n, y, (b-a)/n*.28, 70 if row else 140)
    # Schiefer Turm (auf eigener Ebene gedreht)
    t = ebene(c); tx, tw = 2380, 240
    t.rect(tx-tw/2, G-140, tx+tw/2, G)
    for i in range(6): bogen(t, tx-tw/2 + (i+.5)*tw/6, G-14, 12, 100)
    for k in range(6):
        y0 = G-140 - k*92; t.rect(tx-tw/2-10, y0-92, tx+tw/2+10, y0); t.rect(tx-tw/2-14, y0-6, tx+tw/2+14, y0+2)
        for i in range(7): bogen(t, tx-tw/2 + (i+.5)*(tw+20)/7 - 10, y0-10, 9, 62)
    yt = G-140-6*92; t.rect(tx-tw*.36, yt-90, tx+tw*.36, yt); t.rect(tx-tw*.4, yt-98, tx+tw*.4, yt-86)
    for i in range(4): bogen(t, tx-tw*.36 + (i+.5)*tw*.72/4, yt-8, 9, 60)
    t.m = t.m.rotate(-5, resample=Image.BICUBIC, center=(tx*SS, G*SS)); t.d = ImageDraw.Draw(t.m)
    auflegen(c, t, 12)
    c.add(glatt([(0, G+40), (600, G+10), (1500, G+20), (2400, G+5), (3000, G+30)], 4) + [(3000, G+60), (0, G+60)])
    return c

def rot(pts, cx, cy, a):
    ca, sa = math.cos(a), math.sin(a)
    return [(cx + (x-cx)*ca - (y-cy)*sa, cy + (x-cx)*sa + (y-cy)*ca) for x, y in pts]

def baender(c, x0, x1, y0, y1, d=34, b=8, rand=12):
    for y in range(int(y0+24), int(y1-16), d): c.rect(x0+rand, y, x1-rand, y+b, 0)

def kran(c, x, G, h, l, sg=1):
    """Turmdrehkran mit Gitter, Ausleger und Gegenausleger."""
    c.rect(x-18, G-h, x+18, G)
    for y in range(int(G-h+20), int(G-20), 44): linie(c, (x-14, y), (x+14, y+40), 5, 0)
    c.rect(x-l*.3*sg if sg > 0 else x, G-h-28, x+l*sg if sg > 0 else x+l*.3, G-h) if False else None
    a, b = sorted((x - .3*l*sg, x + l*sg)); c.rect(a, G-h-26, b, G-h)
    for k in range(int(a)+10, int(b)-10, 40): linie(c, (k, G-h-22), (k+20, G-h-4), 4, 0)
    c.add([(x-10, G-h-26), (x+10, G-h-26), (x, G-h-110)])
    linie(c, (x, G-h-108), (x + l*.9*sg, G-h-26), 4); linie(c, (x, G-h-108), (x - .28*l*sg, G-h-26), 4)
    c.rect(x - .3*l*sg - 30*(sg > 0) , G-h-6, x - .3*l*sg + 30*(sg < 0), G-h+40) if False else c.rect(min(x-.3*l*sg, x-.3*l*sg+50*sg), G-h, max(x-.3*l*sg, x-.3*l*sg+50*sg), G-h+46)
    hx = x + l*.7*sg; linie(c, (hx, G-h), (hx, G-h+260), 3); c.rect(hx-14, G-h+260, hx+14, G-h+280)

def s_hochhaeuser():
    c = C(3400, 2000); G = 1750
    hg = c; rnd = random.Random(91)
    x = 0
    while x < 3400:   # hintere Reihe
        w = rnd.randint(120, 200); h = rnd.randint(380, 760); c.rect(x, G-h, x+w, G)
        if rnd.random() < .35: c.add([(x, G-h), (x+w, G-h), (x+w*(.2 if rnd.random() < .5 else .8), G-h-rnd.randint(60, 140))])
        x += w + rnd.randint(30, 90)
    c = ebene(hg)
    # gedrehter Turm
    tx, tw = 420, 230
    for k in range(26):
        y = G - k*46; off = 60*math.sin(k*.24); c.rect(tx-tw/2+off, y-40, tx+tw/2+off, y)
    # Turm mit schräger Glasspitze
    c.rect(760, G-1060, 1000, G); c.add([(760, G-1060), (1000, G-1060), (1000, G-1260)]); baender(c, 760, 1000, G-1040, G)
    # runder Turm (Gurke)
    gx = 1260; gp = [(gx + 150*math.sin(math.pi*min(1, .25 + t/40*.75))*(1 - (t/40)**4)**.5, G - 1100*t/40) for t in range(41)]
    c.add([(gx - (x_-gx), y) for x_, y in gp] + gp[::-1])
    for k in range(1, 12): yy = G - k*90; strich(c, [(gx-150, yy+40), (gx+150, yy-40)], 6, 6, 0) if yy > G-1000 else None
    # Turm mit Stufen und Nadel
    sx = 1680
    for w, h in [(300, 900), (240, 1100), (170, 1260), (110, 1360)]: c.rect(sx-w/2, G-h, sx+w/2, G)
    c.add([(sx-10, G-1360), (sx+10, G-1360), (sx, G-1600)]); baender(c, sx-150, sx+150, G-880, G, 30, 6, 16)
    # Doppelturm mit Brücke
    for dx in (-130, 130): c.rect(2100+dx-80, G-1180, 2100+dx+80, G); c.add([(2100+dx-80, G-1180), (2100+dx+80, G-1180), (2100+dx+40, G-1280), (2100+dx-40, G-1280)])
    c.rect(2050, G-760, 2150, G-720); baender(c, 1940, 2100-50, G-1150, G, 40, 10, 14); baender(c, 2180, 2310, G-1150, G, 40, 10, 14)
    # Baustelle mit Kran
    c.rect(2560, G-640, 2800, G)
    for y in range(int(G-640), int(G), 70): c.rect(2560, y, 2800, y+10, 0)
    for x in range(2580, 2800, 60): c.rect(x, G-640, x+8, G, 0)
    kran(c, 2680, G, 1050, 560, -1)
    # schräger Turm rechts
    c.add([(2920, G), (2920, G-980), (3150, G-860), (3150, G)]); baender(c, 2920, 3150, G-840, G, 36, 8)
    auflegen(hg, c, 14); c = hg
    v = ebene(c)
    for x, h, r in [(120, 220, 90), (300, 260, 110), (1050, 240, 100), (1480, 210, 90), (2400, 250, 110), (3300, 230, 100)]: laubbaum(v, x, G+30, h, r, x)
    v.rect(0, G, 3400, G+40)
    auflegen(c, v, 12)
    return c

def rundturm(c, cx, fuss, w, h, dh, zin=False):
    c.rect(cx-w/2, fuss-h, cx+w/2, fuss)
    if zin: zinnen(c, cx-w/2-8, cx+w/2+8, fuss-h, 18)
    else: c.add([(cx-w/2-10, fuss-h+4), (cx+w/2+10, fuss-h+4), (cx, fuss-h-dh)])
    for y in (fuss-h*.4, fuss-h*.75): c.rect(cx-5, y-26, cx+5, y, 0)

def s_burg():
    c = C(3200, 2000); G = 1800
    berg = [(0, G-140), (400, G-260), (800, G-520), (1080, G-780), (1200, G-860), (1500, G-890), (1900, G-870), (2150, G-820), (2350, G-640), (2700, G-360), (3200, G-200)]
    bergzug(c, berg, G, .1, 6, 1, 4)
    T = G-870
    # Ringmauer mit Zinnen
    c.rect(1150, T-180, 2200, T+20); zinnen(c, 1150, 2200, T-180, 22)
    bogen(c, 1500, T+10, 40, 110)
    # Palas mit Steildach und Fenstern
    c.rect(1560, T-420, 2000, T-150); c.add([(1540, T-420), (2020, T-420), (1940, T-640), (1620, T-640)])
    for x in (1610, 1700, 1790, 1880): bogen(c, x+20, T-200, 18, 80); bogen(c, x+20, T-320, 14, 60)
    c.rect(1700, T-700, 1730, T-600); c.rect(1880, T-690, 1910, T-610)
    # Bergfried
    rundturm(c, 1330, T-150, 200, 620, 0, True); c.rect(1330-5, T-1000, 1330+5, T-800); c.add([(1335, T-1000), (1430, T-970), (1335, T-940)])
    c.add([(1250, T-770), (1410, T-770), (1330, T-920)])
    # Ecktürme
    rundturm(c, 1170, T, 130, 400, 200); rundturm(c, 2180, T, 140, 460, 230); rundturm(c, 2060, T-140, 90, 420, 160)
    # Weg und Bäume am Hang
    v = ebene(c)
    for x, h, w in [(500, 300, 140), (620, 360, 160), (760, 280, 120), (2500, 320, 140), (2640, 380, 170), (2800, 300, 140), (2950, 260, 120)]:
        tanne(v, x, hoehe(glatt(berg, 6), x) + 40, h, w)
    auflegen(c, v, 10)
    return c

def windmuehle(c, cx, G, h, a=.35, seed=1):
    """Holländerwindmühle: achteckiger, sich verjüngender Rumpf, Galerie, Kappe, vier Gitterflügel."""
    wb, wt = h*.36, h*.2
    c.add([(cx-wb/2, G), (cx+wb/2, G), (cx+wt/2, G-h), (cx-wt/2, G-h)])
    yg = G - h*.38; c.rect(cx-wb*.72, yg-10, cx+wb*.72, yg+6)
    for k in range(9): xx = cx - wb*.7 + k*wb*1.4/8; c.rect(xx-2, yg-40, xx+2, yg)
    c.rect(cx-wb*.72, yg-44, cx+wb*.72, yg-38)
    c.add(glatt([(cx-wt*.62, G-h+4), (cx-wt*.55, G-h-h*.08), (cx-wt*.2, G-h-h*.14), (cx+wt*.2, G-h-h*.14), (cx+wt*.55, G-h-h*.08), (cx+wt*.62, G-h+4)], 4))
    bogen(c, cx, G, wb*.12, wb*.36); c.rect(cx-wb*.08, G-h*.62, cx+wb*.08, G-h*.52, 0); c.rect(cx-wt*.18, G-h*.86, cx+wt*.18, G-h*.78, 0)
    hx, hy = cx, G - h*.98; L = h*.95; bw = L*.17
    for k in range(4):
        ang = a + k*math.pi/2
        arm = [(hx - 9, hy), (hx + 9, hy), (hx + 7, hy - L), (hx - 7, hy - L)]
        blatt = [(hx + 8, hy - L*.2), (hx + 8 + bw, hy - L*.2), (hx + 8 + bw, hy - L), (hx + 8, hy - L)]
        c.add(rot(arm, hx, hy, ang)); c.add(rot(blatt, hx, hy, ang))
        for i in range(1, 9):
            for j in range(2):
                y0 = hy - L*.2 - (L*.8)*i/9 + 6; x0 = hx + 14 + j*(bw-12)/2
                c.cut(rot([(x0, y0 - L*.8/9 + 12), (x0 + (bw-24)/2, y0 - L*.8/9 + 12), (x0 + (bw-24)/2, y0), (x0, y0)], hx, hy, ang))
    c.circ(hx, hy, h*.04)

def s_muehlen():
    c = C(3200, 1800); G = 1450
    hg = c
    for x0, w, h in [(2100, 160, 160), (2270, 120, 190), (2400, 150, 150), (2580, 130, 200), (2720, 170, 160)]:
        haus(c, x0, w, h, G, 'sattel' if x0 % 2 == 0 else 'treppe', h*.7)
    windmuehle(c, 2900, G, 360, .2)
    c = ebene(hg)
    windmuehle(c, 700, G, 760, .3)
    windmuehle(c, 1650, G, 560, .65)
    c.add(glatt([(0, G+10), (400, G-10), (900, G+5), (1500, G-14), (2100, G), (2600, G-8), (3200, G+6)], 5) + [(3200, G+60), (0, G+60)])
    for x in range(40, 3200, 90): c.rect(x, G-60, x+8, G); c.rect(x, G-48, x+90, G-42)
    auflegen(hg, c, 14); c = hg
    wasser(c, G+60, G+300, 0, 3200, 3, 7)
    for x in (300, 1200, 2500):
        for k in range(5): c.add(glatt([(x + k*26, G+60), (x + k*26 - 10, G), (x + k*26 + 6, G-60 - (k % 2)*30)], 3) + [(x + k*26 + 10, G-60 - (k % 2)*30), (x + k*26 + 8, G+60)])
    return c

def pagode(c, cx, G, w, stock=5, sh=150):
    """Fünfstöckige Pagode mit geschwungenen Dächern und Sorin-Spitze."""
    y = G; c.rect(cx-w*.62, G-40, cx+w*.62, G)
    for k in range(stock):
        b = w*(1 - k*.12); y -= sh*(1 - k*.06)
        c.rect(cx-b*.42, y+20, cx+b*.42, y + sh*(1 - k*.06))
        r = b*.7; rh = sh*.38
        pts = glatt([(cx-r, y - rh*.55), (cx-r*.86, y - rh*.05), (cx-r*.5, y+rh*.2), (cx, y+rh*.24), (cx+r*.5, y+rh*.2), (cx+r*.86, y - rh*.05), (cx+r, y - rh*.55)], 6)
        c.add(pts + [(cx+r*.4, y - rh*.3), (cx-r*.4, y - rh*.3)])
    c.rect(cx-6, y - 330, cx+6, y - 20)
    for k in range(9): c.rect(cx - 22 + k*1.2, y - 60 - k*26, cx + 22 - k*1.2, y - 50 - k*26)
    c.circ(cx, y - 340, 14)

def tokyotower(c, cx, G, h):
    B = h*.38; wv = lambda t: B/2*math.exp(-3*t) + h*.008
    ts = [i/50 for i in range(51)]
    c.add([(cx - wv(t), G - h*t*.78) for t in ts] + [(cx + wv(t), G - h*t*.78) for t in ts[::-1]])
    c.cut([(cx + B/2*.55*math.cos(math.pi*k/30), G - h*.11*math.sin(math.pi*k/30)) for k in range(31)])
    for t in (.06, .14, .22, .3, .42, .5, .58):
        y = G - h*t*.78; d = wv(t)*.42; c.cut([(cx, y-d*1.2), (cx+d, y), (cx, y+d*1.2), (cx-d, y)])
    for t, ww, hh in [(.3, 1.6, .05), (.62, 1.9, .035)]:
        y = G - h*t; c.rect(cx - wv(t/.78)*ww - 10, y - h*hh, cx + wv(t/.78)*ww + 10, y)
    c.add([(cx-10, G-h*.78), (cx+10, G-h*.78), (cx+4, G-h), (cx-4, G-h)])

def s_tokio():
    c = C(3400, 2000); G = 1750
    fuji = [(1300, G-200), (1700, G-480), (1920, G-650), (2020, G-700), (2120, G-700), (2220, G-650), (2440, G-480), (2840, G-200)]
    c.add(glatt([(1100, G), (1300, G-200)] + fuji[1:] + [(3000, G)], 6))
    k = ebene(c); k.add(glatt([(1880, G-610), (1920, G-650), (2020, G-700), (2120, G-700), (2220, G-650), (2260, G-610)], 4) + [(2240, G-590), (2190, G-560), (2150, G-600), (2100, G-550), (2050, G-610), (2000, G-560), (1950, G-600), (1900, G-585)])
    c.m = ImageChops.subtract(c.m, k.m); c.d = ImageDraw.Draw(c.m)
    hg = c; c = ebene(hg)
    rnd = random.Random(33); x = 0; st = c
    while x < 3400:
        w = rnd.randint(100, 180); h = rnd.randint(200, 480)
        if not (1150 < x < 1350): c.rect(x, G-h, x+w, G); baender(c, x, x+w, G-h, G, 36, 8, 12)
        x += w + rnd.randint(10, 50)
    auflegen(hg, c, 14); c = ebene(hg)
    tokyotower(c, 650, G, 1350)
    sx = 2700   # Skytree
    c.add([(sx-110, G), (sx+110, G), (sx+46, G-700), (sx+32, G-1100), (sx-32, G-1100), (sx-46, G-700)])
    c.add([(sx-70, G-880), (sx+70, G-880), (sx+76, G-940), (sx+60, G-990), (sx-60, G-990), (sx-76, G-940)])
    c.add([(sx-48, G-1160), (sx+48, G-1160), (sx+52, G-1200), (sx+40, G-1230), (sx-40, G-1230), (sx-52, G-1200)])
    c.rect(sx-26, G-1240, sx+26, G-1100); c.add([(sx-16, G-1240), (sx+16, G-1240), (sx+6, G-1560), (sx-6, G-1560)])
    for y in range(int(G-80), int(G-860), -70): c.cut([(sx, y-30), (sx+12, y), (sx, y+30), (sx-12, y)])
    auflegen(hg, c, 14); c = hg
    v = ebene(c); pagode(v, 1260, G, 300, 5, 140)
    for x, h, r in [(1060, 200, 90), (1460, 230, 100)]: laubbaum(v, x, G, h, r, x)
    v.rect(0, G, 3400, G+50); auflegen(c, v, 12)
    return c

def dau(c, x, y, s, sg=1):
    """Arabisches Holzboot (Dau) mit Lateinersegel."""
    c.add(glatt([(x - s*.6*sg, y - s*.22), (x - s*.4*sg, y), (x + s*.35*sg, y), (x + s*.6*sg, y - s*.18)], 3))
    c.rect(x - 4, y - s*.95, x + 4, y)
    c.add([(x - s*.45*sg, y - s*.15), (x + s*.12*sg, y - s*1.05), (x + s*.3*sg, y - s*.18)])

def s_dubai():
    c = C(3400, 2200); G = 1900
    hg = c; rnd = random.Random(55); x = 900
    while x < 2500:
        w = rnd.randint(90, 160); h = rnd.randint(300, 700); c.rect(x, G-h, x+w, G)
        if rnd.random() < .4: c.add([(x, G-h), (x+w, G-h), (x+w/2, G-h-rnd.randint(40, 120))])
        x += w + rnd.randint(20, 60)
    c = ebene(hg)
    # Burj Khalifa: gestaffelte Flügel, nach oben zur Nadel
    bx = 1700
    for i, (w, h) in enumerate([(320, 380), (260, 620), (210, 840), (170, 1040), (130, 1220), (96, 1360), (66, 1470)]):
        off = (12 if i % 2 else -12)
        c.rect(bx - w/2 + off, G-h, bx + w/2 + off, G)
    c.add([(bx-30, G-1470), (bx+30, G-1470), (bx+12, G-1700), (bx-12, G-1700)]); c.add([(bx-6, G-1700), (bx+6, G-1700), (bx, G-1900)])
    for i in range(6): c.rect(bx-4, G-360 - i*190, bx+4, G-200 - i*190, 0)
    # Emirates Towers
    for ex, h in ((2300, 900), (2480, 760)):
        c.add([(ex-70, G), (ex+70, G), (ex+70, G-h), (ex-70, G-h-160)]); c.rect(ex-4, G-h-240, ex+4, G-h-150) if h > 800 else None
    # Cayan Tower (gedreht)
    for k in range(20): y = G - k*42; off = 40*math.sin(k*.3); c.rect(1050 + off, y-38, 1190 + off, y)
    auflegen(hg, c, 14); c = hg
    # Burj Al Arab auf Insel (eigene Ebene vor dem Wasser)
    wasser(c, G, G+300, 0, 3400, 3, 9)
    a = ebene(c); ax = 2900; ay = G + 40
    a.add(glatt([(ax-260, ay+30), (ax-200, ay-10), (ax+200, ay-10), (ax+280, ay+30)], 3))
    sail = [(ax - 150 + 30*(t/20)**2, ay - 900*t/20) for t in range(21)]
    front = [(ax - 120 + 300*math.sin(math.pi*t/20*.92)**.9, ay - 900*t/20) for t in range(21)]
    a.add(sail + front[::-1])
    a.cut([(x_ + 22, y) for x_, y in front[2:18]] + [(x_ + 60, y) for x_, y in front[17:1:-1]]) if False else None
    for k in range(2, 18): xx, yy = front[k]; a.rect(xx - 34, yy - 4, xx - 22, yy + 4, 0)
    a.rect(ax - 160, ay - 960, ax - 140, ay - 860); a.add([(ax - 150, ay - 900), (ax - 150, ay - 860), (ax + 40, ay - 830)])
    a.circ(ax - 40, ay - 640, 70); a.rect(ax - 110, ay - 646, ax + 10, ay - 634)
    for x_, s_, sg in [(600, 220, 1), (1300, 170, -1)]: dau(a, x_, G + 150 + s_*.2, s_, sg)
    auflegen(c, a, 12)
    v = ebene(c)
    v.add(glatt([(0, G+30), (300, G-60), (700, G+10), (1000, G+30)], 5) + [(1000, G+300), (0, G+300)])
    for x_, h, n, sd in [(160, 520, .2, 1), (330, 440, -.25, 2), (560, 380, .3, 3)]: palme(v, x_, G-20, h, n, sd)
    auflegen(c, v, 12)
    return c

def gondel(c, x, y, s, sg=1):
    """Gondel: lange, gebogene Form mit Ferro am Bug und Gondoliere am Heck."""
    pts = [(x + sg*s*(t/20 - .5), y - s*.03 - s*.12*(2*t/20 - 1)**4 - (s*.04 if t > 16 else 0)) for t in range(21)]
    low = [(x + sg*s*(t/20 - .5)*.9, y + s*.02) for t in range(20, -1, -1)]
    c.add(pts + low)
    bx, by = pts[-1]
    c.add([(bx, by), (bx + sg*s*.02, by - s*.1), (bx - sg*s*.03, by - s*.11), (bx - sg*s*.02, by)])
    for k in range(4): c.rect(min(bx, bx - sg*s*.05), by - s*.03 - k*s*.022, max(bx, bx - sg*s*.05), by - s*.025 - k*s*.022)
    gx = x - sg*s*.36; mensch(c, gx, y - s*.06, s*.2, sg=sg)
    linie(c, (gx + sg*s*.02, y - s*.18), (gx - sg*s*.14, y + s*.05), 5)
    c.add(glatt([(x - sg*s*.12, y - s*.04), (x - sg*s*.1, y - s*.1), (x + sg*s*.02, y - s*.1), (x + sg*s*.04, y - s*.04)], 3))

def s_venedig():
    c = C(3400, 1900); G = 1450
    # Campanile di San Marco
    cx = 700; c.rect(cx-90, G-780, cx+90, G)
    for dx in (-60, -20, 20, 60): c.rect(cx+dx-6, G-760, cx+dx+6, G-60, 0)
    c.rect(cx-104, G-800, cx+104, G-780); c.rect(cx-96, G-950, cx+96, G-800)
    for i in range(4): bogen(c, cx-72 + i*48, G-812, 14, 100)
    c.rect(cx-104, G-966, cx+104, G-950); c.rect(cx-86, G-1080, cx+86, G-966)
    c.add([(cx-86, G-1080), (cx+86, G-1080), (cx, G-1330)]); c.rect(cx-4, G-1390, cx+4, G-1320); c.circ(cx, G-1396, 12)
    # Dogenpalast: zwei Arkadengeschosse, geschlossene Wand, Zierzinnen
    d0, d1 = 880, 1900
    c.rect(d0, G-560, d1, G)
    for x in range(d0+30, d1-20, 78): bogen(c, x+20, G-10, 26, 150)
    for x in range(d0+20, d1-10, 39): bogen(c, x+12, G-200, 13, 90)
    for x in range(d0+20, d1-10, 39): c.circ(x+12, G-318, 9, 0)
    for x in range(d0+90, d1-60, 170): bogen(c, x+30, G-380, 28, 120)
    for x in range(d0, d1, 34): c.add([(x, G-560), (x+20, G-560), (x+10, G-600)])
    # Santa Maria della Salute (rechts, über dem Wasser)
    sx = 2700
    c.rect(sx-260, G-420, sx+260, G); c.add([(sx-150, G-420), (sx+150, G-420), (sx, G-500)])
    for i in range(4): c.rect(sx-130 + i*80, G-400, sx-110 + i*80, G-60, 0)
    bogen(c, sx, G-10, 50, 200)
    c.rect(sx-230, G-620, sx+230, G-420)
    for sg in (-1, 1):
        for k in range(3): c.circ(sx + sg*(210 - k*20), G-470 - k*50, 46 - k*8); c.circ(sx + sg*(214 - k*20), G-470 - k*50, 22 - k*4, 0)
    c.rect(sx-200, G-700, sx+200, G-610)
    for i in range(8): bogen(c, sx-170 + i*48, G-640, 10, 40)
    kuppel(c, sx, G-700, 210, 260, False)
    c.rect(sx-50, G-1010, sx+50, G-950); kuppel(c, sx, G-1010, 50, 60, False); c.rect(sx-6, G-1120, sx+6, G-1060); c.circ(sx, G-1128, 14)
    kuppel(c, sx+380, G-500, 90, 110, True); c.rect(sx+280, G-500, sx+480, G)
    for tx in (sx+520, sx+590): c.rect(tx-24, G-640, tx+24, G); kuppel(c, tx, G-640, 24, 40, False)
    # Säulen mit Löwe und Theodor an der Piazzetta
    for px in (1990, 2150): c.rect(px-22, G-560, px+22, G); c.rect(px-34, G-576, px+34, G-556)
    c.add(glatt([(1955, G-576), (1960, G-620), (2000, G-640), (2030, G-610), (2026, G-576)], 3)); c.add([(1975, G-630), (1960, G-680), (2000, G-640)])
    mensch(c, 2150, G-576, 110)
    # Lagune, Pfähle, Gondeln
    c.rect(0, G, 3400, G+30)
    rnd = random.Random(11)
    for i, y in enumerate(range(G+80, G+340, 60)):
        for k in range(0, 3400, 300): a = k + rnd.randint(-60, 80); wellen(c, y, a, a + rnd.randint(140, 220), 8, 100, 8, 255)
    g = ebene(c)
    for px in (300, 340, 1120, 1160, 2300, 2340, 3200):
        g.rect(px-10, G-150, px+10, G+170)
        for k in range(4): g.rect(px-10, G-140 + k*60, px+10, G-115 + k*60, 0)
        g.circ(px, G-150, 12)
    for x_, y_, s_, sg in [(560, G+150, 620, 1), (1550, G+250, 760, -1), (2700, G+170, 600, 1)]: gondel(g, x_, y_, s_, sg)
    auflegen(c, g, 12)
    return c

def schwalben(c, x0, x1, y, w=40, h=56, lu=18):
    """Kremlmauer-Zinnen in Schwalbenschwanzform."""
    x = x0
    while x + w <= x1:
        c.add([(x, y), (x+w, y), (x+w, y-h), (x+w/2, y-h*.55), (x, y-h)]); x += w + lu

def zw_turm(c, cx, fuss, w, h, r, zh):
    """Trommel mit Zwiebelkuppel und Spitze."""
    c.rect(cx-w/2, fuss-h, cx+w/2, fuss)
    for i in range(2): bogen(c, cx, fuss-h*.15 - i*h*.4, w*.18, h*.22)
    c.rect(cx-w/2-8, fuss-h-10, cx+w/2+8, fuss-h)
    zwiebel(c, cx, fuss-h-8, r, zh); c.rect(cx-3, fuss-h-zh-60, cx+3, fuss-h-zh+10); c.rect(cx-16, fuss-h-zh-44, cx+16, fuss-h-zh-38)
    for k in (-1, 1): strich(c, [(cx + k*r*.75, fuss-h-zh*.25), (cx, fuss-h-zh*.6), (cx - k*r*.3, fuss-h-zh*.85)], 7, 4, 0)

def s_moskau():
    c = C(3400, 2000); G = 1700
    # Kremlmauer mit Schwalbenschwanz-Zinnen und Spasskaja-Turm
    c.rect(0, G-260, 1500, G); schwalben(c, 0, 1500, G-260)
    tx = 700
    c.rect(tx-150, G-640, tx+150, G); bogen(c, tx, G, 50, 160)
    c.rect(tx-170, G-660, tx+170, G-640)
    for sg in (-1, 1): c.rect(tx+sg*150-20, G-720, tx+sg*150+20, G-650); nadel(c, tx+sg*150, G-720, 46, G-790)
    c.rect(tx-110, G-860, tx+110, G-660); uhr2(c, tx, G-760, 70)
    c.rect(tx-90, G-1000, tx+90, G-860)
    for i in range(3): bogen(c, tx-56 + i*56, G-880, 14, 70)
    c.rect(tx-104, G-1012, tx+104, G-996)
    c.add([(tx-80, G-1010), (tx+80, G-1010), (tx+12, G-1400), (tx-12, G-1400)])
    for y in range(int(G-1060), int(G-1340), -70): c.rect(tx-70 + (G-1010-y)*.17, y-6, tx+70 - (G-1010-y)*.17, y, 0)
    stern(c, tx, G-1450, 50)
    # Basilius-Kathedrale: Zeltdach in der Mitte, Zwiebeltürme rundum
    bx = 2300
    c.rect(bx-520, G-280, bx+520, G); c.rect(bx-560, G-60, bx+560, G)
    for i in range(10): bogen(c, bx-450 + i*100, G-60, 24, 80)
    c.rect(bx-90, G-720, bx+90, G-280); c.rect(bx-110, G-740, bx+110, G-716)
    for i in range(3): bogen(c, bx-50 + i*50, G-760 + 120, 12, 70)
    c.add([(bx-90, G-736), (bx+90, G-736), (bx+18, G-1180), (bx-18, G-1180)])
    for y in range(int(G-790), int(G-1130), -60): c.cut([(bx - 6, y-22), (bx + 6, y-22), (bx + 6, y), (bx - 6, y)])
    for k in range(4):
        y = G-800 - k*90; ww = 90 - k*16
        for d in (-1, 1): c.circ(bx + d*ww*.5, y, 10, 0)
    zwiebel(c, bx, G-1176, 34, 80); c.rect(bx-3, G-1310, bx+3, G-1250); c.rect(bx-18, G-1290, bx+18, G-1284)
    for dx, h, r, zh in [(-400, 300, 70, 150), (400, 300, 70, 150), (-250, 380, 86, 180), (250, 380, 86, 180), (-480, 190, 52, 110), (480, 200, 56, 120)]:
        zw_turm(c, bx+dx, G-280, r*1.3, h, r, zh)
    # Glockenturm rechts
    gx = 3050; c.rect(gx-70, G-520, gx+70, G); bogen(c, gx, G-420, 26, 80)
    c.add([(gx-70, G-520), (gx+70, G-520), (gx+14, G-820), (gx-14, G-820)]); zwiebel(c, gx, G-816, 22, 54); c.rect(gx-3, G-920, gx+3, G-860)
    c.rect(0, G, 3400, G+50)
    return c

def giebelhaus(c, x, w, h, G, typ, dh):
    """Grachtenhaus mit Treppen-, Hals-, Glocken- oder Spitzgiebel, Fenstern und Hijsbalk."""
    c.rect(x, G-h, x+w, G); y = G-h
    if typ == 'treppe':
        n = 4
        for i in range(n): f = i/(n*2+.6); c.rect(x + w*f, y - dh*(i+1)/n, x + w - w*f, y - dh*i/n + 1)
    elif typ == 'hals':
        c.add([(x, y+1), (x+w, y+1), (x+w*.86, y - dh*.2), (x+w*.72, y - dh*.24), (x+w*.72, y - dh*.8), (x+w/2, y - dh), (x+w*.28, y - dh*.8), (x+w*.28, y - dh*.24), (x+w*.14, y - dh*.2)])
        for sg in (-1, 1): c.circ(x + w/2 + sg*w*.3, y - dh*.24, w*.07)
    elif typ == 'glocke':
        c.add(glatt([(x, y+1), (x+w*.06, y - dh*.2), (x+w*.2, y - dh*.35), (x+w*.24, y - dh*.75), (x+w/2, y - dh), (x+w*.76, y - dh*.75), (x+w*.8, y - dh*.35), (x+w*.94, y - dh*.2), (x+w, y+1)], 6))
    else:
        c.add([(x-4, y+1), (x+w+4, y+1), (x+w/2, y - dh)])
    c.rect(x + w/2 - 4, y - dh*.62, x + w/2 + 4, y - dh*.42); c.rect(x + w/2 + 2, y - dh*.58, x + w/2 + 34, y - dh*.52)
    c.rect(x + w*.38, y - dh*.38, x + w*.62, y - dh*.12, 0)
    fenster(c, x + 14, y + 30, x + w - 14, G - 120, 3 if w > 150 else 2, max(3, int(h/120)), w*.16, 54)
    c.rect(x + w*.4, G - 100, x + w*.6, G, 0); c.rect(x + w*.36, G - 112, x + w*.64, G - 100)

def fahrrad(c, x, y, s):
    for dx in (-.35, .35): c.circ(x + dx*s, y - s*.2, s*.2); c.circ(x + dx*s, y - s*.2, s*.16, 0)
    for p, q in [((-.35, .2), (0, .2)), ((0, .2), (.15, .55)), ((-.1, .55), (.35, .55)), ((.35, .2), (.3, .6)), ((-.35, .2), (-.1, .55)), ((0, .2), (-.1, .6))]:
        linie(c, (x + p[0]*s, y - p[1]*s), (x + q[0]*s, y - q[1]*s), s*.05)
    c.rect(x - .18*s, y - .64*s, x - .02*s, y - .6*s); c.rect(x + .24*s, y - .64*s, x + .36*s, y - .6*s)

def s_amsterdam():
    c = C(3400, 1900); G = 1350
    # Westerkerk-Turm hinten
    hg = c; wx = 2500
    c.rect(wx-90, G-820, wx+90, G); c.rect(wx-74, G-980, wx+74, G-820); uhr2(c, wx, G-900, 46)
    c.rect(wx-56, G-1100, wx+56, G-980); c.rect(wx-40, G-1200, wx+40, G-1100)
    kuppel(c, wx, G-1200, 46, 60, False); c.rect(wx-4, G-1340, wx+4, G-1250); kreuz(c, wx, G-1340, 40)
    c = ebene(hg)
    rnd = random.Random(44); x = 20; typen = ['treppe', 'hals', 'glocke', 'spitz', 'hals', 'treppe', 'glocke']
    while x < 3360:
        w = rnd.randint(150, 210); h = rnd.randint(520, 720)
        giebelhaus(c, x, w, h, G, typen[int(x/170) % len(typen)], rnd.randint(150, 220)); x += w + 6
    auflegen(hg, c, 12); c = hg
    # Kai, Bäume, Gracht, Brücke, Velos, Hausboot
    c.rect(0, G, 3400, G+40)
    v = ebene(c)
    for x_ in (200, 1000, 2900): laubbaum(v, x_, G, 420, 170, x_)
    auflegen(c, v, 10)
    rnd = random.Random(12)
    for y in range(G+120, G+460, 64):
        for k in range(0, 3400, 300): a = k + rnd.randint(-60, 80); wellen(c, y, a, a + rnd.randint(140, 220), 8, 100, 8, 255)
    bx0, bx1 = 1450, 2350; mid = (bx0+bx1)/2
    c.add([(bx0-80, G), (bx1+80, G), (bx1, G+60), (bx0, G+60)])
    c.add([(bx0, G+40), (bx1, G+40), (bx1, G+330), (bx0, G+330)])
    c.cut([(mid + 300*math.cos(math.pi*k/30), G+330 - 230*math.sin(math.pi*k/30)) for k in range(31)])
    for sg in (-1, 1): c.cut([(mid + sg*400 + 70*math.cos(math.pi*k/20), G+330 - 120*math.sin(math.pi*k/20)) for k in range(21)])
    c.rect(bx0-80, G-70, bx1+80, G-60)
    for x_ in range(bx0-70, bx1+80, 50): c.rect(x_, G-70, x_+8, G)
    for x_ in (bx0+200, mid+40, bx1-180): fahrrad(c, x_, G, 150)
    hb = 500; c.rect(hb-260, G+250, hb+260, G+330); c.rect(hb-200, G+150, hb+120, G+250); c.add([(hb-220, G+150), (hb+140, G+150), (hb-40, G+90)])
    for i in range(3): c.rect(hb-170 + i*90, G+180, hb-130 + i*90, G+220, 0)
    return c

def s_wien():
    c = C(3400, 2000); G = 1750
    # Stephansdom: hohes Steildach, Südturm mit gotischem Helm, Nordturm mit Renaissancehaube
    sx = 700
    c.rect(sx-200, G-380, sx+560, G)
    c.add([(sx-200, G-380), (sx+560, G-380), (sx+480, G-740), (sx-120, G-740)])
    for k in range(6):
        for j in range(3): c.cut([(sx-100 + k*100 + j*30, G-450 - j*90), (sx-80 + k*100 + j*30, G-470 - j*90), (sx-60 + k*100 + j*30, G-450 - j*90), (sx-80 + k*100 + j*30, G-430 - j*90)])
    tx = sx+260; c.rect(tx-120, G-900, tx+120, G-380)
    masswerk(c, tx-90, G-860, tx+90, G-420, 2)
    c.rect(tx-100, G-1060, tx+100, G-900)
    helm_gotisch(c, tx, G-1056, 200, 680, 10, True, True)
    nx = sx-260; c.rect(nx-110, G-700, nx+110, G); masswerk(c, nx-80, G-660, nx+80, G-340, 2)
    c.rect(nx-90, G-760, nx+90, G-700); kuppel(c, nx, G-760, 90, 80, True)
    c.rect(sx-130, G-520, sx-100, G-380); c.rect(sx-130, G-560, sx+40, G-500)
    for x_ in range(sx-60, sx+40, 60): nadel(c, x_, G-560, 50, G-640)
    # Karlskirche: Portikus, zwei Triumphsäulen, ovale Kuppel
    kx = 1850
    c.rect(kx-460, G-300, kx+460, G); c.rect(kx-200, G-460, kx+200, G-300)
    c.add([(kx-220, G-460), (kx+220, G-460), (kx, G-560)]); c.rect(kx-160, G-450, kx+160, G-440, 0)
    for i in range(6): c.rect(kx-175 + i*66, G-430, kx-155 + i*66, G-40, 0)
    for sg in (-1, 1):
        cx_ = kx + sg*320; c.rect(cx_-46, G-780, cx_+46, G-260); c.rect(cx_-58, G-800, cx_+58, G-776)
        for k in range(9): strich(c, [(cx_-44, G-300 - k*52), (cx_+44, G-330 - k*52)], 5, 5, 0)
        c.rect(cx_-30, G-860, cx_+30, G-800); kuppel(c, cx_, G-860, 30, 40, False); c.rect(cx_-3, G-940, cx_+3, G-890)
        c.rect(kx + sg*460 - sg*120 - 60, G-420, kx + sg*460 - sg*120 + 60, G-300); c.add([(kx + sg*400 - 70, G-420), (kx + sg*400 + 70, G-420), (kx + sg*400, G-470)]) if False else None
    c.rect(kx-200, G-640, kx+200, G-460)
    for i in range(5): bogen(c, kx-140 + i*70, G-490, 16, 90)
    kuppel(c, kx, G-640, 210, 300, False); c.rect(kx-36, G-1010, kx+36, G-930); kuppel(c, kx, G-1010, 36, 50, False)
    c.rect(kx-4, G-1120, kx+4, G-1050); kreuz(c, kx, G-1110, 50)
    # Riesenrad im Prater
    rx, ry, R = 2850, G-560, 500
    c.add([(rx-300, G), (rx-240, G), (rx+10, ry), (rx-10, ry)]); c.add([(rx+240, G), (rx+300, G), (rx+10, ry), (rx-10, ry)])
    c.rect(rx-330, G-30, rx+330, G)
    c.circ(rx, ry, R); c.circ(rx, ry, R-20, 0); c.circ(rx, ry, R-60); c.circ(rx, ry, R-74, 0)
    for k in range(30):
        a = 2*math.pi*k/30; linie(c, (rx, ry), (rx + math.cos(a)*(R-10), ry + math.sin(a)*(R-10)), 5)
    for sg in (-1, 1): linie(c, (rx-270 + sg*0, G), (rx, ry), 14) if sg < 0 else linie(c, (rx+270, G), (rx, ry), 14)
    c.circ(rx, ry, 36)
    for k in range(15):
        a = 2*math.pi*k/15 + .1; px, py = rx + math.cos(a)*R, ry + math.sin(a)*R
        c.rect(px-4, py, px+4, py+20); c.rect(px-46, py+20, px+46, py+80); c.rect(px-38, py+30, px+38, py+56, 0)
        for j in range(3): c.rect(px-36 + j*26, py+30, px-30 + j*26, py+56)
    v = ebene(c)
    for x_, h, r in [(120, 300, 130), (1180, 260, 120), (2250, 300, 130), (3350, 280, 120)]: laubbaum(v, x_, G, h, r, x_)
    v.rect(0, G, 3400, G+50); auflegen(c, v, 12)
    return c

def oelbaum(c, cx, G, h, r, seed=1):
    """Olivenbaum: kurzer, knorriger Stamm, runde, lockere Krone aus Büscheln."""
    rnd = random.Random(seed); ky = G - h*.68
    strich(c, [(cx, G), (cx + r*.06, G - h*.2), (cx - r*.08, G - h*.4), (cx, ky)], r*.2, r*.11, 255)
    strich(c, [(cx - r*.04, G - h*.38), (cx - r*.32, ky + r*.1)], r*.1, r*.06, 255)
    strich(c, [(cx + r*.02, G - h*.45), (cx + r*.36, ky + r*.05)], r*.1, r*.06, 255)
    for k in range(14):
        a = rnd.random()*2*math.pi; d = rnd.random()**.5
        c.circ(cx + math.cos(a)*r*.75*d, ky - r*.12 + math.sin(a)*r*.38*d, r*(.2 + rnd.random()*.1))
    for k in range(5):
        a = math.pi + math.pi*k/4; c.circ(cx + math.cos(a)*r*.82, ky - r*.12 + math.sin(a)*r*.4, r*.17)

def tempel(c, x0, x1, fuss, h, n, giebel=True):
    """Dorischer Tempel: Stufen, Säulen mit leichter Verjüngung, Gebälk, Giebel."""
    for i in range(3): c.rect(x0 - 30 + i*10, fuss - (i+1)*18, x1 + 30 - i*10, fuss - i*18)
    y = fuss - 54; ht = h*.72; sw = (x1-x0)/(n*1.75 - .75)
    for i in range(n):
        sx = x0 + i*sw*1.75; c.add([(sx, y), (sx+sw, y), (sx+sw*.9, y-ht), (sx+sw*.1, y-ht)]); c.rect(sx-6, y-ht-14, sx+sw+6, y-ht)
        for j in range(1, 3): c.rect(sx + sw*j/3 - 2, y - ht + 20, sx + sw*j/3 + 2, y - 10, 0)
    ye = y - ht - 14; c.rect(x0-10, ye - h*.2, x1+10, ye); c.rect(x0-10, ye - h*.13, x1+10, ye - h*.12, 0)
    for k in range(int((x1-x0)/60)): c.rect(x0 + k*60 + 10, ye - h*.11, x0 + k*60 + 26, ye - h*.02, 0)
    if giebel: c.add([(x0-20, ye - h*.2), (x1+20, ye - h*.2), ((x0+x1)/2, ye - h*.2 - (x1-x0)*.16)])

def s_athen():
    c = C(3400, 1900); G = 1700
    fels_ = [(200, G), (400, G-200), (600, G-360), (700, G-480), (760, G-560), (1000, G-590), (1900, G-600), (2300, G-580), (2420, G-520), (2560, G-380), (2800, G-180), (3100, G)]
    bergzug(c, fels_, G, .08, 8, 1, 4)
    T = G - 596
    # Parthenon (Frontansicht, Giebel leicht beschädigt)
    tempel(c, 1150, 1950, T, 380, 8)
    c.cut([(1700, T-54-380*.72-14-76 - 128), (1760, T-54-380*.72-14-76 - 80), (1840, T-54-380*.72-14-76 - 50), (1950, T-54-380*.72-14-76 - 20), (1950, T-54-380*.72-14-76 - 128)])
    # Erechtheion mit Koren
    e0 = 2050; c.rect(e0, T-220, e0+260, T); c.rect(e0-10, T-240, e0+270, T-220); c.add([(e0-10, T-240), (e0+270, T-240), (e0+130, T-290)])
    for i in range(4): c.rect(e0+20 + i*62, T-200, e0+40 + i*62, T-20, 0)
    # Propyläen
    tempel(c, 820, 1060, T, 220, 4, False)
    # Lykabettus mit Kapelle rechts hinten
    v = ebene(c)
    for x_, h, r in [(250, 380, 200), (620, 300, 160), (2700, 340, 180), (3100, 400, 210)]: oelbaum(v, x_, G, h, r, x_)
    for x_ in (420, 2900): zypresse(v, x_, G, 420, 70)
    v.rect(0, G, 3400, G+50); auflegen(c, v, 12)
    return c

def kamel(c, x, G, s, reiter=True):
    """Dromedar im Profil (Kopf rechts), ein Höcker, langer Hals, Beine mit Knie."""
    c.add(glatt([(x - s*.48, G - s*.6), (x - s*.4, G - s*.72), (x - s*.22, G - s*.86), (x - s*.06, G - s*1.0), (x + s*.1, G - s*.92),
                 (x + s*.24, G - s*.76), (x + s*.36, G - s*.7), (x + s*.46, G - s*.78), (x + s*.52, G - s*.96), (x + s*.58, G - s*1.06),
                 (x + s*.68, G - s*1.08), (x + s*.78, G - s*1.02), (x + s*.8, G - s*.97), (x + s*.7, G - s*.95), (x + s*.62, G - s*.92),
                 (x + s*.58, G - s*.78), (x + s*.5, G - s*.62), (x + s*.38, G - s*.5), (x + s*.2, G - s*.46), (x - s*.3, G - s*.48), (x - s*.46, G - s*.52)], 3))
    c.circ(x + s*.6, G - s*1.09, s*.025)
    for x0, k in [(-.36, -.015), (-.26, .015), (.2, -.015), (.3, .015)]:
        strich(c, [(x + x0*s, G - s*.5), (x + (x0 + k)*s, G - s*.26), (x + x0*s, G - s*.02)], s*.085, s*.055, 255)
        c.rect(x + x0*s - s*.04, G - s*.03, x + x0*s + s*.05, G)
    strich(c, [(x - s*.47, G - s*.58), (x - s*.53, G - s*.38)], s*.03, s*.015, 255)
    if reiter:
        rx = x - s*.08
        c.add([(rx - s*.12, G - s*.9), (rx + s*.1, G - s*.9), (rx + s*.06, G - s*1.25), (rx - s*.08, G - s*1.25)])
        c.circ(rx, G - s*1.32, s*.075)
        c.add([(rx - s*.1, G - s*1.33), (rx + s*.08, G - s*1.36), (rx + s*.02, G - s*1.44), (rx - s*.08, G - s*1.42), (rx - s*.2, G - s*1.22)])
        strich(c, [(rx + s*.04, G - s*1.18), (rx + s*.2, G - s*1.04), (rx + s*.5, G - s*.92)], s*.035, s*.02, 255)
        strich(c, [(rx - s*.02, G - s*.92), (rx + s*.06, G - s*.74)], s*.06, s*.04, 255)

def sphinx(c, x, G, s):
    """Liegender Löwenleib mit Pharaonenkopf (Nemes-Kopftuch), Pranken nach links."""
    c.add(glatt([(x - s, G), (x - s, G - s*.08), (x - s*.7, G - s*.1), (x - s*.58, G - s*.16), (x - s*.5, G - s*.34),
                 (x - s*.2, G - s*.36), (x + s*.3, G - s*.32), (x + s*.62, G - s*.36), (x + s*.82, G - s*.3), (x + s*.92, G - s*.14), (x + s*.95, G)], 2))
    c.add([(x - s*.62, G - s*.3), (x - s*.58, G - s*.56), (x - s*.6, G - s*.66), (x - s*.5, G - s*.78), (x - s*.36, G - s*.78),
           (x - s*.3, G - s*.66), (x - s*.24, G - s*.36), (x - s*.5, G - s*.3)])
    c.rect(x - s*.62, G - s*.6, x - s*.57, G - s*.58, 0)
    for k in range(4): c.rect(x - s*.33 + k*s*.02, G - s*.62 + k*s*.07, x - s*.3 + k*s*.02, G - s*.58 + k*s*.07, 0)
    c.rect(x - s*.95, G - s*.05, x - s*.62, G - s*.04, 0)

def pyramide(c, cx, G, b, h, kappe=False, kante=.18):
    c.add([(cx - b/2, G), (cx + b/2, G), (cx, G - h)])
    k = cx + b*kante; strich(c, [(cx, G - h + 30), (k, G)], 6, 10, 0)
    if kappe: c.add([(cx - b*.1, G - h + h*.2 + 4), (cx + b*.1, G - h + h*.2 + 4), (cx + b*.1 - 6, G - h + h*.2 - 4), (cx - b*.1 + 6, G - h + h*.2 - 4)], 0)

def s_pyramiden():
    c = C(3400, 1900); G = 1600
    hg = c; pyramide(c, 2250, G, 1000, 640, False, .14)
    c = ebene(hg); pyramide(c, 1400, G, 1350, 860, True, .16); auflegen(hg, c, 14); c = hg
    c = ebene(hg); pyramide(c, 560, G, 900, 560, False, .2)
    auflegen(hg, c, 14); c = hg
    v = ebene(c)
    v.add(glatt([(0, G+30), (500, G-10), (1100, G+20), (1800, G-20), (2600, G+10), (3400, G-10)], 5) + [(3400, G+300), (0, G+300)])
    sphinx(v, 980, G+10, 380)
    for x_, h, n, sd in [(150, 460, .2, 1), (290, 380, -.25, 2), (3330, 440, -.2, 3)]: palme(v, x_, G+10, h, n, sd)
    kamel(v, 2960, G+20, 340)
    auflegen(c, v, 12)
    return c

def schlankturm(c, cx, fuss, w, h, dh, kranz=True):
    c.rect(cx-w/2, fuss-h, cx+w/2, fuss)
    if kranz: c.rect(cx-w/2-10, fuss-h-4, cx+w/2+10, fuss-h+16)
    c.add([(cx-w/2-12, fuss-h), (cx+w/2+12, fuss-h), (cx, fuss-h-dh)]); c.rect(cx-2, fuss-h-dh-40, cx+2, fuss-h-dh+4)
    for y in (fuss - h*.3, fuss - h*.6, fuss - h*.85): bogen(c, cx, y, w*.14, w*.4)

def s_schloss():
    c = C(3200, 2100); G = 1900
    bergzug(c, [(0, G-500), (300, G-700), (500, G-860), (700, G-760), (1000, G-920), (1300, G-1000), (1500, G-880), (1800, G-760), (2200, G-940), (2600, G-1060), (2900, G-860), (3200, G-700)], G, .18, 21, 1, 5)
    hg = c; c = ebene(hg)
    fels_ = [(500, G), (700, G-300), (900, G-520), (1100, G-640), (1500, G-680), (2000, G-660), (2300, G-560), (2500, G-360), (2700, G)]
    bergzug(c, fels_, G, .12, 5, 1, 4); T = G - 650
    # Palas: hoher Bau mit Steildach und Ziergiebeln
    c.rect(1500, T-640, 1950, T); c.add([(1490, T-640), (1960, T-640), (1910, T-820), (1540, T-820)])
    for x_ in (1560, 1650, 1740, 1830):
        for y in (T-560, T-420, T-280): bogen(c, x_+20, y, 14, 60)
    for gx in (1620, 1830): c.add([(gx-60, T-640), (gx+60, T-640), (gx+60, T-700), (gx, T-780), (gx-60, T-700)])
    # Haupt- und Nebentürme
    schlankturm(c, 1990, T, 120, 900, 300); schlankturm(c, 2090, T, 70, 760, 200)
    schlankturm(c, 1440, T, 100, 760, 240); schlankturm(c, 1350, T, 70, 560, 180)
    c.rect(1150, T-360, 1450, T); c.add([(1140, T-360), (1460, T-360), (1420, T-460), (1180, T-460)])
    schlankturm(c, 1180, T, 80, 520, 180)
    c.rect(1980, T-320, 2300, T); zinnen(c, 1980, 2300, T-320, 18); schlankturm(c, 2260, T, 80, 480, 170)
    bogen(c, 1300, T, 40, 120)
    auflegen(hg, c, 14); c = hg
    v = ebene(c)
    for x_ in range(80, 3200, 110):
        if 640 < x_ < 2560: continue
        tanne(v, x_, G+30, 260 + (x_*37 % 140), 120)
    v.rect(0, G, 3200, G+40); auflegen(c, v, 10)
    return c
def s_munot():
    """Schaffhausen: Munot über den Dächern der Altstadt, Ansicht von Südwesten (nach Fotos gezeichnet)."""
    c = C(3000, 1800); G = 1700; H = 1080; T = 760; L = 1000; R = 2450   # Rundbau breit und niedrig
    c.add(glatt([(0, G-190), (300, G-250), (700, H+170), (950, H+30), (2500, H+30), (2800, H+230), (3000, G-200)], 8) + [(3000, G), (0, G)])
    # Rundbau: breit, flache Krone mit Gesims
    c.add([(L, H+80), (L, T+24), (R-14, T+24), (R, T+60), (R, H+80)])
    c.rect(L-10, T-6, R-4, T+26)
    # Treppenturm: nur wenig höher als der Rundbau, Galerie, Zeltdach, Laterne, Helmstange mit Knauf
    c.rect(L-100, T-150, L+100, H+80); c.rect(L-118, T-168, L+118, T-132)
    c.add([(L-132, T-162), (L+132, T-162), (L+18, T-330), (L-18, T-330)])
    c.rect(L-18, T-375, L+18, T-322); c.add([(L-30, T-371), (L+30, T-371), (L, T-410)])
    c.rect(L-3, T-470, L+3, T-406); c.circ(L, T-442, 11)
    # Wehrgang zum Turm hin, Fahne auf dem Rundbau
    c.add([(L-290, H+140), (L-100, H-140), (L-100, H+80)])
    c.rect(R-133, T-170, R-127, T); c.add([(R-127, T-170), (R-35, T-158), (R-40, T-110), (R-127, T-118)])
    # Bäume am Hang, Wachtturm rechts
    for x_, y_, r in [(2560, H-10, 95), (2650, H-90, 115), (2750, H, 90), (2630, H+60, 90), (440, H+250, 80), (540, H+180, 100), (650, H+220, 75)]:
        c.circ(x_, y_, r)
    c.rect(2860, H+60, 2940, H+330); c.add([(2850, H+60), (2950, H+60), (2900, H-20)])
    # Altstadtdächer vorne, mit Kaminen
    x = -20
    for w, h, d in [(200, 250, 'sattel'), (170, 290, 'walm'), (230, 240, 'sattel'), (180, 300, 'sattel'), (210, 260, 'walm')]:
        haus(c, x, w, h, G, d, dh=w*.55); c.rect(x+w*.7, G-h-w*.5, x+w*.7+22, G-h-w*.2); x += w
    x = 2420
    for w, h, d in [(190, 300, 'sattel'), (220, 250, 'walm'), (200, 290, 'sattel')]:
        haus(c, x, w, h, G, d, dh=w*.55); c.rect(x+w*.25, G-h-w*.5, x+w*.25+22, G-h-w*.2); x += w
    return c
STAEDTE = {
    'stadt-zuerich': s_zuerich, 'stadt-bern': s_bern, 'stadt-basel': s_basel, 'stadt-luzern': s_luzern, 'stadt-genf': s_genf,
    'stadt-paris': s_paris, 'stadt-newyork': s_newyork, 'stadt-london': s_london, 'stadt-rom': s_rom, 'stadt-berlin': s_berlin,
     'stadt-pisa': s_pisa, 'stadt-dorf-kirche': s_dorf, 'stadt-hochhaeuser': s_hochhaeuser,
    'stadt-burg': s_burg, 'stadt-muehlen': s_muehlen, 'stadt-tokio': s_tokio, 'stadt-dubai': s_dubai, 'stadt-venedig': s_venedig,
    'stadt-moskau': s_moskau, 'stadt-amsterdam': s_amsterdam, 'stadt-wien': s_wien, 'stadt-athen': s_athen,
    'stadt-pyramiden': s_pyramiden, 'stadt-schloss': s_schloss,
    'stadt-wm-schaffhausen-munot': s_munot,
}
ALLE = {**BERGE, **STAEDTE}

if __name__ == '__main__':
    ids = sys.argv[1:] or list(ALLE)
    os.makedirs(BILDER, exist_ok=True)
    for i in ids:
        ALLE[i]().save(i); print('ok', i)
