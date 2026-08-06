# Scope Document — Phân Tích Cách Tiếp Cận Chuẩn Hóa Data & Hỗ Trợ Kiểm Thử

**Date**: 2026-07-28
**Status**: Initial
**Feature**: data-normalization-approach
**Language**: Tiếng Việt

---

## §1: Problem Summary (Tóm tắt)

Người dùng muốn **khai thác cách tiếp cận chuẩn hóa dữ liệu hiện tại** để hỗ trợ quá trình **kiểm thử và test các trường hợp với data thực tế**. 

Phạm vi khảo sát gồm 3 module chính:
- `src/features/data-normalization/` — Giao diện người dùng + hook điều phối
- `src/domain/data-normalization/` — Logic thuần nghiệp vụ (entities + services)
- `src/infra/storage/` — Tầng lưu trữ IndexedDB qua Dexie

**Hiện trạng testing**: Module `data-normalization` **hoàn toàn không có unit test** cho domain services, chỉ có 1 file test cho storage adapter (`dexie-message-repository.adapter.test.ts`) sử dụng `fake-indexeddb`.

---

## §2: Entry Point (Điểm vào)

| Entry | Path | Vai trò |
|-------|------|---------|
| UI Entry | `src/features/data-normalization/ui/DataNormalizationScreen.tsx` | Màn hình giao diện chính |
| Logic Entry | `src/features/data-normalization/hooks/useDataNormalization.ts` | Hook React điều phối toàn bộ luồng |
| Service Entry | `src/domain/data-normalization/services/normalization.service.ts` | Service chuẩn hóa data_raw → NormalizedMessage |
| Storage Entry | `src/infra/storage/dexie-message-repository.adapter.ts` | Tầng lưu trữ IndexedDB |

---

## §3: Scope Definition (Định nghĩa phạm vi)

### 3.1 Problem Area

Toàn bộ pipeline xử lý dữ liệu từ **JSON thô → Chuẩn hóa → Lưu trữ → Hiển thị**, bao gồm:

1. **Input**: File JSON với cấu trúc `{ messages: [{ id, data_raw }] }`
2. **Parsing/Chuẩn hóa**: 10 parser riêng biệt bóc tách trường từ `data_raw`
3. **Deduplication**: 2 cấp (trong file + với database)
4. **Storage**: IndexedDB qua Dexie với schema `normalized_messages`
5. **Output/Hiển thị**: Danh sách `NormalizedCard` với chế độ xem raw/debug

### 3.2 Boundary

**Trong scope:**
- `src/domain/data-normalization/` — entities, normalization.service, deduplication.service
- `src/features/data-normalization/` — hooks, UI components, index.ts
- `src/infra/storage/` — dexie-database, dexie-message-repository.adapter
- `src/app/ports/message-repository.port.ts` — interface contract

**Ngoài scope:**
- Module `src/domain/crm/`, `src/features/crm/` và các feature khác
- `src/infra/logging/` — hệ thống logging (evlog)
- `src/entrypoints/` — WXT shell
- `src/composition/` — dependency injection wiring
- `src/shared/` — kernel utilities (đã đọc để hiểu contract)

---

## §4: Impact Analysis (Phân tích ảnh hưởng)

### 4.1 Direct Impact

| Thành phần | File | Mức ảnh hưởng |
|------------|------|----------------|
| **NormalizationService** | `src/domain/data-normalization/services/normalization.service.ts` | **Cốt lõi** — 10 method parser, 175 dòng |
| **MessageDeduplicationService** | `src/domain/data-normalization/services/deduplication.service.ts` | **Cốt lõi** — Stage 1 in-memory dedup |
| **NormalizedMessage Entity** | `src/domain/data-normalization/entities/normalized-message.entity.ts` | **Cốt lõi** — entity + interfaces (16 fields) |
| **DexieMessageRepository** | `src/infra/storage/dexie-message-repository.adapter.ts` | Storage adapter — save, query, batch |
| **useDataNormalization Hook** | `src/features/data-normalization/hooks/useDataNormalization.ts` | Orchestration — import, filter, load |

### 4.2 Indirect Impact

