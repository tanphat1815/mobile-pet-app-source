# Step 12d — AI Chatbot BYOK (Bring Your Own Key)

**Priority:** 12d
**Effort:** Large (~1 week)
**Depends on:** —
**Visible result:** ✅ High

---

## 1. Mô tả

### Vấn đề hiện tại
Mobile chưa có AI chatbot. Hiện tại chỉ có text chat với friend (qua `ChatStore`).

Desktop (`src/core/ai/ai-config.js`, `src/core/ai/llm-client.js`, `src/core/ai/pet-chatbot.js`, `src/renderer/ai/ai-settings-view.js`):
- **BYOK AI providers:** Gemini / OpenAI / Claude / DeepSeek / Groq / Ollama
- **API key storage** (encrypted localStorage + secure)
- **Model selection** per provider
- **Custom system prompt** (user viết prompt cho pet)
- **AI playground** (test chat với pet AI)
- **Rate limit handling** (retry với backoff)

### Mục tiêu
Port AI chatbot BYOK sang mobile:
- Settings → AI section để configure
- ChatThreadScreen có tab "Pet AI" hoặc button "Chat with AI"
- Encrypted key storage với `expo-secure-store`
- LLM client abstraction (per provider)

---

## 2. Giải pháp

### 2.1 Tham chiếu desktop
- `desktop-pet-app-source/src/core/ai/ai-config.js`
- `desktop-pet-app-source/src/core/ai/llm-client.js`
- `desktop-pet-app-source/src/core/ai/pet-chatbot.js`
- `desktop-pet-app-source/src/renderer/ai/ai-settings-view.js`

### 2.2 Files mới
- `src/screens/ai/AISettingsScreen.tsx` — provider + model + API key form
- `src/screens/ai/AIChatScreen.tsx` — chat playground
- `src/api/ai/llmClient.ts` — abstraction LLM client
- `src/api/ai/providers/gemini.ts`
- `src/api/ai/providers/openai.ts`
- `src/api/ai/providers/claude.ts`
- `src/api/ai/providers/deepseek.ts`
- `src/api/ai/providers/groq.ts`
- `src/api/ai/providers/ollama.ts`
- `src/api/ai/petChatbot.ts` — wraps LLMClient + pet personality prompt
- `src/api/ai/systemPrompt.ts` — generator from pet state
- `src/stores/AIStore.ts` — provider config + key (encrypted)
- `src/shared/components/ProviderPicker.tsx`
- `src/shared/components/ModelPicker.tsx`

### 2.3 Files sửa
- `src/navigation/AppNavigator.tsx` — AI stack
- `src/screens/SettingsScreen.tsx` — AI section
- `src/screens/HomeScreen.tsx` — "Talk to AI" button
- `app.json` — add `expo-secure-store`
- `src/api/settingsTypes.ts` — AI config types

### 2.4 Schema
```typescript
export type AIProvider = 'gemini' | 'openai' | 'claude' | 'deepseek' | 'groq' | 'ollama';

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey?: string;       // encrypted via expo-secure-store
  baseUrl?: string;      // cho ollama
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMRequest {
  messages: ChatMessage[];
  model: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMResponse {
  content: string;
  usage: { inputTokens: number; outputTokens: number };
  model: string;
}
```

### 2.5 LLM client interface
```typescript
export interface LLMClient {
  chat(req: LLMRequest): Promise<LLMResponse>;
  stream?(req: LLMRequest, onChunk: (chunk: string) => void): Promise<void>;
  validateKey(): Promise<boolean>;
}
```

Implement mỗi provider:
- `gemini.ts` — `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- `openai.ts` — `https://api.openai.com/v1/chat/completions`
- `claude.ts` — `https://api.anthropic.com/v1/messages`
- `deepseek.ts` — `https://api.deepseek.com/v1/chat/completions` (OpenAI-compatible)
- `groq.ts` — `https://api.groq.com/openai/v1/chat/completions` (OpenAI-compatible)
- `ollama.ts` — local server `http://localhost:11434/api/chat`

### 2.6 API key storage
```typescript
import * as SecureStore from 'expo-secure-store';

export async function saveAPIKey(provider: string, key: string) {
  await SecureStore.setItemAsync(`ai_key_${provider}`, key);
}
export async function loadAPIKey(provider: string): Promise<string | null> {
  return await SecureStore.getItemAsync(`ai_key_${provider}`);
}
```

### 2.7 System prompt
```typescript
export function buildSystemPrompt(pet: Pet, user: UserProfile): string {
  return `You are ${pet.name}, a ${pet.species} with personality: ${pet.personality.join(', ')}.
