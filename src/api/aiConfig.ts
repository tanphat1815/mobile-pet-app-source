/**
 * AI Chatbot BYOK Config — Step 12d
 *
 * Multi-provider AI catalog (Bring Your Own Key):
 *  - Google Gemini (free tier available)
 *  - OpenAI ChatGPT (gpt-4o-mini / gpt-4o)
 *  - DeepSeek (cheap reasoning)
 *  - Anthropic Claude (emotion-rich)
 *  - Groq Cloud LPU (ultra-fast)
 *  - Ollama / Custom (local, private)
 *  - Offline Smart Persona (heuristic, no API key)
 *
 * Ported from desktop src/core/ai/ai-config.js (Step 75).
 */

export type ProviderType = 'gemini_rest' | 'openai_rest' | 'anthropic_rest' | 'offline';
export type ProviderId = 'gemini' | 'openai' | 'deepseek' | 'anthropic' | 'groq' | 'ollama' | 'offline';

export interface AIModel {
  id: string;
  name: string;
  isDefault?: boolean;
}

export interface AIProvider {
  id: ProviderId;
  name: string;
  tagline: string;
  icon: string;
  badge: string;
  badgeColor: string;
  models: AIModel[];
  defaultModel: string;
  requiresApiKey: boolean;
  apiKeyPlaceholder?: string;
  apiKeyHelpUrl?: string;
  endpoint: string;
  type: ProviderType;
  requiresEndpoint?: boolean;
  defaultEndpoint?: string;
}

// ============================================================================
// Providers
// ============================================================================

export const AI_PROVIDERS: Record<ProviderId, AIProvider> = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    tagline: 'Khuyên dùng • Miễn phí API Key tại Google AI Studio',
    icon: '🌟',
    badge: 'Free Tier Có Sẵn',
    badgeColor: '#34C759',
    models: [
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Siêu nhanh, chuẩn)', isDefault: true },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Thông minh vượt trội)' },
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Thế hệ mới)' },
    ],
    defaultModel: 'gemini-1.5-flash',
    requiresApiKey: true,
    apiKeyPlaceholder: 'AIzaSy...',
    apiKeyHelpUrl: 'https://aistudio.google.com/app/apikey',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
    type: 'gemini_rest',
  },

  openai: {
    id: 'openai',
    name: 'OpenAI ChatGPT',
    tagline: 'Chuẩn mực AI toàn cầu • GPT-4o & GPT-4o-mini',
    icon: '⚡',
    badge: 'Phổ Biến',
    badgeColor: '#007AFF',
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Nhanh & Tiết kiệm)', isDefault: true },
      { id: 'gpt-4o', name: 'GPT-4o Omni (Trí tuệ cao nhất)' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo (Cổ điển)' },
    ],
    defaultModel: 'gpt-4o-mini',
    requiresApiKey: true,
    apiKeyPlaceholder: 'sk-proj-...',
    apiKeyHelpUrl: 'https://platform.openai.com/api-keys',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    type: 'openai_rest',
  },

  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek AI',
    tagline: 'Chi phí cực rẻ • Mô hình suy luận DeepSeek V3 / R1',
    icon: '🚀',
    badge: 'Rẻ & Thông Minh',
    badgeColor: '#5856D6',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek-V3 Chat (Phản hồi nhanh)', isDefault: true },
      { id: 'deepseek-reasoner', name: 'DeepSeek-R1 Reasoner (Suy luận sâu)' },
    ],
    defaultModel: 'deepseek-chat',
    requiresApiKey: true,
    apiKeyPlaceholder: 'sk-...',
    apiKeyHelpUrl: 'https://platform.deepseek.com/api_keys',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    type: 'openai_rest',
  },

  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    tagline: 'Văn phong tự nhiên, thấu hiểu cảm xúc sâu sắc',
    icon: '🧠',
    badge: 'Cảm Xúc Tốt',
    badgeColor: '#FF9500',
    models: [
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Siêu tốc độ)', isDefault: true },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Đỉnh cao ngôn ngữ)' },
    ],
    defaultModel: 'claude-3-5-haiku-20241022',
    requiresApiKey: true,
    apiKeyPlaceholder: 'sk-ant-api03-...',
    apiKeyHelpUrl: 'https://console.anthropic.com/settings/keys',
    endpoint: 'https://api.anthropic.com/v1/messages',
    type: 'anthropic_rest',
  },

  groq: {
    id: 'groq',
    name: 'Groq Cloud LPU',
    tagline: 'Tốc độ phản hồi cực nhanh (500+ tokens/s) • Có gói miễn phí',
    icon: '⚡',
    badge: 'Siêu Tốc',
    badgeColor: '#FF2D55',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', isDefault: true },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (32k context)' },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B Instruct' },
    ],
    defaultModel: 'llama-3.3-70b-versatile',
    requiresApiKey: true,
    apiKeyPlaceholder: 'gsk_...',
    apiKeyHelpUrl: 'https://console.groq.com/keys',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    type: 'openai_rest',
  },

  ollama: {
    id: 'ollama',
    name: 'Ollama / Custom API (Local)',
    tagline: 'Chạy AI trực tiếp trên máy của bạn • 100% Riêng tư & Miễn phí',
    icon: '🏠',
    badge: 'Private & Local',
    badgeColor: '#AF52DE',
    models: [
      { id: 'llama3.2', name: 'Llama 3.2 (Meta)', isDefault: true },
      { id: 'qwen2.5', name: 'Qwen 2.5 (Alibaba)' },
      { id: 'mistral', name: 'Mistral 7B' },
      { id: 'phi3', name: 'Phi-3 Mini (Microsoft)' },
      { id: 'custom', name: 'Model tùy chỉnh' },
    ],
    defaultModel: 'llama3.2',
    defaultEndpoint: 'http://localhost:11434/v1/chat/completions',
    requiresApiKey: false,
    requiresEndpoint: true,
    apiKeyPlaceholder: 'Tùy chọn (để trống nếu dùng Ollama)',
    endpoint: 'http://localhost:11434/v1/chat/completions',
    type: 'openai_rest',
  },

  offline: {
    id: 'offline',
    name: 'Offline Smart Persona',
    tagline: 'Không cần API Key • Phản hồi bằng quy tắc thông minh cục bộ',
    icon: '🐾',
    badge: 'Offline 100%',
    badgeColor: '#8E8E93',
    models: [
      { id: 'offline-persona', name: 'Bé Pet Đáng Yêu (Heuristic)', isDefault: true },
    ],
    defaultModel: 'offline-persona',
    requiresApiKey: false,
    endpoint: '',
    type: 'offline',
  },
};

