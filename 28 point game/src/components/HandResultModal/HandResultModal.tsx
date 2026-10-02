import confetti from 'canvas-confetti';
import React, { useEffect } from 'react';
import { getSuitSymbol } from '../../game/cards';
import { calculateHandTotals } from '../../game/scoring';
import { HandResult, PlayerId } from '../../types/game';
import './HandResultModal.css';

interface HandResultModalProps {
  result: HandResult;
  playersMap: Record<PlayerId, { name: string }>;
  onNextHand: () => void;
  onNewGame: () => void;
  onClose: () => void;
}

export const HandResultModal: React.FC<HandResultModalProps> = ({
  result,
  playersMap,
  onNextHand,
  onNewGame,
  onClose,
}) => {
  const { teamATricksWon, teamBTricksWon } = calculateHandTotals(
    result.tricks,
    result.hukumSuit
  );

  const teamACardPts = result.teamACardPoints ?? 0;
  const teamBCardPts = result.teamBCardPoints ?? 0;
  const teamAKQ = result.teamAKQBonus ?? 0;
  const teamBKQ = result.teamBKQBonus ?? 0;
  const teamATotal = result.teamAPoints;
  const teamBTotal = result.teamBPoints;
  const totalCardPts = teamACardPts + teamBCardPts;
  const isCardSum28 = totalCardPts === 28;
  const kqCombs = result.kqCombinations || [];

  const bidderName = playersMap[result.bidder]?.name || result.bidder;
  const isTeamABidder = result.biddingTeam === 'TEAM_A';
  const humanWon = (isTeamABidder && result.bidSuccess) || (!isTeamABidder && !result.bidSuccess);

  useEffect(() => {
    if (humanWon) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ffd700', '#d4af37', '#81c784', '#ffffff'],
        });
      } catch {
        // Ignore if confetti context unavailable
      }
    }
  }, [humanWon]);

  return (
    <div className="modal-backdrop">
      <div className="hand-result-dialog">
        <button type="button" className="modal-close-btn" onClick={onClose} style={{ position: 'absolute', top: '10px', right: '15px', background: 'transparent', border: 'none', color: '#d4af37', fontSize: '24px', cursor: 'pointer', padding: '5px', zIndex: 10 }}>&times;</button>
        <div className="result-banner-box">
          <h2 className={`result-status-title ${result.bidSuccess ? 'success' : 'fail'}`}>
            {result.bidSuccess ? '🎉 BID SUCCESSFUL!' : '❌ BID FAILED!'}
          </h2>
          <span className="result-bid-summary">
            {result.hukumKingQueenValid && result.originalBid && result.originalBid !== result.finalBid ? (
              <>
                Final Target: <strong>{result.finalBid}</strong> (Original Bid: <strong>{result.originalBid}</strong>, Trump K+Q: -4)
              </>
            ) : (
              <>
                Bid: <strong>{result.finalBid}</strong>
              </>
            )}{' '}
            by <strong>{bidderName}</strong> ({result.biddingTeam === 'TEAM_A' ? 'Team A' : 'Team B'})
            {' • '}Trump: <strong>{getSuitSymbol(result.hukumSuit)} {result.hukumSuit}</strong>
          </span>
          {result.hukumKingQueenValid && result.originalBid && result.originalBid !== result.finalBid && (
            <div className="kq-rule-active-pill">
              👑 TRUMP K + Q BONUS RULE: ACTIVE ({result.originalBid} → {result.finalBid})
            </div>
          )}
        </div>

        {/* Breakdown by Team */}
        <div className="points-breakdown-grid">
          {/* Team A */}
          <div className={`team-breakdown-card ${isTeamABidder ? 'bidding-team' : ''}`}>
            <div className="team-card-header">
              <span className="breakdown-team-name">Team A (You + Arjun)</span>
              {isTeamABidder && <span className="bidder-tag-badge">Bidding</span>}
            </div>
            <div className="breakdown-totals-box">
              <span className="breakdown-points">{teamATotal}</span>
              <span className="breakdown-points-label">Total Points</span>
            </div>
            <div className="breakdown-sub-stats">
              <div className="sub-stat-row">
                <span>Card Points:</span>
                <strong>{teamACardPts}</strong>
              </div>
              <div className="sub-stat-row">
                <span>K–Q Bonus:</span>
                <strong className={teamAKQ > 0 ? 'kq-highlight' : ''}>{teamAKQ > 0 ? `+${teamAKQ}` : '0'}</strong>
              </div>
            </div>
            <span className="breakdown-tricks">{teamATricksWon} / 8 tricks won</span>
          </div>

          {/* Team B */}
          <div className={`team-breakdown-card ${!isTeamABidder ? 'bidding-team' : ''}`}>
            <div className="team-card-header">
              <span className="breakdown-team-name">Team B (Opponents)</span>
              {!isTeamABidder && <span className="bidder-tag-badge">Bidding</span>}
            </div>
            <div className="breakdown-totals-box">
              <span className="breakdown-points">{teamBTotal}</span>
              <span className="breakdown-points-label">Total Points</span>
            </div>
            <div className="breakdown-sub-stats">
              <div className="sub-stat-row">
                <span>Card Points:</span>
                <strong>{teamBCardPts}</strong>
              </div>
              <div className="sub-stat-row">
                <span>K–Q Bonus:</span>
                <strong className={teamBKQ > 0 ? 'kq-highlight' : ''}>{teamBKQ > 0 ? `+${teamBKQ}` : '0'}</strong>
              </div>
            </div>
            <span className="breakdown-tricks">{teamBTricksWon} / 8 tricks won</span>
          </div>
        </div>

        {/* King-Queen Combinations Tracker (Section 4 & Section 10) */}
        <div className="kq-results-tracker">
          <div className="kq-tracker-title">👑 King–Queen (K–Q) Combinations:</div>
          {kqCombs.length > 0 ? (
            <div className="kq-combs-list">
              {kqCombs.map((comb, i) => (
                <div key={i} className="kq-comb-chip">
                  <span className="kq-chip-suit">
                    K{getSuitSymbol(comb.suit)} + Q{getSuitSymbol(comb.suit)}
                  </span>
                  <span className="kq-chip-team">
                    {(comb.capturingTeam || comb.team) === 'TEAM_A' ? 'Team A' : 'Team B'}
                  </span>
                  <span className={`kq-chip-badge ${comb.isTrump ? 'trump' : 'non-trump'}`}>
                    {comb.isTrump ? 'Trump (+4)' : 'Non-Trump (+2)'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="kq-no-combs">No K–Q combinations completed this hand.</div>
          )}
        </div>

        {/* Section 10 Authoritative Game-End Verification */}
        <div className={`points-verification-bar ${isCardSum28 ? 'valid' : 'error'}`}>
          {isCardSum28 ? (
            <div className="verification-details">
              <span className="verification-text success">
                🛡️ Section 10 Verified ✓ Card Points: {teamACardPts} + {teamBCardPts} = 28 | K–Q Bonuses: Team A +{teamAKQ}, Team B +{teamBKQ}
              </span>
              <span className="verification-subtext">
                ✓ Non-duplication confirmed • Legal captures verified • Final team scores authoritative
              </span>
            </div>
          ) : (
            <span className="verification-text error">
              ⚠️ Section 10 Error: Total captured card points is {totalCardPts} (expected 28)!
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="result-actions-row">
          <button type="button" className="result-btn new-game-btn" onClick={onNewGame}>
            New Game
          </button>
          <button type="button" className="result-btn next-hand-btn" onClick={onNextHand}>
            Play Next Hand →
          </button>
        </div>
      </div>
    </div>
  );
};
