#!/usr/bin/env python3
"""Gate: Zero-Placeholder Check truoc khi ghi file (PreToolUse).

Quet CodeContent (write_to_file), ReplacementContent (replace_file_content)
va moi gia tri chuoi trong ReplacementChunks (multi_replace_file_content);
Neu con TODO/NotImplementedException/Console.WriteLine -> deny.
Fail-open khi loi noi bo.
"""

import fnmatch
import os
import re
import sys
import time
from pathlib import Path

# Add scripts root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from config.config import load_rules
from lib.hook_contract import emit, emit_allow, read_payload
from lib.logger import log_gate_decision

GATE_ID = "G-PLACEHOLDER-PRE"
RULE_ID = "ZERO-PLACEHOLDER"
EVENT_DIR = "pre_tool_use"
HOOK_EVENT = "PreToolUse"
FAIL_OPEN_DECISION = "allow"


def _string_values(node: object) -> list[str]:
    """Gom moi gia tri chuoi trong cau truc long nhau (dict/list) cua chunks."""
    values: list[str] = []
    if isinstance(node, str):
        values.append(node)
    elif isinstance(node, dict):
        for value in node.values():
            values.extend(_string_values(value))
    elif isinstance(node, list):
        for item in node:
            values.extend(_string_values(item))
    return values


def collect_contents(args: dict) -> list[str]:
    """Gom toan bo noi dung can scan tu args cua cac tool ghi file."""
    contents: list[str] = []
    code = args.get("CodeContent")
    if isinstance(code, str):
        contents.append(code)
    replacement = args.get("ReplacementContent")
    if isinstance(replacement, str):
        contents.append(replacement)
    chunks = args.get("ReplacementChunks")
    if isinstance(chunks, list):
        contents.extend(_string_values(chunks))
    return contents


def _is_path_excluded(norm_path: str, exclude_patterns: list[str]) -> bool:
    """Kiem tra duong dan co khop voi bat ky exclude pattern nao khong."""
    for pat in exclude_patterns:
        clean_pat = pat.replace("\\", "/").strip()
        if fnmatch.fnmatch(norm_path, clean_pat) or fnmatch.fnmatch(norm_path, f"*/{clean_pat.lstrip('*')}"):
            return True
        core = clean_pat.strip("*").strip("/")
        if core and f"/{core}/" in f"/{norm_path}/":
            return True
    return False


def _is_path_scanned(norm_path: str, scan_paths: list[str]) -> bool:
    """Kiem tra duong dan co nam trong scan_paths duoc chi dinh khong."""
    if not scan_paths:
        return True
    for sp in scan_paths:
        clean_sp = sp.replace("\\", "/").strip().rstrip("/")
        if norm_path.startswith(clean_sp) or f"/{clean_sp}/" in f"/{norm_path}/" or f"/{clean_sp}" in f"/{norm_path}":
            return True
    return False


