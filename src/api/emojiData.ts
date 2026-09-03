/**
 * Emoji Data
 *
 * Common emoji dataset cho EmojiPicker. Port từ desktop
 * `src/renderer/chat/emoji-data.js`. Bộ 100+ emoji phổ biến được nhóm
 * theo category.
 *
 * Step 5 — xem docs/steps/step-05-chat-enrichment.md.
 */

export type EmojiCategory =
  | 'smileys'
  | 'gestures'
  | 'animals'
  | 'food'
  | 'activities'
  | 'objects'
  | 'nature'
  | 'symbols';

export interface EmojiGroup {
  id: EmojiCategory;
  label: string;
  icon: string;
  emojis: string[];
}

export const EMOJI_GROUPS: EmojiGroup[] = [
  {
    id: 'smileys',
    label: 'Mặt cười',
    icon: '😀',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
      '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
      '😘', '😗', '☺️', '😚', '😙', '🥲', '😋', '😛',
      '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
      '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄',
      '😬', '🤥', '😔', '😪', '🤤', '😴', '😷', '🤒',
      '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵',
      '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟',
      '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦',
      '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖',
      '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡',
      '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡',
    ],
  },
  {
    id: 'gestures',
    label: 'Cử chỉ',
    icon: '👍',
    emojis: [
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏',
      '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆',
      '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛',
      '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️',
      '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂',
      '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅',
    ],
  },
  {
    id: 'animals',
    label: 'Động vật',
    icon: '🐱',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
      '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈',
      '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇',
      '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌',
      '🐞', '🐜', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎',
      '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡',
    ],
  },
  {
    id: 'food',
    label: 'Đồ ăn',
    icon: '🍎',
    emojis: [
      '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓',
      '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝',
      '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑',
      '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐',
      '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈',
      '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🌭', '🍔',
    ],
  },
  {
    id: 'activities',
    label: 'Hoạt động',
    icon: '⚽',
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉',
      '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍',
      '🏏', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊',
      '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️',
      '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️', '🤺', '🤾',
      '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗',
    ],
  },
  {
    id: 'objects',
    label: 'Đồ vật',
    icon: '💎',
    emojis: [
      '⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️',
      '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼',
      '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️',
      '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭',
      '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋',
      '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸',
    ],
  },
  {
    id: 'nature',
    label: 'Thiên nhiên',
    icon: '🌸',
    emojis: [
      '🌸', '🌼', '🌻', '🌷', '🌹', '🌺', '🌱', '🌿',
      '☘️', '🍀', '🍃', '🍂', '🍁', '🌾', '🌵', '🌴',
      '🌲', '🌳', '🌰', '🌊', '💧', '💦', '☔', '☂️',
      '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄', '🌬️',
      '🌪️', '🌫️', '🌈', '☀️', '🌤️', '⛅', '🌥️', '☁️',
      '🌙', '🌚', '🌝', '🌛', '🌜', '🌞', '⭐', '🌟',
    ],
  },
  {
    id: 'symbols',
    label: 'Ký hiệu',
    icon: '❤️',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
      '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
      '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️',
      '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈',
      '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐',
      '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️',
    ],
  },
];

export function flattenEmojis(): string[] {
  return EMOJI_GROUPS.flatMap((g) => g.emojis);
}

export function findEmojiGroup(id: EmojiCategory): EmojiGroup | undefined {
  return EMOJI_GROUPS.find((g) => g.id === id);
}

export const REACTION_QUICK_EMOJIS = ['❤️', '😂', '👍', '🎉', '😮', '😢'];

// Dev expose cho e2e tests
if (typeof globalThis !== 'undefined' && (globalThis as any).__DEV__) {
  (globalThis as any).__EMOJI_GROUPS_COUNT__ = EMOJI_GROUPS.length;
  (globalThis as any).__EMOJI_GROUPS__ = EMOJI_GROUPS;
  (globalThis as any).__REACTION_QUICK_EMOJIS__ = REACTION_QUICK_EMOJIS;
  if (typeof window !== 'undefined') {
    (window as any).__EMOJI_GROUPS_COUNT__ = EMOJI_GROUPS.length;
    (window as any).__EMOJI_GROUPS__ = EMOJI_GROUPS;
    (window as any).__REACTION_QUICK_EMOJIS__ = REACTION_QUICK_EMOJIS;
  }
}
