# Step 3 — Animated Pet Sprite (FSM + Multi-species)

**Priority:** 3
**Effort:** Large (~1–2 weeks)
**Depends on:** Step 1 (theme tokens)
**Visible result:** ✅ Highest impact (transforms product from "emoji + settings" → "real pet companion")

---

## 1. Mô tả

### Vấn đề hiện tại
Mobile pet hiển thị qua `src/shared/components/PetAvatar.tsx`:
- Emoji đơn (`🐱` / `🐶` / `🦊` / `🐼` / `🐰` / `🐲` / `🦆`)
- Mood ring border + wobble animation
- Không có trạng thái chuyển động (idle/walk/sleep/dance/cry/...)

Desktop có full sprite system (`src/core/sprite-config.js`, `src/core/pet-engine.js`, `src/core/pet-ai.js`):
- 16+ animations: idle / walk / sleep / sit / dance / shocked / cry / box_idle / box_play / jump / happy / excited / hurt / eat / drink / wave
- Multi-species: cat, dog, fox, duck, dragon, panda, rabbit
- FSM-driven: state → animation key
- Sprite sheet từ `assets/species/<id>/<anim>.png`

### Mục tiêu
Build animated pet sprite cho mobile:
- Component `AnimatedPetSprite.tsx` thay thế emoji PetAvatar
- Sprite sheet renderer dùng `react-native-skia` (recommended) hoặc `Lottie`
- FSM driver với Reanimated: state → anim key → frame index
- Multi-species (tối thiểu: cat, dog, fox, dragon, rabbit)
- Mood → animation coupling: hungry → cry, tired → sleep, happy → dance

---

## 2. Giải pháp

### 2.1 Tham chiếu desktop
- `desktop-pet-app-source/src/core/sprite-config.js`
- `desktop-pet-app-source/src/core/pet-engine.js`
- `desktop-pet-app-source/src/core/pet-ai.js`
- `desktop-pet-app-source/src/renderer/pet-mount.js`
- Asset folder: `desktop-pet-app-source/assets/sprites/`

### 2.2 Tech stack
- **Renderer:** `react-native-skia` (canvas-based, performant) — hoặc `Lottie` nếu có file `.lottie`
- **Animation driver:** Reanimated 4 worklets (đã có sẵn)
- **State:** derive từ `PetStore` (mood, energy, hunger, happiness)

### 2.3 Files mới
- `src/shared/components/AnimatedPetSprite.tsx` — main component
- `src/api/spriteConfig.ts` — animation manifest (port từ `sprite-config.js`)
- `src/api/petFSM.ts` — FSM logic (state → anim key)
- `src/utils/spriteSheet.ts` — sprite sheet parser

### 2.4 Files sửa
- `src/shared/components/PetAvatar.tsx` — refactor thành wrapper gọi `AnimatedPetSprite`
- `src/stores/PetStore.ts` — expose `mood`, `energy` etc. cho sprite driver
- `src/screens/HomeScreen.tsx` — dùng sprite thay emoji
- `app.json` — bundle sprite assets (đặt trong `assets/sprites/`)
- `assets/sprites/manifest.json` — khai báo sprite sheet URL/grid

### 2.5 Sprite manifest schema
```json
{
  "species": {
    "cat": {
      "frameWidth": 64,
      "frameHeight": 64,
      "animations": {
        "idle": { "row": 0, "frames": 8, "fps": 8 },
        "walk": { "row": 1, "frames": 8, "fps": 12 },
        "sleep": { "row": 2, "frames": 4, "fps": 4 },
        "sit": { "row": 3, "frames": 4, "fps": 6 },
        "dance": { "row": 4, "frames": 8, "fps": 12 },
        "shocked": { "row": 5, "frames": 2, "fps": 4 },
        "cry": { "row": 6, "frames": 4, "fps": 6 },
        "box_idle": { "row": 7, "frames": 4, "fps": 6 },
        "box_play": { "row": 8, "frames": 8, "fps": 12 },
        "jump": { "row": 9, "frames": 6, "fps": 10 },
        "happy": { "row": 10, "frames": 6, "fps": 10 },
        "excited": { "row": 11, "frames": 8, "fps": 12 },
        "hurt": { "row": 12, "frames": 4, "fps": 6 },
        "eat": { "row": 13, "frames": 6, "fps": 8 },
        "drink": { "row": 14, "frames": 6, "fps": 8 },
        "wave": { "row": 15, "frames": 6, "fps": 8 }
      },
      "atlas": "cat.png"
    }
  }
}
```

### 2.6 FSM Logic (`petFSM.ts`)
```typescript
import { PetState } from './petTypes';

export type SpriteAnimKey =
  | 'idle' | 'walk' | 'sleep' | 'sit' | 'dance'
  | 'shocked' | 'cry' | 'box_idle' | 'box_play'
  | 'jump' | 'happy' | 'excited' | 'hurt'
  | 'eat' | 'drink' | 'wave';

export function resolveAnimation(state: PetState, mood: PetMood): SpriteAnimKey {
  if (state.action === 'sleep') return 'sleep';
  if (state.action === 'feed') return 'eat';
  if (state.action === 'play') return 'box_play';
  if (state.action === 'pet') return 'happy';
  if (state.energy < 20) return 'sleep';
  if (state.hunger > 80) return 'cry';
  if (state.happiness < 30) return 'sit';
  if (mood === 'ecstatic') return 'dance';
  if (mood === 'excited') return 'excited';
  if (mood === 'shocked') return 'shocked';
  return 'idle';
}
```

