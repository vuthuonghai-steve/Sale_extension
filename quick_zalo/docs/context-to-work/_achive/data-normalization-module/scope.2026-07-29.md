# Scope Document — Module Chuẩn Hóa Dữ Liệu (Data Normalization Module)

**Date**: 2026-07-29
**Status**: Updated — after user clarification
**Feature**: data-normalization-module
**Language**: Tiếng Việt

---

## §1: Problem Summary

Hiện tại, TypeScript data-normalization module (`src/domain/data-normalization/`) parse 10 field từ `data_raw` nhưng **chỉ hỗ trợ template TNR** — bỏ qua Sky Group và 95 Home templates và các trường hợp tin nhắn không theo cấu trúc template nào.

**Mục tiêu**: Xây dựng một module chuẩn hóa dữ liệu độc lập (data warehouse node) chuyên trách:
- **Phân loại cơ bản**: Xác định template family (TNR / Sky Group / 95 Home / free_text) chỉ để biết cách normalize — không phải classification hệ thống
- **Chuẩn hóa fields**: Parse field từ data_raw theo template family tương ứng, hỗ trợ cả 3 template families
- **Xử lý ngoại lệ**: Với tin nhắn không theo template chuẩn nào → extract được field nào thì lưu field đó, luôn preserve data_raw, đánh dấu tin nhắn
- **Lưu trữ**: Persist vào IndexedDB, giữ 1 bản backup (trong ngày)
- **Batch chunking**: Xử lý 500 tin/lô để UI mượt

> Ghi chú: Python code tại `Docs/Data/code_python/` là công cụ phân tích/phân loại data_raw ban đầu, hỗ trợ quá trình nghiên cứu — **không phải** là một phần của module chuẩn hóa.

---

## §2: Entry Point (Điểm vào)

| Entry | Path | Vai trò |
|-------|------|---------|
| **Domain Service Core** | `src/domain/data-normalization/services/normalization.service.ts` | Normalization hiện tại (10 parsers, chỉ hỗ trợ TNR) — cần mở rộng |
| **Domain Entity** | `src/domain/data-normalization/entities/normalized-message.entity.ts` | Entity chuẩn hóa cũ (18 fields) — sẽ tạo entity riêng cho module mới |
| **Dedup Service** | `src/domain/data-normalization/services/deduplication.service.ts` | 2-stage dedup (file hash + DB lookup) |
| **Storage** | `src/infra/storage/dexie-message-repository.adapter.ts` | IndexedDB repository (IMessageRepository) |
| **Feature Hook** | `src/features/data-normalization/hooks/useDataNormalization.ts` | React hook điều phối import pipeline |
| **UI Screen** | `src/features/data-normalization/ui/DataNormalizationScreen.tsx` | UI nhập JSON, filter, hiển thị |
| **Template Analysis** | `Docs/Data/result/bao_cao_chi_tiet_template_phong.md` | Phân tích chi tiết 3 template families (tham khảo) |
| **Template Analysis JSON** | `Docs/Data/result/bao_cao_chi_tiet_template_phong.json` | JSON report cấu trúc template (dùng làm test fixture mẫu) |
| **Raw JSON Data** | `Docs/Data/Raw/` (5 files) | Data gốc từ 3 groups Zalo (dùng làm test fixtures) |

---

## §3: Scope Definition

### 3.1 Problem Area

Module chuẩn hóa dữ liệu hoạt động như một **data warehouse node** — nhận đầu vào là raw JSON, xử lý, và xuất dữ liệu đã chuẩn hóa để các module khác sử dụng:

1. **Template Detection**: Xác định template family (TNR / Sky Group / 95 Home / free_text / unknown)
2. **Field Extraction**: Parse 16+ fields từ data_raw theo template family tương ứng
3. **Xử lý ngoại lệ**: Với data không theo template chuẩn → extract được field nào thì lưu, luôn preserve data_raw, đánh dấu message
4. **Price Normalization**: Chuẩn hóa giá từ nhiều format tiếng Việt
5. **Deduplication**: 2-stage dedup (file-level hash + DB-level lookup) — chỉ trong phiên làm việc
6. **Storage**: Lưu normalized data vào IndexedDB, giữ 1 bản backup trong ngày
7. **Batch Chunking**: Xử lý 500 tin/lô trong hàm importJsonFile — đảm bảo UI mượt

> **Không có**: classification hệ thống (17 categories), export JSON/Markdown, real-time processing, streaming.

### 3.2 Boundary

**Trong scope (module mới):**
- `src/domain/data-normalization/` — TS domain entities + services (sẽ tạo entity riêng cho module)
- `src/features/data-normalization/` — TS hooks + UI components
- `src/infra/storage/` — Dexie DB + repository adapter
- `src/app/ports/message-repository.port.ts` — Port interface
- `src/shared/kernel/result.ts` — Result<T,E> pattern
- `src/shared/contracts/errors.ts` — AppError contract

