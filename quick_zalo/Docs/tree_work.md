# 🏗️ Kiến trúc & Cấu trúc Dự án (Architecture, Layers & Design Patterns) — `quick_zalo`

Tài liệu đặc tả toàn bộ **Kiến trúc Tổng thể (Architecture)**, **Phân tầng (Layers)**, **Quy tắc Phụ thuộc (Dependency Boundaries)**, cùng các **Mẫu thiết kế (Design Patterns)** chủ đạo và chiến lược **Logging & Testing** của dự án Chrome Extension `quick_zalo` (Chrome Manifest V3, WXT Framework, Clean Architecture, React & TypeScript).

---

## 1. 🏛️ Architecture Overview (Kiến trúc Tổng thể)

### Nguyên tắc cốt lõi: "WXT chỉ là Shell — Domain nằm ở Core TypeScript"
- **WXT Shell (`entrypoints/`)**: Đóng vai trò vỏ bọc tích hợp với Chrome API (Manifest generation, Service Worker lifecycle, Content Script injection, Popup/Sidepanel UI, HMR & Build/Publish). **Cấm chứa Business logic**.
- **Core System (`domain/`, `app/`, `infra/`, `composition/`)**: Thuần TypeScript, hoàn toàn độc lập với WXT Framework.
- **Browser Isolation**: Mọi truy xuất API `browser.*` hoặc `chrome.*` chỉ được phép xuất hiện tại các Adapters thuộc tầng hạ tầng (`@infra/browser`).
- **Background Orchestration**: Background Service Worker đóng vai trò trung tâm điều phối (Orchestration Hub); Content Scripts giữ vai trò mỏng (DOM Bridge).

### Sơ đồ Luồng Kiến trúc (Layered & Component Flow):

```txt
┌─────────────────────────────────────────────────────────────┐
│  ENTRYPOINTS (WXT Shell - Chrome Manifest V3 Entry Points)   │
│  background | content | popup | options | sidepanel         │
└───────────────┬─────────────────────────────────────────────┘
                │ Thin Adapters & Event Listeners
┌───────────────▼─────────────────────────────────────────────┐
│  COMPOSITION ROOT (Dependency Injection Wiring)             │
│  background-container | content-container | ui-container    │
└───────────────┬─────────────────────────────────────────────┘
                │ Instantiates & Injects Dependencies
┌───────────────▼─────────────────────────────────────────────┐
│  APPLICATION LAYER (Use Cases, Handlers, DTOs & Ports)       │
│  use-cases | handlers | dto | ports (interfaces)            │
└───────────────┬─────────────────────────────────────────────┘
                │ Consumes Domain Logic
┌───────────────▼─────────────────────────────────────────────┐
│  DOMAIN LAYER (Pure Business Entities & Logic)               │
│  entities | value-objects | policies | domain-events        │
└─────────────────────────────────────────────────────────────┘
                ▲ Implements Application Ports
┌───────────────┴─────────────────────────────────────────────┐
│  INFRASTRUCTURE LAYER (Adapters & External Drivers)          │
│  browser storage | tabs | http | auth | evlog logger | DB    │
└─────────────────────────────────────────────────────────────┘

SHARED CONTRACTS: messages | commands | queries | events | errors | kernel (result.ts)
```

---

## 2. 🧱 Layer Architecture & Directory Structure

Cấu trúc nguồn được quy hoạch tại thư mục `src/` (`srcDir: 'src'` trong `wxt.config.ts`) giúp tách biệt hoàn toàn mã nguồn khỏi các file cấu hình gốc.

### Cấu trúc Thư mục Chuẩn (Production Structure):

```txt
src/
├── entrypoints/                 # WXT Shell — KHÔNG chứa Business logic
│   ├── background/              # Background Service Worker (Event Handlers)
│   ├── content/                 # Content Script (DOM Bridge & Form Automation)
│   ├── popup/                   # Popup React UI App
│   ├── sidepanel/               # Sidepanel React UI App
│   └── options/                 # Options Page App
├── composition/                 # Composition Root — Dependency Injection (DI) per runtime
│   ├── background-container.ts
│   ├── content-container.ts
│   └── ui-container.ts
├── app/                         # Application Layer — Use Cases & Interfaces
│   ├── ports/                   # Interfaces (IStorage, ITabs, IMessageBus, ILogger)
│   ├── use-cases/               # Application Use Cases
│   ├── handlers/                # Message → Use Case Mapping
│   └── dto/                     # Data Transfer Objects
├── domain/                      # Pure Domain Layer — Zero Browser / Framework Deps
│   ├── entities/                # Business Entities
│   ├── value-objects/           # Value Objects (Validations)
│   ├── policies/                # Domain Business Rules & Policies
│   └── events/                  # Pure Domain Events
├── infra/                       # Infrastructure Layer — Adapters implementation
│   ├── browser/                 # Chrome Storage, Tabs, Scripting Adapters
│   ├── logging/                 # Evlog Logger Core, Dual Dispatcher & Ring Buffer
│   ├── storage/                 # IndexedDB / Dexie Repositories
│   └── http/                    # External API Clients
├── features/                    # Bounded Contexts (Feature-First Modules)
│   ├── crm/                     # CRM Feature (domain, app, infra, ui)
│   ├── automation/              # Automation Feature
│   └── sync/                    # Data Sync Feature
├── ui/                          # Shared UI System (React Components, Hooks & Styles)
└── shared/                      # Shared Contracts & Domain Kernel
    ├── contracts/               # Messages, Commands, Queries, Events, Errors
    ├── kernel/                  # Result<T,E>, Brand, Clock utilities
    └── types/                   # Common Type Definitions
```

