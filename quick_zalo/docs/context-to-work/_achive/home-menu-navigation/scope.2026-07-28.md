# Scope Document — Home Dashboard Điều Hướng Module Chức Năng UI

**Date**: 2026-07-28
**Status**: Final (clarified)
**Feature**: `home-menu-navigation`
**Language**: Tiếng Việt

---

## §1: Problem Summary (Tóm tắt)

Hiện tại, Extension `quick_zalo` chỉ có **duy nhất 1 feature UI** (`message-extraction`) được render trực tiếp trong Sidepanel — không có bất kỳ hệ thống menu hay điều hướng nào. Người dùng cần một **Home Dashboard** (màn hình chính dạng danh sách module) để điều hướng đến các module chức năng UI, tạo tiền đề mở rộng extension với nhiều feature module trong tương lai (CRM, Automation, Settings...).

**Clarifications từ người dùng**:
- Navigation pattern: **Home Dashboard dạng danh sách module** (grid/list cards) — không sidebar, không bottom tabs
- **Không cần icon** cho module
- Module đầu tiên: **message-extraction** (trích xuất tin nhắn + xuất JSON)
- UI hiện tại đang là UI kiểm thử cho message-extraction **chưa phải UI chính thức**

---

## §2: Entry Point (Điểm vào)

| Entry | Path | Vai trò |
|-------|------|---------|
| **Sidepanel Shell** | `src/entrypoints/sidepanel/main.tsx` | Entrypoint WXT — render root React component, gọi `createSidepanelContainer()` |
| **SidepanelApp** | `src/features/message-extraction/ui/SidepanelApp.tsx` | Component kiểm thử hiện tại — render thẳng `Header` → `SearchBar` → `MessageList`, sẽ trở thành UI của module `message-extraction` (hoặc được thay thế) |
| **Popup** | `src/entrypoints/popup/main.tsx` | Entrypoint Popup — hiện là placeholder "Extension setup base successfully loaded" |

---

## §3: Scope Definition (Định nghĩa phạm vi)

### 3.1 Problem Area (Khu vực ảnh hưởng)

Toàn bộ **UI Layer** của extension trong Sidepanel:
- **Sidepanel** — UI chính, nơi Home Dashboard được triển khai
- **Feature module system** — cần pattern chuẩn để đăng ký module vào dashboard
- **Shared UI** — component Dashboard, ModuleCard, ModuleShell

### 3.2 Boundary (Giới hạn phạm vi)

**IN SCOPE:**
- Thiết kế và triển khai **Home Dashboard** — màn hình chính dạng danh sách các module chức năng (dạng card grid/list)
- Cơ chế điều hướng (navigation) từ Dashboard vào module: **click card → render module UI tương ứng**
- Cơ chế quay về Dashboard từ module (back button hoặc breadcrumb)
- Cấu trúc đăng ký module (module registry) để dashboard hiển thị danh sách động
- Module `message-extraction` được tích hợp vào dashboard (UI hiện tại — có thể giữ nguyên hoặc cần refactor nhẹ)
- Trạng thái active module

**OUT OF SCOPE:**
- Phát triển feature module mới (CRM, Automation, ...) — chỉ định nghĩa registry pattern
- Authentication/authorization
- Icons (không cần)
- URL-based routing
- Backend/Infra thay đổi
- Popup (giữ nguyên placeholder)

### 3.3 Architecture Boundary (Ranh giới kiến trúc)

Theo Clean Architecture constraints (`AGENTS.md`):
| Layer | Mức ảnh hưởng | Lý do |
|-------|---------------|-------|
| `entrypoints/sidepanel/` | **Cao** | Sẽ render Dashboard shell thay vì SidepanelApp trực tiếp |
| `features/*/ui/` | **Trung bình** | Mỗi module cung cấp component UI + metadata đăng ký |
| `ui/components/` | **Cao** | Cần thêm HomeDashboard, ModuleCard, ModuleShell |
| `ui/hooks/` | **Trung bình** | Cần useNavigation hook |
| `composition/` | **Thấp** | Có thể cần wiring module list |
| `domain/`, `app/`, `infra/` | **KHÔNG ảnh hưởng** | Navigation thuần UI layer |

---

## §4: Impact Analysis (Phân tích ảnh hưởng)

### 4.1 Direct Impact (Trực tiếp)

