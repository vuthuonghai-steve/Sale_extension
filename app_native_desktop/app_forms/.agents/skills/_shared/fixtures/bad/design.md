---
# ❌ Bad fixture: thiếu required fields, zone_mapping thiếu zones, path sai
skill_schema_version: "3.0.0"
artifact_type: "design"
skill_name: "Bad Example"
generated_by: "skill-architect"
generated_at: "2026-05-03"
stage: "architect"
status: "invalid_status"

zone_mapping:
  core:
    zone_required: true
    files:
      - path: "../outside/SKILL.md"
        file_required: true
  knowledge:
    zone_required: true
    files: []
  scripts:
    zone_required: false
    files: []
  # Thiếu templates, data, loop, assets zones

progressive_disclosure:
  tier1:
    - path: "SKILL.md"
      base: "invalid_base"

handoff:
  next_stage: "invalid_stage"
  ready_condition:
    required:
      frontmatter_valid: false
---