**Tham khảo (dùng làm test fixtures & tài liệu design):**
- `Docs/Data/Raw/` — 5 raw JSON files (dùng làm mock data cho test)
- `Docs/Data/result/bao_cao_chi_tiet_template_phong.json` — Template structure analysis (fixtures)
- `Docs/Data/result/bao_cao_chi_tiet_template_phong.md` — Template format documentation
- `Docs/Data/code_python/src/classifier/rules/template_rules.py` — 14 pattern regexes tham khảo
- `Docs/Data/code_python/src/classifier/template.py` — Template detection logic tham khảo

**Ngoài scope:**
- Python classification pipeline — chỉ tham khảo pattern definitions, không port
- `src/domain/crm/`, `src/features/crm/` — Các module nghiệp vụ khác
- `src/entrypoints/` — WXT shell (background, content, sidepanel)
- `src/composition/` — DI wiring containers
- `src/infra/logging/` — Evlog logging system
- `src/shared/contracts/messages.ts` — Message bus
- `src/domain/message-extraction/` — Module trích xuất message từ Zalo
- Real-time processing, streaming, export JSON/Markdown

---

## §4: Impact Analysis

### 4.1 Direct Impact

| Thành phần | File | Mức ảnh hưởng |
|------------|------|----------------|
| **Entities (module mới)** | `src/domain/data-normalization/entities/` | **Tạo mới** — entity riêng, không extend entity cũ |
| **NormalizationService** | `src/domain/data-normalization/services/normalization.service.ts` | **Tham khảo** — parser logic cũ có thể dùng lại 1 phần, nhưng sẽ viết service mới |
| **DeduplicationService** | `src/domain/data-normalization/services/deduplication.service.ts` | **Tham khảo** — logic dedup có thể tái sử dụng |
| **DexieMessageRepository** | `src/infra/storage/dexie-message-repository.adapter.ts` | **Cập nhật** — thêm repository mới cho entity mới |
| **useDataNormalization Hook** | `src/features/data-normalization/hooks/useDataNormalization.ts` | **Cập nhật** — thêm batch chunking (500 tin/lô) |
| **Dexie DB Schema** | `src/infra/storage/dexie-database.ts` | **Cập nhật** — thêm table mới cho entity riêng |

### 4.2 Indirect Impact

| Thành phần | File | Lý do |
|------------|------|-------|
| **IMessageRepository Port** | `src/app/ports/message-repository.port.ts` | Interface có thể cần mở rộng với new query filters |
| **QuickZaloDexieDB** | `src/infra/storage/dexie-database.ts` | DB schema có thể cần new indexes |
| **AppError type** | `src/shared/contracts/errors.ts` | Error contract dùng chung — thêm error codes mới nếu cần |
| **Result<T,E>** | `src/shared/kernel/result.ts` | Monad pattern — ổn định, không thay đổi |
| **DataNormalizationScreen** | `src/features/data-normalization/ui/DataNormalizationScreen.tsx` | UI cần cập nhật filter/sort mới |
| **NormalizedCard** | `src/features/data-normalization/ui/components/NormalizedCard.tsx` | Render cần hiển thị fields mới |
| **ImportMetricsSummary** | `src/features/data-normalization/ui/components/ImportMetricsSummary.tsx` | Metrics hiển thị — ít thay đổi |
| **ZaloMessage Entity** | `src/domain/message-extraction/entities/zalo-message.entity.ts` | Raw input entity — normalization nhận input từ đây |
| **Feature Registry** | `src/features/registry.ts` | Module registration — ổn định |
| **Classification Results** | `Docs/Data/result/classification_all_messages.json` | 3.167 messages đã phân loại — có thể dùng làm training data |

---

## §5: Call Chain (Chuỗi gọi)

### 5.1 Luồng Import Hiện Tại (TypeScript)

```
DataNormalizationScreen (upload .json file)
  └─ useDataNormalization.importJsonFile(file)
       ├─ file.text() → JSON.parse()
       ├─ MessageDeduplicationService.deduplicateFileInput(rawMessages)
       │    └─ [loop] DataNormalizationService.normalize(rawMsg)
       │         ├─ generateContentHash()          [DJB2-like rolling hash]
       │         ├─ parseCode()                    [Mã: pattern]
       │         ├─ parseAddress()                 [Địa chỉ: pattern]
       │         ├─ parseDistrict()                [15 Hanoi districts match]
       │         ├─ parsePriceRaw()                [Giá: pattern]
       │         ├─ parsePriceNumeric()            [4tr7, 4tr3-4tr6, 4tr990k, raw]
       │         ├─ parseAvailableRooms()          [Trống: pattern]
       │         ├─ parseRoomType()                [Phòng: pattern]
       │         ├─ parseHasElevator()             [boolean — "thang máy"]
       │         ├─ parseFurniture()               [Nội thất: pattern]
       │         ├─ parseServices()                [Dịch vụ: electric/water/internet]
       │         └─ parseNotes()                   [Lưu ý: section parsing]
       └─ DexieMessageRepository.saveBatch(uniqueMessages, dupesInFile)
            ├─ findExistingHashes(hashes)           [DB query — contentHash lookup]
            ├─ [filter] loại hash đã tồn tại
            └─ bulkPut(newMessages)                 [Dexie bulk insert]
```

### 5.2 Luồng Chuẩn Hóa Module Mới

