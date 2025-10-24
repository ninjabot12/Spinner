# 🎰 The Claw Machine - Interactive Prize Selector

A futuristic 3-row horizontal slider claw machine built with React, TypeScript, and GSAP. Features grid-locked positioning, weighted prize selection, and smooth claw animations.

![Status](https://img.shields.io/badge/status-production%20ready-brightgreen)
![React](https://img.shields.io/badge/react-18.2-blue)
![TypeScript](https://img.shields.io/badge/typescript-5.3-blue)
![GSAP](https://img.shields.io/badge/gsap-3.12-green)

---

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173/ and click **GO!** to test the claw machine.

---

## 🎮 How It Works

### The Flow
1. **Idle State**: 3 rows drift slowly left/right with alternating directions
2. **Press GO**: All rows spin independently for 4 seconds
3. **Grid Snap**: Rows freeze in perfect 3×5 grid alignment (15 total cards)
4. **Prize Selection**: Weighted random selection from visible cards
5. **Claw Animation**:
   - Claw moves horizontally along rail to target column
   - Descends vertically to winning card position
   - Grabs card with closing animation
6. **Prize Reveal**: Modal displays reward with context-appropriate CTA
7. **Reset**: Claw returns to top-right position

---

## 🏗️ Architecture

### Component Structure

```
ClawMachineV2 (Main Container)
├── MultiRowSlider (3 Horizontal Rows)
│   ├── Row 1: Independent scrolling
│   ├── Row 2: Independent scrolling
│   └── Row 3: Independent scrolling
├── ClawAnimation (Overlay)
│   ├── Horizontal Rail (top)
│   ├── Claw Carriage (slides on rail)
│   └── Claw (descends to grab)
└── ResultModal (Prize Display)
```

### Key Features

#### Grid System (3×5)
- **Deterministic positioning**: Each card position has exact (x, y) coordinates
- **Snap-to-grid**: After spin, rows align perfectly to show exactly 5 cards per row
- **No off-screen winners**: All 15 positions are guaranteed visible
- **Grid coordinates**: Used by claw for precise targeting

```typescript
interface GridPosition {
  row: 0-2     // 3 rows
  col: 0-4     // 5 columns
  x: number    // Pixel X (center of card)
  y: number    // Pixel Y (center of card)
}
```

#### Claw Animation System
- **Always visible** at top-right (minimal obstruction)
- **Futuristic rail** with cyan pulsing lights
- **2-move animation**:
  1. Horizontal slide along rail to column
  2. Vertical descent to row
- **GSAP timeline** for smooth, controlled motion
- **80×80px claw** comparable to card size

---

## 🎨 Customization Guide

### 1. Prize Configuration

**Location**: `src/features/claw/prizes.fixture.json`

```json
{
  "id": "prize_001",
  "name": "Glicktekk - Production Pack",
  "imageFileName": "Glicktekk - Koktakt Bank + Oneshots.webp",
  "rarity": "common",
  "weight": 250,
  "rewardType": "free_product",
  "value": "glicktekk-pack",
  "msrpCents": 2999,
  "color": "#FFD700"
}
```

**Field Guide**:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `name` | string | Display name |
| `imageFileName` | string | Filename in `/public/prizes/` |
| `rarity` | enum | `common`, `rare`, `epic`, `legendary` |
| `weight` | number | Drop chance weight (0-1000) |
| `rewardType` | enum | Reward type (see below) |
| `value` | number\|string | Reward value |
| `msrpCents` | number | Display value in cents |
| `color` | string | Hex color for effects |

### 2. Adjust Drop Rates

**How weights work**:
- Higher weight = higher chance to win
- Weights are relative (not percentages)
- Total of all weights = 100% probability pool

**Example calculation**:
```
prize_001: weight 250 → 250 / 1188 = 21.0% chance
prize_002: weight 180 → 180 / 1188 = 15.2% chance
prize_013: weight 10  → 10 / 1188  = 0.8% chance
Total:     1188
```

**Weight Templates**:

| Drop Rate | Weight | Use Case |
|-----------|--------|----------|
| Very Common (25%) | 300 | Low-value rewards |
| Common (15-20%) | 150-200 | Standard rewards |
| Uncommon (10%) | 100 | Mid-tier rewards |
| Rare (5%) | 50 | High-value rewards |
| Epic (2%) | 20 | Premium rewards |
| Legendary (<1%) | 5-10 | Ultra-rare rewards |

### 3. Prize Images

**Location**: `/public/prizes/`

**Requirements**:
- **Format**: WebP, JPG, or PNG
- **Dimensions**: 800×800px recommended (square)
- **Size**: Keep under 500KB per image
- **Naming**: Match `imageFileName` in prizes.fixture.json

**Example**:
```json
{
  "imageFileName": "my-prize.webp"
}
```
Place file at: `/public/prizes/my-prize.webp`

### 4. Reward Types

#### `free_product`
Full product (sample pack, kit, preset library)

```json
{
  "rewardType": "free_product",
  "value": "product-slug",
  "productSlug": "product-slug"
}
```
- **CTA**: "Add to Library"
- **Action**: Adds to user's library

#### `discount_percent`
Percentage discount coupon

```json
{
  "rewardType": "discount_percent",
  "value": 10
}
```
- **CTA**: "Reveal Code"
- **Action**: Generates code, copies to clipboard

#### `discount_fixed`
Fixed dollar discount

```json
{
  "rewardType": "discount_fixed",
  "value": 5
}
```
- **CTA**: "Reveal Code"
- **Action**: Generates code, copies to clipboard

#### `loyalty_points`
Points reward

```json
{
  "rewardType": "loyalty_points",
  "value": 100
}
```
- **CTA**: "Add Points"
- **Action**: Increments points balance

### 5. Visual Customization

#### Spin Speed
**Location**: `src/features/claw/ClawMachineV2.tsx:104`

```typescript
const spinDuration = 4000;  // Change milliseconds
```
- `2000` → 2 seconds (fast)
- `4000` → 4 seconds (current)
- `6000` → 6 seconds (dramatic)

#### Idle Drift Speed
**Location**: `src/components/MultiRowSlider.tsx:52, 210`

```typescript
velocity: 1  // Change speed (pixels per frame)
```
- `0.5` → Very slow
- `1` → Current (smooth)
- `2` → Faster drift

#### Claw Animation Duration
**Location**: `src/components/ClawAnimation.tsx:31`

```typescript
moveToPosition: async (gridPosition, duration = 2.5)
```
- `1.5` → Fast claw
- `2.5` → Current (balanced)
- `4` → Slow, dramatic

#### Colors & Styling
**Location**: `src/components/ClawAnimation.css`

```css
/* Rail lights */
.rail-light {
  background: #0ff;  /* Change cyan color */
}

/* Claw glow */
.claw-glow {
  stroke: #0ff;  /* Change accent color */
}
```

---

## 🔌 Backend Integration

### Replace Mock API

**Location**: `src/features/claw/mockApi.ts`

**Current (mock)**:
```typescript
export async function play(): Promise<PlayResult> {
  await new Promise((r) => setTimeout(r, 500));
  const prize = selectPrizeByWeight();
  return { playId: generatePlayId(), prize, serverLatencyMs: 500 };
}
```

**Replace with real API**:
```typescript
export async function play(): Promise<PlayResult> {
  const response = await fetch('/api/claw/play', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  if (!response.ok) throw new Error('Failed to play');
  return response.json();
}
```

### API Contracts

**POST /api/claw/play**

Response:
```json
{
  "playId": "play_1729700000000_abc123",
  "prize": {
    "id": "prize_001",
    "name": "Production Pack",
    "rarity": "common",
    "rewardType": "free_product",
    "value": "product-slug"
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
  "couponCode": "SAMPLE-ABC123",
  "grantedProductSlug": "product-slug"
}
```

---

## 🎯 File Structure

```
src/
├── components/
│   ├── MultiRowSlider.tsx      # 3-row slider component
│   ├── MultiRowSlider.css      # Slider styling
│   ├── ClawAnimation.tsx       # Claw + rail system
│   └── ClawAnimation.css       # Claw styling
├── features/claw/
│   ├── ClawMachineV2.tsx       # Main container
│   ├── ResultModal.tsx         # Prize display modal
│   ├── mockApi.ts              # API integration layer
│   ├── prizes.fixture.json     # Prize configuration
│   ├── types.ts                # TypeScript interfaces
│   └── styles.module.css       # Container styling
public/prizes/                  # Prize images
```

---

## 🛠️ Development

### Key Technologies
- **React 18.2** - UI framework
- **TypeScript 5.3** - Type safety
- **GSAP 3.12** - Animation library
- **Vite 5** - Build tool

### Important Interfaces

```typescript
// Grid position for claw targeting
interface GridPosition {
  row: number;    // 0-2
  col: number;    // 0-4
  x: number;      // Pixel X coordinate
  y: number;      // Pixel Y coordinate
}

// Visible card with grid data
interface VisibleCard {
  rowIndex: number;
  colIndex: number;
  cardIndex: number;
  prizeId: string;
  gridPosition: GridPosition;  // For claw animation
}
```

### Build Commands

```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
```

---

## 🐛 Troubleshooting

### Images not loading
**Issue**: Prize images show as broken
**Solution**:
1. Check images are in `/public/prizes/`
2. Verify `imageFileName` matches exactly (case-sensitive)
3. Ensure images are < 500KB

### Claw position is off
**Issue**: Claw doesn't align with winning card
**Solution**:
1. Check `containerWidth` matches actual container
2. Verify grid snap is working (check console logs)
3. Ensure card size calculation is correct

### Animation is janky
**Issue**: Slider or claw animation stutters
**Solution**:
1. Check velocity is set to `1` (not too high)
2. Ensure GPU acceleration CSS is present
3. Verify GSAP is properly imported

### Grid not aligned
**Issue**: Cards don't snap to perfect grid
**Solution**:
1. Check `snapPositionsToGrid()` is called after spin
2. Verify `targetVisibleCards = 5` in code
3. Ensure container width is stable (not changing)

---

## 📚 Advanced Customization

### Add Sound Effects

```typescript
// In ClawMachineV2.tsx
const spinSound = new Audio('/sounds/spin.mp3');
const winSound = new Audio('/sounds/win.mp3');

// Play on spin
spinSound.play();

// Play when claw grabs
winSound.play();
```

### Add Analytics

```typescript
// Track spin start
analytics.track('claw_spin', {
  timestamp: Date.now(),
  userId: user.id,
});

// Track prize won
analytics.track('claw_prize', {
  prizeId: prize.id,
  rarity: prize.rarity,
  value: prize.value,
});
```

### Rate Limiting

```typescript
const [playsRemaining, setPlaysRemaining] = useState(3);

const handleGO = async () => {
  if (playsRemaining <= 0) {
    setError('Come back tomorrow for more plays!');
    return;
  }
  // ... spin logic
  setPlaysRemaining(prev => prev - 1);
};
```

---

## 📦 Deployment

### Build for Production

```bash
npm run build
```

Outputs to `dist/` folder.

### Deploy Options

**Vercel**:
```bash
npm i -g vercel
vercel deploy
```

**Netlify**:
```bash
npm run build
# Drag dist/ folder to netlify.com
```

**AWS S3**:
```bash
aws s3 sync dist/ s3://your-bucket --acl public-read
```

---

## 💡 Best Practices

1. **Test weights thoroughly** - Use console to verify distribution
2. **Optimize images** - WebP format, < 500KB per image
3. **Mobile first** - Test on various screen sizes
4. **Graceful errors** - Handle network failures with friendly messages
5. **Analytics tracking** - Monitor what prizes users win
6. **A/B test** - Experiment with weights to maximize engagement
7. **Seasonal updates** - Swap prizes for holidays/events

---

## 📄 Project Context

### What Changed from V1
- ❌ Removed 3D carousel (OGL/WebGL complexity)
- ✅ Implemented 3-row horizontal slider
- ✅ Added claw animation system
- ✅ Introduced grid-based positioning
- ✅ GSAP for smoother animations
- ✅ TypeScript throughout

### Design Decisions
- **3 rows instead of carousel**: Better performance, clearer UX
- **Grid system**: Enables precise claw targeting
- **Alternating directions**: More dynamic visual interest
- **Rail-based claw**: Mimics real claw machine mechanics

---

## 🤝 Contributing

Have improvements? Open a PR or issue on GitHub!

---

## 📝 Version History

**v2.0** (2024-10-24)
- Complete rewrite with 3-row slider
- Added claw animation system
- Grid-based positioning
- GSAP integration

**v1.0** (2024-10-23)
- Initial 3D carousel implementation

---

## 📄 License

MIT License - Use in commercial projects freely.

---

**Questions?** Open a GitHub issue or check the troubleshooting section above.
