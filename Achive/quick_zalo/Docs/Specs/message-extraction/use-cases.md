# Use Cases & Requirements Specification: message-extraction

**Feature Name:** `message-extraction`  
**Target Path:** `Docs/Specs/message-extraction/use-cases.md`  
**Status:** `ANALYZED`  

---

## 1. Functional Requirements (FR)

| Mã FR | Tên Module / Function | Mô tả Chi tiết | Tiêu chí Lượng hóa Bắt buộc |
|---|---|---|---|
| **FR-01** | `RingBufferExtractor` | Trích xuất và duy trì danh sách tin nhắn mới nhất trong hội thoại Zalo active | Giới hạn dung lượng đúng **25 tin nhắn**, tự động đẩy bớt tin cũ theo nguyên tắc FIFO |
| **FR-02** | `SelectionEventListener` | Lắng nghe sự kiện bôi đen văn bản trong cửa sổ Zalo Web | Phản hồi trong **< 50ms** từ khi sự kiện `mouseup` kết thúc |
| **FR-03** | `MessageMatcher` | Khớp đoạn bôi đen với tin nhắn gốc trong Ring Buffer 25 tin nhắn | Độ chính xác matching **p99 = 100%**, latency **< 15ms** |
| **FR-04** | `PatternFilterSanitizer` | Lọc bỏ từ khóa riêng (ví dụ: `"hoa hồng"`), khoảng trắng dư thừa | Loại bỏ 100% từ khóa loại trừ được khai báo trong `SanitizeRules` |
| **FR-05** | `DeduplicationSearchEngine` | Tra cứu dấu vân tay (Hash SHA-256) tin nhắn trong Dexie IndexedDB | Thời gian query **p95 < 30ms** trên DB có 10,000 bản ghi |
| **FR-06** | `ClipboardWriter` | Ghi chuỗi văn bản đã sanitize vào System Clipboard | Tỉ lệ thành công **≥ 99.9%** |
| **FR-07** | `CenterAlertOverlay` | Hiển thị cảnh báo tin nhắn trùng lặp ở chính giữa màn hình Viewport | Đặt ở Shadow DOM, `z-index: 999999`, tự động đóng sau **2500ms** |

---

## 2. Non-Functional Requirements (NFR)

1. **NFR-1 (Performance & Latency)**: Tổng thời gian xử lý từ khi thả chuột bôi đen đến khi hoàn tất sao chép/hiển thị Alert phải đạt **p95 < 100ms**.
2. **NFR-2 (Memory Footprint)**: Ring Buffer lưu giữ tối đa 25 tin nhắn, chiếm dụng RAM **< 2MB**.
3. **NFR-3 (Isolation & Non-Intrusiveness)**: Giao diện Alert Modal chạy trong Shadow DOM độc lập, không làm biến đổi CSS hoặc phá vỡ layout Zalo Web.
4. **NFR-4 (Storage Degradation)**: Khi IndexedDB bị quá tải (`QuotaExceededError`), hệ thống tự động chuyển sang In-Memory Set cache mà không làm sập Content Script.
5. **NFR-5 (Test Coverage)**: Unit test coverage cho `MessageMatcher`, `PatternFilterSanitizer`, và `DeduplicationSearchEngine` phải đạt **≥ 95%**.

---

## 3. Detailed Use Cases Breakdown

