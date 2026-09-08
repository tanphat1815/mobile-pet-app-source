# Step 14 — Global Quick Switcher (Search-first GP4)

**Priority:** 14
**Effort:** Medium (~1 tuần)
**Depends on:** Step 13 (Admin guard pattern) for `__DEV__` shortcut discoverability
**Visible result:** ✅ Highest (every user benefits on first launch)

---

## 1. Mô tả

### Vấn đề hiện tại

App hiện có **28 screens trong `MainStack`** (`navigation/types.ts:18-48`) nhưng:
- **Không có bottom tab bar** — toàn bộ navigation qua push (`Home → tap card → SubScreen`)
- Muốn tới `MeditationScreen` phải: `Home → Wellness card → WellnessHome → Meditation` (3 taps, mất ngữ cảnh)
- **Search phân mảnh**:
  - `SettingsSearch.tsx` — chỉ filter rows trong Settings screen
  - `FriendSearchBar.tsx` — chỉ search friends by name/code
- Không có cách nào search 1 chat cũ, 1 quest cụ thể, 1 setting sâu, hoặc jump nhanh giữa 7 wellness sub-screens
- Khi mỗi step 12* thêm 1 screen mới, cognitive load tăng tuyến tính → user phải "khám phá" thay vì dùng ngay

### Mục tiêu

Một **Cmd+K-style modal** accessible từ bất kỳ screen nào:
- Gõ 1-2 ký tự → instant suggestions
- Match theo: **screens, friends, chats, quests, achievements, settings rows**
- Fuzzy + typo-tolerant (Fuse.js)
- Recent + pinned (max 10)
- Mounted ở root navigator — bền vững qua screen transitions
- Animation: slide_down + fade

### UX win

| Hành động | Trước | Sau |
|---|---|---|
| Mở Meditation | 3 taps, mất Home context | 1 mở modal + gõ "med" → Enter |
| Tìm bạn "An" | Mở Friends → search bar → gõ | Modal + "an" → friend in list |
| Mở AI Settings | Home → Settings → scroll xuống → AI row → tap | Modal + "ai set" → Enter |
| Quay lại chat cũ với Linh | Scroll ChatList 20 dòng | Modal + "linh" → thread |

---

## 2. Giải pháp

### 2.1 Tham chiếu desktop

Desktop có `src/renderer/quick-switcher/quick-switcher-view.js` — Cmd+K modal pattern, list các module/file/setting. Mobile sẽ port pattern này với scope rộng hơn (entities + screens).

### 2.2 Files mới

- `src/shared/components/QuickSwitcher.tsx` — main modal UI
- `src/api/searchIndex.ts` — in-memory inverted index + Fuse.js wrapper
- `src/api/searchHistory.ts` — recents persistence (AsyncStorage)
- `src/shared/hooks/useQuickSwitcherShortcut.ts` — Cmd+K (web) / FAB tap (native) / keyboard listener
- `src/shared/components/SearchResultRow.tsx` — single result row component
- `src/shared/components/EmptyState.tsx` — "No results" + suggestions
- `e2e/step-14-quick-switcher.spec.ts` — Playwright e2e

### 2.3 Files sửa

- `src/navigation/AppNavigator.tsx` — mount `<QuickSwitcherProvider>` ở root, wrap `MainNavigator` và `PhasePicker`
- `src/navigation/QuickSwitcherProvider.tsx` (mới) — context cho open/close state + portal rendering
- `src/screens/HomeScreen.tsx` — thêm FAB button "🔍 Search" góc dưới-phải
- `package.json` — thêm `fuse.js@^7.0.0`
- `docs/steps/README.md` — mark Step 14 ✅ Done + update Phase 4 status

### 2.4 Schema

