# Extension Architecture & Workspace Tree Pattern

## 📌 Architecture Overview
Dự án được xây dựng theo kiến trúc **Modular Flat-Name Pattern** dành riêng cho Browser Extension Manifest V3.
Kiến trúc này phân tách trách nhiệm (Separation of Concerns) thành các file đơn có tiền tố rõ ràng (`content-*`), nhằm tối ưu ngữ cảnh (Context Window) cho AI/LLM khi đọc, chỉnh sửa và mở rộng codebase.

---

## 📂 Workspace Directory Tree

```text
zalo_quick_action/
├── AGENTS.md                  # Hướng dẫn hành vi & quy tắc dành riêng cho LLM / AI Agents
├── tree_work_space.md         # Sơ đồ kiến trúc pattern & danh sách trách nhiệm các file
├── manifest.json              # Khai báo cấu hình Extension V3 & thứ tự nạp Content Scripts
├── README.md                  # Tài liệu dự án cho người dùng
├── config/
│   ├── filter-rules.js        # [FILTER RULES] Quản lý tập trung các Regular Expressions lọc hoa hồng & thương hiệu
│   └── app.js                 # [CENTRAL CONFIG] Quản lý tập trung Shortcuts, Actions & Special Constants
├── background/
│   └── background.js          # Service Worker xử lý sự kiện nền (Context Menu, Hotkey Shortcuts)
├── content/
│   ├── content.js             # [MAIN ORCHESTRATOR] Entry point, đóng vai trò Cầu nối & Điều phối
│   ├── content-logger.js      # [SCOPE LOGGER] Hệ thống ghi log theo Scope & Dev Error UI Alert Modal
│   ├── content-config.js      # [CONFIG SERVICE] Quản lý Settings & Đồng bộ Chrome Storage
│   ├── content-text.js        # [TEXT UTILITIES] Tiền xử lý & làm sạch văn bản bôi đen
│   ├── content-ui.js          # [SHADOW UI] Quản lý Shadow DOM Overlay, Floating Toolbar & Toast
│   ├── content-zalo-dom.js    # [ZALO DOM] Mô phỏng sự kiện click & kiểm tra DOM Zalo Web
│   ├── content-zalo-extractor.js# [ZALO EXTRACTOR] Trích xuất nội dung tin nhắn Zalo từ vùng chọn/bôi đen
│   ├── content-zalo-share.js  # [ZALO SHARE] Kích hoạt nút chia sẻ & inject văn bản vào ô tìm kiếm
│   └── content-zalo-adapter.js# [FACADE ADAPTER] Facade gộp các sub-module Zalo để giữ vững API Contract
├── tests/
│   ├── mock-cases.js          # [MOCK DATASET] Tập hợp toàn bộ mock test cases (Cũ + Mới) chống regression
│   └── run-tests.js           # [TEST RUNNER] Bộ chạy kiểm thử tự động toàn diện cho Regex
├── popup/
│   ├── popup.html             # Giao diện cài đặt popup nhanh
│   ├── popup.js               # Logic lưu/tải cài đặt tại popup
│   └── popup.css              # Styling giao diện popup
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## 📐 Flat Pattern Principles & Naming Conventions

### 1. Quy tắc đặt tên file (Flat Naming Pattern)
- Không tạo các thư mục con lồng nhau quá sâu trong `content/`. Tất cả module thuộc content script nằm cùng cấp thư mục `content/` và bắt đầu bằng tiền tố `content-`.
- Tên file đại diện trực tiếp cho Scope/Trách nhiệm: `content-{module_name}.js`.

### 2. Thứ tự nạp Script trong `manifest.json`
Các script độc lập (Utilities/Services) phải được nạp trước `content.js`:
```json
"js": [
  "config/filter-rules.js",         // 1. Tập luật Regular Expressions lọc văn bản
  "config/app.js",                  // 2. App Global Config & Shortcuts
  "content/content-logger.js",      // 3. Logger System
  "content/content-config.js",      // 4. Storage Config Service
  "content/content-text.js",        // 5. Text Helper
  "content/content-ui.js",          // 6. Shadow DOM & UI Engine
  "content/content-zalo-dom.js",    // 7. Zalo DOM Helper & Event Simulator
  "content/content-zalo-extractor.js",// 8. Zalo Text Extractor
  "content/content-zalo-share.js",  // 9. Zalo Share Button & Search Input Injector
  "content/content-zalo-adapter.js",// 10. Zalo Automation Adapter Facade
  "content/content.js"              // 11. Main Orchestrator (Luôn đứng cuối)
]
```

### 3. Namespace & Global Objects Pattern
Mỗi module xuất ra một Object duy nhất dưới dạng Singleton trên `window` / `globalThis`:
- `config/filter-rules.js` $\rightarrow$ `window.ZaloQuickActionFilterRules`
- `config/app.js` $\rightarrow$ `window.ZaloQuickActionApp`
- `content-logger.js` $\rightarrow$ `window.ZaloQuickActionLogger`
- `content-config.js` $\rightarrow$ `window.ZaloQuickActionConfig`
- `content-text.js` $\rightarrow$ `window.ZaloQuickActionText`
- `content-ui.js` $\rightarrow$ `window.ZaloQuickActionUI`
- `content-zalo-dom.js` $\rightarrow$ `window.ZaloQuickActionDOM`
- `content-zalo-extractor.js` $\rightarrow$ `window.ZaloQuickActionExtractor`
- `content-zalo-share.js` $\rightarrow$ `window.ZaloQuickActionShare`
- `content-zalo-adapter.js` $\rightarrow$ `window.ZaloQuickActionAdapter` (Facade)
- `content.js` $\rightarrow$ IIFE Orchestrator điều phối.
