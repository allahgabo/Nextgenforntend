const { createProxyMiddleware } = require('http-proxy-middleware');

const TARGET = 'https://briefing-api-365936249363.me-central1.run.app';

module.exports = function (app) {
  app.use('/api', createProxyMiddleware({
    target:       TARGET,
    changeOrigin: true,
    secure:       true,
    onError: (err, req, res) => {
      console.error('[Proxy Error]', err.message);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Proxy error', detail: err.message }));
    },
  }));
};
