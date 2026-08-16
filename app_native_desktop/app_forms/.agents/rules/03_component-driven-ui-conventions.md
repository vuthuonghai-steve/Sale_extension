# 03. Component-Driven UI & Hook Pattern Conventions

Tài liệu này chuẩn hóa cách thiết kế, phân rã màn hình WinForms theo mô hình **Component-Driven** và **Hook Pattern**, đảm bảo UI dễ bảo trì, dễ test và tránh hiện tượng "God Class / God Screen".

---

## 1. 📐 Cấu Trúc Thư Mục Một Screen Chuẩn

Mỗi màn hình tính năng lớn nằm trong thư mục riêng `2_Frontend/Screens/[ScreenName]/`:

```text
2_Frontend/Screens/[ScreenName]/
├── Components/                 # [VIEW] Các Widget, Panel, Card UI con được chia nhỏ
│   ├── [Feature]Panel.cs       # Ví dụ: LeadFieldEditor.cs, SettingsGeneralPanel.cs
│   └── [Feature]ActionBox.cs   # Ví dụ: OutputPreviewBox.cs, SettingsHotkeysPanel.cs
├── Hooks/                      # [STATE & LOGIC] Controller quản lý state và business calls
│   └── [ScreenName]StateHook.cs# Tương đương Custom Hook
├── Models/                     # [TYPES CỤC BỘ] Form Model, DTO chỉ dùng cho Screen này
│   └── [ScreenName]FormModel.cs
├── Constants/                  # [CONSTANTS CỤC BỘ] Nhãn, tooltip, key riêng (nếu có)
│   └── [ScreenName]Constants.cs
└── [ScreenName]Screen.cs       # [ROOT CONTAINER] Ráp Layout + Kết nối Hook & Components (< 150 dòng)
```

---

## 2. 🧩 Chi Tiết Trách Nhiệm Từng Thành Phần

### 2.1. Root Screen Container (`*Screen.cs`)
- **Nhiệm vụ**:
  - Khởi tạo khung layout lớn (`TableLayoutPanel`, `SplitContainer`, `CardPanel`).
  - Khởi tạo hoặc nhận Hook từ Dependency Injection.
  - Khởi tạo các Sub-Components con và gắn chúng vào Container.
  - Lắng nghe event từ Hook và điều phối re-render/thông báo chung.
- **Giới hạn nghiêm ngặt**:
  - Số dòng code: **$\le 150$ dòng**.
  - **Không** chứa logic nghiệp vụ, tính toán regex hay gọi trực tiếp Backend Services.

### 2.2. State Controller Hook (`Hooks/*StateHook.cs`)
- **Nhiệm vụ**:
  - Nắm giữ toàn bộ dữ liệu trạng thái của Screen (`FormModel`, `CurrentLead`, `ActiveSchema`...).
  - Nhận Backend Service Interfaces qua Constructor Injection.
  - Cung cấp các hàm hành động (`Action methods`): `LoadDataAsync()`, `SaveData()`, `ConvertManual()`, `Reset()`.
  - Bắn các C# Events khi State thay đổi:
    ```csharp
    public event Action<LeadConversionResult>? ConversionCompleted;
    public event Action<string>? ErrorOccurred;
    public event Action<bool>? LoadingStateChanged;
    ```
- **Quy tắc**:
  - **Tuyệt đối KHÔNG** import hoặc sử dụng `System.Windows.Forms.Control` trong Hook.

### 2.3. Sub-Components (`Components/*Panel.cs`, `*Box.cs`)
- **Nhiệm vụ**:
  - Kế thừa từ `Panel`, `UserControl` hoặc `CardPanel`.
  - Dựng các control nhập liệu/hiển thị (`Label`, `ModernTextBox`, `ModernButton`, `DataGridView`).
  - Cung cấp hàm nhận dữ liệu: `BindData(TModel data)`.
  - Cung cấp hàm trích xuất dữ liệu: `GetFormData()`.
  - Bắn sự kiện ra ngoài khi user tương tác (ví dụ `event Action? OnSubmitClicked`).
- **Quy tắc Style**:
  - Sử dụng bảng màu thống nhất từ `AppColors` (`AppColors.Primary`, `AppColors.Surface`, `AppColors.TextPrimary`).
  - Font chữ từ `AppFonts` (`AppFonts.Regular`, `AppFonts.Header`).
  - Không hard-code `Color.FromArgb(12, 34, 56)` rải rác.

---

## 3. 🚫 Danh Sách Điều Cấm (Anti-Patterns)

1. ❌ **CẤM** viết code parse, gọi I/O hoặc thuật toán chuyển đổi trong sự kiện `button_Click` của `*Screen.cs`.
2. ❌ **CẤM** vượt quá **150 dòng** cho file `*Screen.cs` hoặc **300 dòng** cho một Component.
3. ❌ **CẤM** truyền UI Control (`TextBox`, `ComboBox`) vào Service hoặc Hook. Phải trích xuất thành string/model trước.
