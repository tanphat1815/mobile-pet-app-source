# Step 4 — Friends Advanced (Tags + Gifts + Activity Feed)

**Priority:** 4
**Effort:** Medium (~1 week)
**Depends on:** —
**Visible result:** Medium

---

## 1. Mô tả

### Vấn đề hiện tại
Mobile Friends screen (`src/screens/FriendsScreen.tsx`) có:
- Tabs: Friends / Requests / Add
- Friend presence + status
- Add bằng search/suggestion

Desktop (`desktop-pet-app-source/src/core/friends/advanced-friend-manager.js` + `src/renderer/friends/advanced-friends-view.js`) có nhiều hơn:
- **Tags** — gắn nhãn friend (Best Friend, Family, Rival, ...)
- **Gifts** — gửi/quà tặng giữa friends (gift history)
- **Activity feed** — recent events (friend level up, pet achieved)
- **Gift animations** — quà hiển thị với particle

### Mục tiêu
Port 3 tính năng: tags, gifts, activity feed sang mobile.

---

## 2. Giải pháp

### 2.1 Tham chiếu desktop
- `desktop-pet-app-source/src/core/friends/advanced-friend-manager.js`
- `desktop-pet-app-source/src/renderer/friends/advanced-friends-view.js`
- `desktop-pet-app-source/src/network/friend-gift-manager.js`

### 2.2 Files mới
- `src/shared/components/FriendTagChips.tsx` — display + edit tags
- `src/shared/components/GiftCard.tsx` — gift item renderer
- `src/shared/components/ActivityFeed.tsx` — activity feed list
- `src/shared/components/SendGiftSheet.tsx` — bottom sheet gửi quà
- `src/api/friendTags.ts` — tag CRUD
- `src/api/friendGifts.ts` — gift send/receive

### 2.3 Files sửa
- `src/api/friends.ts` — extend Friend type với `tags`, `giftsReceived`, `lastActivity`
- `src/stores/FriendStore.ts` — add `tags`, `gifts`, `activity` fields
- `src/screens/FriendsScreen.tsx` — thêm "Activity" tab + tag UI
- `src/api/friendsTypes.ts` — FriendTag, FriendGift, FriendActivity types
- `src/navigation/AppNavigator.tsx` — register ActivityFeedScreen (optional)

### 2.4 Schema
```typescript
export type FriendTag = 'best_friend' | 'family' | 'rival' | 'study_buddy' | 'gaming' | 'workout';

export interface FriendGift {
  id: string;
  fromUserId: string;
  toUserId: string;
  giftType: 'rose' | 'cake' | 'gem' | 'energy_drink' | 'book' | 'cookie';
  quantity: number;
  message?: string;
  sentAt: string;
  acknowledged: boolean;
}

export interface FriendActivity {
  id: string;
  userId: string;
  kind: 'level_up' | 'achievement' | 'new_pet' | 'quest_complete' | 'gift_sent' | 'gift_received';
  payload: Record<string, unknown>;
  createdAt: string;
}
```

### 2.5 UI changes
- FriendsScreen: thêm tab thứ 4 "Activity"
- FriendRow: tap → FriendDetailSheet hiển thị tags + gift history
- Long press friend → tag menu (multi-select preset tags)
- New FAB "Send Gift" → SendGiftSheet với gift picker

---

## 3. Kết quả kỳ vọng

- FriendsScreen có 4 tabs: Friends / Requests / Add / Activity
- Friend row hiển thị tags chips
- Tap friend → sheet hiển thị tags + gift history + activity liên quan
- Send gift flow: pick friend → pick gift type → optional message → send
- Activity feed: scroll list các event gần đây (own + friend)
- Real-time update khi friend gửi gift / level up (qua WebSocket sync)

---

## 4. Testing

### 4.1 Playwright
```typescript
// e2e/step4-friends.spec.ts
test('can tag a friend', async ({ page }) => {
  await page.goto('http://localhost:8081');
  await page.click('[data-testid="tab-friends"]');
  await page.click('[data-testid="friend-row-0"]');
  await page.click('[data-testid="add-tag-btn"]');
  await page.click('[data-testid="tag-best_friend"]');
  await page.waitForSelector('[data-testid="friend-tag-best_friend"]');
});

test('can send gift', async ({ page }) => {
  await page.click('[data-testid="friend-row-0"]');
  await page.click('[data-testid="send-gift-btn"]');
  await page.click('[data-testid="gift-rose"]');
  await page.click('[data-testid="send-confirm"]');
  await page.waitForSelector('[data-testid="gift-sent-toast"]');
});

test('activity feed updates in realtime', async ({ page, context }) => {
  await page.goto('http://localhost:8081');
  await page.click('[data-testid="tab-activity"]');
  // Trigger friend level-up via WS mock
  await page.evaluate(() => (window as any).__MOCK_WS__.emit('friend:levelup', { userId: 'friendA', level: 5 }));
  await page.waitForSelector('[data-testid="activity-levelup"]');
});
```

### 4.2 Live check
- Tap friend → sheet hiển thị đúng tags
- Send gift → toast xác nhận
- Activity feed load lần đầu + update real-time khi có event

### 4.3 So sánh desktop
Mở `desktop-pet-app-source/src/renderer/friends/advanced-friends-view.html`, screenshot tags UI + gift → compare.

### 4.4 Type check + tests
```bash
npm run typecheck
npm test
```

---

## 5. Debug

### Vấn đề 1: Tag không persist
- Check `FriendStore.updateFriend(id, { tags })` → `await friendsApi.patchFriend(id, { tags })`
- Verify backend persist (giả lập bằng AsyncStorage nếu chưa có backend)

### Vấn đề 2: Gift animation giật
- Dùng Reanimated `withSpring` cho gift card pop-in
- Set `pointerEvents: 'none'` trên animation overlay

### Vấn đề 3: Activity feed không real-time
- Verify WebSocket handler `friend:activity` event đăng ký trong `SyncManager`
- Check: `console.log(SyncManager.handlers)` để xem handler có đăng ký không

### Vấn đề 4: Tag chips overflow trên row hẹp
- Dùng `numberOfLines={1}` + `ellipsizeMode="tail"` cho tags row
- Max 3 tags hiển thị + "+N"

---

## 6. Definition of Done

- [ ] FriendsScreen có 4 tabs (Friends, Requests, Add, Activity)
- [ ] Friend tags: add/remove, render chips, persist
- [ ] Gift flow: pick friend → pick gift → send → toast
- [ ] Gift history list trong friend detail sheet
- [ ] Activity feed load + real-time update
- [ ] Playwright e2e pass
- [ ] `npm run typecheck` + `npm test` pass

---

## 7. Reference

- Desktop: `desktop-pet-app-source/src/core/friends/advanced-friend-manager.js`, `src/renderer/friends/advanced-friends-view.js`, `src/network/friend-gift-manager.js`
- Mobile: `src/screens/FriendsScreen.tsx`, `src/stores/FriendStore.ts`, `src/api/friends.ts`

---

## 8. Estimated LOC
~500–800 lines mới:
- 4 components: ~300
- 2 API files: ~150
- Sửa các file cũ: ~200