// ============================================================================
// Default settings
// ============================================================================

export interface AISettings {
  provider: ProviderId;
  model: string;
  apiKeys: Partial<Record<ProviderId, string>>;
  customEndpoints: Partial<Record<ProviderId, string>>;
  temperature: number; // 0..1
  maxTokens: number;   // 50..400
  enableActions: boolean;
  enableVoiceReaction: boolean;
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  provider: 'gemini',
  model: 'gemini-1.5-flash',
  apiKeys: {},
  customEndpoints: {
    ollama: 'http://localhost:11434/v1/chat/completions',
  },
  temperature: 0.7,
  maxTokens: 120,
  enableActions: true,
  enableVoiceReaction: true,
};

// ============================================================================
// Helpers
// ============================================================================

export function getProvider(id: ProviderId): AIProvider | null {
  return AI_PROVIDERS[id] ?? null;
}

export function getAllProviders(): AIProvider[] {
  return Object.values(AI_PROVIDERS);
}

export function getDefaultModel(providerId: ProviderId): string {
  return AI_PROVIDERS[providerId]?.defaultModel ?? '';
}

export function getApiKeyFor(settings: AISettings, providerId: ProviderId): string {
  return settings.apiKeys[providerId] ?? '';
}

export function getEndpointFor(settings: AISettings, providerId: ProviderId): string {
  return settings.customEndpoints[providerId] || AI_PROVIDERS[providerId]?.endpoint || '';
}

export function listProviderIds(): ProviderId[] {
  return Object.keys(AI_PROVIDERS) as ProviderId[];
}

export function isProviderConfigured(settings: AISettings, providerId: ProviderId): boolean {
  const provider = AI_PROVIDERS[providerId];
  if (!provider) return false;
  if (providerId === 'offline') return true;
  if (provider.requiresApiKey) {
    return !!settings.apiKeys[providerId]?.trim();
  }
  if (provider.requiresEndpoint) {
    return !!getEndpointFor(settings, providerId);
  }
  return true;
}
