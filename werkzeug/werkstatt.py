#!/usr/bin/env python3
"""Schrittli – Werkstatt: werkzeug/entwurf mit dem privaten Repo schrittli-werkstatt abgleichen.

werkzeug/entwurf ist ein Klon von github.com/conradinjoos-lab/schrittli-werkstatt (privat).
Die Online-Kontrolle (https://conradinjoos-lab.github.io/schrittli/kontrolle/) liest und schreibt dort.

Aufruf:  python werkzeug/werkstatt.py              abgleichen: holen, Filmstreifen + Liste erneuern, hochladen
         python werkzeug/werkstatt.py --einrichten  einmalig: werkzeug/entwurf zum Klon machen

Pro Video legt es neben video.json, brief.md und blatt-*.jpg ab:
  analyse.json   Kopie aus werkzeug/cache (Transkript, Bildwechsel) plus _bilder = Anzahl Einzelbilder
  streifen.jpg   alle Einzelbilder klein (160×90, 20 pro Zeile) für Filmstreifen und Zeitleiste
Dazu im Wurzelordner liste.json (eine Zeile pro Video), vorschau.jpg (ein Bild pro Video) und meta.json (Verfahren, Vokabular).
"""
import json, re, subprocess, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from kontrolle import CACHE, ENTWURF, lies, schreibe_json, status, themen, vokabular, ID_MUSTER

REPO = 'https://github.com/conradinjoos-lab/schrittli-werkstatt.git'
SPALTEN, B, H = 20, 160, 90          # Filmstreifen
VB, VH, VSPALTEN = 256, 144, 16      # Vorschau
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
            'entwurf': bool(v), 'schritte': len(steps), 'brief': (d / 'brief.md').exists(), 'status': status(v),
            'area': (v or {}).get('areaId') or '', 'bild': int(t * (a.get('fps') or 2)) + 1}


def vorschau(liste):
    from PIL import Image
    zeilen = (len(liste) + VSPALTEN - 1) // VSPALTEN
    im = Image.new('RGB', (VSPALTEN * VB, max(1, zeilen) * VH), (245, 248, 251))
    for i, e in enumerate(liste):
        fs = bilder(e['id'])
        if not fs: continue
        with Image.open(fs[min(e['bild'], len(fs)) - 1]) as b:
            im.paste(b.convert('RGB').resize((VB, VH), Image.LANCZOS), ((i % VSPALTEN) * VB, (i // VSPALTEN) * VH))
        e['v'] = i
    im.save(ENTWURF / 'vorschau.jpg', 'JPEG', quality=72, optimize=True, progressive=True)


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
    schreibe_json(ENTWURF / 'meta.json', {'themen': themen(), 'vokabular': vokabular()})
    print(f'{len(vids)} Videos, {neu} neue Filmstreifen')


def abgleichen():
    if not (ENTWURF / '.git').exists(): raise SystemExit('Zuerst: python werkzeug/werkstatt.py --einrichten')
    git('add', '-A')
    if git('status', '--porcelain'):
        git('reset', '-q', '--', 'liste.json', 'vorschau.jpg', 'meta.json', pruefen=False)  # abgeleitet, wird neu erzeugt
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
