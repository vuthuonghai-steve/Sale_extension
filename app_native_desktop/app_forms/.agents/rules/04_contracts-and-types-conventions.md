# 04. Contracts, Types & Models Conventions

Tài liệu này quy định việc phân định vai trò, cấu trúc thư mục và quy ước đặt tên cho các kiểu dữ liệu (Types, Models, Entities, Schemas, Interfaces) trong `AppForms`.

---

## 1. 📑 Bảng Phân Định Vai Trò Type

| Phân Loại Type | Mục Đích Sử Dụng | Vị Trí Lưu Trữ | Quy Ước Đặt Tên | Ví Dụ |
| :--- | :--- | :--- | :--- | :--- |
| **Interface** | Hợp đồng giao tiếp giữa các tầng, phục vụ DI và Mocking | `1_Backend/Contracts/Interfaces/` | `I[Name]Service.cs`, `I[Name]Repository.cs` | `ISettingsService`, `IMessageParser`, `ITextSanitizer` |
| **Entity** | Thực thể dữ liệu nghiệp vụ cốt lõi, lưu trữ lâu dài | `1_Backend/Contracts/Entities/` | `[Name]Entity.cs` hoặc `[Name].cs` | `AppSettings.cs`, `LeadEntity.cs`, `RoomCodeMap.cs` |
| **Schema** | Định nghĩa cấu trúc động và metadata cho parser/form | `1_Backend/Contracts/Schemas/` | `[Name]Schema.cs` | `FormatSchema.cs`, `FieldSchema.cs` |
| **Screen Model / DTO** | State và Form data cục bộ phục vụ cho View và Hook | `2_Frontend/Screens/[Screen]/Models/` | `[Screen]FormModel.cs`, `[Screen]State.cs` | `SettingsFormModel.cs`, `LeadEditorModel.cs` |
| **Shared Types / Enum** | Enum, Struct, EventArgs dùng chung toàn ứng dụng | `0_Shared/Types/` | `[Name]Type.cs`, `[Name]Enum.cs` | `AppTheme.cs`, `ScreenType.cs`, `ConversionStatus.cs` |

---

## 2. 🔒 Quy Tắc Bất Biến Về Hợp Đồng (Contract Locks)

1. **Không Tự Ý Sửa Đổi Interface**:
   - Khi chỉnh sửa một Service, **không được tùy tiện xóa hoặc thay đổi signature** của các phương thức trong `1_Backend/Contracts/Interfaces/` mà không cập nhật đồng bộ các Service implement và các Unit Tests liên quan.
2. **Immutable DTO & Records khi Cần Thiết**:
   - Khuyến khích sử dụng `record` hoặc `readonly struct` cho các DTO truyền tải kết quả trung gian để tránh side-effect (`LeadConversionResult`, `ParsedField`).
3. **Validation Tại Tầng Contract / Model**:
   - Các Form Model hoặc DTO cần có phương thức kiểm tra tính hợp lệ (`IsValid()`, `Validate()`) trước khi gửi qua Hook tới Service.

---

## 3. 📦 Serialization & JSON Attributes

- Sử dụng `System.Text.Json` tiêu chuẩn.
- Các thuộc tính Entity/Schema serialize ra file JSON bắt buộc có attributes định danh rõ ràng:
  ```csharp
  [JsonPropertyName("room_code")]
  public string RoomCode { get; set; } = string.Empty;

  [JsonPropertyName("is_active")]
  public bool IsActive { get; set; } = true;
  ```
- Luôn cung cấp giá trị mặc định cho property hoặc sử dụng nullable (`?`) hợp lý để tránh NullReferenceException khi đọc file JSON cũ.
