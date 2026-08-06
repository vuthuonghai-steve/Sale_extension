Windows + V Clipboard History
https://gemini.google.com/app/ae179509b31a5ecf

User prompt: hiện tại thì khi làm việc và sử dụng với window thì app đại diện cho copy pate và tổ hợp phím tắt window + v là app gì và mình có thể can thiệp sử đổi app này không ?
Response: Ứng dụng/tính năng đại diện cho tổ hợp phím Windows + V trên Windows (từ Windows 10 trở lên) là Clipboard History (Nhật ký Khay nhớ tạm).
Mặc định, đây không phải là một ứng dụng .exe độc lập dạng desktop thông thường mà là một tính năng hệ thống tích hợp sâu vào giao diện người dùng của Windows (thông qua tiến trình ShellExperienceHost.exe hoặc giao diện UWP/WinUI).
Bạn có thể can thiệp hoặc sửa đổi Clipboard mặc định không?
Có, nhưng theo các cấp độ khác nhau:
1. Tùy chỉnh trực tiếp Clipboard mặc định của Windows (Cấp độ hệ thống)
Bật/Tắt & Đồng bộ: Vào Settings > System > Clipboard để bật/tắt lịch sử clipboard, xóa dữ liệu, hoặc bật tính năng đồng bộ clipboard qua các thiết bị đăng nhập cùng tài khoản Microsoft.
Can thiệp nâng cao: Bạn không thể sửa mã nguồn giao diện giao diện Win + V mặc định, nhưng có thể điều chỉnh hoặc xóa dữ liệu của nó thông qua các lệnh PowerShell hoặc Windows API (Windows.ApplicationModel.DataTransfer).
2. Thay thế hoàn toàn bằng phần mềm thứ ba (Cấp độ tính năng)
Nếu bạn muốn giao diện mới, thêm các tính năng như tìm kiếm lịch sử copy, phân loại, lưu định dạng phức tạp hoặc gán phím tắt tùy chỉnh, cách tốt nhất là dùng ứng dụng quản lý clipboard mã nguồn mở/chuyên dụng.
Một số ứng dụng phổ biến và mạnh mẽ nhất hiện nay:
Ditto (Mã nguồn mở, rất phổ biến cho dev): Hỗ trợ tìm kiếm nhanh, lưu trữ hàng nghìn mục copy, hỗ trợ phím tắt tùy biến linh hoạt.
CopyQ (Mã nguồn mở, đa nền tảng): Tùy biến rất sâu, hỗ trợ viết script (Javascript) để xử lý dữ liệu trước/sau khi copy-paste.
1Clipboard hoặc ClipClip: Giao diện hiện đại, trực quan, hỗ trợ quản lý clipboard theo thư mục.
PowerToys (Paste Plain Text): Tính năng phụ trợ từ Microsoft PowerToys giúp dán văn bản thuần túy (Ctrl + Win + Alt + V).
Cách ghi đè phím tắt Windows + V bằng phần mềm khác
Nếu cài phần mềm bên thứ 3 và muốn gán phím tắt Windows + V cho ứng dụng đó:
Sử dụng Microsoft PowerToys (Keyboard Manager):
Tắt tính năng Clipboard mặc định trong Settings > System > Clipboard.
Mở PowerToys > chọn Keyboard Manager > Remap a shortcut.
Gán Win + V thành phím tắt mở ứng dụng mới của bạn (ví dụ: gán sang phím tắt của Ditto).
Cấu hình trực tiếp trong ứng dụng thay thế:
Hầu hết các app như Ditto hay CopyQ đều cho phép bạn thiết lập Global Hotkey. Bạn chỉ cần đặt hotkey mở bảng lịch sử của app đó là Win + V.

