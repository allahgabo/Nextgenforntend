/**
 * server.js — Express server for Render
 * Serves the React build + proxies /api/briefing → Cloud Run
 */
const express  = require('express');
const path     = require('path');
const https    = require('https');

const app      = express();
const PORT     = process.env.PORT || 3000;
const CLOUD_RUN = 'briefing-api-365936249363.me-central1.run.app';

app.use(express.json());

// ── CORS headers for all responses ──────────────────────
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ── Proxy /api/briefing → Cloud Run /briefing ────────────
app.post('/api/briefing', (req, res) => {
  const body = JSON.stringify(req.body);

  const options = {
    hostname: CLOUD_RUN,
    path:     '/briefing',
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
});

// ── Serve React build ────────────────────────────────────
app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
