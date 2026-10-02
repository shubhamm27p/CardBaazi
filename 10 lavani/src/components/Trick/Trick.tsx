import React from 'react';
import type { PlayerId, Trick as TrickType } from '../../types/game';
import { Card } from '../Card/Card';
import './Trick.css';

interface TrickProps {
  trick: TrickType;
  players: Record<PlayerId, { name: string; team: 'teamA' | 'teamB' }>;
  isResolving: boolean;
  winningCardId?: string;
  winnerName?: string;
}

export const Trick: React.FC<TrickProps> = ({
  trick,
  players,
  isResolving,
  winningCardId,
  winnerName,
}) => {
  const getSlotClass = (playerId: PlayerId) => {
    switch (playerId) {
      case 'p1':
        return 'slot-bottom';
      case 'p2':
        return 'slot-right';
      case 'p3':
        return 'slot-top';
      case 'p4':
        return 'slot-left';
    }
  };

  const getCardRotation = (playerId: PlayerId) => {
    switch (playerId) {
      case 'p1':
        return 'rotate(0deg)';
      case 'p2':
        return 'rotate(-10deg)';
      case 'p3':
        return 'rotate(4deg)';
      case 'p4':
        return 'rotate(10deg)';
    }
  };

  return (
    <div className="trick-zone" data-testid="trick-zone">
      <span className="trick-center-mandala">☸</span>

      <span className="trick-compass-marker trick-compass-n">PRIYA</span>
      <span className="trick-compass-marker trick-compass-s">YOU</span>
      <span className="trick-compass-marker trick-compass-e">VIKRAM</span>
      <span className="trick-compass-marker trick-compass-w">AMIT</span>

      {trick.cards.length === 0 && (
        <div className="trick-empty-hint">
          <span>Trick {trick.trickNumber}/8</span>
          <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: 4 }}>
            {players[trick.leadPlayerId]?.name} to lead
          </div>
        </div>
      )}

      {trick.cards.map((played) => {
        const player = players[played.playerId];
        const isWinningCard = isResolving && played.card.id === winningCardId;

        return (
          <div
            key={played.card.id}
            className={`trick-card-slot ${getSlotClass(played.playerId)}`}
            style={{ transform: getCardRotation(played.playerId) }}
          >
            <span
              className={`played-player-tag ${
                player.team === 'teamA' ? 'team-a' : 'team-b'
              }`}
            >
              {player.name}
            </span>

            <Card
              card={played.card}
              size="medium"
              isWinning={isWinningCard}
            />
          </div>
        );
      })}

      {isResolving && winnerName && (
        <div className="trick-winner-banner">
          <span>🏆 {winnerName} wins trick!</span>
          {trick.cards.some((c) => c.card.isDehla) && (
            <span style={{ color: '#92400e', fontWeight: 900 }}>+1 DEHLA</span>
          )}
        </div>
      )}
    </div>
  );
};
