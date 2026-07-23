# Zalo Quick Forward & Selection Action Extension 🚀⚡

Tiện ích mở rộng Chrome / Brave Extension (Manifest V3) độc lập, chuyên biệt cho **thao tác bán tự động (semi-automation) khi chuyển tiếp tin nhắn Zalo Web và bôi đen văn bản trên trang web làm việc**.

---

## ⚡ Tính năng cốt lõi (Core Features)

1. **Thanh công cụ nổi (Floating Bar)**:
   - Khi bạn bôi đen bất kỳ đoạn tin nhắn nào (trên Zalo Web hoặc các trang web khác), một thanh công cụ nổi Glassmorphic sẽ xuất hiện tức thì tại vị trí con trỏ.
   - Nút **🚀 Chia sẻ Zalo**: Tự động chuẩn hóa nội dung, lưu vào Clipboard và kích hoạt luồng dán/gửi tin nhắn trên Zalo Web.
   - Nút **📋 Copy**: Sao chép văn bản đã loại bỏ dòng trống và khoảng trắng thừa.

2. **Phím tắt Alt + S**:
   - Bôi đen tin nhắn ➔ Nhấn **`Alt + S`** ➔ Kích hoạt chia sẻ/chuyển tiếp siêu tốc mà không cần bấm thêm bất kỳ nút nào.

3. **Menu Chuột Phải (Context Menu)**:
   - Click chuột phải vào đoạn text đã chọn ➔ Chọn *"🚀 Chuyển tiếp nhanh qua Zalo Web (Alt+S)"*.

4. **Tùy chỉnh linh hoạt (Control Panel Popup)**:
   - Cho phép bật/tắt Thanh công cụ nổi, tính năng tự động copy hoặc thông báo Toast phản hồi.

---

## 🛠️ Cấu trúc Modul Độc lập

Modul này hoàn toàn độc lập với modul tra cứu hành chính `search_map`:

```
zalo_quick_action/
├── manifest.json            # Cấu hình Manifest V3 + Phím tắt Alt+S + Permissions
├── popup/
│   ├── popup.html           # Giao diện điều khiển Control Panel
│   ├── popup.css            # Styles Dark Glassmorphism
│   └── popup.js             # Logic lưu/tải thiết lập Chrome Storage
├── content/
│   └── content.js           # Content Script tự động hóa bôi đen & Zalo Web DOM
├── background/
│   └── background.js        # Service worker xử lý Context Menu & Phím tắt Alt+S
├── icons/                   # Bộ icon hiển thị (16px, 48px, 128px)
└── README.md                # Hướng dẫn sử dụng & Cài đặt
```

---

## 🚀 Hướng dẫn cài đặt vào Brave / Chrome

1. Mở trình duyệt (Brave / Chrome / Edge) và truy cập đường dẫn:
   `chrome://extensions` hoặc `brave://extensions`

2. Bật chế độ **Chế độ dành cho nhà phát triển (Developer mode)** ở góc trên bên phải.

3. Bấm nút **Tải tiện ích đã giải nén (Load unpacked)**.

4. Chọn thư mục modul:
   `/home/stveve/Documents/workspace/Sales/extension/zalo_quick_action`

5. Mở Zalo Web (`https://chat.zalo.me`) hoặc bất kỳ trang web nào để trải nghiệm tính năng bôi đen & phím tắt `Alt + S`!
