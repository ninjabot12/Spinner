/**
 * Claw Component
 * Simple SVG claw with imperative controls for drop/lift/grab animations.
 */

import React, { useRef } from 'react';
import styles from './styles.module.css';

export interface ClawHandle {
  drop(): void;
  lift(): void;
  setOpen(isOpen: boolean): void;
}

/**
 * SVG claw with open/close state and drop/lift position.
 * Position is controlled by parent; this component manages open/close via CSS.
 */
export const Claw = React.forwardRef<ClawHandle, Record<string, never>>((_props, ref) => {
  const clawRef = useRef<SVGGElement>(null);
  const grabRef = useRef<SVGGElement>(null);

  let isDropped = false;
  let isOpen = true;

  const animateToPosition = (y: number, duration: number = 0.3) => {
    if (!clawRef.current) return;
    clawRef.current.style.transition = `transform ${duration}s ease-in-out`;
    clawRef.current.style.transform = `translateY(${y}px)`;
  };

  const setGrabOpen = (open: boolean) => {
    if (!grabRef.current) return;
    isOpen = open;
    grabRef.current.style.transform = open ? 'scaleX(1)' : 'scaleX(0.7)';
  };

  React.useImperativeHandle(
    ref,
    () => ({
      drop() {
        isDropped = true;
        animateToPosition(200, 0.4);
      },
      lift() {
        isDropped = false;
        animateToPosition(0, 0.5);
      },
      setOpen(open: boolean) {
        setGrabOpen(open);
      },
    }),
    [],
  );

  return (
    <div className={styles.clawContainer}>
      <svg
        className={styles.clawSvg}
        viewBox="0 0 100 150"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Claw arm */}
        <g ref={clawRef} style={{ transformOrigin: '50% 0%' }}>
          {/* Main arm shaft */}
          <rect x="45" y="0" width="10" height="80" fill="#333" rx="2" />

          {/* Claw grabber group */}
          <g ref={grabRef} style={{ transformOrigin: '50% 80%' }}>
            {/* Left pincer */}
            <rect x="30" y="80" width="8" height="50" fill="#666" rx="2" />
            {/* Right pincer */}
            <rect x="62" y="80" width="8" height="50" fill="#666" rx="2" />
            {/* Connector */}
            <circle cx="50" cy="80" r="8" fill="#444" />
          </g>

          {/* Claw cable visual */}
          <line x1="50" y1="0" x2="50" y2="80" stroke="#999" strokeWidth="1" opacity="0.5" />
        </g>
      </svg>
    </div>
  );
});

Claw.displayName = 'Claw';
