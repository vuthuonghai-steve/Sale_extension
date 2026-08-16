---
name: context-before-fix
description: 'Skill phân tích scope vấn đề trước khi fix. Trigger khi user/agent có issue, bug, cần sửa, hoặc thêm mới tính năng. Output: scope context document tại Docs/context-to-work/{feature-name}/. KHÔNG sửa code — chỉ document findings.'
category: problem-analysis
version: '1.0.0'
author: 'Steve Void Team'
tags: [scoping, impact-analysis, context-documentation, vietnamese, csharp-winforms]
---

# Context Before Fix — Problem Scoping Skill

## Mission

Skill này **CHỈ DOCUMENT** — không sửa code. Trước khi fix bất kỳ vấn đề nào, agent phải:

1. Xác định scope thực sự của vấn đề
2. Map impact đầy đủ qua các tầng (0_Shared, 1_Backend, 2_Frontend)
3. Document findings vào file riêng
4. Trả về context cho việc fix sau

<instructions>
## Boot Sequence

1. Đọc `SKILL.md` (file này)
2. Đọc `knowledge/output-schema.md` — Output document structure
3. Đọc `knowledge/scoping-patterns.md` — Cách trace relationships trong C# / WinForms Clean Layered Architecture
4. Tiến hành 4-Step Workflow

## 4-Step Workflow

### Step 1: INPUT ACCEPTANCE

- Nhận issue description (text/log/error/trace)
- Xác định entry point (file/component/service/hook/adapter)
- Hỏi user để làm rõ nếu cần

### Step 2: SCOPE DISCOVERY

- Tìm tất cả file liên quan (grep/search_files patterns)
- Map call chain (ai gọi ai, ai được gọi)
- Tìm shared dependencies và contracts (`0_Shared`, `1_Backend/Contracts`)

### Step 3: IMPACT ANALYSIS

- Tính năng bị ảnh hưởng trực tiếp (Direct components/services)
- Tính năng bị ảnh hưởng gián tiếp (Upstream callers / Downstream listeners)
- Data flow & State propagation bị ảnh hưởng
- Contracts/Interfaces bị break hoặc cần mở rộng

### Step 4: DOCUMENT GENERATION

- Ghi nhận TẤT CẢ findings
- KHÔNG đưa ra giải pháp fix trực tiếp vào source code
- Lưu vào `Docs/context-to-work/{feature-name}/scope.{YYYY-MM-DD}.md`
- Trả về đường dẫn document + summary
</instructions>

---

## Core Constraints

```yaml
must:
  - document all findings
  - use Vietnamese language in output
  - write output to Docs/context-to-work/{feature-name}/
  - ask user when uncertain (confidence < 60%)
  - trace all findings to specific files/lines
  - respect 3-layer architecture boundaries (0_Shared, 1_Backend, 2_Frontend)

must_not:
  - edit source code
  - create branches
  - run destructive commands
  - deploy anything
  - delete files
  - provide premature fix code without scoping approval

priority_order:
  - understanding_scope
  - mapping_impact
  - documenting_findings
  - NO_code_changes
```

---

## Confidence Handling

```yaml
confidence_threshold: 60

confidence_levels:
  above_85:
    meaning: 'Tin chắc findings chính xác'
    action: 'Proceed to generate doc'

  60_to_85:
    meaning: 'Khá chắc, có một số uncertainties'
    action: 'Document with uncertainty flags'

  below_60:
    meaning: 'Không chắc chắn'
    action: 'STOP — Ask user for clarification'
```

---

## Tools

```yaml
primary_tools:
  - grep_search # ripgrep patterns để tìm related files
  - view_file # inspect actual content
  - write_to_file # generate output document
  - send_message / ask # trao đổi khi uncertain

reasoning:
  - LLM analyze relationships
  - trace logic chains across 0_Shared -> 1_Backend -> 2_Frontend
  - identify architectural patterns & boundary violations
```

---

## Output Contract

```yaml
output_contract:
  path_pattern: 'Docs/context-to-work/{feature-name}/scope.{YYYY-MM-DD}.md'

  sections:
    - Problem Summary
    - Entry Point
    - Scope Definition
    - Impact Analysis (Direct + Indirect)
    - Call Chain
    - Data Flow
    - Affected Components
    - Evidence
    - Confidence Assessment
    - Open Questions

  format: Markdown + YAML (theo know.md standards)
  language: Vietnamese
```

---

## Progressive Disclosure

```yaml
Tier_1_Mandatory:
  description: 'Load always at boot'
  files:
    - SKILL.md
    - knowledge/output-schema.md

Tier_2_Conditional:
  description: 'Load when context requires'
  files:
    - knowledge/scoping-patterns.md
    - templates/scope-doc.template
    - loop/scoping-checklist.md
```

---

## Guardrails

```yaml
guardrails:
  G1_no_code_changes:
    must_not: [edit_source_code, create_branches, deploy]

  G2_ask_when_uncertain:
    condition: 'confidence < 60%'
    action: 'STOP → clarify with user'

  G3_trace_findings:
    must: [verify_with_view_file, link_to_specific_files]

  G4_vietnamese_output:
    must: [use_Vietnamese_in_document, use_Vietnamese_in_summary]
```

---

## Stop Conditions

```yaml
stop_conditions:
  - Document written to disk at correct path `Docs/context-to-work/{feature-name}/scope.{YYYY-MM-DD}.md`
  - User receives path to scope document
  - User receives summary of findings
  - Statement: 'NO CODE CHANGES — Context ready for fix phase'
```

---

## Large Codebase Fallback

```yaml
large_codebase_strategy:
  when: 'grep/search timeout hoặc >50 results'
  action:
    - Ask user to narrow scope
    - Limit search to specific module/layer (0_Shared / 1_Backend / 2_Frontend)
    - Use entry point approach (don't full scan)
  max_bounded_search:
    max_files: 20
    max_depth: 4
```

---

## Quality Checklist (self-check trước khi deliver)

```yaml
pre_delivery_check:
  - [ ] Entry point identified và verified
  - [ ] Tất cả related files đã được search
  - [ ] Impact map đầy đủ (direct + indirect qua các layer)
  - [ ] Evidence ghi nhận cụ thể (file:line)
  - [ ] Confidence assessment đã làm
  - [ ] Document viết bằng tiếng Việt
  - [ ] Document lưu đúng path pattern
  - [ ] NO code changes made
```

---

## Example

```
Input: "Lỗi không tự động nhận diện Schema khi sao chép nội dung từ Zalo"

Workflow:
1. Entry: 1_Backend/Services/SchemaDetectorService.cs
2. Discovery: grep DetectSchema → tìm Win32ClipboardListener, FormConverterService, LeadConverterStateHook
3. Impact: LeadConverterScreen, OutputPreviewBox, AppSettings
4. Output: Docs/context-to-work/zalo-schema-detection/scope.2026-08-15.md

Document summary:
- Problem: Regex schema detection mismatch với định dạng tin nhắn mới
- Scope: 4 files affected across 1_Backend & 2_Frontend
- Impact: Direct (SchemaDetectorService) + Indirect (ClipboardListener, LeadConverterStateHook)
- Confidence: 90%
- Next: Ready for fix phase
```

---

> **File**: `skills/context-before-fix/SKILL.md`
> **Version**: 1.0.0
