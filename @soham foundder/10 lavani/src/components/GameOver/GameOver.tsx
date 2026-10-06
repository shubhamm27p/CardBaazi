import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { TeamId, TeamScore } from '../../types/game';
import { Card } from '../Card/Card';
import './GameOver.css';

interface GameOverProps {
  isOpen: boolean;
  teamScores: Record<TeamId, TeamScore>;
  onPlayAgain: () => void;
  onViewHistory: () => void;
  onClose: () => void;
  coinSettlement?: {
    changes: Record<string, number>;
    newBalances: Record<string, number>;
    winningTeamId: string;
  };
}

export const GameOver: React.FC<GameOverProps> = ({
  isOpen,
  teamScores,
  onPlayAgain,
  onViewHistory,
  onClose,
  coinSettlement,
}) => {
  const teamA = teamScores.teamA;
  const teamB = teamScores.teamB;

  const teamADehlas = teamA.dehlas.length;
  const teamBDehlas = teamB.dehlas.length;

  const isVictory =
    teamADehlas > teamBDehlas ||
    (teamADehlas === teamBDehlas && teamA.tricksWon > teamB.tricksWon);
  const isTie =
    teamADehlas === teamBDehlas && teamA.tricksWon === teamB.tricksWon;

  const isKot = teamA.isKot || teamB.isKot;
  const kotTeam = teamA.isKot ? 'Team A' : 'Team B';

  useEffect(() => {
    if (isOpen && isVictory) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#e5b95c', '#f59e0b', '#10b981', '#38bdf8', '#ffffff'],
        });
      } catch (e) {
        // Fallback if canvas confetti isn't supported in test environments
      }
    }
  }, [isOpen, isVictory]);

  if (!isOpen) return null;

  return (
    <div className="game-over-backdrop" data-testid="game-over-modal">
      <div className="game-over-modal">
        <button type="button" onClick={onClose} style={{ position: 'absolute', top: '10px', right: '15px', background: 'transparent', border: 'none', color: '#d4af37', fontSize: '24px', cursor: 'pointer', padding: '5px', zIndex: 10 }}>&times;</button>
        <div className="game-over-icon">
          {isVictory ? '🏆' : isTie ? '🤝' : '💀'}
        </div>

        <h1 className="game-over-title">
          {isVictory
            ? 'VICTORY FOR TEAM A!'
            : isTie
            ? 'A HARD-FOUGHT TIE!'
            : 'TEAM B TRIUMPHS!'}
        </h1>

        <p className="game-over-subtitle">
          {isVictory
            ? 'You and Priya outsmarted the opponents and captured the prize Dehlas!'
            : isTie
            ? 'Both teams captured equal Dehlas and tricks. A balanced contest!'
            : 'Vikram and Amit seized the crucial tricks and secured the victory.'}
        </p>

        {isKot && (
          <div className="kot-banner">
            ⭐ ROYAL KOT DECLARED BY {kotTeam}! ⭐
          </div>
        )}

        <div className="game-over-results-card">
          {/* Team A */}
          <div className="results-team-box team-a">
            <div className="results-team-title">Team A (You & Priya)</div>
            <div className="results-dehla-score">{teamADehlas} Dehlas</div>
            <div className="results-dehla-cards">
              {teamA.dehlas.length === 0 ? (
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  No Dehlas captured
                </span>
              ) : (
                teamA.dehlas.map((card) => (
                  <Card key={card.id} card={card} size="small" />
                ))
              )}
            </div>
            <div className="results-tricks-text">
              Tricks Won: {teamA.tricksWon} / 8
            </div>
          </div>

          {/* Team B */}
          <div className="results-team-box team-b">
            <div className="results-team-title">Team B (Vikram & Amit)</div>
            <div className="results-dehla-score">{teamBDehlas} Dehlas</div>
            <div className="results-dehla-cards">
              {teamB.dehlas.length === 0 ? (
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  No Dehlas captured
                </span>
              ) : (
                teamB.dehlas.map((card) => (
                  <Card key={card.id} card={card} size="small" />
                ))
              )}
            </div>
            <div className="results-tricks-text">
              Tricks Won: {teamB.tricksWon} / 8
            </div>
          </div>
        </div>

        {coinSettlement && (
          <div className="coin-settlement-section" style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '15px', marginTop: '20px', color: '#fff', fontFamily: 'monospace' }}>
            <h3 style={{ textAlign: 'center', color: '#F9D976', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 15px 0' }}>
              Coin Settlement
            </h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <div style={{ width: '45%' }}>
                <div style={{ marginBottom: '5px' }}>
                  Player 1 <span style={{ color: coinSettlement.changes.p1 >= 0 ? '#4CAF50' : '#F44336' }}>{coinSettlement.changes.p1 >= 0 ? '+' : ''}{coinSettlement.changes.p1}</span> &rarr; 🪙 {coinSettlement.newBalances.p1}
                </div>
                <div style={{ marginBottom: '5px' }}>
                  Player 3 <span style={{ color: coinSettlement.changes.p3 >= 0 ? '#4CAF50' : '#F44336' }}>{coinSettlement.changes.p3 >= 0 ? '+' : ''}{coinSettlement.changes.p3}</span> &rarr; 🪙 {coinSettlement.newBalances.p3}
                </div>
              </div>

              <div style={{ width: '45%', textAlign: 'right' }}>
                <div style={{ marginBottom: '5px' }}>
                  Player 2 <span style={{ color: coinSettlement.changes.p2 >= 0 ? '#4CAF50' : '#F44336' }}>{coinSettlement.changes.p2 >= 0 ? '+' : ''}{coinSettlement.changes.p2}</span> &rarr; 🪙 {coinSettlement.newBalances.p2}
                </div>
                <div style={{ marginBottom: '5px' }}>
                  Player 4 <span style={{ color: coinSettlement.changes.p4 >= 0 ? '#4CAF50' : '#F44336' }}>{coinSettlement.changes.p4 >= 0 ? '+' : ''}{coinSettlement.changes.p4}</span> &rarr; 🪙 {coinSettlement.newBalances.p4}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '10px', color: '#aaa' }}>
              TOTAL COINS: 🪙 400
            </div>
          </div>
        )}

        <div className="game-over-actions">
          <button
            className="play-again-btn"
            onClick={onPlayAgain}
            data-testid="play-again-btn"
          >
            Play Again
          </button>
          <button className="history-btn" onClick={onViewHistory}>
            Review Tricks
          </button>
        </div>
      </div>
    </div>
  );
};
