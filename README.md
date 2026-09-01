# Mobile Pet App

Mobile companion app (React Native + Expo) for the Desktop Pet App.

## Tech Stack

- **Framework**: React Native + Expo (prebuild)
- **Language**: TypeScript
- **State Management**: Zustand
- **Navigation**: React Navigation
- **API**: Axios + WebSocket
- **Animations**: react-native-reanimated
- **Push Notifications**: FCM / APNs + notifee
- **Storage**: AsyncStorage / react-native-mmkv
- **Backend**: Cloudflare Workers + D1 (reused from desktop app)

## Quick Start

```bash
# Install dependencies
npm install

# Run on web
npm run web

# Run on Android (Expo Go)
npm start
# Scan QR code with Expo Go app

# Run on Android Emulator
# Start Android Studio emulator first, then:
npm start
# Press 'a' to run on emulator

# Build for production
eas build --platform android
eas build --platform ios

# Tests
npm test                  # one-shot
npm run test:watch        # watch mode
npm run test:coverage     # coverage + threshold check
```

See `docs/testing.md` for the full testing guide and `docs/eas-build.md`
for the EAS build / submit walkthrough.

## Repository Structure

```
mobile-pet-app-source/
├── idea/                    # Roadmap & step documentation
├── src/                     # Source code
│   ├── utils/              # Theme tokens, hooks
│   ├── shared/            # Shared components & transitions
│   ├── api/               # API clients
│   ├── components/        # Feature components
│   ├── screens/           # App screens
│   ├── navigation/        # Navigation config
│   ├── store/             # Zustand stores
│   └── hooks/             # Custom hooks
├── assets/                # Sprites, icons, fonts
├── ios/                   # iOS native (generated)
├── android/               # Android native (generated)
├── __tests__/             # Unit tests
└── docs/                  # Documentation
```

## Development Phases

### Phase 1: Foundation (M-0 to M-6)
- Repository setup, scaffolding, theme system
- Shared UI component library
- API client and storage
- Authentication flow
- Realtime sync
- Home screen and pet stats

### Phase 2: Core Features (M-7 to M-13)
- Push notifications
- Chat 1-1
- Friends list
- Cross-device pairing
- Achievements and quests
- Biometric authentication and onboarding
- Settings and profile

### Phase 3: Build & Deploy (M-14 to M-15)
- Build configuration
- CI/CD and testing

### Future Phases (M-16+)
- Group chat
- Leaderboard
- Notifications center
- Music remote control
- AI chat assistant
- AR pet visualization
- Apple Watch / Wear OS companion
- Home screen widgets
- Voice messages

## License

MIT
