# 06. Code Quality, Safety Gates & Review Standards

Tài liệu này xác định các cổng kiểm soát chất lượng (Quality Gates) mà AI Agent và lập trình viên phải vượt qua trước khi bàn giao mã nguồn.

---

## 1. 🛡️ Các Cổng Kiểm Soát Tự Động (Quality Gates)

### Gate 1: No Stubs / Placeholders (`gate_placeholder_pre.py`)
- **Quy tắc**: Không chấp nhận các chuỗi `TODO: Implement`, `throw new NotImplementedException()`, `pass`, `// ...`, hoặc hàm rỗng vô nghĩa.
- **Hành động**: Tự động từ chối và yêu cầu hoàn thiện đầy đủ logic trước khi lưu file.

### Gate 2: Contract Locking (`gate_contract_lock.py`)
- **Quy tắc**: Các file trong `1_Backend/Contracts/Interfaces/` được coi là "Hợp đồng khóa".
- **Hành động**: Nếu có thay đổi trong thư mục này, Agent phải giải trình lý do và cập nhật toàn bộ các implementations tương ứng.

### Gate 3: Screen Line Count Limit (`gate_screen_limit.py`)
- **Quy tắc**:
  - File Root Screen (`2_Frontend/Screens/[ScreenName]/[ScreenName]Screen.cs`): **Tối đa 150 dòng**.
  - File Component (`2_Frontend/Screens/[ScreenName]/Components/*.cs`): **Tối đa 300 dòng**.
- **Hành động**: Nếu vượt quá số dòng cho phép, bắt buộc phải tách nhỏ thành Sub-Components hoặc chuyển logic sang Hook.

### Gate 4: Architecture Boundary Enforcer (`gate_arch_boundary.py`)
- **Quy tắc**:
  - `0_Shared/` KHÔNG import `1_Backend` hoặc `2_Frontend`.
  - `1_Backend/Services/` KHÔNG import `System.Windows.Forms` hoặc `AppForms.Frontend`.
  - `2_Frontend/Screens/` KHÔNG trực tiếp đọc/ghi file IO hoặc parse regex; phải thông qua Hook/Service.
- **Hành động**: Cảnh báo vi phạm ranh giới kiến trúc ngay lập tức.

### Gate 5: Build & Compilation Verification (`gate_stop_verify.py`)
- **Quy tắc**: Mọi thay đổi phải vượt qua lệnh `dotnet build` với **0 Error**.
- **Hành động**: Tự động chạy lệnh kiểm tra build trước khi kết thúc tác vụ.

---

## 2. 🧹 Clean Code & C# Naming Conventions

1. **Naming Conventions**:
   - `PascalCase`: Tên Class, Record, Struct, Interface, Method, Property, Event, Namespace (`LeadConverterScreen`, `ParseMessageAsync`).
   - `camelCase`: Tên Local Variable, Method Parameter (`leadData`, `sanitizerService`).
   - `_camelCase`: Tên Private Field (`_serviceProvider`, `_clipboardListener`).
   - `IPascalCase`: Tên Interface (`ISettingsService`, `IMessageParser`).
   - `UPPER_SNAKE_CASE` hoặc `PascalCase`: Hằng số (`DEFAULT_CONFIG_PATH`, `MaxRetryCount`).
2. **Nullable Reference Types**:
   - Dự án bật `<Nullable>enable</Nullable>`. Luôn xử lý null rõ ràng bằng pattern matching, `??` hoặc `?` thay vì ép kiểu mù quáng (`!`).
3. **Exception Handling**:
   - Luôn bắt đúng loại ngoại lệ cụ thể (`JsonException`, `IOException`, `ArgumentNullException`).
   - Không được bắt `catch (Exception)` rồi bỏ trống (swallow error); phải ghi log qua Serilog.
