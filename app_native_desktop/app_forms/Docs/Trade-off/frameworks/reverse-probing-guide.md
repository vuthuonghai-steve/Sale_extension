# 🔍 Framework: Reverse Probing & Failure Mode Analysis

> **Vị trí trong hệ thống:** Thuộc nhóm `Docs/Trade-off/frameworks/`. Được nạp on-demand khi chuẩn bị viết code, thiết kế thuật toán mới hoặc kiểm tra lỗ hổng logic.

---

## 1. Bản Chất của Reverse Probing (Tư Duy Đặt Câu Hỏi Ngược)

Thay vì hỏi: *"Làm thế nào để tính năng này hoạt động trên happy path?"*, Reverse Probing bắt buộc Agent phải hỏi:
> **"Giải pháp này sẽ sập, treo máy, hoặc phá hoại hệ thống như thế nào trong điều kiện thực tế khắc nghiệt nhất?"**

```mermaid
flowchart TD
    Idea["Ý tưởng / Giải pháp Kỹ thuật"] --> Probe1["1. Extreme Input Probe\n(Chuỗi 10MB, Unicode lỗi, Null, Empty)"]
    Idea --> Probe2["2. Resource Contention Probe\n(Tiến trình khác lock Clipboard WinError 5)"]
    Idea --> Probe3["3. Infinite Loop Feedback Probe\n(App tự bắt event do chính mình bắn ra)"]
    Idea --> Probe4["4. Memory & Handle Leak Probe\n(GlobalAlloc không GlobalFree khi ném lỗi)"]
    Idea --> Probe5["5. Thread Starvation Probe\n(I/O đồng bộ làm nghẽn STA Message Pump)"]
    
    Probe1 & Probe2 & Probe3 & Probe4 & Probe5 --> Defense["🛡️ Thiết kế Mã Phòng Vệ\n(Defensive Architecture)"]
```

---

## 2. Danh Mục 5 Kịch Bản Thất Bại Kinh Điển (The 5 Failure Modes)

### 🔴 Kịch bản 1: Clipboard Lock Contention (`WinError 5` / `CLIPBRD_E_CANT_OPEN`)
- **Tình huống**: Khi người dùng copy trong Microsoft Excel, Word, hoặc Photoshop, tiến trình đó sẽ khóa chặt Clipboard để render nhiều định dạng (HTML, RTF, Bitmap). Nếu app gọi `OpenClipboard` ngay lập tức, API sẽ trả về lỗi `0` (`Access Denied`).
- **Phòng vệ bắt buộc**: Áp dụng **Exponential Backoff Retry** (thử lại tối đa 5 lần: $5\text{ms}, 10\text{ms}, 20\text{ms}, 40\text{ms}, 80\text{ms}$).

### 🔴 Kịch bản 2: Vòng Lặp Phản Hồi Vô Tận (Infinite Feedback Loop)
- **Tình huống**: App bắt sự kiện `WM_CLIPBOARDUPDATE` $\rightarrow$ Lọc chuỗi $\rightarrow$ Gọi `SetClipboardData` $\rightarrow$ Hệ điều hành Windows lại phát tiếp sự kiện `WM_CLIPBOARDUPDATE` $\rightarrow$ App lại bắt và ghi tiếp.
- **Phòng vệ bắt buộc**: Lưu vết nội dung vừa ghi (`_lastProcessedText` hoặc SHA-256 Hash). Khi sự kiện mới tới, nếu trùng với nội dung vừa ghi thì **bỏ qua ngay lập tức**.

### 🔴 Kịch bản 3: Vỡ Ký Tự Unicode Ngoại Bảng (Surrogate Pair Truncation)
- **Tình huống**: Biểu thức Regex hoặc hàm cắt chuỗi xử lý emoji 4-bytes (như sticker Zalo $\text{U+1F600}$) bị cắt đôi thành 2 mã UTF-16 riêng biệt $\rightarrow$ Gây lỗi ký tự rác () hoặc crash Regex.
- **Phòng vệ bắt buộc**: Luôn xử lý Regex với `RegexOptions.CultureInvariant` và nhận diện đầy đủ cụm Surrogate Pairs (`[\uD800-\uDBFF][\uDC00-\uDFFF]`).

### 🔴 Kịch bản 4: Rò Rỉ Tài Nguyên Unmanaged (Memory/GDI Handle Leak)
- **Tình huống**: Gọi `GlobalAlloc(GMEM_MOVEABLE)` nhưng `SetClipboardData` thất bại hoặc ném Exception ở giữa $\rightarrow$ Con trỏ `hMem` bị bỏ rơi, RAM tăng liên tục mỗi lần người dùng bấm Ctrl+C.
- **Phòng vệ bắt buộc**: Toàn bộ logic P/Invoke phải bọc trong `try...finally`. Nếu `SetClipboardData == IntPtr.Zero`, bắt buộc gọi `GlobalFree(hMem)`.

### 🔴 Kịch bản 5: Nghẽn Luồng Giao Diện STA (STA Thread Starvation)
- **Tình huống**: Ghi file Log bằng `File.AppendAllText` đồng bộ hoặc chạy xử lý Regex chuỗi 5MB ngay trên luồng chính STA.
- **Phòng vệ bắt buộc**: Đẩy việc nặng ra Background Thread (`Task.Run` hoặc `Channel<T>`), giữ hàm `WndProc` phản hồi dưới $5\text{ms}$.

---

## 3. Quy Trình Bóc Tách Negative Space (Vùng Cấm Kỹ Thuật)

Khi phân tích bất kỳ bài toán nào, Agent phải ghi rõ tối thiểu **3 điều CẤM LÀM**:

```yaml
negative_space_contract:
  must_not_1: 'CẤM chặn luồng STA bằng Thread.Sleep() hoặc I/O đồng bộ nặng.'
  consequence_1: 'Làm đơ System Tray icon, Windows báo ứng dụng Not Responding.'
  
  must_not_2: 'CẤM import System.Windows.Forms hoặc P/Invoke vào 3_Modules/.'
  consequence_2: 'Phá vỡ Clean Architecture, không thể viết Unit Test thuần túy.'
  
  must_not_3: 'CẤM nuốt ngoại lệ (Empty Catch Block) khi gọi Win32 API.'
  consequence_3: 'Che giấu lỗi hệ thống âm thầm, không thể debug sự cố.'
```
