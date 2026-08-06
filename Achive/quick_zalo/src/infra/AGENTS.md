# 🤖 AGENTS.md — Quy Chuẩn Hướng Dẫn Kỹ Thuật cho LLM Agent tại `src/infra`

Tài liệu này định hướng hành vi, nguyên tắc kiến trúc và pattern tổ chức mã nguồn dành cho Agent khi làm việc trong thư mục `src/infra` của dự án `quick_zalo`.

---

## 🎯 1. Vai trò Cốt lõi của Tầng `src/infra` (Infrastructure Adapters)

* **Bản chất:** `src/infra` là tầng **Adapters** thực thi các Ports / Interfaces định nghĩa từ tầng `@app`.
* **Ranh giới phụ thuộc:**
  * Thu thập & giao tiếp trực tiếp với môi trường ngoài (Browser APIs, DOM Zalo Web, IndexedDB, LocalStorage, Chrome Extension Runtime).
  * **Cấm:** Không đưa logic nghiệp vụ cốt lõi (Domain Policies, Business Logic) vào tầng `infra`.
  * **Cấm:** `@domain` và `@app` không được import trực tiếp các chi tiết kỹ thuật ở `@infra`.

---

## 📐 2. Nguyên Tắc Phân Tách Module & Pattern Tổ Chức (Anti-Monolith Pattern)

### ❌ Anti-Pattern (Cấm tuyệt đối):
* **Cấm dồn quá nhiều trách nhiệm vào 1 file duy nhất (Monolithic File):** Khi một file (ví dụ `dom-observer`, `logger`, `storage-adapter`) phình to quá ~150-200 dòng hoặc gánh > 2 trách nhiệm, **bắt buộc phải phân giải thành các file độc lập**.

### ✅ Pattern Tiêu Chuẩn (Responsibility-Driven Flat Modularization):
Khi mở rộng hoặc refactor một module trong `src/infra/<sub-domain>`, Agent phải phân tách theo các trách nhiệm chuyên biệt:
1. **`*.const.ts` / `*.selectors.ts`:** Quản lý hằng số, cấu hình tĩnh, CSS selectors, magic numbers.
2. **`*-parser.ts` / `*-formatter.ts`:** Hàm chuyển đổi dữ liệu thô (HTML/DOM/Raw Data) -> Clean Data Object.
3. **`*-filter.ts` / `*-validator.ts`:** Hàm lọc, kiểm tra điều kiện hợp lệ của dữ liệu / DOM nodes.
4. **`*.adapter.ts` / `*.ts` (Orchestrator/Facade):** Class chính đóng vai trò điều phối (gắn kết các helpers trên) và implement interface từ tầng `@app`.

---

## 📁 3. Quy Định Tổ Chức Thư Mục (Flat Directory Layout)

Để giữ cho cấu trúc dự án phẳng, dễ tìm kiếm và tránh rác context window:
* **Hạn chế tối đa tạo thư mục con lồng sâu (Deep Directory Nesting).**
* Mọi file thuộc cùng một sub-domain (như `extraction`, `logging`, `browser`, `config`) nên nằm **trực tiếp trong thư mục sub-domain đó (Level 1 Flat Structure)**.

### Ví dụ Thực Tế Cấu Trúc `src/infra/`:

```txt
src/infra/
├── AGENTS.md                         # (Tài liệu này)
├── browser/                          # Sub-domain Chrome Browser API Adapters
│   ├── runtime-bus.ts
│   ├── shortcut-service.adapter.ts
│   ├── storage.ts
│   └── tabs.ts
├── config/                           # Sub-domain Configuration Adapters
│   ├── config-service.adapter.ts
│   └── static-config.ts
├── extraction/                       # Sub-domain Zalo DOM Extraction
│   ├── zalo-selectors.const.ts       # Hằng số & CSS Selectors
│   ├── zalo-header-parser.ts         # Parser bóc tách Header DOM
│   ├── zalo-element-filter.ts        # Helper lọc DOM Nodes hợp lệ
│   ├── zalo-message-parser.ts        # Parser bóc tách Tin nhắn DOM -> ZaloMessage
│   ├── zalo-dom-observer.ts          # Orchestrator chính
│   └── zalo-dom-observer.test.ts     # Co-located Vitest test
└── logging/                          # Sub-domain Logging System Adapters
    ├── chrome-storage-adapter.ts
    ├── circuit-breaker.ts
    ├── dual-dispatcher.ts
    ├── evlog-logger.ts
    ├── formatters.ts
    └── indexeddb-adapter.ts
```

---

## 🧪 4. Quy Chuẩn Kiểm Thử & Quality Gates khi Chỉnh Sửa `infra`

Mọi thay đổi trong `src/infra` bắt buộc phải vượt qua:
1. **Co-located Unit Tests:** Đặt file test ngay cạnh file implementation (`*.test.ts`). Viết test độc lập cho từng helper parser/filter mà không cần mock rườm rà.
2. **Binary Quality Gates:**
   ```bash
   npm run typecheck
   npm run test
   ```
