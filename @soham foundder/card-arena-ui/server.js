const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());



// Ensure trailing slashes for clean relative path resolution
app.use((req, res, next) => {
  if (req.url === '/7-lavni' || req.url === '/10-lavani' || req.url === '/play-28') {
    return res.redirect(req.url + '/');
  }
  next();
});

// Proxy 7 lavni to its running backend on 3001
app.use('/7-lavni', createProxyMiddleware({ 
  target: 'http://localhost:3001', 
  changeOrigin: true,
  pathRewrite: { '^/7-lavni': '' }
}));

// Proxy Socket.IO for 7 lavni
app.use('/socket.io', createProxyMiddleware({ 
  target: 'http://localhost:3001', 
  changeOrigin: true, 
  ws: true,
  pathRewrite: {
    '^/': '/socket.io/'
  }
}));

// Serve 10 lavani statically
app.use('/10-lavani', express.static(path.join(__dirname, '../10 lavani/dist')));

// Proxy 28 point game to its dev server
app.use('/play-28', createProxyMiddleware({ 
  target: 'http://localhost:3002', 
  changeOrigin: true,
  pathRewrite: function (path, req) {
    // Return original path to prevent Vite from redirecting '/' to '/play-28/'
    return req.originalUrl;
  }
}));

app.use(express.static(path.join(__dirname, '.')));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
