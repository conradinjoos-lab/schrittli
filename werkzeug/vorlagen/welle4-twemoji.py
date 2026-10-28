"""Welle 4: Welten aus Twemoji-Grafiken (CC-BY 4.0) mit schwarzem Umriss -> bilder/<id>.png und Eintrag in figuren.json.
Aufruf: python -X utf8 welle4-twemoji.py [Weltname ...]   (ohne Namen: alle Welten dieser Datei)
Danach: python -I bild.py <ids>. Eintraege: (id, Name, Twemoji-Code, glatt). Nur Twemoji-Welten; Buchstaben siehe buchstaben-bunt.py."""
import sys, os, json
HIER = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HIER)
import bildhelfer
WELTEN = {}

WELTEN['Wetter & Himmel'] = [
    ('wetter-sonne', 'Sonne', '2600', None),
    ('wetter-sonne-gesicht', 'Sonne mit Gesicht', '1f31e', None),
    ('wetter-sonne-wolke-klein', 'Sonne mit kleiner Wolke', '1f324', None),
    ('wetter-sonne-hinter-wolke', 'Sonne hinter Wolke', '26c5', None),
    ('wetter-sonne-hinter-grosser-wolke', 'Sonne hinter grosser Wolke', '1f325', None),
    ('wetter-sonne-regen', 'Sonne hinter Regenwolke', '1f326', None),
    ('wetter-wolke', 'Wolke', '2601', None),
    ('wetter-regenwolke', 'Regenwolke', '1f327', None),
    ('wetter-gewitter', 'Gewitterwolke', '26c8', None),
    ('wetter-blitz-wolke', 'Wolke mit Blitz', '1f329', None),
    ('wetter-blitz', 'Blitz', '26a1', None),
    ('wetter-schneewolke', 'Schneewolke', '1f328', None),
    ('wetter-schneeflocke', 'Schneeflocke', '2744', None),
    ('wetter-schneemann', 'Schneemann', '2603', None),
    ('wetter-schneemann-ohne', 'Schneemann ohne Schnee', '26c4', None),
    ('wetter-regenbogen', 'Regenbogen', '1f308', None),
    ('wetter-regenschirm', 'Regenschirm', '2602', None),
    ('wetter-regenschirm-regen', 'Regenschirm im Regen', '2614', None),
    ('wetter-tropfen', 'Regentropfen', '1f4a7', None),
    ('wetter-mond', 'Mondsichel', '1f319', None),
    ('wetter-mond-gesicht', 'Mond mit Gesicht', '1f31b', None),
    ('wetter-vollmond', 'Vollmond', '1f31d', None),
    ('wetter-neumond', 'Neumond mit Gesicht', '1f31a', None),
    ('wetter-stern', 'Stern', '2b50', None),
    ('wetter-stern-glanz', 'Glitzerstern', '1f31f', None),
    ('wetter-sternschnuppe', 'Sternschnuppe', '1f320', None),
    ('wetter-funkeln', 'Funkeln', '2728', None),
    ('wetter-wind', 'Wind', '1f4a8', None),
    ('wetter-windgesicht', 'Windgesicht', '1f32c', None),
    ('wetter-nebel', 'Nebel', '1f32b', None),
    ('wetter-wirbel', 'Wirbel', '1f300', None),
    ('wetter-tornado', 'Wirbelsturm', '1f32a', None),
    ('wetter-sternennacht', 'Sternennacht', '1f303', None),
    ('wetter-milchstrasse', 'Milchstrasse', '1f30c', None),
    ('wetter-sonnenaufgang', 'Sonnenaufgang', '1f305', None),
    ('wetter-sonnenuntergang', 'Sonnenuntergang', '1f307', None),
    ('wetter-thermometer', 'Thermometer', '1f321', None),
    ('wetter-welle', 'Welle', '1f30a', None),
]

WELTEN['Emojis & Gefühle'] = [
    ('emoji-froh', 'Froh', '1f600', None),
    ('emoji-strahlend', 'Strahlend', '1f604', None),
    ('emoji-lachtraenen', 'Lachtränen', '1f602', None),
    ('emoji-kugelt', 'Kugelt sich vor Lachen', '1f923', None),
    ('emoji-laechelnd', 'Lächelnd', '1f642', None),
    ('emoji-engel', 'Engel', '1f607', None),
    ('emoji-verliebt', 'Verliebt', '1f970', None),
    ('emoji-herzaugen', 'Herzaugen', '1f60d', None),
    ('emoji-sternaugen', 'Sternenaugen', '1f929', None),
    ('emoji-lecker', 'Lecker', '1f60b', None),
    ('emoji-zunge', 'Zunge raus', '1f61c', None),
    ('emoji-nachdenklich', 'Nachdenklich', '1f914', None),
    ('emoji-neutral', 'Neutral', '1f610', None),
    ('emoji-schlafend', 'Schlafend', '1f634', None),
    ('emoji-heulend', 'Heulend', '1f62d', None),
    ('emoji-traurig', 'Traurig', '1f622', None),
    ('emoji-waetend', 'Wütend', '1f620', None),
    ('emoji-sehr-waetend', 'Sehr wütend', '1f621', None),
    ('emoji-schreck', 'Erschrocken', '1f631', None),
    ('emoji-erstaunt', 'Erstaunt', '1f632', None),
    ('emoji-verlegen', 'Verlegen', '1f633', None),
    ('emoji-cool', 'Cool', '1f60e', None),
    ('emoji-party', 'Partygesicht', '1f973', None),
    ('emoji-krank', 'Krank', '1f912', None),
    ('emoji-kalt', 'Friert', '1f976', None),
    ('emoji-umarmung', 'Umarmung', '1f917', None),
    ('emoji-herz', 'Herz rot', '2764', None),
    ('emoji-herz-blau', 'Herz blau', '1f499', None),
    ('emoji-herz-gruen', 'Herz grün', '1f49a', None),
    ('emoji-herz-lila', 'Herz lila', '1f49c', None),
    ('emoji-herz-gelb', 'Herz gelb', '1f49b', None),
    ('emoji-herz-gebrochen', 'Gebrochenes Herz', '1f494', None),
    ('emoji-daumen-hoch', 'Daumen hoch', '1f44d', None),
    ('emoji-daumen-runter', 'Daumen runter', '1f44e', None),
    ('emoji-klatschen', 'Klatschen', '1f44f', None),
    ('emoji-sieg', 'Victory', '270c', None),
    ('emoji-feuer', 'Feuer', '1f525', None),
    ('emoji-party-knaller', 'Partyknaller', '1f389', None),
    ('emoji-geschenk', 'Geschenk', '1f381', None),
    ('emoji-ballon', 'Ballon', '1f388', None),
    ('emoji-pokal', 'Pokal', '1f3c6', None),
]

if __name__ == '__main__':
    J = os.path.join(HIER, 'figuren.json')
    d = json.load(open(J, encoding='utf-8'))
    for welt in (sys.argv[1:] or list(WELTEN)):
        liste = WELTEN[welt]; ids = {w[0] for w in liste}
        d['figuren'] = [f for f in d['figuren'] if f['id'] not in ids]
        if welt not in d['welten']: d['welten'].append(welt)
        for i, n, code, g in liste:
            bildhelfer.twemoji(code, os.path.join(HIER, 'bilder', i + '.png'))
            e = {'id': i, 'name': n, 'welt': welt, 'datei': i + '.png'}
            if g is not None: e['glatt'] = g
            d['figuren'].append(e)
    with open(J, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(d, f, ensure_ascii=False, indent=1); f.write('\n')
