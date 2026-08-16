---
spec_version: "3.0.0"
skill_name: "skill-builder"
based_on:
  - "CLAUDE.md AI-First Documentation Standard v1.0"
  - "skill-architect/SPEC.md v3.0"
  - "skill-planner/SPEC.md v3.0"
  - "Agent Skill Framework architecture.md v3.0.0"
last_updated: "2026-05-31"
maintained_by: "Steve Void Team"
---

# skill-builder Technical Specification (Ver_3.0.0 - Physical Micro-skills)

## 1. Semantic Questions

When reading this skill, the LLM must be able to answer:

| # | Question | Answerable From |
|---|----------|-----------------|
| **Q1** | Is this a command or reference data? | SKILL.md `name` + `description` frontmatter |
| **Q2** | Is this a hard rule or soft suggestion? | SKILL.md `constraints` YAML block (must/must_not) |
| **Q3** | When is this information always needed vs context-dependent? | SKILL.md `progressive_disclosure` tiers |
| **Q4** | What is example vs criteria? | `loop/build-checklist.yaml` vs `knowledge/` files |
| **Q5** | When conflict occurs, which takes priority? | SKILL.md `priority_order` in AI-FIRST CONFIGURATION |

---

## 2. Format Requirements

Based on CLAUDE.md §3 format selection:

```yaml
format_rules:
  markdown:
    use_for:
      - explanation: "SKILL.md workflow description, persona, Phase instructions"
      - walkthrough: "Boot sequence, build examples"
      - overview: "Mission, error policy, tools"
    avoid_for:
      - hard_rules_without_schema: "Use YAML in Guardrails instead"

  yaml:
    use_for:
      - constraints: "progressive_disclosure tiers, output_contract, priority_order"
      - checklists: "loop/build-checklist.yaml quality gates"
      - routing: "pipeline stage_order, dependencies"
    avoid_for:
      - long_prose: "Phase instructions stay in Markdown"

  xml_like_tags:
    use_for:
      - semantic_boundaries: "<instructions>, <context> in Phase descriptions"
      - separating_input: "When user input wraps requirements"
    avoid_for:
      - excessive_micro_tagging: "Phase steps already have clear boundaries"
```

---

## 3. Token Budget

Based on CLAUDE.md §6 Layer Model:

> **Source of truth**: `.skill-context/suite_config.yaml` → `token_budget.*`
> Các giá trị dưới đây là snapshot — KHÔNG hardcode trong code.

```yaml
token_budget:
  source_of_truth: ".skill-context/suite_config.yaml"

  L0_anchor_rules:
    soft_max: 500          # ≤ soft_max = silent PASS
    warning_max: 700       # 500-700 = SOFT warning (không fail)
    hard_limit: 1200       # 700-1200 = HARD warning (khuyến nghị split)
    hard_fail: 1500        # > 1500 = ERROR + STOP
    split_when: "> warning_max (700)"

  L1_working_policy:
    soft_max: 1000
    warning_max: 1500
    hard_limit: 2200
    hard_fail: 2800

  L2_domain_context:
    soft_max: 800
    warning_max: 1500
    hard_limit: 2500
    hard_fail: 3500

  enforcement: "soft_with_hard_ceiling"
  rationale: |
    700 không còn là ceiling cứng — chỉ là ranh giới warning.
    Skill phức tạp (orchestrator, multi-phase) có thể dùng tới 1100 tokens
    mà không bị split ép buộc. Chỉ fail khi > hard_fail (1500).

---

## 4. Quality Gates

Based on CLAUDE.md §12 Definition of Done + architure.md §4:

```yaml
quality_gates:
  source_fidelity:
    - name: "Zone Contract Preserved"
      check: "Only files in design.md §3 Zone Mapping are created"
      ref: "SKILL.md Guardrails G7"
    - name: "Source Grounding"
      check: "100% content from design/todo/resources, no hallucination"
      ref: "SKILL.md Guardrails G4"
    - name: "Task-File Sync"
      check: "Every todo.md task maps to actual created file"
      ref: "SKILL.md Phase 3 BUILD"

  structure:
    - name: "4 Required Zones Present"
      check: "Core (SKILL.md), Knowledge, Scripts, Loop"
      ref: "loop/build-checklist.yaml S1"
    - name: "Build-Log Completeness"
      check: "Resource Inventory, Usage Matrix, Validation Result"
      ref: "SKILL.md Phase 5 DELIVER"

  agent_usability:
    - name: "Priority Order Defined"
      check: "source_fidelity > zone_contract > phase_discipline > placeholder_control"
      ref: "SKILL.md AI-FIRST CONFIGURATION"
    - name: "Must/MustNot Rules Clear"
      check: "G1-G7 guardrails with explicit must/must_not"
      ref: "SKILL.md Guardrails YAML"
    - name: "Loading Guidance Present"
      check: "progressive_disclosure tier1/tier2/tier3 paths specified"
      ref: "SKILL.md frontmatter"

  handoff_readiness:
    - name: "Planner→Builder Contract"
      check: "todo.md executed, all phases verified"
      ref: "SKILL.md Phase 4 VERIFY"
    - name: "Quality Gate Passed"
      check: "loop/build-checklist.yaml all MUST items pass"
      ref: "SKILL.md Phase 4 VERIFY"

  placeholder_control:
    - name: "Placeholder Density"
      check: "<5 PASS, 5-9 WARNING, 10+ FAIL"
      ref: "SKILL.md Phase 4 VERIFY"
    - name: "Zero-Summarization"
      check: "1:1 mapping with resources, no detail loss"
      ref: "loop/build-checklist.yaml C2"
