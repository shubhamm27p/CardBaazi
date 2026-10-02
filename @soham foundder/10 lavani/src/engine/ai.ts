import type {
  Card,
  PlayerId,
  Suit,
  AIDifficulty,
  Trick,
} from '../types/game';
import {
  evaluateTrickLeader,
  getPartnerId,
  getPlayableCards,
} from './rules';

export interface AIContext {
  playerId: PlayerId;
  hand: Card[];
  leadSuit?: Suit;
  trumpSuit: Suit | null;
  currentTrick: Trick;
  trickHistory: Trick[];
  difficulty: AIDifficulty;
}

/**
 * AI Partner evaluates its cards after exchange to choose Hukum (Trump).
 * Prefers suits with strong cards (A, K, Q, J), Dehla cards (10s), and suit length.
 */
export function choosePartnerHukum(partnerHand: Card[]): Suit {
  const suits: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
  const scores: Record<Suit, number> = {
    spades: 0,
    hearts: 0,
    diamonds: 0,
    clubs: 0,
  };

  for (const card of partnerHand) {
    scores[card.suit] += card.value;
    scores[card.suit] += 12; // suit length bonus

    if (card.rank === 'A') {
      scores[card.suit] += 15;
    } else if (card.rank === 'K') {
      scores[card.suit] += 9;
    } else if (card.rank === 'Q') {
      scores[card.suit] += 5;
    } else if (card.rank === 'J') {
      scores[card.suit] += 3;
    }

    if (card.isDehla) {
      scores[card.suit] += 16; // Dehlas are highest priority
    }
  }

  let bestSuit: Suit = 'spades';
  let highestScore = -1;

  for (const suit of suits) {
    if (scores[suit] > highestScore) {
      highestScore = scores[suit];
      bestSuit = suit;
    }
  }

  return bestSuit;
}

/**
 * Partner Priya intelligently evaluates her 4 cards to select replacement cards to return to human.
 * Prioritizes keeping her strongest suit for her upcoming Hukum call, protects Dehlas,
 * and passes back strong side-suit cards (or non-hukum cards) to empower the human player.
 */
export function partnerSelectCardsToReturn(partnerHand: Card[], count: number): Card[] {
  if (count <= 0) return [];
  if (count >= partnerHand.length) return [...partnerHand];

  // 1. Identify Priya's intended Hukum suit
  const intendedHukum = choosePartnerHukum(partnerHand);

  // 2. Partition into non-Hukum non-Dehla cards
  const nonHukumNonDehla = partnerHand.filter(
    (c) => c.suit !== intendedHukum && !c.isDehla
  );

  // Sort non-hukum cards by value descending so human gets empowered with side strength
  nonHukumNonDehla.sort((a, b) => b.value - a.value);

  const selectedToReturn: Card[] = [];

  for (const card of nonHukumNonDehla) {
    if (selectedToReturn.length < count) {
      selectedToReturn.push(card);
    }
  }

  // If still need more cards, take other non-Hukum cards
  if (selectedToReturn.length < count) {
    const sideDehlas = partnerHand.filter(
      (c) => c.suit !== intendedHukum && c.isDehla && !selectedToReturn.some((r) => r.id === c.id)
    );
    for (const card of sideDehlas) {
      if (selectedToReturn.length < count) {
        selectedToReturn.push(card);
      }
    }
  }

  // If STILL need more cards (e.g. all cards were in intendedHukum suit), take lowest value Hukum cards
  if (selectedToReturn.length < count) {
    const hukumCards = partnerHand
      .filter((c) => !selectedToReturn.some((r) => r.id === c.id))
      .sort((a, b) => a.value - b.value);

    for (const card of hukumCards) {
      if (selectedToReturn.length < count) {
        selectedToReturn.push(card);
      }
    }
  }

  return selectedToReturn;
}

/**
 * Main AI decision entry point. Always returns a strictly legal card.
 */
export function chooseAICard(context: AIContext): Card {
  const { hand, leadSuit, difficulty } = context;
  const playableCards = getPlayableCards(hand, leadSuit);

  if (playableCards.length === 0) {
    throw new Error('AI has no playable cards');
  }

  if (playableCards.length === 1) {
    return playableCards[0];
  }

  switch (difficulty) {
    case 'easy':
      return chooseEasyCard(playableCards, context);
    case 'medium':
      return chooseMediumCard(playableCards, context);
    case 'hard':
      return chooseHardCard(playableCards, context);
  }
}

/**
 * EASY AI:
 * Mostly random with slight bias toward higher cards when leading.
 */
