/**
 * PrizeDisplaySlot Component
 * Glass-fronted display case positioned near GO button
 * Shows the winning card after claw animation delivers it
 */

import React, { useRef, useEffect } from 'react';
import { Prize } from '../features/claw/types';
import gsap from 'gsap';
import './PrizeDisplaySlot.css';

interface PrizeDisplaySlotProps {
  /** Current prize in the slot (null = empty) */
  prize: Prize | null;
  /** Trigger bouncy fall animation when prize changes */
  onPrizeChange?: () => void;
}

export const PrizeDisplaySlot: React.FC<PrizeDisplaySlotProps> = ({ prize, onPrizeChange }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const previousPrizeId = useRef<string | null>(null);
  const [isExiting, setIsExiting] = React.useState(false);
  const [displayedPrize, setDisplayedPrize] = React.useState<Prize | null>(prize);

  // Handle prize exit animation when prize becomes null
  useEffect(() => {
    if (prize === null && displayedPrize !== null && cardRef.current) {
      // Prize was removed - trigger exit animation
      setIsExiting(true);
      const card = cardRef.current;

      gsap.to(card, {
        y: 500, // Fall down off screen
        opacity: 0,
        rotation: 15, // Slight rotation while falling
        duration: 0.6,
        ease: 'power2.in', // Accelerate as it falls
        onComplete: () => {
          setDisplayedPrize(null);
          setIsExiting(false);
          previousPrizeId.current = null;
        },
      });
    } else if (prize !== null) {
      setDisplayedPrize(prize);
    }
  }, [prize, displayedPrize]);

  // Trigger bouncy fall animation when new prize arrives
  useEffect(() => {
    if (!displayedPrize || !cardRef.current || isExiting) return;

    // Check if this is a NEW prize (not just re-render)
    if (displayedPrize.prizeId !== previousPrizeId.current) {
      previousPrizeId.current = displayedPrize.prizeId;

      // Cartoon bounce: start from top, fall with increasing velocity, bounce at bottom
      const card = cardRef.current;

      gsap.fromTo(
        card,
        {
          y: -300, // Start above slot
          opacity: 0,
          rotation: -15, // Slight tilt during fall
        },
        {
          y: 0,
          opacity: 1,
          rotation: 0,
          duration: 0.8,
          ease: 'bounce.out', // GSAP's built-in bounce easing
          onComplete: () => {
            // Subtle settle animation after bounce
            gsap.to(card, {
              scale: 1.05,
              duration: 0.1,
              yoyo: true,
              repeat: 1,
              ease: 'power1.inOut',
            });
          },
        }
      );

      onPrizeChange?.();
    }
  }, [displayedPrize, onPrizeChange, isExiting]);

  // Get cover art URL
  const getCoverArtUrl = (prize: Prize) => {
    if (prize.imageFileName) {
      return `/prizes/${encodeURIComponent(prize.imageFileName)}`;
    }
    return '/prizes/default.webp';
  };

  // Rarity colors for border glow
  const rarityColors: Record<string, string> = {
    common: '#999',
    rare: '#ff6347',
    epic: '#00ced1',
    legendary: '#ffd700',
  };

  return (
    <div className="prize-display-slot">
      {/* Glass pane overlay */}
      <div className="glass-pane" />

      {/* Metallic frame border */}
      <div className="slot-frame" />

      {/* Prize card (when present) */}
      {displayedPrize ? (
        <div
          ref={cardRef}
          className="slot-card"
          style={{
            backgroundImage: `url(${getCoverArtUrl(displayedPrize)})`,
            '--rarity-glow': rarityColors[displayedPrize.rarity] || '#999',
          } as React.CSSProperties}
        >
          {/* Rarity badge with full name */}
          <div className="slot-rarity-badge" style={{ '--rarity-color': rarityColors[displayedPrize.rarity] } as React.CSSProperties}>
            {displayedPrize.rarity.toUpperCase()}
          </div>
        </div>
      ) : (
        // Empty state: pulsing "DROP ZONE" indicator
        <div className="slot-empty">
          <div className="drop-zone-indicator">DROP ZONE</div>
        </div>
      )}

      {/* Bottom label */}
      <div className="slot-label">
        {prize ? prize.name : 'Awaiting Prize'}
      </div>
    </div>
  );
};
