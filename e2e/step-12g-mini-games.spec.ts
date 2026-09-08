/**
 * Step 12g — Mini-games e2e tests.
 *
 * Cover:
 *  - MG_GAME_IDS has 2 entries
 *  - MG_CATCH_FALL meta has correct fields
 *  - MG_TIMING meta has correct fields
 *  - XP_FROM_SCORE returns correct values
 *  - Catch Fall helpers (CF_CREATE / CF_START / CF_SPAWN / CF_TICK / CF_SET_PADDLE / CF_FINISH)
 *  - Timing helpers (T_CREATE / T_START / T_NEXT / T_INDICATOR / T_PRESS / T_FINISH)
 *  - Persistence (BUILD_SCORE / RECORD_RESULT / ENSURE)
 *  - Store (RESET / HYDRATE / GET_STATE / GET_HIGH_STORE / GET_RECENT_STORE / GET_TOTAL_PLAYED / GET_TOTAL_WINS / GET_META / GET_ALL_GAMES)
 *  - Full game simulation (catch_fall → score → finish → record)
 *  - Full game simulation (timing → 10 rounds → finish → record)
 */

import { test, expect, type Page } from '@playwright/test';

async function waitForAppMount(page: Page) {
  await page.waitForSelector('body', { timeout: 60_000 });
  await page.waitForTimeout(2500);
}

