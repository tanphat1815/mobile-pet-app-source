# Step M-5: Realtime Sync

## Vị trí trong roadmap

- **Thứ tự**: 5 / 16
- **Dependencies**: M-4 (Auth Flow)
- **Branch**: `mobile-step-5-realtime`
- **PR target**: `main`

## Mục tiêu

1. Tạo WebSocket SyncManager (kết nối, reconnect, heartbeat)
2. Mirror protocol từ desktop (`MESSAGE_TYPES`, `WS_ACTIONS`)
3. Tạo `useRealtimeChat.ts` hook
4. Tích hợp với Zustand stores (chat, friends, pets)
5. Dispatch messages đến đúng store handlers

## File tạo/sửa

```
src/
├── api/
│   └── sync.ts            # SyncManager class (NEW)
├── network/
│   └── protocol.ts        # MESSAGE_TYPES, WS_ACTIONS (NEW)
├── hooks/
│   └── useRealtimeChat.ts # Hook for chat realtime (NEW)
└── store/
    ├── chatStore.ts       # Update: handle WS messages
    ├── friendStore.ts     # Update: handle online status
    └── petStore.ts       # Update: handle pet updates
```

## SyncManager Architecture

```typescript
class SyncManager {
  private ws: WebSocket | null;
  private reconnectAttempts: number;
  private heartbeatInterval: NodeJS.Timeout | null;

  connect(token: string): void;
  disconnect(): void;
  send(message: WSMessage): void;
  
  // Private
  private scheduleReconnect(): void;
  private startHeartbeat(): void;
  private handleMessage(event: MessageEvent): void;
}
```

## Protocol Mirror (từ desktop)

```typescript
// Từ desktop protocol.ts
export const MESSAGE_TYPES = {
  // Auth
  AUTH_CHALLENGE: 'auth:challenge',
  AUTH_RESPONSE: 'auth:response',
  
  // Chat
  CHAT_MESSAGE: 'chat:message',
  CHAT_TYPING: 'chat:typing',
  
  // Friends
  FRIEND_STATUS: 'friend:status',
  FRIEND_REQUEST: 'friend:request',
  
  // Pet
  PET_UPDATE: 'pet:update',
  PET_ACTION: 'pet:action',
  
  // Sync
  SYNC_STATE: 'sync:state',
  SYNC_ACK: 'sync:ack',
} as const;

export const WS_ACTIONS = {
  // Actions map từ desktop
} as const;
```

## Reconnect Strategy

- **Exponential backoff**: 1s, 2s, 4s, 8s, 16s, max 30s
- **Max attempts**: 10, sau đó show manual reconnect button
- **Heartbeat**: ping mỗi 30s, disconnect nếu không pong trong 10s
- **Reconnect on visibility change**: reconnect khi app quay lại foreground

## Hướng dẫn test

### Test 1: Web (2 tabs)
```bash
npm run web
# Mở 2 tab trình duyệt cùng http://localhost:8081
# Login ở cả 2 tab
# Gửi message ở tab 1 -> thấy real-time ở tab 2
# Verify: WebSocket reconnect khi tab mất network
```

### Test 2: Expo Go Android + Web
```bash
npm start
# Tab 1: Web browser (desktop)
# Tab 2: Expo Go Android
# Test: message real-time giữa web và mobile
```

### Test 3: Expo Go iOS + Web
```bash
npm start
# Test tương tự với iOS
```

## Definition of Done

- [ ] SyncManager class với connect/disconnect/send
- [ ] Reconnect exponential backoff (1s -> 30s max)
- [ ] Heartbeat (ping mỗi 30s, timeout 10s)
- [ ] Protocol types mirror từ desktop
- [ ] `useRealtimeChat` hook export message handlers
- [ ] ChatStore nhận và dispatch WS messages
- [ ] FriendStore cập nhật online status real-time
- [ ] PetStore cập nhật pet state real-time
- [ ] 2-tab test: message real-time hoạt động
- [ ] CHANGELOG.md được update
- [ ] Commit với message `feat(sync): Step M-5 - realtime sync`
- [ ] PR được tạo và merge vào `main`

## Notes

- WebSocket URL từ `config.ts` (WS_BASE_URL)
- Auth token được gửi khi connect
- Message format JSON với type, payload, timestamp
- Kiểm tra `AppState` để pause/resume heartbeat khi app background
