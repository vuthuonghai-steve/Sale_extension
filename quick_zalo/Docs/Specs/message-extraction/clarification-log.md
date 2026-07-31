# Clarification Log: message-extraction

**Feature Name:** `message-extraction`  
**Target Path:** `Docs/Specs/message-extraction/clarification-log.md`  
**Status:** `DECIDED`  

---

## 1. Questions & Decision Matrix

### Question 1: Cơ chế khớp vị trí bôi đen text với 25 tin nhắn đã trích xuất
- **Option A `[Khuyến nghị]`**: Khớp thông qua vị trí DOM Node (`Element.closest('.chat-item')`) kết hợp với hàm băm Hash SHA-256 / Normalized String Matching để đảm bảo độ chính xác p99 < 15ms.
- **Option B**: Chỉ tìm kiếm substring tương đối trên danh sách 25 tin nhắn mà không kiểm tra DOM Context (Rủi ro: Sai lệch nếu tin nhắn trùng nội dung).
- **Decision**: **Option A `[Khuyến nghị]`** (Áp dụng tự động).

### Question 2: Quy tắc loại bỏ từ khóa riêng (Keyword Stripping Engine)
- **Option A `[Khuyến nghị]`**: Cấu hình danh sách Regex Pattern có thể tùy chỉnh (ví dụ: `/hoa hồng/gi`, `/phụ phí/gi`, khoảng trắng thừa, emojis đặc biệt), trả về chuỗi đã làm sạch (`cleanContent`).
- **Option B**: Cố định cứng xóa duy nhất từ `"hoa hồng"` trong code.
- **Decision**: **Option A `[Khuyến nghị]`** (Áp dụng tự động - Đảm bảo tính linh hoạt mở rộng).

### Question 3: Vị trí và thời lượng hiển thị Center Alert Toast
- **Option A `[Khuyến nghị]`**: Hiển thị Floating Alert Modal ở chính giữa màn hình Viewport Zalo Web (Shadow DOM `z-index: 999999`), tự đóng sau **2500ms** hoặc khi người dùng nhấp đúp/click ngoài.
- **Option B**: Hiển thị Toast góc phải màn hình Zalo Web.
- **Decision**: **Option A `[Khuyến nghị]`** (Đúng theo yêu cầu thiết kế giữa khung hình của người dùng).

### Question 4: Tiêu chuẩn xác định tin nhắn trùng lặp trong IndexedDB (Deduplication Logic)
- **Option A `[Khuyến nghị]`**: Kết hợp `conversationId` + `hash(rawContent)` + `senderId`. Nếu trùng 3 yếu tố này trong DB thì xác định là tồn tại.
- **Option B**: Chỉ so sánh chuỗi `rawContent` (Rủi ro: Nhầm lẫn tin nhắn trùng nội dung ở các hội thoại khác nhau).
- **Decision**: **Option A `[Khuyến nghị]`** (Áp dụng tự động).

---

## 2. End-of-Step Validation Gate (Step 3)

| Criteria | Required Threshold | Result | Score | Status |
|---|---|---|---|---|
| Multiple Choice Format | 3-5 questions with options + default | 4 Questions formatted | 1.00 | PASS |
| Quantified Fallback Rules | p99 latency < 15ms, Toast 2500ms | Quantified | 1.00 | PASS |
| Zero Ambiguous Words | 0 vague adjectives (`nhanh`, `tốt`) | Verified | 1.00 | PASS |

**Step 3 Score:** 1.00 / 1.00 (`PASS`)
