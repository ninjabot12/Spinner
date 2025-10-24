# WebP Image Integration Guide

## Overview

The Claw Machine V2 now supports custom WebP drum kit cover art images. Product names from the prize fixtures automatically match the images displayed in both the carousel and the winning modal.

---

## File Structure

```
/Users/lumasku/Cursor/TheClaw/
├── public/
│   └── prizes/
│       ├── drumkit-alpha.webp
│       ├── drumkit-beta.webp
│       ├── drumkit-gamma.webp
│       ├── drumkit-delta.webp
│       ├── drumkit-epsilon.webp
│       ├── drumkit-zeta.webp
│       └── default.webp (fallback)
├── src/
│   ├── features/claw/
│   │   ├── prizes.fixture.json (6 drum kits with imageFileName)
│   │   ├── types.ts (Prize interface with imageFileName field)
│   │   ├── ClawMachineV2.tsx (updated getHighDefImageUrl())
│   │   ├── ResultModal.tsx (redesigned for cover art showcase)
│   │   └── styles.module.css (new styles for cover art)
```

---

## How It Works

### 1. Prize Configuration (`prizes.fixture.json`)

Each prize entry now includes an `imageFileName` field:

```json
{
  "id": "prize_001",
  "name": "Trap Essentials Kit",
  "icon": "🥁",
  "rarity": "common",
  "weight": 200,
  "rewardType": "free_product",
  "value": "trap-essentials-kit",
  "productSlug": "trap-essentials-kit",
  "msrpCents": 2999,
  "color": "#FF6347",
  "imageFileName": "drumkit-alpha.webp"
}
```

**Key Fields:**
- `id`: Internal prize ID (keep as `prize_001`, `prize_002`, etc. - do NOT rename)
- `name`: Product display name (shown in carousel and modal)
- `imageFileName`: WebP file name in `/public/prizes/` folder
- `productSlug`: Backend product identifier

### 2. TypeScript Interface (`types.ts`)

The `Prize` interface has been updated to include the optional `imageFileName` field:

```typescript
export interface Prize {
  id: string;
  name: string;
  icon: string;
  rarity: Rarity;
  weight: number;
  rewardType: RewardType;
  value: number | string;
  productSlug?: string;
  msrpCents?: number;
  color?: string;
  imageFileName?: string; // NEW: WebP file name
}
```

### 3. Image Resolution (`ClawMachineV2.tsx`)

The `getHighDefImageUrl()` function now looks up images from the `/public/prizes/` folder:

```typescript
function getHighDefImageUrl(prizeId: string, prizeName: string): string {
  // Find the prize in the fixture data to get its imageFileName
  const prize = prizes.find((p) => p.id === prizeId);

  if (prize?.imageFileName) {
    // Use the WebP file from /public/prizes/
    return `/prizes/${prize.imageFileName}`;
  }

  // Fallback if no imageFileName is specified
  return '/prizes/default.webp';
}
```

**How it works:**
1. Finds the prize by its `id` in the `prizes.fixture.json` data
2. If `imageFileName` exists, returns `/prizes/{imageFileName}`
3. Falls back to `default.webp` if no image is specified

### 4. Cover Art Showcase (`ResultModal.tsx`)

The modal has been completely redesigned to showcase the drum kit cover art:

**New Layout:**
- Large cover art image at the top (300px height)
- "You Won!" overlay on top of the image
- Product name and rarity badge below the image
- Reward details and action buttons at the bottom

**CSS Classes Added:**
- `.coverArtShowcase` - Container for cover art
- `.coverArtImage` - The actual image (object-fit: cover)
- `.coverArtOverlay` - Gradient overlay with "You Won!" text
- `.productInfo` - Product name and rarity section
- `.productName` - Product name heading

---

## Adding Your Own Images

### Step 1: Prepare Your Images

**Recommended specs:**
- Format: WebP
- Dimensions: 800×600px or larger (maintains quality on all devices)
- Aspect ratio: 4:3 or square (1:1)
- File size: Optimize for web (< 200KB per image)

**Naming convention:**
- Use descriptive names: `drumkit-alpha.webp`, `drumkit-beta.webp`, etc.
- Keep names lowercase with hyphens
- Always use `.webp` extension

