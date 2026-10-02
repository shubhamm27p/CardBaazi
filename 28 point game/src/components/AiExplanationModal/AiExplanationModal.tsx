import React from 'react';
import { AiExplanationData } from '../../types/game';
import './AiExplanationModal.css';

interface AiExplanationModalProps {
  explanation: AiExplanationData | null;
  onClose: () => void;
}

export const AiExplanationModal: React.FC<AiExplanationModalProps> = ({
  explanation,
  onClose,
}) => {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="ai-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ai-modal-header">
          <div className="ai-modal-title-wrap">
            <h2 className="ai-modal-title">🧠 AI Strategy Coach & Explanation Mode</h2>
            <span className="ai-modal-subtitle">
              Section 13 Real-time Decision Telemetry & Anti-Cheat Verification
            </span>
          </div>
          <button type="button" className="close-modal-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="ai-modal-body">
          {/* Anti-Cheat Badge */}
          <div className="anti-cheat-banner">
            <span className="anti-cheat-icon">🛡️</span>
            <div>
              <strong>Section 11 Anti-Cheat Rule Enforced:</strong> Strict information separation active.
              The AI evaluates moves strictly from its own hand, the current trick, and legally revealed cards.
              Hidden opponent cards and undealt cards are completely inaccessible.
            </div>
          </div>

          {explanation ? (
            <>
              {/* Formatted Cards & Metrics Grid */}
              <div className="ai-telemetry-grid">
                <div className="telemetry-card">
                  <span className="telemetry-label">AI Player</span>
                  <span className="telemetry-value highlight">{explanation.playerName}</span>
                </div>

                <div className="telemetry-card">
                  <span className="telemetry-label">AI Hand Strength</span>
                  <span
                    className={`telemetry-badge strength-${explanation.handStrength.toLowerCase()}`}
                  >
                    {explanation.handStrength}
                  </span>
                </div>

                <div className="telemetry-card">
                  <span className="telemetry-label">Current Bid</span>
                  <span className="telemetry-value">{explanation.currentBid} pts</span>
                </div>

                <div className="telemetry-card">
                  <span className="telemetry-label">Trump Suit</span>
                  <span className="telemetry-value">
                    {explanation.trumpSuit}{' '}
                    <small className="trump-status-tag">
                      {explanation.isTrumpRevealed ? '✓ Revealed' : '🔒 Secret'}
                    </small>
                  </span>
                </div>
              </div>

              {/* Current Trick & Legal Moves */}
              <div className="ai-section-box">
                <div className="ai-detail-row">
                  <span className="ai-detail-title">Current Trick:</span>
                  <span className="ai-detail-content current-trick-badge">
                    {explanation.currentTrickText}
                  </span>
                </div>

                <div className="ai-detail-row">
                  <span className="ai-detail-title">Available Legal Cards:</span>
                  <div className="legal-cards-list">
                    {explanation.availableLegalCards.map((cardStr, idx) => (
                      <span key={idx} className="legal-card-chip">
                        {cardStr}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="ai-detail-row">
                  <span className="ai-detail-title">Expected Trick Value:</span>
                  <span className="ai-detail-content points-badge">
                    {explanation.expectedTrickValue} points
                  </span>
                </div>
              </div>

              {/* Final Decision & Strategic Reasoning */}
              <div className="decision-callout">
                <div className="decision-header">
                  <span className="decision-tag">AI Decision</span>
                  <span className="decision-card-chosen">{explanation.decisionText}</span>
                </div>
                <div className="decision-reason">
                  <strong>Reasoning:</strong> {explanation.reason}
                </div>
              </div>

              {/* Section 13 Raw Debug Format */}
              <div className="raw-debug-box">
                <div className="raw-debug-title">📋 Section 13 Raw Explanation Output</div>
                <pre className="raw-debug-code">
{`AI Player: ${explanation.playerName}
AI Hand Strength: ${explanation.handStrength}
Current Bid: ${explanation.currentBid}
Trump: ${explanation.trumpSuit} (${explanation.isTrumpRevealed ? 'Revealed' : 'Secret'})
Current Trick: ${explanation.currentTrickText}
Available Legal Cards: ${explanation.availableLegalCards.join(', ')}
Expected Trick Value: ${explanation.expectedTrickValue} points
AI Decision: ${explanation.decisionText}
Reason: ${explanation.reason}`}
                </pre>
              </div>
            </>
          ) : (
            <div className="ai-empty-state">
              <span className="ai-empty-icon">⏳</span>
              <h3>No AI Turn Played Yet This Hand</h3>
              <p>
                As soon as an AI player (Arjun, Vikram, or Rajesh) makes a move in the trick phase,
                their complete hand evaluation, legal card options, expected trick points, and
                strategic reasoning will be displayed here!
              </p>
            </div>
          )}
        </div>

        <div className="ai-modal-footer">
          <button type="button" className="close-btn-primary" onClick={onClose}>
            Close AI Coach
          </button>
        </div>
      </div>
    </div>
  );
};
