# Bản Thiết kế Kiến trúc: Tính năng Chuẩn hóa Dữ liệu (Data Normalization & Storage)

**Date**: 2026-07-28  
**Feature**: `data-normalization-storage`  
**Status**: Draft Architecture Spec  

---

## 🧭 1. Tổng quan Luồng Xử lý Dữ liệu (Data Pipeline Architecture)

Module Chuẩn hóa Dữ liệu chịu trách nhiệm tiếp nhận dữ liệu thô `data_raw` từ file JSON đầu vào, thực hiện lọc trùng lặp 2 cấp, lưu trữ bền vững vào IndexedDB qua Dexie.js, bóc tách các trường dữ liệu có cấu trúc và hiển thị giao diện Dual View (Chuẩn hóa + Raw) để hỗ trợ debug/testing.

```mermaid
flowchart TD
    subgraph Step1 ["Bước 1: Nạp & Lưu trữ Dữ liệu + Lọc trùng 2 Cấp"]
        A[File JSON Input: { messages: [{id, data_raw}] }] --> B[Stage 1: Self-Deduplication in File]
        B -->|Hash data_raw & Filter| C[Danh sách bản ghi không trùng trong file]
        C --> D[Stage 2: Database Deduplication]
        D -->|Query Index Dexie IndexedDB| E[Bản ghi mới hoàn toàn]
        E --> F[Bulk Insert vào IndexedDB Store]
    end

    subgraph Step2 ["Bước 2: Chuẩn hóa & Bảo tồn Raw Data"]
        F --> G[DataNormalizationEngine]
        G --> H[Extract Fields: Code, Address, Price, RoomType, Elevator, Services...]
        G --> I[Gắn kèm nguyên vẹn field data_raw gốc]
        H & I --> J[Entity NormalizedMessage HOÀN CHỈNH]
    end

    subgraph Step3 ["Bước 3: Giao diện UI Dual-View Debug"]
        J --> K[DataNormalizationScreen UI]
        K --> L[View 1: Thẻ thông tin chuẩn hóa Badges]
        K --> M[View 2: Khung xem data_raw thô Collapsible]
    end
```

---

## 🏗️ 2. Quy trình Chi tiết Từng bước (Step-by-Step Architecture Map)

### 📌 Bước 1: Lưu trữ Dữ liệu & Cơ chế Lọc trùng 2 Cấp

#### 1.1 Loại Đầu vào Duy nhất (Input JSON Specification)
System chỉ nhận file JSON với mảng đối tượng tiêu chuẩn:
```json
{
  "messages": [
    {
      "id": "message-frame_1785144101162",
      "data_raw": "Mã: A82\n\n🏠 Địa chỉ: Ngõ 46 Nhân Hoà - Thanh Xuân\n..."
    }
  ]
}
```

#### 1.2 Thuật toán Lọc trùng 2 Cấp (2-Stage Deduplication Engine)
1. **Lọc trùng Cấp 1 (File Input Self-Deduplication)**:
   - Dùng hàm `generateContentHash(data_raw)` (tạo md5/sha256 hoặc chuỗi hash chuẩn hóa bỏ qua khoảng trắng thừa/dấu xuống dòng).
   - Duyệt file JSON qua `Set<string>`, nếu `hash` đã tồn tại trong mảng file -> Tăng counter `dupesInFile` & Skip.
2. **Lọc trùng Cấp 2 (Database Deduplication)**:
   - Dùng `IMessageRepository.findExistingHashes(hashes: string[])` batch query vào Dexie IndexedDB qua index `&contentHash`.
   - Lọc bỏ các item đã có hash trong IndexedDB -> Tăng counter `dupesInDb` & Skip.
3. **Lưu trữ Bền vững (Storage Persistence)**:
   - Batch insert toàn bộ item vượt qua 2 cấp lọc vào IndexedDB.

---

### 📌 Bước 2: Bóc tách Trường Dữ liệu & Bảo tồn `data_raw`

#### 2.1 Cấu trúc Đích của Entity (`NormalizedMessage`)
Tất cả bản ghi sau khi nạp đều được lưu trữ theo cấu trúc chuẩn:

