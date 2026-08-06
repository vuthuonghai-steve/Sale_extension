---
feature: message-extraction
date: 2026-08-02
status: Ready-for-approval
skill: context-before-fix (fix phase planning)
confidence: 90
scope: fix-plan-c2-double-publish
source_scope_doc: docs/context-to-work/message-extraction/scope.2026-08-02.md
decision: "Single publisher = ZaloDomObserver (user approved 2026-08-02)"
---

# Fix Plan — C2 (Inject Normalizer) + Double-Publish (Single Publisher)

**Date**: 2026-08-02
**Status**: Ready-for-approval (chưa execute — chờ user duyệt)
**Phạm vi**: CHỈ C2 + double-publish. F3 (Evlog), dead code wiring, Q3 (state source) **ngoài scope** — xem §7.

---

## §1: Mục Tiêu & Success Criteria

### Mục tiêu
1. **C2**: Loại bỏ `new DataNormalizationService()` khỏi use case — inject qua deps object theo pattern chuẩn dự án (`VerifySelectionUseCaseDeps`, `quick-search.container.ts:48-53`).
2. **Double-publish**: Đảm bảo chỉ có **1 publisher duy nhất** cho `MESSAGE_CAPTURED` (`ZaloDomObserver`) — use case không còn publish, loại bỏ rủi ro double-publish khi wire tương lai.

### Success Criteria (đo được)
| # | Criterion | Cách verify |
|---|---|---|
| SC-1 | `grep "new DataNormalizationService(" src/app/` = 0 match | grep |
| SC-2 | `grep "MESSAGE_CAPTURED" src/app/` = 0 match (use case không còn publish; contract/observer/test-observer vẫn có) | grep |
| SC-3 | `npm run typecheck` exit 0 | typecheck |
| SC-4 | `npm run test` pass (3 TC của extract-message.use-case.test.ts cập nhật) | test |
| SC-5 | Runtime behavior KHÔNG đổi: observer vẫn là nơi duy nhất có thể publish (eventBus optional, no-op khi không wire) | review diff |
| SC-6 | Docs `message-extraction.md` cập nhật contract + pattern check C2 → OK | review docs |

---

## §2: Quyết Định Thiết Kế (đã chốt)

1. **Single publisher = `ZaloDomObserver`** (user approved): nơi data thật được sinh ra; giữ `eventBus?` optional trong `ZaloDomObserverOptions` (không xóa — phục vụ wire tương lai).
2. **`ExtractMessageUseCase` trở thành pure persistence use case**: normalize + save khi gate ON; **bỏ publish** + **bỏ eventBus khỏi deps**.
3. **C2 fix theo hướng inject domain service qua deps object** (không tạo port mới): nhất quán pattern dự án hiện tại (verify-selection inject `RingBufferService`/`MessageMatcherService` trực tiếp qua `import type`; AGENTS.md cho phép app import domain).
4. **Không wire use case trong plan này** (use case vẫn dead code sau fix — an toàn, sạch pattern). Wiring cần giải quyết Q3 (state source) trước → ngoài scope.
5. **Không thêm Evlog** (F3) — ngoài scope, tách plan riêng nếu cần.

---

## §3: Phase 1 — C2 Fix: Inject Normalizer

### 3.1 File: `src/app/use-cases/message-extraction/extract-message.use-case.ts`

| Dòng hiện tại | Thay đổi | Thành |
|---|---|---|
| L8: `import type { IEventBus } ...` | **XÓA** | — (bỏ eventBus) |
| L10-11: `import { MESSAGE_EVENT_TYPES } ...` + `import type { MessageCapturedPayload } ...` | **XÓA** | — |
| L15: `import { DataNormalizationService } ...` (value) | **ĐỔI** | `import type { DataNormalizationService } from '@domain/data-normalization/services/normalization.service';` |
| L30: `private readonly normalizer = new DataNormalizationService();` | **XÓA** | — |
| L32-37: deps `{ eventBus, messageRepository }` | **ĐỔI** | `deps: { messageRepository: IMessageRepository; normalizer: DataNormalizationService }` |
| L40-46: payload build + `eventBus.publish(MESSAGE_CAPTURED, ...)` | **XÓA** | — |
| L52: `this.normalizer.normalize({...})` | **ĐỔI** | `this.deps.normalizer.normalize({...})` |
| L1-6: doc comment | **CẬP NHẬT** | Mô tả: "use case normalize + lưu IndexedDB khi Full Extraction bật; MESSAGE_CAPTURED publish bởi ZaloDomObserver (infra)" |

