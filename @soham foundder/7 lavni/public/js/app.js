// Sati Lavni Main Application Controller - Professional Competitive Edition
import { soundEngine } from './audio.js';
import { createCardElement, renderBoardSlotCard, SUIT_NAMES, SUIT_ICONS, SUIT_SYMBOLS } from './cards.js';

// User identity persistence
function getOrCreateUserId() {
  let uid = localStorage.getItem('sati_lavni_uid');
  if (!uid) {
    uid = 'user_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('sati_lavni_uid', uid);
  }
  return uid;
}

// Competitive Ranked Profile persistence
function getRankedProfile() {
  const data = localStorage.getItem('sati_lavni_ranked_profile');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {}
  }
  return { mmr: 1200, wins: 0, losses: 0, games: 0 };
}

function saveRankedProfile(profile) {
  localStorage.setItem('sati_lavni_ranked_profile', JSON.stringify(profile));
}

const userId = getOrCreateUserId();
let rankedProfile = getRankedProfile();
let socket = null;

// Game State
let state = {
  roomId: null,
  mode: 'expert',
  difficulty: 'expert',
  status: 'lobby',
  mySeatIndex: 0,
  currentTurn: 0,
  starterSeat: 0,
  isMyTurn: false,
  canSkip: false,
  playableCount: 0,
  roundNumber: 1,
  turnCount: 0,
  board: null,
  myHand: [],
  players: [],
  history: [],
  finishedPlayers: [],
  selectedAvatar: '🤴',
  playerName: 'Player 1'
};

// DOM Elements
const elements = {
  // Navigation & Badges
  roomBadge: document.getElementById('room-badge'),
  roomCodeDisplay: document.getElementById('room-code-display'),
  profileRating: document.getElementById('profile-rating'),
  profileRecord: document.getElementById('profile-record'),
  btnMotionToggle: document.getElementById('btn-motion-toggle'),
  btnAudioToggle: document.getElementById('btn-audio-toggle'),
  audioIcon: document.getElementById('audio-icon'),
  btnRules: document.getElementById('btn-rules'),
  btnHistory: document.getElementById('btn-history'),
  btnNewGame: document.getElementById('btn-new-game'),

  // Announcement & Suit Opened Banners
  announcementBanner: document.getElementById('announcement-banner'),
  announcementText: document.getElementById('announcement-text'),
  suitOpenedToast: document.getElementById('suit-opened-toast'),
  suitOpenedText: document.getElementById('suit-opened-text'),

  // Board Tracks
  tracks: {
    H: document.getElementById('track-H'),
    D: document.getElementById('track-D'),
    C: document.getElementById('track-C'),
    S: document.getElementById('track-S')
  },
  rows: {
    H: document.getElementById('row-H'),
    D: document.getElementById('row-D'),
    C: document.getElementById('row-C'),
    S: document.getElementById('row-S')
  },

  // Player Pods
  pods: {
    bottom: document.getElementById('pod-bottom'),
    left: document.getElementById('pod-left'),
    top: document.getElementById('pod-top'),
    right: document.getElementById('pod-right')
  },
  avatars: {
    bottom: document.getElementById('avatar-bottom'),
    left: document.getElementById('avatar-left'),
    top: document.getElementById('avatar-top'),
    right: document.getElementById('avatar-right')
  },
  names: {
    bottom: document.getElementById('name-bottom'),
    left: document.getElementById('name-left'),
    top: document.getElementById('name-top'),
    right: document.getElementById('name-right')
  },
  cardsCounts: {
    bottom: document.getElementById('cards-bottom'),
    left: document.getElementById('cards-left'),
    top: document.getElementById('cards-top'),
    right: document.getElementById('cards-right')
  },
  statuses: {
    top: document.getElementById('status-top'),
    left: document.getElementById('status-left'),
    right: document.getElementById('status-right')
  },
  dangers: {
    top: document.getElementById('danger-top'),
    left: document.getElementById('danger-left'),
    right: document.getElementById('danger-right')
  },
  opponentVisuals: {
    top: document.getElementById('cards-visual-top'),
    left: document.getElementById('cards-visual-left'),
    right: document.getElementById('cards-visual-right')
  },
  timerDisplay: document.getElementById('turn-timer-display'),

  // Controls & Hand
  actionStatusHint: document.getElementById('action-status-hint'),
  playerHand: document.getElementById('player-hand'),

  // Modals
  modalLobby: document.getElementById('modal-lobby'),
  playerNameInput: document.getElementById('player-name-input'),
  avatarSelector: document.getElementById('avatar-selector'),

  // Mode Selection Buttons
  btnModeExpert: document.getElementById('btn-mode-expert'),
  btnModeHard: document.getElementById('btn-mode-hard'),
  btnModeQuick: document.getElementById('btn-mode-quick'),
  btnModeRanked: document.getElementById('btn-mode-ranked'),
  btnCreateMultiplayer: document.getElementById('btn-create-multiplayer'),
  roomCodeInput: document.getElementById('room-code-input'),
  btnJoinRoom: document.getElementById('btn-join-room'),

  modalWaiting: document.getElementById('modal-waiting'),
  waitingRoomCode: document.getElementById('waiting-room-code'),
  shareLinkInput: document.getElementById('share-link-input'),
  btnCopyLink: document.getElementById('btn-copy-link'),
  waitingSeatsList: document.getElementById('waiting-seats-list'),
  btnFillBots: document.getElementById('btn-fill-bots'),
  btnLeaveWaiting: document.getElementById('btn-leave-waiting'),

  modalRules: document.getElementById('modal-rules'),
  btnCloseRules: document.getElementById('btn-close-rules'),

  modalHistory: document.getElementById('modal-history'),
  historyContainer: document.getElementById('history-container'),
  btnCloseHistory: document.getElementById('btn-close-history'),

  modalWinner: document.getElementById('modal-winner'),
  winnerNameDisplay: document.getElementById('winner-name-display'),
  summaryDuration: document.getElementById('summary-duration'),
  summaryRounds: document.getElementById('summary-rounds'),
  rankingsTableBody: document.getElementById('rankings-table-body'),
  btnPlayAgain: document.getElementById('btn-play-again')
};

