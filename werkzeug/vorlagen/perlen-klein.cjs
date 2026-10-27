/* Kleine, bewusst vereinfachte Fädelmotive. Keine Bildabtastung und keine
 * Schattierungsfarben: jede Zeile ist eine zusammenhängende, mittige Reihe.
 * Komplexe Figuren werden als Kopf, Maske oder Erkennungszeichen dargestellt.
 * node werkzeug/vorlagen/perlen-klein.cjs
 */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const katalog=JSON.parse(fs.readFileSync(path.join(root,'werkzeug/vorlagen/figuren.json'),'utf8'));
const motive=new Map();
const zeilen=s=>Array.isArray(s)?s:s.trim().split(/\s+/);
function add(ids,rows,art='Symbol',beine=[]){for(const id of ids.split(' ')){
  if(motive.has(id))throw Error('Doppelt: '+id);
  motive.set(id,{rows:zeilen(rows),beine:structuredClone(beine),vereinfachung:art});
}}
function farben(rows,map){return zeilen(rows).map(r=>[...r].map(c=>map[c]||c).join(''))}
function ohr(c,n=2,f=1,a=65,fc=c){return {r:1,n,f,a,c,fc,w:'Ohren'}}
function kopf(ids,c,{haar,ohren,nase='s',augen='s',wange=c,hut,kleid,mund='s',extra=[]}={}){
  const h=haar||c;
  let rows=[h.repeat(4),h.repeat(6),h+c.repeat(6)+h,c.repeat(2)+augen+c.repeat(2)+augen+c.repeat(2),wange+c.repeat(2)+nase.repeat(2)+c.repeat(2)+wange,c.repeat(2)+mund.repeat(2)+c.repeat(2),c.repeat(4)];
  if(hut)rows=[...zeilen(hut),...rows.slice(2)];
  if(kleid)rows.push(kleid.repeat(2),kleid.repeat(6),kleid.repeat(6),kleid.repeat(4));
  add(ids,rows,'Kopf',ohren?[ohr(...ohren),...extra]:extra);
}
function maske(ids,c,augen='w',stirn=c){add(ids,[stirn.repeat(4),stirn.repeat(6),c+c+augen+augen+c+c+augen+augen+c+c,c+c+c+augen+c+c+augen+c+c+c,c.repeat(8),c.repeat(6),c.repeat(4)],'Maske')}
function ninja(id,c){add(id,[c.repeat(4),c.repeat(6),c+'yyyyyyyy'+c,c+'yssyyssy'+c,c.repeat(10),c.repeat(8),c.repeat(6),c.repeat(4)],'Maske')}
const herz='rrwwrr rrrrrrrr rrrrrrrr rrrrrr rrrr rr';
const stern='yy yyyy yyyyyyyyyyyy yyyyyyyyyy yyyyyyyy yyywwyyy yywwwwyy';
const ei='ww wwww wwwwww wwwwwwww wwwwwwww wwwwwwww wwwwww wwww';
const ball='srrs srrrrs srrrrrrs ssswwsss swwwws swws';
const geist='cccc cccccc cwccwc cwsccswc cccccccc cccccccc ccwwcc cccc';

// Pokémon und Sonic: kleine Köpfe mit Augen, Wangen, Ohren oder Schnabel.
add('pokeball',ball);add('superball','sbbs srbbrs srbbbbrs ssswwsss swwwws swws');
add('hyperball','syys syssys syssssys ssswwsss swwwws swws');
kopf('felori','h',{haar:'g',ohren:['g',2,1,65,'h'],nase:'p',augen:'q'});
kopf('krokel','r',{hut:'yy rrrr rrrrrr',nase:'w',mund:'w'});
kopf('kwaks','w',{hut:'bbbb bbbbbb bbbbbbbb',nase:'y',mund:'y'});
add('digda','kk kkkk kkskskk kkppkk kkkkkk nnnnnnnn');
kopf('voltilamm','l',{haar:'j',ohren:['y',2,1,25,'s'],nase:'s',wange:'j'});
kopf('evoli','k',{ohren:['k',3,1,65,'s'],nase:'s',wange:'j',kleid:'j'});
kopf('schiggy','l',{nase:'l',mund:'r',kleid:'c'});
kopf('bisasam','h',{haar:'g',ohren:['h',1,1,65],augen:'r',wange:'g',nase:'h'});
kopf('glumanda','o',{nase:'o',mund:'r',kleid:'y'});
kopf('gengar','v',{ohren:['v',1,1,65],augen:'r',nase:'v',mund:'w'});
kopf('pummeluff','p',{hut:'pp pppp pppppp',ohren:['p',1,1,65,'s'],augen:'b',nase:'p'});
kopf('mauzi','j',{hut:'yy jyyj jjjjjj',ohren:['k',2,1,65],nase:'p'});
kopf('glurak','o',{ohren:['o',2,1,65],wange:'j',nase:'o',mund:'w'});
kopf('lucario','b',{ohren:['b',3,1,70,'s'],haar:'s',wange:'s',nase:'s',augen:'r'});
kopf('mewtu','i',{ohren:['i',1,1,65],augen:'v',nase:'i',kleid:'v'});
kopf('mew','p',{ohren:['p',1,1,65],augen:'b',nase:'p'});
kopf('lugia','w',{haar:'b',ohren:['b',2,1,50],nase:'w',mund:'b'});
kopf('ho-oh','r',{hut:'yy yyyy rrrr',ohren:['g',2,1,20,'r'],nase:'y',mund:'y'});
kopf('relaxo-liegend','j',{haar:'a',ohren:['a',1,1,65],nase:'j',kleid:'a'});
kopf('pikachu pikachu-kopf','y',{ohren:['y',3,1,70,'s'],wange:'r',nase:'s'});
add('goldener-ring','yyyy yywwyy yywwwwyy yywwwwyy yywwyy yyyy');
add('chaos-emerald','gggg ghhhhg ghghghg dggggd dggd dd');
kopf('tails','w',{haar:'o',ohren:['o',2,1,65,'w'],nase:'s',wange:'o'});
kopf('amy-rose','u',{haar:'p',ohren:['p',1,1,65],augen:'g',nase:'s'});
kopf('knuckles','r',{haar:'r',ohren:['r',3,1,-70],wange:'u',nase:'s'});
kopf('sonic-kopfprofil','u',{haar:'b',ohren:['b',2,1,40],augen:'g',nase:'s'});
kopf('dr-eggman','u',{hut:'uuuu uwwwwu ussssu',nase:'r',mund:'k',wange:'k',kleid:'r'});
kopf('shadow','u',{haar:'s',ohren:['s',2,1,50,'r'],augen:'r',wange:'s',nase:'s'});

