# Step M-9: Friends List

## Vị trí trong roadmap

- **Thứ tự**: 9 / 16
- **Dependencies**: M-5 (Realtime Sync), M-8 (Chat 1-1)
- **Branch**: `mobile-step-9-friends`
- **PR target**: `main`

## Mục tiêu

1. Tạo FriendsScreen (danh sách bạn bè)
2. Tạo `FriendRow` component với online status
3. Tạo `FriendStore` (Zustand) để quản lý friends state
4. Realtime online/offline status qua WebSocket
5. Tích hợp `useAvatarHover` cho avatar press

## File tạo/sửa

```
src/
├── components/
│   └── FriendRow.tsx     # Friend list row (NEW)
├── screens/
│   └── FriendsScreen.tsx # Friends screen (NEW)
└── store/
    └── friendStore.ts    # Friends state (UPDATE từ M-5)
```

## FriendsScreen Layout

```
┌──────────────────────────────┐
│  BlurHeader: "Friends"       │
├──────────────────────────────┤
│  🔍 Search friends...        │
├──────────────────────────────┤
│  ONLINE (3)                 │
│  ┌────────────────────────┐ │
│  │ 🟢 Avatar │ Name       │ │
│  │          │ Online now  │ │
│  └────────────────────────┘ │
│  ┌────────────────────────┐ │
│  │ 🟢 Avatar │ Name       │ │
│  │          │ Online now  │ │
│  └────────────────────────┘ │
│──────────────────────────────│
│  OFFLINE (12)               │
│  ┌────────────────────────┐ │
│  │ ⚪ Avatar │ Name        │ │
│  │          │ Last seen 2h │ │
│  └────────────────────────┘ │
│           ...               │
└──────────────────────────────┘
```

## FriendRow Component

```typescript
interface FriendRowProps {
  friend: Friend;
  onPress: () => void;      // Navigate to chat
  onLongPress?: () => void; // Show options menu
}

// Online indicator: 🟢 green dot
// Offline indicator: ⚪ gray dot hoặc "Last seen X"
// useAvatarHover cho press scale effect
// useAvatarPress cho haptic feedback
```

## Online Status Broadcast (WebSocket)

```typescript
// WS message types từ protocol.ts
FRIEND_STATUS: {
  userId: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: number; // timestamp
}

// FriendStore subscribes to this message
// Updates local state in real-time
```

## Hướng dẫn test

### Test 1: Web
```bash
npm run web
# Navigate to FriendsScreen
# Verify: friends list hiển thị
# Verify: search filter hoạt động
# Open 2nd tab, change status -> verify real-time update
```

### Test 2: Expo Go Android
```bash
npm start
# Scan QR
# Test: tap on friend -> navigate to chat
# Test: haptic on long press
```

### Test 3: Expo Go iOS
```bash
npm start
# Scan QR
# Test: BlurHeader vibrancy
# Test: smooth scrolling với many friends
```

## Definition of Done

- [ ] FriendsScreen với section headers (Online/Offline)
- [ ] FriendRow với avatar, name, status indicator
- [ ] Online status real-time update qua WebSocket
- [ ] Search/filter friends by name
- [ ] useAvatarHover cho press effect
- [ ] Tap on friend -> navigate to ChatScreen
- [ ] Long press -> show options menu
- [ ] Pull-to-refresh friends list
- [ ] Test trên web thành công
- [ ] Test trên Expo Go Android/iOS thành công
- [ ] CHANGELOG.md được update
- [ ] Commit với message `feat(friends): Step M-9 - friends list`
- [ ] PR được tạo và merge vào `main`

## Notes

- Friends list nên dùng SectionList với sections (Online, Offline)
- Status updates qua WS broadcast (từ M-5 protocol)
- Search nên debounce 300ms
- Avatar với green/gray dot indicator
- Future: Add friend button, friend request notifications
