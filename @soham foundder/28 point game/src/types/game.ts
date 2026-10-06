export type Suit = 'SPADES' | 'HEARTS' | 'DIAMONDS' | 'CLUBS';

export type Rank = '7' | '8' | 'Q' | 'K' | '10' | 'A' | '9' | 'J';

export interface Card {
  id: string; // e.g. "SPADES_J"
  suit: Suit;
  rank: Rank;
  points: number; // J=3, 9=2, A=1, 10=1, K/Q/8/7=0
  rankPower: number; // 0 to 7 (7=J, 6=9, 5=A, 4=10, 3=K, 2=Q, 1=8, 0=7)
}

export type PlayerId = 'player1' | 'player2' | 'player3' | 'player4';
// player1 = South (Human)
// player2 = East (AI Opponent 1)
// player3 = North (AI Partner)
// player4 = West (AI Opponent 2)

export type TeamId = 'TEAM_A' | 'TEAM_B';
// Team A: Player 1 (Human) + Player 3 (AI Partner)
// Team B: Player 2 (AI Opponent 1) + Player 4 (AI Opponent 2)

export interface PlayerInfo {
  id: PlayerId;
  name: string;
  roleName: string; // e.g. "You (Human)", "Opponent 1 (AI)", "Partner (AI)", "Opponent 2 (AI)"
  team: TeamId;
  isHuman: boolean;
  avatar: string;
  position: 'south' | 'east' | 'north' | 'west';
  coins: number;
}

export interface PlayedCard {
  playerId: PlayerId;
  card: Card;
  trickNumber: number;
}

export interface Trick {
  number: number; // 1 to 8
  leadPlayerId: PlayerId;
  cards: PlayedCard[];
  winnerPlayerId?: PlayerId;
  winningCard?: Card;
  points: number;
  hukumWasRevealedBeforeThisTrick: boolean;
  hukumRevealedInThisTrick?: {
    byPlayerId: PlayerId;
    suit: Suit;
  };
}

export type GamePhase =
  | 'DEALING_FIRST_4'
  | 'BIDDING_PHASE_1'
  | 'SELECTING_HUKUM'
  | 'DEALING_SECOND_4'
  | 'BIDDING_PHASE_2'
  | 'PLAYING_TRICKS'
  | 'TRICK_RESOLVING'
  | 'HAND_OVER'
  | 'MATCH_OVER';

export interface BidAction {
  playerId: PlayerId;
  type: 'BID' | 'PASS';
  amount?: number;
}

export interface HukumState {
  suit: Suit | null;
  card: Card | null; // the specific card placed face-down
  chosenBy: PlayerId | null;
  isRevealed: boolean;
  revealedBy: PlayerId | null;
  revealedInTrickNumber: number | null;
}

export interface HukumKQState {
  hukumSuit: Suit | null;
  hukumRevealerId: PlayerId | null;
  hukumKingOwnerId: PlayerId | null;
  hukumQueenOwnerId: PlayerId | null;
  hukumKingVisible: boolean;
  hukumQueenVisible: boolean;
  hukumKingRevealed?: boolean;
  hukumQueenRevealed?: boolean;
  hukumKQPairHolderId?: PlayerId | null;
  hukumKQRevealed?: boolean;
  hukumKQRevealedByPlayerId?: PlayerId | null;
  hukumKQActive?: boolean;
  hukumKingQueenValid?: boolean;
  originalBid: number;
  finalBid: number;
  kqAdjustment?: number;
  showKQRevealNotification?: boolean;
  biddingTeam?: TeamId;
}

export interface KQRuleConfig {
  enabled: boolean;
  trumpBonus: number; // Default: 4
  nonTrumpBonus: number; // Default: 2
}

export interface SuitKQStatus {
  suit: Suit;
  kingCapturedBy: TeamId | null;
  queenCapturedBy: TeamId | null;
  isCompleted: boolean;
  completedByTeam: TeamId | null;
  bonusPoints: number;
  isTrump: boolean;
  completedInTrickNumber?: number;
}

export interface KQCombinationRecord {
  suit: Suit;
  team: TeamId;
  bonusPoints: number;
  isTrump: boolean;
  completedInTrick: number;
  capturingTeam?: TeamId;
  bonus?: number;
}

export interface HandScore {
  teamAPoints: number; // Card points (0 to 28)
  teamBPoints: number; // Card points (0 to 28)
  teamACardPoints?: number;
  teamBCardPoints?: number;
  teamAKQBonus: number; // K-Q Bonus points
  teamBKQBonus: number; // K-Q Bonus points
  teamATotalPoints: number; // teamAPoints + teamAKQBonus
  teamBTotalPoints: number; // teamBPoints + teamBKQBonus
  teamATricksWon: number;
  teamBTricksWon: number;
}

export interface MatchScore {
  teamAMatchPoints: number;
  teamBMatchPoints: number;
  handsPlayed: number;
}

export interface HandResult {
  handNumber: number;
  bidder: PlayerId;
  biddingTeam: TeamId;
  originalBid?: number;
  finalBid: number;
  hukumSuit: Suit;
  hukumKingQueenValid?: boolean;
  teamAPoints: number; // Card points (0 to 28)
  teamBPoints: number; // Card points (0 to 28)
  teamACardPoints?: number; // Raw card points
  teamBCardPoints?: number; // Raw card points
  teamAKQBonus: number; // K-Q Bonus (e.g. +4, +2)
  teamBKQBonus: number; // K-Q Bonus (e.g. +4, +2)
  teamATotalPoints: number; // Card points + K-Q bonus
  teamBTotalPoints: number; // Card points + K-Q bonus
  biddingTeamPoints: number; // Final points for contract evaluation
  bidSuccess: boolean;
  matchPointsAwardedTeamA: number;
  matchPointsAwardedTeamB: number;
  totalCardPoints: number; // Must be exactly 28
  isPointSumValid: boolean; // Verified === 28
  pointVerificationError?: string;
  kqCombinations: KQCombinationRecord[];
  tricks: Trick[];
  coinSettlement?: {
    p1_change: number;
    p3_change: number;
    p2_change: number;
    p4_change: number;
    margin: number;
    winningTeam: TeamId | 'DRAW';
    finalCoins: {
      p1: number;
      p2: number;
      p3: number;
      p4: number;
    };
  };
}

export interface AiExplanationData {
  playerId: PlayerId;
  playerName: string;
  handStrength: 'WEAK' | 'MEDIUM' | 'STRONG';
  currentBid: number;
  trumpSuit: Suit;
  isTrumpRevealed: boolean;
  currentTrickText: string;
  availableLegalCards: string[];
  expectedTrickValue: number;
  decisionText: string;
  reason: string;
  timestamp: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  animationSpeed: 'normal' | 'fast';
  aiExplanationModeEnabled: boolean;
  kqRuleConfig: KQRuleConfig;
}

export interface MatchHistoryEntry {
  handNumber: number;
  timestamp: number;
  dealer: PlayerId;
  declarer: PlayerId;
  biddingTeam: TeamId;
  finalBid: number;
  hukumSuit: Suit;
  hukumRevealedBy?: PlayerId | null;
  teamAPoints: number;
  teamBPoints: number;
  teamAKQBonus?: number;
  teamBKQBonus?: number;
  teamATotalPoints?: number;
  teamBTotalPoints?: number;
  bidSuccess: boolean;
  matchScoreAfter: MatchScore;
  kqCombinations?: KQCombinationRecord[];
  tricks: Trick[];
}
