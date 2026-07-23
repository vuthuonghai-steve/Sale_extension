# 🤖 AGENTS.md - LLM Code Base Behavior & Engineering Guidelines

Tài liệu này chứa các quy định bắt buộc dành cho các LLM / AI Coding Assistant (như Gemini, Claude, ChatGPT, v.v.) khi tham gia đọc, bảo trì và mở rộng codebase của Browser Extension này.

---

## 🏗️ 1. Kiến Trúc & Cấu Trúc Dự Án (Architecture Reference)

LLM **BẮT BUỘC** tham chiếu file [tree_work_space.md](file:///home/stveve/Documents/workspace/Sales/extension/zalo_quick_action/tree_work_space.md) để nắm rõ sơ đồ thư mục, danh sách trách nhiệm từng file và quy tắc **Flat Name Pattern**.

### Nguyên tắc bất biến:
- `content/content.js` chỉ giữ vai trò **Main Orchestrator (Entry Point)**. KHÔNG ĐƯỢC tự ý nhét thêm logic DOM automation phức tạp hay giao diện CSS trực tiếp vào file này.
- Khi cần phát triển một tính năng/phân vùng mới, hãy tạo thêm file module với tiền tố `content-{module-name}.js`.
- Bất kỳ khi nào tạo file module mới trong `content/`, BẮT BUỘC phải cập nhật danh sách script trong `manifest.json` theo đúng thứ tự phụ thuộc.

---

## 🛡️ 2. Quy Tắc Ghi Log & Xử Lý Lỗi (Dev Logging & Error Alert)

- **KHÔNG BỎ QUA HOẶC NUỐT LỖI (Silent Catch)**: Tuyệt đối không dùng `try { ... } catch (e) {}` rỗng mà không báo cáo.
- **Sử dụng `ZaloQuickActionLogger`**: Tất cả log console hoặc thông tin debug phải đi qua `window.ZaloQuickActionLogger`.
  - Log thông thường: `window.ZaloQuickActionLogger.info(scope, message, data)`
  - Log thành công: `window.ZaloQuickActionLogger.success(scope, message, data)`
  - Log cảnh báo: `window.ZaloQuickActionLogger.warn(scope, message, data)`
  - Log lỗi nghiêm trọng: `window.ZaloQuickActionLogger.error(scope, message, data)` *(Tự động hiển thị Dev Alert Modal trên UI)*

---

## 🎨 3. Quy Tắc Giao Diện UI & Shadow DOM

- Mọi thành phần UI chèn vào trang web (Toolbar, Toast, Dev Error Modal) **BẮT BUỘC** phải nằm bên trong **Shadow DOM** (`zalo-quick-action-root`) để tránh xung đột CSS với trang web của người dùng.
- Trách nhiệm render UI hoàn toàn thuộc về `content-ui.js`. Các module khác chỉ truyền data và callback.

---

## ⚙️ 4. Quy Trình Làm Việc Khi LLM Nhận Yêu Cầu (Workflow Guidelines)

1. **Trước khi sửa code**: Đọc file [tree_work_space.md](file:///home/stveve/Documents/workspace/Sales/extension/zalo_quick_action/tree_work_space.md) để xác định đúng file/scope cần chỉnh sửa.
2. **Khi thêm/sửa DOM Selector trên Zalo Web**: Chỉnh sửa duy nhất trong `content-zalo-adapter.js`.
3. **Khi thêm setting mới**: Cập nhật defaults trong `content-config.js` và `popup/popup.js`.
4. **Sau khi thực hiện thay đổi**: Kiểm tra tính tương thích của `manifest.json` và đảm bảo các global namespace (`window.ZaloQuickAction*`) không bị trùng lặp hoặc lỡ xóa.
