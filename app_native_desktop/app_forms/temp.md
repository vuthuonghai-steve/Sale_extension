Viewed SKILL.md:1-174
Ran command: `git status`
Ran command: `git diff`
Ran command: `git status -s`
Ran command: `Get-ChildItem -Recurse -File "0_Shared/Models", "1_Backend/Services/MessageFilter", "2_Frontend/Screens/MessageFilter", "Tests/MessageFilter" | Select-Object FullName`
Ran command: `Get-ChildItem -Recurse -File "0_Shared", "1_Backend", "2_Frontend", "Tests" | Resolve-Path -Relative`
Ran command: `dotnet test`
Ran command: `dotnet test --logger "console;verbosity=normal"`
Ran command: `dotnet test Tests/AppForms.Tests.csproj`
Ran command: `Get-ChildItem -Recurse "0_Shared\Models" | Select-Object FullName`
Ran command: `Get-ChildItem -Recurse "0_Shared\Models", "1_Backend", "2_Frontend\Screens\MessageFilter", "2_Frontend\Screens\Settings" | Select-Object FullName | Format-Table -Wrap`
Ran command: `Get-ChildItem "0_Shared\Models\MessageFilter" | Select-Object Name`
Viewed ClipboardDataPayload.cs:1-12
Viewed FilterExecutionReport.cs:1-14
Viewed FilterPipelineOptions.cs:1-48
Viewed AppSettings.cs:1-17
Viewed IClipboardFilter.cs:1-34
Viewed IFilterPipelineOrchestrator.cs:1-50
Viewed Win32ClipboardAdapter.cs:1-141
Viewed ClipboardPipelineManager.cs:1-106
Viewed PipelineOrchestratorService.cs:1-158
Viewed FilterRegexPatterns.cs:1-142
Viewed UnicodeSanitizerFilter.cs:1-30
Viewed ReplyQuoteFilter.cs:1-22
Viewed ZaloStickerFilter.cs:1-48
Viewed BrandRegexFilter.cs:1-44
Viewed CommissionRegexFilter.cs:1-73
Viewed UrlSanitizerFilter.cs:1-45
Viewed MessageCleanerScreen.cs:1-86
Viewed FilterToggleSwitchPanelComponent.cs:1-152
Viewed LiveClipboardPreviewComponent.cs:1-169
Viewed PipelineExecutionLogComponent.cs:1-100
Viewed MessageCleanerStateHook.cs:1-109
Viewed MessageCleanerFormModel.cs:1-13
Viewed SettingsMessageFilterPanel.cs:1-200
Viewed SettingsStateHook.cs:1-187
Viewed SettingsScreen.cs:1-106
Viewed MainForm.cs:1-325
Viewed Program.cs:1-257
Viewed 01_Message_Regex_Extractor_Packaging_Spec.md:1-81
Ran command: `Get-ChildItem "Tests\MessageFilter" | Select-Object Name`

# 📊 BÁO CÁO PHÂN TÍCH THAY ĐỔI DỰ ÁN & REVIEW CHUYÊN SÂU MODULE BỘ LỌC TIN NHẮN (MESSAGE FILTER PIPELINE)

## 1. 🚀 TỔNG QUAN PHÂN TÍCH THAY ĐỔI DỰ ÁN (PROJECT CHANGES ANALYSIS)

Dự án đã được mở rộng và tích hợp hoàn chỉnh **Module Lọc & Làm Sạch Tin Nhắn Clipboard Tự Động (Clipboard Message Filter & Regex Sanitizer Pipeline)**, phục vụ việc xử lý, tách bỏ các thông tin rác, thương hiệu nội bộ, hoa hồng môi giới, bonus, quote Zalo khi sao chép dữ liệu từ các ứng dụng nhắn tin/sàn BĐS.

### Bảng tổng hợp các file thay đổi & bổ sung theo phân tầng kiến trúc

