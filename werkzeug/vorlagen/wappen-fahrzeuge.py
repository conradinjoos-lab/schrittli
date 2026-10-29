"""Welten «Wappen» (Schweiz, 26 Kantone, Neunkirch) und «Fussball» (Vereinslogos) sowie mehr Figuren für «Fahrzeuge» -> bilder/<id>.png und Eintrag in figuren.json.
Wappen: Wikimedia Commons, Public Domain (SVG «Wappen <Kanton> matt»). Neunkirch: aus «Flag of Neunkirch.gif» (Pascal Gross, Public Domain),
Kirche geglättet, Blau und Rot an die Kantonswappen angeglichen, in die Schildform gesetzt. Fussball: Commons, Public Domain
(einfache Schrift- und Formlogos, urheberrechtsfrei; die Marken gehören den Vereinen); weitere Vereine von logotyp.us bzw. Wikipedia,
nur für den persönlichen und schulischen Gebrauch in der eigenen Schulapp. Fahrzeuge: Openclipart (CC0), meist von der Seite.
Alle Bilder erhalten einen schwarzen Umriss (bildhelfer.umriss). Aufruf: python -X utf8 -I wappen-fahrzeuge.py, danach python -I bild.py <ids>."""
import sys, os, json, urllib.request, urllib.parse
import numpy as np, cv2
from PIL import Image, ImageDraw
from scipy.ndimage import binary_fill_holes
HIER = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HIER)
import bildhelfer
UA = {'User-Agent': 'schrittli-vorlagen/1.0 (c.joos@schuleneunkirch.ch)'}   # Wikimedia verlangt einen sprechenden User-Agent
WAPPEN = [   # (id, Name, Datei auf Commons)
    ('wappen-schweiz', 'Wappen Schweiz', 'Coat of arms of Switzerland.svg'),
    ('wappen-aargau', 'Wappen Aargau', 'Wappen Aargau matt.svg'),
    ('wappen-appenzell-ar', 'Wappen Appenzell Ausserrhoden', 'Wappen Appenzell Ausserrhoden matt.svg'),
    ('wappen-appenzell-ai', 'Wappen Appenzell Innerrhoden', 'Wappen Appenzell Innerrhoden matt.svg'),
    ('wappen-basel-land', 'Wappen Basel-Landschaft', 'Wappen Basel-Landschaft matt.svg'),
    ('wappen-basel-stadt', 'Wappen Basel-Stadt', 'Wappen Basel-Stadt matt.svg'),
    ('wappen-bern', 'Wappen Bern', 'Wappen Bern matt.svg'),
    ('wappen-freiburg', 'Wappen Freiburg', 'Wappen Freiburg matt.svg'),
    ('wappen-genf', 'Wappen Genf', 'Wappen Genf matt.svg'),
    ('wappen-glarus', 'Wappen Glarus', 'Wappen Glarus matt.svg'),
    ('wappen-graubuenden', 'Wappen Graubünden', 'Wappen Graubünden matt.svg'),
    ('wappen-jura', 'Wappen Jura', 'Wappen Jura matt.svg'),
    ('wappen-luzern', 'Wappen Luzern', 'Wappen Luzern matt.svg'),
    ('wappen-neuenburg', 'Wappen Neuenburg', 'Wappen Neuenburg matt.svg'),
    ('wappen-nidwalden', 'Wappen Nidwalden', 'Wappen Nidwalden matt.svg'),
    ('wappen-obwalden', 'Wappen Obwalden', 'Wappen Obwalden matt.svg'),
    ('wappen-schaffhausen', 'Wappen Schaffhausen', 'Wappen Schaffhausen matt.svg'),
    ('wappen-schwyz', 'Wappen Schwyz', 'Wappen Schwyz matt.svg'),
    ('wappen-solothurn', 'Wappen Solothurn', 'Wappen Solothurn matt.svg'),
    ('wappen-stgallen', 'Wappen St. Gallen', 'Wappen St. Gallen matt.svg'),
    ('wappen-thurgau', 'Wappen Thurgau', 'Wappen Thurgau matt.svg'),
    ('wappen-tessin', 'Wappen Tessin', 'Wappen Tessin matt.svg'),
    ('wappen-uri', 'Wappen Uri', 'Wappen Uri matt.svg'),
    ('wappen-wallis', 'Wappen Wallis', 'Wappen Wallis matt.svg'),
    ('wappen-waadt', 'Wappen Waadt', 'Wappen Waadt matt.svg'),
    ('wappen-zug', 'Wappen Zug', 'Wappen Zug matt.svg'),
    ('wappen-zuerich', 'Wappen Zürich', 'Wappen Zürich matt.svg'),
]
FUSSBALL = [   # (id, Name, Datei auf Commons); Dortmund rendert schwarz, YB ist nur CC BY-SA
    ('fb-basel', 'FC Basel', 'Logo FC Basel.svg'),
    ('fb-zuerich', 'FC Zürich', 'FC Zurich Logo 2022.svg'),
    ('fb-gc', 'Grasshopper Club Zürich', 'Grasshoppers Club Zürich Logo.svg'),
    ('fb-stgallen', 'FC St. Gallen', 'FC St. Gallen logo.svg'),
    ('fb-lugano', 'FC Lugano', 'FC Lugano logo.svg'),
    ('fb-schaffhausen', 'FC Schaffhausen', 'Fc Schaffhausen.svg'),
    ('fb-servette', 'Servette FC', 'Servette FC.svg'),
    ('fb-sion', 'FC Sion', 'FC Sion.svg'),
    ('fb-bayern', 'FC Bayern München', 'FC Bayern München logo (2017).svg'),
    ('fb-juventus', 'Juventus Turin', 'Juventus FC 2017 icon (black).svg'),
    ('fb-inter', 'Inter Mailand', 'FC Internazionale Milano 2021.svg'),
    ('fb-milan', 'AC Mailand', 'Logo of AC Milan.svg'),
]
FUSSBALL_LOGOS = [   # (id, Name, Quelle) – logotyp.us «free for personal and educational use», Wikipedia als vorgerenderte PNG
    ('fb-yb', 'BSC Young Boys', 'https://logotyp.us/file/young-boys.svg'),
    ('fb-real', 'Real Madrid', 'https://logotyp.us/file/real-madrid.svg'),
    ('fb-barca', 'FC Barcelona', 'https://logotyp.us/file/barcelona-fc.svg'),
    ('fb-atletico', 'Atlético Madrid', 'https://logotyp.us/file/atletico-madrid.svg'),
    ('fb-liverpool', 'FC Liverpool', 'https://logotyp.us/file/liverpool.svg'),
    ('fb-chelsea', 'FC Chelsea', 'https://logotyp.us/file/chelsea.svg'),
    ('fb-arsenal', 'FC Arsenal', 'https://logotyp.us/file/arsenal.svg'),
    ('fb-tottenham', 'Tottenham Hotspur', 'https://logotyp.us/file/tottenham-hotspur.svg'),
    ('fb-manutd', 'Manchester United', 'https://en.wikipedia.org/wiki/Special:FilePath/Manchester_United_FC_crest.svg?width=900'),
    ('fb-mancity', 'Manchester City', 'https://en.wikipedia.org/wiki/Special:FilePath/Manchester_City_FC_badge.svg?width=900'),
    ('fb-psg', 'Paris Saint-Germain', 'https://logotyp.us/file/paris-saint-germain.svg'),
    ('fb-dortmund', 'Borussia Dortmund', 'https://en.wikipedia.org/wiki/Special:FilePath/Borussia_Dortmund_logo.svg?width=900'),
]
FAHRZEUGE = [   # (id, Name, Clip-Nr., Autor)
    ('fz-vw-bus', 'VW-Bus (Bulli)', 202006, 'spadassin'),
    ('fz-vw-kaefer', 'VW Käfer', 228784, 'GDJ'),
    ('fz-citroen-2cv', 'Citroën 2CV (Ente)', 237367, 'Firkin'),
    ('fz-porsche-911', 'Porsche 911', 168298, 'charlyleprof'),
    ('fz-bmw-kombi', 'BMW Kombi', 18338, 'tormaroe'),
    ('fz-ferrari', 'Ferrari 458 Spider', 270415, 'GDJ'),
    ('fz-tesla', 'Tesla Model S', 320720, 'j4p4n'),
    ('fz-mercedes', 'Mercedes-Benz Coupé', 304064, 'Firkin'),
    ('fz-mitsubishi-pajero', 'Mitsubishi Pajero', 257151, 'derkommander0916'),
    ('fz-toyota-hilux', 'Toyota Hilux', 217281, 'derkommander0916'),
    ('fz-toyota-gelaende', 'Toyota Geländewagen', 8251, 'Gerald_G'),
    ('fz-jeep', 'Jeep', 245105, 'GDJ'),
    ('fz-vespa', 'Vespa', 162301, 'protogenoi'),
    ('fz-formel1', 'Formel-1-Rennwagen', 221046, 'GDJ'),
    ('fz-airbus', 'Airbus A320', 183655, 'PolyLingua'),
    ('fz-jumbo', 'Verkehrsflugzeug', 169030, 'sagism'),
    ('fz-polizei', 'Polizeiauto', 298875, 'j4p4n'),
    ('fz-polizei-schwarz', 'Polizeiauto schwarz-weiss', 334859, 'algotruneman'),
    ('fz-krankenwagen', 'Krankenwagen', 272383, 'mvolz'),
    ('fz-feuerwehr', 'Feuerwehrauto', 303079, 'klsgfx'),
    ('fz-feuerwehr-leiter', 'Feuerwehr mit Leiter', 303080, 'klsgfx'),
    ('fz-schulbus', 'Schulbus', 334074, 'SunKing2'),
    ('fz-bus', 'Bus', 16199, 'bobocal'),
    ('fz-tram', 'Tram', 322937, 'Shinnoske'),
    ('fz-lok', 'Lokomotive', 202469, 'aleksmt'),
    ('fz-dampflok', 'Dampflok', 100015, 'manio1'),
    ('fz-schnellzug', 'Schnellzug', 154531, 'cprostire'),
    ('fz-muellwagen', 'Müllwagen', 259142, 'GDJ'),
    ('fz-autokran', 'Autokran', 302942, 'klsgfx'),
    ('fz-kranwagen', 'Kranwagen', 263177, 'GDJ'),
    ('fz-abschleppwagen', 'Abschleppwagen', 206127, 'developingo'),
    ('fz-monstertruck', 'Monstertruck', 105607, 'netalloy'),
    ('fz-glacewagen', 'Glacewagen', 215141, 'barnheartowl'),
    ('fz-umzugswagen', 'Umzugswagen', 333428, 'j4p4n'),
    ('fz-pickup', 'Pick-up', 284414, 'cactus_cowboy'),
    ('fz-taxi', 'Taxi', 257780, 'NicholasJudy456'),
    ('fz-helikopter', 'Helikopter', 172801, 'tzunghaor'),
    ('fz-helikopter-gruen', 'Helikopter grün', 306953, 'klsgfx'),
    ('fz-segelboot', 'Segelboot', 191526, 'agomjo'),
    ('fz-segelschiff', 'Segelschiff', 281053, 'j4p4n'),
    ('fz-titanic', 'Titanic', 175422, 'artbejo'),
    ('fz-uboot', 'Gelbes U-Boot', 350965, 'j4p4n'),
]
LOCH = {'fz-mercedes'}   # Strichzeichnung: Innenflächen weiss füllen, sonst schliesst der Umriss sie schwarz
BLAU, ROT = (36, 139, 204), (231, 66, 63)   # wie «Wappen Luzern matt» und «Wappen Schwyz matt»

