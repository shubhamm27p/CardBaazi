import type {
  Card,
  GamePhase,
  GameState,
  PlayedCard,
  PlayerId,
  Suit,
  TeamId,
  Trick,
  GameSettings,
} from '../types/game';
import { createDeck, dealStage1Cards, dealStage2Cards, shuffleDeck, sortHand } from './deck';
import {
  evaluateTrickWinner,
  getPlayerTeam,
  isCardPlayable,
} from './rules';
import { soundManager } from './sound';
import { choosePartnerHukum } from './ai';
import { generateRandomIndianAINames } from '../../../shared/aiNames';

export const INITIAL_PLAYERS = {
  p1: {
    id: 'p1' as PlayerId,
    name: 'You',
    avatar: '👨‍💼',
    isHuman: true,
    team: 'teamA' as TeamId,
    position: 'bottom' as const,
    hand: [],
    tricksWon: 0,
  },
  p2: {
    id: 'p2' as PlayerId,
    name: 'Vikram',
    avatar: '🧔',
    isHuman: false,
    team: 'teamB' as TeamId,
    position: 'right' as const,
    hand: [],
    tricksWon: 0,
  },
  p3: {
    id: 'p3' as PlayerId,
    name: 'Priya',
    avatar: '👩‍💼',
    isHuman: false,
    team: 'teamA' as TeamId,
    position: 'top' as const,
    hand: [],
    tricksWon: 0,
  },
  p4: {
    id: 'p4' as PlayerId,
    name: 'Amit',
    avatar: '👳',
    isHuman: false,
    team: 'teamB' as TeamId,
    position: 'left' as const,
    hand: [],
    tricksWon: 0,
  },
};

export const DEFAULT_SETTINGS: GameSettings = {
  difficulty: 'medium',
  gameSpeed: 'normal',
  soundEnabled: true,
  autoSortHand: true,
};

export function createInitialState(settings?: Partial<GameSettings>): GameState {
  const mergedSettings = { ...DEFAULT_SETTINGS, ...settings };
  soundManager.setEnabled(mergedSettings.soundEnabled);

  return {
    deck: [],
    remainingDeck: [],
    dealingStage: 1,
    partnerPass: {
      hasPassed: false,
      selectedCardIds: [],
      humanSentCards: [],
      partnerReturnedCards: [],
    },
    players: {
      p1: { ...INITIAL_PLAYERS.p1, hand: [] },
      p2: { ...INITIAL_PLAYERS.p2, hand: [] },
      p3: { ...INITIAL_PLAYERS.p3, hand: [] },
      p4: { ...INITIAL_PLAYERS.p4, hand: [] },
    },
    playerOrder: ['p1', 'p2', 'p3', 'p4'],
    dealerId: 'p4',
    trumpSuit: null,
    trumpChooserId: 'p1',
    currentTurn: 'p1',
    phase: 'idle',
    currentTrick: {
      trickNumber: 1,
      leadPlayerId: 'p1',
      cards: [],
      capturedDehlas: [],
    },
    trickHistory: [],
    teamScores: {
      teamA: { dehlas: [], tricksWon: 0, isKot: false },
      teamB: { dehlas: [], tricksWon: 0, isKot: false },
    },
    trickNumber: 0,
    lastTrickWinner: null,
    statusMessage: 'Press "Start New Game" to shuffle and deal Stage 1 (first 4 cards)!',
    highlightCardId: null,
    settings: mergedSettings,
  };
}

/**
 * STAGE 1: Shuffles 32-card deck and deals ONLY 4 cards to each player.
 * Player evaluates hand and can choose to PASS TO PARTNER or CHOOSE HUKUM directly.
 */
