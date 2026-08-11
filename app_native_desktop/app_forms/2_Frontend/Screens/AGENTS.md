# 📜 HƯỚNG DẪN KIẾN TRÚC & PATTERN CHUẨN CHO SCREEN (WINFORMS DESKTOP)

Tài liệu này quy định các tiêu chuẩn kiến trúc, quy tắc phân rã component và quản lý type/state bắt buộc tuân thủ khi tạo mới hoặc bảo trì bất kỳ **Screen** nào trong thư mục `2_Frontend/Screens/`.

---

## 1. 🎯 Mục tiêu & Nguyên tắc cốt lõi

1. **Chống God Class / God Screen**: Tuyệt đối không dồn toàn bộ UI controls, logic tính toán, xử lý I/O và gọi API/Service vào một file Screen duy nhất.
2. **Component-Driven Architecture**: Tiếp cận theo tư duy Component tương tự React/Next.js. Mọi màn hình đều là sự lắp ráp của các Sub-Components nhỏ và độc lập.
3. **Phân tách Trách nhiệm (Separation of Concerns)**:
   - **View (Giao diện)**: Chỉ chịu trách nhiệm hiển thị và kích hoạt event tương tác người dùng.
   - **Hook / State Controller**: Quản lý trạng thái (state), lắng nghe event từ Service và cung cấp hàm gọi nghiệp vụ.
   - **Service (Backend)**: Xử lý logic nặng, I/O, parsing, storage.

---

## 2. 📂 Cấu trúc Thư mục Chuẩn của một Screen

Mỗi màn hình tính năng lớn nằm trong thư mục riêng `2_Frontend/Screens/[Tên_Screen]/` và phải tuân theo cấu trúc sau:

```text
2_Frontend/Screens/[ScreenName]/
├── Components/                 # [VIEW] Các Widget, Panel, Box UI con được xé nhỏ
│   ├── [Feature]Panel.cs       # Ví dụ: LeadFieldEditor.cs, SettingsGeneralPanel.cs
│   └── [Feature]ActionBox.cs   # Ví dụ: OutputPreviewBox.cs
│
├── Hooks/                      # [STATE & LOGIC] Controller quản lý state của Screen
│   └── [ScreenName]StateHook.cs# Tương đương Custom Hook (useHook) trong React
│
├── Models/                     # [TYPES CỤC BỘ] DTO, Form Model, State Model chỉ dùng cho Screen này
│   └── [ScreenName]FormModel.cs
│
├── Constants/                  # [CONSTANTS CỤC BỘ] Hằng số, nhãn, key riêng của Screen (nếu có)
│   └── [ScreenName]Constants.cs
│
└── [ScreenName]Screen.cs       # [ROOT CONTAINER] Chỉ ghép Layout tổng + kết nối Hook và Components (< 150 dòng)
```

---

## 3. 🧩 Phân định Vai trò của các "Types" trong Hệ thống

Để tránh nhầm lẫn khi tổ chức class và interface trong C#:

| Phân loại Type | Trách nhiệm | Vị trí lưu trữ | Ví dụ |
| :--- | :--- | :--- | :--- |
| **Interface** | Hợp đồng giao tiếp (Contract), dùng cho Dependency Injection và Mocking. | `1_Backend/Contracts/Interfaces/` | `ISettingsService.cs`, `IMessageParser.cs` |
| **Entity** | Thực thể dữ liệu nghiệp vụ cốt lõi, tồn tại lâu dài trong vòng đời ứng dụng. | `1_Backend/Contracts/Entities/` | `LeadEntity.cs`, `AppSettings.cs` |
| **Schema** | Khuôn mẫu định nghĩa cấu trúc động và metadata xuất bản form. | `1_Backend/Contracts/Schemas/` | `FormatSchema.cs`, `DefaultSchemas.cs` |
| **Screen Model / DTO** | Model dữ liệu phục vụ riêng cho UI State / Form nhập liệu của một màn hình. | `2_Frontend/Screens/[ScreenName]/Models/` | `SettingsFormModel.cs` |
| **Shared Types / Enum** | Các enum, struct, event arguments dùng chung toàn ứng dụng. | `0_Shared/Types/` | `AppTheme.cs`, `ScreenType.cs` |

---

## 4. 📐 Chi tiết Trách nhiệm của từng Layer trong Screen

### 4.1. Root Container (`[ScreenName]Screen.cs`)
- **Vai trò**: Dựng khung layout lớn (SplitContainer, CardPanel cha, Header) và ráp các Components lại với nhau.
- **Kích thước chuẩn**: $\le 150$ dòng code.
- **Quy tắc**:
  - Không gọi trực tiếp các thuật toán xử lý dữ liệu phức tạp.
  - Khởi tạo Hook qua Constructor Injection hoặc Service Provider.
  - Đăng ký lắng nghe các Event từ Hook để cập nhật giao diện tổng thể.

### 4.2. State Controller (`Hooks/[ScreenName]StateHook.cs`)
- **Vai trò**: Đóng gói toàn bộ trạng thái màn hình (State), phương thức hành động (Actions), và kết nối với Backend Services.
- **Quy tắc**:
  - Không chứa code WinForms UI controls (`TextBox`, `Button`, `Panel`...).
  - Giao tiếp với UI thông qua `event Action<...>` hoặc `event EventHandler<...>`.

### 4.3. Sub-Components (`Components/[ComponentName].cs`)
- **Vai trò**: Kế thừa từ `Panel`, `CardPanel` hoặc `UserControl` để vẽ một phần giao diện cụ thể.
- **Kích thước chuẩn**: $100 - 200$ dòng code / file.
- **Quy tắc**:
  - Có hàm `BindData(model)` để nhận dữ liệu hiển thị.
  - Có hàm `GetFormData()` hoặc bắn Event khi người dùng tương tác thay đổi.
  - Tự quản lý style nội bộ (sử dụng `AppColors`, `ModernButton`, `ModernTextBox` từ `2_Frontend/Shared/`).

---

## 5. 🛠 Quy trình 4 bước khi Tạo mới hoặc Refactor Screen

Khi Agent hoặc Developer tạo mới hoặc sửa đổi một Screen:

1. **Bước 1 (Định nghĩa Model)**: Tạo các Class dữ liệu form trong `Models/` đại diện cho trạng thái cần lưu trữ.
2. **Bước 2 (Xây dựng Hook)**: Tạo `*StateHook.cs` trong `Hooks/`, định nghĩa các action (`Save()`, `Reset()`, `Load()`) và các event thông báo.
3. **Bước 3 (Tách Sub-Components)**: Chia nhỏ giao diện thành các Panel độc lập trong `Components/`.
4. **Bước 4 (Lắp ráp Root Screen)**: Tại file `*Screen.cs`, khởi tạo Hook, khởi tạo các Components và liên kết Event giữa chúng.

---

## 6. ⚠️ Các điều CẤM (Anti-patterns)

- ❌ **CẤM** viết code xử lý file, regex phức tạp, gọi API hoặc logic nghiệp vụ trực tiếp trong sự kiện click nút bấm của `*Screen.cs`.
- ❌ **CẤM** tạo file `*Screen.cs` vượt quá **250 dòng**. Nếu vượt quá, bắt buộc phải tách Sub-Components hoặc tách Hook.
- ❌ **CẤM** truyền trực tiếp WinForms UI Controls (như `TextBox`, `ComboBox`) vào Backend Services. Phải trích xuất thành Model/DTO/Entity trước khi truyền.
