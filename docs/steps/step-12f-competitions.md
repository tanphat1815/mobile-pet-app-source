# Step 12f — Pet Competitions & Tournaments

**Priority:** 12f (after Steps 12a–12e)
**Effort:** Large (~1.5 weeks)
**Depends on:** Step 12e (Tricks — cho competition `tricks_show`)
**Visible result:** ✅ High

---

## 1. Mô tả

### Vấn đề hiện tại
Mobile chưa có pet competitions / tournaments.

Desktop (`src/core/competitions/competition-config.js`, `competition-manager.js`):
- **5 competition types** — SCORE_RACE / BRACKET / ROUND_ROBIN / MARATHON / RARE_HUNT
- **4 status** — UPCOMING / REGISTRATION / IN_PROGRESS / COMPLETED
- **4 templates sẵn** — daily_catch (🍎), weekend_tournament (🏆 bracket 16), timing_rush (⚡), marathon_24h (🏃)
- **Auto-rotation** — tự tạo daily/weekly nếu chưa có
- **Bot seeding** — 7 bots có tên + baseScore ngẫu nhiên
- **Registration** — kiểm tra status, max players, entry fee, dedup
- **Score submission** — auto-register trong in_progress, clamp negative
- **Bracket generation** — round names VN (Tứ Kết / Bán Kết / Chung Kết), bye bots
- **Status transitions** — tự động chuyển theo timestamp
- **Prize distribution** — match rank (number / range "4-10" / "11+")
- **History** — cap 50 entries

### Mục tiêu
Port full competition system: 5 templates × 5 types, lobby UI với 3 tabs (Lobby / Lịch sử / Thống kê), per-competition detail modal với bracket + leaderboard + actions, real-time tick driver.

---

## 2. Giải pháp

### 2.1 Tham chiếu desktop
- `desktop-pet-app-source/src/core/competitions/competition-config.js`
- `desktop-pet-app-source/src/core/competitions/competition-manager.js`

### 2.2 Files mới
| File | LOC | Vai trò |
|---|---:|---|
| `src/api/competitions.ts` | 983 | Catalog + 5 templates + helpers + types |
| `src/api/competitionsDev.ts` | 168 | Dev exposes cho Playwright |
| `src/stores/CompetitionsStore.ts` | 303 | zustand store + auto-tick |
| `src/screens/competitions/CompetitionsScreen.tsx` | 799 | UI chính (3 tabs + Detail + Leaderboard) |
| `src/__tests__/competitions.test.ts` | 777 | 83 vitest tests |
| `e2e/step-12f-competitions.spec.ts` | 402 | 44 Playwright tests |

### 2.3 Files sửa
- `src/api/storage.ts` — `+CompetitionsState` storage key
- `src/navigation/types.ts` — `+CompetitionsHome`
- `src/navigation/AppNavigator.tsx` — register `CompetitionsScreen`
- `src/screens/HomeScreen.tsx` — card "🏆 Competitions"

### 2.4 Catalog (5 templates)

| ID | Icon | Type | Schedule | Entry Fee | Top Prize | Duration |
|---|---|---|---|---:|---|---|
| `daily_catch` | 🍎 | SCORE_RACE | daily | 0 | 1000🪙+200XP+🥇 Gold Trophy | 60 min |
| `timing_rush` | ⚡ | SCORE_RACE | daily | 50 | 2000🪙+400XP+⚡ Lightning Badge | 30 min |
| `tricks_show` | 🎓 | SCORE_RACE | weekly | 0 | 1500🪙+300XP+⭐ Star Performer | 7 days |
| `marathon_24h` | 🏃 | MARATHON | weekly | 0 | 3000🪙+800XP+🏅 Marathon Medal | 24h |
| `weekend_tournament` | 🏆 | BRACKET 16 | weekly | 100 | 5000🪙+1000XP+🏆 Tournament Champion | 4h |

### 2.5 Types & status