// Nintendo. Keine Schattierungen und keine schrägen Posen.
const pilz='rrrr rrwwrr rwwwwrrr rrrrrrrr wwww wsws wwww';
add('super-pilz',pilz);add('1-up-pilz',farben(pilz,{r:'g'}));
add('feuerblume','rrrr ryyyy ryywwyyr rywswsyr ryyyyyyr rrrr gg gggggg gg');
add('muenze','yyyy yyccyy yycyycyy yycyycyy yyccyy yyyy');
add('yoshi-ei',farben(ei,{w:'w'}).map((r,i)=>i===2?'wwggww':i===3?'wwggwwww':i===5?'wwwggwww':r));
add('goomba','kkkk kkkkkk kswwswwsk kswkswksk kkkkkkkkkk kkwwwwkk uuuu uuuu ssssssss');
add('stern-superstern',farben(stern,{y:'y'}).map((r,i)=>i===3?'yysyysyy':r));
add('fragezeichen-block','oooooooo oyyyyyyo oysssyyo oyyyssyo oyyssyyo oyyyyyyo oyyssyyo oooooooo');
add('piranha-pflanze','rrwwrr rwrrrrwr rrwwrrrr ssswwsss rrrrrrrr rrwwrr gg gggggg gg');
function mario(id,c){add(id,[c.repeat(6),c.repeat(3)+'ww'+c.repeat(3),c.repeat(10),'kusuusuk','kuuuuuuk','ukkkkkku','uuuuuu','uuuu'],'Kopf')}
mario('mario','r');mario('luigi','g');
kopf('yoshi','g',{hut:'wwww wswwsw gggggggg',nase:'g',wange:'w',mund:'r'});
add('toad','rrrr rrwwrr rwwwwrrr rrrrrrrr uuuu usus uuuu bbwwbb bbwwbb');
kopf('prinzessin-peach','u',{hut:'yry yyyyyy yyyyyyyy',haar:'y',augen:'b',nase:'u',mund:'p',kleid:'p'});
kopf('boo-geist','w',{nase:'w',mund:'r',extra:[{r:5,n:1,f:1,a:10,c:'w',fc:'w',w:'Arme'}]});
add('shy-guy','rrrr rwwwwr rwswswr rwwwwwwr rwwsswwr rrrrrr rrrr bbbbbb');
kopf('bowser','g',{hut:'rr rrrr gggggg',ohren:['w',2,1,65],augen:'r',nase:'c',wange:'c',mund:'w'});
kopf('donkey-kong','u',{haar:'k',ohren:['k',0,3,0,'u'],nase:'k',wange:'k',kleid:'r'});
add('triforce-zelda','y yyy yyyyy wwwwwww yyywyyy yyyyywyyyyy');
add('rubin-zelda','rrrr rrrrrr rrrwrrrr rrrrrr rrrr rr');
add('herzcontainer-zelda','rrwwrr wrrrrrrw wrrrrrrw wrrrrw wrrw ww');
add('link-8-bit','gggg gggggg yyyuyy uysusu yuuuuuy uuuu gggggg ggccgg gggggg kkkk');
kopf('korok','c',{hut:'gg gggg gggggg',haar:'g',nase:'g',mund:'g'});
kopf('kirby','p',{nase:'p',wange:'q',augen:'b',mund:'r',extra:[{r:7,n:0,f:3,a:-35,c:'r',fc:'r',w:'Füsse'}]});
kopf('waddle-dee','u',{haar:'o',wange:'o',nase:'u',mund:'u',extra:[{r:7,n:0,f:3,a:-35,c:'y',fc:'y',w:'Füsse'}]});
add('game-boy','nnnnnn nssssn nshhsn nshhsn nssssn nnnnnn nsnnrn sssnnr nsnnnn nnnnnn');
add('controller','nnnnnnnn nnnnnnnnnn nnsnnnnrnn nsssnnrnrn nnsnnnnrnn nnnnnnnn');
add('splatoon-tintenfisch-silhouette','oo oooo oooooo oooooooo owwwwww owswwswo oooooooo oowwoo');
kopf('splatoon-inkling','u',{haar:'o',ohren:['o',3,1,-60],augen:'s',nase:'u'});
add('animal-crossing-blatt-logo','gg gggg gghggg gghhgggg ggghgggg gggghgg ggghg gg');
kopf('animal-crossing-tom-nook','k',{ohren:['k',0,3,40,'c'],haar:'m',wange:'m',nase:'s',kleid:'g'});
kopf('animal-crossing-k-k-slider','w',{ohren:['w',2,1,-65],haar:'s',nase:'s',mund:'s'});