**Giữ nguyên**: `ExtractMessageInput` (L17-22, `isFullExtractionEnabled` vẫn là gate), `ExtractMessageOutput` (L24-27), flow `if (!isFullExtractionEnabled) return ok({isFullExtracted: false})` (L48-50), error path `saveResult.isErr → err` (L57-60).

**Kết quả**: use case ~45 dòng, dependency = `{ messageRepository, normalizer }`, không còn import event bus.

### 3.2 File: `src/app/use-cases/message-extraction/extract-message.use-case.test.ts`

| Vị trí | Thay đổi |
|---|---|
| L3: `import type { IEventBus } ...` | XÓA |
| L5: `import { MESSAGE_EVENT_TYPES } ...` | XÓA |
| L10-13: `createMockEventBus()` | XÓA |
| L45, L75, L108: `new ExtractMessageUseCase({ eventBus, messageRepository: repository })` | ĐỔI thành `new ExtractMessageUseCase({ messageRepository: repository, normalizer: new DataNormalizationService() })` + thêm import value `DataNormalizationService` |
| L60-67 (TC-01): `expect(eventBus.publish).toHaveBeenCalledWith(...)` | XÓA |
| L90-97 (TC-02): `expect(eventBus.publish).toHaveBeenCalledWith(...)` | XÓA |
| TC-01/TC-03 | Giữ nguyên kỳ vọng `save` / `err` — inject normalizer **thật** (giữ coverage normalize path, minimal change) |

**Lựa chọn thay thế (ghi nhận, không bắt buộc)**: mock normalizer (`normalizer: { normalize: vi.fn() }`) để unit-test thuần — nhưng giảm coverage integration; plan khuyến nghị giữ thật cho minimal change.

### 3.3 Wiring (KHÔNG làm trong plan này — ghi nhận cho tương lai)

Khi wire use case (cần Q3 trước): tạo `src/composition/message-extraction.container.ts` theo pattern `quick-search.container.ts` — `new DataNormalizationService()` ở composition, inject qua deps object. Không tạo port mới.

---

## §4: Phase 2 — Double-Publish Fix: Use Case bỏ Publish

### 4.1 File: `src/app/use-cases/message-extraction/extract-message.use-case.ts` (cùng file Phase 1)

Đã cover ở §3.1 (xóa L40-46). Không cần thay đổi thêm.

### 4.2 File: `src/infra/extraction/zalo-dom-observer.ts` — KHÔNG SỬA CODE (single publisher giữ nguyên)

- Giữ `eventBus?: IEventBus` trong `ZaloDomObserverOptions` (L25).
- Giữ `this.options.eventBus?.publish(MESSAGE_CAPTURED, ...)` (L132-137) — no-op an toàn khi eventBus undefined (production hiện tại: content/index.ts:69-94 không truyền eventBus).
- **Optional (đề xuất, không bắt buộc)**: thêm comment tại L132: `// SINGLE PUBLISHER: MESSAGE_CAPTURED chỉ được publish từ đây (khi eventBus được wire); ExtractMessageUseCase không publish — tránh double-publish`.

### 4.3 Không đổi hành vi runtime

Production path giữ nguyên 100%: `observer → runtime message zalo.message.extracted → SidepanelBridgeService → hook → UI` (xác nhận: không ai consume MESSAGE_CAPTURED qua event bus ở production — quick-search.container.ts:56 subscriber dead, container chưa bootstrap; InMemoryEventBusAdapter chỉ instantiate tại quick-search.container.ts:34).

