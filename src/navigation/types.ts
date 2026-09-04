/**
 * Root Stack Param List
 *
 * Centralized navigation type definitions. The types live in this
 * dedicated module so any screen / navigator can import them without
 * pulling in the AppNavigator implementation (which would create a
 * circular import).
 */

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Phase: undefined;
};

export type MainStackParamList = {
  Home: undefined;
  ChatList: undefined;
  ChatThread: { conversationId: string };
  Friends: undefined;
  Pairing: undefined;
  Achievements: undefined;
  Quests: undefined;
  Settings: undefined;
  Profile: undefined;
  // Step 12a — Wellness stack
  WellnessHome: undefined;
  Meditation: undefined;
  Breathing: undefined;
  Pomodoro: undefined;
  Ambient: undefined;
  Gratitude: undefined;
  Mood: undefined;
  // Step 12b — Music
  MusicHome: undefined;
  // Step 12c — Adventure
  AdventureHome: undefined;
  // Step 12d — AI Chatbot BYOK
  AIChat: undefined;
  AISettings: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Verify: undefined;
};