def check(target_file: str, args: dict, rules: dict) -> tuple[str, str]:
    """Scan placeholder trong noi dung sap ghi; tra ve (decision, reason)."""
    # Chi kiem tra cac file ma nguon (.cs, .xaml)
    target_norm = os.path.normpath(target_file).replace("\\", "/")
    target_lower = target_norm.lower()
    if not (target_lower.endswith(".cs") or target_lower.endswith(".xaml")):
        return "allow", ""

    placeholder_cfg = rules.get("placeholder") if isinstance(rules.get("placeholder"), dict) else {}

    # Kiem tra exclude_paths
    exclude_paths = placeholder_cfg.get("exclude_paths", [])
    if isinstance(exclude_paths, list) and _is_path_excluded(target_lower, exclude_paths):
        return "allow", ""

    # Kiem tra scan_paths (neu duoc chi dinh trong cau hinh)
    scan_paths = placeholder_cfg.get("scan_paths", [])
    if isinstance(scan_paths, list) and scan_paths and not _is_path_scanned(target_norm, scan_paths):
        return "allow", ""

    compiled: list[tuple[str, re.Pattern, str]] = []

    # 1. Trich xuat tu forbidden_patterns (ho tro list of dicts hoac list of strings)
    forbidden_items = rules.get("forbidden_patterns")
    if isinstance(forbidden_items, list):
        for item in forbidden_items:
            if isinstance(item, dict) and "pattern" in item:
                pat_str = str(item["pattern"])
                msg = str(item.get("message", "Phát hiện placeholder bị cấm."))
                try:
                    compiled.append((pat_str, re.compile(pat_str, re.IGNORECASE), msg))
                except re.error as rerr:
                    sys.stderr.write(f"[WARN] Invalid regex in forbidden_patterns '{pat_str}': {rerr}\n")
                except Exception as exc:
                    sys.stderr.write(f"[WARN] Error compiling forbidden pattern '{pat_str}': {exc}\n")
            elif isinstance(item, str):
                try:
                    compiled.append((item, re.compile(item, re.IGNORECASE), "Phát hiện placeholder bị cấm."))
                except re.error as rerr:
                    sys.stderr.write(f"[WARN] Invalid regex in forbidden_patterns '{item}': {rerr}\n")
                except Exception as exc:
                    sys.stderr.write(f"[WARN] Error compiling forbidden pattern '{item}': {exc}\n")

    # 2. Trich xuat tu placeholder.patterns (list of strings)
    existing_pats = {p[0] for p in compiled}
    placeholder_patterns = placeholder_cfg.get("patterns", [])
    if isinstance(placeholder_patterns, list):
        for pat in placeholder_patterns:
            if isinstance(pat, str) and pat not in existing_pats:
                try:
                    compiled.append((pat, re.compile(pat, re.IGNORECASE), "Phát hiện placeholder bị cấm."))
                    existing_pats.add(pat)
                except re.error as rerr:
                    sys.stderr.write(f"[WARN] Invalid regex in placeholder.patterns '{pat}': {rerr}\n")
                except Exception as exc:
                    sys.stderr.write(f"[WARN] Error compiling placeholder pattern '{pat}': {exc}\n")

    if not compiled:
        default_defs = [
            (r"//\s*TODO", "Phát hiện TODO placeholder chưa hoàn thiện logic."),
            (r"//\s*FIXME", "Phát hiện FIXME placeholder chưa hoàn thiện logic."),
            (r"throw\s+new\s+NotImplementedException", "Phát hiện NotImplementedException chưa được triển khai."),
            (r"Console\.WriteLine\s*\(", "Cấm sử dụng Console.WriteLine trực tiếp. Hãy sử dụng ILogger/Serilog."),
            (r"Debug\.WriteLine\s*\(", "Cấm sử dụng Debug.WriteLine trực tiếp. Hãy sử dụng ILogger/Serilog."),
        ]
        for pat_str, msg in default_defs:
            try:
                compiled.append((pat_str, re.compile(pat_str, re.IGNORECASE), msg))
            except Exception as exc:
                sys.stderr.write(f"[WARN] Error compiling default pattern '{pat_str}': {exc}\n")

    findings: list[tuple[int, str, str]] = []
    for content in collect_contents(args):
        for line_no, line in enumerate(content.splitlines(), start=1):
            for pat_str, regex, msg in compiled:
                if regex.search(line):
                    pair = (line_no, line.strip(), msg)
                    if not any(f[0] == line_no and f[1] == pair[1] for f in findings):
                        findings.append(pair)

    if not findings:
        return "allow", ""

    lines_info = [f"line {ln}: `{code_snip}` ({msg})" for ln, code_snip, msg in findings[:5]]
    reason = f"Phat hien ma placeholder/stub/console chua hoan thien: {'; '.join(lines_info)}. Quy tac bat buoc: Zero-Placeholder & ILogger."
    return "deny", reason


def main() -> None:
    start = time.perf_counter()
    payload = read_payload()
    rules = load_rules()
    target_file = str(payload.args.get("TargetFile", ""))
    decision, reason = check(target_file, payload.args, rules)
    duration_ms = int((time.perf_counter() - start) * 1000)

    log_gate_decision(
        gate_id=GATE_ID,
        rule_id=RULE_ID,
        event_dir=EVENT_DIR,
        hook_event=HOOK_EVENT,
        decision=decision,
        reason=reason,
        target_file=target_file,
        tool_name=payload.tool_name,
        conversation_id=payload.conversation_id,
        step_idx=payload.step_idx,
        duration_ms=duration_ms,
    )

    if decision == "allow":
        emit_allow(reason)
    else:
        emit(decision, reason)


if __name__ == "__main__":
    _start = time.perf_counter()
    try:
        main()
    except Exception as exc:
        reason = f"gate internal error — fail-{FAIL_OPEN_DECISION}: {exc}"
        log_gate_decision(
            gate_id=GATE_ID,
            rule_id=RULE_ID,
            event_dir=EVENT_DIR,
            hook_event=HOOK_EVENT,
            decision=FAIL_OPEN_DECISION,
            reason=reason,
            duration_ms=int((time.perf_counter() - _start) * 1000),
        )
        emit_allow(reason)