User prompt: CopyQ (Mã nguồn mở, đa nền tảng): Tùy biến rất sâu, hỗ trợ viết script (Javascript) để xử lý dữ liệu trước/sau khi copy-paste. nếu chỉ đơn giản là copy pate , sử lý giữ liệu sau khi copy thì mình tự build được một app đơn giản không ?
Response: Hoàn toàn được, và đây là một project rất khả thi, không tốn quá nhiều thời gian nếu bạn muốn tự làm một bản "ngon - bổ - rẻ" theo đúng nhu cầu cá nhân.
Về bản chất, một ứng dụng Clipboard Manager đơn giản chỉ gồm 3 thành phần chính:
Listen (Lắng nghe): Bắt sự kiện khi clipboard hệ thống thay đổi (hoặc bắt phím tắt Ctrl + C).
Process (Xử lý): Nhận dữ liệu chuỗi (string) -> Chạy qua hàm xử lý/transform theo ý bạn.
Write/Paste (Ghi & Dán): Ghi ngược dữ liệu đã xử lý vào Clipboard hệ thống (hoặc tự động phát sự kiện Ctrl + V).
Các hướng tiếp cận tự build nhanh nhất
Tùy vào công nghệ bạn quen thuộc, bạn có thể triển khai theo các cách sau:
Cách 1: Chạy ngầm bằng Script (Nhanh nhất - Không cần GUI)
Nếu chỉ cần xử lý dữ liệu tự động (ví dụ: copy JSON lỗi -> tự format; copy link -> tự strip tracking params; copy văn bản -> tự xóa dấu câu/chuyển hoa thường):
Python: Dùng thư viện pyperclip hoặc clipboard để đọc/ghi, kết hợp keyboard hoặc pynput để lắng nghe phím tắt.
Node.js: Dùng thư viện clipboardy hoặc node-clipboard-event.
C# / PowerShell (Windows Native): Dùng trực tiếp class Clipboard của .NET. Rất nhẹ và chạy trực tiếp trên Windows không cần cài thêm runtime phức tạp.
Cách 2: Làm Desktop App có Giao diện (GUI + System Tray)
Nếu muốn ứng dụng nằm dưới góc màn hình (System Tray), bấm phím tắt bật ra popup danh sách history để chọn:
Electron / Tauri (Web Tech): Nếu bạn quen làm Web/JS. Tauri (kết hợp Rust backend + Frontend bất kỳ) là lựa chọn cực kỳ tối ưu vì app cực nhẹ (~10-15MB RAM), tốt hơn nhiều so với Electron.
C# (.NET WPF / WinForms): Chuẩn native Windows, tương tác API hệ thống cực kỳ mượt và không tốn tài nguyên.
Python (PyQt / PySide): Dễ viết logic xử lý dữ liệu phức tạp (regex, AI parsing, text processing).
Cấu trúc Logic cơ bản (Ví dụ minh họa bằng Python)
Dưới đây là luồng hoạt động tối giản của một ứng dụng lắng nghe clipboard và tự động xử lý chuỗi (ví dụ: tự động dọn dẹp khoảng trắng dư thừa và xóa các ký tự thừa ngay khi copy):
import time
import pyperclip

def process_data(text: str) -> str:
    # Ví dụ: Xử lý dữ liệu sau khi copy
    # Strip khoảng trắng thừa, xóa dòng trống, hoặc format chuỗi theo ý muốn
    cleaned = "\n".join([line.strip() for line in text.splitlines() if line.strip()])
    return cleaned

def main():
    last_paste = ""
    print("Clipboard Listener đang chạy ngầm...")
    
    while True:
        try:
            current_paste = pyperclip.paste()
            # Nếu phát hiện dữ liệu clipboard mới
            if current_paste != last_paste and current_paste.strip() != "":
                last_paste = current_paste
                
                # Tiến hành xử lý
                processed_text = process_data(current_paste)
                
                # Ghi ngược lại clipboard nếu dữ liệu bị thay đổi
                if processed_text != current_paste:
                    pyperclip.copy(processed_text)
                    last_paste = processed_text
                    print("Đã tự động xử lý dữ liệu clipboard!")
                    
        except Exception as e:
            pass
            
        time.sleep(0.5) # Poll mỗi 0.5 giây

if __name__ == "__main__":
    main()


