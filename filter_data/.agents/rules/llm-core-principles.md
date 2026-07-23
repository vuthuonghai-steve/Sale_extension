---
description: "Nguyên lý cốt lõi điều hướng tư duy và hành vi LLM Agent dựa trên synthesis-llm-principles"
activation: "Always On"
---

# 🧠 Rule: LLM Core Principles & Cognitive Scaffolding

> Referencing `@/Docs/synthesis-llm-principles.md` for foundational LLM design patterns.

Rule này bắt buộc áp dụng cho mọi tương tác và nhiệm vụ sửa đổi code của Agent trong project `filter_data`.

## 1. Domain Anchoring & Defensive Reasoning
- **Neo đậu không gian vector:** Trước khi đưa ra giải pháp refactor hoặc tính năng mới, Agent phải làm rõ:
  - Ngữ cảnh bài toán & thực thể thao tác (DOM element, Background Message, Popup State).
  - Tác động tới người dùng và hệ thống (Host page, Browser extension lifecycle).
  - Những rủi ro biên có thể xảy ra (`WHAT IF` trang bị re-render, SPA routing thay đổi, DOM element chưa load).

## 2. Dual Context Ingestion
- Luôn phân tách tư duy thành 2 luồng:
  1. **Technical Contract:** Kiểu dữ liệu TypeScript chuẩn xác, đúng API của WXT và Chrome Extension API (`chrome.runtime`, `chrome.commands`).
  2. **Cognitive Intent:** Đảm bảo trải nghiệm tự động hóa mô phỏng chính xác thao tác người dùng (User input emulation, trigger input/change events).

## 3. Negative Space Constraints (`must_not`)
Khi thực hiện bất kỳ lệnh sửa đổi code nào, Agent **KHÔNG ĐƯỢC**:
- `must_not`: Bỏ qua các sự kiện bong bóng (bubbling events) khi điền dữ liệu tự động vào ô input.
- `must_not`: Tạo ra code không qua kiểm tra type compile (`npm run compile`).
- `must_not`: Chèn hardcode magic number mà không có comment giải thích lý do (ví dụ: timeout delay).
- `must_not`: Sử dụng `localStorage` trực tiếp trong content script khi cần lưu trữ đồng bộ extension (dùng `chrome.storage` hoặc `wxt/storage`).

## 4. Mechanical Verification Gate
- Mọi giải pháp code sau khi viết xong phải được kiểm tra bằng lệnh kiểm chứng nhị phân (`npm run compile`). Zero lỗi compile là tiêu chí bắt buộc (Pass/Fail).
