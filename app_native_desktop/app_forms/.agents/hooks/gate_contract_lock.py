#!/usr/bin/env python3
"""
Hook: gate_contract_lock.py
Bảo vệ các tệp Interface và Contract khỏi việc sửa đổi bất cẩn mà không cập nhật các lớp triển khai.
"""

import sys
import os

PROTECTED_DIRECTORIES = [
    os.path.normpath("1_Backend/Contracts/Interfaces"),
]

def is_contract_file(file_path: str) -> bool:
    normalized = os.path.normpath(file_path)
    for protected in PROTECTED_DIRECTORIES:
        if protected in normalized:
            return True
    return False

def main():
    if len(sys.argv) < 2:
        print("Sử dụng: python gate_contract_lock.py <path_to_file>")
        sys.exit(0)

    target_file = sys.argv[1]
    if is_contract_file(target_file):
        print(f"⚠️ [GATE CONTRACT LOCK] Cảnh báo: File '{target_file}' thuộc tầng Contracts/Interfaces được bảo vệ.")
        print("   - Đảm bảo rằng bạn đã cập nhật toàn bộ các Services triển khai Interface này.")
        print("   - Đảm bảo rằng bạn đã cập nhật DI registrations trong Program.cs và các Unit Tests liên quan.")
    sys.exit(0)

if __name__ == "__main__":
    main()
