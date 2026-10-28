"""Vollständigkeit, Geometrie und verlustfreie Farbvorlagen gegen die Quelldateien prüfen."""
import json, os, sys
import numpy as np
from PIL import Image
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from bild import laden

ROOT = Path(__file__).resolve().parents[2]
def jsdaten(p):
    s = p.read_text(encoding='utf-8')
    if 'FIGUREN_DAZU(' in s: return json.loads(s[s.index(',', s.index('FIGUREN_DAZU('))+1:s.rindex(')')])
    return json.loads(s[s.index('=')+1:s.rindex(';')])

def main():
    meta = json.loads((ROOT/'werkzeug/vorlagen/figuren.json').read_text(encoding='utf-8'))['figuren']
    index = jsdaten(ROOT/'vorlagen/figuren/index.js')
    figuren = [f for datei in dict.fromkeys(f['datei'] for f in index) for f in jsdaten(ROOT/'vorlagen/figuren'/datei)]
    formen = jsdaten(ROOT/'vorlagen/formen.js')
    assert len(index) == len(figuren) == len(meta) == 431
    assert len(formen) == 363
    assert {f['id'] for f in figuren} == {f['id'] for f in meta}
    assert len({f['id'] for f in figuren+formen}) == 794
    nachId = {f['id']:f for f in figuren}
    for f in figuren+formen:
        assert f['w'] > 0 and f['h'] > 0 and f['d'], f['id']
        for key, mindest in [('d',3),('det',2)]:
            for r in f[key]:
                assert len(r) >= mindest, (f['id'], key, 'Punkte fehlen')
                a = np.array(r)
                assert a.shape[1] == 2 and np.isfinite(a).all(), (f['id'], key)
                assert a[:,0].min() >= -.35 and a[:,1].min() >= -.35, (f['id'], key, 'negative Lage')
                assert a[:,0].max() <= f['w']+.35 and a[:,1].max() <= f['h']+.35, (f['id'], key, 'ausserhalb')
    details = []
    for e in meta:
        f = nachId[e['id']]
        assert f.get('revision') == 2 and f.get('original'), e['id']
        rgb, mask = laden(str(ROOT/'werkzeug/vorlagen/bilder'/e['datei']))
        ys, xs = np.nonzero(mask)
        expected = np.dstack([rgb.astype(np.uint8), mask.astype(np.uint8)*255])[ys.min():ys.max()+1,xs.min():xs.max()+1]
        actual = np.array(Image.open(ROOT/'vorlagen/figuren/originale'/f['original']['datei']).convert('RGBA'))
        assert actual.shape == expected.shape, (e['id'], 'Bildmasse')
        assert np.array_equal(actual[:,:,3], expected[:,:,3]), (e['id'], 'Motivteile fehlen')
        opaque = expected[:,:,3] > 0
        assert np.array_equal(actual[:,:,:3][opaque], expected[:,:,:3][opaque]), (e['id'], 'Farben verändert')
        assert (ROOT/'vorlagen/figuren/bilder'/(e['id']+'.webp')).exists()
        details.append({'id':e['id'], 'farbpixelIdentisch':True, 'teile':f['teile'], 'pixel':[actual.shape[1],actual.shape[0]]})
    assert nachId['mochis-dango-spiess']['teile'] == 2, 'Dango-Spitze fehlt'
    out = ROOT/'output/vorlagen-pruefung';out.mkdir(parents=True,exist_ok=True)
    (out/'pruefung.json').write_text(json.dumps({'figuren':431,'formen':363,'farbgleichheit':details,'ergebnis':'bestanden'},ensure_ascii=False,indent=2),encoding='utf-8')
    print(f'{len(figuren)+len(formen)} Vorlagen geprüft; alle 431 Farbvorlagen besitzen exakt die RGB-Werte und Motivteile ihrer bereinigten Quelle.')

if __name__ == '__main__': main()
