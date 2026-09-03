# Step 7 — Rich Profile (Banner + Bio + Title + Avatar Frames + Friend Code)

**Priority:** 7
**Effort:** Small-Medium (~3–5 days)
**Depends on:** Step 1 (theme tokens)
**Visible result:** Medium

---

## 1. Mô tả

### Vấn đề hiện tại
Mobile ProfileScreen (`src/screens/ProfileScreen.tsx`):
- Avatar + display name + member-since
- 4 stat cards (pet level, friends, achievements, day streak)
- Edit modal: display name, avatar URL

Desktop (`src/renderer/profile/profile-view.js`, `profile-editor.js`, `avatar-frames.js`):
- **Banner** (cover image) phía trên
- **Avatar frame** (Silver/Gold/Diamond/Legendary/Sakura/Anime/Christmas)
- **Title badge** ("Legendary Pet Parent")
- **Bio** text
- **Friend code pill** (6-char code để pair)
- **Social platform chips** (Discord, Twitter, Instagram, …)
- Pet showcase row

### Mục tiêu
Port rich profile UI sang mobile: banner, avatar frames, title, bio, friend code pill, social chips.

---

## 2. Giải pháp

### 2.1 Tham chiếu desktop
- `desktop-pet-app-source/src/renderer/profile/profile-view.js`
- `desktop-pet-app-source/src/renderer/profile/profile-editor.js`
- `desktop-pet-app-source/src/renderer/profile/avatar-frames.js`

### 2.2 Files mới
- `src/shared/components/AvatarFrame.tsx` — wrap avatar với frame border
- `src/shared/components/BannerBackground.tsx` — banner gradient hoặc image
- `src/shared/components/FriendCodePill.tsx` — mã share
- `src/shared/components/TitleBadge.tsx` — title rank chip
- `src/shared/components/SocialChips.tsx` — social platform icons
- `src/api/avatarFrames.ts` — frame definitions port từ desktop

### 2.3 Files sửa
- `src/screens/ProfileScreen.tsx` — major refactor: thêm banner, avatar frame, title, bio, friend code, social
- `src/screens/ProfileScreen.tsx` — expand edit modal: bio, title, frame picker, banner URL, social handles
- `src/api/settingsTypes.ts` — `Profile` interface thêm: `bio`, `title`, `frameId`, `bannerUrl`, `socials`
- `src/api/settings.ts` — `saveProfile` map các field mới

### 2.4 Schema
```typescript
export interface AvatarFrameDef {
  id: string;
  name: string;
  price: number;        // 0 = unlocked by default / by achievement
  borderWidth: number;
  borderColor: string;
  glowColor?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockCondition?: string;
}

export interface Profile {
  userId: string;
  displayName: string;
  avatarUrl: string;
  bannerUrl?: string;
  bio?: string;
  title?: string;
  frameId?: string;
  friendCode: string;
  socials?: {
    discord?: string;
    twitter?: string;
    instagram?: string;
    tiktok?: string;
    twitch?: string;
  };
  memberSince: string;
  stats: {
    petLevel: number;
    friends: number;
    achievements: number;
    dayStreak: number;
  };
}
```

### 2.5 UI Layout
```
+-------------------------------------+
|       Banner (gradient/image)        |
|     [Edit]      [Share Profile]     |
|              .---.                  |
|             | 🐱  | ← silver frame |
|              '---'                  |
|        Phat Nguyen 🏷 Legendary     |
|           Level 42 Pet Parent       |
|                                     |
|   Bio: "Building mobile pet app..." |
|                                     |
|  Friend Code:  [ABCD12] [Copy]      |
|                                     |
|  Connect: [💬 Discord] [🐦 Twitter] |
|                                     |
|  Stats Grid:                        |
|  [ Pet Lv 42 ][ 12 Friends ]        |
|  [ 28 Achievements ][ 5 day streak ]|
+-------------------------------------+
```

### 2.6 Avatar frames (port từ desktop)
```typescript
export const AVATAR_FRAMES: AvatarFrameDef[] = [
  { id: 'none', name: 'None', price: 0, borderWidth: 0, rarity: 'common' },
  { id: 'silver', name: 'Silver', price: 100, borderColor: '#C0C0C0', borderWidth: 3, rarity: 'common' },
  { id: 'gold', name: 'Gold', price: 500, borderColor: '#FFD700', borderWidth: 3, rarity: 'rare' },
  { id: 'diamond', name: 'Diamond', price: 2000, borderColor: '#B9F2FF', borderWidth: 4, glowColor: '#B9F2FF', rarity: 'epic' },
  { id: 'legendary', name: 'Legendary', price: 5000, borderColor: '#FF8000', borderWidth: 5, glowColor: '#FFD700', rarity: 'legendary' },
  { id: 'sakura', name: 'Sakura', price: 1500, borderColor: '#FFB7C5', borderWidth: 4, glowColor: '#FFB7C5', rarity: 'epic', unlockCondition: 'achievement: jp_friend' },
  { id: 'anime', name: 'Anime', price: 1500, borderColor: '#FF1493', borderWidth: 4, glowColor: '#FF69B4', rarity: 'epic' },
  { id: 'christmas', name: 'Christmas', price: 0, borderColor: '#D42426', borderWidth: 4, glowColor: '#34C759', rarity: 'rare', unlockCondition: 'event: christmas' },
];
```

