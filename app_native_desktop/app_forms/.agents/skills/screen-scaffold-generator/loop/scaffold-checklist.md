# Scaffold Verification Checklist — Quality Gates

> **Purpose**: Checklist kiểm tra cơ học 100% Pass/Fail khi sinh mã Screen WinForms mới.

---

## 1. Directory Structure Checks
- [ ] Màn hình nằm trong `2_Frontend/Screens/[ScreenName]/`
- [ ] Có đầy đủ 3 thư mục con: `Components/`, `Hooks/`, `Models/`
- [ ] Root file `[ScreenName]Screen.cs` đặt ở thư mục gốc của Screen

## 2. Architectural Boundary Checks
- [ ] `[ScreenName]Screen.cs` $\le 150$ dòng code
- [ ] `[ScreenName]StateHook.cs` KHÔNG có using `System.Windows.Forms`
- [ ] StateHook nhận Services qua constructor injection và chỉ dùng Interfaces
- [ ] Components chỉ giao tiếp với Screen qua `BindData`, `GetFormData` và `Events`

## 3. Thread-Safety & UI Invocation Checks
- [ ] Tất cả event subscribers cập nhật UI có bọc `FormStateObserver.InvokeOnUI` (hoặc `Invoke`)
- [ ] Không có truy cập UI trực tiếp từ background task

## 4. UI Style & Zero-Placeholder Checks
- [ ] Tất cả controls dùng màu từ `AppColors`
- [ ] Tất cả fonts dùng từ `AppFonts`
- [ ] 0 placeholder (`TODO`, `FIXME`, `NotImplementedException`, stub trống)
- [ ] Mã nguồn biên dịch thành công qua `dotnet build`
