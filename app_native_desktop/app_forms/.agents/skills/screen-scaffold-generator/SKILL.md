---
name: screen-scaffold-generator
description: Tự động sinh khung thư mục và mã nguồn chuẩn Component-Driven & Hook Pattern cho Screen WinForms mới trong C# .NET Clean 3-layer (0_Shared, 1_Backend, 2_Frontend). Đảm bảo Screen <= 150 dòng, tách biệt Hook State, Sub-Components, Models và Thread-Safe InvokeOnUI.
category: frontend-scaffolding
version: '1.0.0'
author: 'Steve Void Team'
tags: [winforms, component-driven, hook-pattern, screen-scaffold, csharp, clean-architecture]
---

# Screen Scaffold Generator — WinForms Component-Driven Architecture

## Mission

Skill này chuyên trách việc sinh mã (scaffolding) và cấu trúc hóa toàn bộ một màn hình tính năng mới trong `2_Frontend/Screens/[ScreenName]/` theo chuẩn **Component-Driven & Hook Pattern**, tuân thủ 100% các ràng buộc kiến trúc của `AppForms`.

<instructions>
## Boot Sequence

1. Đọc `SKILL.md` (file này)
2. Đọc `knowledge/scaffold-conventions.md` — Quy ước kiến trúc và phân rã màn hình
3. Đọc `loop/scaffold-checklist.md` — Bộ cổng kiểm soát chất lượng nhị phân
4. Tham chiếu các templates trong `templates/`:
   - `templates/Screen.cs.template` (Root Screen container <= 150 dòng)
   - `templates/StateHook.cs.template` (State & Controller Hook)
   - `templates/Component.cs.template` (Sub-Component Panel/Card)
   - `templates/FormModel.cs.template` (Form Data Model & DTOs)

## 4-Step Scaffolding Workflow

### Step 1: REQUIREMENTS & COMPONENT DECOMPOSITION
- Xác định tên màn hình `[ScreenName]` (PascalCase, e.g. `OrderHistory`, `CustomerManager`).
- Phân rã giao diện thành 2-4 Sub-Components độc lập (e.g. HeaderPanel, FilterPanel, DataGridBox, DetailBox).
- Xác định các Backend Services cần inject vào StateHook (`ISettingsService`, `IFormConverterService`, etc.).
- Thiết kế `[ScreenName]FormModel` phục vụ state nội bộ.

### Step 2: FOLDER SCAFFOLDING
Tạo cấu trúc thư mục hoàn chỉnh:
```text
2_Frontend/Screens/[ScreenName]/
├── Components/
│   ├── [Feature]EditorPanel.cs
│   └── [Feature]PreviewBox.cs
├── Hooks/
│   └── [ScreenName]StateHook.cs
├── Models/
│   └── [ScreenName]FormModel.cs
├── Constants/
│   └── [ScreenName]Constants.cs (nếu cần)
└── [ScreenName]Screen.cs
```

### Step 3: CODE GENERATION WITH STRICT GATES
- **FormModel**: Record hoặc class dữ liệu thuần túy, immutable hoặc notify changes.
- **StateHook**: Nhận `ILogger<THook>` và Service Interfaces, quản lý state, phát `event Action<T>`, **tuyệt đối KHÔNG import WinForms UI Controls**.
- **Components**: Kế thừa `Panel` hoặc `UserControl`, dựng UI với `AppColors`/`AppFonts`, có `BindData(model)` và `GetFormData()`.
- **Root Screen**: Dựng Layout (`TableLayoutPanel`/`SplitContainer`), kết nối Hook và Components, lắng nghe events, **độ dài <= 150 dòng code**.

### Step 4: THREAD SAFETY & VERIFICATION
- Mọi cập nhật UI từ event của Hook phải qua `FormStateObserver.InvokeOnUI` (hoặc `this.Invoke`).
- Kiểm tra Zero-Placeholder: Không còn `TODO`, `FIXME` hay `NotImplementedException`.
- Đăng ký Hook & Services vào DI container trong `Program.cs` nếu cần thiết.
</instructions>

---

## Core Constraints & Negative Space

```yaml
must:
  - screen_file_lines: <= 150 lines (Root Screen.cs)
  - component_file_lines: <= 300 lines per component
  - zero_placeholders: 100% complete implementation, no TODO/NotImplementedException
  - theme_consistency: use AppColors and AppFonts
  - thread_safety: wrap background event dispatches in InvokeOnUI
  - separation_of_concerns:
      Hook: State & Business calls only (Zero System.Windows.Forms controls)
      Components: Pure View rendering & Event emitters
      Screen: Layout assembly & Glue only

must_not:
  - no_direct_backend_calls_in_screen: Screen must not call Services directly
  - no_ui_controls_in_hooks: StateHook must never import WinForms Controls
  - no_hardcoded_colors: Do not write Color.FromArgb(x,y,z) randomly in components
  - no_god_classes: Screen exceeding 250 lines is an instant hard fail
```

---

## Tools

```yaml
primary_tools:
  - write_to_file # Sinh file mã nguồn
  - view_file # Kiểm tra template và code hiện có
  - grep_search # Kiểm tra DI registration và patterns
```

---

## Quality Checklist

```yaml
pre_scaffold_check:
  - [ ] Screen name defined in PascalCase
  - [ ] Sub-components decomposed logically
  - [ ] Required backend contracts and interfaces identified

post_scaffold_check:
  - [ ] Screen.cs file is <= 150 lines
  - [ ] StateHook has ZERO WinForms Control references
  - [ ] All UI updates wrapped in InvokeOnUI
  - [ ] All controls styled with AppColors and AppFonts
  - [ ] No TODO or mock placeholders remaining
```

---

> **File**: `skills/screen-scaffold-generator/SKILL.md`
> **Version**: 1.0.0
