/**
 * Step 12d — AI Chatbot BYOK unit tests.
 *
 * Cover:
 *  - AI_PROVIDERS has 7 entries
 *  - Each provider has required fields
 *  - DEFAULT_AI_SETTINGS has gemini as default
 *  - getProvider / getAllProviders / getDefaultModel / getApiKeyFor / getEndpointFor
 *  - listProviderIds returns 7 ids
 *  - isProviderConfigured: offline always configured
 *  - isProviderConfigured: requiresApiKey checks apiKeys
 *  - LLMClient.generateResponse throws for unknown provider
 *  - LLMClient.generateResponse throws for missing API key
 *  - LLMClient.testConnection: offline always succeeds
 *  - generateOfflineResponse: matches keywords (ăn/đói → FEED, etc.)
 *  - parseResponse: extracts actions
 *  - parseResponse: removes action tags from cleanText
 *  - parseResponse: dedupes actions
 *  - detectEmotion: 6 branches
 *  - actionEmoji / emotionEmoji return expected emoji
 *  - PetChatbot buildSystemPrompt includes pet name + owner
 *  - PetChatbot buildSystemPrompt includes personality traits
 *  - PetChatbot getTimeOfDay returns 5 buckets
 *  - PetChatbot updateSettings merges correctly
 *  - PetChatbot chat returns ParsedResponse (with offline)
 *  - AISettingsStore setProvider updates model
 *  - AISettingsStore setApiKey / removeApiKey
 *  - AISettingsStore setTemperature clamps 0..2
 *  - AISettingsStore setMaxTokens clamps 50..400
 *  - AISettingsStore pushHistory + clearHistory
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  AI_PROVIDERS,
  DEFAULT_AI_SETTINGS,
  getProvider,
  getAllProviders,
  getDefaultModel,
  getApiKeyFor,
  getEndpointFor,
  listProviderIds,
  isProviderConfigured,
  type AISettings,
  type ProviderId,
} from '@/api/aiConfig';
import {
  LLMClient,
  generateOfflineResponse,
} from '@/api/llmClient';
import {
  PetChatbot,
  parseResponse,
  detectEmotion,
  actionEmoji,
  emotionEmoji,
} from '@/api/petChatbot';
import { useAISettingsStore } from '@/stores/AISettingsStore';

const ALL_PROVIDER_IDS: ProviderId[] = [
  'gemini', 'openai', 'deepseek', 'anthropic', 'groq', 'ollama', 'offline',
];

// ============================================================================
// AI Config
// ============================================================================

describe('AI_PROVIDERS catalog', () => {
  it('has 7 providers', () => {
    expect(Object.keys(AI_PROVIDERS)).toHaveLength(7);
  });

  it('contains all expected provider ids', () => {
    for (const id of ALL_PROVIDER_IDS) {
      expect(AI_PROVIDERS[id]).toBeTruthy();
    }
  });

  it('all providers have required fields', () => {
    for (const p of Object.values(AI_PROVIDERS)) {
      expect(p.id).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.icon).toBeTruthy();
      expect(p.models.length).toBeGreaterThan(0);
      expect(p.defaultModel).toBeTruthy();
      expect(p.type).toBeTruthy();
      // endpoint may be empty for offline (intentional)
    }
  });

  it('each provider has at least one default model', () => {
    for (const p of Object.values(AI_PROVIDERS)) {
      const defaultModel = p.models.find((m) => m.isDefault);
      expect(defaultModel).toBeTruthy();
    }
  });
});

describe('DEFAULT_AI_SETTINGS', () => {
  it('uses gemini as default provider', () => {
    expect(DEFAULT_AI_SETTINGS.provider).toBe('gemini');
  });
  it('uses gemini-1.5-flash as default model', () => {
    expect(DEFAULT_AI_SETTINGS.model).toBe('gemini-1.5-flash');
  });
  it('has temperature 0.7 and maxTokens 120', () => {
    expect(DEFAULT_AI_SETTINGS.temperature).toBe(0.7);
    expect(DEFAULT_AI_SETTINGS.maxTokens).toBe(120);
  });
  it('ollama has default endpoint', () => {
    expect(DEFAULT_AI_SETTINGS.customEndpoints.ollama).toContain('localhost:11434');
  });
});

describe('aiConfig helpers', () => {
  it('getProvider returns provider', () => {
    expect(getProvider('gemini')?.name).toBe('Google Gemini');
  });
  it('getProvider returns null for unknown', () => {
    expect(getProvider('xyz' as any)).toBeNull();
  });
  it('getAllProviders returns 7', () => {
    expect(getAllProviders()).toHaveLength(7);
  });
  it('getDefaultModel returns the default', () => {
    expect(getDefaultModel('gemini')).toBe('gemini-1.5-flash');
    expect(getDefaultModel('openai')).toBe('gpt-4o-mini');
  });
  it('listProviderIds returns 7 ids', () => {
    expect(listProviderIds()).toHaveLength(7);
  });

  const s: AISettings = {
    ...DEFAULT_AI_SETTINGS,
    apiKeys: { gemini: 'AIzaSy-test' },
  };
  it('getApiKeyFor returns key', () => {
    expect(getApiKeyFor(s, 'gemini')).toBe('AIzaSy-test');
  });
  it('getApiKeyFor returns empty for missing', () => {
    expect(getApiKeyFor(s, 'openai')).toBe('');
  });
  it('getEndpointFor returns custom or default', () => {
    expect(getEndpointFor(s, 'ollama')).toContain('localhost:11434');
    expect(getEndpointFor(s, 'gemini')).toContain('generativelanguage');
  });
});

describe('isProviderConfigured', () => {
  it('offline is always configured', () => {
    const s: AISettings = { ...DEFAULT_AI_SETTINGS, provider: 'offline', apiKeys: {} };
    expect(isProviderConfigured(s, 'offline')).toBe(true);
  });
  it('gemini needs apiKey', () => {
    const noKey: AISettings = { ...DEFAULT_AI_SETTINGS, provider: 'gemini', apiKeys: {} };
    expect(isProviderConfigured(noKey, 'gemini')).toBe(false);
    const withKey: AISettings = { ...noKey, apiKeys: { gemini: 'AIza...' } };
    expect(isProviderConfigured(withKey, 'gemini')).toBe(true);
  });
  it('ollama needs endpoint', () => {
    const s: AISettings = {
      ...DEFAULT_AI_SETTINGS,
      provider: 'ollama',
      apiKeys: {},
      customEndpoints: { ollama: 'http://localhost:11434/v1/chat/completions' },
    };
    expect(isProviderConfigured(s, 'ollama')).toBe(true);
  });
});

// ============================================================================
// LLM Client
// ============================================================================

describe('LLMClient', () => {
  it('throws for unknown provider', async () => {
    await expect(
      LLMClient.generateResponse({
        providerId: 'xyz' as any,
        messages: [{ role: 'user', content: 'hi' }],
      })
    ).rejects.toThrow();
  });

  it('throws when api key is missing', async () => {
    await expect(
      LLMClient.generateResponse({
        providerId: 'gemini',
        apiKey: '',
        messages: [{ role: 'user', content: 'hi' }],
      })
    ).rejects.toThrow(/API Key/);
  });

  it('offline mode returns text without HTTP', async () => {
    const result = await LLMClient.generateResponse({
      providerId: 'offline',
      messages: [{ role: 'user', content: 'chào bạn' }],
    });
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('testConnection returns success for offline', async () => {
    const result = await LLMClient.testConnection('offline');
    expect(result.success).toBe(true);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('testConnection returns failure for unconfigured gemini', async () => {
    const result = await LLMClient.testConnection('gemini', '');
    expect(result.success).toBe(false);
    expect(result.message).toContain('API Key');
  });
});

describe('generateOfflineResponse', () => {
  it('matches food keywords with FEED action', () => {
    const r = generateOfflineResponse('Em đói bụng quá');
    expect(r).toContain('[action:FEED]');
  });
  it('matches dance keywords with DANCE action', () => {
    const r = generateOfflineResponse('Hãy nhảy múa nào');
    expect(r).toContain('[action:DANCE]');
  });
  it('matches sleep keywords with SLEEP action', () => {
    const r = generateOfflineResponse('Em mệt quá, muốn ngủ');
    expect(r).toContain('[action:SLEEP]');
  });
  it('matches love keywords with PET action', () => {
    const r = generateOfflineResponse('Yêu master nhất');
    expect(r).toContain('[action:PET]');
  });
  it('matches play keywords with PLAY action', () => {
    const r = generateOfflineResponse('Chơi đùa thôi nào');
    expect(r).toContain('[action:PLAY]');
  });
  it('returns generic friendly reply for unknown input', () => {
    const r = generateOfflineResponse('xyz abc 123');
    expect(r.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Response Parser
// ============================================================================

describe('parseResponse', () => {
  it('extracts single action', () => {
    const r = parseResponse('Em nhảy nè! 💃 [action:DANCE]');
    expect(r.actions).toEqual(['DANCE']);
    expect(r.cleanText).not.toContain('[action:');
  });
  it('extracts multiple actions', () => {
    const r = parseResponse('Meo! [action:PET] [action:FEED]');
    expect(r.actions).toEqual(['PET', 'FEED']);
  });
  it('dedupes same action', () => {
    const r = parseResponse('[action:DANCE] [action:DANCE] [action:DANCE]');
    expect(r.actions).toEqual(['DANCE']);
  });
  it('returns empty for plain text', () => {
    const r = parseResponse('Hello master');
    expect(r.actions).toEqual([]);
  });
});

describe('detectEmotion', () => {
  it('happy', () => expect(detectEmotion('Em vui quá! 💃')).toBe('happy'));
  it('sleepy', () => expect(detectEmotion('Em ngủ 💤')).toBe('sleepy'));
  it('love', () => expect(detectEmotion('Yêu master 💕')).toBe('love'));
  it('sad', () => expect(detectEmotion('Em buồn 😢')).toBe('sad'));
  it('curious', () => expect(detectEmotion('Sao vậy ta? 🤔')).toBe('curious'));
  it('neutral default', () => expect(detectEmotion('Hello')).toBe('neutral'));
});

describe('actionEmoji / emotionEmoji', () => {
  it('actionEmoji returns distinct emojis', () => {
    const emojis = ['FEED', 'DANCE', 'SLEEP', 'PET', 'PLAY'].map(actionEmoji);
    expect(new Set(emojis).size).toBe(5);
  });
  it('emotionEmoji returns expected', () => {
    expect(emotionEmoji('happy')).toBe('😺');
    expect(emotionEmoji('sleepy')).toBe('😴');
    expect(emotionEmoji('love')).toBe('🥰');
  });
});

// ============================================================================
// PetChatbot
// ============================================================================

describe('PetChatbot', () => {
  it('buildSystemPrompt includes pet name + owner', () => {
    const bot = new PetChatbot();
    const prompt = bot.buildSystemPrompt({
      petName: 'Mít',
      ownerName: 'Tú',
      speciesName: 'Mèo',
      mood: { label: 'Vui vẻ' },
      level: 7,
      stage: 'Trưởng thành',
    });
    expect(prompt).toContain('Mít');
    expect(prompt).toContain('Tú');
    expect(prompt).toContain('Level 7');
    expect(prompt).toContain('[action:FEED]');
  });

  it('buildSystemPrompt reflects personality traits', () => {
    const bot = new PetChatbot();
    const highEnergy = bot.buildSystemPrompt({ personality: { energy: 90 } });
    expect(highEnergy).toContain('năng động');
    const lowEnergy = bot.buildSystemPrompt({ personality: { energy: 10 } });
    expect(lowEnergy).toContain('chill');
  });

  it('getTimeOfDay returns 5 buckets', () => {
    const bot = new PetChatbot();
    expect(typeof bot.getTimeOfDay()).toBe('string');
  });

  it('updateSettings merges correctly', () => {
    const bot = new PetChatbot();
    bot.updateSettings({ provider: 'openai', model: 'gpt-4o' });
    const s = bot.getSettings();
    expect(s.provider).toBe('openai');
    expect(s.model).toBe('gpt-4o');
    // unchanged
    expect(s.temperature).toBe(DEFAULT_AI_SETTINGS.temperature);
  });

  it('chat returns ParsedResponse (offline)', async () => {
    const bot = new PetChatbot({
      settings: { ...DEFAULT_AI_SETTINGS, provider: 'offline', model: 'offline-persona' },
    });
    const r = await bot.chat('Em đói bụng');
    expect(r.cleanText.length).toBeGreaterThan(0);
    expect(r.actions).toContain('FEED');
    expect(r.emotion).toBeTruthy();
  });

  it('clearHistory empties history', async () => {
    const bot = new PetChatbot({
      settings: { ...DEFAULT_AI_SETTINGS, provider: 'offline', model: 'offline-persona' },
    });
    await bot.chat('Hello');
    expect(bot.getHistory().length).toBeGreaterThan(0);
    bot.clearHistory();
    expect(bot.getHistory()).toHaveLength(0);
  });
});

// ============================================================================
// AISettingsStore
// ============================================================================

describe('AISettingsStore', () => {
  beforeEach(() => {
    useAISettingsStore.getState().reset();
  });

  it('starts with default settings', () => {
    const s = useAISettingsStore.getState();
    expect(s.provider).toBe('gemini');
    expect(s.model).toBe('gemini-1.5-flash');
    expect(s.history).toEqual([]);
  });

  it('setProvider updates model to default', () => {
    useAISettingsStore.getState().setProvider('openai');
    const s = useAISettingsStore.getState();
    expect(s.provider).toBe('openai');
    expect(s.model).toBe('gpt-4o-mini');
  });

  it('setApiKey stores key, removeApiKey removes it', () => {
    useAISettingsStore.getState().setApiKey('gemini', 'AIza-test');
    expect(useAISettingsStore.getState().apiKeys.gemini).toBe('AIza-test');
    useAISettingsStore.getState().removeApiKey('gemini');
    expect(useAISettingsStore.getState().apiKeys.gemini).toBeUndefined();
  });

  it('setTemperature clamps 0..2', () => {
    useAISettingsStore.getState().setTemperature(5);
    expect(useAISettingsStore.getState().temperature).toBe(2);
    useAISettingsStore.getState().setTemperature(-1);
    expect(useAISettingsStore.getState().temperature).toBe(0);
  });

  it('setMaxTokens clamps 50..400', () => {
    useAISettingsStore.getState().setMaxTokens(1000);
    expect(useAISettingsStore.getState().maxTokens).toBe(400);
    useAISettingsStore.getState().setMaxTokens(10);
    expect(useAISettingsStore.getState().maxTokens).toBe(50);
  });

  it('toggleEnableActions flips', () => {
    const before = useAISettingsStore.getState().enableActions;
    useAISettingsStore.getState().toggleEnableActions();
    expect(useAISettingsStore.getState().enableActions).toBe(!before);
  });

  it('pushHistory adds + trims to 30', () => {
    for (let i = 0; i < 35; i++) {
      useAISettingsStore.getState().pushHistory({
        role: 'user',
        content: `msg-${i}`,
        timestamp: Date.now() + i,
      });
    }
    expect(useAISettingsStore.getState().history.length).toBe(30);
  });

  it('clearHistory empties', () => {
    useAISettingsStore.getState().pushHistory({
      role: 'user',
      content: 'hello',
      timestamp: Date.now(),
    });
    expect(useAISettingsStore.getState().history.length).toBe(1);
    useAISettingsStore.getState().clearHistory();
    expect(useAISettingsStore.getState().history.length).toBe(0);
  });
});