// Update Ranked Display in UI
function updateRankedDisplay() {
  if (elements.profileRating) elements.profileRating.textContent = rankedProfile.mmr;
  if (elements.profileRecord) elements.profileRecord.textContent = `${rankedProfile.wins}W - ${rankedProfile.losses}L`;
}

// Initialize Board Slot Tracks
function initBoardSlots() {
  const suits = ['H', 'D', 'C', 'S'];
  const rankLabels = {
    1: 'A', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6',
    7: '7', 8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K'
  };

  suits.forEach(suit => {
    const track = elements.tracks[suit];
    if (!track) return;
    track.innerHTML = '';

    for (let rank = 1; rank <= 13; rank++) {
      const slot = document.createElement('div');
      slot.className = `board-slot ${rank === 7 ? 'is-center-seven' : ''}`;
      slot.dataset.suit = suit;
      slot.dataset.rank = rank;

      slot.innerHTML = `
        <div class="slot-placeholder">
          <span>${rankLabels[rank]}</span>
        </div>
      `;

      track.appendChild(slot);
    }
  });
}

// Seat Rotation Mapping: Always puts current client at the 'bottom' pod
function getPodPositionForSeat(seatIndex) {
  const mySeat = state.mySeatIndex || 0;
  const relativeIndex = (seatIndex - mySeat + 4) % 4;
  switch (relativeIndex) {
    case 0: return 'bottom';
    case 1: return 'left';
    case 2: return 'top';
    case 3: return 'right';
  }
}

