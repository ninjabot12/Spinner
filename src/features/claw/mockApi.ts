/**
 * Mock API Simulation
 * Implements play() and claim() with weighted RNG and localStorage persistence.
 *
 * PRODUCTION SWAP:
 * - play() → POST /api/claw/play
 * - claim() → POST /api/claw/claim
 */

import prizes from './prizes.fixture.json';
import { PlayResult, ClaimResult, Prize } from './types';

/**
 * Weighted random selection from prize list.
 * Each prize has a `weight` (0–1000); sum of all weights determines the pool.
 */
function selectPrizeByWeight(): Prize {
  const totalWeight = prizes.reduce((sum, p) => sum + (p.weight || 0), 0);
  let random = Math.random() * totalWeight;

  for (const prize of prizes) {
    random -= prize.weight || 0;
    if (random <= 0) return prize;
  }

  return prizes[0]; // fallback
}

/**
 * Generate a mock coupon code (e.g., "DRUM-ABC123").
 * In production, this would come from the backend.
 */
function generateCouponCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const part = Array.from({ length: 6 })
    .map(() => chars[Math.floor(Math.random() * chars.length)])
    .join('');
  return `DRUM-${part}`;
}

/**
 * Generate a unique play session ID.
 * In production, this would be assigned by the backend.
 */
function generatePlayId(): string {
  return `play_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Simulate the play API call.
 * Returns after 400–700ms (network latency).
 *
 * In production:
 *   POST /api/claw/play → { playId, prize, timestamp }
 */
export async function play(): Promise<PlayResult> {
  const latency = 400 + Math.random() * 300;
  await new Promise((resolve) => setTimeout(resolve, latency));

  const prize = selectPrizeByWeight();
  const playId = generatePlayId();

  return {
    playId,
    prize,
    serverLatencyMs: Math.round(latency),
  };
}

/**
 * Claim a prize after the claw grab.
 * Applies the reward to localStorage and returns success.
 *
 * In production:
 *   POST /api/claw/claim → {
 *     playId, prizeId, success,
 *     couponCode?, pointsAdded?, grantedProductSlug?
 *   }
 */
export async function claim(playId: string, prize: Prize): Promise<ClaimResult> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200));

  const result: ClaimResult = {
    playId,
    prizeId: prize.id,
    success: true,
  };

  try {
    switch (prize.rewardType) {
      case 'loyalty_points': {
        const current = parseInt(localStorage.getItem('pointsBalance') || '0', 10);
        const pointsValue = typeof prize.value === 'number' ? prize.value : 0;
        localStorage.setItem('pointsBalance', String(current + pointsValue));
        result.pointsAdded = pointsValue;
        break;
      }

      case 'discount_percent':
      case 'discount_fixed':
      case 'vst_voucher': {
        const code = generateCouponCode();
        const coupons = JSON.parse(localStorage.getItem('coupons') || '[]');
        coupons.push({
          code,
          prizeId: prize.id,
          rewardType: prize.rewardType,
          value: prize.value,
          claimedAt: new Date().toISOString(),
        });
        localStorage.setItem('coupons', JSON.stringify(coupons));
        result.couponCode = code;
        break;
      }

      case 'free_product':
      case 'free_oneshot': {
        if (prize.productSlug) {
          const library = JSON.parse(localStorage.getItem('library') || '[]');
          library.push({
            productSlug: prize.productSlug,
            prizeId: prize.id,
            grantedAt: new Date().toISOString(),
          });
          localStorage.setItem('library', JSON.stringify(library));
          result.grantedProductSlug = prize.productSlug;
        }
        break;
      }
    }
  } catch (err) {
    console.error('Error claiming prize:', err);
    result.success = false;
  }

  return result;
}

/**
 * Utility to fetch the current points balance from localStorage.
 */
export function getPointsBalance(): number {
  return parseInt(localStorage.getItem('pointsBalance') || '0', 10);
}

/**
 * Utility to fetch stored coupons from localStorage.
 */
export function getCoupons(): Array<{
  code: string;
  prizeId: string;
  rewardType: string;
  value: number | string;
  claimedAt: string;
}> {
  return JSON.parse(localStorage.getItem('coupons') || '[]');
}

/**
 * Utility to fetch granted products from localStorage.
 */
export function getLibrary(): Array<{
  productSlug: string;
  prizeId: string;
  grantedAt: string;
}> {
  return JSON.parse(localStorage.getItem('library') || '[]');
}

/**
 * Clear all mock data from localStorage (for dev/testing).
 */
export function clearAllMockData(): void {
  localStorage.removeItem('pointsBalance');
  localStorage.removeItem('coupons');
  localStorage.removeItem('library');
}
