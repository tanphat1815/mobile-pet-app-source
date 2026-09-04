/**
 * Avatar Frame Catalog
 *
 * Port từ desktop `src/renderer/profile/avatar-frames.js`. Mỗi frame
 * định nghĩa border width/color, glow, rarity tier và unlock condition.
 *
 * Step 7 — xem docs/steps/step-07-rich-profile.md.
 */

export type AvatarFrameRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface AvatarFrameDef {
  id: string;
  name: string;
  /** Coin price để mua (0 = miễn phí / unlocked by default / by achievement) */
  price: number;
  /** Pixel border width — 0 = no frame */
  borderWidth: number;
  /** Hex border color */
  borderColor: string;
  /** Optional glow color (CSS box-shadow analogue) */
  glowColor?: string;
  /** Rarity tier */
  rarity: AvatarFrameRarity;
  /** Free-form unlock description */
  unlockCondition?: string;
  /** Optional emoji icon */
  emoji?: string;
}

export const AVATAR_FRAMES: AvatarFrameDef[] = [
  {
    id: 'none',
    name: 'None',
    price: 0,
    borderWidth: 0,
    borderColor: 'transparent',
    rarity: 'common',
    emoji: '⚪',
  },
  {
    id: 'silver',
    name: 'Silver',
    price: 100,
    borderWidth: 3,
    borderColor: '#C0C0C0',
    rarity: 'common',
    emoji: '🥈',
  },
  {
    id: 'gold',
    name: 'Gold',
    price: 500,
    borderWidth: 3,
    borderColor: '#FFD700',
    glowColor: '#FFE57A',
    rarity: 'rare',
    emoji: '🥇',
  },
  {
    id: 'diamond',
    name: 'Diamond',
    price: 2000,
    borderWidth: 4,
    borderColor: '#B9F2FF',
    glowColor: '#B9F2FF',
    rarity: 'epic',
    emoji: '💎',
  },
  {
    id: 'legendary',
    name: 'Legendary',
    price: 5000,
    borderWidth: 5,
    borderColor: '#FF8000',
    glowColor: '#FFD700',
    rarity: 'legendary',
    emoji: '🔥',
  },
  {
    id: 'sakura',
    name: 'Sakura',
    price: 1500,
    borderWidth: 4,
    borderColor: '#FFB7C5',
    glowColor: '#FFB7C5',
    rarity: 'epic',
    unlockCondition: 'Add 3 Japanese friends',
    emoji: '🌸',
  },
  {
    id: 'anime',
    name: 'Anime',
    price: 1500,
    borderWidth: 4,
    borderColor: '#FF1493',
    glowColor: '#FF69B4',
    rarity: 'epic',
    emoji: '🎀',
  },
  {
    id: 'christmas',
    name: 'Christmas',
    price: 0,
    borderWidth: 4,
    borderColor: '#D42426',
    glowColor: '#34C759',
    rarity: 'rare',
    unlockCondition: 'Limited event unlock',
    emoji: '🎄',
  },
];

export function getAvatarFrame(id: string | undefined): AvatarFrameDef | undefined {
  if (!id) return AVATAR_FRAMES[0];
  return AVATAR_FRAMES.find((f) => f.id === id);
}

/** Rarity badge label + color */
export function rarityLabel(rarity: AvatarFrameRarity): string {
  switch (rarity) {
    case 'common':
      return 'Common';
    case 'rare':
      return 'Rare';
    case 'epic':
      return 'Epic';
    case 'legendary':
      return 'Legendary';
  }
}

export function rarityColor(rarity: AvatarFrameRarity): string {
  switch (rarity) {
    case 'common':
      return '#9CA3AF';
    case 'rare':
      return '#3B82F6';
    case 'epic':
      return '#A855F7';
    case 'legendary':
      return '#F59E0B';
  }
}

/** Build unlocked frame id set — currently unlocked if price === 0 OR
 *  enough coins OR explicit unlockCondition met. Mock: silver always
 *  unlocked. */
export function defaultUnlockedFrameIds(): Set<string> {
  return new Set(['none', 'silver', 'christmas']);
}

// Dev expose cho e2e tests
if (typeof globalThis !== 'undefined' && (globalThis as any).__DEV__) {
  (globalThis as any).__AVATAR_FRAMES__ = AVATAR_FRAMES;
  (globalThis as any).__RARITY_COLOR__ = rarityColor;
  (globalThis as any).__RARITY_LABEL__ = rarityLabel;
  (globalThis as any).__TEST_DEFAULT_UNLOCKED__ = () => defaultUnlockedFrameIds();
  if (typeof window !== 'undefined') {
    (window as any).__AVATAR_FRAMES__ = AVATAR_FRAMES;
    (window as any).__RARITY_COLOR__ = rarityColor;
    (window as any).__RARITY_LABEL__ = rarityLabel;
    (window as any).__TEST_DEFAULT_UNLOCKED__ = () => defaultUnlockedFrameIds();
  }
}
