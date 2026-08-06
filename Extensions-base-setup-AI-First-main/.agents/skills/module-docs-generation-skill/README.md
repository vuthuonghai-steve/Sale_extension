# module-docs-generation-skill — Capability Summary Generator

Sinh **đúng 1 file** capability summary cho module: `Docs/Module-Capabilities/{module-name}.md` — 7 section, zero code, read-only trên `src/**`. Mô tả khả năng module cho người đọc docs/BA/PM, không phải spec thiết kế.

- **Version**: 1.2.0
- **Skill schema**: 3.0.0
- **Status**: indexed

## Khái niệm Module (v1.2.0)

Module = đơn vị triển khai độc lập, **chỉ đảm nhiệm 1 vai trò + chức năng chuyên biệt duy nhất**; mỗi module là **1 node / mắt xích input** cung cấp cho module khác. Độc lập + chuyên biệt → bảo trì hiệu quả.

| Loại | Vai trò | Đặc điểm | Ví dụ |
|---|---|---|---|
| **Functional Module** (chức năng, chạy nền) | Đảm nhiệm đúng 1 chức năng (backend) | Contract rõ INPUT/OUTPUT/HANDLE; có debug + log; KHÔNG có màn hình UI | message-extraction (chỉ trích xuất tin nhắn), data-normalization (chỉ chuẩn hóa + lưu trữ) |
| **UI Module** (giao diện, UI-UX) | Làm UI cho hệ thống | KHÔNG tự xây chức năng như module chức năng; được phép CALL functional module để hỗ trợ xây dựng UI | màn hình test/debug cho message-extraction (vừa phục vụ test, vừa là feature phát sinh hữu ích) |

**Pattern Deviation Check**: mỗi lần phân tích/ghi tài liệu, skill bắt buộc chấm tiêu chí kiến trúc (functional: F1-F4 + C1-C2; ui: U1-U2 + C1-C2) với bằng chứng file → OK/WARN/FAIL. FAIL ≥ 1 → cảnh báo `⚠️ LỆCH PATTERN KIẾN TRÚC`; chỉ WARN → `⚠️ LỆCH NHẸ`. MỌI FAIL/WARN hiển thị trung thực ở Section 7 — không giấu.

## Cách dùng (trigger phrases)

- "docs cho module X" / "tóm tắt module X" / "module X làm gì" / "capability summary cho X" (EN hoặc VI).
- Yêu cầu spec/use-cases/diagrams/chi tiết → **không dùng skill này**, delegate `feature-spec-designer` (Prompt Hierarchy, route theo INTENT).

## Input / Output Contract

| | |
|---|---|
| **Input** | `module-name` khớp regex `^[a-z0-9-]+$`; thư mục `src/domain/{module-name}/` phải tồn tại |
| **Output** | 1 file duy nhất `Docs/Module-Capabilities/{module-name}.md` (frontmatter 6 field + 7 section, no-code) |
| **Fail** | tên không hợp lệ hoặc module không tồn tại → STOP, báo lỗi chính xác, KHÔNG tạo file |

## 4-Phase Workflow

1. **Validate** — regex module-name, glob `src/domain/`, Prompt Hierarchy gate (intent spec/use-cases → delegate feature-spec-designer).
2. **Audit** — phân loại module (functional/ui theo taxonomy), chấm Pattern Deviation Check (F1-F4/U1-U2/C1-C2) với bằng chứng; đọc moduleMeta (`src/features/{module}/index.ts`), entities, services, use cases, adapters, events, DB tables; mọi claim phải trace về file đã đọc; redact secret-like → `[REDACTED]`.
3. **Synthesize** — áp dụng rules + template, 7 section, sanitize trước interpolate, đối chiếu `Docs/tree_work.md` + spec hiện có (link-only, không viết lại).
4. **Verify** — chạy checklist binary (`loop/module-docs-checklist.md`, 8 gates); PASS → emit, FAIL → revise.

## Output Structure (7 section)

Frontmatter: `generated_at`, `last_verified`, `status`, `source_skill`, `module_type` (`functional` | `ui`), `description` (mô tả chức năng module — nguồn `moduleMeta.description`).

1. **Overview** — module làm gì, loại module (functional/ui) + lý do phân loại, vị trí trong hệ thống.
2. **Capabilities** — năng lực cốt lõi, mỗi claim trace nguồn.
3. **Boundaries** — giới hạn, phạm vi, edge cases (dual adapter lineage, missing moduleMeta).
4. **Cross-Module Links** — cầu nối use-case ↔ service giữa module.
5. **Infrastructure Mapping** — adapters, DB tables, repository lineage.
6. **Docs References** — link tree_work.md + spec (kiểm tra tồn tại trước khi link; thiếu → "Không có spec").
7. **Architecture Pattern Check** — kết quả chấm tiêu chí kiến trúc (OK/WARN/FAIL + bằng chứng) + kết luận TUÂN THỦ / LỆCH NHẸ / LỆCH PATTERN KIẾN TRÚC.

## Zones

| Zone | Path |
|---|---|
| core | `SKILL.md` |
| knowledge | `knowledge/module-docs-rules.md` |
| templates | `templates/module-capability.md.template` |
| data | `data/drc.yaml` |
| loop | `loop/module-docs-checklist.md` |
| assets | `assets/examples/message-extraction.md`, `assets/examples/data-normalization.md` |

## Progressive Disclosure

- **Tier 1**: `SKILL.md`, `loop/module-docs-checklist.md`
- **Tier 2**: `knowledge/module-docs-rules.md`, `data/drc.yaml`
- **Tier 3**: `templates/module-capability.md.template`, `assets/examples/*`

## Files

- Rules: `.claude/skills/module-docs-generation-skill/knowledge/module-docs-rules.md`
- Template: `.claude/skills/module-docs-generation-skill/templates/module-capability.md.template`
- DRC (routing contract): `.claude/skills/module-docs-generation-skill/data/drc.yaml`
- Checklist (verification gate): `.claude/skills/module-docs-generation-skill/loop/module-docs-checklist.md`
- Examples (WORM): `.claude/skills/module-docs-generation-skill/assets/examples/`
- Output mẫu: `Docs/Module-Capabilities/*.md`

## Pipeline Provenance

- Pipeline: build (9 stages, 2026-08-01) — PASS toàn bộ (Stage 4 sandbox 5/5, security re-review 6/6 FIXED).
- v1.2.0 (2026-08-01): định nghĩa lại Module Taxonomy (functional/ui) + Pattern Deviation Check (F1-F4/U1-U2/C1-C2) tại Section 7; frontmatter 6 field (thêm module_type); checklist 8 gates (thêm Gate 6 trung thực).
- Chi tiết: `.skill-context/module-docs-generation-skill/_orchestration_log.md`, `verification/verification.md`.
