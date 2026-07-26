# Step 3: Interactive Clarification Specification & Resolution Log

> **Feature**: `logging-and-testing` (Logging & Testing Architecture)  
> **Workflow**: Feature Spec Designer (`feature-spec-designer`)  
> **Step**: Step 3 - Interactive Clarification  
> **Date**: 2026-07-27  
> **Status**: Resolved & Applied (Auto-Apply Policy)  

---

> [!NOTE]
> Tài liệu này ghi nhận quá trình phân tích các điểm cần làm rõ (Clarification Points) liên quan đến kiến trúc Log Transport, Log Level default, Mocking strategy cho testing, và Log rotation buffer của phân hệ `logging-and-testing`. Dựa trên quy chuẩn kỹ thuật tự động (Auto-apply Policy), các giải pháp `[Khuyến nghị]` đã được chọn và áp dụng trực tiếp vào hồ sơ kỹ thuật tiêu chuẩn.

---

## 1. Phân loại & Tổng hợp Quyết định Kỹ thuật (Clarification Summary Matrix)

Bảng 1 tổng hợp 4 vấn đề kiến trúc/NFR cần làm rõ, các phương án cân nhắc và quyết định áp dụng chính thức.

| ID | Chủ đề Làm rõ | Phương án Khuyến nghị (`[Khuyến nghị]`) | Phương án Thay thế Cân nhắc | Quyết định Áp dụng | Tác động Kiến trúc & Metrics |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CLR-LOG-01** | Log Transport Mechanism | **Option A**: Dual Transport (Console Output + Local IndexedDB Buffer) | Option B: Console Only<br>Option C: Realtime Remote Telemetry | **Option A** (Tự động áp dụng) | Đảm bảo zero external latency, lưu vết 100% log nội bộ để export khi debug sự cố mà không làm chậm Extension. |
| **CLR-LOG-02** | Default Log Level | **Option A**: Default `INFO` Level (Lọc Debug logs trong Prod) | Option B: Default `DEBUG`<br>Option C: Default `WARN` | **Option A** (Tự động áp dụng) | Tối ưu dung lượng lưu trữ storage, giữ log trôi chảy nhưng sẵn sàng kích hoạt Debug Mode qua Extension Flag. |
| **CLR-TST-01** | Test Snapshot & Mock Strategy | **Option A**: MSW (Mock Service Worker) + Vitest Browser Mode | Option B: Live Staging API<br>Option C: Hybrid (Unit MSW + E2E Live) | **Option A** (Tự động áp dụng) | Đảm bảo E2E và Unit Test độc lập 100% với mạng bên ngoài, deterministic test result, execution latency < 30s. |
| **CLR-BUF-01** | Log Rotation & Buffer Retention | **Option A**: FIFO Ring Buffer max **5000 entries** (5MB) + TTL **7 ngày** | Option B: Xóa thủ công<br>Option C: Clear theo Browser Session | **Option A** (Tự động áp dụng) | Tự động dọn dẹp dung lượng Chrome Storage IndexedDB, chống đè nén bộ nhớ và tràn RAM Service Worker. |

---

## 2. Chi tiết 4 Câu hỏi Làm rõ & Lý do Chọn Khuyến nghị

### 2.1. CLR-LOG-01: Cơ chế Log Transport trong Môi trường Production

* **Ngữ cảnh**: Hệ thống cần cơ chế vận chuyển log (Transport) vừa đảm bảo không block UI/Background Thread (Long Task < 16ms), vừa hỗ trợ trích xuất log hỗ trợ phân tích sự cố (RCA < 3s).
* **Các phương án lựa chọn**:
  * **Option A [Khuyến nghị]**: **Dual Transport (Console Output + Local IndexedDB Buffer)**. Log vừa in ra Browser DevTools Console vừa đẩy vào hàng đợi bất đồng bộ để ghi vào Chrome Storage IndexedDB.
  * **Option B**: **Console Only**. Chỉ ghi `console.log` / `console.error`. Khi khởi động lại tab hoặc đóng Extension, log bị xóa mất.
  * **Option C**: **Realtime Remote Telemetry Endpoint**. Gửi HTTP POST request realtime tới Backend Server mỗi khi phát sinh log.
