const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// API Endpoints
app.get('/api/user', (req, res) => {
  res.json({
    username: 'YOU',
    level: 18,
    tokenBalance: 12500,
    matchesPlayed: 18,
    rank: 'Card Master'
  });
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
  ws: true 
}));

// Serve 10 lavani statically
app.use('/10-lavani', express.static(path.join(__dirname, '../10 lavani/dist')));

// Serve 28 point game statically
app.use('/28-point-game', express.static(path.join(__dirname, '../28 point game/dist')));

app.use(express.static(path.join(__dirname, '.')));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
