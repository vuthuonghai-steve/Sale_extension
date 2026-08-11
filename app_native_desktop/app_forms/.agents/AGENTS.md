# Quy tắc chung cho Workspace AppForms

Chi tiết quy chuẩn kiến trúc và pattern chuẩn khi làm việc với Screens trong `2_Frontend/Screens/`:
Xem tài liệu tại [2_Frontend/Screens/AGENTS.md](file:///c:/Users/ADMIN/Documents/workspace/Sale_extension/app_native_desktop/app_forms/2_Frontend/Screens/AGENTS.md).

## Quy chuẩn Cốt lõi:
- **Tách biệt Trách nhiệm**: Áp dụng Component-Driven & Hook Pattern cho mọi Screen.
- **Kích thước file Screen**: `< 150` dòng, chia nhỏ UI thành `Components/` và State vào `Hooks/`.
- **Phân định Type**:
  - `Interface`: `1_Backend/Contracts/Interfaces/`
  - `Entity`: `1_Backend/Contracts/Entities/`
  - `Schema`: `1_Backend/Contracts/Schemas/`
  - `Model/DTO`: `Models/` riêng cho từng Screen hoặc `0_Shared/Types/`.
