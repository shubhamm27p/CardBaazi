import { Card, Rank, Suit } from '../types/game';

export const SUITS: Suit[] = ['SPADES', 'HEARTS', 'DIAMONDS', 'CLUBS'];

export const RANKS: Rank[] = ['J', '9', 'A', '10', 'K', 'Q', '8', '7'];

// Indian 28 Card Point Values
export const RANK_POINTS: Record<Rank, number> = {
  J: 3,
  '9': 2,
  A: 1,
  '10': 1,
  K: 0,
  Q: 0,
  '8': 0,
  '7': 0,
};

// Indian 28 Card Ranking Power (higher number = beats lower number)
// J > 9 > A > 10 > K > Q > 8 > 7
export const RANK_POWER: Record<Rank, number> = {
  J: 7,
  '9': 6,
  A: 5,
  '10': 4,
  K: 3,
  Q: 2,
  '8': 1,
  '7': 0,
};

export function getCardPoints(rank: Rank): number {
  return RANK_POINTS[rank];
}

export function getRankPower(rank: Rank): number {
  return RANK_POWER[rank];
}

export function getSuitSymbol(suit: Suit): string {
  switch (suit) {
    case 'SPADES':
      return '♠';
    case 'HEARTS':
      return '♥';
    case 'DIAMONDS':
      return '♦';
    case 'CLUBS':
      return '♣';
  }
}

export function getSuitColor(suit: Suit): 'red' | 'black' {
  return suit === 'HEARTS' || suit === 'DIAMONDS' ? 'red' : 'black';
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `${suit}_${rank}`,
        suit,
        rank,
        points: RANK_POINTS[rank],
        rankPower: RANK_POWER[rank],
      });
    }
  }

  // Verification: EXACTLY 32 cards, EXACTLY 28 total points
  if (deck.length !== 32) {
    throw new Error(`Deck has invalid count: ${deck.length} (expected 32)`);
  }
  const totalPoints = deck.reduce((acc, c) => acc + c.points, 0);
  if (totalPoints !== 28) {
    throw new Error(`Deck total points mismatch: ${totalPoints} (expected 28)`);
  }

  return deck;
}

// Order suits nicely for hand sorting: Spades, Hearts, Clubs, Diamonds
const SUIT_SORT_ORDER: Record<Suit, number> = {
  SPADES: 0,
  HEARTS: 1,
  CLUBS: 2,
  DIAMONDS: 3,
};

export function sortCards(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    if (a.suit !== b.suit) {
      return SUIT_SORT_ORDER[a.suit] - SUIT_SORT_ORDER[b.suit];
    }
    // In same suit, sort by rank power descending (J > 9 > A > 10 > K > Q > 8 > 7)
    return b.rankPower - a.rankPower;
  });
}
