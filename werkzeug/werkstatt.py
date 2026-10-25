#!/usr/bin/env python3
"""Schrittli – Werkstatt: werkzeug/entwurf mit dem privaten Repo schrittli-werkstatt abgleichen.

werkzeug/entwurf ist ein Klon von github.com/conradinjoos-lab/schrittli-werkstatt (privat).
Die Online-Kontrolle (https://conradinjoos-lab.github.io/schrittli/kontrolle/) liest und schreibt dort.

Aufruf:  python werkzeug/werkstatt.py              abgleichen: holen, Filmstreifen + Liste erneuern, hochladen
         python werkzeug/werkstatt.py --einrichten  einmalig: werkzeug/entwurf zum Klon machen

Pro Video legt es neben video.json, brief.md und blatt-*.jpg ab:
  analyse.json   Kopie aus werkzeug/cache (Transkript, Bildwechsel) plus _bilder = Anzahl Einzelbilder
  streifen.jpg   alle Einzelbilder klein (160×90, 20 pro Zeile) für Filmstreifen und Zeitleiste
Dazu im Wurzelordner liste.json (eine Zeile pro Video), kacheln.jpg (ein quadratisches Bild pro Video, schwarze Ränder weg;
vorschau.jpg dasselbe in 16:9 für ältere Kontrollseiten) und meta.json (Verfahren mit Farbe, Vokabular, Raster der Kacheln).
"""
import json, re, subprocess, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from kontrolle import CACHE, ENTWURF, lies, schreibe_json, status, themen, vorlage_fehlt, weggelassen, vokabular, vorschaubild, ID_MUSTER

REPO = 'https://github.com/conradinjoos-lab/schrittli-werkstatt.git'
SPALTEN, B, H = 20, 160, 90          # Filmstreifen
VB, VH, VSPALTEN = 256, 144, 16      # Vorschau (alt, 16:9)
KB = 160                             # Kacheln, quadratisch, gleich viele Spalten
sys.stdout.reconfigure(encoding='utf-8', errors='replace')


def git(*a, pruefen=True):
    r = subprocess.run(['git', '-C', str(ENTWURF), *a], capture_output=True, text=True, encoding='utf-8')
    if pruefen and r.returncode: raise SystemExit(f'git {" ".join(a)}: {r.stderr.strip() or r.stdout.strip()}')
    return r.stdout.strip()


def einrichten():
    if (ENTWURF / '.git').exists(): return print('werkzeug/entwurf ist schon ein Klon.')
    git('init', '-q', '-b', 'main'); git('remote', 'add', 'origin', REPO)
    for k in ('user.name', 'user.email'):  # gleiche Identität wie das App-Repo
        w = subprocess.run(['git', '-C', str(ENTWURF.parent.parent), 'config', k], capture_output=True, text=True).stdout.strip()
        if w: git('config', k, w)
    (ENTWURF / '.gitattributes').write_text('* -text\n', encoding='utf-8')  # Bytes 1:1, kein CRLF-Umbau
    print('eingerichtet – jetzt ohne --einrichten abgleichen.')


def bilder(vid):
    f = CACHE / vid / 'f'
    return sorted(f.glob('*.jpg')) if f.exists() else []


