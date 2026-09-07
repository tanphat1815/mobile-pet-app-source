# Step 5 — Chat Enrichment (Emoji + Stickers + Image + Message Actions)

**Priority:** 5
**Effort:** Medium-Large (~1.5–2 weeks)
**Depends on:** Step 2 (per-chat themes — optional), Step 3 (mood coupling — optional)
**Visible result:** ✅ High

---

## 1. Mô tả

### Vấn đề hiện tại
Mobile chat (`src/screens/ChatThreadScreen.tsx`) chỉ hỗ trợ text. Desktop có:
- **Emoji picker** (custom `emoji-picker-element` bundle)
- **Sticker packs** (Pets Emotions, Gestures, Celebrations, Custom)
- **Image attachments** (upload + render inline)
- **Message actions** (edit/delete/reply/react)
- **Per-chat bubble themes** (Default light/dark, Sakura, Ocean, Cyberpunk)
- **Chat history persistence**

### Mục tiêu
Port 4 nhóm tính năng vào mobile chat:
1. Emoji picker
2. Sticker packs
3. Image attachments
4. Message actions
(Per-chat bubble themes → Step riêng sau Step 2)

---

## 2. Giải pháp

### 2.1 Tham chiếu desktop
- `desktop-pet-app-source/src/renderer/chat.html`, `chat.js`
- `desktop-pet-app-source/src/renderer/emoji-picker-bundle.js`
- `desktop-pet-app-source/src/renderer/chat/sticker-packs.js`
- `desktop-pet-app-source/src/renderer/chat/image-handler.js`, `chat-media-renderer.js`
- `desktop-pet-app-source/src/renderer/chat/message-actions-controller.js`
- `desktop-pet-app-source/src/renderer/chat/emoji-data.js`

### 2.2 Files mới
- `src/shared/components/EmojiPicker.tsx` — bottom-sheet emoji grid
- `src/shared/components/StickerPanel.tsx` — sticker packs grid
- `src/shared/components/ImagePickerSheet.tsx` — choose image from camera/library
- `src/shared/components/MessageActionSheet.tsx` — long-press message menu
- `src/api/chatUpload.ts` — image upload to backend (S3-style URL)
- `src/api/emojiData.ts` — port emoji dataset
- `src/api/stickerPacks.ts` — port sticker pack definitions
- `src/shared/components/ChatImageRenderer.tsx` — render image attachment

### 2.3 Files sửa
- `src/screens/ChatThreadScreen.tsx` — thêm picker button row, long-press handler
- `src/shared/components/ChatBubble.tsx` — render text/sticker/image
- `src/shared/components/ChatInputBar.tsx` — attach button + emoji toggle
- `src/api/chat.ts` — extend sendMessage cho sticker/image, message edit/delete
- `src/api/chatTypes.ts` — MessageKind: 'text' | 'sticker' | 'image', add `editedAt`, `deletedAt`, `parentId` (reply), `reactions`
- `src/stores/ChatStore.ts` — edit/delete local, optimistic reactions

### 2.4 Schema
```typescript
export type MessageKind = 'text' | 'sticker' | 'image';

export interface StickerPack {
  id: string;
  name: string;
  category: 'emotions' | 'gestures' | 'celebrations' | 'custom';
  stickers: Array<{ id: string; emoji: string; label: string }>;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  kind: MessageKind;
  content: string;        // text, hoặc sticker id, hoặc image URL
  mediaUrl?: string;       // cho kind='image'
  mediaWidth?: number;
  mediaHeight?: number;
  parentId?: string;       // reply
  reactions?: Array<{ emoji: string; userIds: string[] }>;
  editedAt?: string;
  deletedAt?: string;
  createdAt: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
}
```

### 2.5 UI flow
- ChatInputBar có 2 button trái: emoji toggle + attach menu (chooses Sticker / Image)
- Tap attach → bottom sheet: Camera / Library / Sticker
- Sticker panel hiển thị grid packs (3 tabs ngang)
- Long press message → MessageActionSheet: Edit (own only) / Delete (own only) / Reply / React (emoji row)
- ChatBubble: nếu `kind='image'` → `ChatImageRenderer` (with `expo-image`); nếu `kind='sticker'` → emoji size 48; nếu có `parentId` → render reply preview header