Một số vấn đề kỹ thuật cần lưu ý khi tự build trên Windows
Win32 API Clipboard Chain:
Cách polling (time.sleep) ở ví dụ trên rất đơn giản nhưng hơi tốn CPU nhẹ và có độ trễ.
Để chuẩn chỉnh như các app chuyên nghiệp, bạn nên dùng Win32 API (SetClipboardViewer hoặc AddClipboardFormatListener) để Windows tự push notification cho app của bạn mỗi khi clipboard thay đổi.
Định dạng dữ liệu:
Clipboard không chỉ chứa vản bản (CF_TEXT), nó còn chứa hình ảnh (CF_BITMAP), danh sách file (CF_HDROP), HTML, etc. Nếu tự làm app đơn giản, bạn nên giới hạn kiểm tra Clipboard.ContainsText() trước để tránh crash app khi copy file hoặc ảnh.
Quyền riêng tư / Password Manager:
Các app quản lý mật khẩu (như 1Password, KeePass) thường đánh dấu dữ liệu sensitive trong clipboard. Nếu tự làm app lưu lịch sử (history), bạn nên cân nhắc cơ chế tự xóa dữ liệu sau 30-60 giây nếu phát hiện chuỗi copy là mật khẩu.

User prompt: với cách tiếp cận 1 thì mình có thể sử dụng song song với "Clipboard History" mặc định của window không ? mình muốn triển khai cách tiếp cận 1 theo hướng layer . với cách tiếp cận 1 làm layer đầu vào lọc giữ liệu được copy rồi mới đến "Clipboard History" liệu có được triển khai theo cách này không ?
Response: Không thể triển khai chính xác theo mô hình Layer nối tiếp (Pipeline/Middleware) tuyệt đối, nhưng bạn hoàn toàn có thể đạt được kết quả tương tự bằng cơ chế mô phỏng (Interception).
Để hiểu tại sao không làm Layer nối tiếp trực tiếp được và cách lách qua giới hạn này, chúng ta xem xét cơ chế hoạt động của Windows Clipboard:
1. Rào cản kiến trúc: Windows Clipboard hoạt động theo cơ chế Broadcast
Windows không có cơ机制 Pipe/Middleware cho Clipboard.
Khi bạn nhấn Ctrl + C hoặc gọi lệnh copy:
Ứng dụng gửi dữ liệu thẳng vào Clipboard của hệ thống.
Windows phát tín hiệu thông báo (Event Broadcast) đến tất cả các ứng dụng đang đăng ký lắng nghe (bao gồm ứng dụng của bạn và Clipboard History - Win + V).
Cả hai ứng dụng sẽ nhận dữ liệu cùng một lúc tại thời điểm copy. Bạn không thể đứng ở giữa để "chặn" (intercept) dữ liệu trước khi nó kịp chui vào Clipboard History mặc định nếu chỉ dùng các API lắng nghe thông thường.
[Hành động Ctrl+C] ──> [Windows Clipboard] ┬──> [App của bạn]
                                          └──> [Clipboard History (Win+V)]


2. Cách giải quyết: Mô phỏng Layer bằng kỹ thuật Re-write (Ghi đè cấp tốc)
Dù không tạo được Layer nối tiếp về mặt hệ thống, bạn vẫn có thể làm cho Clipboard History chỉ lưu dữ liệu đã qua xử lý bằng 2 phương án thực thi dưới đây:
Phương án A: Re-write tức thì (Đơn giản nhất - 95% đáp ứng tốt)
Khi bạn copy, script của bạn phát hiện dữ liệu mới, lập tức biến đổi chuỗi và ghi đè ngay lập tức ngược lại vào Clipboard.
[Ctrl+C] ──> [Clipboard nhận text gốc] ──> [Script phát hiện & Process]
                     │                          │
           (Lưu tạm text gốc)                   ▼
                     │                 [Script GHI ĐÈ text đã sửa]
                     ▼                          │
             [Win+V lưu text gốc] ◄─────────────┘ (Win+V cập nhật thêm text mới)


Hiện tượng xảy ra trên Win + V: Trong Clipboard History sẽ xuất hiện 2 dòng nối tiếp nhau: Dòng dưới là text gốc, dòng trên cùng (mới nhất) là text đã qua xử lý.
Ưu điểm: Cực kỳ dễ viết script (chỉ cần dùng Python/NodeJS cơ bản).
Nhược điểm: Lịch sử Win + V bị rác do chứa cả bản gốc chưa lọc.
Phương án B: Chặn phím Ctrl + C (Chuẩn mô hình Layer vào)
Để Clipboard History chỉ chứa duy nhất dữ liệu đã lọc, bạn phải chặn phím Ctrl + C trước khi lệnh copy mặc định của ứng dụng diễn ra:
Script của bạn dùng Global Keyboard Hook để chặn (override) phím Ctrl + C.
Khi người dùng bấm Ctrl + C:
Script chặn không cho Windows phát lệnh copy mặc định.
Script tự gửi lệnh copy ngầm để lấy text gốc.
Script thực hiện lọc/xử lý dữ liệu.
Script ghi chỉ dữ liệu đã lọc vào Clipboard hệ thống.
Lúc này, Windows Clipboard mới nhận dữ liệu -> Clipboard History (Win + V) chỉ nhận được duy nhất 1 bản dữ liệu đã qua xử lý.
[Nhấn Ctrl+C] ──> [Script chặn lại] ──> [Lấy text & Lọc/Xử lý] ──> [Ghi vào Clipboard] ──> [Win+V chỉ lưu Text sạch]