```typescript
export type CompetitionType =
  | 'score_race' | 'bracket' | 'round_robin'
  | 'marathon' | 'rare_hunt';

export type CompetitionStatus =
  | 'upcoming' | 'registration' | 'in_progress' | 'completed';

export interface Competition extends CompetitionTemplate {
  instanceId: string;
  templateId: string;
  status: CompetitionStatus;
  createdAt: number;
  registrationStart: number;
  registrationEnd: number;
  startAt: number;
  endAt: number;
  completedAt?: number;
  currentPlayers: number;
  participants: Participant[];
  bracket?: BracketRound[];
  results?: CompetitionResult[];
}

export interface Participant {
  userCode: string;
  petName: string;
  avatar: string;
  isBot: boolean;
  registeredAt: number;
  highestScore: number;
  totalScore: number;
  submissionCount: number;
}

export interface BracketMatch {
  matchId: string;
  player1: Participant | null;
  player2: Participant | null;
  score1: number;
  score2: number;
  winner: Participant | null;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface BracketRound {
  round: number;
  name: string;        // "Tứ Kết" / "Bán Kết" / "Chung Kết 🏆"
  matches: BracketMatch[];
}

export interface CompetitionResult {
  rank: number;
  userCode: string;
  petName: string;
  isBot: boolean;
  score: number;
  prize: PrizeRewards | null;
}

export interface PrizeRewards {
  coins?: number;
  xp?: number;
  items?: PrizeItem[];
}

export interface PrizeTier {
  rank: number | string;       // 1, "3-4", "5-8", "11+"
  rewards: PrizeRewards;
}

export interface UserCompetitionStats {
  played: number;
  wins: number;
  podiums: number;
  totalCoinsEarned: number;
  trophies: { name: string; rank: number; compName: string; date: number }[];
}
```

### 2.6 Core helpers (pure functions)

```
createCompetition(templateId, now?, customOptions?, randomFn?):
  ├─ resolve template (fallback daily_catch)
  ├─ build Competition with REGISTRATION status
  ├─ registrationStart = now
  ├─ registrationEnd = now + template.registrationDuration
  ├─ startAt = now + template.registrationDuration
  ├─ endAt = startAt + template.duration
  └─ seedSampleBots (4 for score_race, 7 for bracket)
        ↓
register(comp, { userCode, petName, userCoins }):
  ├─ reject if status != REGISTRATION/UPCOMING
  ├─ reject if currentPlayers >= maxPlayers
  ├─ reject if duplicate
  ├─ reject if entryFee > userCoins
  └─ push participant + increment currentPlayers
        ↓
submitScore(comp, { userCode, score }):
  ├─ reject if status != IN_PROGRESS or now > endAt
  ├─ clamp score to >= 0
  ├─ if participant not found → auto-register (if capacity)
  ├─ update highestScore (max) + totalScore (sum) + submissionCount
  └─ return { success, highestScore }
        ↓
quickPlay(comp, userCode, petName, randomFn?, baseScore?):
  ├─ score = baseScore + Math.floor(randomFn() * 600)
  └─ delegates to submitScore
        ↓
generateBracket(participants, bracketSize):
  ├─ pad participants with "Thí sinh dự bị" bots
  ├─ Round 1: pair (i, i+1), winner = higherScore
  ├─ Round 2: winners of (0,1) vs (2,3), ...
  ├─ Round 3: semi-finals / final
  └─ Round 4 (if size=16): final "Chung Kết 🏆"
        ↓
autoGenerateCompetitions(state, now):
  └─ seed daily_catch, timing_rush, tricks_show if not active
        ↓
checkStatusTransitions(state, now):
  ├─ registration → in_progress if now >= startAt
  │   └─ for BRACKET type, generateBracket
  └─ in_progress → completed if now >= endAt
        ├─ build sorted results with prizes
        └─ move to history (cap 50)
        ↓
endCompetition(state, instanceId, now):
  ├─ find comp, mark COMPLETED
  ├─ generate results sorted by highestScore desc
  ├─ update userStats (played/wins/podiums/coins/trophies)
  └─ return { state, results, comp, userPrize }
        ↓
getPrizeForRank(prizePool, rank):
  ├─ match rank === number
  ├─ match "min-max" range
  └─ match "min+" suffix
```

### 2.7 Bracket round names (Vietnamese)

