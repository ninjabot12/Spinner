# Claw Machine Feature: Design Context & Architecture

**Purpose**: Interactive RNG reward system ("Claw Machine") for audio store (drum kits, samples, VST). Players spin a carousel, server picks a prize, front-end aligns carousel so the prize lands under a center line, claw drops and grabs, modal reveals reward.

**Audience**: Future maintainers, backend engineers, designers swapping SVGs/animations, mobile team adding touch support.

---

## Stack Rationale

| Choice             | Rationale                                                                                      |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| **React 18**       | Existing app stack; hooks/useReducer for state; ref API for imperative GSAP control           |
| **TypeScript**     | Strict mode enforces contracts; RewardType union catches invalid reward flow                   |
| **GSAP**           | Timeline-based animation; precise control over carousel translation; power3.out easing         |
| **CSS Modules**    | Scoped styles, no Tailwind (simpler build); CSS variables for rarity colors, z-index layers  |
| **useReducer**     | Finite state machine; guards prevent illegal transitions (e.g., GRAB before DECELERATE)       |
| **localStorage**   | Mock persistence; production swaps to API + user account database                             |

---

## State Machine Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        IDLE (init)                          │
│                  canPlay=true, isBusy=false                 │
└────────────────────────────┬────────────────────────────────┘
                             │ PLAY action
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      SPINNING                               │
│           Fast carousel scroll (constant speed)             │
│         mockApi.play() called (400–700ms latency)          │
│           canPlay=false, isBusy=true                        │
└────────────────────────────┬────────────────────────────────┘
                             │ ATTACH_RESULT (server responds)
                             │ DECELERATE action
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    DECELERATING                             │
│         Carousel slows to stop (power3.out ease)           │
│        Prize center aligns with center line                │
│           canPlay=false, isBusy=true                        │
└────────────────────────────┬────────────────────────────────┘
                             │ GRAB action
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      GRABBING                               │
│            Claw: drop → close pincers → lift                │
│           canPlay=false, isBusy=true                        │
└────────────────────────────┬────────────────────────────────┘
                             │ REVEAL action
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      REVEAL                                 │
│           Modal opens, prize displayed                      │
│           User reads reward and clicks CTA                  │
│           canPlay=false, isBusy=true                        │
└────────────────────────────┬────────────────────────────────┘
                             │ CLAIM action
                             │ mockApi.claim() called
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      SETTLE                                 │
│           Reward applied (points/code/product)              │
│       User can close modal or continue shopping            │
│           canPlay=false, isBusy=false                       │
└────────────────────────────┬────────────────────────────────┘
                             │ RESET action (close modal)
                             ▼ (back to IDLE)
```

### Transition Guards

- **PLAY**: only from `Idle`
- **ATTACH_RESULT**: only during `Spinning`
- **DECELERATE**: from `Spinning` or `Decelerating`
- **GRAB**: only from `Decelerating`
- **REVEAL**: from `Grabbing` or `Lifting`
- **CLAIM**: only from `Reveal`
- **RESET**: from any state

Invalid transitions are silently ignored (reducer returns state unchanged).

---

## Animation Timings & GSAP Pipeline

All durations in **milliseconds**. Speed mode scales by 0.6×.

```javascript
// Normal mode
const TIMINGS = {
  spinMinMs: 2000,      // 2 seconds minimum spin
  spinMaxMs: 3500,      // up to 3.5 seconds
  decelMs: 1200,        // 1.2 second deceleration
  dropMs: 400,          // claw drop (0.4s)
  grabMs: 300,          // claw pincer close (0.3s)
  liftMs: 500,          // claw lift (0.5s)
  revealMs: 300,        // modal fade-in (0.3s)
};
```

### Master Timeline Structure

```
gsap.timeline()
  ├─ (0.0s) 'spin:start': carousel at constant speed
  ├─ (2.0–3.5s) 'spin:decel': mark position after spin
  ├─ (1.2s duration) decelerate tween: x → targetX (power3.out)
  ├─ (+0.1s) 'claw:drop': claw.drop() called
  ├─ (+0.4s) pincer closes (clawRef.current.setOpen(false))
  ├─ (+0.3s) 'claw:lift': claw.lift() called
  ├─ (+0.5s) 'reveal': clawState.reveal() dispatches
  └─ (+0.3s) modal fade-in