---

## 3. Kết quả kỳ vọng

- Profile screen có banner gradient trên cùng
- Avatar với frame border (avatar frame type)
- Title badge hiển thị dưới tên
- Bio text block (multi-line)
- Friend code pill copy-to-clipboard
- Social chips → tap mở external link
- Edit modal: change bio, title, frame, banner URL, social handles
- Frame unlock animation khi user unlock frame mới

---

## 4. Testing

### 4.1 Playwright
```typescript
// e2e/step7-profile.spec.ts
test('profile shows banner + avatar frame', async ({ page }) => {
  await page.goto('http://localhost:8081');
  await page.click('[data-testid="tab-profile"]');
  await page.waitForSelector('[data-testid="profile-banner"]');
  await page.waitForSelector('[data-testid="avatar-frame"]');
});

test('can edit bio', async ({ page }) => {
  await page.click('[data-testid="edit-profile-btn"]');
  await page.fill('[data-testid="bio-input"]', 'Hello pet world!');
  await page.click('[data-testid="save-profile-btn"]');
  await page.waitForSelector('[data-testid="profile-bio"]');
  const text = await page.textContent('[data-testid="profile-bio"]');
  expect(text).toContain('Hello pet world!');
});

test('friend code copy works', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.click('[data-testid="friend-code-copy"]');
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toMatch(/^[A-Z0-9]{6}$/);
});

test('can equip avatar frame', async ({ page }) => {
  await page.click('[data-testid="edit-profile-btn"]');
  await page.click('[data-testid="frame-picker-gold"]');
  await page.click('[data-testid="save-profile-btn"]');
  const border = await page.evaluate(() =>
    getComputedStyle(document.querySelector('[data-testid="avatar-frame"]')!).borderColor
  );
  expect(border).toBe('rgb(255, 215, 0)'); // #FFD700
});
```

### 4.2 Live check
- Profile render banner + frame + bio
- Edit modal: từng field update thành công
- Tap social chip → mở external link

### 4.3 So sánh desktop
Mở `desktop-pet-app-source/src/renderer/profile/profile-view.html`, screenshot → so sánh.

### 4.4 Type check + tests
```bash
npm run typecheck
npm test
```

---

## 5. Debug

### Vấn đề 1: Avatar frame render không đúng size
- Wrap `<View>` với `width = avatarSize + 2*borderWidth`
- Đặt border vào `<View>` ngoài, image vào trong

### Vấn đề 2: Banner không fill đúng chiều rộng màn hình
- `width: Dimensions.get('window').width` + `-marginHorizontal`
- Hoặc dùng `width: '100%'`

### Vấn đề 3: Bio overflow
- `numberOfLines={0}` (unlimited) hoặc `4` rồi "Read more"
- Line break với `\n` thực tế

### Vấn đề 4: Friend code trùng
- Tạo unique: 6 char alphanumeric uppercase + check trùng qua API
- Hiển thị toast "Code already taken" → regenera

### Vấn đề 5: Social chip URL sai
- `discord://` chỉ mở app; fallback `https://discord.com/users/<id>`
- Twitter: `twitter://user?screen_name=<x>` → fallback `https://x.com/<x>`

---

## 6. Definition of Done

- [ ] Profile screen có banner + avatar frame + title + bio + friend code + social
- [ ] Edit modal update tất cả fields
- [ ] Avatar frames 8 loại (none/silver/gold/diamond/legendary/sakura/anime/christmas)
- [ ] Friend code copy-to-clipboard hoạt động
- [ ] Social chips mở external URL
- [ ] Frame unlock animation
- [ ] Playwright e2e pass
- [ ] `npm run typecheck` + `npm test` pass

---

## 7. Reference

- Desktop: `src/renderer/profile/profile-view.js`, `profile-editor.js`, `avatar-frames.js`, `profile-renderer.js`
- Mobile: `src/screens/ProfileScreen.tsx`, `src/api/settingsTypes.ts`

---

## 8. Estimated LOC
~600–900 lines:
- 5 components mới: ~350
- 1 API mới: ~100
- Sửa ProfileScreen: ~300
- Edit modal: ~200
