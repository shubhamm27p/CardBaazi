import { Card, PlayerId } from '../types/game';
import { createDeck, sortCards } from './cards';

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const buffer = new Uint32Array(1);
      window.crypto.getRandomValues(buffer);
      j = buffer[0] % (i + 1);
    }
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }
  return shuffled;
}

export interface FirstDealResult {
  hands: Record<PlayerId, Card[]>;
  remainingDeck: Card[];
}

export function dealFirstFourCards(shuffledDeck?: Card[]): FirstDealResult {
  const deck = shuffledDeck || shuffleDeck(createDeck());
  if (deck.length !== 32) {
    throw new Error(`Deck must have 32 cards, got ${deck.length}`);
  }

  // 4 cards each to P1, P2, P3, P4
  const hands: Record<PlayerId, Card[]> = {
    player1: sortCards(deck.slice(0, 4)),
    player2: sortCards(deck.slice(4, 8)),
    player3: sortCards(deck.slice(8, 12)),
    player4: sortCards(deck.slice(12, 16)),
  };

  const remainingDeck = deck.slice(16); // 16 cards remain
  return { hands, remainingDeck };
}

export function dealRemainingFourCards(
  currentHands: Record<PlayerId, Card[]>,
  remainingDeck: Card[]
): Record<PlayerId, Card[]> {
  if (remainingDeck.length !== 16) {
    throw new Error(`Remaining deck must have 16 cards, got ${remainingDeck.length}`);
  }

  const updatedHands: Record<PlayerId, Card[]> = {
    player1: sortCards([...currentHands.player1, ...remainingDeck.slice(0, 4)]),
    player2: sortCards([...currentHands.player2, ...remainingDeck.slice(4, 8)]),
    player3: sortCards([...currentHands.player3, ...remainingDeck.slice(8, 12)]),
    player4: sortCards([...currentHands.player4, ...remainingDeck.slice(12, 16)]),
  };

  // Validation: each player has exactly 8 cards
  for (const pid of ['player1', 'player2', 'player3', 'player4'] as PlayerId[]) {
    if (updatedHands[pid].length !== 8) {
      throw new Error(`Player ${pid} does not have 8 cards: ${updatedHands[pid].length}`);
    }
  }

  return updatedHands;
}
