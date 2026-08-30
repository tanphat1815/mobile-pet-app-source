# Step M-8: Chat 1-1

## Vị trí trong roadmap

- **Thứ tự**: 8 / 16
- **Dependencies**: M-5 (Realtime Sync), M-7 (Push Notifications)
- **Branch**: `mobile-step-8-chat`
- **PR target**: `main`

## Mục tiêu

1. Tạo ChatListScreen (danh sách cuộc trò chuyện)
2. Tạo ChatScreen (màn hình chat với message bubbles)
3. Tạo `ChatBubble` component (sent/received bubbles)
4. Tạo `ChatStore` (Zustand) để quản lý chat state
5. Tích hợp `useInputShake` cho error state
6. Realtime message qua WebSocket

## File tạo/sửa

```
src/
├── components/
│   └── ChatBubble.tsx     # Message bubble (NEW)
├── screens/
│   ├── ChatListScreen.tsx # Chat list (NEW)
│   └── ChatScreen.tsx    # Chat detail (NEW)
└── store/
    └── chatStore.ts       # Chat state (UPDATE từ M-5)
```

## ChatListScreen Layout

```
┌──────────────────────────────┐
│  BlurHeader: "Messages"      │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ Avatar │ Name            │ │
│ │        │ Last message... │ │
│ │        │ 2m ago    • unread│ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ Avatar │ Name            │ │
│ │        │ Last message... │ │
│ │        │ 1h ago           │ │
│ └──────────────────────────┘ │
│           ...                │
└──────────────────────────────┘
```

## ChatScreen Layout

```
┌──────────────────────────────┐
│  ← Back    Name    Avatar    │
├──────────────────────────────┤
│                              │
│        [My message bubble]   │
│                              │
│   [Their message bubble]     │
│                              │
│        [My message bubble]   │
│                              │
├──────────────────────────────┤
│ ┌────────────────────────┐   │
│ │ Type a message...    📎 │   │
│ └────────────────────────┘   │
│                         [Send]│
└──────────────────────────────┘
```

## ChatBubble Component

```typescript
interface ChatBubbleProps {
  message: Message;
  isOwn: boolean;         // true = sent, false = received
  showAvatar?: boolean;   // show avatar for received
}

// Style:
// - Own: right-aligned, accent color background
// - Received: left-aligned, surface2 background
// - Time stamp below bubble
// - useAvatarHover for avatar press
```

## Hướng dẫn test

### Test 1: Web
```bash
npm run web
# Navigate to ChatListScreen
# Tap on a chat -> ChatScreen
# Type message -> Send
# Verify: message appears in bubble
# Open 2nd tab, send from there -> verify real-time
```

### Test 2: Expo Go Android
```bash
npm start
# Scan QR
# Test: keyboard handling (avoid input cover)
# Test: haptic on send
# Test: pull-to-load-more messages
```

### Test 3: Expo Go iOS
```bash
npm start
# Scan QR
# Test: BlurHeader vibrancy
# Test: swipe-to-back navigation
```

## Definition of Done

- [ ] ChatListScreen với conversation list
- [ ] ChatScreen với message history
- [ ] ChatBubble for sent/received messages
- [ ] Input field với send button
- [ ] Realtime message receive qua WebSocket
- [ ] Realtime message send qua WebSocket
- [ ] useInputShake khi send failed
- [ ] Unread badge count on ChatListScreen
- [ ] Scroll to bottom on new message
- [ ] Pull-to-load-more messages
- [ ] Test trên web thành công
- [ ] Test trên Expo Go Android/iOS thành công
- [ ] CHANGELOG.md được update
- [ ] Commit với message `feat(chat): Step M-8 - chat 1-1`
- [ ] PR được tạo và merge vào `main`

## Notes

- Message list nên dùng FlatList với virtualization
- Keyboard avoiding view để tránh input bị che
- Typing indicator có thể add ở đây hoặc future step
- Image/file attachment có thể add ở future step
- Push notification khi có message mới (từ M-7)