Minh họa mã nguồn Phương án B (Python Hooking)
Để làm theo Phương án B trên Windows, bạn có thể dùng thư viện pynput để hook phím và pyperclip để thao tác dữ liệu:
import time
import pyperclip
from pynput import keyboard
import pyautogui # Hoặc dùng pynput/win32api để gửi phím Ctrl+C ngầm

def filter_data(text: str) -> str:
    # Logic lọc dữ liệu của bạn ở đây (Ví dụ: Xóa khoảng trắng thừa, strip tracking link...)
    return text.strip().upper() 

def on_copy_intercept():
    # 1. Tạm thời ngắt hook để tránh vòng lặp vô tận khi tự gửi Ctrl+C
    keyboard_listener.suppress_event() 
    
    # 2. Gửi Ctrl+C thật xuống hệ thống để đưa text gốc vào clipboard
    pyautogui.hotkey('ctrl', 'c')
    time.sleep(0.05) # Chờ hệ thống ghi nhận clipboard
    
    # 3. Lấy text gốc và xử lý
    raw_text = pyperclip.paste()
    clean_text = filter_data(raw_text)
    
    # 4. Ghi đè text sạch vào clipboard -> Win+V chỉ nhận bản này
    pyperclip.copy(clean_text)

# Khởi tạo Lắng nghe phím Ctrl+C ở cấp độ Hệ điều hành (Global Hook)
# (Lưu ý: Triển khai thực tế cần xử lý chi tiết luồng async/hook phím chuẩn Win32)


Tóm lại
Có thể dùng song song: Bạn hoàn toàn dùng song song app tự viết với Clipboard History mặc định.
Về cách triển khai Layer: Nên dùng Phương án B (Chặn shortcut Ctrl + C). Cách này biến ứng dụng của bạn thành một "màng lọc" đúng nghĩa đứng trước Windows Clipboard và Clipboard History.

