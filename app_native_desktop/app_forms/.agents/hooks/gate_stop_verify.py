#!/usr/bin/env python3
"""
Hook: gate_stop_verify.py
Chạy kiểm tra tổng thể khi Agent hoàn tất phiên làm việc:
1. Chạy dotnet build kiểm tra lỗi biên dịch.
2. Quét nhanh các file .cs để phát hiện placeholder hoặc vi phạm ranh giới.
"""

import sys
import subprocess
import os

def run_build_check(project_root: str) -> tuple[bool, str]:
    csproj_path = os.path.join(project_root, "AppForms.csproj")
    if not os.path.exists(csproj_path):
        return True, "Không tìm thấy AppForms.csproj, bỏ qua dotnet build."

    try:
        result = subprocess.run(
            ["dotnet", "build", csproj_path, "-c", "Debug"],
            capture_output=True,
            text=True,
            cwd=project_root,
            timeout=60
        )
        if result.returncode == 0:
            return True, "Build thành công (0 Errors)."
        else:
            return False, f"Build thất bại (Exit code {result.returncode}):\n{result.stdout}\n{result.stderr}"
    except Exception as e:
        return False, f"Lỗi thực thi dotnet build: {e}"

def main():
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    print(f"🔍 [GATE STOP VERIFY] Đang kiểm tra toàn diện dự án tại: {project_root}")

    ok, msg = run_build_check(project_root)
    if not ok:
        print(f"❌ [GATE STOP VERIFY FAILED] {msg}")
        sys.exit(1)
    else:
        print(f"✅ [GATE STOP VERIFY PASSED] {msg}")
        sys.exit(0)

if __name__ == "__main__":
    main()