// Socket Connection Initialization
function initSocket() {
  socket = io();

  socket.on('connect', () => {
    console.log('[Socket] Connected to Sati Lavni competitive server');
  });

  socket.on('room-created', ({ roomId, seatIndex, mode, difficulty }) => {
    state.roomId = roomId;
    state.mySeatIndex = seatIndex;
    state.mode = mode;
    state.difficulty = difficulty;

    elements.roomBadge.style.display = 'flex';
    elements.roomCodeDisplay.textContent = `Room: #${roomId} (${difficulty.toUpperCase()})`;

    if (mode === 'private') {
      elements.modalLobby.classList.remove('is-open');
      elements.modalWaiting.classList.add('is-open');
      elements.waitingRoomCode.textContent = `#${roomId}`;
      elements.shareLinkInput.value = `${window.location.origin}?room=${roomId}`;
    } else {
      elements.modalLobby.classList.remove('is-open');
      soundEngine.playCardSlide();
    }
  });

  socket.on('room-joined', ({ roomId, seatIndex, reconnected }) => {
    state.roomId = roomId;
    state.mySeatIndex = seatIndex;

    elements.roomBadge.style.display = 'flex';
    elements.roomCodeDisplay.textContent = `Room: #${roomId}`;
    elements.modalLobby.classList.remove('is-open');
    elements.modalWaiting.classList.remove('is-open');

    if (reconnected) {
      showAnnouncement('Reconnected to active match!', '🔄');
    }
  });

  socket.on('game-state', (serverState) => {
    updateGameState(serverState);
  });

  socket.on('card-played', ({ seat, playerName, card, cardsRemaining, isNewSuitOpened, finishedRank }) => {
    soundEngine.playCardSnap();

    // Show flying announcement if it was 7♥
    if (card.id === 'H-7') {
      showAnnouncement(`${playerName} played 7♥! Sequences are now open.`, '♥️');
    }

    if (finishedRank) {
      showReactionAboveSeat(seat, `🏆 Finished #${finishedRank}!`);
    }
  });

  // When a 7 opens a suit sequence
  socket.on('suit-opened', ({ suit, name, symbol, playerName }) => {
    soundEngine.playSuitOpenedChime();

    // Flash the suit row
    const rowEl = elements.rows[suit];
    if (rowEl) {
      rowEl.classList.add('just-opened');
      setTimeout(() => rowEl.classList.remove('just-opened'), 1600);
    }

    // Show suit opened toast
    if (elements.suitOpenedToast && elements.suitOpenedText) {
      elements.suitOpenedText.textContent = `${symbol} ${name.toUpperCase()} SUIT OPENED`;
      elements.suitOpenedToast.classList.add('is-visible');
      setTimeout(() => elements.suitOpenedToast.classList.remove('is-visible'), 2400);
    }
  });

  socket.on('turn-skipped', ({ seat, playerName, message }) => {
    soundEngine.playSkipSound();
    showReactionAboveSeat(seat, 'PASS ⏩');
    showAnnouncement(message, '⏩');
  });

  // 30-Second Competitive Turn Timer
  socket.on('timer-tick', ({ secondsLeft, turnSeat, timerState }) => {
    const pos = getPodPositionForSeat(turnSeat);
    const pod = elements.pods[pos];

    if (pod) {
      pod.classList.remove('timer-warning', 'timer-critical');
      if (timerState === 'critical') {
        pod.classList.add('timer-critical');
        if (turnSeat === state.mySeatIndex) {
          soundEngine.playTimerWarning();
        }
      } else if (timerState === 'warning') {
        pod.classList.add('timer-warning');
      }
    }

    if (turnSeat === state.mySeatIndex) {
      elements.timerDisplay.textContent = `⏱️ ${secondsLeft}s`;
    } else {
      elements.timerDisplay.textContent = '';
    }
  });

  socket.on('game-finished', ({ winner, rankings, stats, totalDurationSeconds, roundNumber }) => {
    soundEngine.playWinFanfare();

    // Update ranked rating if playing in ranked or expert mode
    if (state.mode === 'ranked' || state.mode === 'expert') {
      const myFinish = rankings.find(r => r.seat === state.mySeatIndex);
      rankedProfile.games++;
      if (myFinish && myFinish.rank === 1) {
        rankedProfile.wins++;
        rankedProfile.mmr += 25;
      } else {
        rankedProfile.losses++;
        rankedProfile.mmr = Math.max(800, rankedProfile.mmr - 12);
      }
      saveRankedProfile(rankedProfile);
      updateRankedDisplay();
    }

    renderWinnerModal(winner, rankings, stats, totalDurationSeconds, roundNumber);
  });

  socket.on('chat-message', ({ sender, avatar, seatIndex, message, emoji }) => {
    if (emoji) {
      showReactionAboveSeat(seatIndex, `${emoji}`);
    }
  });

  socket.on('error-msg', ({ message }) => {
    soundEngine.playErrorSound();
    showAnnouncement(message, '⚠️');
  });
}

