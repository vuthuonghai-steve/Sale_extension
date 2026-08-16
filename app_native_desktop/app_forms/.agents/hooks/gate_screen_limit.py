#!/usr/bin/env python3
"""
Hook: gate_screen_limit.py
Kiểm tra giới hạn số dòng code cho các file Screen (<= 150 dòng) và Component (<= 300 dòng).
"""

import sys
import os

SCREEN_MAX_LINES = 150
COMPONENT_MAX_LINES = 300

def check_line_count(file_path: str) -> tuple[bool, int, str]:
    if not os.path.exists(file_path):
        return True, 0, ""

    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()
        count = len(lines)
    except Exception as e:
        return False, 0, f"Lỗi đọc file: {e}"

    normalized = os.path.normpath(file_path)
    file_name = os.path.basename(normalized)

    if file_name.endswith("Screen.cs"):
        if count > SCREEN_MAX_LINES:
            return False, count, f"File Root Screen '{file_name}' có {count} dòng (vượt quá giới hạn {SCREEN_MAX_LINES} dòng). Cần tách nhỏ Sub-Components hoặc chuyển logic sang Hook!"
    elif "Components" in normalized and file_name.endswith(".cs"):
        if count > COMPONENT_MAX_LINES:
            return False, count, f"Component '{file_name}' có {count} dòng (vượt quá giới hạn {COMPONENT_MAX_LINES} dòng). Cần phân rã thành các widget nhỏ hơn!"

    return True, count, "OK"

def main():
    if len(sys.argv) < 2:
        print("Sử dụng: python gate_screen_limit.py <path_to_file>")
        sys.exit(0)

    target_file = sys.argv[1]
    ok, count, msg = check_line_count(target_file)

    if not ok:
        print(f"❌ [GATE SCREEN LIMIT VIOLATION] {msg}")
        sys.exit(1)
    else:
        print(f"✅ [GATE SCREEN LIMIT] File '{target_file}' ({count} dòng) đạt chuẩn kích thước.")
        sys.exit(0)

if __name__ == "__main__":
    main()
