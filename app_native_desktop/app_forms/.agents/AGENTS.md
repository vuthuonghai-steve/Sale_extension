# 🌟 AI System Charter - Workspace AppForms

Hệ thống Windows Native Desktop C# .NET 6.0 (`net6.0-windows`) - Kiến trúc Clean Layered & Component-Driven UI.

---

## 1. 🏛️ Ranh Giới Phân Tầng & Phân Định Trách Nhiệm

- **`0_Shared/`**: Types, Enums, Constants, Data models nền tảng.
- **`1_Backend/`**: Core logic (Services, Contracts: Interfaces/Entities/Schemas, Win32 Adapters, Utils).
  - *Quy tắc*: Tuyệt đối không import hoặc thao tác trực tiếp với WinForms UI Controls (`TextBox`, `Button`, `Panel`).
- **`2_Frontend/`**: Presentation (Forms, Screens, Shared UI components, Tray).
  - **Screen**: Layout tổng thể, ráp các Components lại với nhau. Độ dài $\le 150$ dòng code (Cấm $> 250$ dòng).
  - **Hooks (`*StateHook.cs`)**: Quản lý state và hành động của Screen. Không chứa UI controls, giao tiếp qua `event Action`.
  - **Components (`Components/`)**: Sub-panels độc lập, tự render UI, bind data qua `BindData(model)` và phát event tương tác.
  - **Models (`Models/`)**: Form/DTO models phục vụ riêng cho Screen.

---

## 2. ⚡ Tiêu Chuẩn Kỹ Thuật Bắt Buộc

1. **Thread-Safety UI**: Mọi cập nhật UI từ luồng ngầm (Clipboard listener, background tasks) bắt buộc phải bọc qua `FormStateObserver.InvokeOnUI` để tránh Cross-Thread Crash.
2. **Persistence & Mutation**:
   - `LeadConverterScreen` chỉ đọc (Read-Only trong RAM).
   - Chỉ `SettingsScreen` được phép lưu/sửa dữ liệu thông qua Atomic File Move (`.tmp` $\to$ `.json`).
3. **Chất Lượng Mã Nguồn**:
   - **Zero-Placeholder**: Cấm để lại `TODO`, `FIXME`, stub tạm thời hoặc `NotImplementedException`.
   - **Verification**: Luôn đảm bảo mã nguồn build thành công qua `dotnet build` trước khi hoàn tất tác vụ.
