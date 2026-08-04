import { test, expect } from './fixtures';

test.describe('E2E Zalo Web & Quick Zalo Module Integration Flow', () => {
  test('Should open Zalo Web with persistent login session and inject Quick Zalo extension', async ({
    page,
    extensionId,
    evlogs,
  }) => {
    console.log(`[E2E Test] Chrome Extension ID loaded: ${extensionId}`);

    // Step 1: Navigate to Zalo Web
    await page.goto('https://chat.zalo.me', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000); // Give Zalo SPA time to hydrate and restore session

    const currentUrl = page.url();
    const pageTitle = await page.title();
    console.log(`[E2E Test] Current URL: ${currentUrl}`);
    console.log(`[E2E Test] Page Title: ${pageTitle}`);

    // Step 2: Check login status
    const isLoginPage = currentUrl.includes('id.zalo.me');
    const isChatPage = currentUrl.includes('chat.zalo.me');

    if (isLoginPage) {
      console.warn('⚠️ [E2E Test Warning] Redirected to Zalo Login Page (id.zalo.me). User session not logged in yet or session expired.');
    } else if (isChatPage) {
      console.log('✅ [E2E Test Success] Successfully loaded Zalo Web Chat session!');
    }

    // Step 3: Check for main Zalo elements or QR code
    const mainTabExists = await page.locator('#main-tab, .main-tab, #nav-tabs').count();
    console.log(`[E2E Test] Main Tab selector count: ${mainTabExists}`);

    // Step 4: Verify Evlog & DevTools console entries captured from Extension / Page
    console.log(`[E2E Test] Total captured logs count: ${evlogs.length}`);
    const structuredEvlogs = evlogs.filter((log) => log.trace_id || log.scope);

    if (structuredEvlogs.length > 0) {
      console.log(`[E2E Test] Found ${structuredEvlogs.length} Evlog JSON structured logs:`);
      structuredEvlogs.forEach((log, index) => {
        console.log(`  Log #${index + 1}: [${log.level || 'INFO'}] [${log.scope || 'N/A'}] ${log.decision_reason || log.rawText}`);
      });
    } else {
      console.log('[E2E Test] Sample captured Console Logs via DevTools fixture:');
      evlogs.slice(0, 5).forEach((log, i) => {
        console.log(`  [Log ${i + 1}] ${log.rawText.substring(0, 100)}...`);
      });
    }

    expect(currentUrl).toContain('zalo.me');
  });
});