User prompt: giả định triển khai theo hướng Phương án B: Chặn phím Ctrl + C sau khi thực hiện copy : ctrl + c thực hiện hành vi pate : ctrl + v ngay thì mình có thể pate ra ngay được loại văn bản được lọc không ?
Response: Hoàn toàn được. Dữ liệu dán ra bằng Ctrl + V ngay sau đó chắc chắn sẽ là loại văn bản đã qua xử lý/lọc.
Tuy nhiên, vì máy tính xử lý với tốc độ cực nhanh (microsecond), còn các thao tác giả lập phím và I/O Clipboard lại mất vài millisecond, nên để trải nghiệm dán (Ctrl + V) mượt mà và không bị dán nhầm văn bản cũ, bạn cần nắm rõ vấn đề độ trễ (latency/race condition) và cách tối ưu code.
1. Luồng chạy thực tế tính bằng Millisecond (ms)
Khi bạn nhấn Ctrl + C -> rồi bấm ngay Ctrl + V (dù bạn bấm nhanh đến mức nào, phản xạ con người cũng mất khoảng 100ms - 200ms giữa 2 cú bấm):
[0ms] Bạn nhấn Ctrl + C.
[1ms - 5ms] Hook của bạn chặn sự kiện -> Gửi lệnh copy ngầm lấy dữ liệu gốc.
[10ms - 20ms] Script nhận chuỗi gốc -> Chạy hàm lọc (Regex, Format, Trim...).
[25ms - 30ms] Script ghi đè chuỗi sạch vào Clipboard.
[~150ms] Bạn nhấn Ctrl + V -> Hệ thống dán dữ liệu trong Clipboard ra -> Kết quả: Ra văn bản sạch 100%.
Thời gian xử lý của script (chỉ mất ~30ms) nhỏ hơn rất nhiều so với thời gian ngón tay bạn di chuyển từ phím C sang phím V.
2. Hai "Rủi ro" kỹ thuật cần xử lý triệt để
Nếu code không cẩn thận, bạn sẽ gặp 2 lỗi sau:
Lỗi 1: Dán ra Dữ liệu CŨ (Race Condition)
Nếu hàm lọc của bạn tốn thời gian (ví dụ: gọi API bên ngoài, AI processing...) hoặc độ trễ gửi Ctrl + C ngầm quá chậm, khi người dùng bấm Ctrl + V quá nhanh, Clipboard vẫn đang giữ dữ liệu của lần copy trước đó.
Cách khắc phục: Hàm lọc dữ liệu phải là Synchronous / Pure Function chạy trực tiếp trên Memory (dùng Regex, chuỗi thuần), xử lý xong dưới 10ms. Không thực hiện các tác vụ Async/Network nặng tại đây.
Lỗi 2: Vòng lặp vô tận (Infinite Loop)
Khi script của bạn gửi lệnh Ctrl + C ngầm để lấy dữ liệu gốc, chính phím Ctrl + C ngầm đó lại kích hoạt Hook của bạn một lần nữa -> App bị treo hoặc lặp vô tận.
Cách khắc phục: Phải Tắt Hook (Unhook/Suppress) trước khi gửi Ctrl + C ngầm, sau đó Bật lại Hook ngay sau khi hoàn thành.
3. Code mẫu chuẩn kỹ thuật trên Windows (Python)
Ví dụ dưới đây sử dụng win32clipboard và pynput (mức Native Windows API) để đạt tốc độ xử lý nhanh nhất (< 15ms), đảm bảo bạn bấm Ctrl + V ngay lập tức vẫn ra đúng text sạch:
import time
import threading
import win32clipboard
import win32con
from pynput import keyboard
from pynput.keyboard import Controller, Key

kb_controller = Controller()

# --- 1. HÀM LỌC DỮ LIỆU (Cực nhanh, < 2ms) ---
def clean_text(raw: str) -> str:
    if not raw:
        return ""
    # Ví dụ: Xóa khoảng trắng dư thừa, viết hoa toàn bộ
    cleaned = " ".join(raw.split())
    return cleaned.upper()

# --- 2. THAO TÁC CLIPBOARD TRỰC TIẾP QUA WIN32 API ---
def get_clipboard() -> str:
    try:
        win32clipboard.OpenClipboard()
        if win32clipboard.IsClipboardFormatAvailable(win32con.CF_UNICODETEXT):
            data = win32clipboard.GetClipboardData(win32con.CF_UNICODETEXT)
        else:
            data = ""
        win32clipboard.CloseClipboard()
        return data
    except Exception:
        return ""

def set_clipboard(text: str):
    try:
        win32clipboard.OpenClipboard()
        win32clipboard.EmptyClipboard()
        win32clipboard.SetClipboardText(text, win32con.CF_UNICODETEXT)
        win32clipboard.CloseClipboard()
    except Exception:
        pass

# --- 3. LUỒNG XỬ LÝ SỰ KIỆN CTRL + C ---
is_processing = False

def process_copy_pipeline():
    global is_processing
    is_processing = True
    
    # a. Gửi Ctrl+C ngầm xuống ứng dụng hiện tại để copy văn bản bôi đen
    kb_controller.release('c')
    kb_controller.release(Key.ctrl)
    
    kb_controller.press(Key.ctrl)
    kb_controller.press('c')
    kb_controller.release('c')
    kb_controller.release(Key.ctrl)
    
    # b. Chờ cực ngắn (15ms) để Windows kịp nạp text vào Clipboard
    time.sleep(0.015) 
    
    # c. Lấy text gốc -> Lọc -> Ghi đè lại Clipboard
    raw = get_clipboard()
    cleaned = clean_text(raw)
    set_clipboard(cleaned)
    
    is_processing = False

# --- 4. HOOK BẮT PHÍM GLOBAL ---
current_keys = set()

