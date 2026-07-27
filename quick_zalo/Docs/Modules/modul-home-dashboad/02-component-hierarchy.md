# 2. Hệ thống React Components (Component Hierarchy)

## 2.1 Class Diagram — Component Tree & Contracts

```mermaid
---
config:
  theme: base
---
classDiagram
  class AppShell {
    +ReactNode children
    -ModuleDef~null activeModule
    +navigateTo(module: ModuleDef) void
    +goHome() void
    +render() ReactNode
  }

  class HomeDashboard {
    +ModuleDef[] modules
    +(module: ModuleDef) =%3E void onSelect
    +render() ReactNode
  }

  class ModuleCard {
    +string title
    +string description
    +() =%3E void onClick
    +render() ReactNode
  }

  class ModulePage {
    +ModuleDef module
    +() =%3E void onBack
    -renderModule() ReactNode
    +render() ReactNode
  }

  class ModuleDef {
    <<interface>>
    +string id
    +string title
    +string description
    +React.ComponentType component
  }

  class NavigationState {
    <<interface>>
    +ModuleDef~null activeModule
    +(module: ModuleDef) =%3E void navigateTo
    +() =%3E void goHome
  }

  class useNavigation {
    <<hook>>
    +NavigationState result
  }

  class ErrorBoundary {
    +ReactNode children
    +bool hasError
    +Error~null error
    +render() ReactNode
  }

  class SidepanelApp {
    +render() ReactNode
  }

  AppShell "1" --> "1" useNavigation : uses
  AppShell "1" --> "0..1" HomeDashboard : renders when activeModule === null
  AppShell "1" --> "0..1" ModulePage : renders when activeModule !== null
  AppShell "1" --> "1" ErrorBoundary : wraps

  HomeDashboard "1" --> "1..*" ModuleCard : contains
  HomeDashboard --> ModuleDef : reads module list

  ModulePage --> ModuleDef : reads component

  useNavigation ..|> NavigationState : implements

  SidepanelApp ..|> ModuleDef : registered as component
```

## 2.2 Component Tree Runtime

```mermaid
---
config:
  theme: base
  look: handDrawn
---
flowchart TB
  subgraph RENDER_TREE["Runtime Render Tree"]
    root["&lt;Root&gt;"]
    errorBoundary["&lt;ErrorBoundary&gt;"]
    appShell["&lt;AppShell&gt;"]

    subgraph DASHBOARD_VIEW["Khi activeModule === null"]
      homeDash["&lt;HomeDashboard&gt;<br/>title='Tiện ích mở rộng'"]
      card1["&lt;ModuleCard&gt;<br/>title='Trích xuất tin nhắn'<br/>description='Trích xuất nội dung...'"]
      card2["&lt;ModuleCard&gt;<br/>(future: CRM)"]
      card3["&lt;ModuleCard&gt;<br/>(future: Cài đặt)"]
      homeDash --> card1
      homeDash --> card2
      homeDash --> card3
    end

    subgraph MODULE_VIEW["Khi activeModule === message-extraction"]
      modulePg["&lt;ModulePage&gt;"]
      backBtn["BackButton<br/>← Quay lại"]
      moduleContent["&lt;SidepanelApp&gt;<br/>(từ registry)"]
      header["Header"]
      searchBar["SearchBar"]
      messageList["MessageList"]
      modulePg --> backBtn
      modulePg --> moduleContent
      moduleContent --> header
      moduleContent --> searchBar
      moduleContent --> messageList
    end
  end

  root --> errorBoundary
  errorBoundary --> appShell
  appShell -- "activeModule === null" --> DASHBOARD_VIEW
  appShell -- "activeModule !== null" --> MODULE_VIEW
```

## 2.3 Props Contract — Chi tiết từng Component

### AppShell

```typescript
// State nội bộ — không props
function AppShell() {
  const { activeModule, navigateTo, goHome } = useNavigation();

  return (
    <ErrorBoundary>
      {activeModule === null ? (
        <HomeDashboard modules={MODULES} onSelect={navigateTo} />
      ) : (
        <ModulePage module={activeModule} onBack={goHome} />
      )}
    </ErrorBoundary>
  );
}
```

