# 3. Luồng Điều hướng (Navigation Flow)

## 3.1 Navigation State Machine

```mermaid
---
config:
  theme: base
---
stateDiagram-v2
  [*] --> InitialLoad: Extension opened / Sidepanel mounted

  InitialLoad --> Dashboard: render AppShell → activeModule = null
  Dashboard --> Module_messageExtraction: click "Trích xuất tin nhắn" card
  Dashboard --> Module_CRM: (future) click CRM card
  Dashboard --> Module_Settings: (future) click Cài đặt card

  Module_messageExtraction --> Dashboard: click "Quay lại" button
  Module_CRM --> Dashboard: click "Quay lại" button
  Module_Settings --> Dashboard: click "Quay lại" button

  Dashboard --> Dashboard: (stay on dashboard)

  note right of Dashboard: Màn hình chính<br/>Danh sách module card
  note right of Module_messageExtraction: Trích xuất tin nhắn Zalo<br/>SidepanelApp full content
```

## 3.2 Sequence Diagram — User mở Extension và điều hướng

```mermaid
---
config:
  theme: base
---
sequenceDiagram
  actor User as Người dùng
  participant SW as Service Worker
  participant Sidepanel as Sidepanel Shell
  participant AppShell as AppShell
  participant Dash as HomeDashboard
  participant Card as ModuleCard
  participant Registry as ModuleRegistry
  participant ModulePg as ModulePage
  participant MsgExt as SidepanelApp

  User->>SW: Click icon Extension
  SW->>Sidepanel: Kích hoạt sidepanel
  activate Sidepanel

  Sidepanel->>AppShell: Render <AppShell />
  activate AppShell

  AppShell->>AppShell: useState → activeModule = null

  AppShell->>Dash: Render <HomeDashboard modules onSelect />
  activate Dash
  Dash->>Registry: Đọc MODULES[]
  Registry-->>Dash: [message-extraction, ...]
  Dash->>Card: Render <ModuleCard title description onClick />
  deactivate Dash

  Note over Card,User: User thấy danh sách module

  User->>Card: Click card "Trích xuất tin nhắn"
  activate Card
  Card->>AppShell: onSelect → navigateTo(messageExtractionModule)
  deactivate Card

  AppShell->>AppShell: setActiveModule(module)
  AppShell->>Dash: Unmount <HomeDashboard />

  AppShell->>ModulePg: Render <ModulePage module onBack />
  activate ModulePg
  ModulePg->>Registry: Lấy module.component
  Registry-->>ModulePg: SidepanelApp (React.ComponentType)

  ModulePg->>MsgExt: Render <SidepanelApp />
  activate MsgExt

  Note over MsgExt,User: User thấy giao diện trích xuất tin nhắn

  User->>ModulePg: Click "Quay lại" button
  ModulePg->>AppShell: onBack → goHome()
  deactivate ModulePg
  deactivate MsgExt

  AppShell->>AppShell: setActiveModule(null)

  AppShell->>Dash: Render <HomeDashboard />
  activate Dash
  Note over Dash,User: User quay về dashboard
  deactivate Dash

  deactivate AppShell
  deactivate Sidepanel
```

## 3.3 Sequence Diagram — Module Registration & Discovery

```mermaid
---
config:
  theme: base
---
sequenceDiagram
  participant RegistryTs as features/registry.ts
  participant MeUiIndex as features/message-extraction/ui/index.ts
  participant AppShell

  Note over RegistryTs,MeUiIndex: BUILD TIME — Module Registration

  MeUiIndex->>MeUiIndex: Export component + metadata
  Note right of MeUiIndex: export { MessageExtractionPage as Component }<br/>export const id = 'message-extraction'<br/>export const title = 'Trích xuất tin nhắn'

  RegistryTs->>MeUiIndex: Import module
  activate RegistryTs
  RegistryTs->>RegistryTs: Định nghĩa ModuleDef[]
  Note right of RegistryTs: { id, title, description, component }
  deactivate RegistryTs

  Note over RegistryTs,AppShell: RUNTIME — Module Discovery

  AppShell->>AppShell: import { MODULES } from '@features/registry'
  AppShell->>RegistryTs: Đọc MODULES[]
  RegistryTs-->>AppShell: ModuleDef[]

  alt activeModule === null
    AppShell->>AppShell: Render HomeDashboard với modules
  else activeModule !== null
    AppShell->>AppShell: Tìm module trong MODULES, render ModulePage
  end
```