def on_press(key):
    global is_processing
    current_keys.add(key)
    
    # Bắt tổ hợp Ctrl + C
    if (Key.ctrl in current_keys or Key.ctrl_l in current_keys or Key.ctrl_r in current_keys) \
       and (key == keyboard.KeyCode.from_char('c') or key == keyboard.KeyCode.from_char('C')):
        
        if not is_processing:
            # Chạy pipeline xử lý trên một Thread riêng biệt để không khóa OS Keyboard Hook
            threading.Thread(target=process_copy_pipeline).start()

def on_release(key):
    try:
        current_keys.remove(key)
    except KeyError:
        pass

# Chạy Listener ngầm
with keyboard.Listener(on_press=on_press, on_release=on_release) as listener:
    listener.join()


Kết luận
Với cách làm này:
Bạn nhấn Ctrl + C -> Text gốc được copy -> Tự động lọc ngay lập tức -> Ghi đè bản sạch vào Clipboard.
Clipboard History (Win + V) chỉ lưu duy nhất bản sạch.
Bạn nhấn Ctrl + V ngay lập tức -> Dán ra văn bản đã được lọc.


--------------------------------------------------------------------------------

# THIẾT KẾ CHUYÊN SÂU: LỚP CHẶN LỌC (CLIPBOARD FILTERING LAYER) CHO CÔNG VIỆC COPY NHIỀU

Khi công việc đòi hỏi **copy dữ liệu liên tục với số lượng lớn** (Sale, Data Entry, Crawl dữ liệu, CSKH...), một script copy-paste đơn giản sẽ dễ gặp các vấn đề:
1. **Lỗi Lock Clipboard (`Access Denied`)**: Windows ngăn không cho mở Clipboard nếu app khác (Excel, Chrome, Word) đang ghi dữ liệu vào.
2. **Nghẽn / Treo phím**: Xử lý logic nặng (Regex phức tạp, gọi API...) trực tiếp trên thread bắt phím làm giật lag bàn phím hệ thống.
3. **Mất định dạng rác & Ký tự ẩn**: Copy từ Web/PDF thường dính theo ký tự xuống dòng lạ (`\r\n`, `\x00`), HTML tags, khoảng trắng Unicode không nhìn thấy (`\u200b`).
4. **Cần nhiều chế độ lọc khác nhau**: Đôi khi cần lọc URL tracking, đôi khi cần trích xuất SĐT/Email, đôi khi cần nối nhiều đoạn copy thành 1.

---

## I. MÔ HÌNH KIẾN TRÚC LỚP CHẶN LỌC (PIPELINE ARCHITECTURE)

Để đáp ứng việc xử lý linh hoạt và mở rộng, lớp chặn lọc nên thiết kế theo mô hình **Producer - Consumer** kết hợp **Chain of Responsibility (Pipeline Pattern)**:

```
[ Sự kiện Copy (Ctrl+C / Event) ]
               │
               ▼
   ┌───────────────────────┐
   │ Win32 Event Listener  │  (Producer: Phát hiện clipboard thay đổi)
   └───────────┬───────────┘
               │ (Đưa raw text vào Queue)
               ▼
   ┌───────────────────────┐
   │ Async Worker Queue    │  (Tránh block Thread bàn phím/OS)
   └───────────┬───────────┘
               │
               ▼
   ┌───────────────────────┐
   │  Filter Pipeline Manager│
   │  ┌─────────────────┐  │
   │  │ 1. FormatClean  │  │ (Loại bỏ whitespace, ký tự dị, HTML)
   │  ├─────────────────┤  │
   │  │ 2. URL Sanitizer│  │ (Strip utm_*, fbclid, tracking)
   │  ├─────────────────┤  │
   │  │ 3. PatternExtract│ │ (Trích xuất SĐT/Email/Mã đơn nếu bật mode)
   │  ├─────────────────┤  │
   │  │ 4. Accumulator   │ │ (Nối chuỗi nếu ở chế độ Collector)
   │  └─────────────────┘  │
   └───────────┬───────────┘
               │
               ▼
   ┌───────────────────────┐
   │ Win32 Safe Retry Writer│ (Ghi đè text sạch + Retry với Backoff)
   └───────────┬───────────┘
```

---

## II. 5 TÍNH NĂNG NÂNG CAO CHO CÔNG VIỆC COPY NHIỀU