// Minecraft: klare acht Perlen breite Raster.
add('tnt-block','rrrrrrrr rrrrrrrr wwwwwwww ssswswss wswwssss wswwswws wwwwwwww rrrrrrrr');
add('grasblock','gggggggg gggggggg kgkgkgkg kkkkkkkk kkckkckk kkkkkkkk');
const creeper='gggggggg gssggssg gssggssg gggssggg ggssssgg ggssssgg ggsggsgg gggggggg';
add('creeper-gesicht',creeper);add('creeper',zeilen(creeper).concat(['gggg','gggg','gggg','gggggg','ggssgg']),'Figur');
add('diamant','llll lbllbl bllblblb bllllllb bllllb bllb bb');
add('schwert','ll llll llll llll llll bbbbbbbb kk kk kk');
add('diamanten-spitzhacke','bbbbbbbb bllbbbllb kk kk kk kk kk');
add('herz-lebensanzeige mc-herz',herz);
add('erfahrungs-smaragd-block','gggg ghhhhg ghghhhhg ghhhghhg gghhgg gggg');
add('fig-schwein','pppppppp pppppppp psppppsp pppppppp ppqqqqpp ppqssqpp pppppppp');
add('mc-kuh','kkwwkkww kkkwwwww kswkksww wwwwkkkw wpppppww wpspspww wwwwwwww');
add('mc-huhn stardew-huhn hay-day-huhn crossy-road-huhn','rr wwww wswwsw wyyyyw wrrrrw wwwwww wwwwww yy');
add('mc-schaf','wwwwwwww wwccccww wcscscw wccccccw wwcppcww wwwwwwww');
add('zombie-gesicht','gggggggg gdggggdg gdgddgdg gggggggg ggddddgg gggggggg');
add('skelett-gesicht','nnnnnnnn nssnnssn nssnnssn nnnssnnn nssssssn nnnnnnnn');
add('steve-gesicht','kkkkkkkk kkkkkkkk kuuuuuuk uwbuubwu uuuuuuuu uukkkuuu uukukuuu uukkkkuu');
add('alex-gesicht','oooooooo oooooooo ouuuuuoo owguugwo uuuuuuoo uuuuouoo uuuuuuoo');
add('enderman','ssssssss ssssssss sqqssqqs ssssssss ssssssss ssss ssss ssss');
kopf('axolotl axolotl-allgemein squishmallow-archie-axolotl','p',{ohren:['q',2,3,10],nase:'p',mund:'q',kleid:'p'});
add('mc-biene','ss syyssyys ysyyssys syyssyys syyssyys yyssssyy');
kopf('allay','l',{haar:'b',nase:'l',augen:'w',mund:'l',kleid:'b',extra:[{r:7,n:1,f:3,a:30,c:'l',fc:'l',w:'Flügel'}]});
add('wither','ssssssssssss swswsssswsws ssssssssssss ssssssss ssss ssss ssss');
kopf('enderdrache','s',{ohren:['n',2,1,65],augen:'q',nase:'n',mund:'n'});
add('mc-stern','w www wwwwwwwwww wwwywww wwwww www ww');
add('steve','kkkkkk kkkkkkkk uwbuubwu uukkkuu uukukuu eeeeeeee eeeeeeee eeuuee bbbbbb bbbbbb ssssss');

