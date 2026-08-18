/**
 * Tiny static server for the Playwright suite.
 *
 * Goal: run the real app from http://localhost so browser features like fetch(version.json)
 * work exactly like a hosted deployment.
 *
 * This test server is isolated under tests/ and serves the repository root (Calcs Final).
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = parseInt(process.env.PORT || '4173', 10);
const ROOT_DIR = path.resolve(__dirname, '..');

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
      return 'text/javascript; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.png':
      return 'image/png';
    case '.jpg':
      return 'image/jpeg';
    case '.jpeg':
      return 'image/jpeg';
    case '.svg':
      return 'image/svg+xml';
    case '.webp':
      return 'image/webp';
    case '.woff':
      return 'font/woff';
    case '.woff2':
      return 'font/woff2';
    default:
      return 'application/octet-stream';
  }
}

function resolveFilePath(requestPath) {
  // requestPath is URL-decoded already.
  const cleaned = requestPath.replace(/^\/+/, '');
  const fullPath = path.join(ROOT_DIR, cleaned);

  // Directory requests: serve index.html inside the directory.
  try {
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
      return path.join(fullPath, 'index.html');
    }
  } catch (e) {
    // fall through
  }

  return fullPath;
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url || '/');
  const requestPath = decodeURIComponent(parsed.pathname || '/');

  // Friendly default for "/" (optional).
  if (requestPath === '/' || requestPath === '') {
    const shellIndex = path.join(ROOT_DIR, 'Portable-Solution-Estimator-Suite', 'index.html');
    try {
      const body = fs.readFileSync(shellIndex);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(body);
    } catch (e) {
      res.writeHead(404);
      res.end('Not found');
    }
    return;
  }

  const filePath = resolveFilePath(requestPath);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  try {
    const body = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': getContentType(filePath) });
    res.end(body);
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Server error');
  }
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[test-server] Serving ${ROOT_DIR} on http://localhost:${PORT}`);
});

