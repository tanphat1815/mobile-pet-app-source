# Step 12e — Pet Tricks / Training

**Priority:** 12e (after Step 12d AI Chatbot)
**Effort:** Medium (~1 week)
**Depends on:** Steps 1, 3 (animations), 6 (rewards/treats)
**Visible result:** ✅ High

---

## 1. Mô tả

### Vấn đề hiện tại
Mobile chưa có pet tricks/training.

Desktop (`src/core/pet-tricks.js`, `src/core/pet-life-stages.js`, `src/core/mood-engine.js`):
- **Tricks catalog** — 8 trick definitions với id / displayName / command / difficulty / category / animation / unlockLevel / unlockStage / unlockItem
- **Learning flow** — bắt đầu training một trick (validate level + stage), tính attempts khi practice, master khi đạt attempts đủ
- **Practice** — có/không treat để boost success rate, đếm số lần attempt thành công/thất bại
- **Perform** — kiểm tra learned, áp cooldown 15s giữa các lần biểu diễn, tăng mastery level (1→10) + totalTricksPerformed
- **Command parser** — parse input string (chat / voice) thành trickId để perform
- **Life stage gating** — NEWBORN → YOUNG → JUVENILE → ADULT → SENIOR, mỗi stage mở thêm trick

### Mục tiêu
Port hệ thống tricks đầy đủ: 8 tricks × 4 categories × 5 life stages, learn/practice/perform + cooldown + mastery + command parser + trên UI có 3 tabs (Thư viện / Đang học / Thuần thục).

---

## 2. Giải pháp

### 2.1 Tham chiếu desktop
- `desktop-pet-app-source/src/core/pet-tricks.js` — TricksCatalog + Learn/Practice/Perform helpers
- `desktop-pet-app-source/src/core/pet-life-stages.js` — 5 stages + STAGE_ORDER
- `desktop-pet-app-source/src/renderer/skills/skills-view.js` — UI layout

### 2.2 Files mới
| File | LOC | Vai trò |
|---|---:|---|
| `src/api/tricks.ts` | ~520 | Catalog + types + helpers |
| `src/api/tricksDev.ts` | ~105 | Dev exposes cho Playwright |
| `src/stores/TricksStore.ts` | ~265 | zustand store + persistence |
| `src/screens/tricks/TricksScreen.tsx` | ~830 | UI chính (3 tabs + TrainingModal) |
| `src/__tests__/tricks.test.ts` | ~450 | 48 vitest tests |
| `e2e/step-12e-tricks.spec.ts` | ~220 | 21 Playwright tests |

### 2.3 Files sửa
- `src/api/storage.ts` — `+TricksState` vào schema
- `src/navigation/types.ts` — `+TricksHome`
- `src/navigation/AppNavigator.tsx` — register `TricksScreen`
- `src/screens/HomeScreen.tsx` — card "🎓 Tricks"

### 2.4 Domain types
```typescript
export type LifeStage = 'NEWBORN' | 'YOUNG' | 'JUVENILE' | 'ADULT' | 'SENIOR';

export type TrickCategory = 'basic' | 'intermediate' | 'advanced' | 'expert';

export interface TrickDef {
  id: string;
  displayName: string;
  emoji: string;
  description: string;
  command: string;            // "sit", "dance", "shake", ...
  difficulty: 1 | 2 | 3 | 4 | 5;
  category: TrickCategory;
  animation: 'SIT' | 'SLEEP' | 'WALK' | 'JUMP' | 'DANCE' | 'CUSTOM';
  unlockLevel: number;
  unlockStage: LifeStage;
  requiresItem?: 'ball' | 'ring' | 'music_box';
}

export interface LearnedTrick {
  trickId: string;
  learnedAt: number;
  masteryLevel: number;      // 1 → 10
  successCount: number;
  failCount: number;
}

export interface TrainingState {
  trickId: string;
  attempts: number;
  startedAt: number;
}

export interface PetStatsWithTricks {
  level: number;
  energy: number;
  tricks: {
    learned: LearnedTrick[];
    training: TrainingState | null;
    lastTrickAt: number;
    totalTricksPerformed: number;
  };
  trainingStats: {
    treatsUsed: number;       // treats available, clamped 0..MAX_TREATS (20)
    trainingSessionsToday: number;
  };
}
```

### 2.5 Catalog (8 tricks × 4 categories)