```typescript
// src/api/searchIndex.ts

export type SearchableKind =
  | 'screen'
  | 'friend'
  | 'chat'
  | 'quest'
  | 'achievement'
  | 'setting'
  | 'action'; // e.g., "reset cache", "open admin"

export interface SearchableItem {
  /** Unique id (route name, friend id, etc.) */
  id: string;
  kind: SearchableKind;
  /** Primary label shown in UI */
  title: string;
  /** Secondary line (description, subtitle, pet name, etc.) */
  subtitle?: string;
  /** Optional emoji icon (matches existing row emoji pattern) */
  icon?: string;
  /** Tokens for Fuse.js search (lowercased, includes aliases) */
  keywords: string[];
  /** Route name to navigate (undefined for non-screen items) */
  route?: keyof MainStackParamList;
  /** Optional navigation params */
  params?: Record<string, unknown>;
  /** Score weight (higher = match earlier) */
  weight?: number;
}

export interface SearchResult extends SearchableItem {
  /** Fuse.js score (0 = perfect, 1 = no match) */
  score: number;
  /** Optional matched indices for highlighting */
  matches?: readonly [number, number][];
}

export interface SearchHistory {
  recents: string[];      // SearchableItem.id, max 10, LRU
  pinned: string[];       // user-pinned, max 5
}
```

### 2.5 Screen alias map (full coverage của `MainStackParamList`)

```typescript
// src/api/searchIndex.ts (export const SCREEN_ALIASES)

export const SCREEN_ALIASES: Record<keyof MainStackParamList, string[]> = {
  Home:             ['home', 'main', 'pet', 'trang chu'],
  ChatList:         ['chat', 'messages', 'tin nhan', 'conversation'],
  ChatThread:       ['chat thread', 'tin nhan voi'],
  Friends:          ['friends', 'ban be', 'buddies'],
  Pairing:          ['pair', 'pairing', 'ket noi', '6 digit'],
  Achievements:     ['achievements', 'thanh tuu', 'trophy', 'badge'],
  Quests:           ['quests', 'nhiem vu', 'mission', 'task'],
  Settings:         ['settings', 'cai dat', 'preferences', 'config'],
  Profile:          ['profile', 'ho so', 'avatar'],
  WellnessHome:     ['wellness', 'suc khoe', 'health'],
  Meditation:       ['meditation', 'thien', 'mindfulness'],
  Breathing:        ['breathing', 'ho hap', 'breath'],
  Pomodoro:         ['pomodoro', 'focus', 'timer', 'dem nguoc'],
  Ambient:          ['ambient', 'sound', 'am thanh', 'white noise'],
  Gratitude:        ['gratitude', 'biet on', 'journal'],
  Mood:             ['mood', 'tinh than', 'cam xuc'],
  MusicHome:        ['music', 'nhac', 'song', 'playlist', 'pet radio'],
  AdventureHome:    ['adventure', 'phieu luu', 'explore'],
  AIChat:           ['ai', 'chatbot', 'ai chat', 'tro ly'],
  AISettings:       ['ai settings', 'ai key', 'byok', 'api key'],
  TricksHome:       ['tricks', 'training', 'huan luyen', 'dog tricks'],
  CompetitionsHome: ['competitions', 'tournament', 'giai dau', 'cup'],
  MiniGamesHome:    ['mini games', 'game', 'choi game'],
  CatchFall:        ['catch fall', 'catch', 'roi do'],
  TimingGame:       ['timing', 'pham vi', 'tap timing'],
  Admin:            ['admin', 'diagnostics', 'debug', 'dev', 'admin dashboard'],
};
```

**Index build** từ nhiều nguồn (lazy + memoized):
1. **Screens** — build từ `SCREEN_ALIASES` constant, weight = 100
2. **Friends** — `useFriendStore.getState().friends` (subscription)
3. **Chats** — `useChatStore.getState().threads` (last 30 days, max 50)
4. **Quests** — `useAchievementStore.getState().quests` (active + locked + completed)
5. **Achievements** — `useAchievementStore.getState().achievements`
6. **Settings rows** — danh sách flattened từ `SettingsScreen` config (label + section)

### 2.6 Fuse.js configuration

