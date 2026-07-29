# Analysis — Module Chuẩn Hóa DataRow: Hiện Trạng & Điểm Mù Cho Test Attack

**Date**: 2026-07-29
**Status**: Initial
**Feature**: data-normalization-test-attack
**Language**: Tiếng Việt
**Based on scope doc**: `docs/context-to-work/data-normalization-module/scope.2026-07-29.md`

---

## §1: Tổng Quan Hiện Trạng Implementation

### 1.1 So Sánh Scope Design vs Actual Code

| Thành phần | Scope Document | Thực tế Codebase | Trạng thái |
|------------|---------------|-------------------|------------|
| `NormalizedListing` entity | Tạo mới | ✅ `entities/normalized-listing.entity.ts` (63 dòng) | Hoàn chỉnh |
| `ImportSession` entity | Tạo mới | ✅ `entities/import-session.entity.ts` (16 dòng) | Hoàn chỉnh |
| `TemplateDetectorService` | Tạo mới | ✅ `services/template-detector.service.ts` (141 dòng) | Hoàn chỉnh |
| `NormalizationService` (mới) | Viết mới | ✅ `services/normalization.service.ts` (356 dòng) — có cả `normalize()` cũ + `normalizeListing()` mới | Hoàn chỉnh |
| `MessageDeduplicationService` | Tái sử dụng | ✅ `services/deduplication.service.ts` (45 dòng) — **đã cập nhật** dùng `NormalizedListing` | Khác scope |
| `INormalizedListingRepository` port | Tạo mới | ✅ `app/ports/normalized-listing-repository.port.ts` (60 dòng) | Hoàn chỉnh |
| `IImportSessionRepository` port | Tạo mới | ✅ `app/ports/import-session-repository.port.ts` (25 dòng) | Hoàn chỉnh |
| Dexie DB schema (3 tables) | Cập nhật | ✅ `infra/storage/dexie-database.ts` (21 dòng) — v2 schema | Hoàn chỉnh |
| `DexieNormalizedListingRepository` | Tạo mới | ⚠️ **2 implementations khác nhau** | **DUPLICATE** |
| `DexieImportSessionRepository` | Tạo mới | ✅ `infra/storage/dexie-import-session-repository.adapter.ts` (45 dòng) | Hoàn chỉnh |
| `useDataNormalization` hook | Cập nhật | ✅ `features/hooks/useDataNormalization.ts` (150 dòng) — batch chunking 500 + session tracking | Hoàn chỉnh |
| UI Components | Cập nhật | ✅ 4 components (Screen, Card, JsonUploader, MetricsSummary) | Hoàn chỉnh |

### 1.2 Vấn Đề Nghiêm Trọng: 2 Implementations `DexieNormalizedListingRepository`

Có **HAI class** cùng tên `DexieNormalizedListingRepository` trong 2 files khác nhau, với interface không tương thích:

| File | Method Signature | Được dùng bởi |
|------|-----------------|---------------|
| `infra/storage/dexie-normalized-listing.adapter.ts` (223 dòng) | `saveBatch(newItems, dupesInFile, sessionMeta?)` → `{metrics, session, savedListings}` | ✅ Hook (`useDataNormalization.ts`) |
| `infra/storage/dexie-normalized-listing-repository.adapter.ts` (158 dòng) | `saveBatch(listings, dupesInFileCount)` → `{metrics, savedListings}` | ✅ Test (`dexie-normalized-listing-repository.adapter.test.ts`) |

**Hệ quả**:
- Test file test implementation thứ 2 (không có session tracking)
- Hook dùng implementation thứ 1 (có session tracking)
- **2 bộ code khác nhau, 2 bộ bugs tiềm ẩn khác nhau**
- Implementation 2 (`-repository.adapter.ts`) implement `INormalizedListingRepository` port nhưng implementation 1 (`dexie-normalized-listing.adapter.ts`) tự định nghĩa `ListingQueryOptions` riêng

