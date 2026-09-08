# Cẩm Nang Kiểm Định Chống "Rule Ảo" (Anti-Phantom Gatekeeper Guide)

> **Khái niệm**: **"Rule Ảo" (Phantom Rule / Phantom Gate)** là hiện tượng một script kiểm tra hoặc chốt chặn cơ học báo kết quả thành công (`PASS` / Exit code 0), nhưng trên thực tế nội dung kiểm tra không được thẩm định thực chất, cho phép lỗi logic hoặc sản phẩm kém chất lượng lọt lưới.

---

## 1. Năm Dạng "Rule Ảo" Điển Hình

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Fake Exit Code 0 (Luôn thoát 0 dù có lỗi)                │
├─────────────────────────────────────────────────────────────┤
│ 2. Dummy Regex Keyword Match (Chỉ check từ khóa bề mặt)     │
├─────────────────────────────────────────────────────────────┤
│ 3. Hardcoded Mock Data Bypass (Fake payload qua mặt test)   │
├─────────────────────────────────────────────────────────────┤
│ 4. Empty Catch / Suppressed Errors (Nuốt ngoại lệ im lặng)  │
├─────────────────────────────────────────────────────────────┤
│ 5. Missing Schema Contract (Thiếu hợp đồng kiểm tra nhị phân)│
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Dấu Hiệu Nhận Diện & Cơ Chế Khắc Phục

### Dạng 1: Fake Exit Code 0 (Luôn thoát 0 bất kể lỗi)
- **Hành vi**: Script chạy kiểm tra, phát hiện vi phạm nhưng không gọi `exit 1`, hoặc trong PowerShell kết thúc hàm mà không trả về non-zero exit code.
- **Hậu quả**: CI/CD pipeline hoặc Git hook coi như pass, kéo theo mã nguồn lỗi vào main branch.
- **Cách khắc phục**:
  ```powershell
  # Sai:
  if ($errors.Count -gt 0) { Write-Host "Found errors!" }
  # Đúng:
  if ($errors.Count -gt 0) { Write-Error "Found $($errors.Count) critical errors!"; exit 1 }
  ```

### Dạng 2: Dummy Regex Keyword Match (Chỉ kiểm tra từ khóa hình thức)
- **Hành vi**: Script kiểm tra tài liệu có chứa mục "Non-Functional Requirements" bằng cách match regex `(?i)NFR`. Khi tài liệu chỉ viết đúng dòng `# NFR` và để trống nội dung bên dưới, script vẫn pass.
- **Hậu quả**: AI Agent tạo ra tài liệu hình thức (Boilerplate) không có giá trị kỹ thuật thực tế.
- **Cách khắc phục**:
  - Không chỉ kiểm tra sự hiện diện của header, phải kiểm tra mật độ nội dung (Content Density), kiểm tra sự tồn tại của bảng hoặc số liệu định lượng (SMART metrics).

### Dạng 3: Hardcoded Mock Data Bypass (Dùng mock data cứng)
- **Hành vi**: Unit test hoặc verification script kiểm tra hàm xử lý nhưng lại truyền mock data trả về giá trị cố định thay vì test logic thực sự.
- **Hậu quả**: Hệ thống test pass 100% nhưng khi tích hợp thực tế với API ngoài thì sập hoàn toàn.
- **Cách khắc phục**:
  - Tuân thủ nguyên tắc **Zero Placeholder & Zero Mock Bypass** (Hard Invariant G2).

### Dạng 4: Empty Catch / Suppressed Errors (Nuốt ngoại lệ)
- **Hành vi**: Sử dụng `try { ... } catch { }` hoặc `except Exception: pass` mà không ghi log hay xử lý lỗi.
- **Hậu quả**: Che giấu lỗi sập hệ thống; lỗi ngầm âm thầm phá hủy tính toàn vẹn của dữ liệu.
- **Cách khắc phục**:
  - Mọi exception phải được bắt có chủ đích, log lỗi chi tiết và kích hoạt kịch bản fallback rõ ràng (Defensive Graceful Degradation - G5).

### Dạng 5: Missing Schema Contract (Thiếu hợp đồng kiểm tra nhị phân)
- **Hành vi**: Đánh giá chất lượng dựa trên chuỗi text tự do của LLM ("Tôi thấy tài liệu này rất tốt") thay vì ép trả về cấu trúc nhị phân qua JSON Schema.
- **Hậu quả**: Phản hồi mang tính cảm tính, không máy đọc được, không thể tự động hóa trong pipeline.
- **Cách khắc phục**:
  - 100% đánh giá tự động phải đi kèm JSON Schema (`--json-schema`) ép các trường bắt buộc: `verdict`, `quality_scores`, `violations`.
