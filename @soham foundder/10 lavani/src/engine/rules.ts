import type { Card, PlayedCard, PlayerId, Suit } from '../types/game';

/**
 * Returns whether a specific card is legal to play given the hand, lead suit, and trump suit.
 */
export function isCardPlayable(
  card: Card,
  hand: Card[],
  leadSuit?: Suit
): boolean {
  // If no suit led yet, any card in hand can be led
  if (!leadSuit) {
    return true;
  }

  // Check if player has any card of the led suit
  const hasLeadSuit = hand.some((c) => c.suit === leadSuit);

  if (hasLeadSuit) {
    // Player MUST follow the led suit
    return card.suit === leadSuit;
  }

  // If player does NOT have the led suit, they can play any card (including trump or discard)
  return true;
}

/**
 * Returns the list of all playable cards from hand.
 */
export function getPlayableCards(hand: Card[], leadSuit?: Suit): Card[] {
  if (!leadSuit) {
    return [...hand];
  }

  const matchingCards = hand.filter((c) => c.suit === leadSuit);
  if (matchingCards.length > 0) {
    return matchingCards;
  }

  // Out of led suit, everything is legal
  return [...hand];
}

/**
 * Evaluates the winner of a completed trick (or the current leader during a trick).
 */
export function evaluateTrickLeader(
  playedCards: PlayedCard[],
  trumpSuit: Suit | null,
  leadSuit?: Suit
): PlayedCard | null {
  if (playedCards.length === 0) return null;

  const actualLeadSuit = leadSuit || playedCards[0].card.suit;

  // Filter trumps if trump suit is defined
  const trumpPlays = trumpSuit
    ? playedCards.filter((p) => p.card.suit === trumpSuit)
    : [];

  if (trumpPlays.length > 0) {
    // Highest trump wins
    let highest = trumpPlays[0];
    for (let i = 1; i < trumpPlays.length; i++) {
      if (trumpPlays[i].card.value > highest.card.value) {
        highest = trumpPlays[i];
      }
    }
    return highest;
  }

  // No trump played: highest card of the led suit wins
  const leadSuitPlays = playedCards.filter((p) => p.card.suit === actualLeadSuit);
  if (leadSuitPlays.length > 0) {
    let highest = leadSuitPlays[0];
    for (let i = 1; i < leadSuitPlays.length; i++) {
      if (leadSuitPlays[i].card.value > highest.card.value) {
        highest = leadSuitPlays[i];
      }
    }
    return highest;
  }

  return playedCards[0];
}

/**
 * Evaluates the full trick once all 4 players have played.
 */
export function evaluateTrickWinner(
  playedCards: PlayedCard[],
  trumpSuit: Suit | null,
  leadSuit?: Suit
): {
  winnerPlayerId: PlayerId;
  winningCard: Card;
  capturedDehlas: Card[];
} {
  if (playedCards.length !== 4) {
    throw new Error(`Expected 4 played cards to evaluate trick winner, got ${playedCards.length}`);
  }

  const leader = evaluateTrickLeader(playedCards, trumpSuit, leadSuit);
  if (!leader) {
    throw new Error('Could not evaluate trick leader');
  }

  // Collect all Dehlas (10s) from this trick
  const capturedDehlas = playedCards
    .map((p) => p.card)
    .filter((c) => c.isDehla);

  return {
    winnerPlayerId: leader.playerId,
    winningCard: leader.card,
    capturedDehlas,
  };
}

/**
 * Helper to identify partner of a player in 4-player game.
 * p1 (Human) <-> p3 (Partner) = Team A
 * p2 (AI) <-> p4 (AI) = Team B
 */
export function getPartnerId(playerId: PlayerId): PlayerId {
  switch (playerId) {
    case 'p1':
      return 'p3';
    case 'p3':
      return 'p1';
    case 'p2':
      return 'p4';
    case 'p4':
      return 'p2';
  }
}

/**
 * Helper to get the team of a player.
 */
export function getPlayerTeam(playerId: PlayerId): 'teamA' | 'teamB' {
  return playerId === 'p1' || playerId === 'p3' ? 'teamA' : 'teamB';
}