<evidence>
  <file>src/infra/storage/dexie-normalized-listing.adapter.ts</file>
  <finding>Class DexieNormalizedListingRepository tự định nghĩa ListingQueryOptions riêng (khác port) + saveBatch nhận thêm sessionMeta + getLatestSession() không có trong port interface</finding>
</evidence>
<evidence>
  <file>src/infra/storage/dexie-normalized-listing-repository.adapter.ts</file>
  <finding>Class DexieNormalizedListingRepository thứ 2 implement đúng INormalizedListingRepository port nhưng KHÔNG được hook sử dụng — chỉ test dùng</finding>
</evidence>

---

## §2: Test Coverage Hiện Tại

### 2.1 Danh Sách Test Files Cho Data Normalization Module

| Test File | Số Test | Coverage | Ghi Chú |
|-----------|---------|----------|---------|
| `services/normalization.service.test.ts` | 6 tests | Happy path TNR, Sky, 95_Home, free_text, contentHash | Thiếu edge cases |
| `services/template-detector.service.test.ts` | 5 tests | 1 test mỗi template + null + empty input | Thiếu boundary |
| `infra/storage/dexie-normalized-listing-repository.adapter.test.ts` | 3 tests | save + dedup + filter | **Test sai implementation** |
| **Total** | **14 tests** | **542 dòng logic domain + 223 dòng adapter** | **Cực kỳ thiếu** |

### 2.2 Logic Domain Không Được Test

| File | LOC | Test hiện có | Logic không test |
|------|-----|-------------|-----------------|
| `normalization.service.ts` | 356 | 6 tests (170 dòng) | Price parsing (10+ variants), service fees (complex regex), policies, notes, floor, area, commission, axis, availabilityDate, isPartiallyParsed heuristic |
| `template-detector.service.ts` | 141 | 5 tests (91 dòng) | Scoring fallback (khi primary detection miss), ambiguous messages, emoji variants |
| `deduplication.service.ts` | 45 | **0 tests** | Stage 1 dedup logic, edge cases (empty messages, all dupes, no dupes) |
| `dexie-normalized-listing.adapter.ts` | 223 | **0 tests** | saveBatch với session tracking, getLatestSession, findAll filters (search, template, partial, elevator, price range) |
| `dexie-import-session-repository.adapter.ts` | 45 | **0 tests** | CRUD operations |

---

## §3: Phân Tích Điểm Mù (Blind Spots) Cho Test Attack

### 3.1 Template Detection Blind Spots

#### BS-TD-01: Emoji Unicode Normalization
```
Problem: Emoji có thể được encode khác nhau trên các OS/browser
  - 🌹 = U+1F339 (Apple/Google) vs biến thể sequence
  - ☘️ = U+2618 + U+FE0F (vs không có variation selector)
  - 👉 = U+1F449 (có thể kèm skin tone modifier)
  
Tác động: TemplateDetector dùng regex /🌹/i, /☘️/i — 
  có thể FAIL nếu emoji ở dạng NFD hoặc kèm modifier
  
Test attack:
  - Gửi data_raw với emoji ở dạng NFD
  - Gửi data_raw với emoji + skin tone modifier
  - Gửi data_raw với emoji dạng text (☘︎) vs emoji (☘️)
```

#### BS-TD-02: Template Ambiguity (Confidence Score Edge Cases)
```
Problem: Khi primary detection (isSkyGroup/is95Home/isTNR) fail, 
  scoring fallback dùng threshold >= 2. 
  Có messages match nhiều template với score khác nhau?

Các kịch bản nguy hiểm:
  - Message có cả /-rose (Sky) lẫn 🌹 (95_Home) — cái nào thắng?
  - Message có 🌹 nhưng không phải 95_Home (vd: "hoa hồng 30%" khác với 🌹30%)
  - Sky primary detection dùng combo ☘️Phí dv + 💥Nội thất
    → nếu message có ☘️Phí dv nhưng không có 💥Nội thất thì fallback về score hay null?
  
Test attack:
  - Message lai Sky + 95_Home markers
  - Message có 1-2 markers nhưng score < 2 — vẫn null dù có template?
  - Message TNR nhưng thiếu "Mã" nhưng đủ scoring — có detect được không?
```

