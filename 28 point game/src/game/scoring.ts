import {
  Card,
  HandResult,
  KQCombinationRecord,
  KQRuleConfig,
  MatchScore,
  PlayerId,
  Suit,
  SuitKQStatus,
  TeamId,
  Trick,
} from '../types/game';
import { getPlayerTeam } from './bidding';
import { SecretHukum } from './trump';

/**
 * Default King-Queen Rule Configuration
 * Can be overridden in game settings / regional variants.
 */
export const DEFAULT_KQ_CONFIG: KQRuleConfig = {
  enabled: false,
  trumpBonus: 0,
  nonTrumpBonus: 0,
};

/**
 * Calculates the special 4-point reduction rule for the Hukum Revealer
 * who owns both Hukum King and Hukum Queen.
 * Minimum limit is 16 points, so the final value never goes below 16:
 * finalPoints = max(16, originalBid - 4)
 */
export function calculateHukumKQBidReduction(originalBid: number): number {
  return Math.max(16, originalBid - 4);
}

export interface HukumKQRevealEvaluation {
  hukumSuit: Suit;
  hukumRevealerId: PlayerId;
  hukumKingOwnerId: PlayerId | null;
  hukumQueenOwnerId: PlayerId | null;
  hukumKingVisible: boolean;
  hukumQueenVisible: boolean;
  hukumKingQueenValid: boolean;
  originalBid: number;
  finalBid: number;
  reductionApplied: boolean;
  biddingTeam?: TeamId;
}

export interface TrumpKQRuleState {
  trumpSuit: Suit;
  kingOwnerId: PlayerId | null;
  queenOwnerId: PlayerId | null;
  samePlayerHoldsBoth: boolean;
  pairHolderPlayerId: PlayerId | null;
  kingRevealed: boolean;
  queenRevealed: boolean;
  bothRevealedBySamePlayer: boolean;
  ruleActive: boolean;
  originalBid: number;
  finalBid: number;
  adjustment: number;
  beneficiaryTeam?: TeamId;
}

/**
 * Evaluates the Trump King & Queen rule according to the exact requirements:
 * 1. Checks if the SAME player holds BOTH Trump King and Trump Queen.
 * 2. If held by different players -> rule is NOT activated (no adjustment).
 * 3. Simply holding both does NOT automatically adjust the score.
 * 4. The player must show/reveal both cards.
 * 5. If only King is revealed -> no adjustment.
 * 6. If only Queen is revealed -> no adjustment.
 * 7. When BOTH are revealed by the same player:
 *    - Rule becomes ACTIVE.
 *    - Applies 4-point reduction to that team's overall bid:
 *      finalTeamPoints = Math.max(16, teamBid - 4).
 *    - Final points never lower than 16.
 *    - King and Queen themselves give NO extra card points (0 trick points).
 */
