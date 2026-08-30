# Step M-7: Push Notifications

## Vị trí trong roadmap

- **Thứ tự**: 7 / 16
- **Dependencies**: M-6 (Home + Pet Stats)
- **Branch**: `mobile-step-7-push`
- **PR target**: `main`

## Mục tiêu

1. Setup FCM (Android) + APNs (iOS) với expo-notifications/notifee
2. Tạo 4 notification channels (messages, friends, pet-alerts, system)
3. Tạo foreground notification handler
4. Tạo background notification handler
5. Đăng ký device token với backend server

## File tạo/sửa

```
src/
├── hooks/
│   └── usePushNotifications.ts  # Main hook (NEW)
├── api/
│   └── notifications.ts       # Register token API (NEW)
└── store/
    └── notificationsStore.ts  # Notification state (NEW)
```

## Push Notifications Architecture

```
┌──────────────────┐     FCM/APNs     ┌──────────────────┐
│  Mobile Device    │ ◄──────────────► │  Firebase / APNs │
└──────────────────┘                  └──────────────────┘
         │                                    ▲
         │ POST /register-device              │
         ▼                                    │
┌──────────────────┐                          │
│  Cloudflare      │                          │
│  Worker Backend  │ ──── send notification ──┘
└──────────────────┘
```

## Notification Channels

| Channel ID | Name | Priority | Sound |
|------------|------|----------|-------|
| `messages` | Messages | High | message.wav |
| `friends` | Friends | Default | friend.wav |
| `pet-alerts` | Pet Alerts | High | alert.wav |
| `system` | System | Low | system.wav |

## usePushNotifications Hook

```typescript
export const usePushNotifications = () => {
  // Request permissions
  // Get device token (FCM/APNs)
  // Register token with backend
  // Setup foreground handler
  // Setup background handler (Android)
  // Setup notification tap handler (deep link)
  
  return {
    token: string | null;
    isLoading: boolean;
    error: Error | null;
    requestPermission: () => Promise<boolean>;
  };
};
```

## Hướng dẫn test

### Test 1: Android Emulator (REQUIRED)
```bash
# Setup FCM:
# 1. Tạo Firebase project
# 2. Download google-services.json
# 3. Place vào android/app/
# 4. expo prebuild

# Chạy emulator:
# 1. Mở Android Studio
# 2. Run emulator với Google Play
# 3. npm start
# 4. Bấm 'a'

# Test:
# 1. Gửi test notification từ Firebase Console
# 2. Verify: notification hiển thị trên emulator
```

### Test 2: Expo Go (Limited)
```bash
npm start
# Expo Go không support FCM trực tiếp
# Có thể test notification tap deep link
```

### Test 3: iOS (Limited)
```bash
# Cần Apple Developer account cho APNs
# Test với EAS Build hoặc TestFlight
```

## Definition of Done

- [ ] expo-notifications hoặc notifee được setup
- [ ] FCM setup cho Android (google-services.json)
- [ ] APNs setup cho iOS (p8 certificate/key)
- [ ] 4 notification channels được tạo
- [ ] Foreground notification hiển thị custom UI
- [ ] Background notification được xử lý
- [ ] Token đăng ký với backend
- [ ] Notification tap deep link đến đúng screen
- [ ] Test notification trên Android Emulator thành công
- [ ] CHANGELOG.md được update
- [ ] Commit với message `feat(notifications): Step M-7 - push notifications`
- [ ] PR được tạo và merge vào `main`

## Notes

- FCM require google-services.json từ Firebase Console
- APNs require Apple Developer account + certificate
- Test notification bằng Firebase Console hoặc Postman gọi FCM API
- Deep link format: `mobilepet://screen/chat/123`
- Permission request phải show explanation trước (theo HIG)
