"""Vorlagen aus Bildern (Schrittli): aus einem PNG/WebP/JPG mit hellem oder durchsichtigem Hintergrund werden
Umriss (Schnittlinie), die verlustfreie Originalgrafik (zum farbigen Drucken) und vereinfachte Grenzen
zwischen den Farben (Innenlinien zum Anmalen) gewonnen. Intern enthalten `farben` die Farbringe;
exportiert werden die Palette [{f:'#rrggbb'}] und `original` mit Dateiname und geometrischer Position.

Die Motive stehen in figuren.json ({welten:[…], figuren:[{id, name, welt, datei, k?, glatt?}]}); die Bilder liegen in
bilder/. Geschrieben wird nach vorlagen/figuren/:
  index.js        window.FIGUREN_INDEX – nur Name, Welt, Masse je Figur (klein, wird immer geladen)
  <welt>.js       FIGUREN_DAZU('<welt>', […]) – die ganzen Formen einer Welt, lädt der Generator erst bei Bedarf
  bilder/<id>.webp  Vorschaubild für die Auswahl
  originale/<id>.webp  Verlustfreie freigestellte Farbvorlage
k  = Anzahl Farben inkl. Schwarz (fehlt: aus dem Bild geschätzt), glatt = Rundung (0 = eckig lassen wie bei Pixelbildern).

Aufruf: python -I bild.py                 – alle Figuren (parallel)
        python -I bild.py <id> [<id> …]   – nur diese Figuren neu rechnen, die übrigen bleiben wie sie sind
        python -I bild.py --datei <bild> [<Farben>] [<glatt>]  – ein einzelnes Bild probieren, schreibt nur ein Vorschaubild"""
import os, sys, json, re, unicodedata
HIER = os.path.dirname(os.path.abspath(__file__))
if HIER not in sys.path: sys.path.insert(0, HIER)                    # zeichnen.py auch beim Aufruf mit -I finden
for _v in ('OMP_NUM_THREADS', 'OPENBLAS_NUM_THREADS', 'MKL_NUM_THREADS'): os.environ.setdefault(_v, '1')   # sonst reserviert jeder Prozess ~1 GB
import numpy as np, cv2
from scipy import ndimage
from shapely.geometry import LinearRing, Polygon, MultiPolygon, LineString, MultiLineString
from shapely.ops import unary_union, linemerge
from shapely import affinity
from shapely.geometry.polygon import orient
from zeichnen import schmalste, schwierigkeit

LISTE = os.path.join(HIER, 'figuren.json')
BILDER = os.path.join(HIER, 'bilder')
ZIEL = os.path.normpath(os.path.join(HIER, '..', '..', 'vorlagen', 'figuren'))
GLATT = .12


def laden(pfad, alle_teile=True):
    """Bild → RGB (float) und Maske der Figur (True = gehört dazu)."""
    cv2.setRNGSeed(42)
    im = cv2.imread(pfad, cv2.IMREAD_UNCHANGED)
    if im is None: raise SystemExit(f'kann {pfad} nicht lesen')
    if im.ndim == 2: im = cv2.cvtColor(im, cv2.COLOR_GRAY2BGR)
    if im.shape[2] == 4 and im[:, :, 3].min() < 128:
        maske = im[:, :, 3] >= 128                                  # echte Transparenz
        rgb = im[:, :, 2::-1].copy(); rgb[~maske] = 255
    else:
        rgb = im[:, :, 2::-1].copy()
        # Hintergrund = Farbe(n) am Bildrand: eine einfarbige Fläche oder ein Schachbrett-Transparenzmuster (zwei helle
        # Farben). Nur Pixel nahe an diesen Farben zählen als Hintergrund, damit Weisses in der Figur (Handschuhe,
        # Augen) nicht mit weggeflutet wird, wenn der Hintergrund fast weiss ist.
        rand = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]]).astype(np.float32)
        krit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, .5)
        _, et, z = cv2.kmeans(rand, 2, None, krit, 3, cv2.KMEANS_PP_CENTERS)
        anteil = np.bincount(et.ravel(), minlength=2)/len(et)
        if anteil.min() > .1 and z.min() > 170 and np.abs(z[0] - z[1]).max() > 15:
            farben, tol = z, 28                                        # Schachbrett
        else:
            i = int(anteil.argmax()); farben = z[i:i + 1]
            tol = float(np.clip(4*rand[et.ravel() == i].std(0).max(), 6, 30))
        nahe = np.zeros(rgb.shape[:2], bool)
        for c in farben: nahe |= np.abs(rgb.astype(np.float32) - c).max(2) <= tol
        # Dünne Fühler und Schnurrhaare dürfen nicht als Hintergrund geschlossen werden.
        nahe = nahe.astype(np.uint8)
        h, w = nahe.shape; ff = np.zeros((h + 2, w + 2), np.uint8)
        saum = [(0, x) for x in range(0, w, 8)] + [(h - 1, x) for x in range(0, w, 8)] + [(y, 0) for y in range(0, h, 8)] + [(y, w - 1) for y in range(0, h, 8)]
        for y, x in saum:
            if nahe[y, x] and not ff[y + 1, x + 1]: cv2.floodFill(nahe.copy(), ff, (x, y), 2)
        maske = ~(ff[1:-1, 1:-1] > 0)
    # Auch getrennte Motivteile gehören zur Vorlage, z.B. die Spitze des Dango-Spiesses.
    # Nur einzelne Staubpixel entfernen; kein Öffnen, das dünne Striche verschluckt.
    lab, n = ndimage.label(maske, np.ones((3, 3), np.uint8))
    if n > 1:
        gr = np.bincount(lab.ravel()); gr[0] = 0
        if alle_teile:
            maske = np.isin(lab, np.flatnonzero(gr >= max(3, maske.sum()*.00001)))
        else:
            maske = lab == gr.argmax()
    return rgb.astype(np.float32), maske


