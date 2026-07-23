import { fillInput, clickButton, scrapePageData } from '../utils/automation';
import type { CleanListingRecord } from '../utils/data-cleaner/types';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',

  main() {
    console.log('[Content Script] Lightweight Automation script active.');

    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('[Content Script] Received action:', message.action);

      switch (message.action) {
        case 'INJECT_LISTING_TEXT': {
          const record = message.payload as CleanListingRecord;
          if (!record) {
            sendResponse({ success: false, error: 'Empty payload' });
            break;
          }

          const formattedPrice = record.priceVnd
            ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(record.priceVnd)
            : 'Thỏa thuận';

          const textToInject = `[${record.district || 'HN'}] ${record.address} - Giá: ${formattedPrice} | Loaị: ${record.roomType || 'Phòng Trọ'} ${record.managerCode ? `(Mã QL: ${record.managerCode})` : ''}`;

          // Thử tìm active input, textarea hoặc contenteditable element trên trang
          const activeEl = document.activeElement as HTMLElement | null;
          let injected = false;

          if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
            const input = activeEl as HTMLInputElement | HTMLTextAreaElement;
            input.value = textToInject;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            injected = true;
          } else if (activeEl && activeEl.isContentEditable) {
            activeEl.innerText = textToInject;
            activeEl.dispatchEvent(new Event('input', { bubbles: true }));
            injected = true;
          } else {
            // Thử điền vào input chat hoặc search phổ biến
            const chatInput = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
              'div[contenteditable="true"], textarea, input[type="text"]'
            );
            if (chatInput) {
              if (chatInput.tagName === 'DIV' && (chatInput as HTMLElement).isContentEditable) {
                (chatInput as HTMLElement).innerText = textToInject;
                chatInput.dispatchEvent(new Event('input', { bubbles: true }));
              } else {
                (chatInput as HTMLInputElement).value = textToInject;
                chatInput.dispatchEvent(new Event('input', { bubbles: true }));
                chatInput.dispatchEvent(new Event('change', { bubbles: true }));
              }
              injected = true;
            }
          }

          sendResponse({
            success: injected,
            status: injected ? 'Đã điền thông tin phòng trọ vào DOM thành công' : 'Không tìm thấy khung nhập liệu active',
          });
          break;
        }

        case 'AUTO_FILL': {
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

      return true;
    });
  },
});