| Thành phần | File | Lý do |
|------------|------|-------|
| **IMessageRepository Port** | `src/app/ports/message-repository.port.ts` | Interface mà repository phải implement |
| **QuickZaloDexieDB** | `src/infra/storage/dexie-database.ts` | DB schema, indexed fields |
| **AppError type** | `src/shared/contracts/errors.ts` | Error contract dùng chung |
| **Result<T,E>** | `src/shared/kernel/result.ts` | Monad pattern dùng toàn bộ domain |
| **DataNormalizationScreen** | `src/features/data-normalization/ui/DataNormalizationScreen.tsx` | UI phụ thuộc vào hook |
| **NormalizedCard** | `src/features/data-normalization/ui/components/NormalizedCard.tsx` | Render từ NormalizedMessage |
| **ImportMetricsSummary** | `src/features/data-normalization/ui/components/ImportMetricsSummary.tsx` | Hiển thị metrics từ IngestionMetrics |

---

## §5: Call Chain (Chuỗi gọi)

### Luồng Import Chính

```
DataNormalizationScreen (upload event)
  └─ useDataNormalization.importJsonFile(file)
       ├─ file.text() + JSON.parse()
       ├─ MessageDeduplicationService.deduplicateFileInput(rawMessages)
       │    └─ [loop] DataNormalizationService.normalize(rawMsg)
       │         ├─ generateContentHash()
       │         ├─ parseCode()
       │         ├─ parseAddress() → parseDistrict()
       │         ├─ parsePriceRaw() → parsePriceNumeric()
       │         ├─ parseAvailableRooms()
       │         ├─ parseRoomType()
       │         ├─ parseHasElevator()
       │         ├─ parseFurniture()
       │         ├─ parseServices()
       │         └─ parseNotes()
       └─ DexieMessageRepository.saveBatch(uniqueMessages, dupesInFile)
            ├─ findExistingHashes(hashes)   ← DB query
            ├─ [filter] loại hash đã tồn tại
            └─ bulkPut(newMessages)         ← Dexie bulk insert
```

### Luồng Query/Filter

```
DataNormalizationScreen (mounted / filter changed)
  └─ useDataNormalization.loadStoredMessages()
       └─ DexieMessageRepository.findAll(options)
            ├─ db.normalized_messages.toCollection()
            ├─ [filter by searchQuery, district, hasElevator]
            └─ [slice by limit/offset]
```

---

## §6: Data Flow (Luồng dữ liệu)

### 6.1 Input

```typescript
// RawJsonInputFile
{
  messages: RawJsonInputMessage[]  // Mảng các message thô
}

// RawJsonInputMessage
{
  id: string;         // Unique ID từ nguồn
  data_raw: string;   // Text thô chứa thông tin BĐS (giữ nguyên 100%)
}
```

Ví dụ `data_raw` thực tế:
```
Mã: A82

🏠 Địa chỉ: Ngõ 46 Nhân Hoà - Thanh Xuân

⏰ Trống: P802

💰 Giá: 4tr7

👉 Phòng: Studio

✅ Nội thất: Full nội thất cơ bản

✅ Dịch vụ: Điện 3.8k, nước 30k, internet 100k, máy giặt 100k

Lưu ý:
- Không nuôi chó mèo
- Giờ giấc yên tĩnh sau 10h
```

### 6.2 Output (NormalizedMessage)

```typescript
{
  id: string,              // ID gốc hoặc generated
  contentHash: string,     // "hash_1a2b3c_123"
  data_raw: string,        // Text gốc (preserved intact)
  createdAt: string,       // ISO 8601
  code: string | null,     // "A82"
  address: string | null,  // "Ngõ 46 Nhân Hoà - Thanh Xuân"
  district: string | null, // "Thanh Xuân"
  availableRooms: string | null, // "P802"
  priceRaw: string | null,       // "4tr7"
  priceNumeric: number | null,   // 4700000
  roomType: string | null,       // "Studio"
  hasElevator: boolean,          // false
  furniture: string | null,      // "Full nội thất cơ bản"
  services: ServicePricing,      // { electricity, water, management, washingMachine }
  notes: string[]                // ["Không nuôi chó mèo", "Giờ giấc yên tĩnh sau 10h"]
}
```

### 6.3 IngestionMetrics (Output metrics)

```typescript
{
  totalInput: number,    // Tổng số message trong file
  dupesInFile: number,   // Số bản trùng trong file (Stage 1)
  dupesInDb: number,     // Số bản đã có trong DB (Stage 2)
  newlyInserted: number  // Số bản mới được insert
}
```

---

## §7: Affected Components (Các thành phần bị ảnh hưởng)

### 7.1 Files

