// Tiere: Tierwelt, Kontinent-Tiere, Wald und Wiese, Dinos und Fabelwesen, Meer, Zirkus, Winter, Frühling und Garten.
// Meist runde Köpfe von vorn; breite Ohren, Flügel, Geweihe und Schwänze sind eigene Teile zum Annähen.
'use strict';
module.exports=({add,kopf,pinguin,gesicht,teil,fluegel,farben,ohr,zeilen})=>{
  const beine=(r,c,n=2,f=1,a=-70,w='Beine',fc=c)=>({r,n,f,a,c,fc,w});
  const arme=(r,c,n=2,f=1,a=0,w='Arme',fc=c)=>({r,n,f,a,c,fc,w});
  const R=(c,n)=>c.repeat(n);

  // Elefant: Kopf mit Rüssel, Ohren als Teile
  const elefantReihen=(c='n')=>[R(c,4),R(c,6),c+c+'s'+c+c+'s'+c+c,R(c,8),R(c,8),R(c,6),R(c,4),c+c,c+c,c+c];
  const elefantOhren=(c='n',an=4)=>teil('Ohren',2,'seiten',an,`${R(c,3)} ${R(c,4)} ${R(c,4)} ${R(c,3)}`);
  const elefant=(id,c='n',unten=[],oben=[])=>add(id,[...zeilen(oben),...elefantReihen(c),...zeilen(unten)],'Kopf',[],[elefantOhren(c,4+zeilen(oben).length)]);
  const loewe=(id,hut)=>add(id,[...(hut?zeilen(hut):['oooo','oooooo']),'oocccccoo','oocsccsoo','ooccsscoo','oocccccoo','oooooo','oooo'],'Kopf',[ohr('o')]);
  const pandaReihen=hut=>[...(hut?zeilen(hut):['wwww','wwwwww']),'wsswwssw','wsswwssw','wwwsswww','wwssww','wwww'];
  const panda=(id,o={})=>add(id,[...pandaReihen(o.hut),...zeilen(o.unten||[])],'Kopf',[ohr('s'),...(o.extra||[])],o.teile||[]);
  const giraffeReihen=['kk','kkyykk','yyyyyy','yysyysyy','yyyyyyyy','ykyyyyky','yyssyy','yyyy','yyky','ykyy','yyky','ykyy'];
  const baer=(id,c='k',o={})=>kopf(id,c,{ohren:[c],nase:c==='w'?'s':'m',...o});
  const hase=(id,c='P',o={})=>kopf(id,c,{ohren:[c,4,1,80,'p'],nase:'p',...o});
  const katze=(id,c='n',o={})=>kopf(id,c,{ohren:[c],nase:'p',...o});
  const schwein=(id,c='p',o={})=>kopf(id,c,{ohren:[c],nase:c==='p'?'q':'p',mund:c,...o});

  // Tierwelt
  add('tiere-nilpferd','iiii iiiiii iisiisii iiiiiiii iiiiiiiiii iiwiiiiwii iiiiiiiiii iiiiiiii iiiiii','Kopf',[ohr('i')]);
  add('tiere-nashorn','nnnn nnnnnn nnsnnsnn nnnnnnnn nnnnnnnnnn nnnnwwnnnn nnnnwwnnnn nnnnnnnn nnnnnn','Kopf',[ohr('n')]);
  elefant('tiere-elefant');
  katze('tiere-katze');
  loewe('tiere-loewe');
  add('tiere-leopard','yyyy ykyyky yyyykyyy yysyysyy ykyyyyky yyyssyyy yykyyy yyyy','Kopf',[ohr('y')]);
  panda('tiere-panda');
  baer('tiere-baer');baer('tiere-eisbaer','w');
  add('tiere-affe','kkkk kkkkkk kkuuuukk kkususkk kuuuuuuk kkussukk kkuuuukk kkkk','Kopf',[ohr('k')]);
  add('tiere-affenkopf','mmmm mmmmmm mmuuuumm mmususmm muuuuuum mmussumm mmuuuumm mmmm','Kopf',[ohr('m')]);
  add('tiere-strauss','nn nnnn nsnnsn nnyynn nnnn nn nn nn nn nnnnnn nnnnnnnn nnnnnnnnnn nnnnnnnn nnnnnn','Figur',[beine(14,'y',3,1,-80)]);
  kopf('tiere-pfau','b',{kleid:'b',nase:'y',mund:'b',teile:[teil('Rad',1,'oben',1,'gygygygygygy gggggggggggggg gggggggggggg gggggggggg gggggggg gggggg')]});
  add('tiere-giraffe',giraffeReihen,'Figur',[ohr('y',1,1,30)]);
  add('tiere-schaf','wwww wwwwwwww wwwwwwwwww wwwwwwwwww wwwwwwww ssssss swssws ssssss ssss','Figur',[beine(9,'s',2,1,-75)]);
  kopf('tiere-lamm','w',{haar:'j',ohren:['w',2,1,20,'p'],nase:'p'});
  schwein('tiere-schwein');schwein('tiere-ferkel','E');
  kopf('tiere-pferd','k',{haar:'m',ohren:['k'],nase:'m',mund:'k',kleid:'k'});
  kopf('tiere-einhorn','w',{hut:'y yy pppp pppppp',ohren:['w'],nase:'p',mund:'w'});
  kopf('tiere-lama','j',{ohren:['j',2,1,70],nase:'k',mund:'j',kleid:'j'});
  kopf('tiere-hund','c',{ohren:['k',2,1,-20]});
  kopf('tiere-hund-lachend','c',{ohren:['k',2,1,-20],mund:'r'});
  hase('tiere-hase');
  katze('tiere-katze-socken','n',{kleid:'n',extra:[{r:11,n:1,f:1,a:-60,c:'w',fc:'w',w:'Pfoten'}]});
  baer('tiere-baer-tanzend','k',{kleid:'k',extra:[arme(9,'k',2,1,40),beine(11,'k',2,1,-50)]});

  // Kontinente
  loewe('kontinent-loewe');elefant('kontinent-elefant');
  add('kontinent-giraffe',giraffeReihen,'Figur',[ohr('y',1,1,30)]);
  panda('kontinent-panda');
  add('kontinent-tiger','oooo ossoss osooooso oosoosoo ooowwooo oosssoo oooo','Kopf',[ohr('o')]);
  kopf('kontinent-kaenguru','k',{ohren:['k',3,1,70],kleid:'k',extra:[beine(10,'k',3,2,-60)]});
  kopf('kontinent-koala','n',{teile:[teil('Ohren',2,'seiten',3,'nnn nnnn nnnn nnn')]});
  pinguin('kontinent-pinguin');
  kopf('kontinent-lama','j',{ohren:['j',2,1,70],nase:'k',mund:'j',kleid:'j'});
  kopf('kontinent-bison','m',{haar:'k',ohren:['m',2,1,30,'c'],mund:'m',kleid:'m'});
  baer('kontinent-baer');

  // Wald und Wiese
  const eule=(id,{augen='kwswwswk',unten=[]}={})=>add(id,['kkkk','kkkkkk','kwwwwwwk',augen,'kwwoowwk','kkwwwwkk','kkkkkkkk','kkkkkkkk','kkkkkk','kkkk',...zeilen(unten)],'Figur',[ohr('k',1,1,70)]);
  eule('wald-eule');eule('wald-eule-schlafend',{augen:'kwsswssk'});eule('wald-eule-buch',{unten:['rrrrrrrr','rrrrrrrr']});
  const fuchs=(id,{unten=[],extra=[],teile=[]}={})=>add(id,['oooo','oooooo','oosoosoo','oowwwwoo','owwsswwo','wwwwww','wwww',...zeilen(unten)],'Kopf',[ohr('o'),...extra],teile);
  fuchs('wald-fuchs');
  fuchs('wald-fuchs-sitzend',{unten:['oo','oooooo','oooooo','oooo'],teile:[teil('Schwanz',1,'rechts',9,'oo ooo ooo ww')]});
  fuchs('wald-fuchs-pfoten',{unten:['oo','oooooo','oooooo','oooo'],extra:[arme(9,'o',1,1,20,'Pfoten','w')]});
  kopf('wald-eichhoernchen','I',{ohren:['I',1,1,70],kleid:'I',teile:[teil('Schwanz',1,'rechts',8,'III IIII IIII IIII III')]});
  kopf('wald-eichhoernchen-gross','I',{ohren:['I',1,1,70],kleid:'I',teile:[teil('Schwanz',1,'rechts',8,'IIII IIIII IIIII IIIII IIII')]});
  kopf('wald-eichhoernchen-lesend','I',{ohren:['I',1,1,70],kleid:'I',teile:[teil('Schwanz',1,'rechts',8,'III IIII IIII IIII III'),teil('Buch',1,'unten',11,'bbbbbb bbbbbb')]});
  const igel=(id,extra=[])=>add(id,'kkkk kkkkkkkk kkkkkkkkkk kkkkkkkkkkkk kkkkkkkkkk uuuuuuuu uusuusuu uuuuuuuu uuusuu','Figur',[{r:3,n:1,f:1,a:20,c:'k',fc:'k',w:'Stacheln'},...extra]);
  igel('wald-igel');igel('wald-igel-stehend',[beine(9,'u',2,1,-70)]);igel('wald-igel-laufend',[beine(9,'u',2,1,-40)]);
  add('wald-pilzhaus','rrrr rrwwrrrr rrrrrrwwrr rrrrrrrrrrrr wwwwwwww wwwwwwww wwwkkwww wwwkkwww wwwwwwww','Symbol');
  add('wald-fliegenpilz','rrrr rrwwrrrr rrrrrrwwrr rrrrrrrrrrrr wwwwww wwwwww wwwwww wwwwww','Symbol');
  add('wald-pilz-raupe','rrrr rrwwrrrr rrrrrrwwrr rrrrrrrrrrrr wwwwww wwwwww gggggggggg sggggggggg','Symbol');
  add('wald-pilz-gesicht','rrrr rrwwrrrr rrrrrrwwrr rrrrrrrrrrrr wwwwwwww wwswwsww wwwwwwww wwssssww wwwwww','Symbol');
  kopf('wald-hirsch','k',{ohren:['k'],teile:[teil('Geweih',2,'seiten',1,'cc c cc c')]});
  kopf('wald-elch','m',{ohren:['m'],mund:'m',teile:[teil('Geweih',2,'seiten',1,'ccc cccc cccc ccc')]});
  kopf('wald-reh','c',{ohren:['c',2,1,50],wange:'j'});
  const biene=(id,rows='yyyy yyyyyy yysyysyy ssssssss yyyyyyyy ssssssss yyyyyy ssss',unten=[])=>add(id,[...zeilen(rows),...zeilen(unten)],'Figur',[ohr('s',1,1,70)],[fluegel('ll llll llll ll',4)]);
  biene('wald-biene');
  biene('wald-biene-dick','yyyy yyyyyyyy yysyyyysyy ssssssssss yyyyyyyyyy ssssssssss yyyyyyyy ssssss');
  biene('wald-biene-waben',undefined,['cccccc','cccccccc','cccccc']);
  biene('wald-biene-spiegel','yyyy yyyyyy yysyysyy yyyyyyyy ssssssss yyyyyyyy ssssss yyyy');
  const falter=(id,c)=>add(id,['ss','ss','ss','ss','ss','ss','ss'],'Figur',[ohr('s',1,1,70)],[fluegel(c.length>1?c:`${R(c,3)} ${R(c,6)} ${R(c,7)} ${R(c,6)} ${R(c,4)} ${R(c,3)}`,2)]);
  falter('wald-schmetterling-rosa','p');falter('wald-schmetterling-orange','o');falter('wald-schmetterling-gruen','g');
  const kaefer=(id,kopfRows='ssss ssssss')=>add(id,[...zeilen(kopfRows),'rrrssrrr','rsrssrsr','rrrssrrr','rsrssrsr','rrrssrrr','rrssrr','rrrr'],'Figur',[beine(4,'s',1,1,0),beine(6,'s',1,1,-30)]);
  kaefer('wald-marienkaefer');kaefer('wald-marienkaefer-lachend','ssss swssws');
  add('wald-marienkaefer-paar','ssssssssssssss rrrsrrrrrrsrrr rsrsrsrrsrsrsr rrrsrrrrrrsrrr rsrsrsrrsrsrsr rrrsrrrrrrsrrr','Figur');
  add('wald-marienkaefer-rund','ssss ssssss rrrrrrrr rrsrrsrr rrrrrrrr rrsrrsrr rrrrrr rrrr','Figur',[beine(4,'s',1,1,0)]);
  add('wald-frosch','wsggsw gggggggg gggggggggg gssssssg gggggggg gggggg','Figur',[beine(5,'g',2,1,-30)]);
  kopf('wald-frosch-einfach','g',{ohren:['g',1,1,80,'s']});
  kopf('wald-froschkoenig','g',{hut:'yyyy yyyyyy gggggg',ohren:['g',1,1,80,'s']});
  const blaetter=[{r:8,n:2,f:1,a:-20,c:'g',fc:'g',w:'Blätter'}];
  const blume=(id,bl,m='y')=>add(id,[R(bl,4),R(bl,6),bl+bl+R(m,4)+bl+bl,bl+bl+R(m,4)+bl+bl,R(bl,6),R(bl,4),'gg','gg','gg'],'Symbol',blaetter);
  add('wald-sonnenblume-gesicht','yyyy yyyyyy ykskksky ykkkkkky ykksskky yyyyyy yyyy gg gg gg','Symbol',blaetter);
  add('wald-blume-lachend','pppp pppppp pyyyyyyp pysyysyp pyyssyyp pppppp pppp gg gg gg','Symbol',blaetter);
  blume('wald-blume-rosa','p');blume('wald-blume-blau','b');blume('wald-blume-einfach','r');blume('wald-blume-orange','o','k');blume('wald-sonnenblume','y','k');
  add('wald-baum-fruechte','gggg gggggggg grgggggrgg gggggggggggg ggrgggrggrgg gggggggggg kkkk kkkk kkkk','Symbol');
  const schnecke=(id,c)=>add(id,[R(c,4),R(c,6),R(c,8),R(c,8),R(c,6),'hhhhhhhhhh','hhhhhhhhhhhh'],'Figur',[{r:6,n:2,f:1,a:60,c:'h',fc:'s',w:'Fühler'}]);
  schnecke('wald-schnecke-orange','o');schnecke('wald-schnecke-braun','k');

  // Dinos und Fabelwesen
  add('fig-t-rex','gggg gggggg gggsgg gggggggg ggwwwwgg gggggg gggggggg gggggggggg gggggggggg gggggggg gggggg gggg','Figur',[arme(8,'g',1,1,0),beine(11,'g',2,2,-70)]);
  add('fig-triceratops','w ww hhhh hhhhhh hhhhhhhh hhhhhhhhhh hhshhhhshh hhhhhhhhhh hhhhhhhh hhhhhh hhhh','Figur',[{r:5,n:2,f:1,a:40,c:'w',fc:'w',w:'Hörner'}]);
  add('fig-stegosaurus','oo oooooo oooooooooo gggggggggggg gggggggggggggg gggggggggggg gggggggggg','Figur',[beine(7,'g',2,2,-70)]);
  add('fig-brachiosaurus','gggg gsgggg gggg ggg ggg ggg ggg gggg gggggggg gggggggggggg gggggggggggggg gggggggggggg gggggggggg','Figur',[beine(13,'g',2,2,-70)]);
  kopf('fig-drache','g',{ohren:['g',2,1,65,'y'],augen:'r',mund:'w',kleid:'g',teile:[fluegel('rrr rrrr rrrrr rrrr rr',8)]});
  add('fig-alien','gggg gggggg gssggssg gssggssg gggggggg gggssggg gggggg gggg','Kopf',[ohr('g',2,1,80,'y')]);
  add('fig-monster','vvvv vvvvvv vvwwwwvv vvwsswvv vvwwwwvv vvssssvv vvwvvwvv vvvvvv vvvv','Kopf',[ohr('v',1,1,70,'y')]);
  add('fig-roboter','n nnnnnn nnnnnnnn nnsnnsnn nnnnnnnn nnssssnn nnnnnnnn nnnn bbbbbbbb bbbbbbbb bbrbbgbb bbbbbbbb nnnn nnnn','Figur',[arme(9,'n',2,1,0),beine(14,'n',1,1,-80)]);

  // Meer
  const krabbe=(id,c,oben=[])=>{const o=zeilen(oben).length;add(id,[...zeilen(oben),R(c,4),R(c,8),R(c,10),R(c,10),R(c,8),R(c,4)],'Figur',[{r:1+o,n:1,f:1,a:70,c,fc:'s',w:'Augen'},{r:2+o,n:2,f:2,a:30,c,fc:c,w:'Scheren'},{r:4+o,n:2,f:1,a:-20,c,fc:c,w:'Beine'},{r:5+o,n:2,f:1,a:-50,c,fc:c,w:'Beine'}])};
  krabbe('fig-krebs','r');krabbe('meer-krabbe-orange','o');krabbe('meer-krabbe-koenig','r',['yyyy','yyyy']);krabbe('meer-krabbe-rosa','p');
  const hai=(id,c)=>add(id,farben('nn nnn nnnn nnnnnnnnnnnn nsnnnnnnnnnnnn nwwwwwwwwwwwnn wwwwwwwwww wwwwww',{n:c}),'Figur',[],[teil('Schwanzflosse',1,'rechts',5,`${R(c,2)} ${R(c,3)} ${R(c,3)} ${R(c,2)}`)]);
  hai('fig-hai','a');hai('meer-hai-grau','n');
  add('fig-seepferd','oooo oosooo oooooooo ooo ooo oooo ooooo ooooo oooo ooo ooo oo','Figur');
  add('fig-clownfisch','oooo osoooo oooooooo wwooooooww oowwoowwoo oooooooooo oooooooo oooooo oooo','Figur',[],[teil('Schwanzflosse',1,'rechts',5,'oo ooo ooo oo')]);
  add('fig-muschel','pppp pppppppp pwpwpwpwpw pppppppppppp pwpwpwpwpwpw pppppppppp pppppppp pppp pp','Symbol');
  const krake=(id,c)=>add(id,[R(c,4),R(c,6),c+c+'s'+c+c+'s'+c+c,R(c,8),R(c,8),R(c,6),R(c,4),c+c,c+c],'Figur',[{r:5,n:3,f:1,a:-20,c,fc:c,w:'Arme'},{r:6,n:3,f:1,a:-50,c,fc:c,w:'Arme'},{r:7,n:3,f:1,a:-75,c,fc:c,w:'Arme'}]);
  krake('meer-krake-lila','v');krake('meer-krake-rot','r');
  const wal=(id,c,sp='l')=>add(id,[sp,sp+sp,R(c,10),R(c,14),c+c+'s'+R(c,11),R(c,14),c+c+'wwwwwwwwww'+c+c,'wwwwwwwwww','wwwwww'],'Figur',[],[teil('Schwanzflosse',1,'rechts',6,`${R(c,2)} ${R(c,3)} ${R(c,3)} ${R(c,2)}`)]);
  wal('meer-wal-tuerkis','e');wal('meer-wal-blau','b');wal('meer-wal-hellblau','l','w');
  add('meer-pottwal-grau','l ll nnnnnnnnnnnn nnnnnnnnnnnnnn nnsnnnnnnnnnnn nnnnnnnnnnnnnn nnnnnnnnnnnn nnnnnnnn nnnn','Figur',[],[teil('Schwanzflosse',1,'rechts',6,'nn nnn nnn nn')]);
  add('meer-seestern-lachend','oo oo oooo oooooo oosoosoo oooooooo oossssoo oooooo oooo','Figur',[{r:5,n:3,f:1,a:20,c:'o',fc:'o',w:'Arme'},{r:8,n:3,f:1,a:-60,c:'o',fc:'o',w:'Arme'}]);
  add('meer-fisch-brummig','bbbb bbsbbb bbbbbbbb bbbbbbbbbb bbbbbbbbbb bbbsssbb bbbbbb bbbb','Figur',[],[teil('Schwanzflosse',1,'rechts',4,'bb bbb bbb bb')]);

  // Zirkus
  const clown=(id,o={})=>kopf(id,'u',{haar:'r',nase:'r',mund:'r',ohren:['r',2,1,20],...o});
  add('zirkus-robbe','rr rrrr nnnn nnnnnn nnsnnsnn nnnwwnnn nnnnnnnn nnnnnn nnnnnnnn nnnnnnnnnn nnnnnnnnnnnn','Figur',[{r:10,n:2,f:1,a:-30,c:'n',fc:'n',w:'Flossen'}]);
  kopf('zirkus-jongleur','u',{haar:'k',kleid:'b',extra:[{r:9,n:2,f:1,a:50,c:'u',fc:'r',w:'Arme'}]});
  kopf('zirkus-direktor','u',{hut:'ssssss ssssss ssssssss',haar:'k',kleid:'r',extra:[arme(9,'r',2,1,-30,'Arme','u')]});
  clown('zirkus-clown-eis',{teile:[teil('Glace',1,'rechts',6,'pp pppp pppp cc cc c')]});
  clown('zirkus-clown-gross',{kleid:'y',extra:[arme(9,'y',2,1,30,'Arme','u'),beine(11,'b',2,2,-70)]});
  kopf('zirkus-clown-weiss','w',{haar:'b',nase:'r',mund:'r',ohren:['b',2,1,20]});
  add('zirkus-zelt-rot','yy rrrr rrrrrr rwrwrwrwrw rwrwrwrwrwrw rrrrrrrrrrrrrr rwrwrwrwrwrwrw rwrwrwrwrwrwrw','Symbol');
  kopf('zirkus-hund-nase','c',{ohren:['k',2,1,-20],nase:'r'});
  clown('zirkus-clown-hut',{hut:'b bb bbbb rrrrrr'});
  kopf('zirkus-narr-laute','u',{hut:'r rrr rrrrr yyyyyy',kleid:'v',extra:[{r:9,n:2,f:1,a:20,c:'u',fc:'k',w:'Arme'}]});
  elefant('zirkus-elefant-kugel','n',['rrrrrrrr','rrrrrrrrrr','rrrrrrrr']);
  elefant('zirkus-elefant-tonne','n',['kkkkkk','kkkkkk','kkkkkk']);
  kopf('zirkus-zauberer','u',{hut:'a aaa aaaaa aaaaaaaa',haar:'w',kleid:'a',extra:[{r:9,n:2,f:1,a:40,c:'a',fc:'s',w:'Arme'}]});
  add('zirkus-giraffe-zauberer','a aaa aaaaa yyyyyy yysyysyy yyyyyyyy ykyyyyky yyssyy yyyy yyky ykyy yyky ykyy','Figur');
  add('zirkus-keulen','yy yyy yyyy rrrr rrrrr rrrrrr rrrrrr rrrr','Symbol');
  loewe('zirkus-loewe-ballon','rrrr rrrrrr rrrr rr oooo oooooo');
  schwein('zirkus-schwein-ballon','p',{hut:'bbbb bbbbbb bbbb bb pppp pppppp'});
  elefant('zirkus-elefant-ballon','n',[],['yyyy','yyyyyy','yyyy','yy']);

  // Winter
  kopf('winter-kind-muetze','u',{hut:'rr rrrr rrrrrr wwwwww',haar:'k',kleid:'b'});
  baer('winter-baer-schal','k',{unten:['rrrrrr','rrrrrrrr'],kleid:'k'});
  baer('winter-baer-bett','k',{unten:['bbbbbbbbbb','bbbbbbbbbbbb','bbbbbbbbbbbb','wwwwwwwwwwww']});
  pinguin('winter-pinguin-mantel',{bauch:'r',hut:'rr rrrr rrrrrr'});
  const schneemann=(id,{hut=[],hals,unten=[],extra=[],teile=[]}={})=>{const h=zeilen(hut);add(id,[...h,'wwww','wswwsw','wwwowww','wwwwww',hals||'wwww','wwwwww','wwwwwwww','wwwswwww','wwwwwwww','wwwswwww','wwwwwwww','wwwwww',...zeilen(unten)],'Figur',[arme(h.length+7,'k',2,1,30),...extra],teile)};
  schneemann('winter-schneemann-besen',{teile:[teil('Besen',1,'rechts',7,'k k k k yyy yyy')]});
  schneemann('winter-schneemann-feuer',{teile:[teil('Feuer',1,'rechts',10,'yy oyyo rooor rrrr')]});
  schneemann('winter-schneemann-hut',{hut:'ssss ssssss'});
  schneemann('winter-schneemann-schal',{hals:'rrrrrr'});
  schneemann('winter-schneemann-ski',{unten:['bbbbbbbbbbbbbb']});
  schneemann('winter-schneemann-bommel',{hut:'w rrrr rrrrrr'});
  baer('winter-eisbaer-tasse','w',{kleid:'w',teile:[teil('Tasse',1,'rechts',9,'rrr rrr rrr')]});
  pinguin('winter-pinguin-detektiv',{hut:'kkkk kkkkkk kkkkkkkk'});
  pinguin('winter-pinguin-koenig',{hut:'yyyyyy yyyyyy'});
  pinguin('winter-pinguin-rund',{c:'z'});
  pinguin('winter-pinguin-dick',{bauch:'j'});
  pinguin('winter-pinguin-schuerze',{bauch:'p'});
  pinguin('winter-pinguin-schreitet',{c:'a'});

  // Frühling und Garten
  biene('fig-bienen-tulpen',undefined,['rrrrrr','rrrrrr','gg','gg']);
  blume('fig-gaensebluemchen','w');blume('fig-blume-lila','v');
  falter('fig-falter-blau','b');falter('fig-falter-lila','v');falter('fig-falter-orange','o');
  falter('fig-falter-bunt','rrr yyyyyy gggggg bbbbbb vvvv ppp');
  const kaefer2=(id,c)=>add(id,['ssss','ssssss',R(c,3)+'ss'+R(c,3),c+'s'+c+'ss'+c+'s'+c,R(c,3)+'ss'+R(c,3),c+c+'ss'+c+c,R(c,4)],'Figur',[beine(4,'s',1,1,0),beine(6,'s',1,1,-30)]);
  kaefer2('fig-kaefer-a','g');kaefer2('fig-kaefer-b','b');kaefer2('fig-kaefer-c','o');kaefer2('fig-kaefer-liebe','q');
  const kueken=(id,{augen='yysyysyy',mund='yyyooyyy',unten=[],fuesse=true}={})=>add(id,['yyyy','yyyyyy',augen,mund,'yyyyyyyy','yyyyyyyyyy','yyyyyyyyyy','yyyyyyyy','yyyyyy',...zeilen(unten),...(fuesse?['oooo']:[])],'Figur',[{r:6,n:2,f:1,a:20,c:'y',fc:'y',w:'Flügel'}]);
  kueken('fig-kueken-lachend',{mund:'yyoooyyy'});
  kueken('fig-kueken-gesicht',{augen:'ywsyyswy'});
  kueken('fig-kueken-ei',{unten:['wwwwwwww','wwwwww'],fuesse:false});
  kueken('fig-kueken-gelb');
  const henne=(id,unten=[])=>add(id,['rr','wwww','wswwsw','wwwoowww','wwwwwwww','wwwwwwwwww','wwwwwwwwww','wwwwwwww',...zeilen(unten),'oooo'],'Figur',[{r:6,n:2,f:1,a:20,c:'w',fc:'w',w:'Flügel'}]);
  henne('fig-henne-kueken',['yyyy','yyyyyy']);
  schnecke('fig-schnecke-orange','o');schnecke('fig-schnecke-braun','k');schnecke('fig-schnecke-gelb','y');schnecke('fig-schnecke-gruen','g');
  panda('fig-schirm-panda',{hut:'rrrr rrrrrrrr rrrrrrrrrr'});
  pinguin('fig-giesskanne-pinguin',{teile:[teil('Giesskanne',1,'rechts',8,'gg gggg gggg ggg')]});
  const stiefel=(id,c)=>add(id,[R(c,4),R(c,4),R(c,4),R(c,4),R(c,6),R(c,8),R(c,8)],'Symbol');
  stiefel('fig-stiefel-blau','b');stiefel('fig-stiefel-pink','q');stiefel('fig-stiefel-gelb','y');
  add('fig-giraffe-bunt','kk kkyykk yyyyyy yysyysyy yyyyyyyy yryyyyby yyssyy yyyy yyvy ygyy yyry ybyy','Figur',[ohr('y',1,1,30)]);
  pinguin('fig-osterpinguin',{extra:[ohr('s',3,1,80,'p')]});
  biene('fig-bienen-b','yyyy yyyyyyyy yysyyyysyy ssssssssss yyyyyyyyyy ssssssssss yyyyyyyy ssssss');
  biene('fig-bienen-c','yyyy yyyyyy yysyysyy oooooooo yyyyyyyy oooooooo yyyyyy oooo');
  biene('fig-bienen-d',undefined,['pppp','pppppp','gg','gg']);
  biene('fig-bienen-honig',undefined,['cccccc','cccccccc','cccccc']);
  // Bärentatze: vier Zehen mit Krallen über dem grossen Ballen.
  add('tiere-baerentatze','swwswwswws sswsswsswss sswsswsswss sssssss sssssssss sssssssssss sssssssss sssssss sssss','Symbol');
};
