# Design Quality Checklist (Deterministic Script-Gated)

> Skill Architect PHẢI thực thi script `python scripts/validate_architect_design.py` và đạt **Score: 100/100 (Exit Code 0)** trước khi thông báo hoàn thành.
> Nếu bất kỳ item nào vi phạm → script trả về JSON Diagnostic để tự sửa lỗi.

---

## 🛡️ Hard-Gate Script Execution Check

- [ ] Lệnh kiểm định đã chạy: `python scripts/validate_architect_design.py --stage final`
- [ ] Exit Code == 0 (Pass 100% Invariants)
- [ ] Score == 100/100
- [ ] Số lượng vi phạm Critical = 0, Error = 0

---

## ✅ Structure Check — 10 Sections (required_sections from schema)

- [ ] §1 Problem Statement: rõ ràng (Pain Point + Người dùng + Lý do)
- [ ] §2 Capability Map: đủ 3 Pillars (Knowledge / Process / Guardrails)
- [ ] §3 Zone Mapping: đúng format chuẩn (bao gồm cả Zone Assets khi cần)
- [ ] §4 Folder Structure: có Mermaid mindmap, khớp 1-1 với §3
- [ ] §5 Execution Flow: có Mermaid sequenceDiagram
- [ ] §6 Interaction Points: ít nhất 1 điểm tương tác bắt buộc
- [ ] §7 Progressive Disclosure: phân biệt rõ Tier 1, Tier 2, Tier 3
- [ ] §8 Risks: ít nhất 3 risks kèm mitigation cụ thể
- [ ] §9 Open Questions: không để trống
- [ ] §10 Metadata: có skill-name, date, status

---

## ✅ Anti-Slop & Placeholders Check (Tầng 3)

- [ ] Không còn placeholder `TODO`, `TBD`, `xxx`, `tùy chọn`, `chưa xác định`
- [ ] Không chứa cụm từ mơ hồ thoái thác (`xử lý một cách phù hợp`, `vân vân`, `v.v.`)
- [ ] Bảng §8 Risks có ≥ 3 rủi ro với cột Mitigation được mô tả giải pháp kỹ thuật cụ thể

---

## ✅ Cross-Artifact Parity Check (Tầng 2)

- [ ] 100% các file khai báo trong §3 Zone Mapping và `frontmatter.zone_mapping` xuất hiện đầy đủ trong sơ đồ Mermaid mindmap tại §4

---

## ✅ Handoff Readiness — Architect → Planner (Tầng 5)

- [ ] Script kiểm định trả về Exit Code == 0
- [ ] `status: "ready_for_planner"` được kích hoạt hợp lệ trong frontmatter
