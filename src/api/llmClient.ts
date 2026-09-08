/**
 * LLM HTTP Client — Step 12d
 *
 * Multi-provider HTTP client supporting:
 *  - Gemini REST (Google AI Studio)
 *  - OpenAI-compatible REST (OpenAI, DeepSeek, Groq, Ollama)
 *  - Anthropic Messages API
 *  - Offline heuristic fallback
 *
 * Ported from desktop src/core/ai/llm-client.js (Step 75).
 * Uses `fetch` so it works in both web (e2e) and React Native (which
 * polyfills fetch). 20s timeout via AbortController.
 */

import {
  AI_PROVIDERS,
  type AISettings,
  type ProviderId,
  getApiKeyFor,
  getEndpointFor,
} from './aiConfig';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GenerateOptions {
  providerId: ProviderId;
  model?: string;
  apiKey?: string;
  customEndpoint?: string;
  systemPrompt?: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface TestConnectionResult {
  success: boolean;
  latencyMs: number;
  message: string;
  sampleReply?: string;
}

const DEFAULT_TIMEOUT_MS = 20_000;

// ============================================================================
// LLMClient class — pure functions, no state
// ============================================================================

export const LLMClient = {
  async generateResponse(options: GenerateOptions): Promise<string> {
    const {
      providerId,
      model,
      apiKey = '',
      customEndpoint = '',
      systemPrompt = '',
      messages,
      temperature = 0.7,
      maxTokens = 120,
      timeoutMs = DEFAULT_TIMEOUT_MS,
    } = options;

    const provider = AI_PROVIDERS[providerId];
    if (!provider) {
      throw new Error(`Nhà cung cấp AI "${providerId}" không được hỗ trợ!`);
    }

    if (providerId === 'offline') {
      return generateOfflineResponse(messages[messages.length - 1]?.content || '');
    }

    if (provider.requiresApiKey && !apiKey) {
      throw new Error(`Vui lòng nhập API Key cho ${provider.name} trong phần Cài đặt!`);
    }

    const targetModel = model || provider.defaultModel;

    switch (provider.type) {
      case 'gemini_rest':
        return await callGemini(apiKey, targetModel, systemPrompt, messages, temperature, maxTokens, timeoutMs);
      case 'anthropic_rest':
        return await callAnthropic(apiKey, targetModel, systemPrompt, messages, temperature, maxTokens, timeoutMs);
      case 'openai_rest':
      default: {
        const endpoint = customEndpoint || provider.endpoint;
        return await callOpenAICompatible(endpoint, apiKey, targetModel, systemPrompt, messages, temperature, maxTokens, timeoutMs);
      }
    }
  },

  /**
   * Convenience: build options from AISettings
   */
  optionsFromSettings(
    settings: AISettings,
    messages: ChatMessage[],
    overrides: Partial<GenerateOptions> = {}
  ): GenerateOptions {
    return {
      providerId: settings.provider,
      model: settings.model,
      apiKey: getApiKeyFor(settings, settings.provider),
      customEndpoint: getEndpointFor(settings, settings.provider),
      temperature: settings.temperature,
      maxTokens: settings.maxTokens,
      messages,
      ...overrides,
    };
  },

  async testConnection(
    providerId: ProviderId,
    apiKey = '',
    customEndpoint = '',
    model = '',
    timeoutMs = DEFAULT_TIMEOUT_MS
  ): Promise<TestConnectionResult> {
    const provider = AI_PROVIDERS[providerId];
    if (!provider) {
      return { success: false, latencyMs: 0, message: 'Provider không hợp lệ' };
    }

    if (providerId === 'offline') {
      return { success: true, latencyMs: 5, message: 'Chế độ Offline sẵn sàng!' };
    }

    const targetModel = model || provider.defaultModel;
    const startTime = Date.now();

    try {
      const reply = await LLMClient.generateResponse({
        providerId,
        model: targetModel,
        apiKey,
        customEndpoint,
        systemPrompt: 'Bạn là bé pet đáng yêu. Trả lời "Gâu gâu!" hoặc "Meo meo!" thật ngắn gọn.',
        messages: [{ role: 'user', content: 'Ping test' }],
        maxTokens: 20,
        timeoutMs,
      });

      const latencyMs = Date.now() - startTime;
      return {
        success: true,
        latencyMs,
        message: `Kết nối thành công! Phản hồi trong ${latencyMs}ms.`,
        sampleReply: reply,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      return {
        success: false,
        latencyMs,
        message: err?.message || 'Không thể kết nối đến máy chủ AI',
      };
    }
  },
};

// ============================================================================
// Gemini REST
// ============================================================================

async function callGemini(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: ChatMessage[],
  temperature: number,
  maxTokens: number,
  timeoutMs: number
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body: any = {
    contents,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  };

  if (systemPrompt) {
    body.systemInstruction = {
      parts: [{ text: systemPrompt }],
    };
  }

  return fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, timeoutMs, 'Gemini').then((res) => {
    const candidate = res.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text || '';
    return text.trim();
  });
}

// ============================================================================
// OpenAI-compatible REST (OpenAI, DeepSeek, Groq, Ollama)
// ============================================================================

async function callOpenAICompatible(
  endpoint: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: ChatMessage[],
  temperature: number,
  maxTokens: number,
  timeoutMs: number
): Promise<string> {
  const formattedMessages: ChatMessage[] = [];
  if (systemPrompt) {
    formattedMessages.push({ role: 'system', content: systemPrompt });
  }
  for (const m of messages) {
    formattedMessages.push({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    });
  }

  const body = {
    model,
    messages: formattedMessages,
    temperature,
    max_tokens: maxTokens,
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  return fetchWithTimeout(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  }, timeoutMs, 'OpenAI-Compatible').then((res) => {
    const text = res.choices?.[0]?.message?.content || '';
    return text.trim();
  });
}

// ============================================================================
// Anthropic Messages API
// ============================================================================

async function callAnthropic(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: ChatMessage[],
  temperature: number,
  maxTokens: number,
  timeoutMs: number
): Promise<string> {
  const url = 'https://api.anthropic.com/v1/messages';

  const formattedMessages = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));

  const body: any = {
    model,
    max_tokens: maxTokens,
    temperature,
    messages: formattedMessages,
  };
  if (systemPrompt) body.system = systemPrompt;

  return fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
      'dangerously-allow-browser': 'true',
    },
    body: JSON.stringify(body),
  }, timeoutMs, 'Anthropic').then((res) => {
    const text = res.content?.[0]?.text || '';
    return text.trim();
  });
}