```typescript
const BRACKET_ROUND_NAMES_16 = ['Vòng 1/8', 'Tứ Kết', 'Bán Kết', 'Chung Kết 🏆'];
const BRACKET_ROUND_NAMES_8  = ['Tứ Kết',    'Bán Kết', 'Chung Kết 🏆'];
const BRACKET_ROUND_NAMES_4  = ['Bán Kết',                  'Chung Kết 🏆'];
```

### 2.8 Bot seeding

```
SAMPLE_BOTS: 7 bots với baseScore 490-820
- bot_mimi 🐱 (650)
- bot_kuro 🐕 (820)
- bot_luna 🐰 (540)
- bot_shiba 🦊 (780)
- bot_dino 🦖 (490)
- bot_meo_con 🐈 (610)
- bot_pikachu 🐹 (730)

Seed count:
- BRACKET → 7 bots
- Other → 4 bots

Each bot:
- highestScore = baseScore + Math.floor(randomFn() * 200)
- totalScore = baseScore * 2
- submissionCount = 2
- registeredAt = now - 60000 * (i + 1)
```

### 2.9 CompetitionsStore (zustand + AsyncStorage)

```
State:
  state: CompetitionsState              // active + history + userStats
  initialized: boolean
  lastTickAt: number

Actions:
  hydrate()                             // restore + autoGenerate + transitions
  reset()                               // clear + delete storage
  tick()                                // throttled checkStatusTransitions
  ensureTemplates()                     // ensureTemplates
  createCustomCompetition(templateId)   // → Competition | null
  registerForCompetition(id, petName, coins)
  submitScoreAction(id, score)
  quickPlayAction(id, petName)
  endCompetitionAction(id)              // → EndCompetitionResult | null
  generateBracketAction(id)             // → boolean

Selectors:
  selectAllActive / selectLive / selectRegistration / selectUpcoming
  selectHistory / selectById / selectLeaderboard(id, userCode, limit?)
  selectUserStats / selectActiveParticipant(id, userCode)

Auto-tick driver:
  startCompetitionsAutoTick(): setInterval(() => tick(), 5000)
```

### 2.10 UI structure (CompetitionsScreen)

```
🏆 Competitions
{headerSubtitle}
{userStats.wins}W · {podiums} podiums · {totalCoinsEarned} 🪙 earned

[🎮 Lobby] [📜 Lịch sử] [📊 Thống kê]

Lobby tab:
  🔥 Đang diễn ra (live)
  📝 Đang mở đăng ký (registration)
  ⏳ Sắp mở (upcoming)

Competition card:
  {icon} {name}                              [Status pill]
  {description}
  [🎯 type] [👥 N/max] [⏱ remaining]
  Top prize: 1000 🪙 · 200 XP · 1 🎁

History tab:
  {icon} {name}
  #1 {petName} ({score}) · #2 ... · #3 ...

Stats tab:
  🎮 Số giải đã chơi: 0
  🥇 Số trận thắng: 0
  🏅 Số lần Top 3: 0
  🪙 Tổng xu thắng: 0
  🏆 Trophies (0): ...

Detail modal:
  {icon} {name}
  {description}

  [Status pill]   {countdown remaining}

  [🎯 type] [👥 N/max] [💰 entryFee xu]

  🏆 Bảng giải thưởng
  #1: 1000 🪙 · 200 XP · 1 🎁
  #2: 500 🪙 · 100 XP · 1 🎁
  #3: 250 🪙 · 50 XP · 1 🎁
  #4-10: 100 🪙 · 25 XP
  #11+: 10 XP

  (BRACKET only)
  🎯 Cây đấu
  Vòng 1/8:
    Mimi (650) vs Kuro (820) → Kuro
    ...
  Tứ Kết:
    ...
  Chung Kết 🏆:
    Bot A (X) vs Bot B (Y) → Bot A

  Action bar:
    [📝 Đăng ký] (REGISTRATION, not registered)
    [🎮 Quick Play] [🎯 Submit] (IN_PROGRESS, registered)
    [🏅 Bảng xếp hạng] [Kết thúc] [Đóng]

Leaderboard sheet:
  🏅 Bảng xếp hạng
  #1 Bot Name 🤖  High: 820  Total: 1640
  #2 Player (Bạn)  High: 999  Total: 999
  ...
```

