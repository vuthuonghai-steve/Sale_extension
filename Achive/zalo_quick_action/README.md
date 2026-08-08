# Zalo Quick Forward & Selection Action Extension 🚀⚡

Tiện ích mở rộng Chrome / Brave / Edge Extension (Manifest V3) chuyên biệt cho **thao tác bán tự động (semi-automation) khi chuyển tiếp tin nhắn Zalo Web và làm sạch có chọn lọc (Selective Text Sanitization) văn bản bôi đen**.

---

## ⚡ Tính năng cốt lõi (Core Features)

1. **Thanh công cụ nổi (Floating Bar)**:
   - Khi bạn bôi đen bất kỳ đoạn tin nhắn nào trên Zalo Web hoặc các website khác, một thanh công cụ nổi Glassmorphic xuất hiện tức thì tại vị trí con trỏ.
   - Nút **🚀 Chia sẻ Zalo**: Tự động chuẩn hóa nội dung, loại bỏ thông tin hoa hồng, bảo toàn mã phòng/mã căn hộ và kích hoạt luồng dán/gửi tin nhắn trên Zalo Web.
   - Nút **📋 Copy**: Sao chép văn bản đã được làm sạch chọn lọc.

2. **Phím tắt Alt + S**:
   - Bôi đen tin nhắn ➔ Nhấn **`Alt + S`** ➔ Kích hoạt chia sẻ/chuyển tiếp siêu tốc mà không cần bấm thêm bất kỳ nút nào.

3. **Bộ lọc thông minh (Selective Text Sanitization)**:
   - Tự động loại bỏ thông tin hoa hồng đa dạng: hoa hồng phần trăm (`🌷30%`, `40%-12m`, `35%-hd 31/8/2027`), hoa hồng tiền mặt (`🌷1tr1 - 6-12m`), hoa hồng đa mốc (`40%- 12th | 30%- 6th`), ghi chú chủ dẫn `(Chủ dẫn 30%)`.
   - **Nhận diện tiền tố trước Cúp/Mã**: Xóa sạch hoa hồng đứng trước mã hoặc cúp (`🌷 40%-12m 🏆 032` ➔ `🏆 032`).
   - **Bảo toàn tuyệt đối dữ liệu quan trọng**: Giữ nguyên 100% dòng giá phòng (`☘ Giá: 6tr2-p601-604`, `5tr`), dạng phòng (`1N1K`, `STUDIO`), địa chỉ và thông tin liên lạc.
   - Xóa bỏ tag thương hiệu nhóm hàng (`🏆TL21House🏆`) và banner trích dẫn cũ của Zalo.

4. **Bộ kiểm thử tự động chống Regression (Regression Test Suite)**:
   - Tích hợp sẵn 15+ Mock test cases thực tế đảm bảo mọi cập nhật Regex mới không làm ảnh hưởng đến các trường hợp cũ.

---

## 🧪 Chạy Kiểm Thử Tự Động (Run Regression Tests)

Để kiểm tra toàn bộ các trường hợp lọc văn bản:

```powershell
# Chạy bộ test suite 15+ test cases từ thư mục extension
node tests/run-tests.js
```

---

## 🛠️ Kiến Trúc & Cấu Trúc Thư Mục (Workspace Structure)

Dự án áp dụng kiến trúc **Modular Flat-Name Pattern** cho Browser Extension Manifest V3:

```text
zalo_quick_action/
├── AGENTS.md                  # Hướng dẫn hành vi & quy tắc chuẩn cho AI Agents
├── tree_work_space.md         # Sơ đồ kiến trúc & phân chia trách nhiệm module
├── manifest.json              # Khai báo cấu hình Extension V3 & Content Scripts
├── README.md                  # Tài liệu hướng dẫn sử dụng & cài đặt
├── config/
│   ├── filter-rules.js        # Quản lý tập trung các Regular Expressions lọc hoa hồng & thương hiệu
│   └── app.js                 # Quản lý cấu hình Shortcuts, Actions & Fallback Constants
├── background/
│   └── background.js          # Service Worker xử lý Context Menu & Phím tắt Hotkey
├── content/
│   ├── content.js             # Entry Point điều phối (Main Orchestrator)
│   ├── content-logger.js      # Hệ thống Scope Logger & Dev Error Alert Modal
│   ├── content-config.js      # Quản lý Settings & Đồng bộ Chrome Storage
│   ├── content-text.js        # Tiền xử lý & làm sạch văn bản bôi đen
│   ├── content-ui.js          # Shadow DOM Overlay, Floating Toolbar & Toast
│   ├── content-zalo-dom.js    # Mô phỏng click & kiểm tra DOM Zalo Web
│   ├── content-zalo-extractor.js # Trích xuất nội dung tin nhắn Zalo từ vùng chọn
│   ├── content-zalo-share.js  # Kích hoạt chia sẻ & inject vào ô tìm kiếm
│   └── content-zalo-adapter.js# Facade Adapter gộp các sub-module
├── tests/
│   ├── mock-cases.js          # Dataset 15+ Mock Test Cases (Cũ + Mới)
│   └── run-tests.js           # Test Runner tự động kiểm tra Regression
├── popup/
│   ├── popup.html             # Giao diện Control Panel cài đặt nhanh
│   ├── popup.css              # Styling giao diện Dark Glassmorphism
│   └── popup.js               # Logic lưu/tải thiết lập trên Popup
└── icons/                     # Bộ Icon tiện ích (16px, 48px, 128px)
```

---

## 🚀 Hướng Dẫn Cài Đặt Vào Trình Duyệt

1. Mở trình duyệt (Chrome / Brave / Edge) và truy cập:
   `chrome://extensions` hoặc `brave://extensions`

2. Bật chế độ **Chế độ dành cho nhà phát triển (Developer mode)** ở góc trên bên phải.

3. Bấm nút **Tải tiện ích đã giải nén (Load unpacked)**.

4. Chọn thư mục tiện ích:
   `.../Sale_extension/Achive/zalo_quick_action`

5. Mở Zalo Web (`https://chat.zalo.me`) để trải nghiệm tính năng bôi đen & phím tắt **`Alt + S`**!
