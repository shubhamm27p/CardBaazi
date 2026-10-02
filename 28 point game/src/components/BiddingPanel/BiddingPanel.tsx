import React from 'react';
import { evaluateHandStrength } from '../../game/ai';
import { BiddingState, MAX_BID, MIN_BID } from '../../game/bidding';
import { Card as CardType, PlayerId } from '../../types/game';
import './BiddingPanel.css';

interface BiddingPanelProps {
  biddingState: BiddingState;
  isHumanTurn: boolean;
  humanHand: CardType[];
  playersMap: Record<PlayerId, { name: string; roleName?: string }>;
  onBid: (amount: number) => void;
  onHold?: () => void;
  onPass: () => void;
}

export const BiddingPanel: React.FC<BiddingPanelProps> = ({
  biddingState,
  isHumanTurn,
  humanHand = [],
  playersMap,
  onBid,
  onHold,
  onPass,
}) => {
  const currentBid = biddingState.currentBid;
  const isHoldScenario = !!biddingState.holdCandidate && isHumanTurn;
  const holdAmount = biddingState.holdCandidate?.amount || 0;
  const challengerName = biddingState.holdCandidate
    ? playersMap[biddingState.holdCandidate.challenger]?.name
    : '';

  const minPossible = isHoldScenario
    ? holdAmount + 1
    : currentBid === 0
    ? MIN_BID
    : currentBid + 1;

  const highestBidderName = biddingState.highestBidder
    ? playersMap[biddingState.highestBidder]?.name
    : 'None';

  const turnPlayerInfo = playersMap[biddingState.turn];
  const turnPlayerName = turnPlayerInfo?.roleName || turnPlayerInfo?.name || biddingState.turn;

  const handEval = evaluateHandStrength(humanHand || []);

  const allCandidateBids = [
    minPossible,
    minPossible + 1 <= MAX_BID ? minPossible + 1 : null,
    16,
    17,
    18,
    19,
    20,
    21,
    22,
    24,
    26,
    28,
  ].filter(
    (amt): amt is number =>
      amt !== null && amt >= minPossible && amt <= MAX_BID
  );

  const legalBids = Array.from(new Set(allCandidateBids)).sort((a, b) => a - b);

  // 1. AI Turn Compact Status (Non-blocking)
  if (!isHumanTurn) {
    return (
      <div className="bidding-panel-docked ai-turn-compact">
        <div className="compact-bidding-status">
          <span className="pulse-dot" />
          <span className="compact-turn-msg">
            <strong>{turnPlayerName}</strong> is deciding bid...
          </span>
          <span className="compact-bid-badge">
            Current Bid: <strong>{currentBid > 0 ? `${currentBid} (${highestBidderName})` : 'Opening (Min 16)'}</strong>
          </span>
        </div>
      </div>
    );
  }

  // 2. Human Turn: Responding to a Hold / "I Do" Challenge
  if (isHoldScenario) {
    return (
      <div className="bidding-panel-docked human-turn">
        <div className="bidding-casino-card">
          <div className="bidding-card-header">
            <div className="bidding-title-wrap">
              <span className="bidding-title">⚔️ HOLD CHALLENGE</span>
              <span className="bidding-sub">Seniority Privilege ("I Do" Rule)</span>
            </div>
            <div className="current-bid-highlight-badge">
              <span className="bid-badge-label">Challenged At</span>
              <span className="bid-badge-num">{holdAmount}</span>
            </div>
          </div>

          <div className="hold-challenge-info">
            <strong>{challengerName}</strong> challenged with <strong>{holdAmount}</strong>!
            Because your team bid first, you can hold at <strong>{holdAmount} ("{holdAmount} I Do")</strong> or pass.
          </div>

          {/* Action Row */}
          <div className="bidding-action-buttons">
            <button
              type="button"
              className="casino-hold-btn"
              onClick={onHold}
              title={`Hold the contract at ${holdAmount}`}
            >
              👑 {holdAmount} I DO (HOLD)
            </button>

            <button type="button" className="casino-pass-btn" onClick={onPass}>
              PASS
            </button>
          </div>

          {/* Higher Bid Options if raising directly */}
          {legalBids.length > 0 && (
            <div className="legal-bids-dock">
              <span className="legal-bids-subhead">Or Raise Higher:</span>
              <div className="legal-bids-chip-row">
                {legalBids.slice(0, 6).map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    className="bid-chip-btn"
                    onClick={() => onBid(amount)}
                  >
                    BID {amount}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. Human Normal Turn Display
  return (
    <div className="bidding-panel-docked human-turn">
      <div className="bidding-casino-card">
        <div className="bidding-card-header">
          <div className="bidding-title-wrap">
            <span className="bidding-title">🎲 YOUR TURN TO BID</span>
            <span className="bidding-sub">Auction Round (Opening at 16)</span>
          </div>

          <div className="current-bid-highlight-badge">
            <span className="bid-badge-label">CURRENT BID</span>
            <span className="bid-badge-num">{currentBid > 0 ? currentBid : '16'}</span>
            <span className="bid-badge-by">
              {currentBid > 0 ? `by ${highestBidderName}` : 'Minimum'}
            </span>
          </div>
        </div>

        {/* Hand Strength Advice Strip */}
        <div className={`hand-eval-strip ${handEval.level.toLowerCase()}`}>
          <span className="hand-eval-badge">{handEval.level} HAND</span>
          <span className="hand-eval-text">
            {handEval.level === 'WEAK'
              ? 'Low high cards — passing is strongly recommended.'
              : handEval.level === 'MEDIUM'
              ? 'Moderate cards — safe for 16–17 bid or pass.'
              : 'Excellent point control — confident opening bid!'}
          </span>
        </div>

        {/* Available Bids Chips Grid */}
        <div className="bidding-chips-area">
          <span className="legal-bids-subhead">Select Bid:</span>
          <div className="legal-bids-chip-row">
            {legalBids.map((amount) => (
              <button
                key={amount}
                type="button"
                className="bid-chip-btn"
                onClick={() => onBid(amount)}
                title={`Place contract bid of ${amount}`}
              >
                BID {amount}
              </button>
            ))}
          </div>
        </div>

        {/* Pass Button */}
        <div className="bidding-bottom-actions">
          <button type="button" className="casino-pass-btn full-width" onClick={onPass}>
            PASS
          </button>
        </div>
      </div>
    </div>
  );
};
