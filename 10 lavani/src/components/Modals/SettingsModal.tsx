import React from 'react';
import type { AIDifficulty, GameSettings, GameSpeed } from '../../types/game';
import './Modals.css';

interface SettingsModalProps {
  isOpen: boolean;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onUpdateSettings,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">⚙️ Game Settings</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* AI Difficulty */}
          <div className="settings-group">
            <label className="settings-label">AI Difficulty Level</label>
            <div className="settings-options-row">
              {(['easy', 'medium', 'hard'] as AIDifficulty[]).map((diff) => (
                <button
                  key={diff}
                  className={`settings-opt-btn ${settings.difficulty === diff ? 'active' : ''}`}
                  onClick={() => onUpdateSettings({ difficulty: diff })}
                  data-testid={`setting-diff-${diff}`}
                >
                  {diff.toUpperCase()}
                </button>
              ))}
            </div>
            <span className="settings-hint">
              {settings.difficulty === 'easy' && 'Casual play, random or basic moves.'}
              {settings.difficulty === 'medium' && 'Smart play: protects 10s and assists partner.'}
              {settings.difficulty === 'hard' && 'Master card counter: tracks trumps, Aces, Kings, and cooperates.'}
            </span>
          </div>

          {/* Game Speed */}
          <div className="settings-group">
            <label className="settings-label">Gameplay Animation Speed</label>
            <div className="settings-options-row">
              {(['normal', 'fast', 'instant'] as GameSpeed[]).map((spd) => (
                <button
                  key={spd}
                  className={`settings-opt-btn ${settings.gameSpeed === spd ? 'active' : ''}`}
                  onClick={() => onUpdateSettings({ gameSpeed: spd })}
                  data-testid={`setting-speed-${spd}`}
                >
                  {spd.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Sound Toggle */}
          <div className="settings-toggle-row">
            <div>
              <div style={{ fontWeight: 600, color: '#ffffff' }}>Sound Effects</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Synthesized card, deal & trick audio</div>
            </div>
            <button
              className={`toggle-switch ${settings.soundEnabled ? 'on' : 'off'}`}
              onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
              data-testid="toggle-sound"
            >
              {settings.soundEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Auto-sort hand */}
          <div className="settings-toggle-row">
            <div>
              <div style={{ fontWeight: 600, color: '#ffffff' }}>Auto-Sort Hand</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Group dealt cards neatly by suit & rank</div>
            </div>
            <button
              className={`toggle-switch ${settings.autoSortHand ? 'on' : 'off'}`}
              onClick={() => onUpdateSettings({ autoSortHand: !settings.autoSortHand })}
            >
              {settings.autoSortHand ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
