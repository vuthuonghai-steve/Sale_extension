# Module Home Dashboard — Tài liệu Kiến trúc

**Module**: `modul-home-dashboad`
**Ngày tạo**: 2026-07-28
**Scope tham chiếu**: [`docs/context-to-work/home-menu-navigation/scope.2026-07-28.md`](../../../docs/context-to-work/home-menu-navigation/scope.2026-07-28.md)
**Kiến trúc cơ sở**: [`Docs/tree_work.md`](../../tree_work.md)

---

## Mục lục tài liệu

| # | Tài liệu | Mô tả |
|---|----------|-------|
| 1 | [`01-tong-quan-kien-truc.md`](01-tong-quan-kien-truc.md) | Tổng quan kiến trúc: C4 Context, Container, Component diagrams |
| 2 | [`02-component-hierarchy.md`](02-component-hierarchy.md) | Hệ thống React components: class diagram, props contract, component tree |
| 3 | [`03-navigation-flow.md`](03-navigation-flow.md) | Luồng điều hướng: state machine, sequence diagram, user interaction |
| 4 | [`04-module-registry-pattern.md`](04-module-registry-pattern.md) | Module Registry: interface, registration pattern, mở rộng |
| 5 | [`05-tich-hop-vao-codebase.md`](05-tich-hop-vao-codebase.md) | Kế hoạch tích hợp: file changes, dependency graph, implementation phases |

---

## Kiến trúc tổng thể (Tóm tắt)

```
Sidepanel Shell (entrypoints/sidepanel/main.tsx)
  └── ErrorBoundary
      └── AppShell (quản lý navigation state)
          ├── [activeModule === null] → HomeDashboard
          │     └── ModuleCard × N (từ ModuleRegistry)
          └── [activeModule !== null] → ModulePage
                ├── BackButton
                └── ModuleComponent (render từ registry)
```

## Nguyên tắc kiến trúc

1. **UI Layer only** — Navigation hoàn toàn nằm ở tầng UI, không ảnh hưởng domain/app/infra
2. **Simple React State** — Dùng `useState` đơn giản, không cần Context/Redux (chỉ 1 cấp navigation)
3. **ModuleRegistry pattern** — Module đăng ký qua danh sách tĩnh `ModuleDef[]`, mở rộng bằng cách thêm phần tử
4. **Component isolation** — Mỗi module UI là 1 `React.ComponentType` độc lập, không chia sẻ state global
5. **Error boundary integration** — Kế thừa `ErrorBoundary` đã có, bọc AppShell

## File structure (mới)

```
src/
├── ui/
│   ├── components/
│   │   ├── AppShell.tsx          ← MỚI: Root shell navigation
│   │   ├── HomeDashboard.tsx     ← MỚI: Dashboard grid/list
│   │   ├── ModuleCard.tsx        ← MỚI: Card component
│   │   └── ModulePage.tsx        ← MỚI: Module wrapper + BackButton
│   └── hooks/
│       └── use-navigation.ts     ← MỚI: Navigation hook
└── features/
    ├── registry.ts               ← MỚI: ModuleRegistry + ModuleDef type
    ├── index.ts                  ← SỬA: Re-export registry
    └── message-extraction/
        └── ui/
            ├── index.ts          ← MỚI: Export page component + metadata
            └── SidepanelApp.tsx  ← SỬA: Refactor layout constraints
```