| Thành phần | File | Mức độ | Mô tả |
|-----------|------|--------|-------|
| **Sidepanel shell** | `src/entrypoints/sidepanel/main.tsx` | **Cao** | Thay vì render `SidepanelApp`, render `<HomeDashboard />` hoặc `<ModuleShell>` với navigation |
| **SidepanelApp** | `src/features/message-extraction/ui/SidepanelApp.tsx` | **Trung bình** | Component hiện tại đang là "root layout kiểm thử". Có thể giữ nguyên nội dung nhưng cần đóng gói lại như 1 module UI chuẩn. Hoặc thay thế bằng component chính thức của message-extraction |
| **Shared UI components** | `src/ui/components/` | **Cao** | Cần thêm: `HomeDashboard`, `ModuleCard`, `ModuleShell` |
| **Shared UI hooks** | `src/ui/hooks/` | **Trung bình** | Cần thêm: `useNavigation` (activeModule, setActiveModule, modules, goBack) |
| **Feature index** | `src/features/index.ts` | **Trung bình** | Định nghĩa module registry — danh sách các module có sẵn |
| **message-extraction metadata** | `src/features/message-extraction/` | **Thấp** | Cần export metadata (id, title) để đăng ký vào dashboard |
| **Composition container** | `src/composition/sidepanel-container.ts` | **Không đổi** | Dashboard chỉ dùng React state, không cần DI phức tạp |

### 4.2 Indirect Impact (Gián tiếp)

| Thành phần | File | Mức ảnh hưởng | Mô tả |
|-----------|------|---------------|-------|
| Future modules (CRM, Settings, etc.) | `src/features/crm/ui/`, v.v. | **Thiết kế** | Sẽ kế thừa pattern registry từ message-extraction |
| Background/Content scripts | `src/entrypoints/background/`, `src/entrypoints/content/` | **Không** | UI change only |
| Domain/Infra layer | `src/domain/`, `src/infra/` | **Không** | UI change only |

### 4.3 Navigation Flow Pattern

Home Dashboard khác với sidebar/tab navigation ở chỗ:

```
Dashboard (mặc định khi load)
  ├── Card: Trích xuất tin nhắn  → click → hiển thị MessageExtractionPage (full content)
  ├── Card: CRM (future)         → click → hiển thị CrmPage
  ├── Card: Cài đặt (future)     → click → hiển thị SettingsPage
  └── [nút Back/Home]            → click → quay về Dashboard
```

Không có sidebar hay tab bar liên tục — module chiếm toàn bộ content area khi được chọn. Người dùng dùng nút "Back" hoặc "Home" để quay về danh sách module.

---

## §5: Call Chain (Chuỗi gọi)

### 5.1 Hiện tại (Current flow)

```
wxt render
  → sidepanel/index.html
    → main.tsx
      → createSidepanelContainer()
      → <SidepanelApp />                [features/message-extraction/ui]
        → <Header />
        → <SearchBar />
        → <MessageList />
```

### 5.2 Target flow (Home Dashboard)

```
wxt render
  → sidepanel/index.html
    → main.tsx
      → createSidepanelContainer()
      → <AppShell>                       [ui/components/AppShell]
        → {activeModule === null
            ? <HomeDashboard />           [ui/components/HomeDashboard]
                → <ModuleCard             cho mỗi module trong registry
                    title="Trích xuất tin nhắn"
                    description="..."
                    onClick= → set activeModule />
            : <ModulePage>                [ui/components/ModulePage]
                → <BackButton onClick={goBack} />
                → <activeModule.component />
          }
```

### 5.3 Module Registration Chain

```
ModuleRegistry (src/features/registry.ts)
  → định nghĩa: ModuleDef[] = [{ id, title, description, component }, ...]
  → import bởi composition/sidepanel-container hoặc directly bởi AppShell/HomeDashboard
  → HomeDashboard dùng list này để render cards
  → Click card → setActiveModule(id) → render tương ứng trong ModulePage
```

---

## §6: Data Flow (Luồng dữ liệu)

### 6.1 Input

| Input | Source | Description |
|-------|--------|-------------|
| Module registry | `src/features/registry.ts` | Danh sách module: id, title, description, component |
| User click card | `HomeDashboard` → `ModuleCard` | Chuyển đến module |
| User click back | `ModulePage` → back button | Quay về HomeDashboard |

### 6.2 Output

| Output | Destination | Description |
|--------|-------------|-------------|
| Active module render | Content area (`ModulePage`) | Component của module đang active |
| Dashboard visibility | AppShell | Dashboard hiện khi `activeModule === null`, ẩn khi có active module |

### 6.3 Dependencies (đề xuất)

