import React, { useState, useEffect, useRef, useMemo } from 'react';
import type {
  GameState,
  PlayerId,
  Suit,
  GameSettings,
} from '../../types/game';
import {
  createInitialState,
  startNewGame,
  passHukumToPartner,
  partnerSelectHukumAndDeal,
  proceedToHukumSelection,
  selectHukumAndDealStage2,
  playCard,
  resolveTrick,
} from '../../engine/gameEngine';
import { SUIT_NAMES, SUIT_SYMBOLS } from '../../engine/deck';
import { getPlayableCards, evaluateTrickWinner } from '../../engine/rules';
import { chooseAICard } from '../../engine/ai';
import { soundManager } from '../../engine/sound';

import { Player } from '../Player/Player';
import { Trick } from '../Trick/Trick';
import { Trump, CenterTrumpPanel } from '../Trump/Trump';
import { Scoreboard } from '../Scoreboard/Scoreboard';
import { Deck } from '../Deck/Deck';
import { GameRules } from '../GameRules/GameRules';
import { GameOver } from '../GameOver/GameOver';
import { SettingsModal } from '../Modals/SettingsModal';
import { TrickHistoryModal } from '../Modals/TrickHistoryModal';
import { AIPlayer } from '../AIPlayer/AIPlayer';

import './GameTable.css';

