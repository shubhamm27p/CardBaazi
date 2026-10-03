import type { AiExplanationData, Card, PlayedCard, PlayerId, Suit, Trick } from '../types/game';
import { BiddingState, canBid, canPass, getPlayerPartner, getPlayerTeam } from './bidding';
import { getSuitSymbol, SUITS } from './cards';
import { getPlayableCards } from './tricks';
import { SecretHukum } from './trump';

export type HandStrengthLevel = 'WEAK' | 'MEDIUM' | 'STRONG';

export interface HandEvaluation {
  level: HandStrengthLevel;
  maxBid: number;
  points: number;
  jacks: number;
  nines: number;
  aces: number;
  tens: number;
  bestSuit: Suit;
  bestSuitCount: number;
  adviceMessage: string;
}

/**
 * Evaluates hand strength according to authentic 28 card bidding rules:
 * J = FIRST PRIORITY (3 pts, rank 7 - very strong)
 * 9 = SECOND PRIORITY (2 pts, rank 6 - strong)
 * A = THIRD PRIORITY (1 pt, rank 5 - strong)
 * 10 = FOURTH PRIORITY (1 pt, rank 4 - medium)
 * K, Q, 8, 7 = NON-POINT CARDS (0 pts, rank 0-3 - low)
 */
export function evaluateHandStrength(hand: Card[]): HandEvaluation {
  const suitCounts: Record<Suit, number> = { SPADES: 0, HEARTS: 0, DIAMONDS: 0, CLUBS: 0 };
  const suitPoints: Record<Suit, number> = { SPADES: 0, HEARTS: 0, DIAMONDS: 0, CLUBS: 0 };

  let points = 0;
  let jacks = 0;
  let nines = 0;
  let aces = 0;
  let tens = 0;

  for (const card of hand) {
    suitCounts[card.suit]++;
    suitPoints[card.suit] += card.points;
    points += card.points;

    if (card.rank === 'J') jacks++;
    else if (card.rank === '9') nines++;
    else if (card.rank === 'A') aces++;
    else if (card.rank === '10') tens++;
  }

  // Find strongest suit (highest priority to Jacks and Nines)
  let bestSuit: Suit = 'SPADES';
  let bestSuitCount = 0;
  let bestSuitScore = -1;

  for (const s of ['SPADES', 'HEARTS', 'DIAMONDS', 'CLUBS'] as Suit[]) {
    const hasJack = hand.some((c) => c.suit === s && c.rank === 'J');
    const hasNine = hand.some((c) => c.suit === s && c.rank === '9');
    const score = suitCounts[s] * 2.5 + suitPoints[s] * 2.5 + (hasJack ? 6 : 0) + (hasNine ? 4 : 0);

    if (score > bestSuitScore) {
      bestSuitScore = score;
      bestSuit = s;
      bestSuitCount = suitCounts[s];
    }
  }

  // High card power calculation:
  // J (1st priority = +6.0 power)
  // 9 (2nd priority = +4.0 power)
  // A (3rd priority = +2.2 power)
  // 10 (4th priority = +1.2 power)
  const highCardScore = jacks * 6.0 + nines * 4.0 + aces * 2.2 + tens * 1.2;

  // Synergy bonus: J and 9 in same suit
  const hasJackAndNineInSameSuit = ['SPADES', 'HEARTS', 'DIAMONDS', 'CLUBS'].some((s) => {
    const hasJ = hand.some((c) => c.suit === s && c.rank === 'J');
    const has9 = hand.some((c) => c.suit === s && c.rank === '9');
    return hasJ && has9;
  });

  const synergyBonus = hasJackAndNineInSameSuit ? 3.0 : 0;
  const suitLengthBonus = bestSuitCount >= 3 ? 2.5 : bestSuitCount === 2 ? 1.0 : 0;

  const totalScore = highCardScore + synergyBonus + suitLengthBonus;

  let level: HandStrengthLevel = 'WEAK';
  let maxBid = 0;
  let adviceMessage = 'Your hand is weak — consider passing.';

  if (hand.length === 4) {
    if (jacks === 0 && nines === 0 && points <= 2) {
      level = 'WEAK';
      maxBid = 0;
      adviceMessage = 'Your hand is weak — consider passing.';
    } else if (totalScore < 6.5 || (jacks === 0 && points < 4)) {
      level = 'WEAK';
      maxBid = 0;
      adviceMessage = 'Your hand is weak — consider passing.';
    } else if (totalScore < 11.5) {
      level = 'MEDIUM';
      maxBid = 18;
      if (totalScore >= 9.5) maxBid = 19;
      adviceMessage = 'Your hand is moderate — reasonable for 18 bid or pass.';
    } else {
      level = 'STRONG';
      if (totalScore >= 18) maxBid = 22;
      else if (totalScore >= 13) maxBid = 21;
      else maxBid = 20;
      adviceMessage = 'Your hand is strong — good for bidding!';
    }
  } else {
    if (points <= 4 && jacks === 0) {
      level = 'WEAK';
      maxBid = 0;
      adviceMessage = 'Hand is weak.';
    } else if (totalScore < 16.0) {
      level = 'MEDIUM';
      maxBid = 18;
      adviceMessage = 'Hand is moderate.';
    } else {
      level = 'STRONG';
      maxBid = Math.min(28, Math.floor(18 + (totalScore - 15) * 0.8));
      adviceMessage = 'Hand is strong.';
    }
  }

  return {
    level,
    maxBid,
    points,
    jacks,
    nines,
    aces,
    tens,
    bestSuit,
    bestSuitCount,
    adviceMessage,
  };
}

