# Step 12c — Adventure (Locations + Encounters + Loot)

**Priority:** 12c
**Effort:** Large (~2 weeks)
**Depends on:** Step 3 (animated pet sprite for adventure mode)
**Visible result:** ✅ High

---

## 1. Mô tả

### Vấn đề hiện tại
Mobile chưa có adventure feature.

Desktop (`src/core/adventure/adventure-manager.js`, `src/core/adventure/locations.js`, `src/main/adventure-window.js`, `src/renderer/adventure.html`, `src/renderer/adventure.js`):
- **Adventure window** (3rd top-level window với pet AI loop)
- **Locations** (5 vùng: Park / Beach / Forest / Mountain / Crystal Cave)
- **Level-gated** locations (Forest Lv5+, Mountain Lv10+, ...)
- **Weather-dependent** (Raining → different encounters)
- **Timer** (mỗi session 30–60 min)
- **Encounters** (random events: Treasure / NPC / Trap)
- **Loot** (coins, items, XP, badges)
- **Scenery** background per location

### Mục tiêu
Port adventure sang mobile dưới dạng 1 modal screen:
- Location picker
- Adventure loop với timer + progress
- Encounter minigame overlays
- Loot modal sau session

---

## 2. Giải pháp

### 2.1 Tham chiếu desktop
- `desktop-pet-app-source/src/core/adventure/adventure-manager.js`
- `desktop-pet-app-source/src/core/adventure/locations.js`
- `desktop-pet-app-source/src/main/adventure-window.js`
- `desktop-pet-app-source/src/renderer/adventure.html`
- `desktop-pet-app-source/src/renderer/adventure.js`

### 2.2 Files mới
- `src/screens/adventure/AdventureHomeScreen.tsx` — location picker
- `src/screens/adventure/AdventureRunScreen.tsx` — active session
- `src/screens/adventure/LootModal.tsx` — reward screen
- `src/screens/adventure/EncounterModal.tsx` — random event handler
- `src/api/adventure.ts` — start/stop session, location config
- `src/api/adventureLocations.ts` — port locations.js
- `src/api/adventureEncounters.ts` — encounter types
- `src/stores/AdventureStore.ts` — current session state
- `src/shared/components/SceneryBackground.tsx` — layered SVG/CSS scene per location

### 2.3 Files sửa
- `src/navigation/AppNavigator.tsx` — adventure stack
- `src/screens/HomeScreen.tsx` — "Adventure" card
- `src/stores/PetStore.ts` — accumulate XP / items from adventure
- `src/api/achievementTypes.ts` — adventure achievements "First Adventure", "Cave Explorer"

### 2.4 Schema
```typescript
export type AdventureLocation = 'park' | 'beach' | 'forest' | 'mountain' | 'crystal_cave';

export interface LocationDef {
  id: AdventureLocation;
  name: string;
  description: string;
  minLevel: number;
  weatherDependent: boolean;
  possibleEncounters: string[];
  scenery: {
    skyColor: string;
    groundColor: string;
    elementsEmoji: string[];
  };
}

export interface AdventureSession {
  id: string;
  userId: string;
  petId: string;
  location: AdventureLocation;
  startedAt: string;
  durationSec: number;
  events: AdventureEvent[];
  loot: AdventureLoot;
  status: 'active' | 'completed' | 'abandoned';
}

export type AdventureEvent =
  | { kind: 'encounter'; encounterType: 'treasure' | 'npc' | 'trap' | 'item'; payload: Record<string, unknown>; atSec: number }
  | { kind: 'weather_change'; weather: 'sunny' | 'rainy' | 'foggy'; atSec: number };

export interface AdventureLoot {
  coins: number;
  xp: number;
  items: { id: string; quantity: number }[];
  badges?: string[];
}
```

### 2.5 UI flow
```
AdventureHomeScreen
  → Pick location (locked if < minLevel)
  → Set duration (30 / 45 / 60 min)
  → Start → AdventureRunScreen

AdventureRunScreen
  - Background scenery animated
  - Pet sprite (Step 3) walking/looking around
  - Timer countdown
  - Progress bar (% of duration)
  - Encounter popups (Treasure / NPC / Trap) random mỗi 2-5 min
  - Stop button

After timer reaches 0
  → Loot modal với rewards + Add to PetStore
```