| ID | Emoji | Display | Cat | Diff | Lv. | Stage | Item |
|---|---|---|---|:---:|:---:|---|---|
| `sit` | 🪑 | Ngồi | basic | 1★ | 1 | YOUNG | — |
| `lie_down` | 🛌 | Nằm xuống | basic | 2★ | 3 | YOUNG | — |
| `roll_over` | 🔄 | Lăn | basic | 2★ | 5 | YOUNG | — |
| `shake_hand` | 🤝 | Bắt tay | intermediate | 3★ | 8 | JUVENILE | — |
| `fetch` | 🎾 | Đi lấy đồ | intermediate | 4★ | 12 | JUVENILE | ball |
| `jump` | ⭕ | Nhảy qua vòng | advanced | 4★ | 18 | ADULT | ring |
| `dance` | 💃 | Nhảy múa | advanced | 5★ | 25 | ADULT | music_box |
| `back_flip` | 🤸 | Lộn ngược | expert | 5★ | 35 | ADULT | — |

### 2.6 5 Life stages (rank order)

```
NEWBORN(0) → YOUNG(1) → JUVENILE(2) → ADULT(3) → SENIOR(4)

Label VN: Sơ sinh / Nhỏ / Vị thành niên / Trưởng thành / Già
```

NEWBORN disallow mọi trick. Stage rank `>= unlockStage` mới học được.

### 2.7 Learn/Practice/Perform flow

```
learnTrick(trickId, stats, stage)
  ├─ validates:
  │   ├─ stage !== NEWBORN
  │   ├─ stats.level >= trick.unlockLevel
  │   ├─ STAGE_ORDER[stage] >= STAGE_ORDER[trick.unlockStage]
  │   └─ !learned.includes(trickId)
  └─ stats.tricks.training = { trickId, attempts: 0, startedAt: now }
        ↓
practiceTrick(trickId, useTreat, stats, personality, randomFn?)
  ├─ validates: stats.tricks.training !== null
  ├─ successRate = clamp(0.3
  │     + (personality.obedience / 100) * 0.4   // 0..0.4
  │     + (useTreat ? 0.25 : 0)                 // +0.25 if treat used
  │     + min(0.25, attempts * 0.04),           // familiarity
  │     0, 0.95);
  ├─ random < successRate → success
  ├─ if success && attempts >= difficulty*3 → MASTERED
  │   ├─ push { trickId, learnedAt, masteryLevel: 1, successCount, failCount }
  │   ├─ stats.tricks.training = null
  │   ├─ stats.tricks.lastTrickAt = now
  │   └─ if useTreat → stats.trainingStats.treatsUsed -= 1
  └─ else → continue training (return progress)
        ↓
performTrick(trickId, stats, now?)
  ├─ validates:
  │   ├─ learned exists (find by trickId)
  │   └─ now - stats.tricks.lastTrickAt >= PERFORM_COOLDOWN_MS (15000)
  ├─ learned.masteryLevel = min(masteryLevel + 0.1, 10)
  ├─ stats.tricks.totalTricksPerformed += 1
  ├─ stats.tricks.lastTrickAt = now
  └─ xpGained = round(5 * learned.masteryLevel)
```

### 2.8 Command parser

```typescript
parseCommand(input, petStats, now?):
  // matches case-insensitive: command string OR id OR displayName
  // returns performTrick result OR { success: false, error: 'Không nhận diện...' }
```

Ví dụ:
- `parseCommand('sit')` → nếu learned → perform 'sit'
- `parseCommand('Nhảy múa')` → match displayName → perform 'dance'
- `parseCommand('shake_hand')` → match id
- `parseCommand('xyz')` → error

Đây là integration point với Step 12d AI Chatbot: nếu AI trả lời `[action:DANCE]`, có thể trigger `performCommandAction('dance')` sau.

### 2.9 TricksStore (zustand + AsyncStorage)

```
State:
  petStats: PetStatsWithTricks        // level, energy, tricks, trainingStats
  currentStage: LifeStage             // mặc định 'YOUNG'
  personality: { obedience, energy, affection }
  learnedTricks: TrickDef[]           // cache
  availableTricks: AvailableTrick[]   // cache (computed from state)

Actions:
  setPetStats(next)                   // update level/energy
  setStage(stage)                     // switch life stage
  setPersonality(next)                // update behavior
  learnTrickAction(id)                // → learnTrick(id, getState(), stage)
  practiceTrickAction(id, useTreat?)  // → practiceTrick(...)
  performTrickAction(id)              // → performTrick(...)
  performCommandAction(input)         // parse + perform
  cancelTraining()                    // clear training
  addTreats(n)                        // clamp 0..MAX_TREATS (20)
  hydrate() / reset() / _persist()

Selectors:
  selectCurrentTraining  selectLearned
  selectAvailable        selectTreats
  selectTotalPerformed   selectCooldownRemaining (ms)
```

