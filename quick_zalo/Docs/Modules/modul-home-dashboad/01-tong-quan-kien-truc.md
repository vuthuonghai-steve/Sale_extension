# 1. Tổng quan Kiến trúc (Architecture Overview)

## 1.1 System Context (C4 Level 1)

```mermaid
---
config:
  theme: base
  themeVariables:
    primaryColor: "#1a73e8"
    primaryTextColor: "#ffffff"
    secondaryColor: "#e8f0fe"
    tertiaryColor: "#f5f5f5"
---
C4Context
  title System Context — Home Dashboard (quick_zalo Extension)

  Person(user, "Người dùng", "Người dùng Zalo Web sử dụng Extension")
  System(quickZalo, "quick_zalo Extension", "Chrome Extension giao tiếp với Zalo Web")

  Boundary(chrome, "Chrome Browser") {
    SystemQueue(zaloWeb, "Zalo Web", "Nền tảng chat Zalo")
    SystemQueue(chromeAPI, "Chrome APIs", "Tabs, Runtime, Storage APIs")
  }

  Rel(user, quickZalo, "Mở Sidepanel", "Click icon extension")
  Rel(quickZalo, zaloWeb, "Trích xuất tin nhắn", "Content Script")
  Rel(quickZalo, chromeAPI, "Gọi browser.* APIs", "Qua WXT Bridge")

  UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

## 1.2 Container Diagram (C4 Level 2)

```mermaid
---
config:
  theme: base
  themeVariables:
    primaryColor: "#1a73e8"
    secondaryColor: "#e8f0fe"
---
C4Container
  title Container Diagram — Home Dashboard trong kiến trúc Extension

  Person(user, "Người dùng", "Mở Sidepanel Extension")

  Boundary(extension, "quick_zalo Chrome Extension") {
    System_Boundary(wxtShell, "WXT Shell (entrypoints/)") {
      Container(sidepanel, "Sidepanel Shell", "React + TypeScript", "Entrypoint chính — render UI")
      Container(background, "Background SW", "Service Worker", "Orchestration hub")
      Container(content, "Content Script", "DOM Bridge", "Giao tiếp với Zalo Web")
      Container(popup, "Popup", "React", "Placeholder — không thay đổi")
    }

    System_Boundary(uiLayer, "UI Layer (Home Dashboard)") {
      Container(appShell, "AppShell", "React Component", "Điều khiển navigation (dashboard ↔ module)")
      Container(moduleReg, "ModuleRegistry", "TypeScript Module", "Danh sách ModuleDef[] — đăng ký module UI")
      Container(dashboard, "HomeDashboard", "React Component", "Màn hình danh sách module")
      Container(modulePage, "ModulePage", "React Component", "Wrapper module active + BackButton")
      Container(msgExtUI, "MessageExtraction UI", "React Component", "Module UI message-extraction")
    }

    System_Boundary(coreLayers, "Core Layers (domain/app/infra)") {
      Container(domain, "Domain Layer", "TypeScript", "Business entities & logic")
      Container(app, "Application Layer", "TypeScript", "Use cases & ports")
      Container(infra, "Infrastructure", "TypeScript", "Adapters: storage, browser, logging")
    }
  }

  Rel(user, sidepanel, "Mở Sidepanel")
  Rel(sidepanel, appShell, "Render", "createRoot")
  Rel(appShell, dashboard, "activeModule === null → render", "Danh sách ModuleCard")
  Rel(appShell, modulePage, "activeModule !== null → render", "Wrapper module active")
  Rel(modulePage, msgExtUI, "Render từ registry", "component từ ModuleDef")
  Rel(moduleReg, dashboard, "Cung cấp danh sách module", "ModuleDef[]")
  Rel(moduleReg, modulePage, "Cung cấp component", "ModuleDef.component")

  Rel(msgExtUI, background, "Gửi/nhận message", "Runtime Messaging")
  Rel(content, background, "Bridge Zalo ↔ Extension", "Runtime Port")

  UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="2")
```

## 1.3 Component Diagram (C4 Level 3) — Home Dashboard

```mermaid
---
config:
  theme: base
