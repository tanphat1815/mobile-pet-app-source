# Step M-15: CI/CD + Tests

## Vị trí trong roadmap

- **Thứ tự**: 15 / 16 (step cuối cùng)
- **Dependencies**: M-14 (Build Config)
- **Branch**: `mobile-step-15-ci-cd`
- **PR target**: `main`

## Mục tiêu

1. Setup GitHub Actions cho EAS Build tự động
2. Tạo unit tests cho core modules (theme, transitions, sync, auth, stores)
3. Setup Jest configuration
4. Tạo `jest.config.js`
5. Update `docs/testing-guide.md`

## File tạo/sửa

```
jest.config.js                  # Jest config (NEW)
__tests__/
├── theme.test.ts              # Theme tokens tests (NEW)
├── transitions.test.ts         # Transition hooks tests (NEW)
├── sync.test.ts               # SyncManager tests (NEW)
├── auth.test.ts               # Auth API tests (NEW)
└── stores.test.ts             # Zustand stores tests (NEW)
.github/
└── workflows/
    └── mobile-build.yml       # CI/CD workflow (NEW)
docs/
└── testing-guide.md           # UPDATE: add jest tests
```

## Jest Configuration

```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
};
```

## Unit Tests

### theme.test.ts

```typescript
describe('theme', () => {
  it('should have all required color tokens', () => {
    expect(theme.colors.accent).toBeDefined();
    expect(theme.colors.success).toBeDefined();
    // ...
  });

  it('should export spacing array with 4pt grid', () => {
    expect(theme.spacing[1]).toBe(4);
    expect(theme.spacing[2]).toBe(8);
    // ...
  });

  it('should have duration values', () => {
    expect(theme.duration.fast).toBe(150);
    expect(theme.duration.base).toBe(220);
    expect(theme.duration.slow).toBe(360);
  });
});
```

### transitions.test.ts

```typescript
describe('useModalTransition', () => {
  it('should return correct initial styles', () => {
    const { overlayStyle, contentStyle } = useModalTransition();
    expect(overlayStyle.opacity).toBe(0);
    expect(contentStyle.transform).toEqual([{ scale: 0.9 }]);
  });
});
```

### sync.test.ts

```typescript
describe('SyncManager', () => {
  it('should connect with auth token', () => {
    const manager = new SyncManager();
    manager.connect('test-token');
    // verify WebSocket created
  });

  it('should schedule reconnect on disconnect', () => {
    jest.useFakeTimers();
    const manager = new SyncManager();
    manager.connect('test-token');
    manager.disconnect();
    jest.advanceTimersByTime(1000);
    // verify reconnect attempted
  });
});
```

## GitHub Actions Workflow

```yaml
name: Mobile Build CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm test
        with:
          coverage: true

  build-android:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - uses: expo/expo-github-action@v8
        with:
          expo-token: ${{ secrets.EXPO_TOKEN }}
      - run: npx expo install --check
      - run: eas build --platform android --non-interactive

  build-ios:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - uses: expo/expo-github-action@v8
        with:
          expo-token: ${{ secrets.EXPO_TOKEN }}
      - run: npx expo install --check
      - run: eas build --platform ios --non-interactive
```

## Hướng dẫn test

### Test 1: Run Jest locally
```bash
npm test
# Run all tests
# Verify coverage report
```

### Test 2: Run specific test
```bash
npm test -- --testPathPattern=theme
npm test -- --testPathPattern=transitions
```

### Test 3: GitHub Actions
```bash
# Push to main -> verify CI triggers
# Check Actions tab on GitHub
# Verify: test job passes
# Verify: build jobs run after test
```

## Definition of Done

- [ ] Jest configuration với jest-expo preset
- [ ] Unit tests cho theme tokens
- [ ] Unit tests cho transitions hooks (output shape)
- [ ] Unit tests cho SyncManager (connect/disconnect/reconnect)
- [ ] Unit tests cho AuthStore
- [ ] Unit tests cho Zustand stores
- [ ] GitHub Actions workflow
- [ ] CI chạy test trên mọi PR
- [ ] CI chạy EAS Build sau khi merge vào main
- [ ] `docs/testing-guide.md` updated với jest tests
- [ ] All tests pass locally
- [ ] All tests pass in CI
- [ ] CHANGELOG.md được update
- [ ] Commit với message `feat(ci): Step M-15 - CI/CD + tests`
- [ ] PR được tạo và merge vào `main`

## Notes

- Expo SDK 50+ dùng jest-expo preset
- Mock WebSocket/AsyncStorage trong tests
- Coverage target: 80% cho core modules
- EAS Build secrets cần thiết:
  - `EXPO_TOKEN`: từ expo.dev settings
  - `ANDROID_FIREBASE_KEY`: google-services.json
  - iOS credentials (nếu auto-submit)
