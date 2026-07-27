# 4. Module Registry Pattern

## 4.1 ModuleDef Interface

```typescript
// src/features/registry.ts
import type { ComponentType } from 'react';

/**
 * ModuleDef — định nghĩa một feature module UI trong hệ thống Home Dashboard.
 *
 * Mỗi module là 1 bounded context UI, được render toàn màn hình
 * khi người dùng chọn từ HomeDashboard.
 */
export interface ModuleDef {
  /** ID định danh duy nhất — VD: 'message-extraction', 'crm', 'settings' */
  id: string;

  /** Tên hiển thị — VD: 'Trích xuất tin nhắn' */
  title: string;

  /** Mô tả ngắn — VD: 'Trích xuất nội dung hội thoại Zalo và xuất JSON' */
  description: string;

  /** React Component chính — render khi module được chọn */
  component: ComponentType;
}
```

## 4.2 Module Registry — Implementation

```mermaid
---
config:
  theme: base
---
classDiagram
  class ModuleDef {
    <<interface>>
    +string id
    +string title
    +string description
    +React.ComponentType component
  }

  class registry {
    +ModuleDef[] MODULES
    +registerModule(def: ModuleDef) void
  }

  class messageExtractionModule {
    +string id = 'message-extraction'
    +string title = 'Trích xuất tin nhắn'
    +string description = 'Trích xuất nội dung hội thoại Zalo Web...'
    +ComponentType component = SidepanelApp
  }

  class futureCRMModule {
    +string id = 'crm'
    +string title = 'Quản lý CRM'
    +string description = '...'
    +ComponentType component = CrmPage
  }

  class SidepanelApp {
    <<React.FC>>
  }

  registry "1" --> "1..*" ModuleDef : manages
  ModuleDef <|.. messageExtractionModule : implements
  ModuleDef <|.. futureCRMModule : implements (future)
  messageExtractionModule --> SidepanelApp : references
```

## 4.3 Module Export Convention

Mỗi feature module UI **phải** export theo convention sau:

```typescript
// src/features/message-extraction/ui/index.ts
// (file này cần tạo mới)

import { SidepanelApp } from './SidepanelApp';
import type { ModuleDef } from '@features/registry';

/** ID module — khớp với id trong registry */
export const MODULE_ID = 'message-extraction' as const;

/** Metadata cho Home Dashboard */
export const moduleMeta: Pick<ModuleDef, 'id' | 'title' | 'description'> = {
  id: MODULE_ID,
  title: 'Trích xuất tin nhắn',
  description: 'Trích xuất nội dung hội thoại Zalo Web và xuất dữ liệu JSON',
};

/** Component chính để render */
export { SidepanelApp as Component };
// hoặc: export const Component = SidepanelApp;
```

## 4.4 Registry File — Định nghĩa tập trung

```typescript
// src/features/registry.ts

import type { ComponentType } from 'react';

export interface ModuleDef {
  id: string;
  title: string;
  description: string;
  component: ComponentType;
}

// ---------- Import modules ----------
// Mỗi lần thêm module mới, import và thêm vào MODULES array

import { moduleMeta as msgExtMeta, Component as MsgExtComponent } from './message-extraction/ui';

// ---------- Registry ----------

export const MODULES: ModuleDef[] = [
  {
    ...msgExtMeta,
    component: MsgExtComponent,
  },
  // Future modules:
  // { ...crmMeta, component: CrmComponent },
  // { ...settingsMeta, component: SettingsComponent },
];
```

## 4.5 Adding a New Module — Workflow

```mermaid
---
config:
  theme: base
---
flowchart TD
  A[Create feature directory] --> B[Implement UI component]
  B --> C[Create ui/index.ts với exports chuẩn]
  C --> D[Import vào features/registry.ts]
  D --> E[Thêm vào MODULES array]
  E --> F[Dashboard tự động hiển thị card mới]

  F --> G[User click card]
  G --> H{Navigation}
  H --> I[ModulePage render component]
```

## 4.6 Module Registry — Dependency Graph

```mermaid
---
config:
  theme: base
---
flowchart TB
  subgraph REGISTRY_FILE["features/registry.ts"]
    moduleDefInterface["ModuleDef interface"]
    modulesArray["MODULES: ModuleDef[]"]
  end

  subgraph MESSAGE_EXTRACTION["features/message-extraction/ui/"]
    sidepanelApp["SidepanelApp.tsx"]
    uiIndex["ui/index.ts<br/>export moduleMeta, Component"]
  end

  subgraph FUTURE["Future modules"]
    crm["features/crm/ui/index.ts<br/>(future)"]
    settings["features/settings/ui/index.ts<br/>(future)"]
  end

  subgraph CONSUMERS["Consumers"]
    appShell["AppShell → đọc MODULES"]
    homeDash["HomeDashboard → map cards"]
    modulePg["ModulePage → render component"]
  end

  modulesArray --> moduleDefInterface
  uiIndex --> sidepanelApp
  REGISTRY_FILE --> uiIndex
  REGISTRY_FILE -.-> crm
  REGISTRY_FILE -.-> settings

  appShell --> modulesArray
  homeDash --> modulesArray
  modulePg --> modulesArray
```

## 4.7 Type Safety

```mermaid
---
config:
  theme: base
---
flowchart LR
  subgraph BuildTime["Build Time — TypeScript Check"]
    TSC["tsc --noEmit"]
    TSC --> Check1["Import module có đúng không?"]
    TSC --> Check2["ModuleDef có đủ fields không?"]
    TSC --> Check3["Component có phải React.FC không?"]
    TSC --> Check4["id có bị trùng không? (manual)"]
  end

  subgraph Runtime["Runtime — Module Resolution"]
    AppShell["AppShell"] -->|"MODULES.find(m =%3E m.id === activeId)"| Resolve["Tìm module trong array"]
    Resolve --> Found["Có → render component"]
    Resolve --> NotFound["Không → fallback error message"]
  end

  BuildTime -->|"npm run typecheck"| Pass["✅ Type-safe"]
```

**Lưu ý**: `id` uniqueness cần kiểm tra thủ công hoặc qua test. Không có runtime dedup — mỗi module chịu trách nhiệm có id riêng.

## 4.8 ModuleDef — Quy tắc mở rộng

Khi thêm field mới vào `ModuleDef` (future), cần:

1. Thêm field vào interface `ModuleDef`
2. Update export trong mỗi `features/*/ui/index.ts`
3. Update consumers: `HomeDashboard`, `ModuleCard`
4. Kiểm tra `npm run typecheck` — TypeScript báo lỗi thiếu field ngay

Ví dụ mở rộng (future, không cần ngay):

```typescript
export interface ModuleDef {
  id: string;
  title: string;
  description: string;
  component: ComponentType;
  // Future fields (khi cần):
  // icon?: string;           // Không cần theo scope
  // badge?: number;          // Notification badge
  // disabled?: boolean;      // Disable module tạm thời
  // requiredPermissions?: string[];  // Chrome permissions
}
```