// Spiele und Spielzeug.
kopf('fall-guys-figur','w',{haar:'q',wange:'q',nase:'w',mund:'w',kleid:'q'});
kopf('junimo','g',{nase:'g',mund:'g',extra:[{r:5,n:1,f:1,a:0,c:'g',fc:'g',w:'Arme'}]});
add('pac-man','yyyy yyyyyy yyysyyyy yyyyywww yyyyyy yyyy');
for(const [id,c] of [['blinky','r'],['pinky','p'],['inky','l'],['clyde','o']])add(id,farben(geist,{c}));
add('pac-man-kirsche','gg gggg gggggg rrggggrr rrrwwrrr rrrrrrrr rrrrrr');
add('space-invaders-alien','gggggg gggggggg ggwggwgg gggggggg gggggggggg ggwwwwgg');
add('tetris-i','llllll llllll');add('tetris-o','yyyy yyyy yyyy');
add('tetris-l','oowwww oowwww oowwww oooooo oooooo');
add('tetris-s','wwgggg wwgggg ggggww ggggww');
add('tetris-t','vvvvvv vvvvvv wwvvww wwvvww');
add('among-us-astronaut','rrrr rrrrrr rllllr rlllllr rrrrrrrr rrrrrr rrwwrr');
add('roblox-noob','yyyy yyyyyy ysyysy yyyyyy yyssyy bbbbbb ybbbb bbbb gggggg gggggg');
add('roblox-logo-quadrat','ssssssss ssssssss sswwwwss sswwwwss sswwwwss sswwwwss ssssssss ssssssss');
kopf('fortnite-lama','v',{ohren:['v',2,1,65],nase:'l',wange:'l',augen:'w'});
add('fortnite-peely-banane','kk yy yyyy yyysys yyyyyy yyssyy yyyyyy yyyy kk');
kopf('red','r',{haar:'s',nase:'y',wange:'w',mund:'y'});
kopf('chuck','y',{hut:'ss yy yyyy',nase:'o',wange:'w',mund:'o'});
kopf('bomb','s',{hut:'y kk ssss',nase:'o',wange:'n',mund:'o'});
add('cuphead-tasse','rr ww rr wwwwwwww wwswwsww wwwwwwrw wwwrrwww wwwwww rrwwrr','Kopf');
add('brawl-stars-logo-totenkopf','yyyy yyssssyy ysswwssy ysswwssy yssssssy yysssyy yyyy');
kopf('spike-kaktus','g',{hut:'rr rrrr gggggg',nase:'g',mund:'s',kleid:'v'});
kopf('leon','u',{haar:'g',hut:'ggyygg ggyygggg ggyygggg',nase:'u',wange:'g'});
maske('el-primo','b','w','r');
kopf('clash-royale-koenig','u',{hut:'yry yyyyyy yyyyyyyy',haar:'k',nase:'u',mund:'k',kleid:'b'});
kopf('clash-of-clans-barbar','u',{haar:'y',nase:'u',mund:'y'});
kopf('subway-surfers-jake-kopf-mit-kappe','u',{hut:'wwww wwrwww rrrrrrrr',haar:'k',nase:'u'});
add('fn-wassermelone wassermelone-schnitz','rr rrrr rrsrrr rsrrrrsr wwrrrrww gwwwwwwg gggggg');
add('fn-erdbeere','gggg gggggg rrrrrrrr rryrryrr rryrrr rrrr rr');
add('lego-stein-24','rrwwrr rrrrrrrr rrrrrrrr rrrrrrrr rrrrrrrr');
kopf('lego-minifigur-kopf','y',{hut:'yyyy yyyyyy yyyyyyyy',nase:'y'});
add('barbie-logo-herz-schriftzug-b','qq qqqqqq qqqqqqqq qqwwqqqq qqwqwqqq qqwwqq qqwq qq');
add('rubiks-cube-zauberwuerfel','rrsbbsyy rrsbbsyy ssssssss ggswwsrr ggswwsrr ssssssss rrswwsgg rrswwsgg');
add('uno-karte-4','ssssss srrrrs srwrrs srwwrs srwrrs srrrrs ssssss');
add('wuerfel-spielwuerfel','wwwwww wswwsw wwwwww wwwwww wswwsw wwwwww');
add('schachfigur-springer-silhouette','ss ssss sswsss ssssss ssss ssss ssssss ssssssss');
kopf('playmobil-figur-silhouette','u',{haar:'k',nase:'u',kleid:'r'});

// Masken mit klarer Augenbinde.
for(const [id,c] of [['lloyd','g'],['kai','r'],['jay','b'],['zane','w'],['cole','s'],['nya','e']])ninja('ninja-augenpartie-'+id,c);
ninja('ninjago-logo-rotes-symbol','r');
add('shuriken-wurfstern','nn nnnn nnnnnnnn nnnssnnn nnnnnnnn nnnn nn');
kopf('goldener-drache-silhouette','y',{ohren:['y',2,1,65],nase:'o',wange:'o'});
add('cat-noir-pfote','ggwwgg gggggggg wwggggww wggggggw ggwwgg');
add('paw-patrol-pfoten-logo','bbwwbb bbbbbbbb wwbbbbww wbbbbbbw bbwwbb');
add('miraculous-ohrring-5-punkte','rrrr rsrrsr rrrrrrrr rrrssrrr rrrrrrrr rsrrsr rrrr');
kopf('tikki-kwami','r',{hut:'ss rrssrr rrrrrrrr',augen:'b',nase:'r'});
kopf('plagg-kwami','s',{ohren:['s',2,1,65],augen:'g',nase:'s',mund:'g'});
add('ladybug-kopf-mit-maske','bbbb bbbbbb buuuuuub rrwrrwrr rswsswsr uuuuuu uurruu uuuu','Kopf');
add('cat-noir-kopf-mit-maske','yyyy yyyyyyyy yyyyyyyy ssgssgss ssssssss uuuuuu uussuu uuuu','Kopf',[ohr('s',2,1)]);

