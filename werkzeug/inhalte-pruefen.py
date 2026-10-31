#!/usr/bin/env python3
"""Übersicht über die Inhalte: python werkzeug/inhalte-pruefen.py [datei] [--alles]

Liest schule/schule.json (oder die genannte Datei) und meldet fehlende Vorschauen, unbekannte Material-IDs,
fehlende Schwierigkeit und unplausible Schrittfolgen. Ändert nichts, Exit-Code immer 0.
Material gilt als bekannt, wenn die ID in MATERIAL (quelle/p2.js) oder in quelle/agenten/VOKABULAR.md steht.
"""
import json, re, sys
from collections import Counter
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
WURZEL = Path(__file__).resolve().parent.parent
LISTE = 12   # Einträge je Abschnitt, mit --alles alle
ZU_ENG = 3   # Sekunden: kürzer ist kein eigener Schritt
ZU_LANG = 420   # Sekunden ohne Stopp


def material_app():
    t = (WURZEL / 'quelle' / 'p2.js').read_text(encoding='utf-8')
    m = re.search(r'const MATERIAL=\{(.*?)\};', t, re.S)
    return set(re.findall(r"(?:^|,)\s*([a-z0-9_]+):\[", m.group(1))) if m else set()


def material_vokabular():
    t = (WURZEL / 'quelle' / 'agenten' / 'VOKABULAR.md').read_text(encoding='utf-8')
    return {m.group(1) for z in t.splitlines() if (m := re.match(r'^\| ([a-z0-9_]+) \|', z)) and m.group(1) != 'id'}


def vorschauen():
    ordner = WURZEL / 'vorschau'
    try:
        liste = {str(x) for x in json.loads((ordner / 'vorschau.json').read_text(encoding='utf-8')).get('bilder', [])}
    except (OSError, ValueError):
        liste = set()
    return liste, {f.stem for f in ordner.glob('*.webp')}


def sekunden(wert):
    """«2:34» oder Zahl, sonst None"""
    if isinstance(wert, (int, float)):
        return float(wert)
    if isinstance(wert, str) and re.fullmatch(r'\d+(:\d\d){1,2}', wert.strip()):
        s = 0
        for teil in wert.strip().split(':'):
            s = s * 60 + int(teil)
        return float(s)
    return None


def schritte_pruefen(v):
    """Liefert Befunde zu einem Video"""
    st, id_ = v.get('steps') or [], v['id']
    if len(st) < 2:
        return [f'{id_}: {len(st)} Schritte']
    aus = []
    zeiten = [s.get('t') for s in st]
    if any(not isinstance(z, (int, float)) for z in zeiten):
        return [f'{id_}: Schritt ohne Zeit']
    if zeiten[0] > 15:
        aus.append(f'{id_}: Beginn bei {zeiten[0]:g} s')
    for i, (a, b) in enumerate(zip(zeiten, zeiten[1:]), 1):
        if b <= a:
            aus.append(f'{id_}: Schritt {i + 1} rückwärts ({a:g} → {b:g} s)')
        elif b - a < ZU_ENG:
            aus.append(f'{id_}: Schritt {i + 1} nach {b - a:g} s')
        elif b - a > ZU_LANG:
            aus.append(f'{id_}: {b - a:g} s ohne Stopp nach Schritt {i}')
    dauer = sekunden(v.get('dauer'))
    if dauer and zeiten[-1] >= dauer:
        aus.append(f'{id_}: Schritt {len(st)} nach Videoende ({zeiten[-1]:g} s, Dauer {v.get("dauer")})')
    namen = [str(s.get('label') or '').strip() for s in st]
    if not all(namen):
        aus.append(f'{id_}: Schritt ohne Text')
    for n, k in Counter(x for x in namen if x).items():
        if k > 1:
            aus.append(f'{id_}: {k}× «{n}»')
    return aus


def abschnitt(titel, zeilen, alles):
    print(f'\n{titel}: {len(zeilen)}')
    for z in (zeilen if alles else zeilen[:LISTE]):
        print('  ' + z)
    if not alles and len(zeilen) > LISTE:
        print(f'  … {len(zeilen) - LISTE} weitere (--alles)')


def haupt():
    argumente = [a for a in sys.argv[1:] if a != '--alles']
    alles = '--alles' in sys.argv
    datei = Path(argumente[0]) if argumente else WURZEL / 'schule' / 'schule.json'
    daten = json.loads(datei.read_text(encoding='utf-8'))
    videos = daten.get('videos', [])
    app, vok = material_app(), material_vokabular()
    liste, dateien = vorschauen()
    yt = [v for v in videos if (v.get('source') or {}).get('type') == 'youtube']
    ids = {(v.get('source') or {}).get('id') for v in yt}

    ohne_liste = [f"{v['id']}: {v['source'].get('id')}" for v in yt if v['source'].get('id') not in liste]
    ohne_datei = sorted(f'{b}: in vorschau.json, Datei fehlt' for b in liste - dateien)

    fremd, nur_app, nur_vok = Counter(), Counter(), Counter()
    wo = {}
    for v in videos:
        for m in v.get('material') or []:
            wo.setdefault(m, []).append(v['id'])
            (fremd if m not in app and m not in vok else nur_app if m not in vok else nur_vok if m not in app else Counter())[m] += 1
    zeile = lambda z: [f"{m}: {k}× ({', '.join(wo[m][:3])}{' …' if k > 3 else ''})" for m, k in z.most_common()]

    schwer = [f"{v['id']}: {v.get('niveau')!r}" for v in videos if v.get('niveau') not in (1, 2, 3)]
    folge = [z for v in videos for z in schritte_pruefen(v)]
    doppelt = [f'{i}: {k}×' for i, k in Counter(v['id'] for v in videos).items() if k > 1]

    print(f"{datei.name}, Stand {daten.get('stand')}: {len(videos)} Videos, {len(yt)} YouTube")
    print(f'Material: {len(app)} in p2.js, {len(vok)} im Vokabular, {sum(len(l) for l in wo.values())} Einträge')
    abschnitt('Ohne Vorschau', ohne_liste, alles)
    abschnitt('Vorschau ohne Datei', ohne_datei, alles)
    abschnitt('Unbekanntes Material', zeile(fremd), alles)
    abschnitt('Material nur in p2.js', zeile(nur_app), alles)
    abschnitt('Material nur im Vokabular', zeile(nur_vok), alles)
    abschnitt('Ohne Schwierigkeit', schwer, alles)
    abschnitt('Unplausible Schritte', folge, alles)
    abschnitt('Doppelte IDs', doppelt, alles)
    print(f'\nVorschauen ohne Video in {datei.name}: {len((liste & dateien) - ids)}')
    return 0


if __name__ == '__main__':
    sys.exit(haupt())
