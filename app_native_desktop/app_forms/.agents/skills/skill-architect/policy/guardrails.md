# Guardrails — skill-architect

## Guardrails Specification

```yaml
guardrails:
  G1:
    rule: "Design Only"
    must_not: ["write_implementation_code"]
    if_user_asks_code: "redirect to skill-builder"

  G2:
    rule: "Gate Enforcement"
    must: ["stop_and_wait_for_user_confirmation_at_each_phase"]
    stop_conditions: ["Phase1_Gate", "Phase2_Gate", "Phase3_Gate"]

  G3:
    rule: "Confidence Threshold"
    condition: "confidence < 70"
    action: "ask_user_for_clarification_before_proceeding"
    bonus: "confidence < 85% = consider K=8 chains for complex analysis"

  G4:
    rule: "Zone Mapping & Parity Contract"
    must:
      - use_specific_filenames_no_placeholders
      - include_assets_zone_when_rules_exist
      - ensure_1_to_1_parity_with_mermaid_mindmap
    contract_for: "skill-planner"

  G5:
    rule: "Checklist Gate"
    must: ["pass_design_checklist_before_declare_complete"]
    checklist_file: "loop/design-checklist.yaml"

  G6:
    rule: "Heavy Thinking Gate"
    condition: "confidence < 85% at Phase 2"
    action: "activate K=8 chains before presenting analysis"

  G7:
    rule: "Format Compliance"
    must:
      - use_yaml_for_constraints
      - use_xml_tags_for_boundaries
      - use_trace_tags_for_all_content
    must_not:
      - output_missing_trace_tags
      - use_placeholder_filenames_in_zone_mapping
      - contain_todos_or_tbd_placeholders
    reject_if:
      - missing_trace_tags
      - missing_xml_boundaries
      - missing_yaml_must_must_not
      - contains_banned_placeholders
      - token_budget_exceeded_without_justification

  G8:
    rule: "Deterministic Script Gate"
    must:
      - execute_validate_architect_design_before_gate
      - achieve_exit_code_zero
      - achieve_score_100
    validator_script: "scripts/validate_architect_design.py"
    enforce: hard
```

---

## Heavy Thinking Integration

Khi task difficulty <85% confidence, sử dụng K=8 parallel reasoning chains.

### Khi nào kích hoạt K=8

| Trigger | Điều kiện | Approach |
|---------|-----------|---------|
| **Easy Mode** | Cả 3 Pain Point clear, confidence >85% | Direct 3-phase, skip K=8 |
| **Hard Mode** | Ambiguous requirements, multiple valid interpretations | Activate K=8 chains |

### K=8 Chain Allocation

```yaml
Pillar 1 (Knowledge & Assets): 2 chains
  - Chain 1: Domain knowledge & lexicon requirements
  - Chain 2: knowledge/ & assets/ folder structure

Pillar 2 (Process): 3 chains
  - Chain 3: Workflow logic analysis
  - Chain 4: Phase ordering & script gate checkpoints
  - Chain 5: Interaction points & closed-loop repair

Pillar 3 (Guardrails): 3 chains
  - Chain 6: Zone applicability & invariant assertions
  - Chain 7: Risk identification & concrete mitigation
  - Chain 8: Open question surfacing & handoff readiness
```
