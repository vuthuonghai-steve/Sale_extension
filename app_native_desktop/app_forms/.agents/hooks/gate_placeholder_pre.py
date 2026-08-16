#!/usr/bin/env python3
"""
Hook: gate_placeholder_pre.py
Kiểm tra và ngăn chặn các đoạn mã placeholder, stub chưa hoàn thiện (TODO, NotImplementedException, Console.WriteLine).
"""

import sys
import re
import os

FORBIDDEN_PATTERNS = [
    (re.compile(r"//\s*TODO:?\s*implement", re.IGNORECASE), "TODO placeholder chưa hoàn thiện logic"),
    (re.compile(r"throw\s+new\s+NotImplementedException\s*\("), "NotImplementedException chưa được triển khai"),
    (re.compile(r"Console\.WriteLine\s*\("), "Console.WriteLine trực tiếp (yêu cầu dùng ILogger/Serilog)"),
    (re.compile(r"Debug\.WriteLine\s*\("), "Debug.WriteLine trực tiếp (yêu cầu dùng ILogger/Serilog)")
]

def check_file(file_path: str) -> list[str]:
    violations = []
    if not os.path.exists(file_path):
        return violations

    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            for line_idx, line in enumerate(f, start=1):
                for pattern, desc in FORBIDDEN_PATTERNS:
                    if pattern.search(line):
                        violations.append(f"Dòng {line_idx}: {desc} -> {line.strip()}")
    except Exception as e:
        violations.append(f"Lỗi đọc file: {e}")

    return violations

def main():
    if len(sys.argv) < 2:
        print("Sử dụng: python gate_placeholder_pre.py <path_to_file>")
        sys.exit(0)

    target_file = sys.argv[1]
    if not (target_file.endswith(".cs") or target_file.endswith(".xaml")):
        sys.exit(0)

    violations = check_file(target_file)
    if violations:
        print(f"❌ [GATE PLACEHOLDER VIOLATION] Phát hiện vi phạm trong {target_file}:")
        for v in violations:
            print(f"   - {v}")
        sys.exit(1)
    else:
        print(f"✅ [GATE PLACEHOLDER] File {target_file} hợp lệ, không chứa stub dở dang.")
        sys.exit(0)

if __name__ == "__main__":
    main()