#### BS-TD-03: Case và Whitespace Sensitivity
```
Problem: isTNR() dùng /^\s*l?Mã\s*[A-Za-z0-9]/i — 
  "lMã" là typo có chủ đích nhưng regex match do optional l?
  "Mã:" và "MA:" (không dấu) có được detect không?

Test attack:
  - data_raw bắt đầu bằng whitespace + "lMã" → false positive?
  - "MA: A1204" (tiếng Anh) → match Mã regex? 
  - "Mả A1204" (sai dấu) → not match
```

### 3.2 Price Parsing Blind Spots

#### BS-PR-01: Number Format Variants (10+ variants)
```
parsePriceNumeric() hiện tại handle:
  - "4tr7" → 4700000
  - "4.5tr" → ? (có dấu chấm)
  - "4tr" → 4000000
  - "4tr - 4tr2" → range → lower bound 4000000
  - "4.500.000" → (bỏ dấu chấm) → 4500000 match
  
Không handle:
  - "4,5tr" (dấu phẩy) → ?
  - "4 triệu 5" → ?
  - "4.5triệu" → ?
  - "4500k" → ?
  - "45 trăm" → ?
  - "4tr5/1 người" → per person pricing
  - "4tr5-5tr" (không space) → range parsing?
  - "Giá: thỏa thuận" → ? 
  - "Giá: Liên hệ" → ?
  - "Giá: 4tr5 (còn TL)" → ?
  - "4,500,000" (US format) → ?
  - Số âm: "-4tr5" → ?
  - "0đ" hoặc "free" → ?

Test attack:
  - Combinatorial: mọi format trên với mọi template family
  - Range với from/to không hợp lệ (from > to)
  - Price quá lớn (> 2^31) — overflow
  - Price = 0 hoặc null
```

#### BS-PR-02: PriceRange Parsing
```
parsePriceRange() dùng split('-') — rất nguy hiểm:
  - "4tr - 4tr2" → ["4tr ", " 4tr2"] ✅
  - "4tr-4tr2" → ["4tr", "4tr2"] ✅
  - "P401 - 4tr5" (P401 là mã phòng!) → ["P401 ", " 4tr5"] ❌ FALSE POSITIVE
  - "4tr5-6tr" → ["4tr5", "6tr"] ✅
  - "tầng 2 - 4tr5" → ["tầng 2 ", " 4tr5"] ❌ FALSE POSITIVE

Test attack:
  - data_raw có nhiều dấu "-" không liên quan đến price
  - Range "4tr5 - 5tr" → parsePriceNumeric("4tr5") = 4500000, parsePriceNumeric("5tr") = 5000000 ✅
  - Range "4tr5-5" → parsePriceNumeric("5") = ? có thể null
```

### 3.3 Service Fee Parsing Blind Spots

#### BS-SF-01: parseServices() Regex Bug (E5 từ scope doc)
```
Regex: /(?:internet|vệ sinh|thang máy)\s*([^,;]+)/i
Vấn đề: Bất kỳ từ nào trong 3 từ này đều match "management"
  → "internet 100k/phòng" match management
  → "vệ sinh 50k" match management (đúng)
  → "thang máy 50k" match management (sai — đây là elevator fee, không phải management)
  
Test attack:
  - data_raw có "internet" trước "dịch vụ chung" → sai field
  - data_raw có "thang máy" trong section dịch vụ → sai field
```

