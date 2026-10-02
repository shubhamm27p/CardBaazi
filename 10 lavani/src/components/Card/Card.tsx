import React from 'react';
import type { Card as CardType } from '../../types/game';
import { SUIT_SYMBOLS } from '../../engine/deck';
import { CenterEmblem, LuxuryCardBack } from './CardEmblems';
import './Card.css';

interface CardProps {
  card?: CardType;
  isBack?: boolean;
  isPlayable?: boolean;
  isIllegal?: boolean;
  isWinning?: boolean;
  isPassSelected?: boolean;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  customBadge?: string;
}

export const Card: React.FC<CardProps> = ({
  card,
  isBack = false,
  isPlayable = false,
  isIllegal = false,
  isWinning = false,
  isPassSelected = false,
  size = 'large',
  onClick,
  className = '',
  style,
  customBadge,
}) => {
  if (isBack || !card) {
    return (
      <div
        className={`game-card card-back size-${size} ${className}`}
        style={style}
        onClick={onClick}
        data-testid="card-back"
      >
        <LuxuryCardBack size={size} />
      </div>
    );
  }

  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const suitClass = isRed ? 'suit-red' : 'suit-black';
  const suitSymbol = SUIT_SYMBOLS[card.suit];

  return (
    <div
      className={`game-card card-front size-${size} ${suitClass} ${
        card.isDehla ? 'is-dehla' : ''
      } ${isPlayable ? 'is-playable' : ''} ${
        isIllegal ? 'is-illegal' : ''
      } ${isWinning ? 'is-winning' : ''} ${
        isPassSelected ? 'is-pass-selected' : ''
      } ${className}`}
      style={style}
      onClick={onClick}
      title={
        card.isDehla
          ? `${card.rank}${suitSymbol} (DEHLA - Key Target!)`
          : isIllegal
          ? 'Must follow lead suit'
          : `${card.rank}${suitSymbol}`
      }
      data-testid={`card-${card.id}`}
    >
      {/* Subtle Inner Linen Border */}
      <div className="card-inner-border" />

      {/* Top Left Index */}
      <div className="card-corner corner-top-left">
        <span className="corner-rank">{card.rank}</span>
        <span className="corner-suit">{suitSymbol}</span>
      </div>

      {/* Center Decorative Emblem */}
      <div className="card-center">
        <CenterEmblem
          suit={card.suit}
          rank={card.rank}
          isDehla={card.isDehla}
          size={size}
        />
      </div>

      {/* Bottom Right Inverted Index (Rotated 180°) */}
      <div className="card-corner corner-bottom-right">
        <span className="corner-rank">{card.rank}</span>
        <span className="corner-suit">{suitSymbol}</span>
      </div>

      {/* Custom or Dehla Top Corner Indicator if requested */}
      {customBadge && <span className="dehla-tag-badge">{customBadge}</span>}
    </div>
  );
};
