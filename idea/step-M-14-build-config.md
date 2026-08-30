# Step M-14: Build Config

## Vị trí trong roadmap

- **Thứ tự**: 14 / 16
- **Dependencies**: M-13 (Settings + Profile)
- **Branch**: `mobile-step-14-build`
- **PR target**: `main`

## Mục tiêu

1. Setup `eas.json` cho EAS Build
2. Update `app.json` đầy đủ (bundle ID, icon, splash, permissions)
3. Tạo iOS build config (bundle ID, team ID, scheme)
4. Tạo Android build config (package name, keystore)
5. Tạo `docs/build-deploy.md`
6. Tạo `docs/testing-guide.md`
7. Test EAS Build (Android + iOS)

## File tạo/sửa

```
app.json                       # UPDATE: full config
eas.json                       # EAS Build config (NEW)
docs/
├── build-deploy.md           # Build + deploy guide (NEW)
└── testing-guide.md          # Testing matrix guide (NEW)
```

## app.json Updates

```json
{
  "expo": {
    "name": "Mobile Pet",
    "slug": "mobile-pet-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#007AFF"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.mobilepet.app",
      "infoPlist": {
        "NSCameraUsageDescription": "Camera access for AR features",
        "NSPhotoLibraryUsageDescription": "Photo library access for avatar"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#007AFF"
      },
      "package": "com.mobilepet.app",
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#007AFF"
        }
      ]
    ]
  }
}
```

## eas.json Configuration

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "simulator": false
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./path/to/api-key.json",
        "track": "production"
      },
      "ios": {
        "appleId": "your@email.com"
      }
    }
  }
}
```

## Hướng dẫn test

### Test 1: EAS Build Android (Preview)
```bash
# Login EAS
eas login

# Configure project
eas build:configure

# Build preview APK
eas build --platform android --profile preview

# Download and install on device
```

### Test 2: EAS Build iOS (Preview)
```bash
# Generate iOS credentials (first time)
eas credentials --platform ios

# Build for iOS simulator
eas build --platform ios --profile preview --local

# Or build for device (requires Apple Developer account)
eas build --platform ios --profile production
```

### Test 3: EAS Build Production
```bash
# Production build for store
eas build --platform android --profile production
eas build --platform ios --profile production
```

## Definition of Done

- [ ] `app.json` có đầy đủ config (name, icon, splash, permissions)
- [ ] iOS config (bundleIdentifier, infoPlist permissions)
- [ ] Android config (package name, permissions, adaptive icon)
- [ ] `eas.json` với development/preview/production profiles
- [ ] `docs/build-deploy.md` hướng dẫn build + deploy
- [ ] `docs/testing-guide.md` hướng dẫn test theo matrix
- [ ] EAS Build Android preview thành công
- [ ] EAS Build iOS (nếu có Apple Developer account)
- [ ] APK/IPA file được tạo và test được trên device
- [ ] CHANGELOG.md được update
- [ ] Commit với message `feat(build): Step M-14 - build config`
- [ ] PR được tạo và merge vào `main`

## Notes

- iOS build trên Windows: dùng EAS Build cloud (không cần Mac)
- Apple Developer account cần thiết để build cho iOS device
- google-services.json cho FCM cần được place trước khi build Android
- Test internal distribution trước khi production
- Future: Auto-submit to App Store / Play Store