## 3.4 Data Flow Diagram

```mermaid
---
config:
  theme: base
  look: handDrawn
---
flowchart TD
  subgraph INPUT["Input"]
    clickCard["User clicks ModuleCard"]
    clickBack["User clicks Back button"]
  end

  subgraph STATE["Navigation State"]
    navState["useNavigation()<br/>{ activeModule, navigateTo, goHome }"]
    activeModule["activeModule: ModuleDef | null<br/>(null = dashboard)"]
  end

  subgraph RENDER["Render Decision"]
    cond{"activeModule === null?"}
    dashboard["Render HomeDashboard<br/>Grid/list cards"]
    moduleView["Render ModulePage<br/>BackButton + module.component"]
  end

  clickCard -->|"navigateTo(module)"| navState
  clickBack -->|"goHome()"| navState
  navState -->|"setActiveModule"| activeModule
  activeModule --> cond
  cond -->|"Yes"| dashboard
  cond -->|"No"| moduleView
```

## 3.5 Navigation State Contract

```mermaid
---
config:
  theme: base
---
flowchart LR
  subgraph State["NavigationState"]
    direction TB
    am["activeModule<br/>ModuleDef | null"]
    nt["navigateTo(module)<br/>→ setActiveModule(module)"]
    gh["goHome()<br/>→ setActiveModule(null)"]
  end

  subgraph Transitions["State Transitions"]
    T1["null → ModuleDef: Click card"]
    T2["ModuleDef → null: Click Back"]
    T3["ModuleDef → ModuleDef: Click khác (future)"]
  end

  State --> Transitions

  note["State nội bộ trong AppShell<br/>dùng useState, không cần Context"]
```

## 3.6 User Interaction Flow

```mermaid
---
config:
  theme: base
---
flowchart TD
  Start([Mở Sidepanel]) --> Load[Extension load]
  Load --> RenderDash[Render AppShell]
  RenderDash --> CheckModule{activeModule?}

  CheckModule -->|null| ShowDash[Hiện HomeDashboard]
  ShowDash --> ShowCards[Hiện danh sách ModuleCard]
  ShowCards --> UserClick[Người dùng click card]
  UserClick --> SetActive[setActiveModule]
  SetActive --> RenderModule[Render ModulePage]

  CheckModule -->|module| ShowModule[Hiện ModulePage]
  ShowModule --> UserBack[Người dùng click Back]
  UserBack --> GoHome[goHome]
  GoHome --> RenderDash

  ShowModule --> ModuleRefresh[Module tự update nội bộ]
  ModuleRefresh --> ShowModule
```

## 3.7 Error Handling trong Navigation

```mermaid
---
config:
  theme: base
---
flowchart TD
  AppShell --> EB[ErrorBoundary]
  EB --> CheckErr{Có lỗi?}

  CheckErr -->|Không| Render[Render Dashboard hoặc ModulePage]
  CheckErr -->|Có| ErrUI[Hiển thị thông báo lỗi + Thử lại]
  ErrUI -->|Click Thử lại| Reset[resetState]
  Reset --> Render

  Render --> ModuleMount[Module component mount]
  ModuleMount --> ModuleErr{Module throw error?}

  ModuleErr -->|Không| NormalOp[Hoạt động bình thường]
  ModuleErr -->|Có| CatchByEB[ErrorBoundary bắt]
  CatchByEB --> ErrUI
```

**Error scenarios**:

| Scenario | Behavior | User thấy gì? |
|----------|----------|--------------|
| Module component crash | `ErrorBoundary` bắt | Banner lỗi + nút "Thử lại" |
| Module không tìm thấy | `ModulePage` check null | "Module không tồn tại" message |
| Back button khi không có module | `goHome` chỉ set null | Dashboard như bình thường |