/**
 * AI chooses whether to bid or pass based on actual hand strength
 */
export function getAiBidDecision(
  biddingState: BiddingState,
  aiPlayerId: PlayerId,
  hand: Card[]
): { action: 'BID' | 'PASS' | 'HOLD'; amount?: number } {
  const evaluation = evaluateHandStrength(hand);
  const currentBid = biddingState.currentBid;
  const partner = getPlayerPartner(aiPlayerId);

  // 1. Responding to a Hold / "I Do" Challenge
  // e.g. Opponent bid 17 against AI's 16
  if (biddingState.holdCandidate && biddingState.turn === aiPlayerId) {
    const challengeAmount = biddingState.holdCandidate.amount;
    // If AI's hand capacity supports this amount, say "I Do" (Hold)!
    if (evaluation.maxBid >= challengeAmount) {
      return { action: 'HOLD', amount: challengeAmount };
    }
    // Otherwise pass the challenge
    return { action: 'PASS' };
  }

  // 2. Weak hand: always PASS
  if (evaluation.level === 'WEAK') {
    return { action: 'PASS' };
  }

  // 3. Do not bid against partner unless monster hand
  if (biddingState.highestBidder === partner) {
    if (evaluation.level === 'STRONG' && evaluation.maxBid >= currentBid + 3 && currentBid < 19) {
      const nextBid = currentBid + 1;
      if (canBid(biddingState, aiPlayerId, nextBid)) {
        return { action: 'BID', amount: nextBid };
      }
    }
    return { action: 'PASS' };
  }

  // 4. Opening bid (starts at 16)
  if (currentBid === 0) {
    if (evaluation.level === 'STRONG') {
      return { action: 'BID', amount: Math.min(18, evaluation.maxBid) };
    }
    if (evaluation.level === 'MEDIUM') {
      return { action: 'BID', amount: 18 }; // Medium minimum starting level is 18
    }
    return { action: 'PASS' };
  }

  // 5. Overbidding / Raising
  const nextMinBid = currentBid + 1;
  
  // If human or other player bids 16, AI minimum response is 17 if hand supports it
  // We only bid if the nextMinBid is within our safe calculated capacity.
  if (nextMinBid > evaluation.maxBid || nextMinBid > 28) {
    return { action: 'PASS' };
  }

  // We have a safe bid. We should incrementally bid rather than jump.
  // Evaluate if the bid is justifiable. 
  if (evaluation.level === 'MEDIUM' && nextMinBid > 18 && nextMinBid !== 19) {
     // Medium hands usually pass on 20+ unless maxBid is high enough
     if (nextMinBid >= 20 && evaluation.maxBid < nextMinBid) {
         return { action: 'PASS' };
     }
  }

  if (canBid(biddingState, aiPlayerId, nextMinBid)) {
    return { action: 'BID', amount: nextMinBid };
  }

  return { action: 'PASS' };
}

/**
 * AI chooses secret Hukum suit and card from its 4 cards
 * Highest priority given to suits holding Jacks and Nines!
 */
export function chooseAiHukum(
  aiPlayerId: PlayerId,
  hand: Card[]
): { suit: Suit; card: Card } {
  const { bestSuit } = evaluateHandStrength(hand);

  const cardsOfBestSuit = hand.filter((c) => c.suit === bestSuit);
  if (cardsOfBestSuit.length > 0) {
    // Pick the lowest card of that suit as the indicator so Jack and 9 stay ready to play
    const card = cardsOfBestSuit.reduce((min, c) =>
      c.rankPower < min.rankPower ? c : min
    );
    return { suit: bestSuit, card };
  }

  return { suit: hand[0].suit, card: hand[0] };
}