export function evaluateTrumpKQRule(
  trumpSuit: Suit,
  hands: Record<PlayerId, Card[]>,
  originalBid: number,
  options?: {
    knownKingOwnerId?: PlayerId | null;
    knownQueenOwnerId?: PlayerId | null;
    kingRevealed?: boolean;
    queenRevealed?: boolean;
    revealedByPlayerId?: PlayerId | null;
    declarerPlayerId?: PlayerId | null;
  }
): TrumpKQRuleState {
  let kingOwnerId: PlayerId | null = options?.knownKingOwnerId ?? null;
  let queenOwnerId: PlayerId | null = options?.knownQueenOwnerId ?? null;

  if (!kingOwnerId || !queenOwnerId) {
    for (const [pid, cards] of Object.entries(hands) as [PlayerId, Card[]][]) {
      if (!kingOwnerId && cards.some((c) => c.suit === trumpSuit && c.rank === 'K')) {
        kingOwnerId = pid;
      }
      if (!queenOwnerId && cards.some((c) => c.suit === trumpSuit && c.rank === 'Q')) {
        queenOwnerId = pid;
      }
    }
  }

  // 1. Same player must hold BOTH Trump King and Queen
  const samePlayerHoldsBoth = kingOwnerId !== null && kingOwnerId === queenOwnerId;
  const pairHolderPlayerId = samePlayerHoldsBoth ? kingOwnerId : null;

  const kingRevealed = options?.kingRevealed ?? false;
  const queenRevealed = options?.queenRevealed ?? false;
  const revealedByPlayerId = options?.revealedByPlayerId ?? null;

  // 2. Both must be revealed by the SAME player who holds both
  const bothRevealedBySamePlayer =
    samePlayerHoldsBoth &&
    kingRevealed &&
    queenRevealed &&
    (revealedByPlayerId === null || revealedByPlayerId === pairHolderPlayerId);

  let finalBid = originalBid;
  let adjustment = 0;
  let beneficiaryTeam: TeamId | undefined = undefined;

  if (bothRevealedBySamePlayer && pairHolderPlayerId) {
    finalBid = calculateHukumKQBidReduction(originalBid);
    adjustment = finalBid - originalBid;
    beneficiaryTeam = getPlayerTeam(pairHolderPlayerId);
  }

  return {
    trumpSuit,
    kingOwnerId,
    queenOwnerId,
    samePlayerHoldsBoth,
    pairHolderPlayerId,
    kingRevealed,
    queenRevealed,
    bothRevealedBySamePlayer,
    ruleActive: bothRevealedBySamePlayer,
    originalBid,
    finalBid,
    adjustment,
    beneficiaryTeam,
  };
}

/**
 * Evaluates Hukum King & Queen ownership and visibility immediately upon Hukum reveal.
 * 1. Checks who owns the Hukum King and Queen among all players' hands/cards.
 * 2. If any player has Hukum King or Queen, their ownership becomes visible to ALL players in both teams.
 * 3. Does NOT require dropping a Hukum card first.
 * 4. The Trump King and Trump Queen themselves have NO card points/value (0 points).
 * 5. If the same player holds BOTH and both are revealed, applies the special 4-point adjustment:
 *    finalPoints = max(16, teamBid - 4)
 */
export function evaluateHukumKQReveal(
  revealedSuit: Suit,
  revealedByPlayerId: PlayerId,
  declarerPlayerId: PlayerId | null,
  hands: Record<PlayerId, Card[]>,
  originalBid: number,
  knownKingOwnerId?: PlayerId | null,
  knownQueenOwnerId?: PlayerId | null,
  options?: {
    kingRevealed?: boolean;
    queenRevealed?: boolean;
    pairRevealedByPlayerId?: PlayerId | null;
  }
): HukumKQRevealEvaluation {
  let hukumKingOwnerId: PlayerId | null = knownKingOwnerId ?? null;
  let hukumQueenOwnerId: PlayerId | null = knownQueenOwnerId ?? null;

  if (!hukumKingOwnerId || !hukumQueenOwnerId) {
    for (const [pid, cards] of Object.entries(hands) as [PlayerId, Card[]][]) {
      if (!hukumKingOwnerId && cards.some((c) => c.suit === revealedSuit && c.rank === 'K')) {
        hukumKingOwnerId = pid;
      }
      if (!hukumQueenOwnerId && cards.some((c) => c.suit === revealedSuit && c.rank === 'Q')) {
        hukumQueenOwnerId = pid;
      }
    }
  }

  const hukumKingVisible = hukumKingOwnerId !== null;
  const hukumQueenVisible = hukumQueenOwnerId !== null;

  const samePlayerHoldsBoth = hukumKingOwnerId !== null && hukumKingOwnerId === hukumQueenOwnerId;
  const pairHolderId = samePlayerHoldsBoth ? hukumKingOwnerId : null;

  let kingRevealed = options?.kingRevealed ?? false;
  let queenRevealed = options?.queenRevealed ?? false;
  let pairRevealedBy = options?.pairRevealedByPlayerId ?? null;

  // In legacy test mode (when options not explicitly passed), if revealedByPlayerId is the pair holder,
  // treat as both revealed:
  if (options === undefined) {
    if (samePlayerHoldsBoth && revealedByPlayerId === pairHolderId) {
      kingRevealed = true;
      queenRevealed = true;
      pairRevealedBy = pairHolderId;
    }
  }

  const bothRevealedBySamePlayer =
    samePlayerHoldsBoth &&
    kingRevealed &&
    queenRevealed &&
    (pairRevealedBy === null || pairRevealedBy === pairHolderId);

  let finalBid = originalBid;
  let reductionApplied = false;

  if (bothRevealedBySamePlayer) {
    finalBid = calculateHukumKQBidReduction(originalBid);
    reductionApplied = true;
  }

  const decidingPlayerId = declarerPlayerId ?? revealedByPlayerId;
  const decidingTeam = decidingPlayerId ? getPlayerTeam(decidingPlayerId) : undefined;

  return {
    hukumSuit: revealedSuit,
    hukumRevealerId: revealedByPlayerId,
    hukumKingOwnerId,
    hukumQueenOwnerId,
    hukumKingVisible,
    hukumQueenVisible,
    hukumKingQueenValid: bothRevealedBySamePlayer,
    originalBid,
    finalBid,
    reductionApplied,
    biddingTeam: decidingTeam,
  };
}

