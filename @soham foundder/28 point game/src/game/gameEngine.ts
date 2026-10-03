import {
  AiExplanationData,
  Card,
  GamePhase,
  HandResult,
  KQCombinationRecord,
  KQRuleConfig,
  MatchHistoryEntry,
  MatchScore,
  PlayedCard,
  PlayerId,
  PlayerInfo,
  Suit,
  TeamId,
  Trick,
} from '../types/game';
import {
  chooseAiHukum,
  getAiBidDecision,
  getAiCardDecisionWithExplanation,
  getAiCardToPlay,
  shouldAiRevealHukum,
} from './ai';
import {
  applyBid,
  applyHold,
  applyPass,
  BiddingState,
  getNextPlayer,
  getPlayerPartner,
  getPlayerTeam,
  initBidding,
  PLAYERS_ORDER,
} from './bidding';
import { createDeck, sortCards, getSuitSymbol } from './cards';
import { dealFirstFourCards, dealRemainingFourCards, shuffleDeck } from './deck';
import {
  calculateHukumKQBidReduction,
  DEFAULT_KQ_CONFIG,
  evaluateHandOutcome,
  evaluateHukumKQDrop,
  evaluateHukumKQReveal,
  evaluateKQCombinations,
} from './scoring';
import { soundManager } from './sound';
import { determineTrickWinner, getPlayableCards } from './tricks';
import { createSecretHukum, revealHukum, SecretHukum } from './trump';
import { generateRandomIndianAINames } from '../../../shared/aiNames';

const initialAiNames = generateRandomIndianAINames(3);

export const PLAYERS: PlayerInfo[] = [
  {
    id: 'player1',
    name: 'You',
    roleName: 'You (Human)',
    team: 'TEAM_A',
    isHuman: true,
    avatar: '👨‍💼',
    position: 'south',
  },
  {
    id: 'player2',
    name: initialAiNames[0].name,
    roleName: `${initialAiNames[0].name} (Opponent 1)`,
    team: 'TEAM_B',
    isHuman: false,
    avatar: initialAiNames[0].avatar,
    position: 'east',
  },
  {
    id: 'player3',
    name: initialAiNames[1].name,
    roleName: `${initialAiNames[1].name} (Partner)`,
    team: 'TEAM_A',
    isHuman: false,
    avatar: initialAiNames[1].avatar,
    position: 'north',
  },
  {
    id: 'player4',
    name: initialAiNames[2].name,
    roleName: `${initialAiNames[2].name} (Opponent 2)`,
    team: 'TEAM_B',
    isHuman: false,
    avatar: initialAiNames[2].avatar,
    position: 'west',
  },
];

export interface FullGameState {
  phase: GamePhase;
  handNumber: number;
  dealer: PlayerId;
  hands: Record<PlayerId, Card[]>;
  remainingDeck: Card[];
  bidding: BiddingState;
  hukum: SecretHukum | null;
  declarer: PlayerId | null;
  hukumSuit: Suit | null;
  hukumRevealerId: PlayerId | null;
  hukumKingOwnerId: PlayerId | null;
  hukumQueenOwnerId: PlayerId | null;
  hukumKingVisible: boolean;
  hukumQueenVisible: boolean;
  hukumKingRevealed: boolean;
  hukumQueenRevealed: boolean;
  hukumKQPairHolderId: PlayerId | null;
  hukumKQRevealed: boolean;
  hukumKQRevealedByPlayerId: PlayerId | null;
  hukumKQActive: boolean;
  hukumKingQueenValid: boolean;
  originalBid: number;
  finalBid: number;
  kqAdjustment: number;
  showKQRevealNotification: boolean;
  currentTrick: Trick | null;
  completedTricks: Trick[];
  currentTurn: PlayerId;
  matchScore: MatchScore;
  handResult: HandResult | null;
  allPlayedCards: Card[];
  lastTrickWinner: PlayerId | null;
  actionMessage: string;
  isHumanHukumRevealPromptOpen: boolean;
  justRevealedHukumThisTurn: boolean;
  humanSkippedRevealThisTrick: boolean;
  aiSpeechBubbles: Partial<Record<PlayerId, string>>;
  latestAiExplanation: AiExplanationData | null;
  isAiExplanationModalOpen: boolean;
  matchHistory: MatchHistoryEntry[];
  isMatchHistoryOpen: boolean;
  kqRuleConfig: KQRuleConfig;
  latestKqCelebration: KQCombinationRecord | null;
  eventLog: { time: string, message: string }[];
}

