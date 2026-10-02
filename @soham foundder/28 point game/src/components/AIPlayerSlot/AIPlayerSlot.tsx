import React from 'react';
import { PlayerId, PlayerInfo } from '../../types/game';
import './AIPlayerSlot.css';

interface AIPlayerSlotProps {
  player: PlayerInfo;
  cardCount: number;
  isCurrentTurn: boolean;
  isDealer: boolean;
  actionMessage?: string;
}

export const AIPlayerSlot: React.FC<AIPlayerSlotProps> = ({
  player,
  cardCount,
  isCurrentTurn,
  isDealer,
  actionMessage,
}) => {
  const isPartner = player.team === 'TEAM_A';

  return (
    <div
      className={`ai-player-slot pos-${player.position} ${
        isCurrentTurn ? 'active-turn' : ''
      }`}
    >
      {/* Speech / Action Bubble */}
      {actionMessage && (
        <div className="action-bubble">
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Player Info Badge */}
      <div className="ai-info-card">
        <div className="avatar-frame">
          <span className="ai-avatar">{player.avatar}</span>
        </div>
        <div className="ai-details">
          <div className="ai-name-row">
            <span className="ai-name">{player.name}</span>
            {isDealer && <span className="dealer-pill" title="Dealer">DEALER</span>}
          </div>
          <span className={`ai-role-pill ${isPartner ? 'partner' : 'opponent'}`}>
            {isPartner ? 'Team A • Partner' : 'Team B • Opponent'}
          </span>
          {isCurrentTurn && (
            <div className="ai-turn-pill">
              <span className="pulse-dot" />
              <span>{player.name.toUpperCase()}'S TURN</span>
            </div>
          )}
        </div>
      </div>

      {/* Mini Card Backs Stack */}
      <div className="mini-cards-stack">
        {Array.from({ length: Math.min(cardCount, 8) }).map((_, idx) => (
          <div key={idx} className="mini-card-back" />
        ))}
      </div>
      <span className="cards-count-label">{cardCount} cards</span>
    </div>
  );
};