### HomeDashboard

```typescript
interface HomeDashboardProps {
  modules: ModuleDef[];       // Danh sách module từ registry
  onSelect: (module: ModuleDef) => void;  // Callback khi click card
}

// Render:
// <div className="dashboard">
//   <h1>Tiện ích mở rộng</h1>
//   <div className="module-grid">
//     {modules.map(m => <ModuleCard key={m.id} ... />)}
//   </div>
// </div>
```

### ModuleCard

```typescript
interface ModuleCardProps {
  title: string;              // Tên hiển thị — VD: "Trích xuất tin nhắn"
  description: string;        // Mô tả ngắn — VD: "Trích xuất nội dung hội thoại..."
  onClick: () => void;        // Handler khi click card
}

// Render:
// <button className="module-card" onClick={onClick}>
//   <h2>{title}</h2>
//   <p>{description}</p>
// </button>
```

### ModulePage

```typescript
interface ModulePageProps {
  module: ModuleDef;          // ModuleDef đang active
  onBack: () => void;         // Handler khi click Back
}

// Render:
// <div className="module-page">
//   <header className="module-page-header">
//     <button className="back-button" onClick={onBack}>
//       ← Quay lại
//     </button>
//     <h2>{module.title}</h2>
//   </header>
//   <div className="module-page-content">
//     <module.component />
//   </div>
// </div>
```

## 2.4 CSS Architecture

```mermaid
---
config:
  theme: base
---
flowchart LR
  subgraph STYLES["Styles"]
    globalCSS["ui/style.css<br/>(global styles)"]
    dashCSS["ui/components/HomeDashboard.css<br/>(module-scoped)"]
  end

  subgraph COMPONENTS["Components using styles"]
    appShell["AppShell<br/>-"]
    homeDash["HomeDashboard<br/>.dashboard"]
    moduleCard["ModuleCard<br/>.module-card"]
    modulePg["ModulePage<br/>.module-page"]
  end

  globalCSS --> appShell
  dashCSS --> homeDash
  dashCSS --> moduleCard
  dashCSS --> modulePg
```

**Nguyên tắc styling**:
- Kế thừa `src/ui/style.css` global
- Dashboard-specific styles: file riêng `HomeDashboard.css` hoặc inline styles
- Nhất quán với CSS variables có sẵn
- Không dùng CSS-in-JS library (giữ dependency nhẹ)

## 2.5 Component Lifecycle

```mermaid
---
config:
  theme: base
---
stateDiagram-v2
  [*] --> AppShell_Mounted: createRoot render

  AppShell_Mounted --> Dashboard_Visible: useState init → activeModule = null
  Dashboard_Visible --> ModuleActive: user click ModuleCard → navigateTo(module)
  ModuleActive --> Dashboard_Visible: user click Back → goHome()

  ModuleActive --> ModuleActive: cùng module — re-render (state change)
  Dashboard_Visible --> Dashboard_Visible: cùng dashboard — re-render

  AppShell_Mounted --> [*]: unmount (sidepanel close)
```

### Hook `useNavigation` internal

```typescript
function useNavigation(): NavigationState {
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

## 2.6 Component Size Estimate

| Component | File | Dòng (est.) | Props |
|-----------|------|-------------|-------|
| `AppShell` | `ui/components/AppShell.tsx` | ~40 | none |
| `HomeDashboard` | `ui/components/HomeDashboard.tsx` | ~60 | `modules, onSelect` |
| `ModuleCard` | `ui/components/ModuleCard.tsx` | ~40 | `title, description, onClick` |
| `ModulePage` | `ui/components/ModulePage.tsx` | ~45 | `module, onBack` |
| `useNavigation` | `ui/hooks/use-navigation.ts` | ~25 | — |
| **Total new** | | **~210** | |
