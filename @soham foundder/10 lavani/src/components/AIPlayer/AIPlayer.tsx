import React from 'react';
import type { Player as PlayerType, AIDifficulty } from '../../types/game';
import './AIPlayer.css';

interface AIPlayerProps {
  player: PlayerType;
  isActiveTurn: boolean;
  difficulty: AIDifficulty;
  thought?: string;
}

export const AIPlayer: React.FC<AIPlayerProps> = ({
  player,
  isActiveTurn,
  difficulty,
  thought,
}) => {
  if (!isActiveTurn && !thought) return null;

  return (
    <div className="ai-status-bubble" data-testid={`ai-status-${player.id}`}>
      {thought ? (
        <span>{thought}</span>
      ) : (
        <span>
          {isActiveTurn && `${player.name} is deciding... (${difficulty}) `}
        </span>
      )}
      <div className="ai-player-coins" style={{ marginTop: '4px', fontSize: '0.85em', color: '#ffd700', fontWeight: 'bold' }}>
        🪙 {player.coins}
      </div>
    </div>
  );
};