### UC-01: Basic Flow (Happy Path - Trích xuất & Sao chép tin nhắn chưa tồn tại)
- **Actor**: Người dùng Zalo Web (Sales/CSKH).
- **Pre-condition**: Extension đang bật (`isModuleEnabled('message-extraction') = true`), người dùng đang ở cửa sổ chat Zalo Web.
- **Main Flow**:
  1. Hệ thống `RingBufferExtractor` trích xuất 25 tin nhắn gần nhất và cập nhật vào bộ nhớ đệm.
  2. Người dùng dùng chuột bôi đen một đoạn text thuộc tin nhắn trên giao diện Zalo Web.
  3. `SelectionEventListener` phát hiện sự kiện thả chuột (`mouseup`) và thu thập vùng bôi đen.
  4. `MessageMatcher` tìm thấy tin nhắn tương ứng trong Ring Buffer 25 tin nhắn.
  5. `DeduplicationSearchEngine` kiểm tra Hash của tin nhắn trong IndexedDB `DexieMessageRepository` và kết luận **CHƯA TỒN TẠI**.
  6. `PatternFilterSanitizer` tiến hành lọc loại bỏ từ khóa riêng (ví dụ: xóa chuỗi `"hoa hồng"`).
  7. `ClipboardWriter` sao chép văn bản đã lọc vào Clipboard.
  8. Hệ thống lưu tin nhắn mới vào IndexedDB.
  9. Hiển thị Toast thông báo ngắn ở góc màn hình: `"Đã sao chép tin nhắn sạch vào Clipboard"`.
- **Post-condition**: Tin nhắn mới được lưu trữ trong DB, Clipboard chứa nội dung đã sanitize.

### UC-02: Must-Have Flow (Phát hiện tin nhắn trùng lặp & Hiển thị Center Alert)
- **Actor**: Người dùng Zalo Web.
- **Pre-condition**: Người dùng thực hiện bôi đen tin nhắn đã được lưu trữ trước đó trong Database.
- **Main Flow**:
  1. Người dùng bôi đen đoạn văn bản tin nhắn trên web.
  2. `MessageMatcher` khớp văn bản bôi đen với tin nhắn trong Ring Buffer 25 tin nhắn.
  3. `DeduplicationSearchEngine` thực hiện query Hash trong IndexedDB và trả về kết quả **ĐÃ TỒN TẠI**.
  4. Hệ thống ngay lập tức **HỦY THAO TÁC COPY** vào Clipboard.
  5. `CenterAlertOverlay` kích hoạt hiển thị Floating Modal ở chính giữa màn hình với thông điệp:  
     `"⚠️ TIN NHẮN ĐÃ TỒN TẠI TRONG CƠ SỞ DỮ LIỆU — HỦY THAO TÁC SAO CHÉP"`.
  6. Sau **2500ms**, Alert tự động biến mất.
- **Post-condition**: Clipboard không bị ghi đè dữ liệu cũ, người dùng nhận được cảnh báo trực quan.

### UC-03: Nice-To-Have Flow (Cấu hình danh sách từ khóa loại trừ Custom Rules)
- **Actor**: Quản trị viên / Người dùng.
- **Main Flow**:
  1. Người dùng mở Sidepanel UI của `message-extraction`.
  2. Vào phần "Cấu hình bộ lọc từ khóa" và nhập danh sách các từ/cụm từ cần loại trừ (ví dụ: `"hoa hồng"`, `"chiết khấu"`, `"bí mật"`).
  3. Lưu cấu hình vào `chrome.storage.local`.
  4. Tầng Content Script tự động nhận tín hiệu thay đổi và áp dụng Regex Filter mới ngay lập tức.

### UC-04: Exception Flow (Lỗi IndexedDB Quota Exceeded / Truy vấn hỏng)
- **Actor**: Hệ thống.
- **Trigger**: IndexedDB ném ngoại lệ `QuotaExceededError` hoặc hỏng kết nối.
- **Main Flow**:
  1. `DeduplicationSearchEngine` bắt ngoại lệ `Result.err(StorageError)`.
  2. Log sự kiện lỗi theo chuẩn `Evlog` (`scope: @infra/storage`, `level: ERROR`).
  3. Kích hoạt cơ chế Fallback: Chuyển sang dùng `InMemoryLRUCache` (1000 hashes gần nhất).
  4. Tiếp tục duy trì luồng bôi đen copy cho người dùng mà không gây sập extension.

