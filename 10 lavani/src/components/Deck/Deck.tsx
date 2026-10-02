import React from 'react';
import { Card } from '../Card/Card';
import './Deck.css';

interface DeckProps {
  cardCount: number;
  onClick?: () => void;
  isDealing?: boolean;
}

export const Deck: React.FC<DeckProps> = ({
  cardCount,
  onClick,
  isDealing = false,
}) => {
  return (
    <div
      className={`deck-container ${isDealing ? 'is-dealing' : ''}`}
      onClick={onClick}
      title="32-Card Deck (7, 8, 9, 10, J, Q, K, A)"
      data-testid="game-deck"
    >
      <div className="deck-pile">
        <div className="deck-shadow-card shadow-1" />
        <div className="deck-shadow-card shadow-2" />
        <Card isBack={true} size="medium" />
        <div className="deck-center-badge">
          <span className="deck-count-num">{cardCount}</span>
          <span className="deck-count-label">Cards</span>
        </div>
      </div>
      <span className="deck-label">32-Card Deck</span>
    </div>
  );
};
