# TÀI LIỆU THIẾT KẾ KIẾN TRÚC HỆ THỐNG
## LỚP CHẶN LỌC DỮ LIỆU CLIPBOARD (CLIPBOARD FILTERING LAYER)

---

## 1. TỔNG QUAN & MỤC TIÊU DỰ ÁN (OVERVIEW & OBJECTIVES)

### 1.1 Bối cảnh (Context)
Trong các quy trình nghiệp vụ như Chăm sóc khách hàng (CSKH), Bán hàng (Sales), Nhập liệu (Data Entry), và Thu thập dữ liệu (Data Crawling), người dùng thực hiện thao tác sao chép (Copy - Ctrl+C) và dán (Paste - Ctrl+V) văn bản với tần suất rất cao.

Văn bản từ các nguồn như Website, Chat (Messenger/Zalo), PDF, hoặc Excel thường dính phải các vấn đề:
- **Ký tự rác & Ẩn**: Ký tự xuống dòng không chuẩn (`\r\n`, `\x00`), HTML tags, khoảng trắng Unicode không hiển thị (`\xa0`, `\u200b` zero-width space).
- **Mã theo dõi (Tracking Parameters)**: URL dính thông số `utm_source`, `fbclid`, `gclid`.
- **Dữ liệu thô chưa trích xuất**: Đoạn văn bản dài chứa lẫn lộn địa chỉ, tên, số điện thoại, mã đơn hàng.

### 1.2 Mục tiêu Hệ thống (System Goals)
- **Tự động hóa 100%**: Lọc và dọn dẹp dữ liệu ngay lập tức khi người dùng bấm Ctrl + C.
- **Không độ trễ (Zero Latency Experience)**: Người dùng có thể dán (Ctrl + V) ra dữ liệu sạch ngay lập tức (< 5ms).
- **Hoạt động ngầm an toàn**: Không gây lag/đơ phím hệ thống Windows, không chiếm CPU.
- **Tương thích Windows Clipboard History (`Win + V`)**: Ghi đè trực tiếp dữ liệu sạch lên đầu danh sách nhật ký clipboard.

---

## 2. KHÔNG GIAN GIỚI HẠN (NEGATIVE SPACE & CONSTRAINTS)

| STT | Điều hệ thống KHÔNG ĐƯỢC LÀM (Negative Requirement) | Hậu quả nếu vi phạm (Consequence) |
| :--- | :--- | :--- |
| 1 | **KHÔNG dùng Polling Loop (`time.sleep`)** để check clipboard liên tục | Gây tốn CPU, có độ trễ 100ms-500ms, dán nhầm dữ liệu cũ. |
| 2 | **KHÔNG dùng Synchronous Low-Level Keyboard Hook** cho logic lọc nặng | Gây giật lag bàn phím toàn OS, bị Windows tự unhook. |
| 3 | **KHÔNG làm hỏng dữ liệu Non-Text** (Hình ảnh `CF_DIB`, Danh sách File `CF_HDROP`) | Crash ứng dụng hoặc mất file/ảnh khi người dùng copy file. |
| 4 | **KHÔNG ghi Plaintext Mật khẩu / Token** vào Log/Disk | Rủi ro rò rỉ an ninh thông tin cá nhân (PII Data Leak). |
| 5 | **KHÔNG ném Exception ra OS** khi Clipboard bị ứng dụng khác Lock (`WinError 5`) | Làm gián đoạn luồng làm việc của người dùng. |

---

## 3. KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)

Hệ thống được thiết kế theo mô hình **Producer-Consumer** kết hợp với **Chain of Responsibility (Pipeline Pattern)**.

### 3.1 Sơ đồ luồng dữ liệu (Dataflow Diagram)

