# Báo Cáo Khả Năng Bóc Tách Tin Nhắn Tức Thì Từ DOM Trình Duyệt (Zalo Web / Messenger)

Tài liệu này giải thích chi tiết về cơ chế hoạt động tầng dưới (under-the-hood) của trình duyệt, khả năng đọc dữ liệu tức thì (Realtime Extraction) của Chrome Extension và quy trình chuyển đổi văn bản tin nhắn thô thành dữ liệu có cấu trúc (Structured Data).

---

## 1. Trả Lời Trực Tiếp Vấn Đề

> **Câu hỏi 1:** Khi mở/nhìn thấy một đoạn tin nhắn, Extension có ngay lập tức đọc được tin nhắn đó không?
> 
> 👉 **CÓ, HOÀN TOÀN NGAY LẬP TỨC (< 10-50ms).** 
> Ngay thời điểm tin nhắn xuất hiện trên màn hình (được render vào DOM), Extension nhận biết và trích xuất được ngay mà không cần người dùng thực hiện thao tác thủ công (như copy/paste).

> **Câu hỏi 2:** Nếu đọc được, Extension có thể chuyển thông tin đọc được thành Data (dữ liệu có cấu trúc) không?
> 
> 👉 **CÓ.** Dữ liệu thô (unstructured text) hiển thị trên màn hình sẽ được bóc tách và chuẩn hóa thành đối tượng dữ liệu (JSON object) chứa các thuộc tính cụ thể như: *Giá tiền, Địa chỉ, Số điện thoại, Người gửi, Thời gian,...*

---

## 2. Kiến Trúc Tầng Bên Dưới (Under The Hood)

Để hiểu tại sao Extension làm được điều này, hãy xem xét luồng hoạt động qua 4 tầng kiến trúc:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ TẦNG 1: BROWSER DOM (Giao diện hiển thị Zalo / Messenger)               │
│ - Dữ liệu từ Server gửi về -> Trình duyệt vẽ thành thẻ HTML (div/span)  │
│ - Văn bản tin nhắn nằm trực tiếp trong các Text Node của DOM            │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼ (Truy cập trực tiếp)
┌─────────────────────────────────────────────────────────────────────────┐
│ TẦNG 2: EXTENSION CONTENT SCRIPT (Tầng giám sát & bóc tách)             │
│ - Chạy song song và có toàn quyền đọc cây DOM trang web                 │
│ - Dùng MutationObserver để theo dõi từng milisecond sự thay đổi của DOM │
│ - Đọc nội dung ngay khi node tin nhắn mới được gắn vào màn hình         │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼ (Chuyển chuỗi thô)
┌─────────────────────────────────────────────────────────────────────────┐
│ TẦNG 3: DATA PARSER & STRUCTURING (Tầng xử lý dữ liệu)                  │
│ - Regex / Rule Matcher: Nhận diện SĐT, Giá tiền, Địa chỉ                │
│ - LLM / AI Engine: Phân tích ngữ cảnh đoạn chat nâng cao                │
│ - Kết quả: Biến Text thô -> Object JSON chuẩn hóa                       │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼ (Message Passing)
┌─────────────────────────────────────────────────────────────────────────┐
│ TẦNG 4: SIDE PANEL / APPLICATION STORAGE                                │
│ - Lưu dữ liệu vào Extension State / Database                            │
│ - Hiển thị kết quả trích xuất lên UI Side Panel cho người dùng          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Cơ Chế Đọc Tức Thì (Realtime Extraction Mechanics)

Trình duyệt vận hành dựa trên cây **DOM (Document Object Model)**. Khi một tin nhắn mới đến hoặc khi bạn cuộn trang xem đoạn chat:

1. **Sự kiện DOM Mutation:** Trình duyệt chèn thẻ HTML chứa tin nhắn vào DOM.
2. **Kích hoạt tức thì:** API `MutationObserver` của Content Script lập tức nhận được thông báo sự kiện (event trigger) từ trình duyệt.
3. **Truy xuất trực tiếp:** Content Script thực hiện đọc thuộc tính `innerText` hoặc `textContent` của thẻ HTML đó. 
4. **Thời gian phản hồi:** Tiến trình này diễn ra gần như đồng thời với lúc mắt người nhìn thấy tin nhắn trên màn hình.

---

## 4. Chuyển Đổi Tin Nhắn Thô Thành Data Có Cấu Trúc (Structured Data)

### Ví dụ thực tế từ tin nhắn Zalo Web (Rao thuê phòng):

