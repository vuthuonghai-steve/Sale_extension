export default defineBackground(() => {
  console.log('[Background] Service worker initialized. Extension ID:', browser.runtime.id);

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
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Background] Received message:', message, 'from:', sender);

    if (message.type === 'DATA_SCRAPED') {
      console.log('[Background] Data scraped successfully:', message.payload);
      // Bạn có thể lưu vào storage hoặc gửi thông báo
      sendResponse({ status: 'SUCCESS' });
    }
    return true;
  });
});
