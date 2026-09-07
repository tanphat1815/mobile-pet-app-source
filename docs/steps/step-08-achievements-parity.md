# Step 8 — Achievements Parity (More Categories + Unlock Toast)

**Priority:** 8
**Effort:** Small (~2–3 days)
**Depends on:** —
**Visible result:** Medium

---

## 1. Mô tả

### Vấn đề hiện tại
Mobile AchievementsScreen:
- 5 categories: Care / Social / Explore / Collect / Special
- Tier: bronze → platinum
- Progress bar + pop animation

Desktop (8 categories × 5 rarities, 60+ badges):
- Categories: progression, care, social, gameplay, exploration, collection, special, **hidden**
- Rarities: common / uncommon / rare / epic / legendary
- **Toast overlay** khi unlock achievement (slide down from top)
- **Share button** (twitter/FB) sau unlock

### Mục tiêu
- Align categories với desktop (8 bao gồm hidden)
- Add rarity enum
- Toast unlock animation, trigger từ realtime `achievement:unlocked` event

---

## 2. Giải pháp

### 2.1 Tham chiếu desktop
- `desktop-pet-app-source/src/core/achievements/achievement-config.js`
- `desktop-pet-app-source/src/core/achievements/achievement-manager.js`
- `desktop-pet-app-source/src/renderer/achievements/achievements-view.js`

### 2.2 Files mới
- `src/shared/components/AchievementToast.tsx` — slide-down toast
- `src/shared/components/AchievementShareSheet.tsx` — share options

### 2.3 Files sửa
- `src/api/achievementTypes.ts` — thêm categories `progression` / `gameplay` / `hidden` + `rarity` enum (5 mức)
- `src/screens/AchievementsScreen.tsx` — categories 8, rarity filter chips
- `src/stores/AchievementStore.ts` — `applyRealtimeUpdate` → fire toast
- `src/shared/components/AchievementCard.tsx` — hiển thị rarity màu

### 2.4 Schema
```typescript
export type AchievementCategory =
  | 'progression' | 'care' | 'social' | 'gameplay'
  | 'exploration' | 'collection' | 'special' | 'hidden';

export type AchievementRarity =
  | 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  title: string;
  description: string;
  iconEmoji: string;
  goal: number;
  progress: number;
  unlockedAt?: string;
  isHidden?: boolean;
  reward?: { coins?: number; xp?: number; items?: string[] };
}
```

### 2.5 Toast component
- Use `Modal` với `transparent={true}` + slide animation từ top
- Tự động dismiss sau 4s
- Tap toast → navigate tới AchievementsScreen + scroll to achievement
- Container `zIndex: 9999`, `position: 'absolute'`, `top: insets.top + 8`

### 2.6 Trigger
Trong `AchievementStore.applyRealtimeUpdate`:
```typescript
if (update.kind === 'unlocked') {
  set((state) => ({ unlockedQueue: [...state.unlockedQueue, update.achievement] }));
}
```

`AchievementToastHost` (root component):
- Subscribe `AchievementStore.unlockedQueue`
- Pop highest-priority achievement, render `<AchievementToast>`, auto-dismiss
- Sau dismiss → shift queue

### 2.7 Rarity colors (CSS)
```typescript
export const RARITY_COLORS = {
  common: '#989EA8',     // gray
  uncommon: '#34C759',  // green
  rare: '#007AFF',       // blue
  epic: '#B388FF',       // purple
  legendary: '#FFD700',  // gold
};
```

---

## 3. Kết quả kỳ vọng

- AchievementsScreen có 8 category chips
- Rarity filter chips (All / Common / Uncommon / Rare / Epic / Legendary)
- Toast popup slide-down từ top khi unlock achievement mới
- Tap toast → jump tới achievement trong list
- Achievements share button (Twitter, FB, copy link)

---

## 4. Testing

### 4.1 Playwright
```typescript
// e2e/step8-achievements.spec.ts
test('achievement unlock shows toast', async ({ page }) => {
  await page.goto('http://localhost:8081');
  // Mock realtime event
  await page.evaluate(() => (window as any).__MOCK_WS__.emit('achievement:unlocked', {
    id: 'a1', category: 'care', rarity: 'rare', title: 'First Bath', iconEmoji: '🛁',
  }));
  await page.waitForSelector('[data-testid="achievement-toast"]');
  const text = await page.textContent('[data-testid="achievement-toast"]');
  expect(text).toContain('First Bath');
});

test('rarity color matches', async ({ page }) => {
  await page.click('[data-testid="tab-achievements"]');
  await page.click('[data-testid="rarity-filter-legendary"]');
  const card = page.locator('[data-testid="achievement-card-legendary"]').first();
  const border = await card.evaluate((el) => getComputedStyle(el).borderColor);
  expect(border).toBe('rgb(255, 215, 0)');
});
```

### 4.2 Live check
- Unlock achievement thật (qua action) → toast xuất hiện
- Tap toast → list scroll tới achievement
- Rarity filter: chỉ hiển thị đúng tier

### 4.3 So sánh desktop
Mở `desktop-pet-app-source/src/renderer/achievements/achievements-view.html`, screenshot → so sánh.

### 4.4 Type check + tests
```bash
npm run typecheck
npm test
```

---

## 5. Debug

### Vấn đề 1: Toast không slide, hiển thị ngay
- Wrap trong `Animated.View` với `useSharedValue` + `withTiming`
- Mount: `withTiming(1, { duration: 250 })`; Dismiss: `withTiming(0, { duration: 200 })`

### Vấn đề 2: Nhiều achievement unlock cùng lúc → spam toast
- Queue + chỉ show 1 tại 1 thời điểm, sleep 200ms giữa các toast
- Max 5 toast/giờ (cooldown)

### Vấn đề 3: Hidden achievement hiển thị → spoil
- Render placeholder: "???" + locked icon
- Sau unlock → mới hiện title + icon

### Vấn đề 4: Rarity color không hiển thị trên dark mode
- Dùng token `RARITY_COLORS` (constant), không phụ thuộc theme

---

## 6. Definition of Done

- [ ] 8 categories trong AchievementStore (bao gồm hidden)
- [ ] 5 rarity enum + rarity filter chips
- [ ] Toast slide-down animation khi unlock
- [ ] Tap toast → navigate + scroll
- [ ] Share button với Twitter/FB/copy link
- [ ] Hidden achievements ẩn đúng
- [ ] Playwright e2e pass
- [ ] `npm run typecheck` + `npm test` pass

---

## 7. Reference

- Desktop: `src/core/achievements/achievement-config.js`, `achievement-manager.js`, `src/renderer/achievements/achievements-view.js`
- Mobile: `src/screens/AchievementsScreen.tsx`, `src/shared/components/AchievementCard.tsx`, `src/stores/AchievementStore.ts`

---

## 8. Estimated LOC
~250–400 lines:
- 2 components mới: ~150
- Sửa các file cũ: ~200
