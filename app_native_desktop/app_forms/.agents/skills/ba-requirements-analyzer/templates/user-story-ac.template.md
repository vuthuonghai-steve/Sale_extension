# Biểu Mẫu User Story & Acceptance Criteria Chuẩn Hóa (Skeleton Outline)

**Mã Story**: `[US-XXX]` | **Epic / Feature**: `[Tên Epic]`  
**Traceability Chain**: Phục vụ `[BR-XX]` ➔ `[SR-XX]` ➔ Hiện thực hóa `[FR-XX]` & `[NFR-XX]`  
**Sprint dự kiến**: `[Sprint X]` | **Story Points**: `[SP]` | **Trạng thái**: `[Ready for Dev]`

---

## 1. Nội Dung User Story (Standard Format)

> **Là một (As a)**: `[Vai trò người dùng cụ thể / Persona]`  
> **Tôi muốn (I want to)**: `[Hành động hoặc tính năng tương tác với hệ thống]`  
> **Để mà (So that)**: `[Giá trị thực tế, tối ưu thời gian hoặc lợi ích nghiệp vụ nhận được]`

---

## 2. Tiêu Chí Nghiệm Thu (Acceptance Criteria — Gherkin Format)

### Kịch bản 1: Luồng Thành Công Chính (Happy Path)
```gherkin
Scenario: [Tên kịch bản thành công chính]
  Given [Tiền điều kiện của người dùng và hệ thống]
    And [Dữ liệu đầu vào hoặc trạng thái hợp lệ]
   When [Hành động kích hoạt từ người dùng hoặc hệ thống]
   Then [Kết quả đầu ra mong đợi và cập nhật trạng thái]
    And [Thông báo phản hồi hoặc bản ghi được tạo ra]
```

### Kịch bản 2: Luồng Xử Lý Lỗi & Trường Hợp Biên (Alternative & Edge Cases)
```gherkin
Scenario: [Tên kịch bản ngoại lệ, gián đoạn kết nối hoặc dữ liệu bất thường]
  Given [Tiền điều kiện khi người dùng thực hiện thao tác]
   When [Xảy ra sự cố lỗi hệ thống, timeout hoặc dữ liệu không hợp lệ]
   Then [Hệ thống kích hoạt cơ chế phòng vệ, cô lập lỗi hoặc rollback]
    And [Tuyệt đối không để xảy ra sai lệch trạng thái hoặc duplicate]
    And [Hiển thị thông báo hướng dẫn rõ ràng cho người dùng]
```

---

## 3. Ràng Buộc Kỹ Thuật & Chỉ Số NFR (Technical & Quality Constraints)

Mọi User Story khi chuyển giao cho Developer và Tester phải đính kèm các chỉ số NFR định lượng sau:

- [ ] **Hiệu năng (Performance)**: Thời gian phản hồi API ≤ `[X ms]` ở p95; thời gian render giao diện ≤ `[Y s]`.
- [ ] **Tính nhất quán & Idempotency**: Bắt buộc gắn cơ chế chống trùng lặp (Idempotency Key / Unique Hash) cho mọi thao tác ghi dữ liệu.
- [ ] **Bảo mật (Security)**: Toàn bộ dữ liệu nhạy cảm được mã hóa; xác thực phân quyền chuẩn xác; cấm log dữ liệu nhạy cảm ra console.
- [ ] **Khả năng chịu tải (Concurrency)**: Hệ thống chịu tải tối thiểu `[Z requests/giây]` mà tỷ lệ lỗi < 0.05%.
- [ ] **Khả năng phục hồi (Resilience)**: Cơ chế fallback hoạt động mượt mà khi service phụ trợ gặp sự cố; không làm sập luồng chính.

---

## 4. Yêu Cầu Chuyển Tiếp Tương Ứng (Transition Checklist Cho Story)
- [ ] **Dữ liệu**: Có cần migration hoặc seed dữ liệu khởi tạo không? `[Có / Không - Mã TR: TR-XX]`
- [ ] **Đào tạo & Tài liệu**: Cần cập nhật tài liệu kỹ thuật hoặc hướng dẫn vận hành không? `[Có / Không]`
