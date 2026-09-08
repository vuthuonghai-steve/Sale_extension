# Kế Hoạch Tái Cấu Trúc Quy Tắc Theo Mô Hình 3 Tầng (Rule Refactoring Plan)

> **Mã kế hoạch**: `[REFACTOR-RULE-XXX]`  
> **Dự án**: `[Tên dự án]` | **Thời gian lập**: `[YYYY-MM-DD]`  
> **Mục tiêu**: Tối ưu Context Window, xóa bỏ xung đột và chuyển đổi quy tắc sang đúng tầng kiến trúc phù hợp.

---

## 1. Bản Đồ Chuyển Dịch Kiến Trúc (Architecture Migration Mapping)

```
[Các Rule Cũ Rải Rác Trong System Prompt / AGENTS.md]
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Tầng Hooks (.agents/hooks.json)                          │ ◄── Chặn cứng (Hard Enforcement)
├─────────────────────────────────────────────────────────────┤
│ 2. Tầng Skills (.agents/skills/*/SKILL.md)                  │ ◄── Đóng gói tri thức On-Demand
├─────────────────────────────────────────────────────────────┤
│ 3. Tầng Anchors (AGENTS.md tinh giản)                       │ ◄── Tối ưu Static Prompt Cache
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Danh Mục Quy Tắc Cần Di Chuyển (Refactoring Inventory)

### Nhóm 1: Quy Tắc Chuyển Sang Hooks (Deterministic Hard Enforcement)
*Dành cho: Ràng buộc an toàn, quyền file hệ thống, chặn lệnh phá hoại, kiểm tra tham số tool.*

| Mã Rule Gốc | Nội Dung Quy Tắc Hiện Tại | Sự Kiện Hook Tương Ứng | File Hook Target |
| :--- | :--- | :--- | :--- |
| `[R-OLD-01]` | `[Không được chạy lệnh xoá database]` | `PreToolUse (command: drop/rm)` | `.agents/hooks.json` |

### Nhóm 2: Quy Tắc Chuyển Sang Agent Skills (On-Demand Progressive Disclosure)
*Dành cho: Hướng dẫn quy trình nghiệp vụ chuyên sâu, bóc tách BA, review kiến trúc, checklist kiểm thử.*

| Mã Rule Gốc | Nội Dung Quy Tắc Hiện Tại | Bộ Skill Đích | Thư Mục Tri Thức Target |
| :--- | :--- | :--- | :--- |
| `[R-OLD-02]` | `[Quy trình bóc tách yêu cầu BABOK 4 tầng]` | `ba-requirements-analyzer` | `knowledge/babok-taxonomy.md` |

### Nhóm 3: Quy Tắc Giữ Lại Tầng Project Anchors (Static Prefix Cache)
*Dành cho: 3-5 nguyên tắc bất biến (Negative Space) và căn cước (Identity) cốt lõi của dự án.*

| Mã Rule | Ranh Giới Bất Biến (Negative Space) | Hậu Quả Vi Phạm |
| :--- | :--- | :--- |
| `[G-01]` | `[Tuyệt đối cấm để lại mock data hoặc TODO trên luồng chính]` | Bị Gatekeeper từ chối (Exit 1) |

---

## 3. Kế Hoạch Triển Khai & Kiểm Chứng (Execution & Verification Steps)

- [ ] **Bước 1**: Cấu hình các chốt chặn mới trong `.agents/hooks.json`.
- [ ] **Bước 2**: Đóng gói các quy trình nghiệp vụ vào thư mục `.agents/skills/<skill-name>/`.
- [ ] **Bước 3**: Tinh giản `AGENTS.md`, cắt giảm token tĩnh xuống dưới 2.000 tokens.
- [ ] **Bước 4**: Chạy script kiểm định `audit-rules.ps1` để xác nhận không còn xung đột hoặc rule ảo.
- [ ] **Bước 5**: Kiểm tra độ suy giảm token tiêu thụ trong các lượt gọi CLI (`agy -p`).
