// Sati Lavni Server
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { RoomManager } from './roomManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;
const roomManager = new RoomManager(io);

// Static assets
app.use(express.static(path.join(projectRoot, 'public')));
app.use(express.json());

// API Endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'Sati Lavni Card Game Server', time: new Date().toISOString() });
});

// Socket.IO Communication
io.on('connection', (socket) => {
  console.log(`[Socket] New connection: ${socket.id}`);

  // Create Room (Quick, Hard, Expert, Ranked, Private)
  socket.on('create-room', ({ mode = 'expert', difficulty = 'expert', name, avatar, userId }) => {
    try {
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
      // Immediately send game state to client
      const clientState = roomManager.getClientState(room, 0);
      socket.emit('game-state', clientState);
    } catch (err) {
      console.error('Error creating room:', err);
      socket.emit('error-msg', { message: 'Failed to create room' });
    }
  });

  // Join Existing Room
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

  // Fill empty seats with bots (host action)
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

  // Player attempts to play a card
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

  // Player attempts to skip/pass
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

  // Restart / Rematch
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

  // Chat message or emoji reaction
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

  // Handle client disconnection
  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
    roomManager.handleDisconnect(socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🃏 SATI LAVNI - Indian 4-Player Card Game Server`);
  console.log(`🌐 Server running at: http://localhost:${PORT}`);
  console.log(`===============================================`);
});
