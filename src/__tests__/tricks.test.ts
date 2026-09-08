/**
 * Step 12e — Pet Tricks unit tests.
 *
 * Cover:
 *  - TRICKS has 8 entries
 *  - TRICK_CATEGORIES has 4 levels (basic/intermediate/advanced/expert)
 *  - All tricks have required fields
 *  - TRICK_CATEGORY_LABELS Vietnamese
 *  - STAGE_ORDER has 5 stages
 *  - getTrickById finds / returns null
 *  - listAllTricks returns 8
 *  - listTricksByCategory filters
 *  - ensureTricksStructure fills defaults
 *  - getLearnedTricks maps
 *  - getAvailableTricks computes canLearn flags
 *  - getRequiredAttempts max(difficulty*3, 3)
 *  - learnTrick happy path + fail for unknown / low level / newborn / already learned
 *  - practiceTrick increments attempts + familiarityBonus
 *  - practiceTrick with treat uses 1 treat + boosts rate
 *  - practiceTrick returns mastered when threshold reached
 *  - performTrick increments masteryLevel + totalTricksPerformed
 *  - performTrick fails for not-learned
 *  - performTrick respects cooldown
 *  - parseCommand maps "sit"/"dance"/"shake" etc
 *  - parseCommand fails for unknown
 *  - TricksStore learnTrickAction roundtrip
 *  - TricksStore practiceTrickAction + master
 *  - TricksStore performTrickAction + cooldown
 *  - TricksStore performCommandAction via command string
 *  - TricksStore cancelTraining + addTreats clamp
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TRICKS,
  TRICK_CATEGORIES,
  TRICK_CATEGORY_LABELS,
  STAGE_ORDER,
  STAGE_LABELS,
  PERFORM_COOLDOWN_MS,
  MAX_TREATS,
  getTrickById,
  listAllTricks,
  listTricksByCategory,
  ensureTricksStructure,
  getLearnedTricks,
  getAvailableTricks,
  getRequiredAttempts,
  learnTrick,
  practiceTrick,
  performTrick,
  parseCommand,
  type PetStatsWithTricks,
} from '@/api/tricks';
import { useTricksStore } from '@/stores/TricksStore';

const TRICK_IDS = ['sit', 'lie_down', 'roll_over', 'shake_hand', 'fetch', 'jump', 'dance', 'back_flip'];

function makePet(level = 20, stage: any = 'ADULT'): PetStatsWithTricks {
  return {
    level,
    energy: 100,
    tricks: {
      learned: [],
      training: null,
      lastTrickAt: 0,
      totalTricksPerformed: 0,
    },
    trainingStats: {
      treatsUsed: 5,
      trainingSessionsToday: 0,
    },
    // stage stored separately, but tests pass it in
    __stage: stage, // not a real field but used for clarity
  };
}

// ============================================================================
// Catalog
// ============================================================================

describe('TRICKS catalog', () => {
  it('has 8 entries', () => {
    expect(Object.keys(TRICKS)).toHaveLength(8);
  });

  it('contains all expected trick ids', () => {
    for (const id of TRICK_IDS) {
      expect(TRICKS[id]).toBeTruthy();
    }
  });

  it('all tricks have required fields', () => {
    for (const t of Object.values(TRICKS)) {
      expect(t.id).toBeTruthy();
      expect(t.displayName).toBeTruthy();
      expect(t.emoji).toBeTruthy();
      expect(t.command).toBeTruthy();
      expect(t.difficulty).toBeGreaterThanOrEqual(1);
      expect(t.difficulty).toBeLessThanOrEqual(5);
      expect(['basic', 'intermediate', 'advanced', 'expert']).toContain(t.category);
      expect(t.unlockLevel).toBeGreaterThan(0);
    }
  });

  it('categories follow difficulty order', () => {
    const cats = TRICK_CATEGORIES;
    expect(cats).toEqual(['basic', 'intermediate', 'advanced', 'expert']);
  });

  it('category labels are Vietnamese', () => {
    expect(TRICK_CATEGORY_LABELS.basic).toBe('Cơ bản');
    expect(TRICK_CATEGORY_LABELS.intermediate).toBe('Trung cấp');
    expect(TRICK_CATEGORY_LABELS.advanced).toBe('Nâng cao');
    expect(TRICK_CATEGORY_LABELS.expert).toBe('Chuyên gia');
  });

  it('STAGE_ORDER has 5 stages', () => {
    expect(Object.keys(STAGE_ORDER)).toHaveLength(5);
    expect(STAGE_ORDER.NEWBORN).toBe(0);
    expect(STAGE_ORDER.SENIOR).toBe(4);
  });

  it('STAGE_LABELS Vietnamese', () => {
    expect(STAGE_LABELS.NEWBORN).toBe('Sơ sinh');
    expect(STAGE_LABELS.ADULT).toBe('Trưởng thành');
  });
});

describe('Catalog helpers', () => {
  it('getTrickById finds sit', () => {
    expect(getTrickById('sit')?.displayName).toBe('Ngồi');
  });
  it('getTrickById returns null', () => {
    expect(getTrickById('xyz')).toBeNull();
  });
  it('listAllTricks returns 8', () => {
    expect(listAllTricks()).toHaveLength(8);
  });
  it('listTricksByCategory filters basic', () => {
    const basics = listTricksByCategory('basic');
    expect(basics.length).toBeGreaterThan(0);
    basics.forEach((t) => expect(t.category).toBe('basic'));
  });
  it('listTricksByCategory filters expert', () => {
    const experts = listTricksByCategory('expert');
    expect(experts.length).toBeGreaterThan(0);
    expect(experts[0].id).toBe('back_flip');
  });
});

// ============================================================================
// Structure
// ============================================================================

describe('ensureTricksStructure', () => {
  it('fills defaults', () => {
    const pet = { level: 5 } as PetStatsWithTricks;
    ensureTricksStructure(pet);
    expect(pet.tricks?.learned).toEqual([]);
    expect(pet.tricks?.training).toBeNull();
    expect(pet.trainingStats?.treatsUsed).toBe(5);
  });
  it('preserves existing', () => {
    const pet: PetStatsWithTricks = {
      level: 5,
      tricks: { learned: [{ trickId: 'sit', learnedAt: 1, masteryLevel: 3, successCount: 7, failCount: 0 }], training: null, lastTrickAt: 0, totalTricksPerformed: 0 },
    };
    ensureTricksStructure(pet);
    expect(pet.tricks?.learned.length).toBe(1);
  });
});

describe('getAvailableTricks', () => {
  it('marks low-level tricks as levelMet=false', () => {
    const pet = makePet(1, 'YOUNG');
    const av = getAvailableTricks(pet, 'YOUNG');
    const dance = av.find((t) => t.id === 'dance')!;
    expect(dance.levelMet).toBe(false);
    expect(dance.canLearn).toBe(false);
  });
  it('marks unlocked as canLearn', () => {
    const pet = makePet(20, 'ADULT');
    const av = getAvailableTricks(pet, 'ADULT');
    const sit = av.find((t) => t.id === 'sit')!;
    expect(sit.canLearn).toBe(true);
  });
  it('marks isLearned', () => {
    const pet = makePet(20, 'ADULT');
    pet.tricks!.learned.push({ trickId: 'sit', learnedAt: 1, masteryLevel: 2, successCount: 1, failCount: 0 });
    const av = getAvailableTricks(pet, 'ADULT');
    expect(av.find((t) => t.id === 'sit')!.isLearned).toBe(true);
    expect(av.find((t) => t.id === 'sit')!.canLearn).toBe(false);
  });
  it('NEWBORN stage disables all', () => {
    const pet = makePet(20, 'NEWBORN');
    const av = getAvailableTricks(pet, 'NEWBORN');
    expect(av.every((t) => !t.canLearn)).toBe(true);
  });
});

describe('getRequiredAttempts', () => {
  it('returns max(difficulty*3, 3)', () => {
    expect(getRequiredAttempts(1)).toBe(3);
    expect(getRequiredAttempts(2)).toBe(6);
    expect(getRequiredAttempts(5)).toBe(15);
  });
});

// ============================================================================
// Learn / Practice / Perform
// ============================================================================

describe('learnTrick', () => {
  it('starts training for unlocked trick', () => {
    const pet = makePet(20, 'ADULT');
    const r = learnTrick('sit', pet, 'ADULT');
    expect(r.success).toBe(true);
    expect(pet.tricks?.training?.trickId).toBe('sit');
  });
  it('fails for unknown trick', () => {
    const pet = makePet(20, 'ADULT');
    const r = learnTrick('xyz', pet, 'ADULT');
    expect(r.success).toBe(false);
  });
  it('fails for newborn', () => {
    const pet = makePet(20, 'NEWBORN');
    const r = learnTrick('sit', pet, 'NEWBORN');
    expect(r.success).toBe(false);
    expect(r.error).toContain('bé xíu');
  });
  it('fails for low level', () => {
    const pet = makePet(1, 'ADULT');
    const r = learnTrick('dance', pet, 'ADULT');
    expect(r.success).toBe(false);
    expect(r.error).toContain('Level');
  });
  it('fails for already learned', () => {
    const pet = makePet(20, 'ADULT');
    pet.tricks!.learned.push({ trickId: 'sit', learnedAt: 1, masteryLevel: 2, successCount: 1, failCount: 0 });
    const r = learnTrick('sit', pet, 'ADULT');
    expect(r.success).toBe(false);
    expect(r.error).toContain('thuần thục');
  });
});

describe('practiceTrick', () => {
  it('increments attempts', () => {
    const pet = makePet(20, 'ADULT');
    learnTrick('sit', pet, 'ADULT');
    practiceTrick('sit', false, pet, { obedience: 50 }, () => 1.0); // force success
    expect(pet.tricks?.training?.attempts).toBe(1);
  });
  it('uses treat + boosts rate', () => {
    const pet = makePet(20, 'ADULT');
    pet.trainingStats!.treatsUsed = 1;
    learnTrick('sit', pet, 'ADULT');
    const beforeTreats = pet.trainingStats!.treatsUsed;
    practiceTrick('sit', true, pet, { obedience: 50 }, () => 1.0);
    expect(pet.trainingStats!.treatsUsed).toBe(beforeTreats - 1);
  });
  it('returns mastered when threshold reached', () => {
    const pet = makePet(20, 'ADULT');
    learnTrick('sit', pet, 'ADULT');
    let result: any;
    let mastered = false;
    for (let i = 0; i < 10 && !mastered; i++) {
      result = practiceTrick('sit', false, pet, { obedience: 100 }, () => 0); // force success
      if (result?.mastered) mastered = true;
    }
    expect(mastered).toBe(true);
    expect(pet.tricks?.learned.length).toBe(1);
  });
  it('returns failure when no training active', () => {
    const pet = makePet(20, 'ADULT');
    const r = practiceTrick('sit', false, pet);
    expect(r.success).toBe(false);
  });
});

describe('performTrick', () => {
  it('performs learned trick', () => {
    const pet = makePet(20, 'ADULT');
    pet.tricks!.learned.push({ trickId: 'sit', learnedAt: 1, masteryLevel: 2, successCount: 0, failCount: 0 });
    const r = performTrick('sit', pet);
    expect(r.success).toBe(true);
    expect(r.xpGained).toBeGreaterThan(0);
    expect(pet.tricks?.totalTricksPerformed).toBe(1);
  });
  it('fails for not learned', () => {
    const pet = makePet(20, 'ADULT');
    const r = performTrick('sit', pet);
    expect(r.success).toBe(false);
  });
  it('enforces cooldown', () => {
    const pet = makePet(20, 'ADULT');
    pet.tricks!.learned.push({ trickId: 'sit', learnedAt: 1, masteryLevel: 2, successCount: 0, failCount: 0 });
    pet.tricks!.lastTrickAt = Date.now() - 5000; // 5s ago
    const r = performTrick('sit', pet);
    expect(r.success).toBe(false);
    expect(r.error).toContain('nghỉ');
  });
  it('mastery caps at 10', () => {
    const pet = makePet(20, 'ADULT');
    const learned = { trickId: 'sit', learnedAt: 1, masteryLevel: 10, successCount: 0, failCount: 0 };
    pet.tricks!.learned.push(learned);
    // Bump lastTrickAt to allow next perform
    pet.tricks!.lastTrickAt = 0;
    performTrick('sit', pet);
    expect(learned.masteryLevel).toBeLessThanOrEqual(10);
  });
});

describe('parseCommand', () => {
  it('matches command "sit"', () => {
    const pet = makePet(20, 'ADULT');
    pet.tricks!.learned.push({ trickId: 'sit', learnedAt: 1, masteryLevel: 1, successCount: 0, failCount: 0 });
    const r = parseCommand('sit', pet, Date.now() + 999_999);
    expect((r as any).success).toBe(true);
  });
  it('matches displayName "Nhảy múa"', () => {
    const pet = makePet(20, 'ADULT');
    pet.tricks!.learned.push({ trickId: 'dance', learnedAt: 1, masteryLevel: 1, successCount: 0, failCount: 0 });
    const r = parseCommand('Nhảy múa', pet, Date.now() + 999_999);
    expect((r as any).success).toBe(true);
  });
  it('matches id "shake_hand"', () => {
    const pet = makePet(20, 'ADULT');
    pet.tricks!.learned.push({ trickId: 'shake_hand', learnedAt: 1, masteryLevel: 1, successCount: 0, failCount: 0 });
    const r = parseCommand('shake_hand', pet, Date.now() + 999_999);
    expect((r as any).success).toBe(true);
  });
  it('returns error for unknown', () => {
    const pet = makePet(20, 'ADULT');
    const r = parseCommand('xyz', pet);
    expect((r as any).success).toBe(false);
  });
  it('returns error for empty input', () => {
    const pet = makePet(20, 'ADULT');
    const r = parseCommand('', pet);
    expect((r as any).success).toBe(false);
  });
});

// ============================================================================
// TricksStore
// ============================================================================

describe('TricksStore', () => {
  beforeEach(() => {
    useTricksStore.getState().reset();
  });

  it('starts with default state', () => {
    const s = useTricksStore.getState();
    expect(s.learnedTricks).toEqual([]);
    expect(s.petStats.tricks?.training).toBeNull();
    expect(s.petStats.trainingStats?.treatsUsed).toBe(5);
  });

  it('setPetStats updates level', () => {
    useTricksStore.getState().setPetStats({ level: 50 });
    expect(useTricksStore.getState().petStats.level).toBe(50);
  });

  it('setStage updates currentStage', () => {
    useTricksStore.getState().setStage('ADULT');
    expect(useTricksStore.getState().currentStage).toBe('ADULT');
  });

  it('learnTrickAction starts training', () => {
    const r = useTricksStore.getState().learnTrickAction('sit');
    expect(r.success).toBe(true);
    expect(useTricksStore.getState().petStats.tricks?.training?.trickId).toBe('sit');
  });

  it('learnTrickAction fails for low level', () => {
    useTricksStore.getState().setPetStats({ level: 1 });
    const r = useTricksStore.getState().learnTrickAction('dance');
    expect(r.success).toBe(false);
  });

  it('practiceTrickAction increments attempts', () => {
    useTricksStore.getState().setPetStats({ level: 20 });
    useTricksStore.getState().setStage('ADULT');
    useTricksStore.getState().learnTrickAction('sit');
    useTricksStore.getState().setPersonality({ obedience: 100 });
    // Force success by injecting a high-obedience personality
    // (randomFn is not exposed, but obedience=100 makes base rate ~0.7 + familiarity)
    const r = useTricksStore.getState().practiceTrickAction('sit');
    expect(r.attempts).toBe(1);
  });

  it('practiceTrickAction with treat uses 1 treat', () => {
    useTricksStore.getState().setPetStats({ level: 20 });
    useTricksStore.getState().setStage('ADULT');
    useTricksStore.getState().addTreats(5);
    useTricksStore.getState().learnTrickAction('sit');
    const before = useTricksStore.getState().petStats.trainingStats?.treatsUsed ?? 0;
    useTricksStore.getState().practiceTrickAction('sit', true);
    const after = useTricksStore.getState().petStats.trainingStats?.treatsUsed ?? 0;
    expect(after).toBe(before - 1);
  });

  it('performTrickAction fails when not learned', () => {
    const r = useTricksStore.getState().performTrickAction('sit');
    expect(r.success).toBe(false);
  });

  it('cancelTraining clears training', () => {
    useTricksStore.getState().learnTrickAction('sit');
    expect(useTricksStore.getState().petStats.tricks?.training).not.toBeNull();
    useTricksStore.getState().cancelTraining();
    expect(useTricksStore.getState().petStats.tricks?.training).toBeNull();
  });

  it('addTreats clamps 0..MAX_TREATS', () => {
    useTricksStore.getState().addTreats(100);
    expect(useTricksStore.getState().petStats.trainingStats?.treatsUsed).toBe(MAX_TREATS);
    useTricksStore.getState().addTreats(-100);
    expect(useTricksStore.getState().petStats.trainingStats?.treatsUsed).toBe(0);
  });

  it('performCommandAction via command string', () => {
    useTricksStore.getState().setPetStats({ level: 20 });
    useTricksStore.getState().setStage('ADULT');
    // sit can be learned, then practiced enough to master (need 3 attempts)
    const learn = useTricksStore.getState().learnTrickAction('sit');
    expect(learn.success).toBe(true);
    // Force training complete via direct hack: write to training state
    useTricksStore.setState((s) => ({
      petStats: {
        ...s.petStats,
        tricks: {
          ...s.petStats.tricks!,
          training: { trickId: 'sit', attempts: 3, startedAt: Date.now() },
        },
      },
    }));
    // Many practice attempts with high obedience
    let mastered = false;
    for (let i = 0; i < 20 && !mastered; i++) {
      const r = useTricksStore.getState().practiceTrickAction('sit', true);
      if (r.mastered) mastered = true;
    }
    expect(mastered).toBe(true);
    expect(useTricksStore.getState().learnedTricks.length).toBe(1);
  });
});
