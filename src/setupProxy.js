const { createProxyMiddleware } = require('http-proxy-middleware');

const TARGET   = 'https://briefing-api-365936249363.me-central1.run.app';
const https    = require('https');
const http     = require('http');

// Local news RSS fetcher (avoids CORS in dev)
function fetchUrl(urlStr, cb) {
  const u   = new URL(urlStr);
  const lib = u.protocol === 'https:' ? https : http;
  const req = lib.get({ hostname:u.hostname, path:u.pathname+u.search, headers:{'User-Agent':'Mozilla/5.0','Accept':'application/rss+xml,*/*'}, timeout:8000 }, r => {
    let d=''; r.on('data',c=>d+=c); r.on('end',()=>cb(null,d));
  });
  req.on('error',cb); req.on('timeout',()=>{req.destroy();cb(new Error('timeout'));});
}

module.exports = function (app) {
  // Proxy briefing/chat to Cloud Run
  app.use(['/api/briefing','/api/chat'], createProxyMiddleware({
    target: TARGET, changeOrigin: true, secure: true,
    pathRewrite: { '^/api': '' },  // /api/briefing → /briefing, /api/chat → /chat
    onError: (err, req, res) => { res.writeHead(502,{'Content-Type':'application/json'}); res.end(JSON.stringify({error:err.message})); },
  }));

  // Local news RSS proxies
  app.get('/api/news/intel', (req, res) => {
    fetchUrl('https://news.google.com/rss/search?q=FDA+SFDA+WHO+health+regulation+pharmaceutical&hl=en-US&gl=US&ceid=US:en', (err, data) => {
      if (err) return res.status(502).send(err.message);
      res.setHeader('Content-Type','application/xml'); res.send(data);
    });
  });
  app.get('/api/news/who', (req, res) => {
    const url = 'https://news.google.com/rss/search?q=WHO+disease+outbreak+health+alert+epidemic&hl=en-US&gl=US&ceid=US:en';
    fetchUrl(url, (err, data) => {
      if (err) return res.status(502).send(err.message);
      res.setHeader('Content-Type','application/xml'); res.send(data);
    });
  });
};
