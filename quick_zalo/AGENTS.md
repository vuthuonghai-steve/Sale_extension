# 🤖 AGENTS.md — Bản đồ Điều phối & Rules cho LLM Agent tại `quick_zalo`

File này đóng vai trò **Single Source of Truth for Routing** (Bản đồ Điều phối Duy nhất) cho các LLM Agent hoạt động trong repository `quick_zalo` (Chrome Manifest V3 Extension xây dựng trên WXT Framework, Clean Architecture, React & TypeScript).

Tài liệu áp dụng nguyên lý vận hành LLM tại [`synthesis-llm-principles.md`](file:///home/stveve/Documents/workspace/Sales/extension/Docs/synthesis-llm-principles.md), kiến trúc hệ thống tại [`tree_work.md`](file:///home/stveve/Documents/workspace/Sales/extension/quick_zalo/Docs/tree_work.md), đặc tả Observability & Testing tại [`logging-and-testing/spec.md`](file:///home/stveve/Documents/workspace/Sales/extension/quick_zalo/Docs/Specs/logging-and-testing/spec.md), cùng cơ chế **Tách nhỏ Context & Load theo Yêu cầu (On-Demand Context Ingestion)**.

---

## 🗺️ 1. Bản đồ Điều phối Rule (Routing Index)

Agent **bắt buộc** tham chiếu bản đồ dưới đây để xác định rule hoặc tài liệu nào cần nạp dựa trên tác vụ hiện tại, tránh làm rác context window:

| Tác vụ / Ngữ cảnh | Rule / Tài liệu cần tham chiếu | Cơ chế Kích hoạt (Activation Mode) |
|:---|:---|:---|
| **Nguyên lý Tư duy & Hành vi chung** | `@.agents/rules/llm-core-principles.md`<br>`@Docs/synthesis-llm-principles.md` | `Always On` |
| **Chiến lược Quản lý Context & Routing** | `@.agents/rules/context-routing-and-modularity.md` | `Always On` |
| **Cổng Kiểm soát Chất lượng & Build Gate** | `@.agents/rules/code-quality-and-gates.md` | `Always On` |
| **Cú pháp TypeScript, Tech Stack & Conventions** | `@.agents/rules/tech-stack-and-conventions.md`<br>`wxt.config.ts`, `package.json` | `Glob` (`*.ts`, `*.tsx`, `package.json`, `wxt.config.ts`) |
| **Kiến trúc Extension WXT & Clean Layers** | `@.agents/rules/wxt-extension-architecture.md`<br>`@.agents/rules/architecture-and-flow.md`<br>`@Docs/tree_work.md` | `Model Decision` / `Glob` (`entrypoints/**`, `composition/**`) |
| **Observability, Evlog Schema & Result<T,E>** | `@.agents/rules/logging-and-observability.md`<br>`@Docs/Specs/logging-and-testing/spec.md`<br>`@infra/logging/*`, `@shared/kernel/result.ts` | `Glob` (`src/infra/logging/**`, `src/domain/**`, `src/infra/**`) |
| **Module Database & Storage (IndexedDB/Dexie)** | `@.agents/rules/database-and-indexeddb-storage.md` | `Glob` (`src/infra/storage/**`, `Data/Database/*`) |
| **Kiểm thử Co-located (Vitest) & E2E (Playwright)** | `@.agents/rules/testing-and-verification.md`<br>`@Docs/Specs/logging-and-testing/spec.md` | `Model Decision` / `Glob` (`*.test.ts`, `*.spec.ts`, `tests/**`) |

---

## 🏗️ 2. Kiến trúc Module & Path Aliases (`quick_zalo`)

Hệ thống tuân thủ nguyên tắc **"WXT chỉ là shell — Domain nằm ở core pure TypeScript"**:

```txt
src/
├── entrypoints/                 # WXT Shell (Background, Content, Popup, Sidepanel) — KHÔNG chứa business logic
├── composition/                 # Dependency Injection (DI) & Wiring cho từng runtime context
├── app/                         # Application Layer (Use Cases, Ports/Interfaces, Handlers, DTOs)
├── domain/                      # Pure Business Logic (Entities, Value Objects, Policies) — 0 browser deps
├── infra/                       # Infrastructure Adapters (Browser Storage, Tabs, Evlog Logger, IndexedDB, HTTP)
├── features/                    # Bounded Contexts Chức năng (Feature-First Architecture)
├── ui/                          # Shared UI Components, Hooks & Styles (React + CSS)
└── shared/                      # Contracts (Messages, Commands, Queries, Events, Errors) & Kernel (Result<T,E>)
```

### Path Aliases được quy định chuẩn tại `wxt.config.ts`:
- `@domain` $\rightarrow$ `src/domain`
- `@app` $\rightarrow$ `src/app`
- `@infra` $\rightarrow$ `src/infra`
- `@shared` $\rightarrow$ `src/shared`
- `@features` $\rightarrow$ `src/features`
- `@composition` $\rightarrow$ `src/composition`

### Ranh giới Phụ thuộc (Dependency Boundaries):
- `domain/`: Pure TypeScript ONLY. **Cấm import** `browser`, WXT, React, hay `infra`.
- `app/`: Chỉ import `domain`, `shared`, và `ports`. **Cấm import** `browser`, Chrome API, `entrypoints`, hay `ui`.
- `infra/`: Implement các `ports` từ `app`. **Cấm import** trực tiếp internals của `domain`.
- `entrypoints/`: **Chỉ import `composition`** để bootstrap. Không gọi trực tiếp Use Cases hay Domain logic tại top-level.

---

## 🧠 3. 7 Nguyên tắc Định hướng Cốt lõi (LLM Semantic Core)

1. **Domain Anchoring:** Neo chắc không gian vector với đúng thực thể thao tác (WXT Shell, Service Worker, Content Script Isolation, UI Popup React Component, IndexedDB Ring Buffer).
2. **Semantic Density over Ceremony:** Bắt buộc hợp đồng dữ liệu minh bạch (`Result<T, E>`, discriminated union `Message`, `AgenticLogEntry`). Không dùng prose rác.
3. **Context Hydration:** Chỉ đọc tài liệu và rule có liên quan trực tiếp tới nhiệm vụ được giao qua Routing Index.
4. **Dual Knowledge Stream:** Tách biệt kịch bản kỹ thuật (`technical contracts` như strict types, interfaces, schemas) và kịch bản nhận thức (`cognitive intent` như luồng thao tác tự động hóa của người dùng).
5. **Binary Mechanical Quality Gates:** Mọi chỉnh sửa mã nguồn phải vượt qua 100% kiểm tra cơ học (`npm run typecheck`, `npm run test`).
6. **Negative Space (`must_not`):**
   - `must_not`: Không nuốt ngoại lệ (silent catch), không văng unhandled exceptions trong `@domain` và `@infra`.
   - `must_not`: Không dùng `any` bừa bãi hoặc ép kiểu `as any` không có lý do.
   - `must_not`: Không viết side-effects ở top-level của `entrypoints/` (phải nằm trong hàm `main()` hoặc `defineBackground()`).
   - `must_not`: Không import API `browser` hay `chrome` trực tiếp trong tầng `@domain` và `@app`.
7. **Graceful Degradation:** Xử lý fallback an toàn khi thao tác Chrome API, Storage hoặc IndexedDB gặp sự cố (ví dụ: chuyển sang In-Memory Buffer khi trúng `QuotaExceededError`).

---

## 📊 4. Chuẩn Observability, Exception Handling & Testing (`logging-and-testing`)

Theo đặc tả [`logging-and-testing/spec.md`](file:///home/stveve/Documents/workspace/Sales/extension/quick_zalo/Docs/Specs/logging-and-testing/spec.md):

### 1. Agentic Log Schema (`Evlog`):
Mọi log entry sản sinh ra phải có cấu trúc chuẩn 7 trường để hỗ trợ **LLM Self-Debugging (< 3s RCA)**:
- `trace_id` (UUIDv4 correlation ID)
- `scope` (Ví dụ `@domain/crm`, `@infra/logging`)
- `level` (`DEBUG` | `INFO` | `WARN` | `ERROR` | `FATAL`)
- `file_line` (Vị trí code chính xác dạng `src/infra/logging/evlog-logger.ts:42`)
- `decision_reason` (Lý do nghiệp vụ hoặc nguyên nhân sự cố)
- `payload` (JSON metadata)
- `timestamp` (ISO-8601 UTC)

### 2. Handling Lỗi chuẩn `Result<T, E>`:
100% hàm tại `@domain` và `@infra` trả về `Result<T, E>` (`Ok<T>` hoặc `Err<E>`), loại bỏ hoàn toàn `throw new Error()` không được bắt.

### 3. Chiến lược Testing:
- **Co-located Unit Tests:** Đặt cạnh file mã nguồn (`*.test.ts`) trong `@domain` và `@infra`, thực thi qua Vitest Browser Mode (< 1000ms / file).
- **Centralized E2E Tests:** Đặt tại `tests/e2e/`, kiểm thử tích hợp trên môi trường Chrome Extension giả lập với MSW mocking (< 30s total suite).

---

## 🔄 5. Quy trình Kiểm chứng & Đồng bộ hóa Rules

Khi thực hiện nhiệm vụ hoặc tái cấu trúc hệ thống:
1. **Chạy cổng kiểm tra nhị phân (Binary Gate):**
   ```bash
   npm run typecheck
   npm run test
   ```
2. **Cập nhật Rule & Routing Index:** Khi bổ sung module mới, đường dẫn alias mới hoặc thay đổi kiến trúc, Agent **phải tự động cập nhật** file rule tương ứng trong `.agents/rules/` và cập nhật bản đồ chỉ mục tại `AGENTS.md`.