### 2.6 Image upload
- Library: `expo-image-picker.launchImageLibraryAsync()`
- Camera: `expo-image-picker.launchCameraAsync()`
- Compress: `expo-image-manipulator` → resize max 1024px
- Upload: `chatUpload.upload(file)` → returns URL
- Backend: giả lập qua POST `/api/chat/upload` (nếu backend chưa có, dùng local file:// URI hiển thị preview)

---

## 3. Kết quả kỳ vọng

- Chat input có emoji picker button + attach menu
- Emoji grid scroll được, category headers
- 3–4 sticker packs (emotions, gestures, celebrations, custom)
- Image attachment: camera + library + inline preview
- Long press message → action sheet (Edit/Delete/Reply/React)
- Reactions render inline dưới bubble
- Reply preview hiển thị ở trên bubble trích dẫn

---

## 4. Testing

### 4.1 Playwright
```typescript
// e2e/step5-chat.spec.ts
test('emoji picker opens and inserts emoji', async ({ page }) => {
  await page.goto('http://localhost:8081');
  await page.click('[data-testid="chat-thread"]');
  await page.click('[data-testid="emoji-toggle"]');
  await page.waitForSelector('[data-testid="emoji-grid"]');
  await page.click('[data-testid="emoji-😀"]');
  const input = await page.inputValue('[data-testid="chat-input"]');
  expect(input).toContain('😀');
});

test('can send sticker', async ({ page }) => {
  await page.click('[data-testid="emoji-toggle"]');
  await page.click('[data-testid="sticker-tab"]');
  await page.click('[data-testid="sticker-1"]');
  await page.click('[data-testid="send-btn"]');
  await page.waitForSelector('[data-testid="message-sticker"]');
});

test('long-press shows message actions', async ({ page }) => {
  // Send 1 message first
  await page.fill('[data-testid="chat-input"]', 'hello');
  await page.click('[data-testid="send-btn"]');
  await page.waitForSelector('[data-testid="message-text"]');
  await page.locator('[data-testid="message-text"]').first().click({ button: 'right' });
  await page.waitForSelector('[data-testid="message-action-sheet"]');
});

test('reply shows parent preview', async ({ page }) => {
  // ... long press → click Reply → type → send
  await page.waitForSelector('[data-testid="reply-preview"]');
});
```

### 4.2 Live check
- Emoji picker: scroll, tap emoji → input có emoji
- Sticker: switch pack tab → tap sticker → gửi → render
- Image: tap attach → library → pick → preview → gửi → render
- Long press: action sheet hiển thị đúng

### 4.3 So sánh desktop
Mở `desktop-pet-app-source/src/renderer/chat.html`, screenshot chat với sticker + image → compare.

### 4.4 Type check + tests
```bash
npm run typecheck
npm test
```

---

## 5. Debug

### Vấn đề 1: Emoji picker quá chậm khi scroll
- Dùng `FlatList` với `getItemLayout` + `windowSize={5}`
- Memo row với `React.memo`

### Vấn đề 2: Image upload fail
- Check `app.json` permissions: `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`
- Verify backend endpoint. Nếu offline: fallback `file://`

### Vấn đề 3: Long press conflict với scroll
- Set `delayLongPress={250}` (default 500ms hơi lâu)
- Hoặc dùng `Pressable` riêng với `onLongPress`

### Vấn đề 4: Reaction toggle sai user
- Optimistic update + rollback nếu backend fail
- Reactions: `recordBy(userId)` toggle in/out

### Vấn đề 5: Reply parent message đã bị xoá
- Filter deleted khi render reply preview; hiển thị "Tin nhắn đã bị xoá"

---

## 6. Definition of Done

- [ ] Emoji picker (≥ 300 emojis, categories)
- [ ] ≥ 3 sticker packs (tối thiểu emotions + gestures + celebrations)
- [ ] Image picker (camera + library + preview + inline render)
- [ ] Message actions: Edit / Delete / Reply / React
- [ ] Reactions inline hiển thị
- [ ] Reply preview hiển thị trên bubble
- [ ] Playwright e2e pass (≥ 5 cases)
- [ ] `npm run typecheck` + `npm test` pass
- [ ] Performance: 60fps với 100 messages + scroll

---

## 7. Reference

- Desktop: `desktop-pet-app-source/src/renderer/chat/*`, `src/main/chat-history.js`, `src/renderer/emoji-picker-bundle.js`, `src/renderer/chat/sticker-packs.js`
- Mobile: `src/screens/ChatThreadScreen.tsx`, `src/shared/components/ChatBubble.tsx`, `src/shared/components/ChatInputBar.tsx`

---

## 8. Estimated LOC
~900–1400 lines mới:
- 5 components: ~600
- 2 API extensions: ~200
- Sticker data: ~150
- Sửa các file cũ: ~300