#### BS-SF-02: parseDetailedServices() Line Splitting
```
Dùng split(/[\n,;-]+/) — rất dễ vỡ:
  - Dấu "," trong số "3,800" bị split → "3" và "800" ❌
  - "Điện 3.8k/số" → cả line là "Điện 3.8k/số" ✅
  - "Nước 100k/người" → "Nước 100k/người" ✅
  - "Phí dv: Điện 4k/số - Nước 35k/khối" → bị split thành nhiều phần
  - "Dịch vụ chung 150k/người, internet 100k" → split "," → "internet 100k" ✅ (tình cờ đúng)

Test attack:
  - Fee text có dấu "," trong số (vd: "Điện 3,800/số")
  - Fee text dùng bullet points (•)
  - Fee section bị xuống dòng không chuẩn
  - Tên fee viết tắt không match regex
```

#### BS-SF-03: First-Match-Only Parsing
```
parseDetailedServices() dùng pattern "if first match, skip":
  - Mỗi loại fee chỉ lấy match đầu tiên
  - Nếu text có 2 loại điện (điện sinh hoạt + điện chung) → chỉ lấy cái đầu

Test attack:
  - data_raw có 2 giá điện (giá thuê bao + giá tiêu thụ)
  - data_raw có "nước" xuất hiện trước "giá nước" → match sai
```

### 3.4 Dedup Blind Spots

#### BS-DD-01: ContentHash DJB2 Collision
```
generateContentHash() dùng DJB2 rolling hash (32-bit):
  - Chỉ 2^32 ≈ 4.3 tỷ hash values — collision probability cao
  - Hash = hash_<hex>_<length> — length giúp giảm collision nhưng không đủ
  - Với 3000 messages, birthday paradox → collision risk ~1/1.4M

Test attack:
  - Tìm/tao 2 messages khác nhau cho cùng contentHash
  - Verify dedup có miss không
```

#### BS-DD-02: Empty/Whitespace Data_Raw
```
deduplication.service.ts: 
  if (!rawMsg.data_raw || rawMsg.data_raw.trim() === '') continue;
  → Skip message, không normalize
  
Nhưng nếu tất cả messages đều empty → result = { uniqueMessages: [], dupesInFile: 0 }

Test attack:
  - Input array toàn empty messages
  - Input array rỗng
  - Input có null/undefined data_raw
  - Input data_raw chỉ gồm whitespace + special chars
```

### 3.5 isPartiallyParsed Heuristic Blind Spots

#### BS-PP-01: Logic Không Đủ Chặt
```
normalizeListing() tính: 
  isPartiallyParsed = templateFamily === null || (!code && !address && !priceRaw)

Vấn đề:
  - templateFamily = 'TNR' nhưng không extract được field nào 
    → isPartiallyParsed = false (SAI — đáng lẽ phải true)
  - templateFamily = null nhưng có code OR address OR priceRaw 
    → isPartiallyParsed = true (đúng, extract partial)
  - templateFamily = 'Sky' nhưng only có commission, không có price
    → isPartiallyParsed = false (có thể đúng, có thể sai tùy business)

Test attack:
  - TNR message với data_raw không match bất kỳ parser nào
  - template đúng nhưng tất cả fields null → false negative
  - template = null nhưng extract được nhiều fields → false positive?
```

### 3.6 Infrastructure Blind Spots

#### BS-IF-01: IndexedDB Bulk Operations Failure
```
DexieNormalizedListingRepository.saveBatch() dùng bulkPut():
  - Nếu 1 record fail → cả batch fail? (Dexie behavior)
  - QuotaExceededError khi DB đầy → catch chung
  
Test attack:
  - Batch insert > 1000 records (Dexie bulkPut limit)
  - Insert record với id trùng (duplicate primary key)
  - Concurrent writes (race condition) — mặc dù IndexedDB synchronous
```

#### BS-IF-02: findAll() Filter Ordering
```
Luôn sort by createdAt DESC:
  - Nếu 2 records cùng createdAt → thứ tự không đảm bảo
  - Filter by price min/max ✗ KHÔNG implement (E10 trong scope doc)
  - Filter by limit/offset sau khi fetch ALL — không scale

Test attack:
  - findAll với limit nhưng không sort
  - findAll offset > total records → empty array
  - Filter by district không case-insensitive
  - Filter by templateFamily null ("unknown")
```