export const GameTable: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialState()
  );

  // Modals state
  const [showRules, setShowRules] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isResultModalHidden, setIsResultModalHidden] = useState(false);
  const [aiThought, setAiThought] = useState<{
    playerId: PlayerId;
    text: string;
  } | null>(null);

  // Two-stage transition state
  const [transientTrump, setTransientTrump] = useState<Suit | null>(null);
  const [newCardIds, setNewCardIds] = useState<Set<string>>(new Set());

  // Timers ref to avoid race conditions or unmounted memory leaks
  const aiTimerRef = useRef<number | null>(null);
  const resolveTimerRef = useRef<number | null>(null);
  const stage2TimerRef = useRef<number | null>(null);
  const partnerHukumTimerRef = useRef<number | null>(null);

  // Speed delays based on user settings
  const delays = useMemo(() => {
    switch (gameState.settings.gameSpeed) {
      case 'instant':
        return { ai: 80, resolve: 250, stage2: 200, partnerHukum: 400 };
      case 'fast':
        return { ai: 400, resolve: 800, stage2: 450, partnerHukum: 850 };
      case 'normal':
      default:
        return { ai: 900, resolve: 1400, stage2: 700, partnerHukum: 1400 };
    }
  }, [gameState.settings.gameSpeed]);

  // Compute playable cards for human player (p1)
  const humanPlayableCardIds = useMemo(() => {
    const p1 = gameState.players.p1;
    // Strictly disable trick card gameplay before Hukum selection or when not human's turn
    if (
      gameState.phase !== 'playing' ||
      gameState.dealingStage !== 2 ||
      !gameState.trumpSuit ||
      gameState.currentTurn !== 'p1'
    ) {
      return new Set<string>();
    }
    const playable = getPlayableCards(
      p1.hand,
      gameState.currentTrick.leadSuit
    );
    return new Set(playable.map((c) => c.id));
  }, [
    gameState.phase,
    gameState.dealingStage,
    gameState.trumpSuit,
    gameState.currentTurn,
    gameState.players.p1.hand,
    gameState.currentTrick.leadSuit,
  ]);

  // Handle human card click (either trick play or pass selection)
  const handleHumanPlayCard = (cardId: string) => {
    if (
      gameState.phase !== 'playing' ||
      gameState.dealingStage !== 2 ||
      !gameState.trumpSuit ||
      gameState.currentTurn !== 'p1'
    ) {
      return;
    }
    if (!humanPlayableCardIds.has(cardId)) {
      soundManager.playClick();
      return; // Illegal move blocked!
    }

    setGameState((prev) => playCard(prev, 'p1', cardId));
  };

  // Handle starting a new game (Stage 1 Deal)
  const handleStartGame = () => {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current);
    if (stage2TimerRef.current) clearTimeout(stage2TimerRef.current);
    if (partnerHukumTimerRef.current) clearTimeout(partnerHukumTimerRef.current);
    setAiThought(null);
    setTransientTrump(null);
    setNewCardIds(new Set());
    setIsResultModalHidden(false);
    setGameState((prev) => startNewGame(prev, 'p1'));
  };

  // STEP 3: Human clicks "PASS TO PARTNER" -> Partner decides Hukum
  const handlePassToPartner = () => {
    soundManager.playClick();
    setGameState((prev) => passHukumToPartner(prev));
  };

  // STEP 4: Human clicks "CHOOSE HUKUM" directly -> Moves to same Choose Hukum screen
  const handleProceedToHukum = () => {
    soundManager.playClick();
    setGameState((prev) => proceedToHukumSelection(prev));
  };

  // Handle human selecting Hukum -> Triggers Stage 2 Deal
  const handleSelectTrump = (suit: Suit) => {
    setTransientTrump(suit);

    stage2TimerRef.current = window.setTimeout(() => {
      setGameState((prev) => {
        // Collect card IDs that will be newly added in Stage 2
        const remainingForP1 = prev.remainingDeck.slice(0, 4);
        setNewCardIds(new Set(remainingForP1.map((c) => c.id)));

        // Remove newCardIds after animation finishes
        setTimeout(() => {
          setNewCardIds(new Set());
        }, 1200);

        return selectHukumAndDealStage2(prev, suit);
      });
      setTransientTrump(null);
    }, delays.stage2);
  };

  // Handle settings update
  const handleUpdateSettings = (newSettings: Partial<GameSettings>) => {
    setGameState((prev) => {
      const merged = { ...prev.settings, ...newSettings };
      soundManager.setEnabled(merged.soundEnabled);
      return {
        ...prev,
        settings: merged,
      };
    });
  };

  // Automated AI Game Loop & Trick Resolution
  useEffect(() => {
    // 1. If phase is trickResolving, pause and evaluate
    if (gameState.phase === 'trickResolving') {
      resolveTimerRef.current = window.setTimeout(() => {
        setGameState((prev) => resolveTrick(prev));
      }, delays.resolve);

      return () => {
        if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current);
      };
    }

    // 2. If phase is partnerChoosingHukum (Partner Priya evaluates cards & chooses Hukum)
    if (gameState.phase === 'partnerChoosingHukum') {
      partnerHukumTimerRef.current = window.setTimeout(() => {
        setGameState((prev) => {
          if (prev.phase !== 'partnerChoosingHukum') return prev;

          const { nextState, chosenHukum } = partnerSelectHukumAndDeal(prev);

          soundManager.playTrumpSelect();
          soundManager.playDeal();

          const sym = SUIT_SYMBOLS[chosenHukum];
          const name = SUIT_NAMES[chosenHukum];

          setAiThought({
            playerId: 'p3',
            text: `Hukum: ${sym} ${name}! Let's win this round! 🏆`,
          });

          // Stage 2 deal animation for newly dealt 4 cards
          const remainingForP1 = prev.remainingDeck.slice(0, 4);
          setNewCardIds(new Set(remainingForP1.map((c) => c.id)));
          setTimeout(() => {
            setNewCardIds(new Set());
          }, 1400);

          // Show celebration banner
          setTransientTrump(chosenHukum);
          setTimeout(() => {
            setTransientTrump(null);
          }, 1400);

          return nextState;
        });
      }, delays.partnerHukum);

      return () => {
        if (partnerHukumTimerRef.current) clearTimeout(partnerHukumTimerRef.current);
      };
    }

    // 3. If phase is playing and it's an AI's turn
    if (
      gameState.phase === 'playing' &&
      gameState.dealingStage === 2 &&
      gameState.currentTurn !== 'p1' &&
      gameState.currentTrick.cards.length < 4
    ) {
      const activePlayerId = gameState.currentTurn;
      const activePlayer = gameState.players[activePlayerId];

      aiTimerRef.current = window.setTimeout(() => {
        // AI chooses legal card
        const cardToPlay = chooseAICard({
          playerId: activePlayerId,
          hand: activePlayer.hand,
          leadSuit: gameState.currentTrick.leadSuit,
          trumpSuit: gameState.trumpSuit,
          currentTrick: gameState.currentTrick,
          trickHistory: gameState.trickHistory,
          difficulty: gameState.settings.difficulty,
        });

        // Set thought
        setAiThought({
          playerId: activePlayerId,
          text: `${activePlayer.name} plays ${cardToPlay.rank}${cardToPlay.suit === 'spades' ? '♠' : cardToPlay.suit === 'hearts' ? '♥' : cardToPlay.suit === 'diamonds' ? '♦' : '♣'}`,
        });

        setGameState((prev) => playCard(prev, activePlayerId, cardToPlay.id));
      }, delays.ai);

      return () => {
        if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
      };
    }
  }, [
    gameState.phase,
    gameState.dealingStage,
    gameState.currentTurn,
    gameState.currentTrick.cards.length,
    delays.ai,
    delays.resolve,
    delays.partnerHukum,
  ]);

  // Determine winning card in resolving state
  const winningInfo = useMemo(() => {
    if (
      gameState.phase === 'trickResolving' &&
      gameState.currentTrick.cards.length === 4
    ) {
      try {
        const result = evaluateTrickWinner(
          gameState.currentTrick.cards,
          gameState.trumpSuit,
          gameState.currentTrick.leadSuit
        );
        return {
          cardId: result.winningCard.id,
          winnerName: gameState.players[result.winnerPlayerId].name,
        };
      } catch (e) {
        return null;
      }
    }
    return null;
  }, [
    gameState.phase,
    gameState.currentTrick.cards,
    gameState.trumpSuit,
    gameState.currentTrick.leadSuit,
    gameState.players,
  ]);

  const isPreHukumPhase =
    gameState.phase === 'evaluateHand' ||
    gameState.phase === 'partnerChoosingHukum' ||
    gameState.phase === 'selectTrump' ||
    transientTrump !== null;

  return (
    <div className="game-table-container">
      {/* Top HUD Bar */}
      <header className="game-top-bar">
        <div className="brand-section">
          <span className="brand-title">DEHLA PAKAD</span>
          <span className="brand-badge">32-Card Edition</span>
        </div>

        <div className="top-center-section">
          <Trump
            trumpSuit={gameState.trumpSuit}
            onOpenSelector={() => {
              if (gameState.phase === 'idle') handleStartGame();
            }}
          />

          <Scoreboard
            teamScores={gameState.teamScores}
            trickNumber={gameState.trickNumber}
          />
        </div>

        <div className="top-actions-section">
          <button
            className="hud-btn new-game-btn"
            onClick={handleStartGame}
            data-testid="new-game-btn"
          >
            🔄 New Game
          </button>

          <button
            className="hud-btn"
            onClick={() => setShowRules(true)}
            data-testid="rules-btn"
            title="Read Game Rules"
          >
            📖 Rules
          </button>

          <button
            className="hud-btn"
            onClick={() =>
              handleUpdateSettings({
                soundEnabled: !gameState.settings.soundEnabled,
              })
            }
            data-testid="sound-btn"
            title="Toggle Sound"
          >
            {gameState.settings.soundEnabled ? '🔊 Sound On' : '🔇 Mute'}
          </button>

          <button
            className="hud-btn"
            onClick={() => setShowHistory(true)}
            title="View trick-by-trick history"
          >
            📜 History
          </button>

          <button
            className="hud-btn"
            onClick={() => setShowSettings(true)}
            data-testid="settings-btn"
            title="Settings & AI Difficulty"
          >
            ⚙️ {gameState.settings.difficulty.toUpperCase()}
          </button>
        </div>
      </header>

      {/* Floating Status Notification */}
      <div className="game-status-banner" data-testid="status-message">
        {gameState.statusMessage}
      </div>

      {/* Playing Table Felt */}
      <main className="game-table-felt-area">
        <div className="poker-table-felt">
          {/* Wood Brass Inlay Accents */}
          <div className="wood-brass-corner wood-corner-tl" />
          <div className="wood-brass-corner wood-corner-tr" />
          <div className="wood-brass-corner wood-corner-bl" />
          <div className="wood-brass-corner wood-corner-br" />

          {/* North Seat: Priya (Partner - Team A) */}
          <Player
            player={gameState.players.p3}
            isActiveTurn={gameState.currentTurn === 'p3'}
            isResolving={gameState.phase === 'trickResolving'}
            dealingStage={gameState.dealingStage}
            isTrumpSelected={!isPreHukumPhase}
          />
          {((gameState.currentTurn === 'p3' && !isPreHukumPhase) || aiThought?.playerId === 'p3') && (
            <div style={{ position: 'absolute', top: 76, zIndex: 30 }}>
              <AIPlayer
                player={gameState.players.p3}
                isActiveTurn={gameState.currentTurn === 'p3'}
                difficulty={gameState.settings.difficulty}
                thought={aiThought?.playerId === 'p3' ? aiThought.text : undefined}
              />
            </div>
          )}

          {/* West Seat: Amit (Opponent - Team B) */}
          <Player
            player={gameState.players.p4}
            isActiveTurn={gameState.currentTurn === 'p4'}
            isResolving={gameState.phase === 'trickResolving'}
            dealingStage={gameState.dealingStage}
            isTrumpSelected={!isPreHukumPhase}
          />
          {gameState.currentTurn === 'p4' && !isPreHukumPhase && (
            <div style={{ position: 'absolute', left: 160, top: '46%', zIndex: 30 }}>
              <AIPlayer
                player={gameState.players.p4}
                isActiveTurn={true}
                difficulty={gameState.settings.difficulty}
                thought={aiThought?.playerId === 'p4' ? aiThought.text : undefined}
              />
            </div>
          )}

          {/* East Seat: Vikram (Opponent - Team B) */}
          <Player
            player={gameState.players.p2}
            isActiveTurn={gameState.currentTurn === 'p2'}
            isResolving={gameState.phase === 'trickResolving'}
            dealingStage={gameState.dealingStage}
            isTrumpSelected={!isPreHukumPhase}
          />
          {gameState.currentTurn === 'p2' && !isPreHukumPhase && (
            <div style={{ position: 'absolute', right: 160, top: '46%', zIndex: 30 }}>
              <AIPlayer
                player={gameState.players.p2}
                isActiveTurn={true}
                difficulty={gameState.settings.difficulty}
                thought={aiThought?.playerId === 'p2' ? aiThought.text : undefined}
              />
            </div>
          )}

          {/* CENTER TABLE AREA:
              1. If Pre-Hukum (Hand evaluation, Pass to Partner, or Hukum Selection):
                 Show dedicated Center Panel
              2. If Playing phase: Show Trick Zone
              3. If Idle: Show 32-card Deck
          */}
          {isPreHukumPhase ? (
            <CenterTrumpPanel
              phase={gameState.phase}
              first4Cards={gameState.players.p1.hand}
              selectedTrump={transientTrump}
              hasPassedToPartner={gameState.partnerPass.hasPassed}
              onPassToPartner={handlePassToPartner}
              onProceedToHukum={handleProceedToHukum}
              onSelectTrump={handleSelectTrump}
            />
          ) : gameState.phase !== 'idle' ? (
            <Trick
              trick={gameState.currentTrick}
              players={gameState.players}
              isResolving={gameState.phase === 'trickResolving'}
              winningCardId={winningInfo?.cardId}
              winnerName={winningInfo?.winnerName}
            />
          ) : (
            <Deck cardCount={32} onClick={handleStartGame} />
          )}

          {/* South Seat: You (Human - Team A) */}
          <Player
            player={gameState.players.p1}
            isActiveTurn={gameState.currentTurn === 'p1'}
            playableCardIds={humanPlayableCardIds}
            onPlayCard={handleHumanPlayCard}
            isResolving={gameState.phase === 'trickResolving'}
            dealingStage={gameState.dealingStage}
            isTrumpSelected={!isPreHukumPhase}
            newCardIds={newCardIds}
          />
        </div>

        {/* Start Game Prompt Overlay when Idle */}
        {gameState.phase === 'idle' && (
          <div className="idle-overlay">
            <div className="idle-card-box">
              <h2 className="idle-title">देहली पकड़ • DEHLA PAKAD</h2>
              <p className="idle-desc">
                Traditional 32-card Indian trick-taking partnership game.
                Evaluate your first 4 cards, choose to pass cards to Priya or choose Hukum, and capture the four 10s!
              </p>
              <button
                className="start-big-btn"
                onClick={handleStartGame}
                data-testid="start-game-btn"
              >
                Deal & Play
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Game Rules Modal */}
      <GameRules isOpen={showRules} onClose={() => setShowRules(false)} />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={gameState.settings}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Trick History Modal */}
      <TrickHistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        history={gameState.trickHistory}
        players={gameState.players}
      />

      {/* Game Over Modal */}
      {(!isResultModalHidden) && (
        <GameOver
          isOpen={gameState.phase === 'roundOver'}
          teamScores={gameState.teamScores}
          onPlayAgain={handleStartGame}
          onViewHistory={() => setShowHistory(true)}
          onClose={() => setIsResultModalHidden(true)}
        />
      )}
    </div>
  );
};
