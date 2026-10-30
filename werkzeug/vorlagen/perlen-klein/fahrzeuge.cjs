// Fahrzeuge von der Seite als Kachel, alle Reihen gleich lang: Blickrichtung und Farbe wie im Vorlagenbild, Silhouette nach Strichzeichnung, Höhe bewusst überhöht. Räder sind meist 4 breit und 3 hoch, damit sie rund wirken.
'use strict';
module.exports=({add,kachel})=>{
  const fz=(id,rows)=>add('fz-'+id,kachel(rows),'Symbol');

  // Autos
  fz('vw-bus','llwwwwwwwwwwll wwwwwwwwwwwwwl oBBoBBoBBoBBol oooooooooooooo oossoooooossoo oswwsooooswwso llssllllllssll');
  fz('vw-kaefer','llllbbbbbbllll llbwwbwwwbbbll lbbwwbwwwbbbbl bbbbbbbbbbbbbb bbssbbbbbbssbb lswwsbbbbswwsl llssllllllssll');
  fz('citroen-2cv','lllgggggggllll llggnngnngllll lgggnngnngggll lggggggggggggl ggssggggggssgg gsnnsggggsnnsg llssllllllssll');
  fz('porsche-911','QQQQQwwwwwQQQQ QQQwwzzwzzwQQQ QswwwwwwwwwwwQ wwssnnnnnnssww wsrrsnnnnsrrsw QQssQQQQQQssQQ');
  fz('bmw-kombi','laaaaaaaaallll aawwawwawwalll aaaaaaaaaaaaal aassaaaaaassaa aswwsaaaaswwsa llssllllllssll');
  fz('ferrari','lllllrrrrlllll lllrrssssrllll rrrrrrrrrrrrll rrssrrrrrrssrr rsnnsrssrsnnsr llssllllllssll');
  fz('tesla','lllllTTTTTTlll lllTTssssssTll lTTTTTTTTTTTTl rrssrrrrrrssrr rsnnsrrrrsnnsr llssllllllssll');
  fz('mercedes','llllssssssllll lllswwswwwslll sssssssssssssn ssssssssssssss sswwsnnnnswwss llssllllllssll');
  fz('mitsubishi-pajero','lllHHHHHHHHlll llHaaHaaaHaHss lHHaaHaaaHaHss yHHHHHHHHHHHss HHssHHHHHHssHl HsnnsHHHHsnnsH llssllllllssll');
  fz('toyota-hilux','QQQQwwwwwwQQQQ QQQwllwllwQQQQ ywwwwwwwwwwwwn wwssrrrrrrssrw wswwswwwwswwsw QQssQQQQQQssQQ');
  fz('toyota-gelaende','llgggggggggsll llglllglllgsll lggggggggggggl wwwggggggggggg gsssggggggsssg ssgssggggssgss ssgssllllssgss lsssllllllsssl');
  fz('jeep','lsssssssssllll lslllslllsllll lslllslllskkkl kkkkkkkkkkkkkk kksskkkkkkkssk ssnnsllllsnnss lsssllllllsssl');
  fz('pickup','QQsQQwwwwQQQQQ QQsQwBBBwQQQQQ nwwwwwwwwwwwww wwssrrrrrrssrw wswwswwwwswwsw QQssQQQQQQssQQ');
  fz('taxi','lllllllsssllll llllyyyyyyylll lllyycyccyyyll yyyyyyyyyyyyyy yyssyyyyyyssyy ysnnsyyyysnnsy llssllllllssll');
  fz('monstertruck','lsllllllllllll lslllgggggllll lslggKKKgggggl gggggggggggggg ggsssggggsssgg lsssssllsssssl sssnsssssssnss sssnsswwwsnsss lsssssllsssssl llsssllllsssll');
  // Zweirad und Rennwagen
  fz('vespa','wwwwwwwwwCCCww wwwwwwwwwwCCww wsssssswwwCCww wwCCCCCwwwCCCw CCCCCCCwwwwCCw CCCCCCCCCCCCCC CCssCCCCCCCssC wsnnswwwwwsnns wwsswwwwwwwssw');
  fz('formel1','lllllcclllllll cclcccssssllll ccssccccccssll ssnnsccccsnnsc llssllllllssll');
  // Flugzeuge und Helikopter
  fz('airbus','bbbbbbbbbbbnbb bbbbbbbbbbnnbb bbrbbbbbbnnbbb bbrrbbbbbwwwww bbbrrwwwwwwwwb bbwwwwwwwwwbbb bbbbbbnnnbbbbb bbbbnnnnzzbbbb bnnnnnbbbbbbbb nnbbbbbbbbbbbb');
  fz('jumbo','bbbbbbbbbbbbrr bbnnnnbbbbbrrr bnzzznnnnnnrrb nnnnnnnnnnnnnb bwwwwwwwwwwwbb bbbbzzwwwbbbbb bbbzzbbbbbbbbb');
  fz('helikopter','llsssssssssssl lllllllsslllll rlllllrrrrrlll rrrrrrrrrssrll rlllllrrrrssrl llllllrrrrrlll lllllnllllnlll llllsssssssssl');
  fz('helikopter-gruen','llnnnnnnnnnnll lllllllgglllll llAAggggglllll lAAAAgggggggss lAAAAggggggssl llAAggggllllll lllnllnllnllll llssslssslsssl');
  // Einsatzfahrzeuge
  fz('polizei','QQQQQQMMQQQQQQ QQQQwwwwwwQQQQ QQQwsswssswQQQ wwwwwwwwwwwwww wwssssssssssww wswwswwwwswwsw QQssQQQQQQssQQ');
  fz('polizei-schwarz','lllllllbblllll lllllsssssslll llllswwswwslll sssswwwwwwsssr sssswwwwwwssss sswwsssssswwss llssllllllssll');
  fz('krankenwagen','yyyyyyyyyyllll yyssssyyyysyll yyyyyyyyyyssyl ggyyggyyggyygg yyggyyggyyggyy yyssyyyyyyssyy ysnnsyyyysnnsy llssllllllssll');
  fz('feuerwehr','lllbblllllllll lrrrrrlnnnnnll lrCCrrrrrrrrrl rrCCrrrrrrrrrr wwwwwwwwwwwwww rrssrrrssrrssr rsnnsrsnnssnns llsslllssllssl');
  fz('feuerwehr-leiter','sssssssssssssl slslslslslslsl sssssssssssssl llbllllllnnlll lrCCrrrrrrrrrl rrCCrrrrrrrrrr wwwwwwwwwwwwww rrssrrrssrrssr rsnnsrsnnssnns llsslllssllssl');
  // Busse und Bahnen
  fz('schulbus','yyyyyyyyyyylll ynnynnynnyzyll yyyyyyyyyyzyll ssssssssssssyy yyssyyyyyyssyy ysnnsyyyysnnsy llssllllllssll');
  fz('bus','lyyyyyyyyyyyyl ynnynnynnynnzy ynnynnynnynnzy yyyyyyyyyyyyzy yyssyyyyyyssyy ssnnssssssnnss llssllllllssll');
  fz('tram','llllllllllssll lcccclllllsssl lcccccccclllsl lzzczzczzccccl lzzczzczzczzcl lWWWWWWWWWWWWl lWWWWWWWWWWWss lWWWWWWWWsssll lWWWWsssssllll lllsssllllllll ssslllllllllll');
  fz('lok','QQQssssssssQQQ QQwwwwwwwwwwQQ QwwbwbwbwbwwwQ wgggggggggggww wwwwwwwwwwwwww zzzzzzzzzzzzzz QsssQQQQQsssQQ');
  fz('dampflok','llllllllMMMMMM lgggllllMCCMCM llglllllMCCMCM llglllllMMMMMM loooooooMMMMMM loooooooMMMMMM ooooooooMMrrrM orrrorrrorrrrr lrsrlrsrlrrsrr lrrrlrrrllrrrl');
  fz('schnellzug','lllllllsslllll ssssssssssslll CCCCCCCCsssCll ggggggggggggsl ssssssssssssss lzzlzzllzzlzzl');
  // Lastwagen
  fz('muellwagen','lloooooooollll oooooooooollll oooooooooowwll oooooooooowssl oooooooooowwww nnnnnnnnnnnnww lnsKssKsnnsKsn lsssssslllsssl');
  fz('autokran','ssssssssssssll yyyyyyyyyyyysl ysssssssssssrw CCyyyyyyyCCyrw yyyyyyyyyyyyrw LLyLLyLLyLLyLL sslsslsslsslss');
  fz('kranwagen','llllllllllyyyl yyyyyylllyywyy lyyyylyyyyyyyy llywyyyyyllyyl lllllllllllyyl lllllyyyyylyyl llllyzzzyylyyl llllyzzzyyyyyl lllyyyyyyyyyyy lllyyssyyyssyy lllysnnsysnnsy lllllsslllssll');
  fz('abschleppwagen','lllllllllloool llllllllllowwo ssssssssssoooo kkkkkkkkkkoooo lsnslsnsllsnsl lssslsssllsssl');
  fz('glacewagen','wwwwwwwwwwwQQQ wukuuuwuuwCCwQ wkkkuwwwuwCCCw wcccucccuwwwww wucuuucuuwwwww wwsswwwwwwssww wswwswwwwswwsw QQssQQQQQQssQQ');
  fz('umzugswagen','QQQwwwwwwwwwww QQQwwywwywwyww QQQwwwyyyywwww Qwwwyyyyyyyyww wBBwwwyyyywwww wBBwwywwywwyww wwwwwwwwwwwwww wwssssssssssss swwsQQQQswwsss QssQQQQQQssQQQ');
  // Schiffe
  fz('segelboot','bbbbbbkkyyybbb bbbbbbkkyybbbb bbbbblkklbbbbb bbbbllkkllbbbb bbblllkklllbbb bbblllkklllbbb bbllllkkllllbb brrrrrrrrrrrrb brrwrrwwrrwrrb bbrrrrrrrrrrbb bbbbrrrrrrbbbb');
  fz('segelschiff','lllklllklllkll llwwwlwwwlwwwl llwkwlwkwlwkwl lllklllklllkll lwwwwwwwwwwwll lwwkwwwkwwwkwl lllklllklllkkk sssssssssssssl NNNNNNNNNNNNsl lNNNNNNNNNNNll');
  fz('titanic','llsslsslsslssl lloolooloolool lloolooloolool lwwwwwwwwwwwwl lwswswswswswwl ssssssssssssss lsssssssssssss lrrrrrrrrrrrrl bbbbbbbbbbbbbb');
  fz('uboot','bbbbbbysbbbbbb bbbbbbyybbbbbb bbbbbyyybbbbbb bbbyyyyyybbbbb byyyyyyyyyyyby yyyyyyyyyyyyyy yyyyyyyyyyyyby byyyyyyyyyybbb');
};