### 2.11 Real-time countdown

```typescript
useEffect(() => {
  if (!hasUrgent) return;
  const id = setInterval(() => {
    setNow(Date.now());
    tick();
  }, 1000);
  return () => clearInterval(id);
}, [hasUrgent, tick]);

// Background auto-tick every 5s while screen mounted
useEffect(() => {
  void hydrate();
  const stopTick = startCompetitionsAutoTick();
  return () => stopTick();
}, [hydrate]);
```

### 2.12 Navigation

`MainStackParamList`:
```typescript
type MainStackParamList = {
  // ...
  TricksHome: undefined;
  CompetitionsHome: undefined;   // NEW (Step 12f)
};
```

`AppNavigator.tsx`:
```typescript
<MainStack.Screen
  name="CompetitionsHome"
  component={CompetitionsScreen}
  options={{ animation: 'slide_from_right' }}
/>
```

`HomeScreen.tsx`: card "🏆 Competitions" với nút Open.

### 2.13 Dev exposes (44+)

`src/api/competitionsDev.ts` đăng ký toàn bộ helpers + store actions lên `window` cho Playwright:

```typescript
window.__COMP_COUNT__                       // 5
window.__COMP_TEMPLATE_IDS__                // ['daily_catch', ...]
window.__COMP_TYPES__                       // ['score_race', 'bracket', ...]
window.__COMP_STATUSES__                    // ['upcoming', 'registration', ...]
window.__COMP_TYPE_LABELS__                 // { score_race: 'Đua điểm', ... }
window.__COMP_STATUS_LABELS__               // { in_progress: 'Đang diễn ra', ... }
window.__COMP_DEFAULT_BRACKET_SIZE__        // 8
window.__COMP_DEFAULT_DURATION_MS__         // 3600000
window.__COMP_DEFAULT_REGISTRATION_MS__     // 900000
window.__COMP_LEADERBOARD_LIMIT__           // 10
window.__COMP_HISTORY_LIMIT__               // 50

window.__COMP_GET_TEMPLATE__(id)
window.__COMP_GET_BY_ID__(id)
window.__COMP_GET_LEADERBOARD__(id, limit?)
window.__COMP_GET_PRIZE_FOR_RANK__(tid, rank)
window.__COMP_PRIZE_TOTAL__(prize)
window.__COMP_FORMAT_TIME__(ms)
window.__COMP_FORMAT_SCORE__(n)
window.__COMP_GENERATE_BRACKET__(id)

window.__COMP_PURE_CREATE__(tid)
window.__COMP_PURE_END__(state, id)
window.__COMP_PURE_TRANSITIONS__(state)
window.__COMP_PURE_AUTO_GEN__(state)
window.__COMP_PURE_REGISTER__(comp, args)
window.__COMP_PURE_SUBMIT__(comp, args)
window.__COMP_PURE_QUICK_PLAY__(comp, userCode, petName)
window.__COMP_PURE_ENSURE__(state)
window.__COMP_PURE_LEADERBOARD__(comp, userCode, limit?)

window.__COMP_RESET__()
window.__COMP_TICK__()
window.__COMP_ENSURE_TEMPLATES__()
window.__COMP_CREATE__(tid)
window.__COMP_REGISTER__(id, petName, userCoins)
window.__COMP_SUBMIT_SCORE__(id, score)
window.__COMP_QUICK_PLAY__(id, petName)
window.__COMP_END__(id)

window.__COMP_GET_ACTIVE__()
window.__COMP_GET_LIVE__()
window.__COMP_GET_REGISTRATION__()
window.__COMP_GET_UPCOMING__()
window.__COMP_GET_HISTORY__()
window.__COMP_GET_STATE__()
window.__COMP_GET_USER_STATS__()
window.__COMP_GET_PARTICIPANT__(id)

window.__COMP_START_TICK__()
```

---

## 3. Kết quả kỳ vọng