def commons(datei):
    os.makedirs(bildhelfer.SP, exist_ok=True)
    p = os.path.join(bildhelfer.SP, 'wm-' + urllib.parse.quote(datei.replace(' ', '_')))
    if not os.path.exists(p):
        u = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + urllib.parse.quote(datei.replace(' ', '_'))
        open(p, 'wb').write(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=30).read())
    return p

def neunkirch():
    """Kirche aus der Gemeindefahne glätten und in die Schildform der Kantonswappen (605 x 765) setzen."""
    g = np.array(Image.open(commons('Flag of Neunkirch.gif')).convert('RGB')).astype(int)
    pal = np.array([(0, 0, 255), (255, 255, 255), (255, 0, 0), (0, 0, 0)])
    lab = np.argmin(((g[:, :, None, :] - pal[None, None]) ** 2).sum(-1), -1)
    k, F = 2, 1100   # Schild doppelt so gross wie die SVG-Vorlage, Fahne 1100 px breit
    st = np.stack([cv2.GaussianBlur(cv2.resize((lab == i).astype(np.float32), (F, F), interpolation=cv2.INTER_CUBIC), (0, 0), 2.2) for i in range(4)], -1)
    neu = np.array([BLAU, (255, 255, 255), ROT, (0, 0, 0)], np.uint8)[np.argmax(st, -1)]
    W, H = 605 * k, 765 * k
    C = np.zeros((H, W, 3), np.uint8); C[:] = BLAU
    x0, y0 = (W - F) // 2, 150; C[y0:y0 + F, x0:x0 + F] = neu
    m = Image.new('L', (W, H), 0); d = ImageDraw.Draw(m)
    d.rectangle([1.5 * k, 1.5 * k, 603.5 * k, 459.5 * k], fill=255); d.ellipse([1.5 * k, 158.5 * k, 603.5 * k, 760.5 * k], fill=255)
    m = np.array(m)
    C[cv2.morphologyEx(m, cv2.MORPH_GRADIENT, np.ones((7, 7), np.uint8)) > 0] = 0
    return np.dstack([C, m])

