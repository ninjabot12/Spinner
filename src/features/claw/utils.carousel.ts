/**
 * Carousel Geometry & Selection Utilities
 * Computes tile positions, translations, and target indices for prize alignment.
 *
 * KEY CONCEPT:
 * - Tiles render 3× for "infinite" effect.
 * - `x` is a negative translation (moves carousel left, i.e., tiles scroll right→left visually).
 * - Center line is at VIEW_W / 2.
 * - Target: ensure prize center aligns with center line when carousel stops.
 */

import { Geometry } from './types';

/**
 * Measure container and tile dimensions from DOM elements.
 * Call once at mount and cache; recompute on window resize.
 */
export function measure(containerEl: HTMLElement, tileEl: HTMLElement): Geometry {
  const VIEW_W = containerEl.getBoundingClientRect().width;
  const ITEM_W = tileEl.getBoundingClientRect().width;
  return { VIEW_W, ITEM_W };
}

/**
 * Center line position in viewport space (where the claw "grabs").
 * By default, middle of the visible carousel area.
 */
export function centerLineX(VIEW_W: number): number {
  return VIEW_W / 2;
}

/**
 * Compute the center position of a tile at index `index` in strip space.
 * Strip space is the full infinite scrolling line (tiles laid end-to-end).
 * Formula: index * ITEM_W + ITEM_W / 2
 */
export function indexToCenterOffset(index: number, ITEM_W: number): number {
  return index * ITEM_W + ITEM_W / 2;
}

/**
 * Compute the translation `x` (negative) such that tile at `index` centers on the center line.
 *
 * Relationship:
 *   tile_center_in_viewport = centerOffset - x
 *   We want: tile_center_in_viewport = centerLineX
 *   So: x = centerOffset - centerLineX
 *
 * Example:
 *   - centerOffset = 150 (tile 0's center in strip space)
 *   - VIEW_W = 400, centerLineX = 200
 *   - x = 150 - 200 = -50 (tile is shifted right in viewport, edge peeking in)
 *   - x = 100 - 200 = -100 (tile center moves further right)
 */
export function translateForIndex(
  index: number,
  VIEW_W: number,
  ITEM_W: number,
): number {
  const centerOffset = indexToCenterOffset(index, ITEM_W);
  const centerLine = centerLineX(VIEW_W);
  return centerOffset - centerLine;
}

/**
 * Derive logical tile index from current translation `x`.
 * Used to determine which tile is "currently leading" during spin.
 *
 * Inverse: index = floor((centerOffset - x) / ITEM_W)
 * where centerOffset = tile center position in strip space.
 */
export function getIndexFromX(x: number, VIEW_W: number, ITEM_W: number): number {
  const centerLine = centerLineX(VIEW_W);
  const tileCenter = centerLine - x; // tile center position in strip space
  return Math.floor(tileCenter / ITEM_W);
}

/**
 * Pick the target index in a repeated (infinite) list of tiles.
 *
 * @param baseItems - original prize list (before repeating)
 * @param targetId - prize.id to find
 * @param fromIndex - current leading tile index
 * @param minLaps - minimum number of full cycles before landing on target (e.g., 1.5)
 *
 * @returns index in the repeated list such that:
 *   1. The prize id matches targetId
 *   2. index is at least `fromIndex + minLaps * baseItems.length` (ensures a satisfying spin)
 *   3. It is the earliest such index
 *
 * Example:
 *   - baseItems.length = 10
 *   - fromIndex = 2, minLaps = 1.5
 *   - Must find an index >= 2 + 15 = 17 where prize id matches
 *   - Tiles are repeated: [0..9, 0..9, 0..9, ...], so index 17 is the 8th item of the 2nd repeat
 */
export function pickTargetIndex(params: {
  baseItems: { id: string }[];
  targetId: string;
  fromIndex: number;
  minLaps: number;
}): number {
  const { baseItems, targetId, fromIndex, minLaps } = params;
  const baseLen = baseItems.length;
  const minDistance = Math.ceil(minLaps * baseLen);
  const minIndex = fromIndex + minDistance;

  // Search through repeated list to find target
  let candidateIndex = minIndex;
  for (let i = 0; i < baseLen * 3; i++) {
    const baseIndex = candidateIndex % baseLen;
    if (baseItems[baseIndex].id === targetId) {
      return candidateIndex;
    }
    candidateIndex++;
  }

  // Fallback: return the next occurrence of target after minIndex
  // (should not happen if targetId exists in baseItems)
  const targetBaseIndex = baseItems.findIndex((p) => p.id === targetId);
  if (targetBaseIndex >= 0) {
    const cyclesNeeded = Math.ceil((minIndex - targetBaseIndex) / baseLen);
    return targetBaseIndex + cyclesNeeded * baseLen;
  }

  // Last resort: return minIndex itself (safety)
  return minIndex;
}

/**
 * Compute the distance (in pixels) the carousel must decelerate.
 * Used to estimate deceleration duration dynamically.
 *
 * @param currentX - current translation
 * @param targetX - target translation
 * @returns absolute pixel distance
 */
export function decelerationDistance(currentX: number, targetX: number): number {
  return Math.abs(targetX - currentX);
}

/**
 * Estimate deceleration duration based on remaining distance and speed mode.
 * Longer distances take proportionally longer, but cap at maxDecelMs.
 *
 * @param distance - pixels to decelerate over
 * @param baseDecelMs - base deceleration duration (normal mode)
 * @param maxDecelMs - absolute maximum
 * @returns duration in milliseconds
 */
export function estimateDecelMs(
  distance: number,
  baseDecelMs: number,
  maxDecelMs: number = baseDecelMs * 1.5,
): number {
  // Heuristic: ~200px per second deceleration
  const pixelsPerMs = 200 / 1000;
  const estimated = distance / pixelsPerMs;
  return Math.min(estimated, maxDecelMs);
}
