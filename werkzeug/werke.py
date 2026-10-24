#!/usr/bin/env python3
"""Schrittli – Hall of Fame: Fotos von fertigen Arbeiten.

Aufruf:  python werkzeug/werke.py [<Ordner mit neuen Fotos>]

Privat (nur Kontrolle, Repo schrittli-werkstatt):  werkzeug/entwurf/werke/<datei>.jpg + klein/<datei>.jpg + werke.json
  Neue Fotos aus dem Ordner werden verkleinert (lange Seite 1600 px), gedreht wie aufgenommen und ohne EXIF/GPS
  abgelegt; in werke.json bekommen sie einen leeren Titel. Screenshots gelten als «Idee».
Öffentlich (App, «Das haben andere gemacht»):  werke/<name>.jpg + werke/werke.json im App-Repo
  Nur Einträge mit "oeffentlich": true – also ohne Kinder, ohne Hände, keine Screenshots. "zuschnitt": [links, oben,
  rechts, unten] als Anteile 0–1 schneidet Ränder mit Personen weg. Wird bei jedem Aufruf ganz neu erzeugt.
Danach: python werkzeug/werkstatt.py (privat hochladen); werke/ im App-Repo committen.
"""
import json, re, sys
from pathlib import Path
from PIL import Image, ImageOps

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
WURZEL = Path(__file__).resolve().parent.parent
PRIVAT = WURZEL / 'werkzeug' / 'entwurf' / 'werke'
OEFFENTLICH = WURZEL / 'werke'


def lies():
    try: return json.loads((PRIVAT / 'werke.json').read_text(encoding='utf-8'))
    except FileNotFoundError: return {'werke': []}


def schreibe(p, d):
    p.write_text(json.dumps(d, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')


def sauber(quelle, ziel, lang, zuschnitt=None, qualitaet=82):
    """Drehen nach EXIF, zuschneiden, verkleinern, ohne Metadaten speichern."""
    with Image.open(quelle) as b:
        b = ImageOps.exif_transpose(b).convert('RGB')
        if zuschnitt:
            l, o, r, u = zuschnitt
            b = b.crop((round(l * b.width), round(o * b.height), round(r * b.width), round(u * b.height)))
        b.thumbnail((lang, lang), Image.LANCZOS)
        k = Image.new('RGB', b.size); k.paste(b)  # frische Kopie: keine EXIF-, GPS- oder ICC-Daten
        k.save(ziel, 'JPEG', quality=qualitaet, optimize=True, progressive=True)


def aufnehmen(ordner, d):
    vorhanden = {w.get('quelle') for w in d['werke']}
    neu = 0
    for p in sorted(Path(ordner).glob('*.jp*g')):
        if p.name in vorhanden: continue
        idee = p.name.lower().startswith('screenshot')
        m = re.search(r'(20\d\d)(\d\d)(\d\d)[_-](\d{6})', p.name)
        datum = f'{m[1]}-{m[2]}-{m[3]}' if m else ''
        datei = ('idee-' if idee else '') + (f'{m[1]}{m[2]}{m[3]}-{m[4]}' if m else p.stem.lower()) + '.jpg'
        sauber(p, PRIVAT / datei, 1600)
        sauber(PRIVAT / datei, PRIVAT / 'klein' / datei, 480, qualitaet=75)
        d['werke'].append({'datei': datei, 'quelle': p.name, 'datum': datum, 'titel': '', 'bereich': '', 'idee': idee, 'oeffentlich': False})
        neu += 1
    print(f'{neu} neue Fotos aufgenommen')


def veroeffentlichen(d):
    OEFFENTLICH.mkdir(exist_ok=True)
    for alt in OEFFENTLICH.glob('*.jpg'): alt.unlink()
    out, namen = [], set()
    for w in d['werke']:
        if not w.get('oeffentlich') or w.get('idee'): continue
        name = re.sub(r'[^a-z0-9]+', '-', w['titel'].lower().translate(str.maketrans({'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'é': 'e', 'è': 'e'}))).strip('-') or 'werk'
        while name + '.jpg' in namen: name += '-2'
        namen.add(name + '.jpg')
        sauber(PRIVAT / w['datei'], OEFFENTLICH / (name + '.jpg'), 1000, w.get('zuschnitt'), 78)
        out.append({'bild': name + '.jpg', 'titel': w['titel'], 'bereich': w.get('bereich', '')})
    schreibe(OEFFENTLICH / 'werke.json', {'werke': out})
    print(f'{len(out)} Fotos öffentlich in werke/')


if __name__ == '__main__':
    (PRIVAT / 'klein').mkdir(parents=True, exist_ok=True)
    d = lies()
    if len(sys.argv) > 1: aufnehmen(sys.argv[1], d)
    for w in d['werke']:
        if not (PRIVAT / 'klein' / w['datei']).exists(): sauber(PRIVAT / w['datei'], PRIVAT / 'klein' / w['datei'], 480, qualitaet=75)
    schreibe(PRIVAT / 'werke.json', d)
    veroeffentlichen(d)