export function startNewGame(
  currentState: GameState,
  trumpChooser: PlayerId = 'p1'
): GameState {
  soundManager.playDeal();

  const deck = createDeck();
  const shuffled = shuffleDeck(deck);

  const playerIds: PlayerId[] = ['p1', 'p2', 'p3', 'p4'];
  const { hands, remainingDeck } = dealStage1Cards(shuffled, playerIds);

  const updatedPlayers = { ...currentState.players };
  for (const pid of playerIds) {
    let hand = hands[pid];
    if (pid === 'p1' && currentState.settings.autoSortHand) {
      hand = sortHand(hand);
    }
    updatedPlayers[pid] = {
      ...updatedPlayers[pid],
      hand,
      tricksWon: 0,
    };
  }

  // Randomize AI names for the new game
  const newAiNames = generateRandomIndianAINames(3);
  updatedPlayers['p2'].name = newAiNames[0].name;
  updatedPlayers['p2'].avatar = newAiNames[0].avatar;
  
  updatedPlayers['p3'].name = newAiNames[1].name;
  updatedPlayers['p3'].avatar = newAiNames[1].avatar;
  
  updatedPlayers['p4'].name = newAiNames[2].name;
  updatedPlayers['p4'].avatar = newAiNames[2].avatar;

  const phase: GamePhase = 'evaluateHand';

  return {
    ...currentState,
    deck: shuffled,
    remainingDeck,
    dealingStage: 1,
    partnerPass: {
      hasPassed: false,
      selectedCardIds: [],
      humanSentCards: [],
      partnerReturnedCards: [],
    },
    players: updatedPlayers,
    trumpSuit: null,
    trumpChooserId: trumpChooser,
    currentTurn: trumpChooser,
    phase,
    currentTrick: {
      trickNumber: 1,
      leadPlayerId: 'p1',
      cards: [],
      capturedDehlas: [],
    },
    trickHistory: [],
    teamScores: {
      teamA: { dehlas: [], tricksWon: 0, isKot: false },
      teamB: { dehlas: [], tricksWon: 0, isKot: false },
    },
    trickNumber: 1,
    lastTrickWinner: null,
    statusMessage: 'First 4 cards dealt — Pass to Partner or Choose Hukum.',
    highlightCardId: null,
  };
}

/**
 * STEP 3: If human clicks "PASS TO PARTNER"
 * Passes the decision to partner Priya. Priya evaluates her 4 cards and decides Hukum.
 * No card exchange or replacement.
 */
export function passHukumToPartner(currentState: GameState): GameState {
  return {
    ...currentState,
    phase: 'partnerChoosingHukum',
    trumpChooserId: 'p3',
    partnerPass: {
      hasPassed: true,
      selectedCardIds: [],
      humanSentCards: [],
      partnerReturnedCards: [],
    },
    statusMessage: 'You passed Hukum to partner. Priya is choosing Hukum...',
  };
}

export function passToPartnerAndChooseHukum(currentState: GameState): GameState {
  return passHukumToPartner(currentState);
}

/**
 * Partner Priya evaluates her hand using choosePartnerHukum, locks Hukum,
 * and deals Stage 2 cards (remaining 16 cards, 4 to each player).
 */
export function partnerSelectHukumAndDeal(currentState: GameState): {
  nextState: GameState;
  chosenHukum: Suit;
} {
  const chosenHukum = choosePartnerHukum(currentState.players.p3.hand);
  const nextState = selectHukumAndDealStage2(currentState, chosenHukum);

  return {
    nextState: {
      ...nextState,
      trumpChooserId: 'p3',
      statusMessage: `Priya declared Hukum: ${chosenHukum.toUpperCase()}! Full hand (8 / 8 cards) dealt. You lead Trick 1/8.`,
    },
    chosenHukum,
  };
}

/**
 * STEP 4: If human clicks "CHOOSE HUKUM" directly
 * Immediately open the same Hukum selection screen.
 */
export function proceedToHukumSelection(currentState: GameState): GameState {
  return {
    ...currentState,
    phase: 'selectTrump',
    partnerPass: {
      hasPassed: false,
      selectedCardIds: [],
      humanSentCards: [],
      partnerReturnedCards: [],
    },
    statusMessage: 'Choose Hukum (Trump suit) for this round.',
  };
}

/**
 * STAGE 2: After Hukum selection, deals the remaining 4 cards to all players.
 * Now every player has 8 cards. Gameplay transitions to Trick 1.
 */