test.describe('Step 12g — Mini-games', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    await page.evaluate(() => (window as any).__MG_RESET__?.());
  });

  // ── Catalog ──

  test('MG_GAME_IDS has 2 entries', async ({ page }) => {
    const ids = await page.evaluate(() => (window as any).__MG_GAME_IDS__);
    expect(ids.length).toBe(2);
    expect(ids).toContain('catch_fall');
    expect(ids).toContain('timing');
  });

  test('MG_CATCH_FALL meta correct', async ({ page }) => {
    const meta = await page.evaluate(() => (window as any).__MG_CATCH_FALL__);
    expect(meta.id).toBe('catch_fall');
    expect(meta.name).toBeTruthy();
    expect(meta.icon).toBe('🎯');
    expect(meta.duration).toBe(45);
    expect(meta.minLevel).toBe(1);
  });

  test('MG_TIMING meta correct', async ({ page }) => {
    const meta = await page.evaluate(() => (window as any).__MG_TIMING__);
    expect(meta.id).toBe('timing');
    expect(meta.icon).toBe('⚡');
    expect(meta.duration).toBeNull();
  });

  // ── XP ──

  test('XP_FROM_SCORE returns max 5 for low', async ({ page }) => {
    const xp = await page.evaluate(() => (window as any).__MG_XP_FROM_SCORE__(0));
    expect(xp).toBe(5);
  });

  test('XP_FROM_SCORE returns floor(score/2) for higher', async ({ page }) => {
    const xp = await page.evaluate(() => (window as any).__MG_XP_FROM_SCORE__(50));
    expect(xp).toBe(25);
  });

  // ── Catch Fall helpers ──

  test('CF_CREATE returns defaults', async ({ page }) => {
    const s = await page.evaluate(() => (window as any).__MG_CF_CREATE__());
    expect(s.score).toBe(0);
    expect(s.lives).toBe(3);
    expect(s.timeLeft).toBe(45);
    expect(s.running).toBe(false);
  });

  test('CF_CREATE respects overrides', async ({ page }) => {
    const s = await page.evaluate(() => (window as any).__MG_CF_CREATE__({ paddleX: 50, lives: 5, timeLeft: 100 }));
    expect(s.paddleX).toBe(50);
    expect(s.lives).toBe(5);
    expect(s.timeLeft).toBe(100);
  });

  test('CF_START marks running=true', async ({ page }) => {
    const s = await page.evaluate(() => {
      const create = (window as any).__MG_CF_CREATE__;
      const start = (window as any).__MG_CF_START__;
      return start(create());
    });
    expect(s.running).toBe(true);
    expect(s.score).toBe(0);
  });

  test('CF_SPAWN produces valid object', async ({ page }) => {
    const obj = await page.evaluate(() => (window as any).__MG_CF_SPAWN__(() => 0.5));
    expect(['fish', 'cake', 'star', 'toy', 'bomb']).toContain(obj.type);
    expect(typeof obj.icon).toBe('string');
    expect(obj.x).toBeGreaterThanOrEqual(0);
    expect(obj.y).toBe(0);
  });

  test('CF_SET_PADDLE clamps to bounds', async ({ page }) => {
    const s1 = await page.evaluate(() => (window as any).__MG_CF_SET_PADDLE__((window as any).__MG_CF_CREATE__(), -100));
    expect(s1.paddleX).toBe(0);
    const s2 = await page.evaluate(() => (window as any).__MG_CF_SET_PADDLE__((window as any).__MG_CF_CREATE__(), 99999));
    expect(s2.paddleX).toBe(230); // 300 - 70
  });

  test('CF_TICK moves objects', async ({ page }) => {
    const result = await page.evaluate(() => {
      const create = (window as any).__MG_CF_CREATE__;
      const start = (window as any).__MG_CF_START__;
      const spawn = (window as any).__MG_CF_SPAWN__;
      const tick = (window as any).__MG_CF_TICK__;
      let s = start(create());
      const obj = spawn();
      s = { ...s, objects: [{ ...obj, x: 100, y: 10 }] };
      const r = tick(s, { deltaMs: 16 });
      return r;
    });
    expect(result.state.objects.length).toBeGreaterThan(0);
    expect(result.state.objects[0].y).toBeGreaterThan(10);
  });

  test('CF_TICK does nothing if not running', async ({ page }) => {
    const r = await page.evaluate(() => {
      const create = (window as any).__MG_CF_CREATE__;
      const tick = (window as any).__MG_CF_TICK__;
      return tick(create());
    });
    expect(r.events).toEqual([]);
  });

  test('CF_FINISH marks finished', async ({ page }) => {
    const s = await page.evaluate(() => {
      const create = (window as any).__MG_CF_CREATE__;
      const finish = (window as any).__MG_CF_FINISH__;
      return finish(create({ score: 50 } as any), true);
    });
    expect(s.finished).toBe(true);
    expect(s.running).toBe(false);
    expect(s.success).toBe(true);
  });

  // ── Timing helpers ──

  test('T_CREATE returns defaults', async ({ page }) => {
    const s = await page.evaluate(() => (window as any).__MG_T_CREATE__());
    expect(s.score).toBe(0);
    expect(s.round).toBe(0);
    expect(s.maxRounds).toBe(10);
    expect(s.canPress).toBe(true);
    expect(s.running).toBe(false);
  });

  test('T_START begins round 1 with running=true', async ({ page }) => {
    const s = await page.evaluate(() => {
      const create = (window as any).__MG_T_CREATE__;
      const start = (window as any).__MG_T_START__;
      return start(create());
    });
    expect(s.running).toBe(true);
    expect(s.round).toBe(1);
    expect(s.canPress).toBe(true);
  });

  test('T_INDICATOR moves pos', async ({ page }) => {
    const s = await page.evaluate(() => {
      const create = (window as any).__MG_T_CREATE__;
      const start = (window as any).__MG_T_START__;
      const tick = (window as any).__MG_T_INDICATOR__;
      return tick(start(create()));
    });
    expect(s.indicatorPos).toBeGreaterThan(0);
  });

  test('T_PRESS perfect center', async ({ page }) => {
    const r = await page.evaluate(() => {
      const create = (window as any).__MG_T_CREATE__;
      const start = (window as any).__MG_T_START__;
      const press = (window as any).__MG_T_PRESS__;
      let s = start(create());
      // Move indicator to target center
      const center = (s.targetStart + s.targetEnd) / 2;
      s = { ...s, indicatorPos: center };
      return press(s);
    });
    expect(r.result).toBe('perfect');
    expect(r.points).toBe(20);
  });

  test('T_PRESS miss outside', async ({ page }) => {
    const r = await page.evaluate(() => {
      const create = (window as any).__MG_T_CREATE__;
      const start = (window as any).__MG_T_START__;
      const press = (window as any).__MG_T_PRESS__;
      let s = start(create());
      s = { ...s, indicatorPos: 10 }; // far left
      return press(s);
    });
    expect(r.result).toBe('miss');
    expect(r.points).toBe(-5);
  });

  test('T_NEXT advances round', async ({ page }) => {
    const s = await page.evaluate(() => {
      const create = (window as any).__MG_T_CREATE__;
      const start = (window as any).__MG_T_START__;
      const next = (window as any).__MG_T_NEXT__;
      return next(start(create()));
    });
    expect(s.round).toBe(2);
    expect(s.canPress).toBe(true);
  });

  test('T_NEXT at maxRounds finishes', async ({ page }) => {
    const s = await page.evaluate(() => {
      const create = (window as any).__MG_T_CREATE__;
      const start = (window as any).__MG_T_START__;
      const next = (window as any).__MG_T_NEXT__;
      let cur = start(create());
      for (let i = 0; i < 11; i++) {
        cur = next(cur);
      }
      return cur;
    });
    expect(s.finished).toBe(true);
  });

  test('T_FINISH marks finished', async ({ page }) => {
    const s = await page.evaluate(() => {
      const create = (window as any).__MG_T_CREATE__;
      const finish = (window as any).__MG_T_FINISH__;
      return finish(create({ score: 100 } as any), true);
    });
    expect(s.finished).toBe(true);
  });

  // ── Persistence ──

  test('BUILD_SCORE creates record', async ({ page }) => {
    const r = await page.evaluate(() => (window as any).__MG_BUILD_SCORE__('timing', 75, true, 30));
    expect(r.gameId).toBe('timing');
    expect(r.score).toBe(75);
    expect(r.durationSec).toBe(30);
    expect(typeof r.date).toBe('number');
    expect(r.date).toBeGreaterThan(0);
  });

  test('RECORD_RESULT updates high score', async ({ page }) => {
    const high = await page.evaluate(() => {
      (window as any).__MG_RECORD_RESULT__('catch_fall', 100, true, 45);
      return (window as any).__MG_GET_HIGH_STORE__('catch_fall');
    });
    expect(high).toBe(100);
  });

  test('RECORD_RESULT keeps higher previous', async ({ page }) => {
    const high = await page.evaluate(() => {
      (window as any).__MG_RECORD_RESULT__('catch_fall', 100, true, 45);
      (window as any).__MG_RECORD_RESULT__('catch_fall', 50, false, 45);
      return (window as any).__MG_GET_HIGH_STORE__('catch_fall');
    });
    expect(high).toBe(100);
  });

  test('ENSURE handles null', async ({ page }) => {
    const out = await page.evaluate(() => (window as any).__MG_ENSURE__(null));
    expect(out.highScores.catch_fall).toBe(0);
    expect(out.totalPlayed).toBe(0);
  });

  // ── Store ──

  test('RESET clears state', async ({ page }) => {
    await page.evaluate(() => (window as any).__MG_RECORD_RESULT__('catch_fall', 100, true, 45));
    await page.evaluate(() => (window as any).__MG_RESET__());
    const s = await page.evaluate(() => (window as any).__MG_GET_STATE__());
    expect(s.highScores.catch_fall).toBe(0);
    expect(s.totalPlayed).toBe(0);
  });

  test('GET_STATE returns MiniGamesState shape', async ({ page }) => {
    const s = await page.evaluate(() => (window as any).__MG_GET_STATE__());
    expect(s.highScores).toBeTruthy();
    expect(s.highScores.catch_fall).toBeDefined();
    expect(s.highScores.timing).toBeDefined();
    expect(Array.isArray(s.recent)).toBe(true);
    expect(typeof s.totalPlayed).toBe('number');
    expect(typeof s.totalWins).toBe('number');
  });

  test('GET_RECENT_STORE returns array', async ({ page }) => {
    await page.evaluate(() => (window as any).__MG_RECORD_RESULT__('catch_fall', 100, true, 45));
    const list = await page.evaluate(() => (window as any).__MG_GET_RECENT_STORE__());
    expect(list.length).toBe(1);
    expect(list[0].score).toBe(100);
  });

  test('GET_TOTAL_PLAYED + GET_TOTAL_WINS', async ({ page }) => {
    await page.evaluate(() => (window as any).__MG_RECORD_RESULT__('catch_fall', 100, true, 45));
    await page.evaluate(() => (window as any).__MG_RECORD_RESULT__('timing', 10, false, 30));
    const played = await page.evaluate(() => (window as any).__MG_GET_TOTAL_PLAYED__());
    const wins = await page.evaluate(() => (window as any).__MG_GET_TOTAL_WINS__());
    expect(played).toBe(2);
    expect(wins).toBe(1);
  });

  test('GET_META returns game meta', async ({ page }) => {
    const meta = await page.evaluate(() => (window as any).__MG_GET_META__('catch_fall'));
    expect(meta.id).toBe('catch_fall');
    expect(meta.icon).toBe('🎯');
  });

  test('GET_ALL_GAMES returns 2 games', async ({ page }) => {
    const games = await page.evaluate(() => (window as any).__MG_GET_ALL_GAMES__());
    expect(games.length).toBe(2);
  });

  // ── Full game simulation ──

  test('Catch Fall full game simulation', async ({ page }) => {
    const result = await page.evaluate(() => {
      const create = (window as any).__MG_CF_CREATE__;
      const start = (window as any).__MG_CF_START__;
      const spawn = (window as any).__MG_CF_SPAWN__;
      const tick = (window as any).__MG_CF_TICK__;
      const finish = (window as any).__MG_CF_FINISH__;
      const record = (window as any).__MG_RECORD_RESULT__;
      let s = start(create());
      // Tick 100 frames to settle
      for (let i = 0; i < 100; i++) {
        if (i % 30 === 0) {
          const obj = spawn(() => 0.5);
          s = { ...s, objects: [...s.objects, { ...obj, x: 100, y: 10 }] };
        }
        const r = tick(s, { deltaMs: 16 });
        s = r.state;
        if (s.finished) break;
      }
      // Force finish
      s = finish(s, true);
      record('catch_fall', s.score, s.success, 45);
      return s;
    });
    expect(result.finished).toBe(true);
    const high = await page.evaluate(() => (window as any).__MG_GET_HIGH_STORE__('catch_fall'));
    expect(high).toBeGreaterThanOrEqual(0);
  });

  test('Timing full game simulation', async ({ page }) => {
    const result = await page.evaluate(() => {
      const create = (window as any).__MG_T_CREATE__;
      const start = (window as any).__MG_T_START__;
      const tick = (window as any).__MG_T_INDICATOR__;
      const press = (window as any).__MG_T_PRESS__;
      const next = (window as any).__MG_T_NEXT__;
      const record = (window as any).__MG_RECORD_RESULT__;
      let s = start(create());
      for (let r = 0; r < 10; r++) {
        // Move indicator to target center then press
        const center = (s.targetStart + s.targetEnd) / 2;
        s = { ...s, indicatorPos: center };
        const pressRes = press(s);
        s = pressRes.state;
        s = next(s);
        if (s.finished) break;
      }
      record('timing', s.score, s.score >= 30, 50);
      return s;
    });
    expect(result.finished).toBe(true);
    expect(result.score).toBeGreaterThan(0);
  });

  test('Catch Fall bomb gives negative points', async ({ page }) => {
    const result = await page.evaluate(() => {
      const create = (window as any).__MG_CF_CREATE__;
      const start = (window as any).__MG_CF_START__;
      const tick = (window as any).__MG_CF_TICK__;
      const finish = (window as any).__MG_CF_FINISH__;
      let s = start(create());
      // Add a bomb directly under paddle
      s = { ...s, paddleX: 0, score: 50, objects: [{ id: 1, type: 'bomb', icon: '💣', points: -10, bad: true, x: 5, y: 280, speed: 3 }] };
      const r = tick(s, { deltaMs: 16 });
      return r.state;
    });
    expect(result.score).toBe(40);
  });

  test('Timing 10 rounds → score 200 (10 perfects)', async ({ page }) => {
    const final = await page.evaluate(() => {
      const create = (window as any).__MG_T_CREATE__;
      const start = (window as any).__MG_T_START__;
      const press = (window as any).__MG_T_PRESS__;
      const next = (window as any).__MG_T_NEXT__;
      let s = start(create());
      for (let i = 0; i < 10; i++) {
        const center = (s.targetStart + s.targetEnd) / 2;
        s = { ...s, indicatorPos: center };
        const pr = press(s);
        s = pr.state;
        s = next(s);
        if (s.finished) break;
      }
      return s;
    });
    expect(final.finished).toBe(true);
    expect(final.score).toBe(200); // 10 * 20
  });
});
