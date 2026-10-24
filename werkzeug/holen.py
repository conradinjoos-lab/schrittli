#!/usr/bin/env python3
"""Schrittli – Video holen und analysieren.

Aufruf:  python werkzeug/holen.py <YouTube-Link oder -ID> [weitere …] [--neu]

Pro Video entsteht
  werkzeug/cache/<ID>/      info.json, Untertitel, video.mp4, Einzelbilder f/NNNNN.jpg (2 pro Sekunde), analyse.json
  werkzeug/entwurf/<ID>/    brief.md (alles, was man zum Schreiben der Schritte braucht), Kontaktblätter blatt-*.jpg

Braucht yt-dlp und ffmpeg im PATH sowie Pillow (pip install pillow).
Sperrt YouTube («Sign in to confirm you're not a bot»): Umgebungsvariable YTDLP_COOKIES auf eine cookies.txt setzen
(einmal erzeugen mit  yt-dlp --cookies-from-browser firefox --cookies cookies.txt --simulate <ID>), nie ins Repo.
"""
import json, math, os, re, subprocess, sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
WURZEL = Path(__file__).resolve().parent.parent
WZ = WURZEL / 'werkzeug'
CACHE = WZ / 'cache'
ENTWURF = WZ / 'entwurf'
FPS = 2                    # Einzelbilder pro Sekunde
SZENE = 0.28               # Schwelle für starke Bildwechsel (ffmpeg scene score 0..1)
SZENE_SCHWACH = 0.15       # auch Texteinblendungen und kleine Wechsel
STILLE_DB, STILLE_S = -32, 0.45


def yt_id(s):
    s = s.strip()
    m = re.search(r'(?:youtube\.com/(?:watch\?(?:.*&)?v=|shorts/|embed/|live/)|youtu\.be/)([A-Za-z0-9_-]{11})', s)
    if m: return m.group(1)
    if re.fullmatch(r'[A-Za-z0-9_-]{11}', s): return s
    sys.exit(f'Kein YouTube-Link oder keine ID: {s}')


def run(cmd, **kw):
    if cmd[0] == 'yt-dlp' and os.environ.get('YTDLP_COOKIES'): cmd = [cmd[0], '--cookies', os.environ['YTDLP_COOKIES'], *cmd[1:]]
    return subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace', **kw)


def fmt(t, dez=True):
    m, s = divmod(max(0.0, float(t)), 60)
    return f'{int(m)}:{s:04.1f}' if dez else f'{int(m)}:{int(s):02d}'


def bestehend(vid):
    """Sucht die YouTube-ID in schule.json, katalog.json und inhalte.json."""
    treffer = []
    for datei, key in (('schule/schule.json', 'videos'), ('katalog.json', 'eintraege'), ('inhalte.json', 'videos')):
        p = WURZEL / datei
        if not p.exists(): continue
        for e in json.loads(p.read_text(encoding='utf-8')).get(key, []):
            if (e.get('source') or {}).get('id') == vid:
                treffer.append((datei, e))
    return treffer


# ----------------------------------------------------------------- Laden
def lade_info(vid, c, neu):
    p = c / 'info.json'
    if p.exists() and not neu: return json.loads(p.read_text(encoding='utf-8'))
    r = run(['yt-dlp', '-J', '--no-playlist', '--', vid])
    if r.returncode or not r.stdout.strip():
        sys.exit(f'yt-dlp konnte {vid} nicht laden:\n{r.stderr[-800:]}')
    d = json.loads(r.stdout)
    schlank = {k: d.get(k) for k in ('id', 'title', 'channel', 'uploader', 'duration', 'playable_in_embed', 'age_limit',
                                      'live_status', 'upload_date', 'description', 'chapters', 'webpage_url', 'language')}
    schlank['subtitles'] = sorted((d.get('subtitles') or {}).keys())
    schlank['automatic_captions'] = sorted(k for k in (d.get('automatic_captions') or {}) if k.startswith(('de', 'en')))
    p.write_text(json.dumps(schlank, ensure_ascii=False, indent=1), encoding='utf-8')
    return schlank


