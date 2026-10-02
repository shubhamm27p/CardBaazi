import React from 'react';
import type { Card, Suit, TeamId, TeamScore } from '../../types/game';
import { SUIT_SYMBOLS } from '../../engine/deck';
import './Scoreboard.css';

interface ScoreboardProps {
  teamScores: Record<TeamId, TeamScore>;
  trickNumber: number; // 1 to 8
}

const ALL_DEHLA_SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];

export const Scoreboard: React.FC<ScoreboardProps> = ({
  teamScores,
  trickNumber,
}) => {
  const teamA = teamScores.teamA;
  const teamB = teamScores.teamB;

  const renderDehlaSlots = (capturedDehlas: Card[]) => {
    return (
      <div className="score-dehla-slots">
        {ALL_DEHLA_SUITS.map((suit) => {
          const isCaptured = capturedDehlas.some((c) => c.suit === suit);
          const isRed = suit === 'hearts' || suit === 'diamonds';
          const symbol = SUIT_SYMBOLS[suit];

          return (
            <div
              key={suit}
              className={`dehla-slot ${
                isCaptured ? `captured ${isRed ? 'red' : 'black'}` : ''
              }`}
              title={
                isCaptured
                  ? `Captured 10${symbol}`
                  : `10${symbol} not yet captured`
              }
            >
              {symbol}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="scoreboard-container" data-testid="scoreboard">
      {/* Team A */}
      <div className="score-team-box team-a">
        <div className="score-team-header">
          <span className="score-team-name">Team A</span>
        </div>
        <span className="score-team-members">You & Priya</span>

        <div className="score-dehla-row">
          <span className="score-dehla-count">{teamA.dehlas.length}</span>
          {renderDehlaSlots(teamA.dehlas)}
        </div>

        <span className="score-tricks-info">Tricks: {teamA.tricksWon}/8</span>
      </div>

      <div className="score-divider" />

      {/* Trick indicator */}
      <div className="trick-indicator-box">
        <span className="trick-indicator-label">Trick</span>
        <span className="trick-indicator-value">
          {Math.min(trickNumber, 8)} / 8
        </span>
        <div className="trick-dots-row">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((t) => (
            <div
              key={t}
              className={`trick-dot ${
                t < trickNumber
                  ? 'completed'
                  : t === trickNumber
                  ? 'current'
                  : ''
              }`}
            />
          ))}
        </div>
      </div>

      <div className="score-divider" />

      {/* Team B */}
      <div className="score-team-box team-b">
        <div className="score-team-header">
          <span className="score-team-name">Team B</span>
        </div>
        <span className="score-team-members">Vikram & Amit</span>

        <div className="score-dehla-row">
          <span className="score-dehla-count">{teamB.dehlas.length}</span>
          {renderDehlaSlots(teamB.dehlas)}
        </div>

        <span className="score-tricks-info">Tricks: {teamB.tricksWon}/8</span>
      </div>
    </div>
  );
};
