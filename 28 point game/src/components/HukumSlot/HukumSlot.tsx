import React from 'react';
import { getSuitColor, getSuitSymbol } from '../../game/cards';
import { getPlayerTeam } from '../../game/bidding';
import { SecretHukum } from '../../game/trump';
import { PlayerId } from '../../types/game';
import { Card } from '../Card/Card';
import './HukumSlot.css';

interface HukumSlotProps {
  hukum: SecretHukum | null;
  declarerId: PlayerId | null;
  playersMap: Record<PlayerId, { name: string }>;
  isHumanDeclarer: boolean;
  canReveal?: boolean;
  onReveal?: () => void;
  hukumKingOwnerId?: PlayerId | null;
  hukumQueenOwnerId?: PlayerId | null;
  hukumKingVisible?: boolean;
  hukumQueenVisible?: boolean;
  hukumKQPairHolderId?: PlayerId | null;
  hukumKQRevealed?: boolean;
  hukumKingQueenValid?: boolean;
  originalBid?: number;
  finalBid?: number;
  onRevealKQ?: () => void;
}

export const HukumSlot: React.FC<HukumSlotProps> = ({
  hukum,
  declarerId,
  playersMap,
  isHumanDeclarer,
  canReveal = false,
  onReveal,
  hukumKingOwnerId = null,
  hukumQueenOwnerId = null,
  hukumKingVisible: _hukumKingVisible = false,
  hukumQueenVisible: _hukumQueenVisible = false,
  hukumKQPairHolderId = null,
  hukumKQRevealed = false,
  hukumKingQueenValid = false,
  originalBid,
  finalBid,
  onRevealKQ,
}) => {
  if (!hukum) {
    return (
      <div className="hukum-slot-container">
        <div className="hukum-slot-header">
          <span className="hukum-title">TRUMP</span>
          <span className="hukum-status-badge hidden">PENDING</span>
        </div>
        <div className="hukum-card-wrapper">
          <Card faceDown={true} size="sm" />
        </div>
        <span className="hukum-secret-hint">Awaiting Auction</span>
      </div>
    );
  }

  const isRevealed = hukum.isRevealed;
  const declarerName = declarerId ? playersMap[declarerId]?.name : 'Unknown';
  const suitColor = getSuitColor(hukum.suit);
  const suitSymbol = getSuitSymbol(hukum.suit);

  const decidingTeam = declarerId ? getPlayerTeam(declarerId) : 'TEAM_A';
  const decidingTeamLabel = decidingTeam === 'TEAM_A' ? 'Team A' : 'Team B';
  const displayOriginalBid = originalBid || finalBid || 16;
  const displayFinalBid = finalBid || originalBid || 16;

  const kingOwnerName = hukumKingOwnerId ? playersMap[hukumKingOwnerId]?.name : null;
  const queenOwnerName = hukumQueenOwnerId ? playersMap[hukumQueenOwnerId]?.name : null;
  const canHumanRevealKQ = isRevealed && hukumKQPairHolderId === 'player1' && !hukumKQRevealed;

  return (
    <div className={`hukum-slot-container ${isRevealed ? 'revealed-glow' : ''}`}>
      <div className="hukum-slot-header">
        <span className="hukum-title">TRUMP</span>
        <span className={`hukum-status-badge ${isRevealed ? 'revealed' : 'hidden'}`}>
          {isRevealed ? 'REVEALED' : 'SECRET'}
        </span>
      </div>

      <div
        className={`hukum-card-wrapper ${canReveal && !isRevealed ? 'can-reveal-glow' : ''}`}
        onClick={canReveal && !isRevealed ? onReveal : undefined}
        title={canReveal && !isRevealed ? 'Click to Reveal Secret Trump!' : undefined}
        style={{ cursor: canReveal && !isRevealed ? 'pointer' : 'default' }}
      >
        <Card
          card={isRevealed ? hukum.card : undefined}
          faceDown={!isRevealed}
          size="sm"
        />
        {canReveal && !isRevealed && (
          <span className="hukum-click-prompt">🎺 Click to Reveal</span>
        )}
      </div>

      {isRevealed ? (
        <div className={`hukum-revealed-badge ${suitColor}`}>
          <span className="hukum-revealed-icon">{suitSymbol}</span>
          <span className="hukum-revealed-name">{hukum.suit}</span>
        </div>
      ) : isHumanDeclarer ? (
        <div className="hukum-declarer-hint">
          <span className="hint-label">Your Secret:</span>
          <span className={`hint-suit ${suitColor}`}>
            {suitSymbol} {hukum.suit}
          </span>
        </div>
      ) : (
        <span className="hukum-secret-hint">
          Locked by {declarerName}
        </span>
      )}

      {/* Trump King & Queen + Team Point System Display (Sections 1, 3, 5, 8) */}
      {isRevealed && (
        <div className="hukum-kq-panel" data-testid="trump-kq-panel">
          <div className="hukum-kq-suit-header">
            <span className="kq-suit-heading">
              🃏 TRUMP / HUKUM: <strong className={suitColor}>{suitSymbol}</strong>
            </span>
          </div>

          <div className="hukum-kq-cards-group">
            {/* King Line */}
            <div className="hukum-kq-card-row">
              <span className="kq-card-label">KING:</span>
              <span className={`kq-card-sym ${suitColor}`}>{suitSymbol}K</span>
              <span className="kq-card-desc">
                — King {kingOwnerName ? `(${kingOwnerName})` : '(Present)'}
              </span>
            </div>

            {/* Queen Line */}
            <div className="hukum-kq-card-row">
              <span className="kq-card-label">QUEEN:</span>
              <span className={`kq-card-sym ${suitColor}`}>{suitSymbol}Q</span>
              <span className="kq-card-desc">
                — Queen {queenOwnerName ? `(${queenOwnerName})` : '(Present)'}
              </span>
            </div>
          </div>

          {/* Action button if Human holds both K+Q and has not revealed yet */}
          {canHumanRevealKQ && onRevealKQ && (
            <div className="hukum-kq-action-box">
              <button
                type="button"
                className="hukum-reveal-kq-btn"
                onClick={onRevealKQ}
                title="Show/Reveal Trump King & Queen to apply 4-point reduction to your team's bid!"
              >
                👑 Reveal Trump K + Q
              </button>
            </div>
          )}

          {/* Team Bid & Bonus Rule Section */}
          <div className="hukum-team-bid-section">
            {hukumKingQueenValid ? (
              <div className="hukum-rule-box active" data-testid="kq-rule-active">
                <div className="hukum-rule-badge active">
                  👑 TRUMP KING + QUEEN REVEALED
                </div>
                <div className="hukum-bid-row">
                  <span className="bid-row-label">Team Bid:</span>
                  <span className="bid-row-value">{displayOriginalBid}</span>
                </div>
                <div className="hukum-bid-row highlight-adj">
                  <span className="bid-row-label">Adjustment:</span>
                  <span className="bid-row-value">-4</span>
                </div>
                <div className="hukum-final-pts-row active">
                  <span className="final-pts-label">Final Team Points:</span>
                  <span className="final-pts-num">{displayFinalBid}</span>
                </div>
                <span className="hukum-calc-sub">
                  max(16, {displayOriginalBid} - 4) = {displayFinalBid}
                </span>
              </div>
            ) : (
              <div className="hukum-rule-box inactive" data-testid="kq-rule-inactive">
                <div className="hukum-rule-badge inactive">
                  TRUMP K + Q BONUS RULE: INACTIVE
                </div>
                <div className="hukum-bid-row">
                  <span className="bid-row-label">{decidingTeamLabel} Bid:</span>
                  <span className="bid-row-value">{displayOriginalBid}</span>
                </div>
                <div className="hukum-final-pts-row inactive">
                  <span className="final-pts-label">Final Team Points:</span>
                  <span className="final-pts-num">{displayFinalBid}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
