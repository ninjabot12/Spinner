# Claw Machine Rewards Feature

A production-ready mock of an interactive "Claw Machine" RNG rewards system for an audio store. Built with React 18, TypeScript, GSAP, and CSS Modules.

## Quick Start

```tsx
import { ClawMachine } from '@/features/claw';

function MyPage() {
  return <ClawMachine showDevControls={true} />;
}
```

## Features

- **Animated Carousel**: 3× repeating tiles scroll right→left, decelerate smoothly
- **Geometric Alignment**: Server picks prize; front-end aligns carousel so it lands under center line
- **Claw Animation**: Drop → grab → lift with visual feedback
- **Reward Types**: 6 types (loyalty points, discounts, free products, VST vouchers)
- **Mock API**: Weighted RNG, localStorage persistence
- **Accessibility**: Keyboard support (Space/Enter), ARIA live regions, reduced-motion path
- **Speedclaw Mode**: ~60% animation duration for faster testing
- **Responsive**: Mobile-friendly carousel and modal

## File Structure

```
src/features/claw/
├── index.ts                     # Public API
├── types.ts                     # Domain types & enums
├── prizes.fixture.json          # Mock reward catalog (14 items)
├── mockApi.ts                   # Play/claim simulation
├── utils.carousel.ts            # Geometry & alignment logic
├── useClawState.ts             # State machine (useReducer)
├── ClawMachine.tsx             # Main container + GSAP timelines
├── ClawMachineScene.tsx        # Scene layout (frame + carousel + claw)
├── Carousel.tsx                # Infinite scrolling carousel
├── Claw.tsx                    # SVG claw with drop/lift/grab
├── PrizeTile.tsx               # Individual prize card
├── ControlPanel.tsx            # Play button + speedclaw toggle
├── ResultModal.tsx             # Reward reveal + CTA
├── EffectsLayer.tsx            # Confetti animation
├── styles.module.css           # Scoped styles + CSS vars
├── context.md                  # Architecture & design decisions
└── README_claw.md             # This file
```

## State Machine

```
Idle
 ├─ PLAY → Spinning
 │   │
 │   ├─ ATTACH_RESULT (server response arrives)
 │   └─ DECELERATE → Decelerating
 │       │
 │       ├─ GRAB → Grabbing
 │       │   │
 │       │   ├─ REVEAL → Reveal
 │       │   │   │
 │       │   │   └─ CLAIM (user clicks CTA) → Settle
 │       │   │
 │       │   └─ RESET → Idle
 │       │
 │       └─ (animation timeout) → Reveal
 │
 └─ (user closes modal) → RESET → Idle
```

## Animation Timings

All times in milliseconds. **Speedclaw mode**: ×0.6 multiplier.

| Phase       | Normal | Speed |
| ----------- | ------ | ----- |
| Spin Min    | 2000   | 1200  |
| Spin Max    | 3500   | 2100  |
| Decelerate  | 1200   | 720   |
| Drop        | 400    | 240   |
| Grab        | 300    | 180   |
| Lift        | 500    | 300   |
| Reveal      | 300    | 180   |

## Reward Types & CTAs

| Type            | CTA Label      | Action                                              |
| --------------- | -------------- | --------------------------------------------------- |
| loyalty_points  | Add Points     | Increment `localStorage.pointsBalance`              |
| discount_percent| Reveal Code    | Generate code, copy to clipboard, store in coupons |
| discount_fixed  | Reveal Code    | Generate code, copy to clipboard, store in coupons |
| free_product    | Add to Library | Add product slug to `localStorage.library`          |
| free_oneshot    | Add to Library | Add product slug to `localStorage.library`          |
| vst_voucher     | Reveal Code    | Generate code, copy to clipboard, store in coupons |

## Geometry & Alignment Algorithm

### Key Concepts

- **Viewport**: Container width (VIEW_W)
- **Tile width**: Individual carousel item width (ITEM_W)
- **Center line**: Horizontal line at VIEW_W / 2 where claw "grabs"
- **Translation x**: Negative value; increases = carousel moves left (tiles scroll right→left)
- **Index**: Logical position in the infinite repeated list
- **Base items**: The 14 prizes from `prizes.fixture.json`; repeated 3× in the DOM

### Algorithm Flow

1. **Play started**: User clicks Play; immediate `mockApi.play()` call (returns after 400–700ms)
2. **Current index**: Derive from current carousel translation:
   ```
   currentIndex = floor((centerLineX - x) / ITEM_W)
   ```
3. **Target index**: Find earliest future occurrence of prize:
   ```
   targetIndex = pickTargetIndex({
     baseItems: prizes,
     targetId: prizeId,
     fromIndex: currentIndex,
     minLaps: 1.5 // At least 1.5 rotations for satisfying spin
   })
   ```
4. **Target translation**: Calculate x so prize center aligns with center line:
   ```
   centerOffset = targetIndex * ITEM_W + ITEM_W / 2
   targetX = centerOffset - centerLineX
   ```
5. **Decelerate tween**: Smoothly move from current x to targetX with `power3.out` easing
6. **Claw drop**: Once carousel stops, drop claw, close pincers, lift

### Example

```
Carousel state:
  BASE ITEMS: [prize_0, prize_1, ..., prize_13] (14 items)
  DOM: [0–13, 0–13, 0–13] (3 repeats)
  Total DOM indices: 0–41

Current x = -600px
  Current index = 4

Server picks: prize_3
  Find targetIndex >= 4 + 1.5 * 14 = 25
  First match: index 30 (prize_3 in 3rd repeat)

targetX = (30 * 140 + 70) - 200 = 3970

Decelerate carousel from -600 to 3970 (distance: 4570px)
```

