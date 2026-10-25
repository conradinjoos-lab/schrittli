#!/usr/bin/env python3
"""Bibo & Fila – ruhige Vorschaubilder für die Videos aus schule/schule.json (statt der YouTube-Vorschau mit Gesichtern, Schrift und Logos).

1. python werkzeug/vorschau.py bogen [id …]   Kandidatenbogen pro Video: 16 Bilder mit Zeit, die Hälfte aus dem letzten Drittel
                                               → werkzeug/cache/_vorschau/bogen/<id>.jpg
2. Claude wählt pro Bogen (ein Agent für etwa 30 Bögen) Zeit, Ausschnitt und ob freigestellt wird → vorschau/auswahl.json
     {"<id>": {"t": 105.0, "aus": [x0, y0, x1, y1], "frei": true, "notiz": "…"}}   aus = Bildanteile 0..1, weglassen = ganzes Bild
3. python werkzeug/vorschau.py bauen [id …]   → vorschau/<YouTube-ID>.webp (480×270) und vorschau/vorschau.json
                                               Kontrolle: werkzeug/cache/_vorschau/echt/<id>.jpg (ohne Freistellen) und uebersicht-*.jpg

Regeln für die Wahl: fertiges Werkstück, ruhig und scharf; nie Kinder oder Gesichter, keine Schrift, keine Logos, Hände nur wenn es
nicht anders geht. Freistellen (rembg, lokal, nichts geht ins Internet) nur bei einem einzelnen Werkstück, das niemand in der Hand hält.
Braucht die Einzelbilder und video.mp4 im Cache (holen.py), ffmpeg, opencv-python, numpy, Pillow; fürs Freistellen rembg.
"""
import json, os, subprocess, sys
from pathlib import Path
import cv2, numpy as np
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
WURZEL = Path(__file__).resolve().parent.parent
CACHE = WURZEL / 'werkzeug' / 'cache'
ARBEIT = CACHE / '_vorschau'
ZIEL = WURZEL / 'vorschau'
AUSWAHL = ZIEL / 'auswahl.json'
B, H = 480, 270                                  # Grösse im Repo; angezeigt wird höchstens etwa 250 px breit
GRUND = (228, 234, 238)                          # BGR, helles Warmgrau hinter freigestellten Werkstücken


def videos():
    return json.loads((WURZEL / 'schule' / 'schule.json').read_text(encoding='utf-8'))['videos']


def schärfe(g): return cv2.Laplacian(g, cv2.CV_64F).var()


def haut(img):
    m = cv2.inRange(cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb), (0, 138, 77), (255, 173, 127))
    return m.mean() / 255


# ----------------------------------------------------------------- 1. Kandidatenbogen
def kandidaten(v, n=16):
    c = CACHE / v['source']['id']
    a = json.loads((c / 'analyse.json').read_text(encoding='utf-8')) if (c / 'analyse.json').exists() else {}
    fps = a.get('fps') or 2
    files = sorted((c / 'f').glob('*.jpg'))
    dauer = len(files) / fps
    imgs = [cv2.imread(str(f)) for f in files]
    grau = [cv2.cvtColor(i, cv2.COLOR_BGR2GRAY) for i in imgs]
    st = v.get('steps') or []
    ende = min(dauer * 0.66, float(st[-1]['t']) - 5) if st and st[-1]['label'].startswith('Fertig') else dauer * 0.66
    zeilen = []
    for i, g in enumerate(grau):
        t = i / fps
        if t < 2 or t > dauer - 1.5 or g.std() < 20: continue      # Titel, Abspann, leere Bilder
        nb = [grau[j] for j in (i - 2, i - 1, i + 1, i + 2) if 0 <= j < len(grau)]
        zeilen.append([i, t, schärfe(g), np.mean([cv2.absdiff(g, x).mean() for x in nb]), haut(imgs[i])])
    if not zeilen: return [], imgs
    S = np.array([z[2] for z in zeilen]); Bw = np.array([z[3] for z in zeilen]); Hh = np.array([z[4] for z in zeilen])
    wert = np.log(S / np.median(S) + 1e-6) - 1.2 * Bw / (np.median(Bw) + 1e-6) - 4 * Hh
    wahl = []
    for teil in ([z for z in range(len(zeilen)) if zeilen[z][1] >= ende], range(len(zeilen))):   # erst das Ende, dann alles
        teil = set(teil)
        for k in np.argsort(-wert):
            if len(wahl) >= (n // 2 if len(teil) < len(zeilen) else n): break
            if k in teil and all(abs(zeilen[k][1] - w[1]) >= 3 for w in wahl): wahl.append(zeilen[k])
    return sorted(wahl, key=lambda z: z[1]), imgs


def bogen(ids):
    (ARBEIT / 'bogen').mkdir(parents=True, exist_ok=True)
    for v in videos():
        if ids and v['id'] not in ids: continue
        if not (CACHE / v['source']['id'] / 'f').is_dir(): print(v['id'], 'FEHLT im Cache – zuerst holen.py'); continue
        wahl, imgs = kandidaten(v)
        if not wahl: print(v['id'], 'keine Kandidaten'); continue
        kacheln = []
        for z in wahl:
            k = cv2.resize(imgs[z[0]], (320, 180))
            cv2.rectangle(k, (0, 0), (70, 22), (0, 0, 0), -1)
            cv2.putText(k, f'{z[1]:.1f}', (4, 17), 0, 0.6, (255, 255, 255), 2)
            kacheln.append(k)
        while len(kacheln) % 4: kacheln.append(np.zeros_like(kacheln[0]))
        cv2.imwrite(str(ARBEIT / 'bogen' / f"{v['id']}.jpg"), np.vstack([np.hstack(kacheln[i:i + 4]) for i in range(0, len(kacheln), 4)]),
                    [cv2.IMWRITE_JPEG_QUALITY, 85])
        print(v['id'], len(wahl), 'Kandidaten')


# ----------------------------------------------------------------- 2. Bild bauen
def bild_bei(video, t):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{max(0, t):.2f}', '-i', str(video), '-frames:v', '1', '-f', 'image2pipe',
                        '-vcodec', 'png', '-'], capture_output=True)
    return cv2.imdecode(np.frombuffer(r.stdout, np.uint8), cv2.IMREAD_COLOR) if r.stdout else None


