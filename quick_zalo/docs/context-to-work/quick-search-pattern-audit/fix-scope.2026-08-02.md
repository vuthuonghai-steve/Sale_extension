# Fix Scope — Quick Search: Phân Tích Phạm Vi Xử Lý Từng Lệch Pattern (D1–D9, R1)

**Date**: 2026-08-02
**Status**: Initial
**Tài liệu gốc findings**: `docs/context-to-work/quick-search-pattern-audit/scope.2026-08-02.md`
**Tính chất**: CHỈ phân tích scope fix — **không có giải pháp fix cụ thể, không sửa code**. Mỗi mục nêu: phạm vi chạm, ràng buộc pattern phải tuân theo, blast radius, tiêu chí xác nhận đúng, rủi ro/quyết định cần chốt.

---

## §1: Ma trận ưu tiên tổng quan

| Ưu tiên | Lệch | Lý do | Phụ thuộc |
|---|---|---|---|
| P0 | D5 (any), D6 (implements) | Mechanical, rủi ro thấp, nền type-safe | — |
| P0 | D8 (@ui alias) | Nhỏ, là nền cho import convention | — |
| P1 | D4 (app→infra import) | Ranh giới layer, cần chốt policy logging | Quyết định G3 |
| P1 | D2 (event bus cô lập) | Nền để feature chạy được — **chạm ranh giới message-extraction** | Quyết định G1/G2 |
| P1 | D1 (bootstrap) | Wire feature vào runtime — chỉ có ý nghĩa sau D2 | D2 |
| P2 | D3 (Step 1 dead) | Tăng độ chính xác verify | Quyết định G4 |
| P2 | D7 (drop UI action) | UX: 5/7 kịch bản không hiển thị | D1 |
| P3 | R1 (SHORTCUT_FOCUS_SEARCH) | Ngoài phạm vi quick-search, naming collision | — |
| P3 | D9 (mixed import) | Stylistic, gộp khi chạm file khác | Quyết định G6 |

---

## §2: Chi tiết từng lệch

### D1 — Module không bao giờ được bootstrap (dead code) 🔴

**Phạm vi chạm (candidate files)**:
- `src/entrypoints/content/index.ts` — nơi gọi bootstrap (pattern: `main()` hiện chỉ dùng `createContentContainer()` line 53; có cờ `isZaloWeb` line 54 để gate — bootstrap chỉ nên chạy trên zalo.me).
- `src/composition/content-container.ts` — nơi pattern hiện tại tạo adapters (nhưng hiện **chỉ có `extractDom`**, chưa có storage wiring — xem note).
- `src/composition/quick-search.container.ts` — constructor nhận `BootstrapQuickSearchOptions` (line 16-21): `messageRepository` là bắt buộc, `isFullExtractionEnabled`/`debounceMs`/`capacity` optional.

**Ràng buộc pattern phải tuân theo**:
- `DexieMessageRepository` **chưa được instantiate ở bất kỳ đâu** trong `src/` (grep `new DexieMessageRepository` = 0) — vì vậy D1 buộc phải tạo nơi instantiate adapter (theo pattern `background-container.ts:8-11` — containers tạo adapters trực tiếp: `new BrowserStorage('local')`, `new RuntimeMessageBus()`, ...).
- AGENTS.md: side-effects phải nằm trong `main()` — không top-level (`content/index.ts` đang đúng pattern).
- Container đã có test `quick-search.container.test.ts` — fix phải giữ test xanh (vitest, <1000ms/file).

**Blast radius nếu fix**: kích hoạt toàn chuỗi D2/D3/D7 (container chạy → listener + verify + overlay). Nhưng nếu D2 chưa xử lý, buffer rỗng và mọi verify đều rơi vào IF-04 (không match) → fix D1 trước D2 cho hiệu quả không đáng kể.

**Tiêu chí xác nhận đúng**: chạy extension trên chat.zalo.me → bôi đen đoạn text → UI overlay (badge/alert/toast) xuất hiện; `isQuickSearchContainerInitialized()` = true sau bootstrap.

**Rủi ro/uncertainty**: nguồn `isFullExtractionEnabled` chưa có wiring (mặc định `() => false` → verify luôn bật — có đúng ý định không?); cần chốt nơi khởi tạo repository (content-container mở rộng hay quick-search.container tự tạo mặc định).

---

### D2 — Event bus cô lập, luồng publish→subscribe không tồn tại 🔴

