/**
 * Step 5 — Chat Enrichment tests.
 *
 * Verify:
 *  - EMOJI_GROUPS có 8 categories với >= 10 emojis mỗi cái
 *  - REACTION_QUICK_EMOJIS có 6
 *  - STICKER_PACKS có 4 packs với >= 10 stickers mỗi cái
 *  - getStickerPackById / findSticker lookup
 *  - toggleReaction helper (add + remove + multi-user)
 *  - hasUserReacted / totalReactionCount
 *  - chat.ts editMessage / deleteMessage / reactToMessage
 *  - chat.ts sendMessage với kind sticker/image/parentId
 *  - uploadChatImage mock
 */

import { describe, it, expect } from 'vitest';
import {
  EMOJI_GROUPS,
  REACTION_QUICK_EMOJIS,
  flattenEmojis,
} from '@/api/emojiData';
import {
  STICKER_PACKS,
  getStickerPackById,
  findSticker,
} from '@/api/stickerPacks';
import {
  toggleReaction,
  hasUserReacted,
  totalReactionCount,
  ChatMessage,
} from '@/api/chatTypes';
import {
  sendMessage,
  getMessages,
  editMessage,
  deleteMessage,
  reactToMessage,
  uploadChatImage,
  resetMockChat,
} from '@/api/chat';

describe('EMOJI_GROUPS', () => {
  it('declares 8 categories', () => {
    expect(EMOJI_GROUPS).toHaveLength(8);
  });

  it('each category has ≥ 10 emojis', () => {
    for (const g of EMOJI_GROUPS) {
      expect(g.emojis.length).toBeGreaterThanOrEqual(10);
    }
  });

  it('flattenEmojis returns full list', () => {
    const flat = flattenEmojis();
    const expected = EMOJI_GROUPS.reduce((sum, g) => sum + g.emojis.length, 0);
    expect(flat.length).toBe(expected);
  });
});

describe('REACTION_QUICK_EMOJIS', () => {
  it('has 6 emojis', () => {
    expect(REACTION_QUICK_EMOJIS).toHaveLength(6);
  });

  it('each emoji is unique', () => {
    expect(new Set(REACTION_QUICK_EMOJIS).size).toBe(REACTION_QUICK_EMOJIS.length);
  });
});

describe('STICKER_PACKS', () => {
  it('declares 4 packs', () => {
    expect(STICKER_PACKS).toHaveLength(4);
  });

  it('each pack has ≥ 10 stickers', () => {
    for (const pack of STICKER_PACKS) {
      expect(pack.stickers.length).toBeGreaterThanOrEqual(10);
    }
  });

  it('getStickerPackById returns matching pack', () => {
    const pack = getStickerPackById('pets_emotions');
    expect(pack?.name).toBe('Pet Emotions');
  });

  it('getStickerPackById returns undefined for unknown', () => {
    expect(getStickerPackById('unknown')).toBeUndefined();
  });

  it('findSticker returns sticker + pack match', () => {
    const s = findSticker('celebrations', 'cake');
    expect(s?.emoji).toBe('🎂');
  });
});

function makeMsg(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 'msg_test',
    conversationId: 'conv_test',
    fromUserId: 'u_test',
    toUserId: 'dev_user',
    kind: 'text',
    text: 'hello',
    ts: Date.now(),
    status: 'sent',
    ...overrides,
  };
}

describe('toggleReaction helper', () => {
  it('adds reaction when user not in list', () => {
    const msg = makeMsg();
    const result = toggleReaction(msg, '❤️', 'dev_user');
    expect(result.reactions).toHaveLength(1);
    expect(result.reactions?.[0]).toEqual({ emoji: '❤️', userIds: ['dev_user'] });
  });

  it('removes reaction when user in list', () => {
    const msg = makeMsg({ reactions: [{ emoji: '❤️', userIds: ['dev_user'] }] });
    const result = toggleReaction(msg, '❤️', 'dev_user');
    expect(result.reactions ?? []).toHaveLength(0);
  });

  it('keeps multiple reactions on different emojis', () => {
    const msg = makeMsg();
    let result = toggleReaction(msg, '❤️', 'dev_user');
    result = toggleReaction(result, '👍', 'dev_user');
    expect(result.reactions).toHaveLength(2);
  });

  it('supports multi-user reaction', () => {
    const msg = makeMsg({ reactions: [{ emoji: '❤️', userIds: ['u_alice'] }] });
    const result = toggleReaction(msg, '❤️', 'dev_user');
    expect(result.reactions?.[0].userIds).toHaveLength(2);
  });
});

