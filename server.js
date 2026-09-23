'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname);
const port = Number(process.env.PORT) || 5173;
const types = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.gif': 'image/gif',
	'.svg': 'image/svg+xml',
	'.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
	const url = new URL(req.url, 'http://localhost');
	let pathname = decodeURIComponent(url.pathname);
	if (pathname === '/') pathname = '/index.html';
	const file = path.resolve(root, '.' + pathname);
	if (file !== root && !file.startsWith(root + path.sep)) {
		res.writeHead(403);
		res.end('Forbidden');
		return;
	}
	fs.readFile(file, (err, data) => {
		if (err) {
			res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
			res.end('Not found');
			return;
		}
		res.writeHead(200, {
			'Content-Type': types[path.extname(file)] || 'application/octet-stream',
			'Cache-Control': 'no-cache'
		});
		res.end(data);
	});
});

server.listen(port, () => {
	console.log('PK RPG Base em http://localhost:' + port);
});