```
DataNormalizationScreen (upload .json file)
  └─ useDataNormalization.importJsonFile(file)
       ├─ file.text() → JSON.parse()
       │
       ├─ [BATCH CHUNKING] Chia messages thành lô 500 tin
       │
       └─ [for each batch]
            ├─ Bước 1: PHÂN LOẠI CƠ BẢN
            │    ├─ TemplateDetector.detect(data_raw)
            │    │    ├─ "TNR"     — có "Mã:", "Địa chỉ:", "✅ Dịch vụ"
            │    │    ├─ "Sky"     — có "/-rose", "☘️ Phí dv", "💥Nội thất"
            │    │    ├─ "95_Home" — có "🌹", "KHAI TRƯƠNG", "⚡ Chi phí"
            │    │    └─ null      — không xác định được template (free_text / unknown)
            │    └─ message_type: "structured" | "semi-structured" | "unknown"
            │
            ├─ Bước 2: CHUẨN HÓA
            │    └─ NormalizationService.normalize(data_raw, template_family)
            │         ├─ [TNR]       Mã + Địa chỉ + Giá + Nội thất + Dịch vụ + Lưu ý
            │         ├─ [Sky]       Hoa hồng + Giá range + Diện tích + Phí dv + Chính sách
            │         ├─ [95_Home]   Hoa hồng + Trục giá + Khu vực + Nội thất + Quy định
            │         ├─ [null]      Extract field nào được field đó, mark isPartiallyParsed
            │         └─ Luôn preserve data_raw, luôn generate contentHash
            │
            ├─ Bước 3: DEDUP
            │    ├─ Stage 1: In-file dedup via contentHash Set
            │    └─ Stage 2: DB dedup via findExistingHashes()
            │
            └─ Bước 4: LƯU TRỮ
                 └─ NormalizedMessageRepository.saveBatch(uniqueMessages)
                      └─ IndexedDB: normalized_messages (entity mới, table mới)
```

---

## §6: Data Flow (Luồng dữ liệu)

### 6.1 Input — Raw JSON

```json
// 5 files, shared structure:
{
  "messages": [
    {
      "id": "message-frame_1785246883531",
      "data_raw": "Mã A1204\n\n🏠 Địa chỉ: Nhà 158/70 Kim Giang - Quận: Thanh Xuân\n..."
    }
  ]
}
```

### 6.2 Entity Module Mới — Entity Riêng Cho Data Normalization

Tạo entity riêng, không extend entity cũ. Entity mới thiết kế cho module chuẩn hóa độc lập.

```typescript
// === entity: NormalizedListing.entity.ts ===
// Entity chính — chuẩn hóa tin nhắn chứa thông tin phòng

export interface ServiceFees {
  electricity: number | null;        // VND per kWh
  water: number | null;              // VND per unit/person
  internet: number | null;           // VND per month
  management: number | null;         // VND per person/month
  washingMachine: number | null;     // VND per person/month
  parking: number | null;            // VND per month
  cleaning: number | null;           // VND per month
  other: { name: string; amount: number }[];
  raw: string;                       // Preserved original text
}

export interface Policy {
  type: 'PET' | 'VEHICLE' | 'FOREIGNER' | 'OCCUPANTS' | 'PAYMENT' | 'CONTACT' | 'OTHER';
  description: string;
}

export interface NormalizedListing {
  // === Core fields (luôn có) ===
  id: string;                        // ID gốc từ source
  contentHash: string;               // Deterministic hash (case/space normalized)
  data_raw: string;                  // Preserved intact — 100% gốc
  createdAt: string;                 // ISO 8601 — thời điểm import

  // === Classification ===
  templateFamily: 'TNR' | 'Sky' | '95_Home' | null;  // null = free_text / unknown
  isPartiallyParsed: boolean;        // true = không parse được đầy đủ, đánh dấu để review

  // === Property fields ===
  code: string | null;               // Mã: A82, A1204
  address: string | null;            // Địa chỉ thô (raw)
  district: string | null;           // Quận (extracted từ address)
  priceRaw: string | null;           // Giá thô: "4tr7", "4tr - 4tr2"
  priceNumeric: number | null;       // Giá số: 4700000 (lower bound nếu range)
  priceRange: { from: number; to: number } | null;  // Range: 4000000 - 4200000
  roomType: string | null;           // Studio, 1N1K, Gác xép
  availableRooms: string | null;     // P802, tầng 2, 8p
  floor: number | null;              // Tầng
  hasElevator: boolean | null;       // Thang máy (true) / Thang bộ (false)

  // === Commission & Axis ===
  commission: number | null;         // Phần trăm hoa hồng: 30, 40
  commissionCode: string | null;     // Mã hoa hồng: "1599", "H315"
  axis: string | null;               // Trục tòa nhà: "Trục ngoài"

  // === Details ===
  area: number | null;               // Diện tích m²
  furniture: string | null;          // Nội thất description thô
  serviceFees: ServiceFees;          // Chi phí dịch vụ chi tiết
  policies: Policy[];                // Quy định
  notes: string[];                   // Lưu ý bổ sung
  availabilityDate: string | null;   // Ngày trống: "01/08"
  maxOccupants: number | null;       // Số người tối đa

  // === Payment ===
  paymentTerms: string | null;       // "1 cọc 1", "HĐ 12 tháng"
  contactRequirement: string | null; // "Gọi trước 30p"
}

// === entity: ImportSession.entity.ts ===
// Mỗi lần import = 1 session, lưu backup trong ngày

export interface ImportSession {
  id: string;                        // UUID
  importedAt: string;                // ISO 8601
  sourceFileName: string;            // Tên file gốc
  totalMessages: number;
  uniqueListings: number;
  partialParsedCount: number;        // Số tin đánh dấu isPartiallyParsed
  templateBreakdown: {
    TNR: number;
    Sky: number;
    '95_Home': number;
    unknown: number;
  };
  status: 'completed' | 'partial' | 'failed';
  error?: string;
}
```

