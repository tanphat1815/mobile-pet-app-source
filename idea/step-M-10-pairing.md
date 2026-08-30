# Step M-10: Cross-Device Pairing

## Vị trí trong roadmap

- **Thứ tự**: 10 / 16
- **Dependencies**: M-4 (Auth Flow), M-6 (Home + Pet Stats)
- **Branch**: `mobile-step-10-pairing`
- **PR target**: `main`

## Mục tiêu

1. Tạo PairDeviceScreen (màn hình pairing)
2. Generate 6-digit pairing code
3. Input pairing code từ desktop app
4. Gọi `/api/auth/pair` endpoint
5. Link mobile device với desktop pet

## File tạo/sửa

```
src/
├── api/
│   └── pairing.ts        # Pairing API methods (NEW)
├── screens/
│   └── PairDeviceScreen.tsx  # Pairing UI (NEW)
└── navigation/
    └── AppNavigator.tsx  # UPDATE: add PairDeviceScreen route
```

## Pairing Flow

```
┌──────────────────┐         ┌──────────────────┐
│   Desktop App   │         │   Mobile App     │
│   (Pet App)     │         │   (Companion)    │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │  Generate 6-digit code   │
         │  Display on screen        │
         │◄──────────────────────────┤
         │                           │
         │                           │  Enter code
         │                           │  Tap "Pair"
         │                           │◄─────────────────
         │                           │
         │  POST /api/auth/pair      │
         │  { code: "ABC123" }       │
         │─────────────────────────►│
         │                           │
         │◄── Pairing successful ────┘
         │                           │
         │  Both devices sync pet   │
         │  via WebSocket           │
```

## PairDeviceScreen Layout

```
┌──────────────────────────────┐
│  ← Back     Pair Device     │
├──────────────────────────────┤
│                              │
│    Pair your mobile app      │
│    with your desktop pet     │
│                              │
│  ┌────────────────────────┐  │
│  │   Your Desktop Code    │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │   A B C 1 2 3           │  │
│  │   (6-digit display)     │  │
│  └────────────────────────┘  │
│                              │
│    - OR -                    │
│                              │
│  Enter code from desktop:    │
│  ┌─┬─┬─┬─┬─┬─┐               │
│  │ │ │ │ │ │ │               │
│  └─┴─┴─┴─┴─┴─┘               │
│                              │
│  [     Pair Now     ]        │
│                              │
└──────────────────────────────┘
```

## API Endpoint

```typescript
// POST /api/auth/pair
interface PairRequest {
  code: string;        // 6-digit code from desktop
  deviceType: 'mobile';
  deviceName: string;  // e.g., "iPhone 15 Pro"
}

interface PairResponse {
  success: boolean;
  pairedDeviceId?: string;
  petId?: string;
  error?: string;
}
```

## Hướng dẫn test

### Test 1: Web (PairDeviceScreen)
```bash
npm run web
# Navigate to PairDeviceScreen
# Test: 6-digit code input
# Test: auto-submit khi đủ 6 digits
```

### Test 2: Expo Go Android + Desktop App (REQUIRED)
```bash
# 1. Mở Desktop Pet App
# 2. Settings -> Pair Mobile Device
# 3. Copy 6-digit code
# 4. Expo Go Android -> PairDeviceScreen
# 5. Nhập code -> Pair
# 6. Verify: thành công
# 7. Verify: Desktop + Mobile sync pet data
```

### Test 3: Expo Go iOS + Desktop App
```bash
# Test tương tự với iOS
```

## Definition of Done

- [ ] PairDeviceScreen với 6-digit code input
- [ ] Auto-focus next digit on input
- [ ] Auto-submit khi đủ 6 digits
- [ ] Loading state khi pairing
- [ ] Success animation (usePopAnimation)
- [ ] Error handling với shake animation (useInputShake)
- [ ] Gọi `/api/auth/pair` endpoint
- [ ] Pairing state được persist
- [ ] Test pairing với desktop app thật
- [ ] Test pet data sync sau pairing
- [ ] CHANGELOG.md được update
- [ ] Commit với message `feat(pairing): Step M-10 - cross-device pairing`
- [ ] PR được tạo và merge vào `main`

## Notes

- Pairing code có expiry (5 phút)
- Chỉ 1 mobile device được pair với 1 desktop pet
- Pairing state được lưu trong AuthStore
- Future: Unpair device option trong Settings
- Future: QR code scanning thay vì manual input
