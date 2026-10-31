#!/usr/bin/env python3
"""LP21-Zuordnung für die Schulversion: schreibt schule/lp21.json.

Jedes Video aus schule/schule.json und jede Foto-Anleitung aus anleitungen/anleitungen.json
bekommt die Kompetenzen aus dem Lehrplan 21, Textiles und Technisches Gestalten (TTG),
die das Werkstück abdeckt. Die Zuordnung entsteht aus Regeln (Techniken, Material, Titel,
Projektart) plus wenigen Ausnahmen von Hand (HAND unten). schule.json bleibt unverändert.

  python werkzeug/lp21.py              Zuordnung neu schreiben (Kompetenztexte bleiben)
  python werkzeug/lp21.py --pruefen    nur prüfen, nichts schreiben
  python werkzeug/lp21.py --texte F    Kompetenztexte aus F übernehmen (geparst von zh.lehrplan.ch)

Neue Videos: einfach wieder laufen lassen. Ohne Treffer meldet das Skript das Video.
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ZIEL = ROOT / 'schule' / 'lp21.json'

# Kurztitel je Kompetenz bzw. Aufbau. Nur diese werden zugeordnet.
TITEL = {
    'TTG.2.A.2':   'Experimentieren und Produktideen entwickeln',
    'TTG.2.B.1.1': 'Funktion und Konstruktion: Spiel und Freizeit',
    'TTG.2.B.1.2': 'Funktion und Konstruktion: Mode und Bekleidung',
    'TTG.2.B.1.3': 'Funktion und Konstruktion: Bau und Wohnbereich',
    'TTG.2.B.1.4': 'Funktion und Konstruktion: Mechanik und Transport',
    'TTG.2.B.1.5': 'Funktion und Konstruktion: Elektrizität und Energie',
    'TTG.2.C.1.1': 'Gestaltungselemente: Material und Oberfläche',
    'TTG.2.C.1.2': 'Gestaltungselemente: Form',
    'TTG.2.C.1.3': 'Gestaltungselemente: Farbe',
    'TTG.2.D.1.1': 'Verfahren: Trennen',
    'TTG.2.D.1.2': 'Verfahren: Umformen',
    'TTG.2.D.1.3': 'Verfahren: Verbinden',
    'TTG.2.D.1.4': 'Verfahren: Flächen bilden (textil)',
    'TTG.2.D.1.5': 'Verfahren: Oberfläche verändern',
    'TTG.2.E.1.1': 'Material',
    'TTG.2.E.1.2': 'Werkzeuge und Maschinen',
    'TTG.3.B.2':   'Materialgewinnung und Entsorgung',
    'TTG.3.B.4':   'Geräte sicher bedienen',
}
# Gelten bei jedem Werkstück (Prozess und Reflexion) – werden einmal oben angezeigt, nicht pro Video.
IMMER = {
    'TTG.2.A.3': 'Planen und herstellen',
    'TTG.1.B.1': 'Prozess und Produkt begutachten und weiterentwickeln',
    'TTG.1.B.2': 'Prozess und Produkt dokumentieren und präsentieren',
}

# Regeln auf Techniken, Material und Titel (klein geschrieben, Umlaute als ae/oe/ue und als ä/ö/ü).
REGELN = [
    (r'schneid|reiss|lochen|loecher|löcher|ausstech|stechen|trennen', ['TTG.2.D.1.1']),
    (r'saeg|säg', ['TTG.2.D.1.1', 'TTG.2.E.1.2']),
    (r'bohr|ahle', ['TTG.2.D.1.1', 'TTG.2.E.1.2']),
    (r'schnitz|kerbschnitt|gegenschnitt|taschenmesser', ['TTG.2.D.1.1', 'TTG.2.E.1.2']),
    (r'falt|faecher|fächer|hexentreppe|ziehharmonika|pop-up|origami', ['TTG.2.D.1.2']),
    (r'knuepf|knüpf|knoten|kordel|makramee|schleife|paracord|zwirn|fadenspiel', ['TTG.2.D.1.2']),
    (r'feil|raspel|schleifen|schleifpapier|schmirgel', ['TTG.2.D.1.2', 'TTG.2.E.1.2']),
    (r'modell|daumenschale|wulst|eindr|ueberform|überform|hohlkugel|hohlform|tonplatte|plattentechnik|kneten|salzteig|pappmach|halbkugel|tonblock', ['TTG.2.D.1.2', 'TTG.2.C.1.2']),
    (r'schlicker|tonteile verbinden|ton verbinden', ['TTG.2.D.1.3']),
    (r'biegen|draht', ['TTG.2.D.1.2']),
    (r'giess|gips|granulat', ['TTG.2.D.1.2']),
    (r'praeg|präg', ['TTG.2.D.1.2', 'TTG.2.C.1.1']),
    (r'vorstich|naeh|näh|saum|knopf|schnuer|schnür|kraeusel|kräusel|ueberwendling|überwendling|schlingstich|einfaedeln|einfädeln', ['TTG.2.D.1.3']),
    (r'nagel|nageln|hammer', ['TTG.2.D.1.3', 'TTG.2.E.1.2']),
    (r'kleb|leim', ['TTG.2.D.1.3']),
    (r'heissleim|heisskleb', ['TTG.3.B.4']),
    (r'naehmaschine|nähmaschine', ['TTG.2.E.1.2', 'TTG.3.B.4']),
    (r'perlen f|perlen auff|ueberkreuz|überkreuz|draht kreuzen', ['TTG.2.D.1.3']),
    (r'mosaik|verfugen', ['TTG.2.D.1.3', 'TTG.2.C.1.2']),
    (r'wickel|pompon|bommel|quaste', ['TTG.2.D.1.2']),
    (r'web|kette spannen|kettfaden', ['TTG.2.D.1.4']),
    (r'webrahmen|brettchen', ['TTG.2.E.1.2']),
    (r'strick|masche|abkett|strickliesel|strickgabel', ['TTG.2.D.1.4']),
    (r'haekel|häkel|fadenring|staebchen|stäbchen', ['TTG.2.D.1.4']),
    (r'nassfilz|trockenfilz', ['TTG.2.D.1.4', 'TTG.2.C.1.1']),
    (r'nadelfilz|ausstechform', ['TTG.2.D.1.5', 'TTG.2.C.1.1']),
    (r'flecht|zopf|scoubidou|nestel', ['TTG.2.D.1.4']),
    (r'zierstich|sticken|stich sticken|steppstich|kettenstich|kreuzstich|perlen aufn', ['TTG.2.D.1.5']),
    (r'druck|stempel|frottage|monotypie', ['TTG.2.D.1.5', 'TTG.2.C.1.3']),
    (r'aquarell|malen|bemal|acryl|fliess|lasier|dot painting|schwammtupf|ausmalen', ['TTG.2.D.1.5', 'TTG.2.C.1.3']),
    (r'glasur|glasier|engob', ['TTG.2.D.1.5', 'TTG.2.C.1.3']),
    (r'batik|faerb|färb|abbinden|naturfarbe|marmor', ['TTG.2.D.1.5', 'TTG.2.C.1.3']),
    (r'schrumpffolie|stoff bespannen', ['TTG.2.C.1.1']),
    (r'experiment', ['TTG.2.A.2']),
    (r'schwerpunkt|balancier|kreisel|scharnier|klappe|drehachse|bewegliche figur|briefmarkentrick|zappel', ['TTG.2.B.1.4']),
    (r'karton biegen|verstaerk|verstärk', ['TTG.2.B.1.3']),
]
# Projektart (gruppe) und Titel → Funktion/Konstruktion (2.B.1)
FUNKTION = [
    (r'spielzeug|figuren|tiere|häkelhase|haekelhase|wickelfiguren|fadenspiel|spiel|puppe|kreisel|geist|gespenst|wichtel|zwerg|crossboccia|würfel|wuerfel|tic tac|regenmacher', 'TTG.2.B.1.1'),
    (r'freundschaft|schmuck|armband|bändeli|baendeli|anhänger|anhaenger|paracord|maske|halskette', 'TTG.2.B.1.2'),
    (r'gefässe|gefaesse|schachtel|nützlich|nuetzlich|(?<!fang)becher(?!puppe)|schale|teller|dose|korb|mäppchen|maeppchen|säckchen|saeckchen|etui|olla|nisthilfe|futterhaus|untersetzer|vase|tränke|traenke|haken|ablage|kerze|laterne|nadelkissen|eierbecher|seifenschale|palette|nest', 'TTG.2.B.1.3'),
    (r'luft und fliegen|flieger|windrad|propeller|fallschirm|auto|(?<!web)schiff|wassermühle|wassermuehle|rakete|fangbecher|frosch', 'TTG.2.B.1.4'),
    (r'strom|elektro', 'TTG.2.B.1.5'),
]
# Material, das im LP21 eigens genannt ist (2.E.1.1), und Wiederverwertung/Naturmaterial (3.B.2)
MATERIAL = [
    (r'^(holz|schnitzen)$', 'TTG.2.E.1.1'),
    (r'ton|draht|metall|gips|kerze|wachs', 'TTG.2.E.1.1'),
]
KREISLAUF = r'plastikgarn|plastiktüt|plastiktuet|t-shirt|zeitungsstreifen|aus zeitung|papiertüte|papiertuete|klorolle|kerzenrest|socken|naturmaterial|herbstbl|herbstlaub|\blaub\b|laubbl|blätterdruck|aus blättern|mit blättern|kastanie|haselnuss|nüsse|nuesse|\bast\b|\bäste|\baeste|zweige|baumscheibe|\bmoos\b'

# Ausnahmen von Hand: id → Liste (ersetzt die Regeln) oder {'plus': [...], 'minus': [...]}
HAND = {
    'raketenstation-1': ['TTG.2.D.1.1', 'TTG.2.D.1.2', 'TTG.2.D.1.3', 'TTG.2.E.1.1', 'TTG.2.E.1.2', 'TTG.2.B.1.4'],
    'raketenstation-2': ['TTG.2.D.1.3', 'TTG.2.D.1.5', 'TTG.2.C.1.3', 'TTG.2.B.1.4'],
    'stifteetui-ungefuettert': ['TTG.2.D.1.1', 'TTG.2.D.1.3', 'TTG.2.E.1.2', 'TTG.3.B.4', 'TTG.2.B.1.3', 'TTG.2.C.1.1'],
    'stifteetui-gefuettert': ['TTG.2.D.1.1', 'TTG.2.D.1.3', 'TTG.2.E.1.2', 'TTG.3.B.4', 'TTG.2.B.1.3', 'TTG.2.C.1.1'],
    'zw-origami-tulpe-mit-blaettern': {'minus': ['TTG.3.B.2']},
    'ex-magnet': {'minus': ['TTG.2.D.1.3']},
    'ex-stromkreis-kupferband': {'minus': ['TTG.2.D.1.3']},
    'ex-elektromotor': {'plus': ['TTG.2.B.1.4']},
    'ex-tag-nacht': ['TTG.2.A.2'],
    'ex-moos': ['TTG.2.A.2', 'TTG.2.C.1.1'],
    'ex-eier-zwiebelschalen': ['TTG.2.D.1.5', 'TTG.2.C.1.3', 'TTG.3.B.2'],
    'zw-ton-regeln': ['TTG.2.E.1.1', 'TTG.2.D.1.2'],
    'zw-schnitzregeln': ['TTG.2.E.1.2', 'TTG.2.D.1.1'],
    'zw-nadel-einfaedeln': ['TTG.2.D.1.3', 'TTG.2.E.1.2'],
    'zw-pusteblume-deko': {'plus': ['TTG.2.C.1.1']},
    'zw-sonnenfaenger-leim': ['TTG.2.D.1.2', 'TTG.2.D.1.5', 'TTG.2.C.1.3'],
    'zw-kleister-pappmache': ['TTG.2.D.1.2', 'TTG.2.E.1.1'],
    'zw-schneiden-trennen-loecher': {'plus': ['TTG.2.E.1.2']},
    'zw-froebelstern-streifen': ['TTG.2.D.1.2', 'TTG.2.C.1.2'],
    'zw-taschengriff-cobra': ['TTG.2.D.1.2', 'TTG.2.B.1.2'],
    'zw-brettchenweben-perlen': ['TTG.2.D.1.4', 'TTG.2.E.1.2', 'TTG.2.B.1.2'],
    'natur-schaumscheibe': ['TTG.2.A.2', 'TTG.2.C.1.1'],
}

ORDNUNG = list(TITEL)


def zh_link(code):
    """Link auf die Kompetenz bei zh.lehrplan.ch (a|7|2 = TTG, dann Bereich|Teil|Nummer)."""
    m = re.match(r'TTG\.(\d)\.([A-E])\.(\d)', code)
    return 'https://zh.lehrplan.ch/index.php?code=a|7|2|%s|%d|%s' % (m.group(1), 'ABCDE'.index(m.group(2)) + 1, m.group(3))


def texte_aus(datei):
    """Stufentexte Zyklus 1 und 2 aus der geparsten Lehrplan-Datei, gruppiert nach Kompetenz bzw. Aufbau."""
    roh = json.loads(Path(datei).read_text(encoding='utf8'))
    out = {}
    for code in list(TITEL) + list(IMMER):
        basis = re.match(r'TTG\.\d\.[A-E]\.\d', code).group(0)
        stufen = []
        for s in roh[basis]['stufen']:
            if s['zyklus'] > 2:
                continue
            ohne = re.sub(r'\.?[a-z]$', '', s['code'])
            if ohne != code and code not in IMMER:
                continue
            text = re.sub(r'^können die Verfahren erkunden, ', '', s['text'])
            stufen.append({'code': s['code'], 'zyklus': s['zyklus'], 'text': text})
        if not stufen:
            sys.exit('keine Stufen für ' + code)
        out[code] = {'titel': TITEL.get(code) or IMMER[code], 'link': zh_link(code), 'stufen': stufen}
        if code in IMMER:
            out[code]['immer'] = True
    return out


def eintraege():
    s = json.loads((ROOT / 'schule' / 'schule.json').read_text(encoding='utf8'))
    a = json.loads((ROOT / 'anleitungen' / 'anleitungen.json').read_text(encoding='utf8'))
    return s['videos'] + a['anleitungen']


def zuordnen(v):
    tech = ' '.join(v.get('techniken') or [])
    mat = ' '.join(v.get('material') or [])
    text = ' | '.join([tech, mat, v.get('title', '')]).lower()
    codes = []
    for muster, cs in REGELN:
        if re.search(muster, text):
            codes += cs
    if v.get('areaId') == 'sticken':
        codes.append('TTG.2.D.1.5')
    if v.get('areaId') == 'naehen':
        codes.append('TTG.2.D.1.3')
    if v.get('areaId') == 'formen' and re.search(r'\bton\b|töpfer|toepfer|keramik|glasier', (v.get('gruppe', '') + ' ' + v.get('title', '')).lower()):
        codes.append('TTG.2.E.1.1')
    wo = (v.get('gruppe', '') + ' | ' + v.get('title', '')).lower()
    for muster, c in FUNKTION:
        if re.search(muster, wo):
            codes.append(c)
    for muster, c in MATERIAL:
        if re.search(muster, v.get('areaId', '')) or (c == 'TTG.2.E.1.1' and re.search(r'draht|metall|gips', text)):
            codes.append(c)
            break
    if re.search(KREISLAUF, text + ' ' + wo):
        codes.append('TTG.3.B.2')
    h = HAND.get(v['id'])
    if isinstance(h, list):
        codes = list(h)
    elif isinstance(h, dict):
        codes = [c for c in codes + h.get('plus', []) if c not in h.get('minus', [])]
    return sorted(set(codes), key=ORDNUNG.index)


def main():
    pruefen = '--pruefen' in sys.argv
    if '--texte' in sys.argv:
        kompetenzen = texte_aus(sys.argv[sys.argv.index('--texte') + 1])
    else:
        kompetenzen = json.loads(ZIEL.read_text(encoding='utf8'))['kompetenzen']
    fehler = []
    zuordnung = {}
    alle = eintraege()
    for v in alle:
        cs = zuordnen(v)
        if not cs:
            fehler.append('%s: keine Kompetenz gefunden' % v['id'])
        for c in cs:
            if c not in kompetenzen:
                fehler.append('%s: unbekannte Kompetenz %s' % (v['id'], c))
        zuordnung[v['id']] = cs
    for c in TITEL:
        if c not in kompetenzen:
            fehler.append('Text fehlt für %s' % c)
    if pruefen and ZIEL.exists():
        alt = json.loads(ZIEL.read_text(encoding='utf8'))['zuordnung']
        weg = sorted(set(alt) - set(zuordnung))
        neu = sorted(set(zuordnung) - set(alt))
        if weg:
            fehler.append('in lp21.json, aber kein Video mehr: ' + ', '.join(weg))
        if neu:
            fehler.append('Video ohne Eintrag in lp21.json (Skript laufen lassen): ' + ', '.join(neu))
        if not weg and not neu and alt != zuordnung:
            fehler.append('lp21.json ist veraltet (Skript laufen lassen)')
    for f in fehler:
        print('FEHLER', f)
    if fehler:
        sys.exit(1)
    if pruefen:
        print('lp21.json ok: %d Einträge' % len(zuordnung))
        return
    zahl = {}
    for cs in zuordnung.values():
        for c in cs:
            zahl[c] = zahl.get(c, 0) + 1
    daten = {
        'quelle': 'Lehrplan 21, Textiles und Technisches Gestalten (Fassung Kanton Zürich, zh.lehrplan.ch). '
                  'Stufen: Zyklus 1 = Kindergarten bis 2. Klasse, Zyklus 2 = 3. bis 6. Klasse.',
        'hinweis': 'Zuordnung von Claude nach Techniken, Material und Projektart (werkzeug/lp21.py), '
                   'von der Lehrperson zu prüfen. Der LP21 setzt im TTG keine Orientierungspunkte pro Klasse.',
        'kompetenzen': kompetenzen,
        'zuordnung': zuordnung,
    }
    roh = json.dumps(daten, ensure_ascii=False, indent=1)
    # Codelisten der Zuordnung auf eine Zeile pro Video
    roh = re.sub(r'\[\n\s+("TTG[^\]]*?)\n\s*\]', lambda m: '[' + re.sub(r'\s*\n\s*', ' ', m.group(1)) + ']', roh)
    ZIEL.write_text(roh + '\n', encoding='utf8')
    print('geschrieben: %s (%d Einträge)' % (ZIEL.relative_to(ROOT), len(zuordnung)))
    for c in ORDNUNG:
        print('  %-12s %4d  %s' % (c, zahl.get(c, 0), TITEL[c]))


if __name__ == '__main__':
    main()
