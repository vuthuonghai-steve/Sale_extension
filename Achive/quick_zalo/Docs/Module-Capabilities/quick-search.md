---
generated_at: "2026-08-01T12:45:00Z"
last_verified: "2026-08-01T12:45:00Z"
status: "verified"
source_skill: "module-docs-generation-skill"
module_type: "functional"
description: "KHÔNG TÌM THẤY — chưa đăng ký src/features/registry.ts"
---

# quick-search — Capability Summary

## 1. Overview

Quick Search & DB Verification: bộ đệm RAM xoay vòng 10 tin nhắn gần nhất kết hợp đối chiếu CSDL 2 tầng khi user bôi đen đoạn text trên Zalo Web — phát hiện tin trùng lặp hoặc xác nhận tin mới hợp lệ.
- Loại module: functional (Module Chức năng) — domain + app + infra + composition (RingBufferService, MessageMatcherService, VerifySelectionUseCase) chạy nền; không có React screen; UI overlay là phụ trợ hiển thị (xem F4)
- moduleMeta: KHÔNG TÌM THẤY — chưa đăng ký src/features/registry.ts (không tồn tại `src/features/quick-search/`)
- Đăng ký tree_work.md: có — `Docs/tree_work.md` line 89, mô tả "Quick Search & DB Verification Feature Module (RAM Buffer & 2-Step DB Check)" — tree khai báo nhánh features/ nhưng thư mục UI feature chưa tồn tại

## 2. Capabilities

| Loại | Symbol | Tệp | Mô tả |
|---|---|---|---|
| entity | BufferedMessageEntity | `src/domain/quick-search/entities/buffered-message.entity.ts` | Tin nhắn đầy đủ lưu trong Ring Buffer RAM: id, conversationId, senderId, rawContent, sanitizedContent, hash, capturedAt |
| service | RingBufferService | `src/domain/quick-search/services/ring-buffer.service.ts` | push (dedup theo hash — trùng thì cập nhật và đưa lên đầu, FIFO capacity mặc định 10), getSnapshot, clear |
| service | MessageMatcherService | `src/domain/quick-search/services/message-matcher.service.ts` | match (fragment → BufferedMessageEntity qua data-id của .chat-item, fallback substring rawContent/sanitizedContent), extractOnTheFlyFromDOM (bóc trực tiếp từ DOM khi buffer không khớp) |
| use case | VerifySelectionUseCase | `src/app/use-cases/quick-search/verify-selection.use-case.ts` | Verify 2 tầng: Layer 1 RAM/DOM match, Layer 2 đối chiếu Dexie (findByAddressAndPrice → findByRawData → findByHash); trả về discriminated union UI action (SILENT_PASS_THROUGH / SILENT_IDLE / toast / center alert modal / success) |
| adapter | DexieMessageRepository | `src/infra/storage/dexie-message-repository.adapter.ts` | Implement IMessageRepository + IDexieMessageRepository; phần tra cứu quick-search: findByHash, findByAddressAndPrice, findByRawData |

- 2-Step DB Check: Step 1 khớp Địa chỉ + Giá tiền, Step 2 khớp Nội dung thô data raw, Step 2b fallback hash.

## 3. Boundaries

| Loại | Tên | Chi tiết |
|---|---|---|
| Event in | message.captured | MessageCapturedPayload {rawContent, senderId, timestamp, conversationId} — từ `src/shared/contracts/events/message-events.contract.ts`; QuickSearchContainerInstance subscribe → push RingBuffer |
| Event in | conversation.changed | ConversationChangedPayload {conversationId} — subscribe → clear RingBuffer |
| Input | DOM Zalo Web | Text selection fragment + targetElement từ DOMSelectionListener (`src/infra/listeners/dom-selection.listener.ts`, debounce 150ms) |
| DB table đọc | messages | IndexedDB (QuickZaloExtensionDB v3): index &id, &hash, conversationId, capturedAt — findByHash/findByAddressAndPrice/findByRawData |
| Gate | isFullExtractionEnabled | true → SILENT_PASS_THROUGH (không verify); false → verify 2 tầng + hiển thị UI |

## 4. Cross-Module Links

- VerifySelectionUseCase → IDexieMessageRepository (DexieMessageRepository) — đối chiếu tin đã trích xuất trong CSDL messages table
- message.captured: ExtractMessageUseCase (module message-extraction) publish → QuickSearchContainerInstance subscribe → RingBufferService push (nguồn `src/composition/quick-search.container.ts` line 56)
- UIOverlayController (`src/ui/controllers/ui-overlay.controller.ts`) hiển thị kết quả verify: mountModeBadge, showCenterAlert, showSuccessToast

## 5. Infrastructure Mapping

| Adapter | Port | Table | Consumer đang dùng |
|---|---|---|---|
| DexieMessageRepository | IDexieMessageRepository | messages | VerifySelectionUseCase (inject qua `src/composition/quick-search.container.ts` line 48) |
| InMemoryEventBusAdapter | IMessageBus (port chung) | — | QuickSearchContainerInstance — event bus nội bộ feature |
| DOMSelectionListener | — | — | QuickSearchContainerInstance — lắng nghe selection trên document.body |

- Dual implementation: không có — DexieMessageRepository là 1 class duy nhất implement 2 port (IMessageRepository + IDexieMessageRepository), cùng file `dexie-message-repository.adapter.ts`.
- Bootstrap: `bootstrapQuickSearchContainer` (singleton) — dừng qua destroy() (stop listener + clear buffer + destroy overlay).

## 6. Docs References

- [Spec: Docs/Specs/quick-search-verification/spec.md](file://Docs/Specs/quick-search-verification/spec.md) — thư mục spec đặt tên `quick-search-verification` (chỉ link, không viết lại nội dung)
- [tree_work.md](file://Docs/tree_work.md)
- [AGENTS.md](file://AGENTS.md)

## 7. Architecture Pattern Check

| # | Tiêu chí | Kết quả | Bằng chứng |
|---|---|---|---|
| 1 | F1 — Single-Responsibility (đúng 1 chức năng: verify selection + đối chiếu DB) | OK | `src/domain/quick-search/` + `src/app/use-cases/quick-search/` chỉ phục vụ verify |
| 2 | F2 — Contract rõ INPUT/OUTPUT/HANDLE | OK | Input VerifySelectionPayload {selectionText, targetElement} → Output VerifySelectionResponse union; error path qua Result + VerifyError |
| 3 | F3 — Có DEBUG + LOG phụ trợ | OK | EvlogLogger dùng trong VerifySelectionUseCase (logger.info/warn/log theo từng IF-01..04) |
| 4 | F4 — KHÔNG lẫn UI | WARN | Module gọi UIOverlayController (`src/ui/controllers/ui-overlay.controller.ts`) để hiển thị toast/modal/badge — nên tách thành UI module riêng |
| 5 | C1 — Không phụ thuộc chéo | OK | Nhận event 1 chiều từ message-extraction; không gọi ngược |
| 6 | C2 — Độc lập qua contract | WARN | Domain MessageMatcherService.match nhận `targetElement: HTMLElement` (`src/domain/quick-search/services/message-matcher.service.ts` line 12) — domain chạm DOM type, trái quy tắc domain pure TS 0 browser deps |

- Kết luận: ⚠️ LỆCH NHẸ — F4 WARN (UI overlay gắn trong functional module, nên tách UI module) + C2 WARN (domain chạm HTMLElement, nên đổi sang DTO/selector string); khuyến nghị tách UIOverlayController ra UI module và đưa DOM type ra khỏi domain layer.
