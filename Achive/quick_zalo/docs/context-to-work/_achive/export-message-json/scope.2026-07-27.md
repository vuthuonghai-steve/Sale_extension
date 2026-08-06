# Scope Document — Export Data JSON (Message Extraction)

**Date**: 2026-07-27
**Status**: Initial

---

## §1: Problem Summary (Tổng quan)

Yêu cầu bổ sung tính năng **export dữ liệu tin nhắn đã trích xuất** dưới định dạng JSON từ feature `message-extraction`. Hiện tại, dữ liệu tin nhắn chỉ tồn tại trong React state (in-memory) và không có cơ chế nào để người dùng tải xuống hoặc lưu trữ dữ liệu đã bóc tách.

---

## §2: Entry Point

| Thành phần | Đường dẫn | Vai trò |
|---|---|---|
| **UI App** | `src/features/message-extraction/ui/SidepanelApp.tsx` | Root component của sidepanel — nơi export button sẽ được thêm vào |
| **Hook dữ liệu** | `src/features/message-extraction/ui/hooks/useExtractedMessages.ts` | Quản lý toàn bộ `ZaloMessage[]` state (cả `messages` đã lọc và `allMessages`) |
| **Domain Entity** | `src/domain/message-extraction/entities/zalo-message.entity.ts` | Interface `ZaloMessage` và `ExtractedLeadData` — cấu trúc dữ liệu xuất ra |

---

## §3: Scope Definition

### 3.1 Problem Area

```
features/message-extraction/ui/  <-- UI layer (nơi thay đổi chính)
domain/message-extraction/        <-- Domain entities (tham chiếu, KHÔNG sửa)
```

### 3.2 Boundary

```
IN SCOPE:
  - Thêm nút/button export JSON trong sidepanel UI
  - Logic xuất file JSON từ ZaloMessage[] hiện có
  - Download file .json qua browser download API
  - UI feedback (loading indicator hoặc thông báo thành công/thất bại)

OUT OF SCOPE:
  - Sửa domain entities (ZaloMessage, ExtractedLeadData)
  - Sửa domain services (parseLeadData, deduplicator)
  - Thêm persistent storage (IndexedDB/LocalStorage)
  - Export định dạng khác (CSV, XLSX)
  - Export từ background worker
  - Cơ chế schedule/auto-export
  - Tính năng chọn field export
  - Xử lý export số lượng lớn (>10k messages) với virtual scrolling
```

### 3.3 Constraint: `must_not`

- Không sửa domain layer (`@domain/message-extraction/` entities/services)
- Không sửa infra layer (`infra/extraction/`)
- Không thêm dependency mới (FileSaver, etc.) — dùng Web API thuần
- Không lưu messages vào disk/storage — chỉ export state hiện tại

---

## §4: Impact Analysis

### 4.1 Direct Impact (Thay đổi trực tiếp)

| File | Impact | Mức độ |
|---|---|---|
| `src/features/message-extraction/ui/SidepanelApp.tsx` | Render export button, gọi export handler | ✅ Sửa |
| `src/features/message-extraction/ui/hooks/useExtractedMessages.ts` | Export function mới, cần expose `allMessages` | ✅ Sửa |
| `src/features/message-extraction/ui/components/FilterBar/FilterBar.tsx` | Có thể thêm export button vào thanh filter | ✅ Có thể |
| `src/features/message-extraction/ui/types/sidepanel-ui.types.ts` | Thêm type cho export options nếu cần | ⚠️ Có thể |
| `src/features/message-extraction/ui/lib/constants.ts` | Thêm UI text constants cho export | ⚠️ Có thể |

### 4.2 Indirect Impact (Gián tiếp)

| File | Impact | Mức độ |
|---|---|---|
| `src/features/message-extraction/ui/components/index.ts` | Re-export component mới nếu tạo component riêng | ⚠️ Có thể |
| `src/shared/contracts/messages.ts` | KHÔNG cần thay đổi (export là pure UI) | ✅ Không ảnh hưởng |
| `src/domain/message-extraction/entities/zalo-message.entity.ts` | KHÔNG cần thay đổi (dùng interface có sẵn) | ✅ Không ảnh hưởng |

### 4.3 Tính năng bị ảnh hưởng

- **Filter/Search**: Người dùng export messages matching filter hiện tại hay export tất cả? → Cần quyết định.
- **Stats display**: Không bị ảnh hưởng.
- **Message streaming**: Không bị ảnh hưởng (export là action rời rạc).

