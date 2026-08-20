# 📑 TÀI LIỆU KỸ THUẬT: PHÂN TÍCH VÀ ĐÓNG GÓI MODULE LỌC TIN NHẮN (CLIPBOARD MESSAGE PIPELINE & REGEX FILTER)

- Vị trí lưu trữ tài liệu: C:\Users\ADMIN\Documents\workspace\Sale_extension\app_native_desktop\app_forms\Docs\Analyst\01_Message_Regex_Extractor_Packaging_Spec.md
- Module nguồn (Test module): C:\Users\ADMIN\Documents\workspace\Sale_extension\Test_modul\test-c#\src
- Dự án đích tiếp nhận: C:\Users\ADMIN\Documents\workspace\Sale_extension\app_native_desktop\app_forms

---

## 1. 🔍 TỔNG QUAN PHÂN TÍCH MODULE NGUỒN (AS-IS)

Module nguồn là **Hệ thống Lọc và Làm sạch Tin nhắn Bất Động Sản / Bán Hàng từ Clipboard đa tầng (Clipboard Message Pipeline Filter & Sanitizer)**, gồm các chức năng cốt lõi:

### 1.1. Các SubModule Lọc và Làm sạch (Sub-Filters):
1. **UnicodeSanitizerFilter**:
   - Chuẩn hóa chuỗi Unicode về dạng chuẩn FormC.
   - Loại bỏ các ký tự vô hình/rác bộ nhớ đệm: Zero-width space, Byte Order Mark, Soft hyphen.
   - Giải mã các thực thể HTML (&amp;, &quot;, &#39;...).
2. **ReplyQuoteFilter**:
   - Nhận diện và cắt bỏ phần tiêu đề tin nhắn trích dẫn (Quote Headers) khi copy từ Zalo, Messenger, Telegram.
3. **ZaloStickerFilter**:
   - Lọc các mã sticker Zalo (/-strong, /-heart, /-rose, /-flag, /-fade...) và emoji hoa hồng/hoa cúc đứng mồ côi trước mã bài viết.
4. **BrandRegexFilter**:
   - Lọc bỏ tên nhóm, thương hiệu, footer nguồn hàng (ví dụ: TL House, Nguồn hàng cập nhật liên tục tại...).
5. **CommissionRegexFilter** (Bộ lọc phức tạp nhất):
   - **Lọc hoa hồng dính trước mã**: Tách dải hoa hồng dính liền trước mã phòng (VD: 50% 12T (CTV 40%) - P201 -> P201).
   - **Lọc dòng hoa hồng độc lập**: Loại bỏ toàn bộ các dòng chứa thông tin hoa hồng nội bộ (HH 50%, Hoa hồng 1 tháng, Chủ dẫn 35%, CD 40%).
   - **Lọc chính sách thưởng/Bonus**: Lọc các dòng Thưởng nóng 500k cho sale, Bonus sale 1tr, Hỗ trợ ctv nhưng có cơ chế ProtectedLinePrefixRegex để bảo vệ mã căn, địa chỉ không bị xóa nhầm.
6. **UrlSanitizerFilter**:
   - Lọc hoặc thay thế các đường dẫn URL chia sẻ ngoài luồng.

### 1.2. Động cơ điều phối (Pipeline Engine):
- **NativeClipboardListener**: Sử dụng Win32 Native API (AddClipboardFormatListener, RemoveClipboardFormatListener, bắt thông điệp WM_CLIPBOARDUPDATE = 0x031D).
- **PipelineOrchestrator**: Thực thi tuần tự chuỗi Filter theo Pipeline Pattern, truyền nhận ClipboardDataPayload xuyên suốt qua từng module.
- **FilterOptions & config.json**: Cấu hình bật/tắt từng bộ lọc riêng lẻ theo nhu cầu người dùng.

---

## 2. 🏛️ BẢN ĐỒ QUY HOẠCH VÀO KIẾN TRÚC ĐÍCH app_forms (TO-BE)

Tuân thủ nghiêm ngặt **AI System Charter** của `app_forms` theo mô hình Component-Driven và 3 tầng phân ranh giới rõ rệt:

### Bảng phân định thư mục và file chi tiết trong app_forms:

| Phân tầng | Thư mục đích trong app_forms | File / Thành phần chuyển giao | Trách nhiệm theo Charter |
| :--- | :--- | :--- | :--- |
| **0_Shared** | `0_Shared/Models/MessageFilter/` | `ClipboardDataPayload.cs`<br>`FilterPipelineOptions.cs`<br>`FilterExecutionReport.cs`<br>`FilterEnums.cs` | DTOs, Enums thuần túy. Tuyệt đối không chứa logic hay UI. |
| **1_Backend** | `1_Backend/Contracts/MessageFilter/`<br>`1_Backend/Services/MessageFilter/`<br>`1_Backend/Services/MessageFilter/SubFilters/`<br>`1_Backend/Adapters/Win32/` | `IClipboardFilter.cs`<br>`IFilterPipelineOrchestrator.cs`<br>`PipelineOrchestratorService.cs`<br>`CommissionFilter.cs`, `BrandFilter.cs`, `QuoteFilter.cs`, `UnicodeFilter.cs`, `StickerFilter.cs`, `UrlFilter.cs`<br>`FilterRegexPatterns.cs`<br>`Win32ClipboardListenerAdapter.cs` | Logic xử lý Regex có Timeout, xử lý Pipeline, lắng nghe Clipboard Win32, ghi log Serilog. Cấm tuyệt đối import UI Controls. |
| **2_Frontend** | `2_Frontend/Screens/MessageFilter/`<br>`2_Frontend/Hooks/`<br>`2_Frontend/Components/MessageFilter/` | `MessageCleanerScreen.cs` (<= 150 dòng)<br>`MessageCleanerStateHook.cs`<br>`FilterToggleSwitchPanelComponent.cs`<br>`LiveClipboardPreviewComponent.cs`<br>`PipelineExecutionLogComponent.cs` | Giao diện điều khiển bộ lọc, xem trước text sau khi làm sạch, bật tắt ruleset. Mọi cập nhật từ Clipboard ngầm bắt buộc bọc qua FormStateObserver.InvokeOnUI. |

---

## 3. 👥 THIẾT KẾ ĐỘI NGŨ SUBAGENTS CHUYÊN BIỆT (MULTI-AGENT TEAM)

Khởi tạo đội ngũ 4 Subagents đối chiếu chữ thập (Cross-Auditing):

1. **Subagent 1: Regex and Domain Analyst**:
   - Đối chiếu toàn bộ 15+ Compiled Regex trong FilterRegexPatterns.cs.
   - Xây dựng bộ Test Fixtures gồm 10+ mẫu tin nhắn thực tế để kiểm thử độ chính xác sau khi chuyển giao.
2. **Subagent 2: Backend Pipeline Engineer**:
   - Đóng gói toàn bộ 0_Contracts, 1_Engine, 2_PlatformAdapters, 3_Modules vào 0_Shared và 1_Backend.
   - Chuẩn hóa DI Registration trong Program.cs / ServiceCollection.
   - Đảm bảo cơ chế ReDoS timeout TimeSpan.FromMilliseconds(250) trên mọi Regex.
   - Ghi nhận Log Serilog Wide-event chuẩn.
3. **Subagent 3: Frontend Component Architect**:
   - Xây dựng giao diện màn hình MessageCleanerScreen.cs (<= 150 dòng code).
   - Tách rời State qua MessageCleanerStateHook.cs.
   - Tạo các Sub-Components hiển thị độc lập: Toggle switches, Live Preview, Log Grid.
   - Đảm bảo 100% các sự kiện từ ClipboardListener được chuyển tiếp an toàn qua FormStateObserver.InvokeOnUI.
4. **Subagent 4: QA and Conformance Auditor**:
   - Thẩm định tiêu chuẩn Charter: Kiểm tra độ dài file, không để lại TODO/NotImplementedException.
   - Thực thi dotnet build trên app_native_desktop/app_forms đảm bảo 0 warning, 0 error.

---

## 4. 🚀 LỘ TRÌNH TRIỂN KHAI ĐÓNG GÓI (ROADMAP)

- **Giai đoạn 1**: Nạp 0_Shared (Models, DTOs, Enums).
- **Giai đoạn 2**: Nạp 1_Backend (Regex Engine, Sub-Filters, Win32 Clipboard Hook, Serilog telemetry).
- **Giai đoạn 3**: Nạp 2_Frontend (Screen, StateHook, Sub-Components).
- **Giai đoạn 4**: Tích hợp DI và Đăng ký Menu / Tray / Tab trong app_forms.
- **Giai đoạn 5**: Chạy dotnet build, chạy bộ Test Dataset và thẩm định toàn diện.