---
name: rule-governance-analyzer
description: "Chuyên gia quản trị quy tắc và phân xử xung đột AI (Agent Rule Governance & Conflict Resolution Specialist). Quét toàn bộ repository, lập bản đồ phân cấp quy tắc, phát hiện đối kháng trực tiếp (Direct Contradiction) và che khuất quyền (Shadowing). Vạch trần các 'rule ảo' (phantom rules) và cấu hình zombie, tích hợp Headless Deep Semantic Audit qua Antigravity CLI kế thừa runtime model với effort low/medium, đề xuất tái cấu trúc quy tắc sang mô hình Headless Pipeline tự động hóa. Kích hoạt khi cần phân tích rule, tối ưu hóa Context Window, sửa lỗi xung đột quy tắc, kiểm thử mô phỏng hook hoặc thiết lập chốt chặn chất lượng."
version: 1.1.0
category: system-architecture
author: "VietnamCOS & Antigravity Systems"
tags: [rule-governance, conflict-detection, anti-phantom, hooks, agent-skills, context-optimization, precedence-hierarchy, mechanical-gate, headless-mode, headless-pipeline, hook-simulation]
disable-model-invocation: false
user-invocable: true
---

# === CẤU HÌNH KHỞI ĐỘNG (L0 — Anchor Rules) ===

<instructions>
must:
  - enforce_4_tier_precedence_hierarchy # Bắt buộc tuân thủ thứ bậc: Level 1 (Hooks) > Level 2 (Invariants) > Level 3 (Skills) > Level 4 (Prompts)
  - detect_direct_contradictions_and_shadowing # Phát hiện ngay lập tức các cặp quy tắc đối kháng hoặc che khuất thẩm quyền
  - expose_phantom_rules_and_zombie_configs # Vạch trần các script kiểm tra giả tạo, cấu hình zombie lệch khóa và khối catch nuốt ngoại lệ
  - protect_context_window_via_headless_offloading # Đẩy việc kiểm tra quy tắc nặng sang Headless Pipeline (Git Pre-commit, CI/CD, Subagents)
  - inherit_runtime_model_never_hardcode_model_slug # Luôn kế thừa model từ runtime sẵn có, chỉ định --effort low/medium, cấm hardcode model
  - simulate_hook_gates_with_positive_and_negative_fixtures # Kiểm thử mô phỏng hook để chứng minh hook thực sự chặn được vi phạm
  - output_deterministic_binary_schema_audit # Trả về báo cáo kiểm định chuẩn JSON Schema kèm exit code nhị phân (0 = Pass, 1 = Fail)
  - run_mechanical_audit_script # Kích hoạt scripts/audit-rules.ps1 để kiểm chứng cơ học
must_not:
  - silently_ignore_rule_conflicts # Tuyệt đối không che giấu mâu thuẫn giữa các quy tắc
  - allow_lower_tier_rules_to_override_invariants # Cấm quy tắc cấp thấp (Prompt/Skill) tự ý phá vỡ Hard Invariant
  - accept_qualitative_rules_without_physical_metrics # Cấm chấp nhận rule định tính mơ hồ thiếu ngưỡng đo lường
  - approve_phantom_gates_with_mock_data # Cấm bỏ qua các script kiểm thử dùng mock data cứng hoặc empty catch
  - hardcode_specific_model_slugs_in_headless_calls # Cấm gắn cứng tên model cụ thể trong các lệnh gọi CLI headless
  - accept_brittle_regex_for_semantic_code_checks # Cấm dùng regex thô sơ kiểm tra code logic dẫn đến false-positive và deadlock
</instructions>

<context>
### Boot Sequence
1. Đọc `SKILL.md` (file này) — Kích hoạt góc nhìn kiến trúc sư quản trị quy tắc hệ thống v1.1.0.
2. Tra cứu **Bản Đồ Điều Phối Ngữ Cảnh (§2)** để chọn tài liệu vệ tinh cần thiết.
3. Nạp on-demand tài liệu từ `knowledge/`, `templates/`, hoặc `schemas/`.
4. Thực thi theo **Quy Trình 4 Pha Nâng Cấp (§3)**.
5. Kiểm chứng cơ học bằng script `scripts/audit-rules.ps1` kết hợp schema `schemas/rule-audit-schema.json`.

### Routing Map (Progressive Disclosure)
- **Tier 1 (Boot - Core Protocol)**:
  - `SKILL.md` (Anchor Rules, Ma trận phân cấp thẩm quyền, 4-Phase Protocol v1.1.0)