---

## 3. Kết quả kỳ vọng

- Home screen hiển thị pet sprite động (8–16 frames tùy animation)
- Pet phản ứng với action: feed → eat animation, play → box_play, sleep → sleep
- Mood hiển thị qua animation coupling: tired → sleep, hungry → cry, ecstatic → dance
- Multi-species: user chọn species ở onboarding/profile → sprite render đúng
- Performance: stable 60fps trên Expo Go (test với `react-native-skia`)

---

## 4. Testing

### 4.1 Visual regression
```bash
npm run web
# Mở browser, kiểm tra:
# 1. Idle animation loop
# 2. Switch state từ PetStore (click action)
# 3. Sprite đổi theo mood
```

### 4.2 Playwright
```typescript
// e2e/step3-sprite.spec.ts
test('pet sprite renders idle animation on home', async ({ page }) => {
  await page.goto('http://localhost:8081');
  await page.waitForSelector('[data-testid="pet-sprite"]');
  // Wait 1s cho animation tick
  await page.waitForTimeout(1000);
  const frame1 = await page.screenshot({ clip: { x: 0, y: 0, width: 200, height: 200 } });
  await page.waitForTimeout(200);
  const frame2 = await page.screenshot({ clip: { x: 0, y: 0, width: 200, height: 200 } });
  // Frames phải khác nhau (animation đang chạy)
  expect(frame1).not.toEqual(frame2);
});

test('feed action triggers eat animation', async ({ page }) => {
  await page.goto('http://localhost:8081');
  await page.click('[data-testid="action-feed"]');
  await page.waitForTimeout(500);
  const animKey = await page.evaluate(() =>
    (window as any).__PET_FSM_DEBUG__.currentAnim
  );
  expect(animKey).toBe('eat');
});
```

### 4.3 Performance test
```typescript
test('sprite maintains 60fps', async ({ page }) => {
  await page.goto('http://localhost:8081');
  const fps = await page.evaluate(async () => {
    let frames = 0;
    const start = performance.now();
    return new Promise<number>((resolve) => {
      function tick() {
        frames++;
        if (performance.now() - start > 2000) resolve((frames / 2));
        else requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  });
  expect(fps).toBeGreaterThan(55);
});
```

### 4.4 So sánh với desktop
Mở `desktop-pet-app-source/src/renderer/pet-mount.js` ở browser, screenshot pet cat ở các state → so với mobile.

### 4.5 Type check
```bash
npm run typecheck
```

---

## 5. Debug

### Vấn đề 1: Sprite sheet không load
- Check `assets/sprites/manifest.json` path đúng
- `require()` sprite phải là static (không dynamic key)
- Verify: `npx expo doctor`

### Vấn đề 2: Animation giật / skip frame
- `useSharedValue` state drift → reset `frameIndex.value = 0` khi đổi anim
- Kiểm tra `withTiming` vs `withRepeat`

### Vấn đề 3: Skia crash trên Android
- Wrap trong try/catch; fallback về emoji avatar (PetAvatar cũ)
- Test trên Android emulator API 30+

### Vấn đề 4: Sprite render sai kích thước
- `frameWidth`/`frameHeight` trong manifest không khớp atlas
- Verify: `assets/sprites/cat.png` thực tế là 64×N×64

### Vấn đề 5: Action không trigger animation
- FSM resolve sai: debug `resolveAnimation` với `console.log(state, mood)`
- Kiểm tra PetStore expose đúng state fields

---

## 6. Definition of Done

- [ ] `AnimatedPetSprite` component render đúng multi-species
- [ ] 16 animations implement cho mỗi species
- [ ] FSM couples state → animation đúng
- [ ] Performance ≥ 55fps trên Expo Go
- [ ] Action buttons trigger animation tương ứng
- [ ] Asset bundle < 5MB (compressed sprite sheets)
- [ ] Playwright e2e pass (animation + action coupling + perf)
- [ ] Screenshot match desktop pet mount
- [ ] `npm run typecheck` pass

---

## 7. Reference

- Desktop: `src/core/sprite-config.js`, `src/core/pet-engine.js`, `src/core/pet-ai.js`, `src/renderer/pet-mount.js`, `assets/sprites/`
- Mobile: `src/shared/components/PetAvatar.tsx`, `src/screens/HomeScreen.tsx`, `src/stores/PetStore.ts`

---

## 8. Estimated LOC
~700–1200 lines mới:
- `AnimatedPetSprite.tsx`: ~300
- `spriteConfig.ts`: ~200
- `petFSM.ts`: ~150
- `spriteSheet.ts`: ~100
- Sửa các file cũ: ~150
- Asset: sprite sheets PNG ~3–5MB
