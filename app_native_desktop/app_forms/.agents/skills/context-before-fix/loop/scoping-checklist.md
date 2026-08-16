# Scoping Checklist — Quality Gates

> **Purpose**: Self-check trước khi deliver scope document
> **Skill**: context-before-fix v1.0.0
> **Language**: Tiếng Việt

---

## Pre-Scoping Checks

```yaml
pre_scoping:
  - [ ] Issue description rõ ràng
  - [ ] Entry point đã được xác định trong 3-layer architecture
  - [ ] Layer liên quan (0_Shared, 1_Backend, 2_Frontend) đã được phân loại
  - [ ] User đã confirm scope (nếu cần)
```

---

## Discovery Phase Checks

```yaml
discovery_checks:
  entry_point_verified:
    - [ ] Entry point đã được view_file để confirm
    - [ ] Entry point line(s) đã được ghi nhận
    - [ ] Interface / Class contract đã được đọc

  related_files_found:
    - [ ] Grep đã chạy cho entry point / class / method
    - [ ] Kết quả grep đã được review
    - [ ] ≥1 related files đã được xác định

  call_chain_traced:
    - [ ] Forward search (method gọi những service/adapter nào) đã chạy
    - [ ] Backward search (ai gọi method / ai subscribe event) đã chạy
    - [ ] Dependency injection chain trong Program.cs đã được trace
```

---

## Analysis Phase Checks

```yaml
analysis_checks:
  impact_mapping_complete:
    direct_impact:
      - [ ] Tất cả directly affected files đã được list
      - [ ] Specific line(s) đã được note
      - [ ] Bản chất của issue đã được mô tả rõ

    indirect_impact:
      - [ ] Callers đã được xác định
      - [ ] Subscribers / UI components đã được xác định
      - [ ] Shared contracts / enums đã được note

    contracts_and_thread_safety:
      - [ ] Affected interfaces đã được identified
      - [ ] Yêu cầu InvokeOnUI (nếu cập nhật giao diện từ background) đã được note

  data_flow_traced:
    - [ ] Input data sources đã được xác định (Clipboard / User Input / Storage)
    - [ ] Output destinations đã được xác định (PreviewBox / System Tray / File)
    - [ ] Data transformations đã được noted

  evidence_collected:
    - [ ] Mỗi finding có file:line cụ thể
    - [ ] Evidence blocks đã được tạo
    - [ ] Không có giả định thiếu kiểm chứng
```

---

## Confidence Assessment Checks

```yaml
confidence_checks:
  overall:
    - [ ] Confidence score đã được tính toán
    - [ ] Score ≥ 60% → proceed
    - [ ] Score < 60% → STOP and ask user

  breakdown_review:
    - [ ] entry_point_identification: đã verify = view_file
    - [ ] impact_mapping: đã verify = grep + view_file
    - [ ] call_chain_trace: đã verify = multiple search passes
    - [ ] evidence_verification: đã verify = view_file actual content

  uncertainty_flags:
    - [ ] Tất cả uncertainties đã được flag
    - [ ] User đã được notify về low confidence areas
```

---

## Output Quality Gates

```yaml
output_checks:
  document_structure:
    - [ ] Template structure đã được tuân thủ
    - [ ] Tất cả sections đã được điền đầy đủ
    - [ ] Không còn placeholder hoặc TODO

  language_compliance:
    - [ ] Tiếng Việt được sử dụng xuyên suốt tài liệu
    - [ ] Không pha trộn ngôn ngữ gây hiểu nhầm

  path_compliance:
    - [ ] Path = `Docs/context-to-work/{feature-name}/scope.{YYYY-MM-DD}.md`
    - [ ] Directory đã được chuẩn bị
    - [ ] File extension = .md

  file_quality:
    - [ ] Tuyệt đối KHÔNG có code modifications trong source code
    - [ ] Không đưa ra fix code vội vàng
    - [ ] Chỉ document findings và phạm vi ảnh hưởng
```

---

## Final Declaration

```yaml
final_checks:
  before_deliver:
    - [ ] Tuyên bố "NO CODE CHANGES" có trong output
    - [ ] Đường dẫn tới scope document được trả về cho user
    - [ ] Tóm tắt ngắn gọn findings (≤ 5 bullets)
    - [ ] Nêu rõ các bước tiếp theo cho giai đoạn fix

  delivery_format:
    - [ ] Document path clearly stated
    - [ ] Summary concise
    - [ ] Confidence level stated
```

---

## Gating Rules

```yaml
gate_rules:
  pass_all:
    - "Pre-Scoping" section must pass
    - "Discovery Phase" section must pass
    - "Analysis Phase" section must pass
    - "Confidence" section must pass
    - "Output" section must pass

  fail_any:
    - "Confidence below 60%" → STOP → ask user
    - "No entry point identified" → STOP → ask user
    - "No evidence collected" → STOP → gather more evidence
    - "Path compliance failed" → fix path before deliver
```

---

> **File**: `skills/context-before-fix/loop/scoping-checklist.md`
> **Version**: 1.0.0
