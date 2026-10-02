import React, { useEffect, useMemo, useState } from 'react';
import { getPlayerTeam } from '../../game/bidding';
import { getSuitSymbol } from '../../game/cards';
import { FullGameState, gameEngine, PLAYERS } from '../../game/gameEngine';
import { soundManager } from '../../game/sound';
import { getPlayableCards } from '../../game/tricks';
import { Card as CardType, PlayerId } from '../../types/game';
import { AIPlayerSlot } from '../AIPlayerSlot/AIPlayerSlot';
import { BiddingPanel } from '../BiddingPanel/BiddingPanel';
import { HandResultModal } from '../HandResultModal/HandResultModal';
import { HukumSelectionModal } from '../HukumSelectionModal/HukumSelectionModal';
import { HukumSlot } from '../HukumSlot/HukumSlot';
import { MatchHistoryModal } from '../MatchHistoryModal/MatchHistoryModal';
import { TrickHistoryModal } from '../TrickHistoryModal/TrickHistoryModal';
import { PlayerHand } from '../PlayerHand/PlayerHand';
import { RulesModal } from '../RulesModal/RulesModal';
import { ScoreBoard } from '../ScoreBoard/ScoreBoard';
import { TrickArea } from '../TrickArea/TrickArea';
import './GameTable.css';

