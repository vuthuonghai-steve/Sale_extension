# Skill Anatomy & Knowledge Layering

> **Purpose**: Giải thích chi tiết các thành phần của một Agent Skill chuẩn mực theo triết lý AI-First.

---

## 1. Các Lớp Tài Liệu (Knowledge Hierarchy)

Một skill chuẩn mực áp dụng mô hình phân tầng nhận thức (Cognitive Layering):

### Layer 0: SKILL.md (Entry & Execution Contract)
- Chứa Frontmatter định danh.
- Mission tóm lược.
- Hướng dẫn Boot Sequence & Workflow.
- Guardrails và Stop Conditions nhị phân (Pass/Fail).

### Layer 1: Knowledge Base (`knowledge/`)
- Cung cấp domain patterns, data schemas, design rules.
- Giúp Agent hiểu *cách tư duy và cấu trúc dữ liệu* trước khi thao tác.

### Layer 2: Self-Verification Loop (`loop/`)
- Danh sách checklist nhị phân để Agent tự rà soát trước khi trả lời.
- Ngăn chặn triệt để hiện tượng hallucination và thiếu sót cơ học.

### Layer 3: Templates (`templates/`)
- Mẫu chuẩn cho code, doc, config.
- Đảm bảo tính đồng nhất về mặt cú pháp và styleguide trên toàn bộ dự án.

---

## 2. Tiêu Chuẩn YAML & Schema

Mọi file trong `knowledge/` và `loop/` nên kết hợp Markdown giải thích với các khối YAML có khóa chuẩn:
- `must`: Hành động bắt buộc.
- `must_not`: Hành động tuyệt đối cấm.
- `gate_rules`: Tiêu chí Pass/Fail.
- `confidence_threshold`: Ngưỡng tin cậy tối thiểu để tiếp tục.