---

## §5: Call Chain

```mermaid
flowchart LR
    A[User click Export JSON] --> B[Handler trong SidepanelApp]
    B --> C{Export loại nào?}
    C -->|messages đã lọc| D[filteredMessages từ useExtractedMessages]
    C -->|all messages| E[allMessages từ useExtractedMessages]
    D --> F[JSON.stringify(data, null, 2)]
    E --> F
    F --> G[Tạo Blob application/json]
    G --> H[Tạo ObjectURL + trigger download]
    H --> I[Browser download dialog]
```

**Data flow chi tiết** (từ DOM đến export):
```
ZaloDomObserver (infra)
  → parseLeadData (domain service)
  → ZaloMessage entity
  → browser.runtime.sendMessage { zalo.message.extracted }
  → SidepanelBridgeService.subscribeExtractedMessages
  → useExtractedMessages state (setMessages)
  → User click Export → exportJSON(messages) → download .json
```

---

## §6: Data Flow

### 6.1 Input

`ZaloMessage[]` — array các messages từ React state. Cấu trúc:

```typescript
interface ZaloMessage {
  id: string;
  conversationName: string;
  sender: string;
  isSelf: boolean;
  timestamp: string;
  rawText: string;
  extractedData?: ExtractedLeadData;
}

interface ExtractedLeadData {
  category: string;
  priceRange?: { min: number; max: number; raw: string; currency: 'VND' };
  areaSqm?: number;
  phoneNumbers: string[];
  address?: string;
  amenities: string[];
  notes?: string[];
  rawContent: string;
}
```

### 6.2 Output

File `.json` với nội dung JSON array. Ví dụ:

```json
[
  {
    "id": "msg_hash_abc123",
    "conversationName": "Nhà trọ Quận 10",
    "sender": "Chị Lan",
    "isSelf": false,
    "timestamp": "14:30",
    "rawText": "Cho thuê phòng trọ 20m2, giá 4tr/th...",
    "extractedData": {
      "category": "Cho thuê phòng / BDS",
      "priceRange": { "min": 4000000, "max": 4000000, "raw": "4tr", "currency": "VND" },
      "areaSqm": 20,
      "phoneNumbers": ["0987654321"],
      "address": "Quận 10",
      "amenities": ["Điều hòa", "Wifi / Internet"],
      "rawContent": "Cho thuê phòng trọ 20m2, giá 4tr/th..."
    }
  }
]
```

### 6.3 Dependencies

| Dependency | Loại | Ghi chú |
|---|---|---|
| `URL.createObjectURL` | Web API | Tạo download link |
| `Blob` | Web API | Wrap JSON content |
| `document.createElement('a')` | DOM API | Trigger download |
| `window.URL.revokeObjectURL` | Web API | Cleanup |

Không cần thêm npm dependencies nào.

---

## §7: Affected Components

### 7.1 Files sẽ thay đổi hoặc tạo mới

```
CÁC FILE SẼ SỬA:
  src/features/message-extraction/ui/SidepanelApp.tsx
  src/features/message-extraction/ui/hooks/useExtractedMessages.ts

CÁC FILE CÓ THỂ SỬA (tùy thiết kế UI):
  src/features/message-extraction/ui/components/FilterBar/FilterBar.tsx
  src/features/message-extraction/ui/lib/constants.ts

CÁC FILE CÓ THỂ TẠO MỚI (nếu tách logic):
  src/features/message-extraction/ui/utils/export-json.ts
```

### 7.2 Functions/APIs liên quan

| Function/API | File | Vai trò |
|---|---|---|
| `useExtractedMessages()` | `hooks/useExtractedMessages.ts` | Cấp data messages |
| `exportJSON(messages)` | (sẽ tạo) | Serialize + download |
| Các `formatVndPrice`, `formatPhoneNumber` | `utils/formatters.ts` | Chỉ dùng cho UI, không dùng cho export |

---

## §8: Evidence

<evidence>
  <file>src/domain/message-extraction/entities/zalo-message.entity.ts</file>
  <line>1-27</line>
  <finding>Interface ZaloMessage (19-27) và ExtractedLeadData (8-17) — đây là cấu trúc dữ liệu đầu vào cho export</finding>
</evidence>

