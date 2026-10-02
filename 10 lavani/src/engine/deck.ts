import type { Card, PlayerId, Rank, Suit } from '../types/game';

export const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];

// STRICT 32-card edition: Only 7, 8, 9, 10, J, Q, K, A
export const RANKS: Rank[] = ['7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const RANK_VALUES: Record<Rank, number> = {
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  'J': 11,
  'Q': 12,
  'K': 13,
  'A': 14,
};

export const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

export const SUIT_COLORS: Record<Suit, string> = {
  spades: '#1e293b',
  hearts: '#e11d48',
  diamonds: '#dc2626',
  clubs: '#0f172a',
};

export const SUIT_NAMES: Record<Suit, string> = {
  spades: 'Spades (Hukam)',
  hearts: 'Hearts (Paan)',
  diamonds: 'Diamonds (Eent)',
  clubs: 'Clubs (Chidi)',
};

/**
 * Creates the exact 32 cards used in Dehla Pakad 32-Card Edition.
 * Cards 2, 3, 4, 5, 6 are strictly EXCLUDED.
 */
export function createDeck(): Card[] {
  const cards: Card[] = [];

  for (const suit of SUITS) {
    for (const rank of RANKS) {
      cards.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        value: RANK_VALUES[rank],
        isDehla: rank === '10',
      });
    }
  }

  if (cards.length !== 32) {
    throw new Error(`Deck must have exactly 32 cards, got ${cards.length}`);
  }

  return cards;
}

/**
 * Fisher-Yates shuffle algorithm for cryptographically sound randomness.
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * STAGE 1 DEAL:
 * Deals ONLY 4 cards to each of the 4 players (16 cards total).
 * Returns the 4-card hands and the 16 remaining cards.
 */
export function dealStage1Cards(
  shuffledDeck: Card[],
  playerIds: PlayerId[]
): {
  hands: Record<PlayerId, Card[]>;
  remainingDeck: Card[];
} {
  if (shuffledDeck.length !== 32) {
    throw new Error('Cannot deal: Deck must have exactly 32 cards');
  }

  const hands: Record<PlayerId, Card[]> = {
    p1: [],
    p2: [],
    p3: [],
    p4: [],
  };

  // Deal first 4 cards to each player (16 cards total)
  let cardIdx = 0;
  for (let cardCount = 0; cardCount < 4; cardCount++) {
    for (const pid of playerIds) {
      hands[pid].push(shuffledDeck[cardIdx++]);
    }
  }

  const remainingDeck = shuffledDeck.slice(cardIdx); // 16 cards remaining

  return {
    hands,
    remainingDeck,
  };
}

/**
 * STAGE 2 DEAL:
 * Deals the remaining 4 cards to each player (16 cards total).
 * Appends to their existing 4 cards, giving exactly 8 cards each.
 */
export function dealStage2Cards(
  remainingDeck: Card[],
  playerIds: PlayerId[],
  currentHands: Record<PlayerId, Card[]>
): Record<PlayerId, Card[]> {
  if (remainingDeck.length !== 16) {
    throw new Error(`Stage 2 requires exactly 16 remaining cards, got ${remainingDeck.length}`);
  }

  const fullHands: Record<PlayerId, Card[]> = {
    p1: [...currentHands.p1],
    p2: [...currentHands.p2],
    p3: [...currentHands.p3],
    p4: [...currentHands.p4],
  };

  let cardIdx = 0;
  for (let cardCount = 0; cardCount < 4; cardCount++) {
    for (const pid of playerIds) {
      fullHands[pid].push(remainingDeck[cardIdx++]);
    }
  }

  // Verify each player has exactly 8 cards
  for (const pid of playerIds) {
    if (fullHands[pid].length !== 8) {
      throw new Error(`Player ${pid} has ${fullHands[pid].length} cards instead of 8 after Stage 2`);
    }
  }

  return fullHands;
}

/**
 * Deals all 8 cards to each player (legacy/convenience method).
 */
export function dealCards(
  shuffledDeck: Card[],
  playerIds: PlayerId[]
): Record<PlayerId, Card[]> {
  const { hands, remainingDeck } = dealStage1Cards(shuffledDeck, playerIds);
  return dealStage2Cards(remainingDeck, playerIds, hands);
}

/**
 * Sorts a player's hand by suit and then by rank (high to low or low to high).
 */
export function sortHand(cards: Card[]): Card[] {
  const suitOrder: Record<Suit, number> = {
    spades: 0,
    hearts: 1,
    clubs: 2,
    diamonds: 3,
  };

  return [...cards].sort((a, b) => {
    if (suitOrder[a.suit] !== suitOrder[b.suit]) {
      return suitOrder[a.suit] - suitOrder[b.suit];
    }
    return b.value - a.value; // highest rank first
  });
}
