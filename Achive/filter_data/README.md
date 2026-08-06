
---

### 📊 Thống kê hiệu năng thu được:
* **Tổng kích thước Build (`.output/chrome-mv3`):** Chỉ **21.57 kB** *(gần như bằng 0% overhead so với React/Vue)*.
* **Kích thước đóng gói Zip phân phối (`.zip`):** **15.86 kB** (dễ dàng chia sẻ qua Zalo/Drive/Git cho 10-20 người).
* **Thời gian Build/Compile:** **~200 ms** (siêu nhanh nhờ Vite).

---

### 📂 Cấu trúc thư mục được thiết lập:

```text
filter_data/
├── wxt.config.ts               # Cấu hình Manifest V3, permissions & Phím tắt Hotkey
├── package.json                # Các kịch bản dev, build, zip
├── utils/
│   └── automation.ts           # Hàm tiện ích: Điền Form (mô phỏng gõ thật), Auto Click, Cào Data
├── entrypoints/
│   ├── background.ts           # Service worker lắng nghe phím tắt Hotkey & truyền Message
│   ├── content.ts              # Script chạy trên trang web để xử lý điền/cào dữ liệu
│   └── popup/                  # Giao diện Popup điều khiển (Vanilla HTML + CSS + TS)
│       ├── index.html
│       ├── style.css
│       └── main.ts
└── .output/                    # Kết quả sau khi build & nén file .zip
```

---

### ⚡ Các tính năng đã được cài đặt sẵn:

1. **Phím tắt Hotkey toàn hệ thống (Keyboard Shortcuts):**
   * <kbd>Alt+Shift+F</kbd>: Tự động tìm & điền nhanh dữ liệu vào các thẻ input (Email, Phone, Name...) trên trang web hiện tại.
   * <kbd>Alt+Shift+S</kbd>: Cào nhanh thông số trang (Title, URL, số lượng input, danh sách thẻ H1/H2).
2. **Mô phỏng gõ dữ liệu thực tế (`utils/automation.ts`):**
   * Tự động kích hoạt sự kiện `input` và `change` để các trang web viết bằng React/Vue/Angular nhận diện được giá trị vừa điền mà không bị mất dữ liệu.
   * Hiển thị viền màu xanh nháy nhẹ báo hiệu thao tác thành công.
3. **Popup điều khiển trực quan:**
   * Cho phép bấm nút kích hoạt thủ công và xem log/dữ liệu cào được ngay trên popup.

---

### 🛠️ Hướng dẫn lệnh sử dụng:

* **Chạy môi trường phát triển (Dev & Hot Reload):**
  ```bash
  npm run dev
  ```
* **Kiểm tra lỗi TypeScript:**
  ```bash
  npm run compile
  ```
* **Đóng gói ra file `.zip` gửi cho 10-20 máy nội bộ:**
  ```bash
  npm run zip
  ```
  *File zip đầu ra nằm tại:* `.output/wxt-starter-1.0.0-chrome.zip`