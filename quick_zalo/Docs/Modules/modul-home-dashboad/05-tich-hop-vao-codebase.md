# 5. Kế hoạch Tích hợp vào Codebase

## 5.1 File Change Map

```mermaid
---
config:
  theme: base
---
flowchart LR
  subgraph EXISTING["Files hiện tại (sửa đổi)"]
    sidepanelMain["entrypoints/sidepanel/main.tsx<br/>SỬA: thay SidepanelApp thành AppShell"]
    featuresIndex["features/index.ts<br/>SỬA: re-export registry"]
    sidepanelApp["features/message-extraction/ui/SidepanelApp.tsx<br/>SỬA: bỏ height:100vh"]
  end

  subgraph NEW["Files mới"]
    registry["features/registry.ts<br/>MỚI: ModuleDef + MODULES"]
    msgExtUiIndex["features/message-extraction/ui/index.ts<br/>MỚI: export metadata"]
    appShell["ui/components/AppShell.tsx<br/>MỚI: navigation shell"]
    homeDash["ui/components/HomeDashboard.tsx<br/>MỚI: dashboard grid"]
    moduleCard["ui/components/ModuleCard.tsx<br/>MỚI: card component"]
    modulePg["ui/components/ModulePage.tsx<br/>MỚI: module wrapper"]
    useNav["ui/hooks/use-navigation.ts<br/>MỚI: navigation hook"]
  end

  sidepanelMain --> appShell
  appShell --> useNav
  appShell --> homeDash
  appShell --> modulePg
  homeDash --> moduleCard
  modulePg --> registry
  homeDash --> registry
  registry --> msgExtUiIndex
  msgExtUiIndex --> sidepanelApp
  featuresIndex --> registry
```

## 5.2 Chi tiết từng file — Before / After

### 5.2.1 `entrypoints/sidepanel/main.tsx` — SỬA

**Before** (current):
```tsx
import { SidepanelApp } from '@features/message-extraction/ui/SidepanelApp';
import { ErrorBoundary } from '@/ui/components/ErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <SidepanelApp />
    </ErrorBoundary>
  </React.StrictMode>,
);
```

**After**:
```tsx
import { AppShell } from '@/ui/components/AppShell';
import { ErrorBoundary } from '@/ui/components/ErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppShell />
    </ErrorBoundary>
  </React.StrictMode>,
);
```

> **Thay đổi**: Import `AppShell` thay vì `SidepanelApp`. `ErrorBoundary` giữ nguyên.

### 5.2.2 `features/registry.ts` — MỚI

```typescript
// src/features/registry.ts
import type { ComponentType } from 'react';

export interface ModuleDef {
  id: string;
  title: string;
  description: string;
  component: ComponentType;
}

// ---------- Module Imports ----------
import { moduleMeta as msgExtMeta, Component as MsgExtComponent } from './message-extraction/ui';

export const MODULES: ModuleDef[] = [
  {
    ...msgExtMeta,
    component: MsgExtComponent,
  },
];
```

### 5.2.3 `features/message-extraction/ui/index.ts` — MỚI

```typescript
// src/features/message-extraction/ui/index.ts
import { SidepanelApp } from './SidepanelApp';

export const MODULE_ID = 'message-extraction' as const;

export const moduleMeta = {
  id: MODULE_ID,
  title: 'Trích xuất tin nhắn',
  description: 'Trích xuất nội dung hội thoại Zalo Web và xuất dữ liệu JSON',
} as const;

export const Component = SidepanelApp;
```

### 5.2.4 `features/message-extraction/ui/SidepanelApp.tsx` — SỬA

**Before**:
```tsx
<div style={{ height: '100vh', ... }}>
```

**After**:
```tsx
<div style={{ height: '100%', minHeight: '100%', ... }}>
```

> **Chỉ thay đổi**: `height: '100vh'` → `height: '100%'` để không bị tràn khi nằm trong ModulePage.

### 5.2.5 `features/index.ts` — SỬA

**Before**:
```typescript
export {};
```

**After**:
```typescript
export { MODULES, type ModuleDef } from './registry';
```

### 5.2.6 `ui/components/AppShell.tsx` — MỚI

```typescript
// src/ui/components/AppShell.tsx
import React from 'react';
import { useNavigation } from '@/ui/hooks/use-navigation';
import { MODULES } from '@features/registry';
import { HomeDashboard } from './HomeDashboard';
import { ModulePage } from './ModulePage';

export const AppShell: React.FC = () => {
  const { activeModule, navigateTo, goHome } = useNavigation();

  return (
    <>
      {activeModule === null ? (
        <HomeDashboard modules={MODULES} onSelect={navigateTo} />
      ) : (
        <ModulePage module={activeModule} onBack={goHome} />
      )}
    </>
  );
};
```

### 5.2.7 `ui/components/HomeDashboard.tsx` — MỚI

```typescript
// src/ui/components/HomeDashboard.tsx
import React from 'react';
import type { ModuleDef } from '@features/registry';
import { ModuleCard } from './ModuleCard';

interface HomeDashboardProps {
  modules: ModuleDef[];
  onSelect: (module: ModuleDef) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({ modules, onSelect }) => {
  return (
    <div className="dashboard">
      <h1 className="dashboard-title">Tiện ích mở rộng</h1>
      <div className="module-grid">
        {modules.map((m) => (
          <ModuleCard
            key={m.id}
            title={m.title}
            description={m.description}
            onClick={() => onSelect(m)}
          />
        ))}
      </div>
    </div>
  );
};
```

