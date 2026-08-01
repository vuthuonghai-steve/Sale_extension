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
│   └── app.js                 # [CENTRAL CONFIG] Quản lý tập trung Shortcuts, Actions & Special Constants
├── background/
│   └── background.js          # Service Worker xử lý sự kiện nền (Context Menu, Hotkey Shortcuts)
├── content/
│   ├── content.js             # [MAIN ORCHESTRATOR] Entry point, đóng vai trò Cầu nối & Điều phối
│   ├── content-logger.js      # [SCOPE LOGGER] Hệ thống ghi log theo Scope & Dev Error UI Alert Modal
│   ├── content-config.js      # [CONFIG SERVICE] Quản lý Settings & Đồng bộ Chrome Storage
│   ├── content-text.js        # [TEXT UTILITIES] Tiền xử lý & làm sạch văn bản bôi đen
│   ├── content-ui.js          # [SHADOW UI] Quản lý Shadow DOM Overlay, Floating Toolbar & Toast
│   └── content-zalo-adapter.js# [DOM ADAPTER] Tự động hóa DOM dành riêng cho trang Zalo Web
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
  "config/app.js",                  // 1. App Global Config & Shortcuts (Đứng đầu tiên)
  "content/content-logger.js",      // 2. Logger System
  "content/content-config.js",      // 3. Storage Config Service
  "content/content-text.js",        // 4. Text Helper
  "content/content-ui.js",          // 5. Shadow DOM & UI Engine
  "content/content-zalo-adapter.js",// 6. Zalo Automation Adapter
  "content/content.js"              // 7. Main Orchestrator (Luôn đứng cuối)
]
```

### 3. Namespace & Global Objects Pattern
Mỗi module xuất ra một Object duy nhất dưới dạng Singleton trên `window` / `globalThis`:
- `config/app.js` $\rightarrow$ `window.ZaloQuickActionApp`
- `content-logger.js` $\rightarrow$ `window.ZaloQuickActionLogger`
- `content-config.js` $\rightarrow$ `window.ZaloQuickActionConfig`
- `content-text.js` $\rightarrow$ `window.ZaloQuickActionText`
- `content-ui.js` $\rightarrow$ `window.ZaloQuickActionUI`
- `content-zalo-adapter.js` $\rightarrow$ `window.ZaloQuickActionAdapter`
- `content.js` $\rightarrow$ IIFE Orchestrator điều phối.
