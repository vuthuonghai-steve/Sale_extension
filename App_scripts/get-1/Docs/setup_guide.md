# Hướng Dẫn Vận Hành & Thiết Lập Google Apps Script

- **Script ID:** `1tKoeWwypHf-gfrnkx4npdktgJHZw741O-gVh_EIAZlflUrllrXjNELJL`
- **Trình soạn thảo trực tuyến:** [script.google.com](https://script.google.com/d/1tKoeWwypHf-gfrnkx4npdktgJHZw741O-gVh_EIAZlflUrllrXjNELJL/edit)

---

## 1. Cấu Trúc Thư Mục Source Code (src/)

- [`src/appsscript.json`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/App_scripts/get-1/src/appsscript.json): Cấu hình V8 runtime, múi giờ và kích hoạt **Drive API v2** (Advanced Service).
- [`src/Config.js`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/App_scripts/get-1/src/Config.js): Chứa danh sách mapping tên cột cho các sheet (`SHEET_CONFIGS`) và thời gian cache thumbnail (`CACHE_TTL_SECONDS`).
- [`src/Utils.js`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/App_scripts/get-1/src/Utils.js): Trích xuất file ID từ URL Google Drive, lấy thumbnail kèm cache, tạo iframe preview.
- [`src/Adapter.js`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/App_scripts/get-1/src/Adapter.js): Tầng chuẩn hóa dữ liệu từ dòng thô của từng Sheet về **Canonical Model** chung.
- [`src/Code.js`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/App_scripts/get-1/src/Code.js): Multi-Source Aggregator (`getAllObjects`), Web App endpoint (`doGet`), và hàm test console (`testRun`).

---

## 2. Các Lệnh Đồng Bộ Với Clasp

Dự án đã được cấu hình sẵn với Google Clasp:

```bash
# 1. Chế độ Watch (Tự động sync khi bấm Ctrl + S - dùng khi đang dev)
clasp push --watch

# 2. Đẩy toàn bộ thay đổi thủ công lên Google Apps Script
clasp push --force

# 3. Kéo code mới nhất từ Google Apps Script về máy local
clasp pull

# 4. Mở nhanh trình soạn thảo online trên trình duyệt
clasp open
```

---

## 3. Quản Lý Môi Trường DEV (`/dev`) & PROD (`/exec`)

### 3.1. Phân biệt link thực thi
- **Môi trường DEV (`@HEAD`):** Chạy trực tiếp code mới nhất vừa được push.
  - Cấu trúc link: `https://script.google.com/macros/s/<HEAD_DEPLOYMENT_ID>/dev`
- **Môi trường PROD (`/exec`):** Chạy phiên bản code đã đóng gói ổn định cho client / extension.
  - Cấu trúc link: `https://script.google.com/macros/s/<PROD_DEPLOYMENT_ID>/exec`

### 3.2. Quản lý deployments bằng Clasp
```bash
# Xem danh sách các deployment
clasp deployments

# Cập nhật code mới vào một deployment PROD cố định (KHÔNG làm đổi URL /exec)
clasp deploy -i <PROD_DEPLOYMENT_ID> -d "Mô tả bản cập nhật"

# Tạo một deployment mới hoàn toàn
clasp deploy -d "Release v2.0"

# Xóa bớt deployment cũ không dùng
clasp undeploy <DEPLOYMENT_ID>
```

---

## 4. Các Bước Cấu Hình Trên Google Sheet

1. **Khớp tên Sheet và Cột trong [`src/Config.js`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/App_scripts/get-1/src/Config.js):**
   - Đảm bảo các thuộc tính `id`, `name`, `price`, `media` trong `SHEET_CONFIGS` khớp chính xác 100% với tên cột header trên Google Sheet của bạn.
2. **Chạy thử hàm kiểm tra:**
   - Trên trình soạn thảo Apps Script, chọn hàm `testRun` và bấm **Run (Chạy)** để xem log đọc dữ liệu mẫu.
3. **Triển khai Web App (Nếu dùng API):**
   - Chọn nút **Triển khai (Deploy)** $\rightarrow$ **Triển khai mới (New deployment)**.
   - Chọn loại: **Ứng dụng web (Web app)**.
   - Quyền truy cập: Chọn **Bất kỳ ai (Anyone)** hoặc theo tổ chức tuỳ nhu cầu.