// Anime: Stirnband, Strohhut, Bambus oder andere grosse Erkennungsmerkmale.
add('konoha-symbol-naruto-stirnband','nnnnnnnn nnssnnnn nsnnsnnn nsnnsnsn nnssssnn nnnnnnnn');
add('akatsuki-wolke-naruto','wwww wwrrww wrrrwrrw wrrrrrrw wwrrrrww wwwwww');
add('one-piece-jolly-roger-totenkopf-mit-strohhut','yyyy rrrrrr yyyyyyyy wwwwww wsswssw wwwswww wswsw ww','Symbol');
kopf('goku','u',{haar:'s',hut:'ssss ssssssss ssssssssss',nase:'u',kleid:'o'});
add('dragon-ball-4-sterne-kugel','oooo oooooo oorooroo oooooooo oorooroo oooooo oooo');
kopf('totoro-ghibli','n',{ohren:['n',2,1,65],nase:'s',wange:'w',kleid:'w'});
kopf('calcifer-ghibli','o',{hut:'rr rrrr oooooo',augen:'w',nase:'y',wange:'y',mund:'r'});
kopf('russpuster-susuwatari-ghibli','s',{augen:'w',nase:'s',mund:'s',extra:[{r:4,n:1,f:1,a:0,c:'s',fc:'s',w:'Arme'}]});
kopf('chopper-one-piece','k',{hut:'pwpw ppwwpp pppwpppp pppppppppp',nase:'b',ohren:['k',2,3,35]});
kopf('sadaharu-gintama','w',{ohren:['w',2,1,55],nase:'s',mund:'r'});
kopf('anya-spy-x-family','u',{haar:'p',ohren:['s',1,1,65,'y'],augen:'g',nase:'u'});
kopf('nezuko-demon-slayer-bei-aelteren','u',{haar:'s',wange:'s',augen:'q',nase:'u',mund:'g'});
kopf('naruto','u',{hut:'yyyyyy ssssssss snnssnns',nase:'u',wange:'k',kleid:'o'});
kopf('luffy','u',{hut:'yyyyyy rrrrrrrr yyyyyyyyyyyy',haar:'s',nase:'u',kleid:'r'});
kopf('zoro','u',{haar:'g',augen:'s',nase:'u',wange:'y',kleid:'w'});
add('kakashi','nnnn nnnnnnnn snnssnns uusussuu ssssssss ssssss ssss gggggg','Kopf');

// Cartoons.
add('spongebob-gelbes-viereck','yyyyyyyy ywwyywwy ywswwswy yyyyyyyy yyssssyy wwwwrrrr kkkkkkkk yywwyy');
kopf('patrick-star','p',{hut:'pp pppp pppppp',nase:'p',mund:'s',kleid:'g'});
kopf('thaddaeus','e',{augen:'w',nase:'e',wange:'n',mund:'s',kleid:'k'});
add('gary-die-schnecke','llwwll lswwsl pppppppp ppqqqppp pqpqpqpp ppqqqppp llllllll');
kopf('bluey','l',{haar:'b',ohren:['b',2,1,70],nase:'s',wange:'u'});
kopf('bingo','o',{haar:'k',ohren:['o',2,1,70],nase:'s',wange:'j'});
kopf('chase','k',{hut:'bbbb bbyybb bbbbbbbb',ohren:['k',2,1,60],nase:'s',wange:'c'});
kopf('marshall','w',{hut:'rrrr rryyrr rrrrrrrr',ohren:['s',2,1,-60],nase:'s',wange:'s'});
kopf('skye','c',{hut:'pppp ppsspp pppppppp',ohren:['k',2,1,-60],nase:'k',wange:'u'});
kopf('peppa-wutz','p',{ohren:['p',1,1,75],nase:'q',wange:'q',mund:'r',kleid:'r'});
kopf('gumball','l',{ohren:['l',1,1,65],nase:'o',wange:'w'});
kopf('darwin','o',{nase:'o',wange:'r',mund:'s',kleid:'g'});
kopf('grizz','k',{ohren:['k',0,3,50],nase:'s',wange:'c'});
add('we-bare-panda panda-kopf po-kung-fu-panda','wwww wwwwww wsswwssw wsswwssw wwwsswww wwssww wwww','Kopf',[ohr('s',0,3,50)]);
kopf('ice-bear','w',{ohren:['w',0,3,50],nase:'s',mund:'s'});
kopf('finn','u',{haar:'w',ohren:['w',1,1,75],nase:'u',kleid:'b'});
kopf('jake','y',{ohren:['y',1,1,-65],augen:'w',nase:'s',mund:'s'});
kopf('star-butterfly-herz-wangen','u',{haar:'y',augen:'b',nase:'u',wange:'q',kleid:'e'});
add('gravity-falls-dipper-muetze-tannenbaum','bbbb bwwwwb bwwggwwb bwggggwb bbbbbbbbbb');
kopf('teletubbies-sonne','y',{ohren:['y',1,1,30],nase:'o',mund:'r'});
kopf('po','u',{hut:'rr rwwr rr rrrrrr',haar:'r',nase:'u',wange:'r',kleid:'r'});
kopf('sendung-maus','o',{ohren:['k',0,3,40],nase:'s',wange:'k'});
kopf('sendung-elefant','b',{ohren:['b',1,3,0],nase:'b',mund:'b',kleid:'b'});
kopf('globi','b',{hut:'rrrr rrrrrrrr',nase:'y',mund:'y',kleid:'r'});
kopf('pingu','w',{haar:'s',wange:'s',nase:'r',mund:'r',kleid:'s'});