### Step 2: Add Images to `/public/prizes/`

```bash
# Create the directory if it doesn't exist
mkdir -p public/prizes

# Copy your WebP images
cp ~/Downloads/drumkit-alpha.webp public/prizes/
cp ~/Downloads/drumkit-beta.webp public/prizes/
# ... repeat for all 6 images

# Add a fallback image
cp ~/Downloads/default.webp public/prizes/
```

### Step 3: Update `prizes.fixture.json`

Link each prize to its corresponding image:

```json
[
  {
    "id": "prize_001",
    "name": "Trap Essentials Kit",
    "imageFileName": "drumkit-alpha.webp"
  },
  {
    "id": "prize_002",
    "name": "808 Thunder Pack",
    "imageFileName": "drumkit-beta.webp"
  }
]
```

### Step 4: Test

1. Start dev server: `npm run dev`
2. Open `http://localhost:5173/`
3. Click "GO!" button
4. Verify:
   - Carousel shows your drum kit images
   - Modal displays correct cover art matching the won prize
   - Product names match between carousel and modal

---

## Naming Strategy

### ✅ DO:
- **Keep internal IDs as `prize_001`, `prize_002`, etc.** (these are system identifiers)
- Use descriptive product names in the `name` field
- Use descriptive image file names (e.g., `drumkit-alpha.webp`)
- Match product names to what customers see on your store

### ❌ DON'T:
- Rename `prize_001` to match product names (breaks system logic)
- Use spaces in image file names
- Use uppercase in image file names
- Forget the `.webp` extension

**Example (Correct):**
```json
{
  "id": "prize_001",  // ✅ Keep this format
  "name": "Trap Essentials Kit",  // ✅ Customer-facing name
  "imageFileName": "drumkit-alpha.webp"  // ✅ Descriptive image name
}
```

---

## Modal Design Changes

### Transparency Adjustments

The modal now features enhanced transparency for a premium look:

**Overlay:**
```css
background: rgba(0, 0, 0, 0.4);  /* Was 0.6 - now more see-through */
backdrop-filter: blur(4px);      /* Adds blur effect */
```

**Modal Content:**
```css
background: rgba(255, 255, 255, 0.98);  /* Slightly transparent */
```

**Buttons:**
```css
/* CTA Button (Add to Library, Reveal Code, etc.) */
background: linear-gradient(135deg,
  rgba(102, 126, 234, 0.85) 0%,
  rgba(118, 75, 162, 0.85) 100%
);
border: 1px solid rgba(255, 255, 255, 0.3);

/* Close Button */
background: rgba(240, 240, 240, 0.7);
border: 1px solid rgba(0, 0, 0, 0.1);
```

### Cover Art Showcase

**Layout:**
```
┌─────────────────────────────────┐
│                                 │
│     [Cover Art Image]           │  ← 300px height, object-fit: cover
│                                 │
│  "You Won!" (overlay)           │  ← Gradient overlay
└─────────────────────────────────┘
┌─────────────────────────────────┐
│   Trap Essentials Kit           │  ← Product name
│   [ COMMON ]                    │  ← Rarity badge
└─────────────────────────────────┘
┌─────────────────────────────────┐
│   Free Product: Unlocked        │  ← Reward details
│   Value: $29.99                 │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│  [Add to Library]  [Close]      │  ← Action buttons
└─────────────────────────────────┘
```

---

## Troubleshooting

### Images Not Loading?

**Check 1: File exists in `/public/prizes/`**
```bash
ls -la public/prizes/
# Should show: drumkit-alpha.webp, drumkit-beta.webp, etc.
```

**Check 2: `imageFileName` matches exactly**
```json
// In prizes.fixture.json
"imageFileName": "drumkit-alpha.webp"  // ✅ Correct
"imageFileName": "Drumkit-Alpha.webp"  // ❌ Case mismatch
"imageFileName": "drumkit-alpha"       // ❌ Missing .webp
```

**Check 3: Browser console for errors**
```
Press F12 → Console tab
Look for 404 errors like: "GET /prizes/drumkit-alpha.webp 404"
```

### Wrong Image Showing?