- CompetitionsScreen entry từ HomeScreen card "🏆 Competitions"
- 5 templates auto-seed mỗi session: daily_catch + timing_rush + tricks_show (others on demand)
- Lobby tab: 3 sections (live / registration / upcoming), countdown cập nhật 1s/lần
- Tap competition card → Detail modal với countdown + prize tiers + bracket (BRACKET only) + actions
- Đăng ký: trừ entry fee nếu có, add player participant
- Quick Play: random score 200-800 (configurable)
- Submit Score: clamp negative, update highest/total/count
- End Competition: build sorted results, trao giải cho player (nếu trong top prize), move to history
- Leaderboard sheet: top 10 với avatar + name + isBot + isYou highlight
- Trophies tab: liệt kê tất cả đồ đã thắng (rank + compName + date)
- Real-time tick driver: checkStatusTransitions mỗi 5s background + 1s foreground khi có comp active

---

## 4. Testing

### 4.1 Vitest (`src/__tests__/competitions.test.ts` — 83 tests)

```typescript
// Catalog
test('COMPETITION_TEMPLATES has 5 entries', ...);
test('contains expected ids', ...);
test('all templates have required fields', ...);
test('weekly tournament has bracketSize=16', ...);
test('type and status label sets cover all values', ...);
test('default constants are sane', ...);

// getCompetitionTemplate / listCompetitionTemplates
test('finds known templates', ...);
test('returns null for unknown', ...);
test('listCompetitionTemplates returns 5', ...);

// ensureCompetitionsStructure
test('returns defaults for null', ...);
test('fills missing userStats fields', ...);
test('preserves existing arrays', ...);

// ID
test('starts with comp_<id>_', ...);

// createCompetition + seedSampleBots
test('uses template defaults', ...);
test('seeds sample bots', ...);
test('seeds 7 bots for bracket', ...);
test('throws for unknown template (falls back to daily_catch)', ...);
test('has empty bracket initially', ...);

// register
test('happy path', ...);
test('rejects duplicate registration', ...);
test('rejects when full', ...);
test('rejects when registration closed', ...);
test('rejects when entry fee > balance', ...);
test('accepts when balance covers fee', ...);

// submitScore
test('updates highest and total', ...);
test('auto-registers when submitting mid-progress and capacity allows', ...);
test('rejects after endAt', ...);
test('rejects if not started', ...);
test('clamps negative score to 0', ...);

// quickPlay
test('submits a random score', ...);
test('fails when in registration', ...);

// generateBracket
test('builds 3 rounds for size=8', ...);
test('builds 4 rounds for size=16', ...);
test('emits champion in final match', ...);
test('pads participants when fewer than size', ...);
test('handles empty participants with bye bots', ...);

// autoGenerateCompetitions
test('seeds daily templates if missing', ...);
test('does not duplicate active comps', ...);

// checkStatusTransitions
test('moves registration to in_progress after startAt', ...);
test('builds bracket on bracket comp start', ...);
test('ends competition after endAt and moves to history with results', ...);

// endCompetition
test('returns null for unknown id', ...);
test('builds results and updates user stats when player participated', ...);
test('player comes second when bots outrank', ...);
test('does not count bot wins', ...);
test('caps history at HISTORY_LIMIT', ...);

// getPrizeForRank
test('matches rank 1, 2, 3', ...);
test('matches range "4-10"', ...);
test('returns null for empty pool', ...);
test('returns null for rank beyond pool', ...);

// prizeRewardsTotal
test('zeros for null', ...);
test('sums coins and xp', ...);
test('sums items quantity', ...);

// Selectors
test('getActiveCompetitions filters completed', ...);
test('getRegistrationCompetitions finds only registration', ...);
test('getLiveCompetitions finds only in_progress', ...);
test('getUpcomingCompetitions finds only upcoming', ...);
test('findCompetitionById across active + history', ...);

// getLeaderboard
test('sorts by highestScore desc', ...);
test('caps at limit', ...);

// Time helpers
test('clamps to 0', ...);
test('formats seconds', ...);
test('formats hours', ...);
test('formats days', ...);

// formatScore
test('passes through < 10000', ...);
test('abbreviates >= 10000', ...);

// STORE
test('starts with default state after reset', ...);
test('createCustomCompetition adds to active', ...);
test('createCustomCompetition returns null for unknown', ...);
test('ensureTemplates seeds daily templates', ...);
test('registerForCompetition returns success', ...);
test('registerForCompetition fails for unknown id', ...);
test('submitScoreAction updates score', ...);
test('quickPlayAction updates score', ...);
test('endCompetitionAction returns null for unknown id', ...);
test('endCompetitionAction completes a comp', ...);
test('selectById finds active + history', ...);
test('selectLeaderboard returns array', ...);
test('selectUserStats returns stats', ...);
test('selectAllActive / Live / Registration / Upcoming / History work', ...);
test('generateBracketAction returns false for non-bracket', ...);
test('generateBracketAction returns true for bracket', ...);

// seedSampleBots direct
test('seeds 7 for bracket', ...);
```

