# Step 12a — Wellness (Meditation + Breathing + Pomodoro + Gratitude + Mood)

**Priority:** 12a (after Steps 1–11)
**Effort:** Large (~2 weeks)
**Depends on:** Steps 1, 3 (animations), 9 (notifications)
**Visible result:** ✅ High

---

## 1. Mô tả

### Vấn đề hiện tại
Mobile chưa có wellness features.

Desktop (`src/renderer/wellness/wellness-view.js`, `src/core/wellness/wellness-manager.js`, `wellness-config.js`):
- **Meditation** (timer + ambient sound + breathing circle)
- **Breathing exercise** (4-7-8 / box breathing / alternate nostril)
- **Pomodoro** (25 min focus + 5 min break cycles)
- **Ambient sound** generator (rain / forest / ocean / fire)
- **Gratitude journal** (entries + history)
- **Mood tracker** (1-5 scale + tags + history chart)

### Mục tiêu
Port 6 wellness features sang mobile, mỗi feature là 1 tab trong WellnessScreen.

---

## 2. Giải pháp

### 2.1 Tham chiếu desktop
- `desktop-pet-app-source/src/core/wellness/wellness-manager.js`
- `desktop-pet-app-source/src/core/wellness/wellness-config.js`
- `desktop-pet-app-source/src/core/wellness/wellness-sound-generator.js`
- `desktop-pet-app-source/src/renderer/wellness/wellness-view.js`

### 2.2 Files mới
- `src/screens/wellness/WellnessHomeScreen.tsx` — entry, 6 tabs/cards
- `src/screens/wellness/MeditationScreen.tsx` — timer + breathing circle
- `src/screens/wellness/BreathingScreen.tsx` — preset picker + timer
- `src/screens/wellness/PomodoroScreen.tsx` — cycle with auto break
- `src/screens/wellness/AmbientScreen.tsx` — sound mixer
- `src/screens/wellness/GratitudeScreen.tsx` — journal
- `src/screens/wellness/MoodScreen.tsx` — tracker
- `src/api/wellness.ts` — CRUD + history
- `src/api/ambientSounds.ts` — soundscape catalog
- `src/stores/WellnessStore.ts` — state + persistence
- `src/shared/components/BreathingCircle.tsx` — animated breathing visualization
- `src/shared/components/PomodoroTimer.tsx` — countdown UI
- `src/shared/components/AmbientPlayer.tsx` — audio mixer

### 2.3 Files sửa
- `src/navigation/AppNavigator.tsx` — register wellness stack
- `src/screens/HomeScreen.tsx` — thêm "Wellness" card
- `src/api/achievementTypes.ts` — wellness achievements "7-day streak"
- `src/stores/AchievementStore.ts` — unlock khi streak đạt

### 2.4 Schema
```typescript
export type WellnessKind =
  | 'meditation' | 'breathing' | 'pomodoro'
  | 'ambient' | 'gratitude' | 'mood';

export interface WellnessSession {
  id: string;
  kind: WellnessKind;
  startedAt: string;
  endedAt?: string;
  durationSec: number;
  preset?: string; // "4-7-8", "box", etc.
  notes?: string;
}

export interface GratitudeEntry {
  id: string;
  userId: string;
  date: string;
  content: string;
}

export interface MoodEntry {
  id: string;
  userId: string;
  date: string;
  score: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  notes?: string;
}
```

### 2.5 Sounds
- Use `expo-av` cho audio playback
- Sources: bundled `assets/sounds/rain.mp3`, `forest.mp3`, `ocean.mp3`, `fireplace.mp3`
- Volume slider per sound
- Mixed playback qua `Audio.Sound` instance + `setVolumeAsync`

### 2.6 Breathing circle
```typescript
<BreathingCircle
  inhale={4}
  hold={7}
  exhale={8}
  // Use Reanimated for scale + opacity loop
/>
```
Phases: inhale → scale 1.0→1.5, hold → constant, exhale → 1.5→1.0.

---

## 3. Kết quả kỳ vọng

