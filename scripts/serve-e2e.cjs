'use strict';
// Serve the exact deployment artifact under a subpath, including Pages' HTML redirect.
require('./build-site.cjs');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..', 'dist');
const files = new Set(fs.readdirSync(root));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png' };
http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/reader/index.html') {
    res.writeHead(308, { Location: '/reader/' });
    return res.end();
  }
  const file = pathname === '/reader/' ? 'index.html' : pathname.slice('/reader/'.length);
  if (!pathname.startsWith('/reader/') || !files.has(file)) {
    res.writeHead(404);
    return res.end('Not found');
  }
  res.writeHead(200, { 'Content-Type': `${types[path.extname(file)] || 'text/plain'}; charset=utf-8`, 'Cache-Control': 'no-cache' });
  fs.createReadStream(path.join(root, file)).pipe(res);
}).listen(4173, '127.0.0.1', () => console.log('E2E site: http://127.0.0.1:4173/reader/'));
