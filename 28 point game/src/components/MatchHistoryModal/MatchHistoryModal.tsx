import React, { useState } from 'react';
import { getSuitSymbol } from '../../game/cards';
import { MatchHistoryEntry, PlayerId } from '../../types/game';
import './MatchHistoryModal.css';

interface MatchHistoryModalProps {
  history: MatchHistoryEntry[];
  playersMap: Record<PlayerId, { name: string }>;
  onClose: () => void;
}

export const MatchHistoryModal: React.FC<MatchHistoryModalProps> = ({
  history,
  playersMap,
  onClose,
}) => {
  const [expandedHand, setExpandedHand] = useState<number | null>(null);

  const getPlayerName = (pid: PlayerId) => playersMap[pid]?.name || pid;

  const totalHands = history.length;
  const teamAWins = history.filter(
    (h) => (h.biddingTeam === 'TEAM_A' && h.bidSuccess) || (h.biddingTeam === 'TEAM_B' && !h.bidSuccess)
  ).length;
  const teamBWins = totalHands - teamAWins;

  const highestBid =
    totalHands > 0 ? Math.max(...history.map((h) => h.finalBid)) : 0;

  const toggleExpand = (handNumber: number) => {
    setExpandedHand(expandedHand === handNumber ? null : handNumber);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="history-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="history-modal-header">
          <div className="history-modal-title-wrap">
            <h2 className="history-modal-title">📜 Match History & Hand Logs</h2>
            <span className="history-modal-subtitle">
              Session ledger of contracts, trump calls, trick points, and match progressions
            </span>
          </div>
          <button type="button" className="close-modal-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="history-modal-body">
          {/* Summary Metric Strip */}
          <div className="history-summary-strip">
            <div className="summary-stat-box">
              <span className="summary-stat-label">Hands Played</span>
              <span className="summary-stat-val">{totalHands}</span>
            </div>

            <div className="summary-stat-box">
              <span className="summary-stat-label">Team A (You + Arjun)</span>
              <span className="summary-stat-val team-a">{teamAWins} Wins</span>
            </div>

            <div className="summary-stat-box">
              <span className="summary-stat-label">Team B (Vikram + Rajesh)</span>
              <span className="summary-stat-val team-b">{teamBWins} Wins</span>
            </div>

            <div className="summary-stat-box">
              <span className="summary-stat-label">Highest Contract</span>
              <span className="summary-stat-val gold">{highestBid > 0 ? `${highestBid} pts` : '--'}</span>
            </div>
          </div>

          {/* Hands List */}
          {totalHands === 0 ? (
            <div className="history-empty-state">
              <span className="history-empty-icon">🎴</span>
              <h3>No Completed Hands Yet</h3>
              <p>
                Complete your first 8-trick hand to record the contract result, trick points, and
                round progression in this ledger!
              </p>
            </div>
          ) : (
            <div className="history-cards-list">
              {history.map((entry) => {
                const isExpanded = expandedHand === entry.handNumber;
                const declarerName = getPlayerName(entry.declarer);
                const dealerName = getPlayerName(entry.dealer);
                const isTeamABidder = entry.biddingTeam === 'TEAM_A';

                return (
                  <div
                    key={entry.handNumber}
                    className={`history-hand-card ${entry.bidSuccess ? 'bid-won' : 'bid-lost'}`}
                  >
                    {/* Top Row: Hand #, Contract, Trump, Outcome */}
                    <div className="hand-card-header" onClick={() => toggleExpand(entry.handNumber)}>
                      <div className="hand-badge-block">
                        <span className="hand-index-pill">Hand #{entry.handNumber}</span>
                        <span className="hand-dealer-tag">Dealer: {dealerName}</span>
                      </div>

                      <div className="hand-contract-block">
                        <span className="contract-label">Contract:</span>
                        <span className="contract-value">
                          <strong>{entry.finalBid}</strong> by {declarerName} ({entry.biddingTeam === 'TEAM_A' ? 'Team A' : 'Team B'})
                        </span>
                      </div>

                      <div className="hand-trump-block">
                        <span className="trump-label">Trump:</span>
                        <span className="trump-value">
                          {getSuitSymbol(entry.hukumSuit)} {entry.hukumSuit}
                        </span>
                      </div>

                      <div className="hand-result-badge-block">
                        <span className={`outcome-pill ${entry.bidSuccess ? 'success' : 'failure'}`}>
                          {entry.bidSuccess ? '✓ Contract Won' : '✗ Contract Failed'}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="toggle-expand-btn"
                        title={isExpanded ? 'Collapse tricks' : 'Expand tricks'}
                      >
                        {isExpanded ? '▲' : '▼'}
                      </button>
                    </div>

                    {/* Score Bar */}
                    <div className="hand-score-bar">
                      <div className="score-split-card team-a">
                        <span className="score-team-label">Team A Points:</span>
                        <span className="score-team-num">{entry.teamAPoints} / 28</span>
                      </div>

                      <div className="score-match-badge">
                        <span>Score: {entry.matchScoreAfter.teamAMatchPoints} - {entry.matchScoreAfter.teamBMatchPoints}</span>
                      </div>

                      <div className="score-split-card team-b">
                        <span className="score-team-label">Team B Points:</span>
                        <span className="score-team-num">{entry.teamBPoints} / 28</span>
                      </div>
                    </div>

                    {/* Expandable Trick-by-Trick Details */}
                    {isExpanded && (
                      <div className="hand-tricks-detail-container">
                        <div className="tricks-table-header">
                          <span>Trick</span>
                          <span>Lead</span>
                          <span>Cards Played</span>
                          <span>Winner</span>
                          <span>Points</span>
                        </div>
                        <div className="tricks-table-body">
                          {entry.tricks.map((trick) => {
                            const leadName = getPlayerName(trick.leadPlayerId);
                            const winnerName = trick.winnerPlayerId
                              ? getPlayerName(trick.winnerPlayerId)
                              : '--';
                            const cardsStr = trick.cards
                              .map(
                                (pc) =>
                                  `${pc.card.rank}${getSuitSymbol(pc.card.suit)}`
                              )
                              .join('  ');

                            return (
                              <div key={trick.number} className="trick-row">
                                <span className="trick-cell-num">#{trick.number}</span>
                                <span className="trick-cell-lead">{leadName}</span>
                                <span className="trick-cell-cards">{cardsStr}</span>
                                <span className="trick-cell-winner">{winnerName}</span>
                                <span className="trick-cell-points">+{trick.points} pts</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="history-modal-footer">
          <button type="button" className="close-btn-primary" onClick={onClose}>
            Close History
          </button>
        </div>
      </div>
    </div>
  );
};
