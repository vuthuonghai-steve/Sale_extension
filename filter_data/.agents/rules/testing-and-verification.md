---
description: "Kích hoạt khi chạy kiểm thử, kiểm tra type compile, hoặc chuẩn bị đóng gói build zip"
activation: "Model Decision"
---

# 🧪 Rule: Testing, Build & Pack Verification

Rule này được tham chiếu khi kiểm tra chất lượng code, chạy biên dịch hoặc đóng gói sản phẩm extension.

## 1. Quy trình Kiểm chứng Bắt buộc (Verification Checklist)
1. **Kiểm tra TypeScript Type:**
   ```bash
   npm run compile
   ```
   *Yêu cầu:* 0 lỗi Type (Pass/Fail Gate).
2. **Kiểm tra Build Dev Server:**
   ```bash
   npm run dev
   ```
   *Yêu cầu:* Không có lỗi HMR hoặc Vite bundle error.
3. **Kiểm tra Đóng gói Sản xuất (Zip Packaging):**
   ```bash
   npm run zip
   ```
   *Output mong muốn:* File `.output/wxt-starter-1.0.0-chrome.zip` được tạo thành công với kích thước siêu nhẹ (~15-20 kB).

## 2. Kiểm thử Tự động hóa DOM Emulation
- Khi viết hàm tự động điền trong `utils/automation.ts`, phải kiểm tra tính tương thích trên các form mẫu (đặc biệt là form hỗ trợ React/Vue nhận diện event `input` & `change`).
- Đảm bảo có viền nháy màu xanh (visual indicator) báo hiệu điền thành công để hỗ trợ người dùng kiểm tra bằng mắt.
