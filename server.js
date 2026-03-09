const express = require('express');
const path    = require('path');
const https   = require('https');
const fs      = require('fs');

const app       = express();
const PORT      = process.env.PORT || 10000;
const CLOUD_RUN = 'briefing-api-365936249363.me-central1.run.app';

app.use(express.json({ limit: '10mb' }));

// ── Generic proxy helper ─────────────────────────────────
function proxyPost(cloudPath, req, res) {
  const body = JSON.stringify(req.body);
  const options = {
    hostname: CLOUD_RUN,
    path:     cloudPath,
    method:   'POST',
    headers:  {
      'Content-Type':   'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  };
  const proxy = https.request(options, (upstream) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(upstream.statusCode);
    upstream.pipe(res);
  });
  proxy.on('error', (err) => {
    console.error('[Proxy Error]', err.message);
    res.status(502).json({ error: 'Proxy error', detail: err.message });
  });
  proxy.write(body);
  proxy.end();
}

// ── Routes ───────────────────────────────────────────────
app.post('/api/briefing', (req, res) => proxyPost('/briefing', req, res));
app.post('/api/chat',     (req, res) => proxyPost('/chat',     req, res));

// ── Serve Vite build ─────────────────────────────────────
const candidates = [
  path.join(process.cwd(), 'dist'),
  path.join(__dirname,     'dist'),
  path.join(process.cwd(), 'build'),
  path.join(__dirname,     'build'),
];
const DIST = candidates.find(p => fs.existsSync(path.join(p, 'index.html')));
console.log('Using dist:', DIST || 'NOT FOUND — tried: ' + candidates.join(', '));

if (DIST) {
  app.use(express.static(DIST));
  app.get('*', (req, res) => res.sendFile(path.join(DIST, 'index.html')));
} else {
  app.get('*', (req, res) => res.status(500).send('Build not found. Tried: ' + candidates.join(', ')));
}

app.listen(PORT, () => console.log(`Server on port ${PORT}`));
