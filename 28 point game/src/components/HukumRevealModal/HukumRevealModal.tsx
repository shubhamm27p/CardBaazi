import React from 'react';
import { Suit } from '../../types/game';
import './HukumRevealModal.css';

interface HukumRevealModalProps {
  ledSuit: Suit;
  onConfirmReveal: () => void;
  onCancel: () => void;
}

export const HukumRevealModal: React.FC<HukumRevealModalProps> = ({
  ledSuit,
  onConfirmReveal,
  onCancel,
}) => {
  return (
    <div className="modal-backdrop">
      <div className="reveal-dialog">
        <span className="reveal-icon">🎺</span>
        <h2 className="reveal-title">Reveal Hukum?</h2>
        <p className="reveal-description">
          You have no cards of the led suit (<strong>{ledSuit}</strong>). Would you like to legally
          request to reveal the hidden Hukum (Trump) suit now?
          <br />
          <br />
          <em>
            Once revealed, the trump suit becomes active for all players, and if you hold cards of the
            trump suit, you must play one to cut this trick!
          </em>
        </p>

        <div className="reveal-actions">
          <button type="button" className="reveal-btn cancel-btn" onClick={onCancel}>
            CANCEL
          </button>
          <button
            type="button"
            className="reveal-btn confirm-reveal-btn"
            onClick={onConfirmReveal}
          >
            REVEAL HUKUM
          </button>
        </div>
      </div>
    </div>
  );
};
