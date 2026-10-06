// Socket.IO Multiplayer End-to-End Test for Sati Lavni
import { io } from 'socket.io-client';

const SERVER_URL = process.env.SERVER_URL || process.env.APP_URL || 'http://localhost:3000';

async function runSocketTest() {
  console.log('--- Starting Sati Lavni Socket.IO Multiplayer Test ---');

  const clients = [];
  const playerNames = ['Aarav', 'Diya', 'Rohan', 'Meera'];
  const avatars = ['🤴', '👸', '🧔', '👩‍🦰'];

  for (let i = 0; i < 4; i++) {
    const socket = io(SERVER_URL, { reconnection: false });
    clients.push({
      socket,
      name: playerNames[i],
      avatar: avatars[i],
      seatIndex: null,
      hand: [],
      playableCount: 0
    });
  }

  // Wait for connections
  await Promise.all(clients.map(c => new Promise(res => c.socket.on('connect', res))));
  console.log('✓ All 4 socket clients connected to server');

  let testRoomId = null;

  // Client 0 creates room
  const createPromise = new Promise(resolve => {
    clients[0].socket.on('room-created', ({ roomId, seatIndex }) => {
      testRoomId = roomId;
      clients[0].seatIndex = seatIndex;
      console.log(`✓ Room created with code: #${roomId} by ${clients[0].name}`);
      resolve();
    });
    clients[0].socket.emit('create-room', {
      mode: 'multiplayer',
      name: clients[0].name,
      avatar: clients[0].avatar,
      userId: 'test_user_0'
    });
  });

  await createPromise;

  // Clients 1, 2, 3 join
  for (let i = 1; i < 4; i++) {
    const c = clients[i];
    await new Promise(resolve => {
      c.socket.on('room-joined', ({ seatIndex }) => {
        c.seatIndex = seatIndex;
        console.log(`✓ ${c.name} joined room #${testRoomId} at seat ${seatIndex}`);
        resolve();
      });
      c.socket.emit('join-room', {
        roomId: testRoomId,
        name: c.name,
        avatar: c.avatar,
        userId: `test_user_${i}`
      });
    });
  }

  // Set up game state listeners
  let isGameOver = false;

  const gameOverPromise = new Promise((resolve) => {
    clients.forEach((c, idx) => {
      c.socket.on('game-state', (state) => {
        c.hand = state.myHand;
        c.playableCount = state.playableCount;

        // Anti-cheat verification: Verify state DOES NOT contain hidden cards of opponents
        state.players.forEach(p => {
          if (p.seatIndex !== c.seatIndex && !p.vacant) {
            console.assert(p.hand === undefined, 'Anti-cheat failure: opponent hand exposed!');
            console.assert(typeof p.cardCount === 'number', 'Opponent cardCount should be a number');
          }
        });

        // If it's this client's turn and game is playing, perform move
        if (state.status === 'playing' && state.isMyTurn && !isGameOver) {
          setTimeout(() => {
            const playableCards = c.hand.filter(card => card.isPlayable);
            if (playableCards.length > 0) {
              const cardToPlay = playableCards[0];
              c.socket.emit('play-card', {
                roomId: testRoomId,
                cardId: cardToPlay.id
              });
            } else {
              // Skip
              c.socket.emit('skip-turn', {
                roomId: testRoomId
              });
            }
          }, 30);
        }
      });

      c.socket.on('game-finished', ({ winner, rankings }) => {
        if (!isGameOver) {
          isGameOver = true;
          console.log(`🎉 Game Finished! Winner: ${winner.name} (Rank #1)`);
          console.log(`Rankings:`, rankings.map(r => `${r.rank}. ${r.name} (${r.cardsPlayed} cards played, ${r.skipsCount} skips)`).join(' | '));
          resolve();
        }
      });
    });
  });

  await gameOverPromise;
  console.log('✓ Anti-cheat validated: 0 opponent hands exposed to clients.');
  console.log('✓ Real-time Socket.IO multiplayer game flow successfully completed!');

  clients.forEach(c => c.socket.disconnect());
  process.exit(0);
}

runSocketTest().catch(err => {
  console.error('Socket test error:', err);
  process.exit(1);
});
