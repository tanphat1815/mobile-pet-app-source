# Mobile Pet — Desktop Parity Roadmap

> **Mục đích:** Map toàn bộ tính năng desktop (CyberPet) sang mobile, chia thành 16 step có thể làm tuần tự, mỗi step là 1 file riêng có spec đầy đủ.

---

## Status

| # | Step | Effort | Visible | Status |
|---|------|--------|---------|--------|
| 1 | [Theme parity](./step-01-theme-parity.md) | Small | ✅ High | ✅ Done |
| 2 | [Seasonal + Premium themes](./step-02-seasonal-premium-themes.md) | Medium | ✅ High | ✅ Done |
| 3 | [Animated pet sprite FSM](./step-03-animated-pet-sprite.md) | Large | ✅ Highest | ✅ Done |
| 4 | [Friends advanced (tags/gifts/activity)](./step-04-friends-advanced.md) | Medium | Medium | ✅ Done |
| 5 | [Chat enrichment (emoji/stickers/image/actions)](./step-05-chat-enrichment.md) | Med-Large | ✅ High | ✅ Done |
| 6 | [Quests upgrade](./step-06-quests-upgrade.md) | Small-Med | Medium | ✅ Done |
| 7 | [Rich profile + avatar frames](./step-07-rich-profile.md) | Small-Med | Medium | ✅ Done |
| 8 | [Achievements parity + toast](./step-08-achievements-parity.md) | Small | Medium | ✅ Done |
| 9 | [Notification center + banner](./step-09-notification-center.md) | Small | Medium | ✅ Done |
| 10 | [Pet care actions (bath/medicine/vitamin)](./step-10-pet-care-actions.md) | Small | Medium | ✅ Done |
| 11 | [Settings panel restructure](./step-11-settings-restructure.md) | Small | Low | ✅ Done |
| 12a | [Wellness](./step-12a-wellness.md) | Large | ✅ High | ✅ Done |
| 12b | [Music](./step-12b-music.md) | Large | ✅ High | ✅ Done |
| 12c | [Adventure](./step-12c-adventure.md) | Large | ✅ High | ✅ Done |
| 12d | [AI Chatbot BYOK](./step-12d-ai-chatbot.md) | Large | ✅ High | ✅ Done |
| 12e | [Pet Tricks / Training](./step-12e-tricks.md) | Medium | ✅ High | ✅ Done |
| 13 | [Admin / diagnostics lite](./step-13-admin-diagnostics.md) | Small | Dev only | ✅ Done |

---

## Recommended execution order

Đã ưu tiên theo: **visual/theme parity (thấy ngay) → pet (nền tảng) → social → meta loop → power features**.

### Phase 1 — Visual foundation (1 tuần)
- **Step 1** Theme parity Cozy Cream ← *bắt đầu ở đây*
- **Step 2** Seasonal/premium themes

### Phase 2 — Pet product transformation (2 tuần)
- **Step 3** Animated pet sprite ← *transformative*
- **Step 10** Pet care actions (gắn liền sprite FSM)

### Phase 3 — Social & chat (2 tuần)
- **Step 5** Chat enrichment ← *high visible*
- **Step 4** Friends advanced

### Phase 4 — Polish meta loop (1 tuần)
- **Step 7** Rich profile
- **Step 6** Quests upgrade
- **Step 8** Achievements + toast
- **Step 9** Notification center

### Phase 5 — Settings + dev (3 ngày)
- **Step 11** Settings restructure
- **Step 13** Admin diagnostics

### Phase 6 — Power features (8–10 tuần, mỗi cái 1 PR)
- **Step 12a** Wellness
- **Step 12b** Music
- **Step 12c** Adventure
- **Step 12d** AI Chatbot

---

## Conventions cho mỗi step

Mỗi step file có cấu trúc đồng nhất:

1. **Mô tả** — vấn đề hiện tại + mục tiêu
2. **Giải pháp** — file mới + file sửa + schema + UI layout
3. **Kết quả kỳ vọng** — bảng so sánh trước/sau
4. **Testing** — Playwright e2e + live check + so sánh với desktop
5. **Debug** — vấn đề thường gặp + cách fix
6. **Definition of Done** — checklist
7. **Reference** — file desktop tham chiếu
8. **Estimated LOC** — ước lượng code

