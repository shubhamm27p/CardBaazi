import { Card, PlayedCard, PlayerId, Suit, Trick } from '../types/game';
import { SecretHukum } from './trump';

export interface CardValidityResult {
  isValid: boolean;
  reason?: string;
}

/**
 * Checks if a specific card can be legally played by the player given the trick state.
 */
export function isCardPlayable(
  card: Card,
  playerHand: Card[],
  currentTrickCards: PlayedCard[],
  hukum: SecretHukum,
  revealedHukumThisTurn: boolean
): CardValidityResult {
  // Card must exist in player hand
  if (!playerHand.some((c) => c.id === card.id)) {
    return { isValid: false, reason: 'Card not in hand' };
  }

  // 1. Leading the trick (first card)
  if (currentTrickCards.length === 0) {
    // The declarer (or any player leading) can freely lead ANY card, including the secret Hukum suit
    return { isValid: true };
  }

  // 2. Following a led suit
  const ledSuit = currentTrickCards[0].card.suit;
  const hasLedSuit = playerHand.some((c) => c.suit === ledSuit);

  if (hasLedSuit) {
    if (card.suit === ledSuit) {
      return { isValid: true };
    }
    return {
      isValid: false,
      reason: `Must follow suit (${ledSuit})`,
    };
  }

  // 3. Player does NOT have the led suit
  // If player just revealed Hukum in this exact turn:
  if (revealedHukumThisTurn) {
    const hasTrump = playerHand.some((c) => c.suit === hukum.suit);
    if (hasTrump) {
      if (card.suit === hukum.suit) {
        return { isValid: true };
      }
      return {
        isValid: false,
        reason: `Must play revealed Hukum suit (${hukum.suit})`,
      };
    }
  }

  // Otherwise, can play any card from hand (slough / discard or trump if already revealed)
  return { isValid: true };
}

/**
 * Get all playable cards for a player in the current state.
 */
export function getPlayableCards(
  playerHand: Card[],
  currentTrickCards: PlayedCard[],
  hukum: SecretHukum,
  revealedHukumThisTurn = false
): Card[] {
  return playerHand.filter(
    (card) =>
      isCardPlayable(card, playerHand, currentTrickCards, hukum, revealedHukumThisTurn).isValid
  );
}

/**
 * Determines the winner of a 4-card trick.
 */
export function determineTrickWinner(
  trick: Trick,
  hukum: SecretHukum
): { winnerPlayerId: PlayerId; winningCard: Card } {
  if (trick.cards.length !== 4) {
    throw new Error(`Cannot determine winner of incomplete trick (${trick.cards.length} cards)`);
  }

  const ledSuit = trick.cards[0].card.suit;

  // Find index of the reveal in this trick, if any
  let revealCardIndex = -1;
  if (
    trick.hukumRevealedInThisTrick &&
    trick.hukumRevealedInThisTrick.byPlayerId
  ) {
    revealCardIndex = trick.cards.findIndex(
      (pc) => pc.playerId === trick.hukumRevealedInThisTrick?.byPlayerId
    );
  }

  // Identify eligible trumps
  // A card counts as Trump IF:
  // - Hukum was revealed BEFORE this trick started, OR
  // - Hukum was revealed IN this trick, and this card was played at or after the reveal index, OR
  // - The card of the Hukum suit was thrown by the Declarer (who decided Hukum)!
  const trumpPlays: PlayedCard[] = [];

  trick.cards.forEach((played, index) => {
    if (played.card.suit === hukum.suit) {
      if (trick.hukumWasRevealedBeforeThisTrick) {
        trumpPlays.push(played);
      } else if (revealCardIndex !== -1 && index >= revealCardIndex) {
        trumpPlays.push(played);
      } else if (played.playerId === hukum.chosenBy) {
        // The Declarer who decided Hukum threw a Hukum card! It counts as Trump!
        trumpPlays.push(played);
      }
    }
  });

  // If any eligible trumps were played, highest trump wins
  if (trumpPlays.length > 0) {
    let highestTrump = trumpPlays[0];
    for (let i = 1; i < trumpPlays.length; i++) {
      if (trumpPlays[i].card.rankPower > highestTrump.card.rankPower) {
        highestTrump = trumpPlays[i];
      }
    }
    return {
      winnerPlayerId: highestTrump.playerId,
      winningCard: highestTrump.card,
    };
  }

  // Otherwise, highest card of the led suit wins
  const ledSuitCards = trick.cards.filter((pc) => pc.card.suit === ledSuit);
  let highestLed = ledSuitCards[0];
  for (let i = 1; i < ledSuitCards.length; i++) {
    if (ledSuitCards[i].card.rankPower > highestLed.card.rankPower) {
      highestLed = ledSuitCards[i];
    }
  }

  return {
    winnerPlayerId: highestLed.playerId,
    winningCard: highestLed.card,
  };
}

/**
 * Calculates total points in a trick
 */
export function calculateTrickPoints(cards: PlayedCard[]): number {
  return cards.reduce((sum, pc) => sum + pc.card.points, 0);
}
