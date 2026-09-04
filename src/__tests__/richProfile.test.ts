/**
 * Step 7 — Rich Profile tests.
 *
 * Cover:
 *  - AVATAR_FRAMES catalog (8 frames + rarities)
 *  - getAvatarFrame(id) lookup
 *  - rarityLabel/rarityColor
 *  - defaultUnlockedFrameIds
 *  - profileTypes.makeFriendCode (length, charset)
 *  - SOCIAL_PLATFORMS (5 platforms, baseUrl builders)
 *  - AvatarFrame default props
 */

import { describe, it, expect } from 'vitest';
import {
  AVATAR_FRAMES,
  getAvatarFrame,
  rarityLabel,
  rarityColor,
  defaultUnlockedFrameIds,
} from '@/api/avatarFrames';
import {
  SOCIAL_PLATFORMS,
  makeFriendCode,
  makeDefaultProfile,
} from '@/api/profileTypes';

describe('AVATAR_FRAMES', () => {
  it('contains 8 frames', () => {
    expect(AVATAR_FRAMES).toHaveLength(8);
  });

  it('includes none/silver/gold/diamond/legendary/sakura/anime/christmas', () => {
    const ids = AVATAR_FRAMES.map((f) => f.id);
    for (const id of [
      'none',
      'silver',
      'gold',
      'diamond',
      'legendary',
      'sakura',
      'anime',
      'christmas',
    ]) {
      expect(ids).toContain(id);
    }
  });

  it('none has zero border width', () => {
    const none = AVATAR_FRAMES.find((f) => f.id === 'none');
    expect(none?.borderWidth).toBe(0);
  });

  it('legendary is rarity=legendary with glowColor', () => {
    const l = AVATAR_FRAMES.find((f) => f.id === 'legendary');
    expect(l?.rarity).toBe('legendary');
    expect(l?.glowColor).toBeTruthy();
  });

  it('all frames have unique ids', () => {
    const ids = AVATAR_FRAMES.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('getAvatarFrame', () => {
  it('returns none for undefined id', () => {
    expect(getAvatarFrame(undefined)?.id).toBe('none');
  });

  it('returns frame for known id', () => {
    expect(getAvatarFrame('gold')?.id).toBe('gold');
  });

  it('returns undefined for unknown id', () => {
    expect(getAvatarFrame('nope')).toBeUndefined();
  });
});

describe('rarityLabel', () => {
  it('returns capitalized label', () => {
    expect(rarityLabel('common')).toBe('Common');
    expect(rarityLabel('rare')).toBe('Rare');
    expect(rarityLabel('epic')).toBe('Epic');
    expect(rarityLabel('legendary')).toBe('Legendary');
  });
});

describe('rarityColor', () => {
  it('returns a hex string for each rarity', () => {
    for (const r of ['common', 'rare', 'epic', 'legendary'] as const) {
      expect(rarityColor(r)).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });
});

describe('defaultUnlockedFrameIds', () => {
  it('includes none, silver, christmas', () => {
    const set = defaultUnlockedFrameIds();
    expect(set.has('none')).toBe(true);
    expect(set.has('silver')).toBe(true);
    expect(set.has('christmas')).toBe(true);
  });

  it('does not include gold or diamond', () => {
    const set = defaultUnlockedFrameIds();
    expect(set.has('gold')).toBe(false);
    expect(set.has('diamond')).toBe(false);
  });
});

describe('makeFriendCode', () => {
  it('returns 6 chars', () => {
    expect(makeFriendCode()).toHaveLength(6);
  });

  it('only uses safe charset', () => {
    const code = makeFriendCode();
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/); // omit I, O, 0, 1
  });

  it('produces different codes across calls (eventually)', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 50; i++) seen.add(makeFriendCode());
    expect(seen.size).toBeGreaterThan(20);
  });
});

describe('SOCIAL_PLATFORMS', () => {
  it('has 5 platforms', () => {
    expect(SOCIAL_PLATFORMS).toHaveLength(5);
  });

  it('covers expected ids', () => {
    const ids = SOCIAL_PLATFORMS.map((p) => p.id);
    expect(ids).toContain('discord');
    expect(ids).toContain('twitter');
    expect(ids).toContain('instagram');
    expect(ids).toContain('tiktok');
    expect(ids).toContain('twitch');
  });

  it('Twitter baseUrl strips @ prefix', () => {
    const t = SOCIAL_PLATFORMS.find((p) => p.id === 'twitter')!;
    expect(t.baseUrl('@alice')).toBe('https://x.com/alice');
    expect(t.baseUrl('alice')).toBe('https://x.com/alice');
  });

  it('Discord baseUrl preserves username', () => {
    const d = SOCIAL_PLATFORMS.find((p) => p.id === 'discord')!;
    expect(d.baseUrl('alice#1234')).toBe('https://discord.com/users/alice#1234');
  });

  it('Instagram baseUrl strips @', () => {
    const i = SOCIAL_PLATFORMS.find((p) => p.id === 'instagram')!;
    expect(i.baseUrl('@alice')).toBe('https://instagram.com/alice');
  });
});

describe('makeDefaultProfile', () => {
  it('builds profile with random friend code', () => {
    const p = makeDefaultProfile(
      'u1',
      'Alice',
      'https://example.com/a.png',
      Date.now() - 7 * 24 * 60 * 60 * 1000,
      { petLevel: 5, friends: 3, achievements: 4, dayStreak: 7 }
    );
    expect(p.userId).toBe('u1');
    expect(p.displayName).toBe('Alice');
    expect(p.avatarUrl).toBe('https://example.com/a.png');
    expect(p.frameId).toBe('none');
    expect(p.friendCode).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
    expect(p.socials).toEqual({});
    expect(p.stats.petLevel).toBe(5);
  });
});