def logo(i, url):
    if url.endswith('.svg'):
        return bildhelfer.svg_rgba(bildhelfer.holen(url, 'lt-' + url.rsplit('/', 1)[-1]))
    p = os.path.join(bildhelfer.SP, 'wp-%s.png' % i)
    if not os.path.exists(p):
        open(p, 'wb').write(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30).read())
    return np.array(Image.open(p).convert('RGBA'))

def fahrzeug(i, nr):
    im = np.array(Image.open(bildhelfer.holen('https://openclipart.org/image/800px/%d' % nr, 'oc-%d.png' % nr)).convert('RGBA'))
    if i in LOCH:
        z = binary_fill_holes(im[:, :, 3] > 20) & (im[:, :, 3] <= 20)
        im[z] = (255, 255, 255, 255)
    return im

if __name__ == '__main__':
    J = os.path.join(HIER, 'figuren.json')
    d = json.load(open(J, encoding='utf-8'))
    neu = []
    for i, n, datei in WAPPEN:
        bildhelfer.speichern(bildhelfer.umriss(bildhelfer.svg_rgba(commons(datei))), os.path.join(HIER, 'bilder', i + '.png'))
        neu.append((i, n, 'Wappen'))
    bildhelfer.speichern(bildhelfer.umriss(neunkirch()), os.path.join(HIER, 'bilder', 'wappen-neunkirch.png'))
    neu.append(('wappen-neunkirch', 'Wappen Neunkirch', 'Wappen'))
    for i, n, datei in FUSSBALL:
        bildhelfer.speichern(bildhelfer.umriss(bildhelfer.svg_rgba(commons(datei))), os.path.join(HIER, 'bilder', i + '.png'))
        neu.append((i, n, 'Fussball'))
    for i, n, url in FUSSBALL_LOGOS:
        bildhelfer.speichern(bildhelfer.umriss(logo(i, url)), os.path.join(HIER, 'bilder', i + '.png'))
        neu.append((i, n, 'Fussball'))
    for i, n, nr, autor in FAHRZEUGE:
        bildhelfer.speichern(bildhelfer.umriss(fahrzeug(i, nr)), os.path.join(HIER, 'bilder', i + '.png'))
        neu.append((i, n, 'Fahrzeuge'))
    ids = {i for i, n, w in neu}
    d['figuren'] = [f for f in d['figuren'] if f['id'] not in ids]
    for w in ('Wappen', 'Fussball', 'Fahrzeuge'):
        if w not in d['welten']: d['welten'].append(w)
    for i, n, w in neu:
        d['figuren'].append({'id': i, 'name': n, 'welt': w, 'datei': i + '.png'})
    with open(J, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(d, f, ensure_ascii=False, indent=1); f.write('\n')
    print(' '.join(i for i, n, w in neu))