**Phạm vi chạm (candidate files)**:
- `src/composition/quick-search.container.ts:34` — tự tạo `InMemoryEventBusAdapter` riêng, subscribe `MESSAGE_CAPTURED` (line 56) / `CONVERSATION_CHANGED` (line 71) trên bus nội bộ.
- `src/infra/extraction/zalo-dom-observer.ts:106,132` — publish qua `options.eventBus?` (optional) — **content/index.ts:69-94 tạo observer KHÔNG truyền eventBus** (chỉ callbacks `onMessageExtracted`, `onConversationChanged`, ...).
- `src/app/use-cases/message-extraction/extract-message.use-case.ts:46` — publish `MESSAGE_CAPTURED` lên `deps.eventBus` — **use case này KHÔNG nơi nào instantiate** (grep `new ExtractMessageUseCase` = 0).
- `src/shared/kernel/event-bus.interface.ts` (`IEventBus`) + `src/infra/events/in-memory-event-bus.adapter.ts` — contract & adapter hiện có.

**Phát hiện mở rộng (quan trọng)**: toàn bộ event pipeline (ZaloDomObserver → ExtractMessageUseCase → quick-search) **chưa từng được wire ở runtime**. Doc §4 mô tả luồng "ExtractMessageUseCase publish → QuickSearchContainerInstance subscribe" như thể đã hoạt động — thực tế: 3 thành phần, 3 bus riêng (hoặc không có bus), không kết nối.

**Quyết định thiết kế cần chốt trước (G1/G2)**:
- Chiến lược bus dùng chung: 1 instance `IEventBus` tạo ở composition, inject vào cả 2 phía (observer/extract + quick-search container)?
- **Ranh giới**: wiring ExtractMessageUseCase thuộc module **message-extraction** (ngoài scope quick-search) — fix D2 có thể cần 1 task riêng cho module đó, hoặc chấp nhận quick-search chỉ nhận event trực tiếp từ ZaloDomObserver (bỏ qua extract use case) — phải chốt.

**Tiêu chí xác nhận đúng**: bôi đen text trong 10 tin gần nhất → matcher tìm thấy trong buffer (IF-04 không xuất hiện); đổi conversation → buffer bị clear (log hoặc test).

**Rủi ro**: chạm nhiều module; `MessageCapturedPayload` yêu cầu `conversationId` (quick-search.container.ts:63) nhưng ZaloDomObserver publish payload có hay không cần đối chiếu (`zalo-dom-observer.ts:132`).

---

### D3 — Step 1 "Khớp Địa chỉ + Giá" luôn dead (`null, null`) 🟠

**Phạm vi chạm (candidate files)**:
- `src/app/use-cases/quick-search/verify-selection.use-case.ts:144-148` — call site truyền `null, null, matchedEntity.rawContent`.
- `src/infra/storage/dexie-message-repository.adapter.ts:153-208` — 3 nhánh đều có nhân tố `(address ? addrOk : false)` ⇒ address=null ⇒ luôn false.
- `src/domain/data-normalization/services/normalization.service.ts` — **parser address/price đã tồn tại** (NormalizedMessage có `address`, `priceRaw`, `priceNumeric` — entity line 33-46) — nguồn parse có thể tái sử dụng.

**Ràng buộc pattern**: normalizer thuộc domain data-normalization (module khác) — nếu quick-search muốn dùng phải qua port/contract, không import chéo domain module (C1 — không phụ thuộc chéo, doc §7 đánh OK hiện tại).

**Quyết định cần chốt (G4)**: ý định thật của Step 1 là gì? (a) parse address/price từ selection text rồi truyền thật, (b) xóa hẳn Step 1 (giữ Step 2/2b), (c) giữ nguyên hiện trạng (dead). Không có bằng chứng git về intent (xem scope doc Q3) — **bắt buộc user xác nhận** trước khi fix.

**Blast radius nếu fix**: adapter có thể tận dụng index `district, priceNumeric` (dexie-database.ts:17-18) thay toArray — nhưng address là substring match nên vẫn cần scan (liên quan Q5). Test hiện có của adapter/use case cần bổ sung case ADDRESS_PRICE match.

**Tiêu chí xác nhận đúng**: bôi đen text chứa address+giá có trong DB → response `SHOW_CENTER_ALERT_MODAL` với `matchType: 'ADDRESS_PRICE'`.

---

### D4 — App layer import @infra (EvlogLogger) 🟡

