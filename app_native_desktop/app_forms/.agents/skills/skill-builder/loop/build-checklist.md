# Build Checklist: Skill Builder Self-Verification

## 1. Structure Check (Vùng Kiến trúc)
- [ ] Sự hiện diện của 4 Zone bắt buộc (Core, Knowledge, Scripts, Loop).
- [ ] Tuân thủ quy tắc đặt tên file: kebab-case cho resources/knowledge/scripts.
- [ ] File `SKILL.md` nằm đúng vị trí tại root của skill.

## 2. Source & Design Check (Đối chiếu Nguồn)
- [ ] Nội dung bám sát 100% bản thiết kế `design.md`.
- [ ] **Zone Contract Fidelity**: Tất cả files được tạo ĐỀU CÓ tên cụ thể trong `design.md §3` (Files cần tạo). Tuyệt đối KHÔNG tự ý tạo file/thư mục mới khác ngoài thiết kế.
- [ ] **Core Alignment**: `SKILL.md` đã tích hợp `design.md §7` (vào Boot Sequence), `§5` (Workflow Steps), và `§6` (Interaction Gates).
- [ ] Mọi mục `[CẦN LÀM RÕ]` trong `todo.md` đã được giải quyết hoặc trả lời tại `design.md §9`.
- [ ] Mọi Task trong `todo.md` đồng bộ với thực tế file đã tạo.
- [ ] Đã tạo `Resource Inventory` trong `.skill-context/{target_skill}/build-log.md`.
- [ ] Đã tạo `Resource Usage Matrix` trong `.skill-context/{target_skill}/build-log.md`.
- [ ] 100% file `Critical` (`design.md`, `todo.md`, `resources/*`, `data/*`) có evidence được dùng.

## 3. Progressive Disclosure Check (Phân tầng thông tin)
- [ ] Mọi file Tier 2 đều được dẫn link từ `SKILL.md`.
- [ ] File Tier 1 đã được đưa rõ vào 'Mandatory Boot Sequence' của `SKILL.md` dựa theo `design.md §7`.
- [ ] Không có file mồ côi (Orphan files) không được sử dụng.
- [ ] `SKILL.md` < 500 dòng.

## 4. Build-Log Template & Schema Check (build-log.schema.yaml)

- [ ] `build-log.md.template` has YAML frontmatter matching build-log.schema.yaml
- [ ] `execution_trace` array has entries with: timestamp, task_id, action, status
- [ ] `action` is one of: CREATE_FILE, MODIFY_FILE, VALIDATE, RUN_SCRIPT
- [ ] `status` is one of: success, failed, skipped
- [ ] `feedback_to_planner: []` and `feedback_to_architect: []` present
- [ ] `quality_metrics` has: placeholder_ratio (0..1), critical_tasks_done (bool), validator_pass (bool)
- [ ] `stage: "builder"` and NO handoff field (Builder is final stage)
- [ ] Comment: "Snapshot từ feedback.yaml. Builder KHÔNG update trực tiếp."

## 5. Completeness & Performance (Hoàn thiện & Chất lượng)
- [ ] Mật độ Placeholder `[MISSING_DOMAIN_DATA]` < 5 (Normal).
- [ ] **Zero-Summarization Verification**: Đã đối soát 1:1 với resources; không có hiện tượng tóm tắt hay lược bỏ chi tiết kỹ thuật.
- [ ] Script `validate_skill.py` trả về Exit Code 0 (PASS).
- [ ] Nhật ký `build-log.md` phản ánh trung thực trạng thái validation.

## 6. Engineer Stance (Thẩm định Kỹ sư)
- [ ] Đã thực hiện phản biện bản thiết kế (nếu có phi logic).
- [ ] Quy trình xử lý lỗi tuân thủ Log-Notify-Stop (Dừng ngay khi có lỗi hệ thống).
- [ ] Không có kết luận nào không truy vết được về resource hoặc design/todo.

## 7. Anthropic Skill Standards Compliance (BẮT BUỘC cho mọi SKILL.md)

> Reference: `knowledge/anthropic-skill-standards.md`

### 7.1 YAML Frontmatter
- [ ] `SKILL.md` bắt đầu bằng YAML frontmatter (`---` block) tại dòng 1.
- [ ] `name`: lowercase-kebab-case, ≤ 64 ký tự, không có reserved words.
- [ ] `description`: ngôi thứ 3, bao gồm WHAT + WHEN trigger, ≤ 1024 ký tự.
- [ ] `description` KHÔNG dùng "I can...", "You can use this to...".

### 7.2 Progressive Disclosure
- [ ] `SKILL.md` body ≤ 500 lines.
- [ ] Knowledge/template/loop files được link từ **đúng phase cần**, không phải tất cả ở Boot Sequence.
- [ ] Không có file được front-loaded mà không cần ngay từ đầu mọi invocation.
- [ ] References one level deep (không có nested: A.md → B.md → content).

### 7.3 Workflow Tracker Checklist
- [ ] Nếu skill có 3+ phases hoặc Interaction Points → có Tracker Checklist trong SKILL.md.
- [ ] Tracker Checklist yêu cầu Claude copy vào response ngay khi bắt đầu.

### 7.4 Examples Pattern
- [ ] Nếu skill có abstract mapping (schema→component, data→format, rule→output) → có examples file.
- [ ] Examples file được reference từ phase cần dùng (không front-load).
- [ ] Examples là concrete (real field names, real values) không phải trừu tượng.

### 7.5 Content Quality
- [ ] Không có time-sensitive information (ngày tháng, "before/after YYYY-MM").
- [ ] Terminology nhất quán xuyên suốt tất cả files.
- [ ] Scripts handle errors explicitly (không punt to Claude).
- [ ] Mỗi knowledge file có header `> **Usage**: ...` mô tả khi nào load.
