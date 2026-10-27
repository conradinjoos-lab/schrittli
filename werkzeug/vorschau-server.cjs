// Lokale Vorschau, nur auf diesem Computer: node werkzeug/vorschau-server.cjs
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const folders = new Set(['schule','grafik','anleitungen','material','vorschau','vorlagen','werke']);
const files = new Set(['index.html','inhalte.json','katalog.json','favicon.ico']);
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.pdf':'application/pdf'};
http.createServer((req,res)=>{
  if (!['GET','HEAD'].includes(req.method)) {res.writeHead(405);return res.end();}
  let rel;
  try {rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '');} catch {res.writeHead(400);return res.end();}
  if (!rel || rel.endsWith('/')) rel+='index.html';
  const target=path.resolve(root,rel);
  if (!target.startsWith(root+path.sep)||rel.split(/[\\/]/).some(x=>x.startsWith('.'))||(!files.has(rel)&&!folders.has(rel.split(/[\\/]/)[0]))) {res.writeHead(404);return res.end();}
  fs.stat(target,(err,stat)=>{
    if(err||!stat.isFile()){res.writeHead(404);return res.end('Nicht gefunden');}
    res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    if(req.method==='HEAD')return res.end();
    const stream=fs.createReadStream(target);stream.on('error',()=>res.destroy());stream.pipe(res);
  });
}).listen(8766,'127.0.0.1',()=>console.log('Vorschau: http://127.0.0.1:8766/schule/'));