// Updates UI with full authoritative state from server
function updateGameState(serverState) {
  state.status = serverState.status;
  state.mySeatIndex = serverState.mySeatIndex;
  state.currentTurn = serverState.currentTurn;
  state.starterSeat = serverState.starterSeat;
  state.isMyTurn = serverState.isMyTurn;
  state.canSkip = serverState.canSkip;
  state.playableCount = serverState.playableCount;
  state.roundNumber = serverState.roundNumber || 1;
  state.turnCount = serverState.turnCount || 0;
  state.board = serverState.board;
  state.myHand = serverState.myHand || [];
  state.players = serverState.players || [];
  state.history = serverState.history || [];
  state.finishedPlayers = serverState.finishedPlayers || [];

  // Update board cards
  renderBoard(state.board);

  // Update player pods
  renderPlayerPods(state.players, state.currentTurn);

  // Update hand
  renderHand(state.myHand);

  // Update Controls bar & Skip Button
  updateControls();

  // Update Waiting Modal if open
  if (elements.modalWaiting.classList.contains('is-open')) {
    renderWaitingLobby(state.players);
    if (state.status === 'playing') {
      elements.modalWaiting.classList.remove('is-open');
    }
  }

  // Update History list
  renderHistory(state.history);

  // Announcement logic for game start
  if (state.board && !state.board.H.played) {
    const starter = state.players[state.starterSeat];
    const starterName = starter ? starter.name : 'Player';
    if (state.isMyTurn) {
      showAnnouncement(`7♥ starts the game! You hold 7♥. Play it now!`, '♥️');
    } else {
      showAnnouncement(`7♥ starts the game! ${starterName} holds 7♥ and plays first.`, '♥️');
    }
  }
}

// Render the 4 Suit sequences on the table
function renderBoard(board) {
  if (!board) return;

  const suits = ['H', 'D', 'C', 'S'];
  const rankLabels = {
    1: 'A', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6',
    7: '7', 8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K'
  };

  suits.forEach(suit => {
    const suitData = board[suit];
    const track = elements.tracks[suit];
    if (!suitData || !track) return;

    for (let rank = 1; rank <= 13; rank++) {
      const slot = track.querySelector(`.board-slot[data-rank="${rank}"]`);
      if (!slot) continue;

      const card = suitData.cards[rank];
      if (card) {
        if (!slot.classList.contains('slot-filled')) {
          slot.classList.add('slot-filled');
          slot.innerHTML = renderBoardSlotCard(card);
        }
      } else {
        if (slot.classList.contains('slot-filled')) {
          slot.classList.remove('slot-filled');
          slot.innerHTML = `
            <div class="slot-placeholder">
              <span>${rankLabels[rank]}</span>
            </div>
          `;
        }
      }
    }
  });
}

