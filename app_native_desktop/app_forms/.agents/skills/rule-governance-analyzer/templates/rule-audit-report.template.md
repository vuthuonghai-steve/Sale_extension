# Báo Cáo Kiểm Định Quản Trị Quy Tắc (Rule Governance Audit Report)

> **Mã báo cáo**: `[AUDIT-RULE-XXX]`  
> **Thời gian thực hiện**: `[YYYY-MM-DD HH:mm:ss]`  
> **Phạm vi kiểm tra**: `[Toàn bộ Repository / Danh sách file cấu hình]`  
> **Trạng thái kiểm định**: `[APPROVED / REJECTED]`  

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

## 3. Giám Định Chống "Rule Ảo" (Anti-Phantom Verification)

- **Tổng số script kiểm tra đã quét**: `[Số lượng script]`
- **Script đạt chuẩn kiểm chứng cơ học nhị phân**: `[Số lượng]`
- **Script nghi ngờ "Rule Ảo" (Phantom Gates)**: `[Số lượng]`

| Đường Dẫn Script | Dạng Rule Ảo | Vấn Đề Nhận Diện | Hành Động Nâng Cấp Yêu Cầu |
| :--- | :--- | :--- | :--- |
| `[scripts/xxx.ps1]` | `[Dummy Regex / Fake Exit 0]` | `[Mô tả lỗi]` | `[Bổ sung JSON Schema và exit code chuẩn]` |

---

## 4. Điểm Chất Lượng Quản Trị (Quality Governance Scores)

- [ ] **Conflict Freedom Score**: `[X]%` (Mục tiêu $\ge 85\%$)
- [ ] **Phantom Immunity Score**: `[Y]%` (Mục tiêu $\ge 85\%$)
- [ ] **Context Efficiency Score**: `[Z]%` (Mục tiêu $\ge 85\%$)
- **OVERALL SCORE**: `[Score]%` ➔ **KẾT LUẬN**: `[APPROVED / REJECTED]`
