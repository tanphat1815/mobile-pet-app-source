# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release

### Step M-13 (Settings + Profile screens)
- `src/api/settingsTypes.ts`: User settings types
  - `ThemePreference = system | light | dark`
  - `UserSettings { theme, notificationsEnabled, biometricEnabled,
    reducedMotionOverride, quietHoursEnabled, quietHoursStart,
    quietHoursEnd, showOnlineStatus, allowFriendRequests,
    autoPairKnownDevices, marketingEmails }`
  - `DEFAULT_SETTINGS`
  - `themeLabel`, `friendRequestLabel` helpers
- `src/api/settings.ts`: REST API + profile + stats
  - `getUserSettings()` returns DEFAULT_SETTINGS if nothing
    persisted yet
  - `updateUserSettings(patch)` - optimistic + persists to
    AsyncStorage under `settings.user_settings`
  - `updateProfile({ displayName?, avatarUrl? })` - merges into
    stored AuthUser
  - `getUserStats()` returns mock stats (Lv 13, 5 friends,
    4/12 achievements, 14-day streak, 30-day member)
- `src/api/storage.ts`: new key `UserSettings`
- `src/stores/SettingsStore.ts`: Zustand store
  - `settings`, `status`, `error`, `saving`, `profileSaving`,
    `profileError`, `stats`, `statsStatus`, `profileSnapshot`
  - Actions: `loadAll`, `loadStats`, `updateSetting<K>` (generic,
    optimistic with rollback on error), `saveProfile`, `reset`
- Shared UI components:
  - `SettingsSection`
    (src/shared/components/SettingsSection.tsx): section header
    (uppercase + optional description) + grouped content card
    with auto-injected `isLast` prop for last-row separators.
  - `SettingsRow`
    (src/shared/components/SettingsRow.tsx): single row with icon
    glyph, label, optional subtitle, support for `toggle`,
    `navigation`, `value` types; destructive variant.
- Screens:
  - `SettingsScreen`
    (src/screens/SettingsScreen.tsx): scrollable sections
    (Account / Appearance / Notifications / Privacy & Security /
    About). Includes theme picker Modal, friend-request picker
    Modal, Sign-out Alert, biometric toggle with capability
    re-probe and graceful fallback Alert. Uses `Modal` (which
    was extended to accept an optional `title` prop).
  - `ProfileScreen`
    (src/screens/ProfileScreen.tsx): avatar (image if URL else
    emoji), display name, email, member-since line, "Edit
    profile" button (opens a Modal with `TextField` for name +
    avatar URL), 2x2 stats grid (Pet level / Friends /
    Achievements / Day streak), "Open settings" Card. Modal
    uses the new optional `title` prop.
- Navigation:
  - `AppNavigator.tsx`: MainStack now includes `Settings` and
    `Profile`.
- `src/navigation/types.ts`: `Settings` and `Profile` already
  in `MainStackParamList` (reserved in earlier step).
- `src/shared/components/Modal.tsx`: extended to accept an
  optional `title` prop that renders a centered title above the
  content card. Backwards-compatible (optional).
- HomeScreen update:
  - Added gear (⚙) button in the header next to the sync
    status badge that navigates to Settings.
  - Display name is now tappable -> Profile.

### Step M-12 (Biometric login + haptic feedback + Onboarding slides)
- Dependencies (package.json):
  - expo-local-authentication ~57.0.2
  - expo-haptics ~57.0.2
- Permissions (app.json):
  - iOS: NSFaceIDUsageDescription
  - Android: USE_BIOMETRIC, USE_FINGERPRINT
- `src/utils/haptics.ts`: typed haptic helpers
  - Capability probe (no-op on web, no-op when Reduce Motion is on)
  - `hapticLight`, `hapticMedium`, `hapticHeavy`,
    `hapticSuccess`, `hapticWarning`, `hapticError`,
    `hapticSelection`
  - Typed dispatcher `haptic(HapticStyleName)`
  - `initHapticsAccessibility()` subscribes to
    `reduceMotionChanged` (called once in App.tsx)
- `src/api/biometricTypes.ts`: typed domain
  - `BiometryType = FaceID | TouchID | Fingerprint | Iris | OpticID
  - | None`
  - `BiometricLevel = none | weak | strong`
  - `BiometricCapability { isAvailable, biometryType, level,
    isEnrolled }`
  - `BiometricAuthResult { success, cancelled, error? }`