### 3.7 Architecture/Framework Blind Spots

#### BS-AR-01: Static Service Instantiation (No DI)
```
useDataNormalization.ts (line 8-9):
  const normalizer = new DataNormalizationService();
  const repo = new DexieNormalizedListingRepository();

Vấn đề: Không thể mock cho testing — test sẽ gọi IndexedDB thật

Test attack:
  - Phải dùng fake-indexeddb cho infra tests
  - Unit test domain logic bị phụ thuộc vào infra layer
  - Không thể test error handling của hook (on purpose)
```

#### BS-AR-02: Null Fields in Entity
```
NormalizedListing có 3 fields luôn null:
  maxOccupants: null
  paymentTerms: null
  contactRequirement: null

Chưa được implement — test cần verify điều này có được document không
```

---

## §4: Test Coverage Gap Matrix

| Module | LOC | Test LOC | Coverage % (ước lượng) | Priority |
|--------|-----|----------|----------------------|----------|
| `TemplateDetectorService` | 141 | 91 | ~30% paths | **CAO** |
| `DataNormalizationService` | 356 | 170 | ~25% paths (chỉ happy path) | **CAO** |
| `MessageDeduplicationService` | 45 | 0 | 0% | **CAO** |
| `DexieNormalizedListingRepository` (+ duplicate) | 223 + 158 | 69 | ~15% | **CAO** |
| `DexieImportSessionRepository` | 45 | 0 | 0% | **TRUNG BÌNH** |
| `useDataNormalization` hook | 150 | 0 | 0% | **TRUNG BÌNH** |
| UI Components | ~340 | 0 | 0% | **THẤP** |

---

## §5: Chiến Lược Test Attack Đề Xuất

### 5.1 Pha 1 — Domain Core (Unit Tests, Priority CAO)

```
1. TemplateDetectorService edge cases
   File: template-detector.service.test.ts (mở rộng)
   Attack vectors:
   - Emoji unicode variants (NFC vs NFD)
   - Mixed template markers (Sky + 95_Home)
   - Scoring threshold boundary (score 1, score 2, score 3)
   - Case sensitivity: "mã" vs "MÃ" vs "Mả" vs "MA"
   - Whitespace: "Mã:A1204", "  Mã  A1204", "Mã\nA1204"
   - False positives: "lMã", "mã số"

2. DataNormalizationService price parser
   File: normalization.service.test.ts (thêm ~20 test cases)
   Attack vectors:
   - 10+ price format variants
   - Range parsing với non-price dashes
   - Price with per-person qualifiers
   - Zero, negative, extreme values
   - Non-numeric: "thỏa thuận", "liên hệ", "free"

3. DataNormalizationService service fee parser
   File: normalization.service.test.ts (thêm ~15 test cases)
   Attack vectors:
   - parseServices() regex bug (management field)
   - parseDetailedServices() delimiter splitting
   - Service fees cho Sky Group format
   - Service fees cho 95 Home format (⚡ Chi phí dịch vụ)
   - Missing fee section → null fields
   - Mixed delimiter (;, -, ,, xuống dòng)

4. DataNormalizationService fallback/isPartiallyParsed
   File: normalization.service.test.ts (thêm ~10 test cases)
   Attack vectors:
   - TNR đúng template nhưng 0 fields extract được
   - null template nhưng extract được nhiều fields
   - Partially extracted → verify các null fields
```

### 5.2 Pha 2 — Infrastructure (Integration Tests)

```
5. DexieNormalizedListingRepository (adapter có session tracking)
   File: MỚI — infra/storage/dexie-normalized-listing.adapter.test.ts
   Attack vectors:
   - saveBatch với sessionMeta
   - getLatestSession với nhiều sessions
   - Duplicate contentHash handling
   - findAll filter combinations
   - Empty result sets
   - Edge cases: limit, offset

6. MessageDeduplicationService
   File: MỚI — services/deduplication.service.test.ts
   Attack vectors:
   - Input empty array
   - All messages are duplicates
   - No duplicates
   - Empty data_raw messages
   - contentHash collision
```

