# Zeigt Perlentier-Entwürfe als Bild: python werkzeug/zeigen.py teile/x.json ausgabe.png
import sys,json,re,math,io,os
from PIL import Image,ImageDraw,ImageFont
hier=os.path.dirname(os.path.abspath(__file__))
html=io.open(os.path.join(hier,'..','index.html'),encoding='utf-8').read()
FARBE={k:v for k,v in re.findall(r"(\w):\['(#[0-9A-Fa-f]{6})','",re.search(r"const FARBE=\{(.*?)\};",html).group(1))}
figs=json.load(io.open(sys.argv[1],encoding='utf-8'))
W,H=20,30   # Rocaille von der Seite: 2 mm breit, 3 mm hoch
def bild(t):
  rows=t['rows'];fehler=[]
  for i,r in enumerate(rows):
    for c in r:
      if c not in FARBE:fehler.append(f"Reihe {i+1}: Farbe '{c}' fehlt")
  breit=max(len(r) for r in rows)
  cw=max(breit*W+260,300);ch=len(rows)*H+260
  im=Image.new('RGB',(cw,ch),'white');d=ImageDraw.Draw(im);cx=cw/2;oy=110
  def perle(x,y,c,rot=0):
    col=FARBE.get(c,'#ff00ff')
    if rot%180==90 or abs(math.sin(math.radians(rot)))>.7:d.rounded_rectangle([x-H/2+1,y-W/2+1,x+H/2-1,y+W/2-1],5,fill=col,outline='#1c2430',width=2)
    else:d.rounded_rectangle([x-W/2+1,y-H/2+1,x+W/2-1,y+H/2-1],6,fill=col,outline='#1c2430',width=2)
  for i,r in enumerate(rows):
    e=(len(r)-1)/2
    for j,c in enumerate(r):perle(cx+(j-e)*W,oy+i*H,c)
  for b in t.get('beine',[]):
    i=b['r']-1
    if not 0<=i<len(rows):fehler.append(f"Bein an Reihe {b['r']} gibt es nicht");continue
    e=(len(rows[i])-1)/2*W;a=math.radians(b['a'])
    for sx in(-1,1):
      ux,uy=sx*math.cos(a),-math.sin(a);x0,y0=cx+sx*(e+W/2),oy+i*H
      for k in range(b['n']):perle(x0+ux*(W*(k+.5)+3),y0+uy*(W*(k+.5)+3),b['c'],rot=b['a'])
      ex,ey=x0+ux*(W*b['n']+3),y0+uy*(W*b['n']+3)
      if b['f']==1:perle(ex+ux*H/2,ey+uy*H/2,b['fc'],rot=b['a']+90)
      else:
        for k in range(b['f']):
          ph=2*math.pi*k/b['f'];perle(ex+ux*22+math.cos(ph)*14,ey+uy*22+math.sin(ph)*14,b['fc'])
  d.text((10,10),f"{t.get('name')} ({t.get('id')}) · {len(rows)} Reihen · max {breit} breit · {t.get('stufe')}",fill='black')
  for k,f in enumerate(fehler):d.text((10,30+14*k),'FEHLER: '+f,fill='red')
  return im,fehler
bilder=[bild(t) for t in figs]
spalten=min(4,len(bilder));zeilen=math.ceil(len(bilder)/spalten)
bw=max(b.width for b,_ in bilder);bh=max(b.height for b,_ in bilder)
gesamt=Image.new('RGB',(bw*spalten,bh*zeilen),'white')
for k,(b,_) in enumerate(bilder):gesamt.paste(b,((k%spalten)*bw,(k//spalten)*bh))
gesamt.save(sys.argv[2])
ids=[t['id'] for t in figs]
print(len(figs),'Figuren', 'doppelte ids: '+str({i for i in ids if ids.count(i)>1}) if len(set(ids))<len(ids) else '')
for t,(b,f) in zip(figs,bilder):
  for x in f:print(t['id'],x)
