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
}

export interface MultiRowSliderHandle {
  spinToResult(prizeId: string, duration: number): Promise<void>;
  snapToGrid(): void;
  freeze(): void;
  unfreeze(): void;
  getVisibleCards(): VisibleCard[];
  highlightCard(rowIndex: number, colIndex: number): void;
  clearHighlight(): void;
  getGridPosition(row: number, col: number): GridPosition;
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

    // Helper: Get pixel position for a grid cell
    const getGridPosition = (row: number, col: number): GridPosition => {
      if (!containerRef.current) {
        return { row, col, x: 0, y: 0 };
      }

      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      const cardWidth = cardSizeRef.current + gapSize;
      const targetVisibleCards = 5;

      // Calculate grid layout
      const totalCardsWidth = targetVisibleCards * cardWidth - gapSize;
      const leftMargin = (containerWidth - totalCardsWidth) / 2;

      // Calculate row height
      const rowHeight = (containerHeight - (rowCount - 1) * 12) / rowCount;
      const topMargin = (containerHeight - (rowHeight * rowCount + 12 * (rowCount - 1))) / 2;

      // Calculate center position of the card
      const x = leftMargin + col * cardWidth + cardSizeRef.current / 2;
      const y = topMargin + row * (rowHeight + 12) + rowHeight / 2;

      return { row, col, x, y };
    };

    // Snap positions to grid - STRICT 5-card alignment
    const snapPositionsToGrid = () => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.clientWidth;
      const cardWidth = cardSizeRef.current + gapSize;
      const targetVisibleCards = 5;
      const totalWidth = cardWidth * items.length;

      rowStates.current.forEach((state) => {
        // Calculate the left margin needed to center exactly 5 cards
        const totalCardsWidth = targetVisibleCards * cardWidth - gapSize;
        const leftMargin = (containerWidth - totalCardsWidth) / 2;

        // Find which card should be at the leftmost position
        // We want: position + leftMargin = N * cardWidth (where N is integer)
        const currentOffset = state.position + leftMargin;
        const nearestCardBoundary = Math.round(currentOffset / cardWidth);

        // Calculate the exact position needed
        const targetPosition = nearestCardBoundary * cardWidth - leftMargin;

        // Normalize to valid range [0, totalWidth)
        let normalizedPosition = targetPosition % totalWidth;
        if (normalizedPosition < 0) {
          normalizedPosition += totalWidth;
        }

        state.position = normalizedPosition;
      });
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

        rowStates.current.forEach((state, rowIndex) => {
          const position = state.position;

          // Calculate the left margin (where the first card starts)
          const totalCardsWidth = targetVisibleCards * cardWidth - gapSize;
          const leftMargin = (containerWidth - totalCardsWidth) / 2;

          // Calculate which card is at the left margin - MUST be exact after snap
          const startIndex = Math.round((position + leftMargin) / cardWidth);

          // Return exactly 5 centered cards with their grid positions
          for (let colIndex = 0; colIndex < targetVisibleCards; colIndex++) {
            // Calculate the card index in the items array
            let cardIndex = (startIndex + colIndex) % items.length;
            if (cardIndex < 0) {
              cardIndex = items.length + cardIndex;
            }

            // Double-check cardIndex is valid before accessing
            if (cardIndex >= 0 && cardIndex < items.length && items[cardIndex]) {
              visibleCards.push({
                rowIndex,
                colIndex,
                cardIndex,
                prizeId: items[cardIndex].prizeId,
                gridPosition: getGridPosition(rowIndex, colIndex),
              });
            }
          }
        });

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
              if (highlightedCard?.row === rowIndex) {
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
                  const colIndex = highlightedCard.col;
                  const expectedCardIndex = startIndex + colIndex;

                  // This physical card is highlighted if it's at the right position
                  if (itemIndex === expectedCardIndex % (items.length * 3)) {
                    isHighlighted = true;
                  }
                }
              }

              return (
                <div
                  key={`${rowIndex}-${itemIndex}`}
                  className={`slider-card ${isHighlighted ? 'highlighted' : ''}`}
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
