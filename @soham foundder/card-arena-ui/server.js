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

// Disable caching for the root pages to ensure auth updates propagate
app.use((req, res, next) => {
  if (req.url === '/' || req.url === '/index.html' || req.url === '/hub.html') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  }
  next();
});

// Route root to login page explicitly
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Serve public directory
app.use(express.static(path.join(__dirname, 'public')));

// Fallback
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html')); // Fallback to login instead of index
});

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
