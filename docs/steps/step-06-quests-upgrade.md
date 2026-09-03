# Step 6 — Quests Upgrade (Daily/Weekly Tiers + Reroll + Streak)

**Priority:** 6
**Effort:** Small-Medium (~3–4 days)
**Depends on:** —
**Visible result:** Medium

---

## 1. Mô tả

### Vấn đề hiện tại
Mobile QuestsScreen (`src/screens/QuestsScreen.tsx`):
- 2 tabs: Active / Completed
- Countdown cho active quest
- Claim reward

Desktop (`src/renderer/quests/quests-view.js` + `src/core/quests/quest-config.js`):
- Daily / Weekly / Event tiers
- Streak banner 🔥 với hiệu ứng
- Reroll button (cost coins) + free reroll allowance
- Difficulty chip (Easy / Medium / Hard / Epic)
- Quest category icons

### Mục tiêu
Port daily/weekly tiers, streak banner, reroll logic sang mobile.

---

## 2. Giải pháp

### 2.1 Tham chiếu desktop
- `desktop-pet-app-source/src/core/quests/quest-config.js`
- `desktop-pet-app-source/src/core/quests/quest-manager.js`
- `desktop-pet-app-source/src/core/stats/streak-tracker.js`
- `desktop-pet-app-source/src/renderer/quests/quests-view.js`

### 2.2 Files mới
- `src/shared/components/StreakBanner.tsx` — 🔥 + count + animation
- `src/shared/components/QuestDifficultyChip.tsx` — chip hiển thị difficulty
- `src/api/streakTracker.ts` — streak logic

### 2.3 Files sửa
- `src/api/achievementTypes.ts` — split `Quest` thành `DailyQuest`, `WeeklyQuest`, `EventQuest`. Thêm `difficulty`, `rerollCost`, `freeRerollsLeft`, `streakBonus`
- `src/screens/QuestsScreen.tsx` — tier tabs (Daily/Weekly/Event), streak banner header, reroll button trong Daily section
- `src/shared/components/QuestRow.tsx` — difficulty chip + reroll button

### 2.4 Schema
```typescript
export type QuestDifficulty = 'easy' | 'medium' | 'hard' | 'epic';
export type QuestTier = 'daily' | 'weekly' | 'event';

export interface Quest {
  id: string;
  tier: QuestTier;
  difficulty: QuestDifficulty;
  title: string;
  description: string;
  goal: number;
  progress: number;
  reward: { coins: number; xp: number; items?: string[] };
  rerollCost: number;
  freeRerollsLeft: number;
  expiresAt: string;
  status: 'active' | 'completed' | 'claimed' | 'expired';
}

export interface Streak {
  current: number;
  longest: number;
  lastClaimedAt: string;
  bonusMultiplier: number;
}
```

### 2.5 UI Layout
```
+-- Quests ---------------------+
| 🔥 Streak: 12 days (×1.5 XP)  |
+-------------------------------+
| [ Daily | Weekly | Event ]    |
+-------------------------------+
| Daily Quests (3)        [Reroll 10 🪙]
| ┌──────────────────────────┐  |
| │ Easy   Feed Pet 5 times  │  |
| │ ████░░░░ 3/5         50 XP│  |
| └──────────────────────────┘  |
| ┌──────────────────────────┐  |
| │ Hard   Earn 100 coins    │  |
| │ ██░░░░░░ 20/100      200 XP│  |
| └──────────────────────────┘  |
+-------------------------------+
```

---

## 3. Kết quả kỳ vọng

- QuestsScreen có tier tabs: Daily / Weekly / Event
- Streak banner đầu trang với 🔥 animation + bonus multiplier
- Reroll button cho Daily (cost coins, có free reroll miễn phí 1 lần/ngày)
- Difficulty chip màu (Easy=green, Medium=yellow, Hard=orange, Epic=purple)
- Claim reward + apply streak bonus XP

---

## 4. Testing

### 4.1 Playwright
```typescript
// e2e/step6-quests.spec.ts
test('streak banner shows current streak', async ({ page }) => {
  await page.goto('http://localhost:8081');
  await page.click('[data-testid="tab-quests"]');
  await page.waitForSelector('[data-testid="streak-banner"]');
  const text = await page.textContent('[data-testid="streak-banner"]');
  expect(text).toMatch(/🔥\s*\d+\s*day/);
});

test('can reroll daily quest', async ({ page }) => {
  await page.click('[data-testid="tier-daily"]');
  const rerollBtn = page.locator('[data-testid="reroll-btn"]').first();
  await rerollBtn.click();
  await page.click('[data-testid="confirm-reroll"]');
  await page.waitForSelector('[data-testid="toast-quest-rerolled"]');
});

test('weekly tab shows weekly quests', async ({ page }) => {
  await page.click('[data-testid="tier-weekly"]');
  await page.waitForSelector('[data-testid="quest-row-weekly"]');
});
```

### 4.2 Live check
- Streak banner hiển thị đúng số ngày
- Switch tier tabs → quest list thay đổi
- Reroll → confirm modal → toast → quest đổi

### 4.3 So sánh desktop
Mở `desktop-pet-app-source/src/renderer/quests/quests-view.html`, screenshot → compare với mobile.

### 4.4 Type check + tests
```bash
npm run typecheck
npm test
```

---

## 5. Debug

### Vấn đề 1: Streak reset sai
- Check timezone: `streak.lastClaimedAt` UTC vs local
- Logic: nếu today - lastClaimedAt > 1 day → reset
- Nếu today - lastClaimedAt == 1 day → tăng
- Edge case: cuối ngày → reset, đầu ngày mới (00:00 local)

### Vấn đề 2: Reroll không trừ coin
- Optimistic: trừ coin trước, gọi API, rollback nếu fail
- Verify: `wallet.coins` field cập nhật + server persist

### Vấn đề 3: Difficulty chip không khớp màu
- Map: Easy `theme.success`, Medium `theme.warning`, Hard `theme.danger`, Epic `theme.info`
- Check theme import đúng

### Vấn đề 4: Countdown timer không tick
- Dùng `setInterval` 1s cleanup trong `useEffect`
- Format: `Math.floor(seconds/3600)h {Math.floor((seconds%3600)/60)}m`

---

## 6. Definition of Done

- [ ] Tier tabs (Daily / Weekly / Event)
- [ ] Streak banner với 🔥 + multiplier
- [ ] Reroll button với cost + free allowance
- [ ] Difficulty chip (4 levels)
- [ ] Claim reward áp dụng streak bonus
- [ ] Playwright e2e pass
- [ ] `npm run typecheck` + `npm test` pass

---

## 7. Reference

- Desktop: `src/core/quests/quest-config.js`, `src/core/quests/quest-manager.js`, `src/core/stats/streak-tracker.js`, `src/renderer/quests/quests-view.js`
- Mobile: `src/screens/QuestsScreen.tsx`, `src/shared/components/QuestRow.tsx`, `src/api/achievementTypes.ts`

---

## 8. Estimated LOC
~300–500 lines:
- 2 components mới: ~150
- 1 API mới: ~50
- Sửa các file cũ: ~200