export function selectHukumAndDealStage2(
  currentState: GameState,
  trumpSuit: Suit
): GameState {
  soundManager.playTrumpSelect();
  soundManager.playDeal();

  const playerIds: PlayerId[] = ['p1', 'p2', 'p3', 'p4'];
  const currentHands: Record<PlayerId, Card[]> = {
    p1: currentState.players.p1.hand,
    p2: currentState.players.p2.hand,
    p3: currentState.players.p3.hand,
    p4: currentState.players.p4.hand,
  };

  // Deal remaining 4 cards to each player (yielding 8 cards each)
  const fullHands = dealStage2Cards(
    currentState.remainingDeck,
    playerIds,
    currentHands
  );

  const updatedPlayers = { ...currentState.players };
  for (const pid of playerIds) {
    let hand = fullHands[pid];
    if (pid === 'p1' && currentState.settings.autoSortHand) {
      hand = sortHand(hand);
    }
    updatedPlayers[pid] = {
      ...updatedPlayers[pid],
      hand,
    };
  }

  const leadPlayerId: PlayerId = 'p1';

  return {
    ...currentState,
    trumpSuit,
    remainingDeck: [],
    dealingStage: 2,
    players: updatedPlayers,
    phase: 'playing',
    currentTurn: leadPlayerId,
    currentTrick: {
      trickNumber: 1,
      leadPlayerId,
      cards: [],
      capturedDehlas: [],
    },
    statusMessage: `Hukum: ${trumpSuit.toUpperCase()}! Full hand (8 / 8 cards) dealt. You lead Trick 1/8.`,
  };
}

/**
 * Legacy wrapper.
 */
export function selectTrumpAndDealStage2(
  currentState: GameState,
  trumpSuit: Suit
): GameState {
  return selectHukumAndDealStage2(currentState, trumpSuit);
}

export function setTrumpSuit(
  currentState: GameState,
  trumpSuit: Suit
): GameState {
  return selectHukumAndDealStage2(currentState, trumpSuit);
}

/**
 * Plays a card for the current player. Validates strictly.
 */
export function playCard(
  currentState: GameState,
  playerId: PlayerId,
  cardId: string
): GameState {
  // Disallow playing cards if Hukum is not yet selected or game is not in 'playing' phase
  if (currentState.phase !== 'playing' || currentState.dealingStage !== 2) {
    return currentState;
  }

  if (currentState.currentTurn !== playerId) {
    return currentState;
  }

  const player = currentState.players[playerId];
  const card = player.hand.find((c) => c.id === cardId);
  if (!card) {
    return currentState;
  }

  const leadSuit = currentState.currentTrick.leadSuit;
  if (!isCardPlayable(card, player.hand, leadSuit)) {
    return currentState; // Illegal move blocked
  }

  soundManager.playCardPlay();

  const newHand = player.hand.filter((c) => c.id !== cardId);
  const updatedPlayer = {
    ...player,
    hand: newHand,
  };

  const newPlayedCard: PlayedCard = {
    playerId,
    card,
    timestamp: Date.now(),
  };

  const updatedCards = [...currentState.currentTrick.cards, newPlayedCard];
  const actualLeadSuit = leadSuit || card.suit;

  const updatedTrick: Trick = {
    ...currentState.currentTrick,
    leadSuit: actualLeadSuit,
    cards: updatedCards,
  };

  if (updatedCards.length === 4) {
    return {
      ...currentState,
      players: {
        ...currentState.players,
        [playerId]: updatedPlayer,
      },
      currentTrick: updatedTrick,
      phase: 'trickResolving',
      statusMessage: 'Evaluating trick winner...',
    };
  }

  const order: PlayerId[] = ['p1', 'p2', 'p3', 'p4'];
  const currentIndex = order.indexOf(playerId);
  const nextPlayerId = order[(currentIndex + 1) % 4];

  return {
    ...currentState,
    players: {
      ...currentState.players,
      [playerId]: updatedPlayer,
    },
    currentTrick: updatedTrick,
    currentTurn: nextPlayerId,
    statusMessage: `${currentState.players[nextPlayerId].name}'s turn...`,
  };
}