### 4.2 Playwright (`e2e/step-12f-competitions.spec.ts` — 44 tests)

```typescript
test('COMP_COUNT exposed with 5 entries', ...);
test('COMP_TEMPLATE_IDS contains expected', ...);
test('COMP_TYPES has 5 types', ...);
test('COMP_STATUSES has 4 statuses', ...);
test('COMP_TYPE_LABELS Vietnamese', ...);
test('COMP_STATUS_LABELS Vietnamese', ...);
test('DEFAULT_BRACKET_SIZE is 8', ...);
test('DEFAULT_DURATION_MS is 1 hour', ...);
test('DEFAULT_REGISTRATION_MS is 15 min', ...);
test('LEADERBOARD_LIMIT is 10', ...);
test('COMP_GET_TEMPLATE finds known', ...);
test('COMP_GET_TEMPLATE returns null for unknown', ...);
test('COMP_GET_BY_ID finds created comp', ...);
test('COMP_GET_BY_ID returns null for unknown', ...);
test('COMP_FORMAT_TIME formats seconds', ...);
test('COMP_FORMAT_SCORE abbreviates >= 10000', ...);
test('COMP_GET_PRIZE_FOR_RANK matches numeric', ...);
test('COMP_GET_PRIZE_FOR_RANK matches range', ...);
test('COMP_PRIZE_TOTAL sums coins/xp/items', ...);
test('COMP_RESET clears state', ...);
test('COMP_ENSURE_TEMPLATES seeds daily', ...);
test('COMP_CREATE adds to active', ...);
test('COMP_REGISTER adds player to participants', ...);
test('COMP_REGISTER fails for unknown id', ...);
test('COMP_REGISTER rejects insufficient funds', ...);
test('COMP_SUBMIT_SCORE updates score', ...);
test('COMP_QUICK_PLAY submits score', ...);
test('COMP_END returns null for unknown', ...);
test('COMP_END completes a comp', ...);
test('COMP_GET_ACTIVE returns array', ...);
test('COMP_GET_LIVE returns array', ...);
test('COMP_GET_REGISTRATION returns array of registration', ...);
test('COMP_GET_UPCOMING returns array', ...);
test('COMP_GET_HISTORY returns array', ...);
test('COMP_GET_STATE shape', ...);
test('COMP_GET_USER_STATS shape', ...);
test('COMP_GET_LEADERBOARD returns array', ...);
test('COMP_GENERATE_BRACKET works on bracket comps', ...);
test('COMP_GENERATE_BRACKET returns false for non-bracket', ...);
test('COMP_PURE_CREATE creates comp', ...);
test('COMP_PURE_TRANSITIONS moves state', ...);
test('COMP_PURE_REGISTER adds participant', ...);
test('COMP_PURE_ENSURE handles null', ...);
test('COMP_PURE_LEADERBOARD works', ...);
```

### 4.3 Live check
- Mở app → Home → click "🏆 Competitions" → screen mở
- Lobby: 5 active comps hiện (3 daily/weekly auto-seed + 2 manual)
- Tap daily_catch → Detail modal → countdown chạy 1s/lần
- Tap "📝 Đăng ký" → success alert
- Tap "🎯 Submit" → score update + haptic feedback
- Tap "🏅 Bảng xếp hạng" → sheet mở với player highlight
- Tap "Kết thúc" → confirm → move to history với results
- Tab "📜 Lịch sử" → completed comp hiển thị
- Tab "📊 Thống kê" → stats + trophies list

### 4.4 So sánh desktop
Mở `desktop-pet-app-source/src/renderer/competitions/` → flow register → submit → end → prize trùng khớp.