---
C4Component
  title Component Diagram — Home Dashboard Internal Structure

  Boundary(sidepanel, "Sidepanel Entry") {
    Component(main, "main.tsx", "WXT Entry", "Render root, ErrorBoundary wrapper")
    Component(container, "sidepanel-container.ts", "Composition Root", "Khởi tạo DI (bus, config)")
  }

  Boundary(nav, "Navigation System") {
    Component(appShell, "AppShell", "React Component", "useNavigation hook + điều hướng")
    Component(navHook, "useNavigation", "React Hook", "activeModule state + setters")
  }

  Boundary(dashUI, "Dashboard UI") {
    Component(homeDash, "HomeDashboard", "React Component", "Grid/list cards + tiêu đề")
    Component(moduleCard, "ModuleCard", "React Component", "Card hiển thị title + description")
    Component(modulePg, "ModulePage", "React Component", "BackButton + render module component")
  }

  Boundary(registry, "Module Management") {
    Component(registryTs, "features/registry.ts", "Module Registry", "ModuleDef[] + type định nghĩa")
  }

  Boundary(msgExt, "Feature: message-extraction") {
    Component(meUI, "ui/index.ts", "Module Exports", "Export component + metadata")
    Component(sidepanelApp, "SidepanelApp", "React Component", "Message extraction UI chính")
  }

  Rel(main, container, "Gọi createSidepanelContainer")
  Rel(main, appShell, "Render <AppShell />", "thay vì SidepanelApp")

  Rel(appShell, navHook, "Sử dụng", "activeModule, navigateTo, goHome")
  Rel(appShell, homeDash, "activeModule === null", "<HomeDashboard />")
  Rel(appShell, modulePg, "activeModule !== null", "<ModulePage />")

  Rel(homeDash, moduleCard, "Render × N", "map over MODULES")
  Rel(moduleCard, registryTs, "Đọc mô tả", "ModuleDef.title, .description")

  Rel(modulePg, registryTs, "Lấy component", "ModuleDef.component")
  Rel(modulePg, meUI, "Render", "<SidepanelApp /> từ module")

  Rel(registryTs, meUI, "Import", "ModuleDef → component")

  UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="2")
```

## 1.4 Layered Architecture Integration

```mermaid
---
config:
  theme: base
---
flowchart TB
  subgraph ENTRYPOINTS["WXT Shell (entrypoints/)"]
    direction LR
    sidepanel["sidepanel/main.tsx<br/>Render root React"]
    content["content/<br/>DOM Bridge"]
    background["background/<br/>SW Orchestration"]
  end

  subgraph NAV_UI["Home Dashboard Navigation (UI Layer)"]
    direction TB
    appShell["AppShell<br/>Root navigation controller"]
    navHook["useNavigation()<br/>activeModule + setters"]
    homeDash["HomeDashboard<br/>Danh sách module"]
    modulePg["ModulePage<br/>Wrapper + BackButton"]
  end

  subgraph FEATURE_UI["Feature Modules (UI)"]
    msgExt["message-extraction/ui<br/>SidepanelApp"]
    futureCRMIcon["future: crm/ui<br/>(sẽ thêm sau)"]
    futureSettingsIcon["future: settings/ui<br/>(sẽ thêm sau)"]
  end

  subgraph REGISTRY["Module Registry"]
    registryTs["features/registry.ts<br/>ModuleDef[]"]
  end

  subgraph CORE["Core Layers (KHÔNG ảnh hưởng)"]
    domain["@domain<br/>Business Logic"]
    appTier["@app<br/>Use Cases"]
    infra["@infra<br/>Adapters"]
  end

  sidepanel --> appShell
  appShell --> navHook

  appShell -- "activeModule === null" --> homeDash
  appShell -- "activeModule !== null" --> modulePg

  homeDash --> registryTs
  modulePg --> registryTs
  registryTs --> msgExt
  registryTs --> futureCRMIcon
  registryTs --> futureSettingsIcon

  msgExt -.->|"không chạm"| CORE

  style CORE fill:#e0e0e0,stroke:#999,stroke-dasharray: 5 5
  style REGISTRY fill:#e3f2fd,stroke:#1a73e8
  style NAV_UI fill:#e8f5e9,stroke:#43a047
  style FEATURE_UI fill:#fff3e0,stroke:#ff9800
  style ENTRYPOINTS fill:#f3e5f5,stroke:#9c27b0
```

## 1.5 Dependency Rules

```
AppShell / HomeDashboard / ModulePage / ModuleCard
  │
  ├── đọc: features/registry.ts (ModuleDef[])
  ├── dùng: ui/hooks/use-navigation.ts
  └── render: features/*/ui/ (component)

features/registry.ts
  ├── import: features/message-extraction/ui (ModuleDef[])
  └── export: ModuleDef[], ModuleDef type

features/message-extraction/ui
  ├── export: component (React.FC)
  ├── export: metadata (id, title, description)
  └── NỘI BỘ: dùng domain/app/infra hooks

→ KHÔNG có dependency ngược từ domain/app/infra vào UI layer
```

### Key Design Decisions

| Decision | Lựa chọn | Lý do |
|----------|----------|-------|
| **State management** | `useState` trong `AppShell` | Navigation chỉ 1 cấp (dashboard ↔ module), không cần Context/Redux |
| **Module registry** | Static `ModuleDef[]` array | Module count nhỏ (< 10), không cần dynamic loading |
| **Back navigation** | `activeModule = null` | Đơn giản, không cần history stack |
| **Error boundary** | `ErrorBoundary` bọc `AppShell` | Kế thừa component đã có |
| **Layout** | Full content switching | Không sidebar/tab — module chiếm toàn bộ content area |
