#!/usr/bin/env python3
"""Schrittli – Kontrolle: Entwürfe prüfen, Stopps auf Zehntelsekunden setzen, in schule.json übernehmen.

Aufruf:  python werkzeug/kontrolle.py [--port 8765]
Dann im Browser:  http://127.0.0.1:8765/

Ohne Browser übernehmen:  python werkzeug/kontrolle.py --uebernehmen <VIDEOID> [<VIDEOID> …]

Seiten: kontrolle/index.html, kontrolle/video.html, kontrolle/werke.html (Hall of Fame) und kontrolle/werkstatt.js (werden bei jedem Aufruf frisch gelesen;
dieselben Seiten laufen online auf GitHub Pages, siehe werkstatt.py). Zeigt pro Entwurf den Player, die Schritte mit Einzelbildern
rund um jeden Stopp, das Transkript und die erkannten Bildwechsel. Speichern schreibt video.json;
«Übernehmen» trägt den Eintrag in schule/schule.json ein (ersetzt einen bestehenden mit gleicher id oder gleichem Video).
"""
import datetime, json, re, sys
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import unquote, urlparse

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
WURZEL = Path(__file__).resolve().parent.parent
CACHE = WURZEL / 'werkzeug' / 'cache'
ENTWURF = WURZEL / 'werkzeug' / 'entwurf'
SCHULE = WURZEL / 'schule' / 'schule.json'
SEITEN = WURZEL / 'kontrolle'
ID_MUSTER = re.compile(r'[A-Za-z0-9_-]{11}')


def themen():
    src = (WURZEL / 'quelle' / 'p2.js').read_text(encoding='utf-8')
    block = src[src.find('const THEMEN='):]
    block = block[:block.find('];')]
    return [list(t) for t in re.findall(r"\{id:'(\w+)',name:'([^']+)'(?:,emoji:'[^']*')?(?:,color:'(#\w+)')?", block)]  # [id, Name, Farbe]


SCHAERFE = {}


def vorschaubild(vid, t, fps):
    """Nummer (ab 1) des schärfsten Einzelbilds in den 2.5 s ab t (Fertig-Schritt) – fürs Vorschaubild.
    Nur Bilder, die dem bei t ähnlich sehen: sonst gewinnt ein Abspann mit Schrift (Text ist «scharf»)."""
    n0 = int(t * fps) + 1
    f = CACHE / vid / 'f'
    kandidaten = [n for n in range(n0, n0 + int(2.5 * fps) + 1) if (f / f'{n:05d}.jpg').exists()]
    if len(kandidaten) < 2: return n0
    from PIL import Image, ImageChops, ImageFilter, ImageStat
    def masse(n):  # (Schärfe, kleines Graubild)
        k = (vid, n)
        if k not in SCHAERFE:
            with Image.open(f / f'{n:05d}.jpg') as b:
                g = b.convert('L')
                SCHAERFE[k] = (ImageStat.Stat(g.filter(ImageFilter.FIND_EDGES)).var[0], g.resize((32, 18)))
        return SCHAERFE[k]
    start = masse(kandidaten[0])[1]
    aehnlich = [n for n in kandidaten if ImageStat.Stat(ImageChops.difference(masse(n)[1], start)).mean[0] < 20]
    return max(aehnlich, key=lambda n: masse(n)[0])


def vokabular():
    out = []
    for zeile in (WURZEL / 'quelle' / 'agenten' / 'VOKABULAR.md').read_text(encoding='utf-8').splitlines():
        m = re.match(r'^\| ([a-z]+) \| ([^|]+) \|', zeile)
        if m and m.group(1) != 'id': out.append([m.group(1), m.group(2).strip()])
    return out


def lies(p, fallback=None):
    try: return json.loads(p.read_text(encoding='utf-8'))
    except Exception: return fallback


def schreibe_json(p, daten):
    text = json.dumps(daten, ensure_ascii=False, indent=1)
    p.write_text(text.replace('\n', '\r\n') + '\r\n', encoding='utf-8', newline='')


def analyse(vid):
    return lies(CACHE / vid / 'analyse.json') or lies(ENTWURF / vid / 'analyse.json')  # Kopie im Werkstatt-Repo, falls online entstanden


def schul_eintrag(vid):
    d = lies(SCHULE, {'videos': []})
    for e in d['videos']:
        if (e.get('source') or {}).get('id') == vid: return e
    return None

