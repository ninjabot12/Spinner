/**
 * ControlPanel Component
 * Play button, Speedclaw toggle, and accessibility controls.
 */

import React, { useState, useEffect } from 'react';
import { MachineState } from './types';
import styles from './styles.module.css';

interface ControlPanelProps {
  /** Current machine state */
  state: MachineState;
  /** Can user click play button? */
  canPlay: boolean;
  /** Called when play is triggered */
  onPlay: () => void;
  /** Speedclaw mode toggle */
  isSpeedclaw: boolean;
  onSpeedclawChange: (enabled: boolean) => void;
  /** Dev: skip to result (for testing) */
  onSkip?: () => void;
  showSkip?: boolean;
}

/**
 * Control panel with play button, speedclaw toggle, and keyboard support.
 * Space/Enter = Play, Esc closes modal (handled by parent).
 */
export const ControlPanel: React.FC<ControlPanelProps> = ({
  state,
  canPlay,
  onPlay,
  isSpeedclaw,
  onSpeedclawChange,
  onSkip,
  showSkip,
}) => {
  const isBusy = state !== MachineState.Idle && state !== MachineState.Settle;

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.code === 'Space' || e.code === 'Enter') && canPlay && !isBusy) {
        e.preventDefault();
        onPlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canPlay, isBusy, onPlay]);

  return (
    <div className={styles.controlPanel}>
      <button
        className={styles.buttonPlay}
        onClick={onPlay}
        disabled={!canPlay || isBusy}
        aria-label={isBusy ? 'Machine is busy' : 'Play the claw machine'}
      >
        {isBusy ? 'Playing...' : 'Play'}
      </button>

      <label className={styles.toggle}>
        <input
          type="checkbox"
          checked={isSpeedclaw}
          onChange={(e) => onSpeedclawChange(e.target.checked)}
          disabled={isBusy}
          aria-label="Toggle speedclaw mode for faster animations"
        />
        <div className={`${styles.toggleSwitch} ${isSpeedclaw ? styles.active : ''}`}>
          <div className={styles.toggleSwitchThumb} />
        </div>
        <span>Speedclaw</span>
      </label>

      {showSkip && onSkip && (
        <button
          className={styles.buttonPlay}
          onClick={onSkip}
          style={{ opacity: 0.6 }}
          title="Dev: Skip animation"
          aria-label="Skip animation"
        >
          Skip
        </button>
      )}
    </div>
  );
};
