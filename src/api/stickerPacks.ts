/**
 * Sticker Packs
 *
 * Port từ desktop `src/renderer/chat/sticker-packs.js`. Categories:
 *  - emotions: mặt cười / buồn / ngạc nhiên
 *  - gestures: hành động / chào
 *  - celebrations: ăn mừng / thành tựu
 *  - custom: pet-themed
 *
 * Step 5 — xem docs/steps/step-05-chat-enrichment.md.
 */

import { StickerPack } from './chatTypes';

export const STICKER_PACKS: StickerPack[] = [
  // ============================================================
  // Emotions
  // ============================================================
  {
    id: 'pets_emotions',
    name: 'Pet Emotions',
    category: 'emotions',
    tint: '#FFD9B8',
    stickers: [
      { id: 'happy', emoji: '😊', label: 'Happy' },
      { id: 'love', emoji: '🥰', label: 'Love' },
      { id: 'laugh', emoji: '😂', label: 'Laugh' },
      { id: 'cool', emoji: '😎', label: 'Cool' },
      { id: 'wow', emoji: '😲', label: 'Wow' },
      { id: 'sad', emoji: '😢', label: 'Sad' },
      { id: 'sleepy', emoji: '😴', label: 'Sleepy' },
      { id: 'angry', emoji: '😠', label: 'Angry' },
      { id: 'shy', emoji: '😳', label: 'Shy' },
      { id: 'sick', emoji: '🤒', label: 'Sick' },
      { id: 'silly', emoji: '🤪', label: 'Silly' },
      { id: 'cry_laugh', emoji: '🤣', label: 'Cry-Laugh' },
    ],
  },

  // ============================================================
  // Gestures
  // ============================================================
  {
    id: 'gestures',
    name: 'Gestures',
    category: 'gestures',
    tint: '#D1E8FF',
    stickers: [
      { id: 'thumbsup', emoji: '👍', label: 'Thumbs Up' },
      { id: 'thumbsdown', emoji: '👎', label: 'Thumbs Down' },
      { id: 'wave', emoji: '👋', label: 'Wave' },
      { id: 'clap', emoji: '👏', label: 'Clap' },
      { id: 'pray', emoji: '🙏', label: 'Pray' },
      { id: 'highfive', emoji: '🙌', label: 'High Five' },
      { id: 'ok', emoji: '👌', label: 'OK' },
      { id: 'fist', emoji: '✊', label: 'Fist' },
      { id: 'point', emoji: '👉', label: 'Point' },
      { id: 'punch', emoji: '👊', label: 'Punch' },
      { id: 'muscle', emoji: '💪', label: 'Muscle' },
      { id: 'peace', emoji: '✌️', label: 'Peace' },
    ],
  },

  // ============================================================
  // Celebrations
  // ============================================================
  {
    id: 'celebrations',
    name: 'Celebrations',
    category: 'celebrations',
    tint: '#FFE1A8',
    stickers: [
      { id: 'party', emoji: '🎉', label: 'Party' },
      { id: 'tada', emoji: '🎊', label: 'Tada' },
      { id: 'fireworks', emoji: '🎆', label: 'Fireworks' },
      { id: 'cake', emoji: '🎂', label: 'Cake' },
      { id: 'gift', emoji: '🎁', label: 'Gift' },
      { id: 'balloon', emoji: '🎈', label: 'Balloon' },
      { id: 'star', emoji: '⭐', label: 'Star' },
      { id: 'trophy', emoji: '🏆', label: 'Trophy' },
      { id: 'medal', emoji: '🏅', label: 'Medal' },
      { id: 'rocket', emoji: '🚀', label: 'Rocket' },
      { id: 'crown', emoji: '👑', label: 'Crown' },
      { id: 'gem', emoji: '💎', label: 'Gem' },
    ],
  },

  // ============================================================
  // Custom (pet-themed)
  // ============================================================
  {
    id: 'pet_custom',
    name: 'Pet Pals',
    category: 'custom',
    tint: '#E5D1FF',
    stickers: [
      { id: 'cat_kiss', emoji: '😽', label: 'Cat Kiss' },
      { id: 'puppy', emoji: '🐶', label: 'Puppy' },
      { id: 'kitten', emoji: '🐱', label: 'Kitten' },
      { id: 'fox', emoji: '🦊', label: 'Fox' },
      { id: 'dragon', emoji: '🐲', label: 'Dragon' },
      { id: 'rabbit', emoji: '🐰', label: 'Rabbit' },
      { id: 'panda', emoji: '🐼', label: 'Panda' },
      { id: 'duck', emoji: '🦆', label: 'Duck' },
      { id: 'butterfly', emoji: '🦋', label: 'Butterfly' },
      { id: 'sparkle', emoji: '✨', label: 'Sparkle' },
      { id: 'rainbow', emoji: '🌈', label: 'Rainbow' },
      { id: 'sun', emoji: '☀️', label: 'Sun' },
    ],
  },
];

export function findSticker(packId: string, stickerId: string) {
  const pack = STICKER_PACKS.find((p) => p.id === packId);
  return pack?.stickers.find((s) => s.id === stickerId);
}

export function getStickerPackById(packId: string) {
  return STICKER_PACKS.find((p) => p.id === packId);
}

// Dev expose cho e2e tests
if (typeof globalThis !== 'undefined' && (globalThis as any).__DEV__) {
  (globalThis as any).__STICKER_PACKS_COUNT__ = STICKER_PACKS.length;
  (globalThis as any).__STICKER_PACKS__ = STICKER_PACKS;
  if (typeof window !== 'undefined') {
    (window as any).__STICKER_PACKS_COUNT__ = STICKER_PACKS.length;
    (window as any).__STICKER_PACKS__ = STICKER_PACKS;
  }
}
