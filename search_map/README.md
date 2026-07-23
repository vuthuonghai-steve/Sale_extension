# Search Map Extension & Hà Nội Admin Fast Lookup 🗺️⚡

Tiện ích mở rộng Chrome Extension (Manifest V3) siêu nhẹ, hỗ trợ **bôi đen từ khóa trên trang web + phím tắt `Alt + M`** để tra cứu dữ liệu đơn vị hành chính Hà Nội với **tốc độ phản hồi cực nhanh (< 0.01ms)**.

---

## ⚡ Tính năng cốt lõi (Core Feature)

1. **Phím tắt Alt + M**: Bôi đen bất kỳ tên Quận, Huyện, Phường, Xã hoặc Thị trấn nào trên trang web ➔ Bấm `Alt + M` ➔ Thẻ thông tin Glassmorphic Floating Overlay hiển thị tức thì.
2. **Siêu tốc độ & Hiệu năng cao**: Dữ liệu từ file Markdown được chuyển đổi và indexing sẵn thành file **JSON Hash Index (`data/hanoi_admin_data.min.json`)** được nạp trực tiếp vào bộ nhớ RAM của extension. Thời gian tra cứu O(1) chỉ mất **0.002ms**.
3. **Hiển thị đầy đủ thông tin**:
   - **Cấp Phường/Xã/Thị trấn**: Tên đầy đủ, loại đơn vị, Tên Quận/Huyện/Thị xã trực thuộc.
   - **Cấp Quận/Huyện/Thị xã**: Diện tích (km²), Dân số (người), Số lượng đơn vị hành chính con.
   - **Nút thao tác nhanh**: Mở trực tiếp trên Google Maps hoặc Sao chép thông tin.

---

## 🚀 Cấu trúc dự án

```
search_map/
├── manifest.json                  # Cấu hình Manifest V3 + Phím tắt Alt+M (commands)
├── data/
│   └── hanoi_admin_data.min.json  # Dữ liệu 30 Quận/Huyện & 575 Phường/Xã đã index O(1)
├── popup/
│   ├── popup.html                 # Giao diện chính Popup
│   ├── popup.css                  # Style CSS Dark Mode & Glassmorphic
│   └── popup.js                   # Logic giao diện popup & lịch sử
├── content/
│   └── content.js                 # Content script tra cứu siêu tốc & Inject Shadow DOM Overlay (Alt+M)
├── background/
│   └── background.js              # Service Worker xử lý sự kiện ngầm & Menu chuột phải
├── icons/                         # Bộ icon 16px, 48px, 128px, SVG
└── README.md                      # Hướng dẫn sử dụng & Cài đặt
```

---

## 🛠️ Hướng dẫn sử dụng

1. **Cài đặt vào trình duyệt**:
   - Truy cập `chrome://extensions` trên Chrome / Brave / Edge.
   - Bật **Chế độ dành cho nhà phát triển (Developer mode)**.
   - Bấm **Tải tiện ích đã giải nén (Load unpacked)** ➔ chọn thư mục `search_map`.

2. **Thực hiện tra cứu**:
   - Trải nghiệm bôi đen chữ trên trang web (ví dụ: `Cầu Giấy` hoặc `Dịch Vọng Hậu` hoặc `Tây Đằng`).
   - Nhấn tổ hợp phím **`Alt + M`**.
   - Thẻ kết quả sẽ xuất hiện ngay lập tức góc trên bên phải màn hình. Nhấn `Esc` hoặc nút `×` để đóng.