def status(v):
    """Drei Häkchen für die Liste: Schritte gesetzt / Angaben vollständig / geprüft."""
    if not v: return [False, False, False]
    steps = v.get('steps') or []
    schritte = len(steps) >= 2 and all((x.get('label') or '').strip() for x in steps)
    angaben = bool(v.get('title') and v.get('areaId') and v.get('stufen') and v.get('material'))
    return [schritte, angaben, bool(v.get('_geprueft'))]


def vorlage_fehlt(v):
    """Entwurf braucht eine Vorlage (z. B. eduki, darf nicht in die App), und es gibt noch keine eigene unter vorlagen/."""
    return bool(v and v.get('_vorlage') == 'fehlt' and not v.get('vorlagen'))


def weggelassen(v):
    """Grund, warum ein Entwurf nicht in die App kommt (Doppel, Kurzfassung, Werbung …); leer = noch zu prüfen."""
    return (v or {}).get('_weglassen') or ''


def liste():
    out = []
    if not ENTWURF.exists(): return out
    for d in sorted(ENTWURF.iterdir()):
        if not d.is_dir() or not ID_MUSTER.fullmatch(d.name): continue
        a = analyse(d.name) or {}
        v = lies(d / 'video.json')
        s = schul_eintrag(d.name)
        steps = (v or {}).get('steps') or []
        t = steps[-1].get('t') or 0 if steps else (a.get('dauer') or 0) / 2  # Vorschaubild: Fertig-Schritt, sonst Mitte
        out.append({'id': d.name, 'title': (v or {}).get('title') or a.get('title') or d.name, 'dauer': a.get('dauer'),
                    'entwurf': bool(v), 'schritte': len(steps), 'drin': bool(s), 'brief': (d / 'brief.md').exists(),
                    'status': status(v), 'vorlage_fehlt': vorlage_fehlt(v), 'weggelassen': weggelassen(v), 'area': (s or v or {}).get('areaId') or '', 'bild': vorschaubild(d.name, t, a.get('fps') or 2)})
    return out


def daten(vid):
    a = analyse(vid)
    if not a: return None
    v = lies(ENTWURF / vid / 'video.json')
    blaetter = sorted(p.name for p in (ENTWURF / vid).glob('blatt-*.jpg'))
    return {'analyse': a, 'entwurf': v, 'schule': schul_eintrag(vid), 'themen': themen(), 'vokabular': vokabular(), 'blaetter': blaetter}


def uebernehmen(vid, eintrag=None):
    eintrag = eintrag or lies(ENTWURF / vid / 'video.json')
    if not eintrag: raise ValueError(f'Kein Entwurf für {vid}')
    eintrag = {k: v for k, v in eintrag.items() if not k.startswith('_')}  # interne Felder (z. B. _geprueft) bleiben im Entwurf
    d = lies(SCHULE)
    d['stand'] = datetime.date.today().isoformat()
    vids = d['videos']
    for i, e in enumerate(vids):
        if e.get('id') == eintrag.get('id') or (e.get('source') or {}).get('id') == vid:
            vids[i] = eintrag; break
    else:
        vids.append(eintrag)
    schreibe_json(SCHULE, d)
    return len(vids)