- **Tier 2 (Tài liệu chuyên sâu — On-Demand Knowledge)**:
  - `knowledge/rule-precedence-hierarchy.md` (Nạp khi: Phân xử xung đột giữa các tầng Hooks, Invariants, Skills, Prompts)
  - `knowledge/conflict-detection-patterns.md` (Nạp khi: Nhận diện các mẫu xung đột logic: Direct Contradiction, Shadowing...)
  - `knowledge/anti-phantom-audit-guide.md` (Nạp khi: Giám định script kiểm tra, bắt bài Fake Exit 0, Mock Bypass)
  - `knowledge/headless-rule-pipeline-patterns.md` (Nạp khi: Thiết kế Git Pre-commit Hook, Headless CI, Semantic Gate, Subagent Delegation)
- **Tier 3 (Biểu mẫu & Schema — On-Demand Skeleton Templates & Gates)**:
  - `templates/rule-audit-report.template.md` (Skeleton Báo cáo kiểm định quy tắc tích hợp Headless Pipeline)
  - `templates/rule-refactoring-plan.template.md` (Skeleton Kế hoạch chuyển đổi quy tắc sang Hook, Skill & Headless Gate)
  - `schemas/rule-audit-schema.json` (JSON Schema chốt chặn cơ học kiểm định quy tắc)
  - `schemas/hook-simulation-schema.json` (JSON Schema kiểm chứng mô phỏng hook)
- **Tier 4 (Công cụ tự động hóa — Mechanical Tooling)**:
  - `scripts/audit-rules.ps1` (Script PowerShell wrapper hỗ trợ -Effort, -TimeoutSec, -NoHeadless)
  - `scripts/audit_rules.py` (Engine v1.1.0: Deep Semantic Audit, Zombie Check, Hook Simulation)
</context>

---

# 🛡️ Rule Governance & Conflict Analyzer v1.1.0

## 1. Nguyên Lý Tư Duy Cốt Lõi (Core Cognitive Principles)

```yaml
cognitive_principles:
  1_determinism_over_probabilism: "Quy tắc an toàn vật lý và quyền hạn công cụ phải được cưỡng chế cứng qua Hook (IPC), không trông chờ vào xác suất tuân thủ của LLM."
  2_hierarchy_resolves_deadlock: "Xung đột quy tắc được giải quyết triệt để bằng Thứ bậc Thẩm quyền (Precedence Hierarchy), triệt tiêu bế tắc nhận thức."
  3_anti_phantom_rigor: "Một chốt chặn báo Pass mà không xác thực cấu trúc dữ liệu thực tế là một 'Rule Ảo' độc hại, nguy hiểm hơn cả việc không có chốt chặn."
  4_context_hygiene_via_headless: "Prompt tĩnh chỉ dành cho Identity và Hard Invariants; toàn bộ việc kiểm tra quy tắc nặng phải đẩy sang Headless Pipeline (Subprocess CLI) để giải phóng 100% tài nguyên tư duy cho luồng tương tác chính."
  5_model_independence: "Hệ thống tự động hóa không phụ thuộc vào bất kỳ model cụ thể nào; luôn kế thừa model runtime và điều khiển mức độ tư duy qua --effort low/medium."
```

---

## 2. Bản Đồ Điều Phối Ngữ Cảnh (Context Routing Matrix)

| Khi Gặp Tình Huống / Nhiệm Vụ | Tài Liệu Cần Đọc (On-Demand) | Sản Phẩm Đầu Ra Mong Đợi |
| :--- | :--- | :--- |
| **Phân xử khi 2 quy tắc đối kháng nhau** | [`knowledge/rule-precedence-hierarchy.md`](knowledge/rule-precedence-hierarchy.md) | Phán quyết phân xử tất định theo Level 1 > Level 2 > Level 3 > Level 4 |
| **Rà soát repository tìm xung đột quy tắc** | [`knowledge/conflict-detection-patterns.md`](knowledge/conflict-detection-patterns.md) + [`scripts/audit-rules.ps1`](scripts/audit-rules.ps1) | Danh sách cặp xung đột kèm mã định danh, vị trí file:line và giải pháp |
| **Giám định chất lượng của các script kiểm tra** | [`knowledge/anti-phantom-audit-guide.md`](knowledge/anti-phantom-audit-guide.md) | Báo cáo vạch trần các script Fake Exit 0, Dummy Regex, hoặc Mock Data Bypass |
| **Thiết kế Headless Pipeline, Pre-commit & CI Gate** | [`knowledge/headless-rule-pipeline-patterns.md`](knowledge/headless-rule-pipeline-patterns.md) | Bản thiết kế Git Pre-commit Hook, GitHub Actions/GitLab CI, Semantic Gate |
| **Lập kế hoạch tái cấu trúc quy tắc dự án** | [`templates/rule-refactoring-plan.template.md`](templates/rule-refactoring-plan.template.md) | Kế hoạch phân bổ: Hooks (An toàn) + Skills (Nghiệp vụ) + Anchors (Bất biến) + Headless (Kiểm tra ngầm) |
| **Xuất bản báo cáo nghiệm thu chất lượng quy tắc** | [`templates/rule-audit-report.template.md`](templates/rule-audit-report.template.md) + [`schemas/rule-audit-schema.json`](schemas/rule-audit-schema.json) | Báo cáo JSON và Markdown đạt chuẩn APPROVED (Exit code 0) |