export interface HukumKQEvaluation {
  hukumKQActive: boolean;
  hukumKingQueenValid: boolean;
  finalBid: number;
  activatedThisTurn: boolean;
}

/**
 * Kept for backwards compatibility
 */
export function evaluateHukumKQDrop(
  state: {
    hukumKQActive: boolean;
    hukumKingQueenValid: boolean;
    hukumSuit: Suit | null;
    hukumRevealerId: PlayerId | null;
    hukumKingOwnerId: PlayerId | null;
    hukumQueenOwnerId: PlayerId | null;
    originalBid: number;
    finalBid: number;
  },
  cardPlayed: Card,
  playerId: PlayerId
): HukumKQEvaluation {
  if (state.hukumKQActive) {
    return {
      hukumKQActive: true,
      hukumKingQueenValid: state.hukumKingQueenValid,
      finalBid: state.finalBid,
      activatedThisTurn: false,
    };
  }
  return {
    hukumKQActive: true,
    hukumKingQueenValid: state.hukumKingQueenValid,
    finalBid: state.finalBid,
    activatedThisTurn: false,
  };
}

const ALL_SUITS: Suit[] = ['SPADES', 'HEARTS', 'CLUBS', 'DIAMONDS'];

/**
 * Evaluates King-Queen (K-Q) combinations across completed tricks.
 * A combination is valid ONLY if the SAME TEAM captures both the King and Queen of the same suit.
 *
 * Bonus:
 * - Trump-suit K + Q: +4 bonus points (or config.trumpBonus)
 * - Non-trump K + Q: +2 bonus points (or config.nonTrumpBonus)
 *
 * Prevents duplicate awards for the same combination.
 */