**Phạm vi chạm (candidate files)**:
- `src/app/use-cases/quick-search/verify-selection.use-case.ts:11` — `import type { EvlogLogger } from '@infra/logging/evlog-logger'` (use case DUY NHẤT trong `src/app` import từ @infra).
- `src/app/ports/` — **8 ports hiện có, KHÔNG có logger port** (message-repository, shortcut, import-session-repository, normalized-listing-repository, config, message-bus, tabs, storage).
- `src/infra/logging/evlog-logger.ts` — interface hiện tại (Evlog schema 7 trường theo spec logging-and-testing).

**Pattern tham chiếu**: `ExtractMessageUseCase` (module khác) **không dùng logger** — chỉ `Result<T,E>` + error contract (extract-message.use-case.ts:58-60). Doc §7 F3 đánh "OK" vì có logging — nhưng việc đó vi phạm ranh giới app.

**Quyết định cần chốt (G3)**: (a) tạo logger port (app/shared) + adapter infra, composition inject — app chỉ thấy interface; (b) bỏ logger khỏi use case theo pattern ExtractMessageUseCase; (c) chấp nhận hiện trạng (đánh dấu technical debt). Nếu (a): spec Evlog schema phải giữ nguyên (Docs/Specs/logging-and-testing/spec.md).

**Blast radius**: nhỏ hiện tại (1 use case); lớn nếu chọn (a) — đặt tiền lệ cho các use case sau.

**Tiêu chí xác nhận đúng**: `src/app` không còn import nào trỏ `@infra` (grep); typecheck pass.

---

### D5 — `Result<any, ...>` trong findByHash 🟡

**Phạm vi chạm (candidate files)**:
- `src/infra/storage/dexie-message-repository.adapter.ts:133-140` — signature + body.
- `src/app/ports/message-repository.port.ts:54` — contract `Result<BufferedMessageEntity | null, StorageError>`.

**Ràng buộc pattern**: `this.db.messages` là `Table<BufferedMessageEntity, string>` (dexie-database.ts:12) ⇒ `first()` trả `BufferedMessageEntity | undefined` — có thể map `undefined → null` mà không cần `any`. Caller duy nhất (verify-selection.use-case.ts:195-212) đã xử lý `value !== null` — tương thích.

**Blast radius**: rất nhỏ; không đổi hành vi runtime.

**Tiêu chí xác nhận đúng**: `npm run typecheck` pass với kiểu đúng contract; test adapter (dexie-message-repository.adapter.test.ts) xanh.

---

### D6 — `implements` thiếu IDexieMessageRepository 🟡

**Phạm vi chạm**: `src/infra/storage/dexie-message-repository.adapter.ts:7` — khai báo class.

**Ràng buộc**: 2 interface không xung đột method (`IMessageRepository`: save/saveBatch/findExistingHashes/findAll/clearAll/count; `IDexieMessageRepository`: findByHash/findByAddressAndPrice/findByRawData). Hiện chỉ thỏa structural typing — khai báo tường minh giúp compiler bắt lệch contract từ đầu.

**Blast radius**: không đổi hành vi; compile-time enforcement tăng.

**Tiêu chí xác nhận đúng**: typecheck pass; không test nào đổi kết quả.

---

### D7 — 5/7 UI action bị drop im lặng 🟠

**Phạm vi chạm (candidate files)**:
- `src/ui/controllers/ui-overlay.controller.ts` — hiện chỉ có `showCenterAlert`, `showSuccessToast`, `mountModeBadge`, `unmountModeBadge`, `destroy` (line 37-167); **thiếu toast WARNING/INFO/ERROR**.
- `src/composition/quick-search.container.ts:83-90` — chỉ xử lý 2 nhánh; 5 variants còn lại rơi vào vế khuyết.
- Tests: `ui-overlay.controller.test.ts`, `quick-search.container.test.ts` (đã tồn tại — cần mở rộng).

**Ràng buộc pattern**: UI layer dùng Shadow DOM isolation + `data-testid` attributes (center-alert-modal-title, success-toast-message, mode-indicator-badge-label). Message text đã có sẵn trong use case (tiếng Việt, IF-03/IF-04/DB-error) — UI không cần sinh text mới.

**Quyết định cần chốt**: 3 method riêng (`showToastWarning/Info/Error`) hay 1 method generic (`showToast(type, message, durationMs)`) — theo style hiện có (method riêng per component) thì 3 method riêng hợp pattern hơn.

**Blast radius**: chỉ UI + container; không đổi logic use case.

