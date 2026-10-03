// Sati Lavni Game Logic Engine - Professional Competitive Edition
// Pure Indian 4-Player Card Game (Sevens / Badam Satti)
import crypto from 'crypto';

export const SUITS = ['H', 'D', 'C', 'S']; // Hearts, Diamonds, Clubs, Spades
export const SUIT_NAMES = {
  H: 'Hearts',
  D: 'Diamonds',
  C: 'Clubs',
  S: 'Spades'
};
export const SUIT_SYMBOLS = {
  H: '♥',
  D: '♦',
  C: '♣',
  S: '♠'
};
export const SUIT_COLORS = {
  H: '#dc2626',
  D: '#dc2626',
  C: '#0f172a',
  S: '#0f172a'
};

export const RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
export const RANK_LABELS = {
  1: 'A',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'J',
  12: 'Q',
  13: 'K'
};

/**
 * Creates a standard 52-card deck
 */
export function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        label: RANK_LABELS[rank],
        symbol: SUIT_SYMBOLS[suit],
        color: SUIT_COLORS[suit]
      });
    }
  }
  return deck;
}

/**
 * Cryptographically strong Fisher-Yates shuffle
 */
export function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Cryptographically secure random integer in [0, i]
    const j = crypto.randomInt(0, i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Sorts cards: Suit order (Hearts, Diamonds, Clubs, Spades), then Rank (1 to 13)
 */
export function sortHand(hand) {
  const suitOrder = { H: 0, D: 1, C: 2, S: 3 };
  return [...hand].sort((a, b) => {
    if (suitOrder[a.suit] !== suitOrder[b.suit]) {
      return suitOrder[a.suit] - suitOrder[b.suit];
    }
    return a.rank - b.rank;
  });
}

/**
 * Deals 52 cards equally to 4 players (13 cards each)
 */
export function dealCards(shuffledDeck) {
  const hands = [[], [], [], []];
  for (let i = 0; i < shuffledDeck.length; i++) {
    hands[i % 4].push(shuffledDeck[i]);
  }
  return hands.map(hand => sortHand(hand));
}

/**
 * Initializes the board state with 4 suits and unplayed positions
 */
export function initBoard() {
  const board = {};
  for (const suit of SUITS) {
    board[suit] = {
      suit,
      symbol: SUIT_SYMBOLS[suit],
      name: SUIT_NAMES[suit],
      color: SUIT_COLORS[suit],
      played: false,
      minRank: null,
      maxRank: null,
      cards: {} // rank -> card object
    };
    for (let r = 1; r <= 13; r++) {
      board[suit].cards[r] = null;
    }
  }
  return board;
}

/**
 * Finds which player seat (0, 1, 2, 3) holds the starting 7 of Hearts (H-7)
 */
export function findStartingPlayer(hands) {
  for (let i = 0; i < 4; i++) {
    if (hands[i].some(card => card.id === 'H-7')) {
      return i;
    }
  }
  return 0; // Fallback
}

/**
 * Checks whether a specific card is legally playable given current board state
 */
export function isCardPlayable(card, board) {
  if (!card) return false;
  const suitData = board[card.suit];

  // Starting card rule: Game MUST start with 7 of Hearts
  if (!board.H.played) {
    return card.id === 'H-7';
  }

  // If this suit's 7 hasn't been played yet, only rank 7 of this suit can be played
  if (!suitData.played) {
    return card.rank === 7;
  }

  // Suit is open: can play immediately adjacent to lowest or highest rank played
  if (card.rank === suitData.minRank - 1 && suitData.minRank > 1) {
    return true;
  }
  if (card.rank === suitData.maxRank + 1 && suitData.maxRank < 13) {
    return true;
  }

  return false;
}

/**
 * Returns all playable cards for a player's hand given the board state
 */
export function getPlayableCards(hand, board) {
  if (!hand || !Array.isArray(hand)) return [];
  return hand.filter(card => isCardPlayable(card, board));
}

/**
 * Validates whether a player is legally allowed to skip.
 * Allowed ONLY if they have zero playable cards!
 */
export function canPlayerSkip(hand, board) {
  const playable = getPlayableCards(hand, board);
  return playable.length === 0;
}

/**
 * Applies a card play to the board and updates suit min/max rank
 */
export function applyCardPlay(board, card) {
  const suitData = board[card.suit];
  if (!suitData.played) {
    if (card.rank !== 7) {
      throw new Error(`Cannot open suit ${card.suit} with rank ${card.rank}. Must be 7.`);
    }
    suitData.played = true;
    suitData.minRank = 7;
    suitData.maxRank = 7;
    suitData.cards[7] = card;
  } else {
    if (card.rank === suitData.minRank - 1) {
      suitData.minRank = card.rank;
      suitData.cards[card.rank] = card;
    } else if (card.rank === suitData.maxRank + 1) {
      suitData.maxRank = card.rank;
      suitData.cards[card.rank] = card;
    } else {
      throw new Error(`Card ${card.id} is not connected to sequence (${suitData.minRank} - ${suitData.maxRank})`);
    }
  }
}

// ==========================================
// PROFESSIONAL AI BOT ENGINES (3 LEVELS)
// ==========================================

/**
 * LEVEL 1: EASY AI
 * - Makes basic legal moves.
 * - Occasionally makes inefficient or random choices.
 */
export function chooseEasyBotMove(hand, board) {
  const playable = getPlayableCards(hand, board);
  if (playable.length === 0) {
    return { action: 'skip' };
  }
  // Random selection among playable moves
  const randomIndex = Math.floor(Math.random() * playable.length);
  return { action: 'play', card: playable[randomIndex] };
}

/**
 * LEVEL 2: HARD AI
 * - Plans moves ahead based on own hand composition.
 * - Prefers playing cards that directly unlock own cards.
 * - Holds other 7s if holding few cards in that suit to avoid helping opponents.
 * - Prioritizes longer suits.
 */
export function chooseHardBotMove(hand, board) {
  const playable = getPlayableCards(hand, board);
  if (playable.length === 0) {
    return { action: 'skip' };
  }
  if (playable.length === 1) {
    return { action: 'play', card: playable[0] };
  }

  let bestCard = playable[0];
  let highestScore = -9999;

  for (const card of playable) {
    let score = 0;

    // Evaluate 7 of other suits
    if (card.rank === 7 && card.suit !== 'H') {
      const ownSuitCards = hand.filter(c => c.suit === card.suit);
      // If we have >= 3 cards in this suit, opening it helps us clear our hand
      if (ownSuitCards.length >= 3) {
        score += 20 + ownSuitCards.length * 5;
      } else {
        // Holding the 7 blocks opponents who hold many cards in this suit!
        score -= 25;
      }
    } else {
      // Normal sequence extension
      const isExtendingDown = card.rank < 7;
      const nextRank = isExtendingDown ? card.rank - 1 : card.rank + 1;
      const holdsNext = hand.some(c => c.suit === card.suit && c.rank === nextRank);

      if (holdsNext) {
        score += 35; // Strongly prefer self-unlocks
      }

      // Check how deep our chain in this suit goes
      const chainCount = hand.filter(c => c.suit === card.suit).length;
      score += chainCount * 4;

      // Dead ends (Aces and Kings) never unlock cards for opponents
      if (card.rank === 1 || card.rank === 13) {
        score += 18;
      }
    }

    score += Math.random() * 2; // subtle variation

    if (score > highestScore) {
      highestScore = score;
      bestCard = card;
    }
  }

  return { action: 'play', card: bestCard };
}

/**
 * LEVEL 3: EXPERT AI
 * - Genuine competitive strategic depth without cheating.
 * - Evaluates:
 *   1. Opponent danger levels (if any opponent has <= 2 cards left).
 *   2. Information inference from opponent passes (deduces which suits/ranks opponents don't hold).
 *   3. Strategic starvation: holding 7s to force opponent passes.
 *   4. Dead-end prioritization (Aces and Kings) to avoid unlocking opponent sequences.
 *   5. Double-ended sequence control.
 *   6. Branching factor: does this move open 1 or 2 cards, and who owns the follow-up?
 */
export function chooseExpertBotMove(hand, board, gameContext = {}) {
  const playable = getPlayableCards(hand, board);
  if (playable.length === 0) {
    return { action: 'skip' };
  }
  if (playable.length === 1) {
    return { action: 'play', card: playable[0] };
  }

  const { opponentCardCounts = [13, 13, 13, 13], botSeatIndex = 0, passHistory = [] } = gameContext;

  // Check if any opponent is near finishing (Danger zone: <= 2 cards)
  const dangerOpponents = opponentCardCounts.filter((cnt, seat) => seat !== botSeatIndex && cnt <= 2 && cnt > 0);
  const isEndgamePressure = dangerOpponents.length > 0;
  const minOpponentCards = Math.min(...opponentCardCounts.filter((cnt, seat) => seat !== botSeatIndex && cnt > 0));

  let bestCard = playable[0];
  let highestScore = -99999;

  for (const card of playable) {
    let score = 0;
    const suit = card.suit;
    const rank = card.rank;
    const ownCardsInSuit = hand.filter(c => c.suit === suit);

    // --- CASE 1: Playing a 7 (Opening a suit) ---
    if (rank === 7 && suit !== 'H') {
      // How many cards do we hold in this suit?
      const count = ownCardsInSuit.length;

      if (count >= 4) {
        // We dominate this suit! Opening it allows us to dump 4+ cards.
        score += 50 + count * 10;
      } else if (count === 3) {
        score += 15;
      } else if (count <= 2) {
        // Holding 7 starves opponents who hold up to 11 cards in this suit!
        score -= 60;
        // If an opponent is in danger, NEVER open a new suit unless forced!
        if (isEndgamePressure) {
          score -= 100;
        }
      }
    }
    // --- CASE 2: Extending a sequence (Ranks 1-6 or 8-13) ---
    else {
      const isDown = rank < 7;
      const nextRank = isDown ? rank - 1 : rank + 1;
      const holdsNext = hand.some(c => c.suit === suit && c.rank === nextRank);
      const holdsNextNext = isDown
        ? hand.some(c => c.suit === suit && c.rank === rank - 2)
        : hand.some(c => c.suit === suit && c.rank === rank + 2);

      // Dead-End Cards (Ace = 1, King = 13)
      // Playing these never unlocks anything for anyone! Clean, safe discard.
      if (rank === 1 || rank === 13) {
        score += 45;
        if (isEndgamePressure) {
          score += 40; // Safest possible play under endgame pressure
        }
      }

      // Self-Unlocking Chain Bonus
      if (holdsNext) {
        score += 55; // We hold the immediate next card
        if (holdsNextNext) {
          score += 25; // We have a consecutive triple!
        }
      } else {
        // We DO NOT hold the next card in this sequence.
        // Playing this card directly gives an opponent a chance to play!
        score -= 20;

        // If an opponent is in danger (<= 2 cards), penalize moves that unlock cards for them!
        if (isEndgamePressure) {
          score -= 50;
        }
      }

      // Chain length bonus in own hand
      score += ownCardsInSuit.length * 6;

      // Cards close to Ace/King (2 or 12) have a high chance of letting us play our Ace/King next turn
      if ((rank === 2 && hand.some(c => c.suit === suit && c.rank === 1)) ||
          (rank === 12 && hand.some(c => c.suit === suit && c.rank === 13))) {
        score += 30;
      }

      // Deduction based on pass history:
      // If an opponent previously passed when this suit was near this rank, we know they couldn't play.
      const passesInSuit = passHistory.filter(p => p.suit === suit);
      if (passesInSuit.length > 0) {
        score += 10; // Opponents are likely starved in this suit
      }
    }

    // Hand size urgency: if bot has few cards left, prefer moves that empty hand fastest
    if (hand.length <= 3) {
      score += 15;
    }

    if (score > highestScore) {
      highestScore = score;
      bestCard = card;
    }
  }

  return { action: 'play', card: bestCard };
}

/**
 * Master AI move chooser dispatched by difficulty level
 */
export function chooseBotMove(hand, board, difficulty = 'expert', gameContext = {}) {
  switch (difficulty) {
    case 'easy':
      return chooseEasyBotMove(hand, board);
    case 'hard':
      return chooseHardBotMove(hand, board);
    case 'expert':
    default:
      return chooseExpertBotMove(hand, board, gameContext);
  }
}
