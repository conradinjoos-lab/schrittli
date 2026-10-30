// Fussball: Vereinslogos als Bild von 14 mal 10 Perlen, auf Kreis oder Schild zugeschnitten; Farbe und Grundform zählen mehr als die Schrift.
'use strict';
module.exports=({add,form,kachel,schild,rund,rand})=>{
  const fb=(id,rows)=>add('fb-'+id,rows,'Symbol');
  const kreis=(id,rows,c)=>fb(id,c?rand(rund(rows),c):rund(rows));
  const wappen=(id,rows,c)=>fb(id,c?rand(schild(rows),c):schild(rows));

  fb('basel',['yy','yyyyyy','yy',...rand(schild('rrrrrrraaaaaaa rryyyyrayyyaaa rryrrrrayaayaa rryyyrrayyyaaa rryrrrrayaayaa rryrrrrayyyaaa rrrrrrraaaaaaa rrrrrrraaaaaaa rrrrrrraaaaaaa rrrrrrraaaaaaa rrrrrrraaaaaaa'),'y')]);
  kreis('zuerich','aaaaaaaaaaaaaa aaaaaaaaaaaaaa aaaawwwwwwaaaa aaaaaaawwaaaaa aaaaawwaaaaaaa aaaawwwwwwaaaa aaaaaaaaaaaaaa aaawwwaawwwaaa aaawwwaawwwaaa aaaaaaaaaaaaaa','X');
  kreis('gc','bbbbbbbbbbbbbb bbbbbbbbbbbbbb bbbbwwwwwwbbbb bbbwbbbbbbwwww bbbwwwwwbbwwww bbbwwwwbbwbbbb bbbwwwbbwwwbbb bbbwbbbbbbwbbb bbbbwwwwwwbbbb bbbbbbbbbbbbbb');
  kreis('stgallen','gggggggggggggg gggggggggggggg gggwwwggwwwwgg ggwwgggwwggggg gggwwggwwggggg ggggwwgwwgwwgg ggggwwgwwggwgg ggwwwgggwwwwgg gggggggggggggg gggggggggggggg');
  kreis('lugano','ssssssssssssss ssssssssssssss sssswwswwwssss sssswwswwsssss sssswwswwwssss sssswwswwsssss sssswwssssssss sssswwwwwwssss ssssssssssssss ssssssssssssss','w');
  kreis('schaffhausen','ssssssssssssss ssssssssssssss ssyyyyyssyyyss ssyyssssyyssss ssyyyyssyyssss ssyyssssyyssss ssyyssssyyssss ssyysssssyyyss ssssssssssssss ssssssssssssss');
  kreis('servette','NNNNNNNNNNNNNN NNNNNNNNNNNNNN NNNNNwwwwwNNNN NNNNwwNNNNNNNN NNNNNwwwwNNNNN NNNNNNNNwwNNNN NNNNNNNNwwNNNN NNNNwwwwwNNNNN NNNNNNNNNNNNNN NNNNNNNNNNNNNN');
  fb('sion',rand(schild('VVVVVVVVVVVVVV wwwwVwwwVVwwwV wwVVVVVwVwwVVV wwwVwVwwVwwVVV wwwwwwwwVVwwVV wwwwVwwwVVVwwV wwVVVVVwVVVwwV wwwVwVwwVwwwVV wwwwwwwwVVVVVV wwwwwwwwVVVVVV wwwwwwwwVVVVVV'),'V'));
  kreis('bayern','rrrrrrrrrrrrrr rrrrrrrrrrrrrr rrrrwwbbwwrrrr rrrbbwwbbwwrrr rrwwbbwwbbwwrr rrbbwwbbwwbbrr rrrwwbbwwbbrrr rrrrbbwwbbrrrr rrrrrrrrrrrrrr rrrrrrrrrrrrrr','b');
  fb('juventus',kachel('sssssssswsss sssssssswsss wwwwwssswsss wwwwwssswsss wwwwwssswsss wwwwwssswsss wwwwwssswsss wwwwsssswsss wwwsssswwsss wssssswwssss wssswwwssssw wwwwssssssww wwwwsssswwww'));
  kreis('inter','ssssssssssssss ssssssssssssss ssaaawwwwaaass sawawawwawawas sawawawwawawas sawawawwawawas sawawawwawawas ssaaawwwwaaass ssssssssssssss ssssssssssssss');
  fb('milan',rand(form('wwwwwwwwww wwwwwwwwww wwwwwwwwww rsrsrwwrww rsrsrwwrww rsrsrrrrrr rsrsrwwrww rsrsrwwrww wwwwwwwwww wwwwwwwwww wwwwwwwwww',[6,8,10,10,10,10,10,10,10,8,6]),'r'));
  kreis('yb','ssssssssssssss ssssssssssssss ssssssssssssss ssyysyysyyysss sssyyysyyssyss ssssyysyyyysss ssssyysyyssyss ssssyysyyyssss ssssssssssssss ssssssssssssss','y');
  fb('real',['yy','yrrrry','yrrrrrry','yyyyyyyy',...rand(form('wwwwwwwwwwww wwaaawwwwwww wwwaaaawwwww wwwwaaaawwww wwwwwaaaawww wwwwwwaaaaww wwwwwwwwwwww wwwwwwwwwwww',[6,10,12,12,12,12,10,6]),'y')]);
  wappen('barca','wwwrwwwyryryry wwwrwwwyryryry rrrrrrryryryry wwwrwwwyryryry wwwrwwwyryryry yyyyyyyyyyyyyy aaWWaaWWaaWWaa aaWWaayyyyWWaa aaWWaayyyyWWaa aaWWaaWWaaWWaa aaWWaaWWaaWWaa','y');
  wappen('atletico','aaaaaaaaaaaaaa awwawaaaaaaaaa awwwaaaaaaaaar awwaaaaaaawwrr aaaaaaaarrwwrr aaaaaawwrrwwrr aaaarrwwrrwwrr aarwrrwwrrwwrr rrwwrrwwrrwwrr rrwwrrwwrrwwrr rrwwrrwwrrwwrr','a');
  fb('liverpool',['eeee','eeeeeeee',...rand(schild('rrrrrrrrrrrrrr wwwwwwwwwwwwww wwwwwrrwwrrwww wwwrrrrwrrrwww wwwwwrrrrrwwww wwwwwrrrrwwwww wwwwwwrrrrrwww wwwwwwrwwrwwww wwwwwrrwrrwwww wwwwwwwwwwwwww wwwwwwwwwwwwww'),'r')]);
  kreis('chelsea','aaaaaaaaaaaaaa wwwwwwwwwwwwww wwwwawwaaawwww wwwwawaaaawaww wwwwaaaaaawaww wwwwawwaaaaaww wwwwawaawaawww wwwwawaawaawww wwwwwwwwwwwwww aaaaaaaaaaaaaa','a');
  wappen('arsenal','VVVVVVVVVVVVVV XaVVVVVVVVVVaX XaVVVVVVVVVVaX XaVVVVVVVVVXaX XaVXXXXXXXXXaX XaVVVXVXVXVXaX XaVVVXXXXXVVaX XaVVVVVVVVVVaX XaVVVVVVVVVVaX XaVVVVVVVVVVaX VVVVVVVVVVVVVV','X');
  fb('tottenham',kachel('wwwaaawwwwww wwaaaaawwwww waaaaaawwwww wwwaaaawwwaa wwwwaaaawaaa wwwwaaaaaaaa wwwwaaaaaaaa wwwwwaaaaaaw wwwwwwaaaaww wwwwwwwaawww wwwwwaaaawww wwwaaaaaaaww wwaaaaaaaaww wwaaaaaaaaww wwwaaaaaaaww wwwwwaaaawww'));
  kreis('manutd','ssssssssssssss ssssrrrrrrssss ssrrrrrrrrrrss srrsyyyyyysrrs syysyyrryysyys syysyrrrrysyys srrsyyrryysrrs ssrrsyyyysrrss ssssrrrrrrssss ssssssssssssss','s');
  kreis('mancity','aaaaaaaaaaaaaa wwwwwwwwwwwwww wwwllllllllwww wwwlllcclllwww wwwlcccccclwww wwwllllllllwww wwwllrrrrllwww wwwwllrrllwwww wwwwwwllwwwwww aaaaaaaaaaaaaa','a');
  kreis('psg','aaaaaaaaaaaaaa aaawwwwwwwwaaa aaaaaarraaaaaa aaaaaarraaaaaa aaaaarrrraaaaa aaaaarrrraaaaa aaaawwrrwwaaaa aaarrraarrraaa aaaaaaaaaaaaaa aaaaaaaaaaaaaa');
  kreis('dortmund','yyyyyyyyyyyyyy yyyyyyyyyyyyyy yssyysyysyssyy ysysysyysysysy yssyysyysyssyy ysysyyssyysysy ysysyyssyysysy yssyyyssyyssyy yyyyyyyyyyyyyy yyyyyyyyyyyyyy');
};
