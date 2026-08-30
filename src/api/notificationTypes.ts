/**
 * Notification Types
 *
 * Typed shapes for push notification payloads. Server-side payload
 * format (data-only or notification+data) is documented here so the
 * client can deserialize correctly.
 */

export type NotificationCategory =
  | 'pet' // pet-related events (hungry, lonely, level up)
  | 'chat' // chat messages (foreground, background, killed states)
  | 'friend' // friend requests, status changes
  | 'achievement' // achievement unlocked
  | 'quest' // quest completed
  | 'pairing' // pairing request
  | 'system'; // app/system announcements

export interface PetNotificationData {
  category: 'pet';
  petId: string;
  reason: 'hungry' | 'sad' | 'levelup' | 'sleepy';
}

export interface ChatNotificationData {
  category: 'chat';
  conversationId: string;
  fromUserId: string;
}

export interface FriendNotificationData {
  category: 'friend';
  fromUserId: string;
}

export interface AchievementNotificationData {
  category: 'achievement';
  achievementId: string;
  xpReward: number;
}

export interface QuestNotificationData {
  category: 'quest';
  questId: string;
}

export interface PairingNotificationData {
  category: 'pairing';
  pairingCode: string;
}

export interface SystemNotificationData {
  category: 'system';
}

export type NotificationData =
  | PetNotificationData
  | ChatNotificationData
  | FriendNotificationData
  | AchievementNotificationData
  | QuestNotificationData
  | PairingNotificationData
  | SystemNotificationData;

export interface PushToken {
  /** Expo push token (ExponentPushToken[xxx]) */
  token: string;
  /** 'ios' | 'android' | 'web' */
  platform: 'ios' | 'android' | 'web';
  /** App version that produced this token */
  appVersion: string;
}

export interface IncomingNotification {
  title: string;
  body?: string;
  data?: NotificationData;
  category?: NotificationCategory;
  /** True when the app is in the foreground when notification arrives */
  isForeground?: boolean;
}

/** Convenience helpers */

export function categoryFromData(data: NotificationData | undefined): NotificationCategory {
  return data?.category ?? 'system';
}

export function navigationTargetFromData(data: NotificationData | undefined): string {
  if (!data) return 'Home';
  switch (data.category) {
    case 'pet':
      return 'Home';
    case 'chat':
      return 'Chat';
    case 'friend':
      return 'Friends';
    case 'achievement':
      return 'Achievements';
    case 'quest':
      return 'Quests';
    case 'pairing':
      return 'Pairing';
    case 'system':
    default:
      return 'Home';
  }
}