```typescript
export interface NormalizedMessage {
  // --- Định danh & Metadata gốc ---
  id: string;                         // ID gốc từ message frame
  contentHash: string;                // Hash duy nhất phục vụ lọc trùng
  data_raw: string;                   // BẢO TỒN NGUYÊN VÊN NỘI DUNG THÔ BAN ĐẦU
  createdAt: string;                  // Thời gian nạp dữ liệu (ISO)

  // --- Các trường dữ liệu bóc tách (Structured Fields) ---
  code: string | null;                // Mã căn hộ (VD: "A82")
  address: string | null;             // Địa chỉ (VD: "Ngõ 46 Nhân Hoà - Thanh Xuân")
  district: string | null;            // Quận/Huyện (VD: "Thanh Xuân")
  availableRooms: string | null;      // Phòng trống (VD: "P802")
  priceRaw: string | null;            // Giá chuỗi (VD: "4tr7")
  priceNumeric: number | null;        // Giá định dạng số (VD: 4700000)
  roomType: string | null;            // Loại phòng (VD: "Studio", "Gác Xép", "1N1B")
  hasElevator: boolean;               // Có thang máy hay không
  furniture: string | null;           // Nội thất (VD: "Full nội thất")
  services: {
    electricity?: string;             // Điện
    water?: string;                   // Nước
    management?: string;              // Phí dịch vụ chung / Thang máy / Vệ sinh
    washingMachine?: string;          // Phí máy giặt
  };
  notes: string[];                    // Các lưu ý & quy định riêng
}
```

#### 2.2 Quy tắc Trích xuất Trường (Parsing Rules)
- **Mã BĐS (`code`)**: Regex tìm pattern `Mã:\s*([A-Za-z0-9_-]+)`.
- **Địa chỉ (`address`)**: Tìm sau icon `🏠 Địa chỉ:` hoặc nhãn `Địa chỉ:`.
- **Giá (`priceRaw` & `priceNumeric`)**: Parse `💰 Giá:` -> trích xuất "4tr7" -> convert sang `4700000`.
- **Loại phòng & Thang máy**: Trích từ section `👉Phòng:` & `👉Thang Máy`.
- **Dịch vụ (`services`)**: Parse block `✅ Dịch vụ:` tách riêng giá điện, nước, máy giặt.

---

### 📌 Bước 3: Giao diện Dual View (UI Chuẩn hóa & Debug Raw Data)

Giao diện UI React tại Sidepanel hỗ trợ 2 chế độ hiển thị song song:

1. **Chế độ Thẻ Chuẩn hóa (Normalized Card View)**:
   - Hiển thị trực quan dưới dạng thẻ thông tin bất động sản chuyên nghiệp (Mã nổi bật, Giá định dạng tiền VNĐ, Badge Quận/Huyện, Icon Thang máy/Nội thất).
2. **Chế độ Trình tra cứu Raw Data (`data_raw` Debug Inspector)**:
   - Mỗi thẻ có nút bấm `[📄 Xem data_raw thô]`.
   - Khi click sẽ mở rộng (expand) khung hiển thị văn bản gốc `data_raw` với font monospace, highlight các đoạn text match tương ứng để dev/tester kiểm tra tính chính xác của bộ parser.
3. **Thống kê Import (Metrics Bar)**:
   - Tổng số bản ghi trong file.
   - Số bản ghi trùng nội bộ file (Dup in File).
   - Số bản ghi trùng với Database (Dup in DB).
   - Số bản ghi mới được nạp & chuẩn hóa thành công.

---

## 🏛️ 3. Phân bổ File theo Clean Architecture

```txt
src/
├── domain/data-normalization/
│   ├── entities/normalized-message.entity.ts
│   ├── services/normalization.service.ts
│   ├── services/normalization.service.test.ts
│   ├── services/deduplication.service.ts
│   └── services/deduplication.service.test.ts
├── app/ports/
│   └── message-repository.port.ts
├── infra/storage/
│   ├── dexie-database.ts
│   ├── dexie-message-repository.adapter.ts
│   ├── dexie-message-repository.adapter.test.ts
│   └── index.ts
├── features/data-normalization/
│   ├── hooks/useDataNormalization.ts
│   ├── ui/DataNormalizationScreen.tsx
│   ├── ui/components/NormalizedCard.tsx
│   ├── ui/components/JsonUploader.tsx
│   └── ui/components/ImportMetricsSummary.tsx
└── composition/
    └── sidepanel-container.ts  (Wire Storage Adapter & Services)
```
