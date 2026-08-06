---
generated_at: "2026-08-01T12:30:00Z"
last_verified: "2026-08-01T12:30:00Z"
status: "verified"
source_skill: "module-docs-generation-skill"
module_type: "functional"
description: "Trích xuất nội dung hội thoại Zalo Web và xuất dữ liệu JSON"
---

# message-extraction — Capability Summary

## 1. Overview

message-extraction, Trích xuất tin nhắn, Trích xuất nội dung hội thoại Zalo Web và xuất dữ liệu JSON.
- Loại module: functional (Module Chức năng) — có domain + app + infra (zalo-dom-observer, ExtractMessageUseCase, DexieMessageRepository) chạy nền; UI debug screen tồn tại nhưng là phụ trợ test (xem F4)
- moduleMeta: đầy đủ (từ `src/features/message-extraction/index.ts`)
- Đăng ký tree_work.md: có — `Docs/tree_work.md` line 88, mô tả "Message Extraction Feature Module"

## 2. Capabilities

| Loại | Symbol | Tệp | Mô tả |
|---|---|---|---|
| entity | ZaloMessage | `src/domain/message-extraction/entities/zalo-message.entity.ts` | Hợp đồng dữ liệu tin nhắn Zalo đã trích xuất: id, conversationName, sender, isSelf, timestamp, rawText, position (top/bottom — xếp thứ tự 2 chiều) |
| service | MessageDeduplicator | `src/domain/message-extraction/services/deduplicator.service.ts` | Chống trùng khi Zalo virtual scroll unmount/remount: generateHash (hash xác định 4 trường), isDuplicate, markSeen (LRU-like, maxCapacity 1000), clear, size |
| use case | ExtractMessageUseCase | `src/app/use-cases/message-extraction/extract-message.use-case.ts` | Orchestration: luôn publish MESSAGE_CAPTURED lên Event Bus; chỉ lưu IndexedDB khi isFullExtractionEnabled bật; normalize tin qua DataNormalizationService (cross-module) trước khi save |
| adapter | DexieMessageRepository | `src/infra/storage/dexie-message-repository.adapter.ts` | Implement IMessageRepository + IDexieMessageRepository: save, saveBatch, findExistingHashes, findAll, clearAll, count, findByHash, findByAddressAndPrice, findByRawData |

- Export: exportMessagesAsJson + buildExportFilename (`src/features/message-extraction/utils/export-json.ts`) xuất JSON; SidepanelBridgeService (`src/features/message-extraction/services/sidepanel-bridge.service.ts`) cầu nối sidepanel.

## 3. Boundaries

| Loại | Tên | Chi tiết |
|---|---|---|
| Event in | conversation.changed | ConversationChangedPayload {conversationId} — từ `src/shared/contracts/events/message-events.contract.ts` |
| Event out | message.captured | MessageCapturedPayload {rawContent, senderId, timestamp, conversationId} — publish bởi ExtractMessageUseCase, module quick-search tiêu thụ |
| Input | DOM Zalo Web | ZaloMessage lấy từ zalo-dom-observer; rawText là nội dung thô |
| DB table đọc/ghi | normalized_messages | IndexedDB table (QuickZaloExtensionDB v3): index &id, &contentHash, code, district, priceNumeric, createdAt — ghi save/saveBatch, đọc findAll |
| DB table đọc | messages | IndexedDB table: index &id, &hash, conversationId, capturedAt — đọc findByHash/findByAddressAndPrice/findByRawData (module quick-search sở hữu) |
| Gate | isFullExtractionEnabled | Boolean: false → chỉ publish event, không lưu DB; true → normalize + saveBatch |

## 4. Cross-Module Links

- ExtractMessageUseCase → DataNormalizationService (module này gọi service domain data-normalization để chuẩn hóa rawContent thành NormalizedMessage trước khi lưu — `extract-message.use-case.ts` line 15/30/52)
- MessageCapturedPayload → quick-search module (event bus contract chung, module quick-search đăng ký consume)

## 5. Infrastructure Mapping

| Adapter | Port | Table | Consumer đang dùng |
|---|---|---|---|
| DexieMessageRepository | IMessageRepository | normalized_messages + messages | ExtractMessageUseCase (inject qua deps.messageRepository) + useExtractedMessages hook |
| DexieMessageRepository | IDexieMessageRepository | messages | verify-selection.use-case (quick-search) tra cứu qua findByHash/findByAddressAndPrice |

- Dual implementation: không có — 1 class duy nhất cho cả 2 port, cùng file `dexie-message-repository.adapter.ts`.

## 6. Docs References

- [Spec: Docs/Specs/message-extraction/spec.md](file://Docs/Specs/message-extraction/spec.md) (chỉ link, không viết lại nội dung)
- [tree_work.md](file://Docs/tree_work.md)
- [AGENTS.md](file://AGENTS.md)

## 7. Architecture Pattern Check

| # | Tiêu chí | Kết quả | Bằng chứng |
|---|---|---|---|
| 1 | F1 — Single-Responsibility (đúng 1 chức năng: trích xuất) | OK | `src/domain/message-extraction/` + `src/app/use-cases/message-extraction/` chỉ phục vụ extraction |
| 2 | F2 — Contract rõ INPUT/OUTPUT/HANDLE | OK | Input DOM Zalo Web → Output MessageCapturedPayload + NormalizedMessage; error path qua Result |
| 3 | F3 — Có DEBUG + LOG phụ trợ | OK | EvlogLogger dùng trong ExtractMessageUseCase; UI debug screen hỗ trợ test |
| 4 | F4 — KHÔNG lẫn UI | WARN | `src/features/message-extraction/` chứa React Component (debug screen) + SidepanelBridgeService — nên tách thành UI module riêng |
| 5 | C1 — Không phụ thuộc chéo | OK | Chỉ publish event 1 chiều tới quick-search, không import ngược |
| 6 | C2 — Độc lập qua contract | OK | Phụ thuộc qua IMessageRepository/IMessageBus port, không import implementation |

- Kết luận: ⚠️ LỆCH NHẸ — F4 WARN: screen debug/test nằm trong functional module; khuyến nghị tách thành UI module riêng (call functional module qua use case/hook) để functional module thuần chạy nền.
