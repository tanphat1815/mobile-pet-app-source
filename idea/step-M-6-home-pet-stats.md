# Step M-6: Home + Pet Stats

## Vị trí trong roadmap

- **Thứ tự**: 6 / 16
- **Dependencies**: M-5 (Realtime Sync)
- **Branch**: `mobile-step-6-home`
- **PR target**: `main`

## Mục tiêu

1. Tạo HomeScreen với pet sprite, stat bars, quick actions
2. Tạo `PetSprite` component (hiển thị sprite animation)
3. Tạo `StatBar` component (4 bars: happiness, hunger, energy, health)
4. Tạo `QuickAction` component (4 actions)
5. Tạo `PetStore` (Zustand) để quản lý pet state
6. Pull-to-refresh để sync pet data

## File tạo/sửa

```
src/
├── components/
│   ├── PetSprite.tsx      # Sprite animation (NEW)
│   ├── StatBar.tsx        # Progress bar (NEW)
│   └── QuickAction.tsx    # Action button (NEW)
├── screens/
│   └── HomeScreen.tsx     # Main home screen (NEW)
└── store/
    └── petStore.ts        # Pet state management (NEW)
```

## HomeScreen Layout

```
┌──────────────────────────────┐
│  BlurHeader (with avatar)    │
├──────────────────────────────┤
│                              │
│         PetSprite            │
│      (animated sprite)       │
│                              │
├──────────────────────────────┤
│  StatBar: Happiness  ████░░  │
│  StatBar: Hunger     █████░  │
│  StatBar: Energy     ███░░░  │
│  StatBar: Health     ██████  │
├──────────────────────────────┤
│  [Feed] [Play] [Sleep] [Pet] │
│        Quick Actions         │
└──────────────────────────────┘
```

## PetSprite Component

```typescript
interface PetSpriteProps {
  spriteKey: string;      // 'idle', 'eating', 'playing', 'sleeping'
  expression?: string;    // 'happy', 'neutral', 'sad', 'sleepy'
  size?: 'small' | 'medium' | 'large';
}

// Sprite được load từ assets/sprites/
// Animation loop với useAnimatedStyle
```

## StatBar Component

```typescript
interface StatBarProps {
  label: string;
  value: number;          // 0-100
  color: string;          // from theme.colors
  icon?: string;          // emoji hoặc icon name
}

// Gradient fill từ trái sang phải
// Animation khi value thay đổi (withSpring)
```

## Hướng dẫn test

### Test 1: Web
```bash
npm run web
# Navigate to HomeScreen
# Verify: pet sprite animation loop
# Verify: stat bars hiển thị đúng
# Verify: quick actions có hover effect
# Verify: pull-to-refresh hoạt động
```

### Test 2: Expo Go Android
```bash
npm start
# Scan QR
# Test: haptic feedback khi tap quick actions
# Test: dark mode cho stat bars
```

### Test 3: Expo Go iOS
```bash
npm start
# Scan QR
# Test: BlurHeader vibrancy
# Test: smooth animation trên iOS
```

## Definition of Done

- [ ] HomeScreen layout đúng spec
- [ ] PetSprite hiển thị animation loop
- [ ] StatBar với gradient fill + animation
- [ ] 4 QuickAction buttons với useAvatarHover
- [ ] PetStore sync với backend qua REST + WS
- [ ] Pull-to-refresh để force sync
- [ ] Pet name + level hiển thị
- [ ] Dark mode support
- [ ] Test trên web thành công
- [ ] Test trên Expo Go Android/iOS thành công
- [ ] CHANGELOG.md được update
- [ ] Commit với message `feat(home): Step M-6 - home + pet stats`
- [ ] PR được tạo và merge vào `main`

## Notes

- PetSprite dùng `useAnimatedStyle` cho smooth animation
- StatBar dùng `withSpring` cho fill animation
- QuickAction dùng `useAvatarHover` cho press scale
- Pull-to-refresh dùng built-in React Native hoặc expo
- PetStore subscribe WS để real-time stat updates
