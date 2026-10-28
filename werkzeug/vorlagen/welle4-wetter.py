"""Welle 4, Welt «Wetter & Himmel»: Twemoji-Codes → bilder/wetter-*.png (mit schwarzem Umriss), Eintrag in figuren.json.
Aufruf: python -X utf8 welle4-wetter.py   danach bild.py <ids>."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bildhelfer
WELT = "Wetter & Himmel"
W = [
('wetter-sonne','Sonne','2600',None),('wetter-sonne-gesicht','Sonne mit Gesicht','1f31e',None),
('wetter-sonne-wolke-klein','Sonne mit kleiner Wolke','1f324',None),('wetter-sonne-hinter-wolke','Sonne hinter Wolke','26c5',None),
('wetter-sonne-hinter-grosser-wolke','Sonne hinter grosser Wolke','1f325',None),('wetter-sonne-regen','Sonne hinter Regenwolke','1f326',None),
('wetter-wolke','Wolke','2601',None),('wetter-regenwolke','Regenwolke','1f327',None),
('wetter-gewitter','Gewitterwolke','26c8',None),('wetter-blitz-wolke','Wolke mit Blitz','1f329',None),
('wetter-blitz','Blitz','26a1',None),('wetter-schneewolke','Schneewolke','1f328',None),
('wetter-schneeflocke','Schneeflocke','2744',None),('wetter-schneemann','Schneemann','2603',None),
('wetter-schneemann-ohne','Schneemann ohne Schnee','26c4',None),('wetter-regenbogen','Regenbogen','1f308',None),
('wetter-regenschirm','Regenschirm','2602',None),('wetter-regenschirm-regen','Regenschirm im Regen','2614',None),
('wetter-tropfen','Regentropfen','1f4a7',None),('wetter-mond','Mondsichel','1f319',None),
('wetter-mond-gesicht','Mond mit Gesicht','1f31b',None),('wetter-vollmond','Vollmond','1f31d',None),
('wetter-neumond','Neumond mit Gesicht','1f31a',None),('wetter-stern','Stern','2b50',None),
('wetter-stern-glanz','Glitzerstern','1f31f',None),('wetter-sternschnuppe','Sternschnuppe','1f320',None),
('wetter-funkeln','Funkeln','2728',None),('wetter-wind','Wind','1f4a8',None),
('wetter-windgesicht','Windgesicht','1f32c',None),('wetter-nebel','Nebel','1f32b',None),
('wetter-wirbel','Wirbel','1f300',None),('wetter-tornado','Wirbelsturm','1f32a',None),
('wetter-sternennacht','Sternennacht','1f303',None),('wetter-milchstrasse','Milchstrasse','1f30c',None),
('wetter-sonnenaufgang','Sonnenaufgang','1f305',None),('wetter-sonnenuntergang','Sonnenuntergang','1f307',None),
('wetter-thermometer','Thermometer','1f321',None),('wetter-welle','Welle','1f30a',None),
]

if __name__ == '__main__':
    import json
    HIER = os.path.dirname(os.path.abspath(__file__)); J = os.path.join(HIER, 'figuren.json')
    d = json.load(open(J, encoding='utf-8'))
    ids = {w[0] for w in W}
    d['figuren'] = [f for f in d['figuren'] if f['id'] not in ids]
    if WELT not in d['welten']: d['welten'].append(WELT)
    for i, n, code, g in W:
        bildhelfer.twemoji(code, os.path.join(HIER, 'bilder', i + '.png'))
        e = {'id': i, 'name': n, 'welt': WELT, 'datei': i + '.png'}
        if g is not None: e['glatt'] = g
        d['figuren'].append(e)
    with open(J, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(d, f, ensure_ascii=False, indent=1); f.write('\n')