**Tiêu chí xác nhận đúng**: test controller render 3 toast types (Shadow DOM + testid); bôi đen <2 ký tự trên Zalo → toast warning hiển thị.

---

### D8 — Không có alias `@ui` 🟡

**Phạm vi chạm (candidate files)**:
- `wxt.config.ts:13-21` — thêm alias `@ui` → `src/ui` (WXT tự gen `.wxt/tsconfig.json` paths — tsconfig.json extends file đó nên không cần sửa tsconfig tay).
- `src/composition/quick-search.container.ts:11` — đổi relative import sang `@ui/...`.
- `AGENTS.md` — bắt buộc cập nhật danh sách path aliases + routing index (Mandatory Sync Gate).

**Blast radius**: 1 import duy nhất (grep `ui/controllers` = 2 files).

**Tiêu chí xác nhận đúng**: typecheck + build pass; grep không còn `from '../ui/`.

---

### D9 — Mixed import style (relative vs alias) 🟢

**Phạm vi chạm (candidate files)**: `src/app/ports/message-repository.port.ts` (relative line 1-4), `src/infra/storage/dexie-message-repository.adapter.ts` (line 1-5), `src/infra/storage/dexie-database.ts` (line 2-6), `src/domain/quick-search/services/*` (`../entities/...`), `src/app/ports/normalized-listing-repository.port.ts` + `import-session-repository.port.ts` (cần kiểm tra thêm — cùng pattern).

**Ràng buộc**: AGENTS.md định nghĩa aliases nhưng **không bắt buộc dùng**; use cases dùng alias, ports/infra dùng relative. Cần chốt convention (G6) trước khi mass-edit — **không nên fix đơn lẻ**.

**Blast radius**: thuần mechanical, nhưng chạm nhiều file; rủi ro conflict khi batch.

**Tiêu chí xác nhận đúng**: typecheck; review diff không đổi logic.

---

### R1 — `SHORTCUT_FOCUS_SEARCH` không handler (ngoài scope quick-search) 🟢

**Phạm vi chạm (candidate files)**:
- `src/entrypoints/content/index.ts:107-150` — onMessage handler thiếu nhánh `msg.type === 'SHORTCUT_FOCUS_SEARCH'`.
- `src/infra/extraction/zalo-selectors.const.ts` — cần xác minh có selector ô tìm kiếm Zalo hay chưa (file tồn tại; nội dung chưa đọc — **uncertainty**).

**Rủi ro/uncertainty**: selector ô tìm kiếm Zalo Web phụ thuộc DOM thực tế của chat.zalo.me — cần khảo sát bằng e2e (skill e2e-zalo-testing) trước khi xác định selector; có thể DOM Zalo thay đổi (version).

**Tiêu chí xác nhận đúng**: e2e trên chat.zalo.me bấm Alt+Shift+F → focus rơi vào ô tìm kiếm.

**Lưu ý**: đây là tính năng riêng (UI automation), không thuộc module quick-search — nên tách scope riêng nếu xử lý.

---

## §3: Quyết định cần user chốt trước khi vào fix phase (Gates)

| Gate | Câu hỏi | Ảnh hưởng |
|---|---|---|
| G1 | Chiến lược event bus: 1 shared instance qua composition, inject cả 2 phía? | D2 |
| G2 | Ranh giới wiring: quick-search nhận event từ ZaloDomObserver trực tiếp, hay chờ message-extraction wire ExtractMessageUseCase (task riêng)? | D1, D2 |
| G3 | Chính sách logging app layer: tạo logger port / bỏ logger / giữ debt? | D4 |
| G4 | Intent Step 1: parse address+price thật / xóa Step 1 / giữ dead? | D3 |
| G5 | Functional module có cần đăng ký `src/features/registry.ts` (moduleMeta) không, hay chỉ cập nhật tree_work.md? | D1 (mở rộng) |
| G6 | Convention import: alias cho toàn bộ (kể cả ports/infra)? | D9 |

## §4: Confidence Assessment

| Lệch | Confidence scope analysis |
|---|---|
| D1, D2, D4, D5, D6, D7, D8, R1 | 90–95% — verify bằng read/grep trực tiếp |
| D3 (phần intent) | 65% — cần G4 |
| D9 (phạm vi file đầy đủ) | 70% — chưa rà toàn bộ ports |

**Overall Confidence: 88%**

---

**Document Status**: Context Complete — No Code Changes Made