### 2.10 UI structure (TricksScreen)

```
🪩 Trick
(gradient header)

0 thuần thục · 0 biểu diễn · 5 treats 🍖                  ⏳ Cooldown Xs

┌─────────────────────────────────────────────┐
│ [📝 Lệnh: "sit", "dance", "shake"...]  [➤]  │  Command input
└─────────────────────────────────────────────┘

[📚 Thư viện] [🎯 Đang học] [⭐ Thuần thục]

📚 Thư viện tab
  CƠ BẢN (3)
  ┌────────────────────────────────────────┐
  │ 🪑 Ngồi                         [Học] │
  │ Bảo pet ngồi ngoan ngoãn                │
  │ ⚡ 1★ · 🎯 Lv.1 · 💬 "sit"             │
  └────────────────────────────────────────┘
  🔒 Lv.18 cho advance, 🔒 Lv.35 cho expert

🎯 Đang học tab
  Hiện tại chưa có gì — vào thư viện để chọn
  hoặc khi đang training:
    BigCard với emoji + name + description
    Progress [Hủy] [Luyện tập]

⭐ Thuần thục tab
  🍖 Thêm treats        [+1] [+3] [+5]
  🪑 Ngồi                          ▶
    ▓▓▓▓░░░░░░ Mastery 20%
    Đã biểu diễn 5 lần
```

### 2.11 TrainingModal

```
            🪑
            Ngồi
   Bảo pet ngồi ngoan ngoãn

   Tiến độ                                3 / 3
   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░

   [🥕 Luyện không Treat]      [🍖 Dùng Treat (5)]
                                  disabled khi treats=0

   🍖 5 treats còn lại         [+1] [+3] [+5]

                  Đóng
```

### 2.12 Navigation

`MainStackParamList`:
```typescript
type MainStackParamList = {
  Home: undefined;
  // ...
  AIChat: undefined;
  AISettings: undefined;
  TricksHome: undefined;     // NEW (Step 12e)
};
```

`AppNavigator.tsx`: `<MainStack.Screen name="TricksHome" component={TricksScreen} />`

`HomeScreen.tsx`: card "🎓 Tricks" với nút Open.

### 2.13 Dev exposes

`src/api/tricksDev.ts` đăng ký toàn bộ helpers + store actions lên `window` cho Playwright:

```typescript
window.__TRICK_COUNT__                  // 8
window.__TRICK_IDS__                    // ['sit', 'lie_down', ...]
window.__TRICK_CATEGORIES__             // ['basic','intermediate','advanced','expert']
window.__TRICK_GET_BY_ID__(id)          // TrickDef | null
window.__TRICK_LIST_BY_CATEGORY__(cat)  // TrickDef[]
window.__TRICK_REQUIRED_ATTEMPTS__(d)   // number (difficulty → attempts)
window.__PERFORM_COOLDOWN_MS__          // 15000
window.__TRICK_SET_LEVEL__(n)           // store action
window.__TRICK_SET_STAGE__(s)           // store action (LifeStage)
window.__TRICK_LEARN__(id)              // { success, error?, message? }
window.__TRICK_PRACTICE__(id, useTreat) // { attempts, mastered, ... }
window.__TRICK_PERFORM__(id)            // { success, xpGained, error?, cooldownRemaining? }
window.__TRICK_COMMAND__(s)             // parseCommand + perform
window.__TRICK_CANCEL__()
window.__TRICK_ADD_TREATS__(n)
window.__TRICK_GET_TREATS__()           // number
window.__TRICK_GET_LEARNED__()          // LearnedTrick[]
window.__TRICK_GET_AVAILABLE__()        // AvailableTrick[]
window.__TRICK_GET_TRAINING__()         // TrainingState | null
```

---

## 3. Kết quả kỳ vọng