### 2.6 Encounter types
- **Treasure chest:** tap to open → coins/items
- **NPC friend:** chat dialog với random NPC → bonus XP
- **Trap:** mini-avoid game (tap to dodge)
- **Item pickup:** random item (food, gift)

### 2.7 Scenery
- Use SVG layers (sky, ground, mountains, trees) hoặc CSS gradient + emoji
- Animated: clouds drift, leaves fall, water shimmer
- Weather changes: rain drops overlay, fog opacity up

---

## 3. Kết quả kỳ vọng

- AdventureHomeScreen với 5 locations gated by pet level
- AdventureRunScreen với scenery + pet + timer
- Encounter popups (treasure/NPC/trap) random trong session
- Loot modal sau session → apply to PetStore
- Weather effects (sunny/rainy/foggy)
- Achievement "First Adventure", "Cave Explorer"

---

## 4. Testing

### 4.1 Playwright
```typescript
// e2e/step12c-adventure.spec.ts
test('can start adventure', async ({ page }) => {
  await page.goto('http://localhost:8081');
  await page.click('[data-testid="card-adventure"]');
  await page.click('[data-testid="location-park"]');
  await page.click('[data-testid="duration-30min"]');
  await page.click('[data-testid="start-adventure"]');
  await page.waitForSelector('[data-testid="adventure-run"]');
});

test('locked location requires level', async ({ page }) => {
  await page.evaluate(() => (window as any).__PET_DEBUG__.setLevel(3));
  await page.click('[data-testid="card-adventure"]');
  const locked = page.locator('[data-testid="location-mountain"]');
  expect(await locked.getAttribute('data-locked')).toBe('true');
});

test('encounter triggers', async ({ page }) => {
  // Fast-forward timer 5 minutes
  await page.evaluate(() => (window as any).__ADV_DEBUG__.fastForward(300));
  await page.waitForSelector('[data-testid="encounter-modal"]', { timeout: 30000 });
});

test('loot applies after session', async ({ page }) => {
  // ... complete session
  await page.waitForSelector('[data-testid="loot-modal"]');
  await page.click('[data-testid="claim-loot"]');
  const coins = await page.evaluate(() => (window as any).__PET_DEBUG__.stats.coins);
  expect(coins).toBeGreaterThan(0);
});
```

### 4.2 Live check
- Pick location → start → timer countdown
- Encounter popup → handle → progress
- Complete session → loot modal
- Apply loot → stats update

### 4.3 So sánh desktop
Mở `desktop-pet-app-source/src/renderer/adventure.html` → so sánh layout.

### 4.4 Type check
```bash
npm run typecheck
npm test
```

---

## 5. Debug

### Vấn đề 1: Timer drift
- Use `Date.now()` so sánh với `startedAt + durationSec * 1000`
- Tránh `setInterval` accumulation

### Vấn đề 2: Background suspension khi user tắt màn hình
- Background timer: `expo-background-fetch` + local notification khi complete
- Foreground only first version

### Vấn đề 3: Weather không sync với thực tế
- Use random hoặc fixed cho MVP
- Step 2 (real-time) → fetch from weather API

### Vấn đề 4: Encounter quá thưa hoặc spam
- Tweak probability: 1 encounter mỗi 5 min avg
- Configurable trong `adventure-config`

### Vấn đề 5: Pet sprite không loop walk
- Step 3 FSM: adventure mode → state='walk' all the time
- Tick `useEffect` chuyển state

---

## 6. Definition of Done

- [ ] AdventureHomeScreen với 5 locations
- [ ] Level-gating UI
- [ ] AdventureRunScreen với timer + scenery + pet
- [ ] 4 encounter types implemented (treasure/NPC/trap/item)
- [ ] Loot modal + apply to PetStore
- [ ] Weather effects (sunny/rainy/foggy)
- [ ] Adventure achievements (≥ 2)
- [ ] Playwright e2e pass
- [ ] `npm run typecheck` + `npm test` pass

---

## 7. Reference

- Desktop: `src/core/adventure/adventure-manager.js`, `locations.js`, `src/main/adventure-window.js`, `src/renderer/adventure.*`
- Mobile: `src/screens/HomeScreen.tsx`, `src/stores/PetStore.ts`, `src/api/achievementTypes.ts`

---

## 8. Estimated LOC
~1200–2000 lines:
- 4 screens/modals: ~600
- AdventureStore + api: ~300
- SceneryBackground: ~200
- Encounter types: ~400
- Tests: ~200