def lade_untertitel(vid, c, neu):
    """Gibt (art, [[start,ende,text],…]) zurück. art: manuell | automatisch | keine."""
    if not list(c.glob('sub.*.json3')) or neu:
        run(['yt-dlp', '--skip-download', '--write-subs', '--write-auto-subs', '--sub-langs', 'de,de-orig,de-DE,de-CH,en',
             '--sub-format', 'json3', '--no-playlist', '-o', str(c / 'sub'), '--', vid])
    reihenfolge = [('sub.de.json3', 'manuell'), ('sub.de-DE.json3', 'manuell'), ('sub.de-CH.json3', 'manuell'),
                   ('sub.de-orig.json3', 'automatisch'), ('sub.en.json3', 'manuell (englisch)'), ('sub.en-orig.json3', 'automatisch (englisch)')]
    for name, art in reihenfolge:
        p = c / name
        if not p.exists(): continue
        d = json.loads(p.read_text(encoding='utf-8'))
        cues = []
        for e in d.get('events', []):
            txt = ''.join(s.get('utf8', '') for s in e.get('segs', [])).replace('\n', ' ').strip()
            if not txt or e.get('tStartMs') is None: continue
            a = e['tStartMs'] / 1000
            b = a + (e.get('dDurationMs') or 2000) / 1000
            cues.append([round(a, 2), round(b, 2), re.sub(r'\s+', ' ', txt)])
        if cues: return art, cues
    return 'keine', []


def lade_video(vid, c, neu):
    vorhanden = [p for p in c.glob('video.*') if p.suffix in ('.mp4', '.webm', '.mkv')]
    if vorhanden and not neu: return vorhanden[0]
    # 18 (mit Ton) bricht seit Okt. 2026 oft ab und trägt teils eine KI-Synchronisation, darum getrennt laden; ba = Originalton
    r = run(['yt-dlp', '-f', '134+ba/160+ba/bv*[height<=360]+ba/18/best[height<=480]', '--merge-output-format', 'mp4', '--no-playlist',
             '-o', str(c / 'video.%(ext)s'), '--', vid])
    vorhanden = [p for p in c.glob('video.*') if p.suffix in ('.mp4', '.webm', '.mkv')]
    if not vorhanden: sys.exit(f'Video {vid} konnte nicht geladen werden:\n{r.stderr[-800:]}')
    return vorhanden[0]


# ----------------------------------------------------------------- Analyse
def einzelbilder(video, c, neu):
    f = c / 'f'
    if f.exists() and any(f.iterdir()) and not neu: return f
    f.mkdir(exist_ok=True)
    for alt in f.glob('*.jpg'): alt.unlink()
    r = run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(video),
             '-vf', f'fps={FPS},scale=320:-2', '-q:v', '4', str(f / '%05d.jpg')])
    if r.returncode: sys.exit('ffmpeg Einzelbilder fehlgeschlagen:\n' + r.stderr[-800:])
    return f


def bildwechsel(video):
    """Liste [[zeit, score], …] aller Bildwechsel ab der schwachen Schwelle."""
    r = run(['ffmpeg', '-hide_banner', '-i', str(video), '-an', '-vf', f"select='gt(scene,{SZENE_SCHWACH})',metadata=print", '-f', 'null', '-'])
    out, t = [], None
    for zeile in r.stderr.splitlines():
        m = re.search(r'pts_time:\s*([0-9.]+)', zeile)
        if m: t = round(float(m.group(1)), 2); continue
        m = re.search(r'lavfi\.scene_score=([0-9.]+)', zeile)
        if m and t is not None: out.append([t, round(float(m.group(1)), 3)]); t = None
    return out


def sprechpausen(video):
    """Enden von Stille = wahrscheinlicher Beginn einer gesprochenen Anweisung."""
    r = run(['ffmpeg', '-hide_banner', '-i', str(video), '-vn', '-af', f'silencedetect=noise={STILLE_DB}dB:d={STILLE_S}', '-f', 'null', '-'])
    return [round(float(x), 2) for x in re.findall(r'silence_end:\s*([0-9.]+)', r.stderr)]


def bild_bei(f, t):
    n = int(round(t * FPS)) + 1
    p = f / f'{n:05d}.jpg'
    while n > 1 and not p.exists():
        n -= 1; p = f / f'{n:05d}.jpg'
    return p if p.exists() else None


