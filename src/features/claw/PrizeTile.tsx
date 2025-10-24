/**
 * PrizeTile Component
 * Individual carousel tile displaying prize icon, name, and rarity.
 */

import React from 'react';
import { Prize } from './types';
import styles from './styles.module.css';

interface PrizeTileProps {
  prize: Prize;
  isHighlight?: boolean;
}

/**
 * Renders a single prize tile with emoji icon, truncated name, and rarity badge.
 * Rarity colors defined in CSS variables.
 */
export const PrizeTile = React.forwardRef<HTMLDivElement, PrizeTileProps>(
  ({ prize, isHighlight }, ref) => {
    const rarityColor = prize.color || '#999';

    return (
      <div
        ref={ref}
        className={`${styles.tile} ${isHighlight ? styles.highlight : ''}`}
        style={{
          '--tile-glow-color': rarityColor,
        } as React.CSSProperties}
      >
        <div className={styles.tileIcon}>{prize.icon}</div>
        <div className={styles.tileName}>{prize.name}</div>
        <div className={`${styles.rarityBadge} ${styles[prize.rarity]}`}>
          {prize.rarity}
        </div>
      </div>
    );
  },
);

PrizeTile.displayName = 'PrizeTile';