export function createInitialGameState(): FullGameState {
  return {
    phase: 'DEALING_FIRST_4',
    handNumber: 1,
    dealer: 'player4', // West deals, so South (You) starts bidding
    hands: { player1: [], player2: [], player3: [], player4: [] },
    remainingDeck: [],
    bidding: initBidding('player1', 1),
    hukum: null,
    declarer: null,
    hukumSuit: null,
    hukumRevealerId: null,
    hukumKingOwnerId: null,
    hukumQueenOwnerId: null,
    hukumKingVisible: false,
    hukumQueenVisible: false,
    hukumKingRevealed: false,
    hukumQueenRevealed: false,
    hukumKQPairHolderId: null,
    hukumKQRevealed: false,
    hukumKQRevealedByPlayerId: null,
    hukumKQActive: false,
    hukumKingQueenValid: false,
    originalBid: 0,
    finalBid: 0,
    kqAdjustment: 0,
    showKQRevealNotification: false,
    currentTrick: null,
    completedTricks: [],
    currentTurn: 'player1',
    matchScore: { teamAMatchPoints: 0, teamBMatchPoints: 0, handsPlayed: 0 },
    handResult: null,
    allPlayedCards: [],
    lastTrickWinner: null,
    actionMessage: 'Welcome to Twenty-Eight! Shuffling cards...',
    isHumanHukumRevealPromptOpen: false,
    justRevealedHukumThisTurn: false,
    humanSkippedRevealThisTrick: false,
    aiSpeechBubbles: {},
    latestAiExplanation: null,
    isAiExplanationModalOpen: false,
    matchHistory: [],
    isMatchHistoryOpen: false,
    kqRuleConfig: { ...DEFAULT_KQ_CONFIG },
    latestKqCelebration: null,
    eventLog: [],
  };
}

export class TwentyEightGame {
  private state: FullGameState;
  private listeners: Array<(state: FullGameState) => void> = [];

  constructor() {
    this.state = createInitialGameState();
  }

