# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release

### Step M-6 (Pet Stats Viewer)
- `src/api/petTypes.ts`: Pet domain types (Pet, PetStats, PetMood,
  PetAction), helper functions (xpForLevel, xpProgress, defaultEmoji),
  and STAT_LABELS / STAT_RANGES constants.
- `src/api/pet.ts`: Pet API module with `getPet()`, `performPetAction()`,
  and `applyLocalPetAction()`. Includes a local mock state for
  development so the UI is fully testable without a real backend.
  Each action (feed / play / sleep / pet) has deterministic effects
  on hunger, happiness, energy, xp, mood and triggers level-ups.
- `src/stores/PetStore.ts`: Zustand store for the pet.
  - `load()` - fetches pet via getPet()
  - `performAction(action)` - optimistic update (apply locally), then
    await server response, then merge authoritative state
  - `applyRealtimeUpdate(stats?, mood?)` - applies server-pushed
    realtime updates without a roundtrip
  - `pendingActions: Set<PetAction>` - tracks which action buttons are
    currently in-flight (used to disable the button + show spinner)
  - `usePetRealtimeSync()` - hook that subscribes to `pet:update` and
    `pet:mood` events from the SyncManager and pipes them into the
    store automatically
- `src/shared/components/StatBar.tsx`: Horizontal stat bar with
  animated fill (Reanimated withTiming). Color shifts based on value
  using theme tokens (success / warning / danger). Supports `inverse`
  flag for stats where low = good (e.g. hunger).
- `src/shared/components/LevelBar.tsx`: Level pill + XP progress bar.
  Shows "LV 3" badge and "currentXp / nextThreshold XP" caption.
- `src/shared/components/PetAvatar.tsx`: Large circular avatar with a
  mood-colored ring. Emoji fallback when no avatarUrl is provided.
  Subtle Reanimated wobble loop (skipped when reducedMotion is true).
  Mood emoji badge in the bottom-right corner.
- `src/shared/components/PetActionButton.tsx`: Square pressable card
  for each pet action. Shows an ActivityIndicator while pending,
  disabled state when no pet loaded.
- HomeScreen update:
  - Pet card with avatar + name + species + mood
  - LevelBar for level/XP
  - 3 StatBars for hunger / happiness / energy
  - 2x2 grid of PetActionButtons (Feed / Play / Sleep / Pet)
  - Pull-to-refresh via RefreshControl
  - Compact session card below

### Step M-5 (Realtime Sync)
- `src/api/syncTypes.ts`: Typed wire format for realtime messages.
  Includes envelope shape, server event types (pet:update, pet:mood,
  chat:message, chat:read, friend:status, friend:request,
  achievement:unlocked, quest:progress, pairing:code/confirmed,
  sync:hello/pong), client message types (client:hello/ping/subscribe/
  unsubscribe/ack), and a SyncEventPayloadMap for type-safe listeners.
- `src/api/SyncManager.ts`: Class managing a single WebSocket connection.
  - Auto-reconnect with exponential backoff (1s -> 30s) + jitter
  - Heartbeat: client pings every 30s, expects pong within 10s, otherwise
    closes the socket to trigger reconnect
  - Channel subscribe / unsubscribe (re-subscribes after reconnect)
  - Typed event subscription API: `on('pet:update', handler)` returns an
    unsubscribe fn
  - Send client messages, ack server events
  - Connection status tracking (idle, connecting, open, reconnecting,
    closed)
- `src/api/deviceId.ts`: getOrCreateDeviceId() generates a UUID and
  persists it to AsyncStorage. Used as the SyncManager clientId.
- `src/stores/SyncStore.ts`: Zustand wrapper around SyncManager.
  - Owns the manager lifecycle (created once, started on auth, stopped
    on logout)
  - Exposes connection status, reconnect attempt count, last event
    timestamp, events-received counter
  - Exports `useSyncEvent<K>(type, handler)` hook that subscribes /
    unsubscribes as React effects (typed by event type)
  - `setSyncAuthToken(token)` lets the SyncManager read the token
    synchronously on (re)connect
- `src/stores/SyncLifecycle.tsx`: React wrapper that calls syncStart /
  syncStop based on AuthStore.status, and refreshes the cached auth
  token when auth state changes.
- `src/shared/components/SyncStatusBadge.tsx`: Pill badge showing live
  connection state (Live / Connecting / Retry N / Offline).
- `App.tsx`: Wraps AppNavigator in SyncLifecycle so the WS auto-connects
  on auth.
- `HomeScreen`: Now includes a Realtime Sync card with status, reconnect
  attempt, events-received counter, and last event timestamp.

### Step M-4 (Auth Flow)
- `src/api/auth.ts`: Auth API module with `sendOtp`, `verifyOtp`, `logoutApi`.
  Dev fallback returns mock sessions so the flow is testable without a real
  backend (network errors on httpbin resolve to a mock JWT). Once the Worker
  is deployed, remove the fallback blocks and point at the real endpoints.
