import React from 'react';
import type { PlayerId, Trick } from '../../types/game';
import { Card } from '../Card/Card';
import './TrickHistoryModal.css';

interface TrickHistoryModalProps {
  isOpen: boolean;
  history: Trick[];
  playersMap: Record<PlayerId, { name: string; team?: string }>;
  onClose: () => void;
}

export const TrickHistoryModal: React.FC<TrickHistoryModalProps> = ({
  isOpen,
  history,
  playersMap,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="trick-history-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="trick-history-modal-header">
          <h2 className="trick-history-modal-title">📜 TRICK HISTORY ({history.length}/8)</h2>
          <button className="trick-history-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="trick-history-modal-body">
          {history.length === 0 ? (
            <p className="trick-history-empty">
              No tricks completed yet in this round.
            </p>
          ) : (
            history.map((trick) => {
              const winner = trick.winnerPlayerId ? playersMap[trick.winnerPlayerId] : null;
              
              return (
                <div key={trick.number} className="trick-history-item">
                  <div className="trick-history-item-header">
                    <div>
                      <strong className="trick-history-number">Trick {trick.number}</strong>
                      <span className="trick-history-lead">
                        (Led by {playersMap[trick.leadPlayerId]?.name})
                      </span>
                    </div>
                    {winner && (
                      <div className="trick-history-winner-box">
                        <span className="trick-history-winner-tag">
                          Won by {winner.name} {winner.team ? `(${winner.team === 'TEAM_A' ? 'Team A' : 'Team B'})` : ''}
                        </span>
                        <span className="trick-history-points-tag" style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.85rem' }}>
                          ★ +{trick.points} PTS
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="trick-history-cards-row">
                    {trick.cards.map((p) => {
                      const isWinningCard = p.playerId === trick.winnerPlayerId;
                      return (
                        <div key={p.card.id} className="trick-history-card-item">
                          <span className="trick-history-player-name">
                            {playersMap[p.playerId]?.name}
                          </span>
                          <Card
                            card={p.card}
                            size="sm"
                            isWinning={isWinningCard}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
