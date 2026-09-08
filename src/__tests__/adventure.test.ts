/**
 * Step 12c — Adventure domain unit tests.
 *
 * Cover:
 *  - LOCATIONS has 5 entries (park/beach/forest/city/mountain)
 *  - All locations have required fields (id/displayName/emoji/duration/etc)
 *  - ENCOUNTER_EVENTS has 17 events
 *  - formatDuration: <60 → minutes, >=60 → hours
 *  - getLocationById: found / not found
 *  - getEncounterEvent: found / not found
 *  - canStartAdventure: ok / locked / level too low / no energy / already active
 *  - generateEncounter: returns null for bad location, valid record for valid
 *  - generateReward: rarity is common/uncommon/rare based on roll
 *  - generateReward: always returns an itemId
 *  - computeXpEarned: base + 5/reward + 3/encounter
 *  - rarityColor / rarityLabel
 *  - AdventureStore: startAdventure happy path
 *  - AdventureStore: startAdventure fails when active
 *  - AdventureStore: completeAdventure grants XP
 *  - AdventureStore: cancelAdventure marks failed in history
 *  - AdventureStore: generateEncounterEvent adds to encounters
 *  - AdventureStore: generateRewardEvent adds to rewards
 *  - AdventureStore: tickCountdown triggers event at 0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  LOCATIONS,
  ENCOUNTER_EVENTS,
  formatDuration,
  getLocationById,
  getEncounterEvent,
  canStartAdventure,
  generateEncounter,
  generateReward,
  computeXpEarned,
  rarityColor,
  rarityLabel,
  type AdventureSession,
} from '@/api/adventure';
import { useAdventureStore } from '@/stores/AdventureStore';

const PET_HIGH = { level: 20, energy: 100 };
const PET_LOW_ENERGY = { level: 20, energy: 5 };
const PET_LOW_LEVEL = { level: 1, energy: 100 };
const UNLOCKED_ALL = ['park', 'beach', 'forest', 'city', 'mountain'];

describe('LOCATIONS catalog', () => {
  it('has 5 locations', () => {
    expect(Object.keys(LOCATIONS)).toHaveLength(5);
  });

  it('contains park/beach/forest/city/mountain', () => {
    for (const id of ['park', 'beach', 'forest', 'city', 'mountain']) {
      expect(LOCATIONS[id]).toBeTruthy();
    }
  });

  it('all locations have required fields', () => {
    for (const loc of Object.values(LOCATIONS)) {
      expect(loc.id).toBeTruthy();
      expect(loc.displayName).toBeTruthy();
      expect(loc.emoji).toBeTruthy();
      expect(loc.duration).toBeGreaterThan(0);
      expect(loc.energyCost).toBeGreaterThan(0);
      expect(loc.rewards.common.length).toBeGreaterThan(0);
    }
  });
});

describe('ENCOUNTER_EVENTS catalog', () => {
  it('has 17 encounters', () => {
    expect(Object.keys(ENCOUNTER_EVENTS)).toHaveLength(17);
  });

  it('all events have name/icon/xp/moodBonus/msg', () => {
    for (const e of Object.values(ENCOUNTER_EVENTS)) {
      expect(e.name).toBeTruthy();
      expect(e.icon).toBeTruthy();
      expect(typeof e.xp).toBe('number');
      expect(typeof e.moodBonus).toBe('number');
      expect(e.msg).toBeTruthy();
    }
  });
});

describe('formatDuration', () => {
  it('formats minutes under 60', () => {
    expect(formatDuration(15)).toBe('15 phút');
    expect(formatDuration(45)).toBe('45 phút');
  });
  it('formats hours when >= 60', () => {
    expect(formatDuration(60)).toBe('1 giờ');
    expect(formatDuration(90)).toBe('1h 30p');
    expect(formatDuration(120)).toBe('2 giờ');
  });
});

describe('getLocationById', () => {
  it('finds park', () => {
    expect(getLocationById('park')?.displayName).toBe('Công viên');
  });
  it('returns null for unknown', () => {
    expect(getLocationById('xyz')).toBeNull();
  });
});

describe('getEncounterEvent', () => {
  it('finds butterfly', () => {
    expect(getEncounterEvent('butterfly')?.icon).toBe('🦋');
  });
  it('returns null for unknown', () => {
    expect(getEncounterEvent('xxx')).toBeNull();
  });
});

describe('canStartAdventure', () => {
  it('ok for unlocked + high level + enough energy', () => {
    const r = canStartAdventure('park', PET_HIGH, 'sunny', null, UNLOCKED_ALL);
    expect(r.ok).toBe(true);
  });
  it('fails for unknown location', () => {
    const r = canStartAdventure('xyz', PET_HIGH, 'sunny', null, UNLOCKED_ALL);
    expect(r.ok).toBe(false);
  });
  it('fails for locked location', () => {
    const r = canStartAdventure('mountain', PET_HIGH, 'sunny', null, ['park']);
    expect(r.ok).toBe(false);
    expect(r.reason).toContain('mở khóa');
  });
  it('fails for low level', () => {
    const r = canStartAdventure('mountain', PET_LOW_LEVEL, 'sunny', null, UNLOCKED_ALL);
    expect(r.ok).toBe(false);
    expect(r.reason).toContain('Level');
  });
  it('fails for low energy', () => {
    const r = canStartAdventure('mountain', PET_LOW_ENERGY, 'sunny', null, UNLOCKED_ALL);
    expect(r.ok).toBe(false);
    expect(r.reason).toContain('thể lực');
  });
  it('fails when adventure is already active', () => {
    const active: AdventureSession = {
      locationId: 'park',
      locationName: 'Park',
      locationEmoji: '🌳',
      startedAt: Date.now(),
      endsAt: Date.now() + 10000,
      durationMinutes: 15,
      energyCost: 20,
      rewards: [],
      encounters: [],
      status: 'active',
    };
    const r = canStartAdventure('park', PET_HIGH, 'sunny', active, UNLOCKED_ALL);
    expect(r.ok).toBe(false);
  });
});

describe('generateEncounter', () => {
  it('returns null for unknown location', () => {
    expect(generateEncounter('unknown')).toBeNull();
  });
  it('returns valid encounter for park', () => {
    const enc = generateEncounter('park');
    expect(enc).toBeTruthy();
    expect(enc?.key).toBeTruthy();
    expect(enc?.at).toBeGreaterThan(0);
  });
  it('only returns encounters from the location\'s pool', () => {
    const park = LOCATIONS.park;
    for (let i = 0; i < 50; i++) {
      const enc = generateEncounter('park');
      if (!enc) continue;
      expect(park.encounters).toContain(enc.key);
    }
  });
});

describe('generateReward', () => {
  it('always returns a reward with itemId + rarity', () => {
    for (let i = 0; i < 30; i++) {
      const r = generateReward('park');
      expect(r.itemId).toBeTruthy();
      expect(['common', 'uncommon', 'rare']).toContain(r.rarity);
    }
  });
  it('produces rare ~10% of the time', () => {
    let rare = 0;
    for (let i = 0; i < 1000; i++) {
      const r = generateReward('forest');
      if (r.rarity === 'rare') rare++;
    }
    // Should be around 10% — give generous bounds
    expect(rare).toBeGreaterThan(40);
    expect(rare).toBeLessThan(180);
  });
});

describe('computeXpEarned', () => {
  it('returns base 15 with no extras', () => {
    expect(computeXpEarned(15, 0, 0)).toBe(15);
  });
  it('adds 5 per reward', () => {
    expect(computeXpEarned(15, 2, 0)).toBe(25);
  });
  it('adds 3 per encounter', () => {
    expect(computeXpEarned(15, 0, 4)).toBe(27);
  });
  it('combines both', () => {
    expect(computeXpEarned(15, 2, 3)).toBe(15 + 10 + 9);
  });
});

describe('rarityColor / rarityLabel', () => {
  it('returns distinct colors', () => {
    const colors = ['common', 'uncommon', 'rare'].map(rarityColor);
    expect(new Set(colors).size).toBe(3);
  });
  it('returns Vietnamese labels', () => {
    expect(rarityLabel('common')).toBe('Phổ biến');
    expect(rarityLabel('uncommon')).toBe('Không phổ biến');
    expect(rarityLabel('rare')).toBe('Hiếm');
  });
});

describe('AdventureStore', () => {
  beforeEach(() => {
    useAdventureStore.getState().reset();
  });

  it('starts with no adventure', () => {
    expect(useAdventureStore.getState().currentAdventure).toBeNull();
    expect(useAdventureStore.getState().history).toHaveLength(0);
  });

  it('startAdventure succeeds for park', () => {
    const r = useAdventureStore.getState().startAdventure('park', PET_HIGH);
    expect(r.success).toBe(true);
    const adv = useAdventureStore.getState().currentAdventure;
    expect(adv?.locationId).toBe('park');
    expect(adv?.status).toBe('active');
    expect(adv?.endsAt).toBeGreaterThan(adv.startedAt);
  });

  it('startAdventure fails when already active', () => {
    useAdventureStore.getState().startAdventure('park', PET_HIGH);
    const r = useAdventureStore.getState().startAdventure('beach', PET_HIGH);
    expect(r.success).toBe(false);
    expect(r.error).toContain('khác');
  });

  it('startAdventure fails for locked location', () => {
    const r = useAdventureStore.getState().startAdventure('mountain', PET_HIGH);
    expect(r.success).toBe(false);
    // mountain is not in default unlocked locations
  });

  it('completeAdventure grants XP', () => {
    useAdventureStore.getState().startAdventure('park', PET_HIGH);
    useAdventureStore.getState().generateEncounterEvent();
    useAdventureStore.getState().generateRewardEvent();
    const r = useAdventureStore.getState().completeAdventure(PET_HIGH);
    expect(r.success).toBe(true);
    expect(r.xpEarned).toBeGreaterThanOrEqual(15);
    expect(useAdventureStore.getState().history).toHaveLength(1);
    expect(useAdventureStore.getState().totalAdventures).toBe(1);
  });

  it('completeAdventure fails when no active adventure', () => {
    const r = useAdventureStore.getState().completeAdventure(PET_HIGH);
    expect(r.success).toBe(false);
  });

  it('cancelAdventure records failure in history', () => {
    useAdventureStore.getState().startAdventure('park', PET_HIGH);
    useAdventureStore.getState().cancelAdventure();
    expect(useAdventureStore.getState().currentAdventure).toBeNull();
    const history = useAdventureStore.getState().history;
    expect(history).toHaveLength(1);
    expect(history[0].success).toBe(false);
    expect(history[0].xpEarned).toBe(0);
  });

  it('generateEncounterEvent adds to encounters', () => {
    useAdventureStore.getState().startAdventure('park', PET_HIGH);
    useAdventureStore.getState().generateEncounterEvent();
    const encs = useAdventureStore.getState().currentAdventure?.encounters ?? [];
    expect(encs.length).toBeGreaterThan(0);
  });

  it('generateRewardEvent adds to rewards', () => {
    useAdventureStore.getState().startAdventure('park', PET_HIGH);
    useAdventureStore.getState().generateRewardEvent();
    const rewards = useAdventureStore.getState().currentAdventure?.rewards ?? [];
    expect(rewards.length).toBeGreaterThan(0);
  });

  it('tickCountdown decrements by deltaSec', () => {
    useAdventureStore.getState().startAdventure('park', PET_HIGH);
    const before = useAdventureStore.getState().eventCountdownSec;
    useAdventureStore.getState().tickCountdown(5);
    expect(useAdventureStore.getState().eventCountdownSec).toBe(before - 5);
  });

  it('tickCountdown triggers event at zero', () => {
    useAdventureStore.getState().startAdventure('park', PET_HIGH);
    // Force countdown to 1
    useAdventureStore.setState({ eventCountdownSec: 1 });
    useAdventureStore.getState().tickCountdown(1);
    // Should reset to 25 and add at least one event
    expect(useAdventureStore.getState().eventCountdownSec).toBe(25);
    const adv = useAdventureStore.getState().currentAdventure;
    expect((adv?.encounters.length ?? 0) + (adv?.rewards.length ?? 0)).toBeGreaterThan(0);
  });

  it('checkCompletion returns true when endsAt passed', () => {
    useAdventureStore.getState().startAdventure('park', PET_HIGH);
    const adv = useAdventureStore.getState().currentAdventure;
    if (adv) {
      // Force endsAt to past
      useAdventureStore.setState({
        currentAdventure: { ...adv, endsAt: Date.now() - 1000 },
      });
    }
    expect(useAdventureStore.getState().checkCompletion()).toBe(true);
  });

  it('checkCompletion returns false when active', () => {
    useAdventureStore.getState().startAdventure('park', PET_HIGH);
    expect(useAdventureStore.getState().checkCompletion()).toBe(false);
  });
});
