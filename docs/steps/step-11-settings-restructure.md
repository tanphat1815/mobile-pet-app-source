# Step 11 — Settings Panel Restructure (Sections + Search)

**Priority:** 11
**Effort:** Small (~3 days)
**Depends on:** Step 1 (theme) + Step 2 (themes list)
**Visible result:** Low (developer-only benefit)

---

## 1. Mô tả

### Vấn đề hiện tại
Mobile SettingsScreen (`src/screens/SettingsScreen.tsx`) có 5 sections: Account / Appearance / Notifications / Privacy & Security / About. Flat list.

Desktop (`src/renderer/settings.html`, `sidebar-categories.js`, `settings-search.js`):
- 24 categories chia sidebar: General / Theme / Pet / Personality / Breeding / Care / Tricks / Games / Quests / Achievements / Diary / Account / Admin / AI
- Settings search bar (filter rows across categories)
- Section headers + collapsible groups

### Mục tiêu
- Gom sections thành grouped categories (không nhất thiết 24, mà theo logic mobile)
- Thêm SettingsSearch component filter rows real-time

---

## 2. Giải pháp

### 2.1 Tham chiếu desktop
- `desktop-pet-app-source/src/renderer/settings/settings.js`
- `desktop-pet-app-source/src/renderer/settings/sidebar-categories.js`
- `desktop-pet-app-source/src/renderer/settings/settings-search.js`

### 2.2 Files mới
- `src/shared/components/SettingsSearch.tsx` — search input + filter logic
- `src/api/settingsCategories.ts` — port categorized rows

### 2.3 Files sửa
- `src/screens/SettingsScreen.tsx` — add search bar on top, group sections, collapsible groups
- `src/api/settings.ts` — grouped sections metadata

### 2.4 Grouped sections (mobile)
```typescript
export const SETTINGS_SECTIONS = [
  {
    group: 'GENERAL',
    sections: [
      { id: 'account', title: 'Account' },
      { id: 'appearance', title: 'Appearance' },
      { id: 'themes', title: 'Themes' },
      { id: 'notifications', title: 'Notifications' },
    ],
  },
  {
    group: 'PET',
    sections: [
      { id: 'pet', title: 'Pet Settings' },
      { id: 'care', title: 'Care & Items' },
    ],
  },
  {
    group: 'SOCIAL',
    sections: [
      { id: 'privacy', title: 'Privacy & Security' },
      { id: 'pairing', title: 'Pairing' },
      { id: 'friends', title: 'Friends' },
    ],
  },
  {
    group: 'ADVANCED',
    sections: [
      { id: 'accessibility', title: 'Accessibility' },
      { id: 'about', title: 'About' },
    ],
  },
];
```

### 2.5 Search
- `TextField` ở top với magnifying glass icon
- Filter: match `row.title` + `row.description` (case-insensitive)
- Empty state: "No settings match 'xyz'"

### 2.6 Collapsible
- Section group header click → toggle `expanded`
- Persist expanded state in AsyncStorage

---

## 3. Kết quả kỳ vọng

- Settings có search bar ở top
- Sections grouped (General/Pet/Social/Advanced)
- Collapsible groups (mặc định mở General)
- Search filter hiển thị rows matching
- Mỗi row click → drilldown screen

---

## 4. Testing

### 4.1 Playwright
```typescript
// e2e/step11-settings.spec.ts
test('search filters settings rows', async ({ page }) => {
  await page.goto('http://localhost:8081');
  await page.click('[data-testid="tab-settings"]');
  await page.fill('[data-testid="settings-search"]', 'theme');
  const visible = await page.locator('[data-testid="settings-row"]').count();
  expect(visible).toBeGreaterThan(0);
  expect(visible).toBeLessThan(20); // narrower than unfiltered
});

test('sections are collapsible', async ({ page }) => {
  await page.click('[data-testid="group-header-PET"]');
  await page.waitForTimeout(300);
  const rows = await page.locator('[data-testid="settings-section-pet"]').count();
  expect(rows).toBe(0);
});
```

### 4.2 Live check
- Search "notif" → chỉ rows liên quan
- Toggle group → collapse/expand
- Reset search → tất cả hiển thị

### 4.3 Type check
```bash
npm run typecheck
npm test
```

---

## 5. Debug

### Vấn đề 1: Search lag khi gõ
- Debounce 150ms
- Memo filter result với `useMemo`

### Vấn đề 2: Group expanded state không persist
- Lưu `expandedGroups` to AsyncStorage
- Hydrate on mount

### Vấn đề 3: Rows overlap với search
- Clear filter khi rỗng
- Group expand bị ảnh hưởng → check state reset logic

---

## 6. Definition of Done

- [ ] Search bar ở top
- [ ] Sections grouped (General / Pet / Social / Advanced)
- [ ] Collapsible groups với persistence
- [ ] Filter real-time qua search
- [ ] Empty state khi không có match
- [ ] Playwright e2e pass
- [ ] `npm run typecheck` + `npm test` pass

---

## 7. Reference

- Desktop: `src/renderer/settings/settings.js`, `sidebar-categories.js`, `settings-search.js`
- Mobile: `src/screens/SettingsScreen.tsx`

---

## 8. Estimated LOC
~250–400 lines:
- SettingsSearch: ~100
- SettingsCategories: ~80
- Sửa SettingsScreen: ~200
