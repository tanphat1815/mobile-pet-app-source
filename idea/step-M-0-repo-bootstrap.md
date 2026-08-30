# Step M-0: Repo Bootstrap

## Vị trí trong roadmap

- **Thứ tự**: 0 / 16
- **Dependencies**: Không có (step đầu tiên)
- **Branch**: `main` (push trực tiếp, không cần PR)

## Mục tiêu

Tạo repo mới, khởi tạo cấu trúc thư mục `idea/`, tạo tất cả 16 step files, README, CHANGELOG, .gitignore, và push lên GitHub.

## File tạo/sửa

```
mobile-pet-app-source/
├── README.md
├── CHANGELOG.md
├── .gitignore
└── idea/
    ├── readme.md              # Roadmap tổng + quy tắc bắt buộc
    ├── changelog.md           # Changelog của roadmap
    ├── step-M-0-repo-bootstrap.md     # File này
    ├── step-M-1-scaffold.md
    ├── step-M-2-shared-ui-library.md
    ├── step-M-3-api-client-storage.md
    ├── step-M-4-auth-flow.md
    ├── step-M-5-realtime-sync.md
    ├── step-M-6-home-pet-stats.md
    ├── step-M-7-push-notifications.md
    ├── step-M-8-chat-1-1.md
    ├── step-M-9-friends-list.md
    ├── step-M-10-pairing.md
    ├── step-M-11-achievements-quests.md
    ├── step-M-12-biometric-haptics-onboarding.md
    ├── step-M-13-settings-profile.md
    ├── step-M-14-build-config.md
    └── step-M-15-ci-cd-tests.md
```

## Hướng dẫn test

Step này **không cần test runtime** vì chỉ tạo file documentation.

Kiểm tra bằng tay:
1. Mở `idea/readme.md` xem roadmap có đầy đủ 16 step links không
2. Mở từng `step-M-*.md` xem nội dung có đúng format không
3. Verify `.gitignore` có đủ các pattern cần thiết cho Expo/React Native

## Definition of Done

- [ ] Tất cả 16 step files được tạo trong `idea/`
- [ ] `idea/readme.md` có đầy đủ links đến các step files
- [ ] `idea/readme.md` có section "Quy tắc bắt buộc"
- [ ] `idea/readme.md` có testing matrix
- [ ] `README.md` có Quick Start guide
- [ ] `CHANGELOG.md` đúng format Keep a Changelog
- [ ] `.gitignore` có đủ Expo/React Native patterns
- [ ] Git repo được init
- [ ] Commit đầu tiên được tạo
- [ ] Remote origin được thêm (GitHub URL)
- [ ] Code được push lên `main`

## Git Commands

```bash
cd mobile-pet-app-source
git init
git add .
git commit -m "chore: bootstrap mobile app repository with roadmap"
git branch -M main
git remote add origin https://github.com/tanphat1815/mobile-pet-app-source.git
git push -u origin main
```

## Notes

- Step này push thẳng lên `main`, không tạo PR vì đây là initial commit.
- Từ Step M-1 trở đi, mỗi step sẽ tạo branch riêng + PR.