def polygone(binaer, skala, ursprung):
    """Binärbild → Liste von Shapely-Polygonen (mit Löchern) in 100er-Einheiten, y nach unten."""
    konturen, hier = cv2.findContours(binaer.astype(np.uint8), cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)
    if hier is None: return []
    hier = hier[0]; ox, oy = ursprung
    pts = lambda k: [((x + .5 - ox)*skala, (y + .5 - oy)*skala) for x, y in k[:, 0, :]]
    out = []
    for i, k in enumerate(konturen):
        if hier[i][3] != -1 or len(k) < 3: continue                   # nur äussere Ringe
        loecher = []
        j = hier[i][2]
        while j != -1:
            if len(konturen[j]) >= 3: loecher.append(pts(konturen[j]))
            j = hier[j][0]
        p = Polygon(pts(k), loecher).buffer(0)
        if not p.is_empty: out.extend(getattr(p, 'geoms', [p]))
    return out


def runden(pts, n=2):
    """Chaikin: Ecken eines geschlossenen Rings abschneiden → weiche Kurve statt Knicke."""
    p = np.asarray(pts, float)
    for _ in range(n):
        q = np.roll(p, -1, 0)
        n2 = np.empty((2*len(p), 2)); n2[0::2] = .75*p + .25*q; n2[1::2] = .25*p + .75*q
        p = n2
    return p


def ring_koord(r, tol, rund=True):
    """LinearRing → vereinfachen, runden, Kleinstzacken weg, auf 2 Stellen."""
    pts = np.asarray(r.coords)[:-1]
    if tol: pts = np.asarray(LinearRing(pts).simplify(tol, preserve_topology=True).coords)[:-1]
    if rund and len(pts) >= 3:                                        # Pixelfiguren (glatt=0) behalten ihre Ecken
        pts = runden(pts, 2)
        pts = np.asarray(LinearRing(pts).simplify(tol*.4 if tol else .05, preserve_topology=True).coords)[:-1]
    return [[round(x, 2), round(y, 2)] for x, y in pts]


def ringe(g, tol, rund=True):
    """Polygon → Ringe [[x,y],…] (aussen, dann Löcher), vereinfacht und gerundet."""
    if g.is_empty: return []
    if g.geom_type == 'MultiPolygon': return [r for p in g.geoms for r in ringe(p, tol, rund)]
    if g.geom_type != 'Polygon': return []
    if g.interiors: g = orient(g)
    return [ring_koord(r, tol, rund) for r in [g.exterior, *g.interiors]]