function chooseEasyCard(playable: Card[], context: AIContext): Card {
  const { currentTrick } = context;

  // 40% purely random
  if (Math.random() < 0.4) {
    const randomIndex = Math.floor(Math.random() * playable.length);
    return playable[randomIndex];
  }

  // If leading
  if (currentTrick.cards.length === 0) {
    // Sort descending value, pick top half
    const sorted = [...playable].sort((a, b) => b.value - a.value);
    const pickIndex = Math.floor(Math.random() * Math.min(2, sorted.length));
    return sorted[pickIndex];
  }

  // If following, pick lowest legal card to avoid blunders
  const sorted = [...playable].sort((a, b) => a.value - b.value);
  return sorted[0];
}

/**
 * MEDIUM AI:
 * Follows suit, protects 10s, feeds 10s to winning partner, trumps opponent's 10s.
 */
function chooseMediumCard(playable: Card[], context: AIContext): Card {
  const { playerId, trumpSuit, leadSuit, currentTrick } = context;
  const partnerId = getPartnerId(playerId);

  // 1. LEADING A TRICK
  if (currentTrick.cards.length === 0) {
    // Check if we hold an Ace of any suit
    const aces = playable.filter((c) => c.rank === 'A');
    if (aces.length > 0) {
      // Prefer non-trump Ace if possible to save trump
      const nonTrumpAces = aces.filter((c) => c.suit !== trumpSuit);
      if (nonTrumpAces.length > 0) {
        return nonTrumpAces[0];
      }
      return aces[0];
    }

    // Never lead an unprotected 10!
    const nonDehlas = playable.filter((c) => !c.isDehla);
    if (nonDehlas.length > 0) {
      // Lead a low card (7 or 8)
      const sortedLow = [...nonDehlas].sort((a, b) => a.value - b.value);
      return sortedLow[0];
    }

    return playable[0];
  }

  // 2. FOLLOWING A TRICK
  const currentLeader = evaluateTrickLeader(
    currentTrick.cards,
    trumpSuit,
    leadSuit
  );

  const isPartnerWinning =
    currentLeader && currentLeader.playerId === partnerId;
  const trickHasDehla = currentTrick.cards.some((p) => p.card.isDehla);
  const isLastPlayer = currentTrick.cards.length === 3;

  // Case A: PARTNER IS WINNING
  if (isPartnerWinning) {
    // If partner is winning safely (e.g. partner played Ace, or AI is last player)
    const partnerCard = currentLeader.card;
    const isPartnerSafe =
      isLastPlayer ||
      partnerCard.rank === 'A' ||
      (partnerCard.suit === trumpSuit && partnerCard.value >= 12);

    if (isPartnerSafe) {
      // If we have a 10 in our playable cards, FEED IT to partner!
      const dehlas = playable.filter((c) => c.isDehla);
      if (dehlas.length > 0) {
        return dehlas[0];
      }
    }

    // Otherwise discard lowest card so we don't overtake partner
    const sortedLow = [...playable].sort((a, b) => a.value - b.value);
    // Prefer non-10 low card
    const lowNonDehla = sortedLow.find((c) => !c.isDehla);
    return lowNonDehla || sortedLow[0];
  }

  // Case B: OPPONENT IS WINNING
  // Find which playable cards can beat the current leader
  const winningPlays = playable.filter((card) => {
    const simulated = [
      ...currentTrick.cards,
      { playerId, card, timestamp: Date.now() },
    ];
    const newLeader = evaluateTrickLeader(simulated, trumpSuit, leadSuit);
    return newLeader && newLeader.playerId === playerId;
  });

  if (winningPlays.length > 0) {
    // If trick has a Dehla OR opponent played a high card (J/Q/K/A) OR we are last player
    const opponentHigh = currentLeader && currentLeader.card.value >= 11;
    if (trickHasDehla || opponentHigh || isLastPlayer) {
      // Win with the LOWEST winning card
      winningPlays.sort((a, b) => a.value - b.value);
      return winningPlays[0];
    }
  }

  // Cannot win, or not worth winning:
  // Strictly protect our Dehlas! NEVER dump a 10 to an opponent's trick
  const nonDehlas = playable.filter((c) => !c.isDehla);
  if (nonDehlas.length > 0) {
    // Discard lowest non-Dehla
    nonDehlas.sort((a, b) => a.value - b.value);
    return nonDehlas[0];
  }

  // If forced to play a Dehla
  return playable[0];
}

/**
 * HARD AI:
 * Tracks played cards, counts trumps & remaining 10s, finesses opponents,
 * cooperates with partner, maximizes Dehla capture.
 */
