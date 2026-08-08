# 🎯 Quy chuẩn & Hướng dẫn Kiểm thử Zalo E2E (Zalo E2E Testing Guide)

Tài liệu này định nghĩa **quy chuẩn bắt buộc** và **hướng dẫn thực thi** cho toàn bộ các bài kiểm thử đầu-cuối (E2E) trên Zalo Web với Chrome Extension MV3 (WXT).

---

## 🚫 1. Chống Bẫy "Mock Illusion" (False Positive Prevention)

> [!CAUTION]
> **Tuyệt đối CẤM 2 hành vi gây sai lệch kết quả kiểm thử:**
> 1. **CẤM dùng `page.addScriptTag()`** để tự bơm file JS vào trang. Extension phải được Chrome tự động nạp thông qua `"content_scripts"` được khai báo trong `manifest.json`.
> 2. **CẤM tự chế HTML giả lập (`page.route` trả về HTML tự tạo)** có cấu trúc class tự đặt không có thật trên Zalo Web.

---

## ⚡ 2. Cơ chế Kết nối CDP (Chrome DevTools Protocol - Cổng 9222)

Khi thực hiện kiểm thử trên Zalo Web, **luôn ưu tiên kết nối vào phiên Chrome Dev đang mở sẵn** (được khởi chạy từ `pnpm run dev` hoặc lệnh mở Chrome với profile `.user-data`):

```mermaid
flowchart LR
    A["Chrome Dev đang mở sẵn<br/>(Profile: .user-data | Port: 9222)"] 
    <-->|CDP WebSocket| 
    B["Playwright Test Fixture<br/>(extensionTest)"]
    B --> C["Thao tác trực tiếp trên Tab Zalo thật<br/>(Không tốn thời gian boot Chrome, không lỗi Lock)"]
```

### Cách thức hoạt động của `extensionTest` Fixture:
1. **Bước 1 (Kiểm tra cổng 9222):** Dò `http://localhost:9222/json/version`.
2. **Bước 2 (Kết nối tức thì):** Nếu có cổng 9222 đang mở $\rightarrow$ gọi `chromium.connectOverCDP()` để móc nối trực tiếp vào phiên Chrome đang mở (<100ms).
3. **Bước 3 (Fallback an toàn):** Nếu không có phiên dev sẵn $\rightarrow$ dọn dẹp file lock rác (`SingletonLock`) và khởi chạy với `chromium.launchPersistentContext(USER_DATA_DIR, ...)`.

---

## 📋 3. Tiêu chuẩn viết bài test Zalo E2E Flow

Mọi tệp kiểm thử trong `tests/e2e/flows/` phải tuân thủ cấu trúc sau:

```typescript
import { expect } from '@playwright/test';
import { extensionTest } from '../fixtures/extension.fixture';

extensionTest('E2E: Trích xuất và copy tin nhắn Zalo Web thật', async ({ page }) => {
  // 1. Điều hướng tới Zalo Web (sử dụng session đăng nhập có sẵn từ .user-data)
  await page.goto('https://chat.zalo.me', { waitUntil: 'domcontentloaded' });

  // 2. Xác minh cơ học: Content Script đã được Chrome nạp và Shadow DOM đã tồn tại
  const isLoaded = await page.evaluate(() => {
    return Boolean(document.getElementById('zalo-quick-action-root'));
  });
  expect(isLoaded).toBe(true);

  // 3. Tương tác thật trên DOM Zalo (Bôi đen tin nhắn thật hoặc bấm Alt + Q)
  const messageElement = page.locator('[class*="msg-item"], [data-id]').first();
  await messageElement.waitFor({ state: 'visible', timeout: 10000 });

  // 4. Bấm phím tắt Alt + Q
  await page.keyboard.press('Alt+KeyQ');

  // 5. Kiểm tra phản hồi Toast trong Shadow DOM
  const toast = page.locator('#zalo-quick-action-root').locator('.zalo-quick-toast');
  await expect(toast).toBeVisible({ timeout: 5000 });
});
```

---

## 🔍 4. Bảng tra cứu DOM Selectors Zalo Web thực tế

Khi truy vấn hoặc bóc tách phần tử trên Zalo Web, **BẮT BUỘC** sử dụng các bộ chọn đã được kiểm chứng:

| Mục tiêu DOM | Selectors chuẩn | Ghi chú |
| :--- | :--- | :--- |
| **Bong bóng tin nhắn** | `[class*="msg-item"], [class*="chat-item"], [data-id*="msg"], div[data-id], .msg-item, div[role="row"]` | Đã kiểm chứng trên React DOM của Zalo |
| **Thẻ chứa nội dung chữ** | `[class*="text-content"], [class*="msg-text"], [class*="card-content"], [class*="msg-content"], [class*="bubble"]` | Tránh dính avatar, tên người gửi, giờ gửi |
| **Vùng cấm (Input Chat)** | `#input_chat, [contenteditable="true"], .chat-input, .search-bar, .setting-menu` | Phải chặn không trích xuất khi bôi đen trong ô gõ |
| **Shadow Root Host** | `#zalo-quick-action-root` | Vùng cô lập CSS của Extension trên Zalo |

---

## 🚀 5. Các lệnh thực thi kiểm thử chuẩn

```bash
# 1. Chạy E2E với giao diện Chrome thật bật lên màn hình (Khuyên dùng khi debug):
npx playwright test tests/e2e/flows/zalo-quick-action-extractor.e2e.ts --headed

# 2. Chạy toàn bộ E2E Test Suites:
pnpm run test:e2e

# 3. Mở giao diện Playwright UI trực quan:
npx playwright test --ui
```