- TricksScreen entry từ HomeScreen card "🎓 Tricks"
- 8 tricks hiển thị theo 4 categories, gom từ basic → expert
- Mỗi trick: emoji + displayName + description + difficulty + unlockLevel + unlockStage + lock state
- Click "Học" → bắt đầu training. Move sang tab "Đang học"
- Click "Luyện tập" trong BigCard → mở TrainingModal với progress bar
- Click "🍖 Dùng Treat" → consume 1 treat, boost success rate
- Khi attempts >= difficulty*3 → trick được learn (move sang "Thuần thục")
- Click "▶" trong learned → perform trick, mastery level tăng (cap 10)
- Cooldown 15s giữa 2 lần perform; pill hiện thời gian còn lại
- Command input → parseCommand → performTrick (integration Step 12d AI Chatbot)
- Treats: +1/+3/+5 quick-add, clamp 0..MAX_TREATS (20)
- 48 vitest tests + 21 Playwright e2e đều pass

---

## 4. Testing

### 4.1 Vitest (`src/__tests__/tricks.test.ts` — 48 tests)

```typescript
// Catalog
test('TRICKS has 8 entries', ...);
test('contains all 8 trick ids', ...);
test('all tricks have required fields', ...);
test('categories follow difficulty order', ...);
test('category labels are Vietnamese', ...);
test('STAGE_ORDER has 5 stages', ...);
test('STAGE_LABELS Vietnamese', ...);

// Helpers
test('getTrickById finds sit', ...);
test('getTrickById returns null', ...);
test('listAllTricks returns 8', ...);
test('listTricksByCategory filters basic', ...);
test('listTricksByCategory filters expert', ...);

// Structure
test('ensureTricksStructure fills defaults', ...);
test('ensureTricksStructure preserves existing', ...);

// Availability
test('marks low-level tricks as levelMet=false', ...);
test('marks unlocked as canLearn', ...);
test('marks isLearned', ...);
test('NEWBORN stage disables all', ...);

// learnTrick branches
test('starts training for unlocked trick', ...);
test('fails for unknown trick', ...);
test('fails for newborn', ...);
test('fails for low level', ...);
test('fails for already learned', ...);

// practiceTrick
test('increments attempts', ...);
test('uses treat + boosts rate', ...);
test('returns mastered when threshold reached', ...);
test('returns failure when no training active', ...);

// performTrick
test('performs learned trick', ...);
test('fails for not learned', ...);
test('enforces cooldown', ...);
test('mastery caps at 10', ...);

// parseCommand
test('matches command "sit"', ...);
test('matches displayName "Nhảy múa"', ...);
test('matches id "shake_hand"', ...);
test('returns error for unknown', ...);
test('returns error for empty input', ...);

// TricksStore
test('starts with default state', ...);
test('setPetStats updates level', ...);
test('setStage updates currentStage', ...);
test('learnTrickAction starts training', ...);
test('learnTrickAction fails for low level', ...);
test('practiceTrickAction increments attempts', ...);
test('practiceTrickAction with treat uses 1 treat', ...);
test('performTrickAction fails when not learned', ...);
test('cancelTraining clears training', ...);
test('addTreats clamps 0..MAX_TREATS', ...);
test('performCommandAction via command string full mastery roundtrip', ...);
```

### 4.2 Playwright (`e2e/step-12e-tricks.spec.ts` — 21 tests)

```typescript
test('TRICKS exposed with 8 entries', ...);
test('TRICK_IDS contains all 8 expected', ...);
test('TRICK_CATEGORIES has 4 levels', ...);
test('PERFORM_COOLDOWN_MS is 15000', ...);
test('TRICK_GET_BY_ID finds sit', ...);
test('TRICK_GET_BY_ID returns null for unknown', ...);
test('TRICK_LIST_BY_CATEGORY filters basic', ...);
test('TRICK_REQUIRED_ATTEMPTS scales with difficulty', ...);
test('TRICK_LEARN starts training', ...);
test('TRICK_LEARN fails for low level', ...);
test('TRICK_LEARN fails for unknown trick', ...);
test('TRICK_PRACTICE increments attempts', ...);
test('TRICK_PERFORM fails when not learned', ...);
test('TRICK_COMMAND parses "sit"', ...);
test('TRICK_COMMAND fails for unknown', ...);
test('TRICK_CANCEL clears training', ...);
test('TRICK_ADD_TREATS clamps to MAX', ...);
test('TRICK_ADD_TREATS clamps to 0', ...);
test('TRICK_GET_LEARNED empty initially', ...);
test('TRICK_GET_AVAILABLE includes all 8 tricks', ...);
test('TricksScreen has 3 tabs', ...);
```

