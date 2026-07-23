# 🤖 AGENTS.md — Hướng dẫn Vận hành & Cấu trúc Module Data Cleaner (`utils/data-cleaner`)

Tài liệu này đóng vai trò Hướng dẫn cho LLM Agent khi làm việc, phát triển hoặc mở rộng logic nghiệp vụ bên trong module `utils/data-cleaner`.

---

## 🎯 1. Tổng quan & Mục đích (Overview & Purpose)

Module **Data Cleaner** (`utils/data-cleaner`) có nhiệm vụ nhận dữ liệu thô (`RawRecord[]`) thu thập được từ các nguồn (web scraping, API, user input) và biến đổi thành dữ liệu sạch (`CleanRecord[]`) sẵn sàng cho các công đoạn phân tích dữ liệu downstream.

- **Thiết kế kiến trúc:** Pipeline / Interceptor Pattern.
- **Tính chất hiện tại:** Khung module tĩnh (Scaffold/Skeleton) quản lý luồng điều phối, chưa chứa logic nghiệp vụ cụ thể.
- **Tính mở rộng:** Cho phép đăng ký (register), hủy đăng ký (unregister) hoặc bật/tắt (enable/disable) từng bước làm sạch độc lập.

---

## 🏗️ 2. Cấu trúc Module (Module Structure)

```text
utils/data-cleaner/
├── AGENTS.md               # [Tài liệu này] Guidance dành cho Agent khi làm việc với module
├── types.ts                # Định nghĩa Interface & Data Contract chuẩn (Input, Output, Options, Report)
├── cleaner-manager.ts      # Core Manager điều phối pipeline xử lý dữ liệu thô
├── steps/
│   ├── base-step.ts        # Abstract Base Class cho các bước xử lý trong Pipeline
│   ├── sanitizer-step.ts   # Bước khung: Làm sạch HTML tags, ký tự rác, khoảng trắng
│   ├── normalizer-step.ts  # Bước khung: Chuẩn hóa kiểu dữ liệu, định dạng số/ngày
│   └── filter-step.ts      # Bước khung: Lọc bản ghi rác, null, trùng lặp
└── index.ts                # Barrel export công khai cho toàn bộ module
```

---

## 🧱 3. Các Thành phần Cốt lõi (Core Components & Contracts)

| File / Component | Vai trò & Trách nhiệm |
| :--- | :--- |
| **`types.ts`** | Định nghĩa data contract: `RawRecord`, `CleanRecord`, `CleaningOptions`, `CleaningReport`, `ICleaningStep`. |
| **`cleaner-manager.ts`** | `DataCleanerManager`: Lớp quản lý chính. Chạy dữ liệu qua mảng pipeline `ICleaningStep[]`, tính toán metric hiệu năng và tạo `CleaningReport`. |
| **`steps/base-step.ts`** | `BaseCleaningStep`: Lớp trừu tượng triển khai `ICleaningStep`. Cung cấp phương thức `enable()` / `disable()`. |
| **`steps/sanitizer-step.ts`** | `SanitizerStep`: Đảm nhận công đoạn xóa ký tự thừa, mã độc/HTML tags. |
| **`steps/normalizer-step.ts`** | `NormalizerStep`: Đảm nhận công đoạn ép kiểu, format chuẩn hóa (định dạng ngày tháng, điện thoại, đơn vị). |
| **`steps/filter-step.ts`** | `FilterStep`: Đảm nhận công đoạn lọc loại bỏ bản ghi rác hoặc không hợp lệ. |
| **`index.ts`** | Export duy nhất giúp các module bên ngoài (`entrypoints/`, `background.ts`) import ngắn gọn. |

---

## 🚀 4. Hướng dẫn Mở rộng & Đóng góp Code (Guidelines for Agents)

Khi phát triển thêm logic nghiệp vụ vào module này, Agent **phải tuân thủ**:

1. **Thêm bước xử lý mới (New Cleaning Step):**
   - Tạo file mới trong `steps/` đặt tên dạng `kebab-case-step.ts` (ví dụ: `deduplicate-step.ts`).
   - Kế thừa từ `BaseCleaningStep` trong `steps/base-step.ts`.
   - Ghi đè phương thức `execute(input, options)`.
   - Export step mới trong `index.ts`.

2. **Cập nhật Logic Nghiệp vụ vào Step sẵn có:**
   - Sửa đổi trực tiếp phương thức `execute()` của `SanitizerStep`, `NormalizerStep`, hoặc `FilterStep`.
   - Giữ nguyên signature của phương thức để không gây breaking change.

3. **Cập nhật Data Contract (`types.ts`):**
   - Nếu cần thêm thuộc tính cấu hình mới, thêm vào `CleaningOptions`.
   - Tránh thay đổi cấu trúc `CleaningReport` trừ khi có yêu cầu đặc biệt.

---

## ⚠️ 5. Quy tắc Nghiêm ngặt (Negative Space / Rules)

- ❌ **Không nuốt lỗi (No Silent Catch):** Mọi lỗi trong quá trình thực thi step phải được ghi nhận vào `CleaningReport.errors` hoặc throw nếu ở chế độ `strictMode`.
- ❌ **Không gán trực tiếp type `any`:** Luôn sử dụng generics hoặc kiểu dữ liệu đã khai báo trong `types.ts`.
- ❌ **Không tạo side-effect:** Mỗi step phải là pure function hoặc idempotent transform trên mảng dữ liệu đầu vào.
- ✅ **Luôn chạy kiểm chứng:** Sau khi thay đổi code trong module này, bắt buộc phải chạy `npm run compile` để đảm bảo không vi phạm kiểu TypeScript.