```
AppShell (dùng React Context hoặc useState đơn giản)
  ├── activeModuleId: string | null         — null = dashboard
  ├── setActiveModule(id)                   — chọn module
  ├── goBack()                              — về dashboard
  └── modules: ModuleDef[]                  — từ registry

HomeDashboard
  ├── modules: ModuleDef[]
  └── render: danh sách <ModuleCard>

ModuleCard
  ├── title: string
  ├── description: string (optional)
  └── onClick: () => void

ModulePage
  ├── module: ModuleDef
  ├── onBack: () => void
  └── render: <module.component />
```

---

## §7: Affected Components (Các thành phần bị ảnh hưởng)

### 7.1 Files — Detailed

#### Files cần SỬA ĐỔI

| File | Path | Lý do | Mức thay đổi |
|------|------|-------|-------------|
| `main.tsx` (sidepanel) | `src/entrypoints/sidepanel/main.tsx` | Render `<AppShell>` thay vì `<SidepanelApp />` | ~5 dòng |
| `features/index.ts` | `src/features/index.ts` | Hiện rỗng — có thể re-export registry | ~3 dòng |
| `SidepanelApp.tsx` | `src/features/message-extraction/ui/SidepanelApp.tsx` | Có thể cần tinh chỉnh layout để fit vào ModulePage (không còn fullscreen) | ~5 dòng |
| `message-extraction UI exports` | `src/features/message-extraction/ui/index.ts` | Export components chính để registry import | ~3 dòng |

#### Files cần TẠO MỚI

| File | Path | Mục đích | Kích thước ước tính |
|------|------|----------|-------------------|
| `registry.ts` | `src/features/registry.ts` | **Module Registry** — định nghĩa `ModuleDef[]` danh sách tất cả module, kiểu dữ liệu `ModuleDef` | ~30 dòng |
| `AppShell.tsx` | `src/ui/components/AppShell.tsx` | **Root shell** — quản lý active state, render Dashboard hoặc ModulePage | ~50 dòng |
| `HomeDashboard.tsx` | `src/ui/components/HomeDashboard.tsx` | **Dashboard UI** — render tiêu đề + danh sách `ModuleCard` | ~60 dòng |
| `ModuleCard.tsx` | `src/ui/components/ModuleCard.tsx` | **Card component** — hiển thị title + description, click để navigate | ~40 dòng |
| `ModulePage.tsx` | `src/ui/components/ModulePage.tsx` | **Module wrapper** — chứa back button + render component module | ~40 dòng |
| `use-navigation.ts` | `src/ui/hooks/use-navigation.ts` | **Navigation hook** — activeModule, setter, goBack | ~40 dòng |

**Tổng quan files affected: 11 files (4 sửa + 6 tạo mới)**

### 7.2 Module Boundary — `message-extraction`

Module `message-extraction` cần đảm bảo các yếu tố sau:
1. Export component chính: `MessageExtractionPage` (có thể là `SidepanelApp` hiện tại đã refactor)
2. Export metadata: `{ id: 'message-extraction', title: 'Trích xuất tin nhắn', description: '...' }`
3. Component không phụ thuộc vào fullscreen viewport (sẽ được render trong ModulePage có padding)

### 7.3 Functions/APIs affected

| Function/API | File | Vai trò |
|-------------|------|---------|
| `useExtractedMessages()` | `src/features/message-extraction/ui/hooks/useExtractedMessages.ts` | **Giữ nguyên** — không thay đổi logic |
| `useZaloTabStatus()` | `src/features/message-extraction/ui/hooks/useZaloTabStatus.ts` | **Giữ nguyên** |
| `Header`, `SearchBar`, `MessageList` | `src/features/message-extraction/ui/components/` | **Giữ nguyên** — chỉ thay đổi layout wrapper |

---

## §8: Evidence (Bằng chứng)

<evidence>
  <file>src/entrypoints/sidepanel/main.tsx</file>
  <line>4</line>
  <finding>Import trực tiếp `SidepanelApp` từ `@features/message-extraction/ui/SidepanelApp` — không có Navigation/Dashboard wrapper nào</finding>
</evidence>

<evidence>
  <file>src/entrypoints/sidepanel/main.tsx</file>
  <line>14</line>
  <finding>Render thẳng `<SidepanelApp />` — không có layer trung gian như AppShell hay Dashboard</finding>
</evidence>

<evidence>
  <file>src/features/message-extraction/ui/SidepanelApp.tsx</file>
  <line>19-39</line>
  <finding>Component chiếm toàn bộ viewport (`height: 100vh`), là root layout — cần refactor để không còn fullscreen nếu muốn nhúng vào ModulePage</finding>
</evidence>

<evidence>
  <file>src/ui/components/</file>
  <line>1</line>
  <finding>Chỉ có duy nhất 1 shared component: `ErrorBoundary.tsx` — không có Dashboard/Card/Shell component</finding>
</evidence>