export function evaluateKQCombinations(
  tricks: Trick[],
  trumpSuit?: Suit,
  config: KQRuleConfig = DEFAULT_KQ_CONFIG
): {
  teamAKQBonus: number;
  teamBKQBonus: number;
  suitStatuses: Record<Suit, SuitKQStatus>;
  completedCombinations: KQCombinationRecord[];
} {
  const suitStatuses: Record<Suit, SuitKQStatus> = {
    SPADES: {
      suit: 'SPADES',
      kingCapturedBy: null,
      queenCapturedBy: null,
      isCompleted: false,
      completedByTeam: null,
      bonusPoints: 0,
      isTrump: trumpSuit === 'SPADES',
    },
    HEARTS: {
      suit: 'HEARTS',
      kingCapturedBy: null,
      queenCapturedBy: null,
      isCompleted: false,
      completedByTeam: null,
      bonusPoints: 0,
      isTrump: trumpSuit === 'HEARTS',
    },
    CLUBS: {
      suit: 'CLUBS',
      kingCapturedBy: null,
      queenCapturedBy: null,
      isCompleted: false,
      completedByTeam: null,
      bonusPoints: 0,
      isTrump: trumpSuit === 'CLUBS',
    },
    DIAMONDS: {
      suit: 'DIAMONDS',
      kingCapturedBy: null,
      queenCapturedBy: null,
      isCompleted: false,
      completedByTeam: null,
      bonusPoints: 0,
      isTrump: trumpSuit === 'DIAMONDS',
    },
  };

  const completedCombinations: KQCombinationRecord[] = [];

  if (!config.enabled) {
    return {
      teamAKQBonus: 0,
      teamBKQBonus: 0,
      suitStatuses,
      completedCombinations: [],
    };
  }

  // Iterate chronologically through tricks
  for (const trick of tricks) {
    if (!trick.winnerPlayerId) continue;
    const winnerTeam = getPlayerTeam(trick.winnerPlayerId);

    for (const played of trick.cards) {
      const card = played.card;
      const status = suitStatuses[card.suit];

      if (card.rank === 'K') {
        status.kingCapturedBy = winnerTeam;
      } else if (card.rank === 'Q') {
        status.queenCapturedBy = winnerTeam;
      }
    }

    // Check if any suit's K and Q are both captured by the SAME team
    for (const suit of ALL_SUITS) {
      const status = suitStatuses[suit];
      if (
        !status.isCompleted &&
        status.kingCapturedBy !== null &&
        status.queenCapturedBy !== null
      ) {
        if (status.kingCapturedBy === status.queenCapturedBy) {
          const isTrump = suit === trumpSuit;
          const bonus = isTrump ? config.trumpBonus : config.nonTrumpBonus;

          status.isCompleted = true;
          status.completedByTeam = status.kingCapturedBy;
          status.bonusPoints = bonus;
          status.isTrump = isTrump;
          status.completedInTrickNumber = trick.number;

          completedCombinations.push({
            suit,
            team: status.completedByTeam,
            bonusPoints: bonus,
            isTrump,
            completedInTrick: trick.number,
            capturingTeam: status.completedByTeam,
            bonus,
          });
        }
      }
    }
  }

  const teamAKQBonus = completedCombinations
    .filter((c) => c.team === 'TEAM_A')
    .reduce((s, c) => s + c.bonusPoints, 0);

  const teamBKQBonus = completedCombinations
    .filter((c) => c.team === 'TEAM_B')
    .reduce((s, c) => s + c.bonusPoints, 0);

  return {
    teamAKQBonus,
    teamBKQBonus,
    suitStatuses,
    completedCombinations,
  };
}

/**
 * Calculates current hand totals including Card Points (0 to 28) and King-Queen Bonus Points.
 */
export function calculateHandTotals(
  tricks: Trick[],
  trumpSuit?: Suit,
  config: KQRuleConfig = DEFAULT_KQ_CONFIG
): {
  teamAPoints: number;
  teamBPoints: number;
  teamACardPoints: number;
  teamBCardPoints: number;
  teamAKQBonus: number;
  teamBKQBonus: number;
  teamATotalPoints: number;
  teamBTotalPoints: number;
  teamATricksWon: number;
  teamBTricksWon: number;
  totalCardPoints: number;
  isPointSumValid: boolean;
  pointVerificationError?: string;
  kqCombinations: KQCombinationRecord[];
  suitStatuses: Record<Suit, SuitKQStatus>;
} {
  let teamAPoints = 0;
  let teamBPoints = 0;
  let teamATricksWon = 0;
  let teamBTricksWon = 0;

  for (const trick of tricks) {
    if (!trick.winnerPlayerId) continue;
    const winnerTeam = getPlayerTeam(trick.winnerPlayerId);
    if (winnerTeam === 'TEAM_A') {
      teamAPoints += trick.points;
      teamATricksWon++;
    } else {
      teamBPoints += trick.points;
      teamBTricksWon++;
    }
  }

  const totalCardPoints = teamAPoints + teamBPoints;
  const isPointSumValid = tricks.length === 8 ? totalCardPoints === 28 : true;
  const pointVerificationError =
    tricks.length === 8 && totalCardPoints !== 28
      ? `Final Verification Error: Total captured points is ${totalCardPoints} (expected exactly 28). Scoring discrepancy detected!`
      : undefined;

  const { teamAKQBonus, teamBKQBonus, suitStatuses, completedCombinations } =
    evaluateKQCombinations(tricks, trumpSuit, config);

  const teamATotalPoints = teamAPoints + teamAKQBonus;
  const teamBTotalPoints = teamBPoints + teamBKQBonus;

  return {
    teamAPoints,
    teamBPoints,
    teamACardPoints: teamAPoints,
    teamBCardPoints: teamBPoints,
    teamAKQBonus,
    teamBKQBonus,
    teamATotalPoints,
    teamBTotalPoints,
    teamATricksWon,
    teamBTricksWon,
    totalCardPoints,
    isPointSumValid,
    pointVerificationError,
    kqCombinations: completedCombinations,
    suitStatuses,
  };
}