/**
 * AI Strategic Decision: SHOULD HUKUM BE REVEALED IN THIS ROUND?
 * Core strategy: If the AI thinks in this round Hukum should NOT be revealed, keep it hidden!
 *
 * Rules when AI decides to NOT reveal Hukum:
 * 1. Partner is already winning the trick -> DO NOT REVEAL.
 * 2. Trick has low/no points (< 2 points) -> DO NOT REVEAL (preserve secret trump for high-value tricks).
 * 3. AI does NOT have a strong trump to win with (e.g. no trumps, or only 7/8/Q/K of trump while J and 9 are out) -> DO NOT REVEAL.
 * 4. In early tricks (tricks 1-2) with no massive points on the table -> DO NOT REVEAL.
 *
 * AI ONLY reveals when:
 * - An OPPONENT is winning with valuable points (>= 2 points in trick).
 * - AND AI actually holds a winning trump (Jack of trump, Nine of trump, or high trump) to cut and win!
 */
export function shouldAiRevealHukum(
  aiPlayerId: PlayerId,
  hand: Card[],
  currentTrickCards: PlayedCard[],
  hukum: SecretHukum,
  playedTricks: Trick[]
): boolean {
  // If already revealed, nothing to do
  if (hukum.isRevealed) return false;

  const partner = getPlayerPartner(aiPlayerId);

  // 1. If partner is currently winning the trick: DO NOT REVEAL HUKUM!
  if (currentTrickCards.length > 0) {
    const ledSuit = currentTrickCards[0].card.suit;
    
    // CRITICAL: If AI HAS the led suit, they must follow suit and CANNOT cut with a trump.
    // There is no strategic value in revealing Hukum if you are forced to follow the led suit!
    const hasLedSuit = hand.some((c) => c.suit === ledSuit);
    if (hasLedSuit) {
      return false;
    }

    const highestPlayed = currentTrickCards.reduce((max, pc) =>
      pc.card.suit === ledSuit && pc.card.rankPower > max.card.rankPower ? pc : max
    );

    if (highestPlayed.playerId === partner) {
      // Partner already has the trick! Keep Hukum secret!
      return false;
    }
  }

  // 2. Calculate points at stake in this trick
  const trickPoints = currentTrickCards.reduce((sum, pc) => sum + pc.card.points, 0);

  // Check if an opponent played a high-value card (Jack = 3, Nine = 2, Ace = 1)
  const opponentPlayedHighCard = currentTrickCards.some(
    (pc) => pc.playerId !== partner && (pc.card.rank === 'J' || pc.card.rank === '9' || pc.card.rank === 'A')
  );

  // If trick has 0 or 1 point and no opponent Jack/Nine: DO NOT REVEAL!
  if (trickPoints < 2 && !opponentPlayedHighCard) {
    // Keep Hukum hidden: don't waste trump reveal on small cards
    return false;
  }

  // 3. Check AI's own trump holding
  // If AI is declarer, AI KNOWS the trump suit:
  if (hukum.chosenBy === aiPlayerId) {
    const myTrumps = hand.filter((c) => c.suit === hukum.suit);

    // If AI has NO trumps: DO NOT REVEAL! (You would be forced to play a trump if you had one, but revealing without trump just helps opponents).
    if (myTrumps.length === 0) {
      return false;
    }

    // Check if AI has a strong winning trump (Jack = rankPower 7, Nine = rankPower 6)
    const hasJackOfTrump = myTrumps.some((c) => c.rank === 'J');
    const hasNineOfTrump = myTrumps.some((c) => c.rank === '9');
    const hasAceOfTrump = myTrumps.some((c) => c.rank === 'A');

    // If AI has Jack or Nine of trump: reveal and cut to capture the opponent's points!
    if (hasJackOfTrump || hasNineOfTrump || (hasAceOfTrump && trickPoints >= 3)) {
      return true;
    }

    // If AI only holds small trumps (7, 8, Q, K) and it's early in the hand (tricks 1-3):
    // DO NOT REVEAL! Playing a small trump might get over-trumped by opponent's Jack or Nine!
    if (playedTricks.length < 4) {
      return false;
    }

    // Late in the game (trick 5+) and points at stake:
    return trickPoints >= 2;
  }

  // 4. If AI is NOT declarer: AI does NOT know the secret trump suit
  // Only gamble to reveal if opponents are taking points and we are void in the led suit.
  // The user specifically requested this: "if they dont had that card and other team will take that points"
  if (trickPoints > 0) {
    return true; // We are void (checked above), opponents are taking points. Gamble and ask for Hukum!
  }

  if (trickPoints >= 3 && playedTricks.length >= 2) {
    return true;
  }

  // In very late game (trick 6+) if opponent leads high
  if (playedTricks.length >= 5 && trickPoints >= 2) {
    return true;
  }

  // Default: Keep Hukum hidden!
  return false;
}