- `src/api/biometric.ts`: wrapper over `expo-local-authentication`
  - `getBiometricCapability()` (cached) - probes hardware,
    enrollment, supported types, security level
  - `authenticateBiometric(reason?)` - returns typed result
    (success / cancelled / error)
  - `biometryLabel`, `biometryIcon` helpers
  - `invalidateBiometricCapability()` to re-probe after settings
- `src/hooks/useBiometricAuth.ts`: React hook
  - `{ capability, authenticating, lastResult, refresh,
    authenticate }`
  - Auto-probes on mount; plays success/error haptic by default
  - Stable callbacks via internal ref
- Auth store updates (src/stores/AuthStore.ts):
  - New fields: `biometricEnabled`, `onboardingComplete`
  - New actions: `setBiometricEnabledPreference(enabled)`,
    `completeOnboarding()`
  - `restoreSession()` reads both flags from AsyncStorage in
    parallel with the token + user lookup
- Storage helpers (src/api/storage.ts):
  - `getOnboardingComplete()`, `setOnboardingComplete(bool)`
    (the existing `BiometricEnabled` helpers were already in
    place from Step M-3)
- Screens:
  - `BiometricLoginScreen`
    (src/screens/BiometricLoginScreen.tsx): shown on launch when
    // stored token + biometricEnabled. Auto-prompts the system
    biometric API on mount. Big circular biometric button with a
    pulse animation (Reanimated `withRepeat`), avatar circle,
    retry on tap, "Use password instead" fallback. Handles
    capability-not-available case gracefully.
  - `OnboardingScreen`
    (src/screens/OnboardingScreen.tsx): 6-slide horizontal
    FlatList carousel (Welcome / Feed / Play / Chat / Pair /
    Ready) with `usePageTransition` for soft entry, dot
    pagination that interpolates color + scale + opacity based
    on scroll position, dynamic CTA per slide, top-right Skip.
    Completes by writing `OnboardingComplete=true` to storage
    via `completeOnboarding()`.
- Navigation refactor (src/navigation/AppNavigator.tsx):
  - RootStack now wraps a `PhasePicker` that decides between
    `onboarding` / `biometric` / `main` / `auth` based on
    `onboardingComplete`, `biometricEnabled`, and `status`.
  - First-launch flow: Onboarding -> Login -> OTP -> optional
    Alert "Enable biometric?" -> MainStack.
  - Returning-launch flow: Biometric prompt (if enabled) ->
    MainStack, with "Use password instead" to drop into the
    AuthStack.
  - Calls `initHapticsAccessibility()` on app boot so the
    reduce-motion preference is honored throughout the session.
  - Detects the first `unauthenticated -> authenticated`
    transition and shows a one-time Alert offering to enable
    biometric login (skipped if capability is not available).

### Step M-11 (Achievements + Quests viewer, read-only)
- `src/api/achievementTypes.ts`: Achievement + Quest domain types
  - `Achievement { id, title, description, category, tier,
    unlocked, unlockedAt?, rewardCoins?, rewardXP?, icon,
    progress?, progressHint? }`
  - `AchievementCategory = care | social | exploration | collection |
    special`
  - `AchievementTier = bronze | silver | gold | platinum`
  - `QuestObjective { id, description, current, goal, done }`
  - `Quest { id, title, description, status, startTs, expiresAt?,
    objectives, rewardCoins?, rewardXP?, icon, category? }`
  - `QuestStatus = active | completed | expired`
  - Helpers: `achievementProgressPct`, `questProgressPct`,
    `tierGlyph`, `categoryGlyph`, `isQuestExpired`,
    `questCountdownLabel`
- `src/api/achievements.ts`: REST API with local mock state
  - `listAchievements()` returns 12 achievements (4 unlocked:
    First Steps, Pet's Best Friend, Squeaky Clean, Social
    Butterfly; 8 with progress)
  - `listQuests()` returns 4 quests (3 active, 1 completed)
  - `claimQuestReward(questId)` (read-only step, only mutation)
  - Local helpers: `unlockAchievement`, `bumpQuestObjective`
- `src/stores/AchievementStore.ts`: Zustand store
  - `achievements`, `quests`, `status`, `error`, `claiming`,
    `lastClaimedCoins`, `lastClaimedXP`
  - Actions: `loadAll`, `loadAchievements`, `loadQuests`,
    `claimReward`, `reset`
  - `useAchievementRealtimeSync()`: subscribes to
    `achievement:unlocked` and `quest:progress` events from
    SyncManager. Uses the existing schema
    (`QuestProgressEvent { questId, title, progress, completed }`)
    - finds the first incomplete objective and bumps it on
    progress; flips all objectives on completion. Lazy-loads on
    first mount.