## Mock API

### `mockApi.play(): Promise<PlayResult>`

Simulates `POST /api/claw/play`.

- Weighted RNG selects prize from fixture
- Randomized 400–700ms latency
- Returns: `{ playId, prize, serverLatencyMs }`

### `mockApi.claim(playId: string, prize: Prize): Promise<ClaimResult>`

Simulates `POST /api/claw/claim`.

- Applies reward to localStorage based on type
- Generates coupon codes for discounts/vouchers
- Returns: `{ playId, prizeId, success, couponCode?, pointsAdded?, grantedProductSlug? }`

### localStorage Structure

```javascript
// Points balance
localStorage.pointsBalance  // e.g., "500"

// Coupons
localStorage.coupons  // [
//   { code, prizeId, rewardType, value, claimedAt },
//   ...
// ]

// Library grants
localStorage.library  // [
//   { productSlug, prizeId, grantedAt },
//   ...
// ]
```

## Accessibility

- **Keyboard**: Space/Enter = Play, Esc = Close modal
- **ARIA**: Live region announces spin state and result
- **Reduced motion**: Skips all animations, goes straight to reveal
- **Focus**: Restored on modal close
- **Screen readers**: Proper semantic HTML, `aria-label`, `role="dialog"`

## Development & Testing

### Show Dev Controls

```tsx
<ClawMachine showDevControls={true} />
```

Adds a "Skip" button to bypass animation (useful for testing claim flow).

### Speedclaw Mode

Toggle in UI to compress all timings by 60%.

### Clear Mock Data

```javascript
import { clearAllMockData } from '@/features/claw/mockApi';
clearAllMockData();
```

### Inspect State

```javascript
import { getPointsBalance, getCoupons, getLibrary } from '@/features/claw/mockApi';
console.log('Points:', getPointsBalance());
console.log('Coupons:', getCoupons());
console.log('Library:', getLibrary());
```

## Production Swap Checklist

### Replace Mock API

1. **`mockApi.play()`** → `POST /api/claw/play`
   ```typescript
   async function play(): Promise<PlayResult> {
     const res = await fetch('/api/claw/play', { method: 'POST' });
     return res.json();
   }
   ```

2. **`mockApi.claim()`** → `POST /api/claw/claim`
   ```typescript
   async function claim(playId: string, prize: Prize): Promise<ClaimResult> {
     const res = await fetch('/api/claw/claim', {
       method: 'POST',
       body: JSON.stringify({ playId, prizeId: prize.id }),
     });
     return res.json();
   }
   ```

3. **Prize catalog** → `GET /api/prizes` or pass as prop
   ```tsx
   <ClawMachine prizes={remotePrizes} />
   ```

### Replace SVG Assets

1. **Claw**: Replace SVG in `Claw.tsx` with production asset
2. **Frame**: Replace SVG frame in `ClawMachineScene.tsx`
3. **Prize icons**: Replace emojis with image slugs or icon components
4. **Confetti**: Integrate Lottie JSON in `EffectsLayer.tsx`

### Backend Contract

#### POST /api/claw/play

**Request**: `{}`

**Response**:
```json
{
  "playId": "play_1729700000000_abc123",
  "prize": {
    "id": "prize_001",
    "name": "100 Points",
    "icon": "⭐",
    "rarity": "common",
    "rewardType": "loyalty_points",
    "value": 100
  },
  "serverLatencyMs": 523
}
```

#### POST /api/claw/claim

**Request**:
```json
{
  "playId": "play_1729700000000_abc123",
  "prizeId": "prize_001"
}
```

**Response**:
```json
{
  "playId": "play_1729700000000_abc123",
  "prizeId": "prize_001",
  "success": true,
  "couponCode": "DRUM-ABC123",
  "pointsAdded": 100,
  "grantedProductSlug": "drum-kit-808"
}
```

## Edge Cases & Known Limitations

- **Window resize during play**: Geometry not recalculated mid-animation (by design; would break alignment). Documents the assumption in `context.md`.
- **Rapid clicks**: State machine guards prevent multiple simultaneous plays.
- **GSAP targeting**: Carousel and Claw are controlled via imperative refs; see `ClawMachine.tsx` for GSAP selector patterns.
- **Confetti**: Simple CSS animation; can be replaced with Lottie JSON for more polish.
- **Coupons**: Generated locally (mock). Production should receive from backend.

## Performance Notes

- **CSS Modules**: Scoped styles, no global pollution
- **GSAP timeline**: Single master timeline with labels; efficient animation batching
- **Carousel**: 3× repeated items (42 in DOM); consider virtualizing if scalability needed
- **useCallback**: Memoized handlers to prevent re-renders
- **localStorage**: Synchronous; consider indexedDB for production at scale

## Future Enhancements

1. **Pity timer**: Guarantee rare after N plays without epic
2. **Rate limiting**: Daily free plays, cooldown between paid plays
3. **Analytics**: Track play_started, prize_revealed, claim_success with event payload
4. **Animations**: Add SFX (whoosh, grab sound, ding)
5. **Mobile**: Responsive touch support for mobile swipe/tap controls
6. **Server-driven layout**: Prize positions, weights, and rarity tiers from backend
7. **Auth integration**: Tie rewards to user account, check eligibility
8. **Leaderboard**: Show most-won prizes or player stats

## Support

For questions or bugs, open an issue in the repo or contact the team.

---

**Last updated**: 2025-10-23
**Status**: Production-ready mock (ready for backend integration)