def kontaktblatt(f, zeiten, ziel, titel):
    from PIL import Image, ImageDraw, ImageFont
    cols, w, h = 6, 320, 180
    rows = math.ceil(len(zeiten) / cols)
    blatt = Image.new('RGB', (cols * w, rows * h + 28), (20, 20, 20))
    d = ImageDraw.Draw(blatt)
    try:
        font = ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', 22); klein = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 18)
    except Exception:
        font = klein = ImageFont.load_default()
    d.text((8, 4), titel, fill=(255, 255, 255), font=klein)
    for i, t in enumerate(zeiten):
        p = bild_bei(f, t)
        if not p: continue
        im = Image.open(p).convert('RGB')
        im.thumbnail((w, h))
        x, y = (i % cols) * w, 28 + (i // cols) * h
        blatt.paste(im, (x + (w - im.width) // 2, y + (h - im.height) // 2))
        d.rectangle([x, y, x + 86, y + 28], fill=(0, 0, 0))
        d.text((x + 6, y + 2), fmt(t), fill=(255, 230, 0), font=font)
    blatt.save(ziel, quality=82)


def bloecke(cues, art):
    """Transkript als lesbare Zeilen. Manuelle Cues bleiben einzeln, automatische werden zu ~6-s-Blöcken verbunden."""
    if not cues: return []
    if art.startswith('manuell'): return [(a, txt) for a, b, txt in cues]
    out, start, buf = [], None, []
    for a, b, txt in cues:
        if start is None: start = a
        buf.append(txt)
        if a - start >= 6 or re.search(r'[.!?]$', txt):
            out.append((start, ' '.join(buf))); start, buf = None, []
    if buf: out.append((start, ' '.join(buf)))
    return out


# ----------------------------------------------------------------- Brief
def id_vorschlag(info):
    """Kürzel wie in schule.json: ex-… für Experimente, sonst zw-…; dahinter ein Wort aus dem Titel."""
    titel = (info.get('title') or '').lower()
    wort = next((w for w in re.findall(r'[a-zäöü]{4,}', titel) if w not in ('basteln', 'anleitung', 'einfach', 'selber', 'machen', 'kinder', 'tutorial', 'diy', 'schnell')), 'video')
    wort = wort.replace('ä', 'ae').replace('ö', 'oe').replace('ü', 'ue')
    praefix = 'ex' if re.search(r'experiment|versuch|forsch', titel) else 'zw'
    return f'{praefix}-{wort}'

def schreibe_brief(vid, info, art, cues, cuts, onsets, blaetter, e):
    dauer = info.get('duration') or 0
    treffer = bestehend(vid)
    z = []
    z.append(f'# Video {vid} – {info.get("title","")}\n')
    z.append(f'- Kanal: {info.get("channel") or info.get("uploader")}')
    z.append(f'- Dauer: {fmt(dauer, False)} ({dauer} s)')
    z.append(f'- Einbettbar: {"ja" if info.get("playable_in_embed") else "NEIN – nicht verwenden"}')
    z.append(f'- Transkript: {art}')
    z.append(f'- Link: https://www.youtube.com/watch?v={vid}')
    z.append(f'- Einzelbilder: `werkzeug/cache/{vid}/f/NNNNN.jpg` – Bild N zeigt Sekunde (N-1)/{FPS}, also z. B. 00061.jpg = 30.0 s')
    z.append(f'- Ausgabe: `werkzeug/entwurf/{vid}/video.json` (Format und Regeln: `werkzeug/SCHRITTE-LOKAL.md`)\n')
    if treffer:
        z.append('## Achtung: Video ist schon erfasst\n')
        for datei, x in treffer:
            z.append(f'- {datei}: id `{x.get("id")}`, {len(x.get("steps") or [])} Schritte, areaId {x.get("areaId")}')
            for s in x.get('steps') or []: z.append(f'    - {fmt(s["t"])}  {s["label"]}')
        z.append('')
    if info.get('description'):
        z.append('## Beschreibung (gekürzt)\n')
        z.append(re.sub(r'\s+', ' ', info['description'])[:700] + '\n')
    if info.get('chapters'):
        z.append('## Kapitel von YouTube (eingeblendete Texte, oft mit Tippfehlern)\n')
        for k in info['chapters']: z.append(f'- {fmt(k["start_time"])}  {k.get("title","")}')
        z.append('')
    z.append('## Kontaktblätter (mit Read anschauen)\n')
    for b in blaetter: z.append(f'- `{b.relative_to(WURZEL).as_posix()}`')
    z.append('')
    z.append(f'## Starke Bildwechsel (Schnitte, Schwelle {SZENE})\n')
    z.append(', '.join(fmt(t) for t, sc in cuts if sc >= SZENE) or 'keine erkannt')
    z.append('')
    z.append(f'## Schwache Bildwechsel (auch Texteinblendungen, Schwelle {SZENE_SCHWACH})\n')
    z.append(', '.join(fmt(t) for t, sc in cuts if sc < SZENE) or 'keine erkannt')
    z.append('')
    z.append(f'## Sprechbeginn nach Pause (Ende einer Stille von mindestens {STILLE_S} s)\n')
    z.append(', '.join(fmt(t) for t in onsets) or 'keine erkannt')
    z.append('')
    z.append(f'## Transkript ({art})\n')
    if cues:
        for a, txt in bloecke(cues, art): z.append(f'{fmt(a):>7}  {txt}')
    else:
        z.append('Kein Transkript – Schritte aus den Kontaktblättern und Einzelbildern schreiben.')
    z.append('')
    (e / 'brief.md').write_text('\n'.join(z), encoding='utf-8')


def verarbeite(vid, neu=False):
    c, e = CACHE / vid, ENTWURF / vid
    c.mkdir(parents=True, exist_ok=True); e.mkdir(parents=True, exist_ok=True)
    print(f'[{vid}] Metadaten …', flush=True)
    info = lade_info(vid, c, neu)
    if not info.get('playable_in_embed'):
        print(f'[{vid}] NICHT einbettbar – {info.get("title")}. Übersprungen.'); return None
    print(f'[{vid}] {info.get("title")} ({fmt(info.get("duration") or 0, False)}) – Untertitel …', flush=True)
    art, cues = lade_untertitel(vid, c, neu)
    print(f'[{vid}] Transkript: {art}, {len(cues)} Einträge – Video laden …', flush=True)
    video = lade_video(vid, c, neu)
    print(f'[{vid}] Einzelbilder, Bildwechsel, Stille …', flush=True)
    f = einzelbilder(video, c, neu)
    analyse_p = c / 'analyse.json'
    if analyse_p.exists() and not neu:
        alt = json.loads(analyse_p.read_text(encoding='utf-8')); cuts, onsets = alt['bildwechsel'], alt['sprechbeginn']
    else:
        cuts, onsets = bildwechsel(video), sprechpausen(video)
    dauer = info.get('duration') or 0
    analyse = {'id': vid, 'title': info.get('title'), 'kanal': info.get('channel') or info.get('uploader'), 'dauer': dauer,
               'fps': FPS, 'einbettbar': True, 'transkript_art': art, 'transkript': cues, 'bildwechsel': cuts,
               'sprechbeginn': onsets, 'kapitel': info.get('chapters') or []}
    analyse_p.write_text(json.dumps(analyse, ensure_ascii=False), encoding='utf-8')
    # Kontaktblätter: gleichmässig (höchstens 3 Blätter à 24) und je ein Bild nach jedem Bildwechsel
    for alt in e.glob('blatt-*.jpg'): alt.unlink()
    blaetter = []
    schritt = max(2, math.ceil(dauer / 72))
    zeiten = list(range(0, int(dauer), schritt))
    for i in range(0, len(zeiten), 24):
        ziel = e / f'blatt-zeit-{i//24+1}.jpg'
        kontaktblatt(f, zeiten[i:i+24], ziel, f'{vid} – alle {schritt} s, Blatt {i//24+1}'); blaetter.append(ziel)
    schnitte = [min(t + 0.5, dauer - 0.5) for t, sc in cuts if sc >= SZENE]
    for i in range(0, len(schnitte), 24):
        ziel = e / f'blatt-schnitte-{i//24+1}.jpg'
        kontaktblatt(f, schnitte[i:i+24], ziel, f'{vid} – Bild 0.5 s nach jedem Bildwechsel, Blatt {i//24+1}'); blaetter.append(ziel)
    schreibe_brief(vid, info, art, cues, cuts, onsets, blaetter, e)
    print(f'[{vid}] fertig: {e.relative_to(WURZEL)}/brief.md  ({len(cuts)} Bildwechsel, {len(onsets)} Sprechbeginne, {len(blaetter)} Kontaktblätter)')
    return e


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    neu = '--neu' in sys.argv
    if not args: sys.exit(__doc__)
    fehler = []
    for a in args:
        try: verarbeite(yt_id(a), neu)
        except SystemExit as ex:  # ein Video scheitert – die anderen trotzdem holen
            print(f'[{a}] ÜBERSPRUNGEN: {ex}', flush=True); fehler.append(a)
    if fehler: print(chr(10) + 'Nicht geholt: ' + ', '.join(fehler), flush=True)
