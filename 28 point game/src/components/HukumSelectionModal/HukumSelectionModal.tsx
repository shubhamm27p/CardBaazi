import React, { useState } from 'react';
import { getSuitColor, getSuitSymbol, SUITS } from '../../game/cards';
import { Card, Suit } from '../../types/game';
import './HukumSelectionModal.css';

interface HukumSelectionModalProps {
  hand: Card[];
  winningBid: number;
  onConfirm: (suit: Suit, card: Card) => void;
}

export const HukumSelectionModal: React.FC<HukumSelectionModalProps> = ({
  hand,
  winningBid,
  onConfirm,
}) => {
  // Pre-select suit with most cards or highest rank
  const initialSuit = hand[0]?.suit || 'SPADES';
  const [selectedSuit, setSelectedSuit] = useState<Suit>(initialSuit);

  const cardsOfSelectedSuit = hand.filter((c) => c.suit === selectedSuit);
  // Pick indicator card: lowest card of that suit if possible, or any card
  const indicatorCard =
    cardsOfSelectedSuit.length > 0
      ? cardsOfSelectedSuit.reduce((min, c) => (c.rankPower < min.rankPower ? c : min))
      : hand[0];

  const handleConfirm = () => {
    onConfirm(selectedSuit, indicatorCard);
  };

  return (
    <div className="modal-backdrop">
      <div className="hukum-selection-dialog">
        <h2 className="hukum-dialog-title">Choose Secret Hukum (Trump)</h2>
        <p className="hukum-dialog-subtitle">
          You won the auction with a bid of <strong>{winningBid}</strong>! Select your secret
          Hukum suit. This will remain secret from other players until revealed during play.
        </p>

        <div className="hukum-suit-cards-grid">
          {SUITS.map((suit) => {
            const isSelected = selectedSuit === suit;
            const color = getSuitColor(suit);
            const countInHand = hand.filter((c) => c.suit === suit).length;

            return (
              <div
                key={suit}
                className={`suit-option-card ${isSelected ? 'selected' : ''} ${
                  countInHand > 0 ? 'has-cards' : ''
                }`}
                onClick={() => setSelectedSuit(suit)}
              >
                <span className={`suit-big-symbol ${color}`}>{getSuitSymbol(suit)}</span>
                <span className="suit-name-label">{suit}</span>
                <span className="suit-in-hand-count">{countInHand} in hand</span>
              </div>
            );
          })}
        </div>

        <button type="button" className="hukum-confirm-btn" onClick={handleConfirm}>
          CONFIRM {selectedSuit} AS SECRET HUKUM
        </button>
      </div>
    </div>
  );
};
