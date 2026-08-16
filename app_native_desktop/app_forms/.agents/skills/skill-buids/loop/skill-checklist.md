# Skill Verification Checklist

> **Purpose**: Checklist tự kiểm tra chất lượng khi tạo mới hoặc cập nhật một Agent Skill.

---

## 1. Structural Checks
- [ ] Thư mục skill đặt tại `.agents/skills/[skill-name]/`
- [ ] File `SKILL.md` có đầy đủ YAML frontmatter hợp lệ
- [ ] Các thư mục con cần thiết (`knowledge/`, `loop/`, `templates/`, `references/`) đã được tạo
- [ ] Đã đăng ký vào `.agents/skills/index.json`

## 2. Content Quality & Depth Checks
- [ ] Không có `TODO`, placeholder rỗng hoặc tóm tắt sơ sài
- [ ] Guardrails và Stop Conditions được viết rõ ràng, có tiêu chí Pass/Fail
- [ ] Ngôn ngữ chỉ dẫn và output format thống nhất
- [ ] Các ví dụ code minh họa chuẩn cú pháp và bám sát kiến trúc dự án (0_Shared, 1_Backend, 2_Frontend)

## 3. Tool & Confidence Handling
- [ ] Liệt kê đầy đủ danh sách primary tools
- [ ] Định nghĩa rõ cơ chế xử lý khi độ tin cậy < 60% (dừng lại hỏi user)