```

---

## 5. Anti-Hallucination Rules

Based on CLAUDE.md §9 Semantic Activation Anchors:

```yaml
anti_hallucination:
  AH1_zone_contract:
    description: "Only create files in design.md §3"
    implementation:
      - "SKILL.md reads §3 Zone Mapping as source of truth"
      - "Builder does NOT create files outside §3"
      - "G7 Zone Contract Block guardrail enforces"
    violation: "Creating file not in §3"

  AH2_trace_tag_validation:
    description: "Use correct trace tags"
    implementation:
      - "[TỪ DESIGN §N] — from confirmed design.md"
      - "[TỪ AUDIT TÀI NGUYÊN] — from resource gap"
      - "[GỢI Ý BỔ SUNG] — planner suggestion"
      - "[CẦN LÀM RÕ] — needs clarification"
    legacy_violation: "Using [GỢI Ý], [TỪ AUDIT] (old format)"

  AH3_phase_discipline:
    description: "Execute phases in order"
    implementation:
      - "Phase 1 PREPARE before Phase 2 CLARIFY"
      - "Phase 2 CLARIFY before Phase 3 BUILD"
      - "Phase 3 BUILD before Phase 4 VERIFY"
      - "Phase 4 VERIFY before Phase 5 DELIVER"
    violation: "Skipping or reordering phases"

  AH4_placeholder_control:
    description: "Maintain placeholder density < 5"
    implementation:
      - "Count [MISSING_DOMAIN_DATA] markers"
      - "<5 = PASS, 5-9 = WARNING, 10+ = FAIL"
      - "Address placeholders before Phase 5 DELIVER"
    violation: "Leaving 10+ placeholders unfilled"

  AH5_build_log_mandatory:
    description: "Document every decision"
    implementation:
      - "Append to build-log.md after each file creation"
      - "Format: Task -> Output -> Source files"
      - "Include decision rationale and validation evidence"
    violation: "Creating file without logging"

  AH6_error_policy:
    description: "Log-Notify-Stop on system errors"
    implementation:
      - "Append error to loop/build-log.md"
      - "Notify user via AskUserQuestion"
      - "STOP all tasks immediately"
    violation: "Continuing after system error"
```

---

## 6. Zone Structure Compliance

Based on architure.md §2 Zones:

```yaml
zone_compliance:
  required_zones:
    core:
      path: "SKILL.md"
      status: "✅ Present - Persona, 5 Phases, Guardrails YAML"
      mandatory: true

    knowledge:
      path: "knowledge/architect.md"
      path: "knowledge/build-guidelines.md"
      path: "knowledge/anthropic-skill-standards.md"
      status: "✅ Present - Builder-specific workflow, content rules, Anthropic standards"
      mandatory: true
      shared: "../_shared/knowledge/framework.md"

    loop:
      path: "loop/build-checklist.yaml"
      path: "loop/build-log.md.template"
      status: "✅ Present - Quality gate YAML, build-log template"
      mandatory: true

  conditional_zones:
    scripts:
      path: "scripts/validate_skill.py"
      status: "✅ Present - Skill validation script"
      loaded_when: "Phase 4 VERIFY"

    data:
      path: ".skill-context/{target_skill}/data/"
      status: "✅ Used as input"
      note: "Builder reads data/ but does not create it"

    templates:
      path: "templates/"
      status: "❌ Not created by Builder"
      note: "Templates created by Architect"

  tier_structure:
    tier1_mandatory:
      - "SKILL.md"
      - "knowledge/build-guidelines.md"
      - "knowledge/anthropic-skill-standards.md"
      - "../_shared/knowledge/framework.md"
    tier2_conditional:
      - "knowledge/architect.md"         # Phase 1
      - "loop/build-checklist.yaml"      # Phase 4
      - "loop/build-log.md.template"    # Phase 5
    tier3_optional:
      - "references/examples/build-*.md"  # On-demand reference