**Check: Prize ID mapping**
```typescript
// In ClawMachineV2.tsx
const prize = prizes.find((p) => p.id === prizeId);
```

Make sure the `id` field in `prizes.fixture.json` matches the prize IDs used in the carousel.

### Product Name Not Matching?

**Check: Prize name field**
```json
{
  "id": "prize_001",
  "name": "Trap Essentials Kit",  // ← This shows in modal
  "imageFileName": "drumkit-alpha.webp"
}
```

The `name` field is what displays in both the carousel and the modal.

### Modal Not Showing Cover Art?

**Check 1: `getCoverArtUrl()` function in ResultModal.tsx**
```typescript
const getCoverArtUrl = () => {
  if (prize.imageFileName) {
    return `/prizes/${prize.imageFileName}`;
  }
  return '/prizes/default.webp';
};
```

**Check 2: CSS class applied**
```tsx
<img
  src={getCoverArtUrl()}
  alt={prize.name}
  className={styles.coverArtImage}  // ← Must have this class
/>
```

---

## Production Checklist

Before deploying to production:

- [ ] All 6 WebP images are in `/public/prizes/`
- [ ] `default.webp` fallback image exists
- [ ] All `imageFileName` values in `prizes.fixture.json` are correct
- [ ] Product names match your actual product catalog
- [ ] Images are optimized for web (< 200KB each)
- [ ] Tested on desktop and mobile browsers
- [ ] Carousel shows correct images
- [ ] Modal displays correct cover art matching the prize
- [ ] Product names match between carousel and modal
- [ ] Buttons are visible and clickable (transparency not too high)

---

## Next Steps

### Connect to Backend API

Once you're ready to replace the mock API:

**Step 1: Update `mockApi.ts`**
```typescript
// Replace mock play() function
export async function play(): Promise<PlayResult> {
  const res = await fetch('/api/claw/play', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('API error');
  return res.json();
}
```

**Step 2: Ensure backend returns `imageFileName`**
```json
{
  "playId": "play_abc123",
  "prize": {
    "id": "prize_001",
    "name": "Trap Essentials Kit",
    "imageFileName": "drumkit-alpha.webp",
    // ... other fields
  },
  "serverLatencyMs": 45
}
```

**Step 3: Serve images from CDN (optional)**
```typescript
// In ClawMachineV2.tsx, update getHighDefImageUrl()
function getHighDefImageUrl(prizeId: string, prizeName: string): string {
  const prize = prizes.find((p) => p.id === prizeId);

  if (prize?.imageFileName) {
    return `https://cdn.yourstore.com/prizes/${prize.imageFileName}`;
  }

  return 'https://cdn.yourstore.com/prizes/default.webp';
}
```

---

## Summary

✅ **What You Can Do:**
- Add 6 custom WebP drum kit images
- Product names automatically match between carousel and modal
- Keep internal prize IDs as `prize_001`, `prize_002`, etc.
- Use descriptive image file names (e.g., `drumkit-alpha.webp`)

✅ **What's Already Working:**
- Image lookup by `imageFileName` field
- Cover art showcase modal design
- Transparent overlay and buttons
- Fallback to `default.webp` if image not found

✅ **File Locations:**
- Images: `/public/prizes/*.webp`
- Prize data: `/src/features/claw/prizes.fixture.json`
- Types: `/src/features/claw/types.ts` (Prize interface)
- Image logic: `/src/features/claw/ClawMachineV2.tsx` (getHighDefImageUrl)
- Modal: `/src/features/claw/ResultModal.tsx` (cover art showcase)
- Styles: `/src/features/claw/styles.module.css` (transparency adjustments)

---

**Questions?**

Check these files for implementation details:
- Image mapping: [ClawMachineV2.tsx:45-56](src/features/claw/ClawMachineV2.tsx#L45-L56)
- Cover art display: [ResultModal.tsx:162-190](src/features/claw/ResultModal.tsx#L162-L190)
- Styling: [styles.module.css:373-417](src/features/claw/styles.module.css#L373-L417)
- Prize structure: [prizes.fixture.json](src/features/claw/prizes.fixture.json)

**Ready to test!** 🎰