### 6.3 Batch Chunking Strategy

```typescript
// Trong useDataNormalization.importJsonFile()
const BATCH_SIZE = 500;

async function importJsonFile(file: File) {
  const rawMessages = JSON.parse(await file.text());
  const totalBatches = Math.ceil(rawMessages.length / BATCH_SIZE);

  for (let i = 0; i < totalBatches; i++) {
    const batch = rawMessages.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
    // processBatch(batch) -> normalize + dedup + save
    // yield/setTimeout để UI không bị block
    await new Promise(r => setTimeout(r, 0)); // yield cho React render
    updateProgress((i + 1) / totalBatches);
  }
}
```

### 6.4 Xử Lý Ngoại Lệ (Non-template / Free-text Messages)

```
Khi templateFamily = null (không xác định được template):
├─ isPartiallyParsed = true
├─ data_raw luôn được preserve
├─ Extract field nào được:
│    ├─ Giá → nếu có pattern "tr"/"k" → priceNumeric
│    ├─ Địa chỉ → nếu có pattern "Ngõ"/"Số"/"Phường"/"Quận"
│    ├─ Mã → nếu có "Mã" hoặc "H" + số
│    ├─ Diện tích → nếu có "m2"
│    └─ District → nếu match tên quận
│
└─ Các field còn lại → null
    └─ UI/Module downstream sẽ biết đây là tin chưa parse đầy đủ
```

### 6.5 Backup Strategy

```typescript
// Chỉ giữ 1 bản backup trong ngày làm việc
// Mỗi lần import = 1 ImportSession
// ImportSession lưu trong IndexedDB riêng (table: import_sessions)
// Khi import mới → ghi đè backup cũ trong cùng ngày
// Hoặc dùng pattern: keepLatest(import_sessions, 1) // chỉ giữ 1 session gần nhất
```

### 6.6 ServicePricing (cho entity mới)

```typescript
export interface ServiceFees {
  electricity: number | null;        // VND per kWh
  water: number | null;              // VND per unit/person  
  internet: number | null;           // VND per month
  management: number | null;         // VND per person/month (phí dịch vụ chung)
  washingMachine: number | null;     // VND per person/month
  parking: number | null;            // VND per month
  cleaning: number | null;           // VND per month
  other: { name: string; amount: number }[];
  raw: string;                       // Preserved original fee section text
}
```

### 6.7 Dependencies

**Module mới (TypeScript):**
- WXT (Chrome Extension framework)
- React 18+ (UI)
- Dexie.js (IndexedDB wrapper) — table cho entity mới
- Result<T,E> pattern (custom @shared/kernel)
- fake-indexeddb (testing)
- Vitest (testing framework)

**Test fixtures (tham khảo từ data thực tế):**
- `Docs/Data/Raw/` — 5 JSON files, 3 groups, 3.167 messages
- `Docs/Data/result/bao_cao_chi_tiet_template_phong.json` — Template structure breakdown
- `Docs/Data/result/bao_cao_chi_tiet_template_phong.md` — Template documentation với ví dụ thực tế

---

## §7: Affected Components (Các thành phần bị ảnh hưởng)

### 7.1 Files — TypeScript Codebase

| # | File | Lines | Vai trò | Mức thay đổi |
|---|------|-------|---------|-------------|
| 1 | `src/domain/data-normalization/entities/` (new files) | — | NormalizedListing.entity + ImportSession.entity | **Tạo mới** — entity riêng cho module |
| 2 | `src/domain/data-normalization/services/normalization.service.ts` | 175 | 10 parser methods cũ (TNR-only) | **Tham khảo** — không extend, viết service mới |
| 3 | `src/domain/data-normalization/services/deduplication.service.ts` | 44 | Stage 1 dedup | **Tham khảo** — có thể tái sử dụng logic |
| 4 | `src/domain/data-normalization/` (new files) | — | TemplateDetector, NormalizationService mới | **Tạo mới** — core domain module |
| 5 | `src/features/data-normalization/hooks/useDataNormalization.ts` | 96 | Import orchestrator | **Cập nhật** — thêm batch chunking 500 tin/lô |
| 6 | `src/features/data-normalization/ui/DataNormalizationScreen.tsx` | 128 | Main screen | **Cập nhật** — progress bar, import session info |
| 7 | `src/features/data-normalization/ui/components/NormalizedCard.tsx` | 137 | Message card | **Cập nhật** — hiển thị isPartiallyParsed status |
| 8 | `src/features/data-normalization/ui/components/JsonUploader.tsx` | 44 | File upload | Giữ nguyên |
| 9 | `src/features/data-normalization/ui/components/ImportMetricsSummary.tsx` | 29 | Metrics display | **Cập nhật** — thêm partialParsed count |
| 10 | `src/features/data-normalization/index.ts` | 10 | Module entry | Giữ nguyên |
| 11 | `src/infra/storage/dexie-database.ts` | 15 | Dexie DB schema | **Cập nhật** — thêm table mới (normalized_listings, import_sessions) |
| 12 | `src/infra/storage/` (new file) | — | Repository mới cho entity mới | **Tạo mới** |
| 13 | `src/shared/kernel/result.ts` | 60 | Result monad | Giữ nguyên |
| 14 | `src/shared/contracts/errors.ts` | 5 | AppError | Giữ nguyên |

