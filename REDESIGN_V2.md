# 🎰 The Claw Machine V2 - Premium Circular Gallery Redesign

**Status**: ✅ Live at `http://localhost:5173/`

---

## What Changed

### ❌ Removed
- ~~Claw grabbing animation~~ (mechanical complexity, slower UX)
- ~~Keyboard spacebar activation~~ (less discoverable)
- ~~Old CSS-based carousel~~ (flat, non-premium feel)
- ~~Complex state machine~~ (now simplified)

### ✅ Added
- **CircularGallery** - High-fidelity 3D WebGL carousel with curved perspective effect
- **GO! Button** - Clear, prominent call-to-action
- **Auto-Spin Animation** - 3-second spin with smooth deceleration landing on target prize
- **HD Product Mockups** - Integrated with Unsplash for high-quality product images (swap with your CDN)
- **Programmatic Carousel Control** - Via `spinToIndex(index, duration)` method

---

## Visual Architecture

```
┌─────────────────────────────────────────┐
│    CircularGallery (WebGL Canvas)      │
│                                         │
│  [Prize] [Prize] [Prize] [Prize]      │
│                                         │
│  (Curved 3D layout with motion blur)   │
└─────────────────────────────────────────┘
            ↓ (user clicks)
          [GO!] Button
            ↓
    Auto-spin for 3 seconds
            ↓
    Land on winning prize
            ↓
   ResultModal (reward reveal)
```

---

## How It Works Now

### 1. User Interface
- **One button**: "GO!"
- **No keyboard shortcuts** (simplicity)
- **Premium 3D carousel** (visual appeal)

### 2. Flow
```javascript
User clicks GO!
  → Disable button (setIsSpinning = true)
  → Call mockApi.play() (RNG picks prize)
  → Calculate target index in carousel
  → Call galleryRef.spinToIndex(targetIndex, 3000ms)
  → Await animation completion
  → setShowModal(true)
  → Reveal reward
  → User clicks CTA (Reveal Code / Add to Library)
  → mockApi.claim() persists reward
  → Success message
  → Close modal, ready to play again
```

### 3. Spin Animation
- **Duration**: 3000ms (easily adjustable in `ClawMachineV2.tsx` line ~75)
- **Easing**: Ease-out-cubic (smooth deceleration)
- **Precision**: Lands exactly on the target prize

---

## File Structure (V2)

```
src/
├── components/
│   ├── CircularGallery.tsx          # NEW: Premium 3D carousel (WebGL)
│   └── CircularGallery.css
├── features/claw/
│   ├── ClawMachineV2.tsx           # NEW: Simplified container
│   ├── ResultModal.tsx              # ✅ Reused from V1
│   ├── mockApi.ts                   # ✅ Reused from V1
│   ├── prizes.fixture.json          # ✅ Reused from V1
│   ├── styles.module.css            # ✅ Reused from V1
│   └── types.ts                     # ✅ Reused from V1
└── App.tsx                          # Updated: now uses ClawMachineV2
```

**LOC Comparison**:
- Old ClawMachine.tsx: ~380 lines (GSAP timelines, claw animations, carousel alignment math)
- New ClawMachineV2.tsx: ~140 lines (just UI + spin control)
- CircularGallery.tsx: ~650 lines (but imported external library, not built from scratch)

---

## Key Features

### CircularGallery (OGL-based)
- **3D Curved Layout**: Items arranged in a circle with perspective
- **Smooth Scrolling**: Drag/wheel support (disabled during spin)
- **Rounded Borders**: Configurable border-radius via shader
- **Responsive**: Scales to container size
- **High Performance**: WebGL rendering, optimized draw calls

### ClawMachineV2
- **Simple API**: Just `handleGO()` → spin → reveal
- **Programmatic Control**: `spinToIndex(index, duration)` for RNG landing
- **HD Images**: Unsplash placeholder (replace with your product images)
- **Error Handling**: Try/catch around API calls
- **Dev Controls**: Skip button for quick testing (if `showDevControls={true}`)

### Result Modal (Unchanged)
- All reward types work
- localStorage persistence
- Copy-to-clipboard for codes
- Accessible (ARIA labels, focus trap coming soon)

---

## Customization Guide

### Adjust Spin Duration
File: `src/features/claw/ClawMachineV2.tsx`, line ~75

```typescript
const spinDuration = 3000; // Change this (milliseconds)
await galleryRef.current?.spinToIndex(targetIndex, spinDuration);
```

### Replace Product Images
File: `src/features/claw/ClawMachineV2.tsx`, function `getHighDefImageUrl()`