```

---

## 7. Workflow Compliance

Based on architure.md §3 5-Phase Workflow:

```yaml
workflow_compliance:
  phase1_prepare:
    status: "✅ Implemented as Phase 1: PREPARE & Evaluate"
    requirements_met:
      - "Read design.md, todo.md, resources/"
      - "Build context inventory (Critical vs Supportive)"
      - "Audit design for phi logic"
    gate: "Continue to Phase 2"

  phase2_clarify:
    status: "✅ Implemented as Phase 2: CLARIFY"
    requirements_met:
      - "Scan for [CẦN LÀM RÕ] flags"
      - "Scan for logic flaws"
      - "Max 5 clarification items"
    gate: "⏸️ Gate: Wait for user clarification"

  phase3_build:
    status: "✅ Implemented as Phase 3: BUILD"
    requirements_met:
      - "Execute todo.md phase by phase"
      - "Create ONLY files in §3 Zone Mapping"
      - "Apply build-guidelines.md and anthropic-skill-standards.md"
      - "Double-pass after each phase"
      - "Progress tracking in todo.md"
    gate: "Continue to Phase 4"

  phase4_verify:
    status: "✅ Implemented as Phase 4: VERIFY"
    requirements_met:
      - "Run validate_skill.py"
      - "Apply build-checklist.yaml"
      - "Placeholder density check"
    gate: "Continue to Phase 5"

  phase5_deliver:
    status: "✅ Implemented as Phase 5: DELIVER"
    requirements_met:
      - "Finalize build-log.md"
      - "Resource Inventory present"
      - "Resource Usage Matrix present"
      - "Validation Result present"
    gate: "User confirmation"

  engineer_critic_stance:
    description: "Builder has right and duty to challenge design"
    scenarios:
      - "Phi logic in design → flag before build"
      - "Missing clarification → ask before build"
      - "Risk identified in §8 → create mitigation task"
```

---

## 8. Pipeline Integration

Based on architure.md §4 Pipeline Flow:

```yaml
pipeline:
  stage_order: 3
  predecessor: "skill-planner"
  successor: null  # Builder is final stage

  handoff_from_planner:
    required_inputs:
      - "design.md (complete, all sections populated)"
      - "todo.md (with phases, tasks, dependencies)"
      - "resources/ (user-provided domain docs)"

  context_directory:
    path: ".skill-context/{target_skill}/"
    created_by: "skill-architect scripts"
    builder_outputs:
      - "{skills_root}/{target_skill}/"  # The built skill
      - "build-log.md"                 # Execution evidence
    contents:
      - "design.md (Architect output)"
      - "todo.md (Planner output)"
      - "build-log.md (Builder evidence)"
      - "resources/ (User-provided docs)"
      - "loop/ (Quality checks)"
```

---

## 9. Definition of Done

```yaml
definition_of_done:
  skill_builder_complete_when:
    - "✅ SKILL.md exists with all required frontmatter"
    - "✅ AI-FIRST CONFIGURATION with priority_order and constraints"
    - "✅ Guardrails in YAML schema (G1-G7)"
    - "✅ loop/build-checklist.yaml provides quality gate"
    - "✅ All 5 Phases implemented with gate enforcement"
    - "✅ Progressive Disclosure tier1/tier2/tier3 defined"
    - "✅ Anti-hallucination rules AH1-AH6 integrated"

  skill_directory_handoff_ready_when:
    - "✅ All files in design.md §3 Zone Mapping created"
    - "✅ All todo.md tasks executed and marked done"
    - "✅ Placeholder density < 5"
    - "✅ validate_skill.py returns Exit Code 0"
    - "✅ build-log.md has Resource Inventory"
    - "✅ build-log.md has Resource Usage Matrix"
    - "✅ build-log.md has Validation Result"
    - "✅ No unresolved [CẦN LÀM RÕ]"
    - "✅ loop/build-checklist.yaml passed"
    - "✅ User confirmed final build"
```

---

## References

| Source | File | Key Contribution |
|--------|------|------------------|
| CLAUDE.md AI-First Standard | `/CLAUDE.md` | §3 Format, §6 Token Budget, §12 DoD |
| skill-architect | `../skill-architect/SPEC.md` | Zone Mapping, Pipeline Flow |
| skill-planner | `../skill-planner/SPEC.md` | 3-tier breakdown, Trace Tags |
| architure.md | `/architure.md` | 3 Pillars, 7 Zones, 5-Step Workflow |
| framework.md | `../_shared/knowledge/framework.md` | Zone contract, naming conventions |
| SKILL.md | `./SKILL.md` | skill-builder implementation |
| build-checklist.yaml | `./loop/build-checklist.yaml` | Quality gate checklist |

---

> **Spec Status**: ✅ Complete
> **Next**: Built skill from .skill-context/{target_skill}/ is the final output; Pipeline complete