```
[ Người dùng bấm Ctrl + C ]
            │
            ▼
┌───────────────────────────────┐
│ Windows OS Clipboard Change   │
└───────────┬───────────────────┘
            │ Event: WM_CLIPBOARDUPDATE
            ▼
┌───────────────────────────────┐
│ Win32 Native Event Listener   │ ◄── (Producer: Tạo Message Window ngầm)
└───────────┬───────────────────┘
            │
            │ (Thả Raw Text vào Queue)
            ▼
┌───────────────────────────────┐
│ Async Processing Queue        │ ◄── (Chống nghẽn / UI Isolation)
└───────────┬───────────────────┘
            │
            ▼
┌───────────────────────────────┐
│ Clipboard Pipeline Manager    │
│ ┌───────────────────────────┐ │
│ │ 1. RemoveHiddenCharsFilter│ │ (Xóa zero-width, chuẩn hóa NFC)
│ ├───────────────────────────┤ │
│ │ 2. CleanWhitespaceFilter  │ │ (Trimming, thu gọn dòng trống)
│ ├───────────────────────────┤ │
│ │ 3. URLSanitizerFilter     │ │ (Loại bỏ utm_*, fbclid...)
│ ├───────────────────────────┤ │
│ │ 4. SmartExtractorFilter   │ │ (Trích xuất SĐT/Email nếu bật mode)
│ └───────────────────────────┘ │
└───────────┬───────────────────┘
            │ (Processed Text)
            ▼
┌───────────────────────────────┐
│ Win32 Safe Retry Writer       │ ◄── (Ghi đè text sạch + Exponential Backoff)
└───────────┬───────────────────┘
            │
            ▼
┌───────────────────────────────┐
│ System Clipboard / Win + V    │ (Chứa bản ghi sạch duy nhất trên cùng)
└───────────────────────────────┘
```

---

## 4. TẤN CÔNG & PHÒNG THỦ KỸ THUẬT (TECHNICAL DETAILED SPECIFICATION)

### 4.1 Cơ chế Lắng nghe Native Win32 Event (`WM_CLIPBOARDUPDATE`)
Thay vì kiểm tra liên tục, hệ thống tạo một Windows Message Window ngầm và gọi API `AddClipboardFormatListener(hwnd)`. Windows sẽ tự phát sự kiện `WM_CLIPBOARDUPDATE` mỗi khi Clipboard hệ thống thay đổi.

- **Ưu điểm**: CPU utilization = 0% ở trạng thái idle, thời gian phản ứng < 1ms.
- **Tránh Infinite Loop (Vòng lặp tự lắng nghe)**: So sánh `raw_text != last_processed_text`. Chỉ khi text đã qua xử lý khác hoàn toàn text thô mới thực hiện ghi đè.

### 4.2 Cơ chế Safe Open & Exponential Backoff Retry
Khi copy số lượng lớn, nhiều ứng dụng cùng truy cập Clipboard gây ra lock. Hàm ghi dữ liệu triển khai cơ chế thử lại (Retry) với độ trễ lũy thừa:

$$\text{Delay}_i = t_{\text{base}} \times 2^i = 5\text{ms} \times 2^i \quad (i = 0, 1, 2, \dots, 4)$$

```python
def safe_write_clipboard(text: str, max_retries: int = 5) -> bool:
    for i in range(max_retries):
        try:
            win32clipboard.OpenClipboard()
            win32clipboard.EmptyClipboard()
            win32clipboard.SetClipboardText(text, win32con.CF_UNICODETEXT)
            win32clipboard.CloseClipboard()
            return True
        except Exception:
            time.sleep(0.005 * (2 ** i))
    return False
```

### 4.3 Các chế độ lọc chi tiết (Filtering Modes)

1. **Bộ lọc Ký tự Ẩn (Hidden Characters Filter)**:
   - Thay thế `\xa0` (Non-breaking space) thành space chuẩn `' '`.
   - Xóa bỏ `\u200b` (Zero-width space), `\ufeff` (BOM).
   - Chuẩn hóa Unicode bằng `unicodedata.normalize('NFC', text)`.

2. **Bộ lọc URL Tracking (URL Sanitizer Filter)**:
   - Nhận diện URL bắt đầu bằng `http://` hoặc `https://`.
   - Dùng Regex bóc tách parameters: `utm_source`, `utm_medium`, `utm_campaign`, `fbclid`, `gclid`, `ref`.

3. **Bộ lọc Trích xuất Thông minh (Smart Extractor Filter)**:
   - Dành cho CSKH/Sale khi copy cả đoạn chat dài:
   - Regex SĐT Việt Nam: `r'(?:\+84|0)[3|5|7|8|9]\d{8}\b'`
   - Regex Email: `r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'`

---

## 5. MÃ NGUỒN TRIỂN KHAI THAM CHIẾU (REFERENCE IMPLEMENTATION)

