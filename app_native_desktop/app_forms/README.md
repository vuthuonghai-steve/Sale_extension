# Sale Lead Form Converter - C# Native Desktop (Sidepanel Assistant)

Ứng dụng Native Desktop Windows bằng C# .NET với kiến trúc **Clean Layered Architecture** và thiết kế dạng **Sidepanel Trợ Lý Dọc (Full Height, 1/4 Màn Hình)**:
- **Kiến trúc Screens chuyên biệt**: Mỗi màn hình được đóng gói độc lập theo cấu trúc `Screens/<NameScreen>/` với `Components/`, `Hooks/`, `Utils/` riêng biệt.
- **Sidepanel Snap To Right (Full Height)**: Tự động đo đạc vùng làm việc của desktop, gắn vào mép phải màn hình với chiều rộng = `1/4 màn hình` (~400-450px) và chiều cao `100% full height`.
- **Nút ghim TopMost (📌)**: Ghim cửa sổ luôn ở trên cùng để dễ dàng thao tác song song khi đang chat Zalo, lướt Facebook hay mở web.
- **Tự động bóc tách tin nhắn (Message Parser)**: Tự động phân tích và trích xuất dữ liệu (`Địa chỉ`, `Giá`, `Mã phòng`, `Giờ xem`, `Tên KH`, `SĐT`, `Ghi chú`).
- **Cố định trường CTV**: Mặc định là `"Thiên Ngọc"`, cho phép sửa và lưu lại vĩnh viễn.
- **Đa Mẫu Định Dạng**: ❤️ **A Sky Group**, 🏆 **TL21House**, 💛 **TNR HOME**.
- **Realtime Clipboard Monitor & 1-Click Copy**: Bắt clipboard tự động và sao chép kết quả 1-click.

---

## 🏛️ Cấu Trúc Thư Mục & Tổ Chức Layer

```text
app_forms/
├── AppForms.csproj                  # Project file WinExe + WindowsForms + DI + Serilog
├── Program.cs                       # Entry point: DI Bootstrap, AllocConsole (DEBUG), App Lifecycle
├── README.md                        # Hướng dẫn kiến trúc & sử dụng
├── .gitignore                       # Git ignore cấu hình
│
├── 0_Shared/                        # TẦNG DÙNG CHUNG HẠ TẦNG
│   ├── Common/                      # Result<T>, Error Types
│   ├── Constants/AppConstants.cs    # Tên app, Default CTV ("Thiên Ngọc")
│   └── Types/AppEnums.cs            # Enums toàn cục
│
├── 1_Backend/                       # TẦNG BACKEND / CORE LOGIC & PLATFORM SERVICES
│   ├── Contracts/                   # Giao ước dữ liệu và trừu tượng (Entities, Schemas, Interfaces)
│   ├── Services/                    # Triển khai nghiệp vụ (Sanitizer, Parser, TemplateEngine, SchemaManager, FormConverter, Settings)
│   ├── Adapters/                    # P/Invoke Win32 (Clipboard, Console)
│   └── Utils/                       # StringUtils, JsonUtils
│
├── 2_Frontend/                      # TẦNG FRONTEND / UI & PRESENTATION
│   ├── Screens/                     # [TẦNG QUẢN LÝ TỪNG SCREEN CHUYÊN BIỆT]
│   │   ├── LeadConverter/           # Màn hình chính: Chuyển đổi Lead Form
│   │   │   ├── LeadConverterScreen.cs  # UserControl view chính của màn hình
│   │   │   ├── Components/          # SchemaSelectorTabs, LeadFieldEditor, OutputPreviewBox
│   │   │   └── Hooks/               # LeadConverterStateHook (Quản lý state 2-way sync)
│   │   │
│   │   └── Settings/                # Màn hình Cài đặt
│   │       └── SettingsScreen.cs    # UserControl cài đặt CTV & App preferences
│   │
│   ├── Shared/                      # [TẦNG DÙNG CHUNG CỦA FRONTEND]
│   │   ├── Components/              # ModernButton, StatusBadge, StatusCard
│   │   ├── Theme/                   # AppColors (Dark UI palette), AppFonts
│   │   └── Hooks/                   # FormStateObserver (UI Dispatcher an toàn đa luồng)
│   │
│   ├── Forms/
│   │   └── MainForm.cs              # Sidepanel Window Container (1/4 Desktop, Snap phải, Pin TopMost)
│   │
│   └── Tray/
│       └── TrayIconManager.cs       # Quản lý System Tray
│
├── Assets/                          # Tài nguyên đồ họa (app_icon.ico, banner)
├── Docs/                            # Tài liệu phân tích nghiệp vụ & schema
├── scripts/                         # [QUẢN LÝ TẬP TRUNG SCRIPTS & BẢN PHÁT HÀNH]
│   ├── distribution/                # File tài nguyên đính kèm gói release cho khách
│   │   ├── Cai_Dat_Va_Tao_Shortcut.bat
│   │   ├── Go_Bo_Shortcut.bat
│   │   └── HUONG_DAN_SU_DUNG.txt
│   ├── Dong_Goi_Release.bat         # Launcher 1-click đóng gói
│   └── package_release.ps1          # Script PowerShell đóng gói tự động
│
└── dist/                            # Thư mục xuất bản thành phẩm (Standalone Zip & Folder)
```

---

## 🚀 Hướng Dẫn Chạy & Đóng Gói

### 1. Chạy trong môi trường Phát triển / Debug
```bash
dotnet run
# hoặc tự động reload khi sửa code:
dotnet watch run
```

### 2. Đóng gói Bản Phát Hành (.ZIP) Tự Động (Khuyến nghị)
Bạn có thể chạy file đóng gói nằm trong thư mục `scripts/`:
- **Cách 1 (Nhấp đúp chuột)**: Mở thư mục `scripts/` và nhấp đúp vào:
```text
scripts\Dong_Goi_Release.bat
```
- **Cách 2 (Chạy qua PowerShell / Terminal)**:
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\package_release.ps1"
```

Hệ thống sẽ tự động:
1. Biên dịch tối ưu thành 1 file thực thi duy nhất `AppForms.exe` siêu nhẹ (~1MB, Framework-Dependent Single File).
2. Tự động thu thập Icon (`Assets/`) và các file hỗ trợ từ `scripts/distribution/` (`Cai_Dat_Va_Tao_Shortcut.bat`, `Go_Bo_Shortcut.bat`, `HUONG_DAN_SU_DUNG.txt`).
3. Nén toàn bộ thành file **`dist/SaleLeadAssistant_v1.0.0_win-x64.zip`** (< 1MB) sẵn sàng để gửi trực tiếp cho người dùng hoặc đăng tải lên GitHub Release / Google Drive.

---

## 👥 Trải Nghiệm Của Người Dùng Cuối (End-User)
Khi người dùng nhận được file `SaleLeadAssistant_v1.0.0_win-x64.zip`:
1. **Giải nén** file ZIP vào một thư mục bất kỳ.
2. Nhấp đúp vào **`Cai_Dat_Va_Tao_Shortcut.bat`**:
   - Tự động tạo Shortcut đẹp mắt với Icon tia sét ⚡ ngoài **Màn hình chính (Desktop)** và trong **Start Menu**.
   - Thiết lập đúng Working Directory để app load trơn tru.
3. Người dùng chỉ cần mở app trực tiếp từ Desktop để sử dụng ngay!
