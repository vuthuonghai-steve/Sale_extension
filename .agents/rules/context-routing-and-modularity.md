---
trigger: model_decision
description: "Chiến lược quản lý contextwindow, nén ngữ cảnh và điều phối load tài liệu theo yêu cầu (On-Demand Context Loading)"
---

# 📦 Rule: Context Modularity & Dynamic Routing Strategy

Rule này định hướng cách Agent nạp và quản lý thông tin context để tối ưu hóa context window và tránh làm nhiễu tư duy suy luận.

## 1. Nguyên lý "Load Khi Cần" (On-Demand Context Ingestion)
- **Không nạp rác:** Agent tuyệt đối KHÔNG đọc toàn bộ file tài liệu hay codebase nếu tác vụ hiện tại chỉ liên quan đến 1 file cụ thể.
- **Truy xuất theo bản đồ:** Trước khi bắt đầu công việc, Agent xem bản đồ chỉ mục tại `@AGENTS.md` để xác định file rule/tài liệu tối thiểu cần đọc.
- **Tập trung ngữ cảnh:** Chỉ nạp thêm thông tin chi tiết (API contract, architecture schema) khi gặp tác vụ phức tạp đòi hỏi hiểu rõ luồng hệ thống.

## 2. Tránh Phân mảnh Quá Mức (Anti-Over-Fragmentation)
- Gom nhóm rule theo **Domain chức năng** hợp lý (`architecture`, `tech-stack`, `testing`, `quality-gates`).
- Không tạo các file rule quá nhỏ (dưới 5 dòng) làm gia tăng overhead tìm kiếm và đọc file của Agent.
- Đảm bảo mỗi file rule trong `.agents/rules/` có mục đích minh bạch và kích thước nằm trong giới hạn cho phép (< 12,000 ký tự).

## 3. Cập nhật & Đồng bộ Rule (Rule Synchronization)
- Khi refactor hoặc bổ sung module mới, nếu có sự thay đổi về kiến trúc hoặc convention:
  - Agent phải có trách nhiệm cập nhật lại tài liệu tương ứng trong `.agents/rules/`.
  - Cập nhật chỉ mục tham chiếu tại `@AGENTS.md` để các phiên làm việc sau không bị lệch context.