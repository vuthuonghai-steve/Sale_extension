---
generated_at: "2026-08-01T12:50:00Z"
last_verified: "2026-08-01T12:50:00Z"
status: "verified"
source_skill: "module-docs-generation-skill"
module_type: "functional"
description: "Trích xuất nội dung hội thoại Zalo Web và xuất dữ liệu JSON"
---

# message-extraction — Capability Summary

## 1. Overview

message-extraction, Trích xuất tin nhắn, Trích xuất nội dung hội thoại Zalo Web và xuất dữ liệu JSON.
- Loại module: functional (Module Chức năng) — domain + app + infra (ZaloMessage, MessageDeduplicator, ExtractMessageUseCase, DexieMessageRepository) chạy nền; UI debug screen nằm trong features/ (xem F4)
- moduleMeta: đầy đủ (từ `src/features/message-extraction/index.ts`)
- Đăng ký tree_work.md: có — `Docs/tree_work.md` line 88, mô tả "Message Extraction Feature Module"

## 2. Capabilities

| Loại | Symbol | Tệp | Mô tả |
|---|---|---|---|
| entity | ZaloMessage | `src/domain/message-extraction/entities/zalo-message.entity.ts` | Hợp đồng dữ liệu tin nhắn Zalo đã trích xuất: id, conversationName, sender, isSelf, timestamp, rawText, position (top/bottom — xếp thứ tự 2 chiều) |
| service | MessageDeduplicator | `src/domain/message-extraction/services/deduplicator.service.ts` | Chống trùng khi Zalo virtual scroll unmount/remount: generateHash (hash xác định 4 trường), isDuplicate, markSeen (LRU-like, maxCapacity 1000), clear, size |
| use case | ExtractMessageUseCase | `src/app/use-cases/message-extraction/extract-message.use-case.ts` | Orchestration: luôn publish MESSAGE_CAPTURED lên Event Bus; chỉ normalize + lưu IndexedDB khi isFullExtractionEnabled bật (ExtractMessageInput → ExtractMessageOutput {isFullExtracted, savedMessageId}) |
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
| Gate | isFullExtractionEnabled | Boolean: false → chỉ publish event, không lưu DB; true → normalize + save |

## 4. Cross-Module Links

- ExtractMessageUseCase → DataNormalizationService (use case gọi service domain data-normalization để chuẩn hóa rawContent thành NormalizedMessage trước khi lưu — `extract-message.use-case.ts` line 15/30)
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
| 2 | F2 — Contract rõ INPUT/OUTPUT/HANDLE | OK | ExtractMessageInput {rawContent, senderId, conversationId, isFullExtractionEnabled} → ExtractMessageOutput {isFullExtracted, savedMessageId}; error path qua Result + AppError |
| 3 | F3 — Có DEBUG + LOG phụ trợ | WARN | Log chỉ tồn tại ở `src/features/message-extraction/hooks/useExtractedMessages.ts`; use case chính `extract-message.use-case.ts` (64 dòng) KHÔNG có Evlog — log thiếu scope ở luồng core |
| 4 | F4 — KHÔNG lẫn UI | WARN | `src/features/message-extraction/` chứa React Component (MessageExtractionScreen, SidepanelApp) + SidepanelBridgeService — nên tách thành UI module riêng |
| 5 | C1 — Không phụ thuộc chéo | OK | Chỉ publish event 1 chiều tới quick-search, không gọi ngược |
| 6 | C2 — Độc lập qua contract | FAIL | `new DataNormalizationService()` trực tiếp (`extract-message.use-case.ts` line 15/30) — import domain internal của module data-normalization, không qua port/interface |

- Kết luận: ⚠️ LỆCH PATTERN KIẾN TRÚC — C2 FAIL (coupling trực tiếp tới domain service của module khác — nên tách qua port/interface do module data-normalization cung cấp); F3 WARN (thêm Evlog vào ExtractMessageUseCase); F4 WARN (tách UI debug screen thành UI module riêng).