---

## §5: Phase 3 — Docs Sync (bắt buộc theo AGENTS.md Sync Gate)

### 5.1 File: `Docs/Module-Capabilities/message-extraction.md`

| Section | Thay đổi |
|---|---|
| §2 Capabilities — ExtractMessageUseCase row | Mô tả: bỏ "luôn publish MESSAGE_CAPTURED" → "normalize + lưu IndexedDB khi isFullExtractionEnabled bật (ExtractMessageInput → ExtractMessageOutput)" |
| §3 Boundaries — Event out | "message.captured — publish bởi ZaloDomObserver (infra) khi eventBus được wire; module quick-search đăng ký consume (subscriber hiện chưa được bootstrap)" |
| §4 Cross-Module Links | Cập nhật: ExtractMessageUseCase không còn link event bus; DataNormalizationService link giữ (nhưng qua injection) |
| §7 Pattern Check — C2 | FAIL → **OK** (inject qua deps object, không còn `new` trong app layer) |

### 5.2 File: `docs/context-to-work/message-extraction/scope.2026-08-02.md`

Cập nhật §11: đánh dấu vấn đề #1 (C2) và #5 (double-publish) → "đã có fix plan" (link file này).

### 5.3 KHÔNG cần đổi: `tree_work.md`, `registry.ts` (không đổi cấu trúc module).

---

## §6: Verification & Rollback

### 6.1 Binary Gates
```bash
npm run typecheck   # SC-3
npm run test        # SC-4
```

### 6.2 Grep Verification
```bash
grep -rn "new DataNormalizationService(" src/app/   # SC-1: 0 match
grep -rn "MESSAGE_CAPTURED" src/app/                # SC-2: 0 match
grep -rn "MESSAGE_CAPTURED" src/infra/extraction/zalo-dom-observer.ts  # 1 match (single publisher)
```

### 6.3 Rollback
- Chỉ 2 file code thay đổi (use case + test) — revert bằng git checkout 2 file, không ảnh hưởng runtime (use case chưa wire).

---

## §7: Out of Scope (ghi nhận, KHÔNG làm)

| Hạng mục | Lý do | Cần khi nào |
|---|---|---|
| Wire `ExtractMessageUseCase` vào runtime | Cần Q3 (state source `isFullExtractionEnabled`) trước | Plan wiring riêng |
| F3 — thêm Evlog vào use case | User chỉ yêu cầu C2 + double-publish | Plan riêng (use case core có ghi DB → WARN hợp lệ) |
| Subscriber quick-search (dead) | Không liên quan trực tiếp; roadmap quick-search quyết định | Roadmap quick-search |
| `console.warn/log` thay Evlog (bridge + content) | Ngoài scope | Plan observability riêng |
| Monolithic adapter + `any` (findByHash) | Ngoài scope | Plan storage riêng |
| F4 doc fix (module-docs-generation-skill) | User đang xử lý data-normalization song song (Docs/Temps/6.md) | Sync khi sửa skill |

---

## §8: Tổng Kết Thay Đổi

| File | Hành động | Scope |
|---|---|---|
| `src/app/use-cases/message-extraction/extract-message.use-case.ts` | Sửa: bỏ eventBus/publish, inject normalizer qua deps | C2 + double-publish |
| `src/app/use-cases/message-extraction/extract-message.use-case.test.ts` | Sửa: bỏ eventBus mock/expect, inject normalizer | C2 + double-publish |
| `src/infra/extraction/zalo-dom-observer.ts` | Optional: comment single publisher (không đổi logic) | double-publish |
| `Docs/Module-Capabilities/message-extraction.md` | Sửa: contract + pattern check | Docs sync |
| `docs/context-to-work/message-extraction/scope.2026-08-02.md` | Sửa: §11 link fix plan | Docs sync |

**Tổng**: 2 file code + 2-3 file docs. Estimated diff ~60 dòng code.

---

**Document Status**: Fix Plan Ready — Chưa execute (chờ user duyệt) — No Code Changes Made