def quantisieren(rgb, maske, k, glatt):
    """Farben in der Figur auf k Farben reduzieren. Gibt (etik_farbe, etik_linien, palette, schwarz_index) zurück:
    etik_farbe  – Etiketten fürs farbige Zeichnen (−1 = aussen); schwarze Umrisslinien sind eine eigene Farbe (Index
                  schwarz_index, None wenn das Bild keine hat) und werden NICHT weggeputzt, damit die Vorlage wie das
                  Original schwarz umrandete Flächen hat.
    etik_linien – gleiche Etiketten, aber dünne schwarze Linien der Nachbarfarbe zugeschlagen: daraus werden die
                  Innenlinien (det) gerechnet, die dann in der Mitte der Linie liegen statt doppelt an ihren Rändern."""
    bild = rgb.astype(np.uint8)
    if glatt: bild = cv2.bilateralFilter(bild, 5, 25, 3)
    lab = cv2.cvtColor(bild, cv2.COLOR_RGB2LAB).astype(np.float32)
    flaeche = maske.sum()
    # Schwarz: dunkel und farblos (L < 35 von 100, wenig Buntheit) – Umrisslinien, Augen, Schnauz
    chroma = np.hypot(lab[..., 1] - 128, lab[..., 2] - 128)
    schwarz = maske & (lab[..., 0] < 35) & (chroma < 15)
    lab_s, ns = ndimage.label(schwarz)
    if ns:
        gr = np.bincount(lab_s.ravel()); gr[0] = 0
        schwarz = np.isin(lab_s, np.nonzero(gr >= 2)[0])
    hat_schwarz = bool(schwarz.any())
    if hat_schwarz and (maske & ~schwarz).sum() < flaeche*.01:     # ganz schwarze Silhouette: eine Farbe, keine Linien
        schwarz[:] = False; hat_schwarz = False; k = 1
    kk = max(1, k - 1) if hat_schwarz else k
    rest = maske & ~schwarz
    daten = lab[rest]
    krit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, .5)
    _, et, zentren = cv2.kmeans(daten, kk, None, krit, 5, cv2.KMEANS_PP_CENTERS)
    etik = np.full(maske.shape, -1, np.int32); etik[rest] = et.ravel()
    palette = list(cv2.cvtColor(zentren.reshape(1, -1, 3).astype(np.uint8), cv2.COLOR_LAB2RGB)[0])
    si = None
    if hat_schwarz:
        si = kk; etik[schwarz] = si
        palette.append(np.clip(rgb[schwarz].mean(0), 0, 40).astype(np.uint8))   # fast schwarz, Mittel der Linienpixel
    palette = np.array(palette)
    # Augen, Sommersprossen und Farbakzente erhalten; nur einzelne Pixel bereinigen.
    gueltig = np.zeros_like(maske)
    for i in range(kk):
        m = etik == i
        lab_i, n = ndimage.label(m)
        if n:
            gr = np.bincount(lab_i.ravel()); gr[0] = 0
            m = np.isin(lab_i, np.nonzero(gr >= 2)[0])
        gueltig |= m; etik[(etik == i) & ~m] = -2
    # −2 (weggeputzt) bekommt die nächste gültige Farbe (nie Schwarz, sonst würden die Linien dicker)
    _, idx = ndimage.distance_transform_edt(~gueltig, return_indices=True)
    voll = etik[idx[0], idx[1]]
    etik_farbe = np.where(maske, np.where(schwarz, si if si is not None else -1, voll), -1)
    etik_linien = etik_farbe
    if hat_schwarz:
        # dünne schwarze Linien (schmaler als ~1/60 der Figur) der Nachbarfarbe zuschlagen; dicke schwarze Flächen bleiben
        t = max(2, int(round(np.sqrt(flaeche)/60)))
        kern_t = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2*t + 1, 2*t + 1))
        dick = cv2.morphologyEx(schwarz.astype(np.uint8), cv2.MORPH_OPEN, kern_t).astype(bool)
        duenn = schwarz & ~dick
        basis = maske & ~duenn
        _, idx2 = ndimage.distance_transform_edt(~basis, return_indices=True)
        etik_linien = np.where(maske, etik_farbe[idx2[0], idx2[1]], -1)
    return etik_farbe, etik_linien, palette, si


def hexf(c): return '#%02x%02x%02x' % tuple(int(v) for v in c)


