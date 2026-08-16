---
# ❌ Bad fixture: STOP_AND_REPORT + validator_pass mâu thuẫn
skill_schema_version: "3.0.0"
artifact_type: "build-log"
skill_name: "bad-skill"
generated_by: "skill-builder"
generated_at: "2026-05-03"
stage: "builder"
status: "complete"

execution_trace:
  - timestamp: "2026-05-03T12:10:00Z"
    task_id: "T2.3"
    action: "VALIDATE"
    file: "SKILL.md"
    status: "failed"
    error: "Missing required sections"
    decision: "STOP_AND_REPORT"

feedback_to_planner: []
feedback_to_architect: []

quality_metrics:
  placeholder_ratio: 0.05
  critical_tasks_done: true
  validator_pass: true
---