Mood: ${pet.mood}. Energy: ${pet.energy}/100.
Hunger: ${pet.hunger}/100. Happiness: ${pet.happiness}/100.
You are talking to ${user.displayName}. Be concise, friendly, 1-2 sentences.`;
}
```

### 2.8 Rate limiting
```typescript
// Linear backoff
for (let i = 0; i < 3; i++) {
  try {
    return await client.chat(req);
  } catch (e) {
    if (e.status === 429) await sleep(2 ** i * 1000);
    else throw e;
  }
}
```

---

## 3. Kết quả kỳ vọng

- Settings → AI section với provider picker
- API key form với secure storage
- Model selection per provider
- "Talk to AI" button → AIChatScreen với conversation history
- Streaming response (optional)
- Multi-turn context window (10 messages)
- Custom system prompt editor

---

## 4. Testing

### 4.1 Playwright
```typescript
// e2e/step12d-ai.spec.ts
test('can configure OpenAI', async ({ page }) => {
  await page.goto('http://localhost:8081');
  await page.click('[data-testid="tab-settings"]');
  await page.click('[data-testid="section-ai"]');
  await page.click('[data-testid="provider-openai"]');
  await page.fill('[data-testid="api-key-input"]', 'sk-test');
  await page.fill('[data-testid="model-input"]', 'gpt-4o');
  await page.click('[data-testid="save-config"]');
  await page.waitForSelector('[data-testid="toast-config-saved"]');
});

test('can chat with AI', async ({ page, context }) => {
  // Mock fetch
  await context.route('**/v1/chat/completions', (route) =>
    route.fulfill({ status: 200, body: JSON.stringify({ choices: [{ message: { content: 'Meow!' } }] }) })
  );
  await page.click('[data-testid="card-talk-ai"]');
  await page.fill('[data-testid="chat-input"]', 'Hello pet');
  await page.click('[data-testid="send-btn"]');
  await page.waitForSelector('[data-testid="message-ai-Meow!"]');
});
```

### 4.2 Live check
- Open AI Settings → pick provider → enter key → save
- Open Talk to AI → send message → receive response
- Switch model → updated

### 4.3 So sánh desktop
Mở `desktop-pet-app-source/src/renderer/ai/ai-settings-view.html` → so sánh layout.

### 4.4 Type check
```bash
npm run typecheck
npm test
```

---

## 5. Debug

### Vấn đề 1: API key không persist sau restart
- Verify `expo-secure-store` install trong `app.json`
- iOS: keychain access; Android: keystore encryption
- Simulator/dev mode có thể không persist → expect real device test

### Vấn đề 2: CORS trên web
- Browser fetch có CORS cho OpenAI API (allow origin: *)
- Nhưng Anthropic / DeepSeek có thể block → proxy hoặc "Web not supported for this provider"

### Vấn đề 3: Rate limit 429
- Implement retry với exponential backoff
- Show toast: "Too many requests, try again in 5s"

### Vấn đề 4: Streaming response không hoạt động
- Dùng `fetch` streaming + ReadableStream trên web
- `XMLHttpRequest` upload progress trên native
- Fallback: chunked response

### Vấn đề 5: Ollama local không kết nối
- iOS simulator + Android emulator cần `10.0.2.2` thay vì `localhost`
- Real device cần IP LAN của Mac/PC chạy Ollama

---

## 6. Definition of Done

- [ ] 6 AI providers (Gemini / OpenAI / Claude / DeepSeek / Groq / Ollama)
- [ ] API key secure storage qua `expo-secure-store`
- [ ] Model picker per provider
- [ ] Custom system prompt editor
- [ ] AIChatScreen với conversation history
- [ ] Streaming response (provider supports)
- [ ] Rate limit + retry
- [ ] Playwright e2e pass
- [ ] `npm run typecheck` + `npm test` pass

---

## 7. Reference

- Desktop: `src/core/ai/ai-config.js`, `llm-client.js`, `pet-chatbot.js`, `src/renderer/ai/ai-settings-view.js`
- Mobile: `src/screens/SettingsScreen.tsx`, `src/stores/SettingsStore.ts`

---

## 8. Estimated LOC
~1000–1500 lines:
- 2 screens: ~500
- 6 provider implementations: ~400 (avg 70 each)
- LLMClient interface + retry: ~150
- System prompt builder: ~50
- Tests: ~200

---

## 9. Optional features (future)
- Token usage tracker + cost calculator
- Conversation export (Markdown)
- Multi-modal input (image upload → LLM)
- Voice input via speech-to-text