// Render the 4 player pods positioned around the table
function renderPlayerPods(players, currentTurnSeat) {
  const positions = ['bottom', 'left', 'top', 'right'];
  positions.forEach(pos => {
    elements.pods[pos].classList.remove('active-turn', 'is-danger');
  });

  players.forEach((player, seatIndex) => {
    if (!player || player.vacant) return;

    const pos = getPodPositionForSeat(seatIndex);
    const pod = elements.pods[pos];
    const avatarEl = elements.avatars[pos];
    const nameEl = elements.names[pos];
    const cardsEl = elements.cardsCounts[pos];
    const statusEl = elements.statuses[pos];
    const dangerEl = elements.dangers[pos];
    const visualEl = elements.opponentVisuals[pos];

    if (!pod) return;

    avatarEl.textContent = player.avatar || '👤';
    nameEl.textContent = pos === 'bottom' ? `${player.name} (You)` : player.name;
    cardsEl.textContent = `${player.cardCount} card${player.cardCount === 1 ? '' : 's'}`;

    if (player.hasFinished) {
      cardsEl.textContent = `Rank #${player.rank} 🏆`;
      cardsEl.style.backgroundColor = 'rgba(212, 175, 55, 0.35)';
    } else {
      cardsEl.style.backgroundColor = '';
    }

    // Opponent DANGER state (<= 2 cards remaining)
    if (player.isDanger && !player.hasFinished && pos !== 'bottom') {
      pod.classList.add('is-danger');
      if (dangerEl) {
        dangerEl.textContent = `⚠️ DANGER: ${player.cardCount} CARD${player.cardCount === 1 ? '' : 'S'}`;
      }
    }

    if (statusEl) {
      if (player.disconnected) {
        statusEl.textContent = '(Bot sub)';
        statusEl.style.color = '#f87171';
      } else {
        statusEl.textContent = player.statusText || '';
      }
    }

    // Active Turn Highlight
    if (seatIndex === currentTurnSeat && !player.hasFinished) {
      pod.classList.add('active-turn');
    }

    // Render opponent card backs visual
    if (visualEl) {
      visualEl.innerHTML = '';
      const count = Math.min(player.cardCount, 13);
      for (let i = 0; i < count; i++) {
        const cardBack = document.createElement('div');
        cardBack.className = 'opp-card-back';
        visualEl.appendChild(cardBack);
      }
    }
  });
}

// Render player's hand at bottom (subtle legal highlight, dimmed illegal, no best-move arrows)
function renderHand(handCards) {
  elements.playerHand.innerHTML = '';
  if (elements.selectedCardBar) elements.selectedCardBar.style.display = 'none';
  state.selectedCardId = null;

  if (!handCards || handCards.length === 0) {
    if (state.status === 'playing') {
      elements.playerHand.innerHTML = `<div style="color: #fde047; font-weight: 800; font-size: 16px;">🏆 You have placed all your cards!</div>`;
    }
    return;
  }

  const total = handCards.length;
  handCards.forEach((card, index) => {
    const cardEl = createCardElement(card, {
      isPlayable: card.isPlayable,
      isInteractive: true
    });

    const middleIndex = (total - 1) / 2;
    const offset = index - middleIndex;
    const rotateAngle = offset * 3;
    const translateY = Math.abs(offset) * 2.5;

    cardEl.style.setProperty('--fan-rotate', `${rotateAngle}deg`);
    cardEl.style.setProperty('--fan-y', `${translateY}px`);

    cardEl.addEventListener('click', () => {
      onCardClicked(card, cardEl);
    });

    elements.playerHand.appendChild(cardEl);
  });
}

// Update Controls Bar & Skip Button status
function updateControls() {
  const isTurn = state.isMyTurn;
  const playableCount = state.playableCount;

  if (!isTurn) {
    const activePlayer = state.players[state.currentTurn];
    const activeName = activePlayer ? activePlayer.name : 'Opponent';
    elements.actionStatusHint.innerHTML = `<span>⏳ Waiting for <strong>${activeName}</strong> to play...</span>`;
    elements.actionStatusHint.classList.remove('is-turn');
  } else {
    elements.actionStatusHint.classList.add('is-turn');

    if (playableCount > 0) {
      elements.actionStatusHint.innerHTML = `<span>🎯 <strong>Your Turn:</strong> ${playableCount} legal card${playableCount > 1 ? 's' : ''} available</span>`;
    } else {
      elements.actionStatusHint.innerHTML = `<span style="color: #fde047;">⚠️ <strong>No legal card available! Auto-skipping...</strong></span>`;
    }
  }
}

