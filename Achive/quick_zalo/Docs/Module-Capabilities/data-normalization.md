---
generated_at: "2026-08-01T12:50:00Z"
last_verified: "2026-08-01T12:50:00Z"
status: "verified"
source_skill: "module-docs-generation-skill"
module_type: "functional"
description: "Nạp file JSON datarow thô, lọc trùng 2 cấp, bóc tách dữ liệu và hiển thị Dual View Debug."
---

# data-normalization — Capability Summary

## 1. Overview

data-normalization, Chuẩn hóa Dữ liệu (Dexie DB), Nạp file JSON datarow thô, lọc trùng 2 cấp, bóc tách dữ liệu và hiển thị Dual View Debug.
- Loại module: functional (Module Chức năng) — domain + app + infra (DataNormalizationService, TemplateDetectorService, MessageDeduplicationService, DexieNormalizedListingRepository) chạy nền; Dual View Debug là UI phụ trợ test (xem F4)
- moduleMeta: đầy đủ (từ `src/features/data-normalization/index.ts`)
- Đăng ký tree_work.md: có — `Docs/tree_work.md` line 90, mô tả "Data Normalization & Dual View Debug Feature Module"

## 2. Capabilities

| Loại | Symbol | Tệp | Mô tả |
|---|---|---|---|
| entity | NormalizedMessage | `src/domain/data-normalization/entities/normalized-message.entity.ts` | Hợp đồng dữ liệu legacy: id, contentHash, data_raw, createdAt + fields đã chuẩn hóa (code, address, district, availableRooms, priceRaw, priceNumeric, roomType, hasElevator, furniture, services, notes) |
| entity | NormalizedListing | `src/domain/data-normalization/entities/normalized-listing.entity.ts` | Hợp đồng dữ liệu mới: core fields + classification (templateFamily, isPartiallyParsed) + property/commission/axis/details/payment fields (priceRange, serviceFees, policies, area, floor, availabilityDate, maxOccupants, paymentTerms, contactRequirement) |
| entity | ImportSession | `src/domain/data-normalization/entities/import-session.entity.ts` | Bản ghi phiên nạp file: id, importedAt, sourceFileName, totalMessages, uniqueListings, partialParsedCount, templateBreakdown (TNR/Sky/95_Home/unknown), status (completed/partial/failed), error |
| service | DataNormalizationService | `src/domain/data-normalization/services/normalization.service.ts` | Pure domain service: generateContentHash, normalize (→ NormalizedMessage), normalizeListing (→ NormalizedListing), parsePriceNumeric, parsePriceRange, parseCommission, parseArea, parseFloor, parsePolicies, parseAvailabilityDate |
| service | TemplateDetectorService | `src/domain/data-normalization/services/template-detector.service.ts` | detect(data_raw) → TemplateFamily (TNR/Sky/95_Home/null) bằng marker trực tiếp + secondary scoring (threshold ≥ 2) |
| service | MessageDeduplicationService | `src/domain/data-normalization/services/deduplication.service.ts` | deduplicateFileInput(rawMessages) → Stage1DeduplicationResult {uniqueMessages, dupesInFile} — lọc trùng stage 1 trong file qua Set contentHash |
| adapter | DexieNormalizedListingRepository (mới) | `src/infra/storage/dexie-normalized-listing.adapter.ts` | Implement INormalizedListingRepository: save, findExistingHashes, count, findAll, saveBatch (stage 2 DB dedup + tạo ImportSession + templateBreakdown), getLatestSession, clearAll |
| adapter | DexieNormalizedListingRepository (legacy) | `src/infra/storage/dexie-normalized-listing-repository.adapter.ts` | Bản cũ cùng tên class, cùng port; saveBatch chỉ nhận (listings, dupesInFileCount) — hiện không consumer ngoài test |
| adapter | DexieImportSessionRepository | `src/infra/storage/dexie-import-session-repository.adapter.ts` | Implement IImportSessionRepository: save, getLatest, findById, clearAll |

- Dedup 2 stage: stage-1 lọc trùng trong file nạp (Set contentHash, trong useDataNormalization + MessageDeduplicationService), stage-2 đối chiếu contentHash với DB qua findExistingHashes trước bulkPut.

## 3. Boundaries

