# Quality Gates — 20-Point Standard (HYBRID ARCHITECTURE)

> **Purpose**: Consolidated 20-point quality gates replacing 50-point standard
> **Structure**: 4 criteria per stage (5 stages + Security)

---

## Stage 0: Explorer (4 criteria)

| ID | Name | Description | Check |
|----|------|-------------|-------|
| EXP-01 | Business Intent | Pain point, target user, expected behavior rõ ràng | problem_statement ≥ 50 words |
| EXP-02 | Golden Standards | 7 standards assessment (Reusability, Composability, Maintainability, Security, Context Economics, Portability, Reliability) | All 7 scored |
| EXP-03 | SCS Score | Skill Complexity Score tính toán | SCS > 3.0 = decompose required |
| EXP-04 | Exploration Schema | schema_validator.py PASS trên exploration.md | Validator exit code 0 |

---

## Stage 1: Architect (4 criteria)

| ID | Name | Description | Check |
|----|------|-------------|-------|
| ARC-01 | Problem Statement | §1 có context, pain point, solution, scope | All 4 elements present |
| ARC-02 | Zone Mapping | §3 có bảng cụ thể, no placeholders | No "xxx", "...", "tùy chọn" |
| ARC-03 | Mermaid Diagrams | §4 mindmap + §5 sequence đúng syntax | Valid Mermaid syntax |
| ARC-04 | Design Schema | schema_validator.py PASS trên design.md | Validator exit code 0 |

---

## Stage 2: Gatekeeper + Security (4 criteria)

| ID | Name | Description | Check |
|----|------|-------------|-------|
| GAT-01 | Quality Matrix | quality-matrix.yaml có điểm số | All dimensions scored |
| GAT-02 | Security Review | skill-security-reviewer APPROVED nếu sensitive | APPROVED or SKIPPED |
| GAT-03 | No Ambiguities | Tất cả [CẦN LÀM RÕ] đã resolved | OPEN count = 0 |
| GAT-04 | Handoff Ready | handoff_validator.py PASS | Validator exit code 0 |

---

## Stage 3: Planner (4 criteria)

| ID | Name | Description | Check |
|----|------|-------------|-------|
| PLN-01 | Trace Tags | Mọi task có [TỪ DESIGN §N] hợp lệ | 100% coverage |
| PLN-02 | Dependency DAG | Task dependencies rõ ràng, no cycle | DAG valid |
| PLN-03 | Resource Audit | Critical resources available hoặc fallback | All critical available |
| PLN-04 | Human Gate Ready | todo.md đạt đủ criteria cho human review | All PLN-01 to PLN-03 PASS |

---

## Stage 4: Builder + Human Confirm (4 criteria)

| ID | Name | Description | Check |
|----|------|-------------|-------|
| BLD-01 | Zone Contract | Chỉ tạo file trong design.md §3 | No unauthorized files |
| BLD-02 | SKILL.md Token Budget | ≤700 tokens (L0 anchor rule) | Token count ≤ 700 |
| BLD-03 | Placeholder Density | <5% placeholders trong toàn bộ skill | Density < 5% |
| BLD-04 | Human Confirmed | User explicitly confirmed design.md + todo.md | human_confirmed: true |

---

## Security Stage (Special — triggered on demand)

| ID | Name | Description | Check |
|----|------|-------------|-------|
| SEC-01 | OWASP-1 | Broken Access Control check | No auth bypass vectors |
| SEC-02 | OWASP-2 | Cryptographic Failures check | No hardcoded secrets |
| SEC-03 | OWASP-3 | Injection check | No string concat in commands |
| SEC-04 | OWASP-4 | Insecure Design check | No security holes created |

---

## Quality Gate Workflow

```mermaid
graph TD
    A{Stage 0} -->|EXP-01 to EXP-04| B{Stage 1}
    B -->|ARC-01 to ARC-04| C{Stage 2}
    C -->|GAT-01 to GAT-04 + SEC-01 to SEC-04| D{Stage 3}
    D -->|PLN-01 to PLN-04| E{Stage 4}
    E -->|BLD-01 to BLD-04 + Human Confirm| F[.hermes/skills/]

    C -->|If auth/payment/upload| S[Security Review]
    S -->|SEC-01 to SEC-04| D
```

---

> **Last Updated**: 2026-06-03
> **Version**: 1.0.0
> **Replaces**: framework.md Section 10 (50-point gates)