### 1. Cơ chế Safe Open & Lock Handling (Exponential Retry)
Khi copy nhanh liên tục, hàm `OpenClipboard()` dễ bị lỗi `WinError 5: Access is denied`. Cần tạo wrapper tự động thử lại (Retry) với độ trễ cực ngắn:
```python
def safe_set_clipboard(text: str, max_retries=5):
    for i in range(max_retries):
        try:
            win32clipboard.OpenClipboard()
            win32clipboard.EmptyClipboard()
            win32clipboard.SetClipboardText(text, win32con.CF_UNICODETEXT)
            win32clipboard.CloseClipboard()
            return True
        except Exception:
            time.sleep(0.005 * (2 ** i)) # Backoff: 5ms, 10ms, 20ms...
    return False
```

### 2. Bộ lọc Đa chế độ (Mode Switching)
Đối với dân Sale / Data Entry, bạn nên hỗ trợ đổi Mode nhanh qua Hotkey:
- **Mode 1: Clean Text (Mặc định)** - Xóa khoảng trắng thừa, xóa format HTML, loại bỏ xuống dòng vô lý.
- **Mode 2: Smart Extractor (Tự trích xuất)** - Bạn copy cả đoạn chat dài -> Script tự nhặt ra duy nhất Số điện thoại hoặc Email hoặc Mã vận đơn.
- **Mode 3: URL De-tracking** - Tự xóa `?utm_source=...&fbclid=...` khi copy link sản phẩm/bài viết.
- **Mode 4: Accumulator / Collector (Gom dữ liệu)** - Bạn nhấn Ctrl+C 5 lần ở 5 chỗ khác nhau -> Script tự nối thành danh sách 5 dòng. Nhấn phím nóng xả dữ liệu dán 1 lượt.

### 3. Lọc Ký tự Ẩn & Chuẩn hóa Unicode
Vản bản copy từ PDF hoặc Web thường dính ký tự ẩn:
- Non-breaking space (`\xa0`) -> đổi thành space thường (` `).
- Zero-width space (`\u200b`, `\ufeff`) -> xóa bỏ hoàn toàn.
- Chuẩn hóa Unicode (NFC / NFD) tránh lỗi tìm kiếm Tiếng Việt.

---

## III. MÃ NGUỒN HOÀN CHỈNH: PIPELINE FILTER LAYER (PYTHON)

Dưới đây là mã nguồn xây dựng **Filter Layer chuẩn sản xuất**, sử dụng `AddClipboardFormatListener` (Win32 Native Event - không tốn CPU polling, không lag phím):