### 4.5 Type check
```bash
node_modules/.bin/tsc --noEmit     # 0 new errors
node_modules/.bin/vitest run       # 620/620 pass
node_modules/.bin/playwright test e2e/step-12f-competitions.spec.ts --project=chromium  # 44/44
```

---

## 5. Debug

### Vấn đề 1: Player không thể register khi comp status đã set IN_PROGRESS
- `register()` chỉ chấp nhận REGISTRATION/UPCOMING.
- Trong test, gọi `comp.status = IN_PROGRESS` trước register → bị reject silent.
- **Fix:** Register trước, set status sau. Trong app thật, screen flow tự nhiên theo thứ tự.

### Vấn đề 2: submitScore fail với `now > endAt` mặc dù chưa tới endAt thật
- Test dùng `createCompetition(1000)` → endAt = 1000 + 54M ms ≈ 54 phút sau epoch.
- Real `Date.now()` >> 54M → fail.
- **Fix:** Dùng `Date.now()` làm `now` cho createCompetition trong tests.

### Vấn đề 3: Prize tier "11+" không match trong một số edge case
- `getPrizeForRank` parse `entry.rank.endsWith('+')` → chỉ work khi string format đúng ("11+").
- Nếu template dev truyền `11` (number) thay vì `'11+'` (string), pattern không match.
- **Fix:** Document rằng suffix `+` phải là string.

### Vấn đề 4: Bot kuro luôn thắng player submit 500
- Seed score kuro = 820 + 0..200 = 820-1020 (deterministic với `() => 0.5`).
- Player cần score > 1020 để đứng #1.
- **Fix:** Trong test, dùng `() => 0` để có score cố định, hoặc submit score 99999.

### Vấn đề 5: `dynamic require` fail trong ES module test
- `require('../api/competitions')` không work với vitest ESM.
- **Fix:** Top-level `import { findCompetitionById as findCompetitionByIdFn }` rồi alias.

### Vấn đề 6: Persistence rehydrate mất state khi AsyncStorage race condition
- Auto-tick setInterval gọi `set` liên tục → có thể ghi đè khi hydrate đang load.
- **Fix:** Hydrate một lần lúc mount, sau đó tick chỉ modify state, debounce persist 50ms.

### Vấn đề 7: Bracket generation với participants rỗng
- `bracketSize=8` nhưng 0 participants → loop pad với `bot_bye_X` → 8 dummy bots.
- GenerateBracket chạy nhưng kết quả không có ý nghĩa.
- **Fix:** UI guard: chỉ generate bracket khi `participants.length >= bracketSize / 2`.

---

## 6. Definition of Done

- [ ] `src/api/competitions.ts` với 5 templates + helpers + types
- [ ] `src/stores/CompetitionsStore.ts` zustand + auto-tick + persistence
- [ ] `src/screens/competitions/CompetitionsScreen.tsx` 3 tabs + Detail + Leaderboard
- [ ] Navigation `CompetitionsHome` registered, HomeScreen card
- [ ] Real-time countdown update 1s/lần khi có urgent comp
- [ ] Auto-tick background 5s/lần
- [ ] Bracket generation cho BRACKET type với round names VN
- [ ] Prize distribution match number / range "X-Y" / "X+" formats
- [ ] Dev exposes `__COMP_*__` (44 helpers)
- [ ] 83/83 vitest pass
- [ ] 44/44 Playwright e2e pass
- [ ] `tsc --noEmit` clean
- [ ] Branch `feat/step-12f-competitions` push

---

## 7. Reference

- Desktop: `src/core/competitions/competition-config.js`, `competition-manager.js`
- Mobile: `src/navigation/AppNavigator.tsx`, `src/navigation/types.ts`, `src/screens/HomeScreen.tsx`
- Related: Step 12e (Tricks — `tricks_show` competition rewards high-mastery pets)

---

## 8. Estimated LOC

~3,432 lines:
- `api/competitions.ts`: 983
- `stores/CompetitionsStore.ts`: 303
- `screens/competitions/CompetitionsScreen.tsx`: 799
- `api/competitionsDev.ts`: 168
- Tests: 1,179 (83 vitest + 44 e2e)