### UC-05: Exception Flow (Không có quyền Clipboard write / Bị chặn bởi Trình duyệt)
- **Actor**: Browser API Security.
- **Trigger**: `navigator.clipboard.writeText` bị từ chối do thiếu `document.hasFocus()`.
- **Main Flow**:
  1. `ClipboardWriter` phát hiện Promise bị reject.
  2. Thử nghiệm ngay phương thức Fallback `document.execCommand('copy')` thông qua textarea ẩn.
  3. Nếu vẫn thất bại, hiển thị Toast cảnh báo: `"Không thể truy cập Clipboard. Vui lòng cấp quyền cho Extension"`.

---

## 4. Risk Matrix & MoSCoW Prioritization

### A. MoSCoW Prioritization
- **Must-Have**: FR-01 (Ring Buffer 25 tin nhắn), FR-02 (Selection Listener), FR-03 (Message Matcher), FR-04 (Pattern Filtering "hoa hồng"), FR-05 (Deduplication Search), FR-06 (Clipboard Copy), FR-07 (Center Alert Overlay UI).
- **Should-Have**: UC-03 (Custom Keyword Config UI), UC-04 (In-Memory Storage Fallback).
- **Could-Have**: Thống kê số lượng tin nhắn đã ngăn chặn trùng lặp.
- **Won't-Have (lần này)**: Tự động gửi tin nhắn trùng lặp sang hệ thống CRM bên thứ 3.

### B. Risk Matrix

| Mã Rủi ro | Mô tả Rủi ro | Mức độ | Biện pháp Khắc phục / Mitigations |
|---|---|---|---|
| **R-01** | Bôi đen text từng phần (Substring) gây khó khăn cho việc khớp tin nhắn gốc | Cao | Sử dụng DOM Ancestor Traversal (`closest('.chat-item')`) kết hợp String Similarity Matching |
| **R-02** | Xung đột sự kiện `selectionchange` liên tục gây sụt giảm FPS Zalo Web | Trung bình | Đưa hàm xử lý vào Debounce / Throttle 150ms sau khi sự kiện `mouseup` kết thúc |
| **R-03** | IndexedDB bị khóa hoặc quá tải bộ nhớ trình duyệt | Thấp | Bọc toàn bộ hàm DB trong `Result<T, E>` và tự động chuyển sang In-Memory Cache |

---

## 5. BDD Gherkin Acceptance Test Scenarios

```gherkin
Feature: Message Extraction Quick Copy and Deduplication Flow

  Scenario: User selects text from a new message and copies successfully with clean text
    Given user is on Zalo Web active chat window
    And message extraction module is ENABLED
    And 25 recent messages are buffered in memory
    When user highlights text from a message containing "Hoa hồng của bạn là 500k"
    And the message hash DOES NOT exist in IndexedDB
    Then the system filters out the keyword "Hoa hồng"
    And copies "của bạn là 500k" into system clipboard
    And saves the message hash into IndexedDB
    And displays a success toast notification

  Scenario: User selects text from an existing message and sees center alert modal
    Given user highlights text from a message
    And the message hash ALREADY EXISTS in IndexedDB database
    Then the system CANCELS the clipboard copy action
    And displays a center alert floating modal saying "TIN NHẮN ĐÃ TỒN TẠI TRONG CƠ SỞ DỮ LIỆU"
    And the center alert modal automatically dismisses after 2500ms
```

---

## 6. End-of-Step Validation Gate (Step 4)

| Criteria | Required Threshold | Result | Score | Status |
|---|---|---|---|---|
| Quantified FRs & NFRs | 100% metrics quantified | Quantified | 1.00 | PASS |
| Use Case Flow Coverage | 5 UC flows (Happy, Must, Nice, 2 Exceptions) | 5 UCs detailed | 1.00 | PASS |
| Risk & MoSCoW | Risk matrix + MoSCoW defined | Defined | 1.00 | PASS |
| BDD Scenarios | Gherkin syntax compliant | Verified | 1.00 | PASS |

**Step 4 Score:** 1.00 / 1.00 (`PASS`)