export const GameTable: React.FC = () => {
  const [gameState, setGameState] = useState<FullGameState>(gameEngine.getState());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(soundManager.isEnabled());
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [isMatchHistoryOpen, setIsMatchHistoryOpen] = useState<boolean>(false);
  const [isTrickHistoryOpen, setIsTrickHistoryOpen] = useState<boolean>(false);
  const [isResultModalHidden, setIsResultModalHidden] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = gameEngine.subscribe((newState) => {
      setGameState({ ...newState });
      if (newState.phase !== 'HAND_OVER') {
        setIsResultModalHidden(false);
      }
    });
    // Start initial hand
    gameEngine.startNewHand('player4');

    return () => {
      unsubscribe();
    };
  }, []);

  // Auto-dismiss K-Q Combination celebration toast after 3.5s
  useEffect(() => {
    if (gameState.latestKqCelebration) {
      const timer = setTimeout(() => {
        gameEngine.clearKqCelebration();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [gameState.latestKqCelebration]);

  // Auto-dismiss Trump King + Queen Reveal notification banner after 5s
  useEffect(() => {
    if (gameState.showKQRevealNotification) {
      const timer = setTimeout(() => {
        gameEngine.dismissKQRevealNotification();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [gameState.showKQRevealNotification]);

  const playersMap = useMemo(() => {
    const map: Record<
      PlayerId,
      { name: string; roleName: string; position: 'south' | 'east' | 'north' | 'west'; team: 'TEAM_A' | 'TEAM_B' }
    > = {
      player1: { name: 'You', roleName: 'You (Human Player)', position: 'south', team: 'TEAM_A' },
      player2: { name: 'Vikram', roleName: 'Vikram (AI Opponent 1)', position: 'east', team: 'TEAM_B' },
      player3: { name: 'Arjun', roleName: 'Arjun (AI Partner)', position: 'north', team: 'TEAM_A' },
      player4: { name: 'Rajesh', roleName: 'Rajesh (AI Opponent 2)', position: 'west', team: 'TEAM_B' },
    };
    return map;
  }, []);

  // Compute playable card IDs for Human player (Player 1)
  const playableCardIds = useMemo(() => {
    if (gameState.phase !== 'PLAYING_TRICKS') return new Set<string>();
    if (gameState.currentTurn !== 'player1') return new Set<string>();
    if (!gameState.currentTrick || !gameState.hukum) return new Set<string>();

    const legalCards = getPlayableCards(
      gameState.hands.player1,
      gameState.currentTrick.cards,
      gameState.hukum,
      gameState.justRevealedHukumThisTurn
    );

    return new Set(legalCards.map((c) => c.id));
  }, [
    gameState.phase,
    gameState.currentTurn,
    gameState.hands.player1,
    gameState.currentTrick,
    gameState.hukum,
    gameState.justRevealedHukumThisTurn,
  ]);

  const handleCardClick = (card: CardType) => {
    gameEngine.playCard('player1', card);
  };

  const handleBid = (amount: number) => {
    gameEngine.placeBid('player1', amount);
  };

  const handlePass = () => {
    gameEngine.passBid('player1');
  };

  const handleHold = () => {
    gameEngine.holdBid('player1');
  };

  const handleHukumConfirm = (suit: any, card: CardType) => {
    gameEngine.setSecretHukum('player1', suit, card);
  };

  const handleRevealHukum = () => {
    gameEngine.triggerHukumReveal('player1');
  };

  const handleSkipReveal = () => {
    gameEngine.skipHumanReveal();
  };

  const handleToggleSound = () => {
    const next = soundManager.toggleSound();
    setSoundEnabled(next);
  };

  const handleNewHand = () => {
    gameEngine.nextHand();
  };

  const handleNewGame = () => {
    gameEngine.startNewGame();
  };

  // Find recent action text for AI bubbles
  const getAiActionText = (pid: PlayerId): string | undefined => {
    // Check if AI performed a reveal action this trick
    if (gameState.aiSpeechBubbles?.[pid]) {
      return gameState.aiSpeechBubbles[pid];
    }

    const history = gameState.bidding.bidsHistory;
    const lastBid = [...history].reverse().find((b) => b.playerId === pid);

    if (
      (gameState.phase === 'BIDDING_PHASE_1' || gameState.phase === 'BIDDING_PHASE_2') &&
      lastBid
    ) {
      if (lastBid.action === 'HOLD') return `${lastBid.amount} I Do!`;
      return lastBid.action === 'BID' ? `Bid ${lastBid.amount}` : 'Pass';
    }

    if (gameState.currentTurn === pid && gameState.phase === 'PLAYING_TRICKS') {
      return 'Thinking...';
    }

    return undefined;
  };

  // Human player is always at the bottom (South)
  // AI Partner is always at the top (North)
  // AI Opponent 1 is always at the right (East)
  // AI Opponent 2 is always at the left (West)
  const aiNorth = PLAYERS.find((p) => p.id === 'player3')!;
  const aiEast = PLAYERS.find((p) => p.id === 'player2')!;
  const aiWest = PLAYERS.find((p) => p.id === 'player4')!;

  const isBiddingActive =
    gameState.phase === 'BIDDING_PHASE_1' || gameState.phase === 'BIDDING_PHASE_2';

  const isSelectingHukumHuman =
    gameState.phase === 'SELECTING_HUKUM' && gameState.declarer === 'player1';

  // Check if Human player can reveal Hukum this trick
  const ledSuit = gameState.currentTrick?.cards[0]?.card.suit;
  const isHumanTrickTurn =
    gameState.phase === 'PLAYING_TRICKS' && gameState.currentTurn === 'player1';
  const isHukumHidden = !!gameState.hukum && !gameState.hukum.isRevealed;
  const humanHasLedSuit = ledSuit
    ? gameState.hands.player1.some((c) => c.suit === ledSuit)
    : true;
  const canHumanRevealHukum =
    isHumanTrickTurn && isHukumHidden && !!ledSuit && !humanHasLedSuit;

  // Check if Human player holds both Trump K + Q and can reveal them
  const canHumanRevealKQ =
    !!gameState.hukum?.isRevealed &&
    gameState.hukumKQPairHolderId === 'player1' &&
    !gameState.hukumKQRevealed;

  return (
    <div className="game-container">
      {/* Top Scoreboard HUD */}
      <ScoreBoard
        handNumber={gameState.handNumber}
        matchScore={gameState.matchScore}
        completedTricks={gameState.completedTricks}
        finalBid={gameState.finalBid}
        originalBid={gameState.originalBid}
        hukumKingQueenValid={gameState.hukumKingQueenValid}
        declarerId={gameState.declarer}
        playersMap={playersMap}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenMatchHistory={() => setIsMatchHistoryOpen(true)}
        onOpenTrickHistory={() => setIsTrickHistoryOpen(true)}
        matchHistoryCount={gameState.matchHistory.length}
        onNewHand={handleNewHand}
        onNewGame={handleNewGame}
        trumpSuit={gameState.hukum?.suit}
        kqRuleConfig={gameState.kqRuleConfig}
      />

      {/* Narrative Action Bar Removed for Space */}

      {/* Card Table Viewport */}
      <main className="table-viewport">
        <div className="card-table-felt">
          {/* North Player (Arjun - AI Partner) ALWAYS AT TOP */}
          <AIPlayerSlot
            player={aiNorth}
            cardCount={gameState.hands.player3.length}
            isCurrentTurn={gameState.currentTurn === 'player3'}
            isDealer={gameState.dealer === 'player3'}
            actionMessage={getAiActionText('player3')}
          />

          {/* West Player (Rajesh - AI Opponent 2) ALWAYS AT LEFT */}
          <AIPlayerSlot
            player={aiWest}
            cardCount={gameState.hands.player4.length}
            isCurrentTurn={gameState.currentTurn === 'player4'}
            isDealer={gameState.dealer === 'player4'}
            actionMessage={getAiActionText('player4')}
          />

          {/* East Player (Vikram - AI Opponent 1) ALWAYS AT RIGHT */}
          <AIPlayerSlot
            player={aiEast}
            cardCount={gameState.hands.player2.length}
            isCurrentTurn={gameState.currentTurn === 'player2'}
            isDealer={gameState.dealer === 'player2'}
            actionMessage={getAiActionText('player2')}
          />

          {/* Center Table Area (Hukum Slot + Radial Trick Area) */}
          <div className="table-center-zone">
            <div className="table-side-hukum">
              <HukumSlot
                hukum={gameState.hukum}
                declarerId={gameState.declarer}
                playersMap={playersMap}
                isHumanDeclarer={gameState.declarer === 'player1'}
                canReveal={canHumanRevealHukum}
                onReveal={handleRevealHukum}
                hukumKingOwnerId={gameState.hukumKingOwnerId}
                hukumQueenOwnerId={gameState.hukumQueenOwnerId}
                hukumKingVisible={gameState.hukumKingVisible}
                hukumQueenVisible={gameState.hukumQueenVisible}
                hukumKQPairHolderId={gameState.hukumKQPairHolderId}
                hukumKQRevealed={gameState.hukumKQRevealed}
                hukumKingQueenValid={gameState.hukumKingQueenValid}
                originalBid={gameState.originalBid}
                finalBid={gameState.finalBid}
                onRevealKQ={() => gameEngine.revealTrumpKingQueen('player1')}
              />
            </div>

            <TrickArea
              currentTrick={gameState.currentTrick}
              lastTrickWinner={gameState.lastTrickWinner}
              playersMap={playersMap}
            />
          </div>

          {/* Bottom Player (Human - You) ALWAYS AT BOTTOM */}
          <PlayerHand
            cards={gameState.hands.player1}
            isMyTurn={isHumanTrickTurn}
            playableCardIds={playableCardIds}
            onCardClick={handleCardClick}
            dealerPlayerId={gameState.dealer}
            canRevealHukum={canHumanRevealHukum}
            ledSuit={ledSuit}
            hasSkippedReveal={gameState.humanSkippedRevealThisTrick}
            justRevealedHukum={gameState.justRevealedHukumThisTurn}
            revealedHukumSuit={gameState.hukum?.suit}
            onRevealHukum={handleRevealHukum}
            onSkipRevealHukum={handleSkipReveal}
            canRevealKQ={canHumanRevealKQ}
            onRevealKQ={() => gameEngine.revealTrumpKingQueen('player1')}
          />
        </div>
      </main>

      {/* Bidding Panel Overlay */}
      {isBiddingActive && (
        <BiddingPanel
          biddingState={gameState.bidding}
          isHumanTurn={gameState.bidding.turn === 'player1'}
          humanHand={gameState.hands.player1}
          playersMap={playersMap}
          onBid={handleBid}
          onHold={handleHold}
          onPass={handlePass}
        />
      )}

      {/* Trump King + Queen Reveal Notification Overlay */}
      {gameState.showKQRevealNotification && (
        <div
          className="trump-kq-notification-overlay"
          onClick={() => gameEngine.dismissKQRevealNotification()}
          title="Click to dismiss"
          data-testid="trump-kq-notification-modal"
        >
          <div className="trump-kq-notification-modal" onClick={(e) => e.stopPropagation()}>
            <div className="trump-kq-crown-icon">👑</div>
            <div className="trump-kq-banner-title">TRUMP KING + QUEEN REVEALED</div>
            {gameState.hukumKQRevealedByPlayerId && (
              <div className="trump-kq-player-sub">
                Revealed by {playersMap[gameState.hukumKQRevealedByPlayerId]?.name || 'Player'} (
                {getPlayerTeam(gameState.hukumKQRevealedByPlayerId) === 'TEAM_A' ? 'Team A' : 'Team B'}
                )
              </div>
            )}
            <div className="trump-kq-stats-box">
              <div className="trump-kq-stat-row">
                <span className="trump-kq-stat-label">Team Bid:</span>
                <span className="trump-kq-stat-val">{gameState.originalBid || gameState.finalBid}</span>
              </div>
              <div className="trump-kq-stat-row highlight">
                <span className="trump-kq-stat-label">Adjustment:</span>
                <span className="trump-kq-stat-val">-4</span>
              </div>
              <div className="trump-kq-stat-row final">
                <span className="trump-kq-stat-label">Final Team Points:</span>
                <span className="trump-kq-stat-val">{gameState.finalBid}</span>
              </div>
            </div>
            <div className="trump-kq-subtext">
              max(16, {(gameState.originalBid || gameState.finalBid)} - 4) = {gameState.finalBid}
            </div>
            <button
              type="button"
              className="trump-kq-dismiss-btn"
              onClick={() => gameEngine.dismissKQRevealNotification()}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* King–Queen Rule Celebration Animated Overlay (Section 9) */}
      {gameState.latestKqCelebration && (
        <div
          className="kq-celebration-toast"
          onClick={() => gameEngine.clearKqCelebration()}
          title="Click to dismiss"
        >
          <div className="kq-toast-content">
            <div className="kq-toast-crown">👑</div>
            <div className="kq-toast-header">KING + QUEEN COMBINATION!</div>
            <div className="kq-toast-sub">
              {(gameState.latestKqCelebration.capturingTeam || gameState.latestKqCelebration.team) === 'TEAM_A' ? 'TEAM A' : 'TEAM B'} CAPTURED{' '}
              {getSuitSymbol(gameState.latestKqCelebration.suit)} {gameState.latestKqCelebration.suit.toUpperCase()}{' '}
              {gameState.latestKqCelebration.isTrump ? '★ TRUMP ★' : ''}
            </div>
            <div className="kq-toast-bonus">
              +{gameState.latestKqCelebration.bonus ?? gameState.latestKqCelebration.bonusPoints} BONUS POINTS
            </div>
          </div>
        </div>
      )}

      {/* Human Secret Hukum Selection Dialog */}
      {isSelectingHukumHuman && (
        <HukumSelectionModal
          hand={gameState.hands.player1}
          winningBid={gameState.finalBid}
          onConfirm={handleHukumConfirm}
        />
      )}

      {/* Hand Result Modal (End of 8 Tricks) */}
      {gameState.phase === 'HAND_OVER' && gameState.handResult && !isResultModalHidden && (
        <HandResultModal
          result={gameState.handResult}
          playersMap={playersMap}
          onNextHand={handleNewHand}
          onNewGame={handleNewGame}
          onClose={() => setIsResultModalHidden(true)}
        />
      )}

      {/* Rules Modal */}
      {isRulesOpen && <RulesModal onClose={() => setIsRulesOpen(false)} />}

      {/* AI Explanation & Strategy Coach Modal (Section 13) */}


      {/* Match History & Hand Logs Modal */}
      {(isMatchHistoryOpen || gameState.isMatchHistoryOpen) && (
        <MatchHistoryModal
          history={gameState.matchHistory}
          playersMap={playersMap}
          onClose={() => {
            setIsMatchHistoryOpen(false);
            if (gameState.isMatchHistoryOpen) {
              gameEngine.toggleMatchHistoryModal(false);
            }
          }}
        />
      )}

      {/* Trick History Modal */}
      <TrickHistoryModal
        isOpen={isTrickHistoryOpen}
        history={gameState.completedTricks || []}
        playersMap={playersMap}
        onClose={() => setIsTrickHistoryOpen(false)}
      />
    </div>
  );
};
