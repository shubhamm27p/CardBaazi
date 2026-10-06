// Sati Lavni Room and Session Manager - Professional Competitive Edition
import {
  createDeck,
  shuffleDeck,
  dealCards,
  initBoard,
  findStartingPlayer,
  isCardPlayable,
  getPlayableCards,
  canPlayerSkip,
  applyCardPlay,
  chooseBotMove,
  SUIT_NAMES,
  SUIT_SYMBOLS
} from './gameLogic.js';

import { generateRandomIndianAINames } from '../../shared/aiNames.js';
import crypto from 'crypto';

export class RoomManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // roomId -> Room
    this.socketToRoom = new Map(); // socketId -> { roomId, seatIndex }

    // Security: Cleanup idle rooms every 15 minutes to prevent memory DoS
    setInterval(() => this.cleanupIdleRooms(), 15 * 60 * 1000);
  }

  cleanupIdleRooms() {
    const now = Date.now();
    const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    
    for (const [roomId, room] of this.rooms.entries()) {
      // If room is older than 30 mins and either still waiting or hasn't had a turn recently
      const lastActivity = Math.max(room.createdAt || 0, room.turnStartTime || 0);
      if (now - lastActivity > IDLE_TIMEOUT) {
        if (room.turnTimer) clearInterval(room.turnTimer);
        this.rooms.delete(roomId);
      }
    }
  }

  generateRoomCode() {
    let code;
    do {
      code = crypto.randomBytes(3).toString('hex').toUpperCase();
    } while (this.rooms.has(code));
    return code;
  }

  createRoom({ mode = 'expert', difficulty = 'expert', hostName = 'Player 1', hostAvatar = '🤴', userId, socketId }) {
    const roomId = this.generateRoomCode();

    // Map mode to difficulty
    let resolvedDifficulty = difficulty;
    if (mode === 'easy') resolvedDifficulty = 'easy';
    else if (mode === 'hard') resolvedDifficulty = 'hard';
    else if (mode === 'expert' || mode === 'ranked') resolvedDifficulty = 'expert';

    const room = {
      id: roomId,
      mode, // 'easy', 'hard', 'expert', 'ranked', 'private'
      difficulty: resolvedDifficulty,
      status: 'waiting', // 'waiting', 'playing', 'finished'
      createdAt: Date.now(),
      gameStartTime: null,
      gameEndTime: null,
      roundNumber: 1,
      turnCount: 0,
      turnStartTime: Date.now(),
      seats: [
        {
          seatIndex: 0,
          userId,
          socketId,
          name: hostName || 'Player 1',
          avatar: hostAvatar || '🤴',
          isBot: false,
          isHost: true,
          disconnected: false,
          replacedByBot: false
        },
        null,
        null,
        null
      ],
      hands: [[], [], [], []], // 13 cards per seat (server authoritative)
      board: initBoard(),
      currentTurn: 0,
      starterSeat: 0,
      turnTimer: null,
      turnSecondsLeft: 30, // 30-second competitive timer
      history: [],
      passHistory: [], // tracks passes with board context for AI inference
      finishedPlayers: [],
      stats: [
        { cardsPlayed: 0, skipsCount: 0, legalMovesMade: 0, invalidAttempts: 0, decisionTimes: [], fastestMove: null, longestTurn: null },
        { cardsPlayed: 0, skipsCount: 0, legalMovesMade: 0, invalidAttempts: 0, decisionTimes: [], fastestMove: null, longestTurn: null },
        { cardsPlayed: 0, skipsCount: 0, legalMovesMade: 0, invalidAttempts: 0, decisionTimes: [], fastestMove: null, longestTurn: null },
        { cardsPlayed: 0, skipsCount: 0, legalMovesMade: 0, invalidAttempts: 0, decisionTimes: [], fastestMove: null, longestTurn: null }
      ],
      chatMessages: []
    };

    if (mode !== 'private') {
      // Auto-fill seats 1, 2, 3 with distinct bots
      const randomNames = generateRandomIndianAINames(3);
      for (let i = 1; i < 4; i++) {
        const bot = randomNames[i - 1];
        room.seats[i] = {
          seatIndex: i,
          userId: `bot-${i}`,
          socketId: null,
          name: `${bot.name} (${resolvedDifficulty.toUpperCase()})`,
          avatar: bot.avatar,
          isBot: true,
          isHost: false,
          disconnected: false,
          replacedByBot: false
        };
      }
    }

    this.rooms.set(roomId, room);
    if (socketId) {
      this.socketToRoom.set(socketId, { roomId, seatIndex: 0 });
    }

    if (mode !== 'private') {
      this.startGame(roomId);
    }

    return room;
  }

  joinRoom({ roomId, name, avatar, userId, socketId }) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { error: 'Room not found! Please check the code.' };
    }

    // Check if user is reconnecting
    const existingSeat = room.seats.findIndex(s => s && s.userId === userId);
    if (existingSeat !== -1) {
      const seat = room.seats[existingSeat];
      seat.socketId = socketId;
      seat.disconnected = false;
      seat.replacedByBot = false;
      this.socketToRoom.set(socketId, { roomId, seatIndex: existingSeat });
      return { room, seatIndex: existingSeat, reconnected: true };
    }

    if (room.status !== 'waiting') {
      return { error: 'Game is already in progress in this room!' };
    }

    // Find first vacant seat
    const vacantSeat = room.seats.findIndex(s => s === null || s.isBot);
    if (vacantSeat === -1) {
      return { error: 'This room is already full (4 players max)!' };
    }

    room.seats[vacantSeat] = {
      seatIndex: vacantSeat,
      userId,
      socketId,
      name: name || `Player ${vacantSeat + 1}`,
      avatar: avatar || '🧑',
      isBot: false,
      isHost: false,
      disconnected: false,
      replacedByBot: false
    };

    this.socketToRoom.set(socketId, { roomId, seatIndex: vacantSeat });

    // Check if room is now full of 4 human players
    const humanCount = room.seats.filter(s => s && !s.isBot).length;
    if (humanCount === 4) {
      this.startGame(roomId);
    }

    return { room, seatIndex: vacantSeat, reconnected: false };
  }

  fillWithBots(roomId) {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'waiting') return false;

    const randomNames = generateRandomIndianAINames(4);
    let botIndex = 0;
    for (let i = 0; i < 4; i++) {
      if (!room.seats[i]) {
        const bot = randomNames[botIndex++];
        room.seats[i] = {
          seatIndex: i,
          userId: `bot-${i}`,
          socketId: null,
          name: `${bot.name} (${room.difficulty.toUpperCase()})`,
          avatar: bot.avatar,
          isBot: true,
          isHost: false,
          disconnected: false,
          replacedByBot: false
        };
      }
    }

    this.startGame(roomId);
    return true;
  }

  startGame(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // Reset game state
    room.status = 'playing';
    room.gameStartTime = Date.now();
    room.roundNumber = 1;
    room.turnCount = 0;
    room.turnStartTime = Date.now();
    room.board = initBoard();
    room.history = [];
    room.passHistory = [];
    room.finishedPlayers = [];
    room.stats = [
      { cardsPlayed: 0, skipsCount: 0, legalMovesMade: 0, invalidAttempts: 0, decisionTimes: [], fastestMove: null, longestTurn: null },
      { cardsPlayed: 0, skipsCount: 0, legalMovesMade: 0, invalidAttempts: 0, decisionTimes: [], fastestMove: null, longestTurn: null },
      { cardsPlayed: 0, skipsCount: 0, legalMovesMade: 0, invalidAttempts: 0, decisionTimes: [], fastestMove: null, longestTurn: null },
      { cardsPlayed: 0, skipsCount: 0, legalMovesMade: 0, invalidAttempts: 0, decisionTimes: [], fastestMove: null, longestTurn: null }
    ];

    // Deal 52 cards equally using cryptographic shuffle
    const deck = shuffleDeck(createDeck());
    room.hands = dealCards(deck);

    // Starting Card: 7 of Hearts (H-7)
    const starterSeat = findStartingPlayer(room.hands);
    room.starterSeat = starterSeat;
    room.currentTurn = starterSeat;

    const starterName = room.seats[starterSeat].name;
    room.history.unshift({
      type: 'announcement',
      round: room.roundNumber,
      turn: room.turnCount,
      message: `7♥ starts the game! ${starterName} holds 7♥ and plays first.`,
      timestamp: Date.now(),
      timeString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });

    this.broadcastGameState(roomId);
    this.startTurnTimer(roomId);

    // If starter is a bot, trigger their move
    if (this.isSeatControlledByBot(room, starterSeat)) {
      this.scheduleBotTurn(roomId, starterSeat, 1100);
    }
  }

  isSeatControlledByBot(room, seatIndex) {
    const seat = room.seats[seatIndex];
    if (!seat) return true;
    return seat.isBot || seat.disconnected || seat.replacedByBot;
  }

  recordDecisionTime(room, seatIndex) {
    const now = Date.now();
    const timeTaken = now - room.turnStartTime;
    
    room.stats[seatIndex].decisionTimes.push(timeTaken);
    
    if (!room.stats[seatIndex].fastestMove || timeTaken < room.stats[seatIndex].fastestMove) {
      room.stats[seatIndex].fastestMove = timeTaken;
    }
    if (!room.stats[seatIndex].longestTurn || timeTaken > room.stats[seatIndex].longestTurn) {
      room.stats[seatIndex].longestTurn = timeTaken;
    }
  }

  startTurnTimer(roomId) {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'playing') return;

    if (room.turnTimer) {
      clearInterval(room.turnTimer);
      room.turnTimer = null;
    }

    room.turnSecondsLeft = 30; // 30-second competitive timer
    room.turnStartTime = Date.now();

    room.turnTimer = setInterval(() => {
      room.turnSecondsLeft--;

      let timerState = 'normal';
      if (room.turnSecondsLeft <= 5) {
        timerState = 'critical';
      } else if (room.turnSecondsLeft <= 10) {
        timerState = 'warning';
      }

      this.io.to(roomId).emit('timer-tick', {
        secondsLeft: room.turnSecondsLeft,
        turnSeat: room.currentTurn,
        timerState
      });

      if (room.turnSecondsLeft <= 0) {
        clearInterval(room.turnTimer);
        room.turnTimer = null;
        this.handleTurnTimeout(roomId);
      }
    }, 1000);
  }

  recordDecisionTime(room, seatIndex) {
    const elapsed = Date.now() - room.turnStartTime;
    const stat = room.stats[seatIndex];
    stat.decisionTimes.push(elapsed);
    if (stat.fastestMove === null || elapsed < stat.fastestMove) {
      stat.fastestMove = elapsed;
    }
    if (stat.longestTurn === null || elapsed > stat.longestTurn) {
      stat.longestTurn = elapsed;
    }
  }

  handleTurnTimeout(roomId) {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'playing') return;

    const seatIndex = room.currentTurn;
    const hand = room.hands[seatIndex];
    const playable = getPlayableCards(hand, room.board);

    if (playable.length > 0) {
      // Auto-play the first playable card
      const cardToPlay = playable[0];
      this.playCard(roomId, seatIndex, cardToPlay.id, true);
    } else {
      // Auto-skip
      this.skipTurn(roomId, seatIndex, true);
    }
  }

  scheduleBotTurn(roomId, seatIndex, delayMs = 900) {
    // Human-like thinking variance between 700ms - 1300ms
    const randomizedDelay = delayMs + Math.floor(Math.random() * 400);

    setTimeout(() => {
      const room = this.rooms.get(roomId);
      if (!room || room.status !== 'playing' || room.currentTurn !== seatIndex) return;

      const hand = room.hands[seatIndex];
      const opponentCounts = room.hands.map(h => h.length);

      const botDecision = chooseBotMove(hand, room.board, room.difficulty, {
        opponentCardCounts: opponentCounts,
        botSeatIndex: seatIndex,
        passHistory: room.passHistory
      });

      if (botDecision.action === 'play') {
        this.playCard(roomId, seatIndex, botDecision.card.id);
      } else {
        this.skipTurn(roomId, seatIndex);
      }
    }, randomizedDelay);
  }

  playCard(roomId, seatIndex, cardId, isTimeoutAuto = false) {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'playing') {
      return { success: false, error: 'Game is not active' };
    }

    if (room.currentTurn !== seatIndex) {
      room.stats[seatIndex].invalidAttempts++;
      return { success: false, error: 'Not your turn!' };
    }

    const hand = room.hands[seatIndex];
    const cardIndex = hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) {
      room.stats[seatIndex].invalidAttempts++;
      return { success: false, error: 'You do not hold this card!' };
    }

    const card = hand[cardIndex];

    // Must be legally playable
    if (!isCardPlayable(card, room.board)) {
      room.stats[seatIndex].invalidAttempts++;
      return { success: false, error: 'This card cannot be played yet.' };
    }

    this.recordDecisionTime(room, seatIndex);

    // Apply card to board
    const wasSuitOpen = room.board[card.suit].played;
    applyCardPlay(room.board, card);
    hand.splice(cardIndex, 1);

    room.stats[seatIndex].cardsPlayed++;
    room.stats[seatIndex].legalMovesMade++;
    room.turnCount++;

    const player = room.seats[seatIndex];
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Check if playing this card opened a new suit
    const isNewSuitOpened = !wasSuitOpen && card.rank === 7;

    room.history.unshift({
      type: 'move',
      round: room.roundNumber,
      turn: room.turnCount,
      seat: seatIndex,
      playerName: player.name,
      avatar: player.avatar,
      action: 'play',
      card,
      isAuto: isTimeoutAuto,
      isNewSuitOpened,
      timestamp: Date.now(),
      timeString: timeStr
    });

    if (isNewSuitOpened) {
      this.io.to(roomId).emit('suit-opened', {
        suit: card.suit,
        name: SUIT_NAMES[card.suit],
        symbol: SUIT_SYMBOLS[card.suit],
        playerName: player.name
      });
    }

    // Check if player has finished (0 cards remaining)
    if (hand.length === 0) {
      const finishedRank = room.finishedPlayers.length + 1;
      room.finishedPlayers.push({
        seat: seatIndex,
        userId: player.userId,
        name: player.name,
        avatar: player.avatar,
        isBot: player.isBot,
        rank: finishedRank,
        cardsPlayed: room.stats[seatIndex].cardsPlayed,
        skipsCount: room.stats[seatIndex].skipsCount,
        stats: room.stats[seatIndex]
      });

      room.history.unshift({
        type: 'finish',
        round: room.roundNumber,
        turn: room.turnCount,
        seat: seatIndex,
        playerName: player.name,
        rank: finishedRank,
        message: `🏆 ${player.name} finished at Rank #${finishedRank}!`,
        timestamp: Date.now(),
        timeString: timeStr
      });
    }

    // Emit card played event with animation data
    this.io.to(roomId).emit('card-played', {
      seat: seatIndex,
      playerName: player.name,
      card,
      cardsRemaining: hand.length,
      isNewSuitOpened,
      finishedRank: hand.length === 0 ? room.finishedPlayers.length : null
    });

    // Check if game is over (3 or 4 players finished, or all 52 cards placed)
    const activeRemaining = room.hands.map((h, i) => ({ seat: i, count: h.length })).filter(p => p.count > 0);

    if (activeRemaining.length <= 1) {
      // Game over! Assign last player 4th rank
      if (activeRemaining.length === 1) {
        const lastSeat = activeRemaining[0].seat;
        const lastPlayer = room.seats[lastSeat];
        room.finishedPlayers.push({
          seat: lastSeat,
          userId: lastPlayer.userId,
          name: lastPlayer.name,
          avatar: lastPlayer.avatar,
          isBot: lastPlayer.isBot,
          rank: 4,
          cardsPlayed: room.stats[lastSeat].cardsPlayed,
          skipsCount: room.stats[lastSeat].skipsCount,
          stats: room.stats[lastSeat]
        });
      }

      this.finishGame(roomId);
      return { success: true };
    }

    // Advance to next active player
    this.advanceTurn(roomId);
    return { success: true };
  }

  skipTurn(roomId, seatIndex, isTimeoutAuto = false) {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'playing') {
      return { success: false, error: 'Game is not active' };
    }

    if (room.currentTurn !== seatIndex) {
      room.stats[seatIndex].invalidAttempts++;
      return { success: false, error: 'Not your turn!' };
    }

    const hand = room.hands[seatIndex];

    // HARD SKIP RULE: A player may SKIP ONLY if absolutely no legal card is available!
    if (!canPlayerSkip(hand, room.board) && !isTimeoutAuto) {
      room.stats[seatIndex].invalidAttempts++;
      return {
        success: false,
        error: 'SKIP NOT ALLOWED — YOU HAVE A LEGAL MOVE.'
      };
    }

    this.recordDecisionTime(room, seatIndex);

    room.stats[seatIndex].skipsCount++;
    room.turnCount++;

    const player = room.seats[seatIndex];
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Track pass in passHistory for AI inference
    room.passHistory.push({
      seat: seatIndex,
      turn: room.turnCount,
      timestamp: Date.now()
    });

    room.history.unshift({
      type: 'move',
      round: room.roundNumber,
      turn: room.turnCount,
      seat: seatIndex,
      playerName: player.name,
      avatar: player.avatar,
      action: 'skip',
      card: null,
      isAuto: isTimeoutAuto,
      timestamp: Date.now(),
      timeString: timeStr
    });

    this.io.to(roomId).emit('turn-skipped', {
      seat: seatIndex,
      playerName: player.name,
      message: `${player.name} skipped — no valid card available.`
    });

    this.advanceTurn(roomId);
    return { success: true };
  }

  advanceTurn(roomId) {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'playing') return;

    // Clockwise: next seat that still has cards
    let nextSeat = (room.currentTurn + 1) % 4;
    let attempts = 0;

    // Round counter increments when cycling back to starter seat
    if (nextSeat === room.starterSeat) {
      room.roundNumber++;
    }

    while (room.hands[nextSeat].length === 0 && attempts < 4) {
      nextSeat = (nextSeat + 1) % 4;
      attempts++;
      if (nextSeat === room.starterSeat) {
        room.roundNumber++;
      }
    }

    room.currentTurn = nextSeat;
    this.broadcastGameState(roomId);

    // Auto-skip logic: If the next player has NO playable cards, skip instantly
    const nextHand = room.hands[nextSeat];
    const playableCards = getPlayableCards(nextHand, room.board);

    if (playableCards.length === 0) {
      this.skipTurn(roomId, nextSeat, true);
      return;
    }

    this.startTurnTimer(roomId);

    // If next player is bot or disconnected, trigger bot turn
    if (this.isSeatControlledByBot(room, nextSeat)) {
      this.scheduleBotTurn(roomId, nextSeat, 900);
    }
  }

  finishGame(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    if (room.turnTimer) {
      clearInterval(room.turnTimer);
      room.turnTimer = null;
    }

    room.status = 'finished';
    room.gameEndTime = Date.now();
    const totalDurationSeconds = Math.round((room.gameEndTime - room.gameStartTime) / 1000);

    // Calculate detailed stats per player
    const detailedStats = room.stats.map((s, idx) => {
      const totalDecTime = s.decisionTimes.reduce((a, b) => a + b, 0);
      const avgDecTime = s.decisionTimes.length > 0 ? Math.round(totalDecTime / s.decisionTimes.length) : 0;
      return {
        cardsPlayed: s.cardsPlayed,
        skipsCount: s.skipsCount,
        legalMovesMade: s.legalMovesMade,
        invalidAttempts: s.invalidAttempts,
        averageDecisionTimeMs: avgDecTime,
        fastestMoveMs: s.fastestMove || 0,
        longestTurnMs: s.longestTurn || 0
      };
    });

    const winner = room.finishedPlayers[0] || null;

    this.io.to(roomId).emit('game-finished', {
      winner,
      rankings: room.finishedPlayers,
      stats: detailedStats,
      totalDurationSeconds,
      roundNumber: room.roundNumber,
      totalTurns: room.turnCount
    });

    this.broadcastGameState(roomId);
  }

  broadcastGameState(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // Send personalized state to each seat (Server-authoritative Anti-cheat)
    for (let seatIndex = 0; seatIndex < 4; seatIndex++) {
      const seat = room.seats[seatIndex];
      if (seat && seat.socketId) {
        const clientState = this.getClientState(room, seatIndex);
        this.io.to(seat.socketId).emit('game-state', clientState);
      }
    }
  }

  getClientState(room, clientSeatIndex) {
    // Only send the client's own hand with playability info
    const myHand = room.hands[clientSeatIndex] || [];
    const playableCards = getPlayableCards(myHand, room.board);
    const playableIds = new Set(playableCards.map(c => c.id));

    const enrichedMyHand = myHand.map(card => ({
      ...card,
      isPlayable: room.currentTurn === clientSeatIndex && playableIds.has(card.id)
    }));

    // For opponents, only send card counts, danger state, and public info
    const publicPlayers = room.seats.map((seat, i) => {
      if (!seat) {
        return {
          seatIndex: i,
          vacant: true
        };
      }
      const cardCount = room.hands[i] ? room.hands[i].length : 0;
      const isTurn = room.currentTurn === i;
      const hasFinished = room.hands[i] ? room.hands[i].length === 0 : false;
      const isDanger = cardCount <= 2 && cardCount > 0;

      let statusText = 'WAITING';
      if (hasFinished) statusText = 'FINISHED';
      else if (isTurn) statusText = seat.isBot ? 'THINKING...' : 'YOUR TURN';
      else if (isDanger) statusText = 'DANGER';

      return {
        seatIndex: i,
        name: seat.name,
        avatar: seat.avatar,
        isBot: seat.isBot,
        isHost: seat.isHost,
        disconnected: seat.disconnected,
        replacedByBot: seat.replacedByBot,
        cardCount,
        isDanger,
        statusText,
        cardsPlayed: room.stats[i].cardsPlayed,
        skipsCount: room.stats[i].skipsCount,
        isTurn,
        hasFinished,
        rank: (room.finishedPlayers.find(f => f.seat === i) || {}).rank || null
      };
    });

    const isMyTurn = room.currentTurn === clientSeatIndex;
    const canSkip = isMyTurn && playableCards.length === 0 && myHand.length > 0;

    return {
      roomId: room.id,
      mode: room.mode,
      difficulty: room.difficulty,
      status: room.status,
      roundNumber: room.roundNumber,
      turnCount: room.turnCount,
      mySeatIndex: clientSeatIndex,
      currentTurn: room.currentTurn,
      starterSeat: room.starterSeat,
      isMyTurn,
      canSkip,
      playableCount: playableCards.length,
      board: room.board,
      myHand: enrichedMyHand,
      players: publicPlayers,
      history: room.history.slice(0, 40),
      finishedPlayers: room.finishedPlayers
    };
  }

  handleDisconnect(socketId) {
    const mapping = this.socketToRoom.get(socketId);
    if (!mapping) return;

    const { roomId, seatIndex } = mapping;
    const room = this.rooms.get(roomId);
    if (!room) return;

    const seat = room.seats[seatIndex];
    if (seat) {
      seat.disconnected = true;
      seat.replacedByBot = true;

      this.io.to(roomId).emit('player-status-changed', {
        seatIndex,
        name: seat.name,
        status: 'disconnected',
        message: `${seat.name} disconnected. An AI bot has stepped in temporarily.`
      });

      // If it's currently this seat's turn, trigger bot play
      if (room.status === 'playing' && room.currentTurn === seatIndex) {
        this.scheduleBotTurn(roomId, seatIndex, 1000);
      }
    }

    this.socketToRoom.delete(socketId);
  }

  restartGame(roomId, requestingSeatIndex) {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'Room session lost. Please refresh the page.' };

    // Only host or any player in bot mode can restart
    if (room.mode === 'private' && !room.seats[requestingSeatIndex]?.isHost) {
      return { success: false, error: 'Only the host can restart the game.' };
    }

    this.startGame(roomId);
    return { success: true };
  }
}