| # | File | Lines | Vai trò |
|---|------|-------|---------|
| 1 | `src/domain/data-normalization/entities/normalized-message.entity.ts` | 78 | Định nghĩa entity + interfaces |
| 2 | `src/domain/data-normalization/services/normalization.service.ts` | 175 | **Core parser** — 10 method |
| 3 | `src/domain/data-normalization/services/deduplication.service.ts` | 44 | **Core dedup** — Stage 1 |
| 4 | `src/features/data-normalization/hooks/useDataNormalization.ts` | 96 | **Orchestrator** — import/filter/load |
| 5 | `src/features/data-normalization/ui/DataNormalizationScreen.tsx` | 128 | **UI chính** — layout, filters |
| 6 | `src/features/data-normalization/ui/components/JsonUploader.tsx` | 44 | Component upload file |
| 7 | `src/features/data-normalization/ui/components/ImportMetricsSummary.tsx` | 29 | Component hiển thị metrics |
| 8 | `src/features/data-normalization/ui/components/NormalizedCard.tsx` | 137 | Component card dual-view |
| 9 | `src/features/data-normalization/index.ts` | 10 | Module entry |
| 10 | `src/infra/storage/dexie-database.ts` | 15 | Dexie DB schema |
| 11 | `src/infra/storage/dexie-message-repository.adapter.ts` | 133 | **Repository** — CRUD + batch |
| 12 | `src/infra/storage/dexie-message-repository.adapter.test.ts` | 60 | **Test duy nhất** hiện có |
| 13 | `src/app/ports/message-repository.port.ts` | 50 | **Interface** — contract |

### 7.2 Functions/APIs

| Function | File | Line | Mô tả |
|----------|------|------|-------|
| `DataNormalizationService.normalize()` | normalization.service.ts:26 | Entry point chính cho normalization |
| `DataNormalizationService.generateContentHash()` | normalization.service.ts:12 | Tạo hash từ text (32-bit rolling hash) |
| `DataNormalizationService.parseCode()` | normalization.service.ts:49 | Regex `Mã:\s*(...)` |
| `DataNormalizationService.parseAddress()` | normalization.service.ts:54 | Regex `Địa chỉ:\s*(...)` |
| `DataNormalizationService.parseDistrict()` | normalization.service.ts:59 | So khớp address với 15 quận |
| `DataNormalizationService.parsePriceRaw()` | normalization.service.ts:79 | Regex `Giá:\s*(...)` |
| `DataNormalizationService.parsePriceNumeric()` | normalization.service.ts:87 | **Phức tạp nhất** — xử lý 4 format giá |
| `DataNormalizationService.parseServices()` | normalization.service.ts:134 | Parse 4 loại dịch vụ |
| `DataNormalizationService.parseNotes()` | normalization.service.ts:156 | Parse section "Lưu ý" |
| `MessageDeduplicationService.deduplicateFileInput()` | deduplication.service.ts:20 | Stage 1 in-memory dedup |
| `DexieMessageRepository.saveBatch()` | dexie-message-repository.adapter.ts:19 | Stage 2 DB dedup + batch insert |
| `useDataNormalization.importJsonFile()` | useDataNormalization.ts:41 | Orchestrator import pipeline |

---

## §8: Evidence (Bằng chứng chi tiết)

### E1: Không có unit test cho domain services

```xml
<evidence>
  <file>src/domain/data-normalization/services/normalization.service.ts</file>
  <finding>Không có file normalization.service.test.ts — 175 dòng logic parser hoàn toàn chưa được test</finding>
</evidence>
<evidence>
  <file>src/domain/data-normalization/services/deduplication.service.ts</file>
  <finding>Không có file deduplication.service.test.ts — logic dedup 2 cấp chưa được test</finding>
</evidence>
<evidence>
  <file>src/domain/data-normalization/entities/normalized-message.entity.ts</file>
  <finding>Không có test cho entity interfaces — đặc biệt là validation logic tiềm ẩn</finding>
</evidence>
```

### E2: Chỉ có 1 test file cho toàn bộ module

```xml
<evidence>
  <file>src/infra/storage/dexie-message-repository.adapter.test.ts</file>
  <line>1-60</line>
  <finding>Test duy nhất — test save + batch dedup với fake-indexeddb. Chỉ cover 2 scenarios cơ bản</finding>
</evidence>
```

### E3: Các parser có edge cases phức tạp