// ============================================================================
// fetch wrapper with timeout
// ============================================================================

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  providerLabel: string
): Promise<any> {
  // React Native polyfills AbortController. Web has it natively.
  const controller = (typeof AbortController !== 'undefined')
    ? new AbortController()
    : null;
  const timeoutId = controller
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;

  try {
    const res = await fetch(url, {
      ...init,
      ...(controller ? { signal: controller.signal } : {}),
    });

    if (timeoutId) clearTimeout(timeoutId);

    if (!res.ok) {
      let errMsg = `Lỗi ${providerLabel} API HTTP ${res.status}`;
      try {
        const errData = await res.json();
        errMsg = errData?.error?.message || errData?.message || errMsg;
      } catch {
        // ignore parse error
      }
      throw new Error(errMsg);
    }

    return await res.json();
  } catch (err: any) {
    if (timeoutId) clearTimeout(timeoutId);
    if (err?.name === 'AbortError') {
      throw new Error(`Yêu cầu ${providerLabel} quá hạn (Timeout ${Math.round(timeoutMs / 1000)}s)!`);
    }
    throw err;
  }
}

// ============================================================================
// Offline heuristic fallback
// ============================================================================

export function generateOfflineResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes('ăn') || lower.includes('đói') || lower.includes('đồ ăn')) {
    return 'Meo meo! Em đói bụng quá rồi, master cho em xin đồ ăn ngon nha! 🍖 [action:FEED]';
  }
  if (lower.includes('nhảy') || lower.includes('múa') || lower.includes('dance') || lower.includes('hát')) {
    return 'Giai điệu hay quá! Em nhảy múa cho master xem nè! 💃✨ [action:DANCE]';
  }
  if (lower.includes('ngủ') || lower.includes('mệt') || lower.includes('nghỉ')) {
    return 'Oa... em buồn ngủ quá rồi. Chúc master ngủ ngon nhé! 💤 [action:SLEEP]';
  }
  if (lower.includes('thương') || lower.includes('yêu') || lower.includes('vuốt')) {
    return 'Em cũng yêu master nhất trên đời luôn! 💕 [action:PET]';
  }
  if (lower.includes('chào') || lower.includes('hello') || lower.includes('hi')) {
    return 'Chào master yêu dấu! Hôm nay master có chuyện gì vui kể cho em nghe với nha! ✨';
  }
  if (lower.includes('chơi') || lower.includes('đùa')) {
    return 'Woohoo! Em thích chơi lắm! Master chơi với em nha! 🎾 [action:PLAY]';
  }

  // Generic friendly replies
  const replies = [
    'Em đang lắng nghe master nè! 🐾',
    'Meo meo! Em hiểu rồi! ✨',
    'Gâu gâu! Thật thú vị quá! 🌟',
    'Em yêu master nhiều lắm! 💕',
    '*vẫy đuôi* Chuyện của master hay quá! 🐶',
  ];
  return replies[Math.floor(Math.random() * replies.length)];
}
