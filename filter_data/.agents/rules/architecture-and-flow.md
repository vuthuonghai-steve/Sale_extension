---
description: "Kích hoạt khi cần phân tích kiến trúc hệ thống, luồng dữ liệu giữa content script - background worker - popup - database, hoặc refactor module lớn"
activation: "Model Decision"
---

# 🏗️ Rule: System Architecture & Message Flow

Rule này áp dụng khi thiết kế tính năng mới, tái cấu trúc hệ thống hoặc làm việc với giao tiếp giữa các thành phần Chrome Extension và lớp lưu trữ cơ sở dữ liệu.

## 1. Kiến trúc Tổng thể (MV3 Chrome Extension & Data Pipeline)
```text
+------------------+         Chrome Commands         +--------------------+
|  User Hotkey     | ------------------------------> |   background.ts    |
| (Alt+Shift+F/S)  |                                 | (Service Worker)   |
+------------------+                                 +--------------------+
                                                              |
                                                     chrome.tabs.sendMessage
                                                              v
+------------------+        Direct DOM Access        +--------------------+
|   Target Web     | <------------------------------ |    content.ts      |
|  (Host Page)     |                                 |  (Content Script)  |
+------------------+                                 +--------------------+
                                                              ^
                                                     chrome.runtime.sendMessage
                                                              |
                                                     +--------------------+
                                                     |  popup/main.ts     |
                                                     |    (UI Popup)      |
                                                     +--------------------+
                                                              |
                                                    Data Transformation
                                                              v
                                                     +--------------------+
                                                     | DataCleanerManager |
                                                     | (utils/data-clean) |
                                                     +--------------------+
                                                              |
                                                      IndexedDB Dexie.js
                                                              v
                                                     +--------------------+
                                                     |   Data/Database    |
                                                     | (ListingRepo / DB) |
                                                     +--------------------+
```

## 2. Quy tắc Giao tiếp & Tầng Dữ liệu (Messaging & Persistence Contracts)
- Mọi message truyền giữa `background`, `content`, và `popup` phải có định dạng chuẩn:
  ```typescript
  interface ExtensionMessage<T = any> {
    action: string;
    payload?: T;
  }
  ```
- **Content Script Isolation:** Content script chạy độc lập trên context trang web host. Không can thiệp hoặc thay đổi các biến global của trang host ngoại trừ các thao tác DOM trực tiếp.
- **Background Persistence Isolation:** Background Service Worker có thể dừng bất cứ lúc nào; sử dụng IndexedDB (`Data/Database` với Dexie.js) cho mảng dữ liệu phòng lớn (50k - 80k bản ghi) và `chrome.storage.local` cho cấu hình nhẹ.