```typescript
// src/api/searchIndex.ts

import Fuse from 'fuse.js';

const fuseOptions: IFuseOptions<SearchableItem> = {
  keys: [
    { name: 'title', weight: 0.5 },
    { name: 'subtitle', weight: 0.2 },
    { name: 'keywords', weight: 0.3 },
  ],
  includeScore: true,
  includeMatches: true,
  threshold: 0.4,        // fuzzy tolerance
  distance: 100,
  minMatchCharLength: 1,
  ignoreLocation: true,  // match anywhere
};
```

### 2.7 Layout (modal slide-down từ top)

```
+----------------------------------------+
| (backdrop dim 60%)                     |
| +------------------------------------+ |
| | 🔍 [Search...           ] [✕]    | | ← TextInput autofocus
| +------------------------------------+ |
| | Pinned                            | | ← nếu có pinned
| |  📌 Meditation                    | |
| |  📌 AI Chat                       | |
| +------------------------------------+ |
| | Recent                            | | ← nếu query empty
| |  🕒 Friends                       | |
| |  🕒 Breathing                     | |
| +------------------------------------+ |
| | Results (12)                      | | ← nếu query non-empty
| | 📺 Meditation               >     | | ← kind icon, title, chevron
| | 🐕 Anna (Friend)             >     | |
| | 💬 Anh — yesterday              > | |
| | 🏆 First Trick unlocked       > | |
| | ⚙️  Pomodoro timer             > | |
| | ...                                | |
| +------------------------------------+ |
| ↑↓ navigate · ↵ open · esc close      | ← footer hints
+----------------------------------------+
```

### 2.8 Hidden unlock (multi-channel)

| Channel | Trigger | Platform |
|---|---|---|
| FAB button | Tap floating "🔍" góc dưới-phải ở Home | iOS / Android |
| Cmd+K / Ctrl+K | Hardware keyboard listener | Web + physical keyboard (iPad) |
| Swipe down from top | PanGestureHandler ở root edge | Native (optional v1) |
| Long-press tab icon | (reserved for future tab bar) | — |

**v1 ships**: FAB + Cmd+K. Swipe down = nice-to-have, ship sau nếu bandwidth.

### 2.9 Pinned + Recents persistence

```typescript
// AsyncStorage keys
'search:pinned'   → string[] (max 5, manual)
'search:recents'  → string[] (max 10, LRU auto on select)
```

- **Pinned**: long-press result row → "📌 Pin" / "Unpin"
- **Recents**: mỗi lần user pick 1 item → prepend to recents, dedupe, cap 10
- Khi query empty: show pinned + recents
- Khi query non-empty: show results (pinned/recents filter khỏi results để tránh duplicate)

### 2.10 Quick actions (Phase 14.1)

Out of scope cho MVP, nhưng schema đã support `kind: 'action'` cho tương lai:
- "reset cache" → trigger AdminScreen action
- "open notifications" → toggle banner
- "toggle dark mode" → SettingsStore action

---

## 3. Kết quả kỳ vọng

- Mở modal → gõ "med" → 1 result "Meditation" → Enter → navigate
- Mở modal → gõ "an" → Anna (Friend) + Achievements + Anh (Chat) — top 5 relevant
- Recents persist qua app restart
- Pinned hiện ở top empty state
- Empty results → show 3 "Did you mean…" suggestions (nếu typo) hoặc hint "Try 'meditation' or 'achievements'"

### Performance budget
- Index build: < 50ms (28 screens + typical 30 friends + 20 chats + 50 quests)
- Fuse.js query: < 30ms cho 200 items
- Open modal animation: < 200ms
- Memory: < 2MB cho index cache

---

## 4. Testing

### 4.1 Unit (Vitest)

```typescript
// src/api/__tests__/searchIndex.test.ts

describe('searchIndex', () => {
  test('fuzzy matches screen aliases', () => {
    const results = search('thien');
    expect(results[0].id).toBe('Meditation');
  });

  test('exact keyword wins over partial', () => {
    const results = search('chat');
    expect(results[0].kind).toBe('chat'); // ChatList screen
  });

  test('returns empty for nonsense query', () => {
    expect(search('xyzqwerty')).toHaveLength(0);
  });

  test('recents LRU dedupes and caps at 10', () => {
    pushRecent('Friends');
    pushRecent('Meditation');
    pushRecent('Friends'); // move to top
    expect(getRecents()[0]).toBe('Friends');
    expect(getRecents()).toHaveLength(2);
  });
});
```