---

## Workflow mỗi step

```bash
# 1. Tạo branch
git checkout -b feat/step-XX-name

# 2. Đọc step file
cat docs/steps/step-XX-name.md

# 3. Implement
# (theo file plan)

# 4. Type check
npm run typecheck

# 5. Tests
npm test
npm run test:e2e -- step-XX  # nếu có Playwright

# 6. Live check
npm run web   # hoặc npm start + Expo Go
# Mở browser, compare với desktop screenshot

# 7. Commit
git add .
git commit -m "Step XX: <short description>"

# 8. Push + PR
git push origin feat/step-XX-name
gh pr create --title "Step XX: ..." --body "..."
```

---

## Test infrastructure

### Setup Playwright (1 lần)

```bash
npm install --save-dev @playwright/test
npx playwright install
```

Tạo `playwright.config.ts`:
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:8081',
    headless: true,
  },
  webServer: {
    command: 'npm run web',
    port: 8081,
    reuseExistingServer: true,
  },
});
```

### So sánh với desktop

Mỗi step có **Desktop visual reference** ở mục Reference. Để so sánh:

```bash
# 1. Mở desktop preview page
# Example step 1: theme-preview.html
start desktop-pet-app-source/src/renderer/themes/theme-preview.html

# 2. Chụp screenshot từng theme

# 3. Chạy mobile web + chụp screenshot
npm run web
# → Expo DevTools → mở browser http://localhost:8081
# → dùng Playwright hoặc thủ công chụp

# 4. So sánh visual (eyeball hoặc visual regression tool như Percy/Chromatic)
```

### Live server check pattern

```typescript
// e2e/live-server-check.spec.ts
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('[data-testid="app-root"]', { timeout: 15000 });
  // Mock realtime WS
  await page.evaluate(() => {
    (window as any).__MOCK_WS__ = {
      listeners: new Map(),
      emit(event: string, payload: unknown) {
        this.listeners.get(event)?.forEach((l: any) => l(payload));
      },
      on(event: string, listener: any) {
        const arr = this.listeners.get(event) || [];
        arr.push(listener);
        this.listeners.set(event, arr);
      },
    };
  });
});
```

---

## Tracking progress

Update `Status` column trong bảng trên sau mỗi step:

- ⏸ Not started
- 🚧 In progress
- ✅ Done
- ⚠️ Blocked (ghi rõ lý do)

Khi step X done → nhớ update reference trong step X+1 (nếu có).

---

## Common blockers

### 1. Backend không có endpoint mới
- Một số step cần backend API (chat upload, gift, adventure sessions, AI keys)
- Giải pháp: dùng AsyncStorage local + WebSocket mock để dev front-end trước
- Team backend sync sau

### 2. Sprite asset chưa có
- Step 3 cần sprite sheets PNG
- Workaround: dùng emoji fallback trong 1 sprint, sau đó mới port sprite thật
- Hoặc: design team tạo sprite trong 1-2 tuần parallel

### 3. Audio assets
- Step 12a (wellness) + 12b (music) cần audio files MP3 (~50MB total)
- Workaround: bundle 1-2 audio demo, các cái khác remote

### 4. Native modules
- Step 12b EQ cần native bridge
- Workaround: ship without EQ first iteration (just player + lyrics)

---

## Kết quả cuối cùng (khi cả 16 step done)

- Mobile có visual parity ~95% với desktop (theme + pet sprite + chat)
- Feature parity ~80% (admin/diagnostics n/a cho mobile end-user)
- Đặc trưng mobile: biometric login, 6-digit pairing, Expo push, native audio
- Single codebase easily maintainable (TypeScript, React Native, Expo SDK 57)
- Có thể ship Production build cho cả iOS + Android

---

## Các step documents khác

- [EAS Build Setup](./eas-build.md) — build iOS/Android
- [Testing Guide](./testing.md) — test strategy
