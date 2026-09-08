# 📋 Báo Cáo Kiểm Định Đường Dẫn Dự Án (Path Portability Audit Report)

- **Thời gian thực hiện**: `{{audit_timestamp}}`
- **Workspace Root**: `{{workspace_root}}`
- **Mốc Neo `.agents`**: `{{anchor_path}}` (`{{anchor_found}}`)
- **Chế độ quét**: `{{scan_mode}}`
- **Trạng thái**: `{{summary.status}}`

---

## 1. Tổng Quan Kết Quả Kiểm Tra

| Chỉ Số Đánh Giá | Giá Trị Đo Lường | Trạng Thái |
| :--- | :--- | :--- |
| **Tổng số tệp quét** | `{{summary.files_scanned}}` | Hoàn tất |
| **Số tệp có đường dẫn tuyệt đối vi phạm** | `{{summary.files_with_violations}}` | {{violation_icon}} |
| **Tổng số vi phạm phát hiện** | `{{summary.total_violations}}` | {{violation_icon}} |
| **Số lượng vi phạm đã tự động sửa** | `{{summary.violations_fixed}}` | {{fixed_status}} |

---

## 2. Chi Tiết Các Vi Phạm Theo Phân Vùng (Scope Breakdown)

### Danh Sách Vi Phạm Chi Tiết

| Vị Trí (Tệp & Dòng) | Phân Vùng (Scope) | Đường Dẫn Tuyệt Đối Gốc | Đường Dẫn Tương Đối Đề Xuất | Đã Sửa? |
| :--- | :--- | :--- | :--- | :--- |
| `{{file_path}}:{{line_number}}` | `{{scope}}` | `{{original_path}}` | `{{proposed_relative_path}}` | `{{is_fixed}}` |

---

## 3. Khuyến Nghị & Hướng Dẫn Kế Tiếp

1. **Với Scope A (Skill-Local)**: Đảm bảo toàn bộ tài liệu vệ tinh dùng `knowledge/...` tương đối từ thư mục của Skill.
2. **Với Scope B (Hooks-Config)**: Đảm bảo trong `hooks.json` luôn trỏ `./hooks/...` (tương đối từ `.agents/`).
3. **Với Scope C (Workspace-Wide)**: Đảm bảo tài liệu cấp root trỏ `.agents/skills/...` (tương đối từ Workspace Root).
