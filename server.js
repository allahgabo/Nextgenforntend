const express = require('express');
const path    = require('path');
const https   = require('https');

const app      = express();
const PORT     = process.env.PORT || 3000;
const CLOUD_RUN = 'briefing-api-365936249363.me-central1.run.app';

app.use(express.json());

// ── Proxy /api/briefing → Cloud Run ─────────────────────
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
    res.status(502).json({ error: 'Proxy error', detail: err.message });
  });
  proxy.write(body);
  proxy.end();
});

// ── Serve Vite build (dist folder) ──────────────────────
const DIST = path.join(__dirname, 'dist');
app.use(express.static(DIST));
app.get('*', (req, res) => {
  res.sendFile(path.join(DIST, 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
