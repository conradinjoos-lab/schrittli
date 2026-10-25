"""Eigene Vorlage Nikolausstiefel (Schrittli): Netz aus Sohle, zwei Seiten, Spitze und Ferse, A4 quer, Masse in mm."""
import sys, numpy as np, matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages

W, H = 297, 210
SL, SB = 80, 50            # Sohle: Länge (Spitze -> Ferse), Breite
HF, HS = 35, 70            # Höhe Fuss, Höhe Schaft
R, XS = 12, 45             # Rundung Spitze, Beginn Schaft (von der Spitze)
ABST, RAND, ERST = 9, 4, 6  # Lochabstand, Abstand vom Rand, erstes Loch ab Knicklinie


def bez(p0, p1, p2, p3, n=40):
    t = np.linspace(0, 1, n)[:, None]
    return (1-t)**3*p0 + 3*(1-t)**2*t*p1 + 3*(1-t)*t**2*p2 + t**3*p3


def kontur():
    """Vorderkante der Seite in (u, v): u ab Spitze Richtung Ferse, v ab Sohle nach aussen."""
    a = np.linspace(np.pi, np.pi/2, 30)
    teile = [np.array([[0, 0], [0, HF-R]]),
             np.c_[R + R*np.cos(a), HF-R + R*np.sin(a)],
             np.array([[R, HF], [XS-12, HF]]),
             bez(np.array([XS-12, HF]), np.array([XS-4, HF]), np.array([XS, HF+5]), np.array([XS, HF+15])),
             np.array([[XS, HF+15], [XS, HS]])]
    p = np.vstack(teile)
    return p[np.r_[True, np.any(np.diff(p, axis=0) != 0, axis=1)]]


def laenge(p): return np.r_[0, np.cumsum(np.hypot(*np.diff(p, axis=0).T))]


def punkte_innen(p, abst):
    """Lochpositionen entlang p (Bogenlänge ERST, ERST+ABST, …), um RAND nach innen (rechts der Laufrichtung) versetzt."""
    s = laenge(p); out = []
    d = ERST
    while d <= s[-1] - 4:
        i = np.searchsorted(s, d) - 1; i = max(0, min(i, len(p)-2))
        f = (d - s[i]) / (s[i+1]-s[i]); q = p[i] + f*(p[i+1]-p[i])
        t = (p[i+1]-p[i]) / np.hypot(*(p[i+1]-p[i])); n = np.array([t[1], -t[0]])
        out.append(q + abst*n); d += ABST
    return np.array(out)


K = kontur(); C = laenge(K)[-1]
LOCH_SEITE = punkte_innen(K, RAND)             # rechts der Laufrichtung = ins Papier (u>0)
N = len(LOCH_SEITE)
x0 = (W - (C + SL + HS)) / 2; xs = x0 + C; y0 = (H - SB) / 2; y1 = y0 + SB


