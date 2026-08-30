# Step M-12: Biometric + Haptics + Onboarding

## Vị trí trong roadmap

- **Thứ tự**: 12 / 16
- **Dependencies**: M-4 (Auth Flow)
- **Branch**: `mobile-step-12-biometric`
- **PR target**: `main`

## Mục tiêu

1. Tạo BiometricLoginScreen (Face ID / Touch ID / Fingerprint)
2. Tạo `useBiometricAuth` hook
3. Tạo `haptics.ts` utility (light/medium/heavy feedback)
4. Tạo OnboardingScreen (6 slides) với `usePageTransition`
5. Haptic feedback cho various events (message, level-up, etc.)

## File tạo/sửa

```
src/
├── screens/
│   ├── BiometricLoginScreen.tsx  # Biometric auth (NEW)
│   └── OnboardingScreen.tsx      # 6-slide onboarding (NEW)
├── hooks/
│   └── useBiometricAuth.ts       # Biometric hook (NEW)
├── utils/
│   └── haptics.ts                # Haptic feedback (NEW)
└── navigation/
    └── AppNavigator.tsx         # UPDATE: add routes
```

## BiometricLoginScreen Layout

```
┌──────────────────────────────┐
│                              │
│                              │
│         Pet Avatar           │
│                              │
│    Welcome back!             │
│    Use biometric to login   │
│                              │
│    ┌──────────────────┐     │
│    │   Face ID Icon   │     │
│    └──────────────────┘     │
│                              │
│    [ Use Password Instead ]  │
│                              │
└──────────────────────────┘
```

## OnboardingScreen (6 Slides)

| Slide | Title | Content | Image |
|-------|-------|---------|-------|
| 1 | Welcome | Giới thiệu app | Pet sprite happy |
| 2 | Feed | Hướng dẫn feed pet | Food animation |
| 3 | Play | Hướng dẫn chơi | Play animation |
| 4 | Chat | Kết nối bạn bè | Chat bubbles |
| 5 | Pair | Pair với desktop | Desktop + Phone |
| 6 | Ready | Sẵn sàng bắt đầu | Pet sprite excited |

## useBiometricAuth Hook

```typescript
export const useBiometricAuth = () => {
  // Check if biometric is available
  // Prompt biometric authentication
  // Return success/failure
  // Store preference for future logins
  
  return {
    isAvailable: boolean;
    biometryType: 'FaceID' | 'TouchID' | 'Fingerprint' | null;
    authenticate: () => Promise<boolean>;
    error: Error | null;
  };
};
```

## Haptics Utility

```typescript
// Từ desktop haptics.ts pattern
export const haptics = {
  light: () => ImpactFeedbackStyle.Light,
  medium: () => ImpactFeedbackStyle.Medium,
  heavy: () => ImpactFeedbackStyle.Heavy,
  success: () => NotificationFeedbackType.Success,
  warning: () => NotificationFeedbackType.Warning,
  error: () => NotificationFeedbackType.Error,
  selection: () => SelectionFeedback(),
};
```

## Hướng dẫn test

### Test 1: Expo Go Android (Haptics)
```bash
npm start
# Scan QR
# Test: haptics khi tap buttons
# Test: haptic on message receive
# Test: haptic on level up
```

### Test 2: Android Emulator (Biometric)
```bash
# Enable biometric in AVD:
# Settings -> Security -> Fingerprint
# Add fingerprint

# Test:
# BiometricLoginScreen -> tap Face/Fingerprint
# Verify: success callback
```

### Test 3: Expo Go iOS (Haptics + Biometric)
```bash
npm start
# Scan QR
# Test: haptic feedback
# Test: Face ID prompt (nếu có device thật)
```

### Test 4: Onboarding (Web)
```bash
npm run web
# Navigate to OnboardingScreen
# Test: swipe/slide transitions
# Test: usePageTransition animations
# Test: skip button, next button
```

## Definition of Done

- [ ] BiometricLoginScreen với Face ID/Touch ID/Fingerprint
- [ ] useBiometricAuth hook
- [ ] Biometric availability check
- [ ] Fallback to password option
- [ ] OnboardingScreen với 6 slides
- [ ] usePageTransition cho slide animations
- [ ] Skip button và progress dots
- [ ] Onboarding completion -> save preference
- [ ] haptics.ts với light/medium/heavy/success/warning/error
- [ ] Haptic integration in buttons và events
- [ ] Test haptics trên Expo Go Android/iOS
- [ ] Test biometric trên Android Emulator
- [ ] CHANGELOG.md được update
- [ ] Commit với message `feat(biometric): Step M-12 - biometric + haptics + onboarding`
- [ ] PR được tạo và merge vào `main`

## Notes

- Biometric requires expo-local-authentication
- Haptics requires expo-haptics
- Onboarding chỉ show 1 lần (sau đó skip)
- Future: Onboarding with custom pet selection
- Future: Haptic patterns for different pet actions