  public subscribe(listener: (state: FullGameState) => void) {
    this.listeners.push(listener);
    listener(this.state);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  public getState(): FullGameState {
    return this.state;
  }

  /**
   * Starts a brand new hand (or the first hand)
   */
  public startNewHand(nextDealer?: PlayerId) {
    soundManager.playShuffle();
    const dealer = nextDealer || this.state.dealer;
    const firstBidder = getNextPlayer(dealer);

    // Shuffle 32 cards and deal first 4 cards
    const { hands, remainingDeck } = dealFirstFourCards();

    soundManager.playCardDeal();

    this.state = {
      ...this.state,
      phase: 'BIDDING_PHASE_1',
      dealer,
      hands,
      remainingDeck,
      bidding: initBidding(firstBidder, 1),
      hukum: null,
      declarer: null,
      hukumSuit: null,
      hukumRevealerId: null,
      hukumKingOwnerId: null,
      hukumQueenOwnerId: null,
      hukumKingVisible: false,
      hukumQueenVisible: false,
      hukumKingRevealed: false,
      hukumQueenRevealed: false,
      hukumKQPairHolderId: null,
      hukumKQRevealed: false,
      hukumKQRevealedByPlayerId: null,
      hukumKQActive: false,
      hukumKingQueenValid: false,
      originalBid: 0,
      finalBid: 0,
      kqAdjustment: 0,
      showKQRevealNotification: false,
      currentTrick: null,
      completedTricks: [],
      currentTurn: firstBidder,
      handResult: null,
      allPlayedCards: [],
      lastTrickWinner: null,
      actionMessage: `Dealing 4 cards... ${this.getPlayerName(firstBidder)} opens bidding.`,
      isHumanHukumRevealPromptOpen: false,
      justRevealedHukumThisTurn: false,
      humanSkippedRevealThisTrick: false,
      aiSpeechBubbles: {},
    };

    this.notify();

    // If first bidder is AI, trigger AI bid
    if (firstBidder !== 'player1') {
      setTimeout(() => this.runAiBid(), 800);
    }
  }

  /**
   * Resets entire match
   */
  public startNewGame() {
    const newAiNames = generateRandomIndianAINames(3);
    
    PLAYERS[1].name = newAiNames[0].name;
    PLAYERS[1].avatar = newAiNames[0].avatar;
    PLAYERS[1].roleName = `${newAiNames[0].name} (Opponent 1)`;
    
    PLAYERS[2].name = newAiNames[1].name;
    PLAYERS[2].avatar = newAiNames[1].avatar;
    PLAYERS[2].roleName = `${newAiNames[1].name} (Partner)`;
    
    PLAYERS[3].name = newAiNames[2].name;
    PLAYERS[3].avatar = newAiNames[2].avatar;
    PLAYERS[3].roleName = `${newAiNames[2].name} (Opponent 2)`;

    this.state = createInitialGameState();
    this.startNewHand('player4');
  }

  private getPlayerName(playerId: PlayerId): string {
    return PLAYERS.find((p) => p.id === playerId)?.name || playerId;
  }

  /**
   * Player (Human or AI) places a bid
   */
  public placeBid(playerId: PlayerId, amount: number) {
    if (this.state.bidding.turn !== playerId) return;

    const { newState, error } = applyBid(this.state.bidding, playerId, amount);
    if (error) {
      console.error(error);
      return;
    }

    soundManager.playBid();
    const name = this.getPlayerName(playerId);
    let msg = `${name} bids ${amount}.`;
    if (newState.holdCandidate) {
      const challengedName = this.getPlayerName(newState.turn);
      msg = `${name} challenges with ${amount}! ${challengedName} can Hold ${amount} ("${amount} I Do") or Pass.`;
    }

    this.state = {
      ...this.state,
      bidding: newState,
      currentTurn: newState.turn,
      actionMessage: msg,
    };

    this.notify();
    this.checkBiddingPhaseComplete();
  }

  /**
   * Player holds the bid at challenged amount ("I Do" / Hold)
   */
  public holdBid(playerId: PlayerId) {
    if (this.state.bidding.turn !== playerId) return;

    const { newState, error } = applyHold(this.state.bidding, playerId);
    if (error) {
      console.error(error);
      return;
    }

    soundManager.playBid();
    const name = this.getPlayerName(playerId);
    const amount = newState.currentBid;
    const challengerName = this.getPlayerName(newState.turn);
    const msg = `${name}: ${amount} I Do! (Holds bid at ${amount}). ${challengerName} must bid higher or pass.`;

    this.state = {
      ...this.state,
      bidding: newState,
      currentTurn: newState.turn,
      actionMessage: msg,
    };

    this.notify();
    this.checkBiddingPhaseComplete();
  }

  /**
   * Player passes
   */
  public passBid(playerId: PlayerId) {
    if (this.state.bidding.turn !== playerId) return;

    const { newState, error } = applyPass(this.state.bidding, playerId);
    if (error) {
      console.error(error);
      return;
    }

    soundManager.playButtonClick();
    const name = this.getPlayerName(playerId);
    const msg = `${name} passes.`;

    this.state = {
      ...this.state,
      bidding: newState,
      currentTurn: newState.turn,
      actionMessage: msg,
    };

    this.notify();
    this.checkBiddingPhaseComplete();
  }

  private checkBiddingPhaseComplete() {
    if (this.state.bidding.isComplete) {
      const winner = this.state.bidding.highestBidder!;
      const amount = this.state.bidding.currentBid;
      const winnerName = this.getPlayerName(winner);

      // Bidding finished: Winner chooses secret Hukum!
      this.state = {
        ...this.state,
        phase: 'SELECTING_HUKUM',
        declarer: winner,
        hukumRevealerId: winner,
        originalBid: amount,
        finalBid: amount,
        actionMessage: `${winnerName} wins auction with ${amount}! Choosing secret Hukum...`,
      };
      this.notify();

      if (winner !== 'player1') {
        // AI chooses secret Hukum
        setTimeout(() => {
          const aiHukum = chooseAiHukum(winner, this.state.hands[winner]);
          this.setSecretHukum(winner, aiHukum.suit, aiHukum.card);
        }, 1000);
      }
    } else {
      // Bidding continues, check if next turn is AI
      const nextTurn = this.state.bidding.turn;
      if (nextTurn !== 'player1') {
        setTimeout(() => this.runAiBid(), 900);
      }
    }
  }

  private runAiBid() {
    if (this.state.phase !== 'BIDDING_PHASE_1') {
      return;
    }

    const aiId = this.state.bidding.turn;
    if (aiId === 'player1') return;

    const hand = this.state.hands[aiId];
    const decision = getAiBidDecision(this.state.bidding, aiId, hand);

    if (decision.action === 'HOLD') {
      this.holdBid(aiId);
    } else if (decision.action === 'BID' && decision.amount) {
      this.placeBid(aiId, decision.amount);
    } else {
      this.passBid(aiId);
    }
  }

  /**
   * Sets the secret Hukum (chosen by declarer)
   */
  public setSecretHukum(declarerId: PlayerId, suit: Suit, card: Card) {
    const hukum = createSecretHukum(suit, card, declarerId);
    const declarerName = this.getPlayerName(declarerId);

    // Deal remaining 4 cards to everyone (now 8 cards each)
    soundManager.playCardDeal();
    const updatedHands = dealRemainingFourCards(
      this.state.hands,
      this.state.remainingDeck
    );

    // Track ownership of Hukum King and Queen across all hands (Section 3 & 6)
    let hukumKingOwnerId: PlayerId | null = null;
    let hukumQueenOwnerId: PlayerId | null = null;
    for (const pid of (['player1', 'player2', 'player3', 'player4'] as PlayerId[])) {
      if (updatedHands[pid].some((c) => c.suit === suit && c.rank === 'K')) {
        hukumKingOwnerId = pid;
      }
      if (updatedHands[pid].some((c) => c.suit === suit && c.rank === 'Q')) {
        hukumQueenOwnerId = pid;
      }
    }

    // Player to dealer's right leads the first trick
    const firstLeader = getNextPlayer(this.state.dealer);

    const firstTrick: Trick = {
      number: 1,
      leadPlayerId: firstLeader,
      cards: [],
      points: 0,
      hukumWasRevealedBeforeThisTrick: false,
    };

    const originalBid = this.state.originalBid || this.state.finalBid || this.state.bidding.currentBid;

    this.state = {
      ...this.state,
      hands: updatedHands,
      remainingDeck: [],
      hukum,
      hukumSuit: suit,
      hukumRevealerId: declarerId,
      hukumKingOwnerId,
      hukumQueenOwnerId,
      hukumKingVisible: false,
      hukumQueenVisible: false,
      hukumKingRevealed: false,
      hukumQueenRevealed: false,
      hukumKQPairHolderId: hukumKingOwnerId !== null && hukumKingOwnerId === hukumQueenOwnerId ? hukumKingOwnerId : null,
      hukumKQRevealed: false,
      hukumKQRevealedByPlayerId: null,
      hukumKQActive: false,
      hukumKingQueenValid: false,
      originalBid,
      finalBid: originalBid,
      kqAdjustment: 0,
      showKQRevealNotification: false,
      phase: 'PLAYING_TRICKS',
      currentTrick: firstTrick,
      currentTurn: firstLeader,
      actionMessage: `Hukum locked by ${declarerName}! 4 more cards dealt (8 cards each). Trick 1 begins! ${this.getPlayerName(
        firstLeader
      )} leads.`,
      eventLog: [{ time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }), message: `Contract set: ${originalBid}` }, ...this.state.eventLog],
    };

