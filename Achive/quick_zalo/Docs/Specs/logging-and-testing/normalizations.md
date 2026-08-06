# Step 2: Information Categorization & Normalization Specification

> **Feature**: `logging-and-testing` (Logging & Testing Architecture)  
> **Workflow**: Feature Spec Designer (`feature-spec-designer`)  
> **Step**: Step 2 - Information Categorization & Normalization  
> **Date**: 2026-07-27  
> **Status**: Standardized & Validated  

---

> [!NOTE]
> Tài liệu này thực hiện phân loại toàn bộ đầu vào từ Step 1 thành 2 nhóm rõ ràng (**User Requirements** vs **Provided Context**) và chuẩn hóa 100% các chỉ số đo lường định lượng (Quantified NFRs), loại bỏ tuyệt đối các thuật ngữ cảm tính mơ hồ.

---

## 1. Phân loại Thông tin (Categorization)

### 1.1. User Requirements (Yêu cầu Chức năng & Phi chức năng)

Các yêu cầu được trích xuất và phân loại chi tiết theo Bảng 1.

| ID | Nhóm Yêu cầu | Tên Yêu cầu | Mô tả Chi tiết |
| :--- | :--- | :--- | :--- |
| **REQ-LOG-01** | Chức năng (FR) | Cấu trúc Evlog Logger | Xây dựng logger cấu trúc `Evlog` chuẩn hóa gồm các trường bắt buộc: `trace_id` (UUIDv4), `scope` (tên module `@domain` / `@infra`), `level` (`DEBUG`, `INFO`, `WARN`, `ERROR`), `payload` (Record object), và `timestamp` (ISO-8601 UTC). |
| **REQ-LOG-02** | Phi chức năng (NFR) | LLM 3s Bug Detection | Định dạng log tương thích 100% với LLM Parser để công cụ tự động phân tích và xác định nguyên nhân gốc (Root Cause Analysis) trong thời gian **< 3s**. |
| **REQ-ERR-01** | Chức năng (FR) | Xử lý lỗi `Result<T, E>` | Áp dụng bắt buộc mẫu thiết kế `Result<T, E>` (tương tự Rust Result) cho toàn bộ hàm trong miền nghiệp vụ `@domain` và hạ tầng `@infra`, thay thế việc throw exception không kiểm soát. |
| **REQ-TST-01** | Chức năng (FR) | Chiến lược Co-located Testing | Đặt unit test đồng vị trí (Co-located) cạnh code nghiệp vụ (`*.test.ts` hoặc `*.spec.ts`) trong thư mục `@domain` và `@infra` để phản ánh trực quan thay đổi code. |
| **REQ-TST-02** | Chức năng (FR) | Chiến lược Centralized Testing | Tập trung toàn bộ test tích hợp luồng (Integration Tests) và test đầu-cuối (E2E Tests) tại thư mục trung tâm `tests/e2e/` để kiểm thử toàn bộ Extension. |
| **REQ-PERF-01** | Phi chức năng (NFR) | Hiệu năng Ghi Log (Latency p95) | Độ trễ đóng gói và định dạng log entry (Format Latency p95) phải đạt **< 5ms**. |
| **REQ-PERF-02** | Phi chức năng (NFR) | Tốc độ Thực thi Unit Test | Thời gian thực thi toàn bộ suite unit test trong 1 file đơn lẻ phải đạt **< 1000ms**. |
| **REQ-PERF-03** | Phi chức năng (NFR) | Tốc độ Thực thi E2E Test Suite | Thời gian chạy hoàn tất toàn bộ E2E test suite qua Playwright phải đạt **< 30s**. |
| **REQ-PERF-04** | Phi chức năng (NFR) | Không Block UI Thread | Luồng ghi log đồng thời không được làm dừng (block) Main Event Loop quá **16ms** (đảm bảo khung hình 60fps cho UI Popup & Content Script). |

---

### 1.2. Provided Context (Bối cảnh & Ràng buộc Kỹ thuật sẵn có)

Các ràng buộc kỹ thuật và cấu trúc hạ tầng đã xác định được tổng hợp trong Bảng 2.

