# 🤖 AGENTS.md — Bản đồ Điều phối & Rules cho LLM Agent tại `filter_data`

File này đóng vai trò **Single Source of Truth for Routing** (Bản đồ Điều phối Duy nhất) cho các Agent hoạt động trong repository `filter_data` (WXT Chrome MV3 Extension). 

Tài liệu áp dụng nguyên lý vận hành LLM tại `@/Docs/synthesis-llm-principles.md` và cơ chế **Tách nhỏ Context & Load theo Yêu cầu (On-Demand Context Ingestion)**.

---

## 🗺️ 1. Bản đồ Điều phối Rule (Routing Index)

Agent phải tham chiếu bản đồ dưới đây để xác định rule hoặc tài liệu nào cần đọc dựa trên tác vụ hiện tại, tránh làm rác context window:

| Tác vụ / Ngữ cảnh | Rule / Tài liệu cần tham chiếu | Cơ chế Kích định (Activation Mode) |
|:---|:---|:---|
| **Nguyên lý tư duy & Hành vi chung** | `@.agents/rules/llm-core-principles.md`<br>`@Docs/synthesis-llm-principles.md` | `Always On` |
| **Chiến lược Quản lý Context & Routing** | `@.agents/rules/context-routing-and-modularity.md` | `Always On` |
| **Cổng Kiểm soát Chất lượng & Build Gate** | `@.agents/rules/code-quality-and-gates.md` | `Always On` |
| **Cú pháp TypeScript, Tech Stack & Naming** | `@.agents/rules/tech-stack-and-conventions.md` | `Glob` (`*.ts`, `package.json`, `wxt.config.ts`) |
| **Kiến trúc Extension & Luồng Dữ liệu** | `@.agents/rules/architecture-and-flow.md`<br>`@.agents/rules/wxt-extension-architecture.md`<br>`@Docs/Architect.md` | `Model Decision` / `Glob` |
| **Module Xử lý Dữ liệu Thô (Data Cleaner)** | `@utils/data-cleaner/AGENTS.md` | `Glob` (`utils/data-cleaner/*`) |
| **Module Database & Storage (IndexedDB/Dexie)** | `@.agents/rules/database-and-indexeddb-storage.md` | `Glob` (`Data/Database/*`) |
| **Chạy Test & Kiểm chứng Đóng gói** | `@.agents/rules/testing-and-verification.md` | `Model Decision` |

---

## 🧠 2. 7 Nguyên tắc Định hướng Cốt lõi (Tóm tắt)

1. **Domain Anchoring:** Xác định rõ đối tượng thao tác (DOM element, Background Message, Popup State, IndexedDB Record) trước khi code.
2. **Semantic Density over Ceremony:** Ưu tiên data contract minh bạch, loại bỏ prose rác.
3. **Context Hydration:** Chỉ đọc tài liệu/rule liên quan trực tiếp đến tác vụ (xem Routing Index trên).
4. **Dual Knowledge Stream:** Tách biệt kịch bản kỹ thuật (`technical contract`) và kịch bản người dùng (`cognitive intent`).
5. **Binary Mechanical Quality Gates:** Mọi thay đổi phải vượt qua kiểm tra cơ học (`npm run compile`).
6. **Negative Space (`must_not`):** Tuyệt đối không nuốt lỗi, không dùng `any` bừa bãi, không giữ state trong MV3 Service Worker, không loop `put` từng dòng rời rạc vào DB.
7. **Graceful Degradation:** Xử lý fallback mượt mà khi thao tác DOM hoặc truy vấn DB tự động thất bại.

---

## 🔄 3. Quy trình Đồng bộ hóa Tài liệu & Rule

Khi có sự thay đổi về kiến trúc hệ thống, thư viện hoặc quy trình build:
- Agent **phải tự động cập nhật** file rule tương ứng trong `.agents/rules/` và bản đồ routing trong `AGENTS.md`.
- Đảm bảo `AGENTS.md` luôn nhất quán với trạng thái thực tế của codebase.
