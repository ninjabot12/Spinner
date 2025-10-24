# ⚡ 5-Minute Quick Setup Guide

Get your custom rewards system running in 5 minutes!

---

## Step 1: Replace Prize Images (2 min)

**File**: `src/features/claw/ClawMachineV2.tsx`

Find this section (lines 42-58):
```typescript
function getHighDefImageUrl(prizeId: string, prizeName: string): string {
  const seedMap: Record<string, string> = {
    prize_001: 'YOUR_IMAGE_URL_HERE',  // ← Replace
    prize_002: 'YOUR_IMAGE_URL_HERE',  // ← Replace
    // ... etc
  };
```

Replace with your own image URLs or local paths:
```typescript
prize_001: '/assets/prizes/100-points.jpg',
prize_002: '/assets/prizes/discount-10.jpg',
```

**Image specs**: 800×600px, JPG/PNG, under 500KB each

---

## Step 2: Edit Prize Names & Weights (2 min)

**File**: `src/features/claw/prizes.fixture.json`

```json
{
  "id": "prize_001",
  "name": "100 Points",        ← Change name
  "weight": 250,               ← Change drop chance (0-1000)
  "rewardType": "loyalty_points",
  "value": 100
}
```

**Weight Guide**:
- `300` = Very common (25% drop rate)
- `150` = Common (15% drop rate)
- `50` = Rare (5% drop rate)
- `10` = Legendary (<1% drop rate)

---

## Step 3: Test It! (1 min)

```bash
npm run dev
```

Open http://localhost:5173/ → Click **GO!**

**Check**:
- ✅ Your images appear in carousel
- ✅ Prize names are correct
- ✅ Win rates feel right (play 10-20 times)

---

## Step 4: Adjust Visual Settings (Optional)

### Make carousel curve stronger/weaker
**File**: `src/features/claw/ClawMachineV2.tsx` (line 135)
```typescript
bend={-1}  // Try -3 (dramatic) or -0.5 (subtle)
```

### Make idle scroll faster/slower
**File**: `src/components/CircularGallery.tsx` (line 298)
```typescript
autoScrollSpeed: number = 0.15;  // Try 0.3 (faster) or 0.05 (slower)
```

### Make spin longer/shorter
**File**: `src/features/claw/ClawMachineV2.tsx` (line 85)
```typescript
const spinDuration = 3000;  // Try 5000 (5 sec) or 2000 (2 sec)
```

---

## Step 5: Connect to Your Backend (Optional)

**File**: `src/features/claw/mockApi.ts`

Replace mock functions:

```typescript
// OLD (mock):
export async function play(): Promise<PlayResult> {
  const prize = selectPrizeByWeight();
  return { playId, prize, serverLatencyMs };
}

// NEW (real API):
export async function play(): Promise<PlayResult> {
  const res = await fetch('/api/claw/play', { method: 'POST' });
  return res.json();
}
```

Same for `claim()` function.

---

## 🎉 Done!

You now have a fully customized rewards system!

**Next steps**:
- See full [README.md](./README.md) for advanced customization
- Add sound effects, analytics, rate limiting
- Deploy to production

---

## 🆘 Need Help?

**Common issues**:

1. **Images not showing?**
   - Check file paths are correct
   - Verify CORS if using external URLs

2. **Weights seem wrong?**
   - Test with extreme weights (set one to 1000, others to 1)
   - Play 50+ times to see distribution

3. **Carousel not freezing?**
   - Refresh browser (Ctrl+R)
   - Check console for errors (F12)

Full troubleshooting guide in [README.md](./README.md#-troubleshooting)
