---
# ❌ Bad fixture: blockers unresolved, phase0 pending, circular dependency
skill_schema_version: "3.0.0"
artifact_type: "todo"
skill_name: "bad-skill"
generated_by: "skill-planner"
generated_at: "2026-05-03"
stage: "planner"
status: "ready_for_builder"
trace_to_design: "design.md"

blockers:
  - id: "B1"
    type: "CLARIFICATION_NEEDED"
    description: "Chưa rõ output path convention"
    resolved: false
    blocks_tasks: ["T1.1"]

phases:
  - id: "PH0"
    name: "PREPARE"
    tasks:
      - id: "T0.1"
        title: "Audit domain knowledge"
        zone: "knowledge"
        priority: "critical"
        trace: "[TỪ AUDIT TÀI NGUYÊN]"
        status: "pending"

  - id: "PH1"
    name: "BUILD_CORE"
    tasks:
      - id: "T1.1"
        title: "Write SKILL.md"
        zone: "core"
        priority: "critical"
        trace: "[TỪ ĐESIGN §3]"
        depends_on: ["T0.1"]
        status: "pending"

prerequisites:
  - item: "Domain knowledge"
    tier: "unknown"
    status: "invalid"
---
