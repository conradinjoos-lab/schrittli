/* Die detailreichen Figuren unverändert sichern. Das Archiv wird weder durch
 * den kleinen Fädelmuster-Generator noch durch Einstellungen im Browser geändert.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),revision='47de6c334ccb845f9de7611100494f9801f00eca';
const lesen=p=>execFileSync('git',['show',revision+':'+p],{cwd:root,encoding:'utf8',maxBuffer:20*1024*1024});
const c={window:{}};vm.runInNewContext(lesen('vorlagen/perlen/figuren.js'),c);
const html=lesen('vorlagen/perlen/index.html'),p={};
vm.runInNewContext(html.match(/const FARBE=.*?;/s)[0]+html.match(/FARBE.u=.*?;/s)[0]+[...html.matchAll(/Object.assign\(FARBE,.*?;/sg)].map(m=>m[0]).join('')+';this.palette=FARBE',p);
const motive=c.window.PERLEN_FIGUREN;
if(motive.length!==302||motive.some(t=>t.version!==2))throw Error('Unerwarteter Archivstand');
const archiv={version:1,quelle:revision,seitenverhaeltnis:2/3,palette:p.palette,motive,sha256:crypto.createHash('sha256').update(JSON.stringify(motive)).digest('hex')};
const ziel=path.join(root,'vorlagen/buegelperlen/archiv.js');
fs.mkdirSync(path.dirname(ziel),{recursive:true});
fs.writeFileSync(ziel,'// Unveränderte detailreiche Muster aus '+revision+'; keine Fädelanleitung.\nwindow.BUEGELPERLEN_ARCHIV='+JSON.stringify(archiv)+';\n');
console.log('Alle '+motive.length+' detailreichen Originalmuster gesichert. SHA-256: '+archiv.sha256);
