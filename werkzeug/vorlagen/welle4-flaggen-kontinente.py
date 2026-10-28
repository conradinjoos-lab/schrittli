"""Welle 4: Welt «Flaggen & Kontinente» -> bilder/<id>.png und Eintrag in figuren.json.
Flaggen und Tiere: Twemoji (CC-BY 4.0). Kontinente und Weltkarte: Openclipart (CC0, Iyo / bessan), werden direkt von openclipart.org geladen.
Alle Bilder erhalten einen schwarzen Umriss (bildhelfer.umriss). Aufruf: python -X utf8 welle4-flaggen-kontinente.py, danach python -I bild.py <ids>."""
import sys, os, json, urllib.request
import numpy as np
from PIL import Image
HIER = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HIER)
import bildhelfer
WELT = 'Flaggen & Kontinente'
TWEMOJI = [   # (id, Name, Twemoji-Code, glatt)
    ('flagge-schweiz', 'Flagge Schweiz', '1f1e8-1f1ed', 0),
    ('flagge-deutschland', 'Flagge Deutschland', '1f1e9-1f1ea', 0),
    ('flagge-frankreich', 'Flagge Frankreich', '1f1eb-1f1f7', 0),
    ('flagge-italien', 'Flagge Italien', '1f1ee-1f1f9', 0),
    ('flagge-oesterreich', 'Flagge Österreich', '1f1e6-1f1f9', 0),
    ('flagge-liechtenstein', 'Flagge Liechtenstein', '1f1f1-1f1ee', 0),
    ('flagge-eu', 'Flagge Europa (EU)', '1f1ea-1f1fa', 0),
    ('flagge-portugal', 'Flagge Portugal', '1f1f5-1f1f9', 0),
    ('flagge-spanien', 'Flagge Spanien', '1f1ea-1f1f8', 0),
    ('flagge-tuerkei', 'Flagge Türkei', '1f1f9-1f1f7', 0),
    ('flagge-kosovo', 'Flagge Kosovo', '1f1fd-1f1f0', 0),
    ('flagge-grossbritannien', 'Flagge Grossbritannien', '1f1ec-1f1e7', 0),
    ('flagge-usa', 'Flagge USA', '1f1fa-1f1f8', 0),
    ('flagge-brasilien', 'Flagge Brasilien', '1f1e7-1f1f7', 0),
    ('flagge-japan', 'Flagge Japan', '1f1ef-1f1f5', 0),
    ('flagge-china', 'Flagge China', '1f1e8-1f1f3', 0),
    ('flagge-serbien', 'Flagge Serbien', '1f1f7-1f1f8', 0),
    ('flagge-albanien', 'Flagge Albanien', '1f1e6-1f1f1', 0),
    ('flagge-nordmazedonien', 'Flagge Nordmazedonien', '1f1f2-1f1f0', 0),
    ('flagge-ukraine', 'Flagge Ukraine', '1f1fa-1f1e6', 0),
    ('kontinent-globus', 'Globus Europa und Afrika', '1f30d', None),
    ('kontinent-loewe', 'Löwe (Afrika)', '1f981', None),
    ('kontinent-elefant', 'Elefant (Afrika)', '1f418', None),
    ('kontinent-giraffe', 'Giraffe (Afrika)', '1f992', None),
    ('kontinent-panda', 'Panda (Asien)', '1f43c', None),
    ('kontinent-tiger', 'Tiger (Asien)', '1f405', None),
    ('kontinent-kaenguru', 'Känguru (Australien)', '1f998', None),
    ('kontinent-koala', 'Koala (Australien)', '1f428', None),
    ('kontinent-pinguin', 'Pinguin (Antarktis)', '1f427', None),
    ('kontinent-lama', 'Lama (Südamerika)', '1f999', None),
    ('kontinent-bison', 'Bison (Nordamerika)', '1f9ac', None),
    ('kontinent-baer', 'Braunbär (Europa)', '1f43b', None),
]
OPENCLIPART = [   # (id, Name, Clip-Nr., Autor)
    ('kontinent-europa', 'Europa', 88915, 'Iyo'),
    ('kontinent-afrika', 'Afrika', 88909, 'Iyo'),
    ('kontinent-asien', 'Asien', 88933, 'Iyo'),
    ('kontinent-nordamerika', 'Nordamerika', 88939, 'Iyo'),
    ('kontinent-suedamerika', 'Südamerika', 88951, 'Iyo'),
    ('kontinent-australien', 'Australien und Ozeanien', 88945, 'Iyo'),
    ('kontinent-antarktis', 'Antarktis', 88921, 'Iyo'),
    ('kontinent-weltkarte', 'Weltkarte', 7068, 'bessan'),
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
        if i == 'kontinent-antarktis':   # blasses Band kraeftiger faerben
            im[im[:, :, 3] > 0, :3] = (205, 225, 245)
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