### 5.2.8 `ui/components/ModuleCard.tsx` — MỚI

```typescript
// src/ui/components/ModuleCard.tsx
import React from 'react';

interface ModuleCardProps {
  title: string;
  description: string;
  onClick: () => void;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({ title, description, onClick }) => {
  return (
    <button className="module-card" onClick={onClick} type="button">
      <h2 className="module-card-title">{title}</h2>
      <p className="module-card-description">{description}</p>
    </button>
  );
};
```

### 5.2.9 `ui/components/ModulePage.tsx` — MỚI

```typescript
// src/ui/components/ModulePage.tsx
import React from 'react';
import type { ModuleDef } from '@features/registry';

interface ModulePageProps {
  module: ModuleDef;
  onBack: () => void;
}

export const ModulePage: React.FC<ModulePageProps> = ({ module: mod, onBack }) => {
  const Component = mod.component;

  return (
    <div className="module-page">
      <header className="module-page-header">
        <button className="back-button" onClick={onBack} type="button">
          ← Quay lại
        </button>
        <h2 className="module-page-title">{mod.title}</h2>
      </header>
      <div className="module-page-content">
        <Component />
      </div>
    </div>
  );
};
```

### 5.2.10 `ui/hooks/use-navigation.ts` — MỚI

```typescript
// src/ui/hooks/use-navigation.ts
import { useState, useCallback } from 'react';
import type { ModuleDef } from '@features/registry';

export interface NavigationState {
  activeModule: ModuleDef | null;
  navigateTo: (module: ModuleDef) => void;
  goHome: () => void;
}

export function useNavigation(): NavigationState {
  const [activeModule, setActiveModule] = useState<ModuleDef | null>(null);

  const navigateTo = useCallback((module: ModuleDef) => {
    setActiveModule(module);
  }, []);

  const goHome = useCallback(() => {
    setActiveModule(null);
  }, []);

  return { activeModule, navigateTo, goHome };
}
```

## 5.3 Implementation Phases

```mermaid
---
config:
  theme: base
---
gantt
  title Implementation Timeline — Home Dashboard
  dateFormat  YYYY-MM-DD
  axisFormat  %a

  section Phase 1: Foundation
  Tạo ui/hooks/use-navigation.ts      :a1, 2026-07-28, 1d
  Tạo features/registry.ts             :a2, after a1, 1d

  section Phase 2: UI Components
  Tạo ModuleCard                       :b1, after a2, 1d
  Tạo HomeDashboard                    :b2, after b1, 1d
  Tạo ModulePage                       :b3, after b1, 1d
  Tạo AppShell                         :b4, after b3, 1d

  section Phase 3: Module Integration
  Tạo message-extraction/ui/index.ts   :c1, after b4, 1d
  Sửa SidepanelApp layout              :c2, after c1, 1d
  Sửa entrypoints/sidepanel/main.tsx   :c3, after c2, 1d
  Sửa features/index.ts                :c4, after c3, 1d

  section Phase 4: Verify
  npm run typecheck                    :d1, after c4, 1d
  npm run test                         :d2, after d1, 1d
  Manual QA                            :d3, after d2, 1d
```

## 5.4 Dependency Graph — File Creation Order

```mermaid
---
config:
  theme: base
---
flowchart TD
  %% Layer 1: Foundation
  useNav["1. ui/hooks/use-navigation.ts<br/>Foundation hook"]
  registry["2. features/registry.ts<br/>Module type + registry"]

  %% Layer 2: Components
  moduleCard["3. ui/components/ModuleCard.tsx<br/>Dep: none"]
  homeDash["4. ui/components/HomeDashboard.tsx<br/>Dep: ModuleCard, registry"]
  modulePg["5. ui/components/ModulePage.tsx<br/>Dep: registry"]

  %% Layer 3: Shell
  appShell["6. ui/components/AppShell.tsx<br/>Dep: useNav, HomeDashboard, ModulePage, registry"]

  %% Layer 4: Module Integration
  msgExtIndex["7. features/message-extraction/ui/index.ts<br/>Dep: SidepanelApp"]
  sidepanelAppMod["8. Sửa: SidepanelApp.tsx<br/>height fix"]

  %% Layer 5: Entrypoint
  sidepanelMain["9. Sửa: entrypoints/sidepanel/main.tsx<br/>Replace SidepanelApp with AppShell"]
  featuresIdx["10. Sửa: features/index.ts<br/>Re-export registry"]

  %% Layer 6: Verify
  verify["11. typecheck + test + QA"]

  useNav --> appShell
  registry --> homeDash
  registry --> modulePg
  registry --> appShell
  moduleCard --> homeDash
  homeDash --> appShell
  modulePg --> appShell

  msgExtIndex --> registry
  sidepanelAppMod --> msgExtIndex

  appShell --> sidepanelMain
  registry --> featuresIdx

  appShell --> verify
  sidepanelMain --> verify
  featuresIdx --> verify
```

## 5.5 Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `SidepanelApp` height `100vh` gây scroll double | Cao | Medium | Đổi thành `height: 100%` |
| Module component phụ thuộc `window` height | Thấp | Medium | Test trong ModulePage container |
| Registry import cycle | Thấp | Cao | Giữ registry flat, không circular |
| Missing test coverage | Medium | Low | Co-located test cho navigation hook |
| CSS xung đột với global styles | Medium | Medium | Dùng BEM-style class names |