```

**Total sequence**: ~5.5–7.0 seconds (normal mode).

### Reduced Motion Path

If `prefers-reduced-motion: reduce`, skip all timelines:

1. PLAY → immediate `mockApi.play()` call
2. Result arrives → dispatch DECELERATE, GRAB, REVEAL in sequence (no animation)
3. Modal appears instantly
4. User clicks CTA → CLAIM, SETTLE

---

## Selection & Alignment Algorithm

### Problem

Server picks a prize (e.g., "prize_003"). Front-end must:
1. Keep the carousel spinning for a satisfying duration (1.5+ rotations)
2. Calculate the exact translation `x` so the chosen prize's center lands on the center line
3. Decelerate smoothly to that position
4. Drop the claw

### Key Geometry

```
Carousel strip:
  VIEW_W = 400px (viewport width)
  ITEM_W = 140px (tile width)
  CENTER_LINE = VIEW_W / 2 = 200px

Tiles rendered 3× for infinite effect:
  DOM: [prize_0, ..., prize_13, prize_0, ..., prize_13, prize_0, ..., prize_13]
  Total 42 items (indices 0–41)

Translation space (x):
  x = 0    → carousel at rest, first item at viewport left
  x < 0    → carousel moved right (tiles scroll left)
  x > 0    → carousel moved left (tiles scroll right)
```

### Utility Functions in `utils.carousel.ts`

#### `measure(containerEl, tileEl): Geometry`

Measure viewport and tile widths from DOM. Called once at mount; recalculate on window resize.

```typescript
const geo = measure(containerRef.current, firstTileRef.current);
// { VIEW_W: 400, ITEM_W: 140 }
```

#### `indexToCenterOffset(index, ITEM_W): number`

Convert logical tile index to its center position in strip space.

```typescript
indexToCenterOffset(5, 140) = 5 * 140 + 70 = 770px
// Tile 5's center is at 770px in the infinite strip
```

#### `centerLineX(VIEW_W): number`

The horizontal pixel position where the claw grabs (usually `VIEW_W / 2`).

```typescript
centerLineX(400) = 200px
```

#### `translateForIndex(index, VIEW_W, ITEM_W): number`

Compute the carousel translation `x` such that tile at `index` centers on the center line.

```
Constraint: tile_center_in_viewport = centerLineX
  → (indexToCenterOffset - x) = centerLineX
  → x = indexToCenterOffset - centerLineX

