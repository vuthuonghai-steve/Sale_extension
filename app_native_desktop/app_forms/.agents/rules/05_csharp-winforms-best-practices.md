# 05. C# WinForms Best Practices & Desktop Guidelines

Tài liệu này tổng hợp các thực tiễn tốt nhất khi lập trình C# .NET 6 và Windows Forms trong ứng dụng `AppForms`.

---

## 1. ⚙️ High-DPI & GDI+ Rendering

1. **SystemAware / PerMonitorV2 High DPI**:
   - Dự án được cấu hình `<ApplicationHighDpiMode>SystemAware</ApplicationHighDpiMode>` trong `AppForms.csproj`.
   - Khi custom painting (sử dụng `OnPaint`), luôn tính toán tọa độ tương đối theo kích thước `ClientRectangle` hoặc sử dụng `Scale(SizeF factor)`.
2. **Double Buffering chống Flicker (Nhấp nháy UI)**:
   - Mọi custom control và Screen Panel cần bật Double Buffering trong constructor:
     ```csharp
     SetStyle(ControlStyles.AllPaintingInWmPaint |
              ControlStyles.UserPaint |
              ControlStyles.DoubleBuffer |
              ControlStyles.OptimizedDoubleBuffer |
              ControlStyles.ResizeRedraw, true);
     UpdateStyles();
     ```
3. **Resource Disposal (Quản lý Tài nguyên đồ họa)**:
   - Các đối tượng `Pen`, `Brush`, `Font`, `Bitmap`, `GraphicsPath` khởi tạo trong `OnPaint` **bắt buộc** phải đặt trong khối `using` hoặc tái sử dụng từ Cache (`AppColors`, `AppFonts`) để tránh rò rỉ GDI Handles trên Windows.

---

## 2. 🧵 Threading & Thread-Safe UI

1. **InvokeRequired / BeginInvoke**:
   - Khi Service hoặc Background Worker trả về kết quả qua event/callback, **tuyệt đối không cập nhật UI trực tiếp** từ background thread:
     ```csharp
     if (this.InvokeRequired)
     {
         this.BeginInvoke(new Action(() => UpdateView(result)));
         return;
     }
     UpdateView(result);
     ```
2. **Async / Await Non-blocking UI**:
   - Các tác vụ I/O (đọc ghi file JSON, giải mã clipboard, gọi network nếu có) phải sử dụng `async/await` với `Task.Run` hoặc `CancellationToken`.
   - Tránh tuyệt đối `Task.Result` hoặc `.Wait()` trên UI thread vì sẽ gây Deadlock hoặc đơ giao diện.

---

## 3. ⌨️ Win32 Hooks, Hotkeys & Global Clipboard

1. **Win32 Clipboard Listener**:
   - Sử dụng `AddClipboardFormatListener` và `RemoveClipboardFormatListener` chuẩn Win32 API.
   - Luôn giải phóng listener khi Form đóng (`FormClosing` / `Dispose`) để không làm hỏng chuỗi Clipboard Chain của Windows.
2. **Global Hotkeys**:
   - Đăng ký qua `RegisterHotKey` / `UnregisterHotKey` với `atom` duy nhất. Bắt sự kiện `WM_HOTKEY` trong `WndProc`.

---

## 4. 🪟 Form Sizing, Anchors & Docking

- Ưu tiên sử dụng `TableLayoutPanel` và `FlowLayoutPanel` kết hợp `Dock = DockStyle.Fill` thay vì hard-code tọa độ `Location = new Point(x, y)`.
- Sử dụng `Padding` và `Margin` hợp lý để giao diện tự co giãn mượt mà khi người dùng resize cửa sổ ứng dụng.
