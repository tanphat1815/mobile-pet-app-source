# Mobile Pet App - Roadmap

## Overview

**Mobile Pet App** is a React Native + Expo companion app for the Desktop Pet App. It mirrors the desktop experience with mobile-specific features like push notifications, biometric authentication, and cross-device pairing.

## Quick Links

- [Step Documentation](./) - Individual step files
- [Changelog](./changelog.md) - Version history

## Development Roadmap

| Step | Name | Status | PR |
|------|------|--------|-----|
| [M-0](./step-M-0-repo-bootstrap.md) | Repo Bootstrap | **Done** (2026-08-30) | [Commit](https://github.com/tanphat1815/mobile-pet-app-source/commit/25711fa) |
| [M-1](./step-M-1-scaffold.md) | Scaffold + Theme Foundation | **Done** (2026-08-30) | [Commit](https://github.com/tanphat1815/mobile-pet-app-source/commit/1132454) |
| [M-2](./step-M-2-shared-ui-library.md) | Shared UI Library | **Done** (2026-08-30) | [Commit](https://github.com/tanphat1815/mobile-pet-app-source/commit/ce517c6) |
| [M-3](./step-M-3-api-client-storage.md) | API Client + Storage | **Done** (2026-08-30) | [Commit](https://github.com/tanphat1815/mobile-pet-app-source/commit/4bd36a0) |
| [M-4](./step-M-4-auth-flow.md) | Auth Flow (email OTP) | **Done** (2026-08-30) | [Commit](https://github.com/tanphat1815/mobile-pet-app-source/commit/1b4b609) |
| [M-2](./step-M-2-shared-ui-library.md) | Shared UI Library | Unreleased | - |
| [M-3](./step-M-3-api-client-storage.md) | API Client + Storage | Unreleased | - |
| [M-4](./step-M-4-auth-flow.md) | Auth Flow | Unreleased | - |
| [M-5](./step-M-5-realtime-sync.md) | Realtime Sync | Unreleased | - |
| [M-6](./step-M-6-home-pet-stats.md) | Home + Pet Stats | Unreleased | - |
| [M-7](./step-M-7-push-notifications.md) | Push Notifications | Unreleased | - |
| [M-8](./step-M-8-chat-1-1.md) | Chat 1-1 | Unreleased | - |
| [M-9](./step-M-9-friends-list.md) | Friends List | Unreleased | - |
| [M-10](./step-M-10-pairing.md) | Cross-Device Pairing | Unreleased | - |
| [M-11](./step-M-11-achievements-quests.md) | Achievements + Quests | Unreleased | - |
| [M-12](./step-M-12-biometric-haptics-onboarding.md) | Biometric + Haptics + Onboarding | Unreleased | - |
| [M-13](./step-M-13-settings-profile.md) | Settings + Profile | Unreleased | - |
| [M-14](./step-M-14-build-config.md) | Build Config | Unreleased | - |
| [M-15](./step-M-15-ci-cd-tests.md) | CI/CD + Tests | Unreleased | - |

## Quy tắc bắt buộc

1. **KHÔNG đụng** code trong `desktop-pet-app-source/` — mobile là repo độc lập, chỉ tham chiếu protocol/API.
2. Sprite/assets gốc (`assets/sprites/*.png`) là nguồn duy nhất — copy từ `desktop-pet-app-source/assets/sprites` qua script đồng bộ, KHÔNG vẽ lại/không hard-code.
3. **Mọi step tạo/sửa UI PHẢI**:
   - Dùng `theme.colors.*`, `theme.spacing.*`, `theme.radius.*`, `theme.shadows.*`, `theme.typography.*` từ `src/utils/theme.ts` — KHÔNG hard-code hex/px.
   - Mọi animation/transition PHẢI lấy từ `src/shared/transitions/` (hook Reanimated) — KHÔNG tự viết `Animated.timing(...)` rải rác trong screen.
   - Agent PHẢI tham chiếu rule `apple-hig` (layout tĩnh: tap-target 44pt, spacing 4pt grid) + `apple-design` (motion: spring physics, gesture) trước khi quyết định spacing/radius/timing.
   - Test cả `useColorScheme()` (light/dark) lẫn `useReducedMotion()` (iOS/Android system setting) trước khi coi step hoàn thành.
   - Cân nhắc dùng `<BlurView>` (expo-blur) cho header/panel nếu cần vibrancy trên iOS.
4. Mỗi step PHẢI chạy được (`expo start` không crash + flow chính hoạt động) trước khi commit.
5. PR description phải có: (a) file tạo/sửa, (b) cách test tay, (c) screenshot/video nếu có UI, (d) blocker.
6. CHANGELOG.md update mỗi step ở `[Unreleased]` (chuẩn Keep a Changelog).

## Architecture

```
Mobile App (React Native + Expo)
    │
    ├── HTTPS REST ──► Cloudflare Worker
    │                    │
    │                    ├── RelayHub Durable Object (realtime)
    │                    └── D1 Database
    │
    └── WebSocket ──────► (same Worker)
```

## Testing Matrix

| Step | Web | Expo Go Android | Expo Go iOS | Android Emulator | EAS Build |
|------|-----|-----------------|-------------|------------------|-----------|
| M-0  | -   | -               | -           | -                | -         |
| M-1  | ✓   | ✓               | ✓           | ○                | -         |
| M-2  | ✓   | ✓               | ✓           | ○                | -         |
| M-3  | ✓   | ✓               | ✓           | ○                | -         |
| M-4  | ✓   | ✓               | ✓           | ○                | -         |
| M-5  | ✓   | ✓               | ✓           | ○                | -         |
| M-6  | ✓   | ✓               | ✓           | ○                | -         |
| M-7  | -   | ○               | ○           | ✓                | ○         |
| M-8  | ✓   | ✓               | ✓           | ○                | -         |
| M-9  | ✓   | ✓               | ✓           | ○                | -         |
| M-10 | ✓   | ✓               | ✓           | ○                | -         |
| M-11 | ✓   | ✓               | ✓           | ○                | -         |
| M-12 | ○   | ✓               | ✓           | ✓                | ○         |
| M-13 | ✓   | ✓               | ✓           | ○                | -         |
| M-14 | -   | -               | -           | -                | ✓         |
| M-15 | -   | -               | -           | -                | ✓ (CI)    |

✓ = Required, ○ = Optional, - = Not applicable

## Future Roadmap (Phase 2+)

- M-16: Group Chat
- M-17: Leaderboard
- M-18: Notifications Center
- M-19: Music Remote Control
- M-20: AI Chat Assistant
- M-21: AR Pet Visualization
- M-22: Apple Watch / Wear OS Companion
- M-23: Home Screen Widgets
- M-24: Voice Messages

---

Last updated: 2026-08-30