- Shared UI components:
  - `AchievementCard`
    (src/shared/components/AchievementCard.tsx): 2-column grid
    card. Icon + tier glyph + title + description + category
    glyph + Unlocked Badge (or progress hint) + progress bar
    for locked ones. Subtle Reanimated pop on mount.
  - `QuestRow` (src/shared/components/QuestRow.tsx): icon circle
    + title + category badge + countdown/Done/Expired badge +
    Reanimated aggregate progress bar + per-objective sub-rows
    (with check + x/y counter) + reward line + Claim button when
    completed.
- Screens:
  - `AchievementsScreen`
    (src/screens/AchievementsScreen.tsx): Category SegmentedTabs
    (All / Care / Social / Explore / Collect / Special) with
    badge counts. "Show all / Hide locked" toggle. 2-column grid
    FlatList. Tap a card -> Alert with details + reward.
  - `QuestsScreen` (src/screens/QuestsScreen.tsx): Active /
    Completed SegmentedTabs with counts. 1Hz ticker for
    countdown. Completed quests -> Claim button -> Alert with
    reward summary.
- Navigation:
  - `AppNavigator.tsx`: MainStack now includes `Achievements` and
    `Quests`.
- HomeScreen update:
  - Added Achievements quick-link card (X of Y unlocked) + Open
    button.
  - Added Quests quick-link card (X active quests) + Open button.

### Step M-10 (Cross-device Pairing)
- `src/api/pairingTypes.ts`: Pairing domain types
  - `PairingCode { code, expiresAt, status, deviceName? }`
  - `PairedDevice { id, deviceName, platform, pairedAt, lastSeen?,
    isCurrent? }`
  - `DevicePlatform = ios | android | web`
  - `PairingStatus = pending | confirmed | expired | revoked`
  - Helpers: `formatPairingCode` (123-456), `normalizePairingCode`
    (strip non-digits, clamp 6), `secondsUntilExpiry`,
    `formatCountdown`
- `src/api/pairing.ts`: REST API with local mock state. PAIRING_TTL_MS
  is 5 minutes. Methods:
  - `generatePairingCode(deviceName?)` - returns existing if unexpired
  - `cancelPairingCode()`, `submitPairingCode(input)`
  - `listPairedDevices()`, `unpairDevice(deviceId)`
  - Local helpers `setCurrentCodeFromRealtime`,
    `addPairedDeviceFromRealtime` for SyncManager integration.
- `src/stores/PairingStore.ts`: Zustand store
  - `currentCode`, `codeBusy`, `devices`, `devicesStatus`,
    `devicesError`, `submitting`, `submitError`, `lastPairedDevice`
  - Actions: `loadDevices`, `generateCode`, `cancelCode`,
    `submitCode`, `unpair`, `clearSubmitError`, `reset`
  - `usePairingRealtimeSync()`: subscribes to `pairing:code` and
    `pairing:confirmed` from SyncManager, lazy-loads devices.
- Shared UI components:
  - `PairingCodeDisplay`
    (src/shared/components/PairingCodeDisplay.tsx): 6-digit code
    with auto-spacing, expiry countdown (MM:SS), animated
    progress bar, danger color when ≤60s left.
  - `PairedDeviceRow`
    (src/shared/components/PairedDeviceRow.tsx): platform emoji
    + device name + "This device" badge + last-seen relative + X
    button (with Alert confirmation, hidden on current device).
- `src/screens/PairingScreen.tsx`: Three tabs (Show code / Enter
  code / Devices). 1Hz ticker for countdown. Auto-generates code
  when entering Show tab. Auto-jumps to Devices tab after a
  successful pair. Pull-to-refresh on Devices.
- `src/navigation/AppNavigator.tsx`: MainStack now includes Pairing
  screen.
- `src/screens/HomeScreen.tsx`: Added Pairing quick-link card
  showing paired device count + Open button.

### Step M-9 (Friends List with online status)
- `src/api/friendTypes.ts`: Friend, FriendRequest, FriendSuggestion,
  PresenceStatus, FriendStatus. Helpers: `byPresenceThenName`,
  `byRequestOrder`, `formatLastSeen`.
