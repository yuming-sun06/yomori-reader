'use strict';
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
// Publish only the app and its license notices, never the whole checkout.
const files = [
  'index.html', 'style.css', 'app.js', 'ui-language.js',
  'collaboration.js', 'collaboration-ui.js', 'progress-store.js', 'reading-tap.js', 'word-lookup.js',
  'jszip.min.js', 'sw.js', 'manifest.webmanifest', 'icon.svg',
  'icon-192.png', 'icon-512.png', 'icon-v2-32.png',
  'icon-v2-180.png', 'icon-v2-192.png', 'icon-v2-512.png',
  'LICENSE-JSZIP.txt', 'LICENSE-PAKO.txt',
];
// Check every input before replacing the generated directory.
for (const file of files) {
  if (!fs.statSync(path.join(root, file)).isFile()) throw Error(`Missing asset: ${file}`);
}
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output);
for (const file of files) fs.copyFileSync(path.join(root, file), path.join(output, file));
fs.writeFileSync(path.join(output, '.nojekyll'), '');
console.log(`Prepared ${files.length} static files in dist/`);