/**
 * Resolves a completed 4-card trick: awards captured Dehlas, increments trick count,
 * records in history, checks if game has ended (trick 8/8).
 */
export function resolveTrick(currentState: GameState): GameState {
  const { currentTrick, trumpSuit, teamScores, players } = currentState;
  const { winnerPlayerId, winningCard, capturedDehlas } = evaluateTrickWinner(
    currentTrick.cards,
    trumpSuit,
    currentTrick.leadSuit
  );

  const winner = players[winnerPlayerId];
  const winningTeam = getPlayerTeam(winnerPlayerId);

  if (capturedDehlas.length > 0) {
    soundManager.playDehlaCapture();
  } else {
    soundManager.playTrickWin();
  }

  const updatedWinner = {
    ...winner,
    tricksWon: winner.tricksWon + 1,
  };

  const currentTeamScore = teamScores[winningTeam];
  const updatedTeamScore = {
    ...currentTeamScore,
    dehlas: [...currentTeamScore.dehlas, ...capturedDehlas],
    tricksWon: currentTeamScore.tricksWon + 1,
  };

  const updatedTeamScores = {
    ...teamScores,
    [winningTeam]: updatedTeamScore,
  };

  const completedTrick: Trick = {
    ...currentTrick,
    winnerPlayerId,
    capturedDehlas,
  };

  const updatedHistory = [...currentState.trickHistory, completedTrick];

  const dehlaNotice =
    capturedDehlas.length > 0
      ? ` 🌟 Captured ${capturedDehlas.length} Dehla (${capturedDehlas.map((d) => `10${d.suit === 'spades' ? '♠' : d.suit === 'hearts' ? '♥' : d.suit === 'diamonds' ? '♦' : '♣'}`).join(', ')})!`
      : '';

  const statusMessage = `${winner.name} won Trick ${currentTrick.trickNumber}/8 with ${winningCard.rank}${winningCard.suit === 'spades' ? '♠' : winningCard.suit === 'hearts' ? '♥' : winningCard.suit === 'diamonds' ? '♦' : '♣'}!${dehlaNotice}`;

  if (currentTrick.trickNumber >= 8) {
    const teamADehlas = updatedTeamScores.teamA.dehlas.length;
    const teamBDehlas = updatedTeamScores.teamB.dehlas.length;
    const teamATricks = updatedTeamScores.teamA.tricksWon;
    const teamBTricks = updatedTeamScores.teamB.tricksWon;

    const teamAKot = teamADehlas === 4 || teamATricks === 8;
    const teamBKot = teamBDehlas === 4 || teamBTricks === 8;

    updatedTeamScores.teamA.isKot = teamAKot;
    updatedTeamScores.teamB.isKot = teamBKot;

    if (teamADehlas > teamBDehlas || (teamADehlas === teamBDehlas && teamATricks > teamBTricks)) {
      soundManager.playVictory();
    } else {
      soundManager.playDefeat();
    }

    return {
      ...currentState,
      players: {
        ...players,
        [winnerPlayerId]: updatedWinner,
      },
      teamScores: updatedTeamScores,
      trickHistory: updatedHistory,
      lastTrickWinner: winnerPlayerId,
      phase: 'roundOver',
      statusMessage: `Game Over! Team A: ${teamADehlas} Dehlas vs Team B: ${teamBDehlas} Dehlas.`,
    };
  }

  const nextTrickNumber = currentTrick.trickNumber + 1;
  const nextTrick: Trick = {
    trickNumber: nextTrickNumber,
    leadPlayerId: winnerPlayerId,
    cards: [],
    capturedDehlas: [],
  };

  return {
    ...currentState,
    players: {
      ...players,
      [winnerPlayerId]: updatedWinner,
    },
    teamScores: updatedTeamScores,
    currentTrick: nextTrick,
    trickHistory: updatedHistory,
    trickNumber: nextTrickNumber,
    currentTurn: winnerPlayerId,
    lastTrickWinner: winnerPlayerId,
    phase: 'playing',
    statusMessage,
  };
}
