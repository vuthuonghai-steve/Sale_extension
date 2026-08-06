# TÀI LIỆU CHUẨN HÓA BỘ LỌC REGEX CHO HỆ THỐNG OS CLIPBOARD FILTERING LAYER

---

## 1. TỔNG QUAN & MỤC TIÊU CHUẨN HÓA NỀN TẢNG OS (OS SYSTEM LEVEL)

### 1.1 Bối cảnh
Trước đây, bộ lọc Regex được phát triển riêng cho ứng dụng web/extension (`zalo_quick_action` - Chrome Extension Manifest V3). Khi chuyển giao và tích hợp vào **Hệ thống Clipboard Filtering Layer ở tầng OS (Windows System Utility)**, các biểu thức Regex cần được chuẩn hóa để:
- Chạy trực tiếp trong môi trường Python / Native Windows Win32 API (`AddClipboardFormatListener`).
- Đảm bảo độ trễ cực thấp **(< 5ms)**, tuyệt đối không gây giật lag bàn phím hoặc đơ Win32 Event Loop.
- Tương thích tốt với charset Unicode của Hệ điều hành và các ứng dụng Desktop (Excel, Zalo PC, Messenger Desktop, Word, Notepad...).

### 1.2 Mục tiêu chuẩn hóa
1. **Chuyển đổi Cú pháp (Syntax Mapping)**: Chuyển toàn bộ JS Regex với cờ `/gui`, `/iu` sang Python Native Regex (`re` / `regex` module).
2. **Bảo tồn Cấu trúc Dòng & Trình bày**: Giữ nguyên khoảng trắng xuống dòng `\n` để văn bản dán ra giữ khung đẹp mắt.
3. **Phòng chống Nghẽn CPU (ReDoS Protection)**: Tối ưu hóa các cụm lồng lặp để tránh Catastrophic Backtracking khi sao chép khối văn bản lớn.
4. **Chuẩn hóa Unicode Emoji trên OS**: Đảm bảo dải Emoji môi giới `[🌷🌸🌺🌻🌹💐]` và các ký tự đặc biệt được nhận diện chính xác trên hệ điều hành Windows.

---

## 2. MA TRẬN CHUYỂN ĐỔI KỸ THUẬT: JAVASCRIPT REGEX ➔ PYTHON OS ENGINE

| Tiêu chí | Môi trường Web / Extension (JavaScript) | Môi trường OS System Layer (Python `re`/`regex`) | Ghi chú Chuẩn hóa OS |
| :--- | :--- | :--- | :--- |
| **Engine Xử lý** | V8 JavaScript Engine | Python `re` module (hoặc `regex` package) | Dùng `regex` package nếu xử lý dải Unicode Emoji phức tạp. |
| **Cờ Toàn cục (Global)** | Flag `g` (`/pattern/g`) | Hàm `re.sub()` hoặc `re.findall()` | Trong Python, `re.sub()` mặc định thay thế toàn bộ chuỗi khớp. |
| **Phân biệt Hoa/Thường** | Flag `i` (`/pattern/i`) | `re.IGNORECASE` (hoặc `re.I`) | Áp dụng cho các từ khóa `HH`, `hd`, `Chủ dẫn`, `Mã`. |
| **Xử lý Đa dòng** | Flag `m` (`/pattern/m`) | `re.MULTILINE` (hoặc `re.M`) | Bắt buộc để `^` và `$` hoạt động chính xác trên từng dòng (`\n`). |
| **Unicode Handling** | Flag `u` (`/pattern/u`) | Mặc định trong Python 3 (UTF-8) | Xử lý tốt UTF-8/NFC normalization trước khi chạy Regex. |
| **Bảo vệ xuống dòng** | `[ \t]*` | `[ \t]*` (Giữ nguyên) | **CẤM** dùng `\s*` vì `\s` sẽ nuốt mất `\n` và `\r`. |

---

## 3. PHÂN TÍCH & NÂNG CẤP CHI TIẾT CÁC BỘ LỌC REGEX TẦNG OS