def farbzahl(rgb, maske):
    """Wie viele Farben braucht das Bild? k-means mit vielen Gruppen, ähnliche zusammenlegen, kleine nicht zählen.
    Schwarz (Umrisslinien) zählt als eigene Farbe dazu. Ergebnis 3–9."""
    bild = cv2.bilateralFilter(rgb.astype(np.uint8), 9, 60, 9)
    lab = cv2.cvtColor(bild, cv2.COLOR_RGB2LAB).astype(np.float32)
    chroma = np.hypot(lab[..., 1] - 128, lab[..., 2] - 128)
    schwarz = maske & (lab[..., 0] < 90) & (chroma < 30)
    pts = lab[maske & ~schwarz]
    if len(pts) < 50: return 3
    if len(pts) > 40000: pts = pts[np.random.default_rng(1).choice(len(pts), 40000, replace=False)]
    krit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, .5)
    _, et, z = cv2.kmeans(pts, 10, None, krit, 3, cv2.KMEANS_PP_CENTERS)
    n = np.bincount(et.ravel(), minlength=10) / len(pts)
    behalten = []                                                       # [Zentrum, Anteil], grosse zuerst
    for i in np.argsort(-n):
        nah = [b for b in behalten if np.linalg.norm(b[0] - z[i]) < 22]
        if nah: nah[0][1] += n[i]
        else: behalten.append([z[i], n[i]])
    zahl = sum(1 for _, a in behalten if a >= .025)
    return int(np.clip(zahl + (schwarz.sum() >= maske.sum()*.004), 3, 9))


def form(fid, name, gruppe, pfad, k=None, glatt=GLATT):
    rgb, maske = laden(pfad)
    # Diese Farbflächen dienen dem Ausmalmodus. Farbdruck verwendet die Originalgrafik.
    if not k: k = max(12, farbzahl(rgb, maske)*2)
    ys, xs = np.nonzero(maske)
    x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    skala = 100/max(x1 - x0, y1 - y0)                                   # Bildpunkte → 100er-Einheiten
    tol = .04 if not glatt else .08

    # Umriss
    umr = polygone(maske, skala, (x0, y0))
    g = unary_union(umr)
    # Sanft schliessen statt Öffnen: schmale Motivteile nicht abschneiden.
    if glatt: g = g.buffer(glatt, 8).buffer(-glatt, 8)
    g = g.simplify(tol, preserve_topology=True).buffer(0)             # buffer(0): doppelte Punkte raus
    d = ringe(g, 0, False)
    bx0, by0, bx1, by1 = g.bounds

    # Farbflächen, grosse zuerst (kleine liegen beim Zeichnen oben), Schwarz (Umrisslinien) zuoberst
    etik, etik_li, palette, si = quantisieren(rgb, maske, k, glatt)
    reihenfolge = [i for i in np.argsort(-np.bincount(etik[etik >= 0], minlength=len(palette))) if i != si]
    if si is not None: reihenfolge.append(si)

    def flaechen(et, i, linien):
        teile = polygone(et == i, skala, (x0, y0))
        if glatt and not linien:
            weich = [p.buffer(glatt*.6, 8).buffer(-glatt*.6, 8) for p in teile]
            teile = [t for q in weich for t in getattr(q, 'geoms', [q]) if not t.is_empty]
        elif glatt:                                                     # Linien nur schliessen, nie verdünnen
            weich = [p.buffer(glatt*.3, 8).buffer(-glatt*.3, 8) for p in teile]
            teile = [t for q in weich for t in getattr(q, 'geoms', [q]) if not t.is_empty]
        teile = [p.buffer(0).intersection(g) for p in teile if not p.is_empty]
        return [t for p in teile for t in getattr(p, 'geoms', [p]) if t.geom_type == 'Polygon' and t.area > .015]

    farben, grenzen = [], []
    for i in reihenfolge:
        if not (etik == i).any(): continue
        teile = flaechen(etik, i, i == si)
        rr = [r for t in teile for r in ringe(t, tol*.5 if i == si else tol, False)]
        if rr: farben.append(dict(f=hexf(palette[i]), d=rr))
    # Grenzen für die Innenlinien aus dem Bild ohne dünne Linien (sonst lägen sie doppelt an beiden Linienrändern)
    for i in range(len(palette)):
        if (etik_li == i).any(): grenzen += [t.boundary for t in flaechen(etik_li, i, False)]
    # Innenlinien: Grenzen zwischen den Farben, ohne den Umriss selbst
    innen = g.buffer(-.6)
    li = unary_union(grenzen).intersection(innen) if grenzen else LineString()
    li = linemerge(li) if li.geom_type == 'MultiLineString' else li
    det = []
    for l in getattr(li, 'geoms', [li]):
        if l.is_empty or l.length < 1.5: continue
        pts = np.asarray(l.simplify(tol).coords)
        if glatt and len(pts) >= 3:                                     # offene Linie runden, Enden festhalten
            p = pts
            for _ in range(2):
                a, b = p[:-1], p[1:]
                m = np.empty((2*len(a), 2)); m[0::2] = .75*a + .25*b; m[1::2] = .25*a + .75*b
                p = np.vstack([pts[:1], m, pts[-1:]])
            pts = np.asarray(LineString(p).simplify(tol*.4).coords)
        det.append([[round(x, 2), round(y, 2)] for x, y in pts])

    # Verschieben, damit der Umriss bei 0/0 beginnt
    dx, dy = -bx0, -by0
    sch = lambda rs: [[[round(x + dx, 2), round(y + dy, 2)] for x, y in r] for r in rs]
    d = sch(d); det = sch(det)
    for f in farben: f['d'] = sch(f['d'])
    w, h = round(bx1 - bx0, 2), round(by1 - by0, 2)
    gm = affinity.scale(g, 1, -1, origin=(0, 0))                          # schmalste/schwierigkeit rechnen in 100er-Einheiten
    eng = schmalste(gm)
    teile = list(getattr(gm, 'geoms', [gm]))
    return dict(id=fid, name=name, gruppe=gruppe, w=w, h=h, d=d, det=det, eng=round(eng, 1),
                schwer=max(schwierigkeit(t, eng) for t in teile), farben=farben, revision=2, teile=len(teile),
                original=dict(datei=fid+'.webp', x=round(-bx0, 4), y=round(-by0, 4),
                              w=round((x1-x0)*skala, 4), h=round((y1-y0)*skala, 4)))


