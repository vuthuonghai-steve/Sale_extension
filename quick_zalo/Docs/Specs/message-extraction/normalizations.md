# Feature Requirement Normalization: message-extraction

**Feature Name:** `message-extraction` (Submodule: Quick-Copy & Duplicate Detection)  
**Target Path:** `Docs/Specs/message-extraction/normalizations.md`  
**Status:** `NORMALIZED`  

---

## 1. Raw User Request (<user_skill_request>)

<user_skill_request>
@[/home/stveve/Documents/workspace/Sales/extension/quick_zalo/src/features/message-extraction] giúp mình triển khai xây dựng luồng thiết kế cho tính năng @[/home/stveve/Documents/workspace/Sales/extension/quick_zalo/src/features/message-extraction] hay thực tế là cơ chế trích xuất cùng UI. 
mình muốn xây dựng submodule mới dựa trên những module hiện tại. 
module này đảm nhiệm tính năng: 
1. trích xuất và lưu trữ 25 tin nhắn gần nhất. 
2. lắng nghe sự kiện bôi đen text trên web để xác định chính xác tin nhắn (tin nhắn đã được trích xuất) --> ngay lập tức được copy với điều kiện xóa những ký tự riêng (ví dụ: "hoa hồng" text không cần copy). 
3. thực hiện search xem trong database đã tồn tại chưa. nếu tồn tại thì bỏ không copy và alert giữa khung hình thông báo. 
## yêu cầu 
đây là bước cần được xây dựng để thiết kế, xác định các use case, flow, state, các chức năng đảm bảo cho tính năng chính hoạt động, xác định ngoại lệ... 
xuất tài liệu phân tích.
</user_skill_request>

---

## 2. Information Categorization & Technical Normalization

### A. Categorized User Requirements
1. **UR-01 (Buffer Extraction & Storage)**: Hệ thống tự động trích xuất và duy trì Ring Buffer lưu giữ **đúng 25 tin nhắn mới nhất** từ DOM cửa sổ chat Zalo Web đang active vào bộ nhớ đệm / IndexedDB.
2. **UR-02 (Text Selection Listener & Matcher)**: Content Script lắng nghe sự kiện bôi đen văn bản (`selectionchange` / `mouseup`). Xác định vị trí DOM Element chứa văn bản bôi đen và khớp với tin nhắn tương ứng trong danh sách 25 tin nhắn đã trích xuất.
3. **UR-03 (Pattern Filtering & Sanitize Copy)**: Tự động lọc loại bỏ các cụm từ riêng / từ khóa loại trừ (ví dụ: chuỗi `"hoa hồng"`, khoảng trắng thừa, ký tự điều khiển) khỏi nội dung tin nhắn trước khi thực hiện hành động sao chép vào Clipboard.
4. **UR-04 (Database Deduplication Search)**: Tìm kiếm đối chiếu dấu vân tay tin nhắn (Hash / Content Match) trong cơ sở dữ liệu IndexedDB (`DexieMessageRepository`).
5. **UR-05 (Duplicate Decision & Center Alert UI)**:
   - Nếu tin nhắn **ĐÃ TỒN TẠI** trong Database: Hủy thao tác copy, ngắt luồng và hiển thị thông báo Floating Alert giữa màn hình Zalo Web (`Alert Toast Modal`).
   - Nếu **CHƯA TỒN TẠI**: Thực hiện lưu tin nhắn mới vào Database, copy nội dung đã lọc sạch vào Clipboard và hiển thị Toast thông báo thành công.

### B. Provided Context Analysis (`quick_zalo` Codebase)
1. **Clean Architecture Boundary**:
   - DOM Observer & Selection Handler nằm ở tầng `src/infra/extraction/` và `entrypoints/content/`.
   - Bounded Context Business Logic nằm tại `src/domain/` & `src/features/message-extraction/`.
   - Storage Adapter nằm tại `src/infra/storage/dexie-message-repository.adapter.ts`.
   - UI Alert Overlay là Shadow DOM React Component gắn trực tiếp trên Zalo Web.
2. **Data Structure**:
   - `MessageEntity` đại diện cho tin nhắn Zalo (`id`, `conversationId`, `sender`, `rawContent`, `cleanContent`, `hash`, `timestamp`).
   - Ring Buffer cấu hình tối đa `CAPACITY = 25`.

---

## 3. End-of-Step Validation Gate (Step 2)

| Criteria | Required Threshold | Result | Score | Status |
|---|---|---|---|---|
| User Input Enclosed in XML | 100% wrapped in `<user_skill_request>` | Enclosed | 1.00 | PASS |
| Category Separation | UR & Context separated | Separated | 1.00 | PASS |
| Quantitative Metric Extraction | 25 messages, center alert, keyword stripping | Quantified | 1.00 | PASS |

**Step 2 Score:** 1.00 / 1.00 (`PASS`)
