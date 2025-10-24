/**
 * ClawMachine Container Component
 * Orchestrates state, GSAP timelines, and API calls for the full play experience.
 *
 * ANIMATION SEQUENCE:
 * 1. SPIN: fast right→left carousel scroll (constant speed)
 * 2. DECELERATE: carousel slows to a stop, prize centers
 * 3. GRAB: claw drops, closes, lifts (hitting the centered prize)
 * 4. REVEAL: modal opens with result
 * 5. CLAIM: user confirms the reward
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import prizes from './prizes.fixture.json';
import { useClawState } from './useClawState';
import * as mockApi from './mockApi';
import * as carouselUtils from './utils.carousel';
import { ClawMachineScene } from './ClawMachineScene';
import { ControlPanel } from './ControlPanel';
import { ResultModal } from './ResultModal';
import { EffectsLayer } from './EffectsLayer';
import { Carousel, CarouselHandle } from './Carousel';
import { Claw, ClawHandle } from './Claw';
import { Geometry, MachineState } from './types';
import styles from './styles.module.css';

/**
 * Animation timings (milliseconds) for normal and speed modes.
 * Speed mode = ~60% of normal durations.
 */
const TIMINGS_NORMAL = {
  spinMinMs: 2000,
  spinMaxMs: 3500,
  decelMs: 1200,
  dropMs: 400,
  grabMs: 300,
  liftMs: 500,
  revealMs: 300,
};

const TIMINGS_SPEED = {
  spinMinMs: Math.round(TIMINGS_NORMAL.spinMinMs * 0.6),
  spinMaxMs: Math.round(TIMINGS_NORMAL.spinMaxMs * 0.6),
  decelMs: Math.round(TIMINGS_NORMAL.decelMs * 0.6),
  dropMs: Math.round(TIMINGS_NORMAL.dropMs * 0.6),
  grabMs: Math.round(TIMINGS_NORMAL.grabMs * 0.6),
  liftMs: Math.round(TIMINGS_NORMAL.liftMs * 0.6),
  revealMs: Math.round(TIMINGS_NORMAL.revealMs * 0.6),
};

const MIN_LAPS = 1.5; // Minimum carousel rotations before landing on prize

interface ClawMachineProps {
  /**
   * Optional: Show skip button for dev/testing.
   * Also respects prefers-reduced-motion.
   */
  showDevControls?: boolean;
}

/**
 * Main Claw Machine component.
 * Manages the full game loop: spin → decelerate → grab → reveal → claim.
 */
