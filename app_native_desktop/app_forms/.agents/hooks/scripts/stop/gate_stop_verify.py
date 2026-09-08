#!/usr/bin/env python3
"""Gate: Stop Verify (Kiem chung co hoc truoc khi ket thuc task).

Kiem tra xem sau lan sua code cuoi cung da thuc hien dotnet build / dotnet test chua.
Neu chua hoac neu build that bai -> continue de ep Agent sua loi bien dich truoc khi dung.
"""

from __future__ import annotations

import os
from pathlib import Path
import subprocess
import sys
import time

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from config.config import load_rules, repo_root
from lib.checks.transcript import last_edit_needs_verify
from lib.hook_contract import HookPayload, emit, emit_allow, read_payload
from lib.logger import log_gate_decision

GATE_ID = "G-STOP-VERIFY"
RULE_ID = "MECHANICAL-VERIFY"
_DEFAULT_VERIFY_PATTERNS = ["dotnet build", "dotnet test", "dotnet run"]


def _run_build_check(root: Path, build_command: str | None = None) -> tuple[bool, str]:
    """Chay truc tiep dotnet build de kiem tra tinh toan ven."""
    csproj_path = root / "AppForms.csproj"
    if not csproj_path.exists():
        return True, "Khong tim thay AppForms.csproj"

    cmd = build_command if build_command else f"dotnet build {csproj_path} -c Debug"
    try:
        if isinstance(cmd, str):
            res = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                cwd=str(root),
                shell=True,
                timeout=45,
            )
        else:
            res = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                cwd=str(root),
                timeout=45,
            )
        if res.returncode == 0:
            return True, "Build thanh cong (0 Errors)."
        else:
            # Trich cac dong loi dau tien de tra ve reason
            errors = [line for line in (res.stdout + res.stderr).splitlines() if ": error " in line]
            err_summary = "; ".join(errors[:3]) if errors else f"Exit code {res.returncode}"
            return False, f"Build that bai: {err_summary}"
    except Exception as e:
        return False, f"Loi thuc thi build command: {e}"


def _log_decision(
    payload: HookPayload | None, decision: str, reason: str, duration_ms: int
) -> None:
    log_gate_decision(
        gate_id=GATE_ID,
        rule_id=RULE_ID,
        event_dir="stop",
        hook_event="Stop",
        decision=decision,
        reason=reason,
        target_file="",
        tool_name="",
        conversation_id=getattr(payload, "conversation_id", "") if payload else "",
        step_idx=getattr(payload, "step_idx", -1) if payload else -1,
        duration_ms=duration_ms,
    )


def main() -> None:
    start = time.perf_counter()
    payload = read_payload()
    rules = load_rules()
    root = repo_root()

    # Tuong thich verify.verify_patterns, verify_patterns, hoac default
    verify_section = rules.get("verify", {}) if isinstance(rules.get("verify"), dict) else {}
    raw_patterns = (
        verify_section.get("verify_patterns")
        or rules.get("verify_patterns")
        or _DEFAULT_VERIFY_PATTERNS
    )
    if isinstance(raw_patterns, list):
        verify_patterns = [str(p) for p in raw_patterns]
    else:
        verify_patterns = list(_DEFAULT_VERIFY_PATTERNS)

    build_command = verify_section.get("build_command") or rules.get("build_command")

    result = last_edit_needs_verify(payload.transcript_path, verify_patterns)

    if result["needs_verify"]:
        # Chay fallback build check ngay lap tuc
        build_ok, build_msg = _run_build_check(root, build_command)
        if not build_ok:
            decision = "continue"
            reason = f"Phat hien ma nguon chua build hoac build loi: {build_msg}. Yeu cau fix truoc khi hoan tat."
        else:
            decision = "allow"
            reason = f"Verified co hoc tu dong: {build_msg}"
    else:
        decision = "allow"
        reason = "Transcript xac nhan da build/verify sau lan sua cuoi."

    duration_ms = int((time.perf_counter() - start) * 1000)
    _log_decision(payload, decision, reason, duration_ms)

    if decision == "continue":
        emit("continue", reason)
    else:
        emit_allow(reason)


if __name__ == "__main__":
    _start = time.perf_counter()
    try:
        main()
    except Exception as exc:
        try:
            payload = read_payload()
        except Exception as payload_err:
            sys.stderr.write(f"[WARN] Khong the doc payload trong gate exception handler: {payload_err}\n")
            payload = None
        duration_ms = int((time.perf_counter() - _start) * 1000)
        reason = f"Gate {GATE_ID} loi — fail-open: {exc}"
        _log_decision(payload, "allow", reason, duration_ms)
        emit_allow(reason)

