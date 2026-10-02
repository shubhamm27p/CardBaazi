import React from 'react';
import type { Player as PlayerType } from '../../types/game';
import { Card } from '../Card/Card';
import './Player.css';

interface PlayerProps {
  player: PlayerType;
  isActiveTurn: boolean;
  playableCardIds?: Set<string>;
  onPlayCard?: (cardId: string) => void;
  isResolving?: boolean;
  dealingStage?: 1 | 2;
  isTrumpSelected?: boolean;
  newCardIds?: Set<string>;
}

export const Player: React.FC<PlayerProps> = ({
  player,
  isActiveTurn,
  playableCardIds = new Set(),
  onPlayCard,
  isResolving = false,
  dealingStage = 2,
  isTrumpSelected = true,
  newCardIds = new Set(),
}) => {
  const isHuman = player.isHuman;
  const teamLabel = player.team === 'teamA' ? 'Team A' : 'Team B';
  const teamClass = player.team === 'teamA' ? 'team-a' : 'team-b';

  const cardCountText = `${player.hand.length} / 8 cards`;

  return (
    <div
      className={`player-seat seat-${player.position}`}
      data-testid={`player-${player.id}`}
    >
      {/* Player Profile Badge */}
      <div className={`player-badge-card ${isActiveTurn && isTrumpSelected ? 'is-active-turn' : ''}`}>
        <div className="player-avatar-wrap">
          <span>{player.avatar}</span>
        </div>

        <div className="player-info-meta">
          <div className="player-name-row">
            <span className="player-name">
              {player.name} {isHuman && '(You)'}
            </span>
            <span className={`player-team-pill ${teamClass}`}>{teamLabel}</span>
          </div>

          <div className="player-sub-status">
            <span>
              {isActiveTurn && isTrumpSelected ? (
                <span style={{ color: '#e5b95c', fontWeight: 600 }}>
                  Playing <span className="turn-thinking-dot" />
                </span>
              ) : (
                <span>Tricks: <strong className="player-tricks-count">{player.tricksWon}</strong></span>
              )}
            </span>
            <span className="cards-count-badge" data-testid={`cards-count-${player.id}`}>
              {cardCountText}
            </span>
          </div>
        </div>
      </div>

      {/* For AI players: render miniature card backs to show hand count */}
      {!isHuman && player.hand.length > 0 && (
        <div className="ai-cards-fan" title={`${player.name} has ${cardCountText}`}>
          {player.hand.map((_, idx) => (
            <div key={idx} className="ai-card-back-mini" />
          ))}
        </div>
      )}

      {/* For Human player: render interactive hand */}
      {isHuman && (
        <div className="human-hand-container">
          <div className="human-hand-header-bar">
            <span className="human-hand-stage-label">
              {dealingStage === 1
                ? 'Your First 4 Cards'
                : 'Your Full Hand — 8 Cards'}
            </span>
            <span
              className={`human-hand-count-pill ${
                dealingStage === 1 ? 'stage-1' : 'stage-2'
              }`}
              data-testid="human-card-count-pill"
            >
              {cardCountText}
            </span>
          </div>

          <div className="human-hand-cards" data-testid="human-hand">
            {player.hand.map((card, index) => {
              const canPlayThisPhase = isTrumpSelected && isActiveTurn && !isResolving;
              const isPlayable = canPlayThisPhase && playableCardIds.has(card.id);
              const isIllegal = canPlayThisPhase && !playableCardIds.has(card.id);
              const isNewCard = newCardIds.has(card.id);

              return (
                <div
                  key={card.id}
                  className={`human-card-wrapper ${isNewCard ? 'card-stage2-anim' : ''}`}
                  style={{
                    zIndex: index + 1,
                  }}
                >
                  <Card
                    card={card}
                    size="large"
                    isPlayable={isPlayable}
                    isIllegal={isIllegal}
                    onClick={() => {
                      if (isPlayable && onPlayCard) {
                        onPlayCard(card.id);
                      }
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
