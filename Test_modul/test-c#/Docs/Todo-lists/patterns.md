# 📋 DANH SÁCH CÔNG VIỆC KHẮC PHỤC CÁC VỊ TRÍ SAI PATTERN VÀ VI PHẠM KIẾN TRÚC

> **Tài liệu tham chiếu:**
> - [`.agent/rules/architecture-and-flow.md`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/Test_modul/test-c%23/.agent/rules/architecture-and-flow.md)
> - [`.agent/rules/code-quality-and-gates.md`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/Test_modul/test-c%23/.agent/rules/code-quality-and-gates.md)
> - [`.agent/rules/logging-and-observability.md`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/Test_modul/test-c%23/.agent/rules/logging-and-observability.md)
> - [`Docs/csharp-windows-native-architecture-guide.md`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/Test_modul/test-c%23/Docs/csharp-windows-native-architecture-guide.md)

---

## 📌 BẢNG TỔNG QUAN HẠNG MỤC CẦN SỬA ĐỔI

| Mã nhiệm vụ | Hạng mục | Vị trí | Mức độ | Trạng thái |
| :--- | :--- | :--- | :---: | :---: |
| **TASK-01** | Khắc phục rò rỉ bộ nhớ Unmanaged (`GlobalFree`) | `src/2_PlatformAdapters/Win32ClipboardAdapter.cs` | 🔴 **P0 - Critical** | `[x] Đã hoàn thành` |
| **TASK-02** | Kết nối Granular Feature Toggles từ `FilterOptions` | `src/0_Contracts/`, `src/3_Modules/` | 🟠 **P1 - High** | `[x] Đã hoàn thành` |
| **TASK-03** | Hoàn thiện Quản lý vòng đời & Giải phóng (`IDisposable`) | `src/1_Engine/`, `src/4_Presentation/`, `src/Program.cs` | 🟠 **P1 - High** | `[x] Đã hoàn thành` |
| **TASK-04** | Tối ưu hóa Logger không block STA Thread & Lưu `%LocalAppData%` | `src/2_PlatformAdapters/Logging/WindowsLoggerAdapter.cs` | 🟡 **P2 - Medium** | `[x] Đã hoàn thành` |
| **TASK-05** | Bổ sung Isolated Unit Tests cho từng SubModule & Options | `tests/Modules.Tests/` | 🟡 **P2 - Medium** | `[x] Đã hoàn thành` |
| **TASK-06** | Chuẩn hóa Culture Invariant & Regex Options | `src/3_Modules/SubModules/` | 🟢 **P3 - Low** | `[x] Đã hoàn thành` |
| **TASK-07** | Đánh giá & Phân lập ranh giới Project (.csproj) | `src/ClipboardFilterApp.csproj` | 🟢 **P3 - Low** | `[x] Đã hoàn thành` |

---

## 🛠️ CHI TIẾT TỪNG HẠNG MỤC CÔNG VIỆC