```
app_forms/
├── 0_Shared/Models/MessageFilter/ [NEW] DTOs & Models thuần túy
│ ├── ClipboardDataPayload.cs (Record payload trung chuyển giữa các tầng)
│ ├── FilterExecutionReport.cs (Record kết quả chi tiết & telemetry)
│ └── FilterPipelineOptions.cs (Cấu hình bật/tắt các quy tắc lọc)
├── 1_Backend/
│ ├── Contracts/
│ │ ├── Entities/AppSettings.cs [MODIFY] Thêm MessageFilterOptions vào settings
│ │ └── Interfaces/
│ │ ├── IClipboardFilter.cs [NEW] Hợp đồng thuần túy cho từng Sub-Filter
│ │ └── IFilterPipelineOrchestrator.cs [NEW] Hợp đồng điều phối động cơ Pipeline
│ ├── Adapters/Win32/
│ │ └── Win32ClipboardAdapter.cs [NEW] Native API giao tiếp Win32 Clipboard (Retry backoff)
│ └── Services/MessageFilter/ [NEW] Động cơ lọc Pipeline & 6 Sub-Modules
│ ├── ClipboardPipelineManager.cs (Composite Manager điều phối chuỗi bộ lọc)
│ ├── PipelineOrchestratorService.cs (Service nền bắt sự kiện WM_CLIPBOARDUPDATE & ghi đè)
│ ├── Helpers/FilterRegexPatterns.cs (Hệ thống Compiled Regex building blocks có Timeout)
│ └── SubFilters/
│ ├── UnicodeSanitizerFilter.cs (Priority 1: Chuẩn hóa FormC, xóa ký tự ẩn/BOM)
│ ├── ReplyQuoteFilter.cs (Priority 2: Cắt bỏ header trích dẫn Zalo)
│ ├── ZaloStickerFilter.cs (Priority 3: Xóa sticker Zalo & thẻ phân cách [Hình ảnh]...)
│ ├── BrandRegexFilter.cs (Priority 4: Xóa thương hiệu& dẫn nguồn)
│ └── UrlSanitizerFilter.cs (Priority 6: Dọn UTM tracking parameters)
├── 2_Frontend/
│ ├── Screens/MessageFilter/ [NEW] Màn hình điều khiển Lọc Tin Nhắn độc lập
│ │ ├── MessageCleanerScreen.cs (Screen root = 86 dòng <= 150 dòng)
│ │ ├── Hooks/MessageCleanerStateHook.cs (State Controller không dính UI controls)
│ │ ├── Models/MessageCleanerFormModel.cs (ViewModel phục vụ UI)
│ │ └── Components/
│ │ ├── FilterToggleSwitchPanelComponent.cs (Bảng công tắc bật/tắt nhanh 6 bộ lọc)
│ │ ├── LiveClipboardPreviewComponent.cs (Khu vực Test/Live Preview 2 khung)
│ │ └── PipelineExecutionLogComponent.cs (Lịch sử thực thi thời gian thực)
│ ├── Screens/Settings/
│ │ ├── SettingsScreen.cs [MODIFY] Tích hợp thêm Tab 3 "🧹 Lọc Copy" (106 dòng)
│ │ ├── Hooks/SettingsStateHook.cs [MODIFY] Thêm Load/Save MessageFilterOptions
│ │ └── Components/SettingsMessageFilterPanel.cs [NEW] Card cài đặt chi tiết bộ lọc trong Settings
│ └── Forms/MainForm.cs [MODIFY] Thêm Tab điều hướng "🧹 Lọc Tin Nhắn" & đồng bộ State
├── Program.cs [MODIFY] Đăng ký DI IoC Container cho Pipeline & Filters
├── Docs/Analyst/01_Message_Regex_Extractor_Packaging_Spec.md [NEW] Tài liệu đặc tả kỹ thuật đóng gói
└── Tests/MessageFilter/ [NEW] 9 Test Suites (201 test cases PASS 100%)
```

## 2. 🔍 REVIEW CHẤT LƯỢNG CODE, KHAI BÁO & ĐỊNH NGHĨA DỮ LIỆU

### 2.1. Khai báo & Định nghĩa Dữ liệu (Data Declarations & Domain Modeling)

