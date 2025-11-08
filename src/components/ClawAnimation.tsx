/**
 * ClawAnimation Component
 * - Visible rail system at top with claw
 * - Claw starts at top-right, positioned between rows
 * - 2-move animation: horizontal (to target row), then vertical (to target column)
 * - Grid-locked movement for precise positioning
 */

import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import gsap from 'gsap';
import { GridPosition } from './MultiRowSlider';
import './ClawAnimation.css';

export interface ClawAnimationHandle {
  moveToPosition(gridPosition: GridPosition, duration?: number): Promise<void>;
  pickupAndDeliver(
    cardPosition: GridPosition,
    displaySlotPosition: { x: number; y: number },
    phantomCardRef: React.RefObject<HTMLDivElement>,
    cardSize: number
  ): Promise<void>;
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
    const cableRef = useRef<HTMLDivElement>(null);

    // Initial position: top-right, visible within container bounds
    const initialX = containerWidth - 200; // 200px from right edge to ensure visibility
    const railY = railTop + 20; // Rail height from top

    useImperativeHandle(ref, () => ({
      moveToPosition: async (gridPosition: GridPosition, duration = 2) => {
        if (!clawCarriageRef.current || !clawRef.current || !cableRef.current) return;

        const timeline = gsap.timeline();

        // Move 1: Horizontal movement along rail to target column
        timeline.to(clawCarriageRef.current, {
          x: gridPosition.x,
          duration: duration * 0.5,
          ease: 'power2.inOut',
        });

        // Move 2: Vertical descent to target row
        const dropDistance = gridPosition.y - railY;
        timeline
          .to(clawRef.current, {
            y: dropDistance,
            duration: duration * 0.4,
            ease: 'power2.inOut',
          })
          // Extend cable as claw descends
          .to(cableRef.current, {
            height: Math.max(20, dropDistance + 40), // Ensure minimum height
            duration: duration * 0.4,
            ease: 'power2.inOut',
          }, '<'); // Start at same time as claw descent

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

      pickupAndDeliver: async (
        cardPosition: GridPosition,
        displaySlotPosition: { x: number; y: number },
        phantomCardRef: React.RefObject<HTMLDivElement>,
        cardSize: number
      ) => {
        if (!clawCarriageRef.current || !clawRef.current || !phantomCardRef.current || !cableRef.current) return;

        const timeline = gsap.timeline();
        const phantomCard = phantomCardRef.current;
        const dropDistance = cardPosition.y - railY;

        // Phase 1: Move to card position (existing moveToPosition logic)
        timeline
          // Horizontal sweep to column - center perfectly on card
          .to(clawCarriageRef.current, {
            x: cardPosition.x, // Center on card position exactly
            duration: 1.2,
            ease: 'power2.inOut',
          })
          // Vertical descent to row with cable extension
          .to(clawRef.current, {
            y: dropDistance,
            duration: 0.8,
            ease: 'power2.inOut',
          })
          .to(cableRef.current, {
            height: Math.max(20, dropDistance + 40),
            duration: 0.8,
            ease: 'power2.inOut',
          }, '<')
          // Phase 2: Reveal phantom card BEFORE grab (so card appears before it's grabbed)
          .set(phantomCard, {
            visibility: 'visible',
            left: cardPosition.x - cardSize / 2, // Center phantom card at exact position
            top: cardPosition.y - cardSize / 2,
          })
          // Wait a moment for card to be visible
          .to({}, { duration: 0.2 })
          // Grab: claw closes slightly
          .to(clawRef.current, {
            scale: 0.95,
            duration: 0.15,
            ease: 'power2.in',
          })
          // Phase 3: Lift card (2D depth simulation) - scale during lift
          .to(
            phantomCard,
            {
              scale: 1.15, // Slightly bigger (closer to camera)
              boxShadow: '0 30px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(255, 215, 0, 0.8)',
              duration: 0.6,
              ease: 'power2.out',
            }
          )
          // Calculate safe lift height - never go above rail (y=0)
          .to(
            clawRef.current,
            {
              y: Math.max(0, dropDistance - 150), // Lift up but never above rail level
              duration: 0.6,
              ease: 'power2.out',
            },
            '<' // Start at same time as scale
          )
          // Move phantom card with claw, ensuring it stays visible below rail
          .to(
            phantomCard,
            {
              top: Math.max(railY + 60, cardPosition.y - 150) - cardSize / 2, // Keep card below rail
              duration: 0.6,
              ease: 'power2.out',
            },
            '<'
          )
          // Retract cable to match new claw position
          .to(
            cableRef.current,
            {
              height: Math.max(20, Math.max(0, dropDistance - 150) + 40),
              duration: 0.6,
              ease: 'power2.out',
            },
            '<'
          )
          // Phase 4: Horizontal carry to display slot - move BOTH claw carriage and phantom card
          .to(
            clawCarriageRef.current,
            {
              x: displaySlotPosition.x,
              duration: 1.5,
              ease: 'power1.inOut',
            }
          )
          .to(
            phantomCard,
            {
              left: displaySlotPosition.x - cardSize / 2, // Move with claw horizontally
              // Keep vertical position consistent during horizontal move
              top: Math.max(railY + 60, cardPosition.y - 150) - cardSize / 2,
              duration: 1.5,
              ease: 'power1.inOut',
            },
            '<' // Start at same time as claw carriage
          )
          // Phase 5: Small descent for release (just a slight dip, not to display slot)
          .to(clawRef.current, {
            y: `+=30`, // Just move down 30px for release animation
            duration: 0.4,
            ease: 'power2.in',
          })
          // Extend cable slightly for the small descent
          .to(
            cableRef.current,
            {
              height: Math.max(20, Math.max(0, dropDistance - 150) + 40 + 30), // Add 30px to cable
              duration: 0.4,
              ease: 'power2.in',
            },
            '<'
          )
          // Move phantom card down slightly with claw
          .to(
            phantomCard,
            {
              top: `+=30`, // Move card down same amount
              scale: 1, // Back to normal size
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              duration: 0.4,
              ease: 'power2.in',
            },
            '<'
          )
          // Phase 6: Release - claw opens
          .to(clawRef.current, {
            scale: 1,
            duration: 0.15,
            ease: 'power2.out',
          })
          // Hide phantom card (will be replaced by display slot's bouncy animation)
          .set(phantomCard, {
            visibility: 'hidden',
          })
          // Phase 7: Claw returns home
          .to(
            clawRef.current,
            {
              y: 0,
              duration: 0.6,
              ease: 'power2.inOut',
            },
            '+=0.2' // Small delay after release
          )
          // Retract cable as claw returns
          .to(
            cableRef.current,
            {
              height: 20, // Back to initial height
              duration: 0.6,
              ease: 'power2.inOut',
            },
            '<'
          )
          .to(
            clawCarriageRef.current,
            {
              x: initialX,
              duration: 1,
              ease: 'power2.inOut',
            },
            '<'
          );

        await timeline.then();
      },

      reset: () => {
        if (!clawCarriageRef.current || !clawRef.current || !cableRef.current) return;
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
        gsap.to(cableRef.current, {
          height: 20,
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
            width: `${containerWidth + 40}px`, // Extend 20px on each side
            left: '-20px', // Offset to extend outside left boundary
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
            top: `${railY + 18}px`, // Moved down 10 more pixels for proper rail attachment
            left: '0px',
            transform: `translateX(${initialX}px)`,
          }}
        >
          {/* Dynamic vertical cable that extends/retracts */}
          <div
            ref={cableRef}
            className="claw-cable"
            style={{
              height: '20px', // Initial height, will be animated
            }}
          />

          {/* Claw (moves vertically) - positioned at end of cable */}
          <div
            ref={clawRef}
            className="claw"
            style={{
              position: 'absolute',
              top: '20px', // Start below cable attachment
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            {/* PNG Claw properly aligned to cable - shifted left for angled perspective */}
            <img
              src="/src/assets/claw.png"
              alt="Claw"
              className="claw-image"
              style={{
                width: '96px',
                height: '96px',
                objectFit: 'contain',
                position: 'relative',
                top: '-15px', // Adjust to align claw shaft with cable
                left: '-8px', // Shift left to account for angled perspective
              }}
            />
          </div>
        </div>
      </div>
    );
  }
);

ClawAnimation.displayName = 'ClawAnimation';

export default ClawAnimation;
