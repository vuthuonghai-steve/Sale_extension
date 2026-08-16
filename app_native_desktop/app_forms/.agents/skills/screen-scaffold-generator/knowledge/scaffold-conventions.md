# Scaffold Conventions — Component-Driven & Hook Pattern in WinForms

> **Purpose**: Quy chuẩn kiến trúc chi tiết cho việc phân rã và xây dựng giao diện WinForms hiện đại trong AppForms.

---

## 1. Phân Tầng Kiến Trúc UI (Component-Driven Architecture)

Trong kiến trúc Clean Layered của `AppForms`, tầng `2_Frontend/Screens/` được chia tách hoàn toàn theo nguyên lý **Độc lập Trách nhiệm (Single Responsibility Principle)**:

```text
2_Frontend/Screens/[ScreenName]/
├── Components/
│   ├── [Feature]HeaderPanel.cs    # Component tiêu đề & thanh công cụ
│   ├── [Feature]EditorPanel.cs    # Component nhập liệu / Form controls
│   └── [Feature]PreviewBox.cs     # Component kết quả / DataGrid / Preview
├── Hooks/
│   └── [ScreenName]StateHook.cs   # State Controller & Business Mediator
├── Models/
│   └── [ScreenName]FormModel.cs   # Form State DTOs & Validation Models
└── [ScreenName]Screen.cs          # Root Layout Glue Container (<= 150 lines)
```

---

## 2. Quy Tắc Chi Tiết Cho Từng Thành Phần

### 2.1. Root Screen (`*Screen.cs`)
- **Trách nhiệm duy nhất**: Dựng bố cục (Layout Container) bằng `TableLayoutPanel`, `SplitContainer` hoặc `Panel`, khởi tạo hoặc nhận Sub-Components và StateHook, sau đó đăng ký/hủy đăng ký sự kiện.
- **Giới hạn số dòng**: **Bắt buộc $\le 150$ dòng**.
- **Negative Space**:
  - Không chứa logic nghiệp vụ, tính toán regex hay gọi trực tiếp Backend Services.
  - Không chứa logic validation chi tiết từng control.

### 2.2. State Controller Hook (`Hooks/*StateHook.cs`)
- **Trách nhiệm**:
  - Lưu giữ State hiện tại của Screen (`[ScreenName]FormModel`).
  - Giao tiếp với tầng `1_Backend` thông qua các Interface (`IFormConverterService`, `ISettingsService`, etc.).
  - Cung cấp các hành động bất đồng bộ (`LoadDataAsync()`, `ExecuteActionAsync()`, `ResetState()`).
  - Phát các C# event thông báo thay đổi:
    ```csharp
    public event Action<FormModel>? StateChanged;
    public event Action<string>? ErrorOccurred;
    public event Action<bool>? IsLoadingChanged;
    ```
- **Ràng buộc cứng**: **Tuyệt đối KHÔNG chứa bất kỳ tham chiếu nào tới `System.Windows.Forms.Control`**.

### 2.3. Sub-Components (`Components/*Panel.cs`, `*Box.cs`)
- **Trách nhiệm**:
  - Kế thừa từ `Panel`, `UserControl` hoặc `CardPanel`.
  - Cung cấp hàm `BindData(TModel data)` để hiển thị dữ liệu lên các controls con.
  - Cung cấp hàm `GetFormData()` để trích xuất dữ liệu người dùng nhập.
  - Phát sự kiện tương tác (`event Action? OnSubmitClicked`, `event Action<string>? OnFilterChanged`).
- **Styling**:
  - Luôn sử dụng bảng màu tập trung `AppColors` (ví dụ `AppColors.Primary`, `AppColors.Surface`, `AppColors.TextPrimary`).
  - Font chữ tập trung từ `AppFonts` (`AppFonts.Regular`, `AppFonts.Header`).

### 2.4. Thread-Safety & UI Invocation
- Khi Hook nhận kết quả từ background thread (Win32 clipboard listener, async tasks), việc cập nhật UI trong Component hoặc Screen bắt buộc phải thực hiện trên UI thread:
  ```csharp
  FormStateObserver.InvokeOnUI(() =>
  {
      _previewBox.BindData(result);
  });
  ```

---

## 3. Bảng Kiểm Tra Giới Hạn Mã Nguồn (Code Size & Complexity Gates)

| Thành Phần | Giới Hạn Dòng Code | Quy Tắc Kiểm Soát |
| :--- | :--- | :--- |
| `*Screen.cs` | $\le 150$ dòng | Hard fail nếu $> 250$ dòng |
| `*StateHook.cs` | $\le 250$ dòng | Không chứa `System.Windows.Forms` |
| `*Component.cs` | $\le 300$ dòng | Độc lập, bind qua Model |
| `*FormModel.cs` | $\le 100$ dòng | C# Record hoặc POCO sạch |
