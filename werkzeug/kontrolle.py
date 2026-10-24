#!/usr/bin/env python3
"""Schrittli – Kontrolle: Entwürfe prüfen, Stopps auf Zehntelsekunden setzen, in schule.json übernehmen.

Aufruf:  python werkzeug/kontrolle.py [--port 8765]
Dann im Browser:  http://127.0.0.1:8765/

Ohne Browser übernehmen:  python werkzeug/kontrolle.py --uebernehmen <VIDEOID> [<VIDEOID> …]

Seite: werkzeug/kontrolle.html (wird bei jedem Aufruf frisch gelesen). Zeigt pro Entwurf den Player, die Schritte mit Einzelbildern
rund um jeden Stopp, das Transkript und die erkannten Bildwechsel. Speichern schreibt video.json;
«Übernehmen» trägt den Eintrag in schule/schule.json ein (ersetzt einen bestehenden mit gleicher id oder gleichem Video).
"""
import datetime, json, re, sys
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
WURZEL = Path(__file__).resolve().parent.parent
CACHE = WURZEL / 'werkzeug' / 'cache'
ENTWURF = WURZEL / 'werkzeug' / 'entwurf'
SCHULE = WURZEL / 'schule' / 'schule.json'


def themen():
    src = (WURZEL / 'quelle' / 'p2.js').read_text(encoding='utf-8')
    block = src[src.find('const THEMEN='):]
    block = block[:block.find('];')]
    return re.findall(r"\{id:'(\w+)',name:'([^']+)'", block)


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


def liste():
    out = []
    if not ENTWURF.exists(): return out
    for d in sorted(ENTWURF.iterdir()):
        if not d.is_dir(): continue
        a = lies(CACHE / d.name / 'analyse.json', {})
        v = lies(d / 'video.json')
        s = schul_eintrag(d.name)
        out.append({'id': d.name, 'title': (v or {}).get('title') or a.get('title') or d.name, 'dauer': a.get('dauer'),
                    'entwurf': bool(v), 'schritte': len((v or {}).get('steps') or []), 'drin': bool(s), 'brief': (d / 'brief.md').exists(),
                    'status': status(v)})
    return out


def daten(vid):
    a = lies(CACHE / vid / 'analyse.json')
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


HTML_LISTE = '''<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Schrittli – Kontrolle</title>
<style>body{font:15px/1.4 system-ui,sans-serif;margin:24px;max-width:960px;color:#222}table{border-collapse:collapse;width:100%}td,th{padding:8px 10px;border-bottom:1px solid #ddd;text-align:left;vertical-align:top}a{color:#1b5fd1}
.ok{color:#1a8f3c}.no{color:#bbb}.muted{color:#888}code{background:#f3f3f3;padding:1px 5px;border-radius:4px}.st span{display:inline-block;margin-right:10px;white-space:nowrap}</style></head><body>
<h1>Schrittli – Kontrolle</h1><p class="muted">Entwürfe aus <code>werkzeug/entwurf/</code>. Neue Videos: in Claude Code <code>/schritte &lt;Links&gt;</code>, oder <code>python werkzeug/holen.py &lt;Link&gt;</code> und Schritte nach <code>werkzeug/SCHRITTE-LOKAL.md</code> schreiben lassen.</p>
<table><tr><th>Video</th><th>Dauer</th><th>Stand</th><th>Veröffentlicht</th></tr>__ZEILEN__</table></body></html>'''

SEITE = WURZEL / 'werkzeug' / 'kontrolle.html'


def zeile(e):
    def hk(ok, text): return f'<span class="{"ok" if ok else "no"}">{"✓" if ok else "○"} {text}</span>'
    if e['entwurf']:
        st = hk(e['status'][0], f'{e["schritte"]} Schritte') + hk(e['status'][1], 'Angaben') + hk(e['status'][2], 'geprüft')
    else:
        st = '<span class="muted">nur Brief – noch kein Entwurf</span>' if e['brief'] else '<span class="muted">leer</span>'
    dauer = f'{int(e["dauer"] // 60)}:{int(e["dauer"] % 60):02d}' if e['dauer'] else ''
    return (f'<tr><td><a href="/v/{e["id"]}">{e["title"]}</a><br><span class="muted"><code>{e["id"]}</code></span></td><td>{dauer}</td>'
            f'<td class="st">{st}</td><td>{"<span class=ok>✓ in schule.json</span>" if e["drin"] else ""}</td></tr>')


class H(BaseHTTPRequestHandler):
    def log_message(self, f, *a): pass

    def send(self, code, body, typ='text/html; charset=utf-8'):
        if isinstance(body, str): body = body.encode('utf-8')
        self.send_response(code); self.send_header('Content-Type', typ); self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store'); self.end_headers(); self.wfile.write(body)

    def js(self, code, obj): self.send(code, json.dumps(obj, ensure_ascii=False), 'application/json; charset=utf-8')

    def do_GET(self):
        p = urlparse(self.path).path
        if p == '/':
            zeilen = ''.join(zeile(e) for e in liste()) or '<tr><td colspan=4 class="muted">Noch keine Entwürfe.</td></tr>'
            return self.send(200, HTML_LISTE.replace('__ZEILEN__', zeilen))
        m = re.fullmatch(r'/v/([A-Za-z0-9_-]{11})', p)
        if m: return self.send(200, SEITE.read_text(encoding='utf-8').replace('__ID__', m.group(1)))
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
