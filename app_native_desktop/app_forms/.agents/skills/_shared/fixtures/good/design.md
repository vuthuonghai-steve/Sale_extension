---
skill_schema_version: "3.0.0"
artifact_type: "design"
skill_name: "example-skill"
generated_by: "skill-architect"
generated_at: "2026-05-03T10:00:00Z"
stage: "architect"
status: "ready_for_planner"

canonical_source:
  zone_mapping: "frontmatter.zone_mapping"
  progressive_disclosure: "frontmatter.progressive_disclosure"

zone_mapping:
  core:
    zone_required: true
    files:
      - path: "SKILL.md"
        file_required: true
        content_type: "orchestration"
  knowledge:
    zone_required: true
    files:
      - path: "knowledge/domain.md"
        file_required: true
        content_type: "reference"
  scripts:
    zone_required: false
    files: []
  templates:
    zone_required: false
    files:
      - path: "templates/output.template"
        file_required: false
        content_type: "format"
  data:
    zone_required: false
    files:
      - path: "data/config.yaml"
        file_required: false
        content_type: "config"
  loop:
    zone_required: true
    files:
      - path: "loop/checklist.md"
        file_required: true
        content_type: "verify"
  assets:
    zone_required: false
    files: []

progressive_disclosure:
  tier1:
    - path: "SKILL.md"
      base: "skill_dir"
  tier2:
    - path: "knowledge/domain.md"
      base: "skill_dir"
      load_when: "Phase 1: Domain analysis"
  tier3:
    - path: "data/config.yaml"
      base: "skill_dir"
      load_when: "User requests config change"

required_sections:
  - "1_problem_statement"
  - "2_capability_map"
  - "3_zone_mapping"
  - "4_folder_structure"
  - "5_execution_flow"
  - "6_interaction_points"
  - "7_progressive_disclosure"
  - "8_risks"
  - "9_open_questions"
  - "10_metadata"

optional_sections:
  - "11_naming_conventions"
  - "12_rollback"

handoff:
  next_stage: "planner"
  ready_condition:
    required:
      frontmatter_valid: true
      zone_mapping_complete: true
      required_sections_present: true
      no_blockers: true
---

# Example Skill — Design Document

## 1. Problem Statement

This is an example design document used for schema validation testing.

## 2. Capability Map

Core capabilities: SKILL.md orchestration, knowledge management, template generation.

## 3. Zone Mapping

See frontmatter.zone_mapping for source of truth.

## 4. Folder Structure

Standard 7-zone layout as defined in _shared/knowledge/framework.md.

## 5. Execution Flow

Boot → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Handoff.

## 6. Interaction Points

User provides requirements, skill generates design.md.

## 7. Progressive Disclosure

See frontmatter.progressive_disclosure for tier definitions.

## 8. Risks

- Risk 1: Schema mismatch between versions
- Risk 2: Path resolution errors

## 9. Open Questions

- Q1: Output path convention?

## 10. Metadata

Version: 1.0.0, Author: skill-architect