### 🔴 TASK-01: Khắc phục rò rỉ bộ nhớ Unmanaged (`GlobalFree`)
- [x] **Mô tả vấn đề**:
  - **Vị trí**: [`src/2_PlatformAdapters/Win32ClipboardAdapter.cs:96-110`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/Test_modul/test-c%23/src/2_PlatformAdapters/Win32ClipboardAdapter.cs#L96-L110)
  - **Quy tắc vi phạm**: `ARC-3` & `BQD-7` (Unmanaged Memory Safety).
  - **Nguyên nhân**: Khi cấp phát bộ nhớ bằng `GlobalAlloc`, nếu `GlobalLock` thất bại hoặc `SetClipboardData` trả về `IntPtr.Zero` (thất bại), OS sẽ **không** tiếp quản handle `hMem`. Mã nguồn hiện tại không gọi `GlobalFree(hMem)` và chưa khai báo `[DllImport("kernel32.dll")] GlobalFree`, dẫn đến rò rỉ bộ nhớ unmanaged mỗi khi gặp lỗi ghi clipboard.
- [x] **Giải pháp khắc phục**:
  1. Thêm P/Invoke import:
     ```csharp
     [DllImport("kernel32.dll", SetLastError = true)]
     public static extern IntPtr GlobalFree(IntPtr hMem);
     ```
  2. Bọc logic ghi Clipboard bằng `try...finally` đảm bảo nếu `SetClipboardData` trả về `IntPtr.Zero` thì phải gọi `GlobalFree(hMem)`.
- [x] **Tiêu chuẩn nghiệm thu (Acceptance Criteria)**:
  - `GlobalFree` được gọi chính xác khi `SetClipboardData` thất bại hoặc xảy ra exception.
  - Không có cảnh báo/lỗi biên dịch nào khi chạy `dotnet build`.

---

### 🟠 TASK-02: Kết nối Granular Feature Toggles từ `FilterOptions` vào Pipeline
- [x] **Mô tả vấn đề**:
  - **Vị trí**:
    - [`src/0_Contracts/FilterOptions.cs:13-18`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/Test_modul/test-c%23/src/0_Contracts/FilterOptions.cs#L13-L18)
    - [`src/3_Modules/CompositeModules/ClipboardPipelineManager.cs:31-34`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/Test_modul/test-c%23/src/3_Modules/CompositeModules/ClipboardPipelineManager.cs#L31-L34)
    - [`src/0_Contracts/IClipboardFilter.cs`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/Test_modul/test-c%23/src/0_Contracts/IClipboardFilter.cs)
  - **Quy tắc vi phạm**: Options Pattern & Strategy Pattern Consistency.
  - **Nguyên nhân**: `FilterOptions` khai báo 6 cờ cấu hình chi tiết (`EnableUnicodeSanitizer`, `EnableReplyQuoteFilter`, `EnableZaloStickerFilter`, `EnableBrandFilter`, `EnableCommissionFilter`, `EnableUrlSanitizer`), nhưng `ClipboardPipelineManager.Process()` duyệt qua `_filters` mà không kiểm tra cờ tương ứng, luôn chạy 100% tất cả filter dù options được cấu hình là `false`.
- [x] **Giải pháp khắc phục**:
  1. Mở rộng `IClipboardFilter` với phương thức `bool IsEnabled(FilterOptions options)` hoặc ánh xạ enum/type.
  2. Trong `ClipboardPipelineManager.Process()`, kiểm tra điều kiện `if (filter.IsEnabled(_options))` trước khi thực thi `filter.Process()`.
- [x] **Tiêu chuẩn nghiệm thu (Acceptance Criteria)**:
  - Khi set một cờ (ví dụ `EnableUrlSanitizer = false`), filter đó bị bỏ qua và không làm thay đổi URL.
  - Viết unit test xác nhận tính năng bật/tắt cho từng cờ cấu hình.

---

### 🟠 TASK-03: Hoàn thiện Quản lý vòng đời & Giải phóng tài nguyên (`IDisposable`)
- [x] **Mô tả vấn đề**:
  - **Vị trí**:
    - [`src/1_Engine/PipelineOrchestrator.cs:11-63`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/Test_modul/test-c%23/src/1_Engine/PipelineOrchestrator.cs#L11-L63) & [`src/Program.cs:44`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/Test_modul/test-c%23/src/Program.cs#L44)
    - [`src/4_Presentation/SystemTrayApplicationContext.cs:31-68`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/Test_modul/test-c%23/src/4_Presentation/SystemTrayApplicationContext.cs#L31-L68)
  - **Quy tắc vi phạm**: `BQD-1` / `BQD-2` & Lifecycle Best Practices (§2.2 `code-quality-and-gates.md`).
  - **Nguyên nhân**:
    - `PipelineOrchestrator` đăng ký event `_listener.ClipboardUpdated += OnClipboardUpdated` nhưng không implement `IDisposable` để hủy đăng ký (`-=`), đồng thời `Program.cs` khởi tạo dạng `_ = new PipelineOrchestrator(...)` không lưu trữ biến tham chiếu.
    - `SystemTrayApplicationContext` kế thừa `ApplicationContext` (vốn đã implement `IDisposable`) nhưng không override `protected override void Dispose(bool disposing)`. Nếu app thoát bằng cách khác ngoài click "Thoát", `_notifyIcon` và `ContextMenuStrip` có thể bị rò rỉ GDI handle.
- [x] **Giải pháp khắc phục**:
  1. Cho `PipelineOrchestrator` implement `IDisposable`, hủy đăng ký `_listener.ClipboardUpdated -= OnClipboardUpdated;` trong `Dispose()`.
  2. Override `Dispose(bool disposing)` trong `SystemTrayApplicationContext` để dọn dẹp `_notifyIcon` và `ContextMenuStrip`.
  3. Dùng `using var orchestrator = new PipelineOrchestrator(...)` trong `Program.cs`.
- [x] **Tiêu chuẩn nghiệm thu (Acceptance Criteria)**:
  - Tất cả các class nắm giữ event/unmanaged GUI đều implement `IDisposable` chuẩn mực và dọn dẹp sạch sẽ khi tắt app.

---

### 🟡 TASK-04: Tối ưu hóa Logger không block STA Message Loop & Chuẩn hóa Thư mục `%LocalAppData%`
- [x] **Mô tả vấn đề**:
  - **Vị trí**: [`src/2_PlatformAdapters/Logging/WindowsLoggerAdapter.cs:10, 48-62`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/Test_modul/test-c%23/src/2_PlatformAdapters/Logging/WindowsLoggerAdapter.cs#L10-L62)
  - **Quy tắc vi phạm**: `ARC-4` (Không Block STA Message Thread) & Rule `logging-and-observability.md`.
  - **Nguyên nhân**:
    - `WindowsLoggerAdapter.WriteLog` thực hiện ghi file đồng bộ `File.AppendAllText` trong khối `lock` trực tiếp trên luồng STA xử lý sự kiện `WM_CLIPBOARDUPDATE`.
    - Thư mục log đặt tại `AppDomain.CurrentDomain.BaseDirectory/logs` (nếu cài đặt trong `C:\Program Files\`, việc ghi file sẽ bị lỗi `UnauthorizedAccessException`).
- [x] **Giải pháp khắc phục**:
  1. Chuyển thư mục lưu trữ log sang:
     ```csharp
     Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "ClipboardFilterApp", "logs")
     ```
  2. Áp dụng cơ chế ghi file bất đồng bộ hoặc hàng đợi background (ví dụ `System.Threading.Channels.Channel<string>` hoặc `Task.Run`) để không chặn luồng giao diện STA.
- [x] **Tiêu chuẩn nghiệm thu (Acceptance Criteria)**:
  - Thao tác log không chặn luồng `WndProc` của Windows.
  - Log được ghi chính xác vào thư mục `%LocalAppData%/ClipboardFilterApp/logs/`.

---

### 🟡 TASK-05: Bổ sung Isolated Unit Tests cho từng Sub-Module & Edge Cases
- [x] **Mô tả vấn đề**:
  - **Vị trí**: [`tests/Modules.Tests/`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/Test_modul/test-c%23/tests/Modules.Tests)
  - **Quy tắc vi phạm**: Testing Strategy (`testing-and-verification.md`).
  - **Nguyên nhân**: Toàn bộ 31 test case hiện tại trong `PipelineTests.cs` đều là Integration Test qua `ClipboardPipelineManager`. Chưa có bài test tách biệt (Unit Test cô lập) cho từng filter để xác định lỗi cục bộ.
- [x] **Giải pháp khắc phục**:
  - Thêm các test file riêng:
    - `UnicodeSanitizerFilterTests.cs`
    - `ReplyQuoteFilterTests.cs`
    - `ZaloStickerFilterTests.cs`
    - `BrandRegexFilterTests.cs`
    - `CommissionRegexFilterTests.cs`
    - `UrlSanitizerFilterTests.cs`
    - `FilterOptionsToggleTests.cs` (kiểm tra `MaxPayloadCharacterLimit` và các cờ bật/tắt).
- [x] **Tiêu chuẩn nghiệm thu (Acceptance Criteria)**:
  - Chạy `dotnet test` đạt 100% Pass trên toàn bộ các unit test mới.

---

### 🟢 TASK-06: Chuẩn hóa Culture Invariant & Regex Options
- [x] **Mô tả vấn đề**:
  - **Vị trí**:
    - [`src/3_Modules/SubModules/UrlSanitizerFilter.cs`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/Test_modul/test-c%23/src/3_Modules/SubModules/UrlSanitizerFilter.cs)
    - [`src/3_Modules/SubModules/UnicodeSanitizerFilter.cs`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/Test_modul/test-c%23/src/3_Modules/SubModules/UnicodeSanitizerFilter.cs)
  - **Quy tắc vi phạm**: Code Quality §2.3 (`code-quality-and-gates.md`).
  - **Nguyên nhân**: Một số biểu thức Regex chưa cấu hình cờ `RegexOptions.CultureInvariant`, có thể gây sai lệch kết quả khi chạy trên các máy tính Windows có cấu hình Locale khác biệt (ví dụ tiếng Thổ Nhĩ Kỳ với ký tự hoa/thường `i`/`I`).
- [x] **Giải pháp khắc phục**:
  - Bổ sung `RegexOptions.CultureInvariant` vào tất cả các định nghĩa `Regex` trong `3_Modules`.
- [x] **Tiêu chuẩn nghiệm thu (Acceptance Criteria)**:
  - Toàn bộ Regex trong `3_Modules` đều có `RegexOptions.Compiled | RegexOptions.CultureInvariant`.

---

### 🟢 TASK-07: Đánh giá & Phân lập ranh giới Project (.csproj)
- [x] **Mô tả vấn đề**:
  - **Vị trí**: [`src/ClipboardFilterApp.csproj`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/Test_modul/test-c%23/src/ClipboardFilterApp.csproj)
  - **Quy tắc vi phạm**: Clean Architecture Physical Boundary (`architecture-and-flow.md`).
  - **Nguyên nhân**: Toàn bộ solution hiện gom trong 1 file `.csproj` duy nhất có bật `UseWindowsForms=true` và `AllowUnsafeBlocks=true`.
- [x] **Giải pháp khắc phục**:
  - Tùy chọn 1 (Giữ monolithic nhẹ nhàng): Sử dụng Architecture Guard Tests hoặc Roslyn Analyzer để đảm bảo `src/0_Contracts/` và `src/3_Modules/` không import namespace UI/Platform.
  - Tùy chọn 2 (Tách multi-project): Tách `ClipboardFilterApp.Core.csproj` (chứa `0_Contracts` & `3_Modules`) và `ClipboardFilterApp.Native.csproj` (chứa `1_Engine`, `2_PlatformAdapters`, `4_Presentation`).
- [x] **Tiêu chuẩn nghiệm thu (Acceptance Criteria)**:
  - Ranh giới kiến trúc giữa Pure Logic và Windows OS Native được bảo vệ cơ học.
