// Local-only static server for the test addon. No external connections.
const http = require('http');
const fs = require('fs');
const path = require('path');
const root = __dirname;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.md': 'text/plain; charset=utf-8', '.wasm': 'application/wasm' };
http.createServer((req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
    let file;
    try { file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname)); }
    catch (_) { res.writeHead(400); return res.end(); }
    if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
    if (file === root) file = path.join(root, 'install.html');
    fs.readFile(file, (err, data) => {
        if (err) { res.writeHead(404); return res.end('Not found'); }
        const headers = { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' };
        // Permit Alt1's file-backed cached page to load only these public
        // vendor OCR assets. The server remains bound to loopback.
        if (file.startsWith(path.join(root, 'ocr') + path.sep)) headers['Access-Control-Allow-Origin'] = '*';
        res.writeHead(200, headers);
        res.end(req.method === 'HEAD' ? undefined : data);
    });
}).listen(8765, '127.0.0.1', () => console.log('Quest Helper test: http://127.0.0.1:8765/install.html'));
