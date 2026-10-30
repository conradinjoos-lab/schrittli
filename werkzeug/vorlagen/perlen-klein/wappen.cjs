// Wappen: nach den amtlichen Wappen, als Bild von 14 mal 11 Perlen gezeichnet und auf den Schild zugeschnitten.
'use strict';
module.exports=({add,schild,zeilen})=>{
  const wappen=(id,rows)=>add('wappen-'+id,schild(rows),'Symbol');
  const R=(c,n)=>c.repeat(n);
  const reihen=(n,r)=>Array(n).fill(r);
  const quer=(o,n,u)=>[...reihen(n,R(o,14)),...reihen(11-n,R(u,14))];
  const laengs=r=>reihen(11,r);

  wappen('schweiz','rrrrrrrrrrrrrr rrrrrrrrrrrrrr rrrrrwwwwrrrrr rrrrrwwwwrrrrr rrwwwwwwwwwwrr rrwwwwwwwwwwrr rrwwwwwwwwwwrr rrrrrwwwwrrrrr rrrrrwwwwrrrrr rrrrrrrrrrrrrr rrrrrrrrrrrrrr');
  wappen('aargau','sssssssbbbbbbb sssssssbbbbbbb sssssssbwbbbwb ssssssswwwbwww wwsswwsbwbbbwb wwwwwwwbbbbbbb sswwsswbbbwbbb sssssssbbwwwbb sssssssbbbwbbb sssssssbbbbbbb sssssssbbbbbbb');
  // Bär nach links, rote Krallen und Zunge.
  const baer='wwwwwwwsssswww wwswwsssssssww wsswwrrsssssww wwssssssssswww wwwwwwssssswww wwrsssssssswww wwwwwsssssswww wwwwwwssssssww wwwwssswwsssww wwwrsswwwwssrw wwwwwwwwwwwwww';
  wappen('appenzell-ai',baer);
  wappen('appenzell-ar','wwwwwwwsssswww wwswwsssssssww wsswwrrsssssww wwssssssssswww wwwwwwssssswww wwrsssssssswww wswswsssswssww wswswsssswswsw wwswwsswwwssww wwwwwsswwwswww wwwwwwwwwwwwww');
  wappen('bern','yyyyrrrrrrrrrr yyssssyyrrrrrr yrsssssyyyrrrr yyyysssssssyrr ysssysssssssyy yssssssyssssss rryssyyyssysss rrrrryyssyysss rrrrrrrryyssyy rrrrrrrrryyyrr rrrrrrrrrrrrrr');
  // Baselstab: Krümme oben, Knauf, dreispitziger Fuss.
  wappen('basel-land','wwwwwwrrrrrwww wwwwwrrrrrrrww wwwwwrrwwwrrrw wwwwwrrwwrrrrw wwwrrrrrrrrrww wwwwwrrrrwwwww wwwwwrrrrwwwww wwwwrrrrrrwwww wwwwrrrrrrwwww wwwwrwrrwrwwww wwwwwwrrwwwwww');
  wappen('basel-stadt','wwwsssssswwwww wwssssssssswww wsssswwsssswww wssswswsssswww wwssswwsssswww wwwwsssssswwww wwwwwssssswwww wwwwwssssswwww wwwwssssssswww wwwswsssswswww wwwwwwsswwwwww');
  wappen('freiburg',quer('s',5,'w'));
  wappen('genf','yyyyryyrryrrrr syyrrryrryyyyy ssyssssrryyryy ysrrsssrryrrry ssyssssrryyryy yyyssssrryyyyy sssssssrryrrrr yyyssssryyyrrr yyrsyssyyryyrr yyyrrssryyyrrr yyyyyysrrrrrrr');
  wappen('glarus','rryyrryyyyrrrr rrryrryssyrrrr rrryrryuuyrrrr rrrywsssssssrr rrryrrsyyyssrr rrryrrssssrrrr rrryrrssssrrrr rrryrrssssrrrr rrryrsssssrrrr rrrysssssrrrrr rrrrrrrrrrrrrr');
  wappen('graubuenden','sssswwwbbybyyy sssswwwbbybyyy sssswwwyyyybbb sssswwwbbbbyyy sssswwwyybybbb wwwwwsssssswww wsswrsswwwwsww wwwssssssswwww wwsswsssssswww wwwwwwsswsswww wwwwwsswwwwwww');
  const hj='wrrrrww rrwwrrw rrrwrrw wwwwrrw wwrrrrw wwwwrrw wwwrrrw wwwrrrw wwrrrrw wwrwrww wwwwwww';
  const st='rrwrrwrrwrr';
  wappen('jura',zeilen(hj).map((r,i)=>r+R(st[i],7)));
  wappen('luzern',laengs('bbbbbbbwwwwwww'));
  const nb='gggggwwwwrrrrr';
  wappen('neuenburg',[nb,'gggggwwwwrrwrr','gggggwwwwrwwwr','gggggwwwwrrwrr',...reihen(7,nb)]);
  wappen('nidwalden','rrrrrrwwrrrrrr rwwrwwwwwwrwwr rwrrrwwwwrrrwr rwwrwwwwwwrwwr rwwwwwwwwwwwwr rrrrrwwwwrrrrr rrwwwrwwrwwwrr rwwrrrrrrrrwwr rrrwwrrrrwwrrr rrrrrwrrwrrrrr rrrrrwwwwrrrrr');
  wappen('obwalden','rrrrrrwwrrrrrr rrrwwwwwrrrrrr rrrrrwwwrrrrrr rrrwwwwwrrrrrr rrrrrrwwrrrrrr wwwwwrrrrwwwww wwwrrwrrwrrwww wwrrwwrrwwrrww wwrrwwwwwwrrww wwwrrrwwrrrwww wwwwwrrrrwwwww');
  wappen('schaffhausen','yyyyyyysssssyy yyyyyysyyyysyy yyyyyysssyysyy yyyyrsyssssyyy yssssssssyyyyy yyyyysssssyyss ysssysssssssss yyyyysssssssyy yyyyssyyssyyyy yyyssyyyyssyyy yyyyyyyyyyyyyy');
  wappen('schwyz',[R('r',14),'rrrrrrrrrrwrrr','rrrrrrrrwwwwwr','rrrrrrrrrrwrrr',...reihen(7,R('r',14))]);
  wappen('solothurn',quer('r',5,'w'));
  wappen('stgallen','gggwwgwwgggggg gggwwwwwwwgggg gggwwgwwgggggg ggggwwwwwwgggg ggggdwwwwdgggg ggggwdwwdwgggg ggggwwddwwgggg ggggwdwwdwgggg ggggdwwwwdgggg ggggwwwwwwgggg ggggggwwgggggg');
  wappen('thurgau','gwwwwwwwwyyyww ggwwywwwyysyww ggggwyyyyyyywy gygrggwwyyyyyw gyygyyygwyyyww gyyyysyyggwyyw ggyyyyyygggwww ggyyyyyyyggggg ggggyyyyyygggg gggggyygyygggg gggggggggggggg');
  wappen('tessin',laengs('rrrrrrrbbbbbbb'));
  wappen('uri','ysyyyyyyyyyysy ysyyyyyyyyyysy yssyyyyyyyyssy yyssssssssssyy ssssssssssssss yyysswsswssyyy yyyssssssssyyy yyyssssssssyyy yyyyssssssyyyy yyyyyrssryyyyy yyyyyrrrryyyyy');
  wappen('wallis','wwwrwwwrrrwrrr wrrrrrwrwwwwwr wwrwrwwrrwrwrr wwwwwwwrrrrrrr wwwrwwwrrrwrrr wrrrrrwrwwwwwr wwrwrwwrrwrwrr wwwwwwwrrrrrrr wwwwrwwrrwrrrr wwwrrrwrwwwrrr wwwwwwwrrrrrrr');
  wappen('waadt','wwwwwwwwwwwwww wyyyyyyyyyyyyw wwwwwyyyywwwww wwyyyyyyyyyyww wwwwwwwwwwwwww gggggggggggggg gggggggggggggg gggggggggggggg gggggggggggggg gggggggggggggg gggggggggggggg');
  wappen('zug',[...reihen(4,R('w',14)),...reihen(3,R('b',14)),...reihen(4,R('w',14))]);
  wappen('zuerich',reihen(11,0).map((_,i)=>{const n=Math.round(i*1.4);return R('b',n)+R('w',14-n)}));
  wappen('neunkirch','bbbbbbbbbbbbbb bbbbbrrbbbbbbb bbbbrrrrbbbbbb bbbbwwwwbbbbbb bbbbwswwbbbbbb bbrrwwwwrrrrbb bbwwwwwwwwwwbb bbwswwwwswswbb bbbbbbbbbbbbbb bbbbbbbbbbbbbb bbbbbbbbbbbbbb');
};
