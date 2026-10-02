import { PlayerId } from '../types/game';

// In this traditional Indian 28 ruleset, bidding starts at 16
export const MIN_BID = 16;
export const MAX_BID = 28;

export const PLAYERS_ORDER: PlayerId[] = ['player1', 'player2', 'player3', 'player4'];

export function getNextPlayer(current: PlayerId): PlayerId {
  const index = PLAYERS_ORDER.indexOf(current);
  return PLAYERS_ORDER[(index + 1) % 4];
}

export function getPlayerPartner(playerId: PlayerId): PlayerId {
  switch (playerId) {
    case 'player1':
      return 'player3';
    case 'player2':
      return 'player4';
    case 'player3':
      return 'player1';
    case 'player4':
      return 'player2';
  }
}

export function getPlayerTeam(playerId: PlayerId): 'TEAM_A' | 'TEAM_B' {
  return playerId === 'player1' || playerId === 'player3' ? 'TEAM_A' : 'TEAM_B';
}

export interface HoldCandidate {
  challenger: PlayerId;
  amount: number;
}

export interface BiddingState {
  phase: 1 | 2;
  currentBid: number; // 0 if no opening bid yet, or 16-28
  highestBidder: PlayerId | null;
  firstBidder: PlayerId | null; // Player with seniority to "Hold" / "I Do"
  turn: PlayerId;
  holdCandidate: HoldCandidate | null; // Pending challenge waiting for Hold or Pass
  passedPlayers: Set<PlayerId>;
  bidsHistory: Array<{
    playerId: PlayerId;
    action: 'BID' | 'PASS' | 'HOLD';
    amount?: number;
  }>;
  isComplete: boolean;
  consecutivePasses: number;
}

export function initBidding(
  firstTurn: PlayerId,
  phase: 1 | 2 = 1,
  currentBid = 0,
  currentBidder: PlayerId | null = null
): BiddingState {
  return {
    phase,
    currentBid,
    highestBidder: currentBidder,
    firstBidder: currentBidder,
    turn: firstTurn,
    holdCandidate: null,
    passedPlayers: new Set<PlayerId>(),
    bidsHistory: [],
    isComplete: false,
    consecutivePasses: 0,
  };
}

export function canHold(biddingState: BiddingState, playerId: PlayerId): boolean {
  if (biddingState.isComplete) return false;
  if (!biddingState.holdCandidate) return false;
  if (biddingState.turn !== playerId) return false;
  if (biddingState.highestBidder !== playerId) return false;
  return true;
}

export function canBid(biddingState: BiddingState, playerId: PlayerId, amount: number): boolean {
  if (biddingState.isComplete) return false;
  if (biddingState.turn !== playerId) return false;
  if (biddingState.passedPlayers.has(playerId)) return false;
  if (amount < MIN_BID || amount > MAX_BID) return false;

  // If responding to a hold candidate, must bid strictly higher than the hold amount
  if (biddingState.holdCandidate) {
    if (amount <= biddingState.holdCandidate.amount) return false;
    return true;
  }

  // Normal bidding: must be strictly higher than current bid (unless opening at MIN_BID)
  if (amount <= biddingState.currentBid) return false;
  return true;
}

export function canPass(biddingState: BiddingState, playerId: PlayerId): boolean {
  if (biddingState.isComplete) return false;
  if (biddingState.turn !== playerId) return false;
  return true;
}

/**
 * The original bidder uses their privilege to "Hold" / "I Do" at the challenged amount.
 * Example: Opponent challenges with 17. Original bidder says "17 I Do".
 * The bid becomes 17, highest bidder remains original bidder, and turn goes back to challenger.
 */
export function applyHold(
  biddingState: BiddingState,
  playerId: PlayerId
): { newState: BiddingState; error?: string } {
  if (!canHold(biddingState, playerId)) {
    return { newState: biddingState, error: `Player ${playerId} cannot hold right now` };
  }

  const holdAmount = biddingState.holdCandidate!.amount;
  const challenger = biddingState.holdCandidate!.challenger;

  const newHistory = [
    ...biddingState.bidsHistory,
    { playerId, action: 'HOLD' as const, amount: holdAmount },
  ];

  // Bid is now held at holdAmount by playerId. Challenger must now bid higher or pass!
  const newState: BiddingState = {
    ...biddingState,
    currentBid: holdAmount,
    highestBidder: playerId,
    holdCandidate: null,
    bidsHistory: newHistory,
    turn: challenger, // Challenger must now respond!
    consecutivePasses: 0,
  };

  return { newState };
}

/**
 * Apply a bid.
 * If challenged by another team while an existing bidder holds seniority, triggers the Hold / "I Do" challenge.
 */
