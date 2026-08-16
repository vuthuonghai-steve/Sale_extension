# 07. Configuration, Storage & Persistence Conventions

Tài liệu này chuẩn hóa quy trình lưu trữ dữ liệu cục bộ, quản lý cấu hình người dùng và các tệp JSON trong `AppForms`.

---

## 1. 📁 Cấu Trúc Dữ Liệu & Vị Trí Lưu Trữ

Ứng dụng `AppForms` sử dụng 2 nhóm dữ liệu:

### 1.1. Seed Data / Bundled Resources (`0_Shared/Data/`)
- Được đóng gói kèm ứng dụng (`CopyToOutputDirectory = PreserveNewest`).
- Gồm:
  - `0_Shared/Data/schemas.json`: Định nghĩa các cấu trúc mẫu form chuẩn (Mẫu 1, Mẫu 2, Mẫu Nâng Cao).
  - `0_Shared/Data/room_codes.json`: Bảng tra cứu mã phòng, tòa nhà, phân khu bất động sản.
- **Quy tắc**: File này chỉ đóng vai trò dữ liệu ban đầu (seed/fallback). Khi ứng dụng chạy, các thay đổi của người dùng sẽ được lưu trữ vào bộ nhớ cục bộ người dùng.

### 1.2. Runtime User Data & Settings
- Lưu trữ tại thư mục AppData người dùng (`%APPDATA%/SaleAssistant/AppForms/`) hoặc thư mục gốc cấu hình cục bộ:
  - `settings.json`: Lưu cấu hình theme, hotkeys, auto-copy, auto-minimize.
  - `custom_schemas.json`: Lưu các mẫu form tùy biến do người dùng tự tạo.
  - `custom_room_codes.json`: Lưu các mã phòng bổ sung.

---

## 2. 🛡️ Chiến Lược Ghi Tệp An Toàn (Atomic & Thread-Safe File I/O)

Khi ghi đè các tệp cấu hình JSON, phải áp dụng cơ chế **Atomic Write** để tránh làm hỏng tệp khi mất điện hoặc app bị tắt đột ngột:

```csharp
public async Task SaveAsync<T>(string filePath, T data)
{
    var tempPath = filePath + ".tmp";
    var backupPath = filePath + ".bak";

    var jsonOptions = new JsonSerializerOptions 
    { 
        WriteIndented = true,
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
    };

    var jsonString = JsonSerializer.Serialize(data, jsonOptions);
    await File.WriteAllTextAsync(tempPath, jsonString, Encoding.UTF8);

    if (File.Exists(filePath))
    {
        File.Replace(tempPath, filePath, backupPath);
        try { File.Delete(backupPath); } catch { /* Bỏ qua */ }
    }
    else
    {
        File.Move(tempPath, filePath);
    }
}
```

---

## 3. 🔄 Migration & Fallback Gracefully

1. **Khả năng tự phục hồi khi File Hỏng**:
   - Nếu `settings.json` bị lỗi cú pháp JSON (corrupted), `SettingsService` phải tự động fallback về cấu hình mặc định (`AppSettings.Default`) và ghi log Warning thay vì làm crash app.
2. **Schema Versioning**:
   - Trong Entity lưu trữ nên có trường `Version` (ví dụ `"Version": "1.0.0"`) để dễ dàng nâng cấp cấu trúc dữ liệu trong các phiên bản tiếp theo.