// Minions und Emotionen.
add('einaeugiger-minion-stuart','yyyy yyyyyy yynnnnyy ynwswnyy yynnnnyy yyyyyyyy yyssyy bbyybb bbbbbb');
add('zweiaeugiger-minion-kevin-bob','yyyy yyyyyyyy nnwwwwnn nwswwswn yywwwwyy yyyyyyyy yyssyy bbyybb bbbbbb');
add('boeser-lila-minion','vvvv vvvvvvvv nnwwwwnn nwswwswn vvwwwwvv vvvvvvvv vvwwvv ssvvss ssssss');
add('minion-auge-brille-allein','nnnn nnwwnn snwswns nnwwnn nnnn');
kopf('gru-silhouette-mit-schal','u',{nase:'u',mund:'s',kleid:'s'});
add('erinnerungskugel','yyyy yyyyyy yyyyyyyy yyyyyyyy yyyyyy yyyy');
kopf('wut-rotes-viereck','r',{haar:'s',augen:'w',nase:'r',mund:'w',kleid:'w'});
kopf('kummer','l',{haar:'b',augen:'s',nase:'l',mund:'b',kleid:'w'});
kopf('ekel','h',{haar:'g',augen:'g',nase:'h',mund:'q',kleid:'g'});
kopf('angst','i',{hut:'s ii iiii',augen:'w',nase:'v',mund:'s',kleid:'s'});
kopf('zweifel-inside-out-2','o',{hut:'oo oooooo oooooooo',augen:'w',nase:'o',mund:'w',kleid:'w'});
kopf('bing-bong','p',{hut:'kkkk kkkkkkkk',nase:'q',wange:'q',kleid:'k'});
kopf('freude-silhouette','y',{haar:'b',augen:'b',nase:'y',mund:'r',kleid:'h'});

// Sanrio, kleine Tiere und Trends.
kopf('hello-kitty','w',{hut:'wwqq wwqqqq wwwwww',ohren:['w',1,1,65],nase:'y',mund:'w'});
kopf('kuromi','w',{haar:'s',hut:'ssqqss ssssssss',ohren:['s',2,1,60,'q'],nase:'q'});
kopf('badtz-maru-pinguin','s',{ohren:['s',1,1,65],augen:'w',nase:'y',mund:'y'});
kopf('chococat','s',{ohren:['s',2,1,65,'c'],augen:'w',nase:'k',mund:'s'});
add('keroppi-frosch','wwww wswwsw hhhhhhhh hphhhhph hhsshh hhhh rrwwrr');
kopf('pompompurin','j',{hut:'kkkk kkkkkk',ohren:['j',2,1,-50],nase:'k',mund:'k'});
kopf('hangyodon','l',{augen:'w',nase:'l',mund:'p',wange:'p'});
kopf('my-melody','w',{haar:'p',ohren:['p',3,1,75],nase:'y',mund:'w'});
add('little-twin-stars-kiki-lala','bbbbpppp buubpuup busbpspp buubpuup uuuu ssssss yyyyyyyy');
add('gudetama-faules-ei','wwww wyyyyw wyysyysw wyyyyyyw wwyyyyww wwwwww');
kopf('pochacco','w',{ohren:['s',2,1,-65],nase:'s',mund:'w'});
kopf('cinnamoroll','w',{ohren:['w',3,3,5],augen:'b',nase:'w',mund:'b',wange:'p'});
add('hello-kitty-schleife-allein','qqwwqq qqqqqqqq qqqssqqq qqqqqqqq qqwwqq');
kopf('stitch-kopf','b',{ohren:['b',3,1,30,'p'],nase:'a',wange:'l',augen:'s'});
kopf('angel-rosa-gegenstueck','p',{ohren:['p',3,1,30,'q'],nase:'q',wange:'E',augen:'s'});
kopf('squishmallow-cam-katze','j',{haar:'k',ohren:['j',1,1,65,'p'],nase:'p'});
kopf('squishmallow-winston-eule-beliebige','e',{ohren:['e',1,1,60],augen:'w',nase:'o',wange:'w'});
kopf('capybara-trendtier','c',{ohren:['c',0,3,60],nase:'k',wange:'k'});
add('melting-smiley','yyyy yyyyyy yysyysyy yyyyyyyy ysyyysyy yyssyy yyyy yy');
add('flammenherz','yy yyy rrwwrr rrrrrrrr rrrrrrrr rrrrrr rrrr rr');
add('boba-tee-bubble-tea','ss ss wwwwww wccccw wcsccsw wcccscw wccccw wscscw wwwwww');
add('mochis-dango-spiess','pppp pspspp pppp wwww wswsww wwww gggg gsgsgg gggg kk kk');
add('regenbogenherz','rrwwrr rrrrrrrr oooooooo yyyyyy gggg bb');
kopf('frosch-mit-pilzhut-cottagecore','h',{hut:'rrrr rrwwrr rrrrrrrr',nase:'h',mund:'s'});
kopf('erdbeerkuh-strawberry-cow','w',{ohren:['p',1,1,10],haar:'p',nase:'q',wange:'p'});
kopf('labubu-trend-2025-26','u',{haar:'k',ohren:['k',3,1,75,'u'],nase:'s',mund:'w'});
kopf('pusheen-katze','n',{ohren:['n',1,1,65],haar:'s',nase:'s',mund:'s',kleid:'n'});
add('tamagotchi-ei-form','pppp pppppp ppsssspp ppswwspp ppsssspp pppppppp ppypyypp pppppp pppp');