/**
 * Evaluates the final outcome of the hand after 8 tricks,
 * factoring in the K-Q bonus to the bidding team's points.
 */
export function evaluateHandOutcome(
  handNumber: number,
  bidder: PlayerId,
  finalBid: number,
  hukum: SecretHukum,
  tricks: Trick[],
  currentMatchScore: MatchScore,
  config: KQRuleConfig = DEFAULT_KQ_CONFIG,
  originalBid?: number,
  hukumKingQueenValid?: boolean
): { result: HandResult; updatedMatchScore: MatchScore } {
  const {
    teamAPoints,
    teamBPoints,
    teamAKQBonus,
    teamBKQBonus,
    teamATotalPoints,
    teamBTotalPoints,
    totalCardPoints,
    isPointSumValid,
    pointVerificationError,
    kqCombinations,
  } = calculateHandTotals(tricks, hukum.suit, config);

  const biddingTeam = getPlayerTeam(bidder);
  // Final team points = Card Points + K-Q Bonus
  const biddingTeamPoints =
    biddingTeam === 'TEAM_A' ? teamATotalPoints : teamBTotalPoints;

  const bidSuccess = biddingTeamPoints >= finalBid;

  // Standard Indian 28 match points:
  // If bid was 16-19: winning team gets 1 match point, losing gets -1 (or opponents get +1)
  // If bid was 20-28: winning team gets 2 match points, losing gets -2 (or opponents get +2)
  const baseMatchPoints = finalBid >= 20 ? 2 : 1;

  let matchPointsAwardedTeamA = 0;
  let matchPointsAwardedTeamB = 0;

  if (bidSuccess) {
    if (biddingTeam === 'TEAM_A') {
      matchPointsAwardedTeamA = baseMatchPoints;
    } else {
      matchPointsAwardedTeamB = baseMatchPoints;
    }
  } else {
    // If bidding team fails, defenders get double penalty
    const penaltyPoints = baseMatchPoints * 2;
    if (biddingTeam === 'TEAM_A') {
      matchPointsAwardedTeamB = penaltyPoints;
    } else {
      matchPointsAwardedTeamA = penaltyPoints;
    }
  }

  const result: HandResult = {
    handNumber,
    bidder,
    biddingTeam,
    finalBid,
    originalBid: originalBid ?? finalBid,
    hukumKingQueenValid: hukumKingQueenValid ?? false,
    hukumSuit: hukum.suit,
    teamAPoints,
    teamBPoints,
    teamACardPoints: teamAPoints,
    teamBCardPoints: teamBPoints,
    teamAKQBonus,
    teamBKQBonus,
    teamATotalPoints,
    teamBTotalPoints,
    biddingTeamPoints,
    bidSuccess,
    matchPointsAwardedTeamA,
    matchPointsAwardedTeamB,
    totalCardPoints,
    isPointSumValid,
    pointVerificationError,
    kqCombinations,
    tricks,
  };

  const updatedMatchScore: MatchScore = {
    teamAMatchPoints: currentMatchScore.teamAMatchPoints + matchPointsAwardedTeamA,
    teamBMatchPoints: currentMatchScore.teamBMatchPoints + matchPointsAwardedTeamB,
    handsPlayed: currentMatchScore.handsPlayed + 1,
  };

  return { result, updatedMatchScore };
}
