const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    '/briefing-api',
    createProxyMiddleware({
      target:       'https://briefing-api-365936249363.me-central1.run.app',
      changeOrigin: true,
      secure:       true,
      pathRewrite:  { '^/briefing-api': '' },
      onError: (err, req, res) => {
        console.error('[Proxy Error]', err.message);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Proxy error', detail: err.message }));
      },
      onProxyReq: (proxyReq, req) => {
        console.log('[Proxy]', req.method, req.path, '→', proxyReq.path);
      },
      onProxyRes: (proxyRes, req) => {
        console.log('[Proxy Response]', proxyRes.statusCode, req.path);
      },
    })
  );
};