```typescript
function getHighDefImageUrl(prizeId: string, prizeName: string): string {
  const seedMap: Record<string, string> = {
    prize_001: 'YOUR_CDN_URL/drum-kit-808.jpg',
    prize_002: 'YOUR_CDN_URL/snare-pack.jpg',
    // ... etc
  };
  return seedMap[prizeId] || `https://fallback-url.jpg`;
}
```

### Change Carousel Curve
File: `src/features/claw/ClawMachineV2.tsx`, line ~57

```typescript
<CircularGallery
  ref={galleryRef}
  items={carouselItems}
  bend={3}  {/* ← Change this (0 = flat, higher = more curved) */}
  textColor="#ffffff"
  borderRadius={0.05}
  scrollEase={0.02}
  scrollSpeed={2}
/>
```

### Adjust Button Style
Search for `handleGO` button styling in `ClawMachineV2.tsx` - uses inline styles for quick tweaking.

---

## Testing Checklist

- [ ] **Page loads** - CircularGallery renders, no console errors
- [ ] **Click GO!** - Button disables, carousel starts spinning
- [ ] **Spin lands** - Carousel stops exactly on prize
- [ ] **Modal shows** - Result reveals with correct prize details
- [ ] **CTA works** - Claim button calls mockApi.claim(), shows success
- [ ] **Dev skip** - Skip button jumps straight to modal (if enabled)
- [ ] **Touch/drag** - Can manually drag carousel left/right between spins
- [ ] **Responsive** - Works on mobile (carousel might be small, but functional)

---

## Production Swap

### Step 1: Replace Images
Update `getHighDefImageUrl()` to point to your asset CDN.

### Step 2: Swap Mock API (Same as Before)
File: `src/features/claw/mockApi.ts`

```typescript
// Before (mock):
export async function play(): Promise<PlayResult> {
  const latency = 400 + Math.random() * 300;
  await new Promise(r => setTimeout(r, latency));
  const prize = selectPrizeByWeight();
  return { playId, prize, serverLatencyMs: Math.round(latency) };
}

// After (production):
export async function play(): Promise<PlayResult> {
  const res = await fetch('/api/claw/play', { method: 'POST' });
  if (!res.ok) throw new Error('API error');
  return res.json();
}
```

### Step 3: Update Prize Catalog
Instead of hardcoded `prizes.fixture.json`:

```typescript
// src/features/claw/ClawMachineV2.tsx
const { data: carouselItems } = useFetch('/api/prizes'); // Fetch from backend
```

---

## Known Limitations & TODOs

- **Touch drag disabled during spin**: Intentional (avoid race conditions)
- **Mobile carousel width**: Might feel cramped on phones; consider reducing item count or scaling
- **Image loading**: Uses CORS-enabled URLs; ensure your CDN allows CORS
- **Accessibility**: CircularGallery is WebGL-based (not semantic HTML); consider screen reader alt text in modal
- **Performance**: WebGL on very old devices might stutter; add fallback to simple list view

---

## Browser Support

- ✅ Chrome/Edge 60+
- ✅ Firefox 55+
- ✅ Safari 12.1+
- ✅ Mobile browsers (iOS 12+, Android 5+)
- ❌ IE11 (WebGL not supported)

---

## Architecture Decisions

| Decision                    | Rationale                                                                       |
| --------------------------- | ------------------------------------------------------------------------------- |
| OGL (not Three.js/Babylon)  | Lightweight, fast, minimal bundle size (~15KB gzipped)                        |
| `spinToIndex()` method      | Programmatic control; server picks prize, front-end spins to it               |
| Unsplash/placeholder images | Quick mockup; production should use product images from your CDN              |
| 3-second spin duration      | Sweet spot for "feels random" but not too long                                |
| GO! button only             | Simpler UX, more accessible than keyboard shortcuts                           |
| Inline styles in component  | Easier to tweak for demo; use Tailwind/CSS modules if making production build |

---

## What Happens When User Clicks GO!

```
Timeline:
0ms     User clicks GO!
        ↓
        Button disables (visual feedback)
        mockApi.play() called asynchronously
100ms   ← Server returns prize (mocked)
        Gallery's spinToIndex() is called
        Carousel begins smooth animation

300ms   Carousel is mid-spin (spinning is visible)

3000ms  Carousel animation completes
        Gallery snaps to final position (target prize centered)
        ↓
        setShowModal(true)
        ↓
        ResultModal fades in

3300ms  User sees their prize!
        ↓
        User clicks CTA button (Reveal Code / Add to Library)
        ↓
        mockApi.claim() is called
        ↓
        Success message appears
        ↓
        User can close modal or continue shopping
        ↓
        Button re-enabled, ready for next play
```

---

## Next Steps (For You)

1. **Test the live demo**: Open `http://localhost:5173/` and click GO!
2. **Replace images**: Update `getHighDefImageUrl()` with your product images
3. **Adjust spin duration**: Make it shorter for faster testing, longer for more dramatic effect
4. **Connect to real API**: Swap `mockApi.ts` with real endpoints
5. **Mobile testing**: Test on phone to see if carousel size is acceptable
6. **Analytics**: Add tracking to `handleGO()` and `handleClaim()` for metrics

---

**Version**: 2.0 (CircularGallery redesign)
**Status**: Ready for demo & customization
**Last Updated**: 2025-10-23
