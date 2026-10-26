"""Vorlagen aus Bildern (Schrittli): aus einem PNG/WebP/JPG mit hellem oder durchsichtigem Hintergrund werden
Umriss (Schnittlinie), Farbflächen (zum farbigen Drucken) und die Grenzen zwischen den Farben (Innenlinien
zum Anmalen) gewonnen. Schreibt vorlagen/figuren.js (window.FORMEN_BILD) im gleichen Format wie formen.js,
dazu je Form eine Liste `farben` mit [{f:'#rrggbb', d:[Ringe]}].
Aufruf: python bild.py                 – alle Bilder aus BILDER
        python bild.py <datei> [<Name>] [<Farben>]  – ein einzelnes Bild probieren (schreibt ebenfalls figuren.js)"""
import os, sys, json
import numpy as np, cv2
from scipy import ndimage
from shapely.geometry import LinearRing, Polygon, MultiPolygon, LineString, MultiLineString
from shapely.ops import unary_union, linemerge
from shapely import affinity
from shapely.geometry.polygon import orient
from zeichnen import schmalste, schwierigkeit

HIER = os.path.dirname(os.path.abspath(__file__))
ZIEL = os.path.join(HIER, '..', '..', 'vorlagen', 'figuren.js')
GRUPPE = 'Figuren'

# id, Name, Datei, Anzahl Farben, Glättung (0 = eckig lassen wie bei Pixelbildern)
BILDER = [
    ('creeper', 'Creeper', 'bilder/creeper.png', 3, 0),
    ('steve', 'Steve', 'bilder/steve.png', 6, 0),
    ('mario', 'Mario', 'bilder/mario.jpg', 8, 0.8),
]


def laden(pfad):
    """Bild → RGB (float) und Maske der Figur (True = gehört dazu)."""
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
        nahe = cv2.morphologyEx(nahe.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
        h, w = nahe.shape; ff = np.zeros((h + 2, w + 2), np.uint8)
        saum = [(0, x) for x in range(0, w, 8)] + [(h - 1, x) for x in range(0, w, 8)] + [(y, 0) for y in range(0, h, 8)] + [(y, w - 1) for y in range(0, h, 8)]
        for y, x in saum:
            if nahe[y, x] and not ff[y + 1, x + 1]: cv2.floodFill(nahe.copy(), ff, (x, y), 2)
        maske = ~(ff[1:-1, 1:-1] > 0)
    # kleine Fitzel weg, grösstes Stück behalten (Löcher bleiben erhalten)
    maske = cv2.morphologyEx(maske.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)).astype(bool)
    lab, n = ndimage.label(maske)
    if n > 1:
        gross = np.argmax(np.bincount(lab.ravel())[1:]) + 1
        maske = lab == gross
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
    if g.is_empty or g.geom_type != 'Polygon': return []
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
    if glatt: bild = cv2.bilateralFilter(bild, 9, 60, 9)
    else: bild = cv2.medianBlur(bild, 3)
    lab = cv2.cvtColor(bild, cv2.COLOR_RGB2LAB).astype(np.float32)
    flaeche = maske.sum()
    # Schwarz: dunkel und farblos (L < 35 von 100, wenig Buntheit) – Umrisslinien, Augen, Schnauz
    chroma = np.hypot(lab[..., 1] - 128, lab[..., 2] - 128)
    schwarz = maske & (lab[..., 0] < 90) & (chroma < 30)
    schwarz = cv2.morphologyEx(schwarz.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)).astype(bool)
    lab_s, ns = ndimage.label(schwarz)
    if ns:
        gr = np.bincount(lab_s.ravel()); gr[0] = 0
        schwarz = np.isin(lab_s, np.nonzero(gr >= flaeche*.0003)[0])
    if schwarz.sum() < flaeche*.004: schwarz[:] = False                # zu wenig Schwarz: keine Linien-Ebene
    hat_schwarz = bool(schwarz.any())
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
    # Fitzel weg: jede Farbe öffnen, kleine Stücke löschen, Löcher mit der nächsten Farbe füllen (Schwarz bleibt unangetastet)
    r = max(1, int(round(np.sqrt(flaeche)/200)))
    kern = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2*r + 1, 2*r + 1))
    gueltig = np.zeros_like(maske)
    for i in range(kk):
        m = cv2.morphologyEx((etik == i).astype(np.uint8), cv2.MORPH_OPEN, kern).astype(bool)
        lab_i, n = ndimage.label(m)
        if n:
            gr = np.bincount(lab_i.ravel()); gr[0] = 0
            m = np.isin(lab_i, np.nonzero(gr >= flaeche*.0007)[0])
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


def form(fid, name, pfad, k, glatt):
    rgb, maske = laden(pfad)
    ys, xs = np.nonzero(maske)
    x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    skala = 100/max(x1 - x0, y1 - y0)                                   # Bildpunkte → 100er-Einheiten
    tol = .25 if not glatt else .18

    # Umriss
    umr = polygone(maske, skala, (x0, y0))
    g = max(umr, key=lambda p: p.area)
    if glatt: g = g.buffer(glatt, 16).buffer(-2*glatt, 16).buffer(glatt, 16)   # Pixeltreppen weg, Ecken rund
    g = g.simplify(tol, preserve_topology=True).buffer(0)             # buffer(0): doppelte Punkte raus
    if g.geom_type != 'Polygon': g = max(g.geoms, key=lambda p: p.area)
    d = ringe(g, 0, bool(glatt))
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
        return [t for p in teile for t in getattr(p, 'geoms', [p]) if t.geom_type == 'Polygon' and t.area > (.05 if linien else .2)]

    farben, grenzen = [], []
    for i in reihenfolge:
        if not (etik == i).any(): continue
        teile = flaechen(etik, i, i == si)
        rr = [r for t in teile for r in ringe(t, tol*.5 if i == si else tol, bool(glatt))]
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
    return dict(id=fid, name=name, gruppe=GRUPPE, w=w, h=h, d=d, det=det, eng=round(eng, 1), schwer=schwierigkeit(gm, eng), farben=farben)


def export(liste):
    out = [form(fid, name, os.path.join(HIER, pfad) if not os.path.isabs(pfad) else pfad, k, glatt) for fid, name, pfad, k, glatt in liste]
    with open(ZIEL, 'w', encoding='utf-8') as f:
        f.write('// erzeugt von werkzeug/vorlagen/bild.py – nicht von Hand ändern\nwindow.FORMEN_BILD=')
        json.dump(out, f, ensure_ascii=False, separators=(',', ':')); f.write(';\n')
    return out


if __name__ == '__main__':
    liste = BILDER
    if len(sys.argv) > 1:
        pfad = sys.argv[1]; name = sys.argv[2] if len(sys.argv) > 2 else os.path.splitext(os.path.basename(pfad))[0].title()
        k = int(sys.argv[3]) if len(sys.argv) > 3 else 6
        liste = [(os.path.splitext(os.path.basename(pfad))[0].lower(), name, pfad, k, 1.0)]
    out = export(liste)
    for f in out:
        print(f"{f['name']:10s} {f['w']:6.1f} × {f['h']:6.1f}  Umriss {sum(len(r) for r in f['d'])} Punkte, {len(f['d'])-1} Löcher,"
              f" {len(f['farben'])} Farben ({sum(len(c['d']) for c in f['farben'])} Flächen), {len(f['det'])} Innenlinien, eng {f['eng']}")
    print('->', os.path.normpath(ZIEL), f'{os.path.getsize(ZIEL)//1024} KB')
