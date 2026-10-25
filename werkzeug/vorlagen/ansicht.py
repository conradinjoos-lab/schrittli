"""Übersicht zum Anschauen: python ansicht.py <modul, 'basis' oder 'alle'> <bild.png> [id1,id2,...]
Zeichnet jede Form gross mit Namen, Details und den Hinweisen aus pruefen() in Rot."""
import os, sys, importlib
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
import numpy as np
from zeichnen import pruefen

modul, png = sys.argv[1], sys.argv[2]
if modul == 'basis': os.environ['NUR_BASIS'] = '1'                  # nur die Formen aus formen.py selbst
formen = importlib.import_module('formen' if modul in ('alle', 'basis') else modul).FORMEN
if len(sys.argv) > 3: formen = [f for f in formen if f[0] in sys.argv[3].split(',')]
sp = 6; zl = (len(formen) + sp - 1)//sp
fig, axs = plt.subplots(zl, sp, figsize=(sp*2.4, zl*2.7), squeeze=False)
for ax in axs.flat: ax.axis('off')
for ax, (fid, name, gruppe, f) in zip(axs.flat, formen):
    g, det = f if isinstance(f, tuple) else (f, [])
    for t in getattr(g, 'geoms', [g]):
        q = np.asarray(t.exterior.coords); ax.fill(q[:, 0], q[:, 1], color='#f3e3d3', ec='#1c2430', lw=1.2)
    for d in det:
        for t in getattr(d, 'geoms', [d]):
            q = np.asarray(t.coords if hasattr(t, 'coords') else t.exterior.coords); ax.plot(q[:, 0], q[:, 1], color='#8a8178', lw=.8)
    ax.set_aspect('equal'); ax.set_title(f'{name} ({fid})', fontsize=9)
    p = pruefen(fid, f)
    if p: ax.text(.5, -.04, '\n'.join(p), transform=ax.transAxes, ha='center', va='top', fontsize=7, color='#c62828')
fig.tight_layout(); fig.savefig(png, dpi=80); print(len(formen), 'Formen ->', png)
