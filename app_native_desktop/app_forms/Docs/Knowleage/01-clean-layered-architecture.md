# 🏛️ Kiến Trúc Phân Tầng Clean 3-Layer trong AppForms

## 1. Tổng Quan Kiến Trúc
Dự án được xây dựng theo mô hình phân tầng nghiêm ngặt dành cho ứng dụng Desktop Windows Native C# .NET 6.0 (`net6.0-windows`):

```
app_forms/
├── 0_Shared/       # Types, Enums, Constants, Data Models nền tảng (Pure Data)
├── 1_Backend/      # Core logic, Services, Adapters, Infrastructure (CẤM phụ thuộc WinForms UI)
└── 2_Frontend/     # Presentation (Shell, Screens, StateHooks, Sub-Components, Tray)
```

---

## 2. Phân Định Ranh Giới Trách Nhiệm

### 📦 Tầng `0_Shared/`
- **Mục đích**: Chứa các cấu trúc dữ liệu thuần túy (Pure POCOs/DTOs), Enums trạng thái, Route IDs, và Constants dùng chung.
- **Quy tắc**: Tuyệt đối không chứa logic nghiệp vụ, không phụ thuộc vào `1_Backend` hay `2_Frontend`.

### 🏢 Tầng `1_Backend/`
- **Mục đích**: Xử lý toàn bộ logic nghiệp vụ (Services, I/O, File System, Win32 Native API, Clipboard listener, Shortcut self-healing, Rule Engine).
- **Quy tắc vàng**: **CẤM IMPORT hoặc thao tác trực tiếp với WinForms UI Controls** (`TextBox`, `Button`, `Panel`, `Form`). Tầng này hoàn toàn độc lập với UI.

### 🎨 Tầng `2_Frontend/` (Component-Driven UI)
Áp dụng cấu trúc module hóa phân chia thành 4 thành phần rõ ràng:
1. **Screen (`*Screen.cs`)**:
   - Chỉ đóng vai trò ráp nối bố cục (Layout tổng thể) từ các Sub-Components.
   - **Giới hạn kích thước**: $\le 150$ dòng code (tuyệt đối không vượt quá 250 dòng).
2. **StateHook (`*StateHook.cs`)**:
   - Quản lý toàn bộ State, vòng đời dữ liệu và hành động của Screen.
   - Không chứa bất kỳ WinForms UI Control nào; giao tiếp với UI thông qua `event Action<T>`.
   - Giới hạn: $\le 350$ dòng code.
3. **Components (`Components/`)**:
   - Các Sub-panel độc lập, tự quản lý render UI con, nhận dữ liệu qua hàm `BindData(model)` và phát sự kiện ra ngoài.
   - Giới hạn: $\le 300$ dòng code.
4. **Models (`Models/`)**:
   - DTO/ViewModel phục vụ riêng cho việc hiển thị của Screen đó.

---

## 3. Tiêu Chuẩn Thread-Safety Bắt Buộc
Mọi sự kiện kích hoạt từ luồng ngầm (Background Task, Hotkey, Clipboard Hook) khi muốn cập nhật lên giao diện WinForms **bắt buộc phải bọc qua `FormStateObserver.InvokeOnUI`** để ngăn chặn lỗi `Cross-Thread Exception` gây crash ứng dụng.
