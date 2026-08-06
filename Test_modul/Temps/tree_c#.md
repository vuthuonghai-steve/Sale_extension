
# 1. PHÂN TÍCH KIẾN TRÚC MẪU (`Extensions-base-setup-AI-First-main/src`)

Dự án tham chiếu áp dụng mô hình **Clean Architecture 5 Tầng Chuyên Biệt**, giúp phân rã bài toán thành các thành phần độc lập, dễ mở rộng, bảo trì và kiểm thử 100%:

1. **`0_contracts/`**: Nơi định nghĩa Interfaces, DTOs, Event Payloads, Schemas cấu hình. *Tuyệt đối không chứa logic hay mã phụ thuộc vào HĐH/UI*.
2. **`1_engine/`**: Nơi chứa bộ điều phối chính (Orchestration Engine), lắng nghe vòng lặp sự kiện hệ thống (Event Loop), quản lý vòng đời ứng dụng ngầm.
3. **`2_platform_adapters/`**: Bọc (Wrapper) các API hệ thống cấp thấp 1-1 (Platform/Win32 APIs, Storage, Logging). Giúp cách ly hoàn toàn mã hệ điều hành khỏi logic nghiệp vụ.
4. **`3_modules/`**: Chứa toàn bộ **Pure Business Logic** (được chia nhỏ thành `sub-modules` các bộ lọc Regex đơn lẻ và `composite-modules` quản lý chuỗi lọc Pipeline). *Tầng này có thể Unit Test độc lập 100% không cần khởi động UI hay HĐH*.
5. **`4_presentation/`**: Tầng hiển thị giao diện tương tác với người dùng (System Tray Icon, Cửa sổ Notification Toast, Form cài đặt).

---

# 2. CẤU TRÚC DỰ ÁN C# CHUYÊN BIỆT ĐÃ KHỞI TẠO NỔI BẬT AT `test-c#`

Ánh xạ nguyên vẹn triết lý trên vào C# (.NET 6.0/8.0 Windows Application), dự án tại [test-c#](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/Test_modul/test-c%23) được tổ chức phân tầng cực kỳ minh bạch và đã pass 100% bài kiểm thử cơ học:

```
test-c#/
├── src/
│   ├── 0_Contracts/                  # [Hợp đồng & Model dữ liệu]
│   │   ├── IClipboardFilter.cs       # Contract định nghĩa bộ lọc
│   │   ├── ClipboardDataPayload.cs   # DTO chuyển giao dữ liệu văn bản
│   │   └── FilterOptions.cs          # Schema cấu hình bật/tắt filter
│   │
│   ├── 1_Engine/                     # [Bộ điều phối Engine ngầm]
│   │   ├── NativeClipboardListener.cs# Message Window ẩn nhận WM_CLIPBOARDUPDATE
│   │   └── PipelineOrchestrator.cs   # Điều phối luồng async & chống vòng lặp ghi đè
│   │
│   ├── 2_PlatformAdapters/           # [Win32 Native API Wrapper]
│   │   └── Win32ClipboardAdapter.cs  # P/Invoke OpenClipboard, SetClipboardData với Backoff Retry
│   │
│   ├── 3_Modules/                    # [Pure Business Logic & Regex Engine]
│   │   ├── SubModules/
│   │   │   ├── UnicodeSanitizerFilter.cs # Xóa zero-width space, chuẩn hóa NFC
│   │   │   ├── ZaloStickerFilter.cs      # Lọc /-rose, nhãn rác, dòng kẻ trang trí
│   │   │   ├── CommissionRegexFilter.cs  # Lọc hoa hồng %, triệu và điều khoản chủ dẫn
│   │   │   └── UrlSanitizerFilter.cs     # Bóc utm_source, fbclid, gclid
│   │   └── CompositeModules/
│   │       └── ClipboardPipelineManager.cs # Quản lý chuỗi lọc Chain of Responsibility
│   │
│   ├── 4_Presentation/               # [Giao diện System Tray]
│   │   └── SystemTrayApplicationContext.cs # Taskbar Tray Icon ở góc phải màn hình Windows
│   │
│   ├── ClipboardFilterApp.csproj
│   └── Program.cs                    # Entrypoint siêu sạch (Chỉ DI Container & Application.Run)
│
└── tests/
    └── Modules.Tests/                # Dự án xUnit Test độc lập 100% cho 3_Modules
        ├── Modules.Tests.csproj
        └── PipelineTests.cs
```

---

# 3. NGHỆ THUẬT LẬP TRÌNH C# ĐÃ ĐƯỢC ÁP DỤNG

1. **Xử lý Triệt để C# Regex Surrogate Pairs đối với Emoji**:
   - Khắc phục hiện tượng bị lẻ code unit UTF-16 của Emoji trong C# bằng việc nhóm Regex dạng `(?:🌷|🌸|🌺|🌻|🌹|💐)` thay vì dùng character class `[...]`.
2. **Win32 Exponential Backoff Retry**:
   - `Win32ClipboardAdapter` tích hợp cơ chế tự động thử lại khi Clipboard bị ứng dụng khác khóa lock (`WinError 5`), giúp app chạy ngầm an toàn 24/7.
3. **Kiểm thử Tự động Nhị phân (Binary Verification)**:
   - Đã biên dịch thành công `dotnet build` (**0 Warning, 0 Error**) và chạy bài test `dotnet test` xanh 100%.

---

### 🚀 Hướng dẫn Chạy ứng dụng C# vừa khởi tạo:
Bạn có thể mở Terminal tại thư mục [test-c#](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/Test_modul/test-c%23) và chạy lệnh:

```bash
# Chạy bộ kiểm thử Unit Test
dotnet test tests/Modules.Tests/Modules.Tests.csproj

# Khởi chạy dịch vụ lọc Clipboard ngầm trên Windows (Hiển thị Icon Shield ở System Tray)
dotnet run --project src/ClipboardFilterApp.csproj
```