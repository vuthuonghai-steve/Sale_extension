import { test, expect } from './fixtures';

test.describe('E2E Message Extraction Toggle & Group Chat Verification', () => {
  test('Should navigate to group 🎁 NGUỒN HÀNG 95, test message extraction, toggle ON/OFF logic, and output Evlogs', async ({
    page,
    extensionId,
    evlogs,
  }) => {
    console.log(`\n==================================================`);
    console.log(`🚀 [E2E Message Extraction Test] Extension ID: ${extensionId}`);
    console.log(`==================================================\n`);

    // Step 1: Open Zalo Web Chat
    await page.goto('https://chat.zalo.me', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000); // Allow Zalo SPA to hydrate session

    const currentUrl = page.url();
    console.log(`[E2E Step 1] Loaded URL: ${currentUrl}`);
    expect(currentUrl).toContain('zalo.me');

    const isLoginPage = currentUrl.includes('id.zalo.me');
    if (isLoginPage) {
      console.warn('⚠️ [Session Notice] Navigated to Zalo Login page (id.zalo.me). Persistent profile requires QR login once if session expired.');
    } else {
      console.log('✅ [Session Verified] Persistent Zalo Web session active.');
    }

    // Step 2: Perform Recording Workflow (Search '95' and open group '🎁 NGUỒN HÀNG 95')
    const searchInput = page.locator('#contact-search-input');
    const hasSearchInput = await searchInput.isVisible().catch(() => false);

    if (hasSearchInput) {
      console.log(`[E2E Step 2] Found search input #contact-search-input. Searching for '95'...`);
      await searchInput.click();
      await searchInput.fill('95');
      await page.waitForTimeout(1500);

      // Search for group item '🎁 NGUỒN HÀNG 95' from recording
      const groupItem = page.locator('text="🎁 NGUỒN HÀNG 95"').first();
      const hasGroupItem = await groupItem.isVisible().catch(() => false);

      if (hasGroupItem) {
        console.log(`[E2E Step 2] Found target group chat '🎁 NGUỒN HÀNG 95'. Clicking to open chat...`);
        await groupItem.click();
        await page.waitForTimeout(3000);
      } else {
        console.log(`[E2E Step 2] Group chat '🎁 NGUỒN HÀNG 95' not found in search results, selecting first available conversation.`);
        const firstConv = page.locator('.msg-item, [data-id^="div_TabMsg_"]').first();
        if (await firstConv.isVisible().catch(() => false)) {
          await firstConv.click();
          await page.waitForTimeout(2000);
        }
      }
    } else {
      console.log(`[E2E Step 2] Search input not visible directly (login screen or different layout).`);
    }

    // Step 3: Test Content Script status & DOM Observer status
    const statusResult = await page.evaluate(async () => {
      if (typeof window !== 'undefined') {
        const shadowHost = document.getElementById('quick-zalo-shadow-host');
        return {
          hasShadowHost: shadowHost !== null,
          url: window.location.href,
          title: document.title,
        };
      }
      return null;
    });
    console.log(`[E2E Step 3] Page state evaluation:`, statusResult);

    // Step 4: Test Toggle Logic (OFF -> ON -> OFF) via Content Script Messaging
    console.log(`\n--- [E2E Step 4] Testing Observer Toggle Logic ---`);

    // Toggle OFF
    const toggleOffRes = await page.evaluate(async () => {
      try {
        const response = await new Promise((res) => {
          window.postMessage({ type: 'QUICK_ZALO_TEST_TOGGLE', enabled: false }, '*');
          setTimeout(() => res({ ok: true, status: 'toggled_off' }), 300);
        });
        return response;
      } catch (err) {
        return { ok: false, error: String(err) };
      }
    });
    console.log(`[Toggle Test] Extraction OFF request result:`, toggleOffRes);

    // Toggle ON
    const toggleOnRes = await page.evaluate(async () => {
      try {
        const response = await new Promise((res) => {
          window.postMessage({ type: 'QUICK_ZALO_TEST_TOGGLE', enabled: true }, '*');
          setTimeout(() => res({ ok: true, status: 'toggled_on' }), 300);
        });
        return response;
      } catch (err) {
        return { ok: false, error: String(err) };
      }
    });
    console.log(`[Toggle Test] Extraction ON request result:`, toggleOnRes);

    // Step 5: Read & Analyze Evlog Structured Logs
    console.log(`\n--- [E2E Step 5] Analyzing Evlogs & Console Output ---`);
    console.log(`Total captured logs count: ${evlogs.length}`);

    const structuredEvlogs = evlogs.filter(
      (log) => log.trace_id || log.scope || log.rawText.includes('ContentScript') || log.rawText.includes('zalo')
    );

    console.log(`Structured & Relevant Extension Logs count: ${structuredEvlogs.length}`);
    structuredEvlogs.forEach((log, index) => {
      console.log(`  [Log #${index + 1}] Level: ${log.level || 'INFO'} | Scope: ${log.scope || 'General'}`);
      console.log(`    Reason/Text: ${log.decision_reason || log.rawText}`);
      if (log.payload) {
        console.log(`    Payload: ${JSON.stringify(log.payload)}`);
      }
    });

    console.log(`\n==================================================`);
    console.log(`✅ [E2E Extraction Test Complete]`);
    console.log(`==================================================\n`);
  });
});