* **Quyết định**: Áp dụng **Option A [Khuyến nghị]**.
* **Lý do kỹ thuật**: Option B không lưu vết được log khi user gặp lỗi ở Production. Option C vi phạm NFR **REQ-PERF-04** (gây ra network latency và có thể block thread nếu mạng chậm). Option A kết hợp tính linh hoạt của Console và khả năng persistence của IndexedDB bất đồng bộ.

---

### 2.2. CLR-LOG-02: Mức độ Chi tiết Log Mặc định (Default Log Level)

* **Ngữ cảnh**: Thiết lập mức độ ghi log mặc định trong môi trường Production để cân bằng giữa thông tin phân tích và hiệu năng storage.
* **Các phương án lựa chọn**:
  * **Option A [Khuyến nghị]**: **Default `INFO` Level**. Ghi lại `INFO`, `WARN`, `ERROR`. Bỏ qua `DEBUG` logs trừ khi người dùng bật "Enable Debug Mode" trong Cấu hình Extension.
  * **Option B**: **Default `DEBUG` Level**. Ghi lại tất cả thông tin chi tiết mọi biến và hàm.
  * **Option C**: **Default `WARN` Level**. Chỉ ghi lại các cảnh báo bất thường và lỗi hệ thống.
* **Quyết định**: Áp dụng **Option A [Khuyến nghị]**.
* **Lý do kỹ thuật**: Option B gây lãng phí dung lượng IndexedDB và sinh ra quá nhiều rác log làm giảm tốc độ phân tích lỗi của LLM (< 3s). Option C bỏ qua các sự kiện chuyển đổi trạng thái quan trọng (`INFO`). Option A cung cấp mức độ cân bằng tối ưu.

---

### 2.3. CLR-TST-01: Chiến lược Snapshot & Mock Data cho Browser & E2E Tests

* **Ngữ cảnh**: Đảm bảo bộ test suite (Vitest + Playwright) chạy nhất quán, lặp lại được (deterministic), không phụ thuộc vào kết nối mạng hay trạng thái server Staging/Production.
* **Các phương án lựa chọn**:
  * **Option A [Khuyến nghị]**: **MSW (Mock Service Worker) + Chrome Extension API Mocks**. Sử dụng MSW để chặn và giả lập toàn bộ Network Requests ở tầng Service Worker; mock `chrome.*` APIs qua adapter test.
  * **Option B**: **Live API Execution**. Cho phép test suite kết nối thật tới môi trường API Staging Server.
  * **Option C**: **Hybrid Strategy**. Unit test mock MSW, E2E test gọi trực tiếp Live API.
* **Quyết định**: Áp dụng **Option A [Khuyến nghị]**.
* **Lý do kỹ thuật**: Live API (Option B & C) thường xuyên flaky do gián đoạn kết nối mạng hoặc data rác trên Staging server, làm hỏng NFR thời gian chạy test suite **REQ-PERF-03** (< 30s). Option A đảm bảo 100% test case chạy cách ly, tốc độ cao và đáng tin cậy.

---

### 2.4. CLR-BUF-01: Chiến lược Tự động Dọn dẹp Log Buffer (Log Rotation Strategy)

* **Ngữ cảnh**: Storage trong Chrome Extension (IndexedDB) bị giới hạn dung lượng và cần cơ chế tự động xóa log rác để tránh tràn bộ nhớ.
* **Các phương án lựa chọn**:
  * **Option A [Khuyến nghị]**: **FIFO Ring Buffer (Max 5000 Entries / 5MB) + Auto TTL 7 ngày**. Khi vượt quá 5000 log entries hoặc 5MB, hệ thống tự động xóa các log cũ nhất. Đồng thời, log có tuổi thọ > 7 ngày tự động bị dọn dẹp.
  * **Option B**: **Manual Cleanup Only**. Chỉ xóa khi người dùng bấm nút "Clear Logs" trong giao diện Settings.
  * **Option C**: **Session-based Retention**. Clear toàn bộ log buffer mỗi khi Service Worker khởi động lại hoặc trình duyệt đóng.
