/**
 * ClawAnimation Component
 * - Visible rail system at top with claw
 * - Claw starts at top-right, positioned between rows
 * - 2-move animation: horizontal (to target row), then vertical (to target column)
 * - Grid-locked movement for precise positioning
 */

import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import gsap from 'gsap';
import { GridPosition } from './MultiRowSlider';
import './ClawAnimation.css';

export interface ClawAnimationHandle {
  moveToPosition(gridPosition: GridPosition, duration?: number): Promise<void>;
  reset(): void;
}

interface ClawAnimationProps {
  containerWidth: number;
  containerHeight: number;
  railTop?: number; // Distance from top of container
}

const ClawAnimation = forwardRef<ClawAnimationHandle, ClawAnimationProps>(
  ({ containerWidth, containerHeight, railTop = 0 }, ref) => {
    const railRef = useRef<HTMLDivElement>(null);
    const clawCarriageRef = useRef<HTMLDivElement>(null);
    const clawRef = useRef<HTMLDivElement>(null);

    // Initial position: top-right, between rows
    const initialX = containerWidth - 100; // 100px from right edge
    const railY = railTop + 20; // Rail height from top

    useImperativeHandle(ref, () => ({
      moveToPosition: async (gridPosition: GridPosition, duration = 2) => {
        if (!clawCarriageRef.current || !clawRef.current) return;

        const timeline = gsap.timeline();

        // Move 1: Horizontal movement along rail to target column
        timeline.to(clawCarriageRef.current, {
          x: gridPosition.x,
          duration: duration * 0.5,
          ease: 'power2.inOut',
        });

        // Move 2: Vertical descent to target row
        timeline.to(clawRef.current, {
          y: gridPosition.y - railY,
          duration: duration * 0.4,
          ease: 'power2.inOut',
        });

        // Grab animation (claw closes slightly)
        timeline.to(clawRef.current, {
          scale: 0.95,
          duration: 0.2,
          ease: 'power2.in',
          yoyo: true,
          repeat: 1,
        });

        await timeline.then();
      },

      reset: () => {
        if (!clawCarriageRef.current || !clawRef.current) return;
        gsap.to(clawCarriageRef.current, {
          x: initialX,
          duration: 0.8,
          ease: 'power2.inOut',
        });
        gsap.to(clawRef.current, {
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: 'power2.inOut',
        });
      },
    }));

    return (
      <div className="claw-system">
        {/* Horizontal Rail at Top */}
        <div
          ref={railRef}
          className="claw-rail"
          style={{
            top: `${railY}px`,
            width: `${containerWidth}px`,
          }}
        >
          {/* Rail visual (futuristic tech style) */}
          <div className="rail-track" />
          <div className="rail-lights">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="rail-light" />
            ))}
          </div>
        </div>

        {/* Claw Carriage (moves horizontally on rail) */}
        <div
          ref={clawCarriageRef}
          className="claw-carriage"
          style={{
            top: `${railY}px`,
            left: '0px',
            transform: `translateX(${initialX}px)`,
          }}
        >
          {/* Vertical cable */}
          <div className="claw-cable" />

          {/* Claw (moves vertically) */}
          <div ref={clawRef} className="claw">
            {/* Claw SVG */}
            <svg
              width="80"
              height="80"
              viewBox="0 0 80 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="claw-svg"
            >
              {/* Claw body */}
              <g className="claw-body">
                {/* Central mechanism */}
                <circle cx="40" cy="15" r="12" fill="#555" stroke="#888" strokeWidth="2" />
                <circle cx="40" cy="15" r="6" fill="#666" />

                {/* Left claw arm */}
                <path
                  d="M 35 20 Q 25 35 20 50 L 25 55 Q 30 40 35 25 Z"
                  fill="#777"
                  stroke="#999"
                  strokeWidth="2"
                  className="claw-arm-left"
                />

                {/* Right claw arm */}
                <path
                  d="M 45 20 Q 55 35 60 50 L 55 55 Q 50 40 45 25 Z"
                  fill="#777"
                  stroke="#999"
                  strokeWidth="2"
                  className="claw-arm-right"
                />

                {/* Center claw arm */}
                <path
                  d="M 38 22 L 38 50 L 42 50 L 42 22 Z"
                  fill="#888"
                  stroke="#aaa"
                  strokeWidth="1"
                />

                {/* Claw tips */}
                <circle cx="22" cy="52" r="4" fill="#999" stroke="#bbb" strokeWidth="1" />
                <circle cx="58" cy="52" r="4" fill="#999" stroke="#bbb" strokeWidth="1" />
                <circle cx="40" cy="50" r="4" fill="#999" stroke="#bbb" strokeWidth="1" />

                {/* Tech details */}
                <line x1="35" y1="15" x2="45" y2="15" stroke="#0ff" strokeWidth="2" opacity="0.6" />
                <circle cx="40" cy="15" r="3" fill="#0ff" opacity="0.8" />
              </g>

              {/* Glow effect */}
              <circle cx="40" cy="15" r="18" fill="none" stroke="#0ff" strokeWidth="1" opacity="0.3" className="claw-glow" />
            </svg>
          </div>
        </div>
      </div>
    );
  }
);

ClawAnimation.displayName = 'ClawAnimation';

export default ClawAnimation;
