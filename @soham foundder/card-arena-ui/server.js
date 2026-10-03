const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');

// Load environment variables from the root directory
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// JWT Verification Middleware
const verifySupabaseJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;

  if (!jwtSecret) {
    console.error('SUPABASE_JWT_SECRET is missing from .env');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    // Token is valid! Attach decoded user info to the request
    req.user = decoded;
    next();
  });
};

// Example protected API route using the JWT middleware
app.get('/api/protected-data', verifySupabaseJWT, (req, res) => {
  res.json({ message: 'Success! You have accessed protected data.', user: req.user });
});
// Ensure trailing slashes for clean relative path resolution
app.use((req, res, next) => {
  if (req.url === '/7-lavni' || req.url === '/10-lavani' || req.url === '/play-28') {
    return res.redirect(req.url + '/');
  }
  next();
});

// Get production URLs from environment (or default to local dev ports)
const LAVNI_URL = process.env.LAVNI_URL || 'http://localhost:3001';
const GAME28_URL = process.env.GAME28_URL || 'http://localhost:3002';

// Proxy 7 lavni to its backend
app.use('/7-lavni', createProxyMiddleware({ 
  target: LAVNI_URL, 
  changeOrigin: true,
  pathRewrite: { '^/7-lavni': '' }
}));

// Proxy Socket.IO for 7 lavni
app.use('/socket.io', createProxyMiddleware({ 
  target: LAVNI_URL, 
  changeOrigin: true, 
  ws: true,
  pathRewrite: {
    '^/': '/socket.io/'
  }
}));

// Serve 10 lavani statically
app.use('/10-lavani', express.static(path.join(__dirname, '../10 lavani/dist')));

// Proxy or Redirect 28 point game
app.use('/play-28', (req, res, next) => {
  // If GAME28_URL is a production domain (like vercel), redirect directly to it
  if (GAME28_URL.includes('vercel.app') || process.env.NODE_ENV === 'production') {
    return res.redirect(GAME28_URL);
  }
  
  // Otherwise, proxy it for local development
  createProxyMiddleware({ 
    target: GAME28_URL, 
    changeOrigin: true,
    pathRewrite: function (path, req) {
      return req.originalUrl;
    }
  })(req, res, next);
});

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

// Admin routes
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin-login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
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