/**
 * AI chooses the best legal card to play
 * Strictly prioritizes:
 * 1. Jack (1st priority: 3 pts, highest card)
 * 2. Nine (2nd priority: 2 pts, 2nd highest card)
 * 3. Ace (3rd priority: 1 pt, 3rd highest card)
 * 4. Ten (4th priority: 1 pt, 4th highest card)
 */


export interface AiDecisionResult {
  card: Card;
  explanation: AiExplanationData;
}

/**
 * AI chooses the best legal card to play and generates Section 13 explanation data
 * Strictly prioritizes:
 * 1. Jack (1st priority: 3 pts, highest card)
 * 2. Nine (2nd priority: 2 pts, 2nd highest card)
 * 3. Ace (3rd priority: 1 pt, 3rd highest card)
 * 4. Ten (4th priority: 1 pt, 4th highest card)
 * 5. K, Q, 8, 7 (0 pts)
 */
export function getAiCardDecisionWithExplanation(
  aiPlayerId: PlayerId,
  hand: Card[],
  currentTrickCards: PlayedCard[],
  hukum: SecretHukum,
  revealedHukumThisTurn: boolean,
  allPlayedCards: Card[],
  currentBid = 16,
  completedTricks: Trick[] = []
): AiDecisionResult {
  const legalCards = getPlayableCards(hand, currentTrickCards, hukum, revealedHukumThisTurn);

  if (legalCards.length === 0) {
    throw new Error(`AI ${aiPlayerId} has no legal cards to play!`);
  }

  const handEvaluation = evaluateHandStrength(hand);
  const partner = getPlayerPartner(aiPlayerId);
  const myTeam = getPlayerTeam(aiPlayerId);

  // Track captured Kings and Queens for King-Queen (K-Q) strategic evaluation
  const teamCapturedK: Partial<Record<Suit, boolean>> = {};
  const teamCapturedQ: Partial<Record<Suit, boolean>> = {};
  const oppCapturedK: Partial<Record<Suit, boolean>> = {};
  const oppCapturedQ: Partial<Record<Suit, boolean>> = {};

  for (const trick of completedTricks) {
    if (!trick.winnerPlayerId) continue;
    const wTeam = getPlayerTeam(trick.winnerPlayerId);
    for (const pc of trick.cards) {
      if (pc.card.rank === 'K') {
        if (wTeam === myTeam) teamCapturedK[pc.card.suit] = true;
        else oppCapturedK[pc.card.suit] = true;
      }
      if (pc.card.rank === 'Q') {
        if (wTeam === myTeam) teamCapturedQ[pc.card.suit] = true;
        else oppCapturedQ[pc.card.suit] = true;
      }
    }
  }

  // Helper to determine K-Q bonus (+4 for trump, +2 for non-trump) using only legal visible information
  const getKQBonusValue = (suit: Suit) => {
    // Hidden info rule: AI only knows trump suit if revealed.
    // As per user requirement: AI must not secretly treat the hidden Hukum card as Trump.
    const isTrump = hukum.isRevealed && hukum.suit === suit;
    return isTrump ? 4 : 2;
  };

  // Check if current trick contains King or Queen
  const trickK = currentTrickCards.find((pc) => pc.card.rank === 'K');
  const trickQ = currentTrickCards.find((pc) => pc.card.rank === 'Q');

  // Does winning this trick complete our team's K-Q combination?
  let trickCompletesOurKQ = false;
  let trickKQSuit: Suit | null = null;
  let trickKQBonus = 0;

  if (trickK && teamCapturedQ[trickK.card.suit] && !teamCapturedK[trickK.card.suit]) {
    trickCompletesOurKQ = true;
    trickKQSuit = trickK.card.suit;
    trickKQBonus = getKQBonusValue(trickK.card.suit);
  } else if (trickQ && teamCapturedK[trickQ.card.suit] && !teamCapturedQ[trickQ.card.suit]) {
    trickCompletesOurKQ = true;
    trickKQSuit = trickQ.card.suit;
    trickKQBonus = getKQBonusValue(trickQ.card.suit);
  }

  // Does opponent winning this trick complete their K-Q combination?
  let trickCompletesOppKQ = false;
  if (!trickCompletesOurKQ) {
    if (trickK && oppCapturedQ[trickK.card.suit] && !oppCapturedK[trickK.card.suit]) {
      trickCompletesOppKQ = true;
      trickKQSuit = trickK.card.suit;
      trickKQBonus = getKQBonusValue(trickK.card.suit);
    } else if (trickQ && oppCapturedK[trickQ.card.suit] && !oppCapturedQ[trickQ.card.suit]) {
      trickCompletesOppKQ = true;
      trickKQSuit = trickQ.card.suit;
      trickKQBonus = getKQBonusValue(trickQ.card.suit);
    }
  }

  // Check if AI holds the matching half for a K or Q in the trick
  let trickMatchesHandKQ = false;
  if (!trickCompletesOurKQ && !trickCompletesOppKQ) {
    if (trickK && hand.some((c) => c.suit === trickK.card.suit && c.rank === 'Q')) {
      trickMatchesHandKQ = true;
      trickKQSuit = trickK.card.suit;
      trickKQBonus = getKQBonusValue(trickK.card.suit);
    } else if (trickQ && hand.some((c) => c.suit === trickQ.card.suit && c.rank === 'K')) {
      trickMatchesHandKQ = true;
      trickKQSuit = trickQ.card.suit;
      trickKQBonus = getKQBonusValue(trickQ.card.suit);
    }
  }

  const strategicKQBonus = trickCompletesOurKQ || trickCompletesOppKQ ? trickKQBonus : (trickMatchesHandKQ ? Math.floor(trickKQBonus / 2) : 0);

  let chosenCard: Card = legalCards[0];
  let reason = 'Playing legal card.';

  // If only 1 legal card, play it directly
  if (legalCards.length === 1) {
    chosenCard = legalCards[0];
    reason = 'Only one legal card available in hand — mandatory play.';
  } else if (currentTrickCards.length === 0) {
    // ==========================================
    // 1. LEADING THE TRICK (First card)
    // ==========================================
    if (hukum.isRevealed) {
      const jackOfTrump = legalCards.find((c) => c.suit === hukum.suit && c.rank === 'J');
      const nineOfTrump = legalCards.find((c) => c.suit === hukum.suit && c.rank === '9');

      if (jackOfTrump) {
        chosenCard = jackOfTrump;
        reason = 'Lead Jack of Trump (master card) to pull opponents\' trumps and win trick.';
      } else if (nineOfTrump) {
        chosenCard = nineOfTrump;
        reason = 'Lead Nine of Trump to pull opponents\' trumps and establish suit control.';
      }
    }

    // Check if AI can lead a master King/Queen whose pair was already captured by our team!
    if (!chosenCard || chosenCard === legalCards[0]) {
      for (const suit of SUITS) {
        const canCompleteWithK = teamCapturedQ[suit] && !teamCapturedK[suit] && legalCards.some((c) => c.suit === suit && c.rank === 'K');
        const canCompleteWithQ = teamCapturedK[suit] && !teamCapturedQ[suit] && legalCards.some((c) => c.suit === suit && c.rank === 'Q');
        if (canCompleteWithK || canCompleteWithQ) {
          const targetCard = legalCards.find((c) => c.suit === suit && (c.rank === 'K' || c.rank === 'Q'));
          if (targetCard) {
            const higherPlayed = allPlayedCards.filter((pc) => pc.suit === suit && pc.rankPower > targetCard.rankPower);
            if (higherPlayed.length >= 4) {
              chosenCard = targetCard;
              reason = `Lead master ${targetCard.rank} of ${suit} to win trick and complete team's King–Queen combination (+${getKQBonusValue(suit)} bonus pts)!`;
              break;
            }
          }
        }
      }
    }

    if (!chosenCard || chosenCard === legalCards[0]) {
      // In non-trump suits:
      const nonTrumpJacks = legalCards.filter(
        (c) => c.rank === 'J' && (!hukum.isRevealed || c.suit !== hukum.suit)
      );
      if (nonTrumpJacks.length > 0) {
        chosenCard = nonTrumpJacks[0];
        reason = `Lead Jack of ${chosenCard.suit} (1st priority, 3 pts) to dominate the suit and score points.`;
      } else {
        const nonTrumpNines = legalCards.filter(
          (c) => c.rank === '9' && (!hukum.isRevealed || c.suit !== hukum.suit)
        );
        let foundMasterNine: Card | null = null;
        for (const nine of nonTrumpNines) {
          const jackAlreadyPlayed = allPlayedCards.some(
            (pc) => pc.suit === nine.suit && pc.rank === 'J'
          );
          if (jackAlreadyPlayed) {
            foundMasterNine = nine;
            break;
          }
        }

        if (foundMasterNine) {
          chosenCard = foundMasterNine;
          reason = `Lead Nine of ${foundMasterNine.suit} since the Jack was already played, making this the highest card.`;
        } else {
          const nonTrumpAces = legalCards.filter(
            (c) => c.rank === 'A' && (!hukum.isRevealed || c.suit !== hukum.suit)
          );
          if (nonTrumpAces.length > 0) {
            chosenCard = nonTrumpAces[0];
            reason = `Lead Ace of ${chosenCard.suit} (1 pt) to safely win trick and pull cards.`;
          } else {
            const lowCards = legalCards.filter((c) => c.points === 0);
            if (lowCards.length > 0) {
              chosenCard = lowCards[0];
              reason = `Lead low card (${chosenCard.rank}${chosenCard.suit[0]}) to safely probe the table without risking valuable points.`;
            } else {
              chosenCard = legalCards[0];
              reason = `Lead ${chosenCard.rank}${chosenCard.suit[0]} as best strategic choice.`;
            }
          }
        }
      }
    }
  } else {
    // ==========================================
    // 2. FOLLOWING SUIT OR PLAYING TO CURRENT TRICK
    // ==========================================
    const ledSuit = currentTrickCards[0].card.suit;
    const hasLedSuit = hand.some((c) => c.suit === ledSuit);

    // Identify who is currently winning the trick
    let currentWinningPlayer = currentTrickCards[0].playerId;
    let currentWinningCard = currentTrickCards[0].card;
    let highestTrumpPlayed: Card | null = null;

    for (const pc of currentTrickCards) {
      if (hukum.isRevealed && pc.card.suit === hukum.suit) {
        if (!highestTrumpPlayed || pc.card.rankPower > highestTrumpPlayed.rankPower) {
          highestTrumpPlayed = pc.card;
          currentWinningCard = pc.card;
          currentWinningPlayer = pc.playerId;
        }
      } else if (!highestTrumpPlayed && pc.card.suit === ledSuit) {
        if (pc.card.rankPower > currentWinningCard.rankPower) {
          currentWinningCard = pc.card;
          currentWinningPlayer = pc.playerId;
        }
      }
    }

    const isPartnerWinning = currentWinningPlayer === partner;
    const trickPoints = currentTrickCards.reduce((s, pc) => s + pc.card.points, 0);

    if (hasLedSuit) {
      const suitCards = legalCards.filter((c) => c.suit === ledSuit);

      if (isPartnerWinning) {
        // High-IQ K-Q play
        const kqFeedCard = suitCards.find(
          (c) =>
            (c.rank === 'K' && teamCapturedQ[c.suit] && !teamCapturedK[c.suit]) ||
            (c.rank === 'Q' && teamCapturedK[c.suit] && !teamCapturedQ[c.suit])
        );

        if (kqFeedCard && (currentWinningCard.rank === 'J' || currentWinningCard.rank === '9' || currentTrickCards.length === 3)) {
          chosenCard = kqFeedCard;
          reason = `Partner is winning trick — feeding ${chosenCard.rank} of ${chosenCard.suit} to partner to COMPLETE team's King–Queen combination (+${getKQBonusValue(chosenCard.suit)} bonus pts)!`;
        } else {
          // Partner is winning: aggressively play the HIGHEST point card we have in this suit!
          // Do NOT save the valuable point card for a later trick.
          const feedPoints = suitCards.filter((c) => c.points > 0).sort((a, b) => b.points - a.points); // J > 9 > A > 10
          if (feedPoints.length > 0) {
            chosenCard = feedPoints[0]; // Give maximum points! (e.g. Jack)
            reason = `Partner is winning — aggressively playing highest point card (${chosenCard.rank}, +${chosenCard.points} pts) to maximize team points in this trick!`;
          } else {
            const zeroCards = suitCards.filter((c) => c.points === 0);
            if (zeroCards.length > 0) {
              chosenCard = zeroCards.reduce((min, c) => (c.rankPower < min.rankPower ? c : min));
              reason = `Partner is winning — AI has no point cards, playing lowest card (${chosenCard.rank}) to protect partner's position.`;
            } else {
              chosenCard = suitCards.reduce((min, c) => (c.rankPower < min.rankPower ? c : min));
              reason = `Partner is winning — playing lowest card (${chosenCard.rank}).`;
            }
          }
        }
      } else {
        // Opponent is winning
        const winningCandidates = suitCards.filter((c) => {
          if (hukum.isRevealed && ledSuit === hukum.suit) {
            return highestTrumpPlayed
              ? c.rankPower > highestTrumpPlayed.rankPower
              : c.rankPower > currentWinningCard.rankPower;
          }
          return !highestTrumpPlayed && c.rankPower > currentWinningCard.rankPower;
        });

        if (winningCandidates.length > 0) {
          const jackCard = winningCandidates.find((c) => c.rank === 'J');
          const nineCard = winningCandidates.find((c) => c.rank === '9');

          if (trickCompletesOurKQ) {
            chosenCard = jackCard || nineCard || winningCandidates.reduce((min, c) => (c.rankPower < min.rankPower ? c : min));
            reason = `Opponent winning trick with ${trickK ? 'King' : 'Queen'} — playing ${chosenCard.rank} to win trick and COMPLETE team's King–Queen combination (+${trickKQBonus} bonus pts)!`;
          } else if (trickCompletesOppKQ) {
            chosenCard = jackCard || nineCard || winningCandidates.reduce((min, c) => (c.rankPower < min.rankPower ? c : min));
            reason = `Opponent attempting to complete King–Queen combination (+${trickKQBonus} pts) — playing ${chosenCard.rank} to block and deny bonus!`;
          } else if (jackCard && (trickPoints >= 2 || currentWinningCard.rank === '9' || currentWinningCard.rank === 'A' || strategicKQBonus > 0)) {
            chosenCard = jackCard;
            reason = 'Opponent winning point trick — playing Jack (1st priority, 3 pts) to capture trick points!';
          } else if (nineCard) {
            chosenCard = nineCard;
            reason = 'Opponent winning — playing Nine (2nd priority, 2 pts) to beat opponent and win trick!';
          } else {
            chosenCard = winningCandidates.reduce((min, c) =>
              c.rankPower < min.rankPower ? c : min
            );
            reason = `Playing ${chosenCard.rank} to beat opponent's ${currentWinningCard.rank} and win trick.`;
          }
        } else {
          const zeroPoints = suitCards.filter((c) => c.points === 0);
          if (zeroPoints.length > 0) {
            const safeZeros = zeroPoints.filter(
              (c) =>
                !(c.rank === 'K' && teamCapturedQ[c.suit]) &&
                !(c.rank === 'Q' && teamCapturedK[c.suit]) &&
                !(c.rank === 'K' && hand.some((h) => h.suit === c.suit && h.rank === 'Q')) &&
                !(c.rank === 'Q' && hand.some((h) => h.suit === c.suit && h.rank === 'K'))
            );
            chosenCard = safeZeros.length > 0
              ? safeZeros.reduce((min, c) => (c.rankPower < min.rankPower ? c : min))
              : zeroPoints.reduce((min, c) => (c.rankPower < min.rankPower ? c : min));
            reason = `Cannot beat opponent's ${currentWinningCard.rank} — dumping zero-point card (${chosenCard.rank}) to preserve points and protect combinations.`;
          } else {
            // Sort by points ascending, then by rankPower ascending to guarantee least points to opponent
            const leastPointsCards = [...suitCards].sort((a, b) => {
              if (a.points !== b.points) return a.points - b.points;
              return a.rankPower - b.rankPower;
            });
            chosenCard = leastPointsCards[0];
            reason = `Cannot beat opponent — discarding absolute lowest value point card (${chosenCard.rank}, +${chosenCard.points} pts) to give them minimum points.`;
          }
        }
      }
    } else {
      // Cannot follow suit (Off-suit / Cutting)
      if (hukum.isRevealed || revealedHukumThisTurn) {
        const trumpCards = legalCards.filter((c) => c.suit === hukum.suit);

        if (trumpCards.length > 0 && (!isPartnerWinning || trickPoints >= 3 || strategicKQBonus > 0)) {
          const beatingTrumps = highestTrumpPlayed
            ? trumpCards.filter((c) => c.rankPower > highestTrumpPlayed!.rankPower)
            : trumpCards;

          if (beatingTrumps.length > 0) {
            const trumpJack = beatingTrumps.find((c) => c.rank === 'J');
            const trumpNine = beatingTrumps.find((c) => c.rank === '9');

            if (trickCompletesOurKQ) {
              chosenCard = trumpJack || trumpNine || beatingTrumps.reduce((min, c) => (c.rankPower < min.rankPower ? c : min));
              reason = `Void in led suit (${ledSuit}) — cutting with Trump (${chosenCard.rank}) to COMPLETE team's King–Queen combination (+${trickKQBonus} bonus pts)!`;
            } else if (trickCompletesOppKQ) {
              chosenCard = trumpJack || trumpNine || beatingTrumps.reduce((min, c) => (c.rankPower < min.rankPower ? c : min));
              reason = `Void in led suit (${ledSuit}) — cutting with Trump (${chosenCard.rank}) to DENY opponent's King–Queen combination (+${trickKQBonus} bonus pts)!`;
            } else if (trumpJack && trickPoints >= 3) {
              chosenCard = trumpJack;
              reason = `Void in led suit (${ledSuit}) — cutting with Trump Jack (3 pts) to capture valuable trick!`;
            } else if (trumpNine && (trickPoints >= 2 || strategicKQBonus > 0)) {
              chosenCard = trumpNine;
              reason = `Void in led suit (${ledSuit}) — cutting with Trump Nine (2 pts) to secure trick points!`;
            } else {
              chosenCard = beatingTrumps.reduce((min, c) =>
                c.rankPower < min.rankPower ? c : min
              );
              reason = `Void in led suit (${ledSuit}) — cutting with lowest beating trump (${chosenCard.rank}) to win trick efficiently.`;
            }
          }
        }
      }

      if (!chosenCard || chosenCard === legalCards[0]) {
        if (isPartnerWinning && (currentWinningCard.rank === 'J' || currentWinningCard.rank === '9' || (highestTrumpPlayed && currentWinningCard === highestTrumpPlayed) || currentTrickCards.length === 3)) {
          const offsuitKQ = legalCards.find(
            (c) =>
              (c.rank === 'K' && teamCapturedQ[c.suit] && !teamCapturedK[c.suit]) ||
              (c.rank === 'Q' && teamCapturedK[c.suit] && !teamCapturedQ[c.suit])
          );

          if (offsuitKQ) {
            chosenCard = offsuitKQ;
            reason = `Void in led suit — partner winning, safely dumping ${chosenCard.rank} of ${chosenCard.suit} into partner's trick to COMPLETE team's King–Queen combination (+${getKQBonusValue(chosenCard.suit)} bonus pts)!`;
          } else {
            // Aggressively feed point cards to partner!
            const feedCards = legalCards.filter((c) => c.points > 0 && (!hukum.isRevealed || c.suit !== hukum.suit)).sort((a, b) => b.points - a.points); // Highest points first! (J > 9 > A > 10)
            if (feedCards.length > 0) {
              chosenCard = feedCards[0];
              reason = `Partner is winning trick — aggressively feeding highest point card (${chosenCard.rank}, +${chosenCard.points} pts) to our teammate!`;
            } else {
              const zeroCards = legalCards.filter((c) => c.points === 0 && (!hukum.isRevealed || c.suit !== hukum.suit));
              if (zeroCards.length > 0) {
                chosenCard = zeroCards[0];
                reason = `Void in led suit — partner winning, dumping harmless 0-point card (${chosenCard.rank}).`;
              } else {
                chosenCard = legalCards.reduce((min, c) => (c.points < min.points ? c : min));
                reason = 'Void in led suit — discarding lowest value card.';
              }
            }
          }
        } else {
          const zeroCards = legalCards.filter((c) => c.points === 0);
          if (zeroCards.length > 0) {
            const safeZeros = zeroCards.filter(
              (c) =>
                !(c.rank === 'K' && teamCapturedQ[c.suit]) &&
                !(c.rank === 'Q' && teamCapturedK[c.suit]) &&
                !(c.rank === 'K' && hand.some((h) => h.suit === c.suit && h.rank === 'Q')) &&
                !(c.rank === 'Q' && hand.some((h) => h.suit === c.suit && h.rank === 'K'))
            );
            chosenCard = safeZeros.length > 0 ? safeZeros[0] : zeroCards[0];
            reason = `Void in led suit — discarding harmless 0-point card (${chosenCard.rank}) to preserve trump and high cards.`;
          } else {
            // Sort by points ascending, then by rankPower ascending
            const leastPointsCards = [...legalCards].sort((a, b) => {
              if (a.points !== b.points) return a.points - b.points;
              return a.rankPower - b.rankPower;
            });
            chosenCard = leastPointsCards[0];
            reason = `Void in led suit — forced to discard points, discarding absolute lowest value point card (${chosenCard.rank}, +${chosenCard.points} pts) to opponent.`;
          }
        }
      }
    }
  }

  const currentTrickPoints = currentTrickCards.reduce((s, pc) => s + pc.card.points, 0);
  const expectedTrickValue = currentTrickPoints + chosenCard.points + (trickCompletesOurKQ ? trickKQBonus : 0);

  const currentTrickText =
    currentTrickCards.length > 0
      ? currentTrickCards
          .map((c) => `${c.card.rank}${getSuitSymbol(c.card.suit)}`)
          .join(', ')
      : 'Empty trick (Leading)';

  const availableLegalCards = legalCards.map(
    (c) => `${c.rank}${getSuitSymbol(c.suit)}`
  );

  const explanation: AiExplanationData = {
    playerId: aiPlayerId,
    playerName: aiPlayerId,
    handStrength: handEvaluation.level,
    currentBid,
    trumpSuit: hukum.suit,
    isTrumpRevealed: hukum.isRevealed,
    currentTrickText,
    availableLegalCards,
    expectedTrickValue,
    decisionText: `Play ${chosenCard.rank}${getSuitSymbol(chosenCard.suit)}`,
    reason,
    timestamp: Date.now(),
  };

  return { card: chosenCard, explanation };
}

export function getAiCardToPlay(
  aiPlayerId: PlayerId,
  hand: Card[],
  currentTrickCards: PlayedCard[],
  hukum: SecretHukum,
  revealedHukumThisTurn: boolean,
  allPlayedCards: Card[],
  currentBid = 16,
  completedTricks: Trick[] = []
): Card {
  return getAiCardDecisionWithExplanation(
    aiPlayerId,
    hand,
    currentTrickCards,
    hukum,
    revealedHukumThisTurn,
    allPlayedCards,
    currentBid,
    completedTricks
  ).card;
}
