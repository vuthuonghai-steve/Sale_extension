# 📋 MẪU TÀI LIỆU: BÓC TÁCH BÀI TOÁN & RÀNG BUỘC KỸ THUẬT (PROBLEM FRAMING)

> **Hướng dẫn sử dụng:** Sao chép mẫu này khi cần phân tích một lỗi, bug phức tạp, hoặc yêu cầu kỹ thuật mới trước khi viết code.

---

# 🎯 Báo Cáo Phân Tích Bài Toán: [Tên Bài Toán / Vấn Đề]

- **Vị trí phát sinh:** `[Đường dẫn file:dòng]` (ví dụ: `1_Backend/Win32/Win32ClipboardAdapter.cs:96-110`)
- **Tầng kiến trúc (Layer):** `[0_Shared | 1_Backend | 2_Frontend]`
- **Mức độ ưu tiên:** `[P0 - Critical | P1 - High | P2 - Medium | P3 - Low]`
- **Phân loại quyết định:** `[Type 1: One-Way Door | Type 2: Two-Way Door]`

---

## 1. Triệu Chứng & Hiện Trạng Mã Nguồn (Root-Cause Triangulation)

### 1.1 Triệu chứng quan sát được:
- *Mô tả hiện tượng lỗi / điểm nghẽn xảy ra khi chạy thực tế hoặc khi test.*

### 1.2 Đoạn mã nguồn liên quan:
```csharp
// Dán đoạn mã nguồn có vấn đề tại đây
```

### 1.3 Nguyên nhân gốc rễ (Root Cause):
- *Giải thích cặn kẽ vì sao mã nguồn hiện tại lại dẫn đến lỗi hoặc vi phạm kiến trúc.*

---

## 2. Hệ Thống Ràng Buộc (Constraints Extraction)

### 2.1 Ràng buộc Cứng (Hard Constraints - Bắt buộc tuân thủ):
- [ ] **Ràng buộc 1 (OS/Vật lý):** *(Ví dụ: Không được block STA Thread quá 16ms)*
- [ ] **Ràng buộc 2 (Kiến trúc):** *(Ví dụ: 1_Backend không được phụ thuộc WinForms UI Controls)*
- [ ] **Ràng buộc 3 (Bộ nhớ):** *(Ví dụ: Phải gọi GlobalFree khi SetClipboardData thất bại)*

### 2.2 Ràng buộc Mềm (Soft Constraints - Ưu tiên tối ưu):
- [ ] **Ưu tiên 1:** Code ngắn gọn, dễ đọc, không over-engineering.
- [ ] **Ưu tiên 2:** Tái sử dụng helper đã có thay vì tạo lớp mới.

---

## 3. Không Gian Phủ Định (Negative Space - CẤM LÀM)

| # | Điều CẤM LÀM (Must Not) | Hậu quả nếu vi phạm (Consequence) |
|---|---|---|
| **1** | *[Điều cấm 1]* | *[Hậu quả 1]* |
| **2** | *[Điều cấm 2]* | *[Hậu quả 2]* |
| **3** | *[Điều cấm 3]* | *[Hậu quả 3]* |

---

## 4. Các Kịch Bản Thất Bại Tiềm Ẩn (Failure Modes / Reverse Probing)

- [ ] **Kịch bản 1 (Input cực đoan):** *Điều gì xảy ra khi chuỗi đầu vào rỗng, null, hoặc quá dài (>1MB)?*
- [ ] **Kịch bản 2 (Xung đột tài nguyên):** *Điều gì xảy ra nếu tiến trình khác đang khóa tài nguyên (Clipboard lock)?*
- [ ] **Kịch bản 3 (Vòng đời / Thoát app):** *Tài nguyên có bị rò rỉ nếu ứng dụng bị tắt đột ngột (Task Manager kill) không?*

---

## 5. Tiêu Chuẩn Nghiệm Thu Nhị Phân (Pass/Fail Acceptance Criteria)

- [ ] **AC-1 (Cơ học):** Chạy `dotnet test` đạt 100% Pass (0 failed).
- [ ] **AC-2 (Biên dịch):** Chạy `dotnet build` đạt 0 warning / 0 error.
- [ ] **AC-3 (Hành vi):** *[Hành vi cụ thể được kiểm chứng trên thực tế].*
