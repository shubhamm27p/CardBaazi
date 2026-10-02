import { Card, PlayerId, Suit } from '../types/game';

export interface SecretHukum {
  suit: Suit;
  card: Card;
  chosenBy: PlayerId;
  isRevealed: boolean;
  revealedBy?: PlayerId;
  revealedInTrick?: number;
}

export function createSecretHukum(
  suit: Suit,
  card: Card,
  chosenBy: PlayerId
): SecretHukum {
  return {
    suit,
    card,
    chosenBy,
    isRevealed: false,
  };
}

export function revealHukum(
  hukum: SecretHukum,
  revealedBy: PlayerId,
  trickNumber: number
): SecretHukum {
  return {
    ...hukum,
    isRevealed: true,
    revealedBy,
    revealedInTrick: trickNumber,
  };
}