// Superhelden: Maske und grosses Zeichen statt fein gerastertem Bild.
add('batman-logo','ss ssssss sswwsswwss ssssssssssss ssssssss ssss ss');
add('superman-s','yyyyyyyy yrrrrrry yryyyrry yrrryyyy yrrrrry yyyryy yyyy');
add('captain-america-schild','rrrr rrwwrr rwbbbbwr rwbwwbwr rrwwrr rrrr');
add('flash-blitz blitz-narbe-allein','yyy yyy yy yyyy yyyy yy yy y');
add('wonder-woman-logo','yywwwwyy yywwwwyy yywyywyy yyyyyyyy wyywwyyw yywwyy');
maske('spider-man-maske','r');maske('miles-morales-maske','s','w','r');
maske('spider-gwen-maske','w','s','p');maske('deadpool-maske-bei-aelteren','r','s');
add('iron-man-maske','rrrr ryyyyyyr rywyywyr ryyyyyyr rryyyyrr ryyssyyr rryyrr rrrr','Maske');
kopf('baby-groot','c',{hut:'kk cckccc cccccc',nase:'k',wange:'k',kleid:'c'});
add('hulk-faust','gggggg ggdgdgdg ggdgdgdg gggggggg gggggggg gggggg gggg');
add('thor-hammer-mjoelnir','nnnnnnnn nnnnnnnn nnnnnnnn kk kk kk kk');

// Star Wars.
add('rebellen-symbol','rrwwrr rrwwrr rrrwwrrr rrrrrrrr wrrrrrrw wwrrrrww');
add('imperium-symbol','ssss sswwss swswwsws sswsswss swswwsws sswwss ssss');
add('lichtschwert','gg gg gg gg gg gg gg nn ss nn ss');
add('stormtrooper-helm','wwww wwwwww wwwwwwww wsswwssw wwwwwwww wwnnnnww wswsswsw wwssww','Maske');
add('darth-vader-helm','ssss ssssss ssssssss snswwsns ssssssss ssnsnsss sssnnsss ssssssssss','Maske');
add('bb-8','ww wnww wwww ooowoo owwoow owwswo owwoow ooowoo wwww');
kopf('yoda-klassisch','h',{ohren:['h',3,1,0],haar:'w',nase:'g',kleid:'c'});
kopf('chewbacca','k',{haar:'m',nase:'s',wange:'c',mund:'w',kleid:'k'});
add('todesstern','nnnn nnnnnn nnssnnnn nsswsnnn nnnssnnn ssssssss nnnnnn nnnn');
kopf('grogu-baby-yoda','h',{ohren:['h',3,1,10,'p'],nase:'g',kleid:'c'});
add('r2-d2','nnnn nbssbn nnbbnn wwbwww wbwbww wwwwbw wbbbww wwwwbw wwwwww');

// Disney und Filmfiguren als Köpfe oder kleine Symbole.
add('mickey-silhouette-3-kreise','sswwss ssswwsss ssssssss ssssssss ssssss ssss');
add('minnie-silhouette-mit-schleife','ssqqss ssqqqqss ssssssss ssssssss ssssss ssss');
kopf('nemo-clownfisch','o',{haar:'w',nase:'o',wange:'w',mund:'r',extra:[{r:4,n:0,f:3,a:0,c:'o',fc:'o',w:'Flossen'}]});
kopf('dorie','b',{haar:'a',nase:'b',wange:'y',mund:'s',extra:[{r:4,n:0,f:3,a:0,c:'y',fc:'y',w:'Flossen'}]});
kopf('olaf-frozen','w',{hut:'kk ww wwww',nase:'o',mund:'s',kleid:'w'});
kopf('elsa','u',{haar:'j',augen:'b',nase:'u',mund:'p',kleid:'l'});
kopf('anna','u',{haar:'I',augen:'g',nase:'u',mund:'r',kleid:'v'});
kopf('simba-koenig-der-loewen-kopf','y',{ohren:['o',0,3,50],haar:'o',nase:'k',wange:'j'});
add('lightning-mcqueen-cars-seitenansicht','rrrrrr rwsswwr rrrrrrrrrr ryrrrryrrr rrrrrrrrrr sswwwwss');
add('toy-story-alien-3-augen','gg gggg gggggg gwgwwgwg gsgssgsg gggggggg ggssgg bbbbbb');
kopf('buzz-lightyear-kopf','u',{haar:'v',nase:'u',mund:'s',kleid:'g'});
add('vaiana-blume-hibiskus','rrrr rrrrrrrr rryrryrr rrryyrrr rrrrrrrr rrrrrr');
kopf('winnie-puuh-kopf','y',{ohren:['y',0,3,50],nase:'s',kleid:'r'});
add('encanto-kerze','yy yy rrrr yyyy yyyyyy yyppyy yyyyyy yyppyy yyyyyy');
add('encanto-schmetterling','yyssyy yyyssyyy yyyssyyy yssy yyssyy yssy');
add('toy-story-woodys-sheriffstern',stern);
add('hogwarts-wappen-vereinfacht','rrrryyyy rrrryyyy rrwwyyyy bbbwwwgg bbbbgggg bbbggg bbgg');
kopf('drache-ohnezahn-silhouette','s',{ohren:['s',2,1,65],augen:'g',nase:'n'});
add('harry-potter-brille-mit-blitz','yy yy yyyy yy sswwss swssssws sswwss');
add('goldener-schnatz','wwwwwwww wwwyywww wwyyyyww yyyyyyyy yyyyyy yyyy');
kopf('shrek-kopf-mit-ohren','h',{ohren:['h',2,1,35,'g'],nase:'g',wange:'g',kleid:'w'});
kopf('hedwig-eule','w',{ohren:['w',1,1,65],augen:'y',nase:'s',wange:'n'});
add('sprechender-hut','kk kkk kkkk kkskk kkskskk kkkkkkk kkksskk kkkkkkkkkk');

