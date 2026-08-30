# Step M-13: Settings + Profile

## Vị trí trong roadmap

- **Thứ tự**: 13 / 16
- **Dependencies**: M-4 (Auth Flow), M-12 (Biometric + Onboarding)
- **Branch**: `mobile-step-13-settings`
- **PR target**: `main`

## Mục tiêu

1. Tạo SettingsScreen (app settings)
2. Tạo ProfileScreen (user profile)
3. Sử dụng `Toggle` component cho settings
4. Tích hợp `usePopAnimation` cho copy friend code badge

## File tạo/sửa

```
src/
├── screens/
│   ├── SettingsScreen.tsx    # App settings (NEW)
│   └── ProfileScreen.tsx     # User profile (NEW)
└── navigation/
    └── AppNavigator.tsx      # UPDATE: add routes
```

## SettingsScreen Layout

```
┌──────────────────────────────┐
│  ← Back    Settings         │
├──────────────────────────────┤
│  Account                     │
│  ┌──────────────────────────┐│
│  │ 👤 Profile          →   ││
│  │ 🔔 Notifications    [◉] ││
│  └──────────────────────────┘│
│──────────────────────────────│
│  Appearance                  │
│  ┌──────────────────────────┐│
│  │ 🌙 Dark Mode       [◉]  ││
│  │ ⚡ Reduced Motion  [○]   ││
│  └──────────────────────────┘│
│──────────────────────────────│
│  Privacy & Security          │
│  ┌──────────────────────────┐│
│  │ 🔐 Biometric Login [◉]  ││
│  │ 📱 Pair Device     →   ││
│  └──────────────────────────┘│
│──────────────────────────────│
│  About                       │
│  ┌──────────────────────────┐│
│  │ 📄 Privacy Policy   →   ││
│  │ 📄 Terms of Service →   ││
│  │ ℹ️ Version    1.0.0     ││
│  └──────────────────────────┘│
│──────────────────────────────│
│  [      Sign Out      ]      │
└──────────────────────────────┘
```

## ProfileScreen Layout

```
┌──────────────────────────────┐
│  ← Back    Profile          │
├──────────────────────────────┤
│                              │
│         [Avatar]             │
│         Pet Name             │
│         Level 15             │
│                              │
│  ┌──────────────────────────┐│
│  │ 📋 Friend Code           ││
│  │ ABC123XYZ                ││
│  │ [Copy ✓]                 ││
│  └──────────────────────────┘│
│                              │
│  ┌──────────────────────────┐│
│  │ ✏️  Display Name         ││
│  │ 📧 Email                 ││
│  │ 📅 Member Since          ││
│  └──────────────────────────┘│
│                              │
│  [      Edit Profile     ]   │
│                              │
└──────────────────────────────┘
```

## Settings Options

| Setting | Type | Storage Key | Default |
|---------|------|-------------|---------|
| Notifications | Toggle | `settings.notifications` | true |
| Dark Mode | Toggle | `settings.darkMode` | system |
| Reduced Motion | Toggle | `settings.reducedMotion` | false |
| Biometric Login | Toggle | `settings.biometric` | true |

## Hướng dẫn test

### Test 1: Web
```bash
npm run web
# Navigate to SettingsScreen
# Test: toggle switches
# Test: navigation to ProfileScreen
# Test: sign out flow
# Navigate to ProfileScreen
# Test: copy friend code -> badge animation
```

### Test 2: Expo Go Android/iOS
```bash
npm start
# Scan QR
# Test: haptic on toggle
# Test: dark mode switch
# Test: biometric toggle
```

## Definition of Done

- [ ] SettingsScreen với sections (Account, Appearance, Privacy, About)
- [ ] Toggle component cho boolean settings
- [ ] Theme toggle (Dark Mode)
- [ ] Reduced Motion toggle
- [ ] Notifications toggle
- [ ] Biometric toggle
- [ ] Sign out button với confirmation
- [ ] ProfileScreen với avatar, name, level
- [ ] Friend code với copy button
- [ ] usePopAnimation cho "Copied!" badge
- [ ] Settings persisted qua storage
- [ ] Test trên web thành công
- [ ] Test trên Expo Go Android/iOS thành công
- [ ] CHANGELOG.md được update
- [ ] Commit với message `feat(settings): Step M-13 - settings + profile`
- [ ] PR được tạo và merge vào `main`

## Notes

- Dark Mode toggle cần apply theme immediately
- Reduced Motion toggle cần update theme duration
- Biometric toggle requires biometric to be set up first
- Sign out nên show confirmation Modal trước
- Future: Edit profile (name, avatar)
- Future: Change password option
