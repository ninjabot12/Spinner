/**
 * Claw Machine Domain Types
 * Audio store reward system supporting loyalty points, discounts, and free products.
 */

/** Rarity tier affecting visual appearance and drop probability */
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

/** Reward type maps to backend endpoints and CTA copy */
export type RewardType =
  | 'loyalty_points'
  | 'discount_percent'
  | 'discount_fixed'
  | 'free_product'
  | 'free_oneshot'
  | 'vst_voucher';

/** Prize item in the carousel and reward catalog */
export interface Prize {
  id: string;
  name: string;
  icon: string; // emoji string for now; will be replaced with SVG slug
  rarity: Rarity;
  weight: number; // 0–1000; used in weighted RNG
  rewardType: RewardType;
  value: number | string; // points, percentage, $, product slug, etc.
  productSlug?: string; // for free_product and free_oneshot
  msrpCents?: number; // indicative USD value × 100
  color?: string; // CSS color hint for rare/epic/legendary
  imageFileName?: string; // WebP file name in /public/prizes/ (e.g., 'drumkit-alpha.webp')
}

/** Result of a play API call (mocked) */
export interface PlayResult {
  playId: string;
  prize: Prize;
  serverLatencyMs: number;
}

/** Result of a claim API call; success flags + reward-specific fields */
export interface ClaimResult {
  playId: string;
  prizeId: string;
  success: boolean;
  couponCode?: string; // for discount_* and vst_voucher
  pointsAdded?: number; // for loyalty_points
  grantedProductSlug?: string; // for free_product and free_oneshot
}

/** Finite state machine for the claw machine playthrough */
export enum MachineState {
  Idle = 'idle',
  Spinning = 'spinning',
  Decelerating = 'decelerating',
  Grabbing = 'grabbing',
  Lifting = 'lifting',
  Reveal = 'reveal',
  Settle = 'settle',
}

/** Animation durations (ms) for normal and speed modes */
export interface AnimationTimings {
  spinMinMs: number; // minimum spin before decel
  spinMaxMs: number; // max spin before auto-stop
  decelMs: number; // deceleration tween duration
  dropMs: number; // claw drop duration
  grabMs: number; // claw close duration
  liftMs: number; // claw lift duration
  revealMs: number; // modal fade-in
}

/** Measured carousel geometry */
export interface Geometry {
  VIEW_W: number; // viewport (container) width in pixels
  ITEM_W: number; // single tile width in pixels
}

/** Internal state shape for useClawState reducer */
export interface ClawMachineInternalState {
  state: MachineState;
  playResult: PlayResult | null;
  claimResult: ClaimResult | null;
  currentX: number; // current carousel translation
  highlightId: string | null; // prize id to highlight during grab
  error: string | null;
}

/** Actions for the reducer */
export type ClawMachineAction =
  | { type: 'PLAY' }
  | { type: 'ATTACH_RESULT'; payload: PlayResult }
  | { type: 'DECELERATE' }
  | { type: 'GRAB' }
  | { type: 'REVEAL' }
  | { type: 'CLAIM'; payload: ClaimResult }
  | { type: 'RESET' }
  | { type: 'SET_CURRENT_X'; payload: number }
  | { type: 'ERROR'; payload: string };