### 7.2 Files Tham Khảo (Reference — Không Sửa)

| # | File | Vai trò tham khảo |
|---|------|------------------|
| 1 | `Docs/Data/code_python/src/classifier/template.py` | Template detection logic — 3 families |
| 2 | `Docs/Data/code_python/src/classifier/rules/template_rules.py` | 14 pattern regexes |
| 3 | `Docs/Data/Raw/` (5 files) | Raw data → Mock test fixtures |
| 4 | `Docs/Data/result/bao_cao_chi_tiet_template_phong.json` | Template structure → Test fixtures mẫu |
| 5 | `Docs/Data/result/bao_cao_chi_tiet_template_phong.md` | Template documentation → Design reference |
| 6 | `src/domain/data-normalization/entities/normalized-message.entity.ts` | Entity cũ → Tham khảo field definitions |
| 7 | `src/domain/data-normalization/services/normalization.service.ts` | Service cũ → Tham khảo parser implementations |

### 7.3 Key Functions/APIs

| Function | File | Mô tả |
|----------|------|-------|
| `TemplateDetector.detect(data_raw)` | **Mới** | Detect template family (TNR/Sky/95_Home/null) dựa trên pattern matching |
| `NormalizationService.normalize(data_raw, templateFamily)` | **Mới** | Core normalize — template-aware field extraction |
| `NormalizationService.parsePrice(raw)` | **Mới** | Unified price parser — handle cả 3 template formats |
| `NormalizationService.parseDistrict(text)` | **Mới** | District extraction — 15 districts, hardcoded |
| `NormalizationService.extractFees(text, templateFamily)` | **Mới** | Service fee extraction theo template-specific format |
| `DeduplicationService.deduplicateFileInput(rawMessages)` | deduplication.service.ts:20 | Stage 1 in-file dedup (tái sử dụng) |
| `NormalizedListingRepository.saveBatch(batch)` | **Mới** | Batch save with Stage 2 DB dedup |
| `useDataNormalization.importJsonFile(file)` | useDataNormalization.ts:41 | Orchestrator với batch chunking 500 tin/lô |

---

## §8: Evidence (Bằng chứng chi tiết)

### E1: Classification Module Chỉ Tồn Tại Trong Python

```xml
<evidence>
  <file>Docs/Data/code_python/src/</file>
  <finding>Toàn bộ classification pipeline (13 files, 500+ LOC) chỉ tồn tại trong Python. Không có TypeScript equivalent — 16 patterns, 10 rules, 17 sub-categories chưa được port.</finding>
</evidence>
```

### E2: TypeScript Normalization Chỉ Hỗ Trợ TNR Template

```xml
<evidence>
  <file>src/domain/data-normalization/services/normalization.service.ts</file>
  <line>49-165</line>
  <finding>Tất cả 10 parser methods dùng pattern keywords từ TNR template (Mã:, Địa chỉ:, Trống:, Giá:, Phòng:, Nội thất:, Dịch vụ:, Lưu ý). Không hỗ trợ Sky Group pattern (/-rose, 💥Nội thất, ☘️Phí dv) hay 95 Home pattern (🌹, 🏡KHAI TRƯƠNG, 🕌, ⚡Chi phí dịch vụ).</finding>
</evidence>
```

### E3: 3 Template Families Hoàn Toàn Riêng Biệt

```xml
<evidence>
  <file>Docs/Data/result/bao_cao_chi_tiet_template_phong.md</file>
  <line>65-283</line>
  <finding>TNR (770 msgs), Sky Group (446 msgs), 95 Home (223 msgs) có cấu trúc trường hoàn toàn khác nhau: emoji markers khác nhau, field names khác nhau, giá trị range formats khác nhau, policy formats khác nhau. Mỗi template cần một normalization strategy riêng.</finding>
</evidence>
```

### E4: Template Pattern Definitions Cần Là Một Source of Truth

```xml
<evidence>
  <file>Docs/Data/code_python/src/classifier/rules/template_rules.py</file>
  <line>15-43</line>
  <finding>14 template pattern regexes được định nghĩa trong Python (has_ma_code, has_dia_chi, has_house_emoji, ...). Các patterns này không tồn tại trong TypeScript. Cần có một config/thường nhất cho cả classification rules và extraction rules.</finding>
</evidence>
```

