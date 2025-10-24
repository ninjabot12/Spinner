# 🎮 Quick Start - The Claw Machine V2

## Live Demo
**👉 Open in browser: http://localhost:5173/**

---

## What to Expect

You'll see:
1. **Beautiful 3D curved carousel** with prize cards (WebGL-powered)
2. **Big GO! button** below the carousel
3. **Click GO!** → The carousel spins for ~3 seconds
4. **Lands on a random prize** → Modal pops up showing what you won
5. **Choose action** → "Reveal Code", "Add to Library", or "Add Points"
6. **Success!** → Click "Done" and play again

---

## Try These Actions

### 1. Spin to See Different Prizes
Click GO! multiple times. Each time you'll get a different reward (weighted RNG).

### 2. Check What You Won
After the modal appears, look at:
- Prize name (top)
- Reward type (loyalty points, discount %, free product, VST voucher)
- Value (e.g., "100 Points", "10% Off", "Unlocked")

### 3. Claim Your Reward
Click the action button:
- **"Add Points"** → Points added to your account (check DevTools Console)
- **"Reveal Code"** → Discount code copied to clipboard (Ctrl+V to paste)
- **"Add to Library"** → Product granted to library

### 4. Skip Button (Dev Testing)
If you see a "Skip (Dev)" button:
- Skips the 3-second spin animation
- Jumps straight to the reward modal
- Great for testing the claim flow fast

### 5. Open Developer Tools
```javascript
// In browser console (F12):

// Check points balance
localStorage.getItem('pointsBalance')

// Check claimed coupons
localStorage.getItem('coupons')

// Check granted products
localStorage.getItem('library')

// Clear all mock data (start fresh)
// Note: Run this in console - paste: localStorage.clear();
```

---

## Customization (5 minutes)

### Change Spin Speed
File: `src/features/claw/ClawMachineV2.tsx`

Find line ~75:
```typescript
const spinDuration = 3000; // ← Change to 1000 (1 sec) or 5000 (5 sec)
```

### Change Button Color
File: `src/features/claw/ClawMachineV2.tsx`

Find the GO! button (around line ~120):
```typescript
background: isSpinning
  ? 'linear-gradient(135deg, #999 0%, #666 100%)'
  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // ← Change these colors
```

Try:
- `#FF6347 0%, #FF1493 100%` (red-pink)
- `#00CED1 0%, #20B2AA 100%` (teal-cyan)
- `#FFD700 0%, #FFA500 100%` (gold-orange)

### Replace Prize Images
File: `src/features/claw/ClawMachineV2.tsx`

Find `getHighDefImageUrl()` function (around line ~45):
```typescript
const seedMap: Record<string, string> = {
  prize_001: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=600&fit=crop',
  // ↑ Replace this URL with your image URL
  prize_002: 'https://YOUR_IMAGE_URL.jpg',
  // ... and so on
};
```

Best image sizes: **800×600px** or larger (for quality on all devices)

### Change Carousel Curve
File: `src/features/claw/ClawMachineV2.tsx`

Find `<CircularGallery` (around line ~57):
```typescript
<CircularGallery
  ref={galleryRef}
  items={carouselItems}
  bend={3}  {/* ← Change this number */}
  // ...
/>
```

Try different values:
- `bend={0}` → Flat carousel (no 3D)
- `bend={2}` → Subtle curve
- `bend={3}` → Default (nice curve)
- `bend={5}` → Very curved (dramatic)

---

## Troubleshooting

### Carousel Not Spinning?
- Check browser console for errors (F12)
- Refresh page (Ctrl+R)
- Make sure `spinToIndex()` is being called

### Images Not Loading?
- Check if URLs are CORS-enabled (must be public, not behind auth)
- Try using Unsplash URLs directly (they work everywhere)
- Check network tab in DevTools

### Button Disabled After Click?
- That's normal! It's disabled during the 3-second spin
- Wait for animation to finish, button will re-enable

### Modal Not Appearing?
- Check browser console for JavaScript errors
- Make sure `mockApi.play()` returns a valid prize
- Verify `playResult` state is being set

---

## File Changes Made

**V1 → V2 Migration**:
- ✅ Kept: `ResultModal.tsx`, `mockApi.ts`, `prizes.fixture.json`, `styles.module.css`
- ✨ New: `CircularGallery.tsx`, `ClawMachineV2.tsx`
- 🗑️ Old: `ClawMachine.tsx`, `Carousel.tsx`, `Claw.tsx`, `ControlPanel.tsx` (not deleted, just unused)

---

## What's Next?

1. **Play with the demo** → Click GO! a few times, see different prizes
2. **Change colors/speed** → See how customization works
3. **Replace images** → Swap in your actual product photos
4. **Connect to real API** → Replace `mockApi.play()` with your backend endpoint
5. **Deploy to production** → Run `npm run build`, deploy `dist/` folder

---

## Production Checklist

- [ ] Replace placeholder images with your product images
- [ ] Update `mockApi.ts` to call real `/api/claw/play` and `/api/claw/claim` endpoints
- [ ] Swap `prizes.fixture.json` for live data from backend
- [ ] Test on mobile devices (tap/drag carousel)
- [ ] Verify accessibility (keyboard navigation, screen readers)
- [ ] Add analytics tracking to `handleGO()` and `handleClaim()`
- [ ] Set up A/B testing for spin duration and button colors
- [ ] Document the feature in your user-facing help/FAQ

---

## Questions?

Check these files for more details:
- **How carousel works**: `src/components/CircularGallery.tsx`
- **How spin logic works**: `src/features/claw/ClawMachineV2.tsx`
- **How rewards are claimed**: `src/features/claw/mockApi.ts` and `ResultModal.tsx`
- **Full architecture**: `REDESIGN_V2.md`

---

**Happy spinning! 🎰**
