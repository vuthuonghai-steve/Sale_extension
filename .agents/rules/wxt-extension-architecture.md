---
trigger: glob
description: "Quy chuẩn kiến trúc WXT Chrome Extension MV3, Service Worker, Content Scripts và DOM Automation"
globs: ["entrypoints/**", "utils/**", "wxt.config.ts"]
---

# 🧩 Rule: WXT Chrome Extension Architecture & DOM Emulation

Rule này tự động kích hoạt khi làm việc với các file entrypoint, utilities hoặc file cấu hình extension (`wxt.config.ts`).

## 1. Extension Lifecycle & Service Worker (MV3)
- `entrypoints/background.ts` chạy như một Chrome Manifest V3 Service Worker:
  - KHÔNG giữ biến state toàn cục trong bộ nhớ lâu dài (Service Worker có thể bị giải phóng bộ nhớ bất kỳ lúc nào).
  - Sử dụng `chrome.runtime.onMessage` và `chrome.commands.onCommand` làm event-driven handler chính.
  - Sử dụng `chrome.storage.local` hoặc WXT Storage API khi cần lưu trữ trạng thái.

## 2. DOM Automation & Event Simulation (`utils/automation.ts`)
- Khi tự động hóa điền form trên các trang React / Vue / Angular / Custom Elements:
  - Phải gán `element.value = newValue`.
  - Phải dispatch đầy đủ chuỗi sự kiện:
    ```typescript
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));
    ```
  - Kiểm tra sự tồn tại của element trước khi thao tác, hỗ trợ retry/wait-for-element mượt mà.

## 3. Communication Pattern (Content Script <-> Background <-> Popup)
- Gửi message chuẩn hóa với `action` và `payload` có type định nghĩa rõ ràng.
- Xử lý bất đồng bộ trong message listener phải return `true` nếu dùng callback hoặc sử dụng `async/await` với WXT messaging API.