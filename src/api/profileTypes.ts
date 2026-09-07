/**
 * Rich Profile Types — Step 7
 *
 * Extension to AuthUser: bio, title, banner, frame, socials.
 * Profile lives in its own slice separate from auth.
 * See docs/steps/step-07-rich-profile.md.
 */

export type SocialPlatform = 'discord' | 'twitter' | 'instagram' | 'tiktok' | 'twitch';

export interface SocialHandles {
  discord?: string;
  twitter?: string;
  instagram?: string;
  tiktok?: string;
  twitch?: string;
}

export interface Profile {
  userId: string;
  displayName: string;
  avatarUrl: string;
  /** URL or null — falls back to gradient */
  bannerUrl?: string;
  bio?: string;
  title?: string;
  frameId?: string;
  /** 6-char uppercase alphanumeric share code */
  friendCode: string;
  socials?: SocialHandles;
  memberSince: number;
  stats: {
    petLevel: number;
    friends: number;
    achievements: number;
    dayStreak: number;
  };
}

export const SOCIAL_PLATFORMS: { id: SocialPlatform; label: string; emoji: string; baseUrl: (handle: string) => string }[] = [
  {
    id: 'discord',
    label: 'Discord',
    emoji: '💬',
    baseUrl: (h) => `https://discord.com/users/${h}`,
  },
  {
    id: 'twitter',
    label: 'Twitter',
    emoji: '🐦',
    baseUrl: (h) => `https://x.com/${h.replace(/^@/, '')}`,
  },
  {
    id: 'instagram',
    label: 'Instagram',
    emoji: '📷',
    baseUrl: (h) => `https://instagram.com/${h.replace(/^@/, '')}`,
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    emoji: '🎵',
    baseUrl: (h) => `https://tiktok.com/@${h.replace(/^@/, '')}`,
  },
  {
    id: 'twitch',
    label: 'Twitch',
    emoji: '🎮',
    baseUrl: (h) => `https://twitch.tv/${h.replace(/^@/, '')}`,
  },
];

export function makeFriendCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // skip ambiguous I, O, 1, 0
  let s = '';
  for (let i = 0; i < 6; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}

export function makeDefaultProfile(
  userId: string,
  displayName: string,
  avatarUrl: string,
  memberSince: number,
  stats: Profile['stats']
): Profile {
  return {
    userId,
    displayName,
    avatarUrl,
    bannerUrl: undefined,
    bio: '',
    title: '',
    frameId: 'none',
    friendCode: makeFriendCode(),
    socials: {},
    memberSince,
    stats,
  };
}

// Dev expose cho e2e tests
if (typeof globalThis !== 'undefined' && (globalThis as any).__DEV__) {
  (globalThis as any).__SOCIAL_PLATFORMS__ = SOCIAL_PLATFORMS;
  (globalThis as any).__TEST_MAKE_FRIEND_CODE__ = makeFriendCode;
  if (typeof window !== 'undefined') {
    (window as any).__SOCIAL_PLATFORMS__ = SOCIAL_PLATFORMS;
    (window as any).__TEST_MAKE_FRIEND_CODE__ = makeFriendCode;
  }
}
