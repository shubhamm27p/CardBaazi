import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { RoomManager } from './roomManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const httpServer = createServer(app);
const appUrl = process.env.APP_URL || process.env.PUBLIC_APP_URL || 'http://localhost:3000';
const allowedOrigins = (process.env.ALLOWED_ORIGINS || `${appUrl},http://localhost:3001,http://localhost:5173`).split(',').map((origin) => origin.trim()).filter(Boolean);

const corsOptions = {
  origin: '*', // Allow all origins to support dynamic Vercel preview URLs
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

const io = new Server(httpServer, { cors: corsOptions });

const PORT = process.env.PORT || 3000;
const roomManager = new RoomManager(io);

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '0');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json({ limit: '1mb' }));

const requireAdmin = (req, res, next) => {
  const role = req.user?.role || req.user?.user_metadata?.role || req.user?.app_metadata?.role || req.user?.admin;
  if (role !== 'admin' && role !== 'superadmin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// JWT Verification Middleware
const verifySupabaseJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error('JWT secret is missing from .env');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret, {
      algorithms: ['HS256'],
      ignoreExpiration: false
    });
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

app.get('/api/protected-data', verifySupabaseJWT, (req, res) => {
  res.json({ message: 'Success! You have accessed protected data.', user: req.user });
});

// Admin endpoint to fetch Clerk users
app.get('/api/admin/users', verifySupabaseJWT, requireAdmin, async (req, res) => {
  try {
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (!clerkSecretKey) {
      return res.status(500).json({ error: 'CLERK_SECRET_KEY is not configured' });
    }

    const response = await fetch('https://api.clerk.com/v1/users', {
      headers: {
        'Authorization': `Bearer ${clerkSecretKey}`
      }
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch from Clerk' });
    }
    const users = await response.json();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch users' });
  }
});

app.use((req, res, next) => {
  if (req.url === '/7-lavni' || req.url === '/10-lavani' || req.url === '/play-28') {
    return res.redirect(req.url + '/');
  }
  next();
});

// Natively serve 7-lavni public folder since it's now integrated!
app.use('/7-lavni', express.static(path.join(__dirname, '../7 lavni/public')));

// Serve 10 lavani statically
app.use('/10-lavani', express.static(path.join(__dirname, '../10 lavani/dist')));

// Proxy or Redirect 28 point game
const GAME28_URL = process.env.GAME28_URL || 'http://localhost:3002';
app.use('/play-28', (req, res, next) => {
  if (GAME28_URL.includes('vercel.app')) {
    return res.redirect(GAME28_URL);
  }
  if (process.env.MONOLITH_MODE === 'true') {
    req.url = req.url.replace(/^\/play-28/, '') || '/';
    return express.static(path.join(__dirname, '../28 point game/dist'))(req, res, next);
  }
  createProxyMiddleware({ 
    target: GAME28_URL, 
    changeOrigin: true,
    pathRewrite: function (path, req) {
      return req.originalUrl;
    }
  })(req, res, next);
});

// Disable caching for the root pages
app.use((req, res, next) => {
  if (req.url === '/' || req.url === '/index.html' || req.url === '/hub.html') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  }
  next();
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/admin-login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin-login.html')));

app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));

const roomCreationAttempts = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_ROOMS_PER_MINUTE = 5;

// --- 7 LAVNI SOCKET.IO EVENTS ---
io.on('connection', (socket) => {
  console.log(`[Socket] New connection: ${socket.id}`);

  socket.on('create-room', ({ mode = 'expert', difficulty = 'expert', name, avatar, userId }) => {
    try {
      const ip = socket.handshake.address;
      const now = Date.now();
      const attempts = roomCreationAttempts.get(ip) || [];
      const recentAttempts = attempts.filter(time => now - time < RATE_LIMIT_WINDOW);
      
      if (recentAttempts.length >= MAX_ROOMS_PER_MINUTE) {
        return socket.emit('error-msg', { message: 'Too many rooms created. Please wait a minute.' });
      }
      
      recentAttempts.push(now);
      roomCreationAttempts.set(ip, recentAttempts);

      const room = roomManager.createRoom({
        mode,
        difficulty,
        hostName: name,
        hostAvatar: avatar,
        userId,
        socketId: socket.id
      });
      socket.join(room.id);
      socket.emit('room-created', {
        roomId: room.id,
        seatIndex: 0,
        mode: room.mode,
        difficulty: room.difficulty
      });
      const clientState = roomManager.getClientState(room, 0);
      socket.emit('game-state', clientState);
    } catch (err) {
      console.error('Error creating room:', err);
      socket.emit('error-msg', { message: 'Failed to create room' });
    }
  });

  socket.on('join-room', ({ roomId, name, avatar, userId }) => {
    try {
      const cleanRoomId = (roomId || '').trim();
      const result = roomManager.joinRoom({
        roomId: cleanRoomId,
        name,
        avatar,
        userId,
        socketId: socket.id
      });

      if (result.error) {
        return socket.emit('error-msg', { message: result.error });
      }

      const { room, seatIndex, reconnected } = result;
      socket.join(room.id);
      socket.emit('room-joined', {
        roomId: room.id,
        seatIndex,
        reconnected
      });

      roomManager.broadcastGameState(room.id);
    } catch (err) {
      console.error('Error joining room:', err);
      socket.emit('error-msg', { message: 'Failed to join room' });
    }
  });

  socket.on('fill-bots', ({ roomId }) => {
    try {
      const success = roomManager.fillWithBots(roomId);
      if (!success) {
        socket.emit('error-msg', { message: 'Cannot fill with bots' });
      }
    } catch (err) {
      console.error('Error filling bots:', err);
    }
  });

  socket.on('play-card', ({ roomId, cardId }) => {
    try {
      const mapping = roomManager.socketToRoom.get(socket.id);
      if (!mapping || mapping.roomId !== roomId) {
        return socket.emit('error-msg', { message: 'Room session mismatch' });
      }

      const result = roomManager.playCard(roomId, mapping.seatIndex, cardId);
      if (!result.success) {
        socket.emit('error-msg', { message: result.error });
      }
    } catch (err) {
      console.error('Error playing card:', err);
      socket.emit('error-msg', { message: 'Error playing card' });
    }
  });

  socket.on('skip-turn', ({ roomId }) => {
    try {
      const mapping = roomManager.socketToRoom.get(socket.id);
      if (!mapping || mapping.roomId !== roomId) {
        return socket.emit('error-msg', { message: 'Room session mismatch' });
      }

      const result = roomManager.skipTurn(roomId, mapping.seatIndex);
      if (!result.success) {
        socket.emit('error-msg', { message: result.error });
      }
    } catch (err) {
      console.error('Error skipping turn:', err);
      socket.emit('error-msg', { message: 'Error skipping turn' });
    }
  });

  socket.on('restart-game', ({ roomId }) => {
    try {
      const mapping = roomManager.socketToRoom.get(socket.id);
      const seatIndex = mapping ? mapping.seatIndex : 0;
      const result = roomManager.restartGame(roomId, seatIndex);
      if (result && !result.success) {
        socket.emit('error-msg', { message: result.error });
      }
    } catch (err) {
      console.error('Error restarting game:', err);
    }
  });

  socket.on('send-chat', ({ roomId, message, emoji }) => {
    try {
      const mapping = roomManager.socketToRoom.get(socket.id);
      const room = roomManager.rooms.get(roomId);
      if (!room || !mapping) return;

      const player = room.seats[mapping.seatIndex];
      const chatPayload = {
        sender: player ? player.name : 'Player',
        avatar: player ? player.avatar : '👤',
        seatIndex: mapping.seatIndex,
        message: message || '',
        emoji: emoji || null,
        timestamp: Date.now()
      };

      io.to(roomId).emit('chat-message', chatPayload);
    } catch (err) {
      console.error('Error in chat:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
    roomManager.handleDisconnect(socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🃏 CARD ARENA MONOLITH SERVER`);
  console.log(`🌐 Server running at: http://localhost:${PORT}`);
  console.log(`===============================================`);
});
