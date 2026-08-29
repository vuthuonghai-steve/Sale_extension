# 08. Logging & Observability Conventions

Tài liệu này xác định kiến trúc ghi log đa tầng và các tiêu chuẩn giám sát hệ thống trong `AppForms`.

---

## 1. 🪵 Kiến Trúc Logging Đa Tầng (Multi-Sink Architecture)

Hệ thống sử dụng **Serilog** làm logger hạt nhân, tích hợp thông qua `Microsoft.Extensions.Logging` và DI trong `Program.cs`.

Hệ thống ghi log đồng thời vào 3 tầng:

1. **Console Real-time Sink (Debug Console)**:
   - Hiển thị cửa sổ console riêng (`AllocConsole`) khi chạy chế độ debug.
   - Định dạng ngắn gọn: `[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext}: {Message:lj}`.
2. **Daily Rolling Log Sink**:
   - Lưu tại: `Logs/app-yyyyMMdd.log`.
   - Giữ lại 31 ngày gần nhất, tự ngắt file khi quá 10MB.
   - Định dạng chi tiết: `[{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} {Level:u3}] [{SourceContext}] {Message:lj}{NewLine}{Exception}`.
3. **Session Debug Log Sink (Phiên làm việc mới nhất)**:
   - Lưu tại: `Logs/Sessions/session-latest.log`.
   - Mỗi lần khởi động, session cũ được tự động lưu trữ thành `session-yyyyMMdd-HHmmss.log` (tối đa 30 file lịch sử) và tạo mới `session-latest.log`.

---

## 2. 🎯 Cấp Độ Ghi Log (Log Levels) & Tiêu Chí Sử Dụng

| Cấp Độ | Phương Thức | Tiêu Chí Sử Dụng |
| :--- | :--- | :--- |
| **Debug** | `_logger.LogDebug(...)` | Dữ liệu chi tiết nội bộ: kết quả regex từng dòng, payload clipboard thô, thời gian parse từng token. |
| **Information** | `_logger.LogInformation(...)` | Các sự kiện quan trọng trong vòng đời ứng dụng: Khởi động app, Chuyển đổi thành công 1 Form, Đổi Schema, Lưu Settings. |
| **Warning** | `_logger.LogWarning(...)` | Các trường hợp bất thường nhưng có thể tự phục hồi: Clipboard chứa văn bản không khớp schema nào, fallback về default settings, file lock tạm thời. |
| **Error** | `_logger.LogError(...)` | Lỗi xảy ra nhưng app vẫn tiếp tục hoạt động: Lỗi đọc file JSON, Unobserved Task Exception, Lỗi parse schema tùy biến. |
| **Fatal** | `_logger.LogCritical(...)` / `Log.Fatal(...)` | Lỗi nghiêm trọng khiến app bị crash (Unhandled Thread Exception, DI Container failure). |

---

## 3. 📝 Chuẩn Viết Structured Log (Structured Log Conventions)

- **Sử dụng Message Template tham số hóa**, **tuyệt đối KHÔNG** cộng chuỗi (string concatenation hoặc string interpolation `$"..."`):

  ```csharp
  // ✅ ĐÚNG: Serilog trích xuất structured properties
  _logger.LogInformation("Chuyển đổi thành công Form cho Lead: {CustomerName}, Schema: {SchemaId}, Độ dài output: {Length}",
      lead.CustomerName, schema.Id, output.Length);

  // ❌ SAI: Mất khả năng filter theo property và lãng phí bộ nhớ
  _logger.LogInformation($"Chuyển đổi thành công Form cho Lead: {lead.CustomerName}");
  ```

- **Luôn truyền Exception Object vào tham số đầu tiên** khi bắt lỗi:

  ```csharp
  try
  {
      await _schemaManager.SaveSchemaAsync(schema);
  }
  catch (Exception ex)
  {
      _logger.LogError(ex, "Không thể lưu schema: {SchemaId}", schema.Id);
  }
  ```

---

## 4. 🛡️ Quy Trình Logging-First & Rà Soát Git Diff Bắt Buộc

Trước khi thực thi `dotnet test` hoặc hoàn tất bất kỳ tính năng nào:

1. **Rà soát thay đổi mã nguồn qua `git diff`**:
   - Sử dụng `git diff` để xác định toàn bộ các class, method, branch điều kiện (`if`/`switch`/`catch`) mới được thêm vào.
   - Bắt buộc bổ sung `_logger.LogInformation` / `_logger.LogError` / `_logger.LogDebug` cho các điểm chạm nghiệp vụ mới theo tiêu chuẩn Wide Events.

2. **Kiểm thử Log qua `dotnet run` (Dev Diagnostic Console)**:
   - Chạy `dotnet run` để xác thực log được in ra rõ ràng trên Diagnostic Console thời gian thực.
   - Đảm bảo không có exception format hoặc thiếu tham số.

3. **Cơ chế Rule Cứng (Hard Gate)**:
   - Hook `.agents/hooks/scripts/pre_tool_use/gate_logging_pre_test.py` sẽ tự động chặn lệnh `dotnet test` nếu phát hiện mã nguồn mới trong `1_Backend/` hoặc `2_Frontend/` hoàn toàn chưa được gắn Structured Logging.
