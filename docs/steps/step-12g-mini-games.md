# Step 12g — Mini-games (Catch Fall + Timing Game)

**Priority:** 12g (after Steps 12a–12f)
**Effort:** Medium (~1 week)
**Depends on:** Steps 12a (ambient), 12f (Competitions — `daily_catch` / `timing_rush` use real gameplay scores)
**Visible result:** ✅ Highest

---

## 1. Mô tả

### Vấn đề hiện tại
Mobile chưa có mini-games playable.

Desktop (`src/core/game-config.js`, `catch-fall-game.js`, `timing-game.js`):
- **Catch Fall Game** — drag paddle horizontally to catch falling objects; 5 types (fish/cake/star/toy = +10..20 pts, bomb = -10), 3 lives, 45 seconds, win at 30 pts
- **Timing Game** — stop oscillating indicator inside shrinking green zone; 10 rounds, speed increases each round, zone shrinks, perfect center = 20pts, edge = 10pts, miss = -5pts, win at 30pts
- Both: `MiniGameBase` with score tracking + `onComplete(score, xpEarned)` callback

### Mục tiêu
Port cả 2 mini-games playable trên mobile (React Native):
- Pure game logic → `src/api/miniGames.ts` (no DOM)
- Playable screens with touch/paddle controls
- High score persistence + recent plays
- Integration: `daily_catch` competition now uses real Catch Fall scores; `timing_rush` uses real Timing scores

---

## 2. Giải pháp

### 2.1 Tham chiếu desktop
- `desktop-pet-app-source/src/core/game-config.js` — `GAMES` catalog + `MiniGameBase`
- `desktop-pet-app-source/src/core/catch-fall-game.js` — `CatchFallGame`
- `desktop-pet-app-source/src/core/timing-game.js` — `TimingGame`

### 2.2 Files mới
| File | LOC | Vai trò |
|---|---:|---|
| `src/api/miniGames.ts` | 474 | Pure game logic: spawn, tick, press, start/finish helpers |
| `src/api/miniGamesDev.ts` | 128 | 32 `__MG_*__` dev exposes |
| `src/stores/MiniGamesStore.ts` | 118 | zustand + AsyncStorage + high score tracking |
| `src/screens/minigames/MiniGamesHomeScreen.tsx` | 200 | Lobby: 2 game cards + recent scores |
| `src/screens/minigames/CatchFallScreen.tsx` | 306 | Catch Fall game: PanResponder paddle + 30fps loop |
| `src/screens/minigames/TimingGameScreen.tsx` | 327 | Timing game: tap-to-stop indicator + 30fps loop |
| `src/__tests__/miniGames.test.ts` | 692 | 74 vitest tests |
| `e2e/step-12g-mini-games.spec.ts` | 414 | 35 Playwright tests |

### 2.3 Files sửa
- `src/api/storage.ts` — `+MiniGamesState` storage key
- `src/navigation/types.ts` — `+MiniGamesHome`, `+CatchFall`, `+TimingGame`
- `src/navigation/AppNavigator.tsx` — register 3 screens + eager dev import
- `src/screens/HomeScreen.tsx` — card "🎯 Mini-games"

### 2.4 Domain types

```typescript
export type GameId = 'catch_fall' | 'timing';

export interface GameMeta {
  id: GameId;
  name: string;           // "Bắt đồ vật" / "Phản xạ nhanh"
  description: string;
  icon: string;            // 🎯 / ⚡
  minLevel: number;
  duration: number | null; // null for round-based (timing)
  rewardType: 'xp';
}

export interface CatchFallState {
  score: number;
  lives: number;          // 3
  timeLeft: number;        // seconds
  objects: CatchFallObject[];
  paddleX: number;         // 0..230
  running: boolean;
  finished: boolean;
  success: boolean;        // score >= 30
}

export interface CatchFallObject {
  id: number;
  type: 'fish' | 'cake' | 'star' | 'toy' | 'bomb';
  icon: string;
  points: number;           // 10..20, or -10 for bomb
  bad: boolean;
  x: number; y: number; speed: number;
}

export interface TimingState {
  score: number;
  round: number;           // 1..10
  maxRounds: number;       // 10
  indicatorPos: number;     // 0..100
  indicatorDir: 1 | -1;     // bounce direction
  speed: number;           // 1.4 + round * 0.15
  targetStart: number;     // 0..100
  targetEnd: number;       // 0..100 (shrinks per round)
  canPress: boolean;
  lastResult: 'perfect' | 'good' | 'miss' | null;
  lastPoints: number;
  running: boolean;
  finished: boolean;
  success: boolean;         // score >= 30
}

export interface GameScore {
  gameId: GameId;
  score: number;
  date: number;
  durationSec: number;
  success: boolean;
}

export interface MiniGamesState {
  highScores: Record<GameId, number>;
  recent: GameScore[];     // capped 20
  totalPlayed: number;
  totalWins: number;
}
```

