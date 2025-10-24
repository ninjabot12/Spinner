# 🎰 The Claw Machine - RRM Rewards System

A premium 3D carousel-based rewards system built with React, TypeScript, and WebGL. Perfect for e-commerce sites, gaming platforms, or any application needing an engaging random reward mechanic.

![Status](https://img.shields.io/badge/status-production%20ready-brightgreen)
![React](https://img.shields.io/badge/react-18.2-blue)
![TypeScript](https://img.shields.io/badge/typescript-5.3-blue)

---

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173/ and click **GO!** to test the rewards system.

---

## 📸 Demo

- **Idle State**: Carousel slowly drifts left→right
- **Spin Animation**: 3 full rotations + lands on winning prize
- **Prize Reveal**: Modal shows reward with context-appropriate CTA
- **Freeze/Unfreeze**: Carousel freezes during reveal, resumes after close

---

## 🎨 Customization Guide

### 1. Add Your Own Prize Images

**Location**: `src/features/claw/ClawMachineV2.tsx` (lines 42-58)

**Current (placeholder images)**:
```typescript
function getHighDefImageUrl(prizeId: string, prizeName: string): string {
  const seedMap: Record<string, string> = {
    prize_001: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=600&fit=crop',
    prize_002: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=600&fit=crop',
    // ... more prizes
  };
  return seedMap[prizeId] || `https://picsum.photos/seed/${prizeId}/800/600`;
}
```

**Replace with your images**:
```typescript
function getHighDefImageUrl(prizeId: string, prizeName: string): string {
  const seedMap: Record<string, string> = {
    prize_001: '/assets/prizes/100-points.jpg',
    prize_002: '/assets/prizes/10-percent-off.jpg',
    prize_003: '/assets/prizes/5-dollar-off.jpg',
    prize_004: '/assets/prizes/250-points.jpg',
    prize_005: '/assets/prizes/drum-kit-808.jpg',
    // ... add all your prizes
  };
  return seedMap[prizeId] || '/assets/prizes/default.jpg';
}
```

**Image Requirements**:
- **Dimensions**: 800×600px minimum (4:3 aspect ratio recommended)
- **Format**: JPG, PNG, or WebP
- **Size**: Keep under 500KB per image for fast loading
- **CORS**: Ensure images are served from same domain or have CORS headers

---

### 2. Customize Prize Names & Details

**Location**: `src/features/claw/prizes.fixture.json`

**Current structure**:
```json
[
  {
    "id": "prize_001",
    "name": "100 Points",
    "icon": "⭐",
    "rarity": "common",
    "weight": 250,
    "rewardType": "loyalty_points",
    "value": 100,
    "msrpCents": 500,
    "color": "#FFD700"
  }
]
```

**Field Guide**:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | string | Unique identifier (required) | `"prize_001"` |
| `name` | string | Display name shown to user | `"100 Points"` |
| `icon` | string | Emoji/icon (optional, for future use) | `"⭐"` |
| `rarity` | enum | `common`, `rare`, `epic`, `legendary` | `"common"` |
| `weight` | number | Drop chance weight (0-1000) | `250` |
| `rewardType` | enum | See reward types below | `"loyalty_points"` |
| `value` | number\|string | Reward value (varies by type) | `100` |
| `productSlug` | string | For free products (optional) | `"drum-kit-808"` |
| `msrpCents` | number | Display value in cents (optional) | `500` ($5.00) |
| `color` | string | Hex color for glow effect (optional) | `"#FFD700"` |

**Example: Add a new prize**:
```json
{
  "id": "prize_015",
  "name": "Free Shipping",
  "icon": "🚚",
  "rarity": "common",
  "weight": 200,
  "rewardType": "discount_fixed",
  "value": 0,
  "msrpCents": 1500,
  "color": "#4CAF50"
}
```

---

### 3. Adjust Win Chances (Weights)

**How weights work**:
- Higher weight = higher chance to win
- Weights are relative (not percentages)
- Total of all weights = 100% probability pool

**Example calculation**:
```javascript
prize_001: weight 250   → 250 / 1188 = 21.0% chance
prize_002: weight 180   → 180 / 1188 = 15.2% chance
prize_013: weight 10    → 10 / 1188  = 0.8% chance  (rare!)
Total:     1188
```

**Quick weight templates**:

| Drop Rate | Weight | Use Case |
|-----------|--------|----------|
| Very Common (25%) | 300 | Low-value rewards (10 points, 5% off) |
| Common (15-20%) | 150-200 | Standard rewards (50 points, 10% off) |
| Uncommon (10%) | 100 | Mid-tier rewards (100 points, free sample) |
| Rare (5%) | 50 | High-value rewards (500 points, 30% off) |
| Epic (2%) | 20 | Premium rewards (free product) |
| Legendary (<1%) | 5-10 | Ultra-rare (VST voucher, $50 off) |

**Example: Boost a prize's drop rate**:
```json
{
  "id": "prize_001",
  "name": "100 Points",
  "weight": 250  // Change from 250 → 400 for higher chance
}
```

**Pro tip**: After changing weights, test with the "Skip" button (dev mode) to verify distribution feels right.

---

### 4. Reward Types & CTAs

**Six reward types supported**:

#### 1. `loyalty_points`
Adds points to user's balance.

```json
{
  "rewardType": "loyalty_points",
  "value": 100  // Number of points
}
```
- **CTA**: "Add Points"
- **Action**: Increments `localStorage.pointsBalance`
- **Backend**: Replace with `POST /api/loyalty/add`

#### 2. `discount_percent`
Percentage discount coupon.

```json
{
  "rewardType": "discount_percent",
  "value": 10  // 10% off
}
```
- **CTA**: "Reveal Code"
- **Action**: Generates code (e.g., `DRUM-ABC123`), copies to clipboard
- **Backend**: Replace with `POST /api/promo/issue`

#### 3. `discount_fixed`
Fixed dollar amount discount.

```json
{
  "rewardType": "discount_fixed",
  "value": 5  // $5 off
}
```
- **CTA**: "Reveal Code"
- **Action**: Generates code, copies to clipboard
- **Backend**: Replace with `POST /api/promo/issue`

#### 4. `free_product`
Grants a full product (sample pack, kit, etc.).

```json
{
  "rewardType": "free_product",
  "value": "drum-kit-808",
  "productSlug": "drum-kit-808"  // Required
}
```
- **CTA**: "Add to Library"
- **Action**: Adds to `localStorage.library`
- **Backend**: Replace with `POST /api/library/grant`

#### 5. `free_oneshot`
Grants a single sample/item.

```json
{
  "rewardType": "free_oneshot",
  "value": "snare-crisp-01",
  "productSlug": "snare-crisp-01"  // Required
}
```
- **CTA**: "Add to Library"
- **Action**: Adds to `localStorage.library`
- **Backend**: Replace with `POST /api/library/grant`

#### 6. `vst_voucher`
High-tier reward (plugin access, premium tier).

```json
{
  "rewardType": "vst_voucher",
  "value": "vst-suite-pro"
}
```
- **CTA**: "Reveal Code"
- **Action**: Generates code, copies to clipboard
- **Backend**: Replace with `POST /api/voucher/issue`

**Add your own reward type**:
1. Add to `types.ts`: `export type RewardType = ... | 'your_new_type'`
2. Update `ResultModal.tsx` CTA_MAP (line 31)
3. Update `mockApi.ts` claim() logic (line 78)

---

### 5. Visual Customization

#### A. Carousel Curve
**Location**: `src/features/claw/ClawMachineV2.tsx` (line 135)

```typescript
<CircularGallery
  bend={-1}  // ← Change this
  // ...
/>
```

- `bend={0}` → Flat carousel (no 3D curve)
- `bend={-1}` → Subtle upward curve (current)
- `bend={-3}` → Strong upward curve (dramatic)
- `bend={1}` → Downward curve (inverted)
- `bend={3}` → Strong downward curve

#### B. Idle Scroll Speed
**Location**: `src/components/CircularGallery.tsx` (line 298)

```typescript
autoScrollSpeed: number = 0.15;  // ← Change this
```

- `0.05` → Very slow drift (subtle)
- `0.15` → Current (balanced)
- `0.3` → Fast drift (energetic)
- `0.5` → Very fast (might be too much)

#### C. Spin Duration
**Location**: `src/features/claw/ClawMachineV2.tsx` (line 85)

```typescript
const spinDuration = 3000;  // ← Change this (milliseconds)
```

- `2000` → 2 seconds (fast, good for testing)
- `3000` → 3 seconds (current, balanced)
- `5000` → 5 seconds (dramatic, suspenseful)

#### D. Number of Laps
**Location**: `src/features/claw/ClawMachineV2.tsx` (line 86)

```typescript
const numLaps = 3;  // ← Change this
```

- `1` → 1 full rotation (minimal)
- `3` → 3 full rotations (current)
- `5` → 5 full rotations (very dramatic)

#### E. Colors & Styling
**Location**: `src/features/claw/styles.module.css`

**Change GO! button gradient**:
```css
.buttonPlay {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  /* Change to your brand colors: */
  /* background: linear-gradient(135deg, #FF6347 0%, #FF1493 100%); */
}
```

**Change rarity colors**:
```css
:root {
  --color-common: #e0e0e0;    /* Grey */
  --color-rare: #ff6347;      /* Red */
  --color-epic: #00ced1;      /* Cyan */
  --color-legendary: #ffd700; /* Gold */
}
```

---

### 6. Backend Integration

#### Replace Mock API with Real Endpoints

**Location**: `src/features/claw/mockApi.ts`

**Current (mock)**:
```typescript
export async function play(): Promise<PlayResult> {
  const latency = 400 + Math.random() * 300;
  await new Promise((r) => setTimeout(r, latency));
  const prize = selectPrizeByWeight();
  return { playId: generatePlayId(), prize, serverLatencyMs: Math.round(latency) };
}
```

**Replace with**:
```typescript
export async function play(): Promise<PlayResult> {
  const response = await fetch('/api/claw/play', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // For auth cookies
  });

  if (!response.ok) {
    throw new Error('Failed to play');
  }

  return response.json();
}
```

**Same for claim()**:
```typescript
export async function claim(playId: string, prize: Prize): Promise<ClaimResult> {
  const response = await fetch('/api/claw/claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ playId, prizeId: prize.id }),
  });

  if (!response.ok) {
    throw new Error('Failed to claim');
  }

  return response.json();
}
```

#### Backend API Contracts

**POST /api/claw/play**

Request:
```json
{}  // Or include user auth token
```

Response:
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

**POST /api/claw/claim**

Request:
```json
{
  "playId": "play_1729700000000_abc123",
  "prizeId": "prize_001"
}
```

Response:
```json
{
  "playId": "play_1729700000000_abc123",
  "prizeId": "prize_001",
  "success": true,
  "couponCode": "DRUM-ABC123",       // For discount_* types
  "pointsAdded": 100,                // For loyalty_points
  "grantedProductSlug": "drum-kit"   // For free_product types
}
```

---

## 🛠️ Common Use Cases

### Use Case 1: E-Commerce Store
**Goal**: Reward customers with discounts and loyalty points.

**Prizes to add**:
```json
[
  { "name": "10% Off", "rewardType": "discount_percent", "value": 10, "weight": 200 },
  { "name": "$5 Off", "rewardType": "discount_fixed", "value": 5, "weight": 180 },
  { "name": "50 Points", "rewardType": "loyalty_points", "value": 50, "weight": 250 },
  { "name": "Free Shipping", "rewardType": "discount_fixed", "value": 0, "weight": 150 }
]
```

**Customization**:
- Use product images for brand consistency
- Integrate with Shopify/WooCommerce discount codes
- Connect to loyalty program API

---

### Use Case 2: Gaming Platform
**Goal**: Reward players with in-game items and currency.

**Prizes to add**:
```json
[
  { "name": "100 Coins", "rewardType": "loyalty_points", "value": 100, "weight": 300 },
  { "name": "Rare Skin", "rewardType": "free_product", "value": "skin-dragon", "weight": 50 },
  { "name": "Epic Weapon", "rewardType": "free_product", "value": "weapon-legendary", "weight": 20 }
]
```

**Customization**:
- Use game asset images (characters, items, currency icons)
- Increase laps to 5-7 for more suspense
- Add sound effects (see Advanced section)

---

### Use Case 3: SaaS Platform
**Goal**: Reward users with trial upgrades and feature unlocks.

**Prizes to add**:
```json
[
  { "name": "7-Day Pro Trial", "rewardType": "vst_voucher", "value": "pro-trial-7d", "weight": 100 },
  { "name": "50% Off Annual", "rewardType": "discount_percent", "value": 50, "weight": 30 },
  { "name": "Free Month", "rewardType": "vst_voucher", "value": "free-month", "weight": 10 }
]
```

**Customization**:
- Use feature screenshots or icons as images
- Connect to subscription management API
- Add analytics tracking (see Advanced section)

---

## 🎯 Quick Reference

### File Locations Cheat Sheet

| What to Change | File Location | Line(s) |
|----------------|---------------|---------|
| Prize images | `src/features/claw/ClawMachineV2.tsx` | 42-58 |
| Prize names & weights | `src/features/claw/prizes.fixture.json` | All |
| Carousel curve | `src/features/claw/ClawMachineV2.tsx` | 135 |
| Idle scroll speed | `src/components/CircularGallery.tsx` | 298 |
| Spin duration | `src/features/claw/ClawMachineV2.tsx` | 85 |
| Number of laps | `src/features/claw/ClawMachineV2.tsx` | 86 |
| Button colors | `src/features/claw/styles.module.css` | 148-152 |
| Mock API → Real API | `src/features/claw/mockApi.ts` | 54, 82 |

---

## 🧪 Testing Your Changes

### 1. Test Prize Distribution
```bash
# In browser console (F12):
for (let i = 0; i < 100; i++) {
  // Click GO! 100 times and note which prizes appear most
}
```

### 2. Verify Weights
```javascript
// In mockApi.ts, add this temporarily:
console.log('Prize:', prize.name, 'Weight:', prize.weight);
```

### 3. Test All Reward Types
Create a test prize for each type with `weight: 1000` (guaranteed win) and verify:
- ✅ CTA button shows correct text
- ✅ Claim action works (check localStorage or backend)
- ✅ Success message appears

---

## 📦 Deployment

### Build for Production
```bash
npm run build
```

Outputs to `dist/` folder. Deploy to:
- **Vercel**: `vercel deploy`
- **Netlify**: Drag `dist/` to netlify.com
- **AWS S3**: `aws s3 sync dist/ s3://your-bucket`

