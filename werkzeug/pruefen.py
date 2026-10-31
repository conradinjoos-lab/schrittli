#!/usr/bin/env python3
"""Schrittli – Regelprüfung für Entwürfe (werkzeug/entwurf/<ID>/video.json) ohne Browser.

Aufruf:  python werkzeug/pruefen.py [<VIDEOID> …]      (ohne Argumente: alle Entwürfe)

Prüft die Regeln aus SCHRITTE-LOKAL.md: Pflichtfelder, areaId, Stufen, Titel ≤ 5 Wörter, Material nur aus dem
Vokabular (max 8), erster Schritt bei 0, Reihenfolge, Abstand ≥ 3 s, Labels ≤ 8 Wörter / kein ß / keine Anführungszeichen,
kurz vorhanden und ≤ 4 Wörter, letzter Schritt «Fertig …», Anzahl Schritte zur Dauer. Fehler (!) müssen weg, Hinweise (?) sind eine Prüfbitte.
"""
import json, re, sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
WURZEL = Path(__file__).resolve().parent.parent
ENTWURF = WURZEL / 'werkzeug' / 'entwurf'
CACHE = WURZEL / 'werkzeug' / 'cache'
AREAS = 'naehen sticken haekeln haekeln stricken weben perlen knuepfen wickeln filzen falten schneiden holz schnitzen formen drucken experimente'.split()


def vokabular():
    ids = set()
    for z in (WURZEL / 'quelle' / 'agenten' / 'VOKABULAR.md').read_text(encoding='utf-8').splitlines():
        m = re.match(r'^\| ([a-z]+) \|', z)
        if m and m.group(1) != 'id': ids.add(m.group(1))
    return ids


def belegt():
    """id → Video-IDs, die sie schon tragen (schule.json und alle Entwürfe); Veröffentlichen ersetzt nach id."""
    out = {}
    try: schule = json.loads((WURZEL / 'schule' / 'schule.json').read_text(encoding='utf-8'))['videos']
    except Exception: schule = []
    for e in schule: out.setdefault(e.get('id'), set()).add((e.get('source') or {}).get('id'))
    for p in ENTWURF.glob('*/video.json'):
        try: out.setdefault(json.loads(p.read_text(encoding='utf-8')).get('id'), set()).add(p.parent.name)
        except Exception: pass
    return out


def kurztexte():
    """Video-ID → {label: kurz} aus schule.json; dort stehen die Kurztexte veröffentlichter Videos."""
    try: schule = json.loads((WURZEL / 'schule' / 'schule.json').read_text(encoding='utf-8'))['videos']
    except Exception: return {}
    return {(e.get('source') or {}).get('id'): {s.get('label'): s.get('kurz') for s in e.get('steps') or []} for e in schule}


BELEGT = None
KURZ = None


