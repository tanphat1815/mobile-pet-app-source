/**
 * AI Chatbot dev exposes — Step 12d e2e
 *
 * Side-effect module for __DEV__ e2e testing.
 */

import {
  AI_PROVIDERS,
  DEFAULT_AI_SETTINGS,
  isProviderConfigured,
  getApiKeyFor,
  type ProviderId,
} from './aiConfig';
import { LLMClient, generateOfflineResponse } from './llmClient';
import {
  parseResponse,
  detectEmotion,
  actionEmoji,
  emotionEmoji,
  PetChatbot,
  type ChatEntry,
} from './petChatbot';
import { useAISettingsStore } from '../stores/AISettingsStore';

if (typeof globalThis !== 'undefined' && (globalThis as any).__DEV__) {
  // Catalog
  (globalThis as any).__AI_PROVIDER_COUNT__ = Object.keys(AI_PROVIDERS).length;
  (globalThis as any).__AI_PROVIDER_IDS__ = Object.keys(AI_PROVIDERS);
  (globalThis as any).__AI_DEFAULT_SETTINGS__ = DEFAULT_AI_SETTINGS;

  // Helpers
  (globalThis as any).__AI_GET_API_KEY__ = (providerId: ProviderId) =>
    getApiKeyFor(useAISettingsStore.getState(), providerId);
  (globalThis as any).__AI_IS_CONFIGURED__ = (providerId: ProviderId) =>
    isProviderConfigured(useAISettingsStore.getState(), providerId);

  // Store actions
  (globalThis as any).__AI_SET_PROVIDER__ = (id: ProviderId) => {
    useAISettingsStore.getState().setProvider(id);
    return useAISettingsStore.getState().provider;
  };
  (globalThis as any).__AI_SET_API_KEY__ = (id: ProviderId, key: string) => {
    useAISettingsStore.getState().setApiKey(id, key);
  };
  (globalThis as any).__AI_REMOVE_API_KEY__ = (id: ProviderId) => {
    useAISettingsStore.getState().removeApiKey(id);
  };
  (globalThis as any).__AI_GET_HISTORY__ = () => useAISettingsStore.getState().history;
  (globalThis as any).__AI_CLEAR_HISTORY__ = () => {
    useAISettingsStore.getState().clearHistory();
  };
  (globalThis as any).__AI_PUSH_HISTORY__ = (entry: ChatEntry) => {
    useAISettingsStore.getState().pushHistory(entry);
  };

  // Parser
  (globalThis as any).__AI_PARSE_RESPONSE__ = (raw: string) => parseResponse(raw);
  (globalThis as any).__AI_DETECT_EMOTION__ = (text: string) => detectEmotion(text);
  (globalThis as any).__AI_ACTION_EMOJI__ = (a: string) => actionEmoji(a as any);
  (globalThis as any).__AI_EMOTION_EMOJI__ = (e: string) => emotionEmoji(e as any);

  // Offline generator
  (globalThis as any).__AI_OFFLINE_RESPONSE__ = (msg: string) => generateOfflineResponse(msg);

  // PetChatbot engine
  let _bot: PetChatbot | null = null;
  function getBot(): PetChatbot {
    if (!_bot) {
      _bot = new PetChatbot();
    }
    return _bot;
  }
  (globalThis as any).__AI_BOT_CHAT__ = async (msg: string) => {
    const bot = getBot();
    return await bot.chat(msg, {
      petName: 'Bé Pet',
      speciesName: 'Mèo Ảo',
      ownerName: 'Master',
      mood: { label: 'Vui vẻ' },
      level: 5,
    });
  };
  (globalThis as any).__AI_BOT_CLEAR__ = () => {
    getBot().clearHistory();
  };
  (globalThis as any).__AI_BOT_HISTORY__ = () => getBot().getHistory();
  (globalThis as any).__AI_BOT_UPDATE_SETTINGS__ = (next: any) => {
    getBot().updateSettings(next);
  };

  // Test connection (only offline succeeds without real API)
  (globalThis as any).__AI_TEST_CONNECTION__ = (providerId: ProviderId) =>
    LLMClient.testConnection(providerId, '', '', '');

  // Mirror to window
  if (typeof window !== 'undefined') {
    const w = window as any;
    w.__AI_PROVIDER_COUNT__ = (globalThis as any).__AI_PROVIDER_COUNT__;
    w.__AI_PROVIDER_IDS__ = (globalThis as any).__AI_PROVIDER_IDS__;
    w.__AI_DEFAULT_SETTINGS__ = (globalThis as any).__AI_DEFAULT_SETTINGS__;
    w.__AI_GET_API_KEY__ = (globalThis as any).__AI_GET_API_KEY__;
    w.__AI_IS_CONFIGURED__ = (globalThis as any).__AI_IS_CONFIGURED__;
    w.__AI_SET_PROVIDER__ = (globalThis as any).__AI_SET_PROVIDER__;
    w.__AI_SET_API_KEY__ = (globalThis as any).__AI_SET_API_KEY__;
    w.__AI_REMOVE_API_KEY__ = (globalThis as any).__AI_REMOVE_API_KEY__;
    w.__AI_GET_HISTORY__ = (globalThis as any).__AI_GET_HISTORY__;
    w.__AI_CLEAR_HISTORY__ = (globalThis as any).__AI_CLEAR_HISTORY__;
    w.__AI_PUSH_HISTORY__ = (globalThis as any).__AI_PUSH_HISTORY__;
    w.__AI_PARSE_RESPONSE__ = (globalThis as any).__AI_PARSE_RESPONSE__;
    w.__AI_DETECT_EMOTION__ = (globalThis as any).__AI_DETECT_EMOTION__;
    w.__AI_ACTION_EMOJI__ = (globalThis as any).__AI_ACTION_EMOJI__;
    w.__AI_EMOTION_EMOJI__ = (globalThis as any).__AI_EMOTION_EMOJI__;
    w.__AI_OFFLINE_RESPONSE__ = (globalThis as any).__AI_OFFLINE_RESPONSE__;
    w.__AI_BOT_CHAT__ = (globalThis as any).__AI_BOT_CHAT__;
    w.__AI_BOT_CLEAR__ = (globalThis as any).__AI_BOT_CLEAR__;
    w.__AI_BOT_HISTORY__ = (globalThis as any).__AI_BOT_HISTORY__;
    w.__AI_BOT_UPDATE_SETTINGS__ = (globalThis as any).__AI_BOT_UPDATE_SETTINGS__;
    w.__AI_TEST_CONNECTION__ = (globalThis as any).__AI_TEST_CONNECTION__;
  }
}
