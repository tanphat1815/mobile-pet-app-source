# Step M-2: Shared UI Library

## Vị trí trong roadmap

- **Thứ tự**: 2 / 16
- **Dependencies**: M-1 (Scaffold + Theme Foundation)
- **Branch**: `mobile-step-2-shared-ui`
- **PR target**: `main`

## Mục tiêu

Xây dựng thư viện shared components và transitions hooks, y hệt pattern desktop (`transitions/*.css` -> Reanimated hooks).

### Components

| Component | Mô tả | Spec |
|-----------|-------|------|
| `Button.tsx` | Pill button | border-radius: pill, shadow on hover/press, loading state |
| `Card.tsx` | Surface card | border-radius: lg, surface bg, elevation2 shadow |
| `Toggle.tsx` | iOS-style switch | success color when on, 220ms transition |
| `TextField.tsx` | Text input | border color, focus ring accent alpha 20%, shake on error |
| `Modal.tsx` | Modal overlay | uses useModalTransition, BlurHeader, padding spacing[5] |
| `Panel.tsx` | Bottom sheet/panel | uses usePanelTransition, drag-to-close gesture |
| `Badge.tsx` | Notification badge | pill shape, uses usePopAnimation on mount |
| `BlurHeader.tsx` | iOS vibrancy header | BlurView intensity 80, fallback solid on Android |

### Transitions Hooks (Reanimated)

Map từ desktop `transitions/*.css`:

| Hook | Từ CSS class | Dùng cho |
|------|--------------|----------|
| `useModalTransition()` | `.t-modal-overlay` + `.t-modal-content` | Auth screens, modals |
| `usePanelTransition()` | `.t-panel`, `.t-panel-slide-left` | Bottom sheets, action sheets |
| `useDropdownTransition()` | `.t-dropdown` | Emoji picker, friend picker |
| `usePopAnimation()` | `.t-pop` | Badge "Copy" -> "✓", notifications |
| `useAvatarHover()` | `.t-badge` hover | FriendRow, chat avatar press |
| `useInputShake()` | `.t-input-shake` | Email/code verify error |
| `usePageTransition()` | Onboarding slide | OnboardingScreen (M-12) |

## File tạo/sửa

```
src/
├── shared/
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Toggle.tsx
│   │   ├── TextField.tsx
│   │   ├── Modal.tsx
│   │   ├── Panel.tsx
│   │   ├── Badge.tsx
│   │   └── BlurHeader.tsx
│   └── transitions/
│       ├── useModalTransition.ts
│       ├── usePanelTransition.ts
│       ├── useDropdownTransition.ts
│       ├── usePopAnimation.ts
│       ├── useAvatarHover.ts
│       ├── useInputShake.ts
│       └── usePageTransition.ts
└── screens/
    └── ComponentGallery.tsx    # Demo screen (xóa ở M-3)
```

## Hướng dẫn test

### Test 1: Web (ComponentGallery)
```bash
npm run web
# Navigate to ComponentGallery
# Test: dark mode toggle, reduced motion toggle
# Verify: tất cả components render đúng
```

### Test 2: Expo Go Android
```bash
npm start
# Scan QR
# Test: BlurView fallback, haptics on press
```

### Test 3: Expo Go iOS
```bash
npm start
# Scan QR
# Test: BlurView vibrancy chuẩn iOS
```

## Definition of Done

- [ ] Tất cả 8 components được tạo với theme tokens
- [ ] Tất cả 7 transitions hooks được tạo với Reanimated
- [ ] `useReducedMotion()` được tích hợp vào hooks (duration = 1 khi enabled)
- [ ] `useColorScheme()` được tích hợp vào components (dark mode)
- [ ] `ComponentGallery.tsx` demo tất cả components
- [ ] `ComponentGallery.tsx` có toggle dark/light/reduced-motion
- [ ] Test trên web thành công
- [ ] Test trên Expo Go Android thành công
- [ ] Test trên Expo Go iOS thành công (vibrancy)
- [ ] CHANGELOG.md được update
- [ ] Commit với message `feat(shared-ui): Step M-2 - shared components + transitions`
- [ ] PR được tạo và merge vào `main`

## Notes

- Tất cả components phải sử dụng `theme.*` từ `src/utils/theme.ts`
- Không hard-code bất kỳ hex color hay pixel value nào trong components
- Transitions phải sử dụng Reanimated `withSpring` hoặc `withTiming` với easing từ theme
- `ComponentGallery.tsx` sẽ bị xóa ở Step M-3 (sau khi API client được setup)
