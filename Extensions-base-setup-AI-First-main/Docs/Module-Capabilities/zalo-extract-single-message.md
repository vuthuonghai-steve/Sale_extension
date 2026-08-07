---
generated_at: "2026-08-07T03:14:00Z"
last_verified: "2026-08-07T03:14:00Z"
status: "ready"
source_skill: "module-docs-generation-skill"
module_type: "functional"
description: "Sub-module chức năng trích xuất 1 tin nhắn đơn nguyên vẹn từ DOM Zalo Web và đóng gói Stage Result JSON Envelope."
---

# Capability Summary: `zalo-extract-single-message`

## 1. Tổng quan Sub-Module

Sub-module `zalo-extract-single-message` là một **Functional Module (Module Chức năng chạy nền)** hoạt động độc lập trong ma trận kiến trúc 5 tầng Chrome Extension MV3. 

### Nguyên tắc Đơn nhiệm (Single Responsibility Principle):
Module đảm nhận duy nhất một vai trò chuyên biệt:
- Nhận phần tử Target Message Element trên DOM Zalo Web.
- Trích xuất văn bản tin nhắn đầy đủ định dạng nguyên vẹn (bảo tồn nguyên vẹn dấu xuống dòng `\n` và 100% dãy Unicode Emoji Surrogate Pairs như `🍾`, `🏢`, `📍`, `🏆`, `🚗`).
- Đóng gói đầu ra dưới dạng Standard Stage JSON Envelope (`stage: "EXTRACTED"`) để cung cấp dữ liệu sạch cho các sub-module downstream trong pipeline.

### Ranh giới Tách biệt:
- **KHÔNG định vị selection bôi đen hay trích xuất hàng loạt**: Nhiệm vụ này do 2 sub-module bổ trợ đầu vào đảm nhiệm (`zalo-selection-locator` và `zalo-bulk-extractor`).
- **KHÔNG làm sạch rác văn bản**: Nhiệm vụ loại bỏ nhãn UI ("Xem thêm"), nén khoảng trắng hay lọc rác thuộc về sub-module `text-sanitizer` downstream.

---

## 2. Vùng Phụ trách & Cấu trúc File

Sub-module tuân thủ nghiêm ngặt ranh giới phụ thuộc 5 tầng của Chrome Extension MV3 và quy chuẩn đặt file sub-module (`src/3_modules/sub-modules/{module-name}/index.ts`):

| Tầng Kiến trúc | Đường dẫn File Target | Vai trò / Trách nhiệm |
|---|---|---|
| **Layer 0: Contracts** | `src/0_contracts/zalo-extract.contract.ts` | Định nghĩa giao diện TypeScript: `IZaloMessageExtractInput`, `IZaloMessageExtractOutput`, `IZaloDOMAdapter`, `IZaloRawExtractResult`. |
| **Layer 0: Contracts** | `src/0_contracts/ipc-actions.ts` | Khai báo IPC Action enum `IpcAction.ZaloExtractSingleMessage`. |
| **Layer 0: Contracts** | `src/0_contracts/ipc-payloads.ts` | Khai báo `ZaloExtractSingleMessageRequest` (kèm `traceId` bắt buộc) và `ZaloExtractSingleMessageResponseData`. |
| **Layer 2: Platform Adapters** | `src/2_platform_adapters/zalo/zalo-dom-adapter.ts` | Triển khai class `ZaloWebDOMAdapter` cách ly 100% thao tác truy vấn DOM trên Zalo Web trong Isolated World. |
| **Layer 3: Core Business Modules** | `src/3_modules/sub-modules/zalo-extract-single-message/index.ts` | Triển khai class pure TypeScript `ZaloExtractSingleMessageModule` (0% chrome/document/window), điều phối adapter và đóng gói JSON Stage Envelope. |

---

## 3. Hợp đồng Dữ liệu Input / Output / Processing

### 3.1 Input Contract (`IZaloMessageExtractInput`)
- `traceId`: string (bắt buộc theo OBS-2 / G1-07).
- `targetElement`: Element | null (Phần tử DOM bong bóng tin nhắn).
- `messageId`: string (tùy chọn ID tin nhắn).

### 3.2 Output Contract (`IZaloMessageExtractOutput`)
Đóng gói theo chuẩn **Standard Pipeline Stage Envelope (`stage: "EXTRACTED"`)**:

