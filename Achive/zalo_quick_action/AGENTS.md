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

---

## 🧹 5. Quy Trình Chuẩn Mở Rộng & Kiểm Thử Regex Lọc Văn Bản (Text Sanitization Workflow)

Khi người dùng gửi đoạn tin nhắn trích xuất lỗi (chưa lọc hết hoa hồng %, ngày/tháng hợp đồng, hoặc tag thương hiệu), AI Agent **BẮT BUỘC** tuân thủ quy trình 5 bước sau:

1. **Phân tích Mẫu Tin & Các Biến Thể (Pattern Analysis)**:
   - Nhận diện cụ thể đoạn hoa hồng (`🌷30%`, `40%-12m`, `40%_12th`, `hd 30/7/2027`), ghi chú ngoặc đơn (`( ctv dẫn)`, `( Chủ dẫn)`), mốc tiền mặt, thời hạn, tiền tố đứng trước cúp/mã `[🏆🎖️🥇⭐📍]` hoặc tag thương hiệu chưa được lọc.
   - Nhận diện chuỗi đa mốc (`COMM_CHAIN`), trường hợp đứng trên 1 dòng cách nhau bằng khoảng trắng, hoặc đứng ở 2 dòng có thụt lề.

2. **Cập nhật Cấu hình Tập trung & Đồng bộ (`filter-rules.js`, `app.js`, `content-text.js`)**:
   - Mở rộng Sub-patterns (`COMM_SEGMENT`, `COMM_CHAIN`, `NOTE_BRACKET`...) tại [config/filter-rules.js](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/Achive/zalo_quick_action/config/filter-rules.js), [config/app.js](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/Achive/zalo_quick_action/config/app.js), và [content/content-text.js](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/Achive/zalo_quick_action/content/content-text.js).
   - **Bắt buộc dùng cờ `gui` / `iu`** (Unicode-aware để bảo vệ emoji) và **dùng `[ \t]*`** thay cho `\s*` để bảo toàn tuyệt đối dấu xuống dòng `\n`.

3. **Test Đơn Luồng & ĐỌC LẠI KẾT QUẢ THỰC TẾ (Isolated Verification)**:
   - Chạy hàm `removeSelectiveMetadata(rawInput)` và `clean(rawInput)` đối với chính mẫu tin nhắn mới (và các biến thể 1 dòng / 2 dòng).
   - **Đọc lại từng dòng kết quả thực tế**: Kiểm tra mắt và log xem còn sót cụm hoa hồng nào không (VD: `🌷40%_12th ( ctv dẫn) Mã: 🏆`), tag thương hiệu còn không, có bị xóa nhầm dòng giá phòng không.
   - **Nếu còn sót**: Tinh chỉnh Regex ngay cho đến khi đầu ra sạch 100%.

4. **Bổ sung Mock Case & Chạy Regression Test Suite (`tests/run-tests.js`)**:
   - Chỉ khi test đơn luồng đã lọc sạch 100%, mới thêm test case mới vào [tests/mock-cases.js](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/Achive/zalo_quick_action/tests/mock-cases.js).
   - Chạy lệnh `node tests/run-tests.js` trên terminal để kiểm thử tự động toàn bộ test suite.
   - **BẮT BUỘC 100% test cases (Cũ + Mới) phải PASS**. Nếu có case FAIL, debug ngay lập tức tại Bước 2.

5. **Báo cáo & Phản hồi Trực quan**:
   - Trình bày mẫu tin nhắn sau khi lọc sạch 100% (bảng Before vs After).
   - Nhắc người dùng bấm **Reload (⟳)** extension trên `chrome://extensions`.


