import React, { useState } from 'react';
import { getSuitSymbol } from '../../game/cards';
import { PlayerId } from '../../types/game';
import { FullGameState } from '../../game/gameEngine';
import { Card } from '../Card/Card';
import './MatchHistoryModal.css';

interface MatchHistoryModalProps {
  gameState: FullGameState;
  playersMap: Record<PlayerId, { name: string; roleName?: string }>;
  onClose: () => void;
}

export const MatchHistoryModal: React.FC<MatchHistoryModalProps> = ({
  gameState,
  playersMap,
  onClose,
}) => {
  const getPlayerName = (pid: PlayerId) => playersMap[pid]?.name || pid;
  const history = gameState.matchHistory;
  const totalHands = history.length;
  const teamAWins = history.filter(
    (h) => (h.biddingTeam === 'TEAM_A' && h.bidSuccess) || (h.biddingTeam === 'TEAM_B' && !h.bidSuccess)
  ).length;
  const teamBWins = totalHands - teamAWins;
  const highestBid = totalHands > 0 ? Math.max(...history.map((h) => h.finalBid)) : 0;

  // Calculate live hand stats
  const currentTrick = gameState.currentTrick;
  const completedTricks = gameState.completedTricks;
  const team1Wins = completedTricks.filter(t => t.winnerPlayerId && (t.winnerPlayerId === 'player1' || t.winnerPlayerId === 'player3')).length;
  const team2Wins = completedTricks.filter(t => t.winnerPlayerId && (t.winnerPlayerId === 'player2' || t.winnerPlayerId === 'player4')).length;
  let team1Points = 0;
  let team2Points = 0;
  completedTricks.forEach(t => {
    if (!t.winnerPlayerId) return;
    if (t.winnerPlayerId === 'player1' || t.winnerPlayerId === 'player3') team1Points += t.points;
    else team2Points += t.points;
  });

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
              <span className="summary-stat-label">Team 1 ({getPlayerName('player1')} + {getPlayerName('player3')})</span>
              <span className="summary-stat-val team-a">{teamAWins} Wins</span>
            </div>
            <div className="summary-stat-box">
              <span className="summary-stat-label">Team 2 ({getPlayerName('player2')} + {getPlayerName('player4')})</span>
              <span className="summary-stat-val team-b">{teamBWins} Wins</span>
            </div>
            <div className="summary-stat-box">
              <span className="summary-stat-label">Highest Contract</span>
              <span className="summary-stat-val gold">{highestBid > 0 ? `${highestBid} pts` : '--'}</span>
            </div>
          </div>

          <div className="history-sections-container">
            {/* CURRENT ROUND */}
            <div className="history-section">
              <h3 className="section-title gold-text">CURRENT ROUND <span className="live-badge">LIVE</span></h3>
              <div className="current-round-grid">
                <div className="cr-stat"><span>Round:</span> {gameState.handNumber} / 8</div>
                <div className="cr-stat"><span>Current Trick:</span> {currentTrick ? currentTrick.number : completedTricks.length} / 8</div>
                <div className="cr-stat"><span>Trump / Hukum:</span> {gameState.hukum?.isRevealed ? `${getSuitSymbol(gameState.hukum.suit)} ${gameState.hukum.suit}` : 'Hidden'}</div>
                <div className="cr-stat"><span>Contract:</span> {gameState.finalBid > 0 ? (gameState.finalBid !== gameState.originalBid && gameState.originalBid > 0 ? `${gameState.originalBid} → ${gameState.finalBid} (King + Queen Rule)` : gameState.finalBid) : 'Bidding'}</div>
                <div className="cr-stat"><span>Team 1 Points:</span> {team1Points}</div>
                <div className="cr-stat"><span>Team 2 Points:</span> {team2Points}</div>
                <div className="cr-stat"><span>Tricks Won:</span> Team 1: {team1Wins} | Team 2: {team2Wins}</div>
              </div>

              <h4 className="subsection-title" style={{ marginTop: '12px', fontSize: '0.8rem' }}>CARDS REMAINING</h4>
              <div className="cards-remaining-flex">
                <div className="cr-player"><span>{getPlayerName('player1')}</span> <strong>{gameState.hands.player1.length}</strong></div>
                <div className="cr-player"><span>{getPlayerName('player3')}</span> <strong>{gameState.hands.player3.length}</strong></div>
                <div className="cr-player"><span>{getPlayerName('player2')}</span> <strong>{gameState.hands.player2.length}</strong></div>
                <div className="cr-player"><span>{getPlayerName('player4')}</span> <strong>{gameState.hands.player4.length}</strong></div>
              </div>
            </div>

            {/* ROUND HISTORY */}
            <div className="history-section">
              <h3 className="section-title">ROUND HISTORY</h3>
              <div className="history-cards-list">
                {history.map((entry) => {
                  const declarerName = getPlayerName(entry.declarer);
                  return (
                    <div key={entry.handNumber} className={`history-hand-card ${entry.bidSuccess ? 'bid-won' : 'bid-lost'}`}>
                      <div className="hand-card-header">
                        <span className="hand-index-pill">ROUND {entry.handNumber}</span>
                        <span className="contract-label">Contract: {entry.finalBid}</span>
                        <span className="trump-label">Trump: {getSuitSymbol(entry.hukumSuit)}</span>
                        <span className="winner-label">Winner: {entry.bidSuccess ? (entry.biddingTeam === 'TEAM_A' ? 'Team 1' : 'Team 2') : (entry.biddingTeam === 'TEAM_A' ? 'Team 2' : 'Team 1')}</span>
                        <span className="outcome-pill">Status: Completed</span>
                      </div>
                    </div>
                  );
                })}
                {gameState.phase !== 'HAND_OVER' && (
                  <div className="history-hand-card in-progress">
                    <div className="hand-card-header">
                      <span className="hand-index-pill">ROUND {gameState.handNumber}</span>
                      <span className="contract-label">Contract: {gameState.finalBid > 0 ? gameState.finalBid : '--'}</span>
                      <span className="trump-label">Trump: {gameState.hukum?.isRevealed ? getSuitSymbol(gameState.hukum.suit) : '?'}</span>
                      <span className="outcome-pill in-progress-pill">Status: IN PROGRESS</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* LATEST TRICK */}
            <div className="history-section">
              <h3 className="section-title">LATEST TRICK</h3>
              {currentTrick && currentTrick.cards.length > 0 ? (
                <div className="trick-history-item">
                  <div className="trick-history-item-header">
                    <div>
                      <strong className="trick-history-number">Trick {currentTrick.number}</strong>
                      <span className="trick-history-lead">
                        (Led by {getPlayerName(currentTrick.leadPlayerId)})
                      </span>
                    </div>
                    {currentTrick.winnerPlayerId && (
                      <div className="trick-history-winner-box">
                        <span className="trick-history-winner-tag">
                          Won by {getPlayerName(currentTrick.winnerPlayerId)}
                        </span>
                        <span className="trick-history-points-tag">
                          ★ +{currentTrick.points} PTS
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="trick-history-cards-row">
                    {currentTrick.cards.map((p) => {
                      const isWinningCard = p.playerId === currentTrick.winnerPlayerId;
                      return (
                        <div key={p.card.id} className="trick-history-card-item">
                          <span className="trick-history-player-name">
                            {getPlayerName(p.playerId)}
                          </span>
                          <Card card={p.card} size="sm" isWinning={isWinningCard} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="latest-trick-empty">Waiting for first card...</div>
              )}
            </div>

            {/* TRICK HISTORY */}
            <div className="history-section">
              <h3 className="section-title">TRICK HISTORY</h3>
              {completedTricks.length > 0 ? (
                <div className="trick-history-list">
                  {completedTricks.map((trick) => (
                    <div key={trick.number} className="trick-history-item">
                      <div className="trick-history-item-header">
                        <div>
                          <strong className="trick-history-number">Trick {trick.number}</strong>
                          <span className="trick-history-lead">
                            (Led by {getPlayerName(trick.leadPlayerId)})
                          </span>
                        </div>
                        <div className="trick-history-winner-box">
                          <span className="trick-history-winner-tag">
                            Won by {getPlayerName(trick.winnerPlayerId!)}
                          </span>
                          <span className="trick-history-points-tag">
                            ★ +{trick.points} PTS
                          </span>
                        </div>
                      </div>

                      <div className="trick-history-cards-row">
                        {trick.cards.map((p) => {
                          const isWinningCard = p.playerId === trick.winnerPlayerId;
                          return (
                            <div key={p.card.id} className="trick-history-card-item">
                              <span className="trick-history-player-name">
                                {getPlayerName(p.playerId)}
                              </span>
                              <Card card={p.card} size="sm" isWinning={isWinningCard} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="latest-trick-empty">No completed tricks yet.</div>
              )}
            </div>



          </div>
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
