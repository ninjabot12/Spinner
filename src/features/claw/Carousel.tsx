/**
 * Carousel Component
 * Infinite scrolling strip of prize tiles rendered 3× for seamless looping.
 * Exposes imperative ref API for GSAP animation control.
 */

import React, { useEffect, useRef } from 'react';
import { Prize } from './types';
import { PrizeTile } from './PrizeTile';
import styles from './styles.module.css';

interface CarouselProps {
  /** Base prize list (rendered 3 times) */
  prizes: Prize[];
  /** ID of prize to highlight during grab */
  highlightId?: string | null;
  /** Callback when dimensions are measured */
  onMeasure?: (containerEl: HTMLElement, tileEl: HTMLElement) => void;
}

export interface CarouselHandle {
  setX(x: number): void;
  getX(): number;
}

/**
 * Carousel strip with 3× repeated tiles for infinite effect.
 * Provides ref API: setX(translation) and getX() for GSAP control.
 */
export const Carousel = React.forwardRef<CarouselHandle, CarouselProps>(
  ({ prizes, highlightId, onMeasure }, ref) => {
    const stripRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const firstTileRef = useRef<HTMLDivElement>(null);

    // Measure and notify parent on mount/resize
    useEffect(() => {
      if (!containerRef.current || !firstTileRef.current) return;

      const handleMeasure = () => {
        if (containerRef.current && firstTileRef.current) {
          onMeasure?.(containerRef.current, firstTileRef.current);
        }
      };

      handleMeasure();
      window.addEventListener('resize', handleMeasure);
      return () => window.removeEventListener('resize', handleMeasure);
    }, [onMeasure]);

    // Expose imperative API for GSAP
    React.useImperativeHandle(
      ref,
      () => ({
        setX(x: number) {
          if (stripRef.current) {
            stripRef.current.style.transform = `translateX(${x}px)`;
          }
        },
        getX(): number {
          if (!stripRef.current) return 0;
          const transform = stripRef.current.style.transform;
          const match = transform.match(/translateX\(([^)]+)px\)/);
          return match ? parseFloat(match[1]) : 0;
        },
      }),
      [],
    );

    // Repeat prizes 3 times for infinite carousel effect
    const repeatedPrizes = [...prizes, ...prizes, ...prizes];

    return (
      <div className={styles.carouselViewport} ref={containerRef}>
        <div className={styles.carouselStrip} ref={stripRef}>
          {repeatedPrizes.map((prize, idx) => (
            <PrizeTile
              key={`${prize.id}-${idx}`}
              prize={prize}
              isHighlight={prize.id === highlightId}
              ref={idx === 0 ? firstTileRef : undefined}
            />
          ))}
        </div>
        {/* Visual center line for debugging alignment */}
        <div className={styles.centerLine} aria-hidden="true" />
      </div>
    );
  },
);

Carousel.displayName = 'Carousel';
