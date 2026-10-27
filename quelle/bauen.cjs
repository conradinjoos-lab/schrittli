// Beide App-Versionen ohne zusätzliche Abhängigkeiten bauen: node quelle/bauen.cjs
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
let head = fs.readFileSync(path.join(__dirname, 'p1.html'), 'utf8');
const code = fs.readFileSync(path.join(__dirname, 'p2.js'), 'utf8');
new vm.Script(code, {filename: 'quelle/p2.js'});
for (const name of ['player-design.css', 'entdecken-design.css']) {
  const file = path.join(__dirname, name);
  if (fs.existsSync(file)) head = head.replace('</style>', '\n' + fs.readFileSync(file, 'utf8') + '\n</style>');
}
const end = '</script>\n</body>\n</html>\n';
fs.writeFileSync(path.join(root, 'index.html'), head + code + end);
const school = head
  .replace('<title>Schritt für Schritt</title>', '<title>Schritt für Schritt · Schule</title>')
  .replace('apple-mobile-web-app-title" content="Schritt für Schritt"', 'apple-mobile-web-app-title" content="Schritt für Schritt · Schule"')
  .replaceAll('href="grafik/marke/', 'href="../grafik/marke/');
fs.writeFileSync(path.join(root, 'schule/index.html'), school + 'window.SCHULE=true;\n' + code + end);
for (const school of [false, true]) {
  const base = school ? '../grafik/marke/' : 'grafik/marke/';
  const manifest = {
    id: './', name: 'Schritt für Schritt' + (school ? ' · Schule' : ''),
    short_name: school ? 'Schritt · Schule' : 'Schritt für Schritt', lang: 'de-CH',
    description: 'Entdecken, ausprobieren, selber machen. Kreative Projekte Schritt für Schritt.',
    start_url: './', scope: './', display: 'standalone',
    background_color: '#FAF7F0', theme_color: '#FAF7F0',
    icons: [
      {src: base + 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any'},
      {src: base + 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any'},
      {src: base + 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable'}
    ]
  };
  fs.writeFileSync(path.join(root, school ? 'schule/manifest.webmanifest' : 'manifest.webmanifest'), JSON.stringify(manifest, null, 2) + '\n');
}
console.log('Gebaut: Familie und Schule');
