// Beide App-Versionen ohne zusätzliche Abhängigkeiten bauen: node quelle/bauen.cjs
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
let head = fs.readFileSync(path.join(__dirname, 'p1.html'), 'utf8');
const code = fs.readFileSync(path.join(__dirname, 'p2.js'), 'utf8');
new vm.Script(code, {filename: 'quelle/p2.js'});
for (const name of ['player-design.css']) {
  const file = path.join(__dirname, name);
  if (fs.existsSync(file)) head = head.replace('</style>', '\n' + fs.readFileSync(file, 'utf8') + '\n</style>');
}
const end = '</script>\n</body>\n</html>\n';
fs.writeFileSync(path.join(root, 'index.html'), head + code + end);
const school = head
  .replace('<title>Schritt für Schritt</title>', '<title>Schritt für Schritt · Schule</title>')
  .replace('apple-mobile-web-app-title" content="Schritt für Schritt"', 'apple-mobile-web-app-title" content="Schritt für Schritt · Schule"')
  .replace('"name":"Schritt f%C3%BCr Schritt","short_name":"Schritt f%C3%BCr Schritt"', '"name":"Schritt f%C3%BCr Schritt Schule","short_name":"Schule"')
  .replaceAll('href="grafik/figuren/icon.png"', 'href="../grafik/figuren/icon.png"');
fs.writeFileSync(path.join(root, 'schule/index.html'), school + 'window.SCHULE=true;\n' + code + end);
console.log('Gebaut: Familie und Schule');