### 2.5 Constants

```typescript
CATCH_FALL_DEFAULT_DURATION_SEC = 45
CATCH_FALL_DEFAULT_LIVES = 3
CATCH_FALL_DEFAULT_SPAWN_MS = 700
CATCH_FALL_PLAY_AREA_WIDTH = 300
CATCH_FALL_PLAY_AREA_HEIGHT = 340
CATCH_FALL_PADDLE_WIDTH = 70
CATCH_FALL_PADDLE_HEIGHT = 44
CATCH_FALL_OBJECT_SIZE = 28

TIMING_MAX_ROUNDS = 10
TIMING_DEFAULT_SPEED = 1.4
TIMING_SPEED_PER_ROUND = 0.15
TIMING_RESULT_DELAY_MS = 750
TIMING_TARGET_MIN_START = 25
TIMING_TARGET_MAX_START = 65
TIMING_TARGET_MIN_WIDTH = 15

PERFECT_SCORE = 20
GOOD_SCORE = 10
MISS_SCORE = -5
BOMB_HIT_SCORE = -10
MIN_XP_FROM_SCORE = 5
```

### 2.6 Catch Fall object types

| Type | Icon | Points | Notes |
|---|---|---:|---|
| fish | 🐟 | +10 | good |
| cake | 🎂 | +15 | good |
| star | ⭐ | +20 | good |
| toy | 🧶 | +10 | good |
| bomb | 💣 | -10 | bad — no life lost on miss |

### 2.7 Game loop (pure helpers)

```
Catch Fall:
  createCatchFallState(opts?)           → initial state
  startCatchFall(state)                → running=true, reset
  spawnCatchFallObject(opts?)           → random object, id=now+rand
  tickCatchFall(state, deltaMs, randomFn?)
    ├─ advance y += speed * (deltaMs/16)
    ├─ collision check (paddle box vs object box)
    ├─ caught: score += points, remove object
    ├─ missed (y > H-30): lives-- (good only), remove
    └─ finished: if lives<=0 or time=0
  setPaddleX(state, x)                 → clamp 0..230
  decrementTime(state)                  → timeLeft--, finish at 0
  finishCatchFall(state, success?)       → running=false, finished=true

Timing:
  createTimingState()                  → initial state
  startTiming(state, randomFn?)        → round=1, running=true
  tickTimingIndicator(state, units?)   → bounce 0↔100
  pressTiming(state)
    ├─ inside zone: perfect (center) or good (edge)
    ├─ outside zone: miss (-5 pts)
    └─ canPress=false, schedule next round
  nextTimingRound(state, randomFn?)
    ├─ round++, target shrinks, speed increases
    └─ if round > 10: finish
  finishTiming(state, success?)         → running=false, finished=true

xpFromScore(score)                    → max(5, floor(score/2))
```

### 2.8 Play area dimensions (fixed for simplicity)

```
Catch Fall:
  Play area: 300w × 340h
  Paddle: 70w × 44h, fixed at bottom (bottom: 26)
  Objects: 28×28, fall from y=0 downward
  Collision box: paddle extends 10px each side

Timing:
  Track: 100% width × 60h
  Indicator: 4px wide red bar
  Green zone: variable width (starts ~25px, shrinks per round)
  Target center = (targetStart + targetEnd) / 2
  Perfect = within 50% of center
```

### 2.9 Store (zustand)

```
State:
  state: MiniGamesState        // highScores + recent + totals
  initialized: boolean

Actions:
  hydrate()                   // restore from AsyncStorage
  reset()                    // clear all
  recordResult(gameId, score, success, durationSec)

Selectors:
  selectHighScore(id)         → number
  selectRecent(id?, limit?)   → GameScore[]
  selectTotalPlayed()         → number
  selectTotalWins()           → number
  selectXpEarnedFromScore(s) → number
  selectMeta(id)              → GameMeta | null
  selectAllGames()            → GameMeta[]
  selectRecentSummary()        → distinct recent games
```

### 2.10 Catch Fall screen (`CatchFallScreen.tsx`)

```
HUD: [Score: X] [Lives: ❤️❤️❤️] [Time: 45s]

[  Play area 300×340  ]
[  🐟      🎂        ]
[       ⭐            ]
[    💣              ]
[      [PADDLE]      ]
[  start overlay     ]
```

- PanResponder for paddle drag (touch anywhere → move paddle)
- `setInterval` 30fps game loop (`tickCatchFall` per frame)
- `setInterval` 1s countdown (`decrementTime`)
- HUD: score + lives (❤×3) + timer
- Result overlay: score + XP earned + replay button
- On finish: `recordResult` → update high score + recent

