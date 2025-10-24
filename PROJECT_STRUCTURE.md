# 📁 Project Structure

## Overview
```
TheClaw/
├── 📄 README.md                    # Main documentation (you are here!)
├── 📄 QUICK_SETUP.md              # 5-minute setup guide
├── 📄 REDESIGN_V2.md              # Technical architecture docs
├── 📄 package.json                # Dependencies
├── 📄 vite.config.ts              # Build configuration
├── 📄 tsconfig.json               # TypeScript config
│
├── 📂 src/
│   ├── 📄 App.tsx                 # Main app component
│   ├── 📄 main.tsx                # Entry point
│   │
│   ├── 📂 components/
│   │   ├── 🎨 CircularGallery.tsx      # 3D WebGL carousel (OGL-based)
│   │   └── 🎨 CircularGallery.css      # Carousel styles
│   │
│   └── 📂 features/claw/
│       ├── 📄 index.ts                  # Public API exports
│       │
│       ├── 🎯 ClawMachineV2.tsx         # ⭐ MAIN COMPONENT (start here!)
│       ├── 🎁 prizes.fixture.json       # ⭐ PRIZE DEFINITIONS (edit this!)
│       ├── 🔧 mockApi.ts                # ⭐ API LOGIC (swap for real backend)
│       │
│       ├── 📊 types.ts                  # TypeScript interfaces
│       ├── 🎮 useClawState.ts          # State machine hook
│       ├── 📐 utils.carousel.ts        # Geometry calculations
│       │
│       ├── 🧩 ResultModal.tsx          # Prize reveal modal
│       ├── 🎨 styles.module.css        # All component styles
│       │
│       ├── 📖 README_claw.md           # Original V1 docs
│       └── 📖 context.md               # Original design context
│
└── 📂 public/                      # Static assets (add images here)
```

---

## 🎯 Key Files for Customization

### 1️⃣ **Must Edit** (Core Customization)

| File | What to Change | Why |
|------|----------------|-----|
| `prizes.fixture.json` | Prize names, weights, types | Define what users can win |
| `ClawMachineV2.tsx` (lines 42-58) | Image URLs | Replace placeholder images |
| `mockApi.ts` (lines 54, 82) | API endpoints | Connect to real backend |

### 2️⃣ **Optional Edit** (Visual Tweaks)

| File | What to Change | Why |
|------|----------------|-----|
| `ClawMachineV2.tsx` (line 135) | Carousel bend | Adjust 3D curve strength |
| `ClawMachineV2.tsx` (line 85) | Spin duration | Make spin faster/slower |
| `CircularGallery.tsx` (line 298) | Idle scroll speed | Adjust drift speed |
| `styles.module.css` | Colors, fonts, sizing | Match your brand |

### 3️⃣ **Advanced** (Don't Touch Unless Needed)

| File | Purpose | When to Edit |
|------|---------|--------------|
| `CircularGallery.tsx` | WebGL rendering engine | Advanced 3D effects |
| `useClawState.ts` | State machine logic | Custom game flow |
| `utils.carousel.ts` | Geometry math | Different carousel layout |
| `types.ts` | TypeScript definitions | Add new reward types |

---

## 🔄 Data Flow

```
User clicks GO!
    ↓
ClawMachineV2.tsx
    ├─→ mockApi.play() ────────────────→ Returns random prize
    │                                      (based on weights)
    ↓
CircularGallery.tsx
    └─→ spinToIndex() ────────────────→ Spins 3 laps + lands on prize
                                         (3 seconds animation)
    ↓
Prize revealed
    ↓
ResultModal.tsx
    ├─→ Shows prize details
    └─→ User clicks CTA button
            ↓
        mockApi.claim() ───────────────→ Applies reward
            ├─→ loyalty_points: localStorage.pointsBalance++
            ├─→ discount_*: Generate code, copy to clipboard
            └─→ free_product: localStorage.library.push()
```

---

## 🎨 Component Hierarchy

```
<App>
  └─ <ClawMachineV2>                      (Main container)
       ├─ <CircularGallery>               (3D carousel)
       │    └─ <Canvas> (WebGL)
       │         └─ Prize cards (rendered via OGL)
       │
       ├─ <button>GO!</button>            (Trigger button)
       │
       └─ <ResultModal>                   (Prize reveal)
            ├─ Prize details
            └─ CTA button (claim reward)
```

---

## 📦 Dependencies

```json
{
  "react": "^18.2.0",        // UI framework
  "react-dom": "^18.2.0",
  "typescript": "^5.3.0",    // Type safety
  "vite": "^5.0.0",          // Build tool
  "ogl": "^0.0.47"           // WebGL library (3D carousel)
}
```

**Total size**: ~50KB gzipped (production build)

---

## 🚀 Build Process

```bash
npm run dev     # Development (hot reload)
npm run build   # Production build → dist/
npm run preview # Test production build locally
```

**Output**:
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js    # ~45KB (gzipped)
│   └── index-[hash].css   # ~5KB (gzipped)
└── vite.svg
```

---

## 🔍 Where to Find Things

### "I want to change the prize images"
→ `src/features/claw/ClawMachineV2.tsx` (line 42)

### "I want to adjust drop rates"
→ `src/features/claw/prizes.fixture.json` (edit `weight` values)

### "I want to change button colors"
→ `src/features/claw/styles.module.css` (search for `.buttonPlay`)

### "I want to connect to my backend"
→ `src/features/claw/mockApi.ts` (replace `play()` and `claim()` functions)

### "I want to add a new reward type"
→ 1. `types.ts` (add to `RewardType` enum)
→ 2. `ResultModal.tsx` (add to `CTA_MAP`)
→ 3. `mockApi.ts` (add case in `claim()` switch)

### "I want to change animation speed"
→ `src/features/claw/ClawMachineV2.tsx` (line 85: `spinDuration`)

### "I want to make carousel curve differently"
→ `src/features/claw/ClawMachineV2.tsx` (line 135: `bend` prop)

---

## 📊 File Sizes

| File | Lines | Purpose | Edit? |
|------|-------|---------|-------|
| CircularGallery.tsx | 495 | 3D carousel engine | ⚠️ Advanced |
| ClawMachineV2.tsx | 170 | Main logic | ✅ Yes (images, timing) |
| mockApi.ts | 140 | API simulation | ✅ Yes (backend swap) |
| prizes.fixture.json | 195 | Prize definitions | ✅ Yes (prizes, weights) |
| ResultModal.tsx | 265 | Reward reveal UI | ⚠️ Advanced |
| styles.module.css | 385 | All styles | ✅ Yes (colors, fonts) |

---

## 🎓 Learning Path

1. **Beginner**: Edit `prizes.fixture.json` and image URLs
2. **Intermediate**: Adjust timing, colors, and API integration
3. **Advanced**: Modify carousel rendering and state machine

Start with QUICK_SETUP.md → then README.md → then dive into code!

---

**Last Updated**: 2025-10-23