### E5: Price Parser Có Bug — parseServices 'management' Field

```xml
<evidence>
  <file>src/domain/data-normalization/services/normalization.service.ts</file>
  <line>134-154</line>
  <finding>parseServices() dùng regex không chặt: field "management" bắt cả internet/vệ sinh/thang máy do dùng pipe operator. Cần refactor khi mở rộng cho Sky Group (có ☘️Phí dv structure khác).</finding>
</evidence>
```

### E6: Price Parser Chưa Hỗ Trợ Range Format

```xml
<evidence>
  <file>Docs/Data/code_python/src/classifier/rules/short_rules.py</file>
  <line>1-119</line>
  <finding>Sky Group dùng price range (4tr - 4tr2), 95 Home dùng axis-based pricing (Trục ngoài - 5tr2). parsePriceNumeric() hiện tại chỉ handle lower bound của ranges, không track { from, to } pair.</finding>
</evidence>
```

### E7: District List Không Đồng Bộ Giữa Service Và Screen

```xml
<evidence>
  <file>src/domain/data-normalization/services/normalization.service.ts</file>
  <line>59-72</line>
  <finding>parseDistrict() hardcode 15 Hanoi districts.</finding>
</evidence>
<evidence>
  <file>src/features/data-normalization/ui/DataNormalizationScreen.tsx</file>
  <line>96-110</line>
  <finding>DataNormalizationScreen hardcode 11 districts (thiếu 4 district so với service).</finding>
</evidence>
```

### E8: Không Có DI Composition

```xml
<evidence>
  <file>src/features/data-normalization/hooks/useDataNormalization.ts</file>
  <line>7-9</line>
  <finding>Services được khởi tạo static top-level: new DataNormalizationService(), new MessageDeduplicationService(), new DexieMessageRepository(). Không thể mock cho testing — cần refactor DI qua composition/ containers.</finding>
</evidence>
```

### E9: 0% Unit Test Coverage Cho Domain Services

```xml
<evidence>
  <file>src/domain/data-normalization/services/</file>
  <finding>Không có normalization.service.test.ts hay deduplication.service.test.ts. 219 dòng logic domain service hoàn toàn chưa được test.</finding>
</evidence>
```

### E10: QueryOptions.minPrice/maxPrice Không Được Implement

```xml
<evidence>
  <file>src/infra/storage/dexie-message-repository.adapter.ts</file>
  <line>60-80</line>
  <finding>findAll() filter by searchQuery, district, hasElevator trong memory. minPrice và maxPrice được định nghĩa trong QueryOptions interface nhưng không được implement.</finding>
</evidence>
```

### E11: `unknown_short` Còn 2.1% Messages Chưa Phân Loại Được

```xml
<evidence>
  <file>Docs/Data/result/classification_summary.json</file>
  <finding>68 messages (2.1%) rơi vào unknown_short. Chủ yếu là short messages không match pattern hiện tại. Cần phân tích thêm để cải thiện coverage.</finding>
</evidence>
```

### E12: Data_raw Format Consistency

```xml
<evidence>
  <file>Docs/Data/Raw/95_home/zalo-messages-NGUỒN_HÀNG_95_HOME-20260728-212809.json</file>
  <finding>95_home messages có format "id": "message-frame_TIMESTAMP" giống hệt các group khác. 504 messages, 2020 lines. data_raw chứa format 95 Home với 🌹 header.</finding>
</evidence>
<evidence>
  <file>Docs/Data/Raw/sky_groub/zalo-messages-Phòng_Trống_Sky_Group-20260728-213709.json</file>
  <finding>Sky group: 894 messages, 3580 lines. data_raw chứa /-rose header, price ranges, policy section khác biệt.</finding>
</evidence>
```

---

## §9: Template Detection Patterns (Tham Khảo)

> Module chuẩn hóa KHÔNG port toàn bộ Python classification rules. Chỉ sử dụng 14 template patterns để xác định template family và hỗ trợ field extraction.

### 9.1 Template Detection Patterns (14 patterns)

Các patterns này dùng để **detect template family** — không phải để phân loại chi tiết 17 categories.

| # | Pattern ID | Regex | Family Detection |
|---|-----------|-------|-----------------|
| 1 | `has_ma_code` | `\bMã\s*[: ]` | TNR, Sky |
| 2 | `has_dia_chi` | `Địa[ ]?chỉ` | All |
| 3 | `has_house_emoji` | `[🏠🕌🏡]` | All |
| 4 | `has_price_emoji` | `[💰💸💵]` | All |
| 5 | `has_check_cross` | `[✅❌]` | All |
| 6 | `has_gia` | `Giá\|giá` | All |
| 7 | `has_noi_that` | `Nội thất\|nội thất` | TNR, 95H |
| 8 | `has_dich_vu` | `Dịch vụ\|dịch vụ\|Phí dv\|phí dv` | All |
| 9 | `has_luu_y` | `Lưu ý\|lưu ý` | TNR, 95H |
| 10 | `has_thang_may` | `Thang máy\|thang máy` | All |
| 11 | `has_rose_slash` | `/\-rose` | Sky (unique) |
| 12 | `has_rose_emoji` | `🌹` | 95H (primary) |
| 13 | `has_khai_truong` | `KHAI TRƯƠNG\|khai trương\|Khai trương` | 95H (unique) |
| 14 | `has_availability` | `Trống\|trống\|ở được\|vào ở` | All |

