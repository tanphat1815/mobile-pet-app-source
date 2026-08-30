# Step M-11: Achievements + Quests

## Vị trí trong roadmap

- **Thứ tự**: 11 / 16
- **Dependencies**: M-5 (Realtime Sync)
- **Branch**: `mobile-step-11-achievements`
- **PR target**: `main`

## Mục tiêu

1. Tạo AchievementsScreen (read-only viewer)
2. Tạo QuestsScreen (read-only viewer)
3. Tạo `AchievementsStore` (Zustand)
4. Sử dụng `Card` và `Badge` components
5. Progress bars cho incomplete achievements

## File tạo/sửo

```
src/
├── screens/
│   ├── AchievementsScreen.tsx  # Achievements list (NEW)
│   └── QuestsScreen.tsx        # Quests list (NEW)
└── store/
    └── achievementsStore.ts     # Achievements state (NEW)
```

## AchievementsScreen Layout

```
┌──────────────────────────────┐
│  BlurHeader: "Achievements"  │
├──────────────────────────────┤
│  12 / 50 Unlocked            │
├──────────────────────────────┤
│  ┌──────────────────────────┐ │
│  │ 🏆 Badge │ Name          │ │
│  │          │ Description   │ │
│  │          │ ████████░░ 80%│ │
│  └──────────────────────────┘ │
│  ┌──────────────────────────┐ │
│  │ ✅ Badge │ Name          │ │
│  │          │ Description   │ │
│  │          │ Unlocked 2d   │ │
│  └──────────────────────────┘ │
│           ...                 │
└──────────────────────────────┘
```

## QuestsScreen Layout

```
┌──────────────────────────────┐
│  BlurHeader: "Quests"       │
├──────────────────────────────┤
│  DAILY                       │
│  ┌──────────────────────────┐ │
│  │ 📋 Quest Name             │ │
│  │ Description...            │ │
│  │ ████████░░ 4/5     +100XP │ │
│  │ [    Claim Reward    ]    │ │
│  └──────────────────────────┘ │
│──────────────────────────────│
│  WEEKLY                      │
│  ┌──────────────────────────┐ │
│  │ 📋 Quest Name             │ │
│  │ Description...            │ │
│  │ ████░░░░░ 2/5     +500XP  │ │
│  └──────────────────────────┘ │
└──────────────────────────────┘
```

## Data Structure

```typescript
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;           // emoji hoặc icon name
  progress: number;       // 0-100
  isUnlocked: boolean;
  unlockedAt?: number;    // timestamp
  reward: {
    xp: number;
    items?: string[];
  };
}

interface Quest {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'special';
  progress: number;
  target: number;
  reward: {
    xp: number;
    items?: string[];
  };
  isClaimable: boolean;
  expiresAt: number;      // timestamp
}
```

## Hướng dẫn test

### Test 1: Web
```bash
npm run web
# Navigate to AchievementsScreen
# Verify: achievement cards với progress bars
# Navigate to QuestsScreen
# Verify: quest cards với claim buttons
```

### Test 2: Expo Go Android/iOS
```bash
npm start
# Scan QR
# Test: dark mode
# Test: scroll performance với many items
```

## Definition of Done

- [ ] AchievementsScreen với unlocked/locked sections
- [ ] Achievement cards với progress bars
- [ ] AchievementsStore với mock data (read-only)
- [ ] QuestsScreen với daily/weekly sections
- [ ] Quest cards với progress bars
- [ ] Claim button cho quest rewards
- [ ] Real-time progress update qua WebSocket
- [ ] Test trên web thành công
- [ ] Test trên Expo Go Android/iOS thành công
- [ ] CHANGELOG.md được update
- [ ] Commit với message `feat(achievements): Step M-11 - achievements + quests`
- [ ] PR được tạo và merge vào `main`

## Notes

- Read-only viewer (không có action buttons cho achievement)
- Claim button cho quest rewards gọi API
- Future: Achievement detail screen với share option
- Future: Quest refresh timer countdown
