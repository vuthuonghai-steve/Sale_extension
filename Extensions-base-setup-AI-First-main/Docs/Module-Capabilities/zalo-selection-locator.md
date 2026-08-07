---
generated_at: "2026-08-07T10:59:30Z"
last_verified: "2026-08-07T10:59:30Z"
status: "ready"
source_skill: "module-docs-generation-skill"
module_type: "functional"
description: "Sub-module chức năng định vị phần tử bong bóng tin nhắn Zalo Web từ thao tác bôi đen và kiểm tra ranh giới kích hoạt sự kiện trích xuất."
---

# Capability Summary: `zalo-selection-locator`

## 1. Overview

Sub-module `zalo-selection-locator` là một **Functional Module (Module Chức năng chạy nền)** hoạt động độc lập trong ma trận kiến trúc 5 tầng Chrome Extension MV3.

- Loại module: functional — Đảm nhận duy nhất vai trò Input & Event Trigger định vị DOM tin nhắn Zalo Web, 0% UI component.
- moduleMeta: KHÔNG TÌM THẤY — chưa đăng ký src/features/registry.ts
- Đăng ký tree_work.md: Thuộc chuỗi pipeline trích xuất tin nhắn Zalo Web.

## 2. Capabilities

| Loại | Symbol | Tệp | Mô tả |
|---|---|---|---|
| entity | IZaloSelectionLocatorInput | src/0_contracts/zalo-selection.contract.ts | Input envelope chứa traceId bắt buộc và timestamp sự kiện |
| entity | IZaloSelectionLocatorResult | src/0_contracts/zalo-selection.contract.ts | Result envelope chứa isValidSelection, targetElement, messageId, selectedText, boundingClientRect và metadata |
| service | ZaloSelectionLocatorModule | src/3_modules/sub-modules/zalo-selection-locator/index.ts | process() validate vị trí bôi đen, bẫy khung nhập liệu và đóng gói stage result LOCATED |
| adapter | ZaloSelectionDOMAdapter | src/2_platform_adapters/zalo/zalo-selection-adapter.ts | captureCurrentSelection(), findClosestMessageElement(), isWithinChatView(), isInputArea(), extractMessageId() |

- Dedup 2 stage: Không có trùng lặp stage giữa locator và extractor.

## 3. Boundaries

| Loại | Tên | Chi tiết |
|---|---|---|
| Event in | mouseup | Sự kiện nhả chuột của người dùng trên DOM Zalo Web |
| Event out | LOCATED Stage Result | Stage Result envelope chứa targetElement và metadata phục vụ pipeline |
| Input file | src/4_presentation/content/zalo-selection-listener.ts | Presentation listener lắng nghe sự kiện mouseup trên Zalo Web document |
| DB table đọc/ghi | none | Sub-module không đọc ghi database trực tiếp |
| Gate | isValidSelection Guard | Bẫy loại trừ bôi đen trong khung soạn thảo input_chat hoặc ngoài chatView |

## 4. Cross-Module Links

- ZaloSelectionLocatorModule → zalo-extract-single-message (Truyền targetElement và traceId sang sub-module trích xuất tin nhắn)

## 5. Infrastructure Mapping

| Adapter | Port | Table | Consumer đang dùng |
|---|---|---|---|
| ZaloSelectionDOMAdapter | IZaloSelectionDOMAdapter | none | ZaloSelectionLocatorModule và ZaloSelectionListener |

- Dual implementation: Không có dual lineage, 1 adapter duy nhất cho Zalo Selection DOM API.

## 6. Docs References

- [scope.2026-08-07.md](../context-to-work/zalo-selection-locator/scope.2026-08-07.md)
- [AGENTS.md](../Trade-offs/AGENTS.md)


## 7. Architecture Pattern Check

| # | Tiêu chí | Kết quả | Bằng chứng |
|---|---|---|---|
| 1 | F1 — Single-Responsibility | OK | Sub-module chỉ đảm nhận định vị DOM selection và bẫy ranh giới, không đọc text hay làm sạch |
| 2 | F2 — Contract rõ INPUT / OUTPUT / HANDLE | OK | Contract định nghĩa tại zalo-selection.contract.ts với Stage Result LOCATED |
| 3 | F3 — Có DEBUG + LOG | OK | Tích hợp LogSink telemetry log trace trong E2E test và error handling envelope |
| 4 | F4 — KHÔNG lẫn UI | OK | Layer 3 100% Pure TypeScript, 0% React component / screen / UI hook |
| 5 | C1 — Không phụ thuộc chéo | OK | Không phát hiện dependency cycle |
| 6 | C2 — Độc lập qua contract | OK | Layer 3 chỉ phụ thuộc interface IZaloSelectionDOMAdapter qua dependency injection |

- Kết luận: ✅ TUÂN THỦ pattern module
