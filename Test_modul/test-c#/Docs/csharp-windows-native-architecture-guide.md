# GIÁO TRÌNH KIẾN TRÚC & GIẢI PHẪU NỀN TẢNG WINDOWS NATIVE APPLICATION VỚI C# (.NET)

> **Dành cho**: Lập trình viên có nền tảng Web / Chrome Extension (MV3 / Next.js / Node.js) chuyển bước sang thiết kế phần mềm hệ thống chạy ngầm trên Windows OS.

---

## MỤC LỤC

1. [Tổng Quan & Chuyển Đổi Mental Model (Web $\rightarrow$ Windows Native)](#1)
2. [Cơ Chế Vận Hành Tầng Đáy Windows OS (Windows OS Internals)](#2)
   - 2.1 [Win32 API & Cơ chế P/Invoke (Platform Invoke)](#21)
   - 2.2 [Message Window (HWND) & Vòng lặp sự kiện Windows (Message Pump)](#22)
   - 2.3 [Quản lý Bộ nhớ Unmanaged (GlobalAlloc, GlobalLock, Marshal)](#23)
3. [Cơ Chế Vận Hành & Nguyên Lý Thực Thi C# .NET](#3)
   - 3.1 [CLR Runtime, Garbage Collection (GC) & String Immutability](#31)
   - 3.2 [UTF-16 Encoding & Bẫy Emoji Surrogate Pairs trong Regex C#](#32)
   - 3.3 [Tối ưu hóa Hiệu năng với Compiled Regex & Native AOT](#33)
4. [Bóc Tách Chi Tiết 5 Tầng Kiến Trúc Clean Architecture](#4)
   - 4.1 [Layer 0: Contracts — Nguồn Sự Thật Duy Nhất](#41)
   - 4.2 [Layer 1: Engine — Bộ Lắng Nghe & Điều Phối Sự Kiện OS](#42)
   - 4.3 [Layer 2: Platform Adapters — Lớp Bọc An Toàn Win32 API](#43)
   - 4.4 [Layer 3: Business Modules — Logic Nghiệp Vụ Thuần C# (Pure Testable)](#44)
   - 4.5 [Layer 4: Presentation — Giao Diện System Tray Taskbar](#45)
5. [Tấn Công & Phòng Thủ Kỹ Thuật (Reverse Probing & Anti-Patterns)](#5)
   - 5.1 [Tránh vòng lặp tự kích hoạt Clipboard (Infinite Loop Prevention)](#51)
   - 5.2 [Xử lý lỗi Clipboard Lock (WinError 5) với Exponential Backoff](#52)
   - 5.3 [Phòng chống Memory Leak & Giải phóng Unmanaged Resource](#53)
6. [Quy Trình Kiểm Thử Tự Động & Đóng Gói Sản Phẩm](#6)

---

<a name="1"></a>

## 1. TỔNG QUAN & CHUYỂN ĐỔI MENTAL MODEL (WEB $\rightarrow$ WINDOWS NATIVE)

### 1.1 Sự khác biệt về Luật Vật Lý Hệ Thống

Khi làm việc trên Web hoặc Chrome Extension (MV3), lập trình viên làm việc trong một môi trường **Sandbox** được cách ly bởi Trình duyệt. Khi chuyển sang **Windows OS Native Application**, bạn làm việc trực tiếp với Hệ điều hành.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CHROME EXTENSION MV3 (WEB SANDBOX)                   │
│  - Vòng đời: Service Worker bị Chrome random kill sau ~30s idle         │
│  - Bộ nhớ: Không tin tưởng memory; phải lưu state ra chrome.storage    │
│  - Thực thi: Đơn luồng (Single-Threaded JS Event Loop)                  │
│  - Quyền hạn: Giới hạn bởi Trình duyệt & Chính sách CSP                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ SHIFT MENTAL MODEL
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                 WINDOWS NATIVE SYSTEM LAYER (C# .NET)                   │
│  - Vòng đời: Ứng dụng ngầm sống liên tục (Persistent Background App)   │
│  - Bộ nhớ: Giữ state trong RAM thoải mái, tối ưu qua GC & Struct        │
│  - Thực thi: Đa luồng (Multi-Threaded / System Thread Pool)             │
│  - Quyền hạn: Quyền Native OS, gọi trực tiếp Win32 Kernel & User APIs  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Bảng Ánh Xạ Khái Niệm Kỹ Thuật (Technological Mapping)

| Khái niệm trên Web / Extension | Khái niệm tương đương trong C# Windows Native | Mô tả bản chất |
| :--- | :--- | :--- |
| `chrome.runtime.onMessage` | `WndProc` (Windows Window Procedure) | Cơ chế hứng và xử lý các thông điệp/sự kiện phát ra từ OS Kernel. |
| `chrome.offscreen` document | Invisible Native Window (`HWND`) | Cửa sổ ẩn tạo ra chỉ để hứng sự kiện Win32 mà không hiển thị UI. |
| `chrome.storage.local` | File System / Registry / AppData / SQLite | Nơi lưu trữ cấu hình persistent trên ổ cứng người dùng. |
| `console.log` | `System.Diagnostics.Debug.WriteLine` | Hệ thống log chuẩn của C# xuất ra Output Window / Debugger. |
| Vitest / Jest | xUnit / NUnit | Khung kiểm thử tự động nhị phân cho mã nguồn C#. |

---

<a name="2"></a>

## 2. CƠ CHẾ VẬN HÀNH TẦNG ĐÁY WINDOWS OS (WINDOWS OS INTERNALS)

Để làm chủ việc can thiệp Clipboard toàn hệ thống, lập trình viên cần hiểu 3 cơ chế tầng đáy của Windows OS:

### 2.1 Win32 API & Cơ chế P/Invoke (Platform Invoke)
C# chạy trên môi trường Quản lý (`Managed Code` - .NET CLR). Hệ điều hành Windows lại chạy trên mã C/C++ (`Unmanaged Native Code`). Để C# gọi được các hàm từ các file DLL của Windows như `user32.dll` hay `kernel32.dll`, C# sử dụng kỹ thuật **P/Invoke** qua thuộc tính `[DllImport]`.

```csharp
// Ví dụ P/Invoke khai báo hàm OpenClipboard từ DLL user32 của Windows OS
[DllImport("user32.dll", SetLastError = true)]
public static extern bool OpenClipboard(IntPtr hWndNewOwner);
```

### 2.2 Message Window (HWND) & Vòng lặp sự kiện Windows (Message Pump)
Windows OS quản lý mọi sự kiện (Click chuột, gõ phím, Clipboard thay đổi) bằng cơ chế **Message Queue**.
* Mỗi khi có thao tác Ctrl+C trên bất kỳ ứng dụng nào (Zalo, Browser, Excel), Windows Subsystem sẽ tạo một thông điệp tên là `WM_CLIPBOARDUPDATE` (`0x031D`).
* Để nhận được thông điệp này, C# cần tạo một cửa sổ ẩn (`Invisible Native Window`) nhận một tay nắm gọi là **`HWND` (Handle to a Window)**.
* Hàm `AddClipboardFormatListener(HWND)` đăng ký với Windows OS: *"Hễ Clipboard thay đổi, hãy gửi tin nhắn WM_CLIPBOARDUPDATE vào HWND này!"*.

```
[ Người dùng bấm Ctrl + C trên bất kỳ App nào ]
                     │
                     ▼
       ┌───────────────────────────┐
       │ Windows OS Kernel / User  │
       └─────────────┬─────────────┘
                     │ Bắn thông điệp WM_CLIPBOARDUPDATE (0x031D)
                     ▼
       ┌───────────────────────────┐
       │ Native Message Window     │ <--- Được tạo bởi C# (NativeClipboardListener)
       │ (Có tay nắm HWND độc lập) │
       └─────────────┬─────────────┘
                     │ Trích xuất Raw Text & Chuyển qua Pipeline
                     ▼
       ┌───────────────────────────┐
       │  Clipboard Pipeline Logic │
       └───────────────────────────┘
```

### 2.3 Quản lý Bộ nhớ Unmanaged (GlobalAlloc, GlobalLock, Marshal)
Khi ghi một đoạn văn bản lên Clipboard của Windows OS:
1. C# không thể đưa thẳng đối tượng `string` trong RAM của .NET sang OS.
2. C# phải cấp phát một vùng nhớ HĐH toàn cục bằng `GlobalAlloc(GMEM_MOVEABLE)`.
3. Khóa vùng nhớ bằng `GlobalLock(hMem)` để lấy con trỏ RAM thực tế (`IntPtr`).
4. Sao chép dữ liệu byte Unicode từ C# vào vùng nhớ OS bằng `Marshal.Copy()`.
5. Mở khóa `GlobalUnlock(hMem)` và chuyển cho OS qua `SetClipboardData()`.

---

<a name="3"></a>

## 3. CƠ CHẾ VẬN HÀNH & NGUYÊN LÝ THỰC THI C# .NET

### 3.1 CLR Runtime, Garbage Collection (GC) & String Immutability
* **Garbage Collector (GC)**: C# tự động dọn dẹp các đối tượng RAM không còn sử dụng. Tuy nhiên, nếu tạo ra quá nhiều chuỗi rác trong vòng lặp copy, GC sẽ phải gián đoạn ứng dụng để dọn dẹp (GC Pauses).
* **String Immutability**: Trong C#, chuỗi `string` là bất biến (immutable). Mỗi lần gọi `text.Replace()`, C# tạo ra một vùng nhớ chuỗi hoàn toàn mới. Do đó, các bộ lọc phải được thiết kế tinh gọn để hạn chế allocation thừa.

### 3.2 UTF-16 Encoding & Bẫy Emoji Surrogate Pairs trong Regex C#
Đây là một bài học kiến trúc đắt giá:
* C# biểu diễn chuỗi bằng chuẩn **UTF-16 (16-bit code units)**.
* Hầu hết các ký tự văn bản thông thường chiếm 1 code unit (2 bytes). Nhưng các biểu tượng Emoji (như 🌷, 🌸, 🏆) là ký tự 32-bit, được C# ghép lại bởi 2 code units 16-bit gọi là **Surrogate Pair** (High Surrogate + Low Surrogate).
* **Bẫy Regex**: Nếu viết Regex C# dạng `[🌷🌸🌺]` trong ngoặc vuông, C# Regex Engine sẽ tách rời từng nửa Surrogate Pair ra, khiến kết quả lọc bị lỗi và làm xuất hiện các ký tự rác `?` ở đầu dòng văn bản.
* **Giải pháp chuẩn hóa**: Nhóm Emoji bằng nhóm tùy chọn `(?:🌷|🌸|🌺)` thay vì dùng ngoặc vuông `[...]`.

```csharp
// SAU CHUẨN HÓA: An toàn tuyệt đối với UTF-16 Surrogate Pairs trong C#
private static readonly Regex CommissionPattern = new(
    @"(?:(?:(?:hh|hoa[ \t]*hồng):?|(?:\/-[a-z0-9_]+|(?:🌷|🌸|🌺|🌻|🌹|💐)))[ \t]*...",
    RegexOptions.IgnoreCase | RegexOptions.Compiled
);
```

### 3.3 Tối ưu hóa Hiệu năng với Compiled Regex & Native AOT
* **`RegexOptions.Compiled`**: Biên dịch biểu thức Regex thành mã MSIL trực tiếp khi ứng dụng khởi động, giúp tốc độ khớp Regex tăng từ 5x đến 10x so với Regex dịch runtime.
* **Native AOT (Ahead-of-Time Compilation)**: Công nghệ cho phép biên dịch C# thẳng thành mã máy Win32 executable duy nhất (`.exe`), khởi động tức thì trong 1ms, không cần cài đặt .NET Framework trên máy người dùng, dung lượng RAM chỉ ăn ~10MB.

---

<a name="4"></a>

## 4. BÓC TÁCH CHI TIẾT 5 TẦNG KIẾN TRÚC CLEAN ARCHITECTURE

Dự án tại `test-c#` được giải phẫu thành 5 tầng chuyên biệt tuyệt đối, đảm bảo tính độc lập và khả năng mở rộng lâu dài:

```
                  ┌─────────────────────────────────────────┐
                  │      LAYER 4: PRESENTATION LAYER        │
                  │   (SystemTrayApplicationContext.cs)     │
                  └────────────────────┬────────────────────┘
                                       │ Calls
                  ┌────────────────────▼────────────────────┐
                  │      LAYER 3: BUSINESS MODULES          │
                  │ (Unicode, Sticker, Commission Filters)  │
                  └────────────────────┬────────────────────┘
                                       │ Implements Interfaces
                  ┌────────────────────▼────────────────────┐
                  │      LAYER 2: PLATFORM ADAPTERS         │
                  │      (Win32ClipboardAdapter.cs)         │
                  └────────────────────┬────────────────────┘
                                       │ Invokes Native APIs
                  ┌────────────────────▼────────────────────┐
                  │         LAYER 1: ENGINE LAYER           │
                  │  (NativeClipboardListener & Pipeline)   │
                  └────────────────────┬────────────────────┘
                                       │ References Contracts
                  ┌────────────────────▼────────────────────┐
                  │        LAYER 0: CONTRACTS LAYER         │
                  │ (IClipboardFilter, DTOs, Options Schema)│
                  └─────────────────────────────────────────┘
```

---

### 4.1 Layer 0: Contracts — Nguồn Sự Thật Duy Nhất

* **Đường dẫn**: `src/0_Contracts/`
* **Nhiệm vụ**: Định nghĩa các Interface, DTOs (Data Transfer Objects), Enum và Schema cấu hình.
* **Quy tắc vàng**: **Tuyệt đối không import bất kỳ thư viện UI hay Win32 API nào vào Layer 0**. Tầng này hoàn toàn độc lập.

#### Code minh họa (`IClipboardFilter.cs`):
```csharp
namespace ClipboardFilterApp.Contracts;

public interface IClipboardFilter
{
    string Name { get; }
    int Priority { get; } // Độ ưu tiên thực thi trong chuỗi Pipeline
    string Process(string text); // Hàm nhận text thô và trả text sạch
}
```

---

### 4.2 Layer 1: Engine — Bộ Lắng Nghe & Điều Phối Sự Kiện OS

* **Đường dẫn**: `src/1_Engine/`
* **Nhiệm vụ**: Quản lý vòng đời chạy ngầm, tạo cửa sổ ẩn hứng `WM_CLIPBOARDUPDATE`, điều phối dữ liệu từ HĐH sang Pipeline và ngược lại.
* **Thành phần cốt lõi**: `NativeClipboardListener.cs` kế thừa `NativeWindow` để nhận sự kiện Win32.

#### Code minh họa (`NativeClipboardListener.cs`):
```csharp
namespace ClipboardFilterApp.Engine;

public class NativeClipboardListener : NativeWindow, IDisposable
{
    public event EventHandler? ClipboardUpdated;

    public NativeClipboardListener()
    {
        // Tạo cửa sổ ẩn để gán HWND
        CreateParams cp = new CreateParams { Caption = "Win32ClipboardListenerWindow" };
        CreateHandle(cp);
        
        // Đăng ký với Windows OS
        Win32ClipboardAdapter.AddClipboardFormatListener(Handle);
    }

    protected override void WndProc(ref Message m)
    {
        if (m.Msg == Win32ClipboardAdapter.WM_CLIPBOARDUPDATE)
        {
            ClipboardUpdated?.Invoke(this, EventArgs.Empty);
        }
        base.WndProc(ref m);
    }

    public void Dispose()
    {
        Win32ClipboardAdapter.RemoveClipboardFormatListener(Handle);
        DestroyHandle();
        GC.SuppressFinalize(this);
    }
}
```

---

### 4.3 Layer 2: Platform Adapters — Lớp Bọc An Toàn Win32 API

* **Đường dẫn**: `src/2_PlatformAdapters/`
* **Nhiệm vụ**: Bọc trực tiếp các hàm P/Invoke C/C++ của Windows OS. Chịu trách nhiệm đọc/ghi dữ liệu an toàn lên Clipboard và xử lý các ngoại lệ hệ thống.

#### Mã nguồn bọc an toàn Win32 (`Win32ClipboardAdapter.cs`):
```csharp
namespace ClipboardFilterApp.PlatformAdapters;

public static class Win32ClipboardAdapter
{
    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool OpenClipboard(IntPtr hWndNewOwner);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool CloseClipboard();

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool EmptyClipboard();

    // Đọc văn bản an toàn với try...finally đóng cửa sổ Clipboard
    public static string? SafeReadClipboardText()
    {
        if (!OpenClipboard(IntPtr.Zero)) return null;
        try
        {
            IntPtr hData = GetClipboardData(CF_UNICODETEXT);
            if (hData == IntPtr.Zero) return null;
            IntPtr pText = GlobalLock(hData);
            try { return Marshal.PtrToStringUni(pText); }
            finally { GlobalUnlock(hData); }
        }
        finally { CloseClipboard(); }
    }
}
```

---

### 4.4 Layer 3: Business Modules — Logic Nghiệp Vụ Thuần C# (Pure Testable)

* **Đường dẫn**: `src/3_Modules/`
* **Nhiệm vụ**: Chứa logic xử lý văn bản, lọc Regex, chuẩn hóa Unicode.
* **Chia nhỏ mô-đun**:
  * `SubModules/`: Các filter đơn lẻ (`UnicodeSanitizerFilter`, `ZaloStickerFilter`, `CommissionRegexFilter`, `UrlSanitizerFilter`).
  * `CompositeModules/`: `ClipboardPipelineManager` điều phối chuỗi filter thực thi theo thứ tự ưu tiên.

#### Code minh họa Chuỗi Pipeline (`ClipboardPipelineManager.cs`):
```csharp
namespace ClipboardFilterApp.Modules.CompositeModules;

public class ClipboardPipelineManager
{
    private readonly List<IClipboardFilter> _filters;

    public ClipboardPipelineManager(FilterOptions options, IEnumerable<IClipboardFilter> filters)
    {
        // Sắp xếp các bộ lọc theo thứ tự Priority tăng dần
        _filters = filters.OrderBy(f => f.Priority).ToList();
    }

    public string Process(string rawText)
    {
        if (string.IsNullOrEmpty(rawText)) return rawText;

        string currentText = rawText;
        foreach (var filter in _filters)
        {
            currentText = filter.Process(currentText);
        }

        return FinalWhitespaceCleanup(currentText);
    }
}
```

---

### 4.5 Layer 4: Presentation — Giao Diện System Tray Taskbar

* **Đường dẫn**: `src/4_Presentation/`
* **Nhiệm vụ**: Hiển thị Icon ứng dụng dưới góc phải màn hình Windows (Taskbar Tray System), cung cấp Menu ngữ cảnh chuột phải để người dùng bật/tắt filter hoặc thoát ứng dụng.

#### Code minh họa (`SystemTrayApplicationContext.cs`):
```csharp
namespace ClipboardFilterApp.Presentation;

public class SystemTrayApplicationContext : ApplicationContext
{
    private readonly NotifyIcon _notifyIcon;

    public SystemTrayApplicationContext(FilterOptions options)
    {
        ContextMenuStrip contextMenu = new ContextMenuStrip();
        contextMenu.Items.Add(new ToolStripMenuItem("Bật/Tắt Lọc OS", null, OnToggle));
        contextMenu.Items.Add(new ToolStripMenuItem("Thoát", null, OnExit));

        _notifyIcon = new NotifyIcon
        {
            Icon = SystemIcons.Shield,
            ContextMenuStrip = contextMenu,
            Text = "OS Clipboard Filter - Đang Chạy Ngầm",
            Visible = true
        };
    }

    private void OnExit(object? sender, EventArgs e)
    {
        _notifyIcon.Visible = false;
        Application.Exit();
    }
}
```

---

<a name="5"></a>

## 5. TẤN CÔNG & PHÒNG THỦ KỸ THUẬT (REVERSE PROBING & ANTI-PATTERNS)

### 5.1 Tránh Vòng Lặp Tự Kích Hoạt Clipboard (Infinite Loop Prevention)
* **Nguy cơ**: Khi ứng dụng lọc xong văn bản $\rightarrow$ Nó gọi `SetClipboardData()` để ghi text sạch. Windows thấy Clipboard đổi liền phát sự kiện `WM_CLIPBOARDUPDATE` thứ hai $\rightarrow$ Ứng dụng lại nhảy vào lọc $\rightarrow$ **Vòng lặp vô tận gây 100% CPU**.
* **Giải pháp phòng thủ**: Lưu lại dấu vết `_lastProcessedText`. Chỉ ghi đè lên Clipboard khi và chỉ khi văn bản đã lọc KHÁC HOÀN TOÀN văn bản thô ban đầu.

```csharp
// Kỹ thuật chặn Infinite Loop trong PipelineOrchestrator.cs
if (processedText != rawText)
{
    _lastProcessedText = processedText;
    Win32ClipboardAdapter.SafeWriteClipboardText(processedText);
}
```

### 5.2 Xử lý Lỗi Clipboard Lock (`WinError 5`) với Exponential Backoff
* **Nguy cơ**: Khi người dùng copy số lượng lớn ô trong Excel, Excel giữ chặt Clipboard. Nếu C# gọi `OpenClipboard()` ngay lập tức sẽ bị OS từ chối (Lỗi `WinError 5: Access Denied`).
* **Giải pháp phòng thủ**: Sử dụng thuật toán **Exponential Backoff Retry** (Thử lại với độ trễ lũy thừa: 5ms $\rightarrow$ 10ms $\rightarrow$ 20ms $\rightarrow$ 40ms $\rightarrow$ 80ms).

```csharp
// Kỹ thuật Exponential Backoff trong Win32ClipboardAdapter.cs
for (int i = 0; i < maxRetries; i++)
{
    if (OpenClipboard(IntPtr.Zero))
    {
        // Ghi dữ liệu thành công
        return true;
    }
    // Độ trễ lũy thừa chờ ứng dụng khác nhả Clipboard
    Thread.Sleep(5 * (1 << i));
}
```

### 5.3 Phòng chống Memory Leak & Giải phóng Unmanaged Resource
* **Nguy cơ**: Cửa sổ ẩn `HWND` của Win32 API nếu không được hủy khi thoát app sẽ khiến Windows bị cạn kiệt tài nguyên GDI Handle.
* **Giải pháp phòng thủ**: Bắt buộc implements giao diện `IDisposable` cho `NativeClipboardListener` và gọi `RemoveClipboardFormatListener(Handle)` cũng như `DestroyHandle()`.

---

<a name="6"></a>

## 6. QUY TRÌNH KIỂM THỬ TỰ ĐỘNG & ĐÓNG GÓI SẢN PHẨM

### 6.1 Kiểm Thử Tự Động Nhị Phân với xUnit (`tests/Modules.Tests/`)
Do tầng `3_Modules` được tách biệt hoàn toàn không phụ thuộc Win32 API, việc viết Unit Test vô cùng đơn giản và chạy nhanh trong 3ms:

```csharp
public class PipelineTests
{
    [Fact]
    public void Should_Remove_Zalo_Sticker_And_Commission()
    {
        ClipboardPipelineManager pipeline = SetupPipeline();
        string rawInput = "🌷40% - 6-12m Mã: 🏆 626\n/-rose /-rose Căn đẹp 2PN";
        string expected = "Mã: 🏆 626\nCăn đẹp 2PN";

        string actual = pipeline.Process(rawInput);
        Assert.Equal(expected, actual);
    }
}
```

### 6.2 Lệnh Thực Thi Build & Test Sản Phẩm

```bash
# 1. Chạy toàn bộ test suite cơ học
dotnet test tests/Modules.Tests/Modules.Tests.csproj

# 2. Biên dịch sản phẩm Release tối ưu hiệu năng
dotnet build src/ClipboardFilterApp.csproj -c Release

# 3. Đóng gói sản phẩm thành 1 file .exe duy nhất độc lập (Native AOT)
dotnet publish src/ClipboardFilterApp.csproj -c Release -r win-x64 --self-contained true /p:PublishSingleFile=true
```

---

## KẾT LUẬN

Qua giáo trình này, bạn đã nắm trọn vẹn từ **Tư duy tầng đáy Windows OS**, **Cơ chế P/Invoke Win32**, **Sự kiện Message Pump HWND**, cho tới **Sự phân rã 5 tầng Clean Architecture chuẩn hóa trong C#**. 

Kiến trúc này đảm bảo ứng dụng **Windows Clipboard Filtering Service** của bạn đạt độ trễ cực thấp **(< 2ms)**, tiêu thụ ít tài nguyên RAM **(< 12MB)** và có khả năng bảo trì, mở rộng vô cùng bền vững.