* **Quyết định**: Áp dụng **Option A [Khuyến nghị]**.
* **Lý do kỹ thuật**: Option B dẫn đến rủi ro phình to storage vô hạn nếu người dùng không tự xóa. Option C khiến mất dữ liệu log quan trọng khi người dùng gặp crash Service Worker và trình duyệt tự restart. Option A đảm bảo giới hạn an toàn tuyệt đối cho bộ nhớ.

---

## 3. Bảng Chuẩn hóa Metrics & Quy chuẩn Kỹ thuật Đã Cập nhật

Bảng 2 liệt kê toàn bộ các thông số kỹ thuật tiêu chuẩn cho hệ thống Logging & Testing sau khi hoàn tất Step 3.

| Thành phần Kỹ thuật | Metric / Tham số Tiêu chuẩn | Mô tả Chi tiết |
| :--- | :--- | :--- |
| **Log Transport Target** | Console + IndexedDB Buffer | Dual transport async, không block Main Loop > 16ms. |
| **Production Log Level** | `INFO` (Default) | Ghi nhận `INFO`, `WARN`, `ERROR`. Bật `DEBUG` qua Flag. |
| **Max Log Buffer Size** | **5000 entries** ($\le$ 5MB) | Giới hạn bộ nhớ lưu trữ tối đa trong IndexedDB. |
| **Log Retention TTL** | **7 ngày** (168 giờ) | Tự động purge các entry có timestamp > 7 ngày. |
| **Test Mock Standard** | MSW 100% Mock Rate | Toàn bộ Network API và Chrome API được mock hoàn toàn trong Test. |
| **LLM RCA Speed** | **< 3000ms** | Thời gian đọc log stream định dạng Evlog và trả về Root Cause. |
| **Unit Test Exec Speed**| **< 1000ms / file** | Thời gian chạy 1 file test đơn lẻ trên Vitest Browser Mode. |
| **E2E Suite Exec Speed**| **< 30s total** | Thời gian chạy toàn bộ E2E Test Suite trên Playwright. |

---

## 4. Kiểm tra Cổng Kiểm soát Chất lượng Step 3 (End-of-Step Validation Gate)

> [!TIP]
> **Kết quả Đánh giá Step 3 Validation Gate**: **PASS (100/100)**
> - [x] Đã phân tích và lập danh sách 4 câu hỏi trắc nghiệm với các phương án rõ ràng + 1 phương án `[Khuyến nghị]`.
> - [x] Áp dụng chính xác chính sách tự động (Auto-apply policy) cho các tùy chọn khuyến nghị và ghi vào `[clarification-log.md](file:///home/stveve/Documents/workspace/Sales/extension/quick_zalo/Docs/Specs/logging-and-testing/clarification-log.md)`.
> - [x] Đã chuẩn hóa 100% thông số kiến trúc về Log Transport, Log Level default, Testing Mocking Strategy và Ring Buffer Retention.
> - [x] Liên kết chính xác với hồ sơ chuẩn hóa Step 2 `[normalizations.md](file:///home/stveve/Documents/workspace/Sales/extension/quick_zalo/Docs/Specs/logging-and-testing/normalizations.md)`.
> - [x] Tuân thủ 100% chuẩn `standards.md` (Alert blocks, Markdown tables, không chứa từ khóa mơ hồ `TODO`, `TBD`, `nhanh`, `tốt`, `ổn định`).

---
*Tài liệu thuộc bộ hồ sơ Feature Specification cho phân hệ `logging-and-testing`.*