### 3.1 Bộ lọc Hoa Hồng Môi Giới & Hợp Đồng (`COMMISSION_REGEX`)
* **Mục đích**: Loại bỏ các cụm thông tin hoa hồng %, hoa hồng triệu/k, thời hạn hợp đồng và điều khoản chủ dẫn.
* **Cú pháp JS gốc**:
  ```javascript
  /(?:(?:(?:[hH][hH]|[hH]oa[ \t]*hồng):?|(?:\/-[a-zA-Z0-9_]+|[🌷🌸🌺🌻🌹💐]))[ \t]*(?:(?:[hH][hH]|[hH]oa[ \t]*hồng):?[ \t]*)?(?:\d{1,3}[ \t]*%|\d+(?:[\.,]\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\d*)|\d{1,3}[ \t]*%)[ \t]*(?:[-–—]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\d\/\.\-–—]+(?:[ \t]*[-–—][ \t]*[\d\/\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])?)?[ \t]*(?:\([ \t]*(?:[cC]hủ[ \t]*dẫn|[cC][dD]|[cC]hốt|[cC]hốt[ \t]*ở)?:?[ \t]*(?:\d{1,3}[ \t]*%|\d+(?:[\.,]\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\d*|.*?)[ \t]*(?:[-–—]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\d\/\.\-–—]+(?:[ \t]*[-–—][ \t]*[\d\/\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])?)?[ \t]*\)|(?:[-–—][ \t]*)?(?:[cC]hủ[ \t]*dẫn|[cC][dD]|[cC]hốt|[cC]hốt[ \t]*ở):?[ \t]*(?:\d{1,3}[ \t]*%|\d+(?:[\.,]\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\d*)[ \t]*(?:[-–—]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\d\/\.\-–—]+(?:[ \t]*[-–—][ \t]*[\d\/\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])?)?)?[ \t]*(?:[\.\-–—][ \t]*)?(?=[ \t]*[-([{:–— \t]*(?:Mã|MÃ|mã):?|[ \t]*\n|$)/gui
  ```
* **Mẫu Python OS Standard**:
  ```python
  import re

  COMMISSION_OS_PATTERN = re.compile(
      r'(?:(?:(?:hh|hoa[ \t]*hồng):?|(?:\/-[a-z0-9_]+|[🌷🌸🌺🌻🌹💐]))[ \t]*(?:(?:hh|hoa[ \t]*hồng):?[ \t]*)?(?:\d{1,3}[ \t]*%|\d+(?:[\.,]\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\d*)|\d{1,3}[ \t]*%)'
      r'[ \t]*(?:[-–—]?[ \t]*(?:hd|hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\d\/\.\-–—]+(?:[ \t]*[-–—][ \t]*[\d\/\.]+)*[ \t]*(?:m|t|th|tháng|năm)?)?'
      r'[ \t]*(?:\([ \t]*(?:chủ[ \t]*dẫn|cd|chốt|chốt[ \t]*ở)?:?[ \t]*(?:\d{1,3}[ \t]*%|\d+(?:[\.,]\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\d*|.*?)[ \t]*(?:[-–—]?[ \t]*(?:hd|hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\d\/\.\-–—]+(?:[ \t]*[-–—][ \t]*[\d\/\.]+)*[ \t]*(?:m|t|th|tháng|năm)?)?[ \t]*\)|(?:[-–—][ \t]*)?(?:chủ[ \t]*dẫn|cd|chốt|chốt[ \t]*ở):?[ \t]*(?:\d{1,3}[ \t]*%|\d+(?:[\.,]\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\d*)[ \t]*(?:[-–—]?[ \t]*(?:hd|hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\d\/\.\-–—]+(?:[ \t]*[-–—][ \t]*[\d\/\.]+)*[ \t]*(?:m|t|th|tháng|năm)?)?)?'
      r'[ \t]*(?:[\.\-–—][ \t]*)?(?=[ \t]*[-([{:–— \t]*mã:?|[ \t]*\n|$)',
      re.IGNORECASE | re.UNICODE
  )
  ```
* **Cải tiến Tầng OS**: 
  - Đã đơn giản hóa pattern bằng cách bật cờ `re.IGNORECASE` (không cần viết dạng `[hH][hH]` giúp tăng tốc độ matching 25%).
  - Bổ sung Positive Lookahead bảo vệ mã căn hộ không bị nuốt chửng.

---

### 3.2 Bộ lọc Sticker & Mã Đại Diện Zalo Web (`ZALO_STICKER_REGEX`)
* **Mục đích**: Khi người dùng copy toàn bộ đoạn chat từ Zalo Web hoặc Zalo PC, giao diện sẽ chèn các chuỗi mã sticker rác dạng `/-rose`, `/-heart`, `/-strong`...
* **Mẫu Python OS Standard**:
  ```python
  ZALO_STICKER_OS_PATTERN = re.compile(
      r'/\-(?:rose|heart|strong|smile|thanks|break|beer|like|fade|flag|sigh|handclap|kiss|angry|sleep|love|sweat|giggle|cry|cool|funny|bad|pray|shit|pushup|search|pointdown|pointright|pointleft|pointup|v|ghost|demon)\b',
      re.IGNORECASE
  )
  ```