// Handle card click with strict rejection and feedback
function onCardClicked(card, cardEl) {
  if (!state.isMyTurn) {
    soundEngine.playErrorSound();
    showAnnouncement("Wait for your turn!", "⏳");
    return;
  }

  if (!card.isPlayable) {
    soundEngine.playErrorSound();
    if (cardEl) {
      cardEl.classList.add('shake-invalid');
      setTimeout(() => cardEl.classList.remove('shake-invalid'), 400);
    }

    if (!state.board.H.played && card.id !== 'H-7') {
      showAnnouncement("7♥ MUST be the opening card of the match!", "⚠️");
    } else {
      showAnnouncement("This card cannot be played yet.", "🚫");
    }
    return;
  }

  const prevSelected = elements.playerHand.querySelector('.is-selected');
  if (prevSelected) prevSelected.classList.remove('is-selected');

  // Immediately play the card
  soundEngine.playCardSlide();
  socket.emit('play-card', {
    roomId: state.roomId,
    cardId: card.id
  });
}

// Floating emoji / action reaction above player
function showReactionAboveSeat(seatIndex, text) {
  const pos = getPodPositionForSeat(seatIndex);
  const pod = elements.pods[pos];
  if (!pod) return;

  const reaction = document.createElement('div');
  reaction.className = 'player-reaction-popup';
  reaction.textContent = text;
  pod.appendChild(reaction);

  setTimeout(() => {
    if (pod.contains(reaction)) {
      pod.removeChild(reaction);
    }
  }, 2200);
}

// Floating center banner announcement
function showAnnouncement(message, icon = '✨') {
  elements.announcementText.textContent = message;
  elements.announcementBanner.querySelector('.announcement-icon').textContent = icon;
  elements.announcementBanner.classList.add('pulse-highlight');
  setTimeout(() => {
    elements.announcementBanner.classList.remove('pulse-highlight');
  }, 1600);
}

// Render Move History List with ROUND headers
function renderHistory(historyItems) {
  if (!historyItems || !elements.historyContainer) return;

  elements.historyContainer.innerHTML = '';
  let lastRound = null;

  historyItems.forEach(item => {
    if (item.round && item.round !== lastRound) {
      lastRound = item.round;
      const roundHeader = document.createElement('div');
      roundHeader.className = 'history-round-header';
      roundHeader.textContent = `ROUND ${String(item.round).padStart(2, '0')}`;
      elements.historyContainer.appendChild(roundHeader);
    }

    const el = document.createElement('div');
    el.className = `history-item is-${item.action || item.type || 'play'}`;

    if (item.type === 'announcement') {
      el.innerHTML = `
        <span class="history-action">${item.message}</span>
        <span class="history-time">${item.timeString || ''}</span>
      `;
    } else if (item.action === 'play') {
      const card = item.card;
      el.innerHTML = `
        <div>
          <span class="history-player">${item.playerName}</span> →
          <strong style="color: ${card.color};">${card.label}${card.symbol}</strong>
          ${item.isNewSuitOpened ? '<span style="color:#d4af37; font-size:11px; margin-left:4px;">(Opened)</span>' : ''}
        </div>
        <span class="history-time">${item.timeString || ''}</span>
      `;
    } else if (item.action === 'skip') {
      el.innerHTML = `
        <div>
          <span class="history-player">${item.playerName}</span> →
          <span style="color: #f59e0b; font-weight: 700;">PASS</span>
        </div>
        <span class="history-time">${item.timeString || ''}</span>
      `;
    }

    elements.historyContainer.appendChild(el);
  });
}