- WellnessScreen entry với 6 cards (Meditation, Breathing, Pomodoro, Ambient, Gratitude, Mood)
- Mỗi screen chạy được end-to-end
- Pomodoro: auto-cycle focus/break, notification ở cuối mỗi phase
- Gratitude/Mood: entries persist + history view
- Achievement "7-day wellness streak" unlock khi user dùng đủ 1 session/ngày × 7 ngày

---

## 4. Testing

### 4.1 Playwright
```typescript
// e2e/step12a-wellness.spec.ts
test('meditation timer counts down', async ({ page }) => {
  await page.goto('http://localhost:8081');
  await page.click('[data-testid="card-meditation"]');
  await page.click('[data-testid="duration-5min"]');
  await page.click('[data-testid="start-btn"]');
  await page.waitForTimeout(2000);
  const text = await page.textContent('[data-testid="timer-display"]');
  expect(text).toMatch(/04:\d{2}/);
});

test('breathing circle animates', async ({ page }) => {
  await page.click('[data-testid="card-breathing"]');
  await page.click('[data-testid="preset-4-7-8"]');
  await page.click('[data-testid="start-btn"]');
  const scale = await page.evaluate(() =>
    (window as any).__BREATHING_DEBUG__.currentScale
  );
  expect(scale).toBeGreaterThan(1.0);
});

test('pomodoro cycles focus→break', async ({ page }) => {
  await page.click('[data-testid="card-pomodoro"]');
  await page.click('[data-testid="start-btn"]');
  // ... assert focus phase
});

test('gratitude entry persists', async ({ page }) => {
  await page.click('[data-testid="card-gratitude"]');
  await page.fill('[data-testid="gratitude-input"]', 'My pet is cute');
  await page.click('[data-testid="save-btn"]');
  await page.reload();
  await page.click('[data-testid="tab-gratitude"]');
  await page.waitForSelector('[data-testid="entry-My pet is cute"]');
});
```

### 4.2 Live check
- Mở app, vào Wellness, mỗi card hoạt động smooth
- Audio play OK trên Expo Go
- Pomodoro timer countdown visible
- Breathing circle scale animation

### 4.3 So sánh desktop
Mở `desktop-pet-app-source/src/renderer/wellness/wellness-view.html` → so sánh layout + flow.

### 4.4 Type check
```bash
npm run typecheck
npm test
```

---

## 5. Debug

### Vấn đề 1: Audio không play trên web (Playwright)
- Web fallback: dùng `HTMLAudioElement` thay vì `expo-av`
- Conditional: `Platform.OS === 'web'`

### Vấn đề 2: Breathing circle giật
- Dùng `withTiming` + `useSharedValue` (chạy trên UI thread)
- Không dùng `setInterval`

### Vấn đề 3: Pomodoro background timer bị kill
- Background task: `expo-background-fetch` + `expo-task-manager`
- Hoặc chỉ track foreground + warning user

### Vấn đề 4: Mood chart không render
- Use `react-native-svg` + simple SVG path
- Falsy `data` points guard

### Vấn đề 5: Wellness session rollback khi leave app
- Save session partial every 10s → AsyncStorage
- Hydrate on app open

---

## 6. Definition of Done

- [ ] 6 wellness screens: Meditation / Breathing / Pomodoro / Ambient / Gratitude / Mood
- [ ] Breathing circle animation smooth (60fps)
- [ ] Pomodoro auto-cycle + notification
- [ ] Ambient sound player với volume slider
- [ ] Gratitude/Mood entries persist
- [ ] 7-day streak achievement
- [ ] Playwright e2e pass (≥ 4 cases)
- [ ] `npm run typecheck` + `npm test` pass

---

## 7. Reference

- Desktop: `src/core/wellness/wellness-manager.js`, `wellness-config.js`, `wellness-sound-generator.js`, `src/renderer/wellness/wellness-view.js`
- Mobile: `src/navigation/AppNavigator.tsx`, `src/stores/AchievementStore.ts`

---

## 8. Estimated LOC
~1500–2500 lines:
- 6 screens: ~700
- WellnessStore + api: ~300
- 4 components: ~400
- Audio assets: ~50MB (4 sounds × 12MB MP3)
- Tests: ~200