<evidence>
  <file>src/ui/hooks/</file>
  <line>1</line>
  <finding>Chỉ có 2 hooks: `use-app-config.ts`, `use-extension-shortcuts.ts` — không có useNavigation</finding>
</evidence>

<evidence>
  <file>src/features/index.ts</file>
  <line>1-2</line>
  <finding>File index của features hiện là rỗng — chưa có module registry hay danh sách module nào</finding>
</evidence>

<evidence>
  <file>src/features/</file>
  <line>1</line>
  <finding>Chỉ có duy nhất 1 feature module: `message-extraction` — dashboard chỉ có 1 card</finding>
</evidence>

---

## §9: Confidence Assessment (Đánh giá độ tin cậy)

```yaml
overall_confidence: 92
breakdown:
  entry_point_identification: 95
    reason: "Sidepanel/main.tsx là entry point UI rõ ràng duy nhất"
  scope_definition: 93
    reason: "Đã clarify navigation pattern (Home Dashboard), module scope (1 module + registry), không icon"
  impact_map: 90
    reason: "Đã trace tất cả files liên quan, verify bằng read_file cụ thể"
  architecture_compliance: 92
    reason: "Navigation layer thuần UI, không chạm domain/app/infra"
resolved_from_user_clarification:
  - "Navigation pattern: Home Dashboard (dạng danh sách module card) — đã confirm"
  - "Không cần icon — đã confirm"
  - "Chỉ 1 module hiện tại (message-extraction) — đã confirm"
  - "UI hiện tại là kiểm thử — cần hoàn thiện khi chuyển vào module chính thức"
  - "Popup giữ nguyên placeholder — implicit từ việc không đề cập"
```

---

## §10: Resolved Questions (Câu hỏi đã được làm rõ)

| # | Question | Resolution |
|---|----------|-----------|
| 1 | Navigation pattern? | ✅ **Home Dashboard** — danh sách module dạng card grid. Click vào card → vào module. Back button → quay về dashboard |
| 2 | Có icon không? | ✅ **Không cần icon** — chỉ title + description text |
| 3 | Module scope? | ✅ **1 module:** message-extraction. Các module khác sẽ thêm sau qua registry |
| 4 | Trạng thái UI hiện tại? | ✅ **UI hiện tại là kiểm thử** — SidepanelApp cần được hoàn thiện/chỉnh sửa khi đưa vào module chính thức |
| 5 | Popup có cần thay đổi? | ✅ **Giữ nguyên** — không thuộc scope triển khai dashboard |

---

## §11: Architectural Recommendations (Đề xuất tham khảo)

### ModuleRegistry type

```typescript
// src/features/registry.ts
export interface ModuleDef {
  id: string;                            // 'message-extraction'
  title: string;                         // 'Trích xuất tin nhắn'
  description: string;                   // 'Trích xuất nội dung hội thoại Zalo và xuất JSON'
  component: React.ComponentType;        // Component chính
}

export const MODULES: ModuleDef[] = [
  {
    id: 'message-extraction',
    title: 'Trích xuất tin nhắn',
    description: 'Trích xuất nội dung hội thoại Zalo Web và xuất dữ liệu JSON',
    component: SidepanelApp,   // hoặc MessageExtractionPage (refactored)
  },
];
```

### Navigation state (simple — không cần Context nếu chỉ 1 cấp)

```typescript
// src/ui/hooks/use-navigation.ts
interface NavigationState {
  activeModule: ModuleDef | null;   // null = đang ở Dashboard
  navigateTo: (module: ModuleDef) => void;
  goHome: () => void;
}
```

### AppShell hierarchy

```tsx
// src/ui/components/AppShell.tsx
<ErrorBoundary>
  {activeModule === null ? (
    <HomeDashboard modules={MODULES} onSelect={navigateTo} />
  ) : (
    <ModulePage module={activeModule} onBack={goHome} />
  )}
</ErrorBoundary>
```

### Ghi chép về SidepanelApp hiện tại

Component `SidepanelApp.tsx` (dòng 21: `height: '100vh'`) hiện đang chiếm toàn bộ viewport với style inline. Khi được nhúng vào `ModulePage`:
- Cần loại bỏ `height: 100vh` hoặc đổi thành `height: 100%` 
- Cần loại bỏ `boxSizing: 'border-box'` nếu ModulePage đã quản lý padding
- Phần Header (dòng 23) hiện có `position: 'relative'` với toast absolute — cần kiểm tra z-index

---

**Document Status**: Context Complete — No Code Changes Made

**Next Step**: Sẵn sàng cho fix phase — triển khai Home Dashboard + tích hợp module message-extraction.
