# BĐS Sale Dashboard - Google Apps Script 🏢⚡

Công cụ hỗ trợ bóc tách dữ liệu bảng tính Google Sheet (bao gồm text và liên kết Google Drive ẩn), duyệt thư viện ảnh và cung cấp giao diện Dashboard 2 cột (Cột Text + Cột Ảnh) hỗ trợ copy 1-click trực tiếp vào Clipboard (dán ngay vào Zalo/Facebook).

---

## 📁 Cấu Trúc Thư Mục

```text
App_scripts/
├── .clasp.json              # Cấu hình CLASP CLI để sync code lên Google
├── package.json             # Lệnh chạy preview / push
├── README.md                # Tài liệu hướng dẫn sử dụng & triển khai
├── preview.html             # Bản chạy thử nghiệm cục bộ (Live Preview từ Google Sheet)
└── src/
    ├── appsscript.json      # Manifest quyền hạn OAuth của Google Apps Script
    ├── Code.js              # Backend GAS (đọc Sheet, xử lý Hyperlink, lấy ảnh Drive, Cache)
    └── index.html           # Frontend Web App giao diện 2 cột cho Google HTML Service
```

---

## 🚀 Hướng Dẫn Xem Thử Nghiệm (Preview)

### Cách 1: Xem Preview Trực Tiếp Trên Máy (Không cần cài đặt gì)
1. Trong thư mục `App_scripts/`, nhấp đúp mở file **`preview.html`** trên trình duyệt Chrome/Edge.
2. Trang web sẽ tự động kết nối trực tiếp đến link Google Sheet mẫu và hiển thị danh sách phòng dạng 2 cột:
   - **Cột trái:** Thông tin chi tiết + Nút **"Sao Chép Tin Đăng (Text)"**.
   - **Cột phải:** Thư viện ảnh + Nút **"Copy Ảnh"** (bấm là copy file ảnh vào clipboard, mở Zalo bấm `Ctrl + V` dán liền).
   - Bộ lọc tìm kiếm nhanh theo địa chỉ, khoảng giá, thang máy/bộ.

---

## 🌐 Hướng Dẫn Triển Khai Lên Google Apps Script

Có 2 cách để đưa code lên Google:

### Cách 1: Triển khai trực tiếp qua Web Editor (Nhanh nhất - 2 phút)
1. Mở file Google Sheet của bạn trên trình duyệt.
2. Trên thanh menu Google Sheet, chọn: **Tiện ích mở rộng (Extensions)** ➔ **Apps Script**.
3. Tại giao diện Apps Script:
   - File `Mã.gs` (hoặc `Code.gs`): Xóa nội dung cũ, copy toàn bộ nội dung từ file [`src/Code.js`](src/Code.js) dán vào và bấm **Lưu (Ctrl + S)**.
   - Bấm dấu **`+`** bên cạnh mục Tệp ➔ Chọn **HTML** ➔ Đặt tên là `index` ➔ Dán toàn bộ nội dung file [`src/index.html`](src/index.html) vào và bấm **Lưu**.
4. **Trải nghiệm ngay trong Sheet:**
   - Quay lại Google Sheet và F5 tải lại trang.
   - Thanh công cụ sẽ xuất hiện Menu **`🏠 BĐS Dashboard`** ➔ Chọn **"📊 Mở Dashboard (Cửa sổ lớn)"** hoặc **"📑 Mở Dashboard (Sidebar)"**.
5. **Triển khai thành Web App độc lập:**
   - Ở góc phải trên của Apps Script Editor, bấm **Triển khai (Deploy)** ➔ **Tùy chọn triển khai mới (New deployment)**.
   - Chọn loại: **Ứng dụng web (Web app)**.
   - Quyền truy cập: **Bất kỳ ai (Anyone)** hoặc **Người trong tổ chức**.
   - Bấm **Triển khai (Deploy)** ➔ Bạn sẽ nhận được 1 đường link Web App độc lập để gửi cho nhân viên/sale truy cập từ bất kỳ đâu.

---

### Cách 2: Triển khai chuyên nghiệp bằng VS Code + CLASP CLI
1. Đăng nhập tài khoản Google:
   ```bash
   npx @google/clasp login
   ```
2. Tạo script mới hoặc clone script ID:
   ```bash
   # Nếu tạo mới:
   npx @google/clasp create --title "BDS Sale Dashboard" --type standalone --rootDir ./src
   
   # Đẩy code lên Google:
   npm run push
   ```
