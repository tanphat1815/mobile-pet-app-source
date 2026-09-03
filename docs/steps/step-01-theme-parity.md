# Step 1 — Theme Parity (Cozy Cream + Visual Token Alignment)

**Priority:** 1 (highest — most visible to users)
**Effort:** Small (~1–2 days)
**Depends on:** —
**Visible result:** ✅ High

---

## 1. Mô tả (Description)

### Vấn đề hiện tại
Mobile (`mobile-pet-app-source`) đang dùng theme Apple HIG từ `src/utils/theme.ts` — background `#FFFFFF` (white) / `#1C1C1E` (dark), accent `#007AFF` (royal blue). Theme này lạnh, phẳng, không tạo cảm giác "companion" mà giống app productivity.

Desktop (`desktop-pet-app-source/src/renderer/themes/app-themes.js`) đã có theme "**Cozy Cream**" cho light mode: background `#FAF7F2` (kem ấm), accent `#007AFF` nhưng text & border tone warmer (`#1E2024`, `#EAE4D9`). Phong cách **Creamy & Bento Canvas**, dễ chịu, gợi cảm giác "pet home".

### Mục tiêu step này
Đổi toàn bộ theme tokens của mobile sang **Cozy Cream (light) + Dark (giữ nguyên giá trị cũ)** giống desktop, sao cho:
- Light mode background chuyển từ trắng → kem ấm
- Border tone chuyển từ xám lạnh → be ấm
- Text primary chuyển từ `#1C1C1E` → vẫn tối nhưng tone hơi ấm (`#1E2024`)
- Card shadow thành "bento" mềm hơn

### Phạm vi
**Trong scope:**
- `src/utils/theme.ts` — đổi toàn bộ token light
- `app.json` — đổi `userInterfaceStyle` nếu cần
- (Optional) `src/shared/components/PetAvatar.tsx` — warm mood ring
- (Optional) `src/shared/components/Card.tsx` — bento shadow

**Ngoài scope** (sang step khác):
- Seasonal themes (Step 2)
- Premium themes (Step 2)
- Per-chat bubble themes (Step 5)

---

## 2. Giải pháp (Solution)

### 2.1 Tham chiếu desktop
- File: `desktop-pet-app-source/src/renderer/themes/app-themes.js` (đã đọc)
- Token `light`:
  - `--bg-primary: #FAF7F2` (kem ấm)
  - `--bg-secondary: #FFFDF9` (kem sáng)
  - `--bg-tertiary: #F2EDE4` (kem đậm)
  - `--bg-elevated: #FFFFFF` (trắng cho card nổi)
  - `--text-primary: #1E2024`
  - `--text-secondary: #686E78`
  - `--text-tertiary: #989EA8`
  - `--border: #EAE4D9` (be ấm)
  - `--border-strong: #D8D0C2`
  - `--gradient-bg: linear-gradient(180deg, #FAF7F2 0%, #F5EFE6 100%)`

### 2.2 Thay đổi file `src/utils/theme.ts`
Đọc file hiện tại:

```bash
# Trong repo:
cat src/utils/theme.ts
```

Sửa `light` palette:
- `bg`: `['#FFFFFF', '#F2F2F7', '#E5E5EA']` → `['#FAF7F2', '#FFFDF9', '#F2EDE4']`
- `surface`: giữ `#FFFFFF` (card nổi trên nền kem)
- `border`: `#E5E5EA` → `#EAE4D9`
- `text.primary`: `#1C1C1E` → `#1E2024`
- `text.secondary`: `#686E78` (giữ)
- `shadow.sm/ md/ lg`: thêm shadow bento mềm, blur tăng 2px, opacity giảm

Dark giữ nguyên (đã match desktop `--bg-primary: #1C1C1E`, …).

### 2.3 Thay đổi `app.json`
Đảm bảo:
```json
{
  "expo": {
    "userInterfaceStyle": "automatic",
    "ios": { "userInterfaceStyle": "automatic" },
    "android": { "userInterfaceStyle": "automatic" }
  }
}
```

### 2.4 Thay đổi `src/shared/components/PetAvatar.tsx`
- Mood ring color (hiện dùng `theme.colors.accent`): warm shift → `#FF9F1C` (cam ấm) khi mood=happy, `#FFB6C1` (hồng pastel) khi tired. Pattern: derived từ `mood` prop, không hard-code.

### 2.5 Thay đổi `src/shared/components/Card.tsx`
- Bento shadow:
  - iOS: `shadowColor: '#1E2024'`, `shadowOpacity: 0.06`, `shadowRadius: 16`, `shadowOffset: {width: 0, height: 4}`
  - Android: `elevation: 3`
- Border radius giữ 16px (đã có)

---

## 3. Kết quả kỳ vọng (Expected Outcome)