- **Sử dụng Record Bất Biến (Immutability)**:
- [`ClipboardDataPayload`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/0_Shared/Models/MessageFilter/ClipboardDataPayload.cs) và [`FilterExecutionReport`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/0_Shared/Models/MessageFilter/FilterExecutionReport.cs) được khai báo dạng `public record` với `IReadOnlyList<string> AppliedFilters`. Điều này đảm bảo an toàn luồng tuyệt đối khi dữ liệu được truyền từ background listener lên UI qua các event.
- **Nullability & Giá trị Khởi tạo Mặc định**:
- Toàn bộ các thuộc tính boolean trong [`FilterPipelineOptions`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/0_Shared/Models/MessageFilter/FilterPipelineOptions.cs) đều được gán giá trị mặc định rõ ràng (`= true`).
- Trường `MaxPayloadCharacterLimit = 100_000` đóng vai trò là chốt chặn bảo vệ kích thước chuỗi (Payload Guard).
- Khởi tạo trong [`AppSettings`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/1_Backend/Contracts/Entities/AppSettings.cs#L14) với `public FilterPipelineOptions MessageFilterOptions { get; set; } = new();` ngăn chặn hoàn toàn lỗi `NullReferenceException` khi load JSON cũ chưa có trường này.

### 2.2. Khởi tạo Dữ liệu & Vòng đời DI (Data Initialization & IoC)

- **Dependency Injection**:
- Các Sub-Filters đều implement [`IClipboardFilter`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/1_Backend/Contracts/Interfaces/IClipboardFilter.cs) và được đăng ký dạng `AddSingleton<IClipboardFilter, ...>` trong [`Program.cs`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/Program.cs#L156-L161).
- [`ClipboardPipelineManager`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/1_Backend/Services/MessageFilter/ClipboardPipelineManager.cs#L21) tự động thu nạp toàn bộ danh sách `IEnumerable<IClipboardFilter>` qua ServiceProvider và sắp xếp theo `Priority` một lần duy nhất lúc khởi tạo.
- **Biên dịch Regex Tĩnh (Compiled Regex)**:
- Tất cả Regex trong [`FilterRegexPatterns.cs`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/1_Backend/Services/MessageFilter/Helpers/FilterRegexPatterns.cs) và các Sub-Filters đều được khởi tạo ở cấp độ `static readonly` kèm cờ `RegexOptions.Compiled | RegexOptions.CultureInvariant` và có cấu hình `RegexTimeout = 250ms` chống ReDoS.

### 2.3. Tuân thủ AI System Charter của AppForms

- ✅ **Phân tầng nghiêm ngặt**: `0_Shared` chỉ chứa DTO/Models thuần; `1_Backend` không import bất kỳ WinForms UI Controls nào (`TextBox`, `Button`, `Panel`).
- ✅ **Giới hạn dòng code của Screen**:
- [`MessageCleanerScreen.cs`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/2_Frontend/Screens/MessageFilter/MessageCleanerScreen.cs): 86 dòng (Đạt chuẩn $\le 150$ dòng).
- [`SettingsScreen.cs`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/2_Frontend/Screens/Settings/SettingsScreen.cs): 106 dòng (Đạt chuẩn $\le 150$ dòng).
- ✅ **Thread-Safety UI**: Toàn bộ các sự kiện từ luồng ngầm đều được bọc qua [`FormStateObserver.InvokeOnUI`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/2_Frontend/Screens/MessageFilter/MessageCleanerScreen.cs#L54).
- ✅ **Zero-Placeholder**: Không có `TODO`, `FIXME`, hay `NotImplementedException`.
- ✅ **Test Verification**: 201/201 Tests chạy thành công

## 3. ⚡ KIỂM TRA CÁC VẤN ĐỀ GÂY CẢN TRỞ HIỆU NĂNG (PERFORMANCE AUDIT)

Qua quá trình rà soát chi tiết mã nguồn, dưới đây là danh sách **6 vấn đề tiềm ẩn có thể gây cản trở hiệu năng** hoặc ảnh hưởng đến trải nghiệm người dùng:

### 🔴 Vấn đề 1: `Thread.Sleep` đồng bộ trong `Win32ClipboardAdapter` có thể gây Micro-Freeze luồng UI

- **Vị trí**: [`Win32ClipboardAdapter.cs:L135`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/1_Backend/Adapters/Win32/Win32ClipboardAdapter.cs#L135)
- **Hiện tượng**: Khi ghi lại văn bản vào Clipboard qua `SafeWriteClipboardText`, nếu Clipboard đang bị một ứng dụng khác (Excel, trình duyệt, Word...) khóa tạm thời, adapter sử dụng vòng lặp retry 5 lần với `Thread.Sleep(5 * (1 << i))`. Tổng thời gian sleep tối đa có thể lên tới `5 + 10 + 20 + 40 + 80 = 155ms`.
- **Tác động**: Do sự kiện `WM_CLIPBOARDUPDATE` được xử lý ngay trên Message Loop của UI Thread, việc block 155ms sẽ gây hiện tượng khựng nhẹ (micro-lag/stutter) trên giao diện ứng dụng.

### 🟡 Vấn đề 2: Thiếu Debounce trên sự kiện `TextChanged` tại `LiveClipboardPreviewComponent`

- **Vị trí**: [`LiveClipboardPreviewComponent.cs:L60-L65`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/2_Frontend/Screens/MessageFilter/Components/LiveClipboardPreviewComponent.cs#L60-L65)
- **Hiện tượng**: Khi người dùng gõ phím trực tiếp vào ô *Văn bản thô*, sự kiện `TextChanged` kích hoạt `CleanRequested?.Invoke(_txtRawInput.Text)` trên **từng ký tự gõ vào**.
- **Tác động**: Pipeline gồm 6 sub-filter và hàng chục Regex phức tạp sẽ phải chạy lại liên tục sau mỗi keystroke. Với đoạn văn bản dài hàng nghìn ký tự, điều này gây lãng phí CPU và làm giảm độ mượt khi nhập liệu.
- **Khắc phục đề xuất**: Bổ sung một Timer Debounce (khoảng 250ms - 350ms) trước khi kích hoạt `CleanRequested`.

### 🟡 Vấn đề 3: Áp lực cấp phát bộ nhớ (GC Allocation Pressure) do phân tách dòng `text.Split('\n')`

- **Vị trí**:
- [`BrandRegexFilter.cs:L25`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/1_Backend/Services/MessageFilter/SubFilters/BrandRegexFilter.cs#L25)
- [`CommissionRegexFilter.cs:L28`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/1_Backend/Services/MessageFilter/SubFilters/CommissionRegexFilter.cs#L28)
- [`ClipboardPipelineManager.cs:L99`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/1_Backend/Services/MessageFilter/ClipboardPipelineManager.cs#L99)
- **Hiện tượng**: Mỗi lần chạy qua bộ lọc, mã nguồn thực hiện `string[] lines = text.Split('\n')` tạo ra hàng chục/hàng trăm object `string` con trong mảng, sau đó add vào `List<string>` và `string.Join("\n", ...)`. Ngoài ra hàm `Normalize` thực hiện liên tiếp nhiều thao tác `Replace` và `Regex.Replace`.
- **Tác động**: Mỗi lần copy text, hàng loạt chuỗi tạm được sinh ra ở heap Gen 0, làm tăng tần suất thu gom rác (Garbage Collection). Với ứng dụng desktop chạy nền lâu dài, có thể tối ưu bằng cách dùng `MemoryExtensions.EnumerateLines()` hoặc `Span<char>`.

### 🟡 Vấn đề 4: Sử dụng `Clipboard.SetText` của WinForms trong Hook thay vì Adapter an toàn

- **Vị trí**: [`MessageCleanerStateHook.cs:L74`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/2_Frontend/Screens/MessageFilter/Hooks/MessageCleanerStateHook.cs#L74)
- **Hiện tượng**: Trong hàm `CopyToClipboard(string text)`, hook gọi trực tiếp `Clipboard.SetText(text)`.
- **Tác động**: WinForms `Clipboard.SetText` không có cơ chế retry và bắt buộc phải gọi từ luồng STA. Nếu tại thời điểm click nút "Sao Chép" mà Clipboard đang bị process khác chiếm dụng, hàm này sẽ ném `ExternalException: CLIPBRD_E_CANT_OPEN (0x800401D0)`.
- **Khắc phục đề xuất**: Chuyển sang sử dụng `Win32ClipboardAdapter.SafeWriteClipboardText(text)`.

### 🟢 Vấn đề 5: Thao tác `Insert(0)` trên `List<T>` và `ListView.Items`

- **Vị trí**: [`PipelineExecutionLogComponent.cs:L78, L93`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/2_Frontend/Screens/MessageFilter/Components/PipelineExecutionLogComponent.cs#L78)
- **Hiện tượng**: Mỗi khi có log mới, thành phần gọi `_reports.Insert(0, report)` và `_lvLogs.Items.Insert(0, item)`. Thao tác chèn vào đầu mảng có độ phức tạp $O(N)$ do phải dịch chuyển toàn bộ các phần tử phía sau.
- **Đánh giá mức độ**: Danh sách log hiện tại được giới hạn tối đa 100 phần tử, nên chi phí dịch chuyển này rất nhỏ ($< 0.1\text{ms}$). Tuy nhiên nếu sau này nâng giới hạn lịch sử lên 1.000+ items thì sẽ bắt đầu thấy độ trễ render.

### 🟢 Vấn đề 6: Đánh giá cơ chế chống vòng lặp vô tận (Infinite Loop Prevention)

- **Vị trí**: [`PipelineOrchestratorService.cs:L100-L109`](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/1_Backend/Services/MessageFilter/PipelineOrchestratorService.cs#L100-L109)
- **Phân tích cơ chế**: Khi Service ghi đè nội dung sạch lên Clipboard, Windows OS sẽ phát tiếp một sự kiện `WM_CLIPBOARDUPDATE`. Service đã xử lý chống lặp bằng biến `_lastProcessedText`:

 ```csharp
 if (string.Equals(rawText, _lastProcessedText, StringComparison.Ordinal)) return;
 _lastProcessedText = report.CleanedText;
 Win32ClipboardAdapter.SafeWriteClipboardText(report.CleanedText);
 ```

- **Đánh giá**: Cơ chế chặn hoạt động chính xác và ổn định. Ngăn chặn thành công 100% hiện tượng vòng lặp sự kiện Clipboard vô tận.

## 4. 📋 BẢNG TỔNG HỢP DANH SÁCH VẤN ĐỀ & KHUYẾN NGHỊ

| ID | Vấn đề | Phân tầng / Tệp | Mức độ | Khuyến nghị giải pháp |
| :--- | :--- | :--- | :---: | :--- |
| **PERF-01** | `Thread.Sleep` đồng bộ trong Win32 Retry | `1_Backend/Adapters/Win32/` | **Trung bình** | Chuyển việc ghi đè sang `Task.Run` nền hoặc dùng async non-blocking retry nếu cần độ mượt UI tuyệt đối. |
| **PERF-02** | Thiếu Debounce trên sự kiện gõ `TextChanged` | `2_Frontend/Components/` | **Trung bình** | Thêm Timer Debounce 250ms cho ô nhập văn bản thô tại Preview Panel. |
| **PERF-03** | `Clipboard.SetText` có thể ném `ExternalException` | `2_Frontend/Hooks/` | **Trung bình** | Dùng `Win32ClipboardAdapter.SafeWriteClipboardText` để có Exponential Backoff Retry an toàn. |
| **PERF-04** | GC Allocation khi `Split('\n')` và `Replace` chuỗi | `1_Backend/Services/` | **Thấp** | Dùng `StringReader` hoặc `MemoryExtensions.EnumerateLines()` thay vì tạo mảng chuỗi tạm. |
| **PERF-05** | `Insert(0)` trên `ListView` và `List<T>` | `2_Frontend/Components/` | **Thấp** | Giữ nguyên vì $N \le 100$, hoặc chuyển sang `Queue<T>`/Virtual Mode nếu nâng số lượng log. |
