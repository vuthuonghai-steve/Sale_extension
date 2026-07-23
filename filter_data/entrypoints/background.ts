export default defineBackground(() => {
  console.log('[Background] Service worker initialized. Extension ID:', browser.runtime.id);

  // Cấu hình Chrome Side Panel tự động trượt mở khi nhấp biểu tượng Extension
  const globalChrome = (globalThis as any).chrome;
  if (globalChrome?.sidePanel?.setPanelBehavior) {
    globalChrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((err: any) => console.error('[Background] Error setting side panel behavior:', err));
  }

  // Lắng nghe Phím tắt Hotkey từ bàn phím (Alt+Shift+F & Alt+Shift+S)
  browser.commands.onCommand.addListener(async (command) => {
    console.log(`[Background] Hotkey triggered: ${command}`);

    const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!activeTab?.id) return;

    if (command === 'trigger-fill') {
      await browser.tabs.sendMessage(activeTab.id, { action: 'AUTO_FILL' });
    } else if (command === 'trigger-scrape') {
      await browser.tabs.sendMessage(activeTab.id, { action: 'SCRAPE_DATA' });
    }
  });

  // Lắng nghe Message truyền từ Popup hoặc Content Script
  browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    console.log('[Background] Received message:', message, 'from:', sender);

    if (message.action === 'FILL_LISTING_DATA') {
      // Gửi message tới active tab để inject dữ liệu vào DOM
      const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (activeTab?.id) {
        try {
          const res = await browser.tabs.sendMessage(activeTab.id, {
            action: 'INJECT_LISTING_TEXT',
            payload: message.payload,
          });
          sendResponse({ status: 'SUCCESS', res });
        } catch (err: any) {
          sendResponse({ status: 'ERROR', message: err.message });
        }
      } else {
        sendResponse({ status: 'ERROR', message: 'Không tìm thấy Active Tab' });
      }
      return true;
    }

    if (message.action === 'OPEN_DASHBOARD') {
      const dashboardUrl = (browser.runtime.getURL as any)('/dashboard.html');
      await browser.tabs.create({ url: dashboardUrl });
      sendResponse({ status: 'SUCCESS' });
      return true;
    }

    if (message.type === 'DATA_SCRAPED') {
      console.log('[Background] Data scraped successfully:', message.payload);
      sendResponse({ status: 'SUCCESS' });
      return true;
    }

    return true;
  });
});
