/**
 * ClawMachineScene Component
 * Layout container with SVG frame, carousel, and claw.
 */

import React from 'react';
import { Carousel, CarouselHandle } from './Carousel';
import { Claw, ClawHandle } from './Claw';
import { Prize } from './types';
import styles from './styles.module.css';

interface ClawMachineSceneProps {
  prizes: Prize[];
  carouselRef: React.Ref<CarouselHandle>;
  clawRef: React.Ref<ClawHandle>;
  highlightId?: string | null;
  onCarouselMeasure?: (containerEl: HTMLElement, tileEl: HTMLElement) => void;
}

/**
 * Main scene container with machine frame, carousel, and claw.
 * Includes visual center line for alignment debugging.
 */
export const ClawMachineScene: React.FC<ClawMachineSceneProps> = ({
  prizes,
  carouselRef,
  clawRef,
  highlightId,
  onCarouselMeasure,
}) => {
  return (
    <div className={styles.scene}>
      {/* SVG frame (placeholder) */}
      <div className={styles.frame}>
        <svg className={styles.frameSvg} viewBox="0 0 1000 500" xmlns="http://www.w3.org/2000/svg">
          {/* Machine box outline */}
          <rect x="20" y="30" width="960" height="350" fill="none" stroke="#333" strokeWidth="3" />

          {/* Top rail for claw */}
          <rect x="20" y="25" width="960" height="8" fill="#666" />

          {/* Side rails */}
          <line x1="30" y1="30" x2="30" y2="380" stroke="#999" strokeWidth="2" opacity="0.5" />
          <line x1="970" y1="30" x2="970" y2="380" stroke="#999" strokeWidth="2" opacity="0.5" />

          {/* Bottom platform */}
          <rect x="20" y="380" width="960" height="8" fill="#444" />

          {/* Decorative side panels */}
          <rect x="10" y="30" width="10" height="350" fill="#555" opacity="0.7" />
          <rect x="980" y="30" width="10" height="350" fill="#555" opacity="0.7" />
        </svg>
      </div>

      {/* Carousel layer */}
      <Carousel ref={carouselRef} prizes={prizes} highlightId={highlightId} onMeasure={onCarouselMeasure} />

      {/* Claw layer */}
      <Claw ref={clawRef} />
    </div>
  );
};
