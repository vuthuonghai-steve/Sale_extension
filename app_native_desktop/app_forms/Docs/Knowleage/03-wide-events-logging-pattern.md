# 📊 Triển Khai Logging: Mẫu Wide Events (Canonical Log Lines)

## 1. Khái Niệm Wide Events
Thay vì rải rác 10 dòng log nhỏ lẻ trong một hàm nghiệp vụ (`LogDebug("Bắt đầu")`, `LogDebug("Đã parse")`...):
👉 **Wide Events Pattern** gom tất cả ngữ cảnh (Business Context, Execution Context, Metrics) vào **1 sự kiện duy nhất** phát ra khi tác vụ kết thúc.

---

## 2. Các Đặc Tính Cốt Lõi

| Đặc Tính | Ý Nghĩa | Ví Dụ |
| :--- | :--- | :--- |
| **High Cardinality** | Chứa các định danh có tính duy nhất cao để lọc chính xác | `SessionId`, `LeadId`, `SchemaId`, `ProcessId` |
| **High Dimensionality** | Chứa nhiều trường ngữ cảnh phong phú | `CustomerType`, `RawTextLength`, `DurationMs`, `Status` |
| **Business Context** | Ghi rõ ý nghĩa nghiệp vụ thay vì chỉ trace kỹ thuật | `LeadConverted`, `SettingsSaved`, `ClipboardTriggered` |

---

## 3. Kiến Trúc Multi-Sink Serilog
Ứng dụng sử dụng đồng thời 3 Sink ghi log:
1. **Console Sink**: Hiển thị realtime trong môi trường Debug.
2. **Daily Rolling File Sink (`Logs/app-yyyyMMdd.log`)**: Lưu trữ 31 ngày, ghi nhận mọi sự kiện Info & Error.
3. **Session Debug Log Sink (`Logs/Sessions/session-latest.log`)**: Giới hạn 10MB cho mỗi phiên làm việc để debug chuyên sâu.

---

## 4. Các Anti-Pattern Tuyệt Đối Tránh
❌ **Cấm dùng String Interpolation trong Logger**:
```csharp
// SAI: Phá vỡ khả năng truy vấn dữ liệu có cấu trúc
_logger.LogInformation($"Khách hàng {customerName} đã chuyển đổi");

// ĐÚNG: Sử dụng Message Template có tên tham số
_logger.LogInformation("Khách hàng {CustomerName} đã chuyển đổi thành công", customerName);
```

❌ **Cấm nuốt Exception**:
```csharp
// SAI: Không truyền Exception object
_logger.LogError("Lỗi: " + ex.Message);

// ĐÚNG: Truyền Exception vào vị trí tham số đầu tiên
_logger.LogError(ex, "Thao tác chuyển đổi thất bại {@Context}", context);
```

---

## 5. Sử Dụng `WideEventScope`
```csharp
using var scope = new WideEventScope(_logger, "LeadConversion");
scope.Set("RawLength", input.Length)
     .Set("SchemaId", detectedSchema.Id);

try
{
    var result = _converter.Convert(input);
    scope.Set("CustomerName", result.CustomerName);
    scope.Complete();
}
catch (Exception ex)
{
    scope.Fail(ex);
    throw;
}
```
