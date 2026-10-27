"""Originalfarben für Perlen erhalten, nur den Hintergrund freistellen.

python werkzeug/vorlagen/perlen-quellen.py [id ...]
Die früher verwendeten Schnittmuster-Farbflächen verlieren kleine Augen und
Akzente bereits vor der Perlenumwandlung. Deshalb hier keine Farbquantisierung.
"""
from pathlib import Path
import json
import sys
import cv2
import numpy as np
from bild import laden

HERE = Path(__file__).resolve().parent
OUT = HERE.parent.parent / 'output' / 'perlen-quellen'
OUT.mkdir(parents=True, exist_ok=True)
PREVIEW = HERE.parent.parent / 'vorlagen' / 'perlen' / 'originale'
PREVIEW.mkdir(parents=True, exist_ok=True)
entries = json.loads((HERE / 'figuren.json').read_text(encoding='utf-8'))['figuren']
only = set(sys.argv[1:])
count = 0
for entry in entries:
    if only and entry['id'] not in only:
        continue
    cv2.setRNGSeed(0)
    rgb, mask = laden(str(HERE / 'bilder' / entry['datei']))
    yy, xx = np.where(mask)
    if not len(xx):
        raise ValueError('Leere Quelle: ' + entry['id'])
    x0, x1, y0, y1 = xx.min(), xx.max()+1, yy.min(), yy.max()+1
    rgba = np.dstack([rgb.astype(np.uint8), mask.astype(np.uint8)*255])[y0:y1,x0:x1]
    cv2.imwrite(str(OUT / (entry['id']+'.png')), cv2.cvtColor(rgba, cv2.COLOR_RGBA2BGRA))
    scale = min(1, 320 / max(rgba.shape[:2]))
    small = cv2.resize(rgba, (max(1, round(rgba.shape[1]*scale)), max(1, round(rgba.shape[0]*scale))), interpolation=cv2.INTER_AREA)
    cv2.imwrite(str(PREVIEW / (entry['id']+'.webp')), cv2.cvtColor(small, cv2.COLOR_RGBA2BGRA), [cv2.IMWRITE_WEBP_QUALITY, 90])
    count += 1
print(f'{count} Originale mit unveränderten Motivfarben freigestellt: {OUT}')
