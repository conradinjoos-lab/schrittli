// Männchen: kleine Comic-Figuren mit Daumen hoch, Muskeln, OK-Zeichen, nachdenklich oder am Laptop (Welt «Männchen»).
'use strict';
module.exports=({kopf,teil})=>{
  const arme=(a,c)=>({r:9,n:2,f:1,a,c,fc:c,w:'Arme'});
  const mann=(id,c,{a=30,mund='s',augen='s',teile=[]}={})=>kopf('maennchen-'+id,c,{nase:c,mund,augen,kleid:c,art:'Figur',extra:[arme(a,c)],teile});
  const stern=lage=>teil('Stern',1,lage,3,'y yyy yyyyy yyy');
  mann('muskeln-orange','o',{a:70});
  mann('okay-gelb','y',{a:45});
  mann('gut-gemacht-blau','v',{a:55});
  mann('sehr-gut','w',{a:60,teile:[stern('rechts')]});
  mann('ausgezeichnet','w',{a:65,teile:[stern('links')]});
  mann('muskeln-umriss','w',{a:70});
  mann('good-job-ok','w',{a:40});
  mann('daumen-stern','w',{a:50,teile:[stern('rechts')]});
  mann('zwei-daumen','w',{a:50});
  mann('great-job','w',{a:35,teile:[stern('links')]});
  mann('verwirrt','w',{a:-30,mund:'n',teile:[teil('Wirbel',1,'oben',1,'nn nnnn nnnnnn')]});
  mann('nachdenklich','w',{a:-15,mund:'n'});
  mann('laptop','w',{a:-10,teile:[teil('Laptop',1,'rechts',10,'nnnnn nnnnn nnnnnnn')]});
  mann('nachdenklich-gelb','y',{a:-15,mund:'o'});
};
