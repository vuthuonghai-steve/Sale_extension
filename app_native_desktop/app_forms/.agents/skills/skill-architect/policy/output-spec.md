# Output Specification — skill-architect

## Nguồn gốc

Phần này được trích từ SKILL.md cũ, lines 31-45, 428-445.

---

## Output Contract

```yaml
output_contract:
  artifact: ".skill-context/{target_skill}/design.md"
  format: markdown_with_yaml_frontmatter
  required_sections:
    - "§1_problem_statement"
    - "§2_capability_map"
    - "§3_zone_mapping"
    - "§4_folder_structure"
    - "§5_execution_flow"
    - "§6_interaction_points"
    - "§7_progressive_disclosure"
    - "§8_risks"
    - "§9_open_questions"
    - "§10_metadata"
  handoff_to: "skill-planner"
```

---

## 10 Sections Specification

| # | Section | Mục đích | Ghi sau Phase |
|---|---------|----------|---------------|
| §1 | Problem Statement | Pain point, người dùng, lý do cần skill | Phase 1 |
| §2 | Capability Map | 3 Pillars phân tích | Phase 2 |
| §3 | Zone Mapping | Contract Architect→Planner (format chuẩn) | Phase 2 |
| §4 | Folder Structure | Mindmap sơ đồ thư mục | Phase 3 |
| §5 | Execution Flow | Sequence diagram runtime | Phase 3 |
| §6 | Interaction Points | Khi nào skill dừng hỏi user | Phase 3 |
| §7 | Progressive Disclosure Plan | Tier 1/2 files | Phase 3 |
| §8 | Risks & Blind Spots | Risks + mitigation | Phase 2 |
| §9 | Open Questions | Điểm chưa rõ | Phase 3 |
| §10 | Metadata | skill-name, date, author, status | Phase 1 + update |

---

## Pipeline Integration

```
skill-architect  ──→  skill-planner  ──→  skill-builder
    [design.md]            [todo.md]         [skill files]

Handoff A→P:
  § design.md §2 (Capability Map)  → Planner audit 3 Tiers
  § design.md §3 (Zone Mapping)    → Planner decompose thành Tasks
  § design.md §7 (PD Plan)         → Planner + Builder biết Tier 1/2 files
  § design.md §8 (Risks)           → Builder tham chiếu khi Guardrails
```

**Architect phải đảm bảo trước khi handoff**:

- [ ] §3 có tên file cụ thể (không placeholder)
- [ ] §7 phân biệt rõ Tier 1 và Tier 2
- [ ] §8 có ít nhất 3 risks kèm mitigation
- [ ] §9 Open Questions đã được làm rõ hoặc ghi rõ để Builder xử lý