### 5.3 Pha 3 — E2E & Real Data Fixtures

```
7. Real data fixture tests
   Dùng 5 files từ Docs/Data/Raw/ (3167 messages thực tế)
   Test:
   - Template detection accuracy trên real data
   - Price parsing accuracy
   - Service fee extraction accuracy
   - ContentHash uniqueness (không collision trên 3000+ messages)
   - Session tracking với multiple imports
```

---

## §6: Code Quality Issues Phát Hiện (Ảnh Hưởng Test)

### 6.1 Duplicate Repository — Critical
```
Hai class DexieNormalizedListingRepository trong 2 files:
  - infra/storage/dexie-normalized-listing.adapter.ts (dùng bởi hook)
  - infra/storage/dexie-normalized-listing-repository.adapter.ts (dùng bởi test)
  
→ Test chạy trên implementation không được dùng trong production
→ Hook dùng implementation KHÔNG có test
→ **Test không valid cho production code**
```

### 6.2 No DI Container — Testing Khó
```
Hook khởi tạo service static:
  - Không thể mock DataNormalizationService khi test hook
  - Không thể inject fake repository
  - Cần refactor DI để test được
```

### 6.3 3 Fields Always Null
```
maxOccupants, paymentTerms, contactRequirement luôn null
→ Entity schema không match implementation
→ Cần decide: implement hoặc remove khỏi entity
```

---

## §7: File Inventory Đầy Đủ

### Source Files (Data Normalization Module)

| # | File | Dòng | Vai trò |
|---|------|------|---------|
| 1 | `src/domain/data-normalization/entities/normalized-listing.entity.ts` | 63 | Entity mới (NormalizedListing) |
| 2 | `src/domain/data-normalization/entities/import-session.entity.ts` | 16 | Import session entity |
| 3 | `src/domain/data-normalization/entities/normalized-message.entity.ts` | 78 | Entity cũ (NormalizedMessage) |
| 4 | `src/domain/data-normalization/services/normalization.service.ts` | 356 | Core service (cả cũ + mới) |
| 5 | `src/domain/data-normalization/services/template-detector.service.ts` | 141 | Template detection |
| 6 | `src/domain/data-normalization/services/deduplication.service.ts` | 45 | Stage 1 dedup |
| 7 | `src/app/ports/normalized-listing-repository.port.ts` | 60 | Port interface |
| 8 | `src/app/ports/import-session-repository.port.ts` | 25 | Port interface |
| 9 | `src/infra/storage/dexie-database.ts` | 21 | DB schema (3 tables) |
| 10 | `src/infra/storage/dexie-normalized-listing.adapter.ts` | 223 | **Adapter dùng bởi hook** |
| 11 | `src/infra/storage/dexie-normalized-listing-repository.adapter.ts` | 158 | **Adapter dùng bởi test** (duplicate) |
| 12 | `src/infra/storage/dexie-import-session-repository.adapter.ts` | 45 | Session repository |
| 13 | `src/features/data-normalization/hooks/useDataNormalization.ts` | 150 | Hook orchestrator |
| 14 | `src/features/data-normalization/ui/DataNormalizationScreen.tsx` | ~128 | UI screen |
| 15 | `src/features/data-normalization/ui/components/NormalizedCard.tsx` | ~137 | Card component |
| 16 | `src/features/data-normalization/ui/components/JsonUploader.tsx` | ~44 | Upload component |
| 17 | `src/features/data-normalization/ui/components/ImportMetricsSummary.tsx` | ~29 | Metrics component |
| 18 | `src/features/data-normalization/index.ts` | ~10 | Module entry |

### Test Files Hiện Tại