- `src/stores/AuthStore.ts`: Zustand store managing the auth state machine:
  restoring → (authenticated | unauthenticated) → sending → otp_sent →
  verifying → authenticated. Persists user + tokens to AsyncStorage on
  login, clears them on logout or 401.
- `src/screens/LoginScreen.tsx`: Email input with regex validation,
  calls `AuthStore.sendOtp()`, auto-replaces to Verify on success.
  KeyboardAvoidingView for proper keyboard handling on iOS/Android.
- `src/screens/VerifyScreen.tsx`: 6-digit OTP input with auto-focus on
  mount, digit-box UI (focus ring, error ring), auto-submit when 6 digits
  entered, resend countdown timer (60s), calls `AuthStore.verifyOtp()`.
  `useInputShake` triggers shake animation on error.
- `src/screens/HomeScreen.tsx`: Post-auth landing with user info card,
  auth state debug info, and logout button.
- `src/navigation/AuthNavigator.tsx`: Auth stack (Login → Verify).
- `src/navigation/AppNavigator.tsx`: Root navigator that conditionally
  renders Auth stack (unauthenticated) or Main stack (authenticated).
  AuthRestorer component calls `restoreSession()` on mount. Shows a
  centered ActivityIndicator while restoring.
- Deleted: HomePlaceholderScreen, AuthPlaceholderScreen (replaced by real screens).

### Step M-3 (API Client + Storage)
- `src/api/config.ts`: API_BASE_URL, WS_URL, timeouts, reconnect tuning.
  Reads EXPO_PUBLIC_API_BASE_URL / EXPO_PUBLIC_WS_URL env overrides.
  Currently points at httpbin / Postman echo for development.
- `src/api/storage.ts`: Typed AsyncStorage wrapper with helper methods for
  auth token, refresh token, user data, theme preference, settings flags.
- `src/api/client.ts`: Axios instance with request interceptor (Bearer
  token + X-User-Id headers) and response interceptor (normalizes errors,
  clears auth on 401). Exposes `pingApi()` for health checks and
  `getApiError()` for normalized error extraction.
- `src/types/global.d.ts`: re-declares Metro's __DEV__ global for TS.
- HomePlaceholderScreen updated with API ping + storage read/write UI
  to verify the client works end-to-end.
- Removed ComponentGallery screen (was M-2 demo only).

### Step M-2 (Shared UI Library)
- 7 Reanimated transition hooks in `src/shared/transitions/`:
  - `useModalTransition` - fade + scale + translateY for modals
  - `usePanelTransition` - bottom-up slide for panels/sheets
  - `useDropdownTransition` - fade + scale + slide for dropdowns
  - `usePopAnimation` - one-shot pop with overshoot for badges
  - `useAvatarHover` - press-in scale, spring-out for avatars/buttons
  - `useInputShake` - 4-oscillation shake for input errors
  - `usePageTransition` - horizontal slide for onboarding pages
- All hooks respect `useReducedMotion()` (durations collapse to ~1ms when on)
- 8 shared components in `src/shared/components/`:
  - `Button` (primary/secondary/danger/ghost variants, sm/md/lg sizes, loading state)
  - `Card` (default/elevated/flat variants, configurable padding)
  - `Toggle` (iOS-style switch with thumb slide + spring)
  - `TextField` (label, error state, focus ring, shake on error)
  - `Modal` (overlay + content, fade+scale, backdrop dismiss)
  - `Panel` (bottom sheet, slide up, handle indicator)
  - `Badge` (pill, count/label, pop animation, 4 variants)
  - `BlurHeader` (translucent header with leading/trailing slots, fallback to solid bg)
- `useReducedMotionDuration` helper hook
- `ComponentGallery` screen as visual verification of all components + transitions

### Step M-1 (Scaffold + Theme Foundation)
- Expo SDK 57 + React Native 0.86 + TypeScript scaffold
- Apple HIG design tokens (`src/utils/theme.ts`): light + dark color schemes, typography, 4pt spacing grid, radius, shadows, easing, duration
- `useTheme()` hook that auto-switches between light/dark based on system color scheme
- `useReducedMotion()` hook that detects iOS/Android reduced motion preference
- React Navigation skeleton with theme-aware stack navigator
- GestureHandlerRootView + SafeAreaProvider wrappers in App.tsx
- 18 sprite assets copied from desktop repo (assets/sprites/)
- Placeholder screens: HomePlaceholderScreen, AuthPlaceholderScreen
- Reanimated babel plugin configured
- Package.json with all core deps: react-native-reanimated, zustand, axios, async-storage, expo-blur

## [0.0.0] - 2026-08-30

### Added
- Repository bootstrap with roadmap and step documentation

[Unreleased]: https://github.com/tanphat1815/mobile-pet-app-source
[0.0.0]: https://github.com/tanphat1815/mobile-pet-app-source/releases/tag/v0.0.0