Example:
  indexToCenterOffset(8) = 1190px
  centerLineX = 200px
  x = 1190 - 200 = 990px

  (To move tile 8's center to x=200, carousel must be translated by +990px)
```

#### `getIndexFromX(x, VIEW_W, ITEM_W): number`

Inverse: derive current tile index from translation `x`. Used to know which tile is "leading" at any moment.

```typescript
const currentIndex = getIndexFromX(-600, 400, 140);
// Tile at viewport center is index 4
```

#### `pickTargetIndex({ baseItems, targetId, fromIndex, minLaps }): number`

Find the earliest future occurrence of `targetId` in the repeated list, at least `minLaps` full cycles ahead.

```typescript
const prizes = [p0, p1, ..., p13]; // 14 items
const result = pickTargetIndex({
  baseItems: prizes,
  targetId: 'prize_003',
  fromIndex: 4,
  minLaps: 1.5,
});
// result = 25 (first occurrence of prize_003 that's >= 4 + 21 = 25)
// 25 % 14 = 11, so it's prize_11 position, but wrapped 2× (indices 11, 25, 39)
```

### Algorithm in `ClawMachine.tsx`

```javascript
// 1. User clicks Play
handlePlay()
  → clawState.play() [SPINNING]
  → await mockApi.play() [returns { playId, prize, ... }]
  → clawState.attachResult(result)
  → playAnimationSequence(prize.id)

// 2. Calculate target position
const currentX = carouselRef.current.getX();
const fromIndex = getIndexFromX(currentX, VIEW_W, ITEM_W);
const targetIndex = pickTargetIndex({
  baseItems: prizes,
  targetId: prize.id,
  fromIndex,
  minLaps: 1.5,
});
const targetX = translateForIndex(targetIndex, VIEW_W, ITEM_W);

// 3. Build GSAP timeline
const tl = gsap.timeline();
tl.to(carousel, { ... }) // SPIN for 2–3.5s
tl.add('spin:decel');
tl.to(carousel, { x: targetX, duration: 1.2s, ease: 'power3.out' })
tl.add('claw:drop');
tl.call(() => clawRef.drop());
// ... etc (grab, lift, reveal)

// 4. When deceleration completes, prize center is at centerLineX
// Claw drops and grabs it
```

### Example Walkthrough

```
Initial state:
  Carousel x = -200px
  Current index = floor((200 - (-200)) / 140) = floor(2.857) = 2
  Tile 2 is centered on the center line

Server picks: prize_003
  Find targetIndex >= 2 + 1.5 * 14 = 23
  pickTargetIndex returns: 24 (prize_003 in 2nd repeat)

Calculate targetX:
  centerOffset(24) = 24 * 140 + 70 = 3430px
  centerLineX = 200px
  targetX = 3430 - 200 = 3230px

Decelerate carousel from x=-200 to x=3230 (distance: 3430px)
  duration: 1.2s with power3.out

When tween completes:
  carousel x = 3230px
  tile 24's center = 3430 - 3230 = 200px (exactly on center line!)
  Claw drops → grabs prize_003 ✓
```

---

## Reward Type → Backend Mapping

Each reward type flows to a different backend endpoint/logic:

| RewardType      | Backend Endpoint       | Payload                     | Response                  |
| --------------- | ---------------------- | --------------------------- | ------------------------- |
| loyalty_points  | POST /loyalty/add      | { playId, points }          | { success, newBalance }   |
| discount_percent| POST /promo/issue      | { playId, percentage }      | { code, expiresAt }       |
| discount_fixed  | POST /promo/issue      | { playId, amountCents }     | { code, expiresAt }       |
| free_product    | POST /library/grant    | { playId, productSlug }     | { success, grantedAt }    |
| free_oneshot    | POST /library/grant    | { playId, sampleSlug }      | { success, grantedAt }    |
| vst_voucher     | POST /voucher/issue    | { playId, versionTier }     | { code, licenseKey }      |

**Current mock** (in `mockApi.ts`):
- `loyalty_points`: increments `localStorage.pointsBalance`
- `discount_*` / `vst_voucher`: generates `DRUM-XXXXX` code, stores in `localStorage.coupons`
- `free_product` / `free_oneshot`: appends to `localStorage.library`

**Production swap**: Replace `claim()` function to POST to real endpoints.

---

## Data Contracts

### Prize Fixture (14 items)

```typescript
interface Prize {
  id: string;                  // e.g., "prize_001"
  name: string;                // e.g., "100 Points"
  icon: string;                // emoji string (→ replace with SVG slug)
  rarity: 'common'|'rare'|'epic'|'legendary';
  weight: number;              // 0–1000 (RNG probability)
  rewardType: RewardType;      // one of 6 types
  value: number | string;      // e.g., 100 (points), 10 (%), "drum-kit-808" (slug)
  productSlug?: string;        // for free_product/free_oneshot
  msrpCents?: number;          // e.g., 2999 ($29.99)
  color?: string;              // e.g., "#FFD700" (for glow effect)
}
```

**Served from**: `prizes.fixture.json` (mock) → production: `GET /api/prizes` endpoint.

### API Responses

#### POST /claw/play

```json
{
  "playId": "play_1729700000000_abc123",
  "prize": { /* Prize object */ },
  "serverLatencyMs": 523
}
```

#### POST /claw/claim

```json
{
  "playId": "play_1729700000000_abc123",
  "prizeId": "prize_001",
  "success": true,
  "couponCode": "DRUM-ABC123",     // optional, for discount/voucher
  "pointsAdded": 100,              // optional, for loyalty_points
  "grantedProductSlug": "drum-kit-808"  // optional, for free_*
}
```

---

## Visual Assets Checklist

For production, replace these placeholders:

### Machine Frame
- [ ] Top rail (claw track) SVG
- [ ] Side panels/decals
- [ ] Bottom platform
- [ ] Lighting effects

### Claw
- [ ] 3D claw arm model (SVG or canvas)
- [ ] Pincer animation curves
- [ ] Shadow/reflection during drop

### Prize Icons
- [ ] Replace emoji with icon component or image slug
- [ ] Rarity-specific glow effects (CSS filters)
- [ ] Hover/highlight animations

### Carousel Animations
- [ ] Lottie JSON for confetti effect (EffectsLayer.tsx)
- [ ] Tile flip/rotation on highlight
- [ ] Carousel speed particles/motion blur

### Audio
- [ ] Whoosh sound on spin start
- [ ] Grab/pinch sound on claw close
- [ ] Win chime on reveal
- [ ] Background music loop (optional)

---

## Compliance & Analytics

### Legal

- [ ] Odds disclosure: Display RNG weights prominently (e.g., "Prize odds: 25% common, 15% rare...")
- [ ] Terms link in modal footer
- [ ] Age gate (if applicable)
- [ ] Responsible gambling reminder (daily limit notice)

### Rate Limiting

- [ ] Daily free play quota (e.g., 1 free / day)
- [ ] Cooldown between paid plays (e.g., 5 min)
- [ ] Server validation (don't trust client)

### Analytics Events

Log these to your analytics backend:

```javascript
// On play start
analytics.track('play_started', {
  timestamp,
  userId,
  isSpeedclaw,
});

// On prize reveal
analytics.track('prize_revealed', {
  timestamp,
  playId,
  prizeId,
  rewardType,
  rarity,
  serverLatencyMs,
});

// On claim success
analytics.track('claim_success', {
  timestamp,
  playId,
  prizeId,
  rewardType,
  value,
  productSlug,  // if applicable
});
```

---

## Open Questions & TODOs

- **Auth source**: How is the user authenticated? (JWT, session, OAuth?)
- **Quota enforcement**: Is daily play limit checked client-side or server-side?
- **Duplicates policy**: Can user win the same product twice? Track in library by unique key?
- **Pity timer**: After N spins without epic/legendary, increase weight of rarer tiers?
- **Mobile touch**: Should mobile users swipe/tap to play instead of button? Full screen mode?
- **Resize during play**: Documented as unsupported. Acceptable, or should we pause/resume?
- **Accessibility audit**: Test with screen reader + keyboard-only on real device
- **Fallback font**: What if emoji don't render? Add text fallback in Carousel?
- **Performance budget**: Is 42 carousel items + animations within performance targets?

---

## Integration Checklist for Backend Team

- [ ] Design `/api/claw/play` endpoint (weighted RNG, session management)
- [ ] Design `/api/claw/claim` endpoint (idempotent, prevent double claims)
- [ ] Design `/api/prizes` endpoint (list rewards, weights, rarity tiers)
- [ ] Implement fraud detection (rapid-fire plays, cheating clients)
- [ ] Database schema: PlaySession, RewardClaim, UserInventory
- [ ] Rate limiting middleware (Redis-backed)
- [ ] Webhook for analytics integration
- [ ] Admin panel to adjust prize weights, disable rewards, view metrics

---

## Git Commit Strategy

- **Initial mock**: "feat(claw): add initial mock of claw machine rewards feature"
- **GSAP integration**: "feat(claw): implement carousel alignment and deceleration animation"
- **State machine**: "feat(claw): add finite state machine with useReducer"
- **UI polish**: "feat(claw): add result modal and accessibility features"
- **Backend swap**: "refactor(claw): replace mock API with production endpoints"

---

## Performance & Optimization Notes

- **Carousel rendering**: 3× tiles = 42 DOM nodes. Acceptable for ~140px tiles. If scaling to 100+ prizes, consider virtualization.
- **GSAP memory**: Timeline is killed/recreated per play. Watch for memory leaks if play count is very high.
- **CSS Modules**: No runtime CSS-in-JS overhead; fully static.
- **localStorage**: Synchronous; blocks event loop. For production scale, migrate to IndexedDB or server-side state.
- **Confetti animation**: ~30 particles × 2s duration. Acceptable. Consider reducing on low-end devices via `devicePixelRatio`.

---

**Version**: 1.0 (production-ready mock)
**Last Updated**: 2025-10-23
**Maintained By**: Front-end team