// Zeitlose Symbole.
add('marienkaefer-muster','ssss swwsws rrrsrrrs rsrsrsrr rrrsrrrr rsrsrsrr rrrsrr ssss');
add('smiley','yyyy yyyyyy yysyysyy yyyyyyyy ysyyysyy yyssyy yyyy');
add('schweizer-flagge','rrrrrrrr rrrwwrrr rrrwwrrr rwwwwwwr rwwwwwwr rrrwwrrr rrrwwrrr rrrrrrrr');
add('fussball','wwww wsswws wwssssww wswwwwsw wsswws wwww');
add('donut','cccc cppppc ppwwwwpp ppwwwwpp cppppc cccc');
add('biene','ss yyyyyy ysyysy yyssyy yyssyy ssssss yyssyy');
add('edelweiss','ww wwww wwwwwwww wwwyywww wwwwwwww wwww');
add('fig-herz',herz);add('fig-stern',stern);
add('fig-blume','rrrr rrrrrrrr rryyyyrr rryyyyrr rrrrrrrr rrrr gg gg');
add('fig-regenbogen','rrrrrrrr oooooooo yyyyyyyy gggggggg bbbbbbbb vvvvvvvv');
add('fig-schmetterling','qqssqq qqqssqqq qqqssqqq qssq qqssqq qssq');
add('fig-frosch','wwww wswwsw gggggggg grggggrg ggssgg gggg');
kopf('katze-kopf','o',{ohren:['o',2,1,65,'p'],nase:'p'});
kopf('hund-kopf','c',{ohren:['k',2,1,-65],nase:'s',wange:'w'});
kopf('einhorn-kopf','w',{hut:'y yy ppwwpp',ohren:['w',1,1,65,'p'],haar:'p',nase:'p',mund:'p'});
add('fig-glace','pppp pppppp pppppppp pppppppp cccccc cccc cc c');
add('pizza-stueck','y yyy yyryy yyyyyyy yyrryyry cccccccc');

const unbekannt=[...motive.keys()].filter(id=>!katalog.figuren.some(f=>f.id===id));
const fehlend=katalog.figuren.filter(f=>!motive.has(f.id)).map(f=>f.id);
if(unbekannt.length||fehlend.length)throw Error(JSON.stringify({unbekannt,fehlend}));
const result=katalog.figuren.map(f=>{
  const m=motive.get(f.id),breite=Math.max(...m.rows.map(r=>r.length));
  if(breite>15||m.rows.length>20||m.rows.some(r=>!/^[a-zA-S]+$/.test(r))||m.rows.join('').includes('t'))throw Error('Ungeeignete Reihen: '+f.id);
  const n=m.rows.reduce((a,r)=>a+r.length,0)+m.beine.reduce((a,b)=>a+2*(b.n+b.f),0);
  if(n>200||new Set(m.rows.join('')+m.beine.map(b=>b.c+b.fc).join('')).size>6)throw Error('Zu aufwendig: '+f.id);
  return {id:'figur-'+f.id,quelle:f.id,name:f.name,gruppe:f.welt,version:3,stufe:breite>8||m.beine.length?'mittel':'leicht',...m};
});
fs.writeFileSync(path.join(root,'vorlagen/perlen/figuren.js'),'// Kleine vereinfachte Fädelmotive: werkzeug/vorlagen/perlen-klein.cjs\nwindow.PERLEN_FIGUREN='+JSON.stringify(result)+';\n');
console.log(`${result.length} kleine Motive; maximal ${Math.max(...result.map(m=>Math.max(...m.rows.map(r=>r.length))))} Perlen pro Reihe.`);
