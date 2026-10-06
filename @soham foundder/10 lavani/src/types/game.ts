export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';

export type Rank = '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  id: string; // e.g. "spades-10"
  suit: Suit;
  rank: Rank;
  value: number; // 7 to 14
  isDehla: boolean;
}

export type PlayerId = 'p1' | 'p2' | 'p3' | 'p4';

export type TeamId = 'teamA' | 'teamB';

export type PlayerPosition = 'bottom' | 'right' | 'top' | 'left';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

export type GameSpeed = 'normal' | 'fast' | 'instant';

export interface Player {
  id: PlayerId;
  name: string;
  avatar: string;
  isHuman: boolean;
  team: TeamId;
  position: PlayerPosition;
  hand: Card[];
  tricksWon: number;
  coins: number;
}

export interface PlayedCard {
  playerId: PlayerId;
  card: Card;
  timestamp: number;
}

export interface Trick {
  trickNumber: number; // 1 to 8
  leadPlayerId: PlayerId;
  leadSuit?: Suit;
  cards: PlayedCard[];
  winnerPlayerId?: PlayerId;
  capturedDehlas: Card[];
}

export type GamePhase =
  | 'idle'
  | 'evaluateHand'
  | 'passingCards'
  | 'partnerChoosingHukum'
  | 'selectTrump'
  | 'stage2Dealing'
  | 'playing'
  | 'trickResolving'
  | 'roundOver';

export interface PartnerPassInfo {
  hasPassed: boolean;
  selectedCardIds: string[];
  humanSentCards: Card[];
  partnerReturnedCards: Card[];
}

export interface TeamScore {
  dehlas: Card[];
  tricksWon: number;
  isKot: boolean;
}

export interface GameSettings {
  difficulty: AIDifficulty;
  gameSpeed: GameSpeed;
  soundEnabled: boolean;
  autoSortHand: boolean;
}

export interface GameState {
  deck: Card[];
  remainingDeck: Card[]; // The 16 cards waiting for Stage 2
  dealingStage: 1 | 2;
  partnerPass: PartnerPassInfo;
  players: Record<PlayerId, Player>;
  playerOrder: PlayerId[];
  dealerId: PlayerId;
  trumpSuit: Suit | null;
  trumpChooserId: PlayerId;
  currentTurn: PlayerId;
  phase: GamePhase;
  currentTrick: Trick;
  trickHistory: Trick[];
  teamScores: Record<TeamId, TeamScore>;
  trickNumber: number; // 0 to 8
  lastTrickWinner: PlayerId | null;
  statusMessage: string;
  highlightCardId: string | null;
  settings: GameSettings;
  coinSettlement?: {
    changes: Record<string, number>;
    newBalances: Record<string, number>;
    winningTeamId: string;
  };
}