// Render Waiting Lobby (for multiplayer room)
function renderWaitingLobby(players) {
  elements.waitingSeatsList.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const player = players[i];
    const row = document.createElement('div');
    row.style.cssText = 'background: rgba(0,0,0,0.4); padding: 8px 12px; border-radius: 8px; display: flex; align-items: center; justify-content: space-between;';

    if (player && !player.vacant) {
      row.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 20px;">${player.avatar}</span>
          <span style="font-weight: 700; color: #fff;">${player.name} ${player.isHost ? '👑 (Host)' : ''}</span>
        </div>
        <span style="font-size: 12px; color: #22c55e; font-weight: 700;">Ready</span>
      `;
    } else {
      row.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 20px;">👤</span>
          <span style="color: #64748b;">Seat ${i + 1} - Waiting for player...</span>
        </div>
        <span style="font-size: 12px; color: #eab308;">Waiting</span>
      `;
    }
    elements.waitingSeatsList.appendChild(row);
  }
}

// Render Winner Modal with Comprehensive Match Statistics
function renderWinnerModal(winner, rankings, stats = [], totalDurationSeconds = 0, roundNumber = 1) {
  elements.modalWinner.classList.add('is-open');
  elements.winnerNameDisplay.textContent = winner ? `${winner.avatar} ${winner.name} won 1st Place!` : 'Match Finished!';

  if (elements.summaryDuration) elements.summaryDuration.textContent = `${totalDurationSeconds}s`;
  if (elements.summaryRounds) elements.summaryRounds.textContent = roundNumber;

  elements.rankingsTableBody.innerHTML = '';
  const medals = ['🥇 1st', '🥈 2nd', '🥉 3rd', '4th'];

  rankings.forEach((entry, idx) => {
    const tr = document.createElement('tr');
    if (idx === 0) tr.className = 'is-winner-row';

    const pStat = stats[entry.seat] || {};
    const avgSec = pStat.averageDecisionTimeMs ? (pStat.averageDecisionTimeMs / 1000).toFixed(1) + 's' : '-';
    const fastSec = pStat.fastestMoveMs ? (pStat.fastestMoveMs / 1000).toFixed(1) + 's' : '-';

    tr.innerHTML = `
      <td>${medals[idx] || (idx + 1)}</td>
      <td>${entry.avatar} ${entry.name}</td>
      <td>${entry.cardsPlayed || 0}</td>
      <td>${entry.skipsCount || 0}</td>
      <td>${pStat.legalMovesMade || entry.cardsPlayed || 0}</td>
      <td>${pStat.invalidAttempts || 0}</td>
      <td>${avgSec}</td>
      <td>${fastSec}</td>
    `;
    elements.rankingsTableBody.appendChild(tr);
  });
}

// Mode Selection Handler
function startRoomWithMode(mode, difficulty) {
  const name = elements.playerNameInput.value.trim() || 'Player 1';
  state.playerName = name;
  socket.emit('create-room', {
    mode,
    difficulty,
    name,
    avatar: state.selectedAvatar,
    userId
  });
}