def streifen(vid, fs):
    from PIL import Image
    zeilen = (len(fs) + SPALTEN - 1) // SPALTEN
    im = Image.new('RGB', (SPALTEN * B, zeilen * H))
    for i, p in enumerate(fs):
        with Image.open(p) as b: im.paste(b.convert('RGB').resize((B, H), Image.LANCZOS), ((i % SPALTEN) * B, (i // SPALTEN) * H))
    im.save(ENTWURF / vid / 'streifen.jpg', 'JPEG', quality=60, optimize=True, progressive=True)


def zeile(vid):
    d = ENTWURF / vid
    a = lies(d / 'analyse.json', {})
    v = lies(d / 'video.json')
    steps = (v or {}).get('steps') or []
    t = steps[-1].get('t') or 0 if steps else (a.get('dauer') or 0) / 2
    return {'id': vid, 'title': (v or {}).get('title') or a.get('title') or vid, 'dauer': a.get('dauer'), 'fps': a.get('fps') or 2,
            'entwurf': bool(v), 'schritte': len(steps), 'brief': (d / 'brief.md').exists(), 'status': status(v), 'vorlage_fehlt': vorlage_fehlt(v), 'weggelassen': weggelassen(v),
            'area': (v or {}).get('areaId') or '', 'bild': vorschaubild(vid, t, a.get('fps') or 2)}


def ohne_raender(b):
    """Schwarze Balken (Letterbox) abschneiden, höchstens je ein Drittel."""
    from PIL import ImageStat
    g = b.convert('L'); w, h = g.size
    dunkel = lambda box: ImageStat.Stat(g.crop(box)).mean[0] < 22
    o, u, l, r = 0, h, 0, w
    while o < h // 3 and dunkel((0, o, w, o + 1)): o += 1
    while u > h * 2 // 3 and dunkel((0, u - 1, w, u)): u -= 1
    while l < w // 3 and dunkel((l, o, l + 1, u)): l += 1
    while r > w * 2 // 3 and dunkel((r - 1, o, r, u)): r -= 1
    return b.crop((l, o, r, u))


def fuellen(b, w, h):
    """Ohne Verzerren auf w×h: skalieren, bis es füllt, dann die Mitte nehmen."""
    from PIL import Image
    s = max(w / b.width, h / b.height)
    b = b.resize((max(w, round(b.width * s)), max(h, round(b.height * s))), Image.LANCZOS)
    x, y = (b.width - w) // 2, (b.height - h) // 2
    return b.crop((x, y, x + w, y + h))


def vorschau(liste):
    from PIL import Image
    zeilen = max(1, (len(liste) + VSPALTEN - 1) // VSPALTEN)
    im = Image.new('RGB', (VSPALTEN * VB, zeilen * VH), (245, 248, 251))
    ka = Image.new('RGB', (VSPALTEN * KB, zeilen * KB), (245, 248, 251))
    for i, e in enumerate(liste):
        fs = bilder(e['id'])
        if not fs: continue
        with Image.open(fs[min(e['bild'], len(fs)) - 1]) as b:
            b = ohne_raender(b.convert('RGB'))
            im.paste(fuellen(b, VB, VH), ((i % VSPALTEN) * VB, (i // VSPALTEN) * VH))
            ka.paste(fuellen(b, KB, KB), ((i % VSPALTEN) * KB, (i // VSPALTEN) * KB))
        e['v'] = i
    im.save(ENTWURF / 'vorschau.jpg', 'JPEG', quality=72, optimize=True, progressive=True)
    ka.save(ENTWURF / 'kacheln.jpg', 'JPEG', quality=72, optimize=True, progressive=True)


def erneuern():
    vids = sorted(d.name for d in ENTWURF.iterdir() if d.is_dir() and ID_MUSTER.fullmatch(d.name))
    neu = 0
    for vid in vids:
        a = lies(CACHE / vid / 'analyse.json')
        fs = bilder(vid)
        if not a: continue  # online entstanden oder Cache gelöscht: vorhandene Kopie bleibt
        a['_bilder'] = len(fs)
        alt = lies(ENTWURF / vid / 'analyse.json', {})
        if alt != a: schreibe_json(ENTWURF / vid / 'analyse.json', a)
        if fs and (alt.get('_bilder') != len(fs) or not (ENTWURF / vid / 'streifen.jpg').exists()):
            streifen(vid, fs); neu += 1
    liste = [zeile(v) for v in vids]
    vorschau(liste)
    schreibe_json(ENTWURF / 'liste.json', liste)
    schreibe_json(ENTWURF / 'meta.json', {'themen': themen(), 'vokabular': vokabular(), 'kacheln': [VSPALTEN, KB, KB]})
    print(f'{len(vids)} Videos, {neu} neue Filmstreifen')


def abgleichen():
    if not (ENTWURF / '.git').exists(): raise SystemExit('Zuerst: python werkzeug/werkstatt.py --einrichten')
    git('add', '-A')
    if git('status', '--porcelain'):
        git('reset', '-q', '--', 'liste.json', 'vorschau.jpg', 'kacheln.jpg', 'meta.json', pruefen=False)  # abgeleitet, wird neu erzeugt
        git('commit', '-q', '-m', 'Lokal bearbeitet')
        git('checkout', '-q', '--', '.', pruefen=False)
    if git('ls-remote', '--heads', 'origin', 'main'):
        git('pull', '-q', '--rebase', '--autostash', 'origin', 'main')
    erneuern()
    git('add', '-A')
    if git('status', '--porcelain'): git('commit', '-q', '-m', 'Abgleich: Liste und Filmstreifen')
    git('push', '-q', '-u', 'origin', 'main')
    print('abgeglichen:', git('log', '-1', '--format=%h %s'))


if __name__ == '__main__':
    einrichten() if '--einrichten' in sys.argv else abgleichen()