### 9.2 Heuristic Template Detection (cho module mới)

```typescript
// Logic đơn giản hóa — chỉ detect 3 families
function detectTemplateFamily(data_raw: string): 'TNR' | 'Sky' | '95_Home' | null {
  if (hasRoseSlash(data_raw)) return 'Sky';           // /-rose là unique cho Sky
  if (hasKhaiTruong(data_raw)) return '95_Home';      // KHAI TRƯƠNG unique cho 95 Home
  if (hasMaCode(data_raw) && hasDichVu(data_raw)) {
    if (hasNoiThat(data_raw)) return 'TNR';           // Mã + Dịch vụ + Nội thất → TNR
  }
  // Fallback: đếm patterns
  const count = countMatchingPatterns(data_raw);
  if (count >= 4) return 'TNR';                       // ≥4 patterns → có template
  return null;                                         // free_text / unknown
}
```

---

## §10: Confidence Assessment (Đánh giá độ tin cậy)

```yaml
overall_confidence: 95%
reasoning:
  - Đã đọc toàn bộ source code của TypeScript normalization module hiện tại
  - Đã đọc Python classification pipeline để tham khảo pattern definitions
  - Đã đọc 5 raw JSON files, hiểu rõ cấu trúc input
  - Đã đọc 2 báo cáo template chi tiết (JSON + MD) — đã xác định 3 template families
  - Đã đọc shared contracts: Result<T,E>, AppError, IMessageRepository
  - Đã trace được call chain đầy đủ từ UI → hook → service → storage
  - Đã xác định được field mappings cụ thể cho entity mới
  - User đã clarify tất cả các architecture decisions

uncertainties:
  - Service fee structure của Sky Group và 95 Home có thể có nhiều biến thể hơn template mẫu trong báo cáo
  - Không chắc 100% rằng heuristic template detection handle được mọi edge case của free_text messages
```

---

## §11: Design Decisions (Đã xác nhận từ User)

Dựa trên clarifications từ user, các quyết định thiết kế đã được xác nhận:

| # | Quyết định | Giá trị | Lý do |
|---|-----------|---------|-------|
| D1 | **Python classification** | Chỉ tham khảo pattern definitions | Python là công cụ phân tích hỗ trợ, không phải một phần của module |
| D2 | **Real-time processing** | Không cần | Chỉ làm việc trong ngày, import thủ công |
| D3 | **Entity strategy** | Tạo entity riêng | Module độc lập — không extend entity cũ |
| D4 | **Config/Thresholds** | Giữ hardcode | Không cần config layer |
| D5 | **Test fixtures** | Dùng data thực tế | `Docs/Data/Raw/` + `bao_cao_chi_tiet_template_phong.json` + `.md` |
| D6 | **Batch chunking** | 500 tin/lô | Đảm bảo UI mượt khi import file lớn |
| D7 | **Backup** | 1 bản trong ngày | Chỉ cần backup phiên làm việc hiện tại |
| D8 | **Module role** | Data warehouse node | Module độc lập, chuyên chuẩn hóa data cho hệ thống sử dụng |
| D9 | **Xử lý ngoại lệ** | Extract partial → mark | Với tin không template chuẩn: extract được field nào thì lưu, luôn preserve data_raw, đánh dấu isPartiallyParsed |

---

## §12: Phân Tích Kiến Trúc

### 12.1 Mô Hình Data Warehouse Node

Module chuẩn hóa hoạt động như một **node xử lý dữ liệu độc lập** — nhận raw input, xử lý, xuất normalized data cho các module khác.

```
                       ┌─────────────────────┐
                       │   Raw JSON Input     │
                       │  (import thủ công)   │
                       └──────────┬──────────┘
                                  │
                                  ▼
              ┌───────────────────────────────────┐
              │     DATA NORMALIZATION MODULE      │
              │                                     │
              │  ┌─────────────────────────────┐   │
              │  │  1. TemplateDetector         │   │
              │  │     └─ detect(data_raw)       │   │
              │  │        → 'TNR' | 'Sky'       │   │
              │  │        → '95_Home' | null    │   │
              │  └─────────────┬───────────────┘   │
              │                ▼                    │
              │  ┌─────────────────────────────┐   │
              │  │  2. NormalizationService     │   │
              │  │     └─ normalize(data_raw)    │   │
              │  │        → NormalizedListing    │   │
              │  │     └─ isPartiallyParsed flag │   │
              │  └─────────────┬───────────────┘   │
              │                ▼                    │
              │  ┌─────────────────────────────┐   │
              │  │  3. DeduplicationService     │   │
              │  │     ├─ Stage 1: in-file      │   │
              │  │     └─ Stage 2: DB lookup    │   │
              │  └─────────────┬───────────────┘   │
              │                ▼                    │
              │  ┌─────────────────────────────┐   │
              │  │  4. Storage Layer            │   │
              │  │     ├─ NormalizedListingRepo │   │
              │  │     ├─ ImportSessionRepo     │   │
              │  │     └─ Dexie/IndexedDB       │   │
              │  └─────────────────────────────┘   │
              └───────────────────────────────────┘
                                  │
                                  ▼
              ┌───────────────────────────────────┐
              │      Normalized Data Output        │
              │  (cho các module khác sử dụng)     │
              │  - NormalizedListing[]              │
              │  - ImportSession metadata           │
              └───────────────────────────────────┘
```