| Vùng UI | Trước | Sau |
|---|---|---|
| Home background | Trắng `#FFFFFF` | Kem ấm `#FAF7F2` |
| Card | Trắng trên trắng | Trắng `#FFFFFF` nổi trên kem, shadow mềm |
| Border | Xám `#E5E5EA` | Be `#EAE4D9` |
| Text primary | Đen lạnh `#1C1C1E` | Đen ấm `#1E2024` |
| Dark mode | Giữ nguyên `#1C1C1E` | Giữ nguyên |

Verify screenshot: light home screen giống `desktop-pet-app-source/src/renderer/themes/theme-preview.js` — theme "Sáng (Cozy Cream)".

---

## 4. Testing (Kiểm thử)

### 4.1 Visual regression test (Playwright + Expo Web)
Expo SDK hỗ trợ web build. Mở app ở mode web:

```bash
npm run web
# Mở http://localhost:8081
```

Dùng Playwright chụp & so sánh:
- Light mode Home → screenshot1.png
- Dark mode Home → screenshot2.png
- Light mode Settings → screenshot3.png
- Switch theme live → no FOUC

### 4.2 Automated Playwright script
Tạo file `e2e/step1-theme.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test('home screen uses Cozy Cream tokens in light mode', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('http://localhost:8081');
  // Wait for app to mount
  await page.waitForSelector('[data-testid="home-screen"]');
  const bg = await page.evaluate(() =>
    getComputedStyle(document.querySelector('[data-testid="home-screen"]')!).backgroundColor
  );
  expect(bg).toBe('rgb(250, 247, 242)'); // #FAF7F2
});

test('dark mode unchanged', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('http://localhost:8081');
  await page.waitForSelector('[data-testid="home-screen"]');
  const bg = await page.evaluate(() =>
    getComputedStyle(document.querySelector('[data-testid="home-screen"]')!).backgroundColor
  );
  expect(bg).toBe('rgb(28, 28, 30)'); // #1C1C1E
});
```

### 4.3 Live server check
Sau khi sửa, chạy:
```bash
npm start
```
Mở Expo Go → load app → screenshot Home/Settings/Profile/Chat ở cả light & dark → diff với desktop.

### 4.4 Type check
```bash
npm run typecheck
```

### 4.5 Vitest (nếu có test theme)
```bash
npm test
```

---

## 5. Debug (Gỡ lỗi)

### Vấn đề thường gặp

**Vấn đề 1: Đổi token nhưng UI không update**
- Nguyên nhân: style sheet cache cũ
- Fix: kill Metro bundler (`Ctrl+C`), `npm start --reset-cache`

**Vấn đề 2: Background vẫn trắng trên Android**
- Nguyên nhân: Android `userInterfaceStyle` default `light`
- Fix: thêm `"android": { "userInterfaceStyle": "automatic" }` vào `app.json`

**Vấn đề 3: Border không nhìn thấy ở theme sáng**
- Nguyên nhân: shadow iOS không render trên Expo Go (do Fast Refresh)
- Fix: rebuild app hoàn toàn: `expo start -c`

**Vấn đề 4: Card shadow quá mạnh**
- Điều chỉnh: `shadowOpacity: 0.04` thay vì 0.06

**Vấn đề 5: Token name clash với file khác**
- Tìm: `grep -r "theme.colors.bg" src/`
- Đảm bảo tất cả import từ `utils/theme`, không hard-code hex

### Debug commands
```bash
# Tìm hard-coded hex còn sót:
grep -rE "#[0-9A-Fa-f]{6}" src/ | grep -v "// " | grep -v "tokens"

# Verify theme file changed:
git diff src/utils/theme.ts
```

---

## 6. Definition of Done (Hoàn thành khi)

- [ ] `src/utils/theme.ts` light palette match desktop `app-themes.js` (`#FAF7F2` bg, `#EAE4D9` border, `#1E2024` text)
- [ ] Dark palette không đổi
- [ ] `npm run web` chạy không lỗi
- [ ] Playwright e2e test pass
- [ ] Screenshot light mode giống desktop theme preview
- [ ] Không hard-code hex còn sót (grep sạch)
- [ ] `npm run typecheck` pass
- [ ] Commit + push + tạo PR với screenshot diff

---

## 7. Reference (Tham chiếu)

- Desktop file: `desktop-pet-app-source/src/renderer/themes/app-themes.js` (đoạn `light:` từ line 23–58)
- Desktop shared tokens: `desktop-pet-app-source/src/renderer/shared/tokens.css`
- Desktop theme preview: `desktop-pet-app-source/src/renderer/themes/theme-preview.js`
- Mobile file sửa: `mobile-pet-app-source/src/utils/theme.ts`, `src/shared/components/PetAvatar.tsx`, `src/shared/components/Card.tsx`, `app.json`

---

## 8. Estimated LOC change
~80–150 lines (theme.ts ~50, Card.tsx ~20, PetAvatar.tsx ~30)