#### Dữ liệu thô đọc được từ DOM (Unstructured Raw Text):
```text
"Giá 5tr6 - 5tr8. Diện tích: 27m2 - thang máy. 
Địa chỉ: NGÕ 139/8 NGUYỄN NGỌC VŨ. 
Nội thất: Giường tầng, tủ quần áo, điều hòa, nóng lạnh..."
```

#### Quy trình biến đổi thành Data:
Extension sử dụng kết hợp **Bộ lọc Regex** (cho các thông tin cố định) và **AI Model / LLM** (cho ngữ cảnh linh hoạt) để phân tích:

#### Kết quả Data có cấu trúc (JSON Output):
```json
{
  "source": "Zalo Web",
  "group_name": "Phòng Trống Sky Group",
  "timestamp": "2026-07-27T17:31:00Z",
  "extracted_data": {
    "category": "Cho thuê phòng",
    "price_range": {
      "min": 5600000,
      "max": 5800000,
      "currency": "VND"
    },
    "area_sqm": 27,
    "address": {
      "full": "Ngõ 139/8 Nguyễn Ngọc Vũ",
      "street": "Nguyễn Ngọc Vũ",
      "number": "139/8"
    },
    "amenities": [
      "Giường tầng",
      "Tủ quần áo",
      "Điều hòa",
      "Nóng lạnh",
      "Thang máy"
    ],
    "has_elevator": true
  }
}
```

---

## 5. Kết Luận & Đánh Giá Khả Thi

| Tiêu chí | Đánh giá | Ghi chú |
| :--- | :--- | :--- |
| **Khả năng truy cập DOM** | **100% Khả thi** | Chrome Extension có đặc quyền cao trên trang web được cấp phép. |
| **Tốc độ đọc tin nhắn** | **Tức thì (Realtime)** | Đọc ngay trong thời gian thực khi DOM render. |
| **Khả năng chuyển thành Data** | **Chính xác cao** | Có thể dùng Regex cho format chuẩn hoặc AI/LLM cho tin nhắn ngôn ngữ tự nhiên. |
| **Độ ổn định** | **Cao** | Cần thiết kế bộ chọn DOM (selectors) linh hoạt để tránh bị ảnh hưởng khi Zalo/Facebook thay đổi giao diện. |

---

## 6. Giải Quyết Vấn Đề Tin Nhắn Ẩn Phía Trên (Viewport vs DOM)

### Thách thức:
Trình duyệt duy trì các tin nhắn cũ đã cuộn qua ở phía trên cây DOM (dù người dùng không nhìn thấy trực tiếp trên màn hình). Nếu chỉ query đơn thuần, Extension có thể lấy tràn ngập cả dữ liệu cũ.

### Giải pháp kỹ thuật ngăn chặn nhầm lẫn:

1. **Xác định chính xác tin nhắn "Đang hiển thị trên màn hình" (`IntersectionObserver` API):**
   - Trình duyệt cung cấp API `IntersectionObserver` chuyên dụng.
   - API này đo tỷ lệ giao nhau giữa phần tử tin nhắn và khung nhìn màn hình (**Viewport**).
   - **Kết quả:** Extension biết chính xác 100% tin nhắn nào đang **thực sự nằm trong tầm mắt người dùng** tại thời điểm hiện tại.

2. **Cơ chế chống trùng lặp (Message Deduplication):**
   - Mỗi tin nhắn trong Zalo/Messenger đều có thuộc tính định danh duy nhất (ví dụ `data-id`, `data-msg-id` hoặc chuỗi hash kết hợp *Timestamp + Sender + Content*).
   - Extension duy trì một bộ nhớ đệm `Set(message_ids)`.
   - **Quy trình:** Khi cuộn trang hay đọc tin mới:
     - Nếu `ID` tin nhắn **chưa tồn tại** trong Cache -> Đánh dấu là tin mới -> Tiến hành trích xuất & lưu Cache.
     - Nếu `ID` tin nhắn **đã tồn tại** -> Bỏ qua ngay lập tức, không phân tích lại.

3. **Cơ chế Virtualization của Zalo/Facebook:**
   - Để tối ưu bộ nhớ trình duyệt, cả Zalo Web và Facebook đều áp dụng kỹ thuật *Virtual Scrolling*. Khi bạn cuộn tin nhắn xuống quá xa, các tin nhắn ở trên cùng sẽ tự động bị tháo gỡ (unmount) khỏi cây DOM và chỉ được nạp lại khi cuộn ngược lên.

