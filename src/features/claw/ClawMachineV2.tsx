/**
 * ClawMachine V2 - Multi-Row Horizontal Slider RRM
 * Flow: GO button → 3 rows spin independently → freeze → select random visible card → reveal modal
 * Future: Will add claw grab animation to select the winning card
 */

import React, { useRef, useState, useCallback, useMemo } from 'react';
import MultiRowSlider, { MultiRowSliderHandle, SliderItem, VisibleCard } from '../../components/MultiRowSlider';
import ClawAnimation, { ClawAnimationHandle } from '../../components/ClawAnimation';
import { ResultModal } from './ResultModal';
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
  const [isSpinning, setIsSpinning] = useState(false);
  const [playResult, setPlayResult] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
   * Handle GO! button click - initiate spin
   */
  const handleGO = useCallback(async () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setError(null);

    try {
      // Call mock API to get the prize (for backend validation)
      const result = await mockApi.play();
      console.log('🎲 Prize result from API:', result);

      // Spin all 3 rows for 4 seconds
      const spinDuration = 4000;
      await sliderRef.current?.spinToResult(result.prize.id, spinDuration);

      console.log('✅ Spin complete, rows frozen');

      // Get all visible cards from all rows (3x5 grid = 15 cards)
      const visibleCards = sliderRef.current?.getVisibleCards() || [];
      console.log('👀 Visible cards after freeze (3x5 grid):', visibleCards);

      // Select winning card from visible cards (respecting drop rates)
      const winningCard = selectWinningCard(visibleCards);
      console.log('🎯 Selected winning card:', winningCard);
      console.log('📍 Grid position for claw:', winningCard.gridPosition);

      // Animate claw to winning position
      await clawRef.current?.moveToPosition(winningCard.gridPosition, 2.5);

      // Highlight the winning card with golden outline using grid coordinates
      sliderRef.current?.highlightCard(winningCard.rowIndex, winningCard.colIndex);

      // Wait a moment for highlight effect
      await new Promise(resolve => setTimeout(resolve, 800));

      // Find the actual prize data
      const actualPrize = prizes.find((p) => p.id === winningCard.prizeId);

      if (!actualPrize) {
        throw new Error('Could not find winning prize');
      }

      console.log(`🎁 Winning prize: ${actualPrize.name} (${actualPrize.id})`);

      // Create result with the winning prize
      const actualResult = {
        ...result,
        prize: actualPrize,
      };

      // Show the modal
      setPlayResult(actualResult);
      setShowModal(true);
      console.log('🎉 Modal opened with winning prize');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to play');
    } finally {
      setIsSpinning(false);
    }
  }, [isSpinning]);

  /**
   * Handle claim action in modal
   */
  const handleClaim = useCallback(() => {
    // Modal handles the claim logic internally
    setTimeout(() => {
      setShowModal(false);
      setPlayResult(null);
      sliderRef.current?.clearHighlight();
    }, 1500);
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

          {/* Claw Animation Overlay */}
          <ClawAnimation
            ref={clawRef}
            containerWidth={1200}
            containerHeight={600}
            railTop={10}
          />
        </div>
      </div>

      {/* Control Panel */}
      <div className={styles.controlPanel}>
        <button
          className={`${styles.button} ${styles.buttonPrimary}`}
          onClick={handleGO}
          disabled={isSpinning}
          style={{
            fontSize: '2rem',
            padding: '1.5rem 4rem',
            minWidth: '200px',
          }}
        >
          {isSpinning ? 'SPINNING...' : 'GO!'}
        </button>

        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}
      </div>

      {/* Dev Controls */}
      {showDevControls && (
        <div className={styles.devControls}>
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
