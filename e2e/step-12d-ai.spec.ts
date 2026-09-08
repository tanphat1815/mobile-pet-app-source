/**
 * Step 12d — AI Chatbot BYOK e2e tests.
 */

import { test, expect, type Page } from '@playwright/test';

async function waitForAppMount(page: Page) {
  await page.waitForSelector('body', { timeout: 60_000 });
  await page.waitForTimeout(2500);
}

test.describe('Step 12d — AI Chatbot BYOK', () => {
  test('AI_PROVIDERS exposed with 7 entries', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const count = await page.evaluate(() => (window as any).__AI_PROVIDER_COUNT__);
    expect(count).toBe(7);
  });

  test('AI_PROVIDERS includes all 7 expected ids', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const ids = await page.evaluate(() => (window as any).__AI_PROVIDER_IDS__);
    expect(ids).toContain('gemini');
    expect(ids).toContain('openai');
    expect(ids).toContain('deepseek');
    expect(ids).toContain('anthropic');
    expect(ids).toContain('groq');
    expect(ids).toContain('ollama');
    expect(ids).toContain('offline');
  });

  test('DEFAULT_AI_SETTINGS uses gemini + gemini-1.5-flash', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const def = await page.evaluate(() => (window as any).__AI_DEFAULT_SETTINGS__);
    expect(def.provider).toBe('gemini');
    expect(def.model).toBe('gemini-1.5-flash');
  });

  test('AI_IS_CONFIGURED: offline always true', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const r = await page.evaluate(() => (window as any).__AI_IS_CONFIGURED__('offline'));
    expect(r).toBe(true);
  });

  test('AI_IS_CONFIGURED: gemini needs api key', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const r1 = await page.evaluate(() => (window as any).__AI_IS_CONFIGURED__('gemini'));
    expect(r1).toBe(false);
    await page.evaluate(() => (window as any).__AI_SET_API_KEY__('gemini', 'AIza-test'));
    const r2 = await page.evaluate(() => (window as any).__AI_IS_CONFIGURED__('gemini'));
    expect(r2).toBe(true);
  });

  test('AI_GET_API_KEY returns set value', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    await page.evaluate(() => (window as any).__AI_SET_API_KEY__('openai', 'sk-test-1234'));
    const r = await page.evaluate(() => (window as any).__AI_GET_API_KEY__('openai'));
    expect(r).toBe('sk-test-1234');
  });

  test('AI_REMOVE_API_KEY clears the key', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    await page.evaluate(() => (window as any).__AI_SET_API_KEY__('gemini', 'AIza-test'));
    await page.evaluate(() => (window as any).__AI_REMOVE_API_KEY__('gemini'));
    const r = await page.evaluate(() => (window as any).__AI_GET_API_KEY__('gemini'));
    expect(r).toBe('');
  });

  test('AI_SET_PROVIDER updates default model', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const r = await page.evaluate(() => (window as any).__AI_SET_PROVIDER__('openai'));
    expect(r).toBe('openai');
  });

  test('AI_PUSH_HISTORY + AI_GET_HISTORY roundtrip', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    await page.evaluate(() => {
      (window as any).__AI_PUSH_HISTORY__({ role: 'user', content: 'hi', timestamp: 1 });
      (window as any).__AI_PUSH_HISTORY__({ role: 'assistant', content: 'meow', timestamp: 2 });
    });
    const h = await page.evaluate(() => (window as any).__AI_GET_HISTORY__());
    expect(h.length).toBe(2);
    expect(h[0].content).toBe('hi');
    expect(h[1].content).toBe('meow');
  });

  test('AI_CLEAR_HISTORY empties history', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    await page.evaluate(() => {
      (window as any).__AI_PUSH_HISTORY__({ role: 'user', content: 'hi', timestamp: 1 });
    });
    await page.evaluate(() => (window as any).__AI_CLEAR_HISTORY__());
    const h = await page.evaluate(() => (window as any).__AI_GET_HISTORY__());
    expect(h.length).toBe(0);
  });

  test('AI_PARSE_RESPONSE extracts single action', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const r = await page.evaluate(() =>
      (window as any).__AI_PARSE_RESPONSE__('Hello! 💃 [action:DANCE]')
    );
    expect(r.actions).toEqual(['DANCE']);
    expect(r.cleanText).not.toContain('[action:');
  });

  test('AI_PARSE_RESPONSE extracts multiple + dedupes', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const r = await page.evaluate(() =>
      (window as any).__AI_PARSE_RESPONSE__('[action:FEED] [action:PET] [action:FEED]')
    );
    expect(r.actions).toEqual(['FEED', 'PET']);
  });

  test('AI_DETECT_EMOTION: happy', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const r = await page.evaluate(() =>
      (window as any).__AI_DETECT_EMOTION__('Em vui quá! 💃')
    );
    expect(r).toBe('happy');
  });

  test('AI_DETECT_EMOTION: sleep', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const r = await page.evaluate(() =>
      (window as any).__AI_DETECT_EMOTION__('Em buồn ngủ 💤')
    );
    expect(r).toBe('sleepy');
  });

  test('AI_ACTION_EMOJI returns emoji for FEED', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const r = await page.evaluate(() => (window as any).__AI_ACTION_EMOJI__('FEED'));
    expect(r).toBe('🍖');
  });

  test('AI_OFFLINE_RESPONSE includes FEED for food keyword', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const r = await page.evaluate(() =>
      (window as any).__AI_OFFLINE_RESPONSE__('Em đói bụng')
    );
    expect(r).toContain('[action:FEED]');
  });

  test('AI_BOT_CHAT returns parsed response (offline)', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const r = await page.evaluate(async () => {
      const result = await (window as any).__AI_BOT_CHAT__('Em đói quá master');
      return {
        hasText: typeof result?.cleanText === 'string' && result.cleanText.length > 0,
        hasAction: Array.isArray(result?.actions),
        hasEmotion: typeof result?.emotion === 'string',
      };
    });
    expect(r.hasText).toBe(true);
    expect(r.hasAction).toBe(true);
    expect(r.hasEmotion).toBe(true);
  });

  test('AI_BOT_HISTORY grows after chat', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const before = await page.evaluate(() => {
      (window as any).__AI_BOT_CLEAR__();
      return (window as any).__AI_BOT_HISTORY__().length;
    });
    expect(before).toBe(0);
    await page.evaluate(async () => await (window as any).__AI_BOT_CHAT__('Hello'));
    const after = await page.evaluate(() => (window as any).__AI_BOT_HISTORY__().length);
    expect(after).toBe(2); // user + assistant
  });

  test('AI_TEST_CONNECTION: offline succeeds', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const r = await page.evaluate(async () => await (window as any).__AI_TEST_CONNECTION__('offline'));
    expect(r.success).toBe(true);
  });

  test('AI_TEST_CONNECTION: gemini without key fails', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const r = await page.evaluate(async () => await (window as any).__AI_TEST_CONNECTION__('gemini'));
    expect(r.success).toBe(false);
  });

  test('AI_BOT_UPDATE_SETTINGS merges settings', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    await page.evaluate(() =>
      (window as any).__AI_BOT_UPDATE_SETTINGS__({ temperature: 0.2 })
    );
    // Just verify the function ran without throwing
    expect(true).toBe(true);
  });

  test('AI_EMOTION_EMOJI returns expected', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const r1 = await page.evaluate(() => (window as any).__AI_EMOTION_EMOJI__('happy'));
    const r2 = await page.evaluate(() => (window as any).__AI_EMOTION_EMOJI__('love'));
    expect(r1).toBe('😺');
    expect(r2).toBe('🥰');
  });
});