// Event Listeners Setup
function setupEventListeners() {
  // Avatar selection in lobby
  elements.avatarSelector.querySelectorAll('.avatar-choice').forEach(choice => {
    choice.addEventListener('click', () => {
      elements.avatarSelector.querySelectorAll('.avatar-choice').forEach(c => c.classList.remove('is-selected'));
      choice.classList.add('is-selected');
      state.selectedAvatar = choice.dataset.avatar;
    });
  });

  // Motion toggle button (Reduced motion accessibility)
  elements.btnMotionToggle.addEventListener('click', () => {
    const isReduced = document.body.classList.toggle('reduced-motion');
    localStorage.setItem('sati_lavni_reduced_motion', isReduced);
    elements.btnMotionToggle.style.color = isReduced ? '#f59e0b' : '';
  });
  if (localStorage.getItem('sati_lavni_reduced_motion') === 'true') {
    document.body.classList.add('reduced-motion');
    elements.btnMotionToggle.style.color = '#f59e0b';
  }

  // Sound toggle button
  elements.btnAudioToggle.addEventListener('click', () => {
    const isMuted = soundEngine.toggleMute();
    elements.audioIcon.textContent = isMuted ? '🔇' : '🔊';
  });
  if (soundEngine.isMuted()) {
    elements.audioIcon.textContent = '🔇';
  }

  // Game Mode: Expert AI
  elements.btnModeExpert.addEventListener('click', () => {
    startRoomWithMode('expert', 'expert');
  });

  // Game Mode: Hard AI
  elements.btnModeHard.addEventListener('click', () => {
    startRoomWithMode('hard', 'hard');
  });

  // Game Mode: Quick Play (Casual)
  elements.btnModeQuick.addEventListener('click', () => {
    startRoomWithMode('quick', 'easy');
  });

  // Game Mode: Competitive Ranked
  elements.btnModeRanked.addEventListener('click', () => {
    startRoomWithMode('ranked', 'expert');
  });

  // Game Mode: Create Private Multiplayer Room
  elements.btnCreateMultiplayer.addEventListener('click', () => {
    startRoomWithMode('private', 'expert');
  });

  // Join Room with Code
  elements.btnJoinRoom.addEventListener('click', () => {
    const code = elements.roomCodeInput.value.trim();
    if (!code) {
      showAnnouncement('Please enter a room code!', '⚠️');
      return;
    }
    const name = elements.playerNameInput.value.trim() || 'Player 1';
    state.playerName = name;
    socket.emit('join-room', {
      roomId: code,
      name,
      avatar: state.selectedAvatar,
      userId
    });
  });

  // Fill Remaining with Bots in waiting lobby
  elements.btnFillBots.addEventListener('click', () => {
    socket.emit('fill-bots', { roomId: state.roomId });
    elements.modalWaiting.classList.remove('is-open');
  });

  // Copy share link
  elements.btnCopyLink.addEventListener('click', () => {
    elements.shareLinkInput.select();
    navigator.clipboard.writeText(elements.shareLinkInput.value);
    elements.btnCopyLink.textContent = 'Copied!';
    setTimeout(() => {
      elements.btnCopyLink.textContent = 'Copy Link';
    }, 1800);
  });

  // Leave waiting room
  elements.btnLeaveWaiting.addEventListener('click', () => {
    elements.modalWaiting.classList.remove('is-open');
    elements.modalLobby.classList.add('is-open');
  });

  // Removed Card Selection Confirmation Buttons as cards play instantly

  // Quick Emoji reactions
  document.querySelectorAll('.emoji-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const emoji = btn.dataset.emoji;
      socket.emit('send-chat', {
        roomId: state.roomId,
        emoji
      });
    });
  });

  // Rules modal
  elements.btnRules.addEventListener('click', () => {
    elements.modalRules.classList.add('is-open');
  });
  elements.btnCloseRules.addEventListener('click', () => {
    elements.modalRules.classList.remove('is-open');
  });

  // History modal
  elements.btnHistory.addEventListener('click', () => {
    renderHistory(state.history);
    elements.modalHistory.classList.add('is-open');
  });
  elements.btnCloseHistory.addEventListener('click', () => {
    elements.modalHistory.classList.remove('is-open');
  });

  // Menu / New game
  elements.btnNewGame.addEventListener('click', () => {
    elements.modalLobby.classList.add('is-open');
  });

  // Play Again button on winner modal
  elements.btnPlayAgain.addEventListener('click', () => {
    elements.modalWinner.classList.remove('is-open');
    if (state.roomId) {
      socket.emit('restart-game', { roomId: state.roomId });
    } else {
      elements.modalLobby.classList.add('is-open');
    }
  });

  const btnCloseWinner = document.getElementById('btn-close-winner');
  if (btnCloseWinner) {
    btnCloseWinner.addEventListener('click', () => {
      elements.modalWinner.classList.remove('is-open');
    });
  }

  // Check URL params for room invite (e.g. ?room=5421)
  const urlParams = new URLSearchParams(window.location.search);
  const roomParam = urlParams.get('room');
  if (roomParam) {
    elements.roomCodeInput.value = roomParam;
  }
}

function initApp() {
  initBoardSlots();
  updateRankedDisplay();
  initSocket();
  setupEventListeners();
}

// App Initialization
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