export const ClawMachine: React.FC<ClawMachineProps> = ({ showDevControls = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<CarouselHandle>(null);
  const clawRef = useRef<ClawHandle>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const playButtonRef = useRef<HTMLButtonElement>(null);

  const [isSpeedclaw, setIsSpeedclaw] = useState(false);
  const [geometry, setGeometry] = useState<Geometry | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  const clawState = useClawState();
  const { state, playResult, highlightId } = clawState.state;

  // Detect reduced motion preference
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setReducedMotion(prefersReduced);
  }, []);

  // Geometry measurement callback
  const handleMeasure = useCallback((containerEl: HTMLElement, tileEl: HTMLElement) => {
    const geo = carouselUtils.measure(containerEl, tileEl);
    setGeometry(geo);
  }, []);

  /**
   * Play action: initiate the spin → decelerate → grab sequence.
   */
  const handlePlay = useCallback(async () => {
    if (!clawState.canPlay() || !geometry) return;

    clawState.play();

    // Immediately fetch the prize
    try {
      const result = await mockApi.play();
      clawState.attachResult(result);

      // Announce for accessibility
      announceResult(result.prize.name);

      if (reducedMotion) {
        // Skip animation, go straight to reveal
        clawState.decelerate();
        clawState.grab();
        clawState.reveal();
        return;
      }

      // Build and play animations
      playAnimationSequence(result.prize.id);
    } catch (err) {
      clawState.setError(err instanceof Error ? err.message : 'Failed to fetch prize');
    }
  }, [clawState, geometry, reducedMotion]);

  /**
   * Build GSAP timeline: spin → decelerate → grab → reveal.
   */
  const playAnimationSequence = useCallback(
    (targetPrizeId: string) => {
      if (!carouselRef.current || !clawRef.current || !geometry) return;

      // Kill any existing timeline
      if (timelineRef.current) {
        timelineRef.current.kill();
      }

      const timings = isSpeedclaw ? TIMINGS_SPEED : TIMINGS_NORMAL;
      const currentX = carouselRef.current.getX();
      const fromIndex = carouselUtils.getIndexFromX(currentX, geometry.VIEW_W, geometry.ITEM_W);

      // Calculate target index with minimum lap requirement
      const targetIndex = carouselUtils.pickTargetIndex({
        baseItems: prizes,
        targetId: targetPrizeId,
        fromIndex,
        minLaps: MIN_LAPS,
      });

      const targetX = carouselUtils.translateForIndex(targetIndex, geometry.VIEW_W, geometry.ITEM_W);
      const distance = carouselUtils.decelerationDistance(currentX, targetX);
      const decelMs = Math.max(
        timings.decelMs,
        carouselUtils.estimateDecelMs(distance, timings.decelMs, timings.decelMs * 1.5),
      );

      // Master timeline
      const tl = gsap.timeline({ paused: true });

      // ─────────────────────────────────────────────
      // SPIN PHASE (fast, constant speed)
      // ─────────────────────────────────────────────
      const spinDuration = timings.spinMinMs + Math.random() * (timings.spinMaxMs - timings.spinMinMs);
      tl.to(carouselRef.current, {
        onUpdate() {
          if (carouselRef.current) {
            const x = carouselRef.current.getX();
            clawState.setCurrentX(x);
          }
        },
      })
        .to(
          carouselRef.current,
          {
            onUpdate() {
              if (carouselRef.current) {
                const x = carouselRef.current.getX();
                clawState.setCurrentX(x);
              }
            },
          },
          0,
        )
        .add('spin:start', 0)
        .add('spin:decel', `+=${spinDuration / 1000}s`);

      // ─────────────────────────────────────────────
      // DECELERATE PHASE (slow to a stop)
      // ─────────────────────────────────────────────
      tl.to(
        carouselRef.current,
        {
          x: targetX,
          duration: decelMs / 1000,
          ease: 'power3.out',
          onUpdate() {
            if (carouselRef.current) {
              const x = carouselRef.current.getX();
              clawState.setCurrentX(x);
            }
          },
        },
        'spin:decel',
      ).add('claw:drop', `+=0.1s`);

      clawState.decelerate();

      // ─────────────────────────────────────────────
      // CLAW DROP & GRAB PHASE
      // ─────────────────────────────────────────────
      tl.call(() => clawRef.current?.drop(), [], 'claw:drop');
      tl.call(() => clawRef.current?.setOpen(false), [], `+=${timings.dropMs / 1000}s`);
      tl.add('claw:lift', `+=${timings.grabMs / 1000}s`);
      tl.call(() => clawRef.current?.lift(), [], 'claw:lift');
      tl.add('reveal', `+=${timings.liftMs / 1000}s`);

      clawState.grab();

      // ─────────────────���───────────────────────────
      // REVEAL PHASE (show modal)
      // ─────────────────────────────────────────────
      tl.call(
        () => {
          clawState.reveal();
        },
        [],
        'reveal',
      );

      timelineRef.current = tl;
      tl.play();
    },
    [isSpeedclaw, clawState, geometry],
  );

  /**
   * Skip animation (dev/testing).
   */
  const handleSkip = useCallback(() => {
    if (timelineRef.current) {
      timelineRef.current.kill();
    }
    clawState.decelerate();
    clawState.grab();
    clawState.reveal();
  }, [clawState]);

  /**
   * Handle claim (user clicks CTA button in modal).
   */
  const handleClaim = useCallback(
    (result: any) => {
      clawState.claim(result);
    },
    [clawState],
  );

  /**
   * Close modal and reset.
   */
  const handleCloseModal = useCallback(() => {
    clawState.reset();
    if (timelineRef.current) {
      timelineRef.current.kill();
    }
    clawRef.current?.setOpen(true); // Reset claw to open
  }, [clawState]);

  // Announce result for screen readers
  const announceResult = (prizeName: string) => {
    const announcement = document.createElement('div');
    announcement.className = styles.srOnly;
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.textContent = `You won: ${prizeName}`;
    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 2000);
  };

  const showSkip = showDevControls || reducedMotion;

  return (
    <div className={styles.container} ref={containerRef}>
      {/* Main scene */}
      <ClawMachineScene
        prizes={prizes}
        carouselRef={carouselRef}
        clawRef={clawRef}
        highlightId={highlightId}
        onCarouselMeasure={handleMeasure}
      />

      {/* Controls */}
      <ControlPanel
        state={state}
        canPlay={clawState.canPlay()}
        onPlay={handlePlay}
        isSpeedclaw={isSpeedclaw}
        onSpeedclawChange={setIsSpeedclaw}
        onSkip={handleSkip}
        showSkip={showSkip}
      />

      {/* Result modal */}
      <ResultModal
        isOpen={clawState.isRevealOpen()}
        prize={playResult?.prize || null}
        playId={playResult?.playId || null}
        onClose={handleCloseModal}
        onClaim={handleClaim}
      />

      {/* Effects (confetti, etc.) */}
      <EffectsLayer effect="confetti" play={state === MachineState.Reveal} />

      {/* Accessibility announcements */}
      <div
        className={styles.srOnly}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        id="claw-announcer"
      >
        {state === MachineState.Spinning && 'Machine spinning...'}
        {state === MachineState.Decelerating && 'Spinning down...'}
        {state === MachineState.Grabbing && 'Claw grabbing...'}
        {state === MachineState.Reveal && playResult && `You won: ${playResult.prize.name}!`}
      </div>
    </div>
  );
};
