/**
 * ClawMachine V2 - Multi-Row Horizontal Slider RRM
 * Flow: GO button → 3 rows spin independently → freeze → select random visible card → reveal modal
 * Future: Will add claw grab animation to select the winning card
 */

import React, { useRef, useState, useCallback, useMemo } from 'react';
import MultiRowSlider, { MultiRowSliderHandle, SliderItem, VisibleCard } from '../../components/MultiRowSlider';
import ClawAnimation, { ClawAnimationHandle } from '../../components/ClawAnimation';
import { PrizeDisplaySlot } from '../../components/PrizeDisplaySlot';
import { PhantomCard } from '../../components/PhantomCard';
import { ResultModal } from './ResultModal';
import { Prize } from './types';
import * as mockApi from './mockApi';
import prizes from './prizes.fixture.json';
import styles from './styles.module.css';

interface ClawMachineV2Props {
  showDevControls?: boolean;
}

/**
 * Main Claw Machine component V2
 * Uses MultiRowSlider with 3 independent horizontal rows
 */
export const ClawMachineV2: React.FC<ClawMachineV2Props> = ({ showDevControls = false }) => {
  const sliderRef = useRef<MultiRowSliderHandle>(null);
  const clawRef = useRef<ClawAnimationHandle>(null);
  const phantomCardRef = useRef<HTMLDivElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [playResult, setPlayResult] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const spinStartTimeRef = useRef<number>(0);
  const apiResultRef = useRef<any>(null);

  // Display slot state
  const [displaySlotPrize, setDisplaySlotPrize] = useState<Prize | null>(null);

  // Phantom card state
  const [phantomCard, setPhantomCard] = useState<{
    prize: Prize;
    position: { x: number; y: number };
    size: number;
    visible: boolean;
  } | null>(null);

  // Container dimensions (matching the render)
  const containerWidth = 1200;
  const containerHeight = 600;

  // Convert prizes fixture to slider items
  const sliderItems: SliderItem[] = useMemo(
    () =>
      prizes.map((prize) => ({
        id: `item-${prize.id}`,
        prizeId: prize.id,
        imageUrl: getHighDefImageUrl(prize.id),
        name: prize.name,
      })),
    []
  );

  /**
   * Get high-definition product image URL
   * Looks up imageFileName from prize data and serves from /public/prizes/
   */
  function getHighDefImageUrl(prizeId: string): string {
    const prize = prizes.find((p) => p.id === prizeId);

    if (prize?.imageFileName) {
      const imageUrl = `/prizes/${prize.imageFileName}`;
      return imageUrl;
    }

    console.warn(`⚠️ No imageFileName for ${prizeId}, using fallback`);
    return '/prizes/default.webp';
  }

  /**
   * Weighted random selection from visible cards
   * Respects drop rates from prize weights
   */
  function selectWinningCard(visibleCards: VisibleCard[]) {
    // Get weights for all visible cards
    const weightedCards = visibleCards.map((card) => {
      const prize = prizes.find((p) => p.id === card.prizeId);
      return {
        ...card,
        weight: prize?.weight || 1,
      };
    });

    // Calculate total weight
    const totalWeight = weightedCards.reduce((sum, card) => sum + card.weight, 0);

    // Random selection based on weights
    let random = Math.random() * totalWeight;

    for (const card of weightedCards) {
      random -= card.weight;
      if (random <= 0) {
        return card;
      }
    }

    // Fallback to first card
    return weightedCards[0];
  }

  /**
   * Handle GO! button click - initiate continuous spin
   */
  const handleGO = useCallback(async () => {
    if (isSpinning) {
      // Button clicked while spinning - initiate stop sequence
      if (!isStopping) {
        setIsStopping(true);
        console.log('🛑 Stopping spin...');

        // Calculate minimum spin time (ensure at least 1 second of spinning)
        const spinTime = Date.now() - spinStartTimeRef.current;
        const minSpinTime = 1000;

        if (spinTime < minSpinTime) {
          // Wait a bit more before stopping
          await new Promise(resolve => setTimeout(resolve, minSpinTime - spinTime));
        }

        // Stop with deceleration animation
        await sliderRef.current?.stopSpinWithDeceleration(1500);

        console.log('✅ Spin stopped, rows frozen');

        // Wait a bit for carousel to settle
        await new Promise(resolve => setTimeout(resolve, 100));

        // Get all visible cards from all rows (3x5 grid = 15 cards)
        const visibleCards = sliderRef.current?.getVisibleCards() || [];

        // Select winning card from visible cards (respecting drop rates)
        const winningCard = selectWinningCard(visibleCards);

        // Find the actual prize data
        const actualPrize = prizes.find((p) => p.id === winningCard.prizeId);

        if (!actualPrize) {
          throw new Error('Could not find winning prize');
        }

        // Calculate card size from container
        const rowHeight = (containerHeight - 2 * 12) / 3; // 3 rows with 12px gaps
        const cardSize = rowHeight * 0.85;

        // Setup phantom card (initially hidden, positioned at winning card's grid position)
        setPhantomCard({
          prize: actualPrize as Prize,
          position: winningCard.gridPosition,
          size: cardSize,
          visible: false,
        });

        // Wait for phantom card to be rendered in DOM before claw can access it
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Calculate display slot position (bottom left area, below carousel)
        // Display slot is 180px wide, inner box is 140px, plus margins
        const displaySlotPosition = {
          x: 90 + 30, // Display slot center: 90px (half of 180px width) + 30px left margin
          y: containerHeight + 110, // Below carousel + margin to reach control panel area center
        };

        // SUSPENSE: Start claw movement WITHOUT highlighting yet
        console.log('🤖 Starting claw animation...');

        // Start the claw animation in parallel with suspense timing
        const clawPromise = clawRef.current?.pickupAndDeliver(
          winningCard.gridPosition,
          displaySlotPosition,
          phantomCardRef,
          cardSize
        );

        // Build suspense: Wait before revealing which card will be grabbed
        // The claw will be moving horizontally during this time
        await new Promise(resolve => setTimeout(resolve, 900));

        // NOW highlight the winning card as claw is approaching (creates "aha!" moment)
        sliderRef.current?.highlightCard(winningCard.rowIndex, winningCard.colIndex);

        // Hide the winning card from carousel when claw grabs it
        // Adjusted timing: 900ms delay + 300ms more horizontal + 800ms descent = 2000ms total
        setTimeout(() => {
          sliderRef.current?.hideCard(winningCard.rowIndex, winningCard.colIndex);
          sliderRef.current?.clearHighlight();
        }, 1100);

        // Trigger display slot prize when claw arrives at delivery position
        // Calculate timing: horizontal(1.2) + descend(0.8) + grab(0.15) + scale(0.6) + lift(0.6) + carry(1.5) = 4.85s
        setTimeout(() => {
          console.log('🎯 Triggering display slot prize update');
          setPhantomCard(null); // Hide phantom card
          setDisplaySlotPrize(actualPrize as Prize); // Show in display slot immediately
        }, 4850); // Right when claw arrives at delivery position

        // Wait for the claw animation to complete
        await clawPromise;

        console.log('🚚 Card delivered to display slot');

        // Wait for bouncy animation to complete (reduced from 1000ms to 800ms)
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Create result with the winning prize using the saved API result
        const actualResult = {
          ...apiResultRef.current,
          prize: actualPrize,
        };

        // Show the modal
        setPlayResult(actualResult);
        setShowModal(true);
        console.log('🎉 Modal opened with winning prize');

        // Reset stopping state
        setIsStopping(false);
        setIsSpinning(false);
      }
    } else {
      // Start a new spin
      setIsSpinning(true);
      setError(null);

      try {
        // Reset state from previous spin
        console.log('🔄 Resetting carousel state...');
        sliderRef.current?.clearHighlight();
        sliderRef.current?.resetHiddenCards(); // Show all cards again

        // Clear phantom card
        setPhantomCard(null);

        // Clear display slot prize (triggers exit animation)
        setDisplaySlotPrize(null);

        // Call mock API to get the prize (for backend validation)
        const result = await mockApi.play();
        console.log('🎲 Prize result from API:', result);
        apiResultRef.current = result; // Save for later use

        // Record spin start time
        spinStartTimeRef.current = Date.now();

        // Start continuous spin
        sliderRef.current?.startContinuousSpin();
        console.log('🎰 Spinning started - click button again to stop');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to play');
        setIsSpinning(false);
      }
    }
  }, [isSpinning, isStopping, containerHeight]);

  /**
   * Handle claim action in modal
   */
  const handleClaim = useCallback(() => {
    // Modal handles the claim logic internally
    // Don't auto-close - let user close manually via X button or Esc
  }, []);

  /**
   * Handle modal close - clear highlight and resume
   */
  const handleCloseModal = useCallback(() => {
    console.log('🔓 Closing modal, clearing highlight');
    sliderRef.current?.clearHighlight();
    sliderRef.current?.unfreeze();
    clawRef.current?.reset();
    setShowModal(false);
    setPlayResult(null);
    // Note: We keep the prize in the display slot until next play
  }, []);

  return (
    <div className={styles.container}>
      {/* Multi-Row Slider Scene */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '600px',
          marginBottom: '2rem',
          borderRadius: '1rem',
          overflow: 'visible',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
        }}
      >

        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            borderRadius: '1rem',
            overflow: 'hidden',
          }}
        >
          <MultiRowSlider
            ref={sliderRef}
            items={sliderItems}
            rowCount={3}
            onSpinComplete={() => console.log('Spin animation complete')}
          />

          {/* Phantom Card - animated clone for pickup/delivery */}
          {phantomCard && (
            <PhantomCard
              ref={phantomCardRef}
              prize={phantomCard.prize}
              initialPosition={phantomCard.position}
              size={phantomCard.size}
              visible={phantomCard.visible}
            />
          )}

          {/* Claw Animation Overlay */}
          <ClawAnimation
            ref={clawRef}
            containerWidth={containerWidth}
            containerHeight={containerHeight}
            railTop={10}
          />
        </div>
      </div>

      {/* Control Panel - with display slot on left, GO button center, dev controls on right */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2rem', position: 'relative' }}>
        {/* Prize Display Slot - bottom left */}
        <div style={{ flex: '0 0 auto' }}>
          <PrizeDisplaySlot prize={displaySlotPrize} />
        </div>

        {/* GO Button - center */}
        <div className={styles.controlPanel} style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={handleGO}
            disabled={isStopping}
            style={{
              fontSize: '2rem',
              padding: '1.5rem 4rem',
              minWidth: '200px',
            }}
          >
            {isStopping ? 'STOPPING...' : isSpinning ? 'STOP' : 'GO!'}
          </button>

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}
        </div>

        {/* Dev Controls - right side */}
        {showDevControls && (
          <div className={styles.devControls} style={{ flex: '0 0 auto' }}>
            <h3>Dev Controls</h3>
            <button onClick={() => sliderRef.current?.freeze()}>Freeze</button>
            <button onClick={() => sliderRef.current?.unfreeze()}>Unfreeze</button>
            <button onClick={() => {
              const visible = sliderRef.current?.getVisibleCards();
              console.log('Visible cards:', visible);
            }}>
              Log Visible Cards
            </button>
          </div>
        )}
      </div>

      {/* Result Modal */}
      {playResult && (
        <ResultModal
          isOpen={showModal}
          prize={playResult.prize}
          playId={playResult.playId}
          onClaim={handleClaim}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};
