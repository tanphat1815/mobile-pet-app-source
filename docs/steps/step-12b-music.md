# Step 12b — Music (Procedural Player + Pet Radio + EQ + Lyrics + Sleep Timer)

**Priority:** 12b
**Effort:** Large (~2–3 weeks)
**Depends on:** Steps 1, 9 (notifications — sleep timer alert)
**Visible result:** ✅ High

---

## 1. Mô tả

### Vấn đề hiện tại
Mobile chưa có music feature.

Desktop (`src/core/music/music-manager.js`, `music-config.js`, `music-synth-engine.js`, `pet-radio.js`, `src/renderer/music/music-player-view.js`):
- **Procedural music engine** (generated via WebAudio synth, không cần file MP3)
- **Pet radio** (chill Lofi / Upbeat Pop / Sleep Ambient tracks)
- **EQ (10-band)** + preamp
- **Lyrics** (LRC format scrolling synced to beat)
- **Sleep timer** (auto stop sau N phút)
- **Mood-based** auto-playlist (chọn mood → radio suggest tracks)

### Mục tiêu
Port procedural music engine + player UI sang mobile dùng `expo-av` hoặc `react-native-track-player`.

---

## 2. Giải pháp

### 2.1 Tham chiếu desktop
- `desktop-pet-app-source/src/core/music/music-manager.js`
- `desktop-pet-app-source/src/core/music/music-config.js`
- `desktop-pet-app-source/src/core/music/music-synth-engine.js`
- `desktop-pet-app-source/src/core/music/pet-radio.js`
- `desktop-pet-app-source/src/renderer/music/music-player-view.js`

### 2.2 Approach options
**Option A — Procedural WebAudio port:** khó port sang RN vì không có WebAudio đầy đủ
**Option B — Pre-rendered MP3/Ogg files:** đơn giản, dùng `expo-av`
**Option C — Hybrid:** vài track procedural đơn giản (loop bằng OscillatorNode thông qua `react-native-audio-api`)

→ **Recommend Option B** (pre-rendered audio + procedural layer chỉ ở 1-2 demo tracks).

### 2.3 Files mới
- `src/screens/music/MusicHomeScreen.tsx` — playlist grid
- `src/screens/music/PlayerScreen.tsx` — now playing UI
- `src/screens/music/RadioScreen.tsx` — pet radio
- `src/api/musicCatalog.ts` — track metadata + URLs
- `src/api/lyrics.ts` — LRC parser
- `src/stores/MusicStore.ts` — current track, queue, EQ state
- `src/shared/components/EQSlider.tsx` — 10-band equalizer
- `src/shared/components/LyricsView.tsx` — scrolling synced lyrics
- `src/shared/components/SleepTimerSheet.tsx` — countdown UI
- `src/api/musicPlayer.ts` — wrapper quanh `expo-av` hoặc `react-native-track-player`

### 2.4 Files sửa
- `src/navigation/AppNavigator.tsx` — music stack
- `src/screens/HomeScreen.tsx` — "Music" card
- `src/stores/SettingsStore.ts` — `eqSettings`, `sleepTimer`
- `assets/audio/` — bundle MP3 files

### 2.5 Schema
```typescript
export interface Track {
  id: string;
  title: string;
  artist: string;
  durationSec: number;
  url: string;             // remote hoặc bundled
  genre: 'lofi' | 'pop' | 'ambient' | 'focus' | 'sleep';
  lyricsLrc?: string;      // LRC content
  coverArtUrl?: string;
}

export interface RadioStation {
  id: string;
  name: string;
  iconEmoji: string;
  description: string;
  tracks: string[];        // track IDs
}

export interface EQSettings {
  preamp: number;          // -12 .. +12 dB
  bands: number[];         // 10 values [-12..+12]
}
```

### 2.6 EQ implementation
RN không có EQ native. Dùng:
- **iOS:** wrapper quanh AVAudioEngine EQ bands (native module custom)
- **Android:** wrapper quanh `android.media.audiofx.Equalizer` (native module custom)
- **Fallback:** client-side gain đơn giản (không phải EQ thật)

