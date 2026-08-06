#!/usr/bin/env bash
# ==============================================================================
# Script: extract_module_summaries.sh
# Purpose: Trích xuất nhanh dòng `description` từ Frontmatter các file markdown
#          trong Docs/Module-Capabilities/ để nạp gọn nhẹ vào LLM Context Window.
# ==============================================================================

# Xác định thư mục chứa các file đặc tả module (mặc định hoặc từ tham số)
TARGET_DIR="${1:-Docs/Module-Capabilities}"

# Kiểm tra thư mục tồn tại
if [ ! -d "$TARGET_DIR" ]; then
    echo "[ERROR] Thư mục '$TARGET_DIR' không tồn tại!" >&2
    exit 1
fi

# Tiêu đề kết quả
echo "=== MODULE CAPABILITIES SUMMARY ==="

# Duyệt qua tất cả các file .md trong thư mục target
for file in "$TARGET_DIR"/*.md; do
    # Bỏ qua nếu không tìm thấy file .md nào
    [ -f "$file" ] || continue
    
    # Lấy tên module từ tên file (loại bỏ phần mở rộng .md)
    module_name=$(basename "$file" .md)
    
    # Dùng grep lấy đúng dòng 'description:' trong YAML Frontmatter và dùng sed bóc tách chuỗi
    desc=$(grep -m 1 -E '^description:' "$file" 2>/dev/null | sed -E 's/^description:[[:space:]]*"?//; s/"?[[:space:]]*$//')
    
    if [ -n "$desc" ]; then
        echo "- [$module_name]($file): $desc"
    else
        echo "- [$module_name]($file): (Chưa có mô tả)"
    fi
done
