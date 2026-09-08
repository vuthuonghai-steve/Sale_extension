#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Path Portability & Governance Verifier Script
Automates the detection, validation, and conversion of hardcoded absolute paths
to scoped relative paths anchored around the '.agents' customization root.

Author: Antigravity AI Engineering Team
Location: .agents/skills/path-verifier/scripts/verify_paths.py
"""

import argparse
import datetime
import json
import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Regex phát hiện đường dẫn tuyệt đối Windows & file:/// scheme
ABS_URI_PATTERN = re.compile(r'file:///(?:[a-zA-Z]:[\\/]|/)[^\s)"\'>]+', re.IGNORECASE)
WIN_DRIVE_PATTERN = re.compile(r'(?<![a-zA-Z0-9_\-\./])([a-zA-Z]:[\\/][^\s)"\'>]+)', re.IGNORECASE)

EXCLUDED_DIRS = {".git", "node_modules", "bin", "obj", "dist", ".gemini", "__pycache__", ".vscode", "Logs", "logs"}
TARGET_EXTENSIONS = {".md", ".json", ".yaml", ".yml", ".ps1", ".py", ".sh"}


def find_anchor_root(start_dir: Path) -> Tuple[Optional[Path], Optional[Path]]:
    """
    Xác định Workspace Root và Anchor .agents.
    Thực hiện walk-up từ start_dir tìm thư mục .agents.
    """
    current = start_dir.resolve()
    for parent in (current, *current.parents):
        anchor = parent / ".agents"
        if anchor.is_dir():
            return parent, anchor
    return None, None


def normalize_posix(path_str: str) -> str:
    """Chuẩn hóa đường dẫn sang dạng POSIX (gạch chéo xuôi /)."""
    return path_str.replace("\\", "/")


def determine_file_scope(file_path: Path, workspace_root: Path, anchor_dir: Path) -> Tuple[str, Optional[Path]]:
    """
    Xác định phạm vi Scope của file đang quét:
    - SKILL_LOCAL: nằm trong .agents/skills/<skill_name>/
    - HOOKS_CONFIG: file .agents/hooks.json
    - WORKSPACE_WIDE: nằm ngoài .agents/
    """
    try:
        rel_to_anchor = file_path.resolve().relative_to(anchor_dir.resolve())
        parts = rel_to_anchor.parts
        if len(parts) >= 2 and parts[0] == "skills":
            skill_folder = anchor_dir / "skills" / parts[1]
            return "SKILL_LOCAL", skill_folder
        if len(parts) >= 1 and parts[0] == "hooks.json":
            return "HOOKS_CONFIG", anchor_dir
    except ValueError:
        pass

    return "WORKSPACE_WIDE", workspace_root


def resolve_replacement(
    raw_path: str,
    file_path: Path,
    scope: str,
    scope_base_dir: Path,
    workspace_root: Path
) -> Optional[str]:
    """
    Tính toán đường dẫn tương đối thay thế phù hợp dựa theo Scope.
    """
    cleaned = raw_path
    if cleaned.lower().startswith("file:///"):
        cleaned = cleaned[8:]
    cleaned = normalize_posix(cleaned)

    # Nếu bắt đầu bằng ổ đĩa Windows (e.g. C:/...)
    if len(cleaned) >= 2 and cleaned[1] == ":":
        target_abs = Path(cleaned).resolve()
    else:
        target_abs = Path(raw_path).resolve()

    # Kiểm tra target có nằm trong workspace không
    try:
        rel_to_workspace = target_abs.relative_to(workspace_root.resolve())
    except ValueError:
        # Nếu đường dẫn trỏ ra ngoài workspace (ví dụ C:\Windows\...), không tự tiện đổi
        return None

    posix_rel_workspace = normalize_posix(str(rel_to_workspace))

    if scope == "SKILL_LOCAL" and scope_base_dir:
        try:
            rel_to_skill = target_abs.relative_to(scope_base_dir.resolve())
            return normalize_posix(str(rel_to_skill))
        except ValueError:
            # File được trỏ tới nằm ngoài Skill nhưng trong Workspace
            return posix_rel_workspace

    elif scope == "HOOKS_CONFIG":
        # Trong hooks.json, CWD là .agents/
        anchor_dir = workspace_root / ".agents"
        try:
            rel_to_anchor = target_abs.relative_to(anchor_dir.resolve())
            posix_hook_rel = normalize_posix(str(rel_to_anchor))
            return f"./{posix_hook_rel}" if not posix_hook_rel.startswith("./") else posix_hook_rel
        except ValueError:
            return posix_rel_workspace

    else:
        # Scope WORKSPACE_WIDE
        return posix_rel_workspace


def scan_and_verify(
    target_dir: Path,
    fix_mode: bool = False,
    single_file: Optional[Path] = None
) -> Dict:
    workspace_root, anchor_dir = find_anchor_root(target_dir)

    if not workspace_root or not anchor_dir:
        workspace_root = target_dir.resolve()
        anchor_found = False
        anchor_path = ""
    else:
        anchor_found = True
        anchor_path = str(anchor_dir)

    files_to_scan: List[Path] = []
    if single_file:
        files_to_scan = [single_file.resolve()]
    else:
        for root, dirs, files in os.walk(target_dir):
            dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS]
            for f in files:
                ext = Path(f).suffix.lower()
                if ext in TARGET_EXTENSIONS:
                    files_to_scan.append(Path(root) / f)

    violations = []
    files_with_violations_count = 0
    total_violations_count = 0
    fixed_count = 0

    for file_path in files_to_scan:
        try:
            content = file_path.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue

        scope, scope_base = determine_file_scope(file_path, workspace_root, anchor_dir if anchor_found else workspace_root)
        lines = content.splitlines(keepends=True)
        modified_lines = []
        file_had_violation = False

        for idx, line in enumerate(lines, start=1):
            modified_line = line
            # Tìm tất cả matches: URL file:/// và Drive Letter
            matches = list(ABS_URI_PATTERN.finditer(line)) + list(WIN_DRIVE_PATTERN.finditer(line))
            # Sắp xếp theo vị trí đảo ngược để thay thế không làm lệch index
            matches.sort(key=lambda m: m.start(), reverse=True)

            line_changed = False
            for m in matches:
                matched_str = m.group(0)
                # Bỏ qua nếu là URL web
                if matched_str.lower().startswith(("http://", "https://", "mailto:")):
                    continue

                proposed = resolve_replacement(matched_str, file_path, scope, scope_base, workspace_root)
                if proposed and proposed != matched_str:
                    file_had_violation = True
                    total_violations_count += 1
                    violation_record = {
                        "file_path": str(file_path),
                        "line_number": idx,
                        "scope": scope,
                        "original_path": matched_str,
                        "proposed_relative_path": proposed,
                        "violation_type": "ABSOLUTE_URI" if matched_str.startswith("file:///") else "HARDCODED_DRIVE",
                        "is_fixed": fix_mode
                    }
                    violations.append(violation_record)

                    if fix_mode:
                        # Thay thế matched_str bằng proposed trong dòng
                        start, end = m.span()
                        modified_line = modified_line[:start] + proposed + modified_line[end:]
                        line_changed = True
                        fixed_count += 1

            modified_lines.append(modified_line)

        if file_had_violation:
            files_with_violations_count += 1
            if fix_mode:
                file_path.write_text("".join(modified_lines), encoding="utf-8")

    status = "PASSED"
    if total_violations_count > 0:
        status = "FIXED" if fix_mode else "VIOLATIONS_FOUND"

    report = {
        "audit_timestamp": datetime.datetime.now().isoformat(),
        "workspace_root": str(workspace_root),
        "anchor_found": anchor_found,
        "anchor_path": anchor_path,
        "scan_mode": "fix" if fix_mode else "check",
        "summary": {
            "files_scanned": len(files_to_scan),
            "files_with_violations": files_with_violations_count,
            "total_violations": total_violations_count,
            "violations_fixed": fixed_count,
            "status": status
        },
        "violations": violations
    }
    return report


def main():
    parser = argparse.ArgumentParser(description="Verify and normalize absolute paths to scoped relative paths.")
    parser.add_argument("--workspace", "-w", type=str, default=".", help="Root directory to scan (default: current directory)")
    parser.add_argument("--file", "-f", type=str, default=None, help="Scan a single specific file")
    parser.add_argument("--fix", action="store_true", help="Automatically convert detected absolute paths to relative paths")
    parser.add_argument("--output", "-o", type=str, default=None, help="Path to write output JSON report")

    args = parser.parse_args()
    target = Path(args.workspace)
    single = Path(args.file) if args.file else None

    report = scan_and_verify(target, fix_mode=args.fix, single_file=single)

    json_str = json.dumps(report, ensure_ascii=False, indent=2)

    if args.output:
        out_path = Path(args.output)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json_str, encoding="utf-8")
        print(f"Báo cáo JSON đã lưu tại: {out_path}")
    else:
        print(json_str)

    summary = report["summary"]
    print("\n" + "=" * 60, file=sys.stderr)
    print(f" KẾT QUẢ PATH AUDIT: {summary['status']}", file=sys.stderr)
    print(f" - Số file quét: {summary['files_scanned']}", file=sys.stderr)
    print(f" - Số file vi phạm: {summary['files_with_violations']}", file=sys.stderr)
    print(f" - Tổng số vi phạm: {summary['total_violations']}", file=sys.stderr)
    if args.fix:
        print(f" - Đã tự động sửa: {summary['violations_fixed']}", file=sys.stderr)
    print("=" * 60 + "\n", file=sys.stderr)

    if not args.fix and summary["total_violations"] > 0:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
