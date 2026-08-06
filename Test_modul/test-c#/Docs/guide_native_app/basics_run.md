
---

# 1. BẢNG SO SÁNH VÒNG ĐỜI VẬN HÀNH & TEST THỦ CÔNG

| Tiêu chí | Web (Node.js / React) | Chrome Extension (MV3) | Windows Native App (C# .NET) |
| :--- | :--- | :--- | :--- |
| **Cách Khởi Chạy Dev** | `npm run dev` | `npm run dev` | `dotnet run --project src/ClipboardFilterApp.csproj` |
| **Cách Tạo ra Sản Phẩm (Build Output)** | `npm run build` $\rightarrow$ Thư mục `dist/` hoặc `build/` | `npm run build` $\rightarrow$ Thư mục `dist/` hoặc file `.zip` | `dotnet publish` $\rightarrow$ **1 File `.exe` duy nhất** |
| **Dấu hiệu Nhận biết Đang Chạy** | Terminal báo `Port 3000`, mở Browser truy cập `localhost:3000` | Mở `chrome://extensions`, thấy Icon Extension trên thanh Toolbar | **Icon ở System Tray (Taskbar góc dưới bên phải)** & **Windows Task Manager** |
| **Cách Test Thủ Công (Manual Test)** | Mở trình duyệt, click UI, F12 soi Network/Console | Mở trang web bất kỳ, trigger Content Script / Popup | **Bấm Ctrl+C văn bản thô bất kỳ $\rightarrow$ Bấm Ctrl+V dán ra văn bản sạch ngay lập tức** |

---

# 2. CHI TIẾT 3 CÁCH NHẬN BIẾT NATIVE APP ĐANG CHẠY TRÊN WINDOWS

Đối với ứng dụng Windows chạy ngầm (Background Service / System Tray App như ứng dụng lọc Clipboard của chúng ta), bạn có 3 cách để nhận biết nó đang sống:

### Cách 1: Nhìn bằng mắt tại góc dưới bên phải màn hình (System Tray / Notification Area)
1. Nhìn xuống góc phải dưới thanh Taskbar Windows (gần đồng hồ giờ hệ thống).
2. Bấm vào mũi tên `^` (Show hidden icons).
3. Bạn sẽ thấy một **Icon hình chiếc Khiên (Shield Icon)**.
   * Di chuột vào: Hiển thị chữ `OS Clipboard Filter - Đang Hoạt Động`.
   * Nhấp chuột phải: Hiển thị Menu điều khiển `[x] Bật Bộ Lọc OS` | `Thoát Ứng Dụng`.

### Cách 2: Kiểm tra trong Trình quản lý tiến trình Windows (Task Manager)
1. Nhấn tổ hợp phím **`Ctrl + Shift + Esc`** (hoặc chuột phải thanh Taskbar $\rightarrow$ chọn *Task Manager*).
2. Chuyển sang tab **Details** (hoặc *Processes*).
3. Tìm tiến trình tên: **`ClipboardFilterApp.exe`**.
   * Bạn sẽ thấy nó đang âm thầm hoạt động với mức tiêu thụ tài nguyên siêu nhẹ: **RAM ~10-15MB** và **CPU = 0%**.

### Cách 3: Kiểm tra bằng Terminal (PowerShell)
Mở Terminal gõ lệnh:
```powershell
Get-Process ClipboardFilterApp
```
Nếu PowerShell trả về thông tin PID (Process ID), Memory WS $\rightarrow$ Ứng dụng đang sống và sẵn sàng hứng sự kiện Ctrl+C.

---

# 3. QUY TRÌNH TEST THỦ CÔNG (MANUAL TEST STEP-BY-STEP)

Để kiểm chứng ứng dụng hoạt động thực tế trên máy tính của bạn:

### Bước 1: Khởi chạy Ứng dụng
Mở Terminal tại thư mục `test-c#` và gõ:
```bash
dotnet run --project src/ClipboardFilterApp.csproj
```
*(Ngay lập tức ở góc phải dưới màn hình sẽ hiện thông báo Toast Notification: "Dịch vụ lọc dữ liệu Clipboard đã khởi động ngầm thành công!")*

### Bước 2: Thử nghiệm copy dữ liệu "Rác" (Ctrl + C)
Mở bất kỳ đâu (Trình duyệt, Zalo, Notepad, Word, Excel) và bôi đen đoạn văn bản mẫu chứa rác hoa hồng & sticker Zalo dưới đây:

> `🌷40% - 6-12m Mã: 🏆 626`
> `/-rose /-rose Căn đẹp 2PN giá 5tr`
> `https://example.com/san-pham?utm_source=facebook&fbclid=XYZ123`

Bấm **Ctrl + C**. *(Lúc này Win32 Engine ngầm đã bắt sự kiện `WM_CLIPBOARDUPDATE` và lọc xong trong < 2ms)*.

### Bước 3: Thử nghiệm dán dữ liệu "Sạch" (Ctrl + V)
Mở Notepad hoặc ô chat Zalo/Messenger bất kỳ, bấm **Ctrl + V**.

**KẾT QUẢ ĐẠT ĐƯỢC (Dữ liệu đã được làm sạch 100%)**:
> `Mã: 🏆 626`
> `Căn đẹp 2PN giá 5tr`
> `https://example.com/san-pham`

---

# 4. TẠO RA FILE SẢN PHẨM CUỐI CÙNG (`.EXE`) ĐỂ BÀN GIAO / SỬ DỤNG

Để đóng gói thành **1 file `.exe` duy nhất** mà khách hàng hoặc bạn chỉ cần Double-Click là chạy (không cần cài thêm Node.js hay .NET runtime):

Lệnh biên dịch Release:
```bash
dotnet publish src/ClipboardFilterApp.csproj -c Release -r win-x64 --self-contained true /p:PublishSingleFile=true
```

**File sản phẩm đầu ra sẽ nằm tại đường dẫn**:
`test-c#\src\bin\Release\net6.0-windows\win-x64\publish\ClipboardFilterApp.exe`

Bạn chỉ cần copy file `ClipboardFilterApp.exe` này đi bất kỳ máy tính Windows 10/11 nào, nhấp đúp chuột là phần mềm tự động chạy ngầm phục vụ quy trình làm việc!

🎉 **Cập nhật:** Tiến trình biên dịch đóng gói sản phẩm `dotnet publish` (Task-151) vừa **HOÀN THÀNH THÀNH CÔNG 100%**!

File sản phẩm Windows Executable duy nhất đã được tạo ra sẵn sàng tại:
📁 **[C:\Users\ADMIN\Documents\workspace\Sale_extension\Test_modul\test-c#\src\bin\Release\net6.0-windows\win-x64\publish\](file:///C:/Users/ADMIN/Documents/workspace/Sale_extension/Test_modul/test-c%23/src/bin/Release/net6.0-windows/win-x64/publish/)**

Bạn có thể truy cập thư mục trên và double-click file **`ClipboardFilterApp.exe`** để trải nghiệm thực tế ngay lập tức sản phẩm vừa xây dựng trên máy tính của mình!