# 📐 Framework: 6 Trục Đánh Đổi Đa Chiều (Multi-Dimensional Trade-off Matrix)

> **Vị trí trong hệ thống:** Thuộc nhóm `Docs/Trade-off/frameworks/`. Được nạp on-demand khi so sánh từ 2 phương án kỹ thuật trở lên.

---

## 1. Nguyên Lý Đánh Đổi Tuyệt Đối (No Free Lunch)

Trong kỹ thuật phần mềm, mọi lựa chọn đều đánh đổi giữa các yếu tố cạnh tranh. Một giải pháp "tối ưu" không phải là giải pháp tốt nhất ở mọi mặt, mà là giải pháp **chấp nhận những điểm yếu (pains) có thể kiểm soát được để đạt được những giá trị (gains) quan trọng nhất** với bài toán hiện tại.

```mermaid
graph TD
    Choice["Quyết định Thiết kế"]
    Choice --> D1["1. Performance & Latency"]
    Choice --> D2["2. Safety & Resource Leak"]
    Choice --> D3["3. Simplicity & Cognitive Load"]
    Choice --> D4["4. Modularity & Clean Layering"]
    Choice --> D5["5. Isolated Testability"]
    Choice --> D6["6. Failure Blast Radius"]
```

---

## 2. Chi Tiết 6 Trục Đánh Đổi Cốt Lõi

### Trục 1: Hiệu Năng & Độ Trễ (Performance & Latency)
- **Câu hỏi cốt lõi**: Phương án này tốn bao nhiêu chu kỳ CPU, bao nhiêu MB RAM, và độ trễ trên luồng xử lý chính là bao nhiêu ms?
- **Ràng buộc Windows Native**:
  - Luồng STA Windows Message Loop yêu cầu phản hồi $< 16\text{ms}$ để tránh hiện tượng đơ chuột/giao diện.
  - Hạn chế cấp phát liên tục trên Large Object Heap (LOH $> 85,000\text{ bytes}$) gây áp lực lên .NET Garbage Collector Gen 2.

### Trục 2: Độ Tin Cậy & An Toàn Bộ Nhớ (Safety & Resource Integrity)
- **Câu hỏi cốt lõi**: Khả năng xảy ra rò rỉ bộ nhớ (Memory Leak), tranh chấp tài nguyên (Resource Contention), hoặc treo máy (Deadlock) là bao nhiêu?
- **Ràng buộc Windows Native**:
  - Mọi con trỏ unmanaged (`IntPtr`) từ `GlobalAlloc`, `GlobalLock` phải được bảo vệ 100% bằng `try...finally` kèm `GlobalFree`.
  - Phải có cơ chế giải phóng phòng ngừa khi tiến trình bị tắt đột ngột (`IDisposable`).

### Trục 3: Độ Phức Tạp Nhận Thức (Simplicity & Cognitive Load)
- **Câu hỏi cốt lõi**: Một lập trình viên mới mất bao lâu để đọc hiểu và sửa đoạn code này một cách an toàn?
- **Nguyên tắc vàng**: Ưu tiên giải pháp đơn giản, rõ ràng, ít ma thuật (zero black-magic). Tránh "Over-Engineering" (thiết kế thừa mô hình khi bài toán chưa cần).

### Trục 4: Tính Mô-đun & Ranh Giới Kiến Trúc (Modularity & Clean Layering)
- **Câu hỏi cốt lõi**: Khi sửa hoặc thêm một tính năng mới, có cần phải chạm vào các file/layer khác không (Open/Closed Principle)?
- **Ràng buộc dự án**:
  - `3_Modules/` không được biết gì về Windows OS, UI hay P/Invoke.
  - `0_Contracts/` là bất biến và độc lập tuyệt đối.

### Trục 5: Khả Năng Kiểm Thử Cô Lập (Isolated Testability)
- **Câu hỏi cốt lõi**: Có thể viết Unit Test tự động cho logic này trên CI/CD mà không cần chạy trên máy Windows thật hay mở GUI không?
- **Tiêu chuẩn nghiệm thu**: Logic nghiệp vụ phải test được 100% qua `dotnet test` bằng Plain C# Objects.

### Trục 6: Bán Kính Ảnh Hưởng Khi Lỗi (Blast Radius)
- **Câu hỏi cốt lõi**: Nếu dòng code này ném Exception không mong muốn, hậu quả tối đa là gì? (Chỉ bỏ qua 1 từ ngữ, hay sập app, hay làm hỏng chức năng Copy/Paste của toàn bộ hệ điều hành?)

---

## 3. Mẫu Bảng Đánh Đổi Chuẩn Hóa

Mọi phân tích kỹ thuật phải tổng kết bằng bảng ma trận sau:

| Trục Đánh Đổi | Phương Án A (Ví dụ: Pure C# Safe) | Phương Án B (Ví dụ: Win32 P/Invoke Unsafe) | Lựa Chọn & Lý Do |
| :--- | :--- | :--- | :---: |
| **1. Hiệu Năng & RAM** | 🟡 Trung bình (tốn Garbage Collector) | 🟢 Cực nhanh, zero heap allocation | Tuỳ thuộc tần suất gọi |
| **2. An Toàn Bộ Nhớ** | 🟢 An toàn tuyệt đối (CLR quản lý) | 🔴 Nguy cơ leak nếu thiếu `GlobalFree` | Cần `try...finally` |
| **3. Độ Đơn Giản** | 🟢 Code C# tự nhiên, dễ bảo trì | 🟡 Cần hiểu sâu Win32 P/Invoke | Safe dễ đọc hơn |
| **4. Tính Mô-đun** | 🟢 Đặt thuần túy trong `3_Modules` | 🔴 Phải bọc trong `2_PlatformAdapters` | Tuân thủ 5 tầng |
| **5. Testability** | 🟢 Test cô lập 100% xUnit | 🔴 Cần môi trường Windows OS thật | Safe dễ test hơn |
| **6. Blast Radius** | 🟢 Cục bộ chuỗi văn bản | 🔴 Có thể lock Clipboard toàn máy | Cần Exponential Backoff |
| **TỔNG KẾT** | ✅ **Phù hợp cho Business Filters** | ✅ **Chỉ dùng cho Clipboard Adapter** | **Quyết định phân tầng** |
