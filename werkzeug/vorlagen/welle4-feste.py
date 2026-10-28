"""Welle 4: Welt «Schweizer Feste» -> bilder/<id>.png und Eintrag in figuren.json.
Motive: Twemoji (CC-BY 4.0), Räbe: Openclipart (CC0, feraliminal), werden direkt von openclipart.org geladen.
Alle Bilder erhalten einen schwarzen Umriss (bildhelfer.umriss). Aufruf: python -X utf8 welle4-feste.py, danach python -I bild.py <ids>."""
import sys, os, json, urllib.request
import numpy as np
from PIL import Image
HIER = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HIER)
import bildhelfer
WELT = 'Schweizer Feste'
TWEMOJI = [   # (id, Name, Twemoji-Code, glatt)
    ('fest-samichlaus', 'Samichlaus', '1f385', None),
    ('fest-geschenk', 'Geschenk für den Chlaussack', '1f381', None),
    ('fest-mandarine', 'Mandarine', '1f34a', None),
    ('fest-nuss', 'Erdnuss', '1f95c', None),
    ('fest-guetzli', 'Guetzli', '1f36a', None),
    ('fest-kerze', 'Kerze', '1f56f', None),
    ('fest-stern', 'Stern', '2b50', None),
    ('fest-glocke', 'Glocke', '1f514', None),
    ('fest-lampion', 'Lampion', '1f3ee', None),
    ('fest-feuerwerk', 'Feuerwerk', '1f386', None),
    ('fest-feuerwerk-funken', 'Feuerwerk mit Funken', '1f387', None),
    ('fest-schweizerfahne', 'Schweizerfahne', '1f1e8-1f1ed', 0),
    ('fest-knallkoerper', 'Knallkörper', '1f9e8', None),
    ('fest-osterhase', 'Osterhase', '1f430', None),
    ('fest-hase', 'Hase', '1f407', None),
    ('fest-kueken', 'Küken', '1f424', None),
    ('fest-schlupf', 'Küken im Ei', '1f423', None),
    ('fest-ei', 'Ei', '1f95a', None),
    ('fest-nest', 'Nest mit Eiern', '1faba', None),
    ('fest-tulpe', 'Tulpe', '1f337', None),
    ('fest-kuerbis', 'Kürbis', '1f383', None),
    ('fest-aehre', 'Getreideähre', '1f33e', None),
    ('fest-mais', 'Maiskolben', '1f33d', None),
    ('fest-herbstblatt', 'Herbstblatt', '1f342', None),
    ('fest-apfel', 'Apfel', '1f34e', None),
    ('fest-birne', 'Birne', '1f350', None),
    ('fest-trauben', 'Trauben', '1f347', None),
    ('fest-pilz', 'Pilz', '1f344', None),
    ('fest-clown', 'Clown', '1f921', None),
    ('fest-masken', 'Theatermasken', '1f3ad', None),
    ('fest-konfetti', 'Konfetti', '1f38a', None),
    ('fest-luftschlangen', 'Partyknaller', '1f389', None),
    ('fest-trompete', 'Trompete', '1f3ba', None),
    ('fest-trommel', 'Trommel', '1f941', None),
    ('fest-saxofon', 'Saxofon', '1f3b7', None),
    ('fest-luftballon', 'Luftballon', '1f388', None),
    ('fest-boeoegg', 'Böögg (Schneemann)', '2603', None),
    ('fest-sekt', 'Sektgläser', '1f942', None),
    ('fest-uhr', 'Mitternacht', '1f55b', None),
    ('fest-kleeblatt', 'Glücksklee', '1f340', None),
    ('fest-glueckssau', 'Glücksschwein', '1f437', None),
    ('fest-marienkaefer', 'Glückskäfer', '1f41e', None),
]
OPENCLIPART = [   # (id, Name, Clip-Nr., Autor)
    ('fest-raebe', 'Räbe für das Räbeliechtli', 84079, 'feraliminal'),
]
if __name__ == '__main__':
    J = os.path.join(HIER, 'figuren.json')
    d = json.load(open(J, encoding='utf-8'))
    neu = []
    for i, n, code, g in TWEMOJI:
        bildhelfer.twemoji(code, os.path.join(HIER, 'bilder', i + '.png'))
        neu.append((i, n, g))
    for i, n, nr, autor in OPENCLIPART:
        p = bildhelfer.holen('https://openclipart.org/image/800px/%d' % nr, 'oc-%d.png' % nr)
        im = np.array(Image.open(p).convert('RGBA'))
        bildhelfer.speichern(bildhelfer.umriss(im, dick=11), os.path.join(HIER, 'bilder', i + '.png'))
        neu.append((i, n, None))
    ids = {i for i, n, g in neu}
    d['figuren'] = [f for f in d['figuren'] if f['id'] not in ids]
    if WELT not in d['welten']: d['welten'].append(WELT)
    for i, n, g in neu:
        e = {'id': i, 'name': n, 'welt': WELT, 'datei': i + '.png'}
        if g is not None: e['glatt'] = g
        d['figuren'].append(e)
    with open(J, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(d, f, ensure_ascii=False, indent=1); f.write('\n')
    print(' '.join(sorted(ids)))
