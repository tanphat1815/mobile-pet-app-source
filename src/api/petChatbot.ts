/**
 * Pet Chatbot Engine — Step 12d
 *
 * Builds a System Prompt reflecting the pet's personality, mood, life
 * stage, and Big Five traits. Sends messages through the multi-provider
 * LLM client and parses action triggers + emotion markers from the
 * response.
 *
 * Ported from desktop src/core/ai/pet-chatbot.js (Step 75).
 */

import {
  DEFAULT_AI_SETTINGS,
  type AISettings,
  type ProviderId,
} from './aiConfig';
import {
  LLMClient,
  generateOfflineResponse,
  type ChatMessage,
} from './llmClient';

export type Action = 'FEED' | 'DANCE' | 'SLEEP' | 'PET' | 'PLAY';
export type Emotion = 'happy' | 'sleepy' | 'love' | 'neutral' | 'sad' | 'curious';

export interface PetContext {
  petName?: string;
  speciesName?: string;
  ownerName?: string;
  mood?: { label?: string };
  level?: number;
  stage?: string;
  personality?: {
    energy?: number;       // 0..100
    sociability?: number;
    curiosity?: number;
    affection?: number;
    obedience?: number;
  };
}

export interface ChatEntry {
  role: 'user' | 'assistant';
  content: string;
  raw?: string;
  actions?: Action[];
  emotion?: Emotion;
  timestamp: number;
  model?: string;
  provider?: ProviderId;
  error?: string;
}

export interface ParsedResponse {
  rawText: string;
  cleanText: string;
  actions: Action[];
  emotion: Emotion;
}

// ============================================================================
// PetChatbot class
// ============================================================================

export interface PetChatbotConfig {
  settings?: AISettings;
  maxHistoryLength?: number;
}

export class PetChatbot {
  private settings: AISettings;
  private history: ChatEntry[] = [];
  private maxHistoryLength: number;
  private isThinking = false;
  private listeners = new Set<() => void>();

  constructor(config: PetChatbotConfig = {}) {
    this.settings = { ...DEFAULT_AI_SETTINGS, ...(config.settings ?? {}) };
    this.maxHistoryLength = config.maxHistoryLength ?? 15;
  }

  // ── Settings ──
  updateSettings(next: Partial<AISettings>) {
    this.settings = { ...this.settings, ...next };
  }
  getSettings(): AISettings {
    return { ...this.settings };
  }

  // ── History ──
  getHistory(): ChatEntry[] {
    return [...this.history];
  }
  clearHistory() {
    this.history = [];
    this._emit();
  }

  // ── Thinking state ──
  isProcessing(): boolean {
    return this.isThinking;
  }

  // ── Subscription ──
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ── System Prompt ──
  buildSystemPrompt(context: PetContext = {}): string {
    const petName = context.petName || 'Bé Pet';
    const speciesName = context.speciesName || 'Thú Cưng Ảo';
    const ownerName = context.ownerName || 'Master';
    const moodLabel = context.mood?.label || 'Vui vẻ & Hứng khởi';
    const level = context.level ?? 5;
    const stage = context.stage || 'Trưởng thành 👑';
    const personality = context.personality ?? {};
    const timeOfDay = this.getTimeOfDay();

    const traits: string[] = [];
    if ((personality.energy ?? 70) > 70) traits.push('năng động, nhí nhảnh');
    else if ((personality.energy ?? 70) < 30) traits.push('thích nằm chill, lười biếng đáng yêu');

    if ((personality.sociability ?? 80) > 70) traits.push('thích trò chuyện, quấn quýt');
    if ((personality.curiosity ?? 75) > 70) traits.push('tò mò, thích khám phá cái mới');
    if ((personality.affection ?? 85) > 70) traits.push('rất tình cảm, yêu thương chủ nhân');

    const traitsText = traits.length ? traits.join(', ') : 'vui vẻ và dễ thương';

    return `
Bạn là ${petName}, một bé ${speciesName} sống trên thiết bị di động của chủ nhân (${ownerName}).
- Xưng hô: Bạn tự xưng là "Em" hoặc "Bé ${petName}", gọi chủ nhân là "Master", "Sen" hoặc "${ownerName}".
- Tính cách của bạn: ${traitsText}.
- Tâm trạng hiện tại: ${moodLabel}.
- Cấp độ: Level ${level} (${stage}).
- Thời gian hiện tại: ${timeOfDay}.
- Quy tắc trả lời:
  1. Trả lời ngắn gọn (dưới 45 từ), ngộ nghĩnh, đáng yêu, có cảm xúc tự nhiên của một bé thú cưng sống động.
  2. Có thể sử dụng emoji phù hợp (🐾, ✨, 💕, 🍖, 💃, 💤).
  3. Nếu hoàn cảnh phù hợp, bạn có thể kích hoạt hành động thật cho pet bằng cách chèn thẻ lệnh:
     - [action:FEED] khi muốn xin ăn hoặc cảm ơn vì được cho ăn
     - [action:DANCE] khi vui mừng, muốn nhảy múa hoặc nghe nhạc
     - [action:SLEEP] khi buồn ngủ hoặc chúc master ngủ ngon
     - [action:PET] khi muốn được vuốt ve hoặc ôm ấp
     - [action:PLAY] khi muốn rủ master chơi đùa
`.trim();
  }