export function applyBid(
  biddingState: BiddingState,
  playerId: PlayerId,
  amount: number
): { newState: BiddingState; error?: string } {
  if (!canBid(biddingState, playerId, amount)) {
    return {
      newState: biddingState,
      error: `Illegal bid of ${amount} by ${playerId}. Current bid is ${biddingState.currentBid}`,
    };
  }

  const newHistory = [
    ...biddingState.bidsHistory,
    { playerId, action: 'BID' as const, amount },
  ];

  // 1. OPENING BID (e.g. 16)
  if (biddingState.currentBid === 0) {
    let next = getNextPlayer(playerId);
    let attempts = 0;
    while (biddingState.passedPlayers.has(next) && attempts < 4) {
      next = getNextPlayer(next);
      attempts++;
    }

    const newState: BiddingState = {
      ...biddingState,
      currentBid: amount,
      highestBidder: playerId,
      firstBidder: playerId, // Seniority to Hold / "I Do"
      consecutivePasses: 0,
      bidsHistory: newHistory,
      turn: next,
      holdCandidate: null,
    };

    return { newState };
  }

  // 2. A CHALLENGER BIDS HIGHER (e.g. 17 against 16)
  // Check if current highestBidder is from opposing team and can "Hold" / "I Do"
  const currentOwner = biddingState.highestBidder;
  const isOpposingTeam =
    currentOwner && getPlayerTeam(currentOwner) !== getPlayerTeam(playerId);

  if (currentOwner && isOpposingTeam && !biddingState.passedPlayers.has(currentOwner)) {
    // Current owner gets the right to "Hold" / "I Do" at this amount!
    const newState: BiddingState = {
      ...biddingState,
      holdCandidate: { challenger: playerId, amount },
      bidsHistory: newHistory,
      turn: currentOwner, // Turn goes to original bidder to Hold or Pass!
      consecutivePasses: 0,
    };
    return { newState };
  }

  // Otherwise, standard raise or partner raise
  let next = getNextPlayer(playerId);
  let attempts = 0;
  while (biddingState.passedPlayers.has(next) && attempts < 4) {
    next = getNextPlayer(next);
    attempts++;
  }

  const newState: BiddingState = {
    ...biddingState,
    currentBid: amount,
    highestBidder: playerId,
    firstBidder: biddingState.firstBidder || playerId,
    consecutivePasses: 0,
    bidsHistory: newHistory,
    turn: next,
    holdCandidate: null,
  };

  // If 3 players passed, auction complete
  if (biddingState.passedPlayers.size >= 3) {
    newState.isComplete = true;
  }

  return { newState };
}

/**
 * Apply a Pass.
 */
export function applyPass(
  biddingState: BiddingState,
  playerId: PlayerId
): { newState: BiddingState; error?: string } {
  if (!canPass(biddingState, playerId)) {
    return { newState: biddingState, error: `Player ${playerId} cannot pass right now` };
  }

  const newHistory = [
    ...biddingState.bidsHistory,
    { playerId, action: 'PASS' as const },
  ];

  // Case A: Player was responding to a Hold / "I Do" challenge and decided to PASS!
  // If original bidder passes the challenge, the challenger becomes the new highestBidder at that amount!
  if (biddingState.holdCandidate && biddingState.turn === playerId) {
    const challenger = biddingState.holdCandidate.challenger;
    const challengeAmount = biddingState.holdCandidate.amount;

    const newPassed = new Set(biddingState.passedPlayers);
    newPassed.add(playerId); // Original bidder passed

    // Find next player after challenger
    let next = getNextPlayer(challenger);
    let attempts = 0;
    while (newPassed.has(next) && attempts < 4) {
      next = getNextPlayer(next);
      attempts++;
    }

    const isComplete = newPassed.size >= 3;

    return {
      newState: {
        ...biddingState,
        currentBid: challengeAmount,
        highestBidder: challenger,
        firstBidder: challenger, // Seniority transfers to challenger
        holdCandidate: null,
        passedPlayers: newPassed,
        bidsHistory: newHistory,
        turn: next,
        isComplete,
        consecutivePasses: 0,
      },
    };
  }

  // Case B: Normal Pass
  const newPassed = new Set(biddingState.passedPlayers);
  newPassed.add(playerId);

  const newConsecutivePasses = biddingState.consecutivePasses + 1;

  // If all 4 players pass without any opening bid, force last player to bid MIN_BID (16)
  if (biddingState.currentBid === 0 && newPassed.size === 4) {
    const forcedBidder = playerId;
    return {
      newState: {
        ...biddingState,
        currentBid: MIN_BID,
        highestBidder: forcedBidder,
        firstBidder: forcedBidder,
        isComplete: true,
        consecutivePasses: 0,
        passedPlayers: new Set(PLAYERS_ORDER.filter((p) => p !== forcedBidder)),
        bidsHistory: [
          ...newHistory,
          { playerId: forcedBidder, action: 'BID', amount: MIN_BID },
        ],
      },
    };
  }

  // If a bid has been placed and 3 other players passed, bidding ends!
  if (biddingState.highestBidder !== null && newPassed.size >= 3) {
    return {
      newState: {
        ...biddingState,
        passedPlayers: newPassed,
        consecutivePasses: newConsecutivePasses,
        bidsHistory: newHistory,
        isComplete: true,
        holdCandidate: null,
      },
    };
  }

  // Find next active player
  let next = getNextPlayer(playerId);
  let attempts = 0;
  while (newPassed.has(next) && attempts < 4) {
    next = getNextPlayer(next);
    attempts++;
  }

  // If next is the highest bidder and no active hold candidate, bidding ends
  if (next === biddingState.highestBidder && !biddingState.holdCandidate) {
    return {
      newState: {
        ...biddingState,
        passedPlayers: newPassed,
        consecutivePasses: newConsecutivePasses,
        bidsHistory: newHistory,
        isComplete: true,
        holdCandidate: null,
      },
    };
  }

  return {
    newState: {
      ...biddingState,
      passedPlayers: newPassed,
      consecutivePasses: newConsecutivePasses,
      bidsHistory: newHistory,
      turn: next,
      holdCandidate: null,
    },
  };
}
