/**
 * AISettingsStore (Zustand) — Step 12d
 *
 * Persists AI Chatbot BYOK settings:
 *  - provider, model, apiKeys, customEndpoints
 *  - temperature, maxTokens, enableActions, enableVoiceReaction
 *
 * Also holds the chat history (mirrored from PetChatbot).
 */

import { create } from 'zustand';
import { storage, StorageKeys } from '../api/storage';
import {
  DEFAULT_AI_SETTINGS,
  AI_PROVIDERS,
  type AISettings,
  type ProviderId,
  getDefaultModel,
  isProviderConfigured,
} from '../api/aiConfig';
import {
  type ChatEntry,
  type Action,
  type Emotion,
  type PetContext,
} from '../api/petChatbot';

export interface AISettingsState extends AISettings {
  // Chat history
  history: ChatEntry[];

  // ─── actions ───
  setProvider: (id: ProviderId) => void;
  setModel: (model: string) => void;
  setApiKey: (providerId: ProviderId, key: string) => void;
  removeApiKey: (providerId: ProviderId) => void;
  setCustomEndpoint: (providerId: ProviderId, endpoint: string) => void;
  setTemperature: (t: number) => void;
  setMaxTokens: (n: number) => void;
  toggleEnableActions: () => void;
  toggleEnableVoiceReaction: () => void;
  reset: () => void;

  // History
  pushHistory: (entry: ChatEntry) => void;
  clearHistory: () => void;
  trimHistory: (max: number) => void;

  // Persistence
  hydrate: () => Promise<void>;
  _persist: () => Promise<void>;
}

export const useAISettingsStore = create<AISettingsState>((set, get) => ({
  ...DEFAULT_AI_SETTINGS,
  history: [],

  setProvider(id) {
    const provider = AI_PROVIDERS[id];
    set({
      provider: id,
      model: getDefaultModel(id),
    });
    void get()._persist();
  },

  setModel(model) {
    set({ model });
    void get()._persist();
  },

  setApiKey(providerId, key) {
    const trimmed = key.trim();
    set((s) => ({
      apiKeys: { ...s.apiKeys, [providerId]: trimmed },
    }));
    void get()._persist();
  },

  removeApiKey(providerId) {
    set((s) => {
      const next = { ...s.apiKeys };
      delete next[providerId];
      return { apiKeys: next };
    });
    void get()._persist();
  },

  setCustomEndpoint(providerId, endpoint) {
    set((s) => ({
      customEndpoints: { ...s.customEndpoints, [providerId]: endpoint.trim() },
    }));
    void get()._persist();
  },

  setTemperature(t) {
    const v = Math.max(0, Math.min(2, Number(t) || 0));
    set({ temperature: v });
    void get()._persist();
  },

  setMaxTokens(n) {
    const v = Math.max(50, Math.min(400, Math.round(Number(n) || 50)));
    set({ maxTokens: v });
    void get()._persist();
  },

  toggleEnableActions() {
    set((s) => ({ enableActions: !s.enableActions }));
    void get()._persist();
  },

  toggleEnableVoiceReaction() {
    set((s) => ({ enableVoiceReaction: !s.enableVoiceReaction }));
    void get()._persist();
  },

  reset() {
    set({ ...DEFAULT_AI_SETTINGS, history: [] });
  },

  pushHistory(entry) {
    set((s) => ({ history: [...s.history, entry].slice(-30) }));
    void get()._persist();
  },

  clearHistory() {
    set({ history: [] });
    void get()._persist();
  },

  trimHistory(max) {
    set((s) => ({ history: s.history.slice(-max) }));
    void get()._persist();
  },

  async hydrate() {
    try {
      const [rawSettings, rawHistory] = await Promise.all([
        storage.getJSON<AISettings>(StorageKeys.AISettings),
        storage.getJSON<ChatEntry[]>(StorageKeys.AIHistory),
      ]);
      if (rawSettings) {
        set({ ...rawSettings });
      }
      if (rawHistory?.length) {
        set({ history: rawHistory });
      }
    } catch {
      // ignore
    }
  },

  _persist: async () => {
    try {
      const s = get();
      const { history, ...settings } = s;
      await Promise.all([
        storage.setJSON(StorageKeys.AISettings, settings),
        storage.setJSON(StorageKeys.AIHistory, history),
      ]);
    } catch {
      // ignore
    }
  },
}));

// ============================================================================
// Selectors
// ============================================================================

export const selectCurrentProvider = (s: AISettingsState) => AI_PROVIDERS[s.provider];
export const selectIsConfigured = (s: AISettingsState) => isProviderConfigured(s, s.provider);
export const selectApiKeyMasked = (providerId: ProviderId) => (s: AISettingsState) => {
  const key = s.apiKeys[providerId];
  if (!key) return '';
  if (key.length <= 8) return '••••';
  return `${key.slice(0, 4)}••••${key.slice(-4)}`;
};

export const selectRecentMessages = (n: number) => (s: AISettingsState) =>
  s.history.slice(-n);

// Re-export common types
export type { Action, Emotion, PetContext };