### Environment Variables
Create `.env` file:
```bash
VITE_API_URL=https://api.yoursite.com
VITE_CDN_URL=https://cdn.yoursite.com
```

Use in code:
```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

---

## 🔧 Advanced Customization

### Add Sound Effects
```typescript
// In ClawMachineV2.tsx, after spin completes:
const winSound = new Audio('/assets/sounds/win.mp3');
winSound.play();
```

### Add Analytics Tracking
```typescript
// In handleGO():
analytics.track('claw_play_started', {
  timestamp: Date.now(),
  userId: currentUser.id,
});

// In handleClaim():
analytics.track('claw_prize_claimed', {
  prizeId: result.prizeId,
  rewardType: prize.rewardType,
  value: prize.value,
});
```

### Add Rate Limiting
```typescript
// In ClawMachineV2.tsx:
const [playsRemaining, setPlaysRemaining] = useState(3);

const handleGO = useCallback(async () => {
  if (playsRemaining <= 0) {
    setError('No plays remaining. Come back tomorrow!');
    return;
  }
  // ... rest of logic
  setPlaysRemaining(prev => prev - 1);
}, [playsRemaining]);
```

### Add Pity Timer
```typescript
// In mockApi.ts:
let spinsSinceRare = 0;

export async function play(): Promise<PlayResult> {
  spinsSinceRare++;

  // Guarantee rare after 20 spins
  if (spinsSinceRare >= 20) {
    const rarePrizes = prizes.filter(p => p.rarity === 'rare' || p.rarity === 'epic');
    const prize = rarePrizes[Math.floor(Math.random() * rarePrizes.length)];
    spinsSinceRare = 0;
    return { playId: generatePlayId(), prize, serverLatencyMs: 500 };
  }

  // Normal weighted selection
  const prize = selectPrizeByWeight();
  if (prize.rarity === 'rare' || prize.rarity === 'epic') spinsSinceRare = 0;
  return { playId: generatePlayId(), prize, serverLatencyMs: 500 };
}
```

---

## 🐛 Troubleshooting

### Problem: Images not loading
**Solution**: Check CORS headers. If using external CDN:
```typescript
// Add crossOrigin attribute:
<img src={imageUrl} crossOrigin="anonymous" />
```

### Problem: Carousel doesn't freeze after win
**Solution**: Check browser console for errors. Ensure `useMemo` is wrapping `carouselItems`.

### Problem: Weights don't seem right
**Solution**: Test with higher weights (e.g., set one prize to 1000, others to 1) to verify logic works.

### Problem: Modal doesn't close
**Solution**: Check if `handleCloseModal` is called. Add `console.log('Closing modal')` to debug.

---

## 📚 Additional Resources

- **Full API Docs**: See `src/features/claw/types.ts` for all TypeScript interfaces
- **Design Decisions**: See `REDESIGN_V2.md` for architecture details
- **Original Context**: See `context.md` for V1 implementation notes

---

## 💡 Tips & Best Practices

1. **Start with mock data** - Test visuals before connecting real backend
2. **Use realistic weights** - Don't make legendary prizes too rare (< 0.5% feels unfair)
3. **Test on mobile** - Carousel should work on all screen sizes
4. **Add loading states** - Show spinner during `mockApi.play()` call
5. **Graceful errors** - Handle network failures with friendly messages
6. **A/B test weights** - Track which prizes keep users engaged
7. **Seasonal prizes** - Update `prizes.fixture.json` for holidays/events

---

## 🤝 Support

Questions? Issues? Open a GitHub issue or contact the dev team.

**Version**: 2.0
**Last Updated**: 2025-10-23
**Status**: Production Ready ✅

---

## 📄 License

MIT License - Use in commercial projects freely.
