"""Hilfen für Welle 4: Twemoji-SVG holen, rendern, schwarzen Umriss anbringen, als 512-px-PNG ablegen."""
import os, io, sys, urllib.request
import numpy as np, cv2, fitz
from PIL import Image
SP = os.path.join(__import__('tempfile').gettempdir(), 'schrittli-twemoji')   # Zwischenspeicher der SVG, nicht im Repo
TW = 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/%s.svg'
UA = {'User-Agent': 'Mozilla/5.0'}
os.makedirs(os.path.join(SP, 'svg'), exist_ok=True)
def holen(url, name=None):
    p = os.path.join(SP, 'svg', (name or url.rsplit('/', 1)[-1]))
    if not os.path.exists(p):
        open(p, 'wb').write(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30).read())
    return p
def svg_rgba(pfad, gross=1400):
    d = fitz.open(pfad); pg = d[0]
    z = gross / max(pg.rect.width, pg.rect.height)
    pm = pg.get_pixmap(matrix=fitz.Matrix(z, z), alpha=True)
    a = np.frombuffer(pm.samples, np.uint8).reshape(pm.height, pm.width, 4)
    return a.copy()
def umriss(rgba, ziel=512, rand=14, dick=11, kante=None):
    """Motiv auf Grösse bringen, schwarzen Umriss rundherum, auf ziel x ziel zentrieren."""
    a = rgba[:, :, 3]
    ys, xs = np.where(a > 20)
    rgba = rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    h, w = rgba.shape[:2]
    inner = ziel - 2 * rand - 2 * dick
    s = inner / max(h, w)
    rgba = cv2.resize(rgba, (max(1, round(w * s)), max(1, round(h * s))), interpolation=cv2.INTER_AREA)
    h, w = rgba.shape[:2]
    pad = rand + dick
    C = np.zeros((ziel, ziel, 4), np.uint8)
    y0, x0 = (ziel - h) // 2, (ziel - w) // 2
    C[y0:y0 + h, x0:x0 + w] = rgba
    al = C[:, :, 3]
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * dick + 1, 2 * dick + 1))
    dil = cv2.dilate((al > 20).astype(np.uint8) * 255, k)
    dil = cv2.GaussianBlur(dil, (0, 0), 1.2)
    out = np.zeros_like(C)
    out[:, :, 3] = dil
    out[:, :, :3] = 0
    # Motiv obenauf (Alpha-Compositing)
    fg = C[:, :, :3].astype(np.float32); fa = (al / 255.)[:, :, None]
    bgc = out[:, :, :3].astype(np.float32); ba = (dil / 255.)[:, :, None]
    oa = fa + ba * (1 - fa)
    oc = (fg * fa + bgc * ba * (1 - fa)) / np.maximum(oa, 1e-6)
    out[:, :, :3] = np.clip(oc, 0, 255).astype(np.uint8)
    out[:, :, 3] = np.clip(oa[:, :, 0] * 255, 0, 255).astype(np.uint8)
    return out
def speichern(rgba, pfad):
    Image.fromarray(rgba, 'RGBA').save(pfad)
def twemoji(code, ziel_pfad, **kw):
    p = holen(TW % code, code + '.svg')
    speichern(umriss(svg_rgba(p), **kw), ziel_pfad)
if __name__ == '__main__':
    code, out = sys.argv[1], sys.argv[2]
    twemoji(code, out)
