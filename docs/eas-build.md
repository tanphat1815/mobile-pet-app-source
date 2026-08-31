# EAS Build Setup

## 1. Install EAS CLI

```bash
npm install -g eas-cli
```

## 2. Link the project

Sign in (creates an Expo account if you don't have one):

```bash
eas login
```

Link the local project to EAS. This creates the EAS project ID and
saves it under `extra.eas.projectId` in `app.json`.

```bash
cd mobile-pet-app-source
eas init
```

Take the project ID returned by `eas init` and replace the placeholder
`00000000-0000-0000-0000-000000000000` in `app.json`.

## 3. Configure the Apple App Store

For iOS production builds you'll need:

- A paid Apple Developer account
- A signed bundle identifier (`com.mobilepet.app` is already
  configured)
- App Store Connect app record with the same bundle identifier

Replace the placeholder `ascAppIdentifier` and `appleTeamId` in
`eas.json` under `submit.production.ios`.

## 4. Configure the Google Play Store

For Android production builds you'll need:

- A Google Play Console account
- A service-account JSON key with the Release Manager role

Save the JSON key as `secrets/play-store.json` (gitignored). The
path is referenced from `eas.json`.

## 5. Build profiles

This repo defines four profiles in `eas.json`:

| Profile      | Use                                 | Channel       |
|--------------|-------------------------------------|---------------|
| development  | Local development with dev client   | development   |
| preview      | Internal distribution for QA        | preview       |
| production   | App Store / Play Store release      | production    |
| simulator    | iOS simulator-only build (no device | simulator     |

### Build a profile

```bash
# Development client (iOS simulator)
npm run build:simulator

# Preview (Android APK / iOS internal)
npm run build:preview

# Production (App Store + Play Store)
npm run build:production
```

### Platform-specific

```bash
eas build --profile preview --platform ios
eas build --profile preview --platform android
```

## 6. Submit

```bash
# iOS
eas submit --platform ios --latest

# Android
eas submit --platform android --latest
```

Or via the package scripts:

```bash
npm run submit:production
npm run submit:android:production
```

## 7. Environment variables

Build-time env is declared in `eas.json` per profile. The keys
consumed at runtime are read in `src/utils/runtimeConfig.ts` and
injected into the bundle via Expo's `EXPO_PUBLIC_*` convention.

| Variable                       | Purpose                  |
|--------------------------------|--------------------------|
| `EXPO_PUBLIC_API_BASE_URL`     | REST base URL            |
| `EXPO_PUBLIC_WS_URL`           | WebSocket URL            |
| `EXPO_PUBLIC_ENV`              | env label (development,  |
|                                | staging, production)     |
| `EXPO_PUBLIC_BUILD_NUMBER`     | EAS build number         |
| `EXPO_PUBLIC_APP_VARIANT`      | ios / android / web      |
| `EXPO_PUBLIC_USE_DEV_CLIENT`   | bool                     |

## 8. Secrets

Store credentials and signing material outside git:

- Apple App Store Connect API key (`asc-api-key.json`)
- Play Store service account key (`play-store.json`)
- Match / provisioning profiles (auto-managed by EAS)

Never commit secrets. The repo's `.gitignore` should exclude
`secrets/`.

## 9. Local prebuild

To generate the `android/` and `ios/` native projects without
running a cloud build:

```bash
npm run prebuild
```

This is useful when iterating on `app.json` plugins or native
configuration.

## 10. Versions

Bump versions atomically across `package.json` and `app.json`:

```bash
npm run version:patch
npm run version:minor
npm run version:major
```

The script also bumps `android.versionCode` and
`ios.infoPlist.CFBundleVersion` so they stay in sync with the
semantic version.