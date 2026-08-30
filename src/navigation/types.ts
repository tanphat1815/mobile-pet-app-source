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
};

export type AuthStackParamList = {
  Login: undefined;
  Verify: undefined;
};