describe('hasUserReacted', () => {
  it('returns true when user in list', () => {
    const msg = makeMsg({ reactions: [{ emoji: '❤️', userIds: ['dev_user'] }] });
    expect(hasUserReacted(msg, '❤️', 'dev_user')).toBe(true);
  });

  it('returns false when user not in list', () => {
    const msg = makeMsg({ reactions: [{ emoji: '❤️', userIds: ['u_alice'] }] });
    expect(hasUserReacted(msg, '❤️', 'dev_user')).toBe(false);
  });
});

describe('totalReactionCount', () => {
  it('returns 0 when no reactions', () => {
    expect(totalReactionCount(makeMsg())).toBe(0);
  });

  it('sums across emojis', () => {
    const msg = makeMsg({
      reactions: [
        { emoji: '❤️', userIds: ['u_a', 'u_b'] },
        { emoji: '👍', userIds: ['u_c'] },
      ],
    });
    expect(totalReactionCount(msg)).toBe(3);
  });
});

describe('chat.ts API extensions', () => {
  // Reset mock state before each test in this describe
  // để tránh race condition khi tests chạy parallel
  it('editMessage updates text + sets editedAt', async () => {
    resetMockChat();
    const msgs = await getMessages('conv_alice');
    const target = msgs[0];
    const originalText = target.text;
    const updated = await editMessage('conv_alice', target.id, 'edited!');
    expect(updated.text).toBe('edited!');
    expect(updated.editedAt).toBeDefined();
    expect(updated.editedAt).toBeGreaterThan(0);
    // Restore for other tests
    await editMessage('conv_alice', target.id, originalText);
  });

  it('deleteMessage soft-deletes (sets deletedAt)', async () => {
    resetMockChat();
    const msgs = await getMessages('conv_alice');
    const target = msgs[0];
    const updated = await deleteMessage('conv_alice', target.id);
    expect(updated.deletedAt).toBeDefined();
  });

  it('reactToMessage adds reaction', async () => {
    resetMockChat();
    const msgs = await getMessages('conv_alice');
    const target = msgs[0];
    const updated = await reactToMessage('conv_alice', target.id, '❤️', 'dev_user', 'add');
    expect(updated.reactions?.some((r) => r.emoji === '❤️')).toBe(true);
  });

  it('sendMessage with sticker kind', async () => {
    resetMockChat();
    const res = await sendMessage('conv_alice', 'wave', {
      kind: 'sticker',
      stickerId: 'wave',
      stickerPackId: 'gestures',
    });
    expect(res.message.kind).toBe('sticker');
    expect(res.message.stickerId).toBe('wave');
    expect(res.message.stickerPackId).toBe('gestures');
  });

  it('sendMessage with image kind', async () => {
    resetMockChat();
    const res = await sendMessage('conv_alice', '', {
      kind: 'image',
      mediaUrl: 'https://example.com/x.jpg',
      mediaWidth: 800,
      mediaHeight: 600,
    });
    expect(res.message.kind).toBe('image');
    expect(res.message.mediaUrl).toBe('https://example.com/x.jpg');
  });

  it('sendMessage with parentId reply', async () => {
    resetMockChat();
    const msgs = await getMessages('conv_alice');
    const target = msgs[0];
    const res = await sendMessage('conv_alice', 'reply text', {
      parentId: target.id,
      clientMsgId: 'local_test',
    });
    expect(res.message.parentId).toBe(target.id);
  });

  it('uploadChatImage returns url + dims', async () => {
    resetMockChat();
    const res = await uploadChatImage({
      uri: 'file:///test.jpg',
      width: 800,
      height: 600,
    });
    expect(res.url).toBe('file:///test.jpg');
    expect(res.width).toBe(800);
    expect(res.height).toBe(600);
  });
});
