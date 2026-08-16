# Suite Rules — Priority Hierarchy

> **Purpose**: Define rule precedence when conflicts occur between sources
> **Priority**: `.mdc` (highest) > `SKILL.md` > `knowledge/*.md` (lowest)

---

## Rule Priority Definitions

```yaml
rule_priority:
  level_1_mdc:
    location: "_shared/rules/*.mdc"
    description: "Suite-wide rules, override everything"
    examples:
      - "Zero placeholder policy"
      - "Security requirements"
      - "Naming conventions"

  level_2_skill_md:
    location: "{skill}/SKILL.md"
    description: "Skill-specific overrides"
    examples:
      - "Custom triggers"
      - "Skill-specific workflows"

  level_3_knowledge_md:
    location: "_shared/knowledge/*.md"
    description: "Domain knowledge, lowest priority"
    examples:
      - "framework.md"
      - "case-system.md"
```

## Conflict Resolution

| Scenario | Resolution |
|----------|------------|
| `.mdc` says YES, `SKILL.md` says NO | `.mdc` wins |
| `SKILL.md` says YES, `knowledge/*.md` says NO | `SKILL.md` wins |
| Same level conflict | Use most recent timestamp |

---

## Suite-Wide Non-Negotiable Rules

```yaml
must_always:
  - "Zero placeholders in production code"
  - "SKILL.md ≤ 700 tokens (L0 anchor)"
  - "YAML frontmatter required on all SKILL.md with version: 0.0.1 and suite: WASHVN"
  - "Trace tags on all tasks: [TỪ DESIGN §N]"
  - "OWASP security check on auth/payment/upload skills"
  - "Define output_contract as a valid YAML block containing output_type, target_context_variable, and destination_rules"

must_never:
  - "Hardcode absolute paths"
  - "Use TODO/pass/mock in production"
  - "Skip validation before handoff"
```

---

> **Last Updated**: 2026-06-03
> **Version**: 1.0.0