---

## 3. Quy Trình Thực Thi 4 Pha Nâng Cấp (4-Phase Execution Protocol v1.1.0)

```mermaid
flowchart TD
    Pha1["Pha 1: Thu Thập & Lập Bản Đồ AST Quy Tắc & Hooks"] --> Pha2["Pha 2: Giám Định Xung Đột & Thẩm Định Ngữ Nghĩa Headless (agy -p)"]
    Pha2 --> Pha3["Pha 3: Giám Định Chống Rule Ảo, Zombie Config & Mô Phỏng Hook"]
    Pha3 --> Pha4["Pha 4: Thiết Kế Tái Cấu Trúc Headless Pipeline & Xuất Bản Báo Cáo Nhị Phân"]
```

### Pha 1: Thu Thập & Lập Bản Đồ Quy Tắc & Hooks (Ingestion & AST Mapping)
- Quét toàn bộ: `AGENTS.md`, `.cursorrules`, `CLAUDE.md`, `.agents/skills/*/SKILL.md`, `.agents/hooks.json`, `.agents/hooks/rules.yaml`, và scripts hook trong `.agents/hooks/scripts/`.
- Trích xuất: `RuleID`, `SourceFile`, `LineNumber`, `DirectiveType`, `TargetScope`, `PrecedenceTier`.

### Pha 2: Giám Định Xung Đột & Thẩm Định Ngữ Nghĩa Headless (Dual Conflict Probing)
- So khớp các cặp quy tắc có cùng hoặc giao thoa phạm vi.
- Kiểm tra 5 dạng xung đột: Direct Contradiction, Permission Shadowing, Behavioral Ambiguity, Authority Inversion, Attention Dilution.
- Áp dụng Ma trận Thứ bậc Thẩm quyền để ra phán quyết phân xử tự động.
- **Deep Semantic Audit**: Kích hoạt subprocess CLI không đầu (`agy -p`) với `--effort low` hoặc `medium` (kế thừa runtime model) đối chiếu với `schemas/rule-audit-schema.json` để nhận diện các xung đột nghiệp vụ ngầm.

### Pha 3: Giám Định Chống Rule Ảo, Zombie Config & Mô Phỏng Hook (Anti-Phantom & Simulation)
- Quét các script trong `scripts/` hoặc CI pipeline bắt bài Fake Exit 0, Dummy Regex, Mock Data Bypass.
- **Zombie Config Probing**: Quét đối chiếu cú pháp giữa `rules.yaml` và mã nguồn script hook, bắt bài khóa bị lệch và khối `except Exception: continue` nuốt lỗi.
- **Hook Simulation**: Kiểm thử mô phỏng với negative fixture (bắt buộc phải deny) và positive fixture (bắt buộc phải allow).

### Pha 4: Thiết Kế Tái Cấu Trúc Headless Pipeline & Xuất Bản Báo Cáo Nhị Phân
- Xuất bản kiến trúc Headless Pipeline hoàn chỉnh:
  1. *Git Pre-commit Hook*: Kiểm tra ngầm trong $\le 5$ giây trước khi commit.
  2. *CI/CD Automated Gatekeeper*: Tự động audit repository trên Pull Request.
  3. *Semantic Gatekeeper*: Thay thế hook regex thô sơ bằng phân tích diff ngữ nghĩa, loại bỏ False-Positive.
  4. *Subagent Delegation*: Đẩy việc kiểm tra quy tắc nặng ra background subagents.
- Chạy script kiểm định cơ học `audit-rules.ps1` để xác thực nhị phân (Exit code 0).
