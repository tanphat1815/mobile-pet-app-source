# Step 10 — Pet Care Actions (Bath + Medicine + Vitamin)

**Priority:** 10
**Effort:** Small (~2 days)
**Depends on:** —
**Visible result:** Medium

---

## 1. Mô tả

### Vấn đề hiện tại
Mobile PetStore / HomeScreen chỉ có 4 action: feed / play / sleep / pet.

Desktop (`src/core/pet-care.js`, `src/core/interaction-actions.js`) có nhiều hơn:
- **Bath** (clean) — giảm `cleanliness`, tăng `happiness`
- **Medicine** — phục hồi `health` khi `sick`
- **Vitamin** — tăng `energy` tạm thời
- **Brush teeth** — bonus `cleanliness`
- **Walk** — bonus `experience`, `exercise`
- **Talk** — bonus `happiness` nhỏ

### Mục tiêu
- Thêm 3 action thiết yếu: Bath / Medicine / Vitamin
- Mỗi action có animation coupling (sang Step 3) + cooldown

---

## 2. Giải pháp

### 2.1 Tham chiếu desktop
- `desktop-pet-app-source/src/core/pet-care.js`
- `desktop-pet-app-source/src/core/interaction-actions.js`

### 2.2 Files mới
- `src/shared/components/PetCareSheet.tsx` — bottom sheet hiển thị care actions

### 2.3 Files sửa
- `src/api/petTypes.ts` — `PetAction` union: thêm `'bath' | 'medicine' | 'vitamin'`. Thêm stats: `cleanliness`, `health`, `energyBoost`
- `src/api/pet.ts` — action mapping backend
- `src/stores/PetStore.ts` — `applyActionLocally` handle care actions
- `src/shared/components/PetActionButton.tsx` — icon cho Bath/Medicine/Vitamin
- `src/screens/HomeScreen.tsx` — action grid 6 thay vì 4; icon từ emoji set 🛁/💊/🌿

### 2.4 Schema
```typescript
export type PetAction =
  | 'feed' | 'play' | 'sleep' | 'pet'
  | 'bath' | 'medicine' | 'vitamin';

export interface PetCareEffects {
  feed:    { hunger: -25; happiness: +5 };
  play:    { happiness: +15; energy: -10 };
  sleep:   { energy: +30; hunger: +5 };
  pet:     { happiness: +3 };
  bath:    { cleanliness: +40; happiness: +5; energy: -2 };
  medicine:{ health: +50 };
  vitamin: { energy: +15; happiness: +5; cooldownHours: 6 };
}
```

### 2.5 Cooldown rules
- Bath: cooldown 8h
- Medicine: chỉ dùng được khi `health < 70`
- Vitamin: cooldown 6h

### 2.6 UI changes
HomeScreen action grid:
```
[🛁 Bath] [🍖 Feed] [⚽ Play] [💤 Sleep]
[💊 Med] [🌿 Vit]  [❤️ Pet]  [📊 Stats]
```

Khi user tap Bath → show animation (`AnimatedPetSprite` step 3 sẽ handle), trừ `cleanliness` dirty effect, áp `cleanliness++`.

---

## 3. Kết quả kỳ vọng

- 7 quick-action buttons ở Home (thêm Bath, Medicine, Vitamin)
- Mỗi action có animation coupling (qua Step 3 FSM)
- Stats mới: cleanliness + health + energyBoost hiển thị ở Home card
- Cooldown timer dưới button khi không dùng được

---

## 4. Testing

### 4.1 Playwright
```typescript
// e2e/step10-care.spec.ts
test('bath action increases cleanliness', async ({ page }) => {
  await page.goto('http://localhost:8081');
  await page.click('[data-testid="action-bath"]');
  // Wait animation + state update
  await page.waitForTimeout(1000);
  const cleanliness = await page.evaluate(() =>
    (window as any).__PET_DEBUG__.stats.cleanliness
  );
  expect(cleanliness).toBeGreaterThan(40);
});

test('medicine unavailable when health > 70', async ({ page }) => {
  await page.evaluate(() => (window as any).__PET_DEBUG__.setHealth(80));
  const btn = page.locator('[data-testid="action-medicine"]');
  expect(await btn.isDisabled()).toBe(true);
});

test('vitamin has cooldown', async ({ page }) => {
  await page.click('[data-testid="action-vitamin"]');
  await page.waitForTimeout(500);
  const btn = page.locator('[data-testid="action-vitamin"]');
  expect(await btn.isDisabled()).toBe(true);
  await page.waitForSelector('[data-testid="cooldown-text"]');
});
```

### 4.2 Live check
- Tap Bath → animation chạy (nếu có Step 3) + stat update
- Tap Medicine khi healthy → button disabled
- Tap Vitamin → cooldown hiển thị

### 4.3 So sánh desktop
Mở `desktop-pet-app-source/src/renderer/home.html`, screenshot action grid → so sánh.

### 4.4 Type check
```bash
npm run typecheck
npm test
```

---

## 5. Debug

### Vấn đề 1: Action rollback khi backend fail
- Optimistic update + rollback nếu API error
- Disable button 1s sau tap để tránh double-tap

### Vấn đề 2: Cooldown tính sai timezone
- Lưu `lastUsedAt` UTC; cooldown so sánh `Date.now() - lastUsedAt`
- Đồng bộ timezone UI vs server

### Vấn đề 3: Animation kết thúc mà stat không update
- Kết hợp `useAnimatedReaction` → gọi `applyActionLocally`
- Verify: animation `onComplete` → dispatch action

### Vấn đề 4: Health không reset sau medicine nếu không đúng effects
- Mapping đúng từ `PetCareEffects`
- Test: `applyActionLocal(state, 'medicine')` → health +50

---

## 6. Definition of Done

- [ ] 3 action mới: Bath / Medicine / Vitamin
- [ ] Stats mới: cleanliness + health + energyBoost
- [ ] Cooldown rules áp dụng
- [ ] Button disabled state khi action không khả dụng
- [ ] Animation coupling (nếu Step 3 đã xong)
- [ ] Playwright e2e pass
- [ ] `npm run typecheck` + `npm test` pass

---

## 7. Reference

- Desktop: `src/core/pet-care.js`, `src/core/interaction-actions.js`, `src/renderer/home.js`
- Mobile: `src/api/pet.ts`, `src/stores/PetStore.ts`, `src/screens/HomeScreen.tsx`, `src/shared/components/PetActionButton.tsx`

---

## 8. Estimated LOC
~150–300 lines:
- PetCareSheet: ~100
- Sửa các file cũ: ~150
- Tests: ~50
