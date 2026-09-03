# Step 2 — Seasonal + Premium Themes

**Priority:** 2
**Effort:** Medium (~3–5 days)
**Depends on:** Step 1 (theme tokens foundation)
**Visible result:** ✅ High

---

## 1. Mô tả (Description)

### Vấn đề hiện tại
Mobile chỉ có 3 theme: light / dark / auto. Desktop có **12 themes** chia 4 nhóm:

| Nhóm | Themes |
|---|---|
| Core | light (Cozy Cream), dark, auto, dev |
| Seasonal | christmas, halloween, birthday, new_year, tet, valentine |
| Premium | cyberpunk (1000), pastel (300), monochrome (500) |

Mỗi theme có:
- Color tokens (background, text, accent, border)
- Decorations: particle effect (snowflakes/ghost/confetti/fireworks/matrix/hearts), corner emojis, hat effect
- Custom CSS (cho dev theme)

### Mục tiêu
Port full 12 themes sang mobile dưới dạng token-based system:
- Theme registry: `src/utils/appThemes.ts`
- Theme switcher UI: thêm vào `Settings → Appearance`
- Decorations: render qua overlay component với Reanimated

---

## 2. Giải pháp (Solution)

### 2.1 Tham chiếu desktop
File: `desktop-pet-app-source/src/renderer/themes/app-themes.js` — đã có full 12 themes.

### 2.2 Files mới
- `src/utils/appThemes.ts` — registry, khai báo 12 themes
- `src/utils/appThemeTokens.ts` — typed tokens theo từng theme
- `src/shared/components/ThemeDecorations.tsx` — particle overlay (snowflakes/ghost/…)
- `src/shared/components/ThemePreview.tsx` — preview card dùng trong settings

### 2.3 Files sửa
- `src/api/settingsTypes.ts` — thêm `appThemeId: ThemeId`
- `src/api/settings.ts` — backend mapping cho `appThemeId`
- `src/stores/SettingsStore.ts` — thêm `appThemeId` vào state
- `src/utils/useTheme.ts` — extend để resolve `appThemeId` → token set
- `src/screens/SettingsScreen.tsx` — thêm "Themes" section

### 2.4 Schema Theme
```typescript
export type ThemeId =
  | 'auto' | 'light' | 'dark' | 'dev'
  | 'christmas' | 'halloween' | 'birthday' | 'new_year' | 'tet' | 'valentine'
  | 'cyberpunk' | 'pastel' | 'monochrome';

export interface AppTheme {
  id: ThemeId;
  name: string;
  icon: string;
  price: number;        // 0 = free
  isCore?: boolean;
  isSeasonal?: boolean;
  isPremium?: boolean;
  eventId?: string;
  description: string;
  tokens: {
    bg: { primary: string; secondary: string; tertiary: string; elevated: string };
    text: { primary: string; secondary: string; tertiary: string; onAccent: string };
    accent: string;
    accentHover: string;
    accentSoft: string;
    border: string;
    borderStrong: string;
    success: string;
    warning: string;
    danger: string;
    gradient: string;
  };
  decorations?: {
    particles?: 'snowflakes' | 'ghost' | 'confetti' | 'fireworks' | 'matrix' | 'hearts';
    corners?: [string, string, string, string];
    hat?: boolean;
  };
}
```

### 2.5 Decorations component
`ThemeDecorations.tsx`:
- Full-screen overlay (`position: absolute`, `zIndex: 0`, `pointerEvents: 'none'`)
- Render particle: `Animated.View` với `useSharedValue` random position + drift animation
- Particles render dựa trên `decorations.particles`:
  - snowflakes: `❄️`/`❅`/`✻`
  - ghost: `👻`
  - confetti: 🎊/🎉/🎈 random
  - fireworks: emoji burst mỗi 3s
  - matrix: green characters rain
  - hearts: `💖`/`💗` float
- Corners: 4 emoji ở 4 góc, fade in/out chậm

---

## 3. Kết quả kỳ vọng

