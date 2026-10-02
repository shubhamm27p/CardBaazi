import React from 'react';
import { calculateHandTotals } from '../../game/scoring';
import { getPlayerTeam } from '../../game/bidding';
import { KQRuleConfig, MatchScore, PlayerId, Suit, Trick } from '../../types/game';
import './ScoreBoard.css';

interface ScoreBoardProps {
  handNumber: number;
  matchScore: MatchScore;
  completedTricks: Trick[];
  finalBid: number;
  originalBid?: number;
  hukumKingQueenValid?: boolean;
  declarerId: PlayerId | null;
  playersMap: Record<PlayerId, { name: string }>;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenRules: () => void;
  onOpenAiExplanation?: () => void;
  onOpenMatchHistory?: () => void;
  matchHistoryCount?: number;
  onNewHand: () => void;
  onNewGame: () => void;
  trumpSuit?: Suit;
  kqRuleConfig?: KQRuleConfig;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  handNumber,
  matchScore,
  completedTricks,
  finalBid,
  originalBid,
  hukumKingQueenValid = false,
  declarerId,
  playersMap,
  soundEnabled,
  onToggleSound,
  onOpenRules,
  onOpenAiExplanation,
  onOpenMatchHistory,
  matchHistoryCount = 0,
  onNewHand,
  onNewGame,
  trumpSuit,
  kqRuleConfig,
}) => {
  const handScore = calculateHandTotals(completedTricks, trumpSuit, kqRuleConfig);
  const declarerName = declarerId ? playersMap[declarerId]?.name : 'Pending';
  const tricksCompleted = completedTricks.length;
  const decidingTeam = declarerId ? getPlayerTeam(declarerId) : null;
  const isTeamABidder = decidingTeam === 'TEAM_A';
  const isTeamBBidder = decidingTeam === 'TEAM_B';

  return (
    <header className="scoreboard-container">
      {/* Brand & Hand Number */}
      <div className="scoreboard-brand">
        <span className="brand-logo-text">TWENTY-EIGHT</span>
        <span className="hand-number-pill">Hand #{handNumber}</span>
      </div>

      {/* Center Scores */}
      <div className="scoreboard-center-stats">
        {/* Team A */}
        <div className={`team-score-card team-a-card ${isTeamABidder ? 'bidding-team-card' : ''}`}>
          <div className="team-meta">
            <span className="team-name-title">Team A {isTeamABidder ? '(Bidding)' : ''}</span>
            <span className="team-roster">You + Arjun</span>
            <span className="match-pts-val">{matchScore.teamAMatchPoints} Match</span>
            {isTeamABidder && finalBid > 0 && (
              <span className="team-target-badge" title={hukumKingQueenValid && originalBid ? `Original Bid ${originalBid} - 4 = ${finalBid}` : `Target: ${finalBid} points`}>
                Target: {finalBid} pts {hukumKingQueenValid && originalBid !== finalBid ? '(K+Q: -4)' : ''}
              </span>
            )}
          </div>
          <div className="team-points-display">
            <div className="kq-score-row">
              <span className="kq-stat-label">Card Points:</span>
              <span className="kq-stat-val">{handScore.teamACardPoints}</span>
            </div>
            <div className="kq-score-row">
              <span className="kq-stat-label">K–Q Bonus:</span>
              <span className={`kq-stat-val kq-bonus-num ${handScore.teamAKQBonus > 0 ? 'has-bonus' : ''}`}>
                {handScore.teamAKQBonus > 0 ? `+${handScore.teamAKQBonus}` : '0'}
              </span>
            </div>
            <div className="kq-score-row kq-total-row">
              <span className="kq-stat-label">Total:</span>
              <span className="kq-stat-val kq-total-num">{handScore.teamATotalPoints}</span>
            </div>
          </div>
        </div>

        {/* Current Bid / Target */}
        <div className="bid-meta-card">
          <span className="bid-label">{hukumKingQueenValid ? 'Final Target' : 'Current Bid'}</span>
          <span className="bid-number">
            {finalBid > 0 ? finalBid : '--'}
            {hukumKingQueenValid && originalBid !== undefined && originalBid !== finalBid && (
              <span className="bid-reduced-badge" title={`Trump K-Q 4-point reduction applied (from ${originalBid})`}>
                -4
              </span>
            )}
          </span>
          <span className="bidder-tag">
            {finalBid > 0 ? `by ${declarerName} (${decidingTeam === 'TEAM_A' ? 'Team A' : 'Team B'})` : 'Auction'}
            {hukumKingQueenValid && originalBid !== undefined && originalBid !== finalBid && (
              <span className="bid-orig-tag"> (Bid {originalBid} → Final {finalBid})</span>
            )}
          </span>
        </div>

        {/* Tricks Completed / Remaining */}
        <div className="tricks-meta-card" title={`Tricks: ${tricksCompleted} completed, ${8 - tricksCompleted} remaining`}>
          <span className="tricks-label">Tricks</span>
          <span className="tricks-number">{tricksCompleted}/8</span>
          <span className="tricks-sub">{8 - tricksCompleted} left</span>
        </div>

        {/* Team B */}
        <div className={`team-score-card team-b-card ${isTeamBBidder ? 'bidding-team-card' : ''}`}>
          <div className="team-meta">
            <span className="team-name-title">Team B {isTeamBBidder ? '(Bidding)' : ''}</span>
            <span className="team-roster">Vikram + Rajesh</span>
            <span className="match-pts-val">{matchScore.teamBMatchPoints} Match</span>
            {isTeamBBidder && finalBid > 0 && (
              <span className="team-target-badge" title={hukumKingQueenValid && originalBid ? `Original Bid ${originalBid} - 4 = ${finalBid}` : `Target: ${finalBid} points`}>
                Target: {finalBid} pts {hukumKingQueenValid && originalBid !== finalBid ? '(K+Q: -4)' : ''}
              </span>
            )}
          </div>
          <div className="team-points-display">
            <div className="kq-score-row">
              <span className="kq-stat-label">Card Points:</span>
              <span className="kq-stat-val">{handScore.teamBCardPoints}</span>
            </div>
            <div className="kq-score-row">
              <span className="kq-stat-label">K–Q Bonus:</span>
              <span className={`kq-stat-val kq-bonus-num ${handScore.teamBKQBonus > 0 ? 'has-bonus' : ''}`}>
                {handScore.teamBKQBonus > 0 ? `+${handScore.teamBKQBonus}` : '0'}
              </span>
            </div>
            <div className="kq-score-row kq-total-row">
              <span className="kq-stat-label">Total:</span>
              <span className="kq-stat-val kq-total-num">{handScore.teamBTotalPoints}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="scoreboard-controls">
        {onOpenMatchHistory && (
          <button
            type="button"
            className="control-btn history-btn"
            onClick={onOpenMatchHistory}
            title="Open Complete Match History & Trick Logs"
          >
            📜 History {matchHistoryCount > 0 ? `(${matchHistoryCount})` : ''}
          </button>
        )}

        {onOpenAiExplanation && (
          <button
            type="button"
            className="control-btn ai-coach-btn"
            onClick={onOpenAiExplanation}
            title="Open AI Strategy Coach & Section 13 Decision Telemetry"
          >
            🧠 AI Coach
          </button>
        )}

        <button
          type="button"
          className="control-btn icon-btn"
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>

        <button type="button" className="control-btn" onClick={onOpenRules}>
          📖 Rules
        </button>

        <button
          type="button"
          className="control-btn"
          onClick={onNewHand}
          title="Start Next Hand without resetting Match Score"
        >
          🔄 New Hand
        </button>

        <button
          type="button"
          className="control-btn"
          onClick={onNewGame}
          title="Reset Match Score to 0-0"
        >
          ✨ New Game
        </button>
      </div>
    </header>
  );
};