### 4.2 Playwright e2e

```typescript
// e2e/step-14-quick-switcher.spec.ts

import { test, expect, type Page } from '@playwright/test';

async function openSwitcher(page: Page) {
  // Method 1: FAB
  await page.locator('[data-testid="fab-search"]').click();
  // Method 2: keyboard
  // await page.keyboard.press('Control+K');

  await page.waitForSelector('[data-testid="quick-switcher"]', { timeout: 3_000 });
}

test.describe('Step 14 — Global Quick Switcher', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-root"]', { timeout: 30_000 });
    await page.waitForTimeout(1500);
  });

  test('opens via FAB on Home', async ({ page }) => {
    await openSwitcher(page);
    await expect(page.locator('[data-testid="quick-switcher-input"]')).toBeFocused();
  });

  test('Cmd+K opens switcher from any screen', async ({ page }) => {
    await page.locator('[data-testid="tab-home"]').click(); // or navigate
    await page.keyboard.press('Control+K');
    await page.waitForSelector('[data-testid="quick-switcher"]');
  });

  test('typing "med" surfaces Meditation screen', async ({ page }) => {
    await openSwitcher(page);
    await page.fill('[data-testid="quick-switcher-input"]', 'med');
    await page.waitForTimeout(300); // debounce
    const firstResult = page.locator('[data-testid="search-result"]').first();
    await expect(firstResult).toContainText('Meditation');
  });

  test('Enter navigates to selected result', async ({ page }) => {
    await openSwitcher(page);
    await page.fill('[data-testid="quick-switcher-input"]', 'med');
    await page.waitForTimeout(300);
    await page.keyboard.press('Enter');
    await page.waitForSelector('[data-testid="screen-meditation"]', { timeout: 3_000 });
    // Modal should close after navigation
    await expect(page.locator('[data-testid="quick-switcher"]')).not.toBeVisible();
  });

  test('Escape closes modal', async ({ page }) => {
    await openSwitcher(page);
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="quick-switcher"]')).not.toBeVisible();
  });

  test('recents persist after selection', async ({ page }) => {
    await openSwitcher(page);
    await page.fill('[data-testid="quick-switcher-input"]', 'breathing');
    await page.waitForTimeout(300);
    await page.keyboard.press('Enter');

    // Reopen
    await openSwitcher(page);
    // Query empty → should show recents with Breathing
    await expect(page.locator('[data-testid="recent-row-breathing"]')).toBeVisible();
  });

  test('pin/unpin toggles persist via long-press', async ({ page }) => {
    await openSwitcher(page);
    await page.fill('[data-testid="quick-switcher-input"]', 'music');
    await page.waitForTimeout(300);
    await page.locator('[data-testid="search-result"]').first().click({ button: 'right' });
    await page.click('[data-testid="pin-action"]');

    // Reopen empty query → pinned appears at top
    await page.keyboard.press('Escape');
    await openSwitcher(page);
    await expect(page.locator('[data-testid="pinned-row-music"]')).toBeVisible();
  });
});
```

### 4.3 Live check
1. Launch app → tap FAB 🔍 → modal mở trong 200ms
2. Gõ "med" → "Meditation" ở dòng đầu
3. Enter → Meditation screen + modal close
4. Reopen FAB → thấy "Breathing" trong recents
5. Mở `__DEV__` flag trong Settings → verify QuickSwitcher show Admin nếu gõ "admin"

### 4.4 So sánh desktop
Mở `desktop-pet-app-source/src/renderer/quick-switcher/quick-switcher-view.js` → so sánh:
- Scope (desktop: modules + files; mobile: screens + entities)
- Match algorithm (cả 2 dùng Fuse.js hoặc tương đương)
- Animation (slide_down từ top vs dropdown)

### 4.5 Type check + tests
```bash
npm run typecheck
npm test -- searchIndex
npm run test:e2e -- step-14
```