<evidence>
  <file>src/features/message-extraction/ui/hooks/useExtractedMessages.ts</file>
  <line>8-88</line>
  <finding>messages state (line 9) là filtered, allMessages (exposed qua return line 81) là unfiltered. Cả 2 đều có sẵn để export.</finding>
</evidence>

<evidence>
  <file>src/features/message-extraction/ui/SidepanelApp.tsx</file>
  <line>5-42</line>
  <finding>Root component — nơi nhận messages, stats, filter từ hook. Vị trí thích hợp để thêm export button.</finding>
</evidence>

<evidence>
  <file>src/features/message-extraction/ui/components/FilterBar/FilterBar.tsx</file>
  <line>36-66</line>
  <finding>Có sẵn row button "Xóa hết" và search input. Có thể thêm export button vào đây hoặc tạo row riêng.</finding>
</evidence>

<evidence>
  <file>src/features/message-extraction/ui/components/StatsSummary/StatsSummaryBar.tsx</file>
  <line>8-33</line>
  <finding>Stats bar hiện display-only. Có thể thêm export button ở đây hoặc cạnh stats.</finding>
</evidence>

<evidence>
  <file>src/shared/contracts/messages.ts</file>
  <line>10</line>
  <finding>Message name 'zalo.message.extracted' là event từ content script đến sidepanel. Export không cần thay đổi message contract.</finding>
</evidence>

<evidence>
  <file>src/infra/extraction/zalo-dom-observer.ts</file>
  <line>180-188</line>
  <finding>Cấu trúc ZaloMessage được tạo ở đây: id, conversationName, sender, isSelf, timestamp, rawText, extractedData</finding>
</evidence>

---

## §9: Confidence Assessment

**Overall Confidence**: 90%

| Hạng mục | Confidence | Lý do |
|---|---|---|
| Entry point xác định | 95% | `SidepanelApp.tsx` rõ ràng là root component |
| Data structure | 95% | `ZaloMessage` interface đã định nghĩa đầy đủ |
| Data flow | 95% | DOM → Observer → Content script → Sidepanel bridge → React state |
| Export mechanism | 90% | Blob + download link là pattern chuẩn |
| UI placement | 75% | Chưa rõ vị trí tối ưu cho export button — cần decision |
| Export filtered vs all | 60% | Cần user decision (xem Open Questions) |

---

## §10: Open Questions (Cần làm rõ trước khi triển khai)

1. **Export filtered hay all messages?**
   - Option A: Export messages matching filter hiện tại (mặc định)
   - Option B: Export tất cả messages (bất kể filter)
   - Option C: Cho user chọn (dropdown: "Xuất tất cả" / "Xuất kết quả lọc")

2. **Vị trí đặt Export button?**
   - Option A: Trong `FilterBar` — cạnh nút "Xóa hết"
   - Option B: Trong `StatsSummaryBar` — thêm cột Export
   - Option C: Header area — cạnh status indicator
   - Option D: Tạo một `ExportBar` component riêng giữa Stats và Filter

3. **Tên file export?**
   - Đề xuất: `zalo-messages-{conversationName}-{YYYYMMDD-HHmmss}.json`
   - Có conversation name từ status không?

4. **UI feedback?**
   - Toast notification sau khi export?
   - Loading indicator khi export?
   - Chỉ cần browser download dialog là đủ?

5. **Có cần confirm dialog trước export?**
   - Nếu messages rỗng → disable button hoặc show tooltip?
   - Nếu số lượng messages lớn (>1000) → confirm dialog?

6. **Tách logic export thành file riêng?**
   - `src/features/message-extraction/ui/utils/export-json.ts` — chứa `exportJSON(messages, filename)` function
   - Giữ `SidepanelApp.tsx` gọn hơn

---

## §11: Implementation Notes (Gợi ý thiết kế — KHÔNG phải giải pháp fix)

> ⚠️ Mục này CHỈ ghi nhận các quan sát về codebase để hỗ trợ việc triển khai sau.

### Export utility pattern (Web API thuần)

```typescript
// Không cần import thêm — dùng Blob + URL.createObjectURL
function downloadJSON(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

### Data flow đã tồn tại

```
allMessages (unfiltered) — có sẵn từ useExtractedMessages return
messages (filtered) — có sẵn từ useExtractedMessages return
```

Cả 2 đều có sẵn để dùng — KHÔNG cần chỉnh sửa domain hay infra layer.

---

**Document Status**: Context Complete — No Code Changes Made
