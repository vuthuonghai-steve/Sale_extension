# 10. Context Routing & Modularity Conventions

Tài liệu này hướng dẫn cách tổ chức mô-đun hóa, định tuyến ngữ cảnh cho AI Agent khi làm việc trên codebase `AppForms`.

---

## 1. 🗺️ Sơ Đồ Định Tuyến Ngữ Cảnh (Context Map)

Khi nhận một tác vụ, Agent phải căn cứ vào loại tính năng để đọc đúng các file ngữ cảnh tương ứng trước khi tiến hành code:

| Tác Vụ / Tính Năng | Các File Cần Đọc Đầu Tiên |
| :--- | :--- |
| **Thêm / Sửa Screen UI** | - `2_Frontend/Screens/AGENTS.md`<br>- `2_Frontend/Shared/Theme/AppColors.cs`<br>- `2_Frontend/Shared/Components/`<br>- Screen Hook & Components tương ứng |
| **Thêm / Sửa Parsing & Template Logic** | - `1_Backend/Contracts/Interfaces/IMessageParser.cs`<br>- `1_Backend/Contracts/Interfaces/ITemplateEngine.cs`<br>- `1_Backend/Contracts/Schemas/FormatSchema.cs`<br>- `0_Shared/Data/schemas.json` |
| **Thêm / Sửa Room Code Mapping** | - `1_Backend/Contracts/Interfaces/IRoomCodeRepository.cs`<br>- `0_Shared/Data/room_codes.json`<br>- `1_Backend/Services/JsonRoomCodeRepository.cs` |
| **Thêm / Sửa Cấu Hình & Settings** | - `1_Backend/Contracts/Interfaces/ISettingsService.cs`<br>- `1_Backend/Contracts/Entities/AppSettings.cs`<br>- `2_Frontend/Screens/Settings/` |
| **Thay đổi DI hoặc Vòng đời Ứng dụng** | - `Program.cs`<br>- `2_Frontend/Forms/MainForm.cs`<br>- `2_Frontend/Tray/TrayIconManager.cs` |

---

## 2. 🧩 Nguyên Tắc Mô-đun Hóa Màn Hình (Screen Modularity)

1. **Tính Độc Lập Cao (High Cohesion, Low Coupling)**:
   - Mỗi Screen trong `2_Frontend/Screens/` phải là một "hộp đen" độc lập. `MainForm` chỉ khởi tạo và hiển thị Screen đó thông qua interface hoặc instance, không can thiệp sâu vào nội bộ các button/textbox của Screen.
2. **Local Types vs Shared Types**:
   - Chỉ đưa vào `0_Shared/Types/` các Type mà từ 2 Screen trở lên thực sự sử dụng chung.
   - Các Model/DTO chỉ dùng cho việc nhập liệu của 1 Screen phải nằm trong `2_Frontend/Screens/[ScreenName]/Models/`.

---

## 3. 🧭 Check-list Khi Mở Rộng Tính Năng Mới

Khi thêm một màn hình hoặc tính năng mới:
1. Tạo thư mục `2_Frontend/Screens/[FeatureName]/` theo chuẩn Component-Driven.
2. Định nghĩa Model trong `Models/`.
3. Định nghĩa Hook trong `Hooks/`.
4. Viết các Sub-components trong `Components/`.
5. Tạo Root Screen (`[FeatureName]Screen.cs`) kết nối Hook và Components.
6. Đăng ký Service / Hook mới vào DI Container trong `Program.cs`.
7. Thêm tab hoặc icon điều hướng vào `MainForm.cs`.
8. Chạy `dotnet build` để nghiệm thu.
