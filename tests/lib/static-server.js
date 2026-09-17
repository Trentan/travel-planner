const fs = require('fs');
const http = require('http');
const path = require('path');

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.js') return 'application/javascript; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.json') return 'application/json; charset=utf-8';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.png') return 'image/png';
  if (ext === '.ico') return 'image/x-icon';
  if (ext === '.txt') return 'text/plain; charset=utf-8';
  return 'application/octet-stream';
}

const activeServers = new Set();

async function startStaticServer(rootDir, preferredPort = 0) {
  const root = path.resolve(rootDir);
  const sockets = new Set();

  const server = http.createServer((req, res) => {
    try {
      const requestUrl = new URL(req.url, 'http://127.0.0.1');
      let pathname = decodeURIComponent(requestUrl.pathname);
      if (pathname === '/' || pathname === '') pathname = '/index.html';
      if (pathname === '/favicon.ico') {
        res.writeHead(204, { 'Content-Type': 'image/x-icon' });
        res.end();
        return;
      }

      const filePath = path.normalize(path.join(root, pathname));
      if (!filePath.startsWith(root)) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Forbidden');
        return;
      }

      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
        return;
      }

      const body = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType(filePath) });
      res.end(body);
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(error.message || 'Server error');
    }
  });

  // Track all sockets to immediately terminate keep-alive connections on close
  server.on('connection', socket => {
    sockets.add(socket);
    socket.once('close', () => sockets.delete(socket));
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(preferredPort, '127.0.0.1', resolve);
  });

  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : preferredPort;

  const stop = () => new Promise(resolve => {
    activeServers.delete(serverHandle);
    for (const socket of sockets) {
      try { socket.destroy(); } catch (e) {}
    }
    sockets.clear();

    if (typeof server.closeAllConnections === 'function') {
      try { server.closeAllConnections(); } catch (e) {}
    }
    if (typeof server.closeIdleConnections === 'function') {
      try { server.closeIdleConnections(); } catch (e) {}
    }

    server.close(() => resolve());
    // Safety fallback so server close never hangs the process
    setTimeout(resolve, 500).unref();
  });

  // Override close directly on the http.Server instance as well
  const origClose = server.close.bind(server);
  server.close = function(cb) {
    for (const socket of sockets) {
      try { socket.destroy(); } catch (e) {}
    }
    sockets.clear();
    if (typeof server.closeAllConnections === 'function') {
      try { server.closeAllConnections(); } catch (e) {}
    }
    activeServers.delete(serverHandle);
    return origClose(cb);
  };

  const serverHandle = {
    server,
    baseUrl: `http://127.0.0.1:${port}`,
    port,
    close: stop,
    stop
  };

  activeServers.add(serverHandle);
  return serverHandle;
}

async function stopAllServers() {
  const handles = Array.from(activeServers);
  activeServers.clear();
  await Promise.all(handles.map(h => h.close().catch(() => {})));
}

// Clean up any remaining servers if the process terminates
process.once('exit', () => {
  for (const h of activeServers) {
    try { h.server.close(); } catch (e) {}
  }
  activeServers.clear();
});

module.exports = { startStaticServer, stopAllServers };