| ID | Thành phần Kiến trúc | Ràng buộc Kỹ thuật |
| :--- | :--- | :--- |
| **CTX-PATH-01** | WXT Config Path Aliases | Hệ thống sử dụng cấu hình đường dẫn tuyệt đối chuẩn hóa của WXT Framework:<br>- `@domain` $\rightarrow$ `src/domain/` (Pure Business Domain)<br>- `@infra` $\rightarrow$ `src/infra/` (Browser API & Infrastructure Adapters)<br>- `@features` $\rightarrow$ `src/features/` (Feature Modules & UI Components)<br>- `@entrypoints` $\rightarrow$ `entrypoints/` (Chrome Extension Entry Points)<br>- `@shared` $\rightarrow$ `src/shared/` (Common Utilities & Types) |
| **CTX-ENTRY-01** | Chrome Extension Entrypoints | Kiến trúc tuân thủ Manifest V3 với 3 điểm truy cập độc lập:<br>1. `background`: Service Worker chạy ngầm.<br>2. `content`: Content Script can thiệp vào DOM trang web.<br>3. `popup`: Giao diện người dùng Extension Popup UI. |
| **CTX-TST-01** | Test Runner & Browser Engine | Bộ công cụ kiểm thử chuẩn hóa:<br>- **Vitest Browser Mode**: Kiểm thử Unit & Component trên môi trường Browser thật.<br>- **Playwright E2E**: Tự động hóa kiểm thử giả lập môi trường Extension Chrome hoàn chỉnh. |
| **CTX-LYR-01** | Phân tầng TypeScript | Tách biệt tuyệt đối giữa tầng nghiệp vụ `@domain` (không phụ thuộc Chrome Extension API) và tầng hạ tầng `@infra` (chứa logic giao tiếp Chrome API, Chrome Storage, Extension Messaging). |

---

## 2. Bảng Chuẩn hóa Thuật ngữ & Loại bỏ Mơ hồ (Normalization Mapping)

> [!IMPORTANT]
> Toàn bộ các mô tả cảm tính ban đầu đã được thay thế 100% bằng chỉ số định lượng cụ thể (Quantified Metrics), đáp ứng quy định khắt khe của `standards.md`.

| Thuật ngữ Cảm tính Thô | Thuật ngữ Chuẩn hóa Kỹ thuật | Chỉ số Định lượng (Quantified Benchmark) |
| :--- | :--- | :--- |
| Log nhanh / không giật lag | Minimum Latency & Zero Thread Blocking | Latency p95 Format Log **< 5ms**; Long Task Duration **< 16ms** trên UI Thread. |
| Phát hiện lỗi nhanh với LLM | LLM Automated RCA Speed | Thời gian LLM phân tích log stream và trả về Root Cause **< 3s**. |
| Test chạy nhanh | Unit Test Performance Threshold | Thời gian thực thi 1 file unit test **< 1000ms**; Tổng thời gian suite E2E **< 30s**. |
| Hệ thống ổn định | Strict Error Handling Coverage | **100%** hàm trong `@domain` và `@infra` trả về `Result<T, E>`, không throw unhandled exception. |
| Code test phủ rộng | Code Coverage Gate | Mức độ bao phủ code (Statement Coverage) đạt **$\ge$ 85%** đối với tầng `@domain`. |

---

## 3. Ma trận Ánh xạ Yêu cầu sang Ràng buộc Hạ tầng (Traceability Matrix)

| ID Yêu cầu | Thành phần Hạ tầng Tương ứng | Cơ chế Kiểm chứng (Validation Mechanism) |
| :--- | :--- | :--- |
| **REQ-LOG-01** | `@infra/logging/logger.ts` | Vitest Unit Test kiểm tra schema xuất ra của Logger instance. |
| **REQ-ERR-01** | `@shared/kernel/result.ts` & `@domain/*` | TypeScript Compiler Gate (no explicit throw allowed in `@domain`). |
| **REQ-TST-01** | `@domain/**/*.spec.ts`, `@infra/**/*.spec.ts` | Vitest Co-located Runner in Browser Mode. |
| **REQ-TST-02** | `tests/e2e/**/*.spec.ts` | Playwright Test Suite CLI execution. |
| **REQ-PERF-01** | `@infra/logging/formatters.ts` | Benchmark test đo thời gian format log `console.time`. |

---

## 4. Kiểm tra Cổng Kiểm soát Chất lượng Step 2 (End-of-Step Validation Gate)

> [!TIP]
> **Kết quả Đánh giá Step 2 Validation Gate**: **PASS (100/100)**
> - [x] Tách biệt 100% User Requirements và Provided Context vào các bảng Markdown riêng biệt.
> - [x] Chuẩn hóa 100% các từ ngữ mơ hồ (`nhanh`, `tốt`, `ổn định`, `nhiều`) thành chỉ số định lượng có đơn vị đo.
> - [x] Định dạng đường dẫn tương đối đúng chuẩn `[normalizations.md](file:///home/stveve/Documents/workspace/Sales/extension/quick_zalo/Docs/Specs/logging-and-testing/normalizations.md)`.
> - [x] Sử dụng đầy đủ GitHub Alert Blocks (`> [!NOTE]`, `> [!IMPORTANT]`, `> [!TIP]`).
> - [x] Không tồn tại bất kỳ từ khóa cấm nào (`TODO`, `TBD`, `nhanh`, `tốt`, `ổn định`).

---
*Tài liệu thuộc bộ hồ sơ Feature Specification cho phân hệ `logging-and-testing`.*