- Settings → Appearance → "Themes" list 12 themes với preview card
- Chọn theme → apply ngay (preference lưu AsyncStorage + sync backend)
- Theme decorations render overlay trên Home + Chat + Friends + Settings
- Theme "Cozy Cream" là default, dark mode vẫn dùng dark token
- Seasonal theme có thể tự động apply theo ngày (optional, sang step riêng)

---

## 4. Testing

### 4.1 Playwright test
```typescript
// e2e/step2-themes.spec.ts
test('seasonal theme applies globally', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('http://localhost:8081');
  // Settings → Themes → Christmas
  await page.click('[data-testid="settings-appearance"]');
  await page.click('[data-testid="theme-card-christmas"]');
  // Verify bg is christmas red
  const bg = await page.evaluate(() =>
    getComputedStyle(document.querySelector('[data-testid="app-root"]')!).backgroundColor
  );
  expect(bg).toBe('rgb(30, 10, 10)'); // #1E0A0A
});

test('decorations render', async ({ page }) => {
  await page.click('[data-testid="theme-card-christmas"]');
  await page.click('[data-testid="tab-home"]');
  const particles = await page.locator('[data-testid="particle-snowflake"]').count();
  expect(particles).toBeGreaterThan(0);
});
```

### 4.2 Live check
```bash
npm run web
# Mở http://localhost:8081, vào Settings → Appearance → Themes
# Click qua từng theme, verify:
# 1. Background đổi
# 2. Particles render (cho seasonal)
# 3. Corner emojis hiển thị
```

### 4.3 So sánh với desktop
Mở `desktop-pet-app-source/src/renderer/themes/theme-preview.html` ở browser, chụp 12 theme previews → so với mobile.

### 4.4 Type check + tests
```bash
npm run typecheck
npm test
```

---

## 5. Debug

### Vấn đề 1: Particle giật, performance thấp
- Nguyên nhân: too many Animated.View
- Fix: giới hạn particle count (max 20), dùng `useReducedMotion` để tắt animation

### Vấn đề 2: Corner emoji che nội dung
- Fix: `pointerEvents: 'none'` + low opacity (0.3)

### Vấn đề 3: Theme không persist sau reload
- Kiểm tra `SettingsStore.setAppTheme` → `AsyncStorage.setItem('settings', …)`
- Verify: `await AsyncStorage.getItem('settings')` → JSON.parse → `.appThemeId`

### Vấn đề 4: Premium theme không unlock khi user chưa mua
- Thêm `wallet` check trước khi apply. Nếu chưa đủ coin → snackbar "Không đủ tiền"

### Vấn đề 5: Seasonal theme apply ngoài mùa
- Theme registry có `eventId`; SettingsStore check ngày hiện tại vs event window; nếu ngoài window → theme vẫn dùng được nhưng ẩn decoration

---

## 6. Definition of Done

- [ ] 12 themes trong `appThemes.ts`, mỗi theme có tokens đầy đủ
- [ ] `appThemeId` lưu + sync với backend
- [ ] Settings → Appearance có theme grid với preview
- [ ] Decorations overlay render đúng (particles + corners)
- [ ] Performance: < 16ms frame trên Expo Go (test với 20 particles)
- [ ] Playwright e2e pass
- [ ] Screenshot 12 themes match desktop preview
- [ ] `npm run typecheck` + `npm test` pass

---

## 7. Reference

- `desktop-pet-app-source/src/renderer/themes/app-themes.js` (12 themes)
- `desktop-pet-app-source/src/renderer/themes/theme-manager.js` (apply CSS vars)
- `desktop-pet-app-source/src/renderer/themes/theme-preview.js`
- `desktop-pet-app-source/src/renderer/themes/custom-theme-builder.js`
- Mobile files: `src/utils/theme.ts`, `src/utils/useTheme.ts`, `src/stores/SettingsStore.ts`, `src/screens/SettingsScreen.tsx`

---

## 8. Estimated LOC
~600–900 lines mới:
- `appThemes.ts`: ~400 (12 themes × 30 lines)
- `ThemeDecorations.tsx`: ~150
- `ThemePreview.tsx`: ~80
- Sửa các file cũ: ~200