def ränder_weg(img, schwelle=18):
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    zeilen, spalten = np.where(g.max(1) > schwelle)[0], np.where(g.max(0) > schwelle)[0]
    if len(zeilen) == 0: return img
    return img[zeilen[0]:zeilen[-1] + 1, spalten[0]:spalten[-1] + 1]


def auf_16_9(img):
    """Mittig auf 16:9 zuschneiden, nie erweitern (sonst käme Weggeschnittenes zurück)."""
    h, w = img.shape[:2]
    if w * 9 > h * 16: nw = h * 16 // 9; return img[:, (w - nw) // 2:(w - nw) // 2 + nw]
    nh = w * 9 // 16; return img[(h - nh) // 2:(h - nh) // 2 + nh]


def verschönern(img):
    l, a, b = cv2.split(cv2.cvtColor(img, cv2.COLOR_BGR2LAB))
    img = cv2.cvtColor(cv2.merge((cv2.createCLAHE(clipLimit=1.6, tileGridSize=(4, 4)).apply(l), a, b)), cv2.COLOR_LAB2BGR)
    img = cv2.addWeighted(img, 1.45, cv2.GaussianBlur(img, (0, 0), 1.6), -0.45, 0)      # Unschärfemaske
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[..., 1] *= 1.08
    return cv2.cvtColor(np.clip(hsv, 0, 255).astype(np.uint8), cv2.COLOR_HSV2BGR)


_sitzung = None
def maske(img):
    global _sitzung
    from rembg import new_session, remove
    if _sitzung is None: _sitzung = new_session('isnet-general-use', providers=['CUDAExecutionProvider', 'CPUExecutionProvider'])
    rgba = remove(Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)), session=_sitzung, post_process_mask=True)
    m = np.array(rgba)[..., 3].astype(np.float32) / 255
    n, lab, st, _ = cv2.connectedComponentsWithStats((m > 0.5).astype(np.uint8))
    if n > 2:                                    # Krümel weg: nur Flächen ab 3 % der grössten
        gross = st[1:, cv2.CC_STAT_AREA].max()
        for k in range(1, n):
            if st[k, cv2.CC_STAT_AREA] < 0.03 * gross: m[lab == k] = 0
    return cv2.GaussianBlur(m, (0, 0), 0.8)


def freigestellt(img, m, W=960, Hh=540):
    ys, xs = np.where(m > 0.5)
    if len(ys) == 0: return None
    rand = np.concatenate([m[:3].ravel(), m[-3:].ravel(), m[:, :3].ravel(), m[:, -3:].ravel()])
    if (rand > 0.5).mean() > 0.02: return None       # Werkstück stösst an den Bildrand → angeschnitten, lieber das echte Bild
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    s = min(W * 0.78 / (x1 - x0), Hh * 0.78 / (y1 - y0))
    obj = cv2.resize(img[y0:y1, x0:x1], None, fx=s, fy=s, interpolation=cv2.INTER_LANCZOS4).astype(np.float32)
    om = cv2.resize(m[y0:y1, x0:x1], None, fx=s, fy=s, interpolation=cv2.INTER_LINEAR)
    oh, ow = om.shape
    ox, oy = (W - ow) // 2, (Hh - oh) // 2
    grund = np.ones((Hh, W, 3), np.float32) * np.array(GRUND, np.float32)
    schatten = np.zeros((Hh, W), np.float32)
    schatten[min(Hh - oh, oy + 10):min(Hh - oh, oy + 10) + oh, min(W - ow, ox + 6):min(W - ow, ox + 6) + ow] = om
    grund *= 1 - cv2.GaussianBlur(schatten, (0, 0), 14)[..., None] * 0.28                # weicher Schatten
    a = np.zeros((Hh, W), np.float32); a[oy:oy + oh, ox:ox + ow] = om
    o = np.zeros((Hh, W, 3), np.float32); o[oy:oy + oh, ox:ox + ow] = obj
    return np.clip(o * a[..., None] + grund * (1 - a[..., None]), 0, 255).astype(np.uint8)