### 12.2 Layer Breakdown (Module Mới)

```
Domain Layer (@domain/data-normalization/)
├── entities/
│   ├── normalized-listing.entity.ts     [MỚI — entity chính]
│   └── import-session.entity.ts         [MỚI — session tracking]
├── services/
│   ├── template-detector.service.ts     [MỚI — template family detection]
│   ├── normalization.service.ts         [MỚI — core normalization, 3 template strategies]
│   └── deduplication.service.ts         [TÁI SỬ DỤNG — logic từ service cũ]

App Layer (@app/ports/)
├── normalixed-listing-repository.port.ts [MỚI — port cho entity mới]
├── import-session-repository.port.ts     [MỚI — port cho import session]

Infra Layer (@infra/)
├── storage/
│   ├── dexie-database.ts                [CẬP NHẬT — thêm 2 table mới]
│   ├── dexie-normalized-listing.adapter.ts [MỚI — repository implementation]
│   └── dexie-import-session.adapter.ts  [MỚI — session repository]

Feature Layer (@features/data-normalization/)
├── hooks/
│   └── useDataNormalization.ts          [CẬP NHẬT — batch chunking 500]
├── ui/
│   ├── DataNormalizationScreen.tsx      [CẬP NHẬT — progress, session info]
│   └── components/
│       ├── NormalizedCard.tsx           [CẬP NHẬT — isPartiallyParsed badge]
│       └── ImportMetricsSummary.tsx     [CẬP NHẬT — partialParsed count]
└── index.ts                             [GIỮ NGUYÊN]
```

### 12.3 So Sánh: Entity Cũ vs Entity Mới

| Khía cạnh | Entity cũ (NormalizedMessage) | Entity mới (NormalizedListing) |
|-----------|-------------------------------|-------------------------------|
| **Template support** | Chỉ TNR | TNR + Sky + 95_Home + free_text |
| **Xử lý ngoại lệ** | Không — assume all structured | ✅ isPartiallyParsed flag |
| **Price ranges** | Không — only single price | ✅ priceRange {from, to} |
| **Commission** | Không | ✅ commission + commissionCode |
| **Service Fees** | String-based (buggy) | ✅ Structured ServiceFees |
| **Policies** | Chỉ notes[] | ✅ Policy[] with typed policies |
| **Import tracking** | Không | ✅ ImportSession entity |
| **Backup** | Không | ✅ Keep 1 session backup |

---

## §13: Tổng Kết (Summary)

### Key Findings

1. **Module độc lập (data warehouse node)**: Python classification CHỈ là tham khảo — không port. Module mới chỉ cần template detection + field extraction.

2. **Template coverage gap**: Normalization hiện tại chỉ hỗ trợ TNR. Module mới cần hỗ trợ cả 3 template families (TNR 770 msg, Sky 446 msg, 95 Home 223 msg).

3. **Field extraction**: 16+ fields cần normalize, entity riêng mới (NormalizedListing) thay vì extend entity cũ (NormalizedMessage 18 fields).

4. **Xử lý ngoại lệ**: Với tin không template chuẩn → extract partial, mark isPartiallyParsed, luôn preserve data_raw.

5. **Batch chunking**: 500 tin/lô trong importJsonFile — đảm bảo UI không bị block.

6. **Backup**: Giữ 1 ImportSession backup trong ngày.

7. **3 template families riêng biệt**: TNR (format chuẩn), Sky Group (range prices + policies), 95 Home (axis-based + commission). Mỗi family cần extraction strategy riêng.

8. **Hardcode thresholds**: Giữ hardcode như thiết kế hiện tại — không cần config layer.

9. **Test fixtures data thực tế**: `Docs/Data/Raw/` (5 files, 3.167 msgs) + `bao_cao_chi_tiet_template_phong.json` + `.md`.

### Next Steps

1. ✅ Scope document hoàn thành — tất cả design decisions đã clarified
2. ⏳ Thiết kế entity mới: `NormalizedListing` + `ImportSession`
3. ⏳ Thiết kế `TemplateDetector.service` — heuristic detection cho 3 families
4. ⏳ Thiết kế `NormalizationService` — 3 template-aware extraction strategies
5. ⏳ Thiết kế storage layer — 2 table mới + 2 repository ports mới
6. ⏳ Cập nhật `useDataNormalization` hook — batch chunking 500 tin/lô
7. ⏳ Tạo test fixtures từ data thực tế (Raw/ + template JSON)
8. ⏳ Viết unit test cho domain services

---

**Document Status**: Context Complete — No Code Changes Made
**Confidence**: 95%

*Generated by context-before-fix skill analysis — 2026-07-29*