```xml
<evidence>
  <file>src/domain/data-normalization/services/normalization.service.ts</file>
  <line>87-118</line>
  <finding>parsePriceNumeric() xử lý 4 format giá khác nhau: "XtrY", "Xtr", "XtrYk", raw digits. Không có test cho từng format</finding>
</evidence>
<evidence>
  <file>src/domain/data-normalization/services/normalization.service.ts</file>
  <line>59-72</line>
  <finding>parseDistrict() dùng regex với 15 quận nội/ngoại thành. Có thể miss nếu tên quận xuất hiện trong context khác</finding>
</evidence>
<evidence>
  <file>src/domain/data-normalization/services/normalization.service.ts</file>
  <line>134-154</line>
  <finding>parseServices() regex không chặt — "management" field bắt cả internet/vệ sinh/thang máy do dùng pipe operator</finding>
</evidence>
```

### E4: Thiếu test fixtures / sample data

```xml
<evidence>
  <file>src/features/data-normalization/</file>
  <finding>Không có thư mục fixtures/, mocks/, hay file JSON mẫu nào để dùng cho test</finding>
</evidence>
```

### E5: Dependency Injection pattern

```xml
<evidence>
  <file>src/features/data-normalization/hooks/useDataNormalization.ts</file>
  <line>7-9</line>
  <finding>Các service được khởi tạo static ở top-level (new DataNormalizationService(), new DexieMessageRepository()). Không dễ mock cho testing — cần refactor sang DI injection qua props hoặc factory</finding>
</evidence>
```

---

## §9: Confidence Assessment (Đánh giá độ tin cậy)

```yaml
overall_confidence: 95%
reasoning: 
  - Đã đọc toàn bộ source code của 13 file liên quan
  - Đã trace được call chain đầy đủ từ UI → hook → service → storage
  - Đã xác định được tất cả các parser method và regex patterns
  - Hiểu rõ architecture tổng thể qua tree_work.md và AGENTS.md
  - Đã verify findings bằng cách đọc từng file (không suy đoán)

uncertainties:
  - Chưa rõ format JSON thực tế từ nguồn data (field names, encoding, size)
  - Chưa rõ real-world edge cases (data_raw có thể chứa format khác ngoài các field đã parse)
  - Chưa verify với data thực tế (chỉ dựa trên code analysis)
```

---

## §10: Open Questions (Câu hỏi mở)

Dưới đây là các câu hỏi cần user làm rõ trước khi tiến hành kiểm thử:

| # | Câu hỏi | Lý do |
|---|---------|-------|
| Q1 | **Data thực tế có format JSON như thế nào?** Có field nào ngoài `id` và `data_raw` không? | Để thiết kế fixtures chính xác |
| Q2 | **Có thể cung cấp 5-10 mẫu `data_raw` thực tế không?** (bao gồm các biến thể giá, loại phòng, dịch vụ) | Để xác định edge cases thực tế |
| Q3 | **Các trường hợp dữ liệu lỗi / ngoại lệ thường gặp là gì?** (ví dụ: thiếu field, sai định dạng, Unicode lỗi) | Để thiết kế test error handling |
| Q4 | **Có cần hỗ trợ thêm format giá nào khác không?** (hiện tại hỗ trợ "4tr7", "4tr3-4tr6", "5tr", raw digits) | parsePriceNumeric là method phức tạp nhất |
| Q5 | **Có cần test performance với số lượng lớn không?** (1000+ messages) | Để thiết kế test load/stress |
| Q6 | **Mong muốn viết test theo hướng nào?** TDD (test trước) hay test hiện trạng? | Để chọn workflow phù hợp |
| Q7 | **Có cần mock IndexedDB cho test normalization/parsing hay dùng fake-indexeddb như adapter test?** | Để quyết định strategy test infrastructure |

---

## §11: Phân Tích Cách Tiếp Cận Chuẩn Hóa Hiện Tại (Phân tích chính)

### 11.1 Kiến trúc tổng quan

Hệ thống hiện tại áp dụng **Clean Architecture** với 3 tầng rõ rệt:

```
[JSON File] → [Feature Layer: UI + Hook] → [Domain Layer: Service] → [Infra Layer: Storage]
                    (React)                     (Pure TS)              (Dexie/IndexedDB)
```

**Điểm mạnh:**
- ✅ Domain service (`normalization.service.ts`) là **pure TypeScript**, không phụ thuộc browser APIs → **dễ test nhất**
- ✅ Entity và interfaces được định nghĩa rõ ràng với TypeScript types
- ✅ `Result<T,E>` pattern được dùng thống nhất → dễ mock error scenarios
- ✅ `data_raw` được giữ nguyên 100% → hỗ trợ debug và re-normalization
- ✅ IndexedDB schema có index trên `contentHash` → dedup stage 2 hiệu quả

