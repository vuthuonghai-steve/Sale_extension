---
trigger: glob
description: "Quy chuẩn kiến trúc Cơ sở Dữ liệu IndexedDB (Dexie.js), Schema Indexing, Batch Operations và Lưu trữ tại Data/Database/"
globs: ["Data/Database/**", "utils/data-cleaner/**"]
---

# 🗄️ Rule: IndexedDB Storage & Database Management (`Data/Database/`)

Rule này tự động kích hoạt khi Agent làm việc với module Cơ sở Dữ liệu (`Data/Database/**`), thao tác lưu trữ dữ liệu phòng trọ/CCMN đã chuẩn hóa hoặc mở rộng các truy vấn trong Extension.

---

## 1. Kiến trúc Module Database (`Data/Database/`)

```text
Data/Database/
├── db.ts                            # Khởi tạo FilterDataDB kế thừa từ Dexie
├── repository.ts                    # ListingRepository: CRUD, Batch Insert, Filtering, Stats
├── file-snapshot.ts                 # Hỗ trợ lưu & nạp Snapshot JSON (normalized_data_snapshot.json)
├── index.ts                         # Barrel export công khai cho toàn bộ module Database
├── normalized_data_snapshot.json    # File Snapshot JSON lưu trữ bản ghi dữ liệu sạch
└── cleaning_report.json             # Báo cáo nhật ký làm sạch dữ liệu
```

---

## 2. Quy Tắc Schema & Indexing (Quy mô 50.000 - 80.000 Bản Ghi)

1. **Primary Key & Constraints**:
   - `id`: Khóa chính định danh cho từng phòng trọ.
   - `&fingerprintHash`: Unique Index chống trùng lặp dữ liệu tuyệt đối dựa trên `(Address + RoomType + Price)`.

2. **Single Indexes & Compound Indexes**:
   - Schema định nghĩa: `'id, &fingerprintHash, district, priceVnd, roomType, managerCode, availableDate, [district+priceVnd], [district+roomType]'`
   - **Bắt buộc dùng Compound Index `[district+priceVnd]`** khi thực hiện truy vấn lọc phòng theo Quận và Khoảng Giá để tối ưu tốc độ gấp 10x.

---

## 3. Quy Tắc Hiệu Năng & Batch Operations (Performance Rules)

- ❌ **KHÔNG insert từng dòng riêng lẻ**: Tuyệt đối không dùng `db.listings.put()` trong vòng lặp `for`.
- ✅ **BẮT BUỘC dùng Batch Insert (`bulkPut`)**: Khi nhập lượng lớn dữ liệu (ví dụ 50k - 80k bản ghi), chia nhỏ thành các batch `5.000 bản ghi / lượt transaction` bằng `ListingRepository.saveCleanRecords()`.
- ✅ **Đồng bộSnapshot File**: Sau khi hoàn thành batch import vào IndexedDB, ghi snapshot dữ liệu sạch ra `Data/Database/normalized_data_snapshot.json` để phục vụ xem nhanh hoặc backup/restore offline.

---

## 4. Hướng Dẫn Sử Dụng Trong Code (`ListingRepository`)

```typescript
import { listingRepository } from '@/Data/Database';

// 1. Lưu hàng loạt dữ liệu sạch
await listingRepository.saveCleanRecords(cleanRecords);

// 2. Truy vấn kết hợp có phân trang
const { items, total } = await listingRepository.queryListings({
  district: 'Cầu Giấy',
  minPriceVnd: 5000000,
  maxPriceVnd: 8000000,
  allowPet: true,
  limit: 20,
  offset: 0
});

// 3. Lấy thống kê theo Quận
const stats = await listingRepository.getDistrictStats();
```