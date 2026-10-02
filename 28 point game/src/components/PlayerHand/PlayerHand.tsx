import React, { useMemo, useState } from 'react';
import { getSuitSymbol, sortCards } from '../../game/cards';
import { Card as CardType, Suit } from '../../types/game';
import { Card } from '../Card/Card';
import './PlayerHand.css';

interface PlayerHandProps {
  cards: CardType[];
  isMyTurn: boolean;
  playableCardIds: Set<string>;
  onCardClick: (card: CardType) => void;
  dealerPlayerId: string;
  canRevealHukum?: boolean;
  ledSuit?: Suit;
  hasSkippedReveal?: boolean;
  justRevealedHukum?: boolean;
  revealedHukumSuit?: Suit;
  onRevealHukum?: () => void;
  onSkipRevealHukum?: () => void;
  canRevealKQ?: boolean;
  onRevealKQ?: () => void;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  cards,
  isMyTurn,
  playableCardIds,
  onCardClick,
  dealerPlayerId,
  canRevealHukum = false,
  ledSuit,
  hasSkippedReveal = false,
  justRevealedHukum = false,
  revealedHukumSuit,
  onRevealHukum,
  onSkipRevealHukum,
  canRevealKQ = false,
  onRevealKQ,
}) => {
  const [sortBy, setSortBy] = useState<'suit' | 'rank'>('suit');
  const isDealer = dealerPlayerId === 'player1';

  const displayCards = useMemo(() => {
    const list = [...cards];
    if (sortBy === 'suit') {
      return sortCards(list);
    } else {
      return list.sort((a, b) => b.rankPower - a.rankPower);
    }
  }, [cards, sortBy]);

  return (
    <div className={`player-hand-container ${isMyTurn ? 'my-active-turn' : ''}`}>
      {/* Human Player Badge - Fixed at the bottom */}
      <div className="player-info-badge">
        <div className="avatar-frame">
          <span className="player-avatar">👨‍💼</span>
        </div>
        <div className="player-info-details">
          <div className="player-name-row">
            <span className="player-name-text">You</span>
            {isDealer && <span className="dealer-pill" title="Dealer">DEALER</span>}
          </div>
          <span className="player-team-pill team-a">Team A (Partner: Arjun)</span>
        </div>

        {isMyTurn && (
          <div className="turn-pulse-indicator">
            <span className="pulse-dot" />
            <span>YOUR TURN</span>
          </div>
        )}

        {/* Card Sorting Quick Action */}
        <button
          type="button"
          className="sort-hand-btn"
          onClick={() => setSortBy(sortBy === 'suit' ? 'rank' : 'suit')}
          title="Toggle hand arrangement"
        >
          🔀 {sortBy === 'suit' ? 'Sort by Rank' : 'Sort by Suit'}
        </button>
      </div>

      {/* Hukum Reveal Action Bar: Prominent and visible when player does not have led suit */}
      {canRevealHukum && !hasSkippedReveal && !justRevealedHukum && (
        <div className="hukum-reveal-action-bar">
          <div className="hukum-reveal-info">
            <span className="hukum-reveal-alert-icon">⚠️</span>
            <span className="hukum-reveal-msg">
              You have no {ledSuit ? getSuitSymbol(ledSuit) : ''} <strong>{ledSuit}</strong>! You can reveal Hukum or skip:
            </span>
          </div>
          <div className="hukum-reveal-buttons">
            <button
              type="button"
              className="hukum-action-btn reveal-action"
              onClick={onRevealHukum}
              title="Reveal the secret Hukum (Trump) suit now to cut the trick"
            >
              🎺 REVEAL HUKUM
            </button>
            <button
              type="button"
              className="hukum-action-btn skip-action"
              onClick={onSkipRevealHukum}
              title="Skip revealing Hukum and discard a card"
            >
              ⏭️ SKIP REVEAL
            </button>
          </div>
        </div>
      )}

      {/* If user clicked Skip Reveal: compact reminder with option to change mind */}
      {canRevealHukum && hasSkippedReveal && !justRevealedHukum && (
        <div className="hukum-reveal-action-bar skipped-mode">
          <div className="hukum-reveal-info">
            <span className="hukum-reveal-alert-icon">⏭️</span>
            <span className="hukum-reveal-msg">
              Skipping reveal: Click any card below to discard.
            </span>
          </div>
          <button
            type="button"
            className="hukum-action-btn change-mind-action"
            onClick={onRevealHukum}
            title="Change your mind and reveal Hukum"
          >
            🎺 Reveal Hukum Instead
          </button>
        </div>
      )}

      {/* If Hukum was just revealed this turn */}
      {justRevealedHukum && revealedHukumSuit && (
        <div className="hukum-reveal-action-bar revealed-mode">
          <span className="hukum-reveal-alert-icon">🎺</span>
          <span className="hukum-reveal-msg">
            Hukum Revealed: <strong>{getSuitSymbol(revealedHukumSuit)} {revealedHukumSuit}</strong>! Play a trump card to cut the trick.
          </span>
        </div>
      )}

      {/* Trump King & Queen Special Rule Reveal Action */}
      {canRevealKQ && onRevealKQ && (
        <div className="player-reveal-kq-banner">
          <button
            type="button"
            className="player-reveal-kq-btn"
            onClick={onRevealKQ}
            title="Show/Reveal Trump King & Queen to apply 4-point reduction to your team's bid!"
          >
            <span className="btn-crown">👑</span>
            <span>SHOW TRUMP KING + QUEEN (-4 PTS)</span>
          </button>
        </div>
      )}

      {/* Cards Row - Perfectly visible, horizontal layout */}
      <div className={`cards-row-wrapper ${displayCards.length > 4 ? 'cards-8' : 'cards-4'}`}>
        {displayCards.map((card) => {
          const isPlayable = isMyTurn && playableCardIds.has(card.id);

          return (
            <div key={card.id} className="hand-card-slot">
              <Card
                card={card}
                isPlayable={isPlayable}
                onClick={() => isPlayable && onCardClick(card)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
