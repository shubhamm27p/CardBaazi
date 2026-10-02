import React from 'react';
import { getSuitColor, getSuitSymbol } from '../../game/cards';
import { Card as CardType } from '../../types/game';
import './Card.css';

interface CardProps {
  card?: CardType;
  faceDown?: boolean;
  isPlayable?: boolean;
  isWinning?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({
  card,
  faceDown = false,
  isPlayable = false,
  isWinning = false,
  size = 'md',
  onClick,
  className = '',
  style,
}) => {
  if (!card && !faceDown) {
    return <div className={`playing-card empty-card-slot size-${size}`} style={style} />;
  }

  const isFlipped = faceDown || !card;
  const suitColor = card ? getSuitColor(card.suit) : 'black';
  const suitSymbol = card ? getSuitSymbol(card.suit) : '♠';

  const classNames = [
    'playing-card',
    `size-${size}`,
    suitColor,
    isFlipped ? 'flipped' : '',
    isPlayable ? 'playable' : card && !isFlipped ? 'unplayable' : '',
    isWinning ? 'winning-highlight' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} style={style} onClick={isPlayable ? onClick : undefined}>
      <div className="card-inner">
        {/* Card Front: Realistic Ivory Cardstock */}
        <div className="card-front">
          {card && (
            <>
              {/* Point Badge (J=3, 9=2, A=1, 10=1) */}
              {card.points > 0 && (
                <div
                  className={`card-points-badge points-${card.points}`}
                  title={`${card.points} card points in Twenty-Eight`}
                >
                  <span className="badge-star">★</span>
                  <span>{card.points} PT{card.points > 1 ? 'S' : ''}</span>
                </div>
              )}

              {/* Top-Left Rank & Suit */}
              <div className="card-corner top-left">
                <span className="corner-rank">{card.rank}</span>
                <span className="corner-suit">{suitSymbol}</span>
              </div>

              {/* Center Emblem Art with Royal Court / Suit Motif */}
              <div className="card-center-art">
                {card.rank === 'J' || card.rank === 'K' || card.rank === 'Q' ? (
                  <div className="court-card-figure">
                    <svg className="court-crown-svg" viewBox="0 0 100 100" fill="currentColor">
                      <path d="M15 75 L85 75 L80 40 L60 55 L50 25 L40 55 L20 40 Z" opacity="0.18" />
                      <circle cx="50" cy="22" r="5" opacity="0.25" />
                      <circle cx="20" cy="37" r="4" opacity="0.25" />
                      <circle cx="80" cy="37" r="4" opacity="0.25" />
                    </svg>
                    <span className="center-symbol court-rank">{suitSymbol}</span>
                    <span className="court-label">{card.rank === 'J' ? 'JACK' : card.rank === 'K' ? 'KING' : 'QUEEN'}</span>
                  </div>
                ) : (
                  <div className="pip-card-figure">
                    <span className="center-symbol">{suitSymbol}</span>
                  </div>
                )}
              </div>

              {/* Bottom-Right Rotated Rank & Suit */}
              <div className="card-corner bottom-right">
                <span className="corner-rank">{card.rank}</span>
                <span className="corner-suit">{suitSymbol}</span>
              </div>
            </>
          )}
        </div>

        {/* Card Back: Symmetrical Casino Pattern with Gold Laurel & Medallion */}
        <div className="card-back">
          <div className="card-back-pattern">
            <div className="card-back-inner-border">
              <div className="card-back-emblem">
                <span className="card-back-text">28</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
