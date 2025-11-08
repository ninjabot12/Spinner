/**
 * MultiRowSlider Component - 3-Row Horizontal Slot Machine
 * - 3 horizontal rows stacked vertically
 * - Each row scrolls independently (random left/right direction)
 * - Freezes after ~4 seconds showing multiple visible cards
 * - Supports golden outline selection of winning card
 */

import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import './MultiRowSlider.css';

export interface SliderItem {
  id: string;
  prizeId: string;
  imageUrl: string;
  name: string;
}

export interface GridPosition {
  row: number; // 0-2 (3 rows)
  col: number; // 0-4 (5 columns)
  x: number; // pixel X position (center of card)
  y: number; // pixel Y position (center of card)
}

export interface VisibleCard {
  rowIndex: number;
  colIndex: number; // 0-4 for the 5 visible positions
  cardIndex: number; // Index in items array
  prizeId: string;
  gridPosition: GridPosition;
  domElement?: HTMLDivElement; // Reference to actual DOM element
}

export interface MultiRowSliderHandle {
  spinToResult(prizeId: string, duration: number): Promise<void>;
  startContinuousSpin(): void;
  stopSpinWithDeceleration(duration?: number): Promise<void>;
  snapToGrid(): void;
  freeze(): void;
  unfreeze(): void;
  getVisibleCards(): VisibleCard[];
  highlightCard(rowIndex: number, colIndex: number): void;
  clearHighlight(): void;
  getGridPosition(row: number, col: number): GridPosition;
  hideCard(rowIndex: number, colIndex: number): void;
  showCard(rowIndex: number, colIndex: number): void;
  resetHiddenCards(): void;
}

interface Props {
  items: SliderItem[];
  rowCount?: number;
  onSpinComplete?: () => void;
}

