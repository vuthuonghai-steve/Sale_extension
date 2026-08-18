#!/usr/bin/env python3
"""Gate: Architecture Boundaries Check (PreToolUse).

Kiem tra ranh gioi phan tang kien truc 3 lop:
- 1_Backend/ khong duoc import System.Windows.Forms hoac AppForms.Frontend
- 0_Shared/ khong duoc import Backend, Frontend hoac System.Windows.Forms
"""

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

GATE_ID = "G-ARCH-BOUNDARY"
RULE_ID = "CLEAN-LAYERED-BOUNDARIES"
EVENT_DIR = "pre_tool_use"
HOOK_EVENT = "PreToolUse"
FAIL_OPEN_DECISION = "allow"


def _string_values(node: object) -> list[str]:
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


def collect_contents(args: dict, target_file: str) -> str:
    parts: list[str] = []
    code = args.get("CodeContent")
    if isinstance(code, str):
        parts.append(code)
    replacement = args.get("ReplacementContent")
    if isinstance(replacement, str):
        parts.append(replacement)
    chunks = args.get("ReplacementChunks")
    if isinstance(chunks, list):
        parts.extend(_string_values(chunks))

    if not parts and target_file and os.path.exists(target_file):
        try:
            with open(target_file, "r", encoding="utf-8", errors="ignore") as f:
                parts.append(f.read())
        except Exception:
            pass

    return "\n".join(parts)


def check(target_file: str, args: dict, rules: dict) -> tuple[str, str]:
    target_lower = target_file.lower().replace("\\", "/")
    if not target_lower.endswith(".cs"):
        return "allow", ""

    content = collect_contents(args, target_file)
    using_matches = re.findall(r"^\s*using\s+([^;]+);", content, re.MULTILINE)
    imports = [m.strip() for m in using_matches]

    violations: list[str] = []

    # Kiem tra tang 1_Backend
    if "1_backend" in target_lower:
        for imp in imports:
            if imp == "System.Windows.Forms" or imp.startswith("System.Windows.Forms.") or imp.startswith("AppForms.Frontend"):
                violations.append(f"Backend import '{imp}' (Backend tuyet doi khong duoc phu thuoc WinForms UI / Frontend).")

    # Kiem tra tang 0_Shared
    if "0_shared" in target_lower:
        for imp in imports:
            if (
                imp == "System.Windows.Forms"
                or imp.startswith("System.Windows.Forms.")
                or imp.startswith("AppForms.Frontend")
                or imp.startswith("AppForms.Backend")
            ):
                violations.append(f"Shared import '{imp}' (Shared chi chua pure data/types, khong phu thuoc Backend/Frontend).")

    if violations:
        reason = "Vi pham ranh gioi kien truc phan tang: " + "; ".join(violations)
        return "deny", reason

    return "allow", ""


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
