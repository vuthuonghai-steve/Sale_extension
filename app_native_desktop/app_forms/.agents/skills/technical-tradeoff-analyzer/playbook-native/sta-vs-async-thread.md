# 🧠 Playbook: Đánh Đổi Luồng Giao Diện STA vs Background Worker

> **Ngữ cảnh áp dụng:** Khi thiết kế luồng xử lý sự kiện OS (`WM_CLIPBOARDUPDATE`), ghi log, hoặc chạy các tác vụ parse/chuyển đổi dữ liệu nặng.

---

## 1. Bản Chất Bài Toán

Hệ điều hành Windows yêu cầu cửa sổ giao diện WinForms (`HWND`) và API Clipboard phải chạy trên luồng có thuộc tính `[STAThread]` với một **Message Pump** liên tục (`Application.Run()`).

```mermaid
flowchart TD
    OS["Windows Kernel\n(WM_CLIPBOARDUPDATE 0x031D)"] --> HWND["STA Message Loop\n(WndProc trên UI Thread)"]
    
    HWND --> OptionA["🅰️ Xử lý Đồng Bộ Trực Tiếp trên STA\n(Đọc -> Lọc -> Ghi File Log -> Cập nhật UI)"]
    HWND --> OptionB["🅱️ Bắn Sự Kiện Ra Background Queue\n(Channel<T> / Task.Run xử lý không block STA)"]
```

---

## 2. Bảng Ma Trận Đánh Đổi

| Tiêu Chí | 🅰️ Phương Án A: Xử Lý Đồng Bộ trên STA | 🅱️ Phương Án B: Phân Tách Background Channel |
| :--- | :--- | :--- |
| **Cơ chế** | Toàn bộ logic (đọc, Regex, ghi log file, cập nhật UI) chạy tuần tự trong hàm `WndProc` / Event Handler. | `WndProc` / Listener chỉ nhận message, đọc chuỗi nhanh và đẩy vào `System.Threading.Channels.Channel<T>` hoặc `Task.Run` cho Worker xử lý. |
| **Ưu điểm (Gains)** | • Luồng điều khiển đơn giản, tuần tự, không lo lỗi tranh chấp luồng (Thread Concurrency / Race Condition).<br>• Dễ debug từng bước. | • Luồng STA phản hồi ngay tức thì ($< 1\text{ms}$).<br>• Ghi log ra ổ cứng chậm hay nghẽn I/O không bao giờ làm đơ icon System Tray hoặc treo giao diện WinForms. |
| **Nhược điểm (Pains)** | • Nếu ghi file log bị nghẽn (Disk I/O lock) hoặc chuỗi quá dài $\rightarrow$ **Cửa sổ bị "Not Responding"**, bỏ lỡ sự kiện copy kế tiếp. | • Phức tạp hơn: Cần quản lý vòng đời của Background Worker, bắt buộc bọc cập nhật UI qua `FormStateObserver.InvokeOnUI`. |
| **Quyết định đề xuất** | **Chỉ áp dụng cho Pure Regex (< 2ms)** trong `1_Backend/Services`. | **Bắt buộc áp dụng cho File Logging, Network I/O & Heavy Tasks**. |

---

## 3. Quy Tắc Phối Hợp Tối Ưu (Hybrid Approach)

1. **Lọc văn bản / Parse nhẹ**: Chạy trực tiếp trên STA nếu độ dài chuỗi $< 100,000$ ký tự (thời gian xử lý $< 2\text{ms}$).
2. **Ghi Log & Tác vụ nền**: Bắt buộc chuyển sang hàng đợi non-blocking (ví dụ: `Channel<T>` hoặc Serilog Async Sink) để không chặn luồng UI.
3. **Cập nhật giao diện**: Mọi kết quả từ background thread phải được bọc trong `FormStateObserver.InvokeOnUI` để đảm bảo Thread-Safety.