### Path Aliases (`wxt.config.ts`):
- `@domain` $\rightarrow$ `src/domain`
- `@app` $\rightarrow$ `src/app`
- `@infra` $\rightarrow$ `src/infra`
- `@shared` $\rightarrow$ `src/shared`
- `@features` $\rightarrow$ `src/features`
- `@composition` $\rightarrow$ `src/composition`

### Quy tắc Phụ thuộc giữa các Layer (Dependency Boundary Rules):

| Layer | Được phép Import | Cấm Import |
|:---|:---|:---|
| `domain/` | Pure TS standard libraries | `browser`, WXT, React, `infra`, `app`, `entrypoints` |
| `app/` | `domain`, `shared`, `ports` | `browser`, WXT, React, `entrypoints`, `ui`, `infra` internals |
| `infra/` | `app/ports`, `shared`, external libraries | `domain` internals (chỉ tương tác qua `ports` hoặc `entities`) |
| `features/*/ui` | `app/dto`, `shared/contracts`, React | `infra/browser` trực tiếp |
| `entrypoints/` | `composition` ONLY | `use-case` / `domain` / `infra` trực tiếp |
| `composition/` | Tất cả các tầng (Wiring & DI) | — |

---

## 3. 🎨 Design Patterns Cốt lõi của Dự án

1. **Clean Architecture & Hexagonal (Ports & Adapters):**
   - Tách biệt tuyệt đối phần lõi nghiệp vụ (`domain` và `app`) khỏi chi tiết kỹ thuật và API môi trường (`infra` và `entrypoints`).
   - Tầng `app` khai báo các giao diện `ports` (`IStorage`, `ITabs`, `IMessageBus`, `ILogger`); tầng `infra` chịu trách nhiệm implement các cổng này.

2. **Feature-First + Layer-Second Architecture:**
   - Các tính năng nghiệp vụ lớn được tổ chức độc lập theo Bounded Context trong `src/features/{feature-name}/` (chứa đủ `domain`, `app`, `infra`, `ui`), giúp hệ thống mở rộng dễ dàng mà không gây phình to các thư mục chung.

3. **Dependency Injection (DI) via Composition Root:**
   - Khởi tạo và kết nối các đối tượng Use Cases và Adapters tại duy nhất tầng `composition/` cho từng môi trường thực thi (`background-container`, `content-container`, `ui-container`).
   - Loại bỏ hoàn toàn side-effects tại top-level của các file entrypoints.

4. **Discriminated Union Message Bus (`shared/contracts/messages.ts`):**
   - Mọi thông điệp giao tiếp giữa Background, Content Script và Popup được định nghĩa dạng Discriminated Union (`Message = Command | Query | Event`), đảm bảo Type-Safety 100% khi phát và xử lý tin nhắn.

5. **Functional Error Handling Pattern (`Result<T, E>`):**
   - Loại bỏ mẫu `throw new Error()` không kiểm soát. 100% hàm tại `@domain` và `@infra` trả về kiểu `Result<T, E>` (`Ok<T>` hoặc `Err<E>`), bắt buộc caller phải xử lý cả nhánh thành công lẫn thất bại một cách tường minh.

---

## 4. 📊 Observability & Logging Engine (`Evlog`)

