# 🏛️ MẪU TÀI LIỆU: ARCHITECTURE DECISION RECORD (ADR)

> **Hướng dẫn sử dụng:** Áp dụng khi đưa ra quyết định kiến trúc quan trọng (Type 1 Decision) để lưu vết lịch sử lý do vì sao hệ thống được thiết kế như vậy.

---

# ADR-[Số hiệu]: [Tiêu Đề Quyết Định Kiến Trúc]

- **Trạng thái:** `[PROPOSED | ACCEPTED | REJECTED | DEPRECATED]`
- **Ngày lập:** `YYYY-MM-DD`
- **Người đề xuất:** `[AI Agent / Human]`
- **Phân loại:** `Type 1: One-Way Door Decision`
- **Tầng ảnh hưởng:** `[0_Contracts | 1_Engine | 2_PlatformAdapters | 3_Modules | 4_Presentation]`

---

## 1. Bối Cảnh & Vấn Đề (Context & Problem Statement)
- *Mô tả ngắn gọn bối cảnh kỹ thuật, bài toán cần giải quyết, và lý do vì sao hiện trạng cũ không còn đáp ứng được.*

---

## 2. Các Ràng Buộc Kỹ Thuật (Constraints)
- **Ràng buộc 1:** *[Ví dụ: Ràng buộc bộ nhớ unmanaged của Windows OS]*
- **Ràng buộc 2:** *[Ví dụ: Ràng buộc Clean Architecture không cho phép Modules phụ thuộc OS]*
- **Ràng buộc 3:** *[Ví dụ: Thời gian phản hồi sự kiện Clipboard < 16ms]*

---

## 3. Các Phương Án Đã Cân Nhắc (Considered Options)

### Phương Án 1: `[Tên Option 1]`
- *Mô tả tóm tắt cơ chế.*
- **Ưu điểm:** *...*
- **Nhược điểm:** *...*

### Phương Án 2: `[Tên Option 2]` *(Được chọn)*
- *Mô tả tóm tắt cơ chế.*
- **Ưu điểm:** *...*
- **Nhược điểm:** *...*

---

## 4. Quyết Định Đã Chốt (Decision Outcome)

> **Quyết định:** Chọn **Phương Án 2: `[Tên Option]`**.

### Lý Do Chính:
1. Đáp ứng toàn diện các ràng buộc cứng của Windows OS.
2. Đảm bảo tính khả thi trong việc viết Unit Test cô lập.
3. Giảm thiểu nguy cơ rò rỉ bộ nhớ unmanaged trong môi trường chạy ngầm dài ngày.

---

## 5. Các Đánh Đổi Được Chấp Nhận (Trade-offs Accepted)

| Điểm Mạnh Đạt Được (Gains) | Điểm Yếu Chấp Nhận (Pains) | Biện Pháp Kiểm Soát (Mitigations) |
| :--- | :--- | :--- |
| **Gain 1:** *Tối đa tốc độ I/O* | **Pain 1:** *Code phức tạp hơn* | Viết tài liệu hướng dẫn và chú thích rõ trong Adapter |
| **Gain 2:** *Không rò rỉ RAM* | **Pain 2:** *Tốn thêm vài phép kiểm tra con trỏ* | Bọc `try...finally` chặt chẽ |

---

## 6. Kế Hoạch Kiểm Chứng & Nghiệm Thu (Verification Plan)
- [ ] Chạy kiểm thử tự động: `dotnet test`
- [ ] Kiểm tra Memory Leak: Theo dõi RAM tiến trình sau 1,000 lần copy liên tục.
- [ ] Smoke test trên môi trường Windows thật.