| Loại | Tên | Chi tiết |
|---|---|---|
| Event in | message.captured | MessageCapturedPayload {rawContent, senderId, timestamp, conversationId} — từ `src/shared/contracts/events/message-events.contract.ts` (module message-extraction publish; module này nhận qua normalizer khi ExtractMessageUseCase execute) |
| Event out | conversation.changed | ConversationChangedPayload {conversationId} — contract chung, module khác tiêu thụ |
| Input file | JSON datarow | Cấu trúc RawJsonInputFile {messages: RawJsonInputMessage[]}; messages[].data_raw là text thô nguồn chuẩn hóa |
| DB table đọc/ghi | normalized_listings | IndexedDB table (QuickZaloExtensionDB v3): index &id, &contentHash, code, district, priceNumeric, templateFamily, isPartiallyParsed, createdAt — đọc findAll/findExistingHashes, ghi saveBatch |
| DB table đọc/ghi | import_sessions | IndexedDB table: index &id, importedAt, status — ghi save (ImportSession), đọc getLatest/getLatestSession |
| DB table đọc/ghi | normalized_messages | IndexedDB table: index &id, &contentHash, code, district, priceNumeric, createdAt — table legacy, adapter cũ ghi |
| Gate | isFullExtractionEnabled | Boolean gate ở ExtractMessageUseCase (input): false → chỉ publish event, không lưu DB; true → normalize + saveBatch |

## 4. Cross-Module Links

- ExtractMessageUseCase → DataNormalizationService (message-extraction module gọi service domain data-normalization để chuẩn hóa rawContent thành NormalizedMessage trước khi lưu qua IMessageRepository — direct coupling, xem C2)
- useDataNormalization (features/data-normalization) → DexieNormalizedListingRepository (features UI gọi adapter mới trực tiếp cho luồng nạp file)

## 5. Infrastructure Mapping

| Adapter | Port | Table | Consumer đang dùng |
|---|---|---|---|
| DexieNormalizedListingRepository (mới) | INormalizedListingRepository | normalized_listings + import_sessions | useDataNormalization.ts line 6/9 (features/data-normalization) — `new DexieNormalizedListingRepository()` |
| DexieNormalizedListingRepository (legacy) | INormalizedListingRepository | normalized_listings | Không — chỉ test (`dexie-normalized-listing-repository.adapter.test.ts`) |
| DexieImportSessionRepository | IImportSessionRepository | import_sessions | Không xác định trực tiếp; adapter mới cũng đọc import_sessions qua getLatestSession |

- Dual implementation: 2 class cùng tên `DexieNormalizedListingRepository` implement `INormalizedListingRepository` — bản mới (`dexie-normalized-listing.adapter.ts`) có saveBatch 3 tham số + getLatestSession, được `useDataNormalization.ts` sử dụng; bản legacy không consumer ngoài test → bản đang dùng là bản mới.

## 6. Docs References

- Không có spec (Docs/Specs/data-normalization/ không tồn tại — liên hệ feature-spec-designer nếu cần spec chi tiết)
- [tree_work.md](file://Docs/tree_work.md)
- [AGENTS.md](file://AGENTS.md)

## 7. Architecture Pattern Check

| # | Tiêu chí | Kết quả | Bằng chứng |
|---|---|---|---|
| 1 | F1 — Single-Responsibility (đúng 1 chức năng: chuẩn hóa + lưu trữ) | OK | `src/domain/data-normalization/` + `src/app/use-cases/message-extraction/extract-message.use-case.ts` (normalize) chỉ phục vụ chuẩn hóa |
| 2 | F2 — Contract rõ INPUT/OUTPUT/HANDLE | OK | Input RawJsonInputFile → Output NormalizedMessage/NormalizedListing + ImportSession; error path qua Result |
| 3 | F3 — Có DEBUG + LOG phụ trợ | FAIL | KHÔNG có Evlog/logger trong module (grep features/data-normalization + dexie-normalized-listing.adapter + dexie-import-session-repository.adapter = 0 kết quả) — luồng nạp file/chuẩn hóa không log vận hành |
| 4 | F4 — KHÔNG lẫn UI | WARN | Dual View Debug screen nằm trong `src/features/data-normalization/` (React Component + hooks) — nên tách thành UI module riêng phục vụ test/debug |
| 5 | C1 — Không phụ thuộc chéo | OK | Nhận event 1 chiều từ message-extraction; không gọi ngược |
| 6 | C2 — Độc lập qua contract | OK | Phụ thuộc qua INormalizedListingRepository/IImportSessionRepository port; domain thuần không chạm browser |

- Kết luận: ⚠️ LỆCH PATTERN KIẾN TRÚC — F3 FAIL (không có Evlog trong luồng nạp file — thêm logger vào saveBatch/import session); F4 WARN (tách Dual View Debug thành UI module riêng).