- `src/api/friends.ts`: REST API with local mock state (5 friends:
  Alice/online, Carol/online, Dave/away, Bob/Emma/offline; 3 requests
  with directions and messages; 3 suggestions).
  - `listFriends()`, `listFriendRequests()`, `listFriendSuggestions()`
  - `searchFriends(q)`, `sendFriendRequest(userId, message?)`,
    `decideFriendRequest(requestId, decision)`, `cancelFriendRequest()`,
    `removeFriend(userId)`
  - Local helpers: `injectIncomingRequest`, `setFriendPresence`,
    `findFriend` for realtime integration
- `src/stores/FriendStore.ts`: Zustand store with friends,
  requests, suggestions, search state, decidingRequestIds.
  Actions: `loadAll()`, `loadFriends/Requests/Suggestions`,
  `search(q)`, `sendRequest`, `decideRequest`, `cancelRequest`,
  `removeFriend`, `reset`.
- Realtime bridge: `useFriendRealtimeSync()` hook subscribes to
  `friend:status` and `friend:request` events from the SyncManager.
  Lazy-loads on first mount.
- Shared UI components:
  - `FriendRow` (src/shared/components/FriendRow.tsx):
    Avatar with animated press-in scale (useAvatarHover), online /
    away dot, name + Lv badge, status message or last-seen, optional
    `right` slot for custom trailing content.
  - `FriendRequestRow`
    (src/shared/components/FriendRequestRow.tsx): Avatar + name +
    optional message preview + Accept/Decline (incoming) or Cancel
    (outgoing). Animated press-in.
  - `SuggestionRow` (src/shared/components/SuggestionRow.tsx):
    Avatar + name + mutual friends + reason + Add/Requested button.
  - `FriendSearchBar` (src/shared/components/FriendSearchBar.tsx):
    Search field with icon and clear button, theme-aware focus ring.
  - `SegmentedTabs` (src/shared/components/SegmentedTabs.tsx):
    Pill-style segmented control with a sliding Reanimated indicator.
    Badge-aware (e.g. "Requests 2"). Respects reduced-motion.
- `src/screens/FriendsScreen.tsx`: Three tabs (Friends / Requests /
  Suggestions). Pull-to-refresh. Long-press on a friend to remove.
  Tap a friend to start a chat (maps userId -> existing conversation
  id or opens ChatList). Suggestions tab: debounced search.
- `src/navigation/AppNavigator.tsx`: MainStack now includes Friends
  screen.
- `src/screens/HomeScreen.tsx`: Added Friends quick-link card
  showing online count + pending requests count + Open button.
- `src/shared/components/Badge.tsx`: Added `variant: 'neutral'`
  (uses theme.colors.border + theme.colors.text) for the level
  badges.

### Step M-8 (Chat 1-1 screens)
- `src/api/chatTypes.ts`: Chat domain types
  - `ChatMessage { id, conversationId, fromUserId, toUserId, kind,
    text, ts, status, meta? }`
  - `MessageStatus = pending | sent | delivered | read | failed`
  - `MessageKind = text | pet_share | system`
  - `ConversationParticipant`, `Conversation`, `SendMessageInput`,
    `SendMessageResponse`
  - Helpers: `otherParticipant`, `byUpdatedDesc`, `byTsAsc`,
    `formatRelativeTime`
- `src/api/chat.ts`: REST API for conversations + messages with a
  local mock state (3 conversations: Alice online, Bob offline, Carol
  online). Methods:
  - `listConversations()`, `getConversation(id)`, `getMessages(id)`
  - `sendMessage(id, text, clientMsgId?)` - appends to mock state
  - `markRead(id, lastReadMessageId)`
  - `appendMessage` / `markMessagesReadBy` / `injectIncomingMessage` -
    internal hooks for realtime + store integration
- `src/stores/ChatStore.ts`: Zustand store
  - `conversations`, `threads: Record<conversationId, ChatMessage[]>`
  - `threadStatus`, `pendingCount`
  - `loadConversations()`, `loadThread(id)`
  - `send({ conversationId, text, clientMsgId? })`: optimistic
    append with `pending` status, replaces with server response on
    success, marks `failed` on error
  - `markThreadRead(id)`: marks conversation as read + sends
    /chat/mark-read
  - `reset()`: clear state
- Realtime bridge: `useChatRealtimeSync()` hook subscribes to
  `chat:message` and `chat:read` events from the SyncManager and
  pipes them into the store. Also lazy-loads conversations on first
  mount.