### 2.11 Timing screen (`TimingGameScreen.tsx`)

```
HUD: [Score: X]  [Round: 3/10]

[████████████████████████████]  ← green zone (target)
[████████████░░░░░░░░░░░░░░]  ← indicator (red, bouncing)
[          ⚡ NHẤN!            ]  ← tap button

┌──────────────────────────┐
│  ⚡ Phản Xạ Nhanh        │
│  Nhấn đúng lúc khi thanh │
│  đỏ nằm trong vùng xanh. │
│        [▶ Bắt đầu]        │
└──────────────────────────┘
```

- `setInterval` 30fps indicator animation (`tickTimingIndicator`)
- Tap button: call `pressTiming` → show result (⭐PERFECT / ✓GOOD / ✗MISS)
- After 750ms: `nextTimingRound`
- HUD: score + round counter
- On finish: `recordResult`

### 2.12 Integration với Competitions (Step 12f)

Khi user submit score trong competition, thay vì `quickPlay` random, giờ có thể dùng:

```typescript
// Từ CatchFallScreen, sau khi game kết thúc:
const result = store.recordResult('catch_fall', finalScore, success, durationSec);
// Submit to competition:
competitionsStore.submitScoreAction(comp.instanceId, result.score);
```

---

## 3. Kết quả kỳ vọng

- MiniGamesHomeScreen entry từ HomeScreen card "🎯 Mini-games"
- 2 game cards hiển thị: Catch Fall (🎯 45s) + Timing (⚡ 10 rounds)
- High score hiển thị trên mỗi card
- Tap card → game screen mở
- Catch Fall: kéo paddle bắt đồ, tránh bomb, 3 mạng, 45s
- Timing: nhấn đúng lúc indicator trong vùng xanh, 10 vòng
- Sau game: kết quả + XP + nút chơi lại
- High scores + recent games lưu vào AsyncStorage
- Tổng số đã chơi / thắng hiển thị ở header
- Integration: sau này Competitions submit dùng real game scores

---

## 4. Testing

### 4.1 Vitest (`src/__tests__/miniGames.test.ts` — 74 tests)

```typescript
// Catalog
test('GAMES has 2 entries', ...);
test('contains catch_fall and timing', ...);
test('game meta has all required fields', ...);
test('catch_fall has duration, timing has null', ...);
test('GAME_IDS has catch_fall and timing', ...);

// ensureMiniGamesStructure
test('returns defaults for null', ...);
test('preserves existing', ...);

// Catch Fall helpers
test('createCatchFallState defaults', ...);
test('startCatchFall marks running=true', ...);
test('spawnCatchFallObject produces valid object', ...);
test('setPaddleX clamps to play area', ...);
test('tickCatchFall moves objects down', ...);
test('bomb gives negative points', ...);
test('missed good object loses a life', ...);
test('finished when lives reach 0', ...);
test('decrementTime decreases + finishes at 0', ...);
test('finishCatchFall marks finished', ...);

// Timing helpers
test('createTimingState defaults', ...);
test('startTiming begins first round', ...);
test('tickTimingIndicator bounces 0↔100', ...);
test('pressTiming perfect center hit', ...);
test('pressTiming miss outside', ...);
test('nextTimingRound shrinks target', ...);
test('nextTimingRound at maxRounds finishes', ...);
test('finishTiming marks finished', ...);

// Score helpers
test('xpFromScore returns max 5 for low', ...);
test('xpFromScore returns floor(score/2) for higher', ...);

// Persistence
test('recordGameResult updates highScores', ...);
test('recordGameResult keeps higher previous', ...);
test('recordGameResult appends to recent', ...);
test('recordGameResult caps recent at 20', ...);
test('recordGameResult increments totals', ...);
test('getHighScore returns max', ...);
test('getRecentScores filters + limits', ...);
test('buildGameScore produces valid record', ...);

// Store
test('starts with defaults after reset', ...);
test('recordResult updates state', ...);
test('selectHighScore returns value', ...);
test('selectTotalPlayed + selectTotalWins', ...);
test('selectXpEarnedFromScore', ...);
test('selectMeta + selectAllGames', ...);
test('selectRecentSummary', ...);
```

### 4.2 Playwright (`e2e/step-12g-mini-games.spec.ts` — 35 tests)

