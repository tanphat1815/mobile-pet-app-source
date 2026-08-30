# Step M-1: Scaffold + Theme Foundation

## Vị trí trong roadmap

- **Thứ tự**: 1 / 16
- **Dependencies**: M-0 (Repo Bootstrap)
- **Branch**: `mobile-step-1-scaffold`
- **PR target**: `main`

## Mục tiêu

1. Tạo React Native app với Expo (prebuild cho native modules)
2. Thiết lập navigation skeleton (React Navigation)
3. Tạo `src/utils/theme.ts` với Apple HIG design tokens (TypeScript)
4. Tạo `useTheme()` hook (auto-switch light/dark theo system)
5. Tạo `useReducedMotion()` hook (iOS/Android reduced motion preference)
6. Copy sprite assets từ desktop repo

## File tạo/sửa

```
mobile-pet-app-source/
├── package.json
├── app.json
├── babel.config.js
├── tsconfig.json
├── src/
│   ├── App.tsx                    # Main app với navigation
│   ├── navigation/
│   │   └── AppNavigator.tsx       # Navigation skeleton
│   └── utils/
│       ├── theme.ts               # Apple HIG tokens (NEW)
│       ├── useTheme.ts            # Auto dark/light (NEW)
│       └── useReducedMotion.ts    # Reduced motion (NEW)
└── assets/
    └── sprites/                   # Copy từ desktop
```

## Theme Tokens (`src/utils/theme.ts`)

Map từ desktop `tokens.css` sang TypeScript:

```typescript
export const theme = {
  colors: {
    // Light mode
    accent: '#007AFF',
    success: '#34C759',
    danger: '#FF3B30',
    warning: '#FF9500',
    bg: '#F2F2F7',
    surface: '#FFFFFF',
    surface2: '#F2F2F7',
    text: '#000000',
    textSecondary: '#8E8E93',
    border: '#C6C6C8',
    // Dark mode variants (auto-switched)
  },
  typography: {
    size: { xs: 11, sm: 13, base: 15, lg: 17, xl: 22, title: 28 },
    lineHeight: { tight: 1.2, normal: 1.4 },
    fontFamily: { system: Platform.OS === 'ios' ? 'System' : 'Roboto' },
  },
  spacing: [0, 4, 8, 12, 16, 20, 24, 32, 40], // 4pt grid
  radius: { sm: 6, md: 10, lg: 14, xl: 20, pill: 9999 },
  shadows: {
    elevation1: { shadowColor: '#000', shadowOffset: {w:0,h:1}, shadowOpacity: 0.1, shadowRadius: 2 },
    elevation2: { shadowColor: '#000', shadowOffset: {w:0,h:2}, shadowOpacity: 0.15, shadowRadius: 4 },
    elevation3: { shadowColor: '#000', shadowOffset: {w:0,h:4}, shadowOpacity: 0.2, shadowRadius: 8 },
  },
  easing: {
    standard: [0.4, 0, 0.2, 1],
    decelerate: [0, 0, 0.2, 1],
    accelerate: [0.4, 0, 1, 1],
  },
  duration: {
    fast: 150,
    base: 220,
    slow: 360,
  },
};
```

## Hướng dẫn test

### Test 1: Web (nhanh nhất)
```bash
npm run web
# Mở http://localhost:8081
# Kiểm tra: theme tokens load đúng
```

### Test 2: Expo Go Android
```bash
npm start
# Scan QR với Expo Go (Android)
# Kiểm tra: dark mode toggle, reduced motion
```

### Test 3: Expo Go iOS
```bash
npm start
# Scan QR với Expo Go (iOS)
# Kiểm tra: vibrancy/blur effects, haptic feedback
```

### Test 4: Android Emulator (optional)
```bash
# Mở Android Studio, chạy emulator
npm start
# Bấm 'a' để run trên emulator
```

## Definition of Done

- [ ] `npx create-expo-app@latest` chạy thành công
- [ ] `expo prebuild` chạy thành công (tạo ios/, android/)
- [ ] `npm run web` chạy không lỗi
- [ ] `src/utils/theme.ts` export đầy đủ tokens
- [ ] `useTheme()` hook tự động switch dark/light theo system
- [ ] `useReducedMotion()` hook đọc system preference
- [ ] Navigation skeleton có ít nhất 2 placeholder screens
- [ ] Sprite assets được copy vào `assets/sprites/`
- [ ] CHANGELOG.md được update
- [ ] Commit với message `feat(scaffold): Step M-1 - scaffold + theme foundation`
- [ ] PR được tạo và merge vào `main`

## Notes

- Sử dụng `expo-blur` cho BlurView vibrancy trên iOS
- Theme phải export cả light và dark variants
- Duration values phải = 1 khi `useReducedMotion()` returns true