def pruefe(vid, vok):
    global BELEGT, KURZ
    BELEGT = BELEGT or belegt()
    KURZ = KURZ if KURZ is not None else kurztexte()
    p = ENTWURF / vid / 'video.json'
    if not p.exists(): return [f'! kein Entwurf ({p.relative_to(WURZEL)})']
    try: v = json.loads(p.read_text(encoding='utf-8'))
    except Exception as ex: return [f'! JSON kaputt: {ex}']
    a = {}
    try: a = json.loads((CACHE / vid / 'analyse.json').read_text(encoding='utf-8'))
    except Exception: pass
    out = []
    f = lambda s: out.append('! ' + s)
    h = lambda s: out.append('? ' + s)
    for k in ('id', 'areaId', 'stufen', 'title', 'source', 'kanal', 'dauer', 'sprache', 'hinweis', 'material', 'steps', 'task'):
        if k not in v: f(f'Feld fehlt: {k}')
    if not re.fullmatch(r'[a-z]+-[a-z0-9-]+', v.get('id', '')): f(f'id «{v.get("id")}» ungültig (klein, Bindestriche)')
    elif not re.match(r'(zw|ex)-', v.get('id', '')): h(f'id «{v.get("id")}» beginnt nicht mit zw-/ex- (nur für bestehende Einträge in Ordnung)')
    if v.get('areaId') not in AREAS: f(f'areaId «{v.get("areaId")}» unbekannt')
    if 'zeit' in v and not (isinstance(v['zeit'], int) and 1 <= v['zeit'] <= 15): f(f'zeit {v.get("zeit")} ungültig (ganze Minuten 1–15, nur Mini-Projekte)')
    if 'niveau' not in v: h('niveau fehlt (1 leicht, 2 mittel, 3 anspruchsvoll)')
    elif v['niveau'] not in (1, 2, 3): f(f'niveau {v.get("niveau")} ungültig (1–3)')
    if 'grundtechnik' in v and not isinstance(v['grundtechnik'], bool): f('grundtechnik muss true oder false sein')
    if 'techniken' in v and not (isinstance(v['techniken'], list) and all(isinstance(t, str) and t == t.lower() for t in v['techniken'])): f('techniken: Liste mit Begriffen in Kleinbuchstaben')
    if v.get('areaId') == 'experimente' and not v.get('id', '').startswith('ex-'): h('Experiment, aber id nicht ex-…')
    st = v.get('stufen') or []
    if not st or not all(isinstance(s, int) and 1 <= s <= 6 for s in st): f(f'stufen {st} ungültig (1–6)')
    if (v.get('source') or {}).get('id') != vid: f('source.id stimmt nicht mit dem Ordner überein')
    andere = sorted(BELEGT.get(v.get('id'), set()) - {vid})
    if andere: f(f'id «{v.get("id")}» trägt schon {", ".join(andere)} – Veröffentlichen würde es ersetzen')
    if len((v.get('title') or '').split()) > 5: f(f'Titel hat mehr als 5 Wörter: {v.get("title")}')
    if v.get('sprache') not in ('Hochdeutsch', 'Schweizerdeutsch', 'ohne Sprache', 'Englisch'): f(f'sprache «{v.get("sprache")}» unbekannt')
    if not (v.get('hinweis') or '').strip(): h('Hinweis für die Lehrperson fehlt')
    mat = v.get('material') or []
    if not mat: f('Material leer')
    if len(mat) > 8: f(f'{len(mat)} Material-IDs, höchstens 8')
    for m in mat:
        if m not in vok: f(f'Material «{m}» nicht im Vokabular')
    if (v.get('task') or {}).get('text'): h(f'Aufgabe gesetzt: {v["task"]["text"][:60]}')
    steps = v.get('steps') or []
    dauer = a.get('dauer')
    if dauer:
        mind, maxd = (6, 10) if dauer <= 300 else (6, 12)
        if dauer < 60: mind = 3
        if not mind <= len(steps) <= maxd: h(f'{len(steps)} Schritte bei {dauer} s (Regel {mind}–{maxd})')
    if steps and steps[0].get('t') != 0 and not v.get('material'): f(f'erster Schritt bei {steps[0].get("t")} statt 0')
    if steps and not steps[0].get('label', '').startswith('Material richten'): h('erstes Label beginnt nicht mit «Material richten:»')
    if steps and not steps[-1].get('label', '').startswith('Fertig'): f('letztes Label beginnt nicht mit «Fertig»')
    if steps and dauer and steps[-1]['t'] > dauer - 2: f(f'letzter Schritt {steps[-1]["t"]} liegt praktisch am Videoende ({dauer} s)')
    for i, s in enumerate(steps):
        lab = (s.get('label') or '').strip(); t = s.get('t')
        if not lab: f(f'Schritt {i+1}: Label leer')
        if re.match(r'zuschau', lab, re.I): f(f'Schritt {i+1}: «Zuschauen» ist nie ein Schritt: {lab}')
        if len(lab.split()) > 8: f(f'Schritt {i+1}: {len(lab.split())} Wörter: {lab}')
        if 'ß' in lab: f(f'Schritt {i+1}: ß → ss: {lab}')
        if re.search(r'[«»"„“”‚‘’\']', lab): f(f'Schritt {i+1}: Anführungszeichen: {lab}')
        if re.search(r'[\U0001F300-\U0001FAFF☀-➿]', lab): f(f'Schritt {i+1}: Emoji: {lab}')
        kurz = (s.get('kurz') or KURZ.get(vid, {}).get(lab) or '').strip()
        if lab and not kurz and not v.get('_weglassen'): h(f'Schritt {i+1}: kurz fehlt: {lab}')
        woerter = len([w for w in kurz.split() if re.search(r'\w', w)])  # «Fertig – dein Werk!»: Der Strich ist kein Wort
        if woerter > 4: h(f'Schritt {i+1}: kurz hat {woerter} Wörter: {kurz}')
        if not isinstance(t, (int, float)) or round(t, 1) != t: f(f'Schritt {i+1}: t {t} nicht auf eine Dezimale')
        if i and isinstance(t, (int, float)) and isinstance(steps[i-1].get('t'), (int, float)):
            d = t - steps[i-1]['t']
            if d <= 0: f(f'Schritt {i+1}: t {t} nicht nach Schritt {i} ({steps[i-1]["t"]})')
            elif d < 3: h(f'Schritt {i+1}: nur {d:.1f} s nach Schritt {i}')
        if dauer and isinstance(t, (int, float)) and t > dauer: f(f'Schritt {i+1}: t {t} liegt nach dem Videoende ({dauer} s)')
        bw = [x[0] for x in a.get('bildwechsel', [])]
        if i and bw and isinstance(t, (int, float)) and min((abs(t - b) for b in bw), default=99) > 1.5:
            h(f'Schritt {i+1}: kein Bildwechsel innerhalb 1.5 s von {t}')
    return out


if __name__ == '__main__':
    ids = [a for a in sys.argv[1:] if not a.startswith('--')] or sorted(d.name for d in ENTWURF.iterdir() if d.is_dir() and (d / 'video.json').exists())
    vok = vokabular(); fehler = 0
    for vid in ids:
        m = pruefe(vid, vok)
        fehler += sum(1 for x in m if x.startswith('!'))
        print(f'{vid}: ' + ('ok' if not m else f'{sum(1 for x in m if x.startswith("!"))} Fehler, {sum(1 for x in m if x.startswith("?"))} Hinweise'))
        for x in m: print('   ' + x)
    sys.exit(1 if fehler else 0)