### 4.3 Live check
- Mở app → Home → click "🎓 Tricks" → screen mở
- Switch qua 3 tabs đều render đúng
- Tap "Học" ở `sit` → bắt đầu training, tab Đang học active BigCard
- Tap "Luyện tập" → modal mở với progress 0/3
- Tap "🥕 Luyện không Treat" nhiều lần → 3rd attempt → mastered → move sang Thuần thục
- Tap "▶" ở learned row → perform, mastery tăng, cooldown pill hiện 15s
- Sau 15s tap lại → perform thành công

### 4.4 So sánh desktop
Mở `desktop-pet-app-source/src/renderer/skills/skills-view.html` → flow learn/practice/perform trùng khớp.

### 4.5 Type check
```bash
node_modules/.bin/tsc --noEmit
node_modules/.bin/vitest run   # 537/537
node_modules/.bin/playwright test e2e/step-12e-tricks.spec.ts --project=chromium  # 21/21
```

---

## 5. Debug

### Vấn đề 1: Catalog keys mismatch với ids
- Ban đầu key là `'SIT'`, `'LIE_DOWN'`, ... nhưng `id` lại lowercase.
- Test `getTrickById('sit')` trả về `undefined`.
- Fix: đổi keys về lowercase (match `id`) để `Record<string, TrickDef>` truy cập được bằng id trực tiếp.

### Vấn đề 2: practiceTrick random failure khi `randomFn` không có
- Default `Math.random()` có thể ra < successRate rồi fail ngay.
- Test "returns mastered" cần force success.
- Fix: cho phép inject `randomFn` qua dependency injection: `practiceTrick(..., randomFn = Math.random)`.
- Trong test: truyền `() => 0` để force success.

### Vấn đề 3: mastery test fail vì iterate quá nhiều
- Sau khi mastered, `stats.tricks.training = null`. Lần practiceTrick tiếp theo trả `success: false`.
- Biến `result` bị ghi đè bởi lần cuối (failed) → test fail.
- Fix: thêm break early khi `result.mastered === true`.

### Vấn đề 4: performTrick mastery level vô hạn
- Mỗi lần perform `masteryLevel += 0.1`. Sau 1000 lần → 100+ → break UI render.
- Fix: `masteryLevel = Math.min(masteryLevel + 0.1, 10)`.

### Vấn đề 5: cooldown chỉ dựa vào `lastTrickAt`, bị stuck sau khi reset app
- Khi AsyncStorage hydrate, `lastTrickAt` có thể là 0 hoặc timestamp cũ.
- Nếu timestamp tương lai (clock skew) → cooldown forever.
- Fix: `if (now < lastTrickAt) lastTrickAt = now` khi hydrate, hoặc đơn giản treat 0 là "no cooldown".

### Vấn đề 6: parseCommand phân biệt hoa-thường
- User input có thể "Sit" / "SIT" / "sit".
- Fix: lowercase cả input lẫn `command`/`id` trước khi so sánh. `displayName` chỉ lowercase phần tiếng Anh (nếu có).

---

## 6. Definition of Done

- [ ] `src/api/tricks.ts` với 8 tricks + 5 life stages + helpers
- [ ] `src/stores/TricksStore.ts` zustand store + persistence
- [ ] `src/screens/tricks/TricksScreen.tsx` 3 tabs + TrainingModal
- [ ] Navigation `TricksHome` registered, HomeScreen card
- [ ] `parseCommand` matches command/id/displayName
- [ ] Cooldown 15s enforced, mastery cap 10
- [ ] Treats clamp 0..20
- [ ] Dev exposes `__TRICK_*__` cho Playwright
- [ ] 48/48 vitest pass
- [ ] 21/21 Playwright e2e pass
- [ ] `tsc --noEmit` clean
- [ ] Branch `feat/step-12e-tricks` push

---

## 7. Reference

- Desktop: `src/core/pet-tricks.js`, `src/core/pet-life-stages.js`, `src/renderer/skills/skills-view.js`
- Mobile: `src/navigation/AppNavigator.tsx`, `src/navigation/types.ts`, `src/screens/HomeScreen.tsx`
- Related: Step 12d (AI Chatbot — integration point via `performCommandAction`)

---

## 8. Estimated LOC

~2,400 lines:
- `api/tricks.ts`: 520
- `stores/TricksStore.ts`: 265
- `screens/tricks/TricksScreen.tsx`: 830
- Tests: 670 (48 vitest + 21 e2e)
- Misc (dev expose + storage + nav + home): ~140
