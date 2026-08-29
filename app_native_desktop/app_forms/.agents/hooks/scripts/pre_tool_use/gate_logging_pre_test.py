#!/usr/bin/env python3
"""Gate: Kiem tra Logging bat buoc truoc khi chay test (PreToolUse tren run_command).

Truoc khi thuc thi `dotnet test`, script se chay `git diff` de kiem tra:
Neu co ma nguon moi/sua doi trong 1_Backend/ hoac 2_Frontend/ ma chua bo sung log
(_logger.Log... hoac Log.Information/Log.Error/Log.Debug/Log.Warning)
-> Deny va yeu cau bo sung log theo tieu chuan logging-best-practices & test bang dotnet run.
Fail-open khi co loi noi bo.
"""

from __future__ import annotations

import os
from pathlib import Path
import re
import subprocess
import sys
import time

# Add scripts root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from config.config import load_rules, repo_root
from lib.hook_contract import emit, emit_allow, read_payload
from lib.logger import log_gate_decision

GATE_ID = "G-LOGGING-PRE-TEST"
RULE_ID = "LOGGING-BEFORE-TEST"
EVENT_DIR = "pre_tool_use"
HOOK_EVENT = "PreToolUse"
FAIL_OPEN_DECISION = "allow"

LOG_PATTERNS = [
    r"_logger\.Log(?:Information|Error|Debug|Warning|Critical|Trace)\s*\(",
    r"Log\.(?:Information|Error|Debug|Warning|Fatal|Write)\s*\(",
]


def _get_git_diff_cs_files(root: Path) -> str:
    """Lay git diff cua cac file ma nguon C# (ca staged va unstaged) trong 1_Backend va 2_Frontend."""
    try:
        # Lay diff unstaged
        res_unstaged = subprocess.run(
            ["git", "diff", "--", "1_Backend/*.cs", "2_Frontend/*.cs", "1_Backend/**/*.cs", "2_Frontend/**/*.cs"],
            capture_output=True,
            text=True,
            cwd=str(root),
            timeout=15,
        )
        diff_unstaged = res_unstaged.stdout if res_unstaged.returncode == 0 else ""

        # Lay diff staged
        res_staged = subprocess.run(
            ["git", "diff", "--cached", "--", "1_Backend/*.cs", "2_Frontend/*.cs", "1_Backend/**/*.cs", "2_Frontend/**/*.cs"],
            capture_output=True,
            text=True,
            cwd=str(root),
            timeout=15,
        )
        diff_staged = res_staged.stdout if res_staged.returncode == 0 else ""

        return f"{diff_unstaged}\n{diff_staged}".strip()
    except Exception:
        return ""


def check(command_line: str, root: Path) -> tuple[str, str]:
    """Kiem tra xem co phai lenh dotnet test khong va co thieu log khong."""
    if not command_line:
        return "allow", ""

    cmd_lower = command_line.lower().strip()
    if not ("dotnet test" in cmd_lower or "dotnet.exe test" in cmd_lower):
        return "allow", ""

    diff_text = _get_git_diff_cs_files(root)
    if not diff_text:
        # Khong co thay doi code C# nao trong 1_Backend hoac 2_Frontend -> Cho phep test binh thuong
        return "allow", ""

    # Loc cac dong them moi bat dau bang '+' (nhung khong phai '+++')
    added_lines = [
        line[1:].strip()
        for line in diff_text.splitlines()
        if line.startswith("+") and not line.startswith("+++")
    ]

    # Kiem tra xem co logic moi dang ke khong (method, class, interface, if/switch/catch/return)
    logic_indicators = [
        r"\bclass\s+\w+",
        r"\bpublic\s+(?:async\s+)?[\w<>[\]]+\s+\w+\s*\(",
        r"\bprivate\s+(?:async\s+)?[\w<>[\]]+\s+\w+\s*\(",
        r"\bcatch\s*\(",
        r"\btry\b",
    ]

    has_significant_logic = any(
        any(re.search(pat, line) for pat in logic_indicators)
        for line in added_lines
    )

    if not has_significant_logic:
        return "allow", ""

    # Kiem tra xem co chua log statement trong cac dong them moi khong
    has_logging = any(
        any(re.search(log_pat, line) for log_pat in LOG_PATTERNS)
        for line in added_lines
    )

    if has_logging:
        return "allow", "Xac nhan git diff da chua log statement hop le theo logging-best-practices."

    # Neu co logic moi dang ke nhung thieu hoan toan logging
    reason = (
        "YEU CAU LOGGING-FIRST: Phat hien ma nguon C# moi/sua doi trong 1_Backend hoac 2_Frontend "
        "chua duoc bo sung Structured Logging (_logger.Log... hoac Serilog Log...). "
        "Quy trinh bat buoc: 1. Su dung 'git diff' xac dinh tinh nang dang xay dung; "
        "2. Bo sung Structured Log theo /logging-best-practices; "
        "3. Chay 'dotnet run' de kiem tra log tren Dev Diagnostic Console truoc khi run test."
    )
    return "deny", reason


def main() -> None:
    start = time.perf_counter()
    payload = read_payload()
    root = repo_root()

    command_line = str(payload.args.get("CommandLine", "") or payload.args.get("command", ""))
    decision, reason = check(command_line, root)
    duration_ms = int((time.perf_counter() - start) * 1000)

    log_gate_decision(
        gate_id=GATE_ID,
        rule_id=RULE_ID,
        event_dir=EVENT_DIR,
        hook_event=HOOK_EVENT,
        decision=decision,
        reason=reason,
        target_file="",
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
        reason = f"Gate {GATE_ID} loi noi bo — fail-{FAIL_OPEN_DECISION}: {exc}"
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
