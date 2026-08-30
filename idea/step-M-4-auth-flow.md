# Step M-4: Auth Flow

## Vị trí trong roadmap

- **Thứ tự**: 4 / 16
- **Dependencies**: M-3 (API Client + Storage)
- **Branch**: `mobile-step-4-auth`
- **PR target**: `main`

## Mục tiêu

1. Tạo LoginScreen với email input (dùng `TextField`)
2. Tạo VerifyScreen với OTP code input (dùng `TextField` + `useInputShake`)
3. Tạo AuthStore (Zustand) để quản lý auth state
4. Tạo API methods cho email OTP flow
5. Integrate với shared UI components (`Modal`, `Button`, `Card`)

## File tạo/sửa

```
src/
├── api/
│   └── auth.ts           # sendOTP, verifyOTP, refreshToken (NEW)
├── store/
│   └── authStore.ts      # Zustand store (NEW)
└── screens/
    └── AuthScreens.tsx   # LoginScreen + VerifyScreen (NEW)
```

## Auth Flow

```
┌─────────────┐    sendOTP     ┌─────────────┐
│ LoginScreen │ ─────────────► │ Backend API │
│  (email)    │                │  (Worker)  │
└─────────────┘                └─────────────┘
        │                             │
        │◄──────── success ───────────┘
        ▼
┌─────────────┐   verifyOTP    ┌─────────────┐
│ VerifyScreen│ ─────────────► │ Backend API │
│   (OTP)     │                │  (Worker)  │
└─────────────┘                └─────────────┘
        │                             │
        │◄──── access_token ──────────┘
        ▼
   AuthStore
   (Zustand)
```

## AuthStore (Zustand)

```typescript
interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  accessToken: string | null;
  
  sendOTP: (email: string) => Promise<void>;
  verifyOTP: (code: string) => Promise<boolean>;
  logout: () => void;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // ... implementation
}));
```

## Hướng dẫn test

### Test 1: Web
```bash
npm run web
# Navigate to AuthScreens
# Test: sendOTP (nhập email) -> VerifyScreen
# Test: verifyOTP (nhập mã) -> redirect to Home
# Test: invalid OTP -> useInputShake animation
```

### Test 2: Expo Go Android/iOS
```bash
npm start
# Scan QR
# Test: haptic feedback khi gửi OTP
# Test: dark mode trong auth flow
```

### Test 3: Backend (Desktop Worker)
- Đảm bảo desktop worker đang chạy
- Test với email thật để nhận OTP

## Definition of Done

- [ ] LoginScreen với email TextField
- [ ] VerifyScreen với OTP input + useInputShake on error
- [ ] AuthStore với sendOTP, verifyOTP, logout, restoreSession
- [ ] AuthStore persists token qua storage
- [ ] Navigation chuyển LoginScreen -> VerifyScreen -> HomeScreen
- [ ] Loading states trên buttons
- [ ] Error messages hiển thị đúng (dùng theme colors)
- [ ] Test sendOTP + verifyOTP với backend thật
- [ ] CHANGELOG.md được update
- [ ] Commit với message `feat(auth): Step M-4 - auth flow`
- [ ] PR được tạo và merge vào `main`

## Notes

- Sử dụng `Modal` với `useModalTransition` cho error messages
- Sử dụng `Button` với loading state khi đang gửi OTP
- OTP input nên auto-focus sau khi nhận được mã
- Token được lưu vào storage để restore session
