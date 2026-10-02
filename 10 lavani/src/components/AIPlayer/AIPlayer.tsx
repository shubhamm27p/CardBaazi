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
      {thought || `${player.name} is deciding... (${difficulty})`}
    </div>
  );
};
