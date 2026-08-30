# Step M-3: API Client + Storage

## Vị trí trong roadmap

- **Thứ tự**: 3 / 16
- **Dependencies**: M-2 (Shared UI Library)
- **Branch**: `mobile-step-3-api-client`
- **PR target**: `main`

## Mục tiêu

1. Tạo Axios wrapper với interceptors (auth, error handling)
2. Tạo storage abstraction (AsyncStorage / react-native-mmkv)
3. Tạo API config (`API_BASE_URL`, `WS_URL`)
4. Tạo theme-aware error handler
5. Xóa `ComponentGallery.tsx` (đã hoàn thành nhiệm vụ demo)

## File tạo/sửa

```
src/
├── api/
│   ├── client.ts          # Axios instance + interceptors (NEW)
│   ├── config.ts          # API_BASE_URL, WS_URL (NEW)
│   └── storage.ts         # AsyncStorage/MMKV wrapper (NEW)
├── utils/
│   └── storage.ts         # Export typed storage helpers (NEW)
└── screens/
    └── ComponentGallery.tsx  # XÓA ở step này
```

## API Client (`src/api/client.ts`)

```typescript
import axios from 'axios';
import { API_BASE_URL } from './config';
import { getStoredToken, clearStoredAuth } from './storage';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: add auth token
client.interceptors.request.use(async (config) => {
  const token = await getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle errors
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await clearStoredAuth();
      // TODO: trigger re-auth flow
    }
    return Promise.reject(error);
  }
);

export default client;
```

## Storage Abstraction (`src/utils/storage.ts`)

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MMKV } from 'react-native-mmkv';

// Use MMKV if available (faster), fallback to AsyncStorage
const storage = new MMKV({ id: 'app-storage' });

export const storage = {
  getString: (key: string) => storage.getString(key) ?? null,
  set: (key: string, value: string) => storage.set(key, value),
  delete: (key: string) => storage.delete(key),
  // ... helper methods for auth token, theme preference, etc.
};
```

## Hướng dẫn test

### Test 1: Web
```bash
npm run web
# Test: gọi /api/health endpoint
# Verify: storage hoạt động, interceptors không crash
```

### Test 2: Expo Go Android/iOS
```bash
npm start
# Scan QR
# Test: storage trên device, dark mode persistence
```

## Definition of Done

- [ ] Axios client được tạo với base URL từ config
- [ ] Request interceptor thêm auth token
- [ ] Response interceptor xử lý 401 (clear auth)
- [ ] Storage abstraction hỗ trợ get/set/delete
- [ ] Auth storage helpers (token, user data)
- [ ] Theme preference được persist qua storage
- [ ] `ComponentGallery.tsx` được xóa
- [ ] Test gọi `/api/health` trên web thành công
- [ ] CHANGELOG.md được update
- [ ] Commit với message `feat(api): Step M-3 - API client + storage`
- [ ] PR được tạo và merge vào `main`

## Notes

- Sử dụng `react-native-mmkv` cho performance tốt hơn AsyncStorage
- Có fallback graceful nếu MMKV không available
- Config phải point đến desktop worker URL (hoặc staging env)