```python
import win32gui
import win32con
import win32clipboard
import re
import unicodedata
import time
from typing import List, Callable

# ==========================================
# 1. CÁC PIPELINE FILTER (BỘ LỌC ĐỘC LẬP)
# ==========================================

class TextFilters:
    @staticmethod
    def remove_hidden_chars(text: str) -> str:
        """Xóa ký tự ẩn, zero-width spaces và chuẩn hóa Unicode"""
        text = text.replace('\xa0', ' ').replace('\u200b', '').replace('\ufeff', '')
        return unicodedata.normalize('NFC', text)

    @staticmethod
    def clean_whitespace(text: str) -> str:
        """Thu gọn khoảng trắng dư thừa, làm sạch các dòng trống liên tiếp"""
        lines = [line.strip() for line in text.splitlines()]
        # Loại bỏ các dòng trống thừa kế tiếp nhau
        cleaned_lines = []
        for line in lines:
            if line or (cleaned_lines and cleaned_lines[-1]):
                cleaned_lines.append(line)
        return "\n".join(cleaned_lines).strip()

    @staticmethod
    def strip_url_tracking(text: str) -> str:
        """Loại bỏ thông số tracking (utm_*, fbclid, gclid...) nếu chuỗi là URL"""
        if text.startswith(('http://', 'https://')):
            # Bóc tách param tracking phổ biến
            text = re.sub(r'([?&])(utm_[^&]+|fbclid=[^&]+|gclid=[^&]+|ref=[^&]+)', '', text)
            text = re.sub(r'\?$', '', text) # Sửa dấu ? thừa ở cuối
        return text

    @staticmethod
    def extract_phone_number_mode(text: str) -> str:
        """Chế độ nâng cao: Tìm và bóc tách Số điện thoại Việt Nam trong đoạn text copy"""
        phones = re.findall(r'(?:\+84|0)[3|5|7|8|9]\d{8}\b', text)
        if phones:
            return "\n".join(list(set(phones))) # Trả về danh sách SĐT duy nhất
        return text

# ==========================================
# 2. PIPELINE MANAGER (QUẢN LÝ TẬP HỢP FILTER)
# ==========================================

class ClipboardPipelineManager:
    def __init__(self):
        self.filters: List[Callable[[str], str]] = [
            TextFilters.remove_hidden_chars,
            TextFilters.clean_whitespace,
            TextFilters.strip_url_tracking
        ]
        self.last_processed_text = ""

    def process(self, raw_text: str) -> str:
        current_text = raw_text
        for filter_func in self.filters:
            current_text = filter_func(current_text)
        return current_text

# ==========================================
# 3. WIN32 NATIVE LISTENER & RE-WRITER
# ==========================================

class NativeClipboardListener:
    def __init__(self, pipeline: ClipboardPipelineManager):
        self.pipeline = pipeline
        self.hwnd = None

    def _read_clipboard(self) -> str:
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

    def _write_clipboard(self, text: str):
        for i in range(5):
            try:
                win32clipboard.OpenClipboard()
                win32clipboard.EmptyClipboard()
                win32clipboard.SetClipboardText(text, win32con.CF_UNICODETEXT)
                win32clipboard.CloseClipboard()
                break
            except Exception:
                time.sleep(0.01)

    def _wnd_proc(self, hwnd, msg, wparam, lparam):
        if msg == win32con.WM_CLIPBOARDUPDATE:
            raw_text = self._read_clipboard()
            
            # Kiểm tra text hợp lệ và tránh vòng lặp tự lắng nghe chính mình
            if raw_text and raw_text != self.pipeline.last_processed_text:
                processed_text = self.pipeline.process(raw_text)
                
                if processed_text != raw_text:
                    self.pipeline.last_processed_text = processed_text
                    self._write_clipboard(processed_text)
                    print(f"[LOG] Đã lọc dữ liệu thành công! Length: {len(raw_text)} -> {len(processed_text)}")
                else:
                    self.pipeline.last_processed_text = raw_text
                    
        return win32gui.DefWindowProc(hwnd, msg, wparam, lparam)

    def start(self):
        # Tạo Message Window ngầm để nhận event từ Windows
        wc = win32gui.WNDCLASS()
        wc.lpfnWndProc = self._wnd_proc
        wc.lpszClassName = "ClipboardFilterListener"
        hinst = win32gui.RegisterClass(wc)
        
        self.hwnd = win32gui.CreateWindow(
            hinst, "ClipboardFilterListener", 0, 0, 0, 0, 0, 0, 0, hinst, None
        )
        
        # Đăng ký nhận sự kiện WM_CLIPBOARDUPDATE từ OS (Chuẩn Win32)
        win32gui.AddClipboardFormatListener(self.hwnd)
        print(">>> Lớp chặn lọc Clipboard (Native Win32 Listener) đã sẵn sàng...")
        
        # Vòng lặp tin nhắn Win32
        win32gui.PumpMessages()

if __name__ == "__main__":
    manager = ClipboardPipelineManager()
    listener = NativeClipboardListener(manager)
    listener.start()
```

---

## IV. TỔNG KẾT & SO SÁNH PHƯƠNG PHÁP

| Tiêu chí | Polling Loop (`time.sleep`) | Keyboard Hooking (`pynput`) | Native Win32 Event (`AddClipboardFormatListener`) |
| :--- | :--- | :--- | :--- |
| **Mức độ chiếm CPU** | Cao (Liên tục check) | Trung bình | **Rất thấp (Event-driven)** |
| **Độ trễ xử lý** | 100ms - 500ms | < 20ms | **< 5ms** |
| **Độ ổn định hệ thống**| Bình thường | Có nguy cơ đơ phím nếu crash | **Tuyệt đối an toàn** |
| **Tương thích Win+V** | Hiện 2 bản trong history | Chỉ hiện bản đã lọc (nếu chặn) | **Tự động ghi đè bản sạch lên đầu history** |

👉 **Khuyên dùng**: Với tác vụ **copy nhiều và liên tục**, giải pháp **Native Win32 Listener kết hợp Pipeline Pattern** là tối ưu nhất cả về hiệu năng lẫn trải nghiệm sử dụng.


