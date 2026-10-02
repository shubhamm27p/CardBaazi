import React from 'react';
import { getSuitSymbol } from '../../game/cards';
import { PlayerId, Trick } from '../../types/game';
import { Card } from '../Card/Card';
import './TrickArea.css';

interface TrickAreaProps {
  currentTrick: Trick | null;
  lastTrickWinner: PlayerId | null;
  playersMap: Record<PlayerId, { name: string; position: 'south' | 'east' | 'north' | 'west' }>;
}

export const TrickArea: React.FC<TrickAreaProps> = ({
  currentTrick,
  lastTrickWinner,
  playersMap,
}) => {
  if (!currentTrick) {
    return (
      <div className="trick-area-container">
        <div className="trick-felt-ring">
          <span className="trick-center-logo">28</span>
        </div>
      </div>
    );
  }

  const ledSuit = currentTrick.cards.length > 0 ? currentTrick.cards[0].card.suit : null;
  const isResolving = currentTrick.cards.length === 4;
  const breakdownStr =
    currentTrick.cards.length > 0
      ? currentTrick.cards.map((c) => `${c.card.rank}=${c.card.points}`).join(' + ')
      : null;

  return (
    <div className="trick-area-container">
      {/* Trick Info Badges */}
      <div className="trick-info-badges">
        <span className="trick-badge">Trick {currentTrick.number}/8</span>
        {ledSuit && (
          <span className="trick-badge">
            Led: {getSuitSymbol(ledSuit)} {ledSuit}
          </span>
        )}
        <span
          className="trick-badge points-badge"
          title={breakdownStr ? `${breakdownStr} = ${currentTrick.points} pts` : undefined}
        >
          Points: {currentTrick.points}
          {breakdownStr && <small className="points-sub-text"> ({breakdownStr})</small>}
        </span>
      </div>

      {/* Decorative Felt Ring */}
      <div className="trick-felt-ring">
        <span className="trick-center-logo">28</span>
      </div>

      {/* Played Cards */}
      {currentTrick.cards.map((pc) => {
        const playerInfo = playersMap[pc.playerId];
        const isWinner =
          isResolving &&
          currentTrick.winningCard &&
          currentTrick.winningCard.id === pc.card.id;

        return (
          <div
            key={`${pc.card.id}_${pc.playerId}`}
            className={`played-card-spot pos-${playerInfo.position}`}
          >
            <Card card={pc.card} isWinning={isWinner} size="md" />
            <span className="played-card-player-label">{playerInfo.name}</span>
          </div>
        );
      })}

      {/* Winner Banner on Complete */}
      {isResolving && currentTrick.winnerPlayerId && (
        <div className="trick-winner-banner">
          🏆 {playersMap[currentTrick.winnerPlayerId].name} takes trick (+
          {currentTrick.points} pts)!
        </div>
      )}
    </div>
  );
};