class H(BaseHTTPRequestHandler):
    def log_message(self, f, *a): pass

    def send(self, code, body, typ='text/html; charset=utf-8'):
        if isinstance(body, str): body = body.encode('utf-8')
        self.send_response(code); self.send_header('Content-Type', typ); self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store'); self.end_headers(); self.wfile.write(body)

    def js(self, code, obj): self.send(code, json.dumps(obj, ensure_ascii=False), 'application/json; charset=utf-8')

    def do_GET(self):
        p = urlparse(self.path).path
        seite = {'/': 'index.html', '/video.html': 'video.html', '/werke.html': 'werke.html', '/material.html': 'material.html', '/kontrolle.css': 'kontrolle.css', '/werkstatt.js': 'werkstatt.js'}.get(p)
        if seite: return self.send(200, (SEITEN / seite).read_bytes(), 'text/javascript; charset=utf-8' if seite.endswith('.js') else 'text/css; charset=utf-8' if seite.endswith('.css') else 'text/html; charset=utf-8')
        if p == '/vorlagen/melden.js':  # Flagge «Fehler melden» auf allen Kontrollseiten
            return self.send(200, (WURZEL / 'vorlagen' / 'melden.js').read_bytes(), 'text/javascript; charset=utf-8')
        if p == '/schule/index.html':  # video.html liest daraus die Material-Piktogramme
            return self.send(200, (WURZEL / 'schule' / 'index.html').read_bytes())
        m = re.fullmatch(r'/material/([A-Za-z0-9_.-]+\.(json|jpg|jpeg|png|webp|svg))', p)
        if m:
            datei = WURZEL / 'material' / m.group(1)
            typ = {'json': 'application/json; charset=utf-8', 'svg': 'image/svg+xml', 'png': 'image/png', 'webp': 'image/webp'}.get(m.group(2), 'image/jpeg')
            return self.send(200, datei.read_bytes(), typ) if datei.is_file() else self.send(404, 'nicht gefunden')
        if p.startswith('/m/'):  # Unterrichtsmaterial für material.html
            datei = (ENTWURF / 'material' / unquote(p[3:])).resolve()
            if not datei.is_file() or (ENTWURF / 'material').resolve() not in datei.parents: return self.send(404, 'nicht gefunden')
            return self.send(200, datei.read_bytes(), 'application/json; charset=utf-8' if datei.suffix == '.json' else 'application/octet-stream')
        if p == '/werke/werke.json':  # Hall of Fame, siehe werke.py
            return self.js(200, {**(lies(ENTWURF / 'werke' / 'werke.json') or {'werke': []}), 'themen': themen()})
        m = re.fullmatch(r'/werke/((?:klein/)?[a-z0-9-]+\.jpg)', p)
        if m:
            datei = ENTWURF / 'werke' / m.group(1)
            return self.send(200, datei.read_bytes(), 'image/jpeg') if datei.is_file() else self.send(404, 'kein Bild')
        m = re.fullmatch(r'/v/([A-Za-z0-9_-]{11})', p)  # alte Links
        if m:
            self.send_response(302); self.send_header('Location', '/video.html?id=' + m.group(1)); self.end_headers(); return
        if p == '/api/liste': return self.js(200, {'videos': liste(), 'themen': themen()})
        m = re.fullmatch(r'/api/([A-Za-z0-9_-]{11})', p)
        if m:
            d = daten(m.group(1))
            return self.js(200, d) if d else self.js(404, {'fehler': 'kein analyse.json – zuerst holen.py ausführen'})
        m = re.fullmatch(r'/f/([A-Za-z0-9_-]{11})/(\d+)', p)
        if m:
            n = int(m.group(2)); f = CACHE / m.group(1) / 'f'
            while n > 1 and not (f / f'{n:05d}.jpg').exists(): n -= 1
            datei = f / f'{n:05d}.jpg'
            return self.send(200, datei.read_bytes(), 'image/jpeg') if datei.exists() else self.send(404, 'kein Bild')
        m = re.fullmatch(r'/blatt/([A-Za-z0-9_-]{11})/(blatt-[a-z]+-\d+\.jpg)', p)
        if m:
            datei = ENTWURF / m.group(1) / m.group(2)
            return self.send(200, datei.read_bytes(), 'image/jpeg') if datei.exists() else self.send(404, 'kein Blatt')
        self.send(404, 'nicht gefunden')

    def do_POST(self):
        p = urlparse(self.path).path
        m = re.fullmatch(r'/api/([A-Za-z0-9_-]{11})/(speichern|uebernehmen)', p)
        if not m: return self.js(404, {'fehler': 'unbekannt'})
        vid, was = m.groups()
        try:
            e = json.loads(self.rfile.read(int(self.headers.get('Content-Length', 0))).decode('utf-8'))
            e['source'] = {'type': 'youtube', 'id': vid}
            e['steps'] = sorted(({'t': round(float(s['t']), 1), 'label': str(s['label']).strip()} for s in e.get('steps', [])), key=lambda s: s['t'])
            (ENTWURF / vid).mkdir(parents=True, exist_ok=True)
            schreibe_json(ENTWURF / vid / 'video.json', e)
            if was == 'uebernehmen':
                return self.js(200, {'ok': True, 'anzahl': uebernehmen(vid, e)})
            self.js(200, {'ok': True})
        except Exception as ex:
            self.js(400, {'fehler': str(ex)})


if __name__ == '__main__':
    if '--uebernehmen' in sys.argv:
        for vid in [a for a in sys.argv[sys.argv.index('--uebernehmen') + 1:] if not a.startswith('--')]:
            print(f'{vid}: übernommen, schule.json hat jetzt {uebernehmen(vid)} Videos')
        sys.exit()
    port = int(sys.argv[sys.argv.index('--port') + 1]) if '--port' in sys.argv else 8765
    print(f'Kontrolle läuft: http://127.0.0.1:{port}/  (Strg+C beendet)', flush=True)
    ThreadingHTTPServer(('127.0.0.1', port), H).serve_forever()
