/* Small metadata catalogue for the teacher picker; generated from the published content. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
function build(){
 const school=JSON.parse(read('schule/schule.json')),photos=JSON.parse(read('anleitungen/anleitungen.json'));
 const ctx={window:{}};vm.createContext(ctx);
 vm.runInContext(read('vorlagen/perlen/bearbeiten.js'),ctx);
 for(const f of ['vorlagen/formen.js','vorlagen/figuren/index.js','vorlagen/perlen/figuren.js'])vm.runInContext(read(f),ctx);
 const match=read('vorlagen/perlen/index.html').match(/const TIERE=(\[[\s\S]*?\n\]);/);if(!match)throw Error('Perlen-Grundmuster nicht gefunden');
 const beads=vm.runInContext(match[1],ctx).concat(ctx.window.PERLEN_FIGUREN||[]);
 const projects=[...school.videos,...photos.anleitungen.map(v=>({...v,photo:true}))].map(v=>({id:v.id,name:v.title,area:v.areaId,group:v.gruppe||'',grades:v.stufen||[],level:Number(v.niveau)||2,
  image:v.photo&&v.titelbild?'anleitungen/'+(v.ordner||v.id)+'/'+v.titelbild:v.source?.type==='youtube'?'vorschau/'+v.source.id+'.webp':''}));
 const templates=[...(ctx.window.FORMEN||[]),...(ctx.window.FIGUREN_INDEX||[])].map(f=>({id:f.id,name:f.name,group:f.gruppe,image:f.datei?'vorlagen/figuren/bilder/'+f.id+'.webp':'',shape:f.d?{w:f.w,h:f.h,rings:f.d}:null}));
 const patterns=beads.map(t=>({id:t.id,name:t.name,group:t.gruppe||(t.art==='figur'?'Comic-Figuren':t.art==='ding'?'Essen und Sachen':'Tiere'),width:t.gridWidth||Math.max(...t.rows.map(r=>r.length)),image:t.quelle?'vorlagen/perlen/bilder/'+t.quelle+'.webp':''}));
 const areas=Object.fromEntries((school.bereiche||[]).map(a=>[a.id,a.name]));
 const data={projects,templates,beads:patterns,areas,beadLimits:{1:ctx.window.PerlenEditor.GRENZEN[2],...ctx.window.PerlenEditor.GRENZEN}};
 fs.writeFileSync(path.join(root,'kontrolle/unterricht-katalog.json'),JSON.stringify(data)+'\n');
 return data;
}
module.exports=build;if(require.main===module){const d=build();console.log(`${d.projects.length} Projekte, ${d.templates.length} Vorlagen, ${d.beads.length} Perlenmuster`);}