    this.notify();

    if (firstLeader !== 'player1') {
      setTimeout(() => this.runAiTurn(), 1000);
    }
  }

  /**
   * Initiates trick playing
   */
  private startTrickPlayingPhase() {
    // Player to dealer's right leads the first trick
    const firstLeader = getNextPlayer(this.state.dealer);

    const firstTrick: Trick = {
      number: 1,
      leadPlayerId: firstLeader,
      cards: [],
      points: 0,
      hukumWasRevealedBeforeThisTrick: false,
    };

    this.state = {
      ...this.state,
      phase: 'PLAYING_TRICKS',
      currentTrick: firstTrick,
      currentTurn: firstLeader,
      actionMessage: `Trick 1 of 8. ${this.getPlayerName(firstLeader)} leads.`,
    };

    this.notify();

    if (firstLeader !== 'player1') {
      setTimeout(() => this.runAiTurn(), 1000);
    }
  }

  /**
   * Handle card played by Human or AI
   */
  public playCard(playerId: PlayerId, card: Card) {
    if (this.state.phase !== 'PLAYING_TRICKS') return;
    if (this.state.currentTurn !== playerId) return;
    if (!this.state.currentTrick || !this.state.hukum) return;

    const playerHand = this.state.hands[playerId];
    const legalCards = getPlayableCards(
      playerHand,
      this.state.currentTrick.cards,
      this.state.hukum,
      this.state.justRevealedHukumThisTurn
    );

    if (!legalCards.some((c) => c.id === card.id)) {
      console.warn(`Card ${card.id} is not legal for ${playerId}`);
      return;
    }

    soundManager.playCardPlace();

    // Remove card from player hand
    const newHand = playerHand.filter((c) => c.id !== card.id);
    const newHands = { ...this.state.hands, [playerId]: newHand };

    const playedCard: PlayedCard = {
      playerId,
      card,
      trickNumber: this.state.currentTrick.number,
    };

    const newTrickCards = [...this.state.currentTrick.cards, playedCard];
    const newTrickPoints = newTrickCards.reduce((s, pc) => s + pc.card.points, 0);

    const updatedTrick: Trick = {
      ...this.state.currentTrick,
      cards: newTrickCards,
      points: newTrickPoints,
    };

    const newAllPlayedCards = [...this.state.allPlayedCards, card];

    // If 4 cards played, resolve trick!
    if (newTrickCards.length === 4) {
      const winner = determineTrickWinner(updatedTrick, this.state.hukum);
      updatedTrick.winnerPlayerId = winner.winnerPlayerId;
      updatedTrick.winningCard = winner.winningCard;

      const winnerName = this.getPlayerName(winner.winnerPlayerId);

      this.state = {
        ...this.state,
        phase: 'TRICK_RESOLVING',
        hands: newHands,
        currentTrick: updatedTrick,
        allPlayedCards: newAllPlayedCards,
        lastTrickWinner: winner.winnerPlayerId,
        actionMessage: `${winnerName} wins Trick ${updatedTrick.number} with ${winner.winningCard.rank}${winner.winningCard.suit[0]} (+${updatedTrick.points} pts)!`,
        justRevealedHukumThisTurn: false,
        eventLog: [{ time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }), message: `${this.getPlayerName(playerId)} played ${card.rank}${getSuitSymbol(card.suit)}` }, ...this.state.eventLog],
      };

      this.notify();

      setTimeout(() => this.finalizeCompletedTrick(updatedTrick), 1400);
      return;
    }

    // Advance turn to next player counter-clockwise
    const nextTurn = getNextPlayer(playerId);

    this.state = {
      ...this.state,
      hands: newHands,
      currentTrick: updatedTrick,
      currentTurn: nextTurn,
      allPlayedCards: newAllPlayedCards,
      actionMessage: `${this.getPlayerName(playerId)} played ${card.rank}${card.suit[0]}. Next: ${this.getPlayerName(
        nextTurn
      )}`,
      justRevealedHukumThisTurn: false,
      humanSkippedRevealThisTrick: false,
      eventLog: [{ time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }), message: `${this.getPlayerName(playerId)} played ${card.rank}${getSuitSymbol(card.suit)}` }, ...this.state.eventLog],
    };

    this.notify();

    // Check if next player is Human and needs Hukum reveal prompt
    if (nextTurn === 'player1') {
      this.checkHumanRevealOpportunity();
    } else {
      setTimeout(() => this.runAiTurn(), 900);
    }
  }

  /**
   * Check if Human player cannot follow suit and Hukum is still secret
   */
  private checkHumanRevealOpportunity() {
    if (!this.state.currentTrick || this.state.currentTrick.cards.length === 0) return;
    if (!this.state.hukum || this.state.hukum.isRevealed) return;

    const ledSuit = this.state.currentTrick.cards[0].card.suit;
    const humanHand = this.state.hands.player1;
    const hasLedSuit = humanHand.some((c) => c.suit === ledSuit);

    // If human has no cards of led suit, prompt if they want to reveal Hukum!
    if (!hasLedSuit) {
      this.state = {
        ...this.state,
        isHumanHukumRevealPromptOpen: true,
      };
      this.notify();
    }
  }

  /**
   * Action: Reveal Hukum (can be invoked by Human or AI)
   */
  public triggerHukumReveal(byPlayerId: PlayerId) {
    if (!this.state.hukum || this.state.hukum.isRevealed) return;
    if (!this.state.currentTrick) return;

    soundManager.playHukumReveal();
    const updatedHukum = revealHukum(
      this.state.hukum,
      byPlayerId,
      this.state.currentTrick.number
    );

    const playerName = this.getPlayerName(byPlayerId);

    // ==========================================
    // HUKUM KING & QUEEN FUNCTIONALITY (Core Rules & Visibility)
    // When the Hukum/Trump is revealed by ANY player:
    // 1. Hukum suit becomes known.
    // 2. Immediately check who has the Hukum King and Hukum Queen.
    // 3. Ownership becomes visible to ALL players in both teams.
    // 4. Do NOT require the player to drop a Hukum card first.
    // 5. If the player who revealed/decided Hukum owns BOTH King and Queen,
    //    apply 4-point adjustment: finalPoints = max(16, originalBid - 4).
    // ==========================================
    const kqReveal = evaluateHukumKQReveal(
      updatedHukum.suit,
      byPlayerId,
      this.state.declarer,
      this.state.hands,
      this.state.originalBid || this.state.finalBid,
      this.state.hukumKingOwnerId,
      this.state.hukumQueenOwnerId
    );

    const decTeamId = this.state.declarer ? getPlayerTeam(this.state.declarer) : null;
    const decTeamName = decTeamId === 'TEAM_A' ? 'Team A' : decTeamId === 'TEAM_B' ? 'Team B' : 'Deciding Team';

    const samePlayer = kqReveal.hukumKingOwnerId !== null && kqReveal.hukumKingOwnerId === kqReveal.hukumQueenOwnerId;
    const pairHolderId = samePlayer ? kqReveal.hukumKingOwnerId : null;

    let kqMsg = '';
    if (kqReveal.hukumKingVisible && kqReveal.hukumQueenVisible) {
      if (samePlayer) {
        const ownerName = this.getPlayerName(pairHolderId!);
        kqMsg = ` 👑 ${updatedHukum.suit} King + Queen held by ${ownerName}! (Can show/reveal K+Q)`;
      } else {
        const kName = this.getPlayerName(kqReveal.hukumKingOwnerId!);
        const qName = this.getPlayerName(kqReveal.hukumQueenOwnerId!);
        kqMsg = ` 👑 ${updatedHukum.suit} K: ${kName}, Q: ${qName} (Different players - no adjustment).`;
      }
    } else if (kqReveal.hukumKingVisible) {
      const kName = this.getPlayerName(kqReveal.hukumKingOwnerId!);
      kqMsg = ` 👑 ${updatedHukum.suit} King owned by ${kName}.`;
    } else if (kqReveal.hukumQueenVisible) {
      const qName = this.getPlayerName(kqReveal.hukumQueenOwnerId!);
      kqMsg = ` 👑 ${updatedHukum.suit} Queen owned by ${qName}.`;
    }

    const updatedTrick: Trick = {
      ...this.state.currentTrick,
      hukumRevealedInThisTrick: {
        byPlayerId,
        suit: updatedHukum.suit,
      },
    };

    this.state = {
      ...this.state,
      hukum: updatedHukum,
      hukumSuit: updatedHukum.suit,
      hukumRevealerId: byPlayerId,
      hukumKingOwnerId: kqReveal.hukumKingOwnerId,
      hukumQueenOwnerId: kqReveal.hukumQueenOwnerId,
      hukumKingVisible: kqReveal.hukumKingVisible,
      hukumQueenVisible: kqReveal.hukumQueenVisible,
      hukumKingRevealed: false,
      hukumQueenRevealed: false,
      hukumKQPairHolderId: pairHolderId,
      hukumKQRevealed: false,
      hukumKQRevealedByPlayerId: null,
      hukumKingQueenValid: false,
      hukumKQActive: false,
      finalBid: this.state.originalBid || this.state.finalBid,
      kqAdjustment: 0,
      currentTrick: updatedTrick,
      isHumanHukumRevealPromptOpen: false,
      humanSkippedRevealThisTrick: false,
      justRevealedHukumThisTurn: true,
      actionMessage: `🎺 HUKUM REVEALED! ${playerName} revealed Hukum: ${updatedHukum.suit}!${kqMsg}`,
      eventLog: [{ time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }), message: `Trump revealed: ${getSuitSymbol(updatedHukum.suit)}` }, ...this.state.eventLog],
      aiSpeechBubbles:
        byPlayerId !== 'player1'
          ? {
              ...this.state.aiSpeechBubbles,
              [byPlayerId]: `🎺 Revealed: ${updatedHukum.suit}`,
            }
          : this.state.aiSpeechBubbles,
    };

    this.notify();

    // AUTOMATICALLY reveal K+Q if a player holds both! This prevents the user from missing the button.
    if (pairHolderId) {
      setTimeout(() => {
        this.revealTrumpKingQueen(pairHolderId);
      }, 800);
    }
  }

  public skipHumanReveal() {
    this.state = {
      ...this.state,
      isHumanHukumRevealPromptOpen: false,
      humanSkippedRevealThisTrick: true,
      actionMessage: 'You chose to skip revealing Hukum. Click any card to discard.',
    };
    this.notify();
  }

  public dismissHumanRevealPrompt() {
    this.state = {
      ...this.state,
      isHumanHukumRevealPromptOpen: false,
      justRevealedHukumThisTurn: false,
    };
    this.notify();
  }

  /**
   * AI player turn
   */
  private runAiTurn() {
    if (this.state.phase !== 'PLAYING_TRICKS') return;
    const aiId = this.state.currentTurn;
    if (aiId === 'player1') return;
    if (!this.state.currentTrick || !this.state.hukum) return;

    const hand = this.state.hands[aiId];
    if (hand.length === 0) return;

    let justRevealed = false;

    // Check if AI cannot follow suit and wants to reveal Hukum
    if (this.state.currentTrick.cards.length > 0 && !this.state.hukum.isRevealed) {
      const ledSuit = this.state.currentTrick.cards[0].card.suit;
      const hasLedSuit = hand.some((c) => c.suit === ledSuit);

      if (!hasLedSuit) {
        const wantsToReveal = shouldAiRevealHukum(
          aiId,
          hand,
          this.state.currentTrick.cards,
          this.state.hukum,
          this.state.completedTricks
        );

        if (wantsToReveal) {
          this.triggerHukumReveal(aiId);
          justRevealed = true;
        } else {
          // AI chooses to SKIP revealing Hukum!
          const aiName = this.getPlayerName(aiId);
          this.state = {
            ...this.state,
            actionMessage: `${aiName} has no ${ledSuit} and skips revealing Hukum.`,
            aiSpeechBubbles: {
              ...this.state.aiSpeechBubbles,
              [aiId]: '⏭️ Skipped Reveal',
            },
          };
          this.notify();
        }
      }
    }

    // AI selects and plays card
    setTimeout(() => {
      if (!this.state.hukum || !this.state.currentTrick) return;
      const { card: cardToPlay, explanation } = getAiCardDecisionWithExplanation(
        aiId,
        this.state.hands[aiId],
        this.state.currentTrick.cards,
        this.state.hukum,
        justRevealed,
        this.state.allPlayedCards,
        this.state.finalBid || this.state.bidding.currentBid,
        this.state.completedTricks
      );

      explanation.playerName = this.getPlayerName(aiId);

      this.state = {
        ...this.state,
        latestAiExplanation: explanation,
      };

      this.playCard(aiId, cardToPlay);
    }, justRevealed ? 1000 : 300);
  }

  /**
   * After trick cards are cleared
   */
  private finalizeCompletedTrick(completedTrick: Trick) {
    soundManager.playTrickWin();

    const winner = completedTrick.winnerPlayerId!;
    const newCompletedTricks = [...this.state.completedTricks, completedTrick];

    // Check if this trick completed a King-Queen (K-Q) combination
    const prevKq = evaluateKQCombinations(
      this.state.completedTricks,
      this.state.hukum?.suit,
      this.state.kqRuleConfig
    );
    const newKq = evaluateKQCombinations(
      newCompletedTricks,
      this.state.hukum?.suit,
      this.state.kqRuleConfig
    );
    const newlyCompletedKq = newKq.completedCombinations.find(
      (c) => !prevKq.completedCombinations.some((p) => p.suit === c.suit)
    );

    let kqMsg = '';
    if (newlyCompletedKq) {
      soundManager.playVictory();
      const teamLabel = newlyCompletedKq.team === 'TEAM_A' ? 'Team A' : 'Team B';
      kqMsg = ` 👑 KING + QUEEN! ${teamLabel} completed ${newlyCompletedKq.suit} (+${newlyCompletedKq.bonusPoints} bonus pts)!`;
    }

    const trickWinnerTeam = getPlayerTeam(winner) === 'TEAM_A' ? 'Team 1' : 'Team 2';
    const trickWonEvent = { time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }), message: `Trick won by ${trickWinnerTeam}` };

    // Check if this was trick 8 (Hand Over!)
    if (newCompletedTricks.length === 8) {
      this.state = { ...this.state, eventLog: [trickWonEvent, ...this.state.eventLog] };
      this.finalizeHand(newCompletedTricks);
      return;
    }

    // Start next trick
    const nextTrickNumber = newCompletedTricks.length + 1;
    const nextTrick: Trick = {
      number: nextTrickNumber,
      leadPlayerId: winner,
      cards: [],
      points: 0,
      hukumWasRevealedBeforeThisTrick: this.state.hukum?.isRevealed ?? false,
    };

    this.state = {
      ...this.state,
      phase: 'PLAYING_TRICKS',
      completedTricks: newCompletedTricks,
      currentTrick: nextTrick,
      currentTurn: winner,
      humanSkippedRevealThisTrick: false,
      aiSpeechBubbles: {},
      latestKqCelebration: newlyCompletedKq || null,
      actionMessage: `Trick ${completedTrick.number} complete. ${this.getPlayerName(
        winner
      )} leads Trick ${nextTrickNumber}.${kqMsg}`,
      eventLog: [trickWonEvent, ...this.state.eventLog],
    };

    this.notify();

    if (winner !== 'player1') {
      setTimeout(() => this.runAiTurn(), 1000);
    }
  }

  /**
   * Hand completed after 8 tricks
   */
  private finalizeHand(allTricks: Trick[]) {
    if (!this.state.declarer || !this.state.hukum) return;

    // Evaluate outcome factoring in King-Queen (K-Q) bonus and 4-point Hukum K-Q reduction
    const { result, updatedMatchScore } = evaluateHandOutcome(
      this.state.handNumber,
      this.state.declarer,
      this.state.finalBid,
      this.state.hukum,
      allTricks,
      this.state.matchScore,
      this.state.kqRuleConfig,
      this.state.originalBid,
      this.state.hukumKingQueenValid
    );

    if (result.bidSuccess) {
      soundManager.playVictory();
    } else {
      soundManager.playDefeat();
    }

    const bidderName = this.getPlayerName(result.bidder);
    const successText = result.bidSuccess ? 'SUCCESSFUL' : 'FAILED';

    const historyEntry: MatchHistoryEntry = {
      handNumber: this.state.handNumber,
      timestamp: Date.now(),
      dealer: this.state.dealer,
      declarer: this.state.declarer,
      biddingTeam: result.biddingTeam,
      finalBid: result.finalBid,
      hukumSuit: this.state.hukum.suit,
      hukumRevealedBy: this.state.hukum.revealedBy,
      teamAPoints: result.teamAPoints,
      teamBPoints: result.teamBPoints,
      teamAKQBonus: result.teamAKQBonus,
      teamBKQBonus: result.teamBKQBonus,
      teamATotalPoints: result.teamATotalPoints,
      teamBTotalPoints: result.teamBTotalPoints,
      bidSuccess: result.bidSuccess,
      matchScoreAfter: updatedMatchScore,
      kqCombinations: result.kqCombinations,
      tricks: allTricks,
    };

    this.state = {
      ...this.state,
      phase: 'HAND_OVER',
      completedTricks: allTricks,
      currentTrick: null,
      matchScore: updatedMatchScore,
      handResult: result,
      matchHistory: [...this.state.matchHistory, historyEntry],
      actionMessage: `Hand Complete! Bid was ${result.finalBid} by ${bidderName} (${result.biddingTeam}). Result: ${successText}! (Team A: ${result.teamATotalPoints} pts | Team B: ${result.teamBTotalPoints} pts)`,
    };

    this.notify();
  }

  /**
   * Move to next hand
   */
  public nextHand() {
    // Rotate dealer counter-clockwise: player4 -> player1 -> player2 -> player3 -> player4
    const nextDealer = getNextPlayer(this.state.dealer);
    this.state = {
      ...this.state,
      handNumber: this.state.handNumber + 1,
    };
    this.startNewHand(nextDealer);
  }

  public toggleAiExplanationModal(open?: boolean) {
    this.state = {
      ...this.state,
      isAiExplanationModalOpen: open !== undefined ? open : !this.state.isAiExplanationModalOpen,
    };
    this.notify();
  }

  public toggleMatchHistoryModal(open?: boolean) {
    this.state = {
      ...this.state,
      isMatchHistoryOpen: open !== undefined ? open : !this.state.isMatchHistoryOpen,
    };
    this.notify();
  }

  public setKqConfig(config: Partial<KQRuleConfig>) {
    this.state = {
      ...this.state,
      kqRuleConfig: {
        ...this.state.kqRuleConfig,
        ...config,
      },
    };
    this.notify();
  }

  public clearKqCelebration() {
    if (this.state.latestKqCelebration) {
      this.state = {
        ...this.state,
        latestKqCelebration: null,
      };
      this.notify();
    }
  }

  /**
   * Action: Show/reveal Trump King & Queen (Special Rule)
   * The player who holds BOTH Trump King and Trump Queen can show/reveal them during the round.
   * Once revealed:
   * 1. Mark the King + Queen rule as ACTIVE.
   * 2. Apply a 4-point reduction to that team's overall bid: finalPoints = Math.max(16, teamBid - 4).
   * 3. The final team points can NEVER be lower than 16.
   * 4. King and Queen do NOT give additional card points.
   */
  public revealTrumpKingQueen(playerId: PlayerId) {
    if (!this.state.hukum || !this.state.hukum.isRevealed) return;
    if (this.state.hukumKQRevealed) return;
    if (
      this.state.hukumKingOwnerId !== playerId ||
      this.state.hukumQueenOwnerId !== playerId
    ) {
      console.warn(`Player ${playerId} does not hold both Trump King and Queen`);
      return;
    }

    soundManager.playVictory();
    const originalBid = this.state.originalBid || this.state.finalBid || 16;
    const playerTeam = getPlayerTeam(playerId);
    const bidderTeam = this.state.declarer ? getPlayerTeam(this.state.declarer) : undefined;
    
    let finalBid = originalBid;
    if (bidderTeam && playerTeam !== bidderTeam) {
      finalBid = Math.min(28, originalBid + 2);
    } else {
      finalBid = Math.max(16, originalBid - 4);
    }
    const adjustment = finalBid - originalBid; // e.g. -4 or +2

    const playerName = this.getPlayerName(playerId);
    const teamLabel = playerTeam === 'TEAM_A' ? 'Team A' : 'Team B';

    this.state = {
      ...this.state,
      hukumKingRevealed: true,
      hukumQueenRevealed: true,
      hukumKQRevealed: true,
      hukumKQRevealedByPlayerId: playerId,
      hukumKQActive: true,
      hukumKingQueenValid: true,
      finalBid,
      kqAdjustment: adjustment,
      showKQRevealNotification: true,
      actionMessage: `👑 TRUMP KING + QUEEN REVEALED by ${playerName} (${teamLabel})! Team Bid: ${originalBid} | Adjustment: ${adjustment} | Final Team Points: ${finalBid}`,
      eventLog: [{ time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }), message: `👑 KING + QUEEN\nTrump: ${getSuitSymbol(this.state.hukum.suit)}\nPlayer: ${playerName}\nCards: K${getSuitSymbol(this.state.hukum.suit)} + Q${getSuitSymbol(this.state.hukum.suit)}\nOriginal Contract: ${originalBid}\nAdjusted Contract: ${finalBid}` }, ...this.state.eventLog],
      aiSpeechBubbles: {
        ...this.state.aiSpeechBubbles,
        [playerId]: '👑 Revealed Trump King + Queen!',
      },
    };

    this.notify();
  }

  public dismissKQRevealNotification() {
    this.state = {
      ...this.state,
      showKQRevealNotification: false,
    };
    this.notify();
  }
}

export const gameEngine = new TwentyEightGame();
