# Binary Quality Gate Checklist: `module-docs-generation-skill` (v1.2.0)

> Applied before emit (Phase 4 Verify). Rule: PASS = (Check 1) AND (Check 2) AND ... AND (Check N). FAIL → Revise draft → re-run (TC-04).

## Gate 1 — Đúng 1 file, đúng path (AC-1, TC-01)
- [ ] File duy nhất tồn tại tại `Docs/Module-Capabilities/{module-name}.md`? (không có file khác trong thư mục này từ skill)

## Gate 2 — No-Code (AC-2, NFR-01, TC-04)
- [ ] `grep -c '^```'` output = 0 (không block code)?
- [ ] `grep -n 'import'` output = 0 (không trích source/import)?
- [ ] Không có TODO/TBD/placeholder filename (xxx.md) trong output?
- [ ] Không có `|` đầu cell bảng không hợp lệ (sanitize pipe từ dữ liệu audit đã làm — SEC-02)?
- [ ] Không có secret-like value (key/token/password/secret pattern) trong output — chỉ `[REDACTED]` (SEC-03)?

## Gate 3 — Đủ 7 Section (AC-3, v1.2.0)
- [ ] Section 1 Overview — 3-5 dòng, moduleMeta + **loại module (functional/ui) + lý do phân loại** + tree_work status?
- [ ] Section 2 Capabilities — 4 loại (entity/service/use case/adapter), 10-30 dòng, no-code?
- [ ] Section 3 Boundaries — events in/out + input files + DB tables + gates, ≤15 dòng?
- [ ] Section 4 Cross-Module Links — use case cầu nối hoặc `not applicable`, ≤10 dòng?
- [ ] Section 5 Infrastructure Mapping — adapter→port→table, dual lineage đủ 2 bản, ≤15 dòng?
- [ ] Section 6 Docs References — link spec.md (nếu có) + tree_work.md, chỉ link, ≤10 dòng?
- [ ] Section 7 Architecture Pattern Check — đủ tiêu chí theo loại module (functional: F1-F4 + C1-C2; ui: U1-U2 + C1-C2), mỗi tiêu chí có kết quả + bằng chứng file, ≤15 dòng + kết luận?

## Gate 4 — Không trùng vai trò feature-spec-designer (AC-5)
- [ ] Output nằm tại `Docs/Module-Capabilities/`, KHÔNG tại `Docs/Specs/{feature-name}/`?
- [ ] Không có bộ multi-file (normalizations/use-cases/architecture-overview/submodule-decomposition/diagrams)?

## Gate 5 — Frontmatter 6 field (AC-7, v1.2.0)
- [ ] Frontmatter có đủ 6 field: `generated_at` (ISO), `last_verified` (ISO), `status` (verified|stale), `source_skill: "module-docs-generation-skill"`, `module_type` (giá trị đúng `functional` | `ui` — khớp phân loại ở Section 1), `description` (mô tả chức năng module — nguồn moduleMeta.description, không phải text tùy ý)?

## Gate 6 — Pattern Check trung thực (v1.2.0 — mới)
- [ ] Mọi FAIL/WARN phát hiện trong audit đều được hiển thị ở Section 7 — không giấu, không hạ cấp kết quả (OK thay vì WARN/FAIL)?
- [ ] Mỗi tiêu chí có bằng chứng (tên file đã đọc), không ghi kết quả không nguồn?
- [ ] Kết luận đúng quy tắc: FAIL ≥ 1 → `⚠️ LỆCH PATTERN KIẾN TRÚC`; chỉ WARN → `⚠️ LỆCH NHẸ`; toàn OK → `✅ TUÂN THỦ`?
- [ ] Khuyến nghị (nếu có) theo định hướng tách module/thêm contract/thêm log/bỏ phụ thuộc — không khuyến nghị gộp module?

## Gate 7 — Đối chiếu nguồn (AC-6, NFR-03)
- [ ] Đã đối chiếu `Docs/tree_work.md` — trạng thái đăng ký module đúng?
- [ ] Spec hiện có tại `Docs/Specs/{module-name}/` được link, KHÔNG viết lại nội dung?
- [ ] Spec link chỉ ghi khi target `Docs/Specs/{module-name}/spec.md` đã verify tồn tại; thiếu → ghi `Không có spec`, không ghi link chết (SEC-05)?
- [ ] Output KHÔNG còn blockquote `> Tóm tắt khả năng module` (phần tóm tắt đã chuyển vào frontmatter `description`)?

## Gate 8 — Phạm vi (AC-4, AC-8)
- [ ] Features UI chỉ liệt kê entry points (tên screen/hook), không mô tả UI chi tiết?
- [ ] Không sửa `src/**`, không commit/push/merge (git status sạch ngoài file docs)?

---
**Result**: ALL checked → PASS → Emit + báo cáo. ANY unchecked → FAIL → Revise draft → re-run checklist.