- Shared UI components:
  - `ChatBubble` (src/shared/components/ChatBubble.tsx):
    outgoing/incoming alignment, theme-aware colors, status glyph
    (clock/check/double-check/warning), clock timestamp, optional
    sender name.
  - `ChatInputBar` (src/shared/components/ChatInputBar.tsx):
    multi-line text field, theme-aware input + send button, Enter
    to send on web, ActivityIndicator-style sending state.
  - `ConversationRow` (src/shared/components/ConversationRow.tsx):
    avatar with online dot, display name, last message preview,
    unread count badge, relative timestamp, Pressable.
- `src/screens/ChatListScreen.tsx`:
  - FlatList of conversations sorted by updatedAt desc
  - Pull-to-refresh
  - Empty / error / loading states
  - Tap → ChatThreadScreen
- `src/screens/ChatThreadScreen.tsx`:
  - FlatList of messages (oldest → newest)
  - KeyboardAvoidingView for input bar
  - Auto-scroll to bottom on new messages
  - Loads thread on mount
  - Marks thread read on mount
  - Sends via ChatStore.send (optimistic)
  - Custom navigation header showing the other participant's name
- `src/navigation/types.ts`: new shared module exporting
  `RootStackParamList`, `MainStackParamList`, `AuthStackParamList`.
- `src/navigation/AppNavigator.tsx`:
  - Uses shared types
  - MainStack now has Home / ChatList / ChatThread screens
- `src/screens/HomeScreen.tsx`:
  - Added Chat quick-link card showing total unread count + "Open"
    button → navigates to ChatList

### Step M-7 (Push Notifications)
- New dependency: `expo-notifications`, `expo-device`.
- `src/api/notificationTypes.ts`: typed notification payload shapes for
  each category (pet, chat, friend, achievement, quest, pairing,
  system). `PushToken` shape includes platform + app version.
  Helpers: `categoryFromData`, `navigationTargetFromData`.
- `src/api/NotificationService.ts` (singleton):
  - `configure()`: sets foreground notification handler + Android
    default channel.
  - `requestPermissions()`: iOS + Android permission flow.
  - `getPushToken()`: gets the Expo push token, persists to AsyncStorage
    under StorageKeys.PushToken. Caches in memory. Returns null on
    simulator/emulator. Web fallback synthesizes a token.
  - `registerWithBackend(token)`: POSTs to `/notifications/register`
    with the auth token. No-op on web.
  - `on(type, listener)`: subscribe to 'received' (foreground) or
    'tapped' (background/killed) events. Returns an unsubscribe fn.
  - `scheduleLocal(title, body, data, secondsFromNow)`: triggers a
    local notification (useful for testing on emulators).
  - `dismissAll()`, `getBadgeCount()`, `setBadgeCount()`: convenience.
  - `cleanup()`: detaches native listeners.
  - All `expo-notifications` / `expo-device` requires are lazy so the
    web bundle doesn't crash if the modules are unavailable.
- `src/api/storage.ts`: added `StorageKeys.PushToken` and
  `StorageKeys.LastNotification`.
- `src/api/config.ts`: added `APP_VERSION` constant (used in push
  token payloads).
- `src/stores/NotificationStore.ts`: Zustand wrapper exposing
  permission status, push token, registered flag, last received /
  tapped notifications, badge count. Actions:
  `requestPermissionsAndRegister`, `refreshBadge`, `dismissAll`,
  `scheduleTest`, `clearLastTapped`.
- Hooks: `useNotificationListener(type, fn)` for typed event
  subscriptions, `useNotificationStoreBridge()` auto-bridge that pipes
  received/tapped events into store state.
- `src/stores/NotificationLifecycle.tsx`: Mount inside <SyncLifecycle>.
  Configures on mount, auto-registers on auth, cleans up on logout.
- `src/shared/components/NotificationCard.tsx`: Compact card showing
  permission status, push token info, badge count, last received
  notification title. Buttons: Enable/Register, Test push (schedules
  a local notification 2s in the future), Dismiss all.
- `App.tsx`: wraps AppNavigator in <NotificationLifecycle> nested
  inside <SyncLifecycle>.
- `HomeScreen`: shows NotificationCard below the session card.
- `app.json`: added `expo-notifications` plugin (color #007AFF), iOS
  `UIBackgroundModes: ["remote-notification"]`, Android permissions
  `NOTIFICATIONS` + `POST_NOTIFICATIONS`.

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
