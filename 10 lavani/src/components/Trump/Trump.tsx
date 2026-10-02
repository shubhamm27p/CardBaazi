import React from 'react';
import type { Card as CardType, GamePhase, Suit } from '../../types/game';
import { SUIT_NAMES, SUIT_SYMBOLS, SUITS } from '../../engine/deck';
import './Trump.css';

interface TrumpProps {
  trumpSuit: Suit | null;
  onOpenSelector?: () => void;
}

export const Trump: React.FC<TrumpProps> = ({ trumpSuit, onOpenSelector }) => {
  if (!trumpSuit) {
    return (
      <div className="trump-badge" onClick={onOpenSelector}>
        <span className="trump-symbol">❓</span>
        <div className="trump-info">
          <span className="trump-label">Hukum (Trump)</span>
          <span className="trump-name">Not Selected</span>
        </div>
      </div>
    );
  }

  const isRed = trumpSuit === 'hearts' || trumpSuit === 'diamonds';
  const symbol = SUIT_SYMBOLS[trumpSuit];
  const name = SUIT_NAMES[trumpSuit];

  return (
    <div
      className="trump-badge"
      title={`Hukum (Trump): ${name} (Trump beats all non-trump suits)`}
    >
      <span className={`trump-symbol ${isRed ? 'suit-red' : 'suit-black'}`}>
        {symbol}
      </span>
      <div className="trump-info">
        <span className="trump-label">Hukum (Trump)</span>
        <span className="trump-name">{trumpSuit.toUpperCase()}</span>
      </div>
    </div>
  );
};

interface CenterTrumpPanelProps {
  phase: GamePhase;
  first4Cards: CardType[];
  selectedTrump: Suit | null;
  hasPassedToPartner?: boolean;
  onPassToPartner: () => void;
  onProceedToHukum: () => void;
  onSelectTrump: (suit: Suit) => void;
}

export const CenterTrumpPanel: React.FC<CenterTrumpPanelProps> = ({
  phase,
  first4Cards,
  selectedTrump,
  hasPassedToPartner = false,
  onPassToPartner,
  onProceedToHukum,
  onSelectTrump,
}) => {
  const suitMeta: Record<Suit, { symbol: string; name: string; hindi: string; isRed: boolean }> = {
    spades: { symbol: '♠', name: 'Spades', hindi: 'Hukam', isRed: false },
    hearts: { symbol: '♥', name: 'Hearts', hindi: 'Paan', isRed: true },
    diamonds: { symbol: '♦', name: 'Diamonds', hindi: 'Eent', isRed: true },
    clubs: { symbol: '♣', name: 'Clubs', hindi: 'Chidi', isRed: false },
  };

  // Count occurrences in current hand
  const suitCounts = first4Cards.reduce(
    (acc, card) => {
      acc[card.suit] = (acc[card.suit] || 0) + 1;
      return acc;
    },
    {} as Record<Suit, number>
  );

  // 1. POST-SELECTION BRIEF CELEBRATION (Locks Hukum and shows confirmation)
  if (selectedTrump) {
    const meta = suitMeta[selectedTrump];
    return (
      <div className="center-trump-panel center-trump-confirmed" data-testid="trump-confirmed-panel">
        <span className={`center-trump-confirmed-symbol ${meta.isRed ? 'suit-red' : 'suit-black'}`}>
          {meta.symbol}
        </span>
        <h2 className="center-trump-confirmed-title">
          Hukum: {meta.symbol} {meta.name}
        </h2>
        <p className="center-trump-confirmed-desc">
          {hasPassedToPartner ? 'Declared by Partner Priya' : 'Declared by You'} • 8 Cards Dealt
        </p>
      </div>
    );
  }

  // 2. STEP 2: HUMAN DECISION (Only these two buttons shown)
  if (phase === 'evaluateHand') {
    return (
      <div className="center-trump-panel" data-testid="evaluate-hand-panel">
        <div className="center-trump-subtitle">First 4 Cards Dealt</div>
        <h2 className="center-trump-title">Human Decision</h2>

        <div className="pass-choice-container">
          <button
            className="pass-choice-btn weak-hand-btn"
            onClick={onPassToPartner}
            data-testid="pass-to-partner-btn"
          >
            <span className="pass-choice-icon">🤝</span>
            <span className="pass-choice-btn-title">PASS TO PARTNER</span>
            <span className="pass-choice-btn-desc">Partner Priya decides Hukum</span>
          </button>

          <button
            className="pass-choice-btn strong-hand-btn"
            onClick={onProceedToHukum}
            data-testid="choose-hukum-direct-btn"
          >
            <span className="pass-choice-icon">👑</span>
            <span className="pass-choice-btn-title">CHOOSE HUKUM</span>
            <span className="pass-choice-btn-desc">You choose Trump suit</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. STEP 3: PARTNER IS CHOOSING HUKUM (When human clicks PASS TO PARTNER)
  if (phase === 'partnerChoosingHukum') {
    return (
      <div className="center-trump-panel partner-choosing-panel" data-testid="partner-choosing-panel">
        <div className="center-trump-subtitle">Pass to Partner</div>
        <div className="partner-hukum-spinner">👩‍💼 🤝</div>
        <h2 className="partner-thinking-text">
          Priya is Choosing Hukum...
        </h2>
        <p className="partner-hukum-desc">
          You passed the decision to your partner. Priya is evaluating her 4 cards to declare Hukum for Team A.
        </p>
        <div className="partner-suits-row">
          <span className="partner-suit-pill">♠ Spades</span>
          <span className="partner-suit-pill" style={{ color: '#ef4444' }}>♥ Hearts</span>
          <span className="partner-suit-pill" style={{ color: '#ef4444' }}>♦ Diamonds</span>
          <span className="partner-suit-pill">♣ Clubs</span>
        </div>
      </div>
    );
  }

  // 4. STEP 4: CHOOSE HUKUM SCREEN (When human clicks CHOOSE HUKUM directly)
  return (
    <div className="center-trump-panel" data-testid="center-trump-panel">
      <div className="center-trump-subtitle">
        Your Call
      </div>
      <h2 className="center-trump-title">Choose Hukum</h2>

      <div className="center-trump-grid">
        {SUITS.map((suit) => {
          const meta = suitMeta[suit];
          const count = suitCounts[suit] || 0;

          return (
            <button
              key={suit}
              className="center-trump-btn"
              onClick={() => onSelectTrump(suit)}
              data-testid={`select-trump-${suit}`}
              title={`Select ${meta.name} as Hukum (Trump)`}
            >
              <span
                className={`center-trump-btn-symbol ${
                  meta.isRed ? 'suit-red' : 'suit-black'
                }`}
              >
                {meta.symbol}
              </span>
              <span className="center-trump-btn-name">{meta.name}</span>
              <span className="center-trump-btn-count">
                {count > 0 ? `${count} held` : '0 held'}
              </span>
            </button>
          );
        })}
      </div>

      <div className="center-trump-footer">
        Select exactly one Hukum suit. Remaining 4 cards will be dealt immediately.
      </div>
    </div>
  );
};
