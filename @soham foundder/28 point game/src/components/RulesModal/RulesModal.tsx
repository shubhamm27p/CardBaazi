import React from 'react';
import './RulesModal.css';

interface RulesModalProps {
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ onClose }) => {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="rules-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="rules-modal-header">
          <h2 className="rules-modal-title">📖 Rules of Twenty-Eight (28)</h2>
          <button type="button" className="close-modal-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="rules-modal-body">
          {/* Section 1: Overview */}
          <div className="rule-section">
            <h3 className="rule-section-title">🃏 1. Game Overview & Players</h3>
            <p>
              Twenty-Eight (28) is a famous Indian partnership trick-taking game played by{' '}
              <strong>4 players</strong> in <strong>2 partnerships</strong> (Team A vs Team B).
              Partners sit opposite each other (South & North vs East & West). Play proceeds{' '}
              <strong>counter-clockwise</strong>.
            </p>
          </div>

          {/* Section 2: Deck & Ranking */}
          <div className="rule-section">
            <h3 className="rule-section-title">👑 2. 32-Card Deck & Unique Ranking</h3>
            <p>
              Only <strong>32 cards</strong> are used (Cards 2 through 6 are removed). The card
              ranking is uniquely Indian and does NOT follow standard poker:
            </p>
            <div className="ranking-pill-row">
              <span className="rank-item-pill">Jack (Highest)</span>
              <span>&gt;</span>
              <span className="rank-item-pill">9</span>
              <span>&gt;</span>
              <span className="rank-item-pill">Ace</span>
              <span>&gt;</span>
              <span className="rank-item-pill">10</span>
              <span>&gt;</span>
              <span className="rank-item-pill">King</span>
              <span>&gt;</span>
              <span className="rank-item-pill">Queen</span>
              <span>&gt;</span>
              <span className="rank-item-pill">8</span>
              <span>&gt;</span>
              <span className="rank-item-pill">7 (Lowest)</span>
            </div>
          </div>

          {/* Section 3: Points System */}
          <div className="rule-section">
            <h3 className="rule-section-title">💎 3. The 28 Points System</h3>
            <p>
              Only 16 cards have point values. The remaining 16 cards (K, Q, 8, 7) are worth 0 points.
              The total points in the entire deck always equal exactly <strong>28</strong>:
            </p>
            <div className="points-table-grid">
              <div className="point-cell">
                <span className="rank-name">4 × Jacks</span>
                <span className="pts-value">3 pts each (12)</span>
              </div>
              <div className="point-cell">
                <span className="rank-name">4 × Nines</span>
                <span className="pts-value">2 pts each (8)</span>
              </div>
              <div className="point-cell">
                <span className="rank-name">4 × Aces</span>
                <span className="pts-value">1 pt each (4)</span>
              </div>
              <div className="point-cell">
                <span className="rank-name">4 × Tens</span>
                <span className="pts-value">1 pt each (4)</span>
              </div>
            </div>
            <p style={{ marginTop: '8px', fontSize: '12px', color: '#ffd700' }}>
              Total = 12 + 8 + 4 + 4 = 28 Card Points.
            </p>
          </div>

          {/* Section 4: Dealing & Bidding */}
          <div className="rule-section">
            <h3 className="rule-section-title">🎯 4. Dealing & Bidding Flow</h3>
            <p>
              <strong>Step 1:</strong> 4 cards are dealt to each player.
              <br />
              <strong>Step 2:</strong> Players bid for the contract. Opening bid starts at minimum{' '}
              <strong>16</strong>, up to <strong>28</strong>.
              <br />
              <strong>The Authentic "I Do" (Hold) Rule:</strong> When an opponent challenges a 16 bid with{' '}
              <strong>17</strong>, the original bidder has the right to say{' '}
              <strong>"17 I Do" (Hold 17)</strong> to retain the bid at 17! The challenger must then bid 18 or pass. If the challenger bids 18, the original bidder can say <strong>"18 I Do"</strong>, and so on.
              <br />
              <strong>Step 3:</strong> The auction winner becomes the <strong>Declarer</strong> and
              privately selects the secret <strong>Hukum (Trump)</strong> card & suit!
              <br />
              <strong>Step 4:</strong> Remaining 16 cards are dealt (each player now holds 8 cards).
              <br />
              <strong>Step 5:</strong> Trick 1 begins immediately with 8 tricks of card play!
            </p>
          </div>

          {/* Section 5: Follow Suit & Secret Trump Reveal */}
          <div className="rule-section">
            <h3 className="rule-section-title">🎺 5. Follow-Suit & Secret Hukum Reveal</h3>
            <p>
              • <strong>Follow Suit:</strong> If you have a card of the suit led, you{' '}
              <strong>MUST follow suit</strong>.
              <br />
              • <strong>Secret Trump:</strong> The trump suit remains hidden initially.
              <br />
              • <strong>Revealing Hukum:</strong> When a player is unable to follow the led suit, they
              have the right to request to <em>reveal the secret Hukum</em>!
              <br />
              • Once revealed, the trump suit is visible to all players. If the player who requested
              the reveal holds cards of the trump suit, they must play a trump to cut the trick!
              <br />• Any subsequent trump card beats any non-trump card.
            </p>
          </div>

          {/* Section 6: Winning & Scoring */}
          <div className="rule-section">
            <h3 className="rule-section-title">🏆 6. Winning the Hand & Match</h3>
            <p>
              • The trick winner takes all 4 cards and leads the next trick.
              <br />
              • After 8 tricks, card points captured are tallied (Card Points sum to exactly 28).
              <br />
              • If the Bidding Team captures total points (Card Points + K–Q Bonus) ≥ Bid, the bid is <strong>SUCCESSFUL</strong> (+1
              or +2 Match points).
              <br />• If the Bidding Team falls short, the bid <strong>FAILS</strong> and the defending
              team is awarded penalty Match points!
            </p>
          </div>

          {/* Section 7: King-Queen (K-Q) Rule */}
          <div className="rule-section">
            <h3 className="rule-section-title">👑 7. Authentic King–Queen (K–Q) Rule</h3>
            <p>
              A King–Queen combination is formed when the <strong>same team captures both the King and Queen of the same suit</strong>:
              <br />
              • <strong>Trump-Suit K + Trump-Suit Q:</strong> <strong>+4 bonus points</strong>
              <br />
              • <strong>Non-Trump K + Non-Trump Q:</strong> <strong>+2 bonus points</strong>
              <br />
              • <strong>Important Capture Rule:</strong> Both cards must be legally captured by the <em>same team</em>. If Team A captures K and Team B captures Q of that suit, 0 bonus points are awarded.
              <br />
              • <strong>Configurable & Authoritative:</strong> K–Q bonus points are added directly to the team's final score (Card Points + K–Q Bonus = Final Team Points) and count toward fulfilling the contract bid.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
