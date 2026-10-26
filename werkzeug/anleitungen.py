#!/usr/bin/env python3
"""Schrittli – Prüfung der Foto-Anleitungen (anleitungen/anleitungen.json) ohne Browser.

Aufruf:  python werkzeug/anleitungen.py

Prüft: Pflichtfelder, eindeutige id (auch gegenüber schule/schule.json), areaId, Stufen, Material aus dem Vokabular,
jeder Schritt mit Text und 1–2 Fotos, alle Fotos und Vorlagen (PDF) vorhanden, keine verwaisten Fotos im Ordner.
Fehler (!) müssen weg, Hinweise (?) sind eine Prüfbitte.
"""
import json, re, sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
WURZEL = Path(__file__).resolve().parent.parent
ANL = WURZEL / 'anleitungen'
AREAS = 'naehen sticken haekeln stricken weben perlen knuepfen wickeln filzen falten schneiden holz schnitzen formen drucken experimente'.split()
FELDER = {'text', 'bilder', 'bildtext', 'achtung', 'tipp', 'frage', 'zeigen', 'vorlage'}


def vokabular():
    ids = set()
    for z in (WURZEL / 'quelle' / 'agenten' / 'VOKABULAR.md').read_text(encoding='utf-8').splitlines():
        m = re.match(r'^\| ([a-z]+) \|', z)
        if m and m.group(1) != 'id': ids.add(m.group(1))
    return ids


def main():
    j = json.loads((ANL / 'anleitungen.json').read_text(encoding='utf-8'))
    vok = vokabular()
    schule = {v['id'] for v in json.loads((WURZEL / 'schule' / 'schule.json').read_text(encoding='utf-8')).get('videos', [])}
    fehler = 0; gesehen = set(); benutzt = {}
    for a in j.get('anleitungen', []):
        aid = a.get('id', '?'); out = []
        for k in ('id', 'title', 'areaId', 'stufen', 'steps'):
            if not a.get(k): out.append(f'! {k} fehlt')
        if aid in gesehen: out.append('! id doppelt')
        if aid in schule: out.append('! id gibt es schon als Video in schule.json')
        gesehen.add(aid)
        if a.get('areaId') not in AREAS: out.append(f"! areaId «{a.get('areaId')}» unbekannt")
        if not all(isinstance(s, int) and 1 <= s <= 6 for s in a.get('stufen', [])): out.append('! stufen nur 1–6')
        for m in a.get('material', []):
            if m not in vok: out.append(f'? Material «{m}» nicht im Vokabular (Paket-Symbol)')
        ordner = ANL / (a.get('ordner') or aid)
        if not ordner.is_dir(): out.append(f'! Ordner {ordner.name}/ fehlt')
        bilder = ([a['titelbild']] if a.get('titelbild') else [])
        if not a.get('titelbild'): out.append('? kein titelbild')
        for n, s in enumerate(a.get('steps', []), 1):
            if not str(s.get('text', '')).strip(): out.append(f'! Schritt {n}: Text fehlt')
            if not 1 <= len(s.get('bilder', [])) <= 2: out.append(f'! Schritt {n}: 1 oder 2 Fotos')
            if set(s) - FELDER: out.append(f"? Schritt {n}: unbekannte Felder {sorted(set(s) - FELDER)}")
            if len(str(s.get('text', '')).split()) > 30: out.append(f'? Schritt {n}: Text über 30 Wörter')
            if 'ß' in json.dumps(s, ensure_ascii=False): out.append(f'! Schritt {n}: ß statt ss')
            bilder += s.get('bilder', [])
            if s.get('vorlage') and not a.get('vorlagen'): out.append(f'! Schritt {n}: vorlage, aber keine vorlagen')
        for v in a.get('vorlagen', []):
            if not str(v.get('datei', '')).endswith('.pdf') or not v.get('name'): out.append('! vorlagen: datei (.pdf) und name nötig')
            bilder.append(v.get('datei', ''))
        for b in bilder:
            if not (ordner / b).is_file(): out.append(f'! Datei {ordner.name}/{b} fehlt')
        benutzt.setdefault(ordner, set()).update(bilder)
        fehler += sum(x.startswith('!') for x in out)
        print(f"{aid}: {len(a.get('steps', []))} Schritte" + ('' if out else ' – ok'))
        for x in out: print('   ', x)
    for ordner, b in benutzt.items():
        rest = sorted(p.name for p in ordner.glob('*') if p.is_file() and p.name not in b) if ordner.is_dir() else []
        if rest: print(f'? {ordner.name}/: nicht benutzt: {", ".join(rest)}')
    sys.exit(1 if fehler else 0)


if __name__ == '__main__':
    main()