```python
import win32gui
import win32con
import win32clipboard
import re
import unicodedata
import time
from typing import List, Callable, Optional

class TextFilters:
    """Tập hợp các bộ lọc dữ liệu văn bản độc lập"""
    
    @staticmethod
    def remove_hidden_chars(text: str) -> str:
        text = text.replace('\xa0', ' ').replace('\u200b', '').replace('\ufeff', '')
        return unicodedata.normalize('NFC', text)

    @staticmethod
    def clean_whitespace(text: str) -> str:
        lines = [line.strip() for line in text.splitlines()]
        cleaned_lines = []
        for line in lines:
            if line or (cleaned_lines and cleaned_lines[-1]):
                cleaned_lines.append(line)
        return "\n".join(cleaned_lines).strip()

    @staticmethod
    def strip_url_tracking(text: str) -> str:
        if text.startswith(('http://', 'https://')):
            text = re.sub(r'([?&])(utm_[^&]+|fbclid=[^&]+|gclid=[^&]+|ref=[^&]+)', '', text)
            text = re.sub(r'\?$', '', text)
        return text

class ClipboardPipelineManager:
    """Quản lý chuỗi Pipeline các bộ lọc"""
    
    def __init__(self):
        self.filters: List[Callable[[str], str]] = [
            TextFilters.remove_hidden_chars,
            TextFilters.clean_whitespace,
            TextFilters.strip_url_tracking
        ]
        self.last_processed_text: str = ""

    def process(self, raw_text: str) -> str:
        current_text = raw_text
        for filter_func in self.filters:
            current_text = filter_func(current_text)
        return current_text

class NativeClipboardListener:
    """Trình lắng nghe sự kiện Win32 Clipboard Native"""
    
    def __init__(self, pipeline: ClipboardPipelineManager):
        self.pipeline = pipeline
        self.hwnd: Optional[int] = None

    def _read_clipboard(self) -> Optional[str]:
        try:
            win32clipboard.OpenClipboard()
            if win32clipboard.IsClipboardFormatAvailable(win32con.CF_UNICODETEXT):
                data = win32clipboard.GetClipboardData(win32con.CF_UNICODETEXT)
            else:
                data = None
            win32clipboard.CloseClipboard()
            return data
        except Exception:
            return None

    def _write_clipboard(self, text: str) -> bool:
        for i in range(5):
            try:
                win32clipboard.OpenClipboard()
                win32clipboard.EmptyClipboard()
                win32clipboard.SetClipboardText(text, win32con.CF_UNICODETEXT)
                win32clipboard.CloseClipboard()
                return True
            except Exception:
                time.sleep(0.005 * (2 ** i))
        return False

    def _wnd_proc(self, hwnd, msg, wparam, lparam):
        if msg == win32con.WM_CLIPBOARDUPDATE:
            raw_text = self._read_clipboard()
            
            if raw_text and raw_text != self.pipeline.last_processed_text:
                processed_text = self.pipeline.process(raw_text)
                
                if processed_text != raw_text:
                    self.pipeline.last_processed_text = processed_text
                    self._write_clipboard(processed_text)
                    print(f"[LOG] Đã lọc Clipboard: RawLen={len(raw_text)} -> CleanLen={len(processed_text)}")
                else:
                    self.pipeline.last_processed_text = raw_text
                    
        return win32gui.DefWindowProc(hwnd, msg, wparam, lparam)

    def start(self):
        wc = win32gui.WNDCLASS()
        wc.lpfnWndProc = self._wnd_proc
        wc.lpszClassName = "ClipboardFilterListener"
        hinst = win32gui.RegisterClass(wc)
        
        self.hwnd = win32gui.CreateWindow(
            hinst, "ClipboardFilterListener", 0, 0, 0, 0, 0, 0, 0, hinst, None
        )
        win32gui.AddClipboardFormatListener(self.hwnd)
        print(">>> Clipboard Filtering Service is running...")
        win32gui.PumpMessages()

if __name__ == "__main__":
    manager = ClipboardPipelineManager()
    listener = NativeClipboardListener(manager)
    listener.start()
```

---

## 6. KẾ HOẠCH BẢO TRÌ & MỞ RỘNG (FUTURE EXTENSIONS)

1. **Giao diện System Tray**: Cho phép người dùng bật/tắt nhanh các bộ lọc từ góc phải màn hình.
2. **Collector Mode (Auto-Accumulate)**: Thêm bộ lọc cho phép gom $N$ lần copy thành một danh sách duy nhất trước khi xả ra dán.
3. **Phân loại định dạng Rich Text / HTML**: Hỗ trợ dọn dẹp định dạng bảng HTML khi copy từ Excel sang Web.
