# Submodule Decomposition (Level 1/2 White Box Zoom-in): message-extraction

**Feature Name:** `message-extraction`  
**Target Path:** `Docs/Specs/message-extraction/submodule-decomposition.md`  
**Status:** `DECOMPOSED`  

---

## 1. White Box Zoom-in Rationale & Selection

> [!IMPORTANT]
> **Decomposition Focus Node**: Nút `ExtractionCore` (Extraction & Selection Controller) từ sơ đồ Level 0 được chọn làm đối tượng Zoom-in White Box Level 1/2. Nút này ôm trọn logic nghiệp vụ trích xuất 25 tin nhắn, lắng nghe bôi đen, lọc từ khóa riêng ("hoa hồng"), tra cứu DB và điều hướng Alert UI.

---

## 2. Level 1/2 Internal Component Decomposition

Nút `ExtractionCore` được phân rã thành 7 sub-component chuyên biệt tuân thủ Nguyên tắc Đơn trách nhiệm (Single Responsibility Principle):

```txt
ExtractionCore (White Box Scope)
├── 1. RingBufferManager (Extracts & maintains 25 recent chat messages)
├── 2. DOMSelectionListener (Detects mouseup / selection events on Zalo chat)
├── 3. MessageMatcher (Maps selected DOM fragment to exact MessageEntity in Ring Buffer)
├── 4. DeduplicationSearchEngine (Queries SHA-256 hash against Dexie IndexedDB)
├── 5. PatternFilterSanitizer (Strips custom keywords e.g. "hoa hồng", extra whitespace)
├── 6. ClipboardService (Writes sanitized string to navigator.clipboard with fallback)
└── 7. CenterAlertController (Renders Shadow DOM floating alert modal in center screen)
```

---

## 3. Parent-Child Boundary Consistency Verification

| Level 0 Boundary Interface | Level 1/2 Internal Entry/Exit Component | Data / Payload Preserved | Consistency Status |
|---|---|---|---|
| `IN_DOM_SELECTION` | `DOMSelectionListener` | `SelectionEvent` + Raw DOM Text | 100% Preserved |
| `IO_INDEXEDDB_LOOKUP` | `DeduplicationSearchEngine` | `MessageHash` / `Result<MessageEntity, StorageError>` | 100% Preserved |
| `OUT_CLIPBOARD_WRITE` | `ClipboardService` | `SanitizedString` | 100% Preserved |
| `OUT_ALERT_RENDER` | `CenterAlertController` | `AlertRenderState` (Duplicate/Success) | 100% Preserved |

> [!TIP]
> Zero Physical Horizontal Slicing: Việc phân rã hoàn toàn dựa trên Domain Bounded Context. Không cắt nhỏ code theo chiều ngang vật lý gây mất bối cảnh nghiệp vụ.

---

## 4. 3-Branch Execution Logic Workflow

Mọi luồng xử lý bên trong Nút Zoom-in tuân thủ nghiêm ngặt 3 nhánh thực thi:

Sơ đồ chi tiết cách ly: [submodule-l1.md](file:///Docs/Specs/message-extraction/diagrams/submodule-l1.md) (Raw Mermaid: [flowchart.mmd](file:///Docs/Specs/message-extraction/diagrams/flowchart.mmd))

### A. Nhánh 1: Happy Path (Tin nhắn mới -> Sanitize -> Copy -> Save DB -> Success Toast)
1. User thả chuột bôi đen văn bản trên tin nhắn.
2. `MessageMatcher` khớp văn bản với 1 trong 25 tin nhắn trong `RingBufferManager`.
3. `DeduplicationSearchEngine` kiểm tra Hash trong IndexedDB -> Trả về `NOT_FOUND`.
4. `PatternFilterSanitizer` lọc bỏ từ khóa riêng `"hoa hồng"` -> Trả về `cleanContent`.
5. `ClipboardService` sao chép `cleanContent` vào Clipboard thành công.
6. Lưu `MessageEntity` vào IndexedDB và thông báo Toast góc màn hình.

### B. Nhánh 2: Clarification / Duplicate Decision Path (Tin nhắn trùng -> Abort Copy -> Center Alert)
1. `DeduplicationSearchEngine` kiểm tra Hash trong IndexedDB -> Trả về `FOUND` (Đã tồn tại).
2. Hệ thống **HỦY NGAY THAO TÁC COPY** (Zero mutation to Clipboard).
3. `CenterAlertController` kích hoạt Center Alert Floating Modal giữa màn hình với màu cảnh báo đỏ/cam.
4. Modal mở trong Shadow DOM và tự động hủy sau **2500ms**.

### C. Nhánh 3: Exception / Fallback Path (Lỗi Storage DB / Clipboard Blocked)
1. Nếu IndexedDB ném ngoại lệ (`QuotaExceededError` hoặc DB lock): Fallback qua `InMemoryLRUCache` để tiếp tục duy trì dịch vụ.
2. Nếu Clipboard Write bị từ chối permission: Fallback qua `document.execCommand('copy')` với textarea ẩn.

---

## 5. End-of-Step Validation Gate (Sub-step 5.2)

| Criteria | Required Threshold | Result | Score | Status |
|---|---|---|---|---|
| Single Node Zoom-in | Zoomed into exactly 1 Level 0 node | 1 Node Zoomed | 1.00 | PASS |
| Parent-Child Boundary Preservation | 100% boundaries preserved | 100% Preserved | 1.00 | PASS |
| Zero Horizontal Physical Slicing | Bounded context hierarchy enforced | Enforced | 1.00 | PASS |

**Sub-step 5.2 Score:** 1.00 / 1.00 (`PASS`)