**Điểm yếu:**
- ❌ **Hoàn toàn không có unit test** cho domain services (normalization + deduplication)
- ❌ `useDataNormalization.ts` khởi tạo service static — **khó mock** cho integration test
- ❌ Không có test fixtures / mẫu data
- ❌ Một số regex có thể không xử lý hết Vietnamese characters (dấu câu, khoảng trắng)
- ❌ `parseServices()` có bug tiềm ẩn: field `management` dùng `(?:internet|vệ sinh|thang máy)` sẽ match sai context

### 11.2 Các thành phần testing cần ưu tiên

| Priority | Component | Lý do |
|----------|-----------|-------|
| **P0** | `normalization.service.ts` | Core logic, 175 dòng, 10 parser methods, 0 test |
| **P0** | `deduplication.service.ts` | Logic hash + dedup, 44 dòng, 0 test |
| **P1** | `dexie-message-repository.adapter.ts` | 133 dòng, đã có test cơ bản nhưng cần mở rộng |
| **P1** | `useDataNormalization.ts` | Orchestrator logic, cần refactor DI để test |
| **P2** | UI components | Cần snapshot hoặc integration test |

### 11.3 Các parser test case gợi ý

**parsePriceNumeric()** — 4 format cần test:

```typescript
// Format 1: "4tr7" → 4,700,000
// Format 2: "4tr3 - 4tr6" → 4,300,000 (lower bound)
// Format 3: "4tr990k" → 4,990,000
// Format 4: "5tr" → 5,000,000
// Format 5: "4700000" → 4,700,000 (raw digits)
// Edge case: "giá thỏa thuận" → null
// Edge case: "" → null
// Edge case: "1tr234k" → 1,234,000
```

**parseDistrict()** — cần test:

```typescript
// 15 districts, case-insensitive
// "Thanh Xuân" "Đống Đa" "Cầu Giấy" ... 
// Edge: "Quận Thanh Xuân" vs "Đường Thanh Xuân"
// Edge: text không có district nào → null
```

**parseNotes()** — cần test:

```typescript
// Section sau "Lưu ý:" với bullet points
// Edge: không có section lưu ý → []
// Edge: nhiều notes > 2 items
```

**generateContentHash()** — cần test:

```typescript
// Cùng content, khác spacing → cùng hash
// Cùng content, khác case → cùng hash
// Khác content → khác hash
// Empty string → deterministic hash
```

### 11.4 Cách tiếp cận kiểm thử đề xuất

```
Tầng 1 — Unit Test (Domain Services)
  ├─ normalization.service.test.ts
  │   ├─ Test 10 parser methods riêng biệt
  │   ├─ Test normalize() integration
  │   ├─ Test với data thực tế (fixtures)
  │   └─ Edge cases cho từng parser
  └─ deduplication.service.test.ts
      ├─ Test with all unique → 0 dupes
      ├─ Test with all duplicate → all filtered
      ├─ Test with mixed → correct counts
      └─ Test with empty input → empty result

Tầng 2 — Integration Test (Repository)
  └─ dexie-message-repository.adapter.test.ts (đã có, mở rộng)
      ├─ Test findExistingHashes
      ├─ Test findAll với filters
      ├─ Test clearAll
      └─ Test error scenarios

Tầng 3 — Feature Test (Hook + UI)
  └─ useDataNormalization.test.ts
      ├─ Cần refactor DI trước
      ├─ Mock repository + services
      └─ Test import flow end-to-end
```

---

## §12: Tổng kết

### Key Findings

1. **Module data-normalization có kiến trúc sạch** (Clean Architecture, pure domain services, Result<T,E> pattern)
2. **Domain services hoàn toàn chưa được test** — 0% coverage cho normalization + deduplication
3. **Core parser `DataNormalizationService` có 10 method** — parsePriceNumeric là phức tạp nhất
4. **Chỉ có 1 file test** cho storage adapter (với fake-indexeddb)
5. **Không có test fixtures / sample data** — rào cản đầu tiên cho testing
6. **DI pattern yếu** — services được khởi tạo static top-level, khó mock

### Ready for Fix Phase

Khi user trả lời các Open Questions (Q1-Q7), đặc biệt là cung cấp **mẫu data thực tế**, ta có thể:
1. Tạo test fixtures từ data thực tế
2. Viết unit test cho normalization.service.ts
3. Viết unit test cho deduplication.service.ts
4. Mở rộng storage adapter test
5. Refactor DI cho hook để test integration

---

**Document Status**: Context Complete — No Code Changes Made
**Confidence**: 95%
**Next Step**: Chờ user phản hồi Open Questions trước khi tiến hành fix/test phase
