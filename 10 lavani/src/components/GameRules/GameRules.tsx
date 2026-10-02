import React from 'react';
import './GameRules.css';

interface GameRulesProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GameRules: React.FC<GameRulesProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="rules-modal-backdrop" onClick={onClose}>
      <div className="rules-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rules-modal-header">
          <h2 className="rules-modal-title">Dehla Pakad – 32 Card Rules</h2>
          <button className="rules-close-btn" onClick={onClose} aria-label="Close rules">
            ✕
          </button>
        </div>

        <div className="rules-modal-content">
          {/* Format & Teams */}
          <div className="rules-section">
            <h3 className="rules-section-title">👥 Game Format & Teams</h3>
            <p>
              Dehla Pakad (देहली पकड़) is played with <strong>4 players</strong> in two fixed partnerships:
            </p>
            <div className="rules-grid-2col" style={{ marginTop: 8 }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: 10, borderRadius: 8, border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                <strong style={{ color: '#fcd34d' }}>Team A (Your Team):</strong>
                <div>Player 1 (You - South) + Player 3 (Priya - North)</div>
              </div>
              <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: 10, borderRadius: 8, border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                <strong style={{ color: '#7dd3fc' }}>Team B (Opponents):</strong>
                <div>Player 2 (Vikram - East) + Player 4 (Amit - West)</div>
              </div>
            </div>
          </div>

          {/* 32 Cards */}
          <div className="rules-section">
            <h3 className="rules-section-title">🃏 32-Card Strict Deck</h3>
            <p>
              This edition uses <strong>ONLY cards 7 and above</strong> across all 4 suits (♠, ♥, ♦, ♣).
              Cards 2, 3, 4, 5, and 6 are completely excluded.
            </p>
            <div className="rules-cards-pills">
              <span className="rules-card-pill">7</span>
              <span className="rules-card-pill">8</span>
              <span className="rules-card-pill">9</span>
              <span className="rules-card-pill is-dehla">10 (DEHLA)</span>
              <span className="rules-card-pill">J (Jack)</span>
              <span className="rules-card-pill">Q (Queen)</span>
              <span className="rules-card-pill">K (King)</span>
              <span className="rules-card-pill">A (Ace)</span>
            </div>
            <p style={{ marginTop: 8, fontSize: '0.85rem', color: '#94a3b8' }}>
              8 cards × 4 suits = exactly <strong>32 cards</strong>. Each player receives <strong>8 cards</strong>.
            </p>
          </div>

          {/* Two-Stage Deal & Strategy */}
          <div className="rules-section">
            <h3 className="rules-section-title">🤝 Two-Stage Deal & Hukum Selection Flow</h3>
            <p>
              1. <strong>Stage 1 (First 4 Cards):</strong> Each player receives their first 4 cards. You can see your 4 cards while opponents' cards remain hidden.
            </p>
            <p style={{ marginTop: 6 }}>
              2. <strong>Human Decision:</strong> You are presented with two choices:
            </p>
            <ul style={{ paddingLeft: 20, marginTop: 4 }}>
              <li><strong>PASS TO PARTNER:</strong> You pass the trump declaration to your partner. Priya evaluates her 4 cards and decides Hukum for Team A. (No card exchange or replacement).</li>
              <li><strong>CHOOSE HUKUM:</strong> You choose the Hukum suit yourself directly from ♠ Spades, ♥ Hearts, ♦ Diamonds, or ♣ Clubs.</li>
            </ul>
            <p style={{ marginTop: 6 }}>
              3. <strong>Hukum Locked:</strong> Once chosen (either by Priya or by you), the Hukum suit is locked for the entire round.
            </p>
            <p style={{ marginTop: 6 }}>
              4. <strong>Stage 2 (Remaining 4 Cards Dealt):</strong> The remaining 4 cards are dealt to every player (8 / 8 cards total).
            </p>
            <p style={{ marginTop: 6 }}>
              5. <strong>Start 8-Trick Game:</strong> You lead Trick 1, and the battle for the four 10s begins!
            </p>
          </div>

          {/* Ranking & Trump */}
          <div className="rules-section">
            <h3 className="rules-section-title">⚔️ Ranking & Hukum (Trump) Rules</h3>
            <p>
              <strong>Card hierarchy (lowest to highest):</strong><br />
              <code>7 &lt; 8 &lt; 9 &lt; 10 &lt; J &lt; Q &lt; K &lt; A</code>
            </p>
            <p style={{ marginTop: 8 }}>
              Any <strong>Hukum card</strong> beats all cards of non-Hukum suits. Among Hukum cards, normal card ranking applies (Ace of Hukum is highest).
            </p>
          </div>

          {/* Objective: The Dehlas */}
          <div className="rules-section">
            <h3 className="rules-section-title">🎯 The 4 Dehlas (10s) Objective</h3>
            <p>
              The <strong>four 10s (10♠, 10♥, 10♦, 10♣)</strong> are the prized <em>Dehlas</em>!
              Your team's primary objective is to capture as many 10s as possible.
            </p>
            <ul style={{ paddingLeft: 20, marginTop: 6 }}>
              <li>When a trick contains a 10, whichever team wins that trick captures that 10!</li>
              <li>A team capturing 3 or 4 Dehlas wins the match!</li>
              <li><strong>KOT (Clean Sweep):</strong> Capturing all 4 Dehlas (4–0) or winning all 8 tricks is an undisputed <em>Royal Kot</em>!</li>
            </ul>
          </div>

          {/* Trick Rules */}
          <div className="rules-section">
            <h3 className="rules-section-title">🔄 Trick Playing Rules</h3>
            <ol style={{ paddingLeft: 20 }}>
              <li>The trick leader may play any card from hand.</li>
              <li><strong>Suit Follow Rule:</strong> All other players <em>MUST</em> follow the led suit if they have it.</li>
              <li>If a player has no cards of the led suit, they may play <em>ANY</em> card (they can cut with Trump or discard).</li>
              <li>If trumps are played, the highest trump card wins the trick.</li>
              <li>If no trumps are played, the highest card of the led suit wins.</li>
              <li>The trick winner leads the subsequent trick. Play continues for 8 tricks.</li>
            </ol>
          </div>

          {/* AI Difficulty */}
          <div className="rules-section">
            <h3 className="rules-section-title">🤖 AI Strategies</h3>
            <p>
              <strong>Easy:</strong> Casual play, suitable for quick casual games.<br />
              <strong>Medium:</strong> Strategic play: protects 10s, passes 10s to winning partner, trumps opponent tricks.<br />
              <strong>Hard:</strong> Master card counter: tracks high cards, Aces, Kings, and remaining trumps, coordinates with partner.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