→ Recommend: ship feature mark "EQ only on iOS/Android native" và fallback cho web.

### 2.7 Lyrics sync
- LRC parser: format `[mm:ss.xx]text`
- Sync to current playback time via interval
- Highlight current line, fade previous

### 2.8 Sleep timer
- `<Sheet>` với preset: 15 / 30 / 60 / 90 min / custom
- `setTimeout` to pause player
- Notification khi timer expire (qua Step 9 NotificationService)

---

## 3. Kết quả kỳ vọng

- MusicHomeScreen grid 8-12 tracks + 4 radios
- PlayerScreen: now playing UI với play/pause/seek/skip
- Lyrics view scroll sync với current time
- EQ sliders (10 bands) — native only, fallback cho web
- Sleep timer countdown auto pause
- Mood-based auto-playlist suggest

---

## 4. Testing

### 4.1 Playwright
```typescript
// e2e/step12b-music.spec.ts
test('plays track', async ({ page }) => {
  await page.goto('http://localhost:8081');
  await page.click('[data-testid="card-music"]');
  await page.click('[data-testid="track-1"]');
  await page.waitForSelector('[data-testid="now-playing-bar"]');
});

test('lyrics sync', async ({ page }) => {
  await page.click('[data-testid="lyrics-tab"]');
  await page.evaluate(() => (window as any).__MUSIC_DEBUG__.seekTime(30));
  const highlighted = await page.textContent('[data-testid="lyric-line-active"]');
  expect(highlighted).toBeTruthy();
});

test('sleep timer pauses player', async ({ page }) => {
  await page.click('[data-testid="sleep-timer"]');
  await page.click('[data-testid="sleep-1min"]');
  // Wait 65s
  await page.waitForTimeout(65000);
  const isPlaying = await page.evaluate(() => (window as any).__MUSIC_DEBUG__.isPlaying);
  expect(isPlaying).toBe(false);
});
```

### 4.2 Live check
- Open music → tap track → plays
- Lyrics scroll sync
- Sleep timer countdown
- EQ adjust → audio output changes (native only)

### 4.3 So sánh desktop
Mở `desktop-pet-app-source/src/renderer/music/music-player-view.html` → so sánh layout.

### 4.4 Type check
```bash
npm run typecheck
npm test
```

---

## 5. Debug

### Vấn đề 1: Audio không play sau suspend (background)
- Setup `Audio.setAudioModeAsync({ shouldDuckAndroid: true, playsInSilentModeIOS: true })`
- Background audio: `expo-av` background config trong `app.json`

### Vấn đề 2: Lyrics không sync
- Use `onProgress` callback để update `currentTime`
- Re-render highlighted line qua `useState` + memo

### Vấn đề 3: EQ không có effect
- Verify native module installed correctly
- Fallback: hide EQ section trên web, show only on iOS/Android
- Document limitation in README

### Vấn đề 4: Sleep timer không persist khi kill app
- Save `timerEndAt` to AsyncStorage; on app start, check if past → pause player + clear

### Vấn đề 5: Buffering khi play track lớn
- Pre-fetch next track queue head
- Show loading spinner on PlayerScreen

---

## 6. Definition of Done

- [ ] MusicHomeScreen với ≥ 8 tracks + 4 radios
- [ ] PlayerScreen play/pause/seek/skip
- [ ] Lyrics view scroll synced
- [ ] EQ 10-band (native only)
- [ ] Sleep timer auto-pause
- [ ] Mood-based playlist suggest
- [ ] Background audio (optional)
- [ ] Playwright e2e pass
- [ ] `npm run typecheck` + `npm test` pass

---

## 7. Reference

- Desktop: `src/core/music/*`, `src/renderer/music/music-player-view.js`
- Mobile: `src/navigation/AppNavigator.tsx`, `src/stores/SettingsStore.ts`

---

## 8. Estimated LOC
~1500–2200 lines:
- 3 screens: ~500
- MusicStore + api: ~300
- 3 components (EQ + Lyrics + Sleep): ~400
- Native EQ bridge: ~200 (Swift/Kotlin)
- Audio assets: ~50MB
- Tests: ~200