def bauen(ids):
    wahl = json.loads(AUSWAHL.read_text(encoding='utf-8'))
    (ARBEIT / 'echt').mkdir(parents=True, exist_ok=True)
    ZIEL.mkdir(exist_ok=True)
    for v in videos():
        w = wahl.get(v['id'])
        if not w or (ids and v['id'] not in ids): continue
        yt = v['source']['id']
        video = next((p for p in (CACHE / yt).glob('video.*') if p.suffix in ('.mp4', '.webm', '.mkv')), None)
        if not video: print(v['id'], 'kein video.mp4 im Cache'); continue
        t = float(w['t'])
        kand = [f for f in (bild_bei(video, t + d) for d in (0, -0.4, -0.2, 0.2, 0.4)) if f is not None]
        if not kand: print(v['id'], 'kein Bild bei', t); continue
        klein = lambda f: cv2.resize(cv2.cvtColor(f, cv2.COLOR_BGR2GRAY), (160, 90)).astype(np.int16)
        kand = [f for f in kand if np.abs(klein(f) - klein(kand[0])).mean() < 10]     # im Umkreis das schärfste, aber nicht über einen Schnitt
        roh = ränder_weg(max(kand, key=lambda f: schärfe(cv2.cvtColor(f, cv2.COLOR_BGR2GRAY))))
        if w.get('aus'):                         # Gesicht, Bauchbinde oder Untertitel wegschneiden
            x0, y0, x1, y1 = w['aus']; h, b = roh.shape[:2]
            roh = roh[int(y0 * h):int(y1 * h), int(x0 * b):int(x1 * b)]
        schön = verschönern(roh)
        echt = cv2.resize(auf_16_9(schön), (B, H), interpolation=cv2.INTER_AREA if schön.shape[1] >= B else cv2.INTER_LANCZOS4)
        cv2.imwrite(str(ARBEIT / 'echt' / f"{v['id']}.jpg"), echt, [cv2.IMWRITE_JPEG_QUALITY, 90])
        fertig = echt
        if w.get('frei'):
            f = freigestellt(schön, maske(schön))
            if f is not None: fertig = cv2.resize(f, (B, H), interpolation=cv2.INTER_AREA)
        Image.fromarray(cv2.cvtColor(fertig, cv2.COLOR_BGR2RGB)).save(ZIEL / f'{yt}.webp', 'WEBP', quality=80, method=6)
        print(v['id'], t, 'freigestellt' if fertig is not echt else 'echt')
    vorhanden = sorted(p.stem for p in ZIEL.glob('*.webp'))
    (ZIEL / 'vorschau.json').write_text(json.dumps({'bilder': vorhanden}, ensure_ascii=False, indent=0), encoding='utf-8')
    übersicht()


def übersicht():
    """Kontrollblätter: alle fertigen Vorschaubilder mit Namen, je 24 pro Blatt."""
    from PIL import ImageDraw
    wahl = json.loads(AUSWAHL.read_text(encoding='utf-8'))
    liste = [(v['id'], ZIEL / f"{v['source']['id']}.webp") for v in videos() if v['id'] in wahl]
    liste = [(i, p) for i, p in liste if p.exists()]
    for alt in ARBEIT.glob('uebersicht-*.jpg'): alt.unlink()
    for n in range(0, len(liste), 24):
        teil = liste[n:n + 24]
        blatt = Image.new('RGB', (4 * 330, ((len(teil) + 3) // 4) * 205), 'white'); d = ImageDraw.Draw(blatt)
        for k, (i, p) in enumerate(teil):
            x, y = (k % 4) * 330, (k // 4) * 205
            blatt.paste(Image.open(p).convert('RGB').resize((320, 180)), (x + 5, y + 2))
            d.text((x + 6, y + 184), i, fill=(30, 30, 30))
        blatt.save(ARBEIT / f'uebersicht-{n // 24 + 1}.jpg', quality=85)


if __name__ == '__main__':
    if len(sys.argv) < 2 or sys.argv[1] not in ('bogen', 'bauen'): sys.exit(__doc__)
    (bogen if sys.argv[1] == 'bogen' else bauen)(set(sys.argv[2:]))