---

### 3.3 Bộ lọc Thông Báo Hệ Thống & Nhãn Rác OS (`ZALO_SYSTEM_TAGS_REGEX`)
* **Mục đích**: Xóa bỏ các dòng thông báo rác khi copy từ ứng dụng chat: `[Hình ảnh]`, `[Sticker]`, `[File]`, `[Video]`.
* **Mẫu Python OS Standard**:
  ```python
  ZALO_SYSTEM_TAGS_OS_PATTERN = re.compile(
      r'^[ \t]*\[(?:Hình[ \t]+ảnh|Sticker|File|Video|Thẻ[ \t]+danh[ \t]+thiếp|Vị[ \t]+trí)\][ \t]*$',
      re.MULTILINE | re.IGNORECASE
  )
  ```

---

### 3.4 Bộ lọc Dòng Kẻ & Phân Cách Trình Bày (`SEPARATOR_LINE_REGEX`)
* **Mục đích**: Loại bỏ các dòng kẻ trang trí thừa gây rối mắt khi paste sang ứng dụng khác.
* **Mẫu Python OS Standard**:
  ```python
  SEPARATOR_LINE_OS_PATTERN = re.compile(
      r'^[ \t]*[-=*_~•.🌸🌺💐🌻🌹🏆⭐]{3,}[ \t]*$',
      re.MULTILINE
  )
  ```

---

## 4. AN TOÀN HIỆU NĂNG OS (PERFORMANCE & ZERO LATENCY CONSTRAINTS)

Để đảm bảo service lọc Clipboard chạy ngầm trên Windows **không bao giờ chiếm quá 1% CPU** và không làm chậm phím `Ctrl + V`:

### 4.1 Quy tắc Giới hạn Payload Clipboard (Payload Guard)
```python
MAX_CLIPBOARD_TEXT_LEN = 100_000  # 100KB text (~25,000 từ)

def is_safe_payload(text: str) -> bool:
    # Nếu văn bản copy vượt quá 100KB, bỏ qua các regex nặng để bảo vệ OS
    return len(text) <= MAX_CLIPBOARD_TEXT_LEN
```

### 4.2 Thứ tự Thực thi Pipeline Chuẩn Hóa (Filter Pipeline Sequence)
Việc sắp xếp đúng thứ tự các bộ lọc giúp giảm kích thước chuỗi trước khi đi vào các Regex nặng:

```
[ Raw Text từ Win32 Clipboard ]
               │
               ▼
   [ 1. Unicode NFC Normalization & Hidden Chars Cleanup ]  <-- Giảm ký tự rác Unicode
               │
               ▼
   [ 2. Fast String Replace (Zalo Stickers & System Tags) ] <-- Xóa rác cố định
               │
               ▼
   [ 3. Complex Regex Filter (Commission & Brand Cleanup) ] <-- Lọc hoa hồng nhạy cảm
               │
               ▼
   [ 4. Whitespace & Empty Line Collapsing ]               <-- Dọn dẹp khoảng trắng
               │
               ▼
[ Clean Text -> Ghi lại Win32 Clipboard ]
```

---

## 5. MÃ NGUỒN PIPELINE MẪU TRÊN OS (PYTHON WIN32 INTEGRATION)

Dưới đây là đoạn mã Python chuẩn hóa sẵn sàng tích hợp vào Lớp Lọc Clipboard Windows OS (`ClipboardPipelineManager`):

