# Step 9 — In-App Notification Center + Banner

**Priority:** 9
**Effort:** Small (~2–3 days)
**Depends on:** —
**Visible result:** Medium

---

## 1. Mô tả

### Vấn đề hiện tại
Mobile (`src/api/NotificationService.ts`, `src/stores/NotificationStore.ts`):
- Push notification qua Expo (token registered)
- Local notification scheduling
- Badge count

Desktop (`src/renderer/notifications/notification-center.js`, `banner.js`):
- In-app notification center (bell icon + slide-down panel)
- Banner dạng toast (slide down)
- Grouped by day ("Today", "Yesterday", "Earlier")
- Mark all read / Mark single read

### Mục tiêu
- Thêm bell icon ở Home header
- Tap bell → slide-down panel với notification list
- In-app toast banner cho realtime event (gift received, friend request, achievement, quest complete)

---

## 2. Giải pháp

### 2.1 Tham chiếu desktop
- `desktop-pet-app-source/src/renderer/notifications/notification-center.js`
- `desktop-pet-app-source/src/renderer/notifications/banner.js`
- `desktop-pet-app-source/src/core/notifications/notification-manager.js`

### 2.2 Files mới
- `src/shared/components/NotificationCenter.tsx` — slide-down panel
- `src/shared/components/NotificationItem.tsx` — render notification card
- `src/shared/components/NotificationBell.tsx` — bell icon + badge count
- `src/shared/components/NotificationBanner.tsx` — top toast
- `src/api/notificationCenter.ts` — group by day, mark read

### 2.3 Files sửa
- `src/stores/NotificationStore.ts` — track `history: NotificationItem[]`, `unreadCount`
- `src/api/NotificationService.ts` — persist to AsyncStorage (`@notification_history`)
- `src/screens/HomeScreen.tsx` — header có bell icon
- `src/navigation/AppNavigator.tsx` — wrap root với `NotificationBannerHost`

### 2.4 Schema
```typescript
export type NotificationKind =
  | 'friend_request' | 'friend_accept' | 'gift_received'
  | 'achievement_unlocked' | 'quest_complete' | 'pet_levelup'
  | 'chat_message' | 'system_announcement';

export interface NotificationItem {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  iconEmoji: string;
  readAt?: string;
  receivedAt: string;
  payload?: Record<string, unknown>; // deeplink data
}
```

### 2.5 UI Components

**Bell icon (Home header):**
```
[Home Screen Title]              🔔3
                                  ↑ unread badge
```

**Notification Center (slide-down panel):**
```
+-- Notifications --------------+
| Today                          |
| 🐱 Pet leveled up to 12  2h   |
| 🎁 You received a gift  5h    |
| Yesterday                     |
| 🏆 Achievement: First Bath    |
| Mark all read                  |
+-------------------------------+
```

**Banner (top toast):**
```
+--------------------------------+
| 🎁 You received a gift from X  |
+--------------------------------+
```

### 2.6 Trigger flow
1. Realtime event từ WebSocket (`notification:new`)
2. Push to `NotificationStore.history`
3. Increment `unreadCount`
4. Render Banner qua `NotificationBannerHost`
5. Tap banner → navigate deep link + mark read

### 2.7 Persistence
- Store history to `@notification_history` AsyncStorage
- On app start: load → set state

---

## 3. Kết quả kỳ vọng

- Home header có bell icon với unread badge
- Tap bell → slide-down panel hiển thị notifications grouped theo Today/Yesterday/Earlier
- Tap notification → navigate deep link
- Mark all read → reset badge
- Realtime event → top banner slide-down + auto dismiss sau 4s
- Notification history persist sau app restart

---

## 4. Testing

### 4.1 Playwright
```typescript
// e2e/step9-notif.spec.ts
test('bell shows unread count', async ({ page }) => {
  await page.goto('http://localhost:8081');
  await page.evaluate(() => (window as any).__MOCK_WS__.emit('notification:new', {
    id: 'n1', kind: 'gift_received', title: 'Gift received', body: 'From Alice', iconEmoji: '🎁',
  }));
  const badge = await page.textContent('[data-testid="bell-badge"]');
  expect(badge).toBe('1');
});

test('notification center shows grouped list', async ({ page }) => {
  await page.click('[data-testid="notification-bell"]');
  await page.waitForSelector('[data-testid="notification-center"]');
  await page.waitForSelector('[data-testid="group-today"]');
});

test('mark all read resets badge', async ({ page }) => {
  await page.click('[data-testid="mark-all-read"]');
  await page.waitForSelector('[data-testid="bell-badge"]', { state: 'hidden' });
});
```

### 4.2 Live check
- Mở app → bell hiển thị badge
- Click bell → panel mở
- Trigger notification (qua WS mock) → banner trượt xuống
- Reload app → history persist

### 4.3 So sánh desktop
Mở `desktop-pet-app-source/src/renderer/notifications/notification-center.html` → so sánh layout.

### 4.4 Type check
```bash
npm run typecheck
npm test
```

---

## 5. Debug

### Vấn đề 1: Notification không real-time
- Verify WebSocket subscription trong `SyncManager`
- Check handler: `SyncManager.handlers['notification:new']`

### Vấn đề 2: Banner che UI
- `pointerEvents: 'box-none'` (banner không chặn tap)
- `top: insets.top + 8` để dưới status bar

### Vấn đề 3: History quá dài
- Limit 100 latest, auto-clean older than 30 days
- "View older" → load more (pagination)

### Vấn đề 4: Badge sai số
- Track increment/decrement cẩn thận
- Recompute từ `history.filter(n => !n.readAt).length` mỗi render

### Vấn đề 5: Deep link không hoạt động
- Đăng ký scheme trong `app.json`: `"scheme": "mobilePet"`
- Use `Linking.openURL('mobilePet://friends/<id>')`

---

## 6. Definition of Done

- [ ] Bell icon + unread badge ở Home header
- [ ] Notification Center panel (group by day)
- [ ] Notification Banner slide-down (top toast)
- [ ] Mark single/all read
- [ ] Deeplink navigation từ notification
- [ ] History persist qua AsyncStorage
- [ ] Playwright e2e pass
- [ ] `npm run typecheck` + `npm test` pass

---

## 7. Reference

- Desktop: `src/renderer/notifications/notification-center.js`, `banner.js`, `src/core/notifications/notification-manager.js`
- Mobile: `src/api/NotificationService.ts`, `src/stores/NotificationStore.ts`, `src/screens/HomeScreen.tsx`

---

## 8. Estimated LOC
~400–700 lines:
- 4 components mới: ~350
- API extension: ~80
- Sửa các file cũ: ~150
