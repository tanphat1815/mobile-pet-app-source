# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release

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