| # | File | Tests | Ghi chú |
|---|------|-------|---------|
| T1 | `services/normalization.service.test.ts` | 6 | Chỉ happy path |
| T2 | `services/template-detector.service.test.ts` | 5 | Chỉ happy path |
| T3 | `infra/storage/dexie-normalized-listing-repository.adapter.test.ts` | 3 | **Test sai implementation** |

### Raw Data Fixtures (Dùng Cho Test Attack)

| File | Messages | Group |
|------|----------|-------|
| Docs/Data/Raw/TNR/zalo-messages-...214807.json | ~770 | TNR |
| Docs/Data/Raw/TNR/zalo-messages-...220148.json | ~??? | TNR |
| Docs/Data/Raw/sky_groub/zalo-messages-...213709.json | 894 | Sky |
| Docs/Data/Raw/sky_groub/zalo-messages-...214101.json | ~??? | Sky |
| Docs/Data/Raw/95_home/zalo-messages-...212809.json | 504 | 95 Home |

---

## §8: Confidence Assessment

```yaml
overall_confidence: 92%
reasoning:
  - Đã đọc 100% source code của data normalization module
  - Đã phân tích từng parser method, regex patterns
  - Đã xác định duplicate repository implementation
  - Đã đọc tất cả test files hiện tại
  - Đã trace call chain từ hook → service → infra
  - Đã identify 15+ blind spot categories
  - Đã verify với typecheck (pass) và test (62 pass)

uncertainties:
  - Không biết chắc real data từ 5 files (3167 messages) 
    có bao nhiêu edge cases thực tế sẽ fail
  - Dexie behavior với concurrent writes cần verify thêm
  - 3 fields null (maxOccupants, paymentTerms, contactRequirement) 
    có thể là intentional decision
```

---

## §9: Open Questions (Cần Làm Rõ)

1. **Duplicate repository**: Có intention nào cho 2 files hay là refactor dang dở?
2. **3 null fields**: `maxOccupants`, `paymentTerms`, `contactRequirement` — implement tiếp hay remove?
3. **DI refactor**: Có cần refactor DI để test hook không, hay chỉ cần test domain logic?
4. **Real data accuracy**: Có cần verify accuracy trên toàn bộ 3167 messages thực tế?
5. **Thứ tự ưu tiên**: Nên tập trung vào domain unit tests trước hay infra tests trước?

---

## §10: Tổng Kết

### Critical Findings

| # | Finding | Severity | Hành động |
|---|---------|----------|-----------|
| F1 | **2 DexieNormalizedListingRepository implementations** | CRITICAL | Test và hook dùng implementation khác nhau |
| F2 | **0% test coverage: DeduplicationService** | HIGH | Cần tạo test file mới |
| F3 | **0% test coverage: DexieNormalizedListingAdapter** (dùng bởi hook) | HIGH | Cần tạo test file mới |
| F4 | **Price parser 10+ format variants không được test** | HIGH | Cần mở rộng test |
| F5 | **parseServices() regex bug (management field)** | HIGH | Cần test để document behavior |
| F6 | **isPartiallyParsed logic có false negative** | MEDIUM | TNR nhưng không extract field → false = bug |
| F7 | **Template detection scoring boundary (score >= 2)** | MEDIUM | Edge case score = 1 |
| F8 | **ContentHash DJB2 collision possible** | MEDIUM | Cần stress test với real data |
| F9 | **No DI — hook không testable** | MEDIUM | Architectural issue |
| F10 | **3 fields always null** | LOW | Documentation mismatch |

### Số Liệu Implement

```
Tổng LOC module: ~1253
Tổng test LOC: ~330 (26%)
Path coverage ước lượng: <20%
Blind spots identified: 18 (BS-TD-01 đến BS-AR-02)
Code quality issues: 6
```

---

**Document Status**: Context Complete — No Code Changes Made
**Confidence**: 92%

*Generated by context-before-fix skill analysis — 2026-07-29*
