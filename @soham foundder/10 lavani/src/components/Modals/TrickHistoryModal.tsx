import React from 'react';
import type { PlayerId, Trick } from '../../types/game';
import { Card } from '../Card/Card';
import './Modals.css';

interface TrickHistoryModalProps {
  isOpen: boolean;
  history: Trick[];
  players: Record<PlayerId, { name: string; team: 'teamA' | 'teamB' }>;
  onClose: () => void;
}

export const TrickHistoryModal: React.FC<TrickHistoryModalProps> = ({
  isOpen,
  history,
  players,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">📜 Trick History ({history.length}/8)</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {history.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0' }}>
              No tricks completed yet in this round.
            </p>
          ) : (
            history.map((trick) => {
              const winner = trick.winnerPlayerId ? players[trick.winnerPlayerId] : null;
              const hasDehlas = trick.capturedDehlas && trick.capturedDehlas.length > 0;

              return (
                <div key={trick.trickNumber} className="trick-history-item">
                  <div className="trick-history-header">
                    <div>
                      <strong style={{ color: '#e5b95c' }}>Trick {trick.trickNumber}</strong>
                      <span style={{ color: '#94a3b8', marginLeft: 8 }}>
                        (Led by {players[trick.leadPlayerId]?.name})
                      </span>
                    </div>
                    {winner && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="trick-history-winner-tag">
                          Won by {winner.name} ({winner.team === 'teamA' ? 'Team A' : 'Team B'})
                        </span>
                        {hasDehlas && (
                          <span style={{ color: '#f59e0b', fontWeight: 800, fontSize: '0.75rem' }}>
                            ★ DEHLA CAPTURED!
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="trick-history-cards-row">
                    {trick.cards.map((p) => {
                      const isWinningCard = p.playerId === trick.winnerPlayerId;
                      return (
                        <div key={p.card.id} className="trick-history-card-item">
                          <span className="trick-history-player">
                            {players[p.playerId]?.name}
                          </span>
                          <Card
                            card={p.card}
                            size="small"
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
