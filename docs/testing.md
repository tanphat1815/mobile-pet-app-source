# Testing

This project uses [Vitest](https://vitest.dev) with a `jsdom` environment
for unit tests. Tests live under `src/__tests__/` and mirror the layout
of the modules they cover (e.g. `src/utils/format.ts` → `src/__tests__/format.test.ts`).

## Quick start

```bash
npm test              # one-shot run (CI-friendly)
npm run test:watch    # watch mode
npm run test:coverage # run + emit coverage + check thresholds
```

## What gets tested

The coverage gate (`vitest.config.ts`) tracks these files:

| File                          | Notes                                    |
|-------------------------------|------------------------------------------|
| `src/utils/format.ts`         | Pure functions: numbers / durations / %  |
| `src/utils/runtimeConfig.ts`  | Env-var parser (`EXPO_PUBLIC_*`)         |
| `src/utils/theme.ts`          | Design tokens (colors, spacing, radius)  |
| `src/api/storage.ts`          | AsyncStorage wrapper                     |
| `src/api/SyncManager.ts`      | WebSocket lifecycle + reconnect          |
| `src/stores/AuthStore.ts`     | Zustand store                            |
| `src/stores/SyncStore.ts`     | Zustand store                            |

Thresholds (lines / functions / statements / branches) are checked on every
`npm run test:coverage` run. Failing the gate fails the command.

## How the setup works

`vitest.setup.ts` registers three `vi.mock` blocks so tests can run under
jsdom without an actual device:

1. **`react-native-reanimated`** — every hook (`useSharedValue`,
   `useAnimatedStyle`, `withTiming`, …) is stubbed to its identity. This
   keeps reanimated tests cheap and prevents native bridge calls.
2. **`@react-native-async-storage/async-storage`** — replaced with an
   in-memory `Map<string, string>` so tests can `setItem`/`getItem`
   freely without persistence.
3. **`react-native`** — `View`, `Text`, `StyleSheet.create`, `Dimensions`,
   `Platform.OS`, `AccessibilityInfo`, etc. are stubbed. The mock keeps
   tests independent of React Native's Flow-typed sources, which jsdom
   cannot parse on their own.

The setup also installs a fake `WebSocket` class that records the most
recently-constructed instance on `globalThis.__getLastFake()` — used by
`SyncManager.test.ts` to drive socket events.

## What is NOT tested

- **Hooks** (`useTheme`, `useReducedMotion`, `useReducedMotionDuration`)
  are intentionally **not** unit-tested. React 19 + react-dom 19 require a
  matching test renderer for hook execution, and `@testing-library/react-native`
  ships Flow-typed sources that fail to parse under jsdom without Babel.
  These hooks are instead validated via the app-level flow (smoke run on a
  real device or Expo dev client).

  Coverage thresholds account for this — `statements` / `branches` are
  allowed to drop below 60 / 50 while `lines` + `functions` stay at 60%.

- **Native modules** (`expo-haptics`, `expo-local-authentication`,
  `expo-notifications`, …) are mocked implicitly when needed and
  exercised through their consumers (e.g. `haptics.ts`).

## Writing a new test

1. Place the file under `src/__tests__/`. Use `.test.ts` or `.test.tsx`.
2. Import the unit via the `@/` alias (configured in `vitest.config.ts`)
   or relative path.
3. Use `vi.fn()` / `vi.mock()` for mocks.
4. Keep tests pure — no real network, no real `Date.now()` (use `vi.useFakeTimers()`).
5. Re-run `npm run test:coverage` and ensure thresholds still pass.

### Example: mocking a hook's dependency

```ts
import { describe, it, expect, vi } from 'vitest';

describe('foo', () => {
  it('uses the mocked module', async () => {
    vi.resetModules();
    vi.doMock('react-native', () => ({
      Platform: { OS: 'ios' },
      AccessibilityInfo: {
        isReduceMotionEnabled: async () => true,
        addEventListener: () => ({ remove: () => {} }),
      },
    }));
    const { default: foo } = await import('@/utils/foo');
    expect(foo()).toBe(...);
  });
});
```

## Build

The `eas-build.md` guide covers EAS build profiles, signing material,
and submission flows for iOS / Android.

## CI tips

- Vitest already exits non-zero on failure, so CI scripts can do:

  ```bash
  npm run typecheck
  npm run test:coverage
  ```

  in sequence and fail the pipeline if either step fails.

- Coverage reports land in `coverage/` (HTML + json-summary). Add
  `coverage/` to `.gitignore` if it isn't already.

## Debugging

- `npm run test:watch` with a single file glob, e.g. `vitest watch src/__tests__/format.test.ts`.
- Drop `console.log` / `debugger` anywhere — `act` warnings from React
  are usually caused by state updates outside `vi.useFakeTimers` /
  awaiting a promise inside `it()`.
- If a mock needs state, expose it on `globalThis` (see the WebSocket
  pattern in `vitest.setup.ts`) so tests can grab it after the SUT runs.