---

## 5. Debug

### Vấn đề 1: Modal mount ở root nhưng bị navigator unmount khi logout
- Wrap modal trong `QuickSwitcherProvider` ở **root navigator bên ngoài** `AuthStack` / `MainStack` switch
- Verify: logout → modal vẫn accessible (hoặc cố ý disable khi `!isAuthenticated`)

### Vấn đề 2: Index rebuild chậm với nhiều chat messages (1000+)
- Cap: chỉ index `threads` metadata (title, last message preview), không index full message body
- Document scope: full content search là Phase 14.1 (Option B)

### Vấn đề 3: Fuse.js quá "fuzzy" — match sai khi user gõ "ai" ra "Achi**e**vements"
- Bump weight cho `title` (0.5) > `keywords` (0.3) > `subtitle` (0.2)
- Threshold 0.4 (default 0.6 quá rộng)
- Thêm test case "ai" → phải trả AIChat, AI Settings, không trả Achievements

### Vấn đề 4: Swipe-down gesture conflict với scroll-to-top của Home
- Dùng `Gesture.Race` hoặc chỉ trigger ở edge 30px top
- v1 bỏ qua swipe-down, chỉ FAB + Cmd+K

### Vấn đề 5: A11y — screen reader không announce results count
- `accessibilityLiveRegion="polite"` trên result list
- `accessibilityLabel="12 results, press up down to navigate"` trên input
- Test với VoiceOver / TalkBack

### Vấn đề 6: Recents cap 10 nhưng user pin 5 → pinned có replace recents?
- Pinned là bucket riêng, recents là bucket riêng, không trộn
- Empty state hiển thị: Pinned (nếu có) → Recents (nếu có) → Hint "Try typing…"

---

## 6. Definition of Done

- [ ] `QuickSwitcher.tsx` modal với TextInput autofocus
- [ ] `searchIndex.ts` build index từ 6 nguồn (screens + friends + chats + quests + achievements + settings)
- [ ] `SCREEN_ALIASES` map đủ 26 routes (Home → Admin, bỏ 2 catch-all screens)
- [ ] Fuse.js integrated, threshold 0.4, weighted keys
- [ ] FAB button trên HomeScreen mở modal
- [ ] Cmd+K / Ctrl+K listener trên web
- [ ] Escape closes modal, Enter navigates
- [ ] Pinned + Recents persist qua AsyncStorage
- [ ] Long-press result → pin/unpin action
- [ ] Empty state với "Did you mean…" cho fuzzy no-match
- [ ] A11y: aria-live, focus trap, hardware back
- [ ] Vitest unit tests cho searchIndex + searchHistory (≥ 80% coverage)
- [ ] Playwright e2e 7 scenarios pass
- [ ] `npm run typecheck` + `npm test` + `npm run test:e2e` pass
- [ ] Performance: index build < 50ms, query < 30ms (benchmark test)
- [ ] Update `docs/steps/README.md` status table — Step 14 ✅

---

## 7. Reference

- Desktop: `src/renderer/quick-switcher/quick-switcher-view.js`
- Mobile precedent: `src/shared/components/DevShortcutGate.tsx` (5-tap pattern)
- Mobile precedent: `src/shared/components/SettingsSearch.tsx` (debounced search input)
- Fuse.js: https://www.fusejs.io/ (v7+, 12KB gzipped)
- React Navigation v7: useNavigation hook pattern từ `AdminDashboardScreen.tsx:81`

---

## 8. Estimated LOC

~700–1.000 lines:
- `QuickSwitcher.tsx` (modal + result list + empty state + footer): ~300
- `searchIndex.ts` (Fuse wrapper + alias map + builders): ~250
- `QuickSwitcherProvider.tsx` (context + portal): ~50
- `searchHistory.ts` (recents + pinned): ~80
- `useQuickSwitcherShortcut.ts` (keyboard listener + FAB handler): ~50
- `SearchResultRow.tsx` + `EmptyState.tsx`: ~120
- Unit + e2e tests: ~200
