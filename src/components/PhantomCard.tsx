/**
 * PhantomCard Component
 * Cloned card element that can be freely animated above the carousel
 * Used for pickup/delivery animations without disrupting the infinite scroll
 */

import React, { forwardRef } from 'react';
import { Prize } from '../features/claw/types';
import './PhantomCard.css';

interface PhantomCardProps {
  prize: Prize;
  /** Initial position (x, y) - will be set via GSAP */
  initialPosition: { x: number; y: number };
  /** Card size (width = height) */
  size: number;
  /** Visibility controlled externally */
  visible: boolean;
}

export const PhantomCard = forwardRef<HTMLDivElement, PhantomCardProps>(
  ({ prize, initialPosition, size, visible }, ref) => {
    const getCoverArtUrl = (prize: Prize) => {
      if (prize.imageFileName) {
        return `/prizes/${encodeURIComponent(prize.imageFileName)}`;
      }
      return '/prizes/default.webp';
    };

    const rarityColors: Record<string, string> = {
      common: '#999',
      rare: '#ff6347',
      epic: '#00ced1',
      legendary: '#ffd700',
    };

    return (
      <div
        ref={ref}
        className="phantom-card"
        style={{
          width: size,
          height: size,
          left: initialPosition.x - size / 2,
          top: initialPosition.y - size / 2,
          visibility: visible ? 'visible' : 'hidden',
          backgroundImage: `url(${getCoverArtUrl(prize)})`,
          '--rarity-glow': rarityColors[prize.rarity] || '#999',
        } as React.CSSProperties}
      >
        {/* Golden outline during pickup (will be toggled via class) */}
        <div className="phantom-card-border" />
      </div>
    );
  }
);

PhantomCard.displayName = 'PhantomCard';