def seite(oben):
    """Seitenteil: (u, v) -> Blatt; oben: an der oberen Sohlenkante."""
    g = lambda q: np.c_[xs + q[:, 0], (y1 + q[:, 1]) if oben else (y0 - q[:, 1])]
    rand = np.vstack([K, [[SL, HS], [SL, 0]]])
    heel = np.array([[SL-RAND, ERST + k*ABST] for k in range(int((HS-4-ERST)//ABST)+1)])
    return g(rand), g(LOCH_SEITE), g(heel)


fig = plt.figure(figsize=(W/25.4, H/25.4))
ax = fig.add_axes([0, 0, 1, 1]); ax.set_xlim(0, W); ax.set_ylim(0, H); ax.axis('off'); ax.set_aspect('equal')
schnitt = dict(color='#1c2430', lw=1.1, solid_joinstyle='round')
knick = dict(color='#1c2430', lw=0.8, ls=(0, (4, 3)))
loch = dict(s=9, facecolors='white', edgecolors='#1c2430', linewidths=0.7, zorder=3)
grau = '#5b6573'

# Sohle (nur Knicklinien)
ax.plot([xs, xs+SL, xs+SL, xs, xs], [y0, y0, y1, y1, y0], **knick)
# Seiten
for oben in (True, False):
    r, l, h = seite(oben)
    ax.plot(r[:, 0], r[:, 1], **schnitt)
    ax.scatter(*l.T, **loch); ax.scatter(*h.T, **loch)
# Spitze: Streifen nach links, Länge = Vorderkante der Seite, Ende gerundet
e = 5; xe = xs - C
ax.plot([xs, xe+e], [y1, y1], **schnitt); ax.plot([xs, xe+e], [y0, y0], **schnitt)
a = np.linspace(np.pi/2, np.pi, 20); ax.plot(xe+e+e*np.cos(a), y1-e+e*np.sin(a), **schnitt)
a = np.linspace(np.pi, 1.5*np.pi, 20); ax.plot(xe+e+e*np.cos(a), y0+e+e*np.sin(a), **schnitt)
ax.plot([xe, xe], [y0+e, y1-e], **schnitt)
d = np.arange(ERST, ERST + N*ABST, ABST)[:N]
ax.scatter(xs - d, np.full(N, y1-RAND), **loch); ax.scatter(xs - d, np.full(N, y0+RAND), **loch)
# Ferse: nach rechts
hk = np.array([ERST + k*ABST for k in range(int((HS-4-ERST)//ABST)+1)])
ax.plot([xs+SL, xs+SL+HS, xs+SL+HS, xs+SL], [y1, y1, y0, y0], **schnitt)
ax.scatter(xs+SL+hk, np.full(len(hk), y1-RAND), **loch); ax.scatter(xs+SL+hk, np.full(len(hk), y0+RAND), **loch)

# Beschriftung der Teile
t = dict(ha='center', va='center', color=grau, fontsize=11, fontweight='bold')
ax.text(xs+SL/2, (y0+y1)/2, 'Sohle', **t)
ax.text(xs+SL*0.55, y1+18, 'Seite', **t); ax.text(xs+SL*0.55, y0-18, 'Seite', **t)
ax.text(xs-C/2, (y0+y1)/2, 'Spitze  →  über den Fuss', **t)
ax.text(xs+SL+HS/2, (y0+y1)/2, 'Ferse', **t)

# Titel und Legende oben links
ax.text(12, H-14, 'Nikolausstiefel', fontsize=20, fontweight='bold', color='#1c2430', va='top')
ax.text(12, H-24, 'Vorlage zum Ausschneiden', fontsize=11, color=grau, va='top')
ly = H-40
ax.plot([12, 26], [ly, ly], **schnitt); ax.text(30, ly, 'schneiden', va='center', fontsize=10)
ax.plot([12, 26], [ly-8, ly-8], **knick); ax.text(30, ly-8, 'knicken', va='center', fontsize=10)
ax.scatter([19], [ly-16], **loch); ax.text(30, ly-16, 'Loch vorstechen', va='center', fontsize=10)
# Massstab unten links
ax.plot([12, 62], [14, 14], color='#1c2430', lw=1.4)
for xx in (12, 62): ax.plot([xx, xx], [12, 16], color='#1c2430', lw=1.4)
ax.text(12, 20, 'Diese Linie muss 5 cm lang sein. Drucke in Originalgrösse (100 %).', fontsize=8, color=grau)
ax.text(W-12, 12, 'Schrittli · eigene Vorlage, frei für den Unterricht', fontsize=7, color=grau, ha='right')

with PdfPages(sys.argv[1]) as pdf:
    pdf.savefig(fig); d = pdf.infodict(); d['Title'] = 'Vorlage Nikolausstiefel'; d['Author'] = 'Schrittli'
fig.savefig(sys.argv[1].replace('.pdf', '.png'), dpi=110)
print(f'Kontur {C:.1f} mm, {N} Löcher je Kante, Breite gesamt {C+SL+HS:.0f} mm, x0 {x0:.0f}')