def vorschau(f, ziel, px=112):
    """Kleines Bild für die Auswahl: Farbflächen auf weissem Umriss, dunkler Rand (wie die SVG-Bilder der Formen)."""
    from PIL import Image
    g = 4; n = px*g; rand = 6
    s = (n - 2*rand*g)/100
    ox, oy = (n - f['w']*s)/2, (n - f['h']*s)/2
    pt = lambda r: np.round(np.array([[ox + x*s, oy + y*s] for x, y in r])*8).astype(np.int32)   # 3 Bit Unterpixel
    img = np.zeros((n, n, 4), np.uint8)
    umriss = [pt(r) for r in f['d']]
    cv2.fillPoly(img, umriss, (255, 255, 255, 255), cv2.LINE_AA, 3)
    for c in f['farben']:
        h = c['f'].lstrip('#'); rgb = tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
        cv2.fillPoly(img, [pt(r) for r in c['d']], (*rgb, 255), cv2.LINE_AA, 3)
    cv2.polylines(img, umriss, True, (34, 34, 34, 255), int(1.6*g), cv2.LINE_AA, 3)
    Image.fromarray(img).resize((px, px), Image.LANCZOS).save(ziel, 'WEBP', quality=88, method=6)


def slug(t):
    t = unicodedata.normalize('NFD', t.replace('ä', 'ae').replace('ö', 'oe').replace('ü', 'ue')).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '-', t.lower()).strip('-')


