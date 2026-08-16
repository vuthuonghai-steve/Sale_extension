# 🧠 Playbook: Đánh Đổi Unmanaged P/Invoke vs Managed C# Memory

> **Ngữ cảnh áp dụng:** Khi thiết kế hoặc sửa đổi các Adapter giao tiếp với Win32 OS APIs (`user32.dll`, `kernel32.dll`), đặc biệt là đọc/ghi Windows Clipboard hoặc hook phím tắt.

---

## 1. Bản Chất Bài Toán

Giao tiếp với Clipboard cấp thấp trong Windows Native đòi hỏi tương tác với bộ nhớ hệ thống thông qua `GlobalAlloc(GMEM_MOVEABLE)` và `SetClipboardData(CF_UNICODETEXT)`.

```mermaid
flowchart LR
    subgraph Managed[CLR Managed Space]
        Str[C# string / byte[]]
    end
    
    subgraph Unmanaged[Windows OS Unmanaged Space]
        HMem[GlobalAlloc Handle] --> Lock[GlobalLock Pointer]
        Lock --> Set[SetClipboardData]
    end
    
    Str -->|Marshal.Copy| Lock
```

---

## 2. Bảng Ma Trận Đánh Đổi

| Tiêu Chí | 🅰️ Phương Án 1: WinForms `Clipboard.SetText` | 🅱️ Phương Án 2: Win32 P/Invoke Direct (`Win32ClipboardAdapter`) |
| :--- | :--- | :--- |
| **Cơ chế** | Sử dụng thư viện `System.Windows.Forms.Clipboard` đóng gói sẵn của .NET. | Gọi trực tiếp `OpenClipboard`, `EmptyClipboard`, `GlobalAlloc`, `SetClipboardData` qua `DllImport`. |
| **Ưu điểm (Gains)** | • Code cực kỳ ngắn gọn (1 dòng).<br>• CLR tự quản lý bộ nhớ, không sợ rò rỉ con trỏ. | • Tốc độ phản hồi cực nhanh.<br>• Kiểm soát được mã lỗi Win32 chi tiết (`GetLastError()`).<br>• Cài đặt được Exponential Backoff Retry khi bị lock. |
| **Nhược điểm (Pains)** | • Hay ném ngoại lệ ngầm `ExternalException` khi Clipboard bị ứng dụng khác (Word/Excel) lock mà không tự retry được.<br>• Buộc tầng logic phải phụ thuộc context WinForms. | • Phải tự quản lý bộ nhớ unmanaged.<br>• Nguy cơ Memory Leak nếu quên `GlobalFree` khi `SetClipboardData` thất bại. |
| **Vị trí áp dụng chuẩn** | Màn hình UI hoặc thao tác thủ công từ phía người dùng. | **Tầng Native Adapter chạy ngầm trong `1_Backend/Win32`**. |

---

## 3. Quy Tắc Phòng Vệ Bắt Buộc (Defensive Rules)

Khi chọn phương án **Win32 P/Invoke Direct**:

1. **Bắt buộc dùng `try...finally`**:
   ```csharp
   IntPtr hMem = GlobalAlloc(GMEM_MOVEABLE | GMEM_ZEROINIT, bytesSize);
   if (hMem == IntPtr.Zero) return false;

   bool success = false;
   try
   {
       IntPtr pMem = GlobalLock(hMem);
       if (pMem != IntPtr.Zero)
       {
           Marshal.Copy(bytes, 0, pMem, bytes.Length);
           GlobalUnlock(hMem);
           success = SetClipboardData(CF_UNICODETEXT, hMem) != IntPtr.Zero;
       }
   }
   finally
   {
       // QUY TẮC SỐNG CÒN: Nếu ghi thất bại, Windows KHÔNG sở hữu hMem -> Ta phải tự giải phóng!
       if (!success && hMem != IntPtr.Zero)
       {
           GlobalFree(hMem);
       }
   }
   ```
2. **Không để rò rỉ Exception**: Luôn bọc trong khối an toàn trả về `bool` hoặc `Result<T>` và ghi log mã lỗi cụ thể.