```typescript
// Catalog
test('MG_GAME_IDS has 2 entries', ...);
test('MG_CATCH_FALL meta correct', ...);
test('MG_TIMING meta correct', ...);

// XP
test('XP_FROM_SCORE returns max 5 for low', ...);
test('XP_FROM_SCORE returns floor(score/2)', ...);

// Catch Fall helpers
test('CF_CREATE returns defaults', ...);
test('CF_START marks running=true', ...);
test('CF_SPAWN produces valid object', ...);
test('CF_SET_PADDLE clamps to bounds', ...);
test('CF_TICK moves objects', ...);
test('CF_TICK does nothing if not running', ...);
test('CF_FINISH marks finished', ...);

// Timing helpers
test('T_CREATE returns defaults', ...);
test('T_START begins round 1 with running=true', ...);
test('T_INDICATOR moves pos', ...);
test('T_PRESS perfect center', ...);
test('T_PRESS miss outside', ...);
test('T_NEXT advances round', ...);
test('T_NEXT at maxRounds finishes', ...);
test('T_FINISH marks finished', ...);

// Persistence
test('BUILD_SCORE creates record', ...);
test('RECORD_RESULT updates high score', ...);
test('RECORD_RESULT keeps higher previous', ...);
test('ENSURE handles null', ...);

// Store
test('RESET clears state', ...);
test('GET_STATE returns shape', ...);
test('GET_RECENT_STORE returns array', ...);
test('GET_TOTAL_PLAYED + GET_TOTAL_WINS', ...);
test('GET_META returns game meta', ...);
test('GET_ALL_GAMES returns 2 games', ...);

// Full simulations
test('Catch Fall full game simulation', ...);
test('Timing full game simulation', ...);
test('Catch Fall bomb gives negative points', ...);
test('Timing 10 rounds → score 200 (10 perfects)', ...);
```

### 4.3 Type check + tests
```bash
node_modules/.bin/tsc --noEmit     # 0 new errors
node_modules/.bin/vitest run       # 694/694 pass
node_modules/.bin/playwright test e2e/step-12g-mini-games.spec.ts  # 35/35
```

---

## 5. Debug

### Vấn đề 1: `startCatchFall` reset không đúng
- `createCatchFallState` tạo state mới nhưng không set `running=true`.
- Fix: `startCatchFall` phải set `running: true` sau khi create.

### Vấn đề 2: `startTiming` không set `running=true`
- `nextTimingRound` không sửa `running`.
- Fix: `startTiming` set `running: true` trên kết quả của `nextTimingRound`.

### Vấn đề 3: `nextTimingRound` finish sau 11 lần thay vì 10
- Check `if (newRound > maxRounds)` — round=10 không trigger.
- Test cần `TIMING_MAX_ROUNDS + 1` iterations.

### Vấn đề 4: Dev exposes không tồn tại khi Playwright chạy
- `miniGamesDev` chỉ được import khi `MiniGamesHomeScreen` mount.
- Playwright tests chạy ở onboarding/home screen → exposes chưa registered.
- Fix: import eager trong `AppNavigator.tsx` trước mọi screen.

### Vấn đề 5: Catch Fall collision box sensitive
- Collision check yêu cầu paddleX gần đúng với object x.
- Test dùng `randomFn=()=>0.5` cho deterministic, nhưng paddleX có thể không align.
- Fix: trong test, đặt object x = 5 và paddleX = 0 để collision chắc chắn.

### Vấn đề 6: Timing game `press` khi `canPress=false`
- `pressTiming` được gọi từ screen nhưng timing race có thể gọi khi `canPress=false`.
- Fix: guard trong `pressTiming` check `canPress` trước.

---

## 6. Definition of Done

- [ ] `src/api/miniGames.ts` với 2 games + all helpers
- [ ] `src/stores/MiniGamesStore.ts` zustand + AsyncStorage
- [ ] `src/screens/minigames/MiniGamesHomeScreen.tsx` lobby + game cards
- [ ] `src/screens/minigames/CatchFallScreen.tsx` playable Catch Fall
- [ ] `src/screens/minigames/TimingGameScreen.tsx` playable Timing
- [ ] Navigation registered + HomeScreen card
- [ ] Dev exposes `__MG_*__` (32 helpers)
- [ ] 74/74 vitest pass
- [ ] 35/35 Playwright e2e pass
- [ ] `tsc --noEmit` clean
- [ ] Branch `feat/step-12g-mini-games` push

---

## 7. Reference

- Desktop: `src/core/game-config.js`, `catch-fall-game.js`, `timing-game.js`
- Mobile: `src/navigation/AppNavigator.tsx`, `src/screens/HomeScreen.tsx`
- Related: Step 12f (Competitions — `daily_catch` / `timing_rush` score submission)

---

## 8. Estimated LOC

~2,659 lines:
- `api/miniGames.ts`: 474
- `stores/MiniGamesStore.ts`: 118
- `screens/minigames/MiniGamesHomeScreen.tsx`: 200
- `screens/minigames/CatchFallScreen.tsx`: 306
- `screens/minigames/TimingGameScreen.tsx`: 327
- `api/miniGamesDev.ts`: 128
- Tests: 1,106 (74 vitest + 35 e2e)
