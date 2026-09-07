# Step 13 — Admin / Diagnostics Lite

**Priority:** 13
**Effort:** Small (~2 days)
**Depends on:** —
**Visible result:** Dev-only (not user-facing)

---

## 1. Mô tả

### Vấn đề hiện tại
Mobile chưa có admin/diagnostics tool. Hỗ trợ debug & QA rất khó khăn khi có bug report từ user.

Desktop (`src/core/admin/admin-manager.js`, `src/renderer/admin/admin-dashboard-view.js`):
- **Telemetry**: events counter, error log
- **Memory/RAM usage** (Electron process stats)
- **Versions** (app, models, sync)
- **Pet state editor** (override stats cho test)
- **Wallet top-up** (debug coins)
- **Backup/restore** (export/import local data)
- **Simulated competitions** (test events)

### Mục tiêu
Port 1 phiên bản lite của admin dashboard cho mobile, ẩn sau developer flag (3-tap logo hoặc shake gesture):
- App info (version, build, platform)
- Sync events counter (received, sent, errors)
- AsyncStorage inspector (read/write key-value)
- Pet state debug override
- Reset cache button
- Fake data generator (optional)

---

## 2. Giải pháp

### 2.1 Tham chiếu desktop
- `desktop-pet-app-source/src/core/admin/admin-manager.js`
- `desktop-pet-app-source/src/renderer/admin/admin-dashboard-view.js`

### 2.2 Files mới
- `src/screens/AdminDashboardScreen.tsx` — main admin UI
- `src/api/diagnostics.ts` — telemetry collection
- `src/api/storageInspector.ts` — AsyncStorage debug
- `src/api/devTools.ts` — fake data, pet overrides
- `src/shared/components/DevShortcutGate.tsx` — secret gesture detector

### 2.3 Files sửa
- `src/screens/AboutScreen.tsx` — 3-tap logo → open admin
- `src/screens/SettingsScreen.tsx` — show dev mode if `__DEV__`
- `src/navigation/AppNavigator.tsx` — register AdminScreen (conditional)
- `app.json` — version sync

### 2.4 Schema
```typescript
export interface TelemetrySnapshot {
  appVersion: string;
  buildNumber: string;
  platform: 'ios' | 'android' | 'web';
  sessionStartedAt: string;
  eventsSent: number;
  eventsReceived: number;
  errorsLogged: number;
  storageUsageKB: number;
  freeMemoryMB?: number;     // native only
  wsConnected: boolean;
}

export interface StorageItem {
  key: string;
  sizeBytes: number;
  type: 'string' | 'json' | 'binary';
}
```

### 2.5 Layout
```
+-- Developer Dashboard ---------+
| App Info                       |
| Version:  0.1.0 (build 1)     |
| Platform: ios                  |
| Build:  development           |
+-------------------------------+
| Sync Status                   |
| WS connected: ✓               |
| Events sent:    124           |
| Events received: 87           |
| Errors: 0                      |
+-------------------------------+
| Storage Inspector             |
| [search key...]                |
| auth → {...} (2.1 KB)         |
| settings → {...} (1.5 KB)     |
| chat_history → {...} (24 KB) |
| [Clear All]                   |
+-------------------------------+
| Pet Override (Debug)          |
| Hunger:    [slider 0-100]   │
| Happiness: [slider 0-100]   │
| Energy:    [slider 0-100]   │
| [Apply]                       |
+-------------------------------+
| Tools                         |
| [Generate Fake Data]          |
| [Reset Cache]                 |
| [Re-login]                    |
| [Open Web Inspector]          |
+-------------------------------+
```

### 2.6 Hidden unlock
- AboutScreen logo 3-tap trong 2s → show Admin link
- Hoặc: shake gesture (`accelerometer` từ `expo-sensors`)
- Production builds: ẩn hoàn toàn trừ khi `__DEV__`

### 2.7 Fake data generator
- Generate random friends, gifts, achievements unlocked
- Reset pet stats to extremes
- Push 10 fake notifications
- Useful for QA testing screens

---

## 3. Kết quả kỳ vọng

- AdminDashboardScreen access từ About (3-tap)
- Show app info, sync status, storage list, pet override
- Tools: fake data + reset cache + re-login
- Web inspector link
- Ẩn hoàn toàn nếu `__DEV__ = false` (production)

---

## 4. Testing

### 4.1 Playwright
```typescript
// e2e/step13-admin.spec.ts
test('admin opens via secret tap', async ({ page }) => {
  await page.goto('http://localhost:8081');
  await page.click('[data-testid="tab-settings"]');
  await page.click('[data-testid="section-about"]');
  await page.locator('[data-testid="app-logo"]').click({ clickCount: 3 });
  await page.waitForSelector('[data-testid="admin-screen"]');
});

test('storage inspector lists keys', async ({ page }) => {
  // Inject some data
  await page.evaluate(() => AsyncStorage.setItem('foo', 'bar'));
  await page.goto('/admin');
  await page.waitForSelector('[data-testid="storage-row-foo"]');
  const value = await page.textContent('[data-testid="storage-row-foo"]');
  expect(value).toContain('"bar"');
});

test('pet override applies', async ({ page }) => {
  await page.click('[data-testid="tab-home"]');
  await page.evaluate(() => (window as any).__ADMIN__.overridePet({ hunger: 0 }));
  await page.waitForFunction(() => (window as any).__PET_DEBUG__.stats.hunger === 0);
});
```

### 4.2 Live check
- Open About → 3-tap logo → admin screen
- View storage → see real keys
- Pet override → stats change
- Reset cache → data clear

### 4.3 So sánh desktop
Mở `desktop-pet-app-source/src/renderer/admin/admin-dashboard-view.html` → so sánh fields list.

### 4.4 Type check
```bash
npm run typecheck
npm test
```

---

## 5. Debug

### Vấn đề 1: Secret tap không trigger
- Verify onPress callback (3 taps < 2s window)
- Use `useRef` để track tap count

### Vấn đề 2: Storage inspector quá chậm với nhiều keys
- Paginate hoặc limit 50 keys + "Show more"

### Vấn đề 3: Override không apply realtime
- PetStore.subscribe → setState trong AdminScreen
- Sau override → trigger re-render ở HomeScreen

### Vấn đề 4: Reset cache phá vỡ app
- Confirmation dialog: "Reset cache sẽ đăng xuất bạn. Tiếp tục?"
- Cancel + Confirm buttons

### Vấn đề 5: Production build vẫn show admin
- Guard: `if (!__DEV__) return null;`
- Hoặc: hard-code require secret code (e.g., long-press About logo + enter PIN)

---

## 6. Definition of Done

- [ ] AdminDashboardScreen accessible via 3-tap
- [ ] App info section
- [ ] Sync status section
- [ ] Storage inspector (list keys + value preview)
- [ ] Pet override sliders
- [ ] Reset cache button (with confirm)
- [ ] Generate fake data button
- [ ] Web inspector link
- [ ] Production builds: hidden
- [ ] Playwright e2e pass
- [ ] `npm run typecheck` + `npm test` pass

---

## 7. Reference

- Desktop: `src/core/admin/admin-manager.js`, `src/renderer/admin/admin-dashboard-view.js`
- Mobile: `src/screens/AboutScreen.tsx`, `src/screens/SettingsScreen.tsx`

---

## 8. Estimated LOC
~400–700 lines:
- AdminDashboardScreen: ~300
- Diagnostics + storage inspector + devTools: ~200
- Hidden unlock: ~50
- Tests: ~100
