# Báo Cáo Kiểm Định Quản Trị Quy Tắc (Rule Governance Audit Report)

> **Mã báo cáo**: `[AUDIT-RULE-XXX]`  
> **Thời gian thực hiện**: `[YYYY-MM-DD HH:mm:ss]`  
> **Phạm vi kiểm tra**: `[Toàn bộ Repository / Danh sách file cấu hình / Thư mục Hooks]`  
> **Trạng thái kiểm định**: `[APPROVED / REJECTED]`  
> **Động cơ phân tích**: Static Rule Scanner kết hợp Headless Deep Semantic Audit (Antigravity CLI)

---

## 1. Bản Đồ Quy Tắc Đã Quét (Mapped Rules Summary)

- **Tổng số quy tắc phát hiện**: `[Số lượng]`
- **Phân bổ theo tầng thẩm quyền**:
  - *Level 1 (Deterministic Hard Hooks)*: `[Số lượng]` quy tắc
  - *Level 2 (Repository Hard Invariants)*: `[Số lượng]` quy tắc
  - *Level 3 (Active Domain Skills)*: `[Số lượng]` quy tắc
  - *Level 4 (Interactive Prompts / Guidelines)*: `[Số lượng]` quy tắc

| Mã Rule | Nguồn Tập Tin | Dòng | Loại Mệnh Lệnh | Phạm Vi (Scope) | Tầng Thẩm Quyền | Tóm Tắt Quy Tắc |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `[R-01]` | `[File Path]` | `[Line]` | `[MUST / MUST_NOT]` | `[Tool/Process]` | `[L1/L2/L3/L4]` | `[Nội dung ngắn gọn]` |

---

## 2. Danh Sách Xung Đột Phát Hiện (Detected Rule Conflicts)

### Xung Đột `[CONF-01]`: `[Tên Xung Đột]`
- **Mức độ nghiêm trọng**: `[CRITICAL / MAJOR / MINOR]`
- **Kiểu xung đột**: `[Direct Contradiction / Permission Shadowing / Behavioral Ambiguity / Authority Inversion]`
- **Quy tắc A**: `[R-XX]` tại `[File A:Line A]` — *"[Trích dẫn nội dung Rule A]"*
- **Quy tắc B**: `[R-YY]` tại `[File B:Line B]` — *"[Trích dẫn nội dung Rule B]"*
- **Phán quyết phân xử thẩm quyền**: `[Quy tắc nào thắng cuộc dựa theo Precedence Hierarchy]`
- **Khuyến nghị khắc phục**: `[Hành động cụ thể để triệt tiêu xung đột]`

---

## 3. Giám Định Chống "Rule Ảo", Zombie Configs & Silent Fallback

### 3.1. Bảng Giám Định Script Kiểm Tra & Chốt Chặn Giả Tạo
- **Tổng số script kiểm tra đã quét**: `[Số lượng script]`
- **Script đạt chuẩn kiểm chứng cơ học nhị phân**: `[Số lượng]`
- **Script nghi ngờ "Rule Ảo" (Phantom Gates)**: `[Số lượng]`

| Đường Dẫn Script | Dạng Rule Ảo | Vấn Đề Nhận Diện | Hành Động Nâng Cấp Yêu Cầu |
| :--- | :--- | :--- | :--- |
| `[scripts/xxx.ps1]` | `[Dummy Regex / Fake Exit 0]` | `[Mô tả lỗi]` | `[Bổ sung JSON Schema và exit code chuẩn]` |

### 3.2. Bảng Giám Định Zombie Configuration & Silent Fallback
| Tập Tin Cấu Hình | Khóa Lệch / Bị Bỏ Qua | Script Bị Ảnh Hưởng | Hậu Quả Kỹ Thuật | Hành Động Đồng Bộ |
| :--- | :--- | :--- | :--- | :--- |
| `[rules.yaml]` | `[tên_khóa]` | `[gate_xxx.py]` | `[Script fallback âm thầm, YAML bị vô hiệu hóa]` | `[Đồng bộ tên khóa trong Python AST]` |

---

## 4. Kết Quả Kiểm Thử Mô Phỏng Hook (Hook Simulation Results)

- **Tổng số Hook Scripts kiểm thử**: `[Số lượng]`
- **Số Hook đạt chuẩn VERIFIED**: `[Số lượng]`
- **Số Hook lỗi (BROKEN_GATE_DEFECT)**: `[Số lượng]`

| Tên Hook Script | Sự Kiện Vòng Đời | Negative Fixture (Phải Deny) | Positive Fixture (Phải Allow) | Kết Quả Mô Phỏng |
| :--- | :--- | :--- | :--- | :--- |
| `[gate_placeholder_pre.py]` | `PreToolUse` | `[PASS - Đã chặn code chứa vi phạm]` | `[PASS - Đã cho qua code sạch]` | ✅ VERIFIED |

---

## 5. Điểm Chất Lượng Quản Trị (Quality Governance Scores)

- [ ] **Conflict Freedom Score**: `[X]%` (Mục tiêu $\ge 85\%$)
- [ ] **Phantom Immunity Score**: `[Y]%` (Mục tiêu $\ge 85\%$)
- [ ] **Context Efficiency Score**: `[Z]%` (Mục tiêu $\ge 85\%$)
- **OVERALL SCORE**: `[Score]%` ➔ **KẾT LUẬN**: `[APPROVED / REJECTED]`

---

## 6. Bản Thiết Kế Kiến Trúc Headless Pipeline (Headless Architecture Blueprint)

### 6.1. Tách Rời Luồng Nhận Thức (Cognitive Load Offloading)
- **Tầng Tĩnh (Interactive Session)**: Chỉ lưu trữ $\le 7$ Hard Invariants cốt lõi trong `AGENTS.md` (~500 tokens).
- **Tầng Động (Headless Sub-process)**: Toàn bộ kiểm tra cú pháp, ranh giới kiến trúc và logging được đẩy ra:
  1. *Git Pre-commit Hook*: Chạy `agy -p` kiểm tra staged diff trong $\le 5$ giây (kế thừa runtime model, `--effort low`).
  2. *Headless CI/CD Gatekeeper*: Tự động audit repository trên Pull Request.
  3. *Semantic Gatekeeper*: Thay thế hook regex thô sơ bằng phân tích diff ngữ nghĩa, loại bỏ False-Positive.

---

## 7. Kế Hoạch Khắc Phục Tối Ưu Hóa (Remediation Checklist)

1. [ ] **Đồng bộ hóa cấu hình**: Sửa đổi khóa lệch giữa file YAML/JSON và Python hooks.
2. [ ] **Chuyển đổi Regex sang Semantic Gate**: Thay thế regex dễ gãy trong hook logging/boundary bằng chốt chặn ngữ nghĩa.
3. [ ] **Triệt tiêu Silent Fallback**: Bỏ khối `except Exception: continue` nuốt lỗi; thông báo lỗi ra stderr theo chuẩn RFC-5424.
4. [ ] **Kích hoạt Headless Git Hook**: Cài đặt script pre-commit chạy ngầm để bảo vệ nhánh làm việc.