def rechnen(e):
    """Eine Figur aus der Liste rechnen (läuft in einem eigenen Prozess). Fehler brechen nicht alles ab."""
    try:
        cv2.setRNGSeed(42)
        f = form(e['id'], e['name'], e['welt'], os.path.join(BILDER, e['datei']), e.get('k'), e.get('glatt', GLATT))
        from PIL import Image
        rgb, maske = laden(os.path.join(BILDER, e['datei']))
        ys, xs = np.nonzero(maske)
        rgba = np.dstack([rgb.astype(np.uint8), maske.astype(np.uint8)*255])
        im = Image.fromarray(rgba).crop((xs.min(), ys.min(), xs.max()+1, ys.max()+1))
        im.save(os.path.join(ZIEL, 'originale', e['id']+'.webp'), 'WEBP', lossless=True, method=6)
        im.thumbnail((100, 100), Image.Resampling.LANCZOS)
        thumb = Image.new('RGBA', (112, 112)); thumb.alpha_composite(im, ((112-im.width)//2, (112-im.height)//2))
        thumb.save(os.path.join(ZIEL, 'bilder', e['id']+'.webp'), 'WEBP', quality=95, method=6)
        return e['id'], f, None
    except Exception as x:
        return e['id'], None, f'{type(x).__name__}: {x}'


def runden1(o):
    """Koordinaten auf eine Stelle (0,1 % der Formgrösse) – reicht für den Druck und halbiert fast die Dateien."""
    if isinstance(o, float): return round(o, 1)
    if isinstance(o, list): return [runden1(v) for v in o]
    if isinstance(o, dict): return {k: (runden1(v) if k in ('d', 'det', 'farben') else v) for k, v in o.items()}
    return o


def schreiben(welt, formen):
    # Im Browser kommt die Farbe aus der Originalgrafik. Nur die Palette für die
    # Mal-Legende übertragen, nicht zusätzlich ungenutzte Millionen Farbpunkte.
    ausgabe = [dict(f, farben=[dict(f=c['f']) for c in f['farben']]) if f.get('original') else f for f in formen]
    with open(os.path.join(ZIEL, slug(welt) + '.js'), 'w', encoding='utf-8') as d:
        d.write('// erzeugt von werkzeug/vorlagen/bild.py – nicht von Hand ändern\nFIGUREN_DAZU(' + json.dumps(welt, ensure_ascii=False) + ',')
        json.dump([runden1(f) for f in ausgabe], d, ensure_ascii=False, separators=(',', ':')); d.write(');\n')


def lesen(welt):
    """Schon gerechnete Formen einer Welt aus ihrer Datei (für Teil-Läufe)."""
    p = os.path.join(ZIEL, slug(welt) + '.js')
    if not os.path.exists(p): return {}
    t = open(p, encoding='utf-8').read()
    t = t[t.index(',', t.index('FIGUREN_DAZU(')) + 1:t.rindex(')')]
    return {f['id']: f for f in json.loads(t)}


def export(nur=None):
    from multiprocessing import Pool
    liste = json.load(open(LISTE, encoding='utf-8'))
    figuren = liste['figuren']
    if nur: figuren_rechnen = [e for e in figuren if e['id'] in nur]
    else: figuren_rechnen = figuren
    os.makedirs(os.path.join(ZIEL, 'bilder'), exist_ok=True)
    os.makedirs(os.path.join(ZIEL, 'originale'), exist_ok=True)
    unbekannt = (nur or set()) - {e['id'] for e in figuren}
    if unbekannt: raise ValueError('Unbekannte Figuren: '+', '.join(sorted(unbekannt)))
    fertig, fehler = {}, []
    with Pool(max(1, min(len(figuren_rechnen), (os.cpu_count() or 2) - 2, 8)), initializer=cv2.setNumThreads, initargs=(1,)) as pool:
        for i, (fid, f, err) in enumerate(pool.imap_unordered(rechnen, figuren_rechnen), 1):
            if err: fehler.append((fid, err)); print(f'  FEHLER {fid}: {err}', flush=True)
            else: fertig[fid] = f
            if i % 20 == 0: print(f'  {i}/{len(figuren_rechnen)}', flush=True)
    if fehler: raise RuntimeError('Keine Vorlagen geschrieben: '+repr(fehler))
    index = []
    for welt in liste['welten']:
        alt = lesen(welt) if nur else {}
        formen = [fertig.get(e['id']) or alt.get(e['id']) for e in figuren if e['welt'] == welt]
        formen = [f for f in formen if f]
        if not formen: continue
        schreiben(welt, formen)
        index += [dict(id=f['id'], name=f['name'], gruppe=welt, datei=slug(welt) + '.js', w=f['w'], h=f['h'], eng=f['eng'], schwer=f['schwer'])
                  for f in formen]
    with open(os.path.join(ZIEL, 'index.js'), 'w', encoding='utf-8') as d:
        d.write('// erzeugt von werkzeug/vorlagen/bild.py – nicht von Hand ändern\nwindow.FIGUREN_INDEX=')
        json.dump(index, d, ensure_ascii=False, separators=(',', ':')); d.write(';\n')
    return fertig, fehler, index


if __name__ == '__main__':
    try: sys.stdout.reconfigure(encoding='utf-8')
    except Exception: pass
    if len(sys.argv) > 2 and sys.argv[1] == '--datei':
        pfad = sys.argv[2]; k = int(sys.argv[3]) if len(sys.argv) > 3 else None
        glatt = float(sys.argv[4]) if len(sys.argv) > 4 else GLATT
        f = form('probe', 'Probe', 'Probe', pfad, k, glatt)
        vorschau(f, 'probe.webp', 400)
        print(f"{f['w']:6.1f} × {f['h']:6.1f}  {len(f['farben'])} Farben, {len(f['det'])} Innenlinien, eng {f['eng']} -> probe.webp")
        sys.exit()
    fertig, fehler, index = export(set(sys.argv[1:]) or None)
    gross = sum(os.path.getsize(os.path.join(ZIEL, n)) for n in os.listdir(ZIEL) if n.endswith('.js'))
    print(f'{len(fertig)} gerechnet, {len(fehler)} Fehler, {len(index)} im Index, zusammen {gross//1024} KB -> {ZIEL}')
    for fid, err in fehler: print('  ', fid, err)