function chooseHardCard(playable: Card[], context: AIContext): Card {
  const { playerId, trumpSuit, leadSuit, currentTrick, trickHistory } = context;
  const partnerId = getPartnerId(playerId);

  // Collect all cards seen so far
  const allSeenCards = new Set<string>();
  for (const trick of trickHistory) {
    for (const p of trick.cards) {
      allSeenCards.add(p.card.id);
    }
  }
  for (const p of currentTrick.cards) {
    allSeenCards.add(p.card.id);
  }

  // Helper: check if a card is currently the highest remaining of its suit
  const isHighestRemaining = (card: Card): boolean => {
    for (let v = card.value + 1; v <= 14; v++) {
      const higherId = `${card.suit}-${v === 14 ? 'A' : v === 13 ? 'K' : v === 12 ? 'Q' : v === 11 ? 'J' : v.toString()}`;
      if (!allSeenCards.has(higherId) && !context.hand.some((c) => c.id === higherId)) {
        return false;
      }
    }
    return true;
  };

  // 1. LEADING TRICK
  if (currentTrick.cards.length === 0) {
    const masterCards = playable.filter((c) => isHighestRemaining(c));

    const nonTrumpMasters = masterCards.filter((c) => c.suit !== trumpSuit);
    if (nonTrumpMasters.length > 0) {
      return nonTrumpMasters[0];
    }

    const trumpMasters = masterCards.filter((c) => c.suit === trumpSuit);
    if (trumpMasters.length > 0) {
      return trumpMasters[0];
    }

    const safeCards = playable.filter((c) => !c.isDehla);
    if (safeCards.length > 0) {
      const suitCounts = safeCards.reduce(
        (acc, c) => {
          acc[c.suit] = (acc[c.suit] || 0) + 1;
          return acc;
        },
        {} as Record<Suit, number>
      );

      safeCards.sort((a, b) => {
        const countDiff = (suitCounts[b.suit] || 0) - (suitCounts[a.suit] || 0);
        if (countDiff !== 0) return countDiff;
        return a.value - b.value;
      });

      return safeCards[0];
    }

    return playable[0];
  }

  // 2. FOLLOWING TRICK
  const currentLeader = evaluateTrickLeader(
    currentTrick.cards,
    trumpSuit,
    leadSuit
  );
  const isPartnerWinning =
    currentLeader && currentLeader.playerId === partnerId;
  const isLastPlayer = currentTrick.cards.length === 3;
  const trickHasDehla = currentTrick.cards.some((p) => p.card.isDehla);

  // A. Partner is currently winning
  if (isPartnerWinning) {
    const leaderCard = currentLeader.card;
    const partnerGuaranteed =
      isLastPlayer ||
      isHighestRemaining(leaderCard) ||
      (leaderCard.suit === trumpSuit && leaderCard.value >= 13);

    if (partnerGuaranteed) {
      const dehlas = playable.filter((c) => c.isDehla);
      if (dehlas.length > 0) {
        return dehlas[0];
      }
    }

    const nonDehlas = playable.filter((c) => !c.isDehla);
    if (nonDehlas.length > 0) {
      nonDehlas.sort((a, b) => a.value - b.value);
      return nonDehlas[0];
    }

    return playable[0];
  }

  // B. Opponent is currently winning
  const winningCards = playable.filter((card) => {
    const simulated = [
      ...currentTrick.cards,
      { playerId, card, timestamp: Date.now() },
    ];
    const newLeader = evaluateTrickLeader(simulated, trumpSuit, leadSuit);
    return newLeader && newLeader.playerId === playerId;
  });

  if (winningCards.length > 0) {
    winningCards.sort((a, b) => {
      if (a.suit === leadSuit && b.suit === trumpSuit) return -1;
      if (a.suit === trumpSuit && b.suit === leadSuit) return 1;
      return a.value - b.value;
    });

    if (trickHasDehla || isLastPlayer || currentLeader!.card.value >= 10) {
      return winningCards[0];
    }

    const masterWins = winningCards.filter((c) => isHighestRemaining(c));
    if (masterWins.length > 0) {
      return masterWins[0];
    }
  }

  const nonDehlas = playable.filter((c) => !c.isDehla);
  if (nonDehlas.length > 0) {
    const nonTrumps = nonDehlas.filter((c) => c.suit !== trumpSuit);
    if (nonTrumps.length > 0) {
      nonTrumps.sort((a, b) => a.value - b.value);
      return nonTrumps[0];
    }

    nonDehlas.sort((a, b) => a.value - b.value);
    return nonDehlas[0];
  }

  return playable[0];
}
