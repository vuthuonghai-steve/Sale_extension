import { fillInput, clickButton, scrapePageData } from '../utils/automation';

export default defineContentScript({
  matches: ['<all_urls>'], // Chạy trên mọi trang web
  runAt: 'document_idle',

  main() {
    console.log('[Content Script] Lightweight Automation script active.');

    // Lắng nghe lệnh từ Background (gửi từ Hotkey hoặc Popup)
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('[Content Script] Received action:', message.action);

      switch (message.action) {
        case 'AUTO_FILL': {
          // Thử điền vào các selector phổ biến nếu có trên trang
          const filledName = fillInput('input[name*="name" i], input[id*="name" i]', 'Nguyễn Văn A');
          const filledEmail = fillInput('input[type="email"], input[name*="email" i]', 'test@company.com');
          const filledPhone = fillInput('input[type="tel"], input[name*="phone" i]', '0987654321');

          sendResponse({
            success: true,
            status: `Đã điền thành công: ${[filledName && 'Name', filledEmail && 'Email', filledPhone && 'Phone'].filter(Boolean).join(', ') || 'Không tìm thấy input phù hợp'}`,
          });
          break;
        }

        case 'SCRAPE_DATA': {
          const data = scrapePageData();
          console.log('[Content Script] Scraped data:', data);

          // Gửi dữ liệu về lại cho background xử lý
          browser.runtime.sendMessage({
            type: 'DATA_SCRAPED',
            payload: data,
          });

          sendResponse({ success: true, data });
          break;
        }

        case 'AUTO_CLICK': {
          const clicked = clickButton('button[type="submit"], input[type="submit"], button.btn-primary');
          sendResponse({ success: clicked, status: clicked ? 'Clicked successfully' : 'Button not found' });
          break;
        }

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }

      return true; // async response support
    });
  },
});
