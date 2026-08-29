# 09. Testing, Verification & Code Delivery Standards

Tài liệu này xác định các quy trình kiểm thử, xác minh độc lập và nghiệm thu mã nguồn trước khi tích hợp vào dự án `AppForms`.

---

## 1. 🧪 Chiến Lược Kiểm Thử (Testing Strategy)

Do dự án áp dụng Clean Layered Architecture và Hook Pattern, việc kiểm thử được thực hiện độc lập ở từng tầng:

### 1.1. Unit Testing cho Backend Services (`1_Backend/Services/`)

- Kiểm thử các dịch vụ độc lập không phụ thuộc UI:
  - `TextSanitizerService`: Xử lý ký tự đặc biệt, ngắt dòng Windows/Unix, unicode.
  - `MessageParserService`: Kiểm thử các trường hợp dữ liệu thực tế (dữ liệu mẫu từ Zalo / Mess trong `Docs/zalo-messages-*.json`).
  - `TemplateEngineService`: Kiểm thử render token, format số điện thoại, định dạng ngày tháng.
  - `SchemaDetectorService`: Kiểm tra nhận diện chính xác schema theo độ tin cậy (Confidence score).

### 1.2. State & Hook Testing (`Hooks/`)

- Mock các Service Interfaces thông qua NSubstitute / Moq:
  - Kiểm tra `*StateHook` phát event chính xác khi Service trả về kết quả.
  - Kiểm tra trạng thái Form Model được cập nhật đồng bộ khi gọi các Action.

### 1.3. UI Component Testing (`Components/` & `Screens/`)

- Kiểm tra binding dữ liệu: `BindData()` hiển thị đúng dữ liệu lên form controls.
- Kiểm tra trích xuất dữ liệu: `GetFormData()` trả về object đúng định dạng.

---

## 2. 🚦 Quy Trình Xác Minh Bắt Buộc Trước Khi Commit/Hoàn Tất

Mọi Agent hoặc Kỹ sư sau khi tạo hoặc sửa mã nguồn bắt buộc phải thực hiện các bước xác minh sau:

1. **Kiểm tra Biên dịch (Compilation Gate)**:

   ```powershell
   dotnet build AppForms.csproj -c Debug
   ```

   *Yêu cầu*: 0 Errors, 0 Warnings nghiêm trọng.

2. **Kiểm tra Giới hạn Kích thước File Screen**:
   - Xác nhận file `*Screen.cs` không vượt quá 150 dòng.
   - Nếu vượt quá, tách ngay Sub-Components vào `Components/` hoặc state vào `Hooks/`.

3. **Kiểm tra Ranh giới Phụ thuộc**:
   - Đảm bảo Backend không sử dụng thư viện UI (`System.Windows.Forms`).
   - Đảm bảo không có chuỗi placeholder (`TODO`, `NotImplementedException`).

4. **Kiểm tra & Xác Thực Logging (Logging Verification Gate)**:
   - **Rà soát qua `git diff`**: Kiểm tra các đoạn mã mới trong `1_Backend/` và `2_Frontend/` để đảm bảo đã có `_logger.LogInformation` / `_logger.LogError` theo chuẩn Wide Events.
   - **Chạy thử qua `dotnet run`**: Khởi chạy ứng dụng ở môi trường Dev để xác nhận log hiển thị đúng trên Diagnostic Console trước khi thực thi `dotnet test`.
   - **Hard Gate**: Script hook `gate_logging_pre_test.py` sẽ tự động chặn `dotnet test` nếu phát hiện có logic mới mà thiếu hoàn toàn Structured Logging.

5. **Kiểm tra Unit Test (Test Gate)**:

   ```powershell
   dotnet test
   ```

   *Yêu cầu*: 100% Tests Passed.