const MultiRowSlider = forwardRef<MultiRowSliderHandle, Props>(
  ({ items, rowCount = 3, onSpinComplete }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const rowRefs = useRef<HTMLDivElement[]>([]);
    const [highlightedCard, setHighlightedCard] = useState<{ row: number; col: number } | null>(null);
    const [hiddenCard, setHiddenCard] = useState<{ row: number; col: number } | null>(null);
    const [isSpinning, setIsSpinning] = useState(false);
    const animationFrameRef = useRef<number>();

    // Each row has its own position and velocity
    const rowStates = useRef<Array<{
      position: number;
      velocity: number;
      direction: 1 | -1; // 1 = left to right, -1 = right to left
      frozen: boolean;
    }>>(
      Array.from({ length: rowCount }, (_, index) => ({
        position: 0,
        velocity: 1, // Slower, smoother idle drift speed
        direction: index % 2 === 0 ? 1 : -1, // Alternating directions
        frozen: false,
      }))
    );

    const [isInitialized, setIsInitialized] = useState(false);

    // Card width (square) - will be calculated based on container height / 3
    const cardSizeRef = useRef(200);
    const gapSize = 16; // Gap between cards

    // Helper: Calculate exact grid position after snap
    const getGridPosition = (row: number, col: number): GridPosition => {
      if (!containerRef.current) {
        return { row, col, x: 0, y: 0 };
      }

      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      const cardSize = cardSizeRef.current;
      const cardWidth = cardSize + gapSize;

      // Calculate row layout
      const rowHeight = (containerHeight - (rowCount - 1) * 12) / rowCount;
      const totalRowsHeight = rowHeight * rowCount + 12 * (rowCount - 1);
      const topMargin = (containerHeight - totalRowsHeight) / 2;

      // Calculate column layout for exactly 5 visible cards
      const targetVisibleCards = 5;
      const totalCardsWidth = targetVisibleCards * cardWidth - gapSize;
      const leftMargin = (containerWidth - totalCardsWidth) / 2;

      // After snap, cards should be perfectly aligned to grid
      // Column 0 starts at leftMargin, each subsequent column is cardWidth apart
      const x = leftMargin + col * cardWidth + cardSize / 2;
      const y = topMargin + row * (rowHeight + 12) + rowHeight / 2;

      // Removed console log for performance

      return { row, col, x, y };
    };

    // Snap positions to grid - STRICT 5-card alignment
    const snapPositionsToGrid = () => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.clientWidth;
      const cardWidth = cardSizeRef.current + gapSize;
      const totalWidth = cardWidth * items.length;

      rowStates.current.forEach((state, rowIndex) => {
        // Round position to nearest card boundary
        const nearestCard = Math.round(state.position / cardWidth);
        const targetPosition = nearestCard * cardWidth;

        // Normalize to valid range [0, totalWidth)
        let normalizedPosition = targetPosition % totalWidth;
        if (normalizedPosition < 0) {
          normalizedPosition += totalWidth;
        }

        state.position = normalizedPosition;

        // Apply the transform immediately
        const rowEl = rowRefs.current[rowIndex];
        if (rowEl) {
          rowEl.style.transform = `translateX(${-normalizedPosition}px)`;
        }
      });

      // Position snapped
    };

    useEffect(() => {
      // Calculate card size based on container
      const updateCardSize = () => {
        if (containerRef.current) {
          const containerHeight = containerRef.current.clientHeight;
          // Divide by row count with some padding
          const rowHeight = (containerHeight - (rowCount - 1) * 12) / rowCount; // 12px gap between rows
          cardSizeRef.current = rowHeight * 0.85; // 85% of row height for smaller cards
        }
      };

      updateCardSize();
      window.addEventListener('resize', updateCardSize);
      return () => window.removeEventListener('resize', updateCardSize);
    }, [rowCount]);

    // Initialize random positions after mount
    useEffect(() => {
      if (!isInitialized && containerRef.current && items.length > 0) {
        // Wait a frame for card size to be calculated
        requestAnimationFrame(() => {
          const cardWidth = cardSizeRef.current + gapSize;
          const totalWidth = cardWidth * items.length;

          // Set random starting positions for each row
          rowStates.current.forEach((state) => {
            // Random card index
            const randomCardIndex = Math.floor(Math.random() * items.length);
            state.position = randomCardIndex * cardWidth;
          });

          // Snap to grid to ensure proper alignment
          snapPositionsToGrid();
          setIsInitialized(true);
        });
      }
    }, [isInitialized, items.length]);

    // Animation loop
    useEffect(() => {
      const animate = () => {
        rowRefs.current.forEach((rowEl, rowIndex) => {
          if (!rowEl) return;

          const state = rowStates.current[rowIndex];
          if (state.frozen) return;

          // Update position based on velocity
          state.position += state.velocity * state.direction;

          // Infinite loop: reset position when we've scrolled one full set
          const cardWidth = cardSizeRef.current + gapSize;
          const totalWidth = cardWidth * items.length;

          // Seamless wrapping for both directions
          if (state.position >= totalWidth) {
            state.position = state.position - totalWidth;
          } else if (state.position < 0) {
            state.position = state.position + totalWidth;
          }

          // Apply transform
          rowEl.style.transform = `translateX(${-state.position}px)`;
        });

        animationFrameRef.current = requestAnimationFrame(animate);
      };

      animationFrameRef.current = requestAnimationFrame(animate);
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [items.length]);

    useImperativeHandle(ref, () => ({
      spinToResult: async (prizeId: string, duration: number = 4000) => {
        setIsSpinning(true);
        setHighlightedCard(null);

        // Alternating rows spin in opposite directions
        rowStates.current.forEach((state, index) => {
          state.direction = index % 2 === 0 ? 1 : -1; // Even rows right, odd rows left
          state.velocity = (15 + Math.random() * 10) * 0.85; // Fast spin speed (reduced by 15%)
          state.frozen = false;
        });

        // Spin for duration, then freeze
        await new Promise<void>((resolve) => {
          setTimeout(() => {
            // Snap to grid before freezing
            snapPositionsToGrid();

            // Freeze all rows
            rowStates.current.forEach((state) => {
              state.frozen = true;
              state.velocity = 0;
            });

            setIsSpinning(false);
            if (onSpinComplete) onSpinComplete();
            resolve();
          }, duration);
        });
      },

      startContinuousSpin: () => {
        setIsSpinning(true);
        setHighlightedCard(null);

        // Alternating rows spin in opposite directions
        rowStates.current.forEach((state, index) => {
          state.direction = index % 2 === 0 ? 1 : -1; // Even rows right, odd rows left
          state.velocity = (15 + Math.random() * 10) * 0.85; // Fast spin speed
          state.frozen = false;
        });
      },

      stopSpinWithDeceleration: async (duration: number = 2000) => {
        // Start deceleration
        const decelerationStartTime = Date.now();
        const initialVelocities = rowStates.current.map(state => state.velocity);

        return new Promise<void>((resolve) => {
          const decelerate = () => {
            const elapsed = Date.now() - decelerationStartTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function for smooth deceleration
            const easeOut = 1 - Math.pow(1 - progress, 3);

            rowStates.current.forEach((state, index) => {
              if (!state.frozen) {
                // Gradually reduce velocity
                state.velocity = initialVelocities[index] * (1 - easeOut);

                // When nearly stopped, just freeze without snapping
                if (progress >= 0.98 || state.velocity < 0.1) {
                  state.frozen = true;
                  state.velocity = 0;
                }
              }
            });

            // Check if all rows are frozen
            const allFrozen = rowStates.current.every(state => state.frozen);

            if (allFrozen || progress >= 1) {
              // Ensure all rows are frozen
              rowStates.current.forEach(state => {
                state.frozen = true;
                state.velocity = 0;
              });

              setIsSpinning(false);
              if (onSpinComplete) onSpinComplete();
              resolve();
            } else {
              requestAnimationFrame(decelerate);
            }
          };

          requestAnimationFrame(decelerate);
        });
      },

      snapToGrid: () => {
        snapPositionsToGrid();
      },

      freeze: () => {
        rowStates.current.forEach((state) => {
          state.frozen = true;
          state.velocity = 0;
        });
        setIsSpinning(false);
      },

      unfreeze: () => {
        rowStates.current.forEach((state) => {
          state.frozen = false;
          state.velocity = 1; // Slow idle drift
        });
      },

      getVisibleCards: (): VisibleCard[] => {
        if (!containerRef.current || items.length === 0) return [];

        const containerWidth = containerRef.current.clientWidth;
        const cardWidth = cardSizeRef.current + gapSize;
        const targetVisibleCards = 5;
        const visibleCards: VisibleCard[] = [];

        // Calculate the left margin (where cards should be centered)
        const totalCardsWidth = targetVisibleCards * cardWidth - gapSize;
        const leftMargin = (containerWidth - totalCardsWidth) / 2;

        // For each row, determine which cards are visible
        rowStates.current.forEach((state, rowIndex) => {
          const position = state.position;

          // We render triple items, so total rendered width is 3x items length
          const totalRenderedCards = items.length * 3;

          // Find which cards are in the visible viewport
          // The visible area starts at leftMargin and extends for totalCardsWidth
          const visibleStartX = leftMargin;
          const visibleEndX = leftMargin + totalCardsWidth;

          const rowCards: VisibleCard[] = [];

          // Check each rendered card position
          for (let i = 0; i < totalRenderedCards; i++) {
            // Calculate this card's position on screen
            const cardX = i * cardWidth - position;
            const cardCenterX = cardX + cardWidth / 2;

            // Is this card's center in the visible area?
            if (cardCenterX >= visibleStartX && cardCenterX <= visibleEndX) {
              // Map back to original item index
              const originalIndex = i % items.length;

              // Calculate which column this card is in (0-4)
              const colIndex = Math.round((cardCenterX - visibleStartX) / cardWidth - 0.5);

              if (colIndex >= 0 && colIndex < targetVisibleCards) {
                const gridPos = getGridPosition(rowIndex, colIndex);

                // Avoid duplicates (since we render triple)
                if (!rowCards.some(c => c.colIndex === colIndex)) {
                  rowCards.push({
                    rowIndex,
                    colIndex,
                    cardIndex: originalIndex,
                    prizeId: items[originalIndex].prizeId,
                    gridPosition: gridPos,
                  });
                }
              }
            }
          }

          // Sort by column and add to results
          rowCards.sort((a, b) => a.colIndex - b.colIndex);
          visibleCards.push(...rowCards);
        });

        // Return visible cards without logging

        return visibleCards;
      },

      highlightCard: (rowIndex: number, colIndex: number) => {
        // Simply highlight by grid position (row, col)
        // This is deterministic - no need to calculate physical indices
        setHighlightedCard({ row: rowIndex, col: colIndex });
      },

      getGridPosition: (row: number, col: number): GridPosition => {
        return getGridPosition(row, col);
      },

      clearHighlight: () => {
        setHighlightedCard(null);
      },

      hideCard: (rowIndex: number, colIndex: number) => {
        setHiddenCard({ row: rowIndex, col: colIndex });
      },

      showCard: (rowIndex: number, colIndex: number) => {
        // Only clear if this specific card is hidden
        setHiddenCard((prev) => {
          if (prev?.row === rowIndex && prev?.col === colIndex) {
            return null;
          }
          return prev;
        });
      },

      resetHiddenCards: () => {
        setHiddenCard(null);
      },
    }));

    // Render a single row
    const renderRow = (rowIndex: number) => {
      const cardWidth = cardSizeRef.current;

      // Calculate row height to match the original calculation
      const containerHeight = containerRef.current?.clientHeight || 600;
      const rowHeight = (containerHeight - (rowCount - 1) * 12) / rowCount;

      // Render 3 copies of items for infinite loop
      const tripleItems = [...items, ...items, ...items];

      return (
        <div
          key={rowIndex}
          className="slider-row"
          style={{
            height: `${rowHeight}px`,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            ref={(el) => {
              if (el) rowRefs.current[rowIndex] = el;
            }}
            className="slider-row-track"
            style={{
              gap: `${gapSize}px`,
            }}
          >
            {tripleItems.map((item, itemIndex) => {
              const actualIndex = itemIndex % items.length;

              // Calculate which column this card is in (if any)
              let isHighlighted = false;
              let isHidden = false;
              if (highlightedCard?.row === rowIndex || hiddenCard?.row === rowIndex) {
                const state = rowStates.current[rowIndex];
                if (state && containerRef.current) {
                  const cardWidth = cardSizeRef.current + gapSize;
                  const containerWidth = containerRef.current.clientWidth;
                  const targetVisibleCards = 5;
                  const totalCardsWidth = targetVisibleCards * cardWidth - gapSize;
                  const leftMargin = (containerWidth - totalCardsWidth) / 2;

                  // Calculate the starting card index
                  const startIndex = Math.round((state.position + leftMargin) / cardWidth);

                  // Check if this itemIndex corresponds to the highlighted column
                  if (highlightedCard?.row === rowIndex) {
                    const colIndex = highlightedCard.col;
                    const expectedCardIndex = startIndex + colIndex;

                    // This physical card is highlighted if it's at the right position
                    if (itemIndex === expectedCardIndex % (items.length * 3)) {
                      isHighlighted = true;
                    }
                  }

                  // Check if this card should be hidden
                  if (hiddenCard?.row === rowIndex) {
                    const colIndex = hiddenCard.col;
                    const expectedCardIndex = startIndex + colIndex;

                    // This physical card is hidden if it's at the right position
                    if (itemIndex === expectedCardIndex % (items.length * 3)) {
                      isHidden = true;
                    }
                  }
                }
              }

              return (
                <div
                  key={`${rowIndex}-${itemIndex}`}
                  className={`slider-card ${isHighlighted ? 'highlighted' : ''} ${isHidden ? 'hidden' : ''}`}
                  style={{
                    width: `${cardWidth}px`,
                    height: `${cardWidth}px`,
                  }}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    draggable={false}
                  />
                </div>
              );
            })}
          </div>
        </div>
      );
    };

    return (
      <div ref={containerRef} className="multi-row-slider">
        {Array.from({ length: rowCount }).map((_, i) => renderRow(i))}
      </div>
    );
  }
);

MultiRowSlider.displayName = 'MultiRowSlider';

export default MultiRowSlider;