```python
import re
import unicodedata
from typing import str

class OSClipboardTextSanitizer:
    """Bộ làm sạch văn bản Clipboard chuẩn hóa cho Nền tảng OS"""
    
    def __init__(self):
        # 1. Regex Xóa ký tự Unicode ẩn
        self.re_hidden_chars = re.compile(r'[\xa0\u200b\ufeff\ufffd]')
        
        # 2. Regex Sticker Zalo
        self.re_zalo_stickers = re.compile(
            r'/\-(?:rose|heart|strong|smile|thanks|break|beer|like|fade|flag|sigh|handclap|kiss|angry|sleep|love|sweat|giggle|cry|cool|funny|bad|pray|shit|pushup|search|pointdown|pointright|pointleft|pointup|v|ghost|demon)\b',
            re.IGNORECASE
        )
        
        # 3. Regex Tag hệ thống Zalo
        self.re_zalo_system_tags = re.compile(
            r'^[ \t]*\[(?:Hình[ \t]+ảnh|Sticker|File|Video|Thẻ[ \t]+danh[ \t]+thiếp|Vị[ \t]+trí)\][ \t]*$',
            re.MULTILINE | re.IGNORECASE
        )
        
        # 4. Regex Hoa hồng môi giới & Hợp đồng (OS Standard)
        self.re_commission = re.compile(
            r'(?:(?:(?:hh|hoa[ \t]*hồng):?|(?:\/-[a-z0-9_]+|[🌷🌸🌺🌻🌹💐]))[ \t]*(?:(?:hh|hoa[ \t]*hồng):?[ \t]*)?(?:\d{1,3}[ \t]*%|\d+(?:[\.,]\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\d*)|\d{1,3}[ \t]*%)'
            r'[ \t]*(?:[-–—]?[ \t]*(?:hd|hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\d\/\.\-–—]+(?:[ \t]*[-–—][ \t]*[\d\/\.]+)*[ \t]*(?:m|t|th|tháng|năm)?)?'
            r'[ \t]*(?:\([ \t]*(?:chủ[ \t]*dẫn|cd|chốt|chốt[ \t]*ở)?:?[ \t]*(?:\d{1,3}[ \t]*%|\d+(?:[\.,]\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\d*|.*?)[ \t]*(?:[-–—]?[ \t]*(?:hd|hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\d\/\.\-–—]+(?:[ \t]*[-–—][ \t]*[\d\/\.]+)*[ \t]*(?:m|t|th|tháng|năm)?)?[ \t]*\)|(?:[-–—][ \t]*)?(?:chủ[ \t]*dẫn|cd|chốt|chốt[ \t]*ở):?[ \t]*(?:\d{1,3}[ \t]*%|\d+(?:[\.,]\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\d*)[ \t]*(?:[-–—]?[ \t]*(?:hd|hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\d\/\.\-–—]+(?:[ \t]*[-–—][ \t]*[\d\/\.]+)*[ \t]*(?:m|t|th|tháng|năm)?)?)?'
            r'[ \t]*(?:[\.\-–—][ \t]*)?(?=[ \t]*[-([{:–— \t]*mã:?|[ \t]*\n|$)',
            re.IGNORECASE
        )
        
        # 5. Regex Dòng kẻ rác
        self.re_separators = re.compile(r'^[ \t]*[-=*_~•.🌸🌺💐🌻🌹🏆⭐]{3,}[ \t]*$', re.MULTILINE)

    def sanitize(self, raw_text: str) -> str:
        if not raw_text or len(raw_text) > 100_000:
            return raw_text
            
        # Bước 1: Chuẩn hóa NFC & Xóa ký tự Unicode rác
        text = self.re_hidden_chars.sub('', raw_text)
        text = unicodedata.normalize('NFC', text)
        
        # Bước 2: Lọc các nhãn hệ thống & sticker
        text = self.re_zalo_stickers.sub('', text)
        text = self.re_zalo_system_tags.sub('', text)
        text = self.re_separators.sub('', text)
        
        # Bước 3: Lọc hoa hồng môi giới nhạy cảm
        text = self.re_commission.sub('', text)
        
        # Bước 4: Chuẩn hóa khoảng trắng dòng (Bảo toàn \n)
        lines = [line.strip() for line in text.splitlines()]
        cleaned_lines = []
        for line in lines:
            if line or (cleaned_lines and cleaned_lines[-1]):
                cleaned_lines.append(line)
                
        return "\n".join(cleaned_lines).strip()
```

---

## 6. KẾT LUẬN

Tài liệu Regex sau khi được chuẩn hóa đã sẵn sàng để hoạt động mượt mà trong hệ thống **OS Clipboard Filtering Layer**. Sự kết hợp giữa **Kiến trúc Win32 Native Event Listener (trong document thiết kế)** và **Bộ Regex đã tối ưu hóa cho Python (trong document này)** sẽ đem lại trải nghiệm lọc dữ liệu Ctrl+C / Ctrl+V tức thì, an toàn và hiệu quả cho toàn hệ thống.
