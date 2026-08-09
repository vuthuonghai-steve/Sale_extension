---
trigger: glob
description: 'Quy tắc kiểm thử Zalo E2E thực tế trên trình duyệt Chrome MV3: Chống Mock Illusion, kết nối CDP qua cổng 9222 với .user-data, xác minh cơ học Content Script injection và DOM Zalo thật'
globs: ['tests/e2e/**', 'src/4_presentation/content/**', 'src/2_platform_adapters/zalo/**']
---

# 🤖 Rule: Zalo E2E Testing & Empirical Verification Protocol

> **Nguồn sự thật:** `tests/e2e/README.md` và `tests/e2e/fixtures/extension.fixture.ts`. Tham chiếu `Docs/Trade-offs/AGENTS.md` (§1.4 Binary Quality Gates, §2 Zero-Artifact Lean Execution).

Rule này bắt buộc áp dụng cho MỌI phiên kiểm thử và phát triển tính năng liên quan đến **Zalo Web Extension (MV3)**. Mọi kết luận nghiệm thu phải dựa trên bằng chứng thực nghiệm nhị phân (Pass/Fail cơ học trên trình duyệt thật), tuyệt đối cấm báo cáo dựa trên giả lập ảo.

---

## 1. Nguyên tắc Chống "Mock Illusion" (False Positive Prevention)

1. **CẤM `page.addScriptTag()` trong E2E:** Không bao giờ tự chèn script bằng tay trong kịch bản kiểm thử. Script PHẢI được Chrome MV3 tự động nạp thông qua `"content_scripts"` được khai báo trong `manifest.json` sau khi biên dịch (`npm run build`).
2. **CẤM "Synthetic Mock HTML":** Không tự chế tạo chuỗi HTML giả với cấu trúc class tự đặt để tự kiểm thử code của chính mình. Phải kiểm thử trên trang `https://chat.zalo.me` thật hoặc DOM kế thừa từ cấu trúc thực tế đã được kiểm chứng.
3. **CẤM báo cáo cảm tính:** Mọi báo cáo phải đi kèm bằng chứng xác thực: trạng thái nạp `manifest.json`, kết nối CDP, DOM selector tìm thấy, và Toast phản hồi trong Shadow DOM.

---

## 2. Quy chuẩn Kết nối CDP (Chrome DevTools Protocol - Cổng 9222)

1. **Luôn ưu tiên tái sử dụng phiên Chrome Dev (`connectOverCDP`):**
   * Khi WXT Dev Server (`pnpm run dev`) hoặc Chrome đang chạy với profile `.user-data` tại cổng `http://localhost:9222`, Playwright phải kết nối trực tiếp vào phiên này.
   * **Lợi ích:** Tránh tranh chấp file lock `SingletonLock` của `.user-data`, giữ nguyên phiên đăng nhập Zalo thật của người dùng và kết nối tức thì (<100ms).
2. **Bắt buộc dùng `extensionTest` Fixture:**
   * Mọi bài test E2E phải import `extensionTest` từ `tests/e2e/fixtures/extension.fixture.ts`.
   * **CẤM** tự ý gọi trực tiếp `chromium.launchPersistentContext` rời rạc trong từng test file gây nghẽn tiến trình và xung đột profile.

---

## 3. Checklist Xác minh Cơ học trước khi Kết luận Hoàn tất

Trước khi báo cáo hoàn thành bất kỳ tính năng Content Script / E2E nào, Agent bắt buộc phải kiểm tra qua 4 cổng nhị phân:

- [ ] **Gate 1 (Build Output):** `npm run build` thành công, kiểm tra `.output/chrome-mv3/manifest.json` có trường `"content_scripts"` khớp URL `https://*.zalo.me/*` và `https://chat.zalo.me/*`.
- [ ] **Gate 2 (Script Injection):** Mở tab Zalo Web, kiểm tra `window.__zalo_qa_orchestrator__` đã tồn tại trên context của trang.
- [ ] **Gate 3 (Shadow DOM Isolation):** Thẻ `#zalo-quick-action-root` được gắn vào DOM và có Shadow Root đính kèm.
- [ ] **Gate 4 (User Interaction & Clipboard):** Thao tác bôi đen hoặc bấm `Alt + Q` kích hoạt thành công `IClipboardAdapter.writeText()` và hiển thị Toast `"✅ Đã copy đoạn tin nhắn sạch!"`.