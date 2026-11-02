const http = require('http');
const fs = require('fs');
const path = require('path');
const root = 'd:/AIcode/primary-quest';
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm'
};

http.createServer((req, res) => {
  /* POST /__report：页面把测量报告原文回传，直接落盘，避免人工/代理抄写失真 */
  if (req.method === 'POST' && req.url.split('?')[0] === '/__report') {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
      fs.writeFileSync(path.join(root, '_report.txt'), body, 'utf8');
      res.writeHead(204); res.end();
    });
    return;
  }

  let urlPath = req.url.split('?')[0];
  let p = path.normalize(path.join(root, decodeURIComponent(urlPath)));
  if (!p.startsWith(path.normalize(root))) { res.writeHead(403); res.end('forbidden'); return; }
  fs.stat(p, (err, stat) => {
    if (err || !stat) { res.writeHead(404); res.end('not found: ' + urlPath); return; }
    if (stat.isDirectory()) p = path.join(p, 'index.html');
    fs.readFile(p, (e, d) => {
      if (e) { res.writeHead(500); res.end('read error'); return; }
      const ext = path.extname(p);
      res.writeHead(200, {
        'Content-Type': mime[ext] || 'application/octet-stream',
        'Cache-Control': 'no-cache'
      });
      res.end(d);
    });
  });
}).listen(8765, '127.0.0.1', () => console.log('serving on http://127.0.0.1:8765/'));
