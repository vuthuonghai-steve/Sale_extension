#!/usr/bin/env python3
"""
Hook: gate_arch_boundary.py
Kiểm tra các vi phạm ranh giới kiến trúc (Architecture Boundaries) giữa các tầng:
- 1_Backend/Services không được import System.Windows.Forms hoặc Frontend
- 0_Shared không được import 1_Backend hoặc 2_Frontend
"""

import sys
import os
import re

IMPORT_PATTERNS = [
    re.compile(r"^\s*using\s+([^;]+);", re.MULTILINE)
]

def check_architecture_violations(file_path: str) -> list[str]:
    violations = []
    if not os.path.exists(file_path):
        return violations

    normalized = os.path.normpath(file_path)
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
    except Exception as e:
        return [f"Lỗi đọc file: {e}"]

    imports = []
    for match in re.finditer(r"^\s*using\s+([^;]+);", content, re.MULTILINE):
        imports.append(match.group(1).strip())

    # Kiểm tra tầng 1_Backend
    if "1_Backend" in normalized:
        for imp in imports:
            if imp.startswith("System.Windows.Forms") or imp.startswith("AppForms.Frontend"):
                violations.append(f"Backend vi phạm ranh giới: import '{imp}' (Backend không được phụ thuộc vào UI WinForms).")

    # Kiểm tra tầng 0_Shared
    if "0_Shared" in normalized:
        for imp in imports:
            if imp.startswith("AppForms.Backend") or imp.startswith("AppForms.Frontend") or imp.startswith("System.Windows.Forms"):
                violations.append(f"Shared vi phạm ranh giới: import '{imp}' (Shared không được phụ thuộc vào Backend hoặc Frontend).")

    return violations

def main():
    if len(sys.argv) < 2:
        print("Sử dụng: python gate_arch_boundary.py <path_to_file>")
        sys.exit(0)

    target_file = sys.argv[1]
    if not target_file.endswith(".cs"):
        sys.exit(0)

    violations = check_architecture_violations(target_file)
    if violations:
        print(f"❌ [GATE ARCH BOUNDARY VIOLATION] Phát hiện vi phạm ranh giới kiến trúc trong {target_file}:")
        for v in violations:
            print(f"   - {v}")
        sys.exit(1)
    else:
        print(f"✅ [GATE ARCH BOUNDARY] File {target_file} tuân thủ ranh giới phân tầng kiến trúc.")
        sys.exit(0)

if __name__ == "__main__":
    main()