Phân hệ Logging được đặc tả chi tiết tại hồ sơ [`logging-and-testing/spec.md`](file:///home/stveve/Documents/workspace/Sales/extension/quick_zalo/Docs/Specs/logging-and-testing/spec.md), chịu trách nhiệm theo dõi toàn bộ runtime của Extension trên cả 3 entrypoints (`background`, `content`, `popup`).

### 1. Triết lý Observability (LLM Self-Debugging < 3s RCA)
- Mọi log entry đều được đóng gói dưới định dạng JSON cấu trúc chuẩn `Evlog`.
- Định dạng này cho phép LLM Agent tự động phân tích stream log terminal và định vị chính xác file lỗi (`file_line`) cùng nguyên nhân nghiệp vụ (`decision_reason`) trong **< 3 giây**.

### 2. Evlog Schema (7 Trường Bắt buộc):
```typescript
interface AgenticLogEntry<TPayload = Record<string, unknown>> {
  trace_id: string;        // UUIDv4 correlation ID theo vết request/event
  scope: string;           // Tên module (ví dụ '@domain/crm', '@infra/logging')
  level: LogLevel;         // DEBUG | INFO | WARN | ERROR | FATAL
  file_line: string;       // Tọa độ file và dòng code ('src/infra/logging/indexeddb-adapter.ts:142')
  decision_reason: string; // Lý do nghiệp vụ hoặc nguyên nhân sự cố
  payload: TPayload;       // Metadata và biến ngữ cảnh dạng JSON
  timestamp: string;       // Thời gian ISO-8601 UTC
  stack_trace?: string;    // Chuỗi vết gọi hàm khi gặp lỗi ERROR/FATAL
}
```

### 3. Dual Transport Architecture & FIFO Ring Buffer:
- **Dual Transport Dispatcher**: Đẩy log đồng thời ra 2 kênh:
  1. **DevTools Console Transport**: Format màu ANSI/CSS trực quan để developer debug.
  2. **Storage Transport (IndexedDB Ring Buffer)**: Lưu bền vững vào IndexedDB theo cơ chế FIFO Ring Buffer (tối đa 5.000 bản ghi ~ 5MB, TTL 7 ngày). Khi vượt ngưỡng, hệ thống tự động xóa 10% (500 bản ghi) cũ nhất.
- **Hiệu năng**: Độ trễ đóng gói log p95 **< 5ms**, không bao giờ làm dừng UI Main Loop quá **16ms**.

### 4. Storage Fallback & Circuit Breaker:
- Nếu IndexedDB gặp sự cố `QuotaExceededError` hoặc bị khóa, hệ thống tự động chuyển sang **In-Memory Fallback Ring Buffer** và phát cảnh báo ra DevTools Console.
- Tích hợp **Logging Circuit Breaker** tự động ngắt ghi log khi bị burst log > 30 calls/sec để bảo vệ hiệu năng Extension.

---

## 5. 🧪 Testing Strategy (Co-located & Centralized)

Hệ thống áp dụng chiến lược kiểm thử 2 tầng khép kín nhằm bảo đảm chất lượng tuyệt đối theo chuẩn nhị phân (Pass/Fail Gate).

### 1. Co-located Unit & Component Testing (`@domain` & `@infra`)
- **Vị trí**: Đặt đồng vị trí ngay cạnh file mã nguồn (`*.test.ts` hoặc `*.spec.ts`).
  - Ví dụ: `src/domain/crm/contact-validator.ts` $\rightarrow$ `src/domain/crm/contact-validator.test.ts`.
- **Môi trường & Công cụ**: Vitest Browser Mode.
- **Chỉ số Bắt buộc**:
  - Thời gian thực thi single test file **< 1000ms**.
  - Code Statement Coverage $\ge$ **85%**.

### 2. Centralized Integration & E2E Testing (`tests/e2e/`)
- **Vị trí**: Đặt tập trung tại thư mục `tests/e2e/`.
- **Môi trường & Công cụ**: Playwright E2E Integration Suite giả lập trình duyệt Chrome nạp Extension thật + MSW (Mock Service Worker) để mock 100% network APIs.
- **Chỉ số Bắt buộc**: Thời gian thực thi toàn bộ suite **< 30s**.

### 3. Vòng lặp Tự sửa Lỗi (Self-Debugging Loop cho LLM Agent):

```txt
┌─────────────────┐     ┌───────────────────────┐     ┌────────────────────────┐
│  Run Test Suite │ ──> │ Evlog Error Emission  │ ──> │ LLM Parses Terminal    │
│ (Vitest/PW CLI) │     │ (Terminal Log Stream) │     │ Log Stream (< 3000ms)  │
└─────────────────┘     └───────────────────────┘     └────────────────────────┘
         ▲                                                         │
         │                                                         ▼
┌─────────────────┐     ┌───────────────────────┐     ┌────────────────────────┐
│ Verify & Pass   │ <── │ LLM Applies Code Fix  │ <── │ Extract file_line &    │
│ Quality Gate    │     │ to Source File        │     │ decision_reason        │
└─────────────────┘     └───────────────────────┘     └────────────────────────┘
```