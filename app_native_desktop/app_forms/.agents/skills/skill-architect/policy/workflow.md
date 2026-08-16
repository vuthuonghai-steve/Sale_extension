# Workflow Phases — skill-architect (Deterministic Script-Gated)

## Nguồn gốc & Nguyên tắc

Quy trình 3 Phase được cưỡng chế cơ học bởi script kiểm định `scripts/validate_architect_design.py` để loại bỏ triệt để tình trạng tự thỏa hiệp (Sycophancy) và nội dung rỗng (AI Slop).

---

## Phase 1: Collect — Thu thập yêu cầu

**Mục tiêu**: Hiểu rõ Pain Point, người dùng, và output mong đợi.

**Thực hiện**:

1. Xác định **skill-name** (kebab-case). Nếu user chưa đặt tên → gợi ý tên dựa trên mô tả.
2. Thu thập 3 điều từ user:
   - **Pain Point**: Vấn đề gì đang gặp? Tại sao cần skill này?
   - **User & Context**: Ai sẽ dùng? Trong bối cảnh nào?
   - **Expected Output**: Output cuối cùng của skill là gì? (Mermaid? Markdown? JSON?)
3. Nếu confidence < 70% về bất kỳ điều nào → hỏi thêm trước khi tiếp tục.
4. Ghi nháp §1 + §10 vào `design.md`.
5. **Thực thi kiểm định Stage 1**:
   ```bash
   python scripts/validate_architect_design.py --stage phase1 --json-output
   ```

> **⏸️ Gate 1**: Tóm tắt lại những gì đã hiểu kèm kết quả xác thực script. Chờ user confirm → Proceed to Phase 2.

---

## Phase 2: Analyze — Phân tích yêu cầu

**Mục tiêu**: Map yêu cầu vào Framework 3 Pillars & 7 Zones (bao gồm Zone `assets/`).

**Thực hiện**:

1. **3 Pillars Analysis** (từ `knowledge/architect.md` & `assets/keywords/domain-lexicon.yaml`):
   - **Pillar 1 – Knowledge**: Skill cần tri thức gì? Dưới dạng nào?
   - **Pillar 2 – Process**: Workflow logic là gì? Gồm bước nào? Điều kiện rẽ nhánh nào?
   - **Pillar 3 – Guardrails**: AI thường sai ở đâu? Cần kiểm soát gì? (Tham chiếu `assets/keywords/anti-patterns-ban.yaml`)

2. **Confidence Check** — Heavy Thinking Decision Point:
   - **Confidence >85%** + cả 3 Pain Points rõ ràng → Skip to Zone Mapping
   - **Confidence 70-85%** hoặc ambiguous → Activate K=8 chains
   - **Confidence <70%** → Quay lại Phase 1

3. **7 Zones Mapping** — theo format chuẩn (Bắt buộc cụ thể tên file, không dùng placeholder):

```markdown
| Zone            | Files cần tạo                                     | Nội dung                             | Bắt buộc? |
| --------------- | ------------------------------------------------- | ------------------------------------ | --------- |
| Core (SKILL.md) | `SKILL.md`                                        | Persona, phases, guardrails          | ✅        |
| Knowledge       | `knowledge/xxx.md`                                | Tri thức domain, tiêu chuẩn kỹ thuật | ✅ / ❌   |
| Scripts         | `scripts/xxx.py`                                  | Automation tools                     | ✅ / ❌   |
| Templates       | `templates/xxx.template`                          | Output format mẫu                    | ✅ / ❌   |
| Data            | `data/xxx.yaml`                                   | Config tĩnh, schema                  | ✅ / ❌   |
| Loop            | `loop/xxx.md`                                     | Checklist, verify rules, test cases  | ✅ / ❌   |
| Assets          | `assets/keywords/xxx.yaml`, `assets/schemas/xxx`  | Bộ luật, từ điển & assertions        | ✅ / ❌   |
```

4. **Risks Identification**: ít nhất 3 rủi ro cụ thể kèm biện pháp Mitigation dứt khoát (tham chiếu `assets/templates-supplemental/risk-taxonomies.yaml`).
5. Ghi nháp §2 + §3 + §8 vào `design.md`.
6. **Thực thi kiểm định Stage 2**:
   ```bash
   python scripts/validate_architect_design.py --stage phase2 --json-output
   ```

> **⏸️ Gate 2**: Trình bày bảng phân tích. Chờ confirm → Proceed to Phase 3.

---

## Phase 3: Design & Output — Thiết kế và Xuất kết quả

**Mục tiêu**: Cụ thể hóa kiến trúc thành sơ đồ và kế hoạch rõ ràng.

**Thực hiện** (đúng thứ tự):

1. **Read** `knowledge/visualization-guidelines.md` & `assets/templates-supplemental/mermaid-snippets.yaml`.
2. **Tạo bắt buộc** ≥ 3 sơ đồ Mermaid:
   - `D1 — Folder Structure` (mindmap) — **Bắt buộc khớp 1-1 với §3 Zone Mapping**
   - `D2 — Execution Flow` (sequenceDiagram)
   - `D3 — Workflow Phases` (flowchart LR)
   - _(Optional)_ `D4 — Pipeline` (flowchart TD)
3. **Thiết kế §6 Interaction Points**: khi nào skill PHẢI dừng hỏi user.
4. **Thiết kế §7 Progressive Disclosure Plan**: Tier 1 vs Tier 2 vs Tier 3.
5. **Điền §9 Open Questions**: tổng hợp điểm chưa rõ.
6. Cập nhật §10 Metadata.

---

## 🔄 Closed-Loop Auto-Repair Protocol (Giao Thức Tự Sửa Lỗi)

Trước khi bàn giao hoặc dừng tại Gate 3:
1. Chạy script kiểm định toàn diện:
   ```bash
   python scripts/validate_architect_design.py --stage final --json-output
   ```
2. Nếu `Exit Code != 0`:
   - Phân tích danh sách `diagnostics` từ JSON output.
   - Định vị chính xác số dòng `line_number` bị lỗi.
   - Sửa file `design.md` theo hướng dẫn tại `fix_hint`.
   - Chạy lại script (Tối đa 3 vòng lặp).
3. Khi `Exit Code == 0` (Score: 100/100):
   - Cập nhật trường `status: "ready_for_planner"` trong frontmatter.
   - Dừng tại Gate 3 và trình bày cho User.

---

## Progressive Writing Contract

**⚠️ CRITICAL**: Ghi vào `design.md` **ngay sau khi mỗi Phase được user confirm**.

| Sau Phase | Ghi vào design.md | Trạng thái Frontmatter |
| --------- | ------------------| -----------------------|
| Phase 1 | §1 Problem Statement, §10 Metadata | `status: "in_progress"` |
| Phase 2 | §2 Capability Map, §3 Zone Mapping, §8 Risks | `status: "in_progress"` |
| Phase 3 | §4-§7, §9, §10 | `status: "ready_for_planner"` (chỉ khi Pass Script Gate) |