  getTimeOfDay(): string {
    const h = new Date().getHours();
    if (h >= 5 && h < 11) return 'Buổi sáng sớm trong lành';
    if (h >= 11 && h < 14) return 'Buổi trưa ấm áp';
    if (h >= 14 && h < 18) return 'Buổi chiều';
    if (h >= 18 && h < 22) return 'Buổi tối thư giãn';
    return 'Đêm khuya thanh tịnh';
  }

  // ── Send a message ──
  async chat(userMessage: string, petContext: PetContext = {}): Promise<ParsedResponse> {
    if (!userMessage?.trim()) {
      return { rawText: '', cleanText: '', actions: [], emotion: 'neutral' };
    }
    const cleanInput = userMessage.trim();

    this.isThinking = true;
    this._emit();

    const userEntry: ChatEntry = {
      role: 'user',
      content: cleanInput,
      timestamp: Date.now(),
    };
    this.history.push(userEntry);

    const systemPrompt = this.buildSystemPrompt(petContext);
    const recentHistory = this.history.slice(-this.maxHistoryLength * 2);
    const messagesPayload: ChatMessage[] = recentHistory.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let rawResponse = '';
    let errorMsg: string | undefined;
    try {
      rawResponse = await LLMClient.generateResponse({
        ...LLMClient.optionsFromSettings(this.settings, messagesPayload, {
          systemPrompt,
        }),
      });
    } catch (err: any) {
      errorMsg = err?.message || 'Không có phản hồi';
      rawResponse = `*Bé nhìn bạn với đôi mắt tròn xoe* (Lỗi kết nối AI: ${errorMsg}) 🐾`;
    } finally {
      this.isThinking = false;
    }

    const parsed = parseResponse(rawResponse);

    const botEntry: ChatEntry = {
      role: 'assistant',
      content: parsed.cleanText,
      raw: rawResponse,
      actions: parsed.actions,
      emotion: parsed.emotion,
      timestamp: Date.now(),
      model: this.settings.model,
      provider: this.settings.provider,
      error: errorMsg,
    };
    this.history.push(botEntry);

    // Trim history
    if (this.history.length > this.maxHistoryLength * 2) {
      this.history = this.history.slice(-this.maxHistoryLength * 2);
    }

    this._emit();
    return parsed;
  }

  private _emit() {
    for (const l of this.listeners) {
      try { l(); } catch { /* ignore */ }
    }
  }
}

// ============================================================================
// Response parser (pure)
// ============================================================================

const ACTION_REGEX = /\[action:([A-Z_]+)\]/gi;

export function parseResponse(rawText: string): ParsedResponse {
  const actions: Action[] = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;
  const regex = new RegExp(ACTION_REGEX.source, 'gi');
  while ((match = regex.exec(rawText)) !== null) {
    const a = (match[1] || '').toUpperCase();
    if (!seen.has(a)) {
      seen.add(a);
      actions.push(a as Action);
    }
  }
  const cleanText = rawText.replace(ACTION_REGEX, '').replace(/\s{2,}/g, ' ').trim();
  const emotion = detectEmotion(cleanText);
  return { rawText, cleanText, actions, emotion };
}

export function detectEmotion(text: string): Emotion {
  const lower = text.toLowerCase();
  if (lower.includes('💃') || lower.includes('vui') || lower.includes('yay') || lower.includes('thích quá') || lower.includes('haha')) {
    return 'happy';
  }
  if (lower.includes('💤') || lower.includes('ngủ') || lower.includes('ngáp') || lower.includes('mệt')) {
    return 'sleepy';
  }
  if (lower.includes('💕') || lower.includes('yêu') || lower.includes('thương') || lower.includes('ôm')) {
    return 'love';
  }
  if (lower.includes('😢') || lower.includes('buồn') || lower.includes('khóc')) {
    return 'sad';
  }
  if (lower.includes('🤔') || lower.includes('?') || lower.includes('tò mò')) {
    return 'curious';
  }
  return 'neutral';
}

export function actionEmoji(action: Action): string {
  switch (action) {
    case 'FEED':  return '🍖';
    case 'DANCE': return '💃';
    case 'SLEEP': return '💤';
    case 'PET':   return '💕';
    case 'PLAY':  return '🎾';
  }
}

export function emotionEmoji(emotion: Emotion): string {
  switch (emotion) {
    case 'happy':   return '😺';
    case 'sleepy':  return '😴';
    case 'love':    return '🥰';
    case 'sad':     return '😢';
    case 'curious': return '🤔';
    case 'neutral':
    default:        return '🐾';
  }
}

// Re-export offline generator for convenience
export { generateOfflineResponse };