```json
{
  "stage": "EXTRACTED",
  "success": true,
  "timestamp": 1754524800000,
  "traceId": "tr-zalo-123456",
  "data": {
    "messageId": "msg-999",
    "extractedText": "Căn hộ 2PN 15tr/tháng\nLiên hệ: 0901234567 🍾🏢📍"
  },
  "metadata": {
    "source": "zalo-web-dom-adapter",
    "containerClass": "msg-item msg-text-bubble",
    "textLength": 45,
    "hasEmoji": true,
    "hasNewline": true
  },
  "error": null
}
```

---

## 4. Ma trận Ranh giới Kiến trúc & Pattern Check

| Tiêu chí | Mô tả Quy chuẩn | Trạng thái | Bằng chứng Triển khai |
|---|---|---|---|
| **F1: Isolation Boundary** | Layer 3 (`3_modules`) không import trực tiếp từ `2_platform_adapters` hay `1_engine`. | **OK** | `ZaloExtractSingleMessageModule` chỉ import interfaces `IZaloDOMAdapter` từ `0_contracts`. |
| **F2: Pure TypeScript** | Layer 3 không phụ thuộc `chrome.*`, `document`, `window`. | **OK** | Module thuần TS, nhận DOM access thông qua `IZaloDOMAdapter` dependency injection. |
| **F3: Traceability** | Mọi request mang `traceId` bắt buộc ở type-level. | **OK** | Khóa bởi `IZaloMessageExtractInput.traceId` và unit test `ipc-payload-shape.spec.ts`. |
| **F4: Test Coverage** | 100% logic core test được độc lập bằng Vitest không cần browser. | **OK** | Test qua `MockZaloDOMAdapter` trong `tests/unit/3_modules/zalo-extract-single-message.spec.ts`. |
| **C1: Contract Lock** | Toàn bộ type/schema định nghĩa tại Layer 0 `0_contracts`. | **OK** | `zalo-extract.contract.ts` đặt tại `src/0_contracts/`. |
| **C2: Envelope Consistency** | Output tuân thủ giao diện `IStageResult<TStage, TData, TMetadata>`. | **OK** | Đồng nhất cấu trúc stage `EXTRACTED` với các sub-module downstream. |

---

## 5. Khả năng Ghép nối & Chuỗi Pipeline

Sub-module `zalo-extract-single-message` đóng vai trò một node trích xuất dữ liệu đầu vào trong chuỗi xử lý:

```txt
┌───────────────────────────┐
│  zalo-selection-locator   │ (Định vị tin nhắn từ bôi đen)
└─────────────┬─────────────┘
              │ targetElement
              ▼
┌───────────────────────────┐
│zalo-extract-single-message│ (Module hiện tại - Stage: EXTRACTED)
└─────────────┬─────────────┘
              │ extractedText
              ▼
┌───────────────────────────┐
│      text-sanitizer       │ (Làm sạch rác, nén space, loại "Xem thêm")
└─────────────┬─────────────┘
              │ normalizedText
              ▼
┌───────────────────────────┐
│    ai-assistant-module    │ (Phân tích bóc tách ngữ cảnh BĐS / CSKH)
└───────────────────────────┘
```

---

## 6. Chiến lược Kiểm thử & Bằng chứng

### Test Suite: `tests/unit/3_modules/zalo-extract-single-message.spec.ts`
Kiểm thử nhị phân thành công với Vitest:
1. `trả về lỗi INVALID_PAYLOAD khi targetElement bị thiếu`: PASS
2. `trả về lỗi NOT_FOUND khi adapter không trích xuất được text`: PASS
3. `trích xuất thành công tin nhắn chứa \n và emoji Unicode`: PASS
4. `helper extractSingleMessage hoạt động tương tự class`: PASS

### Bằng chứng Chạy Test Cơ học:
- **Total Test Files**: 25 passed (25)
- **Total Unit Tests**: 155 passed (155)
- **Typecheck**: `tsc --noEmit` clean 100%.

---

## 7. Báo cáo Pattern Deviation Check

| Mã Tiêu chí | Tên Kiểm tra Pattern | Trạng thái | Ghi chú & Bằng chứng |
|---|---|---|---|
| **F1** | Domain / Layer Isolation | PASS | Không phát hiện forbidden import. Hook G1-06 verify sạch. |
| **F2** | Pure TS in Modules | PASS | Layer 3 100% Pure TS trong `src/3_modules/sub-modules/zalo-extract-single-message/index.ts`. |
| **F3** | Mandatory Trace ID | PASS | `traceId` bắt buộc trong contract input. |
| **F4** | Unit Testable | PASS | 4 unit tests pass 100%. |
| **C1** | Contract Single Source | PASS | Contract tập trung tại Layer 0. |
| **C2** | Pipeline Stage Envelope | PASS | Trả về Stage Result `EXTRACTED` đồng nhất